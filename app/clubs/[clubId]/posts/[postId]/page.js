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
        <main className="min-h-screen bg-white">
            {/* Top Navigation / Breadcrumbs */}
            <div className="border-b bg-slate-50/50">
                <div className="container px-4 md:px-6 py-4 max-w-6xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <Link href={`/clubs/${clubId}`}>
                            <ArrowLeft className="w-4 h-4" />
                            Retour au club
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge
                            className="text-white border-0 shadow-sm px-3 py-1"
                            style={{ backgroundColor: club.themeColor || '#64748b' }}
                        >
                            {post.type === 'announcement' ? 'Annonce' : post.type === 'article' ? 'Article' : 'Activité'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Post Header Section */}
            <header className="py-12 md:py-20 border-b bg-gradient-to-b from-white to-slate-50/30">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 font-medium">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                                <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-slate-900 font-bold leading-none mb-1">{author.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{author.role || 'Auteur'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <Calendar className="w-4 h-4 text-primary" style={{ color: club.themeColor || '#64748b' }} />
                            <span className="text-sm">{new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container px-4 md:px-6 max-w-6xl mx-auto py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Featured Image */}
                        {post.imageUrl && (
                            <div className="group relative aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 ring-1 ring-slate-200">
                                <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem]" />
                            </div>
                        )}

                        {/* Article Content */}
                        <article className="prose prose-slate prose-lg max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg md:text-xl font-medium opacity-90">
                                {post.content}
                            </div>
                        </article>

                        {/* Interaction Section */}
                        <div className="pt-10 border-t flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant={post.likes ? "default" : "outline"}
                                    size="lg"
                                    className={cn(
                                        "rounded-full px-6 gap-2 transition-all hover:scale-105",
                                        post.likes ? "bg-pink-500 hover:bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-200" : ""
                                    )}
                                    onClick={handleLike}
                                    disabled={liking || !user}
                                >
                                    <Heart className={cn("w-5 h-5", post.likes ? "fill-current" : "")} />
                                    <span className="font-bold">{post.likes || 0}</span>
                                    <span className="text-xs opacity-80 uppercase tracking-widest ml-1">J'aime</span>
                                </Button>

                                <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-500">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="text-sm text-slate-400 font-medium italic">
                                La communauté ESTT apprécie votre soutien
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Context Column */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Participation CTA Card */}
                        {linkedForm && (
                            <Card className="border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                <CardContent className="p-0">
                                    <div
                                        className="h-3 w-full"
                                        style={{ backgroundColor: club.themeColor || '#64748b' }}
                                    />
                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                                                style={{ backgroundColor: `${club.themeColor || '#64748b'}15` }}
                                            >
                                                <ClipboardList className="w-6 h-6" style={{ color: club.themeColor || '#64748b' }} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 leading-tight">Participer</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Action requise</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-slate-600 leading-relaxed font-medium">
                                                {linkedForm.description || "Rejoignez l'événement ou l'activité en complétant ce formulaire de participation."}
                                            </p>

                                            <Button
                                                className="w-full h-14 text-white text-lg font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-[0.98]"
                                                style={{
                                                    backgroundColor: club.themeColor || '#64748b',
                                                    boxShadow: `0 10px 25px -5px ${club.themeColor || '#64748b'}40`
                                                }}
                                                asChild
                                            >
                                                <Link href={`/clubs/${clubId}/forms/${linkedForm.id}`}>
                                                    Remplir le formulaire
                                                </Link>
                                            </Button>

                                            {linkedForm.generateTicket && (
                                                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                                    <span className="text-yellow-700 font-bold text-xs flex items-center gap-1.5 uppercase tracking-tighter">
                                                        🎫 Inclus un ticket numérique
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Club Identity Card */}
                        <Card className="border-none shadow-xl shadow-slate-200 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white group">
                            <CardContent className="p-8">
                                <Link href={`/clubs/${clubId}`} className="flex items-center gap-5 mb-6 group/club">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white transition-transform duration-500 group-hover/club:scale-105">
                                        {club.logo ? (
                                            <Image
                                                src={club.logo}
                                                alt={club.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center font-black text-2xl text-white"
                                                style={{ backgroundColor: club.themeColor || '#64748b' }}
                                            >
                                                {club.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-black text-xl text-slate-900 leading-tight group-hover/club:text-primary transition-colors">{club.name}</h3>
                                        {club.verified && (
                                            <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold uppercase tracking-tight py-0.5">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Officiel
                                            </Badge>
                                        )}
                                    </div>
                                </Link>

                                <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium italic">
                                    "{club.description || "Découvrez nos activités et rejoignez la communauté."}"
                                </p>

                                <Button variant="secondary" className="w-full h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 border border-slate-200" asChild>
                                    <Link href={`/clubs/${clubId}`}>Visiter l'espace club</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </main>
    );
}
