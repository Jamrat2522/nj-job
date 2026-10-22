import{b}from"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import"./chunk-Q7FMECGI.js";import"./chunk-GDT6F23K.js";import{a as f}from"./chunk-OFOOXWUM.js";import"./chunk-LNP7HEMP.js";import"./chunk-NQOCXXA2.js";import"./chunk-6NADHKLT.js";import"./chunk-SGWIBJH6.js";var h=["Date","Item","Invoice No.","Master","House B/l No.","Data Type","Company Invoice","DCL INV.","Customer Job No.","Service charge","Advance","VAT 7%","Amount","WHT 3%","Total Amout","Billing Note  no. ","Date"],R=[10.453125,4.6328125,14.08984375,11.81640625,13.36328125,9.1796875,15.1796875,13.1796875,15.6328125,12.7265625,9.1796875,7.6328125,9.1796875,7.90625,11.1796875,14.36328125],x='_-* #,##0.00_-;\\-* #,##0.00_-;_-* "-"??_-;_-@_-',y="FFFFC000",g=[10,11,12,13,14,15];function E(t){let o=String(t||"").slice(0,10),e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(o);return e?`${e[3]}/${e[2]}/${e[1]}`:""}var m=t=>t==null||t===""?0:Number(t)||0;function _(t){let o=t&&t.billing||{},e=t&&t.jobs||[],s=o.billing_no||"",c=E(o.billing_date),i=e.map((n,a)=>[c,a+1,n.invoice_no||"",n.master||"",n.house_bl_no||"",n.data_type||"",n.company_invoice||"",n.customs_declaration_no||"",n.customer_job_no||"",m(n.service_amount),m(n.advance_amount),m(n.vat_amount),m(n.amount),m(n.wht_amount),m(n.total_amount),s,c]),l=n=>i.reduce((a,r)=>a+m(r[n]),0),u=["","","","","","","","","",l(9),l(10),l(11),l(12),l(13),l(14),"",""];return{header:h.slice(),rows:i,total:u}}function C(t){return`REPORT ${String(t&&t.billing_no||"BILLING").replace(/[\\/:*?"<>|]/g,"-")}.xlsx`}function L(t){let o=Array.isArray(t)?t:[],e=[];o.forEach(i=>_(i).rows.forEach(l=>{let u=l.slice();u[1]=e.length+1,e.push(u)}));let s=i=>e.reduce((l,u)=>l+m(u[i]),0),c=["","","","","","","","","",s(9),s(10),s(11),s(12),s(13),s(14),"",""];return{header:h.slice(),rows:e,total:c,billings:o.length}}function N(t=new Date){let o=String(t.getDate()).padStart(2,"0"),e=String(t.getMonth()+1).padStart(2,"0");return`REPORT BILLING ${o}-${e}-${t.getFullYear()}.xlsx`}async function F(t){let o=_(t);if(!o.rows.length)return f("\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","err"),null;let e=C(t&&t.billing||{});return w(o,e)}async function O(t,o=new Date){let e=L(t);return e.rows.length?w(e,N(o)):(f("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2D\u0E2D\u0E01 REPORT","err"),null)}async function w(t,o){let e=await b(),s=new e.Workbook,c=s.addWorksheet("Sheet1");c.addRow(t.header),t.rows.forEach(r=>c.addRow(r)),c.addRow(t.total),R.forEach((r,d)=>{c.getColumn(d+1).width=r});let i=t.rows.length+2;for(let r=1;r<=i;r++)for(let d=1;d<=17;d++){let p=c.getCell(r,d);p.font={name:"Calibri",size:11,bold:r===1?!1:r===i},p.border={top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"}},r===1?(p.fill={type:"pattern",pattern:"solid",fgColor:{argb:y}},d===17&&(p.alignment={horizontal:"center"})):g.includes(d)&&(p.numFmt=x)}for(let r=1;r<=17;r++)c.getCell(i,r).font={name:"Calibri",size:11,bold:g.includes(r)};let l=await s.xlsx.writeBuffer(),u=new Blob([l],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),n=URL.createObjectURL(u),a=document.createElement("a");return a.href=n,a.download=o,document.body.appendChild(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(n),1e3),f("\u0E2D\u0E2D\u0E01 REPORT \u0E41\u0E25\u0E49\u0E27 \u2014 "+o),o}/* \u2550\u2550\u2550 V.517 EXPORT EXCEL \u0E2B\u0E25\u0E32\u0E22 REF : \u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27 Worksheet \u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 18 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E15\u0E32\u0E21\u0E44\u0E1F\u0E25\u0E4C\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u00B7 \u0E40\u0E23\u0E35\u0E22\u0E07 Billing Note no. \u0E19\u0E49\u0E2D\u0E22 -> \u0E21\u0E32\u0E01 \u00B7 Item \u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07 \u2550\u2550\u2550 */
var H517 = ["Item", "Invoice No.", "Date", "Master", "House B/l No.", "Data Type", "Company Invoice", "DCL INV.", "Customer Job No.", "Service charge", "Advance", "VAT 7%", "Amount", "WHT 3%", "Total Amout", "Billing Note  no. ", "Date", "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"],
  W517 = [4.6328125, 14.90625, 10.453125, 7.08984375, 12.26953125, 9.1796875, 32.26953125, 12.26953125, 15.6328125, 12.6328125, 9.1796875, 7, 9.1796875, 7.81640625, 11.08984375, 14.36328125, 10.453125, 14],
  M517 = [10, 11, 12, 13, 14, 15], D517 = [3, 17, 18];
function DD517(s) { let k = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return k ? new Date(Date.UTC(+k[1], +k[2] - 1, +k[3])) : null; }
function SK517r(b) { let k = /^([A-Z]+)(\d{4})-(\d+)$/.exec(String(b || "").trim()); return k ? [0, k[1], +k[2], +k[3]] : [1, "", 0, 0]; }
function RW517(list) {
  let L = (Array.isArray(list) ? list : []).filter(Boolean).slice().sort((a, b) => {
    let p = SK517r(a.billing && a.billing.billing_no), q = SK517r(b.billing && b.billing.billing_no);
    for (let i = 0; i < 4; i++) { if (p[i] < q[i]) return -1; if (p[i] > q[i]) return 1; }
    return 0;
  });
  let rows = [];
  L.forEach((t) => {
    let o = t.billing || {}, bd = DD517(o.billing_date), sd = DD517(o.submit_date);
    ((t.jobs) || []).forEach((n) => rows.push([rows.length + 1, n.invoice_no || "", bd, n.master || "", n.house_bl_no || "", n.data_type || "", n.company_invoice || "", n.customs_declaration_no || "", n.customer_job_no || "", m(n.service_amount), m(n.advance_amount), m(n.vat_amount), m(n.amount), m(n.wht_amount), m(n.total_amount), o.billing_no || "", bd, sd]));
  });
  let s = (i) => rows.reduce((a, r) => a + m(r[i]), 0);
  return { header: H517.slice(), rows, total: ["", "", "", "", "", "", "", "", "", s(9), s(10), s(11), s(12), s(13), s(14), "", "", ""], billings: L.length };
}
async function X517(list, d0 = new Date()) {
  let t = RW517(list);
  if (!t.rows.length) return (f("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A EXPORT", "err"), null);
  let fn = N(d0), e = await b(), wb = new e.Workbook(), ws = wb.addWorksheet("Sheet1");
  ws.addRow(t.header); t.rows.forEach((r) => ws.addRow(r)); ws.addRow(t.total);
  W517.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  let last = t.rows.length + 2;
  for (let r = 1; r <= last; r++)
    for (let c = 1; c <= 18; c++) {
      let p = ws.getCell(r, c);
      p.font = { name: "Calibri", size: 11, bold: r === last && M517.includes(c) };
      p.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (r === 1) { p.fill = { type: "pattern", pattern: "solid", fgColor: { argb: y } }; c === 17 && (p.alignment = { horizontal: "center" }); }
      else if (M517.includes(c)) p.numFmt = x;
      else if (D517.includes(c) && r < last) p.numFmt = "dd/mm/yyyy";
    }
  let buf = await wb.xlsx.writeBuffer(), bl = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), u = URL.createObjectURL(bl), a = document.createElement("a");
  a.href = u; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1e3);
  f("EXPORT \u0E41\u0E25\u0E49\u0E27 " + t.billings + " REF \u00B7 " + t.rows.length + " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 " + fn);
  return fn;
}

export{h as GOLDEN_HEADERS,R as GOLDEN_WIDTHS,y as HEAD_FILL,x as MONEY_FMT,L as buildCombinedReportRows,_ as buildReportRows,N as combinedReportFileName,E as ddmmyyyy,F as exportBillingReport,O as exportCombinedBillingReport,X517 as exportSelectedBillingReport,RW517 as buildSelectedReportRows,C as reportFileName};
