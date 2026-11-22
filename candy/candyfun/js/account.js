/* ANIMAL FRIENDS local014 — name-only guest, one browser profile = one save.
 * No authentication, no cloud sync. A name is NOT a security credential.
 * Keep legacy cfa_save_v1 and Supabase cloud rows untouched.
 */
(function (root) {
  'use strict';
  var ID_KEY = 'cfa_guest_device_id_v1';
  var NAME_KEY = 'cfa_guest_player_name_v1';
  var MIGRATION_KEY = 'cfa_guest_legacy_choice_v1';
  var active = false, uid = '', name = '', options = null;
  var $ = function(s) {return document.querySelector(s);};
  var gate = function(){return $('#cf-account-gate');};
  function status(s,bad){var e=$('#cf-sync-status');if(e){e.textContent=s;e.classList.toggle('warn',!!bad);}}
  function notice(s,bad){var e=$('#cf-account-notice');if(e){e.textContent=s||'';e.classList.toggle('bad',!!bad);}}
  function key(){return 'cfa_guest_save_' + uid;}
  function stored(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function put(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
  function newId(){
    if(root.crypto && root.crypto.randomUUID)return root.crypto.randomUUID();
    if(root.crypto && root.crypto.getRandomValues){var a=new Uint8Array(16);root.crypto.getRandomValues(a);return Array.from(a,function(x){return x.toString(16).padStart(2,'0');}).join('');}
    return null;
  }
  function show(){
    gate().hidden=false; gate().dataset.mode='guest';if(!active)$('#app').hidden=true;
    var input=$('#cf-account-player');input.value=name||stored(NAME_KEY)||'';
    input.focus();
  }
  function hasLegacy(){
    try{var d=JSON.parse(stored('cfa_save_v1')||'null');return d && (d.unlocked>1 || d.coins>0 || Object.keys(d.stars||{}).length>0);}catch(e){return false;}
  }
  function chooseLegacy(){return new Promise(function(resolve){
    var p=$('#cf-legacy-choice');
    p.hidden=false;
    p.querySelector('p').textContent='พบเซฟเกมเดิมในเบราว์เซอร์นี้ ต้องการคัดลอกมาเล่นในชื่อใหม่นี้หรือไม่? (ข้อมูลเดิมจะไม่ถูกลบ)';
    p.querySelector('[data-import]').onclick=function(){p.hidden=true;resolve(true);};
    p.querySelector('[data-fresh]').onclick=function(){p.hidden=true;resolve(false);};
  });}
  async function enter(){
    if(active)return;
    if(!uid){
      uid=stored(ID_KEY)||newId();
      if(!uid || !put(ID_KEY,uid)){notice('ไม่สามารถบันทึกข้อมูลบนเครื่องนี้ได้ กรุณาเปิดการเก็บข้อมูลเว็บไซต์',true);show();return;}
    }
    var raw=stored(key());
    if(!raw && !stored(MIGRATION_KEY) && hasLegacy()){
      show();notice('พบข้อมูลเกมเดิม — เลือกว่าจะนำเข้าหรือเริ่มใหม่');
      var yes=await chooseLegacy();
      if(yes){raw=stored('cfa_save_v1');if(raw)put(key(),raw);}
      put(MIGRATION_KEY,yes?'import':'fresh');
    }
    root.CFSave.init({
      read:function(){return stored(key());},
      write:function(json){if(!put(key(),json)){status('⚠️ บันทึกบนเครื่องไม่ได้',true);}else status('✅ บันทึกบนเครื่องแล้ว');}
    });
    if(root.CFPhoto && root.CFPhoto.setUser){try{await root.CFPhoto.setUser('guest_'+uid);}catch(e){/* optional profile picture */}}
    active=true;
    $('#cf-account-name').textContent=name;
    gate().hidden=true;
    status('📱 เซฟในเครื่องนี้');notice('');
    if(options && options.ready)options.ready();
  }
  async function submit(e){
    if(e)e.preventDefault();
    var n=$('#cf-account-player').value.trim().replace(/\s+/g,' ');
    if(n.length<2 || n.length>40){notice('กรุณาใส่ชื่อเล่น 2–40 ตัวอักษร',true);return;}
    if(!put(NAME_KEY,n)){notice('ไม่สามารถจำชื่อผู้เล่นได้ กรุณาอนุญาตการเก็บข้อมูลเว็บไซต์',true);return;}
    name=n;
    if(active){$('#cf-account-name').textContent=name;gate().hidden=true;notice('');return;}
    await enter();
  }
  function rename(){show();notice('เปลี่ยนชื่อได้โดยไม่ลบด่านหรือเหรียญ');}
  async function start(o){
    options=o;
    var form=$('#cf-account-form');form.addEventListener('submit',submit);
    $('#cf-account-out').onclick=rename;
    uid=stored(ID_KEY)||'';name=stored(NAME_KEY)||'';
    if(uid && name && name.length>=2 && name.length<=40){await enter();}
    else show();
  }
  root.CFAccount={start:start,rename:rename,flush:function(){},getUser:function(){return active?{id:uid,name:name}:null;},isActive:function(){return active;}};
})(window);
