import{l as g,m as y}from"./chunk-7YFOR4SV.js";import{e as _,f as h}from"./chunk-FL6ZW7SA.js";import{e as d}from"./chunk-PCFU74ZV.js";var E=["HALF (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)","HALF (\u0E04\u0E35\u0E22\u0E4CNJ)","HALF (\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4CNJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","COUNTER (\u0E04\u0E35\u0E22\u0E4C)","COUNTER (\u0E04\u0E35\u0E22\u0E4C+\u0E1B\u0E25\u0E48\u0E2D\u0E22)"],k="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",f="\u0E2D\u0E37\u0E48\u0E19",T=["\u0E40\u0E01\u0E29\u0E15\u0E23","\u0E2D\u0E22.","\u0E1B\u0E23\u0E30\u0E21\u0E07","\u0E1B\u0E48\u0E32\u0E44\u0E21\u0E49","\u0E1B\u0E28\u0E38\u0E2A\u0E31\u0E15\u0E27\u0E4C",f],O="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u2014",j=["\u0E1E.\u0E01","\u0E2A\u0E21\u0E2D","LPI",f],A="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u2014",M=["IM (SEA)","IM (AIR)","IM (TRUCK)","EX (SEA)","EX (AIR)","EX (TRUCK)","FORM"],B="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E2B\u0E21\u0E14 \u2014",H=e=>e?e.code||e.name:"",I=e=>{if(!e)return"";let t=String(e.branch_code||"").trim(),l=String(e.tax_id||"").trim();return[t?"\u0E2A\u0E32\u0E02\u0E32 "+t:"",l?"TAX ID "+l:""].filter(Boolean).join("  |  ")},J=e=>e?[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "):"",U=e=>{if(!e)return"";let t=[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "),l=I(e).replace(/\s*\|\s*/g," \xB7 ");return[t,l].filter(Boolean).join(" \xB7 ")},N=(e,t,l)=>(e||t)+(e&&!l.includes(e)?" (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19)":"");function x(e,t,l,a,s){let o=l.slice();a&&!o.includes(a)&&o.push(a);let u=n=>N(n,t,l),b=[""].concat(o).map(n=>`
        <button type="button" class="njsel-item${n===a?" on":""}" role="option"
          aria-selected="${n===a}" data-v="${d(n)}">
          <span class="njsel-rd" aria-hidden="true"></span>
          <span class="njsel-lb">${d(u(n))}</span></button>`).join("");return`<div class="njsel ${s}" id="${e}-wrap">
      <button type="button" class="njsel-btn" id="${e}-btn"
        aria-haspopup="listbox" aria-expanded="false">
        <span class="njsel-txt">${d(u(a))}</span>
        <span class="njsel-car" aria-hidden="true"></span>
      </button>
      <div class="njsel-list" id="${e}-list" role="listbox" hidden>${b}
      </div>
      <select class="sel njsel-native" id="${e}" tabindex="-1" aria-hidden="true">
        <option value="">${d(t)}</option>
        ${o.map(n=>`<option value="${d(n)}"${a===n?" selected":""}>${d(u(n))}</option>`).join("")}
      </select>
    </div>`}var S=(e,t,l,a,s,o,u)=>x(e,t,l,a,s)+`<input class="inp njsel-other" id="${e}-other" placeholder="${d(u)}"
       value="${d(o||"")}"${a===f?"":" hidden"}>`;function C(e,t){let l=e.querySelector("#"+t),a=e.querySelector("#"+t+"-other");if(!l||!a)return;let s=()=>{a.hidden=l.value!==f};l.addEventListener("change",s),s()}function $(e,t){let l=e.querySelector("#"+t+"-wrap");if(!l)return;let a=l.querySelector("#"+t+"-btn"),s=l.querySelector("#"+t+"-list"),o=l.querySelector(".njsel-txt"),u=l.querySelector("#"+t),b=()=>{s.hidden=!0,a.setAttribute("aria-expanded","false")};a.addEventListener("click",n=>{n.stopPropagation();let i=s.hidden;s.hidden=!i,a.setAttribute("aria-expanded",String(i))}),s.addEventListener("click",n=>{let i=n.target.closest(".njsel-item");i&&(u.value=i.dataset.v||"",o.textContent=i.querySelector(".njsel-lb").textContent,s.querySelectorAll(".njsel-item").forEach(r=>{let v=r===i;r.classList.toggle("on",v),r.setAttribute("aria-selected",String(v))}),b())}),h(l,n=>{l.contains(n.target)||b()})}var c=(e,t)=>e&&e[t]===!0?"checked":"",p=(e,t)=>e?d(e[t]||""):"";function q(e,{p:t="nj-"}={}){let l=`<label class="jm-cb"><input type="checkbox" id="${t}exempt" ${c(e,"doc_exempt")}><span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}inspect" ${c(e,"doc_inspect")}><span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span></label>`,a=`<label class="jm-cb"><input type="checkbox" id="${t}fcl" ${c(e,"cargo_fcl")}><span>FCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}lcl" ${c(e,"cargo_lcl")}><span>LCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}fz" ${c(e,"cargo_fz")}><span>FZ</span></label><label class="jm-cb"><input type="checkbox" id="${t}fzfz" ${c(e,"cargo_fz_fz")}><span>FZ+FZ</span></label>`,s=`<label class="jm-cb"><input type="checkbox" id="${t}fee" ${c(e,"doc_fee")}><span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></label><label class="jm-cb"><input type="checkbox" id="${t}ovt" ${c(e,"doc_overtime")}><span>\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}mass" ${c(e,"doc_mass")}><span>\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A</span></label><label class="jm-cb"><input type="checkbox" id="${t}travel" ${c(e,"doc_travel")}><span>\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07</span></label><label class="jm-cb"><input type="checkbox" id="${t}print" ${c(e,"doc_print")}><span>\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}labor" ${c(e,"doc_labor")}><span>\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}otnj" ${c(e,"doc_ot_nj")}><span>\u0E42\u0E2D\u0E17\u0E35 NJ</span></label><label class="jm-cb"><input type="checkbox" id="${t}c0409" ${c(e,"doc_0409_cust")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}n0409" ${c(e,"doc_0409_nocollect")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</span></label>`;return l+`<span class="jm-cargo" id="${t}cargo">${a}</span>`+s}var P="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014",m=[{sfx:"lift-f",f:"lift_on_wharf_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",tag:"Lift On / Wharf"},{sfx:"stor-f",f:"storage_charge_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",tag:"Storage Charge"}],L=e=>{let t=m.filter((l,a)=>e[a]).map(l=>l.tag);return t.length?t.join(" + "):P};function R(e,{p:t="nj-"}={}){let l=m.map(s=>!!(e&&e[s.f]===!0)),a=m.map((s,o)=>`
        <label class="njsel-item njsel-item-cb${l[o]?" on":""}">
          <input type="checkbox" class="njsel-ck" id="${t}${s.sfx}" ${c(e,s.f)}>
          <span class="njsel-lb">${d(s.lb)}</span></label>`).join("");return`<span class="jm-auto-lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</span>
      <div class="njsel jm-auto-rcp" id="${t}rcp-wrap">
        <button type="button" class="njsel-btn" id="${t}rcp-btn"
          aria-haspopup="listbox" aria-expanded="false">
          <span class="njsel-txt">${d(L(l))}</span>
          <span class="njsel-car" aria-hidden="true"></span>
        </button>
        <div class="njsel-list" id="${t}rcp-list" role="group" hidden>${a}
        </div>
      </div>`}function z(e,{p:t="nj-"}={}){let l=e.querySelector("#"+t+"rcp-wrap");if(!l)return;let a=l.querySelector("#"+t+"rcp-btn"),s=l.querySelector("#"+t+"rcp-list"),o=l.querySelector(".njsel-txt"),u=m.map(i=>l.querySelector("#"+t+i.sfx)),b=()=>{s.hidden=!0,a.setAttribute("aria-expanded","false")},n=()=>{let i=u.map(r=>!!(r&&r.checked));o.textContent=L(i),u.forEach((r,v)=>{r&&r.closest(".njsel-item").classList.toggle("on",i[v])})};a.addEventListener("click",i=>{i.stopPropagation();let r=s.hidden;s.hidden=!r,a.setAttribute("aria-expanded",String(r))}),s.addEventListener("change",n),h(l,i=>{l.contains(i.target)||b()}),n()}function W(e,{p:t="nj-",receiptBox:l=!1}={}){return`<span class="jm-auto-lb">\u0E42\u0E2B\u0E21\u0E14</span>
      ${x(t+"mode",B,M,e&&e.data_type||"","jm-auto-mode")}
      <span class="jm-auto-lb">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</span>
      ${x(t+"cat",k,E,e&&e.job_category||"","jm-auto-cat")}
      <span class="jm-auto-lb">\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19</span>
      ${S(t+"agency",O,T,e&&e.agency_via||"","jm-auto-agency",e&&e.agency_via_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19")}
      <span class="jm-auto-lb">\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15</span>
      ${S(t+"permit",A,j,e&&e.permit_name||"","jm-auto-permit",e&&e.permit_name_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15")}
      ${l?R(e,{p:t}):""}
      <div class="jm-cb-row jm-auto-cb">${q(e,{p:t})}</div>`}function G(e,{p:t="nj-",receiptBox:l=!1}={}){return`
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
          <div class="fld-inline">
            ${_(t+"comp",y(),e&&e.company_invoice_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
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
            ${_(t+"cust",g(),e&&e.customer_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",H)}
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
      <div class="jm-hint" id="${t}due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>`}function K(e,{p:t="nj-"}={}){$(e,t+"mode"),$(e,t+"cat"),$(e,t+"agency"),$(e,t+"permit"),C(e,t+"agency"),C(e,t+"permit")}export{f as a,M as b,B as c,H as d,I as e,J as f,U as g,C as h,$ as i,z as j,W as k,G as l,K as m};
