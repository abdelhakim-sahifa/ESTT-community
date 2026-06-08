'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirect() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Prefer clean @username URL; fall back to UID if profile not loaded yet
                const username = profile?.email?.split('@')[0];
                if (username) {
                    router.replace(`/profile/@${username}`);
                } else {
                    router.replace(`/profile/${user.uid}`);
                }
            } else {
                router.replace('/login');
            }
        }
    }, [user, profile, loading, router]);

    return (
        <div className="flex items-center justify-center min-h-screen text-primary">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
    );
}
