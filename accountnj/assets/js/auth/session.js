import { sb } from '../core/supabase-client.js';
import { AppState, resetState } from '../core/state.js';
import { loadMyProfile } from './login-api.js';
export async function restoreSession() {
  const { data } = await sb().auth.getSession();
  if (!data || !data.session) return false;
  try {
    AppState.profile = await loadMyProfile();
    return true;
  } catch (e) {
    await sb().auth.signOut(); resetState(); return false;
  }
}
export async function clearSession() {
  try { await sb().auth.signOut(); } catch (e) {}
  resetState();
  try { sessionStorage.clear(); } catch (e) {}
}
