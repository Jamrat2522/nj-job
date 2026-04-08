// 🔐 Keys — anon key ปลอดภัยที่จะ expose (Supabase ออกแบบมาแบบนี้)
// ป้องกันด้วย RLS ใน Supabase แทน
const _k=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dGdxamdsY25zYWJjc3pibmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjYwNDgsImV4cCI6MjA4OTc0MjA0OH0",
  "mBXShyx6YSKxwWgFfwprg_tbAg-LZ3ODZtQ3V2qIF3g"].join(".");
const SUPA_URL="https://sytgqjglcnsabcszbngg.supabase.co";
const SUPA_KEY=_k;
const SH={"Content-Type":"application/json","apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,"Prefer":"return=representation"};
const API=SUPA_URL+"/rest/v1";
const DEMO=false;

// 🔑 SHA-256 Hash password ก่อนเก็บ
async function hashPassword(pw){
  const enc=new TextEncoder().encode(pw);
  const buf=await crypto.subtle.digest("SHA-256",enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function sbGet(t,q=""){
  const ctrl=new AbortController();
  const tid=setTimeout(()=>ctrl.abort(),10000);
  try{
    const r=await fetch(API+"/"+t+(q?"?"+q:""),{
      headers:{...SH,"Cache-Control":"no-store"}, // Supabase auth ต้อง no-store
      signal:ctrl.signal
    });
    clearTimeout(tid);
    if(!r.ok){
      const errText=await r.text().catch(()=>"");
      console.error("sbGet failed",t,r.status,errText.slice(0,200));
      return[];
    }
    return r.json();
  }catch(e){
    clearTimeout(tid);
    if(e.name!=="AbortError")console.error("sbGet error",t,e);
    return[];
  }
}
async function sbInsert(t,d){
  try{
    const r=await fetch(API+"/"+t,{method:"POST",headers:SH,body:JSON.stringify(d)});
    if(!r.ok){
      const errText=await r.text().catch(()=>"");
      console.error("sbInsert failed",r.status,errText);
    }
    return r.ok;
  }catch(e){console.error("sbInsert error",e);return false}
}
async function sbUpdate(t,id,d,retry=1){
  try{
    const r=await fetch(API+"/"+t+"?id=eq."+id,{method:"PATCH",headers:SH,body:JSON.stringify(d)});
    if(!r.ok&&retry>0)return sbUpdate(t,id,d,0); // retry 1 ครั้ง
    return r.ok;
  }catch(e){
    if(retry>0)return sbUpdate(t,id,d,0);
    return false;
  }
}
async function sbDelete(t,id){try{const r=await fetch(API+"/"+t+"?id=eq."+id,{method:"DELETE",headers:SH});return r.ok}catch{return false}}


// ── Global error handler สำหรับ iOS Safari ──
window.addEventListener("unhandledrejection",function(e){
  console.warn("[App] Unhandled promise rejection:",e.reason);
  e.preventDefault(); // ป้องกัน crash บน iOS
});
window.addEventListener("error",function(e){
  console.warn("[App] Uncaught error:",e.message);
});
function uid(){
  // iOS 15.4+ → randomUUID
  if(typeof crypto!=="undefined"&&crypto.randomUUID)return crypto.randomUUID().replace(/-/g,"");
  // iOS 11+ → getRandomValues
  if(typeof crypto!=="undefined"&&crypto.getRandomValues){
    const b=new Uint8Array(16);crypto.getRandomValues(b);
    return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
  }
  // fallback
  return Date.now().toString(36)+Math.random().toString(36).slice(2,10);
}
function nowTime(){const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())}
function nowTimeShort(){const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())}
function pad(n){return String(n).padStart(2,"0")}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function thDate(s){try{const d=new Date(s);return d.toLocaleDateString("th-TH",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}catch{return s}}
// esc: XSS escape — inline replace ลดการ chain regex
function esc(s){
  if(s==null)return "";
  const str=typeof s==="string"?s:String(s);
  if(!str.includes("&")&&!str.includes("<")&&!str.includes(">"))return str; // fast path
  return str.replace(/[&<>]/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":"&gt;");
}
function showToast(msg,type=""){
  const t=$el("toast");
  if(!t)return;
  t.textContent=msg;
  t.className="toast show "+(type||"");
  clearTimeout(window._tt);
  window._tt=setTimeout(()=>{t.className="toast";},2500); // 2.5วิ เร็วขึ้น
}

// ── Zone Patch Engine (อัปเดตเฉพาะส่วนที่เปลี่ยน) ──
const _zoneCache={};
function patchZone(id,html){
  if(_zoneCache[id]===html)return; // ไม่เปลี่ยน = ไม่แตะ DOM
  const el=document.getElementById(id);
  if(!el)return;
  el.innerHTML=html;
  _zoneCache[id]=html;
}
function invalidateZone(id){delete _zoneCache[id];} // บังคับ re-render zone นั้น

// ── Per-Card Patch Engine: update เฉพาะ card ที่เปลี่ยน ห้าม rerender list ทั้งหมด ──
const _cardCache={};
function invalidateCardCache(id){delete _cardCache[id];}
function patchCard(taskId){
  const t=getTaskById(taskId);
  const el=document.getElementById("tc-"+taskId);
  if(!el||!t)return false;
  const html=renderCard(t);
  if(_cardCache[taskId]===html)return true; // ไม่มีอะไรเปลี่ยน
  _cardCache[taskId]=html;
  // ใช้ insertAdjacentHTML แทน createElement+replaceWith — เบากว่า
  el.insertAdjacentHTML("afterend",html);
  el.remove();
  return true;
}
// อัปเดตเฉพาะ counts ใน header/sidebar ไม่ rerender ทั้งหน้า
function updateZoneCounts(){
  const d=computeDerived();
  patchZone("zone-hdr",renderHdr(d.cnt,d.pending,d.isSA,d.isAdmin));
  const sbEl=$el("zone-sidebar");
  if(sbEl){
    const sbHtml=renderSidebar(d.cnt,d.pending,d.isSA,d.isAdmin);
    if(_zoneCache["zone-sidebar"]!==sbHtml){sbEl.innerHTML=sbHtml;_zoneCache["zone-sidebar"]=sbHtml;}
  }
}

// อัปเดต counts ใน stats bar และ filter bar เฉพาะตัวเลข (ไม่แตะ card)
// cache stat elements ป้องกัน querySelector ทุก tick
let _statEls=null;
function _getStatEls(){
  if(_statEls)return _statEls;
  _statEls={
    all:document.querySelector(".stat.sa .stat-num"),
    wait:document.querySelector(".stat.sw .stat-num"),
    going:document.querySelector(".stat.sg .stat-num"),
    delivered:document.querySelector(".stat.sdv .stat-num"),
    done:document.querySelector(".stat.sd .stat-num"),
    fbNums:document.querySelectorAll(".fb .fb-num"),
  };
  return _statEls;
}
function _invalidateStatEls(){_statEls=null;} // เรียกเมื่อ DOM rebuild

// ════════════════════════════════════════════════════════
// DOM CACHE — O(1) element lookup, auto-invalidate on rebuild
// ════════════════════════════════════════════════════════
const _domCache=Object.create(null);
function $el(id){
  if(_domCache[id])return _domCache[id];
  const el=document.getElementById(id);
  if(el)_domCache[id]=el;
  return el;
}
function _invalidateDomCache(...ids){
  if(!ids.length){Object.keys(_domCache).forEach(k=>delete _domCache[k]);}
  else ids.forEach(id=>delete _domCache[id]);
}

function _patchListCounts(cnt,pending,isSA){
  try{
  const els=_getStatEls();
  const map=[[els.all,cnt.all],[els.wait,cnt.wait],[els.going,cnt.going],[els.delivered,cnt.delivered],[els.done,cnt.done]];
  map.forEach(([el,v])=>{if(el&&el.textContent!=v)el.textContent=v;});
  const vals=[cnt.all,cnt.wait,cnt.going,cnt.done];
  let i=0;
  els.fbNums?.forEach(b=>{if(vals[i]!==undefined&&b.textContent!=vals[i])b.textContent=vals[i];i++;});
  if(isSA&&pending){const pw=document.querySelector(".pending-warn");if(pw)pw.textContent="👥 มีผู้ใช้รออนุมัติ "+pending+" คน";}
  }catch(e){}
}
// ── Derived State (คำนวณครั้งเดียว ใช้ทุกที่) ──
const ARCHIVE_DAYS=30; // done task เก่ากว่า 30 วัน → archive
let _derived=null;
let _derivedKey=""; // fingerprint ป้องกัน compute ซ้ำ
function isArchived(t){
  if(t.status!=="done")return false;
  const d=new Date(t.completed_at||t.end_time||t.updated_at||t.created_at||t.date||0);
  return (Date.now()-d.getTime())>ARCHIVE_DAYS*86400000;
}
function computeDerived(){
  const k=(S.tasks.length||0)+"|"+(S.filter)+"|"+(S.typeFilter||"")+"|"+(S.currentUser?.username||"")+"|"+(S.role||"");
  if(_derivedKey===k&&_derived)return _derived;
  _derivedKey=k;
  const isAdmin=canViewAll(S.currentUser);
  const role=S.currentUser?.role||"staff";
  const me=S.currentUser?.username||"";

  let tasks;
  if(isAdmin){
    // admin/superadmin — เห็นทั้งหมด
    tasks=S.tasks;
  }else if(role==="messenger"){
    // messenger — เห็น wait ทั้งหมด + going/delivered/done เฉพาะงานตัวเอง
    tasks=S.tasks.filter(t=>
      t.status==="wait" ||
      (t.accepted_by||t.messenger_name)===me
    );
  }else{
    // staff/user — เห็นเฉพาะงานที่ตัวเองสร้าง (ทุก status)
    tasks=S.tasks.filter(t=>t.created_by===me);
  }

  const wait=tasks.filter(t=>t.status==="wait");
  const going=tasks.filter(t=>t.status==="going");
  const delivered=tasks.filter(t=>t.status==="delivered");
  const done=tasks.filter(t=>t.status==="done");
  // แยก archive: done tasks เก่ากว่า 30 วัน
  const archived=done.filter(t=>isArchived(t));
  const recentDone=done.filter(t=>!isArchived(t));
  const _statusFil=S.filter==="all"?tasks.filter(t=>!isArchived(t))
    :S.filter==="wait"?wait
    :S.filter==="going"?going
    :S.filter==="delivered"?delivered
    :S.filter==="archive"?archived
    :recentDone;
  // typeFilter: กรอง AND บนสถานะ (typeFilter="" = แสดงทั้งหมด)
  const fil=S.typeFilter?_statusFil.filter(t=>t.type===S.typeFilter):_statusFil;
  _derived={
    tasks,wait,going,delivered,done,fil,archived,recentDone,
    cnt:{all:tasks.filter(t=>!isArchived(t)).length,wait:wait.length,going:going.length,delivered:delivered.length,done:recentDone.length,archive:archived.length},
    pending:S.users.filter(u=>u.status==="pending").length,
    isSA:canManageUsers(S.currentUser),
    isAdmin,
  };
  return _derived;
}
function invalidateDerived(){_derived=null;_derivedKey="";_taskIndex=null;}
// ── O(1) Task Lookup Index ──
let _taskIndex=null;
function getTaskById(id){
  if(!_taskIndex){
    _taskIndex=new Map(S.tasks.map(t=>[t.id,t]));
  }
  return _taskIndex.get(id);
}

// ── Load More ──
const PAGE_SIZE=20;


// staff     = สั่งงานได้อย่างเดียว
// messenger = รับงาน วิ่ง ปิดงาน
// admin     = สั่งงาน + ดูสถานะทั้งหมด
// superadmin = ทำได้ทุกอย่าง

const ROLE_LABEL={superadmin:"👑 Super Admin",admin:"🛡 Admin",staff:"🖥 ผู้สั่งงาน",messenger:"🏃 แมสเซ็นเจอร์"};
const ROLE_COLOR={superadmin:"#f59e0b",admin:"#a855f7",staff:"#3b82f6",messenger:"#06C755"};

// ══════════════════════════════════════════════════════
//  Permission Matrix
//  🖥 staff      : create + edit/delete own wait + finish own tasks (if can_finish=true)
//  🏃 messenger  : accept + deliver (user_confirm) + finish (messenger_finish)
//  🛡 admin      : create + view all + dashboard + finish any
//  👑 superadmin : full access
// ══════════════════════════════════════════════════════
function canCreate(user){return["superadmin","admin","staff"].includes(user?.role)}
function canViewAll(user){return["superadmin","admin"].includes(user?.role)}
function canManageUsers(user){return user?.role==="superadmin"}
function canDashboard(user){return["superadmin","admin"].includes(user?.role)}
// สิทธิ์จบงาน: messenger/admin/superadmin เสมอ + staff ที่ได้รับสิทธิ์ (can_finish)
function canFinishTask(user){
  if(!user)return false;
  if(["messenger","superadmin","admin"].includes(user.role))return true;
  return user.can_finish===true||user.can_finish==="true";
}

// 🔑 Default users — password เก็บแบบ plain ไว้ก่อน จะ migrate เป็น hash อัตโนมัติ
const SUPER_ADMIN={id:"admin-001",username:"Jamrat",password:"Jam497522",role:"superadmin",status:"approved"};
const DEF_MESSENGERS=[
  {id:"msg-001",username:"NOK", password:"Nok1234",role:"messenger",status:"approved"},
  {id:"msg-002",username:"DUCK",password:"Duc1234",role:"messenger",status:"approved"},
  {id:"msg-003",username:"NUT", password:"Nut1234",role:"messenger",status:"approved"},
  {id:"msg-004",username:"NOT", password:"Not1234",role:"messenger",status:"approved"},
  {id:"msg-005",username:"ARM", password:"Arm1234",role:"messenger",status:"approved"},
  {id:"msg-006",username:"KME", password:"Kme1234",role:"messenger",status:"approved"},
  {id:"msg-007",username:"PALM",password:"Pal1234",role:"messenger",status:"approved"},
];
const UK="msg_users_v2";
let _localUsersCache=null;
function getLocalUsers(){
  if(_localUsersCache)return _localUsersCache; // memory cache — ไม่ต้อง parse localStorage ซ้ำ
  try{
    let arr=JSON.parse(localStorage.getItem(UK)||"[]");
    if(!arr.find(u=>u.username==="Jamrat"))arr.unshift(SUPER_ADMIN);
    else arr=arr.map(u=>u.username==="Jamrat"?{...u,...SUPER_ADMIN}:u);
    DEF_MESSENGERS.forEach(dm=>{if(!arr.find(u=>u.username===dm.username))arr.push(dm);});
    localStorage.setItem(UK,JSON.stringify(arr));
    _localUsersCache=arr;
    return arr;
  }catch{return[SUPER_ADMIN,...DEF_MESSENGERS]}
}
function saveLocalUsers(u){_localUsersCache=u;localStorage.setItem(UK,JSON.stringify(u))}
let _usersCache=null;
let _usersCacheTime=0;
async function getUsers(){
  const local=getLocalUsers();if(DEMO)return local;
  // ใช้ cache 60 วินาที ลด Supabase calls
  if(_usersCache&&Date.now()-_usersCacheTime<300000)return _usersCache; // 5 นาที ลด Supabase calls
  try{
    const su=await sbGet("msg_users","order=created_at.asc");
    const merged=[...su];
    for(const dm of [SUPER_ADMIN,...DEF_MESSENGERS]){if(!merged.find(u=>u.username===dm.username)){await sbInsert("msg_users",dm);merged.push(dm);}}
    _usersCache=merged.map(u=>u.username==="Jamrat"?{...u,...SUPER_ADMIN}:u);
    _usersCacheTime=Date.now();
    return _usersCache;
  }catch{return local}
}
async function findUser(un,pw){
  const users=await getUsers();
  const hashed=await hashPassword(pw);
  return users.find(u=>u.username===un&&(u.password_hash===hashed||u.password===pw))||null;
}
async function registerUser(un,pw){
  const users=await getUsers();
  if(users.find(u=>u.username===un))return{ok:false,msg:"Username นี้ถูกใช้แล้ว"};
  const hashed=await hashPassword(pw);
  const nu={id:uid(),username:un,password_hash:hashed,password:"",role:"staff",status:"pending",created_at:new Date().toISOString()};
  saveLocalUsers([...users,nu]);if(!DEMO)await sbInsert("msg_users",nu);return{ok:true};
}
async function updateUserStatus(id,status){
  _usersCache=null;_localUsersCache=null;
  saveLocalUsers(getLocalUsers().map(u=>u.id===id?{...u,status}:u));
  if(!DEMO)await sbUpdate("msg_users",id,{status});
}
async function updateUserRole(id,role){
  _usersCache=null;_localUsersCache=null;
  saveLocalUsers(getLocalUsers().map(u=>u.id===id?{...u,role}:u));
  if(!DEMO)await sbUpdate("msg_users",id,{role});
  if(S.currentUser?.id===id){S.currentUser={...S.currentUser,role};localStorage.setItem("msg_cu",JSON.stringify(S.currentUser));}
}
async function deleteUser(id){
  _usersCache=null;_localUsersCache=null;
  saveLocalUsers(getLocalUsers().filter(u=>u.id!==id));
  if(!DEMO)await sbDelete("msg_users",id);
}

// ── Job Number: ใช้ Supabase RPC — กัน race condition 100% ──
async function getJobNo(date){
  if(DEMO){
    const same=S.tasks.filter(t=>t.date===date);
    return date.replace(/-/g,"")+"-"+pad(same.length+1);
  }
  try{
    const res=await fetch(SUPA_URL+"/rest/v1/rpc/generate_job_number",{
      method:"POST",
      headers:{...SH,"Content-Type":"application/json"},
      body:JSON.stringify({p_date:date})
    });
    if(res.ok){
      const data=await res.json();
      if(data&&typeof data==="string"&&data.length>4)return data;
    }
    // RPC ไม่พร้อม (ยังไม่ run migration) → fallback แบบ query DB นับจำนวนจริง
    const existing=await sbGet("msg_tasks","date=eq."+date+"&select=id&limit=200");
    const seq=(existing?.length||0)+1;
    return date.replace(/-/g,"")+"-"+pad(seq);
  }catch(e){
    console.error("getJobNo error",e);
    // last-resort fallback: ใช้ timestamp microsecond ป้องกันซ้ำ
    const same=S.tasks.filter(t=>t.date===date);
    return date.replace(/-/g,"")+"-"+pad(same.length+1);
  }
}
function getJobNoSync(date,tasks){
  // ใช้สำหรับ preview เท่านั้น (ไม่ query DB)
  const same=tasks.filter(t=>t.date===date);
  return date.replace(/-/g,"")+"-"+pad(same.length+1);
}

const S={
  page:"login",loginTab:"login",showPass:false,showRPass:false,lErr:"",rErr:"",rOk:false,
  currentUser:null,role:"staff",tasks:[],users:[],filter:"all",typeFilter:"",selId:null,
  loading:false,saving:false,
  fJob:"",fCompany:"",fJobNJ:"",fType:"ส่งเอกสาร",fDetail:"",fPlace:"",
  fCloseMode:"messenger_finish", // ← ใหม่: รูปแบบปิดงาน
  fDate:todayStr(),fPickup:"",fDeliver:"",fInspectDate:"",fPayDate:"",fFile:null,fPreview:null,
  showRecip:false,recipName:"",finishPreview:null,finishFile:null,finishRemark:"",finishMode:"photo",signatureData:null,
  finishTaskId:null, // ← ใหม่: task ที่กำลัง finish (จาก card โดยตรง)
  editTaskId:null,
  realtimeStatus:"connecting",
  showExportFilter:false,expDateFrom:"",expDateTo:"",expCompany:"",
  listPage:1, // legacy — VL no longer uses pagination
};
try{const cu=JSON.parse(localStorage.getItem("msg_cu")||"null");if(cu)S.currentUser=cu;}catch{}
function setState(obj){
  // reset listPage เมื่อ filter เปลี่ยน (ต้องทำก่อน assign)
  if("filter" in obj&&obj.filter!==S.filter){_forceListRebuild=true;VL._filterKey="";obj.typeFilter="";}  // reset type เมื่อ status เปลี่ยน
  if("typeFilter" in obj&&obj.typeFilter!==S.typeFilter){_forceListRebuild=true;VL._filterKey="";}
  if("page" in obj||"selId" in obj)_forceListRebuild=true;
  Object.assign(S,obj);
  // invalidate derived เฉพาะเมื่อ tasks/users/filter/typeFilter/role เปลี่ยน
  if("tasks" in obj||"users" in obj||"filter" in obj||"typeFilter" in obj||"role" in obj)invalidateDerived();
  render();
}

let _lastFetch=0;
let _bgFetchDone=false;

let _fetchInFlight=false; // ป้องกัน concurrent fetch
async function loadTasks(force=false){
  const now=Date.now();
  if(!force&&now-_lastFetch<10000)return;
  if(_fetchInFlight&&!force)return; // ป้องกัน race condition
  _fetchInFlight=true;
  _lastFetch=now;
  // Safety: ล้าง loading state หลัง 15 วิ ป้องกัน stuck ถาวร
  const _safetyTimer=setTimeout(()=>{if(S.loading){S.loading=false;_fetchInFlight=false;render();}},15000);
  S.loading=S.tasks.length===0;
  if(S.loading)render();

  if(DEMO){
    S.tasks=[
      {id:"d1",job_number:"20250815-01",job_nj:"NJ-001",company:"บริษัท ABC",type:"ส่งเอกสาร",detail:"สัญญา 3 ชุด",place:"ตึกทะเลทอง ชั้น 7 : Maersk",date:"2025-08-15",pickup_time:"09:00",deliver_time:"10:30",status:"wait",created_by:"Jamrat",close_mode:"messenger_finish"},
      {id:"d2",job_number:"20250815-02",job_nj:"",company:"ธนาคารกสิกร",type:"รับเอกสาร",detail:"รับเช็ค",place:"ท่าเรือ B1 : KMTC",date:"2025-08-15",pickup_time:"10:00",deliver_time:"11:00",status:"going",created_by:"Jamrat",accepted_by:"NOK",close_mode:"messenger_finish"},
      {id:"d3",job_number:"20250814-01",job_nj:"PO-555",company:"กสทช.",type:"ส่งพัสดุ",detail:"กล่อง 3 กก.",place:"รอบตึก : ONE",date:"2025-08-14",pickup_time:"13:00",deliver_time:"14:30",status:"done",created_by:"Jamrat",accepted_by:"DUCK",close_mode:"messenger_finish"},
    ];
    S.loading=false;clearTimeout(_safetyTimer);render();return;
  }

  const u=S.currentUser;
  let baseFilter="order=created_at.desc"; // admin/superadmin: ทั้งหมด

  if(u?.role==="staff"){
    // staff — เฉพาะงานที่ตัวเองสร้าง
    baseFilter="created_by=eq."+encodeURIComponent(u.username)+"&order=created_at.desc";
  }else if(u?.role==="messenger"){
    // messenger — wait ทั้งหมด + going/delivered/done ที่ตัวเองรับ
    // PostgREST OR: (status=wait) OR (accepted_by=me) OR (messenger_name=me)
    const me=encodeURIComponent(u.username);
    baseFilter="or=(status.eq.wait,accepted_by.eq."+me+",messenger_name.eq."+me+")"
      +"&order=created_at.desc";
  }

  const isFirstLoad=force||S.tasks.length===0;

  if(isFirstLoad){
    // ── รอบแรก: โหลด 20 รายการล่าสุดก่อน → UI เปิดเร็ว ──
    const first=await sbGet("msg_tasks",baseFilter+"&limit=20");
    if(first.length>0||S.tasks.length===0){S.tasks=first;}
    invalidateDerived();
    S.loading=false;clearTimeout(_safetyTimer);render();
    setTimeout(checkAndShowNotif,400);

    // ── Background fetch: โหลด 200 หลัง UI render แล้ว 1.5 วิ ──
    _bgFetchDone=false;
    setTimeout(async()=>{
      if(!S.currentUser)return;
      const all=await sbGet("msg_tasks",baseFilter+"&limit=200");
      if(all.length>0){
        S.tasks=all;
        invalidateDerived();
        _invalidateStatEls(); // reset cached stat elements
        updateZoneCounts();
        // ถ้าอยู่หน้า list → set forceRebuild แต่ไม่ render ทันที (lazy)
        if(S.page==="list"){_forceListRebuild=true;invalidateZone("zone-main");}
      }
      _bgFetchDone=true;
      _fetchInFlight=false;
    },1500);
  }else{
    // ── Poll ปกติ: โหลด 200 ──
    const fetched=await sbGet("msg_tasks",baseFilter+"&limit=200");
    if(fetched.length>0||S.tasks.length===0||force){S.tasks=fetched;}
    invalidateDerived();
    S.loading=false;render();
    setTimeout(checkAndShowNotif,400);
  }
  clearTimeout(_safetyTimer);
  _fetchInFlight=false;
}
let _creatingTask=false; // 🔒 ป้องกันกดซ้ำ

async function createTask(){
  // 🔒 ป้องกันกดซ้ำ
  if(_creatingTask||S.saving)return;
  _creatingTask=true;

  // อ่านค่าจาก DOM
  const coInp=(document.getElementById("co-search-inp")?.value||"").trim();
  if(coInp){S.fCompany=S.fCompany?(S.fCompany+","+coInp):coInp;}
  const njInp=(document.getElementById("nj-inp")?.value||"").trim();
  if(njInp){S.fJobNJ=S.fJobNJ?(S.fJobNJ+","+njInp):njInp;}
  const detailSearch=(document.getElementById("f-detail-search")?.value||"").trim();
  const detailExtra=(document.getElementById("f-detail")?.value||"").trim();
  const detail=detailSearch+(detailExtra&&detailSearch?" — "+detailExtra:detailExtra);
  const place=(document.getElementById("f-place")?.value||"").trim();
  const date=document.getElementById("f-date")?.value||S.fDate;
  const type=document.getElementById("f-type")?.value||S.fType;
  const company=(S.fCompany||"").split(",").filter(v=>v.trim()).map(v=>v.trim()).join(", ");
  const jobnj=(S.fJobNJ||"").split(",").filter(v=>v.trim()).map(v=>v.trim()).join(", ");
  const inspectDate=document.getElementById("f-inspect-date")?.value||"";
  const payDate=document.getElementById("f-pay-date")?.value||"";
  // อ่านค่าเวลาจาก text input (กรณีพิมพ์เอง)
  const pickupInp=(document.getElementById("f-pickup-inp")?.value||"").trim();
  if(pickupInp)formatTimeInput({value:pickupInp,style:{}},"pickup");
  const deliverInp=(document.getElementById("f-deliver-inp")?.value||"").trim();
  if(deliverInp)formatTimeInput({value:deliverInp,style:{}},"deliver");

  if(!company){showToast("⚠️ กรอกชื่อบริษัท","warn");_creatingTask=false;return}
  if(!detail){showToast("⚠️ กรอกรายละเอียด","warn");_creatingTask=false;return}
  if(!place){showToast("⚠️ กรอกสถานที่","warn");_creatingTask=false;return}
  if(!S.fPickup){showToast("⚠️ เลือกเวลาไปรับงาน","warn");_creatingTask=false;return}

  setState({saving:true});
  try{
    const jobNo=await getJobNo(date);
    if(!jobNo){showToast("❌ สร้างเลขงานไม่ได้ ลองใหม่","warn");setState({saving:false});_creatingTask=false;return;}

    const closeMode=document.getElementById("f-close-mode")?.value||S.fCloseMode||"messenger_finish";
    const task={id:uid(),job_number:jobNo,job_nj:jobnj,company,type,detail,place,date,
      pickup_time:S.fPickup,deliver_time:S.fDeliver||"–",
      inspect_date:inspectDate,pay_date:payDate,
      close_mode:closeMode, // รูปแบบปิดงาน
      status:"wait",
      created_by:S.currentUser?.username||"ผู้ใช้", // auto-assign เสมอ
      created_at:new Date().toISOString(),
      image_url:null,
      // fields สำหรับ tracking flow ใหม่
      accepted_by:null,accepted_at:null,
      delivered_by:null,delivered_at:null,
      confirmed_by:null,confirmed_at:null,
      completed_by:null,completed_at:null,
      // backward compat
      messenger_name:null,start_time:null,end_time:null,recipient:null};

    if(!DEMO){
      const ok=await sbInsert("msg_tasks",task);
      if(!ok){
        showToast("❌ บันทึกไม่สำเร็จ กรุณาลองใหม่","warn");
        setState({saving:false});
        _creatingTask=false;
        return;
      }
      // Optimistic: เพิ่ม task ใน local state ทันที ไม่ต้อง reload ทั้งชุด
      // realtime จะ sync ถ้ามี client อื่น
      S.tasks=[task,...S.tasks];
      invalidateDerived();
      _forceListRebuild=true;
    }
    else{S.tasks=[task,...S.tasks];invalidateDerived();}

    setState({saving:false,page:"list",typeFilter:type,filter:"all",fCompany:"",fJobNJ:"",fDetail:"",fPlace:"",fPickup:"",fDeliver:"",fInspectDate:"",fPayDate:"",fFile:null,fPreview:null,fDate:todayStr(),fCloseMode:"messenger_finish"});
    showToast("✅ สร้าง JOB "+jobNo+" แล้ว","ok");
  }catch(e){
    showToast("❌ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง","warn");
    setState({saving:false});
  }finally{
    _creatingTask=false;
  }
}
async function acceptTask(id){
  const t=nowTime();
  const m=S.currentUser?.username||"";
  const updates={status:"going",start_time:t,messenger_name:m,accepted_by:m,accepted_at:t};
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateDerived(); // status เปลี่ยน → counts เปลี่ยน
  invalidateCardCache(id);
  setState({selId:null});
  showToast("🏃 "+m+" รับงานแล้ว! "+t,"ok");
}

async function deleteTask(id){
  const t=getTaskById(id);if(!t)return;
  if(!canDeleteTask(S.currentUser,t)){showToast("⚠️ ไม่มีสิทธิ์ลบงานนี้","warn");return;}
  if(!confirm("ลบใบงานนี้ถาวร?"))return;
  if(!DEMO)await sbDelete("msg_tasks",id);
  S.tasks=S.tasks.filter(t=>t.id!==id);
  invalidateDerived();invalidateCardCache(id);
  _invalidateStatEls();
  VL._fil=null; // force VL re-render
  _forceListRebuild=true;
  setState({selId:null});
  showToast("🗑 ลบใบงานแล้ว","ok");
}

// ── Edit Task — admin/superadmin แก้ไขได้ทุกสถานะ, staff เจ้าของ+สิทธิ์ แก้ไขได้ทุกสถานะ ──
function openEditTask(id){
  const t=getTaskById(id);if(!t)return;
  if(!canEditTask(S.currentUser,t)){showToast("⚠️ ไม่มีสิทธิ์แก้ไขงานนี้","warn");return;}
  // โหลดข้อมูลลง state form แล้วเปิดหน้า edit
  S.fCompany=t.company||"";
  S.fJobNJ=t.job_nj||"";
  S.fType=t.type||"ส่งเอกสาร";
  S.fDetail=t.detail||"";
  S.fPlace=t.place||"";
  S.fDate=t.date||todayStr();
  S.fPickup=t.pickup_time||"";
  S.fDeliver=t.deliver_time||"";
  S.editTaskId=id;
  setState({selId:null,page:"edit"});
}

async function saveEditTask(){
  const id=S.editTaskId;if(!id)return;
  const coInp=(document.getElementById("co-search-inp")?.value||"").trim();
  if(coInp)S.fCompany=S.fCompany?(S.fCompany+","+coInp):coInp;
  const njInp=(document.getElementById("nj-inp")?.value||"").trim();
  if(njInp)S.fJobNJ=S.fJobNJ?(S.fJobNJ+","+njInp):njInp;
  const detailSearch=(document.getElementById("f-detail-search")?.value||"").trim();
  const detailExtra=(document.getElementById("f-detail")?.value||"").trim();
  const detail=detailSearch+(detailExtra&&detailSearch?" — "+detailExtra:detailExtra);
  const place=(document.getElementById("f-place")?.value||"").trim();
  const date=document.getElementById("f-date")?.value||S.fDate;
  const type=document.getElementById("f-type")?.value||S.fType;
  const company=(S.fCompany||"").split(",").filter(v=>v.trim()).map(v=>v.trim()).join(", ");
  const jobnj=(S.fJobNJ||"").split(",").filter(v=>v.trim()).map(v=>v.trim()).join(", ");
  if(!company){showToast("⚠️ กรอกชื่อบริษัท","warn");return}
  if(!detail){showToast("⚠️ กรอกรายละเอียด","warn");return}
  if(!place){showToast("⚠️ กรอกสถานที่","warn");return}
  if(!S.fPickup){showToast("⚠️ เลือกเวลาไปรับงาน","warn");return}
  setState({saving:true});
  const updates={company,job_nj:jobnj,type,detail,place,date,
    pickup_time:S.fPickup,deliver_time:S.fDeliver||"–"};
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateDerived();
  setState({saving:false,page:"list",editTaskId:null,
    fCompany:"",fJobNJ:"",fDetail:"",fPlace:"",fPickup:"",fDeliver:"",fDate:todayStr()});
  showToast("✅ แก้ไขใบงานแล้ว","ok");
}
async function cancelTask(id){
  if(!confirm("ยืนยันยกเลิกการรับงานนี้?\nงานจะกลับไปสถานะ \"รอรับงาน\""))return;
  // คืนสถานะเป็น wait และล้างข้อมูลแมส
  const updates={status:"wait",start_time:null,messenger_name:null,accepted_by:null,accepted_at:null};
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateDerived();invalidateCardCache(id);
  setState({selId:null,showRecip:false});
  showToast("↩ ยกเลิกแล้ว — งานกลับสู่รอรับ","ok");
}

async function finishTask(id,imgUrl,customTime){
  const t=customTime||nowTime();
  const who=S.currentUser?.username||"";
  const remark=(document.getElementById("finish-remark")?.value||S.finishRemark||"").trim();
  const updates={status:"done",end_time:t,completed_by:who,completed_at:t};
  if(imgUrl)updates.image_url=imgUrl;
  if(remark)updates.finish_remark=remark;
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateCardCache(id);
  setState({showRecip:false,recipName:"",finishPreview:null,finishFile:null,finishRemark:"",finishMode:"photo",signatureData:null,selId:null,finishTaskId:null});
  showToast(remark?"✅ ส่งเสร็จ — บันทึกหมายเหตุแล้ว":"✅ ส่งเสร็จแล้ว! "+t,"ok");
}

// ── ส่งถึงแล้ว (user_confirm mode): going → delivered ──
let _deliveringTask=false;
async function deliverTask(id){
  if(_deliveringTask)return;
  _deliveringTask=true;
  const t=nowTime();
  const who=S.currentUser?.username||"";
  const updates={status:"delivered",delivered_by:who,delivered_at:t};
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateDerived();invalidateCardCache(id);
  setState({selId:null});
  showToast("📦 ส่งถึงแล้ว — รอเจ้าของยืนยัน","ok");
  // แสดง popup สำหรับ owner (ถ้า close_mode = user_confirm และ owner ใช้เครื่องนี้)
  const task=getTaskById(id);
  if(task?.close_mode==="user_confirm"){
    // ถ้า owner login อยู่บนเครื่องนี้ด้วย
    if(S.currentUser?.username===task.created_by){
      _showDeliveredAlert(task);
    }
    // realtime จะ trigger popup บนเครื่อง owner ผ่าน _onTaskStatusChange
    _notifDismissed=false;_lastNotifTime=0;
  }
  _deliveringTask=false;
}

// ── Delivered Alert: popup ทันทีเมื่อแมสกด "ส่งถึงแล้ว" ──
function _showDeliveredAlert(task,force=false){
  if(!task||S.currentUser?.username!==task.created_by)return;
  if(force)_deliveredDismissed.delete(task.id);
  if(_deliveredDismissed.has(task.id))return;
  _initOverlays(); // ensure overlay-alert exists
  const el=document.getElementById("overlay-alert");
  if(!el)return;
  el.innerHTML=
    '<div style="width:100%;max-width:480px;background:#1a2235;border:2px solid #f97316;border-radius:20px 20px 0 0;padding:20px 18px 24px;box-shadow:0 -8px 40px rgba(249,115,22,.3);animation:notifSlideUp .3s cubic-bezier(.34,1.3,.64,1)">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'
    +'<span style="font-size:28px">📦</span>'
    +'<div style="flex:1">'
    +'<div style="font-size:16px;font-weight:800;color:#fff">⚠️ เอกสารถึงแล้ว!</div>'
    +'<div style="font-size:12px;color:#94a3b8;margin-top:2px">กรุณากดยืนยันรับ</div>'
    +'</div>'
    +'<button onclick="document.getElementById(\'delivered-alert\').remove()" style="background:none;border:1px solid #2a3a54;border-radius:8px;color:#64748b;font-size:18px;padding:3px 9px;cursor:pointer;line-height:1">×</button>'
    +'</div>'
    // Task info
    +'<div style="background:#111827;border-radius:10px;padding:10px 14px;margin-bottom:14px">'
    +'<div style="font-family:monospace;font-size:11px;color:#06C755;margin-bottom:4px">JOB '+esc(task.job_number||task.id.slice(0,8))+'</div>'
    +'<div style="font-size:13px;font-weight:700;color:#e2e8f4">'+esc(task.company||"")+'</div>'
    +'<div style="font-size:12px;color:#64748b;margin-top:2px">📍 '+esc((task.place||"").slice(0,40))+'</div>'
    +(task.delivered_by?'<div style="font-size:11px;color:#f97316;margin-top:4px;font-weight:700">🏃 ส่งโดย: '+esc(task.delivered_by)+(task.delivered_at?" เวลา "+esc(task.delivered_at):"")+'</div>':"")
    +'</div>'
    // Big confirm button
    +'<button onclick="_confirmFromAlert(\''+task.id+'\')" style="width:100%;padding:16px;background:#166534;border:2px solid #16a34a;border-radius:14px;color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:Sarabun,sans-serif;-webkit-tap-highlight-color:transparent;transition:opacity .15s" onmousedown="this.style.opacity=.85" onmouseup="this.style.opacity=1">✅ ยืนยันรับแล้ว</button>'
    +'<button onclick="_dismissDeliveredAlert(\''+task.id+'\');setState({filter:\'delivered\',page:\'list\'})" style="width:100%;margin-top:8px;padding:12px;background:transparent;border:1.5px solid #2a3a54;border-radius:12px;color:#94a3b8;font-size:13px;font-weight:700;cursor:pointer;font-family:Sarabun,sans-serif">ดูทีหลัง</button>'
    +'</div>';

  // show overlay (reuse — backdrop listener already attached in _initOverlays)
  el.style.display="flex";
  requestAnimationFrame(()=>{el.style.animation="notifSlideUp .25s cubic-bezier(.34,1.3,.64,1)";});
  clearTimeout(window._alertDismissTimer);
  window._alertDismissTimer=setTimeout(()=>{el.style.display="none";},30000);
}

// Track dismissed alerts per task (popup update ซ้ำได้เมื่อมีการ update ใหม่)
const _deliveredDismissed=new Set();
function _dismissDeliveredAlert(id){
  const el=document.getElementById("overlay-alert");
  if(el){el.style.display="none";}
  clearTimeout(window._alertDismissTimer);
  _deliveredDismissed.add(id);
}
let _confirmingFromAlert=false;
async function _confirmFromAlert(id){
  if(_confirmingFromAlert)return;
  _confirmingFromAlert=true;
  const _alertEl=document.getElementById("overlay-alert");
  if(_alertEl)_alertEl.style.display="none";
  clearTimeout(window._alertDismissTimer);
  await confirmTask(id);
  _confirmingFromAlert=false;
}
let _confirmingTask=false;
async function confirmTask(id){
  if(_confirmingTask)return;
  if(!confirm("ยืนยันว่าได้รับของเรียบร้อยแล้ว?"))return;
  _confirmingTask=true;
  const t=nowTime();
  const who=S.currentUser?.username||"";
  const updates={status:"done",confirmed_by:who,confirmed_at:t,completed_at:t,completed_by:who,end_time:t};
  if(!DEMO)await sbUpdate("msg_tasks",id,updates);
  S.tasks=S.tasks.map(x=>x.id===id?{...x,...updates}:x);
  invalidateDerived();invalidateCardCache(id);
  setState({selId:null});
  showToast("✅ ยืนยันรับแล้ว! "+t,"ok");
  _confirmingTask=false;
}

// ── เปิด finish modal จาก card โดยตรง (ไม่ต้องเข้า detail) ──
function openFinishModal(taskId){
  const t=S.tasks.find(x=>x.id===taskId);
  if(!t||!canCompleteTask(S.currentUser,t))return;
  setState({finishTaskId:taskId,showRecip:true,finishPreview:null,finishFile:null,finishRemark:"",finishMode:"photo",signatureData:null,selId:null});
}
// polling ถูกแทนที่ด้วย Realtime แล้ว (startRealtime)

// ── RAF Debounce: ป้องกัน render ซ้ำในเฟรมเดียวกัน ──
let _renderPending=false;
let _renderFrame=null;
let _forceListRebuild=false; // บังคับ rebuild list ทั้งก้อน (filter/page เปลี่ยน)
// ── Sync form inputs → S state ก่อน render ทุกครั้ง ──
// ป้องกัน input ที่พิมพ์แล้วหายเมื่อ patchZone รัน
function syncCreateForm(){
  if(S.page!=="create"&&S.page!=="edit")return;
  const r=id=>document.getElementById(id);
  // NJ
  const njInp=(r("nj-inp")?.value||"").trim();
  if(njInp&&!S.fJobNJ?.includes(njInp)){
    S.fJobNJ=S.fJobNJ?(S.fJobNJ+","+njInp):njInp;
  }
  // บริษัท (search input)
  const coInp=(r("co-search-inp")?.value||"").trim();
  if(coInp&&!S.fCompany?.includes(coInp)){
    S.fCompany=S.fCompany?(S.fCompany+","+coInp):coInp;
  }
  // ฟิลด์ตรง
  const place=(r("f-place")?.value||"").trim();         if(place)S.fPlace=place;
  const type=r("f-type")?.value;                         if(type)S.fType=type;
  const date=r("f-date")?.value;                         if(date)S.fDate=date;
  const detail=(r("f-detail-search")?.value||"").trim(); if(detail)S.fDetail=detail;
  const detailExtra=(r("f-detail")?.value||"").trim();   if(detailExtra&&!S.fDetail)S.fDetail=detailExtra;
  // เวลา (text input)
  const pickupInp=(r("f-pickup-inp")?.value||"").trim(); if(pickupInp&&!S.fPickup)S.fPickup=pickupInp;
  const deliverInp=(r("f-deliver-inp")?.value||"").trim();if(deliverInp&&!S.fDeliver)S.fDeliver=deliverInp;
  // close mode
  const cm=r("f-close-mode")?.value;if(cm)S.fCloseMode=cm;
}
function render(){
  if(_renderPending)return;
  _renderPending=true;
  if(_renderFrame)cancelAnimationFrame(_renderFrame);
  _renderFrame=requestAnimationFrame(()=>{_renderPending=false;_renderFrame=null;_renderNow();});
}
function _renderNow(){
  // ── Skip render ระหว่าง scroll เพื่อกัน jank ──
  // ห้ามเรียก render() ที่นี่! จะทำให้ rAF loop ไม่สิ้นสุด
  // scroll guard timeout (150ms) จะ set _isScrolling=false แล้ว render รอบถัดไปจะทำงานเอง
  if(_isScrolling&&S.page==="list"&&S.selId===null)return;
  // ── Sync form inputs → S ก่อน render ทุกครั้ง ──
  syncCreateForm();

  const app=$el("app");
  if(!S.currentUser){
    // Login page — ไม่มี zones
    app.className="wrap wrap-login";
    app.innerHTML=renderLogin();
    // ล้าง autofill ที่ browser อาจยัดกลับหลัง render
    setTimeout(()=>{
      const u=document.getElementById("l-user"),p=document.getElementById("l-pass");
      if(u)u.value="";if(p)p.value="";
    },50);
    Object.keys(_zoneCache).forEach(k=>delete _zoneCache[k]);
    return;
  }

  // ── ตรวจสอบว่า zones มีอยู่หรือยัง ──
  if(!$el("zone-hdr")){
    app.className="wrap";
    app.innerHTML='<div id="zone-hdr"></div>'
      +'<div id="zone-sidebar"></div>'
      +'<div id="zone-main" class="main-col"></div>'
      +'<div id="zone-modal"></div>';
    Object.keys(_zoneCache).forEach(k=>delete _zoneCache[k]);
    _invalidateDomCache(); // DOM rebuild → purge all cached elements
  }else{
    app.className="wrap";
  }

  const d=computeDerived();

  // ── Zone: Header ──
  patchZone("zone-hdr", renderHdr(d.cnt,d.pending,d.isSA,d.isAdmin));

  // ── Zone: Sidebar ──
  const sbEl=$el("zone-sidebar");
  if(sbEl){
    const sbHtml=renderSidebar(d.cnt,d.pending,d.isSA,d.isAdmin);
    if(_zoneCache["zone-sidebar"]!==sbHtml){
      sbEl.innerHTML=sbHtml;
      _zoneCache["zone-sidebar"]=sbHtml;
    }
  }

  // ── Zone: Modal (finish modal ก่อน detail) ──
  if(S.finishTaskId&&S.showRecip){
    patchZone("zone-modal",renderFinishModal());
    // init clock + canvas หลัง inject
    setTimeout(()=>{
      const el=document.getElementById("finish-clock");
      if(el){clearInterval(window._finishClock);window._finishClock=setInterval(()=>{const e=document.getElementById("finish-clock");if(e)e.textContent=nowTime();else clearInterval(window._finishClock);},1000);}
      if(S.finishMode==="sign")initSignatureCanvas();
    },60);
    return;
  }
  // ── Zone: Main content ──
  if(S.page==="create"&&!canCreate(S.currentUser)){setState({page:"list"});return}
  if(S.page==="create"){
    patchZone("zone-main",renderCreate());
    patchZone("zone-modal","");
    return;
  }
  if(S.page==="edit"&&S.editTaskId){patchZone("zone-main",renderEdit());patchZone("zone-modal","");return}
  if(S.page==="admin"&&!d.isSA){setState({page:"list"});return}
  if(S.page==="admin"){patchZone("zone-main",renderAdmin());patchZone("zone-modal","");return}
  if(S.page==="dashboard"){
    const dHtml=renderDashboard();
    if(_zoneCache["zone-main"]!==dHtml){
      patchZone("zone-main",dHtml);
      renderCharts();
    }
    patchZone("zone-modal","");return;
  }
  if(S.page==="places"){patchZone("zone-main",renderPlacePage());patchZone("zone-modal","");return}

  // ── Zone: List (หน้าหลัก) ──
  // ถ้า zone-main มีอยู่แล้วและ page/filter ไม่เปลี่ยน → patch card ทีละใบแทน full rebuild
  const mainEl=$el("zone-main");
  const listExists=mainEl?.querySelector(".task-list");
  // ห้าม smart patch ตอน loading=true (d.fil=[] ทำให้ skip skeleton)
  if(listExists&&!_forceListRebuild&&!S.loading){
    const vlList=document.getElementById("vl-list");
    if(vlList&&VL._fil){
      // Patch cards in current window; full re-render if any are missing from DOM
      let anyMissing=false;
      for(let idx=VL._start;idx<VL._end;idx++){
        const t=VL._fil[idx];
        if(t&&!patchCard(t.id))anyMissing=true;
      }
      if(anyMissing) vlUpdate(d.fil,true); // re-render window
      else           vlUpdate(d.fil,false); // spacers may need update
    }else if(!vlList){
      // List not yet virtualised — do full rebuild
      _forceListRebuild=true;
    }
    _patchListCounts(d.cnt,d.pending,d.isSA);
    return;
  }
  _forceListRebuild=false;
  _invalidateStatEls(); // DOM rebuild → stat elements cache ต้อง reset
  patchZone("zone-main", renderList(d));
  // Virtual list: fill #vl-list once DOM is ready
  if(!S.loading&&d.fil.length>0){
    requestAnimationFrame(()=>{
      // Init scroller reference + measure card height after first render
      VL._scroller=document.querySelector(".main-col")||window;
      VL._scroller.addEventListener("scroll",_onScroll,{passive:true});
      vlUpdate(d.fil,true);
    });
  }

  // ── Zone: Modal (detail) ──
  patchZone("zone-modal", S.selId?renderDetail():"");
}
function renderHdr(cnt,pending,isSA,isAdmin){
  const rl=ROLE_LABEL[S.currentUser.role]||"";
  const rc=ROLE_COLOR[S.currentUser.role]||"#64748b";
  const isCreate=S.page==="create";
  const canC=canCreate(S.currentUser);
  return '<div class="hdr"><div class="hdr-blob"></div><div class="hdr-inner">'
    +'<div class="hdr-logo">🚀</div>'
    +'<div><div class="hdr-title">ระบบสั่งงานแมส N.J.LOGISTIC</div><div class="hdr-sub">MESSENGER DISPATCH</div></div>'
    +'<div class="hdr-right">'
    +(canC?'<button class="hdr-create-btn" onclick="setState({page:\'create\'})">+ สร้างใบงานใหม่</button>':"")
    +(isCreate&&canC?'<button class="hdr-create-btn" style="background:#06C755;margin-left:6px" onclick="createTask()"'+(S.saving?' disabled':'')+'>✅ '+(S.saving?"กำลังบันทึก...":"ยืนยันสร้างใบงาน")+'</button>':"")
    +(S.page==="edit"&&S.editTaskId?'<button class="hdr-create-btn" style="background:#818cf8;margin-left:6px" onclick="saveEditTask()"'+(S.saving?' disabled':'')+'>✅ '+(S.saving?"กำลังบันทึก...":"บันทึกการแก้ไข")+'</button>':"")
    +'<div style="text-align:right"><div class="hdr-user">'+esc(S.currentUser.username)+'</div>'
    +'<div style="font-size:10px;font-weight:700;color:'+rc+';margin-top:2px">'+rl+'</div>'
    // สถานะ Realtime
    +'<div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:2px">'
    +(S.realtimeStatus==="live"
      ?'<span style="width:6px;height:6px;border-radius:50%;background:#06C755;animation:dotPulse 1.4s infinite;display:inline-block"></span><span style="font-size:9px;color:#06C755;font-weight:700">LIVE</span>'
      :S.realtimeStatus==="connecting"
      ?'<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span><span style="font-size:9px;color:#f59e0b">กำลังเชื่อม</span>'
      :'<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block"></span><span style="font-size:9px;color:#ef4444">Offline</span>'
    )
    +'</div>'
    +(isSA&&pending?'<div style="font-size:10px;color:#f59e0b;cursor:pointer;margin-top:2px" onclick="loadAdmin()">⚠️ รออนุมัติ '+pending+' คน</div>':"")
    +'</div><button class="hdr-logout" onclick="doLogout()">ออก</button></div>'
    +'</div></div>'
    +(["superadmin","admin"].includes(S.currentUser.role)
      ?'<div class="mode-bar">'
       +'<button class="mode-btn'+(S.role==="staff"?" active":"")+'" onclick="setState({role:\'staff\'})">🖥 สั่งงาน</button>'
       +'<button class="mode-btn'+(S.role==="messenger"?" active":"")+'" onclick="setState({role:\'messenger\'})">🏃 แมส</button>'
       +'</div>':"");
}
function renderSidebar(cnt,pending,isSA,isAdmin){
  const isMsg=S.currentUser.role==="messenger";
  // zone-sidebar เป็น sidebar div เองแล้ว ไม่ต้อง wrap ซ้ำ
  return '<div style="padding:14px 18px 12px;border-bottom:1px solid #1e2d44"><div style="font-size:9px;letter-spacing:2px;color:#06C755;font-weight:700;font-family:monospace">MSG SYSTEM</div><div style="font-size:14px;font-weight:800;color:#fff;margin-top:2px">ระบบสั่งงานแมส</div></div>'
    +'<div style="padding:10px 0;flex:1"><div class="sb-lbl">งาน</div>'
    +[["all","ทั้งหมด","📋",cnt.all],["wait","รอรับ","⏳",cnt.wait],["going","กำลังวิ่ง","🏃",cnt.going],["delivered","ส่งถึงแล้ว","📦",cnt.delivered],["done","เสร็จแล้ว","✅",cnt.done],...(cnt.archive>0?[["archive","เก็บถาวร","🗂",cnt.archive]]:[])].map(([k,l,ic,c])=>
      '<div class="sb-item'+(S.filter===k&&S.page==="list"?" on":"")+'" onclick="setState({filter:\''+k+'\',page:\'list\',selId:null})">'
      +'<span>'+ic+'</span><span style="flex:1">'+l+'</span>'+(c?'<span class="sb-badge'+(k==="delivered"?" sb-orange":"")+'">'+c+'</span>':"")+'</div>'
    ).join("")
    +(!isMsg?'<div class="sb-lbl" style="margin-top:8px">สร้างงาน</div>'
      +'<div class="sb-item'+(S.page==="create"?" on":"")+'" onclick="setState({page:\'create\',selId:null})">'
      +'<span>✏️</span><span style="flex:1">สร้างใบงานใหม่</span></div>':"")
    +(isAdmin?'<div class="sb-lbl" style="margin-top:8px">ผู้ดูแล</div>'
      +'<div class="sb-item'+(S.page==="dashboard"?" on":"")+'" onclick="setState({page:\'dashboard\'})"><span>📊</span><span style="flex:1">กราฟสรุปงาน</span></div>'
      +'<div class="sb-item'+(S.page==="places"?" on":"")+'" onclick="setState({page:\'places\'})"><span>📍</span><span style="flex:1">จัดการสถานที่</span></div>'
      +(isSA?'<div class="sb-item'+(S.page==="admin"?" on":"")+'" onclick="loadAdmin()"><span>👥</span><span style="flex:1">จัดการผู้ใช้</span>'+(pending?'<span class="sb-badge sb-warn">'+pending+'</span>':"")+'</div>':""):"")
    +'</div>'
    +(["superadmin","admin"].includes(S.currentUser.role)
      ?'<div style="padding:0 14px 10px"><div class="sb-role">'
       +'<button class="sb-role-btn'+(S.role==="staff"?" on":"")+'" onclick="setState({role:\'staff\'})">🖥 สั่งงาน</button>'
       +'<button class="sb-role-btn'+(S.role==="messenger"?" on":"")+'" onclick="setState({role:\'messenger\'})">🏃 แมส</button>'
       +'</div></div>':"")
    +'<div class="sb-user">'
    +'<div style="font-size:13px;font-weight:700;color:#e2e8f4">👤 '+esc(S.currentUser.username)+'</div>'
    +'<div style="font-size:11px;margin-top:2px;color:'+(ROLE_COLOR[S.currentUser.role]||"#64748b")+'">'+( ROLE_LABEL[S.currentUser.role]||"")+'</div>'
    +'<button onclick="doLogout()" style="margin-top:8px;background:none;border:1px solid #2a3a54;border-radius:6px;color:#64748b;font-size:11px;padding:4px 10px;cursor:pointer;width:100%">ออกจากระบบ</button>'
    +'</div>';
}
const SL={wait:"รอรับงาน",going:"กำลังวิ่ง",delivered:"ส่งถึงแล้ว",done:"เสร็จแล้ว"};
const BC={wait:"bw",going:"bg_",delivered:"bdv",done:"bd"};
const TC={wait:"tc-wait",going:"tc-going",delivered:"tc-delivered",done:"tc-done"};
const CLOSE_MODE_LABEL={"messenger_finish":"🟢 จบโดยแมส","user_confirm":"🟡 รอผู้สั่งยืนยัน"};
const CLOSE_MODE_COLOR={"messenger_finish":"#06C755","user_confirm":"#f59e0b"};

// ── สิทธิ์ตาม flow ──
function canDeliverTask(user,task){
  // แมสที่รับงาน กด "ส่งถึงแล้ว" เฉพาะ user_confirm mode
  const acceptedBy=task.accepted_by||task.messenger_name;
  return task.status==="going"
    &&task.close_mode==="user_confirm"
    &&acceptedBy===user?.username
    &&["messenger","superadmin"].includes(user?.role);
}
function canCompleteTask(user,task){
  // กด "เสร็จงาน" เฉพาะ messenger_finish mode
  if(!user||task.status!=="going")return false;
  if(task.close_mode==="user_confirm")return false;
  const acceptedBy=task.accepted_by||task.messenger_name||"";
  const isOwner=task.created_by===user.username;
  const hasFinishRight=user.can_finish===true||user.can_finish==="true";
  // messenger ที่รับงาน | admin/superadmin ทุกงาน | staff เจ้าของงาน+can_finish
  return canFinishTask(user)
    &&(acceptedBy===user.username||canViewAll(user)||(isOwner&&hasFinishRight));
}
function canConfirmTask(user,task){
  // เจ้าของงาน + superadmin + admin กด "ยืนยันรับ"
  return task.status==="delivered"
    &&(task.created_by===user?.username||["superadmin","admin"].includes(user?.role));
}

// สิทธิ์แก้ไขงาน: superadmin/admin ทุกสถานะ + staff เจ้าของ+can_finish ทุกสถานะ
function canEditTask(user,task){
  if(!user)return false;
  if(user.role==="superadmin")return true;
  if(user.role==="admin")return true;
  // staff เจ้าของงาน — แก้ไขได้เสมอ (ไม่ต้องการสิทธิ์พิเศษ)
  return task.created_by===user.username&&["staff"].includes(user.role);
}
// สิทธิ์ลบงาน: superadmin/admin ทุกงาน + staff เจ้าของ (ลบได้เสมอ)
function canDeleteTask(user,task){
  if(!user)return false;
  if(["superadmin","admin"].includes(user.role))return true;
  // staff เจ้าของงาน — ลบได้เสมอ (ไม่ต้องการสิทธิ์พิเศษ)
  return task.created_by===user.username&&["staff"].includes(user.role);
}
// ── renderCard: render การ์ดเดี่ยว (ใช้ทั้ง renderList และ patchCard) ──

// ── Type badge: สี/ข้อความตามประเภทงาน ──
const TYPE_COLOR={
  "ส่งเอกสาร":{bg:"rgba(59,130,246,.15)",border:"rgba(59,130,246,.4)",text:"#60a5fa"},
  "รับเอกสาร": {bg:"rgba(249,115,22,.15)",border:"rgba(249,115,22,.4)",text:"#fb923c"},
  "FZ":         {bg:"rgba(168,85,247,.15)",border:"rgba(168,85,247,.4)",text:"#c084fc"},
};
function typeBadge(type){
  const c=TYPE_COLOR[type]||{bg:"rgba(100,116,139,.12)",border:"rgba(100,116,139,.3)",text:"#94a3b8"};
  return '<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;border:1px solid '+c.border+';background:'+c.bg+';color:'+c.text+';flex-shrink:0;letter-spacing:.3px">'+esc(type||"–")+'</span>';
}
function renderCard(t){
  const u=S.currentUser;
  const isAdmin=canViewAll(u);
  const cm=t.close_mode||"messenger_finish";
  const cmLabel=CLOSE_MODE_LABEL[cm]||"";
  const cmColor=CLOSE_MODE_COLOR[cm]||"#64748b";
  const acceptedBy=t.accepted_by||t.messenger_name||"";

  // ── Action buttons ── กดได้จาก card เลย ไม่ต้องเข้า detail
  let btns="";
  const isOwner=t.created_by===u?.username;

  if(t.status==="wait"){
    if(["messenger","superadmin"].includes(u?.role)){
      // messenger/superadmin: รับงาน
      btns='<button class="card-btn btn-accept" onclick="event.stopPropagation();cardAccept(\''+t.id+'\')">🏃 รับงาน</button>';
    }
  } else if(t.status==="going"){
    if(canCompleteTask(u,t)){
      btns='<button class="card-btn btn-finish" onclick="event.stopPropagation();openFinishModal(\''+t.id+'\')">✅ เสร็จงาน</button>';
    } else if(canDeliverTask(u,t)){
      btns='<button class="card-btn btn-deliver" onclick="event.stopPropagation();cardDeliver(\''+t.id+'\')">📦 ส่งถึงแล้ว</button>';
    }
    // ยกเลิกรับงาน (เฉพาะแมสที่รับ หรือ admin)
    if(acceptedBy===u?.username||isAdmin){
      btns+='<button class="card-btn btn-cancel-accept" onclick="event.stopPropagation();cancelTask(\''+t.id+'\')" title="ยกเลิกรับ">↩</button>';
    }
  } else if(t.status==="delivered"){
    if(canConfirmTask(u,t)){
      btns='<button class="card-btn btn-confirm-owner" onclick="event.stopPropagation();confirmTask(\''+t.id+'\')">✅ ยืนยันรับ</button>';
    } else if(isAdmin){
      btns='<div class="card-btn-info">⏳ รอ '+esc(t.created_by)+" ยืนยัน</div>";
    }
  }

  // ── Edit / Delete — ทุกสถานะ (สิทธิ์ตาม canEditTask/canDeleteTask) ──
  if(canEditTask(u,t)){
    btns+='<button class="card-btn btn-edit" onclick="event.stopPropagation();openEditTask(\''+t.id+'\')" title="แก้ไข">✏️</button>';
  }
  if(canDeleteTask(u,t)){
    btns+='<button class="card-btn btn-del" onclick="event.stopPropagation();deleteTask(\''+t.id+'\')" title="ลบ">🗑</button>';
  }

  // ── Mini timeline ──
  let tl="";
  if(acceptedBy)tl+='<span class="card-tl-item">🏃 '+esc(acceptedBy)+(t.accepted_at?" "+esc(t.accepted_at):"")+'</span>';
  if(t.delivered_by)tl+='<span class="card-tl-item">📦 '+esc(t.delivered_by)+" "+esc(t.delivered_at||"")+'</span>';
  if(t.confirmed_by)tl+='<span class="card-tl-item">✅ '+esc(t.confirmed_by)+" "+esc(t.confirmed_at||"")+'</span>';
  if(t.completed_by&&t.status==="done"&&!t.confirmed_by)tl+='<span class="card-tl-item">✅ '+esc(t.completed_by)+" "+esc(t.completed_at||t.end_time||"")+'</span>';

  // ── ปรับ close_mode badge เพิ่ม 📦 รอคุณกดยืนยัน สำหรับ owner ──
  let cardCmLabel=cmLabel;
  let cardCmColor=cmColor;
  if(t.status==="delivered"&&t.created_by===u?.username){
    cardCmLabel="📦 รอคุณกดยืนยัน";cardCmColor="#f97316";
  }else if(t.status==="delivered"){
    cardCmLabel="📦 รอยืนยัน";cardCmColor="#f97316";
  }

  return '<div id="tc-'+t.id+'" class="task-card '+TC[t.status||"wait"]+'" onclick="openDetailInstant(\''+t.id+'\')">'
    // Row 1: Job + status
    +'<div class="tc-r1">'
    +'<span class="tc-job">'+esc(t.job_number||t.id.slice(0,8))+'</span>'
    +typeBadge(t.type)
    +(t.job_nj?'<span class="tc-nj">NJ: '+esc(t.job_nj.slice(0,20))+'</span>':"")
    +'<span class="tc-title">'+(t.detail?esc(t.detail.slice(0,32))+(t.detail.length>32?"…":""):"")+'</span>'
    +'<span class="tc-badge '+BC[t.status||"wait"]+'">'+SL[t.status||"wait"]+'</span>'
    +'</div>'
    // Row 2: info + close_mode badge
    +'<div class="tc-r2">'
    +'<span class="tc-meta">🏢 '+esc((t.company||"").slice(0,28))+'</span>'
    +'<span class="tc-meta">📍 '+esc((t.place||"").slice(0,28))+'</span>'
    +'<span class="tc-meta">⏰ '+esc(t.pickup_time||"–")+'</span>'
    +'<span class="card-cm-badge" style="color:'+cardCmColor+';border-color:'+cardCmColor+'44;background:'+cardCmColor+'11">'+cardCmLabel+'</span>'
    +'</div>'
    // Row 3: timeline + action buttons
    +(tl?'<div class="card-timeline">'+tl+'</div>':"")
    +'<div class="card-actions" onclick="event.stopPropagation()">'
    +'<button onclick="event.stopPropagation();exportPDF(\'single\',\''+t.id+'\')" class="card-pdf-btn" title="PDF">📄</button>'
    +btns
    +'</div>'
    +'</div>';
}

// ── Double-click guard สำหรับปุ่มใน card ──
let _cardActionBusy=false;
async function cardAccept(id){
  if(_cardActionBusy)return;_cardActionBusy=true;
  try{await acceptTask(id);}finally{_cardActionBusy=false;}
}
async function cardDeliver(id){
  if(_cardActionBusy)return;_cardActionBusy=true;
  try{await deliverTask(id);}finally{_cardActionBusy=false;}
}


// ════════════════════════════════════════════════════════
// VIRTUAL LIST — scroll-viewport driven rendering
// Renders only cards visible on screen + OVERSCAN buffer.
// Spacer divs above/below maintain scroll position.
// No pagination buttons. Works on mobile + desktop.
// ════════════════════════════════════════════════════════
const VL = {
  // Tuning
  CARD_H:   0,    // measured from first real card; fallback 196px
  OVERSCAN: 4,    // extra cards rendered above + below viewport

  // Runtime state
  _fil:       null,  // reference to current filtered array
  _filterKey: "",    // "filter|username|length" — change → full re-render
  _start:     0,     // first rendered index (inclusive)
  _end:       0,     // last rendered index (exclusive)
  _scroller:  null,  // .main-col element (cached)
  _raf:       0,     // pending rAF id (debounce scroll updates)
};

// ── measure card height from the DOM once ──
function vlMeasure() {
  if (VL.CARD_H > 0) return;
  const card = document.querySelector(".task-card");
  if (card) {
    const mb = parseInt(getComputedStyle(card).marginBottom) || 8;
    VL.CARD_H = card.offsetHeight + mb;
  }
  if (!VL.CARD_H) VL.CARD_H = 196; // safe fallback
}

// ── get scroll container (.main-col on desktop, window on mobile fallback) ──
function vlScroller() {
  if (VL._scroller) return VL._scroller;
  VL._scroller = document.querySelector(".main-col") || window;
  return VL._scroller;
}

// ── calculate which slice of fil[] should be visible ──
function vlWindow(totalItems, scrollTop, viewportH) {
  const perView = Math.ceil(viewportH / VL.CARD_H);
  const start   = Math.max(0, Math.floor(scrollTop / VL.CARD_H) - VL.OVERSCAN);
  const end     = Math.min(totalItems, start + perView + VL.OVERSCAN * 2);
  return { start, end };
}

// ── write cards + spacers into #vl-list ──
// Uses innerHTML (one DOM write) — fastest possible for this pattern
function vlUpdate(fil, force) {
  const list = document.getElementById("vl-list");
  if (!list) return false;

  // Detect filter/data change
  const fk = S.filter + "|" + (S.currentUser?.username || "") + "|" + fil.length;
  if (fk !== VL._filterKey) { force = true; VL._filterKey = fk; }

  vlMeasure();

  const sc      = vlScroller();
  const scrollTop  = sc === window ? sc.scrollY   : sc.scrollTop;
  const viewportH  = sc === window ? sc.innerHeight : (sc.clientHeight || 700);

  const { start, end } = vlWindow(fil.length, scrollTop, viewportH);

  // Skip DOM work if window is identical (common during small scroll increments)
  if (!force && start === VL._start && end === VL._end) return true;
  VL._start = start;
  VL._end   = end;
  VL._fil   = fil;

  // Build HTML string in one pass (no createElement per card)
  const topH = start * VL.CARD_H;
  const btmH = Math.max(0, (fil.length - end)) * VL.CARD_H;

  let html = '<div id="vl-top" style="height:' + topH + 'px;flex-shrink:0" aria-hidden="true"></div>';
  for (let idx = start; idx < end; idx++) {
    const t = fil[idx];
    const cardHtml = renderCard(t);
    _cardCache[t.id] = cardHtml; // keep card cache in sync
    html += cardHtml;
  }
  html += '<div id="vl-btm" style="height:' + btmH + 'px;flex-shrink:0" aria-hidden="true"></div>';

  list.innerHTML = html; // single synchronous DOM write
  return true;
}

// ── patch a single card within the current window ──
function vlPatch(taskId) {
  // Only patch if card is in the current render window
  const idx = VL._fil ? VL._fil.findIndex(t => t.id === taskId) : -1;
  if (idx < VL._start || idx >= VL._end) return false;
  return patchCard(taskId); // existing patchCard handles DOM update
}

// ── scroll handler: debounced via rAF ──
function vlOnScroll() {
  if (!VL._fil || S.page !== "list") return;
  cancelAnimationFrame(VL._raf);
  VL._raf = requestAnimationFrame(() => vlUpdate(VL._fil, false));
}


// ── buildTypeFilterBar: แถวกรองประเภทงาน ──
function buildTypeFilterBar(tasks,wait,going,delivered,archived,recentDone){
  const _base=S.filter==="all"?tasks.filter(t=>!isArchived(t))
    :S.filter==="wait"?wait:S.filter==="going"?going
    :S.filter==="delivered"?delivered:S.filter==="archive"?archived:recentDone;
  const TYPE_DEFS=[
    {k:"ส่งเอกสาร",ic:"📤",col:"#60a5fa"},
    {k:"รับเอกสาร",ic:"📥",col:"#fb923c"},
    {k:"FZ",ic:"🚢",col:"#c084fc"},
  ];
  const hasTasks=TYPE_DEFS.some(td=>_base.some(t=>t.type===td.k));
  if(!hasTasks)return "";
  const allActive=!S.typeFilter;
  let row='<div class="filter-bar type-filter-bar">'
    +'<button class="fb'+(allActive?" fb-a-all":"")+'" onclick="setState({typeFilter:\'\'})" >📋 ทั้งประเภท</button>';
  TYPE_DEFS.forEach(({k,ic,col})=>{
    const n=_base.filter(t=>t.type===k).length;
    if(!n)return;
    const active=S.typeFilter===k;
    const st=active?"background:"+col+"22;border-color:"+col+";color:"+col:"";
    row+='<button class="fb" style="'+st+'" onclick="setState({typeFilter:\''+k+'\'})" >'
      +ic+" "+esc(k)+'<span class="fb-num">'+n+'</span></button>';
  });
  return row+'</div>';
}

function renderList(d){
  const {cnt,fil,pending,isSA,isAdmin,tasks,wait,going,delivered,archived,recentDone}=d;
  const stats="";
  const filters='<div class="filter-bar">'
    +'<button class="fb'+(S.filter==="all"?" fb-a-all":"")+'" onclick="setState({filter:\'all\'})">📋 ทั้งหมด<span class="fb-num">'+cnt.all+'</span></button>'
    +'<button class="fb'+(S.filter==="wait"?" fb-a-wait":"")+'" onclick="setState({filter:\'wait\'})">⏳ รอรับ<span class="fb-num">'+cnt.wait+'</span></button>'
    +'<button class="fb'+(S.filter==="going"?" fb-a-going":"")+'" onclick="setState({filter:\'going\'})">🏃 วิ่ง<span class="fb-num">'+cnt.going+'</span></button>'
    +(cnt.delivered?'<button class="fb'+(S.filter==="delivered"?" fb-a-delivered":"")+'" onclick="setState({filter:\'delivered\'})">📦 ส่งถึง<span class="fb-num">'+cnt.delivered+'</span></button>':"")
    +'<button class="fb'+(S.filter==="done"?" fb-a-done":"")+'" onclick="setState({filter:\'done\'})">✅ เสร็จ<span class="fb-num">'+cnt.done+'</span></button>'
    +(cnt.archive>0?'<button class="fb'+(S.filter==="archive"?" fb-a-done":"")+'" onclick="setState({filter:\'archive\'})">📦 เก็บถาวร<span class="fb-num">'+cnt.archive+'</span></button>':"")
    +'<button id="refresh-btn" onclick="manualRefresh()" style="margin-left:auto;flex-shrink:0;padding:7px 12px;border-radius:10px;border:1.5px solid rgba(6,199,85,.3);background:rgba(6,199,85,.08);color:#06C755;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px" title="รีเฟรชข้อมูล">🔄 รีเฟรช</button>'
    +'</div>'    // ── Type filter row ──
    +buildTypeFilterBar(tasks,wait,going,delivered,archived,recentDone)
  const pWarn=isSA&&pending?'<div style="margin:0 16px 12px;padding:10px 14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:10px;font-size:12px;color:#f59e0b;cursor:pointer" onclick="loadAdmin()">👥 มีผู้ใช้รออนุมัติ '+pending+' คน</div>':"";
  const expData=getFilteredExportData(); // hoist ขึ้นมาก่อน ป้องกัน TDZ
  const filTasks=S.tasks.filter(t=>S.filter==="all"||t.status===S.filter);
  const menuItems=filTasks.slice(0,12).map(t=>
    '<div onclick="exportPDF(\'single\',\''+t.id+'\');closeMenus()" style="padding:8px 14px;font-size:12px;color:#94a3b8;cursor:pointer;border-top:1px solid #1e2d44;display:flex;align-items:center;gap:6px" onmouseenter="this.style.background=\'rgba(239,68,68,.06)\'" onmouseleave="this.style.background=\'\'">'
    +'<span style="font-family:monospace;font-size:10px;color:#f87171">'+esc(t.job_number||t.id.slice(0,8))+'</span>'
    +'<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(t.company||t.type||"")+'</span></div>'
  ).join("")+(filTasks.length>12?'<div style="padding:8px 14px;font-size:11px;color:#475569;text-align:center;border-top:1px solid #1e2d44">...และอีก '+(filTasks.length-12)+' งาน</div>':"");

  // Export filter bar
  const expFilterPanel=S.showExportFilter
    ?'<div style="margin:0 16px 10px;background:#1a2235;border:1px solid #2a3a54;border-radius:12px;padding:14px">'
      +'<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:10px">🔍 กรองข้อมูล Export</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'
      +'<div><div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:4px">📅 วันที่เริ่ม</div>'
      +'<input type="date" id="exp-date-from" value="'+esc(S.expDateFrom)+'" onchange="S.expDateFrom=this.value" style="width:100%;background:#0f172a;border:1.5px solid #2a3a54;border-radius:8px;padding:8px;color:#e2e8f4;font-size:12px;outline:none;color-scheme:dark"></div>'
      +'<div><div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:4px">📅 วันที่สิ้นสุด</div>'
      +'<input type="date" id="exp-date-to" value="'+esc(S.expDateTo)+'" onchange="S.expDateTo=this.value" style="width:100%;background:#0f172a;border:1.5px solid #2a3a54;border-radius:8px;padding:8px;color:#e2e8f4;font-size:12px;outline:none;color-scheme:dark"></div>'
      +'</div>'
      +'<div style="margin-bottom:8px"><div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:4px">🏢 บริษัท (พิมพ์บางส่วนก็ได้)</div>'
      +'<input type="text" id="exp-company" value="'+esc(S.expCompany)+'" placeholder="เช่น AAR, 4Care..." onchange="S.expCompany=this.value" style="width:100%;background:#0f172a;border:1.5px solid #2a3a54;border-radius:8px;padding:8px;color:#e2e8f4;font-size:12px;outline:none" oninput="S.expCompany=this.value"></div>'
      +'<div style="display:flex;align-items:center;gap:6px">'
      +'<span id="exp-count" style="font-size:11px;color:#06C755;font-weight:700">'+expData.length+' รายการ</span>'
      +'<button onclick="S.expDateFrom=\'\';S.expDateTo=\'\';S.expCompany=\'\';setState({showExportFilter:true})" style="background:none;border:1px solid #2a3a54;border-radius:6px;padding:3px 8px;font-size:11px;color:#64748b;cursor:pointer">ล้าง</button>'
      +'</div>'
      +'</div>'
    :"";

  // expData คำนวณข้างบนแล้ว
  // แมสเซ็นเจอร์ไม่เห็น export bar
  const exp=S.currentUser?.role==="messenger"?"":('<div class="export-bar">'
    +'<button class="exp-btn" onclick="setState({showExportFilter:!S.showExportFilter})" style="'+(S.showExportFilter?"border-color:#06C755;color:#06C755":"")+'">🔍 กรอง'+(S.expDateFrom||S.expDateTo||S.expCompany?' <span style="background:#06C755;color:#000;border-radius:10px;padding:1px 6px;font-size:10px">มีตัวกรอง</span>':'')+'</button>'
    // PDF รายงาน
    +'<div style="position:relative;display:inline-block" id="pdf-menu-wrap">'
    +'<button class="exp-btn exp-pdf" onclick="toggleMenu(\'pdf-menu\')">📄 PDF ▾</button>'
    +'<div id="pdf-menu" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:#1a2235;border:1.5px solid rgba(239,68,68,.4);border-radius:10px;min-width:190px;z-index:200;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.4)">'
    +'<div onclick="exportPDF(\'all\');closeMenus()" style="padding:10px 14px;font-size:13px;color:#e2e8f4;cursor:pointer;border-bottom:1px solid #2a3a54;display:flex;align-items:center;gap:8px;font-weight:700" onmouseenter="this.style.background=\'rgba(239,68,68,.08)\'" onmouseleave="this.style.background=\'\'">📄 ทุกงาน ('+expData.length+' ใบ)</div>'
    +'<div style="padding:6px 14px 4px;font-size:10px;color:#475569;font-weight:700;letter-spacing:1px">เลือกรายงาน</div>'
    +menuItems+'</div></div>'
    +'<button class="exp-btn exp-xl" onclick="exportExcel()">📗 Excel</button>'
    +'<button class="exp-btn exp-csv" onclick="exportCSV()">📊 CSV</button>'
    +'</div>');
  let cards="";
  if(S.loading){
    cards='<div style="padding:0 16px">'+'<div class="skeleton" style="height:100px"></div>'.repeat(4)+'</div>';
  }else if(!fil.length){
    cards='<div class="empty"><div style="font-size:32px;opacity:.4;margin-bottom:10px">📭</div><div>ไม่มีรายการงาน</div></div>';
  }else{
    // Virtual list: emit empty container — vlRender() fills after DOM insert
    cards='<div id="vl-list" class="vl-list" data-total="'+fil.length+'"></div>';
  }
  const listHtml=stats+filters+pWarn+expFilterPanel+exp+'<div class="task-list">'+cards+'</div>'
    +(canCreate(S.currentUser)?'<div class="fix-bar mobile-only-bar"><button class="btn-green" onclick="setState({page:\'create\'})">+ สร้างใบงานใหม่</button></div>':"");
  return listHtml;
}

function renderDetail(){
  const t=S.tasks.find(x=>x.id===S.selId);if(!t)return"";
  clearInterval(window._detailPoll);window._detailPoll=null;

  const acceptedBy=t.accepted_by||t.messenger_name||"";
  const cm=t.close_mode||"messenger_finish";
  const cmLabel=CLOSE_MODE_LABEL[cm]||"";
  const cmColor=CLOSE_MODE_COLOR[cm]||"#64748b";

  // ── Timeline ──
  const tlItems=[
    {label:"สร้างงาน",by:t.created_by,at:t.created_at?new Date(t.created_at).toLocaleString("th-TH"):"",color:"#94a3b8",done:true},
    {label:"รับงาน",by:acceptedBy,at:t.accepted_at||t.start_time,color:"#3b82f6",done:!!acceptedBy},
    cm==="user_confirm"?{label:"ส่งถึงแล้ว",by:t.delivered_by,at:t.delivered_at,color:"#f59e0b",done:!!t.delivered_by}:null,
    cm==="user_confirm"?{label:"ยืนยันรับ",by:t.confirmed_by,at:t.confirmed_at,color:"#06C755",done:!!t.confirmed_by}:null,
    cm==="messenger_finish"?{label:"เสร็จงาน",by:t.completed_by,at:t.completed_at||t.end_time,color:"#06C755",done:!!(t.completed_at||t.end_time)}:null,
  ].filter(Boolean);

  const tl='<div class="tl">'+tlItems.map(item=>'<div class="tl-row">'
    +'<div class="tl-dot" style="background:'+(item.done?item.color:"#2a3a54")+'"></div>'
    +'<div class="tl-txt" style="color:'+(item.done?item.color:"#64748b")+'">'
    +item.label+(item.by?' — <strong>'+esc(item.by)+'</strong>':'')
    +(item.at?' <span style="font-family:monospace;font-size:11px">'+esc(item.at.slice(0,16))+'</span>':'')
    +'</div></div>').join("")+'</div>';

  const img=t.image_url?'<img class="detail-img" loading="lazy" src="'+esc(t.image_url)+'">'
    :(t.finish_remark?'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:8px;padding:10px 12px;font-size:12px;color:#94a3b8">📝 '+esc(t.finish_remark)+'</div>'
    :'<div style="height:50px;border:1px dashed #2a3a54;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px">ไม่มีภาพแนบ</div>');

  const canEdit=canEditTask(S.currentUser,t);

  return '<div class="modal-overlay" onclick="if(event.target===this)setState({selId:null})">'
    +'<div class="modal-box">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +'<div>'
    +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'    +'<span style="font-family:monospace;font-size:11px;color:#06C755;letter-spacing:1px">JOB '+esc(t.job_number||t.id.slice(0,8))+'</span>'    +typeBadge(t.type)    +'</div>'    +(t.job_nj?'<div style="font-family:monospace;font-size:10px;color:#f59e0b;margin-top:2px">NJ: '+esc(t.job_nj)+'</div>':"")
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:6px">'
    +'<button onclick="refreshDetail()" id="detail-refresh-btn" style="background:rgba(6,199,85,.08);border:1px solid rgba(6,199,85,.25);border-radius:8px;color:#06C755;font-size:12px;font-weight:700;padding:4px 10px;cursor:pointer">🔄</button>'
    +(canEdit?'<button onclick="openEditTask(\''+t.id+'\')" style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.3);border-radius:8px;color:#818cf8;font-size:12px;font-weight:700;padding:4px 10px;cursor:pointer">✏️ แก้ไข</button>':"")
    +'<button onclick="setState({selId:null})" style="background:none;border:1px solid #2a3a54;border-radius:8px;color:#64748b;font-size:18px;padding:2px 8px;cursor:pointer;line-height:1">×</button>'
    +'</div></div>'
    // Status + close_mode badge
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    +'<span class="tc-badge '+BC[t.status||"wait"]+'" style="font-size:12px;padding:4px 12px">'+SL[t.status||"wait"]+'</span>'
    +'<span class="card-cm-badge" style="color:'+cmColor+';border-color:'+cmColor+'44;font-size:11px">'+cmLabel+'</span>'
    +'<span style="font-size:11px;color:#64748b;margin-left:auto">📅 '+esc(t.date||"–")+'</span>'
    +'</div>'
    // Info
    +'<div style="background:#111827;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:13px">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
    +'<div><span style="color:#64748b;font-size:11px">🏢 บริษัท</span><div style="color:#e2e8f4;font-weight:600;margin-top:1px">'+esc(t.company||"–")+'</div></div>'
    +'<div><span style="color:#64748b;font-size:11px">📦 ประเภท</span><div style="margin-top:4px">'+typeBadge(t.type||"–")+'</div></div>'
    +'<div><span style="color:#64748b;font-size:11px">📍 สถานที่</span><div style="color:#e2e8f4;margin-top:1px">'+esc(t.place||"–")+'</div></div>'
    +'<div><span style="color:#64748b;font-size:11px">⏰ เวลา</span><div style="color:#e2e8f4;font-family:monospace;margin-top:1px">'+esc(t.pickup_time||"–")+(t.deliver_time&&t.deliver_time!=="–"?" → "+esc(t.deliver_time):"")+'</div></div>'
    +(t.detail?'<div style="grid-column:1/3"><span style="color:#64748b;font-size:11px">📝 รายละเอียด</span><div style="color:#e2e8f4;margin-top:1px">'+esc(t.detail)+'</div></div>':"")
    +'</div></div>'
    // Timeline (read-only)
    +tl
    // หลักฐาน
    +'<div style="margin:10px 0">'+img+'</div>'
    // Delete — เฉพาะ admin + รอรับเท่านั้น
    +(canViewAll(S.currentUser)&&t.status==="wait"
      ?'<button onclick="deleteTask(\''+t.id+'\')" style="width:100%;margin-top:6px;padding:10px;border-radius:10px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.05);color:#f87171;font-size:12px;font-weight:700;cursor:pointer">🗑 ลบใบงานนี้</button>'
      :"")
    +'</div></div>';
}

// ── Finish Modal (ถ่ายรูป/เซ็น) เปิดจาก card โดยตรง ──
function renderFinishModal(){
  const id=S.finishTaskId;if(!id)return"";
  const t=S.tasks.find(x=>x.id===id);if(!t)return"";
  const nowT=nowTime();
  return '<div class="modal-overlay" onclick="if(event.target===this)setState({finishTaskId:null,showRecip:false})">'
    +'<div class="modal-box">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<div><div style="font-size:15px;font-weight:800;color:#06C755">✅ ยืนยันเสร็จงาน</div>'
    +'<div style="font-size:11px;color:#64748b;margin-top:2px">JOB '+esc(t.job_number||t.id.slice(0,8))+'</div></div>'
    +'<button onclick="setState({finishTaskId:null,showRecip:false})" style="background:none;border:1px solid #2a3a54;border-radius:8px;color:#64748b;font-size:18px;padding:2px 8px;cursor:pointer;line-height:1">×</button>'
    +'</div>'
    +'<div style="background:rgba(6,199,85,.06);border:1px solid rgba(6,199,85,.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">'
    +'<div style="font-size:11px;color:#64748b;font-weight:700">⏰ เวลาเสร็จ (อัตโนมัติ)</div>'
    +'<div style="font-size:20px;font-weight:800;color:#06C755;font-family:monospace" id="finish-clock">'+nowT+'</div>'
    +'</div>'
    +'<div style="margin-bottom:12px"><div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px">📝 หมายเหตุ (ถ้ามี)</div>'
    +'<textarea id="finish-remark" placeholder="เช่น ลูกค้าไม่อยู่..." oninput="S.finishRemark=this.value" style="width:100%;background:#1a2235;border:1.5px solid #2a3a54;border-radius:8px;padding:10px 12px;color:#e2e8f4;font-size:13px;font-family:Sarabun,sans-serif;resize:none;min-height:56px;outline:none">'+esc(S.finishRemark||'')+'</textarea></div>'
    +'<div style="display:flex;background:#0a0f1e;border-radius:10px;padding:3px;margin-bottom:12px;gap:3px">'
    +'<button onclick="setState({finishMode:\'photo\',signatureData:null})" style="flex:1;padding:8px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;background:'+(S.finishMode==="photo"?"#06C755":"transparent")+';color:'+(S.finishMode==="photo"?"#fff":"#64748b")+'">📷 ถ่ายรูป</button>'
    +'<button onclick="setState({finishMode:\'sign\',finishPreview:null,finishFile:null})" style="flex:1;padding:8px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;background:'+(S.finishMode==="sign"?"#3b82f6":"transparent")+';color:'+(S.finishMode==="sign"?"#fff":"#64748b")+'">✍️ เซ็นชื่อ</button>'
    +'</div>'
    +(S.finishMode==="photo"
      ?'<div style="font-size:11px;color:#ef4444;font-weight:700;margin-bottom:8px">📸 แนบภาพหลักฐาน *บังคับ</div>'
        +(S.finishPreview
          ?'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><img src="'+S.finishPreview+'" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #06C755"><span style="font-size:12px;color:#06C755;font-weight:700">✅ แนบแล้ว</span><button onclick="setState({finishPreview:null,finishFile:null})" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;margin-left:auto">×</button></div>'
          :'<label id="finish-photo-label" style="display:block;border:2px dashed #ef4444;border-radius:10px;padding:20px;text-align:center;color:#ef4444;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px"><input type="file" accept="image/*" capture="environment" style="display:none" onchange="handleFinishFile(this)">📷 แตะเพื่อถ่ายรูป / แนบภาพ</label>')
      :'<div style="font-size:11px;color:#3b82f6;font-weight:700;margin-bottom:8px">✍️ เซ็นชื่อ *บังคับ</div>'
        +'<div style="position:relative;border:2px solid #3b82f6;border-radius:10px;overflow:hidden;margin-bottom:8px;background:#fff"><canvas id="sig-canvas" width="400" height="150" style="width:100%;height:150px;display:block;touch-action:none;cursor:crosshair"></canvas>'
        +(S.signatureData?'<div style="position:absolute;top:6px;right:6px"><button onclick="clearSignature()" style="background:rgba(239,68,68,.8);border:none;border-radius:6px;color:#fff;font-size:11px;padding:3px 8px;cursor:pointer">ลบ</button></div>':"")
        +'</div>'+(S.signatureData?'<div style="font-size:12px;color:#06C755;font-weight:700;margin-bottom:6px">✅ เซ็นชื่อแล้ว</div>':'<div style="font-size:11px;color:#64748b;margin-bottom:6px">ลากนิ้วเพื่อเซ็นชื่อ</div>')
    )
    +'<button class="btn-green" onclick="confirmFinish()" style="font-size:15px;'+((S.finishMode==="photo"&&!S.finishPreview)||(S.finishMode==="sign"&&!S.signatureData)?"opacity:.45":"")+';">'
    +(S.finishMode==="photo"?(S.finishPreview?"✅ ยืนยันเสร็จงาน":"📷 แนบภาพก่อนยืนยัน"):(S.signatureData?"✅ ยืนยันเสร็จงาน":"✍️ เซ็นชื่อก่อนยืนยัน"))
    +'</button>'
    +'</div></div>';
  // init clock + canvas หลัง render
}

function renderCreate(){
  const jobPreview=getJobNoSync(S.fDate,S.tasks);
  const TYPES=["ส่งเอกสาร","รับเอกสาร","FZ"];
  const now=new Date();
  const thDateStr=now.toLocaleDateString("th-TH",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  const thTimeStr=pad(now.getHours())+"."+pad(now.getMinutes());
  return '<div class="create-wrap">'
    +'<div style="display:flex;align-items:center;gap:10px;padding:16px 0 14px;border-bottom:1px solid #1e2d44;margin-bottom:18px">'
    +'<button onclick="setState({page:\'list\'})" style="background:none;border:none;color:#06C755;font-size:24px;cursor:pointer;line-height:1">‹</button>'
    +'<div><div style="font-size:16px;font-weight:800;color:#fff">สร้างใบสั่งงานใหม่</div>'
    +'<div style="font-size:11px;color:#64748b;margin-top:2px">กรอกข้อมูลให้ครบทุกช่อง</div></div></div>'
    +'<div class="job-card">'
    +'<div style="flex:1">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:1px">เลขที่ใบงาน (JOB)</span><span style="font-size:10px;color:#475569;background:#0f172a;padding:1px 7px;border-radius:10px">อัตโนมัติ</span></div>'
    +'<div style="font-size:22px;font-weight:800;color:#06C755;font-family:monospace;letter-spacing:2px;margin-bottom:10px" id="job-preview">'+esc(jobPreview)+'</div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:1px">วันที่ / เวลา</span><span style="font-size:10px;color:#475569;background:#0f172a;padding:1px 7px;border-radius:10px">อัตโนมัติ</span></div>'
    +'<div style="font-size:14px;font-weight:700;color:#e2e8f4;font-family:monospace">'+thDateStr+'&nbsp;&nbsp;'+thTimeStr+'</div>'
    +'</div><div style="font-size:38px;opacity:.3">📋</div></div>'
    +'<div class="fg"><label class="fl">🔖 JOB NJ: <span style="font-size:10px;color:#475569;font-weight:400">เพิ่มได้หลายเลข คั่นด้วย , หรือกด Enter</span></label>'
    +njTagsHtml()+'</div>'
    +'<div class="fg" style="position:relative"><label class="fl">🏢 ชื่อบริษัท / ลูกค้า <span class="req">*</span> <span style="font-size:10px;color:#475569;font-weight:400">เลือกหรือพิมพ์ค้นหา / เพิ่มหลายบริษัทได้</span></label>'
    +'<div id="co-tags" style="display:flex;flex-wrap:wrap;gap:6px;background:#0f172a;border:1.5px solid #2a3a54;border-radius:10px 10px 0 0;padding:8px 10px;min-height:44px;cursor:text" onclick="document.getElementById(\'co-search-inp\').focus()">'
    +((S.fCompany||"").split(",").filter(v=>v.trim()).map(v=>{const safe=v.trim().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return '<span style="background:rgba(168,85,247,.1);color:#c084fc;border:1px solid rgba(168,85,247,.3);padding:2px 8px;border-radius:20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px">'+safe+'<button data-co="'+safe+'" onclick="removeCoTag(this.dataset.co)" style="background:none;border:none;color:#c084fc;cursor:pointer;font-size:12px;line-height:1;padding:0">×</button></span>';}).join(""))
    +'</div>'
    +'<input class="inp" id="co-search-inp" placeholder="🔍 พิมพ์ค้นหาชื่อบริษัท..." autocomplete="off"'
    +' style="border-radius:0 0 10px 10px;border-top:none;font-size:13px"'
    +' oninput="filterCo(this.value)" onfocus="showCoDropdown()" onblur="setTimeout(hideCoDropdown,200)" onpaste="pasteCoTags(event)">'
    +'<div id="co-dropdown" style="display:none;position:absolute;left:0;right:0;background:#1a2235;border:1.5px solid #c084fc;border-top:none;border-radius:0 0 10px 10px;max-height:240px;overflow-y:auto;z-index:200"></div>'
    +'</div>'
    +'<div class="frow">'
    +'<div class="fg"><label class="fl">📦 ประเภท</label>'
    +'<select class="inp" id="f-type" onchange="S.fType=this.value">'+TYPES.map(t=>'<option value="'+t+'"'+(S.fType===t?' selected':'')+'>'+t+'</option>').join("")+'</select></div>'
    +'<div class="fg"><label class="fl">📅 วันที่</label>'
    +'<input class="inp" id="f-date" type="date" value="'+S.fDate+'" onchange="S.fDate=this.value;refreshJobPreview()"></div>'
    +'</div>'
    +'<div class="frow">'
    +'<div class="fg"><label class="fl">🕐 เวลาไปรับ <span class="req">*</span></label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="inp" id="f-pickup-inp" type="text" inputmode="numeric" placeholder="เช่น 09:30" maxlength="5" value="'+esc(S.fPickup)+'" style="flex:1;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px" oninput="applyTimeInput(this,\'pickup\')" onblur="formatTimeInput(this,\'pickup\')">'
    +'<button type="button" onclick="openClock(\'pickup\')" style="background:#1a2235;border:1.5px solid #2a3a54;border-radius:10px;padding:10px 12px;color:#64748b;font-size:16px;cursor:pointer;flex-shrink:0;transition:all .2s" onmouseenter="this.style.borderColor=\'#06C755\'" onmouseleave="this.style.borderColor=\'#2a3a54\'">🕐</button>'
    +'</div></div>'
    +'<div class="fg"><label class="fl">🕑 เวลาส่งถึง</label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="inp" id="f-deliver-inp" type="text" inputmode="numeric" placeholder="เช่น 11:00" maxlength="5" value="'+esc(S.fDeliver)+'" style="flex:1;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px" oninput="applyTimeInput(this,\'deliver\')" onblur="formatTimeInput(this,\'deliver\')">'
    +'<button type="button" onclick="openClock(\'deliver\')" style="background:#1a2235;border:1.5px solid #2a3a54;border-radius:10px;padding:10px 12px;color:#64748b;font-size:16px;cursor:pointer;flex-shrink:0;transition:all .2s" onmouseenter="this.style.borderColor=\'#06C755\'" onmouseleave="this.style.borderColor=\'#2a3a54\'">🕑</button>'
    +'</div></div>'
    +'</div>'

    +'<div class="fg"><label class="fl">📍 สถานที่ <span class="req">*</span></label>'
    +'<div style="position:relative">'
    +'<input class="inp" id="f-place" placeholder="พิมพ์ค้นหาหรือเลือกสถานที่..." value="'+esc(S.fPlace)+'"'
    +' oninput="S.fPlace=this.value;filterPlaces(this.value)" onfocus="showPlaceList()" onblur="setTimeout(hidePlaceList,200)" autocomplete="off">'
    +'<div id="place-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#1a2235;border:1.5px solid #06C755;border-top:none;border-radius:0 0 10px 10px;max-height:220px;overflow-y:auto;z-index:200"></div>'
    +'</div></div>'
    +'<div class="fg"><label class="fl">📝 รายละเอียดงาน <span class="req">*</span></label>'
    +'<div style="position:relative">'
    +'<input class="inp" id="f-detail-search" placeholder="เลือกหรือพิมพ์รายละเอียด..." autocomplete="off"'
    +' oninput="S.fDetail=this.value;filterDetails(this.value)" onfocus="showDetailList()" onblur="setTimeout(hideDetailList,200)"'
    +' value="'+esc(S.fDetail)+'" style="border-radius:10px">'
    +'<div id="detail-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#1a2235;border:1.5px solid #3b82f6;border-radius:0 0 10px 10px;max-height:200px;overflow-y:auto;z-index:200;border-top:none"></div>'
    +'</div>'
    +'<textarea class="inp" id="f-detail" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..." style="margin-top:8px;min-height:60px;border-radius:10px">'+esc(S.fDetail)+'</textarea>'
    +'</div>'
    +'<input type="hidden" id="f-close-mode" value="messenger_finish">'
    +(S.fPreview
      ?'<div class="file-prev"><img src="'+S.fPreview+'"><span style="font-size:12px;color:#64748b;flex:1">'+esc(S.fFile?.name||"")+'</span><button onclick="setState({fFile:null,fPreview:null})" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer">×</button></div>'
      :'<label class="file-zone"><input type="file" accept="image/*" onchange="handleFile(this)">📎 แตะเพื่อแนบภาพ<br><span style="font-size:10px;color:#475569;display:block;margin-top:3px">PNG / JPG / WEBP</span></label>')
    +'</div></div>'
    +'<div class="fix-bar mobile-only-bar">'
    +'<button class="btn-green" onclick="createTask()"'+(S.saving?' disabled':'')+'>'+( S.saving?"⏳ กำลังบันทึก...":"✅ ยืนยันสร้างใบงาน")+'</button>'
    +'<button class="btn-outline" onclick="setState({page:\'list\'})">ยกเลิก</button></div>'
    +'<div class="desktop-only-bar" style="margin-top:20px;display:flex;gap:10px">'    +'<button class="btn-green" onclick="createTask()"'+(S.saving?' disabled':'')+' style="flex:1;max-width:360px">'+( S.saving?"⏳ กำลังบันทึก...":"✅ ยืนยันสร้างใบงาน")+'</button>'    +'<button class="btn-outline" onclick="setState({page:\'list\'})" style="max-width:140px">ยกเลิก</button>'    +'</div>';
}
function refreshJobPreview(){
  const d=document.getElementById("f-date")?.value||S.fDate;
  S.fDate=d;
  const el=document.getElementById("job-preview");
  if(el)el.textContent=getJobNoSync(d,S.tasks);
}

function renderEdit(){
  const t=S.tasks.find(x=>x.id===S.editTaskId);
  if(!t)return'<div style="padding:20px;color:#64748b">ไม่พบงาน</div>';
  const TYPES=["ส่งเอกสาร","รับเอกสาร","FZ"];
  return '<div class="create-wrap">'
    +'<div style="display:flex;align-items:center;gap:10px;padding:16px 0 14px;border-bottom:1px solid #1e2d44;margin-bottom:18px">'
    +'<button onclick="setState({page:\'list\',editTaskId:null})" style="background:none;border:none;color:#06C755;font-size:24px;cursor:pointer;line-height:1">‹</button>'
    +'<div><div style="font-size:16px;font-weight:800;color:#fff">✏️ แก้ไขใบงาน</div>'
    +'<div style="font-family:monospace;font-size:11px;color:#06C755;margin-top:2px">JOB: '+esc(t.job_number||t.id.slice(0,8))+'</div></div>'
    +'<div style="margin-left:auto;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:4px 10px;font-size:11px;color:#f59e0b;font-weight:700">⏳ สถานะ: รอรับงาน</div>'
    +'</div>'
    // NJ
    +'<div class="fg"><label class="fl">🔖 JOB NJ: <span style="font-size:10px;color:#475569;font-weight:400">คั่นด้วย , หรือกด Enter — ไม่เกิน 200 ตัว</span></label>'
    +njTagsHtml()+'</div>'
    // บริษัท
    +'<div class="fg" style="position:relative"><label class="fl">🏢 ชื่อบริษัท / ลูกค้า <span class="req">*</span></label>'
    +'<div id="co-tags" style="display:flex;flex-wrap:wrap;gap:6px;background:#0f172a;border:1.5px solid #2a3a54;border-radius:10px 10px 0 0;padding:8px 10px;min-height:44px;cursor:text" onclick="document.getElementById(\'co-search-inp\').focus()">'
    +((S.fCompany||"").split(",").filter(v=>v.trim()).map(v=>{const safe=v.trim().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return'<span style="background:rgba(168,85,247,.1);color:#c084fc;border:1px solid rgba(168,85,247,.3);padding:2px 8px;border-radius:20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px">'+safe+'<button data-co="'+safe+'" onclick="removeCoTag(this.dataset.co)" style="background:none;border:none;color:#c084fc;cursor:pointer;font-size:12px;line-height:1;padding:0">×</button></span>';}).join(""))
    +'</div>'
    +'<input class="inp" id="co-search-inp" placeholder="🔍 พิมพ์ค้นหาชื่อบริษัท..." autocomplete="off" style="border-radius:0 0 10px 10px;border-top:none;font-size:13px" oninput="filterCo(this.value)" onfocus="showCoDropdown()" onblur="setTimeout(hideCoDropdown,200)">'
    +'<div id="co-dropdown" style="display:none;position:absolute;left:0;right:0;background:#1a2235;border:1.5px solid #c084fc;border-top:none;border-radius:0 0 10px 10px;max-height:240px;overflow-y:auto;z-index:200"></div>'
    +'</div>'
    // ประเภท + วันที่
    +'<div class="frow">'
    +'<div class="fg"><label class="fl">📦 ประเภท</label>'
    +'<select class="inp" id="f-type" onchange="S.fType=this.value">'+TYPES.map(tp=>'<option value="'+tp+'"'+(S.fType===tp?' selected':'')+'>'+tp+'</option>').join("")+'</select></div>'
    +'<div class="fg"><label class="fl">📅 วันที่</label>'
    +'<input class="inp" id="f-date" type="date" value="'+S.fDate+'" onchange="S.fDate=this.value" style="color-scheme:dark"></div>'
    +'</div>'
    // เวลา
    +'<div class="frow">'
    +'<div class="fg"><label class="fl">🕐 เวลาไปรับ <span class="req">*</span></label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="inp" id="f-pickup-inp" type="text" inputmode="numeric" placeholder="เช่น 09:30" maxlength="5" value="'+esc(S.fPickup)+'" style="flex:1;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px" oninput="applyTimeInput(this,\'pickup\')" onblur="formatTimeInput(this,\'pickup\')">'
    +'<button type="button" onclick="openClock(\'pickup\')" style="background:#1a2235;border:1.5px solid #2a3a54;border-radius:10px;padding:10px 12px;color:#64748b;font-size:16px;cursor:pointer;flex-shrink:0;transition:all .2s" onmouseenter="this.style.borderColor=\'#06C755\'" onmouseleave="this.style.borderColor=\'#2a3a54\'">🕐</button>'
    +'</div></div>'
    +'<div class="fg"><label class="fl">🕑 เวลาส่งถึง</label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="inp" id="f-deliver-inp" type="text" inputmode="numeric" placeholder="เช่น 11:00" maxlength="5" value="'+esc(S.fDeliver)+'" style="flex:1;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px" oninput="applyTimeInput(this,\'deliver\')" onblur="formatTimeInput(this,\'deliver\')">'
    +'<button type="button" onclick="openClock(\'deliver\')" style="background:#1a2235;border:1.5px solid #2a3a54;border-radius:10px;padding:10px 12px;color:#64748b;font-size:16px;cursor:pointer;flex-shrink:0;transition:all .2s" onmouseenter="this.style.borderColor=\'#06C755\'" onmouseleave="this.style.borderColor=\'#2a3a54\'">🕑</button>'
    +'</div></div>'
    +'</div>'
    // สถานที่
    +'<div class="fg"><label class="fl">📍 สถานที่ <span class="req">*</span></label>'
    +'<div style="position:relative">'
    +'<input class="inp" id="f-place" placeholder="พิมพ์ค้นหาหรือเลือกสถานที่..." value="'+esc(S.fPlace)+'" oninput="filterPlaces(this.value)" onfocus="showPlaceList()" onblur="setTimeout(hidePlaceList,200)" autocomplete="off">'
    +'<div id="place-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#1a2235;border:1.5px solid #06C755;border-top:none;border-radius:0 0 10px 10px;max-height:220px;overflow-y:auto;z-index:200"></div>'
    +'</div></div>'
    // รายละเอียด
    +'<div class="fg"><label class="fl">📝 รายละเอียดงาน <span class="req">*</span></label>'
    +'<div style="position:relative">'
    +'<input class="inp" id="f-detail-search" placeholder="เลือกหรือพิมพ์รายละเอียด..." autocomplete="off" oninput="filterDetails(this.value)" onfocus="showDetailList()" onblur="setTimeout(hideDetailList,200)" value="'+esc(S.fDetail)+'" style="border-radius:10px">'
    +'<div id="detail-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#1a2235;border:1.5px solid #3b82f6;border-radius:0 0 10px 10px;max-height:200px;overflow-y:auto;z-index:200;border-top:none"></div>'
    +'</div>'
    +'<textarea class="inp" id="f-detail" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..." style="margin-top:8px;min-height:60px;border-radius:10px">'+esc(S.fDetail)+'</textarea>'
    +'</div>'
    // ปุ่ม
    +'<div class="fix-bar mobile-only-bar">'
    +'<button class="btn-green" onclick="saveEditTask()"'+(S.saving?' disabled':'')+'>'+( S.saving?"⏳ กำลังบันทึก...":"✅ บันทึกการแก้ไข")+'</button>'
    +'<button class="btn-outline" onclick="setState({page:\'list\',editTaskId:null})">ยกเลิก</button></div>'
    // ปุ่มบน desktop (header)
    +(S.saving?'':'');
}

function renderAdmin(){
  const pending=S.users.filter(u=>u.status==="pending");
  const approved=S.users.filter(u=>u.status==="approved"&&u.role!=="superadmin");
  const suspended=S.users.filter(u=>u.status==="rejected");

  const card=(u)=>'<div class="admin-card" style="flex-wrap:wrap;gap:10px">'
    +'<div class="admin-av" style="background:'+ROLE_COLOR[u.role]+'22;color:'+ROLE_COLOR[u.role]+'">'+u.username[0].toUpperCase()+'</div>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +'<span style="font-size:14px;font-weight:700;color:#e2e8f4">'+esc(u.username)+'</span>'
    +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:'+ROLE_COLOR[u.role]+'22;color:'+ROLE_COLOR[u.role]+'">'+( ROLE_LABEL[u.role]||u.role)+'</span>'
    // badge can_finish
    +(u.can_finish&&u.role==="staff"?'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(6,199,85,.1);color:#06C755">✅ ปิดงานได้</span>':"")
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:6px;margin-top:5px">'
    +'<span style="font-size:11px;color:#475569">🔑</span>'
    +(u.password_hash
      ?'<span style="font-size:11px;color:#06C755">🔐 รหัสเข้ารหัสแล้ว</span>'
      :'<span id="pw-'+u.id+'" style="font-family:monospace;font-size:12px;color:#64748b;letter-spacing:1px">••••••••</span>'
       +'<button onclick="togglePw(\''+u.id+'\',\''+esc(u.password)+'\')" style="background:none;border:1px solid #2a3a54;border-radius:4px;color:#475569;font-size:10px;padding:1px 6px;cursor:pointer">แสดง</button>'
    )
    +'</div>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    +(u.status==="pending"
      ?'<button class="act-btn act-approve" onclick="approveUser(\''+u.id+'\')">✓ อนุมัติ</button>'
       +'<button class="act-btn act-reject" onclick="rejectUser(\''+u.id+'\')">✗ ปฏิเสธ</button>'
      :u.status==="approved"
        ?'<select onchange="changeRole(\''+u.id+'\',this.value)" style="background:#0f172a;border:1px solid #2a3a54;border-radius:6px;color:#e2e8f4;font-size:11px;padding:4px 8px;cursor:pointer">'
         +["staff","messenger","admin"].map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLE_LABEL[r]+'</option>').join("")
         +'</select>'
         // ปุ่ม toggle can_finish — เฉพาะ staff
         +(u.role==="staff"
           ?'<button onclick="toggleCanFinish(\''+u.id+'\','+(!u.can_finish)+')" style="background:'+(u.can_finish?"rgba(6,199,85,.12)":"rgba(100,116,139,.1)")+';border:1px solid '+(u.can_finish?"rgba(6,199,85,.4)":"#2a3a54")+';color:'+(u.can_finish?"#06C755":"#64748b")+';border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:700">'+(u.can_finish?"✅ ปิดงานได้":"➕ ให้ปิดงาน")+'</button>'
           :"")
         +'<button onclick="suspendUser(\''+u.id+'\')" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#f59e0b;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">⏸ ระงับ</button>'
         +'<button class="act-btn act-del" onclick="removeUser(\''+u.id+'\')">ลบ</button>'
        :'<span style="font-size:11px;color:#ef4444;padding:2px 8px;background:rgba(239,68,68,.08);border-radius:6px">⛔ ถูกระงับ</span>'
         +'<button onclick="approveUser(\''+u.id+'\')" style="background:rgba(6,199,85,.1);border:1px solid rgba(6,199,85,.3);color:#06C755;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">▶ เปิดใช้งาน</button>'
         +'<button class="act-btn act-del" onclick="removeUser(\''+u.id+'\')">ลบ</button>'
    )
    +'</div></div>';

  const guide='<div style="background:#111827;border:1px solid #1e2d44;border-radius:12px;padding:14px 18px;margin-bottom:16px">'
    +'<div style="font-size:11px;color:#475569;font-weight:700;letter-spacing:1px;margin-bottom:10px">📋 สิทธิ์การใช้งาน</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">'
    +[
      ["staff","🖥 ผู้สั่งงาน","สั่งงานได้อย่างเดียว (กด ➕ ให้ปิดงานได้)"],
      ["messenger","🏃 แมสเซ็นเจอร์","รับงาน วิ่งงาน ปิดงาน"],
      ["admin","🛡 Admin","สั่งงาน + ดูสถานะทั้งหมด + กราฟ"],
      ["superadmin","👑 Super Admin","ทำได้ทุกอย่าง (Full Access)"],
    ].map(([r,l,d])=>'<div style="display:flex;align-items:center;gap:8px">'
      +'<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:'+ROLE_COLOR[r]+'22;color:'+ROLE_COLOR[r]+';white-space:nowrap">'+l+'</span>'
      +'<span style="font-size:11px;color:#64748b">'+d+'</span>'+'</div>'
    ).join("")+'</div></div>';

  const allUsers=[...pending,...approved,...suspended];
  return '<div><div class="sec-head">👥 จัดการผู้ใช้</div>'
    +'<div class="admin-list">'+guide
    +(pending.length?'<div style="font-size:11px;color:#f59e0b;font-weight:700;padding:4px 0 8px">⏳ รออนุมัติ ('+pending.length+')</div>'+pending.map(u=>card(u)).join(""):"")
    +(approved.length?'<div style="font-size:11px;color:#06C755;font-weight:700;padding:10px 0 8px">✅ ใช้งานอยู่ ('+approved.length+')</div>'+approved.map(u=>card(u)).join(""):"")
    +(suspended.length?'<div style="font-size:11px;color:#ef4444;font-weight:700;padding:10px 0 8px">⛔ ถูกระงับ ('+suspended.length+')</div>'+suspended.map(u=>card(u)).join(""):"")
    +(!allUsers.length?'<div class="empty"><div style="font-size:28px;opacity:.4;margin-bottom:8px">👥</div><div>ยังไม่มีผู้ใช้</div></div>':"")
    +'</div><div style="height:90px"></div></div>'
    +'<div class="fix-bar"><button class="btn-green" onclick="setState({page:\'list\'})">‹ กลับหน้าหลัก</button></div>';
}

function renderLogin(){
  const isL=S.loginTab==="login";
  return '<div class="login-page">'
    +'<div class="login-icons">🚢 ✈️ 📦</div>'
    +'<div class="login-brand">MSG DISPATCH</div>'
    +'<div class="login-brand-sub">ระบบสั่งงานแมสเซ็นเจอร์</div>'
    +'<div class="login-card">'
    +'<div class="tab-row">'
    +'<button class="tab-btn'+(isL?" active":"")+'" onclick="setState({loginTab:\'login\',lErr:\'\',rErr:\'\',rOk:false})">🔒 เข้าสู่ระบบ</button>'
    +'<button class="tab-btn'+(!isL?" active":"")+'" onclick="setState({loginTab:\'register\',lErr:\'\',rErr:\'\',rOk:false})">📝 สมัครใช้งาน</button>'
    +'</div>'
    +(isL
      ?'<div class="fg"><label class="inp-lbl">Username</label><input class="inp" id="l-user" placeholder="กรอก Username" autocomplete="off" value="" onkeydown="if(event.key===\'Enter\')document.getElementById(\'l-pass\').focus()"></div>'
       +'<div class="fg"><label class="inp-lbl">Password</label>'
       +'<div style="position:relative">'
       +'<input class="inp" id="l-pass" type="'+(S.showPass?"text":"password")+'" placeholder="กรอก Password" autocomplete="current-password" value="" onkeydown="if(event.key===\'Enter\')doLogin()" style="padding-right:48px;-webkit-user-select:auto">'
       +'<button class="inp-eye" onclick="togglePass()" type="button" style="position:absolute;right:12px;bottom:10px;z-index:10;pointer-events:auto;background:none;border:none;color:#94a3b8;font-size:18px;padding:4px;-webkit-tap-highlight-color:transparent">'+(S.showPass?"🙈":"👁️")+'</button>'
       +'</div></div>'
       +'<div class="err-msg">'+S.lErr+'</div>'
       +'<button class="btn-green" onclick="doLogin()" type="button">เข้าสู่ระบบ →</button>'
      :S.rOk
        ?'<div class="pending-box"><div style="font-size:28px;margin-bottom:6px">⏳</div><div style="font-size:14px;font-weight:700;color:#f59e0b">รอการอนุมัติ</div><div style="font-size:12px;color:#64748b;margin-top:4px">Admin จะอนุมัติบัญชีของคุณ</div></div>'
         +'<button class="btn-outline" onclick="setState({loginTab:\'login\',rOk:false})" style="margin-top:12px">‹ กลับล็อกอิน</button>'
        :'<div class="fg"><label class="inp-lbl">Username</label><input class="inp" id="r-user" placeholder="ตั้ง Username" autocomplete="off"></div>'
         +'<div class="fg"><label class="inp-lbl">Password</label>'
         +'<div style="position:relative">'
         +'<input class="inp" id="r-pass" type="'+(S.showRPass?"text":"password")+'" placeholder="ตั้ง Password (6+ ตัว)" autocomplete="new-password" style="padding-right:48px;-webkit-user-select:auto">'
         +'<button class="inp-eye" onclick="toggleRPass()" type="button" style="position:absolute;right:12px;bottom:10px;z-index:10;pointer-events:auto;background:none;border:none;color:#94a3b8;font-size:18px;padding:4px;-webkit-tap-highlight-color:transparent">'+(S.showRPass?"🙈":"👁️")+'</button>'
         +'</div></div>'
         +'<div class="fg"><label class="inp-lbl">ยืนยัน Password</label><input class="inp" id="r-pass2" type="password" placeholder="พิมพ์อีกครั้ง" onkeydown="if(event.key===\'Enter\')doRegister()"></div>'
         +'<div class="err-msg">'+S.rErr+'</div>'
         +'<button class="btn-green" onclick="doRegister()" type="button">📝 สมัครใช้งาน</button>'
    )+'</div></div>';
}

async function doLogin(){
  const user=(document.getElementById("l-user")?.value||"").trim();
  const pass=(document.getElementById("l-pass")?.value||"").trim();
  if(!user||!pass){setState({lErr:"กรุณากรอก Username และ Password"});return}
  // แสดง loading ทันที
  const btn=document.querySelector(".btn-green");
  if(btn){btn.disabled=true;btn.textContent="⏳ กำลังเข้าสู่ระบบ...";}
  const found=await findUser(user,pass);
  if(!found){setState({lErr:"Username หรือ Password ไม่ถูกต้อง"});return}
  if(found.status==="pending"){setState({lErr:"บัญชีของคุณยังรอการอนุมัติ"});return}
  if(found.status==="rejected"){setState({lErr:"บัญชีของคุณถูกปฏิเสธ"});return}
  localStorage.setItem("msg_cu",JSON.stringify(found));
  S.currentUser=found;
  S.role=found.role==="messenger"?"messenger":"staff";
  setState({page:"list",lErr:""});
  loadTasks(true).then(()=>{
    startRealtime();
    // แสดง popup หลัง login + tasks โหลดแล้ว
    setTimeout(checkAndShowNotif,800);
  });
  showToast("ยินดีต้อนรับ "+found.username+" 👋","ok");
}
async function doRegister(){
  const user=(document.getElementById("r-user")?.value||"").trim();
  const pass=(document.getElementById("r-pass")?.value||"").trim();
  const pass2=(document.getElementById("r-pass2")?.value||"").trim();
  if(!user||!pass){setState({rErr:"กรุณากรอกข้อมูลให้ครบ"});return}
  if(pass.length<6){setState({rErr:"Password ต้องมีอย่างน้อย 6 ตัว"});return}
  if(pass!==pass2){setState({rErr:"Password ไม่ตรงกัน"});return}
  const res=await registerUser(user,pass);
  if(!res.ok){setState({rErr:res.msg});return}
  setState({rOk:true,rErr:""});
}
function doLogout(){stopRealtime();localStorage.removeItem("msg_cu");setState({currentUser:null,page:"login",tasks:[],users:[],lErr:""})}
function togglePass(){const i=document.getElementById("l-pass");if(!i)return;i.type=i.type==="password"?"text":"password";i.nextElementSibling.textContent=i.type==="password"?"👁️":"🙈"}
function toggleRPass(){const i=document.getElementById("r-pass");if(!i)return;i.type=i.type==="password"?"text":"password";i.nextElementSibling.textContent=i.type==="password"?"👁️":"🙈"}
async function loadAdmin(){S.users=await getUsers();setState({page:"admin"})}
async function suspendUser(id){
  if(!confirm("ระงับการใช้งานของ user นี้?"))return;
  await updateUserStatus(id,"rejected");
  S.users=await getUsers();setState({});showToast("⛔ ระงับแล้ว","warn");
}

function togglePw(id,pw){
  const el=document.getElementById("pw-"+id);
  const btn=el?.nextElementSibling;
  if(!el)return;
  if(el.textContent==="••••••••"){el.textContent=pw;el.style.color="#e2e8f4";if(btn)btn.textContent="ซ่อน";}
  else{el.textContent="••••••••";el.style.color="#64748b";if(btn)btn.textContent="แสดง";}
}

async function changeRole(id,role){
  await updateUserRole(id,role);
  S.users=await getUsers();
  setState({});showToast("✅ เปลี่ยนสิทธิ์เป็น "+ROLE_LABEL[role]+" แล้ว","ok");
}
async function toggleCanFinish(id,val){
  _usersCache=null;_localUsersCache=null;
  saveLocalUsers(getLocalUsers().map(u=>u.id===id?{...u,can_finish:val}:u));
  if(!DEMO)await sbUpdate("msg_users",id,{can_finish:val});
  if(S.currentUser?.id===id){
    S.currentUser={...S.currentUser,can_finish:val};
    localStorage.setItem("msg_cu",JSON.stringify(S.currentUser));
  }
  S.users=await getUsers();
  render();
  showToast(val?"✅ เปิดสิทธิ์ปิดงานแล้ว":"⛔ ถอนสิทธิ์ปิดงานแล้ว","ok");
}
async function approveUser(id){await updateUserStatus(id,"approved");S.users=await getUsers();render();showToast("✅ อนุมัติแล้ว","ok")}
async function rejectUser(id){await updateUserStatus(id,"rejected");S.users=await getUsers();render();showToast("❌ ปฏิเสธ","warn")}
async function removeUser(id){if(!confirm("ลบผู้ใช้นี้?"))return;await deleteUser(id);S.users=await getUsers();render();showToast("🗑 ลบแล้ว")}
// ── Image Compression (อัตโนมัติ ก่อนอัปโหลด) ──
function compressImage(file,maxPx=900,quality=0.65){
  // mobile-optimised: ใช้ createImageBitmap (faster decode) + OffscreenCanvas ถ้าทำได้
  return new Promise(resolve=>{
    const doCompress=(bitmap)=>{
      let w=bitmap.width,h=bitmap.height;
      if(w>maxPx||h>maxPx){
        if(w>h){h=Math.round(h*maxPx/w);w=maxPx;}
        else{w=Math.round(w*maxPx/h);h=maxPx;}
      }
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(bitmap,0,0,w,h);
      canvas.toBlob(blob=>{
        bitmap.close?.(); // free memory (ImageBitmap)
        const compressed=new File([blob],file.name,{type:"image/jpeg",lastModified:Date.now()});
        const r2=new FileReader();
        r2.onload=ev=>resolve({file:compressed,preview:ev.target.result});
        r2.readAsDataURL(compressed);
      },"image/jpeg",quality);
    };
    // createImageBitmap: เร็วกว่า Image() โดยไม่ block main thread
    if(typeof createImageBitmap!=="undefined"){
      createImageBitmap(file).then(doCompress).catch(()=>{
        // fallback: Image element
        const r=new FileReader();
        r.onload=e=>{const img=new Image();img.onload=()=>doCompress(img);img.src=e.target.result;};
        r.readAsDataURL(file);
      });
    }else{
      const r=new FileReader();
      r.onload=e=>{const img=new Image();img.onload=()=>doCompress(img);img.src=e.target.result;};
      r.readAsDataURL(file);
    }
  });
}

function handleFinishFile(inp){
  const f=inp.files[0];if(!f)return;
  if(f.size>5*1024*1024){showToast("⚠️ รูปใหญ่เกิน 5MB รองรับสูงสุด 5MB","warn");inp.value="";return;}
  showToast("⏳ กำลังประมวลผลรูป...","warn");
  compressImage(f).then(({file,preview})=>{
    if(file.size>1024*1024){showToast("⚠️ รูปยังใหญ่เกิน 1MB หลังบีบ — ลองใช้รูปขนาดเล็กกว่านี้","warn");inp.value="";return;}
    S.finishFile=file;
    S.finishPreview=preview;
    setState({}); // trigger render ผ่าน setState เพื่อ anti-double-frame
    showToast("✅ แนบรูปเรียบร้อย ("+Math.round(file.size/1024)+"KB)","ok");
  });
}

function confirmFinish(){
  const taskId=S.finishTaskId||S.selId;
  if(!taskId)return;
  if(S.finishMode==="photo"){
    if(!S.finishPreview&&!S.finishFile){
      showToast("⚠️ กรุณาแนบภาพหลักฐานก่อนยืนยัน","warn");
      return;
    }
  }else{
    const canvas=document.getElementById("sig-canvas");
    if(!canvas||!S.signatureData){showToast("⚠️ กรุณาเซ็นชื่อก่อนยืนยัน","warn");return}
  }
  const t=nowTime();
  const evidence=S.finishMode==="sign"?S.signatureData:(S.finishPreview||null);
  if(S.finishMode==="photo"&&S.finishFile&&!DEMO){
    uploadFinishImage(taskId,S.finishFile,t);
  }else{
    finishTask(taskId,evidence,t);
  }
}

// ── Signature Canvas ──
let _sigDrawing=false;
let _sigCtx=null;

function initSignatureCanvas(){
  const canvas=document.getElementById("sig-canvas");
  if(!canvas)return;
  const ctx=canvas.getContext("2d");
  _sigCtx=ctx;
  ctx.strokeStyle="#1e293b";
  ctx.lineWidth=2.5;
  ctx.lineCap="round";
  ctx.lineJoin="round";

  function getPos(e){
    const r=canvas.getBoundingClientRect();
    const scaleX=canvas.width/r.width;
    const scaleY=canvas.height/r.height;
    const src=e.touches?e.touches[0]:e;
    return{x:(src.clientX-r.left)*scaleX,y:(src.clientY-r.top)*scaleY};
  }
  function start(e){e.preventDefault();_sigDrawing=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);}
  function draw(e){e.preventDefault();if(!_sigDrawing)return;const p=getPos(e);ctx.lineTo(p.x,p.y);ctx.stroke();}
  function end(e){
    e.preventDefault();
    if(!_sigDrawing)return;
    _sigDrawing=false;
    // บันทึก signature เป็น dataURL
    S.signatureData=canvas.toDataURL("image/png");
    render(); // อัปเดตปุ่มยืนยัน
  }
  canvas.addEventListener("mousedown",start);
  canvas.addEventListener("mousemove",draw);
  canvas.addEventListener("mouseup",end);
  canvas.addEventListener("touchstart",start,{passive:false});
  canvas.addEventListener("touchmove",draw,{passive:false});
  canvas.addEventListener("touchend",end,{passive:false});
}

function clearSignature(){
  const canvas=document.getElementById("sig-canvas");
  if(!canvas)return;
  _sigCtx?.clearRect(0,0,canvas.width,canvas.height);
  S.signatureData=null;
  render();
  setTimeout(()=>initSignatureCanvas(),50);
}

async function uploadFinishImage(id,file,customTime){
  showToast("⏳ กำลังอัปโหลดรูป...","warn");
  try{
    const ext=file.name.split(".").pop()||"jpg";
    const fname="finish_"+id+"_"+Date.now()+"."+ext;
    const res=await fetch(SUPA_URL+"/storage/v1/object/msg-images/"+fname,{
      method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,"Content-Type":file.type},body:file
    });
    if(res.ok){finishTask(id,SUPA_URL+"/storage/v1/object/public/msg-images/"+fname,customTime);}
    else{finishTask(id,S.finishPreview,customTime);}
  }catch{finishTask(id,S.finishPreview,customTime);}
}

