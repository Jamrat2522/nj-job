/* บันทึก RPC call ทุกครั้งพร้อม parameter แยกตามช่วง (boot / แต่ละ route) */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const ROUTES=['#/dashboard','#/employees','#/hr-docs','#/attendance','#/requests','#/req-history',
 '#/leave','#/ot','#/payroll','#/salary-merge','#/epayslip','#/approval-settings','#/pay-items',
 '#/sso','#/approvals','#/reports','#/calendar','#/announcements','#/users','#/departments',
 '#/settings','#/geofence','#/shifts','#/audit','#/reportall','#/notifications','#/profile'];
(async()=>{
 const [dir,port,label]=process.argv.slice(2);
 const s=await serve(dir,Number(port));
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const c=await b.newContext();
 let phase='boot'; const log=[];
 await c.route('**/rest/v1/rpc/*',r=>{
  const fn=r.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
  const p=Object.assign({},bd); delete p.p_token;                 // token เท่ากันทุกครั้ง ตัดออก
  log.push({phase,fn,params:JSON.stringify(p),t:Date.now()});
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
 const p=await c.newPage();
 await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(600);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 log.length=0; await p.reload(); await p.waitForTimeout(1600);
 for(const r of ROUTES){ phase=r; await p.evaluate(h=>{location.hash=h;},r); await p.waitForTimeout(1200); }
 phase='กลับ #/employees รอบ 2'; await p.evaluate(()=>{location.hash='#/employees';}); await p.waitForTimeout(700);
 phase='กลับ #/employees รอบ 3'; await p.evaluate(()=>{location.hash='#/dashboard';}); await p.waitForTimeout(300);
 await p.evaluate(()=>{location.hash='#/employees';}); await p.waitForTimeout(700);
 await b.close();s.close();
 // สรุป
 const byPhase={};
 log.forEach(x=>{(byPhase[x.phase]=byPhase[x.phase]||[]).push(x);});
 console.log('=== '+label+' — RPC ต่อช่วง ===');
 let dupTotal=0;
 Object.keys(byPhase).forEach(ph=>{
   const arr=byPhase[ph]; const key={};
   arr.forEach(x=>{const k=x.fn+' '+x.params;(key[k]=key[k]||[]).push(x.t);});
   const dups=Object.entries(key).filter(([k,v])=>v.length>1);
   dupTotal+=dups.reduce((a,[k,v])=>a+v.length-1,0);
   console.log(`\n${ph}  (${arr.length} calls, unique ${Object.keys(key).length})`);
   arr.forEach(x=>console.log('   '+x.fn+'  '+x.params.slice(0,90)));
   dups.forEach(([k,v])=>console.log('   ** ซ้ำ '+v.length+' ครั้ง ห่างกัน '+(v[v.length-1]-v[0])+'ms : '+k.slice(0,100)));
 });
 console.log('\nรวม call '+log.length+' · call ที่ซ้ำแบบเดียวกันในช่วงเดียวกัน '+dupTotal);
 fs.writeFileSync('/home/claude/harness/queries_'+label+'.json',JSON.stringify(log,null,1));
})();
