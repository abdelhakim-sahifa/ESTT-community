'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db as staticDb } from '@/lib/data';
import { uploadResourceFile as uploadResourceFileToDrive } from '@/lib/drive';
import { uploadResourceFile as uploadResourceFileToSupabase } from '@/lib/supabase';
import { db, ref, push, set, get } from '@/lib/firebase';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Loader2, CheckCircle2, AlertCircle, CloudUpload, Info, Plus, Trash2, HardDrive, FileText, FileSpreadsheet, Presentation, File, Copy, Check } from 'lucide-react';
const AI_MAX_WORDS = 50; // Restored to a higher limit for the new provider
import { Sparkles } from 'lucide-react';

export default function ContributePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
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
        anonymous: false,
        fields: []
    });
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const dropRef = useRef(null);
    const [professors, setProfessors] = useState([]);

    // AI Autofill State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiResponseText, setAiResponseText] = useState('');
    const [aiParseError, setAiParseError] = useState('');
    const [copiedPrompt, setCopiedPrompt] = useState(false);

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


    // Returns the MIME/extension accept string for the <input> based on the selected type
    const getAcceptString = (type) => {
        switch (type) {
            case 'pdf': return '.pdf,application/pdf';
            case 'image': return 'image/*';
            case 'powerpoint': return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
            case 'excel': return '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'word': return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'html': return '.html,.htm,text/html';
            case 'autre': return '*';
            default: return '*';
        }
    };

    // Human-readable label for the accepted formats
    const getFileTypeLabel = (type) => {
        switch (type) {
            case 'pdf': return 'PDF uniquement';
            case 'image': return 'Images (PNG, JPG, GIF…)';
            case 'powerpoint': return 'PowerPoint (.ppt, .pptx)';
            case 'excel': return 'Excel (.xls, .xlsx)';
            case 'word': return 'Word (.doc, .docx)';
            case 'html': return 'Page HTML (.html)';
            case 'autre': return 'Tout format (auto-détecté)';
            default: return 'Fichier';
        }
    };

    // Auto-detect type from file extension when "autre" is selected
    const detectFileType = (f) => {
        if (!f) return formData.type;
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
        if (['doc', 'docx'].includes(ext)) return 'word';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
        if (['html', 'htm'].includes(ext)) return 'html';
        return 'autre';
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFile = async (selectedFile) => {
        console.log("📂 [Client] applyFile started for:", selectedFile?.name);
        if (!selectedFile) return;
        setFile(selectedFile);

        // If auto-detect mode, update the type in formData
        const detected = detectFileType(selectedFile);
        console.log("📂 [Client] Detected file type:", detected);
        if (formData.type === 'autre' && detected !== 'autre') {
            handleChange('type', detected);
        }
    };

    const handleFileChange = (e) => {
        applyFile(e.target.files[0]);
    };

    // Drag & Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if leaving the drop zone entirely
        if (dropRef.current && !dropRef.current.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) applyFile(dropped);
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
                    throw new Error("Le fichier dépasse la taille maximale de 10 Mo.");
                }

                if (formData.type === 'html') {
                    // Upload to Supabase
                    const uploaded = await uploadResourceFileToSupabase(file);
                    if (!uploaded || !uploaded.publicUrl) {
                        throw new Error("Erreur lors de l'upload du fichier HTML.");
                    }
                    resourceUrl = uploaded.publicUrl;
                } else {
                    // Get human readable names for folder creation
                    const fieldObj = staticDb.fields.find(f => f.id === formData.field);
                    const moduleId = formData.module;
                    const moduleObj = staticDb.modules[`${formData.field}-${formData.semester}`]?.find(m => m.id === moduleId);

                    const folderMetadata = {
                        fieldName: fieldObj ? fieldObj.name : formData.field,
                        semester: formData.semester,
                        moduleName: moduleObj ? moduleObj.name : moduleId,
                        professorName: formData.professor,
                        displayTitle: formData.title
                    };

                    // Uses the new lib/drive.js which calls /api/upload-drive with metadata
                    const uploaded = await uploadResourceFileToDrive(file, folderMetadata, (progress) => {
                        setUploadProgress(progress);
                    });

                    if (!uploaded || !uploaded.publicUrl) {
                        throw new Error("Erreur lors de l'upload du fichier.");
                    }
                    resourceUrl = uploaded.publicUrl;
                }
                setUploadProgress(100);
            }

            const timestamp = Date.now();

            const moduleId = formData.module;
            const moduleObj = staticDb.modules[`${formData.field}-${formData.semester}`]?.find(m => m.id === moduleId);
            const fullModuleName = moduleObj ? moduleObj.name : moduleId;
            const firstWord = fullModuleName.trim().split(/\s+/)[0];
            const shortModuleName = `${firstWord}... - ${formData.semester}`;

            const contributionData = {
                ...formData,
                module: shortModuleName,
                fullModuleName: fullModuleName,
                moduleId: moduleId,
                url: resourceUrl,
                fileName: file?.name || null,
                authorId: user?.uid || null,
                authorName: formData.anonymous ? 'Anonyme' : (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Étudiant'),
                createdAt: timestamp,
                unverified: true,
                storageType: formData.type === 'html' ? 'supabase' : 'google-drive'
            };

            const resourcesRef = ref(db, 'resources');
            const newResourceRef = push(resourcesRef);
            const resourceId = newResourceRef.key;

            const finalFields = [
                { fieldId: formData.field, moduleId: moduleId },
                ...(formData.fields || [])
            ];

            const updatedContributionData = {
                ...contributionData,
                fields: formData.fields || []
            };

            await set(newResourceRef, updatedContributionData);

            for (const link of finalFields) {
                if (!link.fieldId || !link.moduleId) continue;

                const moduleMappingRef = ref(db, `module_resources/${link.moduleId}/${resourceId}`);
                await set(moduleMappingRef, true);

                const keywordRef = ref(db, `metadata/keywords/${link.fieldId}/${resourceId}`);
                await set(keywordRef, {
                    title: formData.title,
                    resourceId: resourceId
                });
            }

            if (user) {
                const userActivityRef = ref(db, `users/${user.uid}/contributions/${resourceId}`);
                await set(userActivityRef, {
                    module: shortModuleName,
                    title: formData.title,
                    timestamp: timestamp,
                    unverified: true,
                    storageType: formData.type === 'html' ? 'supabase' : 'google-drive'
                });
            }

            setMessage('Contribution envoyée avec succès ! Elle sera vérifiée sous peu.');
            setTimeout(() => router.push('/thanks'), 2000);

            // Background Emails
            (async () => {
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

                try {
                    const settingsSnap = await get(ref(db, 'adminSettings/notifications'));
                    let sendAdminEmail = true;
                    let adminEmail = 'thevcercle@gmail.com';

                    if (settingsSnap.exists()) {
                        const settings = settingsSnap.val();
                        sendAdminEmail = settings.enabled !== false;
                        if (settings.email) adminEmail = settings.email;
                    }

                    if (sendAdminEmail) {
                        const { adminNotificationEmail } = await import('@/lib/email-templates');
                        const adminHtml = adminNotificationEmail(
                            'Admin',
                            'Nouvelle Ressource (Drive)',
                            `Une nouvelle ressource "<strong>${contributionData.title}</strong>" a été soumise pour le module ${contributionData.module} par ${contributionData.authorName}.`,
                            'https://estt.ma/admin'
                        );

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: adminEmail,
                                subject: 'Action requise : Nouvelle ressource soumise (Drive)',
                                html: adminHtml
                            })
                        });
                    }
                } catch (adminErr) {
                    console.error("Failed to notify admin:", adminErr);
                }

                try {
                    const { notifySlack, SLACK_CHANNELS } = await import('@/lib/slack');
                    await notifySlack(SLACK_CHANNELS.ADMIN, {
                        title: '📚 Nouvelle Contribution',
                        message: `Une nouvelle ressource a été soumise pour le module *${contributionData.fullModuleName || contributionData.module}*.`,
                        user: {
                            name: contributionData.authorName,
                            email: user?.email || 'N/A',
                            uid: user?.uid || 'N/A'
                        },
                        resource: {
                            title: contributionData.title,
                            type: contributionData.type || 'resource',
                            id: resourceId
                        }
                    });
                } catch (slackErr) {
                    console.error('Failed to notify Slack about contribution:', slackErr);
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

    const getAiPrompt = () => {
        let prompt = `Analyse le document fourni et génère un titre concis et une brève description pour cette ressource académique.\nRenvoie UNIQUEMENT un objet JSON valide avec les clés suivantes :\n- "title": (Le titre de la ressource, max 10 mots)\n- "description": (Une description pertinente, max 50 mots)`;

        if (formData.field && formData.semester && modules.length > 0) {
            prompt += `\n- "module": l'ID du module correspondant. Modules disponibles : ${modules.map(m => `"${m.id}" (${m.name})`).join(', ')}.`;
            const profNames = professors.map(p => typeof p === 'string' ? p : p.name);
            prompt += `\n- "professor": Le nom du professeur. Professeurs connus : ${profNames.join(', ')}. (Mettre "Non spécifié" si non trouvé)`;
            prompt += `\n- "docType": Le type de document. Choisir parmi : "Cours", "TD", "TP", "Exam".`;
        }

        prompt += `\n\nImportant : Si je n'ai pas fourni de fichier, demande-moi de l'attacher avant de générer le JSON.`;
        prompt += `\n\nN'inclus aucun texte supplémentaire ni de formatage markdown, juste le JSON brut.`;
        return prompt;
    };

    const handleAiAutofill = () => {
        setAiParseError('');
        try {
            let textToParse = aiResponseText.trim();
            if (textToParse.startsWith('```json')) {
                textToParse = textToParse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (textToParse.startsWith('```')) {
                textToParse = textToParse.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const parsed = JSON.parse(textToParse);
            if (!parsed.title && !parsed.description && !parsed.module && !parsed.professor && !parsed.docType) {
                setAiParseError('Le JSON ne contient aucune clé valide ("title", "description", etc.).');
                return;
            }

            let matchedProf = formData.professor;
            if (parsed.professor) {
                const profInput = String(parsed.professor).toLowerCase().trim();
                if (profInput === 'non spécifié' || profInput === 'non specifie' || profInput === 'non-specifie') {
                    matchedProf = 'non-specifie';
                } else {
                    const profNames = professors.map(p => typeof p === 'string' ? p : p.name);
                    const exactMatch = profNames.find(p => p.toLowerCase() === profInput);
                    if (exactMatch) {
                        matchedProf = exactMatch;
                    } else {
                        const partialMatch = profNames.find(p => profInput.includes(p.toLowerCase()) || p.toLowerCase().includes(profInput));
                        if (partialMatch) matchedProf = partialMatch;
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                title: parsed.title || prev.title,
                description: parsed.description || prev.description,
                module: parsed.module && modules.some(m => m.id === parsed.module) ? parsed.module : prev.module,
                professor: matchedProf,
                docType: parsed.docType || prev.docType
            }));

            setIsAiModalOpen(false);
            setAiResponseText('');
            setIsError(false);
            setMessage('Champs remplis avec succès via l\'IA !');
        } catch (error) {
            setAiParseError('Format JSON invalide. Assurez-vous de coller uniquement le JSON renvoyé par l\'IA.');
        }
    };

    const copyPromptToClipboard = () => {
        const prompt = getAiPrompt();
        navigator.clipboard.writeText(prompt);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    if (!user) {
        return (
            <main className="container py-12 max-w-4xl text-center">
                <Alert className="max-w-2xl mx-auto mb-6 text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connexion requise</AlertTitle>
                    <AlertDescription className="flex flex-col gap-4 mt-2">
                        <p>Vous devez être connecté pour contribuer une ressource.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.push('/login?redirect=/contribute')} className="w-fit">
                                Se connecter
                            </Button>
                            <Button onClick={() => router.push('/signup')} className="w-fit">
                                S'inscrire
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </main>
        );
    }

    const isAuthorized = profile && (profile.verified || profile.role === 'admin' || profile.role === 'moderator');

    if (!isAuthorized) {
        return (
            <main className="container py-12 max-w-4xl text-center">
                <Alert variant="destructive" className="max-w-2xl mx-auto mb-6 text-left border-destructive/50 bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription className="flex flex-col gap-4 mt-2">
                        <p>
                            Vous devez être un utilisateur vérifié pour pouvoir contribuer des ressources.<br />
                            Cela nous aide à maintenir la qualité des documents partagés.<br />
                            Veuillez vérifier votre compte dans votre profil.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={() => router.push(`/profile/${user.uid}`)} className="w-fit bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Mon profil
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/')} className="w-fit border-destructive/30 hover:bg-destructive/20 text-destructive">
                                Retour à l'accueil
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </main>
        );
    }

    return (
        <main className="container py-12 max-w-4xl">
            <section className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Contribuer une ressource
                </h1>
                <p className="text-xl text-muted-foreground">
                    Aide tes camarades en partageant tes cours, TDs, exercices ou vidéos.
                </p>
            </section>

            <section>
                <Card className="shadow-lg border-muted-foreground/10">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0 pb-6">
                        <div className="space-y-1.5">
                            <CardTitle>Formulaire de contribution</CardTitle>
                            <CardDescription>
                                Les champs marqués d'une astérisque (*) sont obligatoires.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAiModalOpen(true)}
                            className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/30 font-semibold shadow-sm shrink-0"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Remplir avec l'IA
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {message && (
                                <Alert variant={isError ? "destructive" : "default"} className={!isError ? "border-green-500 bg-green-50 text-green-700" : ""}>
                                    {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    <AlertTitle>{isError ? "Erreur" : "Succès"}</AlertTitle>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="field">Filière *</Label>
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
                                            <SelectValue placeholder="Sélectionnez une filière" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staticDb.fields.map((field) => (
                                                <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="semester">Semestre *</Label>
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
                                            <SelectValue placeholder="Sélectionnez un semestre" />
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
                                    <Label htmlFor="module">Module *</Label>
                                    <Select
                                        value={formData.module}
                                        onValueChange={(v) => handleChange('module', v)}
                                        required
                                        disabled={!formData.semester}
                                    >
                                        <SelectTrigger id="module">
                                            <SelectValue placeholder="Sélectionnez un module" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {modules.map((mod) => (
                                                <SelectItem key={mod.id} value={mod.id}>{mod.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="professor">Professeur (Optionnel)</Label>
                                    <Select
                                        value={formData.professor}
                                        onValueChange={(v) => handleChange('professor', v)}
                                    >
                                        <SelectTrigger id="professor">
                                            <SelectValue placeholder="Sélectionnez un professeur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="non-specifie">Non spécifié</SelectItem>
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

                            {/* Additional Fields (Linking) */}
                            {formData.field && formData.semester && (
                                <div className="space-y-4 p-5 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                Aussi utile pour... (Optionnel)
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                Si cette ressource correspond à un module dans une autre filière.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs font-bold text-primary hover:bg-primary/5"
                                            onClick={() => {
                                                const current = formData.fields || [];
                                                handleChange('fields', [...current, { fieldId: '', moduleId: '' }]);
                                            }}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Ajouter
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {(formData.fields || []).map((link, lIndex) => {
                                            const linkModules = link.fieldId && formData.semester
                                                ? staticDb.modules[`${link.fieldId}-${formData.semester}`] || []
                                                : [];

                                            return (
                                                <div key={lIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/50 rounded-xl border border-muted-foreground/5 relative group">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase opacity-70">Filière</Label>
                                                        <Select
                                                            value={link.fieldId}
                                                            onValueChange={(val) => {
                                                                const updatedLinks = [...formData.fields];
                                                                updatedLinks[lIndex] = { ...updatedLinks[lIndex], fieldId: val, moduleId: '' };
                                                                handleChange('fields', updatedLinks);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filière" /></SelectTrigger>
                                                            <SelectContent>
                                                                {staticDb.fields.map(f => (
                                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase opacity-70">Module Équivalent</Label>
                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={link.moduleId}
                                                                onValueChange={(val) => {
                                                                    const updatedLinks = [...formData.fields];
                                                                    updatedLinks[lIndex] = { ...updatedLinks[lIndex], moduleId: val };
                                                                    handleChange('fields', updatedLinks);
                                                                }}
                                                                disabled={!link.fieldId}
                                                            >
                                                                <SelectTrigger className="h-9 text-xs flex-grow"><SelectValue placeholder="Module" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {linkModules.map(m => (
                                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    const updatedLinks = formData.fields.filter((_, i) => i !== lIndex);
                                                                    handleChange('fields', updatedLinks);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!formData.fields || formData.fields.length === 0) && (
                                            <p className="text-[10px] text-muted-foreground italic text-center py-2 opacity-60">
                                                Aucune liaison supplémentaire ajoutée.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title">Titre de la ressource *</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Cours complet chapitre 3"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Décrivez brièvement la ressource..."
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type de ressource *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => handleChange('type', v)}
                                        required
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Type de ressource" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="powerpoint">PowerPoint</SelectItem>
                                            <SelectItem value="excel">Excel / Tableur</SelectItem>
                                            <SelectItem value="word">Word</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="html">Page HTML (.html)</SelectItem>
                                            <SelectItem value="video">Vidéo (lien)</SelectItem>
                                            <SelectItem value="link">Lien externe</SelectItem>
                                            <SelectItem value="autre">Autre (auto-détecté)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="docType">Type de document *</Label>
                                    <Select
                                        value={formData.docType}
                                        onValueChange={(v) => handleChange('docType', v)}
                                        required
                                    >
                                        <SelectTrigger id="docType">
                                            <SelectValue placeholder="Choisir le type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cours">Cours</SelectItem>
                                            <SelectItem value="TD">TD</SelectItem>
                                            <SelectItem value="TP">TP</SelectItem>
                                            <SelectItem value="Exam">Examen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(formData.type === 'video' || formData.type === 'link') ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="url">URL *</Label>
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
                                        <Label htmlFor="file">Fichier *</Label>
                                        <div
                                            ref={dropRef}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all cursor-pointer relative group ${isDragging
                                                ? 'border-primary bg-primary/10 scale-[1.01]'
                                                : file
                                                    ? 'border-green-400 bg-green-50/50'
                                                    : 'border-muted-foreground/20 hover:bg-muted/50 hover:border-primary/40'
                                                }`}
                                        >
                                            <div className="space-y-2 text-center pointer-events-none">
                                                {isDragging ? (
                                                    <CloudUpload className="mx-auto h-12 w-12 text-primary animate-bounce" />
                                                ) : file ? (
                                                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                                ) : (
                                                    <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                                <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground pointer-events-auto">
                                                    {isDragging ? (
                                                        <span className="font-semibold text-primary">Déposez le fichier ici</span>
                                                    ) : file ? (
                                                        <>
                                                            <span className="font-medium text-green-600 truncate max-w-[220px]">{file.name}</span>
                                                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                            <label htmlFor="file" className="cursor-pointer text-xs text-primary hover:underline">
                                                                Changer de fichier
                                                                <input id="file" name="file" type="file" className="sr-only" onChange={handleFileChange} accept={getAcceptString(formData.type)} />
                                                            </label>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label htmlFor="file" className="cursor-pointer font-medium text-primary hover:text-primary/80">
                                                                Cliquez pour choisir un fichier
                                                                <input id="file" name="file" type="file" className="sr-only" onChange={handleFileChange} accept={getAcceptString(formData.type)} required={!formData.url} />
                                                            </label>
                                                            <span className="text-xs">ou glissez-déposez ici</span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {getFileTypeLabel(formData.type)} — jusqu'à 10 MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-lg">
                                <Checkbox
                                    id="anonymous"
                                    checked={formData.anonymous}
                                    onCheckedChange={(v) => handleChange('anonymous', v)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="anonymous" className="text-sm font-medium leading-none cursor-pointer">
                                        Contribuer de manière anonyme
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Votre nom ne sera pas affiché publiquement sur la ressource.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button type="submit" size="lg" className="w-full h-12 text-lg shadow-sm" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {uploadProgress > 0 && uploadProgress < 100
                                                ? `Envoi en cours... ${uploadProgress}%`
                                                : uploadProgress === 100
                                                    ? "Finalisation..."
                                                    : "Envoi en cours..."}
                                        </>
                                    ) : (
                                        'Soumettre la ressource'
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <Info className="h-3 w-3" />
                                    <span>Toutes les ressources sont vérifiées avant d'être publiées.</span>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </section>

            {/* AI Autofill Modal */}
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Remplir avec l'IA
                        </DialogTitle>
                        <DialogDescription>
                            Générez automatiquement le titre et la description en demandant à votre IA préférée (ChatGPT, Claude, Gemini, etc.).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm flex items-center gap-2"><span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs">1</span> Copiez ce prompt</h3>
                                {!(formData.field && formData.semester) && (
                                    <span className="text-[10px] text-muted-foreground italic px-2 py-0.5 bg-muted rounded-full">Sélectionnez d'abord une filière et un semestre pour un prompt avancé.</span>
                                )}
                            </div>
                            <div className="relative bg-muted/50 p-4 rounded-lg font-mono text-xs text-muted-foreground border border-muted whitespace-pre-wrap">
                                {getAiPrompt()}
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={copyPromptToClipboard}
                                >
                                    {copiedPrompt ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2"><span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs">2</span> Demandez à votre IA</h3>
                            <p className="text-xs text-muted-foreground pl-7">
                                Allez sur ChatGPT, Claude ou Gemini, collez le prompt copié ci-dessus, et <strong>attachez votre document</strong> (PDF, Image, etc.).
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-7 mt-2 gap-2 font-semibold bg-white text-black hover:bg-gray-50 border-gray-200"
                                onClick={() => {
                                    const encodedPrompt = encodeURIComponent(getAiPrompt());
                                    window.open(`https://chatgpt.com/?prompt=${encodedPrompt}`, '_blank');
                                }}
                            >
                                <Image src="/assets/images/chatgpt_logo.svg" alt="ChatGPT" width={16} height={16} />
                                Ouvrir ChatGPT
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2"><span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs">3</span> Collez la réponse JSON ici</h3>
                            <div className="pl-7 space-y-3">
                                {aiParseError && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">{aiParseError}</AlertDescription>
                                    </Alert>
                                )}
                                <Textarea
                                    placeholder='{"title": "Mon Titre", "description": "Ma description"}'
                                    className="font-mono text-xs min-h-[120px]"
                                    value={aiResponseText}
                                    onChange={(e) => setAiResponseText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <Button variant="ghost" onClick={() => setIsAiModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleAiAutofill} disabled={!aiResponseText.trim()}>
                                Appliquer et remplir
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
