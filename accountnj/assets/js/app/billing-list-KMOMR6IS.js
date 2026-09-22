import{e as r}from"./chunk-VCTQ52M2.js";import"./chunk-UWAYW6DC.js";import{a as $,c as x}from"./chunk-NE3GGZDN.js";import"./chunk-EVZDPOX3.js";import"./chunk-46QUQC76.js";import"./chunk-2OWLQSES.js";import{a as y,b as p,c as _}from"./chunk-OPGKUGLK.js";import{a as b}from"./chunk-YM5GFE6V.js";import{g,h as f}from"./chunk-AFTQYZPU.js";import"./chunk-GDT6F23K.js";import"./chunk-OFOOXWUM.js";import"./chunk-DIH2PLYD.js";import{c as d,e as a}from"./chunk-PCFU74ZV.js";import"./chunk-F5ETAYOF.js";var L={general:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",maersk:"MAERSK",apl:"APL"},e={q:"",template:"",charge_type:"",job_category:"",data_type:"",prefix:"",bdate_from:"",bdate_to:""};e.status="";async function A(u,h={}){let m={charge:h.charge||"SERVICE",group:h.group||"NJ",mode:"accounting",queue:"pending_invoice",scope:"all",filters:{}};u.innerHTML=`
    <div class="page-head">
      <h2>ACCOUNTING \u2014 BILLING PDF</h2>
      <div class="page-sub">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E02 / Preview PDF \u0E44\u0E14\u0E49</div>
    </div>
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
        <label class="bl-lb" for="bl-cat">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</label>
        <select class="sel" id="bl-cat">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          ${$.map(t=>`<option value="${a(t)}">${a(t)}</option>`).join("")}
        </select>
        <label class="bl-lb" for="bl-mode">\u0E42\u0E2B\u0E21\u0E14</label>
        <select class="sel" id="bl-mode">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          ${x.map(t=>`<option value="${a(t)}">${a(t)}</option>`).join("")}
        </select>
        
        <label class="bl-lb" for="bl-st">\u0E2A\u0E16\u0E32\u0E19\u0E30</label>
        <select class="sel" id="bl-st">
          <option value="">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
        </select>
        <button class="btn btn-p btn-sm" id="bl-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      </div>
      
      <div class="bl-cnt-row"><span class="bl-cnt" id="bl-cnt"></span></div>
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
    </div>`;let l=t=>u.querySelector(t),i=l("#bl-tb"),w=t=>`<tr data-bid="${a(t.id)}" data-tpl="${a(t.template)}">
      
      <td class="t-b">${a(t.billing_no||"\u2014")}</td>
      <td><span class="bl-st ${t.status==="POSTED"?"is-posted":"is-draft"}">${t.status==="POSTED"?"Posted":"Draft"}</span></td>
      <td>${d(t.billing_date)||"-"}</td>
      <td>${a(L[t.template]||t.template||"-")}</td>
      <td class="ellip">${a(t.customer_names||"-")}</td>
      <td class="ellip">${a(t.job_category||"-")}</td>
      <td>${a(t.data_type||"-")}</td>
      <td class="center">${Number(t.job_count)||0}</td>
      <td class="ellip">${a(t.created_by_name||"-")}</td>
      <td>${d(String(t.created_at||"").slice(0,10))||"-"}</td>
      <td class="center bl-act">
        <button class="btn btn-o btn-sm" data-open="${a(t.id)}">\u0E40\u0E1B\u0E34\u0E14</button>
        <button class="btn btn-o btn-sm" data-report="${a(t.id)}">\u{1F4CA} REPORT</button></td>
    </tr>`;async function s(){let t=y("bl");i.innerHTML='<tr><td colspan="11" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>';try{let o=await g({q:e.q||null,template:e.template||null,prefix:e.prefix||null,status:e.status||null,charge_type:e.charge_type||null,job_category:e.job_category||null,data_type:e.data_type||null,bdate_from:e.bdate_from||null,bdate_to:e.bdate_to||null,limit:200});if(!p("bl",t))return;let n=o&&o.rows||[];l("#bl-cnt").textContent=n.length?"\u0E1E\u0E1A "+(o&&o.total||n.length)+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":"",i.innerHTML=n.length?n.map(w).join(""):'<tr><td colspan="11" class="center t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 Billing \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49</td></tr>'}catch(o){if(!p("bl",t))return;i.innerHTML='<tr><td colspan="11" class="center t-3">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',b(o,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let E=(t,o)=>r(m,o==="apl"?"apl":"std",{billingId:t,onSaved:s});i.addEventListener("click",async t=>{let o=t.target.closest("[data-report]");if(o){o.disabled=!0;try{let c=await f(o.dataset.report);await(await import("./billing-report-NJE2BPKH.js")).exportBillingReport(c)}catch(c){b(c,"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{o.disabled=!1}return}let n=t.target.closest("[data-open]");if(!n)return;let v=n.closest("tr");E(n.dataset.open,v&&v.dataset.tpl)}),l("#bl-new").onclick=()=>r(m,"std",{onSaved:s}),l("#bl-q").addEventListener("input",()=>{e.q=l("#bl-q").value.trim(),_("bl-q",s,300)}),l("#bl-from").onchange=()=>{e.bdate_from=l("#bl-from").value,s()},l("#bl-to").onchange=()=>{e.bdate_to=l("#bl-to").value,s()},l("#bl-pfx").onchange=()=>{e.prefix=l("#bl-pfx").value,s()},l("#bl-ctype").onchange=()=>{e.charge_type=l("#bl-ctype").value,s()},l("#bl-st").onchange=()=>{e.status=l("#bl-st").value,s()},l("#bl-go").onclick=()=>{e.q=l("#bl-q").value.trim(),s()},l("#bl-cat").onchange=()=>{e.job_category=l("#bl-cat").value,s()},l("#bl-mode").onchange=()=>{e.data_type=l("#bl-mode").value,s()},l("#bl-q").value=e.q,l("#bl-from").value=e.bdate_from,l("#bl-to").value=e.bdate_to,l("#bl-ctype").value=e.charge_type,l("#bl-cat").value=e.job_category,l("#bl-mode").value=e.data_type,l("#bl-pfx").value=e.prefix,l("#bl-st").value=e.status,await s()}export{A as render};