// ── NJ Tag functions ──
// ── NJ tags initial HTML (ใช้ทั้ง renderCreate และ renderEdit) ──
function njTagsHtml(){
  const cur=(S.fJobNJ||"").split(",").filter(v=>v.trim());
  const used=(S.fJobNJ||"").length;
  const left=200-used;
  const cc=left<20?"#ef4444":left<50?"#f59e0b":"#475569";
  const tags=cur.map(v=>{
    const safe=v.trim().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return '<span style="background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:20px;font-size:12px;font-family:monospace;display:flex;align-items:center;gap:4px">'+safe
      +'<button data-nj="'+safe+'" onclick="removeNjTag(this.dataset.nj)" style="background:none;border:none;color:#f59e0b;cursor:pointer;font-size:12px;line-height:1;padding:0">×</button></span>';
  }).join("");
  return '<div id="nj-tags" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#0f172a;border:1.5px solid #2a3a54;border-radius:10px;padding:8px 10px;min-height:44px;cursor:text" onclick="document.getElementById(\'nj-inp\').focus()">'
    +tags
    +'<input id="nj-inp" placeholder="'+(S.fJobNJ?"":"พิมพ์เลขแล้วกด Enter...")+'" maxlength="50"'
    +' style="border:none;background:transparent;color:#e2e8f4;font-size:13px;font-family:monospace;outline:none;min-width:100px;flex:1"'
    +' onkeydown="addNjTag(event)" oninput="this.placeholder=\'\' " onpaste="pasteNjTags(event)">'
    +'<span id="nj-counter" style="font-size:10px;color:'+cc+';white-space:nowrap">'+used+'/200</span>'
    +'</div>';
}

