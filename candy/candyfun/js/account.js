/* ANIMAL FRIENDS local012 — account gate and per-player cloud saves.
 * Uses only Supabase Auth + public.animal_game_saves. No access to NJL business tables.
 * Never treats browser localStorage as an authentication proof.
 */
(function (root) {
  'use strict';
  var URL = 'https://sytgqjglcnsabcszbngg.supabase.co';
  var KEY = 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp'; // public browser key
  var db = null, user = null, active = false, dirty = false, saving = false, saveTimer = 0;
  var latest = null, revision = 0, savedRevision = 0, options = null;
  var $ = function (s) { return document.querySelector(s); };
  var gate = function () { return $('#cf-account-gate'); };
  var safe = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  var byUser = function (uid) { return 'cfa_save_user_' + uid; };
  var byPending = function (uid) { return 'cfa_save_pending_' + uid; };
  function status(t, warn) { var el=$('#cf-sync-status');if(el){el.textContent=t;el.classList.toggle('warn',!!warn);} }
  function notice(msg, bad) {var el=$('#cf-account-notice');if(el){el.textContent=msg||'';el.classList.toggle('bad',!!bad);} }
  function screen(which) {var e=gate();if(e){e.hidden=false;e.dataset.mode=which||'login';}$('#app').hidden=true;$('#cf-account-email').focus();}
  function busy(v) {gate().querySelectorAll('button[type=submit]').forEach(function(b){b.disabled=!!v;});}
  function localRead(uid) {try {return localStorage.getItem(byUser(uid));}catch(e){return null;} }
  function localWrite(uid,json) {try {localStorage.setItem(byUser(uid),json); localStorage.setItem(byPending(uid),'1');}catch(e){status('⚠️ บันทึกบนเครื่องไม่ได้',true);} }
  function pending(uid) {try {return localStorage.getItem(byPending(uid))==='1';}catch(e){return false;} }
  function clearPending(uid) {try {localStorage.removeItem(byPending(uid));}catch(e){} }
  function hasLegacy(){try {var s=localStorage.getItem('cfa_save_v1');var d=JSON.parse(s||'null');return d&&(d.unlocked>1||d.coins>0||Object.keys(d.stars||{}).length>0)?s:null;}catch(e){return null;}}
  function cloudRow(uid) {return db.from('animal_game_saves').select('save_data,updated_at').eq('user_id',uid).maybeSingle();}
  function bindSave(json) {
    if (!active || !user) return;
    latest=json; revision++; dirty=true;
    localWrite(user.id,json);status('⏳ กำลังบันทึก…');
    clearTimeout(saveTimer);saveTimer=setTimeout(flush,550);
  }
  async function flush(){
    if(saving || !dirty || !active || !user || !latest)return;
    var uid=user.id, rev=revision, payload=latest;
    saving=true;
    try {
      var result=await db.from('animal_game_saves').upsert({user_id:uid,save_data:JSON.parse(payload),updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(result.error)throw result.error;
      if(uid!==user.id) return;
      savedRevision=Math.max(savedRevision,rev);
      if(rev===revision){dirty=false;clearPending(uid);status('☁️ บันทึกแล้ว');}
    } catch(err){status('⚠️ ยังไม่ซิงก์ ต้องต่ออินเทอร์เน็ต',true);}
    finally{saving=false;if(dirty && revision!==rev && active) {clearTimeout(saveTimer);saveTimer=setTimeout(flush,800);} }
  }
  function hasPendingOtherDeviceWarning(){return !!(user&&pending(user.id));}
  function chooseLegacy(legacy){return new Promise(function(resolve){
    var panel=$('#cf-legacy-choice');panel.hidden=false;
    panel.querySelector('[data-import]').onclick=function(){panel.hidden=true;resolve(legacy);};
    panel.querySelector('[data-fresh]').onclick=function(){panel.hidden=true;resolve(null);};
  });}
  async function activate(u) {
    if(!u || !u.id)throw Error('บัญชีไม่ถูกต้อง');
    active=false;user=u;dirty=false;latest=null;revision=0;savedRevision=0;clearTimeout(saveTimer);
    notice('กำลังโหลดข้อมูลผู้เล่น…'); screen('loading');
    var row=await cloudRow(u.id);
    if(row.error)throw Error('ยังโหลดข้อมูลเกมไม่ได้ ตรวจสอบตาราง animal_game_saves และสิทธิ์ RLS: '+row.error.message);
    var raw=row.data&&row.data.save_data?JSON.stringify(row.data.save_data):null;
    var old=localRead(u.id);
    if (hasPendingOtherDeviceWarning() && old) {
      // Do not silently overwrite remote or discard unsynced changes.
      // Keep local version quarantined until player explicitly chooses.
      notice('พบข้อมูลเกมจากเครื่องนี้ที่ยังไม่ได้ซิงก์ เลือกใช้เซฟใด');
      raw=await new Promise(function(resolve){
        var p=$('#cf-conflict-choice');p.hidden=false;
        p.querySelector('[data-cloud]').onclick=function(){p.hidden=true;clearPending(u.id);resolve(raw);};
        p.querySelector('[data-device]').onclick=function(){p.hidden=true;resolve(old);};
      });
      if(raw===old){var wr=await db.from('animal_game_saves').upsert({user_id:u.id,save_data:JSON.parse(raw),updated_at:new Date().toISOString()},{onConflict:'user_id'});if(wr.error)throw wr.error;clearPending(u.id);}
    }
    if(!raw) {
      var legacy=hasLegacy();if(legacy)raw=await chooseLegacy(legacy);
      if (!raw) raw=JSON.stringify({});
      var created=await db.from('animal_game_saves').upsert({user_id:u.id,save_data:JSON.parse(raw),updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(created.error)throw created.error;
    }
    // Do not copy shared legacy save automatically to a newly created account.
    // Account's cloud row is authoritative once it exists.
    root.CFSave.init({read:function(){return raw;},write:bindSave});
    latest=root.CFSave.exportData();
    try{localStorage.setItem(byUser(u.id),latest);}catch(e){}
    // Avoid applying photos from previously used account on same device.
    if(root.CFPhoto&&root.CFPhoto.setUser)await root.CFPhoto.setUser(u.id);
    active=true;
    if(latest!==raw){ bindSave(latest); }
    $('#cf-account-name').textContent=(u.user_metadata&&u.user_metadata.player_name)||u.email||'ผู้เล่น';
    gate().hidden=true;notice('');if(!dirty)status('☁️ บันทึกแล้ว');
    if(options&&options.ready)options.ready();
  }
  async function signOut(){
    if(saving||dirty){await flush();if(dirty){alert('ข้อมูลเกมยังซิงก์ไม่สำเร็จ กรุณาต่ออินเทอร์เน็ตก่อนออกจากระบบ เพื่อไม่ให้ข้อมูลสูญหาย');return;}}
    active=false;user=null;latest=null;clearTimeout(saveTimer);
    await db.auth.signOut();
    root.CFSave.init({read:function(){return null;},write:function(){}});
    if(root.CFPhoto&&root.CFPhoto.setUser)await root.CFPhoto.setUser('guest');
    if(options&&options.logout)options.logout();
    screen('login');notice('ออกจากระบบแล้ว');
  }
  async function submit(e){
    e.preventDefault();if(!db){notice('เชื่อมต่อระบบสมาชิกไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',true);return;}
    var mode=gate().dataset.mode;var email=$('#cf-account-email').value.trim().toLowerCase();var pass=$('#cf-account-password').value;
    var name=$('#cf-account-player').value.trim();
    if(mode==='newpass'){
      if(pass.length<8){notice('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร',true);return;}
      busy(true);try{var updated=await db.auth.updateUser({password:pass});if(updated.error)throw updated.error;notice('เปลี่ยนรหัสผ่านสำเร็จ');await activate(updated.data.user);}catch(err){notice('ไม่สำเร็จ: '+err.message,true);}finally{busy(false);}return;
    }
    if(!email || !email.includes('@')){notice('กรุณากรอกอีเมลให้ถูกต้อง',true);return;}
    if(mode!=='reset'&&pass.length<8){notice('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',true);return;}
    if(mode==='register'&&(name.length<2||name.length>40)){notice('ชื่อผู้เล่นต้องมี 2–40 ตัวอักษร',true);return;}
    busy(true);notice('กำลังตรวจสอบ…');
    try{
      var r;
      if(mode==='register'){
        r=await db.auth.signUp({email:email,password:pass,options:{data:{player_name:name},emailRedirectTo:location.origin+location.pathname}});
        if(r.error)throw r.error;
        if(!r.data.session){notice('สมัครแล้ว! กรุณาเปิดอีเมลและกดยืนยันบัญชี แล้วกลับมาเข้าสู่ระบบ');screen('login');return;}
      } else if(mode==='reset'){
        r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
        if(r.error)throw r.error;notice('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปทางอีเมลแล้ว');screen('login');return;
      }else {
        r=await db.auth.signInWithPassword({email:email,password:pass});if(r.error)throw r.error;
      }
      if(!r.data.user)throw Error('ยังไม่พบข้อมูลผู้เล่น');
      await activate(r.data.user);
    }catch(err){notice('ไม่สำเร็จ: '+(err.message||'ลองใหม่อีกครั้ง'),true);screen(mode==='register'?'register':'login');}
    finally{busy(false);}
  }
  async function start(o){
    options=o;screen('loading');
    var sb=root.supabase;
    if(!sb||!sb.createClient){screen('login');notice('โหลดระบบสมาชิกไม่ได้ กรุณาต่ออินเทอร์เน็ตแล้วรีเฟรชหน้าเว็บ',true);return;}
    db=sb.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'animal-friends-auth'}});
    gate().querySelector('form').addEventListener('submit',submit);
    gate().querySelectorAll('[data-mode]').forEach(function(b){b.onclick=function(){screen(b.dataset.mode);notice('');};});
    db.auth.onAuthStateChange(function(event,session){
      if(event==='PASSWORD_RECOVERY'){screen('newpass');notice('ตั้งรหัสผ่านใหม่แล้วกดบันทึก');return;}
      if(event==='SIGNED_OUT' && active){
        active=false;user=null;clearTimeout(saveTimer);
        root.CFSave.init({read:function(){return null;},write:function(){}});
        if(options&&options.logout)options.logout();
        screen('login');notice('เซสชันสิ้นสุด กรุณาเข้าสู่ระบบใหม่');
      }
      if(event==='SIGNED_IN' && active && session && session.user && user && session.user.id!==user.id){
        // Never keep an account's game visible after identity switches in another tab.
        active=false;user=null;clearTimeout(saveTimer);
        if(options&&options.logout)options.logout();screen('loading');
        setTimeout(function(){location.reload();},0);
      }
    });
    $('#cf-account-out').onclick=signOut;
    window.addEventListener('online',function(){if(active)flush();});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&active)flush();});
    try {
      var s=await db.auth.getSession();
      if(s.error){screen('login');notice('ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ',true);return;}
      if(!s.data.session){screen('login');notice('');return;}
      var u=await db.auth.getUser();
      if(u.error||!u.data.user){screen('login');notice('กรุณาเข้าสู่ระบบอีกครั้ง');return;}
      await activate(u.data.user);
    }catch(err){screen('login');notice(err.message||'โหลดข้อมูลไม่สำเร็จ',true);}

  }
  root.CFAccount={start:start,signOut:signOut,flush:flush,getUser:function(){return user;},isActive:function(){return active;}};
})(window);
