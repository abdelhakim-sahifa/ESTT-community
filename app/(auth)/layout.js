import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.login.title,
    pageMetadata.login.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/login'
);

export default function AuthLayout({ children }) {
    return children;
}
