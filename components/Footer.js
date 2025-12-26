import Link from 'next/link';
import { Heart, Github, Globe } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full py-12 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    <div className="flex flex-col items-center md:items-start">
                        <Link href="/" className="text-2xl font-black tracking-tighter text-primary mb-2">
                            ESTT<span className="text-slate-400">.community</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
                            La plateforme collaborative pour les étudiants de l'École Supérieure de Technologie de Tétouan.
                        </p>
                    </div>

                    <div className="flex gap-8">
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Plateforme</h4>
                            <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">Ressources</Link>
                            <Link href="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors">Chat</Link>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Légal</h4>
                            <Link href="/politique-de-confidentialite" className="text-sm text-muted-foreground hover:text-primary transition-colors">Confidentialité</Link>
                            <Link href="/conditions-d-utilisation" className="text-sm text-muted-foreground hover:text-primary transition-colors">Conditions</Link>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        &copy; 2025 Promo 2 - EST Tétouan. Fait avec{' '}
                        <Heart className="w-3 h-3 text-destructive fill-destructive" /> pour les futurs étudiants.
                    </p>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Projet Open Source — <a href="https://github.com/abdelhakim-sahifa/ESTT-community/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contribuer sur GitHub</a>
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
