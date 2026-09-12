import{c as a}from"./chunk-MZQK3TFF.js";import{a as r}from"./chunk-YM5GFE6V.js";import"./chunk-OFOOXWUM.js";import"./chunk-F5ETAYOF.js";import{e as c}from"./chunk-PCFU74ZV.js";async function h(i,{jobId:t}){let o=null;try{o=await a(t)}catch(l){r(l)}if(o&&o.invoice_id){location.replace("#/invoice/"+o.invoice_id);return}let n=o&&o.charge_type||"SERVICE",b="#/accounting/"+String(n).toLowerCase();i.innerHTML=`
    <div class="card card-pad">
      <h3 class="mb-2">\u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E2D\u0E01 Invoice \u0E1C\u0E48\u0E32\u0E19 ACCOUNTING &gt; \u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</h3>
      <p class="t-3 mb-2">
        ${o?"\u0E07\u0E32\u0E19 <b>"+c(o.job_no||"")+"</b> ":""}\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01 Invoice<br>
        \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01 Invoice \u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E41\u0E25\u0E49\u0E27 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E17\u0E38\u0E01\u0E43\u0E1A\u0E1C\u0E48\u0E32\u0E19\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 \u201C\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u201D \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A
      </p>
      <div class="jm-hint mb-2">
        ACCOUNTING &gt; ${c(n)} \u2192 \u0E1B\u0E38\u0E48\u0E21 <b>\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</b> \u2192 DOCUMENT \u2192 \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u2192 INVOICE \u2192 \u0E2D\u0E2D\u0E01 Invoice
      </div>
      <div class="row">
        <button class="btn btn-p" id="iv-go">\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32 ACCOUNTING</button>
        ${o?'<button class="btn btn-o" id="iv-job">\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19</button>':""}
      </div>
    </div>`,i.querySelector("#iv-go").onclick=()=>location.hash=b;let e=i.querySelector("#iv-job");e&&(e.onclick=()=>location.hash="#/job/"+t)}export{h as render};
