'use client';

import { useState } from 'react';
import { db, ref, onValue } from '@/lib/firebase';
import { sendGlobalNotification, sendPrivateNotification, NOTIF_TYPES, NOTIF_PRIORITY } from '@/lib/notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Bell, Send, User, Loader2, Info, Link as LinkIcon, ExternalLink, MousePointer2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminNotifications({ users }) {
    const [globalForm, setGlobalForm] = useState({
        title: '',
        message: '',
        priority: NOTIF_PRIORITY.NORMAL,
        icon: 'bell',
        actionType: 'none',
        actionTarget: ''
    });
    const [privateForm, setPrivateForm] = useState({
        userId: '',
        title: '',
        message: '',
        priority: NOTIF_PRIORITY.NORMAL,
        icon: 'bell',
        actionType: 'none',
        actionTarget: ''
    });
    const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
    const [isSubmittingPrivate, setIsSubmittingPrivate] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = users.filter(u =>
        u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 5);

    const handleSendGlobal = async (e) => {
        e.preventDefault();
        if (!globalForm.title || !globalForm.message) return;
        setIsSubmittingGlobal(true);
        try {
            const action = globalForm.actionType !== 'none' ? {
                type: globalForm.actionType,
                target: globalForm.actionTarget
            } : null;

            await sendGlobalNotification({
                ...globalForm,
                action
            });
            setGlobalForm({
                title: '',
                message: '',
                priority: NOTIF_PRIORITY.NORMAL,
                icon: 'bell',
                actionType: 'none',
                actionTarget: ''
            });
            alert("Notification globale envoyée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'envoi.");
        } finally {
            setIsSubmittingGlobal(false);
        }
    };

    const handleSendPrivate = async (e) => {
        e.preventDefault();
        if (!privateForm.userId || !privateForm.title || !privateForm.message) {
            alert("Veuillez remplir tous les champs et sélectionner un utilisateur.");
            return;
        }
        setIsSubmittingPrivate(true);
        try {
            const action = privateForm.actionType !== 'none' ? {
                type: privateForm.actionType,
                target: privateForm.actionTarget
            } : null;

            await sendPrivateNotification(privateForm.userId, {
                type: NOTIF_TYPES.SYSTEM,
                ...privateForm,
                action
            });
            setPrivateForm({
                userId: '',
                title: '',
                message: '',
                priority: NOTIF_PRIORITY.NORMAL,
                icon: 'bell',
                actionType: 'none',
                actionTarget: ''
            });
            setUserSearch('');
            alert("Notification privée envoyée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'envoi.");
        } finally {
            setIsSubmittingPrivate(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">Envoyez des messages directs ou des alertes globales aux étudiants.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Notification Form */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="bg-primary/5 rounded-t-3xl">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Notification Globale</CardTitle>
                        </div>
                        <CardDescription>Sera reçue par TOUS les utilisateurs connectés.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <form onSubmit={handleSendGlobal} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
                                <Input
                                    placeholder="Ex: Maintenance prévue"
                                    value={globalForm.title}
                                    onChange={(e) => setGlobalForm({ ...globalForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Détails de la notification..."
                                    value={globalForm.message}
                                    onChange={(e) => setGlobalForm({ ...globalForm, message: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priorité</label>
                                    <Select
                                        value={globalForm.priority}
                                        onValueChange={(val) => setGlobalForm({ ...globalForm, priority: val })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NOTIF_PRIORITY.LOW}>Faible</SelectItem>
                                            <SelectItem value={NOTIF_PRIORITY.NORMAL}>Normale</SelectItem>
                                            <SelectItem value={NOTIF_PRIORITY.HIGH}>Haute</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Icône</label>
                                    <Select
                                        value={globalForm.icon}
                                        onValueChange={(val) => setGlobalForm({ ...globalForm, icon: val })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bell">Cloche</SelectItem>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="alert-triangle">Alerte</SelectItem>
                                            <SelectItem value="megaphone">Mégaphone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <MousePointer2 className="w-3 h-3" /> Action
                                    </label>
                                    <Select
                                        value={globalForm.actionType}
                                        onValueChange={(val) => setGlobalForm({ ...globalForm, actionType: val })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucune</SelectItem>
                                            <SelectItem value="navigate">Navigation Interne</SelectItem>
                                            <SelectItem value="external_link">Lien Externe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {globalForm.actionType !== 'none' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" /> Cible / URL
                                        </label>
                                        <Input
                                            placeholder={globalForm.actionType === 'navigate' ? "/profile" : "https://..."}
                                            value={globalForm.actionTarget}
                                            onChange={(e) => setGlobalForm({ ...globalForm, actionTarget: e.target.value })}
                                            required
                                        />

                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Utilisez <code className="bg-slate-100 px-1 rounded">{"{uid}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{email}"}</code> pour des liens dynamiques.
                                        </p>
                                    </div>
                                )}
                            </div>


                            <Button type="submit" className="w-full gap-2 rounded-xl" disabled={isSubmittingGlobal}>
                                {isSubmittingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Envoyer à tout le monde
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Private Notification Form */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="bg-slate-50 rounded-t-3xl">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-slate-600" />
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Notification Spécifique</CardTitle>
                        </div>
                        <CardDescription>Envoyer un message à un étudiant particulier.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <form onSubmit={handleSendPrivate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destinataire</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Chercher un utilisateur (nom, email...)"
                                        className="pl-10 rounded-xl"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                                {userSearch && filteredUsers.length > 0 && (
                                    <div className="mt-2 border rounded-xl overflow-hidden bg-white shadow-lg absolute z-10 w-[calc(100%-3rem)]">
                                        {filteredUsers.map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                className={`w-full text-left p-3 text-sm hover:bg-slate-50 flex items-center justify-between ${privateForm.userId === u.id ? 'bg-primary/5' : ''}`}
                                                onClick={() => {
                                                    setPrivateForm({ ...privateForm, userId: u.id });
                                                    setUserSearch(`${u.firstName} ${u.lastName}`);
                                                }}
                                            >
                                                <span>{u.firstName} {u.lastName} <span className="text-xs text-muted-foreground">({u.email})</span></span>
                                                {privateForm.userId === u.id && <Badge className="bg-primary text-[8px]">Sélectionné</Badge>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
                                <Input
                                    placeholder="Ex: Document manquant"
                                    value={privateForm.title}
                                    onChange={(e) => setPrivateForm({ ...privateForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Votre message privé..."
                                    value={privateForm.message}
                                    onChange={(e) => setPrivateForm({ ...privateForm, message: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <MousePointer2 className="w-3 h-3" /> Action
                                    </label>
                                    <Select
                                        value={privateForm.actionType}
                                        onValueChange={(val) => setPrivateForm({ ...privateForm, actionType: val })}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucune</SelectItem>
                                            <SelectItem value="navigate">Navigation Interne</SelectItem>
                                            <SelectItem value="external_link">Lien Externe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {privateForm.actionType !== 'none' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" /> Cible / URL
                                        </label>
                                        <Input
                                            placeholder={privateForm.actionType === 'navigate' ? "/ads-portal" : "https://..."}
                                            value={privateForm.actionTarget}
                                            onChange={(e) => setPrivateForm({ ...privateForm, actionTarget: e.target.value })}
                                            required
                                        />

                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Placeholders: <code className="bg-slate-100 px-1 rounded">{"{uid}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{email}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{firstName}"}</code>
                                        </p>
                                    </div>
                                )}
                            </div>


                            <Button type="submit" className="w-full gap-2 rounded-xl" variant="outline" disabled={isSubmittingPrivate}>
                                {isSubmittingPrivate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Envoyer la notification
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                    <Info className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">Conseil de modération</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Les notifications globales doivent être utilisées avec parcimonie pour ne pas saturer l'espace de l'étudiant.
                        Privilégiez les notifications privées pour les retours sur les ressources ou les annonces publicitaires.
                    </p>
                </div>
            </div>
        </div>
    );
}
