  /* ================= SHARED: EXCEL/ZIP EXPORT + REPORT HELPER =================
     ย้ายมาจาก 12-view-reports-settings.js โดยไม่แก้เนื้อใน
     ใช้ร่วมกันโดย employees-import · employees-export · attendance · attendance-report · compatibility
     ตัวไลบรารี XLSX/JSZip ยังโหลดแบบ lazy ผ่าน loadScriptOnce เหมือนเดิม ================= */
  function rptXmlEsc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function rptSafeName(v) { return String(v).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').slice(0, 60); }

  function rptColLetter(i) {
    var s = '', n = Number(i) + 1;
    while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s || 'A';
  }

  function rptSheetXml(head, rows, widths, titleLines) {
    var top = (titleLines || []).length;
    function cell(ref, val, styleId) {
      if (typeof val === 'number' && isFinite(val)) return '<c r="' + ref + '" s="' + styleId + '"><v>' + val + '</v></c>';
      return '<c r="' + ref + '" s="' + styleId + '" t="inlineStr"><is><t xml:space="preserve">' + rptXmlEsc(val) + '</t></is></c>';
    }
    // ต้องมี <dimension> เสมอ มิฉะนั้นโปรแกรมอ่าน .xlsx บางตัว (รวมถึงตัวนำเข้าของระบบเอง)
    // จะคำนวณขอบเขตชีตไม่ได้ แล้วอ่านไฟล์ไม่ผ่าน
    var lastRef = rptColLetter(Math.max(head.length, 1) - 1) + (top + 1 + rows.length);
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<dimension ref="A1:' + lastRef + '"/>' +
      '<cols>' + widths.map(function (w, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
      }).join('') + '</cols><sheetData>';
    (titleLines || []).forEach(function (t, ti) {
      xml += '<row r="' + (ti + 1) + '">' + cell('A' + (ti + 1), t, 3) + '</row>';
    });
    var hr = top + 1;
    xml += '<row r="' + hr + '">' + head.map(function (h, i) { return cell(rptColLetter(i) + hr, h, 1); }).join('') + '</row>';
    rows.forEach(function (r, ri) {
      xml += '<row r="' + (ri + hr + 1) + '">' + r.map(function (c, ci) {
        return cell(rptColLetter(ci) + (ri + hr + 1), c, 2);
      }).join('') + '</row>';
    });
    // ตรึงหัวตารางไว้ด้านบน
    var pane = '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + hr +
      '" topLeftCell="A' + (hr + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    return (xml + '</sheetData></worksheet>').replace('<cols>', pane + '<cols>');
  }

  function rptBuildXlsx(sheetName, head, rows, widths, titleLines) {
    var zip = new window.JSZip();
    zip.file('[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>');
    zip.folder('_rels').file('.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>');
    var xl = zip.folder('xl');
    xl.file('workbook.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + rptXmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>');
    xl.folder('_rels').file('workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>');
    // หัวตารางพื้นสีส้มทอง ตัวอักษรดำ เส้นขอบดำครบทุกช่อง · ไม่มี merge · ไม่มีแถวว่างนำหน้า
    xl.file('styles.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2">' +
      '<font><sz val="11"/><color rgb="FF000000"/><name val="Tahoma"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Tahoma"/></font></fonts>' +
      '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right>' +
      '<top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '</cellXfs></styleSheet>');
    xl.folder('worksheets').file('sheet1.xml', rptSheetXml(head, rows, widths, titleLines));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function rptLoadZip() {
    return loadScriptOnce('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
  }

  function rptDateBE(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + (parseInt(p[0], 10) + 543) : '';
  }

  function rptNorm(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase(); }
