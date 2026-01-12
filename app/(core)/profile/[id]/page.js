'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/image-constants';
import { db, ref, get, set, update, onValue, query, orderByChild, equalTo } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, User, Mail, GraduationCap, Calendar, Share2, Star, Ticket, Edit2, Check, X, Megaphone } from 'lucide-react';
import { cn, getUserLevel } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Globe } from 'lucide-react';

export default function PublicProfilePage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStarred, setIsStarred] = useState(false);
    const [starCount, setStarCount] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [userClubs, setUserClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language];

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        filiere: '',
        startYear: ''
    });

    useEffect(() => {
        if (!id) return;

        const profileRef = ref(db, `users/${id}`);
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile(data);
                setStarCount(data.stars || 0);
                setIsStarred(data.starredBy && currentUser && data.starredBy[currentUser.uid]);
            } else {
                setError("Profil introuvable");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser]);

    // Populate form data when profile is loaded
    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                filiere: profile.filiere || '',
                startYear: profile.startYear || ''
            });
        }
    }, [profile]);

    // Fetch Tickets separate effect
    useEffect(() => {
        if (!id || !currentUser || currentUser.uid !== id) return;

        const fetchTickets = async () => {
            setLoadingTickets(true);
            try {
                const ticketsRef = ref(db, 'tickets');
                const snap = await get(ticketsRef);
                if (snap.exists()) {
                    const data = snap.val();
                    const userTickets = Object.entries(data)
                        .map(([id, t]) => ({ id, ...t }))
                        .filter(t => t.userId === id)
                        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setTickets(userTickets);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingTickets(false);
            }
        };
        fetchTickets();
    }, [id, currentUser]);

    // Fetch Clubs where user is a member
    useEffect(() => {
        if (!profile || !id) return;

        const fetchUserClubs = async () => {
            setLoadingClubs(true);
            try {
                const clubsRef = ref(db, 'clubs');
                const snap = await get(clubsRef);
                if (snap.exists()) {
                    const allClubs = snap.val();
                    const userEmail = profile.email?.toLowerCase();
                    const userId = id;

                    const associatedClubs = Object.entries(allClubs).map(([cId, club]) => ({
                        id: cId,
                        ...club
                    })).filter(club => {
                        // Check in organizationalChart
                        const inOrg = club.organizationalChart && Object.values(club.organizationalChart).some(member =>
                            member?.email?.toLowerCase() === userEmail
                        );

                        // Check in members array
                        const inMembers = club.members && Array.isArray(club.members) && club.members.some(member =>
                            member?.email?.toLowerCase() === userEmail || member?.id === userId
                        );

                        return inOrg || inMembers;
                    });

                    setUserClubs(associatedClubs);
                }
            } catch (e) {
                console.error("Error fetching user clubs:", e);
            } finally {
                setLoadingClubs(false);
            }
        };

        fetchUserClubs();
    }, [profile, id]);

    const handleStar = async () => {
        if (!currentUser) {
            alert(language === 'ar' ? "يجب أن تكون مسجلاً للإعجاب بملف شخصي." : "Vous devez être connecté pour liker un profil.");
            return;
        }
        if (currentUser.uid === id) {
            alert(language === 'ar' ? "لا يمكنك الإعجاب بملفك الشخصي." : "Vous ne pouvez pas liker votre propre profil.");
            return;
        }

        const newIsStarred = !isStarred;
        const newStarCount = newIsStarred ? starCount + 1 : Math.max(0, starCount - 1);

        try {
            await update(ref(db, `users/${id}`), {
                stars: newStarCount,
                [`starredBy/${currentUser.uid}`]: newIsStarred || null
            });
            // The onValue listener will update the state, but we can update it locally for immediate feedback
            setIsStarred(newIsStarred);
            setStarCount(newStarCount);
        } catch (err) {
            console.error("Error updating star:", err);
            alert(language === 'ar' ? "حدث خطأ أثناء تحديث الإعجابات." : "Une erreur est survenue lors de la mise à jour des stars.");
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser || currentUser.uid !== id) return;

        setSaving(true);
        try {
            const profileRef = ref(db, `users/${id}`);
            await update(profileRef, {
                ...formData,
                updatedAt: Date.now()
            });
            setIsEditOpen(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert(language === 'ar' ? "خطأ أثناء تحديث الملف الشخصي." : "Erreur lors de la mise à jour du profil.");
        } finally {
            setSaving(false);
        }
    };

    const copyProfileLink = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({
                    title: `Profil de ${profile.firstName} ${profile.lastName} | ESTT Community`,
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(url);
                alert(t.profile.copyLink);
            }
        } catch (err) {
            console.error("Error sharing profile:", err);
            if (err.name !== 'AbortError') {
                // Fallback to clipboard
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    alert(t.profile.copyLink);
                } catch (e) {
                    alert(language === 'ar' ? "تعذر نسخ الرابط." : "Impossible de copier le lien.");
                }
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-primary">
            <Loader2 className="animate-spin w-10 h-10" />
            <p className="ml-2">{t.common.loading}</p>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-[60vh] text-destructive">
            {language === 'ar' && error === 'Profil introuvable' ? 'الملف الشخصي غير موجود' : error}
        </div>
    );


    const level = getUserLevel(profile?.startYear);
    const contributionsCount = Object.keys(profile?.contributions || {}).length;
    const isMentor = level === 2 && contributionsCount > 5;

    return (
        <main className="min-h-screen bg-slate-50 py-12">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <Card className="text-center p-8 bg-white border-slate-200 shadow-sm overflow-hidden relative">
                            {isMentor && (
                                <div className={cn(
                                    "absolute top-0 bg-yellow-400 text-white px-3 py-1 shadow-sm text-[10px] font-bold uppercase tracking-wider z-10",
                                    language === 'ar' ? "left-0 rounded-br-lg" : "right-0 rounded-bl-lg"
                                )}>
                                    {t.profile.mentor}
                                </div>
                            )}
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100 shadow-sm">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <CardTitle className={cn("text-2xl font-bold text-slate-900", language === 'ar' && "font-arabic")}>
                                {profile.firstName} {profile.lastName}
                            </CardTitle>
                            <p className="text-muted-foreground font-medium text-sm mt-1">
                                {t.fields[profile.filiere] || profile.filiere} • {level === 1 ? 'S1/S2' : 'S3/S4'}
                            </p>

                            <div className="flex justify-center gap-2 mt-6">
                                {currentUser && currentUser.uid === id ? (
                                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                        <DialogTrigger asChild>
                                            <Button className={cn("rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm gap-2", language === 'ar' && "flex-row-reverse")}>
                                                <Edit2 className="w-4 h-4" />
                                                {t.profile.editProfile}
                                            </Button>
                                        </DialogTrigger>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className={cn("rounded-full px-6 border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold gap-2 shadow-sm", language === 'ar' && "flex-row-reverse")}
                                        >
                                            <Link href="/ads-portal/dashboard">
                                                <Megaphone className="w-4 h-4" />
                                                {t.profile.annoncement}
                                            </Link>
                                        </Button>
                                        <DialogContent className="sm:max-w-md rounded-2xl">
                                            <DialogHeader>
                                                <DialogTitle className={cn("text-xl font-bold", language === 'ar' && "font-arabic")}>{t.profile.editProfile}</DialogTitle>
                                                <DialogDescription className={cn(language === 'ar' && "font-arabic")}>
                                                    {t.profile.updatePublicInfo}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="firstName">{t.profile.firstName}</Label>
                                                        <Input
                                                            id="firstName"
                                                            value={formData.firstName}
                                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                            className="rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="lastName">{t.profile.lastName}</Label>
                                                        <Input
                                                            id="lastName"
                                                            value={formData.lastName}
                                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                            className="rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="email">{t.profile.email}</Label>
                                                    <Input
                                                        id="email"
                                                        value={profile.email}
                                                        disabled
                                                        className="rounded-lg bg-slate-50 text-slate-500"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="filiere">{t.profile.filiere}</Label>
                                                        <Input
                                                            id="filiere"
                                                            value={formData.filiere}
                                                            onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                                                            className="rounded-lg uppercase"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="startYear">{t.profile.startYear}</Label>
                                                        <Input
                                                            id="startYear"
                                                            type="number"
                                                            value={formData.startYear}
                                                            onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                                                            className="rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter className={cn("flex gap-2", language === 'ar' && "flex-row-reverse")}>
                                                <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-lg">
                                                    {t.common.annuler}
                                                </Button>
                                                <Button onClick={handleSaveProfile} disabled={saving} className="rounded-lg bg-primary text-white">
                                                    {saving ? <Loader2 className={cn("w-4 h-4 animate-spin", language === 'ar' ? "ml-2" : "mr-2")} /> : null}
                                                    {t.common.enregistrer}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button
                                        variant={isStarred ? "default" : "outline"}
                                        className={cn("rounded-full px-6 transition-all", isStarred && "bg-yellow-500 hover:bg-yellow-600 border-none text-white")}
                                        onClick={handleStar}
                                    >
                                        <Star className={cn("w-4 h-4", isStarred && "fill-current")} />
                                        <span className={cn(language === 'ar' ? "mr-2" : "ml-2")}>{starCount}</span>
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" className="rounded-full" onClick={copyProfileLink}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border-slate-200 shadow-sm">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                <i className="fas fa-info-circle text-primary"></i> {t.profile.about}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                    <span>{t.profile.promotion} {profile.startYear}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{t.profile.memberSince} {new Date(profile.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </Card>

                        {currentUser && currentUser.uid === id && (
                            <Card className="p-6 bg-white border-slate-200 shadow-sm">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" /> {t.common.language}
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant={language === 'fr' ? 'default' : 'outline'}
                                        className="flex-1 rounded-xl"
                                        onClick={() => toggleLanguage('fr')}
                                    >
                                        Français
                                    </Button>
                                    <Button
                                        variant={language === 'ar' ? 'default' : 'outline'}
                                        className="flex-1 rounded-xl font-arabic"
                                        onClick={() => toggleLanguage('ar')}
                                    >
                                        العربية
                                    </Button>
                                </div>
                            </Card>
                        )}

                        <Card className="p-6 bg-white border-slate-200 shadow-sm">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                <i className="fas fa-medal text-primary"></i> {t.profile.success}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {contributionsCount >= 1 && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1">
                                        {t.profile.contributor}
                                    </Badge>
                                )}
                                {contributionsCount >= 10 && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 py-1">
                                        {t.profile.majorContributor}
                                    </Badge>
                                )}
                                {starCount >= 5 && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-3 py-1">
                                        {t.profile.popular}
                                    </Badge>
                                )}
                                {level === 2 && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 py-1">
                                        {t.profile.alumnus}
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Contributions & Clubs */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <i className="fas fa-book-open text-primary"></i> {t.profile.contributions}
                                </h2>
                                <Badge variant="outline">{contributionsCount}</Badge>
                            </div>
                            <div className="grid gap-3">
                                {profile.contributions ? (
                                    Object.entries(profile.contributions)
                                        .filter(([_, item]) => !item.unverified) // Filter unverified
                                        .sort((a, b) => b[1].timestamp - a[1].timestamp)
                                        .map(([id, item]) => (
                                            <Card key={id} className="p-4 hover:shadow-md transition-all border-slate-200 bg-white group cursor-pointer">
                                                <div className="flex justify-between items-center text-left">
                                                    <div className={cn(language === 'ar' && "text-right")}>
                                                        <h3 className={cn("font-semibold text-slate-900 group-hover:text-primary transition-colors", language === 'ar' && "font-arabic")}>{item.title}</h3>
                                                        <div className={cn("flex items-center gap-2 mt-1", language === 'ar' && "flex-row-reverse")}>
                                                            <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{item.module || (language === 'ar' ? 'مورد' : 'Ressource')}</span>
                                                            <span className="text-xs text-slate-400">• {new Date(item.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}</span>
                                                        </div>
                                                    </div>
                                                    <Share2 className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                                </div>
                                            </Card>
                                        ))
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <p className="text-slate-400 text-sm">{t.profile.none}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <i className="fas fa-users text-primary"></i>{t.common.clubs}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {loadingClubs ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto col-span-full" />
                                ) : userClubs.length > 0 ? (
                                    userClubs.map(club => (
                                        <Link key={club.id} href={`/clubs/${club.id}`} className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-center">
                                            <div className="relative w-12 h-12 mx-auto mb-3">
                                                {club.logo ? (
                                                    <Image src={club.logo} alt={club.name} fill sizes={IMAGE_SIZES.CLUB_LOGO_MD} className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: club.themeColor || '#64748b' }}>
                                                        {club.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{club.name}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <p className="text-slate-400 text-sm">{t.profile.noClubs}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {currentUser && currentUser.uid === id && (
                            <section>
                                <h2 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                                    <Ticket className="w-5 h-5" /> {t.profile.myTickets}
                                </h2>
                                <div className="grid gap-3">
                                    {loadingTickets ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto" />
                                    ) : tickets.length > 0 ? (
                                        tickets.map(ticket => (
                                            <Card key={ticket.id} className="p-4 border-slate-200 bg-white hover:shadow-sm transition-all border-l-4 border-l-orange-500">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{ticket.eventName}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className={ticket.status === 'valid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}>
                                                                {ticket.status === 'valid' ? t.profile.validated : t.profile.pending}
                                                            </Badge>
                                                            <span className="text-xs text-slate-400">{ticket.clubName}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild className={cn("rounded-lg h-8 px-3", language === 'ar' && "flex-row-reverse")}>
                                                        <a href={`/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                                                            {t.profile.view} <i className={cn("fas ml-2 text-xs", language === 'ar' ? "fa-arrow-left" : "fa-arrow-right")}></i>
                                                        </a>
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                            <p className="text-slate-400 text-sm">{t.profile.noTickets}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
