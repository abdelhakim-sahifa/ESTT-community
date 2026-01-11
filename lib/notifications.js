import { db, ref, push, set, update, get, serverTimestamp } from './firebase';

/**
 * Types of notifications
 */
export const NOTIF_TYPES = {
    SYSTEM: 'system',
    SOCIAL: 'social',
    UPDATE: 'update',
    AD: 'ad',
    RESOURCE: 'resource'
};

/**
 * Priorities for notifications
 */
export const NOTIF_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high'
};

/**
 * Sends a global notification to all users.
 * Global notifications are stored in 'notifications/global'
 */
export async function sendGlobalNotification({ title, message, icon = 'bell', priority = NOTIF_PRIORITY.NORMAL, action = null }) {
    if (!db) return;
    const globalNotifRef = ref(db, 'notifications/global');
    const newNotifRef = push(globalNotifRef);

    await set(newNotifRef, {
        id: newNotifRef.key,
        type: NOTIF_TYPES.SYSTEM,
        title,
        message,
        icon,
        priority,
        action,
        createdAt: serverTimestamp(),
        isGlobal: true
    });

    return newNotifRef.key;
}

/**
 * Sends a private notification to a specific user.
 * Private notifications are stored in 'notifications/private/{userId}'
 */
export async function sendPrivateNotification(userId, { type, title, message, icon = 'bell', priority = NOTIF_PRIORITY.NORMAL, action = null }) {
    if (!db || !userId) return;
    const userNotifRef = ref(db, `notifications/private/${userId}`);
    const newNotifRef = push(userNotifRef);

    await set(newNotifRef, {
        id: newNotifRef.key,
        type,
        title,
        message,
        icon,
        priority,
        action,
        read: false,
        createdAt: serverTimestamp()
    });

    return newNotifRef.key;
}

/**
 * Marks a private notification as read
 */
export async function markAsRead(userId, notificationId) {
    if (!db || !userId || !notificationId) return;
    const notifRef = ref(db, `notifications/private/${userId}/${notificationId}`);
    await update(notifRef, { read: true });
}

/**
 * Marks a global notification as read for a specific user.
 * We store the last time the user checked global notifications.
 */
export async function markGlobalAsRead(userId) {
    if (!db || !userId) return;
    const userMetaRef = ref(db, `users/${userId}/notifications/meta`);
    await update(userMetaRef, {
        lastOpenedGlobalAt: serverTimestamp()
    });
}

/**
 * Fetches unread counts and recent notifications (Placeholder logic - usually handled via listeners)
 */
export async function getUnreadCount(userId) {
    // This is better handled via a real-time listener in the UI
    // but useful for initial loads or SSR if needed.
    return 0;
}
