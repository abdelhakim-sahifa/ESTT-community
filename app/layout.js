import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    title: 'EST Tétouan - Ressources Étudiants',
    description: 'Plateforme de partage de ressources pour les étudiants de l\'EST Tétouan',
    icons: {
        icon: '/assets/images/favicon.jpg',
    },
    other: {
        'google-adsense-account': 'ca-pub-8145062068015821',
    },
    link: [
        {
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        },
    ],
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
            <body className={`${inter.className} ${canela.variable} antialiased`}>
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
