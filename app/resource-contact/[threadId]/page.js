'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get, onValue, push, set, update } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, MessageSquareReply } from 'lucide-react';

export default function ResourceContactPage() {
    const params = useParams();
    const threadId = params?.threadId;

    const [thread, setThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!threadId || !db) return;

        const threadRef = ref(db, `resourceContactThreads/${threadId}`);
        const unsubscribe = onValue(threadRef, (snapshot) => {
            if (!snapshot.exists()) {
                setThread(null);
                setMessages([]);
                setLoading(false);
                return;
            }

            const data = snapshot.val();
            setThread(data);

            const list = data.messages
                ? Object.entries(data.messages).map(([id, value]) => ({ id, ...value }))
                : [];

            list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            setMessages(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [threadId]);

    const statusBadge = useMemo(() => {
        if (!thread) return null;
        if (thread.status === 'user_replied') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Reponse envoyee</Badge>;
        return <Badge variant="secondary">En attente de reponse</Badge>;
    }, [thread]);

    const handleSubmitReply = async () => {
        const trimmedReply = reply.trim();
        if (!trimmedReply || !threadId || !thread) return;

        setSending(true);
        setError('');
        setStatusMessage('');

        try {
            const now = Date.now();
            const messageRef = push(ref(db, `resourceContactThreads/${threadId}/messages`));
            await set(messageRef, {
                id: messageRef.key,
                senderType: 'user',
                senderName: thread.authorName || 'Contributeur',
                senderEmail: thread.authorEmail || '',
                body: trimmedReply,
                createdAt: now,
            });

            await update(ref(db, `resourceContactThreads/${threadId}`), {
                status: 'user_replied',
                lastSender: 'user',
                updatedAt: now,
                lastUserReplyAt: now,
                lastMessagePreview: trimmedReply.slice(0, 180),
            });

            const settingsSnap = await get(ref(db, 'adminSettings/notifications'));
            const adminEmail = settingsSnap.exists() ? settingsSnap.val()?.email : null;
            if (adminEmail) {
                const { resourceContactReplyEmail } = await import('@/lib/email-templates');
                const roomUrl = `${window.location.origin}/resource-contact/${threadId}`;
                const html = resourceContactReplyEmail(
                    thread.resourceTitle || 'Ressource',
                    thread.authorName || 'Contributeur',
                    trimmedReply,
                    roomUrl
                );

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: adminEmail,
                        subject: `Nouvelle reponse sur la ressource : ${thread.resourceTitle || 'Ressource'}`,
                        html
                    })
                });
            }

            setReply('');
            setStatusMessage('Ta reponse a ete envoyee.');
        } catch (err) {
            console.error(err);
            setError("Impossible d'envoyer la reponse.");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (!thread) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-20">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardContent className="p-8 text-center text-slate-600">
                            Cette room n'existe pas ou n'est plus disponible.
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-3xl space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-2xl">Question sur ta ressource</CardTitle>
                                <p className="mt-2 text-sm text-slate-500">
                                    {thread.resourceTitle} {thread.resourceModule ? `· ${thread.resourceModule}` : ''}
                                </p>
                            </div>
                            {statusBadge}
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="h-4 w-4" />
                            Room de discussion
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {messages.length === 0 ? (
                            <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`rounded-2xl border p-4 ${
                                        message.senderType === 'admin'
                                            ? 'border-blue-100 bg-blue-50'
                                            : 'border-emerald-100 bg-emerald-50'
                                    }`}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {message.senderType === 'admin' ? 'Administration' : (message.senderName || 'Contributeur')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {message.createdAt ? new Date(message.createdAt).toLocaleString('fr-FR') : ''}
                                        </p>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquareReply className="h-4 w-4" />
                            Ta reponse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            rows={6}
                            placeholder="Ecris ta reponse ici..."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {statusMessage && <p className="text-sm text-emerald-700">{statusMessage}</p>}

                        <Button onClick={handleSubmitReply} disabled={sending || !reply.trim()}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Envoyer ma reponse
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
