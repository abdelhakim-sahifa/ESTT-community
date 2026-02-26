'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, ref, push, set, onValue, get, update, serverTimestamp, increment } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Users, Info, Flame, AlertTriangle, Sparkles, Badge } from 'lucide-react';
import { cn, getUserLevel, getAcademicYear } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger
} from '@/components/ui/sheet';
import { MessageSquareReply, MessageSquare } from 'lucide-react';

export default function ChatPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [levelPrompt, setLevelPrompt] = useState(false);
    const [chatRoom, setChatRoom] = useState(null);
    const [ads, setAds] = useState([]);
    const scrollRef = useRef(null);
    const threadScrollRef = useRef(null);

    // Thread State
    const [activeThread, setActiveThread] = useState(null); // The parent message object
    const [threadMessages, setThreadMessages] = useState([]);
    const [newThreadMessage, setNewThreadMessage] = useState('');
    const [loadingThread, setLoadingThread] = useState(false);

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

    // 3. Thread Logic
    const openThread = (message) => {
        setActiveThread(message);
        setThreadMessages([]);
        setLoadingThread(true);

        const threadRef = ref(db, `chats/${chatRoom}/threads/${message.id}/replies`);
        const unsubscribe = onValue(threadRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const msgList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setThreadMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
            } else {
                setThreadMessages([]);
            }
            setLoadingThread(false);
            setTimeout(scrollThreadToBottom, 100);
        });

        return unsubscribe;
    };

    const scrollThreadToBottom = () => {
        if (threadScrollRef.current) {
            threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
        }
    };

    const handleSendThreadReply = async (e) => {
        e.preventDefault();
        if (!newThreadMessage.trim() || !chatRoom || !user || !activeThread) return;

        const currentThreadId = activeThread.id;
        const threadRef = ref(db, `chats/${chatRoom}/threads/${currentThreadId}/replies`);
        const newReplyRef = push(threadRef);

        const replyData = {
            text: newThreadMessage.trim(),
            senderId: user.uid,
            senderName: `${profile.firstName} ${profile.lastName}`,
            timestamp: Date.now(),
            isMentor: getUserLevel(profile.startYear) === 2
        };

        setNewThreadMessage('');
        await set(newReplyRef, replyData);

        // Update reply count on parent message
        const parentMsgRef = ref(db, `chats/${chatRoom}/messages/${currentThreadId}`);
        await update(parentMsgRef, {
            replyCount: increment(1)
        });
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

    const sidebarContent = (
        <Card className="flex-grow p-5 shadow-sm border-slate-200 bg-white/50 backdrop-blur-sm overflow-auto h-full">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center justify-between">
                Membres du groupe <span className="bg-primary/10 text-primary px-1.5 rounded-full text-[8px]">En ligne</span>
            </h3>
            <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 group cursor-default">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                        <i className="fas fa-user text-primary"></i>
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold truncate text-slate-700">Moi ({profile?.firstName})</p>
                        <p className="text-[8px] uppercase text-primary/70 font-black tracking-widest">Connecté</p>
                    </div>
                </div>
            </div>

            {ads.length > 0 && (
                <div className="mt-auto pt-6 border-t">
                    <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Focus Étudiant</h3>
                    {ads.map(ad => (
                        <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="block group">
                            <Card className="overflow-hidden border-none bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="relative aspect-video">
                                    <img src={ad.url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2">
                                        <Badge className="bg-white/90 text-blue-600 border-none text-[8px] px-1 font-black">PUB</Badge>
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
    );

    return (
        <main className="min-h-screen bg-slate-50/30">
            {/* Header Section - Matches ClubsPage style */}
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-b">
                <div className="container py-8 md:py-12 px-4 md:px-6">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase">
                                    Espace Discussion
                                </h1>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                    {profile?.filiere?.toUpperCase()} •
                                    CANAL S{getUserLevel(profile?.startYear) * 2 - 1}/S{getUserLevel(profile?.startYear) * 2}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xl">
                            Échangez avec vos camarades de filière, posez vos questions et partagez des informations en temps réel.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container py-8 px-4 md:px-6">
                {levelPrompt && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-in zoom-in-95 duration-300">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary font-black text-2xl">?</div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Vérification Académique</CardTitle>
                                <p className="text-sm text-muted-foreground">Une nouvelle année à commencé ! En quelle année es-tu ?</p>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 pt-4">
                                <Button
                                    className={cn("h-24 flex-col gap-2 font-bold transition-all", getUserLevel(profile?.startYear) === 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5")}
                                    variant={getUserLevel(profile?.startYear) === 1 ? "default" : "outline"}
                                    onClick={() => confirmLevel(1)}
                                >
                                    <span className="text-2xl">1ère Année</span>
                                    <span className="text-[10px] uppercase opacity-60">S1 / S2</span>
                                </Button>
                                <Button
                                    className={cn("h-24 flex-col gap-2 font-bold transition-all", getUserLevel(profile?.startYear) === 2 ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5")}
                                    variant={getUserLevel(profile?.startYear) === 2 ? "default" : "outline"}
                                    onClick={() => confirmLevel(2)}
                                >
                                    <span className="text-2xl">2ème Année</span>
                                    <span className="text-[10px] uppercase opacity-60">S3 / S4</span>
                                </Button>
                            </CardContent>
                            <div className="p-4 bg-muted/30 text-[10px] text-center text-muted-foreground rounded-b-xl border-t">
                                <i className="fas fa-info-circle mr-1"></i> Cela détermine ton canal de discussion automatique.
                            </div>
                        </Card>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-22rem)] min-h-[500px]">
                    {/* Chat Sidebar */}
                    <aside className="hidden md:flex flex-col w-72 gap-6">
                        {sidebarContent}
                    </aside>

                    {/* Chat Window */}
                    <div className="flex-grow flex flex-col shadow-xl shadow-slate-200/50 border border-slate-200 rounded-3xl overflow-hidden bg-white">
                        <header className="px-6 py-4 border-b flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                                    Discussion Générale
                                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                                </h2>
                            </div>
                            <div className="flex items-center gap-1">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="md:hidden rounded-full text-slate-400">
                                            <Users className="w-4 h-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-72 p-0 border-r border-slate-200 bg-white">
                                        <div className="p-6">
                                            <h2 className="text-lg font-black uppercase mb-6">Membres</h2>
                                            {sidebarContent}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-600">
                                    <Info className="w-4 h-4" />
                                </Button>
                            </div>
                        </header>

                        <div
                            className="flex-grow overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 scroll-smooth bg-slate-50/30"
                            ref={scrollRef}
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 select-none px-12 text-center">
                                    <i className="fas fa-ghost text-5xl mb-4"></i>
                                    <h3 className="font-bold text-lg">C'est bien calme ici...</h3>
                                    <p className="text-xs">Sois le premier à briser la glace avec tes camarades !</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.senderId === user.uid;
                                    const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                                    return (
                                        <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            {isFirstInGroup && !isMe && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1 flex items-center gap-1">
                                                    {msg.senderName}
                                                    {msg.isMentor && <i className="fas fa-crown text-[8px] text-yellow-500" title="Mentor"></i>}
                                                </span>
                                            )}
                                            <div className={cn(
                                                "max-w-[90%] md:max-w-[85%] px-4 md:px-5 py-3 md:py-3.5 rounded-2xl md:rounded-3xl text-[13px] leading-relaxed transition-all group/msg relative",
                                                isMe
                                                    ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20"
                                                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm"
                                            )}>
                                                {msg.text}

                                                <button
                                                    onClick={() => openThread(msg)}
                                                    className={cn(
                                                        "absolute -bottom-2.5 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-md text-[10px] font-bold text-slate-600 hover:text-primary active:scale-95 z-20",
                                                        isMe ? "right-0" : "left-0"
                                                    )}
                                                >
                                                    <MessageSquareReply className="w-3 h-3" />
                                                    Répondre
                                                </button>
                                            </div>
                                            {msg.replyCount > 0 && (
                                                <button
                                                    onClick={() => openThread(msg)}
                                                    className={cn(
                                                        "text-[10px] font-bold text-primary mt-3 flex items-center gap-1.5 hover:text-primary/70 transition-colors active:scale-95",
                                                        isMe ? "mr-1" : "ml-1"
                                                    )}
                                                >
                                                    <div className="flex -space-x-1.5">
                                                        <div className="w-4 h-4 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center">
                                                            <MessageSquare className="w-2 h-2" />
                                                        </div>
                                                    </div>
                                                    {msg.replyCount} {msg.replyCount === 1 ? 'réponse' : 'réponses'}
                                                </button>
                                            )}
                                            <span className="text-[8px] opacity-40 mt-1 font-bold">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <footer className="p-4 bg-white/50 backdrop-blur-sm border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tapez votre message..."
                                    className="flex-grow rounded-2xl border-slate-200 h-12 px-6 bg-slate-50/50 shadow-none focus-visible:ring-primary/20"
                                    maxLength={500}
                                />
                                <Button type="submit" size="icon" className="rounded-2xl w-12 h-12 shadow-lg shadow-primary/10 transition-all hover:translate-y-[-2px] active:scale-90" disabled={!newMessage.trim()}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </footer>
                    </div>
                </div>

                {/* Thread Sheet */}
                <Sheet open={!!activeThread} onOpenChange={(open) => !open && setActiveThread(null)}>
                    <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-slate-200 bg-white">
                        <SheetHeader className="p-4 border-b bg-slate-50/50">
                            <SheetTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                Discussion Filée
                                <MessageSquare className="w-4 h-4 text-primary" />
                            </SheetTitle>
                            <SheetDescription className="hidden">Fil de discussion pour un message spécifique</SheetDescription>
                        </SheetHeader>

                        {activeThread && (
                            <>
                                <div className="p-4 bg-slate-50 border-b">
                                    <div className="flex flex-col items-start">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                            {activeThread.senderName}
                                        </span>
                                        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-sm shadow-sm">
                                            {activeThread.text}
                                        </div>
                                        <span className="text-[8px] opacity-40 mt-1 font-bold">
                                            Initialement envoyé à {new Date(activeThread.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="flex-grow overflow-y-auto p-4 space-y-4"
                                    ref={threadScrollRef}
                                >
                                    {loadingThread ? (
                                        <div className="h-full flex items-center justify-center text-primary">
                                            <Loader2 className="animate-spin w-6 h-6" />
                                        </div>
                                    ) : threadMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 select-none px-8 text-center">
                                            <i className="fas fa-reply text-3xl mb-3"></i>
                                            <h3 className="font-bold text-sm">Aucune réponse pour l'instant</h3>
                                            <p className="text-[10px]">Relance la discussion avec ta réponse !</p>
                                        </div>
                                    ) : (
                                        threadMessages.map((reply) => {
                                            const isMyReply = reply.senderId === user.uid;
                                            return (
                                                <div key={reply.id} className={cn("flex flex-col", isMyReply ? "items-end" : "items-start")}>
                                                    {!isMyReply && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                                            {reply.senderName}
                                                            {reply.isMentor && <i className="fas fa-crown text-[7px] text-yellow-500 ml-1"></i>}
                                                        </span>
                                                    )}
                                                    <div className={cn(
                                                        "px-3 py-2 rounded-xl text-[13px] shadow-sm",
                                                        isMyReply ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                                                    )}>
                                                        {reply.text}
                                                    </div>
                                                    <span className="text-[7px] opacity-40 mt-0.5 font-bold">
                                                        {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <footer className="p-4 border-t bg-slate-50/50">
                                    <form onSubmit={handleSendThreadReply} className="flex gap-2">
                                        <Input
                                            value={newThreadMessage}
                                            onChange={(e) => setNewThreadMessage(e.target.value)}
                                            placeholder="Répondre au fil..."
                                            className="flex-grow rounded-full border-muted-foreground/20 h-9 px-4 text-xs shadow-inner focus-visible:ring-primary/30"
                                            maxLength={500}
                                        />
                                        <Button type="submit" size="icon" className="rounded-full w-9 h-9 shadow-lg shadow-primary/20" disabled={!newThreadMessage.trim()}>
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </footer>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </main>
    );
}

