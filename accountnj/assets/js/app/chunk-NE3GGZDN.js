import{e as _}from"./chunk-46QUQC76.js";import{l as x,m as g}from"./chunk-2OWLQSES.js";import{e as r}from"./chunk-PCFU74ZV.js";var L=["HALF (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)","HALF (\u0E04\u0E35\u0E22\u0E4CNJ)","HALF (\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4CNJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","COUNTER (\u0E04\u0E35\u0E22\u0E4C)","COUNTER (\u0E04\u0E35\u0E22\u0E4C+\u0E1B\u0E25\u0E48\u0E2D\u0E22)"],E="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",f="\u0E2D\u0E37\u0E48\u0E19",k=["\u0E40\u0E01\u0E29\u0E15\u0E23","\u0E2D\u0E22.","\u0E1B\u0E23\u0E30\u0E21\u0E07","\u0E1B\u0E48\u0E32\u0E44\u0E21\u0E49","\u0E1B\u0E28\u0E38\u0E2A\u0E31\u0E15\u0E27\u0E4C",f],T="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u2014",O=["\u0E1E.\u0E01","\u0E2A\u0E21\u0E2D","LPI",f],j="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u2014",A=["IM (SEA)","IM (AIR)","IM (TRUCK)","EX (SEA)","EX (AIR)","EX (TRUCK)","FORM"],B="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E2B\u0E21\u0E14 \u2014",H=e=>e?e.code||e.name:"",M=e=>{if(!e)return"";let t=String(e.branch_code||"").trim(),l=String(e.tax_id||"").trim();return[t?"\u0E2A\u0E32\u0E02\u0E32 "+t:"",l?"TAX ID "+l:""].filter(Boolean).join("  |  ")},F=e=>e?[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "):"",J=e=>{if(!e)return"";let t=[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "),l=M(e).replace(/\s*\|\s*/g," \xB7 ");return[t,l].filter(Boolean).join(" \xB7 ")},I=(e,t,l)=>(e||t)+(e&&!l.includes(e)?" (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19)":"");function h(e,t,l,a,n){let o=l.slice();a&&!o.includes(a)&&o.push(a);let u=s=>I(s,t,l),b=[""].concat(o).map(s=>`
        <button type="button" class="njsel-item${s===a?" on":""}" role="option"
          aria-selected="${s===a}" data-v="${r(s)}">
          <span class="njsel-rd" aria-hidden="true"></span>
          <span class="njsel-lb">${r(u(s))}</span></button>`).join("");return`<div class="njsel ${n}" id="${e}-wrap">
      <button type="button" class="njsel-btn" id="${e}-btn"
        aria-haspopup="listbox" aria-expanded="false">
        <span class="njsel-txt">${r(u(a))}</span>
        <span class="njsel-car" aria-hidden="true"></span>
      </button>
      <div class="njsel-list" id="${e}-list" role="listbox" hidden>${b}
      </div>
      <select class="sel njsel-native" id="${e}" tabindex="-1" aria-hidden="true">
        <option value="">${r(t)}</option>
        ${o.map(s=>`<option value="${r(s)}"${a===s?" selected":""}>${r(u(s))}</option>`).join("")}
      </select>
    </div>`}var y=(e,t,l,a,n,o,u)=>h(e,t,l,a,n)+`<input class="inp njsel-other" id="${e}-other" placeholder="${r(u)}"
       value="${r(o||"")}"${a===f?"":" hidden"}>`;function S(e,t){let l=e.querySelector("#"+t),a=e.querySelector("#"+t+"-other");if(!l||!a)return;let n=()=>{a.hidden=l.value!==f};l.addEventListener("change",n),n()}function v(e,t){let l=e.querySelector("#"+t+"-wrap");if(!l)return;let a=l.querySelector("#"+t+"-btn"),n=l.querySelector("#"+t+"-list"),o=l.querySelector(".njsel-txt"),u=l.querySelector("#"+t),b=()=>{n.hidden=!0,a.setAttribute("aria-expanded","false")};a.addEventListener("click",s=>{s.stopPropagation();let i=n.hidden;n.hidden=!i,a.setAttribute("aria-expanded",String(i))}),n.addEventListener("click",s=>{let i=s.target.closest(".njsel-item");i&&(u.value=i.dataset.v||"",o.textContent=i.querySelector(".njsel-lb").textContent,n.querySelectorAll(".njsel-item").forEach(d=>{let m=d===i;d.classList.toggle("on",m),d.setAttribute("aria-selected",String(m))}),b())}),document.addEventListener("mousedown",s=>{document.body.contains(l)&&(l.contains(s.target)||b())})}var c=(e,t)=>e&&e[t]===!0?"checked":"",p=(e,t)=>e?r(e[t]||""):"";function N(e,{p:t="nj-"}={}){let l=`<label class="jm-cb"><input type="checkbox" id="${t}exempt" ${c(e,"doc_exempt")}><span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}inspect" ${c(e,"doc_inspect")}><span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span></label>`,a=`<label class="jm-cb"><input type="checkbox" id="${t}fcl" ${c(e,"cargo_fcl")}><span>FCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}lcl" ${c(e,"cargo_lcl")}><span>LCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}fz" ${c(e,"cargo_fz")}><span>FZ</span></label><label class="jm-cb"><input type="checkbox" id="${t}fzfz" ${c(e,"cargo_fz_fz")}><span>FZ+FZ</span></label>`,n=`<label class="jm-cb"><input type="checkbox" id="${t}fee" ${c(e,"doc_fee")}><span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></label><label class="jm-cb"><input type="checkbox" id="${t}ovt" ${c(e,"doc_overtime")}><span>\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}mass" ${c(e,"doc_mass")}><span>\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A</span></label><label class="jm-cb"><input type="checkbox" id="${t}travel" ${c(e,"doc_travel")}><span>\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07</span></label><label class="jm-cb"><input type="checkbox" id="${t}print" ${c(e,"doc_print")}><span>\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}labor" ${c(e,"doc_labor")}><span>\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}otnj" ${c(e,"doc_ot_nj")}><span>\u0E42\u0E2D\u0E17\u0E35 NJ</span></label><label class="jm-cb"><input type="checkbox" id="${t}c0409" ${c(e,"doc_0409_cust")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}n0409" ${c(e,"doc_0409_nocollect")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</span></label>`;return l+`<span class="jm-cargo" id="${t}cargo">${a}</span>`+n}var q="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014",$=[{sfx:"lift-f",f:"lift_on_wharf_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",tag:"Lift On / Wharf"},{sfx:"stor-f",f:"storage_charge_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",tag:"Storage Charge"}],C=e=>{let t=$.filter((l,a)=>e[a]).map(l=>l.tag);return t.length?t.join(" + "):q};function w(e,{p:t="nj-"}={}){let l=$.map(n=>!!(e&&e[n.f]===!0)),a=$.map((n,o)=>`
        <label class="njsel-item njsel-item-cb${l[o]?" on":""}">
          <input type="checkbox" class="njsel-ck" id="${t}${n.sfx}" ${c(e,n.f)}>
          <span class="njsel-lb">${r(n.lb)}</span></label>`).join("");return`<span class="jm-auto-lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</span>
      <div class="njsel jm-auto-rcp" id="${t}rcp-wrap">
        <button type="button" class="njsel-btn" id="${t}rcp-btn"
          aria-haspopup="listbox" aria-expanded="false">
          <span class="njsel-txt">${r(C(l))}</span>
          <span class="njsel-car" aria-hidden="true"></span>
        </button>
        <div class="njsel-list" id="${t}rcp-list" role="group" hidden>${a}
        </div>
      </div>`}function U(e,{p:t="nj-"}={}){let l=e.querySelector("#"+t+"rcp-wrap");if(!l)return;let a=l.querySelector("#"+t+"rcp-btn"),n=l.querySelector("#"+t+"rcp-list"),o=l.querySelector(".njsel-txt"),u=$.map(i=>l.querySelector("#"+t+i.sfx)),b=()=>{n.hidden=!0,a.setAttribute("aria-expanded","false")},s=()=>{let i=u.map(d=>!!(d&&d.checked));o.textContent=C(i),u.forEach((d,m)=>{d&&d.closest(".njsel-item").classList.toggle("on",i[m])})};a.addEventListener("click",i=>{i.stopPropagation();let d=n.hidden;n.hidden=!d,a.setAttribute("aria-expanded",String(d))}),n.addEventListener("change",s),document.addEventListener("mousedown",i=>{document.body.contains(l)&&(l.contains(i.target)||b())}),s()}function z(e,{p:t="nj-",receiptBox:l=!1}={}){return`<span class="jm-auto-lb">\u0E42\u0E2B\u0E21\u0E14</span>
      ${h(t+"mode",B,A,e&&e.data_type||"","jm-auto-mode")}
      <span class="jm-auto-lb">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</span>
      ${h(t+"cat",E,L,e&&e.job_category||"","jm-auto-cat")}
      <span class="jm-auto-lb">\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19</span>
      ${y(t+"agency",T,k,e&&e.agency_via||"","jm-auto-agency",e&&e.agency_via_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19")}
      <span class="jm-auto-lb">\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15</span>
      ${y(t+"permit",j,O,e&&e.permit_name||"","jm-auto-permit",e&&e.permit_name_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15")}
      ${l?w(e,{p:t}):""}
      <div class="jm-cb-row jm-auto-cb">${N(e,{p:t})}</div>`}function W(e,{p:t="nj-",receiptBox:l=!1}={}){return`
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
          <div class="fld-inline">
            ${_(t+"comp",g(),e&&e.company_invoice_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
          </div></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
          <input class="inp" id="${t}decl" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32" value="${p(e,"customs_declaration_no")}"></div>
        <div class="fld"><label>Invoice No.</label>
          <input class="inp" id="${t}srcinv" placeholder="\u0E01\u0E23\u0E2D\u0E01 Invoice No." value="${p(e,"source_invoice_no")}"></div>
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="${t}hbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 House B/L No." value="${p(e,"house_bl_no")}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="${t}mbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 Master B/L No." value="${p(e,"master_bl_no")}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="${t}book" placeholder="\u0E01\u0E23\u0E2D\u0E01 Booking No." value="${p(e,"booking_no")}"></div>
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
          <input class="inp" id="${t}port" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32" value="${p(e,"import_port")}"></div>
        ${l?"":`<div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf</label>
          <input class="inp" id="${t}lift-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Lift On / Wharf"
            value="${p(e,"lift_on_wharf_note")}"></div>
        <div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge</label>
          <input class="inp" id="${t}stor-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Storage Charge"
            value="${p(e,"storage_charge_note")}"></div>`}
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
          <div class="fld-inline">
            ${_(t+"cust",x(),e&&e.customer_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",H)}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="${t}cjob" placeholder="\u0E01\u0E23\u0E2D\u0E01 Customer Job No." value="${p(e,"customer_job_no")}"></div>
        <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp" id="${t}note" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38">${p(e,"note")}</textarea></div>
      </div>
      
      <div class="jm-grid jm-grid-4">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
          <input class="inp" id="${t}vessel" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel" value="${p(e,"vessel_name")}"></div>
        <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
          <input class="inp" type="number" min="0" id="${t}term" placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"
            value="${e&&e.credit_term_days!=null?e.credit_term_days:""}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="${t}due" value="${e&&e.due_date||""}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</label>
          <input class="inp" type="date" id="${t}invdate" value="${e&&e.invoice_date||""}"></div>
      </div>
      <div class="jm-hint" id="${t}due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>`}function G(e,{p:t="nj-"}={}){v(e,t+"mode"),v(e,t+"cat"),v(e,t+"agency"),v(e,t+"permit"),S(e,t+"agency"),S(e,t+"permit")}export{L as a,f as b,A as c,B as d,H as e,M as f,F as g,J as h,S as i,v as j,U as k,z as l,W as m,G as n};
