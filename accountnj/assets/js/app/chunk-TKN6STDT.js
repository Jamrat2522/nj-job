import{m as RPC507}from"./chunk-SGWIBJH6.js";import{a as z}from"./chunk-UWAYW6DC.js";import{a as q}from"./chunk-EVZDPOX3.js";import{a as Nt}from"./chunk-IOOV4VJU.js";import{a as at,b as U,c as Z,e as At,f as Tt}from"./chunk-OPGKUGLK.js";import{a as R}from"./chunk-YM5GFE6V.js";import{a as lt}from"./chunk-OFOOXWUM.js";import{a as wt}from"./chunk-LNP7HEMP.js";import{a as Jt,d as $t,e as n}from"./chunk-NQOCXXA2.js";import{b as Gt,c as Ut,d as Kt,e as Et,f as Vt,h as Lt}from"./chunk-6NADHKLT.js";var F={issuerName:"N.J.LOGISTICS & FRUITS CO.,LTD.",issuerAddr:"62/165 MOO 10 T.THUNGSUKLA, A.SRIRACHA, CHONBURI 20230",issuerTel:"033 000870",textIdNo:"010-554-201-6277",issuedUnder:"Head Office",billToName:"APL Logistics Svcs (Thailand), Ltd.",billToAddr:`3195/8 Vibulthani Tower 1 , 3rd floor, Rama IV Road, Klongton,
Klongtoey, Bangkok 10110 Thailand.`,issuerNameMae:"N.J. LOGISTICS & FRUITS CO.,LTD"};var le=[{k:"general",t:"\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B"},{k:"maersk",t:"MAERSK"},{k:"apl",t:"APL"}],ae=["NJL","NJ","GY","W"],oe=[{k:"",t:"\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"},{k:"ADVANCE",t:"ADVANCE"},{k:"SERVICE",t:"SERVICE"}],Xt={NJACC_BILLING_PREFIX_REQUIRED:"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 Billing Note no.",NJACC_BILLING_DATE_REQUIRED:"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 Date \u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25",NJACC_BILLING_PREFIX_LOCKED:"\u0E43\u0E1A\u0E19\u0E35\u0E49 POST \u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",NJACC_BILLING_APL_DATE_REQUIRED:"\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 APL \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01 APL Date \u0E01\u0E48\u0E2D\u0E19 POST",NJACC_BILLING_POST_FAILED:"POST \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E04\u0E49\u0E32\u0E07",NJACC_BILLING_MIXED_COMPANY:"\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E35\u0E2B\u0E25\u0E32\u0E22\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E1B\u0E19\u0E01\u0E31\u0E19 \u2014 1 \u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E14\u0E35\u0E22\u0E27\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",NJACC_BILLING_CONTACT_REQUIRED:"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A",NJACC_BILLING_NO_JOB:"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_BILLING_JOB_NOT_FOUND:"\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E43\u0E2B\u0E21\u0E48",NJACC_BILLING_BAD_TEMPLATE:"\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",NJACC_BILLING_SAVE_FAILED:"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E49\u0E32\u0E07",NJACC_BILLING_NOT_FOUND:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49",NJACC_MODULE_DENIED:"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E42\u0E21\u0E14\u0E39\u0E25 ACCOUNTING",NJACC_DENIED:"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49"},ot=s=>{let p=String(s&&s.message||""),c=Object.keys(Xt).find(a=>p.includes(a));return c?new Error(Xt[c]):s},ie=100,K=s=>{let p=String(s||"").slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(p)?p.slice(8,10)+"/"+p.slice(5,7)+"/"+p.slice(0,4):""},M=s=>s==null||s===""?"":Jt(Number(s)||0),ce=(s,p)=>s.reduce((c,a)=>c+(Number(a[p])||0),0),E=s=>s==null?"":String(s),J=30,JA=14;var inv490=(a,b)=>{let x=E(a&&a.invoice_no).trim(),y=E(b&&b.invoice_no).trim();return x&&!y?-1:!x&&y?1:x.localeCompare(y,"en",{numeric:!0,sensitivity:"base"})||E(a&&a.job_no).localeCompare(E(b&&b.job_no),"en",{numeric:!0})||E(a&&a.id).localeCompare(E(b&&b.id))},cust490=s=>[...new Set(s.map(b=>E(b.customer_name).replace(/\s+/g," ").trim()).filter(Boolean))].join("  /  ");var NJ481_SFX=[/(^|[\s,.(])COMPANY\s*\(\s*THAILAND\s*\)\s*LIMITED\.?\s*$/i,/(^|[\s,.])CO\s*[.,]?\s*[.,]?\s*LTD\.?\s*$/i,/(^|[\s,.])LIMITED\.?\s*$/i,/(^|[\s,.])LTD\.?\s*$/i],nj481Short=s=>{let t=E(s).replace(/\s+/g," ").trim();if(!t)return t;for(let re of NJ481_SFX){let m=re.exec(t);if(m){let r=t.slice(0,m.index+m[1].length).replace(/[\s,]+$/,"").trim();return r||t}}return t},nj481N=v=>v==null||v===""||isNaN(Number(v))?null:Number(v),nj481R=v=>Math.round((v+Number.EPSILON)*100)/100,nj481Amt=w=>{let a=nj481N(w.subtotal);if(a==null)a=nj481N(w.amount);if(a!=null)return a;let sv=Number(w.service_amount)||0,ad=Number(w.advance_amount)||0,vt=nj481N(w.vat_amount);if(vt==null)vt=nj481R(sv*.07);return nj481R(sv+ad+vt)},nj481Tot=w=>{let t=nj481N(w.net_payable);if(t==null)t=nj481N(w.total_amount);if(t!=null)return t;let wh=nj481N(w.wht_amount);if(wh==null)wh=nj481R((Number(w.service_amount)||0)*.03);return nj481R(nj481Amt(w)-wh)},nj481Val=(w,k)=>k==="subtotal"?nj481Amt(w):k==="net_payable"?nj481Tot(w):Number(w[k])||0,nj481Fname=(rows,no)=>{let mp=new Map;(rows||[]).forEach(r=>{let c=nj481Short(r&&r.company_invoice);c&&!mp.has(c.toUpperCase())&&mp.set(c.toUpperCase(),c)});let co=[...mp.values()].sort((a,b)=>a.localeCompare(b)).join(" + ")||"BILLING",nn=E(no).trim()||"DRAFT";return(co+" "+nn).replace(/[\\/:*?"<>|\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().replace(/[. ]+$/,"").slice(0,150)};function it(s,p,m=J){let c=[],a=0;if(Array.isArray(p)&&p.length)for(let u of p){if(a>=s.length)break;let _=Math.max(1,Math.min(m,Number(u)||0));c.push({rows:s.slice(a,a+_),start:a}),a+=_}for(;a<s.length;a+=m)c.push({rows:s.slice(a,a+m),start:a});return c.length?c:[{rows:[],start:0}]}var pe=12;function Zt(s,p=pe){let c=E(s).split(/\s+/).filter(Boolean),a=[],u="";for(let _ of c){let v=Array.from(_);if(v.length>p){u&&(a.push(u),u="");let b=[];for(let y of v){if(b.length>=p&&!/\p{M}/u.test(y))a.push(b.join("")),b=[];else if(b.length>=p){let L=b.length;for(;L>0&&/\p{M}/u.test(b[L-1]);)L--;L>0&&L--,L>0&&(a.push(b.slice(0,L).join("")),b=b.slice(L))}b.push(y)}b.length&&a.push(b.join(""));continue}if(!u){u=_;continue}Array.from(u).length+1+v.length<=p?u+=" "+_:(a.push(u),u=_)}return u&&a.push(u),a}function Ct(s,p,c){let a=[...new Set(s.map(b=>E(b.company_invoice)).filter(Boolean))].join("  /  "),u=it(s,c),_=u.length,v="Tel. "+z.tel+"  |  Fax. "+z.fax+"  |  Tax ID "+z.taxId;return u.map((b,y)=>{let L=b.start,w=y===_-1,S=b.rows.map((f,g)=>`<tr>
    <td class="c">${L+g+1}</td>
    <td class="c">${n(E(f.invoice_no))}</td>
    <td class="c">${n(E(f.master_bl_no))}</td>
    <td>${n(E(f.house_bl_no))}</td>
    <td class="c">${n(E(f.data_type))}</td>
    <td>${n(E(f.customer_name))}</td>
    <td class="c">${n(E(f.customs_declaration_no))}</td>
    <td class="c">${n(E(f.customer_job_no))}</td>
    <td class="r">${M(f.gross_total)}</td>
    <td class="r">${M(f.net_payable)}</td></tr>`).join("");return`<div class="bpd bpd-gen print-area" data-page="${y+1}">
    <div class="bpd-gen-top">
      <div class="bpd-gen-co">
        <img class="bpd-gen-logo" src="${n(z.logo)}" alt="N.J. Logistics">
        <div class="bpd-gen-coi">
          <div class="bpd-gen-conm">${n(z.nameEn)}</div>
          <div class="bpd-gen-coln">${n(z.address)}</div>
          <div class="bpd-gen-coln">${n(v)}</div>
        </div>
      </div>
      <div class="bpd-gen-pd">
        <div class="bpd-gen-r">Page ${y+1} / ${_}</div>
        <div class="bpd-gen-r bpd-gen-date">Date: ${n(p.today)}</div>
      </div>
    </div>
    <div class="bpd-gen-c">\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</div>
    <table class="bpd-tb bpd-tb-gen"><colgroup>
      <col style="width:5%"><col style="width:10.5%"><col style="width:9.5%">
      <col style="width:13%"><col style="width:6%"><col style="width:21%">
      <col style="width:10%"><col style="width:8.5%"><col style="width:7.5%">
      <col style="width:9%"></colgroup>
    <thead><tr>
      <th>\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th><th>Master</th><th>House</th>
      <th>Type</th><th>Exporter</th><th>dcl inv.</th>
      <th>cust. Po no</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E22\u0E2D\u0E14\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E38\u0E17\u0E18\u0E34</th>
    </tr></thead><tbody>${S}</tbody></table>
    ${w?`<div class="bpd-gen-ft">
      <div class="bpd-gen-l">
        <div>\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D : ${n(p.contact)} Tel: ${n(p.tel)}</div>
        <div>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 : ${n(p.dept)}</div>
      </div>
      <div class="bpd-gen-sg">
        <div class="bpd-gen-cust">${n(a)}</div>
        <div class="bpd-gen-sign">
          <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48................................................</div>
          <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A......................................</div>
        </div>
      </div>
    </div>`:""}</div>`}).join("")}function Yt(s,p,c){let u=it(s,c),_=u.length,jo=E(p&&p.jobOwner).trim();return u.map((pg,y)=>{let w=y===_-1,R=pg.rows.map(a=>`<tr>
    <td>${n(CI519(a.company_invoice,E))}</td>
    <td class="c"></td>
    <td class="c">${n(E(a.booking_no))}</td>
    <td class="c">${n(E(a.invoice_no))}</td>
    <td class="c">${K(a.invoice_date)}</td>
    <td class="c">${n(p.submitDate)}</td>
    <td class="c">${n(jo)}</td></tr>`).join("");return`<div class="bpd bpd-mae print-area" data-page="${y+1}">
    <div class="bpd-mae-hd">
      <div class="bpd-mae-t">BILLING INSTRUCTION</div>
      <div class="bpd-mae-back">\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A</div>
    </div>${_>1?`<div class="bpd-mae-pg">Page ${y+1} / ${_}</div>`:""}
    <table class="bpd-tb bpd-tb-mae"><colgroup>
      <col style="width:32%"><col style="width:11%"><col style="width:13.5%">
      <col style="width:10%"><col style="width:9%"><col style="width:12%">
      <col style="width:12%"></colgroup>
      <thead>
        <tr class="bpd-mae-vd">
          <th class="bpd-y">Vendor Name</th>
          <td class="c t-b" colspan="4">${n(F.issuerNameMae)}</td>
          <th class="bpd-y bpd-mae-sub">Date of Submit<br>Original Document</th>
          <td class="c t-b">${n(p.submitDate)}</td>
        </tr>
        <tr>
          <th class="bpd-y">Customer Name</th><th class="bpd-y">Kewill No.</th>
          <th class="bpd-y">Booking No./BL No.</th><th class="bpd-y">Invoice No</th>
          <th class="bpd-y">Invoice Date</th><th class="bpd-y">Scan Date</th>
          <th class="bpd-y">Job Owner Code</th>
        </tr></thead>
      <tbody>${R}</tbody></table>
    ${w?`<div class="bpd-mae-ft">
      <div class="bpd-mae-co">Maersk Logistics &amp; Services (Thailand) Co., Ltd.</div>
      <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48............................................</div>
      <div>\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A................................</div>
    </div>`:""}</div>`}).join("")}function te(s,p,c){let a=it(s,c,JA),u=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"].map(_=>`<td class="r t-b">${M(nj481R(s.reduce((c0,a0)=>c0+nj481Val(a0,_),0)))}</td>`).join(""),cw=CW516(s);return a.map((_,v)=>{let b=_.start,y=v===a.length-1,L=_.rows.map((w,S)=>`<tr>
    <td class="c">${DT516(w)}</td>
    <td class="c">${b+S+1}</td>
    <td class="c">${n(E(w.invoice_no))}</td>
    <td class="c">${n(E(w.master_bl_no??w.master))}</td>
    <td class="c">${n(E(w.house_bl_no))}</td>
    <td class="c">${n(E(w.data_type))}</td>
    <td class="c bpd-ci">${n(CI519(w.company_invoice,nj481Short))}</td>
    <td class="c">${n(E(w.customs_declaration_no))}</td>
    <td class="c">${n(E(w.customer_job_no))}</td>
    <td class="r">${M(w.service_amount)}</td>
    <td class="r">${M(w.advance_amount)}</td>
    <td class="r">${M(w.vat_amount)}</td>
    <td class="r">${M(nj481Amt(w))}</td>
    <td class="r">${M(w.wht_amount)}</td>
    <td class="r">${M(nj481Tot(w))}</td></tr>`).join("");return`<div class="bpd bpd-apl bpd-516 print-area" data-page="${v+1}">
    <div class="bpd-apl-top">
      <img class="bpd-apl-logo" src="${n(z.logo)}" alt="N.J. Logistics">
      <div class="bpd-apl-note">
        <div>Billing Note no. ${n(p.noteNo)}</div>
        <div>Create date. ${n(p.aplDate)}</div>
      </div>
    </div>
    <div class="bpd-apl-hd">
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${n(F.issuerName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${n(F.issuerAddr)}</span></div>
      <div class="bpd-kv"><span>Tel.</span><span class="t-b">${n(F.issuerTel)}</span></div>
      <div class="bpd-apl-bt">Bill To.</div>
      <div class="bpd-kv"><span>Text ID no.</span><span class="t-b">${n(F.textIdNo)}</span></div>
      <div class="bpd-kv"><span>Tax invoice issued under :</span><span class="t-b">${n(F.issuedUnder)}</span></div>
      <div class="bpd-kv"><span>Name :</span><span class="t-b">${n(F.billToName)}</span></div>
      <div class="bpd-kv"><span>Address :</span><span class="t-b">${n(F.billToAddr).replace(/\n/g,"<br>")}</span></div>
    </div>
    <table class="bpd-tb bpd-tb-apl"><colgroup>${cw.map(x=>`<col style="width:${x}%">`).join("")}</colgroup>
    <thead><tr>
      <th class="bpd-y">Date</th><th class="bpd-y">Item</th><th class="bpd-y">Invoice No.</th>
      <th class="bpd-y">Master</th><th class="bpd-y">House B/L No.</th>
      <th class="bpd-y">Data Type</th><th class="bpd-y">Company Invoice</th>
      <th class="bpd-y">DCL INV.</th><th class="bpd-y">Customer Job No.</th>
      <th class="bpd-y">Service charge</th><th class="bpd-y">Advance</th>
      <th class="bpd-y">VAT 7%</th><th class="bpd-y">Amount</th>
      <th class="bpd-y">WHT 3%</th><th class="bpd-y">Total Amount</th>
    </tr></thead><tbody>${L}${y?`
      <tr class="bpd-apl-tot"><td colspan="9" class="r t-b">TOTAL</td>${u}</tr>`:""}</tbody></table>
    ${y?`<div class="bpd-apl-ft">
      <div class="bpd-sbox bpd-sbox-l">
        <div class="sl516"><b>VENDOR ID :</b><span class="vl">${n(p.vendorId)}</span></div>
        <div class="sl516"><b>PO. :</b><span class="ln">${n(p.po)}</span></div>
        <div class="sl516"><b>A/C :</b><span class="ln">${n(p.ac)}</span><b>C/C</b><span class="ln">${n(p.cc)}</span></div>
        <div class="sl516"><b>APPROVED BY :</b><span class="ln"></span><b>DATE</b><span class="ln ln-d">/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/</span></div>
      </div>
      <div class="bpd-sbox">
        <div class="sl516"><b>Receive By</b><span class="ln"></span></div>
        <div class="sl516"><b>Date</b><span class="ln"></span></div>
        <div class="sl516"><b>Authorized Signature</b></div>
      </div>
      <div class="bpd-sbox">
        <div class="sl516"><b>Receive By</b><span class="ln"></span></div>
        <div class="sl516"><b>Date</b><span class="ln"></span></div>
        <div class="sl516"><b>Authorized Signature</b></div>
      </div>
    </div>`:""}</div>`}).join("")}var re={general:Ct,maersk:Yt};function be(s){let p=s.getBoundingClientRect(),c=parseFloat(getComputedStyle(s).paddingBottom)||0,a=p.top;return s.querySelectorAll("table, .bpd-gen-ft, .bpd-apl-ft, .bpd-mae-ft").forEach(u=>{a=Math.max(a,u.getBoundingClientRect().bottom)}),a-(p.bottom-c)}function ee(s,p,m=J){let c=it(new Array(p).fill(0),null,m).map(_=>_.rows.length),a=s(null);if(typeof document>"u"||!document.body||!p)return a;let u=document.createElement("div");u.setAttribute("aria-hidden","true"),u.style.cssText="position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none",document.body.appendChild(u);try{for(let _=0;_<p*m;_++){u.innerHTML=a;let b=[...u.children].findIndex((y,L)=>c[L]>1&&be(y)>.5);if(b<0)break;c[b]-=1,b+1<c.length?c[b+1]+=1:c.push(1);for(let y=b+1;y<c.length;y++){if(c[y]<=m)continue;let L=c[y]-m;c[y]=m,y+1<c.length?c[y+1]+=L:c.push(L)}a=s(c.slice())}}finally{u.parentNode&&u.parentNode.removeChild(u)}return a}var Wt="nj-print-doc",St="nj-bpd-page";function ue(){if(document.getElementById(St))return;let s=document.createElement("style");s.id=St,s.textContent="@page{size:A4 landscape;margin:0}",document.head.appendChild(s)}function he(){let s=document.getElementById(St);s&&s.parentNode&&s.parentNode.removeChild(s)}function fe(fn481){let s=document.body,t481=document.title;fn481&&(document.title=fn481),s.classList.add(Wt),ue();let p=()=>{s.classList.remove(Wt),he(),fn481&&(document.title=t481)};window.addEventListener("afterprint",p,{once:!0});try{let c=window.matchMedia("print"),a=u=>{u.matches||(p(),c.removeEventListener("change",a))};c.addEventListener("change",a)}catch{}window.print()}var ve=.5,me=1.5,Qt=.1;function ye(s,p){let c=s&&s.querySelector(".bpd-fit-in"),a=c&&c.firstElementChild;if(!a)return()=>{};let u="fit",_=1,v=null,b=()=>{c.style.transform="none",s.style.width="",s.style.height="";let f=a.offsetWidth,g=a.offsetHeight;if(!f||!g)return 1;let C=s.parentElement,G=s.clientWidth||(C?C.clientWidth:0)||f,j=(C?C.clientHeight:0)||g;return Math.min(G/f,j/g,1)},y=()=>{let f=u==="fit"?b():_,g=a.offsetWidth,C=c.offsetHeight||a.offsetHeight;c.style.transform="scale("+f+")",s.style.width=Math.round(g*f)+"px",s.style.height=Math.round(C*f)+"px",s.style.margin="0 auto",v&&(v.textContent=Math.round(f*100)+"%")};if(p){let f=p.querySelector(".mf-left")||p,g=document.createElement("div");g.className="bpd-zoom",g.innerHTML='<button type="button" class="btn btn-o btn-sm" data-z="out" aria-label="\u0E22\u0E48\u0E2D">\u2212</button><span class="bpd-zoom-v">100%</span><button type="button" class="btn btn-o btn-sm" data-z="in" aria-label="\u0E02\u0E22\u0E32\u0E22">+</button><button type="button" class="btn btn-o btn-sm" data-z="100">100%</button><button type="button" class="btn btn-o btn-sm" data-z="fit">Fit</button>',f.appendChild(g),v=g.querySelector(".bpd-zoom-v"),g.addEventListener("click",C=>{let G=C.target.closest("[data-z]");if(!G)return;let j=G.dataset.z;if(j==="fit")u="fit";else{let Y=u==="fit"?b():_;j==="100"?_=1:_=Math.min(me,Math.max(ve,Math.round((Y+(j==="in"?Qt:-Qt))*100)/100)),u="zoom"}y()})}y();let L=f=>typeof requestAnimationFrame=="function"?requestAnimationFrame(f):setTimeout(f,16);L(()=>L(y));let w=()=>{u==="fit"&&y()};window.addEventListener("resize",w),window.addEventListener("orientationchange",w);let S=null;try{S=new ResizeObserver(w),S.observe(s.parentElement||s)}catch{}return()=>{try{S&&S.disconnect()}catch{}window.removeEventListener("resize",w),window.removeEventListener("orientationchange",w)}}function se(s,p,fn481){let c=document.createElement("div");c.innerHTML='<div class="bpd-fit"><div class="bpd-fit-in">'+s+"</div></div>";let a=document.createElement("div");a.innerHTML=`<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="bpd-print">\u{1F5A8} Print / Download PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`,wt({title:p,body:c,footer:a,fullscreen:!0,wide:!0,cls:"bpd-pv519"}),a.querySelector("#bpd-print").onclick=()=>PR509(fn481);let u=c.querySelector(".bpd-fit"),_=ye(u,a),v=a.querySelector("[data-close]");v&&v.addEventListener("click",_,{once:!0}),PO509(c,a,fn481)}function ke(s,p,c={}){let a=le,u=K(new Date().toISOString().slice(0,10)),_=p==="apl"?"apl":"general",v=c.billingId||null,b=c.billingNo||"",y="DRAFT",L="",w=null,S=typeof c.onSaved=="function"?c.onSaved:null,f=[],g=new Map,C=!0,G="",j="",Y="",ct=!0,x=new Map,pt="",V=!1,I=null,rt=null,O=new Map,bt="",X=!1,D=null,ut=null,ht=()=>{if(!C||!Array.isArray(I))return[];let t=new Set(I.map(e=>e.id));return I.concat([...x.values()].filter(e=>!t.has(e.id)))},xt=50,kt=()=>Nt(ht(),pt),ft=()=>{if(!Array.isArray(D))return[];let t=new Set(D.map(e=>e.id));return D.concat([...O.values()].filter(e=>!t.has(e.id)))},It=()=>Nt(ft(),bt),H=document.createElement("div");H.innerHTML=`
    
    <div class="bpd-sec bpd-head">
      <div class="bpd-pfx" id="bpd-pfx-box">
        <span class="bpd-pfx-lb">\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 Billing Note no. <span class="req">*</span></span>
        ${ae.map(t=>`<label class="bpd-radio">
          <input type="radio" name="bpd-pfx" value="${t}"><span>${t}</span></label>`).join("")}
      </div>
      <div class="bpd-head-no">
        <label for="bpd-note">Billing Note no.</label>
        <input class="inp" id="bpd-note" autocomplete="off" readonly
          placeholder="\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E40\u0E21\u0E37\u0E48\u0E2D POST">
      </div>
      <div class="bpd-head-dt">
        
        <label for="bpd-bdate">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label>
        <input class="inp" type="date" id="bpd-bdate">
      </div>
      
    </div>

    <div class="bpd-sec">
      
      ${C?`<div class="bpd-cust" id="bpd-cust">
        <label class="bpd-dt">Date \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48 <input class="inp" type="date" id="bpd-from"></label>
        <label class="bpd-dt">\u0E16\u0E36\u0E07 <input class="inp" type="date" id="bpd-to"></label>
        <label class="bpd-dt" for="bpd-ctype">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19</label>
        <select class="sel" id="bpd-ctype">
          ${oe.map(t=>`<option value="${n(t.k)}">${n(t.t)}</option>`).join("")}
        </select>
        <label class="bpd-cust-lb" for="bpd-cq">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
        <div class="bpd-cust-box">
          <input class="inp" id="bpd-cq" autocomplete="off" role="combobox"
            aria-expanded="false" aria-controls="bpd-cust-pop"
            placeholder="\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32 CODE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
          <button type="button" class="bpd-cust-caret" id="bpd-cust-toggle"
            aria-label="\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">\u25BC</button>
          <div class="bpd-cust-pop" id="bpd-cust-pop" hidden></div>
        </div>
        <span class="bpd-cust-cnt" id="bpd-cust-cnt"></span>
        
        <label class="bpd-cust-lb" for="bpd-cq2">\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label>
        <div class="bpd-cust-box">
          <input class="inp" id="bpd-cq2" autocomplete="off" role="combobox"
            aria-expanded="false" aria-controls="bpd-comp-pop"
            placeholder="\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32 / \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17">
          <button type="button" class="bpd-cust-caret" id="bpd-comp-toggle"
            aria-label="\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17">\u25BC</button>
          <div class="bpd-cust-pop" id="bpd-comp-pop" hidden></div>
        </div>
        <span class="bpd-cust-cnt" id="bpd-comp-cnt"></span>
        <label class="bpd-cust-lb" for="bpd-uq">USER</label><div class="bpd-cust-box"><input class="inp" id="bpd-uq" list="bpd-ul" autocomplete="off" placeholder="\u{1F50E} \u0E04\u0E49\u0E19\u0E2B\u0E32 / \u0E40\u0E25\u0E37\u0E2D\u0E01 USER" title="\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D / \u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19 USER \u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 \u00B7 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E17\u0E38\u0E01 USER"><datalist id="bpd-ul"></datalist></div>
        
        
        
        <label class="bpd-cust-lb" for="bpd-jobq">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</label><input class="inp bpd-jobq" id="bpd-jobq" autocomplete="off" placeholder="\u{1F50E} \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19" title="\u0E40\u0E25\u0E02\u0E40\u0E15\u0E47\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19 \u0E40\u0E0A\u0E48\u0E19 JOB2610-00274 / 00274 / 2610 \u00B7 \u0E01\u0E14 Enter \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32">
        <button class="btn btn-p btn-sm" id="bpd-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        <button class="btn btn-o btn-sm" id="bpd-reset">\u21BA \u0E25\u0E49\u0E32\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
      </div>`:""}
      <div class="bpd-bar">
        <label class="bpd-radio"><input type="checkbox" id="bpd-all">
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</span></label>
        <button class="btn btn-o btn-sm" id="bpd-clear">\u0E25\u0E49\u0E32\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
        <span class="bpd-cnt" id="bpd-cnt">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 0 \u0E07\u0E32\u0E19</span>
      </div>
      
      <div class="tbl-wrap bpd-list"><table class="tbl">
        <thead><tr>
          <th style="width:34px"></th>
          <th style="width:150px">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th>
          <th style="width:92px">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19</th>
          <th class="ellip">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
          
          <th class="ellip">\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th>
          <th style="width:130px">Invoice</th>
          <th style="width:140px">House B/L</th>
          <th style="width:150px">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
          <th style="width:100px">\u0E42\u0E2B\u0E21\u0E14</th>
          <th style="width:92px" class="center">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th>
          <th style="width:120px">USER</th>
        </tr></thead>
        <tbody id="bpd-tb">
        <tr><td colspan="11" class="center t-3">\u0E01\u0E14 \u201C\u0E04\u0E49\u0E19\u0E2B\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>
      </tbody></table></div>
    </div>

    <div class="bpd-sec">
      <div class="bpd-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C</div>
      <div class="fgrid">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D <span class="req">*</span></label>
          <input class="inp" id="bpd-contact" autocomplete="off"></div>
        <div class="fld"><label>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 <span class="req">*</span></label>
          <input class="inp" id="bpd-tel" autocomplete="off"></div>
        <div class="fld"><label>\u0E41\u0E1C\u0E19\u0E01 / \u0E0A\u0E31\u0E49\u0E19 <span class="req">*</span></label>
          <input class="inp" id="bpd-dept" autocomplete="off"></div>
        
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</label>
          <input class="inp" type="date" id="bpd-submit"></div>
      </div>
    </div>

    
    <div class="bpd-sec" id="bpd-apl-sec" hidden>
      <div class="bpd-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 APL)</div>
      <div class="fgrid">
        <div class="fld"><label>APL Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 APL <span class="req">*</span></label>
          <input class="inp" type="date" id="bpd-date"></div>
        <div class="fld"><label>VENDOR ID</label><input class="inp" id="bpd-vendor" autocomplete="off"></div>
        <div class="fld"><label>PO</label><input class="inp" id="bpd-po" autocomplete="off"></div>
        <div class="fld"><label>A/C</label><input class="inp" id="bpd-ac" autocomplete="off"></div>
        <div class="fld"><label>C/C</label><input class="inp" id="bpd-cc" autocomplete="off"></div>
      </div>
    </div>
    <div class="bpd-sec" id="bpd-mae-sec" hidden>
      <div class="bpd-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 MAERSK)</div>
      <div class="fgrid">
        <div class="fld"><label for="bpd-jobowner">JOB OWNER CODE</label>
          <input class="inp" id="bpd-jobowner" autocomplete="off" maxlength="60" placeholder="\u0E01\u0E23\u0E2D\u0E01 Job Owner Code"></div>
      </div>
    </div>
    <div class="bpd-msg" id="bpd-msg" hidden></div>`;let k=document.createElement("div");k.className="bpd-foot",k.innerHTML=`<div class="mf-left">
      <label class="bpd-fx-lb" for="bpd-tpl">\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</label>
      <select class="sel" id="bpd-tpl">
        ${a.map(t=>`<option value="${n(t.k)}"${t.k===_?" selected":""}>${n(t.t)}</option>`).join("")}
      </select>
      <span class="bpd-no" id="bpd-no" hidden></span></div>
    <div class="mf-right">
      <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-s" id="bpd-save">\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
      <button class="btn btn-w" id="bpd-post" disabled>\u2B06 POST</button>
      <button class="btn btn-o" id="bpd-xls">\u{1F4D7} EXPORT EXCEL</button>
      <button class="btn btn-o" id="bpd-report" disabled>\u{1F4CA} REPORT</button>
      <button class="btn btn-p" id="bpd-prev">\u{1F441} Preview PDF</button></div>`,wt({title:"Billing PDF",body:H,footer:k,large:!0,cls:"bpd-modal"});BF571(k);let i=t=>H.querySelector(t),Dt=i("#bpd-msg"),tt=i("#bpd-tb"),ne=i("#bpd-cnt"),A=t=>{Dt.hidden=!t,Dt.textContent=t||""},Ot=()=>i("#bpd-ctype").value,vt=()=>Ot()||s.charge,mt=()=>Ot()?"own":"all",yt=k.querySelector("#bpd-tpl"),gt=()=>yt.value,W=()=>gt()==="apl",_t=()=>{i("#bpd-apl-sec").hidden=!W();let m4=i("#bpd-mae-sec");m4&&(m4.hidden=gt()!=="maersk")};yt.onchange=()=>{_t(),A(""),SY510(H,gt()),PV510(H,gt())},_t(),PW510(H,gt),GF508(H),UL514(H,()=>({charge_type:vt(),company_group:s.group,queue:s.queue,scope:"all"})),UB514(H,B);let Pt=()=>{ne.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+g.size+" \u0E07\u0E32\u0E19";let t=f.map(e=>e.id);i("#bpd-all").checked=t.length>0&&t.every(e=>g.has(e))},et=()=>{f.sort(inv490),tt.innerHTML=f.length?f.map(t=>`<tr>
          <td style="width:34px" class="center">
            <input type="checkbox" data-bid="${n(t.id)}"${g.has(t.id)?" checked":""}></td>
          <td class="t-b" style="width:150px">${n(E(t.job_no)||"-")}</td>
          <td style="width:92px">${n(E(t.charge_type)||"-")}</td>
          <td class="ellip">${n(E(t.customer_name)||"-")}</td>
          <td class="ellip" title="${n(E(t.company_invoice)||"")}">${n(E(t.company_invoice)||"-")}</td>
          <td style="width:130px">${n(E(t.invoice_no)||"-")}</td>
          <td style="width:140px">${n(E(t.house_bl_no)||"-")}</td>
          <td class="ellip" style="width:150px">${n(E(t.job_category)||"-")}</td>
          <td style="width:100px">${n(E(t.data_type)||"-")}</td>
          <td style="width:92px" class="center">${K(t.date)||"-"}</td>
          <td style="width:120px" class="ellip" title="${n(t.created_by_name||"")}">${n(UN514(t.created_by_name)||"-")}</td>
        </tr>`).join(""):'<tr><td colspan="11" class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</td></tr>',Pt()},Bt=()=>({q:null,from:i("#bpd-from").value||null,to:i("#bpd-to").value||null,job_category:null,data_type:null});async function Rt(){if(!C)return;let t=Bt(),e=JSON.stringify(t);if(e===rt&&I!==!1)return;rt=e;let d=at("bpd-cust-opts");Array.isArray(I)||(I=null,st());try{let o=await Ut({charge:vt(),group:s.group,filters:t,withKpi:!1,queue:s.queue,scope:mt()});if(!U("bpd-cust-opts",d))return;let r=o&&Array.isArray(o.customers)?o.customers:[],m=new Map;r.forEach(l=>{l&&l.id&&!m.has(l.id)&&m.set(l.id,{id:l.id,code:l.code||"",name:l.name||"",jobs:Number(l.jobs)||0})}),I=[...m.values()]}catch(o){if(!U("bpd-cust-opts",d))return;I=!1,rt=null,R(o,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}st()}let st=()=>{},nt=()=>{};async function qt(){let t=Bt();t.customer_ids=[...x.keys()];let e=JSON.stringify(t);if(e===ut&&Array.isArray(D))return;ut=e;let d=at("bpd-comp-opts");Array.isArray(D)||(D=null,nt());try{let o=await Kt({charge:vt(),group:s.group,filters:t,withKpi:!1,queue:s.queue,scope:mt()});if(!U("bpd-comp-opts",d))return;let r=o&&Array.isArray(o.companies)?o.companies:[],m=new Map;r.forEach(l=>{l&&l.id&&!m.has(l.id)&&m.set(l.id,{id:l.id,code:l.code||"",name:l.name||"",jobs:Number(l.jobs)||0})}),D=[...m.values()]}catch(o){if(!U("bpd-comp-opts",d))return;D=!1,ut=null,R(o,"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}nt()}async function B(){let t=at("bpd");Rt(),qt(),tt.innerHTML='<tr><td class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32...</td></tr>';try{let e=await JQ508(Gt,i("#bpd-jobq"),{charge:vt(),group:s.group,filters:{q:null,from:i("#bpd-from").value||null,to:i("#bpd-to").value||null,job_category:null,data_type:null,customer_ids:[...x.keys()],company_ids:[...O.keys()],...US514(H)?{created_by:US514(H)}:{}},page:1,size:ie,withKpi:!1,queue:s.queue,scope:mt()});if(!U("bpd",t))return;f=e&&e.rows||[],et();let d=Number(e&&e.total||0);A(d>f.length?"\u0E1E\u0E1A "+d+" \u0E07\u0E32\u0E19 \u2014 \u0E41\u0E2A\u0E14\u0E07 "+f.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D":"")}catch(e){if(!U("bpd",t))return;tt.innerHTML='<tr><td class="center t-3">\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',R(e,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}if(C){let t=i("#bpd-cq"),e=i("#bpd-cust-pop"),d=i("#bpd-cust-cnt"),o=()=>{let l=x.size;if(d.textContent=l?"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+l+" \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32":"",!V)return;if(I===null||I===!1){e.innerHTML='<div class="bpd-cust-empty">'+(I===null?"\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19...":"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E01\u0E14 \u201C\u0E04\u0E49\u0E19\u0E2B\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")+"</div>";return}let $=kt(),T=$.slice(0,xt),N=$.length>0&&$.every(h=>x.has(h.id));e.innerHTML=`<label class="bpd-cust-row bpd-cust-head">
          <input type="checkbox" id="bpd-cust-all"${N?" checked":""}>
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14${$.length?" ("+$.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":""}</span></label>`+($.length>T.length?`<div class="bpd-cust-more">\u0E41\u0E2A\u0E14\u0E07 ${T.length} \u0E08\u0E32\u0E01 ${$.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u201C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u201D \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E31\u0E49\u0E07 ${$.length} \u0E23\u0E32\u0E22</div>`:"")+(T.length?T.map(h=>`<label class="bpd-cust-row">
              <input type="checkbox" data-cid="${n(h.id)}"${x.has(h.id)?" checked":""}>
              <span class="bpd-cust-code">${n(h.code||"-")}</span>
              <span class="bpd-cust-nm" title="${n(h.name||"")}">${n(h.name||"-")}</span>
            </label>`).join(""):'<div class="bpd-cust-empty">'+(ht().length?"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19":"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E19\u0E35\u0E49")+"</div>")};st=o;let r=()=>{V=!0,e.hidden=!1,t.setAttribute("aria-expanded","true"),o()},m=()=>{V=!1,e.hidden=!0,t.setAttribute("aria-expanded","false")};t.addEventListener("focus",r),t.addEventListener("input",()=>{pt=t.value,r()}),t.addEventListener("keydown",l=>{l.key==="Escape"&&(l.preventDefault(),m()),l.key==="Enter"&&l.preventDefault()}),i("#bpd-cust-toggle").onclick=()=>{V?m():(t.focus(),r())},e.addEventListener("change",l=>{let $=l.target.closest("#bpd-cust-all");if($){kt().forEach(h=>{$.checked?x.set(h.id,h):x.delete(h.id)}),o(),Z("bpd-cust",B,250);return}let T=l.target.closest("[data-cid]");if(!T)return;let N=ht().find(h=>h.id===T.dataset.cid);N&&(T.checked?x.set(N.id,N):x.delete(N.id),o(),Z("bpd-cust",B,250))}),e.addEventListener("mousedown",l=>l.preventDefault()),H.addEventListener("click",l=>{V&&(l.target.closest("#bpd-cust")||m())}),o(),Rt()}{let t=i("#bpd-cq2"),e=i("#bpd-comp-pop"),d=i("#bpd-comp-cnt"),o=()=>{let l=O.size;if(d.textContent=l?"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 "+l+" \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17":"",!X)return;if(D===null||D===!1){e.innerHTML='<div class="bpd-cust-empty">'+(D===null?"\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19...":"\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E01\u0E14 \u201C\u0E04\u0E49\u0E19\u0E2B\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")+"</div>";return}let $=It(),T=$.slice(0,xt),N=$.length>0&&$.every(h=>O.has(h.id));e.innerHTML=`<label class="bpd-cust-row bpd-cust-head">
          <input type="checkbox" id="bpd-comp-all"${N?" checked":""}>
          <span>\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14${$.length?" ("+$.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":""}</span></label>`+($.length>T.length?`<div class="bpd-cust-more">\u0E41\u0E2A\u0E14\u0E07 ${T.length} \u0E08\u0E32\u0E01 ${$.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u201C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u201D \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E31\u0E49\u0E07 ${$.length} \u0E23\u0E32\u0E22</div>`:"")+(T.length?T.map(h=>`<label class="bpd-cust-row">
              <input type="checkbox" data-coid="${n(h.id)}"${O.has(h.id)?" checked":""}>
              <span class="bpd-cust-code">${n(h.code||"-")}</span>
              <span class="bpd-cust-nm" title="${n(h.name||"")}">${n(h.name||"-")}</span>
            </label>`).join(""):'<div class="bpd-cust-empty">'+(ft().length?"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19":"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E19\u0E35\u0E49")+"</div>")};nt=o;let r=()=>{X=!0,e.hidden=!1,t.setAttribute("aria-expanded","true"),o()},m=()=>{X=!1,e.hidden=!0,t.setAttribute("aria-expanded","false")};t.addEventListener("focus",r),t.addEventListener("input",()=>{bt=t.value,r()}),t.addEventListener("keydown",l=>{l.key==="Escape"&&(l.preventDefault(),m()),l.key==="Enter"&&l.preventDefault()}),i("#bpd-comp-toggle").onclick=()=>{X?m():(t.focus(),r())},e.addEventListener("change",l=>{let $=l.target.closest("#bpd-comp-all");if($){It().forEach(h=>{$.checked?O.set(h.id,h):O.delete(h.id)}),o(),Z("bpd-comp",B,250);return}let T=l.target.closest("[data-coid]");if(!T)return;let N=ft().find(h=>h.id===T.dataset.coid);N&&(T.checked?O.set(N.id,N):O.delete(N.id),o(),Z("bpd-comp",B,250))}),e.addEventListener("mousedown",l=>l.preventDefault()),H.addEventListener("click",l=>{X&&(l.target.closest("#bpd-comp-pop")||l.target.closest("#bpd-cq2")||l.target.closest("#bpd-comp-toggle")||m())}),o(),qt()}i("#bpd-go").onclick=B,JK508(i("#bpd-jobq"),B),i("#bpd-from").onchange=B,i("#bpd-to").onchange=B,i("#bpd-bdate").onchange=t=>{ct=!t.target.value},i("#bpd-ctype").onchange=B;let Mt=i("#bpd-reset");Mt&&(Mt.onclick=()=>{i("#bpd-jobq")&&(i("#bpd-jobq").value=""),i("#bpd-from").value="",i("#bpd-to").value="",i("#bpd-ctype").value="",x.clear(),pt="";let t=i("#bpd-cq");t&&(t.value=""),O.clear(),bt="";let e=i("#bpd-cq2");e&&(e.value=""),UR514(H),st(),nt(),B()}),tt.addEventListener("change",t=>{let e=t.target.closest("[data-bid]");if(!e)return;let d=f.find(o=>o.id===e.dataset.bid);d&&(e.checked?g.set(d.id,d):g.delete(d.id),Pt())}),i("#bpd-all").onchange=t=>{f.forEach(e=>{t.target.checked?g.set(e.id,e):g.delete(e.id)}),et()},i("#bpd-clear").onclick=()=>{g.clear(),et()};let jt=()=>({contact:i("#bpd-contact").value.trim(),tel:i("#bpd-tel").value.trim(),dept:i("#bpd-dept").value.trim(),submit:i("#bpd-submit").value||"",tpl:gt(),pfx:(H.querySelector('input[name="bpd-pfx"]:checked')||{}).value||"",bdate:i("#bpd-bdate").value||"",cat:j,mode:Y,q:G,from:i("#bpd-from").value||"",to:i("#bpd-to").value||"",custIds:[...x.keys()],aplDate:i("#bpd-date").value||"",vendor:i("#bpd-vendor").value.trim(),po:i("#bpd-po").value.trim(),ac:i("#bpd-ac").value.trim(),cc:i("#bpd-cc").value.trim(),jobOwner:(i("#bpd-jobowner")||{value:""}).value.trim()}),Ht=t=>g.size?!t.contact||!t.tel||!t.dept?"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19":"":"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",zt=t=>{let e=i("#bpd-bdate");e&&(e.value=t||"")},P=()=>y==="POSTED"&&!!b,dt=()=>{setTimeout(()=>{SY510(H,gt()),PV510(H,gt())},0);let t=k.querySelector("#bpd-no");t.hidden=!v,t.textContent=v?P()?"POSTED \xB7 "+b:"DRAFT \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02":"",t.className="bpd-no"+(P()?" is-posted":" is-draft");let e=i("#bpd-note");e.value=b||"",e.readOnly=!0,e.title=b?"\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E41\u0E25\u0E49\u0E27\u0E15\u0E2D\u0E19 POST \u2014 \u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49":"\u0E01\u0E14 POST \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",H.querySelectorAll('input[name="bpd-pfx"]').forEach(r=>{r.disabled=P(),P()&&r.value===L&&(r.checked=!0)});let d=k.querySelector("#bpd-post");d&&(d.disabled=!v||P(),d.title=v?P()?"\u0E43\u0E1A\u0E19\u0E35\u0E49 POST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 "+b:"\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01 Billing Note no.":'\u0E01\u0E14 "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" \u0E01\u0E48\u0E2D\u0E19 \u0E08\u0E36\u0E07\u0E08\u0E30 POST \u0E44\u0E14\u0E49');let o=k.querySelector("#bpd-report");o&&(o.disabled=!v,o.title=v?"\u0E2D\u0E2D\u0E01 REPORT Excel \u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49":'\u0E01\u0E14 "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" \u0E01\u0E48\u0E2D\u0E19 \u0E08\u0E36\u0E07\u0E08\u0E30\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E14\u0E49')},Ft=t=>({id:v,prefix:P()?L:t.pfx,billing_date:t.bdate,template:t.tpl,charge_type:s.charge,company_group:s.group,q:t.q||null,date_from:t.from||null,date_to:t.to||null,customer_ids:t.custIds,job_category:t.cat||null,data_type:t.mode||null,contact_name:t.contact,contact_tel:t.tel,contact_dept:t.dept,submit_date:t.submit||null,apl_date:t.aplDate||null,apl_vendor_id:t.vendor||null,apl_po:t.po||null,apl_ac:t.ac||null,apl_cc:t.cc||null,job_owner_code:t.jobOwner||null,job_ids:[...g.values()].sort(inv490).map(x=>x.id),request_id:Tt()});k.querySelector("#bpd-save").onclick=async t=>{let e=jt(),d=Ht(e);if(d){A(d);return}if(!e.pfx){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 Billing Note no.");return}e.bdate||(e.bdate=$t(new Date),ct=!0,zt(e.bdate)),A("");let o=t.currentTarget;q(o,!0);try{let r=await At("bpd-save",()=>Et(Ft(e)));if(!r)return;v=r.id,b=r.billing_no||"",y=r.status||y,P()||(L=e.pfx),w=null,dt(),lt(P()?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E14\u0E34\u0E21 "+b:r.created?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 Draft \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E01\u0E14 POST \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02)":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19 Draft \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02"),S&&S()}catch(r){R(ot(r),"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 Billing \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{q(o,!1)}},k.querySelector("#bpd-post").onclick=async t=>{if(!v){A('\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E14 "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" \u0E01\u0E48\u0E2D\u0E19 \u0E08\u0E36\u0E07\u0E08\u0E30 POST \u0E44\u0E14\u0E49');return}if(P()){A("\u0E43\u0E1A\u0E19\u0E35\u0E49 POST \u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 "+b);return}let e=jt(),d=Ht(e);if(d){A(d);return}if(!e.pfx){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 Billing Note no.");return}if(W()&&!e.aplDate){A("\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 APL \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01 APL Date \u0E01\u0E48\u0E2D\u0E19 POST");return}A("");let o=t.currentTarget;q(o,!0);try{let r=$t(new Date);if(ct&&e.bdate!==r){e.bdate=r,zt(r);let l=await Et(Ft(e));l&&l.id&&(v=l.id)}let m=await At("bpd-post",()=>Vt({id:v,request_id:Tt()}));if(!m)return;b=m.billing_no||b,y=m.status||"POSTED",w=null,dt(),lt(m.already?"\u0E43\u0E1A\u0E19\u0E35\u0E49 POST \u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E14\u0E34\u0E21 "+b:"POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 Billing Note no. "+b),S&&S()}catch(r){R(ot(r),"POST \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{q(o,!1)}},k.querySelector("#bpd-xls").onclick=async t=>{let e=[...g.values()];if(!e.length){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}A("");let d=t.currentTarget;q(d,!0);try{let o=await import("./charge-export-KOVZOKTY.js"),r=await o.xlsx(),m=o.toAoA(e,o.COMPAT_COLS),l=r.utils.book_new();r.utils.book_append_sheet(l,r.utils.aoa_to_sheet(m),"BILLING"),r.writeFile(l,"BILLING "+(b||"DRAFT")+".xlsx"),lt("\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 "+e.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27","ok")}catch(o){R(ot(o),"EXPORT EXCEL \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{q(d,!1)}},k.querySelector("#bpd-report").onclick=async t=>{if(!v)return;let e=t.currentTarget;q(e,!0);try{let d=w||await Lt(v);d=Object.assign({},d,{jobs:[...(d&&d.jobs||[])].sort(inv490)});await(await import("./billing-report-GNOCNBGN.js")).exportBillingReport(d)}catch(d){R(ot(d),"\u0E2D\u0E2D\u0E01 REPORT \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{q(e,!1)}};async function de(t){try{let e=await Lt(t),d=e&&e.billing||null;if(!d)return;v=d.id,b=d.billing_no||"",y=d.status||(d.billing_no?"POSTED":"DRAFT"),L=d.prefix||"";let o=(m,l)=>{let $=i(m);$&&($.value=l||"")};d.template&&(yt.value=d.template,_t());let r=H.querySelector(`input[name="bpd-pfx"][value="${d.prefix}"]`);r&&(r.checked=!0),G=d.q||"",o("#bpd-from",d.date_from),o("#bpd-to",d.date_to),j=d.job_category||"",Y=d.data_type||"",o("#bpd-bdate",d.billing_date),o("#bpd-contact",d.contact_name),o("#bpd-tel",d.contact_tel),o("#bpd-dept",d.contact_dept),o("#bpd-submit",d.submit_date),o("#bpd-date",d.apl_date),o("#bpd-vendor",d.apl_vendor_id),o("#bpd-po",d.apl_po),o("#bpd-ac",d.apl_ac),o("#bpd-cc",d.apl_cc),o("#bpd-jobowner",d.mae_job_owner_code),g.clear(),(e&&e.jobs||[]).forEach(m=>g.set(m.id,m)),f=(e&&e.jobs||[]).slice(),w={billing:d,jobs:e&&e.jobs||[]},et(),dt(),A(g.size?"":"\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49")}catch(e){R(e,"\u0E40\u0E1B\u0E34\u0E14 Billing \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}v?de(v):dt(),k.querySelector("#bpd-prev").onclick=()=>{if(!g.size){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return}let t=i("#bpd-contact").value.trim(),e=i("#bpd-tel").value.trim(),d=i("#bpd-dept").value.trim();if(!t||!e||!d){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01/\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}let o=i("#bpd-submit").value,r={contact:t,tel:e,dept:d,today:u,submitDate:o?K(o):u};if(W()){let h=b||"",Q=i("#bpd-date").value;if(!Q){A("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 APL Date \u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C");return}r.noteNo=h,h||A("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 POST \u0E08\u0E36\u0E07\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02 Billing Note no. \u2014 \u0E01\u0E14 POST \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49"),r.aplDate=K(Q),r.vendorId=i("#bpd-vendor").value.trim(),r.po=i("#bpd-po").value.trim(),r.ac=i("#bpd-ac").value.trim(),r.cc=i("#bpd-cc").value.trim()}A("");let l0=gt();l0==="maersk"&&(r.jobOwner=(i("#bpd-jobowner")||{value:""}).value.trim());let m=[...g.values()].sort(inv490).sort(CJ519),l=l0,$=h=>W()?te(m,r,h):(re[l]||Ct)(m,r,h),T=ee($,m.length,W()?JA:J),N="BILLING "+((a.find(h=>h.k===l)||{}).t||"");se(T,N+"  ("+m.length+" \u0E07\u0E32\u0E19)",BN509(b))}}var Ie={nj481Short,nj481Fname,nj481Amt,nj481Tot,tplGeneral:Ct,tplMaersk:Yt,tplApl:te,chunkRows:it,wrapFixed:Zt,fitPaper:ee,BPD_ROWS_PER_PAGE:J,openPreview:se};/* \u2550\u2550\u2550 V.507 BILLING PDF : \u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21 APL \u0E41\u0E2A\u0E14\u0E07 "\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B" \u0E02\u0E2D\u0E07\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 APL (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 \u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E2D\u0E2D\u0E01\u0E15\u0E2D\u0E19 POST) \u2550\u2550\u2550 */
function PV507(H, tpl) {
  let no = H && H.querySelector("#bpd-note");
  if (!no) return;
  if (no.dataset.ph0 == null) no.dataset.ph0 = no.placeholder;
  let tk = (PV507.tk = (PV507.tk || 0) + 1);
  if (tpl !== "apl") { no.placeholder = no.dataset.ph0; no.removeAttribute("data-apl-next"); return; }
  let pf = (H.querySelector('input[name="bpd-pfx"]:checked') || {}).value || "", d = (H.querySelector("#bpd-bdate") || {}).value || "";
  if (!pf) { no.placeholder = "APL \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02 (NJL / NJ / GY / W) \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B"; no.removeAttribute("data-apl-next"); return; }
  no.placeholder = "APL \u2014 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E23\u0E27\u0E08\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B\u2026";
  RPC507("njacc_billing_apl_peek", { p: { prefix: pf, billing_date: d || null } }).then((r) => {
    if (tk !== PV507.tk) return;
    r && r.next_no ? (no.placeholder = `APL \u00B7 \u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B ${r.next_no} \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D POST`, no.setAttribute("data-apl-next", r.next_no)) : (no.placeholder = no.dataset.ph0, no.removeAttribute("data-apl-next"));
  }).catch(() => { tk === PV507.tk && (no.placeholder = no.dataset.ph0, no.removeAttribute("data-apl-next")); });
}
function PW507(H, gt) {
  H.addEventListener("change", (e) => { let t = e.target; t && (t.name === "bpd-pfx" || t.id === "bpd-bdate") && PV507(H, gt()); });
  setTimeout(() => PV507(H, gt()), 0);
}

/* \u2550\u2550\u2550 V.508 BILLING PDF (+ \u0E2A\u0E23\u0E49\u0E32\u0E07 BILLING) : \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u00B7 \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E01\u0E27\u0E49\u0E32\u0E07\u0E02\u0E36\u0E49\u0E19 10% \u00B7 \u0E40\u0E2A\u0E49\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E40\u0E15\u0E47\u0E21\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A Excel \u2550\u2550\u2550 */
var BQ508 = (v) => String(v == null ? "" : v).replace(/\s+/g, "").toUpperCase();
/* \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 : \u0E2A\u0E48\u0E07\u0E04\u0E33\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49 Server (q \u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A) \u0E17\u0E35\u0E25\u0E30\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E19\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E31\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48 "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19" \u0E15\u0E23\u0E07\u0E04\u0E33\u0E04\u0E49\u0E19
   \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E33\u0E04\u0E49\u0E19 = \u0E40\u0E23\u0E35\u0E22\u0E01\u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E23 (\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01 100 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23) */
async function JQ508(fn, el, args) {
  let term = BQ508(el && el.value);
  if (!term) return AP514(fn, args);
  let out = [], seen = new Set(), page = 1, total = 0;
  for (; page <= 300; page++) {
    let a = Object.assign({}, args, { page, filters: Object.assign({}, args.filters, { q: term }) });
    let r = await fn(a), rows = (r && r.rows) || [];
    total = Number((r && r.total) || 0);
    for (let x of rows) { if (!x || seen.has(x.id)) continue; seen.add(x.id); BQ508(x.job_no).includes(term) && out.push(x); }
    if (!rows.length || page * (args.size || 100) >= total) break;
  }
  return { rows: out, total: out.length };
}
function JK508(el, run) {
  el && el.addEventListener("keydown", (e) => { e.key === "Enter" && (e.preventDefault(), run()); });
}
function GF508(H) {
  if (!document.getElementById("bpd508-css")) {
    let st = document.createElement("style"); st.id = "bpd508-css";
    st.textContent = ".modal.bpd-modal{width:min(1769px,calc(100vw - 40px))}"
      + ".bpd-modal .bpd-jobq{width:170px;min-width:130px}"
      + ".bpd-modal .bpd-list{background:#fff;border:1px solid #d5dbe3;border-radius:6px}"
      + ".bpd-modal .bpd-list .tbl{border-collapse:separate;border-spacing:0;width:100%}"
      + ".bpd-modal .bpd-list .tbl th,.bpd-modal .bpd-list .tbl td{border-right:1px solid #dfe3e8;border-bottom:1px solid #dfe3e8}"
      + ".bpd-modal .bpd-list .tbl th:last-child,.bpd-modal .bpd-list .tbl td:last-child{border-right:0}"
      + ".bpd-modal .bpd-list .tbl tbody tr{height:29px}"
      + ".bpd-modal .bpd-list .tbl tbody td{vertical-align:middle}"
      + ".bpd-modal .bpd-list .tbl tr.bpd-fill td{background:#fff;pointer-events:none;user-select:none}"
      + ".bpd-modal .bpd-list .tbl tbody tr.bpd-fill:hover td{background:#fff}";
    document.head.appendChild(st);
  }
  let tb = H.querySelector("#bpd-tb"), wrap = H.querySelector(".bpd-list"), th = wrap && wrap.querySelector("thead");
  if (!tb || !wrap || !th) return;
  let cols = th.querySelectorAll("th").length || 10, mo = null, raf = 0;
  let fill = () => {
    raf = 0;
    mo && mo.disconnect();
    tb.querySelectorAll("tr.bpd-fill").forEach((r) => r.remove());
    let rows = [...tb.rows], used = th.offsetHeight + rows.reduce((t, r) => t + r.offsetHeight, 0);
    let avail = wrap.clientHeight - used, rh = 29;
    if (avail >= 2) { tb.insertAdjacentHTML("beforeend", '<tr class="bpd-fill" aria-hidden="true">' + "<td>&nbsp;</td>".repeat(cols) + "</tr>"); let pr = tb.lastElementChild; rh = pr.offsetHeight || 29; pr.remove(); }
    if (avail >= 2) {
      let n = Math.floor(avail / rh), rest = avail - n * rh, html = "";
      if (n < 1) { n = 1; rest = avail - rh; }
      for (let k = 0; k < n; k++) html += `<tr class="bpd-fill" aria-hidden="true"${k === n - 1 && rest ? ` style="height:${rh + rest}px"` : ""}>` + "<td>&nbsp;</td>".repeat(cols) + "</tr>";
      tb.insertAdjacentHTML("beforeend", html);
    }
    mo && mo.observe(tb, { childList: !0 });
  };
  let later = () => { raf || (raf = requestAnimationFrame(fill)); };
  mo = new MutationObserver(later); mo.observe(tb, { childList: !0 });
  typeof ResizeObserver == "function" && new ResizeObserver(later).observe(wrap);
  later();
}

/* \u2550\u2550\u2550 V.509 BILLING PDF : A4 \u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19\u0E17\u0E38\u0E01\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C (\u0E1B\u0E38\u0E48\u0E21 / Ctrl+P / \u0E40\u0E21\u0E19\u0E39 Browser) \u00B7 \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C = Billing Note no. \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2550\u2550\u2550 */
var PG509 = "nj-bpd-page509";
/* \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C : \u0E40\u0E25\u0E02 Billing Note no. \u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E21\u0E48 / \u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E37\u0E48\u0E19) */
function BN509(no) { return String(no == null ? "" : no).trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, ""); }
function PR509(fn) {
  if (!fn) { lt("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02 Billing Note no. \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E14 POST \u0E01\u0E48\u0E2D\u0E19 Print / Download PDF (\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E21\u0E15\u0E34)", "err"); return; }
  let again = () => { setTimeout(() => { let st = PO509.st; st && st.open && st.apply(); }, 0); };
  window.addEventListener("afterprint", again, { once: !0 });
  fe(fn);
}
/* \u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E34\u0E14 Preview : \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A @page A4 \u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19 + \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 + \u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 = \u0E40\u0E25\u0E02 Billing Note (\u0E01\u0E23\u0E13\u0E35\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E14 Ctrl+P \u0E40\u0E2D\u0E07) */
function PO509(body, foot, fn) {
  let t0 = document.title, hadCls = document.body.classList.contains("nj-print-doc");
  let st = { open: !0 };
  st.apply = () => {
    if (!document.getElementById(PG509)) { let s = document.createElement("style"); s.id = PG509; s.textContent = "@page{size:A4 landscape;margin:0}"; document.head.appendChild(s); }
    document.body.classList.add("nj-print-doc");
    fn && (document.title = fn);
  };
  st.close = () => {
    if (!st.open) return;
    st.open = !1;
    let s = document.getElementById(PG509); s && s.parentNode && s.parentNode.removeChild(s);
    hadCls || document.body.classList.remove("nj-print-doc");
    document.title = t0;
    mo && mo.disconnect();
  };
  PO509.st && PO509.st.open && PO509.st.close();
  PO509.st = st;
  st.apply();
  let left = foot && foot.querySelector(".mf-left");
  if (left) {
    let h = document.createElement("span");
    h.className = "bpd-fname509";
    h.style.cssText = "font-size:12px;font-weight:600;white-space:nowrap;margin-left:6px;color:" + (fn ? "#166534" : "#b45309");
    h.textContent = fn ? "\u0E44\u0E1F\u0E25\u0E4C PDF : " + fn + ".pdf \u00B7 A4 \u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19" : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02 Billing Note no. \u2014 POST \u0E01\u0E48\u0E2D\u0E19\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 PDF";
    left.appendChild(h);
  }
  let mo = new MutationObserver(() => { document.body.contains(body) || st.close(); });
  mo.observe(document.body, { childList: !0, subtree: !0 });
  return st;
}

/* \u2550\u2550\u2550 V.510 BILLING PDF : \u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2014 APL = NJ \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 / \u0E15\u0E34\u0E4A\u0E01 GY \u0E2B\u0E23\u0E37\u0E2D W (\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E23\u0E48\u0E27\u0E21) \u00B7 \u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E2D\u0E37\u0E48\u0E19 = NJL \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2550\u2550\u2550
   \u0E43\u0E0A\u0E49 radio \u0E0A\u0E38\u0E14\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21 (\u0E0B\u0E48\u0E2D\u0E19) \u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E01\u0E47\u0E1A\u0E04\u0E48\u0E32 -> \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 / POST / \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E14\u0E34\u0E21 \u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21\u0E17\u0E38\u0E01\u0E08\u0E38\u0E14 */
function SR510(H, v) { let r = H.querySelector(`input[name="bpd-pfx"][value="${v}"]`); r && !r.disabled && (r.checked = !0); }
function SY510(H, tpl) {
  let box = H && H.querySelector("#bpd-pfx-box");
  if (!box) return;
  if (!document.getElementById("bpd510-css")) {
    let st = document.createElement("style"); st.id = "bpd510-css";
    st.textContent = "#bpd-pfx-box .bpd-radio{display:none!important}"
      + ".bpd-ser510{display:inline-flex;align-items:center;gap:10px;flex-wrap:nowrap}"
      + ".bpd-ser510 .b510{display:inline-block;padding:2px 10px;border-radius:999px;border:1px solid #cbd5e1;background:#f8fafc;color:#64748b;font-size:12.5px;font-weight:600;white-space:nowrap}"
      + ".bpd-ser510 .b510.on{background:#dcfce7;border-color:#86efac;color:#166534}"
      + ".bpd-ser510 .c510{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}";
    document.head.appendChild(st);
  }
  let ui = box.querySelector(".bpd-ser510");
  if (!ui) {
    ui = document.createElement("span"); ui.className = "bpd-ser510"; box.appendChild(ui);
    ui.addEventListener("change", (e) => {
      let cb = e.target.closest("input[data-ser]");
      if (!cb) return;
      cb.checked && ui.querySelectorAll("input[data-ser]").forEach((x) => { x !== cb && (x.checked = !1); });
      SR510(H, cb.checked ? cb.dataset.ser : "NJ");
      let nj = ui.querySelector(".b510"); nj && nj.classList.toggle("on", !cb.checked);
      PV510(H, "apl");
    });
  }
  let rs = [...H.querySelectorAll('input[name="bpd-pfx"]')], posted = rs.some((r) => r.disabled), cur = (rs.find((r) => r.checked) || {}).value || "";
  if (posted) { let bn = ((H.querySelector("#bpd-note") || {}).value || "").match(/^(NJL|NJ|GY|W)\d{4}-/); ui.innerHTML = `<span class="b510 on">${(bn && bn[1]) || cur || "-"}</span>`; return; }
  if (tpl === "apl") {
    let want = cur === "GY" || cur === "W" ? cur : "NJ";
    SR510(H, want);
    ui.innerHTML = `<span class="b510${want === "NJ" ? " on" : ""}" title="\u0E44\u0E21\u0E48\u0E15\u0E34\u0E4A\u0E01 GY / W = NJ \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34">NJ \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34</span>`
      + `<label class="c510"><input type="checkbox" data-ser="GY"${want === "GY" ? " checked" : ""}>GY</label>`
      + `<label class="c510"><input type="checkbox" data-ser="W"${want === "W" ? " checked" : ""}>W</label>`;
  } else {
    SR510(H, "NJL");
    ui.innerHTML = '<span class="b510 on">NJL \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34</span>';
  }
}
function PV510(H, tpl) {
  let no = H && H.querySelector("#bpd-note");
  if (!no) return;
  if (no.dataset.ph0 == null) no.dataset.ph0 = no.placeholder;
  if (no.value) { PV510.tk = (PV510.tk || 0) + 1; no.removeAttribute("data-next"); return; }   /* \u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B */
  let tk = (PV510.tk = (PV510.tk || 0) + 1);
  let pf = (H.querySelector('input[name="bpd-pfx"]:checked') || {}).value || "", d = (H.querySelector("#bpd-bdate") || {}).value || "";
  no.placeholder = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E23\u0E27\u0E08\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B\u2026";
  RPC507("njacc_billing_peek_no", { p: { template: tpl || "general", prefix: pf || null, billing_date: d || null } }).then((r) => {
    if (tk !== PV510.tk) return;
    r && r.next_no ? (no.placeholder = `\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B ${r.next_no} \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D POST`, no.setAttribute("data-next", r.next_no)) : (no.placeholder = no.dataset.ph0, no.removeAttribute("data-next"));
  }).catch(() => { tk === PV510.tk && (no.placeholder = no.dataset.ph0, no.removeAttribute("data-next")); });
}
function PW510(H, gt) {
  H.addEventListener("change", (e) => { let t = e.target; t && t.id === "bpd-bdate" && PV510(H, gt()); });
  /* \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E32\u0E01\u0E41\u0E17\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19) -> \u0E15\u0E23\u0E27\u0E08\u0E40\u0E25\u0E02\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E19\u0E17\u0E35 */
  let f = () => { document.body.contains(H) ? PV510(H, gt()) : window.removeEventListener("focus", f); };
  window.addEventListener("focus", f);
  setTimeout(() => { SY510(H, gt()); PV510(H, gt()); }, 0);
}

/* \u2550\u2550\u2550 V.514 BILLING PDF : \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C USER + \u0E04\u0E49\u0E19\u0E2B\u0E32 / \u0E40\u0E25\u0E37\u0E2D\u0E01 USER (\u0E1C\u0E39\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 \u00B7 \u0E01\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 \u00B7 \u0E14\u0E36\u0E07\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32) \u2550\u2550\u2550 */
function UN514(s) {
  let e = String(s ?? "").trim().split(/\s+/).filter(Boolean), P = new Set(["\u0E19\u0E32\u0E22", "\u0E19\u0E32\u0E07", "\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", "\u0E19.\u0E2A.", "\u0E19.\u0E2A", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "miss"]);
  for (; e.length > 1 && P.has(e[0].toLowerCase()); ) e.shift();
  return e[0] || "";
}
function UL514(H, args) {
  if (!document.getElementById("bpd514-css")) {
    let st = document.createElement("style"); st.id = "bpd514-css";
    st.textContent = ".bpd-modal #bpd-uq{width:200px;min-width:150px}";
    document.head.appendChild(st);
  }
  let dl = H.querySelector("#bpd-ul");
  if (!dl) return;
  H.__users514 = [];
  RPC507("njacc_charge_page_bundle", { p: Object.assign(args(), { page: 1, size: 1, with_kpi: !1, with_options: !0 }) }).then((r) => {
    let u = (r && r.filter_options && r.filter_options.users) || [], seen = new Set();
    u = u.filter((x) => x && x.id && !seen.has(x.id) && seen.add(x.id));
    H.__users514 = u;
    dl.innerHTML = u.map((x) => `<option value="${n(x.name || "")}">${n(x.nickname || UN514(x.name))}</option>`).join("");
  }).catch(() => {});
}
function US514(H) {
  let el = H.querySelector("#bpd-uq"), v = el ? el.value.trim().toLowerCase() : "";
  if (!v) return null;
  let u = H.__users514 || [], ks = (x) => [x.name, x.nickname, UN514(x.name)].filter(Boolean).map((y) => String(y).toLowerCase());
  let ex = u.filter((x) => ks(x).includes(v)), m = ex.length === 1 ? ex[0] : null;
  if (!m && !ex.length) { let p = u.filter((x) => ks(x).some((y) => y.includes(v))); m = p.length === 1 ? p[0] : null; }
  el.title = m ? m.name || "" : "\u0E44\u0E21\u0E48\u0E1E\u0E1A USER \u0E19\u0E35\u0E49 \u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E1A\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 1 \u0E04\u0E19 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E15\u0E47\u0E21\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23";
  return m ? m.id : "00000000-0000-0000-0000-000000000000";
}
function UR514(H) { let el = H.querySelector("#bpd-uq"); el && (el.value = ""); }
function UB514(H, run) {
  let el = H.querySelector("#bpd-uq");
  el && (el.addEventListener("change", () => run()), el.addEventListener("keydown", (e) => { e.key === "Enter" && (e.preventDefault(), run()); }));
}
/* \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E33\u0E04\u0E49\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 -> \u0E14\u0E36\u0E07\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32 (\u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14 100 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E23\u0E01) \u00B7 \u0E15\u0E31\u0E14\u0E0B\u0E49\u0E33\u0E15\u0E32\u0E21 id */
async function AP514(fn, args) {
  let out = [], seen = new Set(), total = 0;
  for (let page = 1; page <= 300; page++) {
    let r = await fn(Object.assign({}, args, { page })), rows = (r && r.rows) || [];
    total = Number((r && r.total) || 0);
    for (let x of rows) x && !seen.has(x.id) && (seen.add(x.id), out.push(x));
    if (!rows.length || page * (args.size || 100) >= total) break;
  }
  return { rows: out, total: out.length };
}

/* \u2550\u2550\u2550 V.516 BILLING PDF APL : Date = \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE \u0E08\u0E23\u0E34\u0E07 \u00B7 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E15\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E08\u0E23\u0E34\u0E07 (Invoice No. \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E44\u0E21\u0E48\u0E17\u0E31\u0E1A) \u2550\u2550\u2550 */
function DT516(w) {
  let d = K(w && w.invoice_date);
  return d || '<span class="bpd-miss516" title="\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE</span>';
}
function CW516(rows) {
  let PW = 1065.8, FF = '"Sarabun","TH Sarabun New",Arial,sans-serif', cv = CW516.c || (CW516.c = document.createElement("canvas")), x = cv.getContext("2d");
  let tw = (t, b) => { x.font = (b ? "700 " : "400 ") + "12px " + FF; return x.measureText(String(t == null ? "" : t)).width; };
  let H = ["Date", "Item", "Invoice No.", "Master", "House B/L No.", "Data Type", "Company Invoice", "DCL INV.", "Customer Job No.", "Service charge", "Advance", "VAT 7%", "Amount", "WHT 3%", "Total Amount"];
  let NW = [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1], BASE = [0, 0, 0, 6, 8, 3, 18, 9, 6, 0, 0, 0, 0, 0, 0];
  let R = rows || [], tot = (k) => M(nj481R(R.reduce((c0, a0) => c0 + nj481Val(a0, k), 0)));
  let cells = R.map((w, i) => [K(w.invoice_date) || "00/00/0000", String(i + 1), E(w.invoice_no), E(w.master_bl_no ?? w.master), E(w.house_bl_no), E(w.data_type), E(CI519(w.company_invoice,nj481Short)), E(w.customs_declaration_no), E(w.customer_job_no), M(w.service_amount), M(w.advance_amount), M(w.vat_amount), M(nj481Amt(w)), M(w.wht_amount), M(nj481Tot(w))]);
  let T = ["service_amount", "advance_amount", "vat_amount", "subtotal", "wht_amount", "net_payable"].map(tot);
  let PAD = 12, mn = [], pf = [];
  H.forEach((h, i) => {
    let hw = Math.max(...h.split(/\s+/).map((y) => tw(y, 1))), mx = hw, lo = hw;
    cells.forEach((r) => {
      let v = r[i], parts = Array.isArray(v) ? v : [v];
      parts.forEach((t) => {
        let full = tw(t, 0);
        if (NW[i]) mx = Math.max(mx, full), lo = Math.max(lo, full);
        else mx = Math.max(mx, full), lo = Math.max(lo, ...String(t || "").split(/\s+/).map((y) => tw(y, 0)));
      });
    });
    if (i >= 9) { let t = tw(T[i - 9], 1); mx = Math.max(mx, t); lo = Math.max(lo, t); }
    mn.push(lo + PAD); pf.push(Math.max(mx, lo) + PAD);
  });
  let w = mn.slice(), left = PW - w.reduce((a, b) => a + b, 0);
  if (left > 0) {
    let want = w.map((v, i) => (NW[i] ? 0 : Math.max(0, pf[i] - v))), wsum = want.reduce((a, b) => a + b, 0);
    if (wsum > 0) { let k = Math.min(1, left / wsum); w = w.map((v, i) => v + want[i] * k); left -= wsum * k; }
    if (left > 0) { let bs = BASE.reduce((a, b) => a + b, 0); w = w.map((v, i) => v + (left * BASE[i]) / bs); }
  }
  let sum = w.reduce((a, b) => a + b, 0);
  return w.map((v) => Math.round((v / sum) * 100000) / 1000);
}


/* \u2550\u2550\u2550 V.519 BILLING PDF : Company Invoice \u0E41\u0E2A\u0E14\u0E07\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48 (THAILAND) \u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E19\u0E44\u0E1B (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25 \u00B7 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19) \u00B7 \u0E40\u0E23\u0E35\u0E22\u0E07 Customer Job No. \u0E19\u0E49\u0E2D\u0E22\u2192\u0E21\u0E32\u0E01 (\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E15\u0E32\u0E21\u0E04\u0E48\u0E32\u0E08\u0E23\u0E34\u0E07 \u00B7 \u0E27\u0E48\u0E32\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E49\u0E32\u0E22) \u2550\u2550\u2550 */
function CI519(v, fb) {
  let t = E(v).replace(/\s+/g, " ").trim(), m = /\(\s*THAILAND\s*\)/i.exec(t);
  return m ? t.slice(m.index) : fb(v);
}
var CJC519 = typeof Intl == "object" && Intl.Collator ? new Intl.Collator("en", { numeric: !0, sensitivity: "base" }) : null;
function CJ519(a, b) {
  let x = E(a && a.customer_job_no).trim(), y = E(b && b.customer_job_no).trim();
  if (!x || !y) return x ? -1 : y ? 1 : 0;
  return CJC519 ? CJC519.compare(x, y) : x.localeCompare(y, "en", { numeric: !0, sensitivity: "base" });
}

export{F as a,le as b,ae as c,oe as d,ke as e,Ie as f};
/* V.571 · ACCOUNTING — BILLING PDF แถบปุ่มล่าง : ยกเลิก = แดงทึบ · บันทึก = เขียวทึบ (เดิม .btn-s ไม่มีสี) (ขนาด/รูปทรง class .btn เดิม เหมือนปุ่มบันทึก) · ซ่อน EXPORT EXCEL (#bpd-xls) และ REPORT (#bpd-report) เฉพาะการแสดงผล — ปุ่ม/Handler/สถานะเดิมยังอยู่ครบ ไม่มีช่องว่างเหลือ */
function BF571(k){try{if(!document.getElementById("bf571-css")){var st=document.createElement("style");st.id="bf571-css";st.textContent=".bpd-modal .bpd-foot .mf-right>[data-close].btn{background:#DC2626!important;border:1px solid #DC2626!important;color:#fff!important}.bpd-modal .bpd-foot .mf-right>[data-close].btn:hover:not(:disabled){background:#B91C1C!important;border-color:#B91C1C!important;filter:none}.bpd-modal .bpd-foot .mf-right>#bpd-save.btn{background:#16A34A!important;border:1px solid #16A34A!important;color:#fff!important}.bpd-modal .bpd-foot .mf-right>#bpd-save.btn:hover:not(:disabled){background:#15803D!important;border-color:#15803D!important;filter:none}.bpd-modal .bpd-foot .mf-right>#bpd-save.btn:disabled{opacity:.5;cursor:not-allowed}";document.head.appendChild(st)}["#bpd-xls","#bpd-report"].forEach(function(q){var b=k&&k.querySelector(q);b&&b.style.setProperty("display","none","important")})}catch(e){}}
