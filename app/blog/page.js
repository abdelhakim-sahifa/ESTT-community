'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PenSquare, Clock, User, ChevronRight } from 'lucide-react';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        const fetchPosts = async () => {
            try {
                const postsRef = ref(db, 'blog_posts');
                const snapshot = await get(postsRef);
                const data = snapshot.val() || {};

                const postsArray = Object.entries(data).map(([id, post]) => ({
                    id,
                    ...post
                })).sort((a, b) => (b.createdAt || b.created_at || 0) - (a.createdAt || a.created_at || 0));

                setPosts(postsArray);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [db]);


    return (
        <main className="container py-16 px-4">
            <header className="mb-16 text-center">
                <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.3em] uppercase bg-primary/10 text-primary rounded-full">
                    Communauté EST
                </div>
                <h1 className="text-5xl md:text-6xl font-heading font-medium tracking-tight text-slate-900 mb-6">
                    Blog Étudiant
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                    Le lieu où les étudiants de l'EST partagent leurs expériences, conseils et réussites.
                </p>
                <Link href="/blog/write">
                    <Button size="lg" className="h-14 px-8 rounded-2xl gap-3 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                        <PenSquare className="w-5 h-5" />
                        Écrire un article
                    </Button>
                </Link>
            </header>

            <section>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6 opacity-40" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement de l'univers...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PenSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-2xl font-heading text-slate-400 mb-6">Le blog est encore vide...</p>
                        <Link href="/blog/write">
                            <Button variant="outline" className="rounded-full border-slate-200">Soyez le premier à contribuer</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.id}`} className="group">
                                <Card className="h-full flex flex-col overflow-hidden transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-slate-100 rounded-[2.5rem] bg-white group-hover:-translate-y-2">
                                    {post.coverImage && (
                                        <div className="relative aspect-[16/10] overflow-hidden">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {post.category || 'Article'}
                                            </span>
                                        </div>
                                        <CardTitle className="text-2xl font-bold line-clamp-2 leading-[1.2] group-hover:text-primary transition-colors">
                                            {post.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-8 flex-grow">
                                        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-medium">
                                            {post.excerpt || (post.content && post.content.substring(0, 150) + '...')}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-8 pt-6 flex flex-col gap-6">
                                        <div className="w-full h-px bg-slate-50" />
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 leading-none mb-1">
                                                        {post.authorName || post.author_name || 'Anonyme'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                                        <Clock className="w-3 h-3" />
                                                        {post.createdAt || post.created_at ? new Date(post.createdAt || post.created_at).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        }) : 'Date inconnue'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:rotate-[-45deg] transition-all duration-500">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
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

