'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Code,
    CreditCard,
    FileUp,
    Github,
    HelpCircle,
    MessageSquare,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Users,
    UserCheck,
    ArrowRight,
} from 'lucide-react';

const gettingStarted = [
    {
        step: '01',
        title: 'Créer votre compte étudiant',
        body: 'Inscrivez-vous avec votre adresse académique universidat (@uae.ac.ma), complétez votre profil avec votre filière et année d étude.',
    },
    {
        step: '02',
        title: 'Explorer votre espace de formation',
        body: 'Accédez instantanément aux cours, TD, examens corrigés et annonces de votre filière grâce au système de filtrage dynamique.',
    },
    {
        step: '03',
        title: 'S impliquer dans la communauté',
        body: 'Contribuez des documents académiques, suivez vos clubs favoris, obtenez des tickets pour les événements et chattez en temps réel.',
    },
];

const sections = [
    {
        id: 'resources',
        icon: BookOpen,
        title: 'Bibliothèque Académique Unifiée',
        description: 'Espace centralisé regroupant l ensemble des supports de cours, TD, TP, examens et références classés par filière, semestre et module.',
        points: [
            'Recherche intelligente multi-critères (/browse et /search) par mots-clés et types de documents.',
            'Aperçu sécurisé des documents PDF et intégration fluide avec le stockage cloud.',
            'Système d évaluation par les pairs et affichage des avis d étudiants.',
            'Accès direct aux dernières mises à jour de contenu par département.',
        ],
        ctaHref: '/browse',
        ctaLabel: 'Ouvrir les ressources',
        tone: 'blue',
    },
    {
        id: 'contribute',
        icon: FileUp,
        title: 'Workflow de Contribution Collaboratif',
        description: 'Permet à chaque étudiant de soumettre des fichiers (PDF, images, liens) pour alimenter la base de connaissances.',
        points: [
            'Upload direct vers Google Drive via l API intégrée à la plateforme.',
            'Catégorisation automatique par filière, semestre et module équivalent.',
            'Système de modération pré-publication garantissant la qualité des ressources.',
            'Attribution des points de contribution et valorisation du statut de mentor.',
        ],
        ctaHref: '/contribute',
        ctaLabel: 'Contribuer une ressource',
        tone: 'emerald',
    },
    {
        id: 'clubs',
        icon: Users,
        title: 'Gestion des Clubs & Vie Associative',
        description: 'Espace dédié aux associations et clubs étudiants de l EST Tétouan avec gestion autonome et mise en valeur des activités.',
        points: [
            'Annuaire complet des clubs vérifiés avec pages dédiées (/clubs).',
            'Flux d actualités, publications et formulaires de recrutement d adhérents.',
            'Interface d administration spécifique pour chaque bureau de club.',
            'Soumission de demandes de création de nouveaux clubs (/clubs/request).',
        ],
        ctaHref: '/clubs',
        ctaLabel: 'Explorer les clubs',
        tone: 'violet',
    },
    {
        id: 'events',
        icon: CalendarDays,
        title: 'Événements & Billetterie Électronique',
        description: 'Calendrier centralisé des activités avec système de réservation de billets et contrôle d accès.',
        points: [
            'Affichage par vue Liste, Semaine et Mois avec filtres par club organisateur.',
            'Intégration du paiement en ligne sécurisé via Stripe pour les événements payants.',
            'Génération instantanée de billets électroniques munis de QR Codes uniques.',
            'Application de validation et scan QR pour les organisateurs le jour de l événement.',
        ],
        ctaHref: '/events',
        ctaLabel: 'Consulter les événements',
        tone: 'amber',
    },
    {
        id: 'chat',
        icon: MessageSquare,
        title: 'Messagerie & Communication Temps Réel',
        description: 'Canaux de discussion instantanée synchronisés par filière et niveau d étude.',
        points: [
            'Moteur temps réel propulsé par Firebase Realtime Database.',
            'Segmentation automatique par promotion et spécialité académique.',
            'Envoi de messages texte, fils de discussion et réactions rapides.',
            'Messagerie privée et canal d entraide directe entre étudiants.',
        ],
        ctaHref: '/chat',
        ctaLabel: 'Ouvrir le chat',
        tone: 'indigo',
    },
    {
        id: 'notifications',
        icon: Bell,
        title: 'Centre de Notifications Intelligentes',
        description: 'Système d alerte en temps réel pour ne manquer aucune mise à jour critique du campus.',
        points: [
            'Notifications personnalisées (validation de contribution, rappels d événements, billetterie).',
            'Annonces globales officielles de la direction de l établissement et des clubs.',
            'Gestion des statuts lus / non lus et redirection directe vers l action concernée.',
        ],
        ctaHref: '/notifications',
        ctaLabel: 'Voir mes notifications',
        tone: 'slate',
    },
    {
        id: 'ads',
        icon: Sparkles,
        title: 'Portail Publicitaire Étudiant',
        description: 'Plateforme de diffusion d annonces pour les événements, projets et initiatives de la communauté.',
        points: [
            'Interface de soumission d annonces et bannières promotionnelles (/ads-portal).',
            'Workflow de validation administrative et programmation des campagnes.',
            'Tableau de bord d analyse de la portée et des impressions.',
        ],
        ctaHref: '/ads-portal',
        ctaLabel: 'Découvrir le portail pub',
        tone: 'fuchsia',
    },
    {
        id: 'mobile',
        icon: Smartphone,
        title: 'Expérience Mobile PWA & Application',
        description: 'Site web totalement responsive utilisable comme une application mobile native.',
        points: [
            'Prise en charge du format Progressive Web App (PWA) pour installation en 1 clic.',
            'Interface réactive optimisée pour smartphones et tablettes.',
            'Page de téléchargement dédiée (/download) et support Android.',
        ],
        ctaHref: '/download',
        ctaLabel: 'Installer l application',
        tone: 'teal',
    },
    {
        id: 'admin',
        icon: ShieldCheck,
        title: 'Back-Office Administration & Modération',
        description: 'Interface de contrôle et de pilotage globale pour l équipe administrative et technique.',
        points: [
            'Modération rapide des contributions académiques et des signalements.',
            'Gestion des rôles (Étudiant, Modérateur, Admin, Responsable de club).',
            'Suivi des métriques clés de la plateforme et gestion des bugs.',
        ],
        ctaHref: '/admin',
        ctaLabel: 'Accéder à l administration',
        tone: 'orange',
    },
];

