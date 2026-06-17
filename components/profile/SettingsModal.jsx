'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
    // Tab icons
    UserCog, Palette, Bell, Code2,
    // Account section icons
    User, Mail, Camera, Globe, Lock, ShieldOff, CalendarDays, LogOut,
    // Preferences section icons
    Moon, Sun, Monitor, Sliders, Accessibility, Clock, Ruler,
    // Notifications section icons
    BellRing, MessageSquare, Send, Eye, EyeOff, Users, Download, Trash2,
    // Advanced section icons
    KeyRound, Webhook, Terminal, FlaskConical,
    // UI icons
    X, ChevronRight, Check, Loader2, Upload, AlertCircle,
} from 'lucide-react';
import { db, ref, update, get, auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { useDialog } from '@/context/DialogContext';
import { useAuth } from '@/context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'account',       label: 'Compte & Sécurité',        icon: UserCog  },
    { id: 'appearance',    label: 'Préférences & Apparence',  icon: Palette  },
    { id: 'notifications', label: 'Notifications & Vie Privée', icon: Bell   },
    { id: 'advanced',      label: 'Options avancées',         icon: Code2    },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="p-2 bg-primary/8 rounded-lg shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

function FieldRow({ label, children, htmlFor }) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}

function DisabledBadge({ label = 'Bientôt disponible' }) {
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
            {label}
        </span>
    );
}

function DisabledToggle({ label, description, icon: Icon, checked = false }) {
    return (
        <div className="flex items-center justify-between py-3 opacity-50 cursor-not-allowed select-none">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-md">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    {description && <p className="text-xs text-slate-400">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DisabledBadge />
                <div className={`w-10 h-6 rounded-full border-2 flex items-center transition-colors ${checked ? 'bg-slate-300 border-slate-300' : 'bg-slate-100 border-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
            </div>
        </div>
    );
}

function DisabledButton({ label, icon: Icon, variant = 'default' }) {
    const base = variant === 'danger'
        ? 'border-red-100 text-red-300 bg-red-50/50'
        : 'border-slate-200 text-slate-400 bg-slate-50';
    return (
        <button
            disabled
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium cursor-not-allowed opacity-60 ${base}`}
        >
            <span className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                {label}
            </span>
            <DisabledBadge />
        </button>
    );
}

function Divider() {
    return <div className="border-t border-slate-100 my-4" />;
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function AccountTab({ profile, resolvedUid, onClose }) {
    const { showSuccess, showError, showWarning, showConfirm } = useDialog();
    const { signOut } = useAuth();

    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName:  profile?.lastName  || '',
        email:     profile?.email     || '',
        photoUrl:  profile?.photoUrl  || '',
    });
    const [saving, setSaving]             = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSent, setPasswordSent] = useState(false);

    const avatarInputRef = useRef(null);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showWarning("L'image est trop volumineuse (max 5 Mo).");
            return;
        }
        setAvatarUploading(true);
        try {
            const url = await uploadToImgBB(file);
            await update(ref(db, `users/${resolvedUid}`), { photoUrl: url, updatedAt: Date.now() });
            setFormData(p => ({ ...p, photoUrl: url }));
            showSuccess("Photo de profil mise à jour !");
        } catch {
            showError("Erreur lors du téléchargement de la photo.");
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSave = async () => {
        if (!resolvedUid) return;
        setSaving(true);
        try {
            await update(ref(db, `users/${resolvedUid}`), {
                firstName: formData.firstName.trim(),
                lastName:  formData.lastName.trim(),
                updatedAt: Date.now(),
            });
            showSuccess("Profil mis à jour avec succès !");
        } catch {
            showError("Erreur lors de la mise à jour du profil.");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!profile?.email) return;
        setPasswordLoading(true);
        try {
            await sendPasswordResetEmail(auth, profile.email);
            setPasswordSent(true);
            showSuccess(`Un lien de réinitialisation a été envoyé à ${profile.email}`);
        } catch (err) {
            showError("Impossible d'envoyer l'email de réinitialisation.");
            console.error(err);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        const confirmed = await showConfirm(
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            { type: 'danger', title: 'Déconnexion', confirmLabel: 'Déconnexion' }
        );
        if (!confirmed) return;
        onClose();
        try { await signOut(); } catch (e) { console.error(e); }
    };

    const signupDate = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Inconnue';

    return (
        <div className="space-y-6">

            {/* ── Profile Management ───────────────────────────────── */}
            <section>
                <SectionHeader
                    icon={User}
                    title="Gestion du profil"
                    description="Modifiez vos informations personnelles visibles publiquement."
                />

                {/* Avatar picker */}
                <FieldRow label="Photo de profil">
                    <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                                {formData.photoUrl ? (
                                    <Image
                                        src={formData.photoUrl}
                                        alt="Avatar"
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <User className="w-7 h-7 text-slate-400" />
                                )}
                            </div>
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                                {avatarUploading
                                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    : <Camera className="w-5 h-5 text-white" />
                                }
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <div className="flex-1">
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {avatarUploading ? 'Téléchargement...' : 'Changer la photo'}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG ou GIF · Max 5 Mo</p>
                        </div>
                    </div>
                </FieldRow>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <FieldRow label="Prénom" htmlFor="s-firstName">
                        <input
                            id="s-firstName"
                            value={formData.firstName}
                            onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                            placeholder="Prénom"
                        />
                    </FieldRow>
                    <FieldRow label="Nom" htmlFor="s-lastName">
                        <input
                            id="s-lastName"
                            value={formData.lastName}
                            onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                            placeholder="Nom de famille"
                        />
                    </FieldRow>
                </div>

                <div className="mt-3">
                    <FieldRow label="Email" htmlFor="s-email">
                        <input
                            id="s-email"
                            value={formData.email}
                            readOnly
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">L'adresse email ne peut pas être modifiée ici.</p>
                    </FieldRow>
                </div>

                {/* Language — disabled */}
                <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50/70 opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Langue de l'interface</p>
                                <p className="text-xs text-slate-400">Français</p>
                            </div>
                        </div>
                        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md font-medium">FR</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed border-t border-slate-200 pt-2">
                        Pour l'instant, seule la langue française est disponible.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
            </section>

            <Divider />

            {/* ── Authentication ────────────────────────────────────── */}
            <section>
                <SectionHeader
                    icon={Lock}
                    title="Authentification"
                    description="Gérez votre mot de passe et la sécurité de votre compte."
                />

                {/* Password reset */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                            <Lock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">Modifier le mot de passe</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                Un lien de réinitialisation sera envoyé à votre adresse email.
                            </p>
                            {passwordSent && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                    <Check className="w-3.5 h-3.5" />
                                    Email envoyé à {profile?.email}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handlePasswordReset}
                        disabled={passwordLoading || passwordSent}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        {passwordLoading ? 'Envoi en cours...' : passwordSent ? 'Lien envoyé ✓' : 'Envoyer le lien de réinitialisation'}
                    </button>
                </div>

                {/* 2FA — disabled */}
                <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <ShieldOff className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Authentification à deux facteurs (2FA)</p>
                                <p className="text-xs text-slate-400">Renforcez la sécurité de votre compte.</p>
                            </div>
                        </div>
                        <DisabledBadge label="Coming Soon" />
                    </div>
                </div>
            </section>

            <Divider />

            {/* ── Active Session ────────────────────────────────────── */}
            <section>
                <SectionHeader
                    icon={CalendarDays}
                    title="Session active"
                    description="Informations sur votre compte et options de déconnexion."
                />

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-3 mb-3">
                    <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Inscrit le</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{signupDate}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 active:scale-[0.98] transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                </button>
            </section>
        </div>
    );
}

function AppearanceTab() {
    return (
        <div className="space-y-6">

            {/* Theming */}
            <section>
                <SectionHeader
                    icon={Palette}
                    title="Thème & Apparence"
                    description="Personnalisez l'apparence visuelle de l'application."
                />
                <div className="space-y-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <DisabledToggle icon={Moon}    label="Mode sombre"          description="Interface en thème foncé"         />
                    <DisabledToggle icon={Sun}      label="Mode clair"           description="Interface en thème clair"         checked />
                    <DisabledToggle icon={Monitor}  label="Thème système"        description="Suit les préférences de votre OS" />
                    <DisabledToggle icon={Sliders}  label="Couleur d'accentuation" description="Personnalisez la couleur principale" />
                </div>
            </section>

            <Divider />

            {/* Accessibility */}
            <section>
                <SectionHeader
                    icon={Accessibility}
                    title="Accessibilité"
                    description="Ajustez l'interface pour une meilleure expérience."
                />
                <div className="space-y-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <DisabledToggle icon={Sliders}       label="Mise à l'échelle des polices"   description="Agrandissez ou réduisez le texte"    />
                    <DisabledToggle icon={Eye}           label="Mode contraste élevé"           description="Améliore la lisibilité"              />
                    <DisabledToggle icon={Accessibility} label="Optimisation lecteur d'écran"   description="Compatibilité assistive renforcée"   />
                </div>
            </section>

            <Divider />

            {/* Localization */}
            <section>
                <SectionHeader
                    icon={Clock}
                    title="Régionalisation"
                    description="Configurez votre fuseau horaire et vos formats régionaux."
                />
                <div className="space-y-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <DisabledToggle icon={Clock}  label="Fuseau horaire"          description="Afrique/Casablanca (UTC+1)"                />
                    <DisabledToggle icon={CalendarDays} label="Format de date"    description="JJ/MM/AAAA"                               />
                    <DisabledToggle icon={Ruler}  label="Unités de mesure"        description="Système métrique"                         />
                </div>
            </section>

            <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Ces options sont en cours de développement et ne sont pas encore disponibles.
            </div>
        </div>
    );
}

function NotificationsTab({ profile, resolvedUid }) {
    const { showSuccess, showError } = useDialog();
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    const handleExportData = async () => {
        if (!resolvedUid || !profile?.email) return;
        setExporting(true);
        setExportDone(false);

        try {
            const username = profile.email?.split('@')[0] || resolvedUid;

            const res = await fetch('/api/export-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid:       resolvedUid,
                    firstName: profile.firstName || 'Utilisateur',
                    email:     profile.email,
                    username,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.details || data.error || 'Erreur inconnue');

            setExportDone(true);
            showSuccess(`Demande reçue ! Un email contenant un lien sécurisé de téléchargement à usage unique a été envoyé à ${profile.email}.`);

        } catch (err) {
            console.error('[Export]', err);
            showError(`Erreur lors de la demande d'export : ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Notification Channels */}
            <section>
                <SectionHeader
                    icon={BellRing}
                    title="Canaux de notification"
                    description="Choisissez comment vous souhaitez être notifié."
                />
                <div className="space-y-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <DisabledToggle icon={BellRing}    label="Notifications push"     description="Alertes en temps réel dans le navigateur" checked />
                    <DisabledToggle icon={Mail}        label="Notifications par email" description="Résumé quotidien et alertes critiques"     />
                    <DisabledToggle icon={MessageSquare} label="Notifications SMS"    description="Alertes urgentes par SMS"                  />
                    <DisabledToggle icon={Send}        label="Résumé d'activité"      description="Rapport hebdomadaire par email"             />
                </div>
            </section>

            <Divider />

            {/* Privacy */}
            <section>
                <SectionHeader
                    icon={Eye}
                    title="Confidentialité"
                    description="Contrôlez qui peut voir votre profil et vos données."
                />
                <div className="space-y-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <DisabledToggle icon={Eye}    label="Profil public"           description="Visible par tous les membres"       checked />
                    <DisabledToggle icon={EyeOff} label="Profil privé"            description="Visible uniquement par vous"               />
                    <DisabledToggle icon={Users}  label="Partage de données"      description="Améliore les recommandations"       checked />
                    <DisabledToggle icon={Users}  label="Utilisateurs bloqués"    description="Gérez votre liste de blocage"              />
                </div>
            </section>

            <Divider />

            {/* Data management */}
            <section>
                <SectionHeader
                    icon={Download}
                    title="Gestion des données"
                    description="Exportez ou supprimez vos données personnelles."
                />
                <div className="space-y-2">

                    {/* ── ACTIVE: Export button ─────────────────────── */}
                    <button
                        onClick={handleExportData}
                        disabled={exporting || exportDone}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center gap-2">
                            {exporting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : exportDone
                                ? <Check className="w-4 h-4 text-emerald-600" />
                                : <Download className="w-4 h-4" />
                            }
                            {exporting
                                ? 'Génération en cours…'
                                : exportDone
                                ? 'Export envoyé par email ✓'
                                : 'Exporter mes données personnelles'
                            }
                        </span>
                        {!exporting && !exportDone && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 uppercase tracking-wide">
                                PDF + Email
                            </span>
                        )}
                    </button>

                    {exporting && (
                        <p className="text-xs text-slate-500 px-1 leading-relaxed animate-pulse">
                            Génération de votre lien sécurisé temporaire et envoi de l'email en cours…
                        </p>
                    )}

                    <DisabledButton icon={Trash2} label="Supprimer définitivement mon compte" variant="danger" />
                </div>
            </section>

            <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                Les notifications et la suppression de compte seront disponibles prochainement.
            </div>
        </div>
    );
}

function AdvancedTab() {
    return (
        <div className="space-y-6">
            <section>
                <SectionHeader
                    icon={Code2}
                    title="Options développeur"
                    description="Fonctionnalités avancées réservées aux développeurs et aux utilisateurs expérimentés."
                />
                <div className="space-y-2">
                    <DisabledButton icon={KeyRound}     label="Gestion des clés API"                />
                    <DisabledButton icon={Webhook}      label="Configuration des webhooks"          />
                    <DisabledButton icon={Terminal}     label="Journal de console (Debug logs)"     />
                    <DisabledButton icon={FlaskConical} label="Fonctionnalités expérimentales"      />
                </div>
            </section>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                <Code2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">Section développeur</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                    Ces options avancées seront disponibles dans une prochaine mise à jour de la plateforme.
                </p>
                <DisabledBadge label="En développement" />
            </div>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SettingsModal({ isOpen, onClose, profile, resolvedUid }) {
    const [activeTab, setActiveTab] = useState('account');
    const overlayRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Click-outside to close
    const handleOverlayClick = useCallback((e) => {
        if (e.target === overlayRef.current) onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const TabContent = () => {
        switch (activeTab) {
            case 'account':       return <AccountTab profile={profile} resolvedUid={resolvedUid} onClose={onClose} />;
            case 'appearance':    return <AppearanceTab />;
            case 'notifications': return <NotificationsTab profile={profile} resolvedUid={resolvedUid} />;
            case 'advanced':      return <AdvancedTab />;
            default:              return null;
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Paramètres"
        >
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <UserCog className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Paramètres</h2>
                            <p className="text-xs text-slate-500">Gérez votre compte et vos préférences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Body ───────────────────────────────────────────── */}
                <div className="flex flex-1 min-h-0">

                    {/* Sidebar Navigation */}
                    <nav className="w-52 shrink-0 border-r border-slate-100 bg-slate-50/70 p-3 flex flex-col gap-0.5 overflow-y-auto">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const isDisabled = tab.id !== 'account';
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all group
                                        ${isActive
                                            ? 'bg-white text-primary shadow-sm border border-slate-200'
                                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="flex-1 leading-tight">{tab.label}</span>
                                    {isActive && <ChevronRight className="w-3 h-3 text-primary/60 shrink-0" />}
                                    {isDisabled && !isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content Area */}
                    <main className="flex-1 overflow-y-auto p-6">
                        <TabContent />
                    </main>
                </div>
            </div>
        </div>
    );
}
