'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function DeepLinkPage() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Checking device...');

    useEffect(() => {
        // 1. Construct the App URI
        const pathParts = pathname.replace(/^\/deeplink\//, '');
        const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const appUri = `esttplus://${pathParts}${queryString}`;

        // 2. Platform Detection
        const userAgent = typeof window !== 'undefined' ? (navigator.userAgent || navigator.vendor || window.opera) : '';
        const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

        if (isMobile) {
            setStatus('Opening App...');
            window.location.href = appUri;
        } else {
            setStatus('Please open this link on your mobile phone to access the app.');
        }
    }, [pathname, searchParams]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h2>ESTT Community</h2>
            <p style={{ color: '#666', maxWidth: '300px' }}>{status}</p>

            <div style={{ marginTop: '20px' }}>
                <a
                    href={`esttplus://${pathname.replace(/^\/deeplink\//, '')}${searchParams.toString() ? '?' + searchParams.toString() : ''}`}
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    Open App
                </a>
            </div>
            <div style={{ marginTop: '20px' }}>
                <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>
                    Back to Website
                </a>
            </div>
        </div>
    );
}
