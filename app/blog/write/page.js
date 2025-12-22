'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PenTool, Image as ImageIcon, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { uploadResourceFile } from '@/lib/supabase';
import { db, ref, push, set } from '@/lib/firebase';

export default function WriteArticlePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: 'Article'
    });
    const [coverImage, setCoverImage] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        setCoverImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoading(true);

        try {
            let coverImageUrl = null;

            if (coverImage) {
                if (coverImage.size > 10 * 1024 * 1024) {
                    throw new Error("L'image dépasse la taille maximale de 10 Mo.");
                }
                const uploaded = await uploadResourceFile(coverImage);
                if (!uploaded && !uploaded.publicUrl) {
                    throw new Error("Erreur lors de l'upload de l'image.");
                }
                coverImageUrl = uploaded.publicUrl;
            }

            const postData = {
                ...formData,
                cover_image: coverImageUrl,
                created_at: new Date().toISOString(),
                author_id: user?.uid || null,
                author_name: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Anonyme',
                likes: 0,
                dislikes: 0,
                comments: []
            };

            const postsRef = ref(db, 'blog_posts');
            const newPostRef = push(postsRef);
            const postId = newPostRef.key;
            await set(newPostRef, postData);

            if (user) {
                const userActivityRef = ref(db, `users/${user.uid}/blogs/${postId}`);
                await set(userActivityRef, {
                    title: formData.title,
                    timestamp: Date.now()
                });
            }

            setMessage('Article publié avec succès !');
            setTimeout(() => router.push('/blog'), 2000);
        } catch (error) {
            console.error('Error publishing article:', error);
            setIsError(true);
            setMessage(error.message || 'Erreur lors de la publication. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container py-12 max-w-4xl px-4">
            <Button variant="ghost" asChild className="mb-8 rounded-full hover:bg-slate-100 -ml-2">
                <Link href="/blog" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour au blog
                </Link>
            </Button>

            <header className="mb-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary shadow-xl shadow-primary/10">
                    <PenTool className="w-10 h-10" />
                </div>
                <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-slate-900 mb-4">
                    Écrire un article
                </h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                    Partage tes expériences, conseils et découvertes avec tes camarades de l'EST.
                </p>
            </header>

            <Card className="rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-slate-100 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {message && (
                            <Alert variant={isError ? "destructive" : "default"} className={!isError ? "border-green-500 bg-green-50 text-green-700 rounded-2xl" : "rounded-2xl"}>
                                {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                <AlertTitle className="font-black text-xs uppercase tracking-widest">{isError ? "Erreur" : "Succès"}</AlertTitle>
                                <AlertDescription className="font-medium">{message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-bold text-slate-700 ml-1">Titre de l'article *</Label>
                            <Input
                                id="title"
                                placeholder="Donnez un titre percutant..."
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 text-lg font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-sm font-bold text-slate-700 ml-1">Extrait (résumé court)</Label>
                            <Textarea
                                id="excerpt"
                                placeholder="Un court résumé pour donner envie de lire..."
                                value={formData.excerpt}
                                onChange={(e) => handleChange('excerpt', e.target.value)}
                                rows={2}
                                className="rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 resize-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-sm font-bold text-slate-700 ml-1">Contenu de l'article *</Label>
                            <Textarea
                                id="content"
                                placeholder="Racontez votre histoire..."
                                value={formData.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                rows={15}
                                required
                                className="rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImage" className="text-sm font-bold text-slate-700 ml-1">Image de couverture</Label>
                            <div className="relative group">
                                <Input
                                    id="coverImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <Label
                                    htmlFor="coverImage"
                                    className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 cursor-pointer group-hover:bg-slate-100 group-hover:border-primary/30 transition-all"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-primary transition-colors">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500">
                                            {coverImage ? coverImage.name : "Cliquez pour uploader (Max 10MB)"}
                                        </p>
                                    </div>
                                </Label>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full h-14 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Publication...
                                    </>
                                ) : (
                                    'Publier l\'article'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}

