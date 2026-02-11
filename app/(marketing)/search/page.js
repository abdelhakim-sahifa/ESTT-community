'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db as staticDb } from '@/lib/data';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, FileText, Video, ImageIcon, Link as LinkIcon, ArrowRight, Search as SearchIcon, User, BookOpen, Sparkles } from 'lucide-react';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const fieldParam = searchParams.get('field') || '';

    const [selectedField, setSelectedField] = useState(fieldParam);
    const [results, setResults] = useState({ modules: [], resources: [], ads: [] });
    const [loading, setLoading] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState(query);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (fieldParam) {
            setSelectedField(fieldParam);
        }
    }, [fieldParam]);

    useEffect(() => {
        setSearchInputValue(query);
        if (query.trim() && selectedField) {
            performSearch(query, selectedField);
        } else {
            setResults({ modules: [], resources: [], ads: [] });
        }
    }, [query, selectedField]);

    const performSearch = async (searchTerm, fieldId) => {
        setLoading(true);
        try {
            const searchLower = searchTerm.toLowerCase();

            // 1. Search in Static Modules (Filtered by field)
            const fieldModules = staticDb.modules[`${fieldId}-S1`] || []
                .concat(staticDb.modules[`${fieldId}-S2`] || [])
                .concat(staticDb.modules[`${fieldId}-S3`] || [])
                .concat(staticDb.modules[`${fieldId}-S4`] || []);

            const filteredModules = fieldModules.filter(m =>
                m.name.toLowerCase().includes(searchLower) ||
                m.id.toLowerCase().includes(searchLower)
            );

            // 2. Search in Firebase Keywords node for this field
            const keywordsRef = ref(db, `metadata/keywords/${fieldId}`);
            const snapshot = await get(keywordsRef);
            const keywordsData = snapshot.val() || {};

            const filteredResourceIds = Object.entries(keywordsData)
                .filter(([id, data]) => data.title?.toLowerCase().includes(searchLower))
                .map(([id, data]) => id);

            // 3. Fetch full resource data for matched IDs
            // (Note: In a high-traffic app, we might want to store more metadata in the keywords node to avoid fetching multiple resources)
            const fetchedResources = await Promise.all(
                filteredResourceIds.map(async (id) => {
                    const resRef = ref(db, `resources/${id}`);
                    const resSnap = await get(resRef);
                    if (resSnap.exists()) {
                        const resData = resSnap.val();
                        if (resData.unverified !== true) {
                            return { id, ...resData };
                        }
                    }
                    return null;
                })
            );

            setResults({
                modules: filteredModules,
                resources: fetchedResources.filter(r => r !== null),
                ads: [] // Placeholder, will fill below
            });

            // 4. Fetch Student Ads
            const adsRef = ref(db, 'studentAds');
            const adsSnap = await get(adsRef);
            if (adsSnap.exists()) {
                const now = new Date();
                const adsData = Object.entries(adsSnap.val())
                    .map(([id, data]) => ({ id, ...data }))
                    .filter(ad =>
                        ad.status === 'live' &&
                        (!ad.expirationDate || new Date(ad.expirationDate) > now)
                    )
                    .sort(() => Math.random() - 0.5) // Randomize for variety
                    .slice(0, 2); // Show max 2 ads

                setResults(prev => ({ ...prev, ads: adsData }));
            }
        } catch (error) {
            console.error('Error performing search:', error);
            setResults({ modules: [], resources: [], ads: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchInputValue.trim() && selectedField) {
            router.push(`/search?field=${selectedField}&q=${encodeURIComponent(searchInputValue)}`);
        }
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
                    Recherche
                </h1>

                {!selectedField ? (
                    <div className="max-w-4xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Choisissez votre filière</h2>
                            <p className="text-muted-foreground">Sélectionnez une filière pour commencer à explorer les ressources</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {staticDb.fields.map((field) => (
                                <button
                                    key={field.id}
                                    className="group relative flex flex-col items-center p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-300"
                                    onClick={() => setSelectedField(field.id)}
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-6 shadow-inner">
                                        <i className={cn("fas text-2xl", field.icon)}></i>
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-slate-700 group-hover:text-primary transition-colors text-center">
                                        {field.id.toUpperCase()}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-3 line-clamp-2 text-center font-medium">
                                        {field.name}
                                    </p>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto relative mt-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:bg-primary/10">
                                    <span className="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Filière</span>
                                    <span className="text-xs">{staticDb.fields.find(f => f.id === selectedField)?.name}</span>
                                    <button onClick={() => {
                                        setSelectedField('');
                                        setResults({ modules: [], resources: [] });
                                        setSearchInputValue('');
                                        router.push('/search');
                                    }} className="ml-1 text-primary/40 hover:text-primary transition-colors">
                                        <i className="fas fa-times-circle text-xs"></i>
                                    </button>
                                </Badge>
                            </div>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="relative group px-1 sm:px-0">
                            <div className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors z-10">
                                <SearchIcon className="h-5 w-5" />
                            </div>

                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full h-14 sm:h-16 pl-14 sm:pl-16 pr-36 sm:pr-44 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-base sm:text-lg placeholder:text-slate-300 font-medium"
                                placeholder="Rechercher par titre, module, prof..."
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                                autoFocus
                            />

                            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 pointer-events-none">
                                    <span>Press</span>
                                    <span className="bg-white px-1 border rounded shadow-sm">/</span>
                                </div>
                                <Button
                                    type="submit"
                                    className="h-9 sm:h-10 rounded-xl px-5 sm:px-7 font-bold text-[11px] sm:text-xs shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                >
                                    Rechercher
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            {selectedField && (
                <>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Recherche en cours...</p>
                        </div>
                    ) : query ? (
                        <div className="space-y-12">
                            {/* Modules Results */}
                            {results.modules.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                        Modules ({results.modules.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.modules.map((module) => (
                                            <Link key={module.id} href={`/browse?module=${module.id}`}>
                                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-primary/20 bg-primary/5">
                                                    <CardHeader className="p-4">
                                                        <CardTitle className="text-base">{module.name}</CardTitle>
                                                        <CardDescription className="text-xs uppercase">
                                                            {module.id}
                                                        </CardDescription>
                                                    </CardHeader>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Student Ads Section */}
                            {results.ads.length > 0 && (
                                <section className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        Opportunités Étudiantes
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {results.ads.map((ad) => (
                                            <Card key={ad.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row bg-white rounded-2xl">
                                                <div className="w-full sm:w-32 aspect-video sm:aspect-square relative overflow-hidden flex-shrink-0 bg-slate-100">
                                                    {ad.type === 'video' ? (
                                                        <video src={ad.url} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <Image src={ad.url} alt="" fill className="object-cover" />
                                                    )}
                                                </div>
                                                <CardContent className="p-4 flex flex-col justify-between flex-grow">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[8px] uppercase font-black">Sponsorisé</Badge>
                                                        </div>
                                                        <h3 className="font-bold text-slate-900 line-clamp-1">{ad.title}</h3>
                                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ad.description}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs" asChild>
                                                        <a href={ad.link} target="_blank" rel="noopener noreferrer">Découvrir</a>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Resources Results */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-primary" />
                                    Ressources ({results.resources.length})
                                </h2>
                                {results.resources.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                        <p className="text-muted-foreground">Aucune ressource trouvée pour "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {results.resources.map((resource) => {
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
                                                            {resource.docType && (
                                                                <Badge variant="outline" className="w-fit text-[10px] mt-1 uppercase border-primary/20 text-primary bg-primary/5">
                                                                    {resource.docType}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow pt-2">
                                                        {resource.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                                {resource.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-col gap-2">
                                                            {resource.professor && (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <User className="w-3 h-3" />
                                                                    <span>{resource.professor}</span>
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                                                <BookOpen className="w-3 h-3" />
                                                                <span>{resource.module || resource.moduleId}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                    <div className="p-6 pt-0 mt-auto">
                                                        <Button className="w-full justify-between group" asChild>
                                                            <Link href={`/resources/${resource.id}`}>
                                                                Ouvrir la ressource
                                                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <SearchIcon className="w-16 h-16 text-muted/30 mx-auto mb-4" />
                            <p className="text-xl text-muted-foreground">Entrez un terme pour commencer votre recherche dans cette filière</p>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container py-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
