'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, ref, push, set, onValue, get, update, serverTimestamp } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Users, Info, Flame, AlertTriangle, Sparkles } from 'lucide-react';
import { cn, getUserLevel, getAcademicYear } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];
    const isAr = language === 'ar';

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [levelPrompt, setLevelPrompt] = useState(false);
    const [chatRoom, setChatRoom] = useState(null);
    const [ads, setAds] = useState([]);
    const scrollRef = useRef(null);

    // 1. Sync Authentication & Level Detection
    useEffect(() => {
        if (authLoading || !db) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const currentAcadYear = getAcademicYear();
        const userLevel = profile?.academicOverride?.[currentAcadYear] || getUserLevel(profile?.startYear);

        // If user hasn't confirmed their level for this year, show prompt
        if (profile) {
            if (!profile.academicOverride?.[currentAcadYear]) {
                setLevelPrompt(true);
            } else {
                setupChat(profile.filiere, userLevel);
            }
            fetchAds();
        }
    }, [user, profile, authLoading, db]);

    const fetchAds = async () => {
        const adsRef = ref(db, 'studentAds');
        const snapshot = await get(adsRef);
        if (snapshot.exists()) {
            const now = new Date();
            const adsData = Object.entries(snapshot.val())
                .map(([id, data]) => ({ id, ...data }))
                .filter(ad => ad.status === 'live' && (!ad.expirationDate || new Date(ad.expirationDate) > now))
                .sort(() => Math.random() - 0.5)
                .slice(0, 1); // Single ad in sidebar
            setAds(adsData);
        }
    };


    // 2. Chat Setup & July 1st Reset Logic
    const setupChat = async (filiere, level) => {
        const roomPath = `${filiere}_year${level}`;
        setChatRoom(roomPath);

        const currentYearStr = new Date().getFullYear().toString();
        const metadataRef = ref(db, `chats/${roomPath}/metadata`);

        try {
            const metaSnap = await get(metadataRef);
            const metadata = metaSnap.val() || {};

            // July 1st Reset Logic
            const now = new Date();
            const isAfterJuly = now.getMonth() >= 6;
            const resetYearNeeded = isAfterJuly ? currentYearStr : (parseInt(currentYearStr) - 1).toString();

            if (metadata.lastReset !== resetYearNeeded) {
                // Perform Auto-Wipe
                console.log("Academic year reset detected. Wiping chat...");
                await set(ref(db, `chats/${roomPath}/messages`), null);
                await update(metadataRef, { lastReset: resetYearNeeded });
            }
        } catch (err) {
            console.error("Reset check failed:", err);
        }

        // Listen for messages
        const messagesRef = ref(db, `chats/${roomPath}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const msgList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
            } else {
                setMessages([]);
            }
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        });

        return () => unsubscribe();
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatRoom || !user) return;

        const messagesRef = ref(db, `chats/${chatRoom}/messages`);
        const newMsgRef = push(messagesRef);

        const messageData = {
            text: newMessage.trim(),
            senderId: user.uid,
            senderName: `${profile.firstName} ${profile.lastName}`,
            timestamp: Date.now(),
            isMentor: getUserLevel(profile.startYear) === 2
        };

        setNewMessage('');
        await set(newMsgRef, messageData);
    };

    const confirmLevel = async (level) => {
        const currentAcadYear = getAcademicYear();
        await update(ref(db, `users/${user.uid}`), {
            [`academicOverride/${currentAcadYear}`]: level
        });
        setLevelPrompt(false);
        setupChat(profile.filiere, level);
    };

    if (authLoading || (loading && !levelPrompt)) return (
        <div className="flex-grow flex items-center justify-center min-h-[60vh] text-primary">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
    );

    return (
        <main className={cn(
            "container flex-grow py-6 flex flex-col h-[calc(100vh-140px)] max-h-[800px] gap-4",
            isAr && "rtl font-arabic"
        )}>
            {levelPrompt && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-in zoom-in-95 duration-300">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary font-black text-2xl">?</div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight">
                                {t.chat.academicVerification}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t.chat.newYearPrompt}
                            </p>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 pt-4">
                            <Button
                                className={cn("h-24 flex-col gap-2 font-bold transition-all", getUserLevel(profile?.startYear) === 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5")}
                                variant={getUserLevel(profile?.startYear) === 1 ? "default" : "outline"}
                                onClick={() => confirmLevel(1)}
                            >
                                <span className="text-2xl">{t.chat.year1}</span>
                                <span className="text-[10px] uppercase opacity-60">{t.chat.semesters1}</span>
                            </Button>
                            <Button
                                className={cn("h-24 flex-col gap-2 font-bold transition-all", getUserLevel(profile?.startYear) === 2 ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5")}
                                variant={getUserLevel(profile?.startYear) === 2 ? "default" : "outline"}
                                onClick={() => confirmLevel(2)}
                            >
                                <span className="text-2xl">{t.chat.year2}</span>
                                <span className="text-[10px] uppercase opacity-60">{t.chat.semesters2}</span>
                            </Button>
                        </CardContent>
                        <div className="p-4 bg-muted/30 text-[10px] text-center text-muted-foreground rounded-b-xl border-t">
                            <i className={cn("fas fa-info-circle", isAr ? "ml-1" : "mr-1")}></i> {t.chat.filiereInfo}
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex h-full gap-4 overflow-hidden">
                {/* Chat Sidebar */}
                <aside className="hidden md:flex flex-col w-64 gap-4">
                    <Card className="p-4 bg-primary text-white shadow-lg border-none text-start">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                            {t.chat.socialSpace}
                        </h3>
                        <h2 className="text-xl font-black truncate">
                            {t.fields[profile?.filiere] || profile?.filiere?.toUpperCase()}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-sm font-bold bg-white/10 p-2 rounded-lg">
                            <i className="fas fa-calendar-alt opacity-60"></i>
                            {getAcademicYear()}
                        </div>
                    </Card>

                    <Card className="flex-grow p-4 shadow-sm border-muted-foreground/10 overflow-auto text-start">
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center justify-between">
                            {t.chat.groupMembers} <span className="bg-primary/10 text-primary px-1.5 rounded-full text-[8px]">{t.chat.online}</span>
                        </h3>
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                                    <i className="fas fa-user text-primary"></i>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-bold truncate">{t.chat.me} ({profile?.firstName})</p>
                                    <p className="text-[8px] uppercase text-muted-foreground font-black">{t.chat.student}</p>
                                </div>
                            </div>
                        </div>

                        {ads.length > 0 && (
                            <div className="mt-auto pt-6 border-t">
                                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                                    {t.chat.focusStudent}
                                </h3>
                                {ads.map(ad => (
                                    <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="block group">
                                        <Card className="overflow-hidden border-none bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="relative aspect-video">
                                                <img src={ad.url} alt="" className="w-full h-full object-cover" />
                                                <div className={cn("absolute top-2", isAr ? "right-2" : "left-2")}>
                                                    <Badge className="bg-white/90 text-blue-600 border-none text-[8px] px-1 font-black">
                                                        {isAr ? "إعلان" : "PUB"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-[10px] font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{ad.title}</h4>
                                                <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{ad.description}</p>
                                            </div>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        )}
                    </Card>
                </aside>

                {/* Chat Window */}
                <Card className="flex-grow flex flex-col shadow-xl border-muted-foreground/10 overflow-hidden bg-white">
                    <header className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="md:hidden w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <i className="fas fa-comments text-primary"></i>
                            </div>
                            <div className="text-start">
                                <h2 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                                    {t.chat.generalDiscussion}
                                    <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {isAr ? "القناة" : "Canal"} S{getUserLevel(profile?.startYear) * 2 - 1}/S{getUserLevel(profile?.startYear) * 2}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full"><Info className="w-4 h-4" /></Button>
                    </header>

                    <div
                        className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth"
                        ref={scrollRef}
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 select-none px-12 text-center">
                                <i className="fas fa-ghost text-5xl mb-4"></i>
                                <h3 className="font-bold text-lg">{t.chat.emptyChatTitle}</h3>
                                <p className="text-xs">{t.chat.emptyChatSubtitle}</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.senderId === user.uid;
                                const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                                return (
                                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                        {isFirstInGroup && !isMe && (
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1",
                                                isAr ? "mr-1" : "ml-1"
                                            )}>
                                                {msg.senderName}
                                                {msg.isMentor && <i className="fas fa-crown text-[8px] text-yellow-500" title={t.chat.mentor}></i>}
                                            </span>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md text-start",
                                            isMe
                                                ? (isAr ? "bg-primary text-white rounded-tl-none" : "bg-primary text-white rounded-tr-none")
                                                : (isAr ? "bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200")
                                        )}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] opacity-40 mt-1 font-bold">
                                            {new Date(msg.timestamp).toLocaleTimeString(isAr ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <footer className="p-4 border-t bg-slate-50/50">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t.chat.inputPlaceholder}
                                className="flex-grow rounded-full border-muted-foreground/20 h-11 px-6 shadow-inner focus-visible:ring-primary/30"
                                maxLength={500}
                            />
                            <Button type="submit" size="icon" className="rounded-full w-11 h-11 shadow-lg shadow-primary/20 transition-transform active:scale-90" disabled={!newMessage.trim()}>
                                <Send className={cn("w-5 h-5", isAr && "rotate-180")} />
                            </Button>
                        </form>
                    </footer>
                </Card>
            </div>
        </main>
    );
}
