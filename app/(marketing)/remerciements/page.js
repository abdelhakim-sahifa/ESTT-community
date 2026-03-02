'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, ArrowLeft, Loader2, User, Heart, ChevronRight } from 'lucide-react';

export default function RemerciementsPage() {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ resources: 0 });

    useEffect(() => {
        const fetchContributors = async () => {
            try {
                const snapshot = await get(ref(db, 'resources'));
                if (snapshot.exists()) {
                    const resources = snapshot.val();
                    const resourceList = Object.values(resources);
                    setStats({ resources: resourceList.length });

                    const aggregation = resourceList.reduce((acc, resource) => {
                        const name = resource.authorName || 'Étudiant';
                        if (name.toLowerCase() === 'anonyme') return acc;

                        // Use authorId as primary key if available, fallback to name
                        const key = resource.authorId || name;

                        if (!acc[key]) {
                            acc[key] = {
                                name,
                                authorId: resource.authorId || null,
                                count: 0,
                                lastContribution: 0
                            };
                        }
                        acc[key].count += 1;
                        if (resource.createdAt > acc[key].lastContribution) {
                            acc[key].lastContribution = resource.createdAt;
                        }
                        return acc;
                    }, {});

                    const sortedContributors = Object.values(aggregation).sort((a, b) => {
                        if (b.count !== a.count) return b.count - a.count;
                        return b.lastContribution - a.lastContribution;
                    });

                    setContributors(sortedContributors);
                }
            } catch (error) {
                console.error("Error fetching contributors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, []);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy className="w-4 h-4 text-yellow-500" />;
            case 1: return <Medal className="w-4 h-4 text-slate-400" />;
            case 2: return <Medal className="w-4 h-4 text-amber-600" />;
            default: return <span className="text-slate-400 text-[10px] font-bold">#{index + 1}</span>;
        }
    };

    return (
        <main className="min-h-screen bg-white">
            {/* Standard Hero */}
            <section className="bg-white pt-20 pb-16 lg:pt-32 lg:pb-24 border-b border-slate-100">
                <div className="container px-4 md:px-6 flex flex-col items-center text-center">
                    <Button variant="ghost" size="sm" asChild className="mb-8 group rounded-full">
                        <Link href="/" className="flex items-center gap-2 text-slate-500">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour
                        </Link>
                    </Button>

                    <h1 className="text-3xl font-heading font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight">
                        Remerciements aux <span className="text-primary text-secondary-foreground">Contributeurs</span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
                        La plateforme ESTT Community vit grâce à la générosité de ses membres.
                        Chaque ressource partagée construit l'avenir de notre communauté.
                    </p>

                    <div className="mt-8 flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <strong className="text-primary text-lg">{stats.resources}</strong> ressources partagées
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold">MERCI !</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* List Section */}
            <section className="py-20 bg-slate-50/50">
                <div className="container max-w-3xl">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3 text-center sm:text-left">
                            Tableau d'honneur
                        </h2>
                        <p className="text-slate-500 text-base text-center sm:text-left">
                            Tous les membres qui ont contribué au succès de la plateforme.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-slate-400 text-sm">Chargement des héros...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {contributors.length > 0 ? (
                                contributors.map((contributor, idx) => {
                                    const CardWrapper = contributor.authorId ? Link : 'div';
                                    const wrapperProps = contributor.authorId ? { href: `/profile/${contributor.authorId}` } : {};

                                    return (
                                        <CardWrapper
                                            key={idx}
                                            {...wrapperProps}
                                            className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center justify-between group hover:border-primary/50 transition-colors cursor-pointer block"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                <div className="w-6 sm:w-8 flex flex-shrink-0 justify-center">
                                                    {getRankIcon(idx)}
                                                </div>

                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                                        {contributor.name}
                                                    </h3>
                                                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                                                        Activité : {new Date(contributor.lastContribution).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-6 ml-4">
                                                <div className="text-right">
                                                    <p className="text-sm sm:text-base font-black text-primary leading-tight">
                                                        {contributor.count}
                                                    </p>
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {contributor.count > 1 ? 'Partages' : 'Partage'}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </CardWrapper>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                    <Heart className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400">La liste sera bientôt remplie par nos héros.</p>
                                    <Button asChild variant="outline" className="mt-6 rounded-full px-8">
                                        <Link href="/contribute">Devenir le premier</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Standard Bottom Section */}
            <section className="py-20 bg-white">
                <div className="container text-center">
                    <div className="max-w-xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6 font-heading leading-tight">
                            Rejoignez le tableau d'honneur
                        </h2>
                        <p className="text-slate-500 text-lg mb-10">
                            Aidez vos camarades et laissez votre empreinte sur la plateforme.
                        </p>
                        <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-lg shadow-primary/20" asChild>
                            <Link href="/contribute">Je veux contribuer</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
