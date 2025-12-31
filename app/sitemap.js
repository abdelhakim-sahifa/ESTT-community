import { db as staticDb } from '@/lib/data';

export default async function sitemap() {
    const baseUrl = 'https://estt-community.vercel.app';
    const currentDate = new Date().toISOString();

    const staticRoutes = [
        {
            url: `${baseUrl}`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contribute`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/clubs`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/conditions-d-utilisation`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/politique-de-confidentialite`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    const fieldRoutes = staticDb.fields.map((field) => ({
        url: `${baseUrl}/browse?field=${encodeURIComponent(field.id)}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const moduleRoutes = [];
    Object.entries(staticDb.modules).forEach(([key, modules]) => {
        const [field, semester] = key.split('-');
        modules.forEach((module) => {
            const url = `${baseUrl}/browse?field=${encodeURIComponent(field)}&semester=${encodeURIComponent(semester)}&module=${encodeURIComponent(module.id)}`;
            moduleRoutes.push({
                url: url,
                lastModified: currentDate,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        });
    });

    let clubRoutes = [];
    try {
        const { db: firebaseDb, ref, get } = await import('@/lib/firebase');

        if (firebaseDb) {
            const clubsRef = ref(firebaseDb, 'clubs');
            const clubsSnap = await get(clubsRef);

            if (clubsSnap.exists()) {
                const clubsData = clubsSnap.val();
                clubRoutes = Object.entries(clubsData)
                    .filter(([_, club]) => club?.verified === true)
                    .map(([id, club]) => {
                        let lastMod = currentDate;

                        if (club.createdAt) {
                            try {
                                const parsedDate = new Date(club.createdAt);
                                if (!isNaN(parsedDate.getTime())) {
                                    lastMod = parsedDate.toISOString();
                                }
                            } catch (e) {
                                // Use current date if parsing fails
                            }
                        }

                        return {
                            url: `${baseUrl}/clubs/${encodeURIComponent(id)}`,
                            lastModified: lastMod,
                            changeFrequency: 'weekly',
                            priority: 0.9,
                        };
                    });
            }
        }
    } catch (error) {
        console.error('Error fetching clubs for sitemap:', error);
    }

    return [
        ...staticRoutes,
        ...fieldRoutes,
        ...moduleRoutes,
        ...clubRoutes,
    ];
}