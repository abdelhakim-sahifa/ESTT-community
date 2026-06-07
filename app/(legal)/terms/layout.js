import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.terms.title,
    pageMetadata.terms.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/terms'
);

export default function TermsLayout({ children }) {
    return children;
}
