import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.profile.title,
    pageMetadata.profile.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/profile'
);

export default function ProfileLayout({ children }) {
    return children;
}
