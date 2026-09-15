'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFirstProjectImage, getProjectCategoryLabel, formatProjectDate } from '@/lib/projects';
import { ExternalLink, Github, Sparkles } from 'lucide-react';

export default function ProjectShowcaseCard({ showcase }) {
    const image = getFirstProjectImage(showcase);

    return (
        <article className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-none transition-all hover:border-orange-500/50">
            <div className="relative">
                <div className="absolute inset-0 bg-muted" />
                {image && (
                    <img
                        src={image}
                        alt={showcase.title}
                        className="relative h-28 sm:h-44 w-full object-cover"
                    />
                )}
                {!image && <div className="relative h-28 sm:h-44 w-full bg-muted" />}
            </div>

            <div className="space-y-3 sm:space-y-5 p-3 sm:p-5">
                <div>
                    <p className="mb-1 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-orange-500">
                        Showcase
                    </p>
                    <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-foreground line-clamp-1">{showcase.title}</h3>
                    <p className="mt-1 sm:mt-2 line-clamp-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {showcase.summary || 'Projet publie par la communaute.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge className="text-[9px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 border-border bg-muted text-foreground">
                        {getProjectCategoryLabel(showcase.category)}
                    </Badge>
                    {showcase.tags.slice(0, 1).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[9px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 border-border bg-muted text-muted-foreground">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-border bg-muted p-2 sm:p-4">
                    <div>
                        <p className="text-[9px] sm:text-xs uppercase tracking-wide text-muted-foreground">Auteur</p>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-foreground line-clamp-1">{showcase.authorName}</p>
                    </div>
                    <div className="rounded-full bg-card p-1.5 sm:p-3 shadow-sm shrink-0">
                        <Sparkles className="h-3 w-3 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                </div>

                <div className="hidden sm:flex flex-wrap gap-2">
                    {showcase.techStack.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
                            {item}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-3 sm:pt-4">
                    <div className="min-w-0 hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Publie le</p>
                        <p className="truncate text-xs font-semibold text-foreground">
                            {formatProjectDate(showcase.createdAt)}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <Button size="sm" asChild className="flex-1 sm:flex-none rounded-full px-2 sm:px-4 text-[10px] sm:text-sm h-8 sm:h-auto">
                            <Link href={`/projects/showcase/${showcase.id}`}>Voir</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
