import{e as h}from"./chunk-TKN6STDT.js";import"./chunk-UWAYW6DC.js";import"./chunk-EVZDPOX3.js";import"./chunk-IOOV4VJU.js";import{a as q,b as m,c as L}from"./chunk-OPGKUGLK.js";import{a as u}from"./chunk-YM5GFE6V.js";import"./chunk-GDT6F23K.js";import{a as x}from"./chunk-OFOOXWUM.js";import{d as Cf481}from"./chunk-LNP7HEMP.js";import{g as Dl481}from"./chunk-2B2FLIKC.js";import{c as r,e as o}from"./chunk-NQOCXXA2.js";import{g as w,h as E}from"./chunk-6NADHKLT.js";import{m as Rp481}from"./chunk-SGWIBJH6.js";var T={general:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",maersk:"MAERSK",apl:"APL"},l={q:"",template:"",charge_type:"",job_category:"",data_type:"",prefix:"",bdate_from:"",bdate_to:""};l.customer_id="";l.company_id="";l.status="";async function M(y,f={}){let g={charge:f.charge||"SERVICE",group:f.group||"NJ",mode:"accounting",queue:"billing_posted",scope:"all",filters:{}};y.innerHTML=`
    <div class="card bl-filter">
      
      <div class="bl-row">
        <input class="inp" id="bl-q" autocomplete="off"
          placeholder="\u{1F50D} Billing Note / Date / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 / Invoice / House B/L / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D / \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19 / \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 / \u0E42\u0E2B\u0E21\u0E14">
        <label class="bl-dt">Date \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48 <input class="inp" type="date" id="bl-from"></label>
        <label class="bl-dt">\u0E16\u0E36\u0E07 <input class="inp" type="date" id="bl-to"></label>
        
        <label class="bl-lb" for="bl-pfx">\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02</label>
        <select class="sel" id="bl-pfx">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          <option value="NJL">NJL</option>
          <option value="NJ">NJ</option>
          <option value="GY">GY</option>
          <option value="W">W</option>
        </select>
        
        <label class="bl-lb" for="bl-ctype">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19</label>
        <select class="sel" id="bl-ctype">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          <option value="ADVANCE">ADVANCE</option>
          <option value="SERVICE">SERVICE</option>
        </select>
        
        <label class="bl-lb" for="bl-cust">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
        <select class="sel bl-sel-w" id="bl-cust"><option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option></select>
        <label class="bl-lb" for="bl-comp">\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
        <select class="sel bl-sel-w" id="bl-comp"><option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option></select>
        
        <label class="bl-lb" for="bl-st">\u0E2A\u0E16\u0E32\u0E19\u0E30</label>
        <select class="sel" id="bl-st">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
        </select>
        <span class="bl-acts518"><button class="btn btn-p btn-sm" id="bl-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        <button class="btn btn-sm bl-btn518 bl-red518" id="bl-sel-clear" disabled>\u0E25\u0E49\u0E32\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
        <button class="btn btn-sm bl-btn518 bl-green518" id="bl-export" title="EXPORT EXCEL \u0E40\u0E09\u0E1E\u0E32\u0E30 BILLING NOTE \u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01">\u{1F4CA} EXPORT</button>
        <button class="btn btn-p btn-sm" id="bl-new">\uFF0B \u0E2A\u0E23\u0E49\u0E32\u0E07 Billing PDF</button>
        <span class="bl-sel517" id="bl-sel-n"></span></span>
      </div>
      
    </div>
    <div class="card">
      
      
      <div class="tbl-wrap"><table class="tbl rowclick">
        <thead><tr>
          <th style="width:38px" class="center"><input type="checkbox" id="bl-cb-all" title="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (\u0E15\u0E32\u0E21\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E41\u0E25\u0E30\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 \u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32)"></th>
          <th style="width:150px">Billing Note no.</th>
          <th style="width:86px">\u0E2A\u0E16\u0E32\u0E19\u0E30</th>
          <th style="width:100px">Date</th>
          <th style="width:90px">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</th>
          <th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
          
          <th>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th>
          <th style="width:170px" class="bl-h529">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
          <th style="width:110px" class="bl-h529">\u0E42\u0E2B\u0E21\u0E14</th>
          <th style="width:80px" class="center">\u0E08\u0E33\u0E19\u0E27\u0E19 JOB</th>
          <th style="width:140px">\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          <th style="width:130px">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          <th style="width:150px" class="center bl-acts-h">\u2699\uFE0F \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
          
        </tr></thead>
        <tbody id="bl-tb">
          <tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>
        </tbody>
      </table></div>
    </div>`;let e=t=>y.querySelector(t),d=e("#bl-tb"),S=t=>`<tr data-bid="${o(t.id)}" data-tpl="${o(t.template)}">
      ${CB517(t)}
      <td class="t-b">${o(t.billing_no||"\u2014")}</td>
      <td><span class="bl-st ${t.status==="POSTED"?"is-posted":"is-draft"}">${t.status==="POSTED"?"Posted":"Draft"}</span></td>
      <td>${r(t.billing_date)||"-"}</td>
      <td>${o(T[t.template]||t.template||"-")}</td>
      <td class="ellip" title="${o(t.customer_names||"")}">${o(t.customer_names||"-")}</td>
      <td class="ellip" title="${o(t.company_names||"")}">${o(t.company_names||"-")}</td>
      <td class="ellip bl-h529">${o(t.job_category||"-")}</td>
      <td class="bl-h529">${o(t.data_type||"-")}</td>
      <td class="center">${Number(t.job_count)||0}</td>
      <td class="ellip">${o(t.created_by_name||"-")}</td>
      <td>${r(String(t.created_at||"").slice(0,10))||"-"}</td>
      <td class="bl-acts"><div class="bl-act"><button type="button" class="btn btn-o btn-sm" data-bl-act="edit" data-bid="${o(t.id)}" data-tpl="${o(t.template)}">\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02</button>${Dl481("ACCOUNTING")?`<button type="button" class="btn btn-danger-soft btn-sm" data-bl-act="del" data-bid="${o(t.id)}" data-bno="${o(t.billing_no||"")}" data-st="${o(t.status||"")}">\u{1F5D1}\uFE0F \u0E25\u0E1A</button>`:""}</div></td>
    </tr>`,v=(t,a,s)=>{if(!t)return;let c=Array.isArray(a)?a:[],b=new Set,p='<option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>';if(c.forEach(i=>{if(!i||!i.id||b.has(i.id))return;b.add(i.id);let _=(i.code?i.code+" \u2014 ":"")+(i.name||"");p+=`<option value="${o(i.id)}">${o(_)}</option>`}),s&&!b.has(s)){let i=t.querySelector(`option[value="${s}"]`);p+=i?i.outerHTML:`<option value="${o(s)}">${o(s)}</option>`}t.innerHTML=p,t.value=s||""};async function n(){let t=q("bl");d.innerHTML='<tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>';try{let a=await w({q:l.q||null,template:l.template||null,prefix:l.prefix||null,status:l.status||null,charge_type:l.charge_type||null,job_category:l.job_category||null,data_type:l.data_type||null,bdate_from:l.bdate_from||null,bdate_to:l.bdate_to||null,limit:200,...l.customer_id?{customer_ids:[l.customer_id]}:{},...l.company_id?{company_ids:[l.company_id]}:{}});if(!m("bl",t))return;let s=a&&a.rows||[];v(e("#bl-cust"),a&&a.customers,l.customer_id),v(e("#bl-comp"),a&&a.companies,l.company_id);TT517.n=a&&a.total||s.length,setTimeout(()=>UP517(y),0);let c=e("#bl-cnt");c&&(c.textContent=s.length?"\u0E1E\u0E1A "+(a&&a.total||s.length)+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":""),d.innerHTML=s.length?s.map(S).join(""):'<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'}catch(a){if(!m("bl",t))return;d.innerHTML='<tr><td colspan="11" class="center t-3">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',d.querySelector("[data-ld-retry]").onclick=()=>n(),u(a,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let A=(t,a)=>h(g,a==="apl"?"apl":"std",{billingId:t,onSaved:n});d.addEventListener("click",async t=>{let k481=t.target.closest("[data-bl-act]");if(k481&&d.contains(k481)){t.stopPropagation();if(k481.dataset.blAct==="edit"){A(k481.dataset.bid,k481.dataset.tpl);return}let no481=k481.dataset.bno||"",lab481=no481||"(Draft \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02)";if(!await Cf481("\u0E25\u0E1A BILLING PDF","\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?<br>BILLING NOTE : <b>"+o(lab481)+"</b><br>\u0E2A\u0E16\u0E32\u0E19\u0E30 : <b>"+(k481.dataset.st==="POSTED"?"Posted":"Draft")+"</b><br><span class=\"t-xs t-3\">\u0E25\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49 \u00B7 JOB / INVOICE \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A \u00B7 \u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E33\u0E19\u0E27\u0E13\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E19\u0E17\u0E35 \u00B7 \u0E25\u0E1A\u0E43\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 = \u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E43\u0E1A\u0E16\u0E31\u0E14\u0E44\u0E1B</span>","\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A","\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"))return;k481.disabled=!0;try{await Rp481("njacc_billing_delete",{p:{id:k481.dataset.bid}});x("\u0E25\u0E1A BILLING "+lab481+" \u0E41\u0E25\u0E49\u0E27","ok");let tr481=k481.closest("tr");tr481&&tr481.remove(),d.querySelector("tr[data-bid]")||(d.innerHTML='<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'),n()}catch(e481){k481.disabled=!1;let m481=String(e481&&e481.message||"");u(/NJACC_FORBIDDEN|NJACC_DENIED|NJACC_MODULE_DENIED/.test(m481)?new Error("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E1A\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49"):/NJACC_BILLING_NOT_FOUND/.test(m481)?new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49 (\u0E2D\u0E32\u0E08\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27)"):e481,"\u0E25\u0E1A BILLING \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),/NJACC_BILLING_NOT_FOUND/.test(m481)&&n()}return}if(t.target.closest(".bl-cb517"))return;let a=t.target.closest("tr[data-bid]");!a||!d.contains(a)||A(a.dataset.bid,a.dataset.tpl)}),e("#bl-export").onclick=async()=>{let t=SO517();if(!t.length){x("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 BILLING NOTE NO. \u0E01\u0E48\u0E2D\u0E19 EXPORT","err");return}let a=e("#bl-export");a.disabled=!0;let s=a.textContent;try{let c=new Array(t.length),b=0,p=0,i=async()=>{for(;b<t.length;){let $=b++;c[$]=await E(t[$]),p+=1,a.textContent=`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${p}/${t.length}\u2026`}};await Promise.all(Array.from({length:Math.min(4,t.length)},i)),await(await import("./billing-report-GNOCNBGN.js")).exportSelectedBillingReport(c)}catch(c){u(c,"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{a.disabled=!1,a.textContent=s}},BI517(y,d,w),e("#bl-new").onclick=()=>h(g,"std",{onSaved:n}),e("#bl-q").addEventListener("input",()=>{l.q=e("#bl-q").value.trim(),L("bl-q",n,300)}),e("#bl-from").onchange=()=>{l.bdate_from=e("#bl-from").value,n()},e("#bl-to").onchange=()=>{l.bdate_to=e("#bl-to").value,n()},e("#bl-pfx").onchange=()=>{l.prefix=e("#bl-pfx").value,n()},e("#bl-ctype").onchange=()=>{l.charge_type=e("#bl-ctype").value,n()},e("#bl-st").onchange=()=>{l.status=e("#bl-st").value,n()},e("#bl-go").onclick=()=>{l.q=e("#bl-q").value.trim(),n()},e("#bl-cust").onchange=()=>{l.customer_id=e("#bl-cust").value,n()},e("#bl-comp").onchange=()=>{l.company_id=e("#bl-comp").value,n()},e("#bl-q").value=l.q,e("#bl-from").value=l.bdate_from,e("#bl-to").value=l.bdate_to,e("#bl-ctype").value=l.charge_type,e("#bl-pfx").value=l.prefix,e("#bl-st").value=l.status,await n()}/* \u2550\u2550\u2550 V.517 BILLING PDF (\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23) : Checkbox \u0E40\u0E25\u0E37\u0E2D\u0E01 BILLING NOTE (REF) \u00B7 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E15\u0E32\u0E21\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32/\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32 \u00B7 EXPORT \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2550\u2550\u2550 */
var SL517 = new Map(), TT517 = { n: 0 };
function CB517(t) {
  let id = String((t && t.id) || "");
  return `<td class="center bl-cb517" style="width:38px"><input type="checkbox" data-bl-cb="${o(id)}" data-bno="${o((t && t.billing_no) || "")}"${SL517.has(id) ? " checked" : ""} aria-label="\u0E40\u0E25\u0E37\u0E2D\u0E01 ${o((t && t.billing_no) || "Draft")}"></td>`;
}
function UP517(y) {
  let n = y.querySelector("#bl-sel-n"), c = y.querySelector("#bl-sel-clear"), all = y.querySelector("#bl-cb-all"), bx = [...y.querySelectorAll("#bl-tb [data-bl-cb]")];
  n && (n.textContent = SL517.size ? "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 " + SL517.size + " REF" : "");
  c && (c.disabled = !SL517.size);
  if (all) {
    let k = bx.filter((b) => SL517.has(b.dataset.blCb)).length;
    all.checked = bx.length > 0 && k === bx.length;
    all.indeterminate = !all.checked && k > 0;
  }
}
function QP517() {
  return { q: l.q || null, template: l.template || null, prefix: l.prefix || null, status: l.status || null, charge_type: l.charge_type || null, job_category: l.job_category || null, data_type: l.data_type || null, bdate_from: l.bdate_from || null, bdate_to: l.bdate_to || null, ...(l.customer_id ? { customer_ids: [l.customer_id] } : {}), ...(l.company_id ? { company_ids: [l.company_id] } : {}) };
}
async function AL517(y, w) {
  let bx = [...y.querySelectorAll("#bl-tb [data-bl-cb]")].map((b) => [b.dataset.blCb, b.dataset.bno || ""]);
  if (TT517.n <= bx.length) return bx;
  let out = [], seen = new Set();
  for (let off = 0; off < 100000; off += 500) {
    let r = await w(Object.assign(QP517(), { limit: 500, offset: off })), rows = (r && r.rows) || [];
    rows.forEach((x) => { x && x.id && !seen.has(x.id) && (seen.add(x.id), out.push([String(x.id), x.billing_no || ""])); });
    if (!rows.length || off + 500 >= Number((r && r.total) || 0)) break;
  }
  return out;
}
function BI517(y, d, w) {
  d.addEventListener("change", (e) => {
    let c = e.target.closest("[data-bl-cb]");
    if (!c) return;
    c.checked ? SL517.set(c.dataset.blCb, c.dataset.bno || "") : SL517.delete(c.dataset.blCb);
    UP517(y);
  });
  d.addEventListener("click", (e) => {
    let td = e.target.closest(".bl-cb517");
    if (!td || e.target.matches("input")) return;
    let c = td.querySelector("input");
    c && c.click();
  });
  let all = y.querySelector("#bl-cb-all");
  all && (all.onchange = async () => {
    let on = all.checked;
    all.disabled = !0;
    try {
      (await AL517(y, w)).forEach(([id, no]) => (on ? SL517.set(id, no) : SL517.delete(id)));
      y.querySelectorAll("#bl-tb [data-bl-cb]").forEach((b) => { b.checked = SL517.has(b.dataset.blCb); });
    } catch (er) { x("\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07", "err"); }
    all.disabled = !1;
    UP517(y);
  });
  let cl = y.querySelector("#bl-sel-clear");
  cl && (cl.onclick = () => {
    SL517.clear();
    y.querySelectorAll("#bl-tb [data-bl-cb]").forEach((b) => { b.checked = !1; });
    UP517(y);
  });
  UP517(y);
}
/* \u0E40\u0E23\u0E35\u0E22\u0E07 REF \u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07 : \u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 -> \u0E1B\u0E35\u0E40\u0E14\u0E37\u0E2D\u0E19 -> \u0E25\u0E33\u0E14\u0E31\u0E1A (\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E44\u0E27\u0E49\u0E17\u0E49\u0E32\u0E22) */
function SK517(b) { let m = /^([A-Z]+)(\d{4})-(\d+)$/.exec(String(b || "").trim()); return m ? [0, m[1], +m[2], +m[3]] : [1, "", 0, 0]; }
function SC517(a, b) { let p = SK517(a), q = SK517(b); for (let i = 0; i < 4; i++) { if (p[i] < q[i]) return -1; if (p[i] > q[i]) return 1; } return 0; }
function SO517() { return [...SL517.entries()].sort((a, b) => SC517(a[1], b[1])).map((e) => e[0]); }

export{M as render};
