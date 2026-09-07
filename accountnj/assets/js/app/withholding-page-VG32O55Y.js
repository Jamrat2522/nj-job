import{a as ke}from"./chunk-OWSY2KDQ.js";import{a as Ot,b as qt,c as Pt,d as Lt,e as Ht}from"./chunk-RJOSR5KT.js";import{a as st}from"./chunk-RGVAFVSR.js";import{a as Mt}from"./chunk-JBUKAKJJ.js";import{c as he,d as Fe}from"./chunk-NG45Y6KB.js";import{a as Ce}from"./chunk-EVZDPOX3.js";import{i as Ve,j as nt,r as Wt}from"./chunk-A3W3FJZA.js";import{a as Te,b as ie,c as Ue,d as je,e as ee,f as ze}from"./chunk-OPGKUGLK.js";import{f as Rt,g as pe,h as re}from"./chunk-NO6JZBTH.js";import"./chunk-GDT6F23K.js";import{a as oe}from"./chunk-YM5GFE6V.js";import{a as f}from"./chunk-OFOOXWUM.js";import{i as Q}from"./chunk-37ELUCVE.js";import{a as G}from"./chunk-UWAYW6DC.js";import{a as fe,b as We,c as It,d as at,e as be}from"./chunk-ZRPMDTDS.js";import{a as z,b as Z,c as V,d as Dt,e as r}from"./chunk-PCFU74ZV.js";var ue="ACTING_AGENT";var it=e=>Q("njacc_list_wht",e),rt=(e,s,o)=>Q("njacc_void_wht",{p_id:e,p_reason:s,p_request_id:o}),jt=e=>Q("njacc_wht_invoice_options",{p:e}),zt=e=>Q("njacc_save_wht_draft",{p:e}),Vt=(e,s)=>Q("njacc_post_wht",{p_id:e,p_request_id:s}),Ae=e=>Q("njacc_wht_view",{p_id:e}),Ft=()=>Q("njacc_wht_code_list"),ye=e=>Q("njacc_wht_party_search",{p:e}),ot=e=>Q("njacc_wht_party_upsert",{p:e}),ct=(e,s)=>Q("njacc_delete_wht_draft",{p_id:e,p_reason:s}),dt=(e,s)=>Q("njacc_unpost_wht",{p_id:e,p_reason:s});function Ne(e){let s=String(e&&(e.message||e.hint||e.details)||"");return/PGRST202/i.test(s)||/Could not find the function/i.test(s)||/schema cache/i.test(s)&&/njacc_(wht|save_wht|post_wht|delete_wht)/i.test(s)}var Ut={NJACC_WHT_NOT_FOUND:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49",NJACC_WHT_NOT_DRAFT:"\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27",NJACC_WHT_ALREADY_VOID:"\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",NJACC_REASON_REQUIRED:"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",NJACC_WHT_ALREADY_ISSUED:"\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",NJACC_WHT_PAY_DATE_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",NJACC_WHT_ITEM_PAY_DATE_REQUIRED:"\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07",NJACC_WHT_RATE_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_WHT_CUSTOMER_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E01\u0E48\u0E2D\u0E19",NJACC_WHT_CUSTOMER_NOT_FOUND:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49",NJACC_WHT_INVOICE_MISMATCH:"\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49",NJACC_WHT_BASE_INVALID:"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_BAD_TAX_RATE:"\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07 0\u2013100",NJACC_NO_ITEMS:"\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_WHT_BAD_DIRECTION:"\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",NJACC_WHT_AMOUNT_INVALID:"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E25\u0E1A",NJACC_WHT_AMOUNT_GT_BASE:"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",NJACC_WHT_REASON_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E48\u0E2D\u0E19 UNPOST",NJACC_WHT_NOT_ISSUED:"\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 POST \u2014 UNPOST \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",NJACC_WHT_VOIDED:"\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01 VOID \u0E41\u0E25\u0E49\u0E27",NJACC_WHT_EXPORT_INCOMPLETE:"\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C",NJACC_WHT_CERT_NO_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",NJACC_WHT_PAYER_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",NJACC_WHT_PAYEE_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",NJACC_WHT_TAXID13_INVALID:"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 / \u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01",NJACC_WHT_CATEGORY_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14 50 \u0E17\u0E27\u0E34 \u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_WHT_INCOME_TYPE_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",NJACC_WHT_FORM_TYPE_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",NJACC_WHT_PAY_METHOD_REQUIRED:"\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E20\u0E32\u0E29\u0E35\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49",NJACC_WHT_AMOUNT_ZERO:"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E23\u0E27\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49"};function J(e){let s=String(e&&e.message||"");for(let o in Ut)if(s.includes(o))return Ut[o];return s||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14"}var Sa="https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";async function Ta(){return window.ExcelJS||await Mt(Sa),window.ExcelJS}function Ca(e,s){let o=qt(e),c=Object.fromEntries(o.map(_=>[_.i,_])),a={};[...e.querySelectorAll("thead th")].forEach(_=>{a[Number(_.dataset.ci)]=_});let l=o.map(_=>({..._,reqFirst:!1,required:_.required&&!_.reqFirst})),{order:b,hidden:h}=Lt(l,Pt(s,o)),y=new Set(l.filter(_=>_.required).map(_=>_.i));return b.filter(_=>!h.has(_)).map(_=>c[_]).filter(_=>_&&!y.has(_.i)).map(_=>({i:_.i,label:ka(a[_.i],_.label)}))}function ka(e,s){let o=String(s??"");if(!e||!o)return o;let c="";try{let a=window.getComputedStyle(e);c=String(a&&a.textTransform||"").trim().toLowerCase()}catch{c=""}return c==="uppercase"?o.toUpperCase():c==="lowercase"?o.toLowerCase():c==="capitalize"?o.replace(/(^|[\s(\[\/-])(\p{L})/gu,(a,l,b)=>l+b.toUpperCase()):o}function Aa(e){if(e==null)return"";let s=document.createElement("div");return s.innerHTML=String(e),(s.textContent||"").replace(/\s+/g," ").trim()}var Na=/^-?\d{1,3}(,\d{3})*\.\d{2}$|^-?\d+\.\d{2}$/;function Ra(e){let s=String(e??"");if(!Na.test(s))return{v:s};let o=Number(s.replace(/,/g,""));return Number.isFinite(o)?{v:o,numFmt:"#,##0.00"}:{v:s}}async function Da(e,s,o={}){let c=await Ta(),a=new c.Workbook,l=a.addWorksheet(o.sheet||"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",{pageSetup:{paperSize:9,orientation:"landscape",fitToPage:!0,fitToWidth:1,fitToHeight:0},views:[{state:"frozen",ySplit:1}]}),b=l.addRow(e.map(h=>h.label));return b.font={bold:!0},b.alignment={vertical:"middle",wrapText:!0},e.forEach((h,y)=>{let _=b.getCell(y+1);_.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFEFEFEF"}},_.border={top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"}},l.getColumn(y+1).width=Math.min(40,Math.max(10,h.label.length+4))}),(s||[]).forEach(h=>{let y=h.map(k=>Ra(k)),_=l.addRow(y.map(k=>k.v));y.forEach((k,w)=>{if(k.numFmt){let v=_.getCell(w+1);v.numFmt=k.numFmt,v.alignment={horizontal:"right"}}})}),a}async function Jt(e={},s){let{table:o,modeKey:c,filters:a={},fetchAll:l,rowValues:b}=e;if(!o||typeof l!="function"||typeof b!="function")return;let h=Ca(o,c);if(!h.length){f("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E17\u0E35\u0E48\u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07","err");return}s&&(s.disabled=!0);try{let _=(await l(a)||[]).map(T=>{let R=b(T);return h.map(ae=>Aa(R[ae.i]))}),w=await(await Da(h,_,{sheet:"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"})).xlsx.writeBuffer(),v="wht_"+(a.mode||"ALL")+"_"+(a.from||"all")+"_"+(a.to||"all")+".xlsx",M=URL.createObjectURL(new Blob([w],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})),H=document.createElement("a");H.href=M,H.download=v,document.body.appendChild(H),H.click(),H.remove(),setTimeout(()=>URL.revokeObjectURL(M),1e3),f(_.length?"Export Excel \u0E41\u0E25\u0E49\u0E27 "+_.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 "+h.length+" \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C":"Export Excel \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 (\u0E21\u0E35\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E2B\u0E31\u0E27\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C)","ok")}catch(y){f(J(y),"err")}finally{s&&(s.disabled=!1)}}var q=(e,s="-")=>{let o=e==null?"":String(e).trim();return r(o||s)},_e=e=>{let s=Number(e);return Number.isFinite(s)?s:0},Re=e=>Math.round((_e(e)+Number.EPSILON)*100)/100,Ia=e=>{let s=_e(e);return(Number.isInteger(s)?String(s):String(Re(s)))+"%"},Oa={SERVICE:"\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E33\u0E02\u0E2D\u0E07",TRANSPORT:"\u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07",RENT:"\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32",OTHER:"\u0E2D\u0E37\u0E48\u0E19 \u0E46"},qa=e=>{let s=String(e||"").toUpperCase();return Oa[s]||String(e||"-")},ut=[{key:"original",label:"\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 1 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E43\u0E0A\u0E49\u0E41\u0E19\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E41\u0E1A\u0E1A\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E20\u0E32\u0E29\u0E35)"},{key:"copy",label:"\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 2 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19)"},{key:"file",label:"\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E04\u0E39\u0E48\u0E09\u0E1A\u0E31\u0E1A (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19)"}],Pa={payer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>',payee:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>'},lt=e=>`<span class="whd-bub">${Pa[e]||""}</span>`;function ta(e){let s=0,o=0,c=new Set;for(let a of e)s=Re(s+_e(a.tax_base)),o=Re(o+_e(a.amount)),c.add(_e(a.rate));return{base:s,tax:o,rates:[...c].sort((a,l)=>a-l)}}var Gt=e=>q(e,"-"),La="\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014",Bt=(e,s)=>e?V(e):s?V(s):La,wt=[["PND1K","(1) \u0E20.\u0E07.\u0E14.1\u0E01"],["PND1K_SPECIAL","(2) \u0E20.\u0E07.\u0E14.1\u0E01 \u0E1E\u0E34\u0E40\u0E28\u0E29"],["PND2","(3) \u0E20.\u0E07.\u0E14.2"],["PND3","(4) \u0E20.\u0E07.\u0E14.3"],["PND2K","(5) \u0E20.\u0E07.\u0E14.2\u0E01"],["PND3K","(6) \u0E20.\u0E07.\u0E14.3\u0E01"],["PND53","(7) \u0E20.\u0E07.\u0E14.53"]],mt=[["WITHHOLD","(1) \u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"],["FOREVER","(2) \u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E15\u0E25\u0E2D\u0E14\u0E44\u0E1B"],["ONCE","(3) \u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"],["OTHER","(4) \u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E23\u0E30\u0E1A\u0E38)"]],Yt=Object.fromEntries(wt.map(([e,s])=>[e,s.replace(/^\(\d+\)\s*/,"")])),Kt=Object.fromEntries(mt.map(([e,s])=>[e,s.replace(/^\(\d+\)\s*/,"")])),Je=(e,s)=>{let o=String(s||"").trim();return o?e[o]||o:""},Qt='<span class="w50-bl"></span>',Ha='<span class="w50-bl w50-bl-lg"></span>',Ma=`<div class="w50-sl">
  <div class="w50-l1">(1) \u0E01\u0E23\u0E13\u0E35\u0E1C\u0E39\u0E49\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15\u0E20\u0E32\u0E29\u0E35 \u0E42\u0E14\u0E22\u0E08\u0E48\u0E32\u0E22\u0E08\u0E32\u0E01
    \u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E02\u0E2D\u0E07\u0E01\u0E34\u0E08\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E43\u0E19\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E31\u0E07\u0E19\u0E35\u0E49</div>
  <div class="w50-l2">(1.1) \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E23\u0E49\u0E2D\u0E22\u0E25\u0E30 30 \u0E02\u0E2D\u0E07\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34</div>
  <div class="w50-l2">(1.2) \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E23\u0E49\u0E2D\u0E22\u0E25\u0E30 25 \u0E02\u0E2D\u0E07\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34</div>
  <div class="w50-l2">(1.3) \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E23\u0E49\u0E2D\u0E22\u0E25\u0E30 20 \u0E02\u0E2D\u0E07\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34</div>
  <div class="w50-l2">(1.4) \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E23\u0E30\u0E1A\u0E38) ${Qt} \u0E02\u0E2D\u0E07\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34</div>
  <div class="w50-l1">(2) \u0E01\u0E23\u0E13\u0E35\u0E1C\u0E39\u0E49\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15\u0E20\u0E32\u0E29\u0E35 \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E08\u0E48\u0E32\u0E22\u0E08\u0E32\u0E01</div>
  <div class="w50-l2">(2.1) \u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E02\u0E2D\u0E07\u0E01\u0E34\u0E08\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19\u0E20\u0E32\u0E29\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25</div>
  <div class="w50-l2">(2.2) \u0E40\u0E07\u0E34\u0E19\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E1A\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E01\u0E33\u0E44\u0E23\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E19\u0E33\u0E21\u0E32\u0E23\u0E27\u0E21
    \u0E04\u0E33\u0E19\u0E27\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E32\u0E22\u0E44\u0E14\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25</div>
  <div class="w50-l2">(2.3) \u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E2B\u0E31\u0E01\u0E1C\u0E25\u0E02\u0E32\u0E14\u0E17\u0E38\u0E19\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E22\u0E01\u0E21\u0E32\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 5 \u0E1B\u0E35
    \u0E01\u0E48\u0E2D\u0E19\u0E23\u0E2D\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E40\u0E27\u0E25\u0E32\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1B\u0E35\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19</div>
  <div class="w50-l2">(2.4) \u0E01\u0E33\u0E44\u0E23\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E23\u0E39\u0E49\u0E17\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E42\u0E14\u0E22\u0E27\u0E34\u0E18\u0E35\u0E2A\u0E48\u0E27\u0E19\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E35\u0E22 (equity method)</div>
  <div class="w50-l2">(2.5) \u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E23\u0E30\u0E1A\u0E38) ${Qt}</div>
