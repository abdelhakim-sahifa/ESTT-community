import { db, ref, get } from '@/lib/firebase';

export async function generateMetadata({ params }) {
    const { clubId, postId } = params;

    try {
        if (!db) {
            return {
                title: 'Publication',
                description: 'Découvrez cette publication',
            };
        }

        // Fetch club data
        const clubRef = ref(db, `clubs/${clubId}`);
        const clubSnap = await get(clubRef);
        const club = clubSnap.exists() ? clubSnap.val() : null;

        // Fetch post data
        const postRef = ref(db, `clubPosts/${clubId}/${postId}`);
        const postSnap = await get(postRef);

        if (!postSnap.exists()) {
            return {
                title: 'Publication non trouvée',
                description: 'Cette publication n\'existe pas ou n\'est pas disponible',
            };
        }

        const post = postSnap.val();
        const clubName = club?.name || 'Club';

        // Determine post type label
        const typeLabel = post.type === 'announcement' ? 'Annonce' :
            post.type === 'article' ? 'Article' : 'Activité';

        return {
            title: `${post.title} - ${clubName}`,
            description: post.content?.substring(0, 160) || `${typeLabel} publiée par ${clubName}`,
            keywords: [
                post.title,
                clubName,
                'EST Tétouan',
                typeLabel,
                ...(post.topics || []),
            ],
            openGraph: {
                title: post.title,
                description: post.content?.substring(0, 160) || `${typeLabel} publiée par ${clubName}`,
                type: 'article',
                url: `https://estt-community.vercel.app/clubs/${clubId}/posts/${postId}`,
                publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
                authors: post.author ? [post.author] : undefined,
                images: post.imageUrl ? [
                    {
                        url: post.imageUrl,
                        width: 1200,
                        height: 630,
                        alt: post.title,
                    },
                ] : (club?.logo ? [
                    {
                        url: club.logo,
                        width: 800,
                        height: 800,
                        alt: clubName,
                    },
                ] : []),
            },
            twitter: {
                card: post.imageUrl ? 'summary_large_image' : 'summary',
                title: post.title,
                description: post.content?.substring(0, 160) || `${typeLabel} publiée par ${clubName}`,
                images: post.imageUrl ? [post.imageUrl] : (club?.logo ? [club.logo] : []),
            },
        };
    } catch (error) {
        console.error('Error generating post metadata:', error);
        return {
            title: 'Publication',
            description: 'Découvrez cette publication',
        };
    }
}

export default function PostLayout({ children }) {
    return children;
}
