import{e as m,f as I}from"./chunk-OPGKUGLK.js";import{g as f}from"./chunk-NO6JZBTH.js";import{c as D,d as T}from"./chunk-Q7FMECGI.js";import{a as u}from"./chunk-YM5GFE6V.js";import{a as b}from"./chunk-OFOOXWUM.js";import{b as w,c as q,d as L,e as A}from"./chunk-RIUF7UQU.js";import{a as M}from"./chunk-OWRRFPVK.js";import{d as k,e as y}from"./chunk-ZRPMDTDS.js";import{a as _,c as l,e as a,h}from"./chunk-PCFU74ZV.js";async function $(n,{id:s,view:p="page",onChanged:c}={}){let j=p==="modal",o=await w(s),d=o.status==="VOID",r=o.status==="POSTED",O=f("invoice",o.charge_type,o.company_group),v=o.job||{},U=o.customer||{},i=(t,e)=>`<div class="fld"><label>${t}</label><div>${e||"-"}</div></div>`;n.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE ${a(o.invoice_no)}</h2>
      ${d?'<span class="bdg bdg-void">VOID</span>':h(o.payment_status)}
      ${d?"":`<span class="bdg ${r?"bdg-paid":"bdg-due-ok"}">${r?"POSTED":"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST"}</span>`}</div>
      <div class="row">
        ${!d&&O&&!r?'<button class="btn btn-p" id="ivv-post">\u21E7 POST</button>':""}
        ${!d&&O&&r?'<button class="btn btn-o" id="ivv-unpost">\u21E9 UNPOST</button>':""}
        <button class="btn btn-print" id="ivv-print">\u{1F5A8} ${r?"Print Invoice":"Print Draft"}</button>
        ${!d&&f("void",o.charge_type,o.company_group)&&Number(o.paid)===0?'<button class="btn btn-danger-soft" id="ivv-void">\u{1F5D1} Void</button>':""}
        ${j?"":'<button class="btn btn-o" id="ivv-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button>'}</div></div>

    <div class="card card-pad iv-info">
      <div class="fgrid">
        ${i("\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",a(v.job_no))}
        ${i("Invoice No.",a(o.invoice_no))}
        ${i("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",T(o.charge_type)+" \xB7 "+D(o.company_group))}
        ${i("\u0E2A\u0E16\u0E32\u0E19\u0E30",d?"VOID":r?"POSTED":"ISSUED \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST")}
        ${i("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",a(U.name))}
        ${i("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice",a(o.company_invoice))}
        ${i("Customer Job No.",a(v.customer_job_no))}
        ${i("\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",a(v.customs_declaration_no))}
        ${i("Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07",a(v.source_invoice_no))}
        ${i("House B/L",a(v.house_bl_no))}
        ${i("Master B/L",a(v.master_bl_no))}
        ${i("Invoice Date",l(o.invoice_date))}
        ${i("Due Date",l(o.due_date))}
        ${i("\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A",a(o.created_by_name))}
      </div>
      ${v.note?`<div class="fld mt-2"><label>NOTE</label><div>${a(v.note)}</div></div>`:""}
    </div>

    <div class="page-head iv-pv-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE PREVIEW</h2>
      <span class="t-xs t-3">\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E08\u0E36\u0E07\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21
        ${r?"Print Invoice":"Print Draft"} \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E48\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C</span></div>
      <div class="row">
        <button class="btn btn-print" id="ivv-print2">\u{1F5A8} ${r?"Print Invoice":"Print Draft"}</button>
      </div></div>

    ${M(o,{draft:!1})}
    ${d?`<div class="card card-pad mt-2 t-sm" style="color:var(--red-600)">VOID \u0E40\u0E21\u0E37\u0E48\u0E2D: ${l(o.voided_at)} \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ${a(o.void_reason||"-")}</div>`:""}
    ${Number(o.paid)>0?`<div class="card card-pad mt-2 iv-paid-note"><div class="r-line"><span>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27</span><span class="money-pos">${_(o.paid)}</span></div><div class="r-line"><span>\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</span><span class="money-neg">${_(o.total_amount-o.paid)}</span></div></div>`:""}`;let S=n.querySelector("#ivv-back");if(S){let t="";try{t=sessionStorage.getItem("nj-inv-from")||""}catch{t=""}(!t.startsWith("#/")||t.startsWith("#/invoice/"))&&(t="#/charges/"+o.charge_type+"/"+o.company_group),S.onclick=()=>{location.hash=t}}let g=()=>window.print();n.querySelector("#ivv-print").onclick=g;let P=n.querySelector("#ivv-print2");P&&(P.onclick=g);let N=n.querySelector("#ivv-post");N&&(N.onclick=async()=>{if(await k("POST INVOICE "+o.invoice_no,"\u0E40\u0E21\u0E37\u0E48\u0E2D POST \u0E41\u0E25\u0E49\u0E27\u0E07\u0E32\u0E19\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 <b>"+(o.charge_type==="ADVANCE"?"FINANCE &gt; Advance (\u0E23\u0E2D\u0E08\u0E48\u0E32\u0E22/\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C)":"FINANCE &gt; Receipt (\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30)")+"</b><br>\u0E41\u0E25\u0E30\u0E2B\u0E25\u0E38\u0E14\u0E08\u0E32\u0E01\u0E04\u0E34\u0E27\u0E23\u0E2D\u0E2D\u0E2D\u0E01 Invoice","POST"))try{let e=await m("post-inv-"+s,()=>L(s,I()));b("POST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 "+(e&&e.queue==="advance_active"?"Advance":"Receipt"),"ok"),c&&c(),$(n,{id:s,view:p,onChanged:c})}catch(e){u(e)}});let E=n.querySelector("#ivv-unpost");E&&(E.onclick=async()=>{let t=await y("UNPOST INVOICE "+o.invoice_no+" (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");if(t)try{await m("unpost-inv-"+s,()=>A(s,t,I())),b("UNPOST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30 ISSUED","ok"),c&&c(),$(n,{id:s,view:p,onChanged:c})}catch(e){u(e)}});let V=n.querySelector("#ivv-void");V&&(V.onclick=async()=>{let t=await y("Void INVOICE "+o.invoice_no+" (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");if(t)try{await m("void-inv-"+s,()=>q(s,t,I())),b("Void INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E07\u0E32\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE","ok"),c&&c(),$(n,{id:s,view:p,onChanged:c})}catch(e){u(e)}})}async function G(n,{id:s}){return $(n,{id:s,view:"page"})}export{$ as a,G as b};
