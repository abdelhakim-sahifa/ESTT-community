import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// HARDCODED CREDENTIALS
const CLIENT_ID = "210065801527-qo2vl3cqamubuai4vnn3oldv0rsnm4a3.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/api/drive/callback";

export async function GET(req) {
    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    const scopes = [
        'https://www.googleapis.com/auth/drive.file'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    return NextResponse.redirect(url);
}
