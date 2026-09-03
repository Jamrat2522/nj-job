(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var icon=S.icon;var pad=S.pad;var nowStamp=S.nowStamp;var fmtDateDMY=S.fmtDateDMY;var esc=S.esc;var saveDB=S.saveDB;var emp=S.emp;var empName=S.empName;var dept=S.dept;var audit=S.audit;var toast=S.toast;var openModal=S.openModal;var closeModal=S.closeModal;var confirmDialog=S.confirmDialog;var render=S.render;var sbRpc=S.sbRpc;var sbToken=S.sbToken;var statusBadge=S.statusBadge;var db=S.db;var lvType=S.lvType;var reqFileOpen=S.reqFileOpen;var reqFileDownload=S.reqFileDownload;var rqState={seq:0,bal:[],err:""};var RQ_CARDS=[{key:"sick",cls:"rq-sick",em:"🤒",label:"ลาป่วย",match:["ป่วย","SICK"]},{key:"biz",cls:"rq-biz",em:"👤",label:"ลากิจ",match:["กิจ","PERSONAL","BUSINESS"]},{key:"vac",cls:"rq-vac",em:"🌴",label:"พักร้อน",match:["พักร้อน","VACATION","ANNUAL"]}];function lvIsVacation(code){var t=String(code||"").toUpperCase();return t.indexOf("VACATION")>=0||t.indexOf("ANNUAL")>=0||t.indexOf("พักร้อน")>=0}function lvUsedDays(r){var n=Number(r&&r.used);return isFinite(n)?Math.round(n*10)/10:0}function lvRemainDays(r){if(!r||r.remaining==null)return null;var n=Number(r.remaining);return isFinite(n)?Math.round(n*10)/10:null}function rqPick(rows,card){for(var i=0;i<rows.length;i++){var t=String(rows[i].leave_type||"").toUpperCase();for(var j=0;j<card.match.length;j++){if(t.indexOf(String(card.match[j]).toUpperCase())>=0)return rows[i]}}return null}function epNum(v){var n=Number(v);return isFinite(n)?n:0}function lvCode(x){if(x&&typeof x==="object"){var no=x.request_no||x.requestNo;if(no)return String(no);x=x.id}return"LV-"+String(x||"").slice(0,6).toUpperCase()}function reqInfoBar(e,submittedAt,noId){var nm=((e.title||"")+(e.firstName||"")+" "+(e.lastName||"")).trim()||"—";var dp=(e.deptId?dept(e.deptId):"")||e.deptName||"";if(!dp||dp==="—")dp="—";function cell(cls,label,val,id){return'<div class="'+cls+'"><small>'+label+"</small>"+"<b"+(id?' id="'+id+'" class="muted"':"")+">"+esc(val)+"</b></div>"}return'<div class="ot-req-info">'+cell("ri-no","เลขที่คำขอ","—",noId)+cell("ri-at","วันที่ยื่น",submittedAt)+cell("ri-nm","ผู้ยื่น",nm)+cell("ri-cd","รหัส",e.code||"—")+cell("ri-dp","แผนก",dp)+"</div>"}function bindFileButtons(box,files){if(!box)return;box.querySelectorAll("[data-fp]").forEach(function(b){b.onclick=function(ev){ev.preventDefault();var f=files[parseInt(b.dataset.fp,10)];if(f)reqFileOpen(f)}});box.querySelectorAll("[data-fd]").forEach(function(b){b.onclick=function(ev){ev.preventDefault();var f=files[parseInt(b.dataset.fd,10)];if(f)reqFileDownload(f)}})}function showTimeline(kind,id){var arr=kind==="leave"?db.leaves:kind==="ot"?db.ots:db.corrections;var it=arr.find(function(x){return x.id===id});if(!it)return;var jobsHTML=kind==="ot"?otJobsHTML(it):"";var noteHTML=kind==="ot"&&it.note?'<p class="muted note">หมายเหตุรวม: '+esc(it.note)+"</p>":"";openModal("Timeline · "+esc(id),noteHTML+jobsHTML+'<div class="timeline">'+it.timeline.map(function(tl){var cls=tl.action.indexOf("อนุมัติ")===0?"tl-ok":tl.action.indexOf("ไม่อนุมัติ")===0?"tl-bad":tl.action.indexOf("ยกเลิก")===0?"tl-mut":"tl-info";return'<div class="tl-item '+cls+'"><span class="tl-dot"></span><div><b>'+esc(tl.action)+"</b><small>"+esc(tl.by)+" · "+esc(tl.at)+"</small>"+(tl.note?"<p>"+esc(tl.note)+"</p>":"")+"</div></div>"}).join("")+"</div>",'<button class="btn btn-ghost" id="tl-close">ปิด</button>');document.getElementById("tl-close").onclick=closeModal;if(kind==="ot")otBindJobFiles(document.getElementById("modal-root"),it)}function lvModeTH(row,meta){var u=String(row&&row.leave_unit||"");if(u==="halfday"){var m=String(meta||"");return m==="HALF_AM"?"ครึ่งวันเช้า":m==="HALF_PM"?"ครึ่งวันบ่าย":"ครึ่งวัน"}if(u==="hour")return"รายชั่วโมง";return"เต็มวัน"}function lvHM(v){return v?String(v).slice(0,5):""}function lvDT(v){if(!v)return"—";var s=String(v);return s.length>16?s.slice(0,16).replace("T"," "):s}function lvRow(label,val){if(val==null||val===""||val==="—")return"";return'<div class="lvd-row"><span class="lvd-k">'+esc(label)+"</span>"+'<span class="lvd-v">'+esc(String(val))+"</span></div>"}function lvShowTimeline(id,row){openModal("รายละเอียดคำขอลา · "+esc(lvCode(id)),'<div class="muted">กำลังโหลด…</div>','<button class="btn btn-ghost" id="tl-close">ปิด</button>');var closeBtn=document.getElementById("tl-close");if(closeBtn)closeBtn.onclick=closeModal;return sbRpc("njhr_leave_detail",{p_token:sbToken(),p_leave_id:id}).then(function(d){var body=document.querySelector("#modal-root .modal-body");if(!body||!d)return;var files=d.attachments||[];var tl=(d.approvals||[]).slice().sort(function(a,b){return(a.seq||0)-(b.seq||0)});var meta0=tl[0]&&tl[0].meta&&tl[0].meta.mode||"";var r=row||{};var isHour=String(r.leave_unit||"")==="hour";var qty=isHour?r.hours!=null?Number(r.hours)+" ชั่วโมง":"":r.total_days!=null?Number(r.total_days)+" วัน":"";var period=r.start_date&&r.end_date&&r.start_date!==r.end_date?fmtDateDMY(r.start_date)+" – "+fmtDateDMY(r.end_date):r.start_date?fmtDateDMY(r.start_date):"";var timeRange=isHour&&r.start_time&&r.end_time?lvHM(r.start_time)+" – "+lvHM(r.end_time):"";var detailHTML=row?'<div class="lvd">'+lvRow("เลขคำขอ",d.request_no||lvCode(id))+lvRow("ชื่อพนักงาน",d.emp_name||r.emp_name)+lvRow("รหัสพนักงาน",r.emp_code)+lvRow("แผนก",r.department)+lvRow("ประเภทการลา",lvType(d.leave_type||r.leave_type).name)+lvRow("วันที่ลา",period)+lvRow("รูปแบบ",lvModeTH(r,meta0))+lvRow("จำนวน",qty)+lvRow("ช่วงเวลา",timeRange)+lvRow("เหตุผล",r.reason)+'<div class="lvd-row"><span class="lvd-k">สถานะ</span><span class="lvd-v">'+statusBadge(d.ui_status||d.status||r.ui_status||r.status)+"</span></div>"+lvRow("ส่งคำขอเมื่อ",lvDT(r.created_at))+"</div>":"";body.innerHTML=detailHTML+(files.length?'<div class="otj-flist">'+files.map(function(f,i){return'<div class="otj-file"><span class="otj-fname">'+icon("fileText","ic-sm")+" "+esc(f.name)+"</span>"+'<button type="button" class="btn-icon" data-fp="'+i+'" aria-label="ดู">'+icon("eye")+"</button>"+'<button type="button" class="btn-icon" data-fd="'+i+'" aria-label="ดาวน์โหลด">'+icon("download")+"</button></div>"}).join("")+"</div>":"")+'<div class="lvd-tl-h">ประวัติการดำเนินการ</div>'+'<div class="timeline">'+tl.map(function(x){var act=x.action_th||{SUBMIT:"ส่งคำขอ",APPROVE:"อนุมัติ",REJECT:"ไม่อนุมัติ",INFO:"ขอข้อมูลเพิ่ม",CANCEL:"ยกเลิกคำขอ"}[x.action]||x.action;var cls=x.action==="APPROVE"?"tl-ok":x.action==="REJECT"?"tl-bad":x.action==="CANCEL"?"tl-mut":"tl-info";return'<div class="tl-item '+cls+'"><span class="tl-dot"></span><div><b>'+esc(act)+"</b>"+"<small>"+esc(x.by_name||"")+" · "+esc(x.at||"")+"</small>"+(x.note?"<p>"+esc(x.note)+"</p>":"")+"</div></div>"}).join("")+"</div>";bindFileButtons(body,files)}).catch(function(er){var body=document.querySelector("#modal-root .modal-body");if(body)body.innerHTML='<div class="form-error">'+esc(er.message||"โหลดรายละเอียดไม่สำเร็จ")+"</div>"})}function otJobsHTML(it){var js=otJobsOf(it);if(!js.length)return"";var e0=emp(it.empId);return'<div class="otj-view">'+'<div class="otj-vhead"><b>รายการงาน OT ('+js.length+" รายการ)</b>"+'<small class="muted">'+esc(it.id)+" · "+esc(e0?e0.code:"")+" "+esc(empName(it.empId))+" · "+esc(it.deptSnap||dept(e0?e0.deptId:""))+" · "+esc(it.positionSnap||(e0?e0.position:"")||"-")+" · ยื่น "+esc(it.createdAt||"")+"</small></div>"+(it.note?'<p class="otj-note">หมายเหตุรวม: '+esc(it.note)+"</p>":"")+js.map(function(j){var files=j.files||[];return'<div class="otj-vrow"><div class="otj-vtop">'+'<span class="chip">รายการที่ '+j.no+"</span><b>JOB "+esc(j.job)+"</b>"+(j.jobType?'<span class="chip chip-info">'+esc(j.jobType)+"</span>":"")+'<span class="muted">'+otDMY(j.date)+" · "+esc(j.start)+" – "+esc(j.end)+(j.nextDay?" (สิ้นสุดวันที่ "+otDMY(j.endDate||otJobEndDate(j))+")":"")+"</span>"+'<span class="chip">'+(isFinite(j.hours)?j.hours:otJobHours(j))+" ชม.</span></div>"+(j.detail?'<p class="otj-vdetail">'+esc(j.detail)+"</p>":"")+(files.length?'<div class="otj-flist"><small class="muted">ไฟล์แนบของรายการที่ '+j.no+" (JOB "+esc(j.job)+") · "+files.length+" ไฟล์</small>"+files.map(function(f,fi){return'<div class="otj-file"><span class="otj-fname">'+icon("fileText","ic-sm")+" "+esc(f.name)+"</span>"+'<button type="button" class="btn-icon" data-jview="'+j.no+"-"+fi+'" aria-label="ดู">'+icon("eye")+"</button>"+'<button type="button" class="btn-icon" data-jdl="'+j.no+"-"+fi+'" aria-label="ดาวน์โหลด">'+icon("download")+"</button></div>"}).join("")+"</div>":'<small class="muted">ไม่มีไฟล์แนบในรายการนี้</small>')+"</div>"}).join("")+'<div class="otj-sum">รวม <b>'+js.length+"</b> รายการ | OT รวม <b>"+otReqHours(it)+"</b> ชั่วโมง | ไฟล์แนบ <b>"+otFileCount(it)+"</b> ไฟล์</div></div>"}function otJobsOf(o){if(o&&o.jobs&&o.jobs.length)return o.jobs;if(!o)return[];return[{no:1,job:o.task?String(o.task):"(ไม่ระบุ JOB)",detail:o.reason||"",jobType:"",date:o.date,start:o.start,end:o.end,nextDay:false,hours:epNum(o.hours),files:o.file?[{name:o.file,data:""}]:[],legacy:true}]}function otJobHours(j){var sp=otSpan(j);return sp?Math.round((sp.e-sp.s)/60*100)/100:0}function otJobEndDate(j){return j.nextDay?otNextDay(j.date):j.date}function otMin(t){var p=String(t||"").split(":");return p.length>=2?+p[0]*60+ +p[1]:null}function otDayIdx(iso){var d=new Date(String(iso)+"T00:00:00");return isFinite(d)?Math.round(d.getTime()/864e5):null}function otNextDay(iso){var d=new Date(String(iso)+"T00:00:00");if(!isFinite(d))return iso;d.setDate(d.getDate()+1);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}function otSpan(j){var di=otDayIdx(j.date),st=otMin(j.start),en=otMin(j.end);if(di===null||st===null||en===null)return null;var s0=di*1440+st;var e0=di*1440+en+(j.nextDay?1440:0);if(e0<=s0)return null;return{s:s0,e:e0}}function otDMY(iso){return fmtDateDMY(iso)}function bindReqCardActions(el,kind){el.querySelectorAll("[data-detail]").forEach(function(b){b.onclick=function(){showTimeline(kind,this.dataset.detail)}});el.querySelectorAll("[data-cancel]").forEach(function(b){b.onclick=function(){var id=this.dataset.cancel;confirmDialog("ยกเลิกคำขอ","ต้องการยกเลิกคำขอ <b>"+esc(id)+"</b> ใช่หรือไม่","ยกเลิกคำขอ",function(){var arr=kind==="leave"?db.leaves:db.ots;var it=arr.find(function(x){return x.id===id});it.status="CANCELLED";it.timeline.push({at:nowStamp(),by:empName(it.empId),action:"ยกเลิกคำขอ",note:""});audit("CANCEL","ยกเลิก "+id);saveDB();toast("ยกเลิกคำขอแล้ว","info");render()},true)}})}function otBindJobFiles(scope,it){if(!scope||!it)return;var js=otJobsOf(it);function jf(key){var p=String(key).split("-");var j=js.find(function(x){return x.no===parseInt(p[0],10)});return j&&j.files&&j.files[parseInt(p[1],10)]}scope.querySelectorAll("[data-jview]").forEach(function(b){b.onclick=function(ev){ev.preventDefault();var f=jf(b.dataset.jview);if(f)reqFileOpen(f)}});scope.querySelectorAll("[data-jdl]").forEach(function(b){b.onclick=function(ev){ev.preventDefault();var f=jf(b.dataset.jdl);if(f)reqFileDownload(f)}})}function otReqHours(o){var js=otJobsOf(o);return Math.round(js.reduce(function(n,j){return n+(isFinite(j.hours)?Number(j.hours):otJobHours(j))},0)*100)/100}function otFileCount(o){return otJobsOf(o).reduce(function(n,j){return n+(j.files&&j.files.length||0)},0)}function apAct(p){return String(p&&p.action||"").toUpperCase()}
function apIsDone(p){var a=apAct(p);return a==="APPROVE"||a==="AUTO_APPROVE_EXEMPT"}
function apIsRej(p){return apAct(p)==="REJECT"}
function apPerson(p){var n=String(p&&p.name||"").trim(),k=String(p&&p.nickname||"").trim();return k?n+" ("+k+")":(n||"—")}
/* [RUN-120b] อ่าน Event ล่าสุดจาก approvals — รองรับทั้ง 2 รูปแบบที่ RPC จริงส่งมา
   raw (njhr_leave_list / njhr_leave_detail) : action · at · note · by_name · seq
   normalized (njhr_*_feed)                  : action · action_at · reason · approver_name · seq */
function apEvAct(x){return String(x&&x.action||"").toUpperCase()}
function apEvWho(x){if(!x)return"";var n=String(x.approver_name||x.by_name||"").trim();var k=String(x.approver_nickname||"").trim();return k?n+" ("+k+")":n}
function apEvNote(x){return String(x&&(x.reason||x.note)||"").trim()}
function apEvAtRaw(x){return String(x&&(x.action_at||x.at)||"").trim()}
/* DD/MM/YYYY HH:mm — 'YYYY-MM-DD HH:MI' ที่ RPC แปลง Asia/Bangkok มาแล้วอ่านตรง ๆ ห้ามแปลงซ้ำ */
function apAt(v){
  var t=String(v==null?"":v).trim();if(!t)return"";
  var m=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(t);
  var tz=/[Zz]$|[+-]\d{2}:?\d{2}$/.test(t);
  if(m&&!tz)return m[3]+"/"+m[2]+"/"+m[1]+" "+m[4]+":"+m[5];
  var d=new Date(t);
  if(isNaN(d.getTime()))return m?m[3]+"/"+m[2]+"/"+m[1]+" "+m[4]+":"+m[5]:t;
  function p2(x){return(x<10?"0":"")+x}
  return p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear()+" "+p2(d.getHours())+":"+p2(d.getMinutes());
}
/* Event ล่าสุดของ action ที่ต้องการ — เรียงตาม seq จริง (fallback = ลำดับในอาเรย์) */
function apLastEvent(r,acts){
  var list=(r&&Array.isArray(r.approvals))?r.approvals:[];
  var want={},best=null,bestKey=-1;
  (acts||[]).forEach(function(a){want[String(a).toUpperCase()]=1});
  for(var i=0;i<list.length;i++){
    var x=list[i];if(!want[apEvAct(x)])continue;
    var sq=Number(x&&x.seq);var key=isFinite(sq)?sq:i;
    if(key>=bestKey){bestKey=key;best=x}
  }
  return best;
}
function apStepOf(steps,no){for(var i=0;i<(steps||[]).length;i++){if(Number(steps[i].step_no)===Number(no))return steps[i]}return null}
/* [RUN-120] สรุปสถานะ Approval จาก Workflow จริง
   แดง = ยังไม่จบ Workflow (ทุกกรณี) · เขียว = APPROVED ครบทุก Step เท่านั้น
   ALL  → คนที่ยังไม่ APPROVE ในขั้นปัจจุบัน = "ยังขาด" ทุกคน
   ANY  → ถ้ายังไม่มีใครอนุมัติ = รอทุกคน · ถ้ามีคนอนุมัติแล้ว Backend เดินขั้นต่อทันที
          จึงไม่มีทางค้างที่ขั้นเดิม และห้ามบอกว่าคนอื่น "ยังขาด" */
function apStatus(r){
  r=r||{};
  var raw=String(r.ui_status||r.status||"").toUpperCase();
  var steps=Array.isArray(r.steps)?r.steps:[];
  var cur=Number(r.current_step)||0;
  var o={kind:"PENDING",tone:"red",mark:"🔴",title:"ยังอนุมัติไม่ครบ",badge:"badge-warn",
         stepNo:null,stepName:"",stepMode:"",done:0,total:0,missing:[],doneList:[],
         steps:steps,note:"",who:"",whoLabel:"",reason:"",at:""};
  var ev=null;
  if(raw.indexOf("CANCEL")>=0){o.kind="CANCELLED";o.tone="mut";o.mark="⚪";o.title="ยกเลิกแล้ว";o.badge="badge-mut";return o}
  if(raw.indexOf("REJECT")>=0){o.kind="REJECTED";o.tone="red";o.mark="⛔";o.title="ไม่อนุมัติ";o.badge="badge-bad";ev=apLastEvent(r,["REJECT"]);o.whoLabel="ผู้ไม่อนุมัติ";if(ev){o.who=apEvWho(ev);o.reason=apEvNote(ev);o.at=apAt(apEvAtRaw(ev))}return o}
  if(raw.indexOf("APPROV")>=0||raw==="COMPLETED"){o.kind="APPROVED";o.tone="green";o.mark="🟢";o.title="อนุมัติครบแล้ว";o.badge="badge-ok";ev=apLastEvent(r,["APPROVE","AUTO_APPROVE_EXEMPT"]);o.whoLabel="ผู้อนุมัติ";if(ev){o.who=apEvWho(ev);o.at=apAt(apEvAtRaw(ev))}if(!o.at&&r.approved_at)o.at=apAt(r.approved_at);return o}
  if(raw==="NEED_MORE_INFO"){o.kind="NEED_MORE_INFO";o.title="ต้องส่งข้อมูลเพิ่มเติม";ev=apLastEvent(r,["INFO"]);o.whoLabel="ผู้ขอข้อมูลเพิ่ม";if(ev){o.who=apEvWho(ev);o.reason=apEvNote(ev);o.at=apAt(apEvAtRaw(ev))}}
  if(!steps.length){o.note="ยังไม่มีผังการอนุมัติผูกกับคำขอนี้";return o}
  var st=apStepOf(steps,cur)||steps[0];
  if(!st)return o;
  o.stepNo=Number(st.step_no)||null;
  o.stepName=String(st.step_name||"");
  o.stepMode=String(st.step_mode||"").toUpperCase();
  var ap=Array.isArray(st.approvers)?st.approvers:[];
  o.total=Number(st.approver_total)||ap.length;
  o.done=ap.filter(apIsDone).length;
  o.doneList=ap.filter(apIsDone).map(apPerson);
  o.missing=ap.filter(function(p){return!apIsDone(p)&&!apIsRej(p)}).map(apPerson);
  if(o.kind==="PENDING"){
    if(o.stepMode==="ANY"&&o.done>0)o.title="รอการอนุมัติขั้นถัดไป";
    else if(o.stepMode==="ANY")o.title="ยังไม่มีผู้อนุมัติ";
    else if(o.total)o.title="รออนุมัติ "+o.done+"/"+o.total+" คน";
  }
  if(o.stepMode==="ANY"&&o.done>0)o.missing=[];
  return o;
}
/* Badge สั้น — ใช้ในตาราง/การ์ด ทั้ง Desktop และ Mobile */
function apChip(r){var a=apStatus(r);
  return'<span class="ap-chip ap-'+a.tone+'">'+a.mark+" "+esc(a.title)+"</span>"}
/* บล็อกสรุป — ขั้นปัจจุบัน · อนุมัติแล้วกี่คน · ยังขาดใคร (เห็นทันทีไม่ต้องกดหลายชั้น) */
function apSummaryHTML(r){
  var a=apStatus(r);
  var h='<div class="ap-sum ap-'+a.tone+'"><div class="ap-sum-h">'+a.mark+" <b>"+esc(a.title)+"</b></div>";
  if(a.who)h+='<div class="ap-sum-r"><span>'+esc(a.whoLabel||"ผู้ดำเนินการ")+"</span><b>"+esc(a.who)+"</b></div>";
  if(a.reason)h+='<div class="ap-sum-r"><span>เหตุผล</span><b>'+esc(a.reason)+"</b></div>";
  if(a.at)h+='<div class="ap-sum-r"><span>'+(a.kind==="APPROVED"?"วันที่อนุมัติ":"วันที่")+"</span><b>"+esc(a.at)+"</b></div>";
  if(a.kind==="PENDING"||a.kind==="NEED_MORE_INFO"){
    if(a.stepNo!=null)h+='<div class="ap-sum-r"><span>ขั้นปัจจุบัน</span><b>ขั้นที่ '+esc(String(a.stepNo))+
      (a.stepName?" "+esc(a.stepName):"")+(a.stepMode?' <i class="ap-mode">'+esc(a.stepMode)+"</i>":"")+"</b></div>";
    if(a.total)h+='<div class="ap-sum-r"><span>อนุมัติแล้ว</span><b>'+a.done+"/"+a.total+" คน</b></div>";
    if(a.missing.length)h+='<div class="ap-sum-r ap-miss"><span>ยังขาด</span><b>'+
      a.missing.map(function(x){return esc(x)}).join("<br>")+"</b></div>";
    if(a.note)h+='<div class="ap-sum-r"><span></span><b class="muted">'+esc(a.note)+"</b></div>";
  }
  h+="</div>";
  return h;
}
/* รายชื่อผู้อนุมัติทุกขั้น เรียง step_no ASC · เลขเริ่ม 1 ใหม่ทุกขั้น */
function apStepsHTML(r){
  var a=apStatus(r),cur=Number(r&&r.current_step)||0,steps=a.steps;
  if(!steps.length)return"";
  var closed=(a.kind==="APPROVED"||a.kind==="REJECTED"||a.kind==="CANCELLED");
  return'<div class="ap-steps">'+steps.map(function(s){
    var no=0,mode=String(s.step_mode||"").toUpperCase();
    var ap=Array.isArray(s.approvers)?s.approvers:[];
    var isCur=!closed&&cur&&Number(s.step_no)===cur;
    var passed=closed||(cur&&Number(s.step_no)<cur);
    return'<div class="ap-step'+(isCur?" on":"")+'">'+
      '<div class="ap-step-h">ขั้นที่ '+esc(String(s.step_no))+(s.step_name?" — "+esc(s.step_name):"")+
      (mode?' <i class="ap-mode">'+esc(mode)+"</i>":"")+
      (isCur?' <span class="ap-cur">ขั้นปัจจุบัน</span>':"")+"</div><ul>"+
      ap.map(function(p){
        no++;
        var ok=apIsDone(p),bad=apIsRej(p);
        var txt=ok?"✅ อนุมัติแล้ว":bad?"⛔ ไม่อนุมัติ":
          (mode==="ANY"&&passed)?"— ไม่ต้องอนุมัติ":isCur?"🔴 ยังไม่อนุมัติ":"⚪ รอดำเนินการ";
        return'<li class="'+(ok?"ok":bad?"bad":isCur?"wait":"idle")+'">'+
          '<span class="ap-mk">'+no+".</span>"+
          '<span class="ap-nm">'+esc(apPerson(p))+"</span>"+
          '<span class="ap-sep">:</span><b>'+txt+"</b></li>"
      }).join("")+"</ul></div>"
  }).join("")+"</div>";
}
NJHR.compat.scope.apStatus=apStatus;NJHR.compat.scope.apChip=apChip;NJHR.compat.scope.apSummaryHTML=apSummaryHTML;NJHR.compat.scope.apStepsHTML=apStepsHTML;NJHR.compat.scope.apPerson=apPerson;NJHR.compat.scope.RQ_CARDS=RQ_CARDS;NJHR.compat.scope.bindFileButtons=bindFileButtons;NJHR.compat.scope.epNum=epNum;NJHR.compat.scope.lvCode=lvCode;NJHR.compat.scope.lvIsVacation=lvIsVacation;NJHR.compat.scope.lvRemainDays=lvRemainDays;NJHR.compat.scope.lvShowTimeline=lvShowTimeline;NJHR.compat.scope.lvUsedDays=lvUsedDays;NJHR.compat.scope.otDMY=otDMY;NJHR.compat.scope.otJobEndDate=otJobEndDate;NJHR.compat.scope.otJobHours=otJobHours;NJHR.compat.scope.otJobsHTML=otJobsHTML;NJHR.compat.scope.otJobsOf=otJobsOf;NJHR.compat.scope.otSpan=otSpan;NJHR.compat.scope.reqInfoBar=reqInfoBar;NJHR.compat.scope.rqPick=rqPick;NJHR.compat.scope.rqState=rqState;NJHR.compat.scope.showTimeline=showTimeline})();
