import { NextResponse } from 'next/server';
import { db, ref, get, update } from '@/lib/firebase';

/**
 * POST /api/export-data/verify
 * Body: { token: string }
 *
 * Validates a one-time export token:
 *   - Must exist in Firebase dataExports/{token}
 *   - Must not be expired  (expiresAt > now)
 *   - Must not be already used
 *
 * If valid → marks used immediately (one-time guarantee) and returns the uid.
 * If invalid → returns an error with a user-facing reason.
 */
export async function POST(req) {
    try {
        const { token } = await req.json();

        if (!token || typeof token !== 'string' || token.length < 32) {
            return NextResponse.json(
                { valid: false, reason: 'Token invalide.' },
                { status: 400 }
            );
        }

        // ── Read token record ─────────────────────────────────────────────
        const snap = await get(ref(db, `dataExports/${token}`));

        if (!snap.exists()) {
            return NextResponse.json(
                { valid: false, reason: 'Ce lien est invalide ou n\'existe pas.' },
                { status: 404 }
            );
        }

        const record = snap.val();

        // ── Expiry check ──────────────────────────────────────────────────
        if (Date.now() > record.expiresAt) {
            return NextResponse.json(
                { valid: false, reason: 'Ce lien a expiré (validité 24h). Veuillez en générer un nouveau depuis vos paramètres.' },
                { status: 410 }
            );
        }

        // ── One-time check ────────────────────────────────────────────────
        if (record.used) {
            return NextResponse.json(
                { valid: false, reason: 'Ce lien a déjà été utilisé. Pour des raisons de sécurité, chaque lien ne peut être utilisé qu\'une seule fois.' },
                { status: 409 }
            );
        }

        // ── Atomically mark as used before returning ──────────────────────
        await update(ref(db, `dataExports/${token}`), {
            used:   true,
            usedAt: Date.now(),
        });

        return NextResponse.json({
            valid:     true,
            uid:       record.uid,
            firstName: record.firstName,
            email:     record.email,
            username:  record.username,
        });

    } catch (error) {
        console.error('[export-data/verify] Error:', error);
        return NextResponse.json(
            { valid: false, reason: 'Erreur serveur. Veuillez réessayer.' },
            { status: 500 }
        );
    }
}
