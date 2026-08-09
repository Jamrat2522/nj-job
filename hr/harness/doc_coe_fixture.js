/* doc_coe_fixture.js — ข้อมูลจำลองหนังสือรับรองการทำงาน ตรงกับ PDF ตัวอย่างที่แนบ */
const ORG = {
  id: 1, company_name: 'N.J. LOGISTICS & FRUITS CO., LTD.',
  address: '62/165 Moo 10 T. Thung Sukhla A. Sriracha Chonburi 20230',
  phone: '', email: '', tax_id: '',
  ceo_signer: 'Soontaree Tiranukul', ceo_position: 'Managing Director',
  footer_note: 'เอกสารฉบับนี้ออกโดยระบบ NJ LOGISTIC HR SYSTEM'
};
/* เนื้อหาตรงกับ PDF ตัวอย่างที่แนบ (0004 นายจำลอง ผาเทพ) */
const BODY =
  '<p><b>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</b> ขอรับรองว่า <b>นายจำลอง ผาเทพ</b> ' +
  'รหัสพนักงาน 0004 ปัจจุบันดำรงตำแหน่ง GENERAL MANAGER สังกัดแผนก MANAGER ' +
  'โดยเริ่มปฏิบัติงานกับบริษัทตั้งแต่วันที่ 7 มกราคม 2556 ' +
  'และยังคงมีสถานภาพเป็นพนักงานของบริษัทจนถึงปัจจุบัน ตลอดระยะเวลาการปฏิบัติงาน ' +
  'บุคคลดังกล่าวได้ปฏิบัติหน้าที่ตามตำแหน่ง และความรับผิดชอบที่ได้รับมอบหมายจากบริษัท</p>' +
  '<p>หนังสือรับรองฉบับนี้ออกให้ตามคำขอของพนักงาน เพื่อใช้เป็นหลักฐานประกอบการสมัครงาน ' +
  'และเพื่อรับรองสถานภาพการทำงานตามรายละเอียดที่ปรากฏข้างต้น</p>' +
  '<p style="text-align:center">จึงออกหนังสือรับรองฉบับนี้ไว้เป็นหลักฐาน</p>' +
  '<p style="text-align:center">ออกให้ ณ วันที่ 3 สิงหาคม 2569</p>' +
  '<p style="text-align:center">&nbsp;</p>' +
  '<p style="text-align:center">ลงชื่อ ..................................</p>' +
  '<p style="text-align:center">(Soontaree Tiranukul)</p>' +
  '<p style="text-align:center">ตำแหน่ง Managing Director</p>' +
  '<p style="text-align:center">บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</p>';

const DOC = {
  id: 'doc-1', doc_no: 'COE-2026-000002', doc_type: 'COE', status: 'DRAFT',
  employee_id: 'emp-0004', emp_name_snap: 'นายจำลอง ผาเทพ', emp_code_snap: '0004',
  position_snap: 'GENERAL MANAGER', dept_snap: 'MANAGER',
  title: 'หนังสือรับรองการทำงาน', body: BODY,
  effective_date: '2026-08-03', issued_at: '2026-08-03', version: 1,
  approver_name: '', requires_signature: false,
  doc_meta: {
    full_name: 'นายจำลอง ผาเทพ', emp_code: '0004', position_name: 'GENERAL MANAGER',
    department_name: 'MANAGER', start_date: '2013-01-07', base_salary: 120000,
    supervisor_name: '', company: 'N.J. LOGISTICS & FRUITS CO., LTD.',
    document_date: '2026-08-03', certificate_purpose: 'ใช้ประกอบการสมัครงาน',
    signer_name: 'Soontaree Tiranukul', signer_position: 'Managing Director'
  }
};

module.exports = { ORG: ORG, DOC: DOC, BODY: BODY };

/* ---------- หนังสือรับรองเงินเดือน (SAL) — body จะถูกเติมจาก Template จริงของแอปตอนรันทดสอบ ---------- */
const SAL_DOC = {
  id: 'doc-2', doc_no: 'SAL-2026-000004', doc_type: 'SALARY_CERT', status: 'DRAFT',
  employee_id: 'emp-0004', emp_name_snap: 'นายจำลอง ผาเทพ', emp_code_snap: '0004',
  position_snap: 'GENERAL MANAGER', dept_snap: 'MANAGER',
  title: 'หนังสือรับรองเงินเดือน', body: '',
  effective_date: '2026-08-03', issued_at: '2026-08-03', version: 1,
  approver_name: '', requires_signature: false,
  doc_meta: Object.assign({}, DOC.doc_meta, { base_salary: 40000 })
};
const PROFILE = {
  id: 'emp-0004', emp_code: '0004', prefix: 'นาย', first_name: 'จำลอง', last_name: 'ผาเทพ',
  full_name: 'นายจำลอง ผาเทพ', nickname: '', national_id: '', address: '',
  position_name: 'GENERAL MANAGER', department_name: 'MANAGER', start_date: '2013-01-07',
  probation_days: 119, emp_type: 'MONTHLY', status: 'ACTIVE', resign_date: null,
  base_salary: 40000, supervisor_id: null, supervisor_name: null, supervisor_position: null,
  company: 'N.J. LOGISTICS & FRUITS CO., LTD.'
};

module.exports.SAL_DOC = SAL_DOC;
module.exports.PROFILE = PROFILE;
