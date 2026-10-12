import{e as h}from"./chunk-DAR6LN56.js";import"./chunk-UWAYW6DC.js";import"./chunk-EVZDPOX3.js";import"./chunk-FL6ZW7SA.js";import{a as q,b as m,c as L}from"./chunk-OPGKUGLK.js";import{a as u}from"./chunk-YM5GFE6V.js";import{g as w,h as E}from"./chunk-ACC3GWV5.js";import"./chunk-GDT6F23K.js";import{a as x}from"./chunk-OFOOXWUM.js";import"./chunk-DIH2PLYD.js";import{c as r,e as o}from"./chunk-PCFU74ZV.js";import"./chunk-SGWIBJH6.js";var T={general:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",maersk:"MAERSK",apl:"APL"},l={q:"",template:"",charge_type:"",job_category:"",data_type:"",prefix:"",bdate_from:"",bdate_to:""};l.customer_id="";l.company_id="";l.status="";async function M(y,f={}){let g={charge:f.charge||"SERVICE",group:f.group||"NJ",mode:"accounting",queue:"pending_invoice",scope:"all",filters:{}};y.innerHTML=`
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
    </div>`;let e=t=>y.querySelector(t),d=e("#bl-tb"),S=t=>`<tr data-bid="${o(t.id)}" data-tpl="${o(t.template)}">
      
      <td class="t-b">${o(t.billing_no||"\u2014")}</td>
      <td><span class="bl-st ${t.status==="POSTED"?"is-posted":"is-draft"}">${t.status==="POSTED"?"Posted":"Draft"}</span></td>
      <td>${r(t.billing_date)||"-"}</td>
      <td>${o(T[t.template]||t.template||"-")}</td>
      <td class="ellip" title="${o(t.customer_names||"")}">${o(t.customer_names||"-")}</td>
      <td class="ellip" title="${o(t.company_names||"")}">${o(t.company_names||"-")}</td>
      <td class="ellip">${o(t.job_category||"-")}</td>
      <td>${o(t.data_type||"-")}</td>
      <td class="center">${Number(t.job_count)||0}</td>
      <td class="ellip">${o(t.created_by_name||"-")}</td>
      <td>${r(String(t.created_at||"").slice(0,10))||"-"}</td>
    </tr>`,v=(t,a,s)=>{if(!t)return;let c=Array.isArray(a)?a:[],b=new Set,p='<option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>';if(c.forEach(i=>{if(!i||!i.id||b.has(i.id))return;b.add(i.id);let _=(i.code?i.code+" \u2014 ":"")+(i.name||"");p+=`<option value="${o(i.id)}">${o(_)}</option>`}),s&&!b.has(s)){let i=t.querySelector(`option[value="${s}"]`);p+=i?i.outerHTML:`<option value="${o(s)}">${o(s)}</option>`}t.innerHTML=p,t.value=s||""};async function n(){let t=q("bl");d.innerHTML='<tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>';try{let a=await w({q:l.q||null,template:l.template||null,prefix:l.prefix||null,status:l.status||null,charge_type:l.charge_type||null,job_category:l.job_category||null,data_type:l.data_type||null,bdate_from:l.bdate_from||null,bdate_to:l.bdate_to||null,limit:200,...l.customer_id?{customer_ids:[l.customer_id]}:{},...l.company_id?{company_ids:[l.company_id]}:{}});if(!m("bl",t))return;let s=a&&a.rows||[];v(e("#bl-cust"),a&&a.customers,l.customer_id),v(e("#bl-comp"),a&&a.companies,l.company_id);let c=e("#bl-cnt");c&&(c.textContent=s.length?"\u0E1E\u0E1A "+(a&&a.total||s.length)+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":""),d.innerHTML=s.length?s.map(S).join(""):'<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'}catch(a){if(!m("bl",t))return;d.innerHTML='<tr><td colspan="11" class="center t-3">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',d.querySelector("[data-ld-retry]").onclick=()=>n(),u(a,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let A=(t,a)=>h(g,a==="apl"?"apl":"std",{billingId:t,onSaved:n});d.addEventListener("click",t=>{let a=t.target.closest("tr[data-bid]");!a||!d.contains(a)||A(a.dataset.bid,a.dataset.tpl)}),e("#bl-export").onclick=async()=>{let t=[...d.querySelectorAll("tr[data-bid]")].map(c=>c.dataset.bid);if(!t.length){x("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E15\u0E32\u0E21 Filter \u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19","err");return}let a=e("#bl-export");a.disabled=!0;let s=a.textContent;try{let c=new Array(t.length),b=0,p=0,i=async()=>{for(;b<t.length;){let $=b++;c[$]=await E(t[$]),p+=1,a.textContent=`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${p}/${t.length}\u2026`}};await Promise.all(Array.from({length:Math.min(4,t.length)},i)),await(await import("./billing-report-GGZNIAEA.js")).exportCombinedBillingReport(c)}catch(c){u(c,"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{a.disabled=!1,a.textContent=s}},e("#bl-new").onclick=()=>h(g,"std",{onSaved:n}),e("#bl-q").addEventListener("input",()=>{l.q=e("#bl-q").value.trim(),L("bl-q",n,300)}),e("#bl-from").onchange=()=>{l.bdate_from=e("#bl-from").value,n()},e("#bl-to").onchange=()=>{l.bdate_to=e("#bl-to").value,n()},e("#bl-pfx").onchange=()=>{l.prefix=e("#bl-pfx").value,n()},e("#bl-ctype").onchange=()=>{l.charge_type=e("#bl-ctype").value,n()},e("#bl-st").onchange=()=>{l.status=e("#bl-st").value,n()},e("#bl-go").onclick=()=>{l.q=e("#bl-q").value.trim(),n()},e("#bl-cust").onchange=()=>{l.customer_id=e("#bl-cust").value,n()},e("#bl-comp").onchange=()=>{l.company_id=e("#bl-comp").value,n()},e("#bl-q").value=l.q,e("#bl-from").value=l.bdate_from,e("#bl-to").value=l.bdate_to,e("#bl-ctype").value=l.charge_type,e("#bl-pfx").value=l.prefix,e("#bl-st").value=l.status,await n()}export{M as render};
