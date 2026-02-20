'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get, set, push } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Video, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, User, Share2, GraduationCap, Play, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';

export default function ResourcePage() {
    const params = useParams();
    const { resourceId } = params;
    const { user, profile } = useAuth();

    const [resource, setResource] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (resourceId) {
            fetchResource();
            fetchComments();
        }
    }, [resourceId]);

    const fetchResource = async () => {
        try {
            const resourceRef = ref(db, `resources/${resourceId}`);
            const snapshot = await get(resourceRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                // Check if verified - admins might view unverified via this link too, but general public shouldn't?
                // For now, we'll display it, assuming the link is shared only when approved or by admin.
                setResource({ id: resourceId, ...data });
            } else {
                setError('Ressource introuvable');
            }
        } catch (err) {
            console.error(err);
            setError('Erreur lors du chargement de la ressource');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const snapshot = await get(commentsRef);

            if (snapshot.exists()) {
                const commentsData = snapshot.val();
                const commentsList = [];

                // Convert comments object to array and organize with replies
                Object.entries(commentsData).forEach(([id, comment]) => {
                    commentsList.push({ id, ...comment });
                });

                // Sort by timestamp (newest first)
                commentsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                setComments(commentsList);
            } else {
                setComments([]);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setComments([]);
        }
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-12 h-12 text-primary" />;
            case 'video': return <Video className="w-12 h-12 text-primary" />;
            case 'image': return <ImageIcon className="w-12 h-12 text-primary" />;
            case 'link': return <LinkIcon className="w-12 h-12 text-primary" />;
            default: return <FileText className="w-12 h-12 text-primary" />;
        }
    };

    const ensureProtocol = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    const getFieldName = (fieldCode) => {
        return fieldCode?.toUpperCase() || 'N/A';
    };

    const formatCommentDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}m`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    const getParentComments = () => {
        return comments.filter(comment => !comment.isReply);
    };

    const getReplies = (parentId) => {
        return comments.filter(comment => comment.parentId === parentId);
    };

    const handleAddComment = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour commenter');
            return;
        }

        if (!commentText.trim()) {
            alert('Le commentaire ne peut pas être vide');
            return;
        }

        try {
            setSubmitting(true);
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const newCommentRef = push(commentsRef);
            
            await set(newCommentRef, {
                text: commentText,
                authorId: user.uid,
                authorName: profile?.displayName || user.email || 'Anonyme',
                timestamp: Date.now(),
                isReply: false
            });

            setCommentText('');
            // Optionally refresh comments
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
            alert('Erreur lors de la publication du commentaire');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (parentId) => {
        if (!user) {
            alert('Veuillez vous connecter pour répondre');
            return;
        }

        const replyText = replyTexts[parentId];
        if (!replyText?.trim()) {
            alert('La réponse ne peut pas être vide');
            return;
        }

        try {
            setSubmitting(true);
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const newReplyRef = push(commentsRef);
            
            await set(newReplyRef, {
                text: replyText,
                authorId: user.uid,
                authorName: profile?.displayName || user.email || 'Anonyme',
                timestamp: Date.now(),
                isReply: true,
                parentId: parentId
            });

            setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
            setExpandedReplies(prev => ({ ...prev, [parentId]: false }));
            // Optionally refresh comments
            fetchComments();
        } catch (err) {
            console.error('Error posting reply:', err);
            alert('Erreur lors de la publication de la réponse');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-muted-foreground">{error || 'Introuvable'}</p>
                <Button asChild>
                    <Link href="/browse">Parcourir les ressources</Link>
                </Button>
            </div>
        );
    }

    const downloadUrl = ensureProtocol(resource.url || resource.link || resource.file);

    return (
        <main className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" asChild size="sm">
                    <Link href="/browse">← Retour aux ressources</Link>
                </Button>

                <Card className="shadow-md">
                    <CardHeader className="pb-4">
                        <div className="space-y-4">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="text-xs">
                                        {resource.type.toUpperCase()}
                                    </Badge>
                                    {resource.docType && (
                                        <Badge variant="secondary" className="text-xs">
                                            {resource.docType}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-bold mb-2">
                                    {resource.title}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                    {resource.professor && (
                                        <span>Prof. {resource.professor}</span>
                                    )}
                                    {resource.createdAt && (
                                        <span>{new Date(resource.createdAt).toLocaleDateString('fr-FR')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="py-6 space-y-6">
                        {resource.description && (
                            <div className="text-sm text-slate-700 leading-relaxed">
                                {resource.description}
                            </div>
                        )}

                        {((resource.fields && resource.fields.length > 0) || resource.field) && (
                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-slate-600 mb-3">Filières</p>
                                <div className="flex flex-wrap gap-2">
                                    {resource.field && (
                                        <Badge variant="secondary">
                                            {getFieldName(resource.field)}
                                        </Badge>
                                    )}
                                    {resource.fields?.map((f, idx) => (
                                        <Badge key={idx} variant="outline">
                                            {getFieldName(f.fieldId)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="py-4 border-t">
                        <Button asChild className="gap-2">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                {resource.type === 'link' ? <ExternalLink className="w-4 h-4" /> : resource.type === 'video' ? <Play className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                {resource.type === 'link' ? 'Accéder' : resource.type === 'video' ? 'Ouvrir' : 'Télécharger'}
                            </a>
                        </Button>
                        {/* Share button functionality could be added later */}
                    </CardFooter>
                </Card>

                {/* Comments Section */}
                <Card className="shadow-md">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Commentaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 space-y-6">
                        {/* Comment Form */}
                        {user ? (
                            <div className="border rounded-lg p-4 bg-slate-50">
                                <Textarea
                                    placeholder="Partagez votre avis..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="mb-3 min-h-20 text-sm"
                                />
                                <Button
                                    onClick={handleAddComment}
                                    disabled={submitting || !commentText.trim()}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Send className="w-3 h-3" />
                                    Publier
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-sm text-slate-600">
                                <Link href="/login" className="text-primary font-semibold hover:underline">
                                    Connectez-vous
                                </Link>
                                {' '}pour commenter
                            </div>
                        )}

                        <div className="border-t pt-4">
                            {comments.length === 0 && (
                                <p className="text-center text-slate-500 text-sm py-6">Aucun commentaire pour l'instant.</p>
                            )}
                            {comments.length > 0 && (
                                <div className="space-y-4">
                                    {getParentComments().map((comment) => (
                                        <div key={comment.id} className="space-y-4">
                                            {/* Parent Comment */}
<div className="border rounded-lg p-3 bg-slate-50">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-sm">{comment.authorName}</span>
                                                    <span className="text-xs text-slate-500">{formatCommentDate(comment.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 mb-2">{comment.text}</p>
                                                {user && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs h-auto p-0 text-primary hover:bg-transparent"
                                                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                                            >
                                                                Répondre
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Form */}
                                            {expandedReplies[comment.id] && user && (
                                                <div className="ml-6 border rounded-lg p-3 bg-slate-50">
                                                    <Textarea
                                                        placeholder="Votre réponse..."
                                                        value={replyTexts[comment.id] || ''}
                                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                        className="mb-2 min-h-16 text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAddReply(comment.id)}
                                                            disabled={submitting || !(replyTexts[comment.id]?.trim())}
                                                            size="sm"
                                                            className="gap-2"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            Répondre
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replies */}
                                            {getReplies(comment.id).length > 0 && (
                                                <div className="ml-6 space-y-2 border-l px-3">
                                                    {getReplies(comment.id).map((reply) => (
                                                        <div key={reply.id} className="bg-slate-50 rounded p-3 text-xs">
                                                            <div className="flex items-start gap-2">
                                                                <User className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-xs">{reply.authorName}</span>
                                                                        <span className="text-slate-500">{formatCommentDate(reply.timestamp)}</span>
                                                                    </div>
                                                                    <p className="text-slate-700">{reply.text}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
