/* App state กลาง — in-memory เท่านั้น (ไม่เก็บข้อมูลธุรกิจใน localStorage §68) */
export const AppState = {
  profile: null,          /* จาก njacc_my_profile */
  masters: null,          /* customers/companies/service_codes/vat_rate */
  route: null,
};
export function resetState() { AppState.profile = null; AppState.masters = null; }
