import{a as S}from"./chunk-VQPECVBX.js";import{b as h}from"./chunk-P7KS5G2M.js";import{a as $}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-37ELUCVE.js";import{a as y,b as j}from"./chunk-ZRPMDTDS.js";import{c as m,e as c}from"./chunk-PCFU74ZV.js";var n=(t,a="")=>`<span class="jfd-fill ${a}">${t==null||t===""?"":c(String(t))}</span>`,d=t=>`<span class="jfd-box${t===!0?" on":""}"></span>`,q=t=>t!=null&&String(t).trim()!=="",b=(t,...a)=>d(t===!0||a.some(q)),C=["Nj advance","Service charge","Lift on /Lift off","Over time","Custom fee","Storage charge","Demurrage charge","Amend entry","Re-fund","Check list","Other"];function k(t){let a=C.map((i,s)=>`<tr>
      <td class="c">${s+1}</td><td class="d">${c(i)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join("");return`
  <div class="print-area">
   <div class="jfd" id="jfd-paper">
    <div class="jfd-top">
      <div class="jfd-jobno">JOB NJ:${n(t.job_no,"w-jobno")}</div>
      <div class="jfd-chk">
        <div class="jfd-chk-r1">${d(t.doc_exempt)}<span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span>${d(t.doc_inspect)}<span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span>${d(t.doc_fee)}<span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></div>
        <div class="jfd-chk-r2">
          <div>${d(t.cargo_fcl)}<i>FCL</i></div><div>${d(t.cargo_lcl)}<i>LCL</i></div>
          <div>${d(t.cargo_fz)}<i>FZ</i></div><div>${d(t.cargo_fz_fz)}<i>FZ+FZ</i></div>
        </div>
      </div>
    </div>

    <div class="jfd-line"><span class="lb">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17:</span>${n(t.customer_name,"gw")}
      <span class="lb">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E02\u0E19\u0E2F:</span>${n(t.customs_declaration_no,"gs")}</div>

    <div class="jfd-line"><span class="lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22:</span>${n(m(t.release_date),"g1")}
      <span class="lb">\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:</span>${n("","g1")}</div>

    <div class="jfd-line">${d(t.cargo_fcl)}<span class="lb">FCL \u0E08\u0E33\u0E19\u0E27\u0E19:</span>${n(t.qty_container,"g2")}
      <span class="lb">\u0E15\u0E39\u0E49</span>${d(t.cargo_lcl)}<span class="lb">LCL</span>
      <span class="lb">MODE:</span>${n(t.data_type,"g1")}</div>

    <div class="jfd-line">${b(t.lift_on_wharf_flag,t.lift_on_wharf_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On/ Wharf \u0E15\u0E32\u0E21</span>${n(t.lift_on_wharf_note,"g1")}</div>
    <div class="jfd-line">${b(t.storage_charge_flag,t.storage_charge_note)}<span class="lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge \u0E15\u0E32\u0E21</span>${n(t.storage_charge_note,"g1")}</div>

    <div class="jfd-line">${b(t.overtime_flag,t.overtime_date,t.overtime_slot_1===!0?"1":"",t.overtime_slot_2===!0?"1":"",t.overtime_slot_3===!0?"1":"")}<span class="lb">\u0E02\u0E2D\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</span>${n(m(t.overtime_date),"g2")}
      <span class="lb">\u0E40\u0E27\u0E25\u0E32</span>${d(t.overtime_slot_1)}<i>08.30-16.30</i>${d(t.overtime_slot_2)}<i>16.30-24.00</i>${d(t.overtime_slot_3)}<i>24.00-08.00</i></div>

    <div class="jfd-line">${b(t.truck_card_flag,t.truck_card_no)}<span class="lb">\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2B\u0E31\u0E27\u0E25\u0E32\u0E01</span>${n(t.truck_card_no,"g1")}
      <span class="lb">\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E17\u0E23</span>${n(t.truck_card_contact,"g1")}</div>

    <div class="jfd-line"><span class="lb">\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25:</span>${n(t.company_invoice,"gw")}
      <span class="lb">Customer Job No.:</span>${n(t.customer_job_no,"gs")}</div>

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
      <div><span class="lb">Name Cs</span>${n(t.cs_name,"g1")}</div>
      <div><span class="lb">Name Shipping</span>${n("","g1")}</div>
      <div><span class="lb">Date</span>${n("","g2")}</div>
    </div>
   </div>
  </div>`}async function J(t,a){let i=[];for(let e of["SERVICE","ADVANCE"])try{let o=await S({charge:e,group:"NJ",mode:"document",filters:{q:a||""},page:1,size:10,withKpi:!1});(o&&o.rows?o.rows:[]).forEach(p=>i.push(p))}catch{}t.querySelector("#jfd-list").innerHTML=i.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>Customer Job No.</th><th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</th>
      </tr></thead><tbody>${i.map(e=>`<tr data-job="${c(e.id)}">
        <td class="t-b">${c(e.job_no||"")}</td><td>${c(e.customer_name||"")}</td>
        <td>${c(e.customer_job_no||"")}</td><td>${c(e.customs_declaration_no||"")}</td>
      </tr>`).join("")}</tbody></table></div>`:'<p class="t-sm t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02</p>';let s=t.querySelector("#jfd-list tbody");s&&(s.closest("table").classList.add("rowclick"),s.addEventListener("click",e=>{let o=e.target.closest("tr[data-job]");o&&(location.hash="#/job-form/"+o.dataset.job)}))}async function D(t,{id:a}={}){if(!a){t.innerHTML=`
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>DOCUMENT \u2014 Job Form</h2></div></div>
      <div class="ch-panel">
        <div class="fbar">
          <input class="inp" id="jfd-q" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Customer Job No.">
          <button class="btn btn-o btn-sm" id="jfd-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        </div>
        <div id="jfd-list"><p class="t-sm t-3 p-2">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026</p></div>
      </div>`;let s=()=>J(t,t.querySelector("#jfd-q").value.trim()).catch($);t.querySelector("#jfd-go").onclick=s,t.querySelector("#jfd-q").addEventListener("keydown",e=>{e.key==="Enter"&&s()}),await s();return}let i=await h(a);t.innerHTML=`
    <div class="page-head jfd-bar"><div class="page-title"><span class="dot"></span>
      <h2>Job Form \u2014 ${c(i.job_no||"")}</h2></div>
      <div class="row">
        <button class="btn btn-o" id="jfd-pdf">\u{1F4BE} Save PDF</button>
        <button class="btn btn-print" id="jfd-print">\u{1F5A8} Print</button>
        <button class="btn btn-o" id="jfd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    ${k(i)}`,t.querySelector("#jfd-back").onclick=()=>history.back(),t.querySelector("#jfd-print").onclick=()=>window.print(),t.querySelector("#jfd-pdf").onclick=()=>{let s=document.title;document.title="JOB-NJ_"+(i.job_no||"JOB");let e=()=>{document.title=s,window.removeEventListener("afterprint",e)};window.addEventListener("afterprint",e),window.print(),e()}}function F({availW:t,availH:a,paperW:i,paperH:s}){let e=[t,a,i,s].map(Number);return e.some(o=>!Number.isFinite(o)||o<=0)?1:Math.min(e[0]/e[2],e[1]/e[3],1)}async function T({id:t,data:a,onBack:i}={}){if(!t&&!a)throw new Error("NJACC_JOB_ID_REQUIRED");let s=a||await h(t),e=document.createElement("div");e.innerHTML=`<div class="jfd-stage"><div class="jfd-scale">${k(s)}</div></div>`;let o=document.createElement("div");o.innerHTML=`<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-print" id="jfp-print">\u{1F5A8} Print</button>
      <button class="btn btn-p" id="jfp-pdf">\u{1F4BE} Save PDF</button>
      <button class="btn btn-o" id="jfp-back">\u2715 \u0E01\u0E25\u0E31\u0E1A</button>
    </div>`,y({title:"Print Preview \u2014 Job Form "+(s.job_no||""),body:e,footer:o,fullscreen:!0,wide:!0,cls:"jfd-modal"});let p=e.querySelector(".jfd-stage"),_=e.querySelector(".jfd-scale"),g=()=>{let l=document.getElementById("nj-modal"),r=e.querySelector(".jfd");if(!l||!p||!_||!r)return;let f=1;if(window.innerWidth>1100){let v=window.getComputedStyle(l),L=(parseFloat(v.paddingLeft)||0)+(parseFloat(v.paddingRight)||0),E=(parseFloat(v.paddingTop)||0)+(parseFloat(v.paddingBottom)||0),w=l.querySelector(".modal-f");f=F({availW:l.clientWidth-L,availH:l.clientHeight-E-(w?w.offsetHeight:0),paperW:r.offsetWidth,paperH:r.offsetHeight})}_.style.setProperty("--jfd-k",String(f)),p.style.setProperty("--jfd-sw",Math.ceil(r.offsetWidth*f)+"px"),p.style.setProperty("--jfd-sh",Math.ceil(r.offsetHeight*f)+"px")},u=()=>{if(!document.body.contains(p)){window.removeEventListener("resize",u);return}g()};return g(),window.addEventListener("resize",u),o.querySelector("#jfp-print").onclick=()=>window.print(),o.querySelector("#jfp-pdf").onclick=()=>{let l=document.title;document.title="JOB-NJ_"+(s.job_no||"JOB");let r=()=>{document.title=l,window.removeEventListener("afterprint",r)};window.addEventListener("afterprint",r),window.print(),r()},o.querySelector("#jfp-back").onclick=()=>{window.removeEventListener("resize",u),j(),typeof i=="function"&&i()},e}export{k as docHTML,F as jfdFitScale,T as openJobFormPreview,D as render};
