'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateEmail(email)) {
            setMessage('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            setMessage('Connexion réussie.');
            setTimeout(() => router.push('/'), 1000);
        } catch (error) {
            console.error(error);
            setMessage('Identifiants invalides ou erreur de connexion.');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('réussie');

    return (
        <main className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <Card className="w-full max-w-md shadow-xl border-muted-foreground/10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
                    <CardDescription>
                        Accédez à votre espace étudiant
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {message && (
                            <Alert variant={isSuccess ? "default" : "destructive"} className={isSuccess ? "border-green-500 bg-green-50 text-green-700" : ""}>
                                {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Adresse email académique</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="prenom.nom@etu.uae.ac.ma"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mot de passe</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-0">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Nouveau ici ?
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full h-11" asChild>
                        <Link href="/signup">Créer un compte</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
