
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'estt.community@gmail.com',
                pass: 'akhe qiyr tkbv zwpd',
            },
        });

        const mailOptions = {
            from: `"ESTT Community" <estt.community@gmail.com>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
