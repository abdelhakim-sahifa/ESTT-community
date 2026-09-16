'use client';

import { useEffect, useState } from 'react';

export default function LatestReleaseBadge() {
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLatestRelease = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/torchcoders/ESTT-community/releases/latest');
                if (!response.ok) {
                    throw new Error('Failed to fetch latest release');
                }
                const data = await response.json();
                setRelease(data);
            } catch (err) {
                console.error('Error fetching release:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestRelease();
    }, []);

    if (loading || error || !release) {
        return null;
    }

    return (
        <a
            href={release.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200 dark:border-border rounded-full hover:border-blue-400 dark:hover:border-border transition-colors group"
            title={`Latest release: ${release.name || release.tag_name}`}
        >
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                    v{release.tag_name.replace(/^v/, '')}
                </span>
            </span>
            {!release.draft && !release.prerelease && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Live</span>
            )}
            {release.prerelease && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Beta</span>
            )}
        </a>
    );
}
