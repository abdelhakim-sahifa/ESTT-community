import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.browse.title,
    pageMetadata.browse.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/browse'
);

export default function BrowseLayout({ children }) {
    return children;
}
