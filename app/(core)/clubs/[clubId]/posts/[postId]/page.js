'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Heart, ClipboardList } from 'lucide-react';
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
        if (clubId && postId) fetchData();
    }, [clubId, postId]);

    const fetchData = async () => {
        if (!db) return;
        try {
            const clubSnap = await get(ref(db, `clubs/${clubId}`));
            if (!clubSnap.exists()) { router.push('/clubs'); return; }
            setClub({ id: clubId, ...clubSnap.val() });

            const postSnap = await get(ref(db, `clubPosts/${clubId}/${postId}`));
            if (!postSnap.exists()) { router.push(`/clubs/${clubId}`); return; }

            const postData = { id: postId, ...postSnap.val() };
            setPost(postData);

            if (postData.linkedFormId) {
                const formSnap = await get(ref(db, `clubs/${clubId}/forms/${postData.linkedFormId}`));
                if (formSnap.exists()) setLinkedForm({ id: postData.linkedFormId, ...formSnap.val() });
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
            const m = Object.values(club.organizationalChart).find(m => m.email === email);
            if (m) return { name: m.name, role: m.role };
        }
        if (club.members) {
            const m = club.members.find(m => m.email === email);
            if (m) return { name: m.name, role: 'Membre' };
        }
        return { name: 'Membre du club', role: '' };
    };

    const getLikeCount = (likes) => {
        if (!likes) return 0;
        if (typeof likes === 'number') return likes;
        if (typeof likes === 'object') return Object.keys(likes).length;
        return 0;
    };

    const handleLike = async () => {
        if (!user || liking) return;
        setLiking(true);
        try {
            const newLikes = getLikeCount(post.likes) + 1;
            await update(ref(db, `clubPosts/${clubId}/${postId}`), { likes: newLikes });
            setPost(prev => ({ ...prev, likes: newLikes }));
        } catch (error) {
            console.error('Error liking post:', error);
        } finally {
            setLiking(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
    );

    if (!post || !club) return null;

    const author = getAuthorInfo(post.author);
    const likeCount = getLikeCount(post.likes);

    return (
        <main className="min-h-screen bg-white">
            {/* Sticky nav */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-4 h-13 flex items-center justify-between py-3">
                    <Link href={`/clubs/${clubId}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>{club.name}</span>
                    </Link>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        {post.type === 'announcement' ? 'Annonce' : post.type === 'article' ? 'Article' : 'Activité'}
                    </span>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-14">

                {/* Type label */}
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                    {post.type === 'announcement' ? 'Annonce' : post.type === 'article' ? 'Article' : 'Activité'}
                </p>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
                    {post.title}
                </h1>

                {/* Author + date */}
                <div className="flex items-center gap-3 mb-10 pb-8 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-bold text-slate-500">
                        {author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800 leading-none mb-0.5">{author.name}</p>
                        <p className="text-xs text-slate-400">
                            {author.role && <span>{author.role} · </span>}
                            {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Cover image */}
                {post.imageUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-10 border border-slate-100">
                        <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 672px"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base md:text-lg mb-14">
                    {post.content}
                </div>

                {/* Like */}
                <div className="flex items-center gap-3 pb-12 border-b border-slate-100">
                    <button
                        onClick={handleLike}
                        disabled={liking || !user}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                            likeCount > 0
                                ? "border-pink-200 bg-pink-50 text-pink-600"
                                : "border-slate-200 text-slate-400 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", likeCount > 0 ? "fill-current" : "")} />
                        {likeCount}
                    </button>
                    {!user && <span className="text-xs text-slate-400">Connectez-vous pour liker</span>}
                </div>

                {/* Participation form */}
                {linkedForm && (
                    <div className="mt-10 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto">
                            <ClipboardList className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Participer {linkedForm.generateTicket && <span>🎫</span>}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {linkedForm.description || "Inscrivez-vous pour participer à cet événement."}
                            </p>
                        </div>
                        <Button className="rounded-full px-8 font-bold" asChild>
                            <Link href={`/clubs/${clubId}/forms/${linkedForm.id}`}>Répondre au formulaire</Link>
                        </Button>
                    </div>
                )}

                {/* Club footer */}
                <div className="mt-10 flex items-center justify-between gap-4 p-5 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {club.logo ? (
                                <Image src={club.logo} alt={club.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: club.themeColor || '#64748b' }}>
                                    {club.name[0]}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900">{club.name}</p>
                            <p className="text-xs text-slate-400">Espace Club Officiel</p>
                        </div>
                    </div>
                    <Link href={`/clubs/${clubId}`} className="text-xs font-bold text-primary hover:underline shrink-0">
                        Voir le profil →
                    </Link>
                </div>
            </div>
        </main>
    );
}
