import{a as Z}from"./chunk-OWSY2KDQ.js";import{a as Y,b as z}from"./chunk-OM6VAH5J.js";import{a as D,e as O}from"./chunk-EJ76MIUN.js";import{a as V}from"./chunk-RGVAFVSR.js";import{w as W}from"./chunk-VQPECVBX.js";import{i as X,r as Q}from"./chunk-A3W3FJZA.js";import{a as A,b as I,e as K,f as G}from"./chunk-OPGKUGLK.js";import{g as q,h as H}from"./chunk-NO6JZBTH.js";import"./chunk-GDT6F23K.js";import{a as C}from"./chunk-YM5GFE6V.js";import{a as F}from"./chunk-OFOOXWUM.js";import{i as k}from"./chunk-37ELUCVE.js";import{a as S}from"./chunk-UWAYW6DC.js";import{a as U,e as J}from"./chunk-ZRPMDTDS.js";import{a as p,c as T,e as r}from"./chunk-PCFU74ZV.js";var tt=t=>k("njacc_list_receipts",t),st=(t,e,d)=>k("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:d});var _=(t,e="-")=>{let d=t==null?"":String(t).trim();return r(d||e)},l=t=>{let e=Number(t);return Number.isFinite(e)?e:0},b=t=>Math.round((l(t)+Number.EPSILON)*100)/100,ot={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},f=t=>`<span class="rcd-ic">${ot[t]||""}</span>`;function dt(t){let e=[],d=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?d.push(s):e.push(s);return{shown:e,excluded:d}}function et(t){let e=l(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let d=b(e-l(t.wht_amount));return d<=0?null:{ratio:l(t.amount)/d,net:d}}function it(t){let e=0,d=0,s=0,m=0,i=0,o=!1,n=new Set,v=new Map;for(let a of t){let x=l(a.amount);e=b(e+x);let g=et(a);if(!g)continue;o=!0,i=b(i+l(a.total_amount)*g.ratio),d=b(d+l(a.subtotal)*g.ratio),s=b(s+l(a.vat_amount)*g.ratio);let M=b(l(a.wht_amount)*g.ratio);m=b(m+M),l(a.vat_rate)>0&&n.add(l(a.vat_rate));let R=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(R&&R.length)for(let $ of R){let B=b(l($.amount)*g.ratio);if(B===0)continue;let P=$.rate===null||$.rate===void 0||$.rate===""?null:l($.rate);v.set(P,b((v.get(P)||0)+B))}else if(M!==0){let $=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:l(a.wht_rate);v.set($,b((v.get($)||0)+M))}}let h=n.size===1?[...n][0]:n.size===0?0:null,c=[...v.keys()],y=c.length===1&&c[0]!==null?c[0]:null;return{total:e,sub:d,vat:s,wht:m,hasTax:o,vatRate:h,whtRate:y,whtBy:v,grossTotal:o?i:e,received:e}}function rt(t){let{shown:e,excluded:d}=dt(t.invoices),s=it(e),m=String(t.status||"").toUpperCase()==="VOID",i=e.length===0?"-":e.length===1?r(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",o=e.map((a,x)=>`<tr>
      <td class="rcd-no">${x+1}</td>
      <td class="rcd-inv">${_(a.invoice_no)}</td>
      <td class="rcd-dt">${a.invoice_date?T(a.invoice_date):"-"}</td>
      <td class="rcd-ds">${_(a.description,"-")}</td>
      <td class="r">${(()=>{let g=et(a);return p(g?b(l(a.total_amount)*g.ratio):a.amount)})()}</td></tr>`).join("")||'<tr><td colspan="5" class="rcd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td></tr>',n=!s.hasTax||s.vatRate===null?"":`${s.vatRate} %`,v=!s.hasTax||s.whtRate===null?"":`${s.whtRate} %`,h=[...(s.whtBy||new Map).entries()],c=a=>a===null?"":" "+(Number.isInteger(a)?String(a):String(b(a)))+" %",y=s.hasTax?h.length===0?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${p(0)}</span></div>`:h.length===1?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${r(c(h[0][0]))}</span>
                 <span>-${p(h[0][1])}</span></div>`:h.sort((a,x)=>(a[0]??1e9)-(x[0]??1e9)).map(([a,x])=>`<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${r(c(a))}</span><span>-${p(x)}</span></div>`).join("")+`<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${p(s.wht)}</span></div>`:'<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>',N=a=>s.hasTax?p(a):"-";return`
    <div class="rcd print-area${m?" rcd-void":""}">
      ${m?'<div class="rcd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${S.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${r(S.nameEn)}</div>
            <div class="rcd-co-ad">${r(S.address)}</div>
            <div class="rcd-co-tl">Tel. ${r(S.tel)} <i>|</i> Fax. ${r(S.fax)}
              <i>|</i> Tax ID ${r(S.taxId)}</div>
          </div>
        </div>
        <div class="rcd-head-r">
          <div class="rcd-title">RECEIPT /<br>\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19</div>
          <div class="rcd-sub">TAX INVOICE / \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35</div>
        </div>
      </header>

      <section class="rcd-cards">
        <div class="rcd-card">
          <div class="rcd-card-t">${f("user")}CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${f("user")}<div class="rcd-fb">
              <label>Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32:</label>
              <div class="v v-b">${_(t.customer_name)}</div></div></div>
            <div class="rcd-f">${f("tax")}<div class="rcd-fb rcd-2col">
              <div><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35:</label>
                <div class="v v-b">${_(t.customer_tax_id)}</div></div>
              <div><label>Branch / \u0E2A\u0E32\u0E02\u0E32:</label>
                <div class="v v-b">${_(t.customer_branch_code)}</div></div>
            </div></div>
            <div class="rcd-f">${f("pin")}<div class="rcd-fb">
              <label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48:</label>
              <div class="v">${_(t.customer_address,"")}</div></div></div>
            <div class="rcd-f rcd-f-last">${f("tel")}<div class="rcd-fb">
              <label>Tel. / \u0E42\u0E17\u0E23.:</label>
              <div class="v v-b">${_(t.customer_phone)}</div></div></div>
          </div>
        </div>
        <div class="rcd-card">
          <div class="rcd-card-t">${f("rc")}RECEIPT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${f("rc")}<div class="rcd-fb rcd-kv">
              <label>Receipt No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${_(t.receipt_no)}</div></div></div>
            <div class="rcd-f">${f("cal")}<div class="rcd-fb rcd-kv">
              <label>Receipt Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${T(t.receipt_date)}</div></div></div>
            <div class="rcd-f rcd-f-last">${f("ref")}<div class="rcd-fb">
              <label>Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49:</label>
              <div class="v v-b v-md">${i}</div></div></div>
          </div>
        </div>
      </section>

      <section class="rcd-tblwrap">
        <div class="rcd-tbl-t">INVOICE REFERENCE / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div>
        <table class="rcd-tbl">
          <colgroup><col class="w-no"><col class="w-inv"><col class="w-dt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="c">No.</th>
            <th>Invoice No. /<small>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</small></th>
            <th>Invoice Date /<small>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</small></th>
            <th>Description /<small>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</small></th>
            <th class="r">Amount (THB) /<small>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)</small></th>
          </tr></thead>
          <tbody>${o}</tbody>
          <tfoot><tr class="rcd-trow">
            <td colspan="4" class="r">Total Amount / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td>
            <!-- FIX: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 GROSS \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Amount \u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27
                 \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E0A\u0E49 S.total \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E08\u0E23\u0E34\u0E07 (\u0E2B\u0E31\u0E01 WHT \u0E41\u0E25\u0E49\u0E27)
                 -> \u0E41\u0E16\u0E27\u0E23\u0E27\u0E21 1,605.00 \u0E41\u0E15\u0E48 Footer \u0E42\u0E0A\u0E27\u0E4C 1,560.00 \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07
                 S.grossTotal = \u03A3 (invoice.total_amount \xD7 ratio) \u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07
                 = \u0E1C\u0E25\u0E23\u0E27\u0E21 Amount \u0E02\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E40\u0E1B\u0E4A\u0E30 \u0E46
                 *** AMOUNT RECEIVED \u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19 Net Cash \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 *** -->
            <td class="r rcd-trow-g">${p(s.grossTotal)}</td>
          </tr></tfoot>
        </table>
        ${d.length?`<div class="rcd-note">* \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (Advance) \u0E08\u0E33\u0E19\u0E27\u0E19
          ${d.length} \u0E43\u0E1A \u2014 \u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Advance \u0E41\u0E22\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01</div>`:""}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${f("abc")}<span>Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</span></div>
          <div class="rcd-w-v">(${r(Z(s.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${n?" "+n:""}</span><span>${N(s.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${n?" "+n:""}</span><span>${N(s.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${p(s.grossTotal)}</span></div>
          ${y}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E2A\u0E38\u0E17\u0E18\u0E34</i></span>
            <span>${p(s.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`}function at(t,{print:e=!1}={}){let d=document.createElement("div");d.innerHTML=rt(t);let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">\u{1F5A8} Print Receipt</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,U({title:"\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 "+(t.receipt_no||""),body:d,footer:s,fullscreen:!0,wide:!0}),s.querySelector("#rcd-print").onclick=()=>window.print(),e&&setTimeout(()=>window.print(),60)}function L(t){at(t)}var u={customer:"",from:"",to:"",page:1,size:20},E="pending",w={customer:"",q:"",page:1,size:20};async function ct(t){await X(),t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 / \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</h2></div>
      ${q("receive_payment")?'<button class="btn btn-p" id="rc-new">+ \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</button>':""}</div>
    <div class="rep-tabs">
      <button class="rep-tab ${E==="pending"?"active":""}" data-rtab="pending">\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</button>
      <button class="rep-tab ${E==="issued"?"active":""}" data-rtab="issued">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27</button>
    </div>
    <div id="rc-pending" ${E==="pending"?"":"hidden"}>
      <!-- Main List Container \u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 Filter + Table + Empty State + Total + Pagination -->
      <div class="ch-panel">
      <div class="fbar">
        <input class="inp" data-pf="q" value="${r(w.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19">
        <button class="btn btn-o btn-sm" id="rp-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
      <div class="card mt-2" id="rp-pgn"></div>
      <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>Customer Job No.</th>
        <th>Due Date</th><th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th>
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div>
      </div>
    </div>
    <div id="rc-issued" ${E==="issued"?"":"hidden"}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${Q(u.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${u.from}">
      <input class="inp" type="date" data-f="to" value="${u.to}">
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
    <div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A</th><th>INVOICE \u0E17\u0E35\u0E48\u0E15\u0E31\u0E14</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,Y(t),t.querySelector(".rep-tabs").addEventListener("click",o=>{let n=o.target.closest("[data-rtab]");!n||n.dataset.rtab===E||(E=n.dataset.rtab,ct(t))});let e=t.querySelector('[data-pf="q"]');e&&(t.querySelector("#rp-go").onclick=()=>{w.q=e.value.trim(),w.page=1,j(t)}),E==="pending"&&j(t);let d=t.querySelector("#rc-new");d&&(d.onclick=()=>location.hash="#/receipts/new");async function s(){let o=A("receipts");try{let n=await tt({p_customer:u.customer||null,p_from:u.from||null,p_to:u.to||null,p_page:u.page,p_size:u.size});if(!I("receipts",o))return;let v=t.querySelector("#rc-tbody"),h=n.rows||[];v.innerHTML=h.length?h.map(c=>`<tr data-rc='${JSON.stringify(c).replace(/'/g,"&#39;")}'>
        <td class="t-b">${r(c.receipt_no)}</td><td>${T(c.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${r(c.customer_name)}</td>
        <td>${r(c.method||"-")}</td>
        <td class="r t-b">${p(c.total_received)}</td>
        <td class="t-xs">${(c.invoices||[]).map(y=>r(y.invoice_no)).join(", ")}</td>
        <td>${c.status==="VOID"?'<span class="bdg bdg-void">VOID</span>':'<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(c).replace(/'/g,"&#39;")}'>\u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${c.status!=="VOID"&&(H()||q("void"))?`<button class="btn btn-danger btn-sm" data-void="${c.id}" data-no="${r(c.receipt_no)}">Void</button>`:""}
        </div></td></tr>`).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',V(t.querySelector("#rc-pgn"),{page:u.page,size:u.size,total:n.total||0},({page:c,size:y})=>{u.page=c,u.size=y,s()},{lp:!0}),z(),t.__njCols&&t.__njCols.issued()}catch(n){I("receipts",o)&&C(n)}}t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(o=>u[o.dataset.f]=o.value),u.page=1,s()};function m(){let o=t.querySelector("#rp-tbody");O({table:o&&o.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function i(){let o=t.querySelector("#rc-tbody");O({table:o&&o.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED",host:t.querySelector("#rc-issued .fbar")})}t.__njCols={pending:m,issued:i},m(),i(),D(t.querySelector("#rc-tbody"),o=>{o.dataset.rc&&L(JSON.parse(o.dataset.rc))}),t.querySelector("#rc-tbody").addEventListener("click",async o=>{let n=o.target.closest("[data-print]");if(n){L(JSON.parse(n.dataset.print));return}let v=o.target.closest("[data-void]");if(v){let h=await J("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+v.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!h)return;try{await K("void-rc-"+v.dataset.void,()=>st(v.dataset.void,h,G())),F("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),s()}catch(c){C(c)}}}),s()}async function j(t){let e=t.querySelector("#rp-tbody");if(!e)return;let d=A("rc-pending");try{let s=await W({company_group:"NJ",q:w.q||null,customer_id:w.customer||null,page:w.page,size:w.size});if(!I("rc-pending",d))return;let m=s&&s.rows||[];e.innerHTML=m.map(i=>`<tr data-inv="${r(i.invoice_id)}">
      <td class="t-b">${r(i.invoice_no||"-")}</td>
      <td class="nowrap">${T(i.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${r(i.customer_name||"")}">${r(i.customer_name||"-")}</td>
      <td>${r(i.job_no||"-")}</td>
      <td>${r(i.customer_job_no||"-")}</td>
      <td class="nowrap">${T(i.due_date)}</td>
      <td class="r">${p(Number(i.total_amount)-Number(i.wht_amount))}</td>
      <td class="r t-b">${p(i.outstanding)}</td>
    </tr>`).join("")||'<tr><td colspan="8" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>',D(e,i=>{let o=i.dataset.inv;if(o){try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+o}}),V(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:i,size:o})=>{w.page=i,w.size=o,j(t)},{lp:!0}),z(),t.__njCols&&t.__njCols.pending()}catch(s){I("rc-pending",d)&&C(s)}}export{ct as render};
