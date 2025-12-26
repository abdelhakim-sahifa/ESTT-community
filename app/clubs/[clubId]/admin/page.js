'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, push, set, update, remove } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin, uploadClubImage } from '@/lib/clubUtils';
import { db as staticDb } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, FileText, Megaphone, Calendar, Edit, Trash2, Plus, Upload } from 'lucide-react';
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
    const [clubInfo, setClubInfo] = useState({ description: '', themeColor: '#64748b' });

    // Post creation
    const [newPost, setNewPost] = useState({ type: 'article', title: '', content: '' });
    const [postImage, setPostImage] = useState(null);
    const [uploadingPostImage, setUploadingPostImage] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);

    // Change request
    const [changeRequest, setChangeRequest] = useState({ type: 'name', newName: '', newOrgChart: {} });
    const [submittingChange, setSubmittingChange] = useState(false);
    const [orgChartItems, setOrgChartItems] = useState([]); // For editing organigram

    // Members management
    const [newMember, setNewMember] = useState({ name: '', email: '', filiere: '' });
    const [addingMember, setAddingMember] = useState(false);

    // Logo upload
    const [logoFile, setLogoFile] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

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

            // Check if president
            const presidentKey = Object.keys(club.organizationalChart || {}).find(k =>
                club.organizationalChart[k].role.toLowerCase() === 'président'
            );
            const isPresident = presidentKey && club.organizationalChart[presidentKey].email === user.email;

            // Initialize org chart for editing if needed
            if (club.organizationalChart) {
                const items = Object.entries(club.organizationalChart).map(([key, val], idx) => ({
                    id: idx + 1,
                    key, // original key
                    ...val
                }));
                setOrgChartItems(items);
                // Also set initial newOrgChart
                setChangeRequest(prev => ({ ...prev, newOrgChart: club.organizationalChart }));
            }

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
            setClubInfo({
                description: clubData.description || '',
                themeColor: clubData.themeColor || '#64748b'
            });

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
            let updates = {
                description: clubInfo.description,
                themeColor: clubInfo.themeColor
            };

            if (logoFile) {
                const logoUrl = await uploadClubImage(logoFile);
                updates.logo = logoUrl;
                setClub(prev => ({ ...prev, logo: logoUrl }));
            }

            await update(clubRef, updates);

            setClub(prev => ({
                ...prev,
                description: clubInfo.description,
                themeColor: clubInfo.themeColor
            }));
            setMessage('Informations mises à jour avec succès');
            setEditingInfo(false);
            setLogoFile(null);
            setUploadingLogo(false);
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
            let imageUrl = '';
            if (postImage) {
                setUploadingPostImage(true);
                imageUrl = await uploadClubImage(postImage);
                setUploadingPostImage(false);
            }

            const postsRef = ref(db, `clubPosts/${clubId}`);
            const newPostRef = push(postsRef);

            const postData = {
                ...newPost,
                imageUrl,
                author: user.email,
                createdAt: Date.now()
            };

            await set(newPostRef, postData);

            setPosts(prev => [{ id: newPostRef.key, ...postData }, ...prev]);
            setNewPost({ type: 'article', title: '', content: '' });
            setPostImage(null);
            setMessage('Publication créée avec succès');
        } catch (error) {
            console.error('Error creating post:', error);
            setMessage('Erreur lors de la création de la publication');
            setUploadingPostImage(false);
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

    const handleAddMember = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!newMember.name || !newMember.email) return;

        setAddingMember(true);
        try {
            const currentMembers = club.members || [];
            const updatedMembers = [...currentMembers, { ...newMember, id: Date.now() }];

            await update(ref(db, `clubs/${clubId}`), {
                members: updatedMembers
            });

            setClub(prev => ({ ...prev, members: updatedMembers }));
            setNewMember({ name: '', email: '', filiere: '' });
            setMessage('Membre ajouté avec succès');
        } catch (error) {
            console.error('Error adding member:', error);
            setMessage('Erreur lors de l\'ajout du membre');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

        try {
            const currentMembers = club.members || [];
            const updatedMembers = currentMembers.filter(m => m.email !== memberEmail);

            await update(ref(db, `clubs/${clubId}`), {
                members: updatedMembers
            });

            setClub(prev => ({ ...prev, members: updatedMembers }));
            setMessage('Membre supprimé avec succès');
        } catch (error) {
            console.error('Error removing member:', error);
            setMessage('Erreur lors de la suppression');
        }
    };

    // Update org chart items state handler
    const handleOrgChartItemChange = (id, field, value) => {
        setOrgChartItems(prev => {
            const newItems = prev.map(item => item.id === id ? { ...item, [field]: value } : item);

            // Reconstruct organizationalChart object
            const newOrgChart = {};
            newItems.forEach(item => {
                const key = item.role.toLowerCase().replace(/\s+/g, '');
                newOrgChart[key] = {
                    name: item.name,
                    email: item.email,
                    role: item.role,
                    filiere: item.filiere,
                    photo: item.photo || ''
                };
            });
            setChangeRequest(r => ({ ...r, newOrgChart }));

            return newItems;
        });
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
                        <TabsTrigger value="members">Membres</TabsTrigger>
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
                                    <Label>Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                            {logoFile ? (
                                                <img
                                                    src={URL.createObjectURL(logoFile)}
                                                    alt="New logo"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={club.logo}
                                                    alt="Current logo"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setLogoFile(e.target.files[0]);
                                                }}
                                                disabled={editingInfo}
                                            />
                                        </div>
                                    </div>
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

                                <div className="space-y-2">
                                    <Label htmlFor="themeColor">Couleur du thème</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="color"
                                            id="themeColor"
                                            value={clubInfo.themeColor}
                                            onChange={(e) => setClubInfo(prev => ({ ...prev, themeColor: e.target.value }))}
                                            className="w-20 h-10 p-1 cursor-pointer"
                                            disabled={editingInfo}
                                        />
                                        <div
                                            className="w-10 h-10 rounded-full border shadow-sm"
                                            style={{ backgroundColor: clubInfo.themeColor }}
                                        />
                                        <span className="text-sm text-muted-foreground font-mono">{clubInfo.themeColor}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Cette couleur sera utilisée comme thème pour votre page et comme fond par défaut pour les annonces sans image.
                                    </p>
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

                    {/* Members Tab */}
                    <TabsContent value="members">
                        <Card>
                            <CardHeader>
                                <CardTitle>Membres du club</CardTitle>
                                <CardDescription>Gérez les membres réguliers de votre club.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Member Form */}
                                <div className="p-4 bg-slate-50 rounded-lg border">
                                    <h3 className="text-sm font-semibold mb-3">Ajouter un membre</h3>
                                    <form onSubmit={handleAddMember} className="grid sm:grid-cols-4 gap-3">
                                        <Input
                                            placeholder="Nom complet"
                                            value={newMember.name}
                                            onChange={(e) => setNewMember(p => ({ ...p, name: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            placeholder="Email"
                                            type="email"
                                            value={newMember.email}
                                            onChange={(e) => setNewMember(p => ({ ...p, email: e.target.value }))}
                                            required
                                        />
                                        <Select
                                            value={newMember.filiere}
                                            onValueChange={(v) => setNewMember(p => ({ ...p, filiere: v }))}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
                                            <SelectContent>
                                                {staticDb.fields.map(f => (
                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="submit" disabled={addingMember}>
                                            <Plus className="w-4 h-4 mr-2" /> Ajouter
                                        </Button>
                                    </form>
                                </div>

                                {/* Members List */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">Liste des membres ({club?.members?.length || 0})</h3>
                                    {(club?.members || []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">Aucun membre enregistré.</p>
                                    ) : (
                                        <div className="grid gap-2">
                                            {club.members.map((member, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                                    <div>
                                                        <p className="font-medium text-sm">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="text-xs">{member.filiere}</Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveMember(member.email)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                        <Label>Image (optionnel)</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setPostImage(e.target.files[0]);
                                                }}
                                                disabled={submittingPost}
                                            />
                                            {postImage && (
                                                <div className="text-sm text-green-600 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Image sélectionnée
                                                </div>
                                            )}
                                        </div>
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
                                        <div className="space-y-4">
                                            {(!user || !club.organizationalChart || !Object.entries(club.organizationalChart).find(([_, m]) => m.email === user.email && m.role.toLowerCase() === 'président')) ? (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Seul le Président du club est autorisé à modifier l'organigramme.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : (
                                                <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                                                    <h3 className="font-medium text-sm mb-2">Modifier l'organigramme</h3>
                                                    {orgChartItems.map((item) => (
                                                        <div key={item.id} className="bg-white p-3 border rounded space-y-3">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Rôle</Label>
                                                                    <Input
                                                                        value={item.role}
                                                                        onChange={(e) => handleOrgChartItemChange(item.id, 'role', e.target.value)}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Nom</Label>
                                                                    <Input
                                                                        value={item.name}
                                                                        onChange={(e) => handleOrgChartItemChange(item.id, 'name', e.target.value)}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Email</Label>
                                                                    <Input
                                                                        value={item.email}
                                                                        onChange={(e) => handleOrgChartItemChange(item.id, 'email', e.target.value)}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-muted-foreground">
                                                        Note: Cette action soumettra une demande de validation aux administrateurs.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
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
