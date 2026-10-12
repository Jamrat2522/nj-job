import{c as w}from"./chunk-NG45Y6KB.js";import{l as C,m as q}from"./chunk-DG2EPCMG.js";import{c as T,e as _,f as g}from"./chunk-FL6ZW7SA.js";import{e as m}from"./chunk-PCFU74ZV.js";var S=200,j=500;function I(e){let t=e;if(typeof t=="string")try{t=JSON.parse(t)}catch{t=[]}return Array.isArray(t)?t.filter(l=>l&&typeof l=="object").map(l=>({text:String(l.text==null?"":l.text).slice(0,j),done:l.done===!0})).slice(0,S):[]}var A=e=>`<div class="jm-cl-row">
    <input type="checkbox" class="jm-cl-done" aria-label="\u0E17\u0E33\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27"${e.done?" checked":""}>
    <input class="inp jm-cl-txt${e.done?" is-done":""}" maxlength="${j}" placeholder="\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A" value="${m(e.text)}">
    <button type="button" class="jm-cl-del" title="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" aria-label="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u2715</button>
  </div>`;function ee(e,t,{p:l="nj-"}={}){let n=e.querySelector(".jm-auto .jm-auto-cb"),s=n&&n.closest(".jm-auto");if(!n||!s||e.querySelector("#"+l+"cl"))return null;let c=document.createElement("label");c.className="jm-cb",c.innerHTML=`<input type="checkbox" id="${l}cl"${t&&t.checklist_enabled?" checked":""}><span>Check list</span>`;let r=n.querySelector("#"+l+"n0409"),f=r?r.closest("label"):null;f&&f.parentNode===n?f.after(c):n.appendChild(c);let i=c.querySelector("input"),a=document.createElement("div");a.className="jm-cl",a.id=l+"cl-box",a.setAttribute("data-enter-skip",""),a.innerHTML=`<div class="jm-cl-h"><span class="jm-cl-title">Check list</span>
      <span class="jm-cl-count"></span></div>
    <div class="jm-cl-list"></div>
    <button type="button" class="btn btn-sm btn-o jm-cl-add">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>`,s.after(a);let o=a.querySelector(".jm-cl-list");o.innerHTML=I(t&&t.checklist_items).map(A).join("");let v=()=>{let d=[...o.querySelectorAll(".jm-cl-row")],u=d.filter(E=>E.querySelector(".jm-cl-done").checked).length;a.querySelector(".jm-cl-count").textContent=d.length?`\u0E40\u0E2A\u0E23\u0E47\u0E08 ${u}/${d.length}`:"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"},k=()=>{a.hidden=!i.checked},x=(d=!0)=>{if(!(o.querySelectorAll(".jm-cl-row").length>=S)&&(o.insertAdjacentHTML("beforeend",A({text:"",done:!1})),v(),d))try{o.lastElementChild.querySelector(".jm-cl-txt").focus()}catch{}};return i.addEventListener("change",()=>{k(),i.checked&&!o.querySelector(".jm-cl-row")&&x()}),a.querySelector(".jm-cl-add").addEventListener("click",()=>x()),o.addEventListener("click",d=>{let u=d.target.closest(".jm-cl-del");u&&(u.closest(".jm-cl-row").remove(),v())}),o.addEventListener("change",d=>{if(!d.target.classList.contains("jm-cl-done"))return;d.target.closest(".jm-cl-row").querySelector(".jm-cl-txt").classList.toggle("is-done",d.target.checked),v()}),o.addEventListener("keydown",d=>{if(d.key!=="Enter"||!d.target.classList.contains("jm-cl-txt"))return;d.preventDefault();let u=d.target.closest(".jm-cl-row");if(u===o.lastElementChild)x();else try{u.nextElementSibling.querySelector(".jm-cl-txt").focus()}catch{}}),k(),v(),{value(){let d=[...o.querySelectorAll(".jm-cl-row")].map(u=>({text:u.querySelector(".jm-cl-txt").value.trim().slice(0,j),done:u.querySelector(".jm-cl-done").checked})).filter(u=>u.text).slice(0,S);return{checklist_enabled:!!i.checked,checklist_items:d}}}}var B=["HALF (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)","HALF (\u0E04\u0E35\u0E22\u0E4CNJ)","HALF (\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4CNJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","COUNTER (\u0E04\u0E35\u0E22\u0E4C)","COUNTER (\u0E04\u0E35\u0E22\u0E4C+\u0E1B\u0E25\u0E48\u0E2D\u0E22)"],D="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",y="\u0E2D\u0E37\u0E48\u0E19",R=["\u0E40\u0E01\u0E29\u0E15\u0E23","\u0E2D\u0E22.","\u0E1B\u0E23\u0E30\u0E21\u0E07","\u0E1B\u0E48\u0E32\u0E44\u0E21\u0E49","\u0E1B\u0E28\u0E38\u0E2A\u0E31\u0E15\u0E27\u0E4C",y],P="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u2014",J=["\u0E1E.\u0E01","\u0E2A\u0E21\u0E2D","LPI",y],F="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u2014",U=["IM (SEA)","IM (AIR)","IM (TRUCK)","EX (SEA)","EX (AIR)","EX (TRUCK)","FORM"],z="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E2B\u0E21\u0E14 \u2014",X=e=>e?e.code||e.name:"",W=e=>{if(!e)return"";let t=String(e.branch_code||"").trim(),l=String(e.tax_id||"").trim();return[t?"\u0E2A\u0E32\u0E02\u0E32 "+t:"",l?"TAX ID "+l:""].filter(Boolean).join("  |  ")},ce=e=>e?[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "):"",ie=e=>{if(!e)return"";let t=[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "),l=W(e).replace(/\s*\|\s*/g," \xB7 ");return[t,l].filter(Boolean).join(" \xB7 ")},G=(e,t,l)=>(e||t)+(e&&!l.includes(e)?" (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19)":"");function L(e,t,l,n,s){let c=l.slice();n&&!c.includes(n)&&c.push(n);let r=i=>G(i,t,l),f=[""].concat(c).map(i=>`
        <button type="button" class="njsel-item${i===n?" on":""}" role="option"
          aria-selected="${i===n}" data-v="${m(i)}">
          <span class="njsel-rd" aria-hidden="true"></span>
          <span class="njsel-lb">${m(r(i))}</span></button>`).join("");return`<div class="njsel ${s}" id="${e}-wrap">
      <button type="button" class="njsel-btn" id="${e}-btn"
        aria-haspopup="listbox" aria-expanded="false">
        <span class="njsel-txt">${m(r(n))}</span>
        <span class="njsel-car" aria-hidden="true"></span>
      </button>
      <div class="njsel-list" id="${e}-list" role="listbox" hidden>${f}
      </div>
      <select class="sel njsel-native" id="${e}" tabindex="-1" aria-hidden="true">
        <option value="">${m(t)}</option>
        ${c.map(i=>`<option value="${m(i)}"${n===i?" selected":""}>${m(r(i))}</option>`).join("")}
      </select>
    </div>`}var M=(e,t,l,n,s,c,r)=>L(e,t,l,n,s)+`<input class="inp njsel-other" id="${e}-other" placeholder="${m(r)}"
       value="${m(c||"")}"${n===y?"":" hidden"}>`;function N(e,t){let l=e.querySelector("#"+t),n=e.querySelector("#"+t+"-other");if(!l||!n)return;let s=()=>{n.hidden=l.value!==y};l.addEventListener("change",s),s()}function h(e,t){let l=e.querySelector("#"+t+"-wrap");if(!l)return;let n=l.querySelector("#"+t+"-btn"),s=l.querySelector("#"+t+"-list"),c=l.querySelector(".njsel-txt"),r=l.querySelector("#"+t),f=()=>{s.hidden=!0,n.setAttribute("aria-expanded","false")};n.addEventListener("click",i=>{i.stopPropagation();let a=s.hidden;s.hidden=!a,n.setAttribute("aria-expanded",String(a))}),s.addEventListener("click",i=>{let a=i.target.closest(".njsel-item");a&&(r.value=a.dataset.v||"",c.textContent=a.querySelector(".njsel-lb").textContent,s.querySelectorAll(".njsel-item").forEach(o=>{let v=o===a;o.classList.toggle("on",v),o.setAttribute("aria-selected",String(v))}),f())}),g(l,i=>{l.contains(i.target)||f()})}var p=(e,t)=>e&&e[t]===!0?"checked":"",b=(e,t)=>e?m(e[t]||""):"";function K(e,{p:t="nj-"}={}){let l=`<label class="jm-cb"><input type="checkbox" id="${t}exempt" ${p(e,"doc_exempt")}><span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}inspect" ${p(e,"doc_inspect")}><span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span></label>`,n=`<label class="jm-cb"><input type="checkbox" id="${t}fcl" ${p(e,"cargo_fcl")}><span>FCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}lcl" ${p(e,"cargo_lcl")}><span>LCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}fz" ${p(e,"cargo_fz")}><span>FZ</span></label><label class="jm-cb"><input type="checkbox" id="${t}fzfz" ${p(e,"cargo_fz_fz")}><span>FZ+FZ</span></label>`,s=`<label class="jm-cb"><input type="checkbox" id="${t}fee" ${p(e,"doc_fee")}><span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></label><label class="jm-cb"><input type="checkbox" id="${t}ovt" ${p(e,"doc_overtime")}><span>\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}mass" ${p(e,"doc_mass")}><span>\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A</span></label><label class="jm-cb"><input type="checkbox" id="${t}travel" ${p(e,"doc_travel")}><span>\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07</span></label><label class="jm-cb"><input type="checkbox" id="${t}print" ${p(e,"doc_print")}><span>\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}labor" ${p(e,"doc_labor")}><span>\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}otnj" ${p(e,"doc_ot_nj")}><span>\u0E42\u0E2D\u0E17\u0E35 NJ</span></label><label class="jm-cb"><input type="checkbox" id="${t}c0409" ${p(e,"doc_0409_cust")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}n0409" ${p(e,"doc_0409_nocollect")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</span></label>`;return l+`<span class="jm-cargo" id="${t}cargo">${n}</span>`+s}var V="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014",$=[{sfx:"lift-f",f:"lift_on_wharf_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",tag:"Lift On / Wharf"},{sfx:"stor-f",f:"storage_charge_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",tag:"Storage Charge"}],H=e=>{let t=$.filter((l,n)=>e[n]).map(l=>l.tag);return t.length?t.join(" + "):V};function Z(e,{p:t="nj-"}={}){let l=$.map(s=>!!(e&&e[s.f]===!0)),n=$.map((s,c)=>`
        <label class="njsel-item njsel-item-cb${l[c]?" on":""}">
          <input type="checkbox" class="njsel-ck" id="${t}${s.sfx}" ${p(e,s.f)}>
          <span class="njsel-lb">${m(s.lb)}</span></label>`).join("");return`<span class="jm-auto-lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</span>
      <div class="njsel jm-auto-rcp" id="${t}rcp-wrap">
        <button type="button" class="njsel-btn" id="${t}rcp-btn"
          aria-haspopup="listbox" aria-expanded="false">
          <span class="njsel-txt">${m(H(l))}</span>
          <span class="njsel-car" aria-hidden="true"></span>
        </button>
        <div class="njsel-list" id="${t}rcp-list" role="group" hidden>${n}
        </div>
      </div>`}function oe(e,{p:t="nj-"}={}){let l=e.querySelector("#"+t+"rcp-wrap");if(!l)return;let n=l.querySelector("#"+t+"rcp-btn"),s=l.querySelector("#"+t+"rcp-list"),c=l.querySelector(".njsel-txt"),r=$.map(a=>l.querySelector("#"+t+a.sfx)),f=()=>{s.hidden=!0,n.setAttribute("aria-expanded","false")},i=()=>{let a=r.map(o=>!!(o&&o.checked));c.textContent=H(a),r.forEach((o,v)=>{o&&o.closest(".njsel-item").classList.toggle("on",a[v])})};n.addEventListener("click",a=>{a.stopPropagation();let o=s.hidden;s.hidden=!o,n.setAttribute("aria-expanded",String(o))}),s.addEventListener("change",i),g(l,a=>{l.contains(a.target)||f()}),i()}function re(e,{p:t="nj-",receiptBox:l=!1}={}){return`<span class="jm-auto-lb">\u0E42\u0E2B\u0E21\u0E14</span>
      ${L(t+"mode",z,U,e&&e.data_type||"","jm-auto-mode")}
      <span class="jm-auto-lb">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</span>
      ${L(t+"cat",D,B,e&&e.job_category||"","jm-auto-cat")}
      <span class="jm-auto-lb">\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19</span>
      ${M(t+"agency",P,R,e&&e.agency_via||"","jm-auto-agency",e&&e.agency_via_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19")}
      <span class="jm-auto-lb">\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15</span>
      ${M(t+"permit",F,J,e&&e.permit_name||"","jm-auto-permit",e&&e.permit_name_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15")}
      ${l?Z(e,{p:t}):""}
      <div class="jm-cb-row jm-auto-cb">${K(e,{p:t})}</div>`}function de(e,{p:t="nj-",receiptBox:l=!1}={}){return`
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
          <div class="fld-inline">
            ${_(t+"comp",q(),e&&e.company_invoice_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
          </div></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
          <input class="inp" id="${t}decl" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32" value="${b(e,"customs_declaration_no")}"></div>
        <div class="fld"><label>Invoice No.</label>
          <input class="inp" id="${t}srcinv" placeholder="\u0E01\u0E23\u0E2D\u0E01 Invoice No." value="${b(e,"source_invoice_no")}"></div>
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="${t}hbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 House B/L No." value="${b(e,"house_bl_no")}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="${t}mbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 Master B/L No." value="${b(e,"master_bl_no")}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="${t}book" placeholder="\u0E01\u0E23\u0E2D\u0E01 Booking No." value="${b(e,"booking_no")}"></div>
        <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>
          <input class="inp" type="number" min="0" id="${t}qtyc" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49" value="${e&&e.qty_container!=null?e.qty_container:""}"></div>
        <div class="fld"><label>ETA</label><input class="inp" type="date" id="${t}eta" value="${e&&e.eta||""}"></div>
        <div class="fld"><label>ETD</label><input class="inp" type="date" id="${t}etd" value="${e&&e.etd||""}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22</label>
          <input class="inp" type="date" id="${t}rel" value="${e&&e.release_date||""}"></div>
      </div>

      <!-- \u2500\u2500 V.333 \u2500\u2500 \u0E41\u0E16\u0E27 3 = \u0E41\u0E16\u0E27 3 \u0E40\u0E14\u0E34\u0E21 + \u0E41\u0E16\u0E27 4 \u0E40\u0E14\u0E34\u0E21 \u0E22\u0E38\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27
           receiptBox:true  -> \u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A | \u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 | \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 | Customer Job No. | \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38  (5 \u0E0A\u0E48\u0E2D\u0E07\u0E1E\u0E2D\u0E14\u0E35)
           receiptBox:false -> + Lift On/Wharf \xB7 Storage Charge = 7 \u0E0A\u0E48\u0E2D\u0E07 (\u0E44\u0E2B\u0E25\u0E15\u0E48\u0E2D 5 + 2)
           *** \u0E44\u0E21\u0E48\u0E21\u0E35 Grid Cell \u0E27\u0E48\u0E32\u0E07\u0E04\u0E31\u0E48\u0E19\u0E01\u0E25\u0E32\u0E07 *** \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E40\u0E1B\u0E47\u0E19 Container \u0E40\u0E14\u0E35\u0E22\u0E27\u0E17\u0E35\u0E48 auto-flow -->
      <div class="jm-grid jm-grid-5 jm-row-even">
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>
          <input class="inp" type="date" id="${t}dlv" value="${e&&e.delivery_date||""}"></div>
        <div class="fld"><label>\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32</label>
          <input class="inp" id="${t}port" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32" value="${b(e,"import_port")}"></div>
        ${l?"":`<div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf</label>
          <input class="inp" id="${t}lift-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Lift On / Wharf"
            value="${b(e,"lift_on_wharf_note")}"></div>
        <div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge</label>
          <input class="inp" id="${t}stor-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Storage Charge"
            value="${b(e,"storage_charge_note")}"></div>`}
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
          <div class="fld-inline">
            ${_(t+"cust",C(),e&&e.customer_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",X)}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="${t}cjob" placeholder="\u0E01\u0E23\u0E2D\u0E01 Customer Job No." value="${b(e,"customer_job_no")}"></div>
        <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp" id="${t}note" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38">${b(e,"note")}</textarea></div>
      </div>
      
      <div class="jm-grid jm-grid-4">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
          <input class="inp" id="${t}vessel" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel" value="${b(e,"vessel_name")}"></div>
        <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
          <input class="inp" type="number" min="0" id="${t}term" placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"
            value="${e&&e.credit_term_days!=null?e.credit_term_days:""}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="${t}due" value="${e&&e.due_date||""}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</label>
          <input class="inp" type="date" id="${t}invdate" value="${e&&e.invoice_date||""}"></div>
      </div>
      <div class="jm-hint" id="${t}due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>`}function pe(e,{p:t="nj-"}={}){h(e,t+"mode"),h(e,t+"cat"),h(e,t+"agency"),h(e,t+"permit"),N(e,t+"agency"),N(e,t+"permit")}var O=[["mode","\u0E42\u0E2B\u0E21\u0E14","sel"],["cat","\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17","sel"],["comp","\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17","combo"],["decl","\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",""],["srcinv","Invoice No.",""],["hbl","House B/L No.",""],["mbl","Master B/L No.",""],["cust","\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32","combo"],["cjob","Customer Job No.",""]],Y=()=>{let e=document.createElement("span");return e.className="req",e.textContent="*",e};function ue(e,{p:t="nj-"}={}){O.forEach(([l,,n])=>{let s=null;if(n==="sel"){let c=e.querySelector("#"+t+l+"-wrap")||e.querySelector("#"+t+l),r=c&&c.previousElementSibling;s=r&&r.classList.contains("jm-auto-lb")?r:null}else{let c=e.querySelector("#"+t+l),r=c&&c.closest(".fld");s=r&&r.querySelector("label")}!s||s.querySelector(".req")||s.append(" ",Y())})}function me(e,{p:t="nj-"}={}){return O.map(([l,n,s])=>({key:l,label:n,kind:s,el:e.querySelector("#"+t+l)})).filter(l=>l.el&&String((l.kind==="combo"?T(l.el):l.el.value)||"").trim()==="")}function be(e,t,{p:l="nj-"}={}){e.querySelectorAll(".njsel.is-err, select.is-err").forEach(n=>n.classList.remove("is-err")),t.forEach(n=>{if(n.kind==="sel"){let s=e.querySelector("#"+l+n.key+"-wrap")||n.el;s&&s.classList.add("is-err")}else w(n.el,n.key==="cust"?"\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32":"\u0E01\u0E23\u0E2D\u0E01"+n.label)})}var fe=e=>"\u26A0 \u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01: "+e.map(t=>t.label).join(", ");export{ee as a,y as b,U as c,z as d,X as e,W as f,ce as g,ie as h,N as i,h as j,oe as k,re as l,de as m,pe as n,ue as o,me as p,be as q,fe as r};
