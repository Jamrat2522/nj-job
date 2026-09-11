import{a as C}from"./chunk-UWAYW6DC.js";import{a as P}from"./chunk-DIH2PLYD.js";import{a as M,c as I,e as x}from"./chunk-PCFU74ZV.js";var A=t=>t==null||t===""||Number(t)===0?"-":M(t),h=(t,s="-")=>{let a=t==null?"":String(t).trim();return x(a||s)},v=t=>{let s=Number(t);return Number.isFinite(s)?s:0},_=t=>Math.round((v(t)+Number.EPSILON)*100)/100,Z={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},S=t=>`<span class="ivd-ic">${Z[t]||""}</span>`,U=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function K(t,s){let a=0,i=0,n=0,r=0;for(let c of s)U(c)?r=_(r+v(c.amount)):n=_(n+v(c.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(n=_(v(t.service_amount)),r=_(v(t.advance_amount)));for(let c of s)v(c.vat_amount)>0||v(c.vat_rate)>0?a=_(a+v(c.amount)):i=_(i+v(c.amount));let o=_(t.vat_amount),b=[...new Set(s.map(c=>v(c.vat_rate)).filter(c=>c>0))],$=b.length===1?b[0]:v(t.vat_rate)||7,u=_(a+o);return{vatBase:a,nonVat:i,vat:o,vatRate:$,total:u,grand:_(u+i),svcCol:n,advCol:r}}function G(t){let s=new Map;for(let i of t){let n=v(i.wht_rate);n<=0||s.set(n,_((s.get(n)||0)+v(i.wht_amount)))}let a=[{rate:1,label:"Transportation",amt:s.get(1)||0},{rate:3,label:"Service",amt:s.get(3)||0}];for(let[i,n]of[...s.entries()].sort((r,o)=>r[0]-o[0]))i!==1&&i!==3&&a.push({rate:i,label:"Other",amt:n});return a}function J(t,{draft:s=!1,kind:a="",tpl:i=null,job:n=null}={}){let r=t.items||[],o=K(t,r),$=String(a).toUpperCase()==="SERVICE",u=e=>$?String(e).replace(/\s*:\s*$/,"")+" :":e,c=t.customer||{},p=t.job||{},d={cusName:t.customer_name||c.name,cusTax:t.customer_tax_id||c.tax_id,cusBranch:t.customer_branch_code||c.branch_code,cusAddr:t.customer_address||c.address,cusTel:t.customer_phone||c.phone,invNo:s&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||p.job_no,declNo:t.customs_declaration_no||p.customs_declaration_no,cusPo:t.customer_job_no||p.customer_job_no,master:t.master_bl_no||p.master_bl_no,house:t.house_bl_no||p.house_bl_no,remarks:t.remarks||t.job_note||p.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},E=(e,f)=>e.map((l,N)=>{let L=U(l),z=v(l.amount);return`<tr>
      <td class="c ivd-no">${v(l.line_no)>0?v(l.line_no):f+N+1}</td>
      <td class="ivd-desc">${h(l.description,"")}</td>
      <td class="r">${L?"-":A(z)}</td>
      <td class="r">${L?A(z):"-"}</td>
      <td class="r">${A(l.unit_price)}</td>
      <td class="r">${A(z)}</td></tr>`}).join("")||'<tr><td colspan="6" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',m=G(r).map(e=>`<div class="ivd-wl"><span>${e.rate} % ${e.label}</span><span>${M(e.amt)}</span></div>`).join(""),g=["eta","etd","release_date","delivery_date","overtime_date","job_date"],T=e=>{if(!e)return"";for(let f of[t,p,n||{}]){if(!f)continue;let l=f[e];if(l!=null&&String(l).trim()!=="")return g.includes(e)?I(l):l}return""},w=[{label:"Decl No.",value:h(d.declNo)},{label:"Customer PO",value:h(d.cusPo)},{label:"Master",value:h(d.master)},{label:"House",value:h(d.house)}],y=["tl","tr","bl","br"],j=e=>{let l=(i&&i.fields||[]).find(N=>N&&N.key===e);return l?String(l.label||"").trim():""},W=i&&y.every(e=>i[e+"_source"])?y.map((e,f)=>({label:j(i[e+"_source"])||String(i[e+"_label"]||"").trim()||w[f].label,value:h(T(i[e+"_source"]))})):w,B=e=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${e}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`,D=15,O=[...r].sort((e,f)=>v(e.line_no)-v(f.line_no)),k=[];for(let e=0;e<O.length;e+=D)k.push(O.slice(e,e+D));return k.length||k.push([]),k.map((e,f)=>{let l=f===k.length-1,N=E(e,f*D);return`
    <div class="ivd print-area${s?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${C.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${x(C.nameEn)}</div>
            <div class="ivd-co-ad">${x(C.address)}</div>
            <div class="ivd-co-tl">Tel. ${x(C.tel)} <i>|</i> Fax. ${x(C.fax)}
              <i>|</i> Tax ID ${x(C.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r">
          ${s?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${S("user")}<div class="ivd-fb"><label>${u("Customer Name")}</label>
              <div class="v">${h(d.cusName)}</div></div></div>
            <div class="ivd-f">${S("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${u("Tax ID")}</label><div class="v">${h(d.cusTax)}</div></div>
              <div><label>${u("Branch")}</label><div class="v">${h(d.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${S("pin")}<div class="ivd-fb"><label>${u("Address")}</label>
              <div class="v">${h(d.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${S("doc")}<div class="ivd-fb ivd-kv">
              <label>${u("Invoice No.")}</label><div class="v v-lg">${d.invNo?x(d.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${S("cal")}<div class="ivd-fb ivd-kv">
              <label>${u("Date")}</label><div class="v v-lg">${I(d.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${S("job")}<div class="ivd-fb ivd-kv">
              <label>${u("Job No.")}</label><div class="v v-lg">${h(d.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${W.map(L=>`<div class="ivd-rf"><label>${u(L.label)}</label><span>${L.value}</span></div>`).join("")}
      </section>

      <table class="ivd-tbl">
        <colgroup><col class="w-no"><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-unit"><col class="w-tot"></colgroup>
        <thead><tr>
          
          <th class="c">No.</th>
          <th>Description</th>
          <th class="r">Service</th>
          <th class="r">Advance</th>
          <th class="r">Unit Price</th><th class="r">Total Amount</th>
        </tr></thead>
        <tbody>${N}</tbody>
        
        <tfoot>${l?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2">${S("sum")}<b>TOTAL</b></td>
          <td class="r">${A(o.svcCol)}</td>
          <td class="r">${A(o.advCol)}</td>
          <td></td>
          <td class="r ivd-trow-g">${M(_(o.svcCol+o.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${l?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${h(d.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${h(d.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${o.vatRate} %</span><span>${M(o.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${o.vatRate} %</span><span>${M(o.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${M(o.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${M(o.advCol)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${M(o.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${m}</div>
        ${B("For The Customer")}
        ${B("For The "+x(C.nameEn))}
      </section>
      </div>`:""}

      
      ${l?`<footer class="ivd-bar">
        <div>${S("user")}Created By : <b>${h(d.createdBy)}</b></div>
        <div>${S("print")}Printed Date : <b>${I(new Date().toISOString().slice(0,10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>`:""}
    </div>`}).join("")}var R="nj-print-doc",Y=/[\\/:*?"<>|\u0000-\u001f]/g,V=t=>String(t??"").replace(Y," ").replace(/\s+/g," ").trim();function X(t){let s=t||{},a=V(s.job_no||s.job&&s.job.job_no||""),i=V(s.company_invoice||"");return[a,i].filter(Boolean).join(" - ")||"INVOICE"}function F(t){let s=document.body;s.classList.add(R);let a=document.title;t&&(document.title=t);let i=()=>{s.classList.remove(R),t&&(document.title=a)};window.addEventListener("afterprint",i,{once:!0});try{let n=window.matchMedia("print"),r=o=>{o.matches||(i(),n.removeEventListener("change",r))};n.addEventListener("change",r)}catch{}window.print()}var H=24,Q=.5,tt=1.5,q=.1;function st(t,s){let a=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),n=t.querySelector(".ivd");if(!a||!i||!n)return()=>{};let r=()=>i.scrollHeight||n.offsetHeight||0,o="fit",b=1,$=null,u=()=>{let m=a.parentElement||a,g=(m.clientWidth||0)-H,T=(m.clientHeight||0)-H,w=n.offsetWidth||0,y=r();return g<=0||w<=0||y<=0?1:T>0?Math.min(g/w,T/y,1):Math.min(g/w,1)},c=()=>{let m=o==="fit"?u():b;i.style.transform="scale("+m+")",a.style.width=Math.ceil((n.offsetWidth||0)*m)+"px",a.style.height=Math.ceil(r()*m)+"px",a.dataset.scale=String(Math.round(m*1e3)/1e3),$&&($.textContent=Math.round(m*100)+"%")};if(s){let m=s.querySelector(".mf-left")||s,g=document.createElement("div");g.className="ivd-zoom",g.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',m.appendChild(g),$=g.querySelector("#ivd-zoom-v"),g.addEventListener("click",T=>{let w=T.target.closest("[data-z]");if(!w)return;let y=w.dataset.z;if(y==="fit")o="fit";else{let j=o==="fit"?u():b;y==="100"?b=1:b=Math.min(tt,Math.max(Q,Math.round((j+(y==="in"?q:-q))*100)/100)),o="zoom"}c()})}c();let p=m=>typeof requestAnimationFrame=="function"?requestAnimationFrame(m):setTimeout(m,16);p(()=>p(c));let d=()=>{o==="fit"&&c()},E=null;try{E=new ResizeObserver(d),E.observe(a.parentElement||a)}catch{window.addEventListener("resize",d)}return window.addEventListener("orientationchange",d),()=>{try{E&&E.disconnect()}catch{}window.removeEventListener("resize",d),window.removeEventListener("orientationchange",d)}}function nt(t,{draft:s=!1,print:a=!1,kind:i="",tpl:n=null,job:r=null}={}){let o=document.createElement("div");o.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+J(t,{draft:s,kind:i,tpl:n,job:r})+"</div></div>";let b=document.createElement("div");b.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${s?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,P({title:s?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:o,footer:b,fullscreen:!0,wide:!0});let $=st(o,b);b.querySelector("[data-close]").addEventListener("click",$,{once:!0});let u=X(t);b.querySelector("#ivd-print").onclick=()=>F(u),a&&setTimeout(()=>F(u),60)}export{U as a,J as b,X as c,nt as d};
