'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AdsPreview({ ads }) {
    if (!ads || ads.length === 0) return null;

    return (
        <section id="student-ads" className="py-12 md:py-20 bg-background">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2 md:mb-4">Projets & Partenaires</h2>
                        <p className="text-muted-foreground text-lg">
                            Soutenez les initiatives et services créés par vos camarades de l'ESTT.
                        </p>
                    </div>
                    <Link href="/ads-portal" className="text-primary text-sm font-bold hover:underline shrink-0">
                        Toutes les annonces →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {ads.map((ad) => (
                        <div key={ad.id} className="group border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                            <div className="relative aspect-video overflow-hidden bg-muted">
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
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="inline-block bg-background/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                                        {ad.type === 'video' ? 'Vidéo' : 'Focus'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 md:p-5">
                                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                                    {ad.title}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                    {ad.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">
                                            {ad.publisherEmail?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">Communauté</span>
                                    </div>
                                    {ad.link && (
                                        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">
                                            Découvrir →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
