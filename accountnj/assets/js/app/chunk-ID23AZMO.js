import{a as S}from"./chunk-UWAYW6DC.js";import{a as V}from"./chunk-DIH2PLYD.js";import{a as E,c as O,e as x}from"./chunk-PCFU74ZV.js";var F=t=>t==null||t===""||Number(t)===0?"-":E(t),p=(t,e="-")=>{let a=t==null?"":String(t).trim();return x(a||e)},f=t=>{let e=Number(t);return Number.isFinite(e)?e:0},M=t=>Math.round((f(t)+Number.EPSILON)*100)/100,J={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},N=t=>`<span class="ivd-ic">${J[t]||""}</span>`,B=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function Y(t,e){let a=0,n=0,o=0,v=0;for(let l of e)B(l)?v=M(v+f(l.amount)):o=M(o+f(l.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(o=M(f(t.service_amount)),v=M(f(t.advance_amount)));let s=0;for(let l of e){let m=f(l.vat_amount)>0||f(l.vat_rate)>0;!B(l)&&m?(a=M(a+f(l.amount)),s=M(s+f(l.vat_amount))):n=M(n+f(l.amount))}let b=s,g=[...new Set(e.map(l=>f(l.vat_rate)).filter(l=>l>0))],u=g.length===1?g[0]:f(t.vat_rate)||7,$=M(a+b);return{vatBase:a,nonVat:n,vat:b,vatRate:u,total:$,grand:M($+n),svcCol:o,advCol:v}}function X(t){let e=new Map;for(let n of t){if(B(n))continue;let o=f(n.wht_rate);o<=0||e.set(o,M((e.get(o)||0)+f(n.wht_amount)))}let a=[{rate:1,label:"Transportation",amt:e.get(1)||0},{rate:3,label:"Service",amt:e.get(3)||0}];for(let[n,o]of[...e.entries()].sort((v,s)=>v[0]-s[0]))n!==1&&n!==3&&a.push({rate:n,label:"Other",amt:o});return a}function Z(t,{draft:e=!1,kind:a="",tpl:n=null,job:o=null}={}){let v=t.items||[],s=Y(t,v),g=String(a).toUpperCase()==="SERVICE",u=i=>g?String(i).replace(/\s*:\s*$/,"")+" :":i,$=t.customer||{},l=t.job||{},m={cusName:t.customer_name||$.name,cusTax:t.customer_tax_id||$.tax_id,cusBranch:t.customer_branch_code||$.branch_code,cusAddr:t.customer_address||$.address,cusTel:t.customer_phone||$.phone,invNo:e&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||l.job_no,declNo:t.customs_declaration_no||l.customs_declaration_no,cusPo:t.customer_job_no||l.customer_job_no,master:t.master_bl_no||l.master_bl_no,house:t.house_bl_no||l.house_bl_no,remarks:t.remarks||t.job_note||l.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},L=(i,r)=>i.map((d,w)=>{let D=B(d),H=f(d.amount);return`<tr>
      <td class="c ivd-no">${f(d.line_no)>0?f(d.line_no):r+w+1}</td>
      <td class="ivd-desc">${p(d.description,"")}</td>
      <td class="r">${D?"-":F(H)}</td>
      <td class="r">${D?F(H):"-"}</td>
      <td class="r">${F(H)}</td></tr>`}).join("")||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',y=X(v).map(i=>`<div class="ivd-wl"><span>${i.rate} % ${i.label}</span><span>${E(i.amt)}</span></div>`).join(""),T=["eta","etd","release_date","delivery_date","overtime_date","job_date"],k=i=>{if(!i)return"";for(let r of[t,l,o||{}]){if(!r)continue;let d=r[i];if(d!=null&&String(d).trim()!=="")return T.includes(i)?O(d):d}return""},_=[{label:"Decl No.",value:p(m.declNo)},{label:"Customer PO",value:p(m.cusPo)},{label:"Master",value:p(m.master)},{label:"House",value:p(m.house)}],j=["tl","tr","bl","br"],C=i=>{let d=(n&&n.fields||[]).find(w=>w&&w.key===i);return d?String(d.label||"").trim():""},A=n&&j.every(i=>n[i+"_source"])?j.map((i,r)=>({label:C(n[i+"_source"])||String(n[i+"_label"]||"").trim()||_[r].label,value:p(k(n[i+"_source"]))})):_,z=(i,r)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${i}</div>
      ${r?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${r.who}</div>
        <div class="ivd-sign-dt">${r.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${r?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,I=15,c=[...v].sort((i,r)=>f(i.line_no)-f(r.line_no)),h=[];for(let i=0;i<c.length;i+=I)h.push(c.slice(i,i+I));return h.length||h.push([]),h.map((i,r)=>{let d=r===h.length-1,w=L(i,r*I);return`
    <div class="ivd print-area${e?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${S.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${x(S.nameEn)}</div>
            <div class="ivd-co-ad">${x(S.address)}</div>
            <div class="ivd-co-tl">Tel. ${x(S.tel)} <i>|</i> Fax. ${x(S.fax)}
              <i>|</i> Tax ID ${x(S.taxId)}</div>
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
            
            <div class="ivd-f">${N("user")}<div class="ivd-fb"><label>${u("Customer Name")}</label>
              <div class="v">${p(m.cusName)}</div></div></div>
            <div class="ivd-f">${N("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${u("Tax ID")}</label><div class="v">${p(m.cusTax)}</div></div>
              <div><label>${u("Branch")}</label><div class="v">${p(m.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${N("pin")}<div class="ivd-fb"><label>${u("Address")}</label>
              <div class="v">${p(m.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${N("doc")}<div class="ivd-fb ivd-kv">
              <label>${u("Invoice No.")}</label><div class="v v-lg">${m.invNo?x(m.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${N("cal")}<div class="ivd-fb ivd-kv">
              <label>${u("Date")}</label><div class="v v-lg">${O(m.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${N("job")}<div class="ivd-fb ivd-kv">
              <label>${u("Job No.")}</label><div class="v v-lg">${p(m.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${A.map(D=>`<div class="ivd-rf"><label>${u(D.label)}</label><span>${D.value}</span></div>`).join("")}
      </section>

      <table class="ivd-tbl">
        
        <colgroup><col class="w-no"><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-tot"></colgroup>
        <thead><tr>
          
          <th class="c">No.</th>
          <th>Description</th>
          <th class="r">Service</th>
          <th class="r">Advance</th>
          <th class="r">Total Amount</th>
        </tr></thead>
        <tbody>${w}</tbody>
        
        <tfoot>${d?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2">${N("sum")}<b>TOTAL</b></td>
          <td class="r">${F(s.svcCol)}</td>
          <td class="r">${F(s.advCol)}</td>
          <td class="r ivd-trow-g">${E(M(s.svcCol+s.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${d?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${p(m.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${p(m.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${s.vatRate} %</span><span>${E(s.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${s.vatRate} %</span><span>${E(s.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${E(s.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${E(s.advCol)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${E(s.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${y}</div>
        ${z("For The Customer")}
        ${z("For The "+x(S.nameEn),{who:p(m.createdBy),when:O(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${d?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var R="nj-print-doc",Q=/[\\/:*?"<>|\u0000-\u001f]/g,q=t=>String(t??"").replace(Q," ").replace(/\s+/g," ").trim();function K(t){let e=t||{},a=q(e.job_no||e.job&&e.job.job_no||""),n=q(e.company_invoice||"");return[a,n].filter(Boolean).join(" - ")||"INVOICE"}function P(t){let e=document.body;e.classList.add(R);let a=document.title;t&&(document.title=t);let n=()=>{e.classList.remove(R),t&&(document.title=a)};window.addEventListener("afterprint",n,{once:!0});try{let o=window.matchMedia("print"),v=s=>{s.matches||(n(),o.removeEventListener("change",v))};o.addEventListener("change",v)}catch{}window.print()}var W=24,tt=.5,et=1.5,U=.1;function G(t,e){let a=t.querySelector(".ivd-fit"),n=t.querySelector(".ivd-fit-in"),o=t.querySelector(".ivd");if(!a||!n||!o)return()=>{};let v=()=>n.scrollHeight||o.offsetHeight||0,s="fit",b=1,g=null,u=1,$=.05,l=c=>Number.isFinite(c)&&c>0,m=()=>{let c=a.parentElement||a,h=(c.clientWidth||0)-W,i=(c.clientHeight||0)-W,r=o.offsetWidth||0,d=v();if(!l(r)||!l(d)||h<40)return u;let w=i>0?Math.min(h/r,i/d,1):Math.min(h/r,1);return l(w)&&(u=Math.max($,w)),u},L=!1,y=null,T=()=>{if(L)return;let c=s==="fit"?m():b;l(c)||(c=y||1),c=Math.max($,c),!(y!==null&&Math.abs(c-y)<.002)&&(y=c,n.style.transform="scale("+c+")",a.style.width=Math.ceil((o.offsetWidth||0)*c)+"px",a.style.height=Math.ceil(v()*c)+"px",a.dataset.scale=String(Math.round(c*1e3)/1e3),g&&(g.textContent=Math.round(c*100)+"%"))};if(e){let c=e.querySelector(".mf-left")||e,h=document.createElement("div");h.className="ivd-zoom",h.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',c.appendChild(h),g=h.querySelector("#ivd-zoom-v"),h.addEventListener("click",i=>{let r=i.target.closest("[data-z]");if(!r)return;let d=r.dataset.z;if(d==="fit")s="fit";else{let w=s==="fit"?m():b;d==="100"?b=1:b=Math.min(et,Math.max(tt,Math.round((w+(d==="in"?U:-U))*100)/100)),s="zoom"}y=null,T()})}let k=c=>typeof requestAnimationFrame=="function"?requestAnimationFrame(c):setTimeout(c,16);T(),k(()=>k(()=>{y=null,T()}));let _=0,j=()=>{s!=="fit"||L||(_&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(_):clearTimeout(_)),_=k(()=>{_=0,T()}))},C=j,A=null;try{A=new ResizeObserver(C),A.observe(a.parentElement||a)}catch{window.addEventListener("resize",C)}window.addEventListener("orientationchange",C);let z=()=>{L=!0},I=()=>{L=!1,y=null,j(),s!=="fit"&&T()};return window.addEventListener("beforeprint",z),window.addEventListener("afterprint",I),()=>{try{A&&A.disconnect()}catch{}if(_){try{cancelAnimationFrame(_)}catch{clearTimeout(_)}_=0}window.removeEventListener("resize",C),window.removeEventListener("orientationchange",C),window.removeEventListener("beforeprint",z),window.removeEventListener("afterprint",I)}}function at(t,{draft:e=!1,print:a=!1,kind:n="",tpl:o=null,job:v=null}={}){let s=document.createElement("div");s.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+Z(t,{draft:e,kind:n,tpl:o,job:v})+"</div></div>";let b=document.createElement("div");b.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${e?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:e?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:s,footer:b,fullscreen:!0,wide:!0});let g=G(s,b);b.querySelector("[data-close]").addEventListener("click",g,{once:!0});let u=K(t);b.querySelector("#ivd-print").onclick=()=>P(u),a&&setTimeout(()=>P(u),60)}function ct(t,{kind:e="",tpl:a=null,print:n=!1}={}){let o=(t||[]).filter(Boolean);if(!o.length)return;let v=document.createElement("div");v.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+o.map(u=>Z(u,{draft:!1,kind:e,tpl:a,job:u&&u.job||null})).join("")+"</div></div>";let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${o.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+o.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:v,footer:s,fullscreen:!0,wide:!0});let b=G(v,s);s.querySelector("[data-close]").addEventListener("click",b,{once:!0});let g=o.length===1?K(o[0]):"INVOICE "+o.length+" \u0E09\u0E1A\u0E31\u0E1A";s.querySelector("#ivd-print").onclick=()=>P(g),n&&setTimeout(()=>P(g),60)}export{B as a,Z as b,K as c,at as d,ct as e};
