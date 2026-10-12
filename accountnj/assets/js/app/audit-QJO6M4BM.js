import{a as u}from"./chunk-6REVCVGI.js";import{a as p,b as n}from"./chunk-OPGKUGLK.js";import{a as c}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import{e as a}from"./chunk-PCFU74ZV.js";import{m as l}from"./chunk-SGWIBJH6.js";var s={page:1,size:50};async function v(i){i.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19</h2></div>
      <button class="btn btn-o" id="au-refresh">\u21BB \u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E27\u0E25\u0E32</th><th>\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49</th><th>Action</th><th>Entity</th><th>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</th>
    </tr></thead><tbody id="au-tbody"><tr><td colspan="5" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="au-pgn"></div>`;async function r(){let o=p("audit");try{let d=await l("njacc_list_audit",{p_page:s.page,p_size:s.size});if(!n("audit",o))return;let e=d.rows||[];i.querySelector("#au-tbody").innerHTML=e.length?e.map(t=>`<tr>
        <td class="nowrap t-xs">${a(String(t.created_at||"").replace("T"," ").slice(0,19))}</td>
        <td>${a(t.full_name||"-")}</td>
        <td class="t-b">${a(t.action)}</td>
        <td class="t-xs">${a(t.entity_type||"")} ${a(String(t.entity_id||"").slice(0,8))}</td>
        <td class="t-xs ellip" style="max-width:380px" title="${a(JSON.stringify(t.detail||{}))}">${a(JSON.stringify(t.detail||{}))}</td>
      </tr>`).join(""):'<tr><td colspan="5" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34</td></tr>',u(i.querySelector("#au-pgn"),{page:s.page,size:s.size,total:d.total||0},({page:t,size:y})=>{s.page=t,s.size=y,r()})}catch(d){if(!n("audit",o))return;c(d);let e=i.querySelector("#au-tbody");e&&e.querySelector(".spin")&&(e.innerHTML='<tr><td colspan="5" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 <button type="button" class="btn btn-sm btn-o" data-ld-retry>\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48</button></td></tr>',e.querySelector("[data-ld-retry]").onclick=()=>{e.innerHTML='<tr><td colspan="5" class="load-row"><div class="spin"></div></td></tr>',r()})}}i.querySelector("#au-refresh").onclick=r,r()}export{v as render};
