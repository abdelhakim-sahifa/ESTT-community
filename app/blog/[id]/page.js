'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, ref, get, push, set, onValue, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, MessageSquare, Send, ThumbsUp, ThumbsDown, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ArticlePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);

    useEffect(() => {
        if (!id) return;

        // Fetch Article
        const articleRef = ref(db, `blog_posts/${id}`);
        const unsubscribeArticle = onValue(articleRef, (snapshot) => {
            if (snapshot.exists()) {
                setArticle({ id, ...snapshot.val() });
            } else {
                setArticle(null);
            }
            setLoading(false);
        });

        // Fetch Real-time Comments
        const commentsRef = ref(db, `blog_posts/${id}/comments`);
        const unsubscribeComments = onValue(commentsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.entries(data).map(([cid, val]) => ({ id: cid, ...val }));
                setComments(list.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setComments([]);
            }
        });

        return () => {
            unsubscribeArticle();
            unsubscribeComments();
        };
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!user || !commentText.trim()) return;

        const newCommentRef = push(ref(db, `blog_posts/${id}/comments`));
        await set(newCommentRef, {
            text: commentText.trim(),
            authorId: user.uid,
            authorName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Étudiant',
            timestamp: Date.now()
        });
        setCommentText('');
    };

    if (loading) return (
        <div className="flex-grow flex items-center justify-center min-h-[60vh] text-primary"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
    );

    if (!article) return (
        <main className="container py-20 text-center flex-grow">
            <h1 className="text-4xl font-black mb-4">Article non trouvé</h1>
            <Button asChild variant="outline" className="rounded-full">
                <Link href="/blog"><ArrowLeft className="mr-2 w-4 h-4" /> Retour au blog</Link>
            </Button>
        </main>
    );

    return (
        <main className="container py-12 max-w-4xl mx-auto px-4">
            <Button variant="ghost" asChild className="mb-8 rounded-full hover:bg-white border-transparent">
                <Link href="/blog" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </Link>
            </Button>

            <article className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                {article.cover_image && (
                    <div className="aspect-[21/9] w-full overflow-hidden">
                        <img
                            src={article.cover_image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-8 md:p-12">
                    <Badge className="mb-6 rounded-full bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">
                        {article.category || 'Article'}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight text-slate-900">
                        {article.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-100">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Par {article.author_name}</p>
                            <p className="text-sm text-slate-500 font-medium">
                                {new Date(article.created_at).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                        {article.content}
                    </div>
                </div>
            </article>

            {/* Comments Section */}
            <section className="mt-16 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Commentaires <span className="bg-slate-200 text-slate-600 px-3 py-0.5 rounded-full text-xs font-black">{comments.length}</span>
                    </h2>
                </div>

                <Card className="rounded-3xl border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-6">
                        {user ? (
                            <form onSubmit={handleAddComment} className="flex gap-3">
                                <Input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Qu'en pensez-vous ?"
                                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-primary/20"
                                />
                                <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20" disabled={!commentText.trim()}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4 text-sm text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                Veuillez vous <Link href="/login" className="text-primary font-bold underline">connecter</Link> pour commenter.
                            </div>
                        )}

                        <div className="mt-8 space-y-6">
                            {comments.length === 0 ? (
                                <p className="text-center text-slate-400 italic py-10">Soyez le premier à commenter cet article !</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4 group">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-slate-900 underline hover:text-primary transition-colors cursor-pointer">
                                                    {comment.authorName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(comment.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100/50">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
