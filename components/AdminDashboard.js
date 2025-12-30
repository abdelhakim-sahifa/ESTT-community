'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue, update, remove, get } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Users,
    AlertCircle,
    CheckCircle2,
    Trash2,
    ExternalLink,
    Search,
    Filter,
    MoreVertical,
    Eye,
    ShieldCheck,
    Loader2,
    MessageSquare,
    ArrowUpRight,
    Clock,
    User,
    ChevronRight,
    Info,
    Building2,
    Edit3,
    Megaphone,
    Settings,
    Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        resources: 0,
        pending: 0
    });
    const [resources, setResources] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [clubRequests, setClubRequests] = useState([]);
    const [clubChangeRequests, setClubChangeRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, resources, users, reports, clubRequests, clubChangeRequests, announcements, settings
    // Notification Settings
    const [notificationSettings, setNotificationSettings] = useState({
        enabled: true,
        email: 'thevcercle@gmail.com'
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [adminAnnouncements, setAdminAnnouncements] = useState([]);
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        imageUrl: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Admin Check
    useEffect(() => {
        if (authLoading) return;
        if (!user || profile?.role !== 'admin') {
            router.push('/');
        }
    }, [user, profile, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user || profile?.role !== 'admin') return;
        if (!db) return;

        const resourcesRef = ref(db, 'resources');
        const blogsRef = ref(db, 'blog_posts');
        const usersRef = ref(db, 'users');
        const reportsRef = ref(db, 'reports');

        const unsubResources = onValue(resourcesRef, (snapshot) => {
            const data = snapshot.val() || {};
            // Helper to flatten nested and determine nature
            let list = [];
            Object.entries(data).forEach(([key, val]) => {
                if (val.unverified === true) {
                    // Check if it's a direct resource or a module container
                    if (val.type) { // It has a type, likely a resource
                        list.push({ id: key, ...val });
                    } else {
                        // Likely a module container, check children
                        Object.entries(val).forEach(([childKey, childVal]) => {
                            if (childVal.unverified === true) {
                                list.push({ id: childKey, ...childVal, _isNested: true, moduleId: key });
                            }
                        });
                    }
                }
            });
            setResources(list);
            setStats(prev => ({ ...prev, resources: list.length, pending: list.filter(r => r.unverified).length }));
        });



        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setUsers(list);
            setStats(prev => ({ ...prev, users: list.length }));
        });

        const unsubReports = onValue(reportsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setReports(list);
        });

        const clubRequestsRef = ref(db, 'clubRequests');
        const unsubClubRequests = onValue(clubRequestsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(req => req.status === 'pending');
            setClubRequests(list);
        });

        const clubChangeRequestsRef = ref(db, 'clubChangeRequests');
        const unsubClubChangeRequests = onValue(clubChangeRequestsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(req => req.status === 'pending');
            setClubChangeRequests(list);
        });

        const adminAnnouncementsRef = ref(db, 'adminAnnouncements');
        const unsubAdminAnnouncements = onValue(adminAnnouncementsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .sort((a, b) => b.createdAt - a.createdAt);
            setAdminAnnouncements(list);
        });

        // Fetch settings
        const settingsRef = ref(db, 'adminSettings/notifications');
        const unsubSettings = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setNotificationSettings(snapshot.val());
            } else {
                // Set default if not exists
                update(ref(db, 'adminSettings/notifications'), {
                    enabled: true,
                    email: 'thevcercle@gmail.com'
                });
            }
        });

        setLoading(false);

        return () => {
            unsubResources();
            unsubUsers();
            unsubReports();
            unsubClubRequests();
            unsubClubChangeRequests();
            unsubAdminAnnouncements();
            unsubSettings();
        };
    }, [user, profile, authLoading]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await update(ref(db, 'adminSettings/notifications'), notificationSettings);
            alert("Paramètres de notification mis à jour !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSavingSettings(false);
        }
    };

    const openRejectionModal = (type, item) => {
        setItemToReject({ type, data: item });
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const handleConfirmRejection = async () => {
        if (!itemToReject) return;
        setRejecting(true);

        try {
            if (itemToReject.type === 'resource') {
                await executeResourceRejection(itemToReject.data, rejectionReason);
            } else if (itemToReject.type === 'club') {
                await executeClubRejection(itemToReject.data, rejectionReason);
            }
        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors du rejet.");
        } finally {
            setRejecting(false);
            setRejectionModalOpen(false);
            setItemToReject(null);
        }
    };

    const executeResourceRejection = async (resource, reason) => {
        try {
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }

            await remove(ref(db, path));

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await remove(ref(db, profileContribPath));

                // Send Resource Rejected Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceRejectedEmail } = await import('@/lib/email-templates');
                            const html = resourceRejectedEmail(userData.firstName || 'Étudiant', resource.title, reason);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Mise à jour concernant ta contribution',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource rejection email:", err);
                }
            }
            // toast success?
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const executeClubRejection = async (request, reason) => {
        try {
            await update(ref(db, `clubRequests/${request.id}`), {
                status: 'rejected',
                rejectedAt: Date.now(),
                rejectionReason: reason
            });

            // Send Rejection Email
            if (request && request.requestedBy) {
                try {
                    const { clubRequestRejectedEmail } = await import('@/lib/email-templates');
                    const html = clubRequestRejectedEmail(request.clubName, reason);

                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: request.requestedBy,
                            subject: `Mise à jour demande de club : ${request.clubName}`,
                            html: html
                        })
                    });
                } catch (emailErr) {
                    console.error("Failed to send rejection email:", emailErr);
                }
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleApproveResource = async (resource) => {
        try {
            // Determine the path based on the flag we set in the listener
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }
            await update(ref(db, path), { unverified: null });

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await update(ref(db, profileContribPath), { unverified: null });

                // Send Resource Approved Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceApprovedEmail } = await import('@/lib/email-templates');
                            const resourceUrl = `https://estt-community.vercel.app/resources/${resource.id}`;
                            const html = resourceApprovedEmail(userData.firstName || 'Étudiant', resource.title, resourceUrl);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Ta ressource est en ligne !',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource approval email:", err);
                }
            }

            alert("Ressource approuvée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'approbation.");
        }
    };

    const handleDeleteResource = (resource) => {
        openRejectionModal('resource', resource);
    };



    const handleApproveClubRequest = async (requestId) => {
        if (!confirm("Approuver cette demande de club ?")) return;

        try {
            const { createClubFromRequest } = await import('@/lib/clubUtils');
            await createClubFromRequest(requestId);
            alert("Club créé avec succès !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création du club.");
        }
    };

    const handleRejectClubRequest = (request) => {
        openRejectionModal('club', request);
    };

    const handleApproveChangeRequest = async (request) => {
        if (!confirm("Approuver cette modification ?")) return;

        try {
            const clubRef = ref(db, `clubs/${request.clubId}`);

            if (request.changeType === 'name') {
                await update(clubRef, { name: request.newData.name });
            } else if (request.changeType === 'organizationalChart') {
                await update(clubRef, { organizationalChart: request.newData });
            }

            await update(ref(db, `clubChangeRequests/${request.id}`), {
                status: 'approved',
                approvedAt: Date.now()
            });

            alert("Modification approuvée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'approbation.");
        }
    };

    const handleRejectChangeRequest = async (requestId) => {
        if (!confirm("Rejeter cette demande de modification ?")) return;

        try {
            await update(ref(db, `clubChangeRequests/${requestId}`), {
                status: 'rejected',
                rejectedAt: Date.now()
            });
            alert("Demande rejetée.");
        } catch (err) {
            console.error(err);
            alert("Erreur lors du rejet.");
        }
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.title || !announcementForm.content) {
            alert("Le titre et le contenu sont obligatoires.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { push, set } = await import('@/lib/firebase');
            const newAnnRef = push(ref(db, 'adminAnnouncements'));
            await set(newAnnRef, {
                ...announcementForm,
                type: 'admin',
                createdAt: Date.now(),
                author: user.email
            });
            setAnnouncementForm({ title: '', content: '', imageUrl: '' });
            alert("Annonce publiée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la publication.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm("Supprimer cette annonce ?")) return;
        try {
            await remove(ref(db, `adminAnnouncements/${id}`));
            alert("Annonce supprimée.");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        }
    };

    if (authLoading || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            {/* Rejection Modal */}
            <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motif du rejet</DialogTitle>
                        <DialogDescription>
                            Veuillez indiquer la raison pour laquelle vous rejetez cet élément. Cette raison sera envoyée par email à l'utilisateur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Ex: Le fichier est illisible..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectionModalOpen(false)} disabled={rejecting}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmRejection} disabled={!rejectionReason.trim() || rejecting}>
                            {rejecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmer le rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    if (!user || profile?.role !== 'admin') {
        return null;
    }

    const filteredResources = resources.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.module?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row min-h-screen">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="font-black tracking-tight text-xl">Admin<span className="text-primary">Panel</span></span>
                    </div>

                    <nav className="flex flex-col gap-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('overview')}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Vue d'ensemble
                        </Button>
                        <Button
                            variant={activeTab === 'resources' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('resources')}
                        >
                            <FileText className="w-4 h-4" /> Ressources
                        </Button>

                        <Button
                            variant={activeTab === 'users' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('users')}
                        >
                            <Users className="w-4 h-4" /> Utilisateurs
                        </Button>
                        <Button
                            variant={activeTab === 'reports' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('reports')}
                        >
                            <AlertCircle className="w-4 h-4" /> Signalements
                            {reports.length > 0 && <Badge variant="destructive" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{reports.length}</Badge>}
                        </Button>
                        <Button
                            variant={activeTab === 'clubRequests' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('clubRequests')}
                        >
                            <Building2 className="w-4 h-4" /> Demandes de clubs
                            {clubRequests.length > 0 && <Badge variant="default" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{clubRequests.length}</Badge>}
                        </Button>
                        <Button
                            variant={activeTab === 'clubChangeRequests' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('clubChangeRequests')}
                        >
                            <Edit3 className="w-4 h-4" /> Modifications clubs
                            {clubChangeRequests.length > 0 && <Badge variant="default" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{clubChangeRequests.length}</Badge>}
                        </Button>
                        <Button
                            variant={activeTab === 'announcements' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('announcements')}
                        >
                            <Megaphone className="w-4 h-4" /> Annonces Globales
                        </Button>
                        <Button
                            variant={activeTab === 'settings' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings className="w-4 h-4" /> Paramètres
                        </Button>
                    </nav>

                    <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Connecté en tant que</p>
                        <p className="text-sm font-bold truncate">{profile?.firstName} {profile?.lastName}</p>
                        <Badge variant="outline" className="mt-2 bg-white text-[9px] font-black uppercase tracking-tighter border-primary/20 text-primary">Administrateur</Badge>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-grow p-6 md:p-10 overflow-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Tableau de bord</h1>
                                    <p className="text-muted-foreground">Bienvenue dans votre espace d'administration.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <ArrowUpRight className="w-4 h-4" /> Exporter
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-none shadow-sm bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-blue-100 text-blue-600">+12%</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
                                        <h3 className="text-3xl font-black mt-1">{stats.users}</h3>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-purple-100 text-purple-600">+5%</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ressources</p>
                                        <h3 className="text-3xl font-black mt-1">{stats.resources}</h3>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-primary text-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-white/20 text-white rounded-lg">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold opacity-80 uppercase tracking-wider">En attente</p>
                                        <h3 className="text-3xl font-black mt-1">{stats.pending}</h3>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">Dernières Ressources</CardTitle>
                                        <CardDescription>Les 5 ressources les plus récentes ajoutées.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {resources.slice(0, 5).map((res) => (
                                                <div key={res.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold truncate max-w-[200px]">{res.title}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">{res.module}</p>
                                                        </div>
                                                    </div>
                                                    {res.unverified ? (
                                                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">En attente</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100">Vérifié</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-primary" onClick={() => setActiveTab('resources')}>
                                            Voir tout <ArrowUpRight className="ml-2 w-3 h-3" />
                                        </Button>
                                    </CardContent>
                                </Card>


                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Gestion des Ressources</h1>
                                    <p className="text-muted-foreground">Approuvez, modifiez ou supprimez les ressources partagées.</p>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher..."
                                        className="pl-9 h-10 rounded-xl"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Card className="border-none shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Titre</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Module</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Auteur</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResources.map((res) => (
                                            <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-bold text-sm">{res.title}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground font-medium uppercase">{res.module}</TableCell>
                                                <TableCell className="text-xs font-bold">{res.authorName || 'Anonyme'}</TableCell>
                                                <TableCell>
                                                    {res.unverified ? (
                                                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">En attente</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100">Vérifié</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {res.unverified && (
                                                            <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-100 hover:bg-green-50" onClick={() => handleApproveResource(res)}>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" className="h-8 px-2" asChild>
                                                            <a href={res.url || res.link || res.file} target="_blank"><Eye className="w-4 h-4" /></a>
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 px-2 text-destructive border-destructive/10 hover:bg-destructive/5" onClick={() => handleDeleteResource(res)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}



                    {
                        activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Utilisateurs</h1>
                                        <p className="text-muted-foreground">Liste des membres de la communauté.</p>
                                    </div>
                                </div>

                                <Card className="border-none shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Nom</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Email</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Filière</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Rôle</TableHead>
                                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((u) => (
                                                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="font-bold text-sm">{u.firstName} {u.lastName}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                                                    <TableCell className="text-xs font-bold uppercase">{u.filiere}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-[8px] font-black uppercase tracking-tighter">
                                                            {u.role || 'Étudiant'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost" asChild>
                                                            <a href={`/profile/${u.id}`} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        )
                    }

                    {
                        activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Signalements</h1>
                                        <p className="text-muted-foreground">Contenu signalé par les utilisateurs.</p>
                                    </div>
                                </div>

                                {reports.length === 0 ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold">Aucun signalement</h3>
                                        <p className="text-muted-foreground text-sm">Tout semble en ordre pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {reports.map((report) => (
                                            <Card key={report.id} className="border-none shadow-sm">
                                                <CardContent className="p-6 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                                                            <AlertCircle className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{report.reason}</p>
                                                            <p className="text-xs text-muted-foreground">Signalé par {report.reporterName} • {new Date(report.timestamp).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm">Ignorer</Button>
                                                        <Button variant="destructive" size="sm">Supprimer le contenu</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        activeTab === 'clubRequests' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Demandes de clubs</h1>
                                        <p className="text-muted-foreground">Approuvez ou rejetez les demandes de création de clubs.</p>
                                    </div>
                                </div>

                                {clubRequests.length === 0 ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold">Aucune demande en attente</h3>
                                        <p className="text-muted-foreground text-sm">Toutes les demandes ont été traitées.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {clubRequests.map((request) => (
                                            <Card key={request.id} className="border-none shadow-sm">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-xl">{request.clubName}</CardTitle>
                                                            <CardDescription className="mt-2">
                                                                Demandé par {request.requestedBy} • {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase">En attente</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <p className="text-sm font-bold mb-1">Description</p>
                                                        <p className="text-sm text-muted-foreground">{request.description}</p>
                                                    </div>

                                                    {request.logoUrl && (
                                                        <div>
                                                            <p className="text-sm font-bold mb-2">Logo</p>
                                                            <img src={request.logoUrl} alt="Club logo" className="w-20 h-20 rounded-lg object-cover border" />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-sm font-bold mb-2">Organigramme ({Object.keys(request.organizationalChart || {}).length} positions)</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {Object.entries(request.organizationalChart || {}).map(([key, member]) => (
                                                                <div key={key} className="p-3 bg-slate-50 rounded-lg border">
                                                                    <p className="text-xs font-bold">{member.role}</p>
                                                                    <p className="text-xs text-muted-foreground">{member.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{member.email}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {request.members && request.members.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-bold mb-2">Membres ({request.members.length})</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {request.members.map(m => m.name).join(', ')}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-4 border-t">
                                                        <Button
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => handleApproveClubRequest(request.id)}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Approuver
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleRejectClubRequest(request)}>Refuser</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        activeTab === 'clubChangeRequests' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Demandes de modification</h1>
                                        <p className="text-muted-foreground">Gérez les demandes de modification des clubs.</p>
                                    </div>
                                </div>

                                {clubChangeRequests.length === 0 ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold">Aucune demande en attente</h3>
                                        <p className="text-muted-foreground text-sm">Toutes les demandes ont été traitées.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {clubChangeRequests.map((request) => (
                                            <Card key={request.id} className="border-none shadow-sm">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-xl">{request.clubName}</CardTitle>
                                                            <CardDescription className="mt-2">
                                                                Demandé par {request.requestedBy} • {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                            {request.changeType === 'name' ? 'Changement de nom' : 'Organigramme'}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {request.changeType === 'name' && (
                                                        <div>
                                                            <p className="text-sm font-bold mb-1">Nouveau nom proposé</p>
                                                            <p className="text-lg font-bold text-primary">{request.newData?.name}</p>
                                                        </div>
                                                    )}

                                                    {request.changeType === 'organizationalChart' && (
                                                        <div>
                                                            <p className="text-sm font-bold mb-2">Nouvel organigramme</p>
                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                Contactez l'administrateur du club pour plus de détails
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-4 border-t">
                                                        <Button
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => handleApproveChangeRequest(request)}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Approuver
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-2 text-destructive border-destructive/20"
                                                            onClick={() => handleRejectChangeRequest(request.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Rejeter
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {activeTab === 'announcements' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Annonces Globales</h1>
                                    <p className="text-muted-foreground">Gérez les annonces qui s'affichent en haut de la page d'accueil.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Form */}
                                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">Nouvelle Annonce</CardTitle>
                                        <CardDescription>Elle apparaîtra dans le slider principal.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleAddAnnouncement} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
                                                <Input
                                                    required
                                                    placeholder="Titre de l'annonce"
                                                    value={announcementForm.title}
                                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenu</label>
                                                <textarea
                                                    required
                                                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    placeholder="Description de l'annonce..."
                                                    value={announcementForm.content}
                                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL de l'image (Optionnel)</label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={announcementForm.imageUrl}
                                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                                />
                                            </div>
                                            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Publier l'annonce
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* List */}
                                <div className="lg:col-span-2 space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-1">Annonces Actives ({adminAnnouncements.length})</h3>
                                    {adminAnnouncements.length === 0 ? (
                                        <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-muted-foreground text-sm">Aucune annonce globale pour le moment.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {adminAnnouncements.map((ann) => (
                                                <Card key={ann.id} className="border-none shadow-sm group overflow-hidden">
                                                    <div className="flex flex-col sm:flex-row">
                                                        {ann.imageUrl && (
                                                            <div className="sm:w-32 h-32 sm:h-auto relative shrink-0">
                                                                <img src={ann.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="p-5 flex-grow">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div>
                                                                    <Badge className="mb-2 bg-primary/10 text-primary border-0 hover:bg-primary/20">Admin</Badge>
                                                                    <h4 className="font-bold text-lg">{ann.title}</h4>
                                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ann.content}</p>
                                                                    <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                                        <Clock className="w-3 h-3" />
                                                                        {new Date(ann.createdAt).toLocaleDateString('fr-FR')}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Paramètres</h1>
                                    <p className="text-muted-foreground">Configurez les notifications et autres préférences.</p>
                                </div>
                            </div>

                            <Card className="max-w-2xl border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Notifications par Email</CardTitle>
                                    <CardDescription>
                                        Recevez un email lorsque de nouvelles données nécessitent votre attention (nouvelles ressources, demandes de clubs, etc.).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-slate-50">
                                            <input
                                                type="checkbox"
                                                id="notifEnabled"
                                                checked={notificationSettings.enabled}
                                                onChange={(e) => setNotificationSettings(p => ({ ...p, enabled: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="notifEnabled"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Activer les notifications
                                                </label>
                                                <p className="text-[0.8rem] text-muted-foreground">
                                                    Si désactivé, vous ne recevrez aucun email automatique d'alerte.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email de réception</label>
                                            <Input
                                                type="email"
                                                value={notificationSettings.email}
                                                onChange={(e) => setNotificationSettings(p => ({ ...p, email: e.target.value }))}
                                                placeholder="exemple@email.com"
                                                required={notificationSettings.enabled}
                                                disabled={!notificationSettings.enabled}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Par défaut : thevcercle@gmail.com
                                            </p>
                                        </div>

                                        <Button type="submit" disabled={savingSettings}>
                                            {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Sauvegarder les préférences
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </main >
            </div >
        </div >
    );
}