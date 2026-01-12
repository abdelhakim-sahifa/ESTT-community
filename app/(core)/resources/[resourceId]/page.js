'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Video, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, User, Share2, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

export default function ResourcePage() {
    const params = useParams();
    const { resourceId } = params;

    const { language } = useLanguage();
    const t = translations[language];
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
                setResource({ id: resourceId, ...data });
            } else {
                setError(t.browse.notFound);
            }
        } catch (err) {
            console.error(err);
            setError(t.browse.errorLoading);
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
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
                <p className={cn("text-xl text-muted-foreground", language === 'ar' && "font-arabic")}>{error || t.common.notAvailable}</p>
                <Button asChild>
                    <Link href="/browse">{t.common.browse}</Link>
                </Button>
            </div>
        );
    }

    const downloadUrl = ensureProtocol(resource.url || resource.link || resource.file);

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className={cn("flex justify-between items-center", language === 'ar' && "flex-row-reverse")}>
                    <Button variant="ghost" asChild>
                        <Link href="/browse" className={cn("gap-2", language === 'ar' && "flex-row-reverse")}>
                            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                            {t.browse.backToResources}
                        </Link>
                    </Button>
                </div>

                <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="bg-white border-b pb-8">
                        <div className={cn("flex flex-col md:flex-row gap-6 items-start md:items-center", language === 'ar' && "md:flex-row-reverse text-right")}>
                            <div className="p-4 bg-slate-100 rounded-2xl">
                                {getResourceIcon(resource.type)}
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className={cn("flex items-center gap-3", language === 'ar' && "flex-row-reverse")}>
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
                                            {t.browse.addedOn} {new Date(resource.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className={cn("text-3xl font-bold text-slate-900", language === 'ar' && "font-arabic")}>
                                    {resource.title}
                                </CardTitle>
                                {resource.professor && (
                                    <div className={cn("flex items-center gap-2 text-slate-600", language === 'ar' && "flex-row-reverse")}>
                                        <User className="w-4 h-4" />
                                        <span className={cn("font-medium", language === 'ar' && "font-arabic")}>{t.browse.prof} {resource.professor}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className={cn("py-8 space-y-6", language === 'ar' && "text-right")}>
                        <div className="space-y-4">
                            <h3 className={cn("text-lg font-semibold text-slate-900", language === 'ar' && "font-arabic")}>{t.browse.description}</h3>
                            <p className={cn("text-slate-600 leading-relaxed", language === 'ar' && "font-arabic")}>
                                {resource.description || t.browse.noDescription}
                            </p>
                        </div>

                        {/* Additional metadata could go here */}
                    </CardContent>

                    <CardFooter className={cn("bg-slate-50 py-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center", language === 'ar' && "sm:flex-row-reverse")}>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button asChild size="lg" className={cn("w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all", language === 'ar' && "flex-row-reverse")}>
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                    {resource.type === 'link' ? <ExternalLink className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                                    {resource.type === 'link' ? t.browse.accessLink : t.browse.download}
                                </a>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}
