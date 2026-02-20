/**
 * Centralized metadata configuration for consistent SEO across the site
 * This file ensures all pages have proper title, description, and OG tags
 */

const siteUrl = 'https://estt-community.vercel.app';
const siteName = 'EST Tétouan Community';
const siteTitle = 'EST Tétouan - Ressources Étudiants';
const siteDescription = 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'École Supérieure de Technologie de Tétouan. Accédez à des cours, TD, exercices et vidéos pour toutes les filières : IA, Cybersécurité, Industrie Navale, et Développement Digital.';

export const defaultMetadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: siteTitle,
        template: '%s | EST Tétouan',
    },
    description: siteDescription,
    keywords: ['EST Tétouan', 'ressources étudiants', 'cours', 'TD', 'exercices', 'Intelligence Artificielle', 'Cybersécurité', 'CASI', 'INSEM', 'IDD', 'université', 'Maroc'],
    authors: [{ name: 'EST Tétouan Community' }],
    creator: 'EST Tétouan Community',
    publisher: 'EST Tétouan',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    other: {
        'google-adsense-account': 'ca-pub-8145062068015821',
    },
};

export const getMetadata = (pageTitle, pageDescription, imageUrl = '/favicon.ico', url = siteUrl) => {
    return {
        title: pageTitle,
        description: pageDescription,
        openGraph: {
            type: 'website',
            locale: 'fr_FR',
            url: url,
            siteName: siteName,
            title: pageTitle,
            description: pageDescription,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: siteName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDescription,
            images: [imageUrl],
        },
    };
};

/**
 * Metadata for specific pages
 */
export const pageMetadata = {
    browse: {
        title: 'Parcourir les ressources - EST Tétouan',
        description: 'Parcourez et découvrez les ressources académiques partagées par les étudiants de l\'EST Tétouan. Filtrez par filière et semestre.',
    },
    jobs: {
        title: 'Emplois et Offres - EST Tétouan',
        description: 'Découvrez les offres d\'emploi et d\'alternance pour les étudiants et diplômés de l\'EST Tétouan.',
    },
    docs: {
        title: 'Documentation - EST Tétouan',
        description: 'Documentation complète et guide d\'utilisation de la plateforme EST Tétouan Community.',
    },
    contribute: {
        title: 'Contribuer aux ressources - EST Tétouan',
        description: 'Partagez vos ressources académiques avec la communauté des étudiants de l\'EST Tétouan.',
    },
    profile: {
        title: 'Profil utilisateur - EST Tétouan',
        description: 'Gérez votre profil et vos contributions sur EST Tétouan Community.',
    },
    login: {
        title: 'Connexion - EST Tétouan',
        description: 'Connectez-vous à votre compte EST Tétouan Community pour accéder à tous les services.',
    },
    signup: {
        title: 'Inscription - EST Tétouan',
        description: 'Créez un compte sur EST Tétouan Community en utilisant votre adresse email universitaire.',
    },
    chat: {
        title: 'Chat et Messagerie - EST Tétouan',
        description: 'Communiquez avec d\'autres étudiants de l\'EST Tétouan en temps réel.',
    },
    clubs: {
        title: 'Clubs et Associations - EST Tétouan',
        description: 'Explorez les clubs et associations étudiantes de l\'EST Tétouan.',
    },
    notifications: {
        title: 'Notifications - EST Tétouan',
        description: 'Gérez vos notifications et restez informé des dernières activités sur EST Tétouan.',
    },
    privacy: {
        title: 'Politique de confidentialité - EST Tétouan',
        description: 'Consultez notre politique de confidentialité et apprenez comment nous protégeons vos données.',
    },
    terms: {
        title: 'Conditions d\'utilisation - EST Tétouan',
        description: 'Consultez les conditions d\'utilisation de la plateforme EST Tétouan Community.',
    },
};
