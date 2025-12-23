// Supabase configuration and upload helpers
import { createClient } from '@supabase/supabase-js';
import { db, ref, push, set } from './firebase';

const SUPABASE_URL = "https://fnaiedociknutdxoezhn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCIsIkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYWllZG9jaWtudXRkeG9lemhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjE2NTMsImV4cCI6MjA4MDA5NzY1M30.ydJoZcnBWZUAWKnpq0rdGdqxHvo2fw-61HDJHfavZnk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name
const STORAGE_BUCKET = 'ressources';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function uploadResourceFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 10 MB limit');

    // Create a unique path / filename
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    return {
        path: filename,
        publicUrl: urlData?.publicUrl ?? null,
        raw: data
    };
}

// Upload file to Supabase storage and save the public link to Firebase Realtime Database
async function shareFileAndSaveToFirebase({ file, title = null, description = null }) {
    if (!file) throw new Error('No file provided');

    const uploaded = await uploadResourceFile(file);

    const payload = {
        title: title || file.name,
        description: description || '',
        url: uploaded.publicUrl,
        path: uploaded.path,
        size: file.size,
        created_at: new Date().toISOString()
    };

    const newRef = push(ref(db, 'resources'));
    await set(newRef, payload);

    return { ...payload, key: newRef.key };
}

export { supabase, uploadResourceFile, shareFileAndSaveToFirebase };
