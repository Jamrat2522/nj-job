(function(){"use strict";var S=window.NJHR&&NJHR.compat&&NJHR.compat.scope;if(!S)throw new Error("RUNTIME_NOT_READY");var loadScriptOnce=S.loadScriptOnce;var sbRpcList=S.sbRpcList;function rptXmlEsc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function rptSafeName(v){return String(v).replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g,"-").slice(0,60)}function rptColLetter(i){var s="",n=Number(i)+1;while(n>0){var r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s||"A"}function rptSheetXml(head,rows,widths,titleLines){var top=(titleLines||[]).length;function cell(ref,val,styleId){if(typeof val==="number"&&isFinite(val))return'<c r="'+ref+'" s="'+styleId+'"><v>'+val+"</v></c>";return'<c r="'+ref+'" s="'+styleId+'" t="inlineStr"><is><t xml:space="preserve">'+rptXmlEsc(val)+"</t></is></c>"}var lastRef=rptColLetter(Math.max(head.length,1)-1)+(top+1+rows.length);var xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+'<dimension ref="A1:'+lastRef+'"/>'+"<cols>"+widths.map(function(w,i){return'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join("")+"</cols><sheetData>";(titleLines||[]).forEach(function(t,ti){xml+='<row r="'+(ti+1)+'">'+cell("A"+(ti+1),t,3)+"</row>"});var hr=top+1;xml+='<row r="'+hr+'">'+head.map(function(h,i){return cell(rptColLetter(i)+hr,h,1)}).join("")+"</row>";rows.forEach(function(r,ri){xml+='<row r="'+(ri+hr+1)+'">'+r.map(function(c,ci){return cell(rptColLetter(ci)+(ri+hr+1),c,2)}).join("")+"</row>"});var pane='<sheetViews><sheetView workbookViewId="0"><pane ySplit="'+hr+'" topLeftCell="A'+(hr+1)+'" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';return(xml+"</sheetData></worksheet>").replace("<cols>",pane+"<cols>")}/* [RUN-161] ย้าย styles.xml เดิมมาเป็นฟังก์ชัน เพื่อให้ตัวสร้าง 2 Sheet ใช้สไตล์ชุดเดียวกัน
   คืนค่าสตริงเดิมแบบตรงตัวอักษรทุกตัว ไม่เปลี่ยนรูปแบบไฟล์ของรายงานเดิมแม้แต่ไบต์เดียว */
function rptStylesXml(){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+'<fonts count="2">'+'<font><sz val="11"/><color rgb="FF000000"/><name val="Tahoma"/></font>'+'<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Tahoma"/></font></fonts>'+'<fills count="3">'+'<fill><patternFill patternType="none"/></fill>'+'<fill><patternFill patternType="gray125"/></fill>'+'<fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/><bgColor indexed="64"/></patternFill></fill></fills>'+'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'+'<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right>'+'<top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders>'+'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+'<cellXfs count="4">'+'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'+'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+"</cellXfs></styleSheet>"}
function rptBuildXlsx(sheetName,head,rows,widths,titleLines){var zip=new window.JSZip;zip.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+'<Default Extension="xml" ContentType="application/xml"/>'+'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+"</Types>");zip.folder("_rels").file(".rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+"</Relationships>");var xl=zip.folder("xl");xl.file("workbook.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+'<sheets><sheet name="'+rptXmlEsc(sheetName)+'" sheetId="1" r:id="rId1"/></sheets></workbook>');xl.folder("_rels").file("workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+"</Relationships>");xl.file("styles.xml",rptStylesXml());xl.folder("worksheets").file("sheet1.xml",rptSheetXml(head,rows,widths,titleLines));return zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}/* ============================ [RUN-161] ============================
   Excel 2 ส่วนสำหรับ "รายงานการลงเวลา" (สรุปจำนวนวันรายพนักงาน)
     Sheet1 = ตารางสรุปจำนวนวันรายพนักงาน
     Sheet2 = "กราฟสรุป" = ข้อมูลชุดเดียวกัน + กราฟแท่งของจริงในไฟล์ Excel
   · เป็นฟังก์ชัน "เพิ่มใหม่" ไม่แตะ rptBuildXlsx เดิม -> รายงานลา/วันลาคงเหลือ/OT/REPORT ALL
     ยังใช้ของเดิมทุกตัว ไม่เปลี่ยนพฤติกรรม
   · ลำดับแถวใน Sheet2 = ลำดับเดียวกับ Sheet1 (มากสุด -> น้อยสุด)
     catAx ใช้ orientation=maxMin เพื่อให้แท่งบนสุดคือค่ามากสุดตรงกับตาราง
   chart = { title, cats:[ชื่อแกน], series:[{name, values:[], color:"RRGGBB"}] }
   ================================================================= */
function rptChartXml(sheet,title,nCat,series){
  var AX1="751274120",AX2="751274121";
  var r1=3,r2=2+nCat;
  function f(col,a,b){return "'"+String(sheet).replace(/'/g,"''")+"'!$"+col+"$"+a+(b?":$"+col+"$"+b:"")}
  var ser=series.map(function(s,j){
    var col=rptColLetter(j+1);
    return '<c:ser><c:idx val="'+j+'"/><c:order val="'+j+'"/>'
      +'<c:tx><c:strRef><c:f>'+rptXmlEsc(f(col,2))+'</c:f></c:strRef></c:tx>'
      +'<c:spPr><a:solidFill><a:srgbClr val="'+(s.color||"2563EB")+'"/></a:solidFill></c:spPr>'
      +'<c:invertIfNegative val="0"/>'
      +'<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/>'
      +'<c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
      +'<c:cat><c:strRef><c:f>'+rptXmlEsc(f("A",r1,r2))+'</c:f></c:strRef></c:cat>'
      +'<c:val><c:numRef><c:f>'+rptXmlEsc(f(col,r1,r2))+'</c:f></c:numRef></c:val>'
      +'</c:ser>'
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"'
    +' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
    +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    +'<c:chart>'
    +'<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>'+rptXmlEsc(title)
    +'</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>'
    +'<c:autoTitleDeleted val="0"/>'
    +'<c:plotArea><c:layout/>'
    +'<c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/><c:varyColors val="0"/>'
    +ser
    +'<c:gapWidth val="60"/><c:overlap val="'+(series.length>1?"-10":"0")+'"/>'
    +'<c:axId val="'+AX1+'"/><c:axId val="'+AX2+'"/></c:barChart>'
    +'<c:catAx><c:axId val="'+AX1+'"/><c:scaling><c:orientation val="maxMin"/></c:scaling>'
    +'<c:delete val="0"/><c:axPos val="l"/><c:crossAx val="'+AX2+'"/></c:catAx>'
    +'<c:valAx><c:axId val="'+AX2+'"/><c:scaling><c:orientation val="minMax"/></c:scaling>'
    +'<c:delete val="0"/><c:axPos val="b"/><c:majorGridlines/>'
    +'<c:crossAx val="'+AX1+'"/></c:valAx></c:plotArea>'
    +'<c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>'
    +'<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>'
}
function rptDrawingXml(row1,nCat,nSer){
  var col2=Math.max(12,nSer+9),row2=row1+Math.max(22,Math.min(nCat*2+8,60));
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"'
    +' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
    +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    +'<xdr:twoCellAnchor>'
    +'<xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff>'
    +'<xdr:row>'+row1+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
    +'<xdr:to><xdr:col>'+col2+'</xdr:col><xdr:colOff>0</xdr:colOff>'
    +'<xdr:row>'+row2+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>'
    +'<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr>'
    +'<xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>'
    +'<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>'
    +'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
    +'<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"'
    +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>'
    +'</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/>'
    +'</xdr:twoCellAnchor></xdr:wsDr>'
}
function rptBuildXlsxChart(sheetName,head,rows,widths,titleLines,chart){
  if(!chart||!chart.series||!chart.series.length||!chart.cats||!chart.cats.length)
    return rptBuildXlsx(sheetName,head,rows,widths,titleLines);
  var CH="กราฟสรุป";
  var cHead=["พนักงาน"].concat(chart.series.map(function(s){return s.name}));
  var cRows=chart.cats.map(function(cat,i){
    return [String(cat)].concat(chart.series.map(function(s){return Number(s.values[i])||0}))});
  var cW=[34].concat(chart.series.map(function(s){
    return Math.min(Math.max(String(s.name).length+4,10),22)}));
  var zip=new window.JSZip;
  zip.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    +'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    +'<Default Extension="xml" ContentType="application/xml"/>'
    +'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    +'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    +'<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    +'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
    +'<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>'
    +'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    +"</Types>");
  zip.folder("_rels").file(".rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    +"</Relationships>");
  var xl=zip.folder("xl");
  xl.file("workbook.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    +'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    +'<sheets><sheet name="'+rptXmlEsc(sheetName)+'" sheetId="1" r:id="rId1"/>'
    +'<sheet name="'+rptXmlEsc(CH)+'" sheetId="2" r:id="rId2"/></sheets></workbook>');
  xl.folder("_rels").file("workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    +'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
    +'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    +"</Relationships>");
  xl.file("styles.xml",rptStylesXml());
  var ws=xl.folder("worksheets");
  ws.file("sheet1.xml",rptSheetXml(head,rows,widths,titleLines));
  /* [RUN-161] Sheet กราฟสรุป: ใส่ r: namespace + ตั้งหน้าเป็นแนวนอนพอดีความกว้าง
     เพื่อให้สั่งพิมพ์แล้วกราฟไม่ถูกตัด (บนหน้าจอ Excel แสดงเต็มอยู่แล้ว) */
  ws.file("sheet2.xml",rptSheetXml(cHead,cRows,cW,[chart.title||sheetName])
    .replace("</sheetData>","</sheetData>"
      +'<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>'
      +'<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
      +'<drawing r:id="rId1"/>')
    .replace("<worksheet xmlns=","<worksheet xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns=")
    .replace("<sheetViews>","<sheetPr><pageSetUpPr fitToPage=\"1\"/></sheetPr><sheetViews>"));
  ws.folder("_rels").file("sheet2.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>'
    +"</Relationships>");
  xl.folder("charts").file("chart1.xml",
    rptChartXml(CH,chart.title||sheetName,chart.cats.length,chart.series));
  var dr=xl.folder("drawings");
  /* [RUN-161] วางกราฟ "ใต้ตารางข้อมูล" ของ Sheet กราฟสรุป (แถวหัวเรื่อง 1 + หัวตาราง 1 + ข้อมูล n + เว้น 2)
     ไม่วางด้านขวา เพราะกรอบจะถูกตัดและตกหน้าใหม่ตอนสั่งพิมพ์ */
  dr.file("drawing1.xml",rptDrawingXml(chart.cats.length+4,chart.cats.length,chart.series.length));
  dr.folder("_rels").file("drawing1.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>'
    +"</Relationships>");
  return zip.generateAsync({type:"blob",
    mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
}
function rptLoadZip(){return loadScriptOnce("jszip","https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","JSZip")}function rptDateBE(iso){var p=String(iso||"").split("-");return p.length===3?p[2]+"/"+p[1]+"/"+(parseInt(p[0],10)+543):""}function rptNorm(v){return String(v==null?"":v).trim().replace(/\s+/g," ").toLowerCase()}/* [RUN-137] ดึงรายงานให้ครบทุกหน้า — RPC ฝั่ง Server มี p_limit/p_offset/total_count
   ทำไมต้องมี: PostgREST ของโปรเจกต์ตัดผลลัพธ์ที่ ~1000 แถว ต่อให้ Frontend ขอ p_limit สูงกว่านั้น
   จึงห้ามเชื่อ "batch.length < pageSize = จบแล้ว" — ต้องยึด total_count จาก batch แรกเป็นหลัก
   กติกา: offset += จำนวนแถวที่ได้รับ "จริง" · วนจน loaded >= total_count
          batch ว่างแต่ยังไม่ครบ = โยน Error ทันที (ห้ามคืนข้อมูลไม่ครบเงียบ ๆ)
          กันซ้ำด้วย key จริงของแถว · มี guard จำนวนหน้าสูงสุดกัน loop ไม่รู้จบ */
function rptFetchAllPages(fn,args,opt){
  opt=opt||{};
  var pageSize=opt.pageSize||1000;
  var maxPages=opt.maxPages||200;
  var keyOf=opt.keyOf||null;
  var out=[],seen=Object.create(null),offset=0,total=null,pages=0,dups=0;
  function step(){
    if(pages>=maxPages){
      throw new Error("ดึงข้อมูลรายงานไม่สำเร็จ: เกินจำนวนหน้าสูงสุด ("+maxPages+" หน้า) — กรุณาลดช่วงวันที่");
    }
    pages++;
    var a={};for(var k in args)if(Object.prototype.hasOwnProperty.call(args,k))a[k]=args[k];
    a.p_limit=pageSize;a.p_offset=offset;
    return sbRpcList(fn,a).then(function(rows){
      rows=rows||[];
      if(total===null){
        total=rows.length?Number(rows[0].total_count):0;
        if(!isFinite(total)||total<0)total=rows.length;
      }
      if(!rows.length){
        if(out.length<total){
          throw new Error("ดึงข้อมูลรายงานไม่ครบ: ได้ "+out.length+" จาก "+total+" แถว "+
            "(เซิร์ฟเวอร์ตอบกลับหน้าว่างที่ offset "+offset+") — ยังไม่แสดงผลเพื่อกันตัวเลขผิด");
        }
        return out;
      }
      offset+=rows.length;                 /* เลื่อนตามจำนวนที่ได้รับจริง ไม่ใช่ pageSize ที่ขอ */
      for(var i=0;i<rows.length;i++){
        var r=rows[i];
        if(keyOf){
          var kk=keyOf(r);
          if(kk!=null){ if(seen[kk]){dups++;continue;} seen[kk]=1; }
        }
        out.push(r);
      }
      if(out.length+dups>=total)return out;
      return step();
    });
  }
  return Promise.resolve().then(step);
}

/* ============================================================================
   [RUN-139] Daily Dataset กลาง — Employee x Work Date (Source of Truth ชุดเดียว)
   ใช้ร่วมกันระหว่าง "รายงานการลงเวลา" (views/attendance/report.js)
   และ "REPORT ALL" (compat/approvals-reports.js) เพื่อไม่ให้ตัวเลขสองที่ต่างกัน

   ปัญหาเดิม: njhr_att_report เริ่ม query จาก public.attendance
   จึงคืนเฉพาะ "วันที่ที่มี attendance row" — วันที่ควรทำงานแต่ไม่มีการสแกนหายไปทั้งแถว

   กติกาที่ใช้ (ยืนยันกับผู้ใช้แล้ว · ห้ามเดานอกเหนือจากนี้):
     A. มี Attendance                                   -> ใช้ข้อมูลจริงจาก RPC เดิม
     B. เป็นวันทำงานตาม working_days + ไม่มี Attendance
        + ไม่มี Leave APPROVED + ไม่ใช่ Holiday          -> ขาดงาน/ไม่ได้ลงเวลา
     C. Leave APPROVED                                   -> สถานะ "ลา" ห้ามนับเป็นขาดงาน
     D. Holiday                                          -> ไม่ขาดงาน
     E. ไม่มีกะ (NO_SHIFT) / working_days อ่านไม่ออก      -> ห้ามสร้างแถวขาดงานเด็ดขาด
     F. ก่อนวันเริ่มงาน / หลังวันลาออก / ก่อน effective_date ของกะ -> ไม่สร้างแถว
     G. กะข้ามคืน: work_date คือ "วันที่เริ่มกะ" อยู่แล้ว (ยืนยันจากข้อมูลจริง)
        จึงเทียบ working_days กับวันของ work_date ได้ตรง ๆ ไม่ต้องเลื่อนวัน
   ============================================================================ */

/* ชื่อวันที่ยอมรับใน work_shifts.working_days — เรียงยาวไปสั้นไม่จำเป็น เพราะเทียบแบบ exact ทั้ง token */
var RPT_DOW_TOKENS=[["อาทิตย์",0],["จันทร์",1],["อังคาร",2],["พุธ",3],["พฤหัสบดี",4],["พฤหัส",4],
  ["ศุกร์",5],["เสาร์",6],["อา",0],["จ",1],["อ",2],["พ",3],["พฤ",4],["ศ",5],["ส",6],
  ["sun",0],["sunday",0],["mon",1],["monday",1],["tue",2],["tuesday",2],["wed",3],["wednesday",3],
  ["thu",4],["thursday",4],["fri",5],["friday",5],["sat",6],["saturday",6],
  ["0",0],["1",1],["2",2],["3",3],["4",4],["5",5],["6",6]];

function rptDowToken(v){
  var t=String(v==null?"":v).trim().toLowerCase().replace(/[.​]/g,"");
  if(!t)return null;
  for(var i=0;i<RPT_DOW_TOKENS.length;i++)if(t===RPT_DOW_TOKENS[i][0])return RPT_DOW_TOKENS[i][1];
  return null;
}

/* คืน array 7 ช่อง index ตาม Date.getDay() (0=อาทิตย์) หรือ null เมื่อ "ไม่รู้"
   null = ไม่ระบุ หรือ อ่านไม่ออก -> ผู้เรียกต้องไม่สร้างขาดงาน (ห้ามเดา) */
function rptParseWorkingDays(txt){
  var t=String(txt==null?"":txt).trim();
  if(!t)return null;
  if(/ทุกวัน|everyday|every\s*day|daily/i.test(t))return [true,true,true,true,true,true,true];
  var n=t.replace(/ถึง/g,"-").replace(/[–—~]/g,"-")
         .replace(/\s*-\s*/g,"-")          /* "จ ถึง ศ" / "จ - ศ" ให้เหลือ "จ-ศ" ก่อนตัดคำ */
         .replace(/[\s;/|]+/g,",").replace(/,+/g,",");
  var parts=n.split(","),days=[false,false,false,false,false,false,false],ok=false,bad=false;
  for(var i=0;i<parts.length;i++){
    var p=String(parts[i]).trim();
    if(!p)continue;
    var seg=p.split("-");
    if(seg.length===1){var d=rptDowToken(seg[0]);if(d==null){bad=true;break}days[d]=true;ok=true;continue}
    if(seg.length!==2){bad=true;break}
    var a=rptDowToken(seg[0]),b=rptDowToken(seg[1]);
    if(a==null||b==null){bad=true;break}
    var k=a;
    for(var g=0;g<7;g++){days[k]=true;ok=true;if(k===b)break;k=(k+1)%7}
  }
  if(bad||!ok)return null;
  return days;
}

function rptIsoAdd(iso,n){
  var d=new Date(String(iso).slice(0,10)+"T00:00:00");
  d.setDate(d.getDate()+n);
  return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
}
function rptIsoDow(iso){return new Date(String(iso).slice(0,10)+"T00:00:00").getDay()}
function rptIsoRange(from,to){
  var out=[],c=String(from).slice(0,10),e=String(to).slice(0,10),guard=0;
  while(c<=e){out.push(c);c=rptIsoAdd(c,1);if(++guard>1500)break}
  return out;
}
function rptRnd2n(v){return Math.round((Number(v)||0)*100)/100}

/* ----------------------------------------------------------------------------
   rptComposeDaily(inp) -> { rows:[], stats:{} }
   เป็น pure function ล้วน (ไม่ยิง RPC) เพื่อให้ทดสอบซ้ำได้และให้สองหน้าจอใช้ผลเดียวกัน

   inp = {
     from,to               : 'YYYY-MM-DD'
     employees[]           : {id,code,prefix,name,dept,status,startDate,resignDate}
     attendance[]          : {empId,date,checkIn,checkOut,workHours,status,lateMin,shiftName}
     leaves[]              : {id,empId,typeCode,typeName,startDate,endDate,unit,mode,days,hours,
                              startTime,endTime}
     holidays{iso:name}
     shiftByEmp{empId:{shiftId,shiftName,workingDays,isOvernight,effectiveDate}}
     ot[]                  : {empId,date,hours}            (ไม่บังคับ)
     back[]                : {empId,date}                  (ไม่บังคับ)
   }
   1 แถว = 1 Employee + 1 วันที่ (ไม่มีซ้ำ) เรียงตามวันที่ asc แล้วรหัสพนักงาน
---------------------------------------------------------------------------- */
function rptComposeDaily(inp){
  inp=inp||{};
  var from=String(inp.from||"").slice(0,10),to=String(inp.to||"").slice(0,10);
  if(!from||!to)throw new Error("Daily Dataset: ต้องระบุช่วงวันที่ให้ครบ");
  if(from>to)throw new Error("Daily Dataset: วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");

  var emps=inp.employees||[],holidays=inp.holidays||{},shiftByEmp=inp.shiftByEmp||{};
  var empById=Object.create(null),i,e;
  for(i=0;i<emps.length;i++){e=emps[i];if(e&&e.id)empById[e.id]=e}

  var rows=Object.create(null),order=[];
  var stats={att:0,absent:0,leave:0,holiday:0,noShift:0,unknownDays:0,otOnly:0};

  function rowOf(empId,date,origin){
    var k=empId+"|"+date,r=rows[k];
    if(r)return r;
    var em=empById[empId]||{},sh=shiftByEmp[empId]||null;
    r={empId:empId,empCode:em.code||"",prefix:em.prefix||"",empName:em.name||"",dept:em.dept||"",
       date:date,shiftName:sh&&sh.shiftName?sh.shiftName:"",
       checkIn:null,checkOut:null,workHours:null,lateMin:null,
       attStatus:"",hasAtt:false,
       leaveType:"",leaveTypeName:"",leaveMode:"",leaveDays:0,leaveFrom:"",leaveTo:"",
       otHours:0,backdated:false,
       isHoliday:!!holidays[date],holidayName:holidays[date]||"",
       isWorkDay:null,absent:false,origin:origin,note:""};
    rows[k]=r;order.push(k);
    return r;
  }

  /* ---- A) แถวจาก Attendance จริง (หลักฐานแน่นอนที่สุด มาก่อนเสมอ) ---- */
  var att=inp.attendance||[];
  for(i=0;i<att.length;i++){
    var a=att[i];if(!a||!a.empId||!empById[a.empId])continue;
    var ad=String(a.date||"").slice(0,10);
    if(!ad||ad<from||ad>to)continue;
    var ra=rowOf(a.empId,ad,"ATT");
    ra.hasAtt=true;ra.origin="ATT";
    ra.checkIn=a.checkIn||null;ra.checkOut=a.checkOut||null;
    ra.workHours=a.workHours==null?null:Number(a.workHours);
    ra.lateMin=a.lateMin==null?null:Number(a.lateMin);
    ra.attStatus=String(a.status||"")||"NORMAL";
    if(a.shiftName)ra.shiftName=a.shiftName;
    stats.att++;
  }

  /* ---- B) ตารางวันทำงานตามกะจริง ---- */
  var dates=rptIsoRange(from,to),di,ei;
  for(ei=0;ei<emps.length;ei++){
    e=emps[ei];if(!e||!e.id)continue;
    var sh=shiftByEmp[e.id]||null;
    if(!sh){stats.noShift++;continue}                 /* E: ไม่มีกะ ห้ามสร้างขาดงาน */
    var wd=sh.workingDaysParsed!==undefined?sh.workingDaysParsed:rptParseWorkingDays(sh.workingDays);
    sh.workingDaysParsed=wd;
    if(!wd){stats.unknownDays++;continue}             /* E: อ่าน working_days ไม่ออก ห้ามเดา */
    var sd=e.startDate?String(e.startDate).slice(0,10):null;
    var rd=e.resignDate?String(e.resignDate).slice(0,10):null;
    var ef=sh.effectiveDate?String(sh.effectiveDate).slice(0,10):null;
    for(di=0;di<dates.length;di++){
      var d=dates[di];
      if(sd&&d<sd)continue;                           /* F */
      if(rd&&d>rd)continue;                           /* F */
      if(ef&&d<ef)continue;                           /* F: ยังไม่เข้ากะนี้ */
      if(!wd[rptIsoDow(d)])continue;                  /* ไม่ใช่วันทำงาน -> ไม่สร้างแถว */
      var r=rowOf(e.id,d,"SHIFT");
      r.isWorkDay=true;
      if(!r.shiftName&&sh.shiftName)r.shiftName=sh.shiftName;
    }
  }

  /* ---- C) Leave APPROVED ---- */
  var lv=inp.leaves||[],li;
  for(li=0;li<lv.length;li++){
    var l=lv[li];if(!l||!l.empId||!empById[l.empId])continue;
    var ls=String(l.startDate||"").slice(0,10),le=String(l.endDate||"").slice(0,10);
    if(!ls||!le)continue;
    var lsh=shiftByEmp[l.empId]||null;
    var lwd=lsh?(lsh.workingDaysParsed!==undefined?lsh.workingDaysParsed:rptParseWorkingDays(lsh.workingDays)):null;
    if(lsh)lsh.workingDaysParsed=lwd;
    /* วันของใบลาที่ "นับเป็นวันลา" = วันทำงานตามกะ · ไม่มีกะ/ไม่รู้วันทำงาน = นับทุกวันของใบลา
       (ยึดหลักฐานใบลาอย่างเดียว ไม่เดาวันทำงานให้คนที่ไม่มีกะ) */
    var span=[],c=ls,guard=0;
    while(c<=le){
      if(!lwd||lwd[rptIsoDow(c)])span.push(c);
      c=rptIsoAdd(c,1);
      if(++guard>400)break;
    }
    if(!span.length)continue;
    var unit=String(l.unit||"day").toLowerCase(),per;
    if(unit==="hour")per=rptRnd2n((Number(l.hours)||0)/8);
    else if(unit==="halfday")per=0.5;
    else per=rptRnd2n((Number(l.days)||span.length)/span.length);
    for(var si=0;si<span.length;si++){
      var ld=span[si];
      if(ld<from||ld>to)continue;                     /* นอกช่วงรายงาน ไม่สร้างแถว */
      var rl=rowOf(l.empId,ld,"LEAVE");
      rl.leaveType=l.typeCode||"";rl.leaveTypeName=l.typeName||"";
      rl.leaveMode=l.mode||(unit==="halfday"?"HALF":unit==="hour"?"HOURLY":"FULL");
      rl.leaveDays=rptRnd2n(rl.leaveDays+per);
      rl.leaveFrom=l.startTime||"";rl.leaveTo=l.endTime||"";
      if(!lsh||!lwd)rl.note=rl.note||"ไม่มีข้อมูลวันทำงานของกะ — แสดงตามวันในใบลา";
    }
  }

  /* ---- D) OT / ลงชื่อย้อนหลัง (ผูกกับวันที่จริง) ---- */
  var ots=inp.ot||[],oi;
  for(oi=0;oi<ots.length;oi++){
    var o=ots[oi];if(!o||!o.empId)continue;
    var od=String(o.date||"").slice(0,10);
    if(!od||od<from||od>to)continue;
    if(!empById[o.empId])continue;
    var ro=rows[o.empId+"|"+od];
    if(!ro){ro=rowOf(o.empId,od,"OT");stats.otOnly++}
    ro.otHours=rptRnd2n(ro.otHours+(Number(o.hours)||0));
  }
  var bks=inp.back||[],bi;
  for(bi=0;bi<bks.length;bi++){
    var b=bks[bi];if(!b||!b.empId)continue;
    var bd=String(b.date||"").slice(0,10);
    if(!bd||bd<from||bd>to)continue;
    if(!empById[b.empId])continue;
    var rb=rows[b.empId+"|"+bd];
    if(rb)rb.backdated=true;
  }

  /* ---- E) สรุปสถานะรายแถว ---- */
  for(i=0;i<order.length;i++){
    var x=rows[order[i]];
    if(x.hasAtt){
      /* มี Attendance = ใช้สถานะจริงจาก RPC เสมอ ห้ามทับ */
      if(x.leaveType&&!x.note)x.note="มีใบลาอนุมัติในวันเดียวกัน";
      if(x.isHoliday){stats.holiday++;if(!x.note)x.note="วันหยุด: "+x.holidayName}
      continue;
    }
    if(x.leaveType){x.attStatus="LEAVE";stats.leave++;continue}
    if(x.isHoliday){x.attStatus="HOLIDAY";x.origin="HOLIDAY";stats.holiday++;
      if(!x.note)x.note=x.holidayName;continue}
    if(x.isWorkDay===true){x.attStatus="ABSENT";x.absent=true;x.origin="ABSENT";stats.absent++;
      if(!x.note)x.note="ไม่มีการลงเวลา";continue}
    /* เหลือกรณีแถวที่เกิดจาก OT อย่างเดียว — ไม่ใช่ขาดงาน */
    x.attStatus=x.attStatus||"";
  }

  /* ---- F) เรียง: วันที่ asc แล้วรหัสพนักงาน ---- */
  var out=new Array(order.length);
  for(i=0;i<order.length;i++)out[i]=rows[order[i]];
  out.sort(function(p,q){
    if(p.date!==q.date)return p.date<q.date?-1:1;
    return String(p.empCode).localeCompare(String(q.empCode),"th");
  });
  return {rows:out,stats:stats};
}

/* แผนที่ พนักงาน -> กะปัจจุบัน (+ working_days) จาก RPC จริง
   ใช้ร่วมกันทั้ง "รายงานการลงเวลา" และ "REPORT ALL" เพื่อให้กะที่ใช้คำนวณเป็นชุดเดียวกัน */
function rptFetchShiftMap(token){
  return sbRpcList("njhr_shift_list",{p_token:token,p_include_inactive:true}).then(function(shifts){
    shifts=rptGuardCap(shifts||[],"รายการกะทำงาน");
    if(!shifts.length)return {};
    return Promise.all(shifts.map(function(sh){
      return sbRpcList("njhr_shift_employee_list",{p_token:token,p_shift:sh.id}).then(function(rows){
        return {sh:sh,rows:rptGuardCap(rows||[],'รายชื่อพนักงานในกะ "'+(sh.shift_name||"")+'"')};
      });
    })).then(function(packs){
      var map={};
      packs.forEach(function(pk){
        pk.rows.forEach(function(r){
          if(!r.employee_id||map[r.employee_id])return;  /* 1 คน = 1 กะ ณ วันหนึ่ง */
          map[r.employee_id]={shiftId:pk.sh.id,shiftName:pk.sh.shift_name||"",
            workingDays:pk.sh.working_days||null,isOvernight:!!pk.sh.is_overnight,
            effectiveDate:r.effective_date||null};
        });
      });
      return map;
    });
  });
}

/* [RUN-144] คีย์จับคู่รหัสพนักงาน — ใช้ร่วมกันทั้ง "รายงานการลงเวลา" และ "REPORT ALL"
   ตัดช่องว่างและอักขระล่องหน (zero-width / BOM) แล้วเทียบแบบไม่สนตัวพิมพ์
   ห้ามแปลงเป็นตัวเลขเด็ดขาด เพราะ "0081" จะกลายเป็น 81 และรหัสอย่าง EMP0002 จะพัง */
function rptEmpKey(v){
  return String(v==null?"":v).replace(/[\s​-‍﻿]/g,"").toUpperCase();
}

/* กันข้อมูลขาดแบบเงียบ ๆ จาก RPC ที่ไม่มี p_limit/p_offset ให้เพจได้
   PostgREST ของโปรเจกต์ตัดที่ ~1000 แถว — ถ้าชนเพดานแปลว่าอาจไม่ครบ ต้อง FAIL ไม่ใช่เดา */
function rptGuardCap(rows,label){
  rows=rows||[];
  if(rows.length>=1000)throw new Error("ดึง"+label+"ได้ "+rows.length+" แถว ซึ่งชนเพดานของเซิร์ฟเวอร์ "+
    "— ข้อมูลอาจไม่ครบ กรุณาลดช่วงวันที่หรือกรองแผนก (ยังไม่แสดงผลเพื่อกันตัวเลขผิด)");
  return rows;
}

NJHR.compat.scope.rptBuildXlsx=rptBuildXlsx;NJHR.compat.scope.rptBuildXlsxChart=rptBuildXlsxChart;NJHR.compat.scope.rptDateBE=rptDateBE;NJHR.compat.scope.rptLoadZip=rptLoadZip;NJHR.compat.scope.rptNorm=rptNorm;NJHR.compat.scope.rptSafeName=rptSafeName;NJHR.compat.scope.rptFetchAllPages=rptFetchAllPages;NJHR.compat.scope.rptComposeDaily=rptComposeDaily;NJHR.compat.scope.rptParseWorkingDays=rptParseWorkingDays;NJHR.compat.scope.rptIsoAdd=rptIsoAdd;NJHR.compat.scope.rptIsoDow=rptIsoDow;NJHR.compat.scope.rptIsoRange=rptIsoRange;NJHR.compat.scope.rptGuardCap=rptGuardCap;NJHR.compat.scope.rptFetchShiftMap=rptFetchShiftMap;NJHR.compat.scope.rptEmpKey=rptEmpKey})();
