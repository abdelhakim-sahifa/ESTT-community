'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/image-constants';
import { db as staticDb } from '@/lib/data';
import { db as firebaseDb, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Users, FileText, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import ActivityFeed from '@/components/ActivityFeed';
import ClubCard from '@/components/ClubCard';
import { cn } from '@/lib/utils';


export default function Home() {
    const router = useRouter();
    const [stats, setStats] = useState({
        resources: 0,
        contributions: 0,
        modules: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [allResources, setAllResources] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

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

                // Fetch clubs
                const clubsRef = ref(firebaseDb, 'clubs');
                const clubsSnap = await get(clubsRef);
                let allClubs = [];
                if (clubsSnap.exists()) {
                    const clubsData = clubsSnap.val();
                    allClubs = Object.entries(clubsData)
                        .map(([id, data]) => ({ id, ...data }))
                        .filter(club => club.verified);

                    // Show only first 3 in the clubs section
                    setClubs(allClubs.slice(0, 3));
                }
                setLoadingClubs(false);

                // Fetch all club posts for the carousel
                const clubPostsRef = ref(firebaseDb, 'clubPosts');
                const clubPostsSnap = await get(clubPostsRef);

                let allAnnouncements = [];
                if (clubPostsSnap.exists()) {
                    const allPostsData = clubPostsSnap.val();
                    Object.entries(allPostsData).forEach(([clubId, posts]) => {
                        const clubInfo = allClubs.find(c => c.id === clubId);
                        Object.entries(posts).forEach(([postId, post]) => {
                            if (['announcement', 'activity'].includes(post.type)) {
                                allAnnouncements.push({
                                    id: postId,
                                    clubId,
                                    clubName: clubInfo?.name || 'Club',
                                    clubLogo: clubInfo?.logo,
                                    themeColor: clubInfo?.themeColor,
                                    ...post
                                });
                            }
                        });
                    });
                }

                // Fetch admin announcements
                const adminAnnSnap = await get(ref(firebaseDb, 'adminAnnouncements'));
                if (adminAnnSnap.exists()) {
                    const adminData = adminAnnSnap.val();
                    Object.entries(adminData).forEach(([id, ann]) => {
                        allAnnouncements.push({
                            id,
                            clubName: 'EST Tétouan',
                            clubLogo: '/favicon.ico', // Or a system logo
                            themeColor: '#3b82f6',
                            ...ann,
                            isAdmin: true
                        });
                    });
                }

                // Sort by createdAt descending
                allAnnouncements.sort((a, b) => b.createdAt - a.createdAt);

                // Prioritize those with images
                const withImages = allAnnouncements.filter(p => p.imageUrl);
                const withoutImages = allAnnouncements.filter(p => !p.imageUrl);
                setAnnouncements([...withImages, ...withoutImages].slice(0, 8));

                setLoadingAnnouncements(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoadingClubs(false);
                setLoadingAnnouncements(false);
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
            const url = item.url || item.link || item.file;
            if (url) {
                window.open(url, '_blank');
            } else {
                router.push(`/browse?q=${encodeURIComponent(item.title)}`);
            }
        }
    };

    // Carousel Autoplay
    useEffect(() => {
        if (announcements.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % announcements.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [announcements.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % announcements.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    return (
        <main className="min-h-screen">

            <section id="hero" className="relative bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="container px-4 md:px-6 flex flex-col items-center text-center">
                    <h1 className="text-3xl font-heading font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight">
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
                        <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                            <Link href="/clubs">
                                Découvrir les clubs
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-6 text-sm font-medium text-muted-foreground" aria-hidden="false">
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                            <strong className="text-primary text-base md:text-lg" id="hero-stat-resources">{stats.resources}</strong> ressources
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                            <strong className="text-primary text-base md:text-lg" id="hero-stat-contributions">{stats.contributions}</strong> contributions
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-sm border whitespace-nowrap">
                            <strong className="text-primary text-base md:text-lg" id="hero-stat-modules">{stats.modules}</strong> modules
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

            {/* Announcements Slide View */}
            {!loadingAnnouncements && announcements.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <div className="text-left">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Annonces</h2>
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight">À ne pas manquer</h2>
                                </div>
                            </div>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/7] shadow-2xl group">
                            {/* Background Image/Gradient */}
                            <div className="absolute inset-0">
                                {announcements[currentSlide].imageUrl ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={announcements[currentSlide].imageUrl}
                                            alt="Announcement cover"
                                            fill
                                            sizes={IMAGE_SIZES.ANNOUNCEMENT_HERO}
                                            className="object-cover opacity-60 transition-opacity duration-700 scale-105 group-hover:scale-100 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            background: `linear-gradient(135deg, ${announcements[currentSlide].themeColor || '#3b82f6'} 0%, #0f172a 100%)`
                                        }}
                                    />
                                )}
                            </div>

                            {/* Content Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent">
                                <div className="max-w-3xl space-y-4">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {announcements[currentSlide].clubLogo && (
                                            <div className="relative w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/20 bg-white shadow-sm">
                                                <Image src={announcements[currentSlide].clubLogo} alt={announcements[currentSlide].clubName} fill sizes={IMAGE_SIZES.CLUB_LOGO_SM} className="object-cover" />
                                            </div>
                                        )}
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs">
                                            {announcements[currentSlide].clubName}
                                        </Badge>
                                        <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm text-[10px] md:text-xs px-2 py-0.5">
                                            {announcements[currentSlide].type === 'announcement' ? 'Annonce' : 'Activité'}
                                        </Badge>
                                    </div>

                                    {announcements[currentSlide].isAdmin ? (
                                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white line-clamp-2 leading-tight">
                                            {announcements[currentSlide].title}
                                        </h3>
                                    ) : (
                                        <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`} className="block">
                                            <h3 className="text-xl md:text-4xl lg:text-5xl font-black text-white hover:text-primary transition-colors line-clamp-2 md:line-clamp-3 leading-[1.1]">
                                                {announcements[currentSlide].title}
                                            </h3>
                                        </Link>
                                    )}

                                    <p className="text-slate-200/90 line-clamp-2 text-sm md:text-lg max-w-2xl font-medium">
                                        {announcements[currentSlide].content}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-3 pt-4 md:pt-6">
                                        {!announcements[currentSlide].isAdmin && (
                                            <Button asChild size="sm" className="md:hidden rounded-full font-bold px-6 shadow-lg shadow-primary/20">
                                                <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`}>
                                                    Accéder
                                                </Link>
                                            </Button>
                                        )}
                                        {!announcements[currentSlide].isAdmin && (
                                            <Button asChild size="lg" className="hidden md:flex rounded-full font-bold px-8 shadow-lg shadow-primary/20">
                                                <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`}>
                                                    Lire la suite
                                                </Link>
                                            </Button>
                                        )}
                                        <span className="text-white/60 text-[10px] md:text-sm font-medium">
                                            {new Date(announcements[currentSlide].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="absolute bottom-4 right-4 md:bottom-12 md:right-12 flex gap-2">
                                <button
                                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                                    className="p-2 md:p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                                    className="p-2 md:p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                                </button>
                            </div>

                            {/* Indicators */}
                            <div className="absolute top-4 right-4 md:top-12 md:right-12 flex gap-1.5 md:gap-2">
                                {announcements.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={cn(
                                            "h-1 md:h-1.5 rounded-full transition-all duration-500",
                                            idx === currentSlide ? "bg-white w-6 md:w-8" : "bg-white/30 w-3 md:w-4 hover:bg-white/50"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}


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

            {/* Clubs Section */}
            <section id="clubs-section" className="py-20 bg-slate-50/50">
                <div className="container">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                        <div className="text-left">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Vie Étudiante</h2>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Nos Clubs</h2>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className="text-muted-foreground max-w-sm text-sm text-right">
                                Rejoignez l'un de nos nombreux clubs et développez vos compétences.
                            </p>
                            <Link href="/clubs" className="text-primary text-sm font-bold hover:underline">
                                Voir tous les clubs →
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {!loadingClubs ? (
                            clubs.length > 0 ? (
                                clubs.map((club) => (
                                    <ClubCard key={club.id} club={club} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-muted-foreground">
                                    Aucun club vérifié à afficher pour le moment.
                                </div>
                            )
                        ) : (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                            ))
                        )}
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

        </main>
    );
}
