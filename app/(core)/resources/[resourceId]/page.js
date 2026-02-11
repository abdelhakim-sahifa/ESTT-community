'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Video, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, User, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function ResourcePage() {
    const params = useParams();
    const { resourceId } = params;

    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (resourceId) {
            fetchResource();
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
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <Button variant="ghost" asChild>
                        <Link href="/browse" className="gap-2">
                            ← Retour aux ressources
                        </Link>
                    </Button>
                </div>

                <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="bg-white border-b pb-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="p-4 bg-slate-100 rounded-2xl">
                                {getResourceIcon(resource.type)}
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="uppercase tracking-wider text-xs">
                                        {resource.type}
                                    </Badge>
                                    {resource.docType && (
                                        <Badge variant="outline" className="uppercase tracking-wider text-xs border-primary/20 text-primary bg-primary/5">
                                            {resource.docType}
                                        </Badge>
                                    )}
                                    {resource.createdAt && (
                                        <span className="text-xs text-muted-foreground">
                                            Ajouté le {new Date(resource.createdAt).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-3xl font-bold text-slate-900">
                                    {resource.title}
                                </CardTitle>
                                {resource.professor && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <User className="w-4 h-4" />
                                        <span className="font-medium">Prof. {resource.professor}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="py-8 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Description</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {resource.description || "Aucune description fournie pour cette ressource."}
                            </p>
                        </div>

                        {((resource.fields && resource.fields.length > 0) || resource.field) && (
                            <div className="space-y-3 pt-6 border-t">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Filières associées
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {resource.field && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                                            {getFieldName(resource.field)}
                                        </Badge>
                                    )}
                                    {resource.fields?.map((f, idx) => (
                                        <Badge key={idx} variant="outline" className="border-slate-200 text-slate-600">
                                            {getFieldName(f.fieldId)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="bg-slate-50 py-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button asChild size="lg" className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all">
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                    {resource.type === 'link' ? <ExternalLink className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                                    {resource.type === 'link' ? 'Accéder au lien' : 'Télécharger'}
                                </a>
                            </Button>
                        </div>
                        {/* Share button functionality could be added later */}
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}
