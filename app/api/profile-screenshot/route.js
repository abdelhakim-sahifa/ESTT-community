import { NextResponse } from 'next/server';
import { fetchScreenshot } from '@/lib/screenshotUtils';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get('url');
        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        // Fetch screenshot using Site-Shot API from server side to bypass CORS
        const blob = await fetchScreenshot(targetUrl, {
            format: 'png',
            width: 1280,
            height: 960,
            fullPage: true,
            delay: 1000 // wait 1s to allow dynamic profile components to load
        });

        const headers = new Headers();
        headers.set('Content-Type', 'image/png');
        headers.set('Content-Disposition', `attachment; filename="screenshot_profile.png"`);

        return new NextResponse(blob, { status: 200, headers });
    } catch (error) {
        console.error('[profile-screenshot] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
