'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, push, set } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ClubJoinPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        reason: ''
    });

    useEffect(() => {
        if (clubId) {
            fetchClubData();
        }
    }, [clubId]);

    useEffect(() => {
        if (user || profile) {
            setFormData(prev => ({
                ...prev,
                name: (profile?.firstName && profile?.lastName)
                    ? `${profile.firstName} ${profile.lastName}`
                    : (user?.displayName || prev.name),
                email: user?.email || prev.email
            }));
        }
    }, [user, profile]);

    const fetchClubData = async () => {
        try {
            const clubRef = ref(db, `clubs/${clubId}`);
            const clubSnap = await get(clubRef);

            if (!clubSnap.exists()) {
                setError('Club not found');
                setLoading(false);
                return;
            }

            setClub({ id: clubId, ...clubSnap.val() });
        } catch (error) {
            console.error('Error fetching club:', error);
            setError('Failed to load club data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (!formData.name || !formData.email || !formData.reason) {
                throw new Error('Veuillez remplir tous les champs obligatoires');
            }

            // Create join request
            const requestRef = push(ref(db, `clubs/${clubId}/joinRequests`));
            await set(requestRef, {
                userId: user ? user.uid : null, // Optional if user not logged in, but better if they are
                ...formData,
                status: 'pending',
                submittedAt: Date.now()
            });

            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.message || 'Une erreur est survenue');
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

    if (!club) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-muted-foreground">{error || 'Club introuvable'}</p>
                <Button asChild>
                    <Link href="/clubs">Retour aux clubs</Link>
                </Button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Demande envoyée !</CardTitle>
                        <CardDescription>
                            Votre demande d'adhésion a été transmise aux administrateurs du club.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Vous recevrez une notification une fois votre demande traitée.
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href={`/clubs/${clubId}`}>Retourner au profil du club</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
            <style jsx global>{`
                .theme-text { color: ${club.themeColor || '#64748b'}; }
                .theme-bg { background-color: ${club.themeColor || '#64748b'}; }
                .theme-btn { background-color: ${club.themeColor || '#64748b'}; }
                .theme-btn:hover { opacity: 0.9; }
                .theme-ring:focus-visible { ring-color: ${club.themeColor || '#64748b'}; }
            `}</style>

            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href={`/clubs/${clubId}`} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Retour au club
                    </Link>
                </Button>

                <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto relative rounded-2xl overflow-hidden bg-white shadow-lg border-2 border-white">
                        {club.logo ? (
                            <Image
                                src={club.logo}
                                alt={club.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center text-2xl font-bold bg-muted"
                                style={{ color: club.themeColor || '#64748b' }}
                            >
                                {club.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{club.name}</h1>
                        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                            Rejoignez notre communauté et participez à nos activités !
                        </p>
                    </div>
                </div>

                <Card className="border-t-4" style={{ borderTopColor: club.themeColor || '#64748b' }}>
                    <CardHeader>
                        <CardTitle>Formulaire d'adhésion</CardTitle>
                        <CardDescription>
                            Remplissez ce formulaire pour soumettre votre candidature.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Votre nom"
                                        className="focus-visible:ring-offset-0 focus-visible:ring-1 theme-ring"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="votre@email.com"
                                        className="focus-visible:ring-offset-0 focus-visible:ring-1 theme-ring"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Numéro de téléphone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+212 6..."
                                    className="focus-visible:ring-offset-0 focus-visible:ring-1 theme-ring"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Pourquoi souhaitez-vous rejoindre le club ? *</Label>
                                <Textarea
                                    id="reason"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                    placeholder="Partagez vos motivations..."
                                    className="min-h-[100px] focus-visible:ring-offset-0 focus-visible:ring-1 theme-ring"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full theme-btn text-white transition-opacity text-base py-6"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Envoyer ma demande'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
