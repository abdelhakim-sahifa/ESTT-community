'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, update, remove, onValue } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Search,
    RefreshCw,
    Shield,
    CheckCircle2,
    Clock,
    BookOpen,
    Star,
    ExternalLink,
    Pencil,
    Trash2,
    MoreVertical,
    Check,
    X,
    User,
    Calendar,
    GraduationCap,
    Inbox
} from 'lucide-react';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [fields, setFields] = useState({});
    const [semesters, setSemesters] = useState({});
    const [modules, setModules] = useState({});

    // UI State
    const [currentTab, setCurrentTab] = useState('overview');
    const [filters, setFilters] = useState({
        search: '',
        semester: 'all',
        field: 'all',
        type: 'all',
        status: 'all'
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editResource, setEditResource] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        link: '',
        type: 'exam',
        professor: ''
    });

    // Check Admin Status
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const checkAdmin = async () => {
            try {
                const adminsSnapshot = await get(ref(db, 'Admins'));
                if (!adminsSnapshot.exists()) {
                    console.error('Admins list not found');
                    router.push('/');
                    return;
                }

                const adminsList = adminsSnapshot.val();
                const isUserAdmin = Array.isArray(adminsList)
                    ? adminsList.includes(user.email)
                    : Object.values(adminsList).includes(user.email);

                if (isUserAdmin) {
                    setIsAdmin(true);
                    fetchMetadata();
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [user, authLoading, router]);

    // Fetch Metadata
    const fetchMetadata = async () => {
        try {
            const [fieldsSnap, semestersSnap, modulesSnap] = await Promise.all([
                get(ref(db, 'fields')),
                get(ref(db, 'semesters')),
                get(ref(db, 'modules'))
            ]);

            if (fieldsSnap.exists()) setFields(fieldsSnap.val());
            if (semestersSnap.exists()) setSemesters(semestersSnap.val());
            if (modulesSnap.exists()) setModules(modulesSnap.val());
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    // Listen to Resources
    useEffect(() => {
        if (!isAdmin) return;

        const resourcesRef = ref(db, 'resources');
        const unsubscribe = onValue(resourcesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const loadedResources = [];

                Object.entries(data).forEach(([moduleId, moduleResources]) => {
                    if (typeof moduleResources === 'object') {
                        Object.entries(moduleResources).forEach(([resourceId, resource]) => {
                            loadedResources.push({
                                moduleId,
                                resourceId,
                                ...resource
                            });
                        });
                    }
                });

                setResources(loadedResources);
            } else {
                setResources([]);
            }
        });

        return () => unsubscribe();
    }, [isAdmin]);

    // Filtering Logic
    useEffect(() => {
        let result = [...resources];

        // Tab filtering
        if (currentTab === 'pending') {
            result = result.filter(r => r.unverified === true);
        } else if (currentTab === 'all') {
            if (filters.status === 'pending') {
                result = result.filter(r => r.unverified === true);
            } else if (filters.status === 'approved') {
                result = result.filter(r => !r.unverified);
            }
        }

        // Common filters
        if (filters.semester !== 'all') {
            result = result.filter(r => r.semester === filters.semester);
        }
        if (filters.field !== 'all') {
            result = result.filter(r => r.field === filters.field);
        }
        if (filters.type !== 'all') {
            result = result.filter(r => r.type === filters.type);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(r =>
                (r.title || '').toLowerCase().includes(search) ||
                (r.professor || '').toLowerCase().includes(search)
            );
        }

        setFilteredResources(result);
    }, [resources, currentTab, filters]);

    // Actions
    const handleApprove = async (moduleId, resourceId) => {
        try {
            await update(ref(db, `resources/${moduleId}/${resourceId}`), {
                unverified: false
            });
        } catch (error) {
            console.error('Error approving:', error);
        }
    };

    const handleDelete = async (moduleId, resourceId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) return;
        try {
            await remove(ref(db, `resources/${moduleId}/${resourceId}`));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleEditClick = (resource) => {
        setEditResource(resource);
        setEditForm({
            title: resource.title || '',
            link: resource.link || '',
            type: resource.type || 'exam',
            professor: resource.professor || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editResource) return;

        try {
            await update(ref(db, `resources/${editResource.moduleId}/${editResource.resourceId}`), {
                title: editForm.title.trim(),
                link: editForm.link.trim(),
                type: editForm.type,
                professor: editForm.professor.trim()
            });
            setIsEditModalOpen(false);
            setEditResource(null);
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'exam': return <BookOpen className="w-4 h-4" />;
            case 'td': return <Pencil className="w-4 h-4" />;
            case 'course': return <Star className="w-4 h-4" />;
            case 'video': return <ExternalLink className="w-4 h-4" />;
            default: return <BookOpen className="w-4 h-4" />;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const stats = {
        pending: resources.filter(r => r.unverified).length,
        approved: resources.filter(r => !r.unverified).length,
        total: resources.length,
        today: resources.filter(r => {
            if (!r.created_at) return false;
            return new Date(r.created_at).toDateString() === new Date().toDateString();
        }).length
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Chargement du tableau de bord...</p>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="container py-12 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Espace Administration</h1>
                    </div>
                    <p className="text-muted-foreground">Gérez le contenu communautaire et les validations.</p>
                </div>
                <Button variant="outline" size="lg" className="gap-2 shrink-0 h-11" onClick={fetchMetadata}>
                    <RefreshCw className="w-4 h-4" />
                    Actualiser les données
                </Button>
            </header>

            <Tabs defaultValue="overview" className="w-full space-y-8" onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-md h-12 p-1 bg-muted/50">
                    <TabsTrigger value="overview" className="h-full data-[state=active]:shadow-sm">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="pending" className="h-full relative data-[state=active]:shadow-sm">
                        Validation
                        {stats.pending > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold border-2 border-background">
                                {stats.pending}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="h-full data-[state=active]:shadow-sm">Ressources</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 border-none p-0 outline-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="shadow-sm border-orange-500/20 bg-orange-50/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                                <p className="text-xs text-muted-foreground mt-1">Nécessitent une vérification</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-green-500/20 bg-green-50/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                                <p className="text-xs text-muted-foreground mt-1">Actuellement visibles</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-primary/20 bg-primary/5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total</CardTitle>
                                <BookOpen className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                                <p className="text-xs text-muted-foreground mt-1">Ressources en base</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-indigo-500/20 bg-indigo-50/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                                <Star className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-600">{stats.today}</div>
                                <p className="text-xs text-muted-foreground mt-1">Nouvelles contributions</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-muted-foreground/10">
                        <CardHeader>
                            <CardTitle>Dernières activités</CardTitle>
                            <CardDescription>Vue rapide des ressources récemment ajoutées ou modifiées.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground">
                                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>Fonctionnalité d'historique bientôt disponible.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {(currentTab === 'pending' || currentTab === 'all') && (
                    <TabsContent value={currentTab} className="space-y-6 border-none p-0 outline-none">
                        <section className="bg-muted/30 p-6 rounded-xl border space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative group lg:col-span-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Titre, professeur..."
                                        className="pl-9 h-10 bg-background"
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    />
                                </div>
                                <Select value={filters.semester} onValueChange={(v) => setFilters(prev => ({ ...prev, semester: v }))}>
                                    <SelectTrigger className="h-10 bg-background">
                                        <SelectValue placeholder="Tous les semestres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les semestres</SelectItem>
                                        {Object.entries(semesters).map(([id, val]) => (
                                            <SelectItem key={id} value={id}>{val.name || val}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.field} onValueChange={(v) => setFilters(prev => ({ ...prev, field: v }))}>
                                    <SelectTrigger className="h-10 bg-background">
                                        <SelectValue placeholder="Toutes les filières" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les filières</SelectItem>
                                        {Object.entries(fields).map(([id, val]) => (
                                            <SelectItem key={id} value={id}>{val.name || val}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.type} onValueChange={(v) => setFilters(prev => ({ ...prev, type: v }))}>
                                    <SelectTrigger className="h-10 bg-background">
                                        <SelectValue placeholder="Tous les types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les types</SelectItem>
                                        <SelectItem value="exam">Examen</SelectItem>
                                        <SelectItem value="td">TD</SelectItem>
                                        <SelectItem value="course">Cours</SelectItem>
                                        <SelectItem value="video">Vidéo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.length === 0 ? (
                                <div className="col-span-full py-20 text-center flex flex-col items-center border-2 border-dashed rounded-xl bg-muted/20">
                                    <Inbox className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                                    <h3 className="text-xl font-medium text-muted-foreground">Aucune ressource trouvée</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Ajustez vos filtres ou revenez plus tard.</p>
                                </div>
                            ) : (
                                filteredResources.map(resource => (
                                    <Card key={`${resource.moduleId}-${resource.resourceId}`}
                                        className={`group relative overflow-hidden transition-all hover:shadow-md border-muted-foreground/10 ${resource.unverified ? 'ring-1 ring-orange-500/20 bg-orange-50/5' : ''}`}>
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <Badge variant={resource.unverified ? "outline" : "secondary"} className="mb-2 gap-1 uppercase text-[10px]">
                                                    {getTypeIcon(resource.type)}
                                                    {resource.type}
                                                </Badge>
                                                {resource.unverified && <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-[10px]">EN ATTENTE</Badge>}
                                            </div>
                                            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors pr-6">
                                                {resource.title || 'Sans titre'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pb-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="line-clamp-1">{resource.professor || 'Prof. N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                    <span className="line-clamp-1">{fields[resource.field]?.name || fields[resource.field] || resource.field}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formatDate(resource.created_at || resource.date)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-4 border-t gap-2 bg-muted/10">
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" asChild>
                                                <a href={resource.url || resource.link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => handleEditClick(resource)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <div className="ml-auto flex gap-2">
                                                {resource.unverified && (
                                                    <Button variant="default" size="sm" className="h-9 px-3 gap-1 bg-green-600 hover:bg-green-700 font-medium" onClick={() => handleApprove(resource.moduleId, resource.resourceId)}>
                                                        <Check className="h-4 w-4" />
                                                        Approuver
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(resource.moduleId, resource.resourceId)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Modifier la ressource</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations de la ressource. Les changements sont instantanés.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Titre</Label>
                                <Input
                                    id="edit-title"
                                    required
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-link">Lien / URL</Label>
                                <Input
                                    id="edit-link"
                                    type="url"
                                    required
                                    value={editForm.link}
                                    onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Type</Label>
                                    <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                                        <SelectTrigger id="edit-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="exam">Examen</SelectItem>
                                            <SelectItem value="td">TD</SelectItem>
                                            <SelectItem value="course">Cours</SelectItem>
                                            <SelectItem value="video">Vidéo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-professor">Professeur</Label>
                                    <Input
                                        id="edit-professor"
                                        value={editForm.professor}
                                        onChange={e => setEditForm({ ...editForm, professor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                            <Button type="submit">Enregistrer les modifications</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
