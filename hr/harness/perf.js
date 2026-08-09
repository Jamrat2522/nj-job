const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('./fixtures.js');
function serve(root, port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
const ROUTES=['#/employees','#/users','#/departments','#/leave','#/reports'];
(async()=>{
 const [dir,port,label]=process.argv.slice(2);
 const s=await serve(dir,Number(port));
 const b=await chromium.launch({args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:1920,height:1080}});
 let reqs=0,bytes=0,rpc=0;
 await ctx.route('**/rest/v1/rpc/*',r=>{rpc++;const fn=r.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
 const p=await ctx.newPage();
 p.on('response',async res=>{reqs++;try{const h=res.headers()['content-length'];if(h)bytes+=Number(h);}catch(e){}});
 const t0=Date.now();
 await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
 const loadMs=Date.now()-t0;
 await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
 const t1=Date.now(); await p.reload({waitUntil:'load'}); await p.waitForTimeout(1200);
 const bootMs=Date.now()-t1;
 const nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return n?{dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}:{};});
 const routeTimes={};
 for(const r of ROUTES){const a=Date.now();await p.evaluate(h=>{location.hash=h;},r);
  await p.waitForFunction(()=>!document.querySelector('#main-view .spinner'),{timeout:5000}).catch(()=>{});
  await p.waitForTimeout(250); routeTimes[r]=Date.now()-a-250;}
 const heap=await p.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null);
 const nodes=await p.evaluate(()=>document.getElementsByTagName('*').length);
 await b.close(); s.close();
 console.log(JSON.stringify({label,loadMs,bootMs,nav,requests:reqs,rpcCalls:rpc,heapMB:heap,domNodes:nodes,routeTimes},null,1));
})();
