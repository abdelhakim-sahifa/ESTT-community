'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mail, Search, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import {
    welcomeEmail,
    verifyEmailTemplate,
    rewardClaimedEmail,
    ticketConfirmationEmail,
    ticketValidatedEmail,
    ticketRejectedEmail,
    clubRequestApprovedEmail,
    clubRequestRejectedEmail,
    resourceReceivedEmail,
    resourceApprovedEmail,
    resourceRejectedEmail,
    resourceUpdatedEmail,
    resourceContactRequestEmail,
    resourceContactReplyEmail,
    formSubmissionReceivedEmail,
    adminNotificationEmail,
    adInvoiceEmail,
    reportDismissedEmail,
    reportDeletedEmail,
    bugResolvedEmail,
    membershipAcceptedEmail,
    eventReminderEmail,
    clubAnnouncementEmail,
    dataExportEmail,
} from '@/lib/email-templates';
import { globalAnnouncementEmail } from '@/lib/email-templates/global-announcement';

const ICON_URL = 'https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/ressources/icon-512x512-maskable.png';
const CAMPUS_URL = 'https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/ressources/ESTT-1.jpg';

const MOCK = {
    user: { firstName: 'Yasmine', lastName: 'Bennani', fullName: 'Yasmine Bennani', email: 'yasmine.bennani@estt.ma' },
    club: { name: 'Club Robotique', logo: ICON_URL, themeColor: '#ef4444' },
    event: {
        title: 'Hackathon IoT 2026',
        date: '20 octobre 2026',
        time: '14h00',
        location: 'Amphithéâtre A1, EST Tétouan',
        description: 'Venez innover en équipe pendant 24h autour de l\'Internet des Objets. Ordinateur, bonne humeur et café seront fournis !',
        imageUrl: CAMPUS_URL,
    },
    ticket: {
        id: 'TKT-2026-00132',
        eventDate: '20 octobre 2026',
        eventTime: '14h00',
        eventLocation: 'Amphithéâtre A1, EST Tétouan',
        firstName: 'Yasmine',
        lastName: 'Bennani',
    },
};

function EmailPreview({ html }) {
    const ref = useRef(null);
    const [height, setHeight] = useState(360);

    const handleLoad = () => {
        try {
            const doc = ref.current?.contentWindow?.document;
            const scrollHeight = doc?.body?.scrollHeight;
            if (scrollHeight) {
                setHeight(scrollHeight + 16);
            }
        } catch (e) {
            // ignore cross-origin / rendering edge cases
        }
    };

    return (
        <div className="rounded-lg border bg-slate-100 p-2">
            <iframe
                ref={ref}
                title="Email preview"
                srcDoc={html}
                onLoad={handleLoad}
                className="w-full rounded-md border-none bg-white"
                style={{ height, minHeight: 320 }}
            />
        </div>
    );
}

function CopyButton({ html }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(html);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {
            // clipboard not available
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                copy();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié !' : 'Copier le HTML'}
        </button>
    );
}

