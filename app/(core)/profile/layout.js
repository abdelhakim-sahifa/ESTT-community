import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.profile.title,
    pageMetadata.profile.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/profile'
);

export default function ProfileLayout({ children }) {
    return children;
}
