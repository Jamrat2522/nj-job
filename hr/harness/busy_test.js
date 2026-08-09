const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const s=await serve('/home/claude/work/hr-v2',8931);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const c=await b.newContext();
 let mode='ok';
 await c.route('**/rest/v1/rpc/*',route=>{const fn=route.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
  const target = fn==='njhr_dept_delete';
  if(!target) return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});
  if(mode==='ok')     return setTimeout(()=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}),1500);
  if(mode==='fail')   return setTimeout(()=>route.fulfill({status:400,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'ลบไม่ได้'})}),1500);
  if(mode==='slow')   return;                    // ไม่ตอบเลย → timeout 13s
 });
 const p=await c.newPage();
 await p.goto('http://127.0.0.1:8931/index.html');await p.waitForTimeout(500);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 await p.reload();await p.waitForTimeout(2200);
 const busy=()=>p.evaluate(()=>document.body.classList.contains('njhr-busy'));
 const btnState=()=>p.evaluate(()=>{const b=document.querySelector('[data-dp-del]');
   if(!b) return 'ไม่มีปุ่ม'; const cs=getComputedStyle(b);
   return 'pointer-events:'+cs.pointerEvents+' opacity:'+cs.opacity;});
 async function go(m,label,routeChange,waitMs){
  mode=m;
  await p.evaluate(()=>{location.hash='#/departments';});await p.waitForTimeout(2200);
  await p.evaluate(()=>{document.querySelector('[data-dp-del]').click();});
  await p.waitForTimeout(400);
  const during=await busy(), st=await btnState();
  if(routeChange){ await p.evaluate(()=>{location.hash='#/dashboard';}); await p.waitForTimeout(300); }
  await p.waitForTimeout(waitMs);
  const after=await busy();
  console.log('  '+label.padEnd(30)+' ระหว่างทำงาน busy='+during+' ('+st+')  →  หลังจบ busy='+after+(after?'  ** ค้าง! **':'  คืนสถานะแล้ว'));
  mode='ok';
 }
 console.log('=== ตรวจ Busy State 4 กรณี ===');
 await go('ok','1. สำเร็จ',false,2500);
 await go('fail','2. ล้มเหลว (400)',false,2500);
 await go('ok','3. เปลี่ยนหน้าระหว่างทำงาน',true,2500);
 await go('slow','4. Timeout (13 วิ)',false,16000);
 await b.close(); s.close();
})();
