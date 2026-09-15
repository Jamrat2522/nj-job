import{a as L}from"./chunk-UWAYW6DC.js";import{a as K}from"./chunk-DIH2PLYD.js";import{a as T,c as q,e as x}from"./chunk-PCFU74ZV.js";var H=t=>t==null||t===""||Number(t)===0?"-":T(t),$=(t,n="-")=>{let s=t==null?"":String(t).trim();return x(s||n)},u=t=>{let n=Number(t);return Number.isFinite(n)?n:0},y=t=>Math.round((u(t)+Number.EPSILON)*100)/100,it={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},j=t=>`<span class="ivd-ic">${it[t]||""}</span>`,U=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function nt(t,n){let s=0,i=0,o=0,v=0;for(let a of n)U(a)?v=y(v+u(a.amount)):o=y(o+u(a.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(o=y(u(t.service_amount)),v=y(u(t.advance_amount)));let c=0;for(let a of n){let g=u(a.vat_amount)>0||u(a.vat_rate)>0;!U(a)&&g?(s=y(s+u(a.amount)),c=y(c+u(a.vat_amount))):i=y(i+u(a.amount))}let p=c,d=[...new Set(n.map(a=>u(a.vat_rate)).filter(a=>a>0))],h=d.length===1?d[0]:u(t.vat_rate)||7,_=y(s+p),m=Q(n).reduce((a,g)=>y(a+g.amt),0);return{vatBase:s,nonVat:i,vat:p,vatRate:h,total:_,whtTotal:m,grand:y(_+i-m),svcCol:o,advCol:v}}function Q(t){let n=new Map;for(let i of t){if(U(i))continue;let o=u(i.wht_rate);o<=0||n.set(o,y((n.get(o)||0)+u(i.wht_amount)))}let s=[{rate:1,label:"Transportation",amt:n.get(1)||0},{rate:3,label:"Service",amt:n.get(3)||0}];for(let[i,o]of[...n.entries()].sort((v,c)=>v[0]-c[0]))i!==1&&i!==3&&s.push({rate:i,label:"Other",amt:o});return s}function tt(t,{draft:n=!1,kind:s="",tpl:i=null,job:o=null,hideDraft:v=!1,fixedRows:c=0}={}){let p=t.items||[],d=nt(t,p),_=String(s).toUpperCase()==="SERVICE",m=e=>_?String(e).replace(/\s*:\s*$/,"")+" :":e,a=t.customer||{},g=t.job||{},r={cusName:t.customer_name||a.name,cusTax:t.customer_tax_id||a.tax_id,cusBranch:t.customer_branch_code||a.branch_code,cusAddr:t.customer_address||a.address,cusTel:t.customer_phone||a.phone,invNo:n&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||g.job_no,declNo:t.customs_declaration_no||g.customs_declaration_no,cusPo:t.customer_job_no||g.customer_job_no,master:t.master_bl_no||g.master_bl_no,house:t.house_bl_no||g.house_bl_no,remarks:t.remarks||t.job_note||g.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},A=(e,b)=>e.map((f,D)=>{let V=U(f),z=u(f.amount);return`<tr>
      <td class="c ivd-no">${u(f.line_no)>0?u(f.line_no):b+D+1}</td>
      <td class="ivd-desc">${$(f.description,"")}</td>
      <td class="r">${V?"-":H(z)}</td>
      <td class="r">${V?H(z):"-"}</td>
      <td class="r">${H(z)}</td></tr>`}).join(""),F=e=>e<=0?"":Array.from({length:e},()=>'<tr class="ivd-blank" aria-hidden="true"><td class="c ivd-no"></td><td class="ivd-desc"></td><td class="r"></td><td class="r"></td><td class="r"></td></tr>').join(""),w=Q(p),P=w.map(e=>`<div class="ivd-wl"><span>${e.rate} % ${e.label}</span><span>${T(e.amt)}</span></div>`).join(""),I=w.filter(e=>e.amt>0).map(e=>`<div class="ivd-sl"><span>WHT ${e.rate} % ${e.label}</span><span>-${T(e.amt)}</span></div>`).join(""),k=["eta","etd","release_date","delivery_date","overtime_date","job_date"],R=e=>{if(!e)return"";for(let b of[t,g,o||{}]){if(!b)continue;let f=b[e];if(f!=null&&String(f).trim()!=="")return k.includes(e)?q(f):f}return""},O=[{label:"Decl No.",value:$(r.declNo)},{label:"Customer PO",value:$(r.cusPo)},{label:"Master",value:$(r.master)},{label:"House",value:$(r.house)}],l=["tl","tr","bl","br"],E=e=>{let f=(i&&i.fields||[]).find(D=>D&&D.key===e);return f?String(f.label||"").trim():""},B=i&&l.every(e=>i[e+"_source"])?l.map((e,b)=>({label:E(i[e+"_source"])||String(i[e+"_label"]||"").trim()||O[b].label,value:$(R(i[e+"_source"]))})):O,S=(e,b)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${e}</div>
      ${b?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${b.who}</div>
        <div class="ivd-sign-dt">${b.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${b?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,M=15,C=[...p].sort((e,b)=>u(e.line_no)-u(b.line_no)),N=[];for(let e=0;e<C.length;e+=M)N.push(C.slice(e,e+M));return N.length||N.push([]),N.map((e,b)=>{let f=b===N.length-1,D=Math.max(0,Math.min(u(c),M)-e.length),V=A(e,b*M)+F(D)||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>';return`
    <div class="ivd print-area${n?" ivd-draft":""}">
      
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
          ${n&&!v?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${j("user")}<div class="ivd-fb"><label>${m("Customer Name")}</label>
              <div class="v">${$(r.cusName)}</div></div></div>
            <div class="ivd-f">${j("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${m("Tax ID")}</label><div class="v">${$(r.cusTax)}</div></div>
              <div><label>${m("Branch")}</label><div class="v">${$(r.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${j("pin")}<div class="ivd-fb"><label>${m("Address")}</label>
              <div class="v">${$(r.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${j("doc")}<div class="ivd-fb ivd-kv">
              <label>${m("Invoice No.")}</label><div class="v v-lg">${r.invNo?x(r.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${j("cal")}<div class="ivd-fb ivd-kv">
              <label>${m("Date")}</label><div class="v v-lg">${q(r.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${j("job")}<div class="ivd-fb ivd-kv">
              <label>${m("Job No.")}</label><div class="v v-lg">${$(r.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${B.map(z=>`<div class="ivd-rf"><label>${m(z.label)}</label><span>${z.value}</span></div>`).join("")}
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
        <tbody>${V}</tbody>
        
        <tfoot>${f?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2"><span class="ivd-trow-in">${j("sum")}<b>TOTAL</b></span></td>
          <td class="r">${H(d.svcCol)}</td>
          <td class="r">${H(d.advCol)}</td>
          <td class="r ivd-trow-g">${T(y(d.svcCol+d.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${f?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${$(r.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${$(r.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${d.vatRate} %</span><span>${T(d.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${d.vatRate} %</span><span>${T(d.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${T(d.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${T(d.advCol)}</span></div>
          
          ${I}
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${T(d.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${P}</div>
        ${S("For The Customer")}
        ${S("For The "+x(L.nameEn),{who:$(r.createdBy),when:q(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${f?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var G="nj-print-doc",ot=/[\\/:*?"<>|\u0000-\u001f]/g,W=t=>String(t??"").replace(ot," ").replace(/\s+/g," ").trim(),J=t=>String(t||"").replace(/[.\s]+$/,"");function et(t,{accFilename:n=!1}={}){let s=t||{};if(!n){let d=W(s.job_no||s.job&&s.job.job_no||""),h=W(s.company_invoice||"");return[d,h].filter(Boolean).join(" - ")||"INVOICE"}let i=String(s.invoice_no||"").trim(),o=i&&!/^DRAFT-/i.test(i)?i:"",v=W(o||s.job_no||s.job&&s.job.job_no||""),c=J(W(s.company_invoice||""));return J([v,c].filter(Boolean).join(" - "))||"INVOICE"}function Z(t){let n=document.body;n.classList.add(G);let s=document.title;t&&(document.title=t);let i=()=>{n.classList.remove(G),t&&(document.title=s)};window.addEventListener("afterprint",i,{once:!0});try{let o=window.matchMedia("print"),v=c=>{c.matches||(i(),o.removeEventListener("change",v))};o.addEventListener("change",v)}catch{}window.print()}var Y=24,at=.5,lt=1.5,X=.1;function st(t,n){let s=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),o=t.querySelector(".ivd");if(!s||!i||!o)return()=>{};let v=()=>i.scrollHeight||o.offsetHeight||0,c="fit",p=1,d=null,h=1,_=.05,m=l=>Number.isFinite(l)&&l>0,a=()=>{let l=s.parentElement||s,E=s.style.width,B=s.style.height;s.style.width="",s.style.height="";let S=(l.clientWidth||0)-Y,M=(l.clientHeight||0)-Y;s.style.width=E,s.style.height=B;let C=o.offsetWidth||0,N=v();if(!m(C)||!m(N)||S<40)return h;let e=M>0?Math.min(S/C,M/N,1):Math.min(S/C,1);return m(e)&&(h=Math.max(_,e)),h},g=!1,r=null,A=()=>{if(g)return;let l=c==="fit"?a():p;m(l)||(l=r||1),l=Math.max(_,l),!(r!==null&&Math.abs(l-r)<.002)&&(r=l,i.style.transform="scale("+l+")",s.style.width=Math.ceil((o.offsetWidth||0)*l)+"px",s.style.height=Math.ceil(v()*l)+"px",s.dataset.scale=String(Math.round(l*1e3)/1e3),d&&(d.textContent=Math.round(l*100)+"%"))};if(n){let l=n.querySelector(".mf-left")||n,E=document.createElement("div");E.className="ivd-zoom",E.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',l.appendChild(E),d=E.querySelector("#ivd-zoom-v"),E.addEventListener("click",B=>{let S=B.target.closest("[data-z]");if(!S)return;let M=S.dataset.z;if(M==="fit")c="fit";else{let C=c==="fit"?a():p;M==="100"?p=1:p=Math.min(lt,Math.max(at,Math.round((C+(M==="in"?X:-X))*100)/100)),c="zoom"}r=null,A()})}let F=l=>typeof requestAnimationFrame=="function"?requestAnimationFrame(l):setTimeout(l,16);A(),F(()=>F(()=>{r=null,A()}));let w=0,P=()=>{c!=="fit"||g||(w&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(w):clearTimeout(w)),w=F(()=>{w=0,A()}))},I=P,k=null;try{k=new ResizeObserver(I),k.observe(s.parentElement||s)}catch{window.addEventListener("resize",I)}window.addEventListener("orientationchange",I);let R=()=>{g=!0},O=()=>{g=!1,r=null,P(),c!=="fit"&&A()};return window.addEventListener("beforeprint",R),window.addEventListener("afterprint",O),()=>{try{k&&k.disconnect()}catch{}if(w){try{cancelAnimationFrame(w)}catch{clearTimeout(w)}w=0}window.removeEventListener("resize",I),window.removeEventListener("orientationchange",I),window.removeEventListener("beforeprint",R),window.removeEventListener("afterprint",O)}}function ut(t,{draft:n=!1,print:s=!1,kind:i="",tpl:o=null,job:v=null,hideDraft:c=!1,fixedRows:p=0,accFilename:d=!1}={}){let h=document.createElement("div");h.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+tt(t,{draft:n,kind:i,tpl:o,job:v,hideDraft:c,fixedRows:p})+"</div></div>";let _=document.createElement("div");_.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${n?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,K({title:n?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:h,footer:_,fullscreen:!0,wide:!0});let m=st(h,_);_.querySelector("[data-close]").addEventListener("click",m,{once:!0});let a=et(t,{accFilename:d});_.querySelector("#ivd-print").onclick=()=>Z(a),s&&setTimeout(()=>Z(a),60)}function mt(t,{kind:n="",tpl:s=null,print:i=!1}={}){let o=(t||[]).filter(Boolean);if(!o.length)return;let v=document.createElement("div");v.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+o.map(h=>tt(h,{draft:!1,kind:n,tpl:s,job:h&&h.job||null})).join("")+"</div></div>";let c=document.createElement("div");c.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${o.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,K({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+o.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:v,footer:c,fullscreen:!0,wide:!0});let p=st(v,c);c.querySelector("[data-close]").addEventListener("click",p,{once:!0});let d=o.length===1?et(o[0]):"INVOICE "+o.length+" \u0E09\u0E1A\u0E31\u0E1A";c.querySelector("#ivd-print").onclick=()=>Z(d),i&&setTimeout(()=>Z(d),60)}export{U as a,tt as b,et as c,ut as d,mt as e};
