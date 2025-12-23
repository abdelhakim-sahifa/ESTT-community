'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db as staticDb } from '@/lib/data';
import { db as firebaseDb, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Search, BookOpen } from 'lucide-react';
import ActivityFeed from '@/components/ActivityFeed';


export default function Home() {
    const router = useRouter();
    const [stats, setStats] = useState({
        resources: 0,
        contributions: 0,
        modules: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [allResources, setAllResources] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!firebaseDb) return;

        // Fetch stats and all resources from Firebase
        const fetchData = async () => {
            try {
                const resourcesRef = ref(firebaseDb, 'resources');
                const resourcesSnap = await get(resourcesRef);

                const resourcesData = resourcesSnap.val() || {};
                const resourcesList = Object.entries(resourcesData).map(([id, res]) => ({
                    id,
                    ...res,
                    type: 'resource'
                }));

                setAllResources(resourcesList);

                let verifiedCount = 0;
                let pendingCount = 0;

                resourcesList.forEach(resource => {
                    if (resource.unverified === true) {
                        pendingCount++;
                    } else {
                        verifiedCount++;
                    }
                });

                const totalModules = Object.keys(staticDb.modules).reduce((sum, key) => {
                    return sum + staticDb.modules[key].length;
                }, 0);

                setStats({
                    resources: verifiedCount,
                    contributions: pendingCount,
                    modules: totalModules
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [firebaseDb]);


    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const searchLower = searchQuery.toLowerCase();

            // Search in modules
            const allModules = Object.values(staticDb.modules).flat();
            const filteredModules = allModules
                .filter(m => m.name.toLowerCase().includes(searchLower))
                .map(m => ({ ...m, type: 'module' }));

            // Search in resources
            const filteredResources = allResources
                .filter(r =>
                    r.unverified !== true &&
                    (r.title?.toLowerCase().includes(searchLower) ||
                        r.description?.toLowerCase().includes(searchLower))
                )
                .map(r => ({ ...r, type: 'resource' }));

            // Combine and limit
            const combined = [...filteredModules, ...filteredResources].slice(0, 10);
            setSuggestions(combined);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery, allResources]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleSuggestionClick = (item) => {
        if (item.type === 'module') {
            setSearchQuery(item.name);
            setShowSuggestions(false);
            router.push(`/browse?module=${item.id}`);
        } else {
            setSearchQuery(item.title);
            setShowSuggestions(false);
            // If it's a resource, we might want to go to browse with a query or directly to the resource
            // The feedback says "when i click the card it redirect me the page with filter isn't it suppose to open the resource directly"
            // So for suggestions, let's also try to go directly if possible, or at least to browse with the query
            const url = item.url || item.link || item.file;
            if (url) {
                window.open(url, '_blank');
            } else {
                router.push(`/browse?q=${encodeURIComponent(item.title)}`);
            }
        }
    };

    return (
        <main className="min-h-screen">
            <section id="hero" className="relative bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="container px-4 md:px-6 flex flex-col items-center text-center">
                    <h1 className="text-4xl font-heading font-medium tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
                        Partage tes ressources — aide tes camarades, gagne du temps
                    </h1>
                    <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
                        Tu as un cours, un TD, un exercice ou une vidéo utile ? Contribue en moins de 2 minutes.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="rounded-full px-8 text-lg h-12" asChild>
                            <Link href="/contribute">
                                Contribuer une ressource
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                            <Link href="/browse">
                                Parcourir les ressources
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground" aria-hidden="false">
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border">
                            <strong className="text-primary text-lg" id="hero-stat-resources">{stats.resources}</strong> ressources
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border">
                            <strong className="text-primary text-lg" id="hero-stat-contributions">{stats.contributions}</strong> contributions en attente
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border">
                            <strong className="text-primary text-lg" id="hero-stat-modules">{stats.modules}</strong> modules
                        </div>
                    </div>

                    <p className="mt-8 text-sm text-muted-foreground/80">
                        Formats acceptés : PDF · Images · Liens · Vidéos — Anonyme possible · Modération rapide
                    </p>

                    <div className="relative w-full max-w-lg mt-10 z-50">
                        <form onSubmit={handleSearch}>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                            <input
                                type="text"
                                id="global-search"
                                className="w-full h-14 pl-12 pr-4 rounded-full border border-input bg-background shadow-md ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Rechercher un module, un cours..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                        </form>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto">
                                {suggestions.map((item) => (
                                    <button
                                        key={item.id}
                                        className="w-full px-5 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors border-b last:border-0"
                                        onClick={() => handleSuggestionClick(item)}
                                    >
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                            {item.type === 'module' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-sm truncate">{item.type === 'module' ? item.name : item.title}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {item.type === 'module' ? 'Module' : 'Ressource'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                <button
                                    className="w-full px-5 py-3 text-left hover:bg-muted/50 text-primary text-sm font-medium transition-colors"
                                    onClick={() => handleSearch()}
                                >
                                    Voir tous les résultats pour "{searchQuery}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Banners for main programs */}
            <section id="program-banners" className="py-16 container">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="banners-container">
                    {[
                        { href: "/browse?field=ia", img: "/assets/images/DUT-1.jpg", label: "Intelligence Artificielle" },
                        { href: "/browse?field=insem", img: "/assets/images/DUT-2.jpg", label: "Industrie Navale" },
                        { href: "/browse?field=casi", img: "/assets/images/DUT-3.jpg", label: "Cybersécurité" },
                        { href: "/browse?field=idd", img: "/assets/images/program-big3.jpg", label: "Informatique & Dév Digital" },
                    ].map((banner, index) => (
                        <Link key={index} className="group relative block overflow-hidden rounded-xl bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" href={banner.href}>
                            <div className="aspect-[16/10] overflow-hidden">
                                <Image
                                    src={banner.img}
                                    alt={`${banner.label} banner`}
                                    width={300}
                                    height={160}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 saturate-[0.95] group-hover:saturate-100"
                                    loading="lazy"
                                />
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <span className="inline-block rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                                    {banner.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Statistics */}
            <section id="site-stats" className="py-16 bg-slate-50 border-y">
                <div className="container text-center">
                    <h2 className="text-3xl font-heading font-medium mb-12">État de la plateforme</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="stats-container">
                        {[
                            { value: stats.contributions, label: "Contributions en attente" },
                            { value: stats.resources, label: "Ressources totales" },
                            { value: stats.modules, label: "Modules disponibles" },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-6 bg-background rounded-xl shadow-sm border">
                                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                                <div className="text-muted-foreground font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Activity Feed Section */}
            <section id="activity-feed" className="py-20 bg-white">
                <div className="container">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                        <div className="text-left">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Communauté</h2>
                            <h2 className="text-4xl font-black tracking-tight">Dernières Activités</h2>
                        </div>
                        <p className="text-muted-foreground max-w-sm text-sm">
                            Découvrez ce que vos camarades partagent en temps réel sur la plateforme.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ActivityFeed />
                    </div>
                </div>
            </section>

            {/* Fields Grid */}
            <section id="fields-grid" className="py-20 container">
                <h2 className="text-3xl font-heading font-medium mb-10 text-center">Nos Filières</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="fields-container">
                    {staticDb.fields.map((field) => (
                        <Link
                            key={field.id}
                            href={`/browse?field=${field.id}`}
                            className="group flex flex-col items-center text-center p-6 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-lg hover:border-primary/20"
                        >
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <i className={`fas ${field.icon}`}></i>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{field.name}</h3>
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
