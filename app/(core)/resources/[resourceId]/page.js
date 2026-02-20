'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ResourceRedirect() {
    const router = useRouter();
    const params = useParams();
    const { resourceId } = params;

    useEffect(() => {
        if (resourceId) {
            // Redirect to the new route
            router.push(`/resource/${resourceId}`);
        }
    }, [resourceId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Redirection en cours...</p>
        </div>
    );
}
