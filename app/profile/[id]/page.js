'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get, set, update, onValue } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, GraduationCap, Calendar, Share2, Star } from 'lucide-react';
import { cn, getUserLevel } from '@/lib/utils';

export default function PublicProfilePage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStarred, setIsStarred] = useState(false);
    const [starCount, setStarCount] = useState(0);

    useEffect(() => {
        if (!id) return;

        const profileRef = ref(db, `users/${id}`);
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile(data);
                setStarCount(data.stars || 0);
                setIsStarred(data.starredBy && currentUser && data.starredBy[currentUser.uid]);
            } else {
                setError("Profil introuvable");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser]);

    const handleStar = async () => {
        if (!currentUser) {
            alert("Connectez-vous pour starer ce profil !");
            return;
        }
        if (currentUser.uid === id) {
            alert("Vous ne pouvez pas vous starer vous-même !");
            return;
        }

        const newIsStarred = !isStarred;
        const newStarCount = newIsStarred ? starCount + 1 : Math.max(0, starCount - 1);

        try {
            await update(ref(db, `users/${id}`), {
                stars: newStarCount,
                [`starredBy/${currentUser.uid}`]: newIsStarred || null
            });
        } catch (err) {
            console.error("Error updating star:", err);
        }
    };

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Lien du profil copié !");
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-primary">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-[60vh] text-destructive">
            {error}
        </div>
    );


    const level = getUserLevel(profile?.startYear);
    const contributionsCount = Object.keys(profile?.contributions || {}).length;
    const isMentor = level === 2 && contributionsCount > 5;

    return (
        <main className="container py-12 max-w-5xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Sidebar: Bio & Stats */}
                <div className="space-y-6">
                    <Card className="text-center p-6 bg-gradient-to-b from-primary/5 to-transparent shadow-sm border-muted-foreground/10 overflow-hidden relative">
                        {isMentor && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-white px-3 py-1 rounded-bl-xl shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1 z-10">
                                <i className="fas fa-crown"></i> Mentor
                            </div>
                        )}
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-xl relative mt-4">
                            <i className="fas fa-user text-4xl text-primary"></i>
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {profile.firstName} {profile.lastName}
                        </CardTitle>
                        <p className="text-muted-foreground mb-4 uppercase text-[10px] tracking-[0.2em] font-black mt-2">
                            {profile.filiere} • {level === 1 ? 'S1/S2' : 'S3/S4'}
                        </p>

                        <div className="flex justify-center gap-2 mb-6">
                            <Button
                                variant={isStarred ? "default" : "outline"}
                                className={cn("gap-2 transition-all rounded-full h-11 px-6", isStarred && "bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white shadow-lg shadow-yellow-500/20")}
                                onClick={handleStar}
                            >
                                <i className={cn(isStarred ? "fas" : "far", "fa-star")}></i>
                                <span className="font-bold">{starCount} Stars</span>
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full w-11 h-11" onClick={copyProfileLink}>
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-6 bg-muted/20 rounded-2xl p-4">
                            <div>
                                <p className="text-2xl font-black text-primary">{contributionsCount}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ressources</p>
                            </div>
                            <div className="border-l border-muted-foreground/10">
                                <p className="text-2xl font-black text-primary">{Object.keys(profile.blogs || {}).length}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Articles</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-wider">
                                <i className="fas fa-medal text-primary"></i> Succès
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-wrap gap-2">
                            {contributionsCount >= 1 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold text-[10px]" title="A partagé au moins une ressource">
                                    CONTRIBUTEUR
                                </Badge>
                            )}
                            {contributionsCount >= 10 && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold text-[10px]" title="A partagé plus de 10 ressources">
                                    MAJOR CONTRIB
                                </Badge>
                            )}
                            {starCount >= 5 && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-[10px]" title="A reçu plus de 5 stars">
                                    POPULAIRE
                                </Badge>
                            )}
                            {Object.keys(profile.blogs || {}).length >= 1 && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px]" title="A publié au moins un article">
                                    AUTEUR
                                </Badge>
                            )}
                            {level === 2 && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px]" title="Étudiant en deuxième année">
                                    ANCIEN
                                </Badge>
                            )}
                            {contributionsCount === 0 && Object.keys(profile.blogs || {}).length === 0 && (
                                <span className="text-[10px] text-muted-foreground italic">Aucun badge pour le moment.</span>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-wider">
                                <i className="fas fa-info-circle text-primary"></i> À propos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm pt-0">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="truncate">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <span>Promotion {profile.startYear}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span>Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content: Feed */}
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                                <i className="fas fa-book-open text-primary"></i> Contributions
                            </h2>
                            <Badge variant="outline" className="font-bold">{contributionsCount} partages</Badge>
                        </div>
                        <div className="grid gap-4">
                            {profile.contributions ? (
                                Object.entries(profile.contributions).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([id, item]) => (
                                    <Card key={id} className="hover:shadow-md transition-all cursor-pointer border-l-4 border-primary group">
                                        <CardContent className="p-5 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{item.module}</span>
                                                    • {new Date(item.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Ouvrir <i className="fas fa-external-link-alt text-[10px]"></i>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl bg-muted/5 text-center px-10">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <i className="fas fa-folder-open text-muted-foreground text-2xl"></i>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Aucune contribution</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Cet étudiant n'a pas encore partagé de ressources avec la communauté.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                            <i className="fas fa-feather-pointed text-primary"></i> Articles de blog
                        </h2>
                        <div className="grid gap-4">
                            {profile.blogs ? (
                                Object.entries(profile.blogs).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([id, item]) => (
                                    <Card key={id} className="hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-4 border-blue-500 group">
                                        <CardContent className="p-5 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors">{item.title}</h3>
                                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-widest">
                                                    <i className="far fa-clock"></i> {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                <i className="fas fa-chevron-right"></i>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl bg-muted/5 text-center px-10">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <i className="fas fa-pen-nib text-muted-foreground text-2xl"></i>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Pas d'articles</h3>
                                    <p className="text-sm text-muted-foreground">Aucun article de blog publié pour le moment.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
