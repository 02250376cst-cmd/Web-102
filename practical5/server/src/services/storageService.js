const supabase = require('../lib/supabase');
const path = require('path');

// Upload a file buffer to Supabase storage
const uploadFile = async (bucket, fileBuffer, originalName, mimeType) => {
  // Create a unique filename using timestamp
  const ext = path.extname(originalName);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    storagePath: fileName,
  };
};

// Delete a file from Supabase storage
const deleteFile = async (bucket, storagePath) => {
  if (!storagePath) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([storagePath]);

  if (error) {
    console.error(`Failed to delete file from ${bucket}:`, error.message);
  }
};

module.exports = { uploadFile, deleteFile };