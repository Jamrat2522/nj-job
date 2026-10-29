import{a as L}from"./chunk-UWAYW6DC.js";import{a as X}from"./chunk-LNP7HEMP.js";import{a as E,c as W,e as C}from"./chunk-NQOCXXA2.js";var P=t=>t==null||t===""||Number(t)===0?"-":E(t),$=(t,n="-")=>{let e=t==null?"":String(t).trim();return C(e||n)},f=t=>{let n=Number(t);return Number.isFinite(n)?n:0},y=t=>Math.round((f(t)+Number.EPSILON)*100)/100,ot={list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r="1.1"/><circle cx="4.6" cy="12" r="1.1"/><circle cx="4.6" cy="17.5" r="1.1"/></svg>',user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},I=t=>`<span class="ivd-ic">${ot[t]||""}</span>`,Z=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function at(t,n){let e=0,i=0,c=0,u=0;for(let o of n)Z(o)?u=y(u+f(o.amount)):c=y(c+f(o.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(c=y(f(t.service_amount)),u=y(f(t.advance_amount)));let d=0;for(let o of n){let p=f(o.vat_amount)>0||f(o.vat_rate)>0;!Z(o)&&p?(e=y(e+f(o.amount)),d=y(d+f(o.vat_amount))):i=y(i+f(o.amount))}let r=d,m=[...new Set(n.map(o=>f(o.vat_rate)).filter(o=>o>0))],a=m.length===1?m[0]:f(t.vat_rate)||7,w=y(e+r),h=tt(n).reduce((o,p)=>y(o+p.amt),0);return{vatBase:e,nonVat:i,vat:r,vatRate:a,total:w,whtTotal:h,grand:y(w+i-h),svcCol:c,advCol:u}}function tt(t){let n=new Map;for(let i of t){if(Z(i))continue;let c=f(i.wht_rate);c<=0||n.set(c,y((n.get(c)||0)+f(i.wht_amount)))}let e=[{rate:1,label:"Transportation",amt:n.get(1)||0},{rate:3,label:"Service",amt:n.get(3)||0}];for(let[i,c]of[...n.entries()].sort((u,d)=>u[0]-d[0]))i!==1&&i!==3&&e.push({rate:i,label:"Other",amt:c});return e}/* V.630 : ACCOUNTING PDF \u2014 QUANTITY / UNIT (\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07 COST / UNIT PRICE) \u00B7 JOB \u0E40\u0E14\u0E34\u0E21 = 1 / \u0E27\u0E48\u0E32\u0E07 *//* V.631 : ACCOUNTING PDF \u2014 REMARKS \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E41\u0E23\u0E01 = \u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49 (JOB qty_container) \u00B7 1 = CONTAINER \u00B7 2+ = CONTAINERS \u00B7 \u0E27\u0E48\u0E32\u0E07 / 0 = \u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07 */function QQ631(x){let s=String(x??"").trim();if(s==="")return"";let n=Number(s);return Number.isFinite(n)&&n>0?"QUYANTITY : "+s+" CONTAINER"+(n>=2?"S":""):""}/* V.652 · ACCOUNTING — SERVICE / ADVANCE · INVOICE PDF (ทุกแบบฟอร์ม Default / APL / KN WH / MAERSK / TEST = ตัวสร้างเดียวกัน · Preview = Print = Save PDF)
   REMARKS : เพิ่มบรรทัดจาก JOB ปัจจุบัน (แทน V.631 "QUYANTITY") — แสดงเฉพาะหัวข้อที่มีข้อมูลจริง (ไม่มี = ไม่แสดงหัวข้อ / ":")
   QTY : N CONTAINER(S) (qty_container > 0) · Booking No. : … · Container No. : ตู้ทุกตู้คั่น ", " (แยกแบบเดียวกับ SOA V.650)
   หมายเหตุเดิม (remarks / job note) แสดงต่อท้ายเหมือนเดิม · สร้างตอนแสดงผลเท่านั้น ไม่บันทึกลงฐานข้อมูล = พิมพ์ / Save ซ้ำไม่ซ้อน */
function CL652(v){let raw=v==null?"":String(v),out=[];
  raw.split(/[\r\n,;]+/).map(x=>x.trim()).filter(Boolean).forEach(pt=>{let tk=pt.split(/[\s/]+/).filter(Boolean),mg=[];
    for(let i=0;i<tk.length;i++){/^[A-Z]{4}$/i.test(tk[i])&&i+1<tk.length&&/^\d{6,7}(?:-?\d)?$/.test(tk[i+1])?(mg.push(tk[i]+tk[i+1]),i++):mg.push(tk[i])}
    mg.length>1&&mg.every(t=>/^[A-Z]{4}\d{6,7}(?:-?\d)?$/i.test(t))?mg.forEach(t=>out.push(t.toUpperCase())):out.push(pt.replace(/\s+/g," "))});return out}
function RM652(V,adv){let L=[],q=String(V("qty_container")??"").trim(),n=Number(q),bk=String(V("booking_no")??"").trim(),cs=CL652(V("container_no"));
  q!==""&&Number.isFinite(n)&&n>0&&L.push("QTY : "+q+" CONTAINER"+(n>=2?"S":""));
  bk&&L.push("Booking No. : "+bk);
  cs.length&&(!adv||cs.every(x=>/^[A-Z]{4}\d{6,7}(?:-?\d)?$/.test(x)))&&L.push("Container No. : "+cs.join(", "));
  return L}
/* V.657 · INVOICE PDF แบบฟอร์ม APL (ชื่อแบบฟอร์ม = "APL" ตรงตัว · เหมือนการเลือกอัตโนมัติ V.652) · SERVICE เท่านั้น : REMARKS เพิ่ม Summit date / LOT จาก JOB ปัจจุบัน (ข้อ 3 · V.655)
   ต่อจากบรรทัด REMARKS เดิม (QTY / Booking / Container) ก่อนข้อความหมายเหตุเดิมและ Company Invoice · ไม่มีข้อมูล = ไม่แสดงทั้งหัวข้อและค่า (ไม่มี "-" / บรรทัดว่าง) · วันที่ DD/MM/YYYY
   แบบฟอร์มอื่น / ADVANCE / Default = เหมือนเดิม */
function AP657(V){let L=[],d=String(V("summit_date")??"").trim(),l=String(V("lot_no")??"").trim(),df=d?W(d):"";
  df&&df!=="-"&&L.push("Summit date : "+df);
  l&&L.push("LOT : "+l);
  return L}
/* V.653 · ตั้งค่าแบบฟอร์มปริ้น — ฟิลด์ใหม่จาก DOCUMENT (คีย์จริงคอลัมน์ njacc_jobs) : อ่านจาก JOB ก่อน · รูปแบบเดียวกับ PDF ของ DOCUMENT
   ผ่านหน่วยงาน / ท่าตรวจปล่อย = หลายค่า ("อื่น" → ข้อความที่ระบุเอง) · ชื่อใบอนุญาต "อื่น" → ข้อความที่ระบุเอง · เบอร์ตู้ SERVICE = คั่น ", " · ADVANCE = รายละเอียด (ข้อความเดิม)
   ยอดเงิน = 1,000.00 · วันที่ = รูปแบบวันที่เดิม · INVOICE NJ / ADV = เลขจริงเท่านั้น (ร่างยังไม่มีเลข = ไม่แสดง) · ไม่มีข้อมูล = ไม่แสดงทั้งหัวข้อและค่า */
var NK653=["customer_name","agency_via","permit_name","container_no","container_size","export_location","release_port","vessel_name","adv_amount","invoice_date","credit_term_days","due_date"];
function FV653(k,b,g,adv){let x=String(b??"").trim(),o=n=>String(g&&g[n]!=null?g[n]:"").trim(),ml=(sep,on)=>x.split(sep).map(y=>y.trim()).filter(Boolean).map(y=>y==="อื่น"&&o(on)?o(on):y).join(", ");
  if(k==="agency_via")return ml(",","agency_via_other");
  if(k==="release_port")return ml("|","release_port_other");
  if(k==="permit_name")return x==="อื่น"&&o("permit_name_other")?o("permit_name_other"):x;
  if(k==="container_no")return adv?x.replace(/\s*[\r\n]+\s*/g,", "):CL652(x).join(", ");
  if(k==="adv_amount"){let n=Number(x.replace(/,/g,""));return x!==""&&Number.isFinite(n)?n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):""}
  if(k==="invoice_date"||k==="due_date")return W(x);
  return x}
