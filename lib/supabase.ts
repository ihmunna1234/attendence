import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Uploads a file (Blob or base64) to a Supabase bucket or returns a local data URL fallback
 */
export async function uploadToStorageBucket(
  bucketName: 'iqama-documents' | 'reference-photos' | 'attendance-snapshots',
  filePath: string,
  fileBlob: Blob | string
): Promise<string> {
  if (!supabase) {
    // If Supabase is not configured, return base64 string or mock URL
    if (typeof fileBlob === 'string') {
      return fileBlob;
    }
    return URL.createObjectURL(fileBlob);
  }

  try {
    let body: Blob;
    if (typeof fileBlob === 'string') {
      const response = await fetch(fileBlob);
      body = await response.blob();
    } else {
      body = fileBlob;
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, body, {
        upsert: true,
        contentType: body.type || 'image/jpeg',
      });

    if (error) {
      console.warn(`Supabase storage upload failed, falling back:`, error.message);
      return typeof fileBlob === 'string' ? fileBlob : URL.createObjectURL(fileBlob);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading to Supabase storage:', err);
    return typeof fileBlob === 'string' ? fileBlob : URL.createObjectURL(fileBlob);
  }
}
