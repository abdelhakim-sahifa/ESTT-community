import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.docs.title,
    pageMetadata.docs.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/docs'
);

export default function DocsLayout({ children }) {
    return children;
}
