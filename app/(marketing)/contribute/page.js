'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db as staticDb } from '@/lib/data';
import { uploadResourceFile } from '@/lib/supabase';
import { db, ref, push, set, get, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, CloudUpload, Info } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

export default function ContributePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const [formData, setFormData] = useState({
        field: '',
        semester: '',
        module: '',
        professor: '',
        title: '',
        description: '',
        type: 'pdf',
        docType: '',
        url: '',
        anonymous: false
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [professors, setProfessors] = useState([]);

    useEffect(() => {
        if (!db) return;

        const fetchProfessors = async () => {
            try {
                const snapshot = await get(ref(db, 'metadata/professors'));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const profList = Array.isArray(data)
                        ? data
                        : (data.professors || Object.values(data));
                    setProfessors(profList);
                }
            } catch (error) {
                console.error("Error fetching professors:", error);
            }
        };

        fetchProfessors();
    }, [db]);


    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoading(true);

        try {
            let resourceUrl = formData.url;

            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error(language === 'ar' ? "يتجاوز الملف الحد الأقصى للحجم وهو 10 ميجا بايت." : "Le fichier dépasse la taille maximale de 10 Mo.");
                }
                const uploaded = await uploadResourceFile(file);
                if (!uploaded && !uploaded.publicUrl) {
                    throw new Error("Erreur lors de l'upload du fichier.");
                }
                resourceUrl = uploaded.publicUrl;
            }

            const timestamp = Date.now();

            // Get module info for short name and full name
            const moduleId = formData.module;
            const moduleObj = staticDb.modules[`${formData.field}-${formData.semester}`]?.find(m => m.id === moduleId);
            const fullModuleName = moduleObj ? moduleObj.name : moduleId;
            const firstWord = fullModuleName.trim().split(/\s+/)[0];
            const shortModuleName = `${firstWord}... - ${formData.semester}`;

            const contributionData = {
                ...formData,
                module: shortModuleName, // Store "ShortName - Semester"
                fullModuleName: fullModuleName, // Store full name
                moduleId: moduleId, // Store original ID for mapping and indexing
                url: resourceUrl,
                fileName: file?.name || null,
                authorId: user?.uid || null,
                authorName: formData.anonymous ? 'Anonyme' : (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Étudiant'),
                createdAt: timestamp,
                unverified: true
            };

            // 1. Push to flat resources node
            const resourcesRef = ref(db, 'resources');
            const newResourceRef = push(resourcesRef);
            const resourceId = newResourceRef.key;
            await set(newResourceRef, contributionData);

            // 2. Link in module_resources mapping using the ID
            const moduleMappingRef = ref(db, `module_resources/${moduleId}/${resourceId}`);
            await set(moduleMappingRef, true);

            // 3. Store keywords for matching search
            const keywordRef = ref(db, `metadata/keywords/${formData.field}/${resourceId}`);
            await set(keywordRef, {
                title: formData.title,
                resourceId: resourceId
            });

            if (user) {
                // Track in user profile
                const userActivityRef = ref(db, `users/${user.uid}/contributions/${resourceId}`);
                await set(userActivityRef, {
                    module: shortModuleName,
                    title: formData.title,
                    timestamp: timestamp,
                    unverified: true
                });
            }



            setMessage(t.contribute.successMessage);
            setTimeout(() => router.push('/thanks'), 2000);

            // Background Emails
            (async () => {
                // Send Resource Received Email to User
                if (user && user.email) {
                    try {
                        const { resourceReceivedEmail } = await import('@/lib/email-templates');
                        const html = resourceReceivedEmail(user.displayName || 'Étudiant', contributionData.title);

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: user.email,
                                subject: 'Contribution reçue',
                                html: html
                            })
                        });
                    } catch (err) {
                        console.error("Failed to send resource received email:", err);
                    }
                }

                // Notify Admin
                try {
                    // Fetch admin settings
                    const settingsSnap = await get(ref(db, 'adminSettings/notifications'));
                    let sendAdminEmail = true;
                    let adminEmail = 'thevcercle@gmail.com';

                    if (settingsSnap.exists()) {
                        const settings = settingsSnap.val();
                        sendAdminEmail = settings.enabled !== false; // Default true
                        if (settings.email) adminEmail = settings.email;
                    }

                    if (sendAdminEmail) {
                        const { adminNotificationEmail } = await import('@/lib/email-templates');
                        const adminHtml = adminNotificationEmail(
                            'Admin',
                            'Nouvelle Ressource',
                            `Une nouvelle ressource "<strong>${contributionData.title}</strong>" a été soumise pour le module ${contributionData.module} par ${contributionData.authorName}.`,
                            'https://estt-community.vercel.app/admin'
                        );

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: adminEmail,
                                subject: 'Action requise : Nouvelle ressource soumise',
                                html: adminHtml
                            })
                        });
                    }
                } catch (adminErr) {
                    console.error("Failed to notify admin:", adminErr);
                }
            })();
        } catch (error) {
            console.error('Error submitting contribution:', error);
            setIsError(true);
            setMessage(error.message || 'Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const modules = formData.field && formData.semester
        ? staticDb.modules[`${formData.field}-${formData.semester}`] || []
        : [];

    return (
        <main className="container py-12 max-w-4xl">
            <section className="mb-12 text-center">
                <h1 className={cn("text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4", language === 'ar' && "font-arabic")}>
                    {t.contribute.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {t.contribute.subtitle}
                </p>
            </section>

            <section>
                <Card className="shadow-lg border-muted-foreground/10">
                    <CardHeader>
                        <CardTitle className={cn(language === 'ar' && "font-arabic")}>{t.contribute.formTitle}</CardTitle>
                        <CardDescription>
                            {t.contribute.requiredFields}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {message && (
                                <Alert variant={isError ? "destructive" : "default"} className={!isError ? "border-green-500 bg-green-50 text-green-700" : ""}>
                                    {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    <AlertTitle className={cn(language === 'ar' && "font-arabic")}>{isError ? (language === 'ar' ? 'خطأ' : "Erreur") : (language === 'ar' ? 'نجاح' : "Succès")}</AlertTitle>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="field">{t.common.filiere} *</Label>
                                    <Select
                                        value={formData.field}
                                        onValueChange={(v) => {
                                            handleChange('field', v);
                                            handleChange('semester', '');
                                            handleChange('module', '');
                                        }}
                                        required
                                    >
                                        <SelectTrigger id="field">
                                            <SelectValue placeholder={t.common.selectFiliere} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staticDb.fields.map((field) => (
                                                <SelectItem key={field.id} value={field.id}>{t.fields[field.id] || field.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="semester">{t.common.semester} *</Label>
                                    <Select
                                        value={formData.semester}
                                        onValueChange={(v) => {
                                            handleChange('semester', v);
                                            handleChange('module', '');
                                        }}
                                        required
                                        disabled={!formData.field}
                                    >
                                        <SelectTrigger id="semester">
                                            <SelectValue placeholder={t.common.selectSemester} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staticDb.semesters.map((sem) => (
                                                <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="module">{t.common.module} *</Label>
                                    <Select
                                        value={formData.module}
                                        onValueChange={(v) => handleChange('module', v)}
                                        required
                                        disabled={!formData.semester}
                                    >
                                        <SelectTrigger id="module">
                                            <SelectValue placeholder={t.common.selectModule} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {modules.map((mod) => (
                                                <SelectItem key={mod.id} value={mod.id}>{mod.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="professor">{t.contribute.professorLabel} ({t.contribute.optional})</Label>
                                    <Select
                                        value={formData.professor}
                                        onValueChange={(v) => handleChange('professor', v)}
                                    >
                                        <SelectTrigger id="professor">
                                            <SelectValue placeholder={language === 'ar' ? 'اختر أستاذاً' : 'Sélectionnez un professeur'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="non-specifie">{t.contribute.unspecified}</SelectItem>
                                            {professors.map((p, index) => {
                                                const name = typeof p === 'string' ? p : p.name;
                                                return (
                                                    <SelectItem key={index} value={name}>
                                                        {name} {p.department ? `— ${p.department}` : ''}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">{t.contribute.resourceTitleLabel} *</Label>
                                <Input
                                    id="title"
                                    placeholder={t.contribute.resourceTitlePlaceholder}
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t.contribute.descriptionLabel}</Label>
                                <Textarea
                                    id="description"
                                    placeholder={t.contribute.descriptionPlaceholder}
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="type">{t.contribute.resourceTypeLabel} *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => handleChange('type', v)}
                                        required
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder={t.contribute.resourceTypeLabel} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="image">{language === 'ar' ? 'صورة' : 'Image'}</SelectItem>
                                            <SelectItem value="video">Vidéo ({language === 'ar' ? 'رابط' : 'lien'})</SelectItem>
                                            <SelectItem value="link">{language === 'ar' ? 'رابط خارجي' : 'Lien externe'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="docType">{t.contribute.docTypeLabel} *</Label>
                                    <Select
                                        value={formData.docType}
                                        onValueChange={(v) => handleChange('docType', v)}
                                        required
                                    >
                                        <SelectTrigger id="docType">
                                            <SelectValue placeholder={t.contribute.chooseType} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cours">{language === 'ar' ? 'درس' : 'Cours'}</SelectItem>
                                            <SelectItem value="TD">TD</SelectItem>
                                            <SelectItem value="TP">TP</SelectItem>
                                            <SelectItem value="Exam">{language === 'ar' ? 'امتحان' : 'Examen'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(formData.type === 'video' || formData.type === 'link') ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="url">{t.contribute.urlLabel} *</Label>
                                        <Input
                                            id="url"
                                            type="url"
                                            placeholder="https://..."
                                            value={formData.url}
                                            onChange={(e) => handleChange('url', e.target.value)}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="file">{t.contribute.fileLabel} *</Label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-muted-foreground/20 border-dashed rounded-md hover:bg-muted/50 transition-colors cursor-pointer relative group">
                                            <div className="space-y-1 text-center">
                                                <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <div className="flex text-sm text-muted-foreground">
                                                    <label htmlFor="file" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                                        <span>{file ? file.name : t.contribute.clickToUpload}</span>
                                                        <input id="file" name="file" type="file" className="sr-only" onChange={handleFileChange} accept={formData.type === 'pdf' ? '.pdf' : 'image/*'} required={!formData.url} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {formData.type === 'pdf' ? (language === 'ar' ? 'PDF فقط' : 'PDF uniquement') : (language === 'ar' ? 'صور فقط' : 'Images uniquement')} {t.contribute.maxSize}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={cn("flex items-center space-x-2 bg-muted/30 p-4 rounded-lg", language === 'ar' && "space-x-reverse")}>
                                <Checkbox
                                    id="anonymous"
                                    checked={formData.anonymous}
                                    onCheckedChange={(v) => handleChange('anonymous', v)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="anonymous" className="text-sm font-medium leading-none cursor-pointer">
                                        {t.contribute.anonymousLabel}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t.contribute.anonymousHint}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button type="submit" size="lg" className="w-full h-12 text-lg shadow-sm" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {t.contribute.submitting}
                                        </>
                                    ) : (
                                        t.contribute.submitBtn
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <Info className="h-3 w-3" />
                                    <span>{t.contribute.verificationInfo}</span>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}

