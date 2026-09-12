import{a as B}from"./chunk-26EE6XNU.js";import{a as O,b as C,c as H}from"./chunk-OPGKUGLK.js";import{a as q}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-F5ETAYOF.js";import{a as A}from"./chunk-DIH2PLYD.js";import{a as P,e}from"./chunk-PCFU74ZV.js";var L={issuerName:"N.J.LOGISTICS & FRUITS CO.,LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`,issuerNameMae:"N.J. LOGISTICS & FRUITS CO.,LTD"},U=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"}],K=[{k:"APL",t:"APL"}],W=100,S=t=>{let a=String(t||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(a)?a.slice(8,10)+"/"+a.slice(5,7)+"/"+a.slice(0,4):""},y=t=>t==null||t===""?"":P(Number(t)||0),J=(t,a)=>t.reduce((l,n)=>l+(Number(n[a])||0),0),o=t=>t==null?"":String(t);function x(t,a){let l=t.map((s,p)=>`<tr>
    <td class="c">${p+1}</td>
    <td class="c">${e(o(s.invoice_no))}</td>
    <td class="c">${e(o(s.master_bl_no))}</td>
    <td>${e(o(s.house_bl_no))}</td>
    <td class="c">${e(o(s.data_type))}</td>
    <td>${e(o(s.customer_name))}</td>
    <td class="c">${e(o(s.customs_declaration_no))}</td>
    <td class="c">${e(o(s.customer_job_no))}</td>
    <td class="r">${y(s.gross_total)}</td>
    <td class="r">${y(s.net_payable)}</td></tr>`).join(""),n=[...new Set(t.map(s=>o(s.company_invoice)).filter(Boolean))].join("  /  ");return`<div class="bpd bpd-gen print-area">
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
    </tr></thead><tbody>${l}</tbody></table>
    <div class="bpd-gen-ft">
      <div class="bpd-gen-cust">${e(n)}</div>
      <div class="bpd-gen-sign">
        <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48................................................</div>
        <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A......................................</div>
      </div>
    </div></div>`}function j(t,a){let l=t.map(n=>`<tr>
    <td>${e(o(n.customer_name))}</td>
    <td class="c"></td>
    
    <td class="c">${e(o(n.booking_no))}</td>
    <td class="c">${e(o(n.invoice_no))}</td>
    <td class="c">${S(n.invoice_date)}</td>
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
          <td class="c t-b" colspan="4">${e(L.issuerNameMae)}</td>
          <th class="bpd-y bpd-mae-sub">Date of Submit<br>Original Document</th>
          <td class="c t-b">${e(a.submitDate)}</td>
        </tr>
        <tr>
          <th class="bpd-y">Customer Name</th><th class="bpd-y">Kewill No.</th>
          <th class="bpd-y">Booking No./BL No.</th><th class="bpd-y">Invoice No</th>
          <th class="bpd-y">Invoice Date</th><th class="bpd-y">Scan Date</th>
          <th class="bpd-y">Job Owner Code</th>
        </tr>
        ${l}
      </tbody></table>
    <div class="bpd-mae-ft">
      <div class="bpd-mae-co">Maersk Logistics &amp; Services (Thailand) Co., Ltd.</div>
      <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48............................................</div>
      <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A................................</div>
    </div></div>`}function F(t,a){let l=t.map((s,p)=>`<tr>
    <td class="c">${S(s.date)}</td>
    <td class="c">${p+1}</td>
    <td class="c">${e(o(s.invoice_no))}</td>
    <td class="c">${e(o(s.master_bl_no))}</td>
    <td class="c">${e(o(s.house_bl_no))}</td>
    <td class="c">${e(o(s.data_type))}</td>
    <td class="c">${e(o(s.company_invoice))}</td>
    <td class="c">${e(o(s.customs_declaration_no))}</td>
    <td class="c">${e(o(s.customer_job_no))}</td>
    <td class="r">${y(s.service_amount)}</td>
    <td class="r">${y(s.advance_amount)}</td>
    <td class="r">${y(s.vat_amount)}</td>
    <td class="r">${y(s.subtotal)}</td>
    <td class="r">${y(s.wht_amount)}</td>
    <td class="r">${y(s.net_payable)}</td></tr>`).join(""),n=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(s=>`<td class="r t-b">${y(J(t,s))}</td>`).join("");return`<div class="bpd bpd-apl print-area">
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${e(L.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${e(L.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span class="t-b">${e(L.issuerTel)}</span></div>
      <div class="bpd-apl-bt">Bill To.</div>
      <div class="bpd-kv"><span>Text ID no.</span><span class="t-b">${e(L.textIdNo)}</span></div>
      <div class="bpd-kv"><span>Tax invoice issued under : ${e(L.issuedUnder)}</span><span></span></div>
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${e(L.billToName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${e(L.billToAddr).replace(/\n/g,"<br>")}</span></div>
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
    </tr></thead><tbody>${l}
      <tr><td colspan="9"></td>${n}</tr></tbody></table>
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
    </div></div>`}var Z={general:x,maersk:j},z="nj-print-doc",M="nj-bpd-page";function X(){if(document.getElementById(M))return;let t=document.createElement("style");t.id=M,t.textContent="@page{size:A4 landscape;margin:0}",document.head.appendChild(t)}function Y(){let t=document.getElementById(M);t&&t.parentNode&&t.parentNode.removeChild(t)}function Q(){let t=document.body;t.classList.add(z),X();let a=()=>{t.classList.remove(z),Y()};window.addEventListener("afterprint",a,{once:!0});try{let l=window.matchMedia("print"),n=s=>{s.matches||(a(),l.removeEventListener("change",n))};l.addEventListener("change",n)}catch{}window.print()}var tt=.5,et=1.5,R=.1;function st(t,a){let l=t&&t.querySelector(".bpd-fit-in"),n=l&&l.firstElementChild;if(!n)return()=>{};let s="fit",p=1,r=null,N=()=>{l.style.transform="none",t.style.width="",t.style.height="";let v=n.offsetWidth,b=n.offsetHeight;if(!v||!b)return 1;let u=t.parentElement,w=t.clientWidth||(u?u.clientWidth:0)||v,h=(u?u.clientHeight:0)||b;return Math.min(w/v,h/b,1)},g=()=>{let v=s==="fit"?N():p,b=n.offsetWidth,u=n.offsetHeight;l.style.transform="scale("+v+")",t.style.width=Math.round(b*v)+"px",t.style.height=Math.round(u*v)+"px",t.style.margin="0 auto",r&&(r.textContent=Math.round(v*100)+"%")};if(a){let v=a.querySelector(".mf-left")||a,b=document.createElement("div");b.className="bpd-zoom",b.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="bpd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',v.appendChild(b),r=b.querySelector(".bpd-zoom-v"),b.addEventListener("click",u=>{let w=u.target.closest("[data-z]");if(!w)return;let h=w.dataset.z;if(h==="fit")s="fit";else{let d=s==="fit"?N():p;h==="100"?p=1:p=Math.min(et,Math.max(tt,Math.round((d+(h==="in"?R:-R))*100)/100)),s="zoom"}g()})}g();let i=v=>typeof requestAnimationFrame=="function"?requestAnimationFrame(v):setTimeout(v,16);i(()=>i(g));let $=()=>{s==="fit"&&g()};window.addEventListener("resize",$),window.addEventListener("orientationchange",$);let f=null;try{f=new ResizeObserver($),f.observe(t.parentElement||t)}catch{}return()=>{try{f&&f.disconnect()}catch{}window.removeEventListener("resize",$),window.removeEventListener("orientationchange",$)}}function dt(t,a){let l=document.createElement("div");l.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+t+"</div></div>";let n=document.createElement("div");n.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,A({title:a,body:l,footer:n,fullscreen:!0,wide:!0}),n.querySelector("#bpd-print").onclick=()=>Q();let s=l.querySelector(".bpd-fit"),p=st(s,n),r=n.querySelector("[data-close]");r&&r.addEventListener("click",p,{once:!0})}function rt(t,a){let l=a==="apl",n=l?K:U,s=S(new Date().toISOString().slice(0,10)),p=[],r=new Map,N=document.createElement("div");N.innerHTML=`
    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</div>
      <div class="bpd-tpl" id="bpd-tpl">
        ${n.map((d,c)=>`<label class="bpd-radio">
          <input type="radio" name="bpd-tpl" value="${d.k}"${c===0?" checked":""}>
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
      ${l?`<div class="fgrid mt-2">
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
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let g=document.createElement("div");g.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,A({title:l?"Billing PDF APL":"Billing PDF",body:N,footer:g,large:!0});let i=d=>N.querySelector(d),$=i("#bpd-msg"),f=i("#bpd-tb"),v=i("#bpd-cnt"),b=d=>{$.hidden=!d,$.textContent=d||""},u=()=>{v.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+r.size+" \u0E07\u0E32\u0E19";let d=p.map(c=>c.id);i("#bpd-all").checked=d.length>0&&d.every(c=>r.has(c))},w=()=>{f.innerHTML=p.length?p.map(d=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${e(d.id)}"${r.has(d.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${e(o(d.job_no)||"-")}</td>
          <td class="ellip">${e(o(d.customer_name)||"-")}</td>
          <td style="width:130px">${e(o(d.invoice_no)||"-")}</td>
          <td style="width:150px">${e(o(d.house_bl_no)||"-")}</td>
          <td style="width:90px" class="center">${S(d.date)||"-"}</td>
        </tr>`).join(""):'<tr><td class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',u()};async function h(){let d=O("bpd");f.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let c=await B({charge:t.charge,group:t.group,filters:{q:i("#bpd-q").value.trim()||null,from:i("#bpd-from").value||null,to:i("#bpd-to").value||null},page:1,size:W,withKpi:!1,queue:t.queue,scope:t.scope});if(!C("bpd",d))return;p=c&&c.rows||[],w();let m=Number(c&&c.total||0);b(m>p.length?"\u0E1E\u0E1A "+m+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+p.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(c){if(!C("bpd",d))return;f.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',q(c,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}i("#bpd-go").onclick=h,i("#bpd-q").onkeydown=d=>{d.key==="Enter"&&(d.preventDefault(),h())},i("#bpd-q").addEventListener("input",()=>H("bpd-q",h,300)),i("#bpd-from").onchange=h,i("#bpd-to").onchange=h,f.addEventListener("change",d=>{let c=d.target.closest("[data-bid]");if(!c)return;let m=p.find(D=>D.id===c.dataset.bid);m&&(c.checked?r.set(m.id,m):r.delete(m.id),u())}),i("#bpd-all").onchange=d=>{p.forEach(c=>{d.target.checked?r.set(c.id,c):r.delete(c.id)}),w()},i("#bpd-clear").onclick=()=>{r.clear(),w()},g.querySelector("#bpd-prev").onclick=()=>{if(!r.size){b("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let d=i("#bpd-contact").value.trim(),c=i("#bpd-tel").value.trim(),m=i("#bpd-dept").value.trim();if(!d||!c||!m){b("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let D=i("#bpd-submit").value,_={contact:d,tel:c,dept:m,today:s,submitDate:D?S(D):s};if(l){let T=i("#bpd-note").value.trim(),k=i("#bpd-date").value;if(!T){b("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Billing Note no. \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}if(!k){b("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}_.noteNo=T,_.aplDate=S(k),_.vendorId=i("#bpd-vendor").value.trim(),_.po=i("#bpd-po").value.trim(),_.ac=i("#bpd-ac").value.trim(),_.cc=i("#bpd-cc").value.trim()}b("");let E=[...r.values()].sort((T,k)=>String(T.date||"").localeCompare(String(k.date||""))||String(T.job_no||"").localeCompare(String(k.job_no||""))),I=N.querySelector('input[name="bpd-tpl"]:checked').value,V=l?F(E,_):(Z[I]||x)(E,_),G=l?"BILLING APL \u2014 "+I:"BILLING "+((n.find(T=>T.k===I)||{}).t||"");dt(V,G+"  ("+E.length+" \u0E07\u0E32\u0E19)")}}var vt={tplGeneral:x,tplMaersk:j,tplApl:F};export{L as APL_HEAD,vt as _tpl,rt as openBillingPdf};
