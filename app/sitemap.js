// This will be called at build time or on-demand in production
export default async function sitemap() {
    const baseUrl = 'https://estt-community.vercel.app';

    // Static routes
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/clubs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    // Fetch clubs from Firebase (if available)
    let clubRoutes = [];
    try {
        // Dynamic import to avoid issues if firebase is not initialized
        const { db: firebaseDb, ref, get } = await import('@/lib/firebase');

        if (firebaseDb) {
            const clubsRef = ref(firebaseDb, 'clubs');
            const clubsSnap = await get(clubsRef);

            if (clubsSnap.exists()) {
                const clubsData = clubsSnap.val();
                clubRoutes = Object.entries(clubsData)
                    .filter(([_, club]) => club.verified)
                    .map(([id, club]) => ({
                        url: `${baseUrl}/clubs/${id}`,
                        lastModified: new Date(club.createdAt || Date.now()),
                        changeFrequency: 'weekly',
                        priority: 0.9,
                    }));
            }
        }
    } catch (error) {
        console.error('Error fetching clubs for sitemap:', error);
    }

    return [
        ...staticRoutes,
        ...clubRoutes,
    ];
}