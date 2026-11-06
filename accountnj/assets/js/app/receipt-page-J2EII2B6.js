import{css762 as CS762,dd762 as DD762,sel762 as SL762,field762 as FD762,txt762 as TX762,chips762 as CH762}from"./ui-dd762.js";import{c as at,d as ot,e as rt}from"./chunk-J26HUKJ4.js";import"./chunk-IIDKIKVM.js";import{a as ct,b as F}from"./chunk-IOEZHYTZ.js";import{a as j,e as z}from"./chunk-ETXG4BWC.js";import{a as B}from"./chunk-6REVCVGI.js";import{k as it}from"./chunk-JXQJ6337.js";import{a as nt}from"./chunk-OWSY2KDQ.js";import{k as tt,v as st}from"./chunk-L5Z2NDJ3.js";import{j as E,k as X,f as MA660}from"./chunk-2B2FLIKC.js";import"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import"./chunk-Q7FMECGI.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as P,b as q,e as U,f as H}from"./chunk-OPGKUGLK.js";import{a as R}from"./chunk-YM5GFE6V.js";import{a as L}from"./chunk-GDT6F23K.js";import{a as k}from"./chunk-OFOOXWUM.js";import{b as XLJ734}from"./chunk-FHYZBT2Q.js";import{a as Q,d as Y,e as Z}from"./chunk-LNP7HEMP.js";import{a as u,c as N,e as i}from"./chunk-NQOCXXA2.js";import{G as et}from"./chunk-6NADHKLT.js";import{m as V}from"./chunk-SGWIBJH6.js";var dt=t=>V("njacc_list_receipts",t),lt=(t,e,r)=>V("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:r});var T=(t,e="-")=>{let r=t==null?"":String(t).trim();return i(r||e)},v=t=>{let e=Number(t);return Number.isFinite(e)?e:0},f=t=>Math.round((v(t)+Number.EPSILON)*100)/100,ut={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},w=t=>`<span class="rcd-ic">${ut[t]||""}</span>`;function bt(t){let e=[],r=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?r.push(s):e.push(s);return{shown:e,excluded:r}}function pt(t){let e=v(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let r=f(e-v(t.wht_amount));return r<=0?null:{ratio:v(t.amount)/r,net:r}}function ht(t){let e=0,r=0,s=0,d=0,o=0,h=!1,m=new Set,c=new Map;for(let a of t){let S=v(a.amount);e=f(e+S);let _=pt(a);if(!_)continue;h=!0,o=f(o+v(a.total_amount)*_.ratio),r=f(r+v(a.subtotal)*_.ratio),s=f(s+v(a.vat_amount)*_.ratio);let O=f(v(a.wht_amount)*_.ratio);d=f(d+O),v(a.vat_rate)>0&&m.add(v(a.vat_rate));let D=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(D&&D.length)for(let C of D){let W=f(v(C.amount)*_.ratio);if(W===0)continue;let K=C.rate===null||C.rate===void 0||C.rate===""?null:v(C.rate);c.set(K,f((c.get(K)||0)+W))}else if(O!==0){let C=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:v(a.wht_rate);c.set(C,f((c.get(C)||0)+O))}}let n=m.size===1?[...m][0]:m.size===0?0:null,p=[...c.keys()],y=p.length===1&&p[0]!==null?p[0]:null;return{total:e,sub:r,vat:s,wht:d,hasTax:h,vatRate:n,whtRate:y,whtBy:c,grossTotal:h?o:e,received:e}}function mt(t){let{shown:e,excluded:r}=bt(t.invoices),s=ht(e),d=String(t.status||"").toUpperCase()==="VOID",o=e.length===0?"-":e.length===1?i(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",h=e.map((a,S)=>`<tr>
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
      <div id="rp-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>
      <!-- Main List Container \u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 Filter + Table + Empty State + Total + Pagination -->
      <div class="ch-panel">
      <div class="fbar">
        <input class="inp" data-pf="q" value="${i($.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19">${FI678($,"pf")}
        <button class="btn btn-o btn-sm" id="rp-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button><button type="button" class="btn btn-o btn-sm clr797" id="rp-clr797" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button>${XB734("rp-xl734")}</div>
      ${RB795()}<div class="card mt-2" id="rp-pgn"></div>
      <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
        ${RH795()}${RH522}
        ${A()?'<th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>':""}
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="${A()?20:19}" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div>
      </div>
    </div>
    <div id="rc-issued" ${I==="issued"?"":"hidden"}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${st(b.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${b.from}">
      <input class="inp" type="date" data-f="to" value="${b.to}">
      ${FI678(b,"f")}
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button><button type="button" class="btn btn-o btn-sm clr797" id="rc-clr797" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button></div>
    <div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      ${RHL795()}${RH522}${RIH795}
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,ct(t);let e=t.querySelector(".ch-tools");e&&ot(e);(()=>{if(!document.getElementById("rc502-css")){let s=document.createElement("style");s.id="rc502-css";s.textContent=".rc502-hide{display:none!important}.rep-tabs.rc502-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.rep-tabs.rc502-tabs>#rc-new{margin-left:auto}.rc502 [data-colmg]{display:none!important}";document.head.appendChild(s)}let ph=t.querySelector(".page-head"),tb=t.querySelector(".rep-tabs"),nb=t.querySelector("#rc-new");e&&e.classList.add("rc502-hide");ph&&ph.classList.add("rc502-hide");tb&&(tb.classList.add("rc502-tabs"),nb&&tb.appendChild(nb));t.querySelectorAll("#rc-pending,#rc-issued").forEach(x=>x.classList.add("rc502"))})();let r={...g,scope:null,mode:"receipt",importMode:"accounting",filters:{},refresh:()=>{I==="pending"?M(t):o()}};t.dataset.chPage="finance-receipt",NK586(t,()=>t.dataset.chPage==="finance-receipt",()=>r.refresh()),t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=c=>{if(t.dataset.chPage!=="finance-receipt")return;let n=c.target.closest("[data-tool]");n&&rt(n.dataset.tool,r)},t.addEventListener("click",t.__njToolClick),t.querySelector(".rep-tabs").addEventListener("click",c=>{let n=c.target.closest("[data-rtab]");!n||n.dataset.rtab===I||(I=n.dataset.rtab,SEL795.clear(),gt(t))});let s=t.querySelector('[data-pf="q"]');s&&(t.querySelector("#rp-go").onclick=()=>{$.q=s.value.trim(),FR678(t,"pf",$),$.page=1,M(t)},XR734(t),FK678(t.querySelector("#rc-pending .fbar"),"#rp-go")),I==="pending"&&M(t);let d=t.querySelector("#rc-new");d&&d.remove();async function o(){let c=P("receipts");try{let n=await V("njacc_rcp795_list",{p:{company_group:"NJ",customer_id:b.customer||null,from:b.from||null,to:b.to||null,page:b.page,size:b.size,...FP678(b)}});if(!q("receipts",c))return;let p=t.querySelector("#rc-tbody"),y=n.rows||[];p.innerHTML=y.length?y.map(RI795).join(""):'<tr><td colspan="21" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',B(t.querySelector("#rc-pgn"),{page:b.page,size:b.size,total:n.total||0},({page:l,size:a})=>{b.page=l,b.size=a,o()},{lp:!0}),F(),t.__njCols&&t.__njCols.issued()}catch(n){if(!q("receipts",c))return;R(n);let p=t.querySelector("#rc-tbody");p&&p.querySelector(".spin")&&(p.innerHTML='<tr><td colspan="21" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',p.querySelector("[data-ld-retry]").onclick=()=>{p.innerHTML='<tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr>',o()})}}RC762(t)/* V.762 */,AP797(t),OP797(t)/* V.797 */,FK678(t.querySelector("#rc-issued .fbar"),"#rc-go"),t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(c=>b[c.dataset.f]=c.value),b.page=1,o()};function h(){let c=t.querySelector("#rp-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function m(){let c=t.querySelector("#rc-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED",host:t.querySelector("#rc-issued .fbar")})}RA795(t,()=>(M(t),OP797(t,!0))),t.__njCols={pending:h,issued:m},h(),m(),t.querySelector("#rc-tbody").addEventListener("click",async c=>{let n=c.target.closest("[data-print]");if(n){G(JSON.parse(n.dataset.print));return}let p=c.target.closest("[data-void]");if(p){let y=await Z("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+p.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!y)return;try{await U("void-rc-"+p.dataset.void,()=>lt(p.dataset.void,y,H())),k("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),o()}catch(l){R(l)}}}),o()}async function M(t){let e=t.querySelector("#rp-tbody");if(!e)return;J=t;let r=P("rc-pending");try{let s=await et({company_group:"NJ",q:$.q||null,customer_id:$.customer||null,page:$.page,size:$.size,...FP678($)});if(!q("rc-pending",r))return;KP530(t,s);RA795(t,()=>(M(t),OP797(t,!0)));let d=s&&s.rows||[];e.innerHTML=d.map(o=>`<tr data-inv="${i(o.invoice_id)}">
      ${RC795(o)}${RR522(o)}
      ${A()?`<td class="center"><button type="button" class="btn btn-sm un678" data-backacc
            data-inv="${i(o.invoice_id)}" data-job="${i(o.job_id||"")}" data-no="${i(o.invoice_no||"")}"
            title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING &gt; SERVICE \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21"
            >UNPOST</button></td>`:""}
    </tr>`).join("")||`<tr><td colspan="${A()?20:19}" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>`,e.addEventListener("click",wt),RS795(t),B(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:o,size:h})=>{$.page=o,$.size=h,M(t)},{lp:!0}),F(),t.__njCols&&t.__njCols.pending()}catch(s){if(!q("rc-pending",r))return;R(s);let d=t.querySelector("#rp-tbody");if(d&&d.querySelector(".spin")){let o=d.querySelector("td")?d.querySelector("td").colSpan:8;d.innerHTML=`<tr><td colspan="${o}" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>`,d.querySelector("[data-ld-retry]").onclick=()=>{d.innerHTML=`<tr><td colspan="${o}" class="load-row"><div class="spin"></div></td></tr>`,M(t)}}}}async function wt(t){let e=t.target.closest("[data-backacc]");if(!e)return;if(t.preventDefault(),t.stopPropagation(),!A()){k("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let r=e.dataset.inv;if(!r){k("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let s=e.dataset.no||"";if(await Y("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(s?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+i(s)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>ACCOUNTING &gt; SERVICE</b>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await U("backacc-"+r,()=>it(r,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",H())),k("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48","ok"),J&&M(J)}catch(o){R(o)}}
/* \u2550\u2550\u2550 V.522 FINANCE \u2014 RECEIPT (\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30) : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D/\u0E25\u0E33\u0E14\u0E31\u0E1A/\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19 ACCOUNTING \u2014 SERVICE (\u0E15\u0E32\u0E21\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E08\u0E23\u0E34\u0E07) + Due Date / \u0E04\u0E07\u0E04\u0E49\u0E32\u0E07 \u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 \u00B7 \u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u2550\u2550\u2550 */
var KP522 = new Set(["\u0E19\u0E32\u0E22", "\u0E19\u0E32\u0E07", "\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", "\u0E19.\u0E2A.", "\u0E19.\u0E2A", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "miss"]);
function KN522(t) {
  let e = String(t ?? "").trim().split(/\s+/).filter(Boolean);
  for (; e.length > 1 && KP522.has(e[0].toLowerCase()); ) e.shift();
  return e[0] || "-";
}
var RH522 =
  '<th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>Date</th><th>Invoice No.</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</th><th>Customer Job No.</th>' +
  '<th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th><th>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</th><th>House B/L No.</th><th>Master B/L No.</th>' +
  '<th class="r">Service charge</th><th class="r">Advance</th><th class="r">VAT 7%</th><th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross \u2212 WHT">Total Amount</th><th>\u0E0A\u0E37\u0E48\u0E2D USER</th><th>Billing Note no.</th>';   /* V.678 : ไม่แสดง Due Date / คงค้าง (FINANCE — RECEIPT) */
function RE522(v, w) {
  return `<td class="ellip" style="max-width:${w}px" title="${i(v || "")}">${i(v || "-")}</td>`;
}
function RR522(o) {
  let net = o.net_payable != null ? o.net_payable : Number(o.total_amount) - Number(o.wht_amount);
  return (
    `<td class="nowrap"><b>${i(o.job_no || "-")}</b></td>` +
    `<td class="nowrap">${N(o.date)}</td>` +
    `<td class="nowrap col-inv">${o.invoice_no ? `<span class="t-b">${i(o.invoice_no)}</span>` : '<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>'}${o.source_invoice_no ? `<div class="inv-src" title="\u0E40\u0E25\u0E02 Invoice \u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21/\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07">SRC: ${i(o.source_invoice_no)}</div>` : ""}</td>` +
    RE522(o.customer_name, 180) + RE522(o.company_invoice, 130) + RE522(o.customer_job_no, 120) +
    RE522(o.customs_declaration_no, 130) + RE522(o.source_invoice_no, 120) + RE522(o.house_bl_no, 130) + RE522(o.master_bl_no, 130) +
    `<td class="r">${u(o.service_amount)}</td><td class="r">${u(o.advance_amount)}</td><td class="r">${u(o.vat_amount)}</td>` +
    `<td class="r">${u(o.subtotal)}</td><td class="r">${u(o.wht_amount)}</td>` +
    `<td class="r t-b" title="Gross ${u(o.total_amount)} \u2212 WHT ${u(o.wht_amount)}">${u(net)}</td>` +
    `<td class="nowrap" title="\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19">${i((o.created_by_nickname&&String(o.created_by_nickname).trim())||KN522(o.created_by_name))}</td>` +
    (o.billing_note_no ? `<td class="nowrap t-b">${i(o.billing_note_no)}</td>` : '<td class="nowrap">-</td>') +
    ""   /* V.678 : Due Date / คงค้าง ไม่แสดง */
  );
}


/* ═══ V.678 FINANCE — RECEIPT / ADVANCE : หน้ารายงาน (อ่านอย่างเดียว · UNPOST เท่านั้น) + ช่องค้นหา ลูกค้า / บริษัท / INVOICE NO. / Customer Job No. ═══ */
var FL678 = [["f678_customer", "ลูกค้า"], ["f678_company", "บริษัท"], ["f678_invoice", "INVOICE NO."], ["f678_cjob", "Customer Job No."]];
function FI678(st, at) { ST678(); return FL678.map(([k, l]) => (k === "f678_customer" || k === "f678_company") ? SE797(st, at, k) /* V.797 */ : `<input class="inp inp678" data-${at}="${k}" value="${i((st && st[k]) || "")}" placeholder="${l}" title="ค้นหา ${l} (บางส่วนของข้อความได้)">`).join(""); }
function FR678(t, at, st) { t.querySelectorAll(`[data-${at}^="f678_"]`).forEach((x) => { st[x.getAttribute("data-" + at)] = x.value.trim(); }); }
function FP678(st) { let o = {}; FL678.forEach(([k]) => { let v = String((st && st[k]) || "").trim(); if (!v) return; if (k === "f678_customer" || k === "f678_company") { let a = v.split(",").map((x) => x.trim()).filter(Boolean); a.length && (o[k === "f678_customer" ? "f797_customer_ids" : "f797_company_ids"] = a); } else o[k] = v; }); return o; }   /* V.797 : Dropdown = id ตรงตัว */
function FK678(bar, go) { bar && bar.addEventListener("keydown", (e) => { if (e.key !== "Enter" || !e.target.classList.contains("inp678")) return; e.preventDefault(); let b = bar.querySelector(go); b && b.click(); }); }
function ST678() { try { if (document.getElementById("st678-css")) return; let s = document.createElement("style"); s.id = "st678-css";
  s.textContent = ".fbar .inp678{width:150px;min-width:120px;flex:0 1 150px}.rc502 tbody tr,.rc502 tbody td{cursor:default!important}.btn.un678{background:#DC2626!important;color:#fff!important;border-color:#DC2626!important;font-weight:700}.btn.un678:hover:not(:disabled){background:#B91C1C!important;border-color:#B91C1C!important}"; document.head.appendChild(s); } catch (e) {} }
var KP530=(t,s)=>{let g=t.querySelector("#rp-kpi");if(!g)return;let k=s&&s.kpi||{},c=x=>(Number(x)||0).toLocaleString("th-TH"),m=x=>u(Number(x)||0);g.innerHTML='<div class="kpi-row">'+[["Total Job",c(k.total_job),"var(--blue-600)",""],["Total Over Due",c(k.total_overdue),"var(--red-600)","INVOICE \u0E17\u0E35\u0E48\u0E40\u0E25\u0E22\u0E27\u0E31\u0E19\u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E0A\u0E33\u0E23\u0E30 (Due Date) \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E21\u0E35\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07"],["Service Charge",m(k.service_charge),"var(--acc-service)",""],["Advance Charge",m(k.advance_charge),"var(--acc-advance)",""],["VAT",m(k.vat),"var(--purple-600)",""],["Total Amount",m(k.total_amount),"var(--green-600)","Total Amount = \u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E2B\u0E25\u0E31\u0E07\u0E2B\u0E31\u0E01 WHT (Net Payable) \u0E02\u0E2D\u0E07 INVOICE \u0E17\u0E35\u0E48\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30"]].map(([l,v,cc,ti])=>`<div class="kpi" style="--kpi-c:${cc}" title="${ti}"><div class="lb">${l}</div><div class="v">${v}</div></div>`).join("")+"</div>"};
export{gt as render};
/* V.586 · ชื่อเล่น USER เปลี่ยน (Realtime "njacc:nick" → window "njacc:nick-changed") : โหลดรายการหน้าปัจจุบันใหม่เฉพาะเมื่อหน้านี้ยังเปิดอยู่ (ไม่ดึงข้อมูลอื่นเพิ่ม) */
function NK586(el,ok,fn){try{el.__nk586&&window.removeEventListener("njacc:nick-changed",el.__nk586);let tm=0,h=el.__nk586=()=>{if(!el.isConnected||!ok()){window.removeEventListener("njacc:nick-changed",h);return}clearTimeout(tm);tm=setTimeout(()=>{try{el.isConnected&&ok()&&fn()}catch(e){}},400)};window.addEventListener("njacc:nick-changed",h)}catch(e){}}

/* \u2550\u2550\u2550 V.660 FINANCE \u2192 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING : \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E40\u0E1B\u0E34\u0E14\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E41\u0E01\u0E49\u0E44\u0E02 JOB \u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07 ACCOUNTING \u2014 SERVICE / ADVANCE \u0E17\u0E31\u0E19\u0E17\u0E35 (\u0E14\u0E49\u0E27\u0E22 JOB ID \u0E08\u0E23\u0E34\u0E07) \u00B7 \u0E43\u0E0A\u0E49 UNPOST_TO_DRAFT \u0E40\u0E14\u0E34\u0E21 \u2550\u2550\u2550 */
function GO660(job, charge, allowed) {
  let c = String(charge || "").toUpperCase() === "ADVANCE" ? "ADVANCE" : "SERVICE";
  if (!job) return false;
  try { if (typeof allowed === "function" && !allowed("ACCOUNTING")) return false; } catch { return false; }
  try { sessionStorage.setItem("nj-acc-open660", JSON.stringify({ jobId: String(job), charge: c, at: Date.now() })); } catch { return false; }
  location.hash = "#/accounting/" + c.toLowerCase();
  return true;
}

/* ═══ V.734 FINANCE — RECEIPT / ADVANCE : EXPORT EXCEL (ข้อมูลครบทุกหน้า ตามตัวกรอง / การเรียงปัจจุบัน · อ่านอย่างเดียว ไม่แก้ข้อมูล) ═══ */
var XI734 = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 12 4 5M13 12l-4 5"/></svg>';
function XS734() { try { if (document.getElementById("xl734-css")) return; let s = document.createElement("style"); s.id = "xl734-css";
  s.textContent = ".btn.xl734{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#16a34a!important;border:1px solid #15803d!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.xl734:hover:not(:disabled){background:#15803d!important}.btn.xl734:disabled{opacity:.6;cursor:wait}";
  document.head.appendChild(s); } catch (e) {} }
function XB734(id) { XS734(); return `<button type="button" class="btn btn-sm xl734" id="${id}" title="ส่งออกข้อมูลทุกหน้าตามตัวกรองปัจจุบันเป็นไฟล์ Excel">${XI734}EXPORT EXCEL</button>`; }
async function XW734(base, cols, rows) {
  let EX = await XLJ734(), wb = new EX.Workbook(), ws = wb.addWorksheet(base.replace(/^FINANCE_/, ""), { views: [{ state: "frozen", ySplit: 1 }] });
  let TH = { style: "thin", color: { argb: "FFD9E2EC" } }, BD = { top: TH, left: TH, bottom: TH, right: TH }, W = cols.map((c) => Math.max(10, String(c[0]).length + 4)), hr = ws.getRow(1);
  cols.forEach((c, j) => { let x = hr.getCell(j + 1); x.value = c[0]; x.font = { bold: !0, color: { argb: "FFFFFFFF" } }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17365D" } }; x.border = BD; x.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; });
  hr.height = 30;
  rows.forEach((r, i) => { let row = ws.getRow(i + 2); cols.forEach((c, j) => { let x = row.getCell(j + 1), v = c[1](r), t = c[2], L;
    if (t === "num") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; } else { x.value = Math.round(n * 100) / 100; x.numFmt = "#,##0.00"; x.alignment = { horizontal: "right", vertical: "middle" }; } L = 15; }
    else if (t === "date") { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); if (m) { x.value = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); x.numFmt = "dd/mm/yyyy"; } else x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; L = 13; }
    else { let s = v == null ? "" : String(v).replace(/\s+/g, " ").trim(); x.value = s || "-"; x.alignment = { vertical: "middle", horizontal: s ? "left" : "center" }; L = String(x.value).length + 3; }
    x.border = BD; W[j] = Math.min(60, Math.max(W[j], L)); }); });
  W.forEach((w, j) => { ws.getColumn(j + 1).width = w; });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: cols.length } };
  let d = new Date(), p = (n) => String(n).padStart(2, "0"), fn = base + "_" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + ".xlsx";
  let buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
  a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 6e3);
  return fn;
}
async function XF734(fetchPage, max) {   /* ดึงทุกหน้า (ไม่ขึ้นกับหน้าที่เปิด) · กันข้อมูลซ้ำด้วย key */
  let all = [], seen = new Set(), page = 1, total = null;
  for (; page <= 2000; page++) {
    let r = await fetchPage(page, max), rows = (r && r.rows) || [];
    total == null && (total = Number(r && r.total) || 0);
    rows.forEach((x) => { let k = x.__k734; if (k == null || !seen.has(k)) { k != null && seen.add(k); all.push(x); } });
    if (!rows.length || page * max >= total) break;
  }
  return { rows: all, total: total || 0 };
}
function XR734(t) {   /* RECEIPT (รอรับชำระ) : คอลัมน์ / ลำดับเดียวกับตาราง (RH522 / RR522) · ไม่รวมคอลัมน์จัดการ · ตัวกรองที่ค้นหาแล้ว ($) */
  let b = t.querySelector("#rp-xl734"); if (!b || b.__xl734) return; b.__xl734 = 1;
  b.onclick = async () => {
    if (b.disabled) return; b.disabled = !0; let lb = b.innerHTML; b.textContent = "กำลังส่งออก…";
    try {
      let f = { company_group: "NJ", q: $.q || null, customer_id: $.customer || null, ...FP678($) };
      let r = await XF734(async (pg, sz) => { let x = await et(Object.assign({}, f, { page: pg, size: sz })); ((x && x.rows) || []).forEach((o) => { o.__k734 = o.invoice_id || null; }); return x; }, 200);
      let cols = [["เลขที่งาน", (o) => o.job_no], ["Date", (o) => o.date, "date"], ["Invoice No.", (o) => o.invoice_no || "ยังไม่ออก INV"], ["ลูกค้า", (o) => o.customer_name], ["บริษัท Invoice", (o) => o.company_invoice],
        ["Customer Job No.", (o) => o.customer_job_no], ["เลขใบขนสินค้า", (o) => o.customs_declaration_no], ["Invoice ต้นทาง (Source)", (o) => o.source_invoice_no], ["House B/L No.", (o) => o.house_bl_no], ["Master B/L No.", (o) => o.master_bl_no],
        ["Service charge", (o) => o.service_amount, "num"], ["Advance", (o) => o.advance_amount, "num"], ["VAT 7%", (o) => o.vat_amount, "num"], ["Amount", (o) => o.subtotal, "num"], ["WHT 3%", (o) => o.wht_amount, "num"],
        ["Total Amount", (o) => (o.net_payable != null ? o.net_payable : Number(o.total_amount) - Number(o.wht_amount)), "num"], ["ชื่อ USER", (o) => (o.created_by_nickname && String(o.created_by_nickname).trim()) || KN522(o.created_by_name)], ["Billing Note no.", (o) => o.billing_note_no]];
      let fn = await XW734("FINANCE_RECEIPT", cols, r.rows);
      k("ส่งออก Excel " + r.rows.length.toLocaleString("th-TH") + " รายการแล้ว (" + fn + ")", "ok");
    } catch (e) { k("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); }
    b.disabled = !1; b.innerHTML = lb;
  };
}
/* ═══ V.762 · FINANCE → RECEIPT (รอออกใบเสร็จ / ใบเสร็จที่ออกแล้ว) : แถบค้นหาใช้ Component กลาง (ui-dd762.js) — หัวข้อเหนือช่อง · Dropdown ค้นหาได้ · × · ป้ายสรุป
   ค้นหาเมื่อกดปุ่ม "ค้นหา" / Enter เหมือนเดิม · × / ป้าย = ล้างแล้วค้นหาใหม่ · ตัวเลือกลูกค้า = รายชื่อเดิมของหน้า ═══ */
function RC762(t) {
  try {
    CS762();
    let LB = { q: "ค้นหาทั่วไป", customer: "ลูกค้า", from: "วันที่เริ่มต้น", to: "วันที่สิ้นสุด", f678_customer: "ค้นหาลูกค้า", f678_company: "ค้นหาบริษัท", f678_invoice: "INVOICE NO.", f678_cjob: "Customer Job No." };
    [["#rc-pending .fbar", "#rp-go", "pf"], ["#rc-issued .fbar", "#rc-go", "f"]].forEach(([s, g, at]) => {
      let bar = t.querySelector(s), go = t.querySelector(g); if (!bar || bar.__rc762) return; bar.__rc762 = 1; bar.classList.add("u762-bar");
      let F = [], apply = () => { go && !go.disabled && go.click(); };
      [...bar.children].forEach((el) => {
        let k = el.dataset && el.dataset[at]; if (!k) return;
        let lb = LB[k] || el.placeholder || k;
        if (el.tagName === "SELECT") { FD762(el, lb); F.push(SL762(el, { label: lb, after: (w) => w === "clear" && apply() })); }
        else { let d = el.type === "date"; FD762(el, lb, d ? "u762-d" : k === "q" ? "u762-w" : "u762-t"); F.push(TX762(el, lb, d)); }
      });
      let ch = CH762(bar, () => F, apply);
      go && go.addEventListener("click", () => { F.forEach((f) => f && f.sync && f.sync()); ch.refresh(); });
    });
  } catch (e) { try { console.warn("RC762", e); } catch (_) {} }
}

/* ═══ V.795 · FINANCE → RECEIPT : เลือกรายการ + ใบเสร็จรับเงิน / RECEIPT (RCPYYMM-##### · RUN-795) — รูปแบบ / FLOW เดียวกับ FINANCE — ADVANCE (V.788 – V.791)
   เลือก : Checkbox หน้าแถว + หัวตาราง (เลือกทั้งหน้า) · คงรายการที่เลือกเมื่อเปลี่ยนหน้า / ค้นหา (Map ตาม INVOICE · ไม่ซ้ำ) · จำนวน + ยอดรับสุทธิรวม · ล้างรายการที่เลือก · เปลี่ยนแถบ = ล้าง
   ยอด (สูตรเดิมของ INVOICE NJ · Service เท่านั้น ไม่รวม Advance) : Invoice Amount = Service + VAT · Withholding Tax = WHT เดิม · Payment Received = Invoice Amount − WHT (Server คำนวณ / ตรวจซ้ำ)
   ออกใบเสร็จ : วันที่ใบเสร็จ + วิธีรับชำระ → ตรวจที่ Server (njacc_rcp795_preview) 1 ใบต่อลูกค้า → ดูตัวอย่าง (SAMPLE · ไม่ออกเลข) → ยืนยัน (njacc_rcp795_issue : ออกเลข + บันทึก + PAID + ล็อก ในธุรกรรมเดียว)
   แถบใบเสร็จที่ออกแล้ว : 1 แถวต่อ INVOICE (คอลัมน์เดียวกับรอรับชำระ) · สถานะ "ออกใบเสร็จแล้ว" + เลข RCP · PREVIEW / PRINT / SAVE PDF ตาม ID ใบเสร็จ (สำเนาที่บันทึก · เลขเดิม)
   PDF : A4 แนวตั้ง · ฟอนต์ฝัง "NJ PDF" (V.766)
   V.796 : ตาราง 5 คอลัมน์ No. / Invoice / Invoice Date / Description (SERVICE CHARGE) / Amount Charge (= Payment Received) + TOTAL · Withholding Tax (7%) = round(Invoice Amount × 7%, 2) ราย INVOICE
           กล่องสรุป Invoice Amount / Withholding Tax (7%) / Payment Received · "เลือกทั้งหมด" = ทุกหน้าตามผลค้นหาปัจจุบัน (ไม่ใช่เฉพาะหน้าที่แสดง) · สูงสุด 3,000 Invoice ต่อครั้ง ═══ */
var SEL795 = new Map(), ROW795 = new Map(), CTX795 = null;
var PM795 = [["TRANSFER", "โอนเงิน", "Bank Transfer"], ["CASH", "เงินสด", "Cash"], ["CHEQUE", "เช็ค", "Cheque"], ["OTHER", "อื่น ๆ", "Other"]];
function PML795(k) { let r = PM795.find((x) => x[0] === k); return r ? r[2] : String(k || ""); }
function M795(v) { let x = Number(v); return isFinite(x) ? x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"; }
function C795(v) { return Math.round(Number(v || 0) * 100); }
function D795(v) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
function TD795() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch (e) { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); } }
function W795(v) {   /* จำนวนเงินเป็นคำ (อังกฤษ) : Baht + Satang — ตรงยอดถึงสตางค์ */
  let c = Math.round(Number(v || 0) * 100), b = Math.floor(c / 100), s = c % 100;
  let O = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  let T = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let h = (n) => { let r = []; if (n >= 100) { r.push(O[Math.floor(n / 100)] + " Hundred"); n %= 100; } if (n >= 20) { r.push(T[Math.floor(n / 10)] + (n % 10 ? "-" + O[n % 10] : "")); } else if (n > 0) r.push(O[n]); return r.join(" "); };
  let w = (n) => { if (n === 0) return "Zero"; let S = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]], r = []; S.forEach(([d, l]) => { if (n >= d) { r.push(h(Math.floor(n / d)) + " " + l); n %= d; } }); if (n > 0) r.push(h(n)); return r.join(" "); };
  return w(b) + " Baht" + (s ? " and " + w(s) + " Satang" : "") + " Only";
}
var HO795 = /\s*\(?\s*head\s*office\s*\)?\s*[.,]?\s*$/i;
function NM795(v) {   /* ชื่อลูกค้า : "...LTD.HEAD OFFICE" → "...LTD. (HEAD OFFICE)" · ไม่มีคำว่า HEAD OFFICE = ชื่อเดิม (ไม่เติมเอง) */
  let s = String(v == null ? "" : v).replace(/\s+/g, " ").trim(); if (!HO795.test(s)) return s;
  let b = s; for (let k = 0; k < 5 && HO795.test(b); k++) b = b.replace(HO795, "");
  b = b.replace(/\s+[.,]+$/, "").trim(); return b ? b + " (HEAD OFFICE)" : s;
}
function IS795(I) { I = I || {}; return Object.assign({}, I, { nameEn: String(I.nameEn || "").replace(HO795, "").trim(), address: String(I.address || "").replace(HO795, "").trim(), branch: "0000", head_office: !0 }); }
function CO795(I) { let nm = String(I && I.nameEn || "").replace(HO795, "").trim(); return nm + (I && I.head_office === false ? "" : " (HEAD OFFICE)"); }
function BR795(v) { let s = v == null ? "" : String(v).trim(); return s || "-"; }   /* ข้อความ — รักษาศูนย์นำหน้า */
function CR795(c) { if (!c || typeof c !== "object") return "-"; if (c.mixed) return "ตามใบแจ้งหนี้"; if (c.days === null || c.days === undefined || c.days === "") return "-"; let k = Number(c.days); return isFinite(k) ? k + " Days" : "-"; }
function CAN795() { try { return !!(E("receive_payment") || /^(SUPER_ADMIN|ADMIN)$/.test(String(L.profile && L.profile.role || ""))); } catch (e) { return !1; } }
function AM795(o) {   /* ยอดต่อ INVOICE (สตางค์) — แสดงผลเท่านั้น · Server เป็นผู้คำนวณจริง */
  let a = C795(o && o.service_amount) + C795(o && o.vat_amount), w = Math.round(a * 7 / 100);   /* V.796 : WHT 7% ของ Invoice Amount (ปัดราย INVOICE) */
  return { inv: a, wht: w, rcv: a - w };
}
function OK795(o) {
  if (!CAN795()) return "ไม่มีสิทธิ์ออกใบเสร็จ";
  let no = String(o && o.invoice_no || "").trim();
  if (!o || !o.invoice_id || !no || /^DRAFT-/i.test(no)) return "ไม่พบเลข INVOICE NJ — ออกใบเสร็จไม่ได้";
  if (String(o.payment_status || "UNPAID").toUpperCase() !== "UNPAID") return "รับชำระแล้ว / บางส่วน";
  let a = AM795(o); if (a.inv <= 0 || a.rcv <= 0) return "ไม่มียอด Service";
  return "";
}
function RH795() { ST795(); return '<th class="center col-sel rcp795-th" data-col-req="1" data-col-key="_rcp795" data-col-export="no" title="เลือกทั้งหมด — ทุกหน้าตามผลค้นหาปัจจุบัน (ยกเลิก = ล้างรายการที่เลือกทั้งหมด)"><input type="checkbox" class="rcp795-cb" id="rcp795-all" aria-label="เลือกทั้งหมดทุกหน้าตามผลค้นหา"></th>'; }
function RC795(o) {
  let id = String(o && o.invoice_id || ""); id && ROW795.set(id, o);
  let why = OK795(o);
  if (why) { SEL795.delete(id); return `<td class="center col-sel rcp795-td"><span class="rcp795-x" title="${i(why)}">–</span></td>`; }
  return `<td class="center col-sel rcp795-td"><input type="checkbox" class="rcp795-cb" data-rcp="${i(id)}"${SEL795.has(id) ? " checked" : ""} aria-label="เลือก ${i(o.invoice_no || "")}"></td>`;
}
function RB795() { ST795(); return `<div class="rcp795-bar" id="rcp795-bar"${CAN795() ? "" : " hidden"}><button type="button" class="btn btn-sm rcp795-btn" id="rcp795-btn" disabled title="ออกใบเสร็จ RECEIPT จากรายการที่เลือก">🧾 ออกใบเสร็จ RECEIPT PDF</button><span class="rcp795-info" id="rcp795-info">ยังไม่ได้เลือกรายการ</span><button type="button" class="btn btn-sm btn-o" id="rcp795-allp" title="เลือก Invoice ที่ออกใบเสร็จได้ครบทุกหน้าตามผลค้นหาปัจจุบัน">☑ เลือกทั้งหมด (ทุกหน้า)</button><button type="button" class="btn btn-sm btn-o" id="rcp795-clear" disabled>ล้างรายการที่เลือก</button></div>`; }
function RS795(t) {   /* sync แถบสรุป + หัวตาราง */
  if (!t) return;
  let btn = t.querySelector("#rcp795-btn"), info = t.querySelector("#rcp795-info"), clr = t.querySelector("#rcp795-clear"), cnt = SEL795.size, sum = 0;
  SEL795.forEach((r) => { sum += AM795(r).rcv; });
  if (btn) { btn.disabled = !cnt; btn.textContent = "🧾 ออกใบเสร็จ RECEIPT PDF" + (cnt ? " (" + cnt + ")" : ""); }
  if (clr) clr.disabled = !cnt;
  if (info && !t.__rcpBusy) info.textContent = cnt ? "เลือก " + cnt.toLocaleString("th-TH") + " Invoice · Payment Received รวม " + M795(sum / 100) : "ยังไม่ได้เลือกรายการ";
  let all = t.querySelector("#rcp795-all"), cbs = [...t.querySelectorAll("#rp-tbody .rcp795-cb[data-rcp]")];
  if (all) { let k = cbs.filter((c) => c.checked).length; all.disabled = !cbs.length || !CAN795(); all.checked = !!cbs.length && k === cbs.length; all.indeterminate = k > 0 && k < cbs.length; }
}
function RA795(t, refresh) {   /* ผูก event ครั้งเดียวต่อหน้า */
  CTX795 = { root: t, refresh: refresh || (CTX795 && CTX795.refresh) };
  if (t.__rcp795) { RS795(t); return; }
  t.__rcp795 = 1;
  t.addEventListener("change", (ev) => {
    let c = ev.target; if (!c || !c.classList || !c.classList.contains("rcp795-cb")) return;
    if (c.id === "rcp795-all") {   /* V.796 : เลือกทั้งหมดทุกหน้าตามผลค้นหา · ยกเลิก = ล้างทั้งหมด */
      if (c.checked) { SAL795(t, c); return; }
      SEL795.clear(); t.querySelectorAll("#rp-tbody .rcp795-cb[data-rcp]").forEach((x) => { x.checked = !1; });
    } else if (c.dataset.rcp) {
      let r = ROW795.get(c.dataset.rcp);
      if (c.checked && r && !OK795(r)) SEL795.set(c.dataset.rcp, r); else { SEL795.delete(c.dataset.rcp); c.checked = !1; }
    }
    RS795(t);
  });
  t.addEventListener("click", (ev) => {
    let b = ev.target.closest && ev.target.closest("#rcp795-btn,#rcp795-clear,#rcp795-allp,[data-rcp-pv],[data-rcp-pr],[data-rcp-sv]"); if (!b || !t.contains(b)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.id === "rcp795-clear") { SEL795.clear(); t.querySelectorAll(".rcp795-cb").forEach((x) => { x.checked = !1; x.indeterminate = !1; }); RS795(t); return; }
    if (b.id === "rcp795-btn") { b.disabled || RO795(t); return; }
    if (b.id === "rcp795-allp") { b.disabled || SAL795(t, b); return; }
    if (b.dataset.rcpPv) { RG795([b.dataset.rcpPv]); return; }
    if (b.dataset.rcpPr) { RPR795(b.dataset.rcpPr, b); return; }
    if (b.dataset.rcpSv) SV795(b.dataset.rcpSv, b);
  });
  RS795(t);
}
/* แถบใบเสร็จที่ออกแล้ว : แถวเดียวกับรอรับชำระ (RR522) + สถานะ + จัดการ */
function RI795(o) {
  ST795(); let id = i(o.receipt_id || ""), no = i(o.receipt_no || "");
  return `<tr data-inv="${i(o.invoice_id || "")}" data-rcp-id="${id}"><td class="center col-sel rcp795-td"><span class="rcp795-x" title="ออกใบเสร็จแล้ว (${no})">🔒</span></td>${RR522(o)}`
    + `<td class="nowrap"><span class="bdg795">ออกใบเสร็จแล้ว</span><div class="rcp795-no">${no}${o.receipt_date ? " · " + D795(o.receipt_date) : ""}</div></td>`
    + `<td class="center nowrap col-act"><button type="button" class="btn btn-sm rcp795-b rcp795-pv" data-rcp-pv="${id}" title="PREVIEW — ${no}">PREVIEW</button>`
    + `<button type="button" class="btn btn-sm rcp795-b rcp795-pr" data-rcp-pr="${id}" title="PRINT — ${no} (เลขเดิม)">PRINT</button>`
    + `<button type="button" class="btn btn-sm rcp795-b rcp795-sv" data-rcp-sv="${id}" title="SAVE PDF — RECEIPT_${no}.pdf">SAVE PDF</button></td></tr>`;
}
function RHL795() { ST795(); return '<th class="center col-sel rcp795-th" data-col-req="1" data-col-key="_rcp795" data-col-export="no" title="ออกใบเสร็จแล้ว (เลือกออกซ้ำไม่ได้)">🔒</th>'; }
var RIH795 = '<th>สถานะ</th><th class="center col-act">จัดการ</th>';
async function SAL795(t, b) {   /* V.796 : เลือกทั้งหมด = Invoice ที่ออกใบเสร็จได้ครบทุกหน้าตามผลค้นหาปัจจุบัน (ข้อมูลในสิทธิ์จาก Server) · Map ตาม INVOICE ไม่ซ้ำ */
  if (!CAN795() || t.__rcpBusy) return; t.__rcpBusy = 1; b && (b.disabled = !0);
  let info = t.querySelector("#rcp795-info"), all = t.querySelector("#rcp795-all"), n0 = SEL795.size;
  try {
    let f = Object.assign({ company_group: "NJ", q: $.q || null, customer_id: $.customer || null }, FP678($)), total = null, seen = 0;
    for (let pg = 1; pg <= 100; pg++) {
      info && (info.textContent = "กำลังเลือกทั้งหมดตามผลค้นหา… " + seen.toLocaleString("th-TH") + (total != null ? " / " + total.toLocaleString("th-TH") : ""));
      let r = await et(Object.assign({}, f, { page: pg, size: 200 })), rows = (r && r.rows) || [];
      total == null && (total = Number(r && r.total) || 0); seen += rows.length;
      rows.forEach((o) => { let id = String(o && o.invoice_id || ""); if (!id) return; ROW795.set(id, o); OK795(o) || SEL795.set(id, o); });
      if (!rows.length || pg * 200 >= total) break;
    }
    t.querySelectorAll("#rp-tbody .rcp795-cb[data-rcp]").forEach((x) => { x.checked = SEL795.has(x.dataset.rcp); });
    k("เลือกทั้งหมด " + SEL795.size.toLocaleString("th-TH") + " Invoice ตามผลค้นหา (เพิ่ม " + (SEL795.size - n0).toLocaleString("th-TH") + ")", "ok");
  } catch (e) { k("เลือกทั้งหมดไม่สำเร็จ — " + (e && e.message || e), "err"); all && (all.checked = !1); }
  finally { t.__rcpBusy = 0; b && (b.disabled = !1); RS795(t); }
}
function RE795(e) {   /* ข้อความ Error จาก Server → ภาษาไทย */
  let m = String(e && e.message || e || ""), j = (s) => { try { return JSON.parse(m.slice(m.indexOf(s) + s.length).trim()); } catch (x) { return null; } };
  if (/NJACC_RCP_CHANGED/.test(m)) { let a = j("NJACC_RCP_CHANGED:") || []; return "ข้อมูล / ยอดเปลี่ยนจากตอนดูตัวอย่าง — กรุณาตรวจสอบใหม่ก่อนยืนยัน" + (a.length ? " (" + a.map((x) => (x.invoice_no || "") + " : " + M795(x.preview) + " → " + M795(x.now)).join(", ") + ")" : ""); }
  if (/NJACC_RCP_INVALID/.test(m)) { let a = j("NJACC_RCP_INVALID:") || []; return "มีรายการที่ออกใบเสร็จไม่ได้ : " + a.map((x) => (x.invoice_no || x.job_no || "") + " — " + x.reason).join(" · "); }
  if (/NJACC_RCP_DATE_BEFORE_START/.test(m)) return "วันที่ใบเสร็จต้องตั้งแต่ 01/11/2026";
  if (/NJACC_RCP_DATE_REQUIRED/.test(m)) return "กรุณาเลือกวันที่ใบเสร็จ";
  if (/NJACC_RCP_METHOD_REQUIRED/.test(m)) return "กรุณาเลือกวิธีรับชำระ";
  if (/NJACC_RCP_LOCKED/.test(m)) return m.replace(/^.*NJACC_RCP_LOCKED:\s*/, "");
  if (/NJACC_RCP_NOT_FOUND/.test(m)) return "ไม่พบใบเสร็จ";
  if (/NJACC_RCP_TOO_MANY/.test(m)) return "เลือกได้สูงสุด 3,000 Invoice ต่อครั้ง";
  if (/NJACC_(MODULE_)?FORBIDDEN/.test(m)) return "ไม่มีสิทธิ์";
  if (/njacc_rcp795|PGRST202|schema cache/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-795)";
  return m;
}
function RQ795() { try { return "rcp795-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); } catch (e) { return "rcp795-" + Date.now() + "-" + Math.random().toString(36).slice(2); } }
async function RO795(t) {   /* หน้าต่างออกใบเสร็จ */
  let ids = [...SEL795.keys()]; if (!ids.length) return;
  if (ids.length > 3000) { k("เลือกได้สูงสุด 3,000 Invoice ต่อครั้ง — กรุณาค้นหาให้แคบลง", "err"); return; }
  let st = { pv: null, seen: !1, req: RQ795(), busy: !1, done: null };
  let body = document.createElement("div"); body.className = "rcp795-m";
  body.innerHTML = `<div id="rcp795-pane-form"><div class="rcp795-f">
      <label>วันที่ใบเสร็จ <span class="req">*</span><input type="date" class="inp" id="rcp795-date" value="${TD795()}" min="2026-11-01"></label>
      <label>วิธีรับชำระ <span class="req">*</span><select class="sel" id="rcp795-method"><option value="">— เลือก —</option>${PM795.map((p) => `<option value="${p[0]}">${i(p[1])} (${i(p[2])})</option>`).join("")}</select></label>
    </div><div id="rcp795-sum" class="rcp795-sum"><div class="load-row"><div class="spin"></div></div></div></div><div id="rcp795-pane-doc" hidden></div>`;
  let foot = document.createElement("div"); foot.className = "rcp795-foot";
  foot.innerHTML = `<button class="btn btn-o" data-close>ปิด</button><button class="btn btn-o" id="rcp795-pv" disabled>👁 ดูตัวอย่าง</button><button class="btn btn-p" id="rcp795-ok" disabled>✅ ยืนยันออกใบเสร็จ</button>`;
  Q({ title: "ใบเสร็จรับเงิน / RECEIPT", body, footer: foot, fullscreen: !0, wide: !0 });
  let q = (s) => body.querySelector(s) || foot.querySelector(s), sum = q("#rcp795-sum"), pf = q("#rcp795-pane-form"), pd = q("#rcp795-pane-doc");
  let back = () => { pd.hidden = !0; pd.innerHTML = ""; pf.hidden = !1; };
  let ask = (html) => new Promise((res) => {
    let old = pf.querySelector(".rcp795-ask"); old && old.remove();
    pf.insertAdjacentHTML("afterbegin", `<div class="rcp795-ask"><div>${html}</div><div class="rcp795-ask-b"><button class="btn btn-o" data-ask="0">ยกเลิก</button><button class="btn btn-p" data-ask="1">ยืนยันออกใบเสร็จ</button></div></div>`);
    let box = pf.querySelector(".rcp795-ask"); box.scrollIntoView && box.scrollIntoView({ block: "nearest" });
    box.querySelectorAll("[data-ask]").forEach((x) => { x.onclick = () => { box.remove(); res(x.dataset.ask === "1"); }; });
  });
  let showDocs = async (docs, o) => { pf.hidden = !0; pd.hidden = !1; pd.innerHTML = '<div class="load-row"><div class="spin"></div></div>'; await RW795(docs, Object.assign({ back }, o), pd); };
  let sync = () => {
    let ok = st.pv && !st.pv.errors.length && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value && !st.done;
    q("#rcp795-pv").disabled = !(st.pv && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value) || st.busy || !!st.done;
    q("#rcp795-ok").disabled = !ok || !st.seen || st.busy;
    q("#rcp795-ok").title = ok && !st.seen ? "กรุณากดดูตัวอย่างก่อนยืนยัน" : "";
  };
  let draw = () => {
    let p = st.pv; if (!p) return;
    let tot = p.groups.reduce((s, g) => s + C795(g.total), 0);
    sum.innerHTML = (p.errors.length ? `<div class="rcp795-err"><b>⚠ รายการที่ออกใบเสร็จไม่ได้ (${p.errors.length}) — ระงับการยืนยัน</b><ul>${p.errors.map((e) => `<li>${i(e.invoice_no || "-")}${e.job_no ? " · " + i(e.job_no) : ""} — ${i(e.reason)}</li>`).join("")}</ul><button class="btn btn-sm btn-o" id="rcp795-drop">นำรายการที่มีปัญหาออกจากรายการที่เลือก</button></div>` : "")
      + `<div class="rcp795-hd">ใบเสร็จที่จะออก ${p.groups.length} ฉบับ (1 ฉบับต่อลูกค้า) · ${p.groups.reduce((s, g) => s + Number(g.count || 0), 0)} รายการ · Payment Received รวม <b>${M795(tot / 100)}</b></div>`
      + p.groups.map((g, k) => `<div class="rcp795-g"><div class="rcp795-gh"><span>ฉบับที่ ${k + 1} · <b>${i(g.customer_name)}</b></span><span>${Number(g.count)} รายการ · <b>${M795(g.total)}</b></span></div>
          <table class="tbl rcp795-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Invoice Amount</th><th class="r">Withholding Tax (7%)</th><th class="r">Payment Received</th></tr></thead><tbody>${(g.items || []).map((x, j) => `<tr><td class="center">${j + 1}</td><td>${i(x.invoice_no)}</td><td>${D795(x.invoice_date)}</td><td class="t-3">${i(x.job_no || "")}</td><td class="r">${M795(x.invoice_amount)}</td><td class="r">${M795(x.wht_amount)}</td><td class="r">${M795(x.received)}</td></tr>`).join("")}</tbody></table></div>`).join("");
    let dr = q("#rcp795-drop"); dr && (dr.onclick = () => { p.errors.forEach((e) => SEL795.delete(String(e.invoice_id))); RS795(t); t.querySelectorAll(".rcp795-cb[data-rcp]").forEach((c) => { c.checked = SEL795.has(c.dataset.rcp); }); ids = [...SEL795.keys()]; ids.length ? load() : (sum.innerHTML = '<div class="empty">ไม่มีรายการที่เลือก</div>', st.pv = null, sync()); });
    sync();
  };
  let load = async () => {
    st.pv = null; st.seen = !1; sync(); sum.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลล่าสุดจาก Server…</div></div>';
    try { let r = await V("njacc_rcp795_preview", { p: { invoice_ids: ids } }); st.pv = { errors: r && r.errors || [], groups: r && r.groups || [] }; draw(); }
    catch (e) { sum.innerHTML = `<div class="rcp795-err">${i(RE795(e))}</div>`; sync(); }
  };
  q("#rcp795-date").onchange = () => { st.seen = !1; sync(); };
  q("#rcp795-method").onchange = () => { st.seen = !1; sync(); };
  q("#rcp795-pv").onclick = async () => {
    let d = q("#rcp795-date").value, m = q("#rcp795-method").value; if (!st.pv || !d || !m) return;
    let I = IS795(x);
    let docs = st.pv.groups.map((g) => ({ receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, credit: g.credit,
      customer: { name: g.customer_name, tax_id: g.customer_tax_id, branch_code: g.customer_branch, address: g.customer_address },
      items: (g.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "SERVICE CHARGE", invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received })),
      invoice_amount: g.invoice_amount, wht_amount: g.wht_amount, total: g.total }));
    st.seen = !0; sync();
    await showDocs(docs, { sample: !0 });
  };
  q("#rcp795-ok").onclick = async () => {
    if (st.busy || !st.pv || st.pv.errors.length || !st.seen) return;
    let d = q("#rcp795-date").value, m = q("#rcp795-method").value, ng = st.pv.groups.length, cnt = st.pv.groups.reduce((s, g) => s + Number(g.count || 0), 0);
    back();
    if (!(await ask(`ออกใบเสร็จ <b>${ng} ฉบับ</b> · ${cnt} รายการ · วันที่ ${D795(d)} · ${i(PML795(m))}<br>เมื่อยืนยันแล้ว ระบบจะออกเลข RCP จริง เปลี่ยนรายการเป็น PAID ย้ายไปแถบ “ใบเสร็จที่ออกแล้ว” และล็อกข้อมูลทันที (แก้ไข / ลบ / UNPOST ไม่ได้)`))) return;
    st.busy = !0; sync(); let ok = q("#rcp795-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let exp = st.pv.groups.flatMap((g) => (g.items || []).map((z) => ({ invoice_id: z.invoice_id, invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received, customer_id: g.customer_id, invoice_no: z.invoice_no })));
      let r = await V("njacc_rcp795_issue", { p: { request_id: st.req, invoice_ids: exp.map((z) => z.invoice_id), receipt_date: d, payment_method: m, issuer: IS795(x), expected: exp } });
      st.done = r && r.receipts || []; st.req = RQ795();
      SEL795.clear(); RS795(t);
      sum.innerHTML = `<div class="rcp795-okbox"><b>✅ ออกใบเสร็จสำเร็จ ${st.done.length} ฉบับ</b> — รายการเปลี่ยนเป็น PAID ย้ายไปแถบ “ใบเสร็จที่ออกแล้ว” และล็อกแล้ว</div>`
        + `<table class="tbl rcp795-t"><thead><tr><th>Receipt No.</th><th>ลูกค้า</th><th class="r">รายการ</th><th class="r">Payment Received</th><th></th></tr></thead><tbody>${st.done.map((z) => `<tr><td class="t-b">${i(z.receipt_no)}</td><td>${i(z.customer_name)}</td><td class="r">${Number(z.count)}</td><td class="r">${M795(z.total)}</td><td class="r"><button class="btn btn-sm btn-p" data-rcp-open="${i(z.id)}">ดู / ดาวน์โหลด / พิมพ์</button></td></tr>`).join("")}</tbody></table>`;
      let open = async (ids2) => { try { await showDocs(await RL795(ids2), { sample: !1 }); } catch (e) { back(); k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e) + " (ดาวน์โหลดภายหลังได้จากแถบใบเสร็จที่ออกแล้ว)", "err"); } };
      sum.querySelectorAll("[data-rcp-open]").forEach((b) => { b.onclick = () => open([b.dataset.rcpOpen]); });
      foot.insertAdjacentHTML("beforeend", `<button class="btn btn-green" id="rcp795-all-docs">📄 ดู / ดาวน์โหลด / พิมพ์ (${st.done.length} ฉบับ)</button>`);
      q("#rcp795-all-docs").onclick = () => open(st.done.map((z) => z.id));
      ok.textContent = "✅ ออกแล้ว"; k("ออกใบเสร็จ " + st.done.map((z) => z.receipt_no).join(", ") + " แล้ว", "ok");
      try { CTX795 && CTX795.refresh && CTX795.refresh(); } catch (e) {}
      await open(st.done.map((z) => z.id));
    } catch (e) {
      let msg = RE795(e); k("ออกใบเสร็จไม่สำเร็จ — " + msg, "err"); ok.textContent = "✅ ยืนยันออกใบเสร็จ";
      if (/NJACC_RCP_(CHANGED|INVALID)/.test(String(e && e.message || e))) { await load(); sum.insertAdjacentHTML("afterbegin", `<div class="rcp795-err">${i(msg)}</div>`); }
    } finally { st.busy = !1; sync(); }
  };
  await load();
}
async function RL795(ids) {   /* ใบเสร็จที่บันทึก (สำเนาข้อมูล ณ เวลาออก) — ไม่ออกเลขใหม่ · ไม่ตัดรับชำระซ้ำ */
  let docs = [];
  for (let id of [].concat(ids || []).filter(Boolean)) {
    let r = await V("njacc_rcp795_get", { p_id: id }), s = r && r.snapshot || {};
    docs.push({ id: r.id, receipt_no: r.receipt_no, receipt_date: r.receipt_date, payment_method: s.payment_method || r.payment_method, issuer: s.issuer || {}, customer: s.customer || {}, items: s.items || [],
      invoice_amount: s.invoice_amount != null ? s.invoice_amount : r.invoice_amount, wht_amount: s.wht_amount != null ? s.wht_amount : r.wht_amount, total: s.total != null ? s.total : r.total, credit: s.credit });
  }
  return docs;
}
async function RG795(ids) { try { let docs = await RL795(ids); docs.length && (await RW795(docs, { sample: !1, title: "RECEIPT " + docs.map((d) => d.receipt_no).join(", ") })); } catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); } }
async function RPR795(id, b) {   /* PRINT จากแถว : เอกสารที่บันทึก (เลขเดิม) */
  if (!id || (b && b.disabled)) return; b && (b.disabled = !0);
  try { let d = (await RL795([id]))[0]; if (!d) throw new Error("ไม่พบใบเสร็จ"); await FN795(); await IM795(d); RX795(RF795(d, !1), "RECEIPT_" + d.receipt_no); }
  catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); } finally { b && (b.disabled = !1); }
}
async function SV795(id, b) {   /* SAVE PDF จากแถว : เอกสารที่บันทึก (เลขเดิม) */
  if (!id || (b && b.disabled)) return;
  try { let d = (await RL795([id]))[0]; if (!d) throw new Error("ไม่พบใบเสร็จ"); await SVH795(RF795(d, !1), "RECEIPT_" + d.receipt_no, b); }
  catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); }
}
async function FN795() { ST795(); try { let m = await import("./chunk-TKN6STDT.js"); m.FF766 && (await m.FF766()); } catch (e) {} }
async function IM795(d) { let src = d && d.issuer && d.issuer.logo; src && (await Promise.race([new Promise((r) => { let im = new Image(); im.onload = im.onerror = r; im.src = src; }), new Promise((r) => setTimeout(r, 3000))])); }
/* ── PDF (A4 แนวตั้ง) ── */
function RP795(doc, counts, sample) {
  let I = doc.issuer || {}, C = doc.customer || {}, items = doc.items || [];
  let sInv = doc.invoice_amount != null ? Number(doc.invoice_amount) : items.reduce((s, z) => s + C795(z.invoice_amount), 0) / 100;
  let sW = doc.wht_amount != null ? Number(doc.wht_amount) : items.reduce((s, z) => s + C795(z.wht_amount), 0) / 100;
  let sR = doc.total != null ? Number(doc.total) : items.reduce((s, z) => s + C795(z.received), 0) / 100;
  let nm = String(I.nameEn || "").replace(HO795, "").trim();
  let pages = [], a = 0, N = counts.length;
  counts.forEach((kk, p) => {
    let last = p === N - 1, rows = items.slice(a, a + kk); a += kk;
    pages.push(`<div class="rcp-pg" data-pg="${p + 1}">
  <div class="rcp-in">
    <header class="rcp-hd">
      <div class="rcp-co"><img class="rcp-logo" src="${i(I.logo || "")}" alt="">
        <div class="rcp-cot"><div class="rcp-conm">${i(CO795(I))}</div><div class="rcp-cosub">${i(String(I.address || "").replace(HO795, "").trim())}</div>
        <div class="rcp-cosub">Tax ID: ${i(I.taxId || "-")}&nbsp;&nbsp;Branch : ${i(BR795(I.branch || "0000"))}</div>
        <div class="rcp-cosub">Tel. ${i(I.tel || "-")} | Fax. ${i(I.fax || "-")}</div></div></div>
      <div class="rcp-tt"><div class="rcp-t1">RECEIPT</div><div class="rcp-t2">ใบเสร็จรับเงิน</div></div>
    </header>
    <div class="rcp-boxes">
      <section class="rcp-box"><span class="rcp-tag">CUSTOMER</span>
        <div class="rcp-kv"><b>Customer Name</b><b>:</b><span>${i(NM795(C.name) || "-")}</span></div>
        <div class="rcp-kv"><b>Tax ID</b><b>:</b><span class="rcp-tx"><span>${i(C.tax_id || "-")}</span><span class="rcp-brn"><b>Branch :</b> ${i(BR795(C.branch_code))}</span></span></div>
        <div class="rcp-kv"><b>Address</b><b>:</b><span class="rcp-addr">${i(C.address || "-")}</span></div></section>
      <section class="rcp-box rcp-box-r"><span class="rcp-tag">RECEIPT DETAILS</span>
        <div class="rcp-kv"><b>Receipt No.</b><b>:</b><span class="rcp-no">${i(doc.receipt_no)}</span></div>
        <div class="rcp-kv"><b>Receipt Date</b><b>:</b><span>${D795(doc.receipt_date)}</span></div>
        <div class="rcp-kv"><b>Credit</b><b>:</b><span>${i(CR795(doc.credit))}</span></div></section>
    </div>
    <table class="rcp-tb"><colgroup><col style="width:8%"><col style="width:24%"><col style="width:18%"><col style="width:26%"><col style="width:24%"></colgroup>
      <thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>Description</th><th class="r">Amount Charge</th></tr></thead>
      <tbody>${rows.map((z) => `<tr><td class="c">${i(z.no)}</td><td class="c">${i(z.invoice_no)}</td><td class="c">${D795(z.invoice_date)}</td><td>${i(z.description || "SERVICE CHARGE")}</td><td class="r">${M795(z.received)}</td></tr>`).join("")}
      ${last ? `<tr class="rcp-tot"><td colspan="4" class="c">TOTAL</td><td class="r">${M795(sR)}</td></tr>` : ""}</tbody></table>
    ${last ? `<div class="rcp-sum">
      <div class="rcp-box rcp-pay"><div><b>Payment Method :</b> ${i(PML795(doc.payment_method))}</div><div><b>Amount in Words :</b> ${i(W795(sR))}</div></div>
      <div class="rcp-box rcp-amt"><div class="rcp-a1"><b>Invoice Amount</b><b>${M795(sInv)}</b></div><div class="rcp-a1 rcp-aw"><b>Withholding Tax (7%)</b><b>${M795(sW)}</b></div><div class="rcp-a2"><b>Payment Received</b><b>${M795(sR)}</b></div></div>
    </div>
    <div class="rcp-sign">
      <div class="rcp-box"><b class="rcp-st">PAYER SIGNATURE</b><div class="rcp-sp"></div><div class="rcp-sl"></div><div class="rcp-sc">Signature / Printed Name</div><div>Date: ________ / ________ / ____________</div></div>
      <div class="rcp-box"><b class="rcp-st">AUTHORIZED RECEIVER</b><div class="rcp-for">${i(nm)}</div><div class="rcp-sp2"></div><div class="rcp-sl"></div><div class="rcp-sc">Signature / Printed Name</div><div>Date: ${D795(doc.receipt_date)}</div></div>
    </div>${sample ? '<div class="rcp-stamp">SAMPLE / ตัวอย่าง</div>' : ""}` : ""}
  </div>
  <footer class="rcp-ft"><div class="rcp-ftx"><div><b>${i(nm)}</b><div>This receipt confirms the payment recorded above.</div></div><b>PAGE ${p + 1} / ${N}</b></div><div class="rcp-bar"><i></i><i></i></div></footer>
</div>`);
  });
  return pages.join("");
}
function RF795(doc, sample) {   /* แบ่งหน้าตามพื้นที่จริง : แถวไม่ข้ามหน้า · TOTAL / ตัวอักษร / สรุป / ลงนาม อยู่หน้าสุดท้าย */
  ST795(); let items = doc.items || [], c = [Math.max(1, items.length)];
  if (!document.body) return RP795(doc, c, sample);
  let box = document.createElement("div"); box.className = "rcp795-doc"; box.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden"; document.body.appendChild(box);
  let over = (pg) => { let ft = pg.querySelector(".rcp-ft").getBoundingClientRect().top, b = 0; pg.querySelectorAll(".rcp-in > *:not(.rcp-stamp)").forEach((z) => { b = Math.max(b, z.getBoundingClientRect().bottom); }); return b > ft - 4; };
  try {
    for (let n = 0; n < items.length + 2; n++) {
      box.innerHTML = RP795(doc, c, sample);
      let bad = [...box.querySelectorAll(".rcp-pg")].findIndex((pg, j) => over(pg) && c[j] > 1);
      if (bad < 0) break;
      c[bad] -= 1; bad + 1 < c.length ? (c[bad + 1] += 1) : c.push(1);
    }
    let lp = [...box.querySelectorAll(".rcp-pg")].pop();
    if (lp && over(lp) && c[c.length - 1] > 1) { c[c.length - 1] -= 1; c.push(1); }
    return RP795(doc, c, sample);
  } finally { box.remove(); }
}
async function RW795(docs, o, host) {   /* Preview = DOM เดียวกับ PDF / Print */
  await FN795(); for (let d of docs) await IM795(d);
  let parts = docs.map((d) => RF795(d, o.sample)), html = parts.join("");
  let bar = `<div class="rcp795-dbar">${o.back ? '<button class="btn btn-o" data-rcp-back>← กลับ</button>' : ""}` + (o.sample
    ? `<span class="rcp795-smp">ตัวอย่าง ${docs.length} ฉบับ (1 ฉบับต่อลูกค้า) — ยังไม่ออกเลข · ยังไม่ตัดรับชำระ · ยังไม่ล็อก</span><button class="btn btn-p" data-rcp-px="-1">🖨 พิมพ์ตัวอย่าง</button>`
    : docs.map((d, j) => `<span class="rcp795-dno">${i(d.receipt_no)}</span><button class="btn btn-green" data-rcp-dl="${j}" title="RECEIPT_${i(d.receipt_no)}.pdf">⬇ ดาวน์โหลด PDF</button><button class="btn btn-p" data-rcp-px="${j}">🖨 พิมพ์</button>`).join("")) + "</div>";
  let wrap = bar + `<div class="rcp795-pv"><div class="rcp795-doc">${html}</div></div>`;
  if (host) host.innerHTML = wrap;
  else { host = document.createElement("div"); host.innerHTML = wrap; let foot = document.createElement("div"); foot.className = "rcp795-foot"; foot.innerHTML = '<button class="btn btn-o" data-close>ปิด</button>'; Q({ title: o.title || "RECEIPT", body: host, footer: foot, fullscreen: !0, wide: !0 }); }
  host.querySelectorAll("[data-rcp-px]").forEach((b) => { b.onclick = () => { let j = Number(b.dataset.rcpPx); j < 0 ? RX795(html, "RECEIPT_SAMPLE") : RX795(parts[j], "RECEIPT_" + docs[j].receipt_no); }; });
  host.querySelectorAll("[data-rcp-dl]").forEach((b) => { b.onclick = () => { let j = Number(b.dataset.rcpDl); SVH795(parts[j], "RECEIPT_" + docs[j].receipt_no, b); }; });
  let bk = host.querySelector("[data-rcp-back]"); bk && (bk.onclick = o.back);
}
function RX795(html, fname) {   /* พิมพ์ / บันทึก PDF (A4 แนวตั้ง · ชื่อไฟล์ = ชื่อเอกสาร) */
  ST795(); let old = document.getElementById("rcp795-print-root"); old && old.remove();
  let root = document.createElement("div"); root.id = "rcp795-print-root"; root.className = "rcp795-doc"; root.innerHTML = html; document.body.appendChild(root);
  let ps = document.createElement("style"); ps.id = "rcp795-page"; ps.textContent = "@page{size:A4 portrait;margin:0}"; document.head.appendChild(ps);
  let t0 = document.title; document.title = fname; document.body.classList.add("rcp795-printing");
  let done = () => { document.body.classList.remove("rcp795-printing"); document.title = t0; ps.remove(); root.remove(); };
  window.addEventListener("afterprint", done, { once: !0 });
  try { window.print(); } catch (e) { done(); }
}
var LJ795 = {};
function LS795(url, ok) { if (ok()) return Promise.resolve(); return LJ795[url] || (LJ795[url] = new Promise((res, rej) => { let s = document.createElement("script"); s.src = url; s.async = !0; s.onload = () => (ok() ? res() : rej(new Error("load " + url))); s.onerror = () => { delete LJ795[url]; rej(new Error("load " + url)); }; document.head.appendChild(s); })); }
async function SVH795(html, fname, b) {   /* ดาวน์โหลด PDF (RECEIPT_<เลข RCP>.pdf) จากหน้าเอกสารเดียวกับ PREVIEW / PRINT · โหลดไลบรารีไม่ได้ = เปิดหน้าพิมพ์ให้บันทึกเป็น PDF */
  if (b && b.disabled) return; b && (b.disabled = !0);
  let box = document.createElement("div");
  try {
    await FN795();
    await Promise.all([LS795("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", () => typeof window.html2canvas === "function"),
                       LS795("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", () => !!(window.jspdf && window.jspdf.jsPDF))]);
    box.className = "rcp795-doc rcp795-off"; box.innerHTML = html; document.body.appendChild(box);
    await Promise.all([...box.querySelectorAll("img")].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 3000); })));
    try { document.fonts && (await document.fonts.ready); } catch (e) {}
    let pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: !0 }), pgs = [...box.querySelectorAll(".rcp-pg")];
    if (!pgs.length) throw new Error("ไม่พบหน้าเอกสาร");
    for (let j = 0; j < pgs.length; j++) {
      let cv = await window.html2canvas(pgs[j], { scale: 2, backgroundColor: "#ffffff", useCORS: !0, logging: !1 });
      j && pdf.addPage("a4", "portrait"); pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, void 0, "FAST");
    }
    pdf.setProperties({ title: fname }); pdf.save(fname + ".pdf");
  } catch (e) {
    try { console.warn("SVH795", e); } catch (z) {}
    k("ดาวน์โหลด PDF โดยตรงไม่สำเร็จ — เปิดหน้าพิมพ์แทน กรุณาเลือก “บันทึกเป็น PDF”", "err"); RX795(html, fname);
  } finally { box.remove(); b && (b.disabled = !1); }
}
function ST795() {
  try {
    if (document.getElementById("st795-css")) return;
    let s = document.createElement("style"); s.id = "st795-css";
    s.textContent = [
      ".rcp795-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 0}.rcp795-bar[hidden]{display:none!important}",
      ".btn.rcp795-btn{background:#1e3a8a!important;border:1px solid #1e3a8a!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.rcp795-btn:disabled{opacity:.55;cursor:not-allowed}",
      ".rcp795-info{font-size:12.5px;font-weight:700;color:#1e3a8a;white-space:nowrap}.rcp795-x{color:#94a3b8}.rcp795-td,.rcp795-th{width:34px}.rcp795-cb{width:16px;height:16px;cursor:pointer}",
      ".bdg795{display:inline-block;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#15803d;border:1px solid #86efac;font-size:12px;font-weight:700;line-height:18px;white-space:nowrap}.rcp795-no{font-size:11.5px;font-weight:700;color:#1e3a8a;margin-top:2px;white-space:nowrap}",
      ".btn.rcp795-b{font-weight:700;white-space:nowrap;margin-left:4px}.btn.rcp795-b:disabled{opacity:.55;cursor:wait}.btn.rcp795-pv{background:#eff4fb!important;border:1px solid #1e3a8a!important;color:#1e3a8a!important}.btn.rcp795-pr{background:#1e3a8a!important;border:1px solid #1e3a8a!important;color:#fff!important}.btn.rcp795-sv{background:#16a34a!important;border:1px solid #16a34a!important;color:#fff!important}",
      ".rcp795-f{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px}.rcp795-f label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:13px;min-width:220px}",
      ".rcp795-hd{margin:6px 0 8px;font-size:13.5px}.rcp795-g{border:1px solid #dbe3ef;border-radius:8px;margin-bottom:10px;overflow:auto}.rcp795-gh{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;background:#eff4fb;font-size:13px}",
      ".rcp795-t{width:100%}.rcp795-t td,.rcp795-t th{padding:5px 8px;font-size:12.5px;white-space:nowrap}.rcp795-err{border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:13px}.rcp795-err ul{margin:6px 0 6px 18px}",
      ".rcp795-ask{border:2px solid #f59e0b;background:#fffbeb;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:13.5px}.rcp795-ask-b{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.rcp795-dbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}.rcp795-smp{font-weight:700;color:#b91c1c}.rcp795-dno{font-weight:700;color:#1e3a8a;margin-left:6px}.rcp795-okbox{border:1px solid #86efac;background:#f0fdf4;color:#166534;border-radius:8px;padding:8px 10px;margin-bottom:10px}.rcp795-foot{display:flex;justify-content:flex-end;gap:8px;align-items:center;flex-wrap:wrap}",
      ".rcp795-pv{background:#e5e7eb;padding:12px;overflow:auto}.rcp795-pv .rcp-pg{margin:0 auto 12px;box-shadow:0 2px 10px rgba(0,0,0,.15)}.rcp795-off{position:fixed;left:-100000px;top:0;width:210mm}",
      ".rcp795-doc,.rcp795-doc *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
      ".rcp-pg{width:210mm;height:297mm;background:#fff;color:#0f172a;position:relative;overflow:hidden;font-family:\"NJ PDF\",Arial,sans-serif;font-size:10.5pt;line-height:1.35;page-break-after:always;break-after:page}",
      ".rcp-in{position:absolute;left:12mm;right:12mm;top:10mm;bottom:24mm}",
      ".rcp-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:5mm;padding-bottom:3mm;border-bottom:1.2pt solid #12305f}",
      ".rcp-co{display:flex;gap:3.5mm;align-items:flex-start;flex:0 1 auto;min-width:0}.rcp-logo{width:20mm;flex:0 0 20mm;height:auto;object-fit:contain;margin-top:.6mm}.rcp-cot{flex:0 0 auto}",
      ".rcp-conm{font-weight:700;font-size:11pt;line-height:1.25;color:#12305f;white-space:nowrap}.rcp-cosub{font-size:8.6pt;line-height:1.38;margin-top:.5mm;color:#334155;white-space:nowrap}",
      ".rcp-tt{text-align:right;flex:0 0 auto}.rcp-t1{font-weight:700;font-size:20pt;color:#12305f;letter-spacing:.3pt;border-bottom:2.4pt solid #ef4444;padding-bottom:1mm;line-height:1.15}.rcp-t2{font-weight:700;font-size:14pt;color:#12305f;margin-top:1.5mm}",
      ".rcp-boxes{display:grid;grid-template-columns:1.6fr 1fr;gap:4mm;margin-top:5mm}",
      ".rcp-box{position:relative;border:1pt solid #bcd0ee;border-radius:2.5mm;padding:4.5mm 4mm 3mm}.rcp-tag{position:absolute;top:-2.6mm;left:3mm;background:#12305f;color:#fff;font-weight:700;font-size:8.2pt;padding:.4mm 3mm;border-radius:1.6mm}",
      ".rcp-kv{display:grid;grid-template-columns:var(--lw795,27mm) 3mm minmax(0,1fr);align-items:start;margin-top:1.4mm;font-size:9.6pt}.rcp-kv>b{color:#1e3a5f;white-space:nowrap}.rcp-kv>b:nth-child(2){text-align:center}.rcp-box-r .rcp-kv{--lw795:23mm}",
      ".rcp-tx{display:flex;flex-wrap:wrap;column-gap:9mm;row-gap:.8mm}.rcp-brn{white-space:nowrap}.rcp-brn b{color:#1e3a5f}.rcp-addr{white-space:pre-line;overflow-wrap:anywhere}.rcp-no{font-weight:700;color:#12305f}",
      ".rcp-tb{width:100%;border-collapse:collapse;margin-top:5mm;table-layout:fixed}.rcp-tb th{background:#12305f;color:#fff;font-weight:700;font-size:9.8pt;line-height:1.2;padding:2.2mm 2mm;text-align:center;border:.6pt solid #12305f}.rcp-tb th.r{text-align:right}",
      ".rcp-tb td{border:.6pt solid #cbd5e1;padding:2mm;font-size:10pt;white-space:nowrap}.rcp-tb td.c{text-align:center}.rcp-tb td.r{text-align:right;font-variant-numeric:tabular-nums}.rcp-tb tr{break-inside:avoid;page-break-inside:avoid}",
      ".rcp-tot td{background:#e8f1fc;font-weight:700;font-size:11pt}.rcp-tot td.c{text-align:center;letter-spacing:.5pt}",
      ".rcp-sum{display:grid;grid-template-columns:1.2fr 1fr;gap:4mm;margin-top:5mm}.rcp-pay{padding:3.5mm 4mm;font-size:10pt;line-height:1.55}",
      ".rcp-amt{padding:0;overflow:hidden}.rcp-a1,.rcp-a2{display:flex;justify-content:space-between;gap:3mm;padding:2.4mm 4mm;font-size:10.5pt}.rcp-aw{border-top:.6pt solid #dbe3ef}.rcp-a2{background:#12305f;color:#fff;font-size:12.5pt;padding:3mm 4mm}",
      ".rcp-sign{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:5mm}.rcp-sign .rcp-box{padding:3.5mm 4mm;font-size:9.4pt;min-height:40mm}.rcp-st{color:#12305f;font-size:10pt}.rcp-for{font-size:9pt;color:#334155;margin-top:.8mm}",
      ".rcp-sp{height:14mm}.rcp-sp2{height:9.5mm}.rcp-sl{border-bottom:.8pt dotted #64748b}.rcp-sc{text-align:center;margin:1.2mm 0 2.5mm;color:#334155}",
      ".rcp-stamp{position:absolute;right:2mm;margin-top:6mm;transform:rotate(-6deg);border:2.2pt solid #dc2626;color:#dc2626;font-weight:700;font-size:20pt;padding:1.5mm 5mm;border-radius:2mm;letter-spacing:.5pt}",
      ".rcp-ft{position:absolute;left:12mm;right:12mm;bottom:8mm}.rcp-ftx{display:flex;justify-content:space-between;align-items:flex-end;font-size:8.6pt;color:#334155}.rcp-ftx b{color:#0f172a}",
      ".rcp-bar{display:flex;height:1.6mm;margin-top:2mm;border-radius:1mm;overflow:hidden}.rcp-bar i:first-child{flex:4;background:#1e3a8a}.rcp-bar i:last-child{flex:1;background:#ef4444}",
      "#rcp795-print-root{display:none}",
      "@media print{body.rcp795-printing>*:not(#rcp795-print-root){display:none!important}body.rcp795-printing #rcp795-print-root{display:block!important;position:static!important;inset:auto!important}body.rcp795-printing #rcp795-print-root,body.rcp795-printing #rcp795-print-root *{visibility:visible!important}body.rcp795-printing{margin:0!important;padding:0!important;background:#fff!important}body.rcp795-printing .rcp-pg{box-shadow:none;margin:0}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.797 · FINANCE → RECEIPT : ช่องค้นหา "ลูกค้า" / "บริษัท" = Dropdown (Component กลาง ui-dd762 : หัวข้อเหนือช่อง · พิมพ์ค้นหาในรายการ · วงกลม / จุดแดง / พื้นฟ้าอ่อน / ✓ · … + ชื่อเต็ม · × ล้างเฉพาะช่อง)
   ตัวเลือก = ข้อมูลจริงจาก Database (njacc_receipt_opts797 · RUN-797) แยกตามแถบ รอรับชำระ / ใบเสร็จที่ออกแล้ว · ในสิทธิ์ผู้ใช้ · ไม่มีชื่อว่าง · ชื่อซ้ำ = 1 รายการ (ids ทุกตัว)
   ค่าที่เลือก = id (คั่นด้วย ,) → ส่ง Server เป็น f797_customer_ids / f797_company_ids (ตรงตัว · ไม่ใช่ข้อความบางส่วน) · เลือก = ค้นหาทันที · × = ล้างช่องนั้น · "ล้างค้นหา" = คืนค่าเริ่มต้นทุกช่อง
   ช่อง INVOICE NO. / Customer Job No. / ค้นหาทั่วไป / ลูกค้า / วันที่ = เดิม · ไม่แตะยอดเงิน / ใบเสร็จ / PDF / EXPORT EXCEL (ใช้ตัวกรองชุดเดียวกับตาราง) ═══ */
var O797 = null, O797T = 0, NM797 = new Map(), OK797 = { customers: "ลูกค้าทั้งหมด", companies: "บริษัททั้งหมด" };
function SE797(st, at, k) {   /* <select> ต้นทางของ Dropdown (ค่าเดิมคงไว้เมื่อสร้างหน้าใหม่) */
  let o = k === "f678_customer" ? "customers" : "companies", v = String((st && st[k]) || ""), nm = NM797.get(v);
  return `<select class="sel sel797" data-${at}="${k}" data-o797="${o}" title="${k === "f678_customer" ? "ค้นหาลูกค้า" : "ค้นหาบริษัท"}"><option value="">${OK797[o]}</option>${v && nm ? `<option value="${i(v)}" title="${i(nm)}" selected>${i(nm)}</option>` : ""}</select>`;
}
async function OP797(t, force) {   /* โหลด / อัปเดตตัวเลือกจาก Database (แคช 15 วินาที · force = หลังออกใบเสร็จ) */
  let d = O797;
  if (force || !d || Date.now() - O797T > 15e3) {
    try { d = await V("njacc_receipt_opts797", { p: { company_group: "NJ" } }); O797 = d; O797T = Date.now(); }
    catch (e) { try { console.warn("OP797", e); } catch (x) {} if (!O797) return; d = O797; }
  }
  if (!t || !t.isConnected) return;
  [["#rc-pending", "pf", $, "pending"], ["#rc-issued", "f", b, "issued"]].forEach(([sc, at, st, tab]) => {
    let box = t.querySelector(sc); if (!box) return; let src = (d && d[tab]) || {};
    box.querySelectorAll("select.sel797").forEach((sel) => {
      let k = sel.getAttribute("data-" + at), o = sel.dataset.o797, list = Array.isArray(src[o]) ? src[o] : [], cur = String(sel.value || ""), seen = new Set();
      let h = `<option value="">${OK797[o]}</option>` + list.map((x) => {
        let v = (Array.isArray(x.ids) ? x.ids : []).map(String).filter(Boolean).join(","), n = String(x && x.name || "").trim();
        if (!v || !n || seen.has(v)) return ""; seen.add(v); NM797.set(v, n); return `<option value="${i(v)}" title="${i(n)}">${i(n)}</option>`;
      }).join("");
      if (sel.__h797 !== h) { sel.__h797 = h; sel.innerHTML = h; }
      if (cur && seen.has(cur)) sel.value = cur; else { sel.value = ""; cur && st && st[k] === cur && (st[k] = ""); }
    });
  });
}
function AP797(t) {   /* เลือก = ค้นหาทันที · ล้างค้นหาทั้งหมด · รายการกระชับ */
  ST797();
  [["#rc-pending .fbar", "#rp-go", "#rp-clr797"], ["#rc-issued .fbar", "#rc-go", "#rc-clr797"]].forEach(([bs, gs, cs]) => {
    let bar = t.querySelector(bs), go = t.querySelector(gs), clr = t.querySelector(cs); if (!bar || !go) return;
    bar.querySelectorAll("select.sel797").forEach((sel) => {
      let w = sel.closest(".u762-dd") || sel.parentNode; w && w.classList.add("dd797");
      if (sel.__ap797) return; sel.__ap797 = 1;
      sel.addEventListener("change", () => { sel.value && !go.disabled && setTimeout(() => go.click(), 0); });   /* × (ค่าว่าง) = ค้นหาใหม่ผ่าน Component เดิมอยู่แล้ว */
    });
    clr && !clr.__ap797 && (clr.__ap797 = 1, clr.onclick = (ev) => {
      ev.preventDefault();
      bar.querySelectorAll("input,select").forEach((el) => { if (!el.hasAttribute("data-pf") && !el.hasAttribute("data-f")) return; el.value = ""; });
      go.click();
    });
  });
}
function ST797() {
  try {
    if (document.getElementById("st797-css")) return;
    let s = document.createElement("style"); s.id = "st797-css";
    s.textContent = ".dd797 .u762-it{min-height:32px;height:32px;padding:0 10px;gap:8px;font-size:13px;line-height:1.25;box-sizing:border-box}.dd797 .u762-it .u762-lb{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;line-height:1.25}"
      + ".btn.clr797{white-space:nowrap}";
    document.head.appendChild(s);
  } catch (e) {}
}
