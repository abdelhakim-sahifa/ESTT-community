'use client';

import ActivityFeed from '@/components/features/feed/ActivityFeed';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function LatestActivity() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="activity-feed" className="py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">{t.common.community}</h2>
                        <h2 className="text-4xl font-black tracking-tight">{t.activity.title}</h2>
                    </div>
                    <p className="text-muted-foreground max-w-sm text-sm">
                        {t.activity.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActivityFeed />
                </div>
            </div>
        </section>
    );
}
