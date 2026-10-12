import{c as u}from"./chunk-2S4N3AZA.js";import"./chunk-NG45Y6KB.js";import"./chunk-L5Z2NDJ3.js";import{j as r}from"./chunk-2B2FLIKC.js";import{b as $}from"./chunk-VS5POHCJ.js";import{c as p,d as v}from"./chunk-Q7FMECGI.js";import"./chunk-FL6ZW7SA.js";import"./chunk-GDT6F23K.js";import{c as n,e as t,g}from"./chunk-PCFU74ZV.js";import"./chunk-SGWIBJH6.js";async function j(i,{id:_,from:c}){let e=await $(_),o=(a,m)=>`<div class="fld"><label>${a}</label><div>${m||"-"}</div></div>`;i.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E07\u0E32\u0E19 ${t(e.job_no)}</h2>${g(e.operational_status)}</div>
      <div class="row">
        ${r("edit",e.charge_type,e.company_group)&&!e.invoice_id&&e.operational_status!=="CANCELED"?'<button class="btn btn-o" id="jd-edit">\u270F \u0E41\u0E01\u0E49\u0E44\u0E02</button>':""}
        ${r("invoice",e.charge_type,e.company_group)&&!e.invoice_id&&e.operational_status!=="CANCELED"?'<span class="t-xs t-3">\u0E2D\u0E2D\u0E01 Invoice \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 ACCOUNTING &gt; \u0E1B\u0E38\u0E48\u0E21 \u201C\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u201D</span>':""}
        ${e.invoice_id?'<button class="btn btn-o" id="jd-viewinv">\u0E14\u0E39 INVOICE</button>':""}
        <button class="btn btn-o" id="jd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    <div class="card card-pad">
      <div class="fgrid">
        ${o("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",v(e.charge_type)+" \xB7 "+p(e.company_group))}
        ${o("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",t(e.data_type))}
        ${o("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07",n(e.reference_date))}
        ${o("\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07",t(e.reference_no))}
        ${o("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",t(e.customer_name))}
        ${o("Customer Job No",t(e.customer_job_no))}
        ${o("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice",t(e.company_invoice))}
        ${o("\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19",t(e.customs_declaration_no))}
        ${o("Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07",t(e.source_invoice_no))}
        ${o("House B/L",t(e.house_bl_no))}
        ${o("Master B/L",t(e.master_bl_no))}
        ${o("Booking No",t(e.booking_no))}
        ${o("Vessel",t(e.vessel_name))}
        ${o("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49",e.qty_container)}
        ${o("ETD",n(e.etd))}
        ${o("ETA",n(e.eta))}
        ${o("\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A",n(e.delivery_date))}
        ${o("Case",t(e.case_no))}
        ${o("Contact",t(e.contact))}
        ${o("CS",t(e.cs_name))}
        ${o("I BILLING APL",t(e.i_billing_apl))}
        ${o("Credit Term",e.credit_term_days!=null?e.credit_term_days+" \u0E27\u0E31\u0E19":"-")}
        ${o("Due Date",n(e.due_date))}
        ${o("\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E1A\u0E31\u0E0D\u0E0A\u0E35",e.invoice_id?"\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27":"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE")}
        ${c==="document"?`
        ${o("\u0E17\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22",t(u(e.release_port,e.release_port_other)))}
        ${o("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",e.lift_on_wharf_flag===!0||e.lift_on_wharf_note?t("\u2713"+(e.lift_on_wharf_note?" \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E40\u0E1B\u0E47\u0E19 "+e.lift_on_wharf_note:"")):"")}
        ${o("\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",e.storage_charge_flag===!0||e.storage_charge_note?t("\u2713"+(e.storage_charge_note?" \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E40\u0E1B\u0E47\u0E19 "+e.storage_charge_note:"")):"")}`:""}
      </div>
      <div class="fsec"><div class="fsec-t">\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E40\u0E19\u0E2D\u0E23\u0E4C</div>
        ${(e.containers||[]).length?e.containers.map(a=>`<span class="bdg bdg-due-ok" style="margin:2px">${t(a.container_no)}${a.container_type?" \xB7 "+t(a.container_type):""}</span>`).join(" "):'<span class="t-3">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E39\u0E49</span>'}</div>
      <div class="fsec"><div class="fsec-t">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div><div>${t(e.note)||"-"}</div></div>
    </div>`;let s=["document","accounting"].includes(c)?c:null,h=s?"#/"+s+"/"+String(e.charge_type).toLowerCase():"#/charges/"+e.charge_type+"/"+e.company_group;i.querySelector("#jd-back").onclick=()=>location.hash=h;let d=i.querySelector("#jd-edit");d&&(d.onclick=()=>location.hash="#/job/"+_+"/edit"+(s?"?mode="+s:""));let l=i.querySelector("#jd-viewinv");l&&(l.onclick=()=>{try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+e.invoice_id})}export{j as render};
