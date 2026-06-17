import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db, ref, set } from '@/lib/firebase';
import { dataExportEmail } from '@/lib/email-templates/data-export';
import { fetchScreenshot } from '@/lib/screenshotUtils';
import { uploadToImgBB } from '@/lib/uploadUtils';

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

        // ── 4. Resilient Profile Screenshot Generation & Upload ───────────
        let screenshotUrl = null;
        try {
            const profileUrl = `${baseUrl}/profile/@${username || uid}`;
            console.log(`[export-data] Capturing profile screenshot for: ${profileUrl}`);
            
            const blob = await fetchScreenshot(profileUrl, {
                format: 'png',
                width: 1280,
                height: 960,
                fullPage: true,
                delay: 1500
            });

            // Convert to base64 for ImgBB upload
            const buffer = Buffer.from(await blob.arrayBuffer());
            const base64 = buffer.toString('base64');

            screenshotUrl = await uploadToImgBB(base64);
            console.log(`[export-data] Screenshot successfully uploaded to ImgBB: ${screenshotUrl}`);
        } catch (screenshotErr) {
            console.error('[export-data] Resilient screenshot upload failed:', screenshotErr);
            // We proceed with email delivery even if screenshot generation fails
        }

        // ── 5. Send email ─────────────────────────────────────────────────
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
            screenshotUrl,
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

