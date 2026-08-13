import { toast } from '../components/toast.js';
export function handleErr(e, fallback = 'เกิดข้อผิดพลาด') {
  console.error('[BILLING NJ]', e);
  toast(e && e.message ? e.message : fallback, 'err');
}
