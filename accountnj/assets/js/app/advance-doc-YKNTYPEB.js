import{a as x}from"./chunk-OWSY2KDQ.js";import{a as p}from"./chunk-UWAYW6DC.js";import{a as T}from"./chunk-ZRPMDTDS.js";import{a as o,c as A,e as t}from"./chunk-PCFU74ZV.js";var n=(s,l="-")=>{let e=s==null?"":String(s).trim();return t(e||l)},y=s=>s==null?"":String(s).trim(),m=s=>{let l=Number(s);return Number.isFinite(l)?l:0},b=s=>Math.round((m(s)+Number.EPSILON)*100)/100,M=s=>s==null||s===""?"-":o(s),C={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',form:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4.4" y="3" width="15.2" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.6 3.8 20.2 7.4 8 19.6l-4.4.8.8-4.4z"/><path d="M14.4 6l3.6 3.6"/></svg>',hand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8.4" r="3.2"/><path d="M3.6 19.4c1.4-1.2 3-1.2 4.4-.4l2 1.1c.7.4 1.6.4 2.3 0l5.2-2.8c.9-.5 1.2-1.6.7-2.5-.5-.8-1.5-1.1-2.3-.7l-3.3 1.5"/></svg>',shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.2 19.2 6v5.6c0 4.4-3 7.6-7.2 9.2-4.2-1.6-7.2-4.8-7.2-9.2V6z"/><path d="M9 12.2l2.1 2.1 4-4.2"/></svg>'};var u=s=>`<span class="apd-bub">${C[s]||""}</span>`;function I(s,l){let e=0,a=new Set;for(let v of l)e=b(e+m(v.amount)),m(v.vat_rate)>0&&a.add(m(v.vat_rate));let i=b(s.vat_amount),r=b(s.wht_amount),h=a.size===1?[...a][0]:a.size===0?m(s.vat_rate):null,d=b(e+i);return{sub:e,vat:i,wht:r,vatRate:h,total:d,received:b(d-r)}}var S={PENDING:["apd-st-pending","PENDING / \u0E23\u0E2D\u0E08\u0E48\u0E32\u0E22"],PAID:["apd-st-paid","PAID / \u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27"],SETTLED:["apd-st-settled","SETTLED / \u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E04\u0E23\u0E1A"]};function k(s,{advanceStatus:l=null}={}){let e=s.items||[],a=I(s,e),i=s.customer||{},r=s.job||{},h=String(s.status||"").toUpperCase()==="VOID",d={cusName:s.customer_name||i.name,cusTax:s.customer_tax_id||i.tax_id,cusBranch:s.customer_branch_code||i.branch_code,cusAddr:s.customer_address||i.address,cusTel:s.customer_phone||i.phone,apNo:s.invoice_no,apDate:s.invoice_date,jobNo:s.job_no||r.job_no,invRef:s.source_invoice_no||r.source_invoice_no,note:s.job_note||r.note},v=String(s.charge_type||"").toUpperCase()==="ADVANCE"?"Advance Payment / \u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32":null,N=String(l||"").toUpperCase(),$=S[N]||null,E=e.map((c,w)=>`<tr>
      <td class="apd-c apd-no">${c.line_no??w+1}</td>
      <td class="apd-ds">${n(c.description,"-")}</td>
      <td class="apd-c">${c.qty===null||c.qty===void 0||c.qty===""?"-":t(String(Number(c.qty)))}</td>
      <td class="apd-r">${M(c.unit_price)}</td>
      <td class="apd-r">${o(c.amount)}</td>
    </tr>`).join("")||'<tr><td colspan="5" class="apd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>',D=a.vatRate===null?"VAT":`VAT ${a.vatRate}%`,g=y(d.note),f=(c,w,_)=>`
    <div class="apd-sg">
      ${u(c)}
      <div class="apd-sg-b">
        <div class="apd-sg-t"><i></i>${w} / ${_}</div>
        <div class="apd-sg-ln"></div>
        <div class="apd-sg-f"><label>Name / \u0E0A\u0E37\u0E48\u0E2D</label><span class="apd-dot"></span></div>
        <div class="apd-sg-f"><label>Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label>
          <span class="apd-dot apd-dot-s"></span><b>/</b>
          <span class="apd-dot apd-dot-s"></span><b>/</b>
          <span class="apd-dot apd-dot-s"></span></div>
      </div>
    </div>`;return`
    <div class="apd print-area${h?" apd-void":""}">
      ${h?'<div class="apd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}

      <header class="apd-head">
        <div class="apd-head-l">
          <img class="apd-logo" src="${p.logo}" alt="N.J. Logistics">
          <div class="apd-co">
            <div class="apd-co-nm">${t(p.nameEn)}</div>
            <div class="apd-co-ad">${t(p.address)}</div>
            <div class="apd-co-tl">Tel : ${t(p.tel)} <i>|</i> Fax : ${t(p.fax)}</div>
            <div class="apd-co-tl">Tax ID : ${t(p.taxId)}</div>
          </div>
        </div>
        <div class="apd-head-r">
          <div class="apd-title">ADVANCE PAYMENT</div>
          <div class="apd-title-th">\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</div>
          <div class="apd-chip">ADVANCE RECEIPT</div>
          ${$?`<div class="apd-st ${$[0]}">${t($[1])}</div>`:""}
        </div>
      </header>
      <div class="apd-band"></div>

      <section class="apd-grid">
        <div class="apd-box">
          <div class="apd-box-t">${u("user")}<span>CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></div>
          <div class="apd-box-b">
            <div class="apd-row"><label>Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
              <i>:</i><div class="apd-v apd-v-b">${n(d.cusName)}</div></div>
            <div class="apd-row"><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label>
              <i>:</i><div class="apd-v">${n(d.cusTax)}</div></div>
            <div class="apd-row"><label>Branch / \u0E2A\u0E32\u0E02\u0E32</label>
              <i>:</i><div class="apd-v">${n(d.cusBranch)}</div></div>
            <div class="apd-row apd-row-ml"><label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <i>:</i><div class="apd-v">${n(d.cusAddr,"-")}</div></div>
            <div class="apd-row apd-row-last"><label>Tel. / \u0E42\u0E17\u0E23.</label>
              <i>:</i><div class="apd-v">${n(d.cusTel)}</div></div>
          </div>
        </div>

        <div class="apd-box">
          <div class="apd-box-t">${u("form")}<span>ADVANCE PAYMENT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</span></div>
          <div class="apd-box-b">
            <div class="apd-row"><label>Advance Payment No.</label>
              <i>:</i><div class="apd-v apd-v-key">${n(d.apNo)}</div></div>
            <div class="apd-row"><label>Date</label>
              <i>:</i><div class="apd-v apd-v-b">${A(d.apDate)}</div></div>
            <div class="apd-row"><label>Job No.</label>
              <i>:</i><div class="apd-v apd-v-b">${n(d.jobNo)}</div></div>
            <div class="apd-row"><label>Invoice Reference</label>
              <i>:</i><div class="apd-v apd-v-b">${n(d.invRef)}</div></div>
            <div class="apd-row apd-row-last"><label>Payment For /<br>\u0E27\u0E31\u0E15\u0E16\u0E38\u0E1B\u0E23\u0E30\u0E2A\u0E07\u0E04\u0E4C\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</label>
              <i>:</i><div class="apd-v">${v?t(v):"-"}</div></div>
          </div>
        </div>
      </section>

      <section class="apd-items">
        <div class="apd-items-t">${u("list")}<span>ADVANCE PAYMENT ITEMS / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</span></div>
        <table class="apd-tbl">
          <colgroup><col class="w-no"><col class="w-ds"><col class="w-qty">
            <col class="w-up"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="apd-c">No.</th>
            <th>Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="apd-c">Qty</th>
            <th class="apd-r">Unit Price</th>
            <th class="apd-r">Amount (THB)</th>
          </tr></thead>
          <tbody>${E}</tbody>
          <tfoot><tr class="apd-total">
            <td colspan="4" class="apd-r">TOTAL ADVANCE AMOUNT / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</td>
            <td class="apd-r apd-total-v">${o(a.sub)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="apd-mid">
        <div class="apd-mid-l">
          <div class="apd-mini">
            ${u("abc")}
            <div class="apd-mini-b">
              <div class="apd-mini-t">Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</div>
              <div class="apd-mini-v">(${t(x(a.received))})</div>
            </div>
          </div>
          ${g?`<div class="apd-mini">
            ${u("pen")}
            <div class="apd-mini-b">
              <div class="apd-mini-t apd-mini-t2">NOTE / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div>
              <div class="apd-mini-n">${t(g)}</div>
            </div>
          </div>`:""}
        </div>
        <div class="apd-sum">
          <div class="apd-sl"><span>SubTotal</span><span>${o(a.sub)}</span></div>
          <div class="apd-sl"><span>${t(D)}</span><span>${o(a.vat)}</span></div>
          ${a.wht>0?`<div class="apd-sl apd-sl-w"><span>Withholding Tax / \u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span>
            <span>-${o(a.wht)}</span></div>`:""}
          <div class="apd-sl apd-sl-m"><span>Total Advance Amount</span><span>${o(a.total)}</span></div>
          <div class="apd-sl apd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</i></span>
            <span>${o(a.received)}</span></div>
        </div>
      </section>

      <section class="apd-signs">
        ${f("hand","RECEIVED BY","\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19")}
        ${f("shield","AUTHORIZED BY","\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")}
      </section>

      <div class="apd-edge"></div>
    </div>`}function L(s,{advanceStatus:l=null,print:e=!1}={}){let a=document.createElement("div");a.innerHTML=k(s,{advanceStatus:l});let i=document.createElement("div");i.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="apd-print">\u{1F5A8} Print Advance Payment</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,T({title:"\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32 "+(s.invoice_no||""),body:a,footer:i,fullscreen:!0,wide:!0}),i.querySelector("#apd-print").onclick=()=>window.print(),e&&setTimeout(()=>window.print(),60)}export{k as advanceDocHTML,L as openAdvanceDoc};
