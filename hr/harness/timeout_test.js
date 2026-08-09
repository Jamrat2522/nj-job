const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const BOOT=['njhr_healthcheck','njhr_session_check','njhr_holiday_list','njhr_leave_queue','njhr_notify_unread','njhr_event_list','njhr_ann_feed','njhr_notify_list'];
(async()=>{
 const dir=process.argv[2]||'/home/claude/work/hr-v2';
 const s=await serve(dir,8901);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const c=await b.newContext();
 let mode='ok', hits={};
 await c.route('**/rest/v1/rpc/*',async route=>{
  const fn=route.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
  const target=(fn==='njhr_emp_list');
  hits[fn]=(hits[fn]||0)+1;
  if(mode==='ok'||!target)
    return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});
  if(mode==='server') return route.fulfill({status:400,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'สิทธิ์ไม่เพียงพอ (จากเซิร์ฟเวอร์)'})});
  if(mode==='net')    return route.abort('connectionrefused');
  if(mode==='slow')   return;                       // ไม่ตอบเลย → ต้องโดน timeout
 });
 const p=await c.newPage();
 const errs=[];
 p.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,120)); });
 await p.goto('http://127.0.0.1:8901/index.html');await p.waitForTimeout(500);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 await p.reload();await p.waitForTimeout(1400);

 async function scene(m,label,waitMs){
  mode=m; hits={}; errs.length=0;
  await p.evaluate(()=>{ location.hash='#/dashboard'; }); await p.waitForTimeout(400);
  const t0=Date.now();
  await p.evaluate(()=>{ location.hash='#/employees'; });
  await p.waitForTimeout(waitMs);
  const ms=Date.now()-t0;
  const txt=await p.evaluate(()=>{const e=document.getElementById('main-view')||document.body;return e.innerText.replace(/\s+/g,' ').slice(0,900);});
  console.log('  '+label.padEnd(30)+' ยิง njhr_emp_list '+String(hits['njhr_emp_list']||0)+' ครั้ง · '+String(ms).padStart(6)+'ms');
  console.log('     หน้าจอ: '+txt.replace(/^.*จัดการ /,'').slice(0,220));
  if(errs.length) console.log('     console: '+errs[0]);
  mode='ok';
 }
 console.log('=== สถานการณ์ทดสอบ (njhr_emp_list = RPC อ่านข้อมูล) ===');
 
 await scene('server','2. เซิร์ฟเวอร์ปฏิเสธ 400',1800);
 await scene('net','3. เครือข่ายล่ม',2500);
 
 await b.close(); s.close();
})();