</div>`,Wa=[["M40_1","1. \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07 \u0E40\u0E1A\u0E35\u0E49\u0E22\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07 \u0E42\u0E1A\u0E19\u0E31\u0E2A \u0E2F\u0E25\u0E2F \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 (1)",0],["M40_2","2. \u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21 \u0E04\u0E48\u0E32\u0E19\u0E32\u0E22\u0E2B\u0E19\u0E49\u0E32 \u0E2F\u0E25\u0E2F \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 (2)",0],["M40_3","3. \u0E04\u0E48\u0E32\u0E41\u0E2B\u0E48\u0E07\u0E25\u0E34\u0E02\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u0E2F\u0E25\u0E2F \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 (3)",0],["M40_4A","4. (\u0E01) \u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22 \u0E2F\u0E25\u0E2F \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 (4) (\u0E01)",0],["M40_4B","(\u0E02) \u0E40\u0E07\u0E34\u0E19\u0E1B\u0E31\u0E19\u0E1C\u0E25 \u0E40\u0E07\u0E34\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E1A\u0E48\u0E07\u0E01\u0E33\u0E44\u0E23 \u0E2F\u0E25\u0E2F \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 (4) (\u0E02)",1,Ma],["SEC3TER","5. \u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E15\u0E32\u0E21\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E01\u0E23\u0E21\u0E2A\u0E23\u0E23\u0E1E\u0E32\u0E01\u0E23\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 3 \u0E40\u0E15\u0E23\u0E2A \u0E40\u0E0A\u0E48\u0E19 \u0E23\u0E32\u0E07\u0E27\u0E31\u0E25 \u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C\u0E43\u0E14 \u0E46 \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22 \u0E23\u0E32\u0E07\u0E27\u0E31\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E27\u0E14 \u0E01\u0E32\u0E23\u0E41\u0E02\u0E48\u0E07\u0E02\u0E31\u0E19 \u0E01\u0E32\u0E23\u0E0A\u0E34\u0E07\u0E42\u0E0A\u0E04 \u0E04\u0E48\u0E32\u0E41\u0E2A\u0E14\u0E07\u0E02\u0E2D\u0E07\u0E19\u0E31\u0E01\u0E41\u0E2A\u0E14\u0E07\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E30 \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E33\u0E02\u0E2D\u0E07 \u0E04\u0E48\u0E32\u0E42\u0E06\u0E29\u0E13\u0E32 \u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32 \u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07 \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u0E04\u0E48\u0E32\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E27\u0E34\u0E19\u0E32\u0E28\u0E20\u0E31\u0E22 \u0E2F\u0E25\u0E2F",0],["OTHER","6. \u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E23\u0E30\u0E1A\u0E38)",0,Ha]],aa=(e,s,o)=>{let c=String(e??"").replace(/\D/g,"").slice(0,s).split(""),a="";for(let l=0;l<s;l++)a+=`<span class="w50-tb${o.includes(l)?" w50-tb-gap":""}">${c[l]?r(c[l]):""}</span>`;return a},pt=e=>aa(e,13,[0,4,9,11]),Ua=e=>aa(e,10,[0,4,8]),Ge=e=>e?"\u2612":"\u2610",ht=e=>`<div class="w50-ph2">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23
    <span class="w50-tboxes">${Ua(e)}</span></div>`;function na(e,{copy:s="original",copyLabel:o=""}={}){let c=e.items||[],a=ta(c),l={name:e.payer_name,tax_id:e.payer_tax_id,address:e.payer_address},b={name:e.payee_name,tax_id:e.payee_tax_id,address:e.payee_address},h=e.has_acting_agent===!0||e.has_acting_agent===!1?e.has_acting_agent:!!String(e.agent_name||"").trim(),y=String(e.reference_no||"").trim(),_=String(e.status||"").toUpperCase()==="DRAFT"&&!y,k=String(e.status||"").toUpperCase()==="VOID",w={};for(let T of c){let R=T.wht_income_category;R&&(w[R]||(w[R]={base:0,tax:0,date:null}),w[R].base=Re(w[R].base+_e(T.tax_base)),w[R].tax=Re(w[R].tax+_e(T.amount)),w[R].date||(w[R].date=T.pay_date||e.pay_date))}let v=Wa.map(([T,R,ae,Ee])=>{let Y=w[T];return`<tr>
      
      <td class="w50-d${ae?" w50-sub":""}">${r(R)}${T==="OTHER"&&e.note?" "+r(e.note):""}${Ee||""}</td>
      <td class="w50-c">${Y?r(V(Y.date)):""}</td>
      <td class="w50-n">${Y?z(Y.base):""}</td>
      <td class="w50-n">${Y?z(Y.tax):""}</td>
    </tr>`}).join(""),M=e.has_fund===!0||e.has_fund===!1?e.has_fund:[e.gpf_amount,e.social_security_amount,e.provident_fund_amount].some(T=>T!=null&&T!==""&&Number(T)!==0),H=T=>!M||T==null||T===""?"":z(T);return`
  <div class="whd w50${_?" w50-draft":""}">
    ${_?'<div class="whd-wm whd-wm-d">DRAFT</div>':""}
    ${k?'<div class="whd-wm whd-wm-v">VOID</div>':""}
    ${o?'<div class="w50-cp">'+r(o)+"</div>":""}

    <div class="w50-copies">
      <span>${Ge(s==="original")} \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 1 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
        \u0E43\u0E0A\u0E49\u0E41\u0E19\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E1A\u0E41\u0E1A\u0E1A\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E20\u0E32\u0E29\u0E35)</span>
      <span>${Ge(s!=="original")} \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 2 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
        \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19)</span>
    </div>

    <div class="w50-title">
      <div class="w50-t1">\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</div>
      <div class="w50-t2">\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 50 \u0E17\u0E27\u0E34 \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23</div>
      <div class="w50-bk">
        <div>\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48 <b>${q(e.book_no,"")}</b></div>
        <div>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 <b>${q(e.certificate_no,"")}</b></div>
      </div>
    </div>

    <section class="w50-party">
      <div class="w50-ph">\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 : -
        <span class="w50-tl">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)*</span>
        <span class="w50-tboxes">${pt(l.tax_id)}</span></div>
      ${ht(e.payer_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">\u0E0A\u0E37\u0E48\u0E2D</span>
        <span class="w50-v">${q(l.name,"")}</span></div>
      <div class="w50-hint">(\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19 \u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2A\u0E21\u0E32\u0E04\u0E21 \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E13\u0E30\u0E1A\u0E38\u0E04\u0E04\u0E25)</div>
      <div class="w50-row"><span class="w50-lb">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</span>
        <span class="w50-v">${q(l.address,"")}</span></div>
      <div class="w50-hint">(\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E2B\u0E21\u0E39\u0E48\u0E1A\u0E49\u0E32\u0E19 \u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E0A\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E15\u0E23\u0E2D\u0E01/\u0E0B\u0E2D\u0E22
        \u0E2B\u0E21\u0E39\u0E48\u0E17\u0E35\u0E48 \u0E16\u0E19\u0E19 \u0E15\u0E33\u0E1A\u0E25/\u0E41\u0E02\u0E27\u0E07 \u0E2D\u0E33\u0E40\u0E20\u0E2D/\u0E40\u0E02\u0E15 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14)</div>
    </section>

    
    ${h?`
    <section class="w50-party w50-agent">
      <div class="w50-ph">\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19\u0E42\u0E14\u0E22 : -
        <span class="w50-tl">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)*</span>
        <span class="w50-tboxes">${pt(e.agent_tax_id)}</span></div>
      ${ht(e.agent_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">\u0E0A\u0E37\u0E48\u0E2D</span>
        <span class="w50-v">${q(e.agent_name,"")}</span></div>
      <div class="w50-row"><span class="w50-lb">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</span>
        <span class="w50-v">${q(e.agent_address,"")}</span></div>
    </section>`:""}

    <section class="w50-party">
      <div class="w50-ph">\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 : -
        <span class="w50-tl">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)*</span>
        <span class="w50-tboxes">${pt(b.tax_id)}</span></div>
      ${ht(e.payee_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">\u0E0A\u0E37\u0E48\u0E2D</span>
        <span class="w50-v">${q(b.name,"")}</span></div>
      <div class="w50-hint">(\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19 \u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2A\u0E21\u0E32\u0E04\u0E21 \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E13\u0E30\u0E1A\u0E38\u0E04\u0E04\u0E25)</div>
      <div class="w50-row"><span class="w50-lb">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</span>
        <span class="w50-v">${q(b.address,"")}</span></div>
      <div class="w50-hint">(\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E2B\u0E21\u0E39\u0E48\u0E1A\u0E49\u0E32\u0E19 \u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E0A\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E15\u0E23\u0E2D\u0E01/\u0E0B\u0E2D\u0E22
        \u0E2B\u0E21\u0E39\u0E48\u0E17\u0E35\u0E48 \u0E16\u0E19\u0E19 \u0E15\u0E33\u0E1A\u0E25/\u0E41\u0E02\u0E27\u0E07 \u0E2D\u0E33\u0E40\u0E20\u0E2D/\u0E40\u0E02\u0E15 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14)</div>
    </section>

    <section class="w50-seq">
      <span class="w50-seq-l">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48 <b>${q(e.form_seq,"")}</b> \u0E43\u0E19\u0E41\u0E1A\u0E1A</span>
      <span class="w50-seq-o">${wt.map(([T,R])=>`<span>${Ge(e.form_type===T)} ${r(R)}</span>`).join("")}</span>
      <div class="w50-hint">(\u0E43\u0E2B\u0E49\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E2D\u0E1A\u0E22\u0E31\u0E19\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E15\u0E32\u0E21\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2F
        \u0E01\u0E31\u0E1A\u0E41\u0E1A\u0E1A\u0E22\u0E37\u0E48\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22)</div>
    </section>

    <table class="w50-tbl">
      <thead><tr>
        <th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E1E\u0E36\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
        <th class="w50-c">\u0E27\u0E31\u0E19 \u0E40\u0E14\u0E37\u0E2D\u0E19<br>\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E35\u0E20\u0E32\u0E29\u0E35 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
        <th class="w50-n">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
        <th class="w50-n">\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01<br>\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E44\u0E27\u0E49</th>
      </tr></thead>
      <tbody>${v}</tbody>
      <tfoot>
        <tr><td class="w50-sum">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07</td>
          <td class="w50-c"></td>
          <td class="w50-n"><b>${z(a.base)}</b></td>
          <td class="w50-n"><b>${z(a.tax)}</b></td></tr>
        <tr><td class="w50-words" colspan="4">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07 (\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23)
          <b>${r(ke(a.tax))}</b></td></tr>
      </tfoot>
    </table>

    <div class="w50-fund">\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32 \u0E01\u0E1A\u0E02./\u0E01\u0E2A\u0E08./\u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E2A\u0E07\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E04\u0E23\u0E39\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E40\u0E2D\u0E01\u0E0A\u0E19
      <u>${H(e.gpf_amount)}</u> \u0E1A\u0E32\u0E17
      \u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2A\u0E31\u0E07\u0E04\u0E21 <u>${H(e.social_security_amount)}</u> \u0E1A\u0E32\u0E17
      \u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E0A\u0E35\u0E1E <u>${H(e.provident_fund_amount)}</u> \u0E1A\u0E32\u0E17</div>

    <div class="w50-payer">\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 ${mt.map(([T,R])=>`<span>${Ge(e.pay_method===T)} ${r(R)}${T==="OTHER"&&e.pay_method==="OTHER"&&e.pay_method_other?" "+r(e.pay_method_other):""}</span>`).join("")}</div>

    
    <section class="w50-bot">
      <div class="w50-warn"><b>\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19</b> \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
        \u0E1D\u0E48\u0E32\u0E1D\u0E37\u0E19\u0E44\u0E21\u0E48\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 50 \u0E17\u0E27\u0E34 \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23 \u0E15\u0E49\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E42\u0E17\u0E29\u0E17\u0E32\u0E07\u0E2D\u0E32\u0E0D\u0E32\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 35
        \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23</div>
      <div class="w50-sign">
        <div class="w50-cert">\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E25\u0E30\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E14\u0E31\u0E07\u0E01\u0E25\u0E48\u0E32\u0E27\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E23</div>
        <div class="w50-sign-r">
          <div class="w50-sg">\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D <span class="w50-dot"></span> \u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</div>
          <div class="w50-sn">( ${q(e.signer_name,"")} )</div>
          <div class="w50-sd">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 <b>${V(e.document_date)}</b>
            \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2F</div>
        </div>
        <div class="w50-seal">\u0E1B\u0E23\u0E30\u0E17\u0E31\u0E1A\u0E15\u0E23\u0E32<br>\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25<br>(\u0E16\u0E49\u0E32\u0E21\u0E35)</div>
      </div>
    </section>

    <div class="w50-note"><b>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</b> \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)* \u0E2B\u0E21\u0E32\u0E22\u0E16\u0E36\u0E07
      1. \u0E01\u0E23\u0E13\u0E35\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E18\u0E23\u0E23\u0E21\u0E14\u0E32\u0E44\u0E17\u0E22 \u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E02\u0E2D\u0E07\u0E01\u0E23\u0E21\u0E01\u0E32\u0E23\u0E1B\u0E01\u0E04\u0E23\u0E2D\u0E07
      2. \u0E01\u0E23\u0E13\u0E35\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E02\u0E2D\u0E07\u0E01\u0E23\u0E21\u0E1E\u0E31\u0E12\u0E19\u0E32\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E01\u0E32\u0E23\u0E04\u0E49\u0E32
      3. \u0E01\u0E23\u0E13\u0E35\u0E2D\u0E37\u0E48\u0E19 \u0E46 \u0E19\u0E2D\u0E01\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E08\u0E32\u0E01 1. \u0E41\u0E25\u0E30 2. \u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)
      \u0E02\u0E2D\u0E07\u0E01\u0E23\u0E21\u0E2A\u0E23\u0E23\u0E1E\u0E32\u0E01\u0E23</div>
  </div>`}var _t=[{copy:"original",copyLabel:""},{copy:"copy",copyLabel:""},{copy:"original",copyLabel:"\u0E2A\u0E33\u0E40\u0E19\u0E32 1"},{copy:"copy",copyLabel:"\u0E2A\u0E33\u0E40\u0E19\u0E32 2"}];function ja(e){return`<div class="w50-pages">${_t.map((s,o)=>`<div class="w50-page" data-print-page="${o+1}">${na(e,s)}</div>`).join("")}</div>`}var Xt="nj-print-w50";function sa(e,s){let o=e&&e.querySelector(".w50-pages");o&&o.setAttribute("data-print-only",String(s));let c=document.body;c.classList.add(Xt);let a=()=>{c.classList.remove(Xt),o&&o.removeAttribute("data-print-only")};window.addEventListener("afterprint",a,{once:!0});try{let l=window.matchMedia("print"),b=h=>{h.matches||(a(),l.removeEventListener("change",b))};l.addEventListener("change",b)}catch{}window.print(),setTimeout(()=>{try{(!window.matchMedia||!window.matchMedia("print").matches)&&a()}catch{a()}},0)}function Zt(e,s){sa(e,s)}function ea(e){sa(e,"all")}function za(e,{copy:s="original"}={}){if(String(e.direction||"").toUpperCase()==="ACTING_AGENT")return na(e,{copy:s});let o=e.items||[],c=ta(o),a=e.payer||e.payee||{},l={name:e.payer_name||a.name,tax_id:e.payer_tax_id||a.tax_id,branch_code:e.payer_branch||a.branch_code,address:e.payer_address||a.address,phone:a.phone},b=String(e.direction||"").toUpperCase()==="ACTING_AGENT",y=!!String(e.payee_name||"").trim()?{name:e.payee_name,tax_id:e.payee_tax_id,branch_code:e.payee_branch||"\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48",address:e.payee_address,tel:""}:{name:G.nameEn,tax_id:G.taxId,branch_code:"\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48",address:G.address,tel:G.tel+" | "+G.fax},k=(e.has_acting_agent===!0||e.has_acting_agent===!1?e.has_acting_agent:!!String(e.agent_name||"").trim())?String(e.agent_name||"").trim():"",w=e.invoice||{},v=String(e.status||"").toUpperCase(),M=v==="VOID",H=String(e.reference_no||"").trim(),T=v==="DRAFT"&&!H,R=String(e.certificate_no||"").trim()||null,ae=String(e.document_no||""),Y=(/^WHTDRAFT-/.test(ae)?null:ae||null)||H||null,qe=ut.find(W=>W.key===s)||ut[0],Pe=o.length?o.map((W,de)=>`<tr>
        <td class="whd-c whd-dim">${W.line_no??de+1}</td>
        <td class="whd-c">${r(Bt(W.pay_date,e.pay_date))}</td>
        <td class="whd-ds">
          <div class="whd-ds-t">${r(qa(W.income_type))}</div>
          ${W.description?`<div class="whd-ds-s">${r(W.description)}</div>`:""}
        </td>
        <td class="whd-r">${z(W.tax_base)}</td>
        <td class="whd-c">${r(Ia(W.rate))}</td>
        <td class="whd-r whd-tax">${z(W.amount)}</td>
      </tr>`).join(""):'<tr><td colspan="6" class="whd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>',Ze=w.invoice_no?r(w.invoice_no):e.reference_no?r(e.reference_no):"-";return`
    <div class="whd print-area${M?" whd-void":""}${T?" whd-draft":""}">
      ${M?'<div class="whd-badge whd-badge-v">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>':""}
      ${T?'<div class="whd-badge whd-badge-d">DRAFT / \u0E23\u0E48\u0E32\u0E07 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</div>':""}
      
      ${T?'<div class="whd-wm whd-wm-d">DRAFT</div>':""}
      ${M?'<div class="whd-wm whd-wm-v">VOID</div>':""}

      <div class="whd-copy">
        <b>${b?"\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 50 \u0E17\u0E27\u0E34 \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23":"\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E22\u0E43\u0E19 \u2014 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"}</b>
        <span>${r(qe.label)}</span>
      </div>

      <header class="whd-head">
        <img class="whd-logo" src="${G.logo}" alt="N.J. Logistics">
        <div class="whd-head-t">
          <div class="whd-t1">${b?"\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19)":"\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A"}</div>
          <div class="whd-t2">\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 50 \u0E17\u0E27\u0E34 \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23${b?"":" \u2014 \u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E22\u0E43\u0E19"}</div>
          <div class="whd-t3">${b?"WITHHOLDING TAX CERTIFICATE":"RECEIVED WITHHOLDING TAX CERTIFICATE \u2014 INTERNAL RECORD"}</div>
        </div>
        <div class="whd-head-r">
          <div class="whd-nolbl">\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48${e.book_no?"":" / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"}</div>
          <div class="whd-no">${e.book_no?r(e.book_no)+' <span class="whd-dim">/</span> '+(R?r(R):'<span class="whd-pend">\u2014</span>'):R?r(R):'<span class="whd-pend">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E25\u0E02\u0E08\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35</span>'}</div>
          <div class="whd-dtlbl">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</div>
          <div class="whd-dt">${V(e.document_date)}</div>
          ${e.ref_date?`<div class="whd-intlbl">Ref. Date</div>
          <div class="whd-int">${V(e.ref_date)}</div>`:""}
          ${e.job_no?`<div class="whd-intlbl">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</div>
          <div class="whd-int">${r(e.job_no)}</div>`:""}
          ${Y?`<div class="whd-intlbl">\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19</div>
          <div class="whd-int">${r(Y)}</div>`:""}
        </div>
      </header>
      <div class="whd-band"></div>

      <section class="whd-party">
        <div class="whd-box">
          <div class="whd-box-t">${lt("payer")}<span>\u0E01. \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>\u0E0A\u0E37\u0E48\u0E2D</label><div class="whd-v whd-v-b">${q(l.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
                <div class="whd-v whd-v-tax">${q(l.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>\u0E2A\u0E32\u0E02\u0E32</label>
                <div class="whd-v">${q(l.branch_code)}</div></div>
            </div>
            <div class="whd-f"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <div class="whd-v whd-v-ml">${Gt(l.address)}</div></div>
            <div class="whd-f whd-f-last"><label>\u0E42\u0E17\u0E23.</label>
              <div class="whd-v">${q(l.phone)}</div></div>
          </div>
        </div>

        <div class="whd-box">
          <div class="whd-box-t">${lt("payee")}<span>\u0E02. \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>\u0E0A\u0E37\u0E48\u0E2D</label><div class="whd-v whd-v-b">${q(y.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
                <div class="whd-v whd-v-tax">${q(y.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>\u0E2A\u0E32\u0E02\u0E32</label>
                <div class="whd-v">${q(y.branch_code)}</div></div>
            </div>
            <div class="whd-f${y.tel?"":" whd-f-last"}"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <div class="whd-v whd-v-ml">${Gt(y.address)}</div></div>
            ${y.tel?`<div class="whd-f whd-f-last"><label>\u0E42\u0E17\u0E23. / \u0E42\u0E17\u0E23\u0E2A\u0E32\u0E23</label>
              <div class="whd-v">${r(y.tel)}</div></div>`:""}
          </div>
        </div>
      </section>

      ${k?`<section class="whd-agent">
        <div class="whd-agent-t">\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19\u0E42\u0E14\u0E22</div>
        <div class="whd-agent-b">
          <div class="whd-agent-c"><label>\u0E0A\u0E37\u0E48\u0E2D</label><span class="whd-b">${r(k)}</span></div>
          <div class="whd-agent-c"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
            <span>${q(e.agent_tax_id)}</span></div>
          <div class="whd-agent-c"><label>\u0E2A\u0E32\u0E02\u0E32</label><span>${q(e.agent_branch)}</span></div>
          <div class="whd-agent-c whd-agent-w"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
            <span>${q(e.agent_address)}</span></div>
        </div>
      </section>`:""}

      <section class="whd-ref">
        <div class="whd-ref-c"><label>\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</label>
          <span class="whd-ref-v">${Ze}</span></div>
        <div class="whd-ref-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</label>
          <span class="whd-ref-v">${r(Bt(null,e.pay_date))}</span></div>
        ${w.invoice_date?`<div class="whd-ref-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</label>
          <span class="whd-ref-v">${V(w.invoice_date)}</span></div>`:""}
      </section>

      <section class="whd-sec">
        <div class="whd-sec-t">\u0E04. \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E30\u0E08\u0E33\u0E19\u0E27\u0E19\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07</div>
        <table class="whd-tbl">
          <colgroup><col class="w-no"><col class="w-dt"><col class="w-ds">
            <col class="w-base"><col class="w-rate"><col class="w-tax"></colgroup>
          <thead><tr>
            <th class="whd-c">\u0E25\u0E33\u0E14\u0E31\u0E1A</th>
            <th class="whd-c">\u0E27\u0E31\u0E19 \u0E40\u0E14\u0E37\u0E2D\u0E19<br>\u0E1B\u0E35\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
            <th class="whd-c">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E1E\u0E36\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
            <th class="whd-c">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22<br>(\u0E1A\u0E32\u0E17)</th>
            <th class="whd-c">\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35<br>\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01</th>
            <th class="whd-c">\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E44\u0E27\u0E49<br>(\u0E1A\u0E32\u0E17)</th>
          </tr></thead>
          <tbody>${Pe}</tbody>
          <tfoot><tr class="whd-sumrow">
            <td colspan="3" class="whd-r">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07</td>
            <td class="whd-r whd-b">${z(c.base)}</td>
            <td></td>
            <td class="whd-r whd-total">${z(c.tax)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="whd-words">
        ${lt("abc")}
        <div class="whd-words-b">
          <div class="whd-words-t">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07 (\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23)</div>
          <div class="whd-words-v">( ${r(ke(c.tax))} )</div>
        </div>
      </section>

      ${b?`<section class="whd-form whd-form-official">
        
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E20\u0E32\u0E29\u0E35\u0E15\u0E32\u0E21\u0E41\u0E1A\u0E1A</div>
          <div class="whd-cbs">${wt.map(([W,de])=>`<span class="whd-cb${e.form_type===W?" on":""}">${e.form_type===W?"\u2612":"\u2610"} ${r(de)}</span>`).join("")}</div>
          <div class="whd-form-s">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48 ${e.form_seq?r(e.form_seq):'<span class="whd-dot">.........</span>'} \u0E43\u0E19\u0E41\u0E1A\u0E1A\u0E22\u0E37\u0E48\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</div>
        </div>
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</div>
          <div class="whd-cbs">${mt.map(([W,de])=>`<span class="whd-cb${e.pay_method===W?" on":""}">${e.pay_method===W?"\u2612":"\u2610"} ${r(de)}${W==="OTHER"&&e.pay_method==="OTHER"&&e.pay_method_other?" "+r(e.pay_method_other):""}</span>`).join("")}</div>
        </div>
      </section>`:e.form_type||e.pay_method?`<section class="whd-form">
        <div class="whd-form-c">
          <div class="whd-form-t">\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E20\u0E32\u0E29\u0E35\u0E15\u0E32\u0E21\u0E41\u0E1A\u0E1A</div>
          <div class="whd-form-v">${Je(Yt,e.form_type)?r(Je(Yt,e.form_type)):'<span class="whd-pend">\u2014</span>'}
            ${e.form_seq?`<span class="whd-form-s">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48 ${r(e.form_seq)}</span>`:""}</div>
        </div>
        <div class="whd-form-c">
          <div class="whd-form-t">\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35</div>
          <div class="whd-form-v">${Je(Kt,e.pay_method)?r(Je(Kt,e.pay_method)):'<span class="whd-pend">\u2014</span>'}
            ${e.pay_method_other?`<span class="whd-form-s">${r(e.pay_method_other)}</span>`:""}</div>
        </div>
      </section>`:""}

      ${e.note?`<section class="whd-note">
        <div class="whd-note-t">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 / \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E37\u0E48\u0E19 \u0E46</div>
        <div class="whd-note-v">${r(e.note)}</div>
      </section>`:""}

      ${b?`<section class="whd-declare">
        <div class="whd-dec-t">\u0E04\u0E33\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</div>
        <p>\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E25\u0E30\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E14\u0E31\u0E07\u0E01\u0E25\u0E48\u0E32\u0E27\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E23</p>
        <div class="whd-sign">
          <div class="whd-sign-l">
            <div class="whd-sign-line"></div>
            <div class="whd-sign-lb">\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D \u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</div>
            <div class="whd-sign-nm">( ${q(e.signer_name,"&nbsp;")} )</div>
            <div class="whd-sign-ps">\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 ${q(e.signer_position,"&nbsp;")}</div>
          </div>
          <div class="whd-sign-r">
            <div class="whd-sign-lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</div>
            <div class="whd-sign-dt">${V(e.document_date)}</div>
          </div>
        </div>
      </section>`:`<section class="whd-declare">
        <div class="whd-dec-t">\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</div>
        <p>\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
           \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E25\u0E07\u0E19\u0E32\u0E21\u0E42\u0E14\u0E22\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19) \u0E15\u0E32\u0E21\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E19\u0E2A\u0E48\u0E27\u0E19 \u0E01.
           \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E20\u0E32\u0E22\u0E43\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19
           <b>\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E41\u0E17\u0E19\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</b></p>
        <div class="whd-rec">
          <div class="whd-rec-c"><label>\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 / \u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21</label>
            <span>${q(e.signer_name||l.name)}</span></div>
          <div class="whd-rec-c"><label>\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07</label>
            <span>${q(e.signer_position)}</span></div>
          <div class="whd-rec-c"><label>\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</label>
            <span>${q(e.created_by_name)}</span></div>
          <div class="whd-rec-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</label>
            <span>${V(e.document_date)}</span></div>
        </div>
      </section>`}

      <div class="whd-edge"></div>
    </div>`}function Be(e,{print:s=!1}={}){let o=String(e.direction||"").toUpperCase()==="ACTING_AGENT",c=document.createElement("div"),a=w=>{c.innerHTML=za(e,{copy:w})};o?c.innerHTML=ja(e):a("original");let l=document.createElement("div");l.innerHTML=`<div class="mf-left">
      ${o?`<div class="w50-pbar">
            <span class="t-xs t-3 w50-pbar-l">\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E44\u0E14\u0E49 4 \u0E2B\u0E19\u0E49\u0E32 \u2014 \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 1 \xB7 \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 2 \xB7 \u0E2A\u0E33\u0E40\u0E19\u0E32 1 \xB7 \u0E2A\u0E33\u0E40\u0E19\u0E32 2</span>
            ${_t.map((w,v)=>`<button class="btn btn-o btn-sm w50-pb" data-w50-page="${v+1}">\u{1F5A8} \u0E2B\u0E19\u0E49\u0E32 ${v+1}</button>`).join("")}
            <select class="sel w50-psel" id="w50-psel" aria-label="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E21\u0E1E\u0E4C">
              ${_t.map((w,v)=>`<option value="${v+1}">\u0E2B\u0E19\u0E49\u0E32 ${v+1}</option>`).join("")}
              <option value="all">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
            </select>
            <button class="btn btn-o btn-sm w50-pgo" id="w50-pgo">\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          </div>`:`<select class="sel" id="whd-copy">${ut.map((w,v)=>`<option value="${w.key}" ${v===0?"selected":""}>${r(w.label)}</option>`).join("")}</select>`}
    </div><div class="mf-right">
      <button class="btn btn-print" id="whd-print">\u{1F5A8} Print / Save PDF${o?" \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14":""}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;let b=String(e.reference_no||"").trim(),h=String(e.certificate_no||e.document_no||""),y=b||(/^WHTDRAFT-/.test(h)||String(e.status).toUpperCase()==="DRAFT"?"(\u0E23\u0E48\u0E32\u0E07)":h);fe({title:"\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A "+y,body:c,footer:l,fullscreen:!0,wide:!0});let _=l.querySelector("#whd-copy");_&&(_.onchange=w=>a(w.target.value));let k=()=>o?ea(c):window.print();if(l.querySelector("#whd-print").onclick=k,o){l.querySelectorAll("[data-w50-page]").forEach(M=>{M.onclick=()=>Zt(c,Number(M.dataset.w50Page))});let w=l.querySelector("#w50-pgo"),v=l.querySelector("#w50-psel");w&&v&&(w.onclick=()=>v.value==="all"?ea(c):Zt(c,Number(v.value)))}s&&setTimeout(k,60)}var Va="sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql",Fa=[{k:"ACTING_AGENT",lb:"\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19"},{k:"NON_ACTING",lb:"\u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23"},{k:"NJ_TRANS",lb:"NJ TRANS"}],P={customer:"",from:"",to:"",page:1,size:20,mode:"ACTING_AGENT"},B={q:"",page:1,size:10},t=null,L=e=>{let s=Number(e);return Number.isFinite(s)?s:0},la=e=>{let s=L(e);return(Number.isInteger(s)?String(s):String(Z(s)))+"%"},pa=[["M40_1","1. \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07 \u0E2F\u0E25\u0E2F (\u0E21.40(1))"],["M40_2","2. \u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21 \u0E04\u0E48\u0E32\u0E19\u0E32\u0E22\u0E2B\u0E19\u0E49\u0E32 \u0E2F\u0E25\u0E2F (\u0E21.40(2))"],["M40_3","3. \u0E04\u0E48\u0E32\u0E41\u0E2B\u0E48\u0E07\u0E25\u0E34\u0E02\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u0E2F\u0E25\u0E2F (\u0E21.40(3))"],["M40_4A","4.(\u0E01) \u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22 \u0E2F\u0E25\u0E2F (\u0E21.40(4)(\u0E01))"],["M40_4B","4.(\u0E02) \u0E40\u0E07\u0E34\u0E19\u0E1B\u0E31\u0E19\u0E1C\u0E25 \u0E40\u0E07\u0E34\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E1A\u0E48\u0E07\u0E01\u0E33\u0E44\u0E23 \u0E2F\u0E25\u0E2F (\u0E21.40(4)(\u0E02))"],["SEC3TER","5. \u0E2B\u0E31\u0E01\u0E15\u0E32\u0E21\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E01\u0E23\u0E21\u0E2A\u0E23\u0E23\u0E1E\u0E32\u0E01\u0E23 (\u0E21.3 \u0E40\u0E15\u0E23\u0E2A)"],["OTHER","6. \u0E2D\u0E37\u0E48\u0E19 \u0E46"]],Jn=Object.fromEntries(pa),Ye=e=>["SERVICE","TRANSPORT","RENT"].includes(String(e||"").toUpperCase())?"SEC3TER":"",Ja=e=>'<option value="">\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14 \u2014</option>'+pa.map(([s,o])=>`<option value="${s}" ${e===s?"selected":""}>${r(o)}</option>`).join(""),ha=[["SERVICE","\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E33\u0E02\u0E2D\u0E07"],["TRANSPORT","\u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07"],["RENT","\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32"],["OTHER","\u0E2D\u0E37\u0E48\u0E19 \u0E46"]],Ga=e=>ha.map(([s,o])=>`<option value="${s}" ${s===e?"selected":""}>${r(o)}</option>`).join(""),bt={SERVICE:3,TRANSPORT:1,RENT:5},yt=e=>bt[String(e??"").toUpperCase()],Ba=e=>yt(e)!==void 0,ia=e=>Ba(e&&e.income_type)&&L(e.rate)===yt(e.income_type),ra=e=>String(e??"").trim().toLowerCase(),Ke=e=>String(e??"").replace(/[^0-9A-Za-z]/g,""),oa=e=>String(e??"").trim(),ua=(e,s)=>{let o=String(e||"").trim(),c=String(s||"").trim();return!o&&!c?"":" (CODE: "+(o||"-")+" | \u0E0A\u0E37\u0E48\u0E2D: "+(c||"-")+")"},De={NJACC_PARTY_CODE_DUPLICATE:["whp-nc","\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49 \u2014 CODE \u0E19\u0E35\u0E49\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 Master \u0E41\u0E25\u0E49\u0E27"],NJACC_PARTY_TAXBRANCH_DUPLICATE:["whp-nt","\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49 \u2014 \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E02\u0E32\u0E19\u0E35\u0E49\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 Master \u0E41\u0E25\u0E49\u0E27"],NJACC_PARTY_CITIZEN_DUPLICATE:["whp-ni","\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49 \u2014 \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E19\u0E35\u0E49\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 Master \u0E41\u0E25\u0E49\u0E27"]};function ca(e){let s=String(e&&(e.message||e.hint||e.details)||"");for(let o of Object.keys(De)){if(!s.includes(o))continue;let c=s.slice(s.indexOf(o)).split("|"),[a,l]=De[o];return{field:a,msg:l+ua(c[1],c[2])}}return s.includes("NJACC_PARTY_DUPLICATE_RACE")?{field:"whp-nc",msg:"\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49 \u2014 \u0E21\u0E35\u0E1C\u0E39\u0E49\u0E2D\u0E37\u0E48\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E43\u0E2B\u0E21\u0E48"}:null}var _a=[["PND1K","(1) \u0E20.\u0E07.\u0E14.1\u0E01"],["PND1K_SPECIAL","(2) \u0E20.\u0E07.\u0E14.1\u0E01 \u0E1E\u0E34\u0E40\u0E28\u0E29"],["PND2","(3) \u0E20.\u0E07.\u0E14.2"],["PND3","(4) \u0E20.\u0E07.\u0E14.3"],["PND2K","(5) \u0E20.\u0E07.\u0E14.2\u0E01"],["PND3K","(6) \u0E20.\u0E07.\u0E14.3\u0E01"],["PND53","(7) \u0E20.\u0E07.\u0E14.53"]],Ie="OTHER",Ya="PND53",Ka="WITHHOLD",wa=[["WITHHOLD","(1) \u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"],["FOREVER","(2) \u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E15\u0E25\u0E2D\u0E14\u0E44\u0E1B"],["ONCE","(3) \u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"],[Ie,"(4) \u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E23\u0E30\u0E1A\u0E38)"]];function Qa(e){let s=String(e&&e.agent_name||"").trim(),o=e?e.has_acting_agent:void 0;return o===!0?s:o===!1?"":s}var Xa=2,ve=[["\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07",!1,(e,s)=>s.certCell,"t-b"],["\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",!1,e=>V(e.document_date)],["\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",!1,e=>V(e.pay_date)],["Ref. Date",!1,e=>V(e.ref_date)],["Reference No.",!1,e=>r(e.reference_no||"-")],["\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48",!1,e=>r(e.book_no||"-")],["\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",!1,e=>r(e.job_no||"-")],["Invoice No.",!1,e=>r(e.invoice_no_text||e.invoice_no||"-"),"t-b"],["CODE \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!1,e=>r(e.payer_code||"-")],["\u0E01. \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!1,e=>r(e.payer_name||e.customer_name||"-"),"ellip"],["Tax ID \u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01",!1,e=>r(e.payer_tax_id||"-")],["\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!0,e=>r(e.payer_citizen_id||"-")],["\u0E2A\u0E32\u0E02\u0E32\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01",!1,e=>r(e.payer_branch||"-")],["\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01",!1,e=>r(e.payer_address||"-"),"ellip"],["CODE \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!1,e=>r(e.payee_code||"-")],["\u0E02. \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!1,e=>r(e.payee_name||"-"),"ellip"],["Tax ID \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01",!1,e=>r(e.payee_tax_id||"-")],["\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35",!0,e=>r(e.payee_citizen_id||"-")],["\u0E2A\u0E32\u0E02\u0E32\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01",!1,e=>r(e.payee_branch||"-")],["\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01",!1,e=>r(e.payee_address||"-"),"ellip"],["\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19\u0E42\u0E14\u0E22",!1,e=>r(Qa(e)||"-"),"ellip"],["Tax ID \u0E1C\u0E39\u0E49\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19",!1,e=>r(e.agent_tax_id||"-")],["\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49",!1,e=>r(Za[e.wht_type]||e.wht_type||"-")],["\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",!1,e=>z(e.tax_base),"r"],["\u0E2D\u0E31\u0E15\u0E23\u0E32",!1,e=>`<span class="wht-rate-chip">${r(la(e.rate))}</span>`,"center"],["\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01",!1,e=>z(e.amount),"r t-b"],["\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E19\u0E33\u0E2A\u0E48\u0E07",!1,e=>r(tn[e.form_type]||e.form_type||"-")],["\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E43\u0E19\u0E41\u0E1A\u0E1A",!1,e=>r(e.form_seq||"-")],["\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E20\u0E32\u0E29\u0E35",!1,e=>r(en[e.pay_method]||e.pay_method||"-")],["\u0E23\u0E30\u0E1A\u0E38 (\u0E2D\u0E37\u0E48\u0E19 \u0E46)",!1,e=>r(e.pay_method_other||"-")],["\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21",!1,e=>r(e.signer_name||"-")],["\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",!1,e=>r(e.signer_position||"-")],["\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 (\u0E2D\u0E37\u0E48\u0E19\u0E46)",!1,e=>r(e.payment_by||"-")],["\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",!1,e=>r(e.note||"-"),"ellip"],["\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19",!1,(e,s)=>s.internalNo],["\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",!1,e=>r(String(e.item_count==null?"-":e.item_count)),"center"],["\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",!0,e=>r(e.void_reason||"-"),"ellip"],["\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",!0,e=>r(e.voided_at?V(e.voided_at):"-")],["\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23",!1,(e,s)=>s.act,"center"]],Za=Object.fromEntries(ha),en=Object.fromEntries(wa.map(([e,s])=>[e,s.replace(/^\(\d+\)\s*/,"")])),tn=Object.fromEntries(_a.map(([e,s])=>[e,s.replace(/^\(\d+\)\s*/,"")])),da=(e,s,o)=>s.map(([c,a])=>`<label class="whp-rd"><input type="radio" name="${e}" value="${r(c)}"
     ${c===o?"checked":""}><span>${r(a)}</span></label>`).join(""),an={DRAFT:["bdg-due-ok","\u0E23\u0E48\u0E32\u0E07"],ISSUED:["bdg-issued","\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27"],VOID:["bdg-void","VOID"]},ma=e=>{let[s,o]=an[String(e||"").toUpperCase()]||["bdg-due-ok",e||"-"];return`<span class="bdg ${s}">${r(o)}</span>`};function Oe(e){e.innerHTML=`
    
    <div class="card card-pad whp-req">
      <h3 class="t-b">BACKEND REQUIRED \u2014 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</h3>
      <p class="t-2 mt-1">\u0E15\u0E23\u0E27\u0E08\u0E01\u0E31\u0E1A\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 50 \u0E17\u0E27\u0E34</p>
      <ul class="whp-req-l">
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07 <code>njacc_wht_items</code> \u2014 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E14\u0E49 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D 1 \u0E43\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19</li>
        <li>\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A <code>DRAFT</code> \u2014 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</li>
        <li><code>njacc_list_wht</code> \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E37\u0E19 \u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 / \u0E2A\u0E32\u0E02\u0E32 / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 \u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35 RPC \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE \u0E21\u0E32\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2D\u0E31\u0E15\u0E23\u0E32 WHT \u0E41\u0E25\u0E30\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C <code>certificate_no</code> \u2014 \u0E41\u0E22\u0E01\u0E40\u0E25\u0E02\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01
            \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</li>
        <li><code>njacc_create_wht</code> \u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E22\u0E34\u0E07\u0E15\u0E23\u0E07\u0E41\u0E25\u0E30\u0E21\u0E35 Default 3%</li>
      </ul>
      <p class="t-sm t-3 mt-2">\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E1A\u0E19 Supabase \u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07:</p>
      <p class="whp-req-f"><code>${r(Va)}</code></p>
      <p class="t-sm t-3 mt-2">\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E19 \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34
        \u2014 \u0E44\u0E1F\u0E25\u0E4C SQL \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 INVOICE / RECEIPT / CREDIT NOTE / \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E14\u0E34\u0E21</p>
    </div>`}async function Gn(e){t=null,await Ve(),await we(e)}var ft=100,nn="\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C Excel \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",Qe=e=>new Error(nn+" ("+e+")");async function sn(e={}){let s=[],o=new Set,c=null,a=1;for(;;){let l=await it({p_customer:e.customer||null,p_from:e.from||null,p_to:e.to||null,p_page:a,p_size:ft,p_direction:e.direction||ue,p_mode:e.mode||null}),b=l&&l.rows||[],h=Number(l&&l.total||0);if(c===null)c=h;else if(h!==c)throw Qe("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 "+c+" -> "+h);if(!b.length)break;let y=String(b[0]&&b[0].id||"#"+a);if(o.has(y))throw Qe("\u0E2B\u0E19\u0E49\u0E32 "+a+" \u0E04\u0E37\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E34\u0E21");if(o.add(y),s.push(...b),c&&s.length>=c||b.length<ft)break;if(a++,c){let _=Math.ceil(c/ft)+2;if(a>_)throw Qe("\u0E14\u0E36\u0E07\u0E40\u0E01\u0E34\u0E19 "+_+" \u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A")}}if(c!==null&&s.length!==c)throw Qe("\u0E44\u0E14\u0E49 "+s.length+" \u0E08\u0E32\u0E01 "+c+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");return s}function fa(e){let s=String(e.status||"").toUpperCase(),o=String(e.document_no||""),c=s==="DRAFT"||/^WHTDRAFT-/.test(o),a=s==="VOID",l=String(e.certificate_no||"").trim();return{certCell:l?r(l):'<span class="t-3">-</span>',internalNo:!c&&o?r(o):'<span class="t-3">-</span>',badge:ma(s),act:`<div class="ch-act">
          
          ${String(e.reference_no||"").trim()&&(re()||pe("view"))?`<button class="btn btn-o btn-sm" data-print="${e.id}">\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>`:""}
          ${a?'<span class="bdg bdg-void">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E41\u0E25\u0E49\u0E27</span>':`${re()||pe("issue_receipt")?`<button class="btn btn-o btn-sm" data-edit="${e.id}">\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02</button>`:""}
               ${re()||pe("void")?`<button class="btn btn-danger btn-sm" data-cancel="${e.id}"
                      data-ref="${r(e.reference_no||"")}">\u{1F6AB} \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>`:""}`}
        </div>`}}var rn=e=>{let s=fa(e);return ve.map(([,,o])=>o(e,s))};async function we(e){let s=re()||pe("issue_receipt");e.innerHTML=`
    
    
    <div class="rep-tabs" id="wh-tabs">
      ${Fa.map(h=>`<button class="rep-tab${P.mode===h.k?" active":""}"
        data-wmode="${h.k}">${h.lb}</button>`).join("")}
    </div>
    <div class="fbar">
      <select class="sel" data-f="customer">${Wt(P.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${P.from}">
      <input class="inp" type="date" data-f="to" value="${P.to}">
      <button class="btn btn-o btn-sm" id="wh-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      ${pe("export")||re()?'<button class="btn btn-o btn-sm" id="wh-xls">\u{1F4D7} Export Excel</button>':""}
      </div>
    
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      
      ${ve.map(([h,y,,_],k)=>`<th${_?` class="${_.replace("ellip","")}"`.replace(' class=""',""):""}${k<Xa?' data-col-req="1"':""}${y?' data-col-default="hidden"':""}>${r(h)}</th>`).join("")}
    </tr></thead><tbody id="wh-tbody">
      <tr><td colspan="${ve.length}" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="wh-pgn"></div>`;let o=e.querySelector("#wh-xls");o&&(o.onclick=h=>Jt({table:e.querySelector("#wh-tbody")&&e.querySelector("#wh-tbody").closest("table"),modeKey:"REPORT_WHT",filters:{from:P.from||null,to:P.to||null,customer:P.customer||null,direction:ue,mode:P.mode},fetchAll:sn,rowValues:rn},h.target)),e.querySelector("#wh-go").onclick=()=>{e.querySelectorAll("[data-f]").forEach(h=>{P[h.dataset.f]=h.value}),P.page=1,b()};let c=e.querySelector("#wh-tabs");c&&c.addEventListener("click",h=>{let y=h.target.closest("[data-wmode]");!y||y.dataset.wmode===P.mode||(P.mode=y.dataset.wmode,P.page=1,c.querySelectorAll("[data-wmode]").forEach(_=>_.classList.toggle("active",_.dataset.wmode===P.mode)),b())}),e.querySelector("#wh-tbody").addEventListener("click",h=>on(h,e,b));function a(){let h=e.querySelector(".fbar");if(Ht({table:e.querySelector("#wh-tbody")&&e.querySelector("#wh-tbody").closest("table"),modeKey:"REPORT_WHT",host:h}),h&&s&&!h.querySelector("#wh-new")){h.insertAdjacentHTML("beforeend",'<button class="btn btn-p btn-sm" id="wh-new">\uFF0B \u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48</button>');let y=h.querySelector("#wh-new");y&&(y.onclick=()=>xe(e,{mode:P.mode}))}}a();let l=!1;Ot(e.querySelector("#wh-tbody"),h=>{let y=h.dataset.whtid;y&&(l||(l=!0,Promise.resolve(xe(e,{whtId:y})).finally(()=>{l=!1})))});async function b(){let h=Te("wht"),y=e.querySelector("#wh-tbody");if(y)try{let _=await it({p_customer:P.customer||null,p_from:P.from||null,p_to:P.to||null,p_page:P.page,p_size:P.size,p_direction:ue,p_mode:P.mode});if(!ie("wht",h))return;let k=_.rows||[];if(k.length&&k[0].item_count===void 0){Oe(e);return}y.innerHTML=k.length?k.map(w=>{let v=fa(w);return`<tr data-whtid="${r(w.id)}">${ve.map(([,,M,H])=>`<td${H?` class="${H}"`:""}${(H||"").includes("ellip")?' style="max-width:190px"':""}>${M(w,v)}</td>`).join("")}</tr>`}).join(""):`<tr><td colspan="${ve.length}" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</td></tr>`,st(e.querySelector("#wh-pgn"),{page:P.page,size:P.size,total:_.total||0},({page:w,size:v})=>{P.page=w,P.size=v,b()}),a()}catch(_){if(!ie("wht",h))return;if(Ne(_)){Oe(e);return}y.innerHTML=`<tr><td colspan="${ve.length}" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>`,oe(_)}}await b()}async function on(e,s,o){let c=e.target.closest("[data-doc]");if(c){try{Be(await Ae(c.dataset.doc))}catch(w){Ne(w)?Oe(s):f(J(w),"err")}return}let a=e.target.closest("[data-edit]");if(a){xe(s,{whtId:a.dataset.edit});return}let l=e.target.closest("[data-print]");if(l){try{Be(await Ae(l.dataset.print))}catch(w){f(J(w),"err")}return}let b=e.target.closest("[data-post]");if(b){if(!await at("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 POST \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22?","\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E44\u0E27\u0E49<br>\u0E2B\u0E25\u0E31\u0E07 POST \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14 <b>\u21A9 UNPOST</b> \u0E01\u0E48\u0E2D\u0E19<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46","POST"))return;try{let w=await ee("post-wht-"+b.dataset.post,()=>Vt(b.dataset.post,ze()));w&&f("POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19 "+(w.document_no||"")+(w.reference_no?" \xB7 Reference No. "+w.reference_no:""),"ok"),o()}catch(w){f(J(w),"err")}return}let h=e.target.closest("[data-unpost]");if(h){let w=await be("UNPOST \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02 (\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49 \xB7 POST \u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E08\u0E30\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21)");if(!w)return;try{let v=await ee("unpost-wht-"+h.dataset.unpost,()=>dt(h.dataset.unpost,w));f("UNPOST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07 \u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21 "+(v&&v.document_no||""),"ok"),o()}catch(v){f(J(v),"err")}return}let y=e.target.closest("[data-cancel]");if(y){let w=y.dataset.cancel,v=y.dataset.ref||"",M=document.createElement("div");M.innerHTML=`
      <p class="t-sm">\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
        ${v?"<b>Reference No. "+r(v)+"</b>":"\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49"} \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?</p>
      <p class="t-xs t-3">\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E08\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E40\u0E14\u0E34\u0E21\u0E44\u0E27\u0E49 \u2014 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</p>
      <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 / \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 <span class="req">*</span></label>
        <textarea class="inp w100" id="wh-cxr" rows="3"
          placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49"></textarea></div>`;let H=document.createElement("div");H.innerHTML=`<div class="mf-right">
        <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
        <button class="btn btn-danger" id="wh-cxok">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button></div>`,fe({title:"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",body:M,footer:H}),H.querySelector("#wh-cxok").onclick=async T=>{Fe(M);let R=(M.querySelector("#wh-cxr").value||"").trim();if(!R){he(M.querySelector("#wh-cxr"),"\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"),f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01","err");return}Ce(T.target,!0);try{await ee("cancel-wht-"+w,()=>rt(w,R,ze())),We(),f("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27","ok"),o()}catch(ae){f(J(ae),"err"),Ce(T.target,!1)}};return}let _=e.target.closest("[data-del]");if(_){let w=await be("\u0E25\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E23\u0E34\u0E07)");if(!w)return;try{await ee("del-wht-"+_.dataset.del,()=>ct(_.dataset.del,w)),f("\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27","ok"),o()}catch(v){f(J(v),"err")}return}let k=e.target.closest("[data-void]");if(k){let w=await be("Void \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 "+k.dataset.no);if(!w)return;try{await ee("void-wht-"+k.dataset.void,()=>rt(k.dataset.void,w,ze())),f("Void \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27","ok"),o()}catch(v){oe(v)}}}async function cn(e){B.page=1,e.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 INVOICE</h2></div>
      <button class="btn btn-o" id="wh-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E15\u0E34\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \xB7 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E2D\u0E31\u0E15\u0E23\u0E32 WHT \u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34
        \xB7 \u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E0A\u0E48\u0E27\u0E22\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E01\u0E47\u0E44\u0E14\u0E49</p>
      <div class="fbar mt-2">
        <input class="inp" id="wh-pq" value="${r(B.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
        <button class="btn btn-o btn-sm" id="wh-pgo">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        <button class="btn btn-o btn-sm" id="wh-skip">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th>\u0E2D\u0E31\u0E15\u0E23\u0E32 WHT</th><th class="r">WHT</th>
        <th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
      </tr></thead><tbody id="wh-ptb">
        <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="wh-ppgn"></div>
    </div>`,e.querySelector("#wh-back").onclick=()=>we(e),e.querySelector("#wh-skip").onclick=()=>xe(e,{});let s=e.querySelector("#wh-pq");e.querySelector("#wh-pgo").onclick=()=>{B.q=s.value.trim(),B.page=1,o()},s.addEventListener("input",()=>Ue("wh-pick",()=>{B.q=s.value.trim(),B.page=1,o()},350)),e.querySelector("#wh-ptb").addEventListener("click",c=>{let a=c.target.closest("[data-pick]");a&&xe(e,{invoice:JSON.parse(a.dataset.pick)})});async function o(){let c=Te("wh-pick"),a=e.querySelector("#wh-ptb");if(a)try{let l=await jt({q:B.q||null,page:B.page,size:B.size});if(!ie("wh-pick",c))return;let b=l.rows||[];a.innerHTML=b.length?b.map(h=>{let y=h.wht_breakdown||[],_=y.length?y.map(k=>la(k.rate)).join(" + "):"-";return`<tr>
        <td class="t-b">${r(h.invoice_no||"-")}</td>
        <td>${V(h.invoice_date)}</td>
        <td class="ellip" style="max-width:190px">${r(h.customer_name||"-")}</td>
        <td>${r(h.charge_type||"-")}</td>
        <td class="r">${z(h.total_amount)}</td>
        <td class="center">${r(_)}</td>
        <td>${h.payment_date?V(h.payment_date):(h.payments||[]).length>1?'<span class="t-3">'+(h.payments||[]).length+" \u0E04\u0E23\u0E31\u0E49\u0E07 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2D\u0E07</span>":'<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-p btn-sm" data-pick='${JSON.stringify(h).replace(/'/g,"&#39;")}'>\u0E40\u0E25\u0E37\u0E2D\u0E01</button>
        </div></td></tr>`}).join(""):'<tr><td colspan="9" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u2014 \u0E01\u0E14 \u201C\u0E02\u0E49\u0E32\u0E21\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49</td></tr>',st(e.querySelector("#wh-ppgn"),{page:B.page,size:B.size,total:l.total||0},({page:h,size:y})=>{B.page=h,B.size=y,o()})}catch(l){if(!ie("wh-pick",c))return;if(Ne(l)){Oe(e);return}a.innerHTML='<tr><td colspan="9" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>',f(J(l),"err")}}await o()}function dn(e){if(!t)return;let s=nt().find(c=>c.id===t.customer_id)||null;if(!s)return;let o=(c,a)=>{(e||!t[c])&&(t[c]=a||"")};o("payer_name",s.customer_name),o("payer_tax_id",s.tax_id),o("payer_branch",s.branch_code),o("payer_address",s.address)}async function xe(e,{whtId:s=null,invoice:o=null,mode:c=null}={}){e.innerHTML='<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';let a=null;if(s)try{a=await Ae(s)}catch(n){if(Ne(n)){Oe(e);return}return f(J(n),"err"),we(e)}let l=Dt(new Date),b=String(a&&a.status||"DRAFT").toUpperCase(),h=b==="ISSUED",y=b==="VOID",_=h||y;if(t={whtId:s||null,wht_mode:a&&a.wht_mode||c||"ACTING_AGENT",direction:a&&a.direction?String(a.direction).toUpperCase():ue,status:b,customer_id:a?a.customer_id:o?o.customer_id:"",invoice_id:a?a.invoice_id||null:o?o.id:null,invoice_no:a?a.invoice&&a.invoice.invoice_no:o?o.invoice_no:null,document_date:a?a.document_date:l,pay_date:a?a.pay_date||"":o&&o.payment_date||"",payments:o?o.payments||[]:[],certificate_no:a&&a.certificate_no||"",reference_no:a&&a.reference_no||"",has_ref:!!(a&&[a.reference_no,a.ref_date].some(n=>String(n??"").trim())),note:a&&a.note||"",book_no:a&&a.book_no||"",invoice_no_text:a?a.invoice_no_text||"":o&&o.invoice_no||"",payee_code:a&&a.payee_code||"",payment_by:a&&a.payment_by||"",has_fund:a?a.has_fund===!0||a.has_fund===!1?a.has_fund:[a.gpf_amount,a.social_security_amount,a.provident_fund_amount].some(n=>n!=null&&Number(n)!==0):!1,gpf_amount:a?a.gpf_amount==null?"":String(a.gpf_amount):"",social_security_amount:a?a.social_security_amount==null?"":String(a.social_security_amount):"",provident_fund_amount:a?a.provident_fund_amount==null?"":String(a.provident_fund_amount):"",ref_date:a&&a.ref_date||"",job_no:a&&a.job_no||"",doc_code:a&&a.doc_code||"",payer_code:a&&a.payer_code||"",payer_citizen_id:a&&a.payer_citizen_id||"",payer_name:a&&a.payer_name||"",payer_tax_id:a&&a.payer_tax_id||"",payer_branch:a&&a.payer_branch||"",payer_address:a&&a.payer_address||"",has_agent:a?a.has_acting_agent===!0||a.has_acting_agent===!1?a.has_acting_agent:!!String(a.agent_name||"").trim():!1,agent_name:a&&a.agent_name||"",agent_tax_id:a&&a.agent_tax_id||"",agent_branch:a&&a.agent_branch||"",agent_address:a&&a.agent_address||"",payee_customer_id:a&&a.payee_customer_id||"",payee_citizen_id:a&&a.payee_citizen_id||"",payee_name:a&&a.payee_name||"",payee_tax_id:a&&a.payee_tax_id||"",payee_branch:a&&a.payee_branch||"",payee_address:a&&a.payee_address||"",form_type:a?a.form_type||"":Ya,form_seq:a&&a.form_seq||"",pay_method:a?a.pay_method||"":Ka,pay_method_other:a&&a.pay_method_other||"",has_form:a?!!(String(a.form_type||"").trim()||String(a.form_seq||"").trim()):!1,has_pm:a?!!(String(a.pay_method||"").trim()||String(a.pay_method_other||"").trim()):!0,signer_name:a&&a.signer_name||"",signer_position:a&&a.signer_position||"",has_signer:!!(a&&[a.signer_name,a.signer_position,a.payment_by].some(n=>String(n??"").trim())),lines:[]},dn(!1),a&&(a.items||[]).length)t.lines=a.items.map(n=>({pay_date:n.pay_date||t.pay_date,income_type:String(n.income_type||"SERVICE").toUpperCase(),description:n.description||"",tax_base:L(n.tax_base),rate:L(n.rate),wht_income_category:n.wht_income_category||"",amount:L(n.amount)}));else if(o){let n=o.wht_breakdown||[],i=o.payment_date||"";t.lines=n.length?n.map(d=>({pay_date:i,income_type:String(o.charge_type||"").toUpperCase()==="ADVANCE"?"OTHER":"SERVICE",description:d.description||o.description||"",tax_base:L(d.tax_base),rate:L(d.rate),amount:Z(L(d.tax_base)*L(d.rate)/100),wht_income_category:Ye(String(o.charge_type||"").toUpperCase()==="ADVANCE"?"OTHER":"SERVICE")})):[{pay_date:i,income_type:"SERVICE",description:o.description||"",tax_base:L(o.subtotal),rate:0,amount:0,wht_income_category:Ye("SERVICE")}]}t.lines.length||(t.lines=[{pay_date:t.pay_date||"",income_type:"SERVICE",description:"",tax_base:0,rate:bt.SERVICE,amount:0,wht_income_category:Ye("SERVICE")}]),!a&&t.wht_mode==="ACTING_AGENT"&&(t.has_agent=!0),!a&&t.has_agent&&!["agent_name","agent_tax_id","agent_branch","agent_address"].some(n=>String(t[n]||"").trim())&&(t.agent_name=G.nameEn,t.agent_tax_id=G.taxId,t.agent_branch="00000",t.agent_address=G.address);let k=nt().find(n=>n.id===t.customer_id)||null;e.innerHTML=`
    <div class="card card-pad whp-form">

      <div class="whp-hd">
        <div class="whp-hd-l">
          <h2 class="whp-hd-t">\u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (50 \u0E17\u0E27\u0E34)</h2>
          <p class="whp-hd-s">${t.whtId?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07":"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"} \u2014 \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</p>
        </div>
        <div class="whp-hd-r">
          <span class="whp-hd-st">\u0E2A\u0E16\u0E32\u0E19\u0E30: ${ma(t.status)}</span>
          
          <button class="btn btn-o btn-sm" id="wh-frominv">\u{1F50E} \u0E14\u0E36\u0E07\u0E08\u0E32\u0E01 INVOICE</button>
          
          <button class="btn btn-o whp-x" id="wh-back"
            title="\u0E1B\u0E34\u0E14 / \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" aria-label="\u0E1B\u0E34\u0E14 / \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u2715</button>
        </div>
      </div>

      
      
      <label class="whp-refchk" for="wh-refbox-chk">
        <input type="checkbox" id="wh-refbox-chk" ${t.has_ref?"checked":""}>
        <span class="whp-bt">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19</span>
      </label>
      <div class="whp-ref" id="wh-refbox" ${t.has_ref?"":"hidden"}>
        
        
        <div class="whp-refg mt-1">
          <div class="fld"><label>Reference No.</label>
            <input class="inp w100" id="wh-ref" value="${r(t.reference_no)}"
              readonly tabindex="-1" title="\u0E2D\u0E2D\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"
              placeholder="\u0E2D\u0E2D\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"></div>
          <div class="fld"><label>Ref. Date</label>
            <input class="inp w100" type="date" id="wh-refdate" value="${r(t.ref_date||"")}"
              readonly tabindex="-1" title="\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E43\u0E2A\u0E48\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"></div>
        </div>
        
        <p class="t-xs t-3">Reference No. \u0E41\u0E25\u0E30 Ref. Date
          <b>\u0E2D\u0E2D\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01</b> \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49
          \u0E41\u0E25\u0E30\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2D\u0E35\u0E01\u0E40\u0E25\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19</p>
        <p class="t-xs t-3">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E43\u0E19 (\u0E04\u0E19\u0E25\u0E30\u0E40\u0E25\u0E02\u0E01\u0E31\u0E1A Reference No.):
          ${t.whtId&&a&&!/^WHTDRAFT-/.test(String(a.document_no||""))?"<b>"+r(a.document_no)+"</b>":"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 POST \u2014 \u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14 POST \u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}</p>
      </div>
      
      <!-- \u2500\u2500 \u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <section class="whp-blk">
        <h3 class="whp-bt">\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48</h3>
        <div class="whp-r3">
          <div class="fld"><label>\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48</label>
            <input class="inp w100" id="wh-book" value="${r(t.book_no)}"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 <span class="req">*</span></label>
            <input class="inp w100" id="wh-cert" value="${r(t.certificate_no)}"></div>
          
          <div class="fld"><label>CODE</label>
            <div class="whp-cbx">
              <input class="inp w100" id="wh-doccode" autocomplete="off"
                role="combobox" aria-expanded="false" aria-autocomplete="list"
                placeholder="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE" value="${r(t.doc_code)}">
              <div class="whp-cbx-list" id="wh-doccode-list" hidden></div>
            </div></div>
        </div>
      </section>


      <!-- \u2500\u2500 \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <section class="whp-blk">
        
        
        <div class="whp-bh">
          <h3 class="whp-bt">\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</h3>
          
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-mnew"
              >\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-medit"
              ${t.customer_id?"":"disabled"}>\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</button>
          </span>
          
        </div>
        
        
        
        <div class="whp-pick whp-coderow">
          <label for="wh-payer-code">\u0E23\u0E2B\u0E31\u0E2A (CODE)</label>
          <input class="inp whp-code" id="wh-payer-code" value="${r(t.payer_code)}"
            placeholder="\u0E40\u0E0A\u0E48\u0E19 NJ" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payer-code-go"
            title="\u0E04\u0E49\u0E19\u0E2B\u0E32 CODE \u0E19\u0E35\u0E49">\u{1F50D}</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payer-pick">\u{1F465} \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D</button>
          <label for="wh-payer-cid" class="whp-cid-l">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19</label>
          <input class="inp whp-cid" id="wh-payer-cid" value="${r(t.payer_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        
        <div class="whp-rname">
          <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D</label>
            <input class="inp w100" id="wh-payer-name" value="${r(t.payer_name)}"></div>
          <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32 (5 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-payer-branch" value="${r(t.payer_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 5 \u0E2B\u0E25\u0E31\u0E01 \u0E40\u0E0A\u0E48\u0E19 00000 (\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48)"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-payer-tax" value="${r(t.payer_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
          <input class="inp w100" id="wh-payer-addr" value="${r(t.payer_address)}"></div>
      </section>

      <!-- \u2500\u2500 \u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19 \u2014 \u0E43\u0E0A\u0E49\u0E42\u0E04\u0E23\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A Payer/Payee (Align \u0E15\u0E23\u0E07\u0E01\u0E31\u0E19) \u2500\u2500\u2500\u2500 -->
      
      
      
      ${t.wht_mode==="NON_ACTING"?"":`
      <section class="whp-blk whp-agblk">
        <label class="whp-refchk" for="wh-has-agent">
          <input type="checkbox" id="wh-has-agent" ${t.has_agent?"checked":""}>
          <span class="whp-bt">\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19</span>
        </label>
        <div class="whp-ref" id="wh-agent-sec" ${t.has_agent?"":"hidden"}>
        <div class="whp-rname">
          <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D</label>
            <input class="inp w100" id="wh-agent-name" value="${r(t.agent_name)}"></div>
          <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32 (5 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-agent-branch" value="${r(t.agent_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 5 \u0E2B\u0E25\u0E31\u0E01 \u0E40\u0E0A\u0E48\u0E19 00000 (\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48)"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-agent-tax" value="${r(t.agent_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
          <div class="fld"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
            <input class="inp w100" id="wh-agent-addr" value="${r(t.agent_address)}"></div>
        </div>
      </section>`}

      <!-- \u2500\u2500 \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
           (V.204: \u0E0A\u0E48\u0E2D\u0E07 "\u0E23\u0E2B\u0E31\u0E2A" \u0E22\u0E49\u0E32\u0E22\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E16\u0E27 CODE \u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E41\u0E25\u0E49\u0E27 -> \u0E43\u0E0A\u0E49 .whp-rname \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E2D\u0E35\u0E01 2 \u0E1D\u0E48\u0E32\u0E22)
           \u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E02\u0E2D\u0E07 \u0E2A\u0E32\u0E02\u0E32/Tax ID \u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A\u0E2D\u0E35\u0E01 2 Section \u0E40\u0E1B\u0E4A\u0E30 -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</h3>
          
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-mnew"
              >\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-medit"
              ${t.payee_customer_id?"":"disabled"}>\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</button>
          </span>
        </div>
        
        <div class="whp-pick whp-coderow">
          <label for="wh-payee-code2">\u0E23\u0E2B\u0E31\u0E2A (CODE)</label>
          <input class="inp whp-code" id="wh-payee-code2" value="${r(t.payee_code)}"
            placeholder="\u0E40\u0E0A\u0E48\u0E19 VP001" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payee-code-go"
            title="\u0E04\u0E49\u0E19\u0E2B\u0E32 CODE \u0E19\u0E35\u0E49">\u{1F50D}</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payee-pick">\u{1F465} \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D</button>
          <label for="wh-payee-cid" class="whp-cid-l">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19</label>
          <input class="inp whp-cid" id="wh-payee-cid" value="${r(t.payee_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        
        <div class="whp-rname">
          <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D</label>
            <input class="inp w100" id="wh-payee-name" value="${r(t.payee_name)}"></div>
          <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32 (5 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-payee-branch" value="${r(t.payee_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 5 \u0E2B\u0E25\u0E31\u0E01 \u0E40\u0E0A\u0E48\u0E19 00000 (\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48)"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23 (13 \u0E2B\u0E25\u0E31\u0E01)</label>
            <input class="inp w100" id="wh-payee-tax" value="${r(t.payee_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
          <input class="inp w100" id="wh-payee-addr" value="${r(t.payee_address)}"></div>
      </section>

      
      
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-form">
          <input type="checkbox" id="wh-has-form" ${t.has_form?"checked":""}>
          <span class="whp-bt">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E43\u0E19\u0E41\u0E1A\u0E1A\u0E22\u0E37\u0E48\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23
            <small class="whp-hint">(\u0E40\u0E25\u0E37\u0E2D\u0E01 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)</small></span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-form-sec" ${t.has_form?"":"hidden"}>
          <div class="whp-rds whp-rds-h" id="wh-form-rd">${da("wh-form",_a,t.form_type)}</div>
          <label class="whp-seq">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48:
            <input class="inp" id="wh-formseq" value="${r(t.form_seq)}"></label>
        </div>
      </section>

      <!-- \u2500\u2500 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E32\u0E23\u0E32\u0E07 Compact (\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 40 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 Preview A4) \u2500\u2500 -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49</h3>
          <button class="btn btn-o btn-sm" id="wh-add">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
        </div>
        <div class="tbl-wrap whp-items"><table class="tbl"><thead><tr>
          
          <th style="width:38px">\u0E25\u0E33\u0E14\u0E31\u0E1A</th>
          <th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49 <span class="req">*</span></th>
          <th style="width:116px">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 <span class="req">*</span></th>
          <th class="r" style="width:110px">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
          <th class="r" style="width:112px">\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07 <span class="req">*</span></th>
          <th class="center" style="width:44px">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
        </tr></thead><tbody id="wh-ltb"></tbody></table></div>
      </section>

      <!-- \u2500\u2500 \u0E23\u0E27\u0E21\u0E22\u0E2D\u0E14 \u2014 Reuse \u0E01\u0E32\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13\u0E40\u0E14\u0E34\u0E21 100% (refreshTotals) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <section class="whp-blk">
        <h3 class="whp-bt">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07</h3>
        <div class="whp-r3">
          <div class="fld"><label>\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</label>
            <input class="inp w100 r" id="wh-t-base" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>\u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07</label>
            <input class="inp w100 r whp-hi" id="wh-t-tax" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>\u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07 <i>(\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23)</i></label>
            <input class="inp w100" id="wh-t-words" value="" readonly tabindex="-1"></div>
        </div>
      </section>

      
      <div class="whp-blk whp-blk-chk">
        <label class="whp-agchk"><input type="checkbox" id="wh-has-fund"
          ${t.has_fund?"checked":""}><span>\u0E40\u0E07\u0E34\u0E19\u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19 / \u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2A\u0E31\u0E07\u0E04\u0E21</span></label>
      </div>
      <section class="whp-blk" id="wh-fund-sec" ${t.has_fund?"":"hidden"}>
        <div class="whp-r3">
          <div class="fld"><label>\u0E01\u0E1A\u0E02./\u0E01\u0E2A\u0E08./\u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E2A\u0E07\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E04\u0E23\u0E39\u0E2F</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-gpf" value="${r(t.gpf_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>\u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2A\u0E31\u0E07\u0E04\u0E21</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-sso" value="${r(t.social_security_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>\u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E0A\u0E35\u0E1E</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-pvd" value="${r(t.provident_fund_amount)}" placeholder="0.00"></div>
        </div>
      </section>

      <!-- \u2500\u2500 \u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 (\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E20\u0E32\u0E29\u0E35) \u2014 Radio \u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      
      
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-pm">
          <input type="checkbox" id="wh-has-pm" ${t.has_pm?"checked":""}>
          <span class="whp-bt">\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-pm-sec" ${t.has_pm?"":"hidden"}>
          <div class="whp-rds whp-rds-h" id="wh-pm-rd">${da("wh-pm",wa,t.pay_method)}</div>
          <span class="whp-pmo" id="wh-pm-other-wrap"
            ${t.pay_method===Ie?"":"hidden"}>
            <input class="inp" id="wh-pm-other" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E37\u0E48\u0E19 \u0E46"
              aria-label="\u0E23\u0E30\u0E1A\u0E38 (\u0E2D\u0E37\u0E48\u0E19 \u0E46)" value="${r(t.pay_method_other)}">
          </span>
        </div>
      </section>

      
      <!-- \u2500\u2500 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 / \u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 / \u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21</h3>
          <label class="whp-agchk"><input type="checkbox" id="wh-has-signer"
            ${t.has_signer?"checked":""}><span>\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21 / \u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21</span></label>
        </div>
        <div class="whp-r3 whp-dates">
          <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07 <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-pdate" value="${r(t.pay_date||"")}"></div>
          <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-ddate" value="${r(t.document_date)}"></div>
        </div>
        ${t.payments&&t.payments.length>1?`<p class="t-xs whp-warn">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 ${t.payments.length} \u0E04\u0E23\u0E31\u0E49\u0E07 \u2014
              \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07</p>`:""}
        <div id="wh-signer-sec" ${t.has_signer?"":"hidden"}>
          <div class="whp-r3">
            <div class="fld"><label>\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21</label>
              <input class="inp w100" id="wh-signer" value="${r(t.signer_name)}"></div>
            <div class="fld"><label>\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07</label>
              <input class="inp w100" id="wh-signpos" value="${r(t.signer_position)}"></div>
          </div>
          <div class="whp-r3">
            <div class="fld whp-sp2"><label>\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 (\u0E2D\u0E37\u0E48\u0E19\u0E46) \u2014 \u0E43\u0E0A\u0E49\u0E43\u0E19\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Excel \xB7 \u0E04\u0E19\u0E25\u0E30\u0E0A\u0E48\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21</label>
              <input class="inp w100" id="wh-payby" value="${r(t.payment_by)}"
                placeholder="\u0E40\u0E0A\u0E48\u0E19 EDC / IKANO / KN / PRO / APL / SCH"></div>
          </div>
        </div>
      </section>

      
      <div class="whp-act">
        <div class="whp-act-l">
          
          ${t.whtId&&!_&&(re()||pe("issue_receipt"))&&Rt("REPORT")?'<button class="btn btn-danger" id="wh-del">\u{1F5D1} \u0E25\u0E1A</button>':""}
          ${h?'<button class="btn btn-unpost" id="wh-unpost">\u21A9 UNPOST</button>':""}
        </div>
        <div class="whp-act-r">
          <button class="btn btn-o" id="wh-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
          <button class="btn btn-p" id="wh-save" ${_?"disabled":""}>\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
          
          <button class="btn btn-o" id="wh-prev"
            ${String(t.reference_no||"").trim()?"":"disabled"}>\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
        </div>
      </div>
      ${t.whtId?"":'<p class="t-xs t-3 mt-1">\u0E01\u0E14 \u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01 Reference No. \u0E41\u0E25\u0E30 Ref. Date \u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)</p>'}
      ${h?'<p class="t-xs whp-warn mt-1">\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49 POST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14 \u21A9 UNPOST \u0E01\u0E48\u0E2D\u0E19</p>':""}
      ${y?'<p class="t-xs whp-warn mt-1">\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01 VOID \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E14\u0E39\u0E41\u0E25\u0E30\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27</p>':""}

    </div>`;async function w(){if(!t.whtId||!String(t.reference_no||"").trim()){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E01\u0E48\u0E2D\u0E19\u0E1E\u0E34\u0E21\u0E1E\u0E4C","err");return}try{Be(await Ae(t.whtId))}catch(n){f(J(n),"err")}}let v=e.querySelector("#wh-ltb"),M=["certificate_no","book_no","document_date","pay_date","reference_no","invoice_no_text","ref_date","job_no","note","customer_id","invoice_id","payee_customer_id","payee_code","payment_by","has_fund","gpf_amount","social_security_amount","provident_fund_amount","doc_code","payer_code","payer_citizen_id","payee_citizen_id","payer_name","payer_tax_id","payer_branch","payer_address","has_agent","agent_name","agent_tax_id","agent_branch","agent_address","payee_name","payee_tax_id","payee_branch","payee_address","form_type","form_seq","pay_method","pay_method_other","signer_name","signer_position"],H=()=>JSON.stringify([M.map(n=>t[n]===void 0||t[n]===null?"":String(t[n])),(t.lines||[]).map(n=>[n.pay_date||"",n.income_type||"",n.wht_income_category||"",n.description||"",String(n.tax_base??""),String(n.rate??""),String(n.amount??"")])]),T=H();t.__resetDirty=()=>{T=H()};let R=async()=>{if(_||H()===T){we(e);return}await at("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E44\u0E02\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",'\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?<br><span class="t-xs t-3">\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A)</span>',"\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")&&we(e)};e.querySelector("#wh-back").onclick=R,e.querySelector("#wh-cancel").onclick=R,e.querySelector("#wh-ddate").onchange=n=>{t.document_date=n.target.value},e.querySelector("#wh-pdate").onchange=n=>{t.pay_date=n.target.value};function ae(){let n=String(t.pay_date||"").trim();n&&(t.lines||[]).forEach((i,d)=>{if(String(i.pay_date||"").trim())return;i.pay_date=n;let p=e.querySelector(`#wh-ltb [data-i="${d}"][data-k="pay_date"]`);p&&(p.value=n)})}let Ee=e.querySelector("#wh-refbox-chk"),Y=e.querySelector("#wh-refbox");Ee&&(Ee.onchange=n=>{t.has_ref=!!n.target.checked,Y&&(Y.hidden=!t.has_ref)});let qe=e.querySelector("#wh-has-signer"),Pe=e.querySelector("#wh-signer-sec");qe&&(qe.onchange=n=>{t.has_signer=!!n.target.checked,Pe&&(Pe.hidden=!t.has_signer)});let Ze={"wh-payer-branch":5,"wh-agent-branch":5,"wh-payee-branch":5,"wh-payer-tax":13,"wh-agent-tax":13,"wh-payee-tax":13,"wh-payer-cid":13,"wh-payee-cid":13};Object.entries({"wh-book":"book_no","wh-jobno":"job_no","wh-cert":"certificate_no","wh-note":"note","wh-doccode":"doc_code","wh-payer-code":"payer_code","wh-payee-code2":"payee_code","wh-invno":"invoice_no_text","wh-payee-code":"payee_code","wh-payby":"payment_by","wh-gpf":"gpf_amount","wh-sso":"social_security_amount","wh-pvd":"provident_fund_amount","wh-payer-cid":"payer_citizen_id","wh-payee-cid":"payee_citizen_id","wh-payer-name":"payer_name","wh-payer-tax":"payer_tax_id","wh-payer-branch":"payer_branch","wh-payer-addr":"payer_address","wh-agent-name":"agent_name","wh-agent-tax":"agent_tax_id","wh-agent-branch":"agent_branch","wh-agent-addr":"agent_address","wh-payee-name":"payee_name","wh-payee-tax":"payee_tax_id","wh-payee-branch":"payee_branch","wh-payee-addr":"payee_address","wh-formseq":"form_seq","wh-pm-other":"pay_method_other","wh-signer":"signer_name","wh-signpos":"signer_position"}).forEach(([n,i])=>{let d=e.querySelector("#"+n);if(!d)return;let p=Ze[n];if(p){d.oninput=u=>{let m=String(u.target.value).replace(/\D/g,"").slice(0,p);if(m!==u.target.value){u.target.value=m;try{u.target.setSelectionRange(m.length,m.length)}catch{}}t[i]=m};return}d.oninput=u=>{t[i]=u.target.value}}),(function(){let i=e.querySelector("#wh-doccode"),d=e.querySelector("#wh-doccode-list");if(!i||!d)return;let p=[],u=[],m=-1,C=()=>{d.hidden=!0,m=-1,i.setAttribute("aria-expanded","false")},S=()=>{let x=String(t.doc_code||"").trim().toLowerCase();d.innerHTML=u.length?u.map((N,E)=>`<button type="button" role="option"
            aria-selected="${N.toLowerCase()===x?"true":"false"}"
            class="whp-cbx-opt${E===m?" on":""}${N.toLowerCase()===x?" sel":""}"
            data-code="${r(N)}"><span class="whp-cbx-dot"></span>${r(N)}</button>`).join(""):'<div class="whp-cbx-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A CODE \u0E19\u0E35\u0E49 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E48\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49</div>',d.hidden=!1,i.setAttribute("aria-expanded","true")},A=()=>{let x=String(i.value||"").trim().toLowerCase();u=x?p.filter(N=>N.toLowerCase().includes(x)):p.slice(),m=-1,S()},$=x=>{i.value=x,t.doc_code=x,C()};i.addEventListener("focus",()=>{p.length&&A()}),i.addEventListener("input",()=>{t.doc_code=i.value,p.length&&A()}),i.addEventListener("keydown",x=>{if(!d.hidden)if(x.key==="ArrowDown"||x.key==="ArrowUp"){if(x.preventDefault(),!u.length)return;m=(m+(x.key==="ArrowDown"?1:-1)+u.length)%u.length,S()}else x.key==="Enter"?m>=0&&u[m]&&(x.preventDefault(),$(u[m])):x.key==="Escape"&&C()}),d.addEventListener("mousedown",x=>{let N=x.target.closest("[data-code]");N&&(x.preventDefault(),$(N.dataset.code))}),document.addEventListener("mousedown",x=>{!d.hidden&&!d.contains(x.target)&&x.target!==i&&C()}),Ft().then(x=>{p=Array.isArray(x)?x.map(String):[]}).catch(()=>{p=[]})})(),e.querySelector("#wh-refdate").onchange=n=>{n.target.value=t.ref_date||""};function de(){["agent_name","agent_tax_id","agent_branch","agent_address"].some(i=>String(t[i]||"").trim())||(t.agent_name=G.nameEn,t.agent_tax_id=G.taxId,t.agent_branch="00000",t.agent_address=G.address,[["wh-agent-name","agent_name"],["wh-agent-tax","agent_tax_id"],["wh-agent-branch","agent_branch"],["wh-agent-addr","agent_address"]].forEach(([i,d])=>{let p=e.querySelector("#"+i);p&&(p.value=t[d])}))}let ne={payer:{code:"wh-payer-code",pick:"wh-payer-pick",go:"wh-payer-code-go",cust:"wh-cust",k:"payer",custKey:"customer_id",ids:{name:"wh-payer-name",branch:"wh-payer-branch",tax:"wh-payer-tax",cid:"wh-payer-cid",addr:"wh-payer-addr"},keys:{name:"payer_name",branch:"payer_branch",tax:"payer_tax_id",cid:"payer_citizen_id",addr:"payer_address",code:"payer_code"}},payee:{code:"wh-payee-code2",pick:"wh-payee-pick",go:"wh-payee-code-go",cust:"wh-payee-cus",k:"payee",custKey:"payee_customer_id",ids:{name:"wh-payee-name",branch:"wh-payee-branch",tax:"wh-payee-tax",cid:"wh-payee-cid",addr:"wh-payee-addr"},keys:{name:"payee_name",branch:"payee_branch",tax:"payee_tax_id",cid:"payee_citizen_id",addr:"payee_address",code:"payee_code"}}};function Le(n){let i=ne[n];if(!i)return;let d=!!String(t[i.custKey]||"").trim(),p=e.querySelector("#wh-"+n+"-medit"),u=e.querySelector("#wh-"+n+"-mnew");p&&(p.disabled=!d,p.title=d?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E01\u0E2D\u0E22\u0E39\u0E48":"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D \u2014 \u0E04\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 CODE \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E48\u0E2D\u0E19"),u&&(u.disabled=d,u.title=d?'CODE \u0E19\u0E35\u0E49\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E43\u0E0A\u0E49 "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"':"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D")}function vt(n){let i=ne[n];i&&(t[i.custKey]&&(t[i.custKey]=null),Le(n))}function He(n,i){let d=ne[n];if(!d||!i)return;if(t[d.keys.code]=i.code||"",t[d.keys.name]=i.name||"",t[d.keys.branch]=i.branch||"",t[d.keys.tax]=i.tax_id||"",t[d.keys.cid]=i.citizen_id||"",t[d.keys.addr]=i.address||"",i.id){t[d.custKey]=i.id;let u=e.querySelector("#"+d.cust);u&&[...u.options].some(m=>m.value===i.id)&&(u.value=i.id)}let p=(u,m)=>{let C=e.querySelector("#"+u);C&&(C.value=m||"")};p(d.code,t[d.keys.code]),p(d.ids.name,t[d.keys.name]),p(d.ids.branch,t[d.keys.branch]),p(d.ids.tax,t[d.keys.tax]),p(d.ids.cid,t[d.keys.cid]),p(d.ids.addr,t[d.keys.addr]),Le(n)}async function et(n){let i=ne[n],d=e.querySelector("#"+i.code),p=(d&&d.value||"").trim();if(p)try{let u=await ye({code:p}),m=u&&u.rows||[];if(!m.length){vt(n),f('\u0E44\u0E21\u0E48\u0E1E\u0E1A CODE "'+p+'" \u0E43\u0E19 Master',"err");return}He(n,m[0]),f("\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 CODE "+m[0].code+" \u0E41\u0E25\u0E49\u0E27","ok")}catch(u){oe(u,"\u0E04\u0E49\u0E19\u0E2B\u0E32 CODE \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}function ba(n){let i=document.createElement("div");i.className="whp-pk",i.innerHTML=`
      <div class="whp-pk-bar">
        <label for="whp-pk-q">\u0E04\u0E49\u0E19\u0E2B\u0E32</label>
        <input class="inp" id="whp-pk-q" placeholder="\u0E23\u0E30\u0E1A\u0E38 CODE \u0E2B\u0E23\u0E37\u0E2D \u0E0A\u0E37\u0E48\u0E2D" autocomplete="off">
        <button type="button" class="btn btn-o btn-sm" id="whp-pk-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        ${re()?'<button type="button" class="btn btn-p btn-sm" id="whp-pk-new">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48</button>':""}
      </div>
      <div class="tbl-wrap whp-pk-tbl"><table class="tbl"><thead><tr>
        <th style="width:44px">\u0E40\u0E25\u0E37\u0E2D\u0E01</th><th style="width:110px">CODE</th><th>\u0E0A\u0E37\u0E48\u0E2D</th>
        <th style="width:150px">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</th>
        <th style="width:90px">\u0E2A\u0E32\u0E02\u0E32</th><th>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</th>
      </tr></thead><tbody id="whp-pk-tb"></tbody></table></div>
      <!-- \u2500\u2500 V.335 \u2500\u2500 \u0E41\u0E16\u0E1A\u0E40\u0E14\u0E34\u0E19\u0E2B\u0E19\u0E49\u0E32 (Server-side Pagination)
           \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E22 -> \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E27\u0E48\u0E32 Master \u0E21\u0E35\u0E41\u0E04\u0E48 50 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23
           \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E1A\u0E2D\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E41\u0E25\u0E30\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E08\u0E23\u0E34\u0E07\u0E40\u0E2A\u0E21\u0E2D \u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14\u0E27\u0E48\u0E32\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27 -->
      <div class="whp-pk-pgn" id="whp-pk-pgn">
        <span id="whp-pk-info" class="t-3"></span>
        <span class="mf-right">
          <button type="button" class="btn btn-o btn-sm" id="whp-pk-prev">\u2039 \u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32</button>
          <button type="button" class="btn btn-o btn-sm" id="whp-pk-next">\u0E16\u0E31\u0E14\u0E44\u0E1B \u203A</button>
        </span>
      </div>
      <div class="whp-pk-form" id="whp-pk-form" hidden></div>`;let d=document.createElement("div");d.innerHTML=`<div class="mf-right">
        <button class="btn btn-p" id="whp-pk-ok">\u0E40\u0E25\u0E37\u0E2D\u0E01</button>
        <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button></div>`,fe({title:"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E1C\u0E39\u0E49\u0E02\u0E32\u0E22",body:i,footer:d,large:!0});let p=i.querySelector("#whp-pk-tb"),u=[],m=null,C=50,S=0,A=0,$=!1,x=i.querySelector("#whp-pk-info"),N=i.querySelector("#whp-pk-prev"),E=i.querySelector("#whp-pk-next"),D="wh-pk-"+n;async function K(O){let I=(i.querySelector("#whp-pk-q").value||"").trim();O||(S=0);let X=Te(D);p.innerHTML='<tr><td colspan="6" class="center t-3">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32\u2026</td></tr>';let U=null;try{U=await ye(I?{q:I,size:C,offset:S}:{size:C,offset:S})}catch(F){if(!ie(D,X))return;oe(F,"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),U=null}ie(D,X)&&(u=U&&U.rows||[],A=U&&typeof U.total=="number"?U.total:u.length,$=U&&typeof U.has_more=="boolean"?U.has_more:S+u.length<A,m=null,p.innerHTML=u.length?u.map((F,le)=>`<tr data-i="${le}">
          <td class="center"><input type="radio" name="whp-pk-r" value="${le}"></td>
          <td class="t-b">${r(F.code||"-")}</td>
          <td class="ellip" title="${r(F.name||"")}">${r(F.name||"-")}</td>
          <td>${r(F.tax_id||"-")}</td>
          <td>${r(F.branch||"-")}</td>
          <td class="ellip" title="${r(F.address||"")}">${r(F.address||"-")}</td>
        </tr>`).join(""):'<tr><td colspan="6" class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</td></tr>',Ea())}function Ea(){let O=A?S+1:0,I=S+u.length,X=A?Math.ceil(A/C):1,U=Math.floor(S/C)+1;x.textContent=A?`\u0E41\u0E2A\u0E14\u0E07 ${O}\u2013${I} \u0E08\u0E32\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${A.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23  \xB7  \u0E2B\u0E19\u0E49\u0E32 ${U} / ${X}`:"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",N.disabled=S<=0,E.disabled=!$}N.onclick=()=>{S<=0||(S=Math.max(0,S-C),je(D),K(!0))},E.onclick=()=>{$&&(S+=C,je(D),K(!0))},p.addEventListener("click",O=>{let I=O.target.closest("tr[data-i]");if(!I)return;let X=I.querySelector("input[type=radio]");X&&(X.checked=!0),m=u[Number(I.dataset.i)]}),p.addEventListener("change",O=>{O.target.name==="whp-pk-r"&&(m=u[Number(O.target.value)])});let $a=100;i.querySelector("#whp-pk-q").addEventListener("input",()=>{Ue(D,K,$a)});let At=()=>{je(D),K()};i.querySelector("#whp-pk-go").onclick=At,i.querySelector("#whp-pk-q").onkeydown=O=>{O.key==="Enter"&&(O.preventDefault(),At())},d.querySelector("#whp-pk-ok").onclick=()=>{if(!m){f("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E48\u0E2D\u0E19","err");return}He(n,m),We(),f("\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 CODE "+(m.code||"")+" \u0E41\u0E25\u0E49\u0E27","ok")};let Nt=i.querySelector("#whp-pk-new");Nt&&(Nt.onclick=()=>{let O=i.querySelector("#whp-pk-form");O.hidden=!1,O.innerHTML=`
        <h4 class="whp-pk-ft">\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E19 Master</h4>
        <div class="whp-r3">
          <div class="fld"><label>CODE <span class="req">*</span></label>
            <input class="inp w100" id="whp-nc" placeholder="\u0E40\u0E0A\u0E48\u0E19 NJ"></div>
          <div class="fld whp-sp2"><label>\u0E0A\u0E37\u0E48\u0E2D <span class="req">*</span></label>
            <input class="inp w100" id="whp-nn"></div>
        </div>
        <div class="whp-r3">
          <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32</label>
            <input class="inp w100" id="whp-nb" inputmode="numeric" maxlength="5"
              pattern="[0-9]{5}" placeholder="00000"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
            <input class="inp w100" id="whp-nt" inputmode="numeric" maxlength="13"></div>
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19</label>
            <input class="inp w100" id="whp-ni" inputmode="numeric" maxlength="13"></div>
        </div>
        <div class="fld"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label><input class="inp w100" id="whp-na"></div>
        <div class="whp-pk-fb">
          <button type="button" class="btn btn-p btn-sm" id="whp-nsave">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
          <button type="button" class="btn btn-o btn-sm" id="whp-ncancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
        </div>`,[["whp-nb",5],["whp-nt",13],["whp-ni",13]].forEach(([I,X])=>{let U=O.querySelector("#"+I);U.oninput=F=>{let le=String(F.target.value).replace(/\D/g,"").slice(0,X);le!==F.target.value&&(F.target.value=le)}}),O.querySelector("#whp-ncancel").onclick=()=>{O.hidden=!0,O.innerHTML=""},O.querySelector("#whp-nsave").onclick=async()=>{let I=j=>(O.querySelector("#"+j).value||"").trim();if(Fe(O),!I("whp-nc")){f("\u0E01\u0E23\u0E2D\u0E01 CODE \u0E01\u0E48\u0E2D\u0E19","err");return}if(!I("whp-nn")){f("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E48\u0E2D\u0E19","err");return}for(let[j,te]of[["whp-nt","\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23"],["whp-ni","\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19"]]){let me=I(j);if(me&&!ce(me)){f(te+" \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01","err");return}}if(I("whp-nb")&&!Xe(I("whp-nb"))){he(O.querySelector("#whp-nb"),ge),f(ge,"err");return}let X=ra(I("whp-nc")),U=Ke(I("whp-nt")),F=Ke(I("whp-ni")),le=oa(I("whp-nb"));try{let j=(await ye({size:200})||{}).rows||[],te=j.find(se=>ra(se.code)===X),me=U?j.find(se=>Ke(se.tax_id)===U&&oa(se.branch)===le):null,$e=F?j.find(se=>Ke(se.citizen_id)===F):null,Se=te?["whp-nc",De.NJACC_PARTY_CODE_DUPLICATE[1],te]:me?["whp-nt",De.NJACC_PARTY_TAXBRANCH_DUPLICATE[1],me]:$e?["whp-ni",De.NJACC_PARTY_CITIZEN_DUPLICATE[1],$e]:null;if(Se){let se=Se[1]+ua(Se[2].code,Se[2].name);he(O.querySelector("#"+Se[0]),se),f(se,"err");return}}catch{}try{let j=await ee("wht-party-upsert",()=>ot({code:I("whp-nc"),name:I("whp-nn"),branch:I("whp-nb"),tax_id:I("whp-nt"),citizen_id:I("whp-ni"),address:I("whp-na")}));f("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 Master \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35","ok"),O.hidden=!0,O.innerHTML="";try{await Ve(!0)}catch{}i.querySelector("#whp-pk-q").value=j&&j.code?j.code:I("whp-nc"),await K()}catch(j){let te=ca(j);if(te){let $e=O.querySelector("#"+te.field);$e&&he($e,te.msg),f(te.msg,"err");return}String(j&&j.message||"").includes("NJACC_FORBIDDEN")?f("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E01\u0E49 Master (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 ADMIN)","err"):oe(j,"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 Master \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}}),K()}async function gt(n,i){let d=ne[n],p=A=>(e.querySelector("#"+A)||{}).value||"",u=p(d.code).trim();if(!u){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38 CODE \u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25","err");return}let m={id:null,code:u,name:p(d.ids.name),branch:p(d.ids.branch),tax_id:p(d.ids.tax),citizen_id:p(d.ids.cid),address:p(d.ids.addr)};if(i==="edit")try{let A=await ye({code:u}),$=(A&&A.rows||[])[0];if(!$||!$.id){f('\u0E44\u0E21\u0E48\u0E1E\u0E1A CODE "'+u+'" \u0E43\u0E19\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D',"err");return}m={id:$.id,code:$.code||"",name:$.name||"",branch:$.branch||"",tax_id:$.tax_id||"",citizen_id:$.citizen_id||"",address:$.address||""}}catch(A){oe(A,"\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");return}let C=document.createElement("div");C.className="whp-pk",C.innerHTML=`
      <h4 class="whp-pk-ft">${i==="edit"?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D"} \u2014
        ${n==="payer"?"\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22":"\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"}</h4>
      <div class="whp-r3">
        <div class="fld"><label>CODE <span class="req">*</span></label>
          <input class="inp w100" id="whm-c" value="${r(m.code)}" placeholder="\u0E40\u0E0A\u0E48\u0E19 NJ"></div>
        <div class="fld whp-sp2"><label>\u0E0A\u0E37\u0E48\u0E2D <span class="req">*</span></label>
          <input class="inp w100" id="whm-n" value="${r(m.name)}"></div>
      </div>
      <div class="whp-r3">
        <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32</label>
          <input class="inp w100" id="whm-b" inputmode="numeric" maxlength="5"
            pattern="[0-9]{5}" value="${r(m.branch)}" placeholder="00000"></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
          <input class="inp w100" id="whm-t" inputmode="numeric" maxlength="13"
            value="${r(m.tax_id)}"></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19</label>
          <input class="inp w100" id="whm-i" inputmode="numeric" maxlength="13"
            value="${r(m.citizen_id)}"></div>
      </div>
      <div class="fld"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
        <input class="inp w100" id="whm-a" value="${r(m.address)}"></div>`;let S=document.createElement("div");S.innerHTML=`<div class="mf-right">
        <button class="btn btn-p" id="whm-save">${i==="edit"?"\u{1F4BE} \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25":"\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D"}</button>
        <button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button></div>`,fe({title:i==="edit"?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D",body:C,footer:S,large:!0}),[["whm-b",5],["whm-t",13],["whm-i",13]].forEach(([A,$])=>{let x=C.querySelector("#"+A);x.oninput=N=>{let E=String(N.target.value).replace(/\D/g,"").slice(0,$);E!==N.target.value&&(N.target.value=E)}}),S.querySelector("#whm-save").onclick=async A=>{let $=x=>(C.querySelector("#"+x).value||"").trim();if(Fe(C),!$("whm-c")){f("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38 CODE \u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25","err");return}if(!$("whm-n")){f("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E48\u0E2D\u0E19","err");return}for(let[x,N]of[["whm-t","\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23"],["whm-i","\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19"]]){let E=$(x);if(E&&!ce(E)){f(N+" \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01","err");return}}if($("whm-b")&&!Xe($("whm-b"))){he(C.querySelector("#whm-b"),ge),f(ge,"err");return}Ce(A.target,!0);try{let x={code:$("whm-c"),name:$("whm-n"),branch:$("whm-b"),tax_id:$("whm-t"),citizen_id:$("whm-i"),address:$("whm-a")};i==="edit"&&m.id&&(x.id=m.id);let N=await ee("wht-master-"+n+"-"+(m.id||"new"),()=>ot(x));We();try{await Ve(!0)}catch{}N?He(n,N):Le(n),f((i==="edit"?"\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ")+$("whm-c")+(i==="edit"?" \u0E41\u0E25\u0E49\u0E27":" \u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E49\u0E27"),"ok")}catch(x){let N=ca(x);if(N){let E={"whp-nc":"whm-c","whp-nn":"whm-n","whp-nb":"whm-b","whp-nt":"whm-t","whp-ni":"whm-i","whp-na":"whm-a"},D=C.querySelector("#"+(E[N.field]||"whm-c"));D&&he(D,N.msg),f(N.msg,"err")}else String(x&&x.message||"").includes("NJACC_FORBIDDEN")?f("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E01\u0E49\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 ADMIN)","err"):oe(x,"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");Ce(A.target,!1)}}}["payer","payee"].forEach(n=>{let i=e.querySelector("#wh-"+n+"-mnew"),d=e.querySelector("#wh-"+n+"-medit");i&&(i.onclick=()=>gt(n,"new")),d&&(d.onclick=()=>gt(n,"edit"));let p=e.querySelector("#"+ne[n].code);p&&p.addEventListener("input",()=>vt(n)),Le(n)});let ya=2,va=250;function ga(n){let i=ne[n],d=e.querySelector("#"+i.ids.name);if(!d||d.dataset.acOn==="1")return;let p=d.closest(".fld");if(!p)return;d.dataset.acOn="1",d.setAttribute("autocomplete","off"),p.classList.add("whp-ac-host");let u=document.createElement("div");u.className="whp-ac",u.hidden=!0,p.appendChild(u);let m="wht-ac-"+n,C=[],S=-1,A=()=>{u.hidden=!0,u.innerHTML="",C=[],S=-1},$=()=>{[...u.children].forEach((D,K)=>D.classList.toggle("on",K===S));let E=S>=0?u.children[S]:null;E&&typeof E.scrollIntoView=="function"&&E.scrollIntoView({block:"nearest"})},x=()=>{if(!C.length){A();return}u.innerHTML=C.map((E,D)=>`<div class="whp-ac-i" data-i="${D}">
          <div class="whp-ac-n">${r(E.name||"-")}</div>
          <div class="whp-ac-m">${r(E.code||"-")} \xB7 ${r(E.tax_id||"-")} \xB7 ${r(E.branch||"-")}</div>
        </div>`).join(""),S=-1,u.hidden=!1,$()},N=E=>{let D=C[E];D&&(A(),He(n,D),f("\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 CODE "+(D.code||"-")+" \u0E41\u0E25\u0E49\u0E27","ok"))};d.addEventListener("input",()=>{let E=(d.value||"").trim();if(E.length<ya){A();return}Ue(m,async()=>{let D=Te(m);try{let K=await ye({q:E,size:20});if(!ie(m,D))return;C=K&&K.rows||[],x()}catch{ie(m,D)&&A()}},va)}),u.addEventListener("mousedown",E=>{let D=E.target.closest(".whp-ac-i");D&&(E.preventDefault(),N(Number(D.dataset.i)))}),u.addEventListener("mousemove",E=>{let D=E.target.closest(".whp-ac-i");D&&(S=Number(D.dataset.i),$())}),d.addEventListener("keydown",E=>{u.hidden||!C.length||(E.key==="ArrowDown"?(E.preventDefault(),S=(S+1)%C.length,$()):E.key==="ArrowUp"?(E.preventDefault(),S=(S<=0?C.length:S)-1,$()):E.key==="Enter"?(E.preventDefault(),S>=0?N(S):A()):E.key==="Escape"&&(E.preventDefault(),A()))}),d.addEventListener("blur",()=>A())}Object.keys(ne).forEach(n=>{let i=ne[n],d=e.querySelector("#"+i.code);d&&(d.onkeydown=m=>{m.key==="Enter"&&(m.preventDefault(),et(n))},d.onblur=()=>et(n));let p=e.querySelector("#"+i.go);p&&(p.onclick=()=>et(n));let u=e.querySelector("#"+i.pick);u&&(u.onclick=()=>ba(n)),ga(n)});let xt=e.querySelector("#wh-has-fund"),Et=e.querySelector("#wh-fund-sec");xt&&(xt.onchange=n=>{t.has_fund=!!n.target.checked,Et&&(Et.hidden=!t.has_fund)});let $t=e.querySelector("#wh-has-agent"),St=e.querySelector("#wh-agent-sec");$t&&($t.onchange=n=>{t.has_agent=!!n.target.checked,t.has_agent&&de(),St&&(St.hidden=!t.has_agent)});let Tt=e.querySelector("#wh-frominv");Tt&&(Tt.onclick=()=>cn(e)),[["wh-has-form","wh-form-sec","has_form"],["wh-has-pm","wh-pm-sec","has_pm"]].forEach(([n,i,d])=>{let p=e.querySelector("#"+n),u=e.querySelector("#"+i);p&&(p.onchange=m=>{t[d]=!!m.target.checked,u&&(u.hidden=!t[d])})}),e.querySelector("#wh-form-rd").addEventListener("change",n=>{n.target.name==="wh-form"&&(t.form_type=n.target.value)}),e.querySelector("#wh-pm-rd").addEventListener("change",n=>{if(n.target.name!=="wh-pm")return;t.pay_method=n.target.value;let i=e.querySelector("#wh-pm-other-wrap");i&&(i.hidden=t.pay_method!==Ie)});function hn(){[["wh-payer-name","payer_name"],["wh-payer-tax","payer_tax_id"],["wh-payer-branch","payer_branch"],["wh-payer-addr","payer_address"]].forEach(([n,i])=>{let d=e.querySelector("#"+n);d&&(d.value=t[i]||"")})}function un(){[["wh-payee-name","payee_name"],["wh-payee-tax","payee_tax_id"],["wh-payee-branch","payee_branch"],["wh-payee-addr","payee_address"],["wh-payee-code2","payee_code"]].forEach(([n,i])=>{let d=e.querySelector("#"+n);d&&(d.value=t[i]||"")})}e.querySelector("#wh-add").onclick=()=>{t.lines.push({pay_date:t.pay_date||"",income_type:"SERVICE",description:"",tax_base:0,rate:bt.SERVICE,amount:0,wht_income_category:Ye("SERVICE")}),tt()},v.addEventListener("input",n=>{let i=Number(n.target.dataset.i);if(!Number.isInteger(i)||!t.lines[i])return;let d=n.target.dataset.k;if(d==="tax_base"||d==="rate"){t.lines[i][d]=L(n.target.value),t.lines[i].amount_manual=!1,t.lines[i].amount=Z(L(t.lines[i].tax_base)*L(t.lines[i].rate)/100);let p=v.querySelector(`[data-i="${i}"][data-k="amount"]`);p&&(p.value=t.lines[i].amount),Me()}else d==="amount"?(t.lines[i].amount=L(n.target.value),t.lines[i].amount_manual=!0,Me()):d==="description"&&(t.lines[i].description=n.target.value)}),v.addEventListener("change",n=>{let i=Number(n.target.dataset.i);if(!Number.isInteger(i)||!t.lines[i])return;let d=n.target.dataset.k;if((d==="pay_date"||d==="income_type"||d==="wht_income_category")&&(t.lines[i][d]=n.target.value),d==="pay_date"&&i===0){let p=String(n.target.value||"").trim();t.pay_date=p,t.document_date=p;let u=e.querySelector("#wh-pdate");u&&(u.value=p);let m=e.querySelector("#wh-ddate");m&&(m.value=p)}d==="income_type"&&xa(i)}),v.addEventListener("click",n=>{let i=n.target.closest("[data-del-line]");if(i){if(t.lines.length<=1){f("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","err");return}t.lines.splice(Number(i.dataset.delLine),1),tt()}}),e.querySelector("#wh-save").onclick=n=>pn(e,n.target),e.querySelector("#wh-prev").onclick=w;let Ct=e.querySelector("#wh-del");Ct&&(Ct.onclick=async()=>{if(!t.whtId)return;let n=await be("\u0E25\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E23\u0E34\u0E07)");if(n)try{await ee("del-wht-"+t.whtId,()=>ct(t.whtId,n)),f("\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27","ok"),we(e)}catch(i){f(J(i),"err")}});let kt=e.querySelector("#wh-unpost");kt&&(kt.onclick=async()=>{if(!t.whtId)return;let n=await be("UNPOST \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02 (\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49 \xB7 POST \u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E08\u0E30\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21)");if(n)try{let i=await ee("unpost-wht-"+t.whtId,()=>dt(t.whtId,n));f("UNPOST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07 \u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21 "+(i&&i.document_no||""),"ok"),xe(e,{whtId:t.whtId})}catch(i){f(J(i),"err")}}),_&&(e.querySelectorAll(".whp-form input, .whp-form select, .whp-form textarea").forEach(n=>{n.disabled=!0}),["wh-add","wh-frominv"].forEach(n=>{let i=e.querySelector("#"+n);i&&(i.disabled=!0)}),e.querySelectorAll("#wh-ltb button").forEach(n=>{n.disabled=!0})),tt(),It(e);function tt(){v.innerHTML=t.lines.map((n,i)=>`<tr class="whp-ln">
        
        <td class="center t-3">${i+1}</td>
        <td><select class="sel w100" data-i="${i}" data-k="wht_income_category"
              title="\u0E2B\u0E21\u0E27\u0E14\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E25\u0E07\u0E41\u0E1A\u0E1A 50 \u0E17\u0E27\u0E34">${Ja(n.wht_income_category||"")}</select></td>
        <td><input class="inp w100" type="date" data-i="${i}" data-k="pay_date"
              value="${r(n.pay_date||"")}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${i}" data-k="tax_base"
              value="${n.tax_base}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${i}" data-k="amount"
              value="${n.amount}" title="\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E04\u0E33\u0E19\u0E27\u0E13\u0E17\u0E31\u0E1A"></td>
        <td class="center"><button class="btn btn-danger btn-sm" data-del-line="${i}"
              title="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u{1F5D1}</button></td>
      </tr>
      <tr class="whp-ln2">
        <td></td>
        <td colspan="5"><div class="whp-ln2-g">
          <label>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49 (\u0E23\u0E30\u0E1A\u0E1A)
            <select class="sel" data-i="${i}" data-k="income_type">${Ga(n.income_type)}</select></label>
          <label>\u0E2D\u0E31\u0E15\u0E23\u0E32 %
            <input class="inp r" type="number" step="0.01" min="0" max="100"
              data-i="${i}" data-k="rate" value="${n.rate}"${ia(n)?` readonly title="\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 '\u0E2D\u0E37\u0E48\u0E19 \u0E46' \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07"`:' title="\u0E01\u0E23\u0E2D\u0E01\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E2D\u0E07"'}></label>
          <label>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14
            <input class="inp" data-i="${i}" data-k="description"
              value="${r(n.description||"")}" placeholder="\u0E16\u0E49\u0E32\u0E21\u0E35"></label>
        </div></td>
      </tr>`).join(""),Me()}function xa(n){let i=t.lines[n];if(!i)return;let d=yt(i.income_type);i.rate=d===void 0?0:d,i.amount_manual||(i.amount=Z(L(i.tax_base)*L(i.rate)/100));let p=v.querySelector(`[data-i="${n}"][data-k="rate"]`);p&&(p.value=i.rate,ia(i)?(p.setAttribute("readonly",""),p.title="\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 '\u0E2D\u0E37\u0E48\u0E19 \u0E46' \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07"):(p.removeAttribute("readonly"),p.title="\u0E01\u0E23\u0E2D\u0E01\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E2D\u0E07"));let u=v.querySelector(`[data-i="${n}"][data-k="amount"]`);u&&(u.value=i.amount),Me()}function Me(){let n=0,i=0;for(let p of t.lines)n=Z(n+L(p.tax_base)),i=Z(i+L(p.amount));let d=(p,u)=>{let m=e.querySelector("#"+p);m&&("value"in m?m.value=u:m.textContent=u)};d("wh-t-base",z(n)),d("wh-t-tax",z(i)),d("wh-t-words",i>0?ke(i):"")}}var g=e=>(e||"").trim()||null,ce=e=>/^[0-9]{13}$/.test(String(e??"").replace(/[\s-]/g,"")),Xe=e=>/^[0-9]{5}$/.test(String(e??"").trim()),ge="\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E2A\u0E32\u0E02\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 5 \u0E2B\u0E25\u0E31\u0E01 \u0E40\u0E0A\u0E48\u0E19 00000";function ln(e){if(!e)return"\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23";let s=e.lines||[];return g(e.certificate_no)?e.document_date?e.pay_date?g(e.payer_name)?g(e.payer_tax_id)?ce(e.payer_tax_id)?g(e.payer_branch)&&!Xe(e.payer_branch)?"\u0E2A\u0E32\u0E02\u0E32\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u2014 "+ge:g(e.payee_name)?g(e.payee_tax_id)?ce(e.payee_tax_id)?g(e.payer_citizen_id)&&!ce(e.payer_citizen_id)?"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01)":g(e.payee_citizen_id)&&!ce(e.payee_citizen_id)?"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01)":g(e.payee_branch)&&!Xe(e.payee_branch)?"\u0E2A\u0E32\u0E02\u0E32\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u2014 "+ge:e.has_agent&&g(e.agent_tax_id)&&!ce(e.agent_tax_id)?"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E01\u0E23\u0E30\u0E17\u0E33\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01)":s.length?s.some(o=>!String(o.income_type||"").trim())?"\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49":s.some(o=>!String(o.wht_income_category||"").trim())?"\u0E2B\u0E21\u0E27\u0E14 50 \u0E17\u0E27\u0E34 (\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":s.some(o=>!o.pay_date)?"\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":s.some(o=>!(Number(o.tax_base)>0))?"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)":s.some(o=>L(o.amount)>L(o.tax_base))?"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35 (\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22)":Z(s.reduce((o,c)=>o+L(c.amount),0))>0?g(e.form_type)?g(e.pay_method)?e.pay_method===Ie&&!g(e.pay_method_other)?'\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E20\u0E32\u0E29\u0E35 "\u0E2D\u0E37\u0E48\u0E19 \u0E46"':null:"\u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E20\u0E32\u0E29\u0E35":"\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E19\u0E33\u0E2A\u0E48\u0E07":"\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35 (\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19 0)":"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01)":"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35":"\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35":"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01)":"\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35":"\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35":"\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22":"\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23":"\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"}async function pn(e,s){if(!t)return;if(t.direction!==ue&&!t.customer_id){f("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E01\u0E48\u0E2D\u0E19","err");return}if(!t.lines.length){f("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","err");return}for(let[c,a]of[["payer_citizen_id","\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35"],["payee_citizen_id","\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35"]]){let l=(t[c]||"").trim();if(l&&!ce(l)){f("\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E02\u0E2D\u0E07"+a+" \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01","err");return}}for(let c of t.lines){if(!(c.tax_base>0)){f("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","err");return}if(c.rate<0||c.rate>100){f("\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07 0\u2013100","err");return}if(L(c.amount)<0){f("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E25\u0E1A","err");return}if(L(c.amount)>L(c.tax_base)){f("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22","err");return}}if(!(t.reference_no||"").trim()){let c=ln(t);if(c){f("\u0E22\u0E31\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A \u2014 "+c+" (\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49)","err");return}}{let c=String(t.lines[0]&&t.lines[0].pay_date||"").trim();if(c){t.pay_date=c,t.document_date=c;let a=e&&e.querySelector("#wh-pdate");a&&(a.value=c);let l=e&&e.querySelector("#wh-ddate");l&&(l.value=c)}}let o={wht_id:t.whtId||null,direction:t.direction||ue,customer_id:t.customer_id,certificate_no:(t.certificate_no||"").trim()||null,invoice_id:t.invoice_id||null,document_date:t.document_date||null,pay_date:t.pay_date||null,wht_type:t.lines[0].income_type,reference_no:(t.reference_no||"").trim()||null,note:(t.note||"").trim()||null,book_no:g(t.book_no),ref_date:t.ref_date||null,job_no:g(t.job_no),invoice_no_text:g(t.invoice_no_text),payee_code:g(t.payee_code),payment_by:g(t.payment_by),has_fund:!!t.has_fund,gpf_amount:t.has_fund?g(t.gpf_amount):null,social_security_amount:t.has_fund?g(t.social_security_amount):null,provident_fund_amount:t.has_fund?g(t.provident_fund_amount):null,doc_code:g(t.doc_code),payer_code:g(t.payer_code),payer_citizen_id:g(t.payer_citizen_id),payee_citizen_id:g(t.payee_citizen_id),payer_name:g(t.payer_name),payer_tax_id:g(t.payer_tax_id),payer_branch:g(t.payer_branch),payer_address:g(t.payer_address),wht_mode:t.wht_mode||null,has_acting_agent:!!t.has_agent,agent_name:g(t.agent_name),agent_tax_id:g(t.agent_tax_id),agent_branch:g(t.agent_branch),agent_address:g(t.agent_address),payee_customer_id:t.payee_customer_id||null,payee_name:g(t.payee_name),payee_tax_id:g(t.payee_tax_id),payee_branch:g(t.payee_branch),payee_address:g(t.payee_address),form_type:g(t.form_type),form_seq:g(t.form_seq),pay_method:g(t.pay_method),pay_method_other:t.pay_method===Ie?g(t.pay_method_other):null,signer_name:g(t.signer_name),signer_position:g(t.signer_position),items:t.lines.map(c=>({pay_date:c.pay_date||null,income_type:c.income_type,description:(c.description||"").trim()||null,tax_base:Z(c.tax_base),rate:Z(c.rate),wht_income_category:g(c.wht_income_category),amount:Z(L(c.amount))}))};s&&(s.disabled=!0);try{let c=await ee("save-wht",()=>zt(o));if(c&&c.id){t.whtId=c.id,typeof t.__resetDirty=="function"&&t.__resetDirty();let a=e.querySelector("#wh-prev");if(a&&(a.disabled=!1),c.reference_no!=null){t.reference_no=c.reference_no;let l=e.querySelector("#wh-ref");l&&(l.value=c.reference_no)}if(c.ref_date!=null){t.ref_date=String(c.ref_date).slice(0,10);let l=e.querySelector("#wh-refdate");l&&(l.value=t.ref_date)}if(c.reference_no_issued){t.has_ref=!0;let l=e.querySelector("#wh-refbox-chk");l&&(l.checked=!0);let b=e.querySelector("#wh-refbox");b&&(b.hidden=!1)}f("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01\u0E23\u0E27\u0E21 "+z(c.amount)+(c.reference_no?" \xB7 Reference No. "+c.reference_no:""),"ok"),we(e)}}catch(c){f(J(c),"err")}finally{s&&(s.disabled=!1)}}export{ge as BRANCH5_MSG,nn as WHT_EXPORT_INCOMPLETE_MSG,Fa as WHT_MODES,Xe as isValidBranch5,ce as isValidTaxId13,Gn as render,sn as whtFetchAll,ln as whtPostMissing,rn as whtRowValues};
