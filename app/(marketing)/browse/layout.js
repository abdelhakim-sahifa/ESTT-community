import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.browse.title,
    pageMetadata.browse.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/browse'
);

export default function BrowseLayout({ children }) {
    return children;
}
