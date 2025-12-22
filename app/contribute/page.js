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
        url: '',
        anonymous: false
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [professors, setProfessors] = useState([]);

    useEffect(() => {
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
    }, []);

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
                    throw new Error("Le fichier dépasse la taille maximale de 10 Mo.");
                }
                const uploaded = await uploadResourceFile(file);
                if (!uploaded && !uploaded.publicUrl) {
                    throw new Error("Erreur lors de l'upload du fichier.");
                }
                resourceUrl = uploaded.publicUrl;
            }

            const timestamp = Date.now();
            const contributionData = {
                ...formData,
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

            // 2. Link in module_resources mapping
            const moduleMappingRef = ref(db, `module_resources/${formData.module}/${resourceId}`);
            await set(moduleMappingRef, true);

            if (user) {
                // Track in user profile
                const userActivityRef = ref(db, `users/${user.uid}/contributions/${resourceId}`);
                await set(userActivityRef, {
                    module: formData.module,
                    title: formData.title,
                    timestamp: timestamp
                });
            }

            setMessage('Contribution envoyée avec succès ! Elle sera vérifiée sous peu.');
            setTimeout(() => router.push('/thanks'), 2000);
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
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Contribuer une ressource
                </h1>
                <p className="text-xl text-muted-foreground">
                    Aide tes camarades en partageant tes cours, TDs, exercices ou vidéos.
                </p>
            </section>

            <section>
                <Card className="shadow-lg border-muted-foreground/10">
                    <CardHeader>
                        <CardTitle>Formulaire de contribution</CardTitle>
                        <CardDescription>
                            Les champs marqués d'une astérisque (*) sont obligatoires.
                        </CardDescription>
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
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Vidéo (lien)</SelectItem>
                                            <SelectItem value="link">Lien externe</SelectItem>
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
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-muted-foreground/20 border-dashed rounded-md hover:bg-muted/50 transition-colors cursor-pointer relative group">
                                            <div className="space-y-1 text-center">
                                                <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <div className="flex text-sm text-muted-foreground">
                                                    <label htmlFor="file" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                                        <span>{file ? file.name : "Cliquez pour uploader un fichier"}</span>
                                                        <input id="file" name="file" type="file" className="sr-only" onChange={handleFileChange} accept={formData.type === 'pdf' ? '.pdf' : 'image/*'} required={!formData.url} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {formData.type === 'pdf' ? 'PDF uniquement' : 'Images uniquement'} jusqu'à 10MB
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
                                            Envoi en cours...
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
        </main>
    );
}

