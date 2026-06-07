import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.signup.title,
    pageMetadata.signup.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/signup'
);

export default function SignupLayout({ children }) {
    return children;
}
