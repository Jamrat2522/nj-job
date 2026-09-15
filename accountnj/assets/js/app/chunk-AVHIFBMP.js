import{a as A}from"./chunk-UWAYW6DC.js";import{a as G}from"./chunk-DIH2PLYD.js";import{a as S,c as W,e as C}from"./chunk-PCFU74ZV.js";var R=t=>t==null||t===""||Number(t)===0?"-":S(t),w=(t,n="-")=>{let e=t==null?"":String(t).trim();return C(e||n)},u=t=>{let n=Number(t);return Number.isFinite(n)?n:0},y=t=>Math.round((u(t)+Number.EPSILON)*100)/100,nt={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},j=t=>`<span class="ivd-ic">${nt[t]||""}</span>`,Z=t=>String(t&&t.charge_kind||"").toUpperCase()==="ADVANCE";function ot(t,n){let e=0,i=0,l=0,c=0;for(let o of n)Z(o)?c=y(c+u(o.amount)):l=y(l+u(o.amount));t&&t.service_amount!=null&&t.advance_amount!=null&&(l=y(u(t.service_amount)),c=y(u(t.advance_amount)));let r=0;for(let o of n){let h=u(o.vat_amount)>0||u(o.vat_rate)>0;!Z(o)&&h?(e=y(e+u(o.amount)),r=y(r+u(o.vat_amount))):i=y(i+u(o.amount))}let m=r,p=[...new Set(n.map(o=>u(o.vat_rate)).filter(o=>o>0))],d=p.length===1?p[0]:u(t.vat_rate)||7,_=y(e+m),g=tt(n).reduce((o,h)=>y(o+h.amt),0);return{vatBase:e,nonVat:i,vat:m,vatRate:d,total:_,whtTotal:g,grand:y(_+i-g),svcCol:l,advCol:c}}function tt(t){let n=new Map;for(let i of t){if(Z(i))continue;let l=u(i.wht_rate);l<=0||n.set(l,y((n.get(l)||0)+u(i.wht_amount)))}let e=[{rate:1,label:"Transportation",amt:n.get(1)||0},{rate:3,label:"Service",amt:n.get(3)||0}];for(let[i,l]of[...n.entries()].sort((c,r)=>c[0]-r[0]))i!==1&&i!==3&&e.push({rate:i,label:"Other",amt:l});return e}function et(t,{draft:n=!1,kind:e="",tpl:i=null,job:l=null,hideDraft:c=!1,fixedRows:r=0,whtPositive:m=!1}={}){let p=t.items||[],d=ot(t,p),g=String(e).toUpperCase()==="SERVICE",o=s=>g?String(s).replace(/\s*:\s*$/,"")+" :":s,h=t.customer||{},$=t.job||{},v={cusName:t.customer_name||h.name,cusTax:t.customer_tax_id||h.tax_id,cusBranch:t.customer_branch_code||h.branch_code,cusAddr:t.customer_address||h.address,cusTel:t.customer_phone||h.phone,invNo:n&&t.has_real_no===!1?null:t.invoice_no,invDate:t.invoice_date,jobNo:t.job_no||$.job_no,declNo:t.customs_declaration_no||$.customs_declaration_no,cusPo:t.customer_job_no||$.customer_job_no,master:t.master_bl_no||$.master_bl_no,house:t.house_bl_no||$.house_bl_no,remarks:t.remarks||t.job_note||$.note,companyInvoice:t.company_invoice,createdBy:t.created_by_name||t.issued_by_name},F=(s,b)=>s.map((f,D)=>{let q=Z(f),z=u(f.amount);return`<tr>
      <td class="c ivd-no">${u(f.line_no)>0?u(f.line_no):b+D+1}</td>
      <td class="ivd-desc">${w(f.description,"")}</td>
      <td class="r">${q?"-":R(z)}</td>
      <td class="r">${q?R(z):"-"}</td>
      <td class="r">${R(z)}</td></tr>`}).join(""),M=s=>s<=0?"":Array.from({length:s},()=>'<tr class="ivd-blank" aria-hidden="true"><td class="c ivd-no"></td><td class="ivd-desc"></td><td class="r"></td><td class="r"></td><td class="r"></td></tr>').join(""),O=tt(p),I=O.map(s=>`<div class="ivd-wl"><span>${s.rate} % ${s.label}</span><span>${S(s.amt)}</span></div>`).join(""),k=O.filter(s=>s.amt>0||m&&s.rate===3).map(s=>`<div class="ivd-sl"><span>WHT ${s.rate} % ${s.label}</span><span>${m?"":"-"}${S(s.amt)}</span></div>`).join(""),V=["eta","etd","release_date","delivery_date","overtime_date","job_date"],P=s=>{if(!s)return"";for(let b of[t,$,l||{}]){if(!b)continue;let f=b[s];if(f!=null&&String(f).trim()!=="")return V.includes(s)?W(f):f}return""},a=[{label:"Decl No.",value:w(v.declNo)},{label:"Customer PO",value:w(v.cusPo)},{label:"Master",value:w(v.master)},{label:"House",value:w(v.house)}],T=["tl","tr","bl","br"],B=s=>{let f=(i&&i.fields||[]).find(D=>D&&D.key===s);return f?String(f.label||"").trim():""},N=i&&T.every(s=>i[s+"_source"])?T.map((s,b)=>({label:B(i[s+"_source"])||String(i[s+"_label"]||"").trim()||a[b].label,value:w(P(i[s+"_source"]))})):a,x=(s,b)=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${s}</div>
      ${b?`<div class="ivd-sign-m">
        <div class="ivd-sign-by">${b.who}</div>
        <div class="ivd-sign-dt">${b.when}</div></div>`:""}
      <div class="ivd-sign-line"></div>
      ${b?"":'<div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>'}
      <div class="ivd-sign-c">Authorized Signature</div></div>`,E=15,H=[...p].sort((s,b)=>u(s.line_no)-u(b.line_no)),L=[];for(let s=0;s<H.length;s+=E)L.push(H.slice(s,s+E));return L.length||L.push([]),L.map((s,b)=>{let f=b===L.length-1,D=Math.max(0,Math.min(u(r),E)-s.length),q=F(s,b*E)+M(D)||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>';return`
    <div class="ivd print-area${n?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${A.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${C(A.nameEn)}</div>
            <div class="ivd-co-ad">${C(A.address)}</div>
            <div class="ivd-co-tl">Tel. ${C(A.tel)} <i>|</i> Fax. ${C(A.fax)}
              <i>|</i> Tax ID ${C(A.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r">
          ${n&&!c?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${j("user")}<div class="ivd-fb"><label>${o("Customer Name")}</label>
              <div class="v">${w(v.cusName)}</div></div></div>
            <div class="ivd-f">${j("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${o("Tax ID")}</label><div class="v">${w(v.cusTax)}</div></div>
              <div><label>${o("Branch")}</label><div class="v">${w(v.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${j("pin")}<div class="ivd-fb"><label>${o("Address")}</label>
              <div class="v">${w(v.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${j("doc")}<div class="ivd-fb ivd-kv">
              <label>${o("Invoice No.")}</label><div class="v v-lg">${v.invNo?C(v.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${j("cal")}<div class="ivd-fb ivd-kv">
              <label>${o("Date")}</label><div class="v v-lg">${W(v.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${j("job")}<div class="ivd-fb ivd-kv">
              <label>${o("Job No.")}</label><div class="v v-lg">${w(v.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${N.map(z=>`<div class="ivd-rf"><label>${o(z.label)}</label><span>${z.value}</span></div>`).join("")}
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
        <tbody>${q}</tbody>
        
        <tfoot>${f?`<tr class="ivd-trow">
          <td class="ivd-trow-l" colspan="2"><span class="ivd-trow-in">${j("sum")}<b>TOTAL</b></span></td>
          <td class="r">${R(d.svcCol)}</td>
          <td class="r">${R(d.advCol)}</td>
          <td class="r ivd-trow-g">${S(y(d.svcCol+d.advCol))}</td>
        </tr>`:""}</tfoot>
      </table>

      
      ${f?`<div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${w(v.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${w(v.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${d.vatRate} %</span><span>${S(d.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${d.vatRate} %</span><span>${S(d.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${S(d.total)}</span></div>
          
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${S(d.advCol)}</span></div>
          
          ${k}
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${S(d.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${I}</div>
        ${x("For The Customer")}
        ${x("For The "+C(A.nameEn),{who:w(v.createdBy),when:W(new Date().toISOString().slice(0,10))})}
      </section>
      </div>`:""}

      
      ${f?'<div class="ivd-edge"></div>':""}
    </div>`}).join("")}var J="nj-print-doc",at=/[\\/:*?"<>|\u0000-\u001f]/g,U=t=>String(t??"").replace(at," ").replace(/\s+/g," ").trim(),Y=t=>String(t||"").replace(/[.\s]+$/,"");function st(t,{accFilename:n=!1}={}){let e=t||{};if(!n){let p=U(e.job_no||e.job&&e.job.job_no||""),d=U(e.company_invoice||"");return[p,d].filter(Boolean).join(" - ")||"INVOICE"}let i=String(e.invoice_no||"").trim(),l=i&&!/^DRAFT-/i.test(i)?i:"",c=U(l||e.job_no||e.job&&e.job.job_no||""),r=Y(U(e.company_invoice||""));return Y([c,r].filter(Boolean).join(" - "))||"INVOICE"}function K(t){let n=document.body;n.classList.add(J);let e=document.title;t&&(document.title=t);let i=()=>{n.classList.remove(J),t&&(document.title=e)};window.addEventListener("afterprint",i,{once:!0});try{let l=window.matchMedia("print"),c=r=>{r.matches||(i(),l.removeEventListener("change",c))};l.addEventListener("change",c)}catch{}window.print()}var X=24,lt=.5,ct=1.5,Q=.1;function it(t,n){let e=t.querySelector(".ivd-fit"),i=t.querySelector(".ivd-fit-in"),l=t.querySelector(".ivd");if(!e||!i||!l)return()=>{};let c=()=>i.scrollHeight||l.offsetHeight||0,r="fit",m=1,p=null,d=1,_=.05,g=a=>Number.isFinite(a)&&a>0,o=()=>{let a=e.parentElement||e,T=e.style.width,B=e.style.height;e.style.width="",e.style.height="";let N=(a.clientWidth||0)-X,x=(a.clientHeight||0)-X;e.style.width=T,e.style.height=B;let E=l.offsetWidth||0,H=c();if(!g(E)||!g(H)||N<40)return d;let L=x>0?Math.min(N/E,x/H,1):Math.min(N/E,1);return g(L)&&(d=Math.max(_,L)),d},h=!1,$=null,v=()=>{if(h)return;let a=r==="fit"?o():m;g(a)||(a=$||1),a=Math.max(_,a),!($!==null&&Math.abs(a-$)<.002)&&($=a,i.style.transform="scale("+a+")",e.style.width=Math.ceil((l.offsetWidth||0)*a)+"px",e.style.height=Math.ceil(c()*a)+"px",e.dataset.scale=String(Math.round(a*1e3)/1e3),p&&(p.textContent=Math.round(a*100)+"%"))};if(n){let a=n.querySelector(".mf-left")||n,T=document.createElement("div");T.className="ivd-zoom",T.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="ivd-zoom-v" id="ivd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',a.appendChild(T),p=T.querySelector("#ivd-zoom-v"),T.addEventListener("click",B=>{let N=B.target.closest("[data-z]");if(!N)return;let x=N.dataset.z;if(x==="fit")r="fit";else{let E=r==="fit"?o():m;x==="100"?m=1:m=Math.min(ct,Math.max(lt,Math.round((E+(x==="in"?Q:-Q))*100)/100)),r="zoom"}$=null,v()})}let F=a=>typeof requestAnimationFrame=="function"?requestAnimationFrame(a):setTimeout(a,16);v(),F(()=>F(()=>{$=null,v()}));let M=0,O=()=>{r!=="fit"||h||(M&&(typeof cancelAnimationFrame=="function"?cancelAnimationFrame(M):clearTimeout(M)),M=F(()=>{M=0,v()}))},I=O,k=null;try{k=new ResizeObserver(I),k.observe(e.parentElement||e)}catch{window.addEventListener("resize",I)}window.addEventListener("orientationchange",I);let V=()=>{h=!0},P=()=>{h=!1,$=null,O(),r!=="fit"&&v()};return window.addEventListener("beforeprint",V),window.addEventListener("afterprint",P),()=>{try{k&&k.disconnect()}catch{}if(M){try{cancelAnimationFrame(M)}catch{clearTimeout(M)}M=0}window.removeEventListener("resize",I),window.removeEventListener("orientationchange",I),window.removeEventListener("beforeprint",V),window.removeEventListener("afterprint",P)}}function mt(t,{draft:n=!1,print:e=!1,kind:i="",tpl:l=null,job:c=null,hideDraft:r=!1,fixedRows:m=0,accFilename:p=!1,whtPositive:d=!1}={}){let _=document.createElement("div");_.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+et(t,{draft:n,kind:i,tpl:l,job:c,hideDraft:r,fixedRows:m,whtPositive:d})+"</div></div>";let g=document.createElement("div");g.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${n?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,G({title:n?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:_,footer:g,fullscreen:!0,wide:!0});let o=it(_,g);g.querySelector("[data-close]").addEventListener("click",o,{once:!0});let h=st(t,{accFilename:p});g.querySelector("#ivd-print").onclick=()=>K(h),e&&setTimeout(()=>K(h),60)}function ft(t,{kind:n="",tpl:e=null,print:i=!1,whtPositive:l=!1}={}){let c=(t||[]).filter(Boolean);if(!c.length)return;let r=document.createElement("div");r.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+c.map(_=>et(_,{draft:!1,kind:n,tpl:e,job:_&&_.job||null,whtPositive:l})).join("")+"</div></div>";let m=document.createElement("div");m.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} Print ${c.length} INVOICE</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,G({title:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \u2014 "+c.length.toLocaleString("th-TH")+" \u0E43\u0E1A",body:r,footer:m,fullscreen:!0,wide:!0});let p=it(r,m);m.querySelector("[data-close]").addEventListener("click",p,{once:!0});let d=c.length===1?st(c[0]):"INVOICE "+c.length+" \u0E09\u0E1A\u0E31\u0E1A";m.querySelector("#ivd-print").onclick=()=>K(d),i&&setTimeout(()=>K(d),60)}export{Z as a,et as b,st as c,mt as d,ft as e};
