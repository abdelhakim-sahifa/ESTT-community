'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdsPreview({ ads }) {
    if (!ads || ads.length === 0) return null;

    return (
        <section id="student-ads" className="py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Opportunités</h2>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Projets & Partenaires</h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <p className="text-muted-foreground max-w-sm text-sm text-right">
                            Soutenez les initiatives et services créés par vos camarades de l'ESTT.
                        </p>
                        <Link href="/ads-portal" className="text-blue-600 text-sm font-bold hover:underline decoration-2 underline-offset-4">
                            Toutes les annonces →
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ads.map((ad) => (
                        <Card key={ad.id} className="group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl bg-slate-50/50">
                            <div className="relative aspect-video overflow-hidden bg-slate-200">
                                {ad.type === 'video' ? (
                                    <video
                                        src={ad.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        onMouseOver={(e) => e.target.play()}
                                        onMouseOut={(e) => e.target.pause()}
                                    />
                                ) : (
                                    <Image
                                        src={ad.url}
                                        alt={ad.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none shadow-sm uppercase text-[10px] font-bold">
                                        {ad.type === 'video' ? 'Vidéo' : 'Focus'}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                                    {ad.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                                    {ad.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                                            {ad.publisherEmail?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400">Communauté</span>
                                    </div>
                                    {ad.link && (
                                        <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full h-8 px-3 text-xs font-bold">
                                            <a href={ad.link} target="_blank" rel="noopener noreferrer">
                                                Découvrir
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
