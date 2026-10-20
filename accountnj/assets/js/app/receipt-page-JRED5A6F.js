import{c as at,d as ot,e as rt}from"./chunk-IQKDQ5DA.js";import"./chunk-BF5ZDODO.js";import{a as ct,b as F}from"./chunk-IOEZHYTZ.js";import{a as j,e as z}from"./chunk-6A3NDXQQ.js";import{a as B}from"./chunk-6REVCVGI.js";import{k as it}from"./chunk-JXQJ6337.js";import{a as nt}from"./chunk-OWSY2KDQ.js";import{k as tt,v as st}from"./chunk-L5Z2NDJ3.js";import{j as E,k as X}from"./chunk-2B2FLIKC.js";import"./chunk-C4I7EIJU.js";import"./chunk-LAFWE2EM.js";import"./chunk-Q7FMECGI.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as P,b as q,e as U,f as H}from"./chunk-OPGKUGLK.js";import{a as R}from"./chunk-YM5GFE6V.js";import{a as L}from"./chunk-GDT6F23K.js";import{a as k}from"./chunk-OFOOXWUM.js";import{a as Q,d as Y,e as Z}from"./chunk-LNP7HEMP.js";import{a as u,c as N,e as i}from"./chunk-NQOCXXA2.js";import{G as et}from"./chunk-ACC3GWV5.js";import{m as V}from"./chunk-SGWIBJH6.js";var dt=t=>V("njacc_list_receipts",t),lt=(t,e,r)=>V("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:r});var T=(t,e="-")=>{let r=t==null?"":String(t).trim();return i(r||e)},v=t=>{let e=Number(t);return Number.isFinite(e)?e:0},f=t=>Math.round((v(t)+Number.EPSILON)*100)/100,ut={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},w=t=>`<span class="rcd-ic">${ut[t]||""}</span>`;function bt(t){let e=[],r=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?r.push(s):e.push(s);return{shown:e,excluded:r}}function pt(t){let e=v(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let r=f(e-v(t.wht_amount));return r<=0?null:{ratio:v(t.amount)/r,net:r}}function ht(t){let e=0,r=0,s=0,d=0,o=0,h=!1,m=new Set,c=new Map;for(let a of t){let S=v(a.amount);e=f(e+S);let _=pt(a);if(!_)continue;h=!0,o=f(o+v(a.total_amount)*_.ratio),r=f(r+v(a.subtotal)*_.ratio),s=f(s+v(a.vat_amount)*_.ratio);let O=f(v(a.wht_amount)*_.ratio);d=f(d+O),v(a.vat_rate)>0&&m.add(v(a.vat_rate));let D=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(D&&D.length)for(let C of D){let W=f(v(C.amount)*_.ratio);if(W===0)continue;let K=C.rate===null||C.rate===void 0||C.rate===""?null:v(C.rate);c.set(K,f((c.get(K)||0)+W))}else if(O!==0){let C=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:v(a.wht_rate);c.set(C,f((c.get(C)||0)+O))}}let n=m.size===1?[...m][0]:m.size===0?0:null,p=[...c.keys()],y=p.length===1&&p[0]!==null?p[0]:null;return{total:e,sub:r,vat:s,wht:d,hasTax:h,vatRate:n,whtRate:y,whtBy:c,grossTotal:h?o:e,received:e}}function mt(t){let{shown:e,excluded:r}=bt(t.invoices),s=ht(e),d=String(t.status||"").toUpperCase()==="VOID",o=e.length===0?"-":e.length===1?i(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",h=e.map((a,S)=>`<tr>
      <td class="rcd-no">${S+1}</td>
      <td class="rcd-inv">${T(a.invoice_no)}</td>
      <td class="rcd-dt">${a.invoice_date?N(a.invoice_date):"-"}</td>
      <td class="rcd-ds">${T(a.description,"-")}</td>
      <td class="r">${(()=>{let _=pt(a);return u(_?f(v(a.total_amount)*_.ratio):a.amount)})()}</td></tr>`).join("")||'<tr><td colspan="5" class="rcd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td></tr>',m=!s.hasTax||s.vatRate===null?"":`${s.vatRate} %`,c=!s.hasTax||s.whtRate===null?"":`${s.whtRate} %`,n=[...(s.whtBy||new Map).entries()],p=a=>a===null?"":" "+(Number.isInteger(a)?String(a):String(f(a)))+" %",y=s.hasTax?n.length===0?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${u(0)}</span></div>`:n.length===1?`<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${i(p(n[0][0]))}</span>
                 <span>-${u(n[0][1])}</span></div>`:n.sort((a,S)=>(a[0]??1e9)-(S[0]??1e9)).map(([a,S])=>`<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${i(p(a))}</span><span>-${u(S)}</span></div>`).join("")+`<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${u(s.wht)}</span></div>`:'<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>',l=a=>s.hasTax?u(a):"-";return`
    <div class="rcd print-area${d?" rcd-void":""}">
      ${d?'<div class="rcd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${x.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${i(x.nameEn)}</div>
            <div class="rcd-co-ad">${i(x.address)}</div>
            <div class="rcd-co-tl">Tel. ${i(x.tel)} <i>|</i> Fax. ${i(x.fax)}
              <i>|</i> Tax ID ${i(x.taxId)}</div>
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
              <div class="v v-b">${T(t.customer_name)}</div></div></div>
            <div class="rcd-f">${w("tax")}<div class="rcd-fb rcd-2col">
              <div><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35:</label>
                <div class="v v-b">${T(t.customer_tax_id)}</div></div>
              <div><label>Branch / \u0E2A\u0E32\u0E02\u0E32:</label>
                <div class="v v-b">${T(t.customer_branch_code)}</div></div>
            </div></div>
            <div class="rcd-f">${w("pin")}<div class="rcd-fb">
              <label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48:</label>
              <div class="v">${T(t.customer_address,"")}</div></div></div>
            <div class="rcd-f rcd-f-last">${w("tel")}<div class="rcd-fb">
              <label>Tel. / \u0E42\u0E17\u0E23.:</label>
              <div class="v v-b">${T(t.customer_phone)}</div></div></div>
          </div>
        </div>
        <div class="rcd-card">
          <div class="rcd-card-t">${w("rc")}RECEIPT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${w("rc")}<div class="rcd-fb rcd-kv">
              <label>Receipt No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${T(t.receipt_no)}</div></div></div>
            <div class="rcd-f">${w("cal")}<div class="rcd-fb rcd-kv">
              <label>Receipt Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${N(t.receipt_date)}</div></div></div>
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
          <tbody>${h}</tbody>
          <tfoot><tr class="rcd-trow">
            <td colspan="4" class="r">Total Amount / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td>
            <!-- FIX: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 GROSS \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Amount \u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27
                 \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E0A\u0E49 S.total \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E08\u0E23\u0E34\u0E07 (\u0E2B\u0E31\u0E01 WHT \u0E41\u0E25\u0E49\u0E27)
                 -> \u0E41\u0E16\u0E27\u0E23\u0E27\u0E21 1,605.00 \u0E41\u0E15\u0E48 Footer \u0E42\u0E0A\u0E27\u0E4C 1,560.00 \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07
                 S.grossTotal = \u03A3 (invoice.total_amount \xD7 ratio) \u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07
                 = \u0E1C\u0E25\u0E23\u0E27\u0E21 Amount \u0E02\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E40\u0E1B\u0E4A\u0E30 \u0E46
                 *** AMOUNT RECEIVED \u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19 Net Cash \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 *** -->
            <td class="r rcd-trow-g">${u(s.grossTotal)}</td>
          </tr></tfoot>
        </table>
        ${r.length?`<div class="rcd-note">* \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (Advance) \u0E08\u0E33\u0E19\u0E27\u0E19
          ${r.length} \u0E43\u0E1A \u2014 \u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Advance \u0E41\u0E22\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01</div>`:""}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${w("abc")}<span>Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</span></div>
          <div class="rcd-w-v">(${i(nt(s.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${m?" "+m:""}</span><span>${l(s.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${m?" "+m:""}</span><span>${l(s.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${u(s.grossTotal)}</span></div>
          ${y}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E2A\u0E38\u0E17\u0E18\u0E34</i></span>
            <span>${u(s.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`}function vt(t,{print:e=!1}={}){let r=document.createElement("div");r.innerHTML=mt(t);let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">\u{1F5A8} Print Receipt</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,Q({title:"\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 "+(t.receipt_no||""),body:r,footer:s,fullscreen:!0,wide:!0}),s.querySelector("#rcd-print").onclick=()=>window.print(),e&&setTimeout(()=>window.print(),60)}function G(t){vt(t)}var b={customer:"",from:"",to:"",page:1,size:20},I="pending",A=()=>String(L.profile&&L.profile.role)==="SUPER_ADMIN",J=null,$={customer:"",q:"",page:1,size:20},g={charge:"SERVICE",group:"NJ",queue:"receipt_active"},ft=()=>({view:E("view",g.charge,g.group),create:E("create",g.charge,g.group),edit:E("edit",g.charge,g.group),export:E("export",g.charge,g.group)});async function gt(t){await tt(),t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 / \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</h2></div>
      ${E("receive_payment")?'<button class="btn btn-p" id="rc-new">+ \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</button>':""}</div>
    
    ${at(g.charge,g.group,ft(),"receipt")}
    <div class="rep-tabs">
      <button class="rep-tab ${I==="pending"?"active":""}" data-rtab="pending">\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</button>
      <button class="rep-tab ${I==="issued"?"active":""}" data-rtab="issued">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27</button>
    </div>
    <div id="rc-pending" ${I==="pending"?"":"hidden"}>
      <!-- Main List Container \u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 Filter + Table + Empty State + Total + Pagination -->
      <div class="ch-panel">
      <div class="fbar">
        <input class="inp" data-pf="q" value="${i($.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19">
        <button class="btn btn-o btn-sm" id="rp-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
      <div class="card mt-2" id="rp-pgn"></div>
      <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>Customer Job No.</th>
        <th>Due Date</th><th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th>
        ${A()?'<th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>':""}
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="${A()?9:8}" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div>
      </div>
    </div>
    <div id="rc-issued" ${I==="issued"?"":"hidden"}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${st(b.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${b.from}">
      <input class="inp" type="date" data-f="to" value="${b.to}">
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
    <div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A</th><th>INVOICE \u0E17\u0E35\u0E48\u0E15\u0E31\u0E14</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,ct(t);let e=t.querySelector(".ch-tools");e&&ot(e);let r={...g,scope:null,mode:"receipt",importMode:"accounting",filters:{},refresh:()=>{I==="pending"?M(t):o()}};t.dataset.chPage="finance-receipt",t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=c=>{if(t.dataset.chPage!=="finance-receipt")return;let n=c.target.closest("[data-tool]");n&&rt(n.dataset.tool,r)},t.addEventListener("click",t.__njToolClick),t.querySelector(".rep-tabs").addEventListener("click",c=>{let n=c.target.closest("[data-rtab]");!n||n.dataset.rtab===I||(I=n.dataset.rtab,gt(t))});let s=t.querySelector('[data-pf="q"]');s&&(t.querySelector("#rp-go").onclick=()=>{$.q=s.value.trim(),$.page=1,M(t)}),I==="pending"&&M(t);let d=t.querySelector("#rc-new");d&&(d.onclick=()=>location.hash="#/receipts/new");async function o(){let c=P("receipts");try{let n=await dt({p_customer:b.customer||null,p_from:b.from||null,p_to:b.to||null,p_page:b.page,p_size:b.size});if(!q("receipts",c))return;let p=t.querySelector("#rc-tbody"),y=n.rows||[];p.innerHTML=y.length?y.map(l=>`<tr data-rc='${JSON.stringify(l).replace(/'/g,"&#39;")}'>
        <td class="t-b">${i(l.receipt_no)}</td><td>${N(l.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${i(l.customer_name)}</td>
        <td>${i(l.method||"-")}</td>
        <td class="r t-b">${u(l.total_received)}</td>
        <td class="t-xs">${(l.invoices||[]).map(a=>i(a.invoice_no)).join(", ")}</td>
        <td>${l.status==="VOID"?'<span class="bdg bdg-void">VOID</span>':'<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(l).replace(/'/g,"&#39;")}'>\u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${l.status!=="VOID"&&(X()||E("void"))?`<button class="btn btn-danger btn-sm" data-void="${l.id}" data-no="${i(l.receipt_no)}">Void</button>`:""}
        </div></td></tr>`).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',B(t.querySelector("#rc-pgn"),{page:b.page,size:b.size,total:n.total||0},({page:l,size:a})=>{b.page=l,b.size=a,o()},{lp:!0}),F(),t.__njCols&&t.__njCols.issued()}catch(n){if(!q("receipts",c))return;R(n);let p=t.querySelector("#rc-tbody");p&&p.querySelector(".spin")&&(p.innerHTML='<tr><td colspan="8" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',p.querySelector("[data-ld-retry]").onclick=()=>{p.innerHTML='<tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>',o()})}}t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(c=>b[c.dataset.f]=c.value),b.page=1,o()};function h(){let c=t.querySelector("#rp-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function m(){let c=t.querySelector("#rc-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED",host:t.querySelector("#rc-issued .fbar")})}t.__njCols={pending:h,issued:m},h(),m(),j(t.querySelector("#rc-tbody"),c=>{c.dataset.rc&&G(JSON.parse(c.dataset.rc))}),t.querySelector("#rc-tbody").addEventListener("click",async c=>{let n=c.target.closest("[data-print]");if(n){G(JSON.parse(n.dataset.print));return}let p=c.target.closest("[data-void]");if(p){let y=await Z("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+p.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!y)return;try{await U("void-rc-"+p.dataset.void,()=>lt(p.dataset.void,y,H())),k("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),o()}catch(l){R(l)}}}),o()}async function M(t){let e=t.querySelector("#rp-tbody");if(!e)return;J=t;let r=P("rc-pending");try{let s=await et({company_group:"NJ",q:$.q||null,customer_id:$.customer||null,page:$.page,size:$.size});if(!q("rc-pending",r))return;let d=s&&s.rows||[];e.innerHTML=d.map(o=>`<tr data-inv="${i(o.invoice_id)}">
      <td class="t-b">${i(o.invoice_no||"-")}</td>
      <td class="nowrap">${N(o.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${i(o.customer_name||"")}">${i(o.customer_name||"-")}</td>
      <td>${i(o.job_no||"-")}</td>
      <td>${i(o.customer_job_no||"-")}</td>
      <td class="nowrap">${N(o.due_date)}</td>
      <td class="r">${u(Number(o.total_amount)-Number(o.wht_amount))}</td>
      <td class="r t-b">${u(o.outstanding)}</td>
      ${A()?`<td class="center"><button type="button" class="btn btn-o btn-sm" data-backacc
            data-inv="${i(o.invoice_id)}" data-no="${i(o.invoice_no||"")}"
            title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING &gt; SERVICE \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21"
            >\u21A9 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING</button></td>`:""}
    </tr>`).join("")||`<tr><td colspan="${A()?9:8}" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>`,e.addEventListener("click",wt),j(e,o=>{let h=o.dataset.inv;if(h){try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+h}}),B(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:o,size:h})=>{$.page=o,$.size=h,M(t)},{lp:!0}),F(),t.__njCols&&t.__njCols.pending()}catch(s){if(!q("rc-pending",r))return;R(s);let d=t.querySelector("#rp-tbody");if(d&&d.querySelector(".spin")){let o=d.querySelector("td")?d.querySelector("td").colSpan:8;d.innerHTML=`<tr><td colspan="${o}" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>`,d.querySelector("[data-ld-retry]").onclick=()=>{d.innerHTML=`<tr><td colspan="${o}" class="load-row"><div class="spin"></div></td></tr>`,M(t)}}}}async function wt(t){let e=t.target.closest("[data-backacc]");if(!e)return;if(t.preventDefault(),t.stopPropagation(),!A()){k("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let r=e.dataset.inv;if(!r){k("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let s=e.dataset.no||"";if(await Y("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(s?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+i(s)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>ACCOUNTING &gt; SERVICE</b>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await U("backacc-"+r,()=>it(r,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",H())),k("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48","ok"),J&&M(J)}catch(o){R(o)}}export{gt as render};
