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
 async function run(mode){
  const c=await b.newContext({viewport:{width:1366,height:900}});
  let hits=0;
  await c.route('**/rest/v1/rpc/*',route=>{const fn=route.request().url().split('/rpc/')[1].split('?')[0];
   let bd={};try{bd=JSON.parse(route.request().postData()||'{}');}catch(e){}
   if(fn==='njhr_dept_delete'){ hits++;
     // ให้ call ตรวจผลกระทบ (p_confirm=false) ผ่านเสมอ จะได้เปิดกล่องยืนยันได้
     if(bd.p_confirm !== true) return route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},body:JSON.stringify({deleted:false,emp_count:3})});
     if(mode==='fail') return setTimeout(()=>route.fulfill({status:400,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'ลบไม่ได้ มีพนักงานอยู่'})}),1200);
     return setTimeout(()=>route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}),1200);
   }
   route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
  const p=await c.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(700);
  await p.evaluate(()=>localStorage.setItem('njhr_token','MOCK-TOKEN-FIXED'));
  await p.reload();await p.waitForTimeout(2500);
  await p.evaluate(()=>{location.hash='#/departments';});await p.waitForTimeout(3000);
  await p.evaluate(()=>{document.querySelector('[data-dp-del]').click();});
  await p.waitForTimeout(2500);
  const before=await p.evaluate(()=>({modal:!!document.getElementById('cf-yes'),
    txt:(document.getElementById('cf-yes')||{}).innerText||''}));
  if(!before.modal){ console.log(mode+': ไม่พบกล่องยืนยัน'); await c.close(); return; }
  // กดรัว 4 ครั้ง
  await p.evaluate(()=>{const b=document.getElementById('cf-yes');for(let i=0;i<4;i++)b.click();});
  await p.waitForTimeout(400);
  const during=await p.evaluate(()=>{const y=document.getElementById('cf-yes'),n=document.getElementById('cf-no');
    return {modalOpen:!!y, yesTxt:y?y.innerText.trim():'', yesDisabled:y?y.disabled:null,
            noDisabled:n?n.disabled:null, aria:y?y.getAttribute('aria-busy'):null};});
  await p.waitForTimeout(2500);
  const after=await p.evaluate(()=>{const y=document.getElementById('cf-yes');
    return {modalOpen:!!y, yesTxt:y?y.innerText.trim():'', yesDisabled:y?y.disabled:null,
            err:(document.getElementById('cf-err')||{}).textContent||''};});
  console.log('=== '+(mode==='fail'?'กรณี Error':'กรณีสำเร็จ')+' ===');
  console.log('  ระหว่างทำงาน: Modal เปิด='+during.modalOpen+' · ปุ่ม="'+during.yesTxt+'" · disabled='+during.yesDisabled+' · ยกเลิก disabled='+during.noDisabled+' · aria-busy='+during.aria);
  console.log('  หลังจบ     : Modal เปิด='+after.modalOpen+' · ปุ่ม="'+after.yesTxt+'" · disabled='+after.yesDisabled+(after.err?' · error="'+after.err+'"':''));
  console.log('  RPC ที่ยิง  : '+hits+' ครั้ง (กด 4 ครั้ง)');
  await c.close();
 }
 await run('ok'); await run('fail');
 await b.close(); s.close();
})();
