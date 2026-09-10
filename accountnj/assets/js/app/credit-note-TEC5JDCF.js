import{a as vt}from"./chunk-OWSY2KDQ.js";import{a as W,b as X}from"./chunk-OM6VAH5J.js";import{a as dt,e as it}from"./chunk-MOD2MO2R.js";import{a as K}from"./chunk-RGVAFVSR.js";import{j as rt,s as lt}from"./chunk-ZNHW356Z.js";import{f as nt,g as F,h as ct}from"./chunk-NO6JZBTH.js";import"./chunk-GDT6F23K.js";import{a as G,b as R,c as ot,e as V,f as j}from"./chunk-OPGKUGLK.js";import{a as m}from"./chunk-OFOOXWUM.js";import{i as E}from"./chunk-37ELUCVE.js";import{a as A}from"./chunk-UWAYW6DC.js";import{a as at,d as J,e as Q}from"./chunk-DIH2PLYD.js";import{a as o,b as N,c as y,d as et,e as i}from"./chunk-PCFU74ZV.js";function z(t){let n=String(t&&(t.message||t.hint||t.details)||"");return/PGRST202/i.test(n)||/Could not find the function/i.test(n)||/schema cache/i.test(n)&&/njacc_(credit_note|save_credit|post_credit|list_credit|void_credit|delete_credit)/i.test(n)}var ut=t=>E("njacc_credit_note_invoice_options",{p:t}),bt=t=>E("njacc_credit_note_source",{p_invoice:t}),mt=t=>E("njacc_save_credit_note_draft",{p:t}),Y=(t,n)=>E("njacc_post_credit_note",{p_id:t,p_request_id:n}),M=t=>E("njacc_credit_note_view",{p_id:t}),ht=t=>E("njacc_list_credit_notes",{p:t}),ft=(t,n)=>E("njacc_delete_credit_note_draft",{p_id:t,p_reason:n}),_t=(t,n,e)=>E("njacc_void_credit_note",{p_id:t,p_reason:n,p_request_id:e}),pt={NJACC_CN_NOT_FOUND:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E1A\u0E19\u0E35\u0E49",NJACC_CN_NOT_DRAFT:"\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27",NJACC_CN_NOT_POSTED:"Void \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",NJACC_CN_ALREADY_POSTED:"\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49 POST \u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",NJACC_CN_REASON_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E01\u0E48\u0E2D\u0E19",NJACC_CN_INVOICE_NOT_CREDITABLE:"INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01)",NJACC_CN_INVOICE_MISMATCH:"\u0E23\u0E48\u0E32\u0E07\u0E19\u0E35\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A INVOICE \u0E04\u0E19\u0E25\u0E30\u0E43\u0E1A",NJACC_CN_ITEM_NOT_FOUND:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E43\u0E19 INVOICE",NJACC_CN_ITEM_NOT_IN_INVOICE:"\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49",NJACC_CN_ITEM_DUPLICATE:"\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19\u0E43\u0E19\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49",NJACC_CN_AMOUNT_INVALID:"\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0",NJACC_CN_EXCEEDS_CREDITABLE:"\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E25\u0E14\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E2B\u0E49"};function T(t){let n=String(t&&t.message||"");for(let e in pt)if(n.includes(e))return pt[e];return n||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14"}var I=(t,n="-")=>{let e=t==null?"":String(t).trim();return i(e||n)},S=t=>{let n=Number(t);return Number.isFinite(n)?n:0},D=t=>Math.round((S(t)+Number.EPSILON)*100)/100,Z=t=>{let n=S(t);return(Number.isInteger(n)?String(n):String(D(n)))+"%"},$t={user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4.4" y="3" width="15.2" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',id:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.6" cy="11" r="2"/><path d="M5.4 16.2c.5-1.5 1.7-2.3 3.2-2.3s2.7.8 3.2 2.3M14.6 10h4.2M14.6 13.4h3"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21c4-4.6 6-7.9 6-10.6A6 6 0 0 0 6 10.4C6 13.1 8 16.4 12 21z"/><circle cx="12" cy="10.3" r="2.3"/></svg>',tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.2 3.8h3.2l1.6 4-2 1.4a12 12 0 0 0 5.8 5.8l1.4-2 4 1.6v3.2a1.6 1.6 0 0 1-1.8 1.6C11.5 18.7 5.3 12.5 4.6 5.6a1.6 1.6 0 0 1 1.6-1.8z"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.4" y="5" width="17.2" height="15.6" rx="2"/><path d="M3.4 9.6h17.2M8 3.4v3.4M16 3.4v3.4"/></svg>',list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.6 3.8 20.2 7.4 8 19.6l-4.4.8.8-4.4z"/><path d="M14.4 6l3.6 3.6"/></svg>'},w=t=>`<span class="cnd-ic">${$t[t]||""}</span>`,gt=t=>`<span class="cnd-bub">${$t[t]||""}</span>`;function It(t){let n=0,e=0,r=0,c=new Set;for(let b of t)n=D(n+S(b.amount)),e=D(e+S(b.vat_amount)),r=D(r+S(b.credit_amount)),c.add(S(b.vat_rate));let v=c.size===1?[...c][0]:null;return{sub:n,vat:e,total:r,vatRate:v}}function wt(t){let n=t.items||[],e=It(n),r=t.customer||{},c=t.invoice||{},v=t.invoice_items||[],b=String(t.status||"").toUpperCase(),p=b==="DRAFT",a=b==="VOID",_=String(t.credit_note_no||""),C=p||/^CNDRAFT-/.test(_)?null:_,P=e.vat>0,H=v.length?v.map((u,x)=>`<tr>
        <td class="cnd-c cnd-dim">${u.line_no??x+1}</td>
        <td class="cnd-c cnd-b">${I(c.invoice_no)}</td>
        <td class="cnd-c">${y(c.invoice_date)}</td>
        <td class="cnd-ds">${I(u.description,"-")}</td>
        <td class="cnd-r">${o(u.amount)}</td>
      </tr>`).join(""):'<tr><td colspan="5" class="cnd-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</td></tr>',B=v.reduce((u,x)=>D(u+S(x.amount)),0),s=n.some(u=>u.original_amount!==null&&u.original_amount!==void 0),d=u=>u.correct_amount===null||u.correct_amount===void 0?null:S(u.correct_amount),f=0,g=0,k=!0;for(let u of n){if(u.original_amount===null||u.original_amount===void 0)continue;f=D(f+S(u.original_amount));let x=d(u);x===null?k=!1:g=D(g+x)}let q=n.length?n.map((u,x)=>{let yt=u.original_amount!==null&&u.original_amount!==void 0,st=d(u);return`<tr>
        <td class="cnd-c cnd-dim">${u.line_no??x+1}</td>
        <td class="cnd-ds">${I(u.description,"-")}</td>
        <td class="cnd-r">${yt?o(u.original_amount):"-"}</td>
        <td class="cnd-r">${st===null?"-":o(st)}</td>
        <td class="cnd-r cnd-df">${o(u.amount)}</td>
        <td class="cnd-c">${i(Z(u.vat_rate))}</td>
        <td class="cnd-r">${o(u.vat_amount)}</td>
        <td class="cnd-r cnd-cr">${o(u.credit_amount)}</td>
      </tr>`}).join(""):'<tr><td colspan="8" class="cnd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>',Tt=e.vatRate===null?"VAT / \u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21":`VAT ${Z(e.vatRate)} / \u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 ${Z(e.vatRate)}`,Nt=(e.vatRate===null,"Total VAT / \u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21");return`
    <div class="cnd print-area${a?" cnd-void":""}${p?" cnd-draft":""}">
      ${a?'<div class="cnd-badge cnd-badge-v">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}
      ${p?'<div class="cnd-badge cnd-badge-d">DRAFT / \u0E23\u0E48\u0E32\u0E07 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</div>':""}

      <header class="cnd-head">
        <div class="cnd-head-l">
          <img class="cnd-logo" src="${A.logo}" alt="N.J. Logistics">
          <div class="cnd-co">
            <div class="cnd-co-nm">${i(A.nameEn)}</div>
            <div class="cnd-co-ad">${i(A.address)}</div>
            <div class="cnd-co-tl">
              ${w("tel")} ${i(A.tel)} <i>|</i>
              ${w("doc")} ${i(A.fax)} <i>|</i>
              Tax ID: ${i(A.taxId)}
            </div>
          </div>
        </div>
        <div class="cnd-head-r">
          <div class="cnd-title">CREDIT NOTE</div>
          <div class="cnd-title-th">\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div>
          ${P?'<div class="cnd-chip">TAX INVOICE <i>/</i> \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35</div>':""}
        </div>
      </header>
      <div class="cnd-band"></div>

      <section class="cnd-grid">
        <div class="cnd-box">
          <div class="cnd-box-t">${gt("user")}<span>CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f">${w("user")}
              <div class="cnd-f-b"><div class="cnd-l">Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</div>
                <div class="cnd-v cnd-v-b">${I(r.name)}</div></div></div>
            <div class="cnd-f cnd-f-2">${w("id")}
              <div class="cnd-f-b"><div class="cnd-l">Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</div>
                <div class="cnd-v">${I(r.tax_id)}</div></div>
              <div class="cnd-f-b cnd-f-br"><div class="cnd-l">Branch / \u0E2A\u0E32\u0E02\u0E32</div>
                <div class="cnd-v">${I(r.branch_code)}</div></div></div>
            <div class="cnd-f">${w("pin")}
              <div class="cnd-f-b"><div class="cnd-l">Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</div>
                <div class="cnd-v cnd-v-ml">${I(r.address)}</div></div></div>
            <div class="cnd-f cnd-f-last">${w("tel")}
              <div class="cnd-f-b"><div class="cnd-l">Tel. / \u0E42\u0E17\u0E23.</div>
                <div class="cnd-v cnd-v-b">${I(r.phone)}</div></div></div>
          </div>
        </div>

        <div class="cnd-box">
          <div class="cnd-box-t">${gt("doc")}<span>CREDIT NOTE DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f cnd-f-kv">${w("doc")}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv">${C?i(C):'<span class="cnd-pend">\u0E23\u0E2D\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E15\u0E2D\u0E19 POST</span>'}</div></div>
            <div class="cnd-f cnd-f-kv">${w("cal")}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv cnd-kv-s">${y(t.credit_note_date)}</div></div>
            <div class="cnd-f cnd-f-kv">${w("cal")}
              <div class="cnd-f-b"><div class="cnd-l">Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv cnd-kv-s">${I(c.invoice_no)}</div></div>
            <div class="cnd-f cnd-f-last">${w("note")}
              <div class="cnd-f-b"><div class="cnd-l">Reason / \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div>
                <div class="cnd-v cnd-v-ml">${I(t.reason)}</div></div></div>
          </div>
        </div>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">INVOICE REFERENCE <i>/ \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</i></div>
        <table class="cnd-tbl cnd-tbl-ref">
          <colgroup><col class="w-no"><col class="w-ino"><col class="w-idt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Invoice No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th>
            <th class="cnd-c">Invoice Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th>
            <th class="cnd-c">Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="cnd-c">Amount (THB) / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19</th>
          </tr></thead>
          <tbody>${H}</tbody>
          <tfoot><tr class="cnd-sumrow">
            <td colspan="4" class="cnd-r">Total Referenced Amount / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</td>
            <td class="cnd-r cnd-b">${o(B)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">CREDIT NOTE ITEMS <i>/ \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</i></div>
        <table class="cnd-tbl cnd-tbl-cn">
          <colgroup><col class="w-no"><col class="w-ds"><col class="w-og"><col class="w-co">
            <col class="w-df"><col class="w-vr"><col class="w-va"><col class="w-cr"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="cnd-c">Original /<br>\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21</th>
            <th class="cnd-c">Correct /<br>\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07</th>
            <th class="cnd-c">Difference /<br>\u0E1C\u0E25\u0E15\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E25\u0E14</th>
            <th class="cnd-c">VAT Rate /<br>\u0E2D\u0E31\u0E15\u0E23\u0E32 VAT</th>
            <th class="cnd-c">VAT Diff. /<br>VAT \u0E17\u0E35\u0E48\u0E25\u0E14</th>
            <th class="cnd-c">Credit Amount /<br>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th>
          </tr></thead>
          <tbody>${q}</tbody>
          <tfoot>
            ${s?`<tr class="cnd-sumrow">
              <td colspan="2" class="cnd-r">Total / \u0E23\u0E27\u0E21</td>
              <td class="cnd-r">${o(f)}</td>
              <td class="cnd-r">${k?o(g):"-"}</td>
              <td class="cnd-r cnd-df">${o(e.sub)}</td>
              <td></td>
              <td class="cnd-r">${o(e.vat)}</td>
              <td class="cnd-r">${o(e.total)}</td></tr>`:""}
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">Total Credit (Before VAT) / \u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21</td>
              <td class="cnd-r">${o(e.sub)}</td></tr>
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">${i(Nt)}</td>
              <td class="cnd-r">${o(e.vat)}</td></tr>
            <tr class="cnd-sumrow cnd-sumrow-g">
              <td colspan="7" class="cnd-r">TOTAL CREDIT AMOUNT / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</td>
              <td class="cnd-r">${o(e.total)}</td></tr>
          </tfoot>
        </table>
      </section>

      <section class="cnd-mid">
        <div class="cnd-words">
          <div class="cnd-words-t">Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</div>
          <div class="cnd-words-v">( ${i(vt(e.total))} )</div>
          <div class="cnd-words-ln"></div>
        </div>
        <div class="cnd-sum">
          <div class="cnd-sl"><span>SubTotal (Before VAT) / \u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21</span>
            <span>${o(e.sub)}</span></div>
          <div class="cnd-sl"><span>${i(Tt)}</span><span>${o(e.vat)}</span></div>
          <div class="cnd-sl cnd-sl-g"><span>TOTAL CREDIT AMOUNT / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span>
            <span>${o(e.total)}</span></div>
        </div>
      </section>

      <section class="cnd-note">
        <div class="cnd-note-t">NOTE / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div>
        <ol class="cnd-note-l">
          <li><span>This Credit Note is issued for the amount as stated above.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19</em></li>
          <li><span>This Credit Note will be used to adjust the payment in the next invoice.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E08\u0E30\u0E16\u0E39\u0E01\u0E19\u0E33\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E43\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E16\u0E31\u0E14\u0E44\u0E1B</em></li>
          <li><span>No cash refund for this Credit Note.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E02\u0E2D\u0E04\u0E37\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E44\u0E14\u0E49</em></li>
        </ol>
      </section>

      <div class="cnd-edge"></div>
    </div>`}function U(t,{print:n=!1}={}){let e=document.createElement("div");e.innerHTML=wt(t);let r=document.createElement("div");r.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="cnd-print">\u{1F5A8} Print Credit Note</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;let c=String(t.credit_note_no||"");at({title:"\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 "+(/^CNDRAFT-/.test(c)||String(t.status).toUpperCase()==="DRAFT"?"(\u0E23\u0E48\u0E32\u0E07)":c),body:e,footer:r,fullscreen:!0,wide:!0}),r.querySelector("#cnd-print").onclick=()=>window.print(),n&&setTimeout(()=>window.print(),60)}var Et="sql/RUN-NOW/ (\u0E14\u0E39 README_RUN-NOW.txt)",h={q:"",customer:"",status:"",from:"",to:"",page:1,size:20},$={q:"",page:1,size:10},l=null,O=t=>{let n=Number(t);return Number.isFinite(n)?n:0},St=t=>{let n=O(t);return(Number.isInteger(n)?String(n):String(N(n)))+"%"},Ot={DRAFT:["bdg-due-ok","\u0E23\u0E48\u0E32\u0E07"],POSTED:["bdg-issued","POSTED"],VOID:["bdg-void","VOID"]},kt=t=>{let[n,e]=Ot[String(t||"").toUpperCase()]||["bdg-due-ok",t||"-"];return`<span class="bdg ${n}">${i(e)}</span>`};function tt(t){t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE \u2014 CREDIT NOTE / \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h2></div></div>
    <div class="card card-pad cnp-req">
      <h3 class="t-b">BACKEND REQUIRED \u2014 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</h3>
      <p class="t-2 mt-1">\u0E15\u0E23\u0E27\u0E08\u0E01\u0E31\u0E1A\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</p>
      <ul class="cnp-req-l">
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07 <code>njacc_credit_notes</code> \u0E41\u0E25\u0E30 <code>njacc_credit_note_items</code></li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35 RPC \u0E02\u0E2D\u0E07 Credit Note (\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E48\u0E32\u0E07 / POST / \u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 / \u0E15\u0E23\u0E27\u0E08\u0E40\u0E1E\u0E14\u0E32\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49)</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E23\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E19 <code>njacc_document_sequences</code></li>
      </ul>
      <p class="t-sm t-3 mt-2">\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E1A\u0E19 Supabase \u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07:</p>
      <p class="cnp-req-f"><code>${i(Et)}</code></p>
      <p class="t-sm t-3 mt-2">\u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E23\u0E31\u0E19 <code>SECTION 3</code> \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19
        \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1C\u0E25 (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E41\u0E01\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)</p>
      <p class="t-sm t-3 mt-2">\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E19 \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34
        \u2014 \u0E44\u0E1F\u0E25\u0E4C SQL \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 INVOICE / RECEIPT / JOB / \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E14\u0E34\u0E21</p>
    </div>`}async function Yt(t){l=null,await rt(),await L(t)}async function L(t){t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE \u2014 CREDIT NOTE / \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h2></div>
      ${F("invoice")?'<button class="btn btn-p" id="cn-new">+ \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</button>':""}</div>
    <!-- Main List Container \u0E40\u0E14\u0E35\u0E22\u0E27 (.ch-panel \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A DOCUMENT/ACCOUNTING)
         Filter + Table + Empty State + Total + Pagination \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27
         Empty State \u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 <tbody> \u0E40\u0E14\u0E34\u0E21 \xB7 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 renderer/\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21/logic \u0E43\u0E14 \u0E46 -->
    <div class="ch-panel">
    <div class="fbar">
      <input class="inp" data-f="q" value="${i(h.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 / INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
      <select class="sel" data-f="customer">${lt(h.customer)}</select>
      <select class="sel" data-f="status">
        <option value="">\u2014 \u0E17\u0E38\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30 \u2014</option>
        <option value="DRAFT" ${h.status==="DRAFT"?"selected":""}>\u0E23\u0E48\u0E32\u0E07</option>
        <option value="POSTED" ${h.status==="POSTED"?"selected":""}>POSTED</option>
        <option value="VOID" ${h.status==="VOID"?"selected":""}>VOID</option>
      </select>
      <input class="inp" type="date" data-f="from" value="${h.from}">
      <input class="inp" type="date" data-f="to" value="${h.to}">
      <button class="btn btn-o btn-sm" id="cn-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
    </div>
    <div class="card mt-2" id="cn-pgn"></div>
    <div class="tbl-wrap lp-scroll"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>INVOICE \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</th>
      <th>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25</th><th class="r">\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="cn-tbody">
      <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    </div>`,W(t);let n=t.querySelector("#cn-new");n&&(n.onclick=()=>At(t)),t.querySelector("#cn-go").onclick=()=>{t.querySelectorAll("[data-f]").forEach(c=>{h[c.dataset.f]=c.value}),h.page=1,r()},t.querySelector("#cn-tbody").addEventListener("click",c=>xt(c,t,r));function e(){it({table:t.querySelector("#cn-tbody")&&t.querySelector("#cn-tbody").closest("table"),modeKey:"FINANCE_CREDIT_NOTE",host:t.querySelector(".fbar")})}e(),dt(t.querySelector("#cn-tbody"),async c=>{let v=c.dataset.cnid;if(v)try{U(await M(v))}catch(b){m(T(b),"err")}});async function r(){let c=G("cn-list"),v=t.querySelector("#cn-tbody");if(v)try{let b=await ht({q:h.q||null,customer_id:h.customer||null,status:h.status||null,from:h.from||null,to:h.to||null,page:h.page,size:h.size});if(!R("cn-list",c))return;let p=b.rows||[];v.innerHTML=p.length?p.map(a=>{let _=String(a.status||"").toUpperCase(),C=String(a.credit_note_no||"");return`<tr data-cnid="${i(a.id)}">
        <td class="t-b">${/^CNDRAFT-/.test(C)?'<span class="t-3">\u2014 \u0E23\u0E48\u0E32\u0E07 \u2014</span>':i(C)}</td>
        <td>${y(a.credit_note_date)}</td>
        <td class="ellip" style="max-width:200px">${i(a.customer_name||"-")}</td>
        <td class="t-b">${i(a.invoice_no||"-")}</td>
        <td class="ellip t-xs" style="max-width:180px">${i(a.reason||"-")}</td>
        <td class="r t-b">${o(a.total_amount)}</td>
        <td>${kt(_)}</td>
        <td><div class="ch-act">
          ${_==="DRAFT"&&F("invoice")?`<button class="btn btn-o btn-sm" data-edit="${a.invoice_id}" data-cn="${a.id}">\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07</button>
               <button class="btn btn-p btn-sm" data-post="${a.id}">POST</button>
               
               ${nt("FINANCE")?`<button class="btn btn-danger btn-sm" data-del="${a.id}">\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07</button>`:""}`:""}
          ${_==="POSTED"&&(ct()||F("void"))?`<button class="btn btn-danger btn-sm" data-void="${a.id}" data-no="${i(C)}">Void</button>`:""}
        </div></td></tr>`}).join(""):'<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</td></tr>',K(t.querySelector("#cn-pgn"),{page:h.page,size:h.size,total:b.total||0},({page:a,size:_})=>{h.page=a,h.size=_,r()},{lp:!0}),e(),X()}catch(b){if(!R("cn-list",c))return;if(z(b)){tt(t);return}v.innerHTML='<tr><td colspan="8" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',m(T(b),"err")}}await r()}async function xt(t,n,e){let r=t.target.closest("[data-doc]");if(r){try{U(await M(r.dataset.doc))}catch(a){m(T(a),"err")}return}let c=t.target.closest("[data-edit]");if(c){Ct(n,c.dataset.edit,c.dataset.cn);return}let v=t.target.closest("[data-post]");if(v){if(!await J("POST \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49","\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E08\u0E23\u0E34\u0E07 (CN{\u0E1B\u0E35\u0E40\u0E14\u0E37\u0E2D\u0E19}-#####) \u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46","POST"))return;try{let a=await V("cn-post-"+v.dataset.post,()=>Y(v.dataset.post,j()));a&&m("POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 "+(a.credit_note_no||""),"ok"),e()}catch(a){m(T(a),"err")}return}let b=t.target.closest("[data-del]");if(b){let a=await Q("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 (\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E23\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST)");if(!a)return;try{await V("cn-del-"+b.dataset.del,()=>ft(b.dataset.del,a)),m("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27","ok"),e()}catch(_){m(T(_),"err")}return}let p=t.target.closest("[data-void]");if(p){let a=await Q("Void \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 "+p.dataset.no);if(!a)return;try{await V("cn-void-"+p.dataset.void,()=>_t(p.dataset.void,a,j())),m("Void \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27","ok"),e()}catch(_){m(T(_),"err")}}}async function At(t){$.page=1,t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE</h2></div>
      <button class="btn btn-o" id="cn-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \xB7 \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E25\u0E14\u0E44\u0E14\u0E49
        \xB7 \u201C\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01\u201D \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E22\u0E2D\u0E14\u0E01\u0E48\u0E2D\u0E19 VAT \u0E2B\u0E31\u0E01\u0E14\u0E49\u0E27\u0E22\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27</p>
      <div class="fbar mt-2">
        <input class="inp" id="cn-pq" value="${i($.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
        <button class="btn btn-o btn-sm" id="cn-pgo">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      </div>
      <div class="mt-2" id="cn-ppgn"></div>
      <div class="tbl-wrap mt-2 lp-scroll"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E01\u0E48\u0E2D\u0E19 VAT</th><th class="r">\u0E25\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27</th><th class="r">\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01</th>
        <th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
      </tr></thead><tbody id="cn-ptb">
        <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
    </div>`,W(t),t.querySelector("#cn-back").onclick=()=>L(t);let n=t.querySelector("#cn-pq");t.querySelector("#cn-pgo").onclick=()=>{$.q=n.value.trim(),$.page=1,e()},n.addEventListener("input",()=>ot("cn-pick",()=>{$.q=n.value.trim(),$.page=1,e()},350)),t.querySelector("#cn-ptb").addEventListener("click",r=>{let c=r.target.closest("[data-pick]");c&&Ct(t,c.dataset.pick,null)});async function e(){let r=G("cn-pick-load"),c=t.querySelector("#cn-ptb");if(c)try{let v=await ut({q:$.q||null,page:$.page,size:$.size});if(!R("cn-pick-load",r))return;let b=v.rows||[];c.innerHTML=b.length?b.map(p=>{let a=O(p.creditable_remaining);return`<tr>
        <td class="t-b">${i(p.invoice_no||"-")}</td>
        <td>${y(p.invoice_date)}</td>
        <td class="ellip" style="max-width:200px">${i(p.customer_name||"-")}</td>
        <td>${i(p.charge_type||"-")}</td>
        <td class="r">${o(p.subtotal)}</td>
        <td class="r">${o(p.credited)}</td>
        <td class="r t-b">${o(a)}</td>
        <td><div class="ch-act">
          ${a>0?`<button class="btn btn-p btn-sm" data-pick="${p.id}">\u0E40\u0E25\u0E37\u0E2D\u0E01</button>`:'<span class="t-3 t-xs">\u0E25\u0E14\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27</span>'}
        </div></td></tr>`}).join(""):'<tr><td colspan="8" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49</td></tr>',K(t.querySelector("#cn-ppgn"),{page:$.page,size:$.size,total:v.total||0},({page:p,size:a})=>{$.page=p,$.size=a,e()},{lp:!0}),X()}catch(v){if(!R("cn-pick-load",r))return;if(z(v)){tt(t);return}c.innerHTML='<tr><td colspan="8" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',m(T(v),"err")}}await e()}async function Ct(t,n,e){t.innerHTML='<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';let r;try{r=await bt(n)}catch(s){if(z(s)){tt(t);return}return m(T(s),"err"),L(t)}let c=r.invoice||{},v=r.customer||{},b=r.job||{},p=e||r.existing_draft_id||null,a=null;if(p)try{a=await M(p)}catch{a=null}let _=new Map;(a&&a.items||[]).forEach(s=>{s.invoice_item_id&&_.set(s.invoice_item_id,s)}),l={cnId:p,invoiceId:c.id,date:a&&a.credit_note_date||et(new Date),reason:a&&a.reason||"",lines:(r.items||[]).map(s=>{let d=_.get(s.invoice_item_id);return{invoice_item_id:s.invoice_item_id,line_no:s.line_no,description:d?d.description:s.description,origin:O(s.amount),credited:O(s.credited),remaining:O(s.remaining),vat_rate:O(s.vat_rate),on:!!d,amount:O(d?d.amount:s.remaining)}})},t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${p?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49":"\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49"} \u2014 INVOICE ${i(c.invoice_no||"")}</h2></div>
      <button class="btn btn-o" id="cn-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>

    <div class="cnp-top">
      <div class="card card-pad">
        <h3 class="t-b">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</h3>
        <div class="cnp-kv"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label><span class="t-b">${i(v.name||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label><span>${i(v.tax_id||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E2A\u0E32\u0E02\u0E32</label><span>${i(v.branch_code||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label><span>${i(v.address||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E42\u0E17\u0E23.</label><span>${i(v.phone||"-")}</span></div>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</h3>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE</label><span class="t-b">${i(c.invoice_no||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label><span>${y(c.invoice_date)}</span></div>
        <div class="cnp-kv"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label><span>${i(c.status||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</label><span>${i(b.job_no||"-")}</span></div>
        <div class="cnp-kv"><label>\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E40\u0E14\u0E34\u0E21</label><span class="t-b">${o(c.total_amount)}</span></div>
        <p class="t-xs t-3 mt-1">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</p>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h3>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</label>
          <input class="inp w100" type="date" id="cn-date" value="${i(l.date)}"></div>
        <div class="fld"><label>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 <span class="req">*</span></label>
          <input class="inp w100" id="cn-reason" list="cn-reason-sug"
            value="${i(l.reason)}" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u0E40\u0E0A\u0E48\u0E19 \u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E15\u0E32\u0E21\u0E01\u0E32\u0E23\u0E15\u0E01\u0E25\u0E07">
          <datalist id="cn-reason-sug">
            <option value="\u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23"></option>
            <option value="\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E40\u0E01\u0E34\u0E19"></option>
            <option value="\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"></option>
            <option value="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19"></option>
          </datalist>
          <p class="t-xs t-3">\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E19\u0E35\u0E49\u0E08\u0E30\u0E16\u0E39\u0E01\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E25\u0E07\u0E1A\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07</p>
        </div>
        <div class="cnp-kv"><label>CREDIT NOTE</label>
          <span class="t-b" id="cn-no-out">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02</span></div>
        <div class="cnp-kv"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</label>
          <span id="cn-date-out">${i(y(l.date)||"-")}</span></div>
      </div>
    </div>

    <div class="card card-pad mt-2">
      <h3 class="t-b">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E32\u0E01 INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</h3>
      <p class="t-xs t-3">\u0E2D\u0E31\u0E15\u0E23\u0E32 VAT \u0E22\u0E36\u0E14\u0E15\u0E32\u0E21\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A \xB7 \u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 \u201C\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01\u201D
        \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E25\u0E30\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</p>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th class="center" style="width:48px">\u0E40\u0E25\u0E37\u0E2D\u0E01</th>
        <th>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E40\u0E14\u0E34\u0E21</th>
        <th class="r">\u0E25\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27</th>
        <th class="r">\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01</th>
        <th class="r" style="width:132px">\u0E22\u0E2D\u0E14\u0E25\u0E14 (\u0E01\u0E48\u0E2D\u0E19 VAT)</th>
        <th class="center">VAT</th>
        <th class="r">VAT</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th>
      </tr></thead><tbody id="cn-ltb"></tbody></table></div>

      <div class="cnp-foot mt-2">
        <div class="cnp-tot">
          <div><span>\u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19 VAT</span><b id="cn-t-sub">0.00</b></div>
          <div><span>\u0E23\u0E27\u0E21 VAT</span><b id="cn-t-vat">0.00</b></div>
          <div class="cnp-tot-g"><span>\u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span><b id="cn-t-tot">0.00</b></div>
        </div>
        <div class="cnp-btn">
          <button class="btn btn-o" id="cn-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07</button>
          <button class="btn btn-o" id="cn-prev" ${p?"":"disabled"}>\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 / \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          <button class="btn btn-p" id="cn-post" ${p?"":"disabled"}>POST \u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07</button>
        </div>
      </div>
      ${p?"":'<p class="t-xs t-3 mt-1">\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E25\u0E30 POST \u0E44\u0E14\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 (\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)</p>'}
    </div>`,t.querySelector("#cn-back").onclick=()=>L(t),t.querySelector("#cn-date").onchange=s=>{l.date=s.target.value;let d=t.querySelector("#cn-date-out");d&&(d.textContent=l.date?y(l.date):"-")},t.querySelector("#cn-reason").oninput=s=>{l.reason=s.target.value};let C=t.querySelector("#cn-ltb");P(),C.addEventListener("change",s=>{let d=Number(s.target.dataset.i);!Number.isInteger(d)||!l.lines[d]||s.target.dataset.k==="on"&&(l.lines[d].on=s.target.checked,P())}),C.addEventListener("input",s=>{let d=Number(s.target.dataset.i);if(!Number.isInteger(d)||!l.lines[d])return;let f=s.target.dataset.k;f==="amount"?(l.lines[d].amount=O(s.target.value),s.target.classList.toggle("cnp-bad",l.lines[d].amount>l.lines[d].remaining),H(d),B()):f==="desc"&&(l.lines[d].description=s.target.value)}),t.querySelector("#cn-save").onclick=s=>Dt(t,s.target),t.querySelector("#cn-prev").onclick=async()=>{if(l.cnId)try{U(await M(l.cnId))}catch(s){m(T(s),"err")}},t.querySelector("#cn-post").onclick=async()=>{if(l.cnId&&await J("POST \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49","\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E08\u0E23\u0E34\u0E07 (CN{\u0E1B\u0E35\u0E40\u0E14\u0E37\u0E2D\u0E19}-#####) \u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46","POST"))try{let s=await V("cn-post-"+l.cnId,()=>Y(l.cnId,j())),d=t.querySelector("#cn-no-out");d&&s&&s.credit_note_no&&(d.textContent=s.credit_note_no);let f=t.querySelector("#cn-date-out"),g=s&&s.credit_note_date||(t.querySelector("#cn-date")||{}).value||"";f&&g&&(f.textContent=y(g)),s&&m("POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 "+(s.credit_note_no||""),"ok"),setTimeout(()=>L(t),1200)}catch(s){m(T(s),"err")}};function P(){C.innerHTML=l.lines.length?l.lines.map((s,d)=>{let f=s.on&&s.amount>s.remaining,g=N(s.on?s.amount*s.vat_rate/100:0);return`<tr class="${s.on?"":"cnp-off"}">
        <td class="center"><input type="checkbox" data-i="${d}" data-k="on" ${s.on?"checked":""}
          ${s.remaining>0?"":"disabled"}></td>
        <td>${s.on?`<input class="inp w100" data-i="${d}" data-k="desc" value="${i(s.description||"")}">`:`<span class="ellip">${i(s.description||"-")}</span>`}</td>
        <td class="r">${o(s.origin)}</td>
        <td class="r">${o(s.credited)}</td>
        <td class="r t-b">${o(s.remaining)}</td>
        <td class="r">${s.on?`<input class="inp r${f?" cnp-bad":""}" type="number" step="0.01" min="0"
               max="${s.remaining}" data-i="${d}" data-k="amount" value="${s.amount}">`:'<span class="t-3">-</span>'}</td>
        <td class="center">${i(St(s.vat_rate))}</td>
        <td class="r" data-vat="${d}">${s.on?o(g):'<span class="t-3">-</span>'}</td>
        <td class="r t-b" data-cr="${d}">${s.on?o(N(s.amount+g)):'<span class="t-3">-</span>'}</td>
      </tr>`}).join(""):'<tr><td colspan="9" class="empty">INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>',B()}function H(s){let d=l.lines[s];if(!d)return;let f=N(d.amount*d.vat_rate/100),g=C.querySelector(`[data-vat="${s}"]`),k=C.querySelector(`[data-cr="${s}"]`);g&&(g.textContent=o(f)),k&&(k.textContent=o(N(d.amount+f)))}function B(){let s=0,d=0;for(let q of l.lines)q.on&&(s=N(s+q.amount),d=N(d+N(q.amount*q.vat_rate/100)));let f=t.querySelector("#cn-t-sub");f&&(f.textContent=o(s));let g=t.querySelector("#cn-t-vat");g&&(g.textContent=o(d));let k=t.querySelector("#cn-t-tot");k&&(k.textContent=o(N(s+d)))}}async function Dt(t,n){if(!l)return;let e=l.lines.filter(c=>c.on);if(!l.reason.trim()){m("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49","err");return}if(!e.length){m("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","err");return}for(let c of e){if(!(c.amount>0)){m("\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01","err");return}if(c.amount>c.remaining){m('\u0E25\u0E14\u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E25\u0E14\u0E44\u0E14\u0E49\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 "'+c.description+'" (\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 '+o(c.remaining)+")","err");return}}let r={credit_note_id:l.cnId||null,invoice_id:l.invoiceId,credit_note_date:l.date||null,reason:l.reason.trim(),items:e.map(c=>({invoice_item_id:c.invoice_item_id,description:c.description,amount:N(c.amount)}))};n&&(n.disabled=!0);try{let c=await V("cn-save",()=>mt(r));if(c&&c.id){l.cnId=c.id;let v=t.querySelector("#cn-prev");v&&(v.disabled=!1);let b=t.querySelector("#cn-post");b&&(b.disabled=!1),m("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 "+o(c.total_amount),"ok")}}catch(c){m(T(c),"err")}finally{n&&(n.disabled=!1)}}export{Yt as render};
