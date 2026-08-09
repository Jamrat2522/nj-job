const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]),label=process.argv[4];
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const c=await b.newContext();
 let aborted=0, done=0;
 await c.route('**/rest/v1/rpc/*',route=>{const fn=route.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
  const slow = fn==='njhr_emp_list';
  const finish=()=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
    body:JSON.stringify(F.respond(fn,bd))}).then(()=>{done++;},()=>{aborted++;});
  slow ? setTimeout(finish,3000) : finish();
 });
 const p=await c.newPage();
 const errs=[],failed=[];
 p.on('requestfailed',r=>{ if(r.url().indexOf('/rpc/')>=0) failed.push(r.url().split('/rpc/')[1]+' → '+(r.failure()&&r.failure().errorText)); });
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,100));});
 await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(500);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 await p.reload();await p.waitForTimeout(2000);
 errs.length=0;
 // เข้าหน้าพนักงาน (RPC หน่วง 3 วิ) แล้วเปลี่ยนหน้าทันทีหลัง 500ms
 await p.evaluate(()=>{location.hash='#/employees';});
 await p.waitForTimeout(500);
 await p.evaluate(()=>{location.hash='#/departments';});
 await p.waitForTimeout(4000);
 const txt=await p.evaluate(()=>(document.getElementById('main-view')||document.body).innerText.replace(/\s+/g,' ').slice(0,120));
 const stuck=await p.evaluate(()=>document.body.innerText.indexOf('กำลังโหลด')>=0);
 const busy=await p.evaluate(()=>document.body.classList.contains('njhr-busy'));
 const errToast=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.innerText.trim():'(ไม่มี)';});
 console.log(label);
 console.log('  request ที่ถูกยกเลิก: '+failed.length+(failed.length?('  ['+failed.join(', ')+']'):''));
 console.log('  หน้าจอหลังเปลี่ยน: '+txt.slice(0,90));
 console.log('  ค้าง "กำลังโหลด": '+stuck+'   body busy ค้าง: '+busy);
 console.log('  toast ที่แสดง: '+errToast);
 console.log('  console error: '+(errs.length?errs.slice(0,2).join(' | '):'ไม่มี'));
 await b.close(); s.close();
})();
