import{a as XLS820}from"./chunk-FHYZBT2Q.js";import{css762 as CS762,dd762 as DD762,sel762 as SL762,field762 as FD762,txt762 as TX762,chips762 as CH762}from"./ui-dd762.js";import{c as at,d as ot,e as rt}from"./chunk-J26HUKJ4.js";import"./chunk-IIDKIKVM.js";import{a as ct,b as F}from"./chunk-IOEZHYTZ.js";import{a as j,e as z}from"./chunk-ETXG4BWC.js";import{a as B}from"./chunk-6REVCVGI.js";import{k as it}from"./chunk-JXQJ6337.js";import{a as nt}from"./chunk-OWSY2KDQ.js";import{k as tt,v as st}from"./chunk-L5Z2NDJ3.js";import{j as E,k as X,f as MA660}from"./chunk-2B2FLIKC.js";import"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import"./chunk-Q7FMECGI.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as P,b as q,e as U,f as H}from"./chunk-OPGKUGLK.js";import{a as R}from"./chunk-YM5GFE6V.js";import{a as L}from"./chunk-GDT6F23K.js";import{a as k}from"./chunk-OFOOXWUM.js";import{b as XLJ734}from"./chunk-FHYZBT2Q.js";import{a as Q,d as Y,e as Z}from"./chunk-LNP7HEMP.js";import{a as u,c as N,e as i}from"./chunk-NQOCXXA2.js";import{G as et}from"./chunk-6NADHKLT.js";import{m as V}from"./chunk-SGWIBJH6.js";var dt=t=>V("njacc_list_receipts",t),lt=(t,e,r)=>V("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:r});var T=(t,e="-")=>{let r=t==null?"":String(t).trim();return i(r||e)},v=t=>{let e=Number(t);return Number.isFinite(e)?e:0},f=t=>Math.round((v(t)+Number.EPSILON)*100)/100,ut={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},w=t=>`<span class="rcd-ic">${ut[t]||""}</span>`;function bt(t){let e=[],r=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?r.push(s):e.push(s);return{shown:e,excluded:r}}function pt(t){let e=v(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let r=f(e-v(t.wht_amount));return r<=0?null:{ratio:v(t.amount)/r,net:r}}function ht(t){let e=0,r=0,s=0,d=0,o=0,h=!1,m=new Set,c=new Map;for(let a of t){let S=v(a.amount);e=f(e+S);let _=pt(a);if(!_)continue;h=!0,o=f(o+v(a.total_amount)*_.ratio),r=f(r+v(a.subtotal)*_.ratio),s=f(s+v(a.vat_amount)*_.ratio);let O=f(v(a.wht_amount)*_.ratio);d=f(d+O),v(a.vat_rate)>0&&m.add(v(a.vat_rate));let D=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(D&&D.length)for(let C of D){let W=f(v(C.amount)*_.ratio);if(W===0)continue;let K=C.rate===null||C.rate===void 0||C.rate===""?null:v(C.rate);c.set(K,f((c.get(K)||0)+W))}else if(O!==0){let C=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:v(a.wht_rate);c.set(C,f((c.get(C)||0)+O))}}let n=m.size===1?[...m][0]:m.size===0?0:null,p=[...c.keys()],y=p.length===1&&p[0]!==null?p[0]:null;return{total:e,sub:r,vat:s,wht:d,hasTax:h,vatRate:n,whtRate:y,whtBy:c,grossTotal:h?o:e,received:e}}function mt(t){let{shown:e,excluded:r}=bt(t.invoices),s=ht(e),d=String(t.status||"").toUpperCase()==="VOID",o=e.length===0?"-":e.length===1?i(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",h=e.map((a,S)=>`<tr>
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
      <input class="inp" data-f="q" value="${i(b.q||"")}" placeholder="เลขใบเสร็จ / JOB No. / INVOICE NJ / Customer / วันที่" title="ค้นหา เลขใบเสร็จ / JOB No. / INVOICE NJ / Customer / วันที่ออก (dd/mm/yyyy)"><select class="sel" data-f="customer">${st(b.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${b.from}">
      <input class="inp" type="date" data-f="to" value="${b.to}">
      ${FI678(b,"f")}
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button><button type="button" class="btn btn-o btn-sm clr797" id="rc-clr797" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button>${XB734("rc-xl811")}</div>
    <div id="rc-sum811" class="sum811"></div><div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      ${RH811}
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,ct(t);let e=t.querySelector(".ch-tools");e&&ot(e);(()=>{if(!document.getElementById("rc502-css")){let s=document.createElement("style");s.id="rc502-css";s.textContent=".rc502-hide{display:none!important}.rep-tabs.rc502-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.rep-tabs.rc502-tabs>#rc-new{margin-left:auto}.rc502 [data-colmg]{display:none!important}";document.head.appendChild(s)}let ph=t.querySelector(".page-head"),tb=t.querySelector(".rep-tabs"),nb=t.querySelector("#rc-new");e&&e.classList.add("rc502-hide");ph&&ph.classList.add("rc502-hide");tb&&(tb.classList.add("rc502-tabs"),nb&&tb.appendChild(nb));t.querySelectorAll("#rc-pending,#rc-issued").forEach(x=>x.classList.add("rc502"))})();let r={...g,scope:null,mode:"receipt",importMode:"accounting",filters:{},refresh:()=>{I==="pending"?M(t):o()}};t.dataset.chPage="finance-receipt",NK586(t,()=>t.dataset.chPage==="finance-receipt",()=>r.refresh()),t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=c=>{if(t.dataset.chPage!=="finance-receipt")return;let n=c.target.closest("[data-tool]");n&&rt(n.dataset.tool,r)},t.addEventListener("click",t.__njToolClick),t.querySelector(".rep-tabs").addEventListener("click",c=>{let n=c.target.closest("[data-rtab]");!n||n.dataset.rtab===I||(I=n.dataset.rtab,SEL795.clear(),gt(t))});let s=t.querySelector('[data-pf="q"]');s&&(t.querySelector("#rp-go").onclick=()=>{$.q=s.value.trim(),FR678(t,"pf",$),$.page=1,M(t)},XR734(t),UPB820(t),FK678(t.querySelector("#rc-pending .fbar"),"#rp-go")),I==="pending"&&M(t);let d=t.querySelector("#rc-new");d&&d.remove();async function o(){let c=P("receipts");try{let n=await V("njacc_rcp818_list",{p:{company_group:"NJ",q:b.q||null,customer_id:b.customer||null,from:b.from||null,to:b.to||null,page:b.page,size:b.size,...FP678(b)}});if(!q("receipts",c))return;BV800(t);let p=t.querySelector("#rc-tbody"),y=n.rows||[];SM811(t,n),p.innerHTML=y.length?y.map(RI811).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',B(t.querySelector("#rc-pgn"),{page:b.page,size:b.size,total:n.total||0},({page:l,size:a})=>{b.page=l,b.size=a,o()},{lp:!0}),F(),t.__njCols&&t.__njCols.issued()}catch(n){if(!q("receipts",c))return;R(n);let p=t.querySelector("#rc-tbody");p&&p.querySelector(".spin")&&(p.innerHTML='<tr><td colspan="21" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',p.querySelector("[data-ld-retry]").onclick=()=>{p.innerHTML='<tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr>',o()})}}RC762(t)/* V.762 */,AP797(t),OP797(t)/* V.797 */,LS801(t)/* V.801 */,RB811(t),XR811(t)/* V.811 */,FK678(t.querySelector("#rc-issued .fbar"),"#rc-go"),t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(c=>b[c.dataset.f]=c.value),b.page=1,o()};function h(){let c=t.querySelector("#rp-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function m(){let c=t.querySelector("#rc-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_ISSUED811",host:t.querySelector("#rc-issued .fbar")})}RA795(t,()=>(M(t),OP797(t,!0))),t.__njCols={pending:h,issued:m},h(),m(),t.querySelector("#rc-tbody").addEventListener("click",async c=>{let n=c.target.closest("[data-print]");if(n){G(JSON.parse(n.dataset.print));return}let p=c.target.closest("[data-void]");if(p){let y=await Z("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+p.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!y)return;try{await U("void-rc-"+p.dataset.void,()=>lt(p.dataset.void,y,H())),k("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),o()}catch(l){R(l)}}}),o()}async function M(t){let e=t.querySelector("#rp-tbody");if(!e)return;J=t;let r=P("rc-pending");try{let s=await et({company_group:"NJ",q:$.q||null,customer_id:$.customer||null,page:$.page,size:$.size,...FP678($)});if(!q("rc-pending",r))return;KP530(t,s);RA795(t,()=>(M(t),OP797(t,!0)));let d=s&&s.rows||[];BV800(t),e.innerHTML=d.map(o=>`<tr data-inv="${i(o.invoice_id)}" data-job800="${i(o.job_id||"")}">
      ${RC795(o)}${RR522(o)}
      ${A()?(o.src823?'<td class="center"><span class="t-3">-</span></td>':`<td class="center"><button type="button" class="btn btn-sm un678" data-backacc
            data-inv="${i(o.invoice_id)}" data-job="${i(o.job_id||"")}" data-no="${i(o.invoice_no||"")}"
            title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING &gt; SERVICE \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21"
            >UNPOST</button></td>`):""}
    </tr>`).join("")||`<tr><td colspan="${A()?20:19}" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>`,e.addEventListener("click",wt),RS795(t),B(t.querySelector("#rp-pgn"),{page:s.page,size:s.size,total:s.total},({page:o,size:h})=>{$.page=o,$.size=h,M(t)},{lp:!0}),F(),t.__njCols&&t.__njCols.pending()}catch(s){if(!q("rc-pending",r))return;R(s);let d=t.querySelector("#rp-tbody");if(d&&d.querySelector(".spin")){let o=d.querySelector("td")?d.querySelector("td").colSpan:8;d.innerHTML=`<tr><td colspan="${o}" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>`,d.querySelector("[data-ld-retry]").onclick=()=>{d.innerHTML=`<tr><td colspan="${o}" class="load-row"><div class="spin"></div></td></tr>`,M(t)}}}}async function wt(t){let e=t.target.closest("[data-backacc]");if(!e)return;if(t.preventDefault(),t.stopPropagation(),!A()){k("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let r=e.dataset.inv;if(!r){k("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let s=e.dataset.no||"";if(await Y("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(s?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+i(s)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>ACCOUNTING &gt; SERVICE</b>"+"<br><span class=\"t-xs t-3\">INVOICE คงสถานะ POST — ต้องการแก้ไขให้กด UNPOST ใน ACCOUNTING — SERVICE</span>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await U("backacc-"+r,()=>FB809(r,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",H())),k("ย้อนกลับ ACCOUNTING — SERVICE แล้ว — INVOICE เลขเดิม คงสถานะ POST · แก้ไขให้กด UNPOST ใน ACCOUNTING — SERVICE","ok"),J&&M(J)}catch(o){R(o)}}
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
    `<td class="nowrap">${o.src823 ? BG823(o) : `<b>${i(o.job_no || "-")}</b>`}</td>` +   /* V.818 (RUN-823) */
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
/* ═══ V.803 · RESET SEARCH เมื่อสลับโหมด (FINANCE — RECEIPT) : เข้าจากโหมดอื่น = ค่าค้นหา / Dropdown / วันที่ ทุกช่องของทั้ง 2 แถบ = ค่าเริ่มต้น + หน้า 1 (ไม่แตะจำนวนต่อหน้า / แถบ / รายการที่เลือก) · สลับแถบในหน้าเดิม = gt() เดิม ไม่ล้าง ═══ */
function RN803(t) { try { if (L.rs803) [$, b].forEach((st) => Object.keys(st).forEach((k) => { k !== "size" && (st[k] = k === "page" ? 1 : ""); })); } catch (e) {} return gt(t); }
export{RN803 as render};
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
    if (t === "int") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; } else { x.value = n; x.numFmt = "0"; } x.alignment = { horizontal: "center", vertical: "middle" }; L = 12; }   /* V.811 : จำนวน (เต็มหน่วย) */
    else if (t === "num") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; } else { x.value = Math.round(n * 100) / 100; x.numFmt = "#,##0.00"; x.alignment = { horizontal: "right", vertical: "middle" }; } L = 15; }
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
      let r = await XF734(async (pg, sz) => { let x = await et(Object.assign({}, f, { page: pg, size: sz })); ((x && x.rows) || []).forEach((o) => { o.__k734 = o.invoice_id || o.rx823_id || null; });   /* V.818 */ return x; }, 200);
      let cols = [["เลขที่งาน", (o) => o.job_no || (o.src823 ? "UPLOAD EXCEL" + (o.rx823_reason ? " (รอตรวจสอบ)" : "") : "")], ["Date", (o) => o.date, "date"], ["Invoice No.", (o) => o.invoice_no || "ยังไม่ออก INV"], ["ลูกค้า", (o) => o.customer_name], ["บริษัท Invoice", (o) => o.company_invoice],
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
  if (o && o.src823) return o.rx823_reason ? "รอตรวจสอบ — " + o.rx823_reason + " (ห้ามออกใบเสร็จ)" : "รายการนำเข้าจาก UPLOAD EXCEL — ไม่มี INVOICE ในระบบ (ออกใบเสร็จไม่ได้)";   /* V.818 (RUN-823) */
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
/* V.800 : คลิกแถว INVOICE (รอรับชำระ / ใบเสร็จที่ออกแล้ว) = เปิด INVOICE / ใบแจ้งหนี้ ด้วย Preview เดิมของ ACCOUNTING — SERVICE (billing-modal PV800) · ผูกครั้งเดียวต่อหน้า */
function BV800(t) {
  if (!t || t.__bv800) return; t.__bv800 = 1;
  t.addEventListener("click", (ev) => { let tr = ev.target.closest && ev.target.closest("#rp-tbody tr[data-inv], #rc-tbody tr[data-inv]"); if (!tr || !tr.dataset.inv) return;   /* V.818 : รายการนำเข้า Excel ไม่มี INVOICE */
    import("./billing-modal-WWHG6C4U.js").then((m) => m.RW800(ev, tr)).catch(R); });
}
function RI795(o) {
  ST795(); let id = i(o.receipt_id || ""), no = i(o.receipt_no || "");
  return `<tr data-inv="${i(o.invoice_id || "")}" data-job800="${i(o.job_id || "")}" data-rcp-id="${id}"><td class="center col-sel rcp795-td"><span class="rcp795-x" title="ออกใบเสร็จแล้ว (${no})">🔒</span></td>${RR522(o)}`
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
  if (/NJACC_RADV_DUPLICATE_NO|NJACC_RCP_DUPLICATE_NO/.test(m)) return "เลขเอกสารชน (" + m.replace(/^.*DUPLICATE_NO:\s*/, "") + ") — ยังไม่ได้บันทึก กรุณาลองใหม่";
  if (/NJACC_RADV_SEQ_FULL|NJACC_RCP_SEQ_FULL/.test(m)) return "เลขเอกสารเดือนนี้เต็มแล้ว";
  if (/njacc_rcp818/i.test(m) && /PGRST202|schema cache|Could not find/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-818)";   /* V.814 */
  if (/njacc_rcp795|PGRST202|schema cache/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-795)";
  return m;
}
function RQ795() { try { return "rcp795-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); } catch (e) { return "rcp795-" + Date.now() + "-" + Math.random().toString(36).slice(2); } }
async function RO795(t) {   /* หน้าต่างออกใบเสร็จ · V.814 (RUN-818) : ต่อลูกค้า RCP (SERVICE) + ADV (ADVANCE) — PREVIEW / SAVE / PRINT ทีเดียวทั้ง 2 ใบ */
  let ids = [...SEL795.keys()]; if (!ids.length) return; ST814();
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
  let nR = () => st.pv ? st.pv.groups.filter((g) => Number(g.count) > 0).length : 0, nA = () => st.pv ? st.pv.groups.filter((g) => g.adv).length : 0;
  let sync = () => {
    let ok = st.pv && !st.pv.errors.length && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value && !st.done;
    q("#rcp795-pv").disabled = !(st.pv && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value) || st.busy || !!st.done;
    q("#rcp795-ok").disabled = !ok || !st.seen || st.busy;
    q("#rcp795-ok").title = ok && !st.seen ? "กรุณากดดูตัวอย่างก่อนยืนยัน" : "";
  };
  let draw = () => {
    let p = st.pv; if (!p) return;
    let tot = p.groups.reduce((s, g) => s + C795(g.total), 0), atot = p.groups.reduce((s, g) => s + C795(g.adv && g.adv.total), 0);
    sum.innerHTML = (p.errors.length ? `<div class="rcp795-err"><b>⚠ รายการที่ออกใบเสร็จไม่ได้ (${p.errors.length}) — ระงับการยืนยัน</b><ul>${p.errors.map((e) => `<li>${i(e.invoice_no || "-")}${e.job_no ? " · " + i(e.job_no) : ""} — ${i(e.reason)}</li>`).join("")}</ul><button class="btn btn-sm btn-o" id="rcp795-drop">นำรายการที่มีปัญหาออกจากรายการที่เลือก</button></div>` : "")
      + `<div class="rcp795-hd">ใบเสร็จที่จะออก : SERVICE (RCP) <b>${nR()}</b> ฉบับ · ADVANCE (ADV) <b>${nA()}</b> ฉบับ (ต่อลูกค้า 1 RCP + 1 ADV) · Payment Received รวม <b>${M795(tot / 100)}</b>${atot ? ` · Advance รวม <b>${M795(atot / 100)}</b>` : ""}</div>`
      + p.groups.map((g, k) => `<div class="rcp795-g"><div class="rcp795-gh"><span>ลูกค้าที่ ${k + 1} · <b>${i(g.customer_name)}</b></span><span>${Number(g.count) ? `RCP ${Number(g.count)} รายการ · <b>${M795(g.total)}</b>` : "ไม่มี SERVICE"}${g.adv ? ` · ADV ${Number(g.adv.count)} รายการ · <b>${M795(g.adv.total)}</b>` : ""}</span></div>`
          + (Number(g.count) ? `<div class="rcp814-cap">ใบที่ 1 · SERVICE — RECEIPT (RCP)</div><table class="tbl rcp795-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Invoice Amount</th><th class="r">Withholding Tax (7%)</th><th class="r">Payment Received</th></tr></thead><tbody>${(g.items || []).map((x, j) => `<tr><td class="center">${j + 1}</td><td>${i(x.invoice_no)}</td><td>${D795(x.invoice_date)}</td><td class="t-3">${i(x.job_no || "")}</td><td class="r">${M795(x.invoice_amount)}</td><td class="r">${M795(x.wht_amount)}</td><td class="r">${M795(x.received)}</td></tr>`).join("")}</tbody></table>` : "")
          + (g.adv ? `<div class="rcp814-cap rcp814-a">ใบที่ ${Number(g.count) ? 2 : 1} · ADVANCE — RECEIPT ADVANCE (ADV)</div><table class="tbl rcp795-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Advance Amount</th></tr></thead><tbody>${(g.adv.items || []).map((x, j) => `<tr><td class="center">${j + 1}</td><td>${i(x.invoice_no)}</td><td>${D795(x.invoice_date)}</td><td class="t-3">${i(x.job_no || "")}</td><td class="r">${M795(x.amount)}</td></tr>`).join("")}</tbody></table>` : "")
          + `</div>`).join("");
    let dr = q("#rcp795-drop"); dr && (dr.onclick = () => { p.errors.forEach((e) => SEL795.delete(String(e.invoice_id))); RS795(t); t.querySelectorAll(".rcp795-cb[data-rcp]").forEach((c) => { c.checked = SEL795.has(c.dataset.rcp); }); ids = [...SEL795.keys()]; ids.length ? load() : (sum.innerHTML = '<div class="empty">ไม่มีรายการที่เลือก</div>', st.pv = null, sync()); });
    sync();
  };
  let load = async () => {
    st.pv = null; st.seen = !1; sync(); sum.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลล่าสุดจาก Server…</div></div>';
    try { let r = await V("njacc_rcp818_preview", { p: { invoice_ids: ids } }); st.pv = { errors: r && r.errors || [], groups: r && r.groups || [] }; draw(); }
    catch (e) { sum.innerHTML = `<div class="rcp795-err">${i(RE795(e))}</div>`; sync(); }
  };
  let keys = (pairs) => (pairs || []).map((z) => [z.rcp && z.rcp.id, z.adv && "adv:" + z.adv.id].filter(Boolean).join(",")).filter(Boolean);
  let issue = async (confirmFn) => {   /* SAVE จริง (RCP + ADV ธุรกรรมเดียว) · กดซ้ำ = request_id เดิม → เอกสารเดิม ไม่ออกเลขใหม่ */
    if (st.done) return st.done;
    if (st.busy || !st.pv || st.pv.errors.length) return null;
    let d = q("#rcp795-date").value, m = q("#rcp795-method").value, cnt = st.pv.groups.reduce((s, g) => s + Number(g.count || 0) + Number(g.adv && g.adv.count || 0), 0);
    if (!d || !m) { k("กรุณาเลือกวันที่ใบเสร็จและวิธีรับชำระ", "err"); return null; }
    if (!(await confirmFn(`ออกใบเสร็จ SERVICE (RCP) <b>${nR()} ฉบับ</b> + ADVANCE (ADV) <b>${nA()} ฉบับ</b> · ${cnt} รายการ · วันที่ ${D795(d)} · ${i(PML795(m))}<br>เมื่อยืนยันแล้ว ระบบจะออกเลข RCP / ADV จริงพร้อมกัน เปลี่ยนรายการเป็น PAID ย้ายไปแถบ “ใบเสร็จที่ออกแล้ว” และล็อกข้อมูลทันที (แก้ไข / ลบ / UNPOST ไม่ได้)`))) return null;
    st.busy = !0; sync(); let ok = q("#rcp795-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let exp = st.pv.groups.flatMap((g) => (g.all || []).map((z) => ({ invoice_id: z.invoice_id, invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received, adv_amount: z.adv_amount, customer_id: g.customer_id, invoice_no: z.invoice_no })));
      let r = await V("njacc_rcp818_issue", { p: { request_id: st.req, invoice_ids: exp.map((z) => z.invoice_id), receipt_date: d, payment_method: m, issuer: IS795(x), expected: exp } });
      st.done = r && r.pairs || []; st.req = RQ795();
      SEL795.clear(); RS795(t);
      let all = [].concat(r && r.receipts || [], r && r.advs || []);
      sum.innerHTML = `<div class="rcp795-okbox"><b>✅ ออกใบเสร็จสำเร็จ RCP ${(r && r.receipts || []).length} ฉบับ · ADV ${(r && r.advs || []).length} ฉบับ</b> — รายการเปลี่ยนเป็น PAID ย้ายไปแถบ “ใบเสร็จที่ออกแล้ว” และล็อกแล้ว</div>`
        + `<table class="tbl rcp795-t"><thead><tr><th>ลูกค้า</th><th>RECEIPT (RCP)</th><th class="r">Payment Received</th><th>RECEIPT ADVANCE (ADV)</th><th class="r">Advance Amount</th><th></th></tr></thead><tbody>${st.done.map((z, j) => `<tr><td>${i(z.customer_name || "")}</td><td class="t-b">${i(z.rcp ? z.rcp.receipt_no : "-")}</td><td class="r">${z.rcp ? M795(z.rcp.total) : "-"}</td><td class="t-b">${i(z.adv ? z.adv.receipt_no : "-")}</td><td class="r">${z.adv ? M795(z.adv.total) : "-"}</td><td class="r"><button class="btn btn-sm btn-p" data-rcp-open="${i(keys([z])[0] || "")}">ดู / ดาวน์โหลด / พิมพ์</button></td></tr>`).join("")}</tbody></table>`;
      sum.querySelectorAll("[data-rcp-open]").forEach((b) => { b.onclick = () => open([b.dataset.rcpOpen]); });
      foot.insertAdjacentHTML("beforeend", `<button class="btn btn-green" id="rcp795-all-docs">📄 ดู / ดาวน์โหลด / พิมพ์ (${all.length} ฉบับ)</button>`);
      q("#rcp795-all-docs").onclick = () => open(keys(st.done));
      ok.textContent = "✅ ออกแล้ว"; k("ออกใบเสร็จ " + all.map((z) => z.receipt_no).join(", ") + " แล้ว", "ok");
      try { CTX795 && CTX795.refresh && CTX795.refresh(); } catch (e) {}
      return st.done;
    } catch (e) {
      let msg = RE795(e); k("ออกใบเสร็จไม่สำเร็จ — " + msg, "err"); ok.textContent = "✅ ยืนยันออกใบเสร็จ";
      if (/NJACC_RCP_(CHANGED|INVALID)/.test(String(e && e.message || e))) { await load(); sum.insertAdjacentHTML("afterbegin", `<div class="rcp795-err">${i(msg)}</div>`); }
      return null;
    } finally { st.busy = !1; sync(); }
  };
  let open = async (ks, pr) => {   /* เอกสารที่บันทึก (เลขจริง · สำเนา ณ เวลาออก) — ดู / PRINT / SAVE PDF ซ้ำได้ ไม่ออกเลขใหม่ */
    try {
      let docs = await RL795(ks); await showDocs(docs, { sample: !1 });
      pr && RX795(docs.map((d) => RF795(d, !1)).join(""), FX814(docs));
    } catch (e) { back(); k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e) + " (ดาวน์โหลดภายหลังได้จากแถบใบเสร็จที่ออกแล้ว)", "err"); }
  };
  q("#rcp795-date").onchange = () => { st.seen = !1; sync(); };
  q("#rcp795-method").onchange = () => { st.seen = !1; sync(); };
  q("#rcp795-pv").onclick = async () => {
    let d = q("#rcp795-date").value, m = q("#rcp795-method").value; if (!st.pv || !d || !m) return;
    let I = IS795(x), docs = [];
    st.pv.groups.forEach((g, n) => {
      let C = { name: g.customer_name, tax_id: g.customer_tax_id, branch_code: g.customer_branch, address: g.customer_address };
      Number(g.count) && docs.push({ pk: "S" + n, receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, credit: g.credit, customer: C,
        items: (g.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "SERVICE CHARGE", invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received })),
        invoice_amount: g.invoice_amount, wht_amount: g.wht_amount, total: g.total });
      g.adv && docs.push({ kind: "ADV", pk: "S" + n, receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, credit: g.adv.credit, customer: C, status: "ACTIVE",
        items: (g.adv.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "Advance Charge", amount: z.amount })), total: g.adv.total });
    });
    st.seen = !0; sync();
    let after = async (pr) => { let r = await issue(ASK814); if (!r) return; await open(keys(r), pr); };
    await showDocs(docs, { sample: !st.done, commit: st.done ? null : () => after(!1), printX: st.done ? null : () => after(!0) });
  };
  q("#rcp795-ok").onclick = async () => {
    if (st.busy || !st.pv || st.pv.errors.length || !st.seen) return;
    back();
    let r = await issue(ask); r && (await open(keys(r)));
  };
  await load();
}
function ASK814(html) {   /* ยืนยันบนหน้าจอ PREVIEW เต็มจอ (อยู่เหนือ PV813) */
  return new Promise((res) => {
    ST814(); let w = document.createElement("div"); w.className = "ask814";
    w.innerHTML = `<div class="ask814-b"><div class="ask814-t">${html}</div><div class="ask814-f"><button type="button" class="btn btn-o" data-a814="0">ยกเลิก</button><button type="button" class="btn btn-p" data-a814="1">ยืนยัน SAVE (ออกเลขจริง)</button></div></div>`;
    document.body.appendChild(w);
    let done = (v) => { document.removeEventListener("keydown", key, !0); w.remove(); res(v); };
    let key = (ev) => { ev.key === "Escape" && (ev.preventDefault(), ev.stopPropagation(), done(!1)); };
    document.addEventListener("keydown", key, !0);
    w.querySelectorAll("[data-a814]").forEach((b) => { b.onclick = () => done(b.dataset.a814 === "1"); });
  });
}

