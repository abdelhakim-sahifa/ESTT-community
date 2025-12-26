'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, push, set, update, remove } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin } from '@/lib/clubUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, FileText, Megaphone, Calendar, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ClubAdminPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('info');

    // Club info editing
    const [editingInfo, setEditingInfo] = useState(false);
    const [clubInfo, setClubInfo] = useState({ description: '' });

    // Post creation
    const [newPost, setNewPost] = useState({ type: 'article', title: '', content: '' });
    const [submittingPost, setSubmittingPost] = useState(false);

    // Change request
    const [changeRequest, setChangeRequest] = useState({ type: 'name', newName: '' });
    const [submittingChange, setSubmittingChange] = useState(false);

    // Posts list
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (clubId && !authLoading) {
            fetchClubData();
        }
    }, [clubId, authLoading]);

    useEffect(() => {
        if (club && user) {
            const adminStatus = isClubAdmin(user.email, club);
            setIsAdmin(adminStatus);

            if (!adminStatus) {
                setTimeout(() => {
                    router.push(`/clubs/${clubId}`);
                }, 2000);
            }
        }
    }, [club, user]);

    const fetchClubData = async () => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            const clubRef = ref(db, `clubs/${clubId}`);
            const clubSnap = await get(clubRef);

            if (!clubSnap.exists()) {
                router.push('/clubs');
                return;
            }

            const clubData = { id: clubId, ...clubSnap.val() };
            setClub(clubData);
            setClubInfo({ description: clubData.description || '' });

            // Fetch posts
            const postsRef = ref(db, `clubPosts/${clubId}`);
            const postsSnap = await get(postsRef);

            if (postsSnap.exists()) {
                const postsData = postsSnap.val();
                const postsArray = Object.entries(postsData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.createdAt - a.createdAt);
                setPosts(postsArray);
            }
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async () => {
        setMessage('');
        setEditingInfo(true);

        try {
            const clubRef = ref(db, `clubs/${clubId}`);
            await update(clubRef, {
                description: clubInfo.description
            });

            setClub(prev => ({ ...prev, description: clubInfo.description }));
            setMessage('Informations mises à jour avec succès');
            setEditingInfo(false);
        } catch (error) {
            console.error('Error updating club info:', error);
            setMessage('Erreur lors de la mise à jour');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setMessage('');
        setSubmittingPost(true);

        try {
            const postsRef = ref(db, `clubPosts/${clubId}`);
            const newPostRef = push(postsRef);

            const postData = {
                ...newPost,
                author: user.email,
                createdAt: Date.now()
            };

            await set(newPostRef, postData);

            setPosts(prev => [{ id: newPostRef.key, ...postData }, ...prev]);
            setNewPost({ type: 'article', title: '', content: '' });
            setMessage('Publication créée avec succès');
        } catch (error) {
            console.error('Error creating post:', error);
            setMessage('Erreur lors de la création de la publication');
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const postRef = ref(db, `clubPosts/${clubId}/${postId}`);
            await remove(postRef);
            setPosts(prev => prev.filter(p => p.id !== postId));
            setMessage('Publication supprimée');
        } catch (error) {
            console.error('Error deleting post:', error);
            setMessage('Erreur lors de la suppression');
        }
    };

    const handleSubmitChangeRequest = async (e) => {
        e.preventDefault();
        setMessage('');
        setSubmittingChange(true);

        try {
            const requestsRef = ref(db, 'clubChangeRequests');
            const newRequestRef = push(requestsRef);

            const requestData = {
                clubId,
                clubName: club.name,
                changeType: changeRequest.type,
                newData: changeRequest.type === 'name'
                    ? { name: changeRequest.newName }
                    : changeRequest.newOrgChart,
                requestedBy: user.email,
                requestedAt: Date.now(),
                status: 'pending'
            };

            await set(newRequestRef, requestData);

            setMessage('Demande de modification envoyée aux administrateurs');
            setChangeRequest({ type: 'name', newName: '' });
        } catch (error) {
            console.error('Error submitting change request:', error);
            setMessage('Erreur lors de l\'envoi de la demande');
        } finally {
            setSubmittingChange(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Connexion requise</CardTitle>
                        <CardDescription>Vous devez être connecté pour accéder à cette page</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-12 pb-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
                        <p className="text-muted-foreground mb-4">
                            Vous n'êtes pas autorisé à gérer ce club. Seuls les membres de l'organigramme peuvent accéder à cette page.
                        </p>
                        <Button asChild>
                            <Link href={`/clubs/${clubId}`}>Retour au club</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href={`/clubs/${clubId}`}>
                            <ArrowLeft className="w-4 h-4" />
                            Retour au club
                        </Link>
                    </Button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Gestion du club</h1>
                    <p className="text-muted-foreground">{club?.name}</p>
                </div>

                {message && (
                    <Alert className={message.includes('succès') || message.includes('envoyée') ? 'border-green-500 bg-green-50 mb-6' : 'mb-6'}>
                        {message.includes('succès') || message.includes('envoyée') ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
                        <TabsTrigger value="info">Infos</TabsTrigger>
                        <TabsTrigger value="posts">Publications</TabsTrigger>
                        <TabsTrigger value="create">Créer</TabsTrigger>
                        <TabsTrigger value="changes">Modifications</TabsTrigger>
                    </TabsList>

                    {/* Club Info Tab */}
                    <TabsContent value="info">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations du club</CardTitle>
                                <CardDescription>
                                    Modifiez la description et les activités du club
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom du club</Label>
                                    <Input value={club?.name} disabled />
                                    <p className="text-xs text-muted-foreground">
                                        Le nom ne peut pas être modifié directement. Utilisez l'onglet "Modifications" pour soumettre une demande.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={clubInfo.description}
                                        onChange={(e) => setClubInfo({ description: e.target.value })}
                                        rows={6}
                                        disabled={editingInfo}
                                    />
                                </div>

                                <Button onClick={handleUpdateInfo} disabled={editingInfo}>
                                    {editingInfo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        'Enregistrer les modifications'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Posts Management Tab */}
                    <TabsContent value="posts">
                        <Card>
                            <CardHeader>
                                <CardTitle>Publications du club</CardTitle>
                                <CardDescription>
                                    Gérez les articles, annonces et activités publiés
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {posts.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Aucune publication pour le moment
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {posts.map(post => (
                                            <Card key={post.id} className="border-muted">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg">{post.title}</CardTitle>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {new Date(post.createdAt).toLocaleDateString('fr-FR')} • {post.type === 'article' ? 'Article' : post.type === 'announcement' ? 'Annonce' : 'Activité'}
                                                            </p>
                                                        </div>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Supprimer la publication</DialogTitle>
                                                                    <DialogDescription>
                                                                        Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={() => { }}>Annuler</Button>
                                                                    <Button variant="destructive" onClick={() => handleDeletePost(post.id)}>
                                                                        Supprimer
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                        {post.content}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Create Post Tab */}
                    <TabsContent value="create">
                        <Card>
                            <CardHeader>
                                <CardTitle>Créer une publication</CardTitle>
                                <CardDescription>
                                    Publiez un article, une annonce ou une activité
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreatePost} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Type de publication</Label>
                                        <Select
                                            value={newPost.type}
                                            onValueChange={(v) => setNewPost(prev => ({ ...prev, type: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="article">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Article
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="announcement">
                                                    <div className="flex items-center gap-2">
                                                        <Megaphone className="w-4 h-4" />
                                                        Annonce
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="activity">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Activité
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Titre</Label>
                                        <Input
                                            id="title"
                                            value={newPost.title}
                                            onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Titre de la publication"
                                            required
                                            disabled={submittingPost}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content">Contenu</Label>
                                        <Textarea
                                            id="content"
                                            value={newPost.content}
                                            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Contenu de la publication..."
                                            rows={8}
                                            required
                                            disabled={submittingPost}
                                        />
                                    </div>

                                    <Button type="submit" disabled={submittingPost}>
                                        {submittingPost ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Publication...
                                            </>
                                        ) : (
                                            'Publier'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Change Requests Tab */}
                    <TabsContent value="changes">
                        <Card>
                            <CardHeader>
                                <CardTitle>Demandes de modification</CardTitle>
                                <CardDescription>
                                    Soumettez une demande pour modifier le nom du club ou l'organigramme
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert className="mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Les modifications du nom et de l'organigramme doivent être approuvées par les administrateurs de la plateforme.
                                    </AlertDescription>
                                </Alert>

                                <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Type de modification</Label>
                                        <Select
                                            value={changeRequest.type}
                                            onValueChange={(v) => setChangeRequest(prev => ({ ...prev, type: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name">Nom du club</SelectItem>
                                                <SelectItem value="organizationalChart">Organigramme</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {changeRequest.type === 'name' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="newName">Nouveau nom</Label>
                                            <Input
                                                id="newName"
                                                value={changeRequest.newName}
                                                onChange={(e) => setChangeRequest(prev => ({ ...prev, newName: e.target.value }))}
                                                placeholder="Nouveau nom du club"
                                                required
                                                disabled={submittingChange}
                                            />
                                        </div>
                                    )}

                                    {changeRequest.type === 'organizationalChart' && (
                                        <Alert>
                                            <AlertDescription>
                                                Pour modifier l'organigramme, veuillez contacter les administrateurs directement avec les détails des changements souhaités.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={submittingChange || (changeRequest.type === 'name' && !changeRequest.newName)}
                                    >
                                        {submittingChange ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Envoi...
                                            </>
                                        ) : (
                                            'Soumettre la demande'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
