'use client';

import { useState, useEffect } from 'react';
import { db as staticDb } from '@/lib/data';
import { uploadResourceFile } from '@/lib/supabase';
import { db, ref, push, set, get } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, CheckCircle2, AlertCircle, CloudUpload, Info, Plus, Trash2 } from 'lucide-react';

export default function AdminFastContribute() {
    const { user, profile } = useAuth();
    const [commonData, setCommonData] = useState({
        field: '',
        semester: '',
        module: '',
        professor: 'non-specifie',
        docType: '',
        type: 'pdf'
    });

    const [resources, setResources] = useState([
        { id: Date.now(), title: '', description: '', file: null, url: '', loading: false, success: false, error: '' }
    ]);

    const [professors, setProfessors] = useState([]);

    useEffect(() => {
        if (!db) return;
        const fetchProfessors = async () => {
            try {
                const snapshot = await get(ref(db, 'metadata/professors'));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const profList = Array.isArray(data) ? data : (data.professors || Object.values(data));
                    setProfessors(profList);
                }
            } catch (error) {
                console.error("Error fetching professors:", error);
            }
        };
        fetchProfessors();
    }, []);

    const handleCommonChange = (name, value) => {
        setCommonData(prev => ({ ...prev, [name]: value }));
    };

    const updateResource = (id, updates) => {
        setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const addResourceRow = () => {
        setResources(prev => [...prev, { id: Date.now(), title: '', description: '', file: null, url: '', loading: false, success: false, error: '' }]);
    };

    const removeResourceRow = (id) => {
        if (resources.length > 1) {
            setResources(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleSubmitAll = async () => {
        const toSubmit = resources.filter(r => !r.success && (r.file || r.url) && r.title);
        if (toSubmit.length === 0) return;

        for (const resource of toSubmit) {
            try {
                updateResource(resource.id, { loading: true, error: '' });

                let resourceUrl = resource.url;
                if (resource.file) {
                    const uploaded = await uploadResourceFile(resource.file);
                    if (!uploaded || !uploaded.publicUrl) throw new Error("Upload failed");
                    resourceUrl = uploaded.publicUrl;
                }

                const timestamp = Date.now();
                const moduleId = commonData.module;
                const moduleObj = staticDb.modules[`${commonData.field}-${commonData.semester}`]?.find(m => m.id === moduleId);
                const fullModuleName = moduleObj ? moduleObj.name : moduleId;
                const firstWord = fullModuleName.trim().split(/\s+/)[0];
                const shortModuleName = `${firstWord}... - ${commonData.semester}`;

                const contributionData = {
                    ...commonData,
                    title: resource.title,
                    description: resource.description,
                    module: shortModuleName,
                    fullModuleName: fullModuleName,
                    moduleId: moduleId,
                    url: resourceUrl,
                    fileName: resource.file?.name || null,
                    authorId: user?.uid || null,
                    authorName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Admin',
                    createdAt: timestamp,
                    unverified: false // Admin contribution is pre-verified
                };

                const resourcesRef = ref(db, 'resources');
                const newResourceRef = push(resourcesRef);
                const resourceId = newResourceRef.key;
                await set(newResourceRef, contributionData);

                const moduleMappingRef = ref(db, `module_resources/${moduleId}/${resourceId}`);
                await set(moduleMappingRef, true);

                const keywordRef = ref(db, `metadata/keywords/${commonData.field}/${resourceId}`);
                await set(keywordRef, { title: resource.title, resourceId: resourceId });

                updateResource(resource.id, { loading: false, success: true });
            } catch (err) {
                console.error(err);
                updateResource(resource.id, { loading: false, error: err.message });
            }
        }
    };

    const modules = commonData.field && commonData.semester
        ? staticDb.modules[`${commonData.field}-${commonData.semester}`] || []
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Contribution Rapide</h2>
                    <p className="text-muted-foreground text-sm">Ajoutez plusieurs ressources d'un coup. Pas d'emails, pas de vérification.</p>
                </div>
                <Button onClick={handleSubmitAll} disabled={resources.every(r => r.success || (!r.file && !r.url) || !r.title)}>
                    Tout envoyer
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informations Communes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Filière</Label>
                        <Select value={commonData.field} onValueChange={(v) => handleCommonChange('field', v)}>
                            <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
                            <SelectContent>
                                {staticDb.fields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Semestre</Label>
                        <Select value={commonData.semester} onValueChange={(v) => handleCommonChange('semester', v)}>
                            <SelectTrigger><SelectValue placeholder="Semestre" /></SelectTrigger>
                            <SelectContent>
                                {staticDb.semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Module</Label>
                        <Select value={commonData.module} onValueChange={(v) => handleCommonChange('module', v)} disabled={!commonData.semester}>
                            <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                            <SelectContent>
                                {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Type de Ressource</Label>
                        <Select value={commonData.type} onValueChange={(v) => handleCommonChange('type', v)}>
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Vidéo</SelectItem>
                                <SelectItem value="link">Lien</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Type de Document</Label>
                        <Select value={commonData.docType} onValueChange={(v) => handleCommonChange('docType', v)}>
                            <SelectTrigger><SelectValue placeholder="Type de Document" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cours">Cours</SelectItem>
                                <SelectItem value="TD">TD</SelectItem>
                                <SelectItem value="TP">TP</SelectItem>
                                <SelectItem value="Exam">Examen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Professeur</Label>
                        <Select value={commonData.professor} onValueChange={(v) => handleCommonChange('professor', v)}>
                            <SelectTrigger><SelectValue placeholder="Professeur" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="non-specifie">Non spécifié</SelectItem>
                                {professors.map((p, i) => <SelectItem key={i} value={typeof p === 'string' ? p : p.name}>{typeof p === 'string' ? p : p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {resources.map((resource, index) => (
                    <Card key={resource.id} className={resource.success ? "border-green-500 bg-green-50/50" : ""}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Titre</Label>
                                    <Input
                                        placeholder="Ex: Chapitre 1"
                                        value={resource.title}
                                        onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                                        disabled={resource.success || resource.loading}
                                    />
                                </div>
                                <div className="md:col-span-6 space-y-2">
                                    <Label>{(commonData.type === 'video' || commonData.type === 'link') ? 'URL' : 'Fichier'}</Label>
                                    {(commonData.type === 'video' || commonData.type === 'link') ? (
                                        <Input
                                            placeholder="https://..."
                                            value={resource.url}
                                            onChange={(e) => updateResource(resource.id, { url: e.target.value })}
                                            disabled={resource.success || resource.loading}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                onChange={(e) => updateResource(resource.id, { file: e.target.files[0], title: resource.title || e.target.files[0]?.name.split('.')[0] })}
                                                disabled={resource.success || resource.loading}
                                                className="cursor-pointer"
                                            />
                                            {resource.file && <span className="text-xs truncate max-w-[100px]">{resource.file.name}</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-2">
                                    {resource.loading ? (
                                        <Loader2 className="animate-spin text-primary" />
                                    ) : resource.success ? (
                                        <CheckCircle2 className="text-green-500" />
                                    ) : (
                                        <Button variant="ghost" size="icon" onClick={() => removeResourceRow(resource.id)} className="text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {resource.error && <p className="text-xs text-destructive mt-2">{resource.error}</p>}
                        </CardContent>
                    </Card>
                ))}

                <Button variant="outline" className="w-full border-dashed" onClick={addResourceRow}>
                    <Plus className="w-4 h-4 mr-2" /> Ajouter une autre ressource
                </Button>
            </div>
        </div>
    );
}
