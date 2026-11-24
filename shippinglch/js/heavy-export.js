/* heavy-export.js — lazy export module (Excel/ZIP) · classic script · shares global scope with app.js */
(function(){
"use strict";
async function exportBackup(){try{toast("กำลังรวบรวมข้อมูล...","info");const[u,j,l,a,s]=await Promise.all([(async()=>{try{return{data:await _msUserRows(),error:null}}catch(e){return{data:null,error:e}}})(),sb.from("jobs").select("*").eq("app_code",APP_CODE),sb.from("job_logs").select("*").eq("app_code",APP_CODE),sb.from("attachments").select("*").eq("app_code",APP_CODE),sb.from("signatures").select("*").eq("app_code",APP_CODE)]);if(u.error||j.error||l.error)throw new Error("Backup ผิดพลาด");const payload={app:APP_VERSION,exported_at:(new Date).toISOString(),exported_by:S.user.full_name||S.user.username,counts:{users:(u.data||[]).length,jobs:(j.data||[]).length,job_logs:(l.data||[]).length,attachments:(a.data||[]).length,signatures:(s.data||[]).length},data:{users:u.data||[],jobs:j.data||[],job_logs:l.data||[],attachments:a.data||[],signatures:s.data||[]}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a2=document.createElement("a");a2.href=url;const ts=(new Date).toISOString().replace(/[:.]/g,"-");a2.download=`MASS_DISPATCH_BACKUP_${ts}.json`;document.body.appendChild(a2);a2.click();a2.remove();URL.revokeObjectURL(url);try{await sb.from("backups").insert({file_name:a2.download,created_by:S.user.id,created_by_name:S.user.full_name||S.user.username})}catch(e){console.warn("backup log insert failed",e)}toast("Backup สำเร็จ","success")}catch(e){toast("Backup ผิดพลาด: "+e.message,"error")}}
async function exportExcel(_opt){var _col=!!(_opt&&_opt.collect);if(!getRuntimeFeature("export")){try{toast("\u0e1f\u0e35\u0e40\u0e08\u0e2d\u0e23\u0e4c Export \u0e16\u0e39\u0e01\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19","info")}catch(_){}return}if(_IW<=768)return;try{toast("กำลังโหลดงานเสร็จแล้ว...","info");if(S.filters.dateFrom||S.filters.dateTo){try{await _ensureDateRangeLoaded();}catch(_){}}const arr=filteredJobs();if(!arr.length){if(_col)return{empty:true};toast("ไม่มีข้อมูลให้ Export","error");return}toast("กำลังโหลด library...","info");await new Promise(r=>setTimeout(r,50));await loadXlsxStyle();toast(`กำลังเตรียม ${arr.length} แถว...`,"info");await new Promise(r=>setTimeout(r,50));const FONT="Cordia New";const FONT_SIZE=12;const _excelEpoch=Date.UTC(1899,11,30);function toExcelDate(jsDateOrStr){if(!jsDateOrStr)return null;const d=jsDateOrStr instanceof Date?jsDateOrStr:new Date(jsDateOrStr);if(isNaN(d.getTime()))return null;const local=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return(local.getTime()-_excelEpoch)/864e5}function pickupToExcelDate(rawStr){if(!rawStr)return null;const m=String(rawStr).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);if(!m)return null;const t=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0));return(t-_excelEpoch)/864e5}function hoursDecimal(acceptedAt,closedAt){if(!acceptedAt||!closedAt)return null;const a=new Date(acceptedAt),b=new Date(closedAt);if(isNaN(a.getTime())||isNaN(b.getTime()))return null;const diffMs=b.getTime()-a.getTime();if(diffMs<0)return null;return Math.round(diffMs/36e5*100)/100}const doneRows=arr;console.log("[EXPORT]",{visibleRows:arr.length,exportedRows:doneRows.length,currentView:S.view,filters:S.filters});if(!doneRows.length){toast("ไม่มีงานเสร็จแล้วให้ Export","error");return}const HEADERS=["ITEM","JOB NO","JOB NJ","บริษัท","ประเภท","รายละเอียด","สถานที่รับ","สร้างเมื่อ","เวลาส่ง / รับ *วันที่","วันที่/เวลารับงานแมส","ปิดเมื่อ","คำนวนชั่วโมง","สถานะ","เหตุผลยกเลิก","แมสเซ็นเจอร์","ผู้สร้าง"];const YELLOW_HEADER_COLS=new Set([8,9,10,11]);const thinBorder={style:"thin",color:{rgb:"FF000000"}};const fullBorder={top:thinBorder,bottom:thinBorder,left:thinBorder,right:thinBorder};const headerOrange={font:{name:FONT,sz:FONT_SIZE,bold:true,color:{rgb:"FF000000"}},fill:{patternType:"solid",fgColor:{rgb:"FFFFC000"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:fullBorder};const headerYellow={font:{name:FONT,sz:FONT_SIZE,bold:true,color:{rgb:"FF000000"}},fill:{patternType:"solid",fgColor:{rgb:"FFFFFF00"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:fullBorder};const dataItemStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF000000"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataGreenStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF065F46"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataTextStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},border:fullBorder};const dataDateStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},numFmt:"dd/mm/yyyy hh:mm",border:fullBorder};const dataHoursStyle={font:{name:FONT,sz:FONT_SIZE,color:{rgb:"FF111827"}},fill:{patternType:"solid",fgColor:{rgb:"FFF9FAFB"}},alignment:{horizontal:"center",vertical:"center"},numFmt:"0.00",border:fullBorder};const COL_WIDTHS=[{wch:6},{wch:17.89},{wch:23.55},{wch:15},{wch:15},{wch:18},{wch:18},{wch:18},{wch:22},{wch:22},{wch:22},{wch:15},{wch:15},{wch:18},{wch:15},{wch:15}];const wb=XLSX.utils.book_new();{const sheetRows=doneRows;const sheetData=[HEADERS];let item=1;for(const j of sheetRows){const pickupRaw=j.pickup_time||null;const pickupExcel=pickupToExcelDate(pickupRaw);const createdExcel=toExcelDate(j.created_at);const acceptedExcel=toExcelDate(j.accepted_at);const closedExcel=toExcelDate(j.closed_at);const hoursDec=hoursDecimal(j.accepted_at,j.closed_at);sheetData.push([item++,j.job_no||"",j.job_nj||"",j.company||"",j.category||"",j.description||"",j.pickup_location||"",createdExcel,pickupExcel,acceptedExcel,closedExcel,hoursDec,STATUS_LABELS[j.status]||j.status,j.cancel_reason||"",j.assigned_to_name||"",j.created_by_name||""])}const ws=XLSX.utils.aoa_to_sheet(sheetData);for(let c=0;c<HEADERS.length;c++){const ref=XLSX.utils.encode_cell({r:0,c});if(!ws[ref])ws[ref]={t:"s",v:HEADERS[c]};ws[ref].s=YELLOW_HEADER_COLS.has(c)?headerYellow:headerOrange}for(let r=0;r<sheetRows.length;r++){const rowIdx=1+r;for(let c=0;c<HEADERS.length;c++){const ref=XLSX.utils.encode_cell({r:rowIdx,c});if(!ws[ref])ws[ref]={t:"s",v:""};if(c===0){ws[ref].s=dataItemStyle;ws[ref].t="n"}else if(c===1||c===2){ws[ref].s=dataGreenStyle;ws[ref].t="s"}else if(c>=7&&c<=10){ws[ref].s=dataDateStyle;if(ws[ref].v!=null&&ws[ref].v!==""){ws[ref].t="n"}else{ws[ref].v="";ws[ref].t="s"}}else if(c===11){ws[ref].s=dataHoursStyle;if(ws[ref].v!=null&&ws[ref].v!==""){ws[ref].t="n"}else{ws[ref].v="";ws[ref].t="s"}}else{ws[ref].s=dataTextStyle;ws[ref].t="s"}}}ws["!cols"]=COL_WIDTHS;ws["!rows"]=[{hpt:32}];for(let r=0;r<sheetRows.length;r++){ws["!rows"][r+1]={hpt:20}}ws["!freeze"]={xSplit:0,ySplit:1};if(!ws["!views"])ws["!views"]=[{}];ws["!views"][0].state="frozen";ws["!views"][0].ySplit=1;ws["!views"][0].topLeftCell="A2";XLSX.utils.book_append_sheet(wb,ws,"งานเสร็จแล้ว")}toast("กำลังสร้างไฟล์ Excel...","info");await new Promise(r=>setTimeout(r,50));if(!wb.Workbook)wb.Workbook={};if(!wb.Workbook.Views)wb.Workbook.Views=[{}];wb.Workbook.Views[0]={RTL:false};const today=new Date;const yyyy=today.getFullYear();const mm=String(today.getMonth()+1).padStart(2,"0");const dd=String(today.getDate()).padStart(2,"0");const _xfname=`${yyyy}-${mm}-${dd}.xlsx`;const _zfname=`${yyyy}-${mm}-${dd}.zip`;const _dlBlob=(blob,fname)=>{const _url=URL.createObjectURL(blob);const _a=document.createElement("a");_a.href=_url;_a.download=fname;_a.rel="noopener";_a.style.display="none";document.body.appendChild(_a);_a.click();setTimeout(()=>{try{_a.remove();URL.revokeObjectURL(_url)}catch(_){}},2e3)};try{toast("กำลังสร้างไฟล์สถานที่วิ่งงาน...","info");const wbPlaces=_buildPlacesWorkbook(doneRows);await new Promise(r=>setTimeout(r,30));await loadJSZip();const _ab1=XLSX.write(wb,{bookType:"xlsx",type:"array"});const _ab2=XLSX.write(wbPlaces,{bookType:"xlsx",type:"array"});const _zip=new JSZip;_zip.file(_xfname,_ab1);_zip.file("สถานที่วิ่งงาน_รวมทุกคน.xlsx",_ab2);const _zblob=await _zip.generateAsync({type:"blob",compression:"DEFLATE"});if(_col)return{blob:_zblob,fname:_zfname,zip:_zip,count:doneRows.length};_dlBlob(_zblob,_zfname);toast(`Export ${doneRows.length} งาน (ZIP 2 ไฟล์)`,"success")}catch(_zerr){if(_col)throw _zerr;console.warn("[export] zip failed → fallback single xlsx",_zerr);let _dlOk=false;try{const _wbout=XLSX.write(wb,{bookType:"xlsx",type:"array"});_dlBlob(new Blob([_wbout],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),_xfname);_dlOk=true}catch(_){}if(!_dlOk)XLSX.writeFile(wb,_xfname);toast(`Export ${doneRows.length} งานเสร็จแล้ว (ZIP ไม่สำเร็จ — ได้ไฟล์งานเดี่ยว)`,"info")}}catch(e){if(_col)throw e;toast("Export ผิดพลาด: "+e.message,"error")}}
function _docHM2(_at){if(!_at)return"";var _dt=new Date(_at);if(isNaN(_dt))return"";var _p2=function(x){return String(x).padStart(2,"0")};return _p2(_dt.getHours())+":"+_p2(_dt.getMinutes());}function _docCleanStat(note,at){var _full=("⏰ "+_docHM2(at)+" "+String(note)).replace(/\s+/g," ").trim();return _full.replace(/\s*·?\s*รูป\s*[:：]?.*$/,"").replace(/[·\s]+$/,"").trim();}function _docCustStat(d){try{var _w=(DOC._workStatus||{})[d.id];var _n=_w?(typeof _w==="object"?_w.note:_w):null;if(!(_n&&String(_n).trim()))return"-";var _at=_w&&typeof _w==="object"?_w.at:null;return _docCleanStat(_n,_at)||"-";}catch(_){return"-";}}function _docShipStat(d){try{var _s=(DOC._sysStatus||{})[d.id];var _n0=_s&&_s.note;var _n=(_n0&&String(_n0).indexOf("กลับเข้าคิวเอกสารใหม่")>=0)?"🆕 กลับเข้าคิวเอกสารใหม่":_n0;if(!(_n&&String(_n).trim()))return"-";return _docCleanStat(_n,_s.at)||"-";}catch(_){return"-";}}/* local374: DOCUMENT → ดำเนินตรวจปล่อย · Export Excel = ข้อมูลชุดเดียวกับหน้าจอ (ตัวกรองท่า / Leadtime เกิน / ค้นหา · ครบทุกหน้า · ลำดับเดียวกัน) + รายงานตกแต่ง */
var XR374_LOGO="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";
function _xr374Rows(){var ps=DOC.pageSize,pg=DOC.page;try{DOC.pageSize=1e9;DOC.page=1;var r=_docComputeRows();return{list:(r.rows||[]).slice(),total:r.total,q:r.q}}finally{DOC.pageSize=ps;DOC.page=pg}}
function _xr374P2(x){return String(x).padStart(2,"0")}
function _xr374DT(at){if(!at)return"";var d=new Date(at);if(isNaN(d))return"";return _xr374P2(d.getDate())+"/"+_xr374P2(d.getMonth()+1)+"/"+d.getFullYear()+" "+_xr374P2(d.getHours())+":"+_xr374P2(d.getMinutes())}
function _xr374Stat(w,sys){try{if(!w)return"";var n=typeof w==="object"?w.note:w;var at=typeof w==="object"?w.at:null;if(!(n&&String(n).trim()))return"";if(sys&&String(n).indexOf("กลับเข้าคิวเอกสารใหม่")>=0)n="🆕 กลับเข้าคิวเอกสารใหม่";var t=String(n).replace(/\s+/g," ").replace(/\s*·?\s*รูป\s*[:：]?.*$/,"").replace(/[·\s]+$/,"").trim();if(!t)return"";var dt=_xr374DT(at);return dt?dt+" · "+t:t}catch(_){return""}}
function _xr374Len(v){return String(v==null?"":v).replace(/[ัิ-ฺ็-๎]/g,"").length}
function _xr374Esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
async function _xr374Patch(buf,o){/* โลโก้ + Freeze Panes + พิมพ์ A4 แนวนอนพอดีความกว้าง (แก้ไฟล์ xlsx ที่สร้างแล้ว ด้วย fflate ในไฟล์ของแอปเอง) */
 if(!(window.fflate&&window.fflate.unzipSync))await loadScript("assets/pdf.bundle.js?v=3.9.3");
 var fz=window.fflate;if(!fz||!fz.unzipSync)throw new Error("fflate ไม่พร้อม");
 var f=fz.unzipSync(new Uint8Array(buf));var sk="xl/worksheets/sheet1.xml";if(!f[sk])throw new Error("ไม่พบ sheet1.xml");
 var x=fz.strFromU8(f[sk]);
 var pane='<sheetView workbookViewId="0" zoomScale="100"><pane ySplit="'+o.hdr+'" topLeftCell="A'+(o.hdr+1)+'" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A'+(o.hdr+1)+'" sqref="A'+(o.hdr+1)+'"/></sheetView>';
 if(/<sheetViews>[\s\S]*?<\/sheetViews>/.test(x))x=x.replace(/<sheetViews>[\s\S]*?<\/sheetViews>/,"<sheetViews>"+pane+"</sheetViews>");else if(/<sheetViews\/>/.test(x))x=x.replace(/<sheetViews\/>/,"<sheetViews>"+pane+"</sheetViews>");else x=x.replace(/(<sheetFormatPr|<cols>|<sheetData)/,"<sheetViews>"+pane+"</sheetViews>$1");
 if(/<sheetPr[^>]*\/>/.test(x))x=x.replace(/<sheetPr([^>]*)\/>/,'<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>');else if(/<sheetPr[^>]*>/.test(x))x=x.replace(/(<sheetPr[^>]*>)/,'$1<pageSetUpPr fitToPage="1"/>');else x=x.replace(/(<worksheet[^>]*>)/,'$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
 x=x.replace(/<pageSetup[^>]*\/>/g,"").replace(/<printOptions[^>]*\/>/g,"");
 var tail='<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/><drawing r:id="rIdXr374"/>';
 if(/<pageMargins[^>]*\/>/.test(x))x=x.replace(/(<pageMargins[^>]*\/>)/,'<printOptions horizontalCentered="1"/>$1'+tail);else x=x.replace(/<\/worksheet>/,'<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>'+tail+"</worksheet>");
 if(!/xmlns:r=/.test(x))x=x.replace(/<worksheet /,'<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
 f[sk]=fz.strToU8(x);
 var rk="xl/worksheets/_rels/sheet1.xml.rels";var rel='<Relationship Id="rIdXr374" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>';
 if(f[rk]){f[rk]=fz.strToU8(fz.strFromU8(f[rk]).replace(/<\/Relationships>/,rel+"</Relationships>"))}else f[rk]=fz.strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel+"</Relationships>");
 var E=9525,W=o.logoW,H=o.logoH;
 f["xl/drawings/drawing1.xml"]=fz.strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>'+(8*E)+'</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>'+(10*E)+'</xdr:rowOff></xdr:from><xdr:ext cx="'+(W*E)+'" cy="'+(H*E)+'"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="NJ Logo" descr="N.J. LOGISTICS &amp; FRUITS CO., LTD."/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImg1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+(W*E)+'" cy="'+(H*E)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>');
 f["xl/drawings/_rels/drawing1.xml.rels"]=fz.strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/></Relationships>');
 var bin=atob(XR374_LOGO),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);f["xl/media/image1.png"]=u;
 var ct=fz.strFromU8(f["[Content_Types].xml"]);if(!/Extension="png"/i.test(ct))ct=ct.replace(/(<Types[^>]*>)/,'$1<Default Extension="png" ContentType="image/png"/>');
 if(ct.indexOf("/xl/drawings/drawing1.xml")<0)ct=ct.replace(/<\/Types>/,'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
 f["[Content_Types].xml"]=fz.strToU8(ct);
 return fz.zipSync(f,{level:6})}
async function _docExportReceived374(){
 var R=_xr374Rows(),list=R.list;
 if(!list.length){toast("ไม่มีข้อมูลให้ Export","error");return}
 var q=String(DOC.filters.search||"").trim(),srch=q.length>=2;
 var term=!srch&&DOC.filters.terminal?String(DOC.filters.terminal):"";
 var lto=!srch&&!!DOC.filters.leadtimeOver;
 var now=new Date();var ymd=now.getFullYear()+"-"+_xr374P2(now.getMonth()+1)+"-"+_xr374P2(now.getDate());
 var HEAD=["JOB NO","ความเร่งด่วน","บริษัท","วัน/เวลารับชิปปิ้ง","รายละเอียด","ท่านำเข้า","ชื่อ SHIPPING","จำนวน","สถานะลูกค้า","สถานะชิปปิ้ง"];
 var NC=HEAD.length,HR=6;/* แถวหัวตาราง (1-based) */
 var qsum=0;
 var body=list.map(function(d){var urg=d.priority==="urgent";var qs=String(_docQty372(d)||"").trim();var qn=/^\d+(\.\d+)?$/.test(qs)?Number(qs):null;if(qn!=null)qsum+=qn;
  return{urg:urg,v:[d.source_job_no||d.doc_no||"",urg?"ด่วน":"ไม่ด่วน",d.company||"",d.received_at?_xr374DT(d.received_at):"",d.description||"",d.import_terminal||"",_docShipName372(d)||"—",qn!=null?qn:(qs||"—"),_xr374Stat((DOC._workStatus||{})[d.id],false)||"—",_xr374Stat((DOC._sysStatus||{})[d.id],true)||"—"]}});
 var termTxt=term||"ทั้งหมด";var flt=[];if(lto)flt.push("Leadtime เกิน 2 ชม.");if(q)flt.push('ค้นหา "'+q+'"');
 var aoa=[["","","N.J. LOGISTICS & FRUITS CO., LTD."],["","","รายงานดำเนินตรวจปล่อย"],["","","ท่านำเข้า: "+termTxt+(flt.length?"  ·  "+flt.join("  ·  "):""),"","","","","วันที่ Export: "+_xr374DT(now)+" น."],["","","จำนวน JOB",list.length,"","","รวมจำนวน",qsum],[],HEAD];
 body.forEach(function(b){aoa.push(b.v)});
 var ws=XLSX.utils.aoa_to_sheet(aoa);
 var last=HR+body.length;var cQ=XLSX.utils.encode_col(7);
 ws["H4"]={t:"n",v:qsum,f:"SUM("+cQ+(HR+1)+":"+cQ+last+")"};
 ws["D4"]={t:"n",v:list.length,f:"COUNTA(A"+(HR+1)+":A"+last+")"};
 ws["!merges"]=[{s:{r:0,c:2},e:{r:0,c:NC-1}},{s:{r:1,c:2},e:{r:1,c:NC-1}},{s:{r:2,c:2},e:{r:2,c:6}},{s:{r:2,c:7},e:{r:2,c:NC-1}}];
 /* ความกว้างอัตโนมัติตามข้อความจริง (มีเพดาน + Wrap Text สำหรับข้อความยาว) */
 var MIN=[16,11,18,17,16,12,14,8,26,26],MAX=[18,11,42,17,40,22,22,9,46,40];
 var cw=MIN.map(function(m,c){var w=_xr374Len(HEAD[c])+2;body.forEach(function(b){w=Math.max(w,_xr374Len(b.v[c])+2)});return Math.max(m,Math.min(MAX[c],w))});
 ws["!cols"]=cw.map(function(w){return{wch:w}});
 var FN="Tahoma",bd={top:{style:"thin",color:{rgb:"CBD5E1"}},bottom:{style:"thin",color:{rgb:"CBD5E1"}},left:{style:"thin",color:{rgb:"CBD5E1"}},right:{style:"thin",color:{rgb:"CBD5E1"}}};
 var S1=function(ref,s){if(!ws[ref])ws[ref]={t:"s",v:""};ws[ref].s=s};
 S1("C1",{font:{name:FN,sz:16,bold:true,color:{rgb:"1E3A8A"}},alignment:{vertical:"center"}});
 S1("C2",{font:{name:FN,sz:13,bold:true,color:{rgb:"0F172A"}},alignment:{vertical:"center"}});
 S1("C3",{font:{name:FN,sz:10,bold:true,color:{rgb:"1E3A8A"}},alignment:{vertical:"center"}});
 S1("H3",{font:{name:FN,sz:10,color:{rgb:"334155"}},alignment:{horizontal:"right",vertical:"center"}});
 var lab={font:{name:FN,sz:10,bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1E3A8A"}},alignment:{horizontal:"center",vertical:"center"},border:bd};
 var val=function(bg,fg){return{font:{name:FN,sz:12,bold:true,color:{rgb:fg}},fill:{fgColor:{rgb:bg}},alignment:{horizontal:"center",vertical:"center"},border:bd}};
 S1("C4",lab);S1("D4",val("DBEAFE","1E3A8A"));S1("G4",Object.assign({},lab,{fill:{fgColor:{rgb:"047857"}}}));S1("H4",val("D1FAE5","047857"));ws["D4"].z="#,##0";ws["H4"].z="#,##0.##";
 for(var c=0;c<NC;c++){var hr=XLSX.utils.encode_cell({r:HR-1,c:c});ws[hr].s={font:{name:FN,sz:10,bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1E3A8A"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:{top:{style:"thin",color:{rgb:"1E3A8A"}},bottom:{style:"thin",color:{rgb:"1E3A8A"}},left:{style:"thin",color:{rgb:"3B5BB5"}},right:{style:"thin",color:{rgb:"3B5BB5"}}}}}
 var rowsH=[{hpt:30},{hpt:22},{hpt:18},{hpt:22},{hpt:6},{hpt:24}];
 body.forEach(function(b,i){var r=HR+i,bg=i%2?"EEF2FF":"FFFFFF";var lines=1;
  for(var c=0;c<NC;c++){var ref=XLSX.utils.encode_cell({r:r,c:c});if(!ws[ref])ws[ref]={t:"s",v:""};var v=b.v[c],dash=v==="—";
   var s={font:{name:FN,sz:10,color:{rgb:"0F172A"}},fill:{fgColor:{rgb:bg}},border:bd,alignment:{vertical:"center",wrapText:true,horizontal:"left"}};
   if(c===0){s.font.bold=true;s.alignment.wrapText=false}
   if(c===1){s.font={name:FN,sz:10,bold:true,color:{rgb:b.urg?"DC2626":"EA580C"}};s.alignment.horizontal="center"}
   if(c===3||c===5||c===7)s.alignment.horizontal="center";
   if(c===8&&!dash)s.font.color={rgb:"047857"};
   if(c===9&&!dash)s.font.color={rgb:"C2410C"};
   if(dash){s.font.color={rgb:"94A3B8"};s.alignment.horizontal="center"}
   ws[ref].s=s;if(c===7&&typeof v==="number")ws[ref].z="#,##0.##";
   lines=Math.max(lines,Math.ceil(_xr374Len(v)/Math.max(1,cw[c]-1))||1)}
  rowsH.push({hpt:Math.max(20,Math.min(lines,6)*14+6)})});
 ws["!rows"]=rowsH;
 ws["!autofilter"]={ref:"A"+HR+":"+XLSX.utils.encode_col(NC-1)+last};
 ws["!margins"]={left:0.3,right:0.3,top:0.4,bottom:0.4,header:0.2,footer:0.2};
 var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"ดำเนินตรวจปล่อย");
 wb.Workbook={Names:[{Name:"_xlnm.Print_Titles",Sheet:0,Ref:"'ดำเนินตรวจปล่อย'!$"+HR+":$"+HR}]};
 var safe=function(s){return String(s).replace(/[\\/:*?"<>|]+/g,"").replace(/\s*,\s*/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")};
 var parts=[srch?"ค้นหา-"+safe(q).slice(0,30):(term?safe(term):"ทั้งหมด")];if(lto)parts.push("Leadtime-เกิน");if(!srch&&q)parts.push("ค้นหา-"+safe(q).slice(0,30));
 var fname="ดำเนินตรวจปล่อย_"+parts.join("_")+"_"+ymd+".xlsx";
 var out=XLSX.write(wb,{bookType:"xlsx",type:"array"});
 try{out=await _xr374Patch(out,{hdr:HR,logoW:150,logoH:45})}catch(pe){console.warn("[doc export 374] ใส่โลโก้/Freeze/ตั้งค่าพิมพ์ไม่สำเร็จ — ส่งออกไฟล์ข้อมูลครบโดยไม่มีส่วนตกแต่งนี้",pe)}
 var blob=new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=fname;a.rel="noopener";a.style.display="none";document.body.appendChild(a);a.click();setTimeout(function(){try{a.remove();URL.revokeObjectURL(url)}catch(_){}},2e3);
 toast("Export Excel สำเร็จ · "+list.length+" JOB","success")}
async function docExportExcel(){if(_IW<=768)return;try{await loadXlsxStyle();try{if(typeof loadDocWorkStatus==="function"&&typeof loadDocSysStatus==="function")await Promise.all([loadDocWorkStatus(),loadDocSysStatus()]);}catch(_){}const status=DOC.view||"all";if(status==="RECEIVED")return await _docExportReceived374()/* local374 */;let list=_docVisibleList();if(status!=="all"){if(status==="EDIT")list=list.filter(d=>d.category===EDIT_CATEGORY&&d.doc_status==="COMPLETED");else if(status==="FZ")list=list.filter(d=>_isFZTerminal(d.import_terminal)&&(d.doc_status==="NEW"||d.doc_status==="RECEIVED"||d.doc_status==="POSTPONED"));else if(status==="TONREN")list=list.filter(d=>d.category===TONREN_TYPE&&(d.doc_status==="NEW"||d.doc_status==="RECEIVED"||d.doc_status==="POSTPONED"));else if(status==="RECEIVED")list=list.filter(d=>d.doc_status==="RECEIVED"||d.doc_status==="NEW");else list=list.filter(d=>d.doc_status===status)}else if(DOC.filters.status&&DOC.filters.status!=="ALL"){list=list.filter(d=>d.doc_status===DOC.filters.status)}const q=(DOC.filters.search||"").trim().toLowerCase();if(q){list=list.filter(d=>[d.source_job_no,d.doc_no,d.company,d.location,d.import_terminal,d.category,d.description,d.creator_name,d.sender_name,d.assigned_name,d.assigned_user].some(x=>String(x||"").toLowerCase().includes(q)))}if(status!=="all"&&DOC.filters.terminal){const _ft=_normLoc(DOC.filters.terminal);list=list.filter(d=>_normLoc(d.import_terminal)===_ft||_splitTerminals(d.import_terminal).map(_normLoc).includes(_ft))}if(DOC.filters.docCat){list=list.filter(d=>d.category===DOC.filters.docCat)}list.sort((a,b)=>{const pa=a.priority==="urgent"?0:1,pb=b.priority==="urgent"?0:1;if(pa!==pb)return pa-pb;return new Date(b.mass_closed_at||b.created_at||0)-new Date(a.mass_closed_at||a.created_at||0)});if(!list.length){toast("ไม่มีข้อมูลให้ Export","error");return}const menuLabel=status==="all"?"เอกสารทั้งหมด":status==="EDIT"?"งานแก้ไข":DOC_STATUS_META[status]&&DOC_STATUS_META[status].label||status;const fileSuffix=status!=="all"&&DOC.filters.terminal?"_"+DOC.filters.terminal:"";const _r372=status==="RECEIVED"&&typeof _docShipName372==="function";/* local372 */const headers=_r372?["ลำดับ","JOB NO","ความเร่งด่วน","บริษัท","ประเภทงาน","วันที่/เวลารับงานชิปปิ้ง","รายละเอียด","ท่านำเข้า","ชื่อ SHIPPING","จำนวน","USER (ผู้เปิดงาน)","👤 สถานะลูกค้า","🚢 สถานะชิปปิ้ง","สถานะเอกสาร","เวลาส่งจากแมส"]:["ลำดับ","JOB NO","ความเร่งด่วน","บริษัท","ประเภทงาน","วันที่/เวลารับงานชิปปิ้ง","รายละเอียด","ท่านำเข้า","USER (ผู้เปิดงาน)","ชิปปิ้ง (ผู้รับผิดชอบ)","👤 สถานะลูกค้า","🚢 สถานะชิปปิ้ง","สถานะเอกสาร","เวลาส่งจากแมส"];const body=list.map((d,i)=>_r372?[i+1,d.source_job_no||d.doc_no||"",d.priority==="urgent"?"🔴 ด่วน":"🟢 ไม่ด่วน",d.company||"",d.category||"",d.received_at?fmtDateTime(d.received_at):"",d.description||"",d.import_terminal||"",_docShipName372(d)||"—",_docQty372(d)||"—",d.creator_name||"",_docCustStat(d),_docShipStat(d),DOC_STATUS_META[d.doc_status]&&DOC_STATUS_META[d.doc_status].label||d.doc_status||"",d.mass_closed_at?fmtDateTime(d.mass_closed_at):""]:[i+1,d.source_job_no||d.doc_no||"",d.priority==="urgent"?"🔴 ด่วน":"🟢 ไม่ด่วน",d.company||"",d.category||"",d.received_at?fmtDateTime(d.received_at):"",d.description||"",d.import_terminal||"",d.creator_name||"",d.assigned_name||"",_docCustStat(d),_docShipStat(d),DOC_STATUS_META[d.doc_status]&&DOC_STATUS_META[d.doc_status].label||d.doc_status||"",d.mass_closed_at?fmtDateTime(d.mass_closed_at):""]);const ws=XLSX.utils.aoa_to_sheet([headers,...body]);const range=XLSX.utils.decode_range(ws["!ref"]);for(let c=range.s.c;c<=range.e.c;c++){const ref=XLSX.utils.encode_cell({r:0,c});if(ws[ref])ws[ref].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F2937"}},alignment:{horizontal:"center",vertical:"center"},border:{bottom:{style:"thin",color:{rgb:"374151"}}}}}for(let r=1;r<=range.e.r;r++){for(let c=range.s.c;c<=range.e.c;c++){const ref=XLSX.utils.encode_cell({r,c});if(ws[ref])ws[ref].s={alignment:{vertical:"center",wrapText:c===6,horizontal:c===0||c===2?"center":"left"}}}}ws["!cols"]=_r372?[{wch:6},{wch:18},{wch:11},{wch:22},{wch:20},{wch:20},{wch:30},{wch:18},{wch:18},{wch:10},{wch:16},{wch:30},{wch:30},{wch:16},{wch:18}]:[{wch:6},{wch:18},{wch:11},{wch:22},{wch:20},{wch:20},{wch:30},{wch:18},{wch:16},{wch:18},{wch:15},{wch:20}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,String(menuLabel).substring(0,28));const _dfname=`DOCUMENT_${menuLabel}${fileSuffix}.xlsx`;let _dlOk2=false;try{const _wbout=XLSX.write(wb,{bookType:"xlsx",type:"array"});const _blob=new Blob([_wbout],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const _url=URL.createObjectURL(_blob);const _a=document.createElement("a");_a.href=_url;_a.download=_dfname;_a.rel="noopener";_a.style.display="none";document.body.appendChild(_a);_a.click();setTimeout(()=>{try{_a.remove();URL.revokeObjectURL(_url)}catch(_){}},2e3);_dlOk2=true}catch(_dlErr){console.warn("[doc export] blob download failed → fallback writeFile",_dlErr)}if(!_dlOk2)XLSX.writeFile(wb,_dfname);toast("Export Excel สำเร็จ","success")}catch(e){toast("Export ผิดพลาด: "+(e.message||e),"error")}}
function _expToday(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function openExportChooser(force){
  if(!force){return exportExcel();}
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
    var res=await sb.from("jobs").select("*").eq("app_code",APP_CODE).eq("category",OT_CATEGORY).eq("status","DONE").gte("closed_at",fISO).lt("closed_at",tISO).order("closed_at",{ascending:true}).range(page*PAGE,page*PAGE+PAGE-1);
    if(res&&res.error){console.error("[OT EXPORT ERROR]",res.error);throw new Error("query failed");}
    var data=(res&&res.data)||[];
    for(var i=0;i<data.length;i++){var j=data[i];if(j&&j.id!=null&&!seen[j.id]){seen[j.id]=1;out.push(j);}}
    if(data.length<PAGE)break;
    page++;
  }
  return out;
}
async function _expFetchOTCA(from,to){
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
function _expBuildRowsCA(jobs){
  var out=[];
  for(var x=0;x<jobs.length;x++){
    var j=jobs[x];var items=_otParseRows(j);if(!items.length)continue;
    for(var y=0;y<items.length;y++){
      var it=items[y];var term=String(it.term||"").trim()||"CS";var name=String(j.created_by_name||"").trim()||"-";
      out.push({jobNo:String(j.job_no||""),createdAt:(typeof fmtDateTime==="function"?fmtDateTime(j.created_at):String(j.created_at||"")),
        creator:name,assignee:String(j.assigned_to_name||"").trim()||"-",jobNj:String(it.nj||""),
        company:String(it.company||""),branch:String(it.branch||""),qty:(parseFloat(String(it.qty).replace(/,/g,""))||0),amount:(parseFloat(String(it.amount).replace(/,/g,""))||0),
        term:term,name:name,_ca:String(j.created_at||""),_i:out.length,decl:String(j.job_nj||"").replace(/\s*[\r\n]+\s*/g," ").trim()});
    }
  }
  return out;
}
function _expBookOrig(rows,sheetName,headerE,groupBy){
  var HEAD=["ITEM","เลขที่ใบงาน","วันที่สร้าง","ผู้สร้าง",headerE,"JOB NJ","บริษัท","สาขา","จำนวน(ใบ)","จำนวนเงิน","ท่านำเข้า","เลขที่ใบขน"];/* local326: +คอลัมน์ L เลขที่ใบขน ต่อท้าย (คอลัมน์/สูตรเดิมไม่ขยับ) */
  var BORD={top:{style:"thin",color:{rgb:"888888"}},bottom:{style:"thin",color:{rgb:"888888"}},left:{style:"thin",color:{rgb:"888888"}},right:{style:"thin",color:{rgb:"888888"}}};
  var HS={font:{bold:true,sz:11,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F4E78"}},border:BORD,alignment:{horizontal:"center",vertical:"center"}};
  function al(c){return (c===0||c===8||c===9)?"right":"left";}
  function ds(c){return {font:{sz:11},border:BORD,alignment:{horizontal:al(c),vertical:"center"}};}
  var ws={};function put(r,c,cell){ws[XLSX.utils.encode_cell({r:r,c:c})]=cell;}
  var W=HEAD.map(function(h){return String(h).length;});
  function tw(c,t){var L=String(t==null?"":t).length;if(L>W[c])W[c]=L;}
  for(var c=0;c<12;c++)put(0,c,{v:HEAD[c],t:"s",s:HS});
  var R=1,item=0,firstDataR=1,lastDataR=1,subRows=[];
  function dataRow(row){
    item++;
    var v=[item,String(row.jobNo||""),String(row.createdAt||""),String(row.creator||""),String(row.assignee||""),String(row.jobNj||""),String(row.company||""),String(row.branch||""),row.qty,row.amount,String(row.term||""),String(row.decl||"")];
    for(var c=0;c<12;c++){var cell;
      if(c===0)cell={v:item,t:"n",s:ds(0)};
      else if(c===8)cell={v:row.qty,t:"n",z:"#,##0",s:ds(8)};
      else if(c===9)cell={v:row.amount,t:"n",z:"#,##0.00",s:ds(9)};
      else cell={v:String(v[c]).toUpperCase(),t:"s",s:ds(c)};
      put(R,c,cell);tw(c,v[c]);}
    lastDataR=R;R++;
  }
  function fsum(col,sR,eR){return sR===eR?("SUM("+col+(sR+1)+")"):("SUM("+col+(sR+1)+":"+col+(eR+1)+")");}
  function sumRow(sR,eR,sq,sa,bold,mode){
    var es=mode==="full"?BORD:(mode==="bottom"?{bottom:{style:"thin",color:{rgb:"888888"}}}:null);
    if(mode==="full"){for(var c=0;c<12;c++){if(c!==8&&c!==9)put(R,c,{s:{border:BORD}});}}
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
  function blankRow(){for(var c=0;c<12;c++)put(R,c,{s:{border:BORD}});R++;}
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
  ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R-1,c:11}});
  ws["!cols"]=W.map(function(w){return {wch:Math.min(Math.max(w+2,5),40)};});
  var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheetName);return wb;
}
async function _runExport(mode,from,to){
  var base;
  try{base=await (mode==="zip"?_expFetchOT(from,to):_expFetchOTCA(from,to));}catch(e){console.error("[OT EXPORT ERROR]",e);try{toast("ไม่สามารถ Export ข้อมูลได้ กรุณาลองใหม่","error")}catch(_){}return;}
  var rows=(mode==="zip"?_expBuildRows(base):_expBuildRowsCA(base));
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
      out.push({jobNo:String(j.job_no||""),createdAt:(typeof fmtDateTime==="function"?fmtDateTime(j.closed_at):String(j.closed_at||"")),
        creator:name,assignee:String(j.assigned_to_name||"").trim()||"-",jobNj:String(it.nj||""),
        company:String(it.company||""),branch:String(it.branch||""),qty:(parseFloat(String(it.qty).replace(/,/g,""))||0),amount:(parseFloat(String(it.amount).replace(/,/g,""))||0),
        term:term,name:name,_ca:String(j.closed_at||""),_i:out.length});
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
  var HEAD=["ITEM","เลขที่ใบงาน","วันที่ปิดงาน","ผู้สร้าง",headerE,"JOB NJ","บริษัท","สาขา","จำนวน(ใบ)","จำนวนเงิน","ท่านำเข้า"];
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
function _expBook1(wb,rows,sheetName){var HEAD=["ITEM","เลขที่ใบงาน","วันที่ปิดงาน","ผู้สร้าง","บริษัท","สาขา","จำนวน(ใบ)","จำนวนเงิน","ท่านำเข้า"];var BORD={top:{style:"thin",color:{rgb:"888888"}},bottom:{style:"thin",color:{rgb:"888888"}},left:{style:"thin",color:{rgb:"888888"}},right:{style:"thin",color:{rgb:"888888"}}};var HS={font:{bold:true,sz:11,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F4E78"}},border:BORD,alignment:{horizontal:"center",vertical:"center"}};function al(c){return (c===0||c===6||c===7)?"right":"left";}function ds(c){return {font:{sz:11},border:BORD,alignment:{horizontal:al(c),vertical:"center"}};}var ws={};function put(r,c,cell){ws[XLSX.utils.encode_cell({r:r,c:c})]=cell;}var W=HEAD.map(function(h){return String(h).length;});function tw(c,t){var L=String(t==null?"":t).length;if(L>W[c])W[c]=L;}for(var c=0;c<9;c++)put(0,c,{v:HEAD[c],t:"s",s:HS});var R=1,item=0,firstDataR=1,lastDataR=1,_seen=new Set();function dataRow(row){var _jn=String(row.jobNo||"").trim();var _dup=(_jn&&_seen.has(_jn));var _iv;if(_jn&&!_dup){_seen.add(_jn);item++;_iv=item;}else{_iv="";}var v=[_iv,String(row.jobNo||""),String(row.createdAt||""),String(row.creator||""),String(row.company||""),String(row.branch||""),row.qty,row.amount,String(row.term||"")];for(var c=0;c<9;c++){var cell;if(c===0)cell=(_iv===""?{v:"",t:"s",s:ds(0)}:{v:_iv,t:"n",s:ds(0)});else if(c===6)cell={v:row.qty,t:"n",z:"#,##0",s:ds(6)};else if(c===7)cell={v:row.amount,t:"n",z:"#,##0.00",s:ds(7)};else cell={v:String(v[c]).toUpperCase(),t:"s",s:ds(c)};put(R,c,cell);tw(c,v[c]);}lastDataR=R;R++;}function fsum(col,sR,eR){return sR===eR?("SUM("+col+(sR+1)+")"):("SUM("+col+(sR+1)+":"+col+(eR+1)+")");}function sumRow(sR,eR,sq,sa,bold){var es={bottom:{style:"thin",color:{rgb:"888888"}}};var st6={font:{sz:11,bold:!!bold},alignment:{horizontal:"right",vertical:"center"},border:es};var st7={font:{sz:11,bold:!!bold},alignment:{horizontal:"right",vertical:"center"},border:es};put(R,6,{t:"n",f:fsum("G",sR,eR),v:sq,z:"#,##0",s:st6});put(R,7,{t:"n",f:fsum("H",sR,eR),v:sa,z:"#,##0.00",s:st7});R++;}var TQ=0,TA=0;for(var k=0;k<rows.length;k++){TQ+=(rows[k].qty||0);TA+=(rows[k].amount||0);dataRow(rows[k]);}if(item>0)sumRow(firstDataR,lastDataR,TQ,TA,true);ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R-1,c:8}});ws["!cols"]=W.map(function(w){return {wch:Math.min(Math.max(w+2,5),40)};});ws["!views"]=[{state:"frozen",ySplit:1,topLeftCell:"A2"}];XLSX.utils.book_append_sheet(wb,ws,sheetName);}function _expBook2(wb,rows,termValue,sheetName){var HEAD=["ITEM","เลขที่ใบงาน","วันที่ปิดงาน","ผู้สร้าง","บริษัท","สาขา","จำนวน(ใบ)","จำนวนเงิน"];var BORD={top:{style:"thin",color:{rgb:"888888"}},bottom:{style:"thin",color:{rgb:"888888"}},left:{style:"thin",color:{rgb:"888888"}},right:{style:"thin",color:{rgb:"888888"}}};var HS={font:{bold:true,sz:11,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F4E78"}},border:BORD,alignment:{horizontal:"center",vertical:"center"}};function al(c){return (c===0||c===6||c===7)?"right":"left";}function ds(c){return {font:{sz:11},border:BORD,alignment:{horizontal:al(c),vertical:"center"}};}var ws={};function put(r,c,cell){ws[XLSX.utils.encode_cell({r:r,c:c})]=cell;}var W=HEAD.map(function(h){return String(h).length;});function tw(c,t){var L=String(t==null?"":t).length;if(L>W[c])W[c]=L;}put(0,1,{v:"ท่านำเข้า",t:"s",s:HS});put(1,1,{v:String(termValue||""),t:"s",s:{font:{sz:11},border:BORD,alignment:{horizontal:"left",vertical:"center"}}});tw(1,"ท่านำเข้า");tw(1,String(termValue||""));var HR=3;for(var c=0;c<8;c++)put(HR,c,{v:HEAD[c],t:"s",s:HS});var R=HR+1,item=0,firstDataR=R,lastDataR=R,_seen=new Set();function dataRow(row){var _jn=String(row.jobNo||"").trim();var _dup=(_jn&&_seen.has(_jn));var _iv;if(_jn&&!_dup){_seen.add(_jn);item++;_iv=item;}else{_iv="";}var v=[_iv,String(row.jobNo||""),String(row.createdAt||""),String(row.creator||""),String(row.company||""),String(row.branch||""),row.qty,row.amount];for(var c=0;c<8;c++){var cell;if(c===0)cell=(_iv===""?{v:"",t:"s",s:ds(0)}:{v:_iv,t:"n",s:ds(0)});else if(c===6)cell={v:row.qty,t:"n",z:"#,##0",s:ds(6)};else if(c===7)cell={v:row.amount,t:"n",z:"#,##0.00",s:ds(7)};else cell={v:String(v[c]).toUpperCase(),t:"s",s:ds(c)};put(R,c,cell);tw(c,v[c]);}lastDataR=R;R++;}function fsum(col,sR,eR){return sR===eR?("SUM("+col+(sR+1)+")"):("SUM("+col+(sR+1)+":"+col+(eR+1)+")");}var TQ=0,TA=0;for(var k=0;k<rows.length;k++){TQ+=(rows[k].qty||0);TA+=(rows[k].amount||0);dataRow(rows[k]);}if(item>0){var es={bottom:{style:"thin",color:{rgb:"888888"}}};put(R,6,{t:"n",f:fsum("G",firstDataR,lastDataR),v:TQ,z:"#,##0",s:{font:{sz:11,bold:true},alignment:{horizontal:"right",vertical:"center"},border:es}});put(R,7,{t:"n",f:fsum("H",firstDataR,lastDataR),v:TA,z:"#,##0.00",s:{font:{sz:11,bold:true},alignment:{horizontal:"right",vertical:"center"},border:es}});R++;}ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R-1,c:7}});ws["!cols"]=W.map(function(w){return {wch:Math.min(Math.max(w+2,5),40)};});ws["!views"]=[{state:"frozen",ySplit:HR+1,topLeftCell:"A"+(HR+2)}];XLSX.utils.book_append_sheet(wb,ws,sheetName);}function _expSheetName(t,used){var n=String(t).replace(/[\\/?*\[\]:]/g,"-").slice(0,31)||"SHEET";var base=n,i=2;while(used[n]){n=(base.slice(0,28)+"_"+i).slice(0,31);i++;}used[n]=1;return n;}async function _expExportSingle(rows,from,to){
  try{if(typeof loadXlsxStyle==="function")await loadXlsxStyle();}catch(e){try{toast("โหลดไลบรารีไม่สำเร็จ","error")}catch(_){}return;}
  if(typeof XLSX==="undefined"){try{toast("ไลบรารี Export ไม่พร้อม","error")}catch(_){}return;}
  var wb=_expBookOrig(_expSort(rows),"รวมทั้งหมด","ผู้รับงาน",null);
  var buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});
  _expDownload(buf,"ใบปิดบัญชีงานOT_"+_expNameSuffix(from,to)+".xlsx");
  try{toast("Export Excel สำเร็จ ("+rows.length+" รายการ)","success")}catch(_){}
}
async function _exportDoneZip(rows,from,to,_opt){
  var _col=!!(_opt&&_opt.collect);
  try{if(typeof loadXlsxStyle==="function")await loadXlsxStyle();if(typeof loadJSZip==="function")await loadJSZip();}catch(e){if(_col)throw new Error("โหลดไลบรารีไม่สำเร็จ");try{toast("โหลดไลบรารีไม่สำเร็จ","error")}catch(_){}return;}
  if(typeof XLSX==="undefined"||typeof JSZip==="undefined"){if(_col)throw new Error("ไลบรารี Export ไม่พร้อม");try{toast("ไลบรารี Export ไม่พร้อม","error")}catch(_){}return;}
  var csRows=[],tmRows=[];for(var i=0;i<rows.length;i++){(rows[i].term==="CS"?csRows:tmRows).push(rows[i]);}
  var wbCS=_expBook(_expSort(csRows),"เฉพาะ CS","ผู้รับงาน","name");
  var wbTM=_expBook(_expSort(tmRows),"รวมท่านำเข้า","🏃 ผู้รับงาน","term");
  var wbAll=_expBook(_expSort(rows),"รวมทั้งหมด","ผู้รับงาน",null);
  var zip=new JSZip();
  zip.file("ใบปิดบัญชีเฉพาะ CS.xlsx",XLSX.write(wbCS,{bookType:"xlsx",type:"array"}));
  zip.file("ใบปิดบัญชีรวมท่านำเข้า.xlsx",XLSX.write(wbTM,{bookType:"xlsx",type:"array"}));
  zip.file("ใบปิดบัญชีรวม CS และท่านำเข้า.xlsx",XLSX.write(wbAll,{bookType:"xlsx",type:"array"}));
  var _sorted=_expSort(rows);var _wbMS=XLSX.utils.book_new();_expBook1(_wbMS,_sorted.filter(function(_r){return String(_r.term||"").trim()!=="CS";}),"รวมทั้งหมด");var _ord=[],_grp={};for(var _k=0;_k<_sorted.length;_k++){var _t=String(_sorted[_k].term||"").trim();if(!_t)continue;if(!_grp[_t]){_grp[_t]=[];_ord.push(_t);}_grp[_t].push(_sorted[_k]);}var _used={"รวมทั้งหมด":1};for(var _oi=0;_oi<_ord.length;_oi++){var _tv=_ord[_oi];_expBook2(_wbMS,_grp[_tv],_tv,_expSheetName(_tv,_used));}zip.file("ใบปิดบัญชี แยกท่านำเข้า.xlsx",XLSX.write(_wbMS,{bookType:"xlsx",type:"array"}));
  var blob=await zip.generateAsync({type:"blob"});
  if(_col)return {blob:blob,fname:"ใบปิดบัญชีงานOT_"+_expNameSuffix(from,to)+".zip",zip:zip,count:rows.length};
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ใบปิดบัญชีงานOT_"+_expNameSuffix(from,to)+".zip";document.body.appendChild(a);a.click();
  setTimeout(function(){try{URL.revokeObjectURL(a.href)}catch(_){}a.remove();},1500);
  try{toast("Export ZIP สำเร็จ ("+rows.length+" รายการ)","success")}catch(_){}
}
/* ===== done-today: Export Excel 1 คลิก → 2 ZIP (reuse exportExcel + _exportDoneZip เดิม) ===== */
function _expZipNamesOk(z,names){try{var k=Object.keys(z.files).filter(function(n){return !z.files[n].dir;});if(k.length!==names.length)return false;for(var i=0;i<names.length;i++){if(k.indexOf(names[i])<0)return false;}return true;}catch(_){return false;}}
async function exportDoneTodayBoth(){
  if(typeof getRuntimeFeature==="function"&&!getRuntimeFeature("export")){try{toast("ฟีเจอร์ Export ถูกปิดใช้งาน","info")}catch(_){}return;}
  if(_IW<=768)return;
  var td=_expToday(),g,o,otRows;
  try{
    g=await exportExcel({collect:true});
    if(!g)throw new Error("ZIP งานทั่วไปสร้างไม่สำเร็จ");
    try{otRows=_expBuildRows(await _expFetchOT(td,td));}catch(e){console.error("[OT EXPORT ERROR]",e);throw new Error("ดึงข้อมูลงาน OT ไม่สำเร็จ");}
    o=otRows.length?await _exportDoneZip(otRows,td,td,{collect:true}):{empty:true};
    if(!o)throw new Error("ZIP ใบปิดบัญชี OT สร้างไม่สำเร็จ");
    if(!g.empty&&!_expZipNamesOk(g.zip,[g.fname.replace(/\.zip$/,".xlsx"),"สถานที่วิ่งงาน_รวมทุกคน.xlsx"]))throw new Error("ZIP งานทั่วไปไฟล์ไม่ครบ");
    if(!o.empty&&!_expZipNamesOk(o.zip,["ใบปิดบัญชีเฉพาะ CS.xlsx","ใบปิดบัญชีรวมท่านำเข้า.xlsx","ใบปิดบัญชีรวม CS และท่านำเข้า.xlsx","ใบปิดบัญชี แยกท่านำเข้า.xlsx"]))throw new Error("ZIP ใบปิดบัญชี OT ไฟล์ไม่ครบ");
  }catch(e){console.error("[EXPORT done-today]",e);try{toast("Export ผิดพลาด: "+(e&&e.message||e)+" — ยังไม่ได้ดาวน์โหลดไฟล์ใด","error")}catch(_){}return;}
  if(g.empty&&o.empty){try{toast("ไม่มีข้อมูลให้ Export","error")}catch(_){}return;}
  /* รวมไฟล์ Excel เดิมของทั้ง 2 ชุดเป็น ZIP เดียว (ไฟล์ข้างในไม่ถูกสร้างใหม่ · คัดลอก bytes เดิม) */
  var all,allName=td+".zip",names=[];
  try{
    all=new JSZip();
    var srcs=[];if(!g.empty)srcs.push(g.zip);if(!o.empty)srcs.push(o.zip);
    for(var si=0;si<srcs.length;si++){var fz=srcs[si];var ks=Object.keys(fz.files).filter(function(n){return !fz.files[n].dir;});for(var ki=0;ki<ks.length;ki++){if(all.files[ks[ki]])throw new Error("ชื่อไฟล์ซ้ำ: "+ks[ki]);all.file(ks[ki],await fz.file(ks[ki]).async("uint8array"));names.push(ks[ki]);}}
    var expect=(g.empty?0:2)+(o.empty?0:4);
    if(names.length!==expect||!_expZipNamesOk(all,names))throw new Error("ZIP รวมไฟล์ไม่ครบ");
    var allBlob=await all.generateAsync({type:"blob",compression:"DEFLATE"});
  }catch(e){console.error("[EXPORT done-today merge]",e);try{toast("Export ผิดพลาด: "+(e&&e.message||e)+" — ยังไม่ได้ดาวน์โหลดไฟล์ใด","error")}catch(_){}return;}
  _expDownload(allBlob,allName);
  try{
    if(g.empty)toast("ไม่มีงานเสร็จแล้วให้ Export — ได้เฉพาะใบปิดบัญชี OT ("+o.count+" รายการ)","error");
    else if(o.empty)toast("Export "+g.count+" งาน (ZIP เดียว "+names.length+" ไฟล์) · ไม่มีงาน OT ปิดในวันที่เลือก","info");
    else toast("Export สำเร็จ ZIP เดียว "+names.length+" ไฟล์ · งาน "+g.count+" · OT "+o.count+" รายการ","success");
  }catch(_){}
}
window.HeavyExport={openExportChooser:openExportChooser,exportExcel:exportExcel,docExportExcel:docExportExcel,exportBackup:exportBackup,exportDoneTodayBoth:exportDoneTodayBoth};
})();