// ── Paste handlers — รองรับ copy-paste จากที่อื่น ──
function pasteNjTags(e){
  e.preventDefault();
  const text=(e.clipboardData||window.clipboardData).getData("text");
  if(!text)return;
  // แยกด้วย , ; Tab newline แล้วเพิ่มแต่ละ tag
  const vals=text.split(/[,;\t\n\r]+/).map(v=>v.trim()).filter(Boolean);
  const cur=S.fJobNJ?S.fJobNJ.split(",").filter(v=>v.trim()):[];
  vals.forEach(v=>{
    if(v&&!cur.includes(v)&&(S.fJobNJ||"").length+v.length<=200)cur.push(v);
  });
  S.fJobNJ=cur.join(",");
  renderNjTags();
  showToast("✅ วาง "+vals.length+" เลขแล้ว","ok");
}

function pasteCoTags(e){
  e.preventDefault();
  const text=(e.clipboardData||window.clipboardData).getData("text");
  if(!text)return;
  const vals=text.split(/[,;\t\n\r]+/).map(v=>v.trim()).filter(Boolean);
  vals.forEach(v=>{ if(v)toggleCoTag(v); });
  const inp=document.getElementById("co-search-inp");
  if(inp){inp.value="";filterCo("");}
  showToast("✅ วาง "+vals.length+" บริษัทแล้ว","ok");
}

