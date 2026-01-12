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
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function SignupPage() {
    const router = useRouter();
    const { signUp, sendVerification } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
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

        const email = formData.email;
        let isAllowed = false;

        // 1. Check if academic email
        if (validateEmail(email)) {
            isAllowed = true;
        }
        // 2. Check if Gmail and in exceptions
        else if (email.toLowerCase().endsWith('@gmail.com')) {
            try {
                const { db } = await import('@/lib/firebase');
                const { ref, get } = await import('firebase/database');
                const snapshot = await get(ref(db, 'emailExceptions'));

                if (snapshot.exists()) {
                    const exceptions = snapshot.val();
                    const allowedEmails = Object.values(exceptions);
                    if (allowedEmails.includes(email.trim())) {
                        isAllowed = true;
                    }
                }
            } catch (err) {
                console.error("Error checking email exceptions:", err);
            }
        }

        if (!isAllowed) {
            setMessage(t.auth.academicEmailOnly + '.');
            return;
        }

        if (formData.password.length < 6) {
            setMessage(language === 'ar' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Le mot de passe doit contenir au moins 6 caractères.');
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

            // Send welcome email via API
            try {
                const { welcomeEmail } = await import('@/lib/email-templates');
                const html = welcomeEmail(formData.firstName);

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formData.email,
                        subject: 'Bienvenue sur ESTT Community !',
                        html: html
                    })
                });
            } catch (err) {
                console.error("Failed to send welcome email:", err);
            }

            setMessage(language === 'ar' ? 'تم إنشاء الحساب! تم إرسال بريد تحقق إلى عنوانك الأكاديمي. يرجى التحقق من بريدك قبل تسجيل الدخول.' : 'Compte créé ! Un email de vérification a été envoyé à votre adresse académique. Veuillez vérifier votre boîte de réception avant de vous connecter.');
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('créé') || message.includes('succès') || message.includes('réussie') || message.includes('تم إنشاء') || message.includes('نجحت');

    return (
        <main className="container py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-2xl shadow-xl border-muted-foreground/10">
                <CardHeader className="space-y-1 text-center border-b pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <UserPlus className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className={cn("text-3xl font-bold", language === 'ar' && "font-arabic")}>{t.auth.signupTitle}</CardTitle>
                    <CardDescription>
                        {language === 'ar' ? 'انضم إلى مجتمع ESTT لمشاركة الوصول إلى الموارد' : 'Rejoignez la communauté ESTT pour partager et accéder aux ressources'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    {message && (
                        <Alert variant={isSuccess ? "default" : "destructive"} className={cn("mb-6", isSuccess ? "border-green-500 bg-green-50 text-green-700" : "")}>
                            {isSuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertDescription className="font-medium">{message}</AlertDescription>
                        </Alert>
                    )}

                    {isSuccess ? (
                        <div className="flex flex-col items-center gap-6 py-8">
                            <div className="p-4 bg-green-100 rounded-full text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold">{language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Vérifiez votre boîte mail'}</h3>
                                <p className="text-muted-foreground">{language === 'ar' ? 'تم إرسال رابط تحقق إلى' : 'Un lien de vérification a été envoyé à'} <strong>{formData.email}</strong>.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button className="flex-grow h-12 text-lg" asChild>
                                    <Link href="/">{t.common.home}</Link>
                                </Button>
                                <Button variant="outline" className="flex-grow h-12 text-lg" asChild>
                                    <Link href="/login">{t.common.login}</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">{t.profile.firstName}</Label>
                                    <Input
                                        id="firstName"
                                        placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'}
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">{t.profile.lastName}</Label>
                                    <Input
                                        id="lastName"
                                        placeholder={language === 'ar' ? 'العلمي' : 'Alami'}
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t.auth.emailLabel}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="prenom.nom@etu.uae.ac.ma"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    {language === 'ar' ? 'مطلوب للتحقق من انتمائك إلى جامعة عبد المالك السعدي' : 'Requis pour vérifier votre appartenance à l\'UAE'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'Au moins 6 caractères'}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    {language === 'ar' ? 'ليس بالضرورة نفس كلمة مرور البريد الأكاديمي' : 'Pas forcément le mot de passe de l’e-mail académique'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="filiere">{t.common.filiere}</Label>
                                    <Select
                                        value={formData.filiere}
                                        onValueChange={(v) => handleChange('filiere', v)}
                                        required
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="filiere">
                                            <SelectValue placeholder={language === 'ar' ? 'اختر...' : 'Sélectionnez...'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staticDb.fields.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>{t.fields[f.id] || f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startYear">{language === 'ar' ? 'سنة الدخول' : 'Année d\'entrée'}</Label>
                                    <Select
                                        value={formData.startYear}
                                        onValueChange={(v) => handleChange('startYear', v)}
                                        required
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="startYear">
                                            <SelectValue placeholder={language === 'ar' ? 'اختر...' : 'Sélectionnez...'} />
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
                                        {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Création du compte...'}
                                    </>
                                ) : (
                                    t.auth.signupBtn
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        {t.auth.hasAccount}{' '}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            {t.common.login}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
