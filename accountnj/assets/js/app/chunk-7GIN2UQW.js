import{a as C}from"./chunk-UWAYW6DC.js";import{a as R}from"./chunk-DIH2PLYD.js";import{a as M,c as I,e as x}from"./chunk-PCFU74ZV.js";var k=t=>t==null||t===""||Number(t)===0?"-":M(t),h=(t,e="-")=>{let a=t==null?"":String(t).trim();return x(a||e)},r=t=>{let e=Number(t);return Number.isFinite(e)?e:0},g=t=>Math.round((r(t)+Number.EPSILON)*100)/100,W={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},S=t=>`<span class="ivd-ic">${W[t]||""}</span>`,q=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function Z(t,e){let a=0,i=0,d=0,u=0;for(let n of e)q(n)?u=g(u+r(n.amount)):d=g(d+r(n.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(d=g(r(t.service_amount)),u=g(r(t.advance_amount)));for(let n of e)r(n.vat_amount)>0||r(n.vat_rate)>0?a=g(a+r(n.amount)):i=g(i+r(n.amount));let o=g(t.vat_amount),m=[...new Set(e.map(n=>r(n.vat_rate)).filter(n=>n>0))],_=m.length===1?m[0]:r(t.vat_rate)||7,b=g(a+o);return{vatBase:a,nonVat:i,vat:o,vatRate:_,total:b,grand:g(b+i),svcCol:d,advCol:u}}function K(t){let e=new Map;for(let i of t){let d=r(i.wht_rate);d<=0||e.set(d,g((e.get(d)||0)+r(i.wht_amount)))}let a=[{rate:1,label:"Transportation",amt:e.get(1)||0},{rate:3,label:"Service",amt:e.get(3)||0}];for(let[i,d]of[...e.entries()].sort((u,o)=>u[0]-o[0]))i!==1&&i!==3&&a.push({rate:i,label:"Other",amt:d});return a}function G(t,{draft:e=!1,kind:a="",tpl:i=null,job:d=null}={}){let u=t.items||[],o=Z(t,u),_=String(a).toUpperCase()==="SERVICE",b=s=>_?String(s).replace(/\s*:\s*$/,"")+" :":s,n=t.customer||{},p=t.job||{},c={cusName:t.customer_name||n.name,cusTax:t.customer_tax_id||n.tax_id,cusBranch:t.customer_branch_code||n.branch_code,cusAddr:t.customer_address||n.address,cusTel:t.customer_phone||n.phone,invNo:e&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||p.job_no,declNo:t.customs_declaration_no||p.customs_declaration_no,cusPo:t.customer_job_no||p.customer_job_no,master:t.master_bl_no||p.master_bl_no,house:t.house_bl_no||p.house_bl_no,remarks:t.remarks||t.job_note||p.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},E=(s,f)=>s.map((l,N)=>{let L=q(l),O=r(l.amount);return`<tr>
      <td class="c ivd-no">${r(l.line_no)>0?r(l.line_no):f+N+1}</td>
      <td class="ivd-desc">${h(l.description,"")}</td>
      <td class="r">${L?"-":k(O)}</td>
      <td class="r">${L?k(O):"-"}</td>
      <td class="r">${k(l.unit_price)}</td>
      <td class="r">${k(O)}</td></tr>`}).join("")||'<tr><td colspan="6" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',v=K(u).map(s=>`<div class="ivd-wl"><span>${s.rate} % ${s.label}</span><span>${M(s.amt)}</span></div>`).join(""),$=["eta","etd","release_date","delivery_date","overtime_date","job_date"],T=s=>{if(!s)return"";for(let f of[t,p,d||{}]){if(!f)continue;let l=f[s];if(l!=null&&String(l).trim()!=="")return $.includes(s)?I(l):l}return""},w=[{label:"Decl No.",value:h(c.declNo)},{label:"Customer PO",value:h(c.cusPo)},{label:"Master",value:h(c.master)},{label:"House",value:h(c.house)}],y=["tl","tr","bl","br"],z=s=>{let l=(i&&i.fields||[]).find(N=>N&&N.key===s);return l?String(l.label||"").trim():""},U=i&&y.every(s=>i[s+"_source"])?y.map((s,f)=>({label:z(i[s+"_source"])||String(i[s+"_label"]||"").trim()||w[f].label,value:h(T(i[s+"_source"]))})):w,j=s=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${s}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`,D=15,B=[...u].sort((s,f)=>r(s.line_no)-r(f.line_no)),A=[];for(let s=0;s<B.length;s+=D)A.push(B.slice(s,s+D));return A.length||A.push([]),A.map((s,f)=>{let l=f===A.length-1,N=E(s,f*D);return`
    <div class="ivd print-area${e?" ivd-draft":""}">
      
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
          ${e?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${S("user")}<div class="ivd-fb"><label>${b("Customer Name")}</label>
              <div class="v">${h(c.cusName)}</div></div></div>
            <div class="ivd-f">${S("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${b("Tax ID")}</label><div class="v">${h(c.cusTax)}</div></div>
              <div><label>${b("Branch")}</label><div class="v">${h(c.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${S("pin")}<div class="ivd-fb"><label>${b("Address")}</label>
              <div class="v">${h(c.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${S("doc")}<div class="ivd-fb ivd-kv">
              <label>${b("Invoice No.")}</label><div class="v v-lg">${c.invNo?x(c.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${S("cal")}<div class="ivd-fb ivd-kv">
              <label>${b("Date")}</label><div class="v v-lg">${I(c.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${S("job")}<div class="ivd-fb ivd-kv">
              <label>${b("Job No.")}</label><div class="v v-lg">${h(c.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${U.map(L=>`<div class="ivd-rf"><label>${b(L.label)}</label><span>${L.value}</span></div>`).join("")}
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
          <td class="r">${k(o.svcCol)}</td>
          <td class="r">${k(o.advCol)}</td>
          <td></td>
          <td class="r ivd-trow-g">${M(g(o.svcCol+o.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${l?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${h(c.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${h(c.companyInvoice,"")}</div>
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
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${v}</div>
        ${j("For The Customer")}
        ${j("For The "+x(C.nameEn))}
      </section>
      </div>`:""}

      
      ${l?`<footer class="ivd-bar">
        <div>${S("user")}Created By : <b>${h(c.createdBy)}</b></div>
        <div>${S("print")}Printed Date : <b>${I(new Date().toISOString().slice(0,10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>`:""}
    </div>`}).join("")}var P="nj-print-doc";function V(){let t=document.body;t.classList.add(P);let e=()=>t.classList.remove(P);window.addEventListener("afterprint",e,{once:!0});try{let a=window.matchMedia("print"),i=d=>{d.matches||(e(),a.removeEventListener("change",i))};a.addEventListener("change",i)}catch{}window.print()}var H=24,J=.5,Y=1.5,F=.1;function X(t,e){let a=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),d=t.querySelector(".ivd");if(!a||!i||!d)return()=>{};let u=()=>i.scrollHeight||d.offsetHeight||0,o="fit",m=1,_=null,b=()=>{let v=a.parentElement||a,$=(v.clientWidth||0)-H,T=(v.clientHeight||0)-H,w=d.offsetWidth||0,y=u();return $<=0||w<=0||y<=0?1:T>0?Math.min($/w,T/y,1):Math.min($/w,1)},n=()=>{let v=o==="fit"?b():m;i.style.transform="scale("+v+")",a.style.width=Math.ceil((d.offsetWidth||0)*v)+"px",a.style.height=Math.ceil(u()*v)+"px",a.dataset.scale=String(Math.round(v*1e3)/1e3),_&&(_.textContent=Math.round(v*100)+"%")};if(e){let v=e.querySelector(".mf-left")||e,$=document.createElement("div");$.className="ivd-zoom",$.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',v.appendChild($),_=$.querySelector("#ivd-zoom-v"),$.addEventListener("click",T=>{let w=T.target.closest("[data-z]");if(!w)return;let y=w.dataset.z;if(y==="fit")o="fit";else{let z=o==="fit"?b():m;y==="100"?m=1:m=Math.min(Y,Math.max(J,Math.round((z+(y==="in"?F:-F))*100)/100)),o="zoom"}n()})}n();let p=v=>typeof requestAnimationFrame=="function"?requestAnimationFrame(v):setTimeout(v,16);p(()=>p(n));let c=()=>{o==="fit"&&n()},E=null;try{E=new ResizeObserver(c),E.observe(a.parentElement||a)}catch{window.addEventListener("resize",c)}return window.addEventListener("orientationchange",c),()=>{try{E&&E.disconnect()}catch{}window.removeEventListener("resize",c),window.removeEventListener("orientationchange",c)}}function it(t,{draft:e=!1,print:a=!1,kind:i="",tpl:d=null,job:u=null}={}){let o=document.createElement("div");o.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+G(t,{draft:e,kind:i,tpl:d,job:u})+"</div></div>";let m=document.createElement("div");m.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${e?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,R({title:e?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:o,footer:m,fullscreen:!0,wide:!0});let _=X(o,m);m.querySelector("[data-close]").addEventListener("click",_,{once:!0}),m.querySelector("#ivd-print").onclick=()=>V(),a&&setTimeout(()=>V(),60)}export{q as a,G as b,it as c};
