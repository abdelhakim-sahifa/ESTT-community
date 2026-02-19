'use client';

import ActivityFeed from '@/components/features/feed/ActivityFeed';

export default function LatestActivity() {
    return (
        <section id="activity-feed" className="py-20 bg-white">
            <div className="container">
                <div className="max-w-2xl mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                        Dernières Activités
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Les derniers partages de la communauté en temps réel.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActivityFeed />
                </div>
            </div>
        </section>
    );
}
