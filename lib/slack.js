/**
 * Central utility for sending Slack notifications from both client and server side.
 */

export const SLACK_CHANNELS = {
    ALERTS: 'alerts',      // Critical errors, high severity bugs
    ADMIN: 'admin',        // New resources, content reports
    FINANCE: 'finance',    // Payments (Ads/Tickets)
    COMMUNITY: 'community' // User signups, resource views
};

/**
 * Sends a notification to Slack.
 * 
 * @param {string} channel - The target channel (use SLACK_CHANNELS constants)
 * @param {Object} payload - The data to send
 * @param {Object} payload.user - User information { name, email, uid }
 * @param {Object} payload.resource - Resource/Item information { title, id, type, ... }
 * @param {string} payload.message - Optional custom message
 * @param {string} payload.title - Optional notification title
 */
export async function notifySlack(channel, payload) {
    try {
        const response = await fetch('/api/slack/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channel,
                ...payload
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Slack notification failed:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error calling Slack notification API:', err);
        return false;
    }
}
