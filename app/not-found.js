import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <main className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12 px-4">
            <Card className="max-w-2xl w-full shadow-2xl border-muted-foreground/10 overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="text-center pt-12">
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative p-6 bg-primary/10 rounded-full text-primary ring-8 ring-primary/5">
                                <FileQuestion className="w-16 h-16" />
                            </div>
                        </div>
                    </div>
                    <CardTitle className="text-4xl md:text-5xl font-bold text-primary tracking-tight">404</CardTitle>
                    <CardDescription className="text-xl md:text-2xl mt-4 font-semibold text-foreground">
                        Oups ! Page Introuvable
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 px-10 pb-12">
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                        Désolé, la page que vous recherchez semble avoir disparu dans les couloirs de l'EST Tétouan ou n'a jamais existé.
                    </p>
                    <div className="flex flex-col items-center justify-center pt-2">
                        <p className="text-sm font-medium text-primary bg-primary/5 py-2 px-6 rounded-full inline-flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Essayez de retourner à l'accueil pour trouver ce que vous cherchez.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center bg-muted/30 py-10 px-10">
                    <Button className="w-full sm:w-auto h-12 px-8 gap-2 text-base font-semibold border-2 border-transparent transition-all duration-200 hover:bg-transparent hover:text-primary hover:border-primary" asChild shadow="none">
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Aller à l'accueil
                        </Link>
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto h-12 px-8 gap-2 text-base font-semibold border-2 transition-all duration-200 hover:bg-primary hover:text-white" asChild>
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="w-5 h-5" />
                            Retourner
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
