import{a as XLS820}from"./chunk-FHYZBT2Q.js";import{css762 as CS762,dd762 as DD762,sel762 as SL762,field762 as FD762,txt762 as TX762,chips762 as CH762}from"./ui-dd762.js";import{c as at,d as ot,e as rt}from"./chunk-J26HUKJ4.js";import"./chunk-IIDKIKVM.js";import{a as ct,b as F}from"./chunk-IOEZHYTZ.js";import{a as j,e as z}from"./chunk-ETXG4BWC.js";import{a as B}from"./chunk-6REVCVGI.js";import{k as it}from"./chunk-JXQJ6337.js";import{a as nt}from"./chunk-OWSY2KDQ.js";import{k as tt,v as st}from"./chunk-L5Z2NDJ3.js";import{j as E,k as X,f as MA660}from"./chunk-2B2FLIKC.js";import"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import"./chunk-Q7FMECGI.js";import{a as x}from"./chunk-UWAYW6DC.js";import{a as P,b as q,e as U,f as H}from"./chunk-OPGKUGLK.js";import{a as R}from"./chunk-YM5GFE6V.js";import{a as L}from"./chunk-GDT6F23K.js";import{a as k}from"./chunk-OFOOXWUM.js";import{b as XLJ734}from"./chunk-FHYZBT2Q.js";import{a as Q,d as Y,e as Z}from"./chunk-LNP7HEMP.js";import{a as u,c as N,e as i}from"./chunk-NQOCXXA2.js";import{G as et0}from"./chunk-6NADHKLT.js";import{m as V}from"./chunk-SGWIBJH6.js";var dt=t=>V("njacc_list_receipts",t),lt=(t,e,r)=>V("njacc_void_receipt",{p_id:t,p_reason:e,p_request_id:r});var T=(t,e="-")=>{let r=t==null?"":String(t).trim();return i(r||e)},v=t=>{let e=Number(t);return Number.isFinite(e)?e:0},f=t=>Math.round((v(t)+Number.EPSILON)*100)/100,ut={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',rc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'},w=t=>`<span class="rcd-ic">${ut[t]||""}</span>`;function bt(t){let e=[],r=[];for(let s of t||[])String(s.charge_type||"SERVICE").toUpperCase()==="ADVANCE"?r.push(s):e.push(s);return{shown:e,excluded:r}}function pt(t){let e=v(t.total_amount);if(e<=0||t.subtotal===void 0||t.subtotal===null)return null;let r=f(e-v(t.wht_amount));return r<=0?null:{ratio:v(t.amount)/r,net:r}}function ht(t){let e=0,r=0,s=0,d=0,o=0,h=!1,m=new Set,c=new Map;for(let a of t){let S=v(a.amount);e=f(e+S);let _=pt(a);if(!_)continue;h=!0,o=f(o+v(a.total_amount)*_.ratio),r=f(r+v(a.subtotal)*_.ratio),s=f(s+v(a.vat_amount)*_.ratio);let O=f(v(a.wht_amount)*_.ratio);d=f(d+O),v(a.vat_rate)>0&&m.add(v(a.vat_rate));let D=Array.isArray(a.wht_breakdown)?a.wht_breakdown:null;if(D&&D.length)for(let C of D){let W=f(v(C.amount)*_.ratio);if(W===0)continue;let K=C.rate===null||C.rate===void 0||C.rate===""?null:v(C.rate);c.set(K,f((c.get(K)||0)+W))}else if(O!==0){let C=a.wht_rate===null||a.wht_rate===void 0||a.wht_rate===""?null:v(a.wht_rate);c.set(C,f((c.get(C)||0)+O))}}let n=m.size===1?[...m][0]:m.size===0?0:null,p=[...c.keys()],y=p.length===1&&p[0]!==null?p[0]:null;return{total:e,sub:r,vat:s,wht:d,hasTax:h,vatRate:n,whtRate:y,whtBy:c,grossTotal:h?o:e,received:e}}function mt(t){let{shown:e,excluded:r}=bt(t.invoices),s=ht(e),d=String(t.status||"").toUpperCase()==="VOID",o=e.length===0?"-":e.length===1?i(e[0].invoice_no||"-"):"Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",h=e.map((a,S)=>`<tr>
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
    </div>${SW837(t)}
    <div id="rc-pending" ${I==="pending"?"":"hidden"}>
      ${A()?`<div id="rp-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>`:'<div id="rp-kpi" hidden style="display:none"></div>'}
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
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button><button type="button" class="btn btn-o btn-sm clr797" id="rc-clr797" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button>${XB734("rc-xl811")}${XB857()}</div>
    <div id="rc-sum811" class="sum811"></div><div class="card mt-2" id="rc-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      ${MQ849() ? RH811 : RH849}
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    </div>
    </div>`,ct(t);let e=t.querySelector(".ch-tools");e&&ot(e);(()=>{if(!document.getElementById("rc502-css")){let s=document.createElement("style");s.id="rc502-css";s.textContent=".rc502-hide{display:none!important}.rep-tabs.rc502-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.rep-tabs.rc502-tabs>#rc-new{margin-left:auto}.rc502 [data-colmg]{display:none!important}";document.head.appendChild(s)}let ph=t.querySelector(".page-head"),tb=t.querySelector(".rep-tabs"),nb=t.querySelector("#rc-new");e&&e.classList.add("rc502-hide");ph&&ph.classList.add("rc502-hide");tb&&(tb.classList.add("rc502-tabs"),nb&&tb.appendChild(nb));t.querySelectorAll("#rc-pending,#rc-issued").forEach(x=>x.classList.add("rc502"))})();let r={...g,scope:null,mode:"receipt",importMode:"accounting",filters:{},refresh:()=>{I==="pending"?M(t):o()}};t.dataset.chPage="finance-receipt",NK586(t,()=>t.dataset.chPage==="finance-receipt",()=>r.refresh()),t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=c=>{if(t.dataset.chPage!=="finance-receipt")return;let n=c.target.closest("[data-tool]");n&&rt(n.dataset.tool,r)},t.addEventListener("click",t.__njToolClick),t.querySelector(".rep-tabs").addEventListener("click",c=>{let n=c.target.closest("[data-rtab]");!n||n.dataset.rtab===I||(I=n.dataset.rtab,SEL795.clear(),BAD795.clear(),gt(t))});let s=t.querySelector('[data-pf="q"]');s&&(t.querySelector("#rp-go").onclick=()=>{$.q=s.value.trim(),FR678(t,"pf",$),$.page=1,M(t)},XR734(t),UPB820(t),FK678(t.querySelector("#rc-pending .fbar"),"#rp-go")),I==="pending"&&M(t);RT830(t,()=>M(t),()=>I)/* V.826 */;let d=t.querySelector("#rc-new");d&&d.remove();t.__ld811=()=>o();/* V.837 */async function o(){let c=P("receipts");try{let n=await L835({company_group:"NJ",q:b.q||null,customer_id:b.customer||null,from:b.from||null,to:b.to||null,page:b.page,size:b.size,...FP678(b)})/* V.830 */;if(!q("receipts",c))return;BV800(t);let p=t.querySelector("#rc-tbody"),y=n.rows||[];SM811(t,n),p.innerHTML=y.length?y.map((o849,i849)=>RI811(o849,i849,(b.page-1)*b.size)).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>',B(t.querySelector("#rc-pgn"),{page:b.page,size:b.size,total:n.total||0},({page:l,size:a})=>{b.page=l,b.size=a,o()},{lp:!0}),F(),t.__njCols&&t.__njCols.issued()}catch(n){if(!q("receipts",c))return;R(n);let p=t.querySelector("#rc-tbody");p&&p.querySelector(".spin")&&(p.innerHTML='<tr><td colspan="21" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',p.querySelector("[data-ld-retry]").onclick=()=>{p.innerHTML='<tr><td colspan="21" class="load-row"><div class="spin"></div></td></tr>',o()})}}RC762(t)/* V.762 */,AP797(t),OP797(t)/* V.797 */,LS801(t)/* V.801 */,RB811(t),XR811(t)/* V.811 */,XR857(t)/* V.858 */,FK678(t.querySelector("#rc-issued .fbar"),"#rc-go"),t.querySelector("#rc-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(c=>b[c.dataset.f]=c.value),b.page=1,o()};function h(){let c=t.querySelector("#rp-tbody");z({table:c&&c.closest("table"),modeKey:"FINANCE_RECEIPT_PENDING",host:t.querySelector("#rc-pending .fbar")})}function m(){let c=t.querySelector("#rc-tbody");z({table:c&&c.closest("table"),modeKey:MQ849()?"FINANCE_RECEIPT_ISSUED811":"FINANCE_RECEIPT_ISSUED849"/* V.849 */,host:t.querySelector("#rc-issued .fbar")})}RA795(t,()=>(M(t),OP797(t,!0))),t.__njCols={pending:h,issued:m},h(),m(),t.querySelector("#rc-tbody").addEventListener("click",async c=>{let n=c.target.closest("[data-print]");if(n){G(JSON.parse(n.dataset.print));return}let p=c.target.closest("[data-void]");if(p){let y=await Z("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 "+p.dataset.no+" (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");if(!y)return;try{await U("void-rc-"+p.dataset.void,()=>lt(p.dataset.void,y,H())),k("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48","ok"),o()}catch(l){R(l)}}}),o()}async function M(t){let e=t.querySelector("#rp-tbody");if(!e)return;J=t;let r=P("rc-pending");try{let s=await et({company_group:"NJ",q:$.q||null,customer_id:$.customer||null,page:$.page,size:$.size,...FP678($)});if(!q("rc-pending",r))return;KP530(t,s);RA795(t,()=>(M(t),OP797(t,!0)));let d=s&&s.rows||[];BV800(t),e.innerHTML=d.map(o=>`<tr data-inv="${i(o.invoice_id)}" data-job800="${i(o.job_id||"")}">
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
  '<th>INVOICE NJ</th><th>DATE</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 INVOICE</th><th>Customer Job No.</th>' +   /* V.828 : Checkbox → INVOICE NJ → DATE → ลูกค้า → บริษัท INVOICE → คอลัมน์อื่นตามเดิม · ซ่อนเลขที่งาน (แสดงผลเท่านั้น) */
  '<th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th><th>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</th><th>House B/L No.</th><th>Master B/L No.</th>' +
  '<th class="r">Service charge</th><th class="r">Advance</th><th class="r">VAT 7%</th><th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross \u2212 WHT">Total Amount</th><th>\u0E0A\u0E37\u0E48\u0E2D USER</th><th>Billing Note no.</th><th class="nowrap">Case\u200B</th>';   /* V.826 (RUN-830) : + Case ต่อจาก Billing Note no. */   /* V.678 : ไม่แสดง Due Date / คงค้าง (FINANCE — RECEIPT) */
function RE522(v, w) {
  return `<td class="ellip" style="max-width:${w}px" title="${i(v || "")}">${i(v || "-")}</td>`;
}
/* ═══ V.826 (RUN-830) FINANCE → RECEIPT (รอรับชำระ) : คอลัมน์ "Case" ต่อจาก "Billing Note no."
   ค่า = case_no จาก njacc_receipt_pending (njacc_jobs.case_no ของ job_id ของแถว — MAERSK → Bulk Case บันทึกค่านี้) · ไม่มี JOB / ไม่มีค่า = "-"
   หน้าเปิดอยู่ : Realtime njacc:jobs (job_changed · กลไกเดิมของระบบ) → JOB ในหน้าที่แสดงเปลี่ยน = โหลดรายการเดิมใหม่ (คงหน้า / ตัวกรอง / รายการที่เลือก) · แท็บซ่อน = โหลดเมื่อกลับมา
   ไม่เปลี่ยน EXPORT EXCEL / PDF / ใบเสร็จ / ยอดเงิน · ชื่อใน Layout = "Case" + U+200B (เหมือน ACCOUNTING V.825 · Layout ที่บันทึกไว้แทรกต่อจาก Billing Note no.) ═══ */
function CS830(o) { let c = o && o.case_no != null ? String(o.case_no).trim() : ""; return `<td class="nowrap" data-l="Case">${c ? i(c) : "-"}</td>`; }
function RT830(t, reload, tab) {
  if (!t || t.__rt830) return; t.__rt830 = 1; let tm = null, pend = !1;
  let off = () => { window.removeEventListener("njacc:jobs-changed", on); document.removeEventListener("visibilitychange", vis); };
  let go = () => { tm = null; if (!t.isConnected) { off(); return; } if (tab() !== "pending") return; if (document.hidden) { pend = !0; return; } try { reload(); } catch (e) {} };
  let on = (ev) => {
    if (!t.isConnected) { off(); return; }
    let ids = (ev && ev.detail && Array.isArray(ev.detail.ids) && ev.detail.ids.length) ? ev.detail.ids.map(String) : ["*"];
    if (!ids.includes("*")) { let have = new Set([...t.querySelectorAll("#rp-tbody tr[data-job800]")].map((r) => r.dataset.job800).filter(Boolean)); if (!ids.some((x) => have.has(x))) return; }
    tm || (tm = setTimeout(go, 1500));
  };
  let vis = () => { if (!document.hidden && pend) { pend = !1; go(); } };
  window.addEventListener("njacc:jobs-changed", on); document.addEventListener("visibilitychange", vis);
}
function RR522(o) {
  let net = o.net_payable != null ? o.net_payable : Number(o.total_amount) - Number(o.wht_amount);
  return (
    `<td class="nowrap col-inv">${o.invoice_no ? `<span class="t-b">${i(o.invoice_no)}</span>` : '<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>'}${o.source_invoice_no ? `<div class="inv-src" title="\u0E40\u0E25\u0E02 Invoice \u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21/\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07">SRC: ${i(o.source_invoice_no)}</div>` : ""}${o.src823 ? `<div>${BG823(o)}</div>` : ""}</td>` +   /* V.828 : INVOICE NJ (ป้าย EXCEL / รอตรวจสอบ ย้ายจากคอลัมน์เลขที่งาน) */
    `<td class="nowrap">${o.invoice_date ? N(o.invoice_date) : ""}</td>` +   /* V.828 : DATE = วันที่ INVOICE NJ (INVOICE ในระบบ = invoice_date · นำเข้า Excel = คอลัมน์ Date) · ไม่มี = ว่าง */
    RE522(o.customer_name, 180) + RE522(o.company_invoice, 130) + RE522(o.customer_job_no, 120) +
    RE522(o.customs_declaration_no, 130) + RE522(o.source_invoice_no, 120) + RE522(o.house_bl_no, 130) + RE522(o.master_bl_no, 130) +
    `<td class="r">${u(o.service_amount)}</td><td class="r">${u(o.advance_amount)}</td><td class="r">${u(o.vat_amount)}</td>` +
    `<td class="r">${u(o.subtotal)}</td><td class="r">${u(o.wht_amount)}</td>` +
    `<td class="r t-b" title="Gross ${u(o.total_amount)} \u2212 WHT ${u(o.wht_amount)}">${u(net)}</td>` +
    `<td class="nowrap" title="\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19">${i((o.created_by_nickname&&String(o.created_by_nickname).trim())||KN522(o.created_by_name))}</td>` +
    (o.billing_note_no ? `<td class="nowrap t-b">${i(o.billing_note_no)}</td>` : '<td class="nowrap">-</td>') +
    CS830(o) +   /* V.826 (RUN-830) : Case */
    ""   /* V.678 : Due Date / คงค้าง ไม่แสดง */
  );
}


/* ═══ V.678 FINANCE — RECEIPT / ADVANCE : หน้ารายงาน (อ่านอย่างเดียว · UNPOST เท่านั้น) + ช่องค้นหา ลูกค้า / บริษัท / INVOICE NO. / Customer Job No. ═══ */
var FL678 = [["f678_customer", "ลูกค้า"], ["f678_company", "บริษัท"], ["f678_invoice", "INVOICE NO."], ["f678_cjob", "Customer Job No."]];
function FI678(st, at) { ST678(); return FL678.map(([k, l]) => (k === "f678_customer" || k === "f678_company") ? SE797(st, at, k) /* V.797 */ : `<input class="inp inp678" data-${at}="${k}" value="${i((st && st[k]) || "")}" placeholder="${l}" title="ค้นหา ${l} (บางส่วนของข้อความได้)">`).join(""); }
function FR678(t, at, st) { t.querySelectorAll(`[data-${at}^="f678_"]`).forEach((x) => { st[x.getAttribute("data-" + at)] = x.value.trim(); }); }
function FP678(st) { let o = {}; FL678.forEach(([k]) => { let v = String((st && st[k]) || "").trim(); if (!v) return; if (k === "f678_customer" || k === "f678_company") { if (v.slice(0, 2) === "n:") { o[k === "f678_customer" ? "f833_customer_names" : "f833_company_names"] = [v.slice(2)]; return; } let a = v.split(",").map((x) => x.trim()).filter(Boolean); a.length && (o[k === "f678_customer" ? "f797_customer_ids" : "f797_company_ids"] = a); } else o[k] = v; }); return o; }   /* V.797 : Dropdown = id ตรงตัว · V.829 (RUN-833) : "n:" = ชื่อตรงตัว (INVOICE ในระบบ + รายการ UPLOAD EXCEL) */
function FK678(bar, go) { bar && bar.addEventListener("keydown", (e) => { if (e.key !== "Enter" || !e.target.classList.contains("inp678")) return; e.preventDefault(); let b = bar.querySelector(go); b && b.click(); }); }
function ST678() { try { if (document.getElementById("st678-css")) return; let s = document.createElement("style"); s.id = "st678-css";
  s.textContent = ".fbar .inp678{width:150px;min-width:120px;flex:0 1 150px}.rc502 tbody tr,.rc502 tbody td{cursor:default!important}.btn.un678{background:#DC2626!important;color:#fff!important;border-color:#DC2626!important;font-weight:700}.btn.un678:hover:not(:disabled){background:#B91C1C!important;border-color:#B91C1C!important}"; document.head.appendChild(s); } catch (e) {} }
