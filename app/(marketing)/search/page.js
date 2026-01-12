'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];
    const query = searchParams.get('q') || '';
    const fieldParam = searchParams.get('field') || '';

    const [selectedField, setSelectedField] = useState(fieldParam);
    const [results, setResults] = useState({ modules: [], resources: [], ads: [] });
    const [loading, setLoading] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState(query);

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
                <h1 className={cn("text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4", language === 'ar' && "font-arabic")}>
                    {t.search.title}
                </h1>

                {!selectedField ? (
                    <div className="max-w-4xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={cn("space-y-2", language === 'ar' && "text-right")}>
                            <h2 className={cn("text-2xl md:text-3xl font-black tracking-tight", language === 'ar' && "font-arabic")}>{t.search.chooseFiliere}</h2>
                            <p className={cn("text-muted-foreground", language === 'ar' && "font-arabic")}>{t.search.filiereDescription}</p>
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
                                    <span className={cn("text-sm font-black uppercase tracking-widest text-slate-700 group-hover:text-primary transition-colors text-center", language === 'ar' && "font-arabic")}>
                                        {field.id.toUpperCase()}
                                    </span>
                                    <p className={cn("text-[10px] text-muted-foreground mt-3 line-clamp-2 text-center font-medium", language === 'ar' && "font-arabic")}>
                                        {t.fields[field.id] || field.name}
                                    </p>
                                    <div className={cn("absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity", language === 'ar' ? "left-4" : "right-4")}>
                                        <ArrowRight className={cn("w-4 h-4 text-primary", language === 'ar' && "rotate-180")} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto relative mt-8 animate-in zoom-in-95 duration-300">
                        <div className={cn("flex items-center justify-between mb-6 px-4", language === 'ar' && "flex-row-reverse")}>
                            <Badge variant="outline" className={cn("px-4 py-1.5 bg-primary/5 border-primary/20 text-primary font-bold rounded-full flex items-center gap-3 shadow-sm", language === 'ar' && "flex-row-reverse")}>
                                <span className="text-[10px] uppercase tracking-widest opacity-60">{t.common.filiere}:</span>
                                <span className={cn("text-sm", language === 'ar' && "font-arabic")}>{t.fields[selectedField] || staticDb.fields.find(f => f.id === selectedField)?.name}</span>
                                <button onClick={() => {
                                    setSelectedField('');
                                    setResults({ modules: [], resources: [] });
                                    setSearchInputValue('');
                                    router.push('/search');
                                }} className="hover:scale-125 transition-transform text-primary/40 hover:text-primary">
                                    <i className="fas fa-times-circle"></i>
                                </button>
                            </Badge>
                        </div>
                        <form onSubmit={handleSearchSubmit} className="relative group px-2 sm:px-0">
                            <div className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors", language === 'ar' ? "right-6 sm:right-8" : "left-6 sm:left-8")}>
                                <SearchIcon className="h-6 w-6" />
                            </div>
                            <input
                                type="text"
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                                className={cn(
                                    "w-full h-16 sm:h-20 rounded-[2rem] sm:rounded-full border-2 border-slate-100 bg-white shadow-2xl shadow-slate-200/50 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-lg placeholder:text-slate-300 font-medium",
                                    language === 'ar' ? "pr-16 sm:pr-20 pl-32 sm:pl-40" : "pl-16 sm:pl-20 pr-32 sm:pr-40"
                                )}
                                placeholder={t.search.placeholder}
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                                autoFocus
                            />
                            <div className={cn("absolute top-1/2 -translate-y-1/2 flex items-center gap-2", language === 'ar' ? "left-4 sm:left-6" : "right-4 sm:right-6")}>
                                <Button type="submit" className={cn("h-10 sm:h-12 rounded-full px-6 sm:px-8 font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform", language === 'ar' && "font-arabic")}>
                                    {t.common.search}
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
                            <p className="text-muted-foreground">{t.search.searching}</p>
                        </div>
                    ) : query ? (
                        <div className="space-y-12">
                            {/* Modules Results */}
                            {results.modules.length > 0 && (
                                <section>
                                    <h2 className={cn("text-2xl font-semibold mb-6 flex items-center gap-2", language === 'ar' && "flex-row-reverse text-right")}>
                                        <BookOpen className="w-6 h-6 text-primary" />
                                        <span className={cn(language === 'ar' && "font-arabic")}>{t.search.modulesTitle} ({results.modules.length})</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.modules.map((module) => (
                                            <Link key={module.id} href={`/browse?module=${module.id}`}>
                                                <Card className={cn("hover:shadow-md transition-shadow cursor-pointer h-full border-primary/20 bg-primary/5", language === 'ar' && "text-right")}>
                                                    <CardHeader className="p-4">
                                                        <CardTitle className={cn("text-base", language === 'ar' && "font-arabic")}>{module.name}</CardTitle>
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
                                    <h2 className={cn("text-xl font-bold mb-6 flex items-center gap-2 text-blue-900", language === 'ar' && "flex-row-reverse text-right")}>
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        <span className={cn(language === 'ar' && "font-arabic")}>{t.search.opportunities}</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {results.ads.map((ad) => (
                                            <Card key={ad.id} className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row bg-white rounded-2xl", language === 'ar' && "sm:flex-row-reverse text-right")}>
                                                <div className="w-full sm:w-32 aspect-video sm:aspect-square relative overflow-hidden flex-shrink-0 bg-slate-100">
                                                    {ad.type === 'video' ? (
                                                        <video src={ad.url} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <img src={ad.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <CardContent className="p-4 flex flex-col justify-between flex-grow">
                                                    <div className={cn(language === 'ar' && "items-end")}>
                                                        <div className={cn("flex items-center justify-between mb-1", language === 'ar' && "flex-row-reverse")}>
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[8px] uppercase font-black">{t.ads.sponsored}</Badge>
                                                        </div>
                                                        <h3 className={cn("font-bold text-slate-900 line-clamp-1", language === 'ar' && "font-arabic")}>{ad.title}</h3>
                                                        <p className={cn("text-xs text-slate-500 line-clamp-2 mt-1", language === 'ar' && "font-arabic")}>{ad.description}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" className={cn("w-full mt-4 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs", language === 'ar' && "font-arabic")} asChild>
                                                        <a href={ad.link} target="_blank" rel="noopener noreferrer">{t.common.discover}</a>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Resources Results */}
                            <section>
                                <h2 className={cn("text-2xl font-semibold mb-6 flex items-center gap-2", language === 'ar' && "flex-row-reverse text-right")}>
                                    <FileText className="w-6 h-6 text-primary" />
                                    <span className={cn(language === 'ar' && "font-arabic")}>{t.search.resourcesTitle} ({results.resources.length})</span>
                                </h2>
                                {results.resources.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                        <p className={cn("text-muted-foreground", language === 'ar' && "font-arabic")}>{t.search.noResourcesFound} "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {results.resources.map((resource) => {
                                            return (
                                                <Card key={resource.id} className={cn("flex flex-col h-full hover:shadow-md transition-shadow", language === 'ar' && "text-right")}>
                                                    <CardHeader className={cn("flex flex-row items-center gap-4 space-y-0", language === 'ar' && "flex-row-reverse")}>
                                                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                            {getResourceIcon(resource.type)}
                                                        </div>
                                                        <div className={cn("flex flex-col overflow-hidden", language === 'ar' && "items-end")}>
                                                            <CardTitle className={cn("text-lg line-clamp-1", language === 'ar' && "font-arabic")}>{resource.title}</CardTitle>
                                                            <div className={cn("flex flex-wrap gap-1 mt-1", language === 'ar' && "flex-row-reverse")}>
                                                                <Badge variant="secondary" className="w-fit text-[10px] uppercase">
                                                                    {resource.type}
                                                                </Badge>
                                                                {resource.docType && (
                                                                    <Badge variant="outline" className="w-fit text-[10px] uppercase border-primary/20 text-primary bg-primary/5">
                                                                        {resource.docType}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow pt-2">
                                                        {resource.description && (
                                                            <p className={cn("text-sm text-muted-foreground line-clamp-2 mb-4", language === 'ar' && "font-arabic")}>
                                                                {resource.description}
                                                            </p>
                                                        )}
                                                        <div className={cn("flex flex-col gap-2", language === 'ar' && "items-end")}>
                                                            {resource.professor && (
                                                                <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", language === 'ar' && "flex-row-reverse")}>
                                                                    <User className="w-3 h-3" />
                                                                    <span className={cn(language === 'ar' && "font-arabic")}>{resource.professor}</span>
                                                                </div>
                                                            )}
                                                            <div className={cn("text-[10px] text-muted-foreground flex items-center gap-1 mt-1", language === 'ar' && "flex-row-reverse")}>
                                                                <BookOpen className="w-3 h-3" />
                                                                <span>{resource.module || resource.moduleId}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                    <div className="p-6 pt-0 mt-auto">
                                                        <Button className={cn("w-full justify-between group", language === 'ar' && "flex-row-reverse")} asChild>
                                                            <Link href={`/resources/${resource.id}`}>
                                                                <span className={cn(language === 'ar' && "font-arabic")}>{t.common.accessResource}</span>
                                                                <ArrowRight className={cn("w-4 h-4 ml-2 transition-transform group-hover:translate-x-1", language === 'ar' && "rotate-180")} />
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
                            <p className={cn("text-xl text-muted-foreground", language === 'ar' && "font-arabic")}>{t.search.startSearching}</p>
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
