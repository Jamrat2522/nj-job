/* [RUN-145] ฟอร์ม "ขอลาออก" — แยกจากประเภทการลาโดยสิ้นเชิง
   ไม่ใช้ leave_type · ไม่กินโควตาวันลา · ไม่เข้ารายงานวันลา
   เขียนตาม pattern เดียวกับ views/attendance/correction.js ทุกประการ
   Desktop / Mobile ใช้ modal ตัวเดียวกัน (fullMobile:true) จึงเห็นเหมือนกัน */
(function(){"use strict";
var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");
var todayISO=S.todayISO;var esc=S.esc;var avatarHTML=S.avatarHTML;var dept=S.dept;
var currentUser=S.currentUser;var currentEmp=S.currentEmp;var toast=S.toast;
var openModal=S.openModal;var closeModal=S.closeModal;var withButtonLoading=S.withButtonLoading;
var render=S.render;var sbRpc=S.sbRpc;var sbToken=S.sbToken;

/* [RUN-145] วันที่มีผลลาออกห้ามย้อนหลัง — ต้องตรงกับกติกาฝั่ง SQL
   (njhr_resign_submit ตรวจซ้ำอีกชั้น ฝั่ง client เป็นแค่ UX ห้ามถือเป็นการป้องกัน) */
function addDays(iso,n){
  var p=String(iso||"").split("-");
  var d=new Date(+p[0],+p[1]-1,+p[2]);
  d.setDate(d.getDate()+n);
  function z(x){return(x<10?"0":"")+x}
  return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());
}

function resignForm(){
  var today=todayISO();
  var deflt=addDays(today,30);   /* ค่าเริ่มต้นแนะนำ 30 วัน ผู้ใช้แก้ได้ */

  openModal("ขอลาออก",
    '<div class="fm-emp only-mobile">'+function(){
      var e2=currentEmp()||{};
      var nm=((e2.title||"")+(e2.firstName||"")+" "+(e2.lastName||"")).trim()
             ||((currentUser()||{}).username||"");
      var dp=(e2.deptId?dept(e2.deptId):"")||e2.deptName||"";
      if(!dp||dp==="—")dp="ไม่ระบุ";
      return avatarHTML(nm,44)+'<span class="grow"><b>'+esc(nm)+"</b>"
        +"<small>"+esc(e2.code||"-")+" · "+esc(dp)+"</small></span>"
    }()+"</div>"
    +'<form id="rsg-f" novalidate>'
    +'<p class="muted note" style="margin-top:0">คำขอลาออกจะถูกส่งตามผังอนุมัติของแผนกคุณ '
    +"สถานะพนักงานจะเปลี่ยนเป็น พ้นสภาพ "
    +"<b>เมื่อถึงวันที่มีผลลาออกเท่านั้น</b> ไม่ใช่ทันทีที่อนุมัติ "
    +"· คำขอนี้ไม่ใช่การลา จึงไม่ตัดโควตาวันลา</p>"
    +'<label class="field"><span>วันที่ยื่น</span>'
    +'<input type="date" id="rsg-submitted" value="'+today+'" disabled></label>'
    +'<div class="form-2col">'
    +'<label class="field"><span>วันที่มีผลลาออก <i class="req">*</i></span>'
    +'<input type="date" name="eff" id="rsg-eff" value="'+deflt+'" min="'+today+'"></label>'
    +'<label class="field"><span>วันทำงานสุดท้าย</span>'
    +'<input type="date" name="last" id="rsg-last" min="'+today+'"></label>'
    +"</div>"
    +'<label class="field"><span>เหตุผลการลาออก <i class="req">*</i></span>'
    +'<textarea name="reason" rows="3" placeholder="เช่น ย้ายภูมิลำเนา ศึกษาต่อ เปลี่ยนสายงาน"></textarea></label>'
    +'<label class="field"><span>หมายเหตุ</span>'
    +'<input type="text" name="note" placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"></label>'
    +'<label class="field"><span>เอกสารแนบ</span>'
    +'<input type="file" name="file" id="rsg-file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"></label>'
    +'<div class="form-error" id="rsg-err" role="alert"></div></form>',
    '<button class="btn btn-ghost" id="rsg-cancel">ยกเลิก</button>'
    +'<button class="btn btn-primary" id="rsg-save">ส่งคำขอ</button>',
    {fullMobile:true});

  document.getElementById("rsg-cancel").onclick=closeModal;

  document.getElementById("rsg-save").onclick=function(){
    var btn=this,err=document.getElementById("rsg-err");
    var d={};
    new FormData(document.getElementById("rsg-f")).forEach(function(v,k){
      if(k!=="file")d[k]=String(v).trim()
    });
    err.textContent="";
    if(!d.eff){err.textContent="กรุณาเลือกวันที่มีผลลาออก";return}
    if(d.eff<today){err.textContent="วันที่มีผลลาออกต้องไม่เป็นวันย้อนหลัง";return}
    if(d.last&&d.last>d.eff){err.textContent="วันทำงานสุดท้ายต้องไม่เกินวันที่มีผลลาออก";return}
    if(!d.reason){err.textContent="กรุณาระบุเหตุผลการลาออก";return}

    var fEl=document.getElementById("rsg-file");
    var file=fEl&&fEl.files&&fEl.files[0]?fEl.files[0]:null;
    if(file&&file.size>10*1024*1024){err.textContent="ไฟล์แนบต้องไม่เกิน 10 MB";return}

    withButtonLoading(btn,"กำลังส่ง…",function(){
      /* [RUN-145] อัปโหลดไฟล์ก่อน (ถ้ามี) แล้วค่อยส่งคำขอ
         ถ้าอัปโหลดล้ม ต้องไม่สร้างคำขอที่อ้างไฟล์ที่ไม่มีอยู่จริง */
      var pre=file&&S.sbUploadResignFile
        ? S.sbUploadResignFile(file,(currentEmp()||{}).id||null)
        : Promise.resolve(null);
      return pre.then(function(up){
        return sbRpc("njhr_resign_submit",{
          p_token:sbToken(),
          p_employee:null,                 /* null = ยื่นให้ตัวเอง */
          p_effective_date:d.eff,
          p_last_work_date:d.last||null,
          p_reason:d.reason,
          p_note:d.note||null,
          /* [RUN-145] sbUploadFile คืน {name,size,type,path,url} — คีย์คือ "type"
             ไม่ใช่ "mime" ต้อง map ให้ตรงกับที่ njhr_resign_submit อ่าน (p_file->>'mime') */
          p_file:up?{name:up.name,path:up.path,mime:up.type||"",size:up.size}:null
        })
      }).then(function(r){
        closeModal();
        toast("ส่งคำขอลาออกแล้ว เลขที่ "+((r&&r.request_no)||"-")+" รอการอนุมัติตามผัง","success");
        render()
      })
    })["catch"](function(e){
      err.textContent=(e&&e.message)||"ส่งคำขอไม่สำเร็จ"
    })
  }
}

NJHR.features.resignForm={open:resignForm};
})();
