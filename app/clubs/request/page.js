'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, push, set } from '@/lib/firebase';
import { uploadClubImage, validateClubRequest } from '@/lib/clubUtils';
import { db as staticDb } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, Upload, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ClubRequestPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [formData, setFormData] = useState({
        clubName: '',
        description: '',
        logoUrl: '',
        logoFile: null
    });

    const [orgChart, setOrgChart] = useState([
        { id: 1, name: '', email: '', role: '', filiere: '', photo: '', photoFile: null, uploading: false }
    ]);

    const [members, setMembers] = useState([]);

    // Handle form field changes
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle logo upload
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        setMessage('');

        try {
            const url = await uploadClubImage(file);
            setFormData(prev => ({ ...prev, logoUrl: url, logoFile: file }));
        } catch (error) {
            setMessage(error.message || 'Erreur lors du téléchargement du logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    // Handle org chart changes
    const handleOrgChartChange = (id, field, value) => {
        setOrgChart(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Handle org chart photo upload
    const handleOrgChartPhotoUpload = async (id, file) => {
        if (!file) return;

        setOrgChart(prev => prev.map(item =>
            item.id === id ? { ...item, uploading: true } : item
        ));

        try {
            const url = await uploadClubImage(file);
            setOrgChart(prev => prev.map(item =>
                item.id === id ? { ...item, photo: url, photoFile: file, uploading: false } : item
            ));
        } catch (error) {
            setMessage(error.message || 'Erreur lors du téléchargement de la photo');
            setOrgChart(prev => prev.map(item =>
                item.id === id ? { ...item, uploading: false } : item
            ));
        }
    };

    // Add org chart position
    const addOrgChartPosition = () => {
        const newId = Math.max(...orgChart.map(p => p.id), 0) + 1;
        setOrgChart(prev => [...prev, {
            id: newId,
            name: '',
            email: '',
            role: '',
            filiere: '',
            photo: '',
            photoFile: null,
            uploading: false
        }]);
    };

    // Remove org chart position
    const removeOrgChartPosition = (id) => {
        if (orgChart.length === 1) {
            setMessage('Au moins une position est requise dans l\'organigramme');
            return;
        }
        setOrgChart(prev => prev.filter(item => item.id !== id));
    };

    // Add member
    const addMember = () => {
        const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
        setMembers(prev => [...prev, { id: newId, name: '', email: '', filiere: '' }]);
    };

    // Handle member changes
    const handleMemberChange = (id, field, value) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    // Remove member
    const removeMember = (id) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!user) {
            setMessage('Vous devez être connecté pour soumettre une demande');
            return;
        }

        // Build organizational chart object
        const organizationalChart = {};
        for (const position of orgChart) {
            if (position.name && position.email && position.role) {
                const key = position.role.toLowerCase().replace(/\s+/g, '');
                organizationalChart[key] = {
                    name: position.name,
                    email: position.email,
                    role: position.role,
                    filiere: position.filiere,
                    photo: position.photo || ''
                };
            }
        }

        // Build members array (only non-empty members)
        const membersList = members.filter(m => m.name && m.email);

        const requestData = {
            clubName: formData.clubName,
            description: formData.description,
            logoUrl: formData.logoUrl,
            organizationalChart,
            members: membersList,
            requestedBy: user.email,
            requestedAt: Date.now(),
            status: 'pending'
        };

        // Validate
        const validation = validateClubRequest(requestData);
        if (!validation.valid) {
            setMessage(validation.errors.join('. '));
            return;
        }

        setLoading(true);

        try {
            const requestsRef = ref(db, 'clubRequests');
            const newRequestRef = push(requestsRef);
            await set(newRequestRef, requestData);

            setMessage('success');
            setTimeout(() => {
                router.push('/clubs');
            }, 2000);
        } catch (error) {
            console.error('Error submitting club request:', error);
            setMessage(error.message || 'Erreur lors de la soumission de la demande');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message === 'success';

    if (!user) {
        return (
            <main className="container py-12 px-4 md:px-6 min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Connexion requise</CardTitle>
                        <CardDescription>
                            Vous devez être connecté pour proposer un club
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/clubs">Retour aux clubs</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (isSuccess) {
        return (
            <main className="container py-12 px-4 md:px-6 min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Demande envoyée !</h2>
                        <p className="text-muted-foreground mb-6">
                            Votre demande de création de club a été soumise avec succès.
                            Les administrateurs l'examineront prochainement.
                        </p>
                        <Button asChild>
                            <Link href="/clubs">Retour aux clubs</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
            <div className="container px-4 md:px-6 max-w-4xl">
                <Button variant="ghost" size="sm" asChild className="mb-6 gap-2">
                    <Link href="/clubs">
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux clubs
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Proposer un nouveau club</CardTitle>
                        <CardDescription>
                            Remplissez ce formulaire pour soumettre une demande de création de club.
                            Les administrateurs examineront votre demande.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && !isSuccess && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">Informations de base</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="clubName">Nom du club *</Label>
                                    <Input
                                        id="clubName"
                                        value={formData.clubName}
                                        onChange={(e) => handleChange('clubName', e.target.value)}
                                        placeholder="Ex: Club Robotique ESTT"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Décrivez la mission et les activités du club..."
                                        rows={4}
                                        required
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum 20 caractères
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="logo">Logo du club *</Label>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="logo"
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleLogoUpload}
                                                disabled={loading || uploadingLogo}
                                                className="flex-1"
                                            />
                                            {uploadingLogo && <Loader2 className="w-5 h-5 animate-spin" />}
                                        </div>
                                        {formData.logoUrl && (
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                                <img
                                                    src={formData.logoUrl}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG ou WebP. Max 5MB
                                    </p>
                                </div>
                            </div>

                            {/* Organizational Chart */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold">Organigramme *</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOrgChartPosition}
                                        disabled={loading}
                                        className="gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter une position
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {orgChart.map((position, index) => (
                                        <Card key={position.id} className="border-primary/20">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base">Position {index + 1}</CardTitle>
                                                    {orgChart.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeOrgChartPosition(position.id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Nom complet *</Label>
                                                        <Input
                                                            value={position.name}
                                                            onChange={(e) => handleOrgChartChange(position.id, 'name', e.target.value)}
                                                            placeholder="Ahmed Alami"
                                                            required
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Email *</Label>
                                                        <Input
                                                            type="email"
                                                            value={position.email}
                                                            onChange={(e) => handleOrgChartChange(position.id, 'email', e.target.value)}
                                                            placeholder="ahmed.alami@etu.uae.ac.ma"
                                                            required
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Rôle/Position *</Label>
                                                        <Select
                                                            value={['Président', 'Vice-Président', 'Secrétaire', 'Trésorier'].includes(position.role) ? position.role : (position.role ? 'Autre' : '')}
                                                            onValueChange={(v) => {
                                                                if (v !== 'Autre') {
                                                                    handleOrgChartChange(position.id, 'role', v);
                                                                } else {
                                                                    // If switching to "Other", clear the role so the input shows empty or handle as needed
                                                                    // For now, let's keep the old value if it was custom, or clear it if it was a standard one
                                                                    if (['Président', 'Vice-Président', 'Secrétaire', 'Trésorier'].includes(position.role)) {
                                                                        handleOrgChartChange(position.id, 'role', '');
                                                                    }
                                                                }
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Président">Président</SelectItem>
                                                                <SelectItem value="Vice-Président">Vice-Président</SelectItem>
                                                                <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                                                                <SelectItem value="Trésorier">Trésorier</SelectItem>
                                                                <SelectItem value="Autre">Autre</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        {(!['Président', 'Vice-Président', 'Secrétaire', 'Trésorier'].includes(position.role) && (position.role || position.role === '')) && (
                                                            <Input
                                                                value={position.role}
                                                                onChange={(e) => handleOrgChartChange(position.id, 'role', e.target.value)}
                                                                placeholder="Précisez le rôle..."
                                                                required
                                                                disabled={loading}
                                                                className="mt-2"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Filière *</Label>
                                                        <Select
                                                            value={position.filiere}
                                                            onValueChange={(v) => handleOrgChartChange(position.id, 'filiere', v)}
                                                            disabled={loading}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {staticDb.fields.map(f => (
                                                                    <SelectItem key={f.id} value={f.id}>
                                                                        {f.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Photo (optionnel)</Label>
                                                    <div className="flex items-center gap-4">
                                                        <Input
                                                            type="file"
                                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleOrgChartPhotoUpload(position.id, file);
                                                            }}
                                                            disabled={loading || position.uploading}
                                                            className="flex-1"
                                                        />
                                                        {position.uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                                                        {position.photo && !position.uploading && (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Optional Members */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">Membres réguliers (optionnel)</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez les membres qui ne font pas partie de l'organigramme
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addMember}
                                        disabled={loading}
                                        className="gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter un membre
                                    </Button>
                                </div>

                                {members.length > 0 && (
                                    <div className="space-y-3">
                                        {members.map((member, index) => (
                                            <Card key={member.id} className="border-muted">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex items-end gap-4">
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Nom</Label>
                                                                <Input
                                                                    value={member.name}
                                                                    onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                                                                    placeholder="Nom complet"
                                                                    disabled={loading}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Email</Label>
                                                                <Input
                                                                    type="email"
                                                                    value={member.email}
                                                                    onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                                                                    placeholder="email@etu.uae.ac.ma"
                                                                    disabled={loading}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Filière</Label>
                                                                <Select
                                                                    value={member.filiere}
                                                                    onValueChange={(v) => handleMemberChange(member.id, 'filiere', v)}
                                                                    disabled={loading}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Sélectionnez..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {staticDb.fields.map(f => (
                                                                            <SelectItem key={f.id} value={f.id}>
                                                                                {f.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeMember(member.id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading || uploadingLogo || !formData.logoUrl}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        'Soumettre la demande'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    disabled={loading}
                                >
                                    <Link href="/clubs">Annuler</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main >
    );
}
