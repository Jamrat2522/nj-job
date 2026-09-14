import{a as W}from"./chunk-3I4NJAXT.js";import{a as Z}from"./chunk-AGHJVI2A.js";import{a as J,b as R,c as B}from"./chunk-OPGKUGLK.js";import{a as V}from"./chunk-GDT6F23K.js";import{a as K}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-F5ETAYOF.js";import{a as z}from"./chunk-DIH2PLYD.js";import{a as G,e}from"./chunk-PCFU74ZV.js";var N={issuerName:"N.J.LOGISTICS & FRUITS CO.,LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`,issuerNameMae:"N.J. LOGISTICS & FRUITS CO.,LTD"},st=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"}],dt=[{k:"APL",t:"APL"}],nt=100,M=t=>{let a=String(t||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(a)?a.slice(8,10)+"/"+a.slice(5,7)+"/"+a.slice(0,4):""},k=t=>t==null||t===""?"":G(Number(t)||0),at=(t,a)=>t.reduce((c,i)=>c+(Number(i[a])||0),0),o=t=>t==null?"":String(t);function F(t,a){let c=t.map((s,p)=>`<tr>
    <td class="c">${p+1}</td>
    <td class="c">${e(o(s.invoice_no))}</td>
    <td class="c">${e(o(s.master_bl_no))}</td>
    <td>${e(o(s.house_bl_no))}</td>
    <td class="c">${e(o(s.data_type))}</td>
    <td>${e(o(s.customer_name))}</td>
    <td class="c">${e(o(s.customs_declaration_no))}</td>
    <td class="c">${e(o(s.customer_job_no))}</td>
    <td class="r">${k(s.gross_total)}</td>
    <td class="r">${k(s.net_payable)}</td></tr>`).join(""),i=[...new Set(t.map(s=>o(s.company_invoice)).filter(Boolean))].join("  /  ");return`<div class="bpd bpd-gen print-area">
    <div class="bpd-gen-hd">
      <div class="bpd-gen-l">\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${e(a.contact)} Tel: ${e(a.tel)}</div>
      <div class="bpd-gen-c">\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</div>
      <div class="bpd-gen-r">Page 1 / 1</div>
    </div>
    <div class="bpd-gen-hd">
      <div class="bpd-gen-l">\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 : ${e(a.dept)}</div>
      <div class="bpd-gen-c"></div>
      <div class="bpd-gen-r bpd-gen-date">Date: ${e(a.today)}</div>
    </div>
    <table class="bpd-tb bpd-tb-gen"><colgroup>
      <col style="width:4.4%"><col style="width:8.9%"><col style="width:9.9%">
      <col style="width:8.4%"><col style="width:4.4%"><col style="width:27.6%">
      <col style="width:11.8%"><col style="width:10.8%"><col style="width:6.7%">
      <col style="width:7.1%"></colgroup>
    <thead><tr>
      <th>\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th><th>Master</th><th>House</th>
      <th>Type</th><th>Exporter</th><th>dcl inv.</th>
      <th>cust. Po no</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E38\u0E17\u0E18\u0E34</th>
    </tr></thead><tbody>${c}</tbody></table>
    <div class="bpd-gen-ft">
      <div class="bpd-gen-cust">${e(i)}</div>
      <div class="bpd-gen-sign">
        <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48................................................</div>
        <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A......................................</div>
      </div>
    </div></div>`}function Q(t,a){let c=t.map(i=>`<tr>
    <td>${e(o(i.customer_name))}</td>
    <td class="c"></td>
    
    <td class="c">${e(o(i.booking_no))}</td>
    <td class="c">${e(o(i.invoice_no))}</td>
    <td class="c">${M(i.invoice_date)}</td>
    <td class="c">${e(a.submitDate)}</td>
    <td class="c"></td></tr>`).join("");return`<div class="bpd bpd-mae print-area">
    <div class="bpd-mae-hd">
      <div class="bpd-mae-t">BILLING INSTRUCTION</div>
      <div class="bpd-mae-back">\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</div>
    </div>
    <table class="bpd-tb bpd-tb-mae"><colgroup>
      <col style="width:32%"><col style="width:11%"><col style="width:13.5%">
      <col style="width:10%"><col style="width:9%"><col style="width:12%">
      <col style="width:12%"></colgroup>
      <tbody>
        <tr class="bpd-mae-vd">
          <th class="bpd-y">Vendor Name</th>
          <td class="c t-b" colspan="4">${e(N.issuerNameMae)}</td>
          <th class="bpd-y bpd-mae-sub">Date of Submit<br>Original Document</th>
          <td class="c t-b">${e(a.submitDate)}</td>
        </tr>
        <tr>
          <th class="bpd-y">Customer Name</th><th class="bpd-y">Kewill No.</th>
          <th class="bpd-y">Booking No./BL No.</th><th class="bpd-y">Invoice No</th>
          <th class="bpd-y">Invoice Date</th><th class="bpd-y">Scan Date</th>
          <th class="bpd-y">Job Owner Code</th>
        </tr>
        ${c}
      </tbody></table>
    <div class="bpd-mae-ft">
      <div class="bpd-mae-co">Maersk Logistics &amp; Services (Thailand) Co., Ltd.</div>
      <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48............................................</div>
      <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A................................</div>
    </div></div>`}function tt(t,a){let c=t.map((s,p)=>`<tr>
    <td class="c">${M(s.date)}</td>
    <td class="c">${p+1}</td>
    <td class="c">${e(o(s.invoice_no))}</td>
    <td class="c">${e(o(s.master_bl_no))}</td>
    <td class="c">${e(o(s.house_bl_no))}</td>
    <td class="c">${e(o(s.data_type))}</td>
    <td class="c">${e(o(s.company_invoice))}</td>
    <td class="c">${e(o(s.customs_declaration_no))}</td>
    <td class="c">${e(o(s.customer_job_no))}</td>
    <td class="r">${k(s.service_amount)}</td>
    <td class="r">${k(s.advance_amount)}</td>
    <td class="r">${k(s.vat_amount)}</td>
    <td class="r">${k(s.subtotal)}</td>
    <td class="r">${k(s.wht_amount)}</td>
    <td class="r">${k(s.net_payable)}</td></tr>`).join(""),i=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(s=>`<td class="r t-b">${k(at(t,s))}</td>`).join("");return`<div class="bpd bpd-apl print-area">
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${e(N.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${e(N.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span class="t-b">${e(N.issuerTel)}</span></div>
      <div class="bpd-apl-bt">Bill To.</div>
      <div class="bpd-kv"><span>Text ID no.</span><span class="t-b">${e(N.textIdNo)}</span></div>
      <div class="bpd-kv"><span>Tax invoice issued under : ${e(N.issuedUnder)}</span><span></span></div>
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${e(N.billToName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${e(N.billToAddr).replace(/\n/g,"<br>")}</span></div>
    </div>
    <div class="bpd-apl-note">
      <div>Billing Note  no. ${e(a.noteNo)}</div>
      <div>Create date.${e(a.aplDate)}</div>
    </div>
    <table class="bpd-tb bpd-tb-xs bpd-tb-apl"><colgroup>
      <col style="width:5.3%"><col style="width:2.5%"><col style="width:8.8%">
      <col style="width:10.4%"><col style="width:8.3%"><col style="width:3.9%">
      <col style="width:7.2%"><col style="width:8.8%"><col style="width:12.3%">
      <col style="width:6.8%"><col style="width:5.4%"><col style="width:4.8%">
      <col style="width:5.4%"><col style="width:4.1%"><col style="width:6%"></colgroup>
    <thead><tr>
      <th class="bpd-y">Date</th><th class="bpd-y">Item</th><th class="bpd-y">Invoice No.</th>
      <th class="bpd-y">Master</th><th class="bpd-y">House B/l No.</th>
      <th class="bpd-y">Data Type</th><th class="bpd-y">Company Invoice</th>
      <th class="bpd-y">DCL INV.</th><th class="bpd-y">Customer Job No.</th>
      <th class="bpd-y">Service charge</th><th class="bpd-y">Advance</th>
      <th class="bpd-y">VAT 7%</th><th class="bpd-y">Amount</th>
      <th class="bpd-y">WHT 3%</th><th class="bpd-y">Total Amout</th>
    </tr></thead><tbody>${c}
      <tr><td colspan="9"></td>${i}</tr></tbody></table>
    <div class="bpd-apl-ft">
      <div class="bpd-sbox bpd-sbox-l">
        <div>VENDOE ID: &nbsp; ${e(a.vendorId)}</div>
        <div>PO. : ${e(a.po)}............................................................</div>
        <div>A/C : ${e(a.ac)}.............................C/C${e(a.cc)}.............................</div>
        <div>APPROVED BY :............................DATE ........./............./.........</div>
      </div>
      
      <div class="bpd-sbox">
        <div>Receive By &nbsp;................................................................</div>
        <div class="bpd-sp"></div>
        <div>Date &nbsp;.........................................................................</div>
        <div class="t-b">Authorized Signature</div>
      </div>
      <div class="bpd-sbox">
        <div>Receive By &nbsp;................................................</div>
        <div class="bpd-sp"></div>
        <div>Date &nbsp;.................................................................</div>
        <div class="t-b">Authorized Signature</div>
      </div>
    </div></div>`}var lt={general:F,maersk:Q},X="nj-print-doc",j="nj-bpd-page";function ct(){if(document.getElementById(j))return;let t=document.createElement("style");t.id=j,t.textContent="@page{size:A4 landscape;margin:0}",document.head.appendChild(t)}function it(){let t=document.getElementById(j);t&&t.parentNode&&t.parentNode.removeChild(t)}function ot(){let t=document.body;t.classList.add(X),ct();let a=()=>{t.classList.remove(X),it()};window.addEventListener("afterprint",a,{once:!0});try{let c=window.matchMedia("print"),i=s=>{s.matches||(a(),c.removeEventListener("change",i))};c.addEventListener("change",i)}catch{}window.print()}var pt=.5,bt=1.5,Y=.1;function rt(t,a){let c=t&&t.querySelector(".bpd-fit-in"),i=c&&c.firstElementChild;if(!i)return()=>{};let s="fit",p=1,b=null,I=()=>{c.style.transform="none",t.style.width="",t.style.height="";let r=i.offsetWidth,m=i.offsetHeight;if(!r||!m)return 1;let f=t.parentElement,E=t.clientWidth||(f?f.clientWidth:0)||r,n=(f?f.clientHeight:0)||m;return Math.min(E/r,n/m,1)},h=()=>{let r=s==="fit"?I():p,m=i.offsetWidth,f=i.offsetHeight;c.style.transform="scale("+r+")",t.style.width=Math.round(m*r)+"px",t.style.height=Math.round(f*r)+"px",t.style.margin="0 auto",b&&(b.textContent=Math.round(r*100)+"%")};if(a){let r=a.querySelector(".mf-left")||a,m=document.createElement("div");m.className="bpd-zoom",m.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="bpd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',r.appendChild(m),b=m.querySelector(".bpd-zoom-v"),m.addEventListener("click",f=>{let E=f.target.closest("[data-z]");if(!E)return;let n=E.dataset.z;if(n==="fit")s="fit";else{let P=s==="fit"?I():p;n==="100"?p=1:p=Math.min(bt,Math.max(pt,Math.round((P+(n==="in"?Y:-Y))*100)/100)),s="zoom"}h()})}h();let q=r=>typeof requestAnimationFrame=="function"?requestAnimationFrame(r):setTimeout(r,16);q(()=>q(h));let L=()=>{s==="fit"&&h()};window.addEventListener("resize",L),window.addEventListener("orientationchange",L);let S=null;try{S=new ResizeObserver(L),S.observe(t.parentElement||t)}catch{}return()=>{try{S&&S.disconnect()}catch{}window.removeEventListener("resize",L),window.removeEventListener("orientationchange",L)}}function ut(t,a){let c=document.createElement("div");c.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+t+"</div></div>";let i=document.createElement("div");i.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,z({title:a,body:c,footer:i,fullscreen:!0,wide:!0}),i.querySelector("#bpd-print").onclick=()=>ot();let s=c.querySelector(".bpd-fit"),p=rt(s,i),b=i.querySelector("[data-close]");b&&b.addEventListener("click",p,{once:!0})}function kt(t,a){let c=a==="apl",i=c?dt:st,s=M(new Date().toISOString().slice(0,10)),p=[],b=new Map,I=!c,h=new Map,q="",L=!1,S=()=>I?V.masters?.customers||[]:[],r=50,m=()=>Z(S(),q),f=document.createElement("div");f.innerHTML=`
    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</div>
      <div class="bpd-tpl" id="bpd-tpl">
        ${i.map((d,l)=>`<label class="bpd-radio">
          <input type="radio" name="bpd-tpl" value="${d.k}"${l===0?" checked":""}>
          <span>${e(d.t)}</span></label>`).join("")}
      </div>
    </div>

    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19</div>
      <div class="bpd-find">
        <input class="inp" id="bpd-q" autocomplete="off"
          placeholder="\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Invoice / House B/L">
        <label class="bpd-dt">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 <input class="inp" type="date" id="bpd-from"></label>
        <label class="bpd-dt">\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 <input class="inp" type="date" id="bpd-to"></label>
        <button class="btn btn-o btn-sm" id="bpd-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      </div>
      ${I?`<div class="bpd-cust" id="bpd-cust">
        <label class="bpd-cust-lb" for="bpd-cq">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
        <div class="bpd-cust-box">
          <input class="inp" id="bpd-cq" autocomplete="off" role="combobox"
            aria-expanded="false" aria-controls="bpd-cust-pop"
            placeholder="\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32 CODE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
          <button type="button" class="bpd-cust-caret" id="bpd-cust-toggle"
            aria-label="\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">\u25BC</button>
          <div class="bpd-cust-pop" id="bpd-cust-pop" hidden></div>
        </div>
        <span class="bpd-cust-cnt" id="bpd-cust-cnt"></span>
        <button class="btn btn-o btn-sm" id="bpd-cust-clear" hidden>\u0E25\u0E49\u0E32\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
      </div>`:""}
      <div class="bpd-bar">
        <label class="bpd-radio"><input type="checkbox" id="bpd-all">
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</span></label>
        <button class="btn btn-o btn-sm" id="bpd-clear">\u0E25\u0E49\u0E32\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
        <span class="bpd-cnt" id="bpd-cnt">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 0 \u0E07\u0E32\u0E19</span>
      </div>
      <div class="tbl-wrap bpd-list"><table class="tbl"><tbody id="bpd-tb">
        <tr><td class="center t-3">\u0E01\u0E14 \u201C\u0E04\u0E49\u0E19\u0E2B\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>
      </tbody></table></div>
    </div>

    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C</div>
      <div class="fgrid">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D <span class="req">*</span></label>
          <input class="inp" id="bpd-contact" autocomplete="off"></div>
        <div class="fld"><label>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 <span class="req">*</span></label>
          <input class="inp" id="bpd-tel" autocomplete="off"></div>
        <div class="fld"><label>\u0E41\u0E1C\u0E19\u0E01 / \u0E0A\u0E31\u0E49\u0E19 <span class="req">*</span></label>
          <input class="inp" id="bpd-dept" autocomplete="off"></div>
        
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 (Date of Submit / Scan Date)</label>
          <input class="inp" type="date" id="bpd-submit"></div>
      </div>
      ${c?`<div class="fgrid mt-2">
        <div class="fld"><label>Billing Note no. <span class="req">*</span></label>
          <input class="inp" id="bpd-note" autocomplete="off"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 <span class="req">*</span></label>
          <input class="inp" type="date" id="bpd-date"></div>
        <div class="fld"><label>VENDOR ID</label><input class="inp" id="bpd-vendor" autocomplete="off"></div>
        <div class="fld"><label>PO</label><input class="inp" id="bpd-po" autocomplete="off"></div>
        <div class="fld"><label>A/C</label><input class="inp" id="bpd-ac" autocomplete="off"></div>
        <div class="fld"><label>C/C</label><input class="inp" id="bpd-cc" autocomplete="off"></div>
      </div>`:""}
    </div>
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let E=document.createElement("div");E.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,z({title:c?"Billing PDF APL":"Billing PDF",body:f,footer:E,large:!0});let n=d=>f.querySelector(d),P=n("#bpd-msg"),O=n("#bpd-tb"),et=n("#bpd-cnt"),x=d=>{P.hidden=!d,P.textContent=d||""},U=()=>{et.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+b.size+" \u0E07\u0E32\u0E19";let d=p.map(l=>l.id);n("#bpd-all").checked=d.length>0&&d.every(l=>b.has(l))},H=()=>{O.innerHTML=p.length?p.map(d=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${e(d.id)}"${b.has(d.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${e(o(d.job_no)||"-")}</td>
          <td class="ellip">${e(o(d.customer_name)||"-")}</td>
          <td style="width:130px">${e(o(d.invoice_no)||"-")}</td>
          <td style="width:150px">${e(o(d.house_bl_no)||"-")}</td>
          <td style="width:90px" class="center">${M(d.date)||"-"}</td>
        </tr>`).join(""):'<tr><td class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',U()};async function T(){let d=J("bpd");O.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let l=await W({charge:t.charge,group:t.group,filters:{q:n("#bpd-q").value.trim()||null,from:n("#bpd-from").value||null,to:n("#bpd-to").value||null,customer_ids:[...h.keys()]},page:1,size:nt,withKpi:!1,queue:t.queue,scope:t.scope});if(!R("bpd",d))return;p=l&&l.rows||[],H();let w=Number(l&&l.total||0);x(w>p.length?"\u0E1E\u0E1A "+w+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+p.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(l){if(!R("bpd",d))return;O.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',K(l,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}if(I){let d=n("#bpd-cq"),l=n("#bpd-cust-pop"),w=n("#bpd-cust-cnt"),D=n("#bpd-cust-clear"),y=()=>{let u=h.size;if(w.textContent=u?"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+u+" \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32":"",D.hidden=!u,!L)return;let g=m(),v=g.slice(0,r),_=g.length>0&&g.every($=>h.has($.id));l.innerHTML=`<label class="bpd-cust-row bpd-cust-head">
          <input type="checkbox" id="bpd-cust-all"${_?" checked":""}>
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14${g.length?" ("+g.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":""}</span></label>`+(g.length>v.length?`<div class="bpd-cust-more">\u0E41\u0E2A\u0E14\u0E07 ${v.length} \u0E08\u0E32\u0E01 ${g.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u201C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u201D \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E31\u0E49\u0E07 ${g.length} \u0E23\u0E32\u0E22</div>`:"")+(v.length?v.map($=>`<label class="bpd-cust-row">
              <input type="checkbox" data-cid="${e($.id)}"${h.has($.id)?" checked":""}>
              <span class="bpd-cust-code">${e($.code||"-")}</span>
              <span class="bpd-cust-nm" title="${e($.name||"")}">${e($.name||"-")}</span>
            </label>`).join(""):'<div class="bpd-cust-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19</div>')},C=()=>{L=!0,l.hidden=!1,d.setAttribute("aria-expanded","true"),y()},A=()=>{L=!1,l.hidden=!0,d.setAttribute("aria-expanded","false")};d.addEventListener("focus",C),d.addEventListener("input",()=>{q=d.value,C()}),d.addEventListener("keydown",u=>{u.key==="Escape"&&(u.preventDefault(),A()),u.key==="Enter"&&u.preventDefault()}),n("#bpd-cust-toggle").onclick=()=>{L?A():(d.focus(),C())},l.addEventListener("change",u=>{let g=u.target.closest("#bpd-cust-all");if(g){m().forEach($=>{g.checked?h.set($.id,$):h.delete($.id)}),y(),B("bpd-cust",T,250);return}let v=u.target.closest("[data-cid]");if(!v)return;let _=S().find($=>$.id===v.dataset.cid);_&&(v.checked?h.set(_.id,_):h.delete(_.id),y(),B("bpd-cust",T,250))}),l.addEventListener("mousedown",u=>u.preventDefault()),D.onclick=()=>{h.clear(),y(),T()},f.addEventListener("click",u=>{L&&(u.target.closest("#bpd-cust")||A())}),y()}n("#bpd-go").onclick=T,n("#bpd-q").onkeydown=d=>{d.key==="Enter"&&(d.preventDefault(),T())},n("#bpd-q").addEventListener("input",()=>B("bpd-q",T,300)),n("#bpd-from").onchange=T,n("#bpd-to").onchange=T,O.addEventListener("change",d=>{let l=d.target.closest("[data-bid]");if(!l)return;let w=p.find(D=>D.id===l.dataset.bid);w&&(l.checked?b.set(w.id,w):b.delete(w.id),U())}),n("#bpd-all").onchange=d=>{p.forEach(l=>{d.target.checked?b.set(l.id,l):b.delete(l.id)}),H()},n("#bpd-clear").onclick=()=>{b.clear(),H()},E.querySelector("#bpd-prev").onclick=()=>{if(!b.size){x("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let d=n("#bpd-contact").value.trim(),l=n("#bpd-tel").value.trim(),w=n("#bpd-dept").value.trim();if(!d||!l||!w){x("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let D=n("#bpd-submit").value,y={contact:d,tel:l,dept:w,today:s,submitDate:D?M(D):s};if(c){let v=n("#bpd-note").value.trim(),_=n("#bpd-date").value;if(!v){x("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Billing Note no. \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}if(!_){x("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}y.noteNo=v,y.aplDate=M(_),y.vendorId=n("#bpd-vendor").value.trim(),y.po=n("#bpd-po").value.trim(),y.ac=n("#bpd-ac").value.trim(),y.cc=n("#bpd-cc").value.trim()}x("");let C=[...b.values()].sort((v,_)=>String(v.date||"").localeCompare(String(_.date||""))||String(v.job_no||"").localeCompare(String(_.job_no||""))),A=f.querySelector('input[name="bpd-tpl"]:checked').value,u=c?tt(C,y):(lt[A]||F)(C,y),g=c?"BILLING APL \u2014 "+A:"BILLING "+((i.find(v=>v.k===A)||{}).t||"");ut(u,g+"  ("+C.length+" \u0E07\u0E32\u0E19)")}}var Et={tplGeneral:F,tplMaersk:Q,tplApl:tt};export{N as APL_HEAD,Et as _tpl,kt as openBillingPdf};
