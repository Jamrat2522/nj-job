import{g as c}from"./chunk-NO6JZBTH.js";import{c as v,d as p}from"./chunk-Q7FMECGI.js";import"./chunk-GDT6F23K.js";import{b as u}from"./chunk-MZQK3TFF.js";import"./chunk-F5ETAYOF.js";import{c as n,e as t,g as $}from"./chunk-PCFU74ZV.js";async function C(i,{id:d,from:r}){let e=await u(d),o=(a,m)=>`<div class="fld"><label>${a}</label><div>${m||"-"}</div></div>`;i.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E07\u0E32\u0E19 ${t(e.job_no)}</h2>${$(e.operational_status)}</div>
      <div class="row">
        ${c("edit",e.charge_type,e.company_group)&&!e.invoice_id&&e.operational_status!=="CANCELED"?'<button class="btn btn-o" id="jd-edit">\u270F \u0E41\u0E01\u0E49\u0E44\u0E02</button>':""}
        ${c("invoice",e.charge_type,e.company_group)&&!e.invoice_id&&e.operational_status!=="CANCELED"?'<span class="t-xs t-3">\u0E2D\u0E2D\u0E01 Invoice \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 ACCOUNTING &gt; \u0E1B\u0E38\u0E48\u0E21 \u201C\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u201D</span>':""}
        ${e.invoice_id?'<button class="btn btn-o" id="jd-viewinv">\u0E14\u0E39 INVOICE</button>':""}
        <button class="btn btn-o" id="jd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    <div class="card card-pad">
      <div class="fgrid">
        ${o("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",p(e.charge_type)+" \xB7 "+v(e.company_group))}
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
      </div>
      <div class="fsec"><div class="fsec-t">\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E40\u0E19\u0E2D\u0E23\u0E4C</div>
        ${(e.containers||[]).length?e.containers.map(a=>`<span class="bdg bdg-due-ok" style="margin:2px">${t(a.container_no)}${a.container_type?" \xB7 "+t(a.container_type):""}</span>`).join(" "):'<span class="t-3">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E39\u0E49</span>'}</div>
      <div class="fsec"><div class="fsec-t">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div><div>${t(e.note)||"-"}</div></div>
    </div>`;let s=["document","accounting"].includes(r)?r:null,b=s?"#/"+s+"/"+String(e.charge_type).toLowerCase():"#/charges/"+e.charge_type+"/"+e.company_group;i.querySelector("#jd-back").onclick=()=>location.hash=b;let l=i.querySelector("#jd-edit");l&&(l.onclick=()=>location.hash="#/job/"+d+"/edit"+(s?"?mode="+s:""));let _=i.querySelector("#jd-viewinv");_&&(_.onclick=()=>{try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+e.invoice_id})}export{C as render};