var KP530=(t,s)=>{let g=t.querySelector("#rp-kpi");if(!g)return;if(!A()||!(s&&s.kpi)){g.innerHTML="";g.hidden=!0;g.style.display="none";return}g.hidden=!1;g.style.display="";/* V.819 (RUN-824) : การ์ดสรุปยอดเฉพาะ SUPER_ADMIN · Server ส่ง kpi เฉพาะ SUPER_ADMIN */let k=s&&s.kpi||{},c=x=>(Number(x)||0).toLocaleString("th-TH"),m=x=>u(Number(x)||0);g.innerHTML='<div class="kpi-row">'+[["Total Job",c(k.total_job),"var(--blue-600)",""],["Total Over Due",c(k.total_overdue),"var(--red-600)","INVOICE \u0E17\u0E35\u0E48\u0E40\u0E25\u0E22\u0E27\u0E31\u0E19\u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E0A\u0E33\u0E23\u0E30 (Due Date) \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E21\u0E35\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07"],["Service Charge",m(k.service_charge),"var(--acc-service)",""],["Advance Charge",m(k.advance_charge),"var(--acc-advance)",""],["VAT",m(k.vat),"var(--purple-600)",""],["Total Amount",m(k.total_amount),"var(--green-600)","Total Amount = \u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E2B\u0E25\u0E31\u0E07\u0E2B\u0E31\u0E01 WHT (Net Payable) \u0E02\u0E2D\u0E07 INVOICE \u0E17\u0E35\u0E48\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30"]].map(([l,v,cc,ti])=>`<div class="kpi" style="--kpi-c:${cc}" title="${ti}"><div class="lb">${l}</div><div class="v">${v}</div></div>`).join("")+"</div>"};
/* ═══ V.803 · RESET SEARCH เมื่อสลับโหมด (FINANCE — RECEIPT) : เข้าจากโหมดอื่น = ค่าค้นหา / Dropdown / วันที่ ทุกช่องของทั้ง 2 แถบ = ค่าเริ่มต้น + หน้า 1 (ไม่แตะจำนวนต่อหน้า / แถบ / รายการที่เลือก) · สลับแถบในหน้าเดิม = gt() เดิม ไม่ล้าง ═══ */
function RN803(t) { try { if (L.rs803) [$, b].forEach((st) => Object.keys(st).forEach((k) => { k !== "size" && (st[k] = k === "page" ? 1 : ""); })); } catch (e) {} return gt(t); }
export{RN803 as render};
/* ═══ V.844 (RUN-844) · เลือกเอกสาร SERVICE / ADVANCE / ทั้งคู่ + ออก ADVANCE ที่ค้างจากใบ RCP เดิม ═══ */
function MD844(docs, m) { let a = (docs || []).some((d) => d.kind === "ADV"), s = (docs || []).some((d) => d.kind !== "ADV"); return a && s && (m === "S" || m === "A") ? m : "B"; }
function FD844(docs, m) { return m === "S" ? docs.filter((d) => d.kind !== "ADV") : m === "A" ? docs.filter((d) => d.kind === "ADV") : docs; }
function ST844() {
  if (document.getElementById("st844-css")) return;
  let s = document.createElement("style"); s.id = "st844-css";
  s.textContent = ".sw844{display:inline-flex;gap:0;margin-left:12px;border:1px solid #fff;border-radius:6px;overflow:hidden;vertical-align:middle}.sw844 button{border:0;background:transparent;color:#fff;font-size:12px;font-weight:700;padding:5px 10px;cursor:pointer}"
    + ".sw844 button.on{background:#fff;color:#12305f}.ch844{position:fixed;z-index:3400;background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25);padding:4px;display:grid;gap:2px;min-width:170px}"
    + ".ch844 button{border:0;background:#fff;text-align:left;padding:8px 10px;border-radius:6px;font-size:13px;font-weight:600;color:#0f172a;cursor:pointer}.ch844 button:hover{background:#eff6ff}"
    + ".btn.ia844{display:block;margin-top:4px;background:#ea580c!important;border:1px solid #ea580c!important;color:#fff!important;font-weight:700;font-size:12px;height:28px;padding:0 10px;border-radius:6px}"
    + ".ia844-t td,.ia844-t th{font-size:12.5px}.ia844-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 10px}.ia844-k>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px}"
    + ".ia844-k span{display:block;font-size:11.5px;color:#64748b;font-weight:600}.ia844-k b{font-size:14px;color:#0f172a}@media (max-width:640px){.btn.ia844{display:none!important}.ia844-k{grid-template-columns:1fr 1fr}}";
  document.head.appendChild(s);
}
function SW844(all, md, go) {   /* แถบเลือกเอกสารในหน้า PREVIEW (เฉพาะเมื่อมีทั้ง SERVICE และ ADVANCE) */
  let w = document.getElementById("pv813"); if (!w || !(all.some((d) => d.kind === "ADV") && all.some((d) => d.kind !== "ADV"))) return; ST844();
  let t = w.querySelector(".pv813-t"); if (!t) return;
  let b = document.createElement("span"); b.className = "sw844"; b.setAttribute("role", "group"); b.setAttribute("aria-label", "เลือกเอกสาร");
  b.innerHTML = [["B", "SERVICE + ADVANCE"], ["S", "เฉพาะ SERVICE"], ["A", "เฉพาะ ADVANCE"]].map(([v, l]) => `<button type="button" data-m844="${v}" class="${v === md ? "on" : ""}">${l}</button>`).join("");
  b.onclick = (ev) => { let x8 = ev.target.closest && ev.target.closest("[data-m844]"); x8 && x8.dataset.m844 !== md && go(x8.dataset.m844); };
  t.appendChild(b);
}
function CH844(b, key, fn) {   /* ปุ่ม PRINT / SAVE PDF ในแถว : มีทั้ง RCP + ADV = เลือกก่อน */
  let ps = String(key || "").split(",").filter(Boolean), A8 = ps.filter((z) => /^x?adv:/.test(z)), S8 = ps.filter((z) => !/^x?adv:/.test(z));
  if (!A8.length || !S8.length) { fn(key); return; }
  ST844(); let old = document.querySelector(".ch844"); old && old.remove();
  let m = document.createElement("div"); m.className = "ch844"; m.setAttribute("role", "menu");
  m.innerHTML = '<button type="button" data-c844="B">SERVICE + ADVANCE</button><button type="button" data-c844="S">เฉพาะ SERVICE</button><button type="button" data-c844="A">เฉพาะ ADVANCE</button>';
  document.body.appendChild(m); let r = b.getBoundingClientRect(); m.style.top = Math.min(window.innerHeight - 130, r.bottom + 4) + "px"; m.style.left = Math.max(8, Math.min(window.innerWidth - 190, r.left)) + "px";
  let close = () => { m.remove(); document.removeEventListener("mousedown", out, !0); document.removeEventListener("keydown", esc, !0); };
  let out = (ev) => { m.contains(ev.target) || close(); }, esc = (ev) => { ev.key === "Escape" && close(); };
  setTimeout(() => { document.addEventListener("mousedown", out, !0); document.addEventListener("keydown", esc, !0); }, 0);
  m.onclick = (ev) => { let c = ev.target.closest && ev.target.closest("[data-c844]"); if (!c) return; let v = c.dataset.c844; close(); fn(v === "S" ? S8.join(",") : v === "A" ? A8.join(",") : key); };
}
async function IA844(t, rid) {   /* ออก ADVANCE ที่ค้างของใบ RCP เดิม (ระบบเก่า) — ยืนยันครั้งเดียว = ADV ต่อลูกค้า 1 ใบ · ไม่ออก SERVICE ซ้ำ · Server ตรวจ / ล็อก / กันซ้ำ */
  ST844(); ST814();
  let st = { h: null, pv: null, busy: !1, req: RQ795(), done: null };
  let body = document.createElement("div"); body.className = "rcp795-m";
  body.innerHTML = `<div id="ia844-form"><div class="rcp795-f"><label>วันที่ใบรับเงินสำรองจ่าย <span class="req">*</span><input type="date" class="inp" id="ia844-date" value="${TD795()}" min="2026-11-01"></label>`
    + `<label>วิธีรับชำระ <span class="req">*</span><select class="sel" id="ia844-method">${PM795.map((p) => `<option value="${p[0]}">${i(p[1])} (${i(p[2])})</option>`).join("")}</select></label></div>`
    + `<div id="ia844-sum" class="rcp795-sum"><div class="load-row"><div class="spin"></div></div></div></div><div id="ia844-doc" hidden></div>`;
  let foot = document.createElement("div"); foot.className = "rcp795-foot";
  foot.innerHTML = '<button class="btn btn-o" data-close>ยกเลิก</button><button class="btn btn-o" id="ia844-pv" disabled>👁 PREVIEW ADVANCE</button><button class="btn btn-p" id="ia844-ok" disabled>✅ ยืนยันออก ADVANCE</button>';
  Q({ title: "ออก ADVANCE ที่ค้าง — ใบรับเงินสำรองจ่าย (ADV)", body, footer: foot, fullscreen: !0, wide: !0 });
  let q = (s) => body.querySelector(s) || foot.querySelector(s), sum = q("#ia844-sum"), pf = q("#ia844-form"), pd = q("#ia844-doc");
  let back = () => { pd.hidden = !0; pd.innerHTML = ""; pf.hidden = !1; };
  let showDocs = async (docs, o) => { pf.hidden = !0; pd.hidden = !1; pd.innerHTML = '<div class="load-row"><div class="spin"></div></div>'; await RW795(docs, Object.assign({ back }, o), pd); };
  let G = () => (st.pv && st.pv.groups || []).filter((g) => g.adv), bad = () => G().some((g) => g.customer_status && g.customer_status !== "OK");
  let nI = () => G().reduce((s, g) => s + Number(g.adv.count || 0), 0), tot = () => G().reduce((s, g) => s + C795(g.adv.total), 0) / 100;
  let sync = () => { let ok = !!st.pv && G().length > 0 && !st.busy && !st.done; q("#ia844-pv").disabled = !ok; q("#ia844-ok").disabled = !ok || bad() || !q("#ia844-date").value || !q("#ia844-method").value; };
  let draw = () => {
    let h = st.h, er = (st.pv && st.pv.errors) || [], gs = G();
    sum.innerHTML = `<div class="ia844-k"><div><span>SERVICE RECEIPT (เดิม · ไม่เปลี่ยน)</span><b>${i(h.receipt_no)}</b></div><div><span>CUSTOMER</span><b>${i(h.customer_name || "-")}</b></div>`
      + `<div><span>INVOICE ที่พร้อมออก ADVANCE</span><b>${N811(nI())} รายการ</b></div><div><span>ยอด ADVANCE รวม</span><b>${M795(tot())}</b></div></div>`
      + `<div class="rcp795-hd">ใบรับเงินสำรองจ่ายที่จะออก : ADVANCE (ADV) <b>${gs.length}</b> ฉบับ (ต่อลูกค้า 1 ใบ) · INVOICE ใน ${i(h.receipt_no)} ทั้งหมด ${N811(h.item_count)} · ไม่มียอด ADVANCE ${N811(h.no_adv)}`
      + ((h.adv_done || []).length ? ` · ออก ADV ไปแล้ว : ${i(h.adv_done.join(", "))}` : "") + `</div>`
      + (er.length ? `<div class="rcp795-err"><b>ออกไม่ได้ ${er.length} รายการ :</b><ul>${er.map((e) => `<li>${i(e.invoice_no || "")} — ${i(e.reason || "")}</li>`).join("")}</ul></div>` : "")
      + (!gs.length ? '<div class="rcp795-err">ไม่มี ADVANCE ที่ค้างออกสำหรับใบเสร็จนี้</div>' : "")
      + gs.map((g, n) => `<div class="rcp795-g"><div class="rcp795-gh"><b>${i(g.customer_name || "-")}</b>${g.customer_status && g.customer_status !== "OK" ? ` <span class="rcp795-err" style="display:inline-block;padding:2px 8px">ยังไม่ได้ยืนยัน CUSTOMER</span> <button type="button" class="btn btn-sm cu836" data-c844u='${i(JSON.stringify(g.customer_keys || [g.customer_key]))}'>ตรวจสอบ / แก้ไข CUSTOMER</button>` : ""}</div>`
        + `<table class="tbl rcp795-t ia844-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th class="r">Advance Amount</th></tr></thead><tbody>`
        + (g.adv.items || []).map((z, j) => `<tr><td>${j + 1}</td><td>${i(z.invoice_no)}</td><td>${D795(z.invoice_date)}</td><td class="r">${M795(z.amount)}</td></tr>`).join("")
        + `<tr class="t-b"><td colspan="3" class="r">รวม ${N811(g.adv.count)} INVOICE</td><td class="r">${M795(g.adv.total)}</td></tr></tbody></table></div>`).join("");
    sum.querySelectorAll("[data-c844u]").forEach((b) => { b.onclick = async () => { try { let m = await import("./adv-legacy-L836.js"); (await m.cust836(JSON.parse(b.dataset.c844u), {})) && load(); } catch (e) { k("เปิดหน้าต่าง CUSTOMER ไม่สำเร็จ — " + (e && e.message || e), "err"); } }; });
    sync();
  };
  let load = async () => {
    try {
      st.h = await V("njacc_rcp844_adv_ids", { p: { id: rid } });
      let ids = st.h.rx_ids || [];
      st.pv = ids.length ? await V("njacc_rcp835_preview", { p: { rx_ids: ids } }) : { errors: [], groups: [] };
      let pm = q("#ia844-method"); pm && st.h.payment_method && !pm.dataset.set && (pm.value = st.h.payment_method, pm.dataset.set = "1");
      draw();
    } catch (e) { sum.innerHTML = `<div class="rcp795-err">${i(/PGRST202|schema cache|Could not find the function/i.test(String(e && e.message || e)) ? "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-844)" : RE795(e))}</div>`; sync(); }
  };
  let docsS = (d, m) => { let I = IS795(x); return G().map((g, n) => ({ kind: "ADV", pk: "A" + n, receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, credit: g.adv.credit, status: "ACTIVE",
    customer: { name: g.customer_name, tax_id: g.customer_tax_id, branch_code: g.customer_branch, address: g.customer_address },
    items: (g.adv.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "Advance Charge", amount: z.amount })), total: g.adv.total })); };
  let issue = async () => {
    if (st.busy || st.done) return null; let d = q("#ia844-date").value, m = q("#ia844-method").value;
    if (!d || !m) { k("กรุณาเลือกวันที่และวิธีรับชำระ", "err"); return null; }
    if (bad()) { k("กรุณาตรวจสอบ / ยืนยัน CUSTOMER ก่อนออก ADVANCE", "err"); return null; }
    st.busy = !0; sync(); let ok = q("#ia844-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let exp = (st.pv.groups || []).flatMap((g) => (g.all || []).map((z) => ({ invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received, adv_amount: z.adv_amount, invoice_no: z.invoice_no, rx823_id: z.rx823_id, customer_key: z.customer_key || g.customer_key, cust_ver: z.cust_ver })));
      if (exp.some((z) => Number(z.received) || Number(z.invoice_amount))) throw new Error("พบยอด SERVICE ที่ยังไม่ออกในรายการ — กรุณาออกจากแท็บ รอรับชำระ");   /* ปุ่มนี้ออกเฉพาะ ADVANCE */
      let r = await V("njacc_rcp835_issue", { p: { request_id: st.req, invoice_ids: [], rx_ids: exp.map((z) => z.rx823_id), receipt_date: d, payment_method: m, issuer: IS795(x), expected: exp, link_rcp: { id: rid } } });
      let advs = (r && r.advs) || []; if (!advs.length || (r.receipts || []).length) throw new Error("Database ไม่ยืนยันผลการออก ADVANCE");
      st.done = advs; ok.textContent = "✅ ออกแล้ว";
      sum.innerHTML = `<div class="rcp795-okbox" id="ia844-done"><b>✅ ออก ADVANCE สำเร็จ ${advs.length} ฉบับ</b> — ${advs.map((a) => `<b>${i(a.receipt_no)}</b> (${N811(a.count)} INVOICE · ${M795(a.total)})`).join(" · ")} · คู่กับ ${i(st.h.receipt_no)} (SERVICE ไม่เปลี่ยน)</div>`
        + `<div style="margin-top:8px"><button type="button" class="btn btn-p" id="ia844-open">📄 ดู / พิมพ์ / ดาวน์โหลด (เลือก SERVICE / ADVANCE / ทั้งคู่)</button></div>`;
      q("#ia844-open").onclick = () => openD();
      k("ออก ADVANCE " + advs.map((a) => a.receipt_no).join(", ") + " แล้ว", "ok");
      try { t.isConnected && t.__ld811 && t.__ld811(); OP797(t, !0); } catch (e) {}
      return advs;
    } catch (e) {
      let msg = RE795(e); k("ออก ADVANCE ไม่สำเร็จ — " + msg, "err"); ok.textContent = "✅ ยืนยันออก ADVANCE"; st.busy = !1;
      if (/NJACC_RCP_(CHANGED|INVALID)|NJACC_CUST836/.test(String(e && e.message || e))) { st.req = RQ795(); await load(); sum.insertAdjacentHTML("afterbegin", `<div class="rcp795-err">${i(msg)}</div>`); }
      return null;
    } finally { st.busy = !1; sync(); }
  };
  let openD = async (pr, md) => { try { let docs = await RL795(["xl:" + rid + st.done.map((a) => ",xadv:" + a.id).join("")]); await showDocs(docs, { sample: !1, m844: md || "A" });
      if (pr) { let dd = FD844(docs, MD844(docs, md || "A")); RX795(dd.map((d) => RF795(d, !1)).join(""), FX814(dd)); } }
    catch (e) { back(); k("เปิดเอกสารไม่สำเร็จ — " + RE795(e), "err"); } };
  q("#ia844-date").onchange = sync; q("#ia844-method").onchange = sync;
  q("#ia844-pv").onclick = async () => { let d = q("#ia844-date").value, m = q("#ia844-method").value; if (!st.pv || !d || !m) { k("กรุณาเลือกวันที่และวิธีรับชำระ", "err"); return; }
    let after = async (pr) => { if (!(await ASK814(`ออกใบรับเงินสำรองจ่าย ADVANCE (ADV) <b>${G().length} ฉบับ</b> · ${N811(nI())} INVOICE · ${M795(tot())}<br>ออกเลข ADV จริงจากตัวนับกลาง และล็อกข้อมูลทันที · SERVICE ${i(st.h.receipt_no)} ไม่เปลี่ยน`))) return; let r = await issue(); r && (await openD(pr, "A")); };
    await showDocs(docsS(d, m), { sample: !0, commit: () => after(!1), printX: () => after(!0) }); };
  q("#ia844-ok").onclick = async () => {
    let yes = await new Promise((res) => { let old = pf.querySelector(".rcp795-ask"); old && old.remove(); let a = document.createElement("div"); a.className = "rcp795-ask";
      a.innerHTML = `<div>ออกใบรับเงินสำรองจ่าย ADVANCE (ADV) <b>${G().length} ฉบับ</b> · ${N811(nI())} INVOICE · ยอดรวม <b>${M795(tot())}</b><br>ระบบจะออกเลข ADV จริงจากตัวนับกลาง และล็อกข้อมูลทันที · SERVICE ${i(st.h.receipt_no)} ไม่ออกซ้ำ / ไม่เปลี่ยน</div><div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn btn-o" data-n>ยกเลิก</button><button type="button" class="btn btn-p" data-y id="ia844-yes">ยืนยัน</button></div>`;
      sum.insertAdjacentElement("beforebegin", a); a.querySelector("[data-n]").onclick = () => { a.remove(); res(!1); }; a.querySelector("[data-y]").onclick = () => { a.remove(); res(!0); }; });
    yes && (await issue());
  };
  await load();
}

/* ═══ V.843 · ใบเสร็จที่ออกแล้ว : ยอดของใบเสร็จแถวนั้น — Service ก่อน VAT / Advance / Vat 7% / Total Amount / Tax (3%) / Payment Received
   ใบ ADVANCE ที่คู่กับ RCP จะไม่มีแถวของตัวเอง (V.841) → รวมยอดในแถว RCP ครั้งเดียว ไม่นับซ้ำ ═══ */
function VL843(o, adv) {
  o = o || {};
  let num = (x) => (x == null || x === "" || !isFinite(Number(x)) ? null : Number(x));
  let advv = num(o.adv_total) || 0;   /* V.849 : SERVICE + ADVANCE ที่ผูก INVOICE ชุดเดียวกัน = 1 แถว (ยอด ADV ของใบคู่อยู่ในแถวเดียวกัน · ไม่มีแถว ADV ซ้ำ) */
  if (adv) return { svc: 0, advv, vat: 0, tot: advv, tax: 0, pay: advv };
  let inv = num(o.invoice_amount) || 0, tax = num(o.wht_amount) || 0, svc = num(o.service_amount);
  let vat = svc == null ? null : Math.round((inv - svc) * 100) / 100;
  return { svc, advv, vat, tot: Math.round((inv + advv) * 100) / 100, tax, pay: Math.round(((num(o.total) != null ? num(o.total) : inv - tax) + advv) * 100) / 100 };
}
function A843(v) { return v == null ? "-" : M795(v); }
function ST843() {
  if (document.getElementById("st843-css")) return;
  let s = document.createElement("style"); s.id = "st843-css";
  s.textContent = "@media (min-width:641px){table:has(>#rc-tbody) thead th{text-align:center!important}table:has(>#rc-tbody) thead th.col-act{text-align:center!important}"
    + "#rc-tbody td.r,#rc-tbody td.m843{text-align:right!important;font-variant-numeric:tabular-nums;white-space:nowrap}#rc-tbody td.c811{text-align:left!important}}"
    + "@media (max-width:640px){tr.r811 td.m843{display:none!important}}";   /* Mobile : การ์ดเดิม (ไม่เพิ่มบรรทัดยอด) */
  document.head.appendChild(s);
}

/* ═══ V.842 · ใบเสร็จที่ออกแล้ว : ปุ่มคอลัมน์จัดการ (รายการ / แก้ไข / PREVIEW / PRINT / SAVE PDF) เท่ากัน 92 × 36 · เฉพาะ Desktop (≥ 641px) ═══ */
function ST842() {
  if (document.getElementById("st842-css")) return;
  let s = document.createElement("style"); s.id = "st842-css";
  s.textContent = "@media (min-width:641px){#rc-tbody td.col-act{white-space:nowrap!important}"
    + "#rc-tbody td.col-act>.btn{display:inline-flex!important;align-items:center;justify-content:center;box-sizing:border-box;width:92px!important;min-width:92px!important;max-width:92px!important;height:36px!important;min-height:36px!important;"
    + "padding:0!important;margin:0 6px 0 0!important;font-size:12px!important;font-weight:600!important;line-height:1!important;border-radius:6px!important;vertical-align:middle;white-space:nowrap;overflow:hidden}"
    + "#rc-tbody td.col-act>.btn:last-child{margin-right:0!important}"
    + "#rc-tbody td,table:has(>#rc-tbody) thead th{padding-left:7px!important;padding-right:7px!important}table:has(>#rc-tbody) thead th{white-space:normal!important;line-height:1.25}}";   /* ให้ปุ่ม 5 ปุ่มอยู่ครบในจอ 1600px โดยไม่ต้องเลื่อน */
  document.head.appendChild(s);
}

