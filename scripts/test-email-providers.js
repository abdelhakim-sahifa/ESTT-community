import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Parse .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const parts = trimmed.split('=');
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Import email service
import { sendEmail } from '../lib/email-service.js';

async function runTests() {
    console.log('--- EMAIL PROVIDER MIGRATION TEST ---');
    console.log(`Active EMAIL_PROVIDER env: ${process.env.EMAIL_PROVIDER || 'brevo'}`);
    console.log(`Configured BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL}`);

    const testRecipient = process.argv[2] || 'abdelhakim.sahifa@gmail.com';

    try {
        console.log(`\n1. Testing Brevo API provider (domain: mail.estt.ma)...`);
        const brevoResult = await sendEmail({
            to: testRecipient,
            subject: '🧪 ESTT Community - Test Email via Brevo API (mail.estt.ma)',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Brevo API Integration Test</h2>
                    <p>This email was sent via the new <strong>Brevo API integration</strong> using domain <code>mail.estt.ma</code>.</p>
                    <p>Status: <strong>SUCCESS</strong></p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `,
            provider: 'brevo'
        });
        console.log('✅ Brevo API Success:', brevoResult);
    } catch (err) {
        console.error('❌ Brevo API Error:', err.message);
    }

    try {
        console.log('\n2. Testing legacy provider fallback (Gmail SMTP)...');
        const smtpResult = await sendEmail({
            to: testRecipient,
            subject: '🧪 ESTT Community - Test Email via Legacy Gmail SMTP',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #16a34a;">Legacy Gmail SMTP Test</h2>
                    <p>This email was sent via <strong>Legacy Gmail SMTP</strong> (Nodemailer).</p>
                    <p>Status: <strong>SUCCESS</strong></p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `,
            provider: 'gmail'
        });
        console.log('✅ Legacy Gmail SMTP Success:', smtpResult);
    } catch (err) {
        console.error('❌ Legacy Gmail SMTP Error:', err.message);
    }

    console.log('\n--- TEST COMPLETE ---');
}

runTests();
