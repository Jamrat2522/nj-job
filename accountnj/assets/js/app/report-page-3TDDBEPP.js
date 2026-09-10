import{a as S}from"./chunk-REZWD556.js";import{e as f}from"./chunk-ZLBNQY6X.js";import{a as E}from"./chunk-RGVAFVSR.js";import{j as I,s as T}from"./chunk-ZNHW356Z.js";import{g as _}from"./chunk-NO6JZBTH.js";import{a as y,b as h}from"./chunk-Q7FMECGI.js";import"./chunk-GDT6F23K.js";import{a as b,b as v}from"./chunk-OPGKUGLK.js";import{a as g}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-37ELUCVE.js";import"./chunk-DIH2PLYD.js";import{a as l,c as m,e as r,h as $}from"./chunk-PCFU74ZV.js";function O(t){return`<tr>
    <td class="nowrap">${m(t.invoice_date)}</td>
    <td class="t-xs">${r(t.charge_type)} \xB7 ${r(t.company_group)}</td>
    <td class="t-b">${r(t.invoice_no)}</td>
    <td class="t-xs">${r(t.job_no||"-")}</td>
    <td class="ellip" style="max-width:190px">${r(t.customer_name||"-")}</td>
    <td>${t.status==="VOID"?'<span class="bdg bdg-void">VOID</span>':$(t.payment_status)}</td>
    <td class="r">${l(t.subtotal)}</td>
    <td class="r">${l(t.vat_amount)}</td>
    <td class="r">${l(t.wht_amount)}</td>
    <td class="r t-b">${l(t.total_amount)}</td>
    <td class="r money-pos">${l(t.received)}</td>
    <td class="r money-neg">${l(t.outstanding)}</td>
    <td class="nowrap">${m(t.due_date)}${t.overdue?' <span class="bdg bdg-due-over">\u0E40\u0E01\u0E34\u0E19</span>':""}</td></tr>`}function R(t){return'<div class="kpi-row">'+[["INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",(t?.total_invoice??0).toLocaleString("th-TH"),"var(--blue-600)"],["\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21",l(t?.invoice_amount),"var(--cyan-700)"],["\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27",l(t?.received),"var(--green-600)"],["\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21",l(t?.outstanding),"var(--red-600)"],["\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14",(t?.overdue??0).toLocaleString("th-TH"),"var(--amber-600)"],["\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19",(t?.paid??0)+" / "+(t?.partial??0),"var(--purple-600)"]].map(([n,a,d])=>`<div class="kpi" style="--kpi-c:${d}"><div class="lb">${n}</div><div class="v">${a}</div></div>`).join("")+"</div>"}var A=["DRAFT","ISSUED","POSTED","VOID"],c=t=>String(t??"").replace(/[&<>"']/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[p]),e={charge_type:"",company_group:"",customer_id:"",status:"",payment_status:"",from:"",to:"",page:1,size:20},w={"invoice-all":{title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",lock:{}},"billing-total":{title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21",lock:{},note:"\u0E22\u0E2D\u0E14\u0E2A\u0E23\u0E38\u0E1B\u0E19\u0E31\u0E1A INVOICE \u0E17\u0E35\u0E48\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35 (ISSUED + POSTED) \u0E15\u0E32\u0E21 njacc_inv_is_final \u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A"},paid:{title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27",lock:{payment_status:"PAID"}},"paid-status":{title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19",lock:{},only:["payment_status"],note:'\u0E40\u0E25\u0E37\u0E2D\u0E01 "\u0E04\u0E23\u0E1A" \u0E2B\u0E23\u0E37\u0E2D "\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19" \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30'}};async function U(t,p){let n=p&&p.key||"",a=w[n];if(n&&!a){let{REPORT_CARDS:s}=await import("./report-home-4UZCXVWX.js"),o=s.flatMap(i=>i.items).find(i=>i.key===n);t.innerHTML=`
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>${c(o?o.title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19")}</h2></div>
        <a class="btn btn-o btn-sm" href="#/report">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</a></div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19</h3>
        <p class="t-2 mt-1">${c(o?o.why:"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E48\u0E2D\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49")}</p>
        <p class="t-xs t-3 mt-2">\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E33\u0E25\u0E2D\u0E07 \u2014 \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E21\u0E35 RPC \u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19</p>
      </div>`;return}a&&(Object.assign(e,{charge_type:"",company_group:"",customer_id:"",status:"",payment_status:"",from:"",to:"",page:1}),Object.assign(e,a.lock)),await I(),t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${a?c(a.title):"REPORT"}</h2></div>
      ${a?'<a class="btn btn-o btn-sm" href="#/report">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</a>':""}</div>
    ${a?`<p class="t-xs t-3 mb-1"><a href="#/report">REPORT</a> \u203A ${c(a.title)}${a.note?" \u2014 "+c(a.note):""}</p>`:""}
    <div id="rep-kpi"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>
    <div class="fbar">
      <select class="sel" data-f="charge_type"><option value="">\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</option>
        ${h.map(s=>`<option value="${s.key}" ${e.charge_type===s.key?"selected":""}>${s.label}</option>`).join("")}</select>
      <select class="sel" data-f="company_group"><option value="">\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</option>
        ${y.map(s=>`<option value="${s.key}" ${e.company_group===s.key?"selected":""}>${s.label}</option>`).join("")}</select>
      <select class="sel" data-f="customer_id">${T(e.customer_id)}</select>
      
      <select class="sel" data-f="status" ${a&&"status"in a.lock?"hidden":""}><option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
        ${A.map(s=>`<option value="${s}" ${e.status===s?"selected":""}>${s}</option>`).join("")}</select>
      <select class="sel" data-f="payment_status" ${a&&"payment_status"in a.lock?"hidden":""}><option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
        <option value="UNPAID" ${e.payment_status==="UNPAID"?"selected":""}>\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30</option>
        <option value="PARTIAL" ${e.payment_status==="PARTIAL"?"selected":""}>\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19</option>
        <option value="PAID" ${e.payment_status==="PAID"?"selected":""}>\u0E04\u0E23\u0E1A</option></select>
      <input class="inp" type="date" data-f="from" value="${e.from}" title="\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48">
      <input class="inp" type="date" data-f="to" value="${e.to}" title="\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48">
      <button class="btn btn-p btn-sm" id="rep-go">\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INV</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th><th>INVOICE</th><th>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th>
      <th class="r">\u0E01\u0E48\u0E2D\u0E19 VAT</th><th class="r">VAT</th><th class="r">WHT</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21</th><th class="r">\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th><th>Due</th>
    </tr></thead><tbody id="rep-tbody"><tr><td colspan="13" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rep-pgn"></div>
    ${_("export")?'<p class="t-xs t-3 mt-1">* Export Excel \u0E08\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E43\u0E19 Release \u0E16\u0E31\u0E14\u0E44\u0E1B (\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 lazy-loader \u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27)</p>':""}`;function d(){let s=t.querySelector("#rep-tbody");f({table:s&&s.closest("table"),modeKey:"REPORT_MAIN",host:t.querySelector(".fbar")})}d();async function u(){let s=b("report");try{let o=await S({charge_type:e.charge_type||null,company_group:e.company_group||null,customer_id:e.customer_id||null,status:e.status||null,payment_status:e.payment_status||null,from:e.from||null,to:e.to||null,page:e.page,size:e.size});if(!v("report",s))return;t.querySelector("#rep-kpi").innerHTML=R(o.kpi||{});let i=o.rows||[];t.querySelector("#rep-tbody").innerHTML=i.length?i.map(O).join(""):'<tr><td colspan="13" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 \u2014 INVOICE \u0E08\u0E30\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25</td></tr>',E(t.querySelector("#rep-pgn"),{page:e.page,size:e.size,total:o.total||0},({page:P,size:k})=>{e.page=P,e.size=k,u()}),d()}catch(o){v("report",s)&&g(o)}}t.querySelector("#rep-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(s=>e[s.dataset.f]=s.value),e.page=1,u()},u()}export{A as INVOICE_STATUSES,w as REPORT_PRESETS,U as render};
