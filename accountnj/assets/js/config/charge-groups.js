/* 5 บริษัท × 2 ประเภท — แก้ที่นี่ที่เดียว (charge engine กลางใช้ config นี้)
   key = uppercase สำหรับ Database · label = ข้อความที่แสดงใน UI ตาม Requirement ล็อก */
export const COMPANY_GROUPS = [
  { key: 'NJ',     label: 'NJ',     icon: '🟦' },
  { key: 'DSV',    label: 'DSV',    icon: '🟪' },
  { key: 'MAERSK', label: 'Maersk', icon: '🚢' },
  { key: 'KUEHNE', label: 'Kuehne', icon: '📦' },
  { key: 'RHENUS', label: 'Rhenus', icon: '🌐' },
];
export const CHARGE_TYPES = [
  { key: 'SERVICE', label: 'SERVICE CHARGE', icon: '💼', accent: 'service' },
  { key: 'ADVANCE', label: 'ADVANCE CHARGE', icon: '💳', accent: 'advance' },
];
export function groupLabel(k) { return (COMPANY_GROUPS.find(g => g.key === k) || {}).label || k; }
export function chargeLabel(k) { return (CHARGE_TYPES.find(c => c.key === k) || {}).label || k; }
