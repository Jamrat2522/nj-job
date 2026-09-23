import{e as h}from"./chunk-SRP2O3U6.js";import"./chunk-UWAYW6DC.js";import"./chunk-EVZDPOX3.js";import"./chunk-46QUQC76.js";import{a as x,b as m,c as w}from"./chunk-OPGKUGLK.js";import{a as u}from"./chunk-YM5GFE6V.js";import{g,h as $}from"./chunk-AFTQYZPU.js";import"./chunk-GDT6F23K.js";import"./chunk-OFOOXWUM.js";import"./chunk-DIH2PLYD.js";import{c as r,e as s}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";var T={general:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",maersk:"MAERSK",apl:"APL"},t={q:"",template:"",charge_type:"",job_category:"",data_type:"",prefix:"",bdate_from:"",bdate_to:""};t.customer_id="";t.company_id="";t.status="";async function B(f,y={}){let v={charge:y.charge||"SERVICE",group:y.group||"NJ",mode:"accounting",queue:"pending_invoice",scope:"all",filters:{}};f.innerHTML=`
    <div class="card bl-filter">
      
      <div class="bl-row">
        <input class="inp" id="bl-q" autocomplete="off"
          placeholder="\u{1F50D} Billing Note / Date / NJL-NJ-GY-W / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D / \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19 / \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 / \u0E42\u0E2B\u0E21\u0E14">
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
        <button class="btn btn-p btn-sm" id="bl-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      </div>
      
    </div>
    <div class="card">
      
      <div class="bl-new">
        <button class="btn btn-p" id="bl-new">\uFF0B \u0E2A\u0E23\u0E49\u0E32\u0E07 Billing PDF</button>
        <span class="bl-lb">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 (\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B / MAERSK / APL) \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07</span>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th style="width:150px">Billing Note no.</th>
          <th style="width:86px">\u0E2A\u0E16\u0E32\u0E19\u0E30</th>
          <th style="width:100px">Date</th>
          <th style="width:90px">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</th>
          <th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
          <th style="width:170px">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
          <th style="width:110px">\u0E42\u0E2B\u0E21\u0E14</th>
          <th style="width:80px" class="center">\u0E08\u0E33\u0E19\u0E27\u0E19 JOB</th>
          <th style="width:140px">\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          <th style="width:130px">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          <th style="width:190px" class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
        </tr></thead>
        <tbody id="bl-tb">
          <tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>
        </tbody>
      </table></div>
    </div>`;let e=l=>f.querySelector(l),p=e("#bl-tb"),E=l=>`<tr data-bid="${s(l.id)}" data-tpl="${s(l.template)}">
      
      <td class="t-b">${s(l.billing_no||"\u2014")}</td>
      <td><span class="bl-st ${l.status==="POSTED"?"is-posted":"is-draft"}">${l.status==="POSTED"?"Posted":"Draft"}</span></td>
      <td>${r(l.billing_date)||"-"}</td>
      <td>${s(T[l.template]||l.template||"-")}</td>
      <td class="ellip">${s(l.customer_names||"-")}</td>
      <td class="ellip">${s(l.job_category||"-")}</td>
      <td>${s(l.data_type||"-")}</td>
      <td class="center">${Number(l.job_count)||0}</td>
      <td class="ellip">${s(l.created_by_name||"-")}</td>
      <td>${r(String(l.created_at||"").slice(0,10))||"-"}</td>
      <td class="center bl-act">
        <button class="btn btn-o btn-sm" data-open="${s(l.id)}">\u0E40\u0E1B\u0E34\u0E14</button>
        <button class="btn btn-o btn-sm" data-report="${s(l.id)}">\u{1F4CA} REPORT</button></td>
    </tr>`,_=(l,a,o)=>{if(!l)return;let c=Array.isArray(a)?a:[],d=new Set,b='<option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>';if(c.forEach(i=>{if(!i||!i.id||d.has(i.id))return;d.add(i.id);let q=(i.code?i.code+" \u2014 ":"")+(i.name||"");b+=`<option value="${s(i.id)}">${s(q)}</option>`}),o&&!d.has(o)){let i=l.querySelector(`option[value="${o}"]`);b+=i?i.outerHTML:`<option value="${s(o)}">${s(o)}</option>`}l.innerHTML=b,l.value=o||""};async function n(){let l=x("bl");p.innerHTML='<tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>';try{let a=await g({q:t.q||null,template:t.template||null,prefix:t.prefix||null,status:t.status||null,charge_type:t.charge_type||null,job_category:t.job_category||null,data_type:t.data_type||null,bdate_from:t.bdate_from||null,bdate_to:t.bdate_to||null,limit:200,...t.customer_id?{customer_ids:[t.customer_id]}:{},...t.company_id?{company_ids:[t.company_id]}:{}});if(!m("bl",l))return;let o=a&&a.rows||[];_(e("#bl-cust"),a&&a.customers,t.customer_id),_(e("#bl-comp"),a&&a.companies,t.company_id);let c=e("#bl-cnt");c&&(c.textContent=o.length?"\u0E1E\u0E1A "+(a&&a.total||o.length)+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":""),p.innerHTML=o.length?o.map(E).join(""):'<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'}catch(a){if(!m("bl",l))return;p.innerHTML='<tr><td colspan="11" class="center t-3">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',u(a,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let L=(l,a)=>h(v,a==="apl"?"apl":"std",{billingId:l,onSaved:n});p.addEventListener("click",async l=>{let a=l.target.closest("[data-report]");if(a){a.disabled=!0;try{let d=await $(a.dataset.report);await(await import("./billing-report-NJE2BPKH.js")).exportBillingReport(d)}catch(d){u(d,"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{a.disabled=!1}return}let o=l.target.closest("[data-open]");if(!o)return;let c=o.closest("tr");L(o.dataset.open,c&&c.dataset.tpl)}),e("#bl-new").onclick=()=>h(v,"std",{onSaved:n}),e("#bl-q").addEventListener("input",()=>{t.q=e("#bl-q").value.trim(),w("bl-q",n,300)}),e("#bl-from").onchange=()=>{t.bdate_from=e("#bl-from").value,n()},e("#bl-to").onchange=()=>{t.bdate_to=e("#bl-to").value,n()},e("#bl-pfx").onchange=()=>{t.prefix=e("#bl-pfx").value,n()},e("#bl-ctype").onchange=()=>{t.charge_type=e("#bl-ctype").value,n()},e("#bl-st").onchange=()=>{t.status=e("#bl-st").value,n()},e("#bl-go").onclick=()=>{t.q=e("#bl-q").value.trim(),n()},e("#bl-cust").onchange=()=>{t.customer_id=e("#bl-cust").value,n()},e("#bl-comp").onchange=()=>{t.company_id=e("#bl-comp").value,n()},e("#bl-q").value=t.q,e("#bl-from").value=t.bdate_from,e("#bl-to").value=t.bdate_to,e("#bl-ctype").value=t.charge_type,e("#bl-pfx").value=t.prefix,e("#bl-st").value=t.status,await n()}export{B as render};
