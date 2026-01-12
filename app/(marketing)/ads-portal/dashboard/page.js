'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, ref, onValue, remove, set } from '@/lib/firebase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    LayoutDashboard,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    CreditCard,
    MessageSquare
} from 'lucide-react';
import { AD_STATUSES } from '@/lib/ad-constants';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status, t }) => {
    const isAr = t.common.arabic === "العربية"; // Simple check for language mode

    switch (status) {
        case AD_STATUSES.LIVE:
            return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><CheckCircle2 className={cn("w-3 h-3", isAr ? "ml-1" : "mr-1")} /> {t.adsPortal.statusLive}</Badge>;
        case AD_STATUSES.UNDER_REVIEW:
            return <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50"><Clock className={cn("w-3 h-3", isAr ? "ml-1" : "mr-1")} /> {t.adsPortal.statusReview}</Badge>;
        case AD_STATUSES.PAYMENT_REQUIRED:
            return <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50 animate-pulse"><CreditCard className={cn("w-3 h-3", isAr ? "ml-1" : "mr-1")} /> {t.adsPortal.statusPayment}</Badge>;
        case AD_STATUSES.EXPIRED:
            return <Badge className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50">{t.adsPortal.statusExpired}</Badge>;
        case AD_STATUSES.REFUSED:
            return <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50"><XCircle className={cn("w-3 h-3", isAr ? "ml-1" : "mr-1")} /> {t.adsPortal.statusRefused}</Badge>;
        case AD_STATUSES.DRAFT:
            return <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100">{t.adsPortal.statusDraft}</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

export default function UserAdsDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];
    const isAr = language === 'ar';

    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push(`/login?redirect=/ads-portal/dashboard`);
            return;
        }

        const adsRef = ref(db, 'studentAds');
        const unsubscribe = onValue(adsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const userAds = Object.entries(data)
                    .map(([id, ad]) => ({ id, ...ad }))
                    .filter(ad => ad.publisher === user.uid)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAds(userAds);
            } else {
                setAds([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, router]);

    const handleDelete = async (ad) => {
        if (ad.status === AD_STATUSES.LIVE) {
            const code = window.prompt(t.adsPortal.deleteLiveConfirm);
            if (code !== ad.invoiceId) {
                alert(t.adsPortal.deleteLiveError);
                return;
            }
        } else {
            if (!window.confirm(t.adsPortal.deleteConfirm)) return;
        }

        try {
            await remove(ref(db, `studentAds/${ad.id}`));
        } catch (error) {
            alert(t.adsPortal.errorDelete);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (!user) return null;

    return (
        <div className={cn(
            "min-h-screen bg-white",
            isAr && "rtl font-arabic"
        )}>
            <div className="container max-w-6xl mx-auto px-4 py-16">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="text-start w-full">
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                            <LayoutDashboard className="w-10 h-10 text-blue-600" />
                            {t.adsPortal.dashboardTitle}
                        </h1>
                        <p className="text-slate-500 mt-2">
                            {t.adsPortal.dashboardSubtitle}
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/ads-portal/submit')}
                        className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 px-8 font-bold shadow-xl shadow-slate-200 transition-all hover:scale-105"
                    >
                        <Plus className={cn("w-5 h-5", isAr ? "ml-3" : "mr-3")} />
                        {t.adsPortal.newAd}
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Plus className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {t.adsPortal.noAdsTitle}
                        </h2>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            {t.adsPortal.noAdsSubtitle}
                        </p>
                        <Button variant="outline" onClick={() => router.push('/ads-portal/submit')} className="rounded-full h-12 px-8">
                            {t.adsPortal.publishFirst}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {ads.map((ad) => (
                            <Card key={ad.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-[32px] bg-white">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Media Preview */}
                                        <div className="w-full md:w-64 h-48 md:h-auto relative bg-slate-100">
                                            {ad.type === 'video' ? (
                                                <video src={ad.url} className="w-full h-full object-cover" muted />
                                            ) : (
                                                <img src={ad.url} alt={ad.title} className="w-full h-full object-cover" />
                                            )}
                                            <div className={cn("absolute top-4", isAr ? "right-4" : "left-4")}>
                                                <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-none shadow-sm capitalize text-[10px]">
                                                    {isAr ? (ad.category === 'service' ? "خدمة" : ad.category === 'project' ? "مشروع" : ad.category) : ad.category}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow p-8">
                                            <div className="flex flex-col lg:flex-row justify-between items-start mb-4 gap-4">
                                                <div className="text-start">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-900">{ad.title}</h3>
                                                        <StatusBadge status={ad.status} t={t} />
                                                    </div>
                                                    <p className="text-slate-500 text-sm line-clamp-2 max-w-xl">
                                                        {ad.description}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {t.adsPortal.submittedOn} {formatDate(ad.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-50 items-center justify-between">
                                                <div className="flex gap-8">
                                                    <div className="text-start">
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{t.adsPortal.price}</p>
                                                        <p className="text-sm font-bold text-slate-900">{ad.price} MAD</p>
                                                    </div>
                                                    <div className="text-start">
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{t.adsPortal.duration}</p>
                                                        <p className="text-sm font-bold text-slate-900">{ad.duration} {isAr ? "أيام" : "jours"}</p>
                                                    </div>
                                                    {ad.status === AD_STATUSES.LIVE && (
                                                        <div className="text-start">
                                                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">{t.adsPortal.expiration}</p>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {ad.expirationDate ? formatDate(ad.expirationDate) : (isAr ? 'قريباً' : 'Bientôt')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {ad.status === AD_STATUSES.PAYMENT_REQUIRED && (
                                                        <Button
                                                            asChild
                                                            className="bg-orange-600 hover:bg-orange-700 h-10 px-6 rounded-xl font-bold"
                                                        >
                                                            <a href="https://wa.me/212715307349" target="_blank" rel="noopener noreferrer">
                                                                {t.adsPortal.payNow}
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50" asChild>
                                                        <a href={ad.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(ad)}
                                                        className="h-10 w-10 rounded-xl hover:bg-red-50 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Note if Refused */}
                                    {ad.status === AD_STATUSES.REFUSED && ad.adminNote && (
                                        <div className="bg-red-50 p-6 flex gap-4 items-start border-t border-red-100 text-start">
                                            <AlertCircle className={cn("w-5 h-5 text-red-500 mt-0.5", isAr ? "ml-4" : "mr-4")} />
                                            <div>
                                                <p className="text-sm font-bold text-red-900">{t.adsPortal.adminNote}</p>
                                                <p className="text-sm text-red-700 mt-1">{ad.adminNote}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Footer Help */}
                <div className="mt-20 p-10 bg-slate-900 rounded-[40px] text-white">
                    <div className="max-w-3xl text-start">
                        <h2 className="text-2xl font-bold mb-4">{t.adsPortal.needHelpTitle}</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            {t.adsPortal.needHelpSubtitle}
                        </p>
                        <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 font-bold">
                            <MessageSquare className={cn("w-4 h-4", isAr ? "ml-2" : "mr-2")} />
                            {t.adsPortal.contactSupport}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
