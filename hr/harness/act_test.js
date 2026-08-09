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
 const c=await b.newContext({viewport:{width:1366,height:900}});
 let sent=null;
 await c.route('**/rest/v1/rpc/*',r=>{const fn=r.request().url().split('/rpc/')[1].split('?')[0];
  let bd={};try{bd=JSON.parse(r.request().postData()||'{}');}catch(e){}
  if(fn==='njhr_activation_submit'){ sent=bd;
    return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify([{ok:true,message:'ส่งคำขอเปิดใช้งานเรียบร้อยแล้ว กรุณารอ SUPER_ADMIN เชื่อมบัญชี'}])});}
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(F.respond(fn,bd))});});
 const p=await c.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,80)));
 await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForTimeout(1800);

 console.log('ปุ่มบนหน้า Login: '+await p.evaluate(()=>Array.from(document.querySelectorAll('.login-card button')).map(b=>b.innerText.trim()).filter(Boolean).join(' | ')));
 await p.evaluate(()=>document.getElementById('lg-activate').click()); await p.waitForTimeout(600);
 const f=await p.evaluate(()=>({
   fields:Array.from(document.querySelectorAll('#act-f .field > span')).map(x=>x.innerText.replace('*','').trim()),
   eyes:document.querySelectorAll('#act-f [data-eye]').length,
   pwType:document.getElementById('act-pw').type }));
 console.log('ช่องกรอก ('+f.fields.length+'): '+f.fields.join(' · '));
 console.log('ปุ่มรูปตา: '+f.eyes+' ปุ่ม · ช่องรหัสผ่าน type='+f.pwType);

 // กดส่งทั้งที่ว่างเปล่า
 await p.evaluate(()=>document.getElementById('act-go').click()); await p.waitForTimeout(400);
 console.log('\nกดส่งตอนว่าง — ข้อความใต้แต่ละช่อง:');
 (await p.evaluate(()=>Array.from(document.querySelectorAll('.field-err')).map(x=>x.textContent).filter(Boolean))).forEach(x=>console.log('   '+x));

 // ทดสอบเงื่อนไขรหัสผ่านทีละแบบ
 const cases=[['abc','สั้นเกิน'],['abcdefgh','ไม่มีพิมพ์ใหญ่'],['ABCDEFGH','ไม่มีพิมพ์เล็ก'],['Abcdefgh','ไม่มีตัวเลข'],['Abcd1234','ผ่าน']];
 console.log('\nเงื่อนไขรหัสผ่าน:');
 for(const [pw,label] of cases){
   const m=await p.evaluate(v=>{const i=document.getElementById('act-pw');i.value=v;i.dispatchEvent(new Event('blur'));
     return (document.getElementById('act-pw-err')||{}).textContent||'(ผ่าน)';},pw);
   console.log('   '+label.padEnd(16)+' "'+pw+'" → '+m);
 }
 // ยืนยันไม่ตรงกัน
 const m2=await p.evaluate(()=>{const i=document.getElementById('act-pw2');i.value='Xyz98765';i.dispatchEvent(new Event('blur'));
   return (document.getElementById('act-pw2-err')||{}).textContent||'(ผ่าน)';});
 console.log('   ยืนยันไม่ตรงกัน   → '+m2);

 // กรอกครบแล้วส่ง
 await p.evaluate(()=>{
   const v={'act-code':'0501','act-last':'ใจดี','act-nick':'ชาย','act-mail':'somchai@nj.co','act-pw':'Abcd1234','act-pw2':'Abcd1234'};
   Object.keys(v).forEach(k=>{const i=document.getElementById(k);i.value=v[k];i.dispatchEvent(new Event('input'));});
   document.getElementById('act-go').click();});
 await p.waitForTimeout(1200);
 console.log('\nส่งคำขอ — payload ที่ส่งไป SQL:');
 if(sent) Object.keys(sent).forEach(k=>console.log('   '+k+' = '+(k==='p_password'?'(hash ฝั่ง SQL · ส่ง plaintext ผ่าน HTTPS)':sent[k])));
 console.log('Modal ปิดแล้ว: '+await p.evaluate(()=>!document.getElementById('act-f')));
 console.log('pageerror: '+(errs.join(' | ')||'ไม่มี'));
 await b.close(); s.close();
})();
