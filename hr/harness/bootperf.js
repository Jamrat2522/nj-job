const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]),label=process.argv[4],lag=Number(process.argv[5]||200);
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const runs=[];
 for(let i=0;i<3;i++){
  const c=await b.newContext({storageState:{cookies:[],origins:[{origin:'http://127.0.0.1:'+port,
    localStorage:[{name:'njhr_token',value:'MOCK-TOKEN-FIXED'}]}]}});
  const seq=[];
  await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
   let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
   seq.push(fn);
   setTimeout(()=>r.fulfill({status:200,contentType:'application/json',
     headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))}), lag);});
  const p=await c.newPage();
  const t0=Date.now();
  await p.goto(`http://127.0.0.1:${port}/index.html`);
  await p.waitForFunction(()=>{const m=document.getElementById('main-view');return m&&m.innerText.length>200;},{timeout:20000}).catch(()=>{});
  runs.push({ms:Date.now()-t0, n:seq.length});
  await c.close();
 }
 const v=runs.map(x=>x.ms).sort((a,b)=>a-b);
 console.log(label+'  (หน่วง '+lag+' ms/RPC)  เวลาจนเห็น Dashboard = '+v[1]+' ms   [รอบ: '+runs.map(x=>x.ms).join(', ')+']  RPC '+runs[0].n+' ครั้ง');
 await b.close(); s.close();
})();