/* ═══ V.841 (RUN-841) · ใบเสร็จที่ออกแล้ว : สถานะเอกสาร SERVICE (RCP) / ADVANCE (ADV) ═══ */
function SS841(o, adv) {
  ST842();
  let b = (t, c, tt) => `<span class="bdg795" style="${c}" title="${i(tt || t)}">${t}</span>`, need = Number(o.adv_need) || 0, an = String(o.adv_no || "");
  let s = adv ? b("ออก ADVANCE แล้ว", "background:#dcfce7;color:#166534", "RECEIPT ADVANCE " + (o.receipt_no || ""))
    : an && !need ? b("ออกครบ 2 ประเภท", "background:#dcfce7;color:#166534", "SERVICE " + (o.receipt_no || "") + " · ADVANCE " + an)
    : need ? b("ค้าง ADVANCE", "background:#ffedd5;color:#9a3412", "ยังไม่ออกใบรับเงินสำรองจ่าย " + need.toLocaleString("th-TH") + " INVOICE — ออกได้ที่แท็บ รอรับชำระ")
    : b("ออกใบเสร็จแล้ว", "", "SERVICE " + (o.receipt_no || ""));
  if (!adv && need && o.kind === "XLS" && CAN795()) s += `<button type="button" class="btn btn-sm ia844" data-ia844="${i(o.receipt_id || "")}" title="ออกใบรับเงินสำรองจ่าย (ADV) ที่ค้างของ ${i(o.receipt_no || "")} — ไม่ออก SERVICE ซ้ำ">ออก ADVANCE</button>`;   /* V.844 */
  if (!adv && (an || need)) s += `<div style="font-size:11px;color:#475569;margin-top:2px;white-space:normal">SERVICE ${i(o.receipt_no || "")} · ADVANCE ${an ? i(an) : "ยังไม่ออก"}${an && need ? " · ค้าง " + need.toLocaleString("th-TH") + " INVOICE" : need ? " (" + need.toLocaleString("th-TH") + " INVOICE)" : ""}</div>`;
  return s;
}

/* ═══ V.838 (RUN-838) · ระบบเก่า : ป้ายสถานะ SERVICE / ADVANCE ต่อแถว (เฉพาะกรณีออกไปแล้วบางส่วน / ADVANCE อย่างเดียว) ═══ */
function BS838(o) {
  let z = o && o.rx838; if (!z) return "";
  let tag = (t, tt, c) => `<span class="b838" style="display:inline-block;margin:2px 0 0 4px;padding:0 6px;border-radius:999px;font-size:10.5px;font-weight:700;${c}" title="${i(tt)}">${t}</span>`;
  let ok = "background:#dcfce7;color:#166534", wait = "background:#ffedd5;color:#9a3412", hold = "background:#ede9fe;color:#6d28d9";
  let s = "";
  if (z.svc_st === "DONE") s += tag("SERVICE ออกแล้ว", "SERVICE ออกใบเสร็จแล้ว (" + (z.svc_no || "-") + ")", ok);
  if (z.svc_st === "HOLD") s += tag("SERVICE รอตรวจสอบ", z.svc_no || "", hold);
  if (z.adv_st === "DONE") s += tag("ADVANCE ออกแล้ว", "ADVANCE ออกใบรับเงินสำรองจ่ายแล้ว (" + (z.adv_no || "-") + ")", ok);
  if (z.adv_st === "HOLD") s += tag("ADVANCE รอตรวจสอบ", z.adv_no || "", hold);
  if (s && z.svc_st === "NEED") s += tag("ค้าง SERVICE", "ออกได้เฉพาะ SERVICE ที่ค้าง", wait);
  if (s && z.adv_st === "NEED") s += tag("ค้าง ADVANCE", "ออกได้เฉพาะ ADVANCE ที่ค้าง", wait);
  if (!s && z.svc_st === "NONE" && z.adv_st === "NEED") s += tag("ADVANCE อย่างเดียว", "SERVICE = 0 · ออกใบรับเงินสำรองจ่าย ADVANCE (ADV) 1 ใบ", wait);
  return s;
}

/* ═══ V.837 (RUN-837) · FINANCE → RECEIPT : แท็บย่อย "ระบบใหม่ (ACCOUNTING) | ระบบเก่า (UPLOAD EXCEL)" ใต้แท็บรอรับชำระ / ใบเสร็จที่ออกแล้ว (รูปแบบเดียวกับ FINANCE → ADVANCE)
   ส่ง src837 ('ACC' | 'XLS') ให้ RPC เดิม (njacc_receipt_pending / njacc_rcp835_list / njacc_receipt_opts797 · Server กรอง · ไม่นับยอดซ้ำ) · สลับ = ล้าง Checkbox / ตัวกรองลูกค้า-บริษัท แล้วโหลดใหม่
   ระบบใหม่ = รายการ / สูตร / RPC ออกใบเสร็จ ACCOUNTING เดิม · ระบบเก่า = รายการ UPLOAD EXCEL · ปุ่ม UPLOAD EXCEL เฉพาะระบบเก่า (SUPER_ADMIN)
   ใบเสร็จที่ออกแล้ว (ระบบเก่า) : รายการ | แก้ไข | PREVIEW | PRINT | SAVE PDF — แก้ไข (SUPER_ADMIN) = adv-legacy-L836.js edit837 (VOID ใบเดิม + ออกใบใหม่ · RUN-837) ═══ */
