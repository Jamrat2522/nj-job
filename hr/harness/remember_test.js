const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http=require('http'),fs=require('fs'),path=require('path');const F=require('./fixtures.js');
function serve(root,port){const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
 return new Promise(r=>{const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){rs.writeHead(404);return rs.end();}
 rs.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});rs.end(fs.readFileSync(f));}).listen(port,()=>r(s));});}
(async()=>{
 const dir=process.argv[2],port=Number(process.argv[3]);
 const s=await serve(dir,port);
 const b=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 async function run(label,{tick,serverSupports}){
  const c=await b.newContext(); const seen=[];
  await c.route('**/rest/v1/rpc/*',route=>{
    const fn=route.request().url().split('/rpc/')[1].split('?')[0];
    let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
    if(fn==='njhr_login'){
      seen.push(Object.keys(bd).sort().join(',')+(('p_remember' in bd)?(' remember='+bd.p_remember):''));
      if(!serverSupports && ('p_remember' in bd))
        return route.fulfill({status:404,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({message:'Could not find the function public.njhr_login(...) in the schema cache'})});
      return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify([{session_token:'TOK',user_id:'user-0001',username:'admin',role:'ADMIN',
          employee_id:'emp-0001',emp_name:'ทดสอบ',full_name:'ทดสอบ'}])});
    }
    route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
  const p=await c.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(1200);
  const def=await p.evaluate(()=>{const e=document.getElementById('lg-remember');return e?e.checked:null;});
  const lbl=await p.evaluate(()=>{const e=document.querySelector('label.check span');return e?e.textContent.trim():'';});
  if(tick) await p.evaluate(()=>{document.getElementById('lg-remember').click();});
  await p.evaluate(()=>{document.getElementById('lg-user').value='admin';document.getElementById('lg-pass').value='x';
                        document.getElementById('lg-btn').click();});
  await p.waitForTimeout(1200);
  const ok=await p.evaluate(()=>location.hash);
  console.log(label.padEnd(46)+' ค่าเริ่มต้น checkbox='+def+' · ยิง '+seen.length+' ครั้ง ['+seen.join(' | ')+'] · ผลลัพธ์ '+(ok==='#/dashboard'?'เข้าระบบสำเร็จ':'ไม่สำเร็จ '+ok));
  if(label.indexOf('1.')===0) console.log('    ข้อความ checkbox: "'+lbl+'"');
  await c.close();
 }
 await run('1. ไม่ติ๊ก · เซิร์ฟเวอร์รองรับ',{tick:false,serverSupports:true});
 await run('2. ติ๊ก · เซิร์ฟเวอร์รองรับ',{tick:true,serverSupports:true});
 await run('3. ติ๊ก · เซิร์ฟเวอร์ยังไม่ติดตั้ง SQL',{tick:true,serverSupports:false});
 await b.close(); s.close();
})();
