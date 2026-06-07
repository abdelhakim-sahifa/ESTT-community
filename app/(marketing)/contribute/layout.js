import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.contribute.title,
    pageMetadata.contribute.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/contribute'
);

export default function ContributeLayout({ children }) {
    return children;
}
