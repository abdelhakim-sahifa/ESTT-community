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

        let allActivities = [];

        const unsubscribeResources = onValue(resourcesRef, (snapshot) => {
            const resourceData = snapshot.val() || {};
            const resourceList = [];

            Object.entries(resourceData).forEach(([module, moduleResources]) => {
                Object.entries(moduleResources).forEach(([id, resource]) => {
                    resourceList.push({
                        id,
                        type: 'resource',
                        title: resource.title,
                        module: resource.module,
                        author: resource.authorName || 'Anonyme',
                        authorId: resource.authorId,
                        timestamp: new Date(resource.created_at).getTime(),
                        href: `/browse?module=${module}`
                    });
                });
            });
            updateFeed('resources', resourceList);
        });

        const unsubscribeBlogs = onValue(blogRef, (snapshot) => {
            const blogData = snapshot.val() || {};
            const blogList = Object.entries(blogData).map(([id, blog]) => ({
                id,
                type: 'blog',
                title: blog.title,
                author: blog.author_name || 'Anonyme',
                authorId: blog.author_id,
                timestamp: new Date(blog.created_at).getTime(),
                href: `/blog/${id}`
            }));
            updateFeed('blogs', blogList);
        });

        const updateFeed = (source, items) => {
            setActivities(prev => {
                const otherSource = source === 'resources' ? 'blogs' : 'resources';
                const otherItems = prev.filter(a => a.source === otherSource);
                const markedItems = items.map(i => ({ ...i, source }));
                return [...otherItems, ...markedItems]
                    .sort((a, b) => b.timestamp - a.timestamp)
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

    return (
        <>
            {activities.map((activity) => (
                <Card key={activity.id} className="group hover:shadow-xl transition-all duration-300 border-muted-foreground/10 overflow-hidden relative">
                    <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        activity.type === 'resource' ? "bg-primary" : "bg-blue-500"
                    )}></div>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="secondary" className="px-2 py-0 font-black text-[9px] uppercase tracking-widest bg-muted/50">
                                {activity.type === 'resource' ? 'Ressource' : 'Article'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-bold">
                                {new Date(activity.timestamp).toLocaleDateString()}
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

                        <div className="flex items-center justify-between pt-4 border-t border-muted/20">
                            {activity.type === 'resource' && (
                                <span className="text-[10px] font-black uppercase text-primary">
                                    {activity.module}
                                </span>
                            )}
                            <Link
                                href={activity.href}
                                className="text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all ml-auto hover:text-primary"
                            >
                                Voir <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}

// Internal helper for Tailwind classes if needed (since it's a separate file)
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}
