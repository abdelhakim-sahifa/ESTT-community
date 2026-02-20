import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.terms.title,
    pageMetadata.terms.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/terms'
);

export default function TermsLayout({ children }) {
    return children;
}
