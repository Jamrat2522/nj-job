const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');
const F=require('/home/claude/work/harness/fixtures.js');
const ROOT=process.argv[2],PORT=Number(process.argv[3]);
let P=0,FL=0; const chk=(n,ok,e)=>{ok?P++:FL++;console.log((ok?'PASS  ':'FAIL  ')+n.padEnd(58)+(e||''));};
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
let sent=null;
(async()=>{const srv=await serve(ROOT,PORT);const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const errs=[];
 const ctx=await b.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await ctx.route('**/rest/v1/rpc/*',rt=>{const fn=rt.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(rt.request().postData()||'{}');}catch(e){}
  if(fn==='njhr_activation_submit') sent=bd;
  let out=F.respond(fn,bd);
  if((fn==='njhr_login'||fn==='njhr_session_check')&&out&&out.role){out=JSON.parse(JSON.stringify(out));out.role='SUPER_ADMIN';}
  rt.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(out)});});
 await ctx.route('**/storage/v1/**',r=>r.fulfill({status:200,body:'{}'}));
 const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(String(e.message)));
 pg.on('console',m=>{const t=String(m.text());if(m.type()==='error'&&t.indexOf('403')<0&&t.indexOf('400')<0)errs.push(t);});
 await pg.goto('http://127.0.0.1:'+PORT+'/index.html',{waitUntil:'load'});

 // ===== ฟอร์มสมัคร 9 ช่อง =====
 await pg.waitForFunction(()=>!!document.getElementById('lg-user'),{timeout:15000});
 await pg.evaluate(()=>{[].slice.call(document.querySelectorAll('button')).filter(x=>/สมัครสมาชิกครั้งแรก/.test(x.textContent))[0].click();});
 await pg.waitForSelector('#act-len',{timeout:15000});
 const ids=await pg.evaluate(()=>['act-code','act-fnm','act-lnm','act-fen','act-len','act-nick','act-mail','act-pw','act-pw2'].map(i=>!!document.getElementById(i)));
 chk('S1 · ฟอร์มสมัครมีครบ 9 ช่อง', ids.every(Boolean), ids.filter(Boolean).length+'/9');
 const up=await pg.evaluate(()=>{const a=getComputedStyle(document.getElementById('act-fen')).textTransform;
   const c=getComputedStyle(document.getElementById('act-len')).textTransform;
   const th=getComputedStyle(document.getElementById('act-lnm')).textTransform; return {a,c,th};});
 chk('S2 · ช่องอังกฤษบังคับตัวพิมพ์ใหญ่ ช่องไทยไม่บังคับ',
   up.a==='uppercase'&&up.c==='uppercase'&&up.th!=='uppercase', JSON.stringify(up));
 await pg.evaluate(()=>{const V=(i,v)=>document.getElementById(i).value=v;
   V('act-code','0172');V('act-fnm','สมหญิง');V('act-lnm','มีสุข');
   V('act-fen','somying');V('act-len','meesuk');V('act-nick','หญิง');
   V('act-mail','a@b.co');V('act-pw','Abcdef12');V('act-pw2','Abcdef12');
   document.getElementById('act-go').click();});
 await pg.waitForTimeout(900);
 chk('S3 · ส่ง 8 พารามิเตอร์ · อังกฤษเป็นตัวใหญ่', !!sent &&
   sent.p_emp_code==='0172' && sent.p_first_name==='สมหญิง' && sent.p_last_name==='มีสุข' &&
   sent.p_first_name_en==='SOMYING' && sent.p_last_name_en==='MEESUK' &&
   !('p_last_name_th' in sent), JSON.stringify({fe:sent&&sent.p_first_name_en,le:sent&&sent.p_last_name_en}));

 // ===== หน้าจัดการสมาชิก =====
 await pg.evaluate(()=>{const m=document.getElementById('modal-root');if(m)m.innerHTML='';});
 await pg.evaluate(()=>{document.getElementById('lg-user').value='admin';document.getElementById('lg-pass').value='Admin1234';
   document.getElementById('login-form').onsubmit({preventDefault:function(){}});});
 await pg.waitForTimeout(2500);
 await pg.evaluate(()=>{location.hash='#/users';});
 await pg.waitForFunction(()=>/รอสมัคร|รอเชื่อม/.test((document.getElementById('view-host')||{}).innerText||''),{timeout:25000});
 const t=await pg.evaluate(()=>({txt:(document.getElementById('view-host')||{}).innerText||'',
   rows:document.querySelectorAll('#us-body tr').length,
   linkBtn:document.querySelectorAll('[data-act-link]').length,
   menuBtn:document.querySelectorAll('[data-us-menu]').length,
   filters:[].slice.call(document.querySelectorAll('#us-status option')).map(o=>o.textContent)}));
 chk('M1 · แสดง 3 สถานะ', /รอสมัคร/.test(t.txt)&&/รอเชื่อม/.test(t.txt)&&/เชื่อมแล้ว/.test(t.txt), 'แถว='+t.rows);
 chk('M2 · Filter ครบ', ['ทั้งหมด','รอสมัคร','รอเชื่อม','เชื่อมแล้ว'].every(x=>t.filters.indexOf(x)>=0), t.filters.join('/'));
 chk('M3 · แถวรอเชื่อมมีปุ่ม "เชื่อม"', t.linkBtn>0, 'ปุ่ม='+t.linkBtn);
 chk('M4 · แถวที่มีบัญชียังมีเมนู ⋮ (ปุ่มเดิมไม่หาย)', t.menuBtn>0, 'เมนู='+t.menuBtn);
 const pgr=await pg.evaluate(()=>!!document.getElementById('us-pager'));
 chk('M5 · Pagination ยังอยู่', pgr, '');

 // Filter ทำงาน
 await pg.evaluate(()=>{const s=document.getElementById('us-status');s.value='REG_PENDING';s.onchange();});
 await pg.waitForTimeout(1200);
 const f1=await pg.evaluate(()=>({rows:document.querySelectorAll('#us-body tr').length,
   txt:(document.getElementById('view-host')||{}).innerText||''}));
 chk('M6 · Filter "รอเชื่อม" ทำงาน', f1.rows===1&&/รอเชื่อม/.test(f1.txt), 'แถว='+f1.rows);

 // Modal เทียบ Before/After
 await pg.evaluate(()=>{document.querySelector('[data-act-link]').click();});
 await pg.waitForSelector('#actl-go',{timeout:15000});
 const md=await pg.evaluate(()=>{const b=document.querySelector('#modal-root .modal-body');
   return {txt:b.innerText, rows:b.querySelectorAll('.act-cmp').length,
     head:!!b.querySelector('.act-cmp-head'), red:b.querySelectorAll('.act-cmp-o.t-red').length};});
 chk('M7 · Modal เทียบครบ 7 แถว + หัวคอลัมน์', md.rows===8&&md.head, 'act-cmp='+md.rows);
 chk('M8 · แสดงหัวข้อครบ', ['รหัสพนักงาน','ชื่อไทย','นามสกุลไทย','ชื่ออังกฤษ','นามสกุลอังกฤษ','ชื่อเล่น','อีเมล']
   .every(x=>md.txt.indexOf(x)>=0), '');
 chk('M9 · Highlight "ข้อมูลเดิมว่าง"', /ข้อมูลเดิมว่าง — จะเพิ่มข้อมูลใหม่เมื่อกดเชื่อม/.test(md.txt), '');
 chk('M10 · ค่าเดิมว่างถูกทำเครื่องหมาย', md.red>=3, 'ช่องว่าง='+md.red);
 chk('M11 · บอกว่าไม่เปลี่ยนชื่อไทย/แผนก', /ไม่ถูกเปลี่ยน/.test(md.txt)&&/\(ไม่เปลี่ยน\)/.test(md.txt), '');
 chk('CONSOLE · ไม่มี error', errs.length===0, errs.slice(0,2).join(' | ')||'ไม่มี');
 console.log('\n========== สรุป ==========');
 console.log('PASS '+P+' · FAIL '+FL);
 await b.close();srv.close();process.exit(FL?1:0);})();
