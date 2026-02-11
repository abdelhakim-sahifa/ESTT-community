import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const canela = localFont({
    src: '../public/fonts/Canela-Medium.woff2', // Assuming this path, verified in globals.css
    variable: '--font-canela',
});

export const metadata = {
    metadataBase: new URL('https://estt-community.vercel.app'),
    title: {
        default: 'EST Tétouan - Ressources Étudiants',
        template: '%s | EST Tétouan',
    },
    description: 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'École Supérieure de Technologie de Tétouan. Accédez à des cours, TD, exercices et vidéos pour toutes les filières : IA, Cybersécurité, Industrie Navale, et Développement Digital.',
    keywords: ['EST Tétouan', 'ressources étudiants', 'cours', 'TD', 'exercices', 'Intelligence Artificielle', 'Cybersécurité', 'CASI', 'INSEM', 'IDD', 'université', 'Maroc'],
    authors: [{ name: 'EST Tétouan Community' }],
    creator: 'EST Tétouan Community',
    publisher: 'EST Tétouan',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: '/favicon.ico',
    },
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: 'https://estt-community.vercel.app',
        siteName: 'EST Tétouan Community',
        title: 'EST Tétouan - Ressources Étudiants',
        description: 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'EST Tétouan',
        images: [
            {
                url: '/favicon.ico',
                width: 1200,
                height: 630,
                alt: 'EST Tétouan Community',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EST Tétouan - Ressources Étudiants',
        description: 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'EST Tétouan',
        images: ['/favicon.ico'],
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
    other: {
        'google-adsense-account': 'ca-pub-8145062068015821',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
            </head>
            <body className={`${inter.className} ${canela.variable} antialiased`} suppressHydrationWarning={true}>
                <AuthProvider>
                    <Header />
                    {children}
                    <Footer />
                    <div id="spinner-overlay" className="spinner-overlay hidden" aria-hidden="true">
                        <div className="spinner" role="status" aria-label="Chargement"></div>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
