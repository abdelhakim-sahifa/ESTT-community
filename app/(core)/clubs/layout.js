import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.clubs.title,
    pageMetadata.clubs.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/clubs'
);

export default function ClubsLayout({ children }) {
    return children;
}
