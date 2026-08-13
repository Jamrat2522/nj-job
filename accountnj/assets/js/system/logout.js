import { clearSession } from '../auth/session.js';
export async function doLogout() {
  await clearSession();
  location.hash = '';
  location.reload();
}
