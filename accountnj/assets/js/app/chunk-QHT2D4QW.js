import{a as C}from"./chunk-UWAYW6DC.js";import{a as V}from"./chunk-DIH2PLYD.js";import{a as x,c as B,e as S}from"./chunk-PCFU74ZV.js";var O=t=>t==null||t===""||Number(t)===0?"-":x(t),b=(t,e="-")=>{let o=t==null?"":String(t).trim();return S(o||e)},m=t=>{let e=Number(t);return Number.isFinite(e)?e:0},$=t=>Math.round((m(t)+Number.EPSILON)*100)/100,Y={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},A=t=>`<span class="ivd-ic">${Y[t]||""}</span>`,P=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function X(t,e){let o=0,a=0,c=0,v=0;for(let i of e)P(i)?v=$(v+m(i.amount)):c=$(c+m(i.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(c=$(m(t.service_amount)),v=$(m(t.advance_amount)));let s=0;for(let i of e){let M=m(i.vat_amount)>0||m(i.vat_rate)>0;!P(i)&&M?(o=$(o+m(i.amount)),s=$(s+m(i.vat_amount))):a=$(a+m(i.amount))}let f=s,p=[...new Set(e.map(i=>m(i.vat_rate)).filter(i=>i>0))],u=p.length===1?p[0]:m(t.vat_rate)||7,y=$(o+f),h=Z(e).reduce((i,M)=>$(i+M.amt),0);return{vatBase:o,nonVat:a,vat:f,vatRate:u,total:y,whtTotal:h,grand:$(y+a-h),svcCol:c,advCol:v}}function Z(t){let e=new Map;for(let a of t){if(P(a))continue;let c=m(a.wht_rate);c<=0||e.set(c,$((e.get(c)||0)+m(a.wht_amount)))}let o=[{rate:1,label:"Transportation",amt:e.get(1)||0},{rate:3,label:"Service",amt:e.get(3)||0}];for(let[a,c]of[...e.entries()].sort((v,s)=>v[0]-s[0]))a!==1&&a!==3&&o.push({rate:a,label:"Other",amt:c});return o}function K(t,{draft:e=!1,kind:o="",tpl:a=null,job:c=null}={}){let v=t.items||[],s=X(t,v),p=String(o).toUpperCase()==="SERVICE",u=n=>p?String(n).replace(/\s*:\s*$/,"")+" :":n,y=t.customer||{},h=t.job||{},i={cusName:t.customer_name||y.name,cusTax:t.customer_tax_id||y.tax_id,cusBranch:t.customer_branch_code||y.branch_code,cusAddr:t.customer_address||y.address,cusTel:t.customer_phone||y.phone,invNo:e&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||h.job_no,declNo:t.customs_declaration_no||h.customs_declaration_no,cusPo:t.customer_job_no||h.customer_job_no,master:t.master_bl_no||h.master_bl_no,house:t.house_bl_no||h.house_bl_no,remarks:t.remarks||t.job_note||h.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},M=(n,r)=>n.map((d,_)=>{let T=P(d),j=m(d.amount);return`<tr>
      <td class="c ivd-no">${m(d.line_no)>0?m(d.line_no):r+_+1}</td>
      <td class="ivd-desc">${b(d.description,"")}</td>
      <td class="r">${T?"-":O(j)}</td>
      <td class="r">${T?O(j):"-"}</td>
      <td class="r">${O(j)}</td></tr>`}).join("")||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',E=Z(v).map(n=>`<div class="ivd-wl"><span>${n.rate} % ${n.label}</span><span>${x(n.amt)}</span></div>`).join(""),N=["eta","etd","release_date","delivery_date","overtime_date","job_date"],z=n=>{if(!n)return"";for(let r of[t,h,c||{}]){if(!r)continue;let d=r[n];if(d!=null&&String(d).trim()!=="")return N.includes(n)?B(d):d}return""},w=[{label:"Decl No.",value:b(i.declNo)},{label:"Customer PO",value:b(i.cusPo)},{label:"Master",value:b(i.master)},{label:"House",value:b(i.house)}],D=["tl","tr","bl","br"],L=n=>{let d=(a&&a.fields||[]).find(_=>_&&_.key===n);return d?String(d.label||"").trim():""},I=a&&D.every(n=>a[n+"_source"])?D.map((n,r)=>({label:L(a[n+"_source"])||String(a[n+"_label"]||"").trim()||w[r].label,value:b(z(a[n+"_source"]))})):w,F=(n,r)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${n}</div>
      ${r?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${r.who}</div>
        <div class="ivd-sign-dt">${r.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${r?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,k=15,l=[...v].sort((n,r)=>m(n.line_no)-m(r.line_no)),g=[];for(let n=0;n<l.length;n+=k)g.push(l.slice(n,n+k));return g.length||g.push([]),g.map((n,r)=>{let d=r===g.length-1,_=M(n,r*k);return`
    <div class="ivd print-area${e?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${C.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${S(C.nameEn)}</div>
            <div class="ivd-co-ad">${S(C.address)}</div>
            <div class="ivd-co-tl">Tel. ${S(C.tel)} <i>|</i> Fax. ${S(C.fax)}
              <i>|</i> Tax ID ${S(C.taxId)}</div>
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
            
            <div class="ivd-f">${A("user")}<div class="ivd-fb"><label>${u("Customer Name")}</label>
              <div class="v">${b(i.cusName)}</div></div></div>
            <div class="ivd-f">${A("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${u("Tax ID")}</label><div class="v">${b(i.cusTax)}</div></div>
              <div><label>${u("Branch")}</label><div class="v">${b(i.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${A("pin")}<div class="ivd-fb"><label>${u("Address")}</label>
              <div class="v">${b(i.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${A("doc")}<div class="ivd-fb ivd-kv">
              <label>${u("Invoice No.")}</label><div class="v v-lg">${i.invNo?S(i.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${A("cal")}<div class="ivd-fb ivd-kv">
              <label>${u("Date")}</label><div class="v v-lg">${B(i.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${A("job")}<div class="ivd-fb ivd-kv">
              <label>${u("Job No.")}</label><div class="v v-lg">${b(i.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${I.map(T=>`<div class="ivd-rf"><label>${u(T.label)}</label><span>${T.value}</span></div>`).join("")}
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
          <td class="ivd-trow-l" colspan="2"><span class="ivd-trow-in">${A("sum")}<b>TOTAL</b></span></td>
          <td class="r">${O(s.svcCol)}</td>
          <td class="r">${O(s.advCol)}</td>
          <td class="r ivd-trow-g">${x($(s.svcCol+s.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${d?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${b(i.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${b(i.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${s.vatRate} %</span><span>${x(s.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${s.vatRate} %</span><span>${x(s.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${x(s.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${x(s.advCol)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${x(s.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${E}</div>
        ${F("For The Customer")}
        ${F("For The "+S(C.nameEn),{who:b(i.createdBy),when:B(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${d?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var R="nj-print-doc",Q=/[\\/:*?"<>|\u0000-\u001f]/g,q=t=>String(t??"").replace(Q," ").replace(/\s+/g," ").trim();function G(t){let e=t||{},o=q(e.job_no||e.job&&e.job.job_no||""),a=q(e.company_invoice||"");return[o,a].filter(Boolean).join(" - ")||"INVOICE"}function H(t){let e=document.body;e.classList.add(R);let o=document.title;t&&(document.title=t);let a=()=>{e.classList.remove(R),t&&(document.title=o)};window.addEventListener("afterprint",a,{once:!0});try{let c=window.matchMedia("print"),v=s=>{s.matches||(a(),c.removeEventListener("change",v))};c.addEventListener("change",v)}catch{}window.print()}var W=24,tt=.5,et=1.5,U=.1;function J(t,e){let o=t.querySelector(".ivd-fit"),a=t.querySelector(".ivd-fit-in"),c=t.querySelector(".ivd");if(!o||!a||!c)return()=>{};let v=()=>a.scrollHeight||c.offsetHeight||0,s="fit",f=1,p=null,u=1,y=.05,h=l=>Number.isFinite(l)&&l>0,i=()=>{let l=o.parentElement||o,g=o.style.width,n=o.style.height;o.style.width="",o.style.height="";let r=(l.clientWidth||0)-W,d=(l.clientHeight||0)-W;o.style.width=g,o.style.height=n;let _=c.offsetWidth||0,T=v();if(!h(_)||!h(T)||r<40)return u;let j=d>0?Math.min(r/_,d/T,1):Math.min(r/_,1);return h(j)&&(u=Math.max(y,j)),u},M=!1,E=null,N=()=>{if(M)return;let l=s==="fit"?i():f;h(l)||(l=E||1),l=Math.max(y,l),!(E!==null&&Math.abs(l-E)<.002)&&(E=l,a.style.transform="scale("+l+")",o.style.width=Math.ceil((c.offsetWidth||0)*l)+"px",o.style.height=Math.ceil(v()*l)+"px",o.dataset.scale=String(Math.round(l*1e3)/1e3),p&&(p.textContent=Math.round(l*100)+"%"))};if(e){let l=e.querySelector(".mf-left")||e,g=document.createElement("div");g.className="ivd-zoom",g.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',l.appendChild(g),p=g.querySelector("#ivd-zoom-v"),g.addEventListener("click",n=>{let r=n.target.closest("[data-z]");if(!r)return;let d=r.dataset.z;if(d==="fit")s="fit";else{let _=s==="fit"?i():f;d==="100"?f=1:f=Math.min(et,Math.max(tt,Math.round((_+(d==="in"?U:-U))*100)/100)),s="zoom"}E=null,N()})}let z=l=>typeof requestAnimationFrame=="function"?requestAnimationFrame(l):setTimeout(l,16);N(),z(()=>z(()=>{E=null,N()}));let w=0,D=()=>{s!=="fit"||M||(w&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(w):clearTimeout(w)),w=z(()=>{w=0,N()}))},L=D,I=null;try{I=new ResizeObserver(L),I.observe(o.parentElement||o)}catch{window.addEventListener("resize",L)}window.addEventListener("orientationchange",L);let F=()=>{M=!0},k=()=>{M=!1,E=null,D(),s!=="fit"&&N()};return window.addEventListener("beforeprint",F),window.addEventListener("afterprint",k),()=>{try{I&&I.disconnect()}catch{}if(w){try{cancelAnimationFrame(w)}catch{clearTimeout(w)}w=0}window.removeEventListener("resize",L),window.removeEventListener("orientationchange",L),window.removeEventListener("beforeprint",F),window.removeEventListener("afterprint",k)}}function at(t,{draft:e=!1,print:o=!1,kind:a="",tpl:c=null,job:v=null}={}){let s=document.createElement("div");s.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+K(t,{draft:e,kind:a,tpl:c,job:v})+"</div></div>";let f=document.createElement("div");f.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${e?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:e?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:s,footer:f,fullscreen:!0,wide:!0});let p=J(s,f);f.querySelector("[data-close]").addEventListener("click",p,{once:!0});let u=G(t);f.querySelector("#ivd-print").onclick=()=>H(u),o&&setTimeout(()=>H(u),60)}function ct(t,{kind:e="",tpl:o=null,print:a=!1}={}){let c=(t||[]).filter(Boolean);if(!c.length)return;let v=document.createElement("div");v.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+c.map(u=>K(u,{draft:!1,kind:e,tpl:o,job:u&&u.job||null})).join("")+"</div></div>";let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${c.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,V({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+c.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:v,footer:s,fullscreen:!0,wide:!0});let f=J(v,s);s.querySelector("[data-close]").addEventListener("click",f,{once:!0});let p=c.length===1?G(c[0]):"INVOICE "+c.length+" \u0E09\u0E1A\u0E31\u0E1A";s.querySelector("#ivd-print").onclick=()=>H(p),a&&setTimeout(()=>H(p),60)}export{P as a,K as b,G as c,at as d,ct as e};
