// =========================================================
// attachments.js — upload, image compression, list, delete
// =========================================================

import { sb, BUCKET_ATTACHMENTS } from './supabase.js';
import { S } from './state.js';
import { toast } from './utils.js';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_W = 1600;
const Q = 0.72;

// Compress image (only jpeg/jpg/png/webp; skip if already small + jpeg)
export async function compressImageIfNeeded(file){
  const type = (file.type || '').toLowerCase();
  if(!/^image\/(jpeg|jpg|png|webp)$/.test(type)) return file;

  // Skip if already small enough
  try {
    const probe = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    if(probe.w <= MAX_W && file.size < 600 * 1024 && type === 'image/jpeg') return file;
  } catch(_) {}

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if(w > MAX_W){ h = h * (MAX_W / w); w = MAX_W; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if(!blob){ resolve(file); return; }
        const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
        resolve(new File([blob], baseName + '.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', Q);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// Upload a single attachment row + storage object
export async function uploadAttachment(jobId, fileIn){
  let file = fileIn;
  if(file.size > MAX_FILE_SIZE){
    throw new Error(`ไฟล์เกิน 15MB: ${file.name}`);
  }
  file = await compressImageIfNeeded(file);

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${jobId}/${ts}_${safeName}`;

  const { error: upErr } = await sb.storage
    .from(BUCKET_ATTACHMENTS)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if(upErr) throw upErr;

  const { data: pub } = sb.storage.from(BUCKET_ATTACHMENTS).getPublicUrl(path);

  const { data: row, error: insErr } = await sb.from('attachments').insert({
    job_id: jobId,
    file_name: file.name,
    file_type: file.type || ext,
    file_size: file.size,
    file_url: pub.publicUrl,
    storage_path: path,
    uploaded_by: S.user.id,
    uploaded_by_name: S.user.full_name || S.user.username
  }).select().single();
  if(insErr) throw insErr;
  return row;
}

// Delete attachment (storage + DB)
export async function deleteAttachment(att){
  if(att.storage_path){
    try { await sb.storage.from(BUCKET_ATTACHMENTS).remove([att.storage_path]); } catch(_) {}
  }
  const { error } = await sb.from('attachments').delete().eq('id', att.id);
  if(error) toast('ลบไฟล์ไม่สำเร็จ: ' + error.message, 'error');
}
