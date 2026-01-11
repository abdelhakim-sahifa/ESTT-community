# Mobile & External Migration Plan: Notification System

This guide explains how to replicate the notification system implemented in the Next.js web app into a Mobile App (React Native) or other external codebases using the same Firebase Realtime Database.

## 1. Firebase Data Structure
The system relies on two main paths in Firebase Realtime Database:
- `notifications/global`: For alerts sent to everyone.
- `notifications/private/{userId}`: For user-specific alerts.
- `users/{userId}/notifications/meta/lastOpenedGlobalAt`: Stores the timestamp of when the user last checked global notifications.

## 2. Shared Data Model
Each notification item follows this structure:
```json
{
  "id": "notif_unique_id",
  "type": "system | social | update | ad | resource",
  "title": "Notification Title",
  "message": "Detailed message content",
  "icon": "bell | info | alert-triangle | megaphone",
  "priority": "low | normal | high",
  "createdAt": 1736611200000,
  "read": false,
  "action": {
    "type": "navigate | external_link",
    "target": "/path/to/screen or https://url"
  }
}
```

## 3. Implementation Steps (Mobile/External)

### A. Real-time Listening
On the mobile app, you should set up a listener in your root or header component to watch for new notifications:
1. **Private notifications**: Listen to `notifications/private/{userId}`. Filter items where `read === false`.
2. **Global notifications**: Listen to `notifications/global`. Fetch once or listen for new items where `createdAt > lastOpenedGlobalAt`.

### B. Unread Counter Logic
```javascript
const unreadPrivate = privateList.filter(n => !n.read).length;
const unreadGlobal = globalList.filter(n => n.createdAt > lastOpenedGlobalAt).length;
const totalUnread = unreadPrivate + unreadGlobal;
```

### C. Triggering Actions (Handling the `action` object)
When a user clicks a notification in the mobile app, implement a handler similar to this:

```javascript
const handleNotificationPress = (notif) => {
  if (!notif.action || !notif.action.target) return;

  // 1. Process Dynamic Parameters
  const finalTarget = notif.action.target
    .replace(/{uid}/g, currentUser.uid)
    .replace(/{email}/g, currentUser.email)
    .replace(/{firstName}/g, userProfile.firstName);

  // 2. Execute Action
  if (notif.action.type === 'navigate') {
    // React Navigation Example
    navigation.navigate(finalTarget.replace('/', '')); 
    // OR if using Expo Router:
    // router.push(finalTarget);
  } else if (notif.action.type === 'external_link') {
    Linking.openURL(finalTarget);
  }
};
```

### D. Deep Linking Recommendation
To make the `navigate` actions even more powerful:
1. Define a `linking` configuration in your React Navigation container.
2. Map the targets sent from the admin panel (like `/profile` or `/ads-portal`) to your app's internal screen names.
3. This allows the same target paths to work for both the Web and Mobile ecosystems.


### E. Marking as Read
- **Private**: Update the specific notification node: `update(ref(db, 'notifications/private/USER_ID/NOTIF_ID'), { read: true })`.
- **Global**: Update the user's meta timestamp: `set(ref(db, 'users/USER_ID/notifications/meta/lastOpenedGlobalAt'), serverTimestamp())`.

## 4. Push Notifications (Next Steps)
To extend this to native Push Notifications (FCM/Expo Push):
1. Integrated a Cloud Function that triggers on `onCreate` for both `notifications/global` and `notifications/private/{userId}`.
2. The function sends an FCM message to the user's device token (stored in `users/{userId}/fcmToken`).
