import { db as firebaseDB, ref as fbRef, get } from './firebase-config.js';

// Start with empty DB — we will populate from Realtime Database only
export let db = {};

// Listen to Firebase Realtime Database root and update `db` when data changes.
// Parameters:
// - onDataUpdate(snapshotValue): called every time we receive a snapshot (after assigning to `db`).
// - onLoading(isLoading): optional, called with true before first load, and false after first successful load.
export function initFirebase(onDataUpdate, onLoading) {
    try {
        if (onLoading) onLoading(true);

        // One-time fetch of the whole DB on load (no realtime listener)
        get(fbRef(firebaseDB, '/'))
            .then((snapshot) => {
                try {
                    const val = snapshot.val() || {};
                    db = val;
                    if (onDataUpdate) onDataUpdate();
                } catch (e) {
                    console.error('Error processing Firebase snapshot:', e);
                }
            })
            .catch((err) => {
                console.warn('Firebase get() error:', err && err.code ? `${err.code} ${err.message}` : err);
            })
            .finally(() => {
                if (onLoading) onLoading(false);
            });

    } catch (e) {
        console.error('Error fetching Firebase data', e);
        if (onLoading) onLoading(false);
    }
}

export function updateActiveLink(pageName) {
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        // Check if href matches the pageName (e.g. "index.html" or "contribute.html")
        if (link.getAttribute('href').includes(pageName)) {
            link.classList.add('active');
        }
    });
}
