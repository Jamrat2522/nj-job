import{a as X}from"./chunk-3I4NJAXT.js";import{a as Q}from"./chunk-46QUQC76.js";import{a as Y,b as U,c as H}from"./chunk-OPGKUGLK.js";import{a as J}from"./chunk-GDT6F23K.js";import{a as Z}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-F5ETAYOF.js";import{a as D}from"./chunk-UWAYW6DC.js";import{a as F}from"./chunk-DIH2PLYD.js";import{a as K,e as s}from"./chunk-PCFU74ZV.js";var I={issuerName:"N.J.LOGISTICS & FRUITS CO.,LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`,issuerNameMae:"N.J. LOGISTICS & FRUITS CO.,LTD"},ct=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"}],ot=[{k:"APL",t:"APL"}],pt=100,B=t=>{let n=String(t||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(n)?n.slice(8,10)+"/"+n.slice(5,7)+"/"+n.slice(0,4):""},N=t=>t==null||t===""?"":K(Number(t)||0),rt=(t,n)=>t.reduce((d,e)=>d+(Number(e[n])||0),0),m=t=>t==null?"":String(t),M=10;function z(t,n){let d=[],e=0;if(Array.isArray(n)&&n.length)for(let a of n){if(e>=t.length)break;let i=Math.max(1,Math.min(M,Number(a)||0));d.push({rows:t.slice(e,e+i),start:e}),e+=i}for(;e<t.length;e+=M)d.push({rows:t.slice(e,e+M),start:e});return d.length?d:[{rows:[],start:0}]}var bt=12;function st(t,n=bt){let d=m(t).split(/\s+/).filter(Boolean),e=[],a="";for(let i of d){let u=Array.from(i);if(u.length>n){a&&(e.push(a),a="");let p=[];for(let o of u){if(p.length>=n&&!/\p{M}/u.test(o))e.push(p.join("")),p=[];else if(p.length>=n){let h=p.length;for(;h>0&&/\p{M}/u.test(p[h-1]);)h--;h>0&&h--,h>0&&(e.push(p.slice(0,h).join("")),p=p.slice(h))}p.push(o)}p.length&&e.push(p.join(""));continue}if(!a){a=i;continue}Array.from(a).length+1+u.length<=n?a+=" "+i:(e.push(a),a=i)}return a&&e.push(a),e}function V(t,n,d){let e=[...new Set(t.map(p=>m(p.company_invoice)).filter(Boolean))].join("  /  "),a=z(t,d),i=a.length,u="Tel. "+D.tel+"  |  Fax. "+D.fax+"  |  Tax ID "+D.taxId;return a.map((p,o)=>{let h=p.start,b=o===i-1,E=p.rows.map((v,$)=>`<tr>
    <td class="c">${h+$+1}</td>
    <td class="c">${s(m(v.invoice_no))}</td>
    <td class="c">${s(m(v.master_bl_no))}</td>
    <td>${s(m(v.house_bl_no))}</td>
    <td class="c">${s(m(v.data_type))}</td>
    <td>${s(m(v.customer_name))}</td>
    <td class="c">${s(m(v.customs_declaration_no))}</td>
    <td class="c">${s(m(v.customer_job_no))}</td>
    <td class="r">${N(v.gross_total)}</td>
    <td class="r">${N(v.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-gen print-area" data-page="${o+1}">
    <div class="bpd-gen-top">
      <div class="bpd-gen-co">
        <img class="bpd-gen-logo" src="${s(D.logo)}" alt="N.J. Logistics">
        <div class="bpd-gen-coi">
          <div class="bpd-gen-conm">${s(D.nameEn)}</div>
          <div class="bpd-gen-coln">${s(D.address)}</div>
          <div class="bpd-gen-coln">${s(u)}</div>
        </div>
      </div>
      <div class="bpd-gen-pd">
        <div class="bpd-gen-r">Page ${o+1} / ${i}</div>
        <div class="bpd-gen-r bpd-gen-date">Date: ${s(n.today)}</div>
      </div>
    </div>
    <div class="bpd-gen-c">\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</div>
    <table class="bpd-tb bpd-tb-gen"><colgroup>
      <col style="width:5%"><col style="width:10.5%"><col style="width:9.5%">
      <col style="width:13%"><col style="width:6%"><col style="width:21%">
      <col style="width:10%"><col style="width:8.5%"><col style="width:7.5%">
      <col style="width:9%"></colgroup>
    <thead><tr>
      <th>\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th><th>Master</th><th>House</th>
      <th>Type</th><th>Exporter</th><th>dcl inv.</th>
      <th>cust. Po no</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E38\u0E17\u0E18\u0E34</th>
    </tr></thead><tbody>${E}</tbody></table>
    ${b?`<div class="bpd-gen-ft">
      <div class="bpd-gen-l">
        <div>\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${s(n.contact)} Tel: ${s(n.tel)}</div>
        <div>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 : ${s(n.dept)}</div>
      </div>
      <div class="bpd-gen-sg">
        <div class="bpd-gen-cust">${s(e)}</div>
        <div class="bpd-gen-sign">
          <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48................................................</div>
          <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A......................................</div>
        </div>
      </div>
    </div>`:""}</div>`}).join("")}function dt(t,n){let d=t.map(e=>`<tr>
    <td>${s(m(e.customer_name))}</td>
    <td class="c"></td>
    
    <td class="c">${s(m(e.booking_no))}</td>
    <td class="c">${s(m(e.invoice_no))}</td>
    <td class="c">${B(e.invoice_date)}</td>
    <td class="c">${s(n.submitDate)}</td>
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
          <td class="c t-b" colspan="4">${s(I.issuerNameMae)}</td>
          <th class="bpd-y bpd-mae-sub">Date of Submit<br>Original Document</th>
          <td class="c t-b">${s(n.submitDate)}</td>
        </tr>
        <tr>
          <th class="bpd-y">Customer Name</th><th class="bpd-y">Kewill No.</th>
          <th class="bpd-y">Booking No./BL No.</th><th class="bpd-y">Invoice No</th>
          <th class="bpd-y">Invoice Date</th><th class="bpd-y">Scan Date</th>
          <th class="bpd-y">Job Owner Code</th>
        </tr>
        ${d}
      </tbody></table>
    <div class="bpd-mae-ft">
      <div class="bpd-mae-co">Maersk Logistics &amp; Services (Thailand) Co., Ltd.</div>
      <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48............................................</div>
      <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A................................</div>
    </div></div>`}function nt(t,n,d){let e=z(t,d),a=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(i=>`<td class="r t-b">${N(rt(t,i))}</td>`).join("");return e.map((i,u)=>{let p=i.start,o=u===e.length-1,h=i.rows.map((b,E)=>`<tr>
    <td class="c">${B(b.date)}</td>
    <td class="c">${p+E+1}</td>
    <td class="c">${s(m(b.invoice_no))}</td>
    <td class="c">${s(m(b.master_bl_no))}</td>
    <td class="c">${s(m(b.house_bl_no))}</td>
    <td class="c">${s(m(b.data_type))}</td>
    <td class="c bpd-ci">${st(b.company_invoice).map(s).join("<br>")}</td>
    <td class="c">${s(m(b.customs_declaration_no))}</td>
    <td class="c">${s(m(b.customer_job_no))}</td>
    <td class="r">${N(b.service_amount)}</td>
    <td class="r">${N(b.advance_amount)}</td>
    <td class="r">${N(b.vat_amount)}</td>
    <td class="r">${N(b.subtotal)}</td>
    <td class="r">${N(b.wht_amount)}</td>
    <td class="r">${N(b.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-apl print-area" data-page="${u+1}">
    <div class="bpd-apl-top">
      <img class="bpd-apl-logo" src="${s(D.logo)}" alt="N.J. Logistics">
      <div class="bpd-apl-note">
        <div>Billing Note  no. ${s(n.noteNo)}</div>
        <div>Create date.${s(n.aplDate)}</div>
      </div>
    </div>
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${s(I.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${s(I.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span class="t-b">${s(I.issuerTel)}</span></div>
      <div class="bpd-apl-bt">Bill To.</div>
      <div class="bpd-kv"><span>Text ID no.</span><span class="t-b">${s(I.textIdNo)}</span></div>
      <div class="bpd-kv"><span>Tax invoice issued under : ${s(I.issuedUnder)}</span><span></span></div>
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${s(I.billToName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${s(I.billToAddr).replace(/\n/g,"<br>")}</span></div>
    </div>
    <table class="bpd-tb bpd-tb-xs bpd-tb-apl"><colgroup>
      <col style="width:5.3%"><col style="width:2.5%"><col style="width:8.8%">
      <col style="width:10.4%"><col style="width:8.3%"><col style="width:3.9%">
      <col style="width:9%"><col style="width:8.8%"><col style="width:10.5%">
      <col style="width:6.8%"><col style="width:5.4%"><col style="width:4.8%">
      <col style="width:5.4%"><col style="width:4.1%"><col style="width:6%"></colgroup>
    <thead><tr>
      <th class="bpd-y">Date</th><th class="bpd-y">Item</th><th class="bpd-y">Invoice No.</th>
      <th class="bpd-y">Master</th><th class="bpd-y">House B/L No.</th>
      <th class="bpd-y">Data Type</th><th class="bpd-y">Company Invoice</th>
      <th class="bpd-y">DCL INV.</th><th class="bpd-y">Customer Job No.</th>
      <th class="bpd-y">Service charge</th><th class="bpd-y">Advance</th>
      <th class="bpd-y">VAT 7%</th><th class="bpd-y">Amount</th>
      <th class="bpd-y">WHT 3%</th><th class="bpd-y">Total Amount</th>
    </tr></thead><tbody>${h}${o?`
      <tr class="bpd-apl-tot"><td colspan="9" class="r t-b">TOTAL</td>${a}</tr>`:""}</tbody></table>
    ${o?`<div class="bpd-apl-ft">
      <div class="bpd-sbox bpd-sbox-l">
        <div>VENDOE ID: &nbsp; ${s(n.vendorId)}</div>
        <div>PO. : ${s(n.po)}............................................................</div>
        <div>A/C : ${s(n.ac)}.............................C/C${s(n.cc)}.............................</div>
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
    </div>`:""}</div>`}).join("")}var ut={general:V,maersk:dt};function vt(t){let n=t.getBoundingClientRect(),d=parseFloat(getComputedStyle(t).paddingBottom)||0,e=n.top;return t.querySelectorAll("table, .bpd-gen-ft, .bpd-apl-ft").forEach(a=>{e=Math.max(e,a.getBoundingClientRect().bottom)}),e-(n.bottom-d)}function at(t,n){let d=z(new Array(n).fill(0)).map(i=>i.rows.length),e=t(null);if(typeof document>"u"||!document.body||!n)return e;let a=document.createElement("div");a.setAttribute("aria-hidden","true"),a.style.cssText="position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none",document.body.appendChild(a);try{for(let i=0;i<n*M;i++){a.innerHTML=e;let p=[...a.children].findIndex((o,h)=>d[h]>1&&vt(o)>.5);if(p<0)break;d[p]-=1,p+1<d.length?d[p+1]+=1:d.push(1);for(let o=p+1;o<d.length;o++){if(d[o]<=M)continue;let h=d[o]-M;d[o]=M,o+1<d.length?d[o+1]+=h:d.push(h)}e=t(d.slice())}}finally{a.parentNode&&a.parentNode.removeChild(a)}return e}var tt="nj-print-doc",G="nj-bpd-page";function ht(){if(document.getElementById(G))return;let t=document.createElement("style");t.id=G,t.textContent="@page{size:A4 landscape;margin:0}",document.head.appendChild(t)}function mt(){let t=document.getElementById(G);t&&t.parentNode&&t.parentNode.removeChild(t)}function ft(){let t=document.body;t.classList.add(tt),ht();let n=()=>{t.classList.remove(tt),mt()};window.addEventListener("afterprint",n,{once:!0});try{let d=window.matchMedia("print"),e=a=>{a.matches||(n(),d.removeEventListener("change",e))};d.addEventListener("change",e)}catch{}window.print()}var gt=.5,yt=1.5,et=.1;function $t(t,n){let d=t&&t.querySelector(".bpd-fit-in"),e=d&&d.firstElementChild;if(!e)return()=>{};let a="fit",i=1,u=null,p=()=>{d.style.transform="none",t.style.width="",t.style.height="";let v=e.offsetWidth,$=e.offsetHeight;if(!v||!$)return 1;let w=t.parentElement,A=t.clientWidth||(w?w.clientWidth:0)||v,c=(w?w.clientHeight:0)||$;return Math.min(A/v,c/$,1)},o=()=>{let v=a==="fit"?p():i,$=e.offsetWidth,w=d.offsetHeight||e.offsetHeight;d.style.transform="scale("+v+")",t.style.width=Math.round($*v)+"px",t.style.height=Math.round(w*v)+"px",t.style.margin="0 auto",u&&(u.textContent=Math.round(v*100)+"%")};if(n){let v=n.querySelector(".mf-left")||n,$=document.createElement("div");$.className="bpd-zoom",$.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="bpd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',v.appendChild($),u=$.querySelector(".bpd-zoom-v"),$.addEventListener("click",w=>{let A=w.target.closest("[data-z]");if(!A)return;let c=A.dataset.z;if(c==="fit")a="fit";else{let O=a==="fit"?p():i;c==="100"?i=1:i=Math.min(yt,Math.max(gt,Math.round((O+(c==="in"?et:-et))*100)/100)),a="zoom"}o()})}o();let h=v=>typeof requestAnimationFrame=="function"?requestAnimationFrame(v):setTimeout(v,16);h(()=>h(o));let b=()=>{a==="fit"&&o()};window.addEventListener("resize",b),window.addEventListener("orientationchange",b);let E=null;try{E=new ResizeObserver(b),E.observe(t.parentElement||t)}catch{}return()=>{try{E&&E.disconnect()}catch{}window.removeEventListener("resize",b),window.removeEventListener("orientationchange",b)}}function lt(t,n){let d=document.createElement("div");d.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+t+"</div></div>";let e=document.createElement("div");e.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,F({title:n,body:d,footer:e,fullscreen:!0,wide:!0}),e.querySelector("#bpd-print").onclick=()=>ft();let a=d.querySelector(".bpd-fit"),i=$t(a,e),u=e.querySelector("[data-close]");u&&u.addEventListener("click",i,{once:!0})}function Dt(t,n){let d=n==="apl",e=d?ot:ct,a=B(new Date().toISOString().slice(0,10)),i=[],u=new Map,p=!0,o=new Map,h="",b=!1,E=()=>p?J.masters?.customers||[]:[],v=50,$=()=>Q(E(),h),w=document.createElement("div");w.innerHTML=`
    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</div>
      <div class="bpd-tpl" id="bpd-tpl">
        ${e.map((l,r)=>`<label class="bpd-radio">
          <input type="radio" name="bpd-tpl" value="${l.k}"${r===0?" checked":""}>
          <span>${s(l.t)}</span></label>`).join("")}
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
      ${p?`<div class="bpd-cust" id="bpd-cust">
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
      ${d?`<div class="fgrid mt-2">
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
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let A=document.createElement("div");A.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,F({title:d?"Billing PDF APL":"Billing PDF",body:w,footer:A,large:!0,cls:"bpd-modal"});let c=l=>w.querySelector(l),O=c("#bpd-msg"),R=c("#bpd-tb"),it=c("#bpd-cnt"),q=l=>{O.hidden=!l,O.textContent=l||""},W=()=>{it.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+u.size+" \u0E07\u0E32\u0E19";let l=i.map(r=>r.id);c("#bpd-all").checked=l.length>0&&l.every(r=>u.has(r))},j=()=>{R.innerHTML=i.length?i.map(l=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${s(l.id)}"${u.has(l.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${s(m(l.job_no)||"-")}</td>
          <td class="ellip">${s(m(l.customer_name)||"-")}</td>
          <td style="width:130px">${s(m(l.invoice_no)||"-")}</td>
          <td style="width:150px">${s(m(l.house_bl_no)||"-")}</td>
          <td style="width:90px" class="center">${B(l.date)||"-"}</td>
        </tr>`).join(""):'<tr><td class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',W()};async function S(){let l=Y("bpd");R.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let r=await X({charge:t.charge,group:t.group,filters:{q:c("#bpd-q").value.trim()||null,from:c("#bpd-from").value||null,to:c("#bpd-to").value||null,customer_ids:[...o.keys()]},page:1,size:pt,withKpi:!1,queue:t.queue,scope:t.scope});if(!U("bpd",l))return;i=r&&r.rows||[],j();let k=Number(r&&r.total||0);q(k>i.length?"\u0E1E\u0E1A "+k+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+i.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(r){if(!U("bpd",l))return;R.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',Z(r,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}if(p){let l=c("#bpd-cq"),r=c("#bpd-cust-pop"),k=c("#bpd-cust-cnt"),P=c("#bpd-cust-clear"),_=()=>{let g=o.size;if(k.textContent=g?"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+g+" \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32":"",P.hidden=!g,!b)return;let L=$(),T=L.slice(0,v),y=L.length>0&&L.every(f=>o.has(f.id));r.innerHTML=`<label class="bpd-cust-row bpd-cust-head">
          <input type="checkbox" id="bpd-cust-all"${y?" checked":""}>
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14${L.length?" ("+L.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":""}</span></label>`+(L.length>T.length?`<div class="bpd-cust-more">\u0E41\u0E2A\u0E14\u0E07 ${T.length} \u0E08\u0E32\u0E01 ${L.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u201C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u201D \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E31\u0E49\u0E07 ${L.length} \u0E23\u0E32\u0E22</div>`:"")+(T.length?T.map(f=>`<label class="bpd-cust-row">
              <input type="checkbox" data-cid="${s(f.id)}"${o.has(f.id)?" checked":""}>
              <span class="bpd-cust-code">${s(f.code||"-")}</span>
              <span class="bpd-cust-nm" title="${s(f.name||"")}">${s(f.name||"-")}</span>
            </label>`).join(""):'<div class="bpd-cust-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19</div>')},C=()=>{b=!0,r.hidden=!1,l.setAttribute("aria-expanded","true"),_()},x=()=>{b=!1,r.hidden=!0,l.setAttribute("aria-expanded","false")};l.addEventListener("focus",C),l.addEventListener("input",()=>{h=l.value,C()}),l.addEventListener("keydown",g=>{g.key==="Escape"&&(g.preventDefault(),x()),g.key==="Enter"&&g.preventDefault()}),c("#bpd-cust-toggle").onclick=()=>{b?x():(l.focus(),C())},r.addEventListener("change",g=>{let L=g.target.closest("#bpd-cust-all");if(L){$().forEach(f=>{L.checked?o.set(f.id,f):o.delete(f.id)}),_(),H("bpd-cust",S,250);return}let T=g.target.closest("[data-cid]");if(!T)return;let y=E().find(f=>f.id===T.dataset.cid);y&&(T.checked?o.set(y.id,y):o.delete(y.id),_(),H("bpd-cust",S,250))}),r.addEventListener("mousedown",g=>g.preventDefault()),P.onclick=()=>{o.clear(),_(),S()},w.addEventListener("click",g=>{b&&(g.target.closest("#bpd-cust")||x())}),_()}c("#bpd-go").onclick=S,c("#bpd-q").onkeydown=l=>{l.key==="Enter"&&(l.preventDefault(),S())},c("#bpd-q").addEventListener("input",()=>H("bpd-q",S,300)),c("#bpd-from").onchange=S,c("#bpd-to").onchange=S,R.addEventListener("change",l=>{let r=l.target.closest("[data-bid]");if(!r)return;let k=i.find(P=>P.id===r.dataset.bid);k&&(r.checked?u.set(k.id,k):u.delete(k.id),W())}),c("#bpd-all").onchange=l=>{i.forEach(r=>{l.target.checked?u.set(r.id,r):u.delete(r.id)}),j()},c("#bpd-clear").onclick=()=>{u.clear(),j()},A.querySelector("#bpd-prev").onclick=()=>{if(!u.size){q("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let l=c("#bpd-contact").value.trim(),r=c("#bpd-tel").value.trim(),k=c("#bpd-dept").value.trim();if(!l||!r||!k){q("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let P=c("#bpd-submit").value,_={contact:l,tel:r,dept:k,today:a,submitDate:P?B(P):a};if(d){let y=c("#bpd-note").value.trim(),f=c("#bpd-date").value;if(!y){q("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Billing Note no. \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}if(!f){q("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}_.noteNo=y,_.aplDate=B(f),_.vendorId=c("#bpd-vendor").value.trim(),_.po=c("#bpd-po").value.trim(),_.ac=c("#bpd-ac").value.trim(),_.cc=c("#bpd-cc").value.trim()}q("");let C=[...u.values()].sort((y,f)=>String(y.date||"").localeCompare(String(f.date||""))||String(y.job_no||"").localeCompare(String(f.job_no||""))),x=w.querySelector('input[name="bpd-tpl"]:checked').value,g=y=>d?nt(C,_,y):(ut[x]||V)(C,_,y),L=d||x==="general"?at(g,C.length):g(null),T=d?"BILLING APL \u2014 "+x:"BILLING "+((e.find(y=>y.k===x)||{}).t||"");lt(L,T+"  ("+C.length+" \u0E07\u0E32\u0E19)")}}var It={tplGeneral:V,tplMaersk:dt,tplApl:nt,chunkRows:z,wrapFixed:st,fitPaper:at,BPD_ROWS_PER_PAGE:M,openPreview:lt};export{I as APL_HEAD,It as _tpl,Dt as openBillingPdf};
