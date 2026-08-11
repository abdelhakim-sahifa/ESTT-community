import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { to, subject, html, replyTo, from, provider } = body;

        console.log(`\n📨 [POST /api/send-email] Incoming email request received:`);
        console.log(`   - Recipient: ${to}`);
        console.log(`   - Subject: ${subject}`);

        if (!to || !subject || !html) {
            console.warn(`⚠️ [POST /api/send-email] Missing fields in payload:`, { to: !!to, subject: !!subject, html: !!html });
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            );
        }

        const result = await sendEmail({ to, subject, html, replyTo, from, provider });

        console.log(`✅ [POST /api/send-email] Successfully processed. Provider: ${result.provider}, Message ID: ${result.messageId}`);

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            provider: result.provider,
        });
    } catch (error) {
        console.error('❌ [POST /api/send-email] Execution Exception:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }

        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
