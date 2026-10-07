import{A as Lt,C as st,a as ht,b as $t,c as gt,d as wt,e as xt,f as Et,g as Tt,h as Dt,i as kt,j as Z,k as tt,l as St,m as F,n as Ct,o as Q,p as b,q as D,r as V,s as W,t as R,u as et,v as at,w as H,x as I,y as K,z as M}from"./chunk-ARV6VWIV.js";import"./chunk-OWSY2KDQ.js";import{k as ft,l as yt}from"./chunk-2OWLQSES.js";import{i as j}from"./chunk-IZR646UK.js";import{a as T}from"./chunk-UWAYW6DC.js";import{e as B,f as X}from"./chunk-DEEXF5YQ.js";import{e as U,f as J}from"./chunk-OPGKUGLK.js";import{a as L}from"./chunk-YM5GFE6V.js";import"./chunk-GDT6F23K.js";import{a as C}from"./chunk-OFOOXWUM.js";import{a as pt,b as qt,d as O,e as bt}from"./chunk-DIH2PLYD.js";import{c as E,e as d}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";function it(){return{name:T.nameEn||"",address:T.address||"",tax_id:T.taxId||"",tel:T.tel||"",email:T.email||""}}function Nt(e){let t=e.snapshot||{},i=R({items:t.items,discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled,vat_rate:t.vat_rate});return{status:e.status,draft:!1,cancelled:e.status==="CANCELLED",company:t.company||{},quotation_no:t.quotation_no,quotation_date:t.quotation_date,valid_until:t.valid_until,job_no:t.job_no,customer:t.customer||{},detail:t.detail,currency:t.currency||"THB",calc:i,totals:{subtotal:D(t.subtotal),discount:D(t.discount_amount),tax_base:D(t.tax_base),vat:D(t.vat_amount),grand:D(t.grand_total)},discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled!==!1,vat_rate:t.vat_rate,words_en:t.amount_words_en||H(D(t.grand_total),t.currency),words_th:t.amount_words_th||I(D(t.grand_total),t.currency),remark:t.remark,terms:t.terms,issued_by:t.issued_by,created_by:t.created_by}}function dt(e){let t=R(e),i=M();return{status:"DRAFT",draft:!0,cancelled:!1,company:it(),quotation_no:"",quotation_date:i,valid_until:e.valid_until||K(i,Q),job_no:e.job_no||"",customer:{name:e.customer_name,attention:e.attention,address:e.customer_address,tax_id:e.customer_tax_id,tel:e.customer_tel,email:e.customer_email},detail:e.detail,currency:e.currency||"THB",calc:t,totals:{subtotal:t.subtotal_c,discount:t.discount_c,tax_base:t.tax_base_c,vat:t.vat_c,grand:t.grand_total_c},discount_type:t.discount_type,discount_value:t.discount_value,vat_enabled:t.vat_enabled,vat_rate:t.vat_rate,words_en:H(t.grand_total_c,e.currency||"THB"),words_th:I(t.grand_total_c,e.currency||"THB"),remark:e.remark,terms:e.terms,created_by:e.created_by_name||""}}var Y=e=>d(e||"").replace(/\n/g,"<br>");function ot(e){let t=e.company||{},i=e.customer||{},r=e.totals,c=d(e.currency||"THB"),v=V(e.vat_rate||"0"),f=0,_=(e.calc.items||[]).filter(h=>h.title||h.lines.length).map((h,S)=>{let N=h.lines.filter($=>$.description||$.amount_c>0n).map($=>(f+=1,`<tr class="qtd-ln"><td class="c">${f}</td><td class="qtd-desc">${d($.description)}</td>
        <td class="r">${V($.qty)}</td><td class="c">${d($.unit)}</td>
        <td class="r">${W($.unit_price)}</td><td class="r">${b($.amount_c)}</td></tr>`)).join("");return`<tbody class="qtd-grp">
      <tr class="qtd-gh"><td colspan="6">${d(St(S,h.title))}</td></tr>
      ${N}
      <tr class="qtd-gs"><td colspan="5" class="r">Subtotal</td><td class="r">${b(h.subtotal_c)}</td></tr>
    </tbody>`}).join(""),n=e.discount_type==="PERCENT"?`Discount (${V(e.discount_value)}%)`:"Discount",k=e.cancelled?'<div class="qtd-wm qtd-wm-x" aria-hidden="true">CANCELLED</div>':e.draft?'<div class="qtd-wm" aria-hidden="true">DRAFT</div>':"",y=(h,S,N="")=>`<div class="qtd-kv ${N}"><span>${h}</span><b>${S}</b></div>`;return`<div class="qtd" data-status="${d(e.status)}">
    ${k}
    <header class="qtd-head">
      <div class="qtd-co">
        ${T.logo?`<img class="qtd-logo" src="${d(T.logo)}" alt="">`:""}
        <div class="qtd-co-tx">
          <div class="qtd-co-nm">${d(t.name)}</div>
          ${t.address?`<div class="qtd-co-ad">${d(t.address)}</div>`:""}
          <div class="qtd-co-ad">${[t.tel?"Tel. "+d(t.tel):"",t.email?"Email: "+d(t.email):"",t.tax_id?"Tax ID: "+d(t.tax_id):""].filter(Boolean).join(" &nbsp;\xB7&nbsp; ")}</div>
        </div>
      </div>
      <div class="qtd-ttl"><div class="qtd-ttl-en">QUOTATION</div><div class="qtd-ttl-th">\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</div></div>
    </header>
    <section class="qtd-info">
      <div class="qtd-box qtd-cust">
        <div class="qtd-box-t">CUSTOMER</div>
        <div class="qtd-cu-nm">${d(i.name)}</div>
        ${i.address?`<div class="qtd-cu-l">${Y(i.address)}</div>`:""}
        ${i.tax_id?`<div class="qtd-cu-l">Tax ID: ${d(i.tax_id)}</div>`:""}
        ${i.tel||i.email?`<div class="qtd-cu-l">${[i.tel?"Tel. "+d(i.tel):"",i.email?d(i.email):""].filter(Boolean).join(" \xB7 ")}</div>`:""}
        ${i.attention?`<div class="qtd-cu-l"><b>Attention:</b> ${d(i.attention)}</div>`:""}
      </div>
      <div class="qtd-box qtd-meta">
        ${y("Quotation No.",e.quotation_no?d(e.quotation_no):'<i class="qtd-dr">DRAFT</i>')}
        ${y("Date",d(E(e.quotation_date)))}
        ${y("Valid Until",d(E(e.valid_until)))}
        ${y("Job No.",d(e.job_no||"-"))}
        ${y("Currency",c)}
      </div>
    </section>
    ${e.detail?`<section class="qtd-detail"><b>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 / Detail</b><div>${Y(e.detail)}</div></section>`:""}
    <table class="qtd-tbl">
      <colgroup><col class="w-no"><col><col class="w-qty"><col class="w-unit"><col class="w-pr"><col class="w-amt"></colgroup>
      <thead><tr><th class="c">No.</th><th>Description</th><th class="r">Qty</th><th class="c">Unit</th>
        <th class="r">Unit Price</th><th class="r">Amount (${c})</th></tr></thead>
      ${_||'<tbody><tr><td colspan="6" class="c qtd-empty">\u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014</td></tr></tbody>'}
    </table>
    <section class="qtd-bottom">
      <div class="qtd-words">
        <div class="qtd-box-t">AMOUNT IN WORDS</div>
        <div class="qtd-w-en">${d(e.words_en)}</div>
        ${e.words_th?`<div class="qtd-w-th">(${d(e.words_th)})</div>`:""}
      </div>
      <div class="qtd-sum">
        ${y("Subtotal",b(r.subtotal))}
        ${r.discount>0n?y(n,b(r.discount)):""}
        ${y("Tax Base",b(r.tax_base))}
        ${y(e.vat_enabled?`VAT ${v}%`:"VAT (\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14 VAT)",b(r.vat))}
        ${y(`Grand Total (${c})`,b(r.grand),"qtd-grand")}
      </div>
    </section>
    ${e.remark||e.terms?`<section class="qtd-notes">
      ${e.remark?`<div class="qtd-note"><div class="qtd-box-t">REMARK</div><div>${Y(e.remark)}</div></div>`:""}
      ${e.terms?`<div class="qtd-note"><div class="qtd-box-t">TERMS &amp; CONDITIONS</div><div>${Y(e.terms)}</div></div>`:""}
    </section>`:""}
    <section class="qtd-sign">
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Prepared by</div>
        <div class="qtd-sg-n">${d(e.issued_by||e.created_by||"")}</div></div>
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Authorized Signature</div>
        <div class="qtd-sg-n">${d(t.name)}</div></div>
      <div class="qtd-sg"><div class="qtd-sg-l"></div><div>Customer Acceptance</div>
        <div class="qtd-sg-n">Date ____/____/______</div></div>
    </section>
  </div>`}var At="nj-print-doc";function nt(e){let t=document.body,i=document.title;t.classList.add(At),e&&(document.title=e);let r=!1,c=()=>{r||(r=!0,t.classList.remove(At),document.title=i)};window.addEventListener("afterprint",c,{once:!0});try{let v=window.matchMedia("print"),f=_=>{_.matches||(c(),v.removeEventListener("change",f))};v.addEventListener("change",f)}catch{}window.print()}function A(e,t="preview"){let i=Lt(e.quotation_no||"DRAFT-"+(e.job_no||"QUOTATION"),e.customer&&e.customer.name),r=document.createElement("div");r.className="qtd-stage",r.innerHTML=`<div class="qtd-paper print-area">${ot(e)}</div>`;let c=document.createElement("div");if(c.className="qtd-pv-f",c.innerHTML=`${e.draft?'<span class="qtd-pv-note">DRAFT \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</span>':""}
    <span class="sp"></span>
    <button class="btn btn-o" data-close>\u0E1B\u0E34\u0E14</button>
    <button class="btn btn-o" id="qtd-pdf">Export PDF</button>
    <button class="btn btn-p" id="qtd-print">Print</button>`,pt({title:e.quotation_no?"Quotation "+e.quotation_no:"Preview Quotation (DRAFT)",body:r,footer:c,fullscreen:!0,cls:"qt-pv-modal"}),c.querySelector("#qtd-print").onclick=()=>nt(i),c.querySelector("#qtd-pdf").onclick=()=>{C('\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 "Save as PDF" \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C \u2014 \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C: '+i+".pdf"),nt(i)},t==="print"||t==="pdf"){let v=r.querySelector("img.qtd-logo"),f=!1,_=()=>{f||(f=!0,nt(i))};v&&!v.complete?(v.addEventListener("load",_,{once:!0}),v.addEventListener("error",_,{once:!0}),setTimeout(_,1200)):setTimeout(_,0)}return{close:qt,file:i}}var w={headers:[],descriptions:[],ok:!1};async function Ht(){try{let e=await xt();w.headers=e&&e.headers||[],w.descriptions=e&&e.descriptions||[],w.ok=!0}catch{w.headers=kt.map((t,i)=>({id:"preset-"+i,name:t})),w.descriptions=[],w.ok=!1}}async function It(e,t){let i=await Et({kind:e,name:t}),r=e==="HEADER"?w.headers:w.descriptions;return r.some(c=>c.id===i.id)||(r.push({id:i.id,name:i.name}),r.sort((c,v)=>F(c.name).localeCompare(F(v.name)))),i}var lt=()=>({description:"",qty:"1",unit:"",unit_price:""}),G=()=>({title:"",lines:[lt()]}),P=e=>e==null?"":String(e);function Mt(e){return{id:"",job_no:"",job_date:M(),status:"DRAFT",customer_id:"",customer_name:"",attention:"",customer_address:"",customer_tax_id:"",customer_tel:"",customer_email:"",detail:"",currency:"THB",items:[G()],discount_type:"NONE",discount_value:"",vat_enabled:!0,vat_rate:P(e??7),valid_until:"",remark:"",terms:Ct}}function Ft(e){let t=(Array.isArray(e.items)?e.items:[]).map(i=>({title:tt(i.title||""),lines:(i.lines||[]).map(r=>({description:r.description||"",qty:P(r.qty),unit:r.unit||"",unit_price:P(r.unit_price)}))}));return{id:e.id,job_no:e.job_no,job_date:e.job_date,status:e.status,customer_id:e.customer_id||"",customer_name:e.customer_name||"",attention:e.attention||"",customer_address:e.customer_address||"",customer_tax_id:e.customer_tax_id||"",customer_tel:e.customer_tel||"",customer_email:e.customer_email||"",detail:e.detail||"",currency:e.currency||"THB",items:t.length?t:[G()],discount_type:e.discount_type||"NONE",discount_value:e.discount_type&&e.discount_type!=="NONE"?P(e.discount_value):"",vat_enabled:e.vat_enabled!==!1,vat_rate:P(e.vat_rate),valid_until:e.valid_until||"",remark:e.remark||"",terms:e.terms||"",created_by_name:e.created_by_name||"",quotation_no:e.quotation_no,quotation_date:e.quotation_date,issued_at:e.issued_at,issued_by_name:e.issued_by_name,cancelled_at:e.cancelled_at,cancelled_by_name:e.cancelled_by_name,cancel_reason:e.cancel_reason,created_at:e.created_at,snapshot:e.snapshot}}async function jt(e,t={}){let i=t.id&&t.id!=="new"?t.id:"",r=null;await Ht();try{r=await ft()}catch(v){L(v,"\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}let c;if(i){let v;try{v=await wt(i)}catch(f){L(f,"\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),e.innerHTML='<div class="card card-pad empty">\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \xB7 <a href="#/quotation">\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</a></div>';return}if(c=Ft(v),c.status!=="DRAFT"){Pt(e,c);return}}else c=Mt(r&&r.vat_rate);Ot(e,c)}function Qt(e){if(e.snapshot&&e.status!=="DRAFT")return Nt(e);let t=dt(e);return e.status==="CANCELLED"&&(t.status="CANCELLED",t.cancelled=!0,t.draft=!1),t}function Pt(e,t){let i=Qt(t),r=t.status==="ISSUED"&&j("void");e.innerHTML=`
    <div class="card qt-vbar">
      <div class="qt-vinfo">
        <button class="btn btn-o btn-sm" id="qt-back">\u2190 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
        <b>${d(t.quotation_no||t.job_no)}</b> ${st(t.status)}
        <span class="t-3 t-xs">\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 ${d(t.job_no)}${t.issued_at?" \xB7 \u0E2D\u0E2D\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D "+d(E(String(t.issued_at).slice(0,10)))+(t.issued_by_name?" \u0E42\u0E14\u0E22 "+d(t.issued_by_name):""):""}${t.cancelled_at?" \xB7 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D "+d(E(String(t.cancelled_at).slice(0,10)))+(t.cancelled_by_name?" \u0E42\u0E14\u0E22 "+d(t.cancelled_by_name):"")+(t.cancel_reason?" ("+d(t.cancel_reason)+")":""):""}</span>
      </div>
      <div class="qt-acts">
        ${r?'<button class="btn btn-danger" id="qt-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</button>':""}
        <button class="btn btn-o" id="qt-pv">Preview Quotation</button>
        <button class="btn btn-o" id="qt-pdf">Export PDF</button>
        <button class="btn btn-p" id="qt-print">Print</button>
      </div>
    </div>
    <div class="qt-inline-doc"><div class="qtd-paper">${ot(i)}</div></div>`;let c=v=>e.querySelector(v);c("#qt-back").onclick=()=>{location.hash="#/quotation"},c("#qt-pv").onclick=()=>A(i,"preview"),c("#qt-pdf").onclick=()=>A(i,"pdf"),c("#qt-print").onclick=()=>A(i,"print"),r&&(c("#qt-cancel").onclick=()=>rt(e,t))}async function rt(e,t){let i=await bt("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 "+(t.quotation_no||t.job_no));i&&await U("qt-cancel",async()=>{try{await gt({id:t.id,reason:i}),C("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 (\u0E40\u0E25\u0E02\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E22\u0E31\u0E07\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48)","ok"),await jt(e,{id:t.id})}catch(r){L(r,"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}})}function Ot(e,t){let i="",r="",c=!1,v=t.customer_id||"",f=()=>yt();e.innerHTML=`
    <div class="qt-form">
      <div class="card card-pad qt-sec">
        <div class="qt-g2">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</label>
            <div class="inp qt-ro" id="qt-jobno">${d(t.job_no||"\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")}</div></div>
          <div class="fld"><label for="qt-date">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label>
            <input class="inp" type="date" id="qt-date" value="${d(t.job_date)}"></div>
          <div class="fld"><label for="qt-cust">\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
            ${B("qt-cust",f(),t.customer_id,"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E08\u0E32\u0E01 Customer Master")}</div>
          <div class="fld"><label for="qt-att">Attention</label>
            <input class="inp" id="qt-att" value="${d(t.attention)}" autocomplete="off"></div>
          <div class="fld qt-span2"><label for="qt-addr">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
            <textarea class="inp" id="qt-addr" rows="2">${d(t.customer_address)}</textarea></div>
          <div class="fld"><label for="qt-tax">Tax ID</label>
            <input class="inp" id="qt-tax" value="${d(t.customer_tax_id)}" autocomplete="off"></div>
          <div class="fld qt-g2in">
            <div><label for="qt-tel">Tel.</label><input class="inp" id="qt-tel" value="${d(t.customer_tel)}" autocomplete="off"></div>
            <div><label for="qt-mail">Email</label><input class="inp" id="qt-mail" value="${d(t.customer_email)}" autocomplete="off"></div>
          </div>
          <div class="fld"><label for="qt-valid">Valid Until</label>
            <input class="inp" type="date" id="qt-valid" value="${d(t.valid_until)}">
            <div class="t-xs t-3">\u0E27\u0E48\u0E32\u0E07 = \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 + ${Q} \u0E27\u0E31\u0E19</div></div>
          <div class="fld"><label for="qt-cur">Currency</label>
            <select class="sel" id="qt-cur">${Tt.map(a=>`<option ${a===t.currency?"selected":""}>${a}</option>`).join("")}</select></div>
          <div class="fld qt-span2"><label for="qt-detail">\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</label>
            <textarea class="inp" id="qt-detail" rows="3">${d(t.detail)}</textarea></div>
        </div>
      </div>

      <div class="card card-pad qt-sec">
        <div class="qt-sec-t">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22</div>
        <div id="qt-items"></div>
        <button class="btn btn-o btn-sm" id="qt-add-h">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D</button>
        <datalist id="qt-units">${Dt.map(a=>`<option value="${a}">`).join("")}</datalist>
      </div>

      <div class="card card-pad qt-sec qt-tot-wrap">
        <div class="qt-notes">
          <div class="fld"><label for="qt-remark">Remark</label>
            <textarea class="inp" id="qt-remark" rows="3">${d(t.remark)}</textarea></div>
          <div class="fld"><label for="qt-terms">Terms &amp; Conditions</label>
            <textarea class="inp" id="qt-terms" rows="4">${d(t.terms)}</textarea></div>
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
        <span class="qt-st">${st("DRAFT")}</span>
        <span class="sp"></span>
        ${t.id&&j("void")?'<button class="btn btn-danger" id="qt-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>':""}
        <button class="btn btn-o" id="qt-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
        <button class="btn btn-o" id="qt-pv">Preview Quotation</button>
        <button class="btn btn-p" id="qt-issue">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32</button>
        <button class="btn btn-o" id="qt-pdf">Export PDF</button>
        <button class="btn btn-o" id="qt-print">Print</button>
      </div>
    </div>`;let _=e.querySelector(".qt-form"),n=a=>_.querySelector(a);n("#qt-dtype").value=t.discount_type,n("#qt-dval").value=t.discount_value,n("#qt-vat").checked=t.vat_enabled;function k(){n("#qt-items").innerHTML=t.items.map((l,o)=>`
      <div class="qt-svc" data-h="${o}">
        <div class="qt-svc-h">
          <span class="qt-svc-no">${o+1}</span>
          
          <span class="qt-svc-letter" data-letter="${o}">(${Z(o)})</span>
          <div class="qt-svc-in">
            ${B("qt-h-"+o,[],"","\u0E04\u0E49\u0E19\u0E2B\u0E32/\u0E40\u0E25\u0E37\u0E2D\u0E01 Service Header")}
            <button type="button" class="btn btn-o btn-sm" data-open-h="${o}" title="\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Service Header">\uFF0B</button>
          </div>
          <button type="button" class="btn-icon qt-del" data-del-h="${o}" title="\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D" aria-label="\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D">\u{1F5D1}</button>
        </div>
        <div class="tbl-wrap"><table class="tbl qt-lines">
          <thead><tr><th class="qt-w-no">No.</th><th>Description</th><th class="qt-w-qty r">Qty</th>
            <th class="qt-w-unit">Unit</th><th class="qt-w-pr r">Unit Price</th><th class="qt-w-amt r">Amount</th><th class="qt-w-x"></th></tr></thead>
          <tbody>${l.lines.map((p,u)=>`<tr>
            <td class="center t-3">${u+1}</td>
            <td>${B("qt-d-"+o+"-"+u,[],"","\u0E04\u0E49\u0E19\u0E2B\u0E32/\u0E40\u0E25\u0E37\u0E2D\u0E01 Description")}</td>
            <td><input class="inp qt-num" data-f="qty" data-h="${o}" data-l="${u}" value="${d(p.qty)}" inputmode="decimal" autocomplete="off"></td>
            <td><input class="inp" data-f="unit" data-h="${o}" data-l="${u}" value="${d(p.unit)}" list="qt-units" autocomplete="off"></td>
            <td><input class="inp qt-num" data-f="unit_price" data-h="${o}" data-l="${u}" value="${d(p.unit_price)}" inputmode="decimal" autocomplete="off"></td>
            <td class="r qt-amt" data-amt="${o}-${u}">0.00</td>
            <td><button type="button" class="btn-icon qt-del" data-del-l="${o}-${u}" title="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" aria-label="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u2715</button></td>
          </tr>`).join("")}</tbody>
          <tfoot><tr><td colspan="5" class="r t-b">Subtotal</td><td class="r t-b" data-gsub="${o}">0.00</td><td></td></tr></tfoot>
        </table></div>
        <button type="button" class="btn btn-o btn-sm" data-add-l="${o}">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21 Description</button>
      </div>`).join("");let a=w.ok&&(j("create")||j("edit")),s=(l,o,p,u,m,q)=>{let x=n("#"+l);x.value=o||"",x.dataset.f=p,x.dataset.h=String(u),m!==void 0&&(x.dataset.l=String(m));let vt=()=>q==="HEADER"?w.headers:w.descriptions,_t=vt().find(g=>F(g.name)===F(o));x.dataset.id=_t?_t.id:"",X(_,l,{getItems:vt,fixedList:!0,wide:!0,limit:50,canCreate:a,createLabel:g=>q==="HEADER"?"\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E43\u0E2B\u0E21\u0E48 \u201C"+g+"\u201D":"\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21 Description \u201C"+g+"\u201D",onCreate:async g=>{try{return(await It(q,g)).id}catch(Rt){return L(Rt,"\u0E40\u0E1E\u0E34\u0E48\u0E21 Master \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),null}},onChange:()=>{let g=t.items[u];g&&(p==="title"?g.title=x.value:g.lines[m]&&(g.lines[m].description=x.value),h())}})};t.items.forEach((l,o)=>{s("qt-h-"+o,l.title,"title",o,void 0,"HEADER"),l.lines.forEach((p,u)=>s("qt-d-"+o+"-"+u,p.description,"description",o,u,"DESCRIPTION"))}),h()}function y(){t.job_date=n("#qt-date").value||M(),t.customer_name=n("#qt-cust").value.trim(),t.customer_id=n("#qt-cust").dataset.id||"",t.attention=n("#qt-att").value,t.customer_address=n("#qt-addr").value,t.customer_tax_id=n("#qt-tax").value,t.customer_tel=n("#qt-tel").value,t.customer_email=n("#qt-mail").value,t.valid_until=n("#qt-valid").value,t.currency=n("#qt-cur").value,t.detail=n("#qt-detail").value,t.remark=n("#qt-remark").value,t.terms=n("#qt-terms").value,t.discount_type=n("#qt-dtype").value,t.discount_value=n("#qt-dval").value,t.vat_enabled=n("#qt-vat").checked}function h(){y();let a=R(t);a.items.forEach((l,o)=>{l.lines.forEach((u,m)=>{let q=_.querySelector(`[data-amt="${o}-${m}"]`);q&&(q.textContent=b(u.amount_c))});let p=_.querySelector(`[data-gsub="${o}"]`);p&&(p.textContent=b(l.subtotal_c))}),_.querySelectorAll(".qt-num.qt-bad").forEach(l=>l.classList.remove("qt-bad")),a.errors.forEach(l=>{if(l.h===void 0){/^DISCOUNT/.test(l.code)&&n("#qt-dval").classList.add("qt-bad");return}let o=/^QTY/.test(l.code)?"qty":"unit_price",p=_.querySelector(`[data-f="${o}"][data-h="${l.h}"][data-l="${l.l}"]`);p&&p.classList.add("qt-bad")}),n("#qt-dval").disabled=t.discount_type==="NONE",n("#qt-sub").textContent=b(a.subtotal_c),n("#qt-disc").textContent=b(a.discount_c),n("#qt-base").textContent=b(a.tax_base_c),n("#qt-vrate").textContent=a.vat_rate,n("#qt-vatamt").textContent=b(a.vat_c),n("#qt-grand").textContent=b(a.grand_total_c),n("#qt-gcur").textContent="("+t.currency+")",n("#qt-wen").textContent=H(a.grand_total_c,t.currency);let s=I(a.grand_total_c,t.currency);return n("#qt-wth").textContent=s?"("+s+")":"",a}_.addEventListener("input",a=>{let s=a.target;if(s.dataset&&s.dataset.f){let l=t.items[+s.dataset.h];if(!l)return;if(s.dataset.f==="title")l.title=s.value;else{let o=l.lines[+s.dataset.l];o&&(o[s.dataset.f]=s.value)}}h()}),_.addEventListener("change",a=>{a.target.matches("select, input[type=checkbox], input[type=date]")&&h()}),_.addEventListener("focusout",a=>{let s=a.target;if(s.dataset&&s.dataset.f==="unit_price"&&s.value.trim()!==""&&!s.classList.contains("qt-bad")){s.value=W(s.value).replace(/,/g,"");let l=t.items[+s.dataset.h]?.lines[+s.dataset.l];l&&(l.unit_price=s.value)}});let S=a=>String(a.description||"").trim()!==""||String(a.unit_price||"").trim()!=="";_.addEventListener("click",async a=>{let s=a.target,l=s.closest("[data-open-h]");if(l){let m=n("#qt-h-"+l.dataset.openH);m&&(m.blur(),m.focus());return}let o=s.closest("[data-add-l]");if(o){t.items[+o.dataset.addL].lines.push(lt()),k();let m=+o.dataset.addL,q=t.items[m].lines.length-1;_.querySelector(`[data-f="description"][data-h="${m}"][data-l="${q}"]`)?.focus();return}let p=s.closest("[data-del-l]");if(p){let[m,q]=p.dataset.delL.split("-").map(Number),x=t.items[m].lines[q];if(S(x)&&!await O("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A Description \u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?","\u0E25\u0E1A"))return;t.items[m].lines.splice(q,1),t.items[m].lines.length||t.items[m].lines.push(lt()),k();return}let u=s.closest("[data-del-h]");if(u){let m=+u.dataset.delH,q=t.items[m];if((String(q.title).trim()||q.lines.some(S))&&!await O("\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E19\u0E35\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?","\u0E25\u0E1A"))return;t.items.splice(m,1),t.items.length||t.items.push(G()),k();return}}),n("#qt-add-h").onclick=()=>{t.items.push(G()),k(),_.querySelector(`[data-f="title"][data-h="${t.items.length-1}"]`)?.focus()},X(e,"qt-cust",{getItems:f,limit:20,searchKeys:["tax_id","contact_name"],meta:a=>[a.code,a.tax_id].filter(Boolean).join(" | "),onChange:a=>{if(a&&a!==v){let s=f().find(l=>l.id===a);s&&(n("#qt-addr").value=s.address||"",n("#qt-tax").value=s.tax_id||"",n("#qt-tel").value=s.phone||"",n("#qt-mail").value=s.email||"",!n("#qt-att").value.trim()&&s.contact_name&&(n("#qt-att").value=s.contact_name))}v=a||"",h()}});function N(){y();let a=at(t.items.map(l=>({...l,title:tt(l.title)}))),s=R({...t,items:a});return{c:s,items:a,p:{id:t.id||null,job_date:t.job_date,customer_id:t.customer_id||null,customer_name:t.customer_name,attention:t.attention,customer_address:t.customer_address,customer_tax_id:t.customer_tax_id,customer_tel:t.customer_tel,customer_email:t.customer_email,detail:t.detail,currency:t.currency,items:s.items.map(l=>({title:l.title,lines:l.lines.map(o=>({description:o.description,qty:o.qty,unit:o.unit,unit_price:o.unit_price}))})),discount_type:s.discount_type,discount_value:s.discount_value,vat_enabled:s.vat_enabled,vat_rate:s.vat_rate,valid_until:t.valid_until||null,remark:t.remark,terms:t.terms}}}let $=a=>{c=a,_.querySelectorAll(".qt-actbar .btn").forEach(s=>{s.disabled=a})};function ct(a){C(a.slice(0,4).join(" \xB7 ")+(a.length>4?` (+${a.length-4})`:""),"err")}function ut(){return t.items.length<2?[]:t.items.map((a,s)=>!String(a.title||"").trim()&&!a.lines.some(S)?`\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D (${Z(s)}) \u0E22\u0E31\u0E07\u0E27\u0E48\u0E32\u0E07 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 Service Header \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E19\u0E35\u0E49`:"").filter(Boolean)}async function mt(a){let{c:s,items:l,p:o}=N(),p=ut().concat(et({...t,items:l},s,"save"));if(p.length)return ct(p),null;t.id||(i||(i=J()),o.request_id=i);let u=await ht(o);i="";let m=!t.id;if(t.id=u.id,t.job_no=u.job_no,n("#qt-jobno").textContent=u.job_no,m){try{history.replaceState(null,"","#/quotation/"+u.id)}catch{}if(j("void")&&!n("#qt-cancel")){let q=document.createElement("button");q.className="btn btn-danger",q.id="qt-cancel",q.textContent="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",n("#qt-save").before(q),q.onclick=()=>rt(e,t)}}return a||C("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 "+u.job_no,"ok"),{r:u,c:s}}n("#qt-save").onclick=()=>{c||U("qt-save",async()=>{$(!0);try{await mt(!1)}catch(a){L(a,"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{$(!1)}})};let z=()=>(y(),dt({...t,items:at(t.items)}));n("#qt-pv").onclick=()=>A(z(),"preview"),n("#qt-pdf").onclick=()=>A(z(),"pdf"),n("#qt-print").onclick=()=>A(z(),"print"),n("#qt-back").onclick=()=>{location.hash="#/quotation"},n("#qt-cancel")&&(n("#qt-cancel").onclick=()=>rt(e,t)),n("#qt-issue").onclick=()=>{c||U("qt-issue",async()=>{let a=N(),s=M(),l=ut().concat(et({...t,items:a.items,issue_date:s},a.c,"issue"));if(l.length){ct(l);return}let o=t.valid_until||K(s,Q);if(await O("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32",`\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 Quotation \u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${d(E(s))} \xB7 Valid Until ${d(E(o))}<br>\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 <b>${b(a.c.grand_total_c)} ${d(t.currency)}</b><br>\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49`,"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32")){$(!0);try{let u=await mt(!0);if(!u)return;r||(r=J());let m=await $t({id:t.id,request_id:r,grand_total:u.c.grand_total,amount_words_en:H(u.c.grand_total_c,t.currency),amount_words_th:I(u.c.grand_total_c,t.currency),company:it()});r="",C("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 \u2014 "+m.quotation_no,"ok"),await jt(e,{id:t.id})}catch(u){L(u,"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{e.querySelector("#qt-issue")&&$(!1)}}})},k()}export{jt as render};
