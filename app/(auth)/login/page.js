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
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';



export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setMessage(language === 'ar' ? 'يرجى إدخال بريدك الإلكتروني لإعادة تعيين كلمة المرور.' : 'Veuillez saisir votre adresse email pour réinitialiser votre mot de passe.');
            return;
        }
        if (!validateEmail(email)) {
            setMessage(t.auth.academicEmailOnly + '.');
            return;
        }

        setLoading(true);
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            await sendPasswordResetEmail(auth, email);
            setMessage(language === 'ar' ? 'تم إرسال بريد إعادة التعيين إلى بريدك الأكاديمي.' : 'Un email de réinitialisation a été envoyé à votre adresse académique.');
        } catch (error) {
            console.error(error);
            setMessage(language === 'ar' ? 'خطأ في إرسال بريد إعادة التعيين.' : 'Erreur lors de l\'envoi de l\'email de réinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('réussie') || message.includes('envoyé') || message.includes('تم إرسال') || message.includes('نجحت');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true); // Start loading immediately for UX

        let isAllowed = false;

        // 1. Check if academic email
        if (validateEmail(email)) {
            isAllowed = true;
        }
        // 2. Check if Gmail and in exceptions
        else if (email.toLowerCase().endsWith('@gmail.com')) {
            try {
                const { db, ref, get } = await import('@/lib/firebase');
                const snapshot = await get(ref(db, 'emailExceptions'));

                if (snapshot.exists()) {
                    const exceptions = snapshot.val();
                    // Check if email exists in values (array or object)
                    const allowedEmails = Object.values(exceptions);
                    if (allowedEmails.includes(email.trim())) {
                        isAllowed = true;
                    }
                }
            } catch (err) {
                console.error("Error checking email exceptions:", err);
                // Fail safe: deny if error
            }
        }

        if (!isAllowed) {
            setMessage(t.auth.academicEmailOnly + '.');
            setLoading(false);
            return;
        }

        try {
            await signIn(email, password);
            setMessage(language === 'ar' ? 'نجحت عملية تسجيل الدخول.' : 'Connexion réussie.');
            setTimeout(() => router.push('/'), 1000);
        } catch (error) {
            console.error(error);
            setMessage(language === 'ar' ? 'بيانات غير صحيحة أو خطأ في الاتصال.' : 'Identifiants invalides ou erreur de connexion.');
            setLoading(false);
        }
    };

    return (
        <main className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <Card className="w-full max-w-md shadow-xl border-muted-foreground/10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{t.auth.loginTitle}</CardTitle>
                    <CardDescription>
                        {language === 'ar' ? 'قم بالدخول إلى فضاء الطالب الخاص بك' : 'Accédez à votre espace étudiant'}
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
                            <Label htmlFor="email">{t.auth.emailLabel}</Label>
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
                                <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    {t.auth.forgotPassword}
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {language === 'ar' ? 'ليس بالضرورة نفس كلمة مرور البريد الأكاديمي' : 'Pas forcément le mot de passe de l’e-mail académique'}
                            </p>
                        </div>
                        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t.common.loading}
                                </>
                            ) : (
                                t.auth.loginBtn
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
                                {t.auth.noAccount}
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full h-11" asChild>
                        <Link href="/signup">{t.auth.signupBtn}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