function addNjTag(e){
  if(e.key==="Enter"||e.key===","||e.key===";"){
    e.preventDefault();
    const val=e.target.value.trim().replace(/,/g,"");
    if(!val)return;
    const cur=S.fJobNJ?S.fJobNJ.split(",").filter(v=>v.trim()):[];
    if(cur.includes(val)){e.target.value="";return;} // ซ้ำ ข้ามได้
    const nextVal=cur.length?S.fJobNJ+","+val:val;
    if(nextVal.length>200){showToast("⚠️ JOB NJ เกิน 200 ตัวอักษรแล้ว","warn");return;}
    cur.push(val);S.fJobNJ=cur.join(",");
    e.target.value="";
    renderNjTags();
  }
}
function removeNjTag(val){
  const cur=(S.fJobNJ||"").split(",").filter(v=>v.trim()&&v.trim()!==val);
  S.fJobNJ=cur.join(",");renderNjTags();
}
function renderNjTags(){
  const wrap=$el("nj-tags");if(!wrap)return;
  const cur=(S.fJobNJ||"").split(",").filter(v=>v.trim());
  const used=(S.fJobNJ||"").length;
  const left=200-used;
  const counterColor=left<20?"#ef4444":left<50?"#f59e0b":"#475569";
  wrap.innerHTML=cur.map(v=>{
    const safe=v.trim().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return '<span style="background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:20px;font-size:12px;font-family:monospace;display:flex;align-items:center;gap:4px">'+safe
      +'<button data-nj="'+safe+'" onclick="removeNjTag(this.dataset.nj)" style="background:none;border:none;color:#f59e0b;cursor:pointer;font-size:12px;line-height:1;padding:0">×</button></span>';
  }).join("")
    +'<input id="nj-inp" placeholder="" maxlength="50"'
    +' style="border:none;background:transparent;color:#e2e8f4;font-size:13px;font-family:monospace;outline:none;min-width:100px;flex:1"'
    +' onkeydown="addNjTag(event)" onpaste="pasteNjTags(event)">'
    +'<span id="nj-counter" style="font-size:10px;color:'+counterColor+';white-space:nowrap;align-self:center;margin-left:4px">'+used+'/200</span>';
  document.getElementById("nj-inp")?.focus();
}

