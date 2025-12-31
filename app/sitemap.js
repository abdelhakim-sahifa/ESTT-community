import { db as staticDb } from '@/lib/data';

// This should be in app/sitemap.js or app/sitemap.ts
export default async function sitemap() {
    const baseUrl = 'https://estt-community.vercel.app';

    // Static routes
    const staticRoutes = [
        {
            url: `${baseUrl}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contribute`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/clubs`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/conditions-d-utilisation`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/politique-de-confidentialite`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Generate URLs for all fields
    const fieldRoutes = staticDb.fields.map((field) => ({
        url: `${baseUrl}/browse?field=${encodeURIComponent(field.id)}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    // Generate URLs for all modules
    const moduleRoutes = [];
    Object.entries(staticDb.modules).forEach(([key, modules]) => {
        const [field, semester] = key.split('-');
        modules.forEach((module) => {
            // Properly encode each parameter
            const url = `${baseUrl}/browse?field=${encodeURIComponent(field)}&semester=${encodeURIComponent(semester)}&module=${encodeURIComponent(module.id)}`;
            moduleRoutes.push({
                url: url,
                lastModified: new Date().toISOString(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        });
    });

    // Fetch clubs from Firebase (if available)
    let clubRoutes = [];
    try {
        const { db: firebaseDb, ref, get } = await import('@/lib/firebase');

        if (firebaseDb) {
            const clubsRef = ref(firebaseDb, 'clubs');
            const clubsSnap = await get(clubsRef);

            if (clubsSnap.exists()) {
                const clubsData = clubsSnap.val();
                clubRoutes = Object.entries(clubsData)
                    .filter(([_, club]) => club?.verified)
                    .map(([id, club]) => ({
                        url: `${baseUrl}/clubs/${encodeURIComponent(id)}`,
                        lastModified: club.createdAt
                            ? new Date(club.createdAt).toISOString()
                            : new Date().toISOString(),
                        changeFrequency: 'weekly',
                        priority: 0.9,
                    }));
            }
        }
    } catch (error) {
        console.error('Error fetching clubs for sitemap:', error);
        // Continue without clubs if there's an error
    }

    return [
        ...staticRoutes,
        ...fieldRoutes,
        ...moduleRoutes,
        ...clubRoutes,
    ];
}