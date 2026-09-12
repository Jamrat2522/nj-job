import{d as h}from"./chunk-OZIEEHK7.js";import{k as _,l as g}from"./chunk-U5EIDOXC.js";import{e as d}from"./chunk-PCFU74ZV.js";var L=["HALF (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)","HALF (\u0E04\u0E35\u0E22\u0E4CNJ)","HALF (\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","FULL (\u0E04\u0E35\u0E22\u0E4CNJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)","COUNTER (\u0E04\u0E35\u0E22\u0E4C)","COUNTER (\u0E04\u0E35\u0E22\u0E4C+\u0E1B\u0E25\u0E48\u0E2D\u0E22)"],E="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",v="\u0E2D\u0E37\u0E48\u0E19",k=["\u0E40\u0E01\u0E29\u0E15\u0E23","\u0E2D\u0E22.","\u0E1B\u0E23\u0E30\u0E21\u0E07","\u0E1B\u0E48\u0E32\u0E44\u0E21\u0E49","\u0E1B\u0E28\u0E38\u0E2A\u0E31\u0E15\u0E27\u0E4C",v],j="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u2014",T=["\u0E1E.\u0E01","\u0E2A\u0E21\u0E2D","LPI",v],O="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u2014",A=["IM (SEA)","IM (AIR)","IM (TRUCK)","EX (SEA)","EX (AIR)","EX (TRUCK)","FORM"],B="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E2B\u0E21\u0E14 \u2014",H=e=>e?e.code||e.name:"",M=e=>{if(!e)return"";let t=String(e.branch_code||"").trim(),a=String(e.tax_id||"").trim();return[t?"\u0E2A\u0E32\u0E02\u0E32 "+t:"",a?"TAX ID "+a:""].filter(Boolean).join("  |  ")},J=e=>e?[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "):"",D=e=>{if(!e)return"";let t=[String(e.code||"").trim(),String(e.name||"").trim()].filter(Boolean).join(" | "),a=M(e).replace(/\s*\|\s*/g," \xB7 ");return[t,a].filter(Boolean).join(" \xB7 ")},I=(e,t,a)=>(e||t)+(e&&!a.includes(e)?" (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19)":"");function x(e,t,a,l,n){let o=a.slice();l&&!o.includes(l)&&o.push(l);let p=s=>I(s,t,a),b=[""].concat(o).map(s=>`
        <button type="button" class="njsel-item${s===l?" on":""}" role="option"
          aria-selected="${s===l}" data-v="${d(s)}">
          <span class="njsel-rd" aria-hidden="true"></span>
          <span class="njsel-lb">${d(p(s))}</span></button>`).join("");return`<div class="njsel ${n}" id="${e}-wrap">
      <button type="button" class="njsel-btn" id="${e}-btn"
        aria-haspopup="listbox" aria-expanded="false">
        <span class="njsel-txt">${d(p(l))}</span>
        <span class="njsel-car" aria-hidden="true"></span>
      </button>
      <div class="njsel-list" id="${e}-list" role="listbox" hidden>${b}
      </div>
      <select class="sel njsel-native" id="${e}" tabindex="-1" aria-hidden="true">
        <option value="">${d(t)}</option>
        ${o.map(s=>`<option value="${d(s)}"${l===s?" selected":""}>${d(p(s))}</option>`).join("")}
      </select>
    </div>`}var y=(e,t,a,l,n,o,p)=>x(e,t,a,l,n)+`<input class="inp njsel-other" id="${e}-other" placeholder="${d(p)}"
       value="${d(o||"")}"${l===v?"":" hidden"}>`;function S(e,t){let a=e.querySelector("#"+t),l=e.querySelector("#"+t+"-other");if(!a||!l)return;let n=()=>{l.hidden=a.value!==v};a.addEventListener("change",n),n()}function $(e,t){let a=e.querySelector("#"+t+"-wrap");if(!a)return;let l=a.querySelector("#"+t+"-btn"),n=a.querySelector("#"+t+"-list"),o=a.querySelector(".njsel-txt"),p=a.querySelector("#"+t),b=()=>{n.hidden=!0,l.setAttribute("aria-expanded","false")};l.addEventListener("click",s=>{s.stopPropagation();let c=n.hidden;n.hidden=!c,l.setAttribute("aria-expanded",String(c))}),n.addEventListener("click",s=>{let c=s.target.closest(".njsel-item");c&&(p.value=c.dataset.v||"",o.textContent=c.querySelector(".njsel-lb").textContent,n.querySelectorAll(".njsel-item").forEach(r=>{let m=r===c;r.classList.toggle("on",m),r.setAttribute("aria-selected",String(m))}),b())}),document.addEventListener("mousedown",s=>{document.body.contains(a)&&(a.contains(s.target)||b())})}var i=(e,t)=>e&&e[t]===!0?"checked":"",u=(e,t)=>e?d(e[t]||""):"";function N(e,{p:t="nj-"}={}){let a=`<label class="jm-cb"><input type="checkbox" id="${t}exempt" ${i(e,"doc_exempt")}><span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}inspect" ${i(e,"doc_inspect")}><span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span></label>`,l=`<label class="jm-cb"><input type="checkbox" id="${t}fcl" ${i(e,"cargo_fcl")}><span>FCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}lcl" ${i(e,"cargo_lcl")}><span>LCL</span></label><label class="jm-cb"><input type="checkbox" id="${t}fz" ${i(e,"cargo_fz")}><span>FZ</span></label><label class="jm-cb"><input type="checkbox" id="${t}fzfz" ${i(e,"cargo_fz_fz")}><span>FZ+FZ</span></label>`,n=`<label class="jm-cb"><input type="checkbox" id="${t}fee" ${i(e,"doc_fee")}><span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></label><label class="jm-cb"><input type="checkbox" id="${t}ovt" ${i(e,"doc_overtime")}><span>\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}mass" ${i(e,"doc_mass")}><span>\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A</span></label><label class="jm-cb"><input type="checkbox" id="${t}travel" ${i(e,"doc_travel")}><span>\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07</span></label><label class="jm-cb"><input type="checkbox" id="${t}print" ${i(e,"doc_print")}><span>\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}labor" ${i(e,"doc_labor")}><span>\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="${t}otnj" ${i(e,"doc_ot_nj")}><span>\u0E42\u0E2D\u0E17\u0E35 NJ</span></label><label class="jm-cb"><input type="checkbox" id="${t}c0409" ${i(e,"doc_0409_cust")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></label><label class="jm-cb"><input type="checkbox" id="${t}n0409" ${i(e,"doc_0409_nocollect")}><span>0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</span></label>`;return a+`<span class="jm-cargo" id="${t}cargo">${l}</span>`+n}var q="\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014",f=[{sfx:"lift-f",f:"lift_on_wharf_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",tag:"Lift On / Wharf"},{sfx:"stor-f",f:"storage_charge_flag",lb:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",tag:"Storage Charge"}],C=e=>{let t=f.filter((a,l)=>e[l]).map(a=>a.tag);return t.length?t.join(" + "):q};function w(e,{p:t="nj-"}={}){let a=f.map(n=>!!(e&&e[n.f]===!0)),l=f.map((n,o)=>`
        <label class="njsel-item njsel-item-cb${a[o]?" on":""}">
          <input type="checkbox" class="njsel-ck" id="${t}${n.sfx}" ${i(e,n.f)}>
          <span class="njsel-lb">${d(n.lb)}</span></label>`).join("");return`<span class="jm-auto-lb">\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</span>
      <div class="njsel jm-auto-rcp" id="${t}rcp-wrap">
        <button type="button" class="njsel-btn" id="${t}rcp-btn"
          aria-haspopup="listbox" aria-expanded="false">
          <span class="njsel-txt">${d(C(a))}</span>
          <span class="njsel-car" aria-hidden="true"></span>
        </button>
        <div class="njsel-list" id="${t}rcp-list" role="group" hidden>${l}
        </div>
      </div>`}function U(e,{p:t="nj-"}={}){let a=e.querySelector("#"+t+"rcp-wrap");if(!a)return;let l=a.querySelector("#"+t+"rcp-btn"),n=a.querySelector("#"+t+"rcp-list"),o=a.querySelector(".njsel-txt"),p=f.map(c=>a.querySelector("#"+t+c.sfx)),b=()=>{n.hidden=!0,l.setAttribute("aria-expanded","false")},s=()=>{let c=p.map(r=>!!(r&&r.checked));o.textContent=C(c),p.forEach((r,m)=>{r&&r.closest(".njsel-item").classList.toggle("on",c[m])})};l.addEventListener("click",c=>{c.stopPropagation();let r=n.hidden;n.hidden=!r,l.setAttribute("aria-expanded",String(r))}),n.addEventListener("change",s),document.addEventListener("mousedown",c=>{document.body.contains(a)&&(a.contains(c.target)||b())}),s()}function z(e,{p:t="nj-",receiptBox:a=!1}={}){return`<span class="jm-auto-lb">\u0E42\u0E2B\u0E21\u0E14</span>
      ${x(t+"mode",B,A,e&&e.data_type||"","jm-auto-mode")}
      <span class="jm-auto-lb">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</span>
      ${x(t+"cat",E,L,e&&e.job_category||"","jm-auto-cat")}
      <span class="jm-auto-lb">\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19</span>
      ${y(t+"agency",j,k,e&&e.agency_via||"","jm-auto-agency",e&&e.agency_via_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19")}
      <span class="jm-auto-lb">\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15</span>
      ${y(t+"permit",O,T,e&&e.permit_name||"","jm-auto-permit",e&&e.permit_name_other||"","\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15")}
      ${a?w(e,{p:t}):""}
      <div class="jm-cb-row jm-auto-cb">${N(e,{p:t})}</div>`}function W(e,{p:t="nj-",receiptBox:a=!1}={}){return`
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
          <div class="fld-inline">
            ${h(t+"comp",g(),e&&e.company_invoice_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
          </div></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
          <input class="inp" id="${t}decl" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32" value="${u(e,"customs_declaration_no")}"></div>
        <div class="fld"><label>Invoice No.</label>
          <input class="inp" id="${t}srcinv" placeholder="\u0E01\u0E23\u0E2D\u0E01 Invoice No." value="${u(e,"source_invoice_no")}"></div>
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="${t}hbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 House B/L No." value="${u(e,"house_bl_no")}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="${t}mbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 Master B/L No." value="${u(e,"master_bl_no")}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="${t}book" placeholder="\u0E01\u0E23\u0E2D\u0E01 Booking No." value="${u(e,"booking_no")}"></div>
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
          <input class="inp" id="${t}port" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32" value="${u(e,"import_port")}"></div>
        ${a?"":`<div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf</label>
          <input class="inp" id="${t}lift-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Lift On / Wharf"
            value="${u(e,"lift_on_wharf_note")}"></div>
        <div class="fld"><label>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge</label>
          <input class="inp" id="${t}stor-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 Storage Charge"
            value="${u(e,"storage_charge_note")}"></div>`}
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
          <div class="fld-inline">
            ${h(t+"cust",_(),e&&e.customer_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",H)}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="${t}cjob" placeholder="\u0E01\u0E23\u0E2D\u0E01 Customer Job No." value="${u(e,"customer_job_no")}"></div>
        <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp" id="${t}note" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38">${u(e,"note")}</textarea></div>
      </div>`}function G(e,{p:t="nj-"}={}){$(e,t+"mode"),$(e,t+"cat"),$(e,t+"agency"),$(e,t+"permit"),S(e,t+"agency"),S(e,t+"permit")}export{v as a,A as b,B as c,H as d,M as e,J as f,D as g,S as h,$ as i,U as j,z as k,W as l,G as m};
