
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
    try {
        const body = await req.json();
        const { type = 'ticket', price, userEmail } = body;

        let sessionConfig = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mad',
                        product_data: {},
                        unit_amount: price * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: userEmail,
            metadata: { type },
        };

        if (type === 'ad') {
            const { adId, adTitle } = body;
            if (!adId || !price || !adTitle) {
                return NextResponse.json({ error: 'Missing ad details' }, { status: 400 });
            }
            sessionConfig.line_items[0].price_data.product_data.name = `Publicité ESTT: ${adTitle}`;
            sessionConfig.success_url = `${req.nextUrl.origin}/ads-portal/dashboard?success=true`;
            sessionConfig.cancel_url = `${req.nextUrl.origin}/ads-portal/dashboard?canceled=true`;
            sessionConfig.metadata.adId = adId;
        } else {
            // Default to Ticket
            const { ticketId, clubId, eventId, eventName } = body;
            if (!ticketId || !price || !eventName) {
                return NextResponse.json({ error: 'Missing ticket details' }, { status: 400 });
            }
            sessionConfig.line_items[0].price_data.product_data.name = `Billet: ${eventName}`;
            sessionConfig.success_url = `${req.nextUrl.origin}/tickets/${ticketId}?session_id={CHECKOUT_SESSION_ID}&success=true`;
            sessionConfig.cancel_url = `${req.nextUrl.origin}/clubs/${clubId}/events/${eventId}/registration?canceled=true`;
            sessionConfig.metadata = { ...sessionConfig.metadata, ticketId, clubId, eventId };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error.message },
            { status: 500 }
        );
    }
}
