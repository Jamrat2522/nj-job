/* ถ่าย screenshot ทุกหน้า × 5 ความกว้าง แล้ว hash ไว้เทียบก่อน/หลังแก้ CSS */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const W=[360,390,768,1024,1366];
const ROUTES=['#/dashboard','#/employees','#/attendance','#/leave','#/users','#/departments','#/reports','#/profile'];
(async()=>{
 const [dir,port,out]=process.argv.slice(2);
 fs.mkdirSync(out,{recursive:true});
 const s=await serve(dir,Number(port));
 const b=await chromium.launch({args:['--no-sandbox']});
 const res={};
 for(const w of W){
  const c=await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:1});
  await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
   let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
   r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
  const p=await c.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(500);
  await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
  await p.reload();await p.waitForTimeout(1300);
  for(const r of ROUTES){
   await p.evaluate(h=>{location.hash=h;},r);await p.waitForTimeout(500);
   const name=w+'_'+r.replace('#/','');
   const buf=await p.screenshot({fullPage:false});
   fs.writeFileSync(path.join(out,name+'.png'),buf);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
   res[name]={md5:crypto.createHash('md5').update(buf).digest('hex'),overflow:ov};
  }
  await c.close();
 }
 await b.close();s.close();
 fs.writeFileSync(out+'.json',JSON.stringify(res,null,1));
 const ovc=Object.entries(res).filter(([k,v])=>v.overflow);
 console.log('ถ่าย '+Object.keys(res).length+' ภาพ · horizontal overflow: '+(ovc.length?ovc.map(x=>x[0]).join(', '):'ไม่มี'));
})();
