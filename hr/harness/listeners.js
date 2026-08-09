/* นับ document/window listener ที่ค้าง — ดักที่ addEventListener/removeEventListener ก่อนหน้าโหลด */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const [dir,port,label]=process.argv.slice(2);
 const s=await serve(dir,Number(port));
 const b=await chromium.launch({args:['--no-sandbox']});
 const c=await b.newContext();
 await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
 await c.addInitScript(()=>{
   window.__L={};
   const k=(t,ty)=>(t===document?'document':t===window?'window':t===document.body?'body':'other')+':'+ty;
   const A=EventTarget.prototype.addEventListener, R=EventTarget.prototype.removeEventListener;
   EventTarget.prototype.addEventListener=function(ty,fn,o){
     if(this===document||this===window){const x=k(this,ty);window.__L[x]=(window.__L[x]||0)+1;}
     return A.call(this,ty,fn,o);};
   EventTarget.prototype.removeEventListener=function(ty,fn,o){
     if(this===document||this===window){const x=k(this,ty);window.__L[x]=(window.__L[x]||0)-1;}
     return R.call(this,ty,fn,o);};
 });
 const p=await c.newPage();
 await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(600);
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 await p.reload();await p.waitForTimeout(1400);
 const base=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__L)));
 // เปิดหมวดเมนู flyout แล้วเปลี่ยน route ซ้ำ ๆ
 for(let i=0;i<10;i++){
   await p.evaluate(()=>{const b=document.querySelector('.menu-cat-btn');if(b)b.click();});
   await p.waitForTimeout(60);
   await p.evaluate(h=>{location.hash=h;},i%2?'#/employees':'#/users');
   await p.waitForTimeout(220);
 }
 const after=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__L)));
 console.log(label);
 const keys=new Set([...Object.keys(base),...Object.keys(after)]);
 let leak=0;
 [...keys].sort().forEach(k=>{const d=(after[k]||0)-(base[k]||0);if(d!==0)leak+=d;
   console.log('  '+k.padEnd(24)+' ก่อน '+String(base[k]||0).padStart(3)+' → หลัง '+String(after[k]||0).padStart(3)+(d?'   สะสม +'+d:''));});
 console.log('  รวม listener ค้างเพิ่ม: '+leak);
 await b.close();s.close();
})();
