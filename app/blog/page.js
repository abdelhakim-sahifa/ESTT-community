'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PenSquare } from 'lucide-react';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsRef = ref(db, 'blog_posts');
                const snapshot = await get(postsRef);
                const data = snapshot.val() || {};

                const postsArray = Object.entries(data).map(([id, post]) => ({
                    id,
                    ...post
                })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setPosts(postsArray);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <main className="container py-12">
            <section className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Blog Étudiant
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Partage tes expériences, conseils et découvertes avec la communauté
                </p>
                <Link href="/blog/write">
                    <Button size="lg" className="gap-2">
                        <PenSquare className="w-5 h-5" />
                        Écrire un article
                    </Button>
                </Link>
            </section>

            <section>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Chargement des articles...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                        <p className="text-xl text-muted-foreground mb-4">Aucun article pour le moment.</p>
                        <Link href="/blog/write">
                            <Button variant="outline">Soyez le premier à écrire !</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.id}`} className="group">
                                <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-muted-foreground/10">
                                    {post.cover_image && (
                                        <div className="relative aspect-video overflow-hidden">
                                            <img
                                                src={post.cover_image}
                                                alt={post.title}
                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <CardHeader className="p-4">
                                        <CardTitle className="line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                            {post.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                            {post.excerpt || (post.content && post.content.substring(0, 150) + '...')}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground border-t border-muted/50 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">
                                                {post.author_name || 'Anonyme'}
                                            </span>
                                        </div>
                                        <span>
                                            {new Date(post.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
