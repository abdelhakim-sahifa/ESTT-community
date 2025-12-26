'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin } from '@/lib/clubUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrganizationalChart from '@/components/OrganizationalChart';
import ClubMemberCard from '@/components/ClubMemberCard';
import { CheckCircle2, Loader2, Settings, ArrowLeft, Users, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ClubProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [clubPosts, setClubPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

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
            }
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Club introuvable</h2>
                    <p className="text-muted-foreground mb-4">Ce club n'existe pas ou a été supprimé.</p>
                    <Button asChild>
                        <Link href="/clubs">Retour aux clubs</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-b">
                <div className="container py-8 px-4 md:px-6">
                    <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
                        <Link href="/clubs">
                            <ArrowLeft className="w-4 h-4" />
                            Retour aux clubs
                        </Link>
                    </Button>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Club Logo */}
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex-shrink-0">
                            {club.logo ? (
                                <Image
                                    src={club.logo}
                                    alt={`${club.name} logo`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary bg-muted">
                                    {club.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Club Info */}
                        <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-bold">{club.name}</h1>
                                {club.verified && (
                                    <Badge className="gap-1 bg-blue-500 hover:bg-blue-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Vérifié
                                    </Badge>
                                )}
                            </div>
                            <p className="text-lg text-muted-foreground mb-4">{club.description}</p>

                            {isAdmin && (
                                <Button asChild className="gap-2">
                                    <Link href={`/clubs/${clubId}/admin`}>
                                        <Settings className="w-4 h-4" />
                                        Panneau d'administration
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container py-12 px-4 md:px-6">
                <Tabs defaultValue="structure" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                        <TabsTrigger value="structure">Structure</TabsTrigger>
                        <TabsTrigger value="members">Membres</TabsTrigger>
                        <TabsTrigger value="activities">Activités</TabsTrigger>
                    </TabsList>

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
                            <Users className="w-6 h-6 text-primary" />
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

                    {/* Activities Tab */}
                    <TabsContent value="activities" className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Activités et Annonces</h2>
                        </div>

                        {clubPosts.length > 0 ? (
                            <div className="space-y-4">
                                {clubPosts.map((post) => (
                                    <Card key={post.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <CardTitle className="text-xl">{post.title}</CardTitle>
                                                <Badge variant={
                                                    post.type === 'announcement' ? 'default' :
                                                        post.type === 'article' ? 'secondary' : 'outline'
                                                }>
                                                    {post.type === 'announcement' ? 'Annonce' :
                                                        post.type === 'article' ? 'Article' : 'Activité'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                                        </CardContent>
                                    </Card>
                                ))}
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
                </Tabs>
            </section>
        </main>
    );
}
