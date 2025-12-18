import { Outfit } from 'next/font/google';
import './globals.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
    title: 'EST Tétouan - Ressources Étudiants',
    description: 'Plateforme de partage de ressources pour les étudiants de l\'EST Tétouan',
    icons: {
        icon: '/assets/images/favicon.jpg',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
            </head>
            <body className={outfit.className}>
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