const techStack = [
    { name: 'Next.js 14', category: 'Framework Frontend', desc: 'App Router, Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR)' },
    { name: 'React 18 & TypeScript', category: 'Langage & UI', desc: 'Composants typés, robustesse du code et maintenabilité accrue' },
    { name: 'Tailwind CSS & Shadcn UI', category: 'Design System', desc: 'Interface moderne, responsive, animations fluides et thématisation' },
    { name: 'Supabase PostgreSQL', category: 'Base de données principale', desc: 'Authentification, données structurées et requêtes relationnelles' },
    { name: 'Firebase Realtime DB', category: 'Flux Temps Réel', desc: 'Gestion des messages de chat en direct et des notifications push' },
    { name: 'Vercel Edge Network', category: 'Hébergement & Cloud', desc: 'Déploiement global continu, CDN mondial et temps de réponse ultrarapides' },
];

const faq = [
    {
        q: 'Qu est-ce que la plateforme ESTT Community ?',
        a: 'ESTT Community est une plateforme web interactive et collaborative conçue spécifiquement pour les étudiants de l École Supérieure de Technologie de Tétouan (ESTT). Elle centralise les ressources académiques, la vie associative des clubs, la billetterie des événements et la communication.',
    },
    {
        q: 'Comment créer un compte pour tester la plateforme ?',
        a: 'Vous pouvez utiliser l adresse e-mail de test tester@etu.uae.ac.ma lors de votre inscription. Aucune vérification d e-mail n est requise.',
    },
    {
        q: 'Comment un étudiant peut-il publier un cours ou un examen ?',
        a: 'Il suffit de se rendre sur la page /contribute, de sélectionner la filière, le semestre et le module concerné, puis de téléverser le document. La contribution est vérifiée par les modérateurs avant publication.',
    },
    {
        q: 'Comment fonctionne la billetterie des événements ?',
        a: 'Les étudiants peuvent réserver leur billet sur la page de l événement. Pour les activités payantes, le règlement s effectue de manière sécurisée (Stripe). Un billet électronique avec QR Code est généré et contrôlé le jour J via l outil de scan.',
    },
    {
        q: 'Le code source est-il disponible ?',
        a: 'Oui, le projet est développé dans une démarche Open Source. Le code source complet et la documentation technique sont hébergés sur GitHub.',
    },
];

const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    fuchsia: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
};

