
async function testSlackNotify(channel = 'community') {
    const payloads = {
        alerts: {
            title: '🐞 Test Alert: Bug Report',
            message: 'This is a test notification for the *ALERTS* channel.',
            resource: { title: 'Broken Button', type: 'bug', severity: 'Critical', id: 'test-bug-123' }
        },
        admin: {
            title: '📚 Test Admin: New Content',
            message: 'This is a test notification for the *ADMIN* channel.',
            resource: { title: 'Calculus Notes', type: 'pdf', id: 'test-res-456' }
        },
        finance: {
            title: '💰 Test Finance: Payment',
            message: 'This is a test notification for the *FINANCE* channel.',
            resource: { title: 'Gold Ad Package', type: 'ad', id: 'test-pay-789' }
        },
        community: {
            title: '👀 Test Community: Engagement',
            message: 'This is a test notification for the *COMMUNITY* channel.',
            resource: { title: 'Intro to AI', type: 'video', id: 'test-view-012' }
        }
    };

    const payload = payloads[channel] || payloads.community;
    payload.user = { uid: 'dev-123', email: 'dev@estt.edu', name: 'Dev Tester' };

    try {
        console.log(`Sending test notification to channel: ${channel.toUpperCase()}...`);
        const response = await fetch('http://localhost:3000/api/slack/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel,
                ...payload
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Success:', data);
        } else {
            console.error('Error:', response.status, data);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

const arg = process.argv[2] || 'community';
testSlackNotify(arg);
