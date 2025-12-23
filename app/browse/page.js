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
import { Loader2, FileText, Video, Image as ImageIcon, Link as LinkIcon, ArrowRight, FolderOpen, User } from 'lucide-react';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState(searchParams.get('field') || '');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!db) return;

        const query = searchParams.get('q');
        if (query) {
            handleSearch(query);
        } else if (selectedModule) {
            fetchResources();
        }
    }, [selectedModule, searchParams, db]);


    const handleSearch = async (query) => {
        setLoading(true);
        try {
            const resourcesRef = ref(db, 'resources');
            const snapshot = await get(resourcesRef);
            const data = snapshot.val() || {};

            const searchLower = query.toLowerCase();
            const formattedResources = Object.entries(data)
                .map(([id, resource]) => ({
                    id,
                    ...resource
                }))
                .filter(resource =>
                    resource.unverified !== true &&
                    (resource.title?.toLowerCase().includes(searchLower) ||
                        resource.description?.toLowerCase().includes(searchLower) ||
                        resource.professor?.toLowerCase().includes(searchLower))
                );

            setResources(formattedResources);
        } catch (error) {
            console.error('Error searching resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        setLoading(true);
        try {
            // 1. Get resource IDs for this module
            const mappingRef = ref(db, `module_resources/${selectedModule}`);
            const mappingSnap = await get(mappingRef);

            if (!mappingSnap.exists()) {
                setResources([]);
                return;
            }

            const resourceIds = Object.keys(mappingSnap.val());

            // 2. Fetch actual resource data
            const resourcesRef = ref(db, 'resources');
            const resourcesSnap = await get(resourcesRef);
            const allResources = resourcesSnap.val() || {};

            const formattedResources = resourceIds
                .map(id => ({
                    id,
                    ...allResources[id]
                }))
                .filter(resource => resource && resource.unverified !== true);

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

