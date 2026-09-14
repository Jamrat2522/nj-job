import{a as L}from"./chunk-UWAYW6DC.js";import{a as q}from"./chunk-DIH2PLYD.js";import{a as S,c as H,e as x}from"./chunk-PCFU74ZV.js";var D=t=>t==null||t===""||Number(t)===0?"-":S(t),b=(t,s="-")=>{let o=t==null?"":String(t).trim();return x(o||s)},m=t=>{let s=Number(t);return Number.isFinite(s)?s:0},$=t=>Math.round((m(t)+Number.EPSILON)*100)/100,Q={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},I=t=>`<span class="ivd-ic">${Q[t]||""}</span>`,P=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function tt(t,s){let o=0,a=0,l=0,r=0;for(let n of s)P(n)?r=$(r+m(n.amount)):l=$(l+m(n.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(l=$(m(t.service_amount)),r=$(m(t.advance_amount)));let i=0;for(let n of s){let M=m(n.vat_amount)>0||m(n.vat_rate)>0;!P(n)&&M?(o=$(o+m(n.amount)),i=$(i+m(n.vat_amount))):a=$(a+m(n.amount))}let h=i,p=[...new Set(s.map(n=>m(n.vat_rate)).filter(n=>n>0))],v=p.length===1?p[0]:m(t.vat_rate)||7,w=$(o+h),f=G(s).reduce((n,M)=>$(n+M.amt),0);return{vatBase:o,nonVat:a,vat:h,vatRate:v,total:w,whtTotal:f,grand:$(w+a-f),svcCol:l,advCol:r}}function G(t){let s=new Map;for(let a of t){if(P(a))continue;let l=m(a.wht_rate);l<=0||s.set(l,$((s.get(l)||0)+m(a.wht_amount)))}let o=[{rate:1,label:"Transportation",amt:s.get(1)||0},{rate:3,label:"Service",amt:s.get(3)||0}];for(let[a,l]of[...s.entries()].sort((r,i)=>r[0]-i[0]))a!==1&&a!==3&&o.push({rate:a,label:"Other",amt:l});return o}function J(t,{draft:s=!1,kind:o="",tpl:a=null,job:l=null}={}){let r=t.items||[],i=tt(t,r),p=String(o).toUpperCase()==="SERVICE",v=e=>p?String(e).replace(/\s*:\s*$/,"")+" :":e,w=t.customer||{},f=t.job||{},n={cusName:t.customer_name||w.name,cusTax:t.customer_tax_id||w.tax_id,cusBranch:t.customer_branch_code||w.branch_code,cusAddr:t.customer_address||w.address,cusTel:t.customer_phone||w.phone,invNo:s&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||f.job_no,declNo:t.customs_declaration_no||f.customs_declaration_no,cusPo:t.customer_job_no||f.customer_job_no,master:t.master_bl_no||f.master_bl_no,house:t.house_bl_no||f.house_bl_no,remarks:t.remarks||t.job_note||f.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},M=(e,d)=>e.map((u,T)=>{let z=P(u),R=m(u.amount);return`<tr>
      <td class="c ivd-no">${m(u.line_no)>0?m(u.line_no):d+T+1}</td>
      <td class="ivd-desc">${b(u.description,"")}</td>
      <td class="r">${z?"-":D(R)}</td>
      <td class="r">${z?D(R):"-"}</td>
      <td class="r">${D(R)}</td></tr>`}).join("")||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',E=G(r),N=E.map(e=>`<div class="ivd-wl"><span>${e.rate} % ${e.label}</span><span>${S(e.amt)}</span></div>`).join(""),j=E.filter(e=>e.amt>0).map(e=>`<div class="ivd-sl"><span>WHT ${e.rate} % ${e.label}</span><span>-${S(e.amt)}</span></div>`).join(""),_=["eta","etd","release_date","delivery_date","overtime_date","job_date"],F=e=>{if(!e)return"";for(let d of[t,f,l||{}]){if(!d)continue;let u=d[e];if(u!=null&&String(u).trim()!=="")return _.includes(e)?H(u):u}return""},C=[{label:"Decl No.",value:b(n.declNo)},{label:"Customer PO",value:b(n.cusPo)},{label:"Master",value:b(n.master)},{label:"House",value:b(n.house)}],A=["tl","tr","bl","br"],O=e=>{let u=(a&&a.fields||[]).find(T=>T&&T.key===e);return u?String(u.label||"").trim():""},B=a&&A.every(e=>a[e+"_source"])?A.map((e,d)=>({label:O(a[e+"_source"])||String(a[e+"_label"]||"").trim()||C[d].label,value:b(F(a[e+"_source"]))})):C,c=(e,d)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${e}</div>
      ${d?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${d.who}</div>
        <div class="ivd-sign-dt">${d.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${d?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,y=15,k=[...r].sort((e,d)=>m(e.line_no)-m(d.line_no)),g=[];for(let e=0;e<k.length;e+=y)g.push(k.slice(e,e+y));return g.length||g.push([]),g.map((e,d)=>{let u=d===g.length-1,T=M(e,d*y);return`
    <div class="ivd print-area${s?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${L.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${x(L.nameEn)}</div>
            <div class="ivd-co-ad">${x(L.address)}</div>
            <div class="ivd-co-tl">Tel. ${x(L.tel)} <i>|</i> Fax. ${x(L.fax)}
              <i>|</i> Tax ID ${x(L.taxId)}</div>
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
            
            <div class="ivd-f">${I("user")}<div class="ivd-fb"><label>${v("Customer Name")}</label>
              <div class="v">${b(n.cusName)}</div></div></div>
            <div class="ivd-f">${I("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${v("Tax ID")}</label><div class="v">${b(n.cusTax)}</div></div>
              <div><label>${v("Branch")}</label><div class="v">${b(n.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${I("pin")}<div class="ivd-fb"><label>${v("Address")}</label>
              <div class="v">${b(n.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${I("doc")}<div class="ivd-fb ivd-kv">
              <label>${v("Invoice No.")}</label><div class="v v-lg">${n.invNo?x(n.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${I("cal")}<div class="ivd-fb ivd-kv">
              <label>${v("Date")}</label><div class="v v-lg">${H(n.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${I("job")}<div class="ivd-fb ivd-kv">
              <label>${v("Job No.")}</label><div class="v v-lg">${b(n.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${B.map(z=>`<div class="ivd-rf"><label>${v(z.label)}</label><span>${z.value}</span></div>`).join("")}
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
        <tbody>${T}</tbody>
        
        <tfoot>${u?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2"><span class="ivd-trow-in">${I("sum")}<b>TOTAL</b></span></td>
          <td class="r">${D(i.svcCol)}</td>
          <td class="r">${D(i.advCol)}</td>
          <td class="r ivd-trow-g">${S($(i.svcCol+i.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${u?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${b(n.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${b(n.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${i.vatRate} %</span><span>${S(i.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${i.vatRate} %</span><span>${S(i.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${S(i.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${S(i.advCol)}</span></div>
          
          ${j}
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${S(i.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${N}</div>
        ${c("For The Customer")}
        ${c("For The "+x(L.nameEn),{who:b(n.createdBy),when:H(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${u?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var W="nj-print-doc",et=/[\\/:*?"<>|\u0000-\u001f]/g,U=t=>String(t??"").replace(et," ").replace(/\s+/g," ").trim();function Y(t){let s=t||{},o=U(s.job_no||s.job&&s.job.job_no||""),a=U(s.company_invoice||"");return[o,a].filter(Boolean).join(" - ")||"INVOICE"}function V(t){let s=document.body;s.classList.add(W);let o=document.title;t&&(document.title=t);let a=()=>{s.classList.remove(W),t&&(document.title=o)};window.addEventListener("afterprint",a,{once:!0});try{let l=window.matchMedia("print"),r=i=>{i.matches||(a(),l.removeEventListener("change",r))};l.addEventListener("change",r)}catch{}window.print()}var Z=24,st=.5,it=1.5,K=.1;function X(t,s){let o=t.querySelector(".ivd-fit"),a=t.querySelector(".ivd-fit-in"),l=t.querySelector(".ivd");if(!o||!a||!l)return()=>{};let r=()=>a.scrollHeight||l.offsetHeight||0,i="fit",h=1,p=null,v=1,w=.05,f=c=>Number.isFinite(c)&&c>0,n=()=>{let c=o.parentElement||o,y=o.style.width,k=o.style.height;o.style.width="",o.style.height="";let g=(c.clientWidth||0)-Z,e=(c.clientHeight||0)-Z;o.style.width=y,o.style.height=k;let d=l.offsetWidth||0,u=r();if(!f(d)||!f(u)||g<40)return v;let T=e>0?Math.min(g/d,e/u,1):Math.min(g/d,1);return f(T)&&(v=Math.max(w,T)),v},M=!1,E=null,N=()=>{if(M)return;let c=i==="fit"?n():h;f(c)||(c=E||1),c=Math.max(w,c),!(E!==null&&Math.abs(c-E)<.002)&&(E=c,a.style.transform="scale("+c+")",o.style.width=Math.ceil((l.offsetWidth||0)*c)+"px",o.style.height=Math.ceil(r()*c)+"px",o.dataset.scale=String(Math.round(c*1e3)/1e3),p&&(p.textContent=Math.round(c*100)+"%"))};if(s){let c=s.querySelector(".mf-left")||s,y=document.createElement("div");y.className="ivd-zoom",y.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',c.appendChild(y),p=y.querySelector("#ivd-zoom-v"),y.addEventListener("click",k=>{let g=k.target.closest("[data-z]");if(!g)return;let e=g.dataset.z;if(e==="fit")i="fit";else{let d=i==="fit"?n():h;e==="100"?h=1:h=Math.min(it,Math.max(st,Math.round((d+(e==="in"?K:-K))*100)/100)),i="zoom"}E=null,N()})}let j=c=>typeof requestAnimationFrame=="function"?requestAnimationFrame(c):setTimeout(c,16);N(),j(()=>j(()=>{E=null,N()}));let _=0,F=()=>{i!=="fit"||M||(_&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(_):clearTimeout(_)),_=j(()=>{_=0,N()}))},C=F,A=null;try{A=new ResizeObserver(C),A.observe(o.parentElement||o)}catch{window.addEventListener("resize",C)}window.addEventListener("orientationchange",C);let O=()=>{M=!0},B=()=>{M=!1,E=null,F(),i!=="fit"&&N()};return window.addEventListener("beforeprint",O),window.addEventListener("afterprint",B),()=>{try{A&&A.disconnect()}catch{}if(_){try{cancelAnimationFrame(_)}catch{clearTimeout(_)}_=0}window.removeEventListener("resize",C),window.removeEventListener("orientationchange",C),window.removeEventListener("beforeprint",O),window.removeEventListener("afterprint",B)}}function ct(t,{draft:s=!1,print:o=!1,kind:a="",tpl:l=null,job:r=null}={}){let i=document.createElement("div");i.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+J(t,{draft:s,kind:a,tpl:l,job:r})+"</div></div>";let h=document.createElement("div");h.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${s?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,q({title:s?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:i,footer:h,fullscreen:!0,wide:!0});let p=X(i,h);h.querySelector("[data-close]").addEventListener("click",p,{once:!0});let v=Y(t);h.querySelector("#ivd-print").onclick=()=>V(v),o&&setTimeout(()=>V(v),60)}function dt(t,{kind:s="",tpl:o=null,print:a=!1}={}){let l=(t||[]).filter(Boolean);if(!l.length)return;let r=document.createElement("div");r.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+l.map(v=>J(v,{draft:!1,kind:s,tpl:o,job:v&&v.job||null})).join("")+"</div></div>";let i=document.createElement("div");i.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${l.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,q({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+l.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:r,footer:i,fullscreen:!0,wide:!0});let h=X(r,i);i.querySelector("[data-close]").addEventListener("click",h,{once:!0});let p=l.length===1?Y(l[0]):"INVOICE "+l.length+" \u0E09\u0E1A\u0E31\u0E1A";i.querySelector("#ivd-print").onclick=()=>V(p),a&&setTimeout(()=>V(p),60)}export{P as a,J as b,Y as c,ct as d,dt as e};
