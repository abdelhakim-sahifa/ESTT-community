import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Returns current level (1 for S1/S2, 2 for S3/S4) based on startYear and July 1st reset.
 */
export function getUserLevel(startYear) {
    if (!startYear) return 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const isAfterJuly1st = now.getMonth() >= 6; // July is index 6

    const yearDiff = currentYear - parseInt(startYear);

    if (yearDiff === 0) return 1;
    if (yearDiff === 1) return isAfterJuly1st ? 2 : 1;
    return 2; // Year 2+
}


export function getAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const isAfterJuly1st = now.getMonth() >= 6;
    return isAfterJuly1st ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export async function resolveUidFromIdentifier(db, ref, get, identifier) {
    if (!identifier) return null;

    // Decode in case Next.js passes a URL-encoded segment (e.g. %40username → @username)
    const decoded = decodeURIComponent(identifier);

    if (!decoded.startsWith('@')) {
        // Treat as a raw Firebase UID
        return decoded;
    }

    const username = decoded.substring(1).toLowerCase();
    try {
        const usersRef = ref(db, 'users');
        const snap = await get(usersRef);
        if (snap.exists()) {
            const users = snap.val();
            const entry = Object.entries(users).find(([, u]) => {
                if (!u.email) return false;
                return u.email.split('@')[0].toLowerCase() === username;
            });
            if (entry) {
                return entry[0];
            }
        }
    } catch (err) {
        console.error("Error in resolveUidFromIdentifier:", err);
    }
    return null;
}