async function RL795(ids) {   /* ใบเสร็จที่บันทึก (สำเนาข้อมูล ณ เวลาออก) — ไม่ออกเลขใหม่ · ไม่ตัดรับชำระซ้ำ */
  let docs = [];
  for (let key of [].concat(ids || []).filter(Boolean)) for (let id of String(key).split(",").filter(Boolean)) {   /* V.814 : คีย์ = RCP[,adv:ID] (ชุดเดียวกัน) · adv:ID = RECEIPT ADVANCE */
    if (/^adv:/.test(id)) { let M = await AD814(), a = (await M.RL814([id.slice(4)]))[0]; a && docs.push(Object.assign(a, { kind: "ADV", id: id.slice(4), pk: String(key) })); continue; }
    let r = await V("njacc_rcp795_get", { p_id: id }), s = r && r.snapshot || {};
    docs.push({ pk: String(key), id: r.id, receipt_no: r.receipt_no, receipt_date: r.receipt_date, payment_method: s.payment_method || r.payment_method, issuer: s.issuer || {}, customer: s.customer || {}, items: s.items || [],
      invoice_amount: s.invoice_amount != null ? s.invoice_amount : r.invoice_amount, wht_amount: s.wht_amount != null ? s.wht_amount : r.wht_amount, total: s.total != null ? s.total : r.total, credit: s.credit });
  }
  return docs;
}
async function RG795(ids) { try { let docs = await RL795(ids); docs.length && (await RW795(docs, { sample: !1, title: "RECEIPT " + docs.map((d) => d.receipt_no).join(", ") })); } catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); } }
async function RPR795(id, b) {   /* PRINT จากแถว : เอกสารที่บันทึก (เลขเดิม) */
  if (!id || (b && b.disabled)) return; b && (b.disabled = !0);
  try { let ds = await RL795([id]); if (!ds.length) throw new Error("ไม่พบใบเสร็จ"); await FN795(); for (let d of ds) await IM795(d); RX795(ds.map((d) => RF795(d, !1)).join(""), FX814(ds)); }   /* V.814 : RCP + ADV = พิมพ์ครั้งเดียว */
  catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); } finally { b && (b.disabled = !1); }
}
async function SV795(id, b) {   /* SAVE PDF จากแถว : เอกสารที่บันทึก (เลขเดิม) */
  if (!id || (b && b.disabled)) return;
  try { let ds = await RL795([id]); if (!ds.length) throw new Error("ไม่พบใบเสร็จ"); await SVH795(ds.map((d) => RF795(d, !1)).join(""), FX814(ds), b); }   /* V.814 : RCP + ADV = 1 ไฟล์ */
  catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); }
}
async function FN795() { ST795(); try { await AD814(); } catch (e) {} try { let m = await import("./chunk-TKN6STDT.js"); m.FF766 && (await m.FF766()); } catch (e) {} }
async function IM795(d) { let src = d && d.issuer && d.issuer.logo; src && (await Promise.race([new Promise((r) => { let im = new Image(); im.onload = im.onerror = r; im.src = src; }), new Promise((r) => setTimeout(r, 3000))])); }
/* ── PDF (A4 แนวตั้ง) ── */
function RP795(doc, counts, sample) {
  ST813(); /* V.813 */
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
  if (doc && doc.kind === "ADV" && A814) { ST814(); A814.ST814 && A814.ST814(); return A814.RF814(doc, sample); }   /* V.814 : RECEIPT ADVANCE = Template เดิม (RF788) */
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
async function RW795(docs, o, host) {   /* Preview = DOM เดียวกับ PDF / Print · V.813 : แสดงเต็มหน้าจอ (PV813 · ไม่ใช้กรอบ Modal) · ปิด = o.back (กลับหน้าเดิม)
   V.814 : RCP + ADV ของลูกค้าเดียวกัน = ชุดเดียว (หน้า SERVICE ก่อน แล้ว ADVANCE) · PRINT = พิมพ์ทุกหน้าในครั้งเดียว · SAVE PDF = 1 ไฟล์ต่อชุด
           ตัวอย่าง : SAVE = ออกเลขจริง (o.commit) · PRINT = SAVE จริงก่อนแล้วพิมพ์ (o.printX) */
  await FN795(); for (let d of docs) await IM795(d);
  let html = docs.map((d) => RF795(d, o.sample)).join(""), nos = docs.map((d) => d.receipt_no), g = [];
  docs.forEach((d, j) => { let pk = d.pk || "d" + j, z = g.find((y) => y.pk === pk); z ? z.d.push(d) : g.push({ pk, d: [d] }); });
  let parts = g.map((z) => z.d.map((d) => RF795(d, o.sample)).join("")), names = g.map((z) => FX814(z.d)), adv = docs.some((d) => d.kind === "ADV");
  host && (host.innerHTML = "");
  PV813({ title: o.sample ? (adv ? "RECEIPT + RECEIPT ADVANCE" : "RECEIPT") + " — ตัวอย่าง " + docs.length + " ฉบับ" : (o.title || "RECEIPT " + nos.join(", ")),
    note: o.sample ? "ยังไม่ออกเลข · ยังไม่ตัดรับชำระ · ยังไม่ล็อก (ต่อลูกค้า : RCP SERVICE + ADV ADVANCE)" + (o.commit ? " · SAVE / PRINT = ออกเลขจริงก่อน" : "") : "",
    html, parts, names, save: o.sample ? null : SVH795, commit: o.sample ? o.commit : null,
    print: o.sample && o.printX ? o.printX : () => RX795(html, o.sample ? "RECEIPT_SAMPLE" : FX814(docs)), onClose: o.back });
}
function RX795(html, fname) {   /* พิมพ์ / บันทึก PDF (A4 แนวตั้ง · ชื่อไฟล์ = ชื่อเอกสาร) */
  ST795(); let old = document.getElementById("rcp795-print-root"); old && old.remove();
  let root = document.createElement("div"); root.id = "rcp795-print-root"; root.className = "rcp795-doc radv788-doc"; ST814(); root.innerHTML = html; document.body.appendChild(root);
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
    box.className = "rcp795-doc radv788-doc rcp795-off"; box.innerHTML = html; document.body.appendChild(box);
    await Promise.all([...box.querySelectorAll("img")].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 3000); })));
    try { document.fonts && (await document.fonts.ready); } catch (e) {}
    let pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: !0 }), pgs = [...box.querySelectorAll(".rcp-pg,.radv-pg")];
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
/* ═══ V.801 · FINANCE → RECEIPT (รอรับชำระ / ใบเสร็จที่ออกแล้ว) : ค้นหาแบบ Real-Time — พิมพ์ / ลบ / เลือก Dropdown / วันที่ = ค้นหาทันที ไม่ต้องกดปุ่ม "ค้นหา" หรือ Enter
   ใช้ฟังก์ชันค้นหาเดิมทั้งหมด : คลิกปุ่ม "ค้นหา" เดิม (#rp-go / #rc-go) → อ่านค่าตัวกรองเดิม → หน้า 1 → RPC เดิมจาก Database (njacc_receipt_pending / njacc_rcp795_list) · ยอดรวม / จำนวน = ของ Server ตามเงื่อนไข
   ช่องข้อความ = Debounce 280 ms · Dropdown / วันที่ = ทันที · ค่าตัวกรองไม่เปลี่ยน = ไม่เรียกซ้ำ · ผลเก่าทับผลใหม่ไม่ได้ (ตัวนับคำขอเดิม P / q) · ปุ่ม "ค้นหา" / Enter / "ล้างค้นหา" / × / ป้าย = เดิม ═══ */
