'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db as staticDb } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { signUp, sendVerification } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        filiere: '',
        startYear: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateEmail(formData.email)) {
            setMessage('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        if (formData.password.length < 6) {
            setMessage('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);

        try {
            // Create user in Auth
            const userCred = await signUp(formData.email, formData.password);
            const user = userCred.user;

            // Save user profile in Realtime DB
            const { db } = await import('@/lib/firebase');
            const { ref, set } = await import('firebase/database');

            await set(ref(db, `users/${user.uid}`), {
                email: formData.email.toLowerCase(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                filiere: formData.filiere,
                startYear: formData.startYear,
                createdAt: Date.now()
            });

            // Send verification email
            await sendVerification(user);

            setMessage('Compte créé ! Un email de vérification a été envoyé à votre adresse académique. Veuillez vérifier votre boîte de réception avant de vous connecter.');
            // We don't redirect immediately to let them read the message
            // setTimeout(() => router.push('/login'), 5000);
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('succès') || message.includes('réussie');

    return (
        <main className="container py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-2xl shadow-xl border-muted-foreground/10">
                <CardHeader className="space-y-1 text-center border-b pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <UserPlus className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Créer un compte</CardTitle>
                    <CardDescription>
                        Rejoignez la communauté ESTT pour partager et accéder aux ressources
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <Alert variant={isSuccess ? "default" : "destructive"} className={isSuccess ? "border-green-500 bg-green-50 text-green-700" : ""}>
                                {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Ahmed"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Nom</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Alami"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Adresse email académique</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="prenom.nom@etu.uae.ac.ma"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Requis pour vérifier votre appartenance à l'UAE
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Au moins 6 caractères"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="filiere">Filière</Label>
                                <Select
                                    value={formData.filiere}
                                    onValueChange={(v) => handleChange('filiere', v)}
                                    required
                                >
                                    <SelectTrigger id="filiere">
                                        <SelectValue placeholder="Sélectionnez..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staticDb.fields.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startYear">Année d'entrée</Label>
                                <Select
                                    value={formData.startYear}
                                    onValueChange={(v) => handleChange('startYear', v)}
                                    required
                                >
                                    <SelectTrigger id="startYear">
                                        <SelectValue placeholder="Sélectionnez..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-medium shadow-sm transition-all hover:shadow-md" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Création du compte...
                                </>
                            ) : (
                                'Créer un compte'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Vous avez déjà un compte ?{' '}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
