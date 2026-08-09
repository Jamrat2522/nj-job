const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const dir=process.argv[2], port=Number(process.argv[3]), label=process.argv[4];
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const c=await b.newContext();
 const hits={};
 await c.route('**/rest/v1/rpc/*',route=>{const fn=route.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
  hits[fn]=(hits[fn]||0)+1;
  // หน่วง 1.2 วิ เพื่อจำลองเซิร์ฟเวอร์ช้า — เปิดโอกาสให้กดซ้ำได้จริง
  setTimeout(()=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))}),1200);});
 const p=await c.newPage();
 await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(500);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 await p.reload();await p.waitForTimeout(3500);
 await p.evaluate(()=>{location.hash='#/departments';});await p.waitForTimeout(4000);
 // กดปุ่มลบแผนกของแถวแรก → เปิด confirmDialog
 const opened = await p.evaluate(()=>{
   const b=document.querySelector('[data-dp-del]');
   if(b){b.click();return true;} return false;});
 await p.waitForTimeout(3000);
 const hasConfirm = await p.evaluate(()=>{const m=document.querySelector('.modal-title,.modal h3');return m?m.textContent.trim():null;});
 const yes = await p.evaluate(()=>!!document.getElementById('cf-yes'));
 let before={...hits};
 if(yes){
   // กดรัว 5 ครั้งติดกันแบบไม่รอ
   await p.evaluate(()=>{const b=document.getElementById('cf-yes');for(let i=0;i<5;i++) b.click();});
   await p.waitForTimeout(2500);
 }
 const w=Object.keys(hits).filter(k=>/save|delete|set_active|punch|flow/.test(k));
 console.log(label);
 console.log('  เปิดเมนู:'+opened+'  เมนูที่กด:'+hasConfirm+'  พบปุ่มยืนยัน:'+yes);
 console.log('  RPC เขียนที่ถูกยิง: '+(w.length?w.map(k=>k+' × '+hits[k]).join(', '):'ไม่มี'));
 await b.close(); s.close();
})();
