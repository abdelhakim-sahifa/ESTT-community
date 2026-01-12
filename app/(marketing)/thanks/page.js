import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PartyPopper, ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

export default function ThanksPage() {
    const { language } = useLanguage();
    const t = translations[language];
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
                    <CardTitle className={cn("text-3xl font-bold text-primary", language === 'ar' && "font-arabic")}>
                        {t.thanks.title}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2 font-medium text-foreground">
                        {t.thanks.subtitle}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 px-8 pb-10 border-b">
                    <p className="text-muted-foreground leading-relaxed">
                        {t.thanks.description}
                    </p>
                    <p className="text-sm font-medium text-primary bg-primary/5 py-2 px-4 rounded-full inline-block">
                        {t.thanks.emailInfo}
                    </p>
                </CardContent>
                <CardFooter className={cn("flex flex-col sm:flex-row gap-4 justify-center bg-muted/20 py-8 px-8", language === 'ar' && "sm:flex-row-reverse")}>
                    <Button className={cn("w-full sm:w-auto h-11 gap-2", language === 'ar' && "flex-row-reverse")} asChild>
                        <Link href="/contribute">
                            <PlusCircle className="w-4 h-4" />
                            {t.thanks.contributeMore}
                        </Link>
                    </Button>
                    <Button variant="outline" className={cn("w-full sm:w-auto h-11 gap-2", language === 'ar' && "flex-row-reverse")} asChild>
                        <Link href="/">
                            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                            {t.common.backToHome}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
