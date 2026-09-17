import { NextResponse } from 'next/server';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function POST(req) {
    try {
        const { userName, userEmail, userUid, title, moduleName, fullModuleName, authorName } = await req.json();

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const errors = [];

        // 1. Send email to user
        if (userEmail) {
            try {
                const { resourceReceivedEmail } = await import('@/lib/email-templates');
                const html = resourceReceivedEmail(userName || 'Étudiant', title);
                await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: userEmail, subject: 'Contribution reçue', html })
                });
            } catch (err) {
                console.error('Contribute notify: failed to send user email:', err.message);
                errors.push('user_email');
            }
        }

        // 2. Send email to admin
        try {
            let sendAdminEmail = true;
            let adminEmail = 'thevcercle@gmail.com';

            if (db) {
                const settingsSnap = await get(ref(db, 'adminSettings/notifications'));
                if (settingsSnap.exists()) {
                    const settings = settingsSnap.val();
                    sendAdminEmail = settings.enabled !== false;
                    if (settings.email) adminEmail = settings.email;
                }
            }

            if (sendAdminEmail) {
                const { adminNotificationEmail } = await import('@/lib/email-templates');
                const adminHtml = adminNotificationEmail(
                    'Admin',
                    'Nouvelle Ressource (Drive)',
                    `Une nouvelle ressource "<strong>${title}</strong>" a été soumise pour le module ${moduleName} par ${authorName}.`,
                    `${baseUrl}/admin`
                );
                await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: adminEmail, subject: 'Action requise : Nouvelle ressource soumise (Drive)', html: adminHtml })
                });
            }
        } catch (err) {
            console.error('Contribute notify: failed to send admin email:', err.message);
            errors.push('admin_email');
        }

        // 3. Slack notification
        try {
            await fetch(`${baseUrl}/api/slack/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'admin',
                    title: '📚 Nouvelle Contribution',
                    message: `Une nouvelle ressource a été soumise pour le module *${fullModuleName || moduleName}*.`,
                    user: { name: authorName, email: userEmail || 'N/A', uid: userUid || 'N/A' },
                    resource: { title, type: 'resource' }
                })
            });
        } catch (err) {
            console.error('Contribute notify: failed to send Slack:', err.message);
            errors.push('slack');
        }

        return NextResponse.json({ success: true, errors: errors.length > 0 ? errors : undefined });
    } catch (error) {
        console.error('Contribute notify route error:', error);
        return NextResponse.json({ success: true });
    }
}
