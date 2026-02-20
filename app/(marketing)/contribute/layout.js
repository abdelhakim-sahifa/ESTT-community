import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.contribute.title,
    pageMetadata.contribute.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/contribute'
);

export default function ContributeLayout({ children }) {
    return children;
}
