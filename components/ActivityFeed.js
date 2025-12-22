'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, onValue } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, PenTool, ArrowRight, User } from 'lucide-react';

export default function ActivityFeed() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We listen to resources and blog_posts together
        const resourcesRef = ref(db, 'resources');
        const blogRef = ref(db, 'blog_posts');

        const unsubscribeResources = onValue(resourcesRef, (snapshot) => {
            const resourceData = snapshot.val() || {};
            const resourceList = [];
            const seenIds = new Set();

            // Flatten resources and de-duplicate
            Object.entries(resourceData).forEach(([key, value]) => {
                // Some resources are nested under module IDs, others are flat
                if (typeof value === 'object' && value !== null && !value.title) {
                    // Nested under module
                    Object.entries(value).forEach(([id, resource]) => {
                        if (!seenIds.has(id)) {
                            resourceList.push({
                                id,
                                type: 'resource',
                                title: resource.title,
                                module: resource.module,
                                semester: resource.semester,
                                field: resource.field,
                                author: resource.authorName || 'Anonyme',
                                authorId: resource.authorId,
                                timestamp: resource.createdAt || resource.created_at || Date.now(),
                                href: resource.url || resource.link || resource.file || `/browse?module=${resource.module}`
                            });
                            seenIds.add(id);
                        }
                    });
                } else {
                    // Flat structure
                    const id = key;
                    const resource = value;
                    if (!seenIds.has(id)) {
                        resourceList.push({
                            id,
                            type: 'resource',
                            title: resource.title,
                            module: resource.module,
                            semester: resource.semester,
                            field: resource.field,
                            author: resource.authorName || 'Anonyme',
                            authorId: resource.authorId,
                            timestamp: resource.createdAt || resource.created_at || Date.now(),
                            href: resource.url || resource.link || resource.file || `/browse?module=${resource.module}`
                        });
                        seenIds.add(id);
                    }
                }
            });
            updateFeed('resources', resourceList);
        });

        const unsubscribeBlogs = onValue(blogRef, (snapshot) => {
            const blogData = snapshot.val() || {};
            const blogList = Object.entries(blogData).map(([id, blog]) => ({
                id,
                type: 'blog',
                title: blog.title,
                author: blog.authorName || blog.author_name || 'Anonyme',
                authorId: blog.authorId || blog.author_id,
                timestamp: blog.createdAt || blog.created_at || Date.now(),
                href: `/blog/${id}`
            }));
            updateFeed('blogs', blogList);
        });

        const updateFeed = (source, items) => {
            setActivities(prev => {
                const otherSource = source === 'resources' ? 'blogs' : 'resources';
                const otherItems = prev.filter(a => a.source === otherSource);
                const markedItems = items.map(i => ({ ...i, source }));

                // Final de-duplication across sources just in case
                const combined = [...otherItems, ...markedItems];
                const unique = [];
                const seen = new Set();

                combined.forEach(item => {
                    if (!seen.has(item.id)) {
                        unique.push(item);
                        seen.add(item.id);
                    }
                });

                return unique
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .slice(0, 6);
            });
            setLoading(false);
        };

        return () => {
            unsubscribeResources();
            unsubscribeBlogs();
        };
    }, []);

    if (loading) return <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    if (activities.length === 0) return <div className="col-span-full py-20 text-center text-muted-foreground italic">Aucune activité récente.</div>;

    const getFieldColor = (field) => {
        switch (field?.toLowerCase()) {
            case 'ia': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'casi': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'insem': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'idd': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Date invalide';
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            {activities.map((activity) => (
                <Card key={activity.id} className="group hover:shadow-xl transition-all duration-300 border-muted-foreground/10 overflow-hidden relative flex flex-col">
                    <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        activity.type === 'resource' ? "bg-primary" : "bg-blue-500"
                    )}></div>
                    <CardContent className="p-6 flex-grow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="px-2 py-0 font-black text-[9px] uppercase tracking-widest bg-muted/50">
                                    {activity.type === 'resource' ? 'Ressource' : 'Article'}
                                </Badge>
                                {activity.semester && (
                                    <Badge variant="outline" className="px-2 py-0 font-bold text-[9px] uppercase border-primary/20 text-primary">
                                        {activity.semester}
                                    </Badge>
                                )}
                                {activity.field && (
                                    <Badge variant="outline" className={cn("px-2 py-0 font-bold text-[9px] uppercase", getFieldColor(activity.field))}>
                                        {activity.field}
                                    </Badge>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">
                                {formatDate(activity.timestamp)}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {activity.title}
                        </h3>

                        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-xs truncate">
                                Par {activity.author}
                            </span>
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between pt-4 border-t border-muted/20">
                            {activity.type === 'resource' && (
                                <span className="text-[10px] font-black uppercase text-primary truncate max-w-[150px]">
                                    {activity.module}
                                </span>
                            )}
                            <a
                                href={activity.href}
                                target={activity.type === 'resource' ? "_blank" : "_self"}
                                rel={activity.type === 'resource' ? "noopener noreferrer" : ""}
                                className="text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all ml-auto hover:text-primary"
                            >
                                {activity.type === 'resource' ? 'Accéder' : 'Lire'} <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </Card>
            ))}
        </>
    );
}

// Internal helper for Tailwind classes if needed (since it's a separate file)
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}
