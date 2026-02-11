import { db, ref, get } from '@/lib/firebase';

export async function generateMetadata({ params }) {
    const { clubId } = params;

    try {
        if (!db) {
            return {
                title: 'Club',
                description: 'Découvrez ce club étudiant de l\'EST Tétouan',
            };
        }

        const clubRef = ref(db, `clubs/${clubId}`);
        const clubSnap = await get(clubRef);

        if (!clubSnap.exists()) {
            return {
                title: 'Club non trouvé',
                description: 'Ce club n\'existe pas ou n\'est pas disponible',
            };
        }

        const club = clubSnap.val();

        return {
            title: club.name,
            description: club.description || `Découvrez ${club.name}, un club étudiant de l'EST Tétouan`,
            keywords: [
                club.name,
                'EST Tétouan',
                'club étudiant',
                'vie étudiante',
                ...(club.topics || []),
            ],
            openGraph: {
                title: club.name,
                description: club.description || `Découvrez ${club.name}, un club étudiant de l'EST Tétouan`,
                type: 'website',
                url: `https://estt-community.vercel.app/clubs/${clubId}`,
                images: club.logo ? [
                    {
                        url: club.logo,
                        width: 800,
                        height: 800,
                        alt: `${club.name} logo`,
                    },
                ] : [],
            },
            twitter: {
                card: 'summary',
                title: club.name,
                description: club.description || `Découvrez ${club.name}, un club étudiant de l'EST Tétouan`,
                images: club.logo ? [club.logo] : [],
            },
            icons: {
                icon: club.logo || '/favicon.ico',
                shortcut: club.logo || '/favicon.ico',
                apple: club.logo || '/favicon.ico',
            },
        };
    } catch (error) {
        console.error('Error generating club metadata:', error);
        return {
            title: 'Club',
            description: 'Découvrez ce club étudiant de l\'EST Tétouan',
        };
    }
}

export default function ClubLayout({ children }) {
    return children;
}
