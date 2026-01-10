'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db, ref, push, set } from '@/lib/firebase';
import { uploadResourceFile } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronLeft, Eye, Send, Save, CheckCircle2, Video, ImageIcon } from 'lucide-react';
import { AD_STATUSES, AD_CATEGORIES, AD_PRICING, AD_LIMITS } from '@/lib/ad-constants';
import { adNotifications } from '@/lib/ad-notifications';

export default function SubmitAdPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        whatsapp: '',
        link: '',
        category: 'service',
        type: 'image',
        file: null,
        duration: 30
    });

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/ads-portal/submit');
        }
    }, [user, router]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > AD_LIMITS.MAX_FILE_SIZE) {
            alert("Le fichier est trop volumineux (Max 10MB)");
            return;
        }

        const isImage = AD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = AD_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            alert("Format non supporté (JPG, PNG, WebP, MP4, WebM)");
            return;
        }

        setFormData(prev => ({ ...prev, file, type: isVideo ? 'video' : 'image' }));
        setFilePreview(URL.createObjectURL(file));
    };

    const validateForm = () => {
        if (!formData.title || formData.title.length > AD_LIMITS.TITLE_MAX_LENGTH) return false;
        if (!formData.description || formData.description.length > AD_LIMITS.DESC_MAX_LENGTH) return false;
        if (!formData.whatsapp || formData.whatsapp.length < 10) return false;
        if (!formData.file && !formData.id) return false; // File required for new ads
        return true;
    };

    const handleSubmit = async (status = AD_STATUSES.UNDER_REVIEW) => {
        if (!validateForm()) {
            alert("Veuillez remplir tous les champs correctement.");
            return;
        }

        setLoading(true);
        try {
            let mediaUrl = formData.url;

            if (formData.file) {
                const upload = await uploadResourceFile(formData.file);
                mediaUrl = upload.publicUrl;
            }

            const newAdRef = push(ref(db, 'studentAds'));
            const pricing = AD_PRICING.find(p => p.duration === parseInt(formData.duration)) || AD_PRICING[1];

            const adData = {
                title: formData.title,
                description: formData.description,
                whatsapp: formData.whatsapp,
                link: formData.link,
                category: formData.category,
                type: formData.type,
                url: mediaUrl,
                status: status,
                createdAt: new Date().toISOString(),
                publisher: user.uid,
                publisherEmail: user.email,
                duration: pricing.duration,
                price: pricing.price,
                paymentStatus: 'pending'
            };

            await set(newAdRef, adData);

            if (status === AD_STATUSES.UNDER_REVIEW) {
                // Fire and forget email notification
                adNotifications.sendSubmissionConfirmation(user.email, formData.title);
                alert("Annonce soumise pour review !");
            } else {
                alert("Brouillon enregistré.");
            }

            router.push('/ads-portal/dashboard');
        } catch (error) {
            console.error("Submission error:", error);
            alert("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-10 pb-20">
            <div className="container max-w-5xl mx-auto px-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/ads-portal')}
                    className="mb-8 hover:bg-slate-100 rounded-full"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Retour
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Form Side */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Publier une Annonce</h1>
                            <p className="text-slate-500 mb-10">Donnez de la visibilité à vos projets sur la plateforme ESTT. Tétouan.</p>

                            <div className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-slate-700 font-bold">Titre de l'annonce</Label>
                                        <span className="text-[10px] text-slate-400">{formData.title.length}/{AD_LIMITS.TITLE_MAX_LENGTH}</span>
                                    </div>
                                    <Input
                                        maxLength={AD_LIMITS.TITLE_MAX_LENGTH}
                                        placeholder="Ex: Formation Excel pour Étudiants"
                                        value={formData.title}
                                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                        className="rounded-xl h-12 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-slate-700 font-bold">Description</Label>
                                        <span className="text-[10px] text-slate-400">{formData.description.length}/{AD_LIMITS.DESC_MAX_LENGTH}</span>
                                    </div>
                                    <Textarea
                                        maxLength={AD_LIMITS.DESC_MAX_LENGTH}
                                        placeholder="Détails de votre offre ou service..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="rounded-xl min-h-[120px] resize-none"
                                    />
                                </div>

                                {/* Media Upload */}
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">Visuel (Image ou Vidéo)</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors ${filePreview ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200'}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {formData.type === 'video' ? <Video className="w-8 h-8 text-blue-500 mb-2" /> : <ImageIcon className="w-8 h-8 text-blue-500 mb-2" />}
                                                <p className="mb-2 text-sm text-slate-500">
                                                    <span className="font-bold">Cliquez pour uploader</span> ou glissez-déposez
                                                </p>
                                                <p className="text-xs text-slate-400">PNG, JPG, MP4 (MAX. 10MB)</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
                                        </label>
                                    </div>
                                </div>

                                {/* Contact & Duration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Numéro WhatsApp (Mandatoire)</Label>
                                        <Input
                                            placeholder="Ex: 0612345678"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                                            className="rounded-xl h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Durée de diffusion</Label>
                                        <select
                                            value={formData.duration}
                                            onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))}
                                            className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {AD_PRICING.map(p => (
                                                <option key={p.id} value={p.duration}>{p.label} - {p.price} MAD</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Link */}
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">Lien de redirection (Optionnel)</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={formData.link}
                                        onChange={(e) => setFormData(p => ({ ...p, link: e.target.value }))}
                                        className="rounded-xl h-12"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-10 border-t border-slate-100">
                                <Button
                                    onClick={() => handleSubmit(AD_STATUSES.DRAFT)}
                                    variant="outline"
                                    className="h-14 rounded-2xl flex-1 font-bold group"
                                    disabled={loading}
                                >
                                    <Save className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600" />
                                    Sauvegarder en Brouillon
                                </Button>
                                <Button
                                    onClick={() => handleSubmit(AD_STATUSES.UNDER_REVIEW)}
                                    className="h-14 rounded-2xl flex-1 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20"
                                    disabled={loading}
                                >
                                    <Send className="w-5 h-5 mr-3" />
                                    {loading ? "Envoi en cours..." : "Soumettre pour Validation"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-10 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Eye className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-bold text-slate-800">Aperçu en temps réel</h2>
                            </div>

                            <Card className="group overflow-hidden border-none shadow-xl rounded-3xl bg-white scale-95 origin-top transition-transform">
                                <div className="relative aspect-video overflow-hidden bg-slate-100">
                                    {filePreview ? (
                                        formData.type === 'video' ? (
                                            <video src={filePreview} className="w-full h-full object-cover" autoPlay muted loop />
                                        ) : (
                                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon className="w-12 h-12 mb-2" />
                                            <p className="text-xs">Aucun visuel</p>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none shadow-sm uppercase text-[10px] font-bold">
                                            {formData.type === 'video' ? 'Vidéo' : 'Focus'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">
                                        {formData.title || "Titre de votre annonce"}
                                    </h3>
                                    <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed h-[48px]">
                                        {formData.description || "Votre description apparaîtra ici..."}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400">Ma Boutique</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-[10px] font-bold border-blue-100 text-blue-600 pointer-events-none">
                                            Découvrir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-50">
                                <h4 className="flex items-center text-sm font-bold text-blue-900 mb-3">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Conseils pour une annonce réussie
                                </h4>
                                <ul className="space-y-3">
                                    <li className="text-xs text-blue-800/70 leading-relaxed">• Utilisez un titre accrocheur et court</li>
                                    <li className="text-xs text-blue-800/70 leading-relaxed">• Upload une image de haute qualité (formats 16:9 préférés)</li>
                                    <li className="text-xs text-blue-800/70 leading-relaxed">• Décrivez clairement la valeur de votre offre</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