export default function GuidePage() {
    return (
        <main className="min-h-screen bg-slate-50/60 pb-20 pt-8">
            <section className="container px-4 py-6 md:px-6">
                {/* Test Account Statement Card */}
                <Card className="mb-10 border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shadow-md overflow-hidden">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-blue-600 p-3 text-white shrink-0 shadow-sm">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <Badge className="bg-blue-600 text-white border-none mb-2">Compte de Test Évaluateurs</Badge>
                                <h2 className="text-xl font-bold text-slate-900">Accès Instantané pour Test & Évaluation</h2>
                                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                                    Vous pouvez créer un compte directement avec l e-mail{' '}
                                    <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-blue-800 font-bold">
                                        tester@etu.uae.ac.ma
                                    </code>{' '}
                                    sans aucune vérification par e-mail requise.
                                </p>
                            </div>
                        </div>
                        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0 shadow-md">
                            <Link href="/signup">
                                Créer un compte
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Comment démarrer sur la plateforme */}
                <div className="mb-8">
                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 mb-2">
                        Prise en main
                    </Badge>
                    <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Comment démarrer sur la plateforme</h1>
                    <p className="mt-2 text-sm text-slate-600 md:text-base">Parcours simple en 3 étapes pour tout étudiant de l ESTT.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {gettingStarted.map((item) => (
                        <Card key={item.step} className="border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 font-black text-4xl text-slate-100 pointer-events-none select-none">
                                {item.step}
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Detailed Features Section */}
            <section id="features" className="container px-4 py-12 md:px-6">
                <div className="mb-8">
                    <Badge className="border-purple-200 bg-purple-100 text-purple-800 hover:bg-purple-100 mb-2">
                        Panorama Complet
                    </Badge>
                    <h2 className="text-3xl font-black text-slate-900">Fonctionnalités en Détail</h2>
                    <p className="mt-2 max-w-3xl text-slate-600 text-sm md:text-base">
                        Description exhaustive des modules applicatifs développés pour répondre aux besoins académiques et à la vie étudiante.
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Card key={section.id} className="overflow-hidden border-slate-200 shadow-sm">
                                <CardHeader className="border-b bg-white p-6">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="flex gap-4">
                                            <div className={`h-fit rounded-2xl border p-3.5 shrink-0 ${toneClasses[section.tone]}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-slate-900">{section.title}</CardTitle>
                                                <CardDescription className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
                                                    {section.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="md:pt-1 shrink-0">
                                            <Button asChild variant="outline" size="sm" className="gap-2">
                                                <Link href={section.ctaHref}>
                                                    {section.ctaLabel}
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="bg-slate-50/60 p-6">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {section.points.map((point) => (
                                            <div key={point} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-xs">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Technical Architecture & Stack */}
            <section className="container px-4 py-12 md:px-6">
                <Card className="border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                            <div>
                                <Badge className="border-blue-400/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/20 mb-3">
                                    <Code className="mr-2 h-3.5 w-3.5" />
                                    Architecture Technique
                                </Badge>
                                <h2 className="text-3xl font-black text-white">Stack Technologique Moderne</h2>
                                <p className="mt-2 text-slate-300 text-sm max-w-2xl">
                                    Conçu selon les meilleurs standards du web moderne pour garantir haute performance (SSR/ISR), sécurité des données et expérience utilisateur réactive.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2 shrink-0">
                                <a href="https://github.com/abdelhakim-sahifa/ESTT-community/" target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4" />
                                    Consulter le Dépôt GitHub
                                </a>
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {techStack.map((tech) => (
                                <div key={tech.name} className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-5 backdrop-blur-sm">
                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{tech.category}</span>
                                    <h3 className="text-lg font-bold text-white mt-1">{tech.name}</h3>
                                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{tech.desc}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Note & FAQ */}
            <section className="container px-4 py-12 md:px-6">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-200 p-3 text-slate-700">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Foire Aux Questions (FAQ)</h2>
                        <p className="text-sm text-slate-500">Réponses aux questions courantes sur le fonctionnement de la plateforme.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {faq.map((item) => (
                        <Card key={item.q} className="border-slate-200 shadow-sm">
                            <CardContent className="p-6">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                                    {item.q}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Final Banner */}
            <section className="container px-4 pb-6 md:px-6">
                <Card className="overflow-hidden border-none bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl">
                    <CardContent className="p-8 text-center md:p-12">
                        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Prêt à Explorer ESTT Community ?</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">
                            Accédez dès maintenant aux cours, aux événements des clubs et rejoignez la communauté en ligne de l EST Tétouan.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Button asChild size="lg" variant="secondary" className="font-bold text-blue-900 bg-white hover:bg-slate-100">
                                <Link href="/browse">Explorer les Ressources</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                                <Link href="/clubs">Découvrir les Clubs</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                                <Link href="/events">Voir les Événements</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
