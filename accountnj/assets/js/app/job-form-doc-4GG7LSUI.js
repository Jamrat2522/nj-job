import{b as v}from"./chunk-IJSSVG6P.js";import{a as w}from"./chunk-YM5GFE6V.js";import{b as S}from"./chunk-AFTQYZPU.js";import"./chunk-OFOOXWUM.js";import{a as $,b as y}from"./chunk-DIH2PLYD.js";import{c as j,e as d}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";var i=(t,n="")=>`<span class="jfd-fill ${n}">${t==null||t===""?"":d(String(t))}</span>`,b=(t,n="")=>`<span class="jfd-fill ${n}">${t==null||String(t).trim()===""?"-":d(String(t))}</span>`,u=t=>`<span class="jfd-box${t===!0?" on":""}"></span>`,C=t=>t!=null&&String(t).trim()!=="",L=(t,...n)=>u(t===!0||n.some(C)),N=["Nj advance","Service charge","Lift on /Lift off","Over time","Custom fee","Storage charge","Demurrage charge","Amend entry","Re-fund","Check list","Other"],J=[[["doc_exempt","\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19"],["doc_inspect","\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08"],["cargo_fcl","FCL"],["cargo_lcl","LCL"],["cargo_fz","FZ"],["cargo_fz_fz","FZ+FZ"],["doc_fee","\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21"]],[["doc_overtime","\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"],["doc_mass","\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A"],["doc_travel","\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07"],["doc_print","\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19"],["doc_labor","\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19"],["doc_ot_nj","\u0E42\u0E2D\u0E17\u0E35 NJ"]],[["doc_0409_cust","0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"],["doc_0409_nocollect","0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"]]];function E(t){let n=N.map((o,s)=>`<tr>
      <td class="c">${s+1}</td><td class="d">${d(o)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join("");return`
  <div class="print-area">
   <div class="jfd" id="jfd-paper">
    
    <div class="jfd-top">
      <div class="jfd-chk">
        ${J.map(o=>`<div class="jfd-chk-row">${o.map(([s,e])=>`<span class="jfd-chk-it">${u(t[s])}<i>${d(e)}</i></span>`).join("")}</div>`).join("")}
      </div>
    </div>
    <div class="jfd-jobno">JOB NJ:${i(t.job_no,"w-jobno")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17:</span>${i(t.company_invoice,"gw")}
      <span class="lb">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E02\u0E19\u0E2F:</span>${i(t.customs_declaration_no,"gs")}</div>

    <div class="jfd-line"><span class="lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${i(j(t.release_date),"g1")}
      <span class="lb">\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:</span>${i("","g1")}</div>

    <div class="jfd-line">${u(t.cargo_fcl)}<span class="lb">FCL \u0E08\u0E33\u0E19\u0E27\u0E19:</span>${i(t.qty_container,"g2")}
      <span class="lb">\u0E15\u0E39\u0E49</span>${u(t.cargo_lcl)}<span class="lb">LCL</span>
      <span class="lb">MODE:</span>${i(t.data_type,"g1")}</div>

    <div class="jfd-line">${L(t.lift_on_wharf_flag,t.lift_on_wharf_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On/ Wharf \u0E15\u0E32\u0E21</span>${i(t.lift_on_wharf_note,"g1")}</div>
    <div class="jfd-line">${L(t.storage_charge_flag,t.storage_charge_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge \u0E15\u0E32\u0E21</span>${i(t.storage_charge_note,"g1")}</div>

    
    <div class="jfd-line"><span class="lb">\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32:</span>${b(t.import_port,"gw")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">Invoice No.:</span>${b(t.source_invoice_no,"g-inv")}
      <span class="lb">House B/L No.:</span>${b(t.house_bl_no,"g-hbl")}
      <span class="lb">Master B/L No.:</span>${b(t.master_bl_no,"g-mbl")}</div>

    
    <div class="jfd-line"><span class="lb">\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25:</span>${i(t.customer_name,"gw")}
      <span class="lb">Customer Job No.:</span>${i(t.customer_job_no,"gs")}</div>

    <table class="jfd-tbl">
      <thead><tr>
        <th class="c">Item</th><th class="d">Description</th>
        <th>Nj advance</th><th>Cost Amount</th><th>Receipt Amount</th><th>Tax number</th>
      </tr></thead>
      <tbody>${n}
        <tr><td class="c"></td><td class="d">Total Amount</td>
          <td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <div class="jfd-sign">
      <div><span class="lb">Name Cs</span>${i(t.cs_name,"g1")}</div>
      <div><span class="lb">Name Shipping</span>${i("","g1")}</div>
      <div><span class="lb">Date</span>${i("","g2")}</div>
    </div>
   </div>
  </div>`}async function F(t,n){let o=[];for(let e of["SERVICE","ADVANCE"])try{let a=await S({charge:e,group:"NJ",mode:"document",filters:{q:n||""},page:1,size:10,withKpi:!1});(a&&a.rows?a.rows:[]).forEach(l=>o.push(l))}catch{}t.querySelector("#jfd-list").innerHTML=o.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>Customer Job No.</th><th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th>
      </tr></thead><tbody>${o.map(e=>`<tr data-job="${d(e.id)}">
        <td class="t-b">${d(e.job_no||"")}</td><td>${d(e.customer_name||"")}</td>
        <td>${d(e.customer_job_no||"")}</td><td>${d(e.customs_declaration_no||"")}</td>
      </tr>`).join("")}</tbody></table></div>`:'<p class="t-sm t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02</p>';let s=t.querySelector("#jfd-list tbody");s&&(s.closest("table").classList.add("rowclick"),s.addEventListener("click",e=>{let a=e.target.closest("tr[data-job]");a&&(location.hash="#/job-form/"+a.dataset.job)}))}async function B(t,{id:n}={}){if(!n){t.innerHTML=`
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>DOCUMENT \u2014 Job Form</h2></div></div>
      <div class="ch-panel">
        <div class="fbar">
          <input class="inp" id="jfd-q" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Customer Job No.">
          <button class="btn btn-o btn-sm" id="jfd-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        </div>
        <div id="jfd-list"><p class="t-sm t-3 p-2">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026</p></div>
      </div>`;let s=()=>F(t,t.querySelector("#jfd-q").value.trim()).catch(w);t.querySelector("#jfd-go").onclick=s,t.querySelector("#jfd-q").addEventListener("keydown",e=>{e.key==="Enter"&&s()}),await s();return}let o=await v(n);t.innerHTML=`
    <div class="page-head jfd-bar"><div class="page-title"><span class="dot"></span>
      <h2>Job Form \u2014 ${d(o.job_no||"")}</h2></div>
      <div class="row">
        <button class="btn btn-o" id="jfd-pdf">\u{1F4BE} Save PDF</button>
        <button class="btn btn-print" id="jfd-print">\u{1F5A8} Print</button>
        <button class="btn btn-o" id="jfd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    ${E(o)}`,t.querySelector("#jfd-back").onclick=()=>history.back(),t.querySelector("#jfd-print").onclick=()=>window.print(),t.querySelector("#jfd-pdf").onclick=()=>{let s=document.title;document.title="JOB-NJ_"+(o.job_no||"JOB");let e=()=>{document.title=s,window.removeEventListener("afterprint",e)};window.addEventListener("afterprint",e),window.print(),e()}}function H({availW:t,availH:n,paperW:o,paperH:s}){let e=[t,n,o,s].map(Number);return e.some(a=>!Number.isFinite(a)||a<=0)?1:Math.min(e[0]/e[2],e[1]/e[3],1)}async function P({id:t,data:n,onBack:o}={}){if(!t&&!n)throw new Error("NJACC_JOB_ID_REQUIRED");let s=n||await v(t),e=document.createElement("div");e.innerHTML=`<div class="jfd-stage"><div class="jfd-scale">${E(s)}</div></div>`;let a=document.createElement("div");a.innerHTML=`<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-print" id="jfp-print">\u{1F5A8} Print</button>
      <button class="btn btn-p" id="jfp-pdf">\u{1F4BE} Save PDF</button>
      <button class="btn btn-o" id="jfp-back">\u2715 \u0E01\u0E25\u0E31\u0E1A</button>
    </div>`,$({title:"Print Preview \u2014 Job Form "+(s.job_no||""),body:e,footer:a,fullscreen:!0,wide:!0,cls:"jfd-modal"});let l=e.querySelector(".jfd-stage"),h=e.querySelector(".jfd-scale"),g=()=>{let r=document.getElementById("nj-modal"),c=e.querySelector(".jfd");if(!r||!l||!h||!c)return;let p=1;if(window.innerWidth>1100){let f=window.getComputedStyle(r),k=(parseFloat(f.paddingLeft)||0)+(parseFloat(f.paddingRight)||0),q=(parseFloat(f.paddingTop)||0)+(parseFloat(f.paddingBottom)||0),_=r.querySelector(".modal-f");p=H({availW:r.clientWidth-k,availH:r.clientHeight-q-(_?_.offsetHeight:0),paperW:c.offsetWidth,paperH:c.offsetHeight})}h.style.setProperty("--jfd-k",String(p)),l.style.setProperty("--jfd-sw",Math.ceil(c.offsetWidth*p)+"px"),l.style.setProperty("--jfd-sh",Math.ceil(c.offsetHeight*p)+"px")},m=()=>{if(!document.body.contains(l)){window.removeEventListener("resize",m);return}g()};return g(),window.addEventListener("resize",m),a.querySelector("#jfp-print").onclick=()=>window.print(),a.querySelector("#jfp-pdf").onclick=()=>{let r=document.title;document.title="JOB-NJ_"+(s.job_no||"JOB");let c=()=>{document.title=r,window.removeEventListener("afterprint",c)};window.addEventListener("afterprint",c),window.print(),c()},a.querySelector("#jfp-back").onclick=()=>{window.removeEventListener("resize",m),y(),typeof o=="function"&&o()},e}export{E as docHTML,H as jfdFitScale,P as openJobFormPreview,B as render};
