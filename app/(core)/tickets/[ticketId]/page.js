'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get, onValue } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, Calendar, User, Building2, CheckCircle2, AlertCircle, ArrowLeft, ChevronRight, MapPin, Clock, Share2, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function TicketPage() {
    const params = useParams();
    const ticketId = params.ticketId;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [club, setClub] = useState(null);
    const { language } = useLanguage();
    const t = translations[language];
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (!ticketId || !db) return;

        const ticketRef = ref(db, `tickets/${ticketId}`);

        // Use onValue for real-time status updates (Validated by admin)
        const unsubscribe = onValue(ticketRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setTicket({ id: ticketId, ...data });

                // Fetch club data for theme/branding if not already fetched
                if (!club) {
                    const clubSnap = await get(ref(db, `clubs/${data.clubId}`));
                    if (clubSnap.exists()) {
                        setClub(clubSnap.val());
                    }
                }

                // Fallback Verification: If session_id is in URL and ticket still awaiting_payment
                if (sessionId && data.status === 'awaiting_payment' && !verifying) {
                    setVerifying(true);
                    try {
                        await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ticketId, sessionId })
                        });
                    } catch (err) {
                        console.error("Verification callback failed:", err);
                    } finally {
                        setVerifying(false);
                    }
                }

                setLoading(false);
            } else {
                setError(t.tickets.notFound);
                setLoading(false);
            }
        }, (err) => {
            console.error(err);
            setError(t.tickets.errorLoading);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [ticketId, db, sessionId, verifying]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 px-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <p className={cn("text-xl font-bold text-white", language === 'ar' && "font-arabic")}>{error || t.tickets.invalid}</p>
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Link href="/">{t.common.backToHome}</Link>
                </Button>
            </div>
        );
    }

    // QR Code Data - Using just the ID for simplicity and security
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;

    const themeColor = club?.themeColor || '#0ea5e9';

    return (
        <main className="min-h-screen bg-slate-950 py-12 px-4 md:py-20 flex items-center justify-center overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-80 h-80 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ backgroundColor: themeColor }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ backgroundColor: themeColor, animationDelay: '2s' }} />

            <div className="w-full max-w-md space-y-6 relative z-10">
                <div className={cn("flex items-center justify-between", language === 'ar' && "flex-row-reverse")}>
                    <Button variant="ghost" asChild className={cn("text-white/60 hover:text-white hover:bg-white/5", language === 'ar' && "flex-row-reverse")}>
                        <Link href={`/clubs/${ticket.clubId}`}>
                            {language === 'ar' ? <ChevronRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                            {t.tickets.backToClub}
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5" onClick={() => window.print()}>
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* THE TICKET */}
                <div className="flex flex-col shadow-2xl rounded-[2.5rem] overflow-hidden bg-white group animate-in slide-in-from-bottom-8 duration-700">
                    {/* Top Part: Branding & Event */}
                    <div className={cn("relative p-8 text-white min-h-[160px] flex flex-col justify-end", language === 'ar' && "text-right items-end")} style={{ backgroundColor: themeColor }}>
                        <div className={cn("absolute top-0 p-6 opacity-10", language === 'ar' ? "left-0" : "right-0")}>
                            <Ticket className="w-24 h-24 rotate-12" />
                        </div>
                        <div className={cn("absolute top-8", language === 'ar' ? "right-8" : "left-8")}>
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{ticket.clubName}</span>
                            </div>
                        </div>
                        <h1 className={cn("text-3xl font-black uppercase tracking-tight leading-none mb-1", language === 'ar' && "font-arabic")}>{ticket.eventName}</h1>
                        <p className={cn("text-white/70 text-sm font-medium", language === 'ar' && "font-arabic")}>{t.tickets.officialTicket}</p>
                    </div>

                    {/* Middle: Details */}
                    <div className="bg-white p-8 relative">
                        {/* Punch holes */}
                        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950" />
                        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950" />

                        {/* Perforated line */}
                        <div className="absolute top-0 left-8 right-8 h-[2px] border-t-2 border-dashed border-slate-200 -translate-y-1/2" />

                        <div className={cn("grid grid-cols-2 gap-y-6", language === 'ar' && "text-right")}>
                            <div className="space-y-1">
                                <p className={cn("text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1", language === 'ar' && "flex-row-reverse")}>
                                    <User className="w-3 h-3" /> {t.tickets.participant}
                                </p>
                                <p className={cn("font-bold text-slate-900 line-clamp-1", language === 'ar' && "font-arabic")}>{ticket.firstName} {ticket.lastName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className={cn("text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1", language === 'ar' && "flex-row-reverse")}>
                                    <Calendar className="w-3 h-3" /> {t.tickets.date}
                                </p>
                                <p className={cn("font-bold text-slate-900", language === 'ar' && "font-arabic")}>{ticket.eventDate || new Date(ticket.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}</p>
                            </div>
                            {ticket.eventTime && (
                                <div className="space-y-1">
                                    <p className={cn("text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1", language === 'ar' && "flex-row-reverse")}>
                                        <Clock className="w-3 h-3" /> {t.tickets.time}
                                    </p>
                                    <p className={cn("font-bold text-slate-900", language === 'ar' && "font-arabic")}>{ticket.eventTime}</p>
                                </div>
                            )}
                            {ticket.eventLocation && (
                                <div className="space-y-1">
                                    <p className={cn("text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1", language === 'ar' && "flex-row-reverse")}>
                                        <MapPin className="w-3 h-3" /> {t.tickets.location}
                                    </p>
                                    <p className={cn("font-bold text-slate-900 line-clamp-1", language === 'ar' && "font-arabic")}>{ticket.eventLocation}</p>
                                </div>
                            )}
                        </div>

                        {/* Status Banner */}
                        <div className={cn(
                            "mt-8 p-4 rounded-2xl flex items-center transition-all duration-500 border-2",
                            language === 'ar' ? "flex-row-reverse text-right" : "flex-row",
                            ticket.status === 'valid'
                                ? "bg-green-50 border-green-100 text-green-700"
                                : "bg-amber-50 border-amber-100 text-amber-700 animate-pulse"
                        )}>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                ticket.status === 'valid' ? "bg-green-500 text-white" : "bg-amber-500 text-white",
                                language === 'ar' ? "ml-4" : "mr-4"
                            )}>
                                {ticket.status === 'valid' ? <CheckCircle2 className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />}
                            </div>
                            <div>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-70", language === 'ar' && "font-arabic")}>{t.tickets.status}</p>
                                <p className={cn("font-black text-sm uppercase", language === 'ar' && "font-arabic")}>
                                    {ticket.status === 'valid' ? (ticket.checkedIn ? t.tickets.used : t.tickets.validatedReady) : t.tickets.awaitingValidation}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: QR Code */}
                    <div className="bg-slate-50 p-10 flex flex-col items-center justify-center relative">
                        {/* Perforated line */}
                        <div className="absolute top-0 left-8 right-8 h-[2px] border-t-2 border-dashed border-slate-200" />

                        <div className={cn(
                            "p-4 bg-white rounded-[2rem] shadow-sm border-2 transition-all duration-1000",
                            ticket.status === 'valid' ? "border-slate-200" : "border-slate-100 opacity-20 filter grayscale"
                        )}>
                            <Image
                                src={qrUrl}
                                alt="QR Code"
                                width={200}
                                height={200}
                                className="w-48 h-48"
                            />
                        </div>

                        {ticket.status !== 'valid' && (
                            <div className="absolute inset-0 flex items-center justify-center px-12 text-center">
                                <p className={cn("bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl text-xs font-bold text-slate-600", language === 'ar' && "font-arabic")}>
                                    {t.tickets.qrActivationInfo}
                                </p>
                            </div>
                        )}

                        <div className="mt-6 text-center space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ticket ID</p>
                            <p className="text-xs font-mono text-slate-400">{ticket.id.toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className={cn("text-white/40 text-[10px] font-medium uppercase tracking-widest", language === 'ar' && "font-arabic")}>
                        {t.tickets.poweredBy}
                    </p>
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    .bg-slate-950 { background: white !important; }
                    main { padding: 0 !important; }
                    .no-print { display: none !important; }
                    button { display: none !important; }
                }
            `}</style>
        </main>
    );
}
