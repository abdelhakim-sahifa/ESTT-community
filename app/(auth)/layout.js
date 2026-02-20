import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.login.title,
    pageMetadata.login.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/login'
);

export default function AuthLayout({ children }) {
    return children;
}
