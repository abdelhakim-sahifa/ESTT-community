import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db, ref, set } from '@/lib/firebase';
import { dataExportEmail } from '@/lib/email-templates/data-export';

export async function POST(req) {
    try {
        const { uid, firstName, email, username } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
        }

        // ── 1. Generate a cryptographically secure one-time token ─────────
        const token     = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // ── 2. Persist token in Firebase ──────────────────────────────────
        await set(ref(db, `dataExports/${token}`), {
            uid,
            email,
            firstName: firstName || 'Utilisateur',
            username:  username  || uid,
            createdAt: Date.now(),
            expiresAt,
            used: false,
        });

        // ── 3. Build download URL ─────────────────────────────────────────
        const baseUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://estt.ma';
        const downloadUrl = `${baseUrl}/download-export/${token}`;

        const exportDate = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        // ── 4. Send email ─────────────────────────────────────────────────
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'estt.community@gmail.com',
                pass: 'akhe qiyr tkbv zwpd',
            },
        });

        const html = dataExportEmail({
            firstName: firstName || 'Utilisateur',
            email,
            downloadUrl,
            exportDate,
        });

        await transporter.sendMail({
            from:    '"ESTT Community" <estt.community@gmail.com>',
            to:      email,
            subject: '📦 Votre export de données personnelles est prêt',
            html,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[export-data] Error:', error);
        return NextResponse.json(
            { error: 'Export failed', details: error.message },
            { status: 500 }
        );
    }
}