// ── Company Tag functions ──
function addCoTag(e){
  if(e.key==="Enter"||e.key===","||e.key===";"){
    e.preventDefault();
    const val=e.target.value.trim().replace(/,/g,"");
    if(!val)return;
    const cur=S.fCompany?S.fCompany.split(",").filter(v=>v.trim()):[];
    if(!cur.includes(val)){cur.push(val);S.fCompany=cur.join(",");}
    e.target.value="";
    renderCoTags();
  }
}
function removeCoTag(val){
  const cur=(S.fCompany||"").split(",").filter(v=>v.trim()&&v.trim()!==val);
  S.fCompany=cur.join(",");renderCoTags();
}
function renderCoTags(){
  const wrap=$el("co-tags");if(!wrap)return;
  const cur=(S.fCompany||"").split(",").filter(v=>v.trim());
  wrap.innerHTML=cur.map(v=>{const safe=v.trim().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return '<span style="background:rgba(168,85,247,.1);color:#c084fc;border:1px solid rgba(168,85,247,.3);padding:2px 8px;border-radius:20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px">'+safe+'<button data-co="'+safe+'" onclick="removeCoTag(this.dataset.co)" style="background:none;border:none;color:#c084fc;cursor:pointer;font-size:12px;line-height:1;padding:0">×</button></span>';}).join("")
    +'<input id="co-inp" placeholder="" style="border:none;background:transparent;color:#e2e8f4;font-size:14px;font-weight:600;outline:none;min-width:120px;flex:1" onkeydown="addCoTag(event)">';
  document.getElementById("co-inp")?.focus();
}

function handleFile(inp){
  const f=inp.files[0];if(!f)return;
  if(f.size>5*1024*1024){showToast("⚠️ รูปใหญ่เกิน 5MB รองรับสูงสุด 5MB","warn");inp.value="";return;}
  showToast("⏳ กำลังประมวลผลรูป...","warn");
  compressImage(f).then(({file,preview})=>{
    if(file.size>1024*1024){showToast("⚠️ รูปยังใหญ่เกิน 1MB หลังบีบ — ลองใช้รูปขนาดเล็กกว่านี้","warn");inp.value="";return;}
    S.fFile=file;
    setState({fPreview:preview});
    showToast("✅ แนบรูปเรียบร้อย ("+Math.round(file.size/1024)+"KB)","ok");
  });
}

// ── Clock ──
let _cTarget="",_cH=null,_cM=null,_cStep="hour";
function openClock(target){
  _cTarget=target;_cStep="hour";
  let cur="";
  if(target==="pickup")cur=S.fPickup;
  else if(target==="deliver")cur=S.fDeliver;
  if(cur&&cur!=="–"){const p=cur.split(":");_cH=+p[0];_cM=+p[1];}
  else{const n=new Date();_cH=n.getHours();_cM=Math.round(n.getMinutes()/5)*5%60;}
  const titles={pickup:"🕐 เวลาไปรับงาน",deliver:"🕑 เวลาส่งถึง"};
  document.getElementById("clock-title").textContent=titles[target]||"เลือกเวลา";
  $el("clock-bg").style.display="flex";
  buildClock();
}
function buildClock(){
  const face=document.getElementById("clock-face");if(!face)return;
  document.getElementById("clock-disp").textContent=(_cH!==null?pad(_cH):"--")+":"+(_cM!==null?pad(_cM):"--");
  document.getElementById("clock-hint").textContent=_cStep==="hour"?"แตะเลือก ชั่วโมง (0–23)":"แตะเลือก นาที";
  const R=96,cx=105,cy=105;let html='<div class="clock-center-dot"></div>';
  if(_cStep==="hour"){
    for(let i=0;i<24;i++){
      const a=(i<12?i:i-12)/12*Math.PI*2-Math.PI/2;
      const rd=i<12?R*0.78:R*0.5;
      const x=cx+rd*Math.cos(a),y=cy+rd*Math.sin(a);
      html+='<div class="cnum'+(_cH===i?" on":"")+'" style="left:'+x+'px;top:'+y+'px" onclick="pickH('+i+')">'+i+'</div>';
    }
    if(_cH!==null){const a=(_cH%12)/12*Math.PI*2-Math.PI/2;const rd=_cH<12?R*0.78-15:R*0.5-15;html+='<div class="clock-hand" style="height:'+rd+'px;transform:rotate('+(_cH%12/12*360-90)+'deg)"></div>';}
  }else{
    const ms=[0,5,10,15,20,25,30,35,40,45,50,55];
    ms.forEach((m,i)=>{const a=i/12*Math.PI*2-Math.PI/2;const x=cx+R*0.78*Math.cos(a),y=cy+R*0.78*Math.sin(a);html+='<div class="cnum'+(_cM===m?" on":"")+'" style="left:'+x+'px;top:'+y+'px" onclick="pickM('+m+')">'+pad(m)+'</div>';});
    if(_cM!==null){const a=_cM/60*Math.PI*2-Math.PI/2;html+='<div class="clock-hand" style="height:'+(R*0.78-15)+'px;transform:rotate('+(_cM/60*360-90)+'deg)"></div>';}
  }
  face.innerHTML=html;
}
function pickH(h){_cH=h;_cStep="minute";buildClock()}
function pickM(m){_cM=m;buildClock()}
function closeClock(){$el("clock-bg").style.display="none"}
function confirmClock(){
  if(_cH===null){showToast("⚠️ เลือกชั่วโมงก่อน","warn");return}
  if(_cM===null)_cM=0;
  const val=pad(_cH)+":"+pad(_cM);
  if(_cTarget==="pickup"){
    S.fPickup=val;closeClock();
    const inp=document.getElementById("f-pickup-inp");if(inp)inp.value=val;
    const el=document.getElementById("pickup-disp");if(el){el.textContent=val;el.classList.add("set");}
  }else if(_cTarget==="deliver"){
    S.fDeliver=val;closeClock();
    const inp=document.getElementById("f-deliver-inp");if(inp)inp.value=val;
    const el=document.getElementById("deliver-disp");if(el){el.textContent=val;el.classList.add("set");}
  }
}

// ── Time Input helpers ──
function applyTimeInput(el,target){
  let v=el.value.replace(/[^0-9:]/g,""); // เฉพาะตัวเลขและ :
  // ใส่ : อัตโนมัติหลังตัวเลข 2 ตัวแรก
  if(v.length===2&&!v.includes(":"))v=v+":";
  if(v.length>5)v=v.slice(0,5);
  el.value=v;
  // อัปเดต state ทันทีถ้า valid
  if(/^\d{1,2}:\d{2}$/.test(v)){
    const [h,m]=v.split(":").map(Number);
    if(h>=0&&h<=23&&m>=0&&m<=59){
      if(target==="pickup")S.fPickup=pad(h)+":"+pad(m);
      else S.fDeliver=pad(h)+":"+pad(m);
    }
  }
}

function formatTimeInput(el,target){
  let v=el.value.trim();
  // แปลง 4 หลักเป็น HH:MM เช่น "0930" → "09:30"
  if(/^\d{3,4}$/.test(v)){
    v=v.padStart(4,"0");
    v=v.slice(0,2)+":"+v.slice(2);
  }
  const [h,m]=(v.split(":")||[]).map(Number);
  if(!isNaN(h)&&!isNaN(m)&&h>=0&&h<=23&&m>=0&&m<=59){
    const formatted=pad(h)+":"+pad(m);
    el.value=formatted;
    if(target==="pickup")S.fPickup=formatted;
    else S.fDeliver=formatted;
  }else if(v===""){
    if(target==="pickup")S.fPickup="";
    else S.fDeliver="";
  }else{
    showToast("⚠️ รูปแบบเวลาไม่ถูกต้อง เช่น 09:30","warn");
    el.style.borderColor="#ef4444";
    setTimeout(()=>{el.style.borderColor="";},2000);
  }
}

// ── Export ──
function getFilteredExportData(){
  const isAdmin=canViewAll(S.currentUser);
  const me=S.currentUser?.username||"";
  // กรองตาม role ก่อน
  let data=isAdmin?S.tasks:S.tasks.filter(t=>t.created_by===me);
  // กรองตาม status filter
  if(S.filter!=="all")data=data.filter(t=>t.status===S.filter);
  // กรองวันที่
  if(S.expDateFrom)data=data.filter(t=>t.date&&t.date>=S.expDateFrom);
  if(S.expDateTo)data=data.filter(t=>t.date&&t.date<=S.expDateTo);
  // กรองบริษัท
  if(S.expCompany){const q=S.expCompany.toLowerCase().trim();data=data.filter(t=>(t.company||"").toLowerCase().includes(q));}
  return data;
}
function getExportData(){return getFilteredExportData()}
function exportCSV(){
  const data=getFilteredExportData();if(!data.length){showToast("⚠️ ไม่มีข้อมูล","warn");return}
  const H=["JOB","JOB NJ","บริษัท","ประเภท","รายละเอียด","สถานที่","วันที่","เวลารับ","เวลาส่ง","ตรวจปล่อย","จ่ายเงินถึง","สถานะ","ผู้สั่ง","แมส","เวลาเริ่ม","เวลาเสร็จ"];
  const rows=data.map(t=>[t.job_number||t.id.slice(0,8),t.job_nj||"",t.company||"",t.type||"",t.detail||"",t.place||"",t.date||"",t.pickup_time||"",t.deliver_time||"",t.inspect_date||"",t.pay_date||"",{wait:"รอรับ",going:"กำลังวิ่ง",done:"เสร็จ"}[t.status]||"",t.created_by||"",t.messenger_name||"",t.start_time||"",t.end_time||""].map(v=>'"'+String(v).replace(/"/g,'""')+'"'));
  const csv="\uFEFF"+[H,...rows].map(r=>r.join(",")).join("\n");
  dlFile(new Blob([csv],{type:"text/csv;charset=utf-8"}),"msg_report_"+todayStr()+".csv");
  showToast("📊 Export CSV แล้ว","ok");
}
function exportExcel(){
  const data=getFilteredExportData();if(!data.length){showToast("⚠️ ไม่มีข้อมูล","warn");return}

  // Header ตรงตาม template Excel
  const H=[
    "เลขที่ใบงาน (JOB)",
    "วันที่อัตโนมัติ",
    "เวลาอัตโนมัติ",
    "JOB NJ/ENTRY",
    "บริษัท",
    "รายละเอียด",
    "สถานที่",
    "User ผู้สั่งสร้างใบงาน",
    "วันที่",
    "เวลารับ",
    "เวลาส่ง",
    "User กดรับงาน",
    "เวลากำลังวิ่ง",
    "เวลาเสร็จงาน"
  ];

  // แปลงวันที่เป็น Thai format
  function thDateFull(s){
    try{
      const d=new Date(s);
      return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear();
    }catch{return s||""}
  }
  function nowDateThai(){
    const d=new Date();
    return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear();
  }

  let html='<html><head><meta charset="UTF-8">'
    +'<style>'
    +'body{font-family:Sarabun,TH SarabunPSK,sans-serif;font-size:12px}'
    +'table{border-collapse:collapse;width:100%}'
    +'th{background:#1e3a5f;color:#fff;padding:7px 8px;border:1px solid #94a3b8;font-size:12px;font-weight:700;text-align:center;white-space:nowrap}'
    +'td{padding:6px 8px;border:1px solid #cbd5e1;font-size:12px;vertical-align:middle}'
    +'tr:nth-child(even)td{background:#f8fafc}'
    +'.status-wait{background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:4px;font-weight:700}'
    +'.status-going{background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:4px;font-weight:700}'
    +'.status-done{background:#dcfce7;color:#166534;padding:1px 6px;border-radius:4px;font-weight:700}'
    +'</style></head><body>'
    +'<h2 style="color:#1e3a5f;font-family:Sarabun,sans-serif;margin-bottom:12px">รายงาน MSG Dispatch — '+todayStr()+'</h2>'
    +'<table>'
    // แถวหัว
    +'<tr>'+H.map(h=>'<th>'+h+'</th>').join("")+'</tr>';

  data.forEach(t=>{
    // วันที่สร้างงาน (อัตโนมัติ) แยกเป็น 2 คอลัมน์ เหมือน template
    const createdAt=t.created_at?new Date(t.created_at):null;
    const createdDateTH=createdAt?pad(createdAt.getDate())+"/"+pad(createdAt.getMonth()+1)+"/"+createdAt.getFullYear():"";
    const createdTime=createdAt?pad(createdAt.getHours())+"."+pad(createdAt.getMinutes()):"";
    // วันที่ของงาน
    const taskDateTH=t.date?thDateFull(t.date):t.date||"";

    const row=[
      t.job_number||t.id.slice(0,8),   // A: JOB number
      createdDateTH,                     // B: วันที่อัตโนมัติ (created_at)
      createdTime,                       // C: เวลาอัตโนมัติ
      t.job_nj||"",                      // D: JOB NJ/ENTRY
      t.company||"",                     // E: บริษัท
      (t.type||"")+(t.detail?" — "+t.detail:""), // F: ประเภท — รายละเอียด
      t.place||"",                       // G: สถานที่
      t.created_by||"",                  // H: User ผู้สั่ง
      taskDateTH,                        // I: วันที่ของงาน
      t.pickup_time||"–",               // J: เวลารับ
      t.deliver_time||"–",              // K: เวลาส่ง
      t.messenger_name||"",             // L: User แมส (กดรับงาน)
      t.start_time||"",                 // M: เวลากำลังวิ่ง
      t.end_time||"",                   // N: เวลาเสร็จงาน
    ];
    html+='<tr>'+row.map(v=>'<td>'+esc(String(v))+'</td>').join("")+'</tr>';
  });

  html+='</table>'
    +'<div style="margin-top:8px;font-size:10px;color:#94a3b8;font-family:Sarabun,sans-serif">Export: '+new Date().toLocaleString("th-TH")+'</div>'
    +'</body></html>';

  dlFile(new Blob(["\uFEFF"+html],{type:"application/vnd.ms-excel;charset=utf-8"}),"msg_report_"+todayStr()+".xls");
  showToast("📗 Export Excel แล้ว","ok");
}
function toggleMenu(id){
  const m=document.getElementById(id);if(!m)return;
  const isOpen=m.style.display!=="none";
  closeMenus();
  if(!isOpen){
    m.style.display="block";
    setTimeout(()=>document.addEventListener("click",function h(e){
      if(!m.closest("[id$='-wrap']")?.contains(e.target)){m.style.display="none";document.removeEventListener("click",h);}
    }),10);
  }
}
function closeMenus(){
  ["pdf-menu"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
}


function exportPDF(mode,taskId){
  let data;
  if(mode==="single"&&taskId){
    data=S.tasks.filter(t=>t.id===taskId);
  }else{
    data=getFilteredExportData();
  }
  if(!data.length){showToast("⚠️ ไม่มีข้อมูล","warn");return}
  const w=window.open("","_blank");if(!w){showToast("⚠️ อนุญาต popup ก่อน","warn");return}
  const printDate=new Date().toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const SL2={wait:"⏳ รอรับงาน",going:"🏃 กำลังวิ่ง",done:"✅ เสร็จแล้ว"};
  const SC={wait:"#f59e0b",going:"#3b82f6",done:"#16a34a"};

  const slips=data.map((t,i)=>{
    const sc=SC[t.status]||"#64748b";
    const sl=SL2[t.status]||t.status;
    const thDateTask=t.date?new Date(t.date).toLocaleDateString("th-TH",{weekday:"short",year:"numeric",month:"short",day:"numeric"}):t.date||"–";
    return `<div class="slip${i<data.length-1?" page-break":""}">
      <!-- หัวใบงาน -->
      <div class="slip-hdr">
        <div style="display:flex;align-items:center;gap:10px"><img src="data:image/png;base64,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" style="height:36px;width:auto"><div><div style="font-size:15px;font-weight:800;color:#cc0000;letter-spacing:.5px;line-height:1.2">N.J. LOGISTICS & FRUITS CO., LTD.</div><div style="font-size:10px;color:#64748b;margin-top:1px">N.J. LOGISTICS</div></div></div>
      </div>
      <!-- เลขที่ใบงาน + วันที่ -->
      <div class="row2">
        <div class="field-box accent-green">
          <div class="field-lbl">เลขที่ใบงาน (JOB)</div>
          <div class="field-val big mono">${esc(t.job_number||t.id.slice(0,8).toUpperCase())}</div>
        </div>
        <div class="field-box">
          <div class="field-lbl">วันที่ / เวลา</div>
          <div class="field-val mono">${thDateTask}</div>
          <div class="field-sub">⏰ รับ ${esc(t.pickup_time||"–")} → ส่ง ${esc(t.deliver_time||"–")}</div>
        </div>
      </div>
      <!-- JOB NJ -->
      <div class="field-line accent-yellow">
        <span class="field-lbl">🔖 JOB NJ (เลขอ้างอิงลูกค้า)</span>
        <span class="field-val mono">${esc(t.job_nj||"–")}</span>
      </div>
      <!-- บริษัท -->
      <div class="field-line accent-purple">
        <span class="field-lbl">🏢 ชื่อบริษัท / ลูกค้า</span>
        <span class="field-val bold">${esc(t.company||"–")}</span>
      </div>
      <!-- รายละเอียด + สถานที่ -->
      <div class="field-line">
        <span class="field-lbl">📦 ประเภท / รายละเอียด</span>
        <span class="field-val">${esc(t.type||"")}${t.detail?" — "+esc(t.detail):""}</span>
      </div>
      <div class="field-line">
        <span class="field-lbl">📍 สถานที่</span>
        <span class="field-val">${esc(t.place||"–")}</span>
      </div>
      <!-- ผู้สร้าง + แมส -->
      <div class="row2" style="margin-top:6px">
        <div class="field-box">
          <div class="field-lbl">👤 ชื่อ User สร้างใบงาน</div>
          <div class="field-val bold">${esc(t.created_by||"–")}</div>
        </div>
        <div class="field-box">
          <div class="field-lbl">🏃 แมสเซ็นเจอร์</div>
          <div class="field-val bold" style="color:#2563eb">${esc(t.messenger_name||"–")}</div>
        </div>
      </div>
      <!-- สถานะการวิ่ง -->
      ${t.start_time||t.end_time?`<div class="timeline">
        ${t.start_time?`<div class="tl-item blue">🏃 เริ่มวิ่ง <strong>${esc(t.start_time)}</strong></div>`:""}
        ${t.end_time?`<div class="tl-item green">✅ ส่งเสร็จ <strong>${esc(t.end_time)}</strong></div>`:""}
      </div>`:""}
      <!-- ภาพหลักฐาน -->
      ${t.image_url?`<div style="margin-top:8px"><div class="field-lbl">📸 ภาพหลักฐาน</div><img loading="lazy" src="${esc(t.image_url)}" style="max-width:180px;max-height:140px;border-radius:8px;border:1px solid #e2e8f0;margin-top:4px"></div>`:""}
      <!-- ลายเซ็น -->
      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">ผู้สั่งงาน</div>
          <div class="sig-name">${esc(t.created_by||"")}</div>
          <div class="sig-date">วันที่ ............./............./.............</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">แมสเซ็นเจอร์</div>
          <div class="sig-name">${esc(t.messenger_name||"")}</div>
          <div class="sig-date">วันที่ ............./............./.............</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">ผู้รับ</div>
          <div class="sig-name">${esc(t.recipient||"")}</div>
          <div class="sig-date">วันที่ ............./............./.............</div>
        </div>
      </div>
      <!-- footer ใบงาน -->

    </div>`;
  }).join("");

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>ใบสั่งงาน MSG</title>
<style>
/* font โหลดจาก head แล้ว */
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;background:#f1f5f9;padding:20px;color:#1e293b}
.slip{background:#fff;border-radius:14px;padding:22px 24px;margin-bottom:24px;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:720px;margin-left:auto;margin-right:auto;border:1px solid #e2e8f0}
.slip-hdr{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:2px solid #1e3a5f}
.slip-logo{font-size:16px;font-weight:800;color:#1e3a5f}
.slip-title{flex:1;font-size:13px;color:#64748b;font-weight:600}
.slip-status{padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}
.field-box{background:#f8fafc;border-radius:8px;padding:10px 12px;border-left:3px solid #e2e8f0}
.accent-green{border-left-color:#16a34a;background:#f0fdf4}
.accent-yellow{border-left-color:#f59e0b}
.accent-purple{border-left-color:#7c3aed;background:#faf5ff}
.accent-orange{border-left-color:#ea580c;background:#fff7ed}
.field-lbl{font-size:10px;color:#64748b;font-weight:700;letter-spacing:.5px;margin-bottom:4px}
.field-val{font-size:14px;color:#1e293b;font-weight:600}
.field-val.big{font-size:20px;font-weight:800}
.field-val.mono{font-family:monospace;letter-spacing:1px}
.field-val.bold{font-weight:700}
.field-sub{font-size:11px;color:#64748b;margin-top:2px;font-family:monospace}
.field-line{display:flex;align-items:baseline;gap:10px;padding:8px 12px;border-radius:8px;background:#f8fafc;margin-bottom:6px}
.field-line .field-lbl{white-space:nowrap;min-width:160px}
.field-line .field-val{font-size:13px}
.timeline{display:flex;gap:12px;padding:8px 12px;background:#f0f9ff;border-radius:8px;margin-top:6px;flex-wrap:wrap}
.tl-item{font-size:12px;padding:2px 10px;border-radius:20px}
.tl-item.blue{background:#dbeafe;color:#1e40af}
.tl-item.green{background:#dcfce7;color:#166534}
.sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:20px;padding-top:16px;border-top:1px dashed #cbd5e1}
.sig-box{text-align:center}
.sig-line{height:44px;border-bottom:1.5px solid #94a3b8;margin-bottom:5px}
.sig-lbl{font-size:11px;color:#64748b;font-weight:700}
.sig-name{font-size:11px;color:#0f172a;font-weight:600;min-height:14px;margin-top:2px}
.sig-date{border-top:1px solid #e2e8f0;margin-top:5px;padding-top:3px;font-size:10px;color:#64748b}
.sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:20px;padding-top:16px;border-top:1px dashed #cbd5e1}
.sig-box{text-align:center}
.sig-line{height:44px;border-bottom:1.5px solid #94a3b8;margin-bottom:5px}
.sig-lbl{font-size:11px;color:#64748b;font-weight:700}
.sig-name{font-size:11px;color:#0f172a;font-weight:600;min-height:14px;margin-top:2px}
.sig-date{border-top:1px solid #e2e8f0;margin-top:5px;padding-top:3px;font-size:10px;color:#64748b}
.slip-footer{margin-top:14px;padding-top:10px;border-top:1px dashed #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
.page-break{page-break-after:always}
.no-print{margin-bottom:20px;max-width:720px;margin-left:auto;margin-right:auto;display:flex;gap:8px}
@media print{.no-print{display:none!important}body{background:#fff;padding:0}.slip{box-shadow:none;margin:0;border-radius:0;border:none;max-width:100%}}
</style></head><body>
<div class="no-print">
  <button onclick="window.print()" style="background:#1e3a5f;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-family:Sarabun,sans-serif;cursor:pointer;font-weight:700">🖨️ พิมพ์ / Save PDF</button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#334155;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-family:Sarabun,sans-serif;cursor:pointer">ปิด</button>
  <span style="font-size:12px;color:#64748b;align-self:center">📄 ${data.length} ใบงาน</span>
</div>
${slips}
</body></html>`);
  w.document.close();
  showToast("📄 เปิดใบสั่งงาน PDF แล้ว","ok");
}
function dlFile(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}

// ── Place Manager ──
const PLACES_DEFAULT=[
  {g:"ท่าเรือ A2",items:["จิงเจียง","Wan Hai","Interasia"]},
  {g:"ท่าเรือ A3",items:["Yang Ming","SM Line"]},
  {g:"ท่าเรือ B1",items:["Sinokor","KMTC","Namsung","CK Line","Hwang-Ae"]},
  {g:"ท่าเรือ B2",items:["Evergreen"]},
  {g:"ท่าเรือ B3",items:["CU Line"]},
  {g:"ท่าเรือ B4",items:[]},
  {g:"ท่าเรือ B5",items:["Ben Line","ZIM","Samudera"]},
  {g:"ท่าเรือ AO",items:[]},
  {g:"ท่าเรือ C1&C2",items:[]},
  {g:"ท่าเรือ D1D2",items:[]},
  {g:"ท่าเรือ C3",items:["Star Line","TS Line"]},
  {g:"JWD",items:[]},
  {g:"Saim Seaport",items:["KERRY"]},
  {g:"รอบตึก",items:["ONE","ด่านตรวจพืช","H.I.T","AGN","Kuehne+Nagel","ECU","Transcontainer","EMS","Legend","Renus","GENETICS","APL Penanshin","รถทัวร์","Shipco","ลานไพลอท"]},
  {g:"ตึกทะเลทอง ชั้น 0",items:["IKANO"]},
  {g:"ตึกทะเลทอง ชั้น 2",items:["DHL"]},
  {g:"ตึกทะเลทอง ชั้น 5",items:["Schenker","DSV"]},
  {g:"ตึกทะเลทอง ชั้น 6",items:["OOCL","CMA"]},
  {g:"ตึกทะเลทอง ชั้น 7",items:["Maersk"]},
  {g:"ตึกทะเลทอง ชั้น 9",items:["MSC"]},
  {g:"ตึกทะเลทอง ชั้น 10",items:["Pilot","HMM","CEVA","Freight Link"]},
  {g:"ตึกทะเลทอง ชั้น 11",items:["Hapag-Lloyd","Evergreen","LEO"]},
  {g:"ตึกทะเลทอง ชั้น 12",items:["COSCO","NTL"]},
  {g:"ตึกทะเลทอง ชั้น 15",items:["Sunfar"]},
  {g:"หน่วยงานราชการ / ด่าน",items:["อ.ย.","ด่านแหลมฉบัง","กรมป่าไม้","กรมปศุสัตว์","ด่านตรวจพืช"]},
  {g:"วางบิลรอบนอก",items:["Thaiam","Kuehne","DHL","HOYA","Schenker 16","Schenker หนองก้างปลา","Schenker กิ่งแก้ว","Harley","Pro Inter","Schaeffler Park 5"]},
  {g:"อมตะชิตี้(2871)",items:["นต.มด"]},
  {g:"อมตะชิตี้(2841)",items:["นต.ปฐมพงษ์"]},
  {g:"อมตะชิตี้",items:["นต.ดำริ"]},
  {g:"เหมราช(2844)",items:["นต.กิ่งกนก"]},
  {g:"อมตะนคร",items:["ไทยอั้ม"]},
  {g:"คลังสหไทย",items:[]},
  {g:"EPZ แหลมฉบัง",items:[]},
  {g:"คลังปลาวาฬ",items:[]},
];
const PLACES_KEY="msg_places_v6";
function getPlaces(){
  try{const s=JSON.parse(localStorage.getItem(PLACES_KEY)||"null");if(s&&Array.isArray(s))return s;}catch{}
  const d=JSON.parse(JSON.stringify(PLACES_DEFAULT));localStorage.setItem(PLACES_KEY,JSON.stringify(d));return d;
}
function savePlaces(data){localStorage.setItem(PLACES_KEY,JSON.stringify(data))}

function buildPlaceHTML(filter){
  const places=getPlaces();let html="";
  const q=(filter||"").toLowerCase().trim();
  places.forEach(({g,items})=>{
    const gLow=g.toLowerCase();
    // กลุ่มที่ไม่มี items (คลังสหไทย, EPZ ฯลฯ) → เลือกชื่อกลุ่มโดยตรง
    if(!items.length){
      if(q&&!gLow.includes(q))return;
      const safe=g.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html+='<div onclick="selectPlace(\''+safe+'\');" style="padding:9px 16px;font-size:13px;color:#e2e8f4;cursor:pointer;border-bottom:1px solid #1e2d44" onmouseenter="this.style.background=\'rgba(6,199,85,.1)\'" onmouseleave="this.style.background=\'\'" >'+esc(g)+'</div>';
      return;
    }
    const matched=q?items.filter(it=>it.toLowerCase().includes(q)||gLow.includes(q)):items;
    if(!matched.length)return;
    html+='<div style="padding:5px 12px 2px;font-size:10px;color:#475569;font-weight:700;letter-spacing:1px;background:#111827;position:sticky;top:0;z-index:1">'+esc(g)+'</div>';
    matched.forEach(it=>{
      const full=g+" : "+it;
      const safe=full.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html+='<div onclick="selectPlace(\''+safe+'\');" style="padding:9px 16px;font-size:13px;color:#e2e8f4;cursor:pointer;border-bottom:1px solid #1e2d44" onmouseenter="this.style.background=\'rgba(6,199,85,.1)\'" onmouseleave="this.style.background=\'\'" >'+esc(full)+'</div>';
    });
  });
  if(!html){
    const val=document.getElementById("f-place")?.value||"";
    html='<div style="padding:10px 14px;font-size:12px;color:#64748b">ไม่พบในรายการ</div>';
    if(val.trim())html+='<div onclick="selectPlace(\''+val.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\' )" style="padding:9px 16px;font-size:13px;color:#06C755;cursor:pointer;border-top:1px solid #1e2d44;font-weight:600" onmouseenter="this.style.background=\'rgba(6,199,85,.08)\'" onmouseleave="this.style.background=\'\'">✚ ใช้ "'+esc(val)+'" (กรอกเอง)</div>';
  }
  html+='<div onclick="setState({page:\'places\'})" style="padding:9px 16px;font-size:12px;color:#3b82f6;cursor:pointer;border-top:1px solid #2a3a54" onmouseenter="this.style.background=\'rgba(59,130,246,.08)\'" onmouseleave="this.style.background=\'\'">⚙️ จัดการรายการสถานที่</div>';
  return html;
}
function showPlaceList(){
  const el=document.getElementById("place-list"),inp=document.getElementById("f-place");
  if(!el||!inp)return;
  el.innerHTML=buildPlaceHTML(inp.value);el.style.display="block";
  inp.style.borderRadius="10px 10px 0 0";
}
function hidePlaceList(){
  const el=document.getElementById("place-list"),inp=document.getElementById("f-place");
  if(el)el.style.display="none";if(inp)inp.style.borderRadius="10px";
}
function filterPlaces(val){const el=document.getElementById("place-list");if(!el||el.style.display==="none")return;el.innerHTML=buildPlaceHTML(val)}
function selectPlace(val){const inp=document.getElementById("f-place");if(inp)inp.value=val;hidePlaceList()}

// ── Place Page (full page) ──
function renderPlacePage(){
  const places=getPlaces();
  const groups=places.map(p=>p.g);
  return '<div style="padding:20px 28px 40px;max-width:800px">'
    // header
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">'
    +'<button onclick="setState({page:\'list\'})" style="background:none;border:none;color:#06C755;font-size:22px;cursor:pointer;line-height:1">‹</button>'
    +'<div><div style="font-size:16px;font-weight:800;color:#fff">📍 จัดการสถานที่</div>'
    +'<div style="font-size:11px;color:#64748b;margin-top:2px">เพิ่ม แก้ไข ลบ — บันทึกถาวรใน browser</div></div>'
    +'</div>'
    // search
    +'<div style="margin-bottom:16px">'
    +'<input class="inp" id="pmgr-search" placeholder="🔍 ค้นหาสถานที่หรือชื่อกลุ่ม..." oninput="renderPlaceList(this.value)" style="font-size:14px">'
    +'</div>'
    // add new card
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:14px;padding:18px;margin-bottom:20px">'
    +'<div style="font-size:12px;color:#06C755;font-weight:700;letter-spacing:.5px;margin-bottom:12px">✚ เพิ่มสถานที่ใหม่</div>'
    +'<div style="display:flex;gap:10px">'
    +'<input class="inp" id="pmgr-name" placeholder="ชื่อสถานที่ เช่น Maersk, Yang Ming..." onkeydown="if(event.key===\'Enter\')addPlace()" style="font-size:14px;flex:1">'
    +'<button onclick="addPlace()" style="background:#06C755;border:none;border-radius:10px;color:#fff;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap">✚ เพิ่ม</button>'
    +'</div></div>'
    // list
    +'<div id="pmgr-list"></div>'
    +'</div>'
    +'<script>renderPlaceList("");<\/script>';
}

function renderPlaceList(q){
  const places=getPlaces();
  const sq=(q||"").toLowerCase().trim();
  const el=document.getElementById("pmgr-list");if(!el)return;
  let html="";
  places.forEach((pg,gi)=>{
    const matched=sq?pg.items.filter(it=>it.toLowerCase().includes(sq)||pg.g.toLowerCase().includes(sq)):pg.items;
    if(!matched.length&&sq)return;
    html+='<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:12px;margin-bottom:10px;overflow:hidden">'
      +'<div style="display:flex;align-items:center;padding:10px 14px;background:#111827;gap:8px">'
      +'<span style="flex:1;font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px">'+esc(pg.g)+'</span>'
      +'<button onclick="renameGroup('+gi+')" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">✏️ แก้ชื่อกลุ่ม</button>'
      +'<button onclick="deleteGroup('+gi+')" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">🗑 ลบกลุ่ม</button>'
      +'</div>';
    (sq?matched:pg.items).forEach(it=>{
      const ri=pg.items.indexOf(it);
      html+='<div id="pr-'+gi+'-'+ri+'" style="display:flex;align-items:center;padding:8px 14px;border-top:1px solid #1e2d44;gap:8px">'
        +'<span style="flex:1;font-size:13px;color:#e2e8f4">'+esc(pg.g)+' : '+esc(it)+'</span>'
        +'<button onclick="editItem('+gi+','+ri+')" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">แก้ไข</button>'
        +'<button onclick="deleteItem('+gi+','+ri+')" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">ลบ</button>'
        +'</div>';
    });
    html+='</div>';
  });
  if(!html)html='<div class="empty"><div style="font-size:28px;opacity:.4;margin-bottom:8px">📍</div><div>ไม่พบรายการ</div></div>';
  el.innerHTML=html;
}

function addPlace(){
  const name=(document.getElementById("pmgr-name")?.value||"").trim();
  if(!name){showToast("⚠️ กรอกชื่อสถานที่","warn");return}
  const places=getPlaces();
  // check duplicate across all groups
  for(const pg of places){
    if(pg.items.includes(name)){showToast("⚠️ มีรายการนี้แล้ว ใน "+pg.g,"warn");return}
  }
  // add to "อื่นๆ" group, create if not exists
  const gi=places.findIndex(p=>p.g==="อื่นๆ");
  if(gi>=0){places[gi].items.push(name);}
  else{places.push({g:"อื่นๆ",items:[name]});}
  savePlaces(places);
  if(document.getElementById("pmgr-name"))document.getElementById("pmgr-name").value="";
  renderPlaceList(document.getElementById("pmgr-search")?.value||"");
  showToast("✅ เพิ่ม "+name+" แล้ว","ok");
}

function editItem(gi,ri){
  const places=getPlaces();if(!places[gi])return;
  const row=document.getElementById("pr-"+gi+"-"+ri);if(!row)return;
  const oldName=places[gi].items[ri];
  const groups=places.map(p=>p.g);
  row.innerHTML='<select id="ei-g" style="background:#0f172a;border:1px solid #3b82f6;border-radius:6px;color:#e2e8f4;font-size:12px;padding:5px 8px">'
    +groups.map(g=>'<option value="'+esc(g)+'"'+(g===places[gi].g?' selected':'')+'>'+esc(g)+'</option>').join("")+'</select>'
    +'<input id="ei-n" value="'+esc(oldName)+'" style="flex:1;background:#0f172a;border:1px solid #3b82f6;border-radius:6px;color:#e2e8f4;font-size:13px;padding:5px 10px;outline:none;min-width:0" onkeydown="if(event.key===\'Enter\')saveItem('+gi+','+ri+')">'
    +'<button onclick="saveItem('+gi+','+ri+')" style="background:#3b82f6;border:none;color:#fff;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">บันทึก</button>'
    +'<button onclick="renderPlaceList(document.getElementById(\'pmgr-search\')?.value||\'\')" style="background:#222228;border:1px solid #2a3a54;color:#94a3b8;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer">ยกเลิก</button>';
  setTimeout(()=>document.getElementById("ei-n")?.focus(),50);
}

function saveItem(gi,ri){
  const places=getPlaces();
  const newG=document.getElementById("ei-g")?.value;
  const newN=(document.getElementById("ei-n")?.value||"").trim();
  if(!newN){showToast("⚠️ กรอกชื่อ","warn");return}
  places[gi].items.splice(ri,1);
  if(!places[gi].items.length)places.splice(gi,1);
  const tgi=places.findIndex(p=>p.g===newG);
  if(tgi>=0){if(!places[tgi].items.includes(newN))places[tgi].items.push(newN);}
  else places.push({g:newG,items:[newN]});
  savePlaces(places);
  renderPlaceList(document.getElementById("pmgr-search")?.value||"");
  showToast("✅ แก้ไขแล้ว","ok");
}

function deleteItem(gi,ri){
  const places=getPlaces();if(!places[gi])return;
  const name=places[gi].items[ri];
  if(!confirm("ลบ '"+name+"'?"))return;
  places[gi].items.splice(ri,1);
  if(!places[gi].items.length)places.splice(gi,1);
  savePlaces(places);
  renderPlaceList(document.getElementById("pmgr-search")?.value||"");
  showToast("🗑 ลบแล้ว");
}

function renameGroup(gi){
  const places=getPlaces();if(!places[gi])return;
  const newName=prompt("แก้ไขชื่อกลุ่ม:",places[gi].g);
  if(!newName||!newName.trim())return;
  if(places.find((p,i)=>p.g===newName.trim()&&i!==gi)){showToast("⚠️ ชื่อกลุ่มซ้ำ","warn");return}
  places[gi].g=newName.trim();savePlaces(places);
  renderPlaceList(document.getElementById("pmgr-search")?.value||"");
  showToast("✅ แก้ชื่อกลุ่มแล้ว","ok");
}

function deleteGroup(gi){
  const places=getPlaces();if(!places[gi])return;
  if(!confirm("ลบกลุ่ม '"+places[gi].g+"' ทั้งหมด "+places[gi].items.length+" รายการ?"))return;
  places.splice(gi,1);savePlaces(places);
  renderPlaceList(document.getElementById("pmgr-search")?.value||"");
  showToast("🗑 ลบกลุ่มแล้ว");
}

// ── Customer List ──
const CUSTOMERS_DEFAULT=["4Care INNO Co., Ltd.","AAR COMPONENT SERVICES (THAILAND) LTD.","ABB ELECTRIFICATION (THAILAND) CO.,LTD.","ADELSON SUPPLY CHAIN (THAILAND) CO., LTD.","AIR INTERNATIONAL THERMAL SYSTEMS (THAILAND)LTD.","AKC ALL","AMERICAN EMBASS","ANCA MANUFACTURING(THAILAND) LTD","ASIA CEMENT PUBLIC CO.,LTD.","AUTO ALLIANCE (THAILAND) CO.,LTD.","BAN LEONG CHIN INTER CO.,LTD.","BELIEVING BEYOND CO., LTD","BENCHMARK ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED","BETA PACKAGE PRODUCTS (THAILAND) CO.,LTD.","BLUECHIPS MICROHOUSE CO.,LTD.","BORGWARNER PDS (THAILAND) LTD.","BRIDGESTONE AIRCRAFT TIRE MANUFACTURING (THAILAND) CO., LTD.","BROSE (THAILAND) CO.,LTD","BYD AUTO COMPONENTS (THAILAND) CO.,LTD","CAL-COMP ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED","CARGILL SIAM LIMITED","CATERPILLAR (THAILAND) LIMITED","CELESTICA (THAILAND) LIMITED.","CELLTRION HEALTHCARE (THAILAND) LTD.","CEVA AIR AND OCEAN (THAILAND) CO.,LTD.","CHAMPACA LUMBER CO.,LTD.","CHOGORI TECHNOLOGY (THAILAND) CO.,LTD","COLGATE PALMOLIVE (THAILAND) LTD.","CONTINENTAL TYRES(THAILAND) CO.,LTD.","CYBER PRINT","CYBERPAX CO.,LTD","DAIDO ELECTRONICS (THAILAND) CO.,LTD.","DAIKIN INDUSTRIES (THAILAND) LTD.","DATAMARS (THAILAND) LTD.","DECATHLON (THAILAND) CO.,LTD.","DELTA ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED.","DHL SUPPLY (THAILAND) LTD.","DONALDSON (THAILAND) LTD.","DZ CARD (THAILAND) LTD.","ECCO (THAILAND) CO.,LTD.","ELECTROLUX PROFESSIONAL(THAILAND)CO.,LTD","ELECTROLUX THAILAND CO.,LTD","ELECTROLUX THAILAND CO.,LTD.","ESSILORLUXOTTICA (THAILAND) LTD.","ETK EMS ASIA PRODUCTIONS LTD.","FAURECIA EMISSIONS CONTROL TECHNOLOGIES (THAILAND)","FONTERRA BRANDS (THAILAND) LTD.","FORD MOTOR COMPANY (THAILAND) LIMITED","FORD SALES & SERVICE (THAILAND) CO.,LTD","FORMULA INTERTRADE CO.,LTD.","FU-TECH TECHNOLOGY CORPORATION LIMITED","GOODYEAR (THAILAND) PUBLIC COMPANY LIMITED","GROHE SIAM LIMITED","HALEON CONSUMER HEALTH (THAILAND) LIMITED","HAN YANG M-TECH (THAILAND) CO.,LTD.","HARLEY-DAVIDSON (THAILAND) COMPANY LIMITED","HIGASKET PLASTICS GROUP (THAILAND) CO.,LTD.","HOYA LAMPHUN LTD.","HP INC (THAILAND) LTD.","IKANO (THAILAND) LIMITED","IKM TESTING (THAILAND) CO.,LTD.","INTERVET (THAILAND) LTD","IT CITY Public Company Limited","JD SPORTS FASHION (THAILAND) LTD.","JIEI (THAILAND) CO.,LTD.","KCE TECHNOLOGY COMPANY LIMITED","KOHLER (THAILAND) PUBLIC COMPANY LIMITED","KUEHNE PLUS NAGEL LTD.","LIGHTECH  ELECTRONIC (THAILAND) CO.,LTD","MANN AND HUMMEL (THAILAND) LTD.","MEDTRONIC (THAILAND)LIMITED","MERCK LTD.","METALSA (THAILAND) CO., LTD.","MI MANUFACTURING (THAILAND) LIMITED","MICHELIN SIAM CO.,LTD","MITSUBISHI ELECTRIC CONSUMER PRODUCTS (THAILAND) CO.,LTD.","MLOPTIC (THAILAND) CO.,LTD","MRP ENGINEERING CO.,LTD","MSX INTERNATIONAL LTD.","M-TEK INDUSTRIAL (THAILAND) CO.,LTD","N.J.LOGISTICS & FRUITS CO.,LTD.","NEOCOSMED CO.,LTD.","NEOPERL ASIA PACIFIC CO.,LTD.","NICE APPAREL COMPANY LIMITED","NP INDUSTRIAL SUPPLY CO.,LTD.","OKUMURA METALS (THAILAND) CO.,LTD.","OMS OILFIELD SERVICES (THAILAND) LTD","PACIFIC BIOTECH CO.,LTD (C/O ORASURE TECHNOLOGIESINC.)","PHAIRAT RECYCLE AND SUPPLY LIMITED PARTNERSHIP","PROCTER & GAMBLE MANUFACTURING (THAILAND) LTD.","PROCTER & GAMBLE TRADING (THAILAND) LTD","REAL TRUCK  (THAILAND) LIMITED","REALRARE GROUP CO.,LTD","REHAU LTD.","Revima Asia Pacific Ltd.","RIGHT COMPOSITES (THAILAND) CO.,LTD","ROECHLING AUTOMOTIVE CHONBURI COMPANY  LIMITED","ROYAL CANIN (THAILAND) CO.,LTD","RUNNER INDUSTRY (THAILAND) CO.,LTD.","RYU LOGISTIC CO.,LTD.","S.C. JOHNSON & SON LTD.","SAMHWA INDUSTRIAL(THAILAND)CO.,LTD.","SANDOZ (THAILAND) LIMITED","SANHUA INTELLIGENT DRIVE (THAILAND) CO.,LTD","SANKO (PLASTICS) THAILAND CO.,LTD","SATO-SHOJI (THAILAND) CO.,LTD.","SATYS ELECTRIC (THAILAND) CO., LTD.","SCHAEFFLER MANUFACTURING (THAILAND) CO.,LTD.","SCHENKER (THAI) LTD.","SCHENKER 0016","SHARP APPLIANCES (THAILAND) LIMITED","SHARP THAI CO.,LTD.","SIAM KRAFT INDUSTRY CO.,LTD.","SIG COMBIBLOC LTD.","SIS DISTRIBUTION (THAILAND) PUBLIC COMPANY LIMITED","SM TRUE CO.,LTD.","SMART TECHNOLOGY MANUFACTURING (THAILAND) CO.,LTD","SMOKERS CHOICE THAILAND CO., LTD","SPACE STORAGE (SAAR) (THAILAND) CO.,LTD.","STAEDTLER (THAILAND) LTD.","Star But (Thailand) Co.,Ltd.","STAUFF (THAILAND) CO. LTD.","STEX Electronics (Thailand) Co., Ltd.","STEX ELECTRONICS (THAILAND) CO.,LTD.","SUMITOMO RUBBER (THAILAND) CO.,LTD.","SUPAVUT INDUSTRY CO.,LTD","SYNNEX (THAILAND) PUBLIC CO.,LTD","SYSTEM WORLD CO., LTD.","TETRA PAK (THAILAND) LIMITED","THAI AIRWAYS INTERNATIONAL PUBLIC COMPANY LIMITED","THAI GYPSUM PRODUCTS PCL.","THAI SHIBAURA DENSHI CO.,LTD.","THAI STEEL CABLE PUBLIC COMPANY LIMITED","THAI XM CO., LTD.","THE SHELL CO.OF THAILAND LTD.","THE SHELL COMPANY OF THAILAND LIMITED","THREE-COLOR STONE (THAILAND) CO., LTD.","TOYO FILLING INTERNATIONAL CO.,LTD.","TREK BICYCLE (THAILAND) CO., LTD.","TRIUMPH INTERNATIONAL (THAILAND) LTD.","TRIUMPH MOTORCYCLES (THAILAND) LTD.","TRIUMPH STRUCTURES(THAILAND)LTD.","TS MOLYMER CO.,LTD.","TYRON RUBBER CO.,LTD.","UNIQLO (THAILAND) COMPANY LIMITED","VALMET CO., LTD.","VIKING LIFE-SAVING EQUIPMENT(THAILAND) LTD.","VISIONGLASS AND DOOR INDUSTRIAL CO.,LTD","VOSSEN MANUFACTURE (THAILAND) CO.,LTD.","WELLDONE TIRE 2020 COMPANY LIMITED.","WESTERN DIGITAL STORAGE TECHNOLOGIES","WISETEK SOLUTION (THAILAND)LIMITED","WORLD COURIER ASIA (THAILAND) CO.,LTD","WORLD INDUSTRY (THAILAND) CO., LTD","WORLD INDUSTRY (THAILAND) CO.,LTD","YIDA NEW MATERIA (THAILAND) CO.,LTD."];
const CUSTOMERS_KEY="msg_customers_v1";

function getCustomers(){
  try{
    const s=JSON.parse(localStorage.getItem(CUSTOMERS_KEY)||"null");
    if(s&&Array.isArray(s))return s;
  }catch{}
  localStorage.setItem(CUSTOMERS_KEY,JSON.stringify(CUSTOMERS_DEFAULT));
  return [...CUSTOMERS_DEFAULT];
}
function saveCustomers(d){localStorage.setItem(CUSTOMERS_KEY,JSON.stringify(d));}

function buildCoDropHTML(q){
  const list=getCustomers();
  const sq=(q||"").toLowerCase().trim();
  const matched=sq?list.filter(c=>c.toLowerCase().includes(sq)):list;
  let html="";
  // selected tags
  const selected=(S.fCompany||"").split(",").filter(v=>v.trim());
  matched.slice(0,40).forEach(c=>{
    const isSel=selected.includes(c);
    html+='<div onclick="toggleCoTag(\''+c.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')" style="padding:8px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid #1e2d44;display:flex;align-items:center;gap:8px;'+(isSel?"background:rgba(168,85,247,.08)":"")+'"'
      +' onmouseenter="this.style.background=\'rgba(168,85,247,.1)\'" onmouseleave="this.style.background=\''+(isSel?"rgba(168,85,247,.08)":"")+'\';">'
      +(isSel?'<span style="color:#c084fc;font-size:14px">✓</span>':'<span style="color:#2a3a54;font-size:14px">○</span>')
      +'<span style="color:#e2e8f4;flex:1">'+esc(c)+'</span></div>';
  });
  if(!html&&sq){
    html='<div style="padding:10px 14px;font-size:12px;color:#64748b">ไม่พบ</div>';
  }
  if(sq&&!list.includes(q)){
    const val=(document.getElementById("co-search-inp")?.value||"").trim();
    if(val)html+='<div onclick="addNewCustomer(\''+val.replace(/'/g,"\\'")+'\')" style="padding:9px 14px;font-size:13px;color:#c084fc;cursor:pointer;border-top:1px solid #2a3a54;font-weight:600"'
      +' onmouseenter="this.style.background=\'rgba(168,85,247,.08)\'" onmouseleave="this.style.background=\'\'">✚ เพิ่ม "'+esc(val)+'" ลงรายการ</div>';
  }
  html+='<div onclick="openCustomerMgr()" style="padding:8px 14px;font-size:12px;color:#3b82f6;cursor:pointer;border-top:1px solid #2a3a54"'
    +' onmouseenter="this.style.background=\'rgba(59,130,246,.08)\'" onmouseleave="this.style.background=\'\'">⚙️ จัดการรายชื่อลูกค้า ('+list.length+')</div>';
  return html;
}

function toggleCoTag(val){
  const cur=(S.fCompany||"").split(",").filter(v=>v.trim());
  const idx=cur.indexOf(val);
  if(idx>=0)cur.splice(idx,1);else cur.push(val);
  S.fCompany=cur.join(",");
  renderCoTags();
  // refresh dropdown
  const el=document.getElementById("co-dropdown");
  if(el)el.innerHTML=buildCoDropHTML(document.getElementById("co-search-inp")?.value||"");
}

function addNewCustomer(val){
  if(!val)return;
  const list=getCustomers();
  if(!list.includes(val)){list.push(val);saveCustomers(list);}
  toggleCoTag(val);
  showToast("✅ เพิ่ม "+val+" แล้ว","ok");
}

function showCoDropdown(){
  const el=document.getElementById("co-dropdown");
  if(!el)return;
  el.innerHTML=buildCoDropHTML(document.getElementById("co-search-inp")?.value||"");
  el.style.display="block";
}
function hideCoDropdown(){
  const el=document.getElementById("co-dropdown");
  if(el)el.style.display="none";
}
function filterCo(val){
  const el=document.getElementById("co-dropdown");
  if(!el||el.style.display==="none")return;
  el.innerHTML=buildCoDropHTML(val);
}

function openCustomerMgr(){
  hideCoDropdown();
  const list=getCustomers();
  const html='<div id="cmgr-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:600;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)" onclick="if(event.target===this)closeCustomerMgr()">'
    +'<div style="background:#1a2235;border-radius:18px;width:560px;max-width:96vw;max-height:88vh;display:flex;flex-direction:column;border:1px solid #2a3a54">'
    +'<div style="padding:16px 20px;border-bottom:1px solid #2a3a54;display:flex;align-items:center;gap:10px">'
    +'<div style="flex:1"><div style="font-size:15px;font-weight:800;color:#fff">🏢 จัดการรายชื่อลูกค้า</div>'
    +'<div style="font-size:11px;color:#64748b;margin-top:2px">'+list.length+' บริษัท — เพิ่ม แก้ไข ลบ</div></div>'
    +'<button onclick="closeCustomerMgr()" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">×</button>'
    +'</div>'
    +'<div style="padding:12px 20px;border-bottom:1px solid #1e2d44">'
    +'<input class="inp" id="cmgr-search" placeholder="🔍 ค้นหาชื่อลูกค้า..." oninput="renderCmgrList(this.value)" style="font-size:13px">'
    +'</div>'
    +'<div id="cmgr-list" style="flex:1;overflow-y:auto;padding:4px 0"></div>'
    +'<div style="padding:14px 20px;border-top:1px solid #2a3a54;background:#111827;border-radius:0 0 18px 18px">'
    +'<div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:8px">✚ เพิ่มลูกค้าใหม่</div>'
    +'<div style="display:flex;gap:8px">'
    +'<input class="inp" id="cmgr-new" placeholder="ชื่อบริษัท / ลูกค้า..." style="flex:1;font-size:13px" onkeydown="if(event.key===\'Enter\')addCustomerItem()">'
    +'<button onclick="addCustomerItem()" style="background:#c084fc;border:none;border-radius:8px;color:#fff;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">✚ เพิ่ม</button>'
    +'</div></div>'
    +'</div></div>';
  document.body.insertAdjacentHTML("beforeend",html);
  renderCmgrList("");
}
function closeCustomerMgr(){document.getElementById("cmgr-overlay")?.remove();}

function renderCmgrList(q){
  const list=getCustomers();
  const sq=(q||"").toLowerCase().trim();
  const el=document.getElementById("cmgr-list");if(!el)return;
  const items=sq?list.map((c,i)=>({c,i})).filter(x=>x.c.toLowerCase().includes(sq)):list.map((c,i)=>({c,i}));
  if(!items.length){el.innerHTML='<div style="text-align:center;padding:20px;color:#475569;font-size:13px">ไม่พบรายการ</div>';return;}
  el.innerHTML=items.map(({c,i})=>
    '<div id="ci-'+i+'" style="display:flex;align-items:center;padding:7px 20px;border-bottom:1px solid #1e2d44;gap:8px">'
    +'<span style="flex:1;font-size:13px;color:#e2e8f4">'+esc(c)+'</span>'
    +'<button onclick="editCustomerItem('+i+')" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;margin-right:4px">แก้ไข</button>'
    +'<button onclick="deleteCustomerItem('+i+')" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">ลบ</button>'
    +'</div>'
  ).join("");
}

function addCustomerItem(){
  const name=(document.getElementById("cmgr-new")?.value||"").trim();
  if(!name){showToast("⚠️ กรอกชื่อลูกค้า","warn");return}
  const list=getCustomers();
  if(list.includes(name)){showToast("⚠️ มีรายการนี้แล้ว","warn");return}
  list.push(name);saveCustomers(list);
  if(document.getElementById("cmgr-new"))document.getElementById("cmgr-new").value="";
  renderCmgrList(document.getElementById("cmgr-search")?.value||"");
  showToast("✅ เพิ่ม "+name+" แล้ว","ok");
}
function editCustomerItem(idx){
  const list=getCustomers();
  const row=document.getElementById("ci-"+idx);if(!row)return;
  row.innerHTML='<input id="ci-inp-'+idx+'" value="'+esc(list[idx])+'" style="flex:1;background:#0f172a;border:1px solid #3b82f6;border-radius:6px;color:#e2e8f4;font-size:13px;padding:5px 10px;outline:none;min-width:0" onkeydown="if(event.key===\'Enter\')saveCustomerItem('+idx+')">'
    +'<button onclick="saveCustomerItem('+idx+')" style="background:#3b82f6;border:none;color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-left:6px;white-space:nowrap">บันทึก</button>'
    +'<button onclick="renderCmgrList(document.getElementById(\'cmgr-search\')?.value||\'\')" style="background:#222;border:1px solid #2a3a54;color:#94a3b8;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;margin-left:4px">ยกเลิก</button>';
  setTimeout(()=>document.getElementById("ci-inp-"+idx)?.focus(),50);
}
function saveCustomerItem(idx){
  const val=(document.getElementById("ci-inp-"+idx)?.value||"").trim();
  if(!val){showToast("⚠️ กรอกชื่อ","warn");return}
  const list=getCustomers();list[idx]=val;saveCustomers(list);
  renderCmgrList(document.getElementById("cmgr-search")?.value||"");
  showToast("✅ แก้ไขแล้ว","ok");
}
function deleteCustomerItem(idx){
  const list=getCustomers();
  if(!confirm("ลบ '"+list[idx]+"'?"))return;
  list.splice(idx,1);saveCustomers(list);
  renderCmgrList(document.getElementById("cmgr-search")?.value||"");
  showToast("🗑 ลบแล้ว");
}

// ── Detail List ──
const DETAILS_DEFAULT=["ส่งชุดงานตรวจปล่อย","ส่งดีโอ","รับดีโอ","วางบิล","การ์ดใส่กล่อง","ส่งเอกสาร","รับเอกสาร","ใส่กล่องกลางทุ่ง(แดง)","ใส่กล่องกลางทุ่ง(เหลือง)","ใส่กล่องด่าน","ใส่กล่องประตู3","ส่งเอกสารบนด่าน","ชำระค่าภาษี","ชำระค่าธรรมเนียม","ขอล่วงเวลา(โอที)","รับเช็ค"];
const DETAILS_KEY="msg_details_v2";

function getDetails(){
  try{
    const s=JSON.parse(localStorage.getItem(DETAILS_KEY)||"null");
    if(s&&Array.isArray(s))return s;
  }catch{}
  localStorage.setItem(DETAILS_KEY,JSON.stringify(DETAILS_DEFAULT));
  return [...DETAILS_DEFAULT];
}
function saveDetails(d){localStorage.setItem(DETAILS_KEY,JSON.stringify(d));}

function buildDetailHTML(q){
  const list=getDetails();
  const sq=(q||"").toLowerCase().trim();
  const matched=sq?list.filter(d=>d.toLowerCase().includes(sq)):list;
  let html="";
  matched.forEach(d=>{
    html+='<div onclick="selectDetail(\''+d.replace(/'/g,"&#39;")+'\')" style="padding:9px 16px;font-size:13px;color:#e2e8f4;cursor:pointer;border-bottom:1px solid #1e2d44"'
      +' onmouseenter="this.style.background=\'rgba(59,130,246,.1)\'" onmouseleave="this.style.background=\'\'">'+esc(d)+'</div>';
  });
  if(!html){
    const val=document.getElementById("f-detail-search")?.value||"";
    html='<div style="padding:10px 14px;font-size:12px;color:#64748b">ไม่พบในรายการ</div>';
    if(val.trim())html+='<div onclick="selectDetail(\''+val.replace(/'/g,"&#39;")+'\')" style="padding:9px 16px;font-size:13px;color:#3b82f6;cursor:pointer;border-top:1px solid #1e2d44;font-weight:600"'
      +' onmouseenter="this.style.background=\'rgba(59,130,246,.08)\'" onmouseleave="this.style.background=\'\'">✚ ใช้ "'+esc(val)+'"</div>';
  }
  html+='<div onclick="openDetailMgr()" style="padding:9px 16px;font-size:12px;color:#3b82f6;cursor:pointer;border-top:1px solid #2a3a54"'
    +' onmouseenter="this.style.background=\'rgba(59,130,246,.08)\'" onmouseleave="this.style.background=\'\'">⚙️ จัดการรายการรายละเอียด</div>';
  return html;
}

function showDetailList(){
  const el=document.getElementById("detail-list"),inp=document.getElementById("f-detail-search");
  if(!el||!inp)return;
  el.innerHTML=buildDetailHTML(inp.value);
  el.style.display="block";
  inp.style.borderRadius="10px 10px 0 0";
}
function hideDetailList(){
  const el=document.getElementById("detail-list"),inp=document.getElementById("f-detail-search");
  if(el)el.style.display="none";
  if(inp)inp.style.borderRadius="10px";
}
function filterDetails(val){
  const el=document.getElementById("detail-list");
  if(!el||el.style.display==="none")return;
  el.innerHTML=buildDetailHTML(val);
}
function selectDetail(val){
  const inp=document.getElementById("f-detail-search");
  if(inp)inp.value=val;
  hideDetailList();
}

function openDetailMgr(){
  hideDetailList();
  const list=getDetails();
  const html='<div id="dmgr-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:600;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)" onclick="if(event.target===this)closeDetailMgr()">'
    +'<div style="background:#1a2235;border-radius:18px;width:480px;max-width:96vw;max-height:85vh;display:flex;flex-direction:column;border:1px solid #2a3a54">'
    +'<div style="padding:16px 20px;border-bottom:1px solid #2a3a54;display:flex;align-items:center;gap:10px">'
    +'<div style="flex:1"><div style="font-size:15px;font-weight:800;color:#fff">📝 จัดการรายละเอียดงาน</div>'
    +'<div style="font-size:11px;color:#64748b;margin-top:2px">เพิ่ม แก้ไข ลบ บันทึกไว้ถาวร</div></div>'
    +'<button onclick="closeDetailMgr()" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">×</button>'
    +'</div>'
    +'<div style="padding:12px 20px;border-bottom:1px solid #1e2d44">'
    +'<input class="inp" id="dmgr-search" placeholder="🔍 ค้นหา..." oninput="renderDmgrList(this.value)" style="font-size:13px">'
    +'</div>'
    +'<div id="dmgr-list" style="flex:1;overflow-y:auto;padding:6px 0"></div>'
    +'<div style="padding:14px 20px;border-top:1px solid #2a3a54;background:#111827;border-radius:0 0 18px 18px">'
    +'<div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:8px">✚ เพิ่มรายการใหม่</div>'
    +'<div style="display:flex;gap:8px">'
    +'<input class="inp" id="dmgr-new" placeholder="พิมพ์รายละเอียดใหม่..." style="flex:1;font-size:13px" onkeydown="if(event.key===\'Enter\')addDetailItem()">'
    +'<button onclick="addDetailItem()" style="background:#3b82f6;border:none;border-radius:8px;color:#fff;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">เพิ่ม</button>'
    +'</div></div>'
    +'</div></div>';
  document.body.insertAdjacentHTML("beforeend",html);
  renderDmgrList("");
}
function closeDetailMgr(){document.getElementById("dmgr-overlay")?.remove();}

function renderDmgrList(q){
  const list=getDetails();
  const sq=(q||"").toLowerCase().trim();
  const el=document.getElementById("dmgr-list");if(!el)return;
  const matched=sq?list.filter((d,i)=>({d,i})).filter(x=>x.d.toLowerCase().includes(sq)):list.map((d,i)=>({d,i}));
  const items=sq?list.map((d,i)=>({d,i})).filter(x=>x.d.toLowerCase().includes(sq)):list.map((d,i)=>({d,i}));
  if(!items.length){el.innerHTML='<div style="text-align:center;padding:20px;color:#475569;font-size:13px">ไม่พบรายการ</div>';return;}
  el.innerHTML=items.map(({d,i})=>{
    const realIdx=list.indexOf(d);
    return '<div id="di-'+realIdx+'" style="display:flex;align-items:center;padding:8px 20px;border-bottom:1px solid #1e2d44;gap:8px">'
      +'<span class="di-text" style="flex:1;font-size:13px;color:#e2e8f4">'+esc(d)+'</span>'
      +'<button onclick="editDetailItem('+realIdx+')" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;margin-right:4px">แก้ไข</button>'
      +'<button onclick="deleteDetailItem('+realIdx+')" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer">ลบ</button>'
      +'</div>';
  }).join("");
}

function addDetailItem(){
  const name=(document.getElementById("dmgr-new")?.value||"").trim();
  if(!name){showToast("⚠️ กรอกรายละเอียด","warn");return}
  const list=getDetails();
  if(list.includes(name)){showToast("⚠️ มีรายการนี้แล้ว","warn");return}
  list.push(name);
  saveDetails(list);
  if(document.getElementById("dmgr-new"))document.getElementById("dmgr-new").value="";
  renderDmgrList(document.getElementById("dmgr-search")?.value||"");
  showToast("✅ เพิ่มแล้ว","ok");
}

function editDetailItem(idx){
  const list=getDetails();
  const row=document.getElementById("di-"+idx);if(!row)return;
  const old=list[idx];
  row.innerHTML='<input id="di-inp-'+idx+'" value="'+esc(old)+'" style="flex:1;background:#0f172a;border:1px solid #3b82f6;border-radius:6px;color:#e2e8f4;font-size:13px;padding:5px 10px;outline:none;min-width:0"'
    +' onkeydown="if(event.key===\'Enter\')saveDetailItem('+idx+')">'
    +'<button onclick="saveDetailItem('+idx+')" style="background:#3b82f6;border:none;color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-left:6px;white-space:nowrap">บันทึก</button>'
    +'<button onclick="renderDmgrList(document.getElementById(\'dmgr-search\')?.value||\'\')" style="background:#222228;border:1px solid #2a3a54;color:#94a3b8;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;margin-left:4px">ยกเลิก</button>';
  setTimeout(()=>document.getElementById("di-inp-"+idx)?.focus(),50);
}

function saveDetailItem(idx){
  const val=(document.getElementById("di-inp-"+idx)?.value||"").trim();
  if(!val){showToast("⚠️ กรอกรายละเอียด","warn");return}
  const list=getDetails();
  list[idx]=val;
  saveDetails(list);
  renderDmgrList(document.getElementById("dmgr-search")?.value||"");
  showToast("✅ แก้ไขแล้ว","ok");
}

function deleteDetailItem(idx){
  const list=getDetails();
  if(!confirm("ลบ '"+list[idx]+"'?"))return;
  list.splice(idx,1);
  saveDetails(list);
  renderDmgrList(document.getElementById("dmgr-search")?.value||"");
  showToast("🗑 ลบแล้ว");
}

// ── Dashboard ──
function renderDashboard(){
  const done=S.tasks.filter(t=>t.status==="done");
  const going=S.tasks.filter(t=>t.status==="going").length;
  const wait=S.tasks.filter(t=>t.status==="wait").length;
  const delivered=S.tasks.filter(t=>t.status==="delivered").length;
  // แยกตาม close_mode
  const doneByMessenger=done.filter(t=>t.close_mode==="messenger_finish"||!t.close_mode).length;
  const doneByUser=done.filter(t=>t.close_mode==="user_confirm").length;
  const byMsg={};
  done.forEach(t=>{
    const m=t.accepted_by||t.messenger_name||"ไม่ระบุ";
    if(!byMsg[m])byMsg[m]={done:0,recipients:{}};
    byMsg[m].done++;
    const r=t.recipient||"ไม่ระบุผู้รับ";
    byMsg[m].recipients[r]=(byMsg[m].recipients[r]||0)+1;
  });
  const days={};
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());days[k]=0;}
  done.forEach(t=>{if(t.date&&days[t.date]!==undefined)days[t.date]++;});
  const msgRows=Object.entries(byMsg).sort((a,b)=>b[1].done-a[1].done).map(([m,v])=>{
    const topRecip=Object.entries(v.recipients).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([r,c])=>'<span style="display:inline-block;background:rgba(6,199,85,.1);color:#06C755;padding:1px 7px;border-radius:10px;font-size:11px;margin:2px">'+esc(r)+(c>1?' ('+c+')':'')+'</span>').join(" ");
    return '<tr style="border-bottom:1px solid #1e2d44"><td style="padding:10px 12px;font-weight:700;color:#e2e8f4">🏃 '+esc(m)+'</td><td style="padding:10px 12px;text-align:center;font-family:monospace;font-size:18px;font-weight:800;color:#06C755">'+v.done+'</td><td style="padding:10px 12px">'+topRecip+'</td></tr>';
  }).join("");
  return '<div style="padding:20px 32px 40px">'
    // ── 5 counters ──
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#06C755;font-family:monospace">'+done.length+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">เสร็จทั้งหมด</div></div>'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#3b82f6;font-family:monospace">'+going+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">กำลังวิ่ง</div></div>'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#f59e0b;font-family:monospace">'+wait+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">รอรับงาน</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">'
    +'<div style="background:#1a2235;border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#f59e0b;font-family:monospace">'+delivered+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">📦 รอผู้สั่งยืนยัน</div></div>'
    +'<div style="background:#1a2235;border:1px solid rgba(6,199,85,.2);border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#06C755;font-family:monospace">'+doneByMessenger+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">🟢 จบโดยแมส</div></div>'
    +'<div style="background:#1a2235;border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:#818cf8;font-family:monospace">'+doneByUser+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">🟡 จบโดยผู้สั่ง</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:14px;padding:16px"><div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:12px">📊 งานเสร็จแยกตามแมส</div><div style="position:relative;height:220px"><canvas id="chart-msg"></canvas></div></div>'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:14px;padding:16px"><div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:12px">📈 งานเสร็จ 7 วันล่าสุด</div><div style="position:relative;height:220px"><canvas id="chart-daily"></canvas></div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:280px 1fr;gap:16px;margin-bottom:24px">'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:14px;padding:16px"><div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:12px">🍩 สัดส่วนสถานะ</div><div style="position:relative;height:200px"><canvas id="chart-status"></canvas></div></div>'
    +'<div style="background:#1a2235;border:1px solid #2a3a54;border-radius:14px;padding:16px;overflow:auto"><div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:12px">🏆 แมสแยกผู้รับ</div>'
    +(msgRows?'<table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid #2a3a54"><th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700">แมส</th><th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700">งานเสร็จ</th><th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700">ผู้รับที่พบ</th></tr>'+msgRows+'</table>'
      :'<div style="text-align:center;color:#475569;padding:32px 0;font-size:13px">ยังไม่มีงานเสร็จ</div>')
    +'</div></div>'
    +'<script id="chart-data" type="application/json">'+JSON.stringify({byMsg,days,wait,going,done:done.length,delivered})+'<\/script>'
    +'</div>';
}
let _chartJsLoaded=false;
let _chartJsLoading=false;

function renderCharts(){
  // ── Lazy load Chart.js เฉพาะตอนเข้า dashboard ──
  if(typeof Chart==="undefined"){
    if(_chartJsLoading)return; // กำลังโหลดอยู่ รอ callback
    _chartJsLoading=true;
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload=()=>{_chartJsLoaded=true;_chartJsLoading=false;renderCharts();};
    s.onerror=()=>{_chartJsLoading=false;console.warn("Chart.js load failed");};
    document.head.appendChild(s);
    return; // รอ onload แล้วค่อย re-call
  }
  setTimeout(()=>{
    try{
      const raw=document.getElementById("chart-data");if(!raw)return;
      const {byMsg,days,wait,going,done,delivered}=JSON.parse(raw.textContent);
      const msgs=Object.keys(byMsg);
      const msgVals=msgs.map(m=>byMsg[m].done);
      const colors=["#06C755","#3b82f6","#f59e0b","#a855f7","#ec4899","#14b8a6","#f97316"];
      const c1=document.getElementById("chart-msg");
      if(c1)new Chart(c1,{type:"bar",data:{labels:msgs,datasets:[{data:msgVals,backgroundColor:msgs.map((_,i)=>colors[i%colors.length]),borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#94a3b8",font:{family:"Sarabun",size:12}},grid:{display:false}},y:{ticks:{color:"#94a3b8"},grid:{color:"rgba(255,255,255,.05)"},beginAtZero:true}}}});
      const c2=document.getElementById("chart-daily");
      if(c2){
        const dKeys=Object.keys(days);
        const dLabels=dKeys.map(k=>{const d=new Date(k);return pad(d.getDate())+"/"+pad(d.getMonth()+1);});
        new Chart(c2,{type:"line",data:{labels:dLabels,datasets:[{data:Object.values(days),borderColor:"#06C755",backgroundColor:"rgba(6,199,85,.08)",tension:.4,fill:true,pointBackgroundColor:"#06C755",pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#94a3b8",font:{family:"Sarabun",size:11}},grid:{display:false}},y:{ticks:{color:"#94a3b8"},grid:{color:"rgba(255,255,255,.05)"},beginAtZero:true}}}});
      }
      const c3=document.getElementById("chart-status");
      if(c3){
        new Chart(c3,{type:"doughnut",data:{labels:["รอรับงาน","กำลังวิ่ง","ส่งถึงแล้ว","เสร็จแล้ว"],datasets:[{data:[wait,going,delivered,done],backgroundColor:["#f59e0b","#3b82f6","#f97316","#06C755"],borderColor:"#1a2235",borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{color:"#94a3b8",font:{family:"Sarabun",size:11},padding:12}}},cutout:"65%"}});
      }
    }catch(e){console.error("chart error",e)}
  },100);
}

async function refreshDetail(){
  if(!S.selId)return;
  const btn=document.getElementById("detail-refresh-btn");
  if(btn){btn.innerHTML='⏳ กำลังโหลด...';btn.disabled=true;}
  const rows=await sbGet("msg_tasks","id=eq."+S.selId+"&limit=1");
  if(rows&&rows[0]){
    const fresh=rows[0];
    S.tasks=S.tasks.map(t=>t.id===S.selId?{...t,...fresh}:t);
    invalidateDerived();
    invalidateZone("zone-modal"); // บังคับ re-render modal
    render();
    showToast("🔄 อัปเดตแล้ว","ok");
  }else{
    if(btn){btn.innerHTML='🔄 รีเฟรช';btn.disabled=false;}
  }
}

async function manualRefresh(){
  const btn=document.getElementById("refresh-btn");
  if(btn){btn.disabled=true;btn.textContent="⏳";}
  _lastFetch=0; // reset cache บังคับ fetch ใหม่
  await loadTasks(true);
  if(btn){btn.disabled=false;btn.textContent="🔄 รีเฟรช";}
  showToast("🔄 รีเฟรชแล้ว","ok");
}

// ── openDetailInstant: แสดง detail ทันที ไม่รอ rAF ──
function openDetailInstant(id){
  if(S.selId===id)return; // ไม่เปิดซ้ำ
  S.selId=id;S.showRecip=false;S.recipName="";
  const t=getTaskById(id);
  if(!t)return;
  try{
    const html=renderDetail();
    const el=$el("zone-modal");
    if(el&&html){el.innerHTML=html;_zoneCache["zone-modal"]=html;}
  }catch(e){}
  render();
}

// ── Supabase Realtime (แทน polling) ──
let _realtimeChannel=null;
let _autoPollInterval=null;

function startRealtime(){
  if(DEMO||!S.currentUser)return;
  if(_realtimeChannel){
    try{_realtimeChannel.close();}catch{}
    _realtimeChannel=null;
  }
  // ── Adaptive Auto Poll ──
  // • Realtime LIVE → poll ทุก 60 วิ (heartbeat เท่านั้น)
  // • Realtime OFFLINE → poll ทุก 15 วิ (fallback จริงจัง)
  // ป้องกัน 100 users × 6 req/min = 600 req/min ที่ไม่จำเป็น
  if(!_autoPollInterval){
    _autoPollInterval=setInterval(async()=>{
      if(!S.currentUser||DEMO)return;
      const isLive=S.realtimeStatus==="live";
      const minGap=isLive?55000:12000; // live=55s, offline=12s
      if(Date.now()-_lastFetch<minGap)return; // ยังไม่ถึงเวลา
      await loadTasks();
      if(S.realtimeStatus!=="live"){invalidateZone("zone-hdr");render();}
    },20000); // tick ทุก 20 วิ (ประหยัด battery/network บน mobile)
  }

  S.realtimeStatus="connecting";
  invalidateZone("zone-hdr");

  const ws=new WebSocket(
    "wss://sytgqjglcnsabcszbngg.supabase.co/realtime/v1/websocket?apikey="+SUPA_KEY+"&vsn=1.0.0"
  );

  let _reconnectDelay=5000; // เริ่ม 5 วิ
  ws.onopen=()=>{
    _reconnectDelay=5000; // reset delay เมื่อเชื่อมสำเร็จ
    ws.send(JSON.stringify({
      topic:"realtime:public:msg_tasks",
      event:"phx_join",
      // กรองเฉพาะ active jobs ทำให้ network payload น้อยลง
      payload:{config:{broadcast:{self:true},presence:{key:""},postgres_changes:[
        {event:"INSERT",schema:"public",table:"msg_tasks"},
        {event:"UPDATE",schema:"public",table:"msg_tasks",filter:"status=in.(wait,going,delivered)"},
        {event:"DELETE",schema:"public",table:"msg_tasks"}
      ]}},
      ref:"1"
    }));
    S.realtimeStatus="live";
    invalidateZone("zone-hdr");
    render();
    showToast("📡 Realtime เชื่อมต่อแล้ว","ok");
  };

  ws.onmessage=async(e)=>{
    try{
      const msg=JSON.parse(e.data);
      if(msg.event==="postgres_changes"||msg.payload?.data?.type){
        const chg=msg.payload?.data||msg.payload;
        const type=chg.type;
        const record=chg.record||chg.new;
        const old=chg.old_record||chg.old;
        invalidateDerived();
        if(type==="INSERT"&&record){
          if(!S.tasks.find(t=>t.id===record.id)){
            S.tasks=[record,...S.tasks];
            invalidateDerived();invalidateCardCache(record.id);
            if(S.page==="list"){_forceListRebuild=true;render();}
            else{updateZoneCounts();} // ไม่ใช่ list page → แค่ update counts
            showToast("📋 มีงานใหม่ #"+esc(record.job_number||""),"ok");
            // แจ้งแมสทันทีว่ามีงานใหม่
            if(S.currentUser?.role==="messenger"){
              _notifDismissed=false;_lastNotifTime=0;
              setTimeout(checkAndShowNotif,500);
            }
          }
        }else if(type==="UPDATE"&&record){
          const existed=getTaskById(record.id);
          if(existed){
            const oldStatus=existed.status;
            S.tasks=S.tasks.map(t=>t.id===record.id?{...t,...record}:t);
            _taskIndex=null; // reset O(1) index
            VL._fil=null;   // force VL window recalc
          invalidateDerived();
            invalidateCardCache(record.id);
            const patched=patchCard(record.id);
            if(patched){
              updateZoneCounts();
              if(S.selId===record.id){
                invalidateZone("zone-modal");
                patchZone("zone-modal",renderDetail());
                showToast("🔄 อัปเดตสถานะแล้ว","ok");
              }
            }else{
              render(); // fallback: card ไม่ได้อยู่ใน DOM → full render
            }
            // ถ้าสถานะเปลี่ยนเป็น delivered → แสดง alert ให้ owner ทันที (ไม่ว่าจะอยู่หน้าไหน)
            if(record.status==="delivered"&&oldStatus!=="delivered"){
              _notifDismissed=false;_lastNotifTime=0;
              setTimeout(checkAndShowNotif,600);
              // alert แบบ popup ทันทีสำหรับ owner
              const updatedTask=S.tasks.find(t=>t.id===record.id);
              if(updatedTask)setTimeout(()=>_showDeliveredAlert(updatedTask,true),300); // force=true → แสดงซ้ำได้
            }
          }
        }else if(type==="DELETE"&&old){
          S.tasks=S.tasks.filter(t=>t.id!==old.id);
          invalidateDerived();
          if(S.selId===old.id)setState({selId:null});
          else render();
        }
      }
    }catch(err){console.warn("realtime parse error",err)}
  };

  ws.onerror=()=>{
    S.realtimeStatus="offline";
    invalidateZone("zone-hdr");
    render();
    console.warn("Realtime ไม่ได้เปิด — ใช้ auto-poll แทน");
  };

  ws.onclose=()=>{
    S.realtimeStatus="offline";
    invalidateZone("zone-hdr");
    render();
    // Exponential backoff: 5s → 10s → 20s → 40s → max 60s
    // ป้องกัน 100 users reconnect พร้อมกัน (thundering herd)
    setTimeout(()=>{if(S.currentUser)startRealtime();},_reconnectDelay);
    _reconnectDelay=Math.min(_reconnectDelay*2,60000);
  };

  _realtimeChannel=ws;
}

function startPollingFallback(){
  // ไม่ใช้แล้ว — _autoPollInterval แบบ adaptive จัดการครบแล้ว
  // ไม่สร้าง interval ซ้ำซ้อน
}

function stopRealtime(){
  if(_realtimeChannel){try{_realtimeChannel.close();}catch{}_realtimeChannel=null;}
  if(_autoPollInterval){clearInterval(_autoPollInterval);_autoPollInterval=null;}
  if(window._pollingInterval){clearInterval(window._pollingInterval);window._pollingInterval=null;}
}

// ── Start ──
if(S.currentUser){
  setState({page:"list"});
  loadTasks(true).then(()=>{
    startRealtime();
    setTimeout(checkAndShowNotif,800);
  });
}else render();

// ══════════════════════════════════════════════════════════════
// ── Notification System ──────────────────────────────────────
// ปรากฏตอน: เปิดเว็บ / login / refresh / focus tab กลับมา
// USER: แจ้งงาน delivered ที่รอตัวเองยืนยัน
// MESSENGER: แจ้งงาน wait ทั้งหมด + งาน going ของตัวเอง
// ══════════════════════════════════════════════════════════════

let _lastNotifTime=0;
const NOTIF_COOLDOWN=40000; // 40 วิ — ไม่ spam ซ้ำเร็วเกินไป
let _notifDismissed=false;  // ถ้า user กดปิดในรอบนี้ ไม่โผล่อีกจนกว่าจะมี event ใหม่

function checkAndShowNotif(){
  if(!S.currentUser||S.page==="login")return;
  if(_notifDismissed)return; // user กดปิดไปแล้ว รอ event ถัดไป
  const now=Date.now();
  if(now-_lastNotifTime<NOTIF_COOLDOWN)return;

  const u=S.currentUser;
  const isMsg=u.role==="messenger";

  if(isMsg){
    // ── แมส: งานรอรับ + งานที่กำลังวิ่งของตัวเอง ──
    const waitTasks=S.tasks.filter(t=>t.status==="wait");
    const myRunning=S.tasks.filter(t=>
      t.status==="going"&&(t.accepted_by||t.messenger_name)===u.username
    );
    if(!waitTasks.length&&!myRunning.length)return;
    _lastNotifTime=now;
    _showNotifPopup(_buildMessengerNotif(waitTasks,myRunning));
  }else{
    // ── USER/Staff/Admin: งาน delivered รอตัวเองยืนยัน ──
    const toConfirm=S.tasks.filter(t=>
      t.status==="delivered"&&
      (t.created_by===u.username||u.role==="superadmin")
    );
    if(!toConfirm.length)return;
    _lastNotifTime=now;
    _showNotifPopup(_buildOwnerNotif(toConfirm));
  }
}

// ── สร้าง HTML popup สำหรับแมส ──
function _buildMessengerNotif(waitTasks,myRunning){
  const hasWait=waitTasks.length>0;
  const hasRunning=myRunning.length>0;

  let body="";

  // ส่วนงานรอรับ
  if(hasWait){
    body+='<div class="notif-section">'
      +'<div class="notif-section-hdr" style="color:#f59e0b">'
      +'<span class="notif-pulse" style="background:#f59e0b"></span>'
      +'มี <strong>'+waitTasks.length+' งาน</strong> รอรับอยู่</div>'
      +'<div class="notif-task-list">'
      +waitTasks.slice(0,5).map(t=>
        '<div class="notif-task-row" onclick="closeNotifPopup();setState({filter:\'wait\',page:\'list\',selId:\''+t.id+'\'})">'
        +'<span class="notif-job">'+esc(t.job_number||t.id.slice(0,8))+'</span>'
        +'<span class="notif-co">'+esc((t.company||"").slice(0,22))+'</span>'
        +'<span class="notif-time">⏰'+esc(t.pickup_time||"–")+'</span>'
        +'</div>'
      ).join("")
      +(waitTasks.length>5?'<div class="notif-more">+อีก '+(waitTasks.length-5)+' งาน</div>':"")
      +'</div></div>';
  }

  // ส่วนงานกำลังวิ่ง (ที่แมสรับไปแล้ว ต้องจบ)
  if(hasRunning){
    body+='<div class="notif-section">'
      +'<div class="notif-section-hdr" style="color:#3b82f6">'
      +'<span class="notif-pulse" style="background:#3b82f6;animation:none"></span>'
      +'งานของคุณ <strong>'+myRunning.length+' งาน</strong> ยังค้างอยู่</div>'
      +'<div class="notif-task-list">'
      +myRunning.map(t=>
        '<div class="notif-task-row" onclick="closeNotifPopup();openFinishModal(\''+t.id+'\')">'
        +'<span class="notif-job">'+esc(t.job_number||t.id.slice(0,8))+'</span>'
        +'<span class="notif-co">'+esc((t.company||"").slice(0,18))+'</span>'
        +'<span class="notif-time" style="color:#06C755;font-weight:700">กดจบงาน →</span>'
        +'</div>'
      ).join("")
      +'</div></div>';
  }

  const btnWait=hasWait
    ?'<button class="notif-btn notif-btn-primary" onclick="closeNotifPopup();setState({filter:\'wait\',page:\'list\'})">⏳ ดูงานรอรับ ('+waitTasks.length+')</button>'
    :"";
  const btnRunning=hasRunning
    ?'<button class="notif-btn notif-btn-blue" onclick="closeNotifPopup();setState({filter:\'going\',page:\'list\'})">🏃 ดูงานที่รับแล้ว</button>'
    :"";

  return {
    icon:"🏃",
    title:"แจ้งเตือนสำหรับแมส",
    body,
    buttons:btnWait+btnRunning,
    accent:"#f59e0b",
  };
}

// ── สร้าง HTML popup สำหรับ USER owner ──
function _buildOwnerNotif(toConfirm){
  const body='<div class="notif-section">'
    +'<div class="notif-section-hdr" style="color:#f97316">'
    +'<span class="notif-pulse" style="background:#f97316"></span>'
    +'<strong>'+toConfirm.length+' งาน</strong> ถูกส่งถึงแล้ว — รอคุณยืนยันรับ</div>'
    +'<div class="notif-task-list">'
    +toConfirm.slice(0,6).map(t=>
      '<div class="notif-task-row" onclick="closeNotifPopup();confirmTask(\''+t.id+'\')">'
      +'<span class="notif-job">'+esc(t.job_number||t.id.slice(0,8))+'</span>'
      +'<span class="notif-co">'+esc((t.company||"").slice(0,20))+'</span>'
      +'<span class="notif-time" style="color:#f97316;font-weight:800">กดยืนยัน →</span>'
      +'</div>'
    ).join("")
    +(toConfirm.length>6?'<div class="notif-more">+อีก '+(toConfirm.length-6)+' งาน</div>':"")
    +'</div></div>';

  return {
    icon:"📦",
    title:"รอการยืนยันรับ",
    body,
    buttons:'<button class="notif-btn notif-btn-orange" onclick="closeNotifPopup();setState({filter:\'delivered\',page:\'list\'})">📦 ดูงานรอยืนยันทั้งหมด</button>',
    accent:"#f97316",
  };
}

// ── แสดง popup ──
// ════════════════════════════════════════════════════════
// REUSABLE OVERLAYS — pre-allocated once, never destroyed
// ════════════════════════════════════════════════════════
function _initOverlays(){
  if(!document.getElementById("overlay-notif")){
    const n=document.createElement("div");
    n.id="overlay-notif";n.className="notif-overlay";
    n.style.cssText="display:none;opacity:0;transition:opacity .2s";
    document.body.appendChild(n);
    n.addEventListener("click",e=>{if(e.target===n)closeNotifPopup();},{passive:true});
  }
  if(!document.getElementById("overlay-alert")){
    const a=document.createElement("div");
    a.id="overlay-alert";
    a.style.cssText="position:fixed;inset:0;z-index:900;display:none;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom,0)";
    document.body.appendChild(a);
    a.addEventListener("click",e=>{if(e.target===a)a.style.display="none";},{passive:true});
  }
}

function _showNotifPopup({icon,title,body,buttons,accent}){
  _initOverlays();
  const el=document.getElementById("overlay-notif");
  if(!el)return;
  // reuse overlay: update innerHTML, no createElement/appendChild each time
  el.innerHTML=
    '<div class="notif-card" style="--notif-accent:'+accent+'">'
    +'<div class="notif-hdr">'
    +'<div style="display:flex;align-items:center;gap:8px">'
    +'<span style="font-size:20px">'+icon+'</span>'
    +'<div>'
    +'<div class="notif-title">'+esc(title)+'</div>'
    +'<div class="notif-sub">'+new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})+'</div>'
    +'</div></div>'
    +'<button class="notif-close" onclick="closeNotifPopup()">×</button>'
    +'</div>'
    +'<div class="notif-body">'+body+'</div>'
    +'<div class="notif-footer">'
    +buttons
    +'<button class="notif-btn notif-btn-ghost" onclick="closeNotifPopup()">ปิด</button>'
    +'</div></div>';
  el.style.display="flex";
  requestAnimationFrame(()=>{el.style.opacity="1";});
  clearTimeout(window._notifAutoDismiss);
  window._notifAutoDismiss=setTimeout(()=>{
    el.style.opacity="0";setTimeout(()=>{el.style.display="none";},200);
  },20000);
}

function closeNotifPopup(){
  clearTimeout(window._notifAutoDismiss);
  const el=document.getElementById("overlay-notif");
  if(el){el.style.opacity="0";setTimeout(()=>{el.style.display="none";},200);}
  _notifDismissed=true;
}

// ── Triggers ──

// เมื่อ tab กลับมา focus (เปลี่ยน tab แล้วกลับมา)
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    // Tab ซ่อน → หยุด auto-poll ประหยัด CPU/battery/network
    if(_autoPollInterval){clearInterval(_autoPollInterval);_autoPollInterval=null;}
    clearTimeout(window._notifAutoDismiss);
  }else if(S.currentUser){
    // Tab กลับมา → restart realtime + notif (loadTasks จะถูกเรียกจาก focus event)
    _notifDismissed=false;
    startRealtime(); // reconnect ถ้าหลุด
    // delay เล็กน้อยเพื่อให้ focus event ทำงานก่อน
    setTimeout(checkAndShowNotif,800);
  }
});

// เมื่อ window ได้ focus กลับ (switch app แล้วกลับมา)
let _focusThrottle=0;
window.addEventListener("focus",()=>{
  if(!S.currentUser)return;
  const now=Date.now();
  if(now-_focusThrottle<10000)return; // throttle 10 วิ (เพิ่มจาก 5 วิ)
  _focusThrottle=now;
  _notifDismissed=false;
  if(!document.hidden)loadTasks(true); // ตรวจ visible ก่อน
  setTimeout(checkAndShowNotif,800);
},{passive:true,capture:true});

// หลัง realtime UPDATE — เช็คอีกครั้ง (เช่น แมสกด delivered → แจ้ง owner ทันที)
// (hook ต่อจาก realtime handler ที่มีอยู่แล้ว)
const _origOnMessage=window._realtimeOnMessage; // placeholder สำหรับ future
function _onTaskStatusChange(){
  _notifDismissed=false;
  _lastNotifTime=0; // force check ทันที
  setTimeout(checkAndShowNotif,500);
}

// ── Scroll Performance Guard ──
let _isScrolling=false;
let _scrollTimer=null;
let _pendingRenderAfterScroll=false;
function _onScroll(){
  _isScrolling=true;
  _pendingRenderAfterScroll=true;
  clearTimeout(_scrollTimer);
  // Virtual list: rAF-debounced window update (no computeDerived on every tick)
  vlOnScroll();
  _scrollTimer=setTimeout(()=>{
    _isScrolling=false;
    if(_pendingRenderAfterScroll){_pendingRenderAfterScroll=false;render();}
  },150);
}
// Attach to .main-col scroll (not document) to avoid double-firing on mobile
(function _attachScroll(){
  const sc=document.querySelector(".main-col");
  if(sc){ sc.addEventListener("scroll",_onScroll,{passive:true}); }
  else { window.addEventListener("scroll",_onScroll,{passive:true}); }
})();
// Fallback: also listen on document for browsers that bubble scroll
document.addEventListener("scroll",_onScroll,{passive:true,capture:false});
