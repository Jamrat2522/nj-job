(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var icon=S.icon;var pad=S.pad;var todayISO=S.todayISO;var esc=S.esc;var debounce=S.debounce;var emp=S.emp;var dept=S.dept;var leaveType=S.leaveType;var balance=S.balance;var audit=S.audit;var toast=S.toast;var sbReady=S.sbReady;var sbRpcList=S.sbRpcList;var rptFetchAllPages=S.rptFetchAllPages;var rptComposeDaily=S.rptComposeDaily;var rptParseWorkingDays=S.rptParseWorkingDays;var rptIsoDow=S.rptIsoDow;var rptIsoRange=S.rptIsoRange;var rptGuardCap=S.rptGuardCap;var rptFetchShiftMap=S.rptFetchShiftMap;var rptEmpKey=S.rptEmpKey;var sbRpc=S.sbRpc;var sbToken=S.sbToken;var emptyState=S.emptyState;var shOfAtt=S.shOfAtt;var db=S.db;var ALL=S.ALL;var rptSafeName=S.rptSafeName;var rptBuildXlsx=S.rptBuildXlsx;var rptBuildXlsxChart=S.rptBuildXlsxChart;var rptLoadZip=S.rptLoadZip;var rptDateBE=S.rptDateBE;var rptNorm=S.rptNorm;var lvCode=S.lvCode;var lvType=S.lvType;var lvNum=S.lvNum;var LEAVE_TYPES=S.LEAVE_TYPES;var RPT_PREFIX=["นางสาว","นาย","นาง","ดร.","ด.ช.","ด.ญ."];function rptName(e){var title=String(e.title||"").trim();var first=String(e.firstName||"").trim();var last=String(e.lastName||"").trim();if(!title){for(var i=0;i<RPT_PREFIX.length;i++){if(first.indexOf(RPT_PREFIX[i])===0){title=RPT_PREFIX[i];first=first.slice(RPT_PREFIX[i].length).trim();break}}}return{title:title,name:(first+" "+last).trim()}}function rptVisibleEmployees(){return db.employees.slice()}var rptDeptCache=[];function rptDepts(){return rptDeptCache}function rptLoadDepts(el){if(!sbReady()||!sbToken())return;sbRpcList("njhr_emp_departments",{p_token:sbToken()}).then(function(ds){var next=(ds||[]).map(function(d){return{id:d.name,name:d.name,employees:d.employees}});var changed=next.length!==rptDeptCache.length||next.some(function(d,i){return!rptDeptCache[i]||rptDeptCache[i].name!==d.name});rptDeptCache=next;if(rptState.deptId&&!next.some(function(d){return d.name===rptState.deptId}))rptState.deptId="";if(changed&&el)viewReports(el)}).catch(function(er){console.error("[REPORT] njhr_emp_departments ล้มเหลว:",er)})}function rptMatch(e,q){if(!q)return true;var n=rptName(e);var hay=rptNorm([e.code,e.title,e.firstName,e.lastName,n.name,(e.title||"")+(e.firstName||""),(e.title||"")+n.name,e.nickname,dept(e.deptId)].join(" "));return rptNorm(q).split(" ").every(function(w){return hay.indexOf(w)>=0})}function rptEmployees(){var s=rptState;return rptVisibleEmployees().filter(function(e){if(s.deptId&&e.deptId!==s.deptId)return false;if(s.empId)return e.id===s.empId;return rptMatch(e,s.q)})}function rptMinOf(t){var p=String(t||"").split(":");return p.length>=2?+p[0]*60+ +p[1]:null}function rptLateMin(a,e){var sh=shOfAtt(e,a);var lim=rptMinOf(sh.start),cur=rptMinOf(a.in);if(lim===null||cur===null)return 0;lim+=db.settings.lateGrace||0;return cur>lim?cur-lim:0}function rptWorkMin(a){var i=rptMinOf(a.in),o=rptMinOf(a.out);if(i===null||o===null)return null;var m=o-i;if(m<0)m+=24*60;return m}function rptHM(min){if(min===null||!isFinite(min)||min<0)return{h:"",m:""};return{h:Math.floor(min/60),m:min%60}}function rptRows(){var s=rptState;if(!s.from||!s.to||s.from>s.to)return[];var emps=rptEmployees();var byId={};emps.forEach(function(e){byId[e.id]=e});var merged={};db.attendance.forEach(function(a){if(!byId[a.empId])return;if(a.date<s.from||a.date>s.to)return;var k=a.empId+"|"+a.date;var cur=merged[k];if(!cur){merged[k]={empId:a.empId,date:a.date,in:a.in||null,out:a.out||null,shiftId:a.shiftId,status:a.status};return}if(a.in&&(!cur.in||a.in<cur.in))cur.in=a.in;if(a.out&&(!cur.out||a.out>cur.out))cur.out=a.out;if(!cur.shiftId&&a.shiftId)cur.shiftId=a.shiftId});var rows=Object.keys(merged).map(function(k){var a=merged[k],e=byId[a.empId],n=rptName(e);var lateMin=a.in?rptLateMin(a,e):0;var st;if(!a.in&&!a.out)st="ขาดงาน";else if(!a.in)st="ไม่มีเวลาเข้า";else if(!a.out)st="ไม่มีเวลาออก";else st=lateMin>0?"มาสาย":"ปกติ";if(a.in&&a.out&&lateMin>0)st="มาสาย";var work=rptHM(rptWorkMin(a)),late=rptHM(lateMin);return{empId:e.id,code:e.code||"",date:a.date,title:n.title,name:n.name,in:a.in||"—",out:a.out||"—",status:st,lateMin:lateMin,wh:work.h,wm:work.m,lh:late.h,lm:late.m}});if(s.type==="late")rows=rows.filter(function(r){return r.lateMin>0});rows.sort(function(a,b){return b.date.localeCompare(a.date)||String(a.code).localeCompare(String(b.code),"th",{numeric:true})});return rows}var rptLeaveRows=[],rptBalRows=[],rptBalTypes=[];function rptFetchLeave(){var s=rptState;return sbRpcList("njhr_leave_report",{p_token:sbToken(),p_from:s.from,p_to:s.to,p_dept:s.deptId||null,p_q:s.q||null,p_type:s.leaveType||null,p_status:s.status||null})}function rptFetchBalance(){var s=rptState;return sbRpcList("njhr_leave_balance_report",{p_token:sbToken(),p_year:s.year,p_dept:s.deptId||null,p_q:s.q||null,p_emp_status:s.empStatus||""})}var RPT_LEAVE_HEAD=["ลำดับ","เลขที่คำขอ","รหัสพนักงาน","คำนำหน้า","ชื่อ-นามสกุล","ชื่อเล่น","แผนก","ประเภทการลา","วันที่เริ่มลา","วันที่สิ้นสุด","ช่วงเวลา","จำนวนวัน","จำนวนชั่วโมง","เหตุผลการลา","เอกสารแนบ","วันที่ยื่นคำขอ","สถานะ","ผู้อนุมัติ","วันที่อนุมัติ","หมายเหตุ"];function rptLeaveCells(r,i){return[i+1,lvCode(r.req_id),r.emp_code,r.prefix,r.full_name,r.nickname,r.department,lvType(r.leave_type).name,rptDateBE(r.start_date),rptDateBE(r.end_date),r.mode_txt,lvNum(r.total_days),lvNum(r.hours),r.reason,r.file_count?r.file_names+" ("+r.file_count+")":"—",String(r.created_at||"").replace("T"," ").slice(0,16),LV_STATUS_TH[r.status]||r.status,r.approver||"—",r.approved_at?String(r.approved_at).replace("T"," ").slice(0,16):"—",r.note||""]}function rptBalPivot(rows){var byEmp={},order=[],typeSeen={};rows.forEach(function(r){if(!byEmp[r.employee_id]){byEmp[r.employee_id]={e:r,t:{}};order.push(r.employee_id)}byEmp[r.employee_id].t[r.leave_type]=r;typeSeen[r.leave_type]=1});var known=LEAVE_TYPES.map(function(t){return t.code}).filter(function(c){return typeSeen[c]});var extra=Object.keys(typeSeen).filter(function(c){return known.indexOf(c)<0});var types=known.concat(extra);return{emps:order.map(function(id){return byEmp[id]}),types:types}}function rptBalHasQuota(code){return String(code||"").toUpperCase()==="VACATION"}function rptBalHead(types){var h=["ลำดับ","รหัสพนักงาน","คำนำหน้า","ชื่อ-นามสกุล","ชื่อเล่น","แผนก","วันที่เริ่มงาน","สถานะพนักงาน","ปีสิทธิ์การลา"];types.forEach(function(c){var n=lvType(c).name;h=rptBalHasQuota(c)?h.concat([n+" · สิทธิ์ต่อปี",n+" · ยกมา",n+" · ใช้แล้ว",n+" · รออนุมัติ",n+" · คงเหลือ"]):h.concat([n+" · ใช้แล้ว",n+" · รออนุมัติ"])});return h}function rptBalCells(row,types,i){var e=row.e;var out=[i+1,e.emp_code,e.prefix,e.full_name,e.nickname,e.department,e.start_date?rptDateBE(e.start_date):"—",EMP_STATUS_TH[e.emp_status]||e.emp_status,e.year+543];types.forEach(function(c){var t=row.t[c];if(!rptBalHasQuota(c)){out=out.concat(t?[lvNum(t.used),lvNum(t.pending)]:[0,0]);return}if(!t){out=out.concat(["—",0,0,0,"—"]);return}var unlimited=t.quota===null||t.quota===undefined;out=out.concat([unlimited?"ไม่จำกัด":lvNum(t.quota),lvNum(t.carry_over)+lvNum(t.extra_days),lvNum(t.used),lvNum(t.pending),unlimited?"ไม่จำกัด":lvNum(t.remaining)])});return out}var rptOtData=[],rptOtLoading=false,rptOtSeq=0,rptOtErr="";function rptOtRows(){return rptOtData}function rptOtHM(v){return String(v==null?"":v).slice(0,5)}function rptOtApprover(approvals){var a=(approvals||[]).filter(function(x){var act=String(x.action||"").toUpperCase();return act==="APPROVE"||act==="REJECT"||act==="CANCEL"});if(!a.length)return{by:"",at:""};var last=a[a.length-1];return{by:String(last.by||""),at:String(last.at||"").replace("T"," ").slice(0,16)}}function rptOtLoad(el){var st=rptState,seq=++rptOtSeq;rptOtErr="";if(!st.from||!st.to||st.from>st.to){rptOtData=[];rptOtLoading=false;return Promise.resolve()}if(!sbReady()||!sbToken()){rptOtData=[];rptOtLoading=false;rptOtErr="ยังไม่ได้เชื่อมต่อ Supabase — รายงาน OT ต้องใช้ข้อมูลจริงเท่านั้น";return Promise.resolve()}rptOtLoading=true;rptOtData=[];var args={p_token:sbToken(),p_from:st.from,p_to:st.to,p_dept:st.deptId||null,p_q:st.q||null};return Promise.all([rptFetchAllPages("njhr_ot_report",{p_token:args.p_token,p_from:args.p_from,p_to:args.p_to,p_status:"ALL",p_dept:args.p_dept,p_employee:st.empId||null,p_q:args.p_q},{keyOf:function(r){return String(r.ot_id||"")+"|"+String(r.job_no==null?"":r.job_no)}}),sbRpcList("njhr_rpt_ot_list",args)["catch"](function(){return[]})]).then(function(res){if(seq!==rptOtSeq)return;var jobs=res[0]||[],reqs=res[1]||[];var meta={};reqs.forEach(function(r){meta[String(r.req_id)]=r});var ids=[];jobs.forEach(function(j){if(ids.indexOf(String(j.ot_id))<0)ids.push(String(j.ot_id))});var OT_POOL=6;var otExtra=new Array(ids.length),otNext=0;function otWorker(){if(otNext>=ids.length)return Promise.resolve();var k=otNext++;var id=ids[k];return Promise.all([sbRpcList("njhr_ot_attach_list",{p_token:sbToken(),p_ot_id:id})["catch"](function(){return[]}),sbRpc("njhr_ot_get",{p_token:sbToken(),p_id:id})["catch"](function(){return null})]).then(function(x){var d=x[1]&&x[1].data?x[1].data:x[1];otExtra[k]={id:id,files:x[0]||[],appr:rptOtApprover(d&&d.request&&d.request.approvals)};return otWorker()})}var otRunners=[];for(var w2=0;w2<Math.min(OT_POOL,ids.length);w2++)otRunners.push(otWorker());return Promise.all(otRunners).then(function(){return otExtra}).then(function(extra){if(seq!==rptOtSeq)return;var byId={};extra.forEach(function(x){byId[x.id]=x});rptOtData=jobs.map(function(j){var x=byId[String(j.ot_id)]||{files:[],appr:{by:"",at:""}};var mine=x.files.filter(function(f){return Number(f.job_no)===Number(j.job_no)});var m=meta[String(j.ot_id)]||{};return{reqId:m.request_no||j.ot_id,no:j.job_no,code:j.emp_code||"",name:j.emp_name||"",title:j.prefix||"",dept:j.department||"",position:j.position_name||"",job:j.job_code||"",detail:j.detail||"",jobType:j.job_type||"",date:String(j.job_date||"").slice(0,10),start:rptOtHM(j.start_time),end:rptOtHM(j.end_time),endDate:String(j.end_date||"").slice(0,10),nextDay:!!j.spans_next_day,hours:Number(j.job_hours)||0,fileNames:mine.map(function(f){return f.file_name}).join(", "),fileCount:mine.length,status:OT_STATUS_TH[j.status]||j.status,createdAt:String(m.created_at||"").replace("T"," ").slice(0,16),approver:x.appr.by,approvedAt:x.appr.at,note:j.reason||"",empId:j.employee_id}});rptOtData.sort(function(a2,b2){return a2.date.localeCompare(b2.date)||String(a2.start).localeCompare(String(b2.start))||String(a2.code).localeCompare(String(b2.code),"th",{numeric:true})||String(a2.reqId).localeCompare(String(b2.reqId))||a2.no-b2.no});rptOtLoading=false})})["catch"](function(ex){if(seq!==rptOtSeq)return;rptOtLoading=false;rptOtData=[];console.error("[REPORT] รายงาน OT จาก Supabase ล้มเหลว:",ex);rptOtErr="โหลดรายงาน OT จาก Supabase ไม่สำเร็จ: "+(ex&&ex.message||ex)})}var RPT_OT_HEAD=["เลขที่คำขอ","ลำดับรายการ","รหัสพนักงาน","ชื่อ–นามสกุล","แผนก","ตำแหน่ง","JOB","รายละเอียดงาน","ประเภทงาน","วันที่ OT","เวลาเริ่มต้น","เวลาสิ้นสุด","จำนวนชั่วโมง","จำนวนไฟล์แนบ","สถานะ","วันที่ยื่น","ผู้อนุมัติ","วันที่อนุมัติ"];var RPT_OT_HEAD_XLS=["เลขที่คำขอ","ลำดับรายการ","รหัสพนักงาน","ชื่อ–นามสกุล","แผนก","ตำแหน่ง","JOB","รายละเอียดงาน","ประเภทงาน","วันที่ OT","เวลาเริ่มต้น","เวลาสิ้นสุด","จำนวนชั่วโมง","ชื่อไฟล์แนบ","จำนวนไฟล์","สถานะ","ผู้อนุมัติ","วันที่อนุมัติ","หมายเหตุรวม"];function rptOtCells(r){return[r.reqId,r.no,r.code,r.name,r.dept,r.position,r.job,r.detail,r.jobType,rptDateBE(r.date),r.start,r.end+(r.nextDay?" (+1 วัน)":""),r.hours,r.fileCount,r.status,r.createdAt,r.approver||"-",r.approvedAt||"-"]}function rptOtCellsXls(r){return[r.reqId,r.no,r.code,r.name,r.dept,r.position,r.job,r.detail,r.jobType,rptDateBE(r.date),r.start,r.end+(r.nextDay?" (+1 วัน)":""),r.hours,r.fileNames,r.fileCount,r.status,r.approver||"-",r.approvedAt||"-",r.note]}function rptOtPaint(el){var box=document.getElementById("rpt-table");var eb=document.getElementById("rpt-err");if(eb)eb.textContent=rptOtErr||"";var rows=rptOtRows();var sum=rptOtSummary(rows);var sb=el.querySelector(".rpt-otsum");if(sb){sb.innerHTML=[["คำขอทั้งหมด",sum.reqs],["รายการงานทั้งหมด",sum.items],["ชั่วโมงรวม",sum.hours],["จำนวนพนักงาน",sum.emps],["รออนุมัติ",sum.pend],["อนุมัติแล้ว",sum.appr]].map(function(x){return'<div class="bal-item"><div class="bal-top"><span>'+x[0]+"</span><b>"+x[1]+"</b></div></div>"}).join("")}var cnt=el.querySelector(".rpt-sum b:last-child");if(cnt)cnt.textContent=rows.length+" รายการ";if(!box)return;box.innerHTML=rows.length?'<div class="table-wrap"><table><thead><tr>'+RPT_OT_HEAD.map(function(h){return"<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return"<tr>"+rptOtCells(r).map(function(c){return"<td>"+esc(c)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>":emptyState(rptOtErr?"ไม่สามารถแสดงข้อมูลได้":rptEmptyMsg())}function rptOtSummary(rows){var reqs={},emps={},hrs=0,pend=0,appr=0;rows.forEach(function(r){reqs[r.reqId]=1;emps[r.empId]=1;hrs+=r.hours;if(r.status==="รออนุมัติ")pend++;if(r.status==="อนุมัติแล้ว")appr++});return{reqs:Object.keys(reqs).length,items:rows.length,hours:Math.round(hrs*100)/100,emps:Object.keys(emps).length,pend:pend,appr:appr}}var RPT_HEAD=["วันที่","รหัสพนักงาน","คำนำหน้า","พนักงาน","แผนก","เข้า","ออก","สถานะ","จำนวนชั่วโมง","จำนวนนาที"];var rptAttRows=[];var RPT_ATT_PER=200;var rptAttPage=0;var rptAttRaw=[];function rptAttStatusOpts(){var seen={},out=[];rptAttRaw.forEach(function(r){var code=r.statusCode||"";if(!code||seen[code])return;seen[code]=1;out.push([code,EMP_ATT_STATUS[code]||code])});var cur=rptState.attStatus;if(cur&&!seen[cur])out.push([cur,EMP_ATT_STATUS[cur]||cur]);out.sort(function(a,b){return a[1].localeCompare(b[1],"th")});return out}function rptAttApplyStatus(rows){var f=rptState.attStatus;if(!f)return rows;return rows.filter(function(r){return r.statusCode===f})}
/* ============================ [RUN-161] ============================
   "รายงานการลงเวลา" -> สรุปจำนวนวันรายพนักงาน (พนักงาน 1 คน = 1 รายการ)
   · อ่านจาก rptAttRows ชุดเดียวกับที่โหลดมา = ครบทั้งช่วงวันที่ ไม่ใช่เฉพาะหน้าปัจจุบัน
   · ห้ามนับวันซ้ำ: key = พนักงาน + วันที่ นับได้ครั้งเดียวเท่านั้น
   · ตาราง / กราฟหน้าเว็บ / Excel เรียก rptSumRows() ตัวเดียวกัน ตัวเลขจึงตรงกัน 100%
   · ขอบเขต: เฉพาะ type="attendance" — "รายงานมาสาย" (late) คงพฤติกรรมเดิมทุกอย่าง
   · ไม่แตะข้อมูลต้นฉบับ ไม่ยิง RPC เพิ่ม ไม่แก้ DB
   ================================================================= */
var RPT_SUM_ST=[["NORMAL","ปกติ"],["LATE","มาสาย"],["ABSENT","ขาดงาน"],["LEAVE","ลา"]];
var RPT_SUM_COLOR={NORMAL:"16A34A",LATE:"F59E0B",ABSENT:"DC2626",LEAVE:"2563EB"};
function rptSumTH(code){for(var i=0;i<RPT_SUM_ST.length;i++)if(RPT_SUM_ST[i][0]===code)return RPT_SUM_ST[i][1];return EMP_ATT_STATUS[code]||code||""}
function rptSumOn(){return rptState.type==="attendance"}
function rptSumKeyOf(r){var c=rptEmpKey(r.empCode||"");return c||("N:"+rptNorm(r.name||"-"))}
function rptSumRows(){
  var pick=rptState.attStatus||"";
  var by=Object.create(null),out=[],seen=Object.create(null);
  rptAttRows.forEach(function(r){
    var k=rptSumKeyOf(r),d=String(r.date||"").slice(0,10);
    if(!d)return;
    var dk=k+"|"+d;
    if(seen[dk])return;                       /* วันเดียวกัน + คนเดียวกัน = นับครั้งเดียว */
    seen[dk]=1;
    var o=by[k];
    if(!o){o=by[k]={code:r.empCode||"",title:r.title||"",name:String(r.name||"").trim()||"-",
      dept:r.dept||"",n:{},total:0};out.push(o)}
    if(!o.title&&r.title)o.title=r.title;
    if(!o.dept&&r.dept)o.dept=r.dept;
    var st=String(r.statusCode||"").toUpperCase();
    if(st)o.n[st]=(o.n[st]||0)+1;
  });
  out.forEach(function(o){var t=0;for(var i=0;i<RPT_SUM_ST.length;i++)t+=o.n[RPT_SUM_ST[i][0]]||0;o.total=t});
  /* 0 วันไม่ต้องขึ้น (ทั้งตารางและกราฟ ใช้กติกาเดียวกันเพื่อให้ตรงกัน) */
  var res=pick?out.filter(function(o){return(o.n[pick]||0)>0})
              :out.filter(function(o){return o.total>0});
  res.sort(function(a,b){
    var av=pick?(a.n[pick]||0):a.total,bv=pick?(b.n[pick]||0):b.total;
    if(bv!==av)return bv-av;
    var c=String(a.code||"").localeCompare(String(b.code||""),"th");
    return c||a.name.localeCompare(b.name,"th")
  });
  return res
}
function rptSumHead(){
  var pick=rptState.attStatus||"";
  return pick?["ลำดับ","รหัสพนักงาน","พนักงาน","แผนก","จำนวนวัน"+rptSumTH(pick)]
             :["ลำดับ","รหัสพนักงาน","คำนำหน้า","พนักงาน","แผนก","ปกติ","มาสาย","ขาดงาน","ลา","รวมวัน"]
}
function rptSumCells(o,i){
  var pick=rptState.attStatus||"";
  if(pick)return[i+1,o.code||"-",o.name||"-",o.dept||"-",o.n[pick]||0];
  return[i+1,o.code||"-",o.title||"",o.name||"-",o.dept||"-",
    o.n.NORMAL||0,o.n.LATE||0,o.n.ABSENT||0,o.n.LEAVE||0,o.total||0]
}
function rptSumWidths(){return rptState.attStatus?[8,14,30,24,20]:[8,14,12,28,24,9,10,11,8,11]}
function rptSumTotals(rows){
  var t={total:0};RPT_SUM_ST.forEach(function(x){t[x[0]]=0});
  (rows||[]).forEach(function(o){RPT_SUM_ST.forEach(function(x){t[x[0]]+=o.n[x[0]]||0});t.total+=o.total||0});
  return t
}
function rptSumPaint(box,pg){
  var rows=rptSumRows(),head=rptSumHead();
  box.innerHTML=rows.length
    ?'<div class="table-wrap"><table class="rpt-att-tbl rpt-sum-tbl"><thead><tr>'
      +head.map(function(h){return"<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"
      +rows.map(function(o,i){return"<tr>"+rptSumCells(o,i).map(function(c){
         return"<td>"+esc(c)+"</td>"}).join("")+"</tr>"}).join("")
      +"</tbody></table></div>"
    :emptyState(rptEmptyMsg());
  if(pg)pg.innerHTML=rows.length
    ?'<span class="muted">พนักงาน '+rows.length+" คน · ทุกแถวมาจากข้อมูลครบทั้งช่วงวันที่ (ไม่แบ่งหน้า)</span>"
    :"";
  return rows
}
function rptLeaveLabel(r){if(!r||r.leaveStatus!=="LEAVE")return"";var m=r.leaveMode||"";if(m==="HOURLY"){var a=String(r.leaveFrom||"").slice(0,5),b=String(r.leaveTo||"").slice(0,5);return a&&b?"ลา "+a+"–"+b:"ลา (รายชั่วโมง)"}if(m==="HALF_AM")return"ลา (ครึ่งวันเช้า)";if(m==="HALF_PM")return"ลา (ครึ่งวันบ่าย)";if(m==="HALF")return"ลา (ครึ่งวัน)";return"ลา"}function rptStatusText(r){var lb=rptLeaveLabel(r);if(!lb)return r.status;var st=String(r.statusCode||"").toUpperCase();if(st==="LEAVE"||!r.in||r.in==="—")return lb;var th=EMP_ATT_STATUS[st]||r.status;return th?lb+" · "+th:lb}function rptCells(r){var late=rptState.type==="late";return[rptDateBE(r.date),r.empCode||"-",r.title,r.name,r.dept||"-",r.in,r.out,late?"มาสาย":rptStatusText(r),late?r.lh:r.wh,late?r.lm:r.wm]}function rptEmptyMsg(){if(rptState.type==="leave")return"ไม่พบรายการลาตามช่วงวันที่ แผนก ประเภทการลา และสถานะที่เลือก";if(rptState.type==="balance")return"ไม่พบพนักงานตามปีสิทธิ์ แผนก และสถานะพนักงานที่เลือก";if(rptState.type==="ot")return"ไม่พบรายการ OT ตามช่วงวันที่ แผนก และชื่อพนักงานที่เลือก";return rptState.type==="late"?"ยังไม่มีข้อมูลการมาสายในช่วงวันที่ แผนก และพนักงานที่เลือก":"ยังไม่มีข้อมูลการลงเวลาในช่วงวันที่ แผนก และพนักงานที่เลือก"}var rptState={type:"attendance",from:"",to:"",deptId:"",q:"",empId:"",leaveType:"",status:"",attStatus:"",year:(new Date).getFullYear(),empStatus:"ACTIVE"};/* [RUN-151] เปิดหน้า/รีเฟรช/ล้างตัวกรอง = วันนี้ → วันนี้ (เดิมย้อนหลัง 14 วัน)
   ใช้ todayISO() ทั้งสองค่า ไม่ใช้ toISOString() ซึ่งเป็นเวลา UTC และเลื่อนวันได้เมื่อ TZ เป็น Asia/Bangkok
   ถูกเรียก 2 จุด: viewReports() ตอน s.from ยังว่าง และปุ่ม #rpt-clear */
function rptDefaults(){var t=todayISO();return{from:t,to:t}}function viewReports(el){var s=rptState;rptAttPage=0;if(!s.from){var dft=rptDefaults();s.from=dft.from;s.to=dft.to}var types=[["attendance","รายงานการลงเวลา"],["late","รายงานมาสาย"],["leave","รายงานการลา"],["balance","รายงานวันลาคงเหลือ"],["ot","รายงาน OT"]];var depts=rptDepts();if(s.empId){var picked=emp(s.empId);if(!picked||s.deptId&&picked.deptId!==s.deptId){s.empId="";s.q=""}}var err="";if(!s.from||!s.to)err="กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดให้ครบ";else if(s.from>s.to)err="วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด";var isOt=s.type==="ot",isLv=s.type==="leave",isBal=s.type==="balance";var isAtt=s.type==="attendance"||s.type==="late";var isSb=isLv||isBal||isAtt||isOt;if(isBal)err="";var rows=err||isSb?[]:isOt?rptOtRows():rptRows();var head=isOt?RPT_OT_HEAD:RPT_HEAD;var cellsOf=isOt?rptOtCells:rptCells;var otSum=isOt?rptOtSummary(rows):null;var seq=++rptSeq;var pickedName=s.empId?s.q||"พนักงานที่เลือก":s.q?s.q:"ทุกคน";el.innerHTML='<div class="toolbar rpt-filters">'+'<select id="rpt-type">'+types.map(function(t){return'<option value="'+t[0]+'"'+(s.type===t[0]?" selected":"")+">"+t[1]+"</option>"}).join("")+"</select>"+(isBal?'<select id="rpt-year">'+rptYears().map(function(y){return'<option value="'+y+'"'+(s.year===y?" selected":"")+">ปีสิทธิ์ "+(y+543)+"</option>"}).join("")+"</select>"+'<select id="rpt-estatus">'+[["ACTIVE","ปฏิบัติงาน"],["PROBATION","ทดลองงาน"],["RESIGNED","พ้นสภาพ"],["","ทุกสถานะ"]].map(function(x){return'<option value="'+x[0]+'"'+(s.empStatus===x[0]?" selected":"")+">"+x[1]+"</option>"}).join("")+"</select>":'<input type="date" id="rpt-from" value="'+esc(s.from)+'"><span class="muted">ถึง</span><input type="date" id="rpt-to" value="'+esc(s.to)+'">')+(isLv?'<select id="rpt-ltype"><option value="">ทุกประเภทการลา</option>'+LEAVE_TYPES.map(function(t){return'<option value="'+t.code+'"'+(s.leaveType===t.code?" selected":"")+">"+esc(t.name)+"</option>"}).join("")+"</select>"+'<select id="rpt-status"><option value="">ทุกสถานะ</option>'+Object.keys(LV_STATUS_TH).map(function(k){return'<option value="'+k+'"'+(s.status===k?" selected":"")+">"+LV_STATUS_TH[k]+"</option>"}).join("")+"</select>":"")+'<select id="rpt-dept"><option value="">ทุกแผนก</option>'+depts.map(function(d2){return'<option value="'+esc(d2.name)+'"'+(s.deptId===d2.name?" selected":"")+">"+esc(d2.name)+"</option>"}).join("")+"</select>"+(isAtt?'<select id="rpt-astatus"><option value="">ทุกสถานะ</option>'+rptAttStatusOpts().map(function(o2){return'<option value="'+esc(o2[0])+'"'+(s.attStatus===o2[0]?" selected":"")+">"+esc(o2[1])+"</option>"}).join("")+"</select>":"")+'<span class="search-box rpt-emp-box">'+icon("search","ic-sm")+'<input id="rpt-q" autocomplete="off" placeholder="ค้นหาชื่อ นามสกุล ชื่อเล่น หรือรหัสพนักงาน" value="'+esc(s.q)+'">'+'<div class="rpt-ac" id="rpt-ac" hidden></div></span>'+'<button class="btn btn-ghost" id="rpt-clear">ล้างตัวกรอง</button>'+'<span class="grow"></span>'+'<button class="btn btn-primary" id="rpt-export">'+icon("download")+" Export Excel</button></div>"+'<p class="muted note rpt-sum">ประเภทรายงาน: <b>'+esc(types.filter(function(t){return t[0]===s.type})[0][1])+"</b>"+(isBal?" · ปีสิทธิ์การลา: <b>"+(s.year+543)+"</b> · สถานะพนักงาน: <b>"+esc({ACTIVE:"ปฏิบัติงาน",PROBATION:"ทดลองงาน",RESIGNED:"พ้นสภาพ"}[s.empStatus]||"ทุกสถานะ")+"</b>":" · ช่วงวันที่: <b>"+esc(rptDateBE(s.from))+" – "+esc(rptDateBE(s.to))+"</b>")+(isLv?" · ประเภทการลา: <b>"+esc(s.leaveType?lvType(s.leaveType).name:"ทุกประเภท")+"</b>"+" · สถานะ: <b>"+esc(s.status?LV_STATUS_TH[s.status]:"ทุกสถานะ")+"</b>":"")+" · แผนก: <b>"+esc(s.deptId||"ทุกแผนก")+"</b>"+(isAtt?" · สถานะ: <b>"+esc(s.attStatus?EMP_ATT_STATUS[s.attStatus]||s.attStatus:"ทุกสถานะ")+"</b>":"")+" · พนักงาน: <b>"+esc(pickedName)+"</b>"+" · จำนวนรายการ: <b>"+rows.length+" รายการ</b></p>"+(otSum?'<div class="bal-grid rpt-otsum">'+[["คำขอทั้งหมด",otSum.reqs],["รายการงานทั้งหมด",otSum.items],["ชั่วโมงรวม",otSum.hours],["จำนวนพนักงาน",otSum.emps],["รออนุมัติ",otSum.pend],["อนุมัติแล้ว",otSum.appr]].map(function(x){return'<div class="bal-item"><div class="bal-top"><span>'+x[0]+"</span><b>"+x[1]+"</b></div></div>"}).join("")+"</div>":"")+(err?'<div class="form-error" role="alert">'+esc(err)+"</div>":"")+(isAtt?'<div class="card rpt-chart" id="rpt-chart"></div>':"")+'<div class="card p0" id="rpt-table">'+(isSb?'<div class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</div>':rows.length?'<div class="table-wrap"><table><thead><tr>'+head.map(function(h){return"<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return"<tr>"+cellsOf(r).map(function(c){return"<td>"+esc(c)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>":emptyState(err||rptEmptyMsg()))+"</div>"+'<div class="toolbar" id="rpt-att-pager"></div>'+'<div class="form-error" id="rpt-err" role="alert" style="white-space:pre-line"></div>';document.getElementById("rpt-type").onchange=function(){s.type=this.value;viewReports(el)};var fEl=document.getElementById("rpt-from");if(fEl)fEl.onchange=function(){s.from=this.value;viewReports(el)};var tEl=document.getElementById("rpt-to");if(tEl)tEl.onchange=function(){s.to=this.value;viewReports(el)};var yEl=document.getElementById("rpt-year");if(yEl)yEl.onchange=function(){s.year=parseInt(this.value,10);viewReports(el)};var esEl=document.getElementById("rpt-estatus");if(esEl)esEl.onchange=function(){s.empStatus=this.value;viewReports(el)};var ltEl=document.getElementById("rpt-ltype");if(ltEl)ltEl.onchange=function(){s.leaveType=this.value;viewReports(el)};var stEl=document.getElementById("rpt-status");if(stEl)stEl.onchange=function(){s.status=this.value;viewReports(el)};document.getElementById("rpt-dept").onchange=function(){s.deptId=this.value;var p=s.empId?emp(s.empId):null;if(p&&s.deptId&&p.deptId!==s.deptId){s.empId="";s.q=""}viewReports(el)};var asEl=document.getElementById("rpt-astatus");if(asEl)asEl.onchange=function(){var v=this.value;this.blur();setTimeout(function(){s.attStatus=v;viewReports(el)},0)};document.getElementById("rpt-clear").onclick=function(){var dft2=rptDefaults();rptState={type:"attendance",from:dft2.from,to:dft2.to,deptId:"",q:"",empId:"",leaveType:"",status:"",attStatus:"",year:(new Date).getFullYear(),empStatus:"ACTIVE"};viewReports(el)};var qEl=document.getElementById("rpt-q"),acEl=document.getElementById("rpt-ac");function acBox(){return document.getElementById("rpt-ac")}function closeAc(){var b=acBox();if(b){b.hidden=true;b.innerHTML=""}}function openAc(){var box=acBox(),inp=document.getElementById("rpt-q");if(!box||!inp)return;var q=inp.value.trim();if(!q){closeAc();return}sbRpcList("njhr_emp_list",{p_token:sbToken(),p_q:q,p_dept:s.deptId||null,p_status:null,p_sort:"emp_code",p_desc:false,p_limit:8,p_offset:0}).then(function(pool){var b2=acBox();if(!b2)return;if(!pool||!pool.length){closeAc();return}b2.innerHTML=pool.map(function(e2){return'<button type="button" class="rpt-ac-item" data-eid="'+esc(e2.id)+'">'+esc(e2.emp_code||"-")+" — "+esc((e2.prefix||"")+(e2.full_name||""))+(e2.nickname?" ("+esc(e2.nickname)+")":"")+" — "+esc(e2.department_name||"-")+"</button>"}).join("");b2.hidden=false}).catch(function(er){console.error("[REPORT] njhr_emp_list ล้มเหลว:",er);closeAc()})}qEl.oninput=debounce(function(){s.q=qEl.value;s.empId="";viewReports(el);var q2=document.getElementById("rpt-q");q2.focus();q2.setSelectionRange(q2.value.length,q2.value.length);openAc()},300);acEl.onmousedown=function(ev){var b=ev.target.closest?ev.target.closest("[data-eid]"):null;if(!b)return;ev.preventDefault();s.empId=b.dataset.eid;s.q=(b.textContent||"").split(" — ").slice(0,2).join(" — ");viewReports(el)};qEl.onblur=function(){setTimeout(closeAc,120)};document.getElementById("rpt-export").onclick=function(){rptExport(this)};if(!rptDeptCache.length)rptLoadDepts(el);if(isOt){rptOtLoad(el).then(function(){if(seq!==rptSeq)return;rptOtPaint(el)})}else if(isSb)rptLoadSb(el,seq)}var rptSeq=0;function rptYears(){var y=(new Date).getFullYear(),out=[];for(var i=y-3;i<=y+1;i++)out.push(i);return out}var _rptAttInflight=null,_rptAttKey="";/* ============================ [RUN-139] ============================
   รายงานการลงเวลา: เดิมแสดงเฉพาะ "วันที่ที่มี attendance row"
   (njhr_att_report เริ่ม query จาก public.attendance) จึงไม่เห็นวันที่ควรทำงานแต่ไม่ได้สแกน
   แก้โดยประกอบ Daily Dataset กลาง (rptComposeDaily) จาก Source จริงทั้งหมด
   แล้วแปลงกลับเป็นรูปแบบแถวเดิมของ njhr_att_report เพื่อไม่ต้องแตะ rptAttRow/rptCells/Export
   หมายเหตุ: โหมด "มาสาย" (LATE) ยังใช้เส้นทางเดิม เพราะกรองที่ Server ด้วย late_min > 0
   =================================================================== */
function rptDailyShiftMap(){return rptFetchShiftMap(sbToken())}
var rptDailyWarn=[];
function rptDailyToAttRow(r){
  return {work_date:r.date,employee_id:r.empId,emp_code:r.empCode,prefix:r.prefix,
    emp_name:r.empName,nickname:"",department:r.dept,position_name:"",
    check_in:r.checkIn,check_out:r.checkOut,work_hours:r.workHours,
    status:r.attStatus,late_min:r.lateMin,shift_name:r.shiftName,
    leave_status:r.leaveType?"LEAVE":"",leave_type:r.leaveType||"",
    leave_mode:r.leaveMode||"",leave_start_time:r.leaveFrom||"",leave_end_time:r.leaveTo||""};
}
function rptFetchAttDaily(args,s){
  var tk=sbToken();
  return Promise.all([
    rptFetchAllPages("njhr_att_report",args,{keyOf:function(r){
      return String(r.employee_id||"")+"|"+String(r.work_date||"").slice(0,10)}}),
    /* พนักงานทั้งแผนกที่เลือก (ไม่กรองด้วยคำค้น เพื่อไม่ให้แถว attendance ของใครหล่นหาย) */
    rptFetchAllPages("njhr_emp_list",{p_token:tk,p_q:null,p_dept:s.deptId||null,
      p_status:null,p_sort:"emp_code",p_desc:false},{keyOf:function(r){return String(r.id||"")}}),
    sbRpcList("njhr_leave_report",{p_token:tk,p_from:s.from,p_to:s.to,p_dept:s.deptId||null,
      p_q:null,p_type:null,p_status:"APPROVED"}),
    sbRpcList("njhr_holiday_list",{p_token:tk,p_from:s.from,p_to:s.to}),
    rptDailyShiftMap()
  ]).then(function(res){
    var aRows=res[0]||[],eRows=rptGuardCap(res[1]||[],"รายชื่อพนักงาน"),
        lRows=rptGuardCap(res[2]||[],"ใบลา"),hRows=rptGuardCap(res[3]||[],"วันหยุด"),
        shiftByEmp=res[4]||{};

    var emps=eRows.map(function(e){
      var full=String(e.full_name||"").trim();
      return {id:e.id,code:String(e.emp_code||"").trim(),prefix:e.prefix||"",name:full,
        nickname:e.nickname||"",dept:e.department_name||"",status:e.status||"",
        startDate:e.start_date||null,resignDate:e.resign_date||null};
    });
    /* ขอบเขตพนักงาน = ที่ตรงกับตัวกรองหน้าจอ  ∪  ที่มี attendance จริง (กันข้อมูลหาย) */
    var inAtt={};aRows.forEach(function(a){if(a.employee_id)inAtt[a.employee_id]=1});
    var q=rptNorm(s.q||"");
    var scope=emps.filter(function(e){
      if(inAtt[e.id])return true;
      if(s.empId)return e.id===s.empId;
      if(!q)return true;
      var hay=rptNorm([e.code,e.prefix,e.name,e.prefix+e.name,e.nickname,e.dept].join(" "));
      return q.split(" ").every(function(w){return hay.indexOf(w)>=0});
    });

    /* [RUN-144] ของเดิมสร้าง byCode จาก scope ซึ่งถูกกรองด้วยคำค้น/พนักงานที่เลือกแล้ว
       แต่ njhr_leave_report ถูกดึงมาโดยไม่ใส่ p_q/p_employee จึงได้ใบลาของ "ทุกคน" ในแผนก
       ใบลาของคนนอกผลการค้นหาจึงจับคู่ไม่ได้ แล้วไป throw ทำให้ทั้งรายงานเป็น 0 รายการ
       แก้: สร้าง map จากรายชื่อพนักงานทั้งชุด (master เต็ม) แล้วค่อยแยกสามกรณี
         1) จับคู่ได้ + อยู่ในขอบเขตที่แสดง  -> ใช้งาน
         2) จับคู่ได้ + อยู่นอกขอบเขต        -> ข้าม (เป็นเรื่องปกติของการกรอง ไม่ใช่ error)
         3) จับคู่ไม่ได้จริง                 -> เก็บเป็นคำเตือน ไม่บล็อกรายงานส่วนที่ถูกต้อง */
    var byCode=Object.create(null),dupCode=[];
    emps.forEach(function(e){
      var k=rptEmpKey(e.code);
      if(!k)return;
      if(byCode[k]){if(dupCode.indexOf(k)<0)dupCode.push(k);return}   /* ตัวแรกชนะ */
      byCode[k]=e;
    });
    var inScope=Object.create(null);
    scope.forEach(function(e){inScope[e.id]=1});

    var lvMiss=[],lvOut=0;
    var leaves=lRows.map(function(l){
      var c=rptEmpKey(l.emp_code),e=c?byCode[c]:null;
      if(!e){if(c&&lvMiss.indexOf(c)<0)lvMiss.push(c);return null}
      if(!inScope[e.id]){lvOut++;return null}                          /* นอกตัวกรอง ข้ามเงียบ */
      return {id:l.req_id,empId:e.id,typeCode:l.leave_type||"",typeName:l.leave_type||"",
        startDate:String(l.start_date||"").slice(0,10),endDate:String(l.end_date||"").slice(0,10),
        unit:l.leave_unit||"day",
        mode:(l.mode_txt==="ครึ่งวันบ่าย"?"HALF_PM":l.mode_txt==="ครึ่งวันเช้า"?"HALF_AM":""),
        days:Number(l.total_days)||0,hours:Number(l.hours)||0,
        startTime:l.start_time||"",endTime:l.end_time||""};
    }).filter(Boolean);
    /* [RUN-144] แจ้งเฉพาะรหัสที่มีปัญหาจริง ไม่บล็อกทั้งรายงาน */
    rptDailyWarn=[];
    if(dupCode.length)rptDailyWarn.push("พบรหัสพนักงานซ้ำ "+dupCode.slice(0,5).join(", ")+
      (dupCode.length>5?" …":"")+" — ใช้รายการแรกในการจับคู่วันลา");
    if(lvMiss.length)rptDailyWarn.push("มีใบลาที่จับคู่พนักงานไม่ได้ "+lvMiss.length+" รหัส ("+
      lvMiss.slice(0,5).join(", ")+(lvMiss.length>5?" …":"")+
      ") — วันลาของรหัสเหล่านี้ไม่ถูกนับ ส่วนที่เหลือแสดงตามปกติ");

    var holidays={};hRows.forEach(function(h){
      var d=String(h.holiday_date||"").slice(0,10);if(d)holidays[d]=h.name||"วันหยุด"});

    var att=aRows.map(function(a){
      return {empId:a.employee_id,date:String(a.work_date||"").slice(0,10),
        checkIn:a.check_in||null,checkOut:a.check_out||null,
        workHours:a.work_hours==null?null:Number(a.work_hours),
        status:a.status||"",lateMin:a.late_min==null?null:Number(a.late_min),
        shiftName:a.shift_name||""};
    });

    var built=rptComposeDaily({from:s.from,to:s.to,employees:scope,attendance:att,
      leaves:leaves,holidays:holidays,shiftByEmp:shiftByEmp});

    /* กติกาบังคับ: Daily Dataset ต้องไม่น้อยกว่าจำนวนแถว attendance ดิบ */
    if(built.rows.length<aRows.length)throw new Error("รายงานหยุด: Daily Dataset ("+built.rows.length+
      " แถว) น้อยกว่าข้อมูลลงเวลาจริง ("+aRows.length+" แถว) — ยังไม่แสดงผลเพื่อกันข้อมูลหาย");
    rptDailyStats=built.stats;rptDailyRaw=aRows.length;
    return built.rows.map(rptDailyToAttRow);
  });
}
var rptDailyStats=null,rptDailyRaw=0;
function rptFetchAtt(){var s=rptState;var args={p_token:sbToken(),p_from:s.from,p_to:s.to,p_type:s.type==="late"?"LATE":"ATTEND",p_dept:s.deptId||null,p_employee:s.empId||null,p_q:s.empId?null:s.q||null};var key=JSON.stringify([args.p_from,args.p_to,args.p_type,args.p_dept,args.p_employee,args.p_q]);if(_rptAttInflight&&_rptAttKey===key)return _rptAttInflight;_rptAttKey=key;_rptAttInflight=(s.type==="late")?rptFetchAllPages("njhr_att_report",args,{keyOf:function(r){return String(r.employee_id||"")+"|"+String(r.work_date||"").slice(0,10)}}):rptFetchAttDaily(args,s);_rptAttInflight["catch"](function(){}).then(function(){if(_rptAttKey===key){_rptAttInflight=null;_rptAttKey=""}});return _rptAttInflight}function rptAttRow(r){function hm(t){return t?new Date(t).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Bangkok"}):"—"}var mins=r.check_in&&r.check_out?Math.max(0,Math.round((new Date(r.check_out)-new Date(r.check_in))/6e4)):null;return{date:String(r.work_date).slice(0,10),title:r.prefix||"",name:r.emp_name||"",in:hm(r.check_in),out:hm(r.check_out),statusCode:r.status||"",leaveStatus:r.leave_status||"",leaveType:r.leave_type||"",leaveMode:r.leave_mode||"",leaveFrom:r.leave_start_time||"",leaveTo:r.leave_end_time||"",rawStatus:r.raw_status||"",rawLateMin:r.raw_late_min==null?null:Number(r.raw_late_min),status:EMP_ATT_STATUS[r.status]||r.status||"",wh:mins==null?"":Math.floor(mins/60),wm:mins==null?"":mins%60,lh:r.late_min?Math.floor(r.late_min/60):r.late_min===0?0:"",lm:r.late_min?r.late_min%60:r.late_min===0?0:"",dept:r.department||"",empCode:r.emp_code||""}}function rptAttPaint(el){var box=document.getElementById("rpt-table");var pg=document.getElementById("rpt-att-pager");if(!box)return;rptChartPaint();if(rptSumOn()){rptSumPaint(box,pg);return}var total=rptAttRows.length;var pages=Math.ceil(total/RPT_ATT_PER)||1;if(rptAttPage>=pages)rptAttPage=pages-1;if(rptAttPage<0)rptAttPage=0;var start=rptAttPage*RPT_ATT_PER;var cells=rptAttRows.slice(start,start+RPT_ATT_PER).map(rptCells);box.innerHTML=cells.length?'<div class="table-wrap"><table class="rpt-att-tbl"><thead><tr>'+RPT_HEAD.map(function(h){return"<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"+cells.map(function(r){return"<tr>"+r.map(function(c){return"<td>"+esc(c)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>":emptyState(rptEmptyMsg());if(!pg)return;pg.innerHTML=pages>1?'<button class="btn btn-ghost btn-sm" id="rpt-att-prev"'+(rptAttPage===0?" disabled":"")+">ก่อนหน้า</button>"+'<span class="muted">หน้า '+(rptAttPage+1)+" / "+pages+" · แสดง "+(start+1)+"–"+Math.min(start+RPT_ATT_PER,total)+" จาก "+total+" รายการ</span>"+'<button class="btn btn-ghost btn-sm" id="rpt-att-next"'+(rptAttPage+1>=pages?" disabled":"")+">ถัดไป</button>":"";if(pages>1){document.getElementById("rpt-att-prev").onclick=function(){if(rptAttPage>0){rptAttPage--;rptAttPaint(el)}};document.getElementById("rpt-att-next").onclick=function(){if(rptAttPage+1<pages){rptAttPage++;rptAttPaint(el)}}}}function rptLoadSb(el,seq){var s=rptState,isBal=s.type==="balance";var isAtt=s.type==="attendance"||s.type==="late";if(isAtt){rptFetchAtt().then(function(rows){if(seq!==rptSeq)return;rptAttRaw=(rows||[]).map(rptAttRow);rptAttRows=rptAttApplyStatus(rptAttRaw);rptAttPaint(el);/* [RUN-144] คำเตือนระดับแถว แสดงให้เห็นแต่ไม่บล็อกรายงาน */var wEl=document.getElementById("rpt-err");if(wEl)wEl.innerHTML=(rptDailyWarn&&rptDailyWarn.length)?'<span class="chip chip-warn">ข้อควรทราบ</span> '+rptDailyWarn.map(esc).join("<br>"):"";var sum=el.querySelector(".rpt-sum");if(sum)sum.innerHTML=sum.innerHTML.replace(/จำนวนรายการ: <b>\d+ รายการ<\/b>/,rptSumOn()?"จำนวนพนักงาน: <b>"+rptSumRows().length+" คน</b>":"จำนวนรายการ: <b>"+rptAttRows.length+" รายการ</b>")}).catch(function(er){if(seq!==rptSeq)return;console.error("[REPORT] njhr_att_report ล้มเหลว:",er);var box=document.getElementById("rpt-table");if(box)box.innerHTML='<div class="ep-state ep-state-bad"><b>โหลดรายงานไม่สำเร็จ</b>'+'<small class="muted">'+esc(er.message||"")+"</small></div>"});return}(isBal?rptFetchBalance():rptFetchLeave()).then(function(rows){if(seq!==rptSeq)return;var box=document.getElementById("rpt-table");if(!box)return;var head,cells,n;if(isBal){var pv=rptBalPivot(rows);rptBalRows=pv.emps;rptBalTypes=pv.types;head=rptBalHead(pv.types);cells=pv.emps.map(function(r,i){return rptBalCells(r,pv.types,i)});n=pv.emps.length}else{rptLeaveRows=rows;head=RPT_LEAVE_HEAD;cells=rows.map(rptLeaveCells);n=rows.length}box.innerHTML=cells.length?'<div class="table-wrap"><table><thead><tr>'+head.map(function(h){return"<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"+cells.map(function(r){return"<tr>"+r.map(function(c){return"<td>"+esc(c)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>":emptyState(rptEmptyMsg());var sum=el.querySelector(".rpt-sum");if(sum)sum.innerHTML=sum.innerHTML.replace(/จำนวนรายการ: <b>\d+ รายการ<\/b>/,"จำนวนรายการ: <b>"+n+" รายการ</b>")}).catch(function(er){if(seq!==rptSeq)return;rptLeaveRows=[];rptBalRows=[];var box=document.getElementById("rpt-table");if(box)box.innerHTML=emptyState("โหลดข้อมูลไม่สำเร็จ");var e2=document.getElementById("rpt-err");if(e2)e2.textContent="โหลดข้อมูลจาก Supabase ไม่สำเร็จ: "+(er.message||er)})}function rptExportLeave(btn,isBal){var s=rptState,errEl=document.getElementById("rpt-err");var head,cells,n;if(isBal){if(!rptBalRows.length){errEl.textContent=rptEmptyMsg();return}head=rptBalHead(rptBalTypes);cells=rptBalRows.map(function(r,i){return rptBalCells(r,rptBalTypes,i)});n=rptBalRows.length}else{if(!rptLeaveRows.length){errEl.textContent=rptEmptyMsg();return}head=RPT_LEAVE_HEAD;cells=rptLeaveRows.map(rptLeaveCells);n=rptLeaveRows.length}if(btn.disabled)return;var label=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> กำลังสร้างไฟล์…';var deptTxt=s.deptId||"ทุกแผนก";var now=new Date;var stamp=rptDateBE(now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate()))+" "+pad(now.getHours())+":"+pad(now.getMinutes());var sheetName,fname,title;if(isBal){sheetName="วันลาคงเหลือ";fname="รายงานวันลาคงเหลือ_ปี_"+(s.year+543)+".xlsx";title=[db.settings.companyName,"รายงานวันลาคงเหลือ","ปีสิทธิ์การลา: "+(s.year+543),"แผนก: "+deptTxt,"สถานะพนักงาน: "+({ACTIVE:"ปฏิบัติงาน",PROBATION:"ทดลองงาน",RESIGNED:"พ้นสภาพ"}[s.empStatus]||"ทุกสถานะ"),"พนักงานทั้งหมด: "+n+" คน","วันที่ Export: "+stamp]}else{sheetName="รายงานการลา";fname="รายงานการลา_"+rptDateBE(s.from).replace(/\//g,"-")+"_ถึง_"+rptDateBE(s.to).replace(/\//g,"-")+".xlsx";var sumD=rptLeaveRows.reduce(function(a2,r){return a2+lvNum(r.total_days)},0);var sumH=rptLeaveRows.reduce(function(a2,r){return a2+lvNum(r.hours)},0);title=[db.settings.companyName,"รายงานการลา","ช่วงวันที่: "+rptDateBE(s.from)+" – "+rptDateBE(s.to),"แผนก: "+deptTxt,"ประเภทการลา: "+(s.leaveType?lvType(s.leaveType).name:"ทุกประเภท"),"สถานะ: "+(s.status?LV_STATUS_TH[s.status]:"ทุกสถานะ"),"จำนวนรายการรวม: "+n+" รายการ · จำนวนวันลารวม: "+Math.round(sumD*100)/100+" วัน · จำนวนชั่วโมงลารวม: "+Math.round(sumH*100)/100+" ชม.","วันที่ Export: "+stamp]}var widths=head.map(function(h){return Math.min(Math.max(String(h).length+4,10),30)});rptLoadZip().then(function(){return rptBuildXlsx(sheetName,head,cells,widths,title)}).then(function(blob){var a3=document.createElement("a");a3.href=URL.createObjectURL(blob);a3.download=rptSafeName(fname.replace(".xlsx",""))+".xlsx";document.body.appendChild(a3);a3.click();a3.remove();setTimeout(function(){URL.revokeObjectURL(a3.href)},4e3);audit("EXPORT","Export "+sheetName+" "+n+" รายการ");toast("ดาวน์โหลด "+sheetName+" แล้ว "+n+" รายการ")}).catch(function(ex){if(errEl)errEl.textContent="สร้างไฟล์ Excel ไม่สำเร็จ: "+(ex&&ex.message||ex)}).then(function(){btn.disabled=false;btn.innerHTML=label})}/* [RUN-149] กราฟรายงานการลงเวลา แยกตามสถานะ — Desktop เท่านั้น (ซ่อนด้วย CSS ที่ .rpt-chart)
   · ใช้ rptAttRows ชุดเดียวกับตาราง (ผ่าน rptAttApplyStatus มาแล้ว) ไม่ query ใหม่ ไม่สร้างข้อมูลใหม่
   · แสดงกราฟเดียวตามสถานะที่เลือกเท่านั้น ไม่รวม 3 สถานะในกราฟเดียว
   · refresh อัตโนมัติ เพราะ rptAttPaint() ถูกเรียกทุกครั้งที่ viewReports -> rptLoadSb เสร็จ */
/* [RUN-161] เพิ่ม "ปกติ" และเพิ่มโหมด "ทุกสถานะ" = กราฟเปรียบเทียบรายพนักงาน
   (ของเดิม RUN-149 รองรับ 3 สถานะ และไม่เลือกสถานะ = ไม่มีกราฟ — ถูกแทนที่ตามคำสั่งรอบนี้) */
var RPT_CHART_ST={NORMAL:"กราฟปกติ",LATE:"กราฟมาสาย",ABSENT:"กราฟขาดงาน",LEAVE:"กราฟลา"};
function rptChartAll(){return rptSumOn()&&!rptState.attStatus}
function rptChartTitle(){var c=rptState.attStatus;
  if(!c)return rptChartAll()?"กราฟเปรียบเทียบทุกสถานะรายพนักงาน":"";
  return RPT_CHART_ST[c]||""}
/* [RUN-161] กราฟอ่านจาก rptSumRows() ชุดเดียวกับตารางสรุป -> ตัวเลขตรงกัน 100%
   และเรียงมากสุด -> น้อยสุดมาแล้วจาก rptSumRows() */
function rptChartData(){
  var code=rptState.attStatus;
  if(code&&!RPT_CHART_ST[code])return[];
  if(!code&&!rptChartAll())return[];
  return rptSumRows().map(function(o){
    return{code:o.code,name:o.name,dept:o.dept,nb:o.n,total:o.total,
           n:code?(o.n[code]||0):(o.total||0)}
  })
}
/* ค่าสูงสุดที่ใช้สเกลแท่ง — โหมดทุกสถานะเทียบข้ามสถานะด้วยค่าเดียวกัน แท่งจึงเทียบกันได้จริง */
function rptChartMax(data){
  var m=0;
  (data||[]).forEach(function(d){
    if(rptChartAll()){RPT_SUM_ST.forEach(function(x){var v=d.nb[x[0]]||0;if(v>m)m=v})}
    else if(d.n>m)m=d.n
  });
  return m||1
}
function rptChartPaint(){
  var box=document.getElementById("rpt-chart");
  if(!box)return;
  var s=rptState,title=rptChartTitle();
  if(!title){
    box.innerHTML='<p class="muted note rpt-chart-hint">เลือกสถานะ <b>ปกติ</b> / <b>มาสาย</b> / <b>ขาดงาน</b> / <b>ลา</b> ที่ตัวกรองด้านบน เพื่อดูกราฟแยกตามสถานะ</p>';
    return
  }
  var range=esc(rptDateBE(s.from))+" – "+esc(rptDateBE(s.to));
  var data=rptChartData();
  if(!data.length){
    box.innerHTML='<div class="rpt-chart-head"><b>'+esc(title)+'</b><span class="muted">'+range+'</span></div>'
      +'<p class="muted note">ไม่มีข้อมูลในช่วงวันที่ แผนก และพนักงานที่เลือก</p>';
    return
  }
  var max=rptChartMax(data),total=0,allMode=rptChartAll();
  data.forEach(function(d){total+=d.n});
  var head='<div class="rpt-chart-head"><b>'+esc(title)+"</b>"
    +'<span class="muted">'+range+" · "+esc(s.deptId||"ทุกแผนก")+" · "+data.length+" คน · รวม "+total+" วัน</span>"
    +'<span class="grow"></span>'
    +'<button class="btn btn-ghost btn-sm" id="rpt-chart-export">'+icon("download")+" Export กราฟ</button></div>";
  if(allMode){
    /* [RUN-161] เปรียบเทียบรายพนักงาน: ปกติ | มาสาย | ขาดงาน | ลา ในคนเดียวกัน */
    box.innerHTML=head
      +'<div class="rpt-chart-legend">'+RPT_SUM_ST.map(function(x){
        return '<span class="rpt-chart-lg rpt-g-'+x[0]+'"><i></i>'+esc(x[1])+"</span>"}).join("")+"</div>"
      +'<div class="rpt-chart-body rpt-chart-gbody">'+data.map(function(d){
        var lb=(d.code?d.code+" · ":"")+d.name;
        return '<div class="rpt-chart-grp"><span class="rpt-chart-lb" title="'+esc(lb)+'">'+esc(lb)
          +'</span><span class="rpt-chart-gbars">'+RPT_SUM_ST.map(function(x){
            var v=d.nb[x[0]]||0;
            return '<span class="rpt-chart-gbar rpt-g-'+x[0]+'" title="'+esc(x[1])+" "+v+' วัน">'
              +'<i style="width:'+(v?Math.max(2,Math.round(v*100/max)):0)+'%"></i>'
              +'<em>'+esc(x[1])+" "+v+' วัน</em></span>'
          }).join("")+"</span></div>"
      }).join("")+"</div>";
  }else{
    var stTH=rptSumTH(s.attStatus);
    box.innerHTML=head
      +'<div class="rpt-chart-body">'+data.map(function(d){
        var lb=d.code?d.code+" · "+d.name:d.name;
        return '<div class="rpt-chart-row"><span class="rpt-chart-lb" title="'+esc(lb)+'">'+esc(lb)+"</span>"
          +'<span class="rpt-chart-bar"><i style="width:'+Math.max(2,Math.round(d.n*100/max))+'%"></i></span>'
          +'<b class="rpt-chart-n">'+esc(stTH)+" "+d.n+" วัน</b></div>"
      }).join("")+"</div>";
  }
  var bx=document.getElementById("rpt-chart-export");
  if(bx)bx.onclick=function(){rptChartExport(this)}
}
function rptChartExport(btn){
  var s=rptState,errEl=document.getElementById("rpt-err");
  if(errEl)errEl.textContent="";
  var title=rptChartTitle(),data=rptChartData();
  if(!title||!data.length){if(errEl)errEl.textContent="ยังไม่มีข้อมูลกราฟให้ Export";return}
  if(btn.disabled)return;
  var label=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> กำลังสร้างไฟล์…';
  function done(){btn.disabled=false;btn.innerHTML=label}
  try{
    /* [RUN-151] ขยายให้อ่านออกเมื่อคนเยอะ — แถวสูงขึ้น ช่องชื่อกว้างขึ้น ภาพกว้างขึ้น */
    var allMode=rptChartAll(),sub=22;
    /* [RUN-161] โหมดทุกสถานะใช้ 4 แท่งย่อย จึงต้องสูงขึ้น และป้ายขวากว้างขึ้นเพราะมีคำว่า "N วัน" */
    var rowH=allMode?(sub*4+12):34,padT=112,padB=30,padL=320,padR=allMode?168:200,W=1360;
    var H=padT+data.length*rowH+padB;
    /* [RUN-151] คนเยอะ = ภาพสูงมาก ถ้าคูณ dpr ต่ออาจเกินขีดจำกัดขนาด canvas ของเบราว์เซอร์
       แล้วได้ไฟล์เปล่า จึงลด dpr ลงเมื่อสูงเกิน 12000px */
    var dpr=Math.min(2,window.devicePixelRatio||1);if(H*dpr>12000)dpr=1;
    var cv=document.createElement("canvas");
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    var c=cv.getContext("2d");c.scale(dpr,dpr);
    c.fillStyle="#FFFFFF";c.fillRect(0,0,W,H);
    var range=rptDateBE(s.from)+" – "+rptDateBE(s.to),total=0;
    data.forEach(function(d){total+=d.n});
    c.textBaseline="alphabetic";c.textAlign="left";
    c.fillStyle="#111827";c.font='600 26px Prompt, sans-serif';
    c.fillText(title,28,48);
    c.fillStyle="#6B7280";c.font='15px Prompt, sans-serif';
    c.fillText("ช่วงวันที่ "+range+" · แผนก "+(s.deptId||"ทุกแผนก")+(s.q?" · ค้นหา "+s.q:""),28,76);
    c.fillText("พนักงาน "+data.length+" คน · รวม "+total+" วัน"+(allMode?" (ทุกสถานะ)":""),28,100);
    var max=rptChartMax(data),barW=W-padL-padR,stTH=rptSumTH(s.attStatus);
    data.forEach(function(d,i){
      var y=padT+i*rowH,lb=(d.code?d.code+" · ":"")+d.name;
      c.font='15px Prompt, sans-serif';c.textAlign="right";c.fillStyle="#374151";
      while(c.measureText(lb).width>padL-36&&lb.length>4)lb=lb.slice(0,-2)+"…";
      c.fillText(lb,padL-18,y+(allMode?sub*2:21));
      c.textAlign="left";
      if(allMode){
        /* [RUN-161] โหมดทุกสถานะ: 4 แท่งย่อยต่อพนักงาน (ปกติ/มาสาย/ขาดงาน/ลา) */
        RPT_SUM_ST.forEach(function(x,k){
          var v=d.nb[x[0]]||0,yy=y+4+k*sub;
          c.fillStyle="#EEF0F3";c.fillRect(padL,yy,barW,sub-3);
          c.fillStyle="#"+RPT_SUM_COLOR[x[0]];
          if(v)c.fillRect(padL,yy,Math.max(3,Math.round(v*barW/max)),sub-3);
          c.fillStyle="#111827";c.font='600 12px Prompt, sans-serif';
          c.fillText(x[1]+" "+v+" วัน",padL+barW+10,yy+sub-7)
        })
      }else{
        c.fillStyle="#E5E7EB";c.fillRect(padL,y+7,barW,18);
        c.fillStyle="#2563EB";c.fillRect(padL,y+7,Math.max(3,Math.round(d.n*barW/max)),18);
        c.fillStyle="#111827";c.font='600 15px Prompt, sans-serif';
        c.fillText(stTH+" "+d.n+" วัน",padL+barW+14,y+21)
      }
    });
    var who=s.q?rptSafeName(s.q):"ทุกคน";
    var fname=rptSafeName(title)+"_"+rptSafeName(s.deptId||"ทุกแผนก")+"_"+who+"_"
      +rptDateBE(s.from).replace(/\//g,"-")+"_ถึง_"+rptDateBE(s.to).replace(/\//g,"-")+".png";
    cv.toBlob(function(blob){
      if(!blob){if(errEl)errEl.textContent="สร้างไฟล์กราฟไม่สำเร็จ";done();return}
      var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(a.href)},4e3);
      audit("EXPORT","Export "+title+" "+data.length+" คน ("+s.from+" ถึง "+s.to+")");
      toast("ดาวน์โหลด "+title+" แล้ว "+data.length+" คน");
      done()
    },"image/png")
  }catch(ex){
    if(errEl)errEl.textContent="สร้างไฟล์กราฟไม่สำเร็จ: "+(ex&&ex.message||ex);
    done()
  }
}
/* ============================ [RUN-161] ============================
   Export Excel ของ "รายงานการลงเวลา" = 2 ส่วน
     ส่วนบน  Sheet "รายงานการลงเวลา" = ตารางสรุปจำนวนวันรายพนักงาน
     ส่วนล่าง Sheet "กราฟสรุป"        = ข้อมูลชุดเดียวกัน + กราฟแท่งของจริง
   · ใช้ rptSumRows() ตัวเดียวกับตารางและกราฟหน้าเว็บ -> ตัวเลขตรงกัน 100%
   · เรียงมากสุด -> น้อยสุด เหมือนตาราง (กราฟใช้ catAx maxMin ให้แท่งบนสุด = มากสุด)
   ================================================================= */
function rptExportSummary(btn){
  var s=rptState,errEl=document.getElementById("rpt-err");
  var rows=rptSumRows();
  if(!rows.length){if(errEl)errEl.textContent=rptEmptyMsg();return}
  if(btn.disabled)return;
  var label=btn.innerHTML;btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span> กำลังสร้างไฟล์…';
  var pick=s.attStatus||"",stTH=pick?rptSumTH(pick):"ทุกสถานะ";
  var head=rptSumHead(),cells=rows.map(function(o,i){return rptSumCells(o,i)});
  var tot=rptSumTotals(rows);
  var now=new Date;
  var stamp=rptDateBE(now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate()))
    +" "+pad(now.getHours())+":"+pad(now.getMinutes());
  var sheetName="รายงานการลงเวลา";
  var title=[db.settings.companyName,"รายงานการลงเวลา — สรุปจำนวนวันรายพนักงาน",
    "ช่วงวันที่: "+rptDateBE(s.from)+" – "+rptDateBE(s.to),
    "แผนก: "+(s.deptId||"ทุกแผนก"),
    "สถานะ: "+stTH,
    "พนักงาน: "+(s.q||"ทุกคน"),
    "จำนวนพนักงาน: "+rows.length+" คน"+(pick
      ?" · รวมจำนวนวัน"+stTH+": "+tot[pick]+" วัน"
      :" · ปกติ "+tot.NORMAL+" · มาสาย "+tot.LATE+" · ขาดงาน "+tot.ABSENT
       +" · ลา "+tot.LEAVE+" · รวม "+tot.total+" วัน"),
    "วันที่ Export: "+stamp];
  var cats=rows.map(function(o){return(o.code?o.code+" · ":"")+o.name});
  var series=pick
    ?[{name:"จำนวนวัน"+stTH,color:RPT_SUM_COLOR[pick]||"2563EB",
       values:rows.map(function(o){return o.n[pick]||0})}]
    :RPT_SUM_ST.map(function(x){return{name:x[1],color:RPT_SUM_COLOR[x[0]],
       values:rows.map(function(o){return o.n[x[0]]||0})}});
  var chart={title:(pick?rptChartTitle():"กราฟเปรียบเทียบทุกสถานะรายพนักงาน")
    +" ("+rptDateBE(s.from)+" – "+rptDateBE(s.to)+")",cats:cats,series:series};
  var fname=rptSafeName(sheetName)+"_สรุป_"+rptSafeName(s.deptId||"ทุกแผนก")+"_"
    +rptSafeName(stTH)+"_"+(s.q?rptSafeName(s.q):"ทุกคน")+"_"
    +rptDateBE(s.from).replace(/\//g,"-")+"_ถึง_"+rptDateBE(s.to).replace(/\//g,"-")+".xlsx";
  rptLoadZip().then(function(){
    return rptBuildXlsxChart(sheetName,head,cells,rptSumWidths(),title,chart)
  }).then(function(blob){
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href)},4e3);
    audit("EXPORT","Export สรุปรายงานการลงเวลา "+rows.length+" คน ("+s.from+" ถึง "+s.to+")");
    toast("ดาวน์โหลดสรุปรายงานการลงเวลาแล้ว "+rows.length+" คน")
  })["catch"](function(ex){
    if(errEl)errEl.textContent="สร้างไฟล์ Excel ไม่สำเร็จ: "+(ex&&ex.message||ex)
  }).then(function(){btn.disabled=false;btn.innerHTML=label})
}
function rptExport(btn){var s=rptState,errEl=document.getElementById("rpt-err");if(errEl)errEl.textContent="";if(s.type!=="balance"){if(!s.from||!s.to){errEl.textContent="กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดให้ครบ";return}if(s.from>s.to){errEl.textContent="วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด";return}}var isOt=s.type==="ot",isLv=s.type==="leave",isBal=s.type==="balance";if(isLv||isBal){rptExportLeave(btn,isBal);return}if(rptSumOn()){rptExportSummary(btn);return}var rows=isOt?rptOtRows():rptAttRows;if(!rows.length){errEl.textContent=rptEmptyMsg();return}if(btn.disabled)return;var label=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> กำลังสร้างไฟล์…';var late=s.type==="late";var sheetName=isOt?"รายงาน OT":late?"รายงานมาสาย":"รายงานการลงเวลา";var who=s.q?rptSafeName(s.q):"ทุกคน";var stName=!isOt&&s.attStatus?"_"+rptSafeName(EMP_ATT_STATUS[s.attStatus]||s.attStatus):"";var fname=rptSafeName(sheetName)+"_"+rptSafeName(s.deptId||"ทุกแผนก")+stName+"_"+who+"_"+rptDateBE(s.from).replace(/\//g,"-")+"_ถึง_"+rptDateBE(s.to).replace(/\//g,"-")+".xlsx";rptLoadZip().then(function(){return isOt?rptBuildXlsx(sheetName,RPT_OT_HEAD_XLS,rows.map(rptOtCellsXls),[14,11,13,24,18,18,14,28,16,13,11,13,12,26,10,12,16,14,24]):rptBuildXlsx(sheetName,RPT_HEAD,rows.map(rptCells),[13,11,10,26,22,9,9,14,14,12])}).then(function(blob){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},4e3);audit("EXPORT","Export "+sheetName+" "+rows.length+" รายการ ("+s.from+" ถึง "+s.to+")");toast("ดาวน์โหลด "+sheetName+" แล้ว "+rows.length+" รายการ")}).catch(function(ex){if(errEl)errEl.textContent="สร้างไฟล์ Excel ไม่สำเร็จ: "+(ex&&ex.message||ex)}).then(function(){btn.disabled=false;btn.innerHTML=label})}var LV_STATUS_TH={PENDING:"รออนุมัติ",APPROVED:"อนุมัติแล้ว",REJECTED:"ไม่อนุมัติ",CANCELLED:"ยกเลิก"};var OT_STATUS_TH={PENDING:"รออนุมัติ",APPROVED:"อนุมัติแล้ว",REJECTED:"ไม่อนุมัติ",CANCELLED:"ยกเลิก"};var EMP_STATUS_TH={ACTIVE:"ปฏิบัติงาน",PROBATION:"ทดลองงาน",RESIGNED:"พ้นสภาพ",SUSPENDED:"พักงาน"};var EMP_ATT_STATUS={NORMAL:"ปกติ",LATE:"มาสาย",ABSENT:"ขาดงาน",LEAVE:"ลา",HOLIDAY:"วันหยุด"};var LEAVE_MODE_TH={FULL:"เต็มวัน",HALF_AM:"ครึ่งวันเช้า",HALF_PM:"ครึ่งวันบ่าย",HOURLY:"รายชั่วโมง",HALF:"ครึ่งวัน (ไม่ระบุช่วง)"};NJHR.views.register("viewReports",viewReports)})();
