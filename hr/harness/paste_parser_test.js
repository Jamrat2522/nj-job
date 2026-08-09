const fs=require('fs');
const src=fs.readFileSync('src/12-view-reports-settings.js','utf8');
// ดึงเฉพาะบล็อก parser ออกมาทดสอบตรง ๆ
const a=src.indexOf('  var CH_TH_MONTH');
const b=src.indexOf('  // Preview ก่อนบันทึก');
const code=src.slice(a,b);
const pad=n=>String(n).padStart(2,'0');
const fn=new Function('pad', code+'\nreturn {chParsePaste:chParsePaste, chFindDate:chFindDate, chCleanLine:chCleanLine};');
const M=fn(pad);
const P=(t,y=2026)=>M.chParsePaste(t,y);
let pass=0,fail=0;
function chk(n,ok,e){ok?pass++:fail++;console.log((ok?'PASS  ':'FAIL  ')+n.padEnd(50)+(e||''));}

chk('1 · 2026-10-23', JSON.stringify(P('2026-10-23 วันปิยมหาราช').items)==='[{"date":"2026-10-23","name":"วันปิยมหาราช"}]', JSON.stringify(P('2026-10-23 วันปิยมหาราช').items));
chk('2 · 23/10/2026', P('23/10/2026 วันปิยมหาราช').items[0]?.date==='2026-10-23','');
chk('3 · 23/10/2569 (พ.ศ.)', P('23/10/2569 วันปิยมหาราช').items[0]?.date==='2026-10-23','');
chk('4 · 23 ต.ค. 2569', P('23 ต.ค. 2569 วันปิยมหาราช').items[0]?.date==='2026-10-23', JSON.stringify(P('23 ต.ค. 2569 วันปิยมหาราช').items));
chk('5 · 23 ตุลาคม 2569', P('23 ตุลาคม 2569 วันปิยมหาราช').items[0]?.date==='2026-10-23','');
chk('6 · Markdown **23 ต.ค. 2569**', P('**23 ต.ค. 2569** วันปิยมหาราช').items[0]?.date==='2026-10-23','');

const TBL=`| ลำดับ | วันที่ | วัน | ชื่อวันหยุด |
|---|---|---|---|
| 18 | **23 ต.ค. 2569** | ศุกร์ | วันปิยมหาราช |
| 19 | **5 ธ.ค. 2569** | เสาร์ | วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ |
| 20 | **7 ธ.ค. 2569** | จันทร์ | วันหยุดชดเชยวันที่ 5 ธันวาคม |
| 21 | **10 ธ.ค. 2569** | พฤหัสบดี | วันรัฐธรรมนูญ |
| 22 | **31 ธ.ค. 2569** | พฤหัสบดี | วันสิ้นปี |`;
const r=P(TBL);
chk('7/8/9 · Markdown Table + เลขลำดับ + ชื่อวัน', r.items.length===5 && r.bad.length===0, 'items='+r.items.length+' bad='+r.bad.length+' skip='+r.skipped);
chk('7b · วันที่ถูกทุกแถว', r.items.map(x=>x.date).join(',')==='2026-10-23,2026-12-05,2026-12-07,2026-12-10,2026-12-31', r.items.map(x=>x.date).join(','));
chk('10 · ชื่อมี / เก็บครบ', r.items[1]?.name==='วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', r.items[1]?.name);
chk('9b · ไม่มีชื่อวันในสัปดาห์ปนในชื่อ', !r.items.some(x=>/ศุกร์|เสาร์|จันทร์|พฤหัส/.test(x.name)), r.items.map(x=>x.name).join(' | '));
chk('8b · ไม่มีเลขลำดับปนในชื่อ', !r.items.some(x=>/^\d+\s/.test(x.name)),'');
chk('13 · separator --- ไม่นับเป็น error', r.bad.length===0, 'bad='+JSON.stringify(r.bad));

const r2=P('🎉 23 ต.ค. 2569 วันปิยมหาราช\n\n---\n\n| |\n5 ธ.ค. 2569 วันพ่อแห่งชาติ');
chk('11/12 · Emoji + บรรทัดว่าง + separator', r2.items.length===2 && r2.bad.length===0, 'items='+r2.items.length+' bad='+r2.bad.length+' skip='+r2.skipped);

const r3=P('23/10/2569 วันเดิม\n23/10/2569 วันปิยมหาราช');
chk('14 · Duplicate → บรรทัดล่าสุดชนะ', r3.items.length===1 && r3.items[0].name==='วันปิยมหาราช', JSON.stringify(r3.items));

const r4=P('บรรทัดนี้ไม่มีวันที่เลย\n23 ต.ค. 2569 วันปิยมหาราช');
chk('Error · นับเฉพาะบรรทัดที่อ่านไม่ได้จริง', r4.items.length===1 && r4.bad.length===1, 'bad='+JSON.stringify(r4.bad));

const r5=P('2026-02-30 วันไม่มีจริง');
chk('Validate · วันที่ไม่มีจริงถูกปฏิเสธ', r5.items.length===0 && r5.bad.length===1, JSON.stringify(r5.bad));
chk('ปี ค.ศ. ไม่ถูกลบ 543', P('23/10/2026 x').items[0]?.date==='2026-10-23','');
chk('เดือนย่อไม่มีจุด · 23 ตค 2569', P('23 ตค 2569 x').items[0]?.date==='2026-10-23', JSON.stringify(P('23 ตค 2569 x').items));
chk('Tab-separated', P('23 ต.ค. 2569\tวันปิยมหาราช').items[0]?.name==='วันปิยมหาราช', JSON.stringify(P('23 ต.ค. 2569\tวันปิยมหาราช').items));
chk('เดือนขึ้นต้นด้วยสระ · 6 เม.ย. 2570', P('6 เม.ย. 2570 วันจักรี').items[0]?.date==='2027-04-06', JSON.stringify(P('6 เม.ย. 2570 วันจักรี').items));
chk('เดือนเต็มขึ้นต้นด้วยสระ · 13 เมษายน 2570', P('13 เมษายน 2570 วันสงกรานต์').items[0]?.date==='2027-04-13', JSON.stringify(P('13 เมษายน 2570 วันสงกรานต์').items));
chk('ครบ 12 เดือนย่อ', ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].every((m,i)=>P('15 '+m+' 2570 x').items[0]?.date==='2027-'+String(i+1).padStart(2,'0')+'-15'), '');
chk('ครบ 12 เดือนเต็ม', ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].every((m,i)=>P('15 '+m+' 2570 x').items[0]?.date==='2027-'+String(i+1).padStart(2,'0')+'-15'), '');
chk('15 · เรียงตามวันที่', P('31 ธ.ค. 2569 ก\n1 ม.ค. 2569 ข').items.map(x=>x.date).join(',')==='2026-01-01,2026-12-31','');

console.log('\n===== สรุป Parser: PASS '+pass+' · FAIL '+fail+' =====');
process.exit(fail?1:0);
