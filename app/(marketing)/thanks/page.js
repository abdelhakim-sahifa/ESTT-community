import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PartyPopper, ArrowLeft, PlusCircle } from 'lucide-react';

export default function ThanksPage() {
    return (
        <main className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <Card className="max-w-2xl w-full shadow-xl border-muted-foreground/10 overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="text-center pt-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <PartyPopper className="w-12 h-12" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-primary">Merci pour votre contribution !</CardTitle>
                    <CardDescription className="text-lg mt-2 font-medium text-foreground">
                        Votre ressource a été soumise avec succès.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 px-8 pb-10 border-b">
                    <p className="text-muted-foreground leading-relaxed">
                        Elle sera vérifiée par notre équipe de modération et publiée prochainement.
                        Votre participation aide la communauté EST Tétouan à devenir plus forte et solidaire.
                    </p>
                    <p className="text-sm font-medium text-primary bg-primary/5 py-2 px-4 rounded-full inline-block">
                        Un email de confirmation vous a été envoyé.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center bg-muted/20 py-8 px-8">
                    <Button className="w-full sm:w-auto h-11 gap-2" asChild>
                        <Link href="/contribute">
                            <PlusCircle className="w-4 h-4" />
                            Contribuer à nouveau
                        </Link>
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto h-11 gap-2" asChild>
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4" />
                            Retour à l'accueil
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
