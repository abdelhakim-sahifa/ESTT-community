import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.privacy.title,
    pageMetadata.privacy.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/privacy'
);

export default function PrivacyLayout({ children }) {
    return children;
}
