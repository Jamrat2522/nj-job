import{a as dt}from"./chunk-OWSY2KDQ.js";import{c as st,d as et,e as rt}from"./chunk-B6SMZS6D.js";import{a as it,b as F}from"./chunk-OM6VAH5J.js";import{a as j,e as z}from"./chunk-EAYNJMXQ.js";import{a as H}from"./chunk-GP2PDPK5.js";import"./chunk-ZOQ7UZZT.js";import"./chunk-A35DGUS4.js";import"./chunk-73NITRGV.js";import{j as at,s as ot}from"./chunk-U5EIDOXC.js";import{g as N,h as X}from"./chunk-NO6JZBTH.js";import"./chunk-Q7FMECGI.js";import{a as L}from"./chunk-GDT6F23K.js";import{w as tt}from"./chunk-26EE6XNU.js";import{a as P,b as R,e as U,f as B}from"./chunk-OPGKUGLK.js";import{a as M}from"./chunk-YM5GFE6V.js";import{a as k}from"./chunk-OFOOXWUM.js";import{k as ct}from"./chunk-DSAOPM5I.js";import{i as V}from"./chunk-F5ETAYOF.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as Q,d as Y,e as Z}from"./chunk-DIH2PLYD.js";import{a as p,c as S,e as c}from"./chunk-PCFU74ZV.js";var nt=t=>V("njacc_list_receipts",t),lt=(t,e,r)=>V("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:r});var I=(t,e="-")=>{let r=t==null?"":String(t).trim();return c(r||e)},l=t=>{let e=Number(t);return Number.isFinite(e)?e:0},f=t=>Math.round((l(t)+Number.EPSILON)*100)/100,ut={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},w=t=>`<span class="rcd-ic">${ut[t]||""}</span>`;function ht(t){let e=[],r=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?r.push(s):e.push(s);return{shown:e,excluded:r}}function pt(t){let e=l(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let r=f(e-l(t.wht_amount));return r<=0?null:{ratio:l(t.amount)/r,net:r}}function bt(t){let e=0,r=0,s=0,m=0,o=0,u=!1,h=new Set,i=new Map;for(let a of t){let E=l(a.amount);e=f(e+E);let $=pt(a);if(!$)continue;u=!0,o=f(o+l(a.total_amount)*$.ratio),r=f(r+l(a.subtotal)*$.ratio),s=f(s+l(a.vat_amount)*$.ratio);let q=f(l(a.wht_amount)*$.ratio);m=f(m+q),l(a.vat_rate)>0&&h.add(l(a.vat_rate));let D=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(D&&D.length)for(let C of D){let W=f(l(C.amount)*$.ratio);if(W===0)continue;let K=C.rate===null||C.rate===void 0||C.rate===""?null:l(C.rate);i.set(K,f((i.get(K)||0)+W))}else if(q!==0){let C=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:l(a.wht_rate);i.set(C,f((i.get(C)||0)+q))}}let d=h.size===1?[...h][0]:h.size===0?0:null,b=[...i.keys()],_=b.length===1&&b[0]!==null?b[0]:null;return{total:e,sub:r,vat:s,wht:m,hasTax:u,vatRate:d,whtRate:_,whtBy:i,grossTotal:u?o:e,received:e}}function mt(t){let{shown:e,excluded:r}=ht(t.invoices),s=bt(e),m=String(t.status||"").toUpperCase()==="VOID",o=e.length===0?"-":e.length===1?c(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",u=e.map((a,E)=>`<tr>
      <td class="rcd-no">${E+1}</td>
      <td class="rcd-inv">${I(a.invoice_no)}</td>
      <td class="rcd-dt">${a.invoice_date?S(a.invoice_date):"-"}</td>
      <td class="rcd-ds">${I(a.description,"-")}</td>
      <td class="r">${(()=>{let $=pt(a);return p($?f(l(a.total_amount)*$.ratio):a.amount)})()}</td></tr>`).join("")||'<tr><td colspan="5" class="rcd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td></tr>',h=!s.hasTax||s.vatRate===null?"":`${s.vatRate} %`,i=!s.hasTax||s.whtRate===null?"":`${s.whtRate} %`,d=[...(s.whtBy||new Map).entries()],b=a=>a===null?"":" "+(Number.isInteger(a)?String(a):String(f(a)))+" %",_=s.hasTax?d.length===0?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${p(0)}</span></div>`:d.length===1?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${c(b(d[0][0]))}</span>
                 <span>-${p(d[0][1])}</span></div>`:d.sort((a,E)=>(a[0]??1e9)-(E[0]??1e9)).map(([a,E])=>`<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${c(b(a))}</span><span>-${p(E)}</span></div>`).join("")+`<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${p(s.wht)}</span></div>`:'<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>',n=a=>s.hasTax?p(a):"-";return`
    <div class="rcd print-area${m?" rcd-void":""}">
      ${m?'<div class="rcd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${x.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${c(x.nameEn)}</div>
            <div class="rcd-co-ad">${c(x.address)}</div>
            <div class="rcd-co-tl">Tel. ${c(x.tel)} <i>|</i> Fax. ${c(x.fax)}
              <i>|</i> Tax ID ${c(x.taxId)}</div>
          </div>
        </div>
        <div class="rcd-head-r">
          <div class="rcd-title">RECEIPT /<br>\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19</div>
          <div class="rcd-sub">TAX INVOICE / \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35</div>
        </div>
      </header>

      <section class="rcd-cards">
        <div class="rcd-card">
          <div class="rcd-card-t">${w("user")}CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${w("user")}<div class="rcd-fb">
              <label>Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32:</label>
              <div class="v v-b">${I(t.customer_name)}</div></div></div>
            <div class="rcd-f">${w("tax")}<div class="rcd-fb rcd-2col">
              <div><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35:</label>
                <div class="v v-b">${I(t.customer_tax_id)}</div></div>
              <div><label>Branch / \u0E2A\u0E32\u0E02\u0E32:</label>
                <div class="v v-b">${I(t.customer_branch_code)}</div></div>
            </div></div>
            <div class="rcd-f">${w("pin")}<div class="rcd-fb">
              <label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48:</label>
              <div class="v">${I(t.customer_address,"")}</div></div></div>
            <div class="rcd-f rcd-f-last">${w("tel")}<div class="rcd-fb">
              <label>Tel. / \u0E42\u0E17\u0E23.:</label>
              <div class="v v-b">${I(t.customer_phone)}</div></div></div>
          </div>
        </div>
        <div class="rcd-card">
          <div class="rcd-card-t">${w("rc")}RECEIPT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${w("rc")}<div class="rcd-fb rcd-kv">
              <label>Receipt No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${I(t.receipt_no)}</div></div></div>
            <div class="rcd-f">${w("cal")}<div class="rcd-fb rcd-kv">
              <label>Receipt Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${S(t.receipt_date)}</div></div></div>
            <div class="rcd-f rcd-f-last">${w("ref")}<div class="rcd-fb">
              <label>Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49:</label>
              <div class="v v-b v-md">${o}</div></div></div>
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
          <tbody>${u}</tbody>
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
        ${r.length?`<div class="rcd-note">* \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (Advance) \u0E08\u0E33\u0E19\u0E27\u0E19
          ${r.length} \u0E43\u0E1A \u2014 \u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Advance \u0E41\u0E22\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01</div>`:""}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${w("abc")}<span>Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</span></div>
          <div class="rcd-w-v">(${c(dt(s.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${h?" "+h:""}</span><span>${n(s.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${h?" "+h:""}</span><span>${n(s.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${p(s.grossTotal)}</span></div>
          ${_}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E2A\u0E38\u0E17\u0E18\u0E34</i></span>
            <span>${p(s.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`}function vt(t,{print:e=!1}={}){let r=document.createElement("div");r.innerHTML=mt(t);let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">\u{1F5A8} Print Receipt</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,Q({title:"\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 "+(t.receipt_no||""),body:r,footer:s,fullscreen:!0,wide:!0}),s.querySelector("#rcd-print").onclick=()=>window.print(),e&&setTimeout(()=>window.print(),60)}function G(t){vt(t)}var v={customer:"",from:"",to:"",page:1,size:20},T="pending",O=()=>String(L.profile&&L.profile.role)==="SUPER_ADMIN",J=null,y={customer:"",q:"",page:1,size:20},g={charge:"SERVICE",group:"NJ",queue:"receipt_active"},ft=()=>({view:N("view",g.charge,g.group),create:N("create",g.charge,g.group),edit:N("edit",g.charge,g.group),export:N("export",g.charge,g.group)});async function gt(t){await at(),t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 / \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</h2></div>
      ${N("receive_payment")?'<button class="btn btn-p" id="rc-new">+ \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</button>':""}</div>
    
    ${st(g.charge,g.group,ft(),"receipt")}
    <div class="rep-tabs">
      <button class="rep-tab ${T==="pending"?"active":""}" data-rtab="pending">\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</button>
      <button class="rep-tab ${T==="issued"?"active":""}" data-rtab="issued">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27</button>
    </div>
    <div id="rc-pending" ${T==="pending"?"":"hidden"}>
      <!-- Main List Container \u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 Filter + Table + Empty State + Total + Pagination -->
      <div class="ch-panel">
      <div class="fbar">
        <input class="inp" data-pf="q" value="${c(y.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19">
        <button class="btn btn-o btn-sm" id="rp-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
      <div class="card mt-2" id="rp-pgn"></div>
      <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>Customer Job No.</th>
        <th>Due Date</th><th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th>
        ${O()?'<th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>':""}
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="${O()?9:8}" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div>
      </div>
    </div>
    <div id="rc-issued" ${T==="issued"?"":"hidden"}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${ot(v.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${v.from}">
      <input class="inp" type="date" data-f="to" value="${v.to}">
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
    <div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A</th><th>INVOICE \u0E17\u0E35\u0E48\u0E15\u0E31\u0E14</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,it(t);let e=t.querySelector(".ch-tools");e&&et(e);let r={...g,scope:null,mode:"receipt",importMode:"accounting",filters:{},refresh:()=>{T==="pending"?A(t):o()}};t.dataset.chPage="finance-receipt",t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=i=>{if(t.dataset.chPage!=="finance-receipt")return;let d=i.target.closest("[data-tool]");d&&rt(d.dataset.tool,r)},t.addEventListener("click",t.__njToolClick),t.querySelector(".rep-tabs").addEventListener("click",i=>{let d=i.target.closest("[data-rtab]");!d||d.dataset.rtab===T||(T=d.dataset.rtab,gt(t))});let s=t.querySelector('[data-pf="q"]');s&&(t.querySelector("#rp-go").onclick=()=>{y.q=s.value.trim(),y.page=1,A(t)}),T==="pending"&&A(t);let m=t.querySelector("#rc-new");m&&(m.onclick=()=>location.hash="#/receipts/new");async function o(){let i=P("receipts");try{let d=await nt({p_customer:v.customer||null,p_from:v.from||null,p_to:v.to||null,p_page:v.page,p_size:v.size});if(!R("receipts",i))return;let b=t.querySelector("#rc-tbody"),_=d.rows||[];b.innerHTML=_.length?_.map(n=>`<tr data-rc='${JSON.stringify(n).replace(/'/g,"&#39;")}'>
        <td class="t-b">${c(n.receipt_no)}</td><td>${S(n.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${c(n.customer_name)}</td>
        <td>${c(n.method||"-")}</td>
        <td class="r t-b">${p(n.total_received)}</td>
        <td class="t-xs">${(n.invoices||[]).map(a=>c(a.invoice_no)).join(", ")}</td>
        <td>${n.status==="VOID"?'<span class="bdg bdg-void">VOID</span>':'<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(n).replace(/'/g,"&#39;")}'>\u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${n.status!=="VOID"&&(X()||N("void"))?`<button class="btn btn-danger btn-sm" data-void="${n.id}" data-no="${c(n.receipt_no)}">Void</button>`:""}
        </div></td></tr>`).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',H(t.querySelector("#rc-pgn"),{page:v.page,size:v.size,total:d.total||0},({page:n,size:a})=>{v.page=n,v.size=a,o()},{lp:!0}),F(),t.__njCols&&t.__njCols.issued()}catch(d){R("receipts",i)&&M(d)}}t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(i=>v[i.dataset.f]=i.value),v.page=1,o()};function u(){let i=t.querySelector("#rp-tbody");z({table:i&&i.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function h(){let i=t.querySelector("#rc-tbody");z({table:i&&i.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED",host:t.querySelector("#rc-issued .fbar")})}t.__njCols={pending:u,issued:h},u(),h(),j(t.querySelector("#rc-tbody"),i=>{i.dataset.rc&&G(JSON.parse(i.dataset.rc))}),t.querySelector("#rc-tbody").addEventListener("click",async i=>{let d=i.target.closest("[data-print]");if(d){G(JSON.parse(d.dataset.print));return}let b=i.target.closest("[data-void]");if(b){let _=await Z("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+b.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!_)return;try{await U("void-rc-"+b.dataset.void,()=>lt(b.dataset.void,_,B())),k("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),o()}catch(n){M(n)}}}),o()}async function A(t){let e=t.querySelector("#rp-tbody");if(!e)return;J=t;let r=P("rc-pending");try{let s=await tt({company_group:"NJ",q:y.q||null,customer_id:y.customer||null,page:y.page,size:y.size});if(!R("rc-pending",r))return;let m=s&&s.rows||[];e.innerHTML=m.map(o=>`<tr data-inv="${c(o.invoice_id)}">
      <td class="t-b">${c(o.invoice_no||"-")}</td>
      <td class="nowrap">${S(o.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${c(o.customer_name||"")}">${c(o.customer_name||"-")}</td>
      <td>${c(o.job_no||"-")}</td>
      <td>${c(o.customer_job_no||"-")}</td>
      <td class="nowrap">${S(o.due_date)}</td>
      <td class="r">${p(Number(o.total_amount)-Number(o.wht_amount))}</td>
      <td class="r t-b">${p(o.outstanding)}</td>
      ${O()?`<td class="center"><button type="button" class="btn btn-o btn-sm" data-backacc
            data-inv="${c(o.invoice_id)}" data-no="${c(o.invoice_no||"")}"
            title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING &gt; SERVICE \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21"
            >\u21A9 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING</button></td>`:""}
    </tr>`).join("")||`<tr><td colspan="${O()?9:8}" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>`,e.addEventListener("click",wt),j(e,o=>{let u=o.dataset.inv;if(u){try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+u}}),H(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:o,size:u})=>{y.page=o,y.size=u,A(t)},{lp:!0}),F(),t.__njCols&&t.__njCols.pending()}catch(s){R("rc-pending",r)&&M(s)}}async function wt(t){let e=t.target.closest("[data-backacc]");if(!e)return;if(t.preventDefault(),t.stopPropagation(),!O()){k("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let r=e.dataset.inv;if(!r){k("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let s=e.dataset.no||"";if(await Y("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(s?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+c(s)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>ACCOUNTING &gt; SERVICE</b>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await U("backacc-"+r,()=>ct(r,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",B())),k("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48","ok"),J&&A(J)}catch(o){M(o)}}export{gt as render};
