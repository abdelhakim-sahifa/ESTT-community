'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Calendar, User, Heart, MessageCircle, Share2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { clubId, postId } = params;

    const [club, setClub] = useState(null);
    const [post, setPost] = useState(null);
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
            setPost({ id: postId, ...postSnap.val() });
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
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Header / Hero */}
            <div className="relative h-[300px] md:h-[400px] bg-slate-900 w-full">
                {post.imageUrl ? (
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div
                        className="w-full h-full opacity-90"
                        style={{
                            background: `linear-gradient(135deg, ${club.themeColor || '#64748b'} 0%, #0f172a 100%)`
                        }}
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />

                <div className="absolute top-6 left-4 md:left-6 z-10">
                    <Button variant="secondary" size="sm" asChild className="gap-2 shadow-lg backdrop-blur-md bg-white/90 hover:bg-white">
                        <Link href={`/clubs/${clubId}`}>
                            <ArrowLeft className="w-4 h-4" />
                            Retour au club
                        </Link>
                    </Button>
                </div>

                <div className="container absolute bottom-0 left-1/2 -translate-x-1/2 px-4 md:px-6 pb-12">
                    <Badge
                        className="mb-4 text-white border-0 shadow-lg"
                        style={{ backgroundColor: club.themeColor || '#64748b' }}
                    >
                        {post.type === 'announcement' ? 'Annonce' : post.type === 'article' ? 'Article' : 'Activité'}
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-600">
                        <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{author.name}</span>
                            {author.role && <span className="text-slate-500">• {author.role}</span>}
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-4 md:px-6 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="shadow-xl border-slate-200/50">
                            <CardContent className="p-6 md:p-8">
                                <div className="prose prose-slate max-w-none">
                                    <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
                                        {post.content}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interaction Bar */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={liking ? "ghost" : "outline"}
                                    className={`gap-2 ${post.likes ? 'text-pink-600 border-pink-200 bg-pink-50' : ''}`}
                                    onClick={handleLike}
                                    disabled={liking || !user}
                                >
                                    <Heart className={`w-4 h-4 ${liking ? 'animate-pulse' : ''} ${post.likes ? 'fill-current' : ''}`} />
                                    {post.likes || 0} J'aime
                                </Button>
                                <Button variant="ghost" className="gap-2" disabled>
                                    <MessageCircle className="w-4 h-4" />
                                    Commentaires (Bientôt)
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Club Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden border">
                                        {club.logo ? (
                                            <Image
                                                src={club.logo}
                                                alt={club.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center font-bold">
                                                {club.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{club.name}</h3>
                                        {club.verified && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Club Vérifié
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                    {club.description}
                                </p>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/clubs/${clubId}`}>Voir le profil du club</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
