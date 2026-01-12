'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function Hero({ stats, handleSearchClick }) {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <section id="hero" className="relative bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white pt-20 pb-16 lg:pt-32 lg:pb-24">
            <div className="container px-4 md:px-6 flex flex-col items-center text-center">
                <h1 className={cn(
                    "text-3xl font-heading font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight",
                    language === 'ar' ? 'font-arabic' : ''
                )}>
                    {t.hero.title}
                </h1>
                <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
                    {t.hero.subtitle}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/contribute">
                            {t.hero.buttonContribute}
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/browse">
                            {t.common.browse}
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/clubs">
                            {t.common.discoverClubs}
                        </Link>
                    </Button>
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-6 text-sm font-medium text-muted-foreground" aria-hidden="false">
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                        <strong className="text-primary text-base md:text-lg" id="hero-stat-resources">{stats.resources}</strong> {t.hero.statResources}
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                        <strong className="text-primary text-base md:text-lg" id="hero-stat-contributions">{stats.contributions}</strong> {t.hero.statContributions}
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                        <strong className="text-primary text-base md:text-lg" id="hero-stat-modules">{stats.modules}</strong> {t.hero.statModules}
                    </div>
                </div>

                <p className="mt-8 text-sm text-muted-foreground/80">
                    {t.hero.acceptedFormats}
                </p>

                <div className="relative w-full max-w-2xl mt-10 z-50">
                    <div
                        onClick={handleSearchClick}
                        className="group relative cursor-pointer"
                    >
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors">
                            <Search className="h-6 w-6" />
                        </div>
                        <div className="w-full h-16 pl-16 pr-6 rounded-full border-2 border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl flex items-center text-slate-400 group-hover:border-primary/20 group-hover:shadow-primary/5 transition-all text-sm md:text-lg font-medium">
                            {t.common.searchPlaceholder}
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Button size="sm" className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 hidden sm:flex">
                                {t.common.search}
                            </Button>
                            <Button size="icon" className="rounded-full sm:hidden shadow-lg shadow-primary/20">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
