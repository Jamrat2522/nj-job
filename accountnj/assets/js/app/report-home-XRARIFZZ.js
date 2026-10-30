import{a as G}from"./chunk-Y5EUV7RM.js";import{a as q}from"./chunk-6REVCVGI.js";import{k as j,v as U}from"./chunk-L5Z2NDJ3.js";import{j as M,m as RI595}from"./chunk-2B2FLIKC.js";import{a as x,b as XJ504,c as f,h as N}from"./chunk-FHYZBT2Q.js";import"./chunk-LAFWE2EM.js";import{e as NE697,g as IE697}from"./chunk-IOOV4VJU.js";import{a as S,b as P}from"./chunk-Q7FMECGI.js";import{e as O}from"./chunk-OPGKUGLK.js";import{a as C}from"./chunk-YM5GFE6V.js";import{a as GS504}from"./chunk-GDT6F23K.js";import{a as h}from"./chunk-OFOOXWUM.js";import"./chunk-LNP7HEMP.js";import{a as E,c as D}from"./chunk-NQOCXXA2.js";import{l as H}from"./chunk-6NADHKLT.js";import"./chunk-SGWIBJH6.js";var V=[{group:"DOCUMENT",no:"1.1",key:"open-jobs",title:"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19",src:"job",queue:"document",note:"\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A: \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E01\u0E14 \u201C\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u201D (operational_status \u2260 CLOSE)"},{group:"ACCOUNTING",no:"2.1",key:"no-invoice",title:"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",src:"job",queue:"pending_invoice",note:"\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E04\u0E34\u0E27 ACCOUNTING: \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01 DOCUMENT \u0E41\u0E25\u0E49\u0E27 \u0E41\u0E25\u0E30 INVOICE \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01 POST"},{group:"ACCOUNTING",no:"2.2",key:"invoice-all",lock:{status:"POSTED"},title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 Invoice \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",src:"inv",note:"INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01"},{group:"ACCOUNTING",no:"2.3",key:"billing-total",title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21",src:"inv",post:"billed",summary:!0,note:"\u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30 INVOICE \u0E17\u0E35\u0E48\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35 (ISSUED + POSTED) \u0E15\u0E32\u0E21 njacc_inv_is_final \u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A"},{group:"FINANCE",no:"3.1",key:"paid",title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27",src:"inv",lock:{payment_status:"PAID"},note:"\u0E25\u0E47\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30 = \u0E04\u0E23\u0E1A (PAID) \u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"},{group:"FINANCE",no:"3.2",key:"outstanding",title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07",src:"inv",post:"outstanding",note:"\u0E43\u0E0A\u0E49\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C outstanding \u0E17\u0E35\u0E48 njacc_report \u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E49 (\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 \u2212 \u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E35\u0E48 POSTED) \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E1C\u0E25\u0E02\u0E2D\u0E07 Credit Note"},{group:"FINANCE",no:"3.3",key:"overdue",title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14",src:"inv",post:"overdue",note:"\u0E43\u0E0A\u0E49\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C overdue \u0E17\u0E35\u0E48 njacc_report \u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E49 (\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A \xB7 \u0E40\u0E25\u0E22 Due Date)"},{group:"FINANCE",no:"3.4",key:"paid-status",title:"\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19",src:"inv",post:"paid-partial",note:"\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E04\u0E23\u0E1A\u201D \u0E2B\u0E23\u0E37\u0E2D \u201C\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19\u201D \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E0A\u0E48\u0E2D\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30 \u2014 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E30\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30"}],I=["DOCUMENT","ACCOUNTING","FINANCE"],k=t=>V.find(e=>e.key===t&&RI595(e.key))||null,T=t=>V.filter(e=>e.group===t&&RI595(e.key));/* V.595 : เฉพาะรายงานย่อยที่ได้รับสิทธิ์ */var st=100,z=3e4,at=1e3,it=120,F=()=>new Date().toISOString().slice(0,10),B=t=>String(t||"").replace(/[\\/?*[\]:]/g," ").slice(0,28)||"DATA";async function W(t,e,o){let n=e.charge_type?[e.charge_type]:P.map(r=>r.key),s=e.company_group?[e.company_group]:S.map(r=>r.key),i=[],a=0;for(let r of n)for(let l of s){if(!M("export",r,l))continue;a+=1;let p=1;for(;;){let u=await H({charge:r,group:l,queue:t.queue,filters:{customer:e.customer_id||null,payment_status:e.payment_status||null,from:e.from||null,to:e.to||null},exportPage:p,exportSize:at});if(u&&u.truncated)throw new Error(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E34\u0E19 ${(u.hard_limit||1e5).toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E04\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48`);let m=u&&u.rows||[];if(i.push(...m),o(i.length),!u||!u.has_more)break;if(p+=1,p>it)throw new Error("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E21\u0E32\u0E01\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E04\u0E1A\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48")}}if(!a)throw new Error("\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17/\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01");return e.status?i.filter(r=>r.invoice_status===e.status):i}/* V.568 : ส่งออกรายงาน (njacc_report · Server จำกัด 100 แถว/หน้า) — หน้าแรกได้ total → หน้าที่เหลือดึงพร้อมกันสูงสุด 4 คำขอ (เดิมทีละหน้าต่อกัน) · ผลเรียงตามหน้าเดิม · ตัวกรอง/สิทธิ์/เพดาน/ตรวจครบ เหมือนเดิม · total เปลี่ยนระหว่างดึง = ไม่ครบ (ยกเลิก) */async function X(t,e){let Q568=n=>G({charge_type:t.charge_type||null,company_group:t.company_group||null,customer_id:t.customer_id||null,status:t.status||null,payment_status:t.payment_status||null,from:t.from||null,to:t.to||null,report_key:t.report_key||null,...(t.company_ids?{company_invoice_ids:String(t.company_ids).split(",").filter(Boolean)}:{}),page:n,size:st}),a=await Q568(1),s=a&&a.total||0,i=a&&a.kpi||{},ch=!1;if(s>z)throw new Error(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${s.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E40\u0E01\u0E34\u0E19\u0E40\u0E1E\u0E14\u0E32\u0E19 ${z.toLocaleString("th-TH")} \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E04\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48`);let r1=a&&a.rows||[],P=[r1],c=r1.length;e(c,s);let N=r1.length?Math.ceil(s/st):1;if(N>1){let nx=2,run=async()=>{for(;;){let p=nx++;if(p>N)return;let b=await Q568(p);(b&&b.total||0)!==s&&(ch=!0);let r=b&&b.rows||[];P[p-1]=r,c+=r.length,e(Math.min(c,s),s)}};await Promise.all(Array.from({length:Math.min(4,N-1)},run))}let o=[];for(let r of P)r&&r.length&&o.push(...r);if(ch||o.length!==s)throw new Error(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A (${o.length}/${s}) \u2014 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01`);return{rows:o,kpi:i||{}}}var Y=t=>t==="ISSUED"||t==="POSTED";function Q(t,e,o){switch(t.post){case"billed":return e.filter(n=>Y(n.status));case"outstanding":return e.filter(n=>Y(n.status)&&Number(n.outstanding)>.005);case"overdue":return e.filter(n=>n.overdue===!0);case"paid-partial":return o.payment_status?e:e.filter(n=>n.payment_status==="PAID"||n.payment_status==="PARTIAL");default:return e}}var b=[["invoice_date","\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE","date"],["invoice_no","\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE"],["charge_type","\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"],["company_group","\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"],["job_no","\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19"],["customer_job_no","Customer Job No."],["customer_name","\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"],["status","\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE"],["payment_status","\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30"],["subtotal","\u0E01\u0E48\u0E2D\u0E19 VAT","num"],["vat_amount","VAT","num"],["wht_amount","WHT","num"],["total_amount","\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21","num"],["received","\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27","num"],["outstanding","\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07","num"],["due_date","Due Date","date"],["overdue","\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14","bool"]],A=["subtotal","vat_amount","wht_amount","total_amount","received","outstanding"];function $(t,e){let[o,,n]=e,s=t[o];return n==="bool"?s===!0?"\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14":"":s==null||s===""?"":n==="date"?D(s):n==="num"?Number(s):s}var ct=t=>[b.map(e=>e[1]),...t.map(e=>b.map(o=>$(e,o)))];function J(t,e,o,n){let s=e.map(()=>""),i=e.findIndex(a=>a[0]===n);return s[i>=0?i:0]="TOTAL",e.forEach((a,r)=>{o.includes(a[0])&&(s[r]=t.reduce((l,p)=>l+(Number(p[a[0]])||0),0))}),s}function K(t,e,o,n){let s=t.utils.aoa_to_sheet(e);s["!cols"]=o.map(a=>({wch:Math.max(10,Math.min(30,String(a[1]).length+6))})),s["!freeze"]={xSplit:0,ySplit:1};let i=t.utils.decode_range(s["!ref"]);for(let a=1;a<=i.e.r;a++)for(let r=0;r<=i.e.c;r++){let l=s[t.utils.encode_cell({r:a,c:r})];l&&typeof l.v=="number"&&n.includes(o[r]&&o[r][0])&&(l.t="n",l.z="#,##0.00")}return s}function lt(t,e){return[["\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23","\u0E04\u0E48\u0E32"],["\u0E08\u0E33\u0E19\u0E27\u0E19 INVOICE (\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35)",Number(t.total_invoice||0)],["\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21",Number(t.invoice_amount||0)],["\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27",Number(t.received||0)],["\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21",Number(t.outstanding||0)],["\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14 (\u0E43\u0E1A)",Number(t.overdue||0)],["\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A (\u0E43\u0E1A)",Number(t.paid||0)],["\u0E0A\u0E33\u0E23\u0E30\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19 (\u0E43\u0E1A)",Number(t.partial||0)],[],["\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E16\u0E27\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49",e.length]]}var ut=["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"];async function Z(t,e,o){let n=o||(()=>{});if(t.src==="job")return{rows:await W(t,e,n),kpi:null,cols:f,money:ut,src:"job"};let{rows:s,kpi:i}=await X(e,n);return{rows:Q(t,s,e),kpi:i,cols:b,money:A,src:"inv"}}async function tt(t,e,o){let n=o||(()=>{});if(t.src==="job"){let u=await W(t,e,n);if(!u.length)return{rows:0};let m=await x(),v=N(u,f);v.push([],J(u,f,["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"],"customer_job_no"));let w=m.utils.book_new();return m.utils.book_append_sheet(w,K(m,v,f,["service_amount","advance_amount","vat_amount","subtotal","wht_amount","net_payable"]),B(t.no.replace(".","_"))),m.writeFile(w,`REPORT_${t.no}_${t.key}_${F()}.xlsx`),{rows:u.length}}let{rows:s,kpi:i}=await X(e,n),a=Q(t,s,e);if(!a.length)return{rows:0};let r=await x(),l=ct(a);l.push([],J(a,b,A,"customer_name"));let p=r.utils.book_new();if(r.utils.book_append_sheet(p,K(r,l,b,A),B(t.no.replace(".","_"))),t.summary){let u=r.utils.aoa_to_sheet(lt(i,a));u["!cols"]=[{wch:34},{wch:20}],r.utils.book_append_sheet(p,u,"SUMMARY")}return r.writeFile(p,`REPORT_${t.no}_${t.key}_${F()}.xlsx`),{rows:a.length}}var pt=["DRAFT","ISSUED","POSTED","VOID"],y=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),dt={DOCUMENT:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>',ACCOUNTING:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 16h4"/></svg>',FINANCE:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/></svg>'},Mt=I.map(t=>({group:t,items:T(t).map((e,o)=>({key:e.key,no:o+1,title:e.title,desc:e.note||"",ready:!0}))})),c={group:"",key:"",mastersLoaded:!1,data:null,page:1,size:20};async function Dt(t,e){let o=e&&e.key||"",n=k(o);c.group=n?n.group:"",c.key=n?n.key:"",t.innerHTML=`
    <div class="rpt2 rpt2-ws rpt504">
      <aside class="rpt2-menu r4-side" aria-label="\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"><div class="r4-side-h"><span>\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</span><button type="button" class="r4-colbtn">\u00AB</button></div>${I.map(mt).join("")}</aside>
      <div class="r4-main"><button type="button" class="r4-mtog" aria-expanded="false"><span class="r4-i">${R4IC.list}</span><span class="r4-mt-t"></span></button><section id="rpt2-panel" class="rpt2-panel"></section></div>
    </div>`;if(!document.getElementById("rpt501-css")){let st=document.createElement("style");st.id="rpt501-css";st.textContent=".rpt2.rpt501{max-width:none}.rpt2.rpt501.rpt2-ws{display:block}.rpt2.rpt501 .rpt2-menu{position:static;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}.rpt2.rpt501 .rpt2-sec{margin-bottom:0;min-width:0}.rpt2.rpt501 .rpt2-body{padding:8px 12px 10px}.rpt2.rpt501 .rpt2-title{white-space:normal;overflow:visible}.rpt2.rpt501 .rpt2-panel{margin-top:14px}.rpt2.rpt501 .rpt2-panel:empty::before{content:'\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E40\u0E21\u0E19\u0E39\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19'}@media (max-width:900px){.rpt2.rpt501 .rpt2-menu{grid-template-columns:1fr;gap:10px}}";document.head.appendChild(st)}let s=t.querySelector(".rpt2");R4side(s);s.addEventListener("click",i=>{let a=i.target.closest(".rpt2-h");if(a){yt(s,a.dataset.grp);return}let r=i.target.closest(".rpt2-item");r&&_t(s,r.dataset.key)}),L(s),c.key&&await et(s)}function mt(t){if(!T(t).length)return"";let e=T(t).map(o=>`
    <button type="button" class="rpt2-item" data-key="${y(o.key)}" title="${y(o.no+" "+o.title)}">
      <span class="r4-dic">${R4IC.doc}</span><span class="rpt2-no">${y(o.no)}</span>
      <span class="rpt2-title">${y(o.title)}</span>
    </button>`).join("");return`<section class="rpt2-sec rpt2-${t.toLowerCase()}" data-sec="${t}">
    <button type="button" class="rpt2-h" data-grp="${t}" aria-expanded="false">
      <span class="rpt2-ic">${dt[t]}</span>
      <span class="rpt2-h-t">${t}</span>
      <span class="rpt2-caret" aria-hidden="true"></span>
    </button>
    <div class="rpt2-body">${e}</div>
  </section>`}function yt(t,e){R4tg(e),L(t)}function L(t){t.querySelectorAll(".rpt2-sec").forEach(e=>{let o=R4op(e.dataset.sec);e.classList.toggle("open",o);let n=e.querySelector(".rpt2-h");n&&n.setAttribute("aria-expanded",o?"true":"false")}),t.querySelectorAll(".rpt2-item").forEach(e=>{e.classList.toggle("on",e.dataset.key===c.key)})}async function _t(t,e){let o=k(e);o&&(c.key=e,c.group=o.group,(c.op504||(c.op504=new Set(I))).add(o.group),R4mclose(t),L(t),await et(t))}async function et(t){let e=t.querySelector("#rpt2-panel"),o=k(c.key);if(!e||!o)return;if(!c.mastersLoaded){e.innerHTML='<div class="load-row"><div class="spin"></div><div class="mt-1">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u2026</div></div>';try{await j(),c.mastersLoaded=!0}catch(r){C(r,"\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}}let n=o.lock||{},s=r=>Object.prototype.hasOwnProperty.call(n,r),i=r=>s(r)?" disabled":"",a=(r,l)=>n[r]===l?" selected":"";e.innerHTML=R4panel(o,n,i,a),c.data=null,c.page=1,e.querySelector("#rpt2-go").onclick=()=>gt(e,o),e.querySelector("#rpt2-xls").onclick=()=>ht(e,o),R4wire(e,o)}function ot(t,e){let o={charge_type:"",company_group:"",customer_id:"",status:"",payment_status:"",from:"",to:""};return t.querySelectorAll("[data-f]").forEach(n=>{o[n.dataset.f]=n.value||""}),Object.assign(o,e.lock||{}),o.report_key=e.key,o}async function gt(t,e){let o=t.querySelector("#rpt2-go"),n=t.querySelector("#rpt2-status"),s=ot(t,e);if(s.from&&s.to&&s.from>s.to){h("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E32\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E16\u0E36\u0E07","err");return}await O("rpt2-show",async()=>{o.disabled=!0;let i=o.textContent;o.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026",n.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026";try{c.data=await R4z(e,s,(a,r)=>{n.textContent=r?`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${a.toLocaleString("th-TH")} / ${r.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`:`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${a.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`}),c.page=1,n.textContent="",nt(t,e)}catch(a){n.textContent="",C(a,"\u0E14\u0E36\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{o.disabled=!1,o.textContent=i}})}function nt503(t,e){let o=t.querySelector("#rpt2-res"),n=t.querySelector("#rpt2-th"),s=t.querySelector("#rpt2-tb"),i=t.querySelector("#rpt2-pgn");if(!o||!c.data)return;let{rows:a,cols:r,money:l,src:p}=c.data;if(o.hidden=!1,t.querySelector("#rpt2-res-t").textContent=`\u0E1E\u0E1A ${a.length.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`,t.querySelector("#rpt2-xls").disabled=!a.length,n.innerHTML="<tr>"+r.map(d=>`<th${l.includes(d[0])?' class="r"':""}>${y(d[1])}</th>`).join("")+"</tr>",!a.length){s.innerHTML=`<tr><td colspan="${r.length}" class="center t-3">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01</td></tr>`,i.innerHTML="";return}let u=a.length,m=Math.max(1,Math.ceil(u/c.size));c.page>m&&(c.page=m);let v=a.slice((c.page-1)*c.size,c.page*c.size),w=(d,g)=>p==="job"?N([d],[g])[1][0]:$(d,g);s.innerHTML=v.map(d=>"<tr>"+r.map(g=>{let _=w(d,g),R=l.includes(g[0]),rt=_==null||_===""?"-":R&&typeof _=="number"?E(_):String(_);return`<td${R?' class="r"':""}>${y(rt)}</td>`}).join("")+"</tr>").join(""),q(i,{page:c.page,size:c.size,total:u},d=>{c.page=d.page,c.size=d.size,nt(t,e)})}async function ht(t,e){let o=t.querySelector("#rpt2-xls"),n=t.querySelector("#rpt2-status"),s=ot(t,e);if(s.from&&s.to&&s.from>s.to){h("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14","err");return}await O("rpt2-export",async()=>{o.disabled=!0;let i=o.innerHTML;o.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u2026",n.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026";try{let a=await XL504(e,s,R4meta(t,e,s),(r,l)=>{n.textContent=l?`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${r.toLocaleString("th-TH")} / ${l.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`:`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${r.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`});a.rows?(n.textContent=`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ${a.rows.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`,h(`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 Excel ${a.rows.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`,"ok")):(n.textContent="\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C",h("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01","err"))}catch(a){n.textContent="",C(a,"\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")}finally{o.disabled=!1,o.innerHTML=i}})}/* \u2550\u2550\u2550 V.504 REPORT REDESIGN : Sidebar \u0E0B\u0E49\u0E32\u0E22 \u00B7 Dashboard \u00B7 \u0E15\u0E32\u0E23\u0E32\u0E07 \u00B7 Export Excel (ExcelJS) / PDF (Preview + \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1B\u0E47\u0E19 PDF) \u2550\u2550\u2550
   \u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E40\u0E14\u0E34\u0E21 (Z = \u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21 \u00B7 \u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07/\u0E2A\u0E39\u0E15\u0E23/\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14) \u2014 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E1F\u0E25\u0E4C */
var R4C = { DOCUMENT: "#2563eb", ACCOUNTING: "#16a34a", FINANCE: "#7c3aed" };
var R4IC = {
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 10"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  xls: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 19h16"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 16.5h7"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'
};
var R4CSS = [
  ".rpt2.rpt504{max-width:none;display:grid;grid-template-columns:268px minmax(0,1fr);gap:16px;align-items:start}",
  ".rpt2.rpt504.r4-col{grid-template-columns:68px minmax(0,1fr)}",
  ".rpt504 .r4-side{position:sticky;top:12px;max-height:calc(100vh - 96px);overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:12px;padding:0 2px 2px 0;scrollbar-width:thin}",
  ".rpt504 .r4-side>*{flex:none}",
  ".rpt504 .r4-side-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 2px 0 4px;font-size:12px;font-weight:600;color:#64748b;letter-spacing:.04em}",
  ".rpt504 .r4-colbtn{flex:none;width:30px;height:30px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;cursor:pointer;font:inherit;font-size:15px;line-height:1;display:grid;place-items:center}",
  ".rpt504 .r4-colbtn:hover{background:#f1f5f9;color:#0f172a}",
  ".rpt504 .rpt2-sec{--c:" + R4C.DOCUMENT + ";--cl:#eff6ff;--cb:#dbeafe;margin:0;border:1px solid #e5eaf2;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04);overflow:hidden}",
  ".rpt504 .rpt2-accounting{--c:" + R4C.ACCOUNTING + ";--cl:#f0fdf4;--cb:#dcfce7}",
  ".rpt504 .rpt2-finance{--c:" + R4C.FINANCE + ";--cl:#f5f3ff;--cb:#ede9fe}",
  ".rpt504 .rpt2-sec.open{border-color:#e5eaf2}",
  ".rpt504 .rpt2-h{padding:12px 14px;gap:10px;background:#fff}",
  ".rpt504 .rpt2-sec.open .rpt2-h{background:var(--cl);border-bottom:1px solid var(--cb)}",
  ".rpt504 .rpt2-h:hover{background:var(--cl)}",
  ".rpt504 .rpt2-ic{width:30px;height:30px;border-radius:8px;background:var(--c);color:#fff;display:grid;place-items:center;padding:6px}",
  ".rpt504 .rpt2-h-t{font-size:14.5px;font-weight:700;letter-spacing:.03em;color:var(--c)}",
  ".rpt504 .rpt2-body{padding:6px 8px 8px}",
  ".rpt504 .rpt2-item{position:relative;gap:9px;padding:9px 10px 9px 12px;margin:2px 0;border:0;border-radius:8px;color:#334155;font-size:13.5px}",
  ".rpt504 .rpt2-item:hover{background:#f4f7fb;border:0}",
  ".rpt504 .rpt2-item.on{background:var(--cl);color:var(--c);font-weight:600}",
  ".rpt504 .rpt2-item.on::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;border-radius:3px;background:var(--c)}",
  ".rpt504 .r4-dic{flex:none;width:17px;height:17px;color:#64748b;display:inline-flex}",
  ".rpt504 .rpt2-item.on .r4-dic{color:var(--c)}",
  ".rpt504 .r4-dic svg,.rpt504 .r4-i svg{width:100%;height:100%;display:block}",
  ".rpt504 .rpt2-item .rpt2-no{min-width:0;height:auto;padding:0;border:0;background:none;color:inherit;font-size:13px;font-weight:600}",
  ".rpt504 .rpt2-item .rpt2-title{white-space:normal;overflow:visible;line-height:1.35}",
  ".rpt504.r4-col .r4-side-h span,.rpt504.r4-col .rpt2-h-t,.rpt504.r4-col .rpt2-caret,.rpt504.r4-col .rpt2-item .rpt2-title,.rpt504.r4-col .r4-dic{display:none}",
  ".rpt504.r4-col .r4-side-h{justify-content:center;padding:0}",
  ".rpt504.r4-col .rpt2-h{justify-content:center;padding:10px 6px}",
  ".rpt504.r4-col .rpt2-body{padding:4px}",
  ".rpt504.r4-col .rpt2-item{justify-content:center;padding:8px 2px}",
  ".rpt504 .r4-main{min-width:0;display:flex;flex-direction:column;gap:14px}",
  ".rpt504 .rpt2-panel{margin:0;min-width:0;display:flex;flex-direction:column;gap:14px}",
  ".rpt504 .rpt2-panel:empty{display:block;min-height:140px;border:1px dashed #cbd5e1;border-radius:12px;background:#fff}",
  ".rpt504 .r4-mtog{display:none}",
  ".rpt504 .r4-crumb{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:13px;color:#64748b;margin:-2px 0 -4px}",
  ".rpt504 .r4-crumb a{color:#64748b;text-decoration:none}.rpt504 .r4-crumb a:hover{color:#1d4ed8}",
  ".rpt504 .r4-crumb .r4-i{width:15px;height:15px;display:inline-flex}",
  ".rpt504 .r4-crumb .sep{color:#cbd5e1}.rpt504 .r4-crumb b{color:#334155;font-weight:600}",
  ".rpt504 .r4-card{background:#fff;border:1px solid #e5eaf2;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.05)}",
  ".rpt504 .r4-head{display:flex;align-items:center;gap:16px;padding:16px 20px}",
  ".rpt504 .r4-hic{flex:none;width:54px;height:54px;border-radius:12px;background:var(--cl);color:var(--c);display:grid;place-items:center;padding:13px}",
  ".rpt504 .r4-hic svg{width:100%;height:100%}",
  ".rpt504 .r4-head h2{margin:0;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3}",
  ".rpt504 .r4-head h2 .no{margin-right:8px}",
  ".rpt504 .r4-head p{margin:3px 0 0;font-size:13px;color:#64748b;line-height:1.5}",
  ".rpt504 .r4-filter{padding:14px 18px 16px}",
  ".rpt504 .r4-fg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 14px;align-items:end}",
  ".rpt504 .r4-f{display:flex;flex-direction:column;gap:5px;min-width:0}",
  ".rpt504 .r4-f>span{font-size:12.5px;font-weight:600;color:#334155}",
  ".rpt504 .r4-f .sel,.rpt504 .r4-f .inp{width:100%;min-width:0;height:40px;border-radius:8px;font-size:13.5px}",
  ".rpt504 .r4-f .sel:disabled,.rpt504 .r4-f .inp:disabled{background:#f1f5f9;color:#64748b;cursor:not-allowed}",
  ".rpt504 .r4-fb{display:flex;gap:12px;grid-column:span 2}",
  ".rpt504 .r4-fb .btn{flex:1 1 0;height:40px;border-radius:8px;justify-content:center;gap:8px;font-size:14px;font-weight:600}",
  ".rpt504 .r4-fb .btn-o{color:#1d4ed8;border-color:#93b4ef;background:#fff}",
  ".rpt504 .r4-fb .btn-p{background:#1d5fd6;border-color:#1d5fd6}",
  ".rpt504 .rpt2-note{margin:0;padding:0 2px}",
  ".rpt504 .rpt2-status{margin:-6px 0 -6px;padding:0 2px;min-height:0}",
  ".rpt504 .rpt2-status:empty{display:none}",
  ".rpt504 .r4-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}",
  ".rpt504 .r4-kpi[hidden]{display:none}",
  ".rpt504 .r4-k{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;min-width:0}",
  ".rpt504 .r4-kic{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;padding:11px;color:var(--k);background:color-mix(in srgb,var(--k) 13%,#fff)}",
  ".rpt504 .r4-kic svg{width:100%;height:100%}",
  ".rpt504 .r4-k .lb{font-size:13px;font-weight:600;color:#334155}",
  ".rpt504 .r4-k .v{margin-top:4px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.15;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
  ".rpt504 .r4-k .u{margin-top:2px;font-size:12px;color:#64748b}",
  ".rpt504 .rpt2-res{margin:0;border:1px solid #e5eaf2;padding:0;overflow:hidden}",
  ".rpt504 .rpt2-res[hidden]{display:none}",
  ".rpt504 .rpt2-res-h{margin:0;padding:12px 16px;border-bottom:1px solid #eef2f7}",
  ".rpt504 .r4-rt{display:flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap}",
  ".rpt504 .r4-rt .r4-i{width:24px;height:24px;color:#1d4ed8;display:inline-flex}",
  ".rpt504 .r4-rt b{font-size:16px;color:#0f172a}",
  ".rpt504 .rpt2-res-t{display:inline-block;padding:3px 10px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:600}",
  ".rpt504 .r4-act{display:flex;gap:8px;flex-wrap:wrap}",
  ".rpt504 .r4-act .btn{height:36px;border-radius:8px;gap:7px;font-weight:600;color:#0f172a;background:#fff;border-color:#cbd5e1}",
  ".rpt504 .r4-act .btn .r4-i{width:17px;height:17px;display:inline-flex}",
  ".rpt504 .r4-act #rpt2-xls .r4-i{color:#15803d}.rpt504 .r4-act #rpt2-pdf .r4-i{color:#b91c1c}",
  ".rpt504 .rpt2-tbl{max-height:calc(100vh - 250px);min-height:120px;overflow:auto;border:0;border-radius:0;margin:0}",
  ".rpt504 .rpt2-tbl .tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}",
  ".rpt504 .rpt2-tbl .tbl th{position:sticky;top:0;z-index:2;background:#eef3fa;color:#1e293b;font-weight:700;font-size:12.5px;padding:10px 12px;border-bottom:1px solid #d9e2ef;border-right:1px solid #e3e9f2;white-space:nowrap;text-align:left}",
  ".rpt504 .rpt2-tbl .tbl td{padding:6px 12px;line-height:1.35;height:auto;border-bottom:1px solid #edf1f6;border-right:1px solid #f1f4f8;white-space:nowrap;color:#1e293b;background:#fff}",
  ".rpt504 .rpt2-tbl .tbl th:last-child,.rpt504 .rpt2-tbl .tbl td:last-child{border-right:0}",
  ".rpt504 .rpt2-tbl .tbl tbody tr:hover td{background:#f3f7ff}",
  ".rpt504 .rpt2-tbl .tbl .r{text-align:right;font-variant-numeric:tabular-nums}",
  ".rpt504 .rpt2-tbl .tbl .c{text-align:center}",
  ".rpt504 .rpt2-tbl .tbl td.r4-no{color:#64748b}",
  ".rpt504 .rpt2-tbl .tbl tfoot td{position:sticky;bottom:0;z-index:1;background:#eaf1fc;font-weight:700;color:#1e3a8a;border-top:1px solid #c9d8f0;border-bottom:0}",
  ".rpt504 .r4b{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.5}",
  ".r4b.ok{background:#dcfce7;color:#166534}.r4b.warn{background:#ffedd5;color:#9a3412}.r4b.info{background:#dbeafe;color:#1e40af}.r4b.bad{background:#fee2e2;color:#991b1b}.r4b.mute{background:#f1f5f9;color:#475569}",
  ".rpt504 #rpt2-pgn{padding:8px 14px;border-top:1px solid #eef2f7}",
  ".rpt504 #rpt2-pgn:empty{display:none}",
  ".rpt504 #rpt2-pgn .pgn{margin:0;flex-wrap:wrap}",
  ".r4-pv{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.6);display:flex;flex-direction:column}",
  ".r4-pv-bar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:#fff;border-bottom:1px solid #e2e8f0}",
  ".r4-pv-bar b{font-size:15px;color:#0f172a;margin-right:auto}",
  ".r4-pv-bar .hint{font-size:12px;color:#64748b}",
  ".r4-pv-bar .btn{height:36px;border-radius:8px;font-weight:600}",
  ".r4-pv-f{flex:1 1 auto;width:100%;border:0;background:#e2e8f0}",
  "@media (max-width:1280px){.rpt504 .r4-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}}",
  "@media (max-width:1100px){.rpt504 .r4-fg{grid-template-columns:repeat(2,minmax(0,1fr))}}",
  "@media (max-width:900px){.rpt2.rpt504,.rpt2.rpt504.r4-col{grid-template-columns:minmax(0,1fr);gap:12px}",
  ".rpt504 .r4-side{position:static;max-height:none;overflow:visible;display:none}",
  ".rpt504.r4-mopen .r4-side{display:flex}",
  ".rpt504 .r4-colbtn{display:none}",
  ".rpt504.r4-col .r4-side-h span,.rpt504.r4-col .rpt2-h-t,.rpt504.r4-col .rpt2-caret,.rpt504.r4-col .rpt2-item .rpt2-title,.rpt504.r4-col .r4-dic{display:revert}",
  ".rpt504.r4-col .rpt2-h,.rpt504.r4-col .rpt2-item{justify-content:flex-start}",
  ".rpt504 .r4-mtog{display:flex;align-items:center;gap:8px;width:100%;height:42px;padding:0 14px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;font:inherit;font-size:14px;font-weight:600;color:#0f172a;cursor:pointer;text-align:left}",
  ".rpt504 .r4-mtog .r4-i{width:18px;height:18px;display:inline-flex;color:#1d4ed8}",
  ".rpt504 .r4-mtog span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".rpt504 .r4-head{padding:14px}.rpt504 .r4-hic{width:44px;height:44px;padding:10px}.rpt504 .r4-head h2{font-size:17px}",
  ".rpt504 .rpt2-tbl{max-height:none}}",
  "@media (max-width:520px){.rpt504 .r4-fg,.rpt504 .r4-kpi{grid-template-columns:minmax(0,1fr)}.rpt504 .r4-fb{grid-column:auto}.rpt504 .rpt2-res-h{flex-direction:column;align-items:stretch}.rpt504 .r4-act .btn{flex:1 1 0}}"
].join("");
var R4KEY = "njacc_rpt504_side";
function R4ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_e) { return null; } return null; }
function R4css() {
  if (document.getElementById("rpt504-css")) return;
  let st = document.createElement("style"); st.id = "rpt504-css"; st.textContent = R4CSS; document.head.appendChild(st);
}
/* ---- Sidebar : \u0E40\u0E1B\u0E34\u0E14/\u0E1B\u0E34\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21\u0E41\u0E22\u0E01\u0E01\u0E31\u0E19 (\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E17\u0E38\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21) \u00B7 \u0E22\u0E48\u0E2D Sidebar \u00B7 Mobile \u0E40\u0E1B\u0E34\u0E14\u2013\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39 ---- */
function R4op(g) { return (c.op504 || (c.op504 = new Set(I))).has(g); }
function R4tg(g) { let s = c.op504 || (c.op504 = new Set(I)); s.has(g) ? s.delete(g) : s.add(g); }
function R4side(s) {
  R4css();
  if (R4ls(R4KEY) === "1") s.classList.add("r4-col");
  let cb = s.querySelector(".r4-colbtn"), mt = s.querySelector(".r4-mtog");
  let syncCol = () => { let on = s.classList.contains("r4-col"); cb.textContent = on ? "\u00BB" : "\u00AB"; cb.title = on ? "\u0E02\u0E22\u0E32\u0E22\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19" : "\u0E22\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"; cb.setAttribute("aria-label", cb.title); };
  syncCol();
  cb.onclick = (ev) => { ev.stopPropagation(); s.classList.toggle("r4-col"); R4ls(R4KEY, s.classList.contains("r4-col") ? "1" : "0"); syncCol(); };
  mt.onclick = () => { let on = s.classList.toggle("r4-mopen"); mt.setAttribute("aria-expanded", on ? "true" : "false"); };
  R4mt(s);
}
function R4mt(s) {
  let mt = s && s.querySelector(".r4-mt-t"), o = k(c.key);
  mt && (mt.textContent = o ? "\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u00B7 " + o.no + " " + o.title : "\u0E40\u0E21\u0E19\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19");
}
function R4mclose(s) { s.classList.remove("r4-mopen"); let m = s.querySelector(".r4-mtog"); m && m.setAttribute("aria-expanded", "false"); R4mt(s); }
/* ---- \u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 : Breadcrumb \u2192 \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \u2192 \u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07 \u2192 \u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E23\u0E38\u0E1B \u2192 \u0E15\u0E32\u0E23\u0E32\u0E07 ---- */
function R4panel(o, n, i, a) {
  let col = R4C[o.group] || R4C.DOCUMENT, cl = { DOCUMENT: "#eff6ff", ACCOUNTING: "#f0fdf4", FINANCE: "#f5f3ff" }[o.group] || "#eff6ff";
  let v697 = o.key === "invoice-all";
  let fld = (lb, html) => `<label class="r4-f"><span>${lb}</span>${html}</label>`;
  return `
    ${v697 ? "" : `    <nav class="r4-crumb" aria-label="breadcrumb"><a href="#/report" class="r4-i" title="Report">${R4IC.home}</a><span class="sep">\u203A</span><a href="#/report">Report</a><span class="sep">\u203A</span><span>${y(o.group)}</span><span class="sep">\u203A</span><b>${y(o.no)} ${y(o.title)}</b></nav>
    <div class="r4-card r4-head" style="--c:${col};--cl:${cl}">
      <div class="r4-hic">${R4IC.doc}</div>
      <div><h2><span class="no">${y(o.no)}</span>${y(o.title)}</h2><p class="rpt2-note">${y(o.note || "")}</p></div>
    </div>`}
    ${v697 ? ST697() : ""}<div class="r4-card r4-filter${v697 ? " r4-f697" : ""}">
      <div class="r4-fg">
        ${v697 ? fld("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", CB697("co")) : ""}${v697 ? "" : `${fld("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", `<select class="sel" data-f="company_group" title="\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"${i("company_group")}>
          <option value="">\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</option>
          ${S.map((r) => `<option value="${r.key}"${a("company_group", r.key)}>${y(r.label)}</option>`).join("")}
        </select>`)}`}
        ${v697 ? fld("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", CB697("cu")) : `${fld("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", `<select class="sel" data-f="customer_id" title="\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"${i("customer_id")}>${U(n.customer_id || "")}</select>`)}`}
        ${v697 ? fld("\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE", `<select class="sel" data-f="status" title="\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE (POSTED \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)" disabled><option value="POSTED" selected>POSTED</option></select>`) : `${fld("\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE", `<select class="sel" data-f="status" title="\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE"${i("status")}>
          <option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          ${pt.map((r) => `<option value="${r}"${a("status", r)}>${r}</option>`).join("")}
        </select>`)}`}
        ${v697 ? "" : `${fld("\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30", `<select class="sel" data-f="payment_status" title="\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30"${i("payment_status")}>
          <option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
          <option value="UNPAID"${a("payment_status", "UNPAID")}>\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30</option>
          <option value="PARTIAL"${a("payment_status", "PARTIAL")}>\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19</option>
          <option value="PAID"${a("payment_status", "PAID")}>\u0E04\u0E23\u0E1A</option>
        </select>`)}`}
        ${fld("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19", `<input class="inp" type="date" data-f="from" title="\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19">`)}
        ${fld("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14", `<input class="inp" type="date" data-f="to" title="\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14">`)}
        <div class="r4-fb">
          <button type="button" class="btn btn-o" id="rpt2-clear">\u27F2 \u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07</button>
          <button type="button" class="btn btn-p" id="rpt2-go">\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</button>
        </div>
      </div>
    </div>
    <p class="rpt2-status" id="rpt2-status"></p>
    <div class="r4-kpi" id="rpt2-kpi" hidden${v697 ? " data-off697" : ""}></div>
    <div class="r4-card rpt2-res" id="rpt2-res" hidden>
      <div class="rpt2-res-h">
        <div class="r4-rt"><span class="r4-i">${R4IC.list}</span><b>${y(R4rt(o))}</b><span class="rpt2-res-t" id="rpt2-res-t"></span></div>
        <div class="r4-act">
          <button type="button" class="btn btn-o btn-sm" id="rpt2-xls"><span class="r4-i">${R4IC.xls}</span>\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 (Excel)</button>
          <button type="button" class="btn btn-o btn-sm" id="rpt2-pdf"><span class="r4-i">${R4IC.pdf}</span>EXPORT PDF</button>${v697 ? `<button type="button" class="btn btn-sm xn697" id="rpt2-xn" disabled title="EXPORT NAME (\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A ACCOUNTING)">\u{1F4E4} EXPORT NAME</button>` : ""}
        </div>
      </div>
      <div class="tbl-wrap rpt2-tbl"><table class="tbl">
        <thead id="rpt2-th"></thead><tbody id="rpt2-tb"></tbody><tfoot id="rpt2-tf"></tfoot></table></div>
      <div id="rpt2-pgn"></div>
    </div>`;
}
/* \u2550\u2550\u2550 V.697 REPORT \u2192 ACCOUNTING \u2192 2.2 รายงาน Invoice ทั้งหมด : ซ่อน Breadcrumb / หัวข้อ / การ์ดสรุป / สถานะชำระ \u00B7 สถานะ INVOICE = POSTED (lock + RUN-697)
   บริษัท = Company Invoice ของ JOB \u00B7 ลูกค้า = Customer ID จริง \u2014 รายชื่อจาก INVOICE POSTED ในขอบเขตสิทธิ์ (njacc_report เดิม) \u00B7 สัมพันธ์กัน \u00B7 EXPORT NAME = รูปแบบเดียวกับ ACCOUNTING (V.506) \u2550\u2550\u2550 */
function ST697() { try { if (document.getElementById("st697-css")) return ""; let s = document.createElement("style"); s.id = "st697-css";
  s.textContent = "[data-off697]{display:none!important}.r4-f697 .cbx{width:100%}.r4-f697 .cbx-inp{width:100%;min-width:0;padding-right:26px}.r4-f697 .cbx-inp::placeholder{color:var(--text-1,#1e293b);opacity:1}.r4-f697 select[data-f=status]:disabled{opacity:1;color:var(--text-1,#1e293b);background-color:#f8fafc;cursor:default}@media (min-width:761px){.rpt2.rpt504 .r4-filter.r4-f697 .r4-fg{grid-template-columns:minmax(130px,1.3fr) minmax(150px,1.5fr) minmax(110px,.8fr) minmax(124px,.8fr) minmax(124px,.8fr) auto}.rpt2.rpt504 .r4-filter.r4-f697 .r4-f .cbx-inp{height:38px;font-size:13px;padding-left:9px}}.rpt504 .r4-act .btn.xn697{background:#9333ea;border-color:#7e22ce;color:#fff}.rpt504 .r4-act .btn.xn697:hover:not(:disabled){background:#7e22ce;border-color:#6b21a8}.rpt504 .r4-act .btn.xn697:active{background:#6b21a8}.rpt504 .r4-act .btn.xn697:disabled{opacity:.6;cursor:not-allowed}"; document.head.appendChild(s); } catch (e) {} return ""; }
var OP697 = null;
function CB697(w) { return w === "co" ? `<div class="co697">${NE697("rpt2-co697", [], "", "\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")}<input type="hidden" data-f="company_ids" value="" data-lb697=""></div>` : `<div class="cu697">${NE697("rpt2-cu697", [], "", "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")}<input type="hidden" data-f="customer_id" value="" data-lb697=""></div>`; }
async function LO697() {
  if (OP697) return OP697;
  let d = await X({ report_key: "invoice-all", status: "POSTED" }, () => {}), rows = (d && d.rows) || [], cu = new Map(), co = new Map(), pair = [];
  rows.forEach((r) => {
    if (r.status !== "POSTED") return;
    let cid = r.customer_id ? String(r.customer_id) : "", nm = String(r.company_invoice || "").replace(/\s+/g, " ").trim(), key = nm.toUpperCase();
    cid && !cu.has(cid) && cu.set(cid, { id: cid, name: String(r.customer_name || "").trim() + (r.customer_code ? " (" + String(r.customer_code).trim() + ")" : "") });
    if (r.company_invoice_id && nm) { let m = co.get(key) || { name: nm, ids: [] }; m.ids.includes(String(r.company_invoice_id)) || m.ids.push(String(r.company_invoice_id)); co.set(key, m); }
    pair.push([cid, r.company_invoice_id ? String(r.company_invoice_id) : ""]);
  });
  let srt = (a, b) => a.name.localeCompare(b.name, "th");
  return (OP697 = { cu: [...cu.values()].sort(srt), co: [...co.values()].sort(srt).map((m) => ({ id: m.ids.sort().join(","), name: m.name })), pair });
}
function MI697(t, o) {
  let cuI = t.querySelector("#rpt2-cu697"), coI = t.querySelector("#rpt2-co697"), cuH = t.querySelector('[data-f="customer_id"]'), coH = t.querySelector('[data-f="company_ids"]');
  if (!cuI || !coI || !cuH || !coH) return;
  let all = (lb) => [{ id: "", name: lb }];
  let okCo = (coId, cu) => !cu || OP697.pair.some((p) => p[0] === cu && coId.split(",").includes(p[1]));
  let okCu = (cuId, co) => !co || OP697.pair.some((p) => p[0] === cuId && co.split(",").includes(p[1]));
  let coList = () => all("\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17").concat(OP697 ? OP697.co.filter((c) => okCo(c.id, cuH.value)) : []);
  let cuList = () => all("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14").concat(OP697 ? OP697.cu.filter((c) => okCu(c.id, coH.value)) : []);
  let set = (h, inp, id, lb, allLb) => { h.value = id || ""; h.dataset.lb697 = id ? lb : ""; id || ((inp.value = ""), (inp.dataset.id = "")); inp.placeholder = allLb; };
  let pick = (h, inp, list, allLb, other) => (id) => {
    let v = String(id || ""), txt = inp.value.trim();
    if (!v && txt && txt !== allLb) return;
    txt === allLb && (inp.value = "");
    let it = list().find((x) => x.id === v);
    set(h, inp, v, it ? it.name : "", allLb);
    other();
  };
  let fixCo = () => { if (coH.value && OP697 && !okCo(coH.value, cuH.value)) set(coH, coI, "", "", "\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"); };
  let fixCu = () => { if (cuH.value && OP697 && !okCu(cuH.value, coH.value)) set(cuH, cuI, "", "", "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"); };
  IE697(t, "rpt2-co697", { getItems: coList, openOnClick: !0, clickShowsAll: !0, fixedList: !0, matchWidth: !0, onChange: pick(coH, coI, coList, "\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", fixCu) });
  IE697(t, "rpt2-cu697", { getItems: cuList, openOnClick: !0, clickShowsAll: !0, fixedList: !0, matchWidth: !0, onChange: pick(cuH, cuI, cuList, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", fixCo) });
  LO697().catch((e) => C(e, "\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"));
  let cl = t.querySelector("#rpt2-clear");
  cl && cl.addEventListener("click", () => { set(coH, coI, "", "", "\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"); set(cuH, cuI, "", "", "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"); coI.value = ""; cuI.value = ""; });
  let xn = t.querySelector("#rpt2-xn");
  xn && (xn.onclick = () => XN697(xn));
}
/* EXPORT NAME : โคลนรูปแบบไฟล์จาก ACCOUNTING V.506 (XN506) ทุกค่า — ชื่อไฟล์ / Sheet / คอลัมน์ / ฟอนต์ / สี / เส้น / ความกว้าง / การเรียง · ข้อมูล = แถวรายงาน 2.2 ที่แสดงอยู่ (POSTED ตามตัวกรอง) · ไม่แก้ XN506 เดิม */
var XV697 = (v) => { let s = v == null ? "" : String(v).trim(); return s; };
function XD697(r, code) {
  let inv = XV697(r.invoice_no);
  (!inv || /^DRAFT-/i.test(inv)) && (inv = "NO INVOICE");
  let na = (v) => XV697(v) || "N/A";
  return [inv, na(r.customs_declaration_no), na(r.customer_job_no), na(code)].join(",");
}
async function XN697(btn) {
  let rows = c.data && Array.isArray(c.data.rows) ? c.data.rows : null;
  if (!rows || !rows.length) return;
  btn && (btn.disabled = !0);
  try {
    try { await j(); } catch (_e) {}
    let cos = (GS504.masters && GS504.masters.companies) || [], cm = new Map(cos.map((x) => [x.id, x.code]));
    let seen = new Set(), out = [];
    for (let r of rows) {
      let key = r && r.id;
      if (!r || r.status !== "POSTED" || seen.has(key)) continue;
      seen.add(key);
      out.push([XV697(r.job_no), XD697(r, r.company_invoice_id ? cm.get(r.company_invoice_id) : "")]);
    }
    out.sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: !0 }));
    let X5 = await XJ504(), wb = new X5.Workbook(), ws = wb.addWorksheet("Page1", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: !0, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" } });
    ws.getColumn(1).width = 21.11; ws.getColumn(2).width = Math.max(60, Math.min(160, Math.max(...out.map((x) => x[1].length), 20) + 6));
    let bd = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    let put = (rn, vals, hd) => {
      let row = ws.getRow(rn); row.height = hd ? 16 : 13.75;
      vals.forEach((v, i) => {
        let cc = row.getCell(i + 1);
        cc.value = v; cc.numFmt = "@";
        cc.font = { name: "Tahoma", size: hd ? 8 : 7, bold: !!hd, color: { argb: "FF000000" } };
        cc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: hd ? "FFFFFFC0" : "FFFFFFFF" } };
        cc.alignment = { horizontal: "left", vertical: "middle", wrapText: !0 };
        cc.border = bd;
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
    h(`EXPORT NAME ${out.length.toLocaleString("th-TH")} JOB`, "ok");
  } catch (e) { C(e, "EXPORT NAME \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"); }
  finally { btn && (btn.disabled = !1); }
}
function R4rt(o) { let r = String(o.title || "").replace(/^\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\s*/, ""); return /^\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23/.test(r) ? r : "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 " + r; }
function R4wire(t, o) {
  o && o.key === "invoice-all" && MI697(t, o);
  let cl = t.querySelector("#rpt2-clear");
  cl && (cl.onclick = () => {
    t.querySelectorAll("[data-f]").forEach((el) => { if (el.disabled) return; el.tagName === "SELECT" ? (el.selectedIndex = 0) : (el.value = ""); });
    let st = t.querySelector("#rpt2-status"); st && (st.textContent = "\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E14 \u201C\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48");
  });
  let pd = t.querySelector("#rpt2-pdf");
  pd && (pd.onclick = () => R4pdf(t, o));
}
/* ---- \u0E04\u0E48\u0E32\u0E43\u0E19\u0E40\u0E0B\u0E25\u0E25\u0E4C (\u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21 : \u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D / PDF) \u2014 \u0E04\u0E48\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A Excel \u0E40\u0E14\u0E34\u0E21 ---- */
var R4ST = new Set(["status", "payment_status", "overdue", "operational_status", "_remaining", "invoice_status"]);
function R4sc(key, v) {
  let s = String(v == null ? "" : v);
  if (!s || s === "-") return "";
  if (key === "payment_status") return { PAID: "ok", UNPAID: "warn", PARTIAL: "info", VOID: "bad" }[s] || "mute";
  if (key === "status" || key === "invoice_status") return { POSTED: "ok", ISSUED: "info", DRAFT: "mute", VOID: "bad" }[s] || "mute";
  if (key === "overdue") return "bad";
  if (key === "operational_status") return { CLOSE: "ok", PROCESSING: "info", OPEN: "mute", CANCELED: "bad" }[s] || "mute";
  if (key === "_remaining") return s === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "ok" : s === "VOID" || s.indexOf("\u0E40\u0E01\u0E34\u0E19") === 0 ? "bad" : s === "\u0E04\u0E23\u0E1A\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49" ? "warn" : s.indexOf("\u0E40\u0E2B\u0E25\u0E37\u0E2D") === 0 ? "warn" : "mute";
  return "";
}
function R4dv(d, g, p, idx) { return p === "job" ? (g[2] === "seq" ? idx + 1 : N([d], [g])[1][0]) : $(d, g); }
function R4al(g, l) { return l.includes(g[0]) || g[2] === "num" ? "r" : g[2] === "date" || g[2] === "seq" || R4ST.has(g[0]) ? "c" : ""; }
function R4txt(v, g, l) { return v == null || v === "" ? "-" : (l.includes(g[0]) || g[2] === "num") && typeof v == "number" ? E(v) : String(v); }
function R4cell(d, g, l, p, idx) {
  let v = R4dv(d, g, p, idx), tx = R4txt(v, g, l), cls = R4al(g, l), sc = R4ST.has(g[0]) ? R4sc(g[0], tx) : "";
  return `<td${cls ? ` class="${cls}"` : ""}>${sc ? `<span class="r4b ${sc}">${y(tx)}</span>` : y(tx)}</td>`;
}
function R4lbl(p) { return p === "job" ? "customer_job_no" : "customer_name"; }
function R4sum(a, key) { return a.reduce((t, x) => t + (Number(x[key]) || 0), 0); }
function R4tot(a, r, l, p) {
  let lk = R4lbl(p), li = r.findIndex((g) => g[0] === lk);
  return r.map((g, ix) => l.includes(g[0]) ? { v: R4sum(a, g[0]), m: 1 } : { v: ix === (li >= 0 ? li : 0) ? "TOTAL" : "", m: 0 });
}
/* ---- \u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E23\u0E38\u0E1B : \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E41\u0E16\u0E27\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E15\u0E32\u0E23\u0E32\u0E07 / Excel / PDF ---- */
function R4kd(o, d) {
  let a = d.rows, n = a.length, nf = (x) => Number(x || 0).toLocaleString("th-TH");
  let cus = new Set(a.map((x) => String(x.customer_name || "").trim()).filter(Boolean)).size;
  let K = (lb, v, u, col, ic) => ({ lb, v, u, col, ic });
  let cnt = (f) => a.filter(f).length;
  if (d.src === "job") return [
    K("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", nf(n), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "#2563eb", "doc"),
    K("\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E23\u0E27\u0E21 (Total Amount)", E(R4sum(a, "net_payable")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"),
    K("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", nf(cus), "\u0E23\u0E32\u0E22", "#ea580c", "users"),
    K("Service charge \u0E23\u0E27\u0E21", E(R4sum(a, "service_amount")), "\u0E1A\u0E32\u0E17", "#7c3aed", "clock")];
  let waiting = cnt((x) => x.status !== "VOID" && (x.payment_status === "UNPAID" || x.payment_status === "PARTIAL"));
  let first = K("\u0E08\u0E33\u0E19\u0E27\u0E19 Invoice \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", nf(n), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "#2563eb", "doc"), cu = K("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", nf(cus), "\u0E23\u0E32\u0E22", "#ea580c", "users");
  switch (o.key) {
    case "paid": return [first, K("\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30", E(R4sum(a, "received")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), cu, K("\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E23\u0E27\u0E21 Invoice", E(R4sum(a, "total_amount")), "\u0E1A\u0E32\u0E17", "#7c3aed", "doc")];
    case "outstanding": return [first, K("\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07", E(R4sum(a, "outstanding")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), cu, K("\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14", nf(cnt((x) => x.overdue === !0)), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "#7c3aed", "alert")];
    case "overdue": return [first, K("\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07", E(R4sum(a, "outstanding")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), cu, K("\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E23\u0E27\u0E21 Invoice", E(R4sum(a, "total_amount")), "\u0E1A\u0E32\u0E17", "#7c3aed", "doc")];
    case "paid-status": return [first, K("\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30", E(R4sum(a, "received")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), K("\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A (PAID)", nf(cnt((x) => x.payment_status === "PAID")), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "#ea580c", "check"), K("\u0E0A\u0E33\u0E23\u0E30\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19 (PARTIAL)", nf(cnt((x) => x.payment_status === "PARTIAL")), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "#7c3aed", "clock")];
    case "billing-total": return [first, K("\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21", E(R4sum(a, "total_amount")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), cu, K("\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30", nf(waiting), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u00B7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30 / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19", "#7c3aed", "clock")];
    default: return [first, K("\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E23\u0E27\u0E21", E(R4sum(a, "total_amount")), "\u0E1A\u0E32\u0E17", "#16a34a", "money"), cu, K("\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30", nf(waiting), "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u00B7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30 / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19", "#7c3aed", "clock")];
  }
}
function R4kpi(t, o) {
  let el = t.querySelector("#rpt2-kpi");
  if (!el || !c.data) return;
  el.innerHTML = R4kd(o, c.data).map((x) => `<div class="r4-card r4-k" style="--k:${x.col}"><div class="r4-kic">${R4IC[x.ic]}</div><div style="min-width:0"><div class="lb">${y(x.lb)}</div><div class="v">${y(x.v)}</div><div class="u">${y(x.u)}</div></div></div>`).join("");
  el.hidden = !1;
}
/* ---- \u0E15\u0E32\u0E23\u0E32\u0E07 (\u0E41\u0E17\u0E19 nt \u0E40\u0E14\u0E34\u0E21) : No. \u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07 \u00B7 \u0E0A\u0E34\u0E14\u0E02\u0E27\u0E32\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 \u00B7 \u0E2A\u0E35\u0E2A\u0E16\u0E32\u0E19\u0E30 \u00B7 TOTAL \u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 \u00B7 Pagination \u0E40\u0E14\u0E34\u0E21 ---- */
function nt(t, e) {
  let o = t.querySelector("#rpt2-res"), n = t.querySelector("#rpt2-th"), s = t.querySelector("#rpt2-tb"), i = t.querySelector("#rpt2-pgn"), tf = t.querySelector("#rpt2-tf");
  if (!o || !c.data) return;
  let { rows: a, cols: r, money: l, src: p } = c.data;
  o.hidden = !1;
  R4kpi(t, e);
  t.querySelector("#rpt2-res-t").textContent = `\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${a.length.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`;
  t.querySelector("#rpt2-xls").disabled = !a.length;
  let pb = t.querySelector("#rpt2-pdf"); pb && (pb.disabled = !a.length);
  let xb697 = t.querySelector("#rpt2-xn"); xb697 && (xb697.disabled = !a.length);
  n.innerHTML = '<tr><th class="c">No.</th>' + r.map((d) => `<th${R4al(d, l) ? ` class="${R4al(d, l)}"` : ""}>${y(d[1])}</th>`).join("") + "</tr>";
  if (!a.length) { s.innerHTML = `<tr><td colspan="${r.length + 1}" class="center t-3">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01</td></tr>`; i.innerHTML = ""; tf && (tf.innerHTML = ""); return; }
  let u = a.length, m = Math.max(1, Math.ceil(u / c.size));
  c.page > m && (c.page = m);
  let b0 = (c.page - 1) * c.size, v = a.slice(b0, b0 + c.size);
  s.innerHTML = v.map((d, ix) => `<tr><td class="c r4-no">${(b0 + ix + 1).toLocaleString("th-TH")}</td>` + r.map((g) => R4cell(d, g, l, p, b0 + ix)).join("") + "</tr>").join("");
  tf && (tf.innerHTML = "<tr><td></td>" + R4tot(a, r, l, p).map((x, ix) => `<td${x.m ? ' class="r"' : ""}>${x.m ? E(x.v) : y(x.v)}</td>`).join("") + "</tr>");
  q(i, { page: c.page, size: c.size, total: u }, (d) => { c.page = d.page; c.size = d.size; nt(t, e); });
}
async function R4z(e, s, cb) { let d = await Z(e, s, cb); c.snap504 = JSON.stringify(s); return d; }
/* ---- \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E2B\u0E31\u0E27 Excel / PDF) ---- */
function R4meta(t, e, s) {
  let tx = (k) => { let el = t.querySelector(`[data-f="${k}"]`); if (el && el.dataset && el.dataset.lb697 != null) return el.dataset.lb697; return el && el.selectedIndex >= 0 && el.options[el.selectedIndex] ? el.options[el.selectedIndex].text.trim() : ""; };
  let pr = (GS504 && GS504.profile) || null, now = new Date(), p2 = (x) => String(x).padStart(2, "0");
  return {
    range: s.from || s.to ? `${s.from ? D(s.from) : "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38"} \u2013 ${s.to ? D(s.to) : "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38"}` : "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    company: s.company_group ? tx("company_group") : s.company_ids ? tx("company_ids") : "\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",
    customer: s.customer_id ? tx("customer_id") : "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    status: s.status || "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    pay: s.payment_status ? `${tx("payment_status")} (${s.payment_status})` : "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    at: `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())} \u0E19.`,
    by: pr && pr.full_name ? pr.full_name + (pr.role ? ` (${pr.role})` : "") : ""
  };
}
/* ---- EXPORT EXCEL (ExcelJS) : \u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D (Z \u0E40\u0E14\u0E34\u0E21) \u00B7 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E40\u0E14\u0E34\u0E21 \u00B7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E1B\u0E47\u0E19 Number \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19 Date ---- */
function R4date(v) {
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v == null ? "" : v));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}
function R4xv(d, g, p, idx) {
  let [k0, , ty] = g, raw = d[k0];
  if (ty === "date") { if (raw == null || raw === "") return null; let dt = R4date(raw); return dt || D(raw); }
  if (ty === "num") { if (raw == null || raw === "") return null; let x = Number(raw); return isNaN(x) ? null : x; }
  if (ty === "seq") return idx + 1;
  if (p === "job") { let v = N([d], [g])[1][0]; return v === "" ? null : v; }
  let v = $(d, g); return v === "" ? null : v;
}
var R4FILL = { ok: ["FFDCFCE7", "FF166534"], warn: ["FFFFEDD5", "FF9A3412"], info: ["FFDBEAFE", "FF1E40AF"], bad: ["FFFEE2E2", "FF991B1B"], mute: ["FFF1F5F9", "FF475569"] };
function R4sheet(X, wb, o, d, meta) {
  let { rows: a, cols: r, money: l, src: p } = d, nC = r.length;
  let ws = wb.addWorksheet(B(o.no.replace(".", "_")), { views: [{ state: "frozen", xSplit: 0, ySplit: 7, showGridLines: !1 }], pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: !0, fitToWidth: 1, fitToHeight: 0 } });
  let bd = (cl) => ({ top: { style: "thin", color: { argb: cl } }, left: { style: "thin", color: { argb: cl } }, bottom: { style: "thin", color: { argb: cl } }, right: { style: "thin", color: { argb: cl } } });
  let fill = (cl) => ({ type: "pattern", pattern: "solid", fgColor: { argb: cl } });
  let FN = "Tahoma";
  let band = (rn, text, font, fl, h) => {
    ws.mergeCells(rn, 1, rn, nC);
    let cell = ws.getCell(rn, 1); cell.value = text; cell.font = Object.assign({ name: FN }, font); cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    fl && (cell.fill = fill(fl)); h && (ws.getRow(rn).height = h);
  };
  band(1, "NJL Logistic", { size: 16, bold: !0, color: { argb: "FF1E3A8A" } }, null, 26);
  band(2, `${o.no}  ${o.title}`, { size: 14, bold: !0, color: { argb: "FFFFFFFF" } }, "FF1E3A8A", 26);
  band(3, `\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ${meta.range}`, { size: 10, color: { argb: "FF334155" } }, "FFEFF6FF", 18);
  band(4, `\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17: ${meta.company}     \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32: ${meta.customer}     \u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE: ${meta.status}     \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30: ${meta.pay}`, { size: 10, color: { argb: "FF334155" } }, "FFEFF6FF", 18);
  band(5, `\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 EXPORT: ${meta.at}${meta.by ? "     \u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E17\u0E33: " + meta.by : ""}     \u0E08\u0E33\u0E19\u0E27\u0E19: ${a.length.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`, { size: 10, color: { argb: "FF334155" } }, "FFEFF6FF", 18);
  let H = 7, hr = ws.getRow(H);
  r.forEach((g, ix) => { let cell = hr.getCell(ix + 1); cell.value = g[1]; cell.font = { name: FN, bold: !0, size: 10, color: { argb: "FF1E3A8A" } }; cell.fill = fill("FFDBEAFE"); cell.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; cell.border = bd("FF9DB7E0"); });
  hr.height = 30;
  let wid = r.map((g) => Math.max(8, String(g[1]).length + 2));
  a.forEach((row, ri) => {
    let xr = ws.getRow(H + 1 + ri), zebra = ri % 2 ? "FFF5F9FF" : "FFFFFFFF";
    r.forEach((g, ix) => {
      let cell = xr.getCell(ix + 1), v = R4xv(row, g, p, ri), isM = l.includes(g[0]) || g[2] === "num";
      cell.value = v;
      cell.font = { name: FN, size: 10, color: { argb: "FF1E293B" } };
      cell.border = bd("FFD6E0EE");
      cell.fill = fill(zebra);
      if (isM && typeof v == "number") { cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right", vertical: "middle" }; }
      else if (v instanceof Date) { cell.numFmt = "dd/mm/yyyy"; cell.alignment = { horizontal: "center", vertical: "middle" }; }
      else if (g[2] === "seq") cell.alignment = { horizontal: "center", vertical: "middle" };
      else if (R4ST.has(g[0])) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        let sc = R4sc(g[0], v); sc && (cell.fill = fill(R4FILL[sc][0]), cell.font = { name: FN, size: 10, bold: !0, color: { argb: R4FILL[sc][1] } });
      } else cell.alignment = { vertical: "middle", wrapText: !1 };
      if (ri < 800) { let len = v == null ? 1 : v instanceof Date ? 10 : typeof v == "number" ? E(v).length : String(v).length; wid[ix] = Math.max(wid[ix], len + 2); }
    });
  });
  let tr = ws.getRow(H + 1 + a.length);
  R4tot(a, r, l, p).forEach((x, ix) => {
    let cell = tr.getCell(ix + 1);
    cell.value = x.m ? x.v : x.v || null;
    cell.font = { name: FN, size: 10.5, bold: !0, color: { argb: "FFFFFFFF" } };
    cell.fill = fill("FF1E3A8A");
    cell.border = bd("FF1E3A8A");
    cell.alignment = x.m ? { horizontal: "right", vertical: "middle" } : { horizontal: "left", vertical: "middle" };
    x.m && (cell.numFmt = "#,##0.00");
  });
  tr.height = 22;
  for (let ix = 0; ix < nC; ix++) ws.getColumn(ix + 1).width = Math.min(48, Math.max(10, wid[ix] || 10));
  ws.autoFilter = { from: { row: H, column: 1 }, to: { row: H + Math.max(a.length, 1), column: nC } };
  return ws;
}
function R4sum2(X, wb, o, d, meta) {
  let ws = wb.addWorksheet("SUMMARY", { views: [{ showGridLines: !1 }] });
  let fill = (cl) => ({ type: "pattern", pattern: "solid", fgColor: { argb: cl } });
  let bd = { top: { style: "thin", color: { argb: "FFD6E0EE" } }, left: { style: "thin", color: { argb: "FFD6E0EE" } }, bottom: { style: "thin", color: { argb: "FFD6E0EE" } }, right: { style: "thin", color: { argb: "FFD6E0EE" } } };
  ws.mergeCells(1, 1, 1, 2); ws.getCell(1, 1).value = `${o.no}  ${o.title} \u2014 SUMMARY`; ws.getCell(1, 1).font = { name: "Tahoma", size: 13, bold: !0, color: { argb: "FFFFFFFF" } }; ws.getCell(1, 1).fill = fill("FF1E3A8A"); ws.getRow(1).height = 24;
  ws.mergeCells(2, 1, 2, 2); ws.getCell(2, 1).value = `\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 EXPORT: ${meta.at}`; ws.getCell(2, 1).font = { name: "Tahoma", size: 10, color: { argb: "FF334155" } };
  lt(d.kpi || {}, d.rows).forEach((row, ri) => {
    let rn = 4 + ri;
    row.forEach((v, ci) => {
      let cell = ws.getCell(rn, ci + 1); cell.value = v; cell.font = { name: "Tahoma", size: 10, bold: ri === 0, color: { argb: ri === 0 ? "FF1E3A8A" : "FF1E293B" } };
      if (!row.length) return;
      cell.border = bd;
      ri === 0 && (cell.fill = fill("FFDBEAFE"));
      ci === 1 && typeof v == "number" && (cell.numFmt = ri >= 2 && ri <= 4 ? "#,##0.00" : "#,##0", cell.alignment = { horizontal: "right" });
    });
  });
  ws.getColumn(1).width = 36; ws.getColumn(2).width = 22;
}
function R4dl(blob, name) {
  let u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8e3);
}
async function XL504(o, s, meta, cb) {
  let d = await Z(o, s, cb || (() => {}));
  if (!d.rows.length) return { rows: 0 };
  let X = await XJ504(), wb = new X.Workbook();
  wb.creator = "NJL Logistic"; wb.created = new Date();
  R4sheet(X, wb, o, d, meta);
  o.summary && d.src === "inv" && R4sum2(X, wb, o, d, meta);
  let buf = await wb.xlsx.writeBuffer();
  if (!buf || !buf.byteLength) throw new Error("\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C Excel \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 (\u0E44\u0E1F\u0E25\u0E4C\u0E27\u0E48\u0E32\u0E07) \u2014 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01");
  R4dl(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `REPORT_${o.no}_${o.key}_${F()}.xlsx`);
  return { rows: d.rows.length };
}
/* ---- EXPORT PDF : \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 HTML (\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E20\u0E32\u0E1E\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D) \u2192 Preview \u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D \u2192 \u0E1E\u0E34\u0E21\u0E1E\u0E4C / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF ---- */
var R4WR = new Set(["customer_name", "note", "contact", "cs_name", "company_invoice", "case_no", "i_billing_apl"]);
function R4pdfHtml(o, d, meta, name) {
  let { rows: a, cols: r, money: l, src: p } = d, col = R4C[o.group] || "#1e3a8a";
  let logo = new URL("assets/img/nj-logo.png", location.href).href, font = "https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap";
  let kp = R4kd(o, d).map((x) => `<div class="k" style="--c:${x.col}"><div class="l">${y(x.lb)}</div><div class="v">${y(x.v)}</div><div class="u">${y(x.u)}</div></div>`).join("");
  let th = '<tr><th>No.</th>' + r.map((g) => `<th>${y(g[1])}</th>`).join("") + "</tr>";
  let body = a.map((row, ix) => `<tr><td class="c">${ix + 1}</td>` + r.map((g) => {
    let v = R4dv(row, g, p, ix), tx = R4txt(v, g, l), al = R4al(g, l), sc = R4ST.has(g[0]) ? R4sc(g[0], tx) : "";
    return `<td class="${al === "r" ? "n" : al === "c" ? "c" : R4WR.has(g[0]) ? "w" : "t"}">${sc ? `<span class="b ${sc}">${y(tx)}</span>` : y(tx)}</td>`;
  }).join("") + "</tr>").join("");
  let tot = '<tr class="tot"><td></td>' + R4tot(a, r, l, p).map((x) => `<td class="${x.m ? "n" : "t"}">${x.m ? E(x.v) : y(x.v)}</td>`).join("") + "</tr>";
  let foot = `NJL Logistic \u00B7 ${o.no} ${o.title}`.replace(/["\\<>]/g, "");
  let fl = [["\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48", meta.range], ["\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", meta.company], ["\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", meta.customer], ["\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE", meta.status], ["\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30", meta.pay], ["\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19", meta.at], ["\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E17\u0E33", meta.by || "-"], ["\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", a.length.toLocaleString("th-TH") + " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"]];
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${y(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${font}">
<style>
@page{size:A4 landscape;margin:9mm 8mm 12mm 8mm;@bottom-left{content:"${foot}";font:7.5pt Prompt,Tahoma,sans-serif;color:#64748b}@bottom-right{content:"Page " counter(page) " / " counter(pages);font:7.5pt Prompt,Tahoma,sans-serif;color:#64748b}}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:Prompt,"Sarabun",Tahoma,sans-serif;color:#0f172a;font-size:8pt;background:#cbd5e1}
.sheet{width:297mm;min-height:210mm;margin:14px auto;background:#fff;padding:9mm 8mm 12mm;box-shadow:0 4px 18px rgba(15,23,42,.25)}
@media print{body{background:#fff}.sheet{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}}
.hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:6px;border-bottom:2px solid #1e3a8a}
.br{display:flex;align-items:center;gap:8px}.br img{height:30px;width:auto}.br b{font-size:15pt;color:#1e3a8a;font-weight:700;letter-spacing:.01em}.br small{display:block;font-size:7pt;color:#64748b;font-weight:400;letter-spacing:.08em}
.hd .rt{text-align:right;font-size:7.5pt;color:#475569;line-height:1.5}
.tb{margin:8px 0 6px;padding:7px 12px;border:1px solid #bfdbfe;border-radius:6px;background:#eff6ff;text-align:center}
.tb h1{margin:0;font-size:13.5pt;color:#1e3a8a;font-weight:700}.tb h1 span{color:${col};margin-right:6px}.tb p{margin:2px 0 0;font-size:7.5pt;color:#475569}
.fl{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #d6e0ee;border-radius:6px;overflow:hidden;margin-bottom:6px}
.fl div{padding:3px 8px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-size:7.5pt;color:#0f172a;min-width:0;overflow-wrap:anywhere}
.fl div:nth-child(4n){border-right:0}.fl div:nth-last-child(-n+4){border-bottom:0}
.fl i{font-style:normal;color:#64748b;margin-right:4px}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:7px}
.k{border:1px solid #e2e8f0;border-left:3px solid var(--c);border-radius:5px;padding:4px 8px}
.k .l{font-size:7pt;color:#475569}.k .v{font-size:11.5pt;font-weight:700;color:var(--c);line-height:1.25}.k .u{font-size:6.5pt;color:#64748b}
.tw{width:100%}
table{width:100%;border-collapse:collapse;font-size:7pt;line-height:1.3}
thead{display:table-header-group}tfoot{display:table-footer-group}
tr{break-inside:avoid;page-break-inside:avoid}
th{background:#e8eef7;color:#1e3a8a;font-weight:600;border:1px solid #c3cfe2;padding:4px 4px;text-align:center;vertical-align:middle}
td{border:1px solid #d9e1ec;padding:3px 4px;vertical-align:top}
td.t{white-space:nowrap}td.w{white-space:normal;overflow-wrap:break-word;max-width:55mm}td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}td.c{text-align:center;white-space:nowrap}
tbody tr:nth-child(even) td{background:#f7faff}
.b{display:inline-block;padding:0 5px;border-radius:7px;font-size:6.6pt;font-weight:600;white-space:nowrap}
.b.ok{background:#dcfce7;color:#166534}.b.warn{background:#ffedd5;color:#9a3412}.b.info{background:#dbeafe;color:#1e40af}.b.bad{background:#fee2e2;color:#991b1b}.b.mute{background:#f1f5f9;color:#475569}
tr.tot td{background:#1e3a8a!important;color:#fff;font-weight:700;border-color:#1e3a8a;font-size:7.5pt}
.nt{margin-top:6px;font-size:7pt;color:#64748b}
</style></head><body><div class="sheet">
<div class="hd"><div class="br"><img src="${logo}" alt=""><b>NJL Logistic<small>LOGISTICS SOLUTIONS</small></b></div><div class="rt">\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A BILLING NJ<br>\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 ${y(meta.at)}</div></div>
<div class="tb"><h1><span>${y(o.no)}</span>${y(o.title)}</h1><p>${y(o.note || "")}</p></div>
<div class="fl">${fl.map(([k2, v2]) => `<div><i>${y(k2)}</i>${y(v2)}</div>`).join("")}</div>
<div class="kp">${kp}</div>
<div class="tw"><table class="dt"><thead>${th}</thead><tbody>${body}${tot}</tbody></table></div>
<p class="nt">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u00B7 \u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07)</p>
</div></body></html>`;
}
function R4fit(doc) {
  let w = doc.querySelector(".tw"), tb = doc.querySelector("table.dt");
  if (!w || !tb) return 1;
  tb.style.zoom = "";
  let W0 = w.getBoundingClientRect().width, z = Math.min(1, W0 / Math.max(1, tb.scrollWidth));
  if (z >= 0.999) return 1;
  z = Math.max(0.4, Math.floor(z * 100) / 100);
  for (let n = 0; n < 60; n++) { tb.style.zoom = String(z); if (tb.getBoundingClientRect().width <= W0 + 0.5 || z <= 0.4) break; z = Math.round((z - 0.01) * 100) / 100; }
  return z;
}
function R4preview(html, name, o) {
  let old = document.querySelector(".r4-pv"); old && old.remove();
  R4css();
  let url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  let el = document.createElement("div");
  el.className = "r4-pv"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="r4-pv-bar"><b>\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 PDF \u2014 ${y(o.no)} ${y(o.title)}</b><span class="hint">\u0E01\u0E14 \u201C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 PDF\u201D \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF / Save as PDF\u201D</span><button type="button" class="btn btn-p" data-pv-dl disabled>\u2B07 \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 PDF</button><button type="button" class="btn btn-o" data-pv-x>\u2715 \u0E1B\u0E34\u0E14</button></div><iframe class="r4-pv-f" title="\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 PDF"></iframe>`;
  document.body.appendChild(el);
  let f = el.querySelector("iframe"), dl = el.querySelector("[data-pv-dl]");
  let close = () => { document.removeEventListener("keydown", esc); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 1e3); };
  let esc = (ev) => { ev.key === "Escape" && close(); };
  document.addEventListener("keydown", esc);
  el.querySelector("[data-pv-x]").onclick = close;
  f.onload = async () => {
    let doc = f.contentDocument;
    try { doc && doc.fonts && (await Promise.race([doc.fonts.ready, new Promise((ok) => setTimeout(ok, 4e3))])); } catch (_e) {}
    doc && R4fit(doc);
    dl.disabled = !1;
  };
  dl.onclick = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (er) { C(er, "\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"); } };
  f.src = url;
  return el;
}
async function R4pdf(t, e) {
  let o = t.querySelector("#rpt2-pdf"), n = t.querySelector("#rpt2-status"), s = ot(t, e);
  if (s.from && s.to && s.from > s.to) { h("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14", "err"); return; }
  await O("rpt2-pdf", async () => {
    o.disabled = !0;
    let i = o.innerHTML;
    o.textContent = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 PDF\u2026"; n.textContent = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 PDF\u2026";
    try {
      let d = c.data && c.snap504 === JSON.stringify(s) ? c.data : await Z(e, s, (a, r) => { n.textContent = r ? `\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${a.toLocaleString("th-TH")} / ${r.toLocaleString("th-TH")} \u0E41\u0E16\u0E27` : `\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 ${a.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`; });
      if (!d.rows.length) { n.textContent = "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07 PDF"; h("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01", "err"); return; }
      let name = `REPORT_${e.no}_${e.key}_${F()}`;
      R4preview(R4pdfHtml(e, d, R4meta(t, e, s), name), name, e);
      n.textContent = `\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 PDF ${d.rows.length.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`;
    } catch (a) { n.textContent = ""; C(a, "\u0E2A\u0E23\u0E49\u0E32\u0E07 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"); }
    finally { o.disabled = !1; o.innerHTML = i; }
  });
}

export{Mt as REPORT_CARDS,Dt as render};
