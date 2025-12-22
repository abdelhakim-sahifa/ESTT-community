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
    Info
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
        blogs: 0,
        pending: 0
    });
    const [resources, setResources] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Admin Check
    useEffect(() => {
        if (authLoading) return;
        if (!user || profile?.role !== 'admin') {
            // router.push('/'); // Uncomment for production
        }
    }, [user, profile, authLoading]);

    useEffect(() => {
        const resourcesRef = ref(db, 'resources');
        const blogsRef = ref(db, 'blog_posts');
        const usersRef = ref(db, 'users');
        const reportsRef = ref(db, 'reports');

        const unsubResources = onValue(resourcesRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = [];
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && !value.title) {
                    Object.entries(value).forEach(([id, res]) => {
                        list.push({ id, ...res, moduleId: key });
                    });
                } else {
                    list.push({ id: key, ...value });
                }
            });
            setResources(list);
            setStats(prev => ({ ...prev, resources: list.length, pending: list.filter(r => r.unverified).length }));
        });

        const unsubBlogs = onValue(blogsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setBlogs(list);
            setStats(prev => ({ ...prev, blogs: list.length }));
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

        setLoading(false);

        return () => {
            unsubResources();
            unsubBlogs();
            unsubUsers();
            unsubReports();
        };
    }, []);

    const handleApproveResource = async (resource) => {
        try {
            // Determine the path based on how it's stored
            let path = `resources/${resource.id}`;
            if (resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }
            await update(ref(db, path), { unverified: null });
            alert("Ressource approuvée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'approbation.");
        }
    };

    const handleDeleteResource = async (resource) => {
        if (confirm("Supprimer cette ressource ?")) {
            try {
                let path = `resources/${resource.id}`;
                if (resource.moduleId) {
                    path = `resources/${resource.moduleId}/${resource.id}`;
                }
                await remove(ref(db, path));
                alert("Ressource supprimée.");
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDeleteBlog = async (id) => {
        if (confirm("Supprimer cet article ?")) {
            try {
                await remove(ref(db, `blog_posts/${id}`));
                alert("Article supprimé.");
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (authLoading || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

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
                            variant={activeTab === 'blogs' ? 'default' : 'ghost'}
                            className="justify-start gap-3 h-11"
                            onClick={() => setActiveTab('blogs')}
                        >
                            <MessageSquare className="w-4 h-4" /> Blog
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
                                <Card className="border-none shadow-sm bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-green-100 text-green-600">+2%</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Articles</p>
                                        <h3 className="text-3xl font-black mt-1">{stats.blogs}</h3>
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

                                <Card className="border-none shadow-sm bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">Derniers Articles</CardTitle>
                                        <CardDescription>Les 5 derniers articles publiés sur le blog.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {blogs.slice(0, 5).map((blog) => (
                                                <div key={blog.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                            <MessageSquare className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold truncate max-w-[200px]">{blog.title}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Par {blog.authorName || 'Anonyme'}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={`/blog/${blog.id}`} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-primary" onClick={() => setActiveTab('blogs')}>
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

                    {activeTab === 'blogs' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Gestion du Blog</h1>
                                    <p className="text-muted-foreground">Gérez les articles publiés par les étudiants.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {blogs.map((blog) => (
                                    <Card key={blog.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest">Article</Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/blog/${blog.id}`} target="_blank" className="flex items-center gap-2"><Eye className="w-4 h-4" /> Voir</a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBlog(blog.id)}>
                                                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</CardTitle>
                                            <CardDescription className="text-xs line-clamp-2 mt-2">{blog.excerpt}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Users className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Par {blog.authorName || 'Anonyme'}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
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
                    )}

                    {activeTab === 'reports' && (
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
                    )}
                </main>
            </div>
        </div>
    );
}