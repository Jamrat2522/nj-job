import{a as E}from"./chunk-UWAYW6DC.js";import{a as B}from"./chunk-DIH2PLYD.js";import{a as M,c as A,e as S}from"./chunk-PCFU74ZV.js";var I=t=>t==null||t===""||Number(t)===0?"-":M(t),h=(t,e="-")=>{let a=t==null?"":String(t).trim();return S(a||e)},u=t=>{let e=Number(t);return Number.isFinite(e)?e:0},$=t=>Math.round((u(t)+Number.EPSILON)*100)/100,J={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},x=t=>`<span class="ivd-ic">${J[t]||""}</span>`,U=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function Y(t,e){let a=0,i=0,o=0,d=0;for(let c of e)U(c)?d=$(d+u(c.amount)):o=$(o+u(c.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(o=$(u(t.service_amount)),d=$(u(t.advance_amount)));for(let c of e)u(c.vat_amount)>0||u(c.vat_rate)>0?a=$(a+u(c.amount)):i=$(i+u(c.amount));let s=$(t.vat_amount),b=[...new Set(e.map(c=>u(c.vat_rate)).filter(c=>c>0))],f=b.length===1?b[0]:u(t.vat_rate)||7,l=$(a+s);return{vatBase:a,nonVat:i,vat:s,vatRate:f,total:l,grand:$(l+i),svcCol:o,advCol:d}}function X(t){let e=new Map;for(let i of t){let o=u(i.wht_rate);o<=0||e.set(o,$((e.get(o)||0)+u(i.wht_amount)))}let a=[{rate:1,label:"Transportation",amt:e.get(1)||0},{rate:3,label:"Service",amt:e.get(3)||0}];for(let[i,o]of[...e.entries()].sort((d,s)=>d[0]-s[0]))i!==1&&i!==3&&a.push({rate:i,label:"Other",amt:o});return a}function W(t,{draft:e=!1,kind:a="",tpl:i=null,job:o=null}={}){let d=t.items||[],s=Y(t,d),f=String(a).toUpperCase()==="SERVICE",l=n=>f?String(n).replace(/\s*:\s*$/,"")+" :":n,c=t.customer||{},g=t.job||{},r={cusName:t.customer_name||c.name,cusTax:t.customer_tax_id||c.tax_id,cusBranch:t.customer_branch_code||c.branch_code,cusAddr:t.customer_address||c.address,cusTel:t.customer_phone||c.phone,invNo:e&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||g.job_no,declNo:t.customs_declaration_no||g.customs_declaration_no,cusPo:t.customer_job_no||g.customer_job_no,master:t.master_bl_no||g.master_bl_no,house:t.house_bl_no||g.house_bl_no,remarks:t.remarks||t.job_note||g.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},T=(n,p)=>n.map((v,N)=>{let k=U(v),O=u(v.amount);return`<tr>
      <td class="c ivd-no">${u(v.line_no)>0?u(v.line_no):p+N+1}</td>
      <td class="ivd-desc">${h(v.description,"")}</td>
      <td class="r">${k?"-":I(O)}</td>
      <td class="r">${k?I(O):"-"}</td>
      <td class="r">${I(v.unit_price)}</td>
      <td class="r">${I(O)}</td></tr>`}).join("")||'<tr><td colspan="6" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',m=X(d).map(n=>`<div class="ivd-wl"><span>${n.rate} % ${n.label}</span><span>${M(n.amt)}</span></div>`).join(""),_=["eta","etd","release_date","delivery_date","overtime_date","job_date"],C=n=>{if(!n)return"";for(let p of[t,g,o||{}]){if(!p)continue;let v=p[n];if(v!=null&&String(v).trim()!=="")return _.includes(n)?A(v):v}return""},w=[{label:"Decl No.",value:h(r.declNo)},{label:"Customer PO",value:h(r.cusPo)},{label:"Master",value:h(r.master)},{label:"House",value:h(r.house)}],y=["tl","tr","bl","br"],D=n=>{let v=(i&&i.fields||[]).find(N=>N&&N.key===n);return v?String(v.label||"").trim():""},G=i&&y.every(n=>i[n+"_source"])?y.map((n,p)=>({label:D(i[n+"_source"])||String(i[n+"_label"]||"").trim()||w[p].label,value:h(C(i[n+"_source"]))})):w,P=n=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${n}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`,z=15,V=[...d].sort((n,p)=>u(n.line_no)-u(p.line_no)),L=[];for(let n=0;n<V.length;n+=z)L.push(V.slice(n,n+z));return L.length||L.push([]),L.map((n,p)=>{let v=p===L.length-1,N=T(n,p*z);return`
    <div class="ivd print-area${e?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${E.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${S(E.nameEn)}</div>
            <div class="ivd-co-ad">${S(E.address)}</div>
            <div class="ivd-co-tl">Tel. ${S(E.tel)} <i>|</i> Fax. ${S(E.fax)}
              <i>|</i> Tax ID ${S(E.taxId)}</div>
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
            
            <div class="ivd-f">${x("user")}<div class="ivd-fb"><label>${l("Customer Name")}</label>
              <div class="v">${h(r.cusName)}</div></div></div>
            <div class="ivd-f">${x("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${l("Tax ID")}</label><div class="v">${h(r.cusTax)}</div></div>
              <div><label>${l("Branch")}</label><div class="v">${h(r.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${x("pin")}<div class="ivd-fb"><label>${l("Address")}</label>
              <div class="v">${h(r.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${x("doc")}<div class="ivd-fb ivd-kv">
              <label>${l("Invoice No.")}</label><div class="v v-lg">${r.invNo?S(r.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${x("cal")}<div class="ivd-fb ivd-kv">
              <label>${l("Date")}</label><div class="v v-lg">${A(r.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${x("job")}<div class="ivd-fb ivd-kv">
              <label>${l("Job No.")}</label><div class="v v-lg">${h(r.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${G.map(k=>`<div class="ivd-rf"><label>${l(k.label)}</label><span>${k.value}</span></div>`).join("")}
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
        
        <tfoot>${v?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2">${x("sum")}<b>TOTAL</b></td>
          <td class="r">${I(s.svcCol)}</td>
          <td class="r">${I(s.advCol)}</td>
          <td></td>
          <td class="r ivd-trow-g">${M($(s.svcCol+s.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${v?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${h(r.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${h(r.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${s.vatRate} %</span><span>${M(s.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${s.vatRate} %</span><span>${M(s.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${M(s.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${M(s.advCol)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${M(s.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${m}</div>
        ${P("For The Customer")}
        ${P("For The "+S(E.nameEn))}
      </section>
      </div>`:""}

      
      ${v?`<footer class="ivd-bar">
        <div>${x("user")}Created By : <b>${h(r.createdBy)}</b></div>
        <div>${x("print")}Printed Date : <b>${A(new Date().toISOString().slice(0,10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>`:""}
    </div>`}).join("")}var H="nj-print-doc",Q=/[\\/:*?"<>|\u0000-\u001f]/g,R=t=>String(t??"").replace(Q," ").replace(/\s+/g," ").trim();function Z(t){let e=t||{},a=R(e.job_no||e.job&&e.job.job_no||""),i=R(e.company_invoice||"");return[a,i].filter(Boolean).join(" - ")||"INVOICE"}function j(t){let e=document.body;e.classList.add(H);let a=document.title;t&&(document.title=t);let i=()=>{e.classList.remove(H),t&&(document.title=a)};window.addEventListener("afterprint",i,{once:!0});try{let o=window.matchMedia("print"),d=s=>{s.matches||(i(),o.removeEventListener("change",d))};o.addEventListener("change",d)}catch{}window.print()}var F=24,tt=.5,et=1.5,q=.1;function K(t,e){let a=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),o=t.querySelector(".ivd");if(!a||!i||!o)return()=>{};let d=()=>i.scrollHeight||o.offsetHeight||0,s="fit",b=1,f=null,l=()=>{let m=a.parentElement||a,_=(m.clientWidth||0)-F,C=(m.clientHeight||0)-F,w=o.offsetWidth||0,y=d();return _<=0||w<=0||y<=0?1:C>0?Math.min(_/w,C/y,1):Math.min(_/w,1)},c=()=>{let m=s==="fit"?l():b;i.style.transform="scale("+m+")",a.style.width=Math.ceil((o.offsetWidth||0)*m)+"px",a.style.height=Math.ceil(d()*m)+"px",a.dataset.scale=String(Math.round(m*1e3)/1e3),f&&(f.textContent=Math.round(m*100)+"%")};if(e){let m=e.querySelector(".mf-left")||e,_=document.createElement("div");_.className="ivd-zoom",_.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',m.appendChild(_),f=_.querySelector("#ivd-zoom-v"),_.addEventListener("click",C=>{let w=C.target.closest("[data-z]");if(!w)return;let y=w.dataset.z;if(y==="fit")s="fit";else{let D=s==="fit"?l():b;y==="100"?b=1:b=Math.min(et,Math.max(tt,Math.round((D+(y==="in"?q:-q))*100)/100)),s="zoom"}c()})}c();let g=m=>typeof requestAnimationFrame=="function"?requestAnimationFrame(m):setTimeout(m,16);g(()=>g(c));let r=()=>{s==="fit"&&c()},T=null;try{T=new ResizeObserver(r),T.observe(a.parentElement||a)}catch{window.addEventListener("resize",r)}return window.addEventListener("orientationchange",r),()=>{try{T&&T.disconnect()}catch{}window.removeEventListener("resize",r),window.removeEventListener("orientationchange",r)}}function at(t,{draft:e=!1,print:a=!1,kind:i="",tpl:o=null,job:d=null}={}){let s=document.createElement("div");s.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+W(t,{draft:e,kind:i,tpl:o,job:d})+"</div></div>";let b=document.createElement("div");b.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${e?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,B({title:e?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:s,footer:b,fullscreen:!0,wide:!0});let f=K(s,b);b.querySelector("[data-close]").addEventListener("click",f,{once:!0});let l=Z(t);b.querySelector("#ivd-print").onclick=()=>j(l),a&&setTimeout(()=>j(l),60)}function ct(t,{kind:e="",tpl:a=null,print:i=!1}={}){let o=(t||[]).filter(Boolean);if(!o.length)return;let d=document.createElement("div");d.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+o.map(l=>W(l,{draft:!1,kind:e,tpl:a,job:l&&l.job||null})).join("")+"</div></div>";let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${o.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,B({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+o.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:d,footer:s,fullscreen:!0,wide:!0});let b=K(d,s);s.querySelector("[data-close]").addEventListener("click",b,{once:!0});let f=o.length===1?Z(o[0]):"INVOICE "+o.length+" \u0E09\u0E1A\u0E31\u0E1A";s.querySelector("#ivd-print").onclick=()=>j(f),i&&setTimeout(()=>j(f),60)}export{U as a,W as b,Z as c,at as d,ct as e};
