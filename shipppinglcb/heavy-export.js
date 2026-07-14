/* heavy-export.js — lazy export module (Excel/ZIP) · classic script · shares global scope with app.js */
(function(){
"use strict";
async function exportBackup(){try{toast("กำลังรวบรวมข้อมูล...","info");const[u,j,l,a,s]=await Promise.all([sb.from("users").select("*").eq("app_code",APP_CODE),sb.from("jobs").select("*").eq("app_code",APP_CODE),sb.from("job_logs").select("*").eq("app_code",APP_CODE),sb.from("attachments").select("*").eq("app_code",APP_CODE),sb.from("signatures").select("*").eq("app_code",APP_CODE)]);if(u.error||j.error||l.error)throw new Error("Backup ผิดพลาด");const payload={app:APP_VERSION,exported_at:(new Date).toISOString(),exported_by:S.user.full_name||S.user.username,counts:{users:(u.data||[]).length,jobs:(j.data||[]).length,job_logs:(l.data||[]).length,attachments:(a.data||[]).length,signatures:(s.data||[]).length},data:{users:u.data||[],jobs:j.data||[],job_logs:l.data||[],attachments:a.data||[],signatures:s.data||[]}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a2=document.createElement("a");a2.href=url;const ts=(new Date).toISOString().replace(/[:.]/g,"-");a2.download=`MASS_DISPATCH_BACKUP_${ts}.json`;document.body.appendChild(a2);a2.click();a2.remove();URL.revokeObjectURL(url);try{await sb.from("backups").insert({file_name:a2.download,created_by:S.user.id,created_by_name:S.user.full_name||S.user.username})}catch(e){console.warn("backup log insert failed",e)}toast("Backup สำเร็จ","success")}catch(e){toast("Backup ผิดพลาด: "+e.message,"error")}}
async function exportExcel(){if(!getRuntimeFeature("export")){try{toast("\u0e1f\u0e35\u0e40\u0e08\u0e2d\u0e23\u0e4c Export \u0e16\u0e39\u0e01\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19","info")}catch(_){}return}if(_IW<=768)return;try{toast("กำลังโหลดงานเสร็จแล้ว...","info");if(S.filters.dateFrom||S.filters.dateTo){try{await _ensureDateRangeLoaded();}catch(_){}}const arr=filteredJobs();if(!arr.length){toast("ไม่มีข้อมูลให้ Export","error");return}toast("กำลังโหลด library...","info");await new Promise(r=>setTimeout(r,50));await loadXlsxStyle();toast(`กำลังเตรียม ${arr.length} แถว...`,"info");await new Promise(r=>setTimeout(r,50));const FONT="Cordia New";const FONT_SIZE=12;const _excelEpoch=Date.UTC(1899,11,30);function toExcelDate(jsDateOrStr){if(!jsDateOrStr)return null;const d=jsDateOrStr instanceof Date?jsDateOrStr:new Date(jsDateOrStr);if(isNaN(d.getTime()))return null;const local=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return(local.getTime()-_excelEpoch)/864e5}function pickupToExcelDate(rawStr){if(!rawStr)return null;const m=String(rawStr).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);if(!m)return null;const t=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0));return(t-_excelEpoch)/864e5}function hoursDecimal(acceptedAt,closedAt){if(!acceptedAt||!closedAt)return null;const a=new Date(acceptedAt),b=new Date(closedAt);if(isNaN(a.getTime())||isNaN(b.getTime()))return null;const diffMs=b.getTime()-a.getTime();if(diffMs<0)return null;return Math.round(diffMs/36e5*100)/100}const doneRows=arr;console.log("[EXPORT]",{visibleRows:arr.length,exportedRows:doneRows.length,currentView:S.view,filters:S.filters});if(!doneRows.length){toast("ไม่มีงานเสร็จแล้วให้ Export","error");return}const HEADERS=["ITEM","JOB NO","JOB NJ","บริษัท","ประเภท","รายละเอียด","สถานที่รับ","สร้างเมื่อ","เวลาส่ง / รับ *วันที่","วันที่/เวลารับงานแมส","ปิดเมื่อ","คำนวนชั่วโมง","สถานะ","เหตุผลยกเลิก","แมสเซ็นเจอร์","ผู้สร้าง"];const YELLOW_HEADER_COLS=new Set([8,9,10,11]);const thinBorder={style:"thin",color:{rgb:"FF000000"}};const fullBorder={top:thinBorder,bottom:thinBorder,left:thinBorder,right:thinBorder};const headerOrange={font:{name:FONT,sz:FONT_SIZE,bold:true,color:{rgb:"FF000000"}},fill:{patternType:"solid",fgColor:{rgb:"FFFFC000"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:fullBorder};const headerYellow={font:{name:FONT,sz:FONT_SIZE,bold:true,color:{rgb:"FF000000"}},fill:{patternType:"solid",fgColor:{rgb:"FFFFFF00"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:fullBorder};const dataItemStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF000000"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataGreenStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF065F46"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataTextStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataDateStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},numFmt:"dd/mm/yyyy hh:mm",border:fullBorder};const dataHoursStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},numFmt:"0.00",border:fullBorder};const COL_WIDTHS=[{wch:6},{wch:17.89},{wch:23.55},{wch:15},{wch:15},{wch:18},{wch:18},{wch:18},{wch:22},{wch:22},{wch:22},{wch:15},{wch:15},{wch:18},{wch:15},{wch:15}];const wb=XLSX.utils.book_new();{const sheetRows=doneRows;const sheetData=[HEADERS];let item=1;for(const j of sheetRows){const pickupRaw=j.pickup_time||null;const pickupExcel=pickupToExcelDate(pickupRaw);const createdExcel=toExcelDate(j.created_at);const acceptedExcel=toExcelDate(j.accepted_at);const closedExcel=toExcelDate(j.closed_at);const hoursDec=hoursDecimal(j.accepted_at,j.closed_at);sheetData.push([item++,j.job_no||"",j.job_nj||"",j.company||"",j.category||"",j.description||"",j.pickup_location||"",createdExcel,pickupExcel,acceptedExcel,closedExcel,hoursDec,STATUS_LABELS[j.status]||j.status,j.cancel_reason||"",j.assigned_to_name||"",j.created_by_name||""])}const ws=XLSX.utils.aoa_to_sheet(sheetData);for(let c=0;c<HEADERS.length;c++){const ref=XLSX.utils.encode_cell({r:0,c});if(!ws[ref])ws[ref]={t:"s",v:HEADERS[c]};ws[ref].s=YELLOW_HEADER_COLS.has(c)?headerYellow:headerOrange}for(let r=0;r<sheetRows.length;r++){const rowIdx=1+r;for(let c=0;c<HEADERS.length;c++){const ref=XLSX.utils.encode_cell({r:rowIdx,c});if(!ws[ref])ws[ref]={t:"s",v:""};if(c===0){ws[ref].s=dataItemStyle;ws[ref].t="n"}else if(c===1||c===2){ws[ref].s=dataGreenStyle;ws[ref].t="s"}else if(c>=7&&c<=10){ws[ref].s=dataDateStyle;if(ws[ref].v!=null&&ws[ref].v!==""){ws[ref].t="n"}else{ws[ref].v="";ws[ref].t="s"}}else if(c===11){ws[ref].s=dataHoursStyle;if(ws[ref].v!=null&&ws[ref].v!==""){ws[ref].t="n"}else{ws[ref].v="";ws[ref].t="s"}}else{ws[ref].s=dataTextStyle;ws[ref].t="s"}}}ws["!cols"]=COL_WIDTHS;ws["!rows"]=[{hpt:32}];for(let r=0;r<sheetRows.length;r++){ws["!rows"][r+1]={hpt:20}}ws["!freeze"]={xSplit:0,ySplit:1};if(!ws["!views"])ws["!views"]=[{}];ws["!views"][0].state="frozen";ws["!views"][0].ySplit=1;ws["!views"][0].topLeftCell="A2";XLSX.utils.book_append_sheet(wb,ws,"งานเสร็จแล้ว")}toast("กำลังสร้างไฟล์ Excel...","info");await new Promise(r=>setTimeout(r,50));if(!wb.Workbook)wb.Workbook={};if(!wb.Workbook.Views)wb.Workbook.Views=[{}];wb.Workbook.Views[0]={RTL:false};const today=new Date;const yyyy=today.getFullYear();const mm=String(today.getMonth()+1).padStart(2,"0");const dd=String(today.getDate()).padStart(2,"0");const _xfname=`${yyyy}-${mm}-${dd}.xlsx`;const _zfname=`${yyyy}-${mm}-${dd}.zip`;const _dlBlob=(blob,fname)=>{const _url=URL.createObjectURL(blob);const _a=document.createElement("a");_a.href=_url;_a.download=fname;_a.rel="noopener";_a.style.display="none";document.body.appendChild(_a);_a.click();setTimeout(()=>{try{_a.remove();URL.revokeObjectURL(_url)}catch(_){}},2e3)};try{toast("กำลังสร้างไฟล์สถานที่วิ่งงาน...","info");const wbPlaces=_buildPlacesWorkbook(doneRows);await new Promise(r=>setTimeout(r,30));await loadJSZip();const _ab1=XLSX.write(wb,{bookType:"xlsx",type:"array"});const _ab2=XLSX.write(wbPlaces,{bookType:"xlsx",type:"array"});const _zip=new JSZip;_zip.file(_xfname,_ab1);_zip.file("สถานที่วิ่งงาน_รวมทุกคน.xlsx",_ab2);const _zblob=await _zip.generateAsync({type:"blob",compression:"DEFLATE"});_dlBlob(_zblob,_zfname);toast(`Export ${doneRows.length} งาน (ZIP 2 ไฟล์)`,"success")}catch(_zerr){console.warn("[export] zip failed → fallback single xlsx",_zerr);let _dlOk=false;try{const _wbout=XLSX.write(wb,{bookType:"xlsx",type:"array"});_dlBlob(new Blob([_wbout],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),_xfname);_dlOk=true}catch(_){}if(!_dlOk)XLSX.writeFile(wb,_xfname);toast(`Export ${doneRows.length} งานเสร็จแล้ว (ZIP ไม่สำเร็จ — ได้ไฟล์งานเดี่ยว)`,"info")}}catch(e){toast("Export ผิดพลาด: "+e.message,"error")}}
async function docExportExcel(){if(_IW<=768)return;try{await loadXlsxStyle();const status=DOC.view||"all";let list=_docVisibleList();if(status!=="all"){if(status==="EDIT")list=list.filter(d=>d.category===EDIT_CATEGORY&&d.doc_status==="COMPLETED");else if(status==="FZ")list=list.filter(d=>_isFZTerminal(d.import_terminal)&&(d.doc_status==="NEW"||d.doc_status==="RECEIVED"||d.doc_status==="POSTPONED"));else if(status==="TONREN")list=list.filter(d=>d.category===TONREN_TYPE&&(d.doc_status==="NEW"||d.doc_status==="RECEIVED"||d.doc_status==="POSTPONED"));else if(status==="RECEIVED")list=list.filter(d=>d.doc_status==="RECEIVED"||d.doc_status==="NEW");else list=list.filter(d=>d.doc_status===status)}else if(DOC.filters.status&&DOC.filters.status!=="ALL"){list=list.filter(d=>d.doc_status===DOC.filters.status)}const q=(DOC.filters.search||"").trim().toLowerCase();if(q){list=list.filter(d=>[d.source_job_no,d.doc_no,d.company,d.location,d.import_terminal,d.category,d.description,d.creator_name,d.sender_name,d.assigned_name,d.assigned_user].some(x=>String(x||"").toLowerCase().includes(q)))}if(status!=="all"&&DOC.filters.terminal){const _ft=_normLoc(DOC.filters.terminal);list=list.filter(d=>_normLoc(d.import_terminal)===_ft||_splitTerminals(d.import_terminal).map(_normLoc).includes(_ft))}if(DOC.filters.docCat){list=list.filter(d=>d.category===DOC.filters.docCat)}list.sort((a,b)=>{const pa=a.priority==="urgent"?0:1,pb=b.priority==="urgent"?0:1;if(pa!==pb)return pa-pb;return new Date(b.mass_closed_at||b.created_at||0)-new Date(a.mass_closed_at||a.created_at||0)});if(!list.length){toast("ไม่มีข้อมูลให้ Export","error");return}const menuLabel=status==="all"?"เอกสารทั้งหมด":status==="EDIT"?"งานแก้ไข":DOC_STATUS_META[status]&&DOC_STATUS_META[status].label||status;const fileSuffix=status!=="all"&&DOC.filters.terminal?"_"+DOC.filters.terminal:"";const headers=["ลำดับ","JOB NO","ความเร่งด่วน","บริษัท","ประเภทงาน","วันที่/เวลารับงานชิปปิ้ง","รายละเอียด","ท่านำเข้า","USER (ผู้เปิดงาน)","ชิปปิ้ง (ผู้รับผิดชอบ)","สถานะเอกสาร","เวลาส่งจากแมส"];const body=list.map((d,i)=>[i+1,d.source_job_no||d.doc_no||"",d.priority==="urgent"?"🔴 ด่วน":"🟢 ไม่ด่วน",d.company||"",d.category||"",d.received_at?fmtDateTime(d.received_at):"",d.description||"",d.import_terminal||"",d.creator_name||"",d.assigned_name||"",DOC_STATUS_META[d.doc_status]&&DOC_STATUS_META[d.doc_status].label||d.doc_status||"",d.mass_closed_at?fmtDateTime(d.mass_closed_at):""]);const ws=XLSX.utils.aoa_to_sheet([headers,...body]);const range=XLSX.utils.decode_range(ws["!ref"]);for(let c=range.s.c;c<=range.e.c;c++){const ref=XLSX.utils.encode_cell({r:0,c});if(ws[ref])ws[ref].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F2937"}},alignment:{horizontal:"center",vertical:"center"},border:{bottom:{style:"thin",color:{rgb:"374151"}}}}}for(let r=1;r<=range.e.r;r++){for(let c=range.s.c;c<=range.e.c;c++){const ref=XLSX.utils.encode_cell({r,c});if(ws[ref])ws[ref].s={alignment:{vertical:"center",wrapText:c===6,horizontal:c===0||c===2?"center":"left"}}}}ws["!cols"]=[{wch:6},{wch:18},{wch:11},{wch:22},{wch:20},{wch:20},{wch:30},{wch:18},{wch:16},{wch:18},{wch:15},{wch:20}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,String(menuLabel).substring(0,28));const _dfname=`DOCUMENT_${menuLabel}${fileSuffix}.xlsx`;let _dlOk2=false;try{const _wbout=XLSX.write(wb,{bookType:"xlsx",type:"array"});const _blob=new Blob([_wbout],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const _url=URL.createObjectURL(_blob);const _a=document.createElement("a");_a.href=_url;_a.download=_dfname;_a.rel="noopener";_a.style.display="none";document.body.appendChild(_a);_a.click();setTimeout(()=>{try{_a.remove();URL.revokeObjectURL(_url)}catch(_){}},2e3);_dlOk2=true}catch(_dlErr){console.warn("[doc export] blob download failed → fallback writeFile",_dlErr)}if(!_dlOk2)XLSX.writeFile(wb,_dfname);toast("Export Excel สำเร็จ","success")}catch(e){toast("Export ผิดพลาด: "+(e.message||e),"error")}}
function _expToday(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function openExportChooser(force){
  if(!force&&typeof S!=="undefined"&&S.view!=="done-today"){return exportExcel();}
  if(typeof getRuntimeFeature==="function"&&!getRuntimeFeature("export")){try{toast("ฟีเจอร์ Export ถูกปิดใช้งาน","info")}catch(_){}return;}
  var old=document.getElementById("exp-chooser-ov");if(old)old.remove();
  var td=_expToday();
  var ov=document.createElement("div");ov.id="exp-chooser-ov";
  ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px";
  ov.innerHTML='<div style="background:#1e2530;color:#e5e7eb;border-radius:14px;max-width:430px;width:100%;padding:22px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:inherit">'
   +'<div style="font-size:18px;font-weight:800;margin-bottom:4px">EXPORT งานเสร็จแล้ว</div>'
   +'<div style="font-size:12px;opacity:.7;margin-bottom:16px">เฉพาะงาน 🕒 สร้างงาน OT ตามวันที่สร้าง</div>'
   +'<div style="font-size:13px;opacity:.85;margin-bottom:8px">ประเภทการ Export</div>'
   +'<label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;cursor:pointer"><input type="radio" name="exp-mode" value="excel" checked> Export Excel</label>'
   +'<label style="display:flex;gap:8px;align-items:center;margin-bottom:16px;cursor:pointer"><input type="radio" name="exp-mode" value="zip"> Export ZIP FILE</label>'
   +'<div style="display:flex;gap:10px;margin-bottom:18px">'
   +'<div style="flex:1"><div style="font-size:12px;opacity:.85;margin-bottom:4px">วันที่เริ่มต้น</div><input id="exp-from" type="date" value="'+td+'" style="width:100%;padding:8px;border-radius:8px;border:1px solid #374151;background:#111827;color:#e5e7eb"></div>'
   +'<div style="flex:1"><div style="font-size:12px;opacity:.85;margin-bottom:4px">วันที่สิ้นสุด</div><input id="exp-to" type="date" value="'+td+'" style="width:100%;padding:8px;border-radius:8px;border:1px solid #374151;background:#111827;color:#e5e7eb"></div>'
   +'</div>'
   +'<div style="display:flex;gap:10px;justify-content:flex-end">'
   +'<button id="exp-cancel" style="padding:9px 16px;border-radius:8px;border:1px solid #374151;background:transparent;color:#e5e7eb;cursor:pointer">ยกเลิก</button>'
   +'<button id="exp-go" style="padding:9px 20px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-weight:700;cursor:pointer">EXPORT</button>'
   +'</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener("click",function(e){if(e.target===ov)ov.remove();});
  document.getElementById("exp-cancel").onclick=function(){ov.remove();};
  document.getElementById("exp-go").onclick=function(){
    var m=(ov.querySelector('input[name="exp-mode"]:checked')||{}).value||"excel";
    var from=document.getElementById("exp-from").value,to=document.getElementById("exp-to").value;
    if(!from||!to){try{toast("กรุณาเลือกวันที่","error")}catch(_){}return;}
    if(from>to){try{toast("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด","error")}catch(_){}return;}
    var goBtn=this;goBtn.disabled=true;var _gt=goBtn.textContent;goBtn.textContent="กำลังสร้างไฟล์...";Promise.resolve().then(function(){return _runExport(m,from,to);}).catch(function(e){try{toast("Export ผิดพลาด","error")}catch(_){}}).finally(function(){try{goBtn.disabled=false;goBtn.textContent=_gt;}catch(_){}ov.remove();});
  };
}
async function _expFetchOT(from,to){
  if(typeof sb==="undefined"||!sb){throw new Error("no supabase client");}
  var fromStart=new Date(from+"T00:00:00");var toEnd=new Date(to+"T00:00:00");toEnd.setDate(toEnd.getDate()+1);
  var fISO=fromStart.toISOString(),tISO=toEnd.toISOString();
  var seen={},out=[],PAGE=1000,page=0;
  while(page<=50){
    var res=await sb.from("jobs").select("*").eq("app_code",APP_CODE).eq("category",OT_CATEGORY).gte("created_at",fISO).lt("created_at",tISO).order("created_at",{ascending:true}).range(page*PAGE,page*PAGE+PAGE-1);
    if(res&&res.error){console.error("[OT EXPORT ERROR]",res.error);throw new Error("query failed");}
    var data=(res&&res.data)||[];
    for(var i=0;i<data.length;i++){var j=data[i];if(j&&j.id!=null&&!seen[j.id]){seen[j.id]=1;out.push(j);}}
    if(data.length<PAGE)break;
    page++;
  }
  return out;
}
async function _runExport(mode,from,to){
  var base;
  try{base=await _expFetchOT(from,to);}catch(e){console.error("[OT EXPORT ERROR]",e);try{toast("ไม่สามารถ Export ข้อมูลได้ กรุณาลองใหม่","error")}catch(_){}return;}
  var rows=_expBuildRows(base);
  if(!rows.length){try{toast("ไม่พบงาน OT ในช่วงวันที่ที่เลือก","error")}catch(_){}return;}
  if(mode==="zip")return _exportDoneZip(rows,from,to);
  return _expExportSingle(rows,from,to);
}
function _expBuildRows(jobs){
  var out=[];
  for(var x=0;x<jobs.length;x++){
    var j=jobs[x];var items=_otParseRows(j);if(!items.length)continue;
    for(var y=0;y<items.length;y++){
      var it=items[y];var term=String(it.term||"").trim()||"CS";var name=String(j.created_by_name||"").trim()||"-";
      out.push({jobNo:String(j.job_no||""),createdAt:(typeof fmtDateTime==="function"?fmtDateTime(j.created_at):String(j.created_at||"")),
        creator:name,assignee:String(j.assigned_to_name||"").trim()||"-",jobNj:String(it.nj||""),
        company:String(it.company||""),branch:String(it.branch||""),qty:(parseFloat(String(it.qty).replace(/,/g,""))||0),amount:(parseFloat(String(it.amount).replace(/,/g,""))||0),
        term:term,name:name,_ca:String(j.created_at||""),_i:out.length});
    }
  }
  return out;
}
function _expCmp(a,b){
  var ar=a.term==="CS"?0:1,br=b.term==="CS"?0:1;if(ar!==br)return ar-br;
  if(a.term!==b.term)return a.term.localeCompare(b.term,"en",{numeric:true});
  if(a.name!==b.name)return a.name.localeCompare(b.name,"th");
  var ca=String(a._ca||"").localeCompare(String(b._ca||""));if(ca!==0)return ca;
  var jn=String(a.jobNo||"").localeCompare(String(b.jobNo||""),"en",{numeric:true});if(jn!==0)return jn;
  return a._i-b._i;
}
function _expSort(rows){return rows.slice().sort(_expCmp);}
function _expBook(rows,sheetName,headerE,groupBy){
  var HEAD=["ITEM","เลขที่ใบงาน","วันที่สร้าง","ผู้สร้าง",headerE,"JOB NJ","บริษัท","สาขา","จำนวน(ใบ)","จำนวนเงิน","ท่านำเข้า"];
  var BORD={top:{style:"thin",color:{rgb:"888888"}},bottom:{style:"thin",color:{rgb:"888888"}},left:{style:"thin",color:{rgb:"888888"}},right:{style:"thin",color:{rgb:"888888"}}};
  var HS={font:{bold:true,sz:11,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F4E78"}},border:BORD,alignment:{horizontal:"center",vertical:"center"}};
  function al(c){return (c===0||c===8||c===9)?"right":"left";}
  function ds(c){return {font:{sz:11},border:BORD,alignment:{horizontal:al(c),vertical:"center"}};}
  var ws={};function put(r,c,cell){ws[XLSX.utils.encode_cell({r:r,c:c})]=cell;}
  var W=HEAD.map(function(h){return String(h).length;});
  function tw(c,t){var L=String(t==null?"":t).length;if(L>W[c])W[c]=L;}
  for(var c=0;c<11;c++)put(0,c,{v:HEAD[c],t:"s",s:HS});
  var R=1,item=0,firstDataR=1,lastDataR=1,subRows=[],_seen=new Set();
  function dataRow(row){
    var _jn=String(row.jobNo||"").trim();var _dup=(_jn&&_seen.has(_jn));var _iv;if(_jn&&!_dup){_seen.add(_jn);item++;_iv=item;}else{_iv="";}
    var v=[_iv,String(row.jobNo||""),String(row.createdAt||""),String(row.creator||""),String(row.assignee||""),String(row.jobNj||""),String(row.company||""),String(row.branch||""),row.qty,row.amount,String(row.term||"")];
    for(var c=0;c<11;c++){var cell;
      if(c===0)cell=(_iv===""?{v:"",t:"s",s:ds(0)}:{v:_iv,t:"n",s:ds(0)});
      else if(c===8)cell={v:row.qty,t:"n",z:"#,##0",s:ds(8)};
      else if(c===9)cell={v:row.amount,t:"n",z:"#,##0.00",s:ds(9)};
      else cell={v:String(v[c]).toUpperCase(),t:"s",s:ds(c)};
      put(R,c,cell);tw(c,v[c]);}
    lastDataR=R;R++;
  }
  function fsum(col,sR,eR){return sR===eR?("SUM("+col+(sR+1)+")"):("SUM("+col+(sR+1)+":"+col+(eR+1)+")");}
  function sumRow(sR,eR,sq,sa,bold,mode){
    var es=mode==="full"?BORD:(mode==="bottom"?{bottom:{style:"thin",color:{rgb:"888888"}}}:null);
    if(mode==="full"){for(var c=0;c<11;c++){if(c!==8&&c!==9)put(R,c,{s:{border:BORD}});}}
    var st8={font:{sz:11,bold:!!bold},alignment:{horizontal:"right",vertical:"center"}};if(es)st8.border=es;
    var st9={font:{sz:11,bold:!!bold},alignment:{horizontal:"right",vertical:"center"}};if(es)st9.border=es;
    put(R,8,{t:"n",f:fsum("I",sR,eR),v:sq,z:"#,##0",s:st8});
    put(R,9,{t:"n",f:fsum("J",sR,eR),v:sa,z:"#,##0.00",s:st9});
    R++;
  }
  function grandRow(tq,ta,bold){
    var fi="SUM("+subRows.map(function(r){return "I"+(r+1);}).join(",")+")";
    var fj="SUM("+subRows.map(function(r){return "J"+(r+1);}).join(",")+")";
    var es={bottom:{style:"thin",color:{rgb:"888888"}}};
    put(R,8,{t:"n",f:fi,v:tq,z:"#,##0",s:{font:{sz:11,bold:!!bold},border:es,alignment:{horizontal:"right",vertical:"center"}}});
    put(R,9,{t:"n",f:fj,v:ta,z:"#,##0.00",s:{font:{sz:11,bold:!!bold},border:es,alignment:{horizontal:"right",vertical:"center"}}});
    R++;
  }
  function blankRow(){for(var c=0;c<11;c++)put(R,c,{s:{border:BORD}});R++;}
  var TQ=0,TA=0;
  if(groupBy){
    var i=0;
    while(i<rows.length){
      var key=(groupBy==="term")?rows[i].term:rows[i].name,gS=R,sq=0,sa=0;
      while(i<rows.length&&((groupBy==="term")?rows[i].term:rows[i].name)===key){sq+=(rows[i].qty||0);sa+=(rows[i].amount||0);dataRow(rows[i]);i++;}
      subRows.push(R);TQ+=sq;TA+=sa;sumRow(gS,R-1,sq,sa,true,"full");blankRow();}
    if(subRows.length)grandRow(TQ,TA,true);
  }else{
    for(var k=0;k<rows.length;k++){TQ+=(rows[k].qty||0);TA+=(rows[k].amount||0);dataRow(rows[k]);}
    if(item>0)sumRow(firstDataR,lastDataR,TQ,TA,true,"bottom");
  }
  ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R-1,c:10}});
  ws["!cols"]=W.map(function(w){return {wch:Math.min(Math.max(w+2,5),40)};});
  var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheetName);return wb;
}
function _expDownload(buf,fn){
  var blob=new Blob([buf],{type:"application/octet-stream"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();
  setTimeout(function(){try{URL.revokeObjectURL(a.href)}catch(_){}a.remove();},1500);
}
function _expNameSuffix(from,to){var f2=from.replace(/-/g,""),t2=to.replace(/-/g,"");return (from===to)?f2:(f2+"_ถึง_"+t2);}
async function _expExportSingle(rows,from,to){
  try{if(typeof loadXlsxStyle==="function")await loadXlsxStyle();}catch(e){try{toast("โหลดไลบรารีไม่สำเร็จ","error")}catch(_){}return;}
  if(typeof XLSX==="undefined"){try{toast("ไลบรารี Export ไม่พร้อม","error")}catch(_){}return;}
  var wb=_expBook(_expSort(rows),"รวมทั้งหมด","ผู้รับงาน",null);
  var buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});
  _expDownload(buf,"ใบปิดบัญชีงานOT_"+_expNameSuffix(from,to)+".xlsx");
  try{toast("Export Excel สำเร็จ ("+rows.length+" รายการ)","success")}catch(_){}
}
async function _exportDoneZip(rows,from,to){
  try{if(typeof loadXlsxStyle==="function")await loadXlsxStyle();if(typeof loadJSZip==="function")await loadJSZip();}catch(e){try{toast("โหลดไลบรารีไม่สำเร็จ","error")}catch(_){}return;}
  if(typeof XLSX==="undefined"||typeof JSZip==="undefined"){try{toast("ไลบรารี Export ไม่พร้อม","error")}catch(_){}return;}
  var csRows=[],tmRows=[];for(var i=0;i<rows.length;i++){(rows[i].term==="CS"?csRows:tmRows).push(rows[i]);}
  var wbCS=_expBook(_expSort(csRows),"เฉพาะ CS","ผู้รับงาน","name");
  var wbTM=_expBook(_expSort(tmRows),"รวมท่านำเข้า","🏃 ผู้รับงาน","term");
  var wbAll=_expBook(_expSort(rows),"รวมทั้งหมด","ผู้รับงาน",null);
  var zip=new JSZip();
  zip.file("ใบปิดบัญชีเฉพาะ CS.xlsx",XLSX.write(wbCS,{bookType:"xlsx",type:"array"}));
  zip.file("ใบปิดบัญชีรวมท่านำเข้า.xlsx",XLSX.write(wbTM,{bookType:"xlsx",type:"array"}));
  zip.file("ใบปิดบัญชีรวม CS และท่านำเข้า.xlsx",XLSX.write(wbAll,{bookType:"xlsx",type:"array"}));
  var blob=await zip.generateAsync({type:"blob"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ใบปิดบัญชีงานOT_"+_expNameSuffix(from,to)+".zip";document.body.appendChild(a);a.click();
  setTimeout(function(){try{URL.revokeObjectURL(a.href)}catch(_){}a.remove();},1500);
  try{toast("Export ZIP สำเร็จ ("+rows.length+" รายการ)","success")}catch(_){}
}
window.HeavyExport={openExportChooser:openExportChooser,exportExcel:exportExcel,docExportExcel:docExportExcel,exportBackup:exportBackup};
})();
