'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, query, orderByChild, equalTo } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin } from '@/lib/clubUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrganizationalChart from '@/components/features/admin/OrganizationalChart';
import ClubMemberCard from '@/components/features/clubs/ClubMemberCard';
import StructuredData from '@/components/layout/StructuredData';
import { CheckCircle2, Loader2, Settings, ArrowLeft, Users, Calendar, ChevronLeft, ChevronRight, User, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function ClubProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [clubPosts, setClubPosts] = useState([]);
    const [headerPosts, setHeaderPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userTickets, setUserTickets] = useState([]);

    // Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (clubId) {
            fetchClubData();
        }
    }, [clubId]);

    useEffect(() => {
        if (club && user) {
            setIsAdmin(isClubAdmin(user.email, club));
        }
    }, [club, user]);

    useEffect(() => {
        if (user && clubId) {
            fetchUserTickets();
        }
    }, [user, clubId]);

    // Carousel Autoplay
    useEffect(() => {
        if (headerPosts.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % headerPosts.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [headerPosts.length]);

    const fetchClubData = async () => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            // Fetch club data
            const clubRef = ref(db, `clubs/${clubId}`);
            const clubSnap = await get(clubRef);

            if (!clubSnap.exists()) {
                router.push('/clubs');
                return;
            }

            const clubData = { id: clubId, ...clubSnap.val() };
            setClub(clubData);

            // Fetch club posts
            const postsRef = ref(db, `clubPosts/${clubId}`);
            const postsSnap = await get(postsRef);

            if (postsSnap.exists()) {
                const postsData = postsSnap.val();
                const postsArray = Object.entries(postsData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.createdAt - a.createdAt);

                setClubPosts(postsArray);

                // Content for header carousel (announcements/activities with images preferred, or just recent)
                // Prioritize items with images
                const announcements = postsArray.filter(p => ['announcement', 'activity'].includes(p.type));
                const withImages = announcements.filter(p => p.imageUrl);
                const withoutImages = announcements.filter(p => !p.imageUrl);

                // Combine: items with images first, then others, max 5 total
                const headerItems = [...withImages, ...withoutImages].slice(0, 5);
                setHeaderPosts(headerItems);
            }
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTickets = async () => {
        if (!user || !db) return;

        try {
            const ticketsRef = ref(db, 'tickets');
            const q = query(ticketsRef, orderByChild('userId'), equalTo(user.uid));
            const snap = await get(q);

            if (snap.exists()) {
                const data = snap.val();
                const tickets = Object.entries(data)
                    .map(([id, t]) => ({ id, ...t }))
                    .filter(t => t.clubId === clubId)
                    .sort((a, b) => b.createdAt - a.createdAt);
                setUserTickets(tickets);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const getAuthorInfo = (email) => {
        if (!club) return { name: t.clubs.memberRole, role: '' };

        // Check organigram
        if (club.organizationalChart) {
            const orgMember = Object.values(club.organizationalChart).find(m => m.email === email);
            if (orgMember) return { name: orgMember.name, role: orgMember.role };
        }

        // Check members list
        if (club.members) {
            const member = club.members.find(m => m.email === email);
            if (member) return { name: member.name, role: t.common.members };
        }

        return { name: t.clubs.memberRole, role: '' };
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % headerPosts.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + headerPosts.length) % headerPosts.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!club) return null;

    const clubStructuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": club.name,
        "description": club.description,
        "url": `https://estt-community.vercel.app/clubs/${clubId}`,
        "logo": club.logo,
        "parentOrganization": {
            "@type": "EducationalOrganization",
            "name": "EST Tétouan"
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <StructuredData data={clubStructuredData} />            <style jsx global>{`
                .theme-text { color: ${club.themeColor || '#64748b'}; }
                .theme-bg { background-color: ${club.themeColor || '#64748b'}; }
                .theme-border { border-color: ${club.themeColor || '#64748b'}; }
                .theme-hover-text:hover { color: ${club.themeColor || '#64748b'}; }
                .theme-hover-bg:hover { background-color: ${club.themeColor || '#64748b'}; }
            `}</style>
            {/* Header / Hero Section */}
            <section className="relative bg-white border-b overflow-hidden">
                <div className="container py-8 px-4 md:px-6 relative z-10">

                    <div className="flex flex-col gap-6">
                        <Button variant="ghost" size="sm" asChild className={cn("self-start gap-2 mb-2", language === 'ar' && "flex-row-reverse")}>
                            <Link href="/clubs">
                                {language === 'ar' ? <ChevronRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                                {t.clubs.backToClubs}
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Club Brand */}
                            <div className="flex flex-col items-center md:items-start gap-4 flex-shrink-0 lg:w-1/3">
                                <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg mx-auto md:mx-0 shrink-0">
                                    {club.logo ? (
                                        <Image
                                            src={club.logo}
                                            alt={`${club.name} logo`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div
                                            className={cn("w-full h-full flex items-center justify-center text-4xl font-bold bg-muted", language === 'ar' && "font-arabic")}
                                            style={{ color: club.themeColor || '#64748b' }}
                                        >
                                            {club.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center md:text-left space-y-2">
                                    <div className={cn("flex items-center justify-center md:justify-start gap-2 flex-wrap", language === 'ar' && "flex-row-reverse")}>
                                        <h1 className={cn("text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight", language === 'ar' && "font-arabic")}>{club.name}</h1>
                                        {club.verified && (
                                            <Badge className="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 border-0">
                                                <i className="fa-solid fa-circle-check text-[10px]"></i>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{t.clubs.verified}</span>
                                            </Badge>
                                        )}
                                    </div>
                                    <p className={cn("text-sm md:text-base text-muted-foreground max-w-xl mx-auto md:mx-0 leading-relaxed font-medium", language === 'ar' && "text-right font-arabic")}>{club.description}</p>

                                    {club.socialLinks && Object.values(club.socialLinks).some(link => link) && (
                                        <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                                            {Object.entries(club.socialLinks).map(([platform, url]) => {
                                                if (!url) return null;

                                                const standardPlatforms = {
                                                    instagram: 'fa-brands fa-instagram',
                                                    facebook: 'fa-brands fa-facebook',
                                                    linkedin: 'fa-brands fa-linkedin',
                                                    reddit: 'fa-brands fa-reddit',
                                                    youtube: 'fa-brands fa-youtube',
                                                    github: 'fa-brands fa-github'
                                                };

                                                const iconClass = standardPlatforms[platform];
                                                const fullUrl = url.startsWith('http') ? url : `https://${url}`;

                                                let hostname = '';
                                                try {
                                                    hostname = new URL(fullUrl).hostname;
                                                } catch (e) {
                                                    hostname = fullUrl;
                                                }

                                                return (
                                                    <a
                                                        key={platform}
                                                        href={fullUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:text-white transition-all theme-hover-bg shadow-sm hover:shadow-md"
                                                        title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                    >
                                                        {iconClass ? (
                                                            <i className={`${iconClass} text-lg`}></i>
                                                        ) : (
                                                            <>
                                                                <img
                                                                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                                                    alt={platform}
                                                                    className="w-5 h-5"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                                                    }}
                                                                />
                                                                <i className="fa-solid fa-globe text-lg" style={{ display: 'none' }}></i>
                                                            </>
                                                        )}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <Button asChild variant="outline" className={cn("gap-2 mt-4", language === 'ar' && "flex-row-reverse")}>
                                            <Link href={`/clubs/${clubId}/admin`}>
                                                <Settings className="w-4 h-4" />
                                                {t.clubs.administration}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Right: Announcements Carousel */}
                            <div className="flex-1 w-full lg:w-2/3 min-h-0">
                                {headerPosts.length > 0 ? (
                                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] shadow-xl group">
                                        {/* Background Image/Gradient */}
                                        <div className="absolute inset-0">
                                            {headerPosts[currentSlide].imageUrl ? (
                                                <Image
                                                    src={headerPosts[currentSlide].imageUrl}
                                                    alt="Announcement cover"
                                                    fill
                                                    className="object-cover opacity-60 transition-opacity duration-500"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${club.themeColor || '#64748b'} 0%, #1a202c 100%)`
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Content Overlay */}
                                        <div className={cn("absolute inset-x-0 bottom-0 p-5 md:p-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent", language === 'ar' && "text-right")}>
                                            <Badge className="mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-2 py-0.5 text-[10px] md:text-xs">
                                                {headerPosts[currentSlide].type === 'announcement' ? t.clubs.announcement : t.clubs.activity}
                                            </Badge>
                                            <Link href={`/clubs/${clubId}/posts/${headerPosts[currentSlide].id}`} className="block group-hover:underline decoration-white/50 underline-offset-4">
                                                <h3 className={cn("text-xl md:text-3xl font-bold text-white mb-2 line-clamp-2 md:line-clamp-1 leading-tight", language === 'ar' && "font-arabic")}>
                                                    {headerPosts[currentSlide].title}
                                                </h3>
                                            </Link>
                                            <p className={cn("text-slate-200 line-clamp-2 text-xs md:text-base mb-3 max-w-2xl font-medium", language === 'ar' && "font-arabic")}>
                                                {headerPosts[currentSlide].content}
                                            </p>
                                            <div className={cn("flex items-center gap-2 text-white/70 text-[10px] md:text-xs", language === 'ar' && "flex-row-reverse")}>
                                                <span className="truncate max-w-[120px] md:max-w-none">{t.common.by} {getAuthorInfo(headerPosts[currentSlide].author).name}</span>
                                                <span>•</span>
                                                <span>{new Date(headerPosts[currentSlide].createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}</span>
                                            </div>
                                        </div>

                                        {/* Navigation Buttons */}
                                        {headerPosts.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevSlide}
                                                    className={cn(
                                                        "absolute top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/40 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 z-20",
                                                        language === 'ar' ? "right-2 md:right-4" : "left-2 md:left-4"
                                                    )}
                                                >
                                                    {language === 'ar' ? <ChevronRight className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />}
                                                </button>
                                                <button
                                                    onClick={nextSlide}
                                                    className={cn(
                                                        "absolute top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/40 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 z-20",
                                                        language === 'ar' ? "left-2 md:left-4" : "right-2 md:right-4"
                                                    )}
                                                >
                                                    {language === 'ar' ? <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
                                                </button>

                                                {/* Dots */}
                                                <div className={cn("absolute top-3 md:top-4 flex gap-1.5", language === 'ar' ? "left-3 md:left-4" : "right-3 md:right-4")}>
                                                    {headerPosts.map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all shadow-sm",
                                                                idx === currentSlide ? "bg-white w-4 md:w-4" : "bg-white/40"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[200px] flex items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50">
                                        <p className="text-muted-foreground">{t.clubs.noAnnouncements}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container py-12 px-4 md:px-6">
                <Tabs defaultValue="activities" className="w-full">
                    <TabsList className={cn("flex w-full overflow-x-auto justify-start md:grid md:max-w-md md:grid-cols-3 mb-8 no-scrollbar bg-slate-100 p-1 rounded-xl", language === 'ar' && "flex-row-reverse")}>
                        <TabsTrigger value="activities" className={cn("whitespace-nowrap px-6 py-2", language === 'ar' && "font-arabic")}>{t.clubs.activitiesTab}</TabsTrigger>
                        <TabsTrigger value="structure" className={cn("whitespace-nowrap px-6 py-2", language === 'ar' && "font-arabic")}>{t.clubs.structureTab}</TabsTrigger>
                        <TabsTrigger value="members" className={cn("whitespace-nowrap px-6 py-2", language === 'ar' && "font-arabic")}>{t.clubs.membersTab}</TabsTrigger>
                        {userTickets.length > 0 && <TabsTrigger value="tickets" className={cn("whitespace-nowrap px-6 py-2", language === 'ar' && "font-arabic")}>{t.clubs.myTickets}</TabsTrigger>}
                    </TabsList>

                    {/* Activities Tab */}
                    <TabsContent value="activities" className="space-y-6">
                        <div className={cn("flex items-center justify-between mb-6", language === 'ar' && "flex-row-reverse")}>
                            <div className={cn("flex items-center gap-3", language === 'ar' && "flex-row-reverse")}>
                                <Calendar className="w-6 h-6 theme-text" />
                                <h2 className={cn("text-2xl font-bold", language === 'ar' && "font-arabic")}>{t.clubs.activitiesTitle}</h2>
                            </div>
                        </div>

                        {clubPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {clubPosts.map((post) => {
                                    const author = getAuthorInfo(post.author);
                                    return (
                                        <Link href={`/clubs/${clubId}/posts/${post.id}`} key={post.id}>
                                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col group">
                                                {/* Card Image */}
                                                {post.imageUrl && (
                                                    <div className="relative w-full h-48 bg-slate-100">
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}

                                                <CardHeader className={cn("flex-1 pb-2", language === 'ar' && "text-right")}>
                                                    <div className={cn("flex items-start justify-between gap-4 mb-2", language === 'ar' && "flex-row-reverse")}>
                                                        <Badge variant={
                                                            post.type === 'announcement' ? 'default' :
                                                                post.type === 'article' ? 'secondary' : 'outline'
                                                        }
                                                            style={post.type === 'announcement' ? { backgroundColor: club.themeColor || '#64748b' } : {}}
                                                            className={cn(language === 'ar' && "font-arabic")}
                                                        >
                                                            {post.type === 'announcement' ? t.clubs.announcement :
                                                                post.type === 'article' ? t.clubs.article : t.clubs.activity}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(post.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
                                                        </span>
                                                    </div>
                                                    <CardTitle className={cn("text-xl line-clamp-2 theme-hover-text transition-colors", language === 'ar' && "font-arabic")}>
                                                        {post.title}
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardContent className={cn(language === 'ar' && "text-right")}>
                                                    <p className={cn("text-muted-foreground line-clamp-3 text-sm", language === 'ar' && "font-arabic")}>
                                                        {post.content}
                                                    </p>
                                                </CardContent>

                                                <CardFooter className={cn("pt-0 border-t bg-slate-50/50 p-4 mt-auto", language === 'ar' && "flex-row-reverse")}>
                                                    <div className={cn("flex items-center gap-2 text-sm text-slate-600", language === 'ar' && "flex-row-reverse")}>
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div className={cn("flex flex-col", language === 'ar' && "text-right")}>
                                                            <span className={cn("font-medium text-xs text-slate-900", language === 'ar' && "font-arabic")}>{author.name}</span>
                                                            {author.role && (
                                                                <span className={cn("text-[10px] text-muted-foreground", language === 'ar' && "font-arabic")}>{author.role}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">
                                        {t.clubs.noActivities}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Organizational Structure Tab */}
                    <TabsContent value="structure" className="space-y-6">
                        <div className={cn(language === 'ar' && "text-right")}>
                            <h2 className={cn("text-2xl font-bold mb-2", language === 'ar' && "font-arabic")}>{t.clubs.structureTitle}</h2>
                            <p className={cn("text-muted-foreground mb-6", language === 'ar' && "font-arabic")}>
                                {t.clubs.structureDescription}
                            </p>
                        </div>
                        <OrganizationalChart organizationalChart={club.organizationalChart} />
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-6">
                        <div className={cn("flex items-center gap-3 mb-6", language === 'ar' && "flex-row-reverse")}>
                            <Users className="w-6 h-6 theme-text" />
                            <h2 className={cn("text-2xl font-bold", language === 'ar' && "font-arabic")}>{t.clubs.membersTitle}</h2>
                        </div>

                        {club.members && club.members.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {club.members.map((member, index) => (
                                    <ClubMemberCard key={index} member={member} showPhoto={true} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">
                                        {t.clubs.noMembers}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Tickets Tab */}
                    {userTickets.length > 0 && (
                        <TabsContent value="tickets" className="space-y-6">
                            <div className={cn("flex items-center gap-3 mb-6", language === 'ar' && "flex-row-reverse")}>
                                <Ticket className="w-6 h-6 theme-text" />
                                <h2 className={cn("text-2xl font-bold", language === 'ar' && "font-arabic")}>{t.clubs.myTickets}</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {userTickets.map(ticket => (
                                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: club.themeColor || '#64748b' }}>
                                            <CardContent className={cn("p-4 flex justify-between items-center", language === 'ar' && "flex-row-reverse")}>
                                                <div className={cn(language === 'ar' && "text-right")}>
                                                    <h3 className={cn("font-bold text-lg", language === 'ar' && "font-arabic")}>{ticket.eventName}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(ticket.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
                                                    </p>
                                                    <Badge className={cn("mt-2", language === 'ar' && "font-arabic")} variant={ticket.status === 'valid' ? 'default' : 'destructive'}>
                                                        {ticket.status === 'valid' ? (language === 'ar' ? 'صالح' : 'Validé') : (language === 'ar' ? 'قيد الانتظار' : 'En attente')}
                                                    </Badge>
                                                </div>
                                                <Ticket className="w-8 h-8 text-slate-300" />
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </section>
        </main>
    );
}
