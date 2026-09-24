import{e as h}from"./chunk-TXJBVYAP.js";import"./chunk-UWAYW6DC.js";import"./chunk-EVZDPOX3.js";import"./chunk-46QUQC76.js";import{a as w,b as m,c as E}from"./chunk-OPGKUGLK.js";import{a as u}from"./chunk-YM5GFE6V.js";import{g as $,h as x}from"./chunk-AFTQYZPU.js";import"./chunk-GDT6F23K.js";import{a as g}from"./chunk-OFOOXWUM.js";import"./chunk-DIH2PLYD.js";import{c as r,e as n}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";var T={general:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",maersk:"MAERSK",apl:"APL"},l={q:"",template:"",charge_type:"",job_category:"",data_type:"",prefix:"",bdate_from:"",bdate_to:""};l.customer_id="";l.company_id="";l.status="";async function M(f,y={}){let v={charge:y.charge||"SERVICE",group:y.group||"NJ",mode:"accounting",queue:"pending_invoice",scope:"all",filters:{}};f.innerHTML=`
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
        
        <button class="btn btn-o" id="bl-export">\u{1F4CA} EXPORT</button>
      </div>
      
      <div class="tbl-wrap"><table class="tbl rowclick">
        <thead><tr>
          <th style="width:150px">Billing Note no.</th>
          <th style="width:86px">\u0E2A\u0E16\u0E32\u0E19\u0E30</th>
          <th style="width:100px">Date</th>
          <th style="width:90px">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</th>
          <th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
          
          <th>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th>
          <th style="width:170px">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
          <th style="width:110px">\u0E42\u0E2B\u0E21\u0E14</th>
          <th style="width:80px" class="center">\u0E08\u0E33\u0E19\u0E27\u0E19 JOB</th>
          <th style="width:140px">\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          <th style="width:130px">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07</th>
          
        </tr></thead>
        <tbody id="bl-tb">
          <tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>
        </tbody>
      </table></div>
    </div>`;let e=t=>f.querySelector(t),c=e("#bl-tb"),L=t=>`<tr data-bid="${n(t.id)}" data-tpl="${n(t.template)}">
      
      <td class="t-b">${n(t.billing_no||"\u2014")}</td>
      <td><span class="bl-st ${t.status==="POSTED"?"is-posted":"is-draft"}">${t.status==="POSTED"?"Posted":"Draft"}</span></td>
      <td>${r(t.billing_date)||"-"}</td>
      <td>${n(T[t.template]||t.template||"-")}</td>
      <td class="ellip" title="${n(t.customer_names||"")}">${n(t.customer_names||"-")}</td>
      <td class="ellip" title="${n(t.company_names||"")}">${n(t.company_names||"-")}</td>
      <td class="ellip">${n(t.job_category||"-")}</td>
      <td>${n(t.data_type||"-")}</td>
      <td class="center">${Number(t.job_count)||0}</td>
      <td class="ellip">${n(t.created_by_name||"-")}</td>
      <td>${r(String(t.created_at||"").slice(0,10))||"-"}</td>
    </tr>`,_=(t,a,o)=>{if(!t)return;let d=Array.isArray(a)?a:[],p=new Set,b='<option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>';if(d.forEach(i=>{if(!i||!i.id||p.has(i.id))return;p.add(i.id);let S=(i.code?i.code+" \u2014 ":"")+(i.name||"");b+=`<option value="${n(i.id)}">${n(S)}</option>`}),o&&!p.has(o)){let i=t.querySelector(`option[value="${o}"]`);b+=i?i.outerHTML:`<option value="${n(o)}">${n(o)}</option>`}t.innerHTML=b,t.value=o||""};async function s(){let t=w("bl");c.innerHTML='<tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>';try{let a=await $({q:l.q||null,template:l.template||null,prefix:l.prefix||null,status:l.status||null,charge_type:l.charge_type||null,job_category:l.job_category||null,data_type:l.data_type||null,bdate_from:l.bdate_from||null,bdate_to:l.bdate_to||null,limit:200,...l.customer_id?{customer_ids:[l.customer_id]}:{},...l.company_id?{company_ids:[l.company_id]}:{}});if(!m("bl",t))return;let o=a&&a.rows||[];_(e("#bl-cust"),a&&a.customers,l.customer_id),_(e("#bl-comp"),a&&a.companies,l.company_id);let d=e("#bl-cnt");d&&(d.textContent=o.length?"\u0E1E\u0E1A "+(a&&a.total||o.length)+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":""),c.innerHTML=o.length?o.map(L).join(""):'<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'}catch(a){if(!m("bl",t))return;c.innerHTML='<tr><td colspan="11" class="center t-3">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',u(a,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let q=(t,a)=>h(v,a==="apl"?"apl":"std",{billingId:t,onSaved:s});c.addEventListener("click",t=>{let a=t.target.closest("tr[data-bid]");!a||!c.contains(a)||q(a.dataset.bid,a.dataset.tpl)}),e("#bl-export").onclick=async()=>{let t=[...c.querySelectorAll("tr[data-bid]")].map(o=>o.dataset.bid);if(!t.length){g("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E15\u0E32\u0E21 Filter \u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19","err");return}let a=e("#bl-export");a.disabled=!0;try{let o=[];for(let p of t)o.push(await x(p));await(await import("./billing-report-GEY3H73Q.js")).exportCombinedBillingReport(o)}catch(o){u(o,"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{a.disabled=!1}},e("#bl-new").onclick=()=>h(v,"std",{onSaved:s}),e("#bl-q").addEventListener("input",()=>{l.q=e("#bl-q").value.trim(),E("bl-q",s,300)}),e("#bl-from").onchange=()=>{l.bdate_from=e("#bl-from").value,s()},e("#bl-to").onchange=()=>{l.bdate_to=e("#bl-to").value,s()},e("#bl-pfx").onchange=()=>{l.prefix=e("#bl-pfx").value,s()},e("#bl-ctype").onchange=()=>{l.charge_type=e("#bl-ctype").value,s()},e("#bl-st").onchange=()=>{l.status=e("#bl-st").value,s()},e("#bl-go").onclick=()=>{l.q=e("#bl-q").value.trim(),s()},e("#bl-cust").onchange=()=>{l.customer_id=e("#bl-cust").value,s()},e("#bl-comp").onchange=()=>{l.company_id=e("#bl-comp").value,s()},e("#bl-q").value=l.q,e("#bl-from").value=l.bdate_from,e("#bl-to").value=l.bdate_to,e("#bl-ctype").value=l.charge_type,e("#bl-pfx").value=l.prefix,e("#bl-st").value=l.status,await s()}export{M as render};
