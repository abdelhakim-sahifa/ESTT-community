'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function DeepLinkPage() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // 1. Construct the App URI and Web Target
        const pathParts = pathname.replace(/^\/deeplink\//, '');
        const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

        const appUri = `esttplus://${pathParts}${queryString}`;
        const webTarget = `/${pathParts}${queryString}`;

        // 2. Platform Detection
        const userAgent = typeof window !== 'undefined' ? (navigator.userAgent || navigator.vendor || window.opera) : '';
        const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

        if (isMobile) {
            // 3. Try to open the app
            window.location.href = appUri;

            // 4. After a very short delay, redirect the browser to the web version
            // This ensures the user sees the web content if the app doesn't open
            const timer = setTimeout(() => {
                router.replace(webTarget);
            }, 500);

            return () => clearTimeout(timer);
        } else {
            // On desktop, just go straight to the web version
            router.replace(webTarget);
        }
    }, [pathname, searchParams, router]);

    // We show a minimal loader for the brief period before redirection
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            color: '#64748b'
        }}>
            <div className="animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                marginBottom: '20px'
            }}></div>
            <p>Chargement...</p>
        </div>
    );
}
