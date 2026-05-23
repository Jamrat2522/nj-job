// =========================================================
// supabase.js — Supabase client config + RPC wrappers
// =========================================================

export const SUPABASE_URL = 'https://sytgqjglcnsabcszbngg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp';
export const FAKE_DOMAIN = '@njdispatch.local';

// Timeouts
export const TIMEOUT_QUERY = 8000;
export const TIMEOUT_BOOT  = 8000;
export const WATCHDOG_LOADER = 3000;

// Storage buckets (same as old system)
export const BUCKET_ATTACHMENTS = 'job-attachments';
export const BUCKET_SIGNATURES  = 'job-signatures';

// Singleton Supabase client
export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'mass-dispatch-auth'
  }
});

// Race a promise against a timeout — never let queries hang
export async function withTimeout(promise, ms = TIMEOUT_QUERY, label = 'operation'){
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: ' + label + ' (' + ms + 'ms)')), ms)
    )
  ]);
}

// RPC wrappers
export async function rpcHasSuperAdmin(){
  const { data, error } = await sb.rpc('has_super_admin');
  if(error){
    // Fallback: direct select (works only if RLS allows it)
    const r = await sb.from('users').select('id').eq('role','SUPER_ADMIN').eq('status','active').limit(1);
    if(r.error) return false;
    return (r.data || []).length === 0;
  }
  return data === false;
}

export async function rpcNextJobNo(){
  const { data, error } = await sb.rpc('next_job_no');
  if(error) throw error;
  return data;
}