export default function EmailTemplatesPage() {
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const templates = useMemo(() => {
        return [
            {
                id: 'welcome',
                name: 'Bienvenue',
                subject: 'Bienvenue sur ESTT Community 🎉',
                category: 'Compte',
                description: 'Envoyé à la création d\'un nouveau compte.',
                html: welcomeEmail(MOCK.user.firstName),
            },
            {
                id: 'verify-email',
                name: 'Vérification d\'email',
                subject: 'Vérifiez votre adresse email',
                category: 'Compte',
                description: 'Envoyé avec le code de vérification à 6 chiffres.',
                html: verifyEmailTemplate(MOCK.user.firstName, '8 4 2 7 6 1'),
            },
            {
                id: 'data-export',
                name: 'Export de données',
                subject: '📦 Votre export de données est prêt',
                category: 'Compte',
                description: 'Lien à usage unique pour télécharger ses données.',
                html: dataExportEmail({
                    firstName: MOCK.user.firstName,
                    email: MOCK.user.email,
                    downloadUrl: 'https://estt.ma/download-export/Xk9f2Zj',
                    exportDate: '12 septembre 2026',
                    screenshotUrl: CAMPUS_URL,
                }),
            },
            {
                id: 'reward-claimed',
                name: 'Récompense débloquée',
                subject: 'Félicitations ! Vous avez débloqué ESTTPlus+ 🎉',
                category: 'Récompenses',
                description: 'Badge VIP activé après réclamation d\'une récompense.',
                html: rewardClaimedEmail({ isGuest: false, rewardType: 'plus_12month', email: MOCK.user.email }),
            },
            {
                id: 'ticket-confirmation',
                name: 'Confirmation de billet',
                subject: 'Confirmation de votre billet',
                category: 'Billets',
                description: 'Billet numérique avec QR code en attente de validation.',
                html: ticketConfirmationEmail(MOCK.ticket, MOCK.event.title, MOCK.club.name),
            },
            {
                id: 'ticket-validated',
                name: 'Billet validé',
                subject: 'Billet Validé !',
                category: 'Billets',
                description: 'Le billet a été approuvé par le club organisateur.',
                html: ticketValidatedEmail(MOCK.ticket, MOCK.event.title, MOCK.club.name),
            },
            {
                id: 'ticket-rejected',
                name: 'Billet refusé',
                subject: 'Mise à jour sur votre billet',
                category: 'Billets',
                description: 'Le billet ne peut pas être validé, avec la raison du refus.',
                html: ticketRejectedEmail(MOCK.ticket, MOCK.event.title, MOCK.club.name, 'Le nombre de places est limité et la liste d\'attente est déjà complète.'),
            },
            {
                id: 'club-request-approved',
                name: 'Club approuvé',
                subject: 'Félicitations ! Votre club est approuvé.',
                category: 'Clubs',
                description: 'Demande de création de club acceptée par l\'administration.',
                html: clubRequestApprovedEmail(MOCK.club.name, MOCK.club.logo, 'club-robotique'),
            },
            {
                id: 'club-request-rejected',
                name: 'Club refusé',
                subject: 'Mise à jour concernant votre demande',
                category: 'Clubs',
                description: 'Demande de création de club refusée, avec la raison.',
                html: clubRequestRejectedEmail(MOCK.club.name, 'Le dossier soumis est incomplet (chef de projet manquant).'),
            },
            {
                id: 'membership-accepted',
                name: 'Adhésion acceptée',
                subject: 'Félicitations, Yasmine !',
                category: 'Clubs',
                description: 'Adhésion au club validée + lien vers le certificat.',
                html: membershipAcceptedEmail(MOCK.user.fullName, MOCK.club.name, 'https://estt.ma/clubs/club-robotique/certificate/MBR-8842'),
            },
            {
                id: 'event-reminder',
                name: 'Rappel d\'événement',
                subject: 'Rappel : Hackathon IoT 2026 📅',
                category: 'Clubs',
                description: 'Rappel envoyé aux inscrits avant l\'événement.',
                html: eventReminderEmail(MOCK.event, MOCK.club, MOCK.ticket.id),
            },
            {
                id: 'club-announcement',
                name: 'Annonce de club',
                subject: 'Assemblée Générale d\'Automne — Club Robotique',
                category: 'Clubs',
                description: 'Communication d\'un club à ses membres, thème personnalisable.',
                html: clubAnnouncementEmail(
                    'Assemblée Générale d\'Automne',
                    'Chers membres,\nNous organisons notre assemblée générale le jeudi 24 septembre à 18h en salle B12.\nAu programme : bilan de l\'année, élection du nouveau bureau et projection du robot Sumo.\nVotre présence compte !',
                    MOCK.club.name,
                    'Confirmer ma présence',
                    'https://estt.ma/forms/ag-automne',
                    MOCK.club.logo,
                    MOCK.club.themeColor,
                    CAMPUS_URL
                ),
            },
            {
                id: 'resource-received',
                name: 'Contribution reçue',
                subject: 'Contribution reçue !',
                category: 'Ressources',
                description: 'Confirmation d\'envoi d\'une ressource en attente de modération.',
                html: resourceReceivedEmail(MOCK.user.fullName, 'Cours de Physique 2 — Circuits RLC'),
            },
            {
                id: 'resource-approved',
                name: 'Ressource en ligne',
                subject: 'Ta ressource est en ligne !',
                category: 'Ressources',
                description: 'La ressource a été validée et publiée.',
                html: resourceApprovedEmail(MOCK.user.fullName, 'Cours de Physique 2 — Circuits RLC', 'https://estt.ma/resources/physique-circuits-rlc'),
            },
            {
                id: 'resource-rejected',
                name: 'Ressource refusée',
                subject: 'Mise à jour sur ta contribution',
                category: 'Ressources',
                description: 'La ressource n\'a pas été validée, avec la raison.',
                html: resourceRejectedEmail(MOCK.user.fullName, 'Cours de Physique 2 — Circuits RLC', 'Le fichier joint est illisible (pages blanches).'),
            },
            {
                id: 'resource-updated',
                name: 'Ressource mise à jour',
                subject: 'Ta ressource a été mise à jour',
                category: 'Ressources',
                description: 'Un admin a modifié la ressource (liste des changements).',
                html: resourceUpdatedEmail(
                    MOCK.user.fullName,
                    'Cours de Physique 2 — Circuits RLC',
                    'https://estt.ma/resources/physique-circuits-rlc',
                    [
                        { label: 'Filière', old: 'GI', new: 'GI + GEM' },
                        { label: 'Semestre', old: 'S4', new: 'S4 / S5' },
                    ]
                ),
            },
            {
                id: 'resource-contact-request',
                name: 'Question admin (ressource)',
                subject: 'Question concernant ta ressource',
                category: 'Ressources',
                description: 'Un admin demande une précision à propos d\'une ressource.',
                html: resourceContactRequestEmail(
                    MOCK.user.fullName,
                    'Cours de Physique 2 — Circuits RLC',
                    'Bonjour Yasmine, peux-tu préciser la source de ce document (manuel de référence) ? Merci !',
                    'https://estt.ma/resource-contact/RC-204',
                    'En attente de validation'
                ),
            },
            {
                id: 'resource-contact-reply',
                name: 'Réponse du contributeur',
                subject: 'Nouvelle réponse sur une ressource',
                category: 'Ressources',
                description: 'Notifie le contact du contributeur de la réponse reçue.',
                html: resourceContactReplyEmail('Cours de Physique 2 — Circuits RLC', MOCK.user.fullName, 'Le document vient du manuel "Physique, Hachette".', 'https://estt.ma/resource-contact/RC-204'),
            },
            {
                id: 'form-submission',
                name: 'Formulaire reçu',
                subject: 'Réponse enregistrée',
                category: 'Ressources',
                description: 'Confirmation de réception d\'une réponse à un formulaire.',
                html: formSubmissionReceivedEmail('Inscription Hackathon IoT 2026', MOCK.club.name),
            },
            {
                id: 'admin-notification',
                name: 'Notification admin',
                subject: 'Action requise : Validation de ressource',
                category: 'Administration',
                description: 'Envoie alerte aux admins pour une action à effectuer.',
                html: adminNotificationEmail('Admin ESTT', 'Validation de ressource', 'Une nouvelle ressource "Cours de Physique 2" est en attente de validation.', 'https://estt.ma/admin'),
            },
            {
                id: 'report-dismissed',
                name: 'Signalement rejeté',
                subject: 'Mise à jour de votre signalement',
                category: 'Administration',
                description: 'Le contenu signalé a été jugé conforme.',
                html: reportDismissedEmail(MOCK.user.fullName, 'TD Algorithmique — Solution complète'),
            },
            {
                id: 'report-deleted',
                name: 'Signalement traité',
                subject: 'Action suite à votre signalement',
                category: 'Administration',
                description: 'Le contenu signalé a été supprimé.',
                html: reportDeletedEmail(MOCK.user.fullName, 'Examens de Programmation — Corrections'),
            },
            {
                id: 'bug-resolved',
                name: 'Bug résolu',
                subject: 'Bug résolu ! 🚀',
                category: 'Administration',
                description: 'Notifie l\'utilisateur que son bug a été corrigé.',
                html: bugResolvedEmail(MOCK.user.fullName, 'Le bouton de téléchargement ne répond pas', 'BUG-4821'),
            },
            {
                id: 'ad-invoice',
                name: 'Facture publicité',
                subject: 'Confirmation & Facture',
                category: 'Publicité',
                description: 'Facture envoyée après achat d\'une campagne publicitaire.',
                html: adInvoiceEmail('Campagne Rentrée — Semaine 1', 250, 'INV-2026-0241'),
            },
            {
                id: 'global-announcement',
                name: 'Annonce globale',
                subject: 'ESTTPlus+ arrive bientôt !',
                category: 'Annonces',
                description: 'Communication envoyée à toute la communauté.',
                html: globalAnnouncementEmail(
                    'ESTTPlus+ arrive bientôt ! 🚀',
                    'Salut à tous,\nNous préparons une grosse mise à jour pour la rentrée.\nESTTPlus+ débloque des fonctionnalités exclusives pour les membres engagés.\nRestez connectés !',
                    'En savoir plus',
                    'https://estt.ma/docs',
                    CAMPUS_URL
                ),
            },
        ];
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter((t) =>
            `${t.name} ${t.category} ${t.subject}`.toLowerCase().includes(q)
        );
    }, [templates, query]);

    const categories = useMemo(() => [...new Set(templates.map((t) => t.category))], [templates]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-7xl px-4 py-10 lg:px-8">
                <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {templates.length} templates
                        </div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Templates d&apos;emails
                        </h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            Aperçu de tous les emails transactionnels de la plateforme, rendus avec des
                            données de démonstration. Cliquez sur &quot;Copier le HTML&quot; pour récupérer le code source d&apos;un template.
                        </p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher un template..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                            {cat}
                        </Badge>
                    ))}
                </div>

                {!mounted ? (
                    <p className="text-muted-foreground">Chargement des aperçus...</p>
                ) : filtered.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                        Aucun template ne correspond à « {query} ».
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((t) => (
                            <Card
                                key={t.id}
                                onClick={() => setActive(t)}
                                className="flex cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActive(t);
                                    }
                                }}
                                role="button"
                                aria-label={`Ouvrir le template ${t.name}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <Badge variant="secondary" className="shrink-0 font-normal">
                                            {t.category}
                                        </Badge>
                                        <CopyButton html={t.html} />
                                    </div>
                                    <CardTitle className="text-xl">{t.name}</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        {t.subject}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                                    <EmailPreview html={t.html} />
                                    <p className="text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
                <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-4xl">
                    {active && (
                        <>
                            <DialogHeader className="border-b px-6 py-4 text-left">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <Badge variant="secondary" className="font-normal">
                                        {active.category}
                                    </Badge>
                                    <CopyButton html={active.html} />
                                </div>
                                <DialogTitle className="text-xl">{active.name}</DialogTitle>
                                <DialogDescription>{active.subject}</DialogDescription>
                            </DialogHeader>
                            <div className="overflow-y-auto p-6">
                                <EmailPreview html={active.html} />
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}