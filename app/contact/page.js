'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { db, ref, push, set, serverTimestamp } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Phone, MessageSquare, Send, CheckCircle2, ArrowLeft, Globe, Github, MapPin } from 'lucide-react';

export default function ContactPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const { showSuccess, showError } = useDialog();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
                email: user.email || '',
            }));
        }
    }, [user, profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
            showError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setLoading(true);

        try {
            const messagesRef = ref(db, 'contactMessages');
            const newMsgRef = push(messagesRef);

            await set(newMsgRef, {
                name: formData.name.trim(),
                email: formData.email.trim(),
                subject: formData.subject,
                message: formData.message.trim(),
                userId: user?.uid || null,
                status: 'unread',
                createdAt: serverTimestamp(),
                timestamp: Date.now(),
            });

            const subjectLabels = {
                question: 'Question générale',
                bug: 'Signaler un problème',
                suggestion: 'Suggestion',
                contribution: 'Contribuer',
                autre: 'Autre',
            };

            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: 'contact@estt.ma',
                        subject: `[Contact ESTT] ${subjectLabels[formData.subject] || formData.subject}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2563eb;">Nouveau message de contact</h2>
                                <p><strong>Nom :</strong> ${formData.name.trim()}</p>
                                <p><strong>Email :</strong> ${formData.email.trim()}</p>
                                <p><strong>Sujet :</strong> ${subjectLabels[formData.subject] || formData.subject}</p>
                                <hr style="border: 1px solid #e2e8f0;" />
                                <p><strong>Message :</strong></p>
                                <p style="white-space: pre-wrap;">${formData.message.trim()}</p>
                                <hr style="border: 1px solid #e2e8f0;" />
                                <p style="color: #94a3b8; font-size: 12px;">Envoyé depuis ESTT.Community</p>
                            </div>
                        `,
                        replyTo: formData.email.trim(),
                    }),
                });
            } catch (emailErr) {
                console.error('Email send failed (message saved to DB):', emailErr);
            }

            setSuccess(true);
            showSuccess('Votre message a été envoyé avec succès !');
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Error sending contact message:', err);
            showError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-4">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Message envoyé !</h1>
                        <p className="text-lg text-slate-500">Merci de nous avoir contactés. Nous vous répondrons dès que possible.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button asChild className="rounded-2xl h-12 px-8 font-bold">
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                        <Button variant="outline" onClick={() => { setSuccess(false); setFormData(prev => ({ ...prev, subject: '', message: '' })); }} className="rounded-2xl h-12 px-8 font-bold bg-white">
                            Envoyer un autre message
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <section className="mb-12 text-center relative">
                    <Link href="/" className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Retour</span>
                    </Link>

                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                        Contactez-nous
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Une question, une suggestion ou besoin d'aide ? N'hésitez pas à nous écrire.
                    </p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-muted-foreground/10 rounded-3xl">
                            <CardHeader>
                                <CardTitle>Envoyer un message</CardTitle>
                                <CardDescription>
                                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nom complet *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Votre nom"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="votre@email.com"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="rounded-xl"
                                                readOnly={!!user}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Sujet *</Label>
                                        <Select required onValueChange={(val) => setFormData(prev => ({ ...prev, subject: val }))}>
                                            <SelectTrigger id="subject" className="rounded-xl">
                                                <SelectValue placeholder="Sélectionnez un sujet" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="question">Question générale</SelectItem>
                                                <SelectItem value="bug">Signaler un problème</SelectItem>
                                                <SelectItem value="suggestion">Suggestion</SelectItem>
                                                <SelectItem value="contribution">Contribuer</SelectItem>
                                                <SelectItem value="autre">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Décrivez votre demande en détail..."
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            className="rounded-xl resize-none"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            size="lg"
                                            className="w-full h-12 rounded-2xl text-lg font-bold shadow-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    Envoyer le message
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-lg border-muted-foreground/10 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Informations de contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <a href="mailto:contact@estt.ma" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors group">
                                    <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Mail className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-medium">contact@estt.ma</p>
                                    </div>
                                </a>

                                <a href="tel:+212715307349" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors group">
                                    <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Phone className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Téléphone</p>
                                        <p className="text-sm font-medium">+212 715 307 349</p>
                                    </div>
                                </a>

                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2.5 bg-slate-100 rounded-xl">
                                        <MapPin className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adresse</p>
                                        <p className="text-sm font-medium">École Supérieure de Technologie, Tétouan</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-muted-foreground/10 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Suivez-nous</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <a href="https://github.com/abdelhakim-sahifa/ESTT-community/" target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                        <Github className="w-5 h-5" />
                                    </a>
                                    <a href="https://estt.uae.ac.ma" target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                        <Globe className="w-5 h-5" />
                                    </a>
                                    <a href="mailto:contact@estt.ma"
                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                        <Mail className="w-5 h-5" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
