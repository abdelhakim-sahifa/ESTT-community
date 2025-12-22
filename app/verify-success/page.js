'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, LogIn } from 'lucide-react';

export default function VerifySuccessPage() {
    return (
        <main className="container py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-md shadow-2xl border-muted-foreground/10 overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

                <CardHeader className="text-center pt-12 pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150 opacity-20" />
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 relative z-10">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Email Vérifié !</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Votre compte ESTT est maintenant actif et prêt à l'emploi.
                    </p>
                </CardHeader>

                <CardContent className="text-center space-y-4 px-8 pb-10">
                    <p className="text-sm leading-relaxed text-muted-foreground/80">
                        Merci d'avoir rejoint la communauté. Vous pouvez maintenant accéder à toutes les ressources,
                        partager vos documents et discuter avec d'autres étudiants.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 p-8 pt-0">
                    <Button asChild className="w-full h-12 text-md font-semibold shadow-lg hover:shadow-primary/20 transition-all duration-300">
                        <Link href="/login">
                            <LogIn className="mr-2 h-5 w-5" />
                            Se connecter
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full h-11 text-muted-foreground hover:text-primary transition-colors">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Retour à l'accueil
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
