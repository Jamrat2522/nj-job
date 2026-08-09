const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const ROUTES=['#/dashboard','#/employees','#/hr-docs','#/attendance','#/requests','#/req-history','#/leave','#/ot',
 '#/payroll','#/salary-merge','#/epayslip','#/approval-settings','#/pay-items','#/sso','#/approvals','#/reports',
 '#/calendar','#/announcements','#/users','#/departments','#/settings','#/geofence','#/shifts','#/audit',
 '#/reportall','#/notifications','#/profile'];
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]);
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 for(const role of ['SUPER_ADMIN','ADMIN','USER','ACCOUNT','EMPLOYEE','HR']){
  const c=await b.newContext();
  await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
   let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
   let out=F.respond(fn,bd);
   if(fn==='njhr_session_check'||fn==='njhr_login'){ out=Object.assign({},out,{role:role}); }
   r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(out)});});
  const p=await c.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(500);
  await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
  await p.reload();await p.waitForTimeout(1500);
  const shown=await p.evaluate(()=>{const e=document.querySelector('.side-user-txt small');return e?e.innerText.trim():'(ไม่มี)';});
  const menu=await p.evaluate(()=>Array.from(document.querySelectorAll('#sidebar a')).map(a=>a.textContent.trim()).filter(Boolean).length);
  const ok=[];
  for(const r of ROUTES){
    await p.evaluate(h=>{location.hash=h;},r);await p.waitForTimeout(120);
    const cur=await p.evaluate(()=>location.hash);
    if(cur===r) ok.push(r);
  }
  console.log(role.padEnd(12)+' แสดงเป็น: '+shown.padEnd(22)+' เมนู '+String(menu).padStart(2)+' รายการ · เข้าได้ '+String(ok.length).padStart(2)+'/27 Route');
  if(role==='USER'||role==='ACCOUNT') console.log('    เข้าได้: '+ok.join(' '));
  await c.close();
 }
 await b.close(); s.close();
})();
