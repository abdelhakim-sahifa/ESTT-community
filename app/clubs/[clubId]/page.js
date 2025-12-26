'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin } from '@/lib/clubUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrganizationalChart from '@/components/OrganizationalChart';
import ClubMemberCard from '@/components/ClubMemberCard';
import { CheckCircle2, Loader2, Settings, ArrowLeft, Users, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ClubProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [clubPosts, setClubPosts] = useState([]);
    const [headerPosts, setHeaderPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (clubId) {
            fetchClubData();
        }
    }, [clubId]);

    useEffect(() => {
        if (club && user) {
            setIsAdmin(isClubAdmin(user.email, club));
        }
    }, [club, user]);

    // Carousel Autoplay
    useEffect(() => {
        if (headerPosts.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % headerPosts.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [headerPosts.length]);

    const fetchClubData = async () => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            // Fetch club data
            const clubRef = ref(db, `clubs/${clubId}`);
            const clubSnap = await get(clubRef);

            if (!clubSnap.exists()) {
                router.push('/clubs');
                return;
            }

            const clubData = { id: clubId, ...clubSnap.val() };
            setClub(clubData);

            // Fetch club posts
            const postsRef = ref(db, `clubPosts/${clubId}`);
            const postsSnap = await get(postsRef);

            if (postsSnap.exists()) {
                const postsData = postsSnap.val();
                const postsArray = Object.entries(postsData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.createdAt - a.createdAt);

                setClubPosts(postsArray);

                // Content for header carousel (announcements/activities with images preferred, or just recent)
                // Prioritize items with images
                const announcements = postsArray.filter(p => ['announcement', 'activity'].includes(p.type));
                const withImages = announcements.filter(p => p.imageUrl);
                const withoutImages = announcements.filter(p => !p.imageUrl);

                // Combine: items with images first, then others, max 5 total
                const headerItems = [...withImages, ...withoutImages].slice(0, 5);
                setHeaderPosts(headerItems);
            }
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAuthorInfo = (email) => {
        if (!club) return { name: 'Membre du club', role: '' };

        // Check organigram
        if (club.organizationalChart) {
            const orgMember = Object.values(club.organizationalChart).find(m => m.email === email);
            if (orgMember) return { name: orgMember.name, role: orgMember.role };
        }

        // Check members list
        if (club.members) {
            const member = club.members.find(m => m.email === email);
            if (member) return { name: member.name, role: 'Membre' };
        }

        return { name: 'Membre du club', role: '' };
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % headerPosts.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + headerPosts.length) % headerPosts.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!club) return null;

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <style jsx global>{`
                .theme-text { color: ${club.themeColor || '#64748b'}; }
                .theme-bg { background-color: ${club.themeColor || '#64748b'}; }
                .theme-border { border-color: ${club.themeColor || '#64748b'}; }
                .theme-hover-text:hover { color: ${club.themeColor || '#64748b'}; }
                .theme-hover-bg:hover { background-color: ${club.themeColor || '#64748b'}; }
            `}</style>
            {/* Header / Hero Section */}
            <section className="relative bg-white border-b overflow-hidden">
                <div className="container py-8 px-4 md:px-6 relative z-10">

                    <div className="flex flex-col gap-6">
                        <Button variant="ghost" size="sm" asChild className="self-start gap-2 mb-2">
                            <Link href="/clubs">
                                <ArrowLeft className="w-4 h-4" />
                                Retour aux clubs
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Club Brand */}
                            <div className="flex flex-col items-center md:items-start gap-4 flex-shrink-0 lg:w-1/3">
                                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg mx-auto md:mx-0">
                                    {club.logo ? (
                                        <Image
                                            src={club.logo}
                                            alt={`${club.name} logo`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-4xl font-bold bg-muted"
                                            style={{ color: club.themeColor || '#64748b' }}
                                        >
                                            {club.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center md:text-left space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <h1 className="text-3xl font-bold">{club.name}</h1>
                                        {club.verified && (
                                            <Badge className="bg-blue-500 hover:bg-blue-600">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground">{club.description}</p>

                                    {isAdmin && (
                                        <Button asChild variant="outline" className="gap-2 mt-4">
                                            <Link href={`/clubs/${clubId}/admin`}>
                                                <Settings className="w-4 h-4" />
                                                Administration du club
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Right: Announcements Carousel */}
                            <div className="flex-1 w-full lg:w-2/3">
                                {headerPosts.length > 0 ? (
                                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[16/9] md:aspect-[21/9] shadow-xl group">
                                        {/* Background Image/Gradient */}
                                        <div className="absolute inset-0">
                                            {headerPosts[currentSlide].imageUrl ? (
                                                <Image
                                                    src={headerPosts[currentSlide].imageUrl}
                                                    alt="Announcement cover"
                                                    fill
                                                    className="object-cover opacity-60 transition-opacity duration-500"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${club.themeColor || '#64748b'} 0%, #1a202c 100%)`
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Content Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                            <Badge className="mb-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                                {headerPosts[currentSlide].type === 'announcement' ? 'Annonce' : 'Activité'}
                                            </Badge>
                                            <Link href={`/clubs/${clubId}/posts/${headerPosts[currentSlide].id}`} className="block group-hover:underline decoration-white/50 underline-offset-4">
                                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-1">
                                                    {headerPosts[currentSlide].title}
                                                </h3>
                                            </Link>
                                            <p className="text-slate-200 line-clamp-2 text-sm md:text-base mb-4 max-w-2xl">
                                                {headerPosts[currentSlide].content}
                                            </p>
                                            <div className="flex items-center gap-2 text-white/80 text-xs">
                                                <span>Publié par {getAuthorInfo(headerPosts[currentSlide].author).name}</span>
                                                <span>•</span>
                                                <span>{new Date(headerPosts[currentSlide].createdAt).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </div>

                                        {/* Navigation Buttons */}
                                        {headerPosts.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevSlide}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={nextSlide}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>

                                                {/* Dots */}
                                                <div className="absolute top-4 right-4 flex gap-1.5">
                                                    {headerPosts.map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "w-2 h-2 rounded-full transition-all shadow-sm",
                                                                idx === currentSlide ? "bg-white w-4" : "bg-white/40"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[200px] flex items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50">
                                        <p className="text-muted-foreground">Aucune annonce récente</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container py-12 px-4 md:px-6">
                <Tabs defaultValue="activities" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                        <TabsTrigger value="activities">Actualités</TabsTrigger>
                        <TabsTrigger value="structure">Structure</TabsTrigger>
                        <TabsTrigger value="members">Membres</TabsTrigger>
                    </TabsList>

                    {/* Activities Tab */}
                    <TabsContent value="activities" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 theme-text" />
                                <h2 className="text-2xl font-bold">Activités et Annonces</h2>
                            </div>
                        </div>

                        {clubPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {clubPosts.map((post) => {
                                    const author = getAuthorInfo(post.author);
                                    return (
                                        <Link href={`/clubs/${clubId}/posts/${post.id}`} key={post.id}>
                                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col group">
                                                {/* Card Image */}
                                                {post.imageUrl && (
                                                    <div className="relative w-full h-48 bg-slate-100">
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}

                                                <CardHeader className="flex-1 pb-2">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <Badge variant={
                                                            post.type === 'announcement' ? 'default' :
                                                                post.type === 'article' ? 'secondary' : 'outline'
                                                        }
                                                            style={post.type === 'announcement' ? { backgroundColor: club.themeColor || '#64748b' } : {}}
                                                        >
                                                            {post.type === 'announcement' ? 'Annonce' :
                                                                post.type === 'article' ? 'Article' : 'Activité'}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <CardTitle className="text-xl line-clamp-2 theme-hover-text transition-colors">
                                                        {post.title}
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardContent>
                                                    <p className="text-muted-foreground line-clamp-3 text-sm">
                                                        {post.content}
                                                    </p>
                                                </CardContent>

                                                <CardFooter className="pt-0 border-t bg-slate-50/50 p-4 mt-auto">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs text-slate-900">{author.name}</span>
                                                            {author.role && (
                                                                <span className="text-[10px] text-muted-foreground">{author.role}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">
                                        Aucune activité ou annonce publiée pour le moment.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Organizational Structure Tab */}
                    <TabsContent value="structure" className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Structure Organisationnelle</h2>
                            <p className="text-muted-foreground mb-6">
                                Découvrez l'équipe dirigeante du club et leurs rôles respectifs.
                            </p>
                        </div>
                        <OrganizationalChart organizationalChart={club.organizationalChart} />
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 theme-text" />
                            <h2 className="text-2xl font-bold">Membres du Club</h2>
                        </div>

                        {club.members && club.members.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {club.members.map((member, index) => (
                                    <ClubMemberCard key={index} member={member} showPhoto={true} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">
                                        Aucun membre régulier enregistré pour le moment.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    );
}
