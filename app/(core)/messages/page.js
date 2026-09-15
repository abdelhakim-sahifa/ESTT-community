'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, ref, onValue, get, remove, set } from '@/lib/firebase';
import ChatTermsDialog from '@/components/features/chat/ChatTermsDialog';
import { ArrowRight, Loader2, Search, MessageSquare, User, MoreVertical, Trash2 } from 'lucide-react';
import { PeopleIcon } from '@primer/octicons-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, getUserLevel } from '@/lib/utils';
import { db as staticData } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSharedKey, decryptText } from '@/lib/crypto';
import { ShieldCheck, Lock, Gem } from 'lucide-react';
import { notifyDM as rawNotifyDM } from '@/lib/browserNotifications';
import {
    ESTT_AI_AGENT_ID,
    ESTT_AI_PROFILE,
    ESTT_AI_WELCOME_PREVIEW,
    buildEsttAiConversation,
    isEsttAiAgent,
} from '@/lib/estt-ai';

export default function MessagesHub() {
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [profiles, setProfiles] = useState(() => ({
        [ESTT_AI_AGENT_ID]: ESTT_AI_PROFILE,
    }));
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    const chatFiliere = currentUserProfile?.filiere?.toLowerCase() || 'general';
    const chatFiliereAbbrev = { ia: 'AI', casi: 'CASI', insem: 'INSEM', idd: 'IDD' }[chatFiliere] || chatFiliere.toUpperCase();
    const chatLevel = getUserLevel(currentUserProfile?.startYear);
    const chatSemesterLabel = chatLevel === 1 ? 'S1/S2' : 'S3/S4';

    const lastNotifiedMsgIdsRef = useRef({});
    const profilesRef = useRef(profiles);
    const menuRef = useRef(null);

    useEffect(() => { profilesRef.current = profiles; }, [profiles]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!openMenuId) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    useEffect(() => {
        if (!user || authLoading) return;

        const convRef = ref(db, `userConversations/${user.uid}`);
        const unsubscribe = onValue(convRef, async (snapshot) => {
            const data = snapshot.val() || {};
            const rawList = Object.entries(data).map(([id, conv]) => ({
                id,
                ...conv
            }));

            // Decrypt last messages for preview
            const listWithDecrypted = await Promise.all(rawList.map(async (conv) => {
                let lastMessage = conv.lastMessage;
                if (conv.ciphertext && conv.iv) {
                    try {
                        const key = await getSharedKey();
                        const decrypted = await decryptText(conv.ciphertext, conv.iv, key);
                        lastMessage = decrypted || lastMessage;
                    } catch (err) {
                        console.error("Failed to decrypt hub preview:", err);
                    }
                }
                return { ...conv, lastMessage };
            }));

            const storedAiConversation = listWithDecrypted.find((conv) => isEsttAiAgent(conv.id));
            const sortedList = [
                buildEsttAiConversation(storedAiConversation),
                ...listWithDecrypted
                    .filter((conv) => !isEsttAiAgent(conv.id))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
            ];

            setConversations(sortedList);

            // --- Global DM Notification in Hub ---
            if (!document.hasFocus()) {
                sortedList.forEach(conv => {
                    // Check if it's unread, has a message, and wasn't sent by the current user
                    if (conv.unread && conv.lastMessageId && conv.lastMessageSenderId !== user.uid) {
                        if (lastNotifiedMsgIdsRef.current[conv.id] !== conv.lastMessageId) {
                            lastNotifiedMsgIdsRef.current[conv.id] = conv.lastMessageId;

                            const otherId = conv.otherUserId || conv.id;

                            (async () => {
                                let p = profilesRef.current[otherId];
                                if (!p && !isEsttAiAgent(otherId)) {
                                    const snap = await get(ref(db, `users/${otherId}`));
                                    if (snap.exists()) p = snap.val();
                                }

                                const senderName = p ? `${p.firstName} ${p.lastName || ''}`.trim() : 'Message';
                                const photoUrl = p?.photoUrl || null;

                                rawNotifyDM(senderName, conv.lastMessage || 'Nouveau message', `/messages/${otherId}`, photoUrl);
                            })();
                        }
                    }
                });
            }
            // ------------------------------------

            // Fetch profiles for users we don't have yet
            sortedList.forEach(conv => {
                const otherId = conv.otherUserId || conv.id;
                if (!otherId || isEsttAiAgent(otherId) || profilesRef.current[otherId]) return;

                const pRef = ref(db, `users/${otherId}`);
                get(pRef).then(snap => {
                    if (snap.exists()) {
                        setProfiles(prev => ({ ...prev, [otherId]: snap.val() }));
                    }
                });
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    const filteredConversations = conversations.filter(conv => {
        const otherId = conv.otherUserId || conv.id;
        const p = profiles[otherId];
        if (!p) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return (
            fullName.includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.headline?.toLowerCase().includes(query)
        );
    });

    // Delete a regular conversation from the user's list only
    const handleDeleteConversation = useCallback(async (conv, e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        if (!user) return;
        try {
            await remove(ref(db, `userConversations/${user.uid}/${conv.id}`));
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    }, [user]);

    // Clear the ESTT-AI conversation: wipe messages + reset hub preview
    const handleClearAiConversation = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        if (!user) return;
        try {
            const uid1 = user.uid;
            const uid2 = ESTT_AI_AGENT_ID;
            const roomId = uid1 < uid2
                ? `dm_${uid1}_${uid2}`
                : `dm_${uid2}_${uid1}`;
            await remove(ref(db, `direct_messages/${roomId}/messages`));
            await set(ref(db, `userConversations/${user.uid}/${ESTT_AI_AGENT_ID}`), {
                lastMessage: ESTT_AI_WELCOME_PREVIEW,
                lastMessageSenderId: ESTT_AI_AGENT_ID,
                timestamp: 0,
                unread: false,
            });
        } catch (err) {
            console.error('Failed to clear AI conversation:', err);
        }
    }, [user]);

    if (authLoading || (loading && conversations.length === 0)) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Chargement de vos messages...</p>
        </div>
    );

    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 bg-card">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Vos Messages</h1>
            <p className="text-muted-foreground max-w-sm mb-8">
                Connectez-vous pour voir vos conversations privées et échanger avec la communauté.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                <Link href="/login">Se connecter</Link>
            </Button>
        </div>
    );

    return (
        <main className="min-h-screen bg-card md:bg-muted/50">
            <ChatTermsDialog />
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            Messages
                            {conversations.length > 0 && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                                    {conversations.length}
                                </span>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Gérez vos conversations privées avec les autres membres.</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une conversation..."
                        className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm focus:ring-primary/20 transition-all text-base"
                    />
                </div>

                {/* Conversations List */}
                <div className="space-y-3">
                    {filteredConversations.length === 0 ? (
                        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Search className="w-8 h-8 text-slate-200" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                {searchQuery ? "Aucun résultat trouvé" : "Pas encore de messages"}
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
                                {searchQuery
                                    ? `Nous n'avons trouvé aucune conversation correspondant à "${searchQuery}".`
                                    : "Vous n'avez pas encore de conversations privées. Visitez le profil d'un membre pour lui envoyer un message !"}
                            </p>
                            {!searchQuery && (
                                <Button asChild variant="outline" className="rounded-full border-border px-6 gap-2">
                                    <Link href="/chat">
                                        <PeopleIcon size={16} className="text-primary" />
                                        Aller au chat général
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Discussion shortcut */}
                            <Link
                                href="/chat"
                                className="group block bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 hover:bg-primary/[0.01] transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center">
                                            <PeopleIcon size={24} className="text-primary" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="text-base font-bold text-foreground truncate flex items-center gap-1.5">
                                                EST {chatFiliereAbbrev}
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 whitespace-nowrap dark:bg-blue-500/15 dark:text-blue-300">
                                                    {chatSemesterLabel}
                                                </span>
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate font-medium">
                                            Discussion de groupe
                                        </p>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 hidden md:block">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {filteredConversations.map((conv) => {
                                const otherId = conv.otherUserId || conv.id;
                                const p = profiles[otherId];
                                const initials = p ? `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}` : '?';
                                const displayName = p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : "Utilisateur...";
                                const timestamp = conv.timestamp ? new Date(conv.timestamp).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : '';
                                const isAiConv = isEsttAiAgent(conv.id);
                                const isMenuOpen = openMenuId === conv.id;

                                return (
                                    <div key={conv.id} className="relative group">
                                        <Link
                                            href={`/messages/${otherId}`}
                                            className="block bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 hover:bg-primary/[0.01] transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="relative shrink-0">
                                                    <div className="w-14 h-14 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                                                        {p?.photoUrl ? (
                                                            <img src={p.photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                                                                {initials || <User className="w-6 h-6" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {conv.unread && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-8 md:pr-10">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <h3 className={cn(
                                                            "text-base font-bold truncate transition-colors flex items-center gap-1.5",
                                                            conv.unread ? "text-foreground" : "text-foreground"
                                                        )}>
                                                            {displayName}
                                                            {p?.verifiedEmail && (
                                                                <span
                                                                    className={cn(
                                                                        "material-symbols-outlined select-none !text-[13px]",
                                                                        p?.role === 'admin' ? "text-yellow-500" : "text-emerald-500"
                                                                    )}
                                                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                                                >
                                                                    verified
                                                                </span>
                                                            )}
                                                            {p?.isSubscribed && (
                                                                <div className="bg-gradient-to-r from-violet-600 to-indigo-500 p-0.5 rounded shadow-sm flex items-center justify-center">
                                                                    <Gem className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            )}
                                                            {p?.isAiAssistant && (
<span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                    Agent officiel
                                </span>
                                                            )}
                                                        </h3>
                                                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap ml-2">
                                                            {timestamp}
                                                        </span>
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm truncate font-medium",
                                                        conv.unread ? "text-foreground font-bold" : "text-muted-foreground"
                                                    )}>
                                                        {conv.lastMessageSenderId === user.uid && <span className="font-bold text-foreground">Vous: </span>}
                                                        {conv.lastMessage || "Nouveau message"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* ⋮ Menu button — appears on hover, stays visible when open */}
                                        <div
                                            ref={isMenuOpen ? menuRef : null}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setOpenMenuId(isMenuOpen ? null : conv.id);
                                                }}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200",
                                                    isMenuOpen
                                                        ? "opacity-100 bg-muted text-foreground"
                                                        : "opacity-0 group-hover:opacity-100"
                                                )}
                                                aria-label="Options de la conversation"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown */}
                                            {isMenuOpen && (
                                                <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[210px]">
                                                    {isAiConv ? (
                                                        <button
                                                            onClick={handleClearAiConversation}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 shrink-0" />
                                                            Effacer la conversation
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleDeleteConversation(conv, e)}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="w-4 h-4 shrink-0" />
                                                            Supprimer la conversation
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
