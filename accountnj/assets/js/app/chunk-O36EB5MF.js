import{a as T}from"./chunk-UWAYW6DC.js";import{a as V}from"./chunk-DIH2PLYD.js";import{a as E,c as B,e as x}from"./chunk-PCFU74ZV.js";var O=t=>t==null||t===""||Number(t)===0?"-":E(t),b=(t,e="-")=>{let n=t==null?"":String(t).trim();return x(n||e)},f=t=>{let e=Number(t);return Number.isFinite(e)?e:0},y=t=>Math.round((f(t)+Number.EPSILON)*100)/100,J={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},L=t=>`<span class="ivd-ic">${J[t]||""}</span>`,P=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function Y(t,e){let n=0,o=0,a=0,v=0;for(let c of e)P(c)?v=y(v+f(c.amount)):a=y(a+f(c.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(a=y(f(t.service_amount)),v=y(f(t.advance_amount)));let s=0;for(let c of e){let m=f(c.vat_amount)>0||f(c.vat_rate)>0;!P(c)&&m?(n=y(n+f(c.amount)),s=y(s+f(c.vat_amount))):o=y(o+f(c.amount))}let h=s,p=[...new Set(e.map(c=>f(c.vat_rate)).filter(c=>c>0))],u=p.length===1?p[0]:f(t.vat_rate)||7,$=y(n+h);return{vatBase:n,nonVat:o,vat:h,vatRate:u,total:$,grand:y($+o),svcCol:a,advCol:v}}function X(t){let e=new Map;for(let o of t){if(P(o))continue;let a=f(o.wht_rate);a<=0||e.set(a,y((e.get(a)||0)+f(o.wht_amount)))}let n=[{rate:1,label:"Transportation",amt:e.get(1)||0},{rate:3,label:"Service",amt:e.get(3)||0}];for(let[o,a]of[...e.entries()].sort((v,s)=>v[0]-s[0]))o!==1&&o!==3&&n.push({rate:o,label:"Other",amt:a});return n}function Z(t,{draft:e=!1,kind:n="",tpl:o=null,job:a=null}={}){let v=t.items||[],s=Y(t,v),p=String(n).toUpperCase()==="SERVICE",u=i=>p?String(i).replace(/\s*:\s*$/,"")+" :":i,$=t.customer||{},c=t.job||{},m={cusName:t.customer_name||$.name,cusTax:t.customer_tax_id||$.tax_id,cusBranch:t.customer_branch_code||$.branch_code,cusAddr:t.customer_address||$.address,cusTel:t.customer_phone||$.phone,invNo:e&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||c.job_no,declNo:t.customs_declaration_no||c.customs_declaration_no,cusPo:t.customer_job_no||c.customer_job_no,master:t.master_bl_no||c.master_bl_no,house:t.house_bl_no||c.house_bl_no,remarks:t.remarks||t.job_note||c.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},A=(i,r)=>i.map((d,_)=>{let S=P(d),j=f(d.amount);return`<tr>
      <td class="c ivd-no">${f(d.line_no)>0?f(d.line_no):r+_+1}</td>
      <td class="ivd-desc">${b(d.description,"")}</td>
      <td class="r">${S?"-":O(j)}</td>
      <td class="r">${S?O(j):"-"}</td>
      <td class="r">${O(j)}</td></tr>`}).join("")||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',M=X(v).map(i=>`<div class="ivd-wl"><span>${i.rate} % ${i.label}</span><span>${E(i.amt)}</span></div>`).join(""),C=["eta","etd","release_date","delivery_date","overtime_date","job_date"],z=i=>{if(!i)return"";for(let r of[t,c,a||{}]){if(!r)continue;let d=r[i];if(d!=null&&String(d).trim()!=="")return C.includes(i)?B(d):d}return""},w=[{label:"Decl No.",value:b(m.declNo)},{label:"Customer PO",value:b(m.cusPo)},{label:"Master",value:b(m.master)},{label:"House",value:b(m.house)}],D=["tl","tr","bl","br"],N=i=>{let d=(o&&o.fields||[]).find(_=>_&&_.key===i);return d?String(d.label||"").trim():""},I=o&&D.every(i=>o[i+"_source"])?D.map((i,r)=>({label:N(o[i+"_source"])||String(o[i+"_label"]||"").trim()||w[r].label,value:b(z(o[i+"_source"]))})):w,F=(i,r)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${i}</div>
      ${r?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${r.who}</div>
        <div class="ivd-sign-dt">${r.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${r?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,k=15,l=[...v].sort((i,r)=>f(i.line_no)-f(r.line_no)),g=[];for(let i=0;i<l.length;i+=k)g.push(l.slice(i,i+k));return g.length||g.push([]),g.map((i,r)=>{let d=r===g.length-1,_=A(i,r*k);return`
    <div class="ivd print-area${e?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${T.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${x(T.nameEn)}</div>
            <div class="ivd-co-ad">${x(T.address)}</div>
            <div class="ivd-co-tl">Tel. ${x(T.tel)} <i>|</i> Fax. ${x(T.fax)}
              <i>|</i> Tax ID ${x(T.taxId)}</div>
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
            
            <div class="ivd-f">${L("user")}<div class="ivd-fb"><label>${u("Customer Name")}</label>
              <div class="v">${b(m.cusName)}</div></div></div>
            <div class="ivd-f">${L("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${u("Tax ID")}</label><div class="v">${b(m.cusTax)}</div></div>
              <div><label>${u("Branch")}</label><div class="v">${b(m.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${L("pin")}<div class="ivd-fb"><label>${u("Address")}</label>
              <div class="v">${b(m.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${L("doc")}<div class="ivd-fb ivd-kv">
              <label>${u("Invoice No.")}</label><div class="v v-lg">${m.invNo?x(m.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${L("cal")}<div class="ivd-fb ivd-kv">
              <label>${u("Date")}</label><div class="v v-lg">${B(m.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${L("job")}<div class="ivd-fb ivd-kv">
              <label>${u("Job No.")}</label><div class="v v-lg">${b(m.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${I.map(S=>`<div class="ivd-rf"><label>${u(S.label)}</label><span>${S.value}</span></div>`).join("")}
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
        <tbody>${_}</tbody>
        
        <tfoot>${d?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2"><span class="ivd-trow-in">${L("sum")}<b>TOTAL</b></span></td>
          <td class="r">${O(s.svcCol)}</td>
          <td class="r">${O(s.advCol)}</td>
          <td class="r ivd-trow-g">${E(y(s.svcCol+s.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${d?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${b(m.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${b(m.companyInvoice,"")}</div>
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
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${M}</div>
        ${F("For The Customer")}
        ${F("For The "+x(T.nameEn),{who:b(m.createdBy),when:B(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${d?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var R="nj-print-doc",Q=/[\\/:*?"<>|\u0000-\u001f]/g,q=t=>String(t??"").replace(Q," ").replace(/\s+/g," ").trim();function K(t){let e=t||{},n=q(e.job_no||e.job&&e.job.job_no||""),o=q(e.company_invoice||"");return[n,o].filter(Boolean).join(" - ")||"INVOICE"}function H(t){let e=document.body;e.classList.add(R);let n=document.title;t&&(document.title=t);let o=()=>{e.classList.remove(R),t&&(document.title=n)};window.addEventListener("afterprint",o,{once:!0});try{let a=window.matchMedia("print"),v=s=>{s.matches||(o(),a.removeEventListener("change",v))};a.addEventListener("change",v)}catch{}window.print()}var W=24,tt=.5,et=1.5,U=.1;function G(t,e){let n=t.querySelector(".ivd-fit"),o=t.querySelector(".ivd-fit-in"),a=t.querySelector(".ivd");if(!n||!o||!a)return()=>{};let v=()=>o.scrollHeight||a.offsetHeight||0,s="fit",h=1,p=null,u=1,$=.05,c=l=>Number.isFinite(l)&&l>0,m=()=>{let l=n.parentElement||n,g=n.style.width,i=n.style.height;n.style.width="",n.style.height="";let r=(l.clientWidth||0)-W,d=(l.clientHeight||0)-W;n.style.width=g,n.style.height=i;let _=a.offsetWidth||0,S=v();if(!c(_)||!c(S)||r<40)return u;let j=d>0?Math.min(r/_,d/S,1):Math.min(r/_,1);return c(j)&&(u=Math.max($,j)),u},A=!1,M=null,C=()=>{if(A)return;let l=s==="fit"?m():h;c(l)||(l=M||1),l=Math.max($,l),!(M!==null&&Math.abs(l-M)<.002)&&(M=l,o.style.transform="scale("+l+")",n.style.width=Math.ceil((a.offsetWidth||0)*l)+"px",n.style.height=Math.ceil(v()*l)+"px",n.dataset.scale=String(Math.round(l*1e3)/1e3),p&&(p.textContent=Math.round(l*100)+"%"))};if(e){let l=e.querySelector(".mf-left")||e,g=document.createElement("div");g.className="ivd-zoom",g.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',l.appendChild(g),p=g.querySelector("#ivd-zoom-v"),g.addEventListener("click",i=>{let r=i.target.closest("[data-z]");if(!r)return;let d=r.dataset.z;if(d==="fit")s="fit";else{let _=s==="fit"?m():h;d==="100"?h=1:h=Math.min(et,Math.max(tt,Math.round((_+(d==="in"?U:-U))*100)/100)),s="zoom"}M=null,C()})}let z=l=>typeof requestAnimationFrame=="function"?requestAnimationFrame(l):setTimeout(l,16);C(),z(()=>z(()=>{M=null,C()}));let w=0,D=()=>{s!=="fit"||A||(w&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(w):clearTimeout(w)),w=z(()=>{w=0,C()}))},N=D,I=null;try{I=new ResizeObserver(N),I.observe(n.parentElement||n)}catch{window.addEventListener("resize",N)}window.addEventListener("orientationchange",N);let F=()=>{A=!0},k=()=>{A=!1,M=null,D(),s!=="fit"&&C()};return window.addEventListener("beforeprint",F),window.addEventListener("afterprint",k),()=>{try{I&&I.disconnect()}catch{}if(w){try{cancelAnimationFrame(w)}catch{clearTimeout(w)}w=0}window.removeEventListener("resize",N),window.removeEventListener("orientationchange",N),window.removeEventListener("beforeprint",F),window.removeEventListener("afterprint",k)}}function at(t,{draft:e=!1,print:n=!1,kind:o="",tpl:a=null,job:v=null}={}){let s=document.createElement("div");s.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+Z(t,{draft:e,kind:o,tpl:a,job:v})+"</div></div>";let h=document.createElement("div");h.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${e?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:e?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:s,footer:h,fullscreen:!0,wide:!0});let p=G(s,h);h.querySelector("[data-close]").addEventListener("click",p,{once:!0});let u=K(t);h.querySelector("#ivd-print").onclick=()=>H(u),n&&setTimeout(()=>H(u),60)}function lt(t,{kind:e="",tpl:n=null,print:o=!1}={}){let a=(t||[]).filter(Boolean);if(!a.length)return;let v=document.createElement("div");v.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+a.map(u=>Z(u,{draft:!1,kind:e,tpl:n,job:u&&u.job||null})).join("")+"</div></div>";let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${a.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+a.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:v,footer:s,fullscreen:!0,wide:!0});let h=G(v,s);s.querySelector("[data-close]").addEventListener("click",h,{once:!0});let p=a.length===1?K(a[0]):"INVOICE "+a.length+" \u0E09\u0E1A\u0E31\u0E1A";s.querySelector("#ivd-print").onclick=()=>H(p),o&&setTimeout(()=>H(p),60)}export{P as a,Z as b,K as c,at as d,lt as e};
