import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.notifications.title,
    pageMetadata.notifications.description,
    'https://estt-community.vercel.app/favicon.ico',
    'https://estt-community.vercel.app/notifications'
);

export default function NotificationsLayout({ children }) {
    return children;
}
