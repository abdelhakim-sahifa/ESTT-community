import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.privacy.title,
    pageMetadata.privacy.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/privacy'
);

export default function PrivacyLayout({ children }) {
    return children;
}
