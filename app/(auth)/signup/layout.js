import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.signup.title,
    pageMetadata.signup.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/signup'
);

export default function SignupLayout({ children }) {
    return children;
}
