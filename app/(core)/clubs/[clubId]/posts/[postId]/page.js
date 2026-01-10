'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Calendar, User, Heart, Share2, CheckCircle2, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { clubId, postId } = params;

    const [club, setClub] = useState(null);
    const [post, setPost] = useState(null);
    const [linkedForm, setLinkedForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (clubId && postId) {
            fetchData();
        }
    }, [clubId, postId]);

    const fetchData = async () => {
        if (!db) return;

        try {
            // Fetch club
            const clubSnap = await get(ref(db, `clubs/${clubId}`));
            if (!clubSnap.exists()) {
                router.push('/clubs');
                return;
            }
            setClub({ id: clubId, ...clubSnap.val() });

            // Fetch post
            const postSnap = await get(ref(db, `clubPosts/${clubId}/${postId}`));
            if (!postSnap.exists()) {
                router.push(`/clubs/${clubId}`);
                return;
            }

            const postData = { id: postId, ...postSnap.val() };
            setPost(postData);

            // Fetch linked form if exists
            if (postData.linkedFormId) {
                const formSnap = await get(ref(db, `clubs/${clubId}/forms/${postData.linkedFormId}`));
                if (formSnap.exists()) {
                    setLinkedForm({ id: postData.linkedFormId, ...formSnap.val() });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAuthorInfo = (email) => {
        if (!club) return { name: 'Membre du club', role: '' };

        if (club.organizationalChart) {
            const orgMember = Object.values(club.organizationalChart).find(m => m.email === email);
            if (orgMember) return { name: orgMember.name, role: orgMember.role };
        }

        if (club.members) {
            const member = club.members.find(m => m.email === email);
            if (member) return { name: member.name, role: 'Membre' };
        }

        return { name: 'Membre du club', role: '' };
    };

    const handleLike = async () => {
        if (!user || liking) return;
        setLiking(true);
        try {
            const newLikes = (post.likes || 0) + 1;
            await update(ref(db, `clubPosts/${clubId}/${postId}`), {
                likes: newLikes
            });
            setPost(prev => ({ ...prev, likes: newLikes }));
        } catch (error) {
            console.error('Error liking post:', error);
        } finally {
            setLiking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!post || !club) return null;

    const author = getAuthorInfo(post.author);

    return (
        <main className="min-h-screen bg-white pb-20">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
                <div className="container px-4 h-16 max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <Link href={`/clubs/${clubId}`}>
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Retour au club</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge
                            className="text-white border-0 shadow-sm px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider"
                            style={{ backgroundColor: club.themeColor || '#64748b' }}
                        >
                            {post.type === 'announcement' ? 'Annonce' : post.type === 'article' ? 'Article' : 'Activité'}
                        </Badge>
                    </div>
                </div>
            </nav>

            <div className="container px-4 max-w-4xl mx-auto py-12 md:py-16">
                {/* Header Content */}
                <div className="space-y-6 mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.2] tracking-tight mx-auto max-w-3xl">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-4 py-6">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm leading-none mb-1">{author.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{author.role || 'Membre'}</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Featured Image */}
                {post.imageUrl && (
                    <div className="max-w-2xl mx-auto mb-12 px-4 md:px-0">
                        <div className="relative aspect-video md:aspect-[21/9] rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-lg border border-slate-100">
                            <Image
                                src={post.imageUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </div>
                    </div>
                )}

                {/* Main Article */}
                <article className="prose prose-slate prose-lg max-w-3xl mx-auto mb-20">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg md:text-xl opacity-90">
                        {post.content}
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleLike}
                            disabled={liking || !user}
                            className={cn(
                                "rounded-full gap-3 px-8 h-12 border border-slate-100 hover:border-pink-200 hover:bg-pink-50 transition-all",
                                post.likes ? "text-pink-600 bg-pink-50/50 border-pink-100 shadow-sm" : "text-slate-500"
                            )}
                        >
                            <Heart className={cn("w-5 h-5", post.likes ? "fill-current" : "")} />
                            <span className="font-bold text-lg">{post.likes || 0}</span>
                            <span className="text-xs uppercase tracking-widest font-black ml-1">J'aime</span>
                        </Button>
                    </div>
                </article>

                {/* Bottom Section: Forms & Club Detail */}
                <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Participation Form Block */}
                    {linkedForm && (
                        <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto ring-1 ring-slate-100">
                                <ClipboardList className="w-8 h-8" style={{ color: club.themeColor || '#64748b' }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 inline-flex items-center gap-2">
                                    Participer
                                    {linkedForm.generateTicket && <span title="Ticket inclus">🎫</span>}
                                </h3>
                                <p className="text-slate-600 mt-2 font-medium">
                                    {linkedForm.description || "Inscrivez-vous pour participer à cet événement."}
                                </p>
                            </div>
                            <Button
                                className="w-full sm:w-auto px-12 h-14 text-lg font-bold rounded-2xl text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                style={{ backgroundColor: club.themeColor || '#64748b' }}
                                asChild
                            >
                                <Link href={`/clubs/${clubId}/forms/${linkedForm.id}`}>
                                    Répondre au formulaire
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Simple Club Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm bg-slate-50 border shrink-0">
                                {club.logo ? (
                                    <Image src={club.logo} alt={club.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white" style={{ backgroundColor: club.themeColor || '#64748b' }}>
                                        {club.name[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-slate-900 leading-none mb-1">{club.name}</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Espace Club Officiel</p>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-xl font-bold h-11 px-6 text-slate-600 hover:bg-slate-50 border-slate-200" asChild>
                            <Link href={`/clubs/${clubId}`}>Voir le profil complet</Link>
                        </Button>
                    </div>

                    <div className="flex justify-center pt-8">
                        <Button variant="ghost" className="text-slate-400 hover:text-slate-600 gap-2 font-bold uppercase tracking-[.2em] text-[10px]" asChild>
                            <Link href={`/clubs/${clubId}`}>
                                <ArrowLeft className="w-3 h-3" />
                                Retourner au club
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
