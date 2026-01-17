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

    const [variableFields, setVariableFields] = useState(new Set());

    const [resources, setResources] = useState([
        {
            id: Date.now(),
            title: '',
            description: '',
            file: null,
            url: '',
            loading: false,
            success: false,
            error: '',
            // Dynamic fields
            field: '',
            semester: '',
            module: '',
            professor: '',
            docType: '',
            type: ''
        }
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

    const toggleVariableField = (fieldName) => {
        setVariableFields(prev => {
            const next = new Set(prev);
            if (next.has(fieldName)) {
                next.delete(fieldName);
            } else {
                next.add(fieldName);
            }
            return next;
        });
    };

    const handleCommonChange = (name, value) => {
        setCommonData(prev => ({ ...prev, [name]: value }));
    };

    const updateResource = (id, updates) => {
        setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const addResourceRow = () => {
        setResources(prev => [...prev, {
            id: Date.now(),
            title: '',
            description: '',
            file: null,
            url: '',
            loading: false,
            success: false,
            error: '',
            field: '',
            semester: '',
            module: '',
            professor: '',
            docType: '',
            type: ''
        }]);
    };

    const removeResourceRow = (id) => {
        if (resources.length > 1) {
            setResources(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleSubmitAll = async () => {
        const toSubmit = resources.filter(r => !r.success && (r.file || r.url || r.type === 'link') && r.title);
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

                // Merge common and specific data
                const finalData = { ...commonData };
                variableFields.forEach(field => {
                    if (resource[field]) {
                        finalData[field] = resource[field];
                    }
                });

                const timestamp = Date.now();
                const moduleId = finalData.module;
                const moduleObj = staticDb.modules[`${finalData.field}-${finalData.semester}`]?.find(m => m.id === moduleId);
                const fullModuleName = moduleObj ? moduleObj.name : moduleId;
                const firstWord = fullModuleName.trim().split(/\s+/)[0];
                const shortModuleName = `${firstWord}... - ${finalData.semester}`;

                const contributionData = {
                    ...finalData,
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
                    unverified: false
                };

                const resourcesRef = ref(db, 'resources');
                const newResourceRef = push(resourcesRef);
                const resourceId = newResourceRef.key;
                await set(newResourceRef, contributionData);

                const moduleMappingRef = ref(db, `module_resources/${moduleId}/${resourceId}`);
                await set(moduleMappingRef, true);

                const keywordRef = ref(db, `metadata/keywords/${finalData.field}/${resourceId}`);
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

    const FieldHeader = ({ label, field, children }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className={variableFields.has(field) ? "text-muted-foreground opacity-50" : ""}>{label}</Label>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => toggleVariableField(field)}
                    title={variableFields.has(field) ? "Rendre fixe" : "Rendre variable"}
                >
                    {variableFields.has(field) ? <Plus className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                </Button>
            </div>
            {!variableFields.has(field) ? children : (
                <div className="h-10 flex items-center px-3 rounded-md border border-dashed text-xs text-muted-foreground italic bg-slate-50/50">
                    Saisie par ressource
                </div>
            )}
        </div>
    );

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

            <Card className="border-primary/10 shadow-sm bg-slate-50/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Informations Communes
                    </CardTitle>
                    <CardDescription>
                        Les champs avec un <Info className="w-3 h-3 inline" /> sont appliqués à toutes les lignes. Cliquez pour les rendre variables.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FieldHeader label="Filière" field="field">
                        <Select value={commonData.field} onValueChange={(v) => handleCommonChange('field', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Filière" /></SelectTrigger>
                            <SelectContent>
                                {staticDb.fields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FieldHeader>

                    <FieldHeader label="Semestre" field="semester">
                        <Select value={commonData.semester} onValueChange={(v) => handleCommonChange('semester', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Semestre" /></SelectTrigger>
                            <SelectContent>
                                {staticDb.semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FieldHeader>

                    <FieldHeader label="Module" field="module">
                        <Select value={commonData.module} onValueChange={(v) => handleCommonChange('module', v)} disabled={!commonData.semester && !variableFields.has('semester')}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Module" /></SelectTrigger>
                            <SelectContent>
                                {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FieldHeader>

                    <FieldHeader label="Type de Ressource" field="type">
                        <Select value={commonData.type} onValueChange={(v) => handleCommonChange('type', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Vidéo</SelectItem>
                                <SelectItem value="link">Lien</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldHeader>

                    <FieldHeader label="Type de Document" field="docType">
                        <Select value={commonData.docType} onValueChange={(v) => handleCommonChange('docType', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Type de Document" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cours">Cours</SelectItem>
                                <SelectItem value="TD">TD</SelectItem>
                                <SelectItem value="TP">TP</SelectItem>
                                <SelectItem value="Exam">Examen</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldHeader>

                    <FieldHeader label="Professeur" field="professor">
                        <Select value={commonData.professor} onValueChange={(v) => handleCommonChange('professor', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Professeur" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="non-specifie">Non spécifié</SelectItem>
                                {professors.map((p, i) => <SelectItem key={i} value={typeof p === 'string' ? p : p.name}>{typeof p === 'string' ? p : p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FieldHeader>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {resources.map((resource, index) => {
                    const resType = variableFields.has('type') ? resource.type : commonData.type;
                    const resField = variableFields.has('field') ? resource.field : commonData.field;
                    const resSemeostre = variableFields.has('semester') ? resource.semester : commonData.semester;
                    const rowModules = resField && resSemeostre ? staticDb.modules[`${resField}-${resSemeostre}`] || [] : [];

                    return (
                        <Card key={resource.id} className={resource.success ? "border-green-500 bg-green-50/50" : "shadow-sm border-slate-200"}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="text-xs font-bold uppercase">Titre de la ressource {index + 1}</Label>
                                        <Input
                                            placeholder="Ex: Chapitre 1 - Introduction"
                                            value={resource.title}
                                            onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                                            disabled={resource.success || resource.loading}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-6 space-y-2">
                                        <Label className="text-xs font-bold uppercase">{(resType === 'video' || resType === 'link') ? 'URL / Lien' : 'Fichier'}</Label>
                                        {(resType === 'video' || resType === 'link') ? (
                                            <Input
                                                placeholder="https://..."
                                                value={resource.url}
                                                onChange={(e) => updateResource(resource.id, { url: e.target.value })}
                                                disabled={resource.success || resource.loading}
                                                className="bg-white"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="file"
                                                    onChange={(e) => updateResource(resource.id, { file: e.target.files[0], title: resource.title || e.target.files[0]?.name.split('.')[0] })}
                                                    disabled={resource.success || resource.loading}
                                                    className="cursor-pointer bg-white"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-2">
                                        {resource.loading ? (
                                            <Loader2 className="animate-spin text-primary" />
                                        ) : resource.success ? (
                                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                                <span>Envoyé</span>
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => removeResourceRow(resource.id)} className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {variableFields.size > 0 && !resource.success && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        {variableFields.has('field') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Filière</Label>
                                                <Select value={resource.field} onValueChange={(v) => updateResource(resource.id, { field: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Filière" /></SelectTrigger>
                                                    <SelectContent>
                                                        {staticDb.fields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {variableFields.has('semester') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Semestre</Label>
                                                <Select value={resource.semester} onValueChange={(v) => updateResource(resource.id, { semester: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Semestre" /></SelectTrigger>
                                                    <SelectContent>
                                                        {staticDb.semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {variableFields.has('module') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Module</Label>
                                                <Select value={resource.module} onValueChange={(v) => updateResource(resource.id, { module: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Module" /></SelectTrigger>
                                                    <SelectContent>
                                                        {rowModules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {variableFields.has('type') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Type de Ressource</Label>
                                                <Select value={resource.type} onValueChange={(v) => updateResource(resource.id, { type: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pdf">PDF</SelectItem>
                                                        <SelectItem value="image">Image</SelectItem>
                                                        <SelectItem value="video">Vidéo</SelectItem>
                                                        <SelectItem value="link">Lien</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {variableFields.has('docType') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Type de Document</Label>
                                                <Select value={resource.docType} onValueChange={(v) => updateResource(resource.id, { docType: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Doc Type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Cours">Cours</SelectItem>
                                                        <SelectItem value="TD">TD</SelectItem>
                                                        <SelectItem value="TP">TP</SelectItem>
                                                        <SelectItem value="Exam">Examen</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {variableFields.has('professor') && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase">Professeur</Label>
                                                <Select value={resource.professor} onValueChange={(v) => updateResource(resource.id, { professor: v })}>
                                                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Professeur" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="non-specifie">Non spécifié</SelectItem>
                                                        {professors.map((p, i) => <SelectItem key={i} value={typeof p === 'string' ? p : p.name}>{typeof p === 'string' ? p : p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {resource.error && <p className="text-xs text-destructive mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {resource.error}</p>}
                            </CardContent>
                        </Card>
                    );
                })}

                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl hover:bg-slate-50 hover:border-primary/50 transition-all group" onClick={addResourceRow}>
                    <Plus className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-bold">Ajouter une autre ressource</span>
                </Button>
            </div>
        </div>
    );
}
