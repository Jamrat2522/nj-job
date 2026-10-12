import{b as g}from"./chunk-R5OJUC54.js";import{a as $}from"./chunk-YM5GFE6V.js";import{b as S}from"./chunk-VN2LTKYX.js";import"./chunk-OFOOXWUM.js";import{a as w,b as j}from"./chunk-DIH2PLYD.js";import{c as y,e as i}from"./chunk-PCFU74ZV.js";import"./chunk-QDJUJ5OS.js";var d=(t,o="")=>`<span class="jfd-fill ${o}">${t==null||t===""?"":i(String(t))}</span>`,p=(t,o="")=>`<span class="jfd-fill ${o}">${t==null||String(t).trim()===""?"-":i(String(t))}</span>`,b=t=>`<span class="jfd-box${t===!0?" on":""}"></span>`,C=t=>t!=null&&String(t).trim()!=="",L=(t,...o)=>b(t===!0||o.some(C)),N=["Nj advance","Service charge","Lift on /Lift off","Over time","Custom fee","Storage charge","Demurrage charge","Amend entry","Re-fund","Check list","Other"],J=[[["doc_exempt","\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19"],["doc_inspect","\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08"],["cargo_fcl","FCL"],["cargo_lcl","LCL"],["cargo_fz","FZ"],["cargo_fz_fz","FZ+FZ"],["doc_fee","\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21"]],[["doc_overtime","\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"],["doc_mass","\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A"],["doc_travel","\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07"],["doc_print","\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19"],["doc_labor","\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19"],["doc_ot_nj","\u0E42\u0E2D\u0E17\u0E35 NJ"]],[["doc_0409_cust","0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"],["doc_0409_nocollect","0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"]]];function k(t){let o=N.map((s,a)=>`<tr>
      <td class="c">${a+1}</td><td class="d">${i(s)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join("");return`
  <div class="print-area">
   <div class="jfd" id="jfd-paper">
    
    <div class="jfd-top">
      <div class="jfd-chk">
        
        <div class="jfd-chk-row">${[...J.flat(),["checklist_enabled","Check list"]].map(([s,a])=>`<span class="jfd-chk-it">${b(t[s])}<i>${i(a)}</i></span>`).join("")}</div>
      </div>
      
      ${(()=>{let s=(n,r)=>n==="\u0E2D\u0E37\u0E48\u0E19"&&r&&String(r).trim()?String(r).trim():n,a=String(t.agency_via==null?"":t.agency_via).split(",").map(n=>n.trim()).filter(Boolean).map(n=>s(n,t.agency_via_other)).join(", "),e=[["\u0E42\u0E2B\u0E21\u0E14",t.data_type],["\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",t.job_category],["\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19",a],["\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",s(t.permit_name,t.permit_name_other)]].filter(([,n])=>n!=null&&String(n).trim()!=="");return e.length?`<div class="jfd-meta">${e.map(([n,r])=>`<div class="jfd-meta-it"><div class="jfd-meta-k">${i(n)}</div><div class="jfd-meta-v">${i(String(r).trim())}</div></div>`).join("")}</div>`:""})()}
    </div>
    <div class="jfd-jobno">JOB NJ:${d(t.job_no,"w-jobno")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17:</span>${d(t.company_invoice,"gw")}
      <span class="lb">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E02\u0E19\u0E2F:</span>${d(t.customs_declaration_no,"gs")}</div>

    <div class="jfd-line"><span class="lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${d(y(t.release_date),"g1")}
      <span class="lb">\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:</span>${d("","g1")}</div>

    <div class="jfd-line">${b(t.cargo_fcl)}<span class="lb">FCL \u0E08\u0E33\u0E19\u0E27\u0E19:</span>${d(t.qty_container,"g2")}
      <span class="lb">\u0E15\u0E39\u0E49</span>${b(t.cargo_lcl)}<span class="lb">LCL</span>
      <span class="lb">MODE:</span>${d(t.data_type,"g1")}</div>

    <div class="jfd-line">${L(t.lift_on_wharf_flag,t.lift_on_wharf_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On/ Wharf \u0E15\u0E32\u0E21</span>${d(t.lift_on_wharf_note,"g1")}</div>
    <div class="jfd-line">${L(t.storage_charge_flag,t.storage_charge_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge \u0E15\u0E32\u0E21</span>${d(t.storage_charge_note,"g1")}</div>

    
    
    <div class="jfd-line jfd-tight"><span class="lb">\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32:</span>${p(t.import_port,"gs")}
      <span class="lb">\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19:</span>${p(String(t.agency_via==null?"":t.agency_via).split(",").map(s=>s.trim()).filter(Boolean).map(s=>s==="\u0E2D\u0E37\u0E48\u0E19"&&t.agency_via_other&&String(t.agency_via_other).trim()?String(t.agency_via_other).trim():s).join(", "),"gw")}</div>
    
    <div class="jfd-line"><span class="lb">\u0E17\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${p(String(t.release_port==null?"":t.release_port).split("|").map(s=>s.trim()).filter(Boolean).map(s=>s==="\u0E2D\u0E37\u0E48\u0E19"&&t.release_port_other&&String(t.release_port_other).trim()?String(t.release_port_other).trim():s).join(", "),"gw")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">Invoice No.:</span>${p(t.source_invoice_no,"g-inv")}
      <span class="lb">House B/L No.:</span>${p(t.house_bl_no,"g-hbl")}
      <span class="lb">Master B/L No.:</span>${p(t.master_bl_no,"g-mbl")}</div>

    

    <table class="jfd-tbl">
      <thead><tr>
        <th class="c">Item</th><th class="d">Description</th>
        <th>Nj advance</th><th>Cost Amount</th><th>Receipt Amount</th><th>Tax number</th>
      </tr></thead>
      <tbody>${o}
        <tr><td class="c"></td><td class="d">Total Amount</td>
          <td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <div class="jfd-sign">
      <div><span class="lb">Name Cs</span>${d(t.cs_name,"g1")}</div>
      <div><span class="lb">Name Shipping</span>${d("","g1")}</div>
      <div><span class="lb">Date</span>${d("","g2")}</div>
    </div>
   </div>
  </div>`}async function F(t,o){let s=[];for(let e of["SERVICE","ADVANCE"])try{let n=await S({charge:e,group:"NJ",mode:"document",filters:{q:o||""},page:1,size:10,withKpi:!1});(n&&n.rows?n.rows:[]).forEach(r=>s.push(r))}catch{}t.querySelector("#jfd-list").innerHTML=s.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>Customer Job No.</th><th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th>
      </tr></thead><tbody>${s.map(e=>`<tr data-job="${i(e.id)}">
        <td class="t-b">${i(e.job_no||"")}</td><td>${i(e.customer_name||"")}</td>
        <td>${i(e.customer_job_no||"")}</td><td>${i(e.customs_declaration_no||"")}</td>
      </tr>`).join("")}</tbody></table></div>`:'<p class="t-sm t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02</p>';let a=t.querySelector("#jfd-list tbody");a&&(a.closest("table").classList.add("rowclick"),a.addEventListener("click",e=>{let n=e.target.closest("tr[data-job]");n&&(location.hash="#/job-form/"+n.dataset.job)}))}async function P(t,{id:o}={}){if(!o){t.innerHTML=`
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>DOCUMENT \u2014 Job Form</h2></div></div>
      <div class="ch-panel">
        <div class="fbar">
          <input class="inp" id="jfd-q" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Customer Job No.">
          <button class="btn btn-o btn-sm" id="jfd-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        </div>
        <div id="jfd-list"><p class="t-sm t-3 p-2">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026</p></div>
      </div>`;let a=()=>F(t,t.querySelector("#jfd-q").value.trim()).catch($);t.querySelector("#jfd-go").onclick=a,t.querySelector("#jfd-q").addEventListener("keydown",e=>{e.key==="Enter"&&a()}),await a();return}let s=await g(o);t.innerHTML=`
    <div class="page-head jfd-bar"><div class="page-title"><span class="dot"></span>
      <h2>Job Form \u2014 ${i(s.job_no||"")}</h2></div>
      <div class="row">
        <button class="btn btn-o" id="jfd-pdf">\u{1F4BE} Save PDF</button>
        <button class="btn btn-print" id="jfd-print">\u{1F5A8} Print</button>
        <button class="btn btn-o" id="jfd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    ${k(s)}`,t.querySelector("#jfd-back").onclick=()=>history.back(),t.querySelector("#jfd-print").onclick=()=>window.print(),t.querySelector("#jfd-pdf").onclick=()=>{let a=document.title;document.title="JOB-NJ_"+(s.job_no||"JOB");let e=()=>{document.title=a,window.removeEventListener("afterprint",e)};window.addEventListener("afterprint",e),window.print(),e()}}function H({availW:t,availH:o,paperW:s,paperH:a}){let e=[t,o,s,a].map(Number);return e.some(n=>!Number.isFinite(n)||n<=0)?1:Math.min(e[0]/e[2],e[1]/e[3],1)}async function x({id:t,data:o,onBack:s}={}){if(!t&&!o)throw new Error("NJACC_JOB_ID_REQUIRED");let a=o||await g(t),e=document.createElement("div");e.innerHTML=`<div class="jfd-stage"><div class="jfd-scale">${k(a)}</div></div>`;let n=document.createElement("div");n.innerHTML=`<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-print" id="jfp-print">\u{1F5A8} Print</button>
      <button class="btn btn-p" id="jfp-pdf">\u{1F4BE} Save PDF</button>
      <button class="btn btn-o" id="jfp-back">\u2715 \u0E01\u0E25\u0E31\u0E1A</button>
    </div>`,w({title:"Print Preview \u2014 Job Form "+(a.job_no||""),body:e,footer:n,fullscreen:!0,wide:!0,cls:"jfd-modal"});let r=e.querySelector(".jfd-stage"),h=e.querySelector(".jfd-scale"),u=()=>{let c=document.getElementById("nj-modal"),l=e.querySelector(".jfd");if(!c||!r||!h||!l)return;let f=1;if(window.innerWidth>1100){let m=window.getComputedStyle(c),E=(parseFloat(m.paddingLeft)||0)+(parseFloat(m.paddingRight)||0),q=(parseFloat(m.paddingTop)||0)+(parseFloat(m.paddingBottom)||0),_=c.querySelector(".modal-f");f=H({availW:c.clientWidth-E,availH:c.clientHeight-q-(_?_.offsetHeight:0),paperW:l.offsetWidth,paperH:l.offsetHeight})}h.style.setProperty("--jfd-k",String(f)),r.style.setProperty("--jfd-sw",Math.ceil(l.offsetWidth*f)+"px"),r.style.setProperty("--jfd-sh",Math.ceil(l.offsetHeight*f)+"px")},v=()=>{if(!document.body.contains(r)){window.removeEventListener("resize",v);return}u()};return u(),window.addEventListener("resize",v),n.querySelector("#jfp-print").onclick=()=>window.print(),n.querySelector("#jfp-pdf").onclick=()=>{let c=document.title;document.title="JOB-NJ_"+(a.job_no||"JOB");let l=()=>{document.title=c,window.removeEventListener("afterprint",l)};window.addEventListener("afterprint",l),window.print(),l()},n.querySelector("#jfp-back").onclick=()=>{window.removeEventListener("resize",v),j(),typeof s=="function"&&s()},e}export{k as docHTML,H as jfdFitScale,x as openJobFormPreview,P as render};
