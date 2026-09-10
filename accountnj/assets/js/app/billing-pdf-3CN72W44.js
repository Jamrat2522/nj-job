import{a as B}from"./chunk-VQPECVBX.js";import{a as q,b as I,c as H}from"./chunk-OPGKUGLK.js";import{a as P}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-37ELUCVE.js";import{a as D}from"./chunk-DIH2PLYD.js";import{a as E,e as t}from"./chunk-PCFU74ZV.js";var h={issuerName:"N.J.LOGISTICS & FRUITS CO., LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`},U=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"}],K=[{k:"GY",t:"GY"},{k:"W",t:"W"},{k:"NJ",t:"NJ"}],z=100,g=s=>{let d=String(s||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(d)?d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(0,4):""},p=s=>s==null||s===""?"":E(Number(s)||0),x=(s,d)=>s.reduce((o,a)=>o+(Number(a[d])||0),0),c=s=>s==null?"":String(s);function A(s,d){let o=s.map((a,l)=>`<tr>
    <td class="c">${l+1}</td>
    <td>${t(c(a.invoice_no))}</td>
    <td>${t(c(a.master_bl_no))}</td>
    <td>${t(c(a.house_bl_no))}</td>
    <td class="c">${t(c(a.data_type))}</td>
    <td class="ell">${t(c(a.customer_name))}</td>
    <td>${t(c(a.customs_declaration_no))}</td>
    <td>${t(c(a.customer_job_no))}</td>
    <td class="r">${p(a.gross_total)}</td>
    <td class="r">${p(a.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-gen print-area">
    <div class="bpd-top">
      <div>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 : ${t(d.tel)}${d.dept?" &nbsp; "+t(d.dept):""}</div>
      <div>Date: ${t(d.today)}</div>
    </div>
    <div class="bpd-top">
      <div>\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${t(d.contact)}</div>
      <div>Page 1 / 1</div>
    </div>
    <table class="bpd-tb"><thead><tr>
      <th style="width:26px"></th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th><th>Master</th><th>House</th>
      <th style="width:44px">Type</th><th>Exporter</th><th>dcl inv.</th>
      <th>cust. PO no</th><th style="width:78px">\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49</th>
      <th style="width:82px">\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E38\u0E17\u0E18\u0E34</th>
    </tr></thead><tbody>${o}</tbody>
    <tfoot><tr>
      <td colspan="8" class="r t-b">\u0E23\u0E27\u0E21</td>
      <td class="r t-b">${p(x(s,"gross_total"))}</td>
      <td class="r t-b">${p(x(s,"net_payable"))}</td>
    </tr></tfoot></table>
    <div class="bpd-sign2">
      <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48................................................</div>
      <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A......................................</div>
    </div></div>`}function O(s,d){let o=s.map(a=>`<tr>
    <td class="ell">${t(c(a.customer_name))}</td>
    <td></td>
    <td></td>
    <td>${t(c(a.invoice_no))}</td>
    <td class="c">${g(a.invoice_date)}</td>
    <td class="c">${t(d.today)}</td>
    <td></td></tr>`).join("");return`<div class="bpd bpd-mae print-area">
    <div class="bpd-top">
      <div>\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${t(d.contact)} &nbsp; \u0E42\u0E17\u0E23 : ${t(d.tel)}</div>
      <div>\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19 : ${t(d.dept)}</div>
    </div>
    <table class="bpd-tb"><thead><tr>
      <th>Customer Name</th><th style="width:110px">Kewill No.</th>
      <th style="width:110px">Booking No./BL No.</th><th style="width:110px">Invoice No</th>
      <th style="width:80px">Invoice Date</th><th style="width:80px">Scan Date</th>
      <th style="width:90px">Job Owner Code</th>
    </tr></thead><tbody>${o}</tbody></table>
    <div class="bpd-mae-foot">
      <div class="bpd-sign2">
        <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48............................................</div>
        <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A................................</div>
      </div>
      <div class="bpd-mae-box">
        <div class="t-b">Maersk Logistics &amp; Services (Thailand) Co., Ltd.</div>
        <div class="bpd-kv"><span>BILLING INSTRUCTION</span><span>\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</span></div>
        <div class="bpd-kv"><span>Vendor Name</span><span>${t(h.issuerName)}</span></div>
        <div class="bpd-kv"><span>Date of Submit</span><span>${t(d.today)}</span></div>
        <div class="bpd-kv"><span>Original Document</span><span>${t(h.issuerName)}</span></div>
      </div>
    </div></div>`}function R(s,d){let o=s.map((l,b)=>`<tr>
    <td class="c">${g(l.date)}</td>
    <td class="c">${b+1}</td>
    <td>${t(c(l.invoice_no))}</td>
    <td>${t(c(l.master_bl_no))}</td>
    <td>${t(c(l.house_bl_no))}</td>
    <td class="c">${t(c(l.data_type))}</td>
    <td class="ell">${t(c(l.company_invoice))}</td>
    <td>${t(c(l.customs_declaration_no))}</td>
    <td>${t(c(l.customer_job_no))}</td>
    <td class="r">${p(l.service_amount)}</td>
    <td class="r">${p(l.advance_amount)}</td>
    <td class="r">${p(l.vat_amount)}</td>
    <td class="r">${p(l.subtotal)}</td>
    <td class="r">${p(l.wht_amount)}</td>
    <td class="r">${p(l.net_payable)}</td></tr>`).join(""),a=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(l=>`<td class="r t-b">${p(x(s,l))}</td>`).join("");return`<div class="bpd bpd-apl print-area">
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span>${t(h.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span>${t(h.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span>${t(h.issuerTel)}</span></div>
      <div class="bpd-apl-billto">
        <div class="t-b">Bill To.</div>
        <div class="bpd-kv"><span>Text ID no.</span><span>${t(h.textIdNo)}</span></div>
        <div class="bpd-kv"><span>Tax invoice issued under :</span><span>${t(h.issuedUnder)}</span></div>
        <div class="bpd-kv"><span>Name :</span><span>${t(h.billToName)}</span></div>
        <div class="bpd-kv"><span>Address :</span><span>${t(h.billToAddr).replace(/\n/g,"<br>")}</span></div>
      </div>
      <div class="bpd-apl-note">
        <div class="bpd-kv"><span>Billing Note no.</span><span class="t-b">${t(d.noteNo)}</span></div>
        <div class="bpd-kv"><span>Create date.</span><span class="t-b">${t(d.aplDate)}</span></div>
      </div>
      <div class="bpd-top">
        <div>\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${t(d.contact)} &nbsp; \u0E42\u0E17\u0E23 : ${t(d.tel)}</div>
        <div>\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19 : ${t(d.dept)}</div>
      </div>
    </div>
    <table class="bpd-tb bpd-tb-xs"><thead><tr>
      <th>Date</th><th>Item</th><th>Invoice No.</th><th>Master</th><th>House B/l No.</th>
      <th>Data Type</th><th>Company Invoice</th><th>DCL INV.</th><th>Customer Job No.</th>
      <th>Service charge</th><th>Advance</th><th>VAT 7%</th><th>Amount</th>
      <th>WHT 3%</th><th>Total Amout</th>
    </tr></thead><tbody>${o}</tbody>
    <tfoot><tr><td colspan="9" class="r t-b">\u0E23\u0E27\u0E21</td>${a}</tr></tfoot></table>
    <div class="bpd-apl-ft">
      <div class="bpd-apl-ftl">
        <div>VENDOE ID: ${t(d.vendorId)}</div>
        <div>PO. : ${t(d.po)}...........................................................................</div>
        <div>A/C : ${t(d.ac)}...................................C/C ${t(d.cc)}..............................................</div>
        <div>APPROVED BY :\u2026.........................DATE \u2026......./\u2026.........../\u2026......</div>
      </div>
      
      <div class="bpd-apl-sign">
        <div class="bpd-sbox">
          <div>Receive By \u2026............................................................</div>
          <div>Date \u2026......................................................................</div>
          <div class="c">Authorized Signature</div>
        </div>
        <div class="bpd-sbox">
          <div>Receive By \u2026....................................................</div>
          <div>Date \u2026...............................................................</div>
          <div class="c">Authorized Signature</div>
        </div>
      </div>
    </div></div>`}var F={general:A,maersk:O},M="nj-print-doc";function J(){let s=document.body;s.classList.add(M);let d=()=>s.classList.remove(M);window.addEventListener("afterprint",d,{once:!0});try{let o=window.matchMedia("print"),a=l=>{l.matches||(d(),o.removeEventListener("change",a))};o.addEventListener("change",a)}catch{}window.print()}function W(s,d){let o=document.createElement("div");o.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+s+"</div></div>";let a=document.createElement("div");a.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,D({title:d,body:o,footer:a,fullscreen:!0,wide:!0}),a.querySelector("#bpd-print").onclick=()=>J()}function at(s,d){let o=d==="apl",a=o?K:U,l=g(new Date().toISOString().slice(0,10)),b=[],r=new Map,_=document.createElement("div");_.innerHTML=`
    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</div>
      <div class="bpd-tpl" id="bpd-tpl">
        ${a.map((e,n)=>`<label class="bpd-radio">
          <input type="radio" name="bpd-tpl" value="${e.k}"${n===0?" checked":""}>
          <span>${t(e.t)}</span></label>`).join("")}
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
      </div>
      ${o?`<div class="fgrid mt-2">
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
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let N=document.createElement("div");N.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,D({title:o?"Billing PDF APL":"Billing PDF",body:_,footer:N,large:!0});let i=e=>_.querySelector(e),S=i("#bpd-msg"),k=i("#bpd-tb"),j=i("#bpd-cnt"),f=e=>{S.hidden=!e,S.textContent=e||""},C=()=>{j.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+r.size+" \u0E07\u0E32\u0E19";let e=b.map(n=>n.id);i("#bpd-all").checked=e.length>0&&e.every(n=>r.has(n))},T=()=>{k.innerHTML=b.length?b.map(e=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${t(e.id)}"${r.has(e.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${t(c(e.job_no)||"-")}</td>
          <td class="ellip">${t(c(e.customer_name)||"-")}</td>
          <td style="width:130px">${t(c(e.invoice_no)||"-")}</td>
          <td style="width:150px">${t(c(e.house_bl_no)||"-")}</td>
          <td style="width:90px" class="center">${g(e.date)||"-"}</td>
        </tr>`).join(""):'<tr><td class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',C()};async function $(){let e=q("bpd");k.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let n=await B({charge:s.charge,group:s.group,filters:{q:i("#bpd-q").value.trim()||null,from:i("#bpd-from").value||null,to:i("#bpd-to").value||null},page:1,size:z,withKpi:!1,queue:s.queue,scope:s.scope});if(!I("bpd",e))return;b=n&&n.rows||[],T();let v=Number(n&&n.total||0);f(v>b.length?"\u0E1E\u0E1A "+v+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+b.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(n){if(!I("bpd",e))return;k.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',P(n,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}i("#bpd-go").onclick=$,i("#bpd-q").onkeydown=e=>{e.key==="Enter"&&(e.preventDefault(),$())},i("#bpd-q").addEventListener("input",()=>H("bpd-q",$,300)),i("#bpd-from").onchange=$,i("#bpd-to").onchange=$,k.addEventListener("change",e=>{let n=e.target.closest("[data-bid]");if(!n)return;let v=b.find(u=>u.id===n.dataset.bid);v&&(n.checked?r.set(v.id,v):r.delete(v.id),C())}),i("#bpd-all").onchange=e=>{b.forEach(n=>{e.target.checked?r.set(n.id,n):r.delete(n.id)}),T()},i("#bpd-clear").onclick=()=>{r.clear(),T()},N.querySelector("#bpd-prev").onclick=()=>{if(!r.size){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let e=i("#bpd-contact").value.trim(),n=i("#bpd-tel").value.trim(),v=i("#bpd-dept").value.trim();if(!e||!n||!v){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let u={contact:e,tel:n,dept:v,today:l};if(o){let m=i("#bpd-note").value.trim(),y=i("#bpd-date").value;if(!m){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Billing Note no. \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}if(!y){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}u.noteNo=m,u.aplDate=g(y),u.vendorId=i("#bpd-vendor").value.trim(),u.po=i("#bpd-po").value.trim(),u.ac=i("#bpd-ac").value.trim(),u.cc=i("#bpd-cc").value.trim()}f("");let L=[...r.values()].sort((m,y)=>String(m.date||"").localeCompare(String(y.date||""))||String(m.job_no||"").localeCompare(String(y.job_no||""))),w=_.querySelector('input[name="bpd-tpl"]:checked').value,G=o?R(L,u):(F[w]||A)(L,u),V=o?"BILLING APL \u2014 "+w:"BILLING "+((a.find(m=>m.k===w)||{}).t||"");W(G,V+"  ("+L.length+" \u0E07\u0E32\u0E19)")}}var it={tplGeneral:A,tplMaersk:O,tplApl:R};export{h as APL_HEAD,it as _tpl,at as openBillingPdf};
