import { db, ref, get, update, increment } from '@/lib/firebase';
import { redirect, notFound } from 'next/navigation';

export default async function ShortUrlRedirect({ params }) {
    const { id } = params;

    if (!id) {
        notFound();
    }

    try {
        const urlRef = ref(db, `shortUrls/${id}`);
        const snapshot = await get(urlRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            const originalUrl = data.originalUrl;

            // Increment clicks (fire and forget for now, but in server context it might wait)
            // Note: In a production app, you might want to wait or use a more robust tracking system
            update(urlRef, {
                clicks: increment(1)
            });

            // Redirect to original URL
            redirect(originalUrl);
        } else {
            notFound();
        }
    } catch (error) {
        console.error('Redirection error:', error);
        // If redirect fails because it was already called, ignore
        if (error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        notFound();
    }

    return null;
}
