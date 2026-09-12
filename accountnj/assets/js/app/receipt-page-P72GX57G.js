import{a as ot}from"./chunk-OWSY2KDQ.js";import{a as et,b as H}from"./chunk-OM6VAH5J.js";import{a as z,e as L}from"./chunk-EAYNJMXQ.js";import{a as B}from"./chunk-GP2PDPK5.js";import{j as tt,s as st}from"./chunk-U5EIDOXC.js";import{g as q,h as K}from"./chunk-NO6JZBTH.js";import{a as V}from"./chunk-GDT6F23K.js";import{w as Z}from"./chunk-26EE6XNU.js";import{a as U,b as x,e as P,f as j}from"./chunk-OPGKUGLK.js";import{a as S}from"./chunk-YM5GFE6V.js";import{a as T}from"./chunk-OFOOXWUM.js";import{k as at}from"./chunk-DSAOPM5I.js";import{i as D}from"./chunk-F5ETAYOF.js";import{a as N}from"./chunk-UWAYW6DC.js";import{a as X,d as Q,e as Y}from"./chunk-DIH2PLYD.js";import{a as v,c as C,e as r}from"./chunk-PCFU74ZV.js";var it=t=>D("njacc_list_receipts",t),ct=(t,e,o)=>D("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:o});var _=(t,e="-")=>{let o=t==null?"":String(t).trim();return r(o||e)},l=t=>{let e=Number(t);return Number.isFinite(e)?e:0},m=t=>Math.round((l(t)+Number.EPSILON)*100)/100,nt={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},f=t=>`<span class="rcd-ic">${nt[t]||""}</span>`;function lt(t){let e=[],o=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?o.push(s):e.push(s);return{shown:e,excluded:o}}function rt(t){let e=l(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let o=m(e-l(t.wht_amount));return o<=0?null:{ratio:l(t.amount)/o,net:o}}function pt(t){let e=0,o=0,s=0,h=0,c=0,i=!1,n=new Set,p=new Map;for(let a of t){let I=l(a.amount);e=m(e+I);let g=rt(a);if(!g)continue;i=!0,c=m(c+l(a.total_amount)*g.ratio),o=m(o+l(a.subtotal)*g.ratio),s=m(s+l(a.vat_amount)*g.ratio);let k=m(l(a.wht_amount)*g.ratio);h=m(h+k),l(a.vat_rate)>0&&n.add(l(a.vat_rate));let O=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(O&&O.length)for(let $ of O){let J=m(l($.amount)*g.ratio);if(J===0)continue;let W=$.rate===null||$.rate===void 0||$.rate===""?null:l($.rate);p.set(W,m((p.get(W)||0)+J))}else if(k!==0){let $=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:l(a.wht_rate);p.set($,m((p.get($)||0)+k))}}let b=n.size===1?[...n][0]:n.size===0?0:null,d=[...p.keys()],y=d.length===1&&d[0]!==null?d[0]:null;return{total:e,sub:o,vat:s,wht:h,hasTax:i,vatRate:b,whtRate:y,whtBy:p,grossTotal:i?c:e,received:e}}function vt(t){let{shown:e,excluded:o}=lt(t.invoices),s=pt(e),h=String(t.status||"").toUpperCase()==="VOID",c=e.length===0?"-":e.length===1?r(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",i=e.map((a,I)=>`<tr>
      <td class="rcd-no">${I+1}</td>
      <td class="rcd-inv">${_(a.invoice_no)}</td>
      <td class="rcd-dt">${a.invoice_date?C(a.invoice_date):"-"}</td>
      <td class="rcd-ds">${_(a.description,"-")}</td>
      <td class="r">${(()=>{let g=rt(a);return v(g?m(l(a.total_amount)*g.ratio):a.amount)})()}</td></tr>`).join("")||'<tr><td colspan="5" class="rcd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td></tr>',n=!s.hasTax||s.vatRate===null?"":`${s.vatRate} %`,p=!s.hasTax||s.whtRate===null?"":`${s.whtRate} %`,b=[...(s.whtBy||new Map).entries()],d=a=>a===null?"":" "+(Number.isInteger(a)?String(a):String(m(a)))+" %",y=s.hasTax?b.length===0?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${v(0)}</span></div>`:b.length===1?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${r(d(b[0][0]))}</span>
                 <span>-${v(b[0][1])}</span></div>`:b.sort((a,I)=>(a[0]??1e9)-(I[0]??1e9)).map(([a,I])=>`<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${r(d(a))}</span><span>-${v(I)}</span></div>`).join("")+`<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${v(s.wht)}</span></div>`:'<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>',R=a=>s.hasTax?v(a):"-";return`
    <div class="rcd print-area${h?" rcd-void":""}">
      ${h?'<div class="rcd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${N.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${r(N.nameEn)}</div>
            <div class="rcd-co-ad">${r(N.address)}</div>
            <div class="rcd-co-tl">Tel. ${r(N.tel)} <i>|</i> Fax. ${r(N.fax)}
              <i>|</i> Tax ID ${r(N.taxId)}</div>
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
              <div class="v v-b v-lg">${C(t.receipt_date)}</div></div></div>
            <div class="rcd-f rcd-f-last">${f("ref")}<div class="rcd-fb">
              <label>Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49:</label>
              <div class="v v-b v-md">${c}</div></div></div>
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
          <tbody>${i}</tbody>
          <tfoot><tr class="rcd-trow">
            <td colspan="4" class="r">Total Amount / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td>
            <!-- FIX: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 GROSS \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Amount \u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27
                 \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E0A\u0E49 S.total \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E08\u0E23\u0E34\u0E07 (\u0E2B\u0E31\u0E01 WHT \u0E41\u0E25\u0E49\u0E27)
                 -> \u0E41\u0E16\u0E27\u0E23\u0E27\u0E21 1,605.00 \u0E41\u0E15\u0E48 Footer \u0E42\u0E0A\u0E27\u0E4C 1,560.00 \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07
                 S.grossTotal = \u03A3 (invoice.total_amount \xD7 ratio) \u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07
                 = \u0E1C\u0E25\u0E23\u0E27\u0E21 Amount \u0E02\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E40\u0E1B\u0E4A\u0E30 \u0E46
                 *** AMOUNT RECEIVED \u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19 Net Cash \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 *** -->
            <td class="r rcd-trow-g">${v(s.grossTotal)}</td>
          </tr></tfoot>
        </table>
        ${o.length?`<div class="rcd-note">* \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (Advance) \u0E08\u0E33\u0E19\u0E27\u0E19
          ${o.length} \u0E43\u0E1A \u2014 \u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Advance \u0E41\u0E22\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01</div>`:""}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${f("abc")}<span>Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</span></div>
          <div class="rcd-w-v">(${r(ot(s.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${n?" "+n:""}</span><span>${R(s.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${n?" "+n:""}</span><span>${R(s.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${v(s.grossTotal)}</span></div>
          ${y}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E2A\u0E38\u0E17\u0E18\u0E34</i></span>
            <span>${v(s.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`}function dt(t,{print:e=!1}={}){let o=document.createElement("div");o.innerHTML=vt(t);let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">\u{1F5A8} Print Receipt</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,X({title:"\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 "+(t.receipt_no||""),body:o,footer:s,fullscreen:!0,wide:!0}),s.querySelector("#rcd-print").onclick=()=>window.print(),e&&setTimeout(()=>window.print(),60)}function F(t){dt(t)}var u={customer:"",from:"",to:"",page:1,size:20},E="pending",M=()=>String(V.profile&&V.profile.role)==="SUPER_ADMIN",G=null,w={customer:"",q:"",page:1,size:20};async function ut(t){await tt(),t.innerHTML=`
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
        ${M()?'<th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>':""}
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="${M()?9:8}" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div>
      </div>
    </div>
    <div id="rc-issued" ${E==="issued"?"":"hidden"}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${st(u.customer)}</select>
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
    </div>`,et(t),t.querySelector(".rep-tabs").addEventListener("click",i=>{let n=i.target.closest("[data-rtab]");!n||n.dataset.rtab===E||(E=n.dataset.rtab,ut(t))});let e=t.querySelector('[data-pf="q"]');e&&(t.querySelector("#rp-go").onclick=()=>{w.q=e.value.trim(),w.page=1,A(t)}),E==="pending"&&A(t);let o=t.querySelector("#rc-new");o&&(o.onclick=()=>location.hash="#/receipts/new");async function s(){let i=U("receipts");try{let n=await it({p_customer:u.customer||null,p_from:u.from||null,p_to:u.to||null,p_page:u.page,p_size:u.size});if(!x("receipts",i))return;let p=t.querySelector("#rc-tbody"),b=n.rows||[];p.innerHTML=b.length?b.map(d=>`<tr data-rc='${JSON.stringify(d).replace(/'/g,"&#39;")}'>
        <td class="t-b">${r(d.receipt_no)}</td><td>${C(d.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${r(d.customer_name)}</td>
        <td>${r(d.method||"-")}</td>
        <td class="r t-b">${v(d.total_received)}</td>
        <td class="t-xs">${(d.invoices||[]).map(y=>r(y.invoice_no)).join(", ")}</td>
        <td>${d.status==="VOID"?'<span class="bdg bdg-void">VOID</span>':'<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(d).replace(/'/g,"&#39;")}'>\u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${d.status!=="VOID"&&(K()||q("void"))?`<button class="btn btn-danger btn-sm" data-void="${d.id}" data-no="${r(d.receipt_no)}">Void</button>`:""}
        </div></td></tr>`).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',B(t.querySelector("#rc-pgn"),{page:u.page,size:u.size,total:n.total||0},({page:d,size:y})=>{u.page=d,u.size=y,s()},{lp:!0}),H(),t.__njCols&&t.__njCols.issued()}catch(n){x("receipts",i)&&S(n)}}t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(i=>u[i.dataset.f]=i.value),u.page=1,s()};function h(){let i=t.querySelector("#rp-tbody");L({table:i&&i.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function c(){let i=t.querySelector("#rc-tbody");L({table:i&&i.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED",host:t.querySelector("#rc-issued .fbar")})}t.__njCols={pending:h,issued:c},h(),c(),z(t.querySelector("#rc-tbody"),i=>{i.dataset.rc&&F(JSON.parse(i.dataset.rc))}),t.querySelector("#rc-tbody").addEventListener("click",async i=>{let n=i.target.closest("[data-print]");if(n){F(JSON.parse(n.dataset.print));return}let p=i.target.closest("[data-void]");if(p){let b=await Y("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+p.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!b)return;try{await P("void-rc-"+p.dataset.void,()=>ct(p.dataset.void,b,j())),T("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),s()}catch(d){S(d)}}}),s()}async function A(t){let e=t.querySelector("#rp-tbody");if(!e)return;G=t;let o=U("rc-pending");try{let s=await Z({company_group:"NJ",q:w.q||null,customer_id:w.customer||null,page:w.page,size:w.size});if(!x("rc-pending",o))return;let h=s&&s.rows||[];e.innerHTML=h.map(c=>`<tr data-inv="${r(c.invoice_id)}">
      <td class="t-b">${r(c.invoice_no||"-")}</td>
      <td class="nowrap">${C(c.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${r(c.customer_name||"")}">${r(c.customer_name||"-")}</td>
      <td>${r(c.job_no||"-")}</td>
      <td>${r(c.customer_job_no||"-")}</td>
      <td class="nowrap">${C(c.due_date)}</td>
      <td class="r">${v(Number(c.total_amount)-Number(c.wht_amount))}</td>
      <td class="r t-b">${v(c.outstanding)}</td>
      ${M()?`<td class="center"><button type="button" class="btn btn-o btn-sm" data-backacc
            data-inv="${r(c.invoice_id)}" data-no="${r(c.invoice_no||"")}"
            title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING &gt; SERVICE \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21"
            >\u21A9 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING</button></td>`:""}
    </tr>`).join("")||`<tr><td colspan="${M()?9:8}" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>`,e.addEventListener("click",bt),z(e,c=>{let i=c.dataset.inv;if(i){try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+i}}),B(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:c,size:i})=>{w.page=c,w.size=i,A(t)},{lp:!0}),H(),t.__njCols&&t.__njCols.pending()}catch(s){x("rc-pending",o)&&S(s)}}async function bt(t){let e=t.target.closest("[data-backacc]");if(!e)return;if(t.preventDefault(),t.stopPropagation(),!M()){T("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let o=e.dataset.inv;if(!o){T("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let s=e.dataset.no||"";if(await Q("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(s?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+r(s)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>ACCOUNTING &gt; SERVICE</b>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await P("backacc-"+o,()=>at(o,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",j())),T("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48","ok"),G&&A(G)}catch(c){S(c)}}export{ut as render};