var SRC837 = "ACC";
function et(p) { return et0(Object.assign({}, p, { src837: SRC837 })); }   /* njacc_receipt_pending + แท็บย่อย */
function ST837R() {
  if (document.getElementById("st837r")) return;
  let s = document.createElement("style"); s.id = "st837r";
  s.textContent = ".sw837{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 4px;font-size:13px}.sw837>span{font-weight:700;color:#475569}"
    + ".sw837 button[data-sw837]{border:1px solid #cbd5e1;background:#fff;color:#0f2a4d;border-radius:999px;padding:5px 14px;font-weight:700;cursor:pointer;font-size:13px}.sw837 button.on{background:#0f2a4d;color:#fff;border-color:#0f2a4d}"
    + ".btn.hd837{background:#fff!important;border:1px solid #7c3aed!important;color:#6d28d9!important;font-weight:700;white-space:nowrap;margin-left:auto}"
    + ".btn.ed837{background:#fff!important;border:1px solid #b45309!important;color:#b45309!important;font-weight:700;margin-right:4px}.btn.ed837:hover{background:#fffbeb!important}.rp837{display:block;font-size:11px;color:#64748b;font-weight:600}"
    + '[data-src837="ACC"] #rp-up820{display:none!important}[data-src837="XLS"] #rc-issued select[data-f="customer"],[data-src837="XLS"] #rc-issued .u762-f:has(select[data-f="customer"]){display:none!important}'
    + "@media (max-width:640px){.sw837 button[data-sw837]{flex:1 1 0}.btn.hd837{margin-left:0;flex:1 1 100%}}";
  document.head.appendChild(s);
}
function SW837(t) {   /* แถบย่อย (สร้างใหม่ทุกครั้งที่วาดหน้า) */
  ST837R(); t.dataset.src837 = SRC837;
  if (!t.__sw837) {
    t.__sw837 = 1;
    t.addEventListener("click", (ev) => {
      let bt = ev.target.closest && ev.target.closest("[data-sw837],[data-h837]"); if (!bt || !t.contains(bt)) return;
      ev.preventDefault();
      if (bt.dataset.sw837) {
        if (SRC837 === bt.dataset.sw837) return;
        SRC837 = bt.dataset.sw837; SEL795.clear(); BAD795.clear();   /* Checkbox ของระบบก่อนหน้า = ล้าง */
        ["f678_customer", "f678_company"].forEach((k) => { $[k] = ""; b[k] = ""; }); b.customer = ""; $.customer = ""; $.page = 1; b.page = 1;   /* Dropdown ลูกค้า / บริษัท = ข้อมูลของระบบที่เลือก */
        gt(t); return;
      }
      import("./adv-legacy-L836.js").then((m) => m.holds837("RCP", { onDone: () => { t.isConnected && (I === "pending" ? M(t) : t.__ld811 && t.__ld811()); HC837(t); } })).catch((e) => k("เปิดรายการไม่สำเร็จ — " + (e && e.message || e), "err"));
    });
  }
  setTimeout(() => HC837(t), 0);
  return '<div class="sw837" role="tablist"><span>ข้อมูล :</span>' + [["ACC", "ระบบใหม่ (ACCOUNTING)"], ["XLS", "ระบบเก่า (UPLOAD EXCEL)"]].map(([v, l]) =>
    `<button type="button" role="tab" data-sw837="${v}" class="${v === SRC837 ? "on" : ""}" aria-selected="${v === SRC837}">${l}</button>`).join("")
    + (SRC837 === "XLS" && A() ? '<button type="button" class="btn btn-sm hd837" data-h837 title="INVOICE ที่นำออกจากใบเสร็จ — ตรวจสอบการรับชำระก่อนคืนเข้ารอรับชำระ (SUPER_ADMIN)">รอตรวจสอบการรับชำระ</button>' : "") + "</div>";
}
function HC837(t) {   /* จำนวน INVOICE รอตรวจสอบการรับชำระ (ระบบเก่า · SUPER_ADMIN) */
  let hb = t && t.querySelector("[data-h837]"); if (!hb) return;
  import("./adv-legacy-L836.js").then((m) => m.hcount837("RCP")).then((c) => { hb.isConnected && (hb.textContent = "รอตรวจสอบการรับชำระ (" + Number(c || 0).toLocaleString("th-TH") + ")"); }).catch(() => {});
}
function ED837(t, id) {   /* แก้ไขใบเสร็จ Excel (SERVICE) : PREVIEW / PDF = Template RECEIPT เดิม (RW795 / RL795) */
  import("./adv-legacy-L836.js").then((m) => m.edit837({ src: "RCP", id, pv: (docs, o, h) => RW795(docs, o, h), load: (x) => RL795(["xl:" + x]),
    onDone: () => { t.isConnected && t.__ld811 && t.__ld811(); OP797(t, !0); HC837(t); } })).catch((e) => k("เปิดหน้าต่างแก้ไขไม่สำเร็จ — " + (e && e.message || e), "err"));
}

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
      let cols = [["INVOICE NJ", (o) => o.invoice_no || "ยังไม่ออก INV"], ["DATE", (o) => o.invoice_date, "date"], ["ลูกค้า", (o) => o.customer_name], ["บริษัท INVOICE", (o) => o.company_invoice],   /* V.828 : ลำดับเดียวกับรายงาน · ไม่ส่งออกเลขที่งาน · DATE = วันที่ INVOICE NJ */
        ["Customer Job No.", (o) => o.customer_job_no], ["เลขใบขนสินค้า", (o) => o.customs_declaration_no], ["Invoice ต้นทาง (Source)", (o) => o.source_invoice_no], ["House B/L No.", (o) => o.house_bl_no], ["Master B/L No.", (o) => o.master_bl_no],
        ["Service charge", (o) => o.service_amount, "num"], ["Advance", (o) => o.advance_amount, "num"], ["VAT 7%", (o) => o.vat_amount, "num"], ["Amount", (o) => o.subtotal, "num"], ["WHT 3%", (o) => o.wht_amount, "num"],
        ["Total Amount", (o) => (o.net_payable != null ? o.net_payable : Number(o.total_amount) - Number(o.wht_amount)), "num"], ["ชื่อ USER", (o) => (o.created_by_nickname && String(o.created_by_nickname).trim()) || KN522(o.created_by_name)], ["Billing Note no.", (o) => o.billing_note_no], ["Case", (o) => o.case_no]];   /* V.828 (RUN-832) : + Case */
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
var SEL795 = new Map(), ROW795 = new Map(), CTX795 = null, BAD795 = new Map();   /* V.828 : BAD795 = เลือกแล้วแต่ยังไม่พร้อมออกใบเสร็จ (key → {no, why}) */
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
  let sv = C795(o && o.service_amount), a = sv + Math.round(sv * 7 / 100), w = Math.round(sv * 3 / 100);   /* V.839 : VAT 7% / WHT 3% ของ SERVICE ก่อน VAT (ปัดราย INVOICE) */
  return { inv: a, wht: w, rcv: a - w };
}
function OK795(o) {
  if (!CAN795()) return "ไม่มีสิทธิ์ออกใบเสร็จ";
  if (o && o.src823) {   /* V.830 (RUN-835) : FLOW B — รายการ UPLOAD EXCEL ออกใบเสร็จได้ (rx823_id · RPC แยก) · ตรวจข้อมูลเบื้องต้น (Server ตรวจซ้ำ) */
    if (o.rx823_reason) return "รอตรวจสอบ — " + o.rx823_reason + " (ห้ามออกใบเสร็จ)";
    if (!o.rx823_id) return "ไม่พบรายการ UPLOAD EXCEL";
    if (!String(o.invoice_no || "").trim()) return "ไม่พบเลข INVOICE NJ";
    if (!o.invoice_date) return "ไม่มีวันที่ INVOICE";
    if (!String(o.customer_name || "").trim()) return "ไม่มีชื่อลูกค้า";
    if (!String(o.company_invoice || "").trim()) return "ไม่มีบริษัท INVOICE";
    let z8 = o.rx838;   /* V.838 (RUN-838) : สถานะ SERVICE / ADVANCE แยกกัน (Server) */
    if (z8) return z8.reason ? String(z8.reason) : (z8.svc_st === "NEED" || z8.adv_st === "NEED" ? "" : "ไม่มียอดที่ค้างออกใบเสร็จ");
    let a8 = AM795(o); if ((a8.inv <= 0 || a8.rcv <= 0) && !(C795(o.advance_amount) > 0)) return "ไม่มียอด Service / ADVANCE";
    return "";
  }
  let no = String(o && o.invoice_no || "").trim();
  if (!o || !o.invoice_id || !no || /^DRAFT-/i.test(no)) return "ไม่พบเลข INVOICE NJ — ออกใบเสร็จไม่ได้";
  if (String(o.payment_status || "UNPAID").toUpperCase() !== "UNPAID") return "รับชำระแล้ว / บางส่วน";
  let a = AM795(o); if ((a.inv <= 0 || a.rcv <= 0) && !(C795(o.advance_amount) > 0)) return "ไม่มียอด Service / ADVANCE";   /* V.838 : ADVANCE อย่างเดียว = ออก ADV (Server ตรวจซ้ำ) */
  if ((a.inv <= 0 || a.rcv <= 0) && o.rx838 && o.rx838.adv_st === "DONE") return "ออก RECEIPT ADVANCE แล้ว (ไม่มียอด Service)";
  return "";
}
function RH795() { ST795(); return '<th class="center col-sel rcp795-th" data-col-req="1" data-col-key="_rcp795" data-col-export="no" title="เลือกทั้งหมด — ทุกหน้าตามผลค้นหาปัจจุบัน (ยกเลิก = ล้างรายการที่เลือกทั้งหมด)"><input type="checkbox" class="rcp795-cb" id="rcp795-all" aria-label="เลือกทั้งหมดทุกหน้าตามผลค้นหา"></th>'; }
function RC795(o) {
  let id = String(o && o.invoice_id || "") || (o && o.rx823_id ? "rx:" + o.rx823_id : ""); id && ROW795.set(id, o);   /* V.828 : รายการ UPLOAD EXCEL = key rx:<id> */
  let why = OK795(o);
  why ? SEL795.delete(id) : BAD795.delete(id);
  return `<td class="center col-sel rcp795-td"><input type="checkbox" class="rcp795-cb${why ? " rcp795-nr" : ""}" data-rcp="${i(id)}"${SEL795.has(id) || BAD795.has(id) ? " checked" : ""}${why ? ` title="ยังไม่พร้อมออกใบเสร็จ — ${i(why)}"` : ""} aria-label="เลือก ${i(o.invoice_no || "")}"></td>`;   /* V.828 : Checkbox ทุกรายการ (ไม่แสดง – แทน) */
}
function RB795() { ST795(); return `<div class="rcp795-bar" id="rcp795-bar"${CAN795() ? "" : " hidden"}><button type="button" class="btn btn-sm rcp795-btn" id="rcp795-btn" disabled title="ออกใบเสร็จ RECEIPT จากรายการที่เลือก">🧾 ออกใบเสร็จ RECEIPT PDF</button><span class="rcp795-info" id="rcp795-info">ยังไม่ได้เลือกรายการ</span><button type="button" class="btn btn-sm btn-o" id="rcp795-allp" title="เลือก Invoice ที่ออกใบเสร็จได้ครบทุกหน้าตามผลค้นหาปัจจุบัน">☑ เลือกทั้งหมด (ทุกหน้า)</button><button type="button" class="btn btn-sm btn-o" id="rcp795-clear" disabled>ล้างรายการที่เลือก</button></div>`; }
function RS795(t) {   /* sync แถบสรุป + หัวตาราง */
  if (!t) return;
  let btn = t.querySelector("#rcp795-btn"), info = t.querySelector("#rcp795-info"), clr = t.querySelector("#rcp795-clear"), cnt = SEL795.size, bad = BAD795.size, all8 = cnt + bad, sum = 0;
  let asum = 0; SEL795.forEach((r) => { let z = r && r.rx838; if (z && !z.acc) { z.svc_st === "NEED" && (sum += C795(z.svc_rcv)); z.adv_st === "NEED" && (asum += C795(z.adv)); } else { sum += AM795(r).rcv; z && z.adv_st === "DONE" || (asum += Math.max(0, C795(r && r.advance_amount))); } });   /* V.838 */
  if (btn) { btn.disabled = !all8; btn.textContent = "🧾 ออกใบเสร็จ RECEIPT PDF" + (all8 ? " (" + all8 + ")" : ""); }
  if (clr) clr.disabled = !all8;
  if (info && !t.__rcpBusy) info.textContent = !all8 ? "ยังไม่ได้เลือกรายการ" : bad ? "เลือก " + all8.toLocaleString("th-TH") + " รายการ (ออกใบเสร็จได้ " + cnt.toLocaleString("th-TH") + " · ยังไม่พร้อม " + bad.toLocaleString("th-TH") + ") · Payment Received รวม " + M795(sum / 100) : "เลือก " + cnt.toLocaleString("th-TH") + " Invoice · Payment Received รวม " + M795(sum / 100);   /* V.828 */
  if (info && !t.__rcpBusy && all8 && asum) info.textContent += " · Advance รวม " + M795(asum / 100);   /* V.838 */
  let all = t.querySelector("#rcp795-all"), cbs = [...t.querySelectorAll("#rp-tbody .rcp795-cb[data-rcp]")];
  if (all) { let k = cbs.filter((c) => c.checked).length; all.disabled = !cbs.length || !CAN795(); all.checked = !!cbs.length && k === cbs.length; all.indeterminate = k > 0 && k < cbs.length; }
}
function RA795(t, refresh) {   /* ผูก event ครั้งเดียวต่อหน้า */
  CTX795 = { root: t, refresh: refresh || (CTX795 && CTX795.refresh) };
  if (t.__rcp795) { RS795(t); return; }
  t.__rcp795 = 1;
  t.addEventListener("change", (ev) => {
    let c = ev.target; if (!c || !c.classList || !c.classList.contains("rcp795-cb")) return;
    if (c.id === "rcp795-all") {   /* V.828 : เลือก / ยกเลิกทั้งหมดในหน้าปัจจุบัน (ทุกหน้า = ปุ่ม "เลือกทั้งหมด (ทุกหน้า)" เดิม) */
      let nb = 0;
      t.querySelectorAll("#rp-tbody .rcp795-cb[data-rcp]").forEach((x) => { let key = x.dataset.rcp, r = ROW795.get(key); x.checked = c.checked;
        if (!c.checked) { SEL795.delete(key); BAD795.delete(key); return; }
        let why = r ? OK795(r) : "ไม่พบข้อมูลรายการ"; if (!why) SEL795.set(key, r); else { BAD795.set(key, { no: (r && r.invoice_no) || "", why }); nb++; } });
      nb && k("เลือกรายการที่ยังไม่พร้อมออกใบเสร็จ " + nb.toLocaleString("th-TH") + " รายการ — ออกใบเสร็จไม่ได้จนกว่าจะยกเลิกการเลือก (ชี้ที่ช่องเลือกเพื่อดูสาเหตุ)", "err");
    } else if (c.dataset.rcp) {   /* V.828 : เลือกได้ทุกรายการ · ยังไม่พร้อม = แจ้งสาเหตุ + ห้ามออกใบเสร็จ (ไม่เปลี่ยนสถานะชำระ) */
      let key = c.dataset.rcp, r = ROW795.get(key);
      if (!c.checked) { SEL795.delete(key); BAD795.delete(key); }
      else { let why = r ? OK795(r) : "ไม่พบข้อมูลรายการ"; if (!why) SEL795.set(key, r); else { BAD795.set(key, { no: (r && r.invoice_no) || "", why }); k("INVOICE " + ((r && r.invoice_no) || "-") + " ยังไม่พร้อมออกใบเสร็จ — " + why, "err"); } }
    }
    RS795(t);
  });
  t.addEventListener("click", (ev) => {
    let b = ev.target.closest && ev.target.closest("#rcp795-btn,#rcp795-clear,#rcp795-allp,[data-rcp-pv],[data-rcp-pr],[data-rcp-sv]"); if (!b || !t.contains(b)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.id === "rcp795-clear") { SEL795.clear(); BAD795.clear(); t.querySelectorAll(".rcp795-cb").forEach((x) => { x.checked = !1; x.indeterminate = !1; }); RS795(t); return; }
    if (b.id === "rcp795-btn") { b.disabled || RO795(t); return; }
    if (b.id === "rcp795-allp") { b.disabled || SAL795(t, b); return; }
    if (b.dataset.rcpPv) { RG795([b.dataset.rcpPv]); return; }
    if (b.dataset.rcpPr) { CH844(b, b.dataset.rcpPr, (kk) => RPR795(kk, b)); return; }   /* V.844 */
    if (b.dataset.rcpSv) CH844(b, b.dataset.rcpSv, (kk) => SV795(kk, b));
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
      rows.forEach((o) => { let id = String(o && o.invoice_id || "") || (o && o.src823 && o.rx823_id ? "rx:" + o.rx823_id : ""); if (!id) return; ROW795.set(id, o); OK795(o) || SEL795.set(id, o); });   /* V.830 : + รายการ Excel */
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
  if (/NJACC_CUST836_REQUIRED/.test(m)) return "ยังไม่ได้ตรวจสอบ / ยืนยัน CUSTOMER ของรายการ UPLOAD EXCEL — กด “ตรวจสอบ / แก้ไข CUSTOMER” ก่อนออกใบเสร็จ";   /* V.836 */
  if (/njacc_rcp835/i.test(m) && /PGRST202|schema cache|Could not find/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-835)";   /* V.830 */
  if (/njacc_rcp818/i.test(m) && /PGRST202|schema cache|Could not find/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-818)";   /* V.814 */
  if (/njacc_rcp795|PGRST202|schema cache/i.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-795)";
  return m;
}
function RQ795() { try { return "rcp795-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); } catch (e) { return "rcp795-" + Date.now() + "-" + Math.random().toString(36).slice(2); } }
async function RO795(t) {   /* หน้าต่างออกใบเสร็จ · V.814 (RUN-818) : ต่อลูกค้า RCP (SERVICE) + ADV (ADVANCE) — PREVIEW / SAVE / PRINT ทีเดียวทั้ง 2 ใบ */
  if (BAD795.size) { let a = [...BAD795.values()]; k("ออกใบเสร็จไม่ได้ — เลือกรายการที่ยังไม่พร้อม " + a.length.toLocaleString("th-TH") + " รายการ : " + a.slice(0, 5).map((x) => (x.no || "-") + " (" + x.why + ")").join(" · ") + (a.length > 5 ? " …" : "") + " — กรุณายกเลิกการเลือกรายการเหล่านี้", "err"); return; }   /* V.828 */
  let ids = [...SEL795.keys()]; if (!ids.length) return; ST814();
  let A8 = () => ids.filter((z) => !/^rx:/.test(z)), B8 = () => ids.filter((z) => /^rx:/.test(z)).map((z) => z.slice(3));   /* V.830 : FLOW A = invoice_id (RPC เดิม) · FLOW B = rx823_id (RPC Excel) — ไม่ส่ง ID ข้าม RPC */
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
    let ok = st.pv && !st.pv.errors.length && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value && !st.done && !NC836(st.pv);   /* V.836 : CUSTOMER (Excel) ต้องยืนยันครบ */
    q("#rcp795-pv").disabled = !(st.pv && st.pv.groups.length && q("#rcp795-date").value && q("#rcp795-method").value) || st.busy || !!st.done;
    q("#rcp795-ok").disabled = !ok || !st.seen || st.busy;
    q("#rcp795-ok").title = NC836(st.pv) ? "กรุณาตรวจสอบ / ยืนยัน CUSTOMER ของรายการ UPLOAD EXCEL ก่อน" : ok && !st.seen ? "กรุณากดดูตัวอย่างก่อนยืนยัน" : "";
  };
  let draw = () => {
    let p = st.pv; if (!p) return;
    let tot = p.groups.reduce((s, g) => s + C795(g.total), 0), atot = p.groups.reduce((s, g) => s + C795(g.adv && g.adv.total), 0);
    sum.innerHTML = (p.errors.length ? `<div class="rcp795-err"><b>⚠ รายการที่ออกใบเสร็จไม่ได้ (${p.errors.length}) — ระงับการยืนยัน</b><ul>${p.errors.map((e) => `<li>${i(e.invoice_no || "-")}${e.job_no ? " · " + i(e.job_no) : ""} — ${i(e.reason)}</li>`).join("")}</ul><button class="btn btn-sm btn-o" id="rcp795-drop">นำรายการที่มีปัญหาออกจากรายการที่เลือก</button></div>` : "")
      + `<div class="rcp795-hd">ใบเสร็จที่จะออก : SERVICE (RCP) <b>${nR()}</b> ฉบับ · ADVANCE (ADV) <b>${nA()}</b> ฉบับ (ต่อลูกค้า 1 RCP + 1 ADV) · Payment Received รวม <b>${M795(tot / 100)}</b>${atot ? ` · Advance รวม <b>${M795(atot / 100)}</b>` : ""}</div>`
      + p.groups.map((g, k) => `<div class="rcp795-g"><div class="rcp795-gh"><span>ลูกค้าที่ ${k + 1} · <b>${i(g.customer_name)}</b></span><span>${Number(g.count) ? `RCP ${Number(g.count)} รายการ · <b>${M795(g.total)}</b>` : "ไม่มี SERVICE"}${g.adv ? ` · ADV ${Number(g.adv.count)} รายการ · <b>${M795(g.adv.total)}</b>` : ""}</span></div>`
          + (g.src === "EXCEL" ? CB836(g) : "")   /* V.836 */
          + (Number(g.count) ? `<div class="rcp814-cap">ใบที่ 1 · SERVICE — RECEIPT (RCP)</div><table class="tbl rcp795-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Invoice Amount</th><th class="r">Withholding Tax (7%)</th><th class="r">Payment Received</th></tr></thead><tbody>${(g.items || []).map((x, j) => `<tr><td class="center">${j + 1}</td><td>${i(x.invoice_no)}</td><td>${D795(x.invoice_date)}</td><td class="t-3">${i(x.job_no || "")}</td><td class="r">${M795(x.invoice_amount)}</td><td class="r">${M795(x.wht_amount)}</td><td class="r">${M795(x.received)}</td></tr>`).join("")}</tbody></table>` : "")
          + (g.adv ? `<div class="rcp814-cap rcp814-a">ใบที่ ${Number(g.count) ? 2 : 1} · ADVANCE — RECEIPT ADVANCE (ADV)</div><table class="tbl rcp795-t"><thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Advance Amount</th></tr></thead><tbody>${(g.adv.items || []).map((x, j) => `<tr><td class="center">${j + 1}</td><td>${i(x.invoice_no)}</td><td>${D795(x.invoice_date)}</td><td class="t-3">${i(x.job_no || "")}</td><td class="r">${M795(x.amount)}</td></tr>`).join("")}</tbody></table>` : "")
          + `</div>`).join("");
    sum.querySelectorAll("[data-c836]").forEach((b) => { b.onclick = async () => { try { let m = await import("./adv-legacy-L836.js"); (await m.cust836(JSON.parse(b.dataset.c836), {})) && load(); } catch (e) { k("เปิดหน้าต่าง CUSTOMER ไม่สำเร็จ — " + (e && e.message || e), "err"); } }; });   /* V.836 */
    let dr = q("#rcp795-drop"); dr && (dr.onclick = () => { p.errors.forEach((e) => SEL795.delete(e.rx823_id ? "rx:" + e.rx823_id : String(e.invoice_id))); RS795(t); t.querySelectorAll(".rcp795-cb[data-rcp]").forEach((c) => { c.checked = SEL795.has(c.dataset.rcp); }); ids = [...SEL795.keys()]; ids.length ? load() : (sum.innerHTML = '<div class="empty">ไม่มีรายการที่เลือก</div>', st.pv = null, sync()); });
    sync();
  };
  let load = async () => {
    st.pv = null; st.seen = !1; sync(); sum.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลล่าสุดจาก Server…</div></div>';
    try { let r = B8().length ? await V("njacc_rcp835_preview", { p: { invoice_ids: A8(), rx_ids: B8() } }) : await V("njacc_rcp818_preview", { p: { invoice_ids: ids } }); st.pv = { errors: r && r.errors || [], groups: r && r.groups || [] }; draw(); }   /* V.830 */
    catch (e) { sum.innerHTML = `<div class="rcp795-err">${i(RE795(e))}</div>`; sync(); }
  };
  let keys = (pairs) => (pairs || []).map((z) => [z.rcp && ((z.rcp.src === "EXCEL" ? "xl:" : "") + z.rcp.id), z.adv && (z.adv.src === "EXCEL" ? "xadv:" : "adv:") + z.adv.id].filter(Boolean).join(",")).filter(Boolean);   /* V.830 : ใบเสร็จ Excel = xl:<id> */
  let issue = async (confirmFn) => {   /* SAVE จริง (RCP + ADV ธุรกรรมเดียว) · กดซ้ำ = request_id เดิม → เอกสารเดิม ไม่ออกเลขใหม่ */
    if (st.done) return st.done;
    if (st.busy || !st.pv || st.pv.errors.length) return null;
    if (NC836(st.pv)) { k("กรุณาตรวจสอบ / ยืนยัน CUSTOMER ของรายการ UPLOAD EXCEL ก่อนออกใบเสร็จ", "err"); return null; }   /* V.836 */
    let d = q("#rcp795-date").value, m = q("#rcp795-method").value, cnt = st.pv.groups.reduce((s, g) => s + Number(g.count || 0) + Number(g.adv && g.adv.count || 0), 0);
    if (!d || !m) { k("กรุณาเลือกวันที่ใบเสร็จและวิธีรับชำระ", "err"); return null; }
    if (!(await confirmFn(`ออกใบเสร็จ SERVICE (RCP) <b>${nR()} ฉบับ</b> + ADVANCE (ADV) <b>${nA()} ฉบับ</b> · ${cnt} รายการ · วันที่ ${D795(d)} · ${i(PML795(m))}<br>เมื่อยืนยันแล้ว ระบบจะออกเลข RCP / ADV จริงพร้อมกัน เปลี่ยนรายการเป็น PAID ย้ายไปแถบ “ใบเสร็จที่ออกแล้ว” และล็อกข้อมูลทันที (แก้ไข / ลบ / UNPOST ไม่ได้)`))) return null;
    st.busy = !0; sync(); let ok = q("#rcp795-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let exp = st.pv.groups.flatMap((g) => (g.all || []).map((z) => ({ invoice_id: z.invoice_id, invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received, adv_amount: z.adv_amount, customer_id: g.customer_id, invoice_no: z.invoice_no, rx823_id: z.rx823_id, customer_key: z.customer_key || g.customer_key, cust_ver: z.cust_ver })));   /* V.836 : ชื่อลูกค้าใน Excel ต่อรายการ + ver ของ CUSTOMER ที่ยืนยัน */
      let xb = exp.filter((z) => z.rx823_id);   /* V.830 : มีรายการ Excel = njacc_rcp835_issue (FLOW B + FLOW A เดิมในธุรกรรมเดียว) · ไม่มี = njacc_rcp818_issue เดิม */
      let r = xb.length ? await V("njacc_rcp835_issue", { p: { request_id: st.req, invoice_ids: exp.filter((z) => z.invoice_id).map((z) => z.invoice_id), rx_ids: xb.map((z) => z.rx823_id), receipt_date: d, payment_method: m, issuer: IS795(x), expected: exp } })
        : await V("njacc_rcp818_issue", { p: { request_id: st.req, invoice_ids: exp.map((z) => z.invoice_id), receipt_date: d, payment_method: m, issuer: IS795(x), expected: exp } });
      st.done = r && r.pairs || []; st.req = RQ795();
      SEL795.clear(); BAD795.clear(); RS795(t);
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
      if (/NJACC_RCP_(CHANGED|INVALID)|NJACC_CUST836/.test(String(e && e.message || e))) { await load(); sum.insertAdjacentHTML("afterbegin", `<div class="rcp795-err">${i(msg)}</div>`); }
      return null;
    } finally { st.busy = !1; sync(); }
  };
  let open = async (ks, pr, md) => {   /* เอกสารที่บันทึก (เลขจริง · สำเนา ณ เวลาออก) — ดู / PRINT / SAVE PDF ซ้ำได้ ไม่ออกเลขใหม่ */
    try {
      let docs = await RL795(ks); await showDocs(docs, { sample: !1, m844: md });
      if (pr) { let dd = FD844(docs, MD844(docs, md)); RX795(dd.map((d) => RF795(d, !1)).join(""), FX814(dd)); }
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
        items: (g.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "SERVICE CHARGE", invoice_amount: z.invoice_amount, wht_amount: z.wht_amount, received: z.received, service_amount: z.service_amount })),   /* V.839 */
        invoice_amount: g.invoice_amount, wht_amount: g.wht_amount, total: g.total });
      g.adv && docs.push({ kind: "ADV", pk: "S" + n, receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, credit: g.adv.credit, customer: C, status: "ACTIVE",
        items: (g.adv.items || []).map((z, j) => ({ no: j + 1, invoice_no: z.invoice_no, invoice_date: z.invoice_date, description: "Advance Charge", amount: z.amount })), total: g.adv.total });
    });
    st.seen = !0; sync();
    let after = async (pr, md) => { let r = await issue(ASK814); if (!r) return; await open(keys(r), pr, md); };   /* V.844 : md = ตัวเลือกเอกสาร */
    await showDocs(docs, { sample: !st.done, commit: st.done ? null : (md) => after(!1, md), printX: st.done ? null : (md) => after(!0, md) });
  };
  q("#rcp795-ok").onclick = async () => {
    if (st.busy || !st.pv || st.pv.errors.length || !st.seen) return;
    back();
    let r = await issue(ask); r && (await open(keys(r)));
  };
  await load();
}
/* ═══ V.836 (RUN-836) · FLOW B (UPLOAD EXCEL) : CUSTOMER ต้องยืนยันก่อนออกใบเสร็จ — กล่องข้อมูลลูกค้าในหน้าต่างออกใบเสร็จ (ACCOUNTING = เดิม ไม่แสดงกล่องนี้) ═══ */
function NC836(p) { return !!(p && (p.groups || []).some((g) => g.src === "EXCEL" && g.customer_status !== "OK")); }
function CB836(g) {
  let ok = g.customer_status === "OK", e = (v) => i(v == null || v === "" ? "-" : String(v));
  return `<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12.5px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:8px;margin:8px 0">`
    + `<span style="color:#64748b">CUSTOMER</span><b>${ok ? e(g.customer_name) : "-"} ${ok ? '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 8px;font-size:11px">ยืนยันแล้ว</span>' : '<span style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 8px;font-size:11px">ยังไม่ยืนยัน CUSTOMER — ออกใบเสร็จไม่ได้</span>'}</b>`
    + `<span style="color:#64748b">ADDRESS</span><b>${e(g.customer_address)}</b><span style="color:#64748b">TAX ID / BRANCH</span><b>${e(g.customer_tax_id)} / ${e(g.customer_branch)}</b>`
    + `<span style="color:#64748b">ชื่อใน Excel</span><b>${e((g.customer_keys || [g.customer_key]).join(", "))}</b><span style="color:#64748b">COMPANY INVOICE</span><b>${e((g.company_invoices || []).filter(Boolean).join(", "))}</b>`
    + (!ok && (g.customer_problems || []).length ? `<span style="color:#64748b">ต้องแก้</span><b style="color:#b91c1c">${e(g.customer_problems.join(" · "))}</b>` : "")
    + `</div><button type="button" class="btn btn-sm" style="background:#fff;border:1px solid #0f766e;color:#0f766e;font-weight:700" data-c836='${i(JSON.stringify(g.customer_keys || [g.customer_key]))}'>ตรวจสอบ / แก้ไข CUSTOMER</button>`;
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
    if (/^xadv:/.test(id)) { await AD814(); let L8 = await import("./adv-legacy-L836.js"), a = (await L8.LD([id.slice(5)]))[0]; a && docs.push(Object.assign(a, { kind: "ADV", id: id.slice(5), pk: String(key) })); continue; }   /* V.838 : ADV ระบบเก่า = Loader / Template เดียวกับ FINANCE → ADVANCE */
    if (/^adv:/.test(id)) { let M = await AD814(), a = (await M.RL814([id.slice(4)]))[0]; a && docs.push(Object.assign(a, { kind: "ADV", id: id.slice(4), pk: String(key) })); continue; }
    let r = /^xl:/.test(id) ? await V("njacc_rcp835_get", { p_id: id.slice(3) }) : await V("njacc_rcp795_get", { p_id: id }), s = r && r.snapshot || {};   /* V.830 : xl: = ใบเสร็จ Excel */
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
  let n7 = items.length > 0 && items.every((z) => z && z.service_amount != null && z.service_amount !== "");   /* V.839 : มี SERVICE ก่อน VAT ราย INVOICE (จาก Server) */
  let cS = 0, cI = 0, cW = 0; items.forEach((z) => { cS += C795(z.service_amount); cI += C795(z.invoice_amount); cW += C795(z.wht_amount); });
  if (n7) { sInv = cI / 100; sW = cW / 100; sR = (cI - cW) / 100; }
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
      <section class="rcp-box rcp-box-r" style="display:flex;flex-direction:column;justify-content:center"><span class="rcp-tag">RECEIPT DETAILS</span>
        <div class="rcp-kv"><b>Receipt No.</b><b>:</b><span class="rcp-no">${i(doc.receipt_no)}</span></div>
        <div class="rcp-kv"><b>Receipt Date</b><b>:</b><span>${D795(doc.receipt_date)}</span></div></section>
    </div>
    <table class="rcp-tb"><colgroup><col style="width:8%"><col style="width:24%"><col style="width:18%"><col style="width:26%"><col style="width:24%"></colgroup>
      <thead><tr><th>No.</th><th>Invoice</th><th>Invoice Date</th><th>Description</th><th class="r">Amount Charge</th></tr></thead>
      <tbody>${rows.map((z, j8) => `<tr><td class="c">${a - rows.length + j8 + 1}</td><td class="c">${i(z.invoice_no)}</td><td class="c">${D795(z.invoice_date)}</td><td class="c" style="vertical-align:middle">${i(z.description || "SERVICE CHARGE")}</td><td class="r">${M795(n7 ? z.service_amount : z.received)}</td></tr>`).join("")}
      ${last ? `<tr class="rcp-tot"><td colspan="4" class="c">TOTAL</td><td class="r">${M795(n7 ? cS / 100 : sR)}</td></tr>` : ""}</tbody></table>
    ${last ? `<div class="rcp-sum">
      <div class="rcp-box rcp-pay"><div><b>Payment Method :</b> ${i(PML795(doc.payment_method))}</div><div><b>Amount in Words :</b> ${i(W795(sR))}</div></div>
      <div class="rcp-box rcp-amt">${n7 ? `<div class="rcp-a1" style="padding-top:1.5mm;padding-bottom:1.5mm"><b>Service Amount</b><b>${M795(cS / 100)}</b></div><div class="rcp-a1 rcp-aw" style="padding-top:1.5mm;padding-bottom:1.5mm"><b>VAT 7%</b><b>${M795((cI - cS) / 100)}</b></div><div class="rcp-a1 rcp-aw" style="padding-top:1.5mm;padding-bottom:1.5mm"><b>Total Amount</b><b>${M795(cI / 100)}</b></div><div class="rcp-a1 rcp-aw" style="padding-top:1.5mm;padding-bottom:1.5mm"><b>Withholding Tax (3%)</b><b>-${M795(cW / 100)}</b></div>`   /* V.839 */ : `<div class="rcp-a1"><b>Invoice Amount</b><b>${M795(sInv)}</b></div><div class="rcp-a1 rcp-aw"><b>Withholding Tax</b><b>${M795(sW)}</b></div>`}<div class="rcp-a2"><b>Payment Received</b><b>${M795(sR)}</b></div></div>
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
/* ═══ V.856 · PDF ใบเสร็จ (RECEIPT / RECEIPT ADVANCE · ระบบใหม่ + ระบบเก่า · รวมใบที่ออกแล้ว) : หน้าละไม่เกิน 25 INVOICE
   PG856(n) = แบ่ง 25 ต่อหน้า · MV856(c, i) = ย้าย 1 แถวสุดท้ายของหน้า i ไปหน้าถัดไป (ไม่มี = เพิ่มหน้า) แล้วเลื่อนส่วนเกิน 25 ต่อไปจนครบ ═══ */
var PP856 = 25;
function PG856(n) { let c = []; n = Math.max(0, n | 0); if (!n) return [1]; for (let i = 0; i < n; i += PP856) c.push(Math.min(PP856, n - i)); return c; }
function MV856(c, i) { c[i] -= 1; i + 1 < c.length ? (c[i + 1] += 1) : c.push(1); for (let j = i + 1; j < c.length; j++) if (c[j] > PP856) { let e = c[j] - PP856; c[j] = PP856; j + 1 < c.length ? (c[j + 1] += e) : c.push(e); } return c; }
function RF795(doc, sample) {   /* V.856 : หน้าละไม่เกิน 25 INVOICE · แถวไม่ข้ามหน้า / ไม่ทับ Footer · TOTAL / สรุป / ลงนาม ต่อจากรายการสุดท้าย (ไม่พอ = เพิ่มหน้า) */
  if (doc && doc.kind === "ADV" && A814) { ST814(); A814.ST814 && A814.ST814(); return A814.RF814(doc, sample); }   /* V.814 : RECEIPT ADVANCE = Template เดิม (RF788) */
  ST795(); let items = doc.items || [], c = PG856(items.length);
  if (!document.body) return RP795(doc, c, sample);
  let box = document.createElement("div"); box.className = "rcp795-doc"; box.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden"; document.body.appendChild(box);
  let over = (pg) => { let ft = pg.querySelector(".rcp-ft").getBoundingClientRect().top, b = 0; pg.querySelectorAll(".rcp-in > *:not(.rcp-stamp)").forEach((z) => { b = Math.max(b, z.getBoundingClientRect().bottom); }); return b > ft - 4; };
  try {
    for (let k = 0, lim = 3 * items.length + 20; k < lim; k++) {   /* เดิมจำกัด items + 2 รอบ (ย้ายทีละแถว) → เอกสารยาวล้นทับ Footer */
      box.innerHTML = RP795(doc, c, sample);
      let bad = [...box.querySelectorAll(".rcp-pg")].findIndex((pg, j) => over(pg) && c[j] > 1);
      if (bad < 0) break;
      MV856(c, bad);
    }
    return RP795(doc, c, sample);
  } finally { box.remove(); }
}
async function RW795(docs, o, host) {   /* Preview = DOM เดียวกับ PDF / Print · V.813 : แสดงเต็มหน้าจอ (PV813 · ไม่ใช้กรอบ Modal) · ปิด = o.back (กลับหน้าเดิม)
   V.814 : RCP + ADV ของลูกค้าเดียวกัน = ชุดเดียว (หน้า SERVICE ก่อน แล้ว ADVANCE) · PRINT = พิมพ์ทุกหน้าในครั้งเดียว · SAVE PDF = 1 ไฟล์ต่อชุด
           ตัวอย่าง : SAVE = ออกเลขจริง (o.commit) · PRINT = SAVE จริงก่อนแล้วพิมพ์ (o.printX) */
  await FN795(); for (let d of docs) await IM795(d);
  let all844 = docs, md844 = MD844(docs, o.m844); docs = FD844(docs, md844);   /* V.844 : เลือกดู / พิมพ์ / ดาวน์โหลด เฉพาะ SERVICE / เฉพาะ ADVANCE / ทั้งคู่ */
  let html = docs.map((d) => RF795(d, o.sample)).join(""), nos = docs.map((d) => d.receipt_no), g = [];
  docs.forEach((d, j) => { let pk = d.pk || "d" + j, z = g.find((y) => y.pk === pk); z ? z.d.push(d) : g.push({ pk, d: [d] }); });
  let parts = g.map((z) => z.d.map((d) => RF795(d, o.sample)).join("")), names = g.map((z) => FX814(z.d)), adv = docs.some((d) => d.kind === "ADV");
  host && (host.innerHTML = "");
  PV813({ title: o.sample ? (adv ? "RECEIPT + RECEIPT ADVANCE" : "RECEIPT") + " — ตัวอย่าง " + docs.length + " ฉบับ" : (o.title || "RECEIPT " + nos.join(", ")),
    note: o.sample ? "ยังไม่ออกเลข · ยังไม่ตัดรับชำระ · ยังไม่ล็อก (ต่อลูกค้า : RCP SERVICE + ADV ADVANCE)" + (o.commit ? " · SAVE / PRINT = ออกเลขจริงก่อน" : "") : "",
    html, parts, names, save: o.sample ? null : SVH795, commit: o.sample && o.commit ? () => o.commit(md844) : null,
    print: o.sample && o.printX ? () => o.printX(md844) : () => RX795(html, o.sample ? "RECEIPT_SAMPLE" : FX814(docs)), onClose: o.back });
  SW844(all844, md844, (m) => RW795(all844, Object.assign({}, o, { m844: m }), host));
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
      ".rcp795-info{font-size:12.5px;font-weight:700;color:#1e3a8a;white-space:nowrap}.rcp795-x{color:#94a3b8}.rcp795-td,.rcp795-th{width:34px}.rcp795-cb{width:16px;height:16px;cursor:pointer}.rcp795-cb.rcp795-nr{accent-color:#f59e0b}",
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
var O797S = "";   /* V.837 : ตัวเลือกตามแท็บย่อย */
var O797 = null, O797T = 0, NM797 = new Map(), OK797 = { customers: "ลูกค้าทั้งหมด", companies: "บริษัททั้งหมด" };
function SE797(st, at, k) {   /* <select> ต้นทางของ Dropdown (ค่าเดิมคงไว้เมื่อสร้างหน้าใหม่) */
  let o = k === "f678_customer" ? "customers" : "companies", v = String((st && st[k]) || ""), nm = NM797.get(v);
  return `<select class="sel sel797" data-${at}="${k}" data-o797="${o}" title="${k === "f678_customer" ? "ค้นหาลูกค้า" : "ค้นหาบริษัท"}"><option value="">${OK797[o]}</option>${v && nm ? `<option value="${i(v)}" title="${i(nm)}" selected>${i(nm)}</option>` : ""}</select>`;
}
async function OP797(t, force) {   /* โหลด / อัปเดตตัวเลือกจาก Database (แคช 15 วินาที · force = หลังออกใบเสร็จ) */
  let d = O797;
  if (force || !d || Date.now() - O797T > 15e3 || O797S !== SRC837) {
    try { d = await V("njacc_receipt_opts797", { p: { company_group: "NJ", src837: SRC837 } }); O797 = d; O797T = Date.now(); O797S = SRC837; }
    catch (e) { try { console.warn("OP797", e); } catch (x) {} if (!O797) return; d = O797; }
  }
  if (!t || !t.isConnected) return;
  [["#rc-pending", "pf", $, "pending"], ["#rc-issued", "f", b, "issued"]].forEach(([sc, at, st, tab]) => {
    let box = t.querySelector(sc); if (!box) return; let src = (d && d[tab]) || {};
    box.querySelectorAll("select.sel797").forEach((sel) => {
      let k = sel.getAttribute("data-" + at), o = sel.dataset.o797, list = Array.isArray(src[o]) ? src[o] : [], cur = String(sel.value || ""), seen = new Set();
      let h = `<option value="">${OK797[o]}</option>` + list.map((x) => {
        let v = (tab === "pending" || SRC837 === "XLS") && x && x.key ? "n:" + String(x.key) : (Array.isArray(x.ids) ? x.ids : []).map(String).filter(Boolean).join(","), n = String(x && x.name || "").trim();   /* V.829 (RUN-833) : รอรับชำระ = ชื่อ (รวมรายการ UPLOAD EXCEL ที่ไม่มี id) */
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
var RH811 = '<th>Receipt No</th><th>Receipt Date</th><th>Customer</th><th class="center">Qty Invoice</th><th class="r">Service</th><th class="r">Advance</th><th class="r">Vat 7%</th><th class="r">Total Amount</th><th class="r">Tax (3%)</th><th class="r">Payment Received</th><th>สถานะ</th><th class="center col-act">จัดการ</th>';   /* V.843 */
function N811(v) { let x = Number(v); return isFinite(x) ? x.toLocaleString("th-TH") : "0"; }
function K814(o) { let A8 = Array.isArray(o.adv_ids) && o.adv_ids.length ? o.adv_ids : o.adv_id ? [o.adv_id] : [];   /* V.841 : ADV ทุกใบที่ผูกกับ INVOICE ชุดเดียวกัน */
  return o.kind === "XLS" ? "xl:" + (o.receipt_id || "") + A8.map((x) => ",xadv:" + x).join("") : o.kind === "XADV" ? "xadv:" + (o.receipt_id || "") : o.kind === "ADV" ? "adv:" + (o.receipt_id || "") : String(o.receipt_id || "") + A8.map((x) => ",adv:" + x).join(""); }   /* V.830 : XLS = ใบเสร็จ Excel */
async function L835(p) {   /* V.830 (RUN-835) : รายการใบเสร็จที่ออกแล้ว = njacc_rcp835_list (ACCOUNTING เดิม + Excel) · ยังไม่รัน RUN-835 = njacc_rcp818_list เดิม */
  p = Object.assign({}, p, { src837: SRC837 });   /* V.837 : แท็บย่อย */
  try { return await V("njacc_rcp835_list", { p }); } catch (e) { if (/PGRST202|schema cache|Could not find/i.test(String(e && e.message || e))) return V("njacc_rcp818_list", { p }); throw e; }
}   /* V.814 : คีย์เอกสารของแถว = RCP [+ ADV คู่] · ADV อย่างเดียว = adv:<id> */
/* ═══ V.849 (RUN-848) · ใบเสร็จที่ออกแล้ว (Desktop ≥ 641px เท่านั้น · Mobile = RI811 / RH811 เดิม) ═══
   14 คอลัมน์ : # | Receipt (RCP) | Receipt (ADV) | Receipt Date | Customer | Qty Invoice | Qty Ad | Service | Advance | VAT 7% | Total Amount | Tax (3%) | Payment Received | จัดการ
   SERVICE + ADVANCE ที่ผูก INVOICE ชุดเดียวกัน = 1 แถว (Receipt ID / เลขเอกสารแยกกันเหมือนเดิม) · จัดการ = รายการ | พิมพ์ ▼ | แก้ไข */
function MQ849() { try { return window.matchMedia("(max-width:640px)").matches; } catch (e) { return !1; } }
var RH849 = '<th class="center n849">#</th><th class="h849r">Receipt (RCP)</th><th class="h849a">Receipt (ADV)</th><th class="w849">Receipt Date</th><th>Customer</th><th class="center w849">Qty Invoice</th><th class="center w849">Qty Ad</th><th class="r">Service</th><th class="r">Advance</th><th class="r">VAT 7%</th><th class="r w849">Total Amount</th><th class="r w849">Tax (3%)</th><th class="r w849">Payment Received</th><th class="center col-act">จัดการ</th>';
function Q849(o) {   /* Qty Invoice (SERVICE) / Qty Ad (ADVANCE) — จาก Server (RUN-848) · ยังไม่รัน = ประมาณจากข้อมูลเดิม */
  let adv = o.kind === "ADV" || o.kind === "XADV", n = Number(o.invoice_count) || 0;
  return { qi: o.svc_count != null ? Number(o.svc_count) || 0 : adv ? 0 : n, qa: o.adv_count != null ? Number(o.adv_count) || 0 : adv ? n : 0 };
}
function ST849() {
  if (document.getElementById("st849-css")) return;
  let s = document.createElement("style"); s.id = "st849-css";
  s.textContent = "@media (min-width:641px){"
    + "table:has(>#rc-tbody tr.r849){border:1px solid #D7E2F0;border-radius:8px;border-collapse:separate!important;border-spacing:0;background:#fff;overflow:hidden}"
    + "table:has(>#rc-tbody tr.r849) thead th{background:#EFF5FC!important;color:#12305f!important;border-bottom:1px solid #D7E2F0!important;border-right:1px solid #D7E2F0!important;font-weight:700!important;font-size:12.5px;white-space:nowrap!important;height:44px;text-transform:none!important}"
    + "table:has(>#rc-tbody tr.r849) thead th.h849r{background:#DCE9FB!important}table:has(>#rc-tbody tr.r849) thead th.h849a{background:#EBE1FB!important}table:has(>#rc-tbody tr.r849) thead th:last-child{border-right:0!important}table:has(>#rc-tbody tr.r849) thead th.w849{white-space:normal!important;line-height:1.2}"
    + "#rc-tbody tr.r849 td{height:44px;padding-top:3px!important;padding-bottom:3px!important;border-bottom:1px solid #D7E2F0!important;border-right:1px solid #EDF2F8;background:#fff;vertical-align:middle;white-space:nowrap;font-size:13px}"
    + "#rc-tbody tr.r849:last-child td{border-bottom:0!important}#rc-tbody tr.r849 td:last-child{border-right:0}#rc-tbody tr.r849 td.c811{white-space:normal;min-width:150px!important;max-width:300px;line-height:1.25}#rc-tbody tr.r849 td,table:has(>#rc-tbody tr.r849) thead th{padding-left:6px!important;padding-right:6px!important}"
    + "#rc-tbody tr.r849 td.m843{font-weight:600}#rc-tbody tr.r849 td.pay849{font-weight:700!important;color:#0f172a;text-align:right!important;font-variant-numeric:tabular-nums}"
    + "#rc-tbody tr.r849 .rn849{color:#1d4ed8;text-decoration:underline;font-weight:700}#rc-tbody tr.r849 .an849{color:#7c3aed;text-decoration:underline;font-weight:700}"
    + "#rc-tbody tr.r849 td.col-act>.btn{width:auto!important;min-width:60px!important;max-width:none!important;height:36px!important;padding:0 10px!important;margin:0 6px 0 0!important;font-size:12px!important;font-weight:600!important;border-radius:6px!important;display:inline-flex!important;align-items:center;justify-content:center;line-height:1!important}"
    + "#rc-tbody tr.r849 td.col-act>.btn:last-child{margin-right:0!important}"
    + ".btn.p849{background:#fff!important;border:1px solid #2563eb!important;color:#1d4ed8!important}.btn.p849:hover{background:#eff6ff!important}"
    + ".btn.ia849{display:inline-flex;align-items:center;height:26px;padding:0 8px;margin-left:4px;background:#ea580c!important;border:1px solid #ea580c!important;color:#fff!important;font-weight:700;font-size:11.5px;border-radius:6px;vertical-align:middle}"
    + "}.ch844.pm849{min-width:250px}.ch844.pm849 button:disabled{color:#94a3b8;cursor:not-allowed;background:#fff}.ch844.pm849 hr{border:0;border-top:1px solid #e2e8f0;margin:3px 0}";
  document.head.appendChild(s);
}
function RI849(o, ix, off) {
  ST811(); ST814(); ST843(); ST842(); ST844(); ST849();
  let id = i(K814(o)), adv = o.kind === "ADV" || o.kind === "XADV", rno = adv ? "" : String(o.receipt_no || ""), ano = adv ? String(o.receipt_no || "") : String(o.adv_no || "");
  let v = VL843(o, adv), q9 = Q849(o), need = adv ? 0 : Number(o.adv_need) || 0, lab = i([rno, ano].filter(Boolean).join(" + "));
  let tip = (o.kind === "XLS" || o.kind === "XADV" ? "UPLOAD EXCEL" : "ACCOUNTING") + (o.replaces_no ? " · แทน " + o.replaces_no + " (VOID)" : "");
  let ac = ano ? `<b class="an849">${i(ano)}</b>` : "-";
  if (need && o.kind === "XLS" && CAN795()) ac = (ano ? ac : "") + `<button type="button" class="btn btn-sm ia849" data-ia844="${i(o.receipt_id || "")}" title="ออกใบรับเงินสำรองจ่าย (ADV) ที่ค้าง ${N811(need)} INVOICE ของ ${i(rno)} — ไม่ออก SERVICE ซ้ำ">ออก ADV (${N811(need)})</button>`;
  return `<tr class="r811 r849" data-r811="${id}" tabindex="0" title="คลิกเพื่อดูรายการ INVOICE ของ ${lab}">`
    + `<td class="center n849" data-l="#">${N811((Number(off) || 0) + (Number(ix) || 0) + 1)}</td>`
    + `<td class="nowrap" data-l="Receipt (RCP)" title="${i(tip)}">${rno ? `<b class="rn849">${i(rno)}</b>` : "-"}</td>`
    + `<td class="nowrap" data-l="Receipt (ADV)">${ac}</td>`
    + `<td class="nowrap center" data-l="Receipt Date">${D795(o.receipt_date) || "-"}</td>`
    + `<td class="c811" data-l="Customer" title="${i(o.customer_name || "")}">${i(o.customer_name || "-")}</td>`
    + `<td class="center m843" data-l="Qty Invoice">${N811(q9.qi)}</td>`
    + `<td class="center m843" data-l="Qty Ad">${N811(q9.qa)}</td>`
    + `<td class="r m843" data-l="Service">${adv ? M795(0) : A843(v.svc)}</td>`
    + `<td class="r m843" data-l="Advance">${M795(v.advv)}</td>`
    + `<td class="r m843" data-l="VAT 7%">${adv ? M795(0) : A843(v.vat)}</td>`
    + `<td class="r m843" data-l="Total Amount">${M795(v.tot)}</td>`
    + `<td class="r m843" data-l="Tax (3%)">${v.tax ? "-" + M795(v.tax) : M795(0)}</td>`
    + `<td class="r pay849" data-l="Payment Received">${M795(v.pay)}</td>`
    + `<td class="center nowrap col-act" data-l="จัดการ"><button type="button" class="btn btn-sm b811" data-d811="${id}" title="รายละเอียด INVOICE / RCP / ADV — ${lab}">รายการ</button>`
    + `<button type="button" class="btn btn-sm p849" data-p849="${id}" aria-haspopup="menu" title="พิมพ์ / PREVIEW / ดาวน์โหลด PDF — ${lab} (เลขเดิม)">พิมพ์ ▼</button>`
    + (o.kind === "XLS" && A() ? `<button type="button" class="btn btn-sm ed837" data-e837="${i(o.receipt_id || "")}" title="แก้ไข — เพิ่ม / นำออก INVOICE · VOID ใบเดิม + ออกใบใหม่ (SUPER_ADMIN)">แก้ไข</button>` : "") + `</td></tr>`;
}
function P849(b, key) {   /* เมนู พิมพ์ ▼ : เฉพาะ SERVICE / เฉพาะ ADVANCE / ทั้ง 2 ใบ (PDF เดียว · SERVICE ก่อน) + PREVIEW + ดาวน์โหลด PDF — เอกสารที่บันทึก (ไม่ออกเลขใหม่) */
  let ps = String(key || "").split(",").filter(Boolean), A8 = ps.filter((z) => /^x?adv:/.test(z)), S8 = ps.filter((z) => !/^x?adv:/.test(z));
  ST844(); ST849(); let old = document.querySelector(".ch844"); old && old.remove();
  let m = document.createElement("div"); m.className = "ch844 pm849"; m.setAttribute("role", "menu");
  let it = (kk, l, on) => `<button type="button" role="menuitem" data-pm849="${kk}"${on ? "" : " disabled"}>${l}</button>`;
  m.innerHTML = it("S", "🖨 พิมพ์เฉพาะ SERVICE (RCP)", S8.length) + it("A", "🖨 พิมพ์เฉพาะ ADVANCE (ADV)", A8.length) + it("B", "🖨 พิมพ์ทั้ง 2 ใบ (RCP + ADV)", S8.length && A8.length)
    + "<hr>" + it("V", "👁 PREVIEW", 1) + it("D", "⬇ ดาวน์โหลด PDF", 1);
  document.body.appendChild(m); let r = b.getBoundingClientRect(); m.style.top = Math.max(8, Math.min(window.innerHeight - 232, r.bottom + 4)) + "px"; m.style.left = Math.max(8, Math.min(window.innerWidth - 270, r.left)) + "px";
  let close = () => { m.remove(); document.removeEventListener("mousedown", out, !0); document.removeEventListener("keydown", esc, !0); };
  let out = (ev) => { m.contains(ev.target) || close(); }, esc = (ev) => { ev.key === "Escape" && close(); };
  setTimeout(() => { document.addEventListener("mousedown", out, !0); document.addEventListener("keydown", esc, !0); }, 0);
  m.onclick = (ev) => { let c = ev.target.closest && ev.target.closest("[data-pm849]"); if (!c || c.disabled) return; let v = c.dataset.pm849; close();
    v === "S" ? RPR795(S8.join(","), b) : v === "A" ? RPR795(A8.join(","), b) : v === "B" ? RPR795(key, b) : v === "V" ? RG795([key]) : CH844(b, key, (kk) => SV795(kk, b)); };
}
function CX849(rows) {   /* EXPORT EXCEL = หัวตาราง / ลำดับเดียวกับหน้ารายงาน (13 คอลัมน์ · ไม่มีคอลัมน์จัดการ) */
  let ix = new Map((rows || []).map((o, j) => [o, j + 1])), ad = (o) => o.kind === "ADV" || o.kind === "XADV", V9 = (o) => VL843(o, ad(o));
  return [["#", (o) => ix.get(o) || "", "int"], ["Receipt (RCP)", (o) => (ad(o) ? "-" : o.receipt_no || "-")], ["Receipt (ADV)", (o) => (ad(o) ? o.receipt_no : o.adv_no) || "-"], ["Receipt Date", (o) => o.receipt_date, "date"], ["Customer", (o) => o.customer_name],
    ["Qty Invoice", (o) => Q849(o).qi, "int"], ["Qty Ad", (o) => Q849(o).qa, "int"], ["Service", (o) => (ad(o) ? 0 : V9(o).svc), "num"], ["Advance", (o) => V9(o).advv, "num"], ["VAT 7%", (o) => (ad(o) ? 0 : V9(o).vat), "num"],
    ["Total Amount", (o) => V9(o).tot, "num"], ["Tax (3%)", (o) => (V9(o).tax ? -V9(o).tax : 0), "num"], ["Payment Received", (o) => V9(o).pay, "num"]];
}
function RI811(o, ix, off) {
  if (!MQ849()) return RI849(o, ix, off);   /* V.849 : Desktop */
  ST811(); ST814(); ST843(); let id = i(K814(o)), no = i(o.receipt_no || ""), adv = o.kind === "ADV" || o.kind === "XADV",   /* V.838 */ an = i(o.adv_no || ""), lab = no + (o.adv_no && !adv ? " + " + an : "");
  let v = VL843(o, adv);   /* V.843 : ยอดของใบเสร็จแถวนี้ (ไม่รวมใบอื่น) */
  return `<tr class="r811" data-r811="${id}" tabindex="0" title="คลิกเพื่อดู JOB / INVOICE ทั้งหมดในใบเสร็จ ${lab}">`
    + `<td class="nowrap" data-l="เลขที่ใบเสร็จ"><b class="no811">${no}</b>${adv ? '<span class="adv814">RECEIPT ADVANCE</span>' : ""}${o.kind === "XADV" ? '<span class="adv814">UPLOAD EXCEL</span>' : ""}${o.kind === "XLS" ? '<span class="adv814">UPLOAD EXCEL</span>' + (o.replaces_no ? `<span class="rp837">แทน ${i(o.replaces_no)} (VOID)</span>` : "") : ""}</td>`
    + `<td class="nowrap" data-l="วันที่ออก">${D795(o.receipt_date) || "-"}</td>`
    + `<td class="c811" data-l="Customer" title="${i(o.customer_name || "")}">${i(o.customer_name || "-")}</td>`
    + `<td class="center" data-l="Qty Invoice">${N811(o.invoice_count)}</td>`
    + `<td class="r m843" data-l="Service">${A843(v.svc)}</td>`
    + `<td class="r m843" data-l="Advance">${M795(v.advv)}</td>`
    + `<td class="r m843" data-l="Vat 7%">${A843(v.vat)}</td>`
    + `<td class="r m843" data-l="Total Amount">${M795(v.tot)}</td>`
    + `<td class="r m843" data-l="Tax (3%)">${v.tax ? "-" + M795(v.tax) : M795(0)}</td>`
    + `<td class="r t-b" data-l="Payment Received">${M795(v.pay)}</td>`
    + `<td class="nowrap" data-l="สถานะ">${SS841(o, adv)}</td>`   /* V.841 */
    + `<td class="center nowrap col-act" data-l="จัดการ"><button type="button" class="btn btn-sm b811" data-d811="${id}" title="ดู JOB / INVOICE ทั้งหมดในใบเสร็จ ${lab}">รายการ</button>${o.kind === "XLS" && A() ? `<button type="button" class="btn btn-sm ed837" data-e837="${i(o.receipt_id || "")}" title="แก้ไข — เพิ่ม / นำออก INVOICE · VOID ใบเดิม + ออกใบใหม่ (SUPER_ADMIN)">แก้ไข</button>` : ""}`
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
  try { for (let z of ks) ds.push(/^xadv:/.test(z) ? Object.assign(await V("njacc_radv836_items", { p_id: z.slice(5) }), { __adv: 1 }) : /^adv:/.test(z) ? Object.assign(await V("njacc_radv811_items", { p_id: z.slice(4) }), { __adv: 1 }) : /^xl:/.test(z) ? await V("njacc_rcp835_items", { p_id: z.slice(3) }) : await V("njacc_rcp811_items", { p_id: z }));   /* V.830 */ }
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
  foot.querySelector('[data-x811="pr"]').onclick = (ev) => { let b9 = ev.currentTarget; CH844(b9, key, (kk) => RPR795(kk, b9)); };   /* V.849 : เลือก SERVICE / ADVANCE / ทั้งคู่ */
  foot.querySelector('[data-x811="sv"]').onclick = (ev) => { let b9 = ev.currentTarget; CH844(b9, key, (kk) => SV795(kk, b9)); };
}

function RB811(t) {   /* คลิกแถว / Enter / ปุ่มรายการ → รายละเอียด (ผูกครั้งเดียวต่อหน้า) */
  if (!t || t.__rb811) return; t.__rb811 = 1;
  t.addEventListener("click", (ev) => {
    let e8 = ev.target.closest && ev.target.closest("[data-e837]"); if (e8 && t.contains(e8)) { ev.preventDefault(); ED837(t, e8.dataset.e837); return; }   /* V.837 */
    let a8 = ev.target.closest && ev.target.closest("[data-ia844]"); if (a8 && t.contains(a8)) { ev.preventDefault(); IA844(t, a8.dataset.ia844); return; }   /* V.844 */
    let p8 = ev.target.closest && ev.target.closest("[data-p849]"); if (p8 && t.contains(p8)) { ev.preventDefault(); P849(p8, p8.dataset.p849); return; }   /* V.849 */
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
      let r = await XF734(async (pg, sz) => { let x = await L835(Object.assign({}, f, { page: pg, size: sz }));   /* V.830 */ ((x && x.rows) || []).forEach((o) => { o.__k734 = K814(o) || null; }); return x; }, 200);
      let fn = await XW734("FINANCE_RECEIPT_ISSUED", CX849(r.rows), r.rows);   /* V.849 : หัวตารางเดียวกับหน้ารายงาน */
      k("ส่งออก Excel " + r.rows.length.toLocaleString("th-TH") + " ใบเสร็จแล้ว (" + fn + ")", "ok");
    } catch (e) { k("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); }
    bt.disabled = !1; bt.innerHTML = lb;
  };
}
/* ═══ V.858 EXCEL REC (FINANCE → RECEIPT · ใบเสร็จที่ออกแล้ว) : 1 ไฟล์ = RECEIPT SUMMARY + SERVICE DETAILS + ADVANCE DETAILS (+ JOB DETAIL เมื่อ 1 INVOICE มีหลาย JOB)
   อ่านอย่างเดียว · ตัวกรองเดียวกับ EXPORT EXCEL (ทุกหน้า) · รายละเอียดจาก njacc_rcp852_detail (RUN-852) · กระทบยอดกับหน้ารายงานก่อนแจ้งผล · ไม่แก้ EXPORT EXCEL เดิม ═══ */
function XS857() { try { if (document.getElementById("xr857-css")) return; let s = document.createElement("style"); s.id = "xr857-css";
  s.textContent = ".btn.xr857{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#14532d!important;border:1px solid #052e16!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.xr857:hover:not(:disabled){background:#052e16!important}.btn.xr857:disabled{opacity:.6;cursor:wait}";
  document.head.appendChild(s); } catch (e) {} }
function XB857() { XS857(); return `<button type="button" class="btn btn-sm xr857" id="rc-xr857" title="EXCEL REC — สรุปใบเสร็จ + รายละเอียด INVOICE / JOB ทุกใบ (ตัวกรองปัจจุบัน · ทุกหน้า)">${XI734}EXCEL REC</button>`; }
function XC857(x, v, t, BD) {   /* เซลล์ 1 ช่อง (รูปแบบเดียวกับ XW734) · คืนความกว้างที่ต้องการ */
  if (t === "int") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) x.value = "-"; else { x.value = n; x.numFmt = "0"; } x.alignment = { horizontal: "center", vertical: "middle" }; x.border = BD; return 10; }
  if (t === "num") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; } else { x.value = Math.round(n * 100) / 100; x.numFmt = "#,##0.00"; x.alignment = { horizontal: "right", vertical: "middle" }; } x.border = BD; return 15; }
  if (t === "date") { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); if (m) { x.value = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); x.numFmt = "dd/mm/yyyy"; } else x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; x.border = BD; return 13; }
  let s = v == null ? "" : String(v).replace(/\s+/g, " ").trim(); x.value = s || "-"; x.alignment = { vertical: "middle", horizontal: s ? "left" : "center" }; x.border = BD; return String(x.value).length + 3;
}
async function XW857(base, sheets) {   /* หลาย SHEET : หัวตารางสี · สลับสีแถว · ทศนิยม 2 ตำแหน่ง · ตัวกรอง + Freeze หัวตารางทุก SHEET */
  let EX = await XLJ734(), wb = new EX.Workbook(), TH = { style: "thin", color: { argb: "FFD9E2EC" } }, BD = { top: TH, left: TH, bottom: TH, right: TH };
  let ZB = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF6F0" } };
  sheets.forEach((sh) => {
    let ws = wb.addWorksheet(sh.name, { views: [{ state: "frozen", ySplit: 1 }] }), cols = sh.cols, W = cols.map((c) => Math.max(10, String(c[0]).length + 4)), hr = ws.getRow(1);
    cols.forEach((c, j) => { let x = hr.getCell(j + 1); x.value = c[0]; x.font = { bold: !0, color: { argb: "FFFFFFFF" } }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sh.color || "FF14532D" } }; x.border = BD; x.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; });
    hr.height = 30;
    sh.rows.forEach((r, i) => { let row = ws.getRow(i + 2); cols.forEach((c, j) => { let x = row.getCell(j + 1), L = XC857(x, c[1](r, i), c[2], BD); i % 2 && (x.fill = ZB); W[j] = Math.min(60, Math.max(W[j], L)); }); });
    W.forEach((w, j) => { ws.getColumn(j + 1).width = w; });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sh.rows.length + 1), column: cols.length } };
  });
  let d = new Date(), p = (n) => String(n).padStart(2, "0"), fn = base + "_" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + ".xlsx";
  let buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
  a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 6e3);
  return fn;
}
function XK857(rows, det) {   /* กระทบยอดต่อใบเสร็จ : จำนวน INVOICE / INVOICE ADV + SERVICE / VAT / Total / Tax / Payment / ADVANCE = ค่าจากหน้ารายงาน */
  let bad = [], c2 = (v) => Math.round((Number(v) || 0) * 100), sv = new Map(), av = new Map();
  det.svc.forEach((x) => { let a = sv.get(x.doc) || []; a.push(x); sv.set(x.doc, a); }); det.adv.forEach((x) => { let a = av.get(x.doc) || []; a.push(x); av.set(x.doc, a); });
  rows.forEach((o) => {
    let ad = o.kind === "ADV" || o.kind === "XADV", S = sv.get(o.receipt_id) || [], A = av.get(o.receipt_id) || [], q = Q849(o), no = (ad ? "" : o.receipt_no || "") + (o.adv_no ? (ad ? "" : " / ") + o.adv_no : "");
    let sum = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0), add = (item, rep, xl) => bad.push({ no, item, rep, xl });
    let ni = new Set(S.map((x) => x.ik)).size, na = new Set(A.map((x) => x.ik)).size;
    ni !== q.qi && add("จำนวน INVOICE (Qty Invoice)", q.qi, ni); na !== q.qa && add("จำนวน INVOICE ADV (Qty Ad)", q.qa, na);
    if (!ad) {
      let ns = S.filter((x) => x.svc == null).map((x) => x.inv || "-"); ns.length && add("ไม่มียอด SERVICE ในสำเนาใบเสร็จ : " + ns.slice(0, 20).join(", ") + (ns.length > 20 ? " …" : ""), "-", ns.length + " รายการ");
      o.service_amount != null && c2(sum(S, (x) => x.svc)) !== c2(o.service_amount) && add("Service", o.service_amount, sum(S, (x) => x.svc));
      o.vat_amount != null && c2(sum(S, (x) => (x.svc == null ? 0 : Number(x.total) - Number(x.svc)))) !== c2(o.vat_amount) && add("VAT 7%", o.vat_amount, sum(S, (x) => (x.svc == null ? 0 : Number(x.total) - Number(x.svc))));
      c2(sum(S, (x) => x.total)) !== c2(o.invoice_amount) && add("Total Amount (SERVICE + VAT)", o.invoice_amount, sum(S, (x) => x.total));
      c2(sum(S, (x) => x.wht)) !== c2(o.wht_amount) && add("Tax (3%)", o.wht_amount, sum(S, (x) => x.wht));
      o.total != null && c2(sum(S, (x) => x.rcv)) !== c2(o.total) && add("Payment Received (SERVICE)", o.total, sum(S, (x) => x.rcv));
    }
    c2(sum(A, (x) => x.amt)) !== c2(o.adv_total) && add("Advance", o.adv_total || 0, sum(A, (x) => x.amt));
  });
  return bad;
}
function XR857(t) {   /* ปุ่ม EXCEL REC (ผูกครั้งเดียว) */
  let bt = t.querySelector("#rc-xr857"); if (!bt || bt.__xr857) return; bt.__xr857 = 1;
  bt.onclick = async () => {
    if (bt.disabled) return; bt.disabled = !0; let lb = bt.innerHTML; bt.textContent = "กำลังส่งออก…";
    try {
      let f = { company_group: "NJ", q: b.q || null, customer_id: b.customer || null, from: b.from || null, to: b.to || null, ...FP678(b) };   /* ตัวกรองเดียวกับ EXPORT EXCEL / หน้ารายงาน */
      let r = await XF734(async (pg, sz) => { let x = await L835(Object.assign({}, f, { page: pg, size: sz })); ((x && x.rows) || []).forEach((o) => { o.__k734 = K814(o) || null; }); return x; }, 200);
      let rows = r.rows, det = { svc: [], adv: [], job: [] };
      for (let j = 0; j < rows.length; j += 100) {
        let x = await V("njacc_rcp852_detail", { p: { company_group: "NJ", rows: rows.slice(j, j + 100).map((o) => ({ id: o.receipt_id, kind: o.kind })) } });
        ["svc", "adv", "job"].forEach((kk) => { ((x && x[kk]) || []).forEach((y) => det[kk].push(y)); });
      }
      let ix = new Map(rows.map((o, j) => [o.receipt_id, j])), H = new Map(rows.map((o) => [o.receipt_id, o])), nc = (a, b2) => String(a || "").localeCompare(String(b2 || ""), "en", { numeric: !0 });
      let srt = (a, b2) => (ix.get(a.doc) - ix.get(b2.doc)) || nc(a.no, b2.no) || nc(a.jobs, b2.jobs) || nc(a.inv, b2.inv) || ((a.ln || 0) - (b2.ln || 0));   /* ลำดับเดียวกับรายงาน (Receipt Date ล่าสุดก่อน · Receipt No.) → JOB / INVOICE */
      det.svc = det.svc.filter((x) => H.has(x.doc)).sort(srt); det.adv = det.adv.filter((x) => H.has(x.doc)).sort(srt); det.job = det.job.filter((x) => H.has(x.doc)).sort((a, b2) => (ix.get(a.doc) - ix.get(b2.doc)) || nc(a.t, b2.t) || nc(a.no, b2.no) || nc(a.inv, b2.inv) || nc(a.job, b2.job));
      let bad = XK857(rows, det), hd = (x) => H.get(x.doc) || {}, tx = (v) => (Number(v) ? -Number(v) : 0), vt = (x) => (x.svc == null ? null : Math.round((Number(x.total) - Number(x.svc)) * 100) / 100);
      let S1 = CX849(rows).map((c, j) => (j === 0 ? ["No.", c[1], c[2]] : c));   /* = หน้ารายงาน / EXPORT EXCEL (13 คอลัมน์) */
      let S2 = [["No.", (x, i) => i + 1, "int"], ["Receipt (RCP)", (x) => hd(x).receipt_no], ["Receipt Date", (x) => hd(x).receipt_date, "date"], ["Customer", (x) => x.cust || hd(x).customer_name],
        ["JOB No.", (x) => x.jobs], ["Customer Job No.", (x) => x.cjn], ["INVOICE NO.", (x) => x.inv], ["Invoice Date", (x) => x.inv_date, "date"], ["Billing Note no.", (x) => x.bn], ["Case", (x) => x.case],
        ["Service", (x) => x.svc, "num"], ["VAT 7%", vt, "num"], ["Total Amount", (x) => x.total, "num"], ["Tax (3%)", (x) => tx(x.wht), "num"], ["Payment Received", (x) => x.rcv, "num"]];
      let S3 = [["No.", (x, i) => i + 1, "int"], ["Receipt (ADV)", (x) => x.no], ["Receipt Date", (x) => x.date, "date"], ["Customer", (x) => x.cust || hd(x).customer_name],
        ["JOB No.", (x) => x.jobs], ["Customer Job No.", (x) => x.cjn], ["INVOICE ADV NO.", (x) => x.inv], ["Invoice Date", (x) => x.inv_date, "date"], ["Billing Note no.", (x) => x.bn], ["Case", (x) => x.case],
        ["Advance", (x) => x.amt, "num"], ["VAT 7%", () => 0, "num"], ["Total Amount", (x) => x.amt, "num"], ["Tax (3%)", () => 0, "num"], ["Payment Received", (x) => x.amt, "num"]];   /* ใบ ADV ไม่มี VAT / หัก ณ ที่จ่าย (ยอดใบ = ผลรวม Advance) */
      let sh = [{ name: "RECEIPT SUMMARY", cols: S1, rows }, { name: "SERVICE DETAILS", cols: S2, rows: det.svc }, { name: "ADVANCE DETAILS", cols: S3, rows: det.adv }];
      det.job.length && sh.push({ name: "JOB DETAIL", cols: [["No.", (x, i) => i + 1, "int"], ["Type", (x) => x.t], ["Receipt (RCP)", (x) => (x.t === "SERVICE" ? hd(x).receipt_no : "")], ["Receipt (ADV)", (x) => (x.t === "ADVANCE" ? x.no : "")],
        ["INVOICE NO.", (x) => x.inv], ["JOB No.", (x) => x.job], ["Customer Job No.", (x) => x.cjn], ["Service", (x) => x.svc, "num"], ["Advance", (x) => x.amt, "num"],
        ["Total Amount", (x) => (x.t === "SERVICE" ? x.total : x.amt), "num"], ["Tax (3%)", (x) => (x.t === "SERVICE" ? tx(x.wht) : 0), "num"], ["Payment Received", (x) => (x.t === "SERVICE" ? x.rcv : x.amt), "num"]], rows: det.job });   /* ยอดระดับ JOB = รายการจริงในใบเสร็จ (ไม่นับซ้ำใน SERVICE / ADVANCE DETAILS) */
      bad.length && sh.push({ name: "CHECK", color: "FFB91C1C", cols: [["No.", (x, i) => i + 1, "int"], ["Receipt", (x) => x.no], ["รายการที่ไม่ตรง", (x) => x.item], ["หน้ารายงาน", (x) => x.rep], ["ใน EXCEL REC", (x) => x.xl]], rows: bad });
      let fn = await XW857("FINANCE_EXCEL_REC", sh), nr = [...new Set(bad.map((x) => x.no))];
      bad.length ? k("EXCEL REC : ข้อมูลไม่ครบ / ยอดไม่ตรง " + nr.length + " ใบเสร็จ — " + nr.slice(0, 5).join(", ") + (nr.length > 5 ? " …" : "") + " (ดู SHEET CHECK ในไฟล์ " + fn + ")", "err")
        : k("ส่งออก EXCEL REC ครบถ้วน " + rows.length.toLocaleString("th-TH") + " ใบเสร็จ · INVOICE " + det.svc.length.toLocaleString("th-TH") + " · INVOICE ADV " + det.adv.length.toLocaleString("th-TH") + " — ยอดตรงกับรายงาน (" + fn + ")", "ok");
    } catch (e) { k("ส่งออก EXCEL REC ไม่สำเร็จ — " + (e && e.message || e), "err"); }
    bt.disabled = !1; bt.innerHTML = lb;
  };
}
function CX811(lab) { let V = (o) => VL843(o, o.kind === "ADV" || o.kind === "XADV");   /* V.843 : คอลัมน์เดียวกับหน้ารายงาน */
  return [["Receipt No", (o) => o.receipt_no], ["Receipt Date", (o) => o.receipt_date, "date"], ["Customer", (o) => o.customer_name], ["Qty Invoice", (o) => o.invoice_count, "int"],
  ["Service", (o) => V(o).svc, "num"], ["Advance", (o) => V(o).advv, "num"], ["Vat 7%", (o) => V(o).vat, "num"], ["Total Amount", (o) => V(o).tot, "num"],
  ["Tax (3%)", (o) => V(o).tax, "num"], ["Payment Received", (o) => V(o).pay, "num"],
  ["สถานะ", (o) => (o.status === "VOID_RESET" ? "ยกเลิก" : "ออกใบเสร็จแล้ว")], ["JOB No.", (o) => o.job_nos], [lab, (o) => o.invoice_nos]]; }
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

/* ═══ V.815 (RUN-820) · FINANCE → RECEIPT (รอรับชำระ) : UPLOAD EXCEL — Billing Note no. จาก APL Billing · CASE → Case (V.828 · RUN-832) · ตรวจซ้ำ 3 กรณี · ยึดไฟล์ล่าสุด
   อ่านหัวคอลัมน์จากชื่อจริง (ไม่ยึดตำแหน่ง) · ข้ามแถว TOTAL · Name CS / Status / Contact ห้ามนำเข้า · คอลัมน์อื่นที่ไม่มีฟิลด์รองรับ = ข้าม · ไม่สร้าง INVOICE
   ตรวจ (njacc_bn820_check · อ่านอย่างเดียว) → Preview → ยืนยัน → บันทึก (njacc_bn820_save · ธุรกรรมเดียว · เฉพาะค่าที่เปลี่ยน) · ค่าว่างไม่ลบค่าเดิม ═══ */
var BK820 = { namecs: "Name CS", status: "Status", contact: "Contact" };
function NH820(h) { return String(h == null ? "" : h).toLowerCase().replace(/[\s._\-\/()#:]+/g, ""); }
function TX820(v) { return v == null ? "" : String(v).replace(/ /g, " ").trim(); }
function DT820(d) { try { let p = (n) => String(n).padStart(2, "0"); d = new Date(d); return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); } catch (e) { return ""; } }
function UPB820(t) {   /* ปุ่ม UPLOAD EXCEL (สีส้ม) ต่อจากปุ่มคอลัมน์ */
  try {
    if (!t || !A()) return; let bar = t.querySelector("#rc-pending .fbar"); if (!bar || bar.querySelector("#rp-up820")) return; ST820();   /* V.828 : UPLOAD / ยืนยันบันทึก = SUPER_ADMIN เท่านั้น (Server ตรวจซ้ำ RUN-832) */
    let b = document.createElement("button"); b.type = "button"; b.className = "btn btn-sm up820"; b.id = "rp-up820"; b.textContent = "⬆ UPLOAD EXCEL"; b.title = "นำเข้าข้อมูลรอรับชำระจาก Excel .xlsx / .xls ทุกคอลัมน์ที่หน้ารายงานรองรับ · APL Billing → Billing Note no. · CASE → Case — เลือกได้หลายไฟล์ (SUPER_ADMIN)";
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
  [["dclinv", "dclinvoice"], "source_invoice_no", "Invoice No. * (คอลัมน์ Invoice ต้นทาง (Source))", "text"],
  [["houseblno", "housebl"], "house_bl_no", "House B/L No.", "text"],
  [["master", "masterbl", "masterblno"], "master_bl_no", "Master B/L No.", "text"],
  [["servicecharge"], "service_amount", "Service charge", "num"],
  [["advance"], "advance_amount", "Advance", "num"],
  [["vat7%", "vat", "vat7"], "vat_amount", "VAT 7%", "num"],
  [["amount"], "subtotal", "Amount", "num"],
  [["wht3%", "wht", "wht3"], "wht_amount", "WHT 3%", "num"],
  [["totalamout", "totalamount"], "net_payable", "Total Amount", "num"],
  [["case"], "case_no", "CASE", "text"]   /* V.828 (RUN-832) : Excel CASE → CASE เท่านั้น (ไม่ใช่ Billing Note no.) */
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
      if (n === "invoiceno" && ix.inv < 0) { ix.inv = j; o.used.push(h + " → INVOICE NJ (คอลัมน์ Invoice No. · จับคู่ / ตรวจซ้ำ)"); return; }
      if (n === "aplbilling" && ix.apl < 0) { ix.apl = j; o.used.push(h + " → Billing Note no."); return; }
      if (n === "billingnoteno") { o.skipped.push(h + " (ไม่อยู่ใน Mapping — Billing Note no. รับจาก APL Billing เท่านั้น)"); return; }   /* V.828 */
      if (BK820[n]) { o.skipped.push(h + " (ห้ามนำเข้า)"); return; }
      let m = MP823.find((z) => z[0].includes(n));
      if (m && fx[m[1]] == null) { fx[m[1]] = j; o.used.push(h + " → " + m[2]); return; }
      o.skipped.push(h + (m ? " (ซ้ำ — ใช้คอลัมน์แรก)" : " (ไม่มีคอลัมน์ในหน้ารายงาน)")); });
    o.sheet = sn;
    for (let j = hi + 1; j < A.length; j++) {
      let r = A[j] || [], w = W[j] || [];
      if (!r.some((c) => TX820(c))) { o.blank++; continue; }
      if (r.some((c) => TX820(c).toUpperCase() === "TOTAL")) { o.total++; continue; }
      let inv = TX820(r[ix.inv]), apl = ix.apl >= 0 ? TX820(r[ix.apl]) : "", rn = r0 + j + 1;
      if (!inv) { o.rows.push({ seq, r: rn, inv: "", key: "", apl, cs: fx.case_no != null ? TX820(r[fx.case_no]) : "", v: "", bad: "ไม่มี Invoice No." }); continue; }
      let d = {}, warn = [];
      MP823.forEach((m) => { let c = fx[m[1]]; if (c == null) return; let t = TX820(r[c]);
        if (m[3] === "num") { let x = NUM823(w[c] !== "" ? w[c] : t); if (Number.isNaN(x)) { warn.push(m[2] + " ไม่ใช่ตัวเลข (" + t + ")"); d[m[1]] = null; } else if (x != null) d[m[1]] = x; }
        else if (m[3] === "date") { if (t) { let x = DT823(w[c], t, XL); x ? (d[m[1]] = x) : warn.push(m[2] + " อ่านวันที่ไม่ได้ (" + t + ")"); } }
        else if (t) d[m[1]] = t.slice(0, 300); });
      let x = { seq, r: rn, inv, key: inv.toUpperCase(), apl, cs: d.case_no || "", v: apl, cf: !1, d, warn };   /* V.828 (RUN-832) : Billing Note no. = APL Billing เท่านั้น · CASE = d.case_no (แยกกัน 100%) */
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
    else if (fi) {   /* INVOICE ในระบบ : อัปเดตเฉพาะ Billing Note no. (จาก APL Billing) และ CASE (จาก CASE) แยกกัน · ยอด / คอลัมน์อื่น = ข้อมูลจาก ACCOUNTING เดิม · V.828 (RUN-832) */
      let cs = d.case_no || "", cc = fi.case_cur == null ? null : fi.case_cur, cd = cc != null ? cc : fi.job_case || null;   /* CASE ที่แสดงอยู่ = CASE จาก UPLOAD (FINANCE) หรือ Case ของ JOB */
      let bn = !v ? 0 : row.cur == null ? 1 : row.cur === v ? 0 : 2, cn = !cs ? 0 : cd == null ? 1 : cd === cs ? 0 : 2;
      row.ccur = cd; row.cold = cc; row.bnS = bn > 0; row.csS = cn > 0;
      bn === 2 && row.diff.push(["billing_note", row.cur, v]); cn === 2 && row.diff.push(["case_no", cd, cs]);
      if (!bn && !cn) { row.st = "SAME"; row.why = !v && !cs ? (row.cur || cd ? "ค่าว่างในไฟล์ — คงค่าเดิม (ไม่ลบ)" : "INVOICE ในระบบ · ไม่มีค่า APL Billing / CASE") : "ข้อมูลซ้ำ ไม่เปลี่ยนแปลง"; }
      else if (bn === 2 || cn === 2) { row.st = "CHG"; row.why = "ข้อมูลซ้ำ มีการเปลี่ยนแปลง"; }
      else { row.st = "NEW"; row.why = "INVOICE ในระบบ · " + [bn ? "Billing Note no. ใหม่" : "", cn ? "CASE ใหม่" : ""].filter(Boolean).join(" · "); }
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
    row.dup = !!fi || row.cur != null || !!row.ex || row.cross || row.inFile || row.prior;   /* V.828 : INVOICE ที่มีอยู่แล้ว (ในระบบ / นำเข้าเดิม) = ซ้ำ → เตือนก่อนบันทึก */
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
  ST823(); ST829();
  let body = document.createElement("div"), foot = document.createElement("div"), st = { ck: null, rows: [], pick: new Map(), f: "ALL", busy: !1, req: "bn820-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)), done: !1 };
  body.className = "up820-m"; foot.className = "up820-foot";
  foot.innerHTML = '<button type="button" class="btn btn-o" data-close>ยกเลิก</button><button type="button" class="btn btn-o" id="up820-xl">EXPORT EXCEL รายการซ้ำ / ผิดพลาด</button><button type="button" class="btn btn-o" id="up820-dup">ดูรายการซ้ำ</button><button type="button" class="btn up820-ok" id="up820-ok" disabled>ยืนยันใช้ไฟล์ล่าสุด</button>';
  Q({ title: "UPLOAD EXCEL — ตรวจสอบก่อนบันทึก (รอรับชำระ)", body, footer: foot, fullscreen: !0, wide: !0 });
  body.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลกับระบบ…</div></div>';
  let q = (s) => body.querySelector(s) || foot.querySelector(s), ok = q("#up820-ok");
  let L = { NEW: "ค่าใหม่ (INVOICE ในระบบ)", IMP: "เพิ่มใหม่ (นำเข้า Excel)", SAME: "ข้อมูลซ้ำ ไม่เปลี่ยนแปลง", CHG: "ข้อมูลซ้ำ มีการเปลี่ยนแปลง", ERR: "ข้อมูลผิดพลาด" };
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
      + `<div class="up820-sum">${[["ALL", "รายการทั้งหมด", C.all], ["OK", "INVOICE ที่นำเข้าได้", C.okk], ["DUP", "INVOICE ซ้ำ", C.dup], ["IMP", "INVOICE เพิ่มใหม่", C.imp], ["SYS", "INVOICE ในระบบ (Billing Note / CASE)", C.sys], ["CHG", "ข้อมูลเปลี่ยน", C.chg], ["SAME", "ไม่เปลี่ยน", C.same], ["REV", "รอตรวจสอบ (ยอดไม่ครบ)", C.rv], ["ERR", "ผิดพลาด", C.err]]
          .map((z) => `<button type="button" class="up820-c${st.f === z[0] ? " on" : ""}${z[0] === "ERR" && z[2] ? " u823-bad" : ""}" data-f820="${z[0]}"><span>${z[1]}</span><b>${z[2].toLocaleString("th-TH")}</b></button>`).join("")}</div>`
      + `<div class="up820-note">ซ้ำข้ามไฟล์ ${C.cross.toLocaleString("th-TH")} · ซ้ำในไฟล์เดียวกัน ${C.inF.toLocaleString("th-TH")} · ยึดข้อมูลจากไฟล์ที่ระบบรับล่าสุด (ทีละช่อง · ช่องว่างไม่เขียนทับ) · <b>APL Billing → Billing Note no. · CASE → Case (แยกกัน ไม่รวม / ไม่สลับ)</b> · INVOICE ที่มีในระบบ = อัปเดตเฉพาะ Billing Note no. และ CASE · INVOICE ที่ไม่มีในระบบ = เพิ่มเป็นรายการนำเข้าจาก Excel ในแถบรอรับชำระ (ไม่สร้าง INVOICE / ไม่ออกเลข RECEIPT / ออกใบเสร็จไม่ได้) · ไม่นำเข้า Status / Name CS / Contact</div>`
      + AN828(st.rows)   /* V.828 : ข้อสังเกต Billing Note no. ซ้ำผิดปกติ (ไม่ตัดข้อมูล) */
      + (C.need ? `<div class="up820-e">มี ${C.need.toLocaleString("th-TH")} รายการที่ APL Billing ≠ CASE — กรุณาเลือกค่าที่ใช้ก่อนบันทึก (ตัวกรอง "ผิดพลาด")</div>` : "")
      + `<div class="tbl-wrap up820-w2"><table class="tbl up820-t up820-r"><thead><tr><th>#</th><th>INVOICE NJ</th><th>DATE</th><th>ลูกค้า</th><th>บริษัท INVOICE</th><th>Invoice No. *</th><th class="r">SERVICE CHARGE</th><th class="r">ADVANCE</th><th class="r">VAT 7%</th><th class="r">AMOUNT</th><th class="r">WHT 3%</th><th class="r">TOTAL AMOUNT</th><th>Billing Note no. (APL Billing)</th><th>CASE</th><th>ค่าเดิม → ค่าใหม่</th><th>ไฟล์ (ลำดับ) · แถว</th><th>ผลการตรวจสอบ</th></tr></thead><tbody>`
      + (show.length ? show.map((r, j) => { let d = am(r), mn = (k) => `<td class="r" data-l="${LB823(k)}">${d[k] == null || d[k] === "" ? "-" : FV823(k, d[k])}</td>`, sv = (k) => (r.imp && d[k] != null && d[k] !== "" ? i(FV823(k, d[k])) : "-");   /* V.828 (RUN-832) : ลำดับตามสเปก — INVOICE NJ · DATE · ลูกค้า · บริษัท INVOICE · ยอด · Billing Note no. · CASE · ผลการตรวจสอบ */
          return `<tr class="s820-${r.st}"><td class="center" data-l="#">${j + 1}</td><td class="nowrap" data-l="INVOICE NJ"><b>${i(r.ino || r.inv || "-")}</b>${r.key ? `<div><small class="b823s ${r.imp ? "b823s-x" : "b823s-s"}">${r.imp ? "นำเข้า Excel" : "INVOICE ในระบบ"}</small></div>` : ""}</td>`
          + `<td class="nowrap" data-l="DATE">${sv("doc_date")}</td><td data-l="ลูกค้า">${r.imp ? i(d.customer_name || "-") : "(INVOICE ในระบบ)"}</td><td data-l="บริษัท INVOICE">${sv("company_invoice")}</td><td data-l="Invoice No. *">${sv("source_invoice_no")}</td>`
          + (r.imp ? NUMK823.map(mn).join("") : `<td colspan="6" class="t-3 center" data-l="ยอด"><small>ยอดตาม INVOICE ในระบบ (ไม่เปลี่ยน)</small></td>`)
          + `<td data-l="Billing Note no. (APL Billing)"><b>${i(r.v || "-")}</b></td><td data-l="CASE"><b>${i(r.cs || "-")}</b></td>`
          + `<td data-l="ค่าเดิม → ค่าใหม่">${r.diff.length ? r.diff.map((z) => `<div class="u823-df"><small>${i(LB823(z[0]))} :</small> <s>${i(FV823(z[0], z[1]))}</s> → <b>${i(FV823(z[0], z[2]))}</b></div>`).join("") : r.imp ? (r.ex ? '<small class="t-3">เหมือนเดิม</small>' : '<small class="t-3">-</small>') : `<small>Billing Note : ${i(r.cur == null ? "-" : r.cur)}${r.sys ? ` (BILLING : ${i(r.sys)})` : ""} · CASE : ${i(r.ccur == null ? "-" : r.ccur)}</small>`}</td>`
          + `<td data-l="ไฟล์ · แถว"><small>${i(r.file ? r.file.name : "-")} (${r.seq || "-"}) · แถว ${r.r || "-"}${r.cross ? " · พบในไฟล์ " + r.files.join(", ") : ""}${r.inFile ? " · ซ้ำในไฟล์" : ""}</small></td>`
          + `<td data-l="ผลการตรวจสอบ"><span class="b820 b820-${r.st === "IMP" ? "NEW" : r.st}">${L[r.st]}</span><small class="t-3"> ${i(r.why || "")}</small>${r.imp && r.st !== "ERR" && r.rv ? `<div><span class="b823r">รอตรวจสอบ</span> <small>${i(r.rv)}</small></div>` : ""}${(r.warn || []).length ? `<div><small class="up820-w">${i(r.warn.join(" · "))}</small></div>` : ""}</td></tr>`; }).join("")
        : '<tr><td colspan="17" class="empty">ไม่มีรายการ</td></tr>') + `</tbody></table></div>`
      + (fl.length > show.length ? `<div class="up820-note">แสดง ${show.length.toLocaleString("th-TH")} จาก ${fl.length.toLocaleString("th-TH")} รายการ — ดูทั้งหมดได้จาก EXPORT EXCEL</div>` : "");
    body.querySelectorAll("[data-f820]").forEach((b) => { b.onclick = () => { st.f = b.dataset.f820; draw(); }; });
    body.querySelectorAll("[data-p820]").forEach((x) => { x.onchange = () => { st.pick.set(x.dataset.p820, x.value); recalc(); }; });
    if (st.rcEl && !st.job) body.prepend(st.rcEl); if (st.pgEl) body.prepend(st.pgEl);   /* V.823 : คงแถบสถานะการบันทึกเมื่อวาดใหม่ */
    ok.disabled = st.busy || st.done || !files.some((f) => !f.err);
  };
  let recalc = () => { st.rows = MG820(files.filter((f) => !f.err), st.ck.found, st.ck.prior, st.pick, st.ck.imported, st.ck.rx); draw(); };
  let load = async () => { try { st.ck = await CK820(files.filter((f) => !f.err)); recalc(); } catch (e) { body.innerHTML = `<div class="up820-e">${i(RE820(e))}</div>`; } };
  q("#up820-dup").onclick = () => { if (!st.ck) return; st.f = "DUP"; draw(); };
  q("#up820-xl").onclick = async (ev) => {
    let b = ev.currentTarget; if (b.disabled || !st.ck) return; b.disabled = !0;
    try { let rows = st.rows.filter((r) => (r.dup && r.key) || r.st === "ERR" || (r.imp && r.rv));
      let fn = await XW734("FINANCE_RECEIPT_UPLOAD_CHECK", [["INVOICE NJ", (r) => r.inv], ["DATE", (r) => (r.imp ? am(r).doc_date : null), "date"], ["บริษัท INVOICE", (r) => (r.imp ? am(r).company_invoice : null)], ["Invoice No. *", (r) => (r.d || {}).source_invoice_no], ["แหล่งข้อมูล", (r) => (r.key ? (r.imp ? "นำเข้า Excel" : "INVOICE ในระบบ") : "")], ["ไฟล์", (r) => r.file && r.file.name], ["ลำดับไฟล์", (r) => r.seq, "int"], ["แถว", (r) => r.r, "int"],
        ["ลูกค้า", (r) => am(r).customer_name], ["Service charge", (r) => am(r).service_amount, "num"], ["Advance", (r) => am(r).advance_amount, "num"], ["VAT 7%", (r) => am(r).vat_amount, "num"], ["Amount", (r) => am(r).subtotal, "num"], ["WHT 3%", (r) => am(r).wht_amount, "num"], ["Total Amount", (r) => am(r).net_payable, "num"],
        ["APL Billing → Billing Note no.", (r) => r.v], ["CASE → Case", (r) => r.cs], ["ค่าเดิม (Billing Note)", (r) => r.cur], ["Billing Note (BILLING จริง)", (r) => r.sys], ["ค่าเดิม (CASE)", (r) => r.ccur],
        ["ค่าเดิม → ค่าใหม่", (r) => (r.diff || []).map((z) => LB823(z[0]) + " : " + FV823(z[0], z[1]) + " → " + FV823(z[0], z[2])).join(" | ")], ["สถานะ", (r) => L[r.st]], ["รายละเอียด", (r) => r.why], ["รอตรวจสอบ", (r) => r.rv || ""],
        ["ซ้ำข้ามไฟล์", (r) => (r.cross ? "ใช่ (" + r.files.join(", ") + ")" : "")], ["ซ้ำในไฟล์", (r) => (r.inFile ? "ใช่" : "")]], rows);
      k("ส่งออก Excel " + rows.length.toLocaleString("th-TH") + " รายการแล้ว (" + fn + ")", "ok"); }
    catch (e) { k("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); } finally { b.disabled = !1; }
  };
  ok.onclick = async () => {
    if (st.busy || st.done || !st.ck) return; let C = cnt();
    if (st.job && st.q828) { await SV828(); return; }   /* V.823 : ดำเนินการต่อ (เฉพาะ BATCH ที่ยังไม่สำเร็จ) */
    if (C.need) { st.f = "ERR"; draw(); k("กรุณาเลือกค่า APL Billing / CASE ที่ไม่ตรงกันก่อนบันทึก (" + C.need + " รายการ)", "err"); return; }
    if (!C.save) { k("ไม่มีรายการที่ต้องบันทึก — ข้อมูลเหมือนเดิมทั้งหมด", "ok"); return; }
    let a = await AK820(files, C); if (a === "dup") { st.f = "DUP"; draw(); return; } if (a !== "ok") return;
    let items = st.rows.filter((r) => !r.imp && (r.st === "NEW" || r.st === "CHG") && r.id && r.v && r.bnS).map((r) => ({ invoice_id: r.id, invoice_no: r.ino, value: r.v, old: r.cur, file_seq: r.seq }));
    let cases = st.rows.filter((r) => !r.imp && (r.st === "NEW" || r.st === "CHG") && r.id && r.csS && r.d && r.d.case_no).map((r) => ({ invoice_id: r.id, invoice_no: r.ino, value: r.d.case_no, old: r.cold, file_seq: r.seq }));   /* V.828 (RUN-832) */
    let imports = st.rows.filter((r) => r.imp && (r.st === "IMP" || r.st === "CHG")).map((r) => Object.assign({ invoice_no: r.inv, ver: r.ex ? r.ex.ver : null, file_seq: r.seq, row_no: r.r, billing_note: r.v || null }, r.d));
    let fz = files.filter((f) => !f.err).map((f) => ({ seq: f.seq, name: f.name, hash: f.hash, size: f.size, sheet: f.sheet, received_at: f.at, columns_used: f.used, columns_skipped: f.skipped,
      stats: { rows: f.rows.length, total_rows_skipped: f.total, new: st.rows.filter((r) => r.seq === f.seq && r.st === "NEW").length, imported_new: st.rows.filter((r) => r.seq === f.seq && r.st === "IMP").length, changed: st.rows.filter((r) => r.seq === f.seq && r.st === "CHG").length,
               unchanged: st.rows.filter((r) => r.seq === f.seq && r.st === "SAME").length, review: st.rows.filter((r) => r.seq === f.seq && r.imp && r.rv && r.st !== "ERR").length, errors: st.rows.filter((r) => r.seq === f.seq && r.st === "ERR").length } }));
    st.busy = !0; ok.disabled = !0; ok.textContent = "กำลังเริ่มบันทึก…";
    try {   /* V.823 (RUN-828) : เริ่ม Import (Import ID + ประวัติไฟล์ · ยังไม่บันทึกรายการ) → บันทึกทีละ BATCH */
      st.job = await V("njacc_rx828_begin", { p: { request_id: st.req, files: fz, total_items: items.length + cases.length, total_imports: imports.length } });
      if (!st.job || !st.job.job_id) throw new Error("NJACC_RX828_NO_JOB");
    } catch (e) {
      st.busy = !1; ok.disabled = !1; ok.textContent = "ยืนยันใช้ไฟล์ล่าสุด";
      st.job = null; if (/njacc_rx828|PGRST202|Could not find the function|NJACC_RX828_NO_JOB/i.test(String(e && e.message || e))) { k("ระบบฐานข้อมูลยังไม่พร้อมบันทึกแบบ BATCH (ต้องรัน RUN-828) — ยังไม่ได้บันทึก", "err"); return; }
      k("เริ่มบันทึกไม่สำเร็จ — " + RE820(e), "err"); return;
    }
    let units = items.map((o) => ({ i: o })).concat(cases.map((o) => ({ c: o })), imports.map((o) => ({ m: o })));
    st.same828 = C.same;   /* V.828 : รายการซ้ำที่ไม่เปลี่ยน = ข้าม (ไม่ส่งบันทึก) */
    st.sz828 = 500; st.seq828 = 0; st.q828 = [];
    for (let j = 0; j < units.length; j += st.sz828) st.q828.push({ seq: ++st.seq828, u: units.slice(j, j + st.sz828), done: !1, err: "" });
    st.tot828 = units.length; st.busy = !1;
    await SV828();
  };
  /* ═══ V.823 (RUN-828) · บันทึกทีละ BATCH (ธุรกรรมของตัวเอง · ทีละชุดตามลำดับ · ไม่ส่งพร้อมกัน)
     BATCH เริ่มต้น 500 รายการ (วัดจริง ≈ 130 ms / BATCH) · Timeout = ตรวจสถานะใน Database ก่อน → แบ่ง BATCH เล็กลง (ต่ำสุด 50) · Network / 5xx = ลองใหม่สูงสุด 3 ครั้ง (1 / 2 / 4 วินาที)
     ข้อมูลผิดเงื่อนไข (INVALID / CHANGED) = บันทึกสาเหตุ แล้วทำ BATCH ถัดไป (รายการอื่นไม่หาย) · จบ = ตรวจจำนวนจริงจาก Database (njacc_rx828_finish) ═══ */
  let SV828 = async () => {
    if (st.busy) return; st.busy = !0; ok.disabled = !0; ok.textContent = "กำลังบันทึก…";
    if (st.rcEl) { st.rcEl.remove(); st.rcEl = null; }   /* เริ่ม Import ใหม่แล้ว = ซ่อนแจ้งเตือน Import ค้าง */
    let em = (e) => { let m = String(e && e.message || e || ""); return /NJACC_BN820_CHANGED/.test(m) ? "ข้อมูลรายการนี้ถูกบันทึก / แก้ไขไปแล้วหลังการตรวจ (ไม่บันทึกทับ) — Refresh แล้วอัปโหลดไฟล์เดิมเพื่อตรวจใหม่" : RE820(e); };
    let biz = (m) => /NJACC_BN820_(INVALID|CHANGED|TOO_MANY)|NJACC_(MODULE_)?FORBIDDEN|NJACC_NO_PROFILE|NJACC_RX828_(NO_JOB|BAD_SEQ|EMPTY|BATCH_TOO_BIG)/.test(m);
    let tmo = (m) => /statement timeout|57014|canceling statement/i.test(m);
    let wait = (ms) => new Promise((z) => setTimeout(z, ms));
    let stop = null;
    PG828("run");
    for (let n = 0; n < st.q828.length; n++) {
      let b = st.q828[n]; if (b.done || b.skip) continue;
      for (let at = 0; ; at++) {
        st.cur828 = b.seq; let p = { job_id: st.job.job_id, seq: b.seq, items: b.u.filter((x) => x.i).map((x) => x.i), cases: b.u.filter((x) => x.c).map((x) => x.c), imports: b.u.filter((x) => x.m).map((x) => x.m) };
        try { let r = await V("njacc_rx828_run", { p }); b.done = !0; b.err = ""; b.biz = !1; b.res = r && r.result; PG828("run"); break; }
        catch (e) {
          let m = String(e && e.message || e || "") + (e && e.code ? " [" + e.code + "]" : "");
          if (biz(m)) {   /* ข้อมูลผิดเงื่อนไข = BATCH นี้ไม่ถูกบันทึก (Rollback ทั้งชุด) → แยกครึ่งเพื่อหารายการที่ผิดจริง · รายการอื่นบันทึกต่อได้ · สิทธิ์ / Import ไม่ถูกต้อง = หยุด */
            let fatal = /FORBIDDEN|NO_PROFILE|NJACC_RX828_/.test(m);
            try { await V("njacc_rx828_fail", { p: { job_id: st.job.job_id, seq: b.seq, units: b.u.length, error: m.slice(0, 1800) } }); } catch (x) {}
            if (!fatal && b.u.length > 1) { let h = Math.ceil(b.u.length / 2); b.skip = !0; b.err = "แยกตรวจรายการที่ผิดพลาด";
              st.q828.splice(n + 1, 0, { seq: ++st.seq828, u: b.u.slice(0, h), done: !1, err: "" }, { seq: ++st.seq828, u: b.u.slice(h), done: !1, err: "" }); PG828("run"); break; }
            b.err = em(e) + (b.u.length === 1 ? " — INVOICE " + ((b.u[0].i || b.u[0].c || b.u[0].m || {}).invoice_no || "-") : ""); b.biz = !0; if (fatal) stop = b; PG828("run"); break;
          }
          let s = null; try { s = await V("njacc_rx828_status", { p: { job_id: st.job.job_id } }); } catch (x) {}   /* ตรวจใน Database ก่อน Retry (คำขอเดิมอาจสำเร็จแล้วแต่ผลตอบกลับหาย) */
          let db = s && (s.batches || []).find((z) => z.seq === b.seq);
          if (db && db.status === "DONE") { b.done = !0; b.err = ""; PG828("run"); break; }
          if (tmo(m) && b.u.length > 50) {   /* Timeout = แบ่ง BATCH เล็กลง (เฉพาะชุดนี้และชุดถัดไป) */
            try { await V("njacc_rx828_fail", { p: { job_id: st.job.job_id, seq: b.seq, units: b.u.length, error: m.slice(0, 1800) } }); } catch (x) {}
            st.sz828 = Math.max(50, Math.floor(b.u.length / 2)); b.skip = !0; b.err = "แบ่งเป็น BATCH ย่อย (" + st.sz828 + " รายการ)";
            let parts = []; for (let j = 0; j < b.u.length; j += st.sz828) parts.push({ seq: ++st.seq828, u: b.u.slice(j, j + st.sz828), done: !1, err: "" });
            st.q828.splice(n + 1, 0, ...parts); PG828("run"); break;
          }
          if (at < 3) { b.err = "ลองใหม่ครั้งที่ " + (at + 1) + " — " + m.slice(0, 120); PG828("run"); await wait(1000 * Math.pow(2, at)); continue; }
          b.err = em(e); try { await V("njacc_rx828_fail", { p: { job_id: st.job.job_id, seq: b.seq, units: b.u.length, error: m.slice(0, 1800) } }); } catch (x) {}
          stop = b; break;
        }
      }
      if (stop) break;
    }
    let fin = null; try { fin = await V("njacc_rx828_finish", { p: { job_id: st.job.job_id } }); st.fin828 = fin; } catch (e) { st.fin828 = null; }
    if (!st.file828 && st.job && st.job.uploads) {   /* เก็บไฟล์ต้นทาง (ครั้งเดียว) */
      st.file828 = !0;
      for (let u of st.job.uploads || []) { let f = files.find((z) => z.seq === u.seq); if (!f || !f.raw || f.raw.size > 10e6) continue;
        try { let b64 = await new Promise((res, rej) => { let fr = new FileReader(); fr.onload = () => res(String(fr.result).replace(/^data:[^,]*,/, "")); fr.onerror = rej; fr.readAsDataURL(f.raw); }); await V("njacc_bn820_file", { p_upload: u.id, p_b64: b64 }); }
        catch (e) { try { console.warn("BN820 file", e); } catch (z) {} } }
    }
    let left = st.q828.filter((b) => !b.done && !b.skip), all = !!fin && fin.status === "DONE" && !left.length;
    st.busy = !1; st.done = all; ok.disabled = all; ok.textContent = all ? "✅ บันทึกแล้ว" : "ดำเนินการต่อ";
    PG828(all ? "ok" : "part", stop);
    let n0 = (v) => Number(v || 0).toLocaleString("th-TH");
    if (all) k("บันทึกลงฐานข้อมูลสำเร็จ " + n0(fin.saved) + " / " + n0(fin.total) + " รายการ (ตรวจใน Database : นำเข้า " + n0(fin.db_imported) + " · Billing Note " + n0(fin.db_billing) + ")", "ok");
    else k("บันทึกสำเร็จบางส่วน — สำเร็จ " + n0(fin ? fin.saved : st.q828.filter((b) => b.done).reduce((s, b) => s + b.u.length, 0)) + " / " + n0(st.tot828) + " · คงเหลือ " + n0(left.reduce((s, b) => s + b.u.length, 0)) + " รายการ — กด \"ดำเนินการต่อ\" เพื่อบันทึกเฉพาะส่วนที่เหลือ", "err");
    try { OP797(t, !0); } catch (e) {}   /* V.829 : ตัวเลือก Dropdown ใหม่ (ชื่อจาก Excel) */
    try { let g = t.querySelector("#rp-go"); g && g.click(); } catch (e) {}
  };
  /* แถบความคืบหน้า (จำนวนจาก BATCH ที่ Database ยืนยันแล้ว · จบ = จำนวนจาก njacc_rx828_finish) */
  let PG828 = (mode, stop) => {
    let el = st.pgEl || (st.pgEl = document.createElement("div")); el.className = "up828-pg" + (mode === "ok" ? " ok" : mode === "part" ? " part" : "");
    let ok8 = st.q828.filter((b) => b.done).reduce((s, b) => s + b.u.length, 0), bad = st.q828.filter((b) => !b.done && !b.skip && b.biz), badN = bad.reduce((s, b) => s + b.u.length, 0);
    let F = st.fin828, tot = st.tot828 || 0, sv = mode !== "run" && F ? Number(F.saved || 0) : ok8, rem = Math.max(0, tot - sv), pc = tot ? Math.floor((sv / tot) * 1000) / 10 : 0, n0 = (v) => Number(v || 0).toLocaleString("th-TH");
    let ttl = mode === "ok" ? "✅ UPLOAD EXCEL — บันทึกสำเร็จ (ตรวจจำนวนใน Database แล้ว)" : mode === "part" ? "⚠️ UPLOAD EXCEL — บันทึกสำเร็จบางส่วน" : "UPLOAD EXCEL — กำลังบันทึกข้อมูล";
    el.innerHTML = `<div class="up828-h">${ttl}${st.job ? ` <small>Import ID : ${i(String(st.job.job_id).slice(0, 8))}</small>` : ""}</div>`
      + `<div class="up828-g"><span>รายการทั้งหมด <b>${n0(tot)}</b></span><span>บันทึกสำเร็จ <b>${n0(sv)}</b></span><span>รายการซ้ำที่ข้าม (ไม่เปลี่ยน) <b>${n0(st.same828 || 0)}</b></span><span>คงเหลือ <b>${n0(rem)}</b></span><span>รายการผิดพลาด <b class="${badN ? "e" : ""}">${n0(badN)}</b></span><span>ความคืบหน้า <b>${pc.toFixed(1)}%</b></span>${mode === "run" && st.cur828 ? `<span>BATCH ปัจจุบัน <b>${st.cur828}</b></span>` : ""}</div>`
      + `<div class="up828-bar"><i style="width:${pc}%"></i></div>`
      + `<div class="up828-s">BATCH ${st.q828.filter((b) => b.done).length} / ${st.q828.filter((b) => !b.skip).length} สำเร็จ${F && mode !== "run" ? ` · ตรวจใน Database : รายการนำเข้า ${n0(F.db_imported)} · Billing Note ${n0(F.db_billing)}${F.db_case != null ? " · CASE " + n0(F.db_case) : ""} · นำเข้าใหม่ ${n0(F.inserted)} · อัปเดต ${n0(F.updated)} · Billing Note อัปเดต ${n0(F.bn_updated)} · ไม่เปลี่ยน ${n0(F.unchanged)}${F.review ? " · รอตรวจสอบ " + n0(F.review) : ""}` : ""}</div>`
      + (bad.length || stop ? `<div class="up820-e">${(stop && !bad.includes(stop) ? [stop] : []).concat(bad).map((b) => `BATCH ${b.seq} (${n0(b.u.length)} รายการ) : ${i(b.err || "")}`).join("<br>")}</div>` : "")
      + (mode === "part" ? `<div class="up828-s">รายการที่บันทึกแล้วคงอยู่ใน Database · กด <b>ดำเนินการต่อ</b> เพื่อบันทึกเฉพาะ BATCH ที่ยังไม่สำเร็จ (ไม่บันทึกซ้ำ) · หรือ Refresh แล้วอัปโหลดไฟล์เดิม — รายการที่บันทึกแล้วจะแสดงเป็น "ไม่เปลี่ยน"</div>` : "");
    if (mode === "run") ok.textContent = "กำลังบันทึก… " + pc.toFixed(1) + "%";
    body.firstChild !== el && body.prepend(el);
  };
  /* V.823 (RUN-828) : แจ้งการนำเข้าที่ยังไม่ครบ (หลัง Refresh / เน็ตหลุด) — ตรวจจาก Database จริง */
  let RC828 = async () => {
    try { let L8 = await V("njacc_rx828_recent", { p: {} }); if (!Array.isArray(L8) || !L8.length || st.job) return; let n0 = (v) => Number(v || 0).toLocaleString("th-TH");
      let el = st.rcEl = document.createElement("div"); el.className = "up828-rc";
      el.innerHTML = `<b>⚠️ พบการนำเข้าที่ยังบันทึกไม่ครบ (ข้อมูลจาก Database)</b>` + L8.map((j) => `<div>Import ID ${i(String(j.job_id).slice(0, 8))} · ${DT820(j.created_at)}${j.created_by_name ? " · " + i(j.created_by_name) : ""} · ${i((j.files || []).map((f) => f.name).join(", "))} · บันทึกแล้ว <b>${n0(j.saved)}</b> / ${n0(j.total)} · คงเหลือ <b>${n0(Math.max(0, Number(j.total || 0) - Number(j.saved || 0)))}</b></div>`).join("")
        + `<div class="up828-s">รายการที่บันทึกแล้วยังอยู่ใน Database · อัปโหลดไฟล์เดิมได้ — ระบบตรวจกับ Database ก่อนบันทึก รายการที่บันทึกแล้วจะแสดงเป็น "ไม่เปลี่ยน" และบันทึกเฉพาะส่วนที่เหลือ (ไม่บันทึกซ้ำ)</div>`;
      st.pgEl || body.prepend(el); } catch (e) {}
  };
  await load(); RC828();
}
/* V.828 (RUN-832) : ข้อสังเกตใน Preview — Billing Note no. (APL Billing) ค่าเดียวกันใช้กับ INVOICE จำนวนมาก (≥ 20) · แจ้งให้ตรวจสอบเท่านั้น ไม่ตัด / ไม่แก้ข้อมูล */
function AN828(rows) {
  try { let m = new Map(); (rows || []).forEach((r) => { if (r.key && r.st !== "ERR" && r.v) m.set(r.v, (m.get(r.v) || 0) + 1); });
    let a = [...m.entries()].filter((z) => z[1] >= 20).sort((x, y) => y[1] - x[1]); if (!a.length) return "";
    return `<div class="up820-note an828">ℹ️ ข้อสังเกต : Billing Note no. ค่าเดียวกันใช้กับหลาย INVOICE (≥ 20) — ${a.slice(0, 8).map((z) => `<b>${i(z[0])}</b> (${z[1].toLocaleString("th-TH")})`).join(" · ")}${a.length > 8 ? ` · และอีก ${a.length - 8} ค่า` : ""} — กรุณาตรวจสอบก่อนยืนยัน (ระบบไม่ตัดข้อมูล)</div>`; }
  catch (e) { return ""; }
}
/* V.823 (RUN-828) : CSS แถบความคืบหน้า UPLOAD EXCEL */
function ST829() {
  try {
    if (document.getElementById("st829-css")) return;
    let s = document.createElement("style"); s.id = "st829-css";
    s.textContent = ".up828-pg{padding:10px 12px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:8px;margin-bottom:10px;display:grid;gap:6px}.up828-pg.ok{border-color:#bbf7d0;background:#f0fdf4}.up828-pg.part{border-color:#fde68a;background:#fffbeb}"
      + ".up828-h{font-weight:800;color:#1e3a8a}.up828-pg.ok .up828-h{color:#15803d}.up828-pg.part .up828-h{color:#b45309}.up828-h small{font-weight:600;color:#64748b;margin-left:6px}"
      + ".up828-g{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:#334155}.up828-g b{font-size:14px;color:#0f172a}.up828-g b.e{color:#b91c1c}"
      + ".up828-bar{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.up828-bar i{display:block;height:100%;background:#2563eb;transition:width .25s}.up828-pg.ok .up828-bar i{background:#16a34a}.up828-pg.part .up828-bar i{background:#f59e0b}"
      + ".up828-s{font-size:12.5px;color:#475569}.up828-rc{padding:10px 12px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:8px;margin-bottom:10px;display:grid;gap:4px;font-size:13px}";
    document.head.appendChild(s);
  } catch (e) {}
}
function AK820(files, C) {   /* Popup ยืนยันก่อนบันทึก (ปิด / ยกเลิก = ไม่บันทึก) */
  return new Promise((res) => {
    ST820(); let w = document.createElement("div"); w.className = "ak820";
    let dup = C.dup > 0, n = (v) => v.toLocaleString("th-TH");
    w.innerHTML = `<div class="ak820-b" role="dialog" aria-modal="true"><div class="ak820-h">${dup ? "⚠️ ตรวจพบข้อมูลซ้ำในการอัปโหลด Excel" : "ยืนยันบันทึกข้อมูลจาก Excel"}</div>`
      + `<div class="ak820-t">ไฟล์ : ${files.filter((f) => !f.err).map((f) => `<b>${i(f.name)}</b> <small>(ลำดับ ${f.seq} · ${DT820(f.at)})</small>`).join(", ")}<ul>`
      + `<li>รายการทั้งหมด : <b>${n(C.all)}</b> INVOICE · นำเข้าได้ <b>${n(C.okk)}</b></li><li>INVOICE ที่มีอยู่แล้ว (ซ้ำ) : <b>${n(C.dup)}</b></li><li>INVOICE เพิ่มใหม่ (นำเข้า Excel) : <b>${n(C.imp)}</b> · Billing Note ใหม่ (INVOICE ในระบบ) : <b>${n(C.nw)}</b></li>`
      + `<li>ข้อมูลเปลี่ยนแปลง : <b>${n(C.chg)}</b> · ไม่เปลี่ยน : ${n(C.same)}</li>${C.rv ? `<li>รอตรวจสอบ (ยอดไม่ครบ / ไม่สอดคล้อง) : <b>${n(C.rv)}</b> — บันทึกได้ แต่ออกใบเสร็จไม่ได้</li>` : ""}<li>ผิดพลาด : ${n(C.err)} (ไม่บันทึก)</li></ul>`
      + `<b>ระบบจะยึดข้อมูลจากไฟล์ล่าสุดเฉพาะหัวข้อที่อนุญาต หลังได้รับการยืนยัน</b><div><small>ช่องว่างไม่เขียนทับ · APL Billing → Billing Note no. · CASE → Case · INVOICE ในระบบ = เฉพาะ Billing Note no. และ CASE</small></div></div>`
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
  return `<span class="b823" title="นำเข้าจาก UPLOAD EXCEL — ไม่ใช่ INVOICE ใน ACCOUNTING (ออกใบเสร็จไม่ได้)">EXCEL</span>${o.rx823_reason ? `<span class="b823r" title="${i(o.rx823_reason)}">รอตรวจสอบ</span>` : ""}${BS838(o)}`;
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
