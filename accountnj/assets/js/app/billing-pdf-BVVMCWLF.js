import{a as et,b as st}from"./chunk-N6KDFRG2.js";import{a as dt}from"./chunk-46QUQC76.js";import{a as J,b as R,c as z}from"./chunk-OPGKUGLK.js";import"./chunk-GDT6F23K.js";import{a as V}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-F5ETAYOF.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as K}from"./chunk-DIH2PLYD.js";import{a as tt,e as s}from"./chunk-PCFU74ZV.js";var M={issuerName:"N.J.LOGISTICS & FRUITS CO.,LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`,issuerNameMae:"N.J. LOGISTICS & FRUITS CO.,LTD"},ut=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"}],vt=[{k:"APL",t:"APL"}],ht=100,B=t=>{let n=String(t||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(n)?n.slice(8,10)+"/"+n.slice(5,7)+"/"+n.slice(0,4):""},D=t=>t==null||t===""?"":tt(Number(t)||0),ft=(t,n)=>t.reduce((d,e)=>d+(Number(e[n])||0),0),f=t=>t==null?"":String(t),O=10;function F(t,n){let d=[],e=0;if(Array.isArray(n)&&n.length)for(let l of n){if(e>=t.length)break;let c=Math.max(1,Math.min(O,Number(l)||0));d.push({rows:t.slice(e,e+c),start:e}),e+=c}for(;e<t.length;e+=O)d.push({rows:t.slice(e,e+O),start:e});return d.length?d:[{rows:[],start:0}]}var mt=12;function lt(t,n=mt){let d=f(t).split(/\s+/).filter(Boolean),e=[],l="";for(let c of d){let v=Array.from(c);if(v.length>n){l&&(e.push(l),l="");let p=[];for(let o of v){if(p.length>=n&&!/\p{M}/u.test(o))e.push(p.join("")),p=[];else if(p.length>=n){let h=p.length;for(;h>0&&/\p{M}/u.test(p[h-1]);)h--;h>0&&h--,h>0&&(e.push(p.slice(0,h).join("")),p=p.slice(h))}p.push(o)}p.length&&e.push(p.join(""));continue}if(!l){l=c;continue}Array.from(l).length+1+v.length<=n?l+=" "+c:(e.push(l),l=c)}return l&&e.push(l),e}function Z(t,n,d){let e=[...new Set(t.map(p=>f(p.company_invoice)).filter(Boolean))].join("  /  "),l=F(t,d),c=l.length,v="Tel. "+x.tel+"  |  Fax. "+x.fax+"  |  Tax ID "+x.taxId;return l.map((p,o)=>{let h=p.start,u=o===c-1,m=p.rows.map((b,$)=>`<tr>
    <td class="c">${h+$+1}</td>
    <td class="c">${s(f(b.invoice_no))}</td>
    <td class="c">${s(f(b.master_bl_no))}</td>
    <td>${s(f(b.house_bl_no))}</td>
    <td class="c">${s(f(b.data_type))}</td>
    <td>${s(f(b.customer_name))}</td>
    <td class="c">${s(f(b.customs_declaration_no))}</td>
    <td class="c">${s(f(b.customer_job_no))}</td>
    <td class="r">${D(b.gross_total)}</td>
    <td class="r">${D(b.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-gen print-area" data-page="${o+1}">
    <div class="bpd-gen-top">
      <div class="bpd-gen-co">
        <img class="bpd-gen-logo" src="${s(x.logo)}" alt="N.J. Logistics">
        <div class="bpd-gen-coi">
          <div class="bpd-gen-conm">${s(x.nameEn)}</div>
          <div class="bpd-gen-coln">${s(x.address)}</div>
          <div class="bpd-gen-coln">${s(v)}</div>
        </div>
      </div>
      <div class="bpd-gen-pd">
        <div class="bpd-gen-r">Page ${o+1} / ${c}</div>
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
    </tr></thead><tbody>${m}</tbody></table>
    ${u?`<div class="bpd-gen-ft">
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
    </div>`:""}</div>`}).join("")}function it(t,n){let d=t.map(e=>`<tr>
    <td>${s(f(e.customer_name))}</td>
    <td class="c"></td>
    
    <td class="c">${s(f(e.booking_no))}</td>
    <td class="c">${s(f(e.invoice_no))}</td>
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
          <td class="c t-b" colspan="4">${s(M.issuerNameMae)}</td>
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
    </div></div>`}function ct(t,n,d){let e=F(t,d),l=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(c=>`<td class="r t-b">${D(ft(t,c))}</td>`).join("");return e.map((c,v)=>{let p=c.start,o=v===e.length-1,h=c.rows.map((u,m)=>`<tr>
    <td class="c">${B(u.date)}</td>
    <td class="c">${p+m+1}</td>
    <td class="c">${s(f(u.invoice_no))}</td>
    <td class="c">${s(f(u.master_bl_no))}</td>
    <td class="c">${s(f(u.house_bl_no))}</td>
    <td class="c">${s(f(u.data_type))}</td>
    <td class="c bpd-ci">${lt(u.company_invoice).map(s).join("<br>")}</td>
    <td class="c">${s(f(u.customs_declaration_no))}</td>
    <td class="c">${s(f(u.customer_job_no))}</td>
    <td class="r">${D(u.service_amount)}</td>
    <td class="r">${D(u.advance_amount)}</td>
    <td class="r">${D(u.vat_amount)}</td>
    <td class="r">${D(u.subtotal)}</td>
    <td class="r">${D(u.wht_amount)}</td>
    <td class="r">${D(u.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-apl print-area" data-page="${v+1}">
    <div class="bpd-apl-top">
      <img class="bpd-apl-logo" src="${s(x.logo)}" alt="N.J. Logistics">
      <div class="bpd-apl-note">
        <div>Billing Note  no. ${s(n.noteNo)}</div>
        <div>Create date.${s(n.aplDate)}</div>
      </div>
    </div>
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${s(M.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${s(M.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span class="t-b">${s(M.issuerTel)}</span></div>
      <div class="bpd-apl-bt">Bill To.</div>
      <div class="bpd-kv"><span>Text ID no.</span><span class="t-b">${s(M.textIdNo)}</span></div>
      <div class="bpd-kv"><span>Tax invoice issued under : ${s(M.issuedUnder)}</span><span></span></div>
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${s(M.billToName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${s(M.billToAddr).replace(/\n/g,"<br>")}</span></div>
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
      <tr class="bpd-apl-tot"><td colspan="9" class="r t-b">TOTAL</td>${l}</tr>`:""}</tbody></table>
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
    </div>`:""}</div>`}).join("")}var yt={general:Z,maersk:it};function gt(t){let n=t.getBoundingClientRect(),d=parseFloat(getComputedStyle(t).paddingBottom)||0,e=n.top;return t.querySelectorAll("table, .bpd-gen-ft, .bpd-apl-ft").forEach(l=>{e=Math.max(e,l.getBoundingClientRect().bottom)}),e-(n.bottom-d)}function ot(t,n){let d=F(new Array(n).fill(0)).map(c=>c.rows.length),e=t(null);if(typeof document>"u"||!document.body||!n)return e;let l=document.createElement("div");l.setAttribute("aria-hidden","true"),l.style.cssText="position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none",document.body.appendChild(l);try{for(let c=0;c<n*O;c++){l.innerHTML=e;let p=[...l.children].findIndex((o,h)=>d[h]>1&&gt(o)>.5);if(p<0)break;d[p]-=1,p+1<d.length?d[p+1]+=1:d.push(1);for(let o=p+1;o<d.length;o++){if(d[o]<=O)continue;let h=d[o]-O;d[o]=O,o+1<d.length?d[o+1]+=h:d.push(h)}e=t(d.slice())}}finally{l.parentNode&&l.parentNode.removeChild(l)}return e}var nt="nj-print-doc",W="nj-bpd-page";function $t(){if(document.getElementById(W))return;let t=document.createElement("style");t.id=W,t.textContent="@page{size:A4 landscape;margin:0}",document.head.appendChild(t)}function wt(){let t=document.getElementById(W);t&&t.parentNode&&t.parentNode.removeChild(t)}function _t(){let t=document.body;t.classList.add(nt),$t();let n=()=>{t.classList.remove(nt),wt()};window.addEventListener("afterprint",n,{once:!0});try{let d=window.matchMedia("print"),e=l=>{l.matches||(n(),d.removeEventListener("change",e))};d.addEventListener("change",e)}catch{}window.print()}var Lt=.5,kt=1.5,at=.1;function Et(t,n){let d=t&&t.querySelector(".bpd-fit-in"),e=d&&d.firstElementChild;if(!e)return()=>{};let l="fit",c=1,v=null,p=()=>{d.style.transform="none",t.style.width="",t.style.height="";let b=e.offsetWidth,$=e.offsetHeight;if(!b||!$)return 1;let S=t.parentElement,q=t.clientWidth||(S?S.clientWidth:0)||b,N=(S?S.clientHeight:0)||$;return Math.min(q/b,N/$,1)},o=()=>{let b=l==="fit"?p():c,$=e.offsetWidth,S=d.offsetHeight||e.offsetHeight;d.style.transform="scale("+b+")",t.style.width=Math.round($*b)+"px",t.style.height=Math.round(S*b)+"px",t.style.margin="0 auto",v&&(v.textContent=Math.round(b*100)+"%")};if(n){let b=n.querySelector(".mf-left")||n,$=document.createElement("div");$.className="bpd-zoom",$.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="bpd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',b.appendChild($),v=$.querySelector(".bpd-zoom-v"),$.addEventListener("click",S=>{let q=S.target.closest("[data-z]");if(!q)return;let N=q.dataset.z;if(N==="fit")l="fit";else{let H=l==="fit"?p():c;N==="100"?c=1:c=Math.min(kt,Math.max(Lt,Math.round((H+(N==="in"?at:-at))*100)/100)),l="zoom"}o()})}o();let h=b=>typeof requestAnimationFrame=="function"?requestAnimationFrame(b):setTimeout(b,16);h(()=>h(o));let u=()=>{l==="fit"&&o()};window.addEventListener("resize",u),window.addEventListener("orientationchange",u);let m=null;try{m=new ResizeObserver(u),m.observe(t.parentElement||t)}catch{}return()=>{try{m&&m.disconnect()}catch{}window.removeEventListener("resize",u),window.removeEventListener("orientationchange",u)}}function pt(t,n){let d=document.createElement("div");d.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+t+"</div></div>";let e=document.createElement("div");e.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,K({title:n,body:d,footer:e,fullscreen:!0,wide:!0}),e.querySelector("#bpd-print").onclick=()=>_t();let l=d.querySelector(".bpd-fit"),c=Et(l,e),v=e.querySelector("[data-close]");v&&v.addEventListener("click",c,{once:!0})}function Bt(t,n){let d=n==="apl",e=d?vt:ut,l=B(new Date().toISOString().slice(0,10)),c=[],v=new Map,p=!0,o=new Map,h="",u=!1,m=null,b=null,$=()=>{if(!p||!Array.isArray(m))return[];let a=new Set(m.map(i=>i.id));return m.concat([...o.values()].filter(i=>!a.has(i.id)))},S=50,q=()=>dt($(),h),N=document.createElement("div");N.innerHTML=`
    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</div>
      <div class="bpd-tpl" id="bpd-tpl">
        ${e.map((a,i)=>`<label class="bpd-radio">
          <input type="radio" name="bpd-tpl" value="${a.k}"${i===0?" checked":""}>
          <span>${s(a.t)}</span></label>`).join("")}
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
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let H=document.createElement("div");H.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,K({title:d?"Billing PDF APL":"Billing PDF",body:N,footer:H,large:!0,cls:"bpd-modal"});let r=a=>N.querySelector(a),X=r("#bpd-msg"),j=r("#bpd-tb"),rt=r("#bpd-cnt"),P=a=>{X.hidden=!a,X.textContent=a||""},Y=()=>{rt.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+v.size+" \u0E07\u0E32\u0E19";let a=c.map(i=>i.id);r("#bpd-all").checked=a.length>0&&a.every(i=>v.has(i))},U=()=>{j.innerHTML=c.length?c.map(a=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${s(a.id)}"${v.has(a.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${s(f(a.job_no)||"-")}</td>
          <td class="ellip">${s(f(a.customer_name)||"-")}</td>
          <td style="width:130px">${s(f(a.invoice_no)||"-")}</td>
          <td style="width:150px">${s(f(a.house_bl_no)||"-")}</td>
          <td style="width:90px" class="center">${B(a.date)||"-"}</td>
        </tr>`).join(""):'<tr><td class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',Y()},bt=()=>({q:r("#bpd-q").value.trim()||null,from:r("#bpd-from").value||null,to:r("#bpd-to").value||null});async function Q(){if(!p)return;let a=bt(),i=JSON.stringify(a);if(i===b&&m!==!1)return;b=i;let k=J("bpd-cust-opts");Array.isArray(m)||(m=null,G());try{let E=await st({charge:t.charge,group:t.group,filters:a,withKpi:!1,queue:t.queue,scope:t.scope});if(!R("bpd-cust-opts",k))return;let w=E&&Array.isArray(E.customers)?E.customers:[],T=new Map;w.forEach(_=>{_&&_.id&&!T.has(_.id)&&T.set(_.id,{id:_.id,code:_.code||"",name:_.name||"",jobs:Number(_.jobs)||0})}),m=[...T.values()]}catch(E){if(!R("bpd-cust-opts",k))return;m=!1,b=null,V(E,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}G()}let G=()=>{};async function I(){let a=J("bpd");Q(),j.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let i=await et({charge:t.charge,group:t.group,filters:{q:r("#bpd-q").value.trim()||null,from:r("#bpd-from").value||null,to:r("#bpd-to").value||null,customer_ids:[...o.keys()]},page:1,size:ht,withKpi:!1,queue:t.queue,scope:t.scope});if(!R("bpd",a))return;c=i&&i.rows||[],U();let k=Number(i&&i.total||0);P(k>c.length?"\u0E1E\u0E1A "+k+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+c.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(i){if(!R("bpd",a))return;j.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',V(i,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}if(p){let a=r("#bpd-cq"),i=r("#bpd-cust-pop"),k=r("#bpd-cust-cnt"),E=r("#bpd-cust-clear"),w=()=>{let g=o.size;if(k.textContent=g?"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+g+" \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32":"",E.hidden=!g,!u)return;if(m===null||m===!1){i.innerHTML='<div class="bpd-cust-empty">'+(m===null?"\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19...":"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E01\u0E14 \u201C\u0E04\u0E49\u0E19\u0E2B\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")+"</div>";return}let A=q(),C=A.slice(0,S),L=A.length>0&&A.every(y=>o.has(y.id));i.innerHTML=`<label class="bpd-cust-row bpd-cust-head">
          <input type="checkbox" id="bpd-cust-all"${L?" checked":""}>
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14${A.length?" ("+A.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":""}</span></label>`+(A.length>C.length?`<div class="bpd-cust-more">\u0E41\u0E2A\u0E14\u0E07 ${C.length} \u0E08\u0E32\u0E01 ${A.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u201C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u201D \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E31\u0E49\u0E07 ${A.length} \u0E23\u0E32\u0E22</div>`:"")+(C.length?C.map(y=>`<label class="bpd-cust-row">
              <input type="checkbox" data-cid="${s(y.id)}"${o.has(y.id)?" checked":""}>
              <span class="bpd-cust-code">${s(y.code||"-")}</span>
              <span class="bpd-cust-nm" title="${s(y.name||"")}">${s(y.name||"-")}</span>
            </label>`).join(""):'<div class="bpd-cust-empty">'+($().length?"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19":"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E19\u0E35\u0E49")+"</div>")};G=w;let T=()=>{u=!0,i.hidden=!1,a.setAttribute("aria-expanded","true"),w()},_=()=>{u=!1,i.hidden=!0,a.setAttribute("aria-expanded","false")};a.addEventListener("focus",T),a.addEventListener("input",()=>{h=a.value,T()}),a.addEventListener("keydown",g=>{g.key==="Escape"&&(g.preventDefault(),_()),g.key==="Enter"&&g.preventDefault()}),r("#bpd-cust-toggle").onclick=()=>{u?_():(a.focus(),T())},i.addEventListener("change",g=>{let A=g.target.closest("#bpd-cust-all");if(A){q().forEach(y=>{A.checked?o.set(y.id,y):o.delete(y.id)}),w(),z("bpd-cust",I,250);return}let C=g.target.closest("[data-cid]");if(!C)return;let L=$().find(y=>y.id===C.dataset.cid);L&&(C.checked?o.set(L.id,L):o.delete(L.id),w(),z("bpd-cust",I,250))}),i.addEventListener("mousedown",g=>g.preventDefault()),E.onclick=()=>{o.clear(),w(),I()},N.addEventListener("click",g=>{u&&(g.target.closest("#bpd-cust")||_())}),w(),Q()}r("#bpd-go").onclick=I,r("#bpd-q").onkeydown=a=>{a.key==="Enter"&&(a.preventDefault(),I())},r("#bpd-q").addEventListener("input",()=>z("bpd-q",I,300)),r("#bpd-from").onchange=I,r("#bpd-to").onchange=I,j.addEventListener("change",a=>{let i=a.target.closest("[data-bid]");if(!i)return;let k=c.find(E=>E.id===i.dataset.bid);k&&(i.checked?v.set(k.id,k):v.delete(k.id),Y())}),r("#bpd-all").onchange=a=>{c.forEach(i=>{a.target.checked?v.set(i.id,i):v.delete(i.id)}),U()},r("#bpd-clear").onclick=()=>{v.clear(),U()},H.querySelector("#bpd-prev").onclick=()=>{if(!v.size){P("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let a=r("#bpd-contact").value.trim(),i=r("#bpd-tel").value.trim(),k=r("#bpd-dept").value.trim();if(!a||!i||!k){P("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let E=r("#bpd-submit").value,w={contact:a,tel:i,dept:k,today:l,submitDate:E?B(E):l};if(d){let L=r("#bpd-note").value.trim(),y=r("#bpd-date").value;if(!L){P("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Billing Note no. \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}if(!y){P("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}w.noteNo=L,w.aplDate=B(y),w.vendorId=r("#bpd-vendor").value.trim(),w.po=r("#bpd-po").value.trim(),w.ac=r("#bpd-ac").value.trim(),w.cc=r("#bpd-cc").value.trim()}P("");let T=[...v.values()].sort((L,y)=>String(L.date||"").localeCompare(String(y.date||""))||String(L.job_no||"").localeCompare(String(y.job_no||""))),_=N.querySelector('input[name="bpd-tpl"]:checked').value,g=L=>d?ct(T,w,L):(yt[_]||Z)(T,w,L),A=d||_==="general"?ot(g,T.length):g(null),C=d?"BILLING APL \u2014 "+_:"BILLING "+((e.find(L=>L.k===_)||{}).t||"");pt(A,C+"  ("+T.length+" \u0E07\u0E32\u0E19)")}}var Ht={tplGeneral:Z,tplMaersk:it,tplApl:ct,chunkRows:F,wrapFixed:lt,fitPaper:ot,BPD_ROWS_PER_PAGE:O,openPreview:pt};export{M as APL_HEAD,Ht as _tpl,Bt as openBillingPdf};
