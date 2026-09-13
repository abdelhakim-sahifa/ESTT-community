'use client';

import { useState } from 'react';
import { db, ref, update, push, get } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { sendPrivateNotification, NOTIF_TYPES } from '@/lib/notifications';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    CheckCircle2,
    Clock,
    Mail,
    User,
    ChevronRight,
    Loader2,
    Trash2,
    Send,
    Inbox,
    ArrowLeft,
    CircleDot
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

const SUBJECT_LABELS = {
    question: 'Question générale',
    bug: 'Signaler un problème',
    suggestion: 'Suggestion',
    contribution: 'Contribuer',
    autre: 'Autre',
};

export default function AdminMessages({ messages = [] }) {
    const { user } = useAuth();
    const { showError, showSuccess, showConfirm } = useDialog();
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('all');

    const sorted = [...messages].sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));

    const filtered = filter === 'all'
        ? sorted
        : sorted.filter(m => m.status === filter);

    const unreadCount = messages.filter(m => m.status === 'unread').length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'unread': return <Badge className="bg-blue-500">Non lu</Badge>;
            case 'read': return <Badge className="bg-slate-400">Lu</Badge>;
            case 'replied': return <Badge className="bg-green-500">Répondu</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const handleOpenMessage = async (msg) => {
        setSelectedMessage(msg);
        setIsDetailOpen(true);
        setReplyText('');

        if (msg.status === 'unread') {
            try {
                await update(ref(db, `contactMessages/${msg.id}`), { status: 'read' });
            } catch (err) {
                console.error('Error marking as read:', err);
            }
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedMessage) return;

        setSending(true);
        try {
            const replyRef = ref(db, `contactMessages/${selectedMessage.id}/replies`);
            await push(replyRef, {
                text: replyText.trim(),
                repliedBy: user.displayName || user.email || 'Admin',
                repliedById: user.uid,
                repliedAt: Date.now(),
            });

            await update(ref(db, `contactMessages/${selectedMessage.id}`), { status: 'replied' });

            if (selectedMessage.userId) {
                await sendPrivateNotification(selectedMessage.userId, {
                    type: NOTIF_TYPES.SYSTEM,
                    title: `Réponse : ${SUBJECT_LABELS[selectedMessage.subject] || selectedMessage.subject}`,
                    message: replyText.trim(),
                    icon: 'message-square',
                    action: { type: 'navigate', target: '/notifications' }
                });
            }

            setReplyText('');
            showSuccess('Réponse envoyée !');

            setSelectedMessage(prev => ({
                ...prev,
                status: 'replied',
                replies: {
                    ...(prev.replies || {}),
                    temp: {
                        text: replyText.trim(),
                        repliedBy: user.displayName || user.email || 'Admin',
                        repliedById: user.uid,
                        repliedAt: Date.now(),
                    }
                }
            }));

        } catch (err) {
            console.error('Error sending reply:', err);
            showError('Erreur lors de l\'envoi de la réponse.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (msgId) => {
        const confirmed = await showConfirm('Supprimer ce message ?', {
            type: 'danger',
            title: 'Supprimer le message',
            confirmLabel: 'Supprimer'
        });
        if (!confirmed) return;

        try {
            setActionLoading(msgId);
            await update(ref(db, `contactMessages/${msgId}`), { deleted: true });
            setIsDetailOpen(false);
            showSuccess('Message supprimé.');
        } catch (err) {
            showError('Erreur lors de la suppression.');
        } finally {
            setActionLoading(null);
        }
    };

    const getReplies = (msg) => {
        if (!msg.replies) return [];
        return Object.entries(msg.replies)
            .filter(([key]) => key !== 'temp')
            .map(([key, val]) => ({ id: key, ...val }))
            .sort((a, b) => (a.repliedAt || 0) - (b.repliedAt || 0));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Messages de Contact</h1>
                    <p className="text-muted-foreground">Messages envoyés via le formulaire de contact.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl font-bold"
                        onClick={() => setFilter('all')}
                    >
                        Tous ({messages.length})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl font-bold"
                        onClick={() => setFilter('unread')}
                    >
                        <CircleDot className="w-3 h-3 mr-1" />
                        Non lus ({unreadCount})
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="py-20 text-center bg-card rounded-3xl border border-dashed border-border shadow-sm">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <Inbox className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Aucun message</h3>
                    <p className="text-muted-foreground text-sm">
                        {filter === 'unread' ? 'Tous les messages sont lus.' : 'Aucun message de contact pour le moment.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map((msg) => {
                        const isUnread = msg.status === 'unread';
                        return (
                            <Card
                                key={msg.id}
                                className={`border-none shadow-sm hover:shadow-md transition-all group cursor-pointer ${isUnread ? 'bg-blue-50/50 border-l-4 border-l-blue-500 dark:bg-blue-500/10' : ''}`}
                                onClick={() => handleOpenMessage(msg)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className={`p-2.5 rounded-2xl shrink-0 ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className={`font-bold leading-none ${isUnread ? 'text-foreground' : 'text-foreground'}`}>
                                                        {msg.name}
                                                    </h4>
                                                    {getStatusBadge(msg.status)}
                                                    <Badge variant="outline" className="text-[10px] font-bold">
                                                        {SUBJECT_LABELS[msg.subject] || msg.subject}
                                                    </Badge>
                                                </div>
                                                <p className={`text-sm line-clamp-1 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                    {msg.message}
                                                </p>
                                                <div className="flex items-center gap-4 pt-0.5">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {msg.email}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(msg.timestamp || msg.createdAt).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getReplies(msg).length > 0 && (
                                                <Badge variant="outline" className="text-[10px] font-bold text-green-600 border-green-200">
                                                    {getReplies(msg).length} réponse(s)
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 shrink-0 dark:hover:bg-red-500/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(msg.id);
                                                }}
                                                disabled={actionLoading === msg.id}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary shrink-0">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Message Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    {selectedMessage && (
                        <div className="space-y-0">
                            <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-3xl">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-xl font-black tracking-tight">{selectedMessage.name}</h2>
                                            {getStatusBadge(selectedMessage.status)}
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                {selectedMessage.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(selectedMessage.timestamp || selectedMessage.createdAt).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-bold shrink-0">
                                        {SUBJECT_LABELS[selectedMessage.subject] || selectedMessage.subject}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Message
                                    </h3>
                                    <p className="text-foreground bg-muted p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>

                                {getReplies(selectedMessage).length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Send className="w-3.5 h-3.5" />
                                            Réponses
                                        </h3>
                                        {getReplies(selectedMessage).map((reply) => (
                                            <div key={reply.id} className="bg-green-50 p-4 rounded-2xl border border-green-100 dark:bg-green-500/10 dark:border-green-500/30">
                                                <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{reply.text}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {reply.repliedBy} — {new Date(reply.repliedAt).toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Send className="w-3.5 h-3.5" />
                                        Répondre
                                    </h3>
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Écrivez votre réponse..."
                                            className="rounded-xl flex-1 min-h-[80px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                    handleReply();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] text-muted-foreground">Ctrl+Entrée pour envoyer</p>
                                        <Button
                                            onClick={handleReply}
                                            disabled={!replyText.trim() || sending}
                                            className="rounded-xl font-bold"
                                            size="sm"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Send className="w-4 h-4 mr-2" />
                                            )}
                                            Répondre
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="rounded-xl h-10 px-4 font-bold"
                                        onClick={() => handleDelete(selectedMessage.id)}
                                        disabled={actionLoading === selectedMessage.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
