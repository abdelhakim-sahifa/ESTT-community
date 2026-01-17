
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db, ref, update, get } from '@/lib/firebase';

// Stripe Webhook Secret (needs to be configured in dashboard, but we'll try to handle it gracefully for dev)
const webhookSecret = ''; // In dev/sandbox without CLI, we might bypass verification if secret is empty

export async function POST(req) {
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;

    try {
        if (webhookSecret && sig) {
            event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
        } else {
            // For sandbox/dev without webhook secret configured yet, we parse directly
            // WARNING: In production, signature verification is REQUIRED.
            event = JSON.parse(payload);
        }
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { type = 'ticket' } = session.metadata;

        try {
            if (type === 'ad') {
                const { adId } = session.metadata;
                const adRef = ref(db, `studentAds/${adId}`);
                const adSnap = await get(adRef);

                if (adSnap.exists()) {
                    const adData = adSnap.val();

                    // Only update if not already live
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
                            stripeSessionId: session.id,
                            updatedAt: Date.now()
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
                                    html: html
                                })
                            });
                        } catch (emailErr) {
                            console.error("Ad webhook email error:", emailErr);
                        }
                    }
                }
                console.log(`Ad ${adId} activated successfully via Webhook.`);
            } else {
                // TICKET LOGIC (Original)
                const { ticketId, clubId, eventId } = session.metadata;
                const ticketRef = ref(db, `tickets/${ticketId}`);

                // Check if already valid to avoid double counting
                const currentTicket = await get(ticketRef);
                if (currentTicket.exists() && currentTicket.val().status === 'valid') {
                    return NextResponse.json({ received: true, already_processed: true });
                }

                await update(ticketRef, {
                    status: 'valid',
                    paid: true,
                    stripeSessionId: session.id,
                    updatedAt: Date.now()
                });

                // 2. Update Registration Count
                const eventRef = ref(db, `clubs/${clubId}/events/${eventId}`);
                const { increment } = await import('@/lib/firebase');
                await update(eventRef, {
                    registrationCount: increment(1)
                });

                // 3. Fetch Ticket details for email
                const ticketSnap = await get(ticketRef);
                if (ticketSnap.exists()) {
                    const ticketData = ticketSnap.val();

                    // 3. Send Confirmation Email (Validated)
                    try {
                        const { ticketValidatedEmail } = await import('@/lib/email-templates');
                        const html = ticketValidatedEmail(ticketData, ticketData.eventName, ticketData.clubName);

                        await fetch(`${req.nextUrl.origin}/api/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: ticketData.userEmail,
                                subject: `Billet Validé : ${ticketData.eventName}`,
                                html: html
                            })
                        });
                    } catch (emailErr) {
                        console.error("Webhook email sending failed:", emailErr);
                    }
                }
                console.log(`Ticket ${ticketId} validated successfully via Webhook.`);
            }
        } catch (dbErr) {
            console.error('Webhook Database Error:', dbErr);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
