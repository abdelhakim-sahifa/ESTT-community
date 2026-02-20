import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.chat.title,
    pageMetadata.chat.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/chat'
);

export default function ChatLayout({ children }) {
    return children;
}
