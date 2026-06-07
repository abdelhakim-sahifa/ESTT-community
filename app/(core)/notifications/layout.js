import { getMetadata, pageMetadata } from '@/lib/metadata';

export const metadata = getMetadata(
    pageMetadata.notifications.title,
    pageMetadata.notifications.description,
    'https://estt.ma/favicon.ico',
    'https://estt.ma/notifications'
);

export default function NotificationsLayout({ children }) {
    return children;
}
