import{a as $}from"./chunk-UWAYW6DC.js";import{a as C}from"./chunk-ZRPMDTDS.js";import{a as b,c as S,e as p}from"./chunk-PCFU74ZV.js";var x=s=>s==null||s===""||Number(s)===0?"-":b(s),v=(s,t="-")=>{let d=s==null?"":String(s).trim();return p(d||t)},u=s=>{let t=Number(s);return Number.isFinite(t)?t:0},_=s=>Math.round((u(s)+Number.EPSILON)*100)/100,R={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',tax:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',job:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',sum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'},f=s=>`<span class="ivd-ic">${R[s]||""}</span>`;function P(s,t){let d=0,i=0;for(let n of t)u(n.vat_amount)>0||u(n.vat_rate)>0?d=_(d+u(n.amount)):i=_(i+u(n.amount));let o=_(s.vat_amount),c=[...new Set(t.map(n=>u(n.vat_rate)).filter(n=>n>0))],a=c.length===1?c[0]:u(s.vat_rate)||7,h=_(d+o);return{vatBase:d,nonVat:i,vat:o,vatRate:a,total:h,grand:_(h+i)}}function O(s){let t=new Map;for(let i of s){let o=u(i.wht_rate);o<=0||t.set(o,_((t.get(o)||0)+u(i.wht_amount)))}let d=[{rate:1,label:"Transportation",amt:t.get(1)||0},{rate:3,label:"Service",amt:t.get(3)||0}];for(let[i,o]of[...t.entries()].sort((c,a)=>c[0]-a[0]))i!==1&&i!==3&&d.push({rate:i,label:"Other",amt:o});return d}function F(s,{draft:t=!1,kind:d="",tpl:i=null,job:o=null}={}){let c=s.items||[],a=P(s,c),n=String(d).toUpperCase()==="SERVICE",l=e=>n?String(e).replace(/\s*:\s*$/,"")+" :":e,M=s.customer||{},g=s.job||{},r={cusName:s.customer_name||M.name,cusTax:s.customer_tax_id||M.tax_id,cusBranch:s.customer_branch_code||M.branch_code,cusAddr:s.customer_address||M.address,cusTel:s.customer_phone||M.phone,invNo:t&&s.has_real_no===!1?null:s.invoice_no,invDate:s.invoice_date,jobNo:s.job_no||g.job_no,declNo:s.customs_declaration_no||g.customs_declaration_no,cusPo:s.customer_job_no||g.customer_job_no,master:s.master_bl_no||g.master_bl_no,house:s.house_bl_no||g.house_bl_no,remarks:s.remarks||s.job_note||g.note,companyInvoice:s.company_invoice,createdBy:s.created_by_name||s.issued_by_name},D=c.map((e,w)=>{let m=u(e.vat_amount)<=0&&u(e.vat_rate)<=0,y=u(e.amount);return`<tr>
      <!-- \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C No. \u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Final \u0E15\u0E32\u0E21\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49
           line_no \u0E22\u0E31\u0E07\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E25\u0E30\u0E43\u0E0A\u0E49\u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21 \u0E40\u0E1E\u0E35\u0E22\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E25\u0E07\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29 -->
      <td class="ivd-desc">${v(e.description,"")}</td>
      <td class="r">${m?"-":x(y)}</td>
      <td class="r">${m?x(y):"-"}</td>
      <td class="r">${x(e.unit_price)}</td>
      <td class="r">${x(y)}</td></tr>`}).join("")||'<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',I=O(c).map(e=>`<div class="ivd-wl"><span>${e.rate} % ${e.label}</span><span>${b(e.amt)}</span></div>`).join(""),L=["eta","etd","release_date","delivery_date","overtime_date","job_date"],B=e=>{if(!e)return"";for(let w of[s,g,o||{}]){if(!w)continue;let m=w[e];if(m!=null&&String(m).trim()!=="")return L.includes(e)?S(m):m}return""},T=[{label:"Decl No.",value:v(r.declNo)},{label:"Customer PO",value:v(r.cusPo)},{label:"Master",value:v(r.master)},{label:"House",value:v(r.house)}],E=["tl","tr","bl","br"],V=e=>{let m=(i&&i.fields||[]).find(y=>y&&y.key===e);return m?String(m.label||"").trim():""},j=i&&E.every(e=>i[e+"_source"])?E.map((e,w)=>({label:V(i[e+"_source"])||String(i[e+"_label"]||"").trim()||T[w].label,value:v(B(i[e+"_source"]))})):T,N=e=>`<div class="ivd-sign">
      <div class="ivd-sign-t">${e}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`;return`
    <div class="ivd print-area${t?" ivd-draft":""}">
      
      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${$.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${p($.nameEn)}</div>
            <div class="ivd-co-ad">${p($.address)}</div>
            <div class="ivd-co-tl">Tel. ${p($.tel)} <i>|</i> Fax. ${p($.fax)}
              <i>|</i> Tax ID ${p($.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r">
          ${t?'<div class="ivd-badge">DRAFT</div>':""}
          <div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            
            <div class="ivd-f">${f("user")}<div class="ivd-fb"><label>${l("Customer Name")}</label>
              <div class="v">${v(r.cusName)}</div></div></div>
            <div class="ivd-f">${f("tax")}<div class="ivd-fb ivd-2col">
              <div><label>${l("Tax ID")}</label><div class="v">${v(r.cusTax)}</div></div>
              <div><label>${l("Branch")}</label><div class="v">${v(r.cusBranch)}</div></div>
            </div></div>
            
            <div class="ivd-f ivd-f-last">${f("pin")}<div class="ivd-fb"><label>${l("Address")}</label>
              <div class="v">${v(r.cusAddr,"")}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${f("doc")}<div class="ivd-fb ivd-kv">
              <label>${l("Invoice No.")}</label><div class="v v-lg">${r.invNo?p(r.invNo):'<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${f("cal")}<div class="ivd-fb ivd-kv">
              <label>${l("Date")}</label><div class="v v-lg">${S(r.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${f("job")}<div class="ivd-fb ivd-kv">
              <label>${l("Job No.")}</label><div class="v v-lg">${v(r.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      
      <section class="ivd-ref">
        ${j.map(e=>`<div class="ivd-rf"><label>${l(e.label)}</label><span>${e.value}</span></div>`).join("")}
      </section>

      <table class="ivd-tbl">
        <colgroup><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-unit"><col class="w-tot"></colgroup>
        <thead><tr>
          
          <th>Description</th>
          <th class="r">Service</th>
          <th class="r">Advance</th>
          <th class="r">Unit Price</th><th class="r">Total Amount</th>
        </tr></thead>
        <tbody>${D}</tbody>
        <tfoot><tr class="ivd-trow">
          <td class="ivd-trow-l">${f("sum")}<b>TOTAL</b></td>
          <td class="r">${x(a.vatBase)}</td>
          <td class="r">${x(a.nonVat)}</td>
          <td></td>
          <td class="r ivd-trow-g">${b(_(a.vatBase+a.nonVat))}</td>
        </tr></tfoot>
      </table>

      
      <div class="ivd-bottom">
      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${v(r.remarks,"")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${v(r.companyInvoice,"")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${a.vatRate} %</span><span>${b(a.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${a.vatRate} %</span><span>${b(a.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${b(a.total)}</span></div>
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${b(a.nonVat)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${b(a.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${I}</div>
        ${N("For The Customer")}
        ${N("For The "+p($.nameEn))}
      </section>
      </div>

      <footer class="ivd-bar">
        <div>${f("user")}Created By : <b>${v(r.createdBy)}</b></div>
        <div>${f("print")}Printed Date : <b>${S(new Date().toISOString().slice(0,10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>
    </div>`}var k="nj-print-doc";function A(){let s=document.body;s.classList.add(k);let t=()=>s.classList.remove(k);window.addEventListener("afterprint",t,{once:!0});try{let d=window.matchMedia("print"),i=o=>{o.matches||(t(),d.removeEventListener("change",i))};d.addEventListener("change",i)}catch{}window.print()}var z=24;function H(s){let t=s.querySelector(".ivd-fit"),d=s.querySelector(".ivd-fit-in"),i=s.querySelector(".ivd");if(!t||!d||!i)return()=>{};let o=()=>{let h=((t.parentElement||t).clientWidth||0)-z,n=i.offsetWidth||0;if(h<=0||n<=0)return;let l=Math.min(1,h/n);d.style.transform=l<1?`scale(${l})`:"",t.style.height=l<1?Math.ceil(i.offsetHeight*l)+"px":"",t.dataset.scale=String(Math.round(l*1e3)/1e3)};o();let c=null;try{c=new ResizeObserver(o),c.observe(t.parentElement||t),c.observe(d)}catch{window.addEventListener("resize",o)}return()=>{try{c&&c.disconnect()}catch{}window.removeEventListener("resize",o)}}function K(s,{draft:t=!1,print:d=!1,kind:i="",tpl:o=null,job:c=null}={}){let a=document.createElement("div");a.innerHTML='<div class="ivd-fit"><div class="ivd-fit-in">'+F(s,{draft:t,kind:i,tpl:o,job:c})+"</div></div>";let h=document.createElement("div");h.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${t?"Print Draft":"Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,C({title:t?"Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49":"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",body:a,footer:h,fullscreen:!0,wide:!0});let n=H(a);h.querySelector("[data-close]").addEventListener("click",n,{once:!0}),h.querySelector("#ivd-print").onclick=()=>A(),d&&setTimeout(()=>A(),60)}export{F as a,K as b};
