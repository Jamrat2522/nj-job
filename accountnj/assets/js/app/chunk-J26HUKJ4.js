import{a as R,b as H,c as U,d as P,e as F,f as K,g as G}from"./chunk-IIDKIKVM.js";import{C as x,D as b,E as J,j as C,p as B,q as j,x as q,b as XJ506,i as XO506,CC751,a as XL753,SER785,ADV786}from"./chunk-FHYZBT2Q.js";import{k as XM506}from"./chunk-L5Z2NDJ3.js";import{a as XG506}from"./chunk-GDT6F23K.js";import{c as L}from"./chunk-Q7FMECGI.js";import{e as f}from"./chunk-OPGKUGLK.js";import{a as N}from"./chunk-YM5GFE6V.js";import{a as c}from"./chunk-OFOOXWUM.js";import{m as RPC753}from"./chunk-SGWIBJH6.js";import{a as k,b as y,d as m}from"./chunk-LNP7HEMP.js";import{c as $,e as s}from"./chunk-NQOCXXA2.js";import{k as _,m as A,n as M,o as D,p as E,q as O}from"./chunk-6NADHKLT.js";var w=[{a:"new-job",t:"+ \u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19",perm:"create",primary:!0},{a:"refresh",t:"\u21BB Refresh"},{a:"upload",t:"\u{1F4C1} Upload",perm:"edit"},{a:"export-excel",t:"\u{1F4D7} Export Excel",perm:"export"},{a:"export-ser785",t:"\u{1F4D7} Excel Ser",perm:"export"},{a:"export-adv786",t:"\u{1F4D7} Excel Adv",perm:"export"},{a:"paste-close",t:"\u{1F4CB} Paste \u0E08\u0E1A\u0E07\u0E32\u0E19",perm:"edit"},{a:"apl-upload",t:"\u2B06 APL Billing",perm:"edit"},{a:"billing-pdf",t:"\u{1F9FE} Billing PDF",perm:"export"},{a:"billing-pdf-apl",t:"\u{1F9FE} Billing PDF APL",perm:"export"},{a:"export-name",t:"\u{1F4E4} EXPORT NAME",perm:"export"}],z=[{a:"export-all",t:"\u{1F4E6} Export \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",perm:"export"},{a:"export-cust",t:"\u{1F464} Export Customer (ZIP)",perm:"export"},{a:"export-csv",t:"\u26A1 Export Fast CSV",perm:"export"},{a:"sum",t:"\u{1F9EE} \u0E04\u0E33\u0E19\u0E27\u0E13\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21"},{a:"upload-19",t:"\u2B06 Upload 1.9",perm:"edit"},{a:"close-upload",t:"\u2705 \u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19 (Upload)",perm:"edit"}],Q=[{a:"export-case",t:"\u{1F4C4} Export Excel CASE",perm:"export"},{a:"export-soa",t:"\u{1F4C4} Export SOA",perm:"export"},{a:"bulk-case",t:"\u{1F5C2} Bulk Case",perm:"edit"},{a:"fill-etd",t:"\u{1F6A2} \u0E40\u0E15\u0E34\u0E21 ETD",perm:"edit"},{a:"contacts",t:"\u{1F4C7} Contact List"},{a:"calcomp",t:"\u{1F4D7} CALCOMP",perm:"export"}],S=(a,t="")=>`<button class="btn ${a.primary?"btn-p":"btn-o"} btn-sm${t?" "+t:""}" data-tool="${a.a}">${a.t}</button>`,Z=a=>`<button class="tool-item" data-tool="${a.a}">${a.t}</button>`,W=["upload","paste-close","apl-upload","billing-pdf","billing-pdf-apl"],X=["new-job","refresh"],tt=["receipt","advance"],et=["new-job","refresh","billing-pdf","billing-pdf-apl"],ot=["export-excel"],rt=["sum"],at=["export-excel","refresh"],HB495=["upload","apl-upload","billing-pdf","billing-pdf-apl"];function lt(a){return at.map(t=>w.find(e=>e.a===t)).filter(t=>t&&(!t.perm||a[t.perm])).map(t=>S(t,"tb-btn tb-"+t.a)).join("")}function it(a,ch753){let t=w.find(e=>e.a==="new-job");return(t&&(!t.perm||a[t.perm])?S(t):"")+(String(ch753||"").toUpperCase()==="SERVICE"&&a&&a.create?`<button class="btn btn-o btn-sm up753-btn" data-tool="upload753"><svg class="up806-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>UPLOAD EXCEL</button>`:"")}function ct(a,t,e,o){let r=o==="document";if(r||o==="closed")return"";o==="accounting"&&XS506();let n=o==="accounting",l=tt.includes(o),d=o==="receipt",i=u=>(!u.perm||e[u.perm])&&!(r&&W.includes(u.a))&&!(n&&X.includes(u.a))&&!(n&&HB495.includes(u.a))&&!(l&&et.includes(u.a))&&!(d&&ot.includes(u.a))&&!(!n&&u.a==="export-name")&&!(u.a==="export-ser785"&&!(n&&String(a||"").toUpperCase()==="SERVICE"))&&!(u.a==="export-adv786"&&!(n&&String(a||"").toUpperCase()==="ADVANCE")),h=w.filter(i).map(S).join(""),v=r||n?"":z.filter(i).filter(u=>!(d&&rt.includes(u.a))).map(Z).join(""),p=n||l||t==="MAERSK"?Q.filter(i).filter(u=>u.a!=="calcomp"||n&&String(a||"").toUpperCase()==="SERVICE").map(Z).join(""):"",g=a==="ADVANCE"&&e.edit&&!r&&!n&&!l?`
    <div class="quick-close">
      <input class="inp" id="qc-key" placeholder="\u0E40\u0E25\u0E02 JOB / Invoice" autocomplete="off">
      <button class="btn btn-green btn-sm" data-tool="quick-close">\u2713 \u0E08\u0E1A\u0E07\u0E32\u0E19</button>
    </div>`:"";return`<div class="ch-tools${n||l?" ch-tools-acc":""}">
    ${h}
    
    ${p?`<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="maersk">\u{1F6A2} MAERSK \u25BE</button>
      <div class="tool-drop" data-drop="maersk">${p}</div>
    </div>`:""}
    ${v?`<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="tools">\u{1F9F0} \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D \u25BE</button>
      <div class="tool-drop" data-drop="tools">${v}</div>
    </div>`:""}
    ${g}
  </div>`}function ut(a){a.addEventListener("click",t=>{let e=t.target.closest("[data-menu]");if(a.querySelectorAll(".tool-drop.open").forEach(o=>{(!e||o.dataset.drop!==e.dataset.menu)&&o.classList.remove("open")}),e){let o=a.querySelector(`[data-drop="${e.dataset.menu}"]`);o&&o.classList.toggle("open")}t.target.closest(".tool-item")&&a.querySelectorAll(".tool-drop.open").forEach(o=>o.classList.remove("open"))})}function nt(a){let t=String(a||"").split(/[\s\t,;|]+/).map(e=>e.trim()).filter(Boolean);for(let e of t)if(!/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(e)&&!/^\d{4}-\d{2}-\d{2}$/.test(e))return e;return""}function V(a){let t=String(a||"").split(/[\s,;]+/).map(r=>r.trim()).filter(Boolean),e=new Set,o=[];return t.filter(r=>/^NJ/i.test(r)).forEach(r=>{let n=r.toUpperCase();e.has(n)||(e.add(n),o.push(r))}),{total:t.length,nj:t.filter(r=>/^NJ/i.test(r)).length,keys:o}}var T="MAERSK LOGISTICS";function I(a,{withValue:t,valueLabel:e,valueType:o="text",okLabel:r="\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23",extraDate:n,hint:l}={}){return new Promise(d=>{let i=document.createElement("div");i.innerHTML=`
      <p class="t-sm t-2 mb-1">${l||"\u0E27\u0E32\u0E07\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E25\u0E30 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A Job No / Invoice No / Source Invoice No / Customer Job No)"}</p>
      <div class="fld"><textarea class="inp w100" id="tk-keys" rows="8" style="min-height:150px"></textarea></div>
      ${t?`<div class="fld"><label>${s(e)}</label>
        <input class="inp w100" id="tk-val" type="${o}"></div>`:""}
      ${n?`<div class="fld"><label>${s(n)}</label>
        <input class="inp w100" id="tk-date" type="date"></div>`:""}`;let h=document.createElement("div");h.innerHTML=`<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="tk-ok">${s(r)}</button>`;let v=k({title:a,body:i,footer:h,large:!0});h.querySelector("#tk-ok").onclick=()=>{let p=i.querySelector("#tk-keys").value.split(/[\r\n\t,;]+/).map(Y=>Y.trim()).filter(Boolean);if(!p.length){c("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E27\u0E32\u0E07\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07","err");return}let g=t?i.querySelector("#tk-val").value.trim():null;if(t&&!g){c("\u0E01\u0E23\u0E2D\u0E01"+e,"err");return}let u=n&&i.querySelector("#tk-date").value||"";y(),d({keys:p,value:g,date:u,raw:i.querySelector("#tk-keys").value})},v.addEventListener("click",p=>{(p.target===v||p.target.closest("[data-close]"))&&d(null)})})}async function $t(a,t){try{switch(a){case"refresh":t.refresh();return;case"new-job":{let{openNewJobModal:e}=await import("./job-form-4IHODUQT.js");await e({charge:t.charge,group:t.group,mode:t.mode,onSaved:t.refresh});return}case"export-excel":return C(t,!1);case"export-ser785":return t.mode==="accounting"&&String(t.charge||"").toUpperCase()==="SERVICE"?SER785(t):void 0;case"export-adv786":return t.mode==="accounting"&&String(t.charge||"").toUpperCase()==="ADVANCE"?ADV786(t):void 0;case"export-name":return XN506(t);case"export-all":return C(t,!0);case"export-csv":return B(t);case"export-cust":return j(t);case"upload753":return t.mode==="document"&&String(t.charge||"").toUpperCase()==="SERVICE"?UP753(t):void 0;case"calcomp":return t.mode==="accounting"&&String(t.charge||"").toUpperCase()==="SERVICE"?CC751(t):void 0;case"export-soa":return q(t);case"export-case":return x(t);case"upload":return U(t);case"apl-upload":return P(t);case"billing-pdf":case"billing-pdf-apl":return t.mode!=="accounting"?void 0:(await import("./billing-pdf-HDUV5YLN.js")).openBillingPdf(t,a==="billing-pdf-apl"?"apl":"std");case"upload-19":return K(t);case"sum":{let e=await _({charge:t.charge,group:t.group,queue:t.queue,scope:t.scope,filters:t.filters});J(e,t);return}case"contacts":{let e=await A(t.charge,t.group),o=e.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>Company Invoice</th><th>\u0E23\u0E2B\u0E31\u0E2A</th><th>Contact (LIST NAME)</th><th class="r">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E07\u0E32\u0E19</th>
          </tr></thead><tbody>${e.map(n=>`<tr>
            <td class="t-b">${s(n.company_invoice)}</td><td>${s(n.company_code||"-")}</td>
            <td>${s(n.master_contact||"-")}</td><td class="r">${n.job_count??""}</td>
          </tr>`).join("")}</tbody></table></div>
          <p class="t-xs t-3 mt-1">Contact \u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 = Contact \u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19 (\u0E16\u0E49\u0E32\u0E21\u0E35) \u0E21\u0E34\u0E09\u0E30\u0E19\u0E31\u0E49\u0E19\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E08\u0E32\u0E01 LIST NAME \u0E19\u0E35\u0E49</p>`:'<div class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49</div>',r=document.createElement("div");r.innerHTML=`<button class="btn btn-o" id="ct-up">\u{1F4C1} \u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 LIST NAME</button>
          <button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>`,k({title:"Contact List \u2014 "+L(t.group),body:o,footer:r,large:!0}),r.querySelector("#ct-up").onclick=async()=>{y(),await G()};return}case"paste-close":{let e=await I("Paste \u0E08\u0E1A\u0E07\u0E32\u0E19 (\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE)",{okLabel:"\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"});if(!e||!await m("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E1A\u0E07\u0E32\u0E19",`\u0E08\u0E30\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE \u0E43\u0E2B\u0E49 ${e.keys.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01)`))return;let o=await f("bulk-close",()=>E(t.charge,t.group,e.keys.map(nt).filter(Boolean),"CLOSE"));b("\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E07\u0E32\u0E19",o),t.refresh();return}case"close-upload":{let e=await R();if(!e)return;let o=await H(e),r=F(o);if(!r.keys.length){c("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C","err");return}if(!await m("\u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C",`${r.usedHeader?`\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E32\u0E21\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07 (\u0E41\u0E16\u0E27 ${r.headerRow+1})`+(r.invCol>=0?" \xB7 Invoice No.":"")+(r.jobCol>=0?" \xB7 Customer Job No.":""):"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07 \u2014 \u0E2D\u0E48\u0E32\u0E19\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C"}<br>
           \u0E1E\u0E1A ${r.keys.length} \u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C ${s(e.name)} \u2014 \u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE?<br>
           <span class="t-xs t-3">\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E1A\u0E41\u0E25\u0E49\u0E27/\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E08\u0E30\u0E16\u0E39\u0E01\u0E02\u0E49\u0E32\u0E21 \xB7 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E2B\u0E25\u0E32\u0E22\u0E07\u0E32\u0E19\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E14\u0E32</span>`))return;let n=await f("close-upload",()=>E(t.charge,t.group,r.keys,"CLOSE"));b("\u0E1C\u0E25\u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C",n),t.refresh();return}case"bulk-case":{let e=await I("Bulk Case",{withValue:!0,valueLabel:"Case",okLabel:"\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Case",extraDate:"ETA (\u0E16\u0E49\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E15\u0E34\u0E21\u0E14\u0E49\u0E27\u0E22)",hint:"\u0E14\u0E36\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30 token \u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 NJ \xB7 \u0E02\u0E49\u0E32\u0E21\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E23\u0E2B\u0E31\u0E2A\u0E2D\u0E37\u0E48\u0E19 (AIR/FZ)"});if(!e)return;let o=V(e.raw);if(!o.keys.length){c("\u0E44\u0E21\u0E48\u0E1E\u0E1A Invoice No. \u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 NJ","err");return}if(!await m("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 Bulk Case",`Case: <b>${s(e.value)}</b>${e.date?` \xB7 ETA: <b>${s(e.date)}</b>`:""}<br>
           Invoice (NJ) \u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E44\u0E14\u0E49 ${o.nj} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33 ${o.keys.length})<br>
           <span class="t-xs t-3">\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30 Case${e.date?" \u0E41\u0E25\u0E30 ETA":" \xB7 ETA \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E49\u0E32\u0E07"}
           \xB7 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 status / \u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19 / field \u0E2D\u0E37\u0E48\u0E19</span>`))return;let r=await f("bulk-case",()=>D(t.charge,t.group,o.keys,e.value,e.date));b("\u0E1C\u0E25\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Case",r),t.refresh();return}case"fill-etd":{let e=await I("\u0E40\u0E15\u0E34\u0E21 ETD",{withValue:!0,valueLabel:"ETD",valueType:"date",okLabel:"\u0E40\u0E15\u0E34\u0E21 ETD",hint:`\u0E14\u0E36\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30 token \u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 NJ \xB7 \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07 ${T}`});if(!e)return;let o=V(e.raw);if(!o.keys.length){c("\u0E44\u0E21\u0E48\u0E1E\u0E1A Invoice No. \u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 NJ","err");return}if(!await m("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E40\u0E15\u0E34\u0E21 ETD",`ETD: <b>${s(e.value)}</b><br>
           Invoice (NJ) \u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E44\u0E14\u0E49 ${o.nj} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33 ${o.keys.length})<br>
           <span class="t-xs t-3">\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <b>${s(T)}</b> \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19
           \xB7 Invoice \u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E02\u0E49\u0E32\u0E21 \xB7 \u0E41\u0E01\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 field etd</span>`))return;let r=await f("fill-etd",()=>M(t.charge,t.group,o.keys,"etd",e.value,T));b("\u0E1C\u0E25\u0E40\u0E15\u0E34\u0E21 ETD",r),t.refresh();return}case"quick-close":{let e=document.getElementById("qc-key"),o=e?e.value.trim():"";if(!o){c("\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E25\u0E02 JOB \u0E2B\u0E23\u0E37\u0E2D Invoice \u0E01\u0E48\u0E2D\u0E19","err");return}let n=(await O(t.charge,t.group,o)).matches||[];if(!n.length){c("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23: "+o,"err");return}if(n.length>1){st(n,o);return}let l=n[0];if(l.operational_status==="CLOSE"){c("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E08\u0E1A\u0E41\u0E25\u0E49\u0E27","err");return}if(l.operational_status==="CANCELED"){c("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E08\u0E1A\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49","err");return}if(!await m("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E1A\u0E07\u0E32\u0E19",`${s(l.job_no)} \xB7 ${s(l.customer_name||"-")}<br>
           Invoice: ${s(l.invoice_no||l.source_invoice_no||"-")} \xB7 Due: ${$(l.due_date)}`))return;let i=await f("quick-close",()=>E(t.charge,t.group,[o],"CLOSE"));i.matched?(c("\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27","ok"),e&&(e.value="")):b("\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E07\u0E32\u0E19",i),t.refresh();return}default:c("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E19\u0E35\u0E49","err")}}catch(e){N(e)}}function st(a,t){k({title:"\u0E1E\u0E1A\u0E2B\u0E25\u0E32\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "+t,body:`<p class="t-sm t-2">\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1E\u0E1A\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E42\u0E1B\u0E23\u0E14\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>Job No</th><th>Invoice</th><th>SRC</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th>Due</th>
      </tr></thead><tbody>${a.map(e=>`<tr>
        <td>${s(e.job_no)}</td><td>${s(e.invoice_no||"-")}</td>
        <td>${s(e.source_invoice_no||"-")}</td><td>${s(e.customer_name||"-")}</td>
        <td>${s(e.operational_status)}</td><td>${$(e.due_date)}</td>
      </tr>`).join("")}</tbody></table></div>`,footer:Object.assign(document.createElement("div"),{innerHTML:'<button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>'}),large:!0})}/* \u2550\u2550\u2550 V.506 ACCOUNTING : \u{1F4E4} EXPORT NAME \u2014 Excel 2 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C (JOB NJ | Detail) \u2550\u2550\u2550
   Detail = \u0E40\u0E25\u0E02 INVOICE (\u0E44\u0E21\u0E48\u0E21\u0E35 = NO INVOICE) , \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19 (customs_declaration_no) , Customer Job No. , \u0E23\u0E2B\u0E31\u0E2A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice (company_code)
   \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A Export Excel \u0E40\u0E14\u0E34\u0E21 (\u0E41\u0E17\u0E47\u0E1A + \u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 \u00B7 \u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32) \u00B7 \u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E41\u0E01\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 */
function XS506() {
  if (document.getElementById("acc506-css")) return;
  let st = document.createElement("style"); st.id = "acc506-css";
  st.textContent = '.ch-tools-acc [data-tool="export-name"]{background:#9333ea;border-color:#7e22ce;color:#fff}.ch-tools-acc [data-tool="export-name"]:hover{background:#7e22ce;border-color:#6b21a8}.ch-tools-acc [data-tool="export-name"]:active{background:#6b21a8}.ch-tools-acc [data-tool="export-name"]:disabled{opacity:.6;cursor:wait}';
  document.head.appendChild(st);
}
var XV506 = (v) => { let s = v == null ? "" : String(v).trim(); return s; };
function XD506(r, code) {
  let inv = XV506(r.invoice_no);
  (!inv || /^DRAFT-/i.test(inv)) && (inv = "NO INVOICE");
  let na = (v) => XV506(v) || "N/A";
  return [inv, na(r.customs_declaration_no), na(r.customer_job_no), na(code)].join(",");
}
async function XN506(t) {
  if (t.mode !== "accounting") return;
  let btn = document.querySelector('[data-tool="export-name"]');
  btn && (btn.disabled = !0);
  let body = document.createElement("div");
  body.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1" id="xn506-prog">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026</div></div>';
  k({ title: "EXPORT NAME", body });
  let rows = null;
  try {
    rows = await XO506(t, (n, o) => { let e = document.getElementById("xn506-prog"); e && (e.textContent = `${n.toLocaleString("th-TH")} / ${o.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`); });
    if (!rows) return;
    try { await XM506(); } catch (_e) {}
    let cos = (XG506.masters && XG506.masters.companies) || [], cm = new Map(cos.map((c) => [c.id, c.code]));
    let seen = new Set(), out = [];
    for (let r of rows) {
      if (!r || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push([XV506(r.job_no), XD506(r, r.company_invoice_id ? cm.get(r.company_invoice_id) : "")]);
    }
    out.sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: !0 }));
    let X = await XJ506(), wb = new X.Workbook(), ws = wb.addWorksheet("Page1", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: !0, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" } });
    ws.getColumn(1).width = 21.11; ws.getColumn(2).width = Math.max(60, Math.min(160, Math.max(...out.map((x) => x[1].length), 20) + 6));
    let bd = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    let put = (rn, vals, hd) => {
      let row = ws.getRow(rn); row.height = hd ? 16 : 13.75;
      vals.forEach((v, i) => {
        let c = row.getCell(i + 1);
        c.value = v; c.numFmt = "@";
        c.font = { name: "Tahoma", size: hd ? 8 : 7, bold: !!hd, color: { argb: "FF000000" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: hd ? "FFFFFFC0" : "FFFFFFFF" } };
        c.alignment = { horizontal: "left", vertical: "middle", wrapText: !0 };
        c.border = bd;
      });
    };
    put(1, ["JOB NJ", "Detail"], 1);
    out.forEach((x, i) => put(i + 2, x, 0));
    let buf = await wb.xlsx.writeBuffer();
    if (!buf || !buf.byteLength) throw new Error("\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C Excel \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 (\u0E44\u0E1F\u0E25\u0E4C\u0E27\u0E48\u0E32\u0E07)");
    let d = new Date(), p2 = (x) => String(x).padStart(2, "0");
    let name = `ACCOUNTING_EXPORT_NAME_${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}.xlsx`;
    let u = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8e3);
    c(`EXPORT NAME ${out.length.toLocaleString("th-TH")} JOB`, "ok");
  } catch (e) { N(e, "EXPORT NAME \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"); }
  finally { y(); btn && (btn.disabled = !1); }
}

export{lt as a,it as b,ct as c,ut as d,$t as e};

/* ═══ V.753 → V.754 · DOCUMENT → SERVICE : UPLOAD EXCEL (CALCOMP · SHEET "เปิดจ๊อบ")
   V.754 : รวม JOB ตาม Entry (เลขใบขนสินค้า) · 1 Entry = 1 JOB · อ่าน + จัดกลุ่ม + ตรวจ Entry กับฐานข้อมูล → Preview (ยังไม่บันทึก) → กด "บันทึกข้อมูล" จึงสร้าง JOB
   กันซ้ำด้วย Entry เท่านั้น (ทุก JOB SERVICE ในระบบ · njacc_upload754_check / njacc_upload754_save ตรวจซ้ำอีกครั้งพร้อมล็อก) · Invoice / Booking / เบอร์ตู้ ซ้ำกับ JOB อื่นได้
   รวมในกลุ่ม : เบอร์ตู้ / Invoice / Booking / SIZE (Code) = ค่าไม่ซ้ำ คั่น "," ไม่มีช่องว่าง · จำนวนตู้ = จำนวนเบอร์ตู้ไม่ซ้ำ · FACTORY / Loading ต่างกันในกลุ่ม = ข้อมูลไม่ถูกต้อง
   ค่าคงที่เดิม : EX (SEA) · HALF (ปล่อย) · CAL-COMP · Maersk · ค่าธรรมเนียม · FCL · ท่าตรวจปล่อย อื่น : เพชรบุรี · Customer Job No. N/A
   ไม่แก้ JOB เดิม · ไม่ POST / CLOSE · Flow เปิดงานปกติ / กันเลขซ้ำเมนูอื่น = เดิม ═══ */
var UH753 = { factory: "FACTORY", invoice: "INVOICE", booking: "BOOKING", loading: "LOADING", cont: "CONTAINER NO", code: "CODE", entry: "ENTRY" };
var UB753 = false;
function UN753(v) { return String(v == null ? "" : v).replace(/[ ​﻿]/g, " ").replace(/\s+/g, " ").trim(); }
function UT753(v) { if (v == null) return ""; if (typeof v === "number") return isFinite(v) ? String(v) : ""; if (v instanceof Date) return ""; return UN753(v); }
function UP2753(n) { return String(n).padStart(2, "0"); }
function UD753(v) {
  if (v == null || v === "") return { ok: true, v: null };
  let y, m, d;
  if (typeof v === "number" && isFinite(v) && v >= 1) { let x = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000); y = x.getUTCFullYear(); m = x.getUTCMonth() + 1; d = x.getUTCDate(); }
  else if (v instanceof Date && !isNaN(v)) { y = v.getFullYear(); m = v.getMonth() + 1; d = v.getDate(); }
  else {
    let s = UN753(v), a = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s), b = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (a) { d = +a[1]; m = +a[2]; y = +a[3]; if (y > 2400) y -= 543; } else if (b) { y = +b[1]; m = +b[2]; d = +b[3]; } else return { ok: false };
  }
  let t = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(t) || t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d || y < 2000 || y > 2100) return { ok: false };
  return { ok: true, v: y + "-" + UP2753(m) + "-" + UP2753(d) };
}
function UQ754(a) { let o = []; a.forEach((x) => { x = UN753(x); x && o.indexOf(x) < 0 && o.push(x); }); return o; }
function UL754(a) { return a.length ? a.join(", ") : "-"; }
function UE754(er) {
  let m = String(er && er.message || er || ""), i = m.indexOf("NJACC_UPLOAD754_DUP_ENTRY");
  if (i >= 0) { let j = []; try { j = JSON.parse(m.slice(i + 25).trim()); } catch (e) {} return { dup: !0, msg: j.length ? j.join(", ") : "-" }; }
  if (/NJACC_UPLOAD754_ENTRY_REQUIRED/.test(m)) return { msg: "ไม่มี Entry" };
  if (/NJACC_UPLOAD754_INVOICE_REQUIRED/.test(m)) return { msg: "ไม่มี Invoice" };
  if (!m || /fetch|network|timeout|abort/i.test(m) || !/NJACC_|[฀-๿]/.test(m)) return { msg: "การเชื่อมต่อขัดข้อง — ไม่แน่ใจว่าบันทึกแล้วหรือไม่ กรุณาตรวจในรายงาน (อัปโหลดซ้ำจะไม่สร้าง JOB ซ้ำ)" + (m ? " · " + m : "") };
  return { msg: m };
}
function UP753(t) {
  if (UB753) { c("กำลัง UPLOAD อยู่ — รอให้เสร็จก่อน", "err"); return; }
  let inp = document.createElement("input"); inp.type = "file"; inp.accept = ".xlsx,.xls,.xlsm";
  inp.addEventListener("change", () => { let f = inp.files && inp.files[0]; f && UR754(t, f); }, { once: !0 });
  inp.click();
}
async function UR754(t, f) {
  if (UB753) return; UB753 = !0; let keep = !1;
  try {
    let X; try { X = await XL753(); } catch (e) { c("โหลดตัวอ่าน Excel ไม่สำเร็จ — ยังไม่สร้าง JOB", "err"); return; }
    let wb; try { wb = X.read(new Uint8Array(await f.arrayBuffer()), { type: "array", cellDates: !1 }); } catch (e) { c("อ่านไฟล์ Excel ไม่ได้ — ยังไม่สร้าง JOB", "err"); return; }
    if (!wb.Sheets["เปิดจ๊อบ"]) { keep = await UR806(t, f, X, wb); return; }   /* V.806 : ไม่มี SHEET "เปิดจ๊อบ" → ตรวจรูปแบบ SERVICE NJ LIST (CALCOMP ด้านล่าง = เดิม) */
    let ws = wb.Sheets["เปิดจ๊อบ"];
    if (!ws) { c('ไม่พบ SHEET "เปิดจ๊อบ" ในไฟล์ — ยังไม่สร้าง JOB', "err"); return; }
    let rg = X.utils.decode_range(ws["!ref"] || "A1"), aoa = X.utils.sheet_to_json(ws, { header: 1, raw: !0, defval: null, blankrows: !0 });
    let hd = (aoa[0] || []).map((h) => UN753(h).toUpperCase()), ix = {}, miss = [];
    Object.keys(UH753).forEach((k) => { let p = hd.indexOf(UH753[k]); p < 0 ? miss.push(UH753[k]) : (ix[k] = p); });
    if (miss.length) { c("หัวคอลัมน์ไม่ครบ : " + miss.join(", ") + " — ยังไม่สร้าง JOB", "err"); return; }
    let ms = XG506.masters || {}, co = (ms.companies || []).filter((x) => x && x.active !== !1 && /^CAL-?COMP ELECTRONICS \(THAILAND\) PUBLIC\b/i.test(UN753(x.name))),
        cu = (ms.customers || []).filter((x) => x && x.active !== !1 && UN753(x.name).toLowerCase() === "maersk logistics & services (thailand) co., ltd.");
    if (co.length !== 1 || cu.length !== 1) { c("ไม่พบ (หรือพบมากกว่า 1) บริษัท CAL-COMP / ลูกค้า Maersk ในข้อมูลหลัก — ยังไม่สร้าง JOB", "err"); return; }
    /* ── อ่านแถว → จัดกลุ่มตาม Entry (ลำดับตามแถวแรกของ Entry) ── */
    let nRow = 0, gs = [], gm = new Map();
    for (let k = 1; k < aoa.length; k++) {
      let r = aoa[k] || [], g = (n) => r[ix[n]];
      if (Object.keys(ix).every((n) => UT753(g(n)) === "" && !(g(n) instanceof Date))) continue;
      nRow++;
      let x = { row: rg.s.r + k + 1, factory: UT753(g("factory")).toUpperCase(), invoice: UT753(g("invoice")), booking: UT753(g("booking")), loading: UD753(g("loading")), cont: UT753(g("cont")), code: UT753(g("code")), entry: UT753(g("entry")) };
      let key = x.entry ? x.entry.toLowerCase() : "\u0000row" + x.row, G = gm.get(key);
      G || (G = { entry: x.entry, rows: [], err: [] }, gm.set(key, G), gs.push(G));
      G.rows.push(x);
    }
    if (!gs.length) { c("ไม่มีข้อมูลใน SHEET \"เปิดจ๊อบ\"", "err"); return; }
    gs.forEach((G) => {
      let R = G.rows;
      G.conts = UQ754(R.map((x) => x.cont)); G.invs = UQ754([].concat(...R.map((x) => x.invoice.split(",")))); G.books = UQ754(R.map((x) => x.booking)); G.codes = UQ754(R.map((x) => x.code));
      G.facts = UQ754(R.map((x) => x.factory)); G.dates = UQ754(R.filter((x) => x.loading.ok).map((x) => x.loading.v || "")).filter(Boolean);
      if (!G.entry) G.err.push("ไม่มี Entry (เลขใบขนสินค้า) — ไม่อนุญาตให้นำเข้า");
      if (G.facts.length > 1) G.err.push("FACTORY ขัดแย้งกันใน Entry เดียว (" + G.facts.join(" / ") + ")");
      else if (G.facts[0] !== "BONDED" && G.facts[0] !== "FREEZONE") G.err.push("FACTORY ไม่ถูกต้อง (" + (G.facts[0] || "ว่าง") + ") — ต้องเป็น BONDED หรือ FREEZONE");
      if (R.some((x) => !x.loading.ok)) G.err.push("Loading ไม่ใช่วันที่ที่ถูกต้อง (แถว " + R.filter((x) => !x.loading.ok).map((x) => x.row).join(", ") + ")");
      else if (G.dates.length > 1 || (G.dates.length === 1 && R.some((x) => !x.loading.v))) G.err.push("Loading ต่างกันใน Entry เดียว");
      if (!G.invs.length) G.err.push("ไม่มี Invoice");
      G.st = G.err.length ? "bad" : "ready";
    });
    /* ── ตรวจ Entry กับฐานข้อมูล (ทุก JOB SERVICE · อ่านอย่างเดียว) ── */
    let ent = gs.filter((G) => G.st === "ready").map((G) => G.entry), hit;
    try { hit = ent.length ? await RPC753("njacc_upload754_check", { p_entries: ent }) : []; } catch (e) { c("ตรวจ Entry กับฐานข้อมูลไม่สำเร็จ — ยังไม่สร้าง JOB · " + String(e && e.message || e || ""), "err"); return; }
    if (!Array.isArray(hit)) { c("ตรวจ Entry กับฐานข้อมูลไม่สำเร็จ — ยังไม่สร้าง JOB", "err"); return; }
    let hm = new Map(hit.map((h) => [String(h.entry || "").toLowerCase(), (h.jobs || []).join(", ")]));
    gs.forEach((G) => { if (G.st === "ready" && hm.has(G.entry.toLowerCase())) { G.st = "dup"; G.dupJobs = hm.get(G.entry.toLowerCase()); } });
    /* ── Preview (ยังไม่บันทึก) ── */
    let bd = document.createElement("div"), ft = document.createElement("div"), RED = "#b91c1c", GRN = "#15803d";
    let stTxt = (G) => G.st === "ready" ? "พร้อมนำเข้า" : G.st === "dup" ? "ข้อมูลซ้ำ (ห้ามนำเข้า) — Entry: " + G.entry + " → JOB เดิม: " + G.dupJobs : "ข้อมูลไม่ถูกต้อง — " + G.err.join(" · ");
    let stCol = (G) => G.st === "ready" ? "#1d4ed8" : RED;
    bd.innerHTML = `<div class="up754"><div class="t-sm mb-1" id="up754-sum"></div><div class="tbl-wrap" style="max-height:58vh;overflow:auto"><table class="tbl"><thead><tr><th>Entry</th><th>Excel Row</th><th>Container No.</th><th class="r">จำนวนตู้</th><th>FACTORY</th><th>สถานะ</th></tr></thead><tbody>${gs.map((G, i) => `<tr data-up754="${i}"><td>${s(G.entry || "-")}</td><td class="center">${G.rows.map((x) => x.row).join(", ")}</td><td>${s(G.conts.join(",") || "-")}</td><td class="r">${G.conts.length || "-"}</td><td>${s(G.facts.join(" / ") || "-")}</td><td class="up754-st" style="color:${stCol(G)};font-weight:600">${s(stTxt(G))}</td></tr>`).join("")}</tbody></table></div></div>`;
    let nReady = gs.filter((G) => G.st === "ready").length, nDup = gs.filter((G) => G.st === "dup").length, nBad = gs.filter((G) => G.st === "bad").length, ok = 0, fail = 0, saving = !1, done = !1;
    let sm = () => { let e = bd.querySelector("#up754-sum"); e && (e.innerHTML = `แถว Excel ทั้งหมด: <b>${nRow}</b> · JOB หลังรวม Entry: <b>${gs.filter((G) => G.entry).length}</b> · พร้อมนำเข้า: <b style="color:#1d4ed8">${nReady}</b> · ข้อมูลซ้ำ (ห้ามนำเข้า): <b style="color:${RED}">${nDup}</b> · ข้อมูลไม่ถูกต้อง: <b style="color:${RED}">${nBad}</b>${saving || done ? ` · บันทึกสำเร็จ: <b style="color:${GRN}">${ok}</b> · ไม่สำเร็จ: <b style="color:${RED}">${fail}</b>` : ""}${done ? "" : saving ? " · กำลังบันทึก…" : " · <b>ยังไม่บันทึกจนกว่าจะกด \"บันทึกข้อมูล\"</b>"}`); };
    let st = (i, h, col) => { let e = bd.querySelector(`tr[data-up754="${i}"] .up754-st`); e && (e.textContent = h, e.style.color = col); };
    ft.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button><button class="btn btn-p" id="up754-save"${nReady ? "" : " disabled"}>\u{1F4BE} บันทึกข้อมูล (${nReady} JOB)</button>`;
    let bk = k({ title: "UPLOAD CALCOMP — " + s(f.name), body: bd, footer: ft, large: !0 }); sm();
    let sv = ft.querySelector("#up754-save"), cl = ft.querySelector("[data-close]");
    let td = new Date(), today = td.getFullYear() + "-" + UP2753(td.getMonth() + 1) + "-" + UP2753(td.getDate()), rq = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    keep = !0;   /* หน้าต่างยังเปิด : กันเริ่ม UPLOAD ใหม่ซ้อน จนกว่าจะปิด */
    let rel = () => { UB753 = !1; }, mo = new MutationObserver(() => { if (!bd.isConnected && !saving) { mo.disconnect(); rel(); } });
    mo.observe(document.body, { childList: !0, subtree: !0 });   /* ปิดหน้าต่าง (ยกเลิก / ✕ / Esc / คลิกนอก) = ไม่บันทึก · ปลดล็อกให้ UPLOAD ใหม่ได้ */
    sv && sv.addEventListener("click", async () => {
      if (saving || done) return; saving = !0; sv.disabled = !0; cl.disabled = !0; sm();
      for (let i = 0; i < gs.length; i++) {
        let G = gs[i]; if (G.st !== "ready") continue;
        st(i, "กำลังบันทึก…", "#1d4ed8");
        let bo = G.facts[0] === "BONDED", p = { job: { charge_type: "SERVICE", company_group: t.group, data_type: "EX (SEA)", reference_date: today, reference_no: null, job_date: today,
            company_invoice_id: co[0].id, customer_id: cu[0].id, customer_job_no: "N/A", customs_declaration_no: G.entry, source_invoice_no: G.invs.join(","), house_bl_no: null, master_bl_no: null,
            booking_no: G.books.join(",") || null, vessel_name: null, qty_container: G.conts.length || null, etd: null, eta: null, delivery_date: null, note: null, request_id: "up754_" + rq + "_" + i },
          doc: { lift_on_wharf_flag: !1, storage_charge_flag: !1, release_port: "อื่น", release_port_other: "เพชรบุรี", doc_exempt: !1, doc_inspect: !1,
            cargo_fcl: !0, cargo_lcl: !1, cargo_fz: !bo, cargo_fz_fz: !1, cargo_bonded: bo, container_no: G.conts.join(",") || null, container_size: G.codes.join(",") || null, release_date: G.dates[0] || null,
            doc_fee: !0, doc_overtime: !1, doc_mass: !1, doc_travel: !1, doc_print: !1, doc_labor: !1, doc_ot_nj: !1, doc_0409_cust: !1, doc_0409_nocollect: !1, job_category: "HALF (ปล่อย)" } };
        let r = null, er = null;
        try { r = await RPC753("njacc_upload754_save", { p: p }); } catch (e) { er = e; }
        if (r && r.id) { ok++; st(i, "สำเร็จ · " + (r.job_no || r.open_no || ("ID " + String(r.id).slice(0, 8))) + (r.job_no || r.open_no ? "" : " (รอ POST ออกเลข JOB)"), GRN); }
        else { fail++; let x = UE754(er); st(i, x.dup ? "ข้อมูลซ้ำ (ห้ามนำเข้า) — Entry: " + G.entry + " → JOB เดิม: " + x.msg : "ไม่สำเร็จ — " + x.msg, RED); }
        sm();
      }
      saving = !1; done = !0; bd.isConnected || (mo.disconnect(), rel()); sm(); cl.disabled = !1; cl.textContent = "✕ ปิด"; sv.style.display = "none";
      try { t.refresh && t.refresh(); } catch (e) {}
      c("UPLOAD CALCOMP : สร้าง JOB สำเร็จ " + ok + " / ไม่สำเร็จ " + fail, fail ? "err" : "ok");
    });
  } catch (e) { c("UPLOAD EXCEL ไม่สำเร็จ : " + String(e && e.message || e || ""), "err"); }
  finally { keep || (UB753 = !1); }
}

/* ═══ V.806 · DOCUMENT → SERVICE : UPLOAD EXCEL รูปแบบที่ 2 = SERVICE NJ LIST (ปุ่ม UPLOAD EXCEL เดิมปุ่มเดียว)
   แยกรูปแบบจากโครงสร้างไฟล์ : มี SHEET "เปิดจ๊อบ" = CALCOMP (UR754 เดิมทุกบรรทัด ไม่แก้) · ไม่มี → หา SHEET ที่หัวคอลัมน์ตรง 17 คอลัมน์ SERVICE NJ LIST
   (SHEET "SERVICE NJ" ก่อน) · ไม่ตรง = แจ้งข้อผิดพลาด ไม่เดาตำแหน่งคอลัมน์ · จับคู่คอลัมน์ด้วยชื่อหัวคอลัมน์เท่านั้น
   1 แถว = 1 JOB ใหม่ · ITEM = ลำดับแถว (ไม่ใช่ JOB ID) · INVOICE NO. = Invoice No. ของลูกค้า (source_invoice_no) · DCL INV. = เลขใบขนสินค้า (customs_declaration_no)
   ไม่ส่ง id / job_no / open_no / invoice ใด ๆ → เลข JOB / INVOICE NJ = Flow เดิมของระบบ · ไม่แก้ JOB เดิม · ไม่ POST / CLOSE / ออกเลข Invoice
   ตรวจก่อนบันทึก : ข้อมูลบังคับ (กฎเดียวกับ njacc_doc_required_missing) · ลูกค้า / บริษัท ต้องตรงข้อมูลหลัก 1 รายการ · โหมดต้องอยู่ในรายการเดิม · วันที่ (วันที่ Excel / Serial / dd/mm/yyyy)
     ซ้ำในไฟล์ (เลขใบขน / Invoice No. / House B/L) · ซ้ำกับระบบ = njacc_job_dup_check เดิม (อ่านอย่างเดียว)
   ประเภท + ประเภทงาน (FCL / LCL / FZ / FZ+FZ) ไม่มีใน Excel แต่ฟอร์มเปิดงานเดิมบังคับ → ผู้ใช้เลือกใน Preview ก่อนบันทึก (ไม่เดาค่า)
   บันทึก = njacc_save_document_job เดิม (สิทธิ์ / request_id / กันซ้ำ RUN-87 พร้อมล็อก / ข้อมูลบังคับ ตรวจซ้ำที่ Server ทุกครั้ง) ═══ */
var UH806 = ["ITEM", "DATA TYPE", "CUSTOMER NAME", "COMPANY INVOICE", "INVOICE NO.", "MASTER", "HOUSE B/L NO.", "DCL INV.", "CUSTOMER JOB NO.", "ETA", "ETD", "ท่านำเข้า", "ท่าตรวจปล่อย", "เบอร์ตู้ (CONTAINER NO.)", "BOOKING NO.", "วันส่งมอบ", "หมายเหตุ"];
var UK806 = ["item", "mode", "cust", "comp", "inv", "mbl", "hbl", "dcl", "cjob", "eta", "etd", "port", "rel", "cont", "book", "dlv", "note"];
var UM806 = ["IM (SEA)", "IM (AIR)", "IM (TRUCK)", "EX (SEA)", "EX (AIR)", "EX (TRUCK)", "FORM"];   /* = รายการโหมดเดิมของฟอร์มเปิดงาน */
var UC806 = ["HALF (คีย์ลูกค้า)", "HALF (คีย์NJ)", "HALF (ปล่อย)", "FULL (คีย์ลูกค้า+ปล่อย)", "FULL (คีย์NJ+ปล่อย)", "COUNTER (คีย์)", "COUNTER (คีย์+ปล่อย)", "Amendment", "Re-fund", "FORM"];   /* = ประเภท SERVICE เดิม */
var UR806P = ["A0, B1", "B2, B3", "B4", "B5, C3", "C1, C2, D1, D2", "A2, A3, JWD", "KERRY, SIAM SEAPORT", "ขาออก", "1191 (คลัง TG)", "1192 (คลัง BFS)", "1193 (คลัง DHL)", "1194 (คลัง UPS)", "FZ ระยอง", "FZ ชลบุรี", "FZ TFD ฉะเชิงเทรา", "FZ บ้านหว้า อยุธยา", "FZ สมุทรปราการ", "FZ บางเสาธง", "BKK"];   /* = ท่าตรวจปล่อยเดิม (นอกรายการ = อื่น + ระบุ) */
var UG806 = [["fcl", "FCL"], ["lcl", "LCL"], ["fz", "FZ"], ["fzfz", "FZ+FZ"]];
function UH806N(v) { return UN753(v).toUpperCase(); }
function UMN806(v) { return UN753(v).toUpperCase().replace(/\s*\(\s*/g, " (").replace(/\s*\)\s*/g, ")").trim(); }
function UX806(ws, X, r, c) {   /* ข้อความอ้างอิง : เก็บเป็นข้อความ (รักษาเลข 0 นำหน้าตามที่แสดงใน Excel) */
  let a = ws[X.utils.encode_cell({ r: r, c: c })]; if (!a || a.v == null) return "";
  if (a.t === "n") { let w = UN753(a.w); return /^0\d/.test(w) ? w : Number.isInteger(a.v) ? String(a.v) : (w || String(a.v)); }
  if (a.t === "d") return UN753(a.w);
  if (a.t === "b") return a.v ? "TRUE" : "FALSE";
  if (a.t === "e") return "";
  return UN753(a.v);
}
function UV806(ws, X, r, c) { let a = ws[X.utils.encode_cell({ r: r, c: c })]; return !a || a.v == null || a.v === "" ? null : a.t === "s" || a.t === "str" ? UN753(a.v) : a.v; }
function UF806(wb, X) {   /* หา SHEET + ตำแหน่งคอลัมน์จากชื่อหัวคอลัมน์ */
  let names = wb.SheetNames || [], pri = names.filter((n) => UH806N(n) === "SERVICE NJ"), rest = names.filter((n) => UH806N(n) !== "SERVICE NJ"), why = "";
  for (let n of pri.concat(rest)) {
    let ws = wb.Sheets[n]; if (!ws || !ws["!ref"]) continue;
    let rg = X.utils.decode_range(ws["!ref"]), hd = [];
    for (let c = rg.s.c; c <= rg.e.c; c++) hd.push(UH806N(UX806(ws, X, rg.s.r, c)));
    let ix = {}, miss = [], dup = [];
    UH806.forEach((h, i) => { let p = hd.indexOf(h); p < 0 ? miss.push(h) : (hd.indexOf(h, p + 1) >= 0 && dup.push(h), ix[UK806[i]] = rg.s.c + p); });
    let extra = hd.filter((h) => h && UH806.indexOf(h) < 0);
    if (!miss.length && !dup.length && !extra.length) return { ws: ws, name: n, ix: ix, rg: rg };
    if (UH806N(n) === "SERVICE NJ") why = 'SHEET "' + n + '" หัวคอลัมน์ไม่ตรงรูปแบบ SERVICE NJ LIST' + (miss.length ? " · ไม่พบ: " + miss.join(", ") : "") + (dup.length ? " · ซ้ำ: " + dup.join(", ") : "") + (extra.length ? " · ไม่รู้จัก: " + extra.join(", ") : "");
  }
  return { why: why };
}
function UE806(er) {
  let m = String(er && er.message || er || ""), i = m.indexOf("NJACC_DUPLICATE");
  if (i >= 0) { let a = []; try { a = JSON.parse(m.slice(i + 15).trim()); } catch (e) {} return { dup: !0, msg: Array.isArray(a) && a.length ? a.map((d) => d.label + " " + d.value + " → JOB เดิม: " + (d.jobs || []).join(", ")).join(" · ") : "ข้อมูลซ้ำกับ JOB เดิม" }; }
  i = m.indexOf("NJACC_DOC_REQUIRED"); if (i >= 0) return { msg: "ข้อมูลบังคับไม่ครบ: " + m.slice(i + 18).replace(/^[:\s]+/, "") };
  if (/NJACC_FORBIDDEN|NJACC_MODULE_FORBIDDEN|42501/.test(m)) return { msg: "ไม่มีสิทธิ์สร้าง JOB SERVICE" };
  if (!m || /fetch|network|timeout|abort/i.test(m) || !/NJACC_|[฀-๿]/.test(m)) return { msg: "การเชื่อมต่อขัดข้อง — ไม่แน่ใจว่าบันทึกแล้วหรือไม่ กรุณาตรวจในรายการก่อนอัปโหลดซ้ำ (อัปโหลดซ้ำจะถูกตรวจข้อมูลซ้ำ)" + (m ? " · " + m : "") };
  return { msg: m };
}
function UMS806(list, v, lb) {   /* จับคู่ข้อมูลหลักด้วยชื่อ (ตรงทั้งคำ ไม่สนตัวพิมพ์ / ช่องว่าง) → รหัส · ต้องพบ 1 รายการ */
  let k = UN753(v).toLowerCase(); if (!k) return { err: "ไม่มี" + lb };
  let act = (list || []).filter((x) => x && x.active !== !1), a = act.filter((x) => UN753(x.name).toLowerCase() === k);
  a.length || (a = act.filter((x) => UN753(x.code).toLowerCase() === k));
  let ids = [...new Set(a.map((x) => x.id))];
  return ids.length === 1 ? { id: ids[0] } : { err: ids.length ? lb + " ชื่อนี้มีมากกว่า 1 รายการในข้อมูลหลัก (" + v + ")" : "ไม่พบ" + lb + "ในข้อมูลหลัก (" + v + ")" };
}
async function UR806(t, f, X, wb) {
  let F = UF806(wb, X);
  if (!F.ws) { c((F.why || 'ไม่รู้จักรูปแบบไฟล์ — รองรับ SHEET "เปิดจ๊อบ" (CALCOMP) หรือ SERVICE NJ LIST (17 คอลัมน์ : ' + UH806.join(", ") + ")") + " — ยังไม่สร้าง JOB", "err"); return !1; }
  let { ws, ix, rg } = F, ms = XG506.masters || {}, rows = [];
  for (let r = rg.s.r + 1; r <= rg.e.r; r++) {
    let x = { row: r + 1 }, T = {};
    UK806.forEach((k) => { T[k] = UX806(ws, X, r, ix[k]); });
    if (UK806.every((k) => !T[k])) continue;   /* แถวว่าง */
    if (rows.length >= 1000) { c("ไฟล์มีมากกว่า 1,000 แถว — แบ่งไฟล์ก่อนนำเข้า · ยังไม่สร้าง JOB", "err"); return !1; }
    x.T = T; x.err = [];
    x.mode = UMN806(T.mode); UM806.indexOf(x.mode) < 0 && x.err.push(T.mode ? "DATA TYPE ไม่อยู่ในรายการโหมดของระบบ (" + T.mode + ")" : "ไม่มี DATA TYPE");
    let cu = UMS806(ms.customers, T.cust, "ลูกค้า"), co = UMS806(ms.companies, T.comp, "บริษัท");
    cu.err ? x.err.push(cu.err) : (x.cu = cu.id); co.err ? x.err.push(co.err) : (x.co = co.id);
    let bl = x.mode === "EX (SEA)" || x.mode === "EX (AIR)" || x.mode === "EX (TRUCK)" || x.mode === "FORM";
    [["inv", "INVOICE NO."], ["dcl", "DCL INV."], ["cjob", "CUSTOMER JOB NO."]].concat(bl ? [] : [["mbl", "MASTER"], ["hbl", "HOUSE B/L NO."]]).forEach(([k, lb]) => { T[k] || x.err.push("ไม่มี " + lb); });
    T.dcl && /^n\/a$/i.test(T.dcl) && x.err.push("DCL INV. เป็น N/A");
    [["eta", "ETA"], ["etd", "ETD"], ["dlv", "วันส่งมอบ"]].forEach(([k, lb]) => { let d = UD753(UV806(ws, X, r, ix[k])); d.ok ? (x[k] = d.v) : x.err.push(lb + " ไม่ใช่วันที่ที่ถูกต้อง (" + T[k] + ")"); });
    rows.push(x);
  }
  if (!rows.length) { c('ไม่มีข้อมูลใน SHEET "' + F.name + '" — ยังไม่สร้าง JOB', "err"); return !1; }
  /* ── ซ้ำกันเองในไฟล์ (ฟิลด์เดียวกับที่ระบบกันซ้ำ) ── */
  let seen = {};
  rows.forEach((x) => [["dcl", "DCL INV."], ["inv", "INVOICE NO."], ["hbl", "HOUSE B/L NO."]].forEach(([k, lb]) => {
    let v = x.T[k].toLowerCase(); if (!v || v === "n/a") return; let K = k + "|" + v;
    seen[K] ? x.err.push(lb + " ซ้ำกับแถว " + seen[K] + " ในไฟล์ (" + x.T[k] + ")") : (seen[K] = x.row);
  }));
  /* ── ซ้ำกับ JOB ในระบบ (njacc_job_dup_check เดิม · อ่านอย่างเดียว) ── */
  let chk = rows.filter((x) => !x.err.length), fail = null, q = chk.slice();
  await Promise.all([0, 1, 2, 3].map(async () => {
    for (let x; !fail && (x = q.shift());) {
      try { let r = await RPC753("njacc_job_dup_check", { p: { charge_type: "SERVICE", customs_declaration_no: x.T.dcl, source_invoice_no: x.T.inv, house_bl_no: x.T.hbl } });
        if (!r || typeof r !== "object") throw new Error("NO_RESULT");
        r.ok === !1 && Array.isArray(r.dups) && r.dups.length && (x.dup = r.dups.map((d) => d.label + " " + d.value + " → JOB เดิม: " + (d.jobs || []).join(", ")).join(" · ")); }
      catch (e) { fail = e; }
    }
  }));
  if (fail) { c("ตรวจข้อมูลซ้ำกับระบบไม่สำเร็จ — ยังไม่สร้าง JOB · " + String(fail && fail.message || fail || ""), "err"); return !1; }
  rows.forEach((x) => { x.st = x.err.length ? "bad" : x.dup ? "dup" : "ready"; });
  /* ── Preview (ยังไม่บันทึก) ── */
  let bd = document.createElement("div"), ft = document.createElement("div"), RED = "#b91c1c", GRN = "#15803d", BLU = "#1d4ed8";
  let stTxt = (x) => x.st === "ready" ? "ผ่าน · พร้อมนำเข้า" : x.st === "dup" ? "ข้อมูลซ้ำ (ห้ามนำเข้า) — " + x.dup : "ไม่ผ่าน — " + x.err.join(" · ");
  let D = (v) => v ? v.slice(8, 10) + "/" + v.slice(5, 7) + "/" + v.slice(0, 4) : "";
  let cols = [["Excel Row", (x) => x.row], ["ITEM", (x) => x.T.item], ["DATA TYPE", (x) => x.T.mode], ["CUSTOMER NAME", (x) => x.T.cust], ["COMPANY INVOICE", (x) => x.T.comp], ["INVOICE NO.", (x) => x.T.inv], ["MASTER", (x) => x.T.mbl], ["HOUSE B/L NO.", (x) => x.T.hbl], ["DCL INV.", (x) => x.T.dcl], ["CUSTOMER JOB NO.", (x) => x.T.cjob],
    ["ETA", (x) => x.eta !== void 0 ? D(x.eta) : x.T.eta], ["ETD", (x) => x.etd !== void 0 ? D(x.etd) : x.T.etd], ["ท่านำเข้า", (x) => x.T.port], ["ท่าตรวจปล่อย", (x) => x.T.rel], ["เบอร์ตู้ (Container No.)", (x) => x.T.cont], ["Booking No.", (x) => x.T.book], ["วันส่งมอบ", (x) => x.dlv !== void 0 ? D(x.dlv) : x.T.dlv], ["หมายเหตุ", (x) => x.T.note]];
  let opt = (a) => a.map((v) => `<option value="${s(v)}">${s(v)}</option>`).join("");
  bd.innerHTML = `<div class="up806" style="width:min(1180px,calc(100vw - 72px));max-width:100%"><div class="up806-def" style="display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:0 0 8px;padding:8px 10px;border:1px solid #ddd6fe;background:#f5f3ff;border-radius:8px;font-size:13px">
      <b style="color:#6d28d9">ค่าที่ไม่มีใน Excel (บังคับตามฟอร์มเปิดงานเดิม · ใช้กับทุกรายการที่บันทึก)</b>
      <label style="display:inline-flex;align-items:center;gap:6px">ประเภท <span style="color:${RED}">*</span><select class="sel" id="up806-cat"><option value="">— เลือกประเภท —</option>${opt(UC806)}</select></label>
      <label style="display:inline-flex;align-items:center;gap:6px">ประเภทงาน <span style="color:${RED}">*</span><select class="sel" id="up806-cg"><option value="">— FCL / LCL / FZ / FZ+FZ —</option>${UG806.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label></div>
    <div class="t-sm mb-1" id="up806-sum"></div><div class="tbl-wrap" style="max-height:52vh;overflow:auto;max-width:100%"><table class="tbl" style="white-space:nowrap"><thead><tr>${cols.map((k, j) => `<th>${s(k[0])}</th>` + (j ? "" : "<th>สถานะ</th>")).join("")}</tr></thead><tbody>${rows.map((x, i) => `<tr data-up806="${i}">${cols.map((k, j) => `<td>${s(k[1](x) == null ? "" : String(k[1](x)))}</td>` + (j ? "" : `<td class="up806-st" style="color:${x.st === "ready" ? BLU : RED};font-weight:600;white-space:normal;min-width:260px;max-width:420px">${s(stTxt(x))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  let nReady = rows.filter((x) => x.st === "ready").length, nDup = rows.filter((x) => x.st === "dup").length, nBad = rows.filter((x) => x.st === "bad").length, ok = 0, bad = 0, saving = !1, done = !1;
  let cat = bd.querySelector("#up806-cat"), cg = bd.querySelector("#up806-cg");
  let sm = () => { let e = bd.querySelector("#up806-sum"); e && (e.innerHTML = `แถว Excel ทั้งหมด: <b>${rows.length}</b> · ผ่าน (พร้อมนำเข้า): <b style="color:${BLU}">${nReady}</b> · ไม่ผ่าน: <b style="color:${RED}">${nDup + nBad}</b> (ข้อมูลซ้ำ ${nDup} · ข้อมูลไม่ถูกต้อง/ไม่ครบ ${nBad})${saving || done ? ` · บันทึกสำเร็จ: <b style="color:${GRN}">${ok}</b> · ไม่สำเร็จ: <b style="color:${RED}">${bad}</b>` : ""}${done ? "" : saving ? " · กำลังบันทึก…" : nReady ? ` · <b>ยังไม่บันทึกจนกว่าจะเลือก ประเภท + ประเภทงาน แล้วกด "บันทึกข้อมูล"</b>` : " · <b>ไม่มีรายการที่บันทึกได้</b>"}`); };
  let st = (i, h, col) => { let e = bd.querySelector(`tr[data-up806="${i}"] .up806-st`); e && (e.textContent = h, e.style.color = col); };
  ft.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button><button class="btn btn-p" id="up806-save" disabled>\u{1F4BE} บันทึกข้อมูล (${nReady} JOB)</button>`;
  k({ title: "UPLOAD SERVICE NJ LIST — " + s(f.name), body: bd, footer: ft, large: !0 }); sm();
  let sv = ft.querySelector("#up806-save"), cl = ft.querySelector("[data-close]"), en = () => { sv.disabled = saving || done || !nReady || !cat.value || !cg.value; };
  cat.addEventListener("change", en); cg.addEventListener("change", en); en();
  let td = new Date(), today = td.getFullYear() + "-" + UP2753(td.getMonth() + 1) + "-" + UP2753(td.getDate()), rq = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  let rel = () => { UB753 = !1; }, mo = new MutationObserver(() => { if (!bd.isConnected && !saving) { mo.disconnect(); rel(); } });
  mo.observe(document.body, { childList: !0, subtree: !0 });   /* ปิดหน้าต่าง = ไม่บันทึก · ปลดล็อกให้ UPLOAD ใหม่ได้ */
  sv.addEventListener("click", async () => {
    if (saving || done || !cat.value || !cg.value) return; saving = !0; en(); cl.disabled = !0; cat.disabled = !0; cg.disabled = !0; sm();
    let C = cat.value, G = cg.value;
    for (let i = 0; i < rows.length; i++) {
      let x = rows[i], T = x.T; if (x.st !== "ready") continue;
      st(i, "กำลังบันทึก…", BLU);
      let rp = T.rel ? (UR806P.indexOf(T.rel) >= 0 ? { release_port: T.rel, release_port_other: null } : { release_port: "อื่น", release_port_other: T.rel }) : {};
      let p = { job: { charge_type: "SERVICE", company_group: t.group, data_type: x.mode, reference_date: today, reference_no: null, job_date: today,
          company_invoice_id: x.co, customer_id: x.cu, customer_job_no: T.cjob, customs_declaration_no: T.dcl, source_invoice_no: T.inv, house_bl_no: T.hbl || null, master_bl_no: T.mbl || null,
          booking_no: T.book || null, etd: x.etd || null, eta: x.eta || null, delivery_date: x.dlv || null, note: T.note || null, request_id: "up806_" + rq + "_" + i },
        doc: Object.assign({ job_category: C, cargo_fcl: G === "fcl", cargo_lcl: G === "lcl", cargo_fz: G === "fz", cargo_fz_fz: G === "fzfz", import_port: T.port || null, container_no: T.cont || null }, rp) };
      let r = null, er = null;
      try { r = await RPC753("njacc_save_document_job", { p: p }); } catch (e) { er = e; }
      if (r && r.id) { ok++; st(i, "สำเร็จ (แถว " + x.row + ") · " + (r.job_no || r.open_no || ("ID " + String(r.id).slice(0, 8))) + (r.job_no || r.open_no ? "" : " (รอ POST ออกเลข JOB)"), GRN); }
      else { bad++; let y = UE806(er); st(i, (y.dup ? "ข้อมูลซ้ำ (ห้ามนำเข้า) — " : "ไม่สำเร็จ (แถว " + x.row + ") — ") + y.msg, RED); }
      sm();
    }
    saving = !1; done = !0; bd.isConnected || (mo.disconnect(), rel()); sm(); en(); cl.disabled = !1; cl.textContent = "✕ ปิด"; sv.style.display = "none";
    try { t.refresh && t.refresh(); } catch (e) {}
    c("UPLOAD SERVICE NJ LIST : สร้าง JOB สำเร็จ " + ok + " / ไม่สำเร็จ " + bad, bad ? "err" : "ok");
  });
  return !0;
}
(function () { try {   /* V.806 : ปุ่ม UPLOAD EXCEL สีม่วง (เฉพาะปุ่มนี้ · ขนาด / ตำแหน่งเดิม) */
  if (typeof document === "undefined" || document.getElementById("up806-css")) return;
  let e = document.createElement("style"); e.id = "up806-css";
  e.textContent = ".btn.up753-btn{background:#7C3AED;color:#FFFFFF;border-color:#6D28D9;font-weight:600;border-radius:10px}.btn.up753-btn:hover,.btn.up753-btn:focus-visible{background:#6D28D9;border-color:#6D28D9;color:#FFFFFF}.btn.up753-btn .up806-i{width:15px;height:15px;flex:none;display:inline-block;vertical-align:-2px}";
  document.head.appendChild(e);
} catch (_) {} })();
