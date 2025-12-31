'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db as staticDb } from '@/lib/data';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Video, ImageIcon, Link as LinkIcon, ArrowRight, FolderOpen, User, Sparkles } from 'lucide-react';
import { Image } from 'next/image'; // Check if this is needed or if global Image is fine

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [resources, setResources] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize from URL params
        const fieldParam = searchParams.get('field');
        const semesterParam = searchParams.get('semester');
        const moduleParam = searchParams.get('module');

        if (fieldParam) setSelectedField(fieldParam);
        if (semesterParam) setSelectedSemester(semesterParam);

        // If only module is provided, try to find the field and semester
        if (moduleParam && !fieldParam) {
            let found = false;
            Object.entries(staticDb.modules).forEach(([key, mods]) => {
                if (!found && mods.find(m => m.id === moduleParam)) {
                    const [f, s] = key.split('-');
                    setSelectedField(f);
                    setSelectedSemester(s);
                    setSelectedModule(moduleParam);
                    found = true;
                }
            });
        } else if (moduleParam) {
            setSelectedModule(moduleParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!db) return;
        if (selectedModule) {
            fetchResources();
            fetchAds();
        } else {
            setResources([]);
            setAds([]);
        }
    }, [selectedModule, db]);

    const fetchAds = async () => {
        const adsRef = ref(db, 'studentAds');
        const snapshot = await get(adsRef);
        if (snapshot.exists()) {
            const now = new Date();
            const adsData = Object.entries(snapshot.val())
                .map(([id, data]) => ({ id, ...data }))
                .filter(ad => ad.status === 'live' && (!ad.expirationDate || new Date(ad.expirationDate) > now))
                .sort(() => Math.random() - 0.5)
                .slice(0, 1);
            setAds(adsData);
        }
    };

    const fetchResources = async () => {
        setLoading(true);
        try {
            // 1. Try fetching from mapping first (efficient)
            const mappingRef = ref(db, `module_resources/${selectedModule}`);
            const mappingSnap = await get(mappingRef);

            let resourceIds = [];
            if (mappingSnap.exists()) {
                resourceIds = Object.keys(mappingSnap.val());
            }

            // 2. Fetch actual resource data
            const resourcesRef = ref(db, 'resources');
            const resourcesSnap = await get(resourcesRef);
            const allResources = resourcesSnap.val() || {};

            let formattedResources = [];

            if (resourceIds.length > 0) {
                // If mapping exists, use it
                formattedResources = resourceIds
                    .map(id => ({
                        id,
                        ...allResources[id]
                    }))
                    .filter(resource =>
                        resource &&
                        resource.unverified !== true &&
                        (resource.url || resource.link || resource.file) &&
                        resource.title
                    );
            }

            // 3. Fallback: Search all resources for this module ID if no results or mismatch
            // This handles cases where mapping might be missing but resource has the module field
            if (formattedResources.length === 0) {
                formattedResources = Object.entries(allResources)
                    .map(([id, res]) => ({ id, ...res }))
                    .filter(res =>
                        res.unverified !== true &&
                        (res.module === selectedModule || res.moduleId === selectedModule) &&
                        (res.url || res.link || res.file) &&
                        res.title
                    );
            }

            setResources(formattedResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const modules = selectedField && selectedSemester
        ? staticDb.modules[`${selectedField}-${selectedSemester}`] || []
        : [];

    const selectedModuleData = modules.find(m => m.id === selectedModule);

    const ensureProtocol = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5" />;
            case 'video': return <Video className="w-5 h-5" />;
            case 'image': return <ImageIcon className="w-5 h-5" />;
            case 'link': return <LinkIcon className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <main className="container py-12">
            <section className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Parcourir les ressources
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Sélectionnez votre filière, semestre et module pour accéder aux ressources partagées par la communauté.
                </p>
            </section>

            <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Filière</label>
                    <Select
                        value={selectedField}
                        onValueChange={(value) => {
                            setSelectedField(value);
                            setSelectedSemester('');
                            setSelectedModule('');
                            setResources([]);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une filière" />
                        </SelectTrigger>
                        <SelectContent>
                            {staticDb.fields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Semestre</label>
                    <Select
                        value={selectedSemester}
                        onValueChange={(value) => {
                            setSelectedSemester(value);
                            setSelectedModule('');
                            setResources([]);
                        }}
                        disabled={!selectedField}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un semestre" />
                        </SelectTrigger>
                        <SelectContent>
                            {staticDb.semesters.map((sem) => (
                                <SelectItem key={sem} value={sem}>
                                    {sem}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Module</label>
                    <Select
                        value={selectedModule}
                        onValueChange={setSelectedModule}
                        disabled={!selectedSemester}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un module" />
                        </SelectTrigger>
                        <SelectContent>
                            {modules.map((mod) => (
                                <SelectItem key={mod.id} value={mod.id}>
                                    {mod.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {selectedModule && (
                <section>
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Ressources : <span className="text-primary">{selectedModuleData?.name}</span>
                        </h2>
                        <Badge variant="outline" className="px-3 py-1">
                            {resources.length} ressource{resources.length > 1 ? 's' : ''}
                        </Badge>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Recherche des ressources...</p>
                        </div>
                    ) : resources.length === 0 ? (
                        <Card className="text-center py-16 border-dashed border-2 bg-muted/30">
                            <CardHeader>
                                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <FolderOpen className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-xl">Aucune ressource disponible</CardTitle>
                                <CardDescription className="max-w-sm mx-auto mt-2">
                                    Aidez vos camarades en étant le premier à partager une ressource pour ce module !
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/contribute">
                                    <Button size="lg" className="mt-4">
                                        Contribuer une ressource
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Student Ad Card */}
                            {ads.length > 0 && (
                                <Card className="flex flex-col h-full border-blue-100 bg-blue-50/20 overflow-hidden group">
                                    <div className="relative aspect-video overflow-hidden">
                                        <img src={ads[0].url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-blue-600 text-white border-none shadow-sm font-black uppercase text-[10px]">Focus Étudiant</Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-blue-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Sponsorisé</span>
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1">{ads[0].title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-sm mt-3">{ads[0].description}</CardDescription>
                                    </CardHeader>
                                    <div className="p-6 pt-0 mt-auto">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold rounded-xl" asChild>
                                            <a href={ads[0].link} target="_blank" rel="noopener noreferrer">
                                                Découvrir le projet
                                            </a>
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {resources.map((resource) => {
                                const rawUrl = resource.url || resource.link || resource.file;
                                const validUrl = rawUrl ? ensureProtocol(rawUrl) : null;

                                return (
                                    <Card key={resource.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                {getResourceIcon(resource.type)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
                                                <Badge variant="secondary" className="w-fit text-[10px] mt-1 uppercase">
                                                    {resource.type}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow pt-2">
                                            {resource.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                    {resource.description}
                                                </p>
                                            )}
                                            <div className="flex flex-col gap-2 mt-2">
                                                {resource.professor && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <User className="w-3 h-3" />
                                                        <span>{resource.professor}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <div className="p-6 pt-0 mt-auto border-t border-muted/50 pt-4 mt-4">
                                            {validUrl ? (
                                                <Button className="w-full justify-between group" asChild>
                                                    <a href={validUrl} target="_blank" rel="noopener noreferrer">
                                                        Accéder à la ressource
                                                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" className="w-full" disabled>
                                                    Non disponible
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
