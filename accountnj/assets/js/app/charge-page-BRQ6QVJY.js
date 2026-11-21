import{css762 as CS762,dd762 as DD762,sel762 as SL762,field762 as FD762,txt762 as TX762,chips762 as CH762}from"./ui-dd762.js";import{a as PB569}from"./chunk-6NADHKLT.js";import{c as CU804}from"./chunk-6NADHKLT.js";import{m as RPC710}from"./chunk-SGWIBJH6.js";import{a as AS712}from"./chunk-GDT6F23K.js";import{n as PF569}from"./chunk-SGWIBJH6.js";import{e as NE523,g as IE523}from"./chunk-IOOV4VJU.js";import{d as CO523}from"./chunk-6NADHKLT.js";import{a as kt,b as At,c as Tt,d as Ot,e as ot}from"./chunk-J26HUKJ4.js";import"./chunk-IIDKIKVM.js";import{a as jt,b as Vt}from"./chunk-IOEZHYTZ.js";import{e as wt}from"./chunk-ETXG4BWC.js";import{a as Dt}from"./chunk-6REVCVGI.js";import{g as ft,j as D,f as MA660}from"./chunk-2B2FLIKC.js";import{a as G}from"./chunk-4ATLROGD.js";import"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import{b as U}from"./chunk-Q7FMECGI.js";import{a as gt,b as et,c as Lt,e as I,f as H}from"./chunk-OPGKUGLK.js";import{a as m}from"./chunk-YM5GFE6V.js";import{a as x}from"./chunk-GDT6F23K.js";import{a as y}from"./chunk-OFOOXWUM.js";import{b as XLJ734}from"./chunk-FHYZBT2Q.js";import{j as LC734}from"./chunk-6NADHKLT.js";import{a as mt,b as yt,d as O,e as tt}from"./chunk-LNP7HEMP.js";import{a as f,c as S,e as n,f as vt,g as ht}from"./chunk-NQOCXXA2.js";import{A as $t,B as Ct,C as Nt,E as It,F as St,b as Et,z as R}from"./chunk-6NADHKLT.js";import{f as pt,m as RPC499}from"./chunk-SGWIBJH6.js";function Pt(t,e,a,o={}){let i=C=>(C??0).toLocaleString("th-TH");if(a==="document")return"";let k=["Total Job",i(t?.total_job),"var(--blue-600)",""],_=["Total Over Due",i(t?.total_overdue),"var(--red-600)","\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35 INVOICE \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E04\u0E49\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30 \xB7 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV \u0E40\u0E25\u0E22 Due = "+i(t?.job_overdue_no_invoice)],A=["Service Charge",f(t?.service_charge),"var(--acc-service)",""],d=["Advance Charge",f(t?.advance_charge),"var(--acc-advance)",""],v=["VAT",f(t?.vat),"var(--purple-600)",""],j=["Total Amount",f(t?.total_amount),"var(--green-600)","Net Payable = Gross "+f(t?.gross_total)+" \u2212 WHT "+f(t?.wht_total)];return'<div class="kpi-row">'+[k,_,A,d,v,j].map(([C,q,M,P])=>`<div class="kpi" style="--kpi-c:${M}" title="${P}"><div class="lb">${C}</div><div class="v">${q}</div></div>`).join("")+"</div>"}var Mt=(t,e)=>e==="document"?0:6;function J(t,e={},a,o={}){let i=a==="document",k=a==="accounting",HF696=i&&(t.department_id="",t.created_by="",1),HF694=k&&(t.due="",e.users514||(t.cs=""),1),HF789=a==="advance"&&(t.f678_customer="",t.status="",t.department_id="",t.created_by="",1),_=(v,j)=>v===j?"selected":"",A=e.customers||[],d=e.cs_names||[];return`<div class="fbar fbar-grid${i?" fbar-doc":""}${k?" fbar-acc523":""}${a==="advance"?"":SCC593(e)}" id="ch-fbar">
    <input class="inp inp-search" data-f="q" value="${n(t.q||"")}"
      placeholder="${k?"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E17\u0E38\u0E01\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C : Invoice / Job / \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / B/L / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 / \u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19 / USER / \u0E2A\u0E16\u0E32\u0E19\u0E30":"\u0E04\u0E49\u0E19\u0E2B\u0E32: Invoice / SRC / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Job / B/L / Master / \u0E43\u0E1A\u0E02\u0E19 / Case / APL / \u0E15\u0E39\u0E49"}">${a==="advance"?FI678(t):""}
    <select class="sel" data-f="customer">
      <option value="">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      ${A.map(v=>`<option value="${n(v.id)}" ${_(v.id,t.customer)}>${n(v.name)}${v.active===!1?" (\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19)":""}</option>`).join("")}
    </select>${k||i?CBH523(t):""}
    ${i?"":`${a==="advance"?"":`<select class="sel" data-f="status">
      <option value="">Status \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      <option value="OPEN" ${_("OPEN",t.status)}>OPEN</option>
      <option value="PROCESSING" ${_("PROCESSING",t.status)}>PROCESSING</option>
      <option value="CLOSE" ${_("CLOSE",t.status)}>CLOSE</option>
      <option value="CANCELED" ${_("CANCELED",t.status)}>CANCELED</option>
    </select>`}
    ${e.users514?USR514(e.users514,t,_):k?"":`<select class="sel" data-f="cs">
      <option value="">CS \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      ${d.map(v=>`<option value="${n(v)}" ${_(v,t.cs)}>${n(v)}</option>`).join("")}
    </select>`}
    ${k?"":`<select class="sel" data-f="due">
      <option value="">Due Date \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      <option value="overdue" ${_("overdue",t.due)}>\u0E40\u0E01\u0E34\u0E19 Due (\u0E22\u0E31\u0E07\u0E04\u0E49\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30)</option>
      <option value="today" ${_("today",t.due)}>\u0E04\u0E23\u0E1A\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49</option>
      <option value="1-7" ${_("1-7",t.due)}>\u0E43\u0E01\u0E25\u0E49\u0E04\u0E23\u0E1A 1\u20137 \u0E27\u0E31\u0E19</option>
      <option value="8-30" ${_("8-30",t.due)}>\u0E04\u0E23\u0E1A\u0E43\u0E19 8\u201330 \u0E27\u0E31\u0E19</option>
      <option value="30+" ${_("30+",t.due)}>\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 30 \u0E27\u0E31\u0E19</option>
    </select>`}`}
    ${i?MS696(t,e):a==="advance"?"":SC593(t,e,_)}
    <input class="inp" type="date" data-f="from" value="${n(t.from||"")}" title="Date From">
    <input class="inp" type="date" data-f="to" value="${n(t.to||"")}" title="Date To">
    <button class="btn btn-o btn-sm${i||k?" tb-btn tb-clear":""}" id="ch-clear">\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07</button>${k||a==="advance"/* V.884 */?`<button type="button" class="btn btn-sm tb-btn rf828" id="ch-rf828" title="\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 (\u0E04\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07 / \u0E41\u0E16\u0E1A / \u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E07)"><svg class="rf828-i" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><span>\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A</span></button>`:""}${a==="advance"?XB734("ch-xl734")+RB788():""}
    ${i?`<div class="fbar-acts">${kt(o)}</div>`:""}
  </div>`}var Jt='<th class="sortable" data-sort="date" data-col-key="date">Date \u21C5</th>',le='<th class="sortable" data-sort="invoice_no" data-col-key="source_invoice_no">Invoice No. \u21C5</th>',F=["\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19","\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice","\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32","Customer Job No.","\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32","Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)","House B/L No.","Master B/L No.","Booking No.","\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel","\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49","ETD","ETA","\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A","\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32","\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A","\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07","\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19","\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19","\u0E42\u0E2D\u0E17\u0E35 NJ","0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32","0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"],Ft=["Booking No.","\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel","\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A"],de=Ft.map(t=>F.indexOf(t)),re=["job_no","company_invoice","customer_name","customer_job_no","customs_declaration_no","source_invoice_no","house_bl_no","master_bl_no","booking_no","vessel_name","qty_container","etd","eta","delivery_date","doc_overtime","doc_mass","doc_travel","doc_print","doc_labor","doc_ot_nj","doc_0409_cust","doc_0409_nocollect"],ue=t=>re[F.indexOf(t)]||"",Wt=t=>`<th${t==="\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49"?' class="r"':""} data-col-key="${ue(t)}">${t}</th>`,_e=F.map(Wt).join(""),He=F.filter(t=>!Ft.includes(t)).map(Wt).join(""),at='<th class="center col-act" data-col-key="_actions" data-col-export="no">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>',p=t=>t===!0?"\u2713":"-",be=(t,e)=>String(t??"").split(",").map(a=>a.trim()).filter(Boolean).map(a=>a==="\u0E2D\u0E37\u0E48\u0E19"&&e&&String(e).trim()!==""?String(e).trim():a).join(", "),pe=(t,e)=>t==="\u0E2D\u0E37\u0E48\u0E19"&&e&&String(e).trim()!==""?String(e).trim():t||"-";var fe=new Set(["\u0E19\u0E32\u0E22","\u0E19\u0E32\u0E07","\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27","\u0E19.\u0E2A.","\u0E19.\u0E2A","mr","mr.","mrs","mrs.","ms","ms.","miss"]);function Kt(t){let e=String(t??"").trim().split(/\s+/).filter(Boolean);for(;e.length>1&&fe.has(e[0].toLowerCase());)e.shift();return e[0]||"-"}var zt=t=>XD742(t,ZT710(t,[{l:t==="ADVANCE"?"AD":"JOB NJ",attr:t==="SERVICE"?' data-dp740-h="1"':"",c:e=>`<td class="nowrap">${t==="SERVICE"?DPC740(e):""}<b>${n(e.job_no||"-")}</b></td>`},{l:"\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",c:e=>`<td class="nowrap">${S(e.job_date)}</td>`,def:1},{l:"\u0E42\u0E2B\u0E21\u0E14",c:e=>`<td class="nowrap">${n(e.data_type||"-")}</td>`,def:1},{l:"\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",c:e=>`<td class="nowrap">${n((t==="SERVICE"?CAT512(e.job_category):e.job_category)||"-")}</td>`,def:1},{l:"\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19",c:e=>N(be(e.agency_via,e.agency_via_other)||"-",140),def:1},{l:"\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",c:e=>N(pe(e.permit_name,e.permit_name_other),140),def:1},{l:"\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19",c:e=>`<td class="center">${p(e.doc_exempt)}</td>`,def:1},{l:"\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08",c:e=>`<td class="center">${p(e.doc_inspect)}</td>`,def:1},{l:"FCL",c:e=>`<td class="center">${p(e.cargo_fcl)}</td>`,def:1},{l:"LCL",c:e=>`<td class="center">${p(e.cargo_lcl)}</td>`,def:1},{l:"FZ",c:e=>`<td class="center">${p(e.cargo_fz)}</td>`,def:1},{l:"FZ+FZ",c:e=>`<td class="center">${p(e.cargo_fz_fz)}</td>`,def:1},{l:"\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21",c:e=>`<td class="center">${p(e.doc_fee)}</td>`,def:1},{l:"\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32",c:e=>`<td class="center">${p(e.doc_overtime)}</td>`,def:1},{l:"\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A",c:e=>`<td class="center">${p(e.doc_mass)}</td>`,def:1},{l:"\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07",c:e=>`<td class="center">${p(e.doc_travel)}</td>`,def:1},{l:"\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19",c:e=>`<td class="center">${p(e.doc_print)}</td>`,def:1},{l:"\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19",c:e=>`<td class="center">${p(e.doc_labor)}</td>`,def:1},{l:"\u0E42\u0E2D\u0E17\u0E35 NJ",c:e=>`<td class="center">${p(e.doc_ot_nj)}</td>`,def:1},{l:"0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",c:e=>`<td class="center">${p(e.doc_0409_cust)}</td>`,def:1},{l:"0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",c:e=>`<td class="center">${p(e.doc_0409_nocollect)}</td>`,def:1},{l:"\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",c:e=>N(e.company_invoice,130)},{l:"\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",c:e=>N(e.customs_declaration_no,130)},{l:"Invoice No.",c:e=>N(e.source_invoice_no,120)},{l:"House B/L No.",c:e=>N(e.house_bl_no,130)},{l:"Master B/L No.",c:e=>N(e.master_bl_no,130)},{l:"Booking No.",c:e=>N(e.booking_no,120),def:1},{l:"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49",c:e=>`<td class="r">${e.qty_container??"-"}</td>`,r:1},{l:"ETA",c:e=>`<td class="nowrap">${S(e.eta)}</td>`},{l:"ETD",c:e=>`<td class="nowrap">${S(e.etd)}</td>`},{l:"\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22",c:e=>`<td class="nowrap">${S(e.release_date)}</td>`,def:1},{l:"\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A",attr:t==="SERVICE"?' style="text-align:center"':""/* V.782 */,c:e=>`<td class="${t==="SERVICE"?"center ":""}nowrap">${S(e.delivery_date)}</td>`,def:1},{l:"ETD\u200B",c:e=>`<td class="nowrap">${S(e.etd)}</td>`,def:1}/* V.908 : ETD ต่อจากวันส่งมอบ (ETD ของ JOB ต้นฉบับ · ไม่มีข้อมูล = ช่องว่าง) */,{l:"\u0E17\u0E48\u0E32\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32",c:e=>N(e.import_port,140),def:1},{l:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Lift On / Wharf",c:e=>N(e.lift_on_wharf_note||(e.lift_on_wharf_flag===!0?"\u2713":""),160),def:1},{l:"\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 Storage Charge",c:e=>N(e.storage_charge_note||(e.storage_charge_flag===!0?"\u2713":""),160),def:1},{l:"\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",c:e=>N(e.customer_name,180)},{l:"Customer Job No.",c:e=>N(e.customer_job_no,120)},{l:"\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",c:e=>N(e.note,160),def:1},{l:"USER",attr:' data-col-key="created_by_name" data-col-export="no"',c:e=>`<td class="nowrap ch-user" title="\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19">${n(NN586(e))}</td>`}])),ve=t=>zt(t).map(e=>`<th${e.r?' class="r"':""}${e.def?' data-col-default="hidden"':""}${e.attr||""}>${e.l}</th>`).join("")+at,he='<th data-col-key="operational_status">Status</th><th data-col-key="_remaining">Remaining</th>'+Jt+le+'<th data-col-key="case_no">Case</th><th data-col-key="contact">Contact</th>',me='<th class="r" data-col-key="service_amount">Service charge</th><th class="r" data-col-key="advance_amount">Advance</th><th class="r" data-col-key="vat_amount">VAT 7%</th><th class="r" data-col-key="subtotal">Amount</th><th class="r" data-col-key="wht_amount">WHT 3%</th><th class="r" data-col-key="net_payable" title="Net Payable = Gross \u2212 WHT">Total Amount</th>',ye='<th class="r" data-col-key="advance_amount">Advance</th><th class="r" data-col-key="vat_amount">VAT 7%</th><th class="r" data-col-key="subtotal">Amount</th><th class="r" data-col-key="wht_amount">WHT 3%</th><th class="r" data-col-key="net_payable" title="Net Payable = Gross \u2212 WHT">Total Amount</th>',xt='<th data-col-key="billing_note_no">Billing Note no.</th>',Ht='<th data-col-key="created_by_name" data-col-export="no">\u0E0A\u0E37\u0E48\u0E2D USER</th>',qt=t=>`<td class="nowrap" title="\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19">${n(NN586(t))}</td>`,Bt=t=>t.billing_note_no?`<td class="nowrap t-b"${t.billing_note_label&&t.billing_note_label!==t.billing_note_no?` title="Billing Note no. ${n(t.billing_note_no)}"`:""}>${n(t.billing_note_label||t.billing_note_no)}</td>`/* V.642 : I NO. (APL I BILLING) / Case NO. (MAERSK CASE NO) · ว่าง = เลข Billing Note เดิม */:'<td class="nowrap"><span class="acc499-wait">\u0E23\u0E2D POST</span></td>',IV499=t=>String(t.invoice_status||"").toUpperCase()==="POSTED"&&t.invoice_no?`<td class="nowrap t-b">${n(t.invoice_no)}</td>`:`<td class="nowrap"><span class="acc499-wait">\u0E23\u0E2D POST</span>${t.invoice_no?`<div class="t-xs t-3">\u0E23\u0E48\u0E32\u0E07 : ${n(t.invoice_no)}</div>`:""}</td>`,IVH499='<th class="sortable" data-sort="invoice_no" data-sort-first="asc" data-col-key="invoice_no">Invoice No.</th>',ACH499='<th class="col-act" data-col-key="_act" data-col-export="no">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>',ACT499=(t,a)=>{let p=String(t.invoice_status||"").toUpperCase()==="POSTED",w="";/* V.641 : ✅ ปิดงาน ตาม Flow เดิม (ไม่บังคับ POST BILLING ก่อน) · POST BILLING = ปิดงานอัตโนมัติที่ Backend */if(p&&t.acc_hold)w='<span class="acc499-ok">\u2705 POST \u0E41\u0E25\u0E49\u0E27</span>'+(a&&a.invoice?`<button class="btn btn-green btn-sm" data-act="acchand" data-id="${n(t.id)}" data-inv="${n(t.invoice_id||"")}" title="\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 \u2014 \u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 FINANCE (\u0E40\u0E25\u0E02\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23/\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48)">\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19</button>`:"");else if(p)w=`<span class="acc499-done" title="${t.acc_handoff_at?"\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D "+n(S(t.acc_handoff_at))+(t.acc_handoff_by_name?" \xB7 "+n(t.acc_handoff_by_nickname||t.acc_handoff_by_name):""):"\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 FINANCE \u0E01\u0E48\u0E2D\u0E19\u0E21\u0E35\u0E1B\u0E38\u0E48\u0E21\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"}">\u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27</span>${t.acc_handoff_at?`<div class="t-xs t-3">${n(S(t.acc_handoff_at))}</div>`:""}`;else if(t.operational_status==="CANCELED"||!a||!a.invoice)w='<span class="t-xs t-3">\u2014</span>';else w=`<button class="btn btn-p btn-sm" data-act="accpost" data-id="${n(t.id)}" title="\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01 INVOICE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E27\u0E08\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 POST (\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21)">\u2B06 POST</button>`;return`<td class="col-act"><div class="ch-act acc499-act">${w}</div></td>`},TB499=(k,c668,dc685,o888,e888)=>'<div class="rep-tabs acc499-tabs" id="acc499-tabs">'+(dc685?[["","\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"],["wait","\u0E23\u0E2DPOST"],["posted","POST \u0E41\u0E25\u0E49\u0E27"]]:[["","\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19)"],["wait","\u0E23\u0E2D POST"],["posted","\u2705 POST \u0E41\u0E25\u0E49\u0E27 \u00B7 \u0E23\u0E2D\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"]]).map(([v,l])=>`<button type="button" class="rep-tab${(k||"")===v?" active":""}" data-accq="${v}">${l}${CV668(c668,v)}</button>`).join("")+TX888(k,c668,o888,e888)/* V.888 */+"</div>",QQ499=(o,d,q)=>(o==="accounting"&&d.accq==="done"&&(d.accq=""),o==="accounting")?{"":"acc_active",wait:"pending_invoice",posted:"acc_posted",done:"acc_done",mrg886:"mrg886"/* V.892 : Tab รวม INVOICE = ตัวกรองอีกชุดของตารางหลัก */}[d.accq||""]||q:q,DF602=(o,d)=>o==="advance"?DF789(d,1):o==="document"&&(d.accq==="wait"||d.accq==="posted")?Object.assign({},d.filters,{doc_state:d.accq}):d.filters/* V.602 : DOCUMENT \u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30 (\u0E23\u0E2D POST / POST \u0E41\u0E25\u0E49\u0E27) \u2014 \u0E2A\u0E48\u0E07 doc_state \u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A queue document */,CSS499=()=>{if(document.getElementById("acc499-css"))return;let s=document.createElement("style");s.id="acc499-css";s.textContent=".acc499-wait{display:inline-block;padding:2px 8px;border-radius:999px;background:#FEF3C7;color:#92400E;font-size:12px;font-weight:600;white-space:nowrap}.acc499-ok,.acc499-done{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap}.acc499-ok{background:#DCFCE7;color:#166534}.acc499-done{background:#E0E7FF;color:#3730A3}.acc499-act{display:flex;gap:6px;align-items:center;flex-wrap:nowrap}.acc499-tabs{margin:8px 0 0;flex-wrap:wrap}.acc499-tabs .cj-n{margin-left:4px;font-weight:700}.tbl-charge.tbl-acc th.col-act,.tbl-charge.tbl-acc td.col-act{min-width:0;width:1%;white-space:nowrap}.tbl-charge.tbl-acc td.col-act .ch-act{justify-content:flex-start}.ch-tools.acc500{padding:6px 10px;gap:6px;flex-wrap:wrap}.acc499-tabs{margin:4px 0 0!important}.acc499-tabs .rep-tab{padding:4px 12px;min-height:0;line-height:1.35}.ch-tools.acc500>.ch-bulk{margin:0 auto 0 0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;position:static;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ch-tools.acc500>.ch-bulk.has-sel{background:none;border:0}.ch-tools.acc500>.ch-bulk .ch-bulk-sub{display:none}.ch-tools.acc500>.ch-bulk:not(.has-sel) .ch-bulk-info{display:none}.ch-tools.acc500>.ch-bulk .ch-bulk-info{width:auto;flex-direction:row}.ch-tools.acc500>.ch-bulk .ch-bulk-n{font-size:13px;color:#1d4ed8;white-space:nowrap}.ch-tools.acc500>.ch-bulk .ch-bulk-acts{width:auto;gap:6px;flex-wrap:wrap}.ch-tools.acc500>.ch-bulk .ch-bulk-acts .btn{min-height:30px;padding:4px 10px;flex:0 0 auto}.ch-tools.acc500>.ch-bulk .ch-bulk-acts .btn-o{color:#334155;background:#fff;border-color:#cbd5e1}.ch-tools.acc500>.ch-bulk .ch-bulk-acts {gap:8px;align-items:center}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-clear,.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-bill,.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-print{height:34px;min-height:34px;padding:0 14px;border-radius:8px;border:1px solid transparent;color:#fff;font-size:13px;font-weight:600;line-height:1;gap:6px;opacity:1;filter:none;box-shadow:0 1px 2px rgba(15,23,42,.12);transition:background-color .15s,border-color .15s,box-shadow .15s}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-clear{background:#dc2626;border-color:#dc2626}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-clear:not(:disabled):hover{background:#b91c1c;border-color:#b91c1c}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-clear:disabled{background:#dc2626;border-color:#dc2626;color:#fff;opacity:.5;cursor:not-allowed;box-shadow:none}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-bill{background:#1d5fd6;border-color:#1d5fd6}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-bill:not(:disabled):hover{background:#164cb0;border-color:#164cb0}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-bill:disabled{background:#1d5fd6;border-color:#1d5fd6;color:#fff;opacity:.5;cursor:not-allowed;box-shadow:none}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-print{background:#16a34a;border-color:#16a34a}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-print:not(:disabled):hover{background:#15803d;border-color:#15803d}.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-print:disabled{background:#cbd5e1;border-color:#cbd5e1;color:#fff;opacity:1;cursor:not-allowed;box-shadow:none}@media(max-width:760px){.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-clear,.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-bill,.ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-bulk-print{height:36px;min-height:36px}}@media(max-width:760px){.ch-tools.acc500>.ch-bulk{width:100%;margin:0}.ch-tools.acc500>.ch-bulk .ch-bulk-acts{width:100%}.ch-tools.acc500>.ch-bulk .ch-bulk-acts .btn{flex:1 1 auto;min-height:36px}}";document.head.appendChild(s)},Yt='<th data-col-key="i_billing_apl">I BILLING APL</th><th data-col-key="due_date">Due Date</th><th data-col-key="note">NOTE</th>',Ee=Yt+at,Zt='<th data-col-key="job_no">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th data-col-key="customer_name">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th data-col-key="customer_job_no">Customer Job No.</th>'+Jt+'<th data-col-key="operational_status">\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="r" data-col-key="advance_amount">Advance</th><th class="r" data-col-key="_adv_cost">Cost</th><th class="r" data-col-key="_adv_charge">Charge</th><th class="r" data-col-key="net_payable" title="Net Payable = Gross \u2212 WHT">Total</th><th data-col-key="note">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</th>',$e='<th data-col-key="doc_overtime">\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</th><th data-col-key="doc_mass">\u0E04\u0E48\u0E32\u0E41\u0E21\u0E2A</th><th data-col-key="doc_travel">\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07</th><th data-col-key="doc_print">\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E49\u0E19</th><th data-col-key="doc_labor">\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</th><th data-col-key="doc_ot_nj">\u0E42\u0E2D\u0E17\u0E35 NJ</th><th data-col-key="doc_0409_cust">0409 \u0E40\u0E01\u0E47\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th data-col-key="doc_0409_nocollect">0409 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</th>',Ce=t=>`<td class="center">${p(t.doc_overtime)}</td><td class="center">${p(t.doc_mass)}</td><td class="center">${p(t.doc_travel)}</td><td class="center">${p(t.doc_print)}</td><td class="center">${p(t.doc_labor)}</td><td class="center">${p(t.doc_ot_nj)}</td><td class="center">${p(t.doc_0409_cust)}</td><td class="center">${p(t.doc_0409_nocollect)}</td>`,Ne=Zt+at,Ut='<th class="center col-sel" data-col-req="1" data-col-key="_select" data-col-export="no" title="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"><input type="checkbox" class="ch-cb" id="ch-sel-all" aria-label="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49"></th>';function Ie(t,e,q896){let a=String(t.invoice_status||"").toUpperCase(),o=!!t.invoice_id;if(o&&(a==="POSTED"||a==="ISSUED"))return{kind:"print"};/* V.896 : \u0E41\u0E17\u0E47\u0E1A "\u0E23\u0E27\u0E21 INVOICE" \u2014 \u0E23\u0E48\u0E32\u0E07 DRAFT- \u0E02\u0E2D\u0E07 JOB \u0E17\u0E35\u0E48\u0E23\u0E2D\u0E23\u0E27\u0E21\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 = \u0E15\u0E34\u0E4A\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E27\u0E21\u0E2D\u0E2D\u0E01 INVOICE \u0E40\u0E14\u0E35\u0E22\u0E27\u0E44\u0E14\u0E49 */if(q896==="mrg886"&&o&&a==="DRAFT"){let n896=String(t.invoice_no||"").trim();if(!n896||/^DRAFT-/i.test(n896))return t.operational_status==="CANCELED"?{kind:"",why:"\u0E07\u0E32\u0E19\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u2014 \u0E2D\u0E2D\u0E01 INVOICE \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"}:!e||!e.invoice?{kind:"",why:"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E2D\u0E01 INVOICE"}:{kind:"bill"}}if(o&&a==="DRAFT"){let i=String(t.invoice_no||"").trim();return i&&!/^DRAFT-/i.test(i)?{kind:"print"}:{kind:"",why:"\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07\u0E04\u0E49\u0E32\u0E07 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E25\u0E30\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}}return o?{kind:"",why:"\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE \u0E19\u0E35\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"}:t.operational_status==="CANCELED"?{kind:"",why:"\u0E07\u0E32\u0E19\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u2014 \u0E2D\u0E2D\u0E01 INVOICE \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"}:!e||!e.invoice?{kind:"",why:"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E2D\u0E01 INVOICE"}:{kind:"bill"}}function Se(t,e,q896){let a=Ie(t,e,q896);return a.kind?`<td class="center col-sel"><input type="checkbox" class="ch-cb" data-cb data-kind="${a.kind}" data-id="${n(t.id)}" data-inv="${n(t.invoice_id||"")}" data-job="${n(t.job_no||"")}" data-cust="${n(t.customer_name||"")}" aria-label="\u0E40\u0E25\u0E37\u0E2D\u0E01 ${n(t.job_no||"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49")}"></td>`:`<td class="center col-sel"><span class="ch-cb-x" title="${n(a.why||"")}">\u2013</span></td>`}function nt(t,e){return e==="document"?ve(t):t==="ADVANCE"&&e==="accounting"?Ut+Zt+NH511()+$e+IVH499+xt+Ht+ACH499:t==="ADVANCE"&&(e==="advance"||e==="closed")?(e==="advance"?RH788()+IH791()+JH792()+BH520+FA734(ZA694(JX792(Zt)))+at:Ne):(e==="accounting"?Ut:"")+(e==="accounting"&&t==="SERVICE"?XH742a():_e)+(e==="accounting"&&t==="SERVICE"?XH742b():he)+(t==="SERVICE"?me:ye)+(e==="accounting"?xt+(t==="SERVICE"?CH830():"")+Yt+Ht+ACH499:Ee)}var Xt=(t,e)=>(nt(t,e).match(/<th/g)||[]).length;function Gt(t){let e;t.invoice_id?t.invoice_status==="VOID"?e='<span class="st-sub st-sub-void">VOID</span>':e=`<span class="st-sub st-sub-${n((t.payment_status||"UNPAID").toLowerCase())}">${n(t.payment_status||"UNPAID")}</span>`:e='<span class="st-sub st-sub-none">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>';let a=t.document_status==="DRAFT"?'<span class="bdg bdg-due-ok">DRAFT</span>':"";let cx893=String(t.operational_status||"")==="CANCELED"?'<span class="bdg bdg-cx893" title="JOB \u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u2014 \u0E40\u0E01\u0E47\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E44\u0E27\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 JOB</span>':"";/* V.893 */return`<td class="col-status">${ht(t.operational_status)}${cx893}${a}<div>${e}</div></td>`}function ke(t){let e=t.invoice_no?`<span class="t-b">${n(t.invoice_no)}</span>`:'<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>',a=t.source_invoice_no?`<div class="inv-src" title="\u0E40\u0E25\u0E02 Invoice \u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21/\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07">SRC: ${n(t.source_invoice_no)}</div>`:"";return`<td class="nowrap col-inv">${e}${a}</td>`}var N=(t,e)=>`<td class="ellip" style="max-width:${e}px" title="${n(t||"")}">${n(t||"-")}</td>`;function Qt(t,e,a,o,q896){let i=N,k=[`<td class="nowrap"><b>${n(t.job_no||"-")}</b></td>`,i(t.company_invoice,130),i(t.customer_name,180),i(t.customer_job_no,120),i(t.customs_declaration_no,130),i(t.source_invoice_no,120),i(t.house_bl_no,130),i(t.master_bl_no,130),i(t.booking_no,120),i(t.vessel_name,140),`<td class="r">${t.qty_container??"-"}</td>`,`<td class="nowrap">${S(t.etd)}</td>`,`<td class="nowrap">${S(t.eta)}</td>`,`<td class="nowrap">${S(t.delivery_date)}</td>`,`<td class="center">${p(t.doc_overtime)}</td>`,`<td class="center">${p(t.doc_mass)}</td>`,`<td class="center">${p(t.doc_travel)}</td>`,`<td class="center">${p(t.doc_print)}</td>`,`<td class="center">${p(t.doc_labor)}</td>`,`<td class="center">${p(t.doc_ot_nj)}</td>`,`<td class="center">${p(t.doc_0409_cust)}</td>`,`<td class="center">${p(t.doc_0409_nocollect)}</td>`],_=(o==="accounting"&&e==="SERVICE"?XK742(k,t):k).join(""),A=k.filter((w,B)=>!de.includes(B)).join(""),d=o==="accounting"?Se(t,a,q896):"",v=()=>o==="accounting"?"":j(!1),j=w=>w?`<td class="col-act center"><div class="row-menu">
         <button class="btn-dots" data-rowmenu aria-label="\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23">\u22EE</button>
         <div class="row-drop">${Rt(t,a,o)}</div>
       </div></td>`:`<td class="col-act"><div class="ch-act">${Rt(t,a,o)}</div></td>`;if(o==="document")return`<tr data-row="${t.id}" data-status="${n(t.operational_status)}" data-inv="${n(t.invoice_id||"")}"${t.returned_at&&String(t.operational_status||"")!=="CLOSE"&&String(t.invoice_status||"").toUpperCase()!=="POSTED"?' data-ret="1"':""}>${zt(e).map(w=>w.c(t)).join("")+j(!1)}</tr>`;let V=Gt(t)+`<td>${vt(t.due_date,t)}</td>
     <td class="nowrap">${S(t.date)}</td>`+(o==="accounting"?IV499(t)+(e==="SERVICE"?XB742(t)+XC829(t):""):ke(t))+`<td>${n(t.case_no||"-")}</td>
     <td class="ellip" style="max-width:140px" title="${n(t.contact||"")}">${n(t.contact||"-")}</td>`,C=`<td class="r">${f(t.service_amount)}</td>
      <td class="r">${f(t.advance_amount)}</td>
      <td class="r">${f(t.vat_amount)}</td>
      <td class="r">${f(t.subtotal)}</td>
      <td class="r">${f(t.wht_amount)}</td>
      <td class="r t-b" title="Gross ${f(t.gross_total)} \u2212 WHT ${f(t.wht_amount)}">${f(t.net_payable)}</td>`,q=`<td class="r">${f(t.advance_amount)}</td>
      <td class="r">${f(t.vat_amount)}</td>
      <td class="r">${f(t.subtotal)}</td>
      <td class="r">${f(t.wht_amount)}</td>
      <td class="r t-b" title="Gross ${f(t.gross_total)} \u2212 WHT ${f(t.wht_amount)}">${f(t.net_payable)}</td>`,M=`<td>${n(t.i_billing_apl||"-")}</td>
      <td class="nowrap" title="${t.invoice_status==="ISSUED"?"Due \u0E08\u0E32\u0E01 INVOICE":"Due \u0E08\u0E32\u0E01\u0E07\u0E32\u0E19"}">${S(t.due_date)}</td>
      <td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${t.id}"
        title="${n(t.note||"\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49 NOTE")}">${n(t.note||"\uFF0B NOTE")}</span></td>`+v();if(e==="ADVANCE"){let w=(o==="advance"?RC788(t,a)+IC791(t)+JC792(t)+BN520(t):`<td class="nowrap"><b>${n(t.job_no||"-")}</b></td>`)+i(t.customer_name,200)+(o==="advance"?i(t.customs_declaration_no,130)+i(t.source_invoice_no,130)+i(t.house_bl_no,130)+i(t.master_bl_no,130):"")+i(t.customer_job_no,130)+`<td class="nowrap">${S(t.date)}</td>`+(o==="advance"?GA694(t):Gt(t))+`<td class="r">${f(t.advance_amount)}</td>${o==="advance"?"":`<td class="r t-3" title="\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E07\u0E32\u0E19 \u2014 \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E17\u0E35\u0E48 INVOICE">${t.cost==null?"-":f(t.cost)}</td><td class="r t-3" title="\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E07\u0E32\u0E19 \u2014 \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E17\u0E35\u0E48 INVOICE">${t.charge==null?"-":f(t.charge)}</td>`}<td class="r t-b" title="Gross ${f(t.gross_total)} \u2212 WHT ${f(t.wht_amount)}">${f(t.net_payable)}</td>${o==="advance"?"":`<td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${t.id}"
        title="${n(t.note||"\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49 NOTE")}">${n(t.note||"\uFF0B NOTE")}</span></td>`}`+(o==="accounting"?NR511(t)+Ce(t)+IV499(t)+Bt(t)+qt(t)+ACT499(t,a):"")+v();return`<tr data-row="${t.id}" data-status="${n(t.operational_status)}" data-inv="${n(t.invoice_id||"")}">${d+w}</tr>`}let P=d+_+V+(e==="SERVICE"?C:q)+(o==="accounting"?Bt(t)+(e==="SERVICE"?CC830(t):""):"")+M+(o==="accounting"?qt(t)+ACT499(t,a):"");return`<tr data-row="${t.id}" data-status="${n(t.operational_status)}" data-inv="${n(t.invoice_id||"")}">${P}</tr>`}function Ae(t,e){if(e!=="receipt"&&e!=="advance"||String(x.profile&&x.profile.role)!=="SUPER_ADMIN"||!t.invoice_id)return"";let a=e==="advance"?"ACCOUNTING &gt; ADVANCE":"ACCOUNTING &gt; SERVICE";return ST678(),`<button class="btn btn-sm un678" data-act="backacc" data-id="${n(t.id)}" data-inv="${n(t.invoice_id)}" data-no="${n(t.invoice_no||"")}" title="\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ${a} \u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21">UNPOST</button>`}function Rt(t,e,a){if(a==="advance")return RA694(t,e,a);let o=Ae(t,a),i=Te(t,e,a);return o?o+(/^<span class="t-xs t-3">—<\/span>$/.test(i)?"":i):i}function Te(t,e,a){if(a==="advance"){let _=t.advance_status||"PENDING",A=_==="PENDING"?"PAID":_==="PAID"?"SETTLED":null,d={PAID:"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27",SETTLED:"\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E04\u0E23\u0E1A (\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19)"};return(e.invoice&&A&&String(t.operational_status||"")!=="CANCELED"/* V.893 : JOB ที่ยกเลิกแล้ว ไม่นำกลับเข้ากระบวนการเดิม */?`<button class="btn btn-p btn-sm" data-act="settle" data-id="${t.id}" data-next="${A}">${d[A]}</button>`:'<span class="t-xs t-3">\u2014</span>')+(t.invoice_id?`<button class="btn btn-print btn-sm" data-act="apdoc" data-inv="${t.invoice_id}" data-adv="${n(t.advance_status||"PENDING")}" title="\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32">\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>`:"")}if(a==="closed"){let _=[];return e.edit&&_.push(`<button class="btn btn-p btn-sm" data-act="closejob" data-id="${t.id}"
        title="\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23">\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19</button>`),t.charge_type==="ADVANCE"&&e.invoice&&t.advance_status==="SETTLED"&&_.push(`<button class="btn btn-o btn-sm" data-act="unsettle" data-id="${t.id}"
        title="\u0E22\u0E49\u0E2D\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 PAID \u2014 \u0E07\u0E32\u0E19\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48 FINANCE &gt; ADVANCE">\u21A9 \u0E22\u0E49\u0E2D\u0E19 SETTLED</button>`),_.length?_.join(""):'<span class="t-xs t-3">\u2014</span>'}if(a==="accounting"){let _=[];return t.operational_status!=="CANCELED"&&_.push(`<button class="btn btn-p btn-sm" data-act="bill" data-id="${t.id}"
        title="\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E31\u0E1A">\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02</button>`),t.invoice_id&&e.void&&_.push(`<button class="btn btn-warn-soft btn-sm" data-act="voidinv" data-id="${t.id}"
        data-inv="${t.invoice_id}"
        title="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49 \u2014 \u0E07\u0E32\u0E19\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE</button>`),e.delete&&_.push(`<button class="btn btn-danger-soft btn-sm" data-act="delete" data-id="${t.id}"${t.invoice_id?' data-lock="invoice" title="\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 Invoice \u0E41\u0E25\u0E49\u0E27 \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E1A\u0E44\u0E14\u0E49"':""}>\u{1F5D1} \u0E25\u0E1A</button>`),_.length?_.join(""):'<span class="t-xs t-3">\u2014</span>'}let o=[],i=t.operational_status;if(e.docPanel){let _=(t.charge_type==="SERVICE"||t.charge_type==="ADVANCE")&&t.document_status!=="POSTED";if((t.charge_type==="ADVANCE"||t.charge_type==="SERVICE")&&t.document_status!=="POSTED"&&!t.job_no&&!t.invoice_id&&(i!=="CANCELED"||SU712())&&(e.edit||e.delete||SU712()))return`<button class="btn btn-danger btn-sm" data-act="delete" data-adv699="1" data-ch738="${t.charge_type}" data-id="${t.id}" title="\u0E25\u0E1A\u0E07\u0E32\u0E19 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST)">\u{1F5D1} \u0E25\u0E1A\u0E07\u0E32\u0E19</button>`;return DW712(t,e.edit&&!_&&(i==="OPEN"||i==="PROCESSING")?`<button class="btn btn-green btn-sm" data-act="close" data-id="${t.id}">\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19</button>`:"")}e.create&&o.push(`<button class="btn btn-o btn-sm" data-act="copy" data-id="${t.id}"
      title="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48">\u{1F4CB} COPY</button>`),e.create&&t.charge_type==="SERVICE"&&t.document_status==="DRAFT"&&o.push(`<button class="btn btn-p btn-sm" data-act="post" data-id="${t.id}"
      title="\u0E40\u0E1B\u0E34\u0E14\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E27\u0E08\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19">\u2B06 POST</button>`);let k=t.charge_type==="SERVICE"&&t.document_status!=="POSTED";return e.edit&&!k&&(i==="OPEN"||i==="PROCESSING")&&o.push(`<button class="btn btn-green btn-sm" data-act="close" data-id="${t.id}">\u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19</button>`),e.delete&&!t.invoice_id&&o.push(`<button class="btn btn-danger-soft btn-sm" data-act="delete" data-id="${t.id}">\u{1F5D1} \u0E25\u0E1A</button>`),o.length?o.join(""):'<span class="t-xs t-3">\u2014</span>'}var ct=new Map;function te(t,e,a=""){let o=t+"/"+e+(a?"/"+a:"");return ct.has(o)||ct.set(o,{filters:{q:"",status:"",customer:"",cs:"",due:"",from:"",to:""},sort:a==="document"?"job_no":"date",dir:"desc",page:1,size:pt,options:null}),ct.get(o)}async function ee(t,e,a,el699){try{if(t==="close"){if(CK710(e))return;if(!await O("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 ACCOUNTING)","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E17\u0E33\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27<br><br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 <b>ACCOUNTING</b> \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E2D\u0E2D\u0E2D\u0E01 Invoice \u0E17\u0E31\u0E19\u0E17\u0E35<br>\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E43\u0E1A\u0E40\u0E14\u0E34\u0E21 \u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48<br><br><span style=\"color:#b45309\">ถ้ารายการนอกราคาขายเป็น &quot;เก็บลูกค้าไม่ได้&quot; ทั้งหมด และไม่มียอดที่ต้องวางบิล งานจะเข้า <b>EXPENSES</b> (รายงานค่าใช้จ่ายนอกราคาขาย) แทน — ไม่ส่ง ACCOUNTING</span>"/* V.907 */,"\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"))return;let o=await I("close-"+e,()=>$t(e)),i=o&&o.job_no?" "+o.job_no:"";y(o&&o.dep808?"ปิดงาน"+i+" แล้ว — มัดจำตู้ Customer NJ → CASH ADVANCE (ไม่ส่ง ACCOUNTING)":o&&o.xp907?"ปิดงาน"+i+" แล้ว — นอกราคาขาย เก็บลูกค้าไม่ได้ทั้งหมด → EXPENSES (ไม่ส่ง ACCOUNTING)"/* V.907 */:"\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"+i+" \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E02\u0E49\u0E32 ACCOUNTING \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22","ok")/* V.808 */,a()}else if(t==="reopen"){if(!await O("\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OPEN?"))return;await I("reopen-"+e,()=>R(e,"OPEN")),y("\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),a()}else if(t==="undo"){if(!await O("\u0E16\u0E2D\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E16\u0E2D\u0E22\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 OPEN?"))return;await I("undo-"+e,()=>R(e,"OPEN")),y("\u0E16\u0E2D\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OPEN \u0E41\u0E25\u0E49\u0E27","ok"),a()}else if(t==="cancel"){let o=await tt("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19 (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");if(!o)return;await I("cancel-"+e,()=>R(e,"CANCELED",o)),y("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),a()}else if(t==="delete"&&el699&&el699.dataset&&el699.dataset.adv699==="1"){if(!await O("\u0E25\u0E1A\u0E07\u0E32\u0E19","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48? \u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A"))return;await I("delete-"+e,()=>St(e,"\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E01\u0E48\u0E2D\u0E19 POST (DOCUMENT \u2192 "+(el699.dataset.ch738==="SERVICE"?"SERVICE":"ADVANCE")+")")),y("\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),a()}else if(t==="delete"){let o=await tt("\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E16\u0E32\u0E27\u0E23 (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)");if(!o||!await O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23","\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E47\u0E1A snapshot \u0E44\u0E27\u0E49\u0E43\u0E19 Audit Log) \u2014 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19?","\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23"))return;await I("delete-"+e,()=>St(e,o)),y("\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),a()}}catch(o){if(o&&(t==="delete"||t==="cancel")&&/NJACC_[A-Z0-9_]+:\s*\S/.test(o.message||"")){y((t==="cancel"?"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 JOB":"\u0E25\u0E1A\u0E07\u0E32\u0E19")+"\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 "+String(o.message).replace(/^[\s\S]*?NJACC_[A-Z0-9_]+:\s*/,""),"err");a();return}if(o&&/NJACC_ADV710_NOT_PAID/.test(o.message||"")){y("ปิดงานไม่ได้ — งานนี้มีรายการเบิกเงินสำรองจ่าย ต้องส่งคำขอ → อนุมัติ → จ่ายเงินครบทุกรายการก่อน","err");a();return}if(o&&/NJACC_SERVICE_MUST_POST_BEFORE_CLOSE/.test(o.message||"")){y("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E14 \u2B06 POST \u0E01\u0E48\u0E2D\u0E19","err");return}m(o)}}function oe(t,e,a){let o=document.createElement("div");o.innerHTML=`<div class="fld"><label>NOTE</label>
    <textarea class="inp w100" id="nj-note">${(e||"").replace(/</g,"&lt;")}</textarea></div>`;let i=document.createElement("div");i.innerHTML=`<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
    <button class="btn btn-p" id="nj-note-ok">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>`,mt({title:"\u0E41\u0E01\u0E49\u0E44\u0E02 NOTE",body:o,footer:i}),i.querySelector("#nj-note-ok").onclick=async()=>{try{await I("note-"+t,()=>It(t,o.querySelector("#nj-note").value.trim())),yt(),y("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 NOTE \u0E41\u0E25\u0E49\u0E27","ok"),a()}catch(k){m(k)}}}function ae(t){let e={};return t.querySelectorAll("[data-f]").forEach(a=>{e[a.dataset.f]=a.value.trim()}),e}var Oe="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE \u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 ACCOUNTING";/* ═══ V.803 · RESET SEARCH เมื่อสลับโหมด (DOCUMENT — SERVICE / DOCUMENT — ADVANCE / FINANCE — ADVANCE) : เข้าจากโหมดอื่น = ล้างข้อความค้นหา / Dropdown / วันที่ ทุกช่อง (ค่าเริ่มต้นเหมือน "ล้างตัวกรอง" เดิม) + หน้า 1
   อยู่ในโหมดเดิม (ค้นหา / เปลี่ยนหน้า / แถบย่อย / Refresh / เปิดรายละเอียด JOB แล้วกลับมา) = ไม่ล้าง · ไม่แตะ Sort / จำนวนต่อหน้า / แถบสถานะ / รายการที่เลือก ═══ */
function RS803(d,e,o){try{if(x.rs803&&(o==="advance"||(o||"document")==="document"&&(e==="SERVICE"||e==="ADVANCE"))){Object.keys(d.filters).forEach(k=>d.filters[k]="");d.page=1;o==="advance"&&RS884()/* V.884 */}}catch{}return d}
async function we(t,{charge:e,group:a,mode:o,scope:i}){let _={document:"document",accounting:"pending_invoice",receipt:"receipt_active",advance:"advance_active",closed:"closed"}[o]||null,A=i||null,d=UD810(AF804(RS803(te(e,a,o||"document"),e,o),e,o),e,o)/* V.810 *//* V.803 · V.804 */,v={view:D("view",e,a),create:D("create",e,a),edit:D("edit",e,a),invoice:D("invoice",e,a),void:D("void",e,a),delete:ft(o==="accounting"?"ACCOUNTING":"DOCUMENT"),export:D("export",e,a),docPanel:o==="document"},j=(U.find(c=>c.key===e)||{}).accent||"service",V=Xt(e,o||"document"),C="charge-"+e+"-"+a+"-"+(o||"document"),M={charge:e,group:a,queue:_,scope:A,mode:o||"document",importMode:o==="advance"||o==="receipt"?"accounting":o||"document",filters:d.filters,refresh:()=>h()},P=o==="document"||o==="accounting"||o==="advance"||o==="closed",w=o!=="document"&&o!=="accounting",B=P,st=o==="closed"?U.filter(c=>D("view",c.key,a)):[],ne=st.length<1?"":`<div class="rep-tabs" id="cj-tabs">${st.map(c=>`<button class="rep-tab${c.key===e?" active":""}" data-cjtab="${c.key}">${c.key}<span class="cj-n" id="cj-n-${c.key}"></span></button>`).join("")}</div>`;t.innerHTML=`
    ${ne}
    ${Tt(e,a,v,o||"document")}${o==="advance"?BN850()+TB789(d)+SW836()+RP811()+RP836():""}
    ${w?`<div id="ch-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(Mt(e,o||"document"))}</div></div>`:""}
    ${P?'<div class="ch-panel">'+((o||"document")==="document"?DH683():""):""}
    <div id="ch-filter">${J(d.filters,OP514(d.options,e,o),o||"document",v)}</div>
    
    
    ${o==="accounting"?`<div class="ch-bulk${/^(SERVICE|ADVANCE)$/.test(String(e||"").toUpperCase())?" svc531":""}" id="ch-bulk">
      <div class="ch-bulk-info" id="ch-bulk-info"></div>
      <div class="ch-bulk-acts">
        <button class="btn btn-o btn-sm" id="ch-bulk-clear" disabled>\u0E25\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01</button>
        ${v.invoice?'<button class="btn btn-p" id="ch-bulk-bill" disabled>\u{1F9FE} \u0E2D\u0E2D\u0E01 INVOICE \u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (0)</button>':""}${v.invoice&&e==="SERVICE"?'<button class="btn" id="ch-mrg886" type="button" title="เลือก JOB ที่รอรวมวางบิลหลายรายการ → ตรวจและรวมเป็น INVOICE เดียว">\u{1F9FE} รวมออก INVOICE เดียว</button>':""}
        <button class="btn btn-green" id="ch-bulk-print" disabled>\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C INVOICE \u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (0)</button>${e==="SERVICE"?'<button class="btn btn-green" id="ch-bulk-soa" title="EXPORT EXCEL SOA หลาย JOB · 1 ไฟล์ หลาย Sheet">\u{1F4D7} EXCEL SOA</button>':""}
      </div>
    </div>`:""}
    ${o==="accounting"||o==="document"?TB499(d.accq,C,o==="document"||o==="accounting",o,e):""}<div class="card mt-2" id="ch-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl tbl-charge${o==="accounting"?" tbl-acc":""}${o==="document"?" tbl-doc":""}"><thead><tr>${nt(e,o||"document")}</tr></thead>
      <tbody id="ch-tbody"><tr><td colspan="${V}" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    ${P?"</div>":""}`,t.dataset.chPage=C,jt(t);let it={document:"DOCUMENT_"+e,accounting:"ACCOUNTING_"+e,advance:"FINANCE_ADVANCE",closed:"FINANCE_CLOSE_JOB"}[o]||null;function W(){if(!it)return;let c=t.querySelector("table.tbl-charge"),r=(o||"document")==="document"&&t.querySelector(".ch-panel>.tr685>.tr685-r")||t.querySelector(".fbar-acts")||t.querySelector(".ch-tools")||t.querySelector("#ch-fbar")||null;if(wt({table:c,modeKey:it,host:r,onLayout:()=>HC529(c,it)}),r&&(r.classList.contains("fbar-acts")||r.classList.contains("tr685-r"))){let l=r.querySelector("[data-colmg]");l&&l.classList.add("tb-btn","tb-cols")}if(r&&(o||"document")==="document"&&!r.querySelector('[data-tool="new-job"]')){let l=UP781(t,At(v,e));l&&r.insertAdjacentHTML("beforeend",l)}}let K=null,CNT499=async(tt756,tb825)=>{if(o!=="accounting"&&o!=="document")return;let tk668=t.__cnt668=(t.__cnt668||0)+1;let ks=["","wait","posted"],qs={"":"acc_active",wait:"pending_invoice",posted:"acc_posted",done:"acc_done"},q756=k=>Et({charge:e,group:a,queue:o==="document"?"document":qs[k],scope:A,filters:o==="document"&&k?Object.assign({},d.filters,{doc_state:k}):d.filters,sort:d.sort,dir:d.dir,page:1,size:1,withOptions:!1,withKpi:!1}).then(x=>Number(x&&x.total||0)).catch(()=>null),cu756=d.accq||"",rs;if(tb825&&typeof tb825=="object"&&tb825.mrg888!=null&&isFinite(Number(tb825.mrg888))){CS668(C,["mrg886"],[Number(tb825.mrg888)]);let n888=t.querySelector("#acc499-n-mrg886");n888&&(n888.textContent=Number(tb825.mrg888).toLocaleString("th-TH"))}/* V.888 */if(tb825&&typeof tb825=="object"&&ks.every(k=>tb825[k]!=null&&isFinite(Number(tb825[k]))))rs=ks.map(k=>Number(tb825[k]));/* V.820 (RUN-825) : จำนวนแถบจาก bundle เดียว · ไม่มี (DB เดิม) = วิธีเดิม */else if(ks.indexOf(cu756)>=0&&tt756!=null&&isFinite(Number(tt756))){let n0=Number(tt756),ot756=cu756==="posted"?"wait":"posted",n1=await q756(ot756);rs=n1==null?ks.map(k=>k===cu756?n0:null):cu756===""?[n0,Math.max(0,n0-n1),n1]:cu756==="wait"?[n0+n1,n0,n1]:[n0+n1,n1,n0]}else rs=await Promise.all(ks.map(q756));/* V.756 perf : เดิมยิง 3 RPC (ทั้งหมด / รอ POST / POST แล้ว) ทุกครั้งที่โหลดรายการ — แต่ละตัวสร้างชุดข้อมูลทั้งคิวบน Server (~45–70 ms)
   3 แถบแบ่งชุดเดียวกันแบบไม่ซ้อน (ทั้งหมด = รอ POST + POST แล้ว · ตัวกรอง / ขอบเขต / สิทธิ์เดียวกัน) และแถบที่เปิดอยู่ = total ของรายการที่เพิ่งโหลด
   -> ยิง 1 RPC (แถบคู่) แล้วคำนวณแถบที่เหลือ · ผลตัวเลขเดิม · ไม่มี total = วิธีเดิม 3 RPC */if(t.dataset.chPage!==C||t.__cnt668!==tk668)return;CS668(C,ks,rs);ks.forEach((k,i)=>{let el=t.querySelector("#acc499-n-"+(k||"all"));el&&rs[i]!=null&&(el.textContent!==rs[i].toLocaleString("th-TH")&&(el.textContent=rs[i].toLocaleString("th-TH")),el.classList.contains("p668")&&el.classList.remove("p668"))})};(o==="accounting"||o==="document")&&CSS499();o==="accounting"&&(()=>{let bk=t.querySelector("#ch-bulk"),tl=t.querySelector(".ch-tools");bk&&tl&&(tl.classList.add("acc500"),tl.insertBefore(bk,tl.firstChild))})();{let AQ=t.querySelector("#acc499-tabs");AQ&&AQ.querySelector(".tab888")&&(AQ.style.flexWrap="wrap",AQ.style.overflow="visible",AQ.style.maxWidth="100%",AQ.style.rowGap="6px");/* V.888 : แถบ 4 ปุ่ม — ขึ้นบรรทัดใหม่แทนการตัดปุ่ม */AQ&&(AQ.onclick=c=>{let r=c.target.closest("[data-accq]");if(!r||(d.accq||"")===r.dataset.accq)return;d.accq=r.dataset.accq;d.page=1;delete t.dataset.pnl892;/* V.892 */AQ.querySelectorAll("[data-accq]").forEach(x=>x.classList.toggle("active",x===r));h()})}BD886(t,e,o,{group:a,refresh:()=>h(),q896:()=>d.accq||""/* V.896 */});(o||"document")==="accounting"&&e==="SERVICE"&&(t.addEventListener("click",c886=>{let b886=c886.target.closest&&c886.target.closest("#ch-mrg886");if(!b886)return;c886.preventDefault();if((d.accq||"")==="mrg886"){GO896(t,{group:a,charge:e,refresh:()=>h()});return}/* V.896 : \u0E2D\u0E22\u0E39\u0E48\u0E41\u0E17\u0E47\u0E1A "\u0E23\u0E27\u0E21 INVOICE" = \u0E23\u0E27\u0E21\u0E40\u0E09\u0E1E\u0E32\u0E30 JOB \u0E17\u0E35\u0E48\u0E15\u0E34\u0E4A\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01 */(t.dataset.pnl892="1",h())/* V.892 */}),t.addEventListener("change",c896=>{let x896=c896.target;x896&&x896.matches&&(x896.id==="ch-sel-all"||x896.matches("#ch-tbody input[data-cb]"))&&UP896(t,d.accq||"")}),t.addEventListener("click",c896=>{c896.target.closest&&c896.target.closest("#ch-bulk-clear")&&setTimeout(()=>UP896(t,d.accq||""),0)}));/* V.896 *//* V.886 */(o||"document")==="accounting"&&import("./charge-bulk-CO7UKD3O.js").then(c=>{t.dataset.chPage===C&&(K=c.initChargeBulk(t,{charge:e,group:a,mode:o,perms:v,refresh:()=>h()}))}).catch(c=>m(c,"\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"));let ce=()=>W();if(B&&o!=="advance"){let c=t.querySelector("table.tbl-charge");c&&c.classList.add("rowclick")}W();let z=t.querySelector("#cj-tabs");z&&(z.onclick=c=>{let r=c.target.closest("[data-cjtab]");!r||r.dataset.cjtab===e||we(t,{charge:r.dataset.cjtab,group:a,mode:"closed"})});async function Y(){if(z)try{let c=await Nt(a)||{};U.forEach(r=>{let l=t.querySelector("#cj-n-"+r.key);l&&(l.textContent=" "+Number(c[r.key]||0).toLocaleString("th-TH"))})}catch{}}Y();o==="accounting"&&AO660(e,x=>import("./billing-modal-WWHG6C4U.js").then(b=>b.openBillingModal({jobId:x,charge:e,onSaved:()=>h()})).catch(m));/* V.660 */let D569=null;async function h(c){if(o==="advance"&&(VH836(t,d,a)||VH811(t,d,a)))return;if(TG888(t,(o||"")==="accounting"&&e==="SERVICE"&&t.dataset.pnl892==="1",{group:a,charge:e,refresh:()=>h(),back:()=>{delete t.dataset.pnl892;h()}}))return;/* V.892 : เปิดจากปุ่ม "รวมออก INVOICE เดียว" เท่านั้น ไม่ผูกกับแท็บแล้ว *//* V.888 *//* V.811 · V.836 */FX880(t,{d,o,e,a,A,q:QQ499(o,d,_),h:()=>h()})&&(d.page=1);/* V.880 : ตัวเลือกสัมพันธ์กับ บริษัท + ลูกค้า · ล้างค่าที่ไม่มีรายการรองรับก่อนค้นหา */let r=w&&!(c&&c.kpi===!1),l=gt(C),q569={charge:e,group:a,queue:M.queue=QQ499(o,d,_),scope:A,filters:M.filters=DF602(o,d),sort:d.sort,dir:d.dir,page:d.page,size:d.size,withOptions:!d.options,withKpi:r,tabs499:(o==="accounting"||o==="document")&&!(c&&c.kpi===!1)/* V.820 (RUN-825) : ขอจำนวนแถบมากับ bundle เดียว */},q734=o==="advance"&&(t.__q734=q569),k569=SK569(q569),s569=null,P569=(u,z)=>{D569=k569;let b=t.querySelector("#ch-filter"),g=t.querySelector("#ch-kpi"),L=t.querySelector("#ch-tbody"),s=t.querySelector("#ch-pgn");if(!b||!L||!s||r&&!g)return;u.filter_options&&(d.options=u.filter_options,b.innerHTML=J(d.filters,OP514(d.options,e,o),o||"document",v),Z()),r&&g&&(g.innerHTML=Pt(u.kpi||{},e,o||"document",v));let E=u.rows||[];L.innerHTML=E.length?E.map($=>Qt($,e,v,o||"document",d.accq||"")/* V.896 */).join(""):`<tr><td colspan="${V}" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 \u2014 \u0E25\u0E2D\u0E07\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 "+ \u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"</td></tr>`,Dt(s,{page:d.page,size:d.size,total:u.total||0},({page:$,size:T})=>{d.page=$,d.size=T,h({kpi:!1})},{lp:!0}),K&&K.sync(),UP896(t,d.accq||""),/* V.896 */ce(),o==="document"&&e==="SERVICE"&&DPS740(t,d,C),o==="advance"&&RV788(t,E,v),Vt(),!z&&(o==="accounting"||o==="document")&&!(c&&c.kpi===!1)&&CNT499(u&&u.total,u&&u.tabs499)};if(k569&&k569!==D569){let z=SC569.get(k569);if(z&&Date.now()-z.at<3e5)try{P569(JSON.parse(z.s),!0),s569=z.s}catch{}}try{let u=await Et(q569);if(!et(C,l)||t.dataset.chPage!==C)return;let s9=SV569(u);k569&&s9&&SS569(k569,s9);if(s569&&s9===s569&&!(u&&u.filter_options)){(o==="accounting"||o==="document")&&!(c&&c.kpi===!1)&&CNT499(u&&u.total,u&&u.tabs499);return}P569(u,!1)}catch(u){if(!et(C,l)||(m(u),t.dataset.chPage!==C))return;let b=t.querySelector("#ch-tbody");if(b&&b.querySelector(".spin")){b.innerHTML=`<tr><td colspan="${V}" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 ${n(u&&u.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14")}
          <button type="button" class="btn btn-sm btn-o" data-ch-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>`;let L=b.querySelector("[data-ch-retry]");L&&(L.onclick=()=>{b.innerHTML=`<tr><td colspan="${V}" class="load-row"><div class="spin"></div></td></tr>`,h(c)})}let g=t.querySelector("#ch-kpi");g&&g.querySelector(".skel")&&(g.innerHTML="")}}function Z(){TR685(t,o);PG772(t,o,e,C);o==="advance"&&(XA734(t),RA788(t,{perms:v,refresh:()=>h()}),RA789(t,{state:d,refresh:()=>h()}));let c=t.querySelector("#ch-filter"),r=c.querySelector("#ch-fbar");o==="advance"&&HX884(t,r,d.filters)/* V.884 */;CBI523(r,{charge:e,group:a,scope:A,filters:d.filters,queue:()=>M.queue});MI696(r);r.oninput=l=>{let u=l.target.closest("[data-f]");u&&Lt(C+"-f",()=>{if(!c.isConnected)return;/* V.803 : ออกจากหน้าแล้ว = ยกเลิก */Object.assign(d.filters,ae(c.querySelector("#ch-fbar"))),CF523(d.filters),d.page=1,h()},u.dataset.f==="q"||o==="advance"&&u.classList.contains("inp678")?300:0)/* V.801 */},RF828(c.querySelector("#ch-rf828"),h)/* V.822 : ACCOUNTING — รีเฟรช */;c.querySelector("#ch-clear").onclick=()=>{Object.keys(d.filters).forEach(l=>d.filters[l]=""),UF810(d.filters)/* V.810 */,d.page=1,c.innerHTML=J(d.filters,OP514(d.options,e,o),o||"document",v),Z(),W(),h()};o==="document"&&(e==="SERVICE"||e==="ADVANCE")&&NB759(r,{charge:e,group:a,scope:A,queue:()=>M.queue,filters:d.filters,cats:e==="SERVICE"?()=>FT880(t,(d.options&&d.options.job_categories)||[])/* V.880 */:null,cl906:e==="SERVICE"/* V.906 */})/* V.759 · V.761 : DOCUMENT → ADVANCE แถบเดียวกัน (ไม่มีประเภท) */,o==="document"&&e==="SERVICE"&&CL906(r,()=>d.accq,d.filters)/* V.906 */,o==="document"&&e==="SERVICE"&&ED908(t)/* V.908 */;o==="accounting"&&e==="SERVICE"&&AS804(r,{filters:d.filters,opts:()=>d.options||{}})/* V.804 */;(o==="advance"||o==="accounting"&&(e==="ADVANCE"||e==="SERVICE"))&&FB762(r,Object.assign({charge:e,group:a,scope:A,queue:()=>M.queue},o==="accounting"&&e==="SERVICE"?{qL:"ค้นหาทุกคอลัมน์",coL:"ชื่อบริษัท",coA:"ชื่อบริษัททั้งหมด",p804:1}:{}))/* V.762 · V.804 */;FZ880(t,c)/* V.880 */}FX880(t,{d,o,e,a,A,q:QQ499(o,d,_),h:()=>h()});/* V.880 */Z(),SI513(t),SD513(t,d),t.querySelector("thead").addEventListener("click",c=>{let r=c.target.closest("[data-sort]");if(!r)return;let l=r.dataset.sort;d.sort===l?d.dir=d.dir==="asc"?"desc":"asc":(d.sort=l,d.dir=r.dataset.sortFirst||"desc"),SD513(t,d),d.page=1,h({kpi:!1})});function se(c){if(!B||c.target.closest("button, a, input, select, textarea, label, [data-act], .row-menu")||c.target.closest(".col-sel"))return;let r=c.target.closest("tr[data-row]");if(!r||!r.dataset.row)return;let l=r.dataset.row,u=r.dataset.inv||"";if(o==="closed"){if(u){try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+u}else location.hash="#/job/"+l+"?from=closed";return}if(o==="advance"){/* V.800 : คลิกแถว = INVOICE AD Preview เดิมของ ACCOUNTING — ADVANCE (อ่านอย่างเดียว) */import("./billing-modal-WWHG6C4U.js").then(b=>b.RW800(c,r)).catch(m);return}if(o==="document"){!u||r.dataset.ret==="1"?import("./job-form-4IHODUQT.js").then(b=>b.openNewJobModal({charge:e,group:a,mode:"document",jobId:l,onSaved:()=>h()})).catch(m):location.hash="#/job/"+l+"?from=document";return}!u&&(!v.invoice||r.dataset.status==="CANCELED")||import("./billing-modal-WWHG6C4U.js").then(b=>b.openBillingModal({jobId:l,charge:e,onSaved:()=>h()})).catch(m)}t.querySelector("#ch-tbody").addEventListener("click",c=>{let r=c.target.closest("[data-rowmenu]");if(r){let s=r.parentElement,E=s.classList.contains("open");t.querySelectorAll(".row-menu.open").forEach($=>$.classList.remove("open")),E||s.classList.add("open");return}let l=c.target.closest("[data-act]");if(!l){se(c);return}t.querySelectorAll(".row-menu.open").forEach(s=>s.classList.remove("open"));let u=l.dataset.act,b=l.dataset.id,L={document:["view","copy","post","close","delete","note","del712","cancel"],accounting:["bill","viewinv","note","delete","voidinv","accpost","acchand"],advance:["settle","viewinv","note","apdoc","backacc","pay694","unpay694"],closed:["view","viewinv","closejob","unsettle"]}[o||"document"];if(!(L&&!L.includes(u))){if(u==="del712"){DEL712(b,l,()=>{h();try{Y()}catch(e7){}});return}if(u==="delete"&&l.dataset.lock==="invoice"){y("\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 Invoice \u0E41\u0E25\u0E49\u0E27 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19","err");return}if(u==="post"){import("./job-form-4IHODUQT.js").then(s=>s.openNewJobModal({charge:e,group:a,mode:o||"document",jobId:b,focusPost:!0,onSaved:()=>h()})).catch(s=>m(s,"\u0E40\u0E1B\u0E34\u0E14\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E27\u0E08\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"));return}if(u==="copy"){import("./job-form-4IHODUQT.js").then(s=>s.openNewJobModal({charge:e,group:a,mode:o||"document",copyFromId:b,onSaved:()=>h()})).catch(s=>m(s,"\u0E40\u0E1B\u0E34\u0E14\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"));return}if(u==="closejob"){let s=l.closest("tr[data-row]"),E=s&&(s.querySelector("b")||{}).textContent||"";O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19","\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 <b>"+n(E)+'</b><br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E04\u0E34\u0E27\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E35\u0E01<br><span class="t-xs t-3">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 INVOICE / \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 / Advance \u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E04\u0E23\u0E1A</span>',"\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19").then(async $=>{if($)try{await I("closejob-"+b,()=>Ct(b,null,H())),y("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),h(),Y()}catch(T){m(T)}}).catch(m);return}if(u==="unsettle"){import("./invoice-api-GDLFYXDM.js").then(async s=>{if(await O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 Advance","\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E08\u0E32\u0E01 <b>SETTLED</b> \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 <b>PAID</b><br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48 <b>FINANCE &gt; ADVANCE</b> \u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49","\u0E22\u0E49\u0E2D\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30"))try{await I("unsettle-"+b,()=>s.settleAdvance(b,"PAID",null,H())),y("\u0E22\u0E49\u0E2D\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E07\u0E32\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48 FINANCE > ADVANCE","ok"),h(),Y()}catch($){m($)}}).catch(m);return}if(u==="backacc"){if(o!=="receipt"&&o!=="advance")return;if(String(x.profile&&x.profile.role)!=="SUPER_ADMIN"){y("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}let s=l.dataset.inv;if(!s){y("\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}let E=l.dataset.no||"",$=o==="advance"?"ACCOUNTING &gt; ADVANCE":"ACCOUNTING &gt; SERVICE";import("./invoice-api-GDLFYXDM.js").then(async T=>{if(await O("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B ACCOUNTING \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(E?"<br>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE <b>"+n(E)+"</b> \u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E15\u0E48\u0E2D <b>\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48</b>":"")+"<br>\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 : <b>"+$+"</b>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"))try{await I("backacc-"+s,()=>(o==="receipt"?FB809c:T.unpostToDraft)(s,"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 FINANCE \u0E44\u0E1B ACCOUNTING \u0E42\u0E14\u0E22 SUPER_ADMIN",H())),y(o==="receipt"?"ย้อนกลับ ACCOUNTING — SERVICE แล้ว — INVOICE เลขเดิม คงสถานะ POST · แก้ไขให้กด UNPOST ใน ACCOUNTING — SERVICE":"\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48","ok"),h()}catch(ie){m(ie)}}).catch(m);return}if(u==="pay694"){let no=l.dataset.no||"";O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 PAY","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 ADVANCE \u0E19\u0E35\u0E49\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"+(no?"<br><b>"+n(no)+"</b>":""),"\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 PAY","\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01").then(async ok=>{if(!ok)return;l.disabled=!0;try{await I("pay694-"+b,()=>RPC499("njacc_advance_pay694",{p:{job_id:b,request_id:H()}})),y("PAY \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30 \u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27","ok"),h()}catch(T){l.disabled=!1,m(T)}}).catch(m);return}if(u==="unpay694"){if(String(x.profile&&x.profile.role)!=="SUPER_ADMIN"){y("\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19","err");return}tt("\u21A9 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A PAY "+(l.dataset.no||"")+" (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)").then(async r=>{if(!r)return;try{await I("unpay694-"+b,()=>RPC499("njacc_advance_unpay694",{p:{job_id:b,reason:r,request_id:H()}})),y("\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A PAY \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E04\u0E37\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E48\u0E2D\u0E19 PAY","ok"),h()}catch(T){m(T)}}).catch(m);return}if(u==="settle"){let s=l.dataset.next;import("./invoice-api-GDLFYXDM.js").then(async E=>{if(await O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 Advance","\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19 <b>"+n(s)+"</b>"+(s==="SETTLED"?"<br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B FINANCE &gt; Close Job":""),"\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19"))try{await I("settle-"+b,()=>E.settleAdvance(b,s,null,H())),y("\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E25\u0E49\u0E27","ok"),h()}catch(T){m(T)}}).catch(m);return}if(u==="apdoc"){let s=l.dataset.inv;if(!s)return;let E=l.dataset.adv||null;Promise.all([import("./invoice-api-GDLFYXDM.js"),import("./advance-doc-GD25ZQSU.js")]).then(async([$,T])=>{let bt=await $.invoiceView(s);T.openAdvanceDoc(bt,{advanceStatus:E})}).catch(m);return}if(u==="view"){let s=o||"document",E=l.dataset.locked==="1";s==="document"&&!E?import("./job-form-4IHODUQT.js").then($=>$.openNewJobModal({charge:e,group:a,mode:s,jobId:b,onSaved:()=>h()})).catch(m):location.hash="#/job/"+b+"?from="+s}else if(u==="edit")location.hash="#/job/"+b+"/edit?mode="+(o||"document");else if(u==="accpost")import("./billing-modal-WWHG6C4U.js").then(s=>s.openBillingModal({jobId:b,charge:e,onSaved:()=>h()})).catch(m);else if(u==="acchand"){let s=l.closest("tr[data-row]"),E=s&&(s.querySelector("b")||{}).textContent||"",F=e==="ADVANCE"?"FINANCE &gt; ADVANCE":"FINANCE &gt; RECEIPT";O("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19","\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 <b>"+n(E)+"</b> (POST \u0E41\u0E25\u0E49\u0E27)<br>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 ACCOUNTING \u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23 \u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 <b>"+F+"</b><br><span class=\"t-xs t-3\">\u0E40\u0E25\u0E02 JOB \u00B7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u00B7 \u0E40\u0E25\u0E02 INVOICE / BILLING NOTE \u00B7 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22 \u00B7 \u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19 \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 POST \u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E04\u0E23\u0E1A \u00B7 \u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48 \u00B7 \u0E14\u0E39\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E41\u0E17\u0E47\u0E1A \u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27</span>","\u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19").then(async $=>{if($)try{let T=await I("acchand-"+b,()=>RPC499("njacc_acc_handoff",{p:{job_id:b,request_id:H()}}));y("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 "+(T&&T.job_no||E)+" \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 "+(e==="ADVANCE"?"FINANCE \u203A ADVANCE":"FINANCE \u203A RECEIPT")+" \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22","ok"),h()}catch(T){let x=String(T&&T.message||"");/NJACC_ACC_ALREADY_CLOSED/.test(x)?(y("\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),h()):/NJACC_ACC_NEED_BILLING/.test(x)?y("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07 POST BILLING PDF \u0E01\u0E48\u0E2D\u0E19 (POST \u0E41\u0E25\u0E49\u0E27\u0E23\u0E30\u0E1A\u0E1A\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34)","err"):/NJACC_ACC_NOT_POSTED/.test(x)?y("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E14 \u2B06 POST \u0E01\u0E48\u0E2D\u0E19","err"):m(T)}}).catch(m)}else if(u==="bill")import("./billing-modal-WWHG6C4U.js").then(s=>s.openBillingModal({jobId:b,charge:e,onSaved:()=>h()})).catch(m);else if(u==="viewinv")if(o==="accounting"){if(!b){y("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}import("./billing-modal-WWHG6C4U.js").then(s=>s.openBillingModal({jobId:b,charge:e,onSaved:()=>h()})).catch(m)}else{try{sessionStorage.setItem("nj-inv-from",location.hash)}catch{}location.hash="#/invoice/"+l.dataset.inv}else if(u==="voidinv"){if(o!=="accounting")return;let s=l.dataset.inv;if(!s){y("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49","err");return}import("./invoice-api-GDLFYXDM.js").then(async E=>{if(await O("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01","\u0E44\u0E21\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"))try{await I("voidinv-"+s,()=>E.voidInvoice(s,Oe,H())),y("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE","ok"),h()}catch(T){m(T,"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 INVOICE \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}).catch(m)}else u==="note"?oe(b,l.textContent.trim()==="\uFF0B NOTE"?"":l.textContent.trim(),()=>h()):ee(u,b,()=>h(),l)}});/* V.569 : กดเมาส์ลงบนแถว (ก่อนปล่อย = ก่อน click ~100ms) → เริ่มโหลดข้อมูลของหน้าต่างที่จะเปิดล่วงหน้า (อ่านอย่างเดียว · args เดียวกับที่หน้าต่างเรียกเอง) */t.querySelector("#ch-tbody").addEventListener("pointerdown",c=>{try{if(c.button!==0||c.target.closest("input, select, textarea, label, .col-sel, [data-rowmenu]"))return;let r=c.target.closest("tr[data-row]");if(!r||!r.dataset.row)return;let l=r.dataset.row,u=r.dataset.inv||"",bt=c.target.closest("[data-act]"),k=bt?bt.dataset.act:"",id=k&&bt.dataset.id||l;if((o||"document")==="document"){if(k?!/^(view|post|copy)$/.test(k):u&&r.dataset.ret!=="1")return;PF569("njacc_job_detail",{p_id:id});PF569("njacc_invoice_draft_view",{p_job:id});import("./job-form-4IHODUQT.js").catch(()=>{})}else if(o==="accounting"){if(k?!/^(bill|viewinv|accpost)$/.test(k):!u&&(!v.invoice||r.dataset.status==="CANCELED"))return;PF569("njacc_job_detail_billing",{p_id:id});PF569("njacc_invoice_draft_view",{p_job:id});PF569("njacc_print_templates_for_print",{});import("./billing-modal-WWHG6C4U.js").catch(()=>{})}}catch{}});let X=document.getElementById("tb-act"),lt=document.getElementById("app-shell");if(X){let c=(o||"document")==="document";X.innerHTML="",X.onclick=null,lt&&lt.classList.toggle("doc-hd",c),lt&&lt.classList.toggle("hd684",o==="accounting"&&/^(SERVICE|ADVANCE)$/.test(String(e||"").toUpperCase()))}let dt=t.querySelector(".ch-tools");dt&&Ot(dt),dt&&lt&&lt.classList.contains("hd684")&&!dt.querySelector(":scope>.dh683")&&dt.insertAdjacentHTML("afterbegin",DH683()),t.__njToolClick&&t.removeEventListener("click",t.__njToolClick),t.__njToolClick=c=>{if(t.dataset.chPage!==C)return;let r=c.target.closest("[data-tool]");r&&ot(r.dataset.tool,M)},t.addEventListener("click",t.__njToolClick);let rt=t.querySelector("#qc-key");rt&&rt.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),ot("quick-close",M))}),t.__njJobSync&&window.removeEventListener(G,t.__njJobSync),window.removeEventListener("njacc:nick-changed",t.__njJobSync),t.__njJobVis&&document.removeEventListener("visibilitychange",t.__njJobVis);let Q=!1,ut=()=>t.dataset.chPage===C&&!!t.querySelector("#ch-tbody"),SL540=0,ST540=null,SY540=()=>{if(ST540)return;ST540=setTimeout(()=>{if(ST540=null,!ut())return;if(document.hidden){Q=!0;return}SL540=Date.now(),h()},Math.max(0,SL540+(window.__NJ_MOBILE?2500:5e3)/* V.855 (Desktop) : รวมสัญญาณ Realtime ที่มาติดกัน (เว้นอย่างน้อย 5 วินาที) */-Date.now()))},_t=()=>{window.removeEventListener(G,t.__njJobSync),window.removeEventListener("njacc:nick-changed",t.__njJobSync),document.removeEventListener("visibilitychange",t.__njJobVis),t.__njJobSync=t.__njJobVis=null};t.__njJobSync=()=>{if(!ut()){_t();return}if(document.hidden){Q=!0;return}SY540()},t.__njJobVis=()=>{if(!(document.hidden||!Q)){if(!ut()){_t();return}Q=!1,h()}},window.addEventListener(G,t.__njJobSync),window.addEventListener("njacc:nick-changed",t.__njJobSync),document.addEventListener("visibilitychange",t.__njJobVis),h()}/* \u2550\u2550\u2550 V.511 ACCOUNTING \u2014 ADVANCE : \u0E40\u0E1E\u0E34\u0E48\u0E21 5 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E08\u0E32\u0E01 DOCUMENT (\u0E42\u0E2B\u0E21\u0E14 \u00B7 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u00B7 Invoice \u00B7 House B/L No. \u00B7 Master B/L No.) \u2550\u2550\u2550
   \u0E43\u0E0A\u0E49 field \u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32 DOCUMENT \u0E02\u0E2D\u0E07 JOB \u0E19\u0E31\u0E49\u0E19 (\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19) \u00B7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 = "-" \u00B7 \u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 */
function NH511() {
  return '<th data-col-key="data_type">\u0E42\u0E2B\u0E21\u0E14</th><th data-col-key="company_invoice">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th><th data-col-key="source_invoice_no">Invoice</th><th data-col-key="house_bl_no">House B/L No.</th><th data-col-key="master_bl_no">Master B/L No.</th>';
}
function NR511(t) {
  return `<td class="nowrap">${n(t.data_type || "-")}</td>` + N(t.company_invoice, 130) + N(t.source_invoice_no, 120) + N(t.house_bl_no, 130) + N(t.master_bl_no, 130);
}

/* \u2550\u2550\u2550 V.512 DOCUMENT \u2014 SERVICE : "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17" \u0E41\u0E2A\u0E14\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E15\u0E2D\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E04\u0E48\u0E32\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19) \u2550\u2550\u2550 */
function CAT512(v) {
  let m = { "HALF (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)": "HALF (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)", "HALF (\u0E04\u0E35\u0E22\u0E4CNJ)": "HALF (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21NJ)", "FULL (\u0E04\u0E35\u0E22\u0E4C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)": "FULL (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32+\u0E1B\u0E25\u0E48\u0E2D\u0E22)", "FULL (\u0E04\u0E35\u0E22\u0E4CNJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)": "FULL (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21NJ+\u0E1B\u0E25\u0E48\u0E2D\u0E22)", "COUNTER (\u0E04\u0E35\u0E22\u0E4C)": "COUNTER (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21)", "COUNTER (\u0E04\u0E35\u0E22\u0E4C+\u0E1B\u0E25\u0E48\u0E2D\u0E22)": "COUNTER (\u0E04\u0E35\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21+\u0E1B\u0E25\u0E48\u0E2D\u0E22)" };
  return v && Object.prototype.hasOwnProperty.call(m, v) ? m[v] : v;
}

/* \u2550\u2550\u2550 V.513 ACCOUNTING \u2014 ADVANCE : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D Invoice No. \u0E01\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07 \u2191 \u0E19\u0E49\u0E2D\u0E22\u2192\u0E21\u0E32\u0E01 / \u2193 \u0E21\u0E32\u0E01\u2192\u0E19\u0E49\u0E2D\u0E22 (\u0E40\u0E23\u0E35\u0E22\u0E07\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E04\u0E35\u0E22\u0E4C\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07 \u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07) \u2550\u2550\u2550 */
function SI513(t) {
  if (!document.getElementById("iv513-css")) {
    let s = document.createElement("style"); s.id = "iv513-css";
    s.textContent = 'th.sortable[data-sort-first]{cursor:pointer;white-space:nowrap}th.sortable[data-sort-first]::after{content:" \u21C5";opacity:.55}th.sortable[data-sort-first][data-dir513="asc"]::after{content:" \u2191";opacity:1}th.sortable[data-sort-first][data-dir513="desc"]::after{content:" \u2193";opacity:1}';
    document.head.appendChild(s);
  }
}
function SD513(t, d) { t.querySelectorAll("th[data-sort-first]").forEach((x) => { x.dataset.dir513 = d.sort === x.dataset.sort ? d.dir : ""; }); }

/* \u2550\u2550\u2550 V.514 ACCOUNTING \u2014 ADVANCE : Dropdown "CS \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" = \u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D USER \u0E08\u0E23\u0E34\u0E07 (\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 \u00B7 \u0E41\u0E2B\u0E25\u0E48\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C \u0E0A\u0E37\u0E48\u0E2D USER) \u00B7 \u0E01\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 \u2550\u2550\u2550 */
function OP514(op, ch, mode) {
  return ch === "ADVANCE" && mode === "accounting" ? Object.assign({}, op || {}, { users514: op && Array.isArray(op.users) ? op.users : [] }) : op || {};
}
function USR514(list, t, _) {
  let seen = new Set(), cnt = {}, lb = (u) => Kt(u.name);
  list = list.filter((u) => u && u.id && !seen.has(u.id) && seen.add(u.id));
  list.forEach((u) => { let k = lb(u); cnt[k] = (cnt[k] || 0) + 1; });
  let it = list.map((u) => ({ id: u.id, l: cnt[lb(u)] > 1 ? u.name || "-" : lb(u), nk: u.nickname || "", fn: u.name || "" })).sort((a, b) => a.l.localeCompare(b.l, "th"));
  return `<select class="sel" data-f="created_by" title="\u0E01\u0E23\u0E2D\u0E07\u0E15\u0E32\u0E21 USER \u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C \u0E0A\u0E37\u0E48\u0E2D USER)">
      <option value="">CS \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      ${it.map((u) => `<option value="${n(u.id)}" ${_(u.id, t.created_by)} title="${n(u.fn)}">${n(u.l)}${u.nk ? " (" + n(u.nk) + ")" : ""}</option>`).join("")}
    </select>`;
}


/* \u2550\u2550\u2550 V.520 FINANCE \u2014 ADVANCE : \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C BILLING NOTE NO. \u0E01\u0E48\u0E2D\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 (\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E08\u0E32\u0E01 BILLING PDF \u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27 \u0E02\u0E2D\u0E07 JOB \u0E19\u0E31\u0E49\u0E19 \u00B7 \u0E44\u0E21\u0E48\u0E21\u0E35 = -) \u2550\u2550\u2550 */
var BH520 = '<th data-col-key="billing_note_no" data-col-export="no">BILLING NOTE NO.</th>';

/* ═══ V.678 FINANCE — ADVANCE : หน้ารายงาน (อ่านอย่างเดียว · UNPOST สีแดงเท่านั้น) + ช่องค้นหา 4 หัวข้อ (เฉพาะ mode "advance" · ACCOUNTING / DOCUMENT เดิม) ═══ */
var FL678 = [["f678_customer", "ลูกค้า"], ["f678_company", "บริษัท"], ["f678_invoice", "INVOICE NO."], ["f678_cjob", "Customer Job No."]];
function FI678(st) { ST678(); return FL678.filter(([k]) => k !== "f678_customer").map(([k, l]) => `<input class="inp inp678" data-f="${k}" value="${n((st && st[k]) || "")}" placeholder="${l}" title="ค้นหา ${l} (บางส่วนของข้อความได้)">`).join(""); }
function ST678() { try { if (document.getElementById("st678c-css")) return ""; let s = document.createElement("style"); s.id = "st678c-css";
  s.textContent = "#ch-fbar .inp678{min-width:0}.btn.un678{background:#DC2626!important;color:#fff!important;border-color:#DC2626!important;font-weight:700}.btn.un678:hover:not(:disabled){background:#B91C1C!important;border-color:#B91C1C!important}"; document.head.appendChild(s); } catch (e) {} return ""; }
/* \u2550\u2550\u2550 V.694 FINANCE \u2014 ADVANCE : ซ่อน Cost / Charge / หมายเหตุ (หน้ารายงาน) \u00B7 PAY (ยืนยันจ่ายแล้ว \u00B7 RUN-694 njacc_advance_pay694) \u00B7 จ่ายแล้ว = ล็อก (Backend) \u00B7 \u21A9 ย้อนกลับ PAY = SUPER_ADMIN + เหตุผล (njacc_advance_unpay694)
   ACCOUNTING \u2014 SERVICE : ซ่อน CS / Due Date \u00B7 ACCOUNTING \u2014 ADVANCE : ซ่อน Due Date \u00B7 ค่าตัวกรองที่ซ่อน = ทั้งหมด (ไม่กรองแฝง) \u2550\u2550\u2550 */
function ZA694(z) { return String(z || "").replace(/<th[^>]*data-col-key="(_adv_cost|_adv_charge|note)"[^>]*>[^<]*<\/th>/g, ""); }
function GA694(t) { if (TAB789 === "issued") return GS789(); let h = Gt(t); return String(t && t.advance_status || "") === "PAID" ? (ST694(), h.replace(/<\/td>$/, '<div><span class="bdg694">\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27</span></div></td>')) : h; }
function ST694() { try { if (document.getElementById("st694-css")) return ""; let s = document.createElement("style"); s.id = "st694-css";
  s.textContent = ".btn.un678.pay694{background:#16A34A!important;border-color:#16A34A!important;color:#fff!important}.btn.un678.pay694:hover:not(:disabled){background:#15803D!important;border-color:#15803D!important}.btn.un678.pay694:disabled{opacity:.55;cursor:not-allowed}.bdg694{display:inline-block;margin-top:2px;padding:1px 8px;border-radius:999px;background:#16A34A;color:#fff;font-size:11px;font-weight:700;line-height:18px;white-space:nowrap}"; document.head.appendChild(s); } catch (e) {} return ""; }
function RA694(t, e, a) {
  ST678(); ST694();
  if (String(t && t.operational_status || "") === "CANCELED") return '<span class="t-xs t-3">\u2014</span>';   /* V.893 : JOB ที่ยกเลิก — ไม่นำกลับเข้ากระบวนการเดิมและไม่ออกเอกสารใหม่ */

  let paid = String(t && t.advance_status || "") === "PAID", sa = String(x.profile && x.profile.role) === "SUPER_ADMIN", no = n(t.job_no || ""), h = "";
  if (paid) {
    h = `<button class="btn btn-sm un678 pay694" disabled title="\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E47\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">PAY</button>`;
    if (sa && !RM788.has(String(t.id))) h += `<button class="btn btn-o btn-sm unpay694" data-act="unpay694" data-id="${n(t.id)}" data-no="${no}" title="SUPER_ADMIN : \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A PAY (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)">\u21A9 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A PAY</button>`;
    return h;
  }
  if (e && e.invoice && t.invoice_id && String(t.invoice_status || "").toUpperCase() === "POSTED") h += `<button class="btn btn-sm un678 pay694" data-act="pay694" data-id="${n(t.id)}" data-no="${no}" title="\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 ADVANCE \u0E19\u0E35\u0E49\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27">PAY</button>`;
  h += Ae(t, a);
  return h || '<span class="t-xs t-3">\u2014</span>';
}
function BN520(t) {
  let v = t && t.billing_note_no != null ? String(t.billing_note_no).trim() : "";
  return v ? `<td class="nowrap t-b">${n(v)}</td>` : '<td class="nowrap">-</td>';
}


/* \u2550\u2550\u2550 V.523 ACCOUNTING \u2014 SERVICE / ADVANCE : Dropdown "\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17" \u0E15\u0E48\u0E2D\u0E08\u0E32\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E14\u0E49 \u00B7 \u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E08\u0E32\u0E01 JOB \u0E08\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u00B7 \u0E0A\u0E37\u0E48\u0E2D\u0E0B\u0E49\u0E33\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E14\u0E35\u0E22\u0E27) \u2550\u2550\u2550 */
var CC523 = {}, CN523 = {}, CA523 = "\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14";
function CF523(f) {
  if (!f) return;
  let v = String(f.company || "").trim();
  f.company_ids = v ? v.split(",").filter(Boolean) : [];
  f.customer_ids = String(f.cust804 || (String(f.customer || "").indexOf(",") >= 0 ? f.customer : "")).split(",").filter(Boolean);   /* V.880 : ลูกค้าชื่อซ้ำ (หลาย ID) ของ Dropdown ลูกค้าเดิม */   /* V.804 : ACCOUNTING — SERVICE ลูกค้า (ชื่อเดียวกันหลาย ID) */
  f.created_by_ids = String(f.who_u || "").split(",").filter(Boolean); f.department_ids = String(f.who_d || "").split(",").filter(Boolean);   /* V.696 : DOCUMENT สมาชิกหลายรายการ */
}
function CBH523(t) {
  let v = String((t && t.company) || "");
  return `<div class="co523" title="\u0E01\u0E23\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (Company Invoice)">${NE523("ch-co523", v ? [{ id: v, name: CN523[v] || "" }] : [], v, CA523)}<input type="hidden" data-f="company" value="${n(v)}"></div>`;
}
function CBI523(r, x) {
  let inp = r && r.querySelector("#ch-co523"), hid = r && r.querySelector('[data-f="company"]');
  if (!inp || !hid) return;
  CF523(x.filters);
  let key = () => x.queue() || "acc_active", all = [{ id: "", name: CA523 }];
  let load = async () => {
    let q = key();
    if (CC523[q]) return CC523[q];
    { let w880 = FW880(r); if (w880) { try { await w880; } catch (e8) {} if (CC523[q]) return CC523[q]; if (FW880(r) || !r.isConnected) return null; } }   /* V.880 : รายชื่อจากรายการจริงของแท็บ (facets880) */
    try {
      let res = await CO523({ charge: x.charge, group: x.group, queue: q, scope: x.scope, filters: {} }), mp = new Map();
      ((res && res.companies) || []).forEach((c) => {
        let nm = String(c.name || c.code || "").replace(/\s+/g, " ").trim();
        if (!c.id || !nm) return;
        let k = nm.toUpperCase();
        mp.has(k) ? mp.get(k).ids.push(c.id) : mp.set(k, { name: nm, ids: [c.id] });
      });
      let L = all.concat([...mp.values()].sort((a, b) => a.name.localeCompare(b.name, "th")).map((m) => ({ id: m.ids.join(","), name: m.name })));
      L.forEach((m) => m.id && (CN523[m.id] = m.name));
      return (CC523[q] = L);
    } catch {
      return null;
    }
  };
  IE523(r, "ch-co523", {
    getItems: () => CC523[key()] || all,
    openOnClick: !0,
    clickShowsAll: !0,
    fixedList: !0,
    matchWidth: !0,
    onChange: (id) => {
      let v = String(id || ""), txt = inp.value.trim();
      if (!v && txt && txt !== CA523) return;
      txt === CA523 && (inp.value = "");
      hid.value !== v && ((hid.value = v), hid.dispatchEvent(new Event("input", { bubbles: !0 })));
    },
  });
  inp.addEventListener("focus", () => {
    CC523[key()] || load().then((L) => { L && document.activeElement === inp && inp.dispatchEvent(new Event("input")); });
  });
  load().then((L) => {
    L && hid.value && !inp.value && (inp.value = CN523[hid.value] || "");
  });
}

var HK529={ACCOUNTING_SERVICE:["wht_amount","net_payable"],ACCOUNTING_ADVANCE:["_adv_cost","_adv_charge","advance_amount"]},HC529=(c,k)=>{let ks=HK529[k];if(!c||!c.tHead||!ks)return;let hr=c.tHead.rows[0];if(!hr)return;let ci=new Set;[...hr.cells].forEach(x=>{let on=ks.includes(x.getAttribute("data-col-key")||"");x.classList.toggle("acc529-hide",on);on&&x.dataset.ci!=null&&ci.add(x.dataset.ci)});let vis=[...hr.cells].filter(x=>!x.hidden&&!x.classList.contains("acc529-hide")).length,rs=[...c.tHead.rows].slice(1);[...c.tBodies].forEach(b=>rs.push(...b.rows));c.tFoot&&rs.push(...c.tFoot.rows);rs.forEach(tr=>{let cs=tr.cells;if(cs.length===1&&cs[0].hasAttribute("colspan")){cs[0].colSpan=Math.max(1,vis);return}for(let i=0;i<cs.length;i++){let d=cs[i].dataset.ci;cs[i].classList.toggle("acc529-hide",d!=null&&ci.has(d))}})};/* V.569 : แสดงรายการล่าสุดของหน้าเดิมทันทีเมื่อกลับมาหน้าเดิม (ไม่ต้องรอหมุน) แล้วโหลดข้อมูลจริงจาก Server ทับทุกครั้งเหมือนเดิม · เก็บในหน่วยความจำของแท็บนี้เท่านั้น (ไม่ลง Storage) · อายุไม่เกิน 5 นาที · key = ผู้ใช้ + เงื่อนไขค้นหาเดียวกันทุกตัว · มีการบันทึก/แก้ไขใด ๆ (RPC เขียน) หรือ njacc:jobs-changed = ล้างทิ้งทั้งหมดทันที → ไม่มีทางเห็นข้อมูลก่อนบันทึก */var SC569=new Map;try{window.addEventListener("njacc:rpc-write",()=>SC569.clear()),window.addEventListener(G,()=>SC569.clear())}catch{}function SK569(q){try{let p=PB569(q);delete p.with_options;return String(x.profile&&x.profile.id||"")+"|"+JSON.stringify(p)}catch{return null}}function SV569(u){try{return JSON.stringify(Object.assign({},u,{filter_options:null}))}catch{return null}}function SS569(k,s){SC569.delete(k),SC569.set(k,{s,at:Date.now()}),SC569.size>30&&SC569.delete(SC569.keys().next().value)}/* V.569 : โหลดข้อมูลหน้ารายการล่วงหน้า (ตอนชี้เมนู / ตอนเปิดระบบ) ด้วยเงื่อนไขเดียวกับที่หน้าจะเรียกจริง → ส่งต่อผ่าน Prefetch handoff ของ RPC (อ่านอย่างเดียว) */function RP569(r){try{if(!r||!r.charge)return;let o=r.mode,e=r.charge,a=r.group,_={document:"document",accounting:"pending_invoice",receipt:"receipt_active",advance:"advance_active",closed:"closed"}[o]||null,d=te(e,a,o||"document"),w=o!=="document"&&o!=="accounting";o==="accounting"&&CF523(d.filters);let q={charge:e,group:a,queue:QQ499(o,d,_),scope:r.scope||null,filters:o==="advance"?DF789(d):d.filters,sort:d.sort,dir:d.dir,page:d.page,size:d.size,withOptions:!d.options,withKpi:w,tabs499:o==="accounting"||o==="document"/* V.820 : ให้ตรงกับคำขอจริง (ใช้ผล Prefetch ได้) */};if(r.ifCold&&SC569.has(SK569(q)))return;PF569("njacc_charge_page_bundle",{p:PB569(q)})}catch{}}/* ═══ V.762 · ACCOUNTING → ADVANCE / FINANCE → ADVANCE : แถบค้นหาใช้ Component กลาง (ui-dd762.js) — หัวข้อเหนือช่อง · Dropdown ค้นหาได้ · × · ป้ายสรุป
   ย้าย Element ตัวกรองเดิมในตำแหน่งเดิม ([data-f] / ae() / r.oninput / #ch-clear เดิม) · บริษัท (Company Invoice) = รายชื่อเดิม njacc_charge_company_options (CC523) ═══ */
/* ═══ V.804 ACCOUNTING — SERVICE : แถบค้นหา = ค้นหาทุกคอลัมน์ | ลูกค้า | ชื่อบริษัท | แผนก | สมาชิก (Component กลาง ui-dd762 เดียวกับ ACCOUNTING → ADVANCE / FINANCE)
   · ซ่อน Status (ไม่แสดง · ไม่ใช้กรอง · สถานะพื้นฐานของคิวเดิมที่ Server คงเดิม) · ข้อมูลจริงจาก Server ในขอบเขตสิทธิ์เดิม :
     ลูกค้า = njacc_charge_customer_options (คิว ACCOUNTING เดิม · ชื่อซ้ำรวมเป็นรายการเดียว → customer_ids) · ชื่อบริษัท = njacc_charge_company_options เดิม (CC523)
     แผนก / สมาชิก = njacc_charge_filter_options เดิม (departments / users ในขอบเขต njacc_view_scope) · กรองแบบ AND ที่ njacc_build_charge_set เดิม
   · เลือก = กรองทันที (r.oninput เดิม) · × ล้างเฉพาะช่อง · ล้างตัวกรอง / เปลี่ยนหน้า / Export = กลไกเดิม ═══ */
var CU804C = {}, CU804N = {}, CU804S = {};
function AF804(d, e, o) { try { if (o === "accounting" && e === "SERVICE" && d && d.filters) { d.filters.status = ""; d.filters.customer = ""; } } catch (_) {} return d; }
function ST804() { try { if (document.getElementById("st804-css")) return; let s = document.createElement("style"); s.id = "st804-css"; s.textContent = ".u762-pan.p804 .u762-ls{max-height:350px}"; document.head.appendChild(s); } catch (_) {} }
function AS804(r, x) {
  try {
    if (!r || r.__as804) return; r.__as804 = 1; ST804();
    let f = x.filters || {}, op = (x.opts && x.opts()) || {}, Q = (s) => r.querySelector(s), q = Q('input[data-f="q"]');
    if (!q) return;
    ["status", "customer", "department_id", "created_by", "cs"].forEach((k) => { let el = Q('select[data-f="' + k + '"]'); el && el.remove(); });
    f.status = ""; f.customer = "";
    let byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"), seen = new Set();
    let dp = (Array.isArray(op.departments) ? op.departments : []).filter((x) => x && x.id && !seen.has(x.id) && seen.add(x.id)).sort(byName), dn = {};
    dp.forEach((x) => { dn[x.id] = x.name; });
    if (f.department_id && !dn[f.department_id]) f.department_id = "";
    let us = [], su = new Set(); (Array.isArray(op.users) ? op.users : []).forEach((u) => { u && u.id && !su.has(u.id) && (su.add(u.id), us.push(u)); });
    if (f.created_by && !su.has(f.created_by)) f.created_by = "";
    let sel = (v, w) => (v === w ? " selected" : ""), g = {}, order = [];
    us.forEach((u) => { let k = dn[u.department_id] ? String(u.department_id) : ""; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(u); });
    order.sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || String(dn[a] || "").localeCompare(String(dn[b] || ""), "th"));
    let opt = (u) => `<option value="${n(u.id)}"${sel(u.id, f.created_by)} title="${n(u.name || "")}">${n(Kt(u.name) || u.name || "-")}${u.nickname ? " (" + n(u.nickname) + ")" : ""}</option>`;
    let body = order.length > 1 ? order.map((k) => `<optgroup label="${n(k ? dn[k] : "อื่น ๆ")}">${g[k].sort(byName).map(opt).join("")}</optgroup>`).join("") : order.map((k) => g[k].sort(byName).map(opt).join("")).join("");
    let cu = document.createElement("div"); cu.className = "cu804"; cu.innerHTML = `<input type="hidden" data-f="cust804" value="${n(f.cust804 || "")}">`;
    let ds = document.createElement("select"); ds.className = "sel"; ds.dataset.f = "department_id"; ds.title = "กรองตามแผนก (เฉพาะแผนกที่มีสิทธิ์)";
    ds.innerHTML = `<option value="">แผนกทั้งหมด</option>` + dp.map((x) => `<option value="${n(x.id)}"${sel(x.id, f.department_id)}>${n(x.name)}</option>`).join("");
    let ms = document.createElement("select"); ms.className = "sel"; ms.dataset.f = "created_by"; ms.title = "กรองตามสมาชิก (ผู้เปิดงาน · ภายในขอบเขตที่มีสิทธิ์)";
    ms.innerHTML = `<option value="">สมาชิกทั้งหมด</option>` + body;
    let co = Q(".co523");
    q.after(cu); co ? (cu.after(co), co.after(ds)) : cu.after(ds); ds.after(ms);
  } catch (e) { try { console.warn("AS804", e); } catch (_) {} }
}
function FB762(r, x) {
  try {
    if (!r || r.__fb762) return; r.__fb762 = 1; CS762();
    let LB = { q: "ค้นหาทั่วไป", f678_customer: "ค้นหาลูกค้า", f678_company: "ค้นหาบริษัท", f678_invoice: "INVOICE NO.", f678_cjob: "Customer Job No.", customer: "ลูกค้า", status: "Status", cs: "CS", due: "Due Date", department_id: "แผนก", from: "วันที่เริ่มต้น", to: "วันที่สิ้นสุด" };
    let F = [], ch = null, key = () => (x.queue && x.queue()) || "acc_active", cl = 0;
    r.classList.add("u762-bar");
    [...r.children].forEach((el) => {
      if (el.matches("input[data-f]") && el.type !== "hidden") {
        let k = el.dataset.f, d = el.type === "date", lb = (k === "q" && x.qL) || LB[k] || el.placeholder || k;   /* V.804 : x.qL */
        FD762(el, lb, d ? "u762-d" : k === "q" ? "u762-w" : "u762-t"); F.push(TX762(el, lb, d));
      } else if (el.matches("select[data-f]")) {
        let k = el.dataset.f, lb = LB[k] || k;
        k === "created_by" && (lb = /^CS/i.test(String((el.options[0] || {}).textContent || "").trim()) ? "CS" : "สมาชิก");
        FD762(el, lb); F.push(SL762(el, { label: lb }));
      } else if (el.matches(".co523")) {
        let ch523 = el.querySelector('[data-f="company"]'), ci = el.querySelector("#ch-co523");
        if (!ch523) return;
        let load = () => {
          if (CC523[key()] || cl) return; cl = 1;
          { let w880 = FW880(r); if (w880) { w880.then(() => {}, () => {}).then(() => { if (CC523[key()]) { cl = 2; F.forEach((f) => f && f.sync && f.sync()); ch && ch.refresh(); } else { cl = 0; FW880(r) || !r.isConnected || load(); } }); return; } }   /* V.880 */
          (async () => {
            try {
              let res = await CO523({ charge: x.charge, group: x.group, queue: key(), scope: x.scope, filters: {} }), mp = new Map();
              ((res && res.companies) || []).forEach((c) => { let nm = String(c.name || c.code || "").replace(/\s+/g, " ").trim(), k = nm.toUpperCase(); if (!c.id || !nm) return; mp.has(k) ? mp.get(k).ids.push(c.id) : mp.set(k, { name: nm, ids: [c.id] }); });
              let L = [{ id: "", name: CA523 }].concat([...mp.values()].sort((a, b) => a.name.localeCompare(b.name, "th")).map((m) => ({ id: m.ids.join(","), name: m.name })));
              L.forEach((m) => m.id && (CN523[m.id] = m.name)); CC523[key()] || (CC523[key()] = L);
            } catch (e) {}
            cl = 2; F.forEach((f) => f && f.sync && f.sync()); ch && ch.refresh();
          })();
        };
        let a = DD762({ label: x.coL || "บริษัท", all: x.coA || "บริษัททั้งหมด",   /* V.804 : x.coL / x.coA */ items: () => (CC523[key()] || []).filter((m) => m.id).map((m) => ({ v: m.id, t: m.name })),
          get: () => ch523.value, set: (v) => { ch523.value = v; ci && (ci.value = v ? CN523[v] || "" : ""); ch523.dispatchEvent(new Event("input", { bubbles: !0 })); },
          loading: () => !CC523[key()] && cl !== 2, txt: (v) => CN523[v] || (cl === 2 ? v : "…"), onOpen: load });
        let f = FD762(el, x.coL || "บริษัท"); f.insertBefore(a.w, el); el.classList.add("u762-native"); F.push(a);
        ch523.value && !CN523[ch523.value] && load();
      } else if (el.matches(".cu804")) {   /* V.804 : ลูกค้า (ACCOUNTING — SERVICE) */
        let hid = el.querySelector('[data-f="cust804"]');
        if (!hid) return;
        let kq = () => "cu|" + x.charge + "|" + x.group + "|" + key(), a = null;
        let ld = () => {
          let k0 = kq(); if (CU804C[k0] || CU804S[k0]) return; CU804S[k0] = 1; { let w880 = FW880(r); if (w880) { w880.then(() => {}, () => {}).then(() => { if (CU804C[k0]) { CU804S[k0] = 2; F.forEach((f) => f && f.sync && f.sync()); ch && ch.refresh(); } else { CU804S[k0] = 0; FW880(r) || !r.isConnected || ld(); } }); return; } }   /* V.880 */   /* โหลดครั้งเดียวต่อคิว (แถบ ACCOUNTING เปลี่ยนคิว = รายการของคิวนั้น) */
          (async () => {
            try {
              let res = await CU804({ charge: x.charge, group: x.group, queue: key(), scope: x.scope, filters: {} }), mp = new Map();
              ((res && res.customers) || []).forEach((c) => { let nm = String(c.name || c.code || "").replace(/\s+/g, " ").trim(), k = nm.toUpperCase(); if (!c.id || !nm) return; mp.has(k) ? mp.get(k).ids.push(c.id) : mp.set(k, { name: nm, ids: [c.id] }); });
              let L = [...mp.values()].sort((a, b) => a.name.localeCompare(b.name, "th")).map((m) => ({ v: m.ids.join(","), t: m.name }));
              L.forEach((m) => { CU804N[m.v] = m.t; }); CU804C[k0] = L;
            } catch (e) {}
            CU804S[k0] = 2; F.forEach((f) => f && f.sync && f.sync()); ch && ch.refresh();
            let sb = a && a.w.classList.contains("open") && a.w.querySelector(".u762-s"); sb && sb.dispatchEvent(new Event("input"));   /* เปิดค้างไว้ = แสดงรายการที่โหลดเสร็จ */
          })();
        };
        a = DD762({ label: "ลูกค้า", all: "ลูกค้าทั้งหมด", items: () => CU804C[kq()] || [],
          get: () => hid.value, set: (v) => { hid.value = v; hid.dispatchEvent(new Event("input", { bubbles: !0 })); },
          loading: () => !CU804C[kq()] && CU804S[kq()] !== 2, txt: (v) => CU804N[v] || (CU804S[kq()] === 2 ? v : "…"), onOpen: ld });
        let f = FD762(el, "ลูกค้า"); f.insertBefore(a.w, el); el.classList.add("u762-native"); F.push(a);
        hid.value && !CU804N[hid.value] && ld();
      }
    });
    ch = CH762(r, () => F);
    let rf = () => { F.forEach((f) => f && f.sync && f.sync()); ch.refresh(); };
    r.addEventListener("input", rf); r.addEventListener("change", rf); r.addEventListener("fx880", rf);   /* V.880 */
    x.p804 && r.querySelectorAll(".u762-pan").forEach((p) => p.classList.add("p804"));   /* V.804 : รายการสูงไม่เกิน 350px */
  } catch (e) { try { console.warn("FB762", e); } catch (_) {} }
}
export{we as render,RP569 as prefetch};
/* V.586 · คอลัมน์ USER : ชื่อเล่นจาก USER ส่วนกลาง (created_by_nickname · ผูกด้วย created_by จริง) · ไม่มีชื่อเล่น = ชื่อเดิม (Kt) */
function NN586(r){let k=r&&r.created_by_nickname!=null?String(r.created_by_nickname).trim():"";return k||Kt(r&&r.created_by_name)}

/* ═══ V.593 การมองเห็นข้อมูลตามตำแหน่ง : ตัวกรองแผนก / สมาชิก (หัวหน้าแผนก · ADMIN · SUPER_ADMIN) ═══
   ขอบเขตจริงตรวจที่ฐานข้อมูล (njacc_view_scope ใน njacc_build_charge_set) · ตัวกรองนี้ "กรองภายในขอบเขต" เท่านั้น ส่งค่านอกขอบเขตได้ผล 0 แถว
   USER (เฉพาะงานตนเอง) / ACCOUNT (ตามเดิม) = ไม่แสดงตัวกรองเพิ่ม */
/* \u2550\u2550\u2550 V.696 DOCUMENT \u2014 SERVICE / ADVANCE : ซ่อน "แผนกทั้งหมด" ด้านนอก \u00B7 "สมาชิกทั้งหมด" = Checkbox หลายรายการ (ทั้งแผนก / รายคน / หลายแผนก)
   ส่ง created_by_ids (สมาชิกที่เลือก) + department_ids (แผนกที่เลือกครบ) \u2192 njacc_build_charge_set (RUN-696) รวมแบบ OR ภายในขอบเขตสิทธิ์เดิม \u00B7 ว่าง = สมาชิกทั้งหมด \u00B7 Key = User ID / Department ID \u2550\u2550\u2550 */
function ST696() { try { if (document.getElementById("st696-css")) return; let s = document.createElement("style"); s.id = "st696-css";
  s.textContent = "#ch-fbar.fbar-doc>.co523{flex:1 1 150px;min-width:130px;max-width:240px}#ch-fbar.fbar-doc>.ms696{flex:1 1 150px;min-width:130px;max-width:220px}.ms696{position:relative;min-width:0}.ms696-btn{width:100%;height:36px;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer}.ms696-btn.ms696-on{font-weight:700}.ms696-pan{position:fixed;z-index:3000;background:var(--card,#fff);color:var(--text-1,#1e293b);border:1px solid var(--line,#E2E8F0);border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.18);overflow:auto;padding:10px 12px;box-sizing:border-box}.ms696-pan[hidden]{display:none}.ms696-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 0 8px;margin-bottom:6px;border-bottom:1px solid var(--line,#E2E8F0)}.ms696-pan label{display:flex;align-items:center;gap:8px;padding:5px 2px;cursor:pointer;font-size:var(--fs-sm,13px);line-height:1.3;margin:0}.ms696-pan .ms696-u{padding-left:26px}.ms696-pan input[type=checkbox]{width:16px;height:16px;flex:0 0 16px;margin:0}.ms696-o{font-weight:700;padding:6px 2px}.ms696-e{padding:8px 2px;opacity:.7}"; document.head.appendChild(s); } catch (e) {} }
/* ═══ V.822 DOCUMENT — SERVICE : รายชื่อสมาชิก = users เดิม (ผู้เปิดงาน) + members822 (RUN-822 : สมาชิกทุกคน active ในแผนกที่อยู่ในขอบเขต njacc_view_scope · แม้ยังไม่มี JOB)
   รวมไม่ซ้ำตาม User ID · ตัวกรองเท่านั้น (ขอบเขตงานจริงตรวจที่ njacc_build_charge_set เดิม) · ไม่มี members822 (DOCUMENT — ADVANCE / DB เดิม) = เดิม ═══ */
function UM822(e) {
  let A = Array.isArray(e && e.users) ? e.users : [];
  try { let M = MD810 && Array.isArray(e && e.members822) ? e.members822 : []; if (!M.length) return A;
    let s = new Set(A.map((u) => String(u && u.id))); return A.concat(M.filter((u) => u && u.id && !s.has(String(u.id)) && s.add(String(u.id)))); } catch (e7) { return A; }
}
function MS696(t, e) {
  let s = e && e.scope593, lv = s && s.level;
  if (!(lv === "HEAD" || lv === "ADMIN" || lv === "SUPER")) return MO810(t, e);   /* V.810 : USER = สมาชิกในแผนก */
  ST696();
  let dp = Array.isArray(e.departments) ? e.departments : [], us = UM822(e)/* V.822 */, seen = new Set(), dn = {}, g = {}, order = [];
  dp.forEach((x) => { dn[x.id] = x.name; });
  us.filter((u) => u && u.id && !seen.has(u.id) && seen.add(u.id)).forEach((u) => { let k = dn[u.department_id] ? String(u.department_id) : ""; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(u); });
  let byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th");
  order.sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || String(dn[a] || "").localeCompare(String(dn[b] || ""), "th"));
  let su = new Set(String(t.who_u || "").split(",").filter(Boolean)), sd = new Set(String(t.who_d || "").split(",").filter(Boolean)), cnt = 0;
  let on = (u, k) => su.has(String(u.id)) || (!!k && sd.has(k));
  let body = order.map((k) => {
    let L = g[k].sort(byName), c = L.filter((u) => on(u, k)).length, all = L.length > 0 && c === L.length; cnt += c;
    return `<div class="ms696-g">${k ? `<label class="ms696-d"><input type="checkbox" data-d="${n(k)}"${all ? " checked" : ""}${!all && c ? ' data-ind="1"' : ""}><span><b>${n(dn[k])}</b> \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E41\u0E1C\u0E19\u0E01</span></label>` : `<div class="ms696-o">\u0E2D\u0E37\u0E48\u0E19 \u0E46</div>`}${L.map((u) => `<label class="ms696-u"><input type="checkbox" data-u="${n(u.id)}" data-ud="${n(k)}"${on(u, k) ? " checked" : ""}><span title="${n(u.name || "")}">${n(Kt(u.name) || u.name || "-")}${u.nickname ? " (" + n(u.nickname) + ")" : ""}</span></label>`).join("")}</div>`;
  }).join("");
  return `<div class="ms696" data-ms696><button type="button" class="sel ms696-btn${cnt ? " ms696-on" : ""}" title="\u0E01\u0E23\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 / \u0E41\u0E1C\u0E19\u0E01 (\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2B\u0E25\u0E32\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u00B7 \u0E20\u0E32\u0E22\u0E43\u0E19\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C)">${cnt ? "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 " + cnt + " \u0E04\u0E19" : "\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"}</button><div class="ms696-pan" hidden><div class="ms696-h"><label class="ms696-all"><input type="checkbox" data-all="1"${cnt ? "" : " checked"}><b>\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</b></label><button type="button" class="btn btn-o btn-sm ms696-clr">\u0E25\u0E49\u0E32\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01</button></div><div class="ms696-b">${body || '<div class="ms696-e">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</div>'}</div></div><input type="hidden" data-f="who_u" value="${n(t.who_u || "")}"><input type="hidden" data-f="who_d" value="${n(t.who_d || "")}"></div>`;
}
function MI696(r) {
  let w = r && r.querySelector("[data-ms696]");
  if (!w || w.__i696) return;
  w.__i696 = 1;
  let btn = w.querySelector(".ms696-btn"), pan = w.querySelector(".ms696-pan"), hu = w.querySelector('[data-f="who_u"]'), hd = w.querySelector('[data-f="who_d"]');
  w.querySelectorAll("[data-ind]").forEach((x) => { x.indeterminate = !0; });
  let place = () => { let b = btn.getBoundingClientRect(), W = Math.min(Math.max(b.width, 300), innerWidth - 16); pan.style.width = W + "px"; pan.style.left = Math.max(8, Math.min(b.left, innerWidth - W - 8)) + "px"; pan.style.top = b.bottom + 4 + "px"; pan.style.maxHeight = Math.max(180, Math.min(innerHeight * 0.6, innerHeight - b.bottom - 16)) + "px"; };
  let out = (ev) => { w.contains(ev.target) || close(); }, scl = (ev) => { pan.contains(ev.target) || close(); }, esc = (ev) => { ev.key === "Escape" && close(); };
  let close = () => { pan.hidden = !0; document.removeEventListener("mousedown", out, !0); removeEventListener("resize", close); removeEventListener("scroll", scl, !0); document.removeEventListener("keydown", esc, !0); };
  btn.onclick = () => { if (!pan.hidden) return close(); place(); pan.hidden = !1; document.addEventListener("mousedown", out, !0); addEventListener("resize", close); addEventListener("scroll", scl, !0); document.addEventListener("keydown", esc, !0); };
  let sync = () => {
    let G = {}, U = [], D = [], c0 = 0;
    w.querySelectorAll("input[data-u]").forEach((x) => { (G[x.dataset.ud] || (G[x.dataset.ud] = [])).push(x); });
    Object.keys(G).forEach((k) => {
      let L = G[k], c = L.filter((x) => x.checked), db = k ? [...w.querySelectorAll("input[data-d]")].find((x) => x.dataset.d === k) : null;
      c0 += c.length;
      db && ((db.checked = L.length > 0 && c.length === L.length), (db.indeterminate = c.length > 0 && c.length < L.length));
      k && L.length && c.length === L.length ? D.push(k) : c.forEach((x) => U.push(x.dataset.u));
    });
    let a = w.querySelector("input[data-all]"); a && ((a.checked = c0 === 0), (a.indeterminate = !1));
    btn.textContent = c0 ? "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 " + c0 + " \u0E04\u0E19" : "\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"; btn.classList.toggle("ms696-on", c0 > 0);
    let u = U.join(","), d = D.join(",");
    if (hu.value !== u || hd.value !== d) { hu.value = u; hd.value = d; hu.dispatchEvent(new Event("input", { bubbles: !0 })); }
  };
  pan.addEventListener("change", (ev) => {
    let x = ev.target;
    if (!(x instanceof HTMLInputElement)) return;
    if (x.dataset.all) w.querySelectorAll("input[data-u]").forEach((y) => { y.checked = !1; });
    else if (x.dataset.d) w.querySelectorAll("input[data-u]").forEach((y) => { y.dataset.ud === x.dataset.d && (y.checked = x.checked); });
    sync();
  });
  w.querySelector(".ms696-clr").onclick = () => { w.querySelectorAll("input[data-u]").forEach((y) => { y.checked = !1; }); sync(); };
}
function SC593(t, e, _) {
  let s = e && e.scope593, lv = s && s.level;
  if (!(lv === "HEAD" || lv === "ADMIN" || lv === "SUPER")) return "";
  let dp = Array.isArray(e.departments) ? e.departments : [], us = Array.isArray(e.users) ? e.users : [], h = "";
  if (dp.length > 1) h += `<select class="sel" data-f="department_id" title="กรองตามแผนก (เฉพาะแผนกที่ได้รับสิทธิ์)">
      <option value="">แผนกทั้งหมด</option>
      ${dp.map((x) => `<option value="${n(x.id)}" ${_(x.id, t.department_id)}>${n(x.name)}</option>`).join("")}
    </select>`;
  if (!e.users514) {
    let seen = new Set(), dn = {}, g = {}, order = [];
    dp.forEach((x) => { dn[x.id] = x.name; });
    us.filter((u) => u && u.id && !seen.has(u.id) && seen.add(u.id)).forEach((u) => { let k = dn[u.department_id] ? u.department_id : ""; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(u); });
    let opt = (u) => `<option value="${n(u.id)}" ${_(u.id, t.created_by)} title="${n(u.name || "")}">${n(Kt(u.name) || u.name || "-")}${u.nickname ? " (" + n(u.nickname) + ")" : ""}</option>`;
    let byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th");
    order.sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || String(dn[a] || "").localeCompare(String(dn[b] || ""), "th"));
    let body = order.length > 1 || (order.length === 1 && order[0] && dp.length > 1)
      ? order.map((k) => `<optgroup label="${n(k ? dn[k] : "อื่น ๆ")}">${g[k].sort(byName).map(opt).join("")}</optgroup>`).join("")
      : order.map((k) => g[k].sort(byName).map(opt).join("")).join("");
    h += `<select class="sel" data-f="created_by" title="กรองตามสมาชิก (ผู้เปิดงาน · ภายในขอบเขตที่ได้รับสิทธิ์)">
      <option value="">สมาชิกทั้งหมด</option>
      ${body}
    </select>`;
  }
  return h;
}
function SCC593(e) { let s = SC593({}, e || {}, () => ""), c = (s.match(/<select /g) || []).length; return c ? " fbar-sc593 fbar-sc593-" + c : ""; }

/* \u2550\u2550\u2550 V.660 FINANCE \u2192 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A ACCOUNTING : \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E40\u0E1B\u0E34\u0E14\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E41\u0E01\u0E49\u0E44\u0E02 JOB \u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07 ACCOUNTING \u2014 SERVICE / ADVANCE \u0E17\u0E31\u0E19\u0E17\u0E35 (\u0E14\u0E49\u0E27\u0E22 JOB ID \u0E08\u0E23\u0E34\u0E07) \u00B7 \u0E43\u0E0A\u0E49 UNPOST_TO_DRAFT \u0E40\u0E14\u0E34\u0E21 \u2550\u2550\u2550 */
function GO660(job, charge, allowed) {
  let c = String(charge || "").toUpperCase() === "ADVANCE" ? "ADVANCE" : "SERVICE";
  if (!job) return false;
  try { if (typeof allowed === "function" && !allowed("ACCOUNTING")) return false; } catch { return false; }
  try { sessionStorage.setItem("nj-acc-open660", JSON.stringify({ jobId: String(job), charge: c, at: Date.now() })); } catch { return false; }
  location.hash = "#/accounting/" + c.toLowerCase();
  return true;
}
function AO660(charge, open) {
  let v = null;
  try { v = JSON.parse(sessionStorage.getItem("nj-acc-open660") || "null"); } catch { v = null; }
  if (!v || !v.jobId || String(v.charge) !== String(charge || "").toUpperCase()) return;
  try { sessionStorage.removeItem("nj-acc-open660"); } catch {}
  if (!(Date.now() - Number(v.at || 0) < 120000)) return;
  setTimeout(() => open(v.jobId), 0);
}

/* \u2550\u2550\u2550 V.668 \u0E01\u0E23\u0E2D\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30 3 \u0E15\u0E31\u0E27 (ACCOUNTING / DOCUMENT) \u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E1E\u0E23\u0E34\u0E1A\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E42\u0E2B\u0E21\u0E14
   \u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38 : \u0E2A\u0E25\u0E31\u0E1A\u0E42\u0E2B\u0E21\u0E14 (SERVICE \u2194 ADVANCE \u0E2F\u0E25\u0E2F) \u0E2B\u0E19\u0E49\u0E32\u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E19\u0E49\u0E32 \u2192 \u0E01\u0E23\u0E2D\u0E1A\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E14\u0E49\u0E27\u0E22\u0E08\u0E33\u0E19\u0E27\u0E19\u0E27\u0E48\u0E32\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E40\u0E15\u0E34\u0E21\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 (+ \u0E2B\u0E19\u0E49\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E04\u0E31\u0E48\u0E19\u0E01\u0E25\u0E32\u0E07)
          \u0E41\u0E25\u0E30\u0E1C\u0E25\u0E19\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E01\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E2D\u0E1A\u0E0A\u0E49\u0E32\u0E21\u0E32\u0E17\u0E31\u0E1A\u0E1C\u0E25\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49
   \u0E41\u0E01\u0E49 : \u0E08\u0E33\u0E08\u0E33\u0E19\u0E27\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E49\u0E32 (\u0E0A\u0E38\u0E14 / \u0E01\u0E25\u0E38\u0E48\u0E21 / \u0E42\u0E2B\u0E21\u0E14) \u2192 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E23\u0E2D\u0E1A\u0E14\u0E49\u0E27\u0E22\u0E08\u0E33\u0E19\u0E27\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E17\u0E31\u0E19\u0E17\u0E35 \u00B7 \u0E23\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E25\u0E19\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 \u00B7 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19
   \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 : \u0E01\u0E32\u0E23\u0E19\u0E31\u0E1A (RPC / queue / filters \u0E40\u0E14\u0E34\u0E21) \u00B7 \u0E01\u0E32\u0E23\u0E01\u0E14\u0E01\u0E23\u0E2D\u0E07 \u00B7 \u0E2A\u0E35 / \u0E02\u0E19\u0E32\u0E14 / \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u00B7 POST / UNPOST / \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 / \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u2550\u2550\u2550 */
var CC668 = (() => { let m = new Map(); try { let x = JSON.parse(sessionStorage.getItem("nj-acc-cnt668") || "{}"); Object.keys(x).forEach((k) => m.set(k, x[k])); } catch {} return m; })();
function CC888(c) { let r = c && CC668.get(c), x = r && r.mrg886; return x == null ? null : x; }   /* V.888 : จำนวนบนแถบ "รวม INVOICE" (แคชชุดเดียวกับแถบเดิม) */
function CV668(c, v) {
  let r = c && CC668.get(c), x = r && r[v || "all"];
  if (x != null) return `<span class="cj-n" id="acc499-n-${v || "all"}">${Number(x).toLocaleString("th-TH")}</span>`;
  CP668();
  return `<span class="cj-n p668" id="acc499-n-${v || "all"}">\u2026</span>`;   /* \u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E19\u0E31\u0E1A) */
}
function CS668(c, ks, rs) {
  if (!c) return;
  let r = Object.assign({}, CC668.get(c) || {});
  ks.forEach((k, i) => { rs[i] != null && (r[k || "all"] = rs[i]); });
  CC668.set(c, r);
  try { let o = {}; CC668.forEach((v, k) => (o[k] = v)); sessionStorage.setItem("nj-acc-cnt668", JSON.stringify(o)); } catch {}
}
function CP668() {
  if (document.getElementById("acc668-css")) return;
  let s = document.createElement("style"); s.id = "acc668-css";
  s.textContent = ".acc499-tabs .cj-n.p668{opacity:.45}";
  document.head.appendChild(s);
}
/* V.683 · DOCUMENT → SERVICE / ADVANCE (หน้ารายการงาน) : ชื่อเมนู + Version อยู่เหนือช่องค้นหา ในกรอบรายการงานเดียวกัน
   ข้อความเดียวกับแถบบน (#tb-title · .tb-ver) — จอ ≥1101px ซ่อนแถบบน (CSS #app-shell.doc-hd) · จอ ≤1100px คงแถบบนเดิม (ปุ่มเมนู ☰) และไม่แสดงแถวนี้ = ไม่ซ้ำ 2 ตำแหน่ง */
function DH683(){try{let e=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),t=document.getElementById("tb-title"),v=document.querySelector("#app-shell .tb .tb-ver");return'<div class="dh683"><span class="dh683-t">'+e(t&&t.textContent)+"</span>"+(v?'<span class="tb-ver dh683-v" title="'+e(v.getAttribute("title"))+'">'+e(v.textContent)+"</span>":"")+"</div>"}catch(x){return""}}
/* V.685 · DOCUMENT → SERVICE / ADVANCE (หน้ารายการงาน) : แถวบน = สถานะ 3 กล่อง (ซ้าย · #acc499-tabs เดิม) + ปุ่ม Export Excel / คอลัมน์ / + เปิดงาน (ขวา · ปุ่มเดิมจาก .fbar-acts)
   แถวล่าง = ค้นหา / ตัวกรอง / ล้างตัวกรอง / Refresh (ล้างตัวกรอง #ch-clear ย้ายเข้า .fbar-acts คู่กับ Refresh เดิม = อยู่ติดกันเสมอแม้ตกบรรทัด) · ย้าย Element เดิม (ไม่สร้างปุ่มใหม่ · คลิกผ่าน [data-tool] ของหน้าเดิม)
   เรียกจาก Z() ซึ่งทำงานหลังสร้างแถบตัวกรองใหม่ทุกครั้ง → ปุ่มชุดใหม่แทนชุดเดิม (ปุ่มเดียวกันไม่ซ้ำ) · W() เดิมใช้ .tr685-r เป็นที่วางปุ่มคอลัมน์ / + เปิดงาน (ตรวจซ้ำที่เดียวกัน = ไม่สร้างปุ่มซ้ำ) */
function TR685(t,o){try{if((o||"document")!=="document")return;let p=t.querySelector(".ch-panel"),f=t.querySelector("#ch-filter"),tb=t.querySelector("#acc499-tabs");if(!p||!f||!tb)return;let r=p.querySelector(":scope>.tr685");if(!r){r=document.createElement("div");r.className="tr685";r.innerHTML='<div class="tr685-l"></div><div class="tr685-r"></div>';p.insertBefore(r,f)}let L=r.firstElementChild,R=r.lastElementChild;tb.parentNode!==L&&L.appendChild(tb);let a=f.querySelector("#ch-fbar .fbar-acts"),cl=f.querySelector("#ch-fbar>#ch-clear");a&&cl&&a.insertBefore(cl,a.firstChild);a&&[...a.children].forEach(b=>{if((b.getAttribute("data-tool")||"")==="refresh"||b.id==="ch-clear")return;let k=KY685(b);[...R.children].forEach(x=>{x!==b&&KY685(x)===k&&x.remove()});R.appendChild(b)});[...R.children].sort((x,y)=>RK685(x)-RK685(y)).forEach(x=>R.appendChild(x))}catch(x){try{console.warn("TR685",x)}catch(_){}}}
/* ═══ V.822 · ACCOUNTING — SERVICE / ADVANCE : ปุ่ม 🔄 รีเฟรช ต่อจาก "ล้างตัวกรอง" (สร้างใน J() แถวเดียวกัน · J() วาดใหม่ = ปุ่มเดียวแทนที่ ไม่ซ้ำ)
   กด = h() เดิมของหน้า (njacc_charge_page_bundle จาก Database จริง · คงตัวกรอง / แถบ / การเรียง / หน้าเดิม · อัปเดตจำนวนแถบ ทั้งหมด / รอ POST / POST แล้ว)
   ระหว่างโหลด = ไอคอนหมุน + กดซ้ำไม่ได้ · ไม่สำเร็จ = แจ้งเตือนเดิมของหน้า แล้วกดใหม่ได้ · ไม่แตะสิทธิ์ / สูตร / FLOW ═══ */
function ST828(){if(document.getElementById("rf828-css"))return;let s=document.createElement("style");s.id="rf828-css";s.textContent="#ch-rf828.rf828{background:#2563EB;border:1px solid #2563EB;color:#FFFFFF;border-radius:8px!important;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-weight:700;white-space:nowrap;cursor:pointer}#ch-rf828.rf828:hover:not(:disabled){background:#1D4ED8;border-color:#1D4ED8;color:#FFFFFF}#ch-rf828.rf828:disabled{opacity:.75;cursor:progress}#ch-rf828 .rf828-i{flex:none}#ch-rf828.busy .rf828-i{animation:rf828s .8s linear infinite}@keyframes rf828s{to{transform:rotate(360deg)}}";document.head.appendChild(s)}
function RF828(b,h){if(!b||b.__rf828)return;ST828();b.__rf828=1;let c=document.getElementById("ch-clear");c&&c.offsetHeight&&(b.style.height=c.offsetHeight+"px");b.onclick=async()=>{if(b.disabled)return;b.disabled=!0;b.classList.add("busy");b.setAttribute("aria-busy","true");try{await h()}catch(e){try{console.warn("RF828",e)}catch(_){}}finally{b.disabled=!1;b.classList.remove("busy");b.removeAttribute("aria-busy")}}}
function KY685(b){return b.getAttribute("data-tool")||(b.hasAttribute("data-colmg")?"colmg":b.className)}
function RK685(b){let r={"export-excel":0,colmg:1,"new-job":2}[KY685(b)];return r==null?3:r}

/* ═══ V.710 · DOCUMENT → ADVANCE หน้ารายการ : ซ่อนคอลัมน์ ETA / ETD (ข้อมูล / ฟอร์ม CREATE · EDIT · VIEW / PDF / Export เดิมไม่เปลี่ยน)
   เพิ่ม "สถานะจ่ายเงิน" + "ยอดอนุมัติ" (ยอดก่อนหักรวมของรายการจ่ายที่บันทึก) ต่อจาก Customer Job No. · ข้อมูลจริงจาก njacc_adv710_doc_status (RUN-710 · อ่านอย่างเดียว · ทีละหน้า)
   ปุ่มปิดงาน : มีข้อมูลเบิกเงินสำรองจ่าย แต่ยังไม่ส่งคำขอ / รออนุมัติ / ไม่อนุมัติ / จ่ายยังไม่ครบ = กดไม่ได้ (Backend njacc_set_job_status ตรวจซ้ำ) · จ่ายครบ = ปลดล็อก (USER กดปิดเอง) ═══ */
var A710 = new Map(), Q710 = new Set(), T710 = 0;
function fm710(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function ok710(id) { return /^[0-9a-f-]{36}$/i.test(String(id || "")); }
function ZT710(t, cols) {
  if (t !== "ADVANCE") return cols;
  var out = cols.filter(function (c) { return c.l !== "ETA" && c.l !== "ETD"; }), i = out.findIndex(function (c) { return c.l === "Customer Job No."; });
  out.splice(i < 0 ? out.length : i + 1, 0,
    { l: "สถานะจ่ายเงิน", c: function (e) { var id = e && e.id; ok710(id) && Q710q(id); return '<td class="nowrap" data-a710s="' + (ok710(id) ? id : "") + '">' + ST710(id) + "</td>"; } },
    { l: "ยอดอนุมัติ", r: 1, c: function (e) { var id = e && e.id; return '<td class="r nowrap" data-a710g="' + (ok710(id) ? id : "") + '">' + GT710(id) + "</td>"; } });
  return out;
}
function PD710(x) { return !!x && x.req_status === "PAID" && Number(x.paid_count) >= Number(x.req_item_count || 0); }
function D710(x) {
  if (!x) return null;
  if (PD710(x)) return ["จ่ายเงินแล้ว", "g"];
  if (x.req_status === "PAID" || x.req_status === "APPROVED") return ["อนุมัติแล้ว — รอจ่าย", "b"];
  if (x.req_status === "PENDING") return ["รออนุมัติ", "o"];
  if (x.req_status === "REJECTED") return ["ไม่อนุมัติ", "r"];
  if (Number(x.item_count) > 0) return ["ยังไม่ส่งคำขอ", "n"];
  return null;
}
function ST710(id) { id = String(id || ""); if (!A710.has(id)) return '<span class="a710 w">…</span>'; var d = D710(A710.get(id)); return d ? '<span class="a710 ' + d[1] + '">' + d[0] + "</span>" : '<span class="a710 z">—</span>'; }
function GT710(id) { id = String(id || ""); if (!A710.has(id)) return "…"; var x = A710.get(id); return x && Number(x.item_count) > 0 ? fm710(x.gross_total) : "—"; }
function BL710(x) { return !!x && (Number(x.item_count) > 0 || !!x.req_status) && !PD710(x); }
function MS710(x) {
  var s = x && x.req_status;
  return "ปิดงานไม่ได้ — " + (!s ? "มีรายการเบิกเงินสำรองจ่าย แต่ยังไม่ส่งคำขออนุมัติ" : s === "PENDING" ? "คำขอเบิกเงินสำรองจ่ายยังรออนุมัติ" : s === "REJECTED" ? "คำขอไม่อนุมัติ — ใช้ขั้นตอนยกเลิกงานเดิม"
    : "อนุมัติแล้วแต่ยังจ่ายเงินไม่ครบ (จ่ายแล้ว " + (Number(x.paid_count) || 0) + "/" + (Number(x.req_item_count) || 0) + " รายการ)") + " · ปิดงานได้เมื่อจ่ายเงินครบทุกรายการแล้ว";
}
function CK710(id) { id = String(id || ""); var x = A710.get(id); if (!BL710(x)) return !1; try { y(MS710(x), "err"); } catch (e) {} return !0; }
function CS710() {
  if (document.getElementById("a710-css")) return;
  var st = document.createElement("style"); st.id = "a710-css";
  st.textContent = ".a710{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}.a710.o{background:#fff7ed;color:#c2410c}.a710.b{background:#eff6ff;color:#1d4ed8}.a710.g{background:#ecfdf5;color:#15803d}.a710.r{background:#fef2f2;color:#b91c1c}.a710.n{background:#f1f5f9;color:#475569}.a710.z,.a710.w{color:#94a3b8;padding:0}";
  document.head.appendChild(st);
}
function Q710q(id) { Q710.add(String(id)); clearTimeout(T710); T710 = setTimeout(F710, 0); }
function P710(ids) {
  ids.forEach(function (id) {
    var x = A710.get(id), bl = BL710(x);
    document.querySelectorAll('[data-a710s="' + id + '"]').forEach(function (td) { td.innerHTML = ST710(id); });
    document.querySelectorAll('[data-a710g="' + id + '"]').forEach(function (td) { td.textContent = GT710(id); });
    document.querySelectorAll('button[data-act="close"][data-id="' + id + '"]').forEach(function (b) {
      if (bl) { b.disabled = !0; b.title = MS710(x); b.dataset.a710 = "1"; } else if (b.dataset.a710) { b.disabled = !1; b.removeAttribute("title"); delete b.dataset.a710; }
    });
  });
}
async function F710() {
  var ids = [...Q710]; Q710.clear(); if (!ids.length) return; CS710();
  for (var k = 0; k < ids.length; k += 200) {
    var part = ids.slice(k, k + 200);
    try {
      var r = await RPC710("njacc_adv710_doc_status", { p_ids: part }); if (!Array.isArray(r)) throw new Error("ADV710");
      var mp = new Map(r.map(function (x) { return [String(x.id), x]; }));
      part.forEach(function (id) { A710.set(id, mp.has(id) ? mp.get(id) : null); }); P710(part);
    } catch (e) {
      part.forEach(function (id) { if (A710.has(id)) return;
        document.querySelectorAll('[data-a710s="' + id + '"]').forEach(function (td) { td.innerHTML = '<span class="a710 z" title="โหลดสถานะจ่ายเงินไม่สำเร็จ">?</span>'; });
        document.querySelectorAll('[data-a710g="' + id + '"]').forEach(function (td) { td.textContent = "?"; }); });
    }
  }
}

/* ═══ V.712 · DOCUMENT → SERVICE / ADVANCE หน้ารายการ : ปุ่ม "ลบ JOB" (สีแดง · ถังขยะ) เฉพาะ SUPER_ADMIN · JOB มีเลขแล้ว · ยังไม่ CLOSE
   ยืนยันก่อนลบ → njacc_delete_job712 (RUN-712 · Backend ตรวจสิทธิ์ / สถานะ / INVOICE / BILLING / คำขอเบิกเงินซ้ำ · Snapshot ใน Audit · เลขไม่ถูกใช้ซ้ำ) → Refresh รายการ + ยอดสรุป
   ปุ่มลบงานที่ยังไม่ POST เดิม (ทุก Role ที่แก้ไขได้) ไม่เปลี่ยน ═══ */
function SU712() { try { return ((AS712 && AS712.profile) || {}).role === "SUPER_ADMIN"; } catch (e) { return !1; } }
function DB712(t) {   /* V.738 : SUPER_ADMIN — ยังไม่เคยออกเลข INVOICE = ลบ JOB (POST / CLOSE / ไม่อนุมัติ / ยกเลิก) · เคยออกเลข INVOICE = ยกเลิก JOB (ประวัติจริงจาก njacc_job738_inv_hist) */
  if (!t || !SU712() || !t.job_no || (t.charge_type !== "SERVICE" && t.charge_type !== "ADVANCE")) return "";
  var id = String(t.id), h = HI738.has(id) ? HI738.get(id) : !!t.invoice_id;
  HI738.has(id) || QH738(id);
  return BH738(id, t.job_no, t.operational_status, h);
}
var HI738 = new Map(), QI738 = new Set(), TI738 = 0;
function BH738(id, no, st, h) {
  if (h) return st === "CANCELED" ? '<span class="t-xs t-3" data-k738="' + n(id) + '" data-no="' + n(no) + '" data-st="' + n(st) + '">\u2014</span>' :
    '<button class="btn btn-danger-soft btn-sm" data-act="cancel" data-k738="' + n(id) + '" data-id="' + n(id) + '" data-no="' + n(no) + '" data-st="' + n(st) + '" title="JOB เคยออก INVOICE แล้ว — ยกเลิก JOB (เก็บเลข JOB / INVOICE เดิม)">ยกเลิก JOB</button>';
  return '<button class="btn btn-danger btn-sm" data-act="del712" data-k738="' + n(id) + '" data-id="' + n(id) + '" data-no="' + n(no) + '" data-st="' + n(st) + '" title="ลบ JOB (SUPER_ADMIN)">\u{1F5D1} ลบ JOB</button>';
}
function QH738(id) { QI738.add(id); clearTimeout(TI738); TI738 = setTimeout(FH738, 0); }
async function FH738() {
  var ids = [...QI738].filter(function (x) { return /^[0-9a-f-]{36}$/i.test(x); }); QI738.clear();
  for (var k = 0; k < ids.length; k += 200) {
    var part = ids.slice(k, k + 200);
    try {
      var r = await RPC710("njacc_job738_inv_hist", { p_ids: part }); if (!Array.isArray(r)) continue;
      var hs = new Set(r.map(String));
      part.forEach(function (id) { var h = hs.has(id); HI738.set(id, h);
        document.querySelectorAll('[data-k738="' + id + '"]').forEach(function (b) {
          var cur = b.dataset.act === "cancel" || !b.dataset.act; if (cur === h) return;
          b.outerHTML = BH738(id, b.dataset.no || "", b.dataset.st || "", h); }); });
    } catch (e) {}
  }
}
function DW712(t, c) { var d = DB712(t); return (c || "") + d || '<span class="t-xs t-3">\u2014</span>'; }
function CF712(no) {
  return new Promise(function (ok) {
    var bk = document.createElement("div"); bk.className = "d712-bk";
    bk.innerHTML = '<div class="d712" role="dialog" aria-modal="true"><div class="d712-t">ยืนยันการลบ JOB</div><div class="d712-b">เลข JOB: <b>' + n(no) + '</b><br>คุณต้องการลบ JOB นี้ใช่หรือไม่?</div>' +
      '<div class="d712-f"><button type="button" class="d712-c" data-n>ยกเลิก</button><button type="button" class="d712-y" data-y>ยืนยันลบ JOB</button></div></div>';
    if (!document.getElementById("d712-css")) { var st = document.createElement("style"); st.id = "d712-css";
      st.textContent = ".d712-bk{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:10050;padding:16px}.d712{background:#fff;border-radius:14px;width:100%;max-width:400px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:18px 18px 14px;font-family:inherit}.d712-t{font-weight:700;font-size:16px;color:#b91c1c;margin-bottom:10px}.d712-b{font-size:14px;color:#0f172a;line-height:1.7}.d712-f{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.d712-f button{height:36px;padding:0 16px;border-radius:9px;font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit;border:0}.d712-c{background:#e2e8f0;color:#334155}.d712-y{background:#dc2626;color:#fff}.d712-y:disabled{opacity:.6;cursor:default}";
      document.head.appendChild(st); }
    var done = function (v) { document.removeEventListener("keydown", kd, !0); bk.remove(); ok(v); }, kd = function (e) { if (e.key === "Escape") { e.preventDefault(); done(!1); } };
    bk.addEventListener("click", function (e) { if (e.target === bk || e.target.closest("[data-n]")) done(!1); else if (e.target.closest("[data-y]")) done(!0); });
    document.addEventListener("keydown", kd, !0); document.body.appendChild(bk);
    try { bk.querySelector("[data-n]").focus(); } catch (e) {}
  });
}
var BZ712 = new Set();
async function DEL712(id, btn, refresh) {
  if (!id || BZ712.has(id)) return;
  var no = btn && btn.dataset.no || "";
  if (!await CF712(no)) return;
  BZ712.add(id); btn && (btn.disabled = !0);
  try {
    var r = await RPC710("njacc_delete_job712", { p_id: id, p_reason: null });
    try { y("ลบ JOB " + ((r && r.job_no) || no) + " แล้ว", "ok"); } catch (e) {}
    var tr = btn && btn.closest("tr"); tr && tr.remove();
    refresh && refresh();
  } catch (e) {
    var m = String(e && (e.message || e.code) || e || ""), mm = /NJACC_DELETE712_[A-Z_]+:\s*(.+)$/.exec(m);
    try { y("ลบ JOB ไม่สำเร็จ — " + (mm ? mm[1] : /NJACC_FORBIDDEN/.test(m) ? "ไม่มีสิทธิ์" : /njacc_delete_job712|PGRST202|schema cache/i.test(m) ? "ระบบยังไม่พร้อม (ต้องรัน RUN-712)" : m), "err"); } catch (e2) {}
    btn && (btn.disabled = !1);
  } finally { BZ712.delete(id); }
}

/* ═══ V.734 FINANCE — RECEIPT / ADVANCE : EXPORT EXCEL (ข้อมูลครบทุกหน้า ตามตัวกรอง / การเรียงปัจจุบัน · อ่านอย่างเดียว ไม่แก้ข้อมูล) ═══ */
var XI734 = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 12 4 5M13 12l-4 5"/></svg>';
function XS734() { try { if (document.getElementById("xl734-css")) return; let s = document.createElement("style"); s.id = "xl734-css";
  s.textContent = ".btn.xl734{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#16a34a!important;border:1px solid #15803d!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.xl734:hover:not(:disabled){background:#15803d!important}.btn.xl734:disabled{opacity:.6;cursor:wait}";
  document.head.appendChild(s); } catch (e) {} }
function XB734(id) { XS734(); return `<button type="button" class="btn btn-sm xl734" id="${id}" title="ส่งออกข้อมูลทุกหน้าตามตัวกรองปัจจุบันเป็นไฟล์ Excel">${XI734}EXPORT EXCEL</button>`; }
async function XW734(base, cols, rows) {
  let EX = await XLJ734(), wb = new EX.Workbook(), ws = wb.addWorksheet(base.replace(/^FINANCE_/, ""), { views: [{ state: "frozen", ySplit: 1 }] });
  let TH = { style: "thin", color: { argb: "FFD9E2EC" } }, BD = { top: TH, left: TH, bottom: TH, right: TH }, W = cols.map((c) => Math.max(10, String(c[0]).length + 4)), hr = ws.getRow(1);
  cols.forEach((c, j) => { let x = hr.getCell(j + 1); x.value = c[0]; x.font = { bold: !0, color: { argb: "FFFFFFFF" } }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17365D" } }; x.border = BD; x.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; });
  hr.height = 30;
  rows.forEach((r, i) => { let row = ws.getRow(i + 2); cols.forEach((c, j) => { let x = row.getCell(j + 1), v = c[1](r), t = c[2], L;
    if (t === "int") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; } else { x.value = n; x.numFmt = "0"; } x.alignment = { horizontal: "center", vertical: "middle" }; L = 12; }   /* V.811 : จำนวน (เต็มหน่วย) */
    else if (t === "num") { let n = Number(v); if (v == null || v === "" || !Number.isFinite(n)) { x.value = "-"; x.alignment = { horizontal: "center", vertical: "middle" }; } else { x.value = Math.round(n * 100) / 100; x.numFmt = "#,##0.00"; x.alignment = { horizontal: "right", vertical: "middle" }; } L = 15; }
    else if (t === "date") { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); if (m) { x.value = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); x.numFmt = "dd/mm/yyyy"; } else x.value = c[3] === "blank" ? null : "-"; x.alignment = { horizontal: "center", vertical: "middle" }; L = 13; }   /* V.889 */
    else { let s = v == null ? "" : String(v).replace(/\s+/g, " ").trim(); x.value = s || (c[3] === "blank" ? null : "-"); x.alignment = { vertical: "middle", horizontal: s ? "left" : "center" }; L = String(s || "-").length + 3; }   /* V.889 : blank = ไม่มีข้อมูล → เว้นว่าง */
    x.border = BD; W[j] = Math.min(60, Math.max(W[j], L)); }); });
  W.forEach((w, j) => { ws.getColumn(j + 1).width = w; });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: cols.length } };
  let d = new Date(), p = (n) => String(n).padStart(2, "0"), fn = base + "_" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + ".xlsx";
  let buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
  a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 6e3);
  return fn;
}
async function XF734(fetchPage, max) {   /* ดึงทุกหน้า (ไม่ขึ้นกับหน้าที่เปิด) · กันข้อมูลซ้ำด้วย key */
  let all = [], seen = new Set(), page = 1, total = null;
  for (; page <= 2000; page++) {
    let r = await fetchPage(page, max), rows = (r && r.rows) || [];
    total == null && (total = Number(r && r.total) || 0);
    rows.forEach((x) => { let k = x.__k734; if (k == null || !seen.has(k)) { k != null && seen.add(k); all.push(x); } });
    if (!rows.length || page * max >= total) break;
  }
  return { rows: all, total: total || 0 };
}
function FA734(z) {   /* หัวตาราง : 4 คอลัมน์ต่อจาก ลูกค้า ก่อน Customer Job No. (ข้อมูลจริงจาก JOB · ชุดเดียวกับ SERVICE) */
  return String(z || "").replace(/(<th data-col-key="customer_name">[^<]*<\/th>)/, '$1<th data-col-key="customs_declaration_no">เลขใบขนสินค้า</th><th data-col-key="source_invoice_no">Invoice ต้นทาง (Source)</th><th data-col-key="house_bl_no">House B/L No.</th><th data-col-key="master_bl_no">Master B/L No.</th>');
}
function XT734(r) { try { let d = document.createElement("table"); d.innerHTML = "<tbody><tr>" + GA694(r) + "</tr></tbody>"; return [...d.querySelectorAll("td span")].map((x) => x.textContent.trim()).filter(Boolean).join(" · "); } catch (e) { return String(r && r.operational_status || ""); } }
function XA734(t) {   /* ADVANCE : ปุ่มในแถบตัวกรอง (แถบเครื่องมือเดิมถูกซ่อนในหน้านี้) · ดึงทุกหน้าด้วยเงื่อนไขเดียวกับตาราง (njacc_list_charges = สิทธิ์ view เดิม) */
  if (t.__xl734) return; t.__xl734 = 1;
  t.addEventListener("click", async (ev) => {
    let b = ev.target.closest && ev.target.closest("#ch-xl734"); if (!b || b.disabled || !t.contains(b)) return;
    let q = t.__q734; if (!q) { y("ยังโหลดรายการไม่เสร็จ — กรุณาลองใหม่", "err"); return; }
    b.disabled = !0; let lb = b.innerHTML; b.textContent = "กำลังส่งออก…";
    try {
      let f = Object.assign({}, q, { withOptions: !1, withKpi: !1, filters: Object.assign({}, q.filters) });
      let r = await XF734(async (pg, sz) => { let x = await LC734(Object.assign({}, f, { page: pg, size: sz })); ((x && x.rows) || []).forEach((o) => { o.__k734 = o.id || null; }); return x; }, 100);
      let cols = [["BILLING NOTE NO.", (o) => o.billing_note_no], ["เลขที่งาน", (o) => o.job_no],
        ["INVOICE ADV", (o) => o.invoice_no, null, "blank"],   /* V.889 : เลข INVOICE ADV จริงของ JOB (ACCOUNTING → ADVANCE) · ไม่ใช่ BILLING NOTE NO. · ร่าง / ยังไม่ออก = เว้นว่าง */
        ["วันที่วางบิล", (o) => o.invoice_date, "date", "blank"],   /* V.889 : วันที่ของ INVOICE ADV จริง (คนละค่ากับคอลัมน์ Date เดิมที่ไม่ถูกแตะ) */
        ["ลูกค้า", (o) => o.customer_name],
        ["บริษัท *", (o) => o.company_invoice, null, "blank"],   /* V.889 : บริษัทที่ผูกกับ JOB (company_invoice_id) · ไม่ใช่ชื่อลูกค้า */
        ["เลขใบขนสินค้า", (o) => o.customs_declaration_no], ["Invoice ต้นทาง (Source)", (o) => o.source_invoice_no],
        ["House B/L No.", (o) => o.house_bl_no], ["Master B/L No.", (o) => o.master_bl_no], ["Customer Job No.", (o) => o.customer_job_no], ["Date", (o) => o.date, "date"], ["สถานะ", XT734],
        ["PAY / UNPAID", (o) => (String(o.advance_status || "") === "PAID" ? "PAY" : "UNPAID")], ["Advance", (o) => o.advance_amount, "num"], ["Total", (o) => o.net_payable, "num"]];
      let fn = await XW734("FINANCE_ADVANCE", cols, r.rows);
      let mi889 = (k) => r.rows.filter((o) => !String(o[k] == null ? "" : o[k]).trim()).length;   /* V.889 : รายงานรายการที่ไม่มีข้อมูล (เว้นว่างในไฟล์) */
      let ms889 = [["INVOICE ADV", mi889("invoice_no")], ["วันที่วางบิล", mi889("invoice_date")], ["บริษัท *", mi889("company_invoice")]].filter((x) => x[1] > 0).map((x) => x[0] + " " + x[1] + " รายการ");
      y("ส่งออก Excel " + r.rows.length.toLocaleString("th-TH") + " รายการแล้ว (" + fn + ")" + (ms889.length ? " · ไม่มีข้อมูล (เว้นว่าง) : " + ms889.join(" · ") : ""), "ok");
    } catch (e) { y("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); }
    b.disabled = !1; b.innerHTML = lb;
  });
}
/* ═══ V.740 DOCUMENT — SERVICE : เลือกหลาย JOB → PRINT SELECTED (CREATE PDF · PREVIEW · PRINT / DOWNLOAD PDF)
   Checkbox หน้าเลข JOB (ในช่อง JOB NJ เดิม — ไม่เพิ่มคอลัมน์ · Layout คอลัมน์ / Export Excel เดิม) · หัวตาราง = เลือกทั้งหมดในหน้าปัจจุบัน
   เลือกข้ามหน้าได้ (จำไว้ตลอดการใช้งานหน้ารายการนี้) · เรียงตามลำดับที่แสดงในรายการ (หน้า → แถว)
   แบบฟอร์ม = docHTML เดิมของ PDF ใบงาน (job-form-doc · ไม่แก้แม่แบบ) · ข้อมูลแต่ละ JOB จาก njacc_job_detail เดิม (อ่านอย่างเดียว · ตรวจสิทธิ์การมองเห็นที่ Backend เดิม)
   1 JOB = เริ่มหน้าใหม่ · JOB ที่สร้างไม่สำเร็จ = แจ้งเลข JOB + สาเหตุ (ไม่ข้ามเงียบ) · ไม่แก้ข้อมูล / สถานะ JOB ═══ */
var DPC740 = (e) => `<label class="dp740-cb" title="เลือก JOB นี้เพื่อพิมพ์"><input type="checkbox" data-dp740="1" data-id="${n(e.id)}" data-no="${n(e.job_no || "")}" aria-label="เลือก JOB ${n(e.job_no || "")}"></label>`;
function DPCSS740() {
  if (document.getElementById("dp740-css")) return;
  let st = document.createElement("style");
  st.id = "dp740-css";
  st.textContent = ".dp740-cb{display:inline-flex;align-items:center;margin:0 8px 0 0;vertical-align:middle;cursor:pointer}" +
    ".dp740-cb input,.dp740-hcb{width:16px;height:16px;margin:0;cursor:pointer;accent-color:#7c3aed;vertical-align:middle}" +
    "th[data-dp740-h] .dp740-hcb{margin-right:8px}" +
    ".dp740-bar{display:inline-flex;align-items:center;gap:8px;flex-wrap:nowrap;margin-right:4px}" +
    ".dp740-n{font-size:13px;font-weight:600;color:#6d28d9;white-space:nowrap}.dp740-n.z{color:#94a3b8;font-weight:500;display:none}/* V.806 : ซ่อนข้อความ ยังไม่เลือก JOB (ตัวแปร / การตรวจเลือก JOB เดิม) */" +
    ".btn.dp740-print{background:#7c3aed;border-color:#7c3aed;color:#fff;font-weight:600;white-space:nowrap}" +
    ".btn.dp740-print:not(:disabled):hover{background:#6d28d9;border-color:#6d28d9;color:#fff}" +
    ".btn.dp740-print:disabled{background:#c4b5fd;border-color:#c4b5fd;color:#fff;opacity:1;cursor:not-allowed}" +
    ".btn.dp740-clr{white-space:nowrap}" +
    "tr.dp740-on>td{background:#f5f3ff}" +
    "@media screen{.dp740-modal .dp740-pages{display:flex;flex-direction:column;align-items:center;gap:18px}" +
    ".dp740-msg{max-width:210mm;margin:0 auto 14px;padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.55;background:#fff;border:1px solid #cbd5e1;color:#0f172a}" +
    ".dp740-msg.ok{background:#f0fdf4;border-color:#86efac;color:#14532d}.dp740-msg.err{background:#fef2f2;border-color:#fca5a5;color:#991b1b}" +
    ".dp740-msg ul{margin:6px 0 4px 18px;padding:0}.dp740-msg .btn{margin-top:6px}" +
    ".dp740-pgno{font-size:12px;font-weight:600;color:#475569;margin:0 0 6px;align-self:center}" +
    ".dp740-info{font-size:12px;color:#475569;white-space:nowrap;margin-left:10px}}" +
    "@media print{.dp740-pg{break-after:page;page-break-after:always}.dp740-pg:last-child{break-after:auto;page-break-after:auto}.dp740-msg,.dp740-pgno{display:none!important}}";
  document.head.appendChild(st);
}
var DPR740 = (e) => {
  let s = String(e && e.message || e || "");
  return /NJACC_MODULE_FORBIDDEN/.test(s) ? "ไม่มีสิทธิ์เมนู DOCUMENT"
    : /NJACC_FORBIDDEN|ไม่มีสิทธิ์|permission denied|42501/i.test(s) ? "ไม่มีสิทธิ์ดู JOB นี้ (นอกขอบเขตการมองเห็น)"
    : /NJACC_JOB_NOT_FOUND|ไม่พบ/.test(s) ? "ไม่พบ JOB (อาจถูกลบแล้ว)"
    : /pldbgapi2/i.test(s) ? "ฐานข้อมูลขัดข้องชั่วคราว (pldbgapi2 · Supabase) — กดลองใหม่"
    : /Failed to fetch|NetworkError|network/i.test(s) ? "เชื่อมต่อเครือข่ายไม่ได้ — กดลองใหม่"
    : s || "เกิดข้อผิดพลาด";
};
var DPT740 = (e) => /pldbgapi2|XX000|Failed to fetch|NetworkError/i.test(String(e && e.message || e || ""));
var DPF740 = (root) => { try { root.querySelectorAll(".jfd-cs586,.jfd-rc613").forEach((el) => { el.style.fontSize = ""; if (!el.textContent || el.scrollWidth <= el.clientWidth + .5) return; let f0 = parseFloat(getComputedStyle(el).fontSize) || 14, f = f0; for (; el.scrollWidth > el.clientWidth + .5 && f > f0 * .45;) f = Math.round((f - .25) * 100) / 100, el.style.fontSize = f + "px"; }); } catch (e) {} };   /* = FIT586 เดิมของ PDF ใบงาน (ย่อเฉพาะข้อความยาวให้พอดีช่อง) */
var DPROWS740 = (t) => [...t.querySelectorAll("#ch-tbody tr[data-row]")];
function DPADD740(s, cb, i) { let id = cb.dataset.id; if (!id) return; s.sel.has(id) || s.sel.set(id, { id, no: cb.dataset.no || "", ord: (s.page - 1) * s.size + (i < 0 ? 0 : i), seq: ++s.seq }); }
function DPU740(t) {
  let s = t.__dp740; if (!s) return;
  let nOn = 0, nCb = 0;
  DPROWS740(t).forEach((tr) => { let cb = tr.querySelector("input[data-dp740]"); if (!cb) return; nCb++; let on = s.sel.has(cb.dataset.id); cb.checked !== on && (cb.checked = on); on && nOn++; tr.classList.toggle("dp740-on", on); });
  let th = t.querySelector("table.tbl-charge thead th[data-dp740-h]");
  if (th) {
    let h = th.querySelector("input.dp740-hcb");
    if (!h) { h = document.createElement("input"); h.type = "checkbox"; h.className = "dp740-hcb"; h.title = "เลือกทั้งหมดในหน้านี้"; h.setAttribute("aria-label", "เลือกทั้งหมดในหน้านี้"); th.insertBefore(h, th.firstChild); }
    h.disabled = !nCb; h.checked = nCb > 0 && nOn === nCb; h.indeterminate = nOn > 0 && nOn < nCb;
    if (!th.__dp740mo && window.MutationObserver) { th.__dp740mo = new MutationObserver(() => { th.isConnected && !th.querySelector("input.dp740-hcb") && DPU740(t); }); th.__dp740mo.observe(th, { childList: !0 }); }
  }
  let host = t.querySelector(".ch-panel>.tr685>.tr685-r") || t.querySelector(".fbar-acts") || t.querySelector(".ch-tools") || t.querySelector("#ch-fbar"), bar = t.querySelector(".dp740-bar");
  if (host && (!bar || !host.contains(bar))) {
    bar && bar.remove();
    host.insertAdjacentHTML("afterbegin", '<span class="dp740-bar"><span class="dp740-n" aria-live="polite"></span><button type="button" class="btn btn-sm dp740-print" data-dp740-act="print" title="CREATE PDF — รวมเฉพาะ JOB ที่เลือก (1 JOB = 1 หน้า) · PREVIEW · PRINT / DOWNLOAD PDF">\u{1F5A8} PRINT SELECTED</button><button type="button" class="btn btn-o btn-sm dp740-clr" data-dp740-act="clear" title="ยกเลิกการเลือกทั้งหมด (ทุกหน้า)">✕ ล้างที่เลือก</button></span>');
    bar = host.querySelector(".dp740-bar");
  }
  host && bar && host.firstElementChild !== bar && host.insertBefore(bar, host.firstChild);   /* แถบเลือก JOB อยู่หน้าปุ่มเดิมเสมอ */
  if (bar) {
    let k = s.sel.size, ne = bar.querySelector(".dp740-n"), pb = bar.querySelector(".dp740-print"), cl = bar.querySelector(".dp740-clr");
    ne.textContent = k ? "เลือกแล้ว " + k.toLocaleString("th-TH") + " JOB" : "ยังไม่เลือก JOB"; ne.classList.toggle("z", !k); pb.disabled = !k; cl.style.display = k ? "" : "none";
  }
}
function DPS740(t, d, C) {
  try {
    let s = t.__dp740;
    if (!s || s.key !== C) s = t.__dp740 = { key: C, sel: new Map(), seq: 0, page: 1, size: 20 };
    s.page = Number(d && d.page) || 1; s.size = Number(d && d.size) || 20;
    DPCSS740();
    if (!t.__dp740b) {
      t.__dp740b = 1;
      t.addEventListener("change", (ev) => {
        let s = t.__dp740, x = ev.target; if (!s || !x || !x.matches) return;
        if (x.matches("input[data-dp740]")) { let i = DPROWS740(t).indexOf(x.closest("tr[data-row]")); x.checked ? DPADD740(s, x, i) : s.sel.delete(x.dataset.id); DPU740(t); return; }
        if (x.matches("input.dp740-hcb")) { let on = x.checked; DPROWS740(t).forEach((tr, i) => { let cb = tr.querySelector("input[data-dp740]"); cb && (on ? DPADD740(s, cb, i) : s.sel.delete(cb.dataset.id)); }); DPU740(t); }
      });
      t.addEventListener("click", (ev) => {
        let b = ev.target && ev.target.closest && ev.target.closest("[data-dp740-act]"); if (!b || !t.contains(b)) return;
        ev.preventDefault(); let s = t.__dp740; if (!s) return;
        if (b.dataset.dp740Act === "clear") { s.sel.clear(); DPU740(t); return; }
        if (b.dataset.dp740Act === "print" && s.sel.size) DPP740(t).catch(m);
      });
    }
    DPROWS740(t).forEach((tr, i) => { let cb = tr.querySelector("input[data-dp740]"), v = cb && s.sel.get(cb.dataset.id); v && (v.ord = (s.page - 1) * s.size + i, cb.dataset.no && (v.no = cb.dataset.no)); });
    DPU740(t);
  } catch (e) { console.error("[DP740]", e); }
}
async function DPP740(t) {
  let s = t.__dp740; if (!s || !s.sel.size) return;
  let list = [...s.sel.values()].sort((a, b) => a.ord - b.ord || a.seq - b.seq), N = list.length;
  let body = document.createElement("div"), foot = document.createElement("div");
  body.innerHTML = `<div class="dp740-msg" id="dp740-msg">⏳ CREATE PDF — กำลังสร้าง 0/${N} JOB …</div><div class="dp740-pages"></div>`;
  foot.innerHTML = `<div class="mf-left"><div class="jfd-zoom" role="group" aria-label="ซูมเอกสาร"><button type="button" class="btn btn-o btn-sm" data-jz="out" aria-label="ย่อ">−</button><button type="button" class="btn btn-o btn-sm" data-jz="100">100%</button><button type="button" class="btn btn-o btn-sm" data-jz="in" aria-label="ขยาย">+</button><button type="button" class="btn btn-o btn-sm" data-jz="fit">Fit to Screen</button><span class="jfd-zoom-v" aria-live="polite"></span></div><span class="dp740-info"></span></div>
    <div class="mf-right">
      <button class="btn btn-print" id="dp740-print" disabled>\u{1F5A8} PRINT</button>
      <button class="btn btn-p" id="dp740-pdf" disabled title="เปิดหน้าต่างพิมพ์ → เลือก Save as PDF / บันทึกเป็น PDF (วิธีเดียวกับปุ่ม Save PDF ราย JOB เดิม)">\u{1F4BE} DOWNLOAD PDF</button>
      <button class="btn btn-o" id="dp740-back">✕ ปิด</button>
    </div>`;
  mt({ title: "PRINT SELECTED — " + N + " JOB", body, footer: foot, fullscreen: !0, wide: !0, cls: "jfd-modal dp740-modal" });
  let msg = body.querySelector("#dp740-msg"), pages = body.querySelector(".dp740-pages"), info = foot.querySelector(".dp740-info"), Z = { m: "fit", k: 1 }, zv = foot.querySelector(".jfd-zoom-v");
  let fit = () => {
    let mb = body.closest(".modal-b"), ps = [...pages.querySelectorAll(".dp740-pg .jfd")]; if (!ps.length) return;
    let f; if (Z.m === "fit") { let cs = mb ? getComputedStyle(mb) : null, aw = (mb ? mb.clientWidth : innerWidth) - (cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 0); f = Math.max(.3, Math.min(1.5, aw / ps[0].offsetWidth)); } else f = Z.k;
    f = Math.round(f * 1e3) / 1e3; Z.k = f; zv && (zv.textContent = Math.round(f * 100) + "%");
    pages.querySelectorAll(".dp740-pg").forEach((pg) => { let st = pg.querySelector(".jfd-stage"), sc = pg.querySelector(".jfd-scale"), l = pg.querySelector(".jfd"); if (!st || !sc || !l) return; sc.style.setProperty("--jfd-k", String(f)); st.style.setProperty("--jfd-sw", Math.ceil(l.offsetWidth * f) + "px"); st.style.setProperty("--jfd-sh", Math.ceil(l.offsetHeight * f) + "px"); });
  }, rz = () => { if (!document.body.contains(body)) { window.removeEventListener("resize", rz); return; } fit(); };
  foot.querySelector(".jfd-zoom").addEventListener("click", (z) => { let bt = z.target.closest("[data-jz]"); if (!bt) return; let a = bt.dataset.jz; a === "fit" ? Z.m = "fit" : (Z.m = "zoom", Z.k = a === "100" ? 1 : Math.min(3, Math.max(.3, Math.round((Z.k + (a === "in" ? .1 : -.1)) * 10) / 10))); fit(); });
  foot.querySelector("#dp740-back").onclick = () => { window.removeEventListener("resize", rz); yt(); };
  window.addEventListener("resize", rz);
  let D, J;
  try { [D, J] = await Promise.all([import("./job-form-doc-S2SFOC6V.js"), import("./chunk-VS5POHCJ.js")]); try { await (await import("./chunk-L5Z2NDJ3.js")).k(); } catch {} }
  catch (e) { msg.className = "dp740-msg err"; msg.textContent = "⚠ โหลดแบบฟอร์ม PDF ไม่สำเร็จ — " + DPR740(e); throw e; }
  let res = new Array(N), done = 0, next = 0;
  let run = async () => {
    for (;;) {
      let i = next++; if (i >= N) return;
      let it = list[i], r = null, err = null;
      for (let a = 0; a < 2; a++) { try { r = await J.b(it.id); err = null; break; } catch (e) { err = e; if (!DPT740(e)) break; } }   /* ขัดข้องชั่วคราว = ลองซ้ำ 1 ครั้ง · ยังไม่ได้ = แจ้งเลข JOB + สาเหตุ */
      if (!err && (!r || String(r.id) !== String(it.id))) err = new Error("ข้อมูลที่ได้ไม่ตรงกับ JOB ที่เลือก");
      if (!err && String(r.charge_type || "").toUpperCase() !== "SERVICE") err = new Error("ไม่ใช่ JOB SERVICE");
      res[i] = err ? { it, err } : { it, job: r }; done++;
      document.body.contains(body) && (msg.textContent = "⏳ CREATE PDF — กำลังสร้าง " + done + "/" + N + " JOB …");
    }
  };
  await Promise.all([run(), run(), run()]);
  if (!document.body.contains(body)) return;
  let html = [], ok = [], bad = [];
  res.forEach((x) => { if (x.err) { bad.push(x); return; } try { html.push(D.docHTML(x.job)); ok.push(x); } catch (e) { x.err = e; bad.push(x); } });
  pages.innerHTML = ok.map((x, k) => `<div class="dp740-pg" data-job="${n(x.job.id)}"><div class="dp740-pgno">หน้า ${k + 1}/${ok.length} · JOB ${n(x.job.job_no || x.it.no || "-")}</div><div class="jfd-stage"><div class="jfd-scale">${html[k]}</div></div></div>`).join("");
  DPF740(pages); fit();
  let nos = ok.map((x) => x.job.job_no || x.it.no || "");
  if (bad.length) {
    msg.className = "dp740-msg err";
    msg.innerHTML = `⚠ สร้าง PDF ไม่สำเร็จ <b>${bad.length}</b> จาก ${N} JOB — <b>ไม่รวมในไฟล์</b>:<ul>${bad.map((x) => `<li><b>JOB ${n(x.it.no || x.it.id)}</b> — ${n(DPR740(x.err))}</li>`).join("")}</ul>${ok.length ? "พร้อมพิมพ์ " + ok.length + " JOB" : "ไม่มี JOB ที่พร้อมพิมพ์"} · <button type="button" class="btn btn-o btn-sm" id="dp740-retry">↻ ลองสร้างใหม่ทั้งหมด</button>`;
    msg.querySelector("#dp740-retry").onclick = () => { window.removeEventListener("resize", rz); DPP740(t).catch(m); };
    y("สร้าง PDF ไม่สำเร็จ " + bad.length + " JOB: " + bad.map((x) => x.it.no || x.it.id).join(", "), "err");
  } else {
    msg.className = "dp740-msg ok";
    msg.textContent = "✅ CREATE PDF สำเร็จ " + ok.length + " JOB · 1 JOB = 1 หน้า · เรียงตามรายการ — กด PRINT หรือ DOWNLOAD PDF";
  }
  info.textContent = ok.length + " JOB · " + ok.length + " หน้า";
  let pb = foot.querySelector("#dp740-print"), pd = foot.querySelector("#dp740-pdf");
  pb.disabled = pd.disabled = !ok.length;
  pb.onclick = () => window.print();
  pd.onclick = () => {
    let c = document.title, dt = new Date(), p2 = (v) => String(v).padStart(2, "0");
    document.title = ok.length === 1 ? "JOB-NJ_" + (nos[0] || "JOB") : "JOB-NJ_" + ok.length + "JOB_" + (nos[0] || "") + "_" + (nos[ok.length - 1] || "") + "_" + dt.getFullYear() + p2(dt.getMonth() + 1) + p2(dt.getDate());
    let l = () => { document.title = c; window.removeEventListener("afterprint", l); };
    window.addEventListener("afterprint", l); window.print(); l();
  };
}

/* ═══ V.742 · DOCUMENT → SERVICE / ACCOUNTING → SERVICE หน้ารายการ (List View) : คอลัมน์แสดงผลเท่านั้น
   "นอกราคาขาย" (ทั้ง 2 เมนู ต่อจาก Master B/L No.) = รวม "เก็บลูกค้าได้ (บาท)" ของ DOCUMENT → SERVICE → นอกราคาขาย · ไม่รวมรายการ "เก็บลูกค้าไม่ได้" / รายการที่ลบ
     อ่านจาก RPC อ่านอย่างเดียว njacc_xp742_sum (RUN-742 · สิทธิ์ดูเดิม njacc_xp717_can_view) — ค่าเดียวกันทั้ง 2 เมนู · ไม่มีรายการ = 0.00
   "วันที่วางบิล" (ACCOUNTING ต่อจาก Invoice No.) = วันที่วางบิลที่บันทึกใน INVOICE ของ JOB (ช่อง "วันที่วางบิล" หน้าต่างออก INVOICE เดิม · invoice_date) · ไม่มี = –
   ไม่ส่งออก EXCEL (ไม่มี data-col-key · data-col-export="no") · SEARCH / FILTER / SORT / PAGINATION / ยอด INVOICE เดิม ═══ */
var X742 = new Map(), Q742 = new Set(), T742 = 0, L742 = "นอกราคาขาย", B742 = "วันที่วางบิล";
function ok742(id) { return /^[0-9a-f-]{36}$/i.test(String(id || "")); }
function V742(id) { id = String(id || ""); if (!X742.has(id)) return "…"; var v = X742.get(id); return v == null ? "-" : f(Number(v) || 0); }
function XC742(e) { var id = e && e.id, k = ok742(id); k && (Q742.add(String(id)), clearTimeout(T742), T742 = setTimeout(F742, 0)); return '<td class="r nowrap" data-x742="' + (k ? n(id) : "") + '">' + (k ? V742(id) : "-") + "</td>"; }
function XB742(t) { var d = t && t.invoice_id && t.invoice_date ? S(t.invoice_date) : ""; return '<td class="nowrap">' + (d && d !== "-" ? d : "–") + "</td>"; }
/* ═══ V.824 (RUN-829) ACCOUNTING → SERVICE : คอลัมน์ "วันที่ปิดงาน" ต่อจาก "วันที่วางบิล" (หน้ารายงาน + EXPORT EXCEL)
   ค่า = doc_closed_date จาก njacc_build_charge_set (วันที่ CLOSE สำเร็จใน DOCUMENT — SERVICE ของ JOB เดียวกัน · JOB เก่า = ประวัติ CLOSE ใน Audit Log) · ยังไม่ CLOSE / ไม่มีข้อมูล = "-"
   EXPORT = data-col-key "doc_closed_date" (ลำดับตามหัวตาราง) · ADVANCE / DOCUMENT / FINANCE ไม่มีคอลัมน์นี้ ═══ */
/* ═══ V.825 ACCOUNTING → SERVICE : คอลัมน์ "Case" ต่อจาก "BILLING NOTE NO." ทุกแถบ (ทั้งหมด / รอ POST / POST แล้ว) · ทุกหน้า / ค้นหา / ตัวกรอง
   ค่า = case_no ของ JOB (njacc_jobs.case_no · แถวเดียวกันใน njacc_build_charge_set — MAERSK → Bulk Case บันทึกค่านี้) · ไม่มี = "-"
   Bulk Case สำเร็จ = หน้ารายการโหลดใหม่ (t.refresh เดิม) · หน้าที่เปิดอยู่เครื่องอื่น = Realtime njacc:jobs (job_changed) → โหลดใหม่ (กลไกเดิม V.540)
   ไม่ส่งออก EXCEL (data-col-export="no" · EXPORT เดิมไม่เปลี่ยน) · ชื่อใน Layout = "Case" + U+200B (แยกจากคอลัมน์ Case เดิมที่ซ่อนอยู่ · หัวตารางแสดง "Case") ═══ */
function CH830() { return '<th class="nowrap" data-col-key="_case830" data-col-export="no">Case\u200B</th>'; }
function CC830(t) { var c = t && t.case_no != null ? String(t.case_no).trim() : ""; return '<td class="nowrap" data-l="Case">' + (c ? n(c) : "-") + "</td>"; }
function XH829() { return '<th class="nowrap" data-col-key="doc_closed_date">วันที่ปิดงาน</th>'; }
function XC829(t) { var d = t && t.doc_closed_date ? S(t.doc_closed_date) : ""; return '<td class="nowrap" data-l="วันที่ปิดงาน">' + (d && d !== "-" ? d : "-") + "</td>"; }
function XD742(t, cols) {   /* DOCUMENT → SERVICE */
  if (t !== "SERVICE") return cols;
  var i = cols.findIndex(function (c) { return c.l === "Master B/L No."; });
  cols.splice(i < 0 ? cols.length : i + 1, 0, { l: L742, r: 1, attr: ' data-col-export="no"', c: XC742 });
  return cols;
}
function XH742a() { var a = F.map(Wt), i = F.indexOf("Master B/L No."); a.splice(i + 1, 0, '<th class="r" data-col-export="no">' + L742 + "</th>"); return a.join(""); }   /* ACCOUNTING → SERVICE */
function XH742b() { return he.replace(le, le + '<th data-col-export="no">' + B742 + "</th>" + XH829()); }   /* V.824 (RUN-829) : + วันที่ปิดงาน ต่อจากวันที่วางบิล */
function XK742(k, t) { var a = k.slice(), i = F.indexOf("Master B/L No."); a.splice(i + 1, 0, XC742(t)); return a; }
async function F742() {
  var ids = [...Q742]; Q742.clear(); if (!ids.length) return;
  for (var j = 0; j < ids.length; j += 200) {
    var part = ids.slice(j, j + 200);
    try {
      var r = await RPC710("njacc_xp742_sum", { p_ids: part }); if (!Array.isArray(r)) throw new Error("XP742");
      var mp = new Map(r.map(function (x) { return [String(x.id), x.collect]; }));
      part.forEach(function (id) { X742.set(id, mp.has(id) ? mp.get(id) : null); document.querySelectorAll('[data-x742="' + id + '"]').forEach(function (td) { td.textContent = V742(id); td.removeAttribute("title"); }); });
    } catch (e) {
      part.forEach(function (id) { document.querySelectorAll('[data-x742="' + id + '"]').forEach(function (td) { if (td.textContent === "…") { td.textContent = "?"; td.title = "โหลดยอดนอกราคาขายไม่สำเร็จ — รีเฟรชหน้า"; } }); });
    }
  }
}
/* ═══ V.759 · DOCUMENT → SERVICE (หน้ารายการงาน) : แถบค้นหา 2 แถว + ตัวกรอง "ประเภท" (ฟิลด์ job_category จริงของงาน SERVICE · ไม่ใช่ "โหมด" data_type)
   แถว 1 = ค้นหาทั่วไป → ประเภท → ลูกค้า → บริษัท · แถว 2 = สมาชิก (เฉพาะผู้มีสิทธิ์เดิม) → วันที่เริ่มต้น → วันที่สิ้นสุด → ค้นหา / ล้างตัวกรอง / Refresh
   ใช้ Element ตัวกรองเดิมทั้งหมด ([data-f] เดิม · ae() / r.oninput / CF523 / #ch-clear / [data-tool=refresh] เดิม) — Dropdown ใหม่เพียงตั้งค่า Element เดิมแล้วส่ง input event
   ตัวกรองรวมแบบ AND ที่ njacc_build_charge_set เดิม (job_category มีอยู่แล้ว) · ค่าว่าง / "ทั้งหมด" = ไม่จำกัด · ตัวเลือกประเภท = njacc_charge_filter_options.job_categories (RUN-759 · ในขอบเขตสิทธิ์เดิม) ═══ */
var NB759O = null;
function NC759() {
  try {
    if (document.getElementById("nb759-css")) return;
    let s = document.createElement("style"); s.id = "nb759-css";
    let B = "html #ch-filter #ch-fbar.fbar-doc.nb759";   /* สูงกว่า #app-shell.doc-hd #ch-fbar.fbar-doc เดิม (เฉพาะแถบนี้) */
    s.textContent = [
      B + "{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;align-items:stretch!important;justify-content:flex-start!important;gap:12px!important;padding:16px;margin:0;background:#fff;border:1px solid #E4E7EC;border-radius:12px;box-sizing:border-box;color:#102A4C;max-width:100%;min-width:0;overflow:visible}",
      B + ">*{height:auto!important;min-height:0!important;margin:0;flex:0 0 auto;max-width:100%}",
      B + " [hidden]{display:none!important}",
      B + " .nb759-hd{display:none!important}",
      B + " .nb759-r{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px 8px;min-width:0}",   /* V.761 : แถวเดียว · ระยะ 8px · พื้นที่ไม่พอ = ขึ้นแถวใหม่ */
      B + " .nb759-f{display:flex;flex-direction:column;gap:6px;min-width:112px;flex:1 1 116px;max-width:260px}",
      B + " .nb759-f.nb759-fq{flex:1.4 1 160px;min-width:150px;max-width:320px}",
      B + " .nb759-f.nb759-fm{flex:1 1 116px;min-width:112px;max-width:240px}",
      B + " .nb759-f.nb759-fd{flex:0 0 136px;min-width:136px;max-width:136px}",
      B + " .nb759-l{font-size:12.5px;font-weight:600;line-height:1.2;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      B + " .nb759-qw{position:relative;display:block;min-width:0}",
      B + " .nb759-qi{position:absolute;left:11px;top:50%;width:16px;height:16px;margin-top:-8px;color:#667085;pointer-events:none}",
      B + " .nb759-qw>.inp-search{width:100%!important;min-width:0!important;max-width:none!important;height:40px!important;min-height:40px!important;padding:0 12px 0 34px!important;margin:0!important;box-sizing:border-box;border:1px solid #D0D5DD;border-radius:10px;background:#fff;color:#102A4C;font-size:14px;text-overflow:ellipsis}",
      B + " .nb759-fd>.inp{width:100%!important;min-width:0!important;max-width:none!important;height:40px!important;min-height:40px!important;margin:0!important;box-sizing:border-box;border:1px solid #D0D5DD;border-radius:10px;background:#fff;color:#102A4C;font-size:14px;padding:0 10px}",
      B + " .nb759-qw>.inp-search:focus," + B + " .nb759-fd>.inp:focus," + B + " .nb759-tg:focus-visible{outline:none;border-color:#84ADFF;box-shadow:0 0 0 3px rgba(41,112,255,.16)}",
      B + " .nb759-dd{position:relative;min-width:0;height:40px}",
      B + " .nb759-tg{display:flex;align-items:center;gap:8px;width:100%;height:40px;margin:0;padding:0 34px 0 12px;box-sizing:border-box;border:1px solid #D0D5DD;border-radius:10px;background:#fff;color:#102A4C;font:inherit;font-size:14px;text-align:left;cursor:pointer;min-width:0}",
      B + " .nb759-tx{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#475467}",
      B + " .nb759-dd.on .nb759-tx{color:#102A4C;font-weight:600}",
      B + " .nb759-dd.on .nb759-tg{padding-right:58px}",
      B + " .nb759-cr{position:absolute;right:12px;top:50%;width:8px;height:8px;margin-top:-6px;border-right:2px solid #667085;border-bottom:2px solid #667085;transform:rotate(45deg);pointer-events:none}",
      B + " .nb759-x{position:absolute;right:30px;top:50%;width:22px;height:22px;margin:-11px 0 0;padding:0;border:0;border-radius:50%;background:#F2F4F7;color:#475467;font-size:15px;line-height:22px;text-align:center;cursor:pointer}",
      B + " .nb759-x:hover{background:#E4E7EC;color:#102A4C}",
      B + " .nb759-pan{position:fixed;z-index:3000;display:flex;flex-direction:column;background:#fff;color:#102A4C;border:1px solid #E4E7EC;border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.12),0 2px 6px rgba(16,24,40,.06);box-sizing:border-box;overflow:hidden}",
      B + " .nb759-sw{padding:8px;border-bottom:1px solid #F2F4F7;flex:0 0 auto}",
      B + " .nb759-s{width:100%;height:36px;margin:0;padding:0 10px;box-sizing:border-box;border:1px solid #D0D5DD;border-radius:8px;font:inherit;font-size:14px;color:#102A4C;background:#fff}",
      B + " .nb759-s:focus{outline:none;border-color:#84ADFF;box-shadow:0 0 0 3px rgba(41,112,255,.14)}",
      B + " .nb759-ls{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:4px 0;overscroll-behavior:contain}",
      B + " .nb759-it{display:flex;align-items:center;gap:10px;min-height:40px;padding:8px 12px;box-sizing:border-box;cursor:pointer;font-size:14px;line-height:1.3}",
      B + " .nb759-it.nb759-i{padding-left:30px}",
      B + " .nb759-it.nb759-g .nb759-lb{font-weight:600}",
      B + " .nb759-it.act{background:#F5F8FF}",
      B + " .nb759-it.sel{background:#EAF2FF}",
      B + " .nb759-rd{position:relative;flex:0 0 18px;width:18px;height:18px;box-sizing:border-box;border:1.5px solid #98A2B3;border-radius:50%;background:#fff}",
      B + " .nb759-it.sel .nb759-rd{border-color:#DC2626}",
      B + " .nb759-it.sel .nb759-rd::after{content:'';position:absolute;left:3px;top:3px;width:9px;height:9px;border-radius:50%;background:#DC2626}",
      B + " .nb759-lb{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#102A4C}",
      B + " .nb759-ck{flex:0 0 16px;color:#175CD3;font-weight:700;visibility:hidden;text-align:right}",
      B + " .nb759-it.sel .nb759-ck{visibility:visible}",
      B + " .nb759-gh{padding:8px 12px 4px;font-size:12px;font-weight:700;color:#667085}",
      B + " .nb759-em{padding:10px 12px;font-size:13px;color:#667085}",
      B + " .nb759-a{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:8px;margin-left:0!important;height:auto!important;flex:0 0 auto}",
      B + " .nb759-a>.btn," + B + " .nb759-a>#ch-clear{display:inline-flex!important;align-items:center;justify-content:center;gap:6px;height:40px!important;min-height:40px!important;margin:0!important;padding:0 11px!important;box-sizing:border-box;border-radius:10px!important;font-size:14px!important;font-weight:600;line-height:1;white-space:nowrap;box-shadow:none}",
      B + " .nb759-a>.nb759-go{background:#1D5FD6!important;border:1px solid #1D5FD6!important;color:#fff!important}",
      B + " .nb759-a>.nb759-go:hover{background:#164CB0!important;border-color:#164CB0!important}",
      B + " .nb759-a>.nb759-go svg{width:16px;height:16px}",
      B + " .nb759-a>#ch-clear{background:#fff!important;border:1px solid #D0D5DD!important;color:#344054!important}",
      B + " .nb759-a>#ch-clear:hover{background:#F9FAFB!important;border-color:#98A2B3!important}",
      B + " .nb759-a>[data-tool=refresh]{background:#fff!important;border:1px solid #B2CCFF!important;color:#175CD3!important}",
      B + " .nb759-a>[data-tool=refresh]:hover{background:#F5F8FF!important}",
      B + " .nb759-c{display:flex;flex-wrap:wrap;gap:8px;min-width:0}",
      B + " .nb759-cp{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-width:0;height:30px;padding:0 6px 0 12px;box-sizing:border-box;border-radius:999px;background:#EAF2FF;border:1px solid #D1E0FF;color:#102A4C;font-size:13px}",
      B + " .nb759-ct{min-width:0;max-width:360px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
      B + " .nb759-ct b{font-weight:600;color:#175CD3}",
      B + " .nb759-cx{flex:0 0 20px;width:20px;height:20px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#175CD3;font-size:15px;line-height:20px;text-align:center;cursor:pointer}",
      B + " .nb759-cx:hover{background:#D1E0FF}",
      "@media (max-width:640px){" + B + " .nb759-f," + B + " .nb759-f.nb759-fq," + B + " .nb759-f.nb759-fm{flex:1 1 100%;max-width:none}" + B + " .nb759-f.nb759-fd{flex:1 1 140px;max-width:none}" + B + " .nb759-a{margin-left:0!important;justify-content:flex-start}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}
/* ═══ V.906 · DOCUMENT → SERVICE : ช่อง "สถานะปิดงาน" แสดงเฉพาะแถบ POST แล้ว
   แถบอื่น = ซ่อนและล้างค่า (ไม่ค้างไปกรองแถบอื่น · ฝั่ง Server ก็ไม่รับค่านี้นอกแถบ POST แล้ว) ═══ */
/* ═══ V.908 · DOCUMENT → SERVICE : วางคอลัมน์ ETD ไว้ต่อจากคอลัมน์ "วันส่งมอบ" ทุกครั้งที่วาดตาราง
   (ลำดับคอลัมน์จริงมาจาก Layout ของตาราง จึงจัดตำแหน่งหลังวาดเสร็จ · ไม่แตะคอลัมน์อื่น) ═══ */
function ED908(t) {
  try {
    let tb = t && t.querySelector("table"); if (!tb || !tb.tHead || !tb.tHead.rows[0]) return;
    let fix = () => {
      try {
        let hd = tb.tHead.rows[0], cs = [...hd.cells];
        let nm = (c) => String(c.dataset.colRaw != null ? c.dataset.colRaw : c.textContent || "").trim();
        let d = cs.findIndex((c) => nm(c) === "\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A");
        let e = cs.findIndex((c) => nm(c).indexOf("ETD\u200B") === 0);
        if (d < 0 || e < 0 || e === d + 1) return;
        let n = cs.length, mv = (row) => { let rc = [...row.cells]; if (rc.length !== n) return; rc[d].after(rc[e]); };
        mv(hd); [...tb.tBodies].forEach((bd) => [...bd.rows].forEach(mv));
      } catch (er) {}
    };
    fix();
    if (!tb.__ed908) { tb.__ed908 = 1; new MutationObserver(() => fix()).observe(tb, { childList: !0, subtree: !0 }); }
  } catch (er) { try { console.warn("ED908", er); } catch (_) {} }
}
function CL906(r, tab, f) {
  try {
    let w = r && r.querySelector("[data-cl906]"); if (!w) return;
    let el = r.querySelector('input[data-f="close906"]'), cur = () => String((typeof tab === "function" ? tab() : tab) || "");
    let sync = (v) => {
      let on = v === "posted";
      w.hidden = !on;
      if (!on && ((el && el.value) || (f && f.close906))) {
        el && (el.value = ""); f && (f.close906 = "");
        try { r.dispatchEvent(new Event("fx880")); } catch (e) {}
      }
    };
    if (!r.__cl906) {   /* สลับแถบ = ซ่อน / ล้างค่าก่อนโหลดรายการของแถบใหม่ (หน้านี้เปลี่ยนแถบโดยไม่สร้างแถบค้นหาใหม่) */
      r.__cl906 = 1;
      let fn = (ev) => {
        if (!r.isConnected) { document.removeEventListener("click", fn, !0); return; }
        let b = ev.target && ev.target.closest && ev.target.closest("[data-accq]");
        if (!b) return;
        sync(String(b.dataset.accq || ""));
        setTimeout(() => { r.isConnected && sync(cur()); }, 0);
      };
      document.addEventListener("click", fn, !0);
    }
    sync(cur());
  } catch (e) { try { console.warn("CL906", e); } catch (_) {} }
}
function NB759(r, x) {
  try {
    if (!r || r.__nb759) return;
    let Q = (s) => r.querySelector(s), q = Q('[data-f="q"]'), cs = Q('select[data-f="customer"]'), co = Q(".co523"), ch = Q('[data-f="company"]'), ci = Q("#ch-co523"),
      ms = Q("[data-ms696]"), hu = Q('[data-f="who_u"]'), hd = Q('[data-f="who_d"]'), fr = Q('[data-f="from"]'), to = Q('[data-f="to"]'), acts = Q(".fbar-acts"), cl = Q("#ch-clear");
    if (!q || !cs || !co || !ch || !fr || !to || !acts || !cl || Q('[data-f="job_category"]') || (ms && (!hu || !hd))) return;   /* โครงสร้างไม่ตรงที่ตรวจไว้ = คงแถบเดิม */
    r.__nb759 = 1; NC759();
    let f = x.filters || {}, E = (tg, c, h) => { let el = document.createElement(tg); c && (el.className = c); h != null && (el.innerHTML = h); return el; },
      fire = (el) => el.dispatchEvent(new Event("input", { bubbles: !0 })), sp = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim(),
      jc = E("input"); jc.type = "hidden"; jc.dataset.f = "job_category"; jc.value = String(f.job_category || "");
    let cl9 = E("input"); cl9.type = "hidden"; cl9.dataset.f = "close906"; cl9.value = String(f.close906 || "");   /* V.906 : สถานะปิดงาน */
    let ALL = "ทั้งหมด", MAG = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    let ckey = () => (x.queue && x.queue()) || "acc_active", cload = 0;
    let cLoad = () => {
      if (CC523[ckey()] || cload) return; cload = 1;
      { let w880 = FW880(r); if (w880) { w880.then(() => {}, () => {}).then(() => { if (CC523[ckey()]) { cload = 2; D.forEach((d) => d.sync()); chips(); } else { cload = 0; FW880(r) || !r.isConnected || cLoad(); } }); return; } }   /* V.880 */
      (async () => {
        try {
          let res = await CO523({ charge: x.charge, group: x.group, queue: ckey(), scope: x.scope, filters: {} }), mp = new Map();
          ((res && res.companies) || []).forEach((c) => { let nm = sp(c.name || c.code), k = nm.toUpperCase(); if (!c.id || !nm) return; mp.has(k) ? mp.get(k).ids.push(c.id) : mp.set(k, { name: nm, ids: [c.id] }); });
          let L = [{ id: "", name: CA523 }].concat([...mp.values()].sort((a, b) => a.name.localeCompare(b.name, "th")).map((m) => ({ id: m.ids.join(","), name: m.name })));
          L.forEach((m) => m.id && (CN523[m.id] = m.name)); CC523[ckey()] || (CC523[ckey()] = L);
        } catch (e) {}
        cload = 2; D.forEach((d) => d.sync()); chips();
      })();
    };
    /* ── ตัวเลือกของแต่ละช่อง (ทั้งหมด = รายการแรก) ── */
    let mems = () => {
      let L = [];
      ms && ms.querySelectorAll(".ms696-g").forEach((g) => {
        let dd = g.querySelector("input[data-d]"), oo = g.querySelector(".ms696-o");
        dd ? L.push({ v: "d:" + dd.dataset.d, t: sp((g.querySelector(".ms696-d b") || {}).textContent) + " (ทั้งแผนก)", c: "g" }) : oo && L.push({ h: 1, t: sp(oo.textContent) });
        g.querySelectorAll("input[data-u]").forEach((u) => { if (!FU880(r, u.dataset.u, u.checked)) return;   /* V.880 */ let s = u.parentNode.querySelector("span"); L.push({ v: "u:" + u.dataset.u, t: sp(s && s.textContent), title: sp(s && s.getAttribute("title")), c: dd ? "i" : "" }); });
      });
      return FM880(r, L);   /* V.880 */
    };
    let mget = () => { let U = String(hu.value || "").split(",").filter(Boolean), Dp = String(hd.value || "").split(",").filter(Boolean); return !U.length && !Dp.length ? "" : U.length + Dp.length > 1 ? "m:" + U.length + ":" + Dp.length : U.length ? "u:" + U[0] : "d:" + Dp[0]; };
    let defs = [
      x.cats && { k: "cat", l: "ประเภท", a: "ประเภท" + ALL,
        items: () => { let C = (x.cats && x.cats()) || [], v = jc.value, L = C.map((c) => String(c || "")).filter(Boolean).filter((c, i, A) => A.indexOf(c) === i).map((c) => ({ v: c, t: CAT512(c) || c })).sort((a, b) => a.t.localeCompare(b.t, "th")); v && !L.some((o) => o.v === v) && L.push({ v, t: CAT512(v) || v }); return L; },
        get: () => jc.value, set: (v) => { jc.value = v; fire(jc); } },
      { k: "cust", l: "ลูกค้า", a: "ลูกค้า" + ALL,
        items: () => [...cs.options].filter((o) => o.value).map((o) => ({ v: o.value, t: sp(o.textContent) })),
        get: () => cs.value, set: (v) => { cs.value = v; fire(cs); } },
      { k: "co", l: "บริษัท", a: "บริษัท" + ALL,
        items: () => { let L = (CC523[ckey()] || []).filter((m) => m.id).map((m) => ({ v: m.id, t: m.name })), v = ch.value; v && !L.some((o) => o.v === v) && CN523[v] && L.push({ v, t: CN523[v] }); return L; },
        loading: () => !CC523[ckey()] && cload !== 2, txt: (v) => CN523[v] || (cload === 2 ? v : "…"),
        get: () => ch.value, set: (v) => { ch.value = v; ci && (ci.value = v ? CN523[v] || "" : "", ci.dataset && (ci.dataset.id = v)); fire(ch); } }
    ];
    ms && defs.push({ k: "mem", l: "สมาชิก", a: ms.hasAttribute("data-own810") ? "ทั้งหมดในแผนก" : "สมาชิก" + ALL,   /* V.810 */ items: mems,
      txt: (v) => { if (v.indexOf("m:") === 0) { let p = v.split(":"); return "เลือกแล้ว " + (+p[1] + +p[2]) + " รายการ"; } let o = mems().find((m) => m.v === v); return o ? o.t : v; },
      get: mget, set: (v) => { hu.value = v.indexOf("u:") === 0 ? v.slice(2) : ""; hd.value = v.indexOf("d:") === 0 ? v.slice(2) : ""; fire(hu); } });
    /* V.906 : สถานะปิดงาน — ปิดงาน = (มีวันส่งมอบ OR มี ETD) AND หมายเหตุว่าง · ยังไม่ปิดงาน = นอกเหนือจากนั้น (กรองที่ Server ทุกหน้า) */
    x.cl906 && defs.push({ k: "cl906", l: "สถานะปิดงาน", a: "สถานะ" + ALL,
      items: () => [{ v: "CLOSED", t: "ปิดงาน" }, { v: "OPEN", t: "ยังไม่ปิดงาน" }],
      get: () => cl9.value, set: (v) => { cl9.value = v; fire(cl9); } });
    let label = (d, v) => (!v ? d.a : d.txt ? d.txt(v) : ((d.items().find((o) => o.v === v) || {}).t || v));
    /* ── Dropdown เลือกได้ 1 ค่า : ช่องพิมพ์ค้นหา (กรองตัวเลือกเท่านั้น) · วงกลม / จุดแดง / พื้นฟ้าอ่อน / ✓ · คีย์บอร์ด ↑ ↓ Enter Esc · เปิดซ้ำเลื่อนไปค่าที่เลือก ── */
    let DD = (d) => {
      let w = E("div", "nb759-dd"), tg = E("button", "nb759-tg", '<span class="nb759-tx"></span><span class="nb759-cr" aria-hidden="true"></span>'), xb = E("button", "nb759-x", "×"),
        pan = E("div", "nb759-pan"), sw = E("div", "nb759-sw"), s = E("input", "nb759-s"), ls = E("div", "nb759-ls"), tx = tg.firstChild, vis = [], act = -1, lid = "nb759-" + d.k;
      w.dataset.k = d.k; tg.type = xb.type = "button"; tg.id = lid + "-b"; tg.setAttribute("aria-haspopup", "listbox"); tg.setAttribute("aria-expanded", "false");
      xb.title = "ล้าง" + d.l; xb.setAttribute("aria-label", xb.title);
      s.type = "text"; s.autocomplete = "off"; s.placeholder = "พิมพ์ค้นหา…"; s.setAttribute("aria-label", "ค้นหา" + d.l); s.setAttribute("aria-controls", lid + "-l");
      ls.id = lid + "-l"; ls.setAttribute("role", "listbox"); ls.setAttribute("aria-label", d.l); pan.hidden = !0;
      sw.appendChild(s); pan.append(sw, ls); w.append(tg, xb, pan);
      let sync = () => { let v = d.get(), t = label(d, v); w.classList.toggle("on", !!v); tx.textContent = t; tg.title = t; tg.setAttribute("aria-label", d.l + " : " + t); xb.hidden = !v; };
      let mark = (i) => { vis.forEach((e, j) => e.classList.toggle("act", j === i)); act = i; let e = vis[i]; e && (s.setAttribute("aria-activedescendant", e.id), e.scrollIntoView({ block: "nearest" })); };
      let paint = () => {
        let k = s.value.trim().toLowerCase(), cur = d.get(), L = [{ v: "", t: d.a }].concat(d.items()), n = 0, hh = null; ls.innerHTML = ""; vis = [];
        L.forEach((o) => {
          if (o.h) { hh = k ? null : E("div", "nb759-gh"); hh && ((hh.textContent = o.t), ls.appendChild(hh)); return; }
          if (k && o.v && String(o.t).toLowerCase().indexOf(k) < 0 && String(o.title || "").toLowerCase().indexOf(k) < 0) return;
          let on = o.v === cur, e = E("div", "nb759-it" + (o.c ? " nb759-" + o.c : "") + (on ? " sel" : ""), '<span class="nb759-rd" aria-hidden="true"></span><span class="nb759-lb"></span><span class="nb759-ck" aria-hidden="true">✓</span>');
          e.id = lid + "-o" + vis.length; e.dataset.v = o.v; e.setAttribute("role", "option"); e.setAttribute("aria-selected", on ? "true" : "false");
          e.children[1].textContent = o.t; e.children[1].title = o.title && o.title !== o.t ? o.t + " — " + o.title : o.t; ls.appendChild(e); vis.push(e); o.v && n++;
        });
        d.loading && d.loading() ? ls.appendChild(E("div", "nb759-em", "กำลังโหลด…")) : !n && ls.appendChild(E("div", "nb759-em", "ไม่พบข้อมูล"));
        mark(Math.max(0, vis.findIndex((e) => e.classList.contains("sel"))));
      };
      let place = () => {
        let b = tg.getBoundingClientRect(), W = Math.min(Math.max(b.width, 280), 440, innerWidth - 16), dn = innerHeight - b.bottom - 12, up = b.top - 12, top = dn >= 260 || dn >= up;
        pan.style.width = W + "px"; pan.style.left = Math.max(8, Math.min(b.left, innerWidth - W - 8)) + "px"; pan.style.maxHeight = Math.max(160, Math.min(420, top ? dn : up)) + "px";
        top ? ((pan.style.top = b.bottom + 4 + "px"), (pan.style.bottom = "auto")) : ((pan.style.top = "auto"), (pan.style.bottom = innerHeight - b.top + 4 + "px"));
      };
      let out = (ev) => { w.contains(ev.target) || close(); }, scl = (ev) => { pan.contains(ev.target) || close(); }, rsz = () => close();
      let close = (back) => {
        if (pan.hidden) return; pan.hidden = !0; tg.setAttribute("aria-expanded", "false"); NB759O === close && (NB759O = null);
        document.removeEventListener("mousedown", out, !0); removeEventListener("scroll", scl, !0); removeEventListener("resize", rsz); back && tg.focus();
      };
      let open = () => {
        NB759O && NB759O !== close && NB759O(); NB759O = close; d.k === "co" && cLoad();
        s.value = ""; place(); pan.hidden = !1; tg.setAttribute("aria-expanded", "true"); paint();
        let e = ls.querySelector(".nb759-it.sel"); e && (ls.scrollTop = Math.max(0, e.offsetTop - (ls.clientHeight - e.offsetHeight) / 2));
        document.addEventListener("mousedown", out, !0); addEventListener("scroll", scl, !0); addEventListener("resize", rsz); s.focus();
      };
      let pick = (v) => { close(!0); v !== d.get() && d.set(v); sync(); chips(); };
      tg.onclick = () => (pan.hidden ? open() : close());
      tg.onkeydown = (ev) => { (ev.key === "ArrowDown" || ev.key === "ArrowUp") && pan.hidden && (ev.preventDefault(), open()); ev.key === "Escape" && !pan.hidden && (ev.preventDefault(), close(!0)); };
      xb.onclick = () => { close(); d.get() && d.set(""); sync(); chips(); tg.focus(); };
      s.oninput = () => paint();
      s.onkeydown = (ev) => {
        let K = ev.key;
        if (K === "ArrowDown" || K === "ArrowUp") { ev.preventDefault(); vis.length && mark((act + (K === "ArrowDown" ? 1 : -1) + vis.length) % vis.length); }
        else if (K === "Home" || K === "End") { ev.preventDefault(); vis.length && mark(K === "Home" ? 0 : vis.length - 1); }
        else if (K === "Enter") { ev.preventDefault(); vis[act] && pick(vis[act].dataset.v); }
        else if (K === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(!0); }
        else if (K === "Tab") close();
      };
      ls.onmousedown = (ev) => ev.preventDefault();
      ls.onclick = (ev) => { let e = ev.target.closest(".nb759-it"); e && pick(e.dataset.v); };
      ls.onmousemove = (ev) => { let e = ev.target.closest(".nb759-it"), i = vis.indexOf(e); i >= 0 && i !== act && mark(i); };
      pan.onkeydown = (ev) => { ev.key === "Escape" && (ev.preventDefault(), ev.stopPropagation(), close(!0)); };
      sync();
      return { d, w, sync, close };
    };
    /* ── V.761 : แถวเดียว (ย้าย Element เดิม · ไม่สร้างตัวกรองซ้ำ) · ADVANCE = ไม่มี "ประเภท" ── */
    let fld = (l, c, el) => { let b = E("div", "nb759-f" + (c ? " " + c : "")), lb = E("span", "nb759-l"); lb.textContent = l; b.append(lb, el); return b; };
    let NW = x.cats ? jc : cs, D = defs.filter(Boolean).map(DD), by = (k) => D.find((o) => o.d.k === k), r1 = E("div", "nb759-r nb759-r1"), r2 = r1, hdn = E("div", "nb759-hd"), cp = E("div", "nb759-c"), qw = E("div", "nb759-qw");
    let go = E("button", "btn nb759-go", MAG + "<span>ค้นหา</span>"); go.type = "button"; go.title = "ค้นหาตามตัวกรองทั้งหมด";
    qw.appendChild(E("span", "nb759-qi", MAG)); q.title = q.getAttribute("placeholder") || ""; q.setAttribute("aria-label", "ค้นหาทั่วไป"); qw.appendChild(q);
    r1.appendChild(fld("ค้นหาทั่วไป", "nb759-fq", qw)); x.cats && r1.appendChild(fld("ประเภท", "", by("cat").w)); r1.append(fld("ลูกค้า", "", by("cust").w), fld("บริษัท", "", by("co").w));
    ms && r2.appendChild(fld("สมาชิก", "nb759-fm", by("mem").w));
    if (x.cl906 && by("cl906")) { let w9 = fld("สถานะปิดงาน", "", by("cl906").w); w9.dataset.cl906 = "1"; w9.hidden = !0; r2.appendChild(w9); }   /* V.906 : แสดงเฉพาะแถบ POST แล้ว (CL906) */
    fr.setAttribute("aria-label", "วันที่เริ่มต้น"); to.setAttribute("aria-label", "วันที่สิ้นสุด");
    r2.append(fld("วันที่เริ่มต้น", "nb759-fd", fr), fld("วันที่สิ้นสุด", "nb759-fd", to));
    acts.classList.add("nb759-a"); acts.insertBefore(go, acts.firstChild); acts.contains(cl) || acts.insertBefore(cl, go.nextSibling); r2.appendChild(acts);
    hdn.append(cs, co); x.cats && hdn.appendChild(jc); x.cl906 && hdn.appendChild(cl9); ms && hdn.appendChild(ms); cp.hidden = !0; cp.setAttribute("aria-label", "เงื่อนไขที่ใช้อยู่");
    [...r.childNodes].forEach((n) => n.nodeType === 3 && !n.textContent.trim() && n.remove());
    let rest = [...r.children]; r.classList.add("nb759"); r.append(r1, cp, hdn);
    rest.forEach((n) => n.parentNode === r && hdn.appendChild(n));   /* Element อื่นที่เหลือ (ถ้ามี) = เก็บไว้ไม่แสดง · ค่า [data-f] ยังส่งตามเดิม */
    /* ── ป้ายสรุปเงื่อนไข (เฉพาะที่ใช้งานจริง · ว่าง = ไม่แสดงแถว) ── */
    let dmy = (v) => { let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : v; };
    function chips() {
      let C = [], qv = sp(q.value);
      qv && C.push(["ค้นหา", qv, () => { q.value = ""; fire(NW); }]);
      D.forEach((o) => { let v = o.d.get(); v && C.push([o.d.l, label(o.d, v), () => { o.d.set(""); o.sync(); }]); });
      fr.value && C.push(["วันที่เริ่มต้น", dmy(fr.value), () => { fr.value = ""; fire(fr); }]);
      to.value && C.push(["วันที่สิ้นสุด", dmy(to.value), () => { to.value = ""; fire(to); }]);
      cp.innerHTML = ""; cp.hidden = !C.length;
      C.forEach(([l, t, fn]) => {
        let c = E("span", "nb759-cp"), ct = E("span", "nb759-ct"), b = E("b"), bx = E("button", "nb759-cx", "×");
        b.textContent = l + ":"; ct.append(b, " " + t); ct.title = l + ": " + t; bx.type = "button"; bx.title = "ล้างเงื่อนไข " + l; bx.setAttribute("aria-label", bx.title);
        bx.onclick = () => { fn(); chips(); }; c.dataset.k = l; c.append(ct, bx); cp.appendChild(c);
      });
    }
    r.addEventListener("input", (ev) => { ev.target && ev.target.closest && ev.target.closest("[data-f]") && (D.forEach((o) => o.sync()), chips()); });
    r.addEventListener("change", (ev) => { ev.target === fr || ev.target === to ? chips() : 0; });
    r.addEventListener("fx880", () => { D.forEach((o) => o.sync()); chips(); });   /* V.880 */
    go.onclick = () => fire(NW);   /* ค้นหาทันที (ค่าตัวกรองทั้งหมด · หน้า 1 · ตาม r.oninput เดิม) */
    q.addEventListener("keydown", (ev) => { ev.key === "Enter" && !ev.isComposing && (ev.preventDefault(), fire(NW)); });
    ch.value && !CN523[ch.value] && cLoad(); chips();
  } catch (e) {
    try { console.warn("NB759", e); } catch (_) {}
  }
}

/* ═══ V.772 · DOCUMENT → SERVICE (หน้ารายการงาน) : ย้ายปุ่ม "+ เปิดงาน" ไปต่อท้ายชุดแบ่งหน้า (แถวเดียวกัน)
   [⏮] [◀] หน้า x / y [▶] [⏭] [+ เปิดงาน] · ปุ่มเดิม (Element เดิมจาก W() · data-tool="new-job" · คลิกผ่าน [data-tool] ของหน้าเดิม · สิทธิ์เดิมจาก At())
   แถบแบ่งหน้าสร้างใหม่ทุกครั้งที่โหลดรายการ (innerHTML) → เฝ้า DOM ของหน้าแล้ววางปุ่มเดิมกลับต่อท้าย .pgn-nav · ปุ่มซ้ำ (W() เติมใหม่) = เหลือปุ่มเดียว
   ยังไม่มีแถบแบ่งหน้า = ปุ่มอยู่ที่เดิม · ADVANCE / ACCOUNTING / เมนูอื่น เดิม ═══ */
function PG772(t, o, e, C) {
  try {
    if ((o || "document") !== "document" || e !== "SERVICE") return;
    ST772();
    if (t.__pg772 && t.__pg772.c === C) return;
    t.__pg772 && t.__pg772.mo && t.__pg772.mo.disconnect();
    let st = { c: C, btn: null, q: 0 };
    let run = () => {
      st.q = 0;
      if (t.dataset.chPage !== C) { st.mo && st.mo.disconnect(); t.__pg772 === st && (t.__pg772 = null); return; }
      let nav = t.querySelector("#ch-pgn .pgn-nav"), all = [...t.querySelectorAll('[data-tool="new-job"]')];
      let keep = all.find((b) => nav && b.parentNode === nav) || all[all.length - 1] || st.btn;
      if (!keep) return;
      all.forEach((b) => b !== keep && b.remove());
      st.btn = keep;
      if (nav && (keep.parentNode !== nav || nav.lastElementChild !== keep)) { keep.classList.add("pg772-new"); nav.appendChild(keep); }
    };
    st.mo = new MutationObserver(() => { st.q || (st.q = 1, Promise.resolve().then(run)); });
    st.mo.observe(t, { childList: !0, subtree: !0 });
    t.__pg772 = st;
    run();
  } catch (x) { try { console.warn("PG772", x); } catch (_) {} }
}
function ST772() {
  if (document.getElementById("st772-css")) return;
  let s = document.createElement("style"); s.id = "st772-css";
  s.textContent = "#ch-pgn .pgn-nav>.btn.pg772-new{box-sizing:border-box;height:32px;min-height:32px;margin:0 0 0 10px;padding:0 14px;border-radius:8px;line-height:1.2;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}"
    + "#ch-pgn .pgn-nav>.btn-p.pg772-new{background:var(--blue-600);border-color:var(--blue-600);color:#fff}";
  document.head.appendChild(s);
}

/* ═══ V.781 · DOCUMENT → SERVICE (หน้ารายการงาน) : ปุ่ม UPLOAD EXCEL ไม่สร้างซ้ำ
   ต้นเหตุ : W() ทำงานหลังโหลดรายการทุกครั้ง (เปลี่ยนหน้า / ค้นหา / ล้างตัวกรอง / Refresh / สลับสถานะ) และเติมชุดปุ่มจาก At() เมื่อ "ไม่พบปุ่ม + เปิดงาน ในแถบเครื่องมือ"
            ตั้งแต่ V.772 ปุ่ม + เปิดงาน ถูกย้ายไปต่อท้ายแถบแบ่งหน้า → เงื่อนไขเป็นจริงทุกครั้ง → UPLOAD EXCEL (data-tool="upload753") ถูกต่อท้ายเพิ่มทุกครั้งที่โหลด (+ เปิดงาน ที่ซ้ำ PG772 ลบให้เหลือปุ่มเดียวอยู่แล้ว)
   แก้ : ถ้าหน้านี้มีปุ่ม UPLOAD EXCEL อยู่แล้ว ไม่เติมปุ่มนั้นซ้ำ (ปุ่มเดิม / ตำแหน่งเดิม / สิทธิ์เดิมจาก At() / คลิกผ่าน [data-tool] เดิม) · ปุ่ม + เปิดงาน และปุ่มอื่นทำงานเหมือนเดิม ═══ */
function UP781(t, l) {
  try { return l && t && t.querySelector('[data-tool="upload753"]') ? String(l).replace(/<button\b[^>]*\bdata-tool="upload753"[^>]*>[\s\S]*?<\/button>/g, "") : l; }
  catch (x) { return l; }
}
/* ═══ V.788 · FINANCE → ADVANCE : เลือกรายการ + RECEIPT ADVANCE PDF (ใบรับเงินสำรองจ่าย · RUN-788)
   เลือก : Checkbox หน้าแถว + หัวตาราง (เลือกทั้งหน้า) · คงรายการที่เลือกเมื่อเปลี่ยนหน้า / ค้นหา · ไม่ซ้ำ (Map ตาม JOB) · แสดงจำนวน + ยอด ADVANCE รวม · ล้างรายการที่เลือก
           เลือกได้เฉพาะ INVOICE AD ที่ POST แล้ว · ยังไม่ PAID · ยังไม่มี RECEIPT ADVANCE · สิทธิ์เดียวกับปุ่ม PAY (invoice)
   ออกเอกสาร : วันที่เอกสาร + วิธีรับชำระ → ตรวจที่ Server (njacc_radv788_preview) แยกตามลูกค้า → ดูตัวอย่าง (SAMPLE · ไม่ออกเลข) → ยืนยัน (njacc_radv788_issue :
           ออกเลข ADV-YYMM-##### + บันทึก + PAID + ล็อก ในธุรกรรมเดียว) → ดู / ดาวน์โหลด PDF / พิมพ์ (RECEIPT_ADVANCE_<เลข>.pdf) · พิมพ์ซ้ำใช้สำเนาข้อมูลที่บันทึก (njacc_radv788_get)
   PDF : A4 แนวตั้ง · ตาราง 5 คอลัมน์ No. / INVOICE NO. (เลข INVOICE AD จริง) / Invoice Date / Description / Advance Amount · ฟอนต์ฝัง "NJ PDF" (V.766) ═══ */
var SEL788 = new Map(), ROW788 = new Map(), RM788 = new Map(), PERM788 = null, CTX788 = null;
var PM788 = [["TRANSFER", "โอนเงิน", "Bank Transfer"], ["CASH", "เงินสด", "Cash"], ["CHEQUE", "เช็ค", "Cheque"], ["OTHER", "อื่น ๆ", "Other"]];
function PML788(k) { let r = PM788.find((x) => x[0] === k); return r ? r[2] : String(k || ""); }
function M788(v) { let x = Number(v); return isFinite(x) ? x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"; }
function C788(v) { return Math.round(Number(v || 0) * 100); }
function D788(v) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
function TD788() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch (e) { let t = new Date(Date.now() + 7 * 3600e3); return t.toISOString().slice(0, 10); } }
function W788(v) {   /* จำนวนเงินเป็นคำ (อังกฤษ) : Baht + Satang */
  let c = Math.round(Number(v || 0) * 100), b = Math.floor(c / 100), s = c % 100;
  let O = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  let T = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let h = (n) => { let r = []; if (n >= 100) { r.push(O[Math.floor(n / 100)] + " Hundred"); n %= 100; } if (n >= 20) { r.push(T[Math.floor(n / 10)] + (n % 10 ? "-" + O[n % 10] : "")); } else if (n > 0) r.push(O[n]); return r.join(" "); };
  let w = (n) => { if (n === 0) return "Zero"; let S = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]], r = []; S.forEach(([d, l]) => { if (n >= d) { r.push(h(Math.floor(n / d)) + " " + l); n %= d; } }); if (n > 0) r.push(h(n)); return r.join(" "); };
  return w(b) + " Baht" + (s ? " and " + w(s) + " Satang" : "") + " Only";
}
function OK788(t, a) {   /* เลือกได้หรือไม่ (หน้าเว็บ) — Server ตรวจซ้ำทุกครั้ง */
  let st = String(t && t.advance_status || "PENDING").toUpperCase(), ino = String(t && t.invoice_no || "").trim();
  if (TAB789 === "issued") return "ออก RECEIPT ADVANCE แล้ว";
  if (!(a && a.invoice)) return "ไม่มีสิทธิ์ออกเอกสาร";
  if (RM788.has(String(t.id))) return "ออก RECEIPT ADVANCE แล้ว (" + RM788.get(String(t.id)).receipt_no + ")";
  if (st === "PAID" || st === "SETTLED") return "PAID แล้ว";
  if (!t.invoice_id || !ino || /^DRAFT-/i.test(ino)) return "ไม่มี INVOICE AD — ออกเอกสารไม่ได้";
  if (String(t.invoice_status || "").toUpperCase() !== "POSTED") return "INVOICE AD ยังไม่ POST";
  return "";
}
function RH788() { ST788(); return '<th class="center col-sel radv788-th" data-col-req="1" data-col-key="_radv788" data-col-export="no" title="เลือกรายการออก RECEIPT ADVANCE"><input type="checkbox" class="radv788-cb" id="radv788-all" aria-label="เลือกทั้งหมดในหน้านี้"></th>'; }
function RC788(t, a) {
  let id = String(t.id || ""); ROW788.set(id, t);
  let why = OK788(t, a);
  if (why) { SEL788.delete(id); return `<td class="center col-sel radv788-td"><span class="radv788-x" title="${n(why)}">${RM788.has(id) ? "🔒" : "–"}</span></td>`; }
  return `<td class="center col-sel radv788-td"><input type="checkbox" class="radv788-cb" data-radv="${n(id)}"${SEL788.has(id) ? " checked" : ""} aria-label="เลือก ${n(t.job_no || "")}"></td>`;
}
function RB788() {   /* V.917 : ชื่อปุ่มสั้นลง (การทำงาน / Tooltip เดิม) · V.921 : ย้าย Comment ออกจากสตริง HTML (เดิมหลุดมาแสดงบนหน้าจอ) + วาง ⬆ UPLOAD EXCEL ไว้ขวาของปุ่มทันที (แถวเดียวกัน · เงื่อนไขแสดงเดิม) */
  ST788(); return '<span class="radv788-bar" id="radv788-bar" hidden><button type="button" class="btn btn-sm radv788-btn" id="radv788-btn" disabled title="ออก RECEIPT ADVANCE จากรายการที่เลือก">🧾 ADVANCE PDF</button></span>' + UB836() + '<span class="radv788-bar" id="radv788-bar2" hidden><span class="radv788-info" id="radv788-info"></span><button type="button" class="btn btn-sm btn-o" id="radv788-clear" disabled>ล้างรายการที่เลือก</button></span>'; }
function RS788(t) {   /* sync แถบสรุป + หัวตาราง */
  if (!t) return;
  let bar = t.querySelector("#radv788-bar"), btn = t.querySelector("#radv788-btn"), info = t.querySelector("#radv788-info"), clr = t.querySelector("#radv788-clear");
  let can = !!(PERM788 && PERM788.invoice), cnt = SEL788.size, sum = 0;
  SEL788.forEach((r) => { sum += C788(r.advance_amount); });
  if (bar) bar.hidden = !can;
  let bar2 = t.querySelector("#radv788-bar2"); if (bar2) bar2.hidden = !can;   /* V.921 */
  if (btn) { btn.disabled = !cnt; btn.textContent = "🧾 ADVANCE PDF"/* V.917 */ + (cnt ? " (" + cnt + ")" : ""); }
  if (clr) clr.disabled = !cnt;
  if (info) info.textContent = cnt ? "เลือก " + cnt.toLocaleString("th-TH") + " รายการ · ADVANCE รวม " + M788(sum / 100) : "";
  let all = t.querySelector("#radv788-all"), cbs = [...t.querySelectorAll("#ch-tbody .radv788-cb[data-radv]")];
  if (all) { let k = cbs.filter((c) => c.checked).length; all.disabled = !cbs.length || !can; all.checked = !!cbs.length && k === cbs.length; all.indeterminate = k > 0 && k < cbs.length; }
}
async function RV788(t, rows, a) {   /* หลังแสดงตาราง : โหลดเลข RECEIPT ADVANCE ของแถว PAID · แสดงในคอลัมน์สถานะ · ซ่อนปุ่มย้อนกลับ PAY */
  PERM788 = a || PERM788; RS788(t);
  let ids = (rows || []).filter((r) => /^(PAID|SETTLED)$/i.test(String(r.advance_status || ""))).map((r) => String(r.id));
  if (!ids.length) return;
  let res; try { res = await RPC499("njacc_radv788_by_jobs", { p_jobs: ids }); } catch (e) { return; }
  (Array.isArray(res) ? res : []).forEach((x) => RM788.set(String(x.job_id), x));
  ids.forEach((id) => {
    let r = RM788.get(id), tr = t.querySelector(`#ch-tbody tr[data-row="${CSS.escape(id)}"]`); if (!r || !tr) return;
    tr.querySelectorAll(".unpay694").forEach((b) => b.remove());
    if (!tr.querySelector(".radv788-no")) {   /* เลข RECEIPT ADVANCE ในคอลัมน์จัดการ (ถัดจาก PAY ที่ล็อก) — คอลัมน์สถานะแคบ ข้อความถูกตัด */
      let h = `<button type="button" class="btn btn-sm radv788-no" data-radv-doc="${n(r.receipt_id)}" title="RECEIPT ADVANCE ${n(r.receipt_no)} — ดู / ดาวน์โหลด / พิมพ์ซ้ำ">🧾 ${n(r.receipt_no)}</button>`;
      TAB789 === "issued" && (h = PB791(r));   /* V.791 : PREVIEW / PRINT / SAVE PDF (ID ใบเสร็จ) */
      let pay = tr.querySelector(".pay694"), act = tr.querySelector("td.col-act") || tr.lastElementChild;
      pay ? pay.insertAdjacentHTML("afterend", h) : act && act.insertAdjacentHTML("beforeend", h);
      TAB789 === "issued" && pay && pay.remove();
    }
    let cb = tr.querySelector("td.radv788-td"); if (cb) cb.innerHTML = `<span class="radv788-x" title="ออก RECEIPT ADVANCE แล้ว (${n(r.receipt_no)})">🔒</span>`;
    SEL788.delete(id);
  });
  RS788(t);
}
function RA788(t, ctx) {   /* ผูก event ครั้งเดียวต่อหน้า · หน้าใหม่ = เริ่มรายการที่เลือกใหม่ */
  PERM788 = ctx && ctx.perms || PERM788; CTX788 = Object.assign({}, CTX788 || {}, ctx || {}, { root: t });
  if (t.__radv788) { RS788(t); return; }
  t.__radv788 = 1; SEL788.clear();
  t.addEventListener("change", (ev) => {
    let c = ev.target; if (!c || !c.classList || !c.classList.contains("radv788-cb")) return;
    if (c.id === "radv788-all") {
      t.querySelectorAll("#ch-tbody .radv788-cb[data-radv]").forEach((x) => { x.checked = c.checked; let r = ROW788.get(x.dataset.radv); if (c.checked && r && !OK788(r, PERM788)) SEL788.set(x.dataset.radv, r); else SEL788.delete(x.dataset.radv); });
    } else if (c.dataset.radv) {
      let r = ROW788.get(c.dataset.radv);
      if (c.checked && r && !OK788(r, PERM788)) SEL788.set(c.dataset.radv, r); else { SEL788.delete(c.dataset.radv); c.checked = false; }
    }
    RS788(t);
  });
  t.addEventListener("click", (ev) => {
    let b = ev.target.closest && ev.target.closest("#radv788-btn,#radv788-clear,[data-radv-doc]"); if (!b || !t.contains(b)) return;
    ev.preventDefault();
    if (b.id === "radv788-clear") { SEL788.clear(); t.querySelectorAll(".radv788-cb").forEach((x) => { x.checked = false; }); RS788(t); return; }
    if (b.id === "radv788-btn") { if (!b.disabled) RO788(t); return; }
    if (b.dataset.radvDoc) RG788([b.dataset.radvDoc]);
  });
  RS788(t);
}
function RE788(e) {   /* ข้อความ Error จาก Server → ภาษาไทย */
  let m = String(e && e.message || e || ""), j = (s) => { try { return JSON.parse(m.slice(m.indexOf(s) + s.length).trim()); } catch (x) { return null; } };
  if (/NJACC_RADV_CHANGED/.test(m)) { let a = j("NJACC_RADV_CHANGED:") || []; return "ข้อมูล / ยอดเปลี่ยนจากตอนดูตัวอย่าง — กรุณาตรวจสอบใหม่ก่อนยืนยัน" + (a.length ? " (" + a.map((x) => (x.invoice_no || x.job_no) + " : " + M788(x.preview) + " → " + M788(x.now)).join(", ") + ")" : ""); }
  if (/NJACC_RADV_INVALID/.test(m)) { let a = j("NJACC_RADV_INVALID:") || []; return "มีรายการที่ออกเอกสารไม่ได้ : " + a.map((x) => (x.job_no || "") + " — " + x.reason).join(" · "); }
  if (/NJACC_RADV_DATE_BEFORE_START/.test(m)) return "วันที่เอกสารต้องตั้งแต่ 01/11/2026";
  if (/NJACC_RADV_DATE_REQUIRED/.test(m)) return "กรุณาเลือกวันที่เอกสาร";
  if (/NJACC_RADV_METHOD_REQUIRED/.test(m)) return "กรุณาเลือกวิธีรับชำระ";
  if (/NJACC_RADV_LOCKED/.test(m)) return m.replace(/^.*NJACC_RADV_LOCKED:\s*/, "");
  if (/NJACC_(MODULE_)?FORBIDDEN/.test(m)) return "ไม่มีสิทธิ์";
  if (/njacc_radv788|PGRST202|schema cache/i.test(m)) return "ระบบยังไม่พร้อม (ต้องรัน RUN-788)";
  return m;
}
function RQ788() { try { return "radv788-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); } catch (e) { return "radv788-" + Date.now() + "-" + Math.random().toString(36).slice(2); } }
async function RO788(t) {   /* หน้าต่างออกเอกสาร */
  let ids = [...SEL788.keys()]; if (!ids.length) return;
  let st = { pv: null, seen: false, req: RQ788(), busy: false, done: null };
  let body = document.createElement("div"); body.className = "radv788-m";
  body.innerHTML = `<div id="radv788-pane-form"><div class="radv788-f">
      <label>วันที่เอกสาร <span class="req">*</span><input type="date" class="inp" id="radv788-date" value="${TD788()}" min="2026-11-01"></label>
      <label>วิธีรับชำระ <span class="req">*</span><select class="sel" id="radv788-method"><option value="">— เลือก —</option>${PM788.map((p) => `<option value="${p[0]}">${n(p[1])} (${n(p[2])})</option>`).join("")}</select></label>
    </div><div id="radv788-sum" class="radv788-sum"><div class="load-row"><div class="spin"></div></div></div></div><div id="radv788-pane-doc" hidden></div>`;
  let foot = document.createElement("div"); foot.className = "radv788-foot";
  foot.innerHTML = `<button class="btn btn-o" data-close>ปิด</button><button class="btn btn-o" id="radv788-pv" disabled>👁 ดูตัวอย่าง</button><button class="btn btn-p" id="radv788-ok" disabled>✅ ยืนยันออก RECEIPT ADVANCE</button>`;
  mt({ title: "RECEIPT ADVANCE — ใบรับเงินสำรองจ่าย", body, footer: foot, fullscreen: !0, wide: !0 });
  let q = (s) => body.querySelector(s) || foot.querySelector(s), sum = q("#radv788-sum"), pf = q("#radv788-pane-form"), pd = q("#radv788-pane-doc");
  let back = () => { pd.hidden = !0; pd.innerHTML = ""; pf.hidden = !1; };
  let ask = (html) => new Promise((res) => {   /* ยืนยันในหน้าต่างเดิม (หน้าต่างยืนยันของระบบจะปิดหน้าต่างนี้) */
    let old = pf.querySelector(".radv788-ask"); old && old.remove();
    pf.insertAdjacentHTML("afterbegin", `<div class="radv788-ask"><div>${html}</div><div class="radv788-ask-b"><button class="btn btn-o" data-ask="0">ยกเลิก</button><button class="btn btn-p" data-ask="1">ยืนยันออกเอกสาร</button></div></div>`);
    let box = pf.querySelector(".radv788-ask"); box.scrollIntoView && box.scrollIntoView({ block: "nearest" });
    box.querySelectorAll("[data-ask]").forEach((x) => { x.onclick = () => { box.remove(); res(x.dataset.ask === "1"); }; });
  });
  let showDocs = async (docs, o) => { pf.hidden = !0; pd.hidden = !1; pd.innerHTML = '<div class="load-row"><div class="spin"></div></div>'; await RW788(docs, Object.assign({ back }, o), pd); };
  let sync = () => {
    let ok = st.pv && !st.pv.errors.length && st.pv.groups.length && q("#radv788-date").value && q("#radv788-method").value && !st.done;
    q("#radv788-pv").disabled = !(st.pv && st.pv.groups.length && q("#radv788-date").value && q("#radv788-method").value) || st.busy || !!st.done;
    q("#radv788-ok").disabled = !ok || !st.seen || st.busy;
    q("#radv788-ok").title = ok && !st.seen ? "กรุณากดดูตัวอย่างก่อนยืนยัน" : "";
  };
  let draw = () => {
    let p = st.pv; if (!p) return;
    let tot = p.groups.reduce((s, g) => s + C788(g.total), 0);
    sum.innerHTML = (p.errors.length ? `<div class="radv788-err"><b>⚠ รายการที่ออกเอกสารไม่ได้ (${p.errors.length}) — ระงับการยืนยัน</b><ul>${p.errors.map((e) => `<li>${n(e.job_no || "")}${e.invoice_no ? " · " + n(e.invoice_no) : ""} — ${n(e.reason)}</li>`).join("")}</ul><button class="btn btn-sm btn-o" id="radv788-drop">นำรายการที่มีปัญหาออกจากรายการที่เลือก</button></div>` : "")
      + `<div class="radv788-hd">เอกสารที่จะออก ${p.groups.length} ฉบับ (แยกตามลูกค้า) · ${p.groups.reduce((s, g) => s + Number(g.count || 0), 0)} รายการ · ADVANCE รวม <b>${M788(tot / 100)}</b></div>`
      + p.groups.map((g, k) => `<div class="radv788-g"><div class="radv788-gh"><span>ฉบับที่ ${k + 1} · <b>${n(g.customer_name)}</b></span><span>${Number(g.count)} รายการ · <b>${M788(g.total)}</b></span></div>
          <table class="tbl radv788-t"><thead><tr><th>No.</th><th>INVOICE NO.</th><th>Invoice Date</th><th>เลขที่งาน</th><th class="r">Advance Amount</th></tr></thead><tbody>${(g.items || []).map((x, i) => `<tr><td class="center">${i + 1}</td><td>${n(x.invoice_no)}</td><td>${D788(x.invoice_date)}</td><td class="t-3">${n(x.job_no)}</td><td class="r">${M788(x.amount)}</td></tr>`).join("")}</tbody></table></div>`).join("");
    let dr = q("#radv788-drop"); dr && (dr.onclick = () => { p.errors.forEach((e) => SEL788.delete(String(e.job_id))); RS788(t); t.querySelectorAll(".radv788-cb[data-radv]").forEach((c) => { c.checked = SEL788.has(c.dataset.radv); }); ids = [...SEL788.keys()]; ids.length ? load() : (sum.innerHTML = '<div class="empty">ไม่มีรายการที่เลือก</div>', st.pv = null, sync()); });
    sync();
  };
  let load = async () => {
    st.pv = null; st.seen = false; sync(); sum.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลล่าสุดจาก Server…</div></div>';
    try { let r = await RPC499("njacc_radv788_preview", { p: { job_ids: ids } }); st.pv = { errors: r && r.errors || [], groups: r && r.groups || [] }; draw(); }
    catch (e) { sum.innerHTML = `<div class="radv788-err">${n(RE788(e))}</div>`; sync(); }
  };
  q("#radv788-date").onchange = () => { st.seen = false; sync(); };
  q("#radv788-method").onchange = () => { st.seen = false; sync(); };
  q("#radv788-pv").onclick = async () => {
    let d = q("#radv788-date").value, m = q("#radv788-method").value; if (!st.pv || !d || !m) return;
    let I = IS790((await import("./chunk-UWAYW6DC.js")).a);
    let docs = st.pv.groups.map((g) => ({ receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I,
      customer: { name: g.customer_name, tax_id: g.customer_tax_id, branch_code: g.customer_branch, address: g.customer_address },
      items: (g.items || []).map((x, i) => ({ no: i + 1, invoice_no: x.invoice_no, invoice_date: x.invoice_date, description: "Advance Charge", amount: x.amount })), total: g.total, credit: g.credit }));
    st.seen = true; sync();
    await showDocs(docs, { sample: !0 });
  };
  q("#radv788-ok").onclick = async () => {
    if (st.busy || !st.pv || st.pv.errors.length || !st.seen) return;
    let d = q("#radv788-date").value, m = q("#radv788-method").value, ng = st.pv.groups.length, cnt = st.pv.groups.reduce((s, g) => s + Number(g.count || 0), 0);
    back();
    if (!(await ask(`ออกเอกสาร <b>${ng} ฉบับ</b> · ${cnt} รายการ · วันที่ ${D788(d)} · ${n(PML788(m))}<br>เมื่อยืนยันแล้ว ระบบจะออกเลขจริง เปลี่ยนรายการเป็น PAID และล็อกข้อมูลทันที (แก้ไข / ลบ / UNPOST ไม่ได้)`))) return;
    st.busy = true; sync(); let ok = q("#radv788-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let I = IS790((await import("./chunk-UWAYW6DC.js")).a);
      let exp = st.pv.groups.flatMap((g) => (g.items || []).map((x) => ({ job_id: x.job_id, amount: x.amount, customer_id: g.customer_id, invoice_no: x.invoice_no })));
      let r = await RPC499("njacc_radv788_issue", { p: { request_id: st.req, job_ids: exp.map((x) => x.job_id), receipt_date: d, payment_method: m, issuer: I, expected: exp } });
      st.done = r && r.receipts || []; st.req = RQ788();
      SEL788.clear(); RS788(t);
      sum.innerHTML = `<div class="radv788-okbox"><b>✅ ออก RECEIPT ADVANCE สำเร็จ ${st.done.length} ฉบับ</b> — รายการเปลี่ยนเป็น PAID และล็อกแล้ว</div>`
        + `<table class="tbl radv788-t"><thead><tr><th>Receipt No.</th><th>ลูกค้า</th><th class="r">รายการ</th><th class="r">ยอดรวม</th><th></th></tr></thead><tbody>${st.done.map((x) => `<tr><td class="t-b">${n(x.receipt_no)}</td><td>${n(x.customer_name)}</td><td class="r">${Number(x.count)}</td><td class="r">${M788(x.total)}</td><td class="r"><button class="btn btn-sm btn-p" data-radv-open="${n(x.id)}">ดู / ดาวน์โหลด / พิมพ์</button></td></tr>`).join("")}</tbody></table>`;
      let open = async (ids2) => { try { await showDocs(await RL788(ids2), { sample: !1 }); } catch (e) { back(); y("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE788(e), "err"); } };
      sum.querySelectorAll("[data-radv-open]").forEach((b) => { b.onclick = () => open([b.dataset.radvOpen]); });
      foot.insertAdjacentHTML("beforeend", `<button class="btn btn-green" id="radv788-all-docs">📄 ดู / ดาวน์โหลด / พิมพ์ (${st.done.length} ฉบับ)</button>`);
      q("#radv788-all-docs").onclick = () => open(st.done.map((x) => x.id));
      await open(st.done.map((x) => x.id));
      ok.textContent = "✅ ออกแล้ว"; y("ออก RECEIPT ADVANCE " + st.done.map((x) => x.receipt_no).join(", ") + " แล้ว", "ok");
      try { CTX788 && CTX788.refresh && CTX788.refresh(); } catch (e) {}
    } catch (e) {
      let msg = RE788(e); y("ออก RECEIPT ADVANCE ไม่สำเร็จ — " + msg, "err"); ok.textContent = "✅ ยืนยันออก RECEIPT ADVANCE";
      if (/NJACC_RADV_(CHANGED|INVALID)/.test(String(e && e.message || e))) { await load(); sum.insertAdjacentHTML("afterbegin", `<div class="radv788-err">${n(msg)}</div>`); }
    } finally { st.busy = false; sync(); }
  };
  await load();
}
async function RL788(ids) {   /* เอกสารที่บันทึก (สำเนาข้อมูล ณ เวลาออก) — ไม่ออกเลขใหม่ · ไม่บันทึกจ่ายซ้ำ */
  let docs = [];
  for (let id of [].concat(ids || []).filter(Boolean)) {
    let r = await RPC499("njacc_radv788_get", { p_id: id }), s = r && r.snapshot || {};
    docs.push({ receipt_no: r.receipt_no, receipt_date: r.receipt_date, payment_method: s.payment_method || r.payment_method, issuer: s.issuer || {}, customer: s.customer || {}, items: s.items || [], total: s.total != null ? s.total : r.total, credit: s.credit, status: r.status || "ACTIVE", void_reason: r.void_reason || "" });
  }
  return docs;
}
async function RG788(ids) {   /* จากหน้ารายการ (เลข RECEIPT ADVANCE) : ดู / ดาวน์โหลด / พิมพ์ซ้ำ */
  try { let docs = await RL788(ids); docs.length && (await RW788(docs, { sample: !1, title: "RECEIPT ADVANCE " + docs.map((d) => d.receipt_no).join(", ") })); }
  catch (e) { y("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE788(e), "err"); }
}
/* ── PDF (A4 แนวตั้ง) ── */
function RP788(doc, counts, sample) {
  ST790(); ST813(); /* V.813 */
  let I = doc.issuer || {}, C = doc.customer || {}, items = doc.items || [], tot = doc.total != null ? doc.total : items.reduce((s, x) => s + C788(x.amount), 0) / 100;
  let pages = [], a = 0, N = counts.length;
  counts.forEach((k, p) => {
    let last = p === N - 1, rows = items.slice(a, a + k); a += k;
    pages.push(`<div class="radv-pg" data-pg="${p + 1}">
  <div class="radv-in">${VD791(doc)}
    <header class="radv-hd">
      <div class="radv-co"><img class="radv-logo" src="${n(I.logo || "")}" alt="">
        <div class="radv-cot"><div class="radv-conm">${n(CO790(I))}</div><div class="radv-cosub">${n(AD790(I))}</div>
        <div class="radv-cosub">Tax ID: ${n(I.taxId || "-")}&nbsp;&nbsp;Branch : ${n(BR790(I.branch || "0000"))}</div>
        <div class="radv-cosub">Tel. ${n(I.tel || "-")} | Fax. ${n(I.fax || "-")}</div></div></div>
      <div class="radv-tt"><div class="radv-t1">RECEIPT ADVANCE</div><div class="radv-t2">ใบรับเงินสำรองจ่าย</div></div>
    </header>
    <div class="radv-boxes">
      <section class="radv-box"><span class="radv-tag">CUSTOMER</span>
        <div class="radv-kv3"><b>Customer Name</b><b>:</b><span>${n(NM790(C.name) || "-")}</span></div>
        <div class="radv-kv3"><b>Tax ID</b><b>:</b><span class="radv-tx"><span>${n(C.tax_id || "-")}</span><span class="radv-brn"><b>Branch :</b> ${n(BR790(C.branch_code))}</span></span></div>
        <div class="radv-kv3"><b>Address</b><b>:</b><span class="radv-addr">${n(C.address || "-")}</span></div></section>
      <section class="radv-box radv-box-r" style="display:flex;flex-direction:column;justify-content:center"><span class="radv-tag">RECEIPT DETAILS</span>
        <div class="radv-kv3"><b>Receipt No.</b><b>:</b><span class="radv-no">${n(doc.receipt_no)}</span></div>
        <div class="radv-kv3"><b>Receipt Date</b><b>:</b><span>${D788(doc.receipt_date)}</span></div></section>
    </div>
    <table class="radv-tb"><colgroup><col style="width:9%"><col style="width:22%"><col style="width:17%"><col style="width:27%"><col style="width:25%"></colgroup>
      <thead><tr><th>No.</th><th>INVOICE NO.</th><th>Invoice Date</th><th class="l">Description</th><th class="r">Advance Amount</th></tr></thead>
      <tbody>${rows.map((x, j8) => `<tr><td class="c">${a - rows.length + j8 + 1}</td><td class="c">${n(x.invoice_no)}</td><td class="c">${D788(x.invoice_date)}</td><td>${n(x.description || "Advance Charge")}</td><td class="r">${M788(x.amount)}</td></tr>`).join("")}
      ${last ? `<tr class="radv-tot"><td colspan="4" class="c">TOTAL</td><td class="r">${M788(tot)}</td></tr>` : ""}</tbody></table>
    ${last ? `<div class="radv-sum">
      <div class="radv-box radv-pay"><div><b>Payment Method :</b> ${n(PML788(doc.payment_method))}</div><div><b>Amount in Words :</b> ${n(W788(tot))}</div></div>
      <div class="radv-box radv-amt"><div class="radv-a1"><b>Advance Amount</b><b>${M788(tot)}</b></div><div class="radv-a2"><b>Payment Received</b><b>${M788(tot)}</b></div></div>
    </div>
    <div class="radv-sign">
      <div class="radv-box"><b class="radv-st">PAYER SIGNATURE</b><div class="radv-sp"></div><div class="radv-sl"></div><div class="radv-sc">Signature / Printed Name</div><div>Date: ________ / ________ / ____________</div></div>
      <div class="radv-box"><b class="radv-st">AUTHORIZED RECEIVER</b><div class="radv-for">For ${n(I.nameEn)}</div><div class="radv-sp2"></div><div class="radv-sl"></div><div class="radv-sc">Signature / Printed Name</div><div>Date: ${D788(doc.receipt_date)}</div></div>
    </div>${sample ? '<div class="radv-stamp">SAMPLE / ตัวอย่าง</div>' : ""}` : ""}
  </div>
  <footer class="radv-ft"><div class="radv-ftx"><div><b>${n(I.nameEn)}</b><div>This receipt confirms the payment recorded above.</div></div><b>PAGE ${p + 1} / ${N}</b></div><div class="radv-bar"><i></i><i></i></div></footer>
</div>`);
  });
  return pages.join("");
}
/* ═══ V.860 · PDF ใบเสร็จ (RECEIPT / RECEIPT ADVANCE · ระบบใหม่ + ระบบเก่า · รวมใบที่ออกแล้วทั้งหมด) : แบ่งหน้าตามพื้นที่จริงของเอกสารแต่ละใบ
   สาเหตุเดิม (V.856) ได้ 25 + 15 + 1 : เริ่มที่หน้าละ 25 แล้ว "ย้ายแถวท้ายหน้าไปหน้าถัดไปทีละแถว" — เมื่อหน้าสุดท้ายพื้นที่ไม่พอ
   (หัวเอกสารสูงขึ้นตามที่อยู่ลูกค้า + ส่วนท้าย TOTAL / สรุป / ลงนาม) จึงเกิดหน้าใหม่ที่มีแถวเดียว แทนการกระจายรายการใหม่ทั้งเอกสาร
   V.860 : วัดพื้นที่จริงจากเอกสารที่ Render แล้ว (ขอบบนแถวแรก · ความสูงแถว · ขอบล่างเหนือ Footer · ส่วนท้าย) → เพดานจำนวนแถวของหน้าทั่วไป / หน้าสุดท้าย
           → ใช้จำนวนหน้าน้อยที่สุดที่ใส่ได้ แล้วกระจายรายการให้ใกล้เคียงกันทุกหน้า (ไม่เกิน 25 · ไม่มีหน้าที่เหลือรายการเดียวโดยไม่จำเป็น)
           → ตรวจซ้ำหลัง Render จริง ถ้ายังล้น = ลดเพดานแล้วแบ่งใหม่ · ท้ายสุดกันไว้ด้วยการย้ายแถวทีละแถว (ไม่มีหน้าใดทับ Footer) ═══ */
var PP856 = 25;   /* MAX_INVOICE_PER_PAGE */
function PG856(n) { let c = []; n = Math.max(0, n | 0); if (!n) return [1]; for (let i = 0; i < n; i += PP856) c.push(Math.min(PP856, n - i)); return c; }
function MV856(c, i) { c[i] -= 1; i + 1 < c.length ? (c[i + 1] += 1) : c.push(1); for (let j = i + 1; j < c.length; j++) if (c[j] > PP856) { let e = c[j] - PP856; c[j] = PP856; j + 1 < c.length ? (c[j + 1] += e) : c.push(e); } return c; }
function EV860(n, P, cN, cL) {   /* กระจาย n รายการลง P หน้าให้ใกล้เคียงกัน (หน้าสุดท้าย ≤ cL · หน้าอื่น ≤ cN · ทุกหน้า ≥ 1) */
  if (P < 1 || n < P || (P - 1) * cN + cL < n) return null;
  let c = [], b = Math.floor(n / P), r = n % P, i, j, q;
  for (i = 0; i < P; i++) c.push(b + (i < r ? 1 : 0));
  for (let g = 0, lim = 4 * P + 20; g < lim; g++) {
    for (i = -1, q = 0; q < P; q++) if (c[q] > (q === P - 1 ? cL : cN)) { i = q; break; }
    if (i < 0) break;
    for (j = -1, q = 0; q < P; q++) { let m = q === P - 1 ? cL : cN; if (q !== i && c[q] < m && (j < 0 || c[q] < c[j])) j = q; }
    if (j < 0) return null;
    c[i] -= 1; c[j] += 1;
  }
  for (q = 0; q < P; q++) if (c[q] < 1 || c[q] > (q === P - 1 ? cL : cN)) return null;
  return c;
}
function CT860(n, cN, cL) {   /* จำนวนหน้าน้อยที่สุดที่ใส่ได้ แล้วกระจายให้ใกล้เคียงกัน */
  n = Math.max(0, n | 0); if (!n) return [1];
  cN = Math.max(1, Math.min(PP856, cN | 0)); cL = Math.max(1, Math.min(cN, cL | 0));
  for (let P = 1; P <= n; P++) { let c = EV860(n, P, cN, cL); if (c) return c; }
  return PG856(n);
}
function MX860(box, px) {   /* วัดพื้นที่จริง → เพดานจำนวนแถว : หน้าทั่วไป (cN) / หน้าสุดท้าย (cL · เผื่อ TOTAL + สรุป + ลงนาม) */
  let ps = [...box.querySelectorAll("." + px + "-pg")]; if (!ps.length) return null;
  let ft = ps[0].querySelector("." + px + "-ft"); if (!ft) return null;
  let lim = ft.getBoundingClientRect().top - 4;
  let rs = (p) => [...p.querySelectorAll("table." + px + "-tb tbody tr")].filter((r) => !r.classList.contains(px + "-tot"));
  let f = rs(ps[0]); if (!f.length) return null;
  let y0 = f[0].getBoundingClientRect().top, hm = 0;
  ps.forEach((p) => rs(p).forEach((r) => { let h = r.getBoundingClientRect().height; h > hm && (hm = h); }));
  if (!(hm > 0.5) || !(lim - y0 > hm)) return null;
  let lp = ps[ps.length - 1], lr = rs(lp), tail = 0;
  if (lr.length) { let b = 0; lp.querySelectorAll("." + px + "-in > *:not(." + px + "-stamp)").forEach((z) => { let q = z.getBoundingClientRect().bottom; q > b && (b = q); });
    tail = Math.max(0, b - lr[lr.length - 1].getBoundingClientRect().bottom); }
  return { cN: Math.max(1, Math.min(PP856, Math.floor((lim - y0) / hm))), cL: Math.max(1, Math.min(PP856, Math.floor((lim - y0 - tail) / hm))) };
}
function ST860(px) {   /* บีบส่วนท้าย (ระยะห่าง / พื้นที่ลงนาม) เล็กน้อย — ใช้เฉพาะใบที่บีบแล้ว "ลดจำนวนหน้า" ได้ · ใบอื่นคงรูปแบบเดิมทุกจุด */
  let id = "st860-" + px; if (document.getElementById(id)) return;
  let s = document.createElement("style"); s.id = id;
  s.textContent = "." + px + "-tight ." + px + "-sum,." + px + "-tight ." + px + "-sign{margin-top:2.4mm!important}"
    + "." + px + "-tight ." + px + "-sign ." + px + "-box{min-height:30mm!important}"
    + "." + px + "-tight ." + px + "-sp{height:10mm!important}." + px + "-tight ." + px + "-sp2{height:7mm!important}";
  document.head.appendChild(s);
}
var CSS876 = ".{P}-pg.{P}-f876 .{P}-hd{padding-bottom:2.2mm!important}\n.{P}-pg.{P}-f876 .{P}-logo{width:17mm!important;flex:0 0 17mm!important}\n.{P}-pg.{P}-f876 .{P}-conm{font-size:10pt!important}\n.{P}-pg.{P}-f876 .{P}-cosub{font-size:7.8pt!important;line-height:1.3!important;margin-top:.35mm!important}\n.{P}-pg.{P}-f876 .{P}-t1,.{P}-pg.{P}-f876 .{P}-t2{font-size:12pt!important}\n.{P}-pg.{P}-f876 .{P}-t3{font-size:9pt!important;margin-top:1.6mm!important;padding:.8mm 2.6mm!important}\n.{P}-pg.{P}-f876 .{P}-boxes{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-f876 .{P}-box{padding:3mm 3mm 2mm!important}\n.{P}-pg.{P}-f876 .{P}-tag{font-size:7.6pt!important;top:-2.2mm!important}\n.{P}-pg.{P}-f876 .{P}-kv{margin-top:.7mm!important;font-size:8pt!important;line-height:1.25!important}\n.{P}-pg.{P}-f876 .{P}-boxes>.{P}-box:first-child .{P}-kv{font-size:7.8pt!important}\n.{P}-pg.{P}-f876 .{P}-addr{font-size:7.2pt!important;line-height:1.2!important}\n.{P}-pg.{P}-f876 .{P}-tb{margin-top:3mm!important}\n.{P}-pg.{P}-f876 .{P}-tb th{padding:1.2mm 1.5mm!important;font-size:7.7pt!important;line-height:1.18!important}\n.{P}-pg.{P}-f876 .{P}-tb td{padding:1.0mm 1.5mm!important;font-size:7.5pt!important;line-height:1.18!important}\n.{P}-pg.{P}-f876 .{P}-tot td{font-size:8.1pt!important;padding:1.2mm 1.5mm!important}\n.{P}-pg.{P}-f876 .{P}-sum{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-f876 .{P}-pay{padding:2.0mm 3mm!important;font-size:7.8pt!important;line-height:1.4!important}\n.{P}-pg.{P}-f876 .{P}-a1{padding:1.1mm 3mm!important;font-size:8pt!important}\n.{P}-pg.{P}-f876 .{P}-a2{padding:1.5mm 3mm!important;font-size:9pt!important}\n.{P}-pg.{P}-f876 .{P}-sign{margin-top:2mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-f876 .{P}-sign .{P}-box{padding:2.2mm 3mm!important;min-height:19mm!important;font-size:7.4pt!important}\n.{P}-pg.{P}-f876 .{P}-sp{height:4mm!important}\n.{P}-pg.{P}-f876 .{P}-sp2{height:3.5mm!important}\n.{P}-pg.{P}-f876 .{P}-sc{margin:.6mm 0 1.2mm!important}\n.{P}-pg.{P}-f876 .{P}-st{font-size:8pt!important}\n.{P}-pg.{P}-f876 .{P}-for{font-size:7.4pt!important}\n.{P}-pg.{P}-x876 .{P}-hd{padding-bottom:2.2mm!important}\n.{P}-pg.{P}-x876 .{P}-logo{width:17mm!important;flex:0 0 17mm!important}\n.{P}-pg.{P}-x876 .{P}-conm{font-size:10pt!important}\n.{P}-pg.{P}-x876 .{P}-cosub{font-size:7.8pt!important;line-height:1.3!important;margin-top:.35mm!important}\n.{P}-pg.{P}-x876 .{P}-t1,.{P}-pg.{P}-x876 .{P}-t2{font-size:12pt!important}\n.{P}-pg.{P}-x876 .{P}-t3{font-size:9pt!important;margin-top:1.6mm!important;padding:.8mm 2.6mm!important}\n.{P}-pg.{P}-x876 .{P}-boxes{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-x876 .{P}-box{padding:3mm 3mm 2mm!important}\n.{P}-pg.{P}-x876 .{P}-tag{font-size:7.6pt!important;top:-2.2mm!important}\n.{P}-pg.{P}-x876 .{P}-kv{margin-top:.7mm!important;font-size:7.4pt!important;line-height:1.2!important}\n.{P}-pg.{P}-x876 .{P}-boxes>.{P}-box:first-child .{P}-kv{font-size:7.8pt!important}\n.{P}-pg.{P}-x876 .{P}-addr{font-size:6.9pt!important;line-height:1.15!important}\n.{P}-pg.{P}-x876 .{P}-tb{margin-top:3mm!important}\n.{P}-pg.{P}-x876 .{P}-tb th{padding:1.0mm 1.4mm!important;font-size:7.2pt!important;line-height:1.18!important}\n.{P}-pg.{P}-x876 .{P}-tb td{padding:.8mm 1.4mm!important;font-size:7.0pt!important;line-height:1.18!important}\n.{P}-pg.{P}-x876 .{P}-tot td{font-size:7.6pt!important;padding:1.0mm 1.4mm!important}\n.{P}-pg.{P}-x876 .{P}-sum{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-x876 .{P}-pay{padding:2.0mm 3mm!important;font-size:7.8pt!important;line-height:1.4!important}\n.{P}-pg.{P}-x876 .{P}-a1{padding:1.1mm 3mm!important;font-size:8pt!important}\n.{P}-pg.{P}-x876 .{P}-a2{padding:1.5mm 3mm!important;font-size:9pt!important}\n.{P}-pg.{P}-x876 .{P}-sign{margin-top:2mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-x876 .{P}-sign .{P}-box{padding:2.2mm 3mm!important;min-height:16mm!important;font-size:7.4pt!important}\n.{P}-pg.{P}-x876 .{P}-sp{height:3.2mm!important}\n.{P}-pg.{P}-x876 .{P}-sp2{height:2.8mm!important}\n.{P}-pg.{P}-x876 .{P}-sc{margin:.6mm 0 1.2mm!important}\n.{P}-pg.{P}-x876 .{P}-st{font-size:8pt!important}\n.{P}-pg.{P}-x876 .{P}-for{font-size:7.4pt!important}\n.{P}-pg.{P}-xx876 .{P}-hd{padding-bottom:2.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-logo{width:17mm!important;flex:0 0 17mm!important}\n.{P}-pg.{P}-xx876 .{P}-conm{font-size:10pt!important}\n.{P}-pg.{P}-xx876 .{P}-cosub{font-size:7.8pt!important;line-height:1.3!important;margin-top:.35mm!important}\n.{P}-pg.{P}-xx876 .{P}-t1,.{P}-pg.{P}-xx876 .{P}-t2{font-size:12pt!important}\n.{P}-pg.{P}-xx876 .{P}-t3{font-size:9pt!important;margin-top:1.6mm!important;padding:.8mm 2.6mm!important}\n.{P}-pg.{P}-xx876 .{P}-boxes{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-box{padding:3mm 3mm 2mm!important}\n.{P}-pg.{P}-xx876 .{P}-tag{font-size:7.6pt!important;top:-2.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-kv{margin-top:.7mm!important;font-size:6.5pt!important;line-height:1.12!important}\n.{P}-pg.{P}-xx876 .{P}-boxes>.{P}-box:first-child .{P}-kv{font-size:7.8pt!important}\n.{P}-pg.{P}-xx876 .{P}-addr{font-size:6.5pt!important;line-height:1.12!important}\n.{P}-pg.{P}-xx876 .{P}-tb{margin-top:3mm!important}\n.{P}-pg.{P}-xx876 .{P}-tb th{padding:.8mm 1.2mm!important;font-size:6.7pt!important;line-height:1.18!important}\n.{P}-pg.{P}-xx876 .{P}-tb td{padding:.6mm 1.2mm!important;font-size:6.5pt!important;line-height:1.18!important}\n.{P}-pg.{P}-xx876 .{P}-tot td{font-size:7.1pt!important;padding:.8mm 1.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-sum{margin-top:3mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-pay{padding:2.0mm 3mm!important;font-size:7.8pt!important;line-height:1.4!important}\n.{P}-pg.{P}-xx876 .{P}-a1{padding:1.1mm 3mm!important;font-size:8pt!important}\n.{P}-pg.{P}-xx876 .{P}-a2{padding:1.5mm 3mm!important;font-size:9pt!important}\n.{P}-pg.{P}-xx876 .{P}-sign{margin-top:2mm!important;gap:3.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-sign .{P}-box{padding:2.2mm 3mm!important;min-height:14mm!important;font-size:7.4pt!important}\n.{P}-pg.{P}-xx876 .{P}-sp{height:2.6mm!important}\n.{P}-pg.{P}-xx876 .{P}-sp2{height:2.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-sc{margin:.6mm 0 1.2mm!important}\n.{P}-pg.{P}-xx876 .{P}-st{font-size:8pt!important}\n.{P}-pg.{P}-xx876 .{P}-for{font-size:7.4pt!important}";   /* V.876 : ย่อขนาด/ระยะ 3 ระดับ ให้ 25 รายการอยู่ครบในหน้าเดียว (ไม่ลดจำนวนแถว) */
function ST876(px) {
  let id = "st876-" + px; if (document.getElementById(id)) return;
  let s = document.createElement("style"); s.id = id;
  s.textContent = CSS876.split("{P}").join(px);
  document.head.appendChild(s);
}
function PG860(n, cls, px, render) {   /* V.876 : 25 รายการ/หน้าเสมอ (1-25 / 26-50 / ...) เลือกระดับย่อที่น้อยที่สุดที่ไม่ล้น */
  let c = PG856(n);
  let R = (lv) => { let h = render(c); if (!lv) return h;
    let a = px + "-tight " + px + "-f876" + (lv > 1 ? " " + px + "-x876" : "") + (lv > 2 ? " " + px + "-xx876" : "");
    return h.split('class="' + px + '-pg"').join('class="' + px + '-pg ' + a + '"'); };
  ST860(px); ST876(px);
  if (!document.body || n < 1) return R(0);
  let box = document.createElement("div"); box.className = cls; box.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden"; document.body.appendChild(box);
  let over = (p) => { let ft = p.querySelector("." + px + "-ft"); if (!ft) return !1; let t = ft.getBoundingClientRect().top, b = 0;
    p.querySelectorAll("." + px + "-in > *:not(." + px + "-stamp)").forEach((z) => { let q = z.getBoundingClientRect().bottom; q > b && (b = q); }); return b > t - 2; };
  try {
    for (let lv = 0; lv <= 3; lv++) { box.innerHTML = R(lv); if (![...box.querySelectorAll("." + px + "-pg")].some(over)) return R(lv); }
    return R(3);   /* lv0 = รูปแบบเดิมทุกจุด (ใบที่พอดีอยู่แล้ว) · lv1-3 = ย่อเท่าที่จำเป็นเพื่อให้ครบ 25 แถว */
  } finally { box.remove(); }
}
function RF788(doc, sample) {   /* V.860 : แบ่งหน้าตามพื้นที่จริง · หน้าละไม่เกิน 25 INVOICE · แถวไม่ข้ามหน้า / ไม่ทับ Footer · TOTAL / สรุป / ลงนาม ต่อจากรายการสุดท้าย */
  return PG860((doc.items || []).length, "radv788-doc", "radv", (c) => RP788(doc, c, sample));
}
async function RW788(docs, o, host) {   /* Preview = DOM เดียวกับ PDF / Print · V.813 : แสดงเต็มหน้าจอ (PV813 · ไม่ใช้กรอบ Modal) · ปิด = o.back (กลับหน้าเดิม) */
  ST788();
  try { let m = await import("./chunk-TKN6STDT.js"); m.FF766 && (await m.FF766()); } catch (e) {}
  let parts = docs.map((d) => RF788(d, o.sample)), html = parts.join(""), nos = docs.map((d) => d.receipt_no);
  host && (host.innerHTML = "");
  PV813({ title: o.sample ? "RECEIPT ADVANCE — ตัวอย่าง " + docs.length + " ฉบับ" : (o.title || "RECEIPT ADVANCE " + nos.join(", ")), note: o.sample ? "ยังไม่ออกเลข · ยังไม่ตัดจ่าย · ยังไม่ล็อก (แยกตามลูกค้า)" : "",
    warn: docs.some((d) => d.status === "VOID_RESET") ? "ยกเลิก — คืนค่ารอบเดิม" : "",
    html, parts, names: nos.map((x) => "RECEIPT_ADVANCE_" + x), save: o.sample ? null : SVH791,
    print: () => RX788(html, o.sample ? "RECEIPT_ADVANCE_SAMPLE" : "RECEIPT_ADVANCE_" + nos.join("_")), onClose: o.back });
}
function RX788(html, fname) {   /* พิมพ์ / บันทึก PDF (A4 แนวตั้ง · ชื่อไฟล์ = ชื่อเอกสาร) */
  let old = document.getElementById("radv788-print-root"); old && old.remove();
  let root = document.createElement("div"); root.id = "radv788-print-root"; root.className = "radv788-doc"; root.innerHTML = html; document.body.appendChild(root);
  let ps = document.createElement("style"); ps.id = "radv788-page"; ps.textContent = "@page{size:A4 portrait;margin:0}"; document.head.appendChild(ps);
  let t0 = document.title; document.title = fname; document.body.classList.add("radv788-printing");
  let done = () => { document.body.classList.remove("radv788-printing"); document.title = t0; ps.remove(); root.remove(); };
  window.addEventListener("afterprint", done, { once: !0 });
  try { window.print(); } catch (e) { done(); }
}
function ST788() {
  try {
    if (document.getElementById("st788-css")) return;
    let s = document.createElement("style"); s.id = "st788-css";
    s.textContent = [
      ".radv788-bar{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}.radv788-bar[hidden]{display:none!important}",
      ".btn.radv788-btn{background:#1e3a8a!important;border:1px solid #1e3a8a!important;color:#fff!important;font-weight:700;white-space:nowrap;min-width:0!important;width:auto!important;flex:0 0 auto;padding-left:12px;padding-right:12px}/* V.917 : กว้างพอดีข้อความ */.btn.radv788-btn:disabled{opacity:.55;cursor:not-allowed}",
      ".radv788-info{font-size:12.5px;font-weight:700;color:#1e3a8a;white-space:nowrap}.radv788-x{color:#94a3b8}.btn.radv788-no{background:#eff4fb!important;border:1px solid #1e3a8a!important;color:#1e3a8a!important;font-weight:700;white-space:nowrap;margin-left:4px}.btn.radv788-no:hover{background:#dbe7f7!important}",
      ".radv788-f{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px}.radv788-f label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:13px;min-width:220px}",
      ".radv788-hd{margin:6px 0 8px;font-size:13.5px}.radv788-g{border:1px solid #dbe3ef;border-radius:8px;margin-bottom:10px;overflow:hidden}.radv788-gh{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;background:#eff4fb;font-size:13px}",
      ".radv788-t{width:100%}.radv788-t td,.radv788-t th{padding:5px 8px;font-size:12.5px}.radv788-err{border:1px solid #fca5a5;background:#fef2f2;color:#991b1b;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:13px}.radv788-err ul{margin:6px 0 6px 18px}",
      ".radv788-ask{border:2px solid #f59e0b;background:#fffbeb;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:13.5px}.radv788-ask-b{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.radv788-dbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}.radv788-smp{font-weight:700;color:#b91c1c}.radv788-dno{font-weight:700;color:#1e3a8a;margin-left:6px}.radv788-okbox{border:1px solid #86efac;background:#f0fdf4;color:#166534;border-radius:8px;padding:8px 10px;margin-bottom:10px}.radv788-foot{display:flex;justify-content:flex-end;gap:8px;align-items:center;flex-wrap:wrap}",
      /* เอกสาร */
      ".radv788-pv{background:#e5e7eb;padding:12px;overflow:auto}.radv788-pv .radv-pg{margin:0 auto 12px;box-shadow:0 2px 10px rgba(0,0,0,.15)}",
      ".radv788-doc,.radv788-doc *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
      ".radv-pg{width:210mm;height:297mm;background:#fff;color:#0f172a;position:relative;overflow:hidden;font-family:" + "\"NJ PDF\",Arial,sans-serif" + ";font-size:10.5pt;line-height:1.35;page-break-after:always;break-after:page}",
      ".radv-in{position:absolute;left:12mm;right:12mm;top:10mm;bottom:24mm}",
      ".radv-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;padding-bottom:3mm;border-bottom:1.2pt solid #12305f}",
      ".radv-co{display:flex;gap:4mm;align-items:center;min-width:0}.radv-logo{width:22mm;height:auto;object-fit:contain}.radv-conm{font-weight:700;font-size:13pt;color:#12305f}.radv-cosub{font-size:8.6pt;color:#334155}",
      ".radv-tt{text-align:right;flex:0 0 auto}.radv-t1{font-weight:700;font-size:19pt;color:#12305f;letter-spacing:.3pt;border-bottom:2.4pt solid #ef4444;padding-bottom:1mm;line-height:1.15}.radv-t2{font-weight:700;font-size:15pt;color:#12305f;margin-top:1.5mm}",
      ".radv-boxes{display:grid;grid-template-columns:1.6fr 1fr;gap:4mm;margin-top:5mm}",
      ".radv-box{position:relative;border:1pt solid #bcd0ee;border-radius:2.5mm;padding:4.5mm 4mm 3mm}.radv-tag{position:absolute;top:-2.6mm;left:3mm;background:#12305f;color:#fff;font-weight:700;font-size:8.2pt;padding:.4mm 3mm;border-radius:1.6mm}",
      ".radv-kv{display:grid;grid-template-columns:31mm 1fr;gap:2mm;margin-top:1.4mm;font-size:9.6pt}.radv-kv b{color:#1e3a5f}.radv-addr{white-space:pre-line;overflow-wrap:anywhere}.radv-box-r .radv-kv{grid-template-columns:28mm 1fr}.radv-no{font-weight:700;color:#12305f}",
      ".radv-tb{width:100%;border-collapse:collapse;margin-top:5mm;table-layout:fixed}.radv-tb th{background:#12305f;color:#fff;font-weight:700;font-size:9.8pt;padding:2.2mm 2mm;text-align:center;border:.6pt solid #12305f}.radv-tb th.l{text-align:left}.radv-tb th.r{text-align:right}",
      ".radv-tb td{border:.6pt solid #cbd5e1;padding:2mm;font-size:10pt;white-space:nowrap}.radv-tb td.c{text-align:center}.radv-tb td.r{text-align:right;font-variant-numeric:tabular-nums}.radv-tb tr{break-inside:avoid;page-break-inside:avoid}",
      ".radv-tot td{background:#e8f1fc;font-weight:700;font-size:11pt}.radv-tot td.c{text-align:center;letter-spacing:.5pt}",
      ".radv-sum{display:grid;grid-template-columns:1.25fr 1fr;gap:4mm;margin-top:5mm}.radv-pay{padding:3.5mm 4mm;font-size:10pt;line-height:1.55}",
      ".radv-amt{padding:0;overflow:hidden}.radv-a1,.radv-a2{display:flex;justify-content:space-between;padding:3mm 4mm;font-size:11pt}.radv-a2{background:#12305f;color:#fff;font-size:12.5pt}",
      ".radv-sign{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:5mm}.radv-sign .radv-box{padding:3.5mm 4mm;font-size:9.4pt;min-height:40mm}.radv-st{color:#12305f;font-size:10pt}.radv-for{font-size:9pt;color:#334155;margin-top:.8mm}",
      ".radv-sp{height:14mm}.radv-sp2{height:9.5mm}.radv-sl{border-bottom:.8pt dotted #64748b}.radv-sc{text-align:center;margin:1.2mm 0 2.5mm;color:#334155}",
      ".radv-stamp{position:absolute;right:2mm;margin-top:6mm;transform:rotate(-6deg);border:2.2pt solid #dc2626;color:#dc2626;font-weight:700;font-size:20pt;padding:1.5mm 5mm;border-radius:2mm;letter-spacing:.5pt}",
      ".radv-ft{position:absolute;left:12mm;right:12mm;bottom:8mm}.radv-ftx{display:flex;justify-content:space-between;align-items:flex-end;font-size:8.6pt;color:#334155}.radv-ftx b{color:#0f172a}",
      ".radv-bar{display:flex;height:1.6mm;margin-top:2mm;border-radius:1mm;overflow:hidden}.radv-bar i:first-child{flex:4;background:#1e3a8a}.radv-bar i:last-child{flex:1;background:#ef4444}",
      "#radv788-print-root{display:none}",
      "@media print{body.radv788-printing>*:not(#radv788-print-root){display:none!important}body.radv788-printing #radv788-print-root{display:block!important;position:static!important;inset:auto!important}body.radv788-printing #radv788-print-root,body.radv788-printing #radv788-print-root *{visibility:visible!important}body.radv788-printing{margin:0!important;padding:0!important;background:#fff!important}body.radv788-printing .radv-pg{box-shadow:none;margin:0}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}


/* ═══ V.789 FINANCE — ADVANCE : แถบ "รอรับชำระ" / "ใบเสร็จที่ออกแล้ว" + ลบตัวกรอง สมาชิก / ค้นหาลูกค้า / Status / แผนก
   แยกแถบที่ Database (njacc_build_charge_set · RUN-789 : radv789 = pending | issued ตามการผูก njacc_radv788_item จริง) — ไม่ใช่การซ่อนแถวบนหน้าจอ
   ทั้งสองแถบ = คอลัมน์ / ลำดับ / ข้อมูลรายรายการเดิม (1 แถวต่อ INVOICE AD) · ใบเสร็จที่ออกแล้ว : สถานะ "ออกใบเสร็จแล้ว" · จัดการ = ดูใบเสร็จ / ดาวน์โหลด PDF / พิมพ์ซ้ำ (เลขเดิม · สำเนาเดิม)
   ตัวกรองที่ลบ = ไม่สร้างช่อง · ล้างค่าที่ค้างใน State ทุกครั้งที่โหลด · ส่งค่าว่างให้ Server เสมอ (ไม่กรองแฝง) ═══ */
var TAB789 = "pending", RX789 = ["f678_customer", "status", "department_id", "created_by", "cs", "due"/* V.884 */];
function TV789(d) { return d && d.radv789 === "issued" ? "issued" : "pending"; }
function DF789(d, set) {   /* filters ที่ส่ง Server (หน้า FINANCE — ADVANCE) */
  let f = d.filters || (d.filters = {});
  RX789.forEach((k) => { k in f && (f[k] = ""); });
  let tb = TV789(d); set && (TAB789 = tb);
  return Object.assign({}, f, { f678_customer: "", status: "", department_id: "", created_by: "", cs: "", due: "", radv789: tb });   /* V.884 : CS / Due Date ไม่ส่ง Server */
}
function TB789(d) {
  ST789(); let t = TV789(d);
  return '<div class="radv789-tabs" id="radv789-tabs" role="tablist">' + [["pending", "รอรับชำระ"], ["issued", "ใบเสร็จที่ออกแล้ว"]].map(([k, l]) =>
    `<button type="button" role="tab" class="radv789-tab radv789-${k}${k === t ? " active" : ""}" data-radv789="${k}" aria-selected="${k === t}">${l}</button>`).join("") + "</div>";
}
function GS789() { ST789(); return '<td class="col-status"><span class="bdg789">ออกใบเสร็จแล้ว</span></td>'; }
function RA789(t, ctx) {   /* ผูก event ครั้งเดียวต่อหน้า · ctx ล่าสุด (State / โหลดใหม่) เก็บที่ t */
  t.classList.add("nsv864");   /* V.864 : INVOICE NJ = เฉพาะเลข INVOICE (ซ่อน SRC: ... / ป้าย EXCEL) เฉพาะหน้า FINANCE → ADVANCE */
  t.__ctx789 = ctx || t.__ctx789;
  if (t.__radv789) return; t.__radv789 = 1;
  t.addEventListener("click", (ev) => {
    let b = ev.target.closest && ev.target.closest("[data-radv789],[data-radv-dl],[data-radv-pr],[data-radv-sv]"); if (!b || !t.contains(b)) return;
    ev.preventDefault();
    if (b.dataset.radv789) {
      let c = t.__ctx789, d = c && c.state, k = b.dataset.radv789 === "issued" ? "issued" : "pending"; if (!d || TV789(d) === k) return;
      d.radv789 = k; d.page = 1;
      SEL788.clear(); t.querySelectorAll(".radv788-cb").forEach((x) => { x.checked = false; x.indeterminate = false; });   /* เปลี่ยนแถบ = ล้างรายการที่เลือก */
      t.querySelectorAll("[data-radv789]").forEach((x) => { let on = x.dataset.radv789 === k; x.classList.toggle("active", on); x.setAttribute("aria-selected", on); });
      RS788(t); RZ884(t) || (c.refresh && c.refresh()); return;   /* V.884 : เปลี่ยนแถบ = ล้างตัวกรองทุกช่อง แล้วโหลดใหม่ */
    }
    b.dataset.radvSv ? SV791(b.dataset.radvSv, b) : RP789(b.dataset.radvDl || b.dataset.radvPr, b);
  });
}
async function RP789(id, b) {   /* ดาวน์โหลด PDF / พิมพ์ซ้ำ จากแถว : เอกสารที่บันทึก (เลขเดิม · สำเนาข้อมูล ณ เวลาออก) — ไม่ออกเลขใหม่ · ไม่ตัดจ่ายซ้ำ */
  if (!id || (b && b.disabled)) return;
  b && (b.disabled = !0);
  try {
    let docs = await RL788([id]), doc = docs[0]; if (!doc) throw new Error("ไม่พบเอกสาร");
    ST788(); try { let m = await import("./chunk-TKN6STDT.js"); m.FF766 && (await m.FF766()); } catch (e) {}
    let src = doc.issuer && doc.issuer.logo;
    src && (await Promise.race([new Promise((r) => { let im = new Image(); im.onload = im.onerror = r; im.src = src; }), new Promise((r) => setTimeout(r, 3000))]));
    RX788(RF788(doc, !1), "RECEIPT_ADVANCE_" + doc.receipt_no);
  } catch (e) { y("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE788(e), "err"); }
  finally { b && (b.disabled = !1); }
}
function ST789() {
  try {
    if (document.getElementById("st789-css")) return;
    let s = document.createElement("style"); s.id = "st789-css";
    s.textContent = [
      ".nsv864 .inv-src,.nsv864 .b823{display:none!important}",   /* V.864 */
      ".radv789-tabs{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 2px}",
      ".radv789-tab{appearance:none;cursor:pointer;font:inherit;font-size:15px;font-weight:700;line-height:1.2;padding:11px 18px;border-radius:10px;border:1px solid transparent;transition:background .15s,color .15s,box-shadow .15s}",
      ".radv789-pending{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}.radv789-pending.active{background:#2563eb;color:#fff;border-color:#2563eb;box-shadow:0 2px 6px rgba(37,99,235,.35)}",
      ".radv789-issued{background:#dcfce7;color:#15803d;border-color:#86efac}.radv789-issued.active{background:#16a34a;color:#fff;border-color:#16a34a;box-shadow:0 2px 6px rgba(22,163,74,.35)}",
      ".radv789-tab:not(.active):hover{filter:brightness(.97)}.radv789-tab:focus-visible{outline:2px solid #1e3a8a;outline-offset:2px}",
      ".bdg789{display:inline-block;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#15803d;border:1px solid #86efac;font-size:12px;font-weight:700;line-height:18px;white-space:nowrap}",
      ".btn.radv789-act{background:#fff!important;border:1px solid #1e3a8a!important;color:#1e3a8a!important;font-weight:700;white-space:nowrap;margin-left:4px}.btn.radv789-act:hover:not(:disabled){background:#eff4fb!important}.btn.radv789-act:disabled{opacity:.55;cursor:wait}",
      "@media (max-width:640px){.radv789-tab{flex:1 1 0;text-align:center;padding:10px 8px;font-size:14px}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.790 RECEIPT ADVANCE PDF : หัวบริษัทผู้ออก 4 บรรทัด (ชื่อ + (HEAD OFFICE) · ที่อยู่ · Tax ID + Branch 0000 · Tel. | Fax.)
   กล่อง CUSTOMER : Customer Name (HEAD OFFICE จัดรูปแบบ ไม่ซ้ำ ไม่เติมเอง) · Tax ID + Branch บรรทัดเดียว (ข้อความจริง รักษาศูนย์นำหน้า) · Address
   กล่อง RECEIPT DETAILS : Receipt No. / Receipt Date / Credit (จากสำเนาที่บันทึก · หลาย INVOICE เครดิตต่างกัน = "ตามใบแจ้งหนี้" · ไม่มีข้อมูล = "-")
   Preview / PDF / งานพิมพ์ = ตัวสร้างหน้าเดียวกัน (RP788) ═══ */
var HO790 = /\s*\(?\s*head\s*office\s*\)?\s*[.,]?\s*$/i;
function IS790(I) { I = I || {}; return Object.assign({}, I, { address: String(I.address || "").replace(HO790, "").trim(), branch: "0000", head_office: !0 }); }
function NM790(v) {   /* ชื่อลูกค้า : "...LTD.HEAD OFFICE" → "...LTD. (HEAD OFFICE)" · ไม่มีคำว่า HEAD OFFICE = ใช้ชื่อเดิม (ไม่เติมเอง) */
  let s = String(v == null ? "" : v).replace(/\s+/g, " ").trim(); if (!HO790.test(s)) return s;
  let b = s; for (let k = 0; k < 5 && HO790.test(b); k++) b = b.replace(HO790, "");
  b = b.replace(/\s+[.,]+$/, "").trim(); return b ? b + " (HEAD OFFICE)" : s;
}
function CO790(I) { let nm = String(I && I.nameEn || "").replace(HO790, "").trim(); return nm + (I && I.head_office === false ? "" : " (HEAD OFFICE)"); }
function AD790(I) { return String(I && I.address || "").replace(HO790, "").trim(); }
function BR790(v) { let s = v == null ? "" : String(v).trim(); return s || "-"; }   /* ข้อความ — ไม่แปลงเป็นตัวเลข (00000 คงเดิม) */
function CR790(c) {
  if (!c || typeof c !== "object") return "-";
  if (c.mixed) return "ตามใบแจ้งหนี้";
  if (c.days === null || c.days === undefined || c.days === "") return "-";
  let k = Number(c.days); return isFinite(k) ? k + " Days" : "-";
}
function ST790() {
  try {
    if (document.getElementById("st790-css")) return;
    let s = document.createElement("style"); s.id = "st790-css";
    s.textContent = [
      ".radv-hd{gap:5mm}.radv-co{gap:3.5mm;align-items:flex-start;flex:0 1 auto;min-width:0}.radv-logo{width:20mm;flex:0 0 20mm;margin-top:.6mm}.radv-cot{flex:0 0 auto}",
      ".radv-conm{font-size:11pt;line-height:1.25;white-space:nowrap}.radv-cot .radv-cosub{font-size:8.6pt;line-height:1.38;margin-top:.5mm;white-space:nowrap}",
      ".radv-t1{font-size:18pt}.radv-t2{font-size:14pt}",
      ".radv-kv3{display:grid;grid-template-columns:var(--lw790,27mm) 3mm minmax(0,1fr);align-items:start;margin-top:1.4mm;font-size:9.6pt}",
      ".radv-kv3>b{color:#1e3a5f;white-space:nowrap}.radv-kv3>b:nth-child(2){text-align:center}.radv-box-r .radv-kv3{--lw790:23mm}",
      ".radv-tx{display:flex;flex-wrap:wrap;column-gap:9mm;row-gap:.8mm}.radv-brn{white-space:nowrap}.radv-brn b{color:#1e3a5f}.radv-kv3 .radv-addr{overflow-wrap:anywhere}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.791 FINANCE — ADVANCE : คอลัมน์ INVOICE ADV / Date invoice (ต่อจาก Checkbox ก่อน BILLING NOTE NO. · ทั้งสองแถบ)
   = เลข / วันที่ INVOICE AD จริงของ JOB (njacc_build_charge_set : invoice_no = njacc_invoices.invoice_no · invoice_date = njacc_invoices.invoice_date) · ไม่มี = "-"
   แถบใบเสร็จที่ออกแล้ว : จัดการ = PREVIEW / PRINT / SAVE PDF — เปิดตาม ID ใบเสร็จที่ผูกกับแถว (njacc_radv788_by_jobs เฉพาะใบที่ใช้งานอยู่) · ไม่ออกเลข / ไม่ตัดจ่าย / ไม่เปลี่ยนสถานะ
   SAVE PDF = ดาวน์โหลดไฟล์ PDF (หน้าเอกสารเดียวกับ PREVIEW / PRINT → ภาพ A4 ต่อหน้า) · โหลดไลบรารีไม่ได้ = เปิดหน้าพิมพ์ให้บันทึกเป็น PDF แทน
   ใบเสร็จรอบเดิมที่ยกเลิก (VOID_RESET) : ตราประทับ "ยกเลิก" ทุกหน้า ═══ */
function IH791() { return '<th data-col-key="radv791_inv">INVOICE ADV</th><th data-col-key="radv791_inv_date">Date invoice</th>'; }
function IC791(t) {
  let no = String(t && t.invoice_no || "").trim(), ok = !!(t && t.invoice_id && no && !/^DRAFT-/i.test(no));
  return `<td class="nowrap t-b">${ok ? n(no) : "-"}</td><td class="nowrap">${ok && D788(t.invoice_date) ? D788(t.invoice_date) : "-"}</td>`;
}
function PB791(r) {   /* ปุ่มจัดการ แถบใบเสร็จที่ออกแล้ว (ID ใบเสร็จ) */
  ST791(); let id = n(r.receipt_id), no = n(r.receipt_no);
  return `<button type="button" class="btn btn-sm radv791-b radv791-pv" data-radv-doc="${id}" title="PREVIEW — ${no}">PREVIEW</button>`
    + `<button type="button" class="btn btn-sm radv791-b radv791-pr" data-radv-pr="${id}" title="PRINT — ${no} (เลขเดิม)">PRINT</button>`
    + `<button type="button" class="btn btn-sm radv791-b radv791-sv" data-radv-sv="${id}" title="SAVE PDF — RECEIPT_ADVANCE_${no}.pdf">SAVE PDF</button>`;
}
function VD791(doc) { return doc && doc.status === "VOID_RESET" ? (ST791(), '<div class="radv791-vs">ยกเลิก · VOID<small>ยกเลิกจากการคืนค่ารอบเดิม</small></div>') : ""; }
var LJ791 = {};
function LS791(url, ok) {   /* โหลดสคริปต์ครั้งเดียว (CDN เดียวกับ Excel เดิม) */
  if (ok()) return Promise.resolve();
  return LJ791[url] || (LJ791[url] = new Promise((res, rej) => { let s = document.createElement("script"); s.src = url; s.async = !0; s.onload = () => (ok() ? res() : rej(new Error("load " + url))); s.onerror = () => { delete LJ791[url]; rej(new Error("load " + url)); }; document.head.appendChild(s); }));
}
async function SVH791(html, fname, b) {   /* ดาวน์โหลด PDF จากหน้าเอกสาร (ไม่แก้ข้อมูล) */
  if (b && b.disabled) return; b && (b.disabled = !0);
  let box = document.createElement("div");
  try {
    ST788(); try { let m = await import("./chunk-TKN6STDT.js"); m.FF766 && (await m.FF766()); } catch (e) {}
    await Promise.all([LS791("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", () => typeof window.html2canvas === "function"),
                       LS791("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", () => !!(window.jspdf && window.jspdf.jsPDF))]);
    box.className = "radv788-doc radv791-off"; box.innerHTML = html; document.body.appendChild(box);
    await Promise.all([...box.querySelectorAll("img")].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 3000); })));
    try { document.fonts && (await document.fonts.ready); } catch (e) {}
    let pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: !0 }), pgs = [...box.querySelectorAll(".radv-pg")];
    if (!pgs.length) throw new Error("ไม่พบหน้าเอกสาร");
    for (let i = 0; i < pgs.length; i++) {
      let c = await window.html2canvas(pgs[i], { scale: 2, backgroundColor: "#ffffff", useCORS: !0, logging: !1 });
      i && pdf.addPage("a4", "portrait"); pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, void 0, "FAST");
    }
    pdf.setProperties({ title: fname }); pdf.save(fname + ".pdf");
  } catch (e) {
    try { console.warn("SVH791", e); } catch (x) {}
    y("ดาวน์โหลด PDF โดยตรงไม่สำเร็จ — เปิดหน้าพิมพ์แทน กรุณาเลือก “บันทึกเป็น PDF”", "err"); RX788(html, fname);
  } finally { box.remove(); b && (b.disabled = !1); }
}
async function SV791(id, b) {   /* SAVE PDF จากแถว : เอกสารที่บันทึก (เลขเดิม) */
  if (!id || (b && b.disabled)) return;
  try { let d = (await RL788([id]))[0]; if (!d) throw new Error("ไม่พบเอกสาร"); await SVH791(RF788(d, !1), "RECEIPT_ADVANCE_" + d.receipt_no, b); }
  catch (e) { y("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE788(e), "err"); }
}
function ST791() {
  try {
    if (document.getElementById("st791-css")) return;
    let s = document.createElement("style"); s.id = "st791-css";
    s.textContent = [
      ".btn.radv791-b{font-weight:700;white-space:nowrap;margin-left:4px;letter-spacing:.2px}.btn.radv791-b:disabled{opacity:.55;cursor:wait}",
      ".btn.radv791-pv{background:#eff4fb!important;border:1px solid #1e3a8a!important;color:#1e3a8a!important}.btn.radv791-pr{background:#1e3a8a!important;border:1px solid #1e3a8a!important;color:#fff!important}",
      ".btn.radv791-sv{background:#16a34a!important;border:1px solid #16a34a!important;color:#fff!important}",
      ".radv791-off{position:fixed;left:-100000px;top:0;width:210mm}",
      ".radv791-vs{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-18deg);border:3pt solid #dc2626;color:#dc2626;font-weight:700;font-size:34pt;padding:3mm 9mm;border-radius:3mm;text-align:center;opacity:.85;z-index:5;background:rgba(255,255,255,.6);letter-spacing:1pt}.radv791-vs small{display:block;font-size:11pt;letter-spacing:0;margin-top:1mm}",
      ".radv791-void{font-weight:700;color:#dc2626;margin-left:4px}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.792 FINANCE — ADVANCE : คอลัมน์ "Job No." หลัง Date invoice (ทั้งสองแถบ)
   = คอลัมน์เลขที่งานเดิม (data-col-key="job_no" · njacc_jobs.job_no ของแถวจริง เช่น JOBAD2611-00099) ย้ายตำแหน่ง + เปลี่ยนหัวข้อ — ไม่สร้างคอลัมน์ซ้ำ
   ไม่มี = "-" · แสดงเลขเต็ม (ไม่ตัด) · ACCOUNTING — ADVANCE / ตาราง PDF / EXPORT EXCEL เดิม ═══ */
function JH792() { return '<th data-col-key="job_no" class="nowrap">Job No.</th>'; }
function JX792(z) { return String(z || "").replace(/<th data-col-key="job_no">[^<]*<\/th>/, ""); }
function JC792(t) { let v = String(t && t.job_no || "").trim(); return `<td class="nowrap"><b>${v ? n(v) : "-"}</b></td>`; }

/* ═══ V.809 · FINANCE — RECEIPT (หน้ารายการ) : UNPOST = ส่งกลับ ACCOUNTING — SERVICE คงสถานะ POST (njacc_fin809_back) · FINANCE — ADVANCE = เดิม ═══ */
function FB809c(inv, reason, req) { return RPC499("njacc_fin809_back", { p: { invoice_id: inv, reason: reason, request_id: req } }); }

/* ═══ V.810 DOCUMENT — SERVICE : USER = ตัวกรองสมาชิกตามแผนก (ขอบเขตจริง = njacc_view_scope RUN-804 : งานตนเอง + สมาชิกแผนกเดียวกัน · ตรวจที่ฐานข้อมูลทุกครั้ง)
   ค่าเริ่มต้น "งานของฉัน" (created_by_ids = ตนเอง) · "ทั้งหมดในแผนก" (ไม่กรองสมาชิก = ทั้งขอบเขตแผนก) · รายชื่อสมาชิกในแผนก (จาก njacc_charge_filter_options เดิม)
   เข้าหน้า / สลับโหมดกลับมา / ล้างตัวกรอง = งานของฉัน · ADMIN / SUPER_ADMIN / หัวหน้าแผนก = เดิม
   V.920 : ใช้กับ DOCUMENT — ADVANCE ด้วย (ขอบเขตจริงที่ฐานข้อมูลเหมือนกัน — queue "document" · RUN-804) ═══ */
var MD810 = !1;
function ME810() { try { return String((x.profile && x.profile.id) || ""); } catch (e) { return ""; } }
function UF810(f) { try { if (MD810 && f && String(x.profile && x.profile.role) === "USER" && !f.who_u && !f.who_d) { let me = ME810(); me && (f.who_u = me); } } catch (e) {} return f; }
function UD810(d, e, o) {
  try { MD810 = (o || "document") === "document" && (e === "SERVICE" || e === "ADVANCE")/* V.920 : เปิดใช้กับ DOCUMENT — ADVANCE ด้วย */;
    if (MD810 && d && d.filters && (x.rs803 || !d.__u810)) { d.__u810 = 1; UF810(d.filters); } } catch (e7) {}
  return d;
}
function MO810(t, e) {
  try {
    let s = e && e.scope593, me = ME810();
    if (!MD810 || !s || s.level !== "OWN" || s.mode !== "DEPT" || !me) return "";
    let seen = new Set(), us = UM822(e)/* V.822 */.filter((u) => u && u.id && !seen.has(String(u.id)) && seen.add(String(u.id)));
    if (!us.length) return "";
    ST696();
    let su = new Set(String(t.who_u || "").split(",").filter(Boolean)), cnt = 0;
    let self = us.filter((u) => String(u.id) === me), oth = us.filter((u) => String(u.id) !== me).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
    let lab = (u) => String(u.id) === me ? "งานของฉัน" : n(Kt(u.name) || u.name || "-") + (u.nickname ? " (" + n(u.nickname) + ")" : "");
    let body = `<div class="ms696-g">${self.concat(oth).map((u) => { let on = su.has(String(u.id)); on && cnt++; return `<label class="ms696-u"><input type="checkbox" data-u="${n(u.id)}" data-ud=""${on ? " checked" : ""}><span title="${n(u.name || "")}">${lab(u)}</span></label>`; }).join("")}</div>`;
    let bt = cnt === 1 && su.has(me) ? "งานของฉัน" : cnt ? "เลือกแล้ว " + cnt + " คน" : "ทั้งหมดในแผนก";
    return `<div class="ms696" data-ms696 data-own810="1"><button type="button" class="sel ms696-btn${cnt ? " ms696-on" : ""}" title="กรองตามสมาชิกในแผนก (งานของฉัน / ทั้งหมดในแผนก / รายคน)">${bt}</button><div class="ms696-pan" hidden><div class="ms696-h"><label class="ms696-all"><input type="checkbox" data-all="1"${cnt ? "" : " checked"}><b>ทั้งหมดในแผนก</b></label><button type="button" class="btn btn-o btn-sm ms696-clr">ล้างการเลือก</button></div><div class="ms696-b">${body}</div></div><input type="hidden" data-f="who_u" value="${n(t.who_u || "")}"><input type="hidden" data-f="who_d" value="${n(t.who_d || "")}"></div>`;
  } catch (e7) { return ""; }
}

/* ═══ V.811 · FINANCE — ADVANCE : แถบ "ใบเสร็จที่ออกแล้ว" = 1 แถวต่อเลขใบเสร็จจริง (Receipt ID · njacc_radv811_list · RUN-811) — อ่านอย่างเดียว
   แถบรอรับชำระ = เดิมทุกอย่าง · แถบใบเสร็จที่ออกแล้ว : แทนตาราง JOB เดิม (1 แถวต่อ INVOICE ADV) ด้วยตารางใบเสร็จ (ขอบเขต / สิทธิ์เดียวกับแถบเดิม : RECEIPT ADVANCE ACTIVE + รายการ active)
   คอลัมน์ : เลขที่ใบเสร็จ | วันที่ออก | Customer | จำนวน JOB (ไม่ซ้ำ) | จำนวน INVOICE (ไม่ซ้ำ) | ยอดรวม (= ยอดใน PDF) | สถานะ | จัดการ (รายการ / PREVIEW / PRINT / SAVE PDF เดิม PB791)
   คลิกแถว → หน้าต่างรายละเอียด (njacc_radv811_items) : ลำดับ | JOB No. | INVOICE No. (INVOICE ADV) | วันที่ INVOICE | Customer | Amount + ยอดรวม · PREVIEW = RL788 + RW788 เดิม · PRINT = RP789 เดิม · SAVE PDF = SV791 เดิม
   ค้นหา Real-Time : เลขใบเสร็จ / JOB No. / INVOICE ADV / Customer / วันที่ (ข้อความ) + ช่วงวันที่ออกใบเสร็จ · จำนวน / ยอดสรุป / EXPORT EXCEL = ต่อใบเสร็จ (ไม่รวมยอดซ้ำ) ═══ */
var S811 = { q: "", from: "", to: "", cust850: "", comp850: "", page: 1, size: 20 }, TK811 = 0;
var RH811 = '<th>เลขที่ใบเสร็จ</th><th>วันที่ออก</th><th>Customer</th><th class="center">จำนวน JOB</th><th class="center">จำนวน INVOICE</th><th class="r">ยอดรวม</th><th>สถานะ</th><th class="center col-act">จัดการ</th>';
function N811(v) { let x = Number(v); return isFinite(x) ? x.toLocaleString("th-TH") : "0"; }
function RP811() { return '<div id="radv811" class="p811" hidden></div>'; }
function VH811(t, d, g) {   /* เรียกจากต้น h() ของหน้า FINANCE — ADVANCE : แถบใบเสร็จที่ออกแล้ว = โหลดตารางใบเสร็จ (คืน true = ไม่โหลดตาราง JOB เดิม) · แถบรอรับชำระ = คืน false (FLOW เดิม) */
  let p = t && t.querySelector("#radv811"); if (!p) return !1;
  let on = TV789(d) === "issued";
  p.hidden = !on; t.querySelectorAll("#ch-kpi,.ch-panel").forEach((e) => { p.contains(e) || (e.closest && e.closest("#radv836")) || e.classList.toggle("hd811", on); });   /* V.885 : ไม่แตะแผงระบบเก่า */
  if (!on) return !1;
  TAB789 = "issued"; ST811();
  if (!p.__b811) {
    p.__b811 = 1;
    try { x.rs803 && Object.assign(S811, { q: "", from: "", to: "", cust850: "", comp850: "", page: 1 }); } catch (e) {}   /* V.803 : เข้าจากโหมดอื่น = ค่าเริ่มต้น */
    p.innerHTML = MQ850() ? PH811() : PH850(); AW811(t, p, g); MQ850() || OP850("acc", p, "data-a811");   /* V.850 */
  }
  LD811(t, p, g); return !0;
}
function PH811() {
  return `<div class="ch-panel p811-in"><div class="fbar f811b">`
    + `<label class="fl811 fl811-q"><span>ค้นหา</span><input class="inp" data-a811="q" value="${n(S811.q)}" placeholder="เลขใบเสร็จ / JOB No. / INVOICE ADV / Customer / วันที่ (dd/mm/yyyy)" autocomplete="off"></label>`
    + `<label class="fl811"><span>วันที่ออก ตั้งแต่</span><input class="inp" type="date" data-a811="from" value="${n(S811.from)}"></label>`
    + `<label class="fl811"><span>ถึง</span><input class="inp" type="date" data-a811="to" value="${n(S811.to)}"></label>`
    + `<button type="button" class="btn btn-o btn-sm" id="radv811-clr" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button><button type="button" class="btn btn-sm rf884" id="radv811-rf" title="โหลดข้อมูลล่าสุดจากฐานข้อมูล (คงตัวกรอง / หน้า / แท็บ / ระบบ เดิม)">⟳ รีเฟรช</button>${XB734("radv811-xl")}</div>`
    + `<div id="radv811-sum" class="sum811"></div><div class="card mt-2" id="radv811-pgn"></div>`
    + `<div class="tbl-wrap lp-scroll"><table class="tbl t811l"><thead><tr>${RH811}</tr></thead><tbody id="radv811-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody></table></div></div>`;
}
function AW811(t, p, g) {   /* ผูก event บนแผงนี้ (สร้างใหม่ทุกครั้งที่สร้างหน้า) */
  let tm = 0, run = () => { tm = 0; let o = {}; p.querySelectorAll("[data-a811]").forEach((e) => { o[e.dataset.a811] = String(e.value || "").trim(); });
    if (Object.keys(o).every((k) => o[k] === (S811[k] || ""))) return;   /* V.850 : + ลูกค้า / บริษัท */ Object.assign(S811, o, { page: 1 }); LD811(t, p, g); };
  let on = (ev) => { let e = ev.target; if (!e || !e.dataset || !e.dataset.a811 || ev.isComposing) return; clearTimeout(tm); tm = setTimeout(run, e.type === "date" ? 0 : 280); };
  p.addEventListener("input", on); p.addEventListener("change", on); p.addEventListener("compositionend", on);
  p.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return; let e = ev.target;
    if (e && e.dataset && e.dataset.a811) { ev.preventDefault(); clearTimeout(tm); run(); return; }
    e && e.matches && e.matches("tr[data-ar811]") && (ev.preventDefault(), AD811(e.dataset.ar811));
  });
  p.addEventListener("click", (ev) => {
    let c = ev.target.closest && ev.target.closest("#radv811-clr,#radv811-xl,#radv811-go,[data-ad811],[data-pm811],#radv811-rf");
    if (c && c.id === "radv811-rf") { ev.preventDefault(); clearTimeout(tm); RB884(c, async () => { let ok = await LD811(t, p, g, !0); ok === !0 && !MQ850() && OP850("acc", p, "data-a811"); }); return; }   /* V.884 */
    if (c && c.id === "radv811-go") { ev.preventDefault(); clearTimeout(tm); let o = {}; p.querySelectorAll("[data-a811]").forEach((e) => { o[e.dataset.a811] = String(e.value || "").trim(); }); Object.assign(S811, o, { page: 1 }); LD811(t, p, g); return; }   /* V.850 */
    if (c && c.dataset.pm811) { ev.preventDefault(); let id = c.dataset.pm811; P850(c, [["📄", "PREVIEW", () => RG788([id])], ["🖨", "PRINT", () => RP789(id, c)], ["⬇", "SAVE PDF", () => SV791(id, c)]]); return; }   /* V.850 */
    if (c) { ev.preventDefault(); if (c.id === "radv811-clr") { p.querySelectorAll("[data-a811]").forEach((e) => { e.value = ""; }); clearTimeout(tm); run(); } else if (c.id === "radv811-xl") XA811(c, g); else AD811(c.dataset.ad811); return; }
    if (ev.target.closest && ev.target.closest("button,a,input,select,label")) return;   /* PREVIEW / PRINT / SAVE PDF (PB791) = event เดิมของหน้า */
    let tr = ev.target.closest && ev.target.closest("#radv811-tbody tr[data-ar811]"); tr && AD811(tr.dataset.ar811);
  });
}
/* ═══ V.850 (RUN-850) · FINANCE → ADVANCE : หน้ารายงานใบเสร็จที่ออกแล้ว (Desktop ≥ 641px · Mobile = AR811 / PH811 เดิม) ═══
   หัวข้อหลัก · ตัวกรอง ค้นหาทั่วไป / วันที่ / ลูกค้า / บริษัท · แถบสรุป · 9 คอลัมน์ : # | Receipt (ADV) | Receipt Date | Customer | Qty Job | Qty Ad | Advance | Payment Received | จัดการ
   จัดการ = รายการ | พิมพ์ ▼ (PREVIEW / PRINT / SAVE PDF · เลขเดิม) | แก้ไข (เฉพาะใบที่มี FLOW แก้ไข · ระบบเก่า) — ใช้ร่วมกับ adv-legacy-L836.js ผ่าน DP836 */
function MQ850() { try { return window.matchMedia("(max-width:640px)").matches; } catch (e) { return !1; } }
function ST850() {
  if (document.getElementById("st850-css")) return;
  let s = document.createElement("style"); s.id = "st850-css";
  s.textContent = ".bn850{display:none}@media (min-width:641px){"
    + ".bn850{display:inline-block;background:linear-gradient(90deg,#1d4ed8,#2563eb);color:#fff;font-weight:800;font-size:20px;line-height:1.3;padding:10px 26px;border-radius:12px;margin:6px 0 8px;box-shadow:0 2px 8px rgba(37,99,235,.28)}"
    + ".radv789-tab.radv789-pending,.radv789-tab.radv789-issued{background:#fff;color:#173455;border-color:#DCE6F1}.radv789-tab.active{background:#16a34a!important;color:#fff!important;border-color:#16a34a!important}"
    + ".l836-sw button{background:#fff;border-color:#bfdbfe;color:#173455}.l836-sw button.on{background:#0f2a4d;color:#fff;border-color:#0f2a4d}"
    + ".fbar.f850{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:flex-end;background:#fff;border:1px solid #DCE6F1;border-radius:10px;padding:12px 14px}"
    + ".fl850{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:700;color:#173455}.fl850-q{flex:1 1 220px;max-width:380px}.fl850-q .inp{width:100%}"
    + ".fl850 .inp,.fl850 .sel{height:40px;border:1px solid #DCE6F1;border-radius:8px;color:#173455}.fl850-s .sel{width:180px;min-width:140px;max-width:200px}"
    + ".f850 .btn{height:40px;border-radius:8px;font-weight:700;padding:0 16px}.btn.go850{background:#EAF2FB!important;border:1px solid #bfdbfe!important;color:#173455!important}"
    + ".btn.clr850{background:#fff!important;border:1px solid #DCE6F1!important;color:#173455!important}.f850 .xl734{background:#16a34a!important;color:#fff!important;border:1px solid #16a34a!important}"
    + ".sum850{display:flex;flex-wrap:wrap;gap:6px 22px;align-items:center;margin:10px 0 0;padding:10px 14px;border:1px solid #DCE6F1;border-radius:10px;background:#fff;font-size:15px;color:#173455}.sum850:empty{display:none}.sum850 b{font-weight:800}"
    + "table.t850{border:1px solid #DCE6F1;border-radius:10px;border-collapse:separate!important;border-spacing:0;overflow:hidden;background:#fff;width:100%}"
    + "table.t850 thead th{vertical-align:middle!important;background:#EAF2FB!important;color:#173455!important;height:46px;font-weight:700!important;font-size:13.5px;border-bottom:1px solid #DCE6F1!important;white-space:nowrap;text-transform:none!important;padding:4px 12px!important}"
    + "table.t850 thead th.h850a{background:#ECE2FF!important}table.t850 tbody td{height:58px;border-bottom:1px solid #DCE6F1!important;color:#173455;font-size:14px;vertical-align:middle;white-space:nowrap;padding:4px 12px!important}"
    + "table.t850 tbody tr:last-child td{border-bottom:0!important}table.t850 tbody tr:nth-child(odd) td{background:#FFFCEF}table.t850 tbody tr:hover td{background:#FFF6D6!important}"
    + "table.t850 th.r,table.t850 td.r{text-align:right!important}table.t850 td.r{font-weight:600;font-variant-numeric:tabular-nums}table.t850 td.pay850{font-weight:700!important}table.t850 th.center,table.t850 td.center{text-align:center!important}"
    + "table.t850 td.c850{text-align:left!important;white-space:normal;min-width:200px;max-width:380px;line-height:1.3}"
    + "table.t850 .an850{color:#7C3AED;text-decoration:underline;font-weight:700;cursor:pointer;background:none;border:0;padding:0;font-size:15px}table.t850 .tg850{display:block;font-size:11px;color:#9a3412;font-weight:600}"
    + "table.t850 td.col-act{white-space:nowrap}table.t850 td.col-act>.btn{height:36px!important;min-height:36px!important;font-size:12px!important;font-weight:600!important;border-radius:6px!important;padding:0 10px!important;min-width:60px!important;width:auto!important;margin:0 6px 0 0!important;display:inline-flex!important;align-items:center;justify-content:center;line-height:1!important;vertical-align:middle}"
    + "table.t850 td.col-act>.btn:last-child{margin-right:0!important}"
    + "}.btn.b850{background:#fff!important;border:1px solid #2563eb!important;color:#1d4ed8!important}.btn.b850:hover{background:#eff6ff!important}.btn.p850{background:#EFF6FF!important;border:1px solid #2563eb!important;color:#1d4ed8!important}.btn.p850:hover{background:#dbeafe!important}.btn.e850{background:#fff!important;border:1px solid #b45309!important;color:#b45309!important}.btn.e850:hover{background:#fffbeb!important}@media (max-width:640px){td.col-act>.btn.b850,td.col-act>.btn.p850,td.col-act>.btn.e850{height:36px!important;min-height:36px!important;min-width:60px;padding:0 10px!important;margin:0 6px 6px 0!important;font-size:12px!important;font-weight:600!important;border-radius:6px!important;display:inline-flex!important;align-items:center;justify-content:center;line-height:1!important;vertical-align:middle;white-space:nowrap}#radv811-tbody td.col-act{gap:6px!important}#radv811-tbody td.col-act>.btn.b850,#radv811-tbody td.col-act>.btn.p850{margin:0!important}}.pm850 .i857{display:inline-flex;width:22px;justify-content:center}.pm850{position:fixed;z-index:3400;background:#fff;border:1px solid #DCE6F1;border-radius:10px;box-shadow:0 8px 24px rgba(15,42,77,.2);padding:6px;display:grid;gap:2px;min-width:180px}"
    + ".pm850 button{border:0;background:#fff;text-align:left;padding:9px 12px;border-radius:6px;font-size:14px;font-weight:700;color:#173455;cursor:pointer;display:flex;gap:10px;align-items:center}.pm850 button:hover{background:#EAF2FB}";
  document.head.appendChild(s);
}
function BN850() { ST850(); return ""; }   /* V.883 : ซ่อนหัวข้อ "รายการใบเสร็จรับเงินล่วงหน้า (ADVANCE)" ทุกแท็บ / ทุกระบบ (เดิม V.850) · สไตล์แท็บ / ปุ่มของ ST850 ยังใช้ตามเดิม */
/* V.857 : ไอคอนเมนู พิมพ์ ▼ (PREVIEW น้ำเงิน · PRINT ม่วง · SAVE PDF แดง) */ var IC857 = {PREVIEW: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>',PRINT: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a21caf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="9" rx="2" fill="#fae8ff"/><path d="M6 14h12v8H6z" fill="#fff"/></svg>',"SAVE PDF": '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z" fill="#dc2626"/><path d="M15 2v5h5" fill="#fca5a5"/><text x="13" y="18.5" text-anchor="middle" font-size="6.5" font-weight="700" fill="#fff" font-family="Arial">PDF</text></svg>'};
function P850(b, acts) {   /* เมนู พิมพ์ ▼ : acts = [[ไอคอน, ข้อความ, ฟังก์ชัน]] */
  ST850(); let old = document.querySelector(".pm850"); old && old.remove();
  let m = document.createElement("div"); m.className = "pm850"; m.setAttribute("role", "menu");
  m.innerHTML = acts.map((a, i) => `<button type="button" role="menuitem" data-pm850="${i}"><span class="i857" aria-hidden="true">${IC857[a[1]] || a[0]}</span>${a[1]}</button>`).join("");   /* V.857 */
  document.body.appendChild(m); let r = b.getBoundingClientRect(), vv = window.visualViewport, H = vv ? vv.height + vv.offsetTop : window.innerHeight, W = vv ? vv.width + vv.offsetLeft : window.innerWidth, mh = m.offsetHeight || 140, mw = m.offsetWidth || 190;   /* V.857 : อยู่ในพื้นที่ที่มองเห็นจริง · ไม่พอด้านล่าง = เปิดด้านบนปุ่ม (Mobile) */
  m.style.top = (r.bottom + 4 + mh <= H - 8 ? r.bottom + 4 : Math.max(8, r.top - mh - 4)) + "px"; m.style.left = Math.max(8, Math.min(W - mw - 8, r.left)) + "px";
  let close = () => { m.remove(); document.removeEventListener("mousedown", out, !0); document.removeEventListener("keydown", esc, !0); };
  let out = (ev) => { m.contains(ev.target) || close(); }, esc = (ev) => { ev.key === "Escape" && close(); };
  setTimeout(() => { document.addEventListener("mousedown", out, !0); document.addEventListener("keydown", esc, !0); }, 0);
  m.onclick = (ev) => { let c = ev.target.closest && ev.target.closest("[data-pm850]"); if (!c) return; close(); acts[+c.dataset.pm850][2](); };
}
async function OP850(src, host, attr) {   /* Dropdown ลูกค้า / บริษัท (RUN-850 · ยังไม่รัน = ทั้งหมดเท่านั้น) */
  let r = null; try { r = await RPC499("njacc_adv850_opts", { p: { src } }); } catch (e) { r = null; }
  /* V.880 (RUN-880 : pairs) : ลูกค้า ↔ บริษัท สัมพันธ์กัน — แสดงเฉพาะคู่ที่มีใบเสร็จจริง · ยังไม่รัน RUN-880 = รายชื่อเดิม */
  let P = r && Array.isArray(r.pairs) ? r.pairs : null, el = (k) => host && host.querySelector("[" + attr + '="' + k + '"]');
  let fill = () => {
    let sc = el("cust850"), sk = el("comp850"), cv = sc ? sc.value : "", kv = sk ? sk.value : "";
    [["cust850", "ลูกค้าทั้งหมด", "customers", 0, cv, kv], ["comp850", "บริษัททั้งหมด", "companies", 1, kv, cv]].forEach(([k, ph, f, ix, cur, ov]) => {
      let s = el(k); if (!s) return;
      let h = `<option value="">${ph}</option>` + ((r && r[f]) || []).filter((v) => !P || !ov || v === cur || P.some((p) => p[ix] === v && p[1 - ix] === ov)).map((v) => `<option value="${n(v)}">${n(v)}</option>`).join("");
      s.__h880 !== h && ((s.__h880 = h), (s.innerHTML = h)); s.value !== cur && (s.value = cur); s.__fl880 = fill;
      P && !s.__f880 && ((s.__f880 = 1), s.addEventListener("change", () => { s.__fl880 && s.__fl880(); }));
    });
  };
  fill();
}
var RH850 = '<th class="center">#</th><th class="h850a">Receipt (ADV)</th><th class="center">Receipt Date</th><th>Customer</th><th class="center">Qty Job</th><th class="center">Qty Ad</th><th class="r">Advance</th><th class="r">Payment Received</th><th class="center col-act">จัดการ</th>';
function FB850(at, S, keys, extra) {   /* แถบค้นหา : ค้นหาทั่วไป | วันที่เริ่มต้น | วันที่สิ้นสุด | ค้นหาลูกค้า | ค้นหาบริษัท | ค้นหา | ล้างค้นหา | EXPORT EXCEL */
  return `<div class="fbar f850">`
    + `<label class="fl850 fl850-q"><span>ค้นหาทั่วไป</span><input class="inp" ${at}="${keys[0]}" value="${n(S[keys[0]] || "")}" placeholder="เลขใบเสร็จ / JOB No. / INVOICE ADV / Customer ..." autocomplete="off"></label>`
    + `<label class="fl850"><span>วันที่เริ่มต้น</span><input class="inp" type="date" ${at}="${keys[1]}" value="${n(S[keys[1]] || "")}"></label>`
    + `<label class="fl850"><span>วันที่สิ้นสุด</span><input class="inp" type="date" ${at}="${keys[2]}" value="${n(S[keys[2]] || "")}"></label>`
    + `<label class="fl850 fl850-s"><span>ค้นหาลูกค้า</span><select class="sel" ${at}="cust850"><option value="">ลูกค้าทั้งหมด</option></select></label>`
    + `<label class="fl850 fl850-s"><span>ค้นหาบริษัท</span><select class="sel" ${at}="comp850"><option value="">บริษัททั้งหมด</option></select></label>` + extra + `</div>`;
}
function SM850(k, total) { return `<span>ใบเสร็จ <b>${N811(k.receipts != null ? k.receipts : total)}</b> ใบ</span><span>JOB <b>${N811(k.jobs)}</b></span><span>INVOICE <b>${N811(k.invoices)}</b></span><span>ยอดรวม ADVANCE <b>${M788(k.amount || 0)}</b></span>`; }
function PH850() {
  ST850();
  return `<div class="ch-panel p811-in">` + FB850("data-a811", S811, ["q", "from", "to"], `<button type="button" class="btn btn-sm go850" id="radv811-go">ค้นหา</button><button type="button" class="btn btn-sm clr850" id="radv811-clr" title="คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น">ล้างค้นหา</button><button type="button" class="btn btn-sm rf884" id="radv811-rf" title="โหลดข้อมูลล่าสุดจากฐานข้อมูล (คงตัวกรอง / หน้า / แท็บ / ระบบ เดิม)">⟳ รีเฟรช</button>${XB734("radv811-xl")}`)
    + `<div id="radv811-sum" class="sum850"></div><div class="card mt-2" id="radv811-pgn"></div>`
    + `<div class="tbl-wrap lp-scroll"><table class="tbl t811l t850"><thead><tr>${RH850}</tr></thead><tbody id="radv811-tbody"><tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr></tbody></table></div></div>`;
}
function AR850(o, i, off) {
  let id = n(o.receipt_id || ""), no = n(o.receipt_no || "");
  return `<tr class="r811 r850" data-ar811="${id}" tabindex="0" title="คลิกเพื่อดูรายการ INVOICE ADV ของ ${no}">`
    + `<td class="center">${N811((Number(off) || 0) + (Number(i) || 0) + 1)}</td>`
    + `<td class="nowrap"><button type="button" class="an850" data-ad811="${id}" title="เปิดรายละเอียด ${no}">${no}</button></td>`
    + `<td class="center nowrap">${D788(o.receipt_date) || "-"}</td>`
    + `<td class="c850" title="${n(o.customer_name || "")}">${n(o.customer_name || "-")}</td>`
    + `<td class="center">${N811(o.job_count)}</td><td class="center">${N811(o.invoice_count)}</td>`
    + `<td class="r">${M788(o.total)}</td><td class="r pay850">${M788(o.total)}</td>`
    + `<td class="center nowrap col-act"><button type="button" class="btn btn-sm b850" data-ad811="${id}" title="รายละเอียด INVOICE ADV — ${no}">รายการ</button>`
    + `<button type="button" class="btn btn-sm p850" data-pm811="${id}" aria-haspopup="menu" title="PREVIEW / PRINT / SAVE PDF — ${no} (เลขเดิม)">พิมพ์ ▼</button></td></tr>`;
}
function AR811(o) {
  ST850(); let id = n(o.receipt_id || ""), no = n(o.receipt_no || "");   /* V.857 : สไตล์ปุ่ม Mobile */
  return `<tr class="r811" data-ar811="${id}" tabindex="0" title="คลิกเพื่อดู JOB / INVOICE ADV ทั้งหมดในใบเสร็จ ${no}">`
    + `<td class="nowrap" data-l="เลขที่ใบเสร็จ"><b class="no811">${no}</b></td>`
    + `<td class="nowrap" data-l="วันที่ออก">${D788(o.receipt_date) || "-"}</td>`
    + `<td class="c811" data-l="Customer" title="${n(o.customer_name || "")}">${n(o.customer_name || "-")}</td>`
    + `<td class="center" data-l="จำนวน JOB">${N811(o.job_count)}</td>`
    + `<td class="center" data-l="จำนวน INVOICE">${N811(o.invoice_count)}</td>`
    + `<td class="r t-b" data-l="ยอดรวม">${M788(o.total)}</td>`
    + `<td class="nowrap" data-l="สถานะ"><span class="bdg789">ออกใบเสร็จแล้ว</span></td>`
    + `<td class="center nowrap col-act" data-l="จัดการ"><button type="button" class="btn btn-sm b811 b850" data-ad811="${id}" title="ดู JOB / INVOICE ADV ทั้งหมดในใบเสร็จ ${no}">รายการ</button><button type="button" class="btn btn-sm p850" data-pm811="${id}" aria-haspopup="menu" title="PREVIEW / PRINT / SAVE PDF — ${no} (เลขเดิม)">พิมพ์ ▼</button></td></tr>`;   /* V.857 : Mobile = ปุ่มเดียวกับ Desktop */
}
async function LD811(t, p, g, rf) {   /* V.884 : rf = กดรีเฟรช (ไม่สำเร็จ = แจ้ง · คงข้อมูลเดิม) */
  let tk = ++TK811, tb = p.querySelector("#radv811-tbody"); if (!tb) return;
  let f = { company_group: g || "NJ", q: S811.q || null, from: S811.from || null, to: S811.to || null, cust850: S811.cust850 || null, comp850: S811.comp850 || null, page: S811.page, size: S811.size };   /* V.850 */
  try {
    let r = await RPC499("njacc_radv811_list", { p: f }); if (tk !== TK811 || !p.isConnected) return;
    let rows = (r && r.rows) || [], k = (r && r.kpi) || {}, sm = p.querySelector("#radv811-sum");
    sm && !MQ850() ? (sm.innerHTML = SM850(k, r.total)) : sm && (sm.innerHTML = `<span>ใบเสร็จ <b>${N811(k.receipts != null ? k.receipts : r.total)}</b> ใบ</span><span>JOB <b>${N811(k.jobs)}</b></span><span>INVOICE <b>${N811(k.invoices)}</b></span><span>ยอดรวม <b>${M788(k.amount || 0)}</b></span>`);
    tb.innerHTML = rows.length ? rows.map((o9, i9) => (MQ850() ? AR811(o9) : AR850(o9, i9, (S811.page - 1) * S811.size))).join("") : '<tr><td colspan="9" class="empty">ยังไม่มีใบเสร็จ</td></tr>';   /* V.850 */
    Dt(p.querySelector("#radv811-pgn"), { page: S811.page, size: S811.size, total: (r && r.total) || 0 }, ({ page: a, size: z }) => { S811.page = a; S811.size = z; LD811(t, p, g); }, { lp: !0 });
    return !0;
  } catch (e) {
    if (tk !== TK811 || !p.isConnected) return;
    if (rf) { y("รีเฟรชไม่สำเร็จ — " + RE788(e) + " (ยังแสดงข้อมูลเดิม)", "err"); return !1; }   /* V.884 */
    tb.innerHTML = `<tr><td colspan="8" class="empty">โหลดรายการไม่สำเร็จ — ${n(RE788(e))} <button type="button" class="btn btn-sm btn-o" data-rt811>ลองใหม่</button></td></tr>`;
    let rb = tb.querySelector("[data-rt811]"); rb && (rb.onclick = (ev) => { ev.stopPropagation(); tb.innerHTML = '<tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>'; LD811(t, p, g); });
  }
}
function DH811(d, lab) {   /* เนื้อหาหน้าต่างรายละเอียด */
  let it = (d && d.items) || [], st = d && d.status === "VOID_RESET" ? "ยกเลิก" : "ออกใบเสร็จแล้ว";
  return `<div class="h811"><div><span>เลขที่ใบเสร็จ</span><b>${n(d.receipt_no || "-")}</b></div><div><span>วันที่ออก</span><b>${D788(d.receipt_date) || "-"}</b></div>`
    + `<div class="h811-c"><span>Customer</span><b>${n(d.customer_name || "-")}</b></div><div><span>จำนวน JOB</span><b>${N811(d.job_count)}</b></div><div><span>จำนวน INVOICE</span><b>${N811(d.invoice_count)}</b></div><div><span>สถานะ</span><b class="s811">${st}</b></div></div>`
    + `<div class="tbl-wrap w811"><table class="tbl t811"><thead><tr><th class="center">ลำดับ</th><th>JOB No.</th><th>INVOICE No. <small>(${lab})</small></th><th>วันที่ INVOICE</th><th>Customer</th><th class="r">Amount</th></tr></thead><tbody>`
    + (it.length ? it.map((z, j) => `<tr><td class="center" data-l="ลำดับ">${j + 1}</td><td class="nowrap" data-l="JOB No."><b>${n(z.job_no || "-")}</b></td><td class="nowrap" data-l="INVOICE No.">${n(z.invoice_no || "-")}</td>`
        + `<td class="nowrap" data-l="วันที่ INVOICE">${D788(z.invoice_date) || "-"}</td><td data-l="Customer">${n(z.customer_name || "-")}</td><td class="r" data-l="Amount">${M788(z.amount)}</td></tr>`).join("")
      : '<tr><td colspan="6" class="empty">ไม่พบรายการ</td></tr>')
    + `</tbody><tfoot><tr class="tot811"><td colspan="5" class="r">ยอดรวม (${N811(it.length)} รายการ)</td><td class="r" data-l="ยอดรวม">${M788(d.total)}</td></tr></tfoot></table></div>`;
}
async function AD811(id) {   /* หน้าต่างรายละเอียด RECEIPT ADVANCE */
  if (!id) return; let d;
  try { d = await RPC499("njacc_radv811_items", { p_id: id }); } catch (e) { y("เปิดรายละเอียดใบเสร็จไม่สำเร็จ — " + RE788(e), "err"); return; }
  ST811(); ST791();
  let body = document.createElement("div"), foot = document.createElement("div"); body.className = "d811";
  foot.className = "f811"; foot.innerHTML = '<button type="button" class="btn radv791-b radv791-pv" data-x811="pv">PREVIEW</button><button type="button" class="btn radv791-b radv791-pr" data-x811="pr">PRINT</button>'
    + '<button type="button" class="btn radv791-b radv791-sv" data-x811="sv">SAVE PDF</button><button type="button" class="btn btn-o" data-close>ปิด</button>';
  let show = () => { body.innerHTML = DH811(d, "INVOICE ADV"); };
  show(); mt({ title: "RECEIPT ADVANCE " + (d.receipt_no || ""), body, footer: foot, fullscreen: !0, wide: !0 });
  foot.querySelector('[data-x811="pv"]').onclick = async (ev) => {   /* PREVIEW = RW788 เดิม (แสดงในหน้าต่างนี้ · ← กลับ = รายละเอียด) */
    let b2 = ev.currentTarget; if (b2.disabled) return; b2.disabled = !0;
    try { let docs = await RL788([id]); docs.length && (await RW788(docs, { sample: !1, back: show }, body)); } catch (e) { y("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE788(e), "err"); } finally { b2.disabled = !1; }
  };
  foot.querySelector('[data-x811="pr"]').onclick = (ev) => RP789(id, ev.currentTarget);
  foot.querySelector('[data-x811="sv"]').onclick = (ev) => SV791(id, ev.currentTarget);
}
async function XA811(bt, g) {   /* EXPORT EXCEL : 1 แถวต่อใบเสร็จ (ตัวกรองปัจจุบัน · ทุกหน้า · ไม่รวมยอดซ้ำ) */
  if (!bt || bt.disabled) return; bt.disabled = !0; let lb = bt.innerHTML; bt.textContent = "กำลังส่งออก…";
  try {
    let f = { company_group: g || "NJ", q: S811.q || null, from: S811.from || null, to: S811.to || null, cust850: S811.cust850 || null, comp850: S811.comp850 || null }, all = [], seen = new Set(), tot = 0;   /* V.850 */
    for (let pg = 1; pg <= 2000; pg++) {
      let r = await RPC499("njacc_radv811_list", { p: Object.assign({}, f, { page: pg, size: 200 }) }), rows = (r && r.rows) || []; pg === 1 && (tot = Number(r && r.total) || 0);
      rows.forEach((o) => { let k = String(o.receipt_id || ""); k && !seen.has(k) && (seen.add(k), all.push(o)); });
      if (!rows.length || pg * 200 >= tot) break;
    }
    let cols = [["Receipt (ADV)", (o) => o.receipt_no], ["Receipt Date", (o) => o.receipt_date, "date"], ["Customer", (o) => o.customer_name], ["Qty Job", (o) => o.job_count, "int"], ["Qty Ad", (o) => o.invoice_count, "int"],
      ["Advance", (o) => o.total, "num"], ["Payment Received", (o) => o.total, "num"]];   /* V.850 : หัวข้อ / ลำดับเดียวกับหน้ารายงาน */
    let fn = await XW734("FINANCE_ADVANCE_ISSUED", cols, all);
    y("ส่งออก Excel " + all.length.toLocaleString("th-TH") + " ใบเสร็จแล้ว (" + fn + ")", "ok");
  } catch (e) { y("ส่งออก Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); }
  bt.disabled = !1; bt.innerHTML = lb;
}
function ST811() {
  try {
    if (document.getElementById("st811a-css")) return;
    let s = document.createElement("style"); s.id = "st811a-css";
    s.textContent = [
      ".p811-in .fbar.f811b{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}.fl811{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#475569;font-weight:600}.fl811-q{flex:1 1 320px;max-width:520px}.fl811-q .inp{width:100%}",
      "#ch-kpi.hd811,.ch-panel.hd811{display:none!important}.p811{margin-top:10px}",
      ".sum811{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:10px 0 0;padding:8px 12px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;font-size:13px;color:#334155}.sum811:empty{display:none}.sum811 b{color:#0f2a4d;font-size:14px}",
      "tr.r811,tr.r811 td,.rc502 tbody tr.r811,.rc502 tbody tr.r811 td{cursor:pointer!important}tr.r811:hover td{background:#eef4ff!important}tr.r811:focus-visible{outline:2px solid #2563eb;outline-offset:-2px}.no811{color:#0f2a4d}",
      "td.c811{min-width:180px;max-width:340px;white-space:normal;line-height:1.3}",
      ".btn.b811{background:#fff!important;border:1px solid #2563eb!important;color:#1d4ed8!important;font-weight:700;margin-right:4px}.btn.b811:hover{background:#eff6ff!important}",
      ".h811{display:grid;grid-template-columns:repeat(6,minmax(0,auto));gap:10px 22px;margin:0 0 12px;padding:12px 14px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc}",
      ".h811>div{display:flex;flex-direction:column;gap:2px;min-width:0}.h811 span{font-size:12px;color:#64748b}.h811 b{font-size:14px;color:#0f2a4d;overflow-wrap:anywhere}.h811 .s811{color:#15803d}",
      ".t811 th small{font-weight:600;opacity:.8}.t811 tfoot td{font-weight:800;background:#f1f5f9;border-top:2px solid #cbd5e1}.f811{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;width:100%}",
      "@media (max-width:900px){.h811{grid-template-columns:repeat(2,minmax(0,1fr))}.h811 .h811-c{grid-column:1/-1}}",
      "@media (max-width:640px){",
      "#rc-issued table thead,.t811l thead{display:none}#rc-issued table,#rc-issued table tbody,.t811l,.t811l tbody{display:block;width:100%}",
      "tr.r811{display:block;margin:0 0 10px;border:1px solid #dbe4f0;border-radius:10px;background:#fff;padding:6px 10px;box-shadow:0 1px 2px rgba(15,42,77,.06)}",
      "tr.r811 td{display:flex;justify-content:space-between;align-items:center;gap:10px;border:0!important;padding:5px 0!important;max-width:none!important;min-width:0!important;text-align:right;white-space:normal}",
      "tr.r811 td::before{content:attr(data-l);font-size:12px;color:#64748b;font-weight:600;text-align:left;flex:none}tr.r811 td.col-act{flex-wrap:wrap;justify-content:flex-end}tr.r811 td.col-act::before{display:none}",
      ".t811 thead{display:none}.t811,.t811 tbody,.t811 tfoot{display:block;width:100%}.t811 tr{display:block;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 8px;padding:4px 8px}",
      ".t811 td{display:flex;justify-content:space-between;gap:10px;border:0!important;padding:4px 0!important;text-align:right}.t811 td::before{content:attr(data-l);color:#64748b;font-size:12px;font-weight:600;text-align:left}",
      ".t811 tfoot td[colspan]{display:none}.f811 .btn{flex:1 1 40%}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.813 · PREVIEW เต็มหน้าจอ (ไม่ใช้กรอบ Modal เดิม) — แถบเครื่องมือด้านบน PRINT / SAVE PDF / ปิด · เอกสาร A4 กึ่งกลาง ปรับขนาดการแสดงผลให้พอดีความกว้างจออัตโนมัติ (เฉพาะการแสดงผล ไม่ย่อ PDF)
   เนื้อหา = HTML เดียวกับ PRINT / SAVE PDF (Template เดิม) · ปิด = กลับหน้าเดิม (ไม่ล้างตัวกรอง / รายการที่เลือก) · ใช้ร่วมทุกจุดที่เรียก Preview เดิม ═══ */
function PV813(o) {
  ST813V(); let old = document.getElementById("pv813"); old && old.remove();
  let w = document.createElement("div"); w.id = "pv813"; w.className = "pv813"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
  w.innerHTML = `<div class="pv813-bar"><div class="pv813-t"><b>${n(o.title || "")}</b>${o.note ? `<span class="pv813-n">${n(o.note)}</span>` : ""}${o.warn ? `<span class="pv813-w">${n(o.warn)}</span>` : ""}</div>`
    + `<div class="pv813-b"><button type="button" class="btn pv813-pr" data-pv813="pr">PRINT</button>${o.save ? '<button type="button" class="btn pv813-sv" data-pv813="sv">SAVE PDF</button>' : ""}<button type="button" class="btn pv813-x" data-pv813="x">ปิด</button></div></div>`
    + `<div class="pv813-st"><div class="pv813-z"><div class="radv788-doc pv813-doc">${o.html}</div></div></div>`;
  document.body.appendChild(w);
  let ov0 = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
  let st = w.querySelector(".pv813-st"), z = w.querySelector(".pv813-z");
  let fit = () => { let W = st.clientWidth - 16, s = Math.max(0.2, Math.min(1.25, W / 793.7)); z.style.zoom = String(Math.round(s * 1000) / 1000); };
  fit(); let ro = null; try { ro = new ResizeObserver(fit); ro.observe(st); } catch (e) { window.addEventListener("resize", fit); }
  let close = () => { if (!w.isConnected) return; try { ro ? ro.disconnect() : window.removeEventListener("resize", fit); } catch (e) {} document.removeEventListener("keydown", key, !0); w.remove(); document.documentElement.style.overflow = ov0; try { o.onClose && o.onClose(); } catch (e) {} };
  let key = (ev) => { ev.key === "Escape" && !document.body.classList.contains("radv788-printing") && (ev.preventDefault(), ev.stopPropagation(), close()); };
  document.addEventListener("keydown", key, !0);
  w.querySelector('[data-pv813="x"]').onclick = close;
  w.querySelector('[data-pv813="pr"]').onclick = () => o.print();
  let sv = w.querySelector('[data-pv813="sv"]'); sv && (sv.onclick = async () => { if (sv.disabled) return; for (let j = 0; j < o.parts.length; j++) await o.save(o.parts[j], o.names[j], sv); });
  return { close, el: w };
}
function ST813V() {
  try {
    if (document.getElementById("st813v-a")) return;
    let s = document.createElement("style"); s.id = "st813v-a";
    s.textContent = [
      ".pv813{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;background:#e9ecf1}",
      ".pv813-bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 12px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:#0f2a4d;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25)}",
      ".pv813-t{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;font-size:14px}.pv813-t b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}",
      ".pv813-n{font-size:12px;font-weight:700;color:#fecaca}.pv813-w{font-size:12px;font-weight:700;background:#dc2626;color:#fff;border-radius:999px;padding:1px 10px}",
      ".pv813-b{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}.pv813-b .btn{min-width:92px;height:36px;min-height:36px;padding:0 14px;font-size:13.5px;font-weight:700;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-align:center}",
      ".btn.pv813-pr{background:#2563eb!important;border:1px solid #2563eb!important;color:#fff!important}.btn.pv813-sv{background:#16a34a!important;border:1px solid #16a34a!important;color:#fff!important}.btn.pv813-x{background:#fff!important;border:1px solid #fff!important;color:#0f2a4d!important}.pv813-b .btn:disabled{opacity:.6;cursor:wait}",
      ".pv813-st{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:8px}",
      ".pv813-z{width:210mm;margin:0 auto}.pv813-doc .radv-pg{margin:0 auto 8px;box-shadow:0 1px 6px rgba(15,23,42,.18)}",
      "@media (max-width:640px){.pv813-bar{padding:6px 8px;gap:6px}.pv813-t{font-size:13px}.pv813-b{width:100%}.pv813-b .btn{flex:1 1 0;min-width:0;height:34px;min-height:34px;padding:0 4px;font-size:13px}.pv813-t b{max-width:100%}.pv813-st{padding:6px}}",
      "@media print{.pv813{display:none!important}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}

/* ═══ V.813 · PDF ส่วนรายละเอียดใต้ส่วนหัว : ตัวอักษร 8–9.6 pt · ตาราง / กรอบ กระชับ ~10–15% (ส่วนหัวคงเดิม 100% · ไม่ย่อทั้งหน้า) — ใช้ร่วม PREVIEW / PRINT / SAVE PDF ═══ */
function ST813() {
  try {
    if (document.getElementById("st813a-css")) return;
    let s = document.createElement("style"); s.id = "st813a-css";
    s.textContent = [
      ".radv-pg .radv-boxes{gap:3.5mm;margin-top:4.2mm}",
      ".radv-pg .radv-box{padding:3.8mm 3.4mm 2.5mm}.radv-pg .radv-tag{font-size:8.5pt;top:-2.4mm}",
      ".radv-pg .radv-kv3{margin-top:1mm;font-size:8.8pt;line-height:1.3}.radv-pg .radv-boxes>.radv-box:first-child .radv-kv3{font-size:8.4pt}.radv-pg .radv-addr{font-size:8.2pt;line-height:1.3}",
      ".radv-pg .radv-tb{margin-top:4.2mm}.radv-pg .radv-tb th{font-size:8.8pt;line-height:1.2;padding:1.9mm 1.6mm}",
      ".radv-pg .radv-tb td{font-size:8.3pt;line-height:1.35;padding:1.8mm 1.6mm}.radv-pg .radv-tb th,.radv-pg .radv-tb td{border-width:.5pt}",
      ".radv-pg .radv-tb colgroup col:nth-child(1){width:6%!important}.radv-pg .radv-tb colgroup col:nth-child(2){width:22%!important}.radv-pg .radv-tb colgroup col:nth-child(3){width:17%!important}.radv-pg .radv-tb colgroup col:nth-child(4){width:31%!important}.radv-pg .radv-tb colgroup col:nth-child(5){width:24%!important}",
      ".radv-pg .radv-tot td{font-size:9pt;font-weight:700}",
      ".radv-pg .radv-sum{gap:3.5mm;margin-top:4.2mm}.radv-pg .radv-pay{padding:3mm 3.4mm;font-size:8.3pt;line-height:1.5}",
      ".radv-pg .radv-amt{padding:0}.radv-pg .radv-a1{padding:2.1mm 3.4mm;font-size:8.8pt}.radv-pg .radv-a2{padding:2.6mm 3.4mm;font-size:9.6pt;font-weight:700}",
      ".radv-pg .radv-sign{gap:3.5mm;margin-top:4.2mm}.radv-pg .radv-sign .radv-box{padding:3mm 3.4mm;font-size:8pt;min-height:35mm}.radv-pg .radv-st{font-size:8pt}.radv-pg .radv-for{font-size:8pt}",
      ".radv-pg .radv-sp{height:12.5mm}.radv-pg .radv-sp2{height:8.5mm}.radv-pg .radv-sc{margin:1mm 0 2.2mm}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}
export{RF788 as RF814, RL788 as RL814, ST788 as ST814};
/* ═══ V.836 (RUN-836) · FINANCE → ADVANCE : แถบย่อย "ระบบใหม่ (ACCOUNTING) | ระบบเก่า (UPLOAD EXCEL)" บนแถบรอรับชำระ / ใบเสร็จที่ออกแล้ว
   ระบบใหม่ = หน้าเดิมทุกอย่าง (njacc_charge_page_bundle / RECEIPT ADVANCE เดิม) · ระบบเก่า = แผง #radv836 (adv-legacy-L836.js · ตาราง / RPC แยก RUN-836)
   ปุ่ม ⬆ UPLOAD EXCEL (สีส้ม · SUPER_ADMIN · Server ตรวจซ้ำ) ต่อจาก EXPORT EXCEL / RECEIPT ADVANCE PDF · ไม่แก้ Template / สูตร / เลขเอกสารเดิม ═══ */
var SRC836 = "acc";
function SS836() {   /* สไตล์แถบย่อย / ปุ่ม (ก่อนโหลดโมดูล) */
  if (document.getElementById("st836c")) return;
  let s = document.createElement("style"); s.id = "st836c";
  s.textContent = ".hd836{display:none!important}.l836-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 4px;font-size:13px}.l836-sw>span{font-weight:700;color:#475569}"
    + ".l836-sw button{border:1px solid #cbd5e1;background:#fff;color:#0f2a4d;border-radius:999px;padding:5px 14px;font-weight:700;cursor:pointer;font-size:13px}.l836-sw button.on{background:#0f2a4d;color:#fff;border-color:#0f2a4d}"
    + ".btn.up836{background:#ea580c!important;border:1px solid #ea580c!important;color:#fff!important;font-weight:700;white-space:nowrap}@media (max-width:640px){.l836-sw button{flex:1 1 0}}";
  document.head.appendChild(s);
}
function SW836() {
  SS836();
  return '<div class="l836-sw" id="l836-sw" role="tablist"><span>ข้อมูล :</span>' + [["acc", "ระบบใหม่ (ACCOUNTING)"], ["xls", "ระบบเก่า (UPLOAD EXCEL)"]].map(([k, l]) =>
    `<button type="button" role="tab" data-src836="${k}" class="${k === SRC836 ? "on" : ""}" aria-selected="${k === SRC836}">${l}</button>`).join("") + "</div>";
}
function RP836() { return '<div id="radv836" class="p836" hidden></div>'; }
function UB836() { SS836(); return String(x.profile && x.profile.role) === "SUPER_ADMIN" ? '<button type="button" class="btn btn-sm up836" data-up836 style="background:#ea580c;border:1px solid #ea580c;color:#fff;font-weight:700" title="UPLOAD EXCEL — ADVANCE ระบบเก่า (.xlsx / .xls · หลายไฟล์ · SUPER_ADMIN)">⬆ UPLOAD EXCEL</button>' : ""; }
function DP836() { return { RF788, RW788, RX788, SVH791, IS790, ST788, PM788, ST850, P850, MQ850, FB850, RH850 }; }   /* V.850 */
function VH836(t, d, g) {   /* เรียกจากต้น h() ของหน้า FINANCE — ADVANCE : ระบบเก่า = แสดงแผง #radv836 (คืน true = ไม่โหลดตาราง JOB เดิม) · ระบบใหม่ = คืน false (FLOW เดิม) */
  let p = t && t.querySelector("#radv836"); if (!p) return !1;
  let on = SRC836 === "xls";
  on && p.querySelectorAll(".hd811").forEach((e) => e.classList.remove("hd811"));   /* V.885 : ล้างสถานะซ่อนที่ค้างจากระบบใหม่ (กันหน้าว่าง) */
  t.querySelectorAll(".bn850").forEach((e) => e.classList.toggle("hd836", on && TV789(d) === "issued"));   /* V.881 : ซ่อนหัวข้อ "รายการใบเสร็จรับเงินล่วงหน้า (ADVANCE)" เฉพาะ ใบเสร็จที่ออกแล้ว · ระบบเก่า */
  p.hidden = !on; t.querySelectorAll("#ch-kpi,.ch-panel,#radv811").forEach((e) => { p.contains(e) || e.classList.toggle("hd836", on); });
  t.querySelectorAll("[data-src836]").forEach((b) => { let k = b.dataset.src836 === SRC836; b.classList.toggle("on", k); b.setAttribute("aria-selected", k); });
  if (!t.__b836) {
    t.__b836 = 1;
    t.addEventListener("click", (ev) => {
      let b = ev.target.closest && ev.target.closest("[data-src836],[data-up836]"); if (!b || !t.contains(b)) return;
      ev.preventDefault();
      if (b.dataset.src836) { if (SRC836 === b.dataset.src836) return; SRC836 = b.dataset.src836; if (RZ884(t)) return;   /* V.884 : เปลี่ยนระบบ = ล้างตัวกรองทุกช่อง แล้วโหลดใหม่ */ let c = t.__ctx789; c && c.refresh ? c.refresh() : VH836(t, c && c.state || d, g); return; }
      if (String(x.profile && x.profile.role) !== "SUPER_ADMIN") { y("UPLOAD EXCEL ได้เฉพาะ SUPER_ADMIN", "err"); return; }
      let inp = document.createElement("input"); inp.type = "file"; inp.multiple = !0; inp.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
      inp.onchange = async () => { let fs = [...(inp.files || [])]; if (!fs.length) return;
        if (SRC836 !== "xls") { SRC836 = "xls"; let c = t.__ctx789; c && c.refresh ? c.refresh() : VH836(t, c && c.state || d, g); }
        try { let m = await import("./adv-legacy-L836.js"); await m.upload836(fs, {}); } catch (e) { y("UPLOAD EXCEL ไม่สำเร็จ — " + (e && e.message || e), "err"); } };
      inp.click();
    });
  }
  if (!on) return !1;
  import("./adv-legacy-L836.js").then((m) => p.isConnected && m.mount836(p, { tab: TV789(d), group: g, deps: DP836() })).catch((e) => { p.innerHTML = '<div class="card empty">โหลดหน้าระบบเก่าไม่สำเร็จ — ' + n(String(e && e.message || e)) + "</div>"; });
  return !0;
}
   /* V.814 (RUN-818) : ให้ FINANCE → RECEIPT ใช้ Template / Loader RECEIPT ADVANCE เดิม (อ่านอย่างเดียว) */
/* ═══ V.880 · ระบบค้นหา DOCUMENT → SERVICE / ADVANCE · ACCOUNTING → SERVICE / ADVANCE · FINANCE → ADVANCE (รอรับชำระ) : COMPANY + CUSTOMER เป็นตัวกรองหลัก
   ตัวเลือกทุก Dropdown = "รายการจริงของโหมด + แท็บปัจจุบัน" (njacc_charge_facets880 · RUN-880 · อ่านอย่างเดียว · ครบทุกหน้า ไม่ใช่เฉพาะแถวที่แสดง · ในขอบเขตสิทธิ์เดิม)
   · เลือกบริษัท → ลูกค้า / ประเภท / สมาชิก เฉพาะที่มีรายการของบริษัทนั้น · เลือกลูกค้าก่อน → บริษัทเฉพาะของลูกค้านั้น · จับคู่ด้วย ID (ชื่อซ้ำ = 1 รายการ · ทุก ID)
   · เปลี่ยนแท็บ / Refresh / ล้างตัวกรอง = คำนวณตัวเลือกใหม่ · ค่าที่เลือกไว้แต่ไม่มีรายการรองรับ = ล้างเฉพาะค่านั้น (บริษัท → ลูกค้า → ประเภท) · ตัวกรองสมาชิกไม่ถูกล้างเอง
   · ผลของแท็บก่อนหน้าไม่ทับแท็บใหม่ (key ต่อ ผู้ใช้ + โหมด + แท็บ) · RPC ยังไม่พร้อม (ยังไม่รัน RUN-880) = รายชื่อเดิม (njacc_charge_company_options / customer_options) ═══ */
var FE880 = null, FC880 = new Map();
try { let st880 = () => FC880.forEach((c) => { c.at = 0; }); window.addEventListener("njacc:rpc-write", st880); window.addEventListener(G, st880); } catch (e) {}
function FL880(v) { return String(v == null ? "" : v).split(",").filter(Boolean); }
function FG880(list) {   /* ชื่อซ้ำ = 1 รายการ (ทุก ID) */
  let mp = new Map();
  (Array.isArray(list) ? list : []).forEach((c) => {
    let nm = String((c && (c.name || c.code)) || "").replace(/\s+/g, " ").trim(), k = nm.toUpperCase(); if (!c || !c.id || !nm) return;
    let g = mp.get(k); g ? (g.ids.push(String(c.id)), c.active !== !1 && (g.off = !1)) : mp.set(k, { t: nm, ids: [String(c.id)], off: c.active === !1 });
  });
  return [...mp.values()].sort((a, b) => a.t.localeCompare(b.t, "th")).map((g) => ((g.v = g.ids.join(",")), g));
}
function FQ880(D, S) {   /* ค่าที่มีรายการจริงของแต่ละช่อง ภายใต้ค่าที่เลือกของช่องอื่น */
  let R = { co: new Set(), cu: new Set(), cat: new Set(), us: new Set() };
  (D.rows || []).forEach((w) => {
    let a = !S.co || (w[0] >= 0 && S.co.has(D.co[w[0]])), b = !S.cu || (w[1] >= 0 && S.cu.has(D.cu[w[1]])), c = !S.cat || (w[2] >= 0 && D.ca[w[2]] === S.cat), u = !S.u || (w[3] >= 0 && S.u(D.us[w[3]], D.ud[w[3]]));
    b && c && u && w[0] >= 0 && R.co.add(D.co[w[0]]); a && c && u && w[1] >= 0 && R.cu.add(D.cu[w[1]]); a && b && u && w[2] >= 0 && R.cat.add(D.ca[w[2]]); a && b && c && w[3] >= 0 && R.us.add(D.us[w[3]]);
  });
  return R;
}
function FX880(t, cx) {
  try {
    let o = cx.o; if (o !== "accounting" && o !== "document" && o !== "advance") return 0;   /* advance = FINANCE → ADVANCE (รอรับชำระ) : Dropdown ลูกค้า */
    let tp = { charge_type: cx.e, company_group: cx.a, queue: cx.q || null, scope: cx.A || null, doc_state: o === "document" && (cx.d.accq === "wait" || cx.d.accq === "posted") ? cx.d.accq : null, radv789: o === "advance" ? TV789(cx.d) : null };
    let key = String((x.profile && x.profile.id) || "") + "|" + JSON.stringify(tp), E = t.__fx880 || (t.__fx880 = { t });
    E.d = cx.d; E.o = o; E.e = cx.e; E.a = cx.a; E.h = cx.h; E.q = cx.q || "acc_active"; E.svc = o === "accounting" && cx.e === "SERVICE"; FE880 = E;
    let ck = "cu|" + E.e + "|" + E.a + "|" + E.q;
    if (E.key !== key) { E.key = key; E.D = null; E.R = null; E.cats = null; E.rest = !1; delete CC523[E.q]; if (E.svc) { delete CU804C[ck]; delete CU804S[ck]; } }
    let c = FC880.get(key), now = Date.now();
    c && c.D && (E.D = c.D);
    if (!c || (!c.p && now - c.at > 18e4)) {   /* V.895 : อายุแคชตัวเลือกตัวกรอง 20 วินาที -> 3 นาที (ล้างทันทีเมื่อบันทึก/แก้ไข · Refresh · ล้างตัวกรอง) */
      c || FC880.set(key, (c = {})); c.at = now; FC880.size > 40 && FC880.delete(FC880.keys().next().value);
      let c0 = c;
      c.p = RPC499("njacc_charge_facets880", { p: tp }).then((D) => {
        if (!D || !Array.isArray(D.rows)) throw new Error("facets880");
        c0.p = null; c0.D = D; c0.at = Date.now(); c0.fail = 0;
        if (E.key === key && FE880 === E && t.isConnected) { E.D = D; E.fail = !1; FA880(E) && ((E.d.page = 1), E.h()); }
      }).catch((er) => { c0.p = null; c0.fail = 1; c0.at = Date.now(); E.key === key && (E.fail = !c0.D); });
    }
    E.w = c.p || null; E.fail = !!(c.fail && !c.D);
    if (E.D) return FA880(E) ? 1 : 0;
  } catch (er) { try { console.warn("FX880", er); } catch (_) {} }
  return 0;
}
function FW880(r) { let E = FE880; return E && !E.fail && r && E.t.contains(r) ? (E.D ? Promise.resolve() : E.w || null) : null; }
function FT880(t, orig) { let E = t && t.__fx880; return E && E.D && E.cats && FE880 === E ? E.cats : orig; }
function FU880(r, id, on) { let E = FE880; return !E || !E.D || !E.rest || !E.R || !E.t.contains(r) || !!on || E.R.us.has(String(id)); }
function FM880(r, L) {   /* สมาชิก : หัวข้อแผนกที่ไม่เหลือสมาชิก = ไม่แสดง (เฉพาะเมื่อเลือก บริษัท / ลูกค้า / ประเภท) */
  let E = FE880; if (!E || !E.D || !E.rest || !E.t.contains(r)) return L;
  let out = [], hd = [];
  L.forEach((o) => { if (o.h || String(o.v || "").indexOf("d:") === 0) { hd = [o]; return; } hd.length && (out.push(hd[0]), (hd = [])); out.push(o); });
  return out;
}
function FZ880(t, c) {
  try {
    let E = t.__fx880; E && E.D && FE880 === E && FA880(E);
    ["#ch-rf828", "#ch-clear"].forEach((s) => { let b = c && c.querySelector(s); b && !b.__f880 && ((b.__f880 = 1), b.addEventListener("click", () => FC880.forEach((z) => { z.at = 0; }), !0)); });   /* Refresh / ล้างตัวกรอง = โหลดตัวเลือกใหม่ */
  } catch (e) {}
}
function FA880(E) {   /* คืน 1 = มีค่าที่เลือกไว้ถูกล้าง / ปรับ (ผู้เรียกค้นหาใหม่) */
  let D = E.D, t = E.t, f = E.d && E.d.filters, r = t.querySelector("#ch-fbar"), chg = 0;
  if (!D || !f || !r) return 0;
  try {
    if (!D.G) { D.co = (D.companies || []).map((c) => String(c.id)); D.cu = (D.customers || []).map((c) => String(c.id)); D.us = (D.users || []).map((u) => String(u.id)); D.ud = (D.users || []).map((u) => String(u.department_id || "")); D.ca = (D.cats || []).map(String); D.gco = FG880(D.companies); D.gcu = FG880(D.customers); D.G = 1; }
    let Q = (s) => r.querySelector(s), hco = Q('[data-f="company"]'), ico = Q("#ch-co523"), cel = E.svc ? Q('[data-f="cust804"]') : Q('select[data-f="customer"]'), ck = E.svc ? "cust804" : "customer", jc = Q('[data-f="job_category"]');
    let pick = (v, G, ok) => { let s = new Set(FL880(v)); if (!s.size) return ""; let g = G.find((m) => m.ids.some((i) => s.has(i))); return g && (!ok || g.ids.some((i) => ok.has(i))) ? g.v : ""; };
    /* 1) บริษัท : ต้องมีรายการจริงในแท็บนี้ */
    if (hco) { let v0 = String(f.company || ""), v1 = pick(v0, D.gco); v1 !== v0 && ((f.company = v1), (chg = 1)); hco.value !== v1 && (hco.value = v1); ico && document.activeElement !== ico && (ico.value = v1 ? (D.gco.find((g) => g.v === v1) || {}).t || "" : ""); }
    let co = hco && f.company ? new Set(FL880(f.company)) : null;
    /* 2) ลูกค้า : ต้องมีรายการจริงของบริษัทที่เลือก */
    if (cel) { let v0 = String(f[ck] || ""), v1 = pick(v0, D.gcu, FQ880(D, { co }).cu); v1 !== v0 && ((f[ck] = v1), (chg = 1)); E.svc && cel.value !== v1 && (cel.value = v1); }
    let cu = cel && f[ck] ? new Set(FL880(f[ck])) : null;
    /* 3) ประเภท : ต้องมีรายการจริงของ บริษัท + ลูกค้า ที่เลือก */
    let cat = String(f.job_category || "");
    if (cat && jc && !FQ880(D, { co, cu }).cat.has(cat)) { f.job_category = cat = ""; jc.value = ""; chg = 1; }
    let wu = new Set(FL880(f.who_u)), wd = new Set(FL880(f.who_d)), cb = String(f.created_by || ""), dp = String(f.department_id || ""), mu = wu.size + wd.size > 0;
    let u = mu || cb || dp ? (id, d) => (!cb || id === cb) && (!dp || d === dp) && (!mu || wu.has(id) || (!!d && wd.has(d))) : null;
    let R = (E.R = FQ880(D, { co, cu, cat, u }));
    E.rest = !!(co || cu || cat); E.cats = D.ca.filter((c) => R.cat.has(c));
    let keep = (G, S, cur) => G.filter((g) => g.v === cur || g.ids.some((i) => S.has(i)));
    D.gco.forEach((g) => { CN523[g.v] = g.t; });
    CC523[E.q] = [{ id: "", name: CA523 }].concat(keep(D.gco, R.co, String(f.company || "")).map((g) => ({ id: g.v, name: g.t })));
    if (E.svc) { let k = "cu|" + E.e + "|" + E.a + "|" + E.q; D.gcu.forEach((g) => { CU804N[g.v] = g.t; }); CU804C[k] = keep(D.gcu, R.cu, String(f.cust804 || "")).map((g) => ({ v: g.v, t: g.t })); CU804S[k] = 2; }
    else if (cel) {
      let h = (cel.options[0] && !cel.options[0].value ? `<option value="">${n(cel.options[0].textContent)}</option>` : '<option value="">ลูกค้าทั้งหมด</option>') + keep(D.gcu, R.cu, String(f.customer || "")).map((g) => `<option value="${n(g.v)}">${n(g.t)}${g.off ? " (ปิดใช้งาน)" : ""}</option>`).join("");
      cel.__h880 !== h && ((cel.__h880 = h), (cel.innerHTML = h)); let v = String(f.customer || ""); cel.value !== v && (cel.value = v);
    }
    /* สมาชิก / แผนก (Dropdown เดิม) : จำกัดเฉพาะเมื่อเลือก บริษัท / ลูกค้า / ประเภท — ไม่เลือก = รายชื่อเดิมทั้งหมด */
    ["created_by", "department_id"].forEach((k) => {
      let el = Q('select[data-f="' + k + '"]'); if (!el) return;
      el.__m880 == null && ((el.__m880 = el.innerHTML), (el.__c880 = el.__m880));
      let h = el.__m880, cur = String(el.value || "");
      if (E.rest) {
        let tp = document.createElement("select"); tp.innerHTML = h;
        let ok = k === "created_by" ? (v) => R.us.has(v) : (v) => D.us.some((id, i) => D.ud[i] === v && R.us.has(id));
        [...tp.querySelectorAll("option")].forEach((op) => { op.value && op.value !== cur && !ok(op.value) && op.remove(); });
        [...tp.querySelectorAll("optgroup")].forEach((g) => { g.children.length || g.remove(); }); h = tp.innerHTML;
      }
      el.__c880 !== h && ((el.__c880 = h), (el.innerHTML = h)); el.value !== cur && (el.value = cur);
    });
    chg && CF523(f);
    try { r.dispatchEvent(new CustomEvent("fx880")); } catch (e) {}
  } catch (er) { try { console.warn("FA880", er); } catch (_) {} }
  return chg;
}
/* ═══ V.884 · FINANCE → ADVANCE (รอรับชำระ / ใบเสร็จที่ออกแล้ว × ระบบใหม่ / ระบบเก่า · Desktop / Mobile)
   · ปุ่ม "⟳ รีเฟรช" สีน้ำเงินทุกแถบ แทนตำแหน่งปุ่มล้างตัวกรองเดิม — โหลดรายการ / จำนวน / ยอดรวม / Pagination ใหม่จากฐานข้อมูล คงตัวกรอง · ไม่สำเร็จ = แจ้ง คงข้อมูลเดิม · กดซ้ำไม่ได้
   · ซ่อน CS / Due Date (ไม่สร้างช่อง + ไม่ส่งค่าให้ Server) · ซ่อนปุ่ม ล้างตัวกรอง / ล้างค้นหา (display:none — ไม่เว้นที่ว่าง)
   · สลับ รอรับชำระ ↔ ใบเสร็จที่ออกแล้ว / ระบบใหม่ ↔ ระบบเก่า / เข้าหน้าจากเมนูอื่น = ล้างตัวกรองทุกช่องทุกแผง (หน้าจอ + ค่าที่ส่งค้นหา) + หน้า 1 แล้วโหลดใหม่
     รีเฟรช / เปลี่ยนหน้า / เปิดรายการ-พิมพ์-แก้ไข แล้วกลับตารางเดิม = คงตัวกรอง ═══ */
function ST884() {
  if (document.getElementById("st884")) return; let s = document.createElement("style"); s.id = "st884";
  s.textContent = ".nsv864 #ch-clear,.nsv864 #radv811-clr,.nsv864 [data-clr836],.nsv864 [data-iclr836]{display:none!important}"
    + ".btn.rf884,.nsv864 .btn.rf881{background:#2563EB!important;border:1px solid #2563EB!important;color:#fff!important;font-weight:700;white-space:nowrap;border-radius:8px}.btn.rf884:hover:not(:disabled){background:#1D4ED8!important;border-color:#1D4ED8!important}.btn.rf884:disabled{opacity:.7;cursor:progress}";
  document.head.appendChild(s);
}
function HX884(t, r, f) {
  try {
    ST884(); t.classList.add("nsv864");
    ["cs", "due"].forEach((k) => { f && (f[k] = ""); r && r.querySelectorAll('[data-f="' + k + '"]').forEach((el) => { let w = el.closest(".u762-f"); (w && r.contains(w) ? w : el).remove(); }); });
  } catch (e) {}
}
async function RB884(b, fn) {
  if (!b || b.disabled) return; let t0 = b.textContent; b.disabled = !0; b.setAttribute("aria-busy", "true"); b.textContent = "กำลังรีเฟรช…";
  try { await fn(); } catch (e) { try { y("รีเฟรชไม่สำเร็จ — " + (e && e.message || e), "err"); } catch (_) {} }
  finally { b.disabled = !1; b.removeAttribute("aria-busy"); b.textContent = t0; }
}
function RS884() {   /* ล้างค่าตัวกรองของแผงใบเสร็จที่ออกแล้ว (ระบบใหม่) + แผงระบบเก่า */
  Object.assign(S811, { q: "", from: "", to: "", cust850: "", comp850: "", page: 1 });
  try { document.querySelectorAll("#radv811 [data-a811]").forEach((e) => { e.value = ""; }); } catch (e) {}
  try { let p = document.querySelector("#radv811"); p && p.querySelector("[data-a811=cust850]") && !MQ850() && OP850("acc", p, "data-a811"); } catch (e) {}
  return import("./adv-legacy-L836.js").then((m) => m.reset884 && m.reset884()).catch(() => {});
}
function RZ884(t) {   /* true = ล้างแล้วสั่งโหลดใหม่แล้ว (ผ่านกลไกล้างตัวกรองเดิม #ch-clear : ล้าง d.filters + วาดแถบค้นหาใหม่ + หน้า 1 + โหลด) */
  try { RS884(); let b = t && t.querySelector("#ch-clear"); if (!b) return !1; b.click(); return !0; } catch (e) { return !1; }
}
/* ═══ V.886 / V.887 / V.888 · ACCOUNTING → SERVICE : รวมหลาย JOB เป็น INVOICE NJ เดียว (RUN-886 + RUN-887)
   · ป้ายสถานะในหน้ารายการ : "รอรวมวางบิล" · "รอ POST รวม" · "INVOICE รวม N JOB" / "รวมใน NJL…" — อ่านจาก njacc_mrg886_flags ของแถวที่แสดง
   · ปุ่ม "รวมออก INVOICE เดียว" → เลือก JOB รอรวม (ครบทุกหน้า) → Preview (รวมรายการที่ Server) → POST = INVOICE NJ เลขเดียวจากเลขรันเดิม (njacc_mrg886_post)
   · แท็บ "INVOICE รวมที่ออกแล้ว" + หน้ารายละเอียดใบรวม : EXPORT EXCEL DETAILS (2 Sheet) / DSV / CSV · ยกเลิกการรวม (หลัง UNPOST) · VOID ใช้ปุ่มเดิม
   · V.888 : แท็บ "รวม INVOICE" (สีส้ม) ต่อจาก "POST แล้ว" — แสดงเต็มพื้นที่หน้า ACCOUNTING → SERVICE ไม่ใช้ Popup · 2 แท็บย่อย (JOB รอรวมวางบิล / INVOICE รวมที่ออกแล้ว)
   · V.888 : เพิ่ม JOB เข้ารายการรอรวมได้จากแท็บนี้โดยตรง (ร่างที่พร้อมรวม) · EXPORT EXCEL / DSV / CSV ของชุดที่เลือกได้ตั้งแต่ก่อน POST (ระบุ DRAFT)
   · POST ปกติ / ออกหลายใบ / พิมพ์ / EXCEL SOA เดิม ไม่ถูกแตะ · ยังไม่รัน RUN-886 / RUN-887 = แจ้งว่าฐานข้อมูลยังไม่พร้อม หน้ารายการทำงานตามเดิม ═══ */
function ST886() {
  if (document.getElementById("st886")) return; let s = document.createElement("style"); s.id = "st886";
  s.textContent = ".ch-tools.acc500>.ch-bulk .ch-bulk-acts #ch-mrg886,#ch-mrg886{height:34px;min-height:34px;padding:0 14px;border-radius:8px;border:1px solid #ea580c;background:#ea580c;color:#fff;font-size:13px;font-weight:600;line-height:1;gap:6px;box-shadow:0 1px 2px rgba(15,23,42,.12);white-space:nowrap}#ch-mrg886:hover{background:#c2410c;border-color:#c2410c}"
    + ".b886{display:inline-block;margin:2px 0 0 6px;padding:1px 8px;border-radius:999px;background:#ea580c;color:#fff;font-size:11px;font-weight:700;white-space:nowrap;vertical-align:middle}"
    + ".mg886 .mg886-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}.mg886 .mg886-bar label{display:flex;flex-direction:column;gap:2px;font-size:12px;color:#475569;font-weight:600}.mg886 .mg886-bar .inp,.mg886 .mg886-bar .sel{min-width:150px;height:34px}"
    + ".mg886 .mg886-wrap{max-height:52vh;overflow:auto;border:1px solid #e2e8f0;border-radius:8px}.mg886 table{width:100%;border-collapse:collapse;font-size:13px}.mg886 th{position:sticky;top:0;background:#1e3a8a;color:#fff;padding:7px 8px;text-align:left;white-space:nowrap;z-index:1}.mg886 td{padding:6px 8px;border-top:1px solid #eef2f7;vertical-align:middle}.mg886 td.r,.mg886 th.r{text-align:right}.mg886 td.c,.mg886 th.c{text-align:center}.mg886 tr.on td{background:#fff7ed}"
    + ".mg886 .st886{display:inline-block;padding:1px 8px;border-radius:999px;background:#ea580c;color:#fff;font-size:11px;font-weight:700}.mg886 .sub886{display:block;font-size:11px;color:#64748b}.mg886 .err886{margin:0 0 8px;padding:8px 12px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:13px}.mg886 .err886 li{margin-left:18px}"
    + ".mg886 .hd886{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px 18px;padding:10px 12px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:8px;margin-bottom:10px;font-size:13px}.mg886 .hd886 b{color:#1e3a8a}.mg886 .hd886 .inp{height:32px;width:100%}.mg886 .jobs886{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:4px}.mg886 .jobs886 span{padding:1px 8px;border-radius:999px;background:#dbeafe;color:#1e3a8a;font-size:12px;font-weight:600}"
    + ".mg886 .tot886{margin:10px 0 0 auto;width:min(380px,100%);font-size:13px}.mg886 .tot886 div{display:flex;justify-content:space-between;padding:3px 0}.mg886 .tot886 .g{border-top:2px solid #1e3a8a;margin-top:4px;padding-top:6px;font-weight:800;font-size:15px;color:#1e3a8a}.mg886 details{margin-top:10px}.mg886 details summary{cursor:pointer;font-weight:700;color:#1e3a8a}"
    + ".mg886-f{display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%}.mg886-f .sum886{margin-right:auto;font-size:13px;font-weight:700;color:#1e3a8a}.mg886-f .btn-or{background:#ea580c;border:1px solid #ea580c;color:#fff;font-weight:700}.mg886-f .btn-or:disabled{opacity:.5;cursor:not-allowed}.mg886 .note886{margin-top:10px;padding:8px 12px;border:1px dashed #fdba74;background:#fff7ed;color:#9a3412;border-radius:8px;font-size:12.5px}"
    + ".b886.g{background:#15803d;cursor:pointer}.b886.d{background:#fff;color:#c2410c;border:1px solid #ea580c;cursor:pointer}tr.m886>td{background:#f8fafc}tr.m886{cursor:pointer}.mg886 .tabs886{display:flex;gap:6px;margin-bottom:10px;border-bottom:2px solid #e2e8f0}.mg886 .tabs886 button{border:0;background:none;padding:8px 14px;font-weight:700;color:#64748b;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px}.mg886 .tabs886 button.on{color:#c2410c;border-bottom-color:#ea580c}"
    + ".mg886 .ok886{padding:18px;border:1px solid #86efac;background:#f0fdf4;border-radius:10px;text-align:center;font-size:14px}.mg886 .ok886 .no{display:block;font-size:26px;font-weight:800;color:#15803d;margin:6px 0}.mg886 .stt{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:#15803d}.mg886 .stt.DRAFT{background:#ea580c}.mg886 .stt.ENDED,.mg886 .stt.VOID{background:#94a3b8}.mg886 .warn886{margin:8px 0;padding:8px 12px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:8px;font-size:12.5px}.mg886-f .btn-xl{background:#15803d;border:1px solid #15803d;color:#fff;font-weight:700}.mg886-f .btn-xl:disabled{opacity:.5}"
    + ".bn886{margin:0 0 10px;padding:9px 12px;border:1px solid #fdba74;background:#fff7ed;color:#9a3412;border-radius:8px;font-size:13px;font-weight:600}"
    + "#acc499-tabs{flex-wrap:wrap}.rep-tab[data-accq='mrg886']{--bg533:#EDE9FE;--b533:#C4B5FD;--fg533:#6D28D9;--on533:#6D28D9}/* V.892 : Tab รวม INVOICE — พื้นหลังม่วงอ่อน · ตัวอักษรม่วงเข้ม · ตัวเลขในกรอบขาว · ขนาด/ความสูง/ความโค้ง/ระยะห่าง/Active ใช้กฎเดียวกับแท็บสถานะอื่น */"
    + ".mg888-pg{margin:10px 0 0}.mg888-pg .mg888-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border:1px solid #fdba74;border-bottom:0;background:#fff7ed;border-radius:10px 10px 0 0;color:#9a3412;font-weight:800;font-size:14px}"
    + ".mg888-pg .mg886{padding:14px 16px;border:1px solid #e2e8f0;border-top:1px solid #fdba74;background:#fff}.mg888-pg .mg886-f{padding:10px 16px 14px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 10px 10px;background:#f8fafc}"
    + ".mg888-pg .mg886 .mg886-wrap{max-height:none}.mg888-pg .mg886 table{min-width:860px}.mg888-pg .mg886 .hd886{max-width:100%}"
    + ".mg886 .pool888{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.mg886 .pool888 button{border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:999px;padding:5px 14px;font-size:12.5px;font-weight:700;cursor:pointer}.mg886 .pool888 button.on{background:#ea580c;border-color:#ea580c;color:#fff}"
    + ".mg886 .st888{display:inline-block;padding:1px 8px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:700}"
    + "@media(max-width:640px){.mg888-pg .mg886,.mg888-pg .mg886-f,.mg888-pg .mg888-hd{padding-left:10px;padding-right:10px}}"
    + "@media(max-width:640px){.mg886 .mg886-bar .inp,.mg886 .mg886-bar .sel{min-width:0;width:100%}.mg886 .mg886-bar label{flex:1 1 46%}}";
  document.head.appendChild(s);
}
var M886 = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var DT886 = (v) => { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; };
var NR886 = (e) => /njacc_mrg886_/.test(String(e && e.message || "")) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(String(e && e.message || ""));
var G886 = (window.__mrg886 = window.__mrg886 || {});   /* เลข INVOICE รวม → { customer_job_no, job_count } : ใช้ตอนพิมพ์ PDF ของใบรวม */
var R2886 = (v) => Math.round((Number(v) || 0) * 100) / 100;
function GO896(t, cx) {   /* V.896 : รวมออก INVOICE จาก JOB ที่ "ติ๊กเลือก" ในแท็บ "รวม INVOICE" เท่านั้น — ใช้ PREVIEW / POST ชุดเดิมทั้งหมด */
  let ids = [...new Set([...t.querySelectorAll("#ch-tbody input[data-cb]:checked")].filter((c) => !c.disabled).map((c) => c.dataset.id).filter(Boolean))];
  if (!ids.length) { y("ยังไม่ได้ติ๊กเลือก JOB — ติ๊กเลือกรายการที่ต้องการรวมก่อน", "err"); return; }
  if (ids.length < 2) { y("ต้องติ๊กเลือกอย่างน้อย 2 JOB เพื่อออก INVOICE รวม 1 เลข", "err"); return; }
  MG886(t, Object.assign({}, cx, { pre: ids, go896: 1 }));   /* ไม่ส่ง host = ใช้หน้าต่าง PREVIEW เดิม ไม่เปลี่ยนหน้ารายการ */
}
function UP896(t, q) {   /* V.896 : ปรับปุ่มเดิมให้แสดงจำนวน JOB ที่ติ๊กเลือกจริง (เฉพาะแท็บ "รวม INVOICE") */
  let b = t.querySelector("#ch-mrg886"); if (!b) return;
  if (q !== "mrg886") {
    if (b.dataset.m896) { delete b.dataset.m896; b.disabled = !1; b.textContent = "🧾 รวมออก INVOICE เดียว"; b.title = "เลือก JOB ที่รอรวมวางบิลหลายรายการ → ตรวจและรวมเป็น INVOICE เดียว"; }
    return;
  }
  let k = [...t.querySelectorAll("#ch-tbody input[data-cb]:checked")].filter((c) => !c.disabled).length;
  b.dataset.m896 = "1"; b.disabled = k < 1;
  b.textContent = "🧾 รวมออก INVOICE (" + k.toLocaleString("th-TH") + ")";
  b.title = k < 1 ? "ติ๊กเลือก JOB ที่ต้องการรวม แล้วกดปุ่มนี้ — ถ้าไม่ติ๊กเลือก จะไม่เริ่มกระบวนการรวม" : "ตรวจและรวม " + k.toLocaleString("th-TH") + " JOB ที่ติ๊กเลือก → PREVIEW เดิม → POST เดิม = INVOICE รวม 1 เลข";
}
function BD886(t, charge, mode, cx) {   /* ป้ายสถานะในหน้ารายการ (เฉพาะ ACCOUNTING → SERVICE) */
  if (mode !== "accounting" || charge !== "SERVICE") return; ST886();
  let tb = t.querySelector("#ch-tbody"); if (!tb || tb.__b886) return; tb.__b886 = 1;
  let tm = 0, seq = 0, off = !1;
  let run = async () => {
    if (off || !tb.isConnected) return; let my = ++seq;
    let ids = [...tb.querySelectorAll("tr[data-row]")].map((r) => r.dataset.row).filter(Boolean);
    if (!ids.length) return;
    let L; try { L = await RPC499("njacc_mrg886_flags", { p: { job_ids: ids } }); } catch (e) { NR886(e) && (off = !0); return; }
    if (my !== seq || !tb.isConnected) return;
    let mp = new Map((Array.isArray(L) ? L : []).map((x) => [String(x.job_id), x]));
    mo.disconnect();
    try {
      let Q896 = (cx && typeof cx.q896 === "function" ? cx.q896() : "") === "mrg886";   /* V.896 */
      tb.querySelectorAll(".b886").forEach((e) => e.remove());
      tb.querySelectorAll("tr[data-row]").forEach((r) => {
        let x = mp.get(r.dataset.row), g = x && x.mrg, w = !!x && !g && x.waiting !== !1, mem = !!g && !g.is_lead;
        r.classList.toggle("w886", w); r.classList.toggle("g886", !!g); r.classList.toggle("m886", mem);
        g ? (r.dataset.mrg = g.mrg_id) : delete r.dataset.mrg;
        let ck = r.querySelector('input[type="checkbox"]');
        if (ck) { if (mem) { ck.disabled = !0; ck.dataset.d886 = "1"; ck.title = "JOB นี้รวมอยู่ใน INVOICE รวม — ทำรายการที่ JOB หลัก " + (g.lead_job_no || ""); } else if (ck.dataset.d886) { ck.disabled = !1; delete ck.dataset.d886; ck.title = ""; } }
        if (!x) return;
        let td = [...r.children].find((c) => !c.querySelector('input[type="checkbox"]') && c.textContent.trim()) || r.children[1] || r.children[0]; if (!td) return;
        let b = document.createElement("span"); b.className = "b886";
        if (g) {
          let dr = g.status === "DRAFT"; b.className += dr ? " d" : " g"; b.dataset.mrg = g.mrg_id;
          b.textContent = dr ? "รอ POST รวม · " + g.job_count + " JOB" : g.is_lead ? "INVOICE รวม " + g.job_count + " JOB" : "รวมใน " + (g.invoice_no || "INVOICE รวม");
          b.title = (dr ? "INVOICE รวมนี้ถูก UNPOST กลับเป็นร่าง — รอ POST รวมอีกครั้ง หรือยกเลิกการรวม" : "ออก INVOICE แล้ว — INVOICE รวม " + (g.invoice_no || "")) + " · " + g.job_count + " JOB · JOB หลัก " + (g.lead_job_no || "") + " · คลิกเพื่อดูรายละเอียด / EXPORT";
          g.invoice_no && (G886[g.invoice_no] = { customer_job_no: g.customer_job_no || "", job_count: g.job_count, lead_job_no: g.lead_job_no || "" });
        } else if (w) { if (Q896) return;   /* V.896 : แท็บ "รวม INVOICE" แยกสถานะด้วยแท็บอยู่แล้ว — ซ่อนเฉพาะการแสดงผล ไม่แตะสถานะในฐานข้อมูล */ b.textContent = "รอรวมวางบิล"; b.title = "รอรวมวางบิล — บันทึกเมื่อ " + DT886(x.marked_at) + (x.marked_by_name ? " โดย " + x.marked_by_name : "") + " · ยังไม่ออก INVOICE"; }
        else return;
        td.appendChild(b);
      });
    } finally { mo.observe(tb, { childList: !0 }); }
  };
  let mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(run, 60); });
  mo.observe(tb, { childList: !0 }); run();
  /* JOB ย่อยของใบรวม : ทุกการคลิกในแถว (ยกเว้นช่องเลือก) = เปิดรายละเอียดใบรวม — ไม่เปิดหน้าต่าง INVOICE แยกของ JOB · ป้ายใบรวมของ JOB หลักคลิกได้เช่นกัน */
  tb.addEventListener("click", (ev) => {
    let bd = ev.target.closest && ev.target.closest(".b886[data-mrg]"), tr = ev.target.closest && ev.target.closest("tr.m886");
    if (!bd && !tr) return; if (!bd && ev.target.closest('input[type="checkbox"]')) return;
    ev.preventDefault(); ev.stopPropagation(); MV886(t, cx || {}, { mrg_id: bd ? bd.dataset.mrg : tr.dataset.mrg });
  }, !0);
}
/* ───────── EXPORT : EXCEL DETAILS (2 Sheet) / DSV / CSV ───────── */
function XM886(d) {   /* แบบจำลองข้อมูลจากรายการที่เก็บไว้ตอน POST : 1 JOB = 1 แถว SUMMARY · ทุกบรรทัดค่าบริการ = 1 แถว DETAILS */
  let nz = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim(), iv = d.invoice || {}, inv = iv.invoice_no || "", date = iv.invoice_date || "";
  let cols = [], ix = new Map();
  (d.jobs || []).forEach((j) => (j.items || []).forEach((it) => { let k = nz(it.description).toUpperCase(); ix.has(k) || (ix.set(k, cols.length), cols.push(nz(it.description))); }));
  let ty = (v) => { let s = nz(v).toUpperCase(); return /^IM/.test(s) ? "IMPORT" : /^EX/.test(s) ? "EXPORT" : s; };
  let sum = (d.jobs || []).map((j) => { let a = cols.map(() => 0); (j.items || []).forEach((it) => { a[ix.get(nz(it.description).toUpperCase())] += Number(it.amount || 0); }); a = a.map(R2886);
    return { job_no: j.job_no || "", inv, date, src: j.source_invoice_no || "", mbl: j.master_bl_no || "", hbl: j.house_bl_no || "", decl: j.customs_declaration_no || "", type: ty(j.data_type), port: j.import_port || "", a, tot: R2886(a.reduce((x, y) => x + y, 0)) }; });
  let det = []; (d.jobs || []).forEach((j) => { let L = (j.items || []), st = 0; L.forEach((it, i) => { let q = it.qty == null || Number(it.qty) === 0 ? 1 : Number(it.qty), am = Number(it.amount || 0); st += am;
      det.push({ first: i === 0, job_no: j.job_no || "", inv, cj: j.customer_job_no || "", date, kind: nz(it.description), info: [nz(it.code), nz(it.unit)].filter(Boolean).join(" · "), qty: q, price: it.unit_price == null ? R2886(am / q) : Number(it.unit_price), amount: am }); });
    det.push({ sub: !0, job_no: j.job_no || "", amount: R2886(st) }); });
  let colTot = cols.map((c, i) => R2886(sum.reduce((x, r) => x + r.a[i], 0))), gS = R2886(sum.reduce((x, r) => x + r.tot, 0)), gD = R2886(det.filter((r) => !r.sub).reduce((x, r) => x + r.amount, 0));
  let gI = R2886(d.active && iv.subtotal != null ? iv.subtotal : d.totals && d.totals.subtotal);
  return { inv, date, cols, sum, det, colTot, gS, gD, gI, ok: gS === gD && gD === gI && d.in_sync !== !1, n: (d.jobs || []).length, customer: d.customer_name || "", cj: d.customer_job_no || "", cur: "THB" };
}
function DL886(blob, name) { let a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 1500); }
function SV886(rows, sep) {   /* ตัวอักษรคั่น + Escape มาตรฐาน (" → "") + กัน Formula Injection (= + - @ Tab CR นำหน้าข้อความ → เติม ') · ตัวเลขส่งเป็นตัวเลขล้วน */
  let cell = (v) => { if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2) : ""; let s = String(v == null ? "" : v); /^[=+\-@\t\r]/.test(s) && (s = "'" + s); return s.includes(sep) || /["\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return "﻿" + rows.map((r) => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}
var XH886 = ["รายการ (JOB NJ)", "INVOICE NJ", "วันที่วางบิล", "INV.", "Master BL.", "House BL.", "DeclarationNo.", "Type", "ท่าที่นำเข้า"];
var XD886 = ["JOB NJ", "INVOICE NJ", "Customer Job No.", "วันที่วางบิล", "ประเภทค่าบริการ", "รายละเอียดค่าบริการ", "Quantity", "Unit Price", "Amount"];
async function XP886(d, kind) {
  let M = XM886(d); if (!M.n) { y("ไม่มีข้อมูล JOB ของ INVOICE รวมนี้", "err"); return !1; }
  let base = "SERVICE_BILLING_DETAILS_" + String(M.inv || "DRAFT").replace(/[^\w.\-]+/g, "_");
  M.ok || y("⚠ ยอดรวมไม่ตรงกัน — SUMMARY " + M886(M.gS) + " · DETAILS " + M886(M.gD) + " · INVOICE ก่อนภาษี " + M886(M.gI) + " (ตรวจสอบก่อนใช้ไฟล์)", "err");
  if (kind === "dsv" || kind === "csv") {
    let sep = kind === "dsv" ? "|" : ",", dd = DT886(M.date);
    let s1 = [XH886.concat(M.cols, ["รวมต่อ JOB (ก่อนภาษี)"])].concat(M.sum.map((r) => [r.job_no, r.inv, dd, r.src, r.mbl, r.hbl, r.decl, r.type, r.port].concat(r.a, [r.tot])), [["TOTAL (" + M.n + " JOB)", "", "", "", "", "", "", "", ""].concat(M.colTot, [M.gS])]);
    let s2 = [XD886].concat(M.det.filter((r) => !r.sub).map((r) => [r.job_no, r.inv, r.cj, dd, r.kind, r.info, r.qty, r.price, r.amount]), [["GRAND TOTAL (" + M.n + " JOB)", "", "", "", "", "", "", "", M.gD]]);
    let LD = (await import("./chunk-LAFWE2EM.js")).a; await LD("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"); if (!window.JSZip) throw new Error("โหลดตัวบีบอัด ZIP ไม่สำเร็จ");
    let z = new window.JSZip(); z.file("SERVICE_SUMMARY." + kind, SV886(s1, sep)); z.file("SERVICE_DETAILS." + kind, SV886(s2, sep));
    DL886(await z.generateAsync({ type: "blob", compression: "DEFLATE" }), base + "_" + kind.toUpperCase() + ".zip"); return !0;
  }
  let EX = await XLJ734(), wb = new EX.Workbook(); wb.creator = "BILLING NJ"; wb.created = new Date();
  let NAVY = "FF1E3A8A", TH = { style: "thin", color: { argb: "FFCBD5E1" } }, BD = { top: TH, left: TH, bottom: TH, right: TH }, FN = "Tahoma", NUM = "#,##0.00";
  let fill = (c) => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } }), dv = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(M.date || "")), dt = dv ? new Date(Date.UTC(+dv[1], +dv[2] - 1, +dv[3])) : null;
  let logo = null; try { let rs = await fetch("assets/img/nj-logo.png", { cache: "force-cache" }); rs.ok && (logo = wb.addImage({ buffer: await rs.arrayBuffer(), extension: "png" })); } catch (e) {}
  let headBlock = (ws, title, lastCol) => {   /* แถว 1–3 : โลโก้ + ชื่อบริษัท + กล่องข้อมูลใบ */
    ws.getRow(1).height = 24; ws.getRow(2).height = 20; ws.getRow(3).height = 20; ws.getRow(4).height = 8;
    logo != null && ws.addImage(logo, { tl: { col: 0.15, row: 0.15 }, ext: { width: 75, height: 62 } });
    ws.mergeCells(1, 3, 1, 5); ws.mergeCells(2, 3, 2, 5);
    let c1 = ws.getCell(1, 3); c1.value = "NJL LOGISTICS CO., LTD."; c1.font = { name: FN, size: 15, bold: !0, color: { argb: NAVY } }; c1.alignment = { vertical: "middle" };
    let c2 = ws.getCell(2, 3); c2.value = title; c2.font = { name: FN, size: 10.5, bold: !0, color: { argb: "FF0F172A" } }; c2.alignment = { vertical: "middle", shrinkToFit: !0 };
    let box = [["INVOICE NJ :", M.inv], ["Customer :", M.customer], ["Customer Job No. :", M.cj]], rt = [["วันที่วางบิล :", dt], ["จำนวน JOB :", M.n + " งาน"], ["สกุลเงิน :", M.cur]];
    box.forEach((b, i) => { let a = ws.getCell(i + 1, 6), v = ws.getCell(i + 1, 7); ws.mergeCells(i + 1, 7, i + 1, lastCol >= 9 ? 8 : 7); a.value = b[0]; v.value = b[1]; a.font = { name: FN, size: 10 }; v.font = { name: FN, size: i ? 10 : 12, bold: !0, color: { argb: i ? "FF0F172A" : "FF1D4ED8" } };
      [a, v, ws.getCell(i + 1, 8)].forEach((c) => { c.fill = fill("FFEFF6FF"); c.alignment = { vertical: "middle" }; }); });
    let rc = lastCol >= 9 ? 9 : 8;
    rt.forEach((b, i) => { let v = ws.getCell(i + 1, rc); v.value = { richText: [{ text: b[0] + " ", font: { name: FN, size: 10 } }, { text: b[1] instanceof Date ? DT886(M.date) : String(b[1]), font: { name: FN, size: 10, bold: !0 } }] }; v.fill = fill("FFEFF6FF"); v.alignment = { vertical: "middle" }; });
  };
  let hdr = (c, tx, bg, fg) => { c.value = tx; c.font = { name: FN, size: 10, bold: !0, color: { argb: fg || "FFFFFFFF" } }; c.fill = fill(bg || NAVY); c.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; c.border = BD; };
  /* Sheet 1 : SERVICE SUMMARY */
  let nc = 9 + M.cols.length + 1, ws = wb.addWorksheet("SERVICE SUMMARY", { views: [{ state: "frozen", xSplit: 9, ySplit: 5 }], pageSetup: { paperSize: 8, orientation: "landscape", fitToPage: !0, fitToWidth: 1, fitToHeight: 0, margins: { left: .3, right: .3, top: .4, bottom: .4, header: .2, footer: .2 } } });
  headBlock(ws, "รายงานรายละเอียดการวางบิล (SERVICE BILLING SUMMARY)", nc);
  let PAL = [["FF1D4ED8", "FFFFFFFF", "FFDBEAFE"], ["FFBFDBFE", "FF0F172A", "FFEFF6FF"], ["FFFDE68A", "FF0F172A", "FFFEF9C3"], ["FFE9D5FF", "FF0F172A", "FFF5F3FF"], ["FFFBCFE8", "FF0F172A", "FFFDF2F8"], ["FFBBF7D0", "FF0F172A", "FFF0FDF4"], ["FFFED7AA", "FF0F172A", "FFFFF7ED"], ["FFA5F3FC", "FF0F172A", "FFECFEFF"]];
  let W = [17, 17, 13, 16, 18, 18, 20, 10, 18];
  XH886.forEach((h, i) => { hdr(ws.getCell(5, i + 1), h.replace(" (JOB NJ)", "\n(JOB NJ)")); ws.getColumn(i + 1).width = W[i]; });
  M.cols.forEach((h, i) => { let p = PAL[i % PAL.length]; hdr(ws.getCell(5, 10 + i), h, p[0], p[1]); ws.getColumn(10 + i).width = Math.min(26, Math.max(15, Math.ceil(h.length / 2) + 4)); });
  hdr(ws.getCell(5, nc), "รวมต่อ JOB\n(ก่อนภาษี)", "FF15803D"); ws.getColumn(nc).width = 18; ws.getRow(5).height = 44;
  M.sum.forEach((r, k) => { let rw = ws.getRow(6 + k), v = [r.job_no, r.inv, dt, r.src, r.mbl, r.hbl, r.decl, r.type, r.port].concat(r.a, [r.tot]);
    v.forEach((x, i) => { let c = rw.getCell(i + 1); c.value = x == null ? "" : x; c.font = { name: FN, size: 10, bold: i === nc - 1 }; c.border = BD; c.alignment = { vertical: "middle", horizontal: i >= 9 ? "right" : i === 4 || i === 5 ? "left" : "center" };
      i === 2 && (c.numFmt = "dd/mm/yyyy"); i >= 9 && (c.numFmt = NUM); i === nc - 1 && (c.fill = fill("FFDCFCE7")); k % 2 && i < nc - 1 && (c.fill = fill("FFF8FAFC")); }); });
  let tr = 6 + M.sum.length, trw = ws.getRow(tr); ws.mergeCells(tr, 1, tr, 9); trw.height = 24;
  { let c = trw.getCell(1); c.value = "รวมทั้งหมด (" + M.n + " งาน)"; c.font = { name: FN, size: 11, bold: !0 }; c.fill = fill("FFD9F99D"); c.alignment = { vertical: "middle", horizontal: "right" }; c.border = BD; }
  M.colTot.forEach((x, i) => { let c = trw.getCell(10 + i), p = PAL[i % PAL.length]; c.value = x; c.numFmt = NUM; c.font = { name: FN, size: 11, bold: !0 }; c.fill = fill(p[2]); c.alignment = { vertical: "middle", horizontal: "right" }; c.border = BD; });
  { let c = trw.getCell(nc); c.value = M.gS; c.numFmt = NUM; c.font = { name: FN, size: 11, bold: !0, color: { argb: "FFFFFFFF" } }; c.fill = fill("FF15803D"); c.alignment = { vertical: "middle", horizontal: "right" }; c.border = BD; }
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + M.sum.length, column: nc } }; ws.pageSetup.printTitlesRow = "5:5";
  M.ok || (ws.getCell(tr + 2, 1).value = "⚠ ยอดรวมไม่ตรงกัน : SUMMARY " + M886(M.gS) + " · DETAILS " + M886(M.gD) + " · INVOICE ก่อนภาษี " + M886(M.gI), ws.getCell(tr + 2, 1).font = { name: FN, size: 10, bold: !0, color: { argb: "FFB91C1C" } });
  /* Sheet 2 : SERVICE DETAILS */
  let w2 = wb.addWorksheet("SERVICE DETAILS", { views: [{ state: "frozen", ySplit: 5 }], pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: !0, fitToWidth: 1, fitToHeight: 0, margins: { left: .3, right: .3, top: .4, bottom: .4, header: .2, footer: .2 } } });
  headBlock(w2, "รายละเอียดค่าบริการรายงาน (SERVICE DETAILS)", 9);
  [17, 17, 22, 13, 44, 24, 11, 14, 16].forEach((w, i) => { hdr(w2.getCell(5, i + 1), XD886[i]); w2.getColumn(i + 1).width = w; }); w2.getRow(5).height = 26;
  let rr = 6;
  M.det.forEach((r) => { let rw = w2.getRow(rr++);
    if (r.sub) { w2.mergeCells(rw.number, 1, rw.number, 8); let a = rw.getCell(1), b = rw.getCell(9); a.value = "Subtotal : " + r.job_no; b.value = r.amount; b.numFmt = NUM;
      [a, b].forEach((c) => { c.font = { name: FN, size: 10, bold: !0 }; c.fill = fill("FFFEF3C7"); c.alignment = { vertical: "middle", horizontal: "right" }; c.border = BD; }); return; }
    [r.first ? r.job_no : "", r.first ? r.inv : "", r.first ? r.cj : "", r.first ? dt : "", r.kind, r.info, r.qty, r.price, r.amount].forEach((x, i) => { let c = rw.getCell(i + 1); c.value = x == null ? "" : x; c.font = { name: FN, size: 10, bold: i === 0 }; c.border = BD;
      c.alignment = { vertical: "middle", horizontal: i >= 6 ? "right" : i === 4 || i === 5 ? "left" : "center", wrapText: i === 4 }; i === 3 && x && (c.numFmt = "dd/mm/yyyy"); i >= 6 && (c.numFmt = NUM); }); });
  { let rw = w2.getRow(rr); w2.mergeCells(rr, 1, rr, 8); rw.height = 24; let a = rw.getCell(1), b = rw.getCell(9); a.value = "Grand Total (" + M.n + " JOB)"; b.value = M.gD; b.numFmt = NUM;
    [a, b].forEach((c) => { c.font = { name: FN, size: 11, bold: !0, color: { argb: "FFFFFFFF" } }; c.fill = fill("FF15803D"); c.alignment = { vertical: "middle", horizontal: c === a ? "center" : "right" }; c.border = BD; }); }
  w2.pageSetup.printTitlesRow = "5:5";
  DL886(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), base + ".xlsx"); return !0;
}
async function XB886(btn, key, kind) {   /* ปุ่ม EXPORT : โหลดข้อมูลใบรวมจาก Server แล้วสร้างไฟล์ */
  if (btn.disabled) return; btn.disabled = !0; let t0 = btn.textContent; btn.textContent = "กำลังสร้างไฟล์…";
  try { let d = key.jobs ? key : await RPC499("njacc_mrg886_get", { p: key }); if (!d) { y("ไม่พบข้อมูล INVOICE รวมนี้", "err"); return; } (await XP886(d, kind)) && y("EXPORT " + (kind === "xlsx" ? "EXCEL DETAILS" : kind.toUpperCase()) + " แล้ว — " + (d.invoice && d.invoice.invoice_no || ""), "ok"); }
  catch (e) { m(e); } finally { btn.disabled = !1; btn.textContent = t0; }
}
var XF886 = '<button class="btn btn-xl" data-xp="xlsx" title="SERVICE_BILLING_DETAILS_[INVOICE NJ].xlsx — Sheet SERVICE SUMMARY + SERVICE DETAILS">⬇ EXPORT EXCEL DETAILS</button><button class="btn btn-o" data-xp="dsv" title="SERVICE_SUMMARY.dsv + SERVICE_DETAILS.dsv (คั่นด้วย | · UTF-8) ใน ZIP">EXPORT DSV</button><button class="btn btn-o" data-xp="csv" title="SERVICE_SUMMARY.csv + SERVICE_DETAILS.csv (คั่นด้วย , · UTF-8) ใน ZIP">EXPORT CSV</button>';
function EV888() { try { window.dispatchEvent(new CustomEvent("njacc:mrg888")); } catch (e) {} }   /* V.888 : แจ้งหน้าจออื่นให้โหลดรายการรอรวมใหม่ (ไม่ต้อง Refresh หน้าเว็บ) */
function XJ888(pv, doc, cj, date) {   /* V.888 : ชุดข้อมูล EXPORT ก่อน POST — ใช้ Preview (รายการรวม + รายการราย JOB) + ข้อมูลเอกสารราย JOB จากรายการที่เลือก */
  let h = pv.header || {}, T = pv.totals || {};
  return { mrg_id: null, active: !0, in_sync: !0, customer_job_no: cj || h.customer_job_no || "", job_count: h.job_count, created_at: null, created_by_name: "",
    lead_job_id: (pv.jobs[0] || {}).job_id, lead_job_no: (pv.jobs[0] || {}).job_no, customer_name: h.customer_name || "", company_name: h.company_name || "",
    invoice: { id: null, invoice_no: "DRAFT", invoice_date: date || h.invoice_date, status: "DRAFT", subtotal: T.subtotal, vat_amount: T.vat_amount, wht_amount: T.wht_amount, total_amount: T.total_amount },
    totals: T, lines: pv.lines || [],
    jobs: (pv.jobs || []).map((j, i) => Object.assign({ seq: i + 1, job_id: j.job_id, job_no: j.job_no, customer_job_no: j.customer_job_no, is_lead: i === 0, subtotal: j.subtotal,
      source_invoice_no: "", master_bl_no: "", house_bl_no: "", customs_declaration_no: "", data_type: "", import_port: "" }, doc(j.job_id) || {}, { items: j.lines || [] })) };
}
/* ───────── รายละเอียด INVOICE รวม ───────── */
function MV886(t, cx, key) {
  ST886();
  let body = document.createElement("div"); body.className = "mg886"; body.innerHTML = '<div style="padding:26px;text-align:center;color:#64748b">กำลังโหลด…</div>';
  let foot = document.createElement("div"); foot.className = "mg886-f"; foot.innerHTML = '<button class="btn btn-o" data-close>ปิด</button>';
  mt({ title: "INVOICE รวม — รายละเอียด", body, footer: foot, wide: !0, large: !0, cls: "mg886-modal" });
  let D = null;
  let draw = () => {
    let d = D, iv = d.invoice || {}, T = d.totals || {}, st = d.active ? iv.status : d.end_kind === "VOID" ? "VOID" : "ENDED", M = XM886(d);
    let stx = { POSTED: "ออก INVOICE แล้ว", DRAFT: "รอ POST รวม", VOID: "VOID แล้ว", ENDED: "ยกเลิกการรวมแล้ว" }[st] || st;
    body.innerHTML = `<div class="hd886"><div>INVOICE NJ : <b style="font-size:16px">${n(iv.invoice_no || "-")}</b> <span class="stt ${n(st)}">${n(stx)}</span></div><div>วันที่ INVOICE : <b>${DT886(iv.invoice_date)}</b></div><div>CUSTOMER : <b>${n(d.customer_name || "-")}</b></div><div>COMPANY INVOICE : <b>${n(d.company_name || "-")}</b></div>
        <div>Customer Job No. (ใบรวม) : <b>${n(d.customer_job_no || "-")}</b></div><div>จำนวน JOB : <b>${d.job_count}</b> · JOB หลัก <b>${n(d.lead_job_no || "")}</b></div><div style="grid-column:1/-1" class="sub886">รวมเมื่อ ${DT886(d.created_at)}${d.created_by_name ? " โดย " + n(d.created_by_name) : ""}${d.active ? "" : " · " + n(stx) + " เมื่อ " + DT886(d.ended_at) + (d.end_reason ? " — " + n(d.end_reason) : "")}</div></div>
      ${d.active && d.in_sync === !1 ? '<div class="err886">⚠ รายการของ INVOICE รวมถูกแก้ไขหลังรวม — ยอดไม่ตรงกับ JOB ที่รวม · ต้อง “ยกเลิกการรวม” แล้วรวมใหม่ก่อน POST</div>' : ""}${M.ok || !d.active ? "" : `<div class="err886">⚠ ยอดรวมไม่ตรงกัน — SUMMARY ${M886(M.gS)} · DETAILS ${M886(M.gD)} · INVOICE ก่อนภาษี ${M886(M.gI)}</div>`}
      <div class="mg886-wrap"><table><thead><tr><th>JOB NJ</th><th>Customer Job No.</th><th>INV.</th><th>Master BL.</th><th>House BL.</th><th>DeclarationNo.</th><th class="c">Type</th><th>ท่าที่นำเข้า</th><th class="c">รายการ</th><th class="r">รวมต่อ JOB (ก่อนภาษี)</th></tr></thead><tbody>${(d.jobs || []).map((j, i) => `<tr><td><b>${n(j.job_no || "")}</b>${j.is_lead ? ' <span class="sub886" style="display:inline">(JOB หลัก)</span>' : ""}</td><td>${n(j.customer_job_no || "")}</td><td>${n(j.source_invoice_no || "")}</td><td>${n(j.master_bl_no || "")}</td><td>${n(j.house_bl_no || "")}</td><td>${n(j.customs_declaration_no || "")}</td><td class="c">${n(M.sum[i].type)}</td><td>${n(j.import_port || "")}</td><td class="c">${(j.items || []).length}</td><td class="r"><b>${M886(M.sum[i].tot)}</b></td></tr>`).join("")}
        <tr style="background:#dcfce7;font-weight:800"><td colspan="9" class="r">รวมทั้งหมด (${d.job_count} งาน)</td><td class="r">${M886(M.gS)}</td></tr></tbody></table></div>
      <div class="tot886"><div><span>Service Amount (ก่อนภาษี)</span><b>${M886(T.subtotal)}</b></div><div><span>VAT (ฐาน ${M886(T.vat_base)})</span><b>${M886(T.vat_amount)}</b></div><div class="g"><span>Total Amount</span><span>${M886(T.total_amount)}</span></div><div><span>Withholding Tax</span><b>- ${M886(T.wht_amount)}</b></div><div><span>ยอดรับชำระ</span><b>${M886(T.net_receivable)}</b></div></div>
      <details><summary>รายการใน INVOICE รวม (${(d.lines || []).length} บรรทัด)</summary><div class="mg886-wrap" style="margin-top:6px"><table><thead><tr><th class="c">#</th><th>Description</th><th class="r">Quantity</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead><tbody>${(d.lines || []).map((l) => `<tr><td class="c">${l.line_no}</td><td>${n(l.description)}</td><td class="r">${M886(l.qty)}</td><td class="r">${M886(l.unit_price)}</td><td class="r">${M886(l.amount)}</td></tr>`).join("")}</tbody></table></div></details>
      ${d.active ? `<div class="warn886">${st === "POSTED" ? "แก้ไข / ยกเลิก INVOICE รวม : <b>UNPOST</b> ใบนี้ด้วยปุ่มเดิม (สถานะเป็น “รอ POST รวม”) แล้วกด <b>ยกเลิกการรวม</b> ที่หน้านี้ เพื่อแก้ไขราย JOB และรวมใหม่ (ใช้เลข INVOICE เดิม) · หรือ <b>VOID</b> ด้วยปุ่มเดิม = ทุก JOB กลับเป็น “รอรวมวางบิล” อัตโนมัติ" : "INVOICE รวมนี้เป็นร่าง (ถูก UNPOST) — POST ซ้ำได้จากหน้าต่าง INVOICE ของ JOB หลัก (ใช้เลขเดิม) · หรือกด <b>ยกเลิกการรวม</b> เพื่อแก้ไขราย JOB แล้วรวมใหม่"}</div>` : ""}`;
    foot.innerHTML = (cx.back ? '<button class="btn btn-o" id="mv886-back">◀ รายการ INVOICE รวม</button>' : "") + '<span class="sum886"></span>' + XF886
      + (d.active ? '<button class="btn btn-o" id="mv886-open" title="เปิดหน้าต่าง INVOICE ของ JOB หลัก (พิมพ์ PDF / POST / UNPOST ด้วยปุ่มเดิม)">เปิด INVOICE</button>' : "")
      + (d.active && st === "DRAFT" ? '<button class="btn btn-danger" id="mv886-dis" title="คืนรายการของ JOB หลัก · ทุก JOB กลับเป็น “รอรวมวางบิล” · บันทึกประวัติ">ยกเลิกการรวม</button>' : "") + '<button class="btn btn-o" data-close>ปิด</button>';
  };
  foot.addEventListener("click", async (ev) => {
    let b = ev.target.closest && ev.target.closest("button"); if (!b || b.disabled || !D) return;
    if (b.dataset.xp) { XB886(b, D, b.dataset.xp); return; }
    if (b.id === "mv886-back") { MG886(t, Object.assign({}, cx, { tab: "done", back: 0 })); return; }
    if (b.id === "mv886-open") { import("./billing-modal-WWHG6C4U.js").then((x) => x.openBillingModal({ jobId: D.lead_job_id, charge: "SERVICE", onSaved: () => cx.refresh && cx.refresh() })).catch(m); return; }
    if (b.id === "mv886-dis") { let inv = D.invoice || {};
      let rs = await tt("ยกเลิกการรวม INVOICE " + (inv.invoice_no || "") + " (" + D.job_count + " JOB) — ทุก JOB กลับเป็น “รอรวมวางบิล” (ต้องระบุเหตุผล)"); if (!rs) return;
      try { await RPC499("njacc_mrg886_dissolve", { p: { invoice_id: inv.id, reason: rs } }); y("ยกเลิกการรวมแล้ว — " + D.job_count + " JOB กลับเป็น “รอรวมวางบิล”", "ok"); EV888(); cx.refresh && cx.refresh(); } catch (e) { m(e); } }
  });
  RPC499("njacc_mrg886_get", { p: key }).then((d) => { if (!body.isConnected) return; if (!d) { body.innerHTML = '<div class="err886">ไม่พบข้อมูล INVOICE รวมนี้ (อาจถูกยกเลิกการรวมแล้ว)</div>'; return; } D = d; draw(); })
    .catch((e) => { body.isConnected && (body.innerHTML = `<div class="err886">${NR886(e) ? "ฐานข้อมูลยังไม่พร้อมสำหรับ INVOICE รวม (ต้องรัน RUN-887 ก่อน)" : "โหลดไม่สำเร็จ — " + n(String(e && e.message || e))}</div>`); });
}
function MG886(t, cx) {   /* V.888 : แสดงในแท็บ "รวม INVOICE" เต็มหน้า (cx.host) · ไม่มี host = หน้าต่างเดิม */
  ST886();
  let S = { sel: new Map(), rows: [], f: { company: "", customer: "", cjob: "", month: "", q: "" }, seq: 0, view: "pick", pv: null, cjno: "", date: "", tab: cx.tab === "done" ? "done" : "wait", ended: !1, dq: "", req: null, done: null, pool: "wait" };
  (cx.pre || []).forEach((id) => S.sel.set(String(id), null));
  let body = document.createElement("div"); body.className = "mg886";
  let foot = document.createElement("div"); foot.className = "mg886-f";
  let host = cx.host || null, B888 = host ? "◀ กลับหน้ารายการ" : "ปิด";
  if (host) { host.innerHTML = '<div class="mg888-hd"><span class="h888">รวม INVOICE</span></div>'; host.appendChild(body); host.appendChild(foot); }
  else mt({ title: "รวมออก INVOICE เดียว — เลือก JOB ที่รอรวมวางบิล", body, footer: foot, wide: !0, large: !0, cls: "mg886-modal" });
  let sum = () => { let L = [...S.sel.values()].filter(Boolean); return { n: L.length, amt: L.reduce((a, r) => a + Number(r.subtotal || 0), 0) }; };
  let XF888 = (k) => `<button class="btn btn-xl" data-xd="xlsx"${k < 2 ? " disabled" : ""} title="${k < 2 ? "เลือก JOB อย่างน้อย 2 รายการ" : "EXCEL 2 Sheet (SERVICE SUMMARY / SERVICE DETAILS) ของชุดที่เลือก — ยังไม่ออกเลข จึงระบุ DRAFT"}">⬇ EXPORT EXCEL</button><button class="btn btn-o" data-xd="dsv"${k < 2 ? " disabled" : ""} title="SUMMARY + DETAILS (คั่นด้วย | · UTF-8) ใน ZIP">EXPORT DSV</button><button class="btn btn-o" data-xd="csv"${k < 2 ? " disabled" : ""} title="SUMMARY + DETAILS (คั่นด้วย , · UTF-8) ใน ZIP">EXPORT CSV</button>`;
  let drawFoot = () => {
    if (S.view === "pick" && S.pool === "ready") { let s = sum();
      foot.innerHTML = `<span class="sum886">เลือกแล้ว ${s.n} JOB · ยอดค่าบริการรวม (ก่อนภาษี) ${M886(s.amt)}</span><button class="btn btn-o" data-close>${B888}</button><button class="btn btn-or" id="mg888-mk"${s.n < 1 ? " disabled" : ""} title="บันทึกสถานะ “รอรวมวางบิล” ให้ JOB ที่เลือก — ไม่ออกเลข INVOICE · ไม่ POST · ไม่สร้างลูกหนี้">📌 บันทึก — รอรวมวางบิล (${s.n})</button>`;
    } else if (S.view === "pick") { let s = sum();
      foot.innerHTML = `<span class="sum886">เลือกแล้ว ${s.n} JOB · ยอดค่าบริการรวม (ก่อนภาษี) ${M886(s.amt)}</span>${XF888(s.n)}<button class="btn btn-o" data-close>${B888}</button><button class="btn btn-or" id="mg886-go"${s.n < 2 ? " disabled" : ""} title="${s.n < 2 ? "เลือก JOB อย่างน้อย 2 รายการ" : "ตรวจเงื่อนไข + รวมรายการ"}">รวมออก INVOICE เดียว (${s.n})</button>`;
    } else if (S.view === "done") foot.innerHTML = `<span class="sum886">INVOICE ${n(S.done.invoice_no || "")} · ${S.done.job_count} JOB</span>` + XF886 + '<button class="btn btn-o" id="mg886-view">รายละเอียด</button><button class="btn btn-o" data-close>' + B888 + '</button>';
    else if (S.view === "list") foot.innerHTML = '<span class="sum886"></span><button class="btn btn-o" data-close>' + B888 + '</button>';
    else foot.innerHTML = `<span class="sum886">${S.pv.header.job_count} JOB · Total ${M886(S.pv.totals.total_amount)}</span><button class="btn btn-o" id="mg886-back">◀ ย้อนกลับ / แก้ไขชุด JOB</button><button class="btn btn-or" id="mg886-post" title="POST = ออก INVOICE NJ 1 เลขจากเลขรันชุดเดิม + ลูกหนี้ 1 รายการ">⬆ POST รวมออก INVOICE (${S.pv.header.job_count} JOB)</button>`;
  };
  let grp = (L) => { let mp = new Map(); L.forEach((x) => { let nm = String(x.name || x.code || "").replace(/\s+/g, " ").trim(), k = nm.toUpperCase(), g = mp.get(k); g ? (g.ids.push(String(x.id)), (g.cos = g.cos.concat(x.company_ids || []))) : mp.set(k, { name: nm, ids: [String(x.id)], cos: (x.company_ids || []).slice() }); }); return [...mp.values()].map((g) => ((g.id = g.ids.join(",")), g)).sort((a, b) => a.name.localeCompare(b.name, "th")); };   /* ชื่อซ้ำ = 1 ตัวเลือก (ทุก ID) */
  let opts = (L, cur, all) => `<option value="">${all}</option>` + L.map((x) => `<option value="${n(x.id)}"${String(x.id) === cur ? " selected" : ""}>${n(x.name || "")}</option>`).join("");
  let TT888 = () => S.tab === "done" ? "รวม INVOICE — INVOICE รวมที่ออกแล้ว" : S.pool === "ready" ? "รวม INVOICE — เพิ่ม JOB เข้ารายการรอรวมวางบิล" : "รวม INVOICE — JOB รอรวมวางบิล (เลือกหลาย JOB แล้วออก INVOICE NJ เลขเดียว)";
  let tabs = () => `<div class="tabs886"><button type="button" data-tab="wait" class="${S.tab === "wait" ? "on" : ""}">JOB รอรวมวางบิล</button><button type="button" data-tab="done" class="${S.tab === "done" ? "on" : ""}">INVOICE รวมที่ออกแล้ว</button></div>`;
  let drawPick = (d, err) => {
    let coS = S.f.company ? S.f.company.split(",") : null, cus = grp((d.customers || []).filter((c) => !coS || (c.company_ids || []).map(String).some((i) => coS.includes(i))));
    S.f.customer && !cus.some((c) => String(c.id) === S.f.customer) && (S.f.customer = "");
    body.innerHTML = tabs() + (err ? `<div class="err886"><b>รวมไม่ได้ — ตรวจสอบรายการต่อไปนี้</b><ul>${err.map((e) => `<li>${e.job_no ? "<b>" + n(e.job_no) + "</b> : " : ""}${n(e.reason)}</li>`).join("")}</ul></div>` : "")
      + `<div class="pool888"><button type="button" data-pool="wait" class="${S.pool === "wait" ? "on" : ""}">JOB รอรวมวางบิล${S.pool === "wait" && d.all_total != null ? " (" + d.all_total + ")" : ""}</button><button type="button" data-pool="ready" class="${S.pool === "ready" ? "on" : ""}" title="ร่างค่าบริการที่บันทึกไว้แล้วแต่ยังไม่ได้ตั้งรอรวม — เลือกแล้วกดบันทึกเพื่อนำเข้ารายการรอรวม">➕ เพิ่ม JOB เข้ารายการรอรวม${S.pool === "ready" && d.all_total != null ? " (" + d.all_total + ")" : ""}</button></div>`
      + `<div class="mg886-bar"><label>COMPANY INVOICE<select class="sel" data-g="company">${opts(grp(d.companies || []), S.f.company, "บริษัททั้งหมด")}</select></label>
        <label>CUSTOMER<select class="sel" data-g="customer">${opts(cus, S.f.customer, "ลูกค้าทั้งหมด")}</select></label>
        <label>Customer Job No.<input class="inp" data-g="cjob" value="${n(S.f.cjob)}" placeholder="Customer Job No."></label>
        <label>เดือนที่วางบิล<input class="inp" type="month" data-g="month" value="${n(S.f.month)}"></label>
        <label>ค้นหา<input class="inp" data-g="q" value="${n(S.f.q)}" placeholder="JOB NJ / ลูกค้า"></label></div>
      <div class="mg886-wrap"><table><thead><tr><th class="c"><input type="checkbox" id="mg886-all" title="เลือกทั้งหมดที่แสดง"></th><th>JOB NJ</th><th>Customer</th><th>Customer Job No.</th><th class="c">วันที่วางบิล</th><th class="c">รายการ</th><th class="r">ยอดค่าบริการก่อนภาษี</th><th>สถานะ</th><th></th></tr></thead>
      <tbody>${S.rows.length ? S.rows.map((r) => `<tr data-j="${n(r.job_id)}" class="${S.sel.has(String(r.job_id)) ? "on" : ""}"><td class="c"><input type="checkbox" data-ck${S.sel.has(String(r.job_id)) ? " checked" : ""}></td><td><b>${n(r.job_no || "")}</b></td><td>${n(r.customer_name || "")}<span class="sub886">${n(r.company_name || "")}</span></td><td>${n(r.customer_job_no || "")}</td><td class="c">${DT886(r.invoice_date)}</td><td class="c">${Number(r.item_count || 0)}</td><td class="r">${M886(r.subtotal)}</td>${S.pool === "ready" ? '<td><span class="st888">ร่าง — ยังไม่ได้ตั้งรอรวม</span></td><td class="c"><button type="button" class="btn btn-sm btn-or" data-mk title="บันทึกสถานะ “รอรวมวางบิล” ให้ JOB นี้">📌 ตั้งรอรวม</button></td>' : `<td><span class="st886">รอรวมวางบิล</span><span class="sub886">${DT886(r.marked_at)}${r.marked_by_name ? " · " + n(r.marked_by_name) : ""}</span></td><td class="c"><button type="button" class="btn btn-sm btn-o" data-un title="ยกเลิกสถานะรอรวมวางบิลของ JOB นี้ (รายการค่าบริการที่บันทึกไว้ไม่ถูกลบ)">ยกเลิกรอรวม</button></td>`}</tr>`).join("") : `<tr><td colspan="9" class="c" style="padding:22px;color:#64748b">${d.all_total ? "ไม่พบ JOB ตามเงื่อนไขที่ค้นหา" : S.pool === "ready" ? "ไม่มีร่างค่าบริการที่พร้อมตั้งรอรวม — บันทึกรายการค่าบริการของ JOB ก่อน" : "ยังไม่มี JOB ที่รอรวมวางบิล — กด “➕ เพิ่ม JOB เข้ารายการรอรวม” ด้านบน หรือกดปุ่มส้ม “บันทึก — รอรวมวางบิล” ในหน้าต่าง INVOICE ของ JOB"}</td></tr>`}</tbody></table></div>`;
    let all = body.querySelector("#mg886-all"); all && (all.checked = S.rows.length > 0 && S.rows.every((r) => S.sel.has(String(r.job_id))));
    drawFoot();
    if (cx.go896 && !S.go896) { S.go896 = 1; let g896 = foot.querySelector("#mg886-go"); g896 && !g896.disabled && g896.click(); }   /* V.896 : มาจากปุ่ม "รวมออก INVOICE" ของหน้ารายการ -> เข้า PREVIEW ชุดเดิมทันที (ทำครั้งเดียว) */
  };
  let load = async (err) => {
    let my = ++S.seq;
    try {
      let d = await RPC499("njacc_mrg886_cands", { p: { company_group: cx.group, pool: S.pool, company_ids: S.f.company ? S.f.company.split(",") : [], customer_ids: S.f.customer ? S.f.customer.split(",") : [], cjob: S.f.cjob || null, month: S.f.month || null, q: S.f.q || null } });
      if (my !== S.seq || !body.isConnected) return; S.rows = (d && d.rows) || []; S.d = d || {};
      if (!S.all) { S.all = 1; let u = await (S.f.company || S.f.customer || S.f.cjob || S.f.month || S.f.q ? RPC499("njacc_mrg886_cands", { p: { company_group: cx.group, pool: S.pool } }) : Promise.resolve(d)); let mp = new Map(((u && u.rows) || []).map((r) => [String(r.job_id), r])); [...S.sel.keys()].forEach((k) => { mp.has(k) ? S.sel.set(k, mp.get(k)) : S.sel.delete(k); }); }
      else S.rows.forEach((r) => { S.sel.has(String(r.job_id)) && S.sel.set(String(r.job_id), r); });
      drawPick(S.d, err);
    } catch (e) { if (my !== S.seq || !body.isConnected) return; body.innerHTML = `<div class="err886">${NR886(e) ? "ฐานข้อมูลยังไม่พร้อมสำหรับการรวม INVOICE (ต้องรัน RUN-886 ก่อน)" : "โหลดรายการไม่สำเร็จ — " + n(String(e && e.message || e))}</div>`; foot.innerHTML = '<button class="btn btn-o" data-close>' + B888 + '</button>'; }
  };
  let loadList = async () => {
    let my = ++S.seq; S.view = "list"; mt886t(TT888());
    try {
      let L = await RPC499("njacc_mrg886_list", { p: { company_group: cx.group, q: S.dq || null, ended: S.ended } }); if (my !== S.seq || !body.isConnected) return; L = Array.isArray(L) ? L : [];
      let stx = { POSTED: "ออก INVOICE แล้ว", DRAFT: "รอ POST รวม", ENDED: "ยกเลิกแล้ว" };
      body.innerHTML = tabs() + `<div class="mg886-bar"><label>ค้นหา<input class="inp" id="mg886-dq" value="${n(S.dq)}" placeholder="INVOICE NJ / JOB NJ / ลูกค้า / Customer Job No."></label><label style="flex-direction:row;align-items:center;gap:6px;height:34px"><input type="checkbox" id="mg886-ended"${S.ended ? " checked" : ""}> แสดงใบที่ยกเลิกการรวม / VOID แล้ว</label></div>
        <div class="mg886-wrap"><table><thead><tr><th>INVOICE NJ</th><th class="c">วันที่</th><th>Customer</th><th>Customer Job No.</th><th>JOB ที่รวม</th><th class="r">ก่อนภาษี</th><th class="r">Total</th><th>สถานะ</th><th></th></tr></thead><tbody>${L.length ? L.map((r) => `<tr data-m="${n(r.mrg_id)}"><td><b>${n(r.invoice_no || "-")}</b></td><td class="c">${DT886(r.invoice_date)}</td><td>${n(r.customer_name || "")}<span class="sub886">${n(r.company_name || "")}</span></td><td>${n(r.customer_job_no || "")}</td><td><b>${r.job_count} JOB</b><span class="sub886" title="${n(r.job_nos || "")}">${n(String(r.job_nos || "").length > 60 ? String(r.job_nos).slice(0, 60) + "…" : r.job_nos || "")}</span></td><td class="r">${M886(r.subtotal)}</td><td class="r"><b>${M886(r.total_amount)}</b></td><td><span class="stt ${n(r.status)}">${n(stx[r.status] || r.status)}</span><span class="sub886">${DT886(r.created_at)}${r.created_by_name ? " · " + n(r.created_by_name) : ""}</span></td><td class="c" style="white-space:nowrap"><button type="button" class="btn btn-sm btn-xl" data-lx title="EXPORT EXCEL DETAILS">⬇ EXCEL</button> <button type="button" class="btn btn-sm btn-o" data-lv>รายละเอียด</button></td></tr>`).join("") : '<tr><td colspan="9" class="c" style="padding:22px;color:#64748b">ยังไม่มี INVOICE รวม</td></tr>'}</tbody></table></div>`;
      drawFoot();
    } catch (e) { if (my !== S.seq || !body.isConnected) return; body.innerHTML = tabs() + `<div class="err886">${NR886(e) ? "ฐานข้อมูลยังไม่พร้อมสำหรับ INVOICE รวม (ต้องรัน RUN-887 ก่อน)" : "โหลดรายการไม่สำเร็จ — " + n(String(e && e.message || e))}</div>`; foot.innerHTML = '<button class="btn btn-o" data-close>' + B888 + '</button>'; }
  };
  let drawDone = () => {
    let r = S.done, T = r.totals || {}; S.view = "done"; mt886t("รวม INVOICE — ออก INVOICE รวมแล้ว " + (r.invoice_no || ""));
    body.innerHTML = tabs() + `<div class="ok886">✅ POST รวมสำเร็จ — ออก INVOICE NJ เลขเดียว<span class="no">${n(r.invoice_no || "")}</span>${r.job_count} JOB · JOB หลัก ${n(r.lead_job_no || "")} · Total ${M886(T.total_amount)} · ยอดรับชำระ ${M886(T.net_receivable)}<br><span class="sub886" style="margin-top:6px">ทุก JOB เปลี่ยนสถานะเป็น “ออก INVOICE แล้ว” · FINANCE → RECEIPT เห็นลูกหนี้ 1 รายการ (หลังกด ✅ ปิดงาน ตามขั้นตอนเดิม) · พิมพ์ PDF ได้จากหน้าต่าง INVOICE ของ JOB หลัก</span></div>`;
    drawFoot();
  };
  let drawPv = () => {
    let v = S.pv, h = v.header, T = v.totals; S.view = "pv";
    body.innerHTML = `<div class="hd886"><div>COMPANY INVOICE : <b>${n(h.company_name || "-")}</b></div><div>CUSTOMER : <b>${n(h.customer_name || "-")}</b></div><div><label>วันที่ INVOICE (วันที่วางบิล)<input class="inp" type="date" id="mg886-dt" value="${n(S.date || String(h.invoice_date || "").slice(0, 10))}"></label></div><div>จำนวน JOB : <b>${h.job_count}</b> · สกุลเงิน <b>${n(h.currency || "THB")}</b></div>
        <div style="grid-column:1/-1"><label>Customer Job No. สำหรับ INVOICE รวม ${h.customer_job_no ? "" : '<span style="color:#b45309">(JOB ที่เลือกมีเลขไม่ตรงกัน — กำหนดเอง)</span>'}<input class="inp" id="mg886-cj" maxlength="200" value="${n(S.cjno || h.customer_job_no || "")}"></label></div>
        <div class="jobs886">${v.jobs.map((j) => `<span>${n(j.job_no)}</span>`).join("")}</div></div>
      <div class="mg886-wrap"><table><thead><tr><th class="c">#</th><th>Description</th><th class="r">Quantity</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead><tbody>${v.lines.map((l) => `<tr><td class="c">${l.line_no}</td><td>${n(l.description)}${l.unit ? ' <span class="sub886" style="display:inline">(' + n(l.unit) + ")</span>" : ""}<span class="sub886">จาก ${l.jobs} JOB · ${l.src_lines} รายการ${Number(l.vat_rate) ? "" : " · ไม่มี VAT"}${l.qty_price_ok === !1 ? " · ⚠ QTY × ราคา ไม่เท่ายอดจริง (ใช้ยอดจริง)" : ""}</span></td><td class="r">${M886(l.qty)}</td><td class="r">${M886(l.unit_price)}</td><td class="r"><b>${M886(l.amount)}</b></td></tr>`).join("")}</tbody></table></div>
      <div class="tot886"><div><span>Service Amount (ก่อนภาษี)</span><b>${M886(T.subtotal)}</b></div><div><span>VAT ${n(String(h.vat_rate))}% (ฐาน ${M886(T.vat_base)})</span><b>${M886(T.vat_amount)}</b></div><div class="g"><span>Total Amount</span><span>${M886(T.total_amount)}</span></div><div><span>Withholding Tax</span><b>- ${M886(T.wht_amount)}</b></div><div><span>ยอดรับชำระ</span><b>${M886(T.net_receivable)}</b></div></div>
      ${Number(T.src_subtotal) === Number(T.subtotal) ? "" : `<div class="err886">⚠ ยอดรวมหลังรวมรายการ (${M886(T.subtotal)}) ไม่ตรงกับผลรวมค่าบริการราย JOB (${M886(T.src_subtotal)}) — ส่วนต่าง ${M886(Number(T.subtotal) - Number(T.src_subtotal))}</div>`}
      <details><summary>ตรวจสอบรายละเอียด JOB (${v.jobs.length} JOB · ${T.src_lines} รายการต้นทาง)</summary><div class="mg886-wrap" style="margin-top:6px"><table><thead><tr><th>JOB NJ</th><th>Customer Job No.</th><th>รายการ</th><th class="r">Quantity</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead><tbody>${v.jobs.map((j) => j.lines.map((l, i) => `<tr><td>${i ? "" : "<b>" + n(j.job_no) + "</b>"}</td><td>${i ? "" : n(j.customer_job_no || "")}</td><td>${n(l.description)}</td><td class="r">${M886(l.qty)}</td><td class="r">${M886(l.unit_price)}</td><td class="r">${M886(l.amount)}</td></tr>`).join("") + `<tr style="background:#fef9c3;font-weight:700"><td colspan="5" class="r">Subtotal : ${n(j.job_no)}</td><td class="r">${M886(j.subtotal)}</td></tr>`).join("")}</tbody></table></div></details>
      <div class="note886">ยังไม่ออกเลข INVOICE จนกว่าจะกด POST · POST แล้ว = INVOICE NJ 1 เลขจากเลขรันชุดเดิม · ลูกหนี้ 1 รายการ · VAT / WHT คิดจากยอดรวมของใบ · Customer Job No. ของ JOB เดิมไม่ถูกแก้</div>`;
    drawFoot();
  };
  let tm = 0;
  body.addEventListener("input", (ev) => { let g = ev.target.dataset && ev.target.dataset.g; if (ev.target.id === "mg886-cj") { S.cjno = ev.target.value; return; } if (ev.target.id === "mg886-dt") { S.date = ev.target.value; return; } if (ev.target.id === "mg886-dq") { S.dq = ev.target.value.trim(); clearTimeout(tm); tm = setTimeout(() => loadList(), 300); return; } if (!g) return; S.f[g] = ev.target.value.trim(); g === "company" && (S.f.customer = ""); clearTimeout(tm); tm = setTimeout(() => load(), g === "company" || g === "customer" || g === "month" ? 0 : 300); });
  body.addEventListener("change", (ev) => {
    if (ev.target.id === "mg886-ended") { S.ended = ev.target.checked; loadList(); return; }
    if (ev.target.id === "mg886-all") { S.rows.forEach((r) => { ev.target.checked ? S.sel.set(String(r.job_id), r) : S.sel.delete(String(r.job_id)); }); drawPick(S.d); return; }
    if (ev.target.hasAttribute && ev.target.hasAttribute("data-ck")) { let tr = ev.target.closest("tr"), id = tr.dataset.j, r = S.rows.find((x) => String(x.job_id) === id); ev.target.checked ? S.sel.set(id, r) : S.sel.delete(id); tr.classList.toggle("on", ev.target.checked); let all = body.querySelector("#mg886-all"); all && (all.checked = S.rows.every((x) => S.sel.has(String(x.job_id)))); drawFoot(); }
  });
  body.addEventListener("click", async (ev) => {
    let tb = ev.target.closest && ev.target.closest("[data-tab]"); if (tb) { if (tb.dataset.tab === S.tab) return; S.tab = tb.dataset.tab; S.tab === "done" ? loadList() : ((S.view = "pick"), mt886t(TT888()), (S.all = 0), load()); return; }
    let pb = ev.target.closest && ev.target.closest("[data-pool]");
    if (pb) { if (pb.dataset.pool === S.pool) return; S.pool = pb.dataset.pool; S.sel.clear(); S.all = 0; S.view = "pick"; mt886t(TT888()); await load(); return; }
    let mk = ev.target.closest && ev.target.closest("[data-mk]");
    if (mk) { if (mk.disabled) return; let id = mk.closest("tr").dataset.j, r = S.rows.find((x) => String(x.job_id) === id); mk.disabled = !0;
      try { await RPC499("njacc_mrg886_mark", { p: { job_id: id } }); S.sel.delete(id); S.chg = 1; y("บันทึก “รอรวมวางบิล” แล้ว — " + (r && r.job_no || ""), "ok"); EV888(); await load(); }
      catch (e) { mk.disabled = !1; NR886(e) ? y("ฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-886 ก่อน)", "err") : m(e); } return; }
    let lb = ev.target.closest && ev.target.closest("[data-lx],[data-lv]"); if (lb) { let id = lb.closest("tr").dataset.m; lb.hasAttribute("data-lx") ? XB886(lb, { mrg_id: id }, "xlsx") : MV886(t, Object.assign({}, cx, { back: 1 }), { mrg_id: id }); return; }
    let b = ev.target.closest && ev.target.closest("[data-un]"); if (!b || b.disabled) return; let tr = b.closest("tr"), id = tr.dataset.j, r = S.rows.find((x) => String(x.job_id) === id);
    if (!window.confirm("ยกเลิกสถานะ “รอรวมวางบิล” ของ " + (r && r.job_no || "") + " ?\n(รายการค่าบริการที่บันทึกไว้ไม่ถูกลบ · มีการบันทึกประวัติ)")) return;
    b.disabled = !0; try { await RPC499("njacc_mrg886_mark", { p: { job_id: id, on: !1 } }); S.sel.delete(id); y("ยกเลิกรอรวมวางบิลแล้ว — " + (r && r.job_no || ""), "ok"); S.chg = 1; EV888(); await load(); } catch (e) { b.disabled = !1; m(e); }
  });
  foot.addEventListener("click", async (ev) => {
    let cb = ev.target.closest && ev.target.closest("[data-close]");
    if (cb && host) { ev.preventDefault(); cx.back && cx.back(); return; }
    let b = ev.target.closest && ev.target.closest("#mg886-go,#mg886-back,#mg886-post,#mg886-view,#mg888-mk,[data-xp],[data-xd]"); if (!b || b.disabled) return;
    if (b.dataset.xd) {   /* V.888 : EXPORT ชุดที่เลือก ก่อน POST (ระบุ DRAFT) */
      let ids = [...S.sel.keys()]; if (ids.length < 2) return;
      b.disabled = !0; let t2 = b.textContent; b.textContent = "กำลังสร้างไฟล์…";
      try { let v = await RPC499("njacc_mrg886_preview", { p: { job_ids: ids } });
        if (!v || !v.ok) { S.all = 0; await load((v && v.errors) || [{ reason: "ตรวจสอบไม่สำเร็จ" }]); return; }
        (await XP886(XJ888(v, (id) => S.sel.get(String(id)), S.cjno, S.date), b.dataset.xd)) && y("EXPORT " + (b.dataset.xd === "xlsx" ? "EXCEL DETAILS" : b.dataset.xd.toUpperCase()) + " (DRAFT · ยังไม่ออกเลข INVOICE) แล้ว", "ok");
      } catch (e) { m(e); } finally { b.disabled = !1; b.textContent = t2; }
      return;
    }
    if (b.id === "mg888-mk") {   /* V.888 : บันทึกรอรวมวางบิลให้ JOB ที่เลือก */
      let ids = [...S.sel.keys()], ok = 0, er = [];
      if (!ids.length) return; b.disabled = !0; let t3 = b.textContent;
      for (let i = 0; i < ids.length; i++) { b.textContent = "กำลังบันทึก… (" + (i + 1) + "/" + ids.length + ")";
        try { await RPC499("njacc_mrg886_mark", { p: { job_id: ids[i] } }); ok++; } catch (e) { let r = S.sel.get(ids[i]); er.push((r && r.job_no || "") + " : " + String(e && e.message || e).replace(/^NJACC_[A-Z0-9_]*:?\s*/, "")); } }
      S.chg = 1; S.sel.clear(); S.pool = "wait"; S.all = 0; b.textContent = t3; b.disabled = !1;
      y(ok ? "บันทึก “รอรวมวางบิล” แล้ว " + ok + " JOB" : "บันทึกไม่สำเร็จ", ok ? "ok" : "err"); EV888();
      await load(er.length ? er.map((x) => ({ reason: x })) : null); return;
    }
    if (b.dataset.xp) { XB886(b, { invoice_id: S.done.id }, b.dataset.xp); return; }
    if (b.id === "mg886-view") { MV886(t, cx, { invoice_id: S.done.id }); return; }
    if (b.id === "mg886-post") {
      let cj = String((body.querySelector("#mg886-cj") || {}).value || "").trim(), dt = String((body.querySelector("#mg886-dt") || {}).value || ""), h = S.pv.header, T = S.pv.totals;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) { y("กรุณาระบุวันที่ INVOICE", "err"); return; }
      if (!window.confirm("ยืนยัน POST รวม " + h.job_count + " JOB เป็น INVOICE NJ เลขเดียว ?\n\nCUSTOMER : " + (h.customer_name || "") + "\nวันที่ INVOICE : " + DT886(dt) + "\nTotal Amount : " + M886(T.total_amount) + "\n\n• ออกเลข INVOICE NJ จากเลขรันชุดเดิม 1 เลข\n• สร้างลูกหนี้ 1 รายการ\n• ทุก JOB เปลี่ยนเป็น “ออก INVOICE แล้ว”")) return;
      b.disabled = !0; let t1 = b.textContent; b.textContent = "กำลัง POST…"; S.req = S.req || H();
      try { let r = await RPC499("njacc_mrg886_post", { p: { job_ids: [...S.sel.keys()], customer_job_no: cj || null, invoice_date: dt, stamp: S.pv.stamp, request_id: S.req } }); S.chg = 1; S.done = r || {}; S.sel.clear(); drawDone(); y("POST รวมแล้ว — INVOICE " + (S.done.invoice_no || ""), "ok"); EV888(); cx.refresh && cx.refresh(); }
      catch (e) { let ms = String(e && e.message || ""), iv = /NJACC_MRG886_(?:INVALID|CHANGED):\s*([^\n]*)/.exec(ms);
        if (iv) { S.req = null; S.view = "pick"; S.all = 0; mt886t(TT888()); await load([{ reason: iv[1] }]); } else { NR886(e) ? y("ฐานข้อมูลยังไม่พร้อมสำหรับการ POST รวม (ต้องรัน RUN-887 ก่อน)", "err") : m(e); b.disabled = !1; b.textContent = t1; } }
      return;
    }
    if (b.id === "mg886-back") { S.view = "pick"; mt886t(TT888()); await load(); return; }
    b.disabled = !0; let t0 = b.textContent; b.textContent = "กำลังตรวจสอบ…";
    try { let v = await RPC499("njacc_mrg886_preview", { p: { job_ids: [...S.sel.keys()] } }); if (!body.isConnected) return;
      if (!v || !v.ok) { S.all = 0; await load((v && v.errors) || [{ reason: "ตรวจสอบไม่สำเร็จ" }]); return; }
      S.pv = v; S.req = null; mt886t("รวม INVOICE — PREVIEW รวม " + v.header.job_count + " JOB (ยังไม่ออกเลข)"); drawPv();
    } catch (e) { m(e); b.disabled = !1; b.textContent = t0; }
  });
  let mt886t = (tx) => { if (host) { let hh = host.querySelector(".h888"); hh && (hh.textContent = tx); return; } let h3 = body.closest(".modal") && body.closest(".modal").querySelector(".modal-h h3"); h3 && (h3.textContent = tx); };
  if (!host) { let bk = document.getElementById("nj-modal"); bk && new MutationObserver(() => { if (!document.getElementById("nj-modal") || !body.isConnected) { S.chg && cx.refresh && cx.refresh(); } }).observe(document.body, { childList: !0 }); }
  let ev888 = () => { if (!body.isConnected) { window.removeEventListener("njacc:mrg888", ev888); return; } S.view === "pick" ? ((S.all = 0), load()) : S.view === "list" && loadList(); };
  window.addEventListener("njacc:mrg888", ev888);
  mt886t(TT888());
  S.tab === "done" ? loadList() : load();
}

/* ═══ V.888 · แท็บ "รวม INVOICE" ในหน้า ACCOUNTING → SERVICE (ไม่ใช้ Popup) ═══ */
function TX888(k, c668, o888, e888) {   /* ปุ่มแท็บที่ 4 (สีส้ม) ต่อจาก "POST แล้ว" — เฉพาะ ACCOUNTING → SERVICE */
  if (o888 !== "accounting" || e888 !== "SERVICE") return "";
  let r = c668 && CC888(c668), x = r == null ? null : Number(r);
  return `<button type="button" class="rep-tab tab888${k === "mrg886" ? " active" : ""}" data-accq="mrg886" title="เฉพาะ JOB ที่บันทึก “รอรวมวางบิล” และยังไม่ POST — ใช้ตารางและเครื่องมือชุดเดียวกับแท็บอื่น">🧾 รวม INVOICE${x != null ? `<span class="cj-n" id="acc499-n-mrg886">${x.toLocaleString("th-TH")}</span>` : '<span class="cj-n" id="acc499-n-mrg886"></span>'}</button>`;
}
function SH888(t, on) {   /* ซ่อน / คืนส่วนของหน้ารายการปกติ (ไม่ลบ ไม่แตะข้อมูล) */
  ["#ch-filter", "#ch-bulk", "#ch-pgn", "#ch-kpi", ".ch-tools", ".tbl-wrap"].forEach((q) => { let e = t.querySelector(q); e && (e.style.display = on ? "none" : ""); });
}
function TG888(t, on, cx) {   /* true = แท็บรวม INVOICE ทำงานแทนหน้ารายการ (ไม่โหลดรายการปกติ) */
  let p = t.querySelector("#mrg888");
  if (!on) { if (p) { p.remove(); SH888(t, !1); } return !1; }
  let tb = t.querySelector("#acc499-tabs"); if (!tb) return !1;
  ST886(); SH888(t, !0);
  if (p && p.dataset.on === "1") return !0;
  p || ((p = document.createElement("div")), (p.id = "mrg888"), (p.className = "mg888-pg"), tb.insertAdjacentElement("afterend", p));
  p.dataset.on = "1"; MG886(t, Object.assign({ host: p }, cx));
  return !0;
}
