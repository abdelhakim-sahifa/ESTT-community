'use client';

import ActivityFeed from '@/components/features/feed/ActivityFeed';

export default function LatestActivity() {
    return (
        <section id="activity-feed" className="py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Communauté</h2>
                        <h2 className="text-4xl font-black tracking-tight">Dernières Activités</h2>
                    </div>
                    <p className="text-muted-foreground max-w-sm text-sm">
                        Découvrez ce que vos camarades partagent en temps réel sur la plateforme.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActivityFeed />
                </div>
            </div>
        </section>
    );
}
