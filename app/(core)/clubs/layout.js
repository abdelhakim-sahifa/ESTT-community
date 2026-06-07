import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.clubs.title,
    pageMetadata.clubs.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/clubs'
);

export default function ClubsLayout({ children }) {
    return children;
}
