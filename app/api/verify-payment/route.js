
import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/lemonsqueezy';
import { db, ref, update, get, increment } from '@/lib/firebase';

export async function POST(req) {
    try {
        const { ticketId, orderId } = await req.json();

        if (!ticketId || !orderId) {
            return NextResponse.json({ error: 'Missing ticketId or orderId' }, { status: 400 });
        }

        // 1. Retrieve the order from LemonSqueezy
        const order = await getOrder(orderId);

        if (order?.attributes?.status === 'paid') {
            const ticketRef = ref(db, `tickets/${ticketId}`);
            const ticketSnap = await get(ticketRef);

            if (ticketSnap.exists()) {
                const ticketData = ticketSnap.val();

                // 2. Only update if not already valid (idempotency guard)
                if (ticketData.status !== 'valid') {
                    await update(ticketRef, {
                        status: 'valid',
                        paid: true,
                        lsOrderId: orderId,
                        updatedAt: Date.now(),
                    });

                    // 3. Update registration count for the event
                    const eventRef = ref(db, `clubs/${ticketData.clubId}/events/${ticketData.eventId}`);
                    await update(eventRef, {
                        registrationCount: increment(1),
                    });

                    // 4. Send confirmation email (fallback, in case webhook was delayed)
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
                        console.error('Verification email sending failed:', emailErr);
                    }

                    return NextResponse.json({ success: true, status: 'validated' });
                }

                return NextResponse.json({ success: true, status: 'already_valid' });
            }

            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({ success: false, status: order?.attributes?.status ?? 'unknown' });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}

