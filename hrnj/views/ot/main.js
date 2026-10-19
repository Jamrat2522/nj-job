(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var icon=S.icon;var fmtDateDMY=S.fmtDateDMY;var esc=S.esc;var avatarHTML=S.avatarHTML;var saveDB=S.saveDB;var emp=S.emp;var currentUser=S.currentUser;var currentEmp=S.currentEmp;var toast=S.toast;var closeModal=S.closeModal;var confirmDialog=S.confirmDialog;var sbReady=S.sbReady;var sbRpcList=S.sbRpcList;var sbRpc=S.sbRpc;var sbToken=S.sbToken;var refreshOtPending=S.refreshOtPending;var emptyState=S.emptyState;var statusBadge=S.statusBadge;var db=S.db;/* [RUN-133] ใช้สำหรับ Modal เพิ่มเอกสาร/ส่งใหม่ — โหลดมาก่อนแล้วผ่าน shared-attachments */var openModal=S.openModal;var sbUploadOtFile=S.sbUploadOtFile;var reqFileOpen=S.reqFileOpen;var reqFileDownload=S.reqFileDownload;var otReturned={};var otFilter="";function otOpenAction(mod,btn,fn){if(!btn||btn.getAttribute("data-busy")==="1")return;var navId=NJHR.router.navId(),route=NJHR.state.currentRoute;function ok(){return navId===NJHR.router.navId()&&route===NJHR.state.currentRoute&&!!currentUser()}if(NJHR.modules.isLoaded(mod)){if(ok())fn();return}var html=btn.innerHTML,dis=btn.disabled;btn.setAttribute("data-busy","1");btn.disabled=true;btn.innerHTML='<span class="spinner"></span>';function restore(){btn.removeAttribute("data-busy");btn.disabled=dis;btn.innerHTML=html}NJHR.modules.load(mod).then(function(){restore();if(ok())fn()})["catch"](function(e){restore();try{console.error("[MODULE] "+(e&&e.message?e.message:e))}catch(e2){}if(ok())toast("ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่","error")})}var otSbRows=null,otErr="",otSeq=0,otBusy=false;function otHM(v){return String(v==null?"":v).slice(0,5)}function otNum(v){var n=Number(v);return isFinite(n)?Math.round(n*100)/100:0}function otReqNo(o){return String(o.request_no||o.id||"")}function otKind(o){return o.is_holiday?"OT วันหยุด":"OT ปกติ"}function otHoursTxt(o){var raw=o.ot_hours;if(raw===null||raw===undefined||raw==="")return"—";var n=Number(raw);if(!isFinite(n))return"—";return Math.round(n*100)/100+" ชั่วโมง"}var otJtMap={};function otFirstJobType(o){var v=otJtMap[String(o.id)];return v===undefined||v===null||v===""?"—":v}function otLoadJobTypes(rows){var need=(rows||[]).filter(function(o){return otJtMap[String(o.id)]===undefined&&(Number(o.jobs_count)||0)>0});if(!need.length)return Promise.resolve();return Promise.all(need.map(function(o){return sbRpc("njhr_ot_get",{p_token:sbToken(),p_id:o.id}).then(function(r){var d=r&&r.data?r.data:r;var js=d&&d.jobs||[];var first=null;js.forEach(function(j){var no=Number(j.no);if(!isFinite(no))return;if(!first||no<Number(first.no))first=j});otJtMap[String(o.id)]=first&&String(first.job_type||"").trim()||""})["catch"](function(er){console.error("[OT] njhr_ot_get (ประเภทงาน) ล้มเหลว:",er);otJtMap[String(o.id)]=""})}))}function otDeskTable(rows){return'<div class="card p0 only-desktop lvt-wrap"><table class="lvt lvt-ot">'+"<thead><tr>"+"<th>เลขคำขอ</th><th>ชื่อพนักงาน</th><th>ประเภท</th><th>ประเภทงาน</th><th>วันที่</th>"+"<th>ช่วงเวลา</th><th>จำนวนชั่วโมง</th><th>ไฟล์แนบ</th><th>สถานะ</th>"+'<th class="lvt-act-h"></th>'+"</tr></thead><tbody>"+rows.map(function(o){return otDeskRow(o)}).join("")+"</tbody></table></div>"}function otWho(o){var full=String((o.prefix||"")+(o.emp_name||"")).trim();return full||"—"}function otDeskRow(o){var fileN=Number(o.files_count)||0;return"<tr>"+'<td class="lvt-c-no"><b>'+esc(otReqNo(o))+"</b></td>"+'<td class="lvt-c-emp"><b>'+esc(otWho(o))+"</b></td>"+'<td class="lvt-c-type"><b>'+esc(otKind(o))+"</b></td>"+'<td class="lvt-c-jt"><b>'+esc(otFirstJobType(o))+"</b></td>"+'<td class="lvt-c-date"><b>'+fmtDateDMY(o.ot_date)+"</b></td>"+'<td class="lvt-c-time"><b>'+esc(otHM(o.start_time))+" – "+esc(otHM(o.end_time))+(o.spans_next_day?" (+1 วัน)":"")+"</b></td>"+'<td class="lvt-c-hrs"><b>'+esc(otHoursTxt(o))+"</b></td>"+'<td class="lvt-c-file">'+(fileN?'<span class="lvt-file">'+icon("paperclip","ic-sm")+"<span>"+fileN+" ไฟล์</span></span>":'<span class="muted">ไม่มีไฟล์แนบ</span>')+"</td>"+'<td class="lvt-c-st">'+statusBadge(o.status)+otReturnChip(o)+"</td>"+'<td class="lvt-c-act"><div class="lvt-acts">'+'<button type="button" class="btn-icon lv-eye" data-detail="'+esc(o.id)+'" '+'aria-label="ดูรายละเอียด" title="ดูรายละเอียด">'+icon("eye")+"</button>"+otRedocBtn(o)+(o.status==="PENDING"?'<button class="btn btn-ghost btn-sm t-red" data-cancel="'+esc(o.id)+'">ยกเลิกคำขอ</button>':"")+"</div></td></tr>"}function otMobileCard(o){var jobN=Number(o.jobs_count)||0,fileN=Number(o.files_count)||0;return'<div class="card req-card only-mobile">'+'<div class="req-top">'+avatarHTML(o.emp_name||"",40)+'<div class="grow"><b>'+fmtDateDMY(o.ot_date)+"</b><small>"+esc(otReqNo(o))+"</small></div>"+statusBadge(o.status)+"</div>"+otReturnNote(o)+'<div class="req-body"><span class="chip chip-info">'+esc(otHM(o.start_time))+" – "+esc(otHM(o.end_time))+"</span><span><b>"+otNum(o.ot_hours)+"</b> ชั่วโมง</span></div>"+'<p class="req-reason">'+esc(o.reason||"")+(jobN?' · <span class="chip">'+jobN+" รายการงาน</span>":"")+(fileN?' <span class="chip">'+fileN+" ไฟล์</span>":"")+"</p>"+'<div class="req-actions"><button class="btn btn-ghost btn-sm" data-detail="'+esc(o.id)+'">รายละเอียด / Timeline</button>'+otRedocBtn(o)+(o.status==="PENDING"?'<button class="btn btn-ghost btn-sm t-red" data-cancel="'+esc(o.id)+'">ยกเลิกคำขอ</button>':"")+"</div></div>"}function otCancel(id,el){var row=(otSbRows||[]).find(function(x){return String(x.id)===String(id)});confirmDialog("ยกเลิกคำขอ","ต้องการยกเลิกคำขอ <b>"+esc(row?otReqNo(row):id)+"</b> ใช่หรือไม่","ยกเลิกคำขอ",function(){if(otBusy)return;otBusy=true;return sbRpc("njhr_ot_decide",{p_token:sbToken(),p_id:id,p_action:"CANCEL",p_note:null}).then(function(){otBusy=false;closeModal();toast("ยกเลิกคำขอแล้ว","info");refreshOtPending();viewOT(el)})["catch"](function(er){otBusy=false;closeModal();console.error("[OT] njhr_ot_decide (CANCEL) ล้มเหลว:",er);toast(er&&er.message||"ยกเลิกคำขอไม่สำเร็จ","error")})},true)}function otLoad(el){var seq=++otSeq;otSbRows=null;otErr="";otPaint(el);if(!sbReady()||!sbToken()){otSbRows=[];otErr="ยังไม่ได้เชื่อมต่อ Supabase — โหลดคำขอ OT ไม่ได้";otPaint(el);return}sbRpcList("njhr_ot_list",{p_token:sbToken(),p_from:null,p_to:null,p_status:otFilter||null,p_dept:null,p_employee:null,p_q:null,p_mine:true,p_limit:200,p_offset:0}).then(function(rows){if(seq!==otSeq)return;var list=rows||[];return otLoadJobTypes(list).then(function(){return otLoadReturned()}).then(function(){if(seq!==otSeq)return;otSbRows=list;otErr="";otPaint(el)})})["catch"](function(er){if(seq!==otSeq)return;otSbRows=[];console.error("[OT] njhr_ot_list ล้มเหลว:",er);otErr="โหลดคำขอ OT จาก Supabase ไม่สำเร็จ: "+(er&&er.message||er);otPaint(el)})}function otPaint(el){var box=document.getElementById("ot-list");if(!box)return;var eb=document.getElementById("ot-err");if(eb)eb.textContent=otErr||"";if(otSbRows===null){box.innerHTML='<div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div>';return}box.innerHTML=otSbRows.length?otDeskTable(otSbRows)+otSbRows.map(otMobileCard).join(""):'<div class="card">'+emptyState(otErr?"ไม่สามารถแสดงข้อมูลได้":"ยังไม่มีคำขอ OT")+"</div>";box.onclick=function(ev){var b=ev.target.closest?ev.target.closest("[data-detail],[data-cancel],[data-redoc]"):null;if(!b||!box.contains(b))return;if(b.dataset.redoc){otRedocOpen(b.dataset.redoc,el);return}if(b.dataset.cancel){otCancel(b.dataset.cancel,el);return}otOpenAction("request-detail",b,function(){NJHR.features.requestDetail.open("OT",b.dataset.detail,el)})}}function viewOT(el){var e=currentEmp();if(!e){el.innerHTML=emptyState("บัญชีนี้ไม่ได้ผูกกับพนักงาน");return}el.innerHTML='<div class="toolbar"><h3>คำขอ OT ของฉัน</h3>'+'<select id="ot-filter"><option value="">ทุกสถานะ</option>'+["PENDING","APPROVED","REJECTED","CANCELLED"].map(function(st){return'<option value="'+st+'"'+(otFilter===st?" selected":"")+">"+{PENDING:"รออนุมัติ",APPROVED:"อนุมัติแล้ว",REJECTED:"ไม่อนุมัติ",CANCELLED:"ยกเลิกแล้ว"}[st]+"</option>"}).join("")+"</select>"+'<span class="grow"></span>'+'<button class="btn btn-ghost only-desktop" id="ot-refresh" title="โหลดข้อมูลใหม่">'+icon("refresh")+" รีเฟรช</button>"+'<button class="btn btn-primary" id="ot-new">'+icon("plus")+" ขอ OT</button></div>"+'<div class="req-list" id="ot-list"></div>'+'<div class="form-error" id="ot-err" role="alert" style="white-space:pre-line"></div>';document.getElementById("ot-filter").onchange=function(){otFilter=this.value;viewOT(el)};(function(){var rf=document.getElementById("ot-refresh");if(!rf)return;rf.onclick=function(){var b=this;if(b.getAttribute("data-busy"))return;b.setAttribute("data-busy","1");b.disabled=true;b.innerHTML=icon("refresh")+" กำลังรีเฟรช…";try{viewOT(el)}catch(e2){b.removeAttribute("data-busy");b.disabled=false;b.innerHTML=icon("refresh")+" รีเฟรช";toast("โหลดข้อมูลใหม่ไม่สำเร็จ กรุณาลองใหม่","error")}}})();document.getElementById("ot-new").onclick=function(){otOpenAction("ot-form",this,function(){NJHR.features.otForm.open(el)})};otLoad(el);otPurgeLocalOts()}function otPurgeLocalOts(){if(!db.ots||!db.ots.length)return;var n=db.ots.length;db.ots.length=0;saveDB();try{console.info("[OT] ล้างข้อมูล OT ทดสอบในเบราว์เซอร์แล้ว "+n+" รายการ")}catch(e){}}
/* ══════════ [RUN-133] คำขอ OT ที่ถูกตีกลับ — เพิ่มเอกสาร / ส่งใหม่ ══════════
   สถานะ "ตีกลับ" มาจาก Backend เท่านั้น (njhr_ot_returned_list / njhr_ot_get)
   ห้าม infer จาก status=PENDING เพราะ PENDING ครอบทั้งรออนุมัติปกติและถูกตีกลับ
   ข้อมูลหลักของ OT เป็น Read-only — จัดการได้เฉพาะไฟล์แนบและหมายเหตุ */
function otLoadReturned(){
  return sbRpcList("njhr_ot_returned_list",{p_token:sbToken()}).then(function(rows){
    otReturned={};
    (rows||[]).forEach(function(r){ otReturned[String(r.ot_id)]={
      reason:r.reason||"", by_name:r.by_name||"", at:r.at_txt||"", step_no:r.step_no }; });
  })["catch"](function(er){ otReturned={};
    try{console.error("[OT] njhr_ot_returned_list ล้มเหลว:",er)}catch(e){} });
}
function otIsReturned(o){ return !!otReturned[String(o&&o.id)] }
function otReturnChip(o){ return otIsReturned(o)
  ? ' <span class="chip chip-warn ot-ret-chip">ตีกลับ — รอเอกสารเพิ่มเติม</span>' : "" }
function otReturnNote(o){
  var t=otReturned[String(o&&o.id)]; if(!t)return"";
  return '<p class="req-reason ot-ret-note"><b>ตีกลับ — รอเอกสารเพิ่มเติม</b>'+
    (t.reason?"<br>เหตุผล: "+esc(t.reason):"")+
    (t.by_name?"<br>โดย "+esc(t.by_name):"")+(t.at?" · "+esc(t.at):"")+"</p>";
}
function otRedocBtn(o){ return otIsReturned(o)
  ? '<button class="btn btn-primary btn-sm" data-redoc="'+esc(String(o.id))+'">เพิ่มเอกสาร / ส่งใหม่</button>' : "" }

function otRedocOpen(id,el){
  openModal("เพิ่มเอกสาร / ส่งใหม่",'<div class="muted">กำลังโหลด…</div>',
    '<button type="button" class="btn btn-ghost" id="otrd-close">ปิด</button>');
  var cb=document.getElementById("otrd-close"); if(cb)cb.onclick=closeModal;
  otRedocRender(id,el);
}
function otRedocRender(id,el){
  return sbRpc("njhr_ot_get",{p_token:sbToken(),p_id:id}).then(function(res){
    var d=res&&res.data?res.data:res;
    var body=document.querySelector("#modal-root .modal-body");
    var foot=document.querySelector("#modal-root .modal-foot");
    if(!body||!d)return;
    var rq=d.request||{}, jobs=d.jobs||[], files=d.attachments||[], ret=d["return"]||{};
    /* สถานะตีกลับยึดจาก Backend ล้วน ๆ */
    if(!d.returned){ body.innerHTML='<div class="card"><b>คำขอนี้ไม่ได้อยู่ระหว่างรอเอกสารเพิ่มเติมแล้ว</b>'+
      '<p class="muted">อาจมีผู้อนุมัติดำเนินการต่อไปแล้ว กรุณารีเฟรชรายการ</p></div>';
      if(foot)foot.innerHTML='<button type="button" class="btn btn-ghost" id="otrd-close">ปิด</button>';
      var c2=document.getElementById("otrd-close"); if(c2)c2.onclick=function(){closeModal();otLoad(el)};
      return; }
    var canEdit=d.can_edit_files===true;
    function ro(k,v){ return '<div class="lvd-row"><span class="lvd-k">'+esc(k)+'</span><span class="lvd-v">'+esc(v==null?"—":String(v))+'</span></div>' }
    body.innerHTML=
      '<div class="card ot-ret-box"><b>ตีกลับ — รอเอกสารเพิ่มเติม</b>'+
        (ret.reason?'<p class="ot-ret-reason">เหตุผล: '+esc(ret.reason)+'</p>':"")+
        '<small class="muted">'+(ret.by_name?"โดย "+esc(ret.by_name):"")+(ret.at?" · "+esc(ret.at):"")+
        (ret.step_no!=null?" · ขั้นที่ "+esc(String(ret.step_no)):"")+'</small></div>'+
      /* ── ข้อมูลคำขอ: Read-only ทั้งหมด ── */
      '<div class="lvd ot-ret-ro">'+
        ro("เลขที่คำขอ",otReqNo({request_no:rq.request_no,id:rq.id}))+
        ro("วันที่ OT",fmtDateDMY(rq.ot_date))+
        ro("เวลา",otHM(rq.start_time)+" – "+otHM(rq.end_time)+(rq.spans_next_day?" (+1 วัน)":""))+
        ro("จำนวนชั่วโมง",otNum(rq.ot_hours)+" ชั่วโมง")+
        ro("หมายเหตุรวม",rq.reason||"—")+
      '</div>'+
      '<h4 class="apm-h">รายการงาน ('+jobs.length+')</h4>'+
      '<div class="ot-ret-jobs">'+jobs.map(function(j){
        return '<div class="otj-vrow"><div class="otj-vtop">'+
          '<span class="chip">รายการที่ '+esc(String(j.no))+'</span><b>JOB '+esc(j.job_code||"-")+'</b>'+
          (j.job_type?'<span class="chip chip-info">'+esc(j.job_type)+'</span>':"")+
          '<span class="chip">'+otNum(j.ot_hours)+' ชม.</span></div>'+
          (j.detail?'<p class="otj-vdetail">'+esc(j.detail)+'</p>':"")+'</div>';
      }).join("")+'</div>'+
      '<h4 class="apm-h">ไฟล์แนบ ('+files.length+')</h4>'+
      '<div class="otj-flist" id="otrd-files">'+(files.length?files.map(function(f,i){
        return '<div class="otj-file"><span class="otj-fname">'+icon("fileText","ic-sm")+' '+esc(f.name)+
          ' <small class="muted">(รายการที่ '+esc(String(f.job_no))+')</small></span>'+
          '<button type="button" class="btn-icon" data-frv="'+i+'" title="ดูตัวอย่าง">'+icon("eye")+'</button>'+
          '<button type="button" class="btn-icon" data-frd="'+i+'" title="ดาวน์โหลด">'+icon("download")+'</button>'+
          (canEdit?'<button type="button" class="btn-icon t-red" data-frx="'+i+'" title="ลบไฟล์นี้">'+icon("trash")+'</button>':"")+
          '</div>';
      }).join(""):'<p class="muted">ยังไม่มีไฟล์แนบ</p>')+'</div>'+
      (canEdit?'<div class="ot-ret-add"><label class="field"><span>แนบไฟล์เพิ่ม (เลือกได้หลายไฟล์)</span>'+
        '<select id="otrd-job">'+jobs.map(function(j){
          return '<option value="'+esc(String(j.no))+'">รายการที่ '+esc(String(j.no))+' · JOB '+esc(j.job_code||"-")+'</option>';
        }).join("")+'</select>'+
        '<input type="file" id="otrd-file" multiple></label>'+
        '<label class="field"><span>หมายเหตุเพิ่มเติม (ถ้ามี)</span>'+
        '<textarea id="otrd-note" rows="2" placeholder="เช่น แนบเอกสาร JOB แล้ว"></textarea></label>'+
        '<div class="form-error" id="otrd-err" role="alert"></div></div>':"")+
      '<p class="muted ot-ret-hint">ข้อมูลคำขอ วันที่ เวลา ชั่วโมง และรายการงาน แก้ไขไม่ได้ในขั้นตอนนี้ — '+
      'รอบนี้เป็นการส่งเอกสาร/หลักฐานเพิ่มเติมเท่านั้น</p>';

    if(foot)foot.innerHTML='<button type="button" class="btn btn-ghost" id="otrd-close">ปิด</button>'+
      (canEdit?'<span class="apr-foot-gap"></span><button type="button" class="btn btn-primary" id="otrd-send">ส่งใหม่</button>':"");
    var c3=document.getElementById("otrd-close"); if(c3)c3.onclick=closeModal;

    /* ดู / ดาวน์โหลด — ใช้ Flow เดิมของระบบ */
    body.querySelectorAll("[data-frv]").forEach(function(b){b.onclick=function(){
      var f=files[parseInt(b.dataset.frv,10)]; if(f)reqFileOpen(f)}});
    body.querySelectorAll("[data-frd]").forEach(function(b){b.onclick=function(){
      var f=files[parseInt(b.dataset.frd,10)]; if(f)reqFileDownload(f)}});

    /* ลบไฟล์ — ต้องสำเร็จที่ Backend ก่อนเท่านั้นจึงรีเฟรชรายการ
       หมายเหตุ: ระบบลบเฉพาะ reference ในฐานข้อมูล (soft delete) ไม่ได้ลบ object ใน Storage */
    body.querySelectorAll("[data-frx]").forEach(function(b){b.onclick=function(){
      var f=files[parseInt(b.dataset.frx,10)]; if(!f||!f.path)return;
      var er=document.getElementById("otrd-err"); if(er)er.textContent="";
      b.disabled=true;
      sbRpc("njhr_ot_attach_delete",{p_token:sbToken(),p_path:f.path}).then(function(){
        otRedocRender(id,el);
      })["catch"](function(ex){ b.disabled=false;
        if(er)er.textContent="ลบไฟล์ไม่สำเร็จ: "+(ex&&ex.message||ex);
        toast("ลบไฟล์ไม่สำเร็จ","error"); });
    }});

    /* เพิ่มไฟล์ — อัปโหลด Storage แล้วต้องบันทึก metadata สำเร็จก่อนจึงถือว่าแนบแล้ว */
    var fi=document.getElementById("otrd-file");
    if(fi)fi.onchange=function(){
      var er=document.getElementById("otrd-err"); if(er)er.textContent="";
      var list=[].slice.call(fi.files||[]); if(!list.length)return;
      var jobNo=parseInt(document.getElementById("otrd-job").value,10)||1;
      var job=jobs.filter(function(j){return Number(j.no)===jobNo})[0]||jobs[0]||{};
      fi.disabled=true;
      var okN=0;
      list.reduce(function(p,file){ return p.then(function(){
        return sbUploadOtFile(file,null).then(function(up){
          return sbRpc("njhr_ot_attach_add",{p_token:sbToken(),p_ot_id:String(id),
            p_job_no:jobNo,p_job_code:job.job_code||null,p_file_name:up.name,
            p_file_path:up.path,p_file_url:up.url||up.path,p_file_size:up.size,
            p_content_type:file.type||null}).then(function(){okN++});
        });
      })}, Promise.resolve()).then(function(){
        fi.disabled=false; toast("แนบไฟล์แล้ว "+okN+" ไฟล์"); otRedocRender(id,el);
      })["catch"](function(ex){ fi.disabled=false;
        if(er)er.textContent="แนบไฟล์ไม่สำเร็จ: "+(ex&&ex.message||ex);
        if(okN)otRedocRender(id,el); });
    };

    /* ส่งใหม่ — Request ID เดิม · current_step เดิม · Resume ขั้นที่ตีกลับ */
    var bs=document.getElementById("otrd-send");
    if(bs)bs.onclick=function(){
      var er=document.getElementById("otrd-err"); if(er)er.textContent="";
      var noteEl=document.getElementById("otrd-note");
      var note=noteEl?String(noteEl.value||"").trim():"";
      bs.disabled=true; bs.innerHTML='<span class="spinner"></span> กำลังส่ง…';
      sbRpc("njhr_ot_return_reply",{p_token:sbToken(),p_ot_id:String(id),p_note:note||null})
        .then(function(){ closeModal(); toast("ส่งคำขอใหม่แล้ว · กลับเข้าสู่ขั้นการอนุมัติเดิม");
          refreshOtPending(); otLoad(el); })
        ["catch"](function(ex){ bs.disabled=false; bs.textContent="ส่งใหม่";
          if(er)er.textContent="ส่งใหม่ไม่สำเร็จ: "+(ex&&ex.message||ex);
          toast("ส่งใหม่ไม่สำเร็จ","error"); });
    };
  })["catch"](function(ex){
    var body=document.querySelector("#modal-root .modal-body");
    if(body)body.innerHTML='<div class="form-error">'+esc(ex&&ex.message||"โหลดคำขอไม่สำเร็จ")+'</div>';
  });
}
var OT_JOB_TYPES=["ตรวจปล่อย","คีย์ใบขน","คีย์ + ตรวจปล่อย"];NJHR.compat.scope.OT_JOB_TYPES=OT_JOB_TYPES;NJHR.compat.scope.otSbRows=otSbRows;NJHR.views.register("viewOT",viewOT)})();
