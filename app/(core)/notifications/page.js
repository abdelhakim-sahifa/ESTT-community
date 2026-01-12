'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { markAsRead, markGlobalAsRead, NOTIF_PRIORITY } from '@/lib/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Loader2, ArrowRight, Info, AlertTriangle, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function NotificationsPage() {
    const { user, profile } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const isAr = language === 'ar';

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user || !db) return;

        // Fetch private notifications
        const privateRef = ref(db, `notifications/private/${user.uid}`);
        const unsubPrivate = onValue(privateRef, (snapshot) => {
            const privateData = snapshot.val() || {};
            const privateList = Object.entries(privateData).map(([id, val]) => ({
                ...val,
                id,
                isGlobal: false
            }));

            // Fetch global notifications
            const globalRef = ref(db, 'notifications/global');
            onValue(globalRef, (gSnapshot) => {
                const globalData = gSnapshot.val() || {};
                const lastOpenedGlobal = profile?.notifications?.meta?.lastOpenedGlobalAt || 0;

                const globalList = Object.entries(globalData).map(([id, val]) => ({
                    ...val,
                    id,
                    isGlobal: true,
                    read: val.createdAt <= lastOpenedGlobal
                }));

                // Combine and sort
                const combined = [...privateList, ...globalList].sort((a, b) => b.createdAt - a.createdAt);
                setNotifications(combined);
                setLoading(false);
            }, { onlyOnce: true });
        });

        return () => {
            unsubPrivate();
        };
    }, [user, profile, db]);

    const handleMarkAllRead = async () => {
        if (!user) return;

        // Mark private as read
        const unreadPrivate = notifications.filter(n => !n.isGlobal && !n.read);
        for (const n of unreadPrivate) {
            await markAsRead(user.uid, n.id);
        }

        // Mark global as read (update meta)
        await markGlobalAsRead(user.uid);
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            if (notif.isGlobal) {
                await markGlobalAsRead(user.uid);
            } else {
                await markAsRead(user.uid, notif.id);
            }
        }

        if (notif.action && notif.action.target) {
            // Support dynamic parameters
            let finalTarget = notif.action.target
                .replace(/{uid}/g, user?.uid || '')
                .replace(/{email}/g, user?.email || '')
                .replace(/{firstName}/g, profile?.firstName || '')
                .replace(/{lastName}/g, profile?.lastName || '');

            if (notif.action.type === 'navigate') {
                router.push(finalTarget);
            } else if (notif.action.type === 'external_link') {
                window.open(finalTarget, '_blank');
            }
        }
    };


    const getIcon = (iconName) => {
        switch (iconName) {
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            case 'alert-triangle': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'megaphone': return <Megaphone className="w-5 h-5 text-primary" />;
            case 'credit-card': return <Bell className="w-5 h-5 text-orange-500" />;
            case 'book-open': return <Bell className="w-5 h-5 text-emerald-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const formatDate = (dateValue) => {
        const date = new Date(dateValue);
        return date.toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={cn(
            "container max-w-2xl py-12 px-4",
            isAr && "rtl font-arabic"
        )}>
            <div className="flex items-center justify-between mb-8">
                <div className="text-start">
                    <h1 className="text-3xl font-black tracking-tight">{t.notifications.title}</h1>
                    <p className="text-muted-foreground mt-1">{t.notifications.subtitle}</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/5 font-bold"
                        onClick={handleMarkAllRead}
                    >
                        <CheckCheck className={cn("w-4 h-4", isAr ? "ml-2" : "mr-2")} /> {t.notifications.markAllRead}
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="border-none shadow-sm bg-slate-50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <Bell className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="font-bold text-slate-900">{t.notifications.noNotificationsTitle}</h3>
                        <p className="text-sm text-slate-500 max-w-[250px] mt-2">
                            {t.notifications.noNotificationsSubtitle}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={cn(
                                "border-none shadow-sm transition-all cursor-pointer hover:shadow-md",
                                !notif.read ? "bg-white border-l-4 border-l-primary" : "bg-slate-50/50"
                            )}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <CardContent className="p-5 flex gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100",
                                    !notif.read ? "bg-primary/5" : "bg-white"
                                )}>
                                    {getIcon(notif.icon)}
                                </div>
                                <div className="flex-grow min-w-0 text-start">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className={cn("text-sm font-bold truncate", !notif.read ? "text-slate-900" : "text-slate-600")}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap uppercase tracking-wider">
                                            {formatDate(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                    </p>

                                    {notif.action && (
                                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-primary uppercase tracking-tighter group">
                                            {t.notifications.viewDetails} <ArrowRight className={cn("w-3 h-3 transition-transform", isAr ? "mr-1 rotate-180 group-hover:-translate-x-1" : "ml-1 group-hover:translate-x-1")} />
                                        </div>
                                    )}
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 animate-pulse" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
