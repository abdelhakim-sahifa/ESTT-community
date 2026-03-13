import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { db, ref, get } from '@/lib/firebase';

const CLIENT_ID = "210065801527-qo2vl3cqamubuai4vnn3oldv0rsnm4a3.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/api/drive/callback";

/**
 * Helper to find or create a folder in Google Drive
 */
async function findOrCreateFolder(drive, name, parentId) {
    const q = `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`;

    const response = await drive.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [],
    };

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return folder.data.id;
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        // Optional folder hierarchy metadata
        const fieldName = formData.get('fieldName');
        const semester = formData.get('semester');
        const moduleName = formData.get('moduleName');
        const professorName = formData.get('professorName');
        const isBugReport = formData.get('isBugReport') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Get Refresh Token from Firebase (Fallback to ENV)
        let refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

        if (!refreshToken) {
            const configSnap = await get(ref(db, 'adminSettings/driveConfig'));
            if (configSnap.exists()) {
                refreshToken = configSnap.val().refreshToken;
            }
        }

        if (!refreshToken) {
            return NextResponse.json({
                error: 'Drive non configuré.',
                details: 'L\'administrateur doit visiter /api/drive/auth pour lier son compte.'
            }, { status: 500 });
        }

        // 2. Initialize OAuth2 Client
        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 3. Handle Folder Hierarchy
        let targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (isBugReport) {
            try {
                targetFolderId = await findOrCreateFolder(drive, 'Bug Reports', targetFolderId);
            } catch (folderErr) {
                console.warn('Bug Reports folder creation error:', folderErr);
            }
        } else if (fieldName && semester && moduleName) {
            try {
                // Root -> Field -> Semester -> Module -> Professor/Autres
                const fieldFolderId = await findOrCreateFolder(drive, fieldName, targetFolderId);
                const semesterFolderId = await findOrCreateFolder(drive, semester, fieldFolderId);
                const moduleFolderId = await findOrCreateFolder(drive, moduleName, semesterFolderId);

                const profFolder = (!professorName || professorName === 'non-specifie') ? 'Autres' : professorName;
                targetFolderId = await findOrCreateFolder(drive, profFolder, moduleFolderId);
            } catch (folderErr) {
                console.warn('Folder creation error, falling back to root:', folderErr);
            }
        }

        // 4. Convert file
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        // 5. Upload
        const originalName = file.name;
        const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
        const displayName = formData.get('displayTitle');
        const finalFileName = displayName ? `${displayName}.${extension}` : originalName;

        const fileMetadata = {
            name: finalFileName,
            parents: targetFolderId ? [targetFolderId] : [],
        };

        const media = {
            mimeType: file.type,
            body: bufferStream,
        };

        const driveResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink',
        });

        const uploadedFile = driveResponse.data;

        // 6. Set Permission to public
        try {
            await drive.permissions.create({
                fileId: uploadedFile.id,
                requestBody: { role: 'reader', type: 'anyone' },
            });
        } catch (pErr) { console.warn('Permission error:', pErr); }

        return NextResponse.json({
            success: true,
            id: uploadedFile.id,
            name: uploadedFile.name,
            publicUrl: uploadedFile.webViewLink,
            downloadUrl: uploadedFile.webContentLink,
        });

    } catch (error) {
        console.error('Drive Upload Error:', error);
        return NextResponse.json({
            error: 'Upload failed',
            details: error.message
        }, { status: 500 });
    }
}
