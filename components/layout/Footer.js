'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Github, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function Footer() {
    const pathname = usePathname();
    const isAdsPage = pathname === '/ads-portal';
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <footer className="w-full py-12 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    <div className="flex flex-col items-center md:items-start">
                        <Link href="/" className="flex items-center gap-3 mb-4 group">
                            {!isAdsPage && (
                                <>
                                    <Image
                                        src="/assets/images/logo__five.svg"
                                        alt="EST Tétouan"
                                        width={120}
                                        height={40}
                                        className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
                                </>
                            )}
                            <span className="text-xl font-black tracking-tighter text-primary">
                                ESTT<span className="text-slate-400">.community</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
                            {t.footer.description}
                        </p>
                    </div>

                    <div className="flex gap-8">
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.footer.platform}</h4>
                            <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.common.resources}</Link>
                            <Link href="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.common.blog}</Link>
                            <Link href="/ads-portal" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.footer.monetization}</Link>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.footer.legal}</h4>
                            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.footer.privacy}</Link>
                            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.footer.terms}</Link>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        &copy; 2025 {t.footer.copyright}
                    </p>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {t.footer.openSource}
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com/abdelhakim-sahifa/ESTT-community/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="https://estt.uae.ac.ma" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                <Globe className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
