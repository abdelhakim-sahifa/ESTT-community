'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, X, ArrowUpRight, MessageCircle } from 'lucide-react';
import { ESTT_AI_ICON, ESTT_AI_PROFILE } from '@/lib/estt-ai';

const SUGGESTIONS = [
    'Comment fonctionne la plateforme ?',
    'Aide pour une ressource',
    'Questions sur les clubs',
];

export default function FloatingAssistant() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    if (!pathname || pathname === '/messages/estt-ai') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
            {open && (
                <div className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <div className="relative shrink-0">
                            <img
                                src={ESTT_AI_ICON}
                                alt="ESTT-AI"
                                className="w-10 h-10 rounded-xl object-cover border border-border"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight">{ESTT_AI_PROFILE.firstName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{ESTT_AI_PROFILE.headline}</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-sm font-bold text-foreground">Comment puis-je vous aider ?</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Posez vos questions sur la plateforme, les clubs, les évenements et plus encore.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTIONS.map(s => (
                                <Link
                                    key={s}
                                    href="/messages/estt-ai"
                                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                                >
                                    {s}
                                </Link>
                            ))}
                        </div>

                        <Link
                            href="/messages/estt-ai"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Démarrer une conversation
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen(o => !o)}
                aria-label={open ? "Fermer l'assistant ESTT-AI" : "Ouvrir l'assistant ESTT-AI"}
                className="group relative w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            >
                {!open && (
                    <span className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-40 animate-ping pointer-events-none" />
                )}
                {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </button>
        </div>
    );
}