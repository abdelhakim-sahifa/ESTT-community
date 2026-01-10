'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import ClubCard from '@/components/features/clubs/ClubCard';

export default function ClubsPreview({ clubs, loading }) {
    return (
        <section id="clubs-section" className="py-20 bg-slate-50/50">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Vie Étudiante</h2>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Nos Clubs</h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <p className="text-muted-foreground max-w-sm text-sm text-right">
                            Rejoignez l'un de nos nombreux clubs et développez vos compétences.
                        </p>
                        <Link href="/clubs" className="text-primary text-sm font-bold hover:underline">
                            Voir tous les clubs →
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!loading ? (
                        clubs.length > 0 ? (
                            clubs.map((club) => (
                                <ClubCard key={club.id} club={club} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                Aucun club vérifié à afficher pour le moment.
                            </div>
                        )
                    ) : (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
