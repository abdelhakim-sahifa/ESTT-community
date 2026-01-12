
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
    try {
        const { ticketId, clubId, eventId, price, eventName, userEmail } = await req.json();

        if (!ticketId || !price || !eventName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mad',
                        product_data: {
                            name: `Billet: ${eventName}`,
                        },
                        unit_amount: price * 100, // Stripe expects amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.nextUrl.origin}/tickets/${ticketId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${req.nextUrl.origin}/clubs/${clubId}/events/${eventId}/registration?canceled=true`,
            customer_email: userEmail,
            metadata: {
                ticketId,
                clubId,
                eventId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error.message },
            { status: 500 }
        );
    }
}
