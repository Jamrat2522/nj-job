(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var pad=S.pad;var audit=S.audit;var toast=S.toast;var sbRpcList=S.sbRpcList;var sbToken=S.sbToken;var empBE=S.empBE;var db=S.db;var EMP_STATUS_MAP=S.EMP_STATUS_MAP;var rptSafeName=S.rptSafeName;var rptBuildXlsx=S.rptBuildXlsx;var rptLoadZip=S.rptLoadZip;var empState=S.empState;
/* ---------- [RUN-166] Export Excel = โครงเดียวกับ "ดาวน์โหลดเทมเพลต" + ข้อมูลจริง ----------
   เดิมไฟล์นี้ประกาศ EMP_XLS_HEAD เอง 14 คอลัมน์ · Sheet "ทะเบียนพนักงาน" · วันที่เป็น พ.ศ.
   จึงไม่ตรงกับเทมเพลต 28 คอลัมน์ และนำกลับเข้า "นำเข้า Excel" ไม่ได้
   ของใหม่อ้างอิง EMP_EXCEL_COLUMNS จาก shared-emp-meta ชุดเดียวกับเทมเพลตและการนำเข้า
     · หัวข้อ / ลำดับ / จำนวนคอลัมน์ / ชื่อ Sheet / ความกว้าง / Freeze = มาจากตัวช่วยกลางทั้งหมด
     · Style / Font / Border / Fill มาจาก rptBuildXlsx ตัวเดียวกับเทมเพลต จึงเหมือนกันโดยปริยาย
     · ข้อมูลมาจาก njhr_emp_export_rows (RPC อ่านใหม่ RUN-166) ซึ่งส่งครบ 28 คอลัมน์
       และคืนวันที่เป็น YYYY-MM-DD · work_start/work_end เป็น HH:MM ตรงตามที่ Import รับ
   ไม่แตะ: Flow เพิ่มพนักงาน · การนำเข้า Excel · ข้อมูลพนักงาน · ตัวกรองของหน้าพนักงาน */
var empExcelHead=S.empExcelHead;var empExcelWidths=S.empExcelWidths;var empExcelTitle=S.empExcelTitle;var empExcelRow=S.empExcelRow;var EMP_EXCEL_SHEET=S.EMP_EXCEL_SHEET;
var EMP_EXPORT_PAGE=500;   /* เพดานของ njhr_emp_export_rows — 110 คนจบใน 1 ครั้ง */
function empExport(btn){var s=empState,errEl=document.getElementById("emp-err");if(errEl)errEl.textContent="";if(btn.disabled)return;var label=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> กำลังสร้างไฟล์…';var all=[];
/* ใช้ตัวกรองเดียวกับที่หน้าพนักงานกำลังแสดงอยู่ (q / แผนก / สถานะ / การเรียง) เหมือนเดิม */
function pull(off){return sbRpcList("njhr_emp_export_rows",{p_token:sbToken(),p_q:s.q||null,p_dept:s.dept||null,p_status:s.status||null,p_sort:s.sort,p_desc:s.desc,p_limit:EMP_EXPORT_PAGE,p_offset:off}).then(function(rows){all=all.concat(rows);var total=rows.length?Number(rows[0].total_count):0;if(all.length<total&&rows.length)return pull(off+EMP_EXPORT_PAGE)})}
pull(0).then(function(){if(!all.length){throw new Error("ไม่พบพนักงานตามเงื่อนไขที่เลือก")}var now=new Date;var stamp=empBE(now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate()))+" "+pad(now.getHours())+":"+pad(now.getMinutes());
/* Title 5 บรรทัดเท่าเทมเพลต (Header จึงอยู่แถว 6 · Freeze A7 เหมือนกัน)
   4 บรรทัดแรกตรงกันเป๊ะ · บรรทัดที่ 5 บอกบริบทของไฟล์ Export แทนคำแนะนำลบแถวตัวอย่าง */
var title=empExcelTitle(db.settings.companyName,"ข้อมูลพนักงาน ณ "+stamp+" · แผนก: "+(s.dept||"ทุกแผนก")+" · สถานะ: "+(s.status?EMP_STATUS_MAP[s.status]:"ทุกสถานะ")+" · จำนวน "+all.length+" คน");
var cells=all.map(empExcelRow);
return rptLoadZip().then(function(){return rptBuildXlsx(EMP_EXCEL_SHEET,empExcelHead(),cells,empExcelWidths(),title)})}).then(function(blob){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=rptSafeName("ทะเบียนพนักงาน_"+(empState.dept||"ทุกแผนก"))+".xlsx";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},4e3);audit("EXPORT","Export ทะเบียนพนักงาน "+all.length+" คน");toast("ดาวน์โหลดทะเบียนพนักงานแล้ว "+all.length+" คน")}).catch(function(ex){if(errEl)errEl.textContent=ex&&ex.message||"Export ไม่สำเร็จ"}).then(function(){btn.disabled=false;btn.innerHTML=label})}NJHR.compat.scope.empExport=empExport})();