function LS801(t) {
  [["#rc-pending .fbar", "#rp-go", "pf"], ["#rc-issued .fbar", "#rc-go", "f"]].forEach(([bs, gs, at]) => {
    let bar = t.querySelector(bs), go = t.querySelector(gs), da = "data-" + at; if (!bar || !go || bar.__ls801) return; bar.__ls801 = 1;
    let tm = 0, sig = () => [...bar.querySelectorAll("[" + da + "]")].map((x) => x.getAttribute(da) + "=" + String(x.value || "").trim()).join("\u0001"), last = sig();
    let run = () => { tm = 0; if (!go.isConnected || go.disabled) return; sig() !== last && go.click(); };
    go.addEventListener("click", () => { clearTimeout(tm); tm = 0; last = sig(); });   /* ค้นหาแล้ว (ปุ่ม / Enter / ล้าง / × / Real-Time) = จำเงื่อนไขล่าสุด */
    let on = (ev) => {
      let el = ev.target; if (!el || !el.hasAttribute || !el.hasAttribute(da) || ev.isComposing) return;
      let tx = el.tagName === "INPUT" && el.type !== "date" && el.type !== "hidden";
      clearTimeout(tm); tm = setTimeout(run, tx ? 280 : 0);
    };
    bar.addEventListener("input", on); bar.addEventListener("change", on); bar.addEventListener("compositionend", on);
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

/* ═══ V.809 · FINANCE — RECEIPT : UNPOST = ส่งกลับ ACCOUNTING — SERVICE คงสถานะ POST (njacc_fin809_back · RUN-809) — ไม่ AUTO UNPOST เป็นร่างอีกต่อไป
   ACCOUNTING — SERVICE แถบ POST แล้ว → ผู้ใช้กด UNPOST เอง (njacc_unpost_to_draft เดิม) → ร่าง → แก้ไข / SAVE / POST ใหม่ · ADVANCE = FLOW เดิม ═══ */
function FB809(inv, reason, req) { return V("njacc_fin809_back", { p: { invoice_id: inv, reason: reason, request_id: req } }); }

/* ═══ V.811 · FINANCE — RECEIPT : แถบ "ใบเสร็จที่ออกแล้ว" = 1 แถวต่อเลขใบเสร็จจริง (Receipt ID · njacc_rcp811_list · RUN-811) — อ่านอย่างเดียว
   คอลัมน์ : เลขที่ใบเสร็จ | วันที่ออก | Customer | จำนวน JOB (ไม่ซ้ำ) | จำนวน INVOICE (ไม่ซ้ำ) | ยอดรวม (= ยอดใน PDF) | สถานะ | จัดการ
   คลิกแถว / ปุ่ม "รายการ" → หน้าต่างรายละเอียด (njacc_rcp811_items) : ลำดับ | JOB No. | INVOICE No. (INVOICE NJ) | วันที่ INVOICE | Customer | Amount + ยอดรวม
   PREVIEW / PRINT / SAVE PDF = ฟังก์ชัน / PDF Template เดิม (RL795 + RW795 / RPR795 / SV795 · เลขเดิม · สำเนาที่บันทึก) · ค้นหา Real-Time เดิม (LS801) + ช่องค้นหา เลขใบเสร็จ / JOB / INVOICE / Customer / วันที่
   จำนวน / ยอดสรุป / EXPORT EXCEL = ต่อใบเสร็จ (ไม่รวมยอดซ้ำ) · ไม่แตะการออกใบเสร็จ / เลข / สูตร / POST / UNPOST / แถบรอรับชำระ ═══ */
var RH811 = '<th>เลขที่ใบเสร็จ</th><th>วันที่ออก</th><th>Customer</th><th class="center">จำนวน JOB</th><th class="center">จำนวน INVOICE</th><th class="r">ยอดรวม</th><th>สถานะ</th><th class="center col-act">จัดการ</th>';
function N811(v) { let x = Number(v); return isFinite(x) ? x.toLocaleString("th-TH") : "0"; }
function K814(o) { return o.kind === "ADV" ? "adv:" + (o.receipt_id || "") : String(o.receipt_id || "") + (o.adv_id ? ",adv:" + o.adv_id : ""); }   /* V.814 : คีย์เอกสารของแถว = RCP [+ ADV คู่] · ADV อย่างเดียว = adv:<id> */
function RI811(o) {
  ST811(); ST814(); let id = i(K814(o)), no = i(o.receipt_no || ""), adv = o.kind === "ADV", an = i(o.adv_no || ""), lab = no + (o.adv_no && !adv ? " + " + an : "");
  return `<tr class="r811" data-r811="${id}" tabindex="0" title="คลิกเพื่อดู JOB / INVOICE ทั้งหมดในใบเสร็จ ${lab}">`
    + `<td class="nowrap" data-l="เลขที่ใบเสร็จ"><b class="no811">${no}</b>${o.adv_no && !adv ? `<span class="adv814">+ ${an}</span>` : ""}${adv ? '<span class="adv814">RECEIPT ADVANCE</span>' : ""}</td>`
    + `<td class="nowrap" data-l="วันที่ออก">${D795(o.receipt_date) || "-"}</td>`
    + `<td class="c811" data-l="Customer" title="${i(o.customer_name || "")}">${i(o.customer_name || "-")}</td>`
    + `<td class="center" data-l="จำนวน JOB">${N811(o.job_count)}</td>`
    + `<td class="center" data-l="จำนวน INVOICE">${N811(o.invoice_count)}</td>`
    + `<td class="r t-b" data-l="ยอดรวม">${adv ? `<span class="adv814">ADV ${M795(o.adv_total)}</span>` : M795(o.total) + (o.adv_no ? `<span class="adv814">ADV ${M795(o.adv_total)}</span>` : "")}</td>`
    + `<td class="nowrap" data-l="สถานะ"><span class="bdg795">ออกใบเสร็จแล้ว</span></td>`
    + `<td class="center nowrap col-act" data-l="จัดการ"><button type="button" class="btn btn-sm b811" data-d811="${id}" title="ดู JOB / INVOICE ทั้งหมดในใบเสร็จ ${lab}">รายการ</button>`
    + `<button type="button" class="btn btn-sm rcp795-b rcp795-pv" data-rcp-pv="${id}" title="PREVIEW — ${lab}">PREVIEW</button>`
    + `<button type="button" class="btn btn-sm rcp795-b rcp795-pr" data-rcp-pr="${id}" title="PRINT — ${lab} (เลขเดิม)">PRINT</button>`
    + `<button type="button" class="btn btn-sm rcp795-b rcp795-sv" data-rcp-sv="${id}" title="SAVE PDF — ${lab}">SAVE PDF</button></td></tr>`;
}
function SM811(t, r) {   /* สรุปตามตัวกรองปัจจุบัน (Server · นับ Receipt ID ไม่ซ้ำ · ยอดหัวใบเสร็จ) · V.814 : + ADV */
  let el = t && t.querySelector("#rc-sum811"); if (!el) return; let k = (r && r.kpi) || {};
  el.innerHTML = `<span>ใบเสร็จ <b>${N811(k.receipts != null ? k.receipts : r && r.total)}</b> ใบ</span><span>JOB <b>${N811(k.jobs)}</b></span><span>INVOICE <b>${N811(k.invoices)}</b></span><span>ยอดรวม <b>${M795(k.amount || 0)}</b></span>`
    + (Number(k.adv_receipts) ? `<span>RECEIPT ADVANCE <b>${N811(k.adv_receipts)}</b> ใบ</span><span>ยอด ADVANCE <b>${M795(k.adv_amount || 0)}</b></span>` : "");
}
function DH811(d, lab) {   /* เนื้อหาหน้าต่างรายละเอียด (ใช้ร่วม RECEIPT / ADVANCE) */
  let it = (d && d.items) || [], st = d && d.status === "VOID_RESET" ? "ยกเลิก" : "ออกใบเสร็จแล้ว";
  return `<div class="h811"><div><span>เลขที่ใบเสร็จ</span><b>${i(d.receipt_no || "-")}</b></div><div><span>วันที่ออก</span><b>${D795(d.receipt_date) || "-"}</b></div>`
    + `<div class="h811-c"><span>Customer</span><b>${i(d.customer_name || "-")}</b></div><div><span>จำนวน JOB</span><b>${N811(d.job_count)}</b></div><div><span>จำนวน INVOICE</span><b>${N811(d.invoice_count)}</b></div><div><span>สถานะ</span><b class="s811">${st}</b></div></div>`
    + `<div class="tbl-wrap w811"><table class="tbl t811"><thead><tr><th class="center">ลำดับ</th><th>JOB No.</th><th>INVOICE No. <small>(${lab})</small></th><th>วันที่ INVOICE</th><th>Customer</th><th class="r">Amount</th></tr></thead><tbody>`
    + (it.length ? it.map((x, j) => `<tr><td class="center" data-l="ลำดับ">${j + 1}</td><td class="nowrap" data-l="JOB No."><b>${i(x.job_no || "-")}</b></td><td class="nowrap" data-l="INVOICE No.">${i(x.invoice_no || "-")}</td>`
        + `<td class="nowrap" data-l="วันที่ INVOICE">${D795(x.invoice_date) || "-"}</td><td data-l="Customer">${i(x.customer_name || "-")}</td><td class="r" data-l="Amount">${M795(x.amount)}</td></tr>`).join("")
      : '<tr><td colspan="6" class="empty">ไม่พบรายการ</td></tr>')
    + `</tbody><tfoot><tr class="tot811"><td colspan="5" class="r">ยอดรวม (${N811(it.length)} รายการ)</td><td class="r" data-l="ยอดรวม">${M795(d.total)}</td></tr></tfoot></table></div>`;
}
async function DT811(key) {   /* หน้าต่างรายละเอียดใบเสร็จ · V.814 : RCP + ADV คู่ (หรือ ADV อย่างเดียว) */
  if (!key) return; let ks = String(key).split(",").filter(Boolean), ds = [];
  try { for (let z of ks) ds.push(/^adv:/.test(z) ? Object.assign(await V("njacc_radv811_items", { p_id: z.slice(4) }), { __adv: 1 }) : await V("njacc_rcp811_items", { p_id: z })); }
  catch (e) { k("เปิดรายละเอียดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); return; }
  ST811(); ST795(); ST814();
  let body = document.createElement("div"), foot = document.createElement("div"); body.className = "d811";
  foot.className = "f811"; foot.innerHTML = '<button type="button" class="btn rcp795-b rcp795-pv" data-x811="pv">PREVIEW</button><button type="button" class="btn rcp795-b rcp795-pr" data-x811="pr">PRINT</button>'
    + '<button type="button" class="btn rcp795-b rcp795-sv" data-x811="sv">SAVE PDF</button><button type="button" class="btn btn-o" data-close>ปิด</button>';
  let show = () => { body.innerHTML = ds.map((d, j) => (ds.length > 1 || d.__adv ? `<div class="h814">${d.__adv ? "RECEIPT ADVANCE (ADV)" : "RECEIPT (RCP)"}</div>` : "") + DH811(d, "INVOICE NJ")).join(""); };
  show(); Q({ title: "ใบเสร็จ " + ds.map((d) => d.receipt_no || "").join(" + "), body, footer: foot, fullscreen: !0, wide: !0 });
  foot.querySelector('[data-x811="pv"]').onclick = async (ev) => {   /* PREVIEW = RW795 (แสดงในหน้าต่างนี้ · ปิด = รายละเอียด) */
    let b2 = ev.currentTarget; if (b2.disabled) return; b2.disabled = !0;
    try { let docs = await RL795([key]); docs.length && (await RW795(docs, { sample: !1, back: show }, body)); } catch (e) { k("เปิดใบเสร็จไม่สำเร็จ — " + RE795(e), "err"); } finally { b2.disabled = !1; }
  };
  foot.querySelector('[data-x811="pr"]').onclick = (ev) => RPR795(key, ev.currentTarget);
  foot.querySelector('[data-x811="sv"]').onclick = (ev) => SV795(key, ev.currentTarget);
}

function RB811(t) {   /* คลิกแถว / Enter / ปุ่มรายการ → รายละเอียด (ผูกครั้งเดียวต่อหน้า) */
  if (!t || t.__rb811) return; t.__rb811 = 1;
  t.addEventListener("click", (ev) => {
    let g = ev.target.closest && ev.target.closest("[data-d811]"); if (g && t.contains(g)) { ev.preventDefault(); DT811(g.dataset.d811); return; }
    if (ev.target.closest && ev.target.closest("button,a,input,select,label")) return;
    let tr = ev.target.closest && ev.target.closest("#rc-tbody tr[data-r811]"); tr && t.contains(tr) && DT811(tr.dataset.r811);
  });
  t.addEventListener("keydown", (ev) => { if (ev.key !== "Enter") return; let tr = ev.target; tr && tr.matches && tr.matches("#rc-tbody tr[data-r811]") && (ev.preventDefault(), DT811(tr.dataset.r811)); });
}
function XR811(t) {   /* EXPORT EXCEL แถบใบเสร็จที่ออกแล้ว : 1 แถวต่อใบเสร็จ (ตัวกรองที่ค้นหาแล้ว · ทุกหน้า · ไม่รวมยอดซ้ำ) */
  let bt = t.querySelector("#rc-xl811"); if (!bt || bt.__xl811) return; bt.__xl811 = 1;
  bt.onclick = async () => {
    if (bt.disabled) return; bt.disabled = !0; let lb = bt.innerHTML; bt.textContent = "กำลังส่งออก…";
    try {
      let f = { company_group: "NJ", q: b.q || null, customer_id: b.customer || null, from: b.from || null, to: b.to || null, ...FP678(b) };
      let r = await XF734(async (pg, sz) => { let x = await V("njacc_rcp818_list", { p: Object.assign({}, f, { page: pg, size: sz }) }); ((x && x.rows) || []).forEach((o) => { o.__k734 = K814(o) || null; }); return x; }, 200);
      let fn = await XW734("FINANCE_RECEIPT_ISSUED", CX811("INVOICE NJ").concat([["RECEIPT ADVANCE No.", (o) => o.adv_no || ""], ["ยอด ADVANCE", (o) => o.adv_total, "num"]]), r.rows);   /* V.814 */
      k("ส่งออก Excel " + r.rows.length.toLocaleString("th-TH") + " ใบเสร็จแล้ว (" + fn + ")", "ok");
    } catch (e) { k("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); }
    bt.disabled = !1; bt.innerHTML = lb;
  };
}
function CX811(lab) { return [["เลขที่ใบเสร็จ", (o) => o.receipt_no], ["วันที่ออก", (o) => o.receipt_date, "date"], ["Customer", (o) => o.customer_name], ["จำนวน JOB", (o) => o.job_count, "int"], ["จำนวน INVOICE", (o) => o.invoice_count, "int"],
  ["ยอดรวม", (o) => o.total, "num"], ["สถานะ", (o) => (o.status === "VOID_RESET" ? "ยกเลิก" : "ออกใบเสร็จแล้ว")], ["JOB No.", (o) => o.job_nos], [lab, (o) => o.invoice_nos]]; }
function ST811() {
  try {
    if (document.getElementById("st811-css")) return;
    let s = document.createElement("style"); s.id = "st811-css";
    s.textContent = [
      ".sum811{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:10px 0 0;padding:8px 12px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;font-size:13px;color:#334155}.sum811:empty{display:none}.sum811 b{color:#0f2a4d;font-size:14px}",
      "tr.r811,tr.r811 td,.rc502 tbody tr.r811,.rc502 tbody tr.r811 td{cursor:pointer!important}tr.r811:hover td{background:#eef4ff!important}tr.r811:focus-visible{outline:2px solid #2563eb;outline-offset:-2px}.no811{color:#0f2a4d}",
      "td.c811{min-width:180px;max-width:340px;white-space:normal;line-height:1.3}",
      ".btn.b811{background:#fff!important;border:1px solid #2563eb!important;color:#1d4ed8!important;font-weight:700;margin-right:4px}.btn.b811:hover{background:#eff6ff!important}",
      ".h811{display:grid;grid-template-columns:repeat(6,minmax(0,auto));gap:10px 22px;margin:0 0 12px;padding:12px 14px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc}",
      ".h811>div{display:flex;flex-direction:column;gap:2px;min-width:0}.h811 span{font-size:12px;color:#64748b}.h811 b{font-size:14px;color:#0f2a4d;overflow-wrap:anywhere}.h811 .s811{color:#15803d}",
      ".t811 th small{font-weight:600;opacity:.8}.t811 tfoot td{font-weight:800;background:#f1f5f9;border-top:2px solid #cbd5e1}.f811{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;width:100%}",
      "@media (max-width:900px){.h811{grid-template-columns:repeat(2,minmax(0,1fr))}.h811 .h811-c{grid-column:1/-1}}",
      "@media (max-width:640px){",
      "#rc-issued table thead,.t811l thead{display:none}#rc-issued table,#rc-issued table tbody,.t811l,.t811l tbody{display:block;width:100%}",
      "tr.r811{display:block;margin:0 0 10px;border:1px solid #dbe4f0;border-radius:10px;background:#fff;padding:6px 10px;box-shadow:0 1px 2px rgba(15,42,77,.06)}",
      "tr.r811 td{display:flex;justify-content:space-between;align-items:center;gap:10px;border:0!important;padding:5px 0!important;max-width:none!important;min-width:0!important;text-align:right;white-space:normal}",
      "tr.r811 td::before{content:attr(data-l);font-size:12px;color:#64748b;font-weight:600;text-align:left;flex:none}tr.r811 td.col-act{flex-wrap:wrap;justify-content:flex-end}tr.r811 td.col-act::before{display:none}",
      ".t811 thead{display:none}.t811,.t811 tbody,.t811 tfoot{display:block;width:100%}.t811 tr{display:block;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 8px;padding:4px 8px}",
      ".t811 td{display:flex;justify-content:space-between;gap:10px;border:0!important;padding:4px 0!important;text-align:right}.t811 td::before{content:attr(data-l);color:#64748b;font-size:12px;font-weight:600;text-align:left}",
      ".t811 tfoot td[colspan]{display:none}.f811 .btn{flex:1 1 40%}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.813 · PREVIEW เต็มหน้าจอ (ไม่ใช้กรอบ Modal เดิม) — แถบเครื่องมือด้านบน PRINT / SAVE PDF / ปิด · เอกสาร A4 กึ่งกลาง ปรับขนาดการแสดงผลให้พอดีความกว้างจออัตโนมัติ (เฉพาะการแสดงผล ไม่ย่อ PDF)
   เนื้อหา = HTML เดียวกับ PRINT / SAVE PDF (Template เดิม) · ปิด = กลับหน้าเดิม (ไม่ล้างตัวกรอง / รายการที่เลือก) · ใช้ร่วมทุกจุดที่เรียก Preview เดิม ═══ */
function PV813(o) {
  ST813V(); let old = document.getElementById("pv813"); old && old.remove();
  let w = document.createElement("div"); w.id = "pv813"; w.className = "pv813"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
  w.innerHTML = `<div class="pv813-bar"><div class="pv813-t"><b>${i(o.title || "")}</b>${o.note ? `<span class="pv813-n">${i(o.note)}</span>` : ""}${o.warn ? `<span class="pv813-w">${i(o.warn)}</span>` : ""}</div>`
    + `<div class="pv813-b"><button type="button" class="btn pv813-pr" data-pv813="pr">PRINT</button>${o.commit ? '<button type="button" class="btn pv813-ok" data-pv813="ok">SAVE</button>' : ""}${o.save ? '<button type="button" class="btn pv813-sv" data-pv813="sv">SAVE PDF</button>' : ""}<button type="button" class="btn pv813-x" data-pv813="x">ปิด</button></div></div>`
    + `<div class="pv813-st"><div class="pv813-z"><div class="rcp795-doc radv788-doc pv813-doc">${o.html}</div></div></div>`;
  document.body.appendChild(w);
  let ov0 = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
  let st = w.querySelector(".pv813-st"), z = w.querySelector(".pv813-z");
  let fit = () => { let W = st.clientWidth - 16, s = Math.max(0.2, Math.min(1.25, W / 793.7)); z.style.zoom = String(Math.round(s * 1000) / 1000); };
  fit(); let ro = null; try { ro = new ResizeObserver(fit); ro.observe(st); } catch (e) { window.addEventListener("resize", fit); }
  let close = () => { if (!w.isConnected) return; try { ro ? ro.disconnect() : window.removeEventListener("resize", fit); } catch (e) {} document.removeEventListener("keydown", key, !0); w.remove(); document.documentElement.style.overflow = ov0; try { o.onClose && o.onClose(); } catch (e) {} };
  let key = (ev) => { ev.key === "Escape" && !document.body.classList.contains("rcp795-printing") && (ev.preventDefault(), ev.stopPropagation(), close()); };
  document.addEventListener("keydown", key, !0);
  w.querySelector('[data-pv813="x"]').onclick = close;
  let pb = w.querySelector('[data-pv813="pr"]'); pb.onclick = async () => { if (pb.disabled) return; pb.disabled = !0; try { await o.print(); } finally { pb.disabled = !1; } };   /* V.814 */
  let cb = w.querySelector('[data-pv813="ok"]'); cb && (cb.onclick = async () => { if (cb.disabled) return; cb.disabled = !0; try { await o.commit(); } finally { cb.disabled = !1; } });
  let sv = w.querySelector('[data-pv813="sv"]'); sv && (sv.onclick = async () => { if (sv.disabled) return; for (let j = 0; j < o.parts.length; j++) await o.save(o.parts[j], o.names[j], sv); });
  return { close, el: w };
}
function ST813V() {
  try {
    if (document.getElementById("st813v-r")) return;
    let s = document.createElement("style"); s.id = "st813v-r";
    s.textContent = [
      ".pv813{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;background:#e9ecf1}",
      ".pv813-bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 12px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:#0f2a4d;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25)}",
      ".pv813-t{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;font-size:14px}.pv813-t b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}",
      ".pv813-n{font-size:12px;font-weight:700;color:#fecaca}.pv813-w{font-size:12px;font-weight:700;background:#dc2626;color:#fff;border-radius:999px;padding:1px 10px}",
      ".pv813-b{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}.pv813-b .btn{min-width:92px;height:36px;min-height:36px;padding:0 14px;font-size:13.5px;font-weight:700;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-align:center}",
      ".btn.pv813-pr{background:#2563eb!important;border:1px solid #2563eb!important;color:#fff!important}.btn.pv813-sv{background:#16a34a!important;border:1px solid #16a34a!important;color:#fff!important}.btn.pv813-x{background:#fff!important;border:1px solid #fff!important;color:#0f2a4d!important}.pv813-b .btn:disabled{opacity:.6;cursor:wait}",
      ".pv813-st{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:8px}",
      ".pv813-z{width:210mm;margin:0 auto}.pv813-doc .rcp-pg{margin:0 auto 8px;box-shadow:0 1px 6px rgba(15,23,42,.18)}",
      "@media (max-width:640px){.pv813-bar{padding:6px 8px;gap:6px}.pv813-t{font-size:13px}.pv813-b{width:100%}.pv813-b .btn{flex:1 1 0;min-width:0;height:34px;min-height:34px;padding:0 4px;font-size:13px}.pv813-t b{max-width:100%}.pv813-st{padding:6px}}",
      "@media print{.pv813{display:none!important}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.813 · PDF ส่วนรายละเอียดใต้ส่วนหัว : ตัวอักษร 8–9.6 pt · ตาราง / กรอบ กระชับ ~10–15% (ส่วนหัวคงเดิม 100% · ไม่ย่อทั้งหน้า) — ใช้ร่วม PREVIEW / PRINT / SAVE PDF ═══ */
function ST813() {
  try {
    if (document.getElementById("st813r-css")) return;
    let s = document.createElement("style"); s.id = "st813r-css";
    s.textContent = [
      ".rcp-pg .rcp-boxes{gap:3.5mm;margin-top:4.2mm}",
      ".rcp-pg .rcp-box{padding:3.8mm 3.4mm 2.5mm}.rcp-pg .rcp-tag{font-size:8.5pt;top:-2.4mm}",
      ".rcp-pg .rcp-kv{margin-top:1mm;font-size:8.8pt;line-height:1.3}.rcp-pg .rcp-boxes>.rcp-box:first-child .rcp-kv{font-size:8.4pt}.rcp-pg .rcp-addr{font-size:8.2pt;line-height:1.3}",
      ".rcp-pg .rcp-tb{margin-top:4.2mm}.rcp-pg .rcp-tb th{font-size:8.8pt;line-height:1.2;padding:1.9mm 1.6mm}",
      ".rcp-pg .rcp-tb td{font-size:8.3pt;line-height:1.35;padding:1.8mm 1.6mm}.rcp-pg .rcp-tb th,.rcp-pg .rcp-tb td{border-width:.5pt}",
      ".rcp-pg .rcp-tb colgroup col:nth-child(1){width:6%!important}.rcp-pg .rcp-tb colgroup col:nth-child(2){width:22%!important}.rcp-pg .rcp-tb colgroup col:nth-child(3){width:17%!important}.rcp-pg .rcp-tb colgroup col:nth-child(4){width:31%!important}.rcp-pg .rcp-tb colgroup col:nth-child(5){width:24%!important}",
      ".rcp-pg .rcp-tot td{font-size:9pt;font-weight:700}",
      ".rcp-pg .rcp-sum{gap:3.5mm;margin-top:4.2mm}.rcp-pg .rcp-pay{padding:3mm 3.4mm;font-size:8.3pt;line-height:1.5}",
      ".rcp-pg .rcp-amt{padding:0}.rcp-pg .rcp-a1{padding:2.1mm 3.4mm;font-size:8.8pt}.rcp-pg .rcp-a2{padding:2.6mm 3.4mm;font-size:9.6pt;font-weight:700}",
      ".rcp-pg .rcp-sign{gap:3.5mm;margin-top:4.2mm}.rcp-pg .rcp-sign .rcp-box{padding:3mm 3.4mm;font-size:8pt;min-height:35mm}.rcp-pg .rcp-st{font-size:8pt}.rcp-pg .rcp-for{font-size:8pt}",
      ".rcp-pg .rcp-sp{height:12.5mm}.rcp-pg .rcp-sp2{height:8.5mm}.rcp-pg .rcp-sc{margin:1mm 0 2.2mm}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.814 (RUN-818) · FINANCE → RECEIPT : ต่อลูกค้า RCP (SERVICE) + ADV (ADVANCE) — PREVIEW / SAVE / PRINT ทีเดียว · เอกสาร ADV ใช้ Template / Loader เดิมของ FINANCE — ADVANCE ═══ */
function FX814(docs) { let d = docs || []; return d.length === 1 && d[0].kind === "ADV" ? "RECEIPT_ADVANCE_" + d[0].receipt_no : "RECEIPT_" + d.map((z) => z.receipt_no).join("_"); }   /* ชื่อไฟล์ : RECEIPT_<RCP>[_<ADV>] · ADV อย่างเดียว = RECEIPT_ADVANCE_<ADV> */
var A814 = null;
async function AD814() {   /* V.814 : เอกสาร RECEIPT ADVANCE (ADV) = Template / Loader เดิมของ FINANCE — ADVANCE (charge-page · RF788 / RL788) */
  if (!A814) { let m = await import("./charge-page-BRQ6QVJY.js"); A814 = m; }
  try { A814.ST814 && A814.ST814(); } catch (e) {}
  ST814(); return A814;
}
function ST814() {
  try {
    if (document.getElementById("st814-css")) return;
    let s = document.createElement("style"); s.id = "st814-css";
    s.textContent = [
      ".pv813-doc .radv-pg{margin:0 auto 8px;box-shadow:0 1px 6px rgba(15,23,42,.18)}",
      "@media print{body.rcp795-printing .radv-pg{box-shadow:none;margin:0}}",
      ".rcp814-cap{margin:8px 0 4px;font-size:12.5px;font-weight:800;color:#0f2a4d}.rcp814-cap.rcp814-a{color:#9a3412}",
      ".adv814{display:block;margin-top:2px;font-size:12px;font-weight:700;color:#9a3412;white-space:nowrap}",
      ".btn.pv813-ok{background:#16a34a!important;border:1px solid #16a34a!important;color:#fff!important}",
      ".ask814{position:fixed;inset:0;z-index:3200;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".ask814-b{background:#fff;border-radius:12px;max-width:560px;width:100%;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:14px;line-height:1.55;color:#0f172a}",
      ".ask814-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}.ask814-f .btn{min-width:120px}",
      ".h814{margin:16px 0 8px;font-size:14px;font-weight:800;color:#9a3412}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.815 (RUN-820) · FINANCE → RECEIPT (รอรับชำระ) : UPLOAD EXCEL — Billing Note no. จาก APL Billing / CASE · ตรวจซ้ำ 3 กรณี · ยึดไฟล์ล่าสุด
   อ่านหัวคอลัมน์จากชื่อจริง (ไม่ยึดตำแหน่ง) · ข้ามแถว TOTAL · Name CS / Status / Contact ห้ามนำเข้า · คอลัมน์อื่นที่ไม่มีฟิลด์รองรับ = ข้าม · ไม่สร้าง INVOICE
   ตรวจ (njacc_bn820_check · อ่านอย่างเดียว) → Preview → ยืนยัน → บันทึก (njacc_bn820_save · ธุรกรรมเดียว · เฉพาะค่าที่เปลี่ยน) · ค่าว่างไม่ลบค่าเดิม ═══ */
var BK820 = { namecs: "Name CS", status: "Status", contact: "Contact" };
function NH820(h) { return String(h == null ? "" : h).toLowerCase().replace(/[\s._\-\/()#:]+/g, ""); }
function TX820(v) { return v == null ? "" : String(v).replace(/ /g, " ").trim(); }
function DT820(d) { try { let p = (n) => String(n).padStart(2, "0"); d = new Date(d); return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); } catch (e) { return ""; } }
function UPB820(t) {   /* ปุ่ม UPLOAD EXCEL (สีส้ม) ต่อจากปุ่มคอลัมน์ */
  try {
    if (!t || !CAN795()) return; let bar = t.querySelector("#rc-pending .fbar"); if (!bar || bar.querySelector("#rp-up820")) return; ST820();
    let b = document.createElement("button"); b.type = "button"; b.className = "btn btn-sm up820"; b.id = "rp-up820"; b.textContent = "⬆ UPLOAD EXCEL"; b.title = "นำเข้าข้อมูลรอรับชำระจาก Excel .xlsx / .xls ทุกคอลัมน์ที่หน้ารายงานรองรับ + Billing Note no. (APL Billing / CASE) — เลือกได้หลายไฟล์";
    let inp = document.createElement("input"); inp.type = "file"; inp.id = "rp-up820-f"; inp.multiple = !0; inp.hidden = !0;
    inp.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
    let colOf = () => [...bar.children].find((x) => x !== b && x.tagName === "BUTTON" && /คอลัมน์/.test(x.textContent));
    let place = () => { let c = colOf(), ref = c || bar.querySelector("#rp-xl734"); ref ? ref.after(b) : bar.appendChild(b); b.after(inp); return !!c; };
    if (!place()) { let mo = new MutationObserver(() => { colOf() && (place(), mo.disconnect()); }); mo.observe(bar, { childList: !0 }); setTimeout(() => mo.disconnect(), 2e4); }
    b.onclick = () => { if (b.disabled) return; inp.value = ""; inp.click(); };
    inp.onchange = () => { let fs = [...(inp.files || [])]; inp.value = ""; fs.length && UP820(t, fs, b); };
  } catch (e) { try { console.warn("UPB820", e); } catch (z) {} }
}
async function SH820(buf) {   /* SHA-256 ของไฟล์ (ตรวจไฟล์เดิมซ้ำ) */
  try { let h = await crypto.subtle.digest("SHA-256", buf); return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
  catch (e) { let a = new Uint8Array(buf), h1 = 2166136261, h2 = 0; for (let j = 0; j < a.length; j++) { h1 = Math.imul(h1 ^ a[j], 16777619) >>> 0; h2 = (h2 * 31 + a[j]) >>> 0; } return "fnv" + h1.toString(16) + h2.toString(16) + a.length; }
}
async function UP820(t, fs, btn) {   /* เลือกไฟล์ → อ่าน → ตรวจ Server → Preview */
  ST820(); let at0 = Date.now(), files = [], XL;
  btn && (btn.disabled = !0); let lb = btn && btn.textContent; btn && (btn.textContent = "กำลังอ่านไฟล์…");
  try {
    XL = await XLS820();
    for (let j = 0; j < fs.length; j++) {   /* ลำดับที่ระบบรับ = ลำดับไฟล์ที่เลือก / เวลารับจริง */
      let f = fs[j]; if (!/\.(xlsx|xls)$/i.test(f.name)) { files.push({ seq: j + 1, name: f.name, size: f.size, at: new Date(at0 + j).toISOString(), hash: "", rows: [], used: [], skipped: [], total: 0, err: "รองรับเฉพาะ .xlsx / .xls" }); continue; }
      files.push(await RD820(f, j + 1, new Date(Date.now()).toISOString(), XL)); files[j].raw = f;
    }
  } catch (e) { k("อ่านไฟล์ Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); return; }
  finally { btn && (btn.disabled = !1, btn.textContent = lb); }
  await PV820(t, files);
}
/* ═══ V.818 (RUN-823) · UPLOAD EXCEL : นำเข้าทุกคอลัมน์ที่หน้ารายงาน (รอรับชำระ) รองรับ — Mapping ตามความหมายของคอลัมน์รายงาน (ไม่ใช่ชื่อฟิลด์ Database ตรงตัว)
   INVOICE ที่มีในระบบ = Billing Note no. เท่านั้น (RUN-820 เดิม · ไม่แตะยอด / ACCOUNTING) · INVOICE ที่ไม่มีในระบบ = รายการนำเข้าจาก Excel (njacc_rx823 · ไม่สร้าง INVOICE / RECEIPT)
   ตรวจซ้ำด้วย Invoice No. (ระบบ + รายการนำเข้าเดิม + ข้ามไฟล์ + ในไฟล์) · ยึดไฟล์ล่าสุดหลังยืนยัน · ช่องว่างไม่เขียนทับ · แสดงค่าเดิม → ค่าใหม่ · APL Billing ≠ CASE = ให้ผู้ใช้เลือก ═══ */
var MP823 = [   /* [หัว Excel (normalize), ฟิลด์, หัวข้อรายงาน, ชนิด] */
  [["date"], "doc_date", "Date", "date"],
  [["customername"], "customer_name", "ลูกค้า", "text"],
  [["companyinvoice"], "company_invoice", "บริษัท Invoice", "text"],
  [["customerjobno"], "customer_job_no", "Customer Job No.", "text"],
  [["dclinv", "dclinvoice"], "source_invoice_no", "Invoice ต้นทาง (Source) · Invoice No. *", "text"],
  [["houseblno", "housebl"], "house_bl_no", "House B/L No.", "text"],
  [["master", "masterbl", "masterblno"], "master_bl_no", "Master B/L No.", "text"],
  [["servicecharge"], "service_amount", "Service charge", "num"],
  [["advance"], "advance_amount", "Advance", "num"],
  [["vat7%", "vat", "vat7"], "vat_amount", "VAT 7%", "num"],
  [["amount"], "subtotal", "Amount", "num"],
  [["wht3%", "wht", "wht3"], "wht_amount", "WHT 3%", "num"],
  [["totalamout", "totalamount"], "net_payable", "Total Amount", "num"]
];
var NUMK823 = MP823.filter((m) => m[3] === "num").map((m) => m[1]), FLD823 = MP823.map((m) => m[1]);
function NUM823(v) { if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : NaN; let s = TX820(v).replace(/[,\s฿]/g, ""); if (!s || s === "-") return null; let ng = /^\(.*\)$/.test(s); s = s.replace(/[()]/g, ""); if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN; let n = Math.round(Number(s) * 100) / 100; return ng ? -n : n; }
function DT823(raw, txt, XL) {   /* → yyyy-mm-dd · ปี พ.ศ. = ลบ 543 · อ่านไม่ได้ = null */
  let p = (n) => String(n).padStart(2, "0"), ok = (y, m, d) => { y > 2400 && (y -= 543); let x = new Date(Date.UTC(y, m - 1, d)); return y > 1900 && x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? y + "-" + p(m) + "-" + p(d) : null; };
  if (typeof raw === "number" && raw > 20000 && raw < 80000) { try { let c = XL.SSF.parse_date_code(raw); if (c) return ok(c.y, c.m, c.d); } catch (e) {} }
  let s = TX820(txt != null && txt !== "" ? txt : raw), m;
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/))) return ok(+m[3], +m[2], +m[1]);
  if ((m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/))) return ok(+m[1], +m[2], +m[3]);
  return null;
}
function RV823(d) {   /* กติกาเดียวกับ njacc_rx823_rv (Server ตรวจซ้ำ) */
  let n = (k) => d[k] == null || Number.isNaN(d[k]);
  if (!TX820(d.customer_name)) return "ไม่มีชื่อลูกค้า";
  if (NUMK823.some(n)) return "ยอดเงินไม่ครบ (Service / Advance / VAT / Amount / WHT / Total)";
  if (Math.abs(d.service_amount + d.advance_amount + d.vat_amount - d.subtotal) > 0.01) return "Service + Advance + VAT ไม่เท่ากับ Amount";
  if (Math.abs(d.subtotal - d.wht_amount - d.net_payable) > 0.01) return "Amount − WHT ไม่เท่ากับ Total Amount";
  return "";
}
async function RD820(f, seq, at, XL) {   /* อ่านไฟล์ → แถว (หัวคอลัมน์ตามชื่อจริง · Mapping ตามคอลัมน์รายงาน) */
  let buf = await f.arrayBuffer(), hash = await SH820(buf), o = { seq, name: f.name, size: f.size, at, hash, sheet: "", rows: [], used: [], skipped: [], total: 0, blank: 0, err: "" };
  let wb; try { wb = XL.read(new Uint8Array(buf), { type: "array", cellDates: !1, cellNF: !0, cellText: !0 }); } catch (e) { o.err = "อ่านไฟล์ไม่ได้ (ไม่ใช่ Excel .xlsx / .xls)"; return o; }
  for (let sn of wb.SheetNames || []) {
    let ws = wb.Sheets[sn], A = XL.utils.sheet_to_json(ws, { header: 1, raw: !1, defval: "", blankrows: !0 }), W = XL.utils.sheet_to_json(ws, { header: 1, raw: !0, defval: "", blankrows: !0 }), hi = -1;
    let r0 = 0; try { r0 = XL.utils.decode_range(ws["!ref"]).s.r; } catch (e) {}
    for (let j = 0; j < Math.min(A.length, 40); j++) if ((A[j] || []).some((c) => NH820(c) === "invoiceno")) { hi = j; break; }
    if (hi < 0) continue;
    let H = A[hi].map((c) => TX820(c)), ix = { inv: -1, apl: -1, cs: -1 }, fx = {};
    H.forEach((h, j) => { let n = NH820(h); if (!h) return;
      if (n === "invoiceno" && ix.inv < 0) { ix.inv = j; o.used.push(h + " → Invoice No. (จับคู่ / ตรวจซ้ำ)"); return; }
      if (n === "aplbilling" && ix.apl < 0) { ix.apl = j; o.used.push(h + " → Billing Note no."); return; }
      if (n === "case" && ix.cs < 0) { ix.cs = j; o.used.push(h + " → Billing Note no."); return; }
      if (BK820[n]) { o.skipped.push(h + " (ห้ามนำเข้า)"); return; }
      let m = MP823.find((z) => z[0].includes(n));
      if (m && fx[m[1]] == null) { fx[m[1]] = j; o.used.push(h + " → " + m[2]); return; }
      o.skipped.push(h + (m ? " (ซ้ำ — ใช้คอลัมน์แรก)" : " (ไม่มีคอลัมน์ในหน้ารายงาน)")); });
    o.sheet = sn;
    for (let j = hi + 1; j < A.length; j++) {
      let r = A[j] || [], w = W[j] || [];
      if (!r.some((c) => TX820(c))) { o.blank++; continue; }
      if (r.some((c) => TX820(c).toUpperCase() === "TOTAL")) { o.total++; continue; }
      let inv = TX820(r[ix.inv]), apl = ix.apl >= 0 ? TX820(r[ix.apl]) : "", cs = ix.cs >= 0 ? TX820(r[ix.cs]) : "", rn = r0 + j + 1;
      if (!inv) { o.rows.push({ seq, r: rn, inv: "", key: "", apl, cs, v: "", bad: "ไม่มี Invoice No." }); continue; }
      let d = {}, warn = [];
      MP823.forEach((m) => { let c = fx[m[1]]; if (c == null) return; let t = TX820(r[c]);
        if (m[3] === "num") { let x = NUM823(w[c] !== "" ? w[c] : t); if (Number.isNaN(x)) { warn.push(m[2] + " ไม่ใช่ตัวเลข (" + t + ")"); d[m[1]] = null; } else if (x != null) d[m[1]] = x; }
        else if (m[3] === "date") { if (t) { let x = DT823(w[c], t, XL); x ? (d[m[1]] = x) : warn.push(m[2] + " อ่านวันที่ไม่ได้ (" + t + ")"); } }
        else if (t) d[m[1]] = t.slice(0, 300); });
      let x = { seq, r: rn, inv, key: inv.toUpperCase(), apl, cs, v: "", cf: !1, d, warn };
      if (apl && cs && apl !== cs) x.cf = !0; else x.v = apl || cs;   /* APL อย่างเดียว / CASE อย่างเดียว / ทั้งคู่เหมือนกัน · ต่างกัน = ให้ผู้ใช้เลือก */
      o.rows.push(x);
    }
    return o;
  }
  o.err = "ไม่พบหัวคอลัมน์ Invoice No."; return o;
}
function EQ823(k, a, b) {   /* ค่าเดิม (Server) เทียบค่าใหม่ */
  if (a == null || a === "") return b == null || b === "";
  if (b == null || b === "") return !1;
  if (NUMK823.includes(k)) return Math.abs(Number(a) - Number(b)) < 0.005;
  return String(a).trim() === String(b).trim();
}
function LB823(k) { let m = MP823.find((z) => z[1] === k); return m ? m[2] : k === "billing_note" ? "Billing Note no." : k; }
function FV823(k, v) { return v == null || v === "" ? "-" : NUMK823.includes(k) ? Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : k === "doc_date" ? String(v).slice(0, 10).split("-").reverse().join("/") : String(v); }
function MG820(files, found, prior, pick, imported, rx) {   /* รวมทุกไฟล์ : ยึดไฟล์ที่ระบบรับล่าสุด (ทีละฟิลด์ · ช่องว่างไม่ทับ) · ตรวจซ้ำ ระบบ / รายการนำเข้าเดิม / ข้ามไฟล์ / ในไฟล์ */
  let M = new Map(), out = [], bad = [];
  files.forEach((f) => f.rows.forEach((x) => { if (!x.key) { bad.push(Object.assign({ st: "ERR", why: x.bad, file: f }, x)); return; } let g = M.get(x.key); g || M.set(x.key, (g = { key: x.key, occ: [] })); g.occ.push(Object.assign({ file: f }, x)); }));
  let ph = new Set(prior.map((p) => p.file_hash)), F = new Map(), IM = new Map();
  found.forEach((z) => { let a = F.get(z.key) || []; a.push(z); F.set(z.key, a); });
  (imported || []).forEach((z) => IM.set(z.key, z));
  let sg = (o) => JSON.stringify([o.cf ? "\u0001" + o.apl + "\u0002" + o.cs : o.v, FLD823.map((k) => (o.d || {})[k] == null ? "" : String(o.d[k]))]);
  M.forEach((g) => {
    let occ = g.occ.slice().sort((a, b) => b.seq - a.seq || b.r - a.r), seqs = [...new Set(occ.map((o) => o.seq))], inF = [], cfIn = !1;
    seqs.forEach((s) => { let a = occ.filter((o) => o.seq === s); if (a.length > 1) { inF.push(s); new Set(a.map(sg)).size > 1 && (cfIn = !0); } });
    let ch = occ.find((o) => o.v || o.cf) || occ[0], fz = F.get(g.key) || [], fi = fz[0], sel = pick.get(g.key), v = ch.cf ? (sel === "apl" ? ch.apl : sel === "cs" ? ch.cs : "") : ch.v;
    let d = {}; FLD823.forEach((k) => { let o = occ.find((z) => z.d && z.d[k] != null && z.d[k] !== ""); o && (d[k] = o.d[k]); });   /* ไฟล์ล่าสุดที่มีค่า */
    let warn = [...new Set(occ[0].warn || [])];
    let row = { key: g.key, inv: ch.inv, seq: occ[0].seq, r: occ[0].r, file: occ[0].file, apl: ch.apl, cs: ch.cs, cf: ch.cf, v, d, warn, n: occ.length, files: seqs.slice().sort((a, b) => a - b), inFile: inF.length > 0, cross: seqs.length > 1,
      prior: occ.some((o) => ph.has(o.file.hash)), id: fi && fi.invoice_id, ino: fi && fi.invoice_no, cur: fi ? fi.current : null, curFile: fi && fi.current_file, sys: fi && fi.sys, imp: !fi, ex: !fi ? IM.get(g.key) || null : null, diff: [] };
    if (fz.length > 1) { row.st = "ERR"; row.why = "Invoice No. ตรงกับหลาย INVOICE ในระบบ"; }
    else if (cfIn) { row.st = "ERR"; row.why = "INVOICE ซ้ำในไฟล์เดียวกัน ข้อมูลขัดแย้ง — กรุณาตรวจไฟล์"; }
    else if (ch.cf && !sel) { row.st = "ERR"; row.why = "APL Billing ≠ CASE — กรุณาเลือกค่าที่ใช้"; row.need = !0; }
    else if (fi) {   /* INVOICE ในระบบ : อัปเดตเฉพาะ Billing Note no. (ยอด / คอลัมน์อื่น = ข้อมูลจาก ACCOUNTING เดิม) */
      if (!v) { row.st = "SAME"; row.why = row.cur ? "ค่าว่างในไฟล์ — คงค่าเดิม (ไม่ลบ)" : "INVOICE ในระบบ · ไม่มีค่า APL Billing / CASE"; }
      else if (row.cur == null) { row.st = "NEW"; row.why = "INVOICE ในระบบ · Billing Note no. ใหม่"; }
      else if (row.cur === v) { row.st = "SAME"; row.why = "ข้อมูลซ้ำ ไม่เปลี่ยนแปลง"; }
      else { row.st = "CHG"; row.why = "ข้อมูลซ้ำ มีการเปลี่ยนแปลง"; row.diff = [["billing_note", row.cur, v]]; }
    } else if (!rx) { row.st = "ERR"; row.why = "ไม่พบ INVOICE ในระบบ — ระบบฐานข้อมูลยังไม่พร้อมนำเข้า (ต้องรัน RUN-823)"; }
    else {   /* ไม่มี INVOICE ในระบบ = รายการนำเข้าจาก Excel */
      let ex = row.ex, nv = Object.assign({}, d); v && (nv.billing_note = v);
      row.rv = RV823(Object.assign({}, ex ? Object.fromEntries(FLD823.map((k) => [k, ex[k] == null ? null : NUMK823.includes(k) ? Number(ex[k]) : ex[k]])) : {}, nv));
      if (!ex) { row.st = "IMP"; row.why = "เพิ่มใหม่ — รายการนำเข้าจาก Excel (ไม่สร้าง INVOICE)"; }
      else {
        FLD823.concat(["billing_note"]).forEach((k) => { if (nv[k] == null || nv[k] === "") return; EQ823(k, ex[k], nv[k]) || row.diff.push([k, ex[k], nv[k]]); });
        if (row.diff.length) { row.st = "CHG"; row.why = "ข้อมูลซ้ำ (รายการนำเข้าเดิม) มีการเปลี่ยนแปลง " + row.diff.length + " ช่อง"; } else { row.st = "SAME"; row.why = "ข้อมูลซ้ำ (รายการนำเข้าเดิม) ไม่เปลี่ยนแปลง"; }
      }
    }
    row.dup = row.cur != null || !!row.ex || row.cross || row.inFile || row.prior;
    out.push(row);
  });
  return out.concat(bad);
}
async function CK820(files) {   /* ตรวจที่ Server (อ่านอย่างเดียว · แบ่งชุด) */
  let keys = [...new Set(files.flatMap((f) => f.rows.map((x) => x.key)).filter(Boolean))], found = [], prior = [], imported = [], rx = !0;
  let hs = files.map((f) => f.hash).filter(Boolean);
  for (let j = 0; j < Math.max(1, keys.length); j += 5000) {
    let r = await V("njacc_bn820_check", { p: { invoice_nos: keys.slice(j, j + 5000), hashes: j ? [] : hs } });
    j || (prior = r && r.prior || []); found = found.concat(r && r.found || []);
    Array.isArray(r && r.imported) ? (imported = imported.concat(r.imported)) : (rx = !1);   /* ไม่มี imported = DB ยังไม่รัน RUN-823 */
  }
  return { found, prior, imported, rx };
}
function RE820(e) {
  let m = String(e && e.message || e || "");
  if (/NJACC_BN820_CHANGED/.test(m)) return "มีผู้ใช้อื่นบันทึกข้อมูลรายการเดียวกันระหว่างตรวจ — ระบบตรวจใหม่แล้ว กรุณาตรวจสอบและยืนยันอีกครั้ง (ยังไม่ได้บันทึก)";
  if (/NJACC_BN820_INVALID/.test(m)) return "มีรายการที่บันทึกไม่ได้ — " + m.replace(/^.*NJACC_BN820_INVALID:\s*/, "").slice(0, 300);
  if (/NJACC_(MODULE_)?FORBIDDEN/.test(m)) return "ไม่มีสิทธิ์";
  if (/njacc_bn820|njacc_rx823|PGRST202|schema cache/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-820 / RUN-823)";
  return m;
}
async function PV820(t, files) {   /* หน้าต่าง Preview */
  ST823();
  let body = document.createElement("div"), foot = document.createElement("div"), st = { ck: null, rows: [], pick: new Map(), f: "ALL", busy: !1, req: "bn820-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)), done: !1 };
  body.className = "up820-m"; foot.className = "up820-foot";
  foot.innerHTML = '<button type="button" class="btn btn-o" data-close>ยกเลิก</button><button type="button" class="btn btn-o" id="up820-xl">EXPORT EXCEL รายการซ้ำ / ผิดพลาด</button><button type="button" class="btn btn-o" id="up820-dup">ดูรายการซ้ำ</button><button type="button" class="btn up820-ok" id="up820-ok" disabled>ยืนยันใช้ไฟล์ล่าสุด</button>';
  Q({ title: "UPLOAD EXCEL — ตรวจสอบก่อนบันทึก (รอรับชำระ)", body, footer: foot, fullscreen: !0, wide: !0 });
  body.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลกับระบบ…</div></div>';
  let q = (s) => body.querySelector(s) || foot.querySelector(s), ok = q("#up820-ok");
  let L = { NEW: "Billing Note ใหม่ (INVOICE ในระบบ)", IMP: "เพิ่มใหม่ (นำเข้า Excel)", SAME: "ข้อมูลซ้ำ ไม่เปลี่ยนแปลง", CHG: "ข้อมูลซ้ำ มีการเปลี่ยนแปลง", ERR: "ข้อมูลผิดพลาด" };
  let cnt = () => { let R = st.rows, c = (fn) => R.filter(fn).length; return { all: R.length, okk: c((r) => r.st !== "ERR"), nw: c((r) => r.st === "NEW"), imp: c((r) => r.st === "IMP"), dup: c((r) => r.dup && r.key), chg: c((r) => r.st === "CHG"), same: c((r) => r.st === "SAME"),
    sys: c((r) => r.key && !r.imp && r.st !== "ERR"), rv: c((r) => r.imp && r.st !== "ERR" && r.rv), err: c((r) => r.st === "ERR"), need: c((r) => r.need), cross: c((r) => r.cross), inF: c((r) => r.inFile), save: c((r) => r.st === "NEW" || r.st === "IMP" || r.st === "CHG") }; };
  let flt = (f) => st.rows.filter((r) => f === "ALL" || (f === "DUP" ? r.dup && r.key : f === "OK" ? r.st !== "ERR" : f === "SYS" ? r.key && !r.imp && r.st !== "ERR" : f === "REV" ? r.imp && r.st !== "ERR" && r.rv : r.st === f));
  let am = (r) => { let d = r.imp ? Object.assign({}, r.ex || {}, Object.fromEntries(Object.entries(r.d || {}).filter((z) => z[1] != null && z[1] !== ""))) : r.d || {}; return d; };
  let draw = () => {
    let C = cnt(), fl = flt(st.f), show = fl.slice(0, 300);
    body.innerHTML = `<div class="up820-files"><table class="tbl up820-t"><thead><tr><th>ลำดับรับ</th><th>ชื่อไฟล์</th><th>วันที่ / เวลาที่ระบบรับ</th><th>Sheet</th><th class="r">แถว INVOICE</th><th>คอลัมน์ที่นำเข้าได้ (หัว Excel → คอลัมน์รายงาน)</th><th>คอลัมน์ที่ข้าม</th><th>สถานะไฟล์</th></tr></thead><tbody>`
      + files.map((f) => { let pr = (st.ck ? st.ck.prior : []).filter((p) => p.file_hash && p.file_hash === f.hash), nd = st.rows.filter((r) => r.key && r.files.includes(f.seq) && r.dup).length;
          return `<tr><td class="center" data-l="ลำดับรับ">${f.seq}</td><td data-l="ชื่อไฟล์"><b>${i(f.name)}</b></td><td class="nowrap" data-l="เวลาที่ระบบรับ">${DT820(f.at)}</td><td data-l="Sheet">${i(f.sheet || "-")}</td><td class="r" data-l="แถว INVOICE">${f.rows.length.toLocaleString("th-TH")}${f.total ? ` <small>(ข้าม TOTAL ${f.total})</small>` : ""}</td>`
            + `<td data-l="คอลัมน์ที่นำเข้าได้"><small class="u823-ok">${i(f.used.join(" · ") || "-")}</small></td><td data-l="คอลัมน์ที่ข้าม"><small>${i(f.skipped.join(" · ") || "-")}</small></td>`
            + `<td data-l="สถานะไฟล์">${f.err ? `<span class="up820-e">${i(f.err)}</span>` : pr.length ? `<span class="up820-w">⚠️ เคยอัปโหลดแล้ว : ${pr.map((p) => i(p.file_name) + " · " + DT820(p.uploaded_at) + (p.uploaded_by_name ? " · " + i(p.uploaded_by_name) : "")).join(" / ")} · INVOICE ซ้ำ ${nd.toLocaleString("th-TH")}</span>` : nd ? `<span class="up820-w">INVOICE ซ้ำ ${nd.toLocaleString("th-TH")}</span>` : "ไฟล์ใหม่"}</td></tr>`; }).join("")
      + `</tbody></table></div>`
      + `<div class="up820-sum">${[["ALL", "รายการทั้งหมด", C.all], ["OK", "INVOICE ที่นำเข้าได้", C.okk], ["DUP", "INVOICE ซ้ำ", C.dup], ["IMP", "INVOICE เพิ่มใหม่", C.imp], ["SYS", "INVOICE ในระบบ (Billing Note)", C.sys], ["CHG", "ข้อมูลเปลี่ยน", C.chg], ["SAME", "ไม่เปลี่ยน", C.same], ["REV", "รอตรวจสอบ (ยอดไม่ครบ)", C.rv], ["ERR", "ผิดพลาด", C.err]]
          .map((z) => `<button type="button" class="up820-c${st.f === z[0] ? " on" : ""}${z[0] === "ERR" && z[2] ? " u823-bad" : ""}" data-f820="${z[0]}"><span>${z[1]}</span><b>${z[2].toLocaleString("th-TH")}</b></button>`).join("")}</div>`
      + `<div class="up820-note">ซ้ำข้ามไฟล์ ${C.cross.toLocaleString("th-TH")} · ซ้ำในไฟล์เดียวกัน ${C.inF.toLocaleString("th-TH")} · ยึดข้อมูลจากไฟล์ที่ระบบรับล่าสุด (ทีละช่อง · ช่องว่างไม่เขียนทับ) · INVOICE ที่มีในระบบ = อัปเดตเฉพาะ Billing Note no. · INVOICE ที่ไม่มีในระบบ = เพิ่มเป็นรายการนำเข้าจาก Excel ในแถบรอรับชำระ (ไม่สร้าง INVOICE / ไม่ออกเลข RECEIPT / ออกใบเสร็จไม่ได้) · ไม่นำเข้า Status / Name CS / Contact</div>`
      + (C.need ? `<div class="up820-e">มี ${C.need.toLocaleString("th-TH")} รายการที่ APL Billing ≠ CASE — กรุณาเลือกค่าที่ใช้ก่อนบันทึก (ตัวกรอง "ผิดพลาด")</div>` : "")
      + `<div class="tbl-wrap up820-w2"><table class="tbl up820-t up820-r"><thead><tr><th>#</th><th>Invoice No.</th><th>ไฟล์ (ลำดับ) · แถว</th><th>ลูกค้า</th><th class="r">Service</th><th class="r">Advance</th><th class="r">VAT 7%</th><th class="r">Amount</th><th class="r">WHT 3%</th><th class="r">Total Amount</th><th>APL Billing</th><th>CASE</th><th>Billing Note no. ใหม่</th><th>ค่าเดิม → ค่าใหม่</th><th>สถานะ</th></tr></thead><tbody>`
      + (show.length ? show.map((r, j) => { let d = am(r), mn = (k) => `<td class="r" data-l="${LB823(k)}">${d[k] == null || d[k] === "" ? "-" : FV823(k, d[k])}</td>`;
          return `<tr class="s820-${r.st}"><td class="center" data-l="#">${j + 1}</td><td class="nowrap" data-l="Invoice No."><b>${i(r.ino || r.inv || "-")}</b>${r.key ? `<div><small class="b823s ${r.imp ? "b823s-x" : "b823s-s"}">${r.imp ? "นำเข้า Excel" : "INVOICE ในระบบ"}</small></div>` : ""}</td>`
          + `<td data-l="ไฟล์ · แถว"><small>${i(r.file ? r.file.name : "-")} (${r.seq || "-"}) · แถว ${r.r || "-"}${r.cross ? " · พบในไฟล์ " + r.files.join(", ") : ""}${r.inFile ? " · ซ้ำในไฟล์" : ""}</small></td>`
          + `<td data-l="ลูกค้า">${i(r.imp ? d.customer_name || "-" : "(INVOICE ในระบบ)")}</td>` + (r.imp ? NUMK823.map(mn).join("") : `<td colspan="6" class="t-3 center" data-l="ยอด"><small>ยอดตาม INVOICE ในระบบ (ไม่เปลี่ยน)</small></td>`)
          + `<td data-l="APL Billing">${i(r.apl || "")}</td><td data-l="CASE">${i(r.cs || "")}</td>`
          + `<td data-l="ใหม่">${r.cf && !/หลาย INVOICE|ขัดแย้ง/.test(r.why) ? `<label class="up820-p"><input type="radio" name="p820-${i(r.key)}" data-p820="${i(r.key)}" value="apl"${st.pick.get(r.key) === "apl" ? " checked" : ""}> APL : ${i(r.apl)}</label><label class="up820-p"><input type="radio" name="p820-${i(r.key)}" data-p820="${i(r.key)}" value="cs"${st.pick.get(r.key) === "cs" ? " checked" : ""}> CASE : ${i(r.cs)}</label>` : `<b>${i(r.v || "")}</b>`}</td>`
          + `<td data-l="ค่าเดิม → ค่าใหม่">${r.diff.length ? r.diff.map((z) => `<div class="u823-df"><small>${i(LB823(z[0]))} :</small> <s>${i(FV823(z[0], z[1]))}</s> → <b>${i(FV823(z[0], z[2]))}</b></div>`).join("") : r.imp ? (r.ex ? '<small class="t-3">เหมือนเดิม</small>' : '<small class="t-3">-</small>') : `${i(r.cur == null ? "-" : r.cur)}${r.sys ? `<small class="t-3"> (BILLING : ${i(r.sys)})</small>` : ""}`}</td>`
          + `<td data-l="สถานะ"><span class="b820 b820-${r.st === "IMP" ? "NEW" : r.st}">${L[r.st]}</span><small class="t-3"> ${i(r.why || "")}</small>${r.imp && r.st !== "ERR" && r.rv ? `<div><span class="b823r">รอตรวจสอบ</span> <small>${i(r.rv)}</small></div>` : ""}${(r.warn || []).length ? `<div><small class="up820-w">${i(r.warn.join(" · "))}</small></div>` : ""}</td></tr>`; }).join("")
        : '<tr><td colspan="15" class="empty">ไม่มีรายการ</td></tr>') + `</tbody></table></div>`
      + (fl.length > show.length ? `<div class="up820-note">แสดง ${show.length.toLocaleString("th-TH")} จาก ${fl.length.toLocaleString("th-TH")} รายการ — ดูทั้งหมดได้จาก EXPORT EXCEL</div>` : "");
    body.querySelectorAll("[data-f820]").forEach((b) => { b.onclick = () => { st.f = b.dataset.f820; draw(); }; });
    body.querySelectorAll("[data-p820]").forEach((x) => { x.onchange = () => { st.pick.set(x.dataset.p820, x.value); recalc(); }; });
    ok.disabled = st.busy || st.done || !files.some((f) => !f.err);
  };
  let recalc = () => { st.rows = MG820(files.filter((f) => !f.err), st.ck.found, st.ck.prior, st.pick, st.ck.imported, st.ck.rx); draw(); };
  let load = async () => { try { st.ck = await CK820(files.filter((f) => !f.err)); recalc(); } catch (e) { body.innerHTML = `<div class="up820-e">${i(RE820(e))}</div>`; } };
  q("#up820-dup").onclick = () => { if (!st.ck) return; st.f = "DUP"; draw(); };
  q("#up820-xl").onclick = async (ev) => {
    let b = ev.currentTarget; if (b.disabled || !st.ck) return; b.disabled = !0;
    try { let rows = st.rows.filter((r) => (r.dup && r.key) || r.st === "ERR" || (r.imp && r.rv));
      let fn = await XW734("FINANCE_RECEIPT_UPLOAD_CHECK", [["Invoice No.", (r) => r.inv], ["แหล่งข้อมูล", (r) => (r.key ? (r.imp ? "นำเข้า Excel" : "INVOICE ในระบบ") : "")], ["ไฟล์", (r) => r.file && r.file.name], ["ลำดับไฟล์", (r) => r.seq, "int"], ["แถว", (r) => r.r, "int"],
        ["ลูกค้า", (r) => am(r).customer_name], ["Service charge", (r) => am(r).service_amount, "num"], ["Advance", (r) => am(r).advance_amount, "num"], ["VAT 7%", (r) => am(r).vat_amount, "num"], ["Amount", (r) => am(r).subtotal, "num"], ["WHT 3%", (r) => am(r).wht_amount, "num"], ["Total Amount", (r) => am(r).net_payable, "num"],
        ["APL Billing", (r) => r.apl], ["CASE", (r) => r.cs], ["Billing Note no. ใหม่", (r) => r.v], ["ค่าเดิม (Billing Note)", (r) => r.cur], ["Billing Note (BILLING จริง)", (r) => r.sys],
        ["ค่าเดิม → ค่าใหม่", (r) => (r.diff || []).map((z) => LB823(z[0]) + " : " + FV823(z[0], z[1]) + " → " + FV823(z[0], z[2])).join(" | ")], ["สถานะ", (r) => L[r.st]], ["รายละเอียด", (r) => r.why], ["รอตรวจสอบ", (r) => r.rv || ""],
        ["ซ้ำข้ามไฟล์", (r) => (r.cross ? "ใช่ (" + r.files.join(", ") + ")" : "")], ["ซ้ำในไฟล์", (r) => (r.inFile ? "ใช่" : "")]], rows);
      k("ส่งออก Excel " + rows.length.toLocaleString("th-TH") + " รายการแล้ว (" + fn + ")", "ok"); }
    catch (e) { k("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); } finally { b.disabled = !1; }
  };
  ok.onclick = async () => {
    if (st.busy || st.done || !st.ck) return; let C = cnt();
    if (C.need) { st.f = "ERR"; draw(); k("กรุณาเลือกค่า APL Billing / CASE ที่ไม่ตรงกันก่อนบันทึก (" + C.need + " รายการ)", "err"); return; }
    if (!C.save) { k("ไม่มีรายการที่ต้องบันทึก — ข้อมูลเหมือนเดิมทั้งหมด", "ok"); return; }
    let a = await AK820(files, C); if (a === "dup") { st.f = "DUP"; draw(); return; } if (a !== "ok") return;
    st.busy = !0; ok.disabled = !0; ok.textContent = "กำลังบันทึก…";
    try {
      let items = st.rows.filter((r) => !r.imp && (r.st === "NEW" || r.st === "CHG") && r.id && r.v).map((r) => ({ invoice_id: r.id, invoice_no: r.ino, value: r.v, old: r.cur, file_seq: r.seq }));
      let imports = st.rows.filter((r) => r.imp && (r.st === "IMP" || r.st === "CHG")).map((r) => Object.assign({ invoice_no: r.inv, ver: r.ex ? r.ex.ver : null, file_seq: r.seq, row_no: r.r, billing_note: r.v || null }, r.d));
      let fz = files.filter((f) => !f.err).map((f) => ({ seq: f.seq, name: f.name, hash: f.hash, size: f.size, sheet: f.sheet, received_at: f.at, columns_used: f.used, columns_skipped: f.skipped,
        stats: { rows: f.rows.length, total_rows_skipped: f.total, new: st.rows.filter((r) => r.seq === f.seq && r.st === "NEW").length, imported_new: st.rows.filter((r) => r.seq === f.seq && r.st === "IMP").length, changed: st.rows.filter((r) => r.seq === f.seq && r.st === "CHG").length,
                 unchanged: st.rows.filter((r) => r.seq === f.seq && r.st === "SAME").length, review: st.rows.filter((r) => r.seq === f.seq && r.imp && r.rv && r.st !== "ERR").length, errors: st.rows.filter((r) => r.seq === f.seq && r.st === "ERR").length } }));
      let r = await V("njacc_bn820_save", { p: { request_id: st.req, files: fz, items, imports } });
      if (imports.length && !(r && r.rx823) && !(r && r.idempotent)) throw new Error("ระบบฐานข้อมูลยังไม่พร้อมนำเข้า (ต้องรัน RUN-823) — รายการนำเข้าจาก Excel ยังไม่ได้บันทึก");
      let x = (r && r.rx823) || {}, n = (v) => Number(v || 0).toLocaleString("th-TH");
      st.done = !0; ok.textContent = "✅ บันทึกแล้ว";
      let msg = r && r.idempotent ? "บันทึกไว้แล้ว (คำขอเดิม)" : "Billing Note (INVOICE ในระบบ) อัปเดต " + n(r && r.updated) + " · นำเข้าใหม่ " + n(x.inserted) + " · อัปเดตรายการนำเข้า " + n(x.updated) + " · ไม่เปลี่ยน " + n(Number(r && r.unchanged || 0) + Number(x.unchanged || 0)) + (x.review ? " · รอตรวจสอบ " + n(x.review) : "");
      k("บันทึกลงฐานข้อมูลแล้ว — " + msg, "ok");
      for (let u of (r && r.uploads) || []) { let f = files.find((z) => z.seq === u.seq); if (!f || !f.raw || f.raw.size > 10e6) continue;   /* เก็บไฟล์ต้นทาง (หลังบันทึกสำเร็จ) */
        try { let b64 = await new Promise((res, rej) => { let fr = new FileReader(); fr.onload = () => res(String(fr.result).replace(/^data:[^,]*,/, "")); fr.onerror = rej; fr.readAsDataURL(f.raw); }); await V("njacc_bn820_file", { p_upload: u.id, p_b64: b64 }); }
        catch (e) { try { console.warn("BN820 file", e); } catch (z) {} } }
      body.insertAdjacentHTML("afterbegin", `<div class="up820-okb">✅ บันทึกลงฐานข้อมูลสำเร็จ — ${i(msg)} · บันทึกประวัติไฟล์ ${((r && r.uploads) || []).length} ไฟล์ · รายการแสดงในแถบรอรับชำระแล้ว</div>`);
      try { let g = t.querySelector("#rp-go"); g && g.click(); } catch (e) {}
    } catch (e) {
      ok.textContent = "ยืนยันใช้ไฟล์ล่าสุด"; k("บันทึกไม่สำเร็จ — " + RE820(e), "err");
      if (/NJACC_BN820_CHANGED/.test(String(e && e.message || e))) { st.req = "bn820-" + Date.now() + "-" + Math.random().toString(36).slice(2); await load(); body.insertAdjacentHTML("afterbegin", `<div class="up820-e">${i(RE820(e))}</div>`); }
    } finally { st.busy = !1; ok.disabled = st.done; }
  };
  await load();
}
function AK820(files, C) {   /* Popup ยืนยันก่อนบันทึก (ปิด / ยกเลิก = ไม่บันทึก) */
  return new Promise((res) => {
    ST820(); let w = document.createElement("div"); w.className = "ak820";
    let dup = C.dup > 0, n = (v) => v.toLocaleString("th-TH");
    w.innerHTML = `<div class="ak820-b" role="dialog" aria-modal="true"><div class="ak820-h">${dup ? "⚠️ ตรวจพบข้อมูลซ้ำในการอัปโหลด Excel" : "ยืนยันบันทึกข้อมูลจาก Excel"}</div>`
      + `<div class="ak820-t">ไฟล์ : ${files.filter((f) => !f.err).map((f) => `<b>${i(f.name)}</b> <small>(ลำดับ ${f.seq} · ${DT820(f.at)})</small>`).join(", ")}<ul>`
      + `<li>รายการทั้งหมด : <b>${n(C.all)}</b> INVOICE · นำเข้าได้ <b>${n(C.okk)}</b></li><li>INVOICE ซ้ำ : <b>${n(C.dup)}</b></li><li>INVOICE เพิ่มใหม่ (นำเข้า Excel) : <b>${n(C.imp)}</b> · Billing Note ใหม่ (INVOICE ในระบบ) : <b>${n(C.nw)}</b></li>`
      + `<li>ข้อมูลเปลี่ยนแปลง : <b>${n(C.chg)}</b> · ไม่เปลี่ยน : ${n(C.same)}</li>${C.rv ? `<li>รอตรวจสอบ (ยอดไม่ครบ / ไม่สอดคล้อง) : <b>${n(C.rv)}</b> — บันทึกได้ แต่ออกใบเสร็จไม่ได้</li>` : ""}<li>ผิดพลาด : ${n(C.err)} (ไม่บันทึก)</li></ul>`
      + `<b>ระบบจะใช้ข้อมูลจากไฟล์ที่อัปโหลดล่าสุดแทนข้อมูลเดิม เฉพาะคอลัมน์ที่หน้ารายงานรองรับ (ช่องว่างไม่เขียนทับ) · INVOICE ในระบบ = เฉพาะ Billing Note no.</b></div>`
      + `<div class="ak820-f"><button type="button" class="btn btn-o" data-a820="no">ยกเลิก</button><button type="button" class="btn btn-o" data-a820="dup">ดูรายการซ้ำ</button><button type="button" class="btn up820-ok" data-a820="ok">ยืนยันใช้ไฟล์ล่าสุด</button></div></div>`;
    document.body.appendChild(w);
    let done = (v) => { document.removeEventListener("keydown", key, !0); w.remove(); res(v); };
    let key = (ev) => { ev.key === "Escape" && (ev.preventDefault(), ev.stopPropagation(), done("no")); };
    document.addEventListener("keydown", key, !0);
    w.querySelectorAll("[data-a820]").forEach((b) => { b.onclick = () => done(b.dataset.a820); });
  });
}
function BG823(o) {   /* หน้ารายงาน : ป้ายรายการนำเข้าจาก Excel (คอลัมน์เลขที่งาน) */
  ST823();
  return `<span class="b823" title="นำเข้าจาก UPLOAD EXCEL — ไม่ใช่ INVOICE ใน ACCOUNTING (ออกใบเสร็จไม่ได้)">EXCEL</span>${o.rx823_reason ? `<span class="b823r" title="${i(o.rx823_reason)}">รอตรวจสอบ</span>` : ""}`;
}
function ST823() {
  try {
    if (document.getElementById("st823-css")) return;
    let s = document.createElement("style"); s.id = "st823-css";
    s.textContent = ".b823{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:800;background:#ede9fe;color:#5b21b6;letter-spacing:.3px}"
      + ".b823r{display:inline-block;margin-left:4px;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:800;background:#fef3c7;color:#92400e}"
      + ".b823s{display:inline-block;padding:0 6px;border-radius:6px;font-weight:700}.b823s-x{background:#ede9fe;color:#5b21b6}.b823s-s{background:#e0f2fe;color:#075985}"
      + ".u823-df{white-space:nowrap}.u823-df s{color:#94a3b8}.u823-ok{color:#166534!important}.up820-c.u823-bad b{color:#b91c1c}";
    document.head.appendChild(s);
  } catch (e) {}
}
function ST820() {
  try {
    if (document.getElementById("st820-css")) return;
    let s = document.createElement("style"); s.id = "st820-css";
    s.textContent = [
      ".btn.up820,.btn.up820-ok{background:#f97316!important;border:1px solid #f97316!important;color:#fff!important;font-weight:700}.btn.up820:hover,.btn.up820-ok:hover{background:#ea580c!important;border-color:#ea580c!important}.btn.up820-ok:disabled{opacity:.6}",
      ".up820-m{display:flex;flex-direction:column;gap:10px}.up820-files{overflow-x:auto}.up820-t td,.up820-t th{vertical-align:top}.up820-t small{color:#475569}",
      ".up820-sum{display:flex;flex-wrap:wrap;gap:8px}.up820-c{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:118px;padding:8px 12px;border:1px solid #dbe4f0;border-radius:10px;background:#fff;cursor:pointer;text-align:left}",
      ".up820-c span{font-size:12px;color:#64748b}.up820-c b{font-size:18px;color:#0f2a4d}.up820-c.on{border-color:#f97316;box-shadow:0 0 0 2px rgba(249,115,22,.25)}",
      ".up820-note{font-size:12.5px;color:#475569}.up820-e{padding:8px 12px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;border-radius:8px;font-weight:600}.up820-w{color:#b45309;font-weight:700}",
      ".up820-okb{padding:10px 12px;border:1px solid #bbf7d0;background:#f0fdf4;color:#15803d;border-radius:8px;font-weight:700}.up820-w2{max-height:58vh;overflow:auto}",
      ".b820{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}.b820-NEW{background:#dcfce7;color:#166534}.b820-SAME{background:#e2e8f0;color:#334155}.b820-CHG{background:#ffedd5;color:#9a3412}.b820-NF{background:#f1f5f9;color:#64748b}.b820-ERR{background:#fee2e2;color:#b91c1c}",
      ".up820-p{display:block;white-space:nowrap;font-size:12.5px}.up820-foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;width:100%}",
      ".ak820{position:fixed;inset:0;z-index:3300;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".ak820-b{background:#fff;border-radius:12px;max-width:600px;width:100%;max-height:90vh;overflow:auto;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:14px;line-height:1.55;color:#0f172a}",
      ".ak820-h{font-size:16px;font-weight:800;color:#b45309;margin-bottom:8px}.ak820-t ul{margin:6px 0 8px 18px;padding:0}.ak820-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}",
      "@media (max-width:640px){.up820-t thead{display:none}.up820-t,.up820-t tbody{display:block;width:100%}.up820-t tr{display:block;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 8px;padding:4px 8px}",
      ".up820-t td{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;border:0!important;padding:4px 0!important;text-align:right;white-space:normal!important;height:auto!important;max-height:none!important;line-height:1.4!important;overflow:visible!important}.up820-t td>*{flex:1 1 60%;min-width:0;overflow-wrap:anywhere;text-align:right}.up820-t td>label{flex:1 1 100%}.up820-t td::before{content:attr(data-l);color:#64748b;font-size:12px;font-weight:600;text-align:left;flex:none}",
      ".up820-c{min-width:0;flex:1 1 30%}.up820-foot .btn{flex:1 1 45%}.ak820-f .btn{flex:1 1 100%}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}
