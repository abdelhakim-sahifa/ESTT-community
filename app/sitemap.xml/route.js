export async function GET(request) {
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
            url: `${baseUrl}/conditions-d-utilisation`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/politique-de-confidentialite`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

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
                        lastModified: new Date(club.createdAt || Date.now()),
                        changeFrequency: 'weekly',
                        priority: 0.9,
                    }));
            }
        }
    } catch (error) {
        console.error('Error fetching clubs for sitemap:', error);
    }

    const allRoutes = [...staticRoutes, ...clubRoutes];

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
    .map(
        (route) => `  <url>
    <loc>${escapeXml(route.url)}</loc>
    <lastmod>${route.lastModified.toISOString()}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case "'":
                return '&apos;';
            case '"':
                return '&quot;';
        }
    });
}
