
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db, ref, update, get } from '@/lib/firebase';

/**
 * Verify the LemonSqueezy webhook signature.
 * Uses HMAC-SHA256 with the LEMONSQUEEZY_WEBHOOK_SECRET.
 */
function verifySignature(rawBody, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const sigBuffer = Buffer.from(signature, 'hex');

    if (digest.length !== sigBuffer.length) return false;
    return crypto.timingSafeEqual(digest, sigBuffer);
}

export async function POST(req) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // --- Signature Verification ---
    if (!secret) {
        console.warn('⚠️  LEMONSQUEEZY_WEBHOOK_SECRET is not set — skipping verification (dev only).');
    } else if (!signature || !verifySignature(rawBody, signature, secret)) {
        console.error('LemonSqueezy Webhook: Invalid signature.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event;
    try {
        event = JSON.parse(rawBody);
    } catch (err) {
        console.error('LemonSqueezy Webhook: Failed to parse body.', err.message);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const eventName = event?.meta?.event_name;
    const customData = event?.meta?.custom_data || {};
    const orderData = event?.data?.attributes;

    // We only care about completed orders
    if (eventName !== 'order_created') {
        return NextResponse.json({ received: true, skipped: true });
    }

    // Only process orders that are actually paid
    if (orderData?.status !== 'paid') {
        console.log(`LemonSqueezy order received but status is "${orderData?.status}" — skipping.`);
        return NextResponse.json({ received: true, skipped: true });
    }

    const { type = 'ticket' } = customData;
    const lsOrderId = event?.data?.id;

    try {
        if (type === 'ad') {
            // --- Ad Payment ---
            const { adId } = customData;
            const adRef = ref(db, `studentAds/${adId}`);
            const adSnap = await get(adRef);

            if (adSnap.exists()) {
                const adData = adSnap.val();

                if (adData.status !== 'live') {
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + (adData.duration || 30));
                    const invoiceId = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

                    await update(adRef, {
                        status: 'live',
                        paymentStatus: 'paid',
                        paymentDate: new Date().toISOString(),
                        expirationDate: expirationDate.toISOString(),
                        invoiceId: invoiceId,
                        lsOrderId: lsOrderId,
                        updatedAt: Date.now(),
                    });

                    // Send Invoice/Confirmation Email
                    try {
                        const { adInvoiceEmail } = await import('@/lib/email-templates');
                        const html = adInvoiceEmail(adData.title, adData.price, invoiceId);

                        await fetch(`${req.nextUrl.origin}/api/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: adData.publisherEmail,
                                subject: `Confirmation & Facture : ${adData.title}`,
                                html: html,
                            }),
                        });
                    } catch (emailErr) {
                        console.error('Ad webhook email error:', emailErr);
                    }

                    // Notify Slack Finance
                    try {
                        const { notifySlack, SLACK_CHANNELS } = await import('@/lib/slack');
                        await notifySlack(SLACK_CHANNELS.FINANCE, {
                            title: '💰 Nouveau Revenu Publicitaire',
                            message: `Une publicité "*${adData.title}*" vient d'être payée et activée.`,
                            user: {
                                name: adData.publisherName || 'Annonceur',
                                email: adData.publisherEmail || 'N/A',
                            },
                            resource: { title: adData.title, type: 'ad', id: adId },
                        });
                    } catch (slackErr) {
                        console.error('Slack finance notification failed (ad):', slackErr);
                    }
                }
            }
            console.log(`✅ Ad ${adId} activated via LemonSqueezy webhook.`);
        } else {
            // --- Ticket Payment ---
            const { ticketId, clubId, eventId } = customData;
            const ticketRef = ref(db, `tickets/${ticketId}`);

            // Idempotency: skip if already validated
            const currentTicket = await get(ticketRef);
            if (currentTicket.exists() && currentTicket.val().status === 'valid') {
                return NextResponse.json({ received: true, already_processed: true });
            }

            await update(ticketRef, {
                status: 'valid',
                paid: true,
                lsOrderId: lsOrderId,
                updatedAt: Date.now(),
            });

            // Update Registration Count
            const eventRef = ref(db, `clubs/${clubId}/events/${eventId}`);
            const { increment } = await import('@/lib/firebase');
            await update(eventRef, { registrationCount: increment(1) });

            // Fetch ticket for email
            const ticketSnap = await get(ticketRef);
            if (ticketSnap.exists()) {
                const ticketData = ticketSnap.val();

                // Send Confirmation Email
                try {
                    const { ticketValidatedEmail } = await import('@/lib/email-templates');
                    const html = ticketValidatedEmail(ticketData, ticketData.eventName, ticketData.clubName);

                    await fetch(`${req.nextUrl.origin}/api/send-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: ticketData.userEmail,
                            subject: `Billet Validé : ${ticketData.eventName}`,
                            html: html,
                        }),
                    });
                } catch (emailErr) {
                    console.error('Webhook email sending failed:', emailErr);
                }

                // Notify Slack Finance
                try {
                    const { notifySlack, SLACK_CHANNELS } = await import('@/lib/slack');
                    await notifySlack(SLACK_CHANNELS.FINANCE, {
                        title: '🎫 Vente de Billet',
                        message: `Un billet pour l'événement "*${ticketData.eventName}*" (${ticketData.clubName}) a été acheté.`,
                        user: { name: ticketData.userName, email: ticketData.userEmail },
                        resource: { title: ticketData.eventName, type: 'ticket', id: ticketId },
                    });
                } catch (slackErr) {
                    console.error('Slack finance notification failed (ticket):', slackErr);
                }
            }
            console.log(`✅ Ticket ${ticketId} validated via LemonSqueezy webhook.`);
        }
    } catch (dbErr) {
        console.error('Webhook Database Error:', dbErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
