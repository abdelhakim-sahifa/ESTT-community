import { db as staticDb } from '@/lib/data';

// This should be in app/sitemap.js or app/sitemap.ts
export default async function sitemap() {
    const baseUrl = 'https://estt-community.vercel.app';

    // Static routes
    const staticRoutes = [
        '',
        '/browse',
        '/contribute',
        '/clubs',
        '/search',
        '/conditions-d-utilisation',
        '/politique-de-confidentialite',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    // Generate URLs for all modules
    const moduleRoutes = [];
    Object.entries(staticDb.modules).forEach(([key, modules]) => {
        const [field, semester] = key.split('-');
        modules.forEach((module) => {
            const params = new URLSearchParams({
                field: field,
                semester: semester,
                module: module.id
            });
            moduleRoutes.push({
                url: `${baseUrl}/browse?${params.toString()}`,
                lastModified: new Date().toISOString(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        });
    });

    // Generate URLs for all fields
    const fieldRoutes = staticDb.fields.map((field) => ({
        url: `${baseUrl}/browse?field=${field.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

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
                    .filter(([_, club]) => club.verified)
                    .map(([id, club]) => ({
                        url: `${baseUrl}/clubs/${id}`,
                        lastModified: new Date(club.createdAt || Date.now()).toISOString(),
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
        ...fieldRoutes,
        ...moduleRoutes,
        ...clubRoutes,
    ];
}