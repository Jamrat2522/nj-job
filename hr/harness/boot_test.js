const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]),label=process.argv[4];
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox','--allow-file-access-from-files']});
 // http mode
 const c=await b.newContext();
 await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
 const p=await c.newPage(); const req=[],errs=[];
 p.on('request',r=>{const u=r.url();if(u.endsWith('.js'))req.push(u.split('/').pop());});
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message.slice(0,90)));
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,90));});
 await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(2000);
 const appjs=req.filter(x=>x==='app.js').length;
 const boot=await p.evaluate(()=>({cfg:window.NJHR_CONFIG_OK, hasApp:!!document.querySelector('script[data-boot=\"app.js\"]'),
   brand:(document.querySelector('.login-brand h1')||{}).textContent||null,
   form:!!document.getElementById('login-form'), diag:typeof window.NJHR_DIAG}));
 console.log(label+' [http]  app.js โหลด '+appjs+' ครั้ง · CFG_OK='+boot.cfg+' · brand='+boot.brand+' · loginForm='+boot.form+' · NJHR_DIAG='+boot.diag);
 console.log('   script .js ทั้งหมด: '+req.join(', '));
 console.log('   error: '+(errs.filter(e=>!e.includes('403')&&!e.includes('404')).join(' | ')||'ไม่มี'));
 await c.close();
 // file mode
 const c2=await b.newContext(); const p2=await c2.newPage(); const req2=[],errs2=[];
 p2.on('request',r=>{const u=r.url();if(u.endsWith('.js'))req2.push(u.split('/').pop());});
 p2.on('pageerror',e=>errs2.push('PAGEERROR: '+e.message.slice(0,90)));
 await p2.goto('file://'+dir+'/index.html');await p2.waitForTimeout(2500);
 const b2=await p2.evaluate(()=>({cfg:window.NJHR_CONFIG_OK, sw:!!(navigator.serviceWorker&&navigator.serviceWorker.controller),
   brand:(document.querySelector('.login-brand h1')||{}).textContent||null}));
 console.log(label+' [file] app.js โหลด '+req2.filter(x=>x==='app.js').length+' ครั้ง · CFG_OK='+b2.cfg+' · SW='+b2.sw+' · brand='+b2.brand);
 console.log('   error: '+(errs2.join(' | ')||'ไม่มี'));
 await b.close(); s.close();
})();
