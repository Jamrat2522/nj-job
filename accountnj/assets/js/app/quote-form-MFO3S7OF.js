import{a as vt,b as _t,c as pt,d as qt,e as bt,f as ft,g as G,h as yt,i as R,j as p,k as T,l as M,m as U,n as A,o as K,p as z,q as L,r as j,s as O,t as N,u as $t,w as J}from"./chunk-M7IKQC2U.js";import"./chunk-OWSY2KDQ.js";import{k as ct,l as rt}from"./chunk-2OWLQSES.js";import{i as P}from"./chunk-IZR646UK.js";import{a as x}from"./chunk-UWAYW6DC.js";import{e as ut,f as mt}from"./chunk-46QUQC76.js";import{e as H,f as Y}from"./chunk-OPGKUGLK.js";import{a as C}from"./chunk-YM5GFE6V.js";import"./chunk-GDT6F23K.js";import{a as k}from"./chunk-OFOOXWUM.js";import{a as dt,b as lt,d as Q,e as ot}from"./chunk-DIH2PLYD.js";import{c as w,e as n}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";function Z(){return{name:x.nameEn||"",address:x.address||"",tax_id:x.taxId||"",tel:x.tel||"",email:x.email||""}}function gt(e){let t=e.snapshot||{},d=A({items:t.items,discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled,vat_rate:t.vat_rate});return{status:e.status,draft:!1,cancelled:e.status==="CANCELLED",company:t.company||{},quotation_no:t.quotation_no,quotation_date:t.quotation_date,valid_until:t.valid_until,job_no:t.job_no,customer:t.customer||{},detail:t.detail,currency:t.currency||"THB",calc:d,totals:{subtotal:T(t.subtotal),discount:T(t.discount_amount),tax_base:T(t.tax_base),vat:T(t.vat_amount),grand:T(t.grand_total)},discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled!==!1,vat_rate:t.vat_rate,words_en:t.amount_words_en||L(T(t.grand_total),t.currency),words_th:t.amount_words_th||j(T(t.grand_total),t.currency),remark:t.remark,terms:t.terms,issued_by:t.issued_by,created_by:t.created_by}}function tt(e){let t=A(e),d=N();return{status:"DRAFT",draft:!0,cancelled:!1,company:Z(),quotation_no:"",quotation_date:d,valid_until:e.valid_until||O(d,R),job_no:e.job_no||"",customer:{name:e.customer_name,attention:e.attention,address:e.customer_address,tax_id:e.customer_tax_id,tel:e.customer_tel,email:e.customer_email},detail:e.detail,currency:e.currency||"THB",calc:t,totals:{subtotal:t.subtotal_c,discount:t.discount_c,tax_base:t.tax_base_c,vat:t.vat_c,grand:t.grand_total_c},discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled,vat_rate:t.vat_rate,words_en:L(t.grand_total_c,e.currency||"THB"),words_th:j(t.grand_total_c,e.currency||"THB"),remark:e.remark,terms:e.terms,created_by:e.created_by_name||""}}var B=e=>n(e||"").replace(/\n/g,"<br>");function et(e){let t=e.company||{},d=e.customer||{},o=e.totals,u=n(e.currency||"THB"),v=M(e.vat_rate||"0"),q=0,m=(e.calc.items||[]).filter(f=>f.title||f.lines.length).map(f=>{let D=f.lines.filter(y=>y.description||y.amount_c>0n).map(y=>(q+=1,`<tr class="qtd-ln"><td class="c">${q}</td><td class="qtd-desc">${n(y.description)}</td>
        <td class="r">${M(y.qty)}</td><td class="c">${n(y.unit)}</td>
        <td class="r">${U(y.unit_price)}</td><td class="r">${p(y.amount_c)}</td></tr>`)).join("");return`<tbody class="qtd-grp">
      <tr class="qtd-gh"><td colspan="6">${n(f.title)}</td></tr>
      ${D}
      <tr class="qtd-gs"><td colspan="5" class="r">Subtotal</td><td class="r">${p(f.subtotal_c)}</td></tr>
    </tbody>`}).join(""),i=e.discount_type==="PERCENT"?`Discount (${M(e.discount_value)}%)`:"Discount",E=e.cancelled?'<div class="qtd-wm qtd-wm-x" aria-hidden="true">CANCELLED</div>':e.draft?'<div class="qtd-wm" aria-hidden="true">DRAFT</div>':"",b=(f,D,y="")=>`<div class="qtd-kv ${y}"><span>${f}</span><b>${D}</b></div>`;return`<div class="qtd" data-status="${n(e.status)}">
    ${E}
    <header class="qtd-head">
      <div class="qtd-co">
        ${x.logo?`<img class="qtd-logo" src="${n(x.logo)}" alt="">`:""}
        <div class="qtd-co-tx">
          <div class="qtd-co-nm">${n(t.name)}</div>
          ${t.address?`<div class="qtd-co-ad">${n(t.address)}</div>`:""}
          <div class="qtd-co-ad">${[t.tel?"Tel. "+n(t.tel):"",t.email?"Email: "+n(t.email):"",t.tax_id?"Tax ID: "+n(t.tax_id):""].filter(Boolean).join(" &nbsp;\xB7&nbsp; ")}</div>
        </div>
      </div>
      <div class="qtd-ttl"><div class="qtd-ttl-en">QUOTATION</div><div class="qtd-ttl-th">\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</div></div>
    </header>
    <section class="qtd-info">
      <div class="qtd-box qtd-cust">
        <div class="qtd-box-t">CUSTOMER</div>
        <div class="qtd-cu-nm">${n(d.name)}</div>
        ${d.address?`<div class="qtd-cu-l">${B(d.address)}</div>`:""}
        ${d.tax_id?`<div class="qtd-cu-l">Tax ID: ${n(d.tax_id)}</div>`:""}
        ${d.tel||d.email?`<div class="qtd-cu-l">${[d.tel?"Tel. "+n(d.tel):"",d.email?n(d.email):""].filter(Boolean).join(" \xB7 ")}</div>`:""}
        ${d.attention?`<div class="qtd-cu-l"><b>Attention:</b> ${n(d.attention)}</div>`:""}
      </div>
      <div class="qtd-box qtd-meta">
        ${b("Quotation No.",e.quotation_no?n(e.quotation_no):'<i class="qtd-dr">DRAFT</i>')}
        ${b("Date",n(w(e.quotation_date)))}
        ${b("Valid Until",n(w(e.valid_until)))}
        ${b("Job No.",n(e.job_no||"-"))}
        ${b("Currency",u)}
      </div>
    </section>
    ${e.detail?`<section class="qtd-detail"><b>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 / Detail</b><div>${B(e.detail)}</div></section>`:""}
    <table class="qtd-tbl">
      <colgroup><col class="w-no"><col><col class="w-qty"><col class="w-unit"><col class="w-pr"><col class="w-amt"></colgroup>
      <thead><tr><th class="c">No.</th><th>Description</th><th class="r">Qty</th><th class="c">Unit</th>
        <th class="r">Unit Price</th><th class="r">Amount (${u})</th></tr></thead>
      ${m||'<tbody><tr><td colspan="6" class="c qtd-empty">\u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014</td></tr></tbody>'}
    </table>
    <section class="qtd-bottom">
      <div class="qtd-words">
        <div class="qtd-box-t">AMOUNT IN WORDS</div>
        <div class="qtd-w-en">${n(e.words_en)}</div>
        ${e.words_th?`<div class="qtd-w-th">(${n(e.words_th)})</div>`:""}
      </div>
      <div class="qtd-sum">
        ${b("Subtotal",p(o.subtotal))}
        ${o.discount>0n?b(i,p(o.discount)):""}
        ${b("Tax Base",p(o.tax_base))}
        ${b(e.vat_enabled?`VAT ${v}%`:"VAT (\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14 VAT)",p(o.vat))}
        ${b(`Grand Total (${u})`,p(o.grand),"qtd-grand")}
      </div>
    </section>
    ${e.remark||e.terms?`<section class="qtd-notes">
      ${e.remark?`<div class="qtd-note"><div class="qtd-box-t">REMARK</div><div>${B(e.remark)}</div></div>`:""}
      ${e.terms?`<div class="qtd-note"><div class="qtd-box-t">TERMS &amp; CONDITIONS</div><div>${B(e.terms)}</div></div>`:""}
    </section>`:""}
    <section class="qtd-sign">
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Prepared by</div>
        <div class="qtd-sg-n">${n(e.issued_by||e.created_by||"")}</div></div>
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Authorized Signature</div>
        <div class="qtd-sg-n">${n(t.name)}</div></div>
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Customer Acceptance</div>
        <div class="qtd-sg-n">Date ____/____/______</div></div>
    </section>
  </div>`}var ht="nj-print-doc";function X(e){let t=document.body,d=document.title;t.classList.add(ht),e&&(document.title=e);let o=!1,u=()=>{o||(o=!0,t.classList.remove(ht),document.title=d)};window.addEventListener("afterprint",u,{once:!0});try{let v=window.matchMedia("print"),q=m=>{m.matches||(u(),v.removeEventListener("change",q))};v.addEventListener("change",q)}catch{}window.print()}function S(e,t="preview"){let d=$t(e.quotation_no||"DRAFT-"+(e.job_no||"QUOTATION"),e.customer&&e.customer.name),o=document.createElement("div");o.className="qtd-stage",o.innerHTML=`<div class="qtd-paper print-area">${et(e)}</div>`;let u=document.createElement("div");if(u.className="qtd-pv-f",u.innerHTML=`${e.draft?'<span class="qtd-pv-note">DRAFT \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</span>':""}
    <span class="sp"></span>
    <button class="btn btn-o" data-close>\u0E1B\u0E34\u0E14</button>
    <button class="btn btn-o" id="qtd-pdf">Export PDF</button>
    <button class="btn btn-p" id="qtd-print">Print</button>`,dt({title:e.quotation_no?"Quotation "+e.quotation_no:"Preview Quotation (DRAFT)",body:o,footer:u,fullscreen:!0,cls:"qt-pv-modal"}),u.querySelector("#qtd-print").onclick=()=>X(d),u.querySelector("#qtd-pdf").onclick=()=>{k('\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 "Save as PDF" \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C \u2014 \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C: '+d+".pdf"),X(d)},t==="print"||t==="pdf"){let v=o.querySelector("img.qtd-logo"),q=!1,m=()=>{q||(q=!0,X(d))};v&&!v.complete?(v.addEventListener("load",m,{once:!0}),v.addEventListener("error",m,{once:!0}),setTimeout(m,1200)):setTimeout(m,0)}return{close:lt,file:d}}var at=()=>({description:"",qty:"1",unit:"",unit_price:""}),V=()=>({title:"",lines:[at()]}),F=e=>e==null?"":String(e);function Tt(e){return{id:"",job_no:"",job_date:N(),status:"DRAFT",customer_id:"",customer_name:"",attention:"",customer_address:"",customer_tax_id:"",customer_tel:"",customer_email:"",detail:"",currency:"THB",items:[V()],discount_type:"NONE",discount_value:"",vat_enabled:!0,vat_rate:F(e??7),valid_until:"",remark:"",terms:yt}}function Et(e){let t=(Array.isArray(e.items)?e.items:[]).map(d=>({title:d.title||"",lines:(d.lines||[]).map(o=>({description:o.description||"",qty:F(o.qty),unit:o.unit||"",unit_price:F(o.unit_price)}))}));return{id:e.id,job_no:e.job_no,job_date:e.job_date,status:e.status,customer_id:e.customer_id||"",customer_name:e.customer_name||"",attention:e.attention||"",customer_address:e.customer_address||"",customer_tax_id:e.customer_tax_id||"",customer_tel:e.customer_tel||"",customer_email:e.customer_email||"",detail:e.detail||"",currency:e.currency||"THB",items:t.length?t:[V()],discount_type:e.discount_type||"NONE",discount_value:e.discount_type&&e.discount_type!=="NONE"?F(e.discount_value):"",vat_enabled:e.vat_enabled!==!1,vat_rate:F(e.vat_rate),valid_until:e.valid_until||"",remark:e.remark||"",terms:e.terms||"",created_by_name:e.created_by_name||"",quotation_no:e.quotation_no,quotation_date:e.quotation_date,issued_at:e.issued_at,issued_by_name:e.issued_by_name,cancelled_at:e.cancelled_at,cancelled_by_name:e.cancelled_by_name,cancel_reason:e.cancel_reason,created_at:e.created_at,snapshot:e.snapshot}}async function wt(e,t={}){let d=t.id&&t.id!=="new"?t.id:"",o=null;try{o=await ct()}catch(v){C(v,"\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}let u;if(d){let v;try{v=await qt(d)}catch(q){C(q,"\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),e.innerHTML='<div class="card card-pad empty">\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \xB7 <a href="#/quotation">\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</a></div>';return}if(u=Et(v),u.status!=="DRAFT"){St(e,u);return}}else u=Tt(o&&o.vat_rate);Dt(e,u)}function kt(e){if(e.snapshot&&e.status!=="DRAFT")return gt(e);let t=tt(e);return e.status==="CANCELLED"&&(t.status="CANCELLED",t.cancelled=!0,t.draft=!1),t}function St(e,t){let d=kt(t),o=t.status==="ISSUED"&&P("void");e.innerHTML=`
    <div class="card qt-vbar">
      <div class="qt-vinfo">
        <button class="btn btn-o btn-sm" id="qt-back">\u2190 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
        <b>${n(t.quotation_no||t.job_no)}</b> ${J(t.status)}
        <span class="t-3 t-xs">\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 ${n(t.job_no)}${t.issued_at?" \xB7 \u0E2D\u0E2D\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D "+n(w(String(t.issued_at).slice(0,10)))+(t.issued_by_name?" \u0E42\u0E14\u0E22 "+n(t.issued_by_name):""):""}${t.cancelled_at?" \xB7 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D "+n(w(String(t.cancelled_at).slice(0,10)))+(t.cancelled_by_name?" \u0E42\u0E14\u0E22 "+n(t.cancelled_by_name):"")+(t.cancel_reason?" ("+n(t.cancel_reason)+")":""):""}</span>
      </div>
      <div class="qt-acts">
        ${o?'<button class="btn btn-danger" id="qt-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</button>':""}
        <button class="btn btn-o" id="qt-pv">Preview Quotation</button>
        <button class="btn btn-o" id="qt-pdf">Export PDF</button>
        <button class="btn btn-p" id="qt-print">Print</button>
      </div>
    </div>
    <div class="qt-inline-doc"><div class="qtd-paper">${et(d)}</div></div>`;let u=v=>e.querySelector(v);u("#qt-back").onclick=()=>{location.hash="#/quotation"},u("#qt-pv").onclick=()=>S(d,"preview"),u("#qt-pdf").onclick=()=>S(d,"pdf"),u("#qt-print").onclick=()=>S(d,"print"),o&&(u("#qt-cancel").onclick=()=>st(e,t))}async function st(e,t){let d=await ot("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 "+(t.quotation_no||t.job_no));d&&await H("qt-cancel",async()=>{try{await pt({id:t.id,reason:d}),k("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 (\u0E40\u0E25\u0E02\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E22\u0E31\u0E07\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48)","ok"),await wt(e,{id:t.id})}catch(o){C(o,"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}})}function Dt(e,t){let d="",o="",u=!1,v=t.customer_id||"",q=()=>rt();e.innerHTML=`
    <div class="qt-form">
      <div class="card card-pad qt-sec">
        <div class="qt-g2">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</label>
            <div class="inp qt-ro" id="qt-jobno">${n(t.job_no||"\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")}</div></div>
          <div class="fld"><label for="qt-date">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label>
            <input class="inp" type="date" id="qt-date" value="${n(t.job_date)}"></div>
          <div class="fld"><label for="qt-cust">\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
            ${ut("qt-cust",q(),t.customer_id,"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E08\u0E32\u0E01 Customer Master")}</div>
          <div class="fld"><label for="qt-att">Attention</label>
            <input class="inp" id="qt-att" value="${n(t.attention)}" autocomplete="off"></div>
          <div class="fld qt-span2"><label for="qt-addr">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
            <textarea class="inp" id="qt-addr" rows="2">${n(t.customer_address)}</textarea></div>
          <div class="fld"><label for="qt-tax">Tax ID</label>
            <input class="inp" id="qt-tax" value="${n(t.customer_tax_id)}" autocomplete="off"></div>
          <div class="fld qt-g2in">
            <div><label for="qt-tel">Tel.</label><input class="inp" id="qt-tel" value="${n(t.customer_tel)}" autocomplete="off"></div>
            <div><label for="qt-mail">Email</label><input class="inp" id="qt-mail" value="${n(t.customer_email)}" autocomplete="off"></div>
          </div>
          <div class="fld"><label for="qt-valid">Valid Until</label>
            <input class="inp" type="date" id="qt-valid" value="${n(t.valid_until)}">
            <div class="t-xs t-3">\u0E27\u0E48\u0E32\u0E07 = \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 + ${R} \u0E27\u0E31\u0E19</div></div>
          <div class="fld"><label for="qt-cur">Currency</label>
            <select class="sel" id="qt-cur">${bt.map(s=>`<option ${s===t.currency?"selected":""}>${s}</option>`).join("")}</select></div>
          <div class="fld qt-span2"><label for="qt-detail">\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</label>
            <textarea class="inp" id="qt-detail" rows="3">${n(t.detail)}</textarea></div>
        </div>
      </div>

      <div class="card card-pad qt-sec">
        <div class="qt-sec-t">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22</div>
        <div id="qt-items"></div>
        <button class="btn btn-o btn-sm" id="qt-add-h">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D</button>
        <datalist id="qt-units">${ft.map(s=>`<option value="${s}">`).join("")}</datalist>
      </div>

      <div class="card card-pad qt-sec qt-tot-wrap">
        <div class="qt-notes">
          <div class="fld"><label for="qt-remark">Remark</label>
            <textarea class="inp" id="qt-remark" rows="3">${n(t.remark)}</textarea></div>
          <div class="fld"><label for="qt-terms">Terms &amp; Conditions</label>
            <textarea class="inp" id="qt-terms" rows="4">${n(t.terms)}</textarea></div>
        </div>
        <div class="qt-tot">
          <div class="qt-tl"><span>Subtotal</span><b id="qt-sub">0.00</b></div>
          <div class="qt-tl qt-disc"><span>Discount
            <select class="sel" id="qt-dtype">
              <option value="NONE">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14</option><option value="AMOUNT">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19</option><option value="PERCENT">%</option>
            </select>
            <input class="inp qt-num" id="qt-dval" inputmode="decimal" autocomplete="off"></span>
            <b id="qt-disc">0.00</b></div>
          <div class="qt-tl"><span>Tax Base</span><b id="qt-base">0.00</b></div>
          <div class="qt-tl"><span><label class="qt-chk"><input type="checkbox" id="qt-vat"> VAT <span id="qt-vrate"></span>%</label></span>
            <b id="qt-vatamt">0.00</b></div>
          <div class="qt-tl qt-grand"><span>Grand Total <span id="qt-gcur"></span></span><b id="qt-grand">0.00</b></div>
          <div class="qt-words"><div id="qt-wen"></div><div id="qt-wth"></div></div>
        </div>
      </div>

      <div class="card qt-actbar">
        <button class="btn btn-o btn-sm" id="qt-back">\u2190 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
        <span class="qt-st">${J("DRAFT")}</span>
        <span class="sp"></span>
        ${t.id&&P("void")?'<button class="btn btn-danger" id="qt-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>':""}
        <button class="btn btn-o" id="qt-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
        <button class="btn btn-o" id="qt-pv">Preview Quotation</button>
        <button class="btn btn-p" id="qt-issue">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</button>
        <button class="btn btn-o" id="qt-pdf">Export PDF</button>
        <button class="btn btn-o" id="qt-print">Print</button>
      </div>
    </div>`;let m=e.querySelector(".qt-form"),i=s=>m.querySelector(s);i("#qt-dtype").value=t.discount_type,i("#qt-dval").value=t.discount_value,i("#qt-vat").checked=t.vat_enabled;function E(){i("#qt-items").innerHTML=t.items.map((s,a)=>`
      <div class="qt-svc" data-h="${a}">
        <div class="qt-svc-h">
          <span class="qt-svc-no">${a+1}</span>
          <div class="qt-svc-in">
            <input class="inp" data-f="title" data-h="${a}" value="${n(s.title)}"
              placeholder="\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 (Service Header)" autocomplete="off">
            <button type="button" class="btn btn-o btn-sm qt-preset-btn" data-preset="${a}" title="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19">\uFF0B</button>
            <div class="qt-preset" data-menu="${a}" hidden>${G.map((l,c)=>`<button type="button" class="qt-preset-it" data-pick="${a}" data-i="${c}">${n(l)}</button>`).join("")}</div>
          </div>
          <button type="button" class="btn-icon qt-del" data-del-h="${a}" title="\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D" aria-label="\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D">\u{1F5D1}</button>
        </div>
        <div class="tbl-wrap"><table class="tbl qt-lines">
          <thead><tr><th class="qt-w-no">No.</th><th>Description</th><th class="qt-w-qty r">Qty</th>
            <th class="qt-w-unit">Unit</th><th class="qt-w-pr r">Unit Price</th><th class="qt-w-amt r">Amount</th><th class="qt-w-x"></th></tr></thead>
          <tbody>${s.lines.map((l,c)=>`<tr>
            <td class="center t-3">${c+1}</td>
            <td><input class="inp" data-f="description" data-h="${a}" data-l="${c}" value="${n(l.description)}" autocomplete="off"></td>
            <td><input class="inp qt-num" data-f="qty" data-h="${a}" data-l="${c}" value="${n(l.qty)}" inputmode="decimal" autocomplete="off"></td>
            <td><input class="inp" data-f="unit" data-h="${a}" data-l="${c}" value="${n(l.unit)}" list="qt-units" autocomplete="off"></td>
            <td><input class="inp qt-num" data-f="unit_price" data-h="${a}" data-l="${c}" value="${n(l.unit_price)}" inputmode="decimal" autocomplete="off"></td>
            <td class="r qt-amt" data-amt="${a}-${c}">0.00</td>
            <td><button type="button" class="btn-icon qt-del" data-del-l="${a}-${c}" title="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" aria-label="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u2715</button></td>
          </tr>`).join("")}</tbody>
          <tfoot><tr><td colspan="5" class="r t-b">Subtotal</td><td class="r t-b" data-gsub="${a}">0.00</td><td></td></tr></tfoot>
        </table></div>
        <button type="button" class="btn btn-o btn-sm" data-add-l="${a}">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21 Description</button>
      </div>`).join(""),f()}function b(){t.job_date=i("#qt-date").value||N(),t.customer_name=i("#qt-cust").value.trim(),t.customer_id=i("#qt-cust").dataset.id||"",t.attention=i("#qt-att").value,t.customer_address=i("#qt-addr").value,t.customer_tax_id=i("#qt-tax").value,t.customer_tel=i("#qt-tel").value,t.customer_email=i("#qt-mail").value,t.valid_until=i("#qt-valid").value,t.currency=i("#qt-cur").value,t.detail=i("#qt-detail").value,t.remark=i("#qt-remark").value,t.terms=i("#qt-terms").value,t.discount_type=i("#qt-dtype").value,t.discount_value=i("#qt-dval").value,t.vat_enabled=i("#qt-vat").checked}function f(){b();let s=A(t);s.items.forEach((l,c)=>{l.lines.forEach((_,g)=>{let r=m.querySelector(`[data-amt="${c}-${g}"]`);r&&(r.textContent=p(_.amount_c))});let $=m.querySelector(`[data-gsub="${c}"]`);$&&($.textContent=p(l.subtotal_c))}),m.querySelectorAll(".qt-num.qt-bad").forEach(l=>l.classList.remove("qt-bad")),s.errors.forEach(l=>{if(l.h===void 0){/^DISCOUNT/.test(l.code)&&i("#qt-dval").classList.add("qt-bad");return}let c=/^QTY/.test(l.code)?"qty":"unit_price",$=m.querySelector(`[data-f="${c}"][data-h="${l.h}"][data-l="${l.l}"]`);$&&$.classList.add("qt-bad")}),i("#qt-dval").disabled=t.discount_type==="NONE",i("#qt-sub").textContent=p(s.subtotal_c),i("#qt-disc").textContent=p(s.discount_c),i("#qt-base").textContent=p(s.tax_base_c),i("#qt-vrate").textContent=s.vat_rate,i("#qt-vatamt").textContent=p(s.vat_c),i("#qt-grand").textContent=p(s.grand_total_c),i("#qt-gcur").textContent="("+t.currency+")",i("#qt-wen").textContent=L(s.grand_total_c,t.currency);let a=j(s.grand_total_c,t.currency);return i("#qt-wth").textContent=a?"("+a+")":"",s}m.addEventListener("input",s=>{let a=s.target;if(a.dataset&&a.dataset.f){let l=t.items[+a.dataset.h];if(!l)return;if(a.dataset.f==="title")l.title=a.value;else{let c=l.lines[+a.dataset.l];c&&(c[a.dataset.f]=a.value)}}f()}),m.addEventListener("change",s=>{s.target.matches("select, input[type=checkbox], input[type=date]")&&f()}),m.addEventListener("focusout",s=>{let a=s.target;if(a.dataset&&a.dataset.f==="unit_price"&&a.value.trim()!==""&&!a.classList.contains("qt-bad")){a.value=U(a.value).replace(/,/g,"");let l=t.items[+a.dataset.h]?.lines[+a.dataset.l];l&&(l.unit_price=a.value)}});let D=s=>String(s.description||"").trim()!==""||String(s.unit_price||"").trim()!=="";m.addEventListener("click",async s=>{let a=s.target,l=a.closest("[data-preset]");if(l){let r=m.querySelector(`[data-menu="${l.dataset.preset}"]`);m.querySelectorAll(".qt-preset").forEach(h=>{h!==r&&(h.hidden=!0)}),r.hidden=!r.hidden;return}let c=a.closest("[data-pick]");if(c){let r=+c.dataset.pick;t.items[r].title=G[+c.dataset.i];let h=m.querySelector(`[data-f="title"][data-h="${r}"]`);h&&(h.value=t.items[r].title),c.closest(".qt-preset").hidden=!0,f();return}a.closest(".qt-preset")||m.querySelectorAll(".qt-preset").forEach(r=>{r.hidden=!0});let $=a.closest("[data-add-l]");if($){t.items[+$.dataset.addL].lines.push(at()),E();let r=+$.dataset.addL,h=t.items[r].lines.length-1;m.querySelector(`[data-f="description"][data-h="${r}"][data-l="${h}"]`)?.focus();return}let _=a.closest("[data-del-l]");if(_){let[r,h]=_.dataset.delL.split("-").map(Number),xt=t.items[r].lines[h];if(D(xt)&&!await Q("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A Description \u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?","\u0E25\u0E1A"))return;t.items[r].lines.splice(h,1),t.items[r].lines.length||t.items[r].lines.push(at()),E();return}let g=a.closest("[data-del-h]");if(g){let r=+g.dataset.delH,h=t.items[r];if((String(h.title).trim()||h.lines.some(D))&&!await Q("\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E19\u0E35\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?","\u0E25\u0E1A"))return;t.items.splice(r,1),t.items.length||t.items.push(V()),E();return}}),i("#qt-add-h").onclick=()=>{t.items.push(V()),E(),m.querySelector(`[data-f="title"][data-h="${t.items.length-1}"]`)?.focus()},mt(e,"qt-cust",{getItems:q,limit:20,searchKeys:["tax_id","contact_name"],meta:s=>[s.code,s.tax_id].filter(Boolean).join(" | "),onChange:s=>{if(s&&s!==v){let a=q().find(l=>l.id===s);a&&(i("#qt-addr").value=a.address||"",i("#qt-tax").value=a.tax_id||"",i("#qt-tel").value=a.phone||"",i("#qt-mail").value=a.email||"",!i("#qt-att").value.trim()&&a.contact_name&&(i("#qt-att").value=a.contact_name))}v=s||"",f()}});function y(){b();let s=z(t.items),a=A({...t,items:s});return{c:a,items:s,p:{id:t.id||null,job_date:t.job_date,customer_id:t.customer_id||null,customer_name:t.customer_name,attention:t.attention,customer_address:t.customer_address,customer_tax_id:t.customer_tax_id,customer_tel:t.customer_tel,customer_email:t.customer_email,detail:t.detail,currency:t.currency,items:a.items.map(l=>({title:l.title,lines:l.lines.map(c=>({description:c.description,qty:c.qty,unit:c.unit,unit_price:c.unit_price}))})),discount_type:a.discount_type,discount_value:a.discount_value,vat_enabled:a.vat_enabled,vat_rate:a.vat_rate,valid_until:t.valid_until||null,remark:t.remark,terms:t.terms}}}let I=s=>{u=s,m.querySelectorAll(".qt-actbar .btn").forEach(a=>{a.disabled=s})};function nt(s){k(s.slice(0,4).join(" \xB7 ")+(s.length>4?` (+${s.length-4})`:""),"err")}async function it(s){let{c:a,items:l,p:c}=y(),$=K({...t,items:l},a,"save");if($.length)return nt($),null;t.id||(d||(d=Y()),c.request_id=d);let _=await vt(c);d="";let g=!t.id;if(t.id=_.id,t.job_no=_.job_no,i("#qt-jobno").textContent=_.job_no,g){try{history.replaceState(null,"","#/quotation/"+_.id)}catch{}if(P("void")&&!i("#qt-cancel")){let r=document.createElement("button");r.className="btn btn-danger",r.id="qt-cancel",r.textContent="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",i("#qt-save").before(r),r.onclick=()=>st(e,t)}}return s||k("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 "+_.job_no,"ok"),{r:_,c:a}}i("#qt-save").onclick=()=>{u||H("qt-save",async()=>{I(!0);try{await it(!1)}catch(s){C(s,"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{I(!1)}})};let W=()=>(b(),tt({...t,items:z(t.items)}));i("#qt-pv").onclick=()=>S(W(),"preview"),i("#qt-pdf").onclick=()=>S(W(),"pdf"),i("#qt-print").onclick=()=>S(W(),"print"),i("#qt-back").onclick=()=>{location.hash="#/quotation"},i("#qt-cancel")&&(i("#qt-cancel").onclick=()=>st(e,t)),i("#qt-issue").onclick=()=>{u||H("qt-issue",async()=>{let s=y(),a=N(),l=K({...t,items:s.items,issue_date:a},s.c,"issue");if(l.length){nt(l);return}let c=t.valid_until||O(a,R);if(await Q("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32",`\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 Quotation \u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${n(w(a))} \xB7 Valid Until ${n(w(c))}<br>\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 <b>${p(s.c.grand_total_c)} ${n(t.currency)}</b><br>\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49`,"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32")){I(!0);try{let _=await it(!0);if(!_)return;o||(o=Y());let g=await _t({id:t.id,request_id:o,grand_total:_.c.grand_total,amount_words_en:L(_.c.grand_total_c,t.currency),amount_words_th:j(_.c.grand_total_c,t.currency),company:Z()});o="",k("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 \u2014 "+g.quotation_no,"ok"),await wt(e,{id:t.id})}catch(_){C(_,"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{e.querySelector("#qt-issue")&&I(!1)}}})},E()}export{wt as render};