/* V.646 · ACCOUNTING — SERVICE / ADVANCE · INVOICE PDF (Preview = Print = Save PDF · แบบฟอร์ม qu630 เท่านั้น)
   1) DESCRIPTION 1 บรรทัดต่อรายการ : รวมบรรทัด (ขึ้นบรรทัดใหม่ → เว้นวรรค) · ไม่ตัดคำ / ไม่ลบข้อความ
      ยาวเกินช่อง = ลดขนาดตัวอักษรเฉพาะช่องนั้น (ไม่ต่ำกว่า 70 %) · ยังเกิน = บีบแนวนอนให้พอดีช่อง (ข้อความครบ)
   2) หัวตาราง QUANTITY → QTY (ค่าเดิม) · คอลัมน์ QTY 19 → 12 มม. (ให้ DESCRIPTION กว้างขึ้น)
   ไม่แก้ข้อมูล / ยอดเงิน / แบบฟอร์มอื่น */
function OL646(v){return v==null?v:String(v).replace(/[\r\n\t\u2028\u2029]+/g," ").replace(/ {2,}/g," ")}
var MF646=.7;
function ST646(){try{if(document.getElementById("st646-css"))return;let st=document.createElement("style");st.id="st646-css";st.textContent=".ivd-tbl.ivd630 col.w-qty630{width:12mm!important}.ivd-tbl.ivd630 td.ivd646{white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important;overflow:visible}.ivd-tbl.ivd630 td.ivd646>.d646{display:inline-block;white-space:nowrap;max-width:none;vertical-align:top;transform-origin:left center}.ivd-ref .ivd-rf label{width:auto!important;min-width:26mm;white-space:nowrap}.ivd-ref .ivd-rf span{flex:1 1 auto;min-width:0}";/* V.656 : ช่องอ้างอิง 4 ตำแหน่ง — ชื่อหัวข้ออยู่บรรทัดเดียว (เช่น Customer Job No. :) · กว้างตามข้อความ อย่างน้อย 26 มม. เท่าเดิม · ค่าอยู่บรรทัดเดียวกับหัวข้อ ไม่ล้นกรอบ */document.head.appendChild(st);let all=()=>{try{FT646(document)}catch(e){}};window.addEventListener("beforeprint",all);document.fonts&&document.fonts.ready.then(all)}catch(e){}}
/* V.656 : ช่องอ้างอิง 4 ตำแหน่ง — คอลัมน์เดียวกัน (บนซ้าย/ล่างซ้าย · บนขวา/ล่างขวา) ใช้ความกว้างหัวข้อเท่ากับหัวข้อที่ยาวที่สุด → ค่าเริ่มตรงแนวเดียวกัน · หัวข้อสั้นทั้งคอลัมน์ = เหมือนเดิม (26 มม.) */
function AL656(r){try{r.querySelectorAll(".ivd-ref").forEach(function(ref){var cs=Array.prototype.filter.call(ref.children,function(x){return x.classList.contains("ivd-rf")});[0,1].forEach(function(col){var ls=cs.filter(function(x,i){return i%2===col}).map(function(x){return x.querySelector(":scope>label")}).filter(Boolean);ls.forEach(function(l){l.style.minWidth=""});var ws=ls.map(function(l){return parseFloat(getComputedStyle(l).width)||0}),m=Math.max.apply(null,[0].concat(ws));ls.forEach(function(l,i){ws[i]<m-.01&&(l.style.minWidth=m+"px")})})})}catch(e){}}
function FT646(r){try{ST646();if(!r||!r.querySelectorAll)return;AL656(r);r.querySelectorAll("td.ivd646>.d646").forEach(function(sp){let td=sp.parentElement;sp.style.fontSize="";sp.style.transform="";let cs=getComputedStyle(td),av=td.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0),w=sp.scrollWidth;if(!(av>0)||!(w>0)||w<=av+.5)return;sp.style.fontSize=Math.max(MF646,av/w*.99).toFixed(4)+"em";w=sp.scrollWidth;w>av+.5&&(sp.style.transform="scaleX("+(av/w*.99).toFixed(4)+")")})}catch(e){try{console.warn("FT646",e)}catch(_){}}}
function QU630(b){let lg=b.qty==null&&b.unit_price==null,qv=lg?1:b.qty,qs=qv===""||qv==null||!Number.isFinite(Number(qv))?"":Number(qv).toLocaleString("en-US",{maximumFractionDigits:4});return`
      <td class="c ivd-qty630">${C(qs)}</td>
      <td class="c ivd-unit630">${C(b.unit==null?"":String(b.unit))}</td>`}function et(t,{draft:n=!1,kind:e="",tpl:i=null,job:c=null,hideDraft:u=!1,fixedRows:d=0,whtPositive:r=!1,pp625:pp625=0,qu630:qu630=!1,mq631:mq631=!1}={}){let m=t.items||[],a=at(t,m),h=String(e).toUpperCase()==="SERVICE",ad653=String(e).toUpperCase()==="ADVANCE",ap657=h&&!!i&&String(i.template_name||"").trim().toUpperCase()==="APL",o=s=>h?String(s).replace(/\s*:\s*$/,"")+" :":s,p=t.customer||{},_=t.job||{},v={cusName:t.customer_name||p.name,cusTax:t.customer_tax_id||p.tax_id,cusBranch:t.customer_branch_code||p.branch_code,cusAddr:t.customer_address||p.address,cusTel:t.customer_phone||p.phone,invNo:n&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||_.job_no,declNo:t.customs_declaration_no||_.customs_declaration_no,cusPo:t.customer_job_no||_.customer_job_no,master:t.master_bl_no||_.master_bl_no,house:t.house_bl_no||_.house_bl_no,remarks:t.remarks||t.job_note||_.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},B=(s,g)=>s.map((b,D)=>{let q=Z(b),z=f(b.amount);return`<tr>
      <td class="c ivd-no">${g+D+1}</td>
      ${qu630?`<td class="ivd-desc ivd646"><span class="d646">${$(OL646(b.description),"")}</span></td>`:`<td class="ivd-desc">${$(b.description,"")}</td>`}${qu630?QU630(b):""}
      <td class="r">${q?"-":P(z)}</td>
      <td class="r">${q?P(z):"-"}</td>
      <td class="r">${P(z)}</td></tr>`}).join(""),M=s=>s<=0?"":Array.from({length:s},()=>'<tr class="ivd-blank" aria-hidden="true"><td class="c ivd-no"></td><td class="ivd-desc"></td>'+(qu630?'<td class="c"></td><td class="c"></td>':"")+'<td class="r"></td><td class="r"></td><td class="r"></td></tr>').join(""),F=tt(m),k=F.map(s=>`<div class="ivd-wl"><span>${s.rate} % ${s.label}</span><span>${E(s.amt)}</span></div>`).join(""),j=F.filter(s=>s.amt>0||r&&s.rate===3).map(s=>`<div class="ivd-sl"><span>WHT ${s.rate} % ${s.label}</span><span>${r?"":"-"}${E(s.amt)}</span></div>`).join(""),R=["eta","etd","release_date","delivery_date","overtime_date","job_date"],V=s=>{if(!s)return"";for(let g of[t,_,c||{}]){if(!g)continue;let b=g[s];if(b!=null&&String(b).trim()!=="")return R.includes(s)?W(b):b}return""},VT653=k=>{if(!k||k==="none")return"";if(k==="invoice_no"){let x=String(v.invNo??"").trim();return/^DRAFT/i.test(x)?"":x}if(!NK653.includes(k))return V(k);for(let g of[c||{},_,t]){if(!g)continue;let b=g[k];if(b==null||String(b).trim()==="")continue;return FV653(k,b,g,ad653)}return""},l=[{label:"Decl No.",value:$(v.declNo)},{label:"Customer PO",value:$(v.cusPo)},{label:"Master",value:$(v.master)},{label:"House",value:$(v.house)}],S=["tl","tr","bl","br"],O=s=>{let b=(i&&i.fields||[]).find(D=>D&&D.key===s);return b?String(ad653&&b.label_adv||b.label||"").trim():""},N=i&&S.every(s=>i[s+"_source"])?S.map((s,g)=>{let x653=VT653(i[s+"_source"]);return{label:O(i[s+"_source"])||String(i[s+"_label"]||"").trim()||l[g].label,value:$(x653),e653:String(x653??"").trim()===""&&!SK662(i,s)}}):l,x=(s,g)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${s}</div>
      ${g?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${g.who}</div>
        <div class="ivd-sign-dt">${g.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${g?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,T=pp625>0?pp625:15,H=[...m].sort((s,g)=>(Z(s)?1:0)-(Z(g)?1:0)||f(s.line_no)-f(g.line_no)),A=[];for(let s=0;s<H.length;s+=T)A.push(H.slice(s,s+T));return A.length||A.push([]),A.map((s,g)=>{let b=g===A.length-1,D=Math.max(0,Math.min(f(d),T)-s.length),q=B(s,g*T)+M(D)||'<tr><td colspan="'+(qu630?7:5)+'" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>';return`
    <div class="ivd print-area${n?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${L.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${C(L.nameEn)}</div>
            <div class="ivd-co-ad">${C(L.address)}</div>
            <div class="ivd-co-tl">Tel. ${C(L.tel)} <i>|</i> Fax. ${C(L.fax)}
              <i>|</i> Tax ID ${C(L.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r">
          ${n&&!u?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${I("user")}<div class="ivd-fb"><label>${o("Customer Name")}</label>
              <div class="v">${$(v.cusName)}</div></div></div>
            <div class="ivd-f">${I("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${o("Tax ID")}</label><div class="v">${$(v.cusTax)}</div></div>
              <div><label>${o("Branch")}</label><div class="v">${$(v.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${I("pin")}<div class="ivd-fb"><label>${o("Address")}</label>
              <div class="v">${$(v.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${I("doc")}<div class="ivd-fb ivd-kv">
              <label>${o("Invoice No.")}</label><div class="v v-lg">${v.invNo?C(v.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${I("cal")}<div class="ivd-fb ivd-kv">
              <label>${o("Date")}</label><div class="v v-lg">${W(v.invDate)}</div></div></div>
            <div class="ivd-f${mq631?"":" ivd-f-last"}">${I("job")}<div class="ivd-fb ivd-kv">
              <label>${o("Job No.")}</label><div class="v v-lg">${$(v.jobNo)}</div></div></div>${mq631?`
            <div class="ivd-f ivd-f-last ivd-mode631">${I("list")}<div class="ivd-fb ivd-kv">
              <label>${o("MODE")}</label><div class="v v-lg">${C(String(V("data_type")??"").trim())}</div></div></div>`:""}
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${N.map(z=>z.e653?`<div class="ivd-rf ivd-rf653" aria-hidden="true"></div>`:`<div class="ivd-rf"><label>${o(z.label)}</label><span>${z.value}</span></div>`).join("")}
      </section>

      ${qu630?`<table class="ivd-tbl ivd630">
        <colgroup><col class="w-no"><col class="w-desc"><col class="w-qty630"><col class="w-unit630"><col class="w-srv">
          <col class="w-adv"><col class="w-tot"></colgroup>
        <thead><tr>
          <th class="c">NO.</th>
          <th>DESCRIPTION</th>
          <th class="c">QTY</th>
          <th class="c">UNIT</th>
          <th class="r">SERVICE</th>
          <th class="r">ADVANCE</th>
          <th class="r">TOTAL AMOUNT</th>
        </tr></thead>`:`<table class="ivd-tbl">
        
        <colgroup><col class="w-no"><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-tot"></colgroup>
        <thead><tr>
          
          <th class="c">No.</th>
          <th>Description</th>
          <th class="r">Service</th>
          <th class="r">Advance</th>
          <th class="r">Total Amount</th>
        </tr></thead>`}
        <tbody>${q}</tbody>
        
        <tfoot>${b?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="${qu630?4:2}"><span class="ivd-trow-in">${I("sum")}<b>TOTAL</b></span></td>
          <td class="r">${P(a.svcCol)}</td>
          <td class="r">${P(a.advCol)}</td>
          <td class="r ivd-trow-g">${E(y(a.svcCol+a.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${b?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          ${(rl=>rl.length?`<div class="ivd-rm-t">REMARKS :</div>${rl.map(x=>`
          <div class="ivd-rm-t ivd-qty631"><span>${C(x)}</span></div>`).join("")}${$(v.remarks,"")?`
          <div class="ivd-rm-t"><span>${$(v.remarks,"")}</span></div>`:""}`:`<div class="ivd-rm-t">REMARKS : <span>${$(v.remarks,"")}</span></div>`)(mq631?RM652(V,ad653).concat(ap657?AP657(V):[]):[])}
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> <span class="ivd-ci-v669">${$(v.companyInvoice,"")}</span></div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${a.vatRate} %</span><span>${E(a.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${a.vatRate} %</span><span>${E(a.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${E(a.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${E(a.advCol)}</span></div>
          
          ${j}
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${E(a.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${k}</div>
        ${x("For The Customer")}
        ${x("For The "+C(L.nameEn),{who:$(v.createdBy),when:W(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${b?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var G="nj-print-doc",lt=/[\\/:*?"<>|\u0000-\u001f]/g,U=t=>String(t??"").replace(lt," ").replace(/\s+/g," ").trim(),J=t=>String(t||"").replace(/[.\s]+$/,"");function st(t,{accFilename:n=!1}={}){let e=t||{};if(!n){let m=U(e.job_no||e.job&&e.job.job_no||""),a=U(e.company_invoice||"");return[m,a].filter(Boolean).join(" - ")||"INVOICE"}let i=String(e.invoice_no||"").trim(),c=i&&!/^DRAFT-/i.test(i)?i:"",u=U(c||e.job_no||e.job&&e.job.job_no||""),d=J(U(e.company_invoice||""));return J([u,d].filter(Boolean).join(" - "))||"INVOICE"}var ct=96/25.4,dt=297*ct;function it(t){FT646(t);if(t)for(let n of t.querySelectorAll(".ivd")){let e=[...n.querySelectorAll(".ivd-tbl tbody tr.ivd-blank")];if(e.length)for(let i=e.length-1;i>=0&&!(n.scrollHeight<=dt+.5);i--)e[i].remove()}}function K(t){let n=document.body;n.classList.add(G);let e=document.title;t&&(document.title=t);let i=()=>{n.classList.remove(G),t&&(document.title=e)};window.addEventListener("afterprint",i,{once:!0});try{let c=window.matchMedia("print"),u=d=>{d.matches||(i(),c.removeEventListener("change",u))};c.addEventListener("change",u)}catch{}window.print()}var Y=24,rt=.5,vt=1.5,Q=.1;function nt(t,n){let e=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),c=t.querySelector(".ivd");if(!e||!i||!c)return()=>{};let u=()=>i.scrollHeight||c.offsetHeight||0,d="fit",r=1,m=null,a=1,w=.05,h=l=>Number.isFinite(l)&&l>0,o=()=>{let l=e.parentElement||e,S=e.style.width,O=e.style.height;e.style.width="",e.style.height="";let N=(l.clientWidth||0)-Y,x=(l.clientHeight||0)-Y;e.style.width=S,e.style.height=O;let T=c.offsetWidth||0,H=u();if(!h(T)||!h(H)||N<40)return a;let A=e.closest(".iv587")?Math.max(.3,Math.min(1.5,N/T)):x>0?Math.min(N/T,x/H,1):Math.min(N/T,1);return h(A)&&(a=Math.max(w,A)),a},p=!1,_=null,v=()=>{if(p)return;let l=d==="fit"?o():r;h(l)||(l=_||1),l=Math.max(w,l),!(_!==null&&Math.abs(l-_)<.002)&&(_=l,i.style.transform="scale("+l+")",e.style.width=Math.ceil((c.offsetWidth||0)*l)+"px",e.style.height=Math.ceil(u()*l)+"px",e.dataset.scale=String(Math.round(l*1e3)/1e3),m&&(m.textContent=Math.round(l*100)+"%"))};if(n){let l=n.querySelector(".mf-left")||n,S=document.createElement("div");S.className="ivd-zoom",S.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',l.appendChild(S),m=S.querySelector("#ivd-zoom-v"),S.addEventListener("click",O=>{let N=O.target.closest("[data-z]");if(!N)return;let x=N.dataset.z;if(x==="fit")d="fit";else{let T=d==="fit"?o():r;x==="100"?r=1:r=e.closest(".iv587")?Math.min(3,Math.max(.3,Math.round((T+(x==="in"?Q:-Q))*10)/10)):Math.min(vt,Math.max(rt,Math.round((T+(x==="in"?Q:-Q))*100)/100)),d="zoom"}_=null,v()})}let B=l=>typeof requestAnimationFrame=="function"?requestAnimationFrame(l):setTimeout(l,16);v(),B(()=>B(()=>{_=null,v()}));let M=0,F=()=>{d!=="fit"||p||(M&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(M):clearTimeout(M)),M=B(()=>{M=0,v()}))},k=F,j=null;try{j=new ResizeObserver(k),j.observe(e.parentElement||e)}catch{window.addEventListener("resize",k)}window.addEventListener("orientationchange",k);let R=()=>{p=!0},V=()=>{p=!1,_=null,F(),d!=="fit"&&v()};return window.addEventListener("beforeprint",R),window.addEventListener("afterprint",V),()=>{try{j&&j.disconnect()}catch{}if(M){try{cancelAnimationFrame(M)}catch{clearTimeout(M)}M=0}window.removeEventListener("resize",k),window.removeEventListener("orientationchange",k),window.removeEventListener("beforeprint",R),window.removeEventListener("afterprint",V)}}function bt(t,{draft:n=!1,print:e=!1,kind:i="",tpl:c=null,job:u=null,hideDraft:d=!1,fixedRows:r=0,accFilename:m=!1,whtPositive:a=!1}={}){let w=document.createElement("div");w.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+et(t,{draft:n,kind:i,tpl:c,job:u,hideDraft:d,fixedRows:r,whtPositive:a,pp625:999,qu630:!0,mq631:!0})+"</div></div>";let h=document.createElement("div");h.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${n?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,X({title:n?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:w,footer:h,fullscreen:!0,wide:!0}).classList.add("ivd625"),it(w);let cl625=FP625(w,h,[()=>et(t,{draft:n,kind:i,tpl:c,job:u,hideDraft:d,fixedRows:r,whtPositive:a,qu630:!0,mq631:!0})]);let o=nt(w,h);h.querySelector("[data-close]").addEventListener("click",o,{once:!0});h.querySelector("[data-close]").addEventListener("click",()=>{cl625&&cl625()},{once:!0});let p=st(t,{accFilename:m});h.querySelector("#ivd-print").onclick=()=>K(p),e&&setTimeout(()=>K(p),60)}function pt(t,{kind:n="",tpl:e=null,print:i=!1,whtPositive:c=!1,hideDraft:u=!1,fixedRows:d=0}={}){let r=(t||[]).filter(Boolean);if(!r.length)return;let m=document.createElement("div");m.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+r.map(o=>et(o,{draft:!1,kind:n,tpl:e,job:o&&o.job||null,whtPositive:c,hideDraft:u,fixedRows:d,pp625:999,qu630:!0,mq631:!0})).join("")+"</div></div>";let a=document.createElement("div");a.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${r.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,X({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+r.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:m,footer:a,fullscreen:!0,wide:!0}).classList.add("ivd625"),it(m);let cl625=FP625(m,a,r.map(o=>()=>et(o,{draft:!1,kind:n,tpl:e,job:o&&o.job||null,whtPositive:c,hideDraft:u,fixedRows:d,qu630:!0,mq631:!0})));let w=nt(m,a);a.querySelector("[data-close]").addEventListener("click",w,{once:!0});a.querySelector("[data-close]").addEventListener("click",()=>{cl625&&cl625()},{once:!0});let h=r.length===1?st(r[0]):"INVOICE "+r.length+" \u0E09\u0E1A\u0E31\u0E1A";a.querySelector("#ivd-print").onclick=()=>K(h),i&&setTimeout(()=>K(h),60)}
/* V.625 : ACCOUNTING — SERVICE / ADVANCE · INVOICE Preview / Print / Save PDF = A4 แนวตั้ง 1 หน้า (เฉพาะ openInvoiceDoc / openInvoiceDocMulti)
   1) ทั้งใบอยู่ในหน้าเดียว (ไม่แบ่ง 15 รายการ/หน้า) → วัดความสูงจริง → ไม่พอดี = ตัดแถวว่าง (it เดิม) → ย่อ (zoom เนื้อหา) ไม่ต่ำกว่า 80 %
   2) ย่อแล้วยังเกินหน้า (อ่านไม่ชัด) = กลับไปแบ่งหน้าแบบเดิม (15 รายการ/หน้า) + แจ้งเตือน · ไม่ตัดข้อมูล
   3) ตอนพิมพ์ : ตัดกรอบ/เงาจอที่หลุดไปในงานพิมพ์ · ความสูง = 1 หน้า A4 · แถบท้ายไม่แยกไปหน้าใหม่
   ข้อมูล / สูตร / เลขเอกสาร / Template เดิมไม่เปลี่ยน */
var A625=297*96/25.4-2,MZ625=.8;
function H625(iv){let st=iv.style,a=st.getPropertyValue("min-height"),ap=st.getPropertyPriority("min-height"),b=st.getPropertyValue("height"),bp=st.getPropertyPriority("height");st.setProperty("min-height","0","important");st.setProperty("height","auto","important");let h=iv.scrollHeight;a?st.setProperty("min-height",a,ap):st.removeProperty("min-height");b?st.setProperty("height",b,bp):st.removeProperty("height");return h}
function Z625(iv,z){iv.style.setProperty("--z625",String(z));iv.classList.toggle("ivd625-z",z<1)}
function FZ625(iv){Z625(iv,1);FT646(iv);if(H625(iv)<=A625){iv.dataset.f625="1";return!0}let lo=MZ625,hi=1;Z625(iv,lo);if(H625(iv)>A625){Z625(iv,1);iv.dataset.f625="0";return!1}for(let k=0;k<8;k++){let md=(lo+hi)/2;Z625(iv,md);H625(iv)<=A625?lo=md:hi=md}Z625(iv,Math.floor(lo*1e3)/1e3);FT646(iv);iv.dataset.f625="1";return!0}
function FP625(w,ft,rs){try{let fi=w.querySelector(".ivd-fit-in");if(!fi)return null;let ivs=[...fi.querySelectorAll(":scope>.ivd")],warn=[];
  if(ivs.length===rs.length)ivs.forEach((iv,k)=>{if(FZ625(iv))return;let tp=document.createElement("div");tp.innerHTML=rs[k]();let nw=[...tp.querySelectorAll(":scope>.ivd")];if(!nw.length)return;nw.forEach(x=>fi.insertBefore(x,iv));iv.remove();it(w);let pg=0;nw.forEach(x=>{pg+=FZ625(x)?1:Math.max(1,Math.ceil(H625(x)/A625))});let no=(nw[0].querySelector(".ivd-cards .v-lg")||{}).textContent||"";warn.push({no:String(no).trim(),n:pg})});
  else ivs.forEach(FZ625);
  if(warn.length){let host=ft&&(ft.querySelector(".mf-left")||ft);if(host){let d=document.createElement("div");d.className="ivd625-warn";d.setAttribute("role","status");d.textContent="⚠ "+warn.map(x=>"INVOICE "+(x.no||"")+" มีรายการมาก ย่อให้อยู่หน้าเดียวแล้วอ่านไม่ชัด — พิมพ์ "+x.n+" หน้า (ข้อมูลครบ ไม่ตัด)").join(" · ");host.insertBefore(d,host.firstChild)}}
  let rf=()=>{try{fi.isConnected&&fi.querySelectorAll(":scope>.ivd").forEach(x=>{x.dataset.f625!=="0"&&FZ625(x)})}catch{}};
  window.addEventListener("beforeprint",rf);
  try{document.fonts&&document.fonts.ready.then(()=>{if(fi.isConnected){rf();try{window.dispatchEvent(new Event("resize"))}catch{}}})}catch{}
  return()=>window.removeEventListener("beforeprint",rf)}catch(e){try{console.warn("FP625",e)}catch{}return null}}
export{Z as a,et as b,st as c,it as d,bt as e,pt as f};

/* \u2550\u2550\u2550 V.662 INVOICE PDF \u00B7 \u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 APL : \u0E0A\u0E48\u0E2D\u0E07\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E44\u0E27\u0E49 (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48 "\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25") \u0E41\u0E2A\u0E14\u0E07\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E40\u0E2A\u0E21\u0E2D \u00B7 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E48\u0E32\u0E07 = "-" \u00B7 \u0E04\u0E23\u0E1A 4 \u0E0A\u0E48\u0E2D\u0E07 (2 \u00D7 2) \u00B7 \u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E2D\u0E37\u0E48\u0E19 / Default \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u2550\u2550\u2550 */
function SK662(i, s) {
  if (!i || String(i.template_name || "").trim().toUpperCase() !== "APL") return false;
  let k = String(i[s + "_source"] || "").trim();
  return !!k && k !== "none";
}
