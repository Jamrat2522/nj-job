(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var icon=S.icon;var todayISO=S.todayISO;var nowStamp=S.nowStamp;var esc=S.esc;var uid=S.uid;var isWeekend=S.isWeekend;var isHoliday=S.isHoliday;var businessDays=S.businessDays;var hoursDiff=S.hoursDiff;var debounce=S.debounce;var avatarHTML=S.avatarHTML;var emp=S.emp;var dept=S.dept;var currentUser=S.currentUser;var currentEmp=S.currentEmp;var toast=S.toast;var openModal=S.openModal;var closeModal=S.closeModal;var nav=S.nav;var sbRpcList=S.sbRpcList;var sbRpc=S.sbRpc;var sbToken=S.sbToken;var refreshLeavePending=S.refreshLeavePending;var njExemptCheck=S.njExemptCheck;var lvIsVacation=S.lvIsVacation;var lvCode=S.lvCode;var reqInfoBar=S.reqInfoBar;var lvType=S.lvType;var lvNum=S.lvNum;var LEAVE_TYPES=S.LEAVE_TYPES;
/* [RUN-152] ค่าหมายเหตุของตัวเลือก "ลาออก" ใน Dropdown ประเภทการลา
   ตั้งใจใช้ค่าที่ไม่มีทางชนกับ leave_type จริง เพื่อกันหลุดเข้าใบลา */
var LVF_RESIGN="__RESIGN__";
var sbUploadLeaveFile=S.sbUploadLeaveFile;var lvBal=S.lvBal;var LV_MAX_FILE=5*1024*1024;var LV_ACCEPT=".pdf,.doc,.docx,.xls,.xlsx,image/*";function lvFileSize(n){var v=Number(n);if(!isFinite(v)||v<=0)return"-";return v>=1048576?Math.round(v/104857.6)/10+" MB":Math.max(1,Math.round(v/1024))+" KB"}function lvFileKind(f){var n=String(f.name||"").toLowerCase();if(/\.(png|jpe?g|gif|webp|bmp)$/.test(n))return"รูปภาพ";if(/\.pdf$/.test(n))return"PDF";if(/\.(docx?|rtf)$/.test(n))return"เอกสาร Word";if(/\.(xlsx?|csv)$/.test(n))return"ไฟล์ Excel";return f.type||"ไฟล์แนบ"}var lvBalPending=null;function lvBalReady(){if(Object.keys(lvBal).length)return Promise.resolve();if(lvBalPending)return lvBalPending;lvBalPending=sbRpcList("njhr_leave_balances",{p_token:sbToken()}).then(function(rows){lvBalPending=null;Object.keys(lvBal).forEach(function(k){delete lvBal[k]});(rows||[]).forEach(function(b){lvBal[b.leave_type]=b})}).catch(function(er){lvBalPending=null;try{console.error("[LEAVE] njhr_leave_balances ล้มเหลว:",er)}catch(e2){}throw new Error("โหลดสิทธิ์การลาไม่สำเร็จ กรุณาลองใหม่")});return lvBalPending}function leaveForm(listEl,pre){var e=currentEmp();if(!e){toast("บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน","error");return}lvBalReady().then(function(){leaveFormBuild(listEl,e,pre)},function(er){toast(er.message||"โหลดข้อมูลไม่สำเร็จ","error")})}function leaveFormBuild(listEl,e,pre){var files=[];var submitKey=uid("K");var submitting=false;var submittedAt=nowStamp();openModal("ขอลางาน",'<div class="fm-emp only-mobile">'+function(){var e2=currentEmp()||{};var nm=((e2.title||"")+(e2.firstName||"")+" "+(e2.lastName||"")).trim()||((currentUser()||{}).username||"");var dp=(e2.deptId?dept(e2.deptId):"")||e2.deptName||"";if(!dp||dp==="—")dp="ไม่ระบุ";return avatarHTML(nm,44)+'<span class="grow"><b>'+esc(nm)+"</b>"+"<small>"+esc(e2.code||"-")+" · "+esc(dp)+"</small></span>"}()+"</div>"+'<form id="lv-f" novalidate>'+reqInfoBar(e,submittedAt,"lvf-no")+'<label class="field"><span>ประเภทการลา <i class="req">*</i></span><select name="typeId" id="lvf-type">'+LEAVE_TYPES.map(function(t){return'<option value="'+t.code+'">'+esc(t.name)+"</option>"}).join("")
/* [RUN-152] "ลาออก" ต่อท้ายรายการสุดท้าย — เป็นทางเข้า UI อย่างเดียว
   ไม่ใช่ leave_type จริง ไม่ถูกส่งเข้าใบลา ไม่กินโควตา (ดูตัวจัดการ onchange ด้านล่าง) */
+'<option value="'+LVF_RESIGN+'">ลาออก</option>'+"</select></label>"+'<label class="field"><span>รูปแบบการลา <i class="req">*</i></span><div class="seg" id="lvf-mode">'+[["FULL","เต็มวัน"],["HALF_AM","ครึ่งวันเช้า"],["HALF_PM","ครึ่งวันบ่าย"],["HOURLY","รายชั่วโมง"]].map(function(m,i2){return'<button type="button" class="seg-btn'+(i2===0?" active":"")+'" data-mode="'+m[0]+'">'+m[1]+"</button>"}).join("")+"</div></label>"+'<div class="form-2col lvf-2col">'+'<label class="field"><span>วันที่เริ่ม <i class="req">*</i></span><input type="date" name="startDate" id="lvf-start" value="'+todayISO()+'"></label>'+'<label class="field" id="lvf-endwrap"><span>วันที่สิ้นสุด <i class="req">*</i></span><input type="date" name="endDate" id="lvf-end" value="'+todayISO()+'"></label></div>'+'<div class="form-2col lvf-2col" id="lvf-times" style="display:none">'+'<label class="field"><span>เวลาเริ่ม <i class="req">*</i></span><input type="time" name="startTime" id="lvf-st" value="09:00"></label>'+'<label class="field"><span>เวลาสิ้นสุด <i class="req">*</i></span><input type="time" name="endTime" id="lvf-et" value="12:00"></label></div>'+'<div id="lvf-vac" class="lvf-vac" hidden></div>'/* [RUN-208] */+'<label class="field"><span>เหตุผลการลา <i class="req">*</i></span>'+'<textarea name="reason" rows="2" placeholder="ระบุเหตุผลการลา"></textarea></label>'+'<div class="field"><span>เอกสารแนบ <small class="muted" id="lvf-doc-hint"></small></span>'+'<div class="otj-flist" id="lvf-files"></div>'+'<label class="btn btn-ghost btn-sm otj-attach">'+icon("plus")+" เพิ่มไฟล์แนบ"+'<input type="file" id="lvf-file" hidden multiple accept="'+LV_ACCEPT+'"></label></div>'+'<div class="form-error" id="lvf-err" role="alert" style="white-space:pre-line"></div></form>','<button class="btn btn-ghost" id="lvf-cancel">ยกเลิก</button><button class="btn btn-primary" id="lvf-send">ส่งคำขอ</button>',{wide:true,fullMobile:true});var mode="FULL";var modeBox=document.getElementById("lvf-mode");modeBox.querySelectorAll(".seg-btn").forEach(function(b){b.onclick=function(){modeBox.querySelectorAll(".seg-btn").forEach(function(x){x.classList.remove("active")});this.classList.add("active");mode=this.dataset.mode;document.getElementById("lvf-times").style.display=mode==="HOURLY"?"":"none";document.getElementById("lvf-endwrap").style.display=mode==="FULL"?"":"none";if(mode!=="FULL")document.getElementById("lvf-end").value=document.getElementById("lvf-start").value;updateSum()}});function calc(){var fm=document.getElementById("lv-f");var d={};new FormData(fm).forEach(function(v,k){d[k]=v});d.mode=mode;d.startDate=String(d.startDate);d.endDate=mode==="FULL"?String(d.endDate):d.startDate;var days=0,hours=0;if(mode==="FULL")days=businessDays(d.startDate,d.endDate);else if(mode==="HOURLY"){hours=hoursDiff(String(d.startTime),String(d.endTime));days=0}else days=isWeekend(d.startDate)||isHoliday(d.startDate)?0:.5;d.days=days;d.hours=hours;d.useDays=Math.round((days+hours/8)*100)/100;return d}function renderFiles(){var box=document.getElementById("lvf-files");if(!box)return;box.innerHTML=files.length?files.map(function(f,i){return'<div class="otj-file"><span class="otj-fname">'+icon("fileText","ic-sm")+" "+esc(f.name)+'<small class="muted"> · '+esc(f.kind)+" · "+lvFileSize(f.size)+"</small></span>"+'<button type="button" class="btn-icon ic-red" data-fdel="'+i+'" aria-label="ลบไฟล์">'+icon("x")+"</button></div>"}).join(""):'<small class="muted">ยังไม่มีไฟล์แนบ</small>';box.querySelectorAll("[data-fdel]").forEach(function(b){b.onclick=function(){files.splice(parseInt(b.dataset.fdel,10),1);renderFiles();updateSum()}})}document.getElementById("lvf-file").onchange=function(){var pend=Array.prototype.slice.call(this.files),err=document.getElementById("lvf-err");err.textContent="";pend.forEach(function(file){if(file.size>LV_MAX_FILE){err.textContent="ไฟล์ "+file.name+" เกิน 5MB — ไม่แนบ";return}if(files.some(function(x){return x.name===file.name&&x.size===file.size}))return;files.push({file:file,name:file.name,size:file.size,kind:lvFileKind(file)})});this.value="";renderFiles();updateSum()};renderFiles();function updateSum(){var d=calc();var lt=lvType(String(d.typeId));var hint=document.getElementById("lvf-doc-hint");if(hint)hint.textContent="ไฟล์แนบไม่บังคับ · ไฟล์ละไม่เกิน 5MB";lvfVacBox(d,lt)}
/* [RUN-208] ตัวเลขสิทธิลาพักร้อนในฟอร์ม — อ่านจาก lvBal ที่มาจาก njhr_leave_balances
   ชุดเดียวกับหน้าลางานและมือถือ จึงไม่มีทางแสดงต่างกัน
   เกินสิทธิ = เตือน แต่ยังยื่นได้ ให้ผู้อนุมัติเป็นผู้ตัดสิน */
function lvfVacBox(d,lt){
  var box=document.getElementById("lvf-vac");if(!box)return;
  var b=lvBal[lt.code];
  if(!b||b.quota==null||!lvIsVacation(lt.code)){box.hidden=true;box.innerHTML="";return}
  var q=lvNum(b.quota),u=lvNum(b.used),rem=lvNum(b.remaining);
  var need=d&&d.useDays!=null?lvNum(d.useDays):0;
  var over=need>0&&need>rem;
  box.hidden=false;
  box.innerHTML='<span class="lvf-vac3">'
    +'<span><i>สิทธิปีนี้</i><b>'+esc(lvfDayTxt(q))+'</b></span>'
    +'<span><i>ใช้ไปแล้ว</i><b>'+esc(lvfDayTxt(u))+'</b></span>'
    +'<span class="'+(rem<0?"lvf-vneg":"lvf-vok")+'"><i>คงเหลือ</i><b>'+esc(lvfDayTxt(rem))+'</b></span>'
    +"</span>"
    +(over?'<small class="lvf-vwarn">'+icon("info","ic-sm")
      +" ขอลา "+esc(lvfDayTxt(need))+" เกินสิทธิคงเหลือ "+esc(lvfDayTxt(rem))
      +" — ยังยื่นได้ แต่ผู้อนุมัติจะเห็นยอดนี้และเป็นผู้ตัดสิน</small>":"")}
function lvfDayTxt(n){var v=lvNum(n);return(Math.round(v*100)%100===0?String(Math.round(v)):String(v))+" วัน"}["lvf-type","lvf-start","lvf-end","lvf-st","lvf-et"].forEach(function(id2){var el2=document.getElementById(id2);if(el2)el2.onchange=updateSum});
/* [RUN-152] เลือก "ลาออก" ใน Dropdown = เข้า Flow RESIGN เดิม (เดิมเป็นปุ่มแยกด้านนอก)
   · คืนค่า select กลับอันเดิมทันที ไม่ให้ค้างที่ "ลาออก" ถ้าผู้ใช้กดยกเลิก
   · ปิดฟอร์มใบลาแล้วเปิดฟอร์มลาออกตัวเดิม NJHR.features.resignForm.open(listEl)
   · โหลดโมดูล resign-form ก่อนถ้ายังไม่ถูกโหลด (แบบเดียวกับ lvOpenAction ของปุ่มเดิม)
   ใช้ทั้ง Desktop และ Mobile เพราะเป็น modal ตัวเดียวกัน */
(function(){
  var tEl=document.getElementById("lvf-type");if(!tEl)return;
  var prev=tEl.value;
  tEl.onchange=function(){
    if(this.value!==LVF_RESIGN){prev=this.value;updateSum();return}
    this.value=prev;
    var self=this;
    function go(){
      if(NJHR.features&&NJHR.features.resignForm){closeModal();NJHR.features.resignForm.open(listEl)}
      else toast("โมดูลขอลาออกยังโหลดไม่เสร็จ กรุณาลองใหม่","error")
    }
    if(NJHR.modules.isLoaded("resign-form")){go();return}
    self.disabled=true;
    NJHR.modules.load("resign-form").then(function(){self.disabled=false;go()})
      ["catch"](function(){self.disabled=false;toast("โมดูลขอลาออกยังโหลดไม่เสร็จ กรุณาลองใหม่","error")})
  }
})();document.getElementById("lv-f").addEventListener("input",debounce(updateSum,200));updateSum();
/* [RUN-207] ยื่นใหม่จากรายการที่ SUPER_ADMIN ส่งคืน — กรอกค่าเดิมให้ครบ
   พร้อมแสดงเหตุผลที่ถูกส่งคืนไว้บนหัวฟอร์ม (เห็นทั้งคอมและมือถือ เพราะเป็น modal ตัวเดียวกัน)
   ถ้าไม่ได้ส่ง pre มา ฟอร์มทำงานเหมือนเดิมทั้งหมด */
if(pre){(function(){
  var fm=document.getElementById("lv-f");if(!fm)return;
  function put(id2,v){var x=document.getElementById(id2);if(x&&v!=null&&String(v)!=="")x.value=v}
  put("lvf-type",pre.leave_type);
  var want=String(pre.mode||"FULL");
  var mb2=document.getElementById("lvf-mode");
  var mbtn=mb2?mb2.querySelector('.seg-btn[data-mode="'+want+'"]'):null;
  if(mbtn)mbtn.click();                      /* ใช้ตัวจัดการเดิม เพื่อให้ซ่อน/แสดงช่องถูกต้อง */
  put("lvf-start",pre.start_date);
  put("lvf-end",want==="FULL"?(pre.end_date||pre.start_date):pre.start_date);
  if(want==="HOURLY"){put("lvf-st",String(pre.start_time||"").slice(0,5));
    put("lvf-et",String(pre.end_time||"").slice(0,5))}
  var ta=fm.querySelector('textarea[name="reason"]');if(ta&&pre.reason)ta.value=pre.reason;
  if(pre.ret_reason||pre.ret_who||pre.ret_at){
    var bar=document.createElement("div");bar.className="lv-ret-bar";
    bar.innerHTML='<b>'+icon("undo","ic-sm")+" คำขอนี้ถูกส่งคืนให้แก้ไข"+
      (pre.ret_no?" (เลขที่เดิม "+esc(pre.ret_no)+")":"")+"</b>"+
      (pre.ret_reason?"<span>เหตุผล: "+esc(pre.ret_reason)+"</span>":"")+
      ((pre.ret_who||pre.ret_at)?"<small>"+esc([pre.ret_who?"โดย "+pre.ret_who:"",pre.ret_at||""]
        .filter(function(x){return!!x}).join(" · "))+"</small>":"");
    fm.insertBefore(bar,fm.firstChild)}
  updateSum()})()}
document.getElementById("lvf-cancel").onclick=closeModal;document.getElementById("lvf-send").onclick=function(){var btn=this,err=document.getElementById("lvf-err");var d=calc();
/* [RUN-152] กันสุดท้าย — ค่าหมายเหตุ "ลาออก" ต้องไม่หลุดเข้าใบลาไม่ว่ากรณีใด
   ปกติ onchange คืนค่าเดิมไปแล้ว บรรทัดนี้คือด่านสำรองเท่านั้น */
if(String(d.typeId)===LVF_RESIGN){err.textContent="การลาออกใช้แบบฟอร์มแยก กรุณาเลือกประเภทการลาใหม่";return}
var lt=lvType(String(d.typeId));var b=lvBal[lt.code],hasQuota=!!(b&&b.quota!=null&&lt.code==="VACATION");err.textContent="";if(submitting||btn.disabled)return;if(!String(d.reason).trim()){err.textContent="กรุณาระบุเหตุผลการลา";return}if(!d.startDate||d.mode==="FULL"&&!d.endDate){err.textContent="กรุณาเลือกวันที่ให้ครบ";return}if(d.startDate>d.endDate){err.textContent="วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด";return}if(d.mode!=="HOURLY"&&d.days<=0){err.textContent="ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)";return}if(d.mode==="HOURLY"&&d.hours<=0){err.textContent="เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";return}/* [RUN-208] เดิมบล็อกไม่ให้ยื่นเมื่อเกินสิทธิ — เปลี่ยนเป็น "เตือนแต่ยื่นได้"
   คำเตือนแสดงอยู่ในกล่อง #lvf-vac ตั้งแต่ตอนเลือกวันแล้ว และผู้อนุมัติ
   เห็น สิทธิ/ใช้ไปแล้ว/คงเหลือ ในหน้าอนุมัติรายการ จึงตัดสินได้เอง
   ตัวแปร hasQuota/b ยังใช้วาดกล่องตัวเลข ไม่ได้ถูกถอดออก */submitting=true;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> กำลังส่ง…';function fail(msg){submitting=false;btn.disabled=false;btn.innerHTML="ส่งคำขอ";err.textContent=msg}Promise.all(files.map(function(f){return sbUploadLeaveFile(f.file,e.id)})).then(function(up){return sbRpc("njhr_leave_submit",{p_token:sbToken(),p_leave_type:lt.code,p_mode:d.mode,p_start_date:d.startDate,p_end_date:d.endDate,p_start_time:d.mode==="HOURLY"?String(d.startTime):null,p_end_time:d.mode==="HOURLY"?String(d.endTime):null,p_reason:String(d.reason).trim(),p_delegate:null,p_files:up.map(function(f){return{name:f.name,url:f.path,size:f.size}}),p_client_key:submitKey})}).then(function(r){return njExemptCheck().then(function(ex){return{r:r,ex:ex}},function(){return{r:r,ex:false}})}).then(function(o){var r=o.r,lvApproved=o.ex;var stText=lvApproved?"อนุมัติอัตโนมัติแล้ว":"รออนุมัติ";var no=r&&r.id?lvCode(r.id):"";var noEl=document.getElementById("lvf-no");if(noEl){noEl.textContent=no;noEl.classList.remove("muted")}closeModal();toast(r&&r.duplicated?"คำขอนี้ถูกส่งไปแล้ว เลขที่ "+no:(lvApproved?"บันทึกใบลาแล้ว เลขที่ ":"ส่งคำขอลาแล้ว เลขที่ ")+no+" · แนบไฟล์ "+(r&&r.file_count||0)+" ไฟล์ · สถานะ: "+stText);NJHR.features.leaveList.resetPage();refreshLeavePending();viewLeave(listEl);openModal(lvApproved?"บันทึกสำเร็จ":"ส่งคำขอสำเร็จ",'<div class="fm-done"><span class="fm-done-ic">'+icon("check")+"</span>"+"<b>"+(lvApproved?"บันทึกใบลาเรียบร้อย":"ส่งคำขอลาเรียบร้อย")+"</b>"+"<small>เลขที่คำขอ "+esc(no||"-")+" · สถานะ: "+stText+"</small></div>",'<button class="btn btn-ghost" id="fmd-again">ยื่นคำขอใหม่</button>'+'<button class="btn btn-primary" id="fmd-back">กลับหน้าคำขอ</button>',{fullMobile:true});document.getElementById("fmd-back").onclick=function(){closeModal();nav("#/requests")};document.getElementById("fmd-again").onclick=function(){closeModal();leaveForm(listEl)}}).catch(function(er){fail(er.message||"ส่งคำขอลาไม่สำเร็จ")})}}NJHR.features.leaveForm={open:leaveForm}})();
