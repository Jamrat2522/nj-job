const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const W=[360,390,768,1024,1280,1366,1440,1920];
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]),label=process.argv[4];
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 console.log('=== '+label+' ===');
 for(const w of W){
  const c=await b.newContext({viewport:{width:w,height:900}});
  await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
   let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
   r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
  const p=await c.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(500);
  await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
  await p.reload();await p.waitForTimeout(1300);
  await p.evaluate(()=>{location.hash='#/employees';});await p.waitForTimeout(1700);
  const r=await p.evaluate(()=>{
    const vw=document.documentElement.clientWidth;
    const tb=document.querySelector('.emp-filters');
    const btns=Array.from(tb.querySelectorAll('button')).map(x=>x.textContent.trim()||x.id);
    const sel=tb.querySelectorAll('select').length;
    const inp=tb.querySelectorAll('input').length;
    const over=[];document.querySelectorAll('*').forEach(el=>{const b=el.getBoundingClientRect();
      if(b.right>vw+1)over.push(el.id||el.className.toString().slice(0,20));});
    const tap=Array.from(tb.querySelectorAll('button,select,input')).map(x=>Math.round(x.getBoundingClientRect().height));
    return {vw,docW:document.documentElement.scrollWidth,tbH:Math.round(tb.getBoundingClientRect().height),
            btns,sel,inp,over:over.slice(0,3),minTap:Math.min.apply(null,tap)};});
  console.log('  '+String(w).padStart(4)+'px  ล้น '+String(r.docW-r.vw).padStart(4)+'px  สูง '+String(r.tbH).padStart(3)+'px  ปุ่ม '+r.btns.length+' · select '+r.sel+' · input '+r.inp+'  สูงต่ำสุด '+r.minTap+'px'+(r.over.length?'  ล้น:'+r.over.join(','):''));
  await c.close();
 }
 await b.close(); s.close();
})();
