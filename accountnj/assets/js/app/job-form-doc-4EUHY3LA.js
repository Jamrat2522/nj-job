import{b as u}from"./chunk-VS5POHCJ.js";import{a as j}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import{a as w,b as y}from"./chunk-LNP7HEMP.js";import{c as $,e as i}from"./chunk-NQOCXXA2.js";import{b as S}from"./chunk-ACC3GWV5.js";import"./chunk-SGWIBJH6.js";var r=(t,a="")=>`<span class="jfd-fill ${a}">${t==null||t===""?"":i(String(t))}</span>`,p=(t,a="")=>`<span class="jfd-fill ${a}">${t==null||String(t).trim()===""?"-":i(String(t))}</span>`,m=t=>`<span class="jfd-box${t===!0?" on":""}"></span>`,C=t=>t!=null&&String(t).trim()!=="",L=(t,...a)=>m(t===!0||a.some(C)),N=["Nj advance","Service charge","Lift on /Lift off","Over time","Custom fee","Storage charge","Demurrage charge","Amend entry","Re-fund","Check list","Other"],J=[[["doc_exempt","\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19"],["doc_inspect","\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08"],["cargo_fcl","FCL"],["cargo_lcl","LCL"],["cargo_fz","FZ"],["cargo_fz_fz","FZ+FZ"],["doc_fee","\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21"]],[["doc_overtime","\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"],["doc_mass","\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A"],["doc_travel","\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07"],["doc_print","\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19"],["doc_labor","\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19"],["doc_ot_nj","\u0E42\u0E2D\u0E17\u0E35 NJ"]],[["doc_0409_cust","0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"],["doc_0409_nocollect","0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"]]];function k(t){let a=N.map((n,o)=>`<tr>
      <td class="c">${o+1}</td><td class="d">${i(n)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join("");return`
  <div class="print-area">
   <div class="jfd" id="jfd-paper">
    
    <div class="jfd-top">
      <div class="jfd-chk">
        
        <div class="jfd-chk-row">${[...J.flat(),["checklist_enabled","Check list"]].map(([n,o])=>`<span class="jfd-chk-it">${m(t[n])}<i>${i(o)}</i></span>`).join("")}</div>
      </div>
      
      ${(()=>{let n=(s,d)=>s==="\u0E2D\u0E37\u0E48\u0E19"&&d&&String(d).trim()?String(d).trim():s,o=String(t.agency_via==null?"":t.agency_via).split(",").map(s=>s.trim()).filter(Boolean).map(s=>n(s,t.agency_via_other)).join(", "),e=[["\u0E42\u0E2B\u0E21\u0E14",t.data_type],["\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",t.job_category],["\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19",o],["\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",n(t.permit_name,t.permit_name_other)]].filter(([,s])=>s!=null&&String(s).trim()!=="");return e.length?`<div class="jfd-meta">${e.map(([s,d])=>`<div class="jfd-meta-it"><div class="jfd-meta-k">${i(s)}</div><div class="jfd-meta-v">${i(String(d).trim())}</div></div>`).join("")}</div>`:""})()}
    </div>
    <div class="jfd-jobno">JOB NJ:${r(t.job_no,"w-jobno")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17:</span>${r(t.company_invoice,"gw")}
      <span class="lb">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E02\u0E19\u0E2F:</span>${r(t.customs_declaration_no,"gs")}</div>

    <div class="jfd-line"><span class="lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${r($(t.release_date),"g1")}
      <span class="lb">\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:</span>${r("","g1")}</div>

    <div class="jfd-line">${m(t.cargo_fcl)}<span class="lb">FCL \u0E08\u0E33\u0E19\u0E27\u0E19:</span>${r(t.qty_container,"g2")}
      <span class="lb">\u0E15\u0E39\u0E49</span>${m(t.cargo_lcl)}<span class="lb">LCL</span>
      <span class="lb">MODE:</span>${r(t.data_type,"g1")}</div>

    
    <div class="jfd-line">${L(t.lift_on_wharf_flag,t.lift_on_wharf_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf \u0E40\u0E1B\u0E47\u0E19:</span>${r(t.lift_on_wharf_note,"g1")}</div>
    <div class="jfd-line">${L(t.storage_charge_flag,t.storage_charge_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge \u0E40\u0E1B\u0E47\u0E19:</span>${r(t.storage_charge_note,"g1")}</div>

    
    
    <div class="jfd-line"><span class="lb">\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32:</span>${p(t.import_port,"gw")}</div>
    
    <div class="jfd-line"><span class="lb">\u0E17\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${p(String(t.release_port==null?"":t.release_port).split("|").map(n=>n.trim()).filter(Boolean).map(n=>n==="\u0E2D\u0E37\u0E48\u0E19"&&t.release_port_other&&String(t.release_port_other).trim()?String(t.release_port_other).trim():n).join(", "),"gw")}</div>

    
    <div class="jfd-line jfd-tight"><span class="lb">Invoice No.:</span>${p(t.source_invoice_no,"g-inv")}
      <span class="lb">House B/L No.:</span>${p(t.house_bl_no,"g-hbl")}
      <span class="lb">Master B/L No.:</span>${p(t.master_bl_no,"g-mbl")}</div>

    

    <table class="jfd-tbl">
      <thead><tr>
        <th class="c">Item</th><th class="d">Description</th>
        <th>Nj advance</th><th>Cost Amount</th><th>Receipt Amount</th><th>Tax number</th>
      </tr></thead>
      <tbody>${a}
        <tr><td class="c"></td><td class="d">Total Amount</td>
          <td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <div class="jfd-sign">
      <div><span class="lb">Name Cs</span>${r(t.cs_name,"g1")}</div>
      <div><span class="lb">Name Shipping</span>${r("","g1")}</div>
      <div><span class="lb">Date</span>${r("","g2")}</div>
    </div>
   </div>
  </div>`}async function F(t,a){let n=[];for(let e of["SERVICE","ADVANCE"])try{let s=await S({charge:e,group:"NJ",mode:"document",filters:{q:a||""},page:1,size:10,withKpi:!1});(s&&s.rows?s.rows:[]).forEach(d=>n.push(d))}catch{}t.querySelector("#jfd-list").innerHTML=n.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>Customer Job No.</th><th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th>
      </tr></thead><tbody>${n.map(e=>`<tr data-job="${i(e.id)}">
        <td class="t-b">${i(e.job_no||"")}</td><td>${i(e.customer_name||"")}</td>
        <td>${i(e.customer_job_no||"")}</td><td>${i(e.customs_declaration_no||"")}</td>
      </tr>`).join("")}</tbody></table></div>`:'<p class="t-sm t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02</p>';let o=t.querySelector("#jfd-list tbody");o&&(o.closest("table").classList.add("rowclick"),o.addEventListener("click",e=>{let s=e.target.closest("tr[data-job]");s&&(location.hash="#/job-form/"+s.dataset.job)}))}async function x(t,{id:a}={}){if(!a){t.innerHTML=`
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>DOCUMENT \u2014 Job Form</h2></div></div>
      <div class="ch-panel">
        <div class="fbar">
          <input class="inp" id="jfd-q" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Customer Job No.">
          <button class="btn btn-o btn-sm" id="jfd-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        </div>
        <div id="jfd-list"><p class="t-sm t-3 p-2">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026</p></div>
      </div>`;let o=()=>F(t,t.querySelector("#jfd-q").value.trim()).catch(j);t.querySelector("#jfd-go").onclick=o,t.querySelector("#jfd-q").addEventListener("keydown",e=>{e.key==="Enter"&&o()}),await o();return}let n=await u(a);t.innerHTML=`
    <div class="page-head jfd-bar"><div class="page-title"><span class="dot"></span>
      <h2>Job Form \u2014 ${i(n.job_no||"")}</h2></div>
      <div class="row">
        <button class="btn btn-o" id="jfd-pdf">\u{1F4BE} Save PDF</button>
        <button class="btn btn-print" id="jfd-print">\u{1F5A8} Print</button>
        <button class="btn btn-o" id="jfd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    ${k(n)}`,t.querySelector("#jfd-back").onclick=()=>history.back(),t.querySelector("#jfd-print").onclick=()=>window.print(),t.querySelector("#jfd-pdf").onclick=()=>{let o=document.title;document.title="JOB-NJ_"+(n.job_no||"JOB");let e=()=>{document.title=o,window.removeEventListener("afterprint",e)};window.addEventListener("afterprint",e),window.print(),e()}}function H({availW:t,availH:a,paperW:n,paperH:o}){let e=[t,a,n,o].map(Number);return e.some(s=>!Number.isFinite(s)||s<=0)?1:Math.min(e[0]/e[2],e[1]/e[3],1)}async function P({id:t,data:a,onBack:n}={}){if(!t&&!a)throw new Error("NJACC_JOB_ID_REQUIRED");let o=a||await u(t),e=document.createElement("div");e.innerHTML=`<div class="jfd-stage"><div class="jfd-scale">${k(o)}</div></div>`;let s=document.createElement("div");s.innerHTML=`<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-print" id="jfp-print">\u{1F5A8} Print</button>
      <button class="btn btn-p" id="jfp-pdf">\u{1F4BE} Save PDF</button>
      <button class="btn btn-o" id="jfp-back">\u2715 \u0E01\u0E25\u0E31\u0E1A</button>
    </div>`,w({title:"Print Preview \u2014 Job Form "+(o.job_no||""),body:e,footer:s,fullscreen:!0,wide:!0,cls:"jfd-modal"});let d=e.querySelector(".jfd-stage"),h=e.querySelector(".jfd-scale"),g=()=>{let c=document.getElementById("nj-modal"),l=e.querySelector(".jfd");if(!c||!d||!h||!l)return;let f=1;if(window.innerWidth>1100){let b=window.getComputedStyle(c),E=(parseFloat(b.paddingLeft)||0)+(parseFloat(b.paddingRight)||0),q=(parseFloat(b.paddingTop)||0)+(parseFloat(b.paddingBottom)||0),_=c.querySelector(".modal-f");f=H({availW:c.clientWidth-E,availH:c.clientHeight-q-(_?_.offsetHeight:0),paperW:l.offsetWidth,paperH:l.offsetHeight})}h.style.setProperty("--jfd-k",String(f)),d.style.setProperty("--jfd-sw",Math.ceil(l.offsetWidth*f)+"px"),d.style.setProperty("--jfd-sh",Math.ceil(l.offsetHeight*f)+"px")},v=()=>{if(!document.body.contains(d)){window.removeEventListener("resize",v);return}g()};return g(),window.addEventListener("resize",v),s.querySelector("#jfp-print").onclick=()=>window.print(),s.querySelector("#jfp-pdf").onclick=()=>{let c=document.title;document.title="JOB-NJ_"+(o.job_no||"JOB");let l=()=>{document.title=c,window.removeEventListener("afterprint",l)};window.addEventListener("afterprint",l),window.print(),l()},s.querySelector("#jfp-back").onclick=()=>{window.removeEventListener("resize",v),y(),typeof n=="function"&&n()},e}export{k as docHTML,H as jfdFitScale,P as openJobFormPreview,x as render};
