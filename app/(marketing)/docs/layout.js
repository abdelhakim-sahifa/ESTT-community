import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.docs.title,
    pageMetadata.docs.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/docs'
);

export default function DocsLayout({ children }) {
    return children;
}
