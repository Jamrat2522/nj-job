if(location.protocol==='file:'){console.warn('⚠️ เปิดผ่าน file:// — localStorage/session อาจแยกตามไฟล์ · ถ้ามีปัญหาให้เปิดผ่าน HTTP/HTTPS');}
const SUPA_URL='https://sytgqjglcnsabcszbngg.supabase.co';const SUPA_KEY='sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp';const DEBUG_MODE=(()=>{try{return localStorage.getItem('billing_debug')==='1';}catch(e){return false;}})();function dlog(){if(DEBUG_MODE)console.log.apply(console,arguments);}
const _actionLock={};function lockAction(key){if(_actionLock[key])return false;_actionLock[key]=true;document.querySelectorAll('[data-action="'+key+'"]').forEach(b=>{b.disabled=true;b.classList.add('is-locked');});return true;}
function unlockAction(key){_actionLock[key]=false;document.querySelectorAll('[data-action="'+key+'"]').forEach(b=>{b.disabled=false;b.classList.remove('is-locked');});}
let supa=null;const _scriptCache={};function loadScriptOnce(){return Promise.resolve();}
let currentPage='ar';const $=id=>document.getElementById(id);const esc=s=>(s==null?'':(''+s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');const fmt=n=>(+n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});const fmt0=n=>(+n||0).toLocaleString('th-TH',{maximumFractionDigits:0});function toast(msg,type){const t=$('toast');t.className='toast '+(type||'')+' show';t.textContent=msg;clearTimeout(toast._t);toast._t=setTimeout(()=>{t.className='toast '+(type||'');},2600);}
function setStatus(id,type,html){const el=document.getElementById(id);if(!el)return;el.className='inline-status show '+(type||'');el.innerHTML=html;}
function clearStatus(id){const el=document.getElementById(id);if(!el)return;el.className='inline-status';el.innerHTML='';}
function nowHMS(){const d=new Date();return d.getHours().toString().padStart(2,'0')+':'+
d.getMinutes().toString().padStart(2,'0')+':'+
d.getSeconds().toString().padStart(2,'0');}
function statusHTML(opts){opts=opts||{};const parts=[];if(opts.title){parts.push('<div class="is-title">'
+'<button class="is-close" onclick="this.parentElement.parentElement.className=\'inline-status\'" title="ปิด">×</button>'
+esc(opts.title)+'</div>');}
const row=[];if(opts.file)row.push('<span class="is-x">📄 ไฟล์: <b>'+esc(opts.file)+'</b></span>');if(opts.lines){opts.lines.forEach(l=>{if(l.value===''||l.value==null)return;row.push('<span class="is-x">'+l.icon+' '+esc(l.label)+': <b>'+esc(String(l.value))+'</b></span>');});}
if(opts.error)row.push('<span class="is-x" style="color:#fca5a5">❌ Error: '+esc(opts.error)+'</span>');if(row.length)parts.push('<div class="is-row">'+row.join(' · ')+'</div>');if(opts.start||opts.end){const t=[];if(opts.start)t.push('เริ่ม '+opts.start);if(opts.end)t.push('จบ '+opts.end);parts.push('<div class="is-time">⏱ '+t.join(' · ')+'</div>');}
return parts.join('');}
function setConn(state,txt){const dot=$('conn-dot');dot.className='dot '+(state||'');$('conn-txt').textContent=txt;}
function setMeta(t){$('tb-meta').textContent=t;}
function initSupabase(){if(supa)return supa;try{if(window.supabase&&typeof window.supabase.createClient==='function'){supa=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,storageKey:'timeline_session',autoRefreshToken:true,autoRefreshToken:false,detectSessionInUrl:false}});return supa;}}catch(e){console.error('init supabase:',e);}
return null;}
function escIlike(s){return String(s||'').replace(/[%_]/g,'\\$&').replace(/,/g,' ');}
async function openBackupModal(){return;}
async function fetchAllRows(tbl,label){const sb=initSupabase();if(!sb)throw new Error('Supabase ไม่พร้อม');let estimatedTotal=0;try{const{count}=await sb.from(tbl).select('id',{count:'exact',head:true});estimatedTotal=count||0;dlog('['+tbl+'] estimated total from count:',estimatedTotal);}catch(e){console.warn('count query failed, will fetch without estimate:',e.message);}
const CHUNK=500;const all=[];let from=0;let pageIdx=0;const MAX_PAGES=1000;while(pageIdx<MAX_PAGES){const to=from+CHUNK-1;const t0=performance.now();const{data,error}=await sb.from(tbl).select('*').order('id',{ascending:true}).range(from,to);if(error){console.error('['+tbl+'] chunk error at from='+from+':',error);throw error;}
const got=(data||[]).length;dlog('['+tbl+'] chunk '+pageIdx+' · range='+from+'-'+to+' · got='+got+' · '+(performance.now()-t0).toFixed(0)+'ms');if(got===0)break;data.forEach(r=>all.push(r));const denom=Math.max(estimatedTotal,all.length);updateProgress(all.length,denom,label+' — '+all.length.toLocaleString('th-TH')+(estimatedTotal>0?' / '+estimatedTotal.toLocaleString('th-TH'):'')+' rows');if(got<CHUNK){dlog('['+tbl+'] reached end of data at chunk '+pageIdx);break;}
from+=CHUNK;pageIdx++;}
dlog('['+tbl+'] TOTAL FETCHED: '+all.length+(estimatedTotal>0&&estimatedTotal!==all.length?' (⚠ count said '+estimatedTotal+')':''));if(estimatedTotal>0&&Math.abs(all.length-estimatedTotal)>0){console.warn('['+tbl+'] count mismatch! count='+estimatedTotal+' actual='+all.length+' — RLS อาจกระทบ หรือ row ถูกเพิ่ม/ลบขณะดึง');}
return all;}
const USER_TBL='app_users';const APP_CODE='timeline';const AUTH_EMAIL_DOMAIN='timelinetest.app';const AUTH_EMAIL_SUFFIX='@'+AUTH_EMAIL_DOMAIN;let _currentUser=null;const TL_OWN_KEY='timeline_current_user';const TL_SESSION_KEYS=['timeline_current_user'];function _tlReadStores(){const s=[];try{if(window.localStorage)s.push(localStorage);}catch(_){}
try{if(window.sessionStorage)s.push(sessionStorage);}catch(_){}
return s;}
function _tlAsUser(o){if(!o||typeof o!=='object'||Array.isArray(o))return null;const uname=o.username||o.user_name||o.userName||o.name||o.full_name||o.fullName||o.displayName||o.email;if(!uname||typeof uname!=='string'||!uname.trim())return null;const u=Object.assign({},o);u.username=String(uname).trim();let r=o.role||o.user_role||o.userRole||o.permission||o.type||'';if(!r&&(o.is_admin===true||o.isAdmin===true||o.is_superadmin===true))r='admin';if(r)u.role=String(r).trim();return u;}
function _tlExtractUser(val){if(val==null)return null;if(typeof val==='string'){try{val=JSON.parse(val);}catch(_){return null;}}
if(typeof val!=='object')return null;let u=_tlAsUser(val);if(u)return u;const wraps=['user','currentUser','current_user','data','session','profile','account','auth','payload','result','currentSession'];for(const k of wraps){let inner=val[k];if(inner==null)continue;if(typeof inner==='string'){try{inner=JSON.parse(inner);}catch(_){inner=null;}}
u=_tlAsUser(inner);if(u)return u;if(inner&&typeof inner==='object'&&inner.user){u=_tlAsUser(inner.user);if(u)return u;}}
return null;}
function _tlFindSession(){const stores=_tlReadStores();for(const st of stores){for(const k of TL_SESSION_KEYS){let raw=null;try{raw=st.getItem(k);}catch(_){}
if(!raw)continue;const u=_tlExtractUser(raw);if(u)return u;}}
for(const st of stores){let n=0;try{n=st.length;}catch(_){n=0;}
for(let i=0;i<n;i++){let key=null;try{key=st.key(i);}catch(_){}
if(!key||key==='billing_debug')continue;let raw=null;try{raw=st.getItem(key);}catch(_){}
if(!raw||raw.length>20000)continue;const c=raw.charAt(0);if(c!=='{'&&c!=='[')continue;const u=_tlExtractUser(raw);if(u)return u;}}
return null;}
const NJ_KEY='timeline_current_user';function getCurrentUser(){if(_currentUser)return _currentUser;try{const raw=localStorage.getItem(NJ_KEY);if(!raw)return null;const o=JSON.parse(raw);if(o&&typeof o==='object'&&!Array.isArray(o)&&o.username&&String(o.username).trim()){_currentUser=o;return _currentUser;}}catch(_){}
return null;}
function setCurrentUser(u){_currentUser=u;try{document.body.classList.remove('auth-locked');}catch(_){}
try{localStorage.setItem(NJ_KEY,JSON.stringify(u));}catch(e){}}
function clearCurrentUser(){_currentUser=null;try{document.body.classList.add('auth-locked');}catch(_){}
try{localStorage.removeItem(NJ_KEY);}catch(e){}}
function isLoggedIn(){return!!getCurrentUser();}
async function verifySession(){const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){_currentUser=null;return false;}
try{const{data:sess}=await sb.auth.getSession();if(!sess||!sess.session||!sess.session.user){_currentUser=null;try{localStorage.removeItem(NJ_KEY);}catch(_){}
return false;}
const authUid=sess.session.user.id;const authEmail=String(sess.session.user.email||'').toLowerCase();if(!authEmail.endsWith(AUTH_EMAIL_SUFFIX)){await sb.auth.signOut();clearCurrentUser();return false;}
const{data,error}=await sb.from(USER_TBL).select('*').eq('auth_user_id',authUid).eq('app_code',APP_CODE).limit(1);if(error){console.warn('verifySession error:',error.message);return false;}
if(!data||!data.length){await sb.auth.signOut();clearCurrentUser();return false;}
const row=data[0];const st=String(row.status||'active').toLowerCase();if(st==='pending'||st==='inactive'||st==='disabled'||st==='banned'){await sb.auth.signOut();clearCurrentUser();return false;}
_currentUser=row;try{localStorage.setItem(NJ_KEY,JSON.stringify(row));}catch(_){}
return true;}catch(e){console.warn('verifySession:',e&&e.message);return false;}}
function _tlLooksJamrat(u){if(!u)return false;const fields=[u.username,u.user_name,u.userName,u.name,u.full_name,u.fullName,u.displayName];for(let i=0;i<fields.length;i++){const v=String(fields[i]||'').trim().toLowerCase();if(v==='jamrat'||v==='jamrat (super admin)')return true;}
return false;}
function _tlRoleIsAdmin(roleRaw){let r=String(roleRaw||'').toLowerCase().trim();if(!r)return false;if(r==='admin'||r==='administrator'||r==='owner'||r==='root'||r==='sa')return true;if(/super|supper/.test(r))return true;if(/\badmin\b/.test(r)||r.indexOf('admin')>=0)return true;return false;}
function getRole(){const u=getCurrentUser();if(!u)return'guest';if(_tlLooksJamrat(u))return'admin';if(_tlRoleIsAdmin(u.role))return'admin';let r=String(u.role||'user').toLowerCase().trim();if(r==='guest')return'user';return r;}
function isSuperAdmin(){const u=getCurrentUser();if(!u)return false;return getRole()==='admin';}
function isAdminUser(){return isSuperAdmin();}
function _njRoleKind(u){if(typeof _tlLooksJamrat==='function'&&_tlLooksJamrat(u))return'super';let r=String((u&&u.role)||'').toLowerCase().trim();if(!r)return'user';if(/super|supper/.test(r)||r==='owner'||r==='root'||r==='sa')return'super';if(r==='admin'||r==='administrator'||r.indexOf('admin')>=0)return'admin';return'user';}
function canDelete(){return isSuperAdmin();}
function guardDelete(){if(!canDelete()){toast('🚫 สิทธิ์ USER ไม่สามารถลบข้อมูลได้','err');return false;}
return true;}
function tlMyUsername(){const u=(typeof getCurrentUser==='function')?getCurrentUser():null;return u?String(u.username||'').trim():'';}
function tlIsUserScope(){const u=(typeof getCurrentUser==='function')?getCurrentUser():null;if(!u)return false;if(typeof isSuperAdmin==='function'&&isSuperAdmin())return false;return true;}
function tmApplyScope(q){try{if(tlIsUserScope()){const me=tlMyUsername();q=q.eq('created_by',me||'\u0000__no_user__');}}catch(_){}
return q;}
function applyRoleUI(){const role=getRole();const u=getCurrentUser();const navUsers=document.getElementById('nav-users');if(navUsers)navUsers.style.display=isSuperAdmin()?'':'none';try{const av=document.getElementById('sb-avatar');const un=document.getElementById('sb-uname');const rl=document.getElementById('sb-role');if(u){const nm=String(u.username||'ผู้ใช้');if(un)un.textContent=nm;if(rl)rl.textContent=(role==='admin'?'SUPER ADMIN':'USER');if(av)av.textContent=(nm.trim().charAt(0)||'?').toUpperCase();}else{if(un)un.textContent='ยังไม่เข้าสู่ระบบ';if(rl)rl.textContent='—';if(av)av.textContent='?';}}catch(_){}
const w=document.getElementById('whoami');if(w){if(u){const roleLbl=role==='admin'?'SUPER ADMIN':'USER';w.innerHTML='👤 <b>'+esc(u.username||'')+'</b> · <span class="role-pill '+role+'">'+roleLbl+'</span> '
+'<a href="#" onclick="event.preventDefault();logout()" class="whoami-link">ออก</a>';}else{w.innerHTML='<a href="#" onclick="event.preventDefault();showLoginModal()" class="whoami-link">🔓 เข้าสู่ระบบ</a>';}}
if(typeof renderTM==='function'&&typeof TMState!=='undefined'&&TMState.loaded){try{renderTM();}catch(_){}}}
function _authClear(){['login-username','login-password','reg-username','reg-password','reg-password2','reg-fullname','reg-department'].forEach(id=>{const e=$(id);if(e)e.value='';});['login-password','reg-password','reg-password2'].forEach(id=>{const e=$(id);if(e)e.type='password';});try{if(typeof clearStatus==='function')clearStatus('reg-status');}catch(_){}}
function authTab(which){const isReg=(which==='reg');const tL=$('auth-tab-login'),tR=$('auth-tab-reg');const pL=$('auth-panel-login'),pR=$('auth-panel-reg');if(tL)tL.classList.toggle('active',!isReg);if(tR)tR.classList.toggle('active',isReg);if(pL)pL.style.display=isReg?'none':'flex';if(pR)pR.style.display=isReg?'flex':'none';try{if(typeof clearStatus==='function')clearStatus('reg-status');}catch(_){}
setTimeout(()=>{const e=$(isReg?'reg-username':'login-username');if(e)e.focus();},60);}
function authEye(id,btn){const el=$(id);if(!el)return;const show=el.type==='password';el.type=show?'text':'password';if(btn)btn.textContent=show?'🙈':'👁';}
function showLoginModal(){try{document.body.classList.add('auth-locked');}catch(_){}
_authClear();$('loginModal').style.display='flex';authTab('login');}
function closeLoginModal(){const m=$('loginModal');if(m)m.style.display='none';}
function showRegisterModal(){_authClear();$('loginModal').style.display='flex';authTab('reg');}
function closeRegisterModal(){const m=$('loginModal');if(m)m.style.display='none';}
function doRegisterUI(){const p=($('reg-password')?$('reg-password').value:'')||'';const p2=($('reg-password2')?$('reg-password2').value:'')||'';const setErr=(msg)=>{if(typeof setStatus==='function')setStatus('reg-status','err','<div class="is-title">'+msg+'</div>');else if(typeof toast==='function')toast(msg.replace(/<[^>]+>/g,''),'err');};if(p.length<6){setErr('⚠ รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');var a=$('reg-password');if(a)a.focus();return;}
if(p!==p2){setErr('⚠ ยืนยันรหัสผ่านไม่ตรงกัน');var b=$('reg-password2');if(b)b.focus();return;}
const dep=($('reg-department')?$('reg-department').value:'').trim();if(!dep){setErr('⚠ กรุณาเลือกแผนก');var d=$('reg-department');if(d)d.focus();return;}
const fn=$('reg-fullname');if(fn)fn.value='';doRegister();}
async function doRegister(){toast('🚫 การสมัครสมาชิกเองถูกปิด — กรุณาติดต่อ Super Admin','warn');return;}
function _tlIsAdminRole(r){r=String(r||'').toLowerCase().trim();return r==='admin'||r==='super_admin'||r==='superadmin'||r==='super-admin'||r==='super admin'||r==='superuser';}
async function tlResolveSession(){try{let u=getCurrentUser();if(!u)return null;const isJamrat=String(u.username||'').trim().toLowerCase()==='jamrat';if(isJamrat&&!_tlIsAdminRole(u.role)){try{const sb=(typeof initSupabase==='function')?initSupabase():null;if(sb){const{data,error}=await sb.from(USER_TBL).select('*').eq('username','Jamrat').eq('app_code',APP_CODE).limit(1);if(!error&&data&&data.length){u=Object.assign({},u,data[0]);}}}catch(e){console.warn('tlResolveSession fetch:',e&&e.message);}}
if(isJamrat&&!_tlIsAdminRole(u.role))u.role='admin';setCurrentUser(u);return u;}catch(e){console.warn('tlResolveSession:',e&&e.message);return null;}}
async function ensureSeedUser(){return;}
async function doLogin(){const username=$('login-username').value.trim();const password=$('login-password').value;if(!username||!password){toast('กรุณากรอก Username + Password','warn');return;}
const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const btn=$('login-btn');btn.disabled=true;btn.textContent='กำลังเข้าสู่ระบบ...';try{const fakeEmail=String(username).toLowerCase().replace(/[^a-z0-9._-]/g,'')+'@timelinetest.app';const{data:sess,error:authErr}=await sb.auth.signInWithPassword({email:fakeEmail,password:password});if(authErr){console.warn('auth login error:',authErr.message);const m=String(authErr.message||'').toLowerCase();if(/invalid login|invalid_grant|email not confirmed/i.test(m)){toast('Username หรือ Password ไม่ถูกต้อง','err');}else{toast('Login error: '+authErr.message,'err');}
return;}
if(!sess||!sess.user){toast('Login error: no session','err');return;}
const authEmail=String(sess.user.email||'').toLowerCase();if(!authEmail.endsWith(AUTH_EMAIL_SUFFIX)){await sb.auth.signOut();console.warn('Login rejected: email suffix mismatch',authEmail);toast('🚫 บัญชีนี้ไม่ได้รับสิทธิ์สำหรับ Timeline','err');return;}
const{data:appRows,error:appErr}=await sb.from(USER_TBL).select('*').eq('auth_user_id',sess.user.id).eq('app_code',APP_CODE).limit(1);if(appErr){console.error('app_users lookup error:',appErr);await sb.auth.signOut();toast('ไม่สามารถตรวจสิทธิ์ผู้ใช้: '+appErr.message,'err');return;}
if(!appRows||!appRows.length){await sb.auth.signOut();toast('🚫 บัญชีนี้ไม่มีสิทธิ์เข้าระบบ TIMELINE — กรุณาติดต่อ Super Admin','err');return;}
const row=appRows[0];const st=String(row.status||'active').toLowerCase();if(st==='pending'){await sb.auth.signOut();toast('🕐 บัญชีของคุณรอการอนุมัติจาก Super Admin','warn');return;}
if(st==='inactive'||st==='disabled'||st==='banned'){await sb.auth.signOut();toast('🚫 บัญชีถูกระงับ — ติดต่อ Super Admin','err');return;}
console.log('[AUTH CHECK]',{email:sess.user.email,app_code:row.app_code,status:row.status,role:row.role,auth_user_id:row.auth_user_id});setCurrentUser(row);$('loginModal').style.display='none';applyRoleUI();toast('✓ ยินดีต้อนรับ '+row.username,'ok');switchPage('tm');try{if(typeof loadTM==='function')loadTM();}catch(e){console.error('post-login loadTM:',e);}}catch(e){console.error('doLogin exception:',e);toast('Login error: '+(e&&e.message||String(e)),'err');}finally{btn.disabled=false;btn.textContent='🔓 เข้าสู่ระบบ';}}
async function logout(){if(!(await mobileConfirm({title:'ออกจากระบบ?',confirmText:'ออกจากระบบ',cancelText:'ยกเลิก'})))return;try{const sb=(typeof initSupabase==='function')?initSupabase():null;if(sb&&sb.auth)await sb.auth.signOut();}catch(_){}
clearCurrentUser();try{applyRoleUI();}catch(_){}
try{if(typeof toast==='function')toast('ออกจากระบบแล้ว','ok');}catch(_){}
try{if(typeof showLoginModal==='function')showLoginModal();}catch(_){}}
async function openUserModal(){return;}
let _njUsers=[];let _njEditId=null;function _njFindId(id){const f=_njUsers.find(x=>String(x.id)===String(id));return f?f.id:id;}
async function loadUsersPage(){console.log('OPEN USERS PAGE');const box=document.getElementById('users-list');if(!box)return;const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){box.innerHTML='<div style="padding:16px;color:#fca5a5">Supabase ไม่พร้อม</div>';return;}
box.innerHTML='<div style="padding:18px;text-align:center;color:var(--text2)"><div class="spinner" style="display:inline-block;vertical-align:middle"></div> กำลังโหลดรายชื่อผู้ใช้…</div>';try{const tlSet=new Set();try{const{data:tlrows}=await sb.from(TM_TBL).select('created_by').not('created_by','is',null).limit(10000);(tlrows||[]).forEach(r=>{const v=String(r.created_by==null?'':r.created_by).trim();if(v)tlSet.add(v);});}catch(scanErr){console.warn('timeline users scan:',scanErr&&scanErr.message);}
const byId=new Map();const tlArr=Array.from(tlSet).slice(0,800);if(tlArr.length){const{data:ua,error:ea}=await sb.from(USER_TBL).select('*').in('username',tlArr).eq('app_code',APP_CODE).limit(500);if(ea)throw ea;(ua||[]).forEach(u=>{if(u&&u.id!=null)byId.set(String(u.id),u);});}
try{const{data:ub}=await sb.from(USER_TBL).select('*').or('username.ilike.jamrat,role.ilike.%admin%,role.ilike.%super%,role.ilike.%owner%,role.ilike.%root%').eq('app_code',APP_CODE).limit(100);(ub||[]).forEach(u=>{if(u&&u.id!=null)byId.set(String(u.id),u);});}catch(adminErr){console.warn('admin scan:',adminErr&&adminErr.message);}
_njUsers=Array.from(byId.values()).sort((a,b)=>{const ta=a.created_at?Date.parse(a.created_at):0,tb=b.created_at?Date.parse(b.created_at):0;return tb-ta;});_njEditId=null;_njRenderUsers();}catch(e){console.error('loadUsersPage error:',e);box.innerHTML='<div style="padding:16px;color:#fca5a5">โหลดรายชื่อผู้ใช้ล้มเหลว: '+esc(e&&(e.message||e))
+'<div style="margin-top:10px"><button class="pv-btn pv-btn-ghost" onclick="loadUsersPage()">↻ ลองใหม่</button></div></div>';}}
function _njIsProtected(u){if(!u)return false;const PROTECTED=['jamrat','soontaree'];const un=String(u.username||'').trim().toLowerCase();if(PROTECTED.indexOf(un)>=0)return true;const fn=String(u.full_name||u.name||'').trim().toLowerCase();if(PROTECTED.some(p=>fn.indexOf(p)>=0))return true;return false;}
function _njGetDept(u){try{if(u&&u.department&&String(u.department).trim())return String(u.department).trim();const fn=String((u&&(u.full_name||u.name))||'');const mm=fn.match(/\[([^\[\]]+)\]\s*$/);if(mm)return mm[1].trim();}catch(_){}
return'';}
function _njStripDeptTag(fn){return String(fn||'').replace(/\s*\[[^\[\]]+\]\s*$/,'').trim();}
function _njRenderUsers(){const box=document.getElementById('users-list');if(!box)return;const cnt=document.getElementById('users-count');if(cnt)cnt.textContent=_njUsers.length.toLocaleString('th-TH');const DEPTS=['Im','Ex','Ac','Mgmt'];const _canAdd=(typeof isSuperAdmin==='function'&&isSuperAdmin());let addForm='';if(_canAdd){addForm='<div class="nj-adduser-panel" style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.30);border-radius:10px;padding:14px;margin-bottom:14px">'
+'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:600;color:#86efac;font-size:14px">'
+'<span>➕</span><span>เพิ่มผู้ใช้งานใหม่</span>'
+'<span style="margin-left:auto;font-size:11px;color:var(--text3);font-weight:400">เฉพาะ Super Admin</span>'
+'</div>'
+'<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px;align-items:end">'
+'<div><label style="display:block;font-size:11px;color:var(--text3);margin-bottom:3px">Username <span style="color:#f87171">*</span></label>'
+'<input id="nj-add-username" class="ar-input" type="text" placeholder="username" autocomplete="off"></div>'
+'<div><label style="display:block;font-size:11px;color:var(--text3);margin-bottom:3px">ชื่อ-สกุล</label>'
+'<input id="nj-add-fullname" class="ar-input" type="text" placeholder="(ว่าง = ใช้ username)" autocomplete="off"></div>'
+'<div><label style="display:block;font-size:11px;color:var(--text3);margin-bottom:3px">Password <span style="color:#f87171">*</span></label>'
+'<input id="nj-add-password" class="ar-input" type="text" placeholder="≥ 6 ตัว" autocomplete="new-password"></div>'
+'<div><label style="display:block;font-size:11px;color:var(--text3);margin-bottom:3px">แผนก</label>'
+'<select id="nj-add-dept" class="ar-input">'
+'<option value="">— เลือก —</option>'
+DEPTS.map(d=>'<option value="'+esc(d)+'">'+esc(d)+'</option>').join('')
+'</select></div>'
+'<div><label style="display:block;font-size:11px;color:var(--text3);margin-bottom:3px">สิทธิ์</label>'
+'<select id="nj-add-role" class="ar-input">'
+'<option value="user" selected>USER</option>'
+'<option value="admin">ADMIN</option>'
+'<option value="super_admin">SUPER ADMIN</option>'
+'</select></div>'
+'<div><button class="pv-btn pv-btn-primary ar-bg" style="width:100%;padding:8px 12px" onclick="njAddUser()">+ เพิ่ม</button></div>'
+'</div></div>';}
if(!_njUsers.length){box.innerHTML=addForm+'<div style="padding:20px;text-align:center;color:var(--text3);font-style:italic">— ยังไม่มีผู้ใช้งานในระบบ —</div>';return;}
let html=addForm+'<div class="user-tbl-wrap" style="max-height:none"><table class="user-tbl"><thead><tr>'
+'<th>Username</th><th>ชื่อ-สกุล</th><th>Password</th><th>แผนก</th><th>สิทธิ์</th><th>สร้างเมื่อ</th>'
+'<th style="text-align:center">จัดการ</th></tr></thead><tbody>';_njUsers.forEach(u=>{const id=u.id;const sid=esc(String(id));const isAdmin=(typeof _tlRoleIsAdmin==='function'&&_tlRoleIsAdmin(u.role))||(typeof _tlLooksJamrat==='function'&&_tlLooksJamrat(u));const rkind=(typeof _njRoleKind==='function')?_njRoleKind(u):(isAdmin?'admin':'user');const rLbl=rkind==='super'?'SUPER ADMIN':(rkind==='admin'?'ADMIN':'USER');const rCls=rkind==='super'?'super':(rkind==='admin'?'admin':'user');const cr=u.created_at?new Date(u.created_at).toLocaleDateString('th-TH'):'-';const dept=_njGetDept(u);const cleanFn=_njStripDeptTag(u.full_name||u.name||'')||(u.username||'');if(String(_njEditId)===String(id)){const roleVal=(rkind==='super')?'super_admin':(rkind==='admin'?'admin':'user');const _deptInList=DEPTS.indexOf(dept)>=0;const _legacyOpt=(dept&&!_deptInList)?'<option value="'+esc(dept)+'" selected>'+esc(dept)+' (เดิม)</option>':'';const optsHtml=['<option value="">— เลือก —</option>',_legacyOpt].concat(DEPTS.map(d=>'<option value="'+esc(d)+'"'+(dept===d?' selected':'')+'>'+esc(d)+'</option>')).join('');html+='<tr class="editing">'
+'<td><input class="ar-input" id="nju-u-'+sid+'" value="'+esc(String(u.username||''))+'" style="min-width:108px"></td>'
+'<td><input class="ar-input" id="nju-f-'+sid+'" value="'+esc(cleanFn)+'" style="min-width:118px"></td>'
+'<td><input class="ar-input" id="nju-p-'+sid+'" value="'+esc(String(u.password||''))+'" style="min-width:108px"></td>'
+'<td><select class="ar-input" id="nju-d-'+sid+'" style="min-width:120px">'+optsHtml+'</select></td>'
+'<td><select class="ar-input" id="nju-r-'+sid+'">'
+'<option value="user"'+(roleVal==='user'?' selected':'')+'>USER</option>'
+'<option value="admin"'+(roleVal==='admin'?' selected':'')+'>ADMIN</option>'
+'<option value="super_admin"'+(roleVal==='super_admin'?' selected':'')+'>SUPER ADMIN</option></select></td>'
+'<td>'+esc(cr)+'</td>'
+'<td style="text-align:center;white-space:nowrap">'
+'<button class="pv-btn pv-btn-primary ar-bg pv-btn-sm" onclick="njUserSave(\''+sid+'\')">💾 บันทึก</button> '
+'<button class="pv-btn pv-btn-ghost pv-btn-sm" onclick="njUserCancel()">✕ ยกเลิก</button>'
+'</td></tr>';}else{html+='<tr>'
+'<td><b>'+esc(String(u.username||'-'))+'</b></td>'
+'<td>'+esc(cleanFn||'-')+'</td>'
+'<td><code style="font-size:11px;color:var(--text2)">'+esc(String(u.password||'—'))+'</code></td>'
+'<td>'+(dept?'<span class="role-pill user" style="background:rgba(168,85,247,.14);color:#c4b5fd;border-color:rgba(168,85,247,.35)">'+esc(dept)+'</span>':'<span style="color:var(--text3)">—</span>')+'</td>'
+'<td><span class="role-pill '+rCls+'">'+rLbl+'</span></td>'
+'<td>'+esc(cr)+'</td>'
+'<td style="text-align:center;white-space:nowrap">'
+'<button class="pv-btn pv-btn-warn pv-btn-sm" onclick="njUserEdit(\''+sid+'\')">✏️ แก้ไข</button> '
+(_njIsProtected(u)?'<span class="pv-btn pv-btn-sm" style="background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.4);color:#c4b5fd;cursor:not-allowed" title="บัญชี Super Admin หลัก — ห้ามลบ">🛡 ปกป้อง</span>':'<button class="pv-btn pv-btn-delete pv-btn-sm" onclick="njUserDelete(\''+sid+'\')">🗑 ลบ</button>')
+'</td></tr>';}});html+='</tbody></table></div>';box.innerHTML=html;}
function njUserEdit(id){_njEditId=_njFindId(id);_njRenderUsers();setTimeout(()=>{const e=document.getElementById('nju-u-'+id);if(e){e.focus();e.select&&e.select();}},40);}
function njUserCancel(){_njEditId=null;_njRenderUsers();}
async function njUserSave(id){if(typeof isSuperAdmin==='function'&&!isSuperAdmin()){toast('เฉพาะผู้ดูแลระบบ (Admin)','err');return;}
const gv=(k)=>{const e=document.getElementById('nju-'+k+'-'+id);return e?String(e.value):'';};const username=gv('u').trim();const full=gv('f').trim();const pass=gv('p');const role=(gv('r')||'user').trim()||'user';if(!username){toast('กรุณากรอก Username','warn');return;}
if(!pass){toast('กรุณากรอก Password','warn');return;}
const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){toast('Supabase ไม่พร้อม','err');return;}
try{const dept=(gv('d')||'').trim();const baseFn=_njStripDeptTag(full||username)||username;const fnWithTag=dept?(baseFn+' ['+dept+']'):baseFn;const payload={username:username,full_name:fnWithTag,password:pass,role:role};if(dept)payload.department=dept;let{error}=await sb.from(USER_TBL).update(payload).eq('id',_njFindId(id)).eq('app_code',APP_CODE);if(error){const m0=String(error.message||error.code||'');if(/department/i.test(m0)&&/column|schema|PGRST204|42703/i.test(m0)){delete payload.department;const r2=await sb.from(USER_TBL).update(payload).eq('id',_njFindId(id)).eq('app_code',APP_CODE);error=r2.error;}}
if(error)throw error;toast('✓ บันทึกผู้ใช้เรียบร้อย','ok');_njEditId=null;await loadUsersPage();}catch(e){console.error('njUserSave:',e);const m=String(e&&(e.message||e)||'');if(typeof tmIsPermissionErr==='function'&&tmIsPermissionErr(e))toast('บันทึกไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401)','err');else if(/23514|check constraint|role_check/i.test(m))toast('ค่า role ไม่ผ่านเงื่อนไขฐานข้อมูล (DB อนุญาตเฉพาะบางค่า เช่น admin/user)','err');else if(/duplicate|unique|23505/i.test(m))toast('Username นี้ถูกใช้แล้ว','err');else toast('บันทึกล้มเหลว: '+m,'err');}}
async function njUserDelete(id){if(typeof isSuperAdmin==='function'&&!isSuperAdmin()){toast('เฉพาะผู้ดูแลระบบ (Admin)','err');return;}
const row=_njUsers.find(x=>String(x.id)===String(id));const nm=row?String(row.username||''):'';if(typeof _njIsProtected==='function'&&_njIsProtected(row)){toast('🛡 ห้ามลบบัญชี Super Admin หลัก ('+nm+')','err');return;}
const me=(typeof getCurrentUser==='function'&&getCurrentUser())?String(getCurrentUser().username||''):'';if(nm&&me&&nm.toLowerCase()===me.toLowerCase()){if(!(await mobileConfirm({title:'⚠ ลบบัญชีตัวเอง?',message:'นี่คือบัญชีที่คุณกำลังใช้อยู่\nลบแล้วจะถูกบังคับออกจากระบบ',confirmText:'ลบบัญชี',cancelText:'ยกเลิก',danger:true})))return;}else if(!(await mobileConfirm({title:'ยืนยันลบผู้ใช้?',message:'ลบผู้ใช้ "'+nm+'" ออกถาวร?',confirmText:'ลบผู้ใช้',cancelText:'ยกเลิก',danger:true})))return;const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){toast('Supabase ไม่พร้อม','err');return;}
try{const{error}=await sb.from(USER_TBL).delete().eq('id',_njFindId(id)).eq('app_code',APP_CODE);if(error)throw error;toast('🗑 ลบผู้ใช้แล้ว','ok');if(nm&&me&&nm.toLowerCase()===me.toLowerCase()){try{clearCurrentUser();}catch(_){}
try{if(typeof showLoginModal==='function')showLoginModal();}catch(_){}
return;}
await loadUsersPage();}catch(e){console.error('njUserDelete:',e);if(typeof tmIsPermissionErr==='function'&&tmIsPermissionErr(e))toast('ลบไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401)','err');else toast('ลบล้มเหลว: '+(e&&(e.message||e)),'err');}}
async function njAddUser(){if(typeof isSuperAdmin==='function'&&!isSuperAdmin()){toast('🚫 เฉพาะ Super Admin เท่านั้น','err');return;}
const $i=id=>document.getElementById(id);const username=($i('nj-add-username')||{}).value;const password=($i('nj-add-password')||{}).value;const fullname=($i('nj-add-fullname')||{}).value;const dept=($i('nj-add-dept')||{}).value;const role=($i('nj-add-role')||{}).value||'user';const u=String(username||'').trim();const p=String(password||'');if(!u){toast('กรุณากรอก Username','warn');$i('nj-add-username').focus();return;}
if(!p){toast('กรุณากรอก Password','warn');$i('nj-add-password').focus();return;}
if(p.length<6){toast('Password ต้องมีอย่างน้อย 6 ตัว','warn');return;}
const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){toast('Supabase ไม่พร้อม','err');return;}
let adminSession=null;try{const{data}=await sb.auth.getSession();if(data&&data.session){adminSession={access_token:data.session.access_token,refresh_token:data.session.refresh_token};}}catch(_){}
const btn=event&&event.target?event.target:null;if(btn){btn.disabled=true;btn.textContent='กำลังเพิ่ม...';}
try{const fakeEmail=u.toLowerCase().replace(/[^a-z0-9._-]/g,'')+'@timelinetest.app';let newAuthUid=null;let isReusingOrphan=false;const{data:sess,error:authErr}=await sb.auth.signUp({email:fakeEmail,password:p});if(authErr){const msg=String(authErr.message||'');if(/already|registered|exists|duplicate/i.test(msg)){console.log('Trying recover orphan auth.user for',fakeEmail);const{data:sess2,error:signInErr}=await sb.auth.signInWithPassword({email:fakeEmail,password:p});if(signInErr||!sess2||!sess2.user){console.error('Recovery failed:',signInErr);toast('🚫 Username "'+u+'" มีอยู่ใน auth.users แล้วและรหัสไม่ตรง · ติดต่อ Admin ลบ orphan','err');return;}
newAuthUid=sess2.user.id;isReusingOrphan=true;console.log('Recovered orphan auth.user:',newAuthUid);}else{console.error('njAddUser signUp error:',authErr);toast('สมัครไม่สำเร็จ: '+msg,'err');return;}}else{newAuthUid=sess&&sess.user?sess.user.id:null;}
if(!newAuthUid){toast('สมัครไม่สำเร็จ: no auth id','err');return;}
const cleanFn=String(fullname||'').trim()||u;const fullnameWithTag=dept?(cleanFn+' ['+dept+']'):cleanFn;const payload={auth_user_id:newAuthUid,username:u,full_name:fullnameWithTag,role:role,status:'active',app_code:APP_CODE,department:dept||null};const{error:insErr}=await sb.from(USER_TBL).insert([payload]);if(insErr){console.error('njAddUser insert error:',insErr);const m=String(insErr.message||'');if(/duplicate|unique|23505/i.test(m)||insErr.code==='23505'){if(/username/i.test(m)||/username/i.test(insErr.details||'')){toast('🚫 Username "'+u+'" ถูกใช้แล้วใน web นี้','warn');}else if(/auth_user/i.test(m)||/auth_user/i.test(insErr.details||'')){toast('🚫 บัญชี auth นี้มี row อยู่ใน app_users แล้ว','warn');}else{toast('🚫 ข้อมูลซ้ำ: '+m,'warn');}}else{toast('เพิ่ม app_users ไม่สำเร็จ: '+m,'err');}
return;}
if(adminSession&&adminSession.access_token){try{await sb.auth.setSession({access_token:adminSession.access_token,refresh_token:adminSession.refresh_token});}catch(e){console.warn('restore admin session:',e);}}
$i('nj-add-username').value='';$i('nj-add-password').value='';$i('nj-add-fullname').value='';$i('nj-add-dept').value='';$i('nj-add-role').value='user';toast('✓ เพิ่มผู้ใช้ "'+u+'" สำเร็จ','ok');if(typeof loadUsersPage==='function')await loadUsersPage();}catch(e){console.error('njAddUser exception:',e);toast('เพิ่มไม่สำเร็จ: '+(e&&e.message||String(e)),'err');}finally{if(btn){btn.disabled=false;btn.textContent='+ เพิ่ม';}}}
function tlUserInfo(){try{var u=(typeof getCurrentUser==='function')?getCurrentUser():null;if(!u){toast('ยังไม่ได้เข้าสู่ระบบ (ใช้งานแบบไม่ระบุตัวตน)','warn');return;}
var nm=u.username||u.name||u.full_name||'—';var role=(typeof getRole==='function')?getRole():(u.role||'—');toast('👤 ผู้ใช้งาน: '+nm+'  ·  สิทธิ์: '+role,'ok');}catch(e){toast('ไม่สามารถอ่านข้อมูลผู้ใช้งาน','err');}}
function tlBackupInfo(){toast('📦 การสำรองข้อมูล: กรุณาใช้ปุ่ม Backup ที่ระบบหลัก (billing.html) — Timeline ไม่โหลด Excel เพื่อความเร็ว','warn');}
function closeUserModal(){$('userModal').style.display='none';_editingUserId=null;}
let _lastUsers=[];let _editingUserId=null;const USERS_CREATE_SQL="create table if not exists app_users (\n  id bigserial primary key,\n  username text not null,\n  password text,\n  email text,\n  role text not null default 'user',\n  app_code text not null default 'refund',\n  created_at timestamptz default now()\n);";window.__copyUsersSQL=function(btn){const sql=USERS_CREATE_SQL;const done=()=>{if(btn){const o=btn.textContent;btn.textContent='✓ คัดลอกแล้ว!';btn.disabled=true;setTimeout(()=>{btn.textContent=o;btn.disabled=false;},1800);}if(typeof toast==='function')toast('คัดลอก SQL แล้ว — ไปวางใน Supabase SQL Editor ได้เลย','ok');};try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(sql).then(done).catch(()=>{_fallbackCopy(sql);done();});}
else{_fallbackCopy(sql);done();}}catch(_){_fallbackCopy(sql);done();}};function _usersMissingPanel(title){const sql=USERS_CREATE_SQL;return'<div style="padding:20px 16px;color:var(--text2);font-size:12.5px;line-height:1.7">'
+'<div style="font-size:14px;font-weight:800;color:var(--amber2);margin-bottom:6px">⚠ '+esc(title)+'</div>'
+'<div style="margin:6px 0 12px">แอปสร้างตารางเองไม่ได้ (ต้องใช้สิทธิ์ admin) — ทำตาม 3 ขั้นตอนนี้:</div>'
+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="__copyUsersSQL(this)">📋 1. คัดลอก SQL</button>'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="__openSQLEditor()">🔗 2. เปิด SQL Editor</button>'
+'<button class="pv-btn pv-btn-ghost" onclick="loadUsers()">↻ 3. กลับมากดที่นี่</button>'
+'</div>'
+'<div style="font-size:11px;color:var(--text3);margin-bottom:6px">เปิดแท็บใหม่ → วาง (Ctrl/Cmd+V) → กด Run → กลับมากดปุ่ม 3</div>'
+'<details><summary style="cursor:pointer;font-size:11.5px;color:var(--text2)">ดู SQL</summary>'
+'<pre style="background:var(--surface2);padding:12px;border-radius:8px;font-size:11px;overflow:auto;color:var(--text);margin-top:8px;white-space:pre-wrap;word-break:break-word">'+esc(sql)+'</pre></details>'
+'</div>';}
async function loadUsers(){const sb=initSupabase();if(!sb){$('user-list').innerHTML='<div style="padding:14px;color:var(--red2)">Supabase ไม่พร้อม</div>';return;}
$('user-list').innerHTML='<div style="padding:14px;color:var(--text2);text-align:center"><div class="spinner" style="display:inline-block;vertical-align:middle"></div> กำลังโหลด…</div>';try{const qP=sb.from(USER_TBL).select('*').eq('app_code',APP_CODE).order('created_at',{ascending:false}).limit(200);const timeoutP=new Promise((_,rej)=>setTimeout(()=>rej(new Error('__timeout__')),12000));const{data,error}=await Promise.race([qP,timeoutP]);if(error)throw error;_lastUsers=data||[];renderUserTable(_lastUsers);}catch(e){console.error('loadUsers error:',e);const msg=(e&&(e.message||e.hint||e.details||e.code))?String(e.message||e.hint||e.details||e.code):'';if(msg==='__timeout__'){$('user-list').innerHTML='<div style="padding:18px 16px;color:var(--text2);font-size:12.5px;line-height:1.7">'
+'<div style="font-size:14px;font-weight:800;color:var(--amber2);margin-bottom:6px">⏱ โหลดนานผิดปกติ — ตาราง app_users อาจยังไม่มี</div>'
+'<div style="margin:6px 0 12px">ลองสร้างตาราง app_users ด้วย 3 ขั้นตอนนี้ แล้วลองใหม่:</div>'
+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="__copyUsersSQL(this)">📋 1. คัดลอก SQL</button>'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="__openSQLEditor()">🔗 2. เปิด SQL Editor</button>'
+'<button class="pv-btn pv-btn-ghost" onclick="loadUsers()">↻ 3. ลองใหม่</button>'
+'</div>'
+'<details><summary style="cursor:pointer;font-size:11.5px;color:var(--text2)">ดู SQL</summary>'
+'<pre style="background:var(--surface2);padding:12px;border-radius:8px;font-size:11px;overflow:auto;color:var(--text);margin-top:8px;white-space:pre-wrap;word-break:break-word">'+esc(USERS_CREATE_SQL)+'</pre></details>'
+'</div>';return;}
if(/relation|does not exist|table|42P01|PGRST205|404/i.test(msg)){console.warn('═══ ต้องสร้าง table app_users — รัน SQL: ═══\n'+USERS_CREATE_SQL);$('user-list').innerHTML=_usersMissingPanel('ยังไม่มีตาราง app_users ในฐานข้อมูล');}else if(/column|password|app_code|schema|PGRST204|42703/i.test(msg)){const sql="ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password TEXT;\nALTER TABLE app_users ADD COLUMN IF NOT EXISTS app_code TEXT;\nUPDATE app_users SET app_code='refund' WHERE app_code IS NULL OR app_code='';";console.warn('═══ ต้องเพิ่ม column — รัน SQL: ═══\n'+sql);$('user-list').innerHTML='<div style="padding:18px 16px;color:var(--text2);font-size:12.5px;line-height:1.7">'
+'<div style="font-size:14px;font-weight:800;color:var(--amber2);margin-bottom:6px">⚠ ขาด column password / app_code ใน app_users</div>'
+'<div style="margin:6px 0 10px">รัน SQL นี้ใน Supabase → SQL Editor:</div>'
+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="(function(b){try{navigator.clipboard.writeText('+JSON.stringify(sql)+').then(function(){b.textContent=\'✓ คัดลอกแล้ว!\';});}catch(e){}})(this)">📋 คัดลอก SQL</button>'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="__openSQLEditor()">🔗 เปิด SQL Editor</button>'
+'<button class="pv-btn pv-btn-ghost" onclick="loadUsers()">↻ ลองใหม่</button>'
+'</div>'
+'<pre style="background:var(--surface2);padding:12px;border-radius:8px;font-size:11px;overflow:auto;color:var(--text);margin-top:6px;white-space:pre-wrap;word-break:break-word">'+esc(sql)+'</pre></div>';}else{$('user-list').innerHTML='<div style="padding:14px;color:var(--red2)">โหลดล้มเหลว: '+esc(msg)
+'<div style="margin-top:10px"><button class="pv-btn pv-btn-ghost" onclick="loadUsers()">↻ ลองใหม่</button></div></div>';}}}
function renderUserTable(users){_lastUsers=users;if(!users.length){$('user-list').innerHTML='<div style="padding:16px;color:var(--text3);text-align:center;font-style:italic">ยังไม่มีผู้ใช้งานในระบบแก้ไข — กรอกข้อมูลด้านล่างเพื่อเพิ่ม</div>';return;}
let html='<table class="user-tbl"><thead><tr>'
+'<th>Username</th><th>Password</th><th>Email</th><th>Role</th><th>Created</th>'
+'<th style="text-align:center">จัดการ</th></tr></thead><tbody>';users.forEach(u=>{let role=String(u.role||'user').toLowerCase().trim();if(/super|supper/.test(role)||role==='owner'||role==='root'||role==='sa')role='super';else if(role==='admin'||role==='administrator'||role.indexOf('admin')>=0)role='admin';else role='user';const roleLbl=role==='super'?'SUPER ADMIN':(role==='admin'?'ADMIN':'USER');const created=u.created_at?new Date(u.created_at).toLocaleDateString('th-TH'):'-';const isEditing=u.id===_editingUserId;if(isEditing){html+='<tr class="editing">'
+'<td><input id="edit-u-name-'+u.id+'" type="text" value="'+esc(u.username||'')+'" class="user-edit-input"></td>'
+'<td><input id="edit-u-pass-'+u.id+'" type="text" value="'+esc(u.password||'')+'" class="user-edit-input" placeholder="password"></td>'
+'<td><input id="edit-u-email-'+u.id+'" type="text" value="'+esc(u.email||'')+'" class="user-edit-input" placeholder="email (optional)"></td>'
+'<td><select id="edit-u-role-'+u.id+'" class="user-edit-input">'
+'<option value="user" '+(role==='user'?'selected':'')+'>USER</option>'
+'<option value="admin" '+(role==='admin'?'selected':'')+'>ADMIN</option>'
+'<option value="super_admin" '+(role==='super'?'selected':'')+'>SUPER ADMIN</option>'
+'</select></td>'
+'<td style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:var(--text2)">'+esc(created)+'</td>'
+'<td style="text-align:center">'
+'<button class="pv-btn pv-btn-primary ar-bg pv-btn-sm" onclick="saveUserEdit('+u.id+')" title="บันทึก">💾 บันทึก</button> '
+'<button class="pv-btn pv-btn-ghost pv-btn-sm" onclick="cancelUserEdit()" title="ยกเลิก">✕</button>'
+'</td></tr>';}else{const pwd=u.password||'';const delBtn=canDelete()?'<button class="pv-btn pv-btn-delete pv-btn-sm" onclick="deleteUser('+u.id+',\''+esc(u.username||'').replace(/'/g,"\\'")+'\')">🗑 ลบ</button>':'';html+='<tr>'
+'<td><b>'+esc(u.username||'-')+'</b></td>'
+'<td><code class="user-pwd-cell">'+(pwd?esc(pwd):'<span style="color:var(--text3);font-style:italic">(ไม่ได้ตั้ง)</span>')+'</code></td>'
+'<td>'+esc(u.email||'-')+'</td>'
+'<td><span class="user-role '+role+'">'+roleLbl+'</span></td>'
+'<td style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:var(--text2)">'+esc(created)+'</td>'
+'<td style="text-align:center">'
+'<button class="pv-btn pv-btn-ghost pv-btn-sm" onclick="editUser('+u.id+')" title="แก้ไข">✏ แก้</button> '
+delBtn
+'</td></tr>';}});html+='</tbody></table>';$('user-list').innerHTML=html;}
function editUser(id){if(!isSuperAdmin()){toast('สิทธิ์ USER ไม่สามารถแก้ไข user','err');return;}
_editingUserId=id;renderUserTable(_lastUsers);}
function cancelUserEdit(){_editingUserId=null;renderUserTable(_lastUsers);}
async function saveUserEdit(id){if(!isSuperAdmin()){toast('สิทธิ์ไม่พอ','err');return;}
const username=$('edit-u-name-'+id).value.trim();const password=$('edit-u-pass-'+id).value;const email=$('edit-u-email-'+id).value.trim();const role=$('edit-u-role-'+id).value;if(!username){toast('Username ห้ามว่าง','warn');return;}
const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const safeFullName=(username&&username.trim())?username.trim():username;const payload={username,full_name:safeFullName,password:password||null,email:email||null,role};const{error}=await sb.from(USER_TBL).update(payload).eq('id',id).eq('app_code',APP_CODE);if(error){console.error('saveUserEdit error:',error);if(/duplicate|unique/i.test(error.message||''))toast('Username "'+username+'" ถูกใช้แล้ว','warn');else toast('แก้ไขไม่สำเร็จ: '+error.message,'err');return;}
_editingUserId=null;toast('✓ แก้ไข "'+username+'" สำเร็จ','ok');await loadUsers();const cu=getCurrentUser();if(cu&&cu.id===id){setCurrentUser({...cu,username,password,role});applyRoleUI();}}
async function addUser(){if(!isSuperAdmin()){toast('สิทธิ์ไม่พอ','err');return;}
const username=$('user-input-name').value.trim();const password=$('user-input-pass').value;const role=($('user-input-role')||{}).value||'user';if(!username){toast('กรุณากรอก Username','warn');$('user-input-name').focus();return;}
if(!password){toast('กรุณากรอก Password','warn');$('user-input-pass').focus();return;}
if(password.length<6){toast('Password ต้องมีอย่างน้อย 6 ตัว','warn');return;}
const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const btn=$('user-add-btn');btn.disabled=true;btn.textContent='กำลังเพิ่ม...';let adminSession=null;try{const{data}=await sb.auth.getSession();adminSession=data&&data.session?{access_token:data.session.access_token,refresh_token:data.session.refresh_token}:null;}catch(_){}
try{const fakeEmail=String(username).toLowerCase().replace(/[^a-z0-9._-]/g,'')+'@timelinetest.app';const{data:sess,error:authErr}=await sb.auth.signUp({email:fakeEmail,password:password});if(authErr){console.error('signUp error:',authErr);const m=String(authErr.message||'');if(/already|registered|exists/i.test(m)){toast('Username "'+username+'" มีอยู่แล้ว','warn');}else{toast('สมัครไม่สำเร็จ: '+m,'err');}
return;}
const newAuthUid=sess&&sess.user?sess.user.id:null;if(!newAuthUid){toast('สมัครไม่สำเร็จ: no auth id','err');return;}
const safeFullName=(username&&username.trim())?username.trim():username;const dept=($('user-input-dept')?$('user-input-dept').value:'').trim();const payload={auth_user_id:newAuthUid,username:username,full_name:dept?(safeFullName+' ['+dept+']'):safeFullName,role:role,status:'active',app_code:APP_CODE,department:dept||null};const{error:insErr}=await sb.from(USER_TBL).insert([payload]);if(insErr){console.error('addUser insert error:',insErr);toast('เพิ่ม app_users ไม่สำเร็จ: '+insErr.message,'err');return;}
if(adminSession&&adminSession.access_token){try{await sb.auth.setSession({access_token:adminSession.access_token,refresh_token:adminSession.refresh_token});}catch(e){console.warn('restore admin session:',e);}}
$('user-input-name').value='';$('user-input-pass').value='';if($('user-input-dept'))$('user-input-dept').value='';if($('user-input-role'))$('user-input-role').value='user';toast('✓ เพิ่มผู้ใช้ "'+username+'" สำเร็จ','ok');if(typeof loadUsers==='function')await loadUsers();}catch(e){console.error('addUser exception:',e);toast('เพิ่มไม่สำเร็จ: '+(e&&e.message||String(e)),'err');}finally{btn.disabled=false;btn.textContent='+ เพิ่ม';}}
async function deleteUser(id,username){if(!guardDelete())return;if(!(await mobileConfirm({title:'ลบผู้ใช้?',message:'ลบผู้ใช้ "'+username+'"?\nการลบนี้ไม่สามารถย้อนกลับได้',confirmText:'ลบ',cancelText:'ยกเลิก',danger:true})))return;const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const{error}=await sb.from(USER_TBL).delete().eq('id',id).eq('app_code',APP_CODE);if(error){toast('ลบไม่สำเร็จ: '+error.message,'err');return;}
toast('🗑 ลบผู้ใช้ "'+username+'" แล้ว','ok');await loadUsers();}
const THIN_BORDER={top:{style:'thin',color:{argb:'FF000000'}},bottom:{style:'thin',color:{argb:'FF000000'}},left:{style:'thin',color:{argb:'FF000000'}},right:{style:'thin',color:{argb:'FF000000'}}};const HEADER_FILL={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFFC0'}};const CENTER_ALIGN={horizontal:'center',vertical:'center'};function styleHeaderRow(row,fontSize){row.eachCell({includeEmpty:true},cell=>{cell.font={name:'Tahoma',size:fontSize,bold:false,color:{argb:'FF000000'}};cell.fill=HEADER_FILL;cell.border=THIN_BORDER;cell.alignment=CENTER_ALIGN;});}
function styleDataRow(row,fontSize){row.eachCell({includeEmpty:true},cell=>{cell.font={name:'Tahoma',size:fontSize,bold:false,color:{argb:'FF000000'}};cell.border=THIN_BORDER;cell.alignment=CENTER_ALIGN;cell.numFmt='General';});}
function showProgress(title){let el=$('progress-overlay');if(!el){el=document.createElement('div');el.id='progress-overlay';el.className='progress-overlay';el.innerHTML=''
+'<div class="progress-box">'
+'<h3 id="progress-title">กำลังประมวลผล…</h3>'
+'<div class="progress-info" id="progress-info">เริ่มต้น…</div>'
+'<div class="progress-bar"><div class="progress-bar-fill" id="progress-fill" style="width:0%"></div></div>'
+'<div class="progress-pct" id="progress-pct">0%</div>'
+'</div>';document.body.appendChild(el);}
$('progress-title').textContent=title||'กำลังประมวลผล…';$('progress-info').textContent='เริ่มต้น…';$('progress-fill').style.width='0%';$('progress-pct').textContent='0%';el.style.display='flex';}
function updateProgress(current,total,label){const pct=total>0?Math.round(current*100/total):0;const fill=$('progress-fill');if(fill)fill.style.width=pct+'%';const pctEl=$('progress-pct');if(pctEl)pctEl.textContent=pct+'%';const info=$('progress-info');if(info)info.textContent=(label||'')+' · '+current.toLocaleString('th-TH')+' / '+total.toLocaleString('th-TH');}
function hideProgress(){const el=$('progress-overlay');if(el)el.style.display='none';}
function _pad2(n){return(n<10?'0':'')+n;}
function _setAuto(fid,val){const inp=$(fid);if(inp)inp.value=(val==null?'':val);const did=fid.replace('-f-','-d-');const badge=$(did);if(badge){const v=(val==null?'':String(val));badge.textContent=v===''?'—':v;badge.classList.toggle('is-wait',v.indexOf('⏳')===0);badge.classList.toggle('is-empty',v===''||v==='—');}}
function _syncAutoFromValue(fid){const inp=$(fid);_setAuto(fid,inp?inp.value:'');}
function tmDateFromPicker(iso){const s=String(iso||'').trim();const mm=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!mm){return;}
const dmy=mm[3]+'/'+mm[2]+'/'+mm[1];const txt=$('tm-f-date-show');if(txt)txt.value=dmy;if(typeof _setAuto==='function')_setAuto('tm-f-date',dmy);}
function tmDateFromText(){const txt=$('tm-f-date-show');if(!txt)return;let s=String(txt.value||'').trim();if(!s){if(typeof _setAuto==='function')_setAuto('tm-f-date','');return;}
const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(iso){s=_pad2(+iso[3])+'/'+_pad2(+iso[2])+'/'+iso[1];}
else{const dm=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(dm){let y=dm[3];if(y.length===2)y='20'+y;s=_pad2(+dm[1])+'/'+_pad2(+dm[2])+'/'+y;}}
txt.value=s;if(typeof _setAuto==='function')_setAuto('tm-f-date',s);const pk=$('tm-f-date-pick');const m2=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(pk&&m2){pk.value=m2[3]+'-'+m2[2]+'-'+m2[1];}}
function tmFillDateShow(){const hid=$('tm-f-date');const txt=$('tm-f-date-show');const pk=$('tm-f-date-pick');const v=hid?String(hid.value||'').trim():'';if(txt)txt.value=v;const m2=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(pk)pk.value=m2?(m2[3]+'-'+m2[2]+'-'+m2[1]):'';}
async function nextJobNJ(){return'';}
async function nextARRun(){return'';}
async function nextRCRun(){return'';}
async function nextDORun(){return'';}
function parseDateCell(v){if(v==null||v==='')return'';if(v instanceof Date&&!isNaN(v)){return v.getFullYear()+'-'+_pad2(v.getMonth()+1)+'-'+_pad2(v.getDate());}
if(typeof v==='number'&&isFinite(v)){const days=Math.floor(v);const ms=(days-25569)*86400*1000;const d=new Date(ms);if(!isNaN(d)){return d.getUTCFullYear()+'-'+_pad2(d.getUTCMonth()+1)+'-'+_pad2(d.getUTCDate());}}
const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);if(m){let[_,a,b,y]=m;let dd=+a,mm=+b;if(mm>12&&dd<=12){[dd,mm]=[mm,dd];}
if(y.length===2)y=(+y>50?'19':'20')+y;let yy=+y;if(yy>2400)yy-=543;if(dd>=1&&dd<=31&&mm>=1&&mm<=12){return yy+'-'+_pad2(mm)+'-'+_pad2(dd);}}
return s;}
function arPick(btn){try{var d=btn.parentElement.querySelector('input[type=date]');if(!d)return;if(typeof d.showPicker==='function'){d.showPicker();}
else{d.focus();d.click();}}catch(_){try{var x=btn.parentElement.querySelector('input[type=date]');if(x)x.focus();}catch(__){}}}
function tlToggleSidebar(force){try{const open=(force===undefined)?!document.body.classList.contains('tl-sb-open'):!!force;document.body.classList.toggle('tl-sb-open',open);}catch(_){}}
function switchPage(name){try{try{if(window.matchMedia&&window.matchMedia('(max-width:1023px)').matches)tlToggleSidebar(false);}catch(_){}
if(name==='users'){console.log('OPEN USERS PAGE');if(typeof isSuperAdmin==='function'&&!isSuperAdmin()){if(typeof toast==='function')toast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น','warn');return switchPage('tm');}
currentPage='users';document.body.classList.add('ar-active');document.querySelectorAll('.pv').forEach(p=>p.classList.remove('active'));const pgU=document.getElementById('page-users');if(pgU)pgU.classList.add('active');['nav-tm','nav-closed'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('active');});const nu=document.getElementById('nav-users');if(nu)nu.classList.add('active');const nm=document.getElementById('tb-page-name'),bg=document.getElementById('tb-page-badge');if(nm)nm.textContent='ผู้ใช้งาน';if(bg){bg.className='tb-badge ar';bg.textContent='USERS';}
if(typeof loadUsersPage==='function'){try{loadUsersPage();}catch(e){console.error('loadUsersPage:',e);}}
return;}
currentPage='tm';document.body.classList.add('ar-active');const pgU2=document.getElementById('page-users');if(pgU2)pgU2.classList.remove('active');const nu2=document.getElementById('nav-users');if(nu2)nu2.classList.remove('active');const pgT=document.getElementById('page-tm');const nvT=document.getElementById('nav-tm');if(pgT)pgT.classList.add('active');if(nvT)nvT.classList.add('active');const nm=document.getElementById('tb-page-name'),bg=document.getElementById('tb-page-badge');if(nm)nm.textContent='TIMELINE';if(bg){bg.className='tb-badge ar';bg.textContent='TM';}
if(typeof setMeta==='function')setMeta('rows: '+(((typeof TMState!=='undefined')&&TMState.total)||0).toLocaleString('th-TH'));if(typeof TMState!=='undefined'){if(!TMState.loaded){if(typeof loadTM==='function')loadTM();}
else if(typeof renderTM==='function'){try{renderTM();}catch(_){}}}}catch(e){console.error('switchPage error:',e);try{const pg=document.getElementById('page-tm');if(pg)pg.classList.add('active');}catch(_){}}}
async function runBackup(){return;}
const TM_TBL='timeline_records';const TM_HEADERS=['วันที่','ชื่อลูกค้า','B/L No.','เลขใบขน','โกดัง','หมายเหตุ TIME LINE'];const TM_COLS=['date','customer','bl_no','customs_entry_no','warehouse','note'];const TM_DATE_FIELDS=new Set(['date']);const TM_VISIBLE_COLS=new Set(['date','customer','bl_no','customs_entry_no','warehouse']);const TM_CREATE_SQL='create extension if not exists "pgcrypto";\n'+'create table if not exists timeline_records (\n'+'  id uuid primary key default gen_random_uuid(),\n'+'  date text, customer text, bl_no text,\n'+'  customs_entry_no text, warehouse text, note text,\n'+'  created_by text,\n'+'  created_at timestamptz default now(),\n'+'  updated_at timestamptz default now()\n'+');\n'+'create unique index if not exists timeline_uniq\n'+'  on timeline_records (customer, bl_no, customs_entry_no);';const TM_CLOSE_TOKEN='⛔CLOSEJOB';const TMState={rows:[],page:0,pageSize:20,total:0,mLimit:15,sortWhen:'desc',kpiFilter:null,view:'open',closedCount:0,counts:{total:0,bl:0,entry:0,note:0,wh:0},filters:{q:'',customer:'',warehouse:'',dateFrom:'',dateTo:''},options:{customer:[],warehouse:[]},optionsLoaded:false,reqId:0,loaded:false,_countsSig:null,_countsFresh:false};function _tmIsMobile(){try{return!!(window.matchMedia&&window.matchMedia('(max-width:1023px)').matches);}catch(_){return false;}}
function _tmFilterSig(){const scope=(typeof tlIsUserScope==='function'&&tlIsUserScope())?('u:'+tlMyUsername()):'all';return[scope,TMState.view||'open'].join('\u0001');}
function tmInvalidateCounts(){TMState._countsFresh=false;TMState._optsAt=0;TMState._deptLoadedAt=0;}
function tmIsMissingTableErr(e){const m=String((e&&(e.message||e.hint||e.details||e.code))||'').toLowerCase();return/timeline_records/.test(m)&&/(exist|not found|relation|schema|pgrst|42p01|404)/.test(m)||/relation .*timeline_records.* does not exist/.test(m);}
function tmShowTableSQL(statusId){console.warn('═══ ยังไม่มีตาราง timeline_records — รัน SQL นี้ใน Supabase: ═══');console.warn(TM_CREATE_SQL);if(statusId)setStatus(statusId,'err','<div class="is-title"><button class="is-close" onclick="this.parentElement.parentElement.className=\'inline-status\'">×</button>❌ ยังไม่มีตาราง <b>timeline_records</b></div>'
+'<div class="is-row" style="gap:6px;flex-wrap:wrap">'
+'<button class="pv-btn pv-btn-primary ar-bg pv-btn-sm" onclick="__copySQL(\'tm\',this)">📋 คัดลอก SQL</button>'
+'<button class="pv-btn pv-btn-primary ar-bg pv-btn-sm" onclick="__openSQLEditor()">🔗 เปิด SQL Editor</button>'
+'<button class="pv-btn pv-btn-ghost pv-btn-sm" onclick="loadTM()">↻ Refresh</button>'
+'</div>');}
function tmIsPermissionErr(e){if(!e)return false;const code=String(e.code||e.status||'').toLowerCase();const msg=String(e.message||e.hint||e.details||e||'').toLowerCase();return/^(401|403)$/.test(code)||/pgrst301|42501/.test(code)||/permission denied|row-level security|rls|not authorized|unauthorized|violates row-level/.test(msg)||/\b40(1|3)\b/.test(msg);}
const TM_RLS_FIX_SQL='-- เปิดสิทธิ์อ่าน/เขียน timeline_records ให้ key ปัจจุบัน (idempotent)\n'+'alter table public.timeline_records enable row level security;\n'+'drop policy if exists "timeline_records_anon_rw" on public.timeline_records;\n'+'create policy "timeline_records_anon_rw"\n'+'  on public.timeline_records for all\n'+'  to anon, authenticated\n'+'  using (true) with check (true);\n'+'grant select, insert, update, delete on public.timeline_records to anon, authenticated;';function tlCopyText(btn,text){const done=()=>{if(btn){const o=btn.textContent;btn.textContent='✓ คัดลอกแล้ว';setTimeout(()=>{btn.textContent=o;},1600);}};try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done).catch(()=>tlCopyFallback(text,done));}else tlCopyFallback(text,done);}catch(_){tlCopyFallback(text,done);}}
function tlCopyFallback(text,cb){try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);if(cb)cb();}catch(_){try{window.prompt('คัดลอก SQL นี้:',text);}catch(__){}}}
function tmSqlEditorURL(){try{const ref=String(SUPA_URL||'').replace(/^https?:\/\//,'').split('.')[0];return ref?('https://supabase.com/dashboard/project/'+ref+'/sql/new'):'https://supabase.com/dashboard';}catch(_){return'https://supabase.com/dashboard';}}
function tmShowRLSFix(statusId){console.warn('═══ เขียน timeline_records ไม่ได้ (401/RLS) — รัน SQL นี้ใน Supabase: ═══');console.warn(TM_RLS_FIX_SQL);window.__TM_RLS_SQL=TM_RLS_FIX_SQL;if(statusId){setStatus(statusId,'err','<div class="is-title"><button class="is-close" onclick="this.parentElement.parentElement.className=\'inline-status\'">×</button>🔒 บันทึกไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS / 401)</div>'
+'<div style="font-size:11.5px;color:var(--text2);line-height:1.6;margin:4px 0 8px">'
+'อ่านข้อมูลได้แต่เขียนไม่ได้ เพราะตาราง <b>timeline_records</b> เปิด RLS แต่ยังไม่มี policy ให้เขียน · '
+'รัน SQL ด้านล่างใน Supabase SQL Editor (ทำครั้งเดียว) — ไม่กระทบ billing.html'
+'</div>'
+'<div class="is-row" style="gap:6px;flex-wrap:wrap">'
+'<button class="pv-btn pv-btn-primary ar-bg pv-btn-sm" onclick="tlCopyText(this, window.__TM_RLS_SQL)">📋 คัดลอก SQL</button>'
+'<a class="pv-btn pv-btn-ghost pv-btn-sm" href="'+tmSqlEditorURL()+'" target="_blank" rel="noopener" style="text-decoration:none">🔗 เปิด SQL Editor</a>'
+'<button class="pv-btn pv-btn-ghost pv-btn-sm" onclick="tmShowRLSModal()">📖 วิธีแก้ละเอียด</button>'
+'</div>'
+'<pre style="margin:8px 0 0;padding:9px 11px;background:rgba(13,16,24,.6);border:1px solid var(--border);border-radius:7px;font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#cffafe;white-space:pre-wrap;word-break:break-word;max-height:160px;overflow:auto">'
+esc(TM_RLS_FIX_SQL)+'</pre>');}
try{tmShowRLSModal();}catch(_){}}
function tmShowRLSModal(){window.__TM_RLS_SQL=TM_RLS_FIX_SQL;let m=document.getElementById('rlsModal');if(!m){m=document.createElement('div');m.id='rlsModal';m.className='paste-modal';m.style.display='none';m.setAttribute('onclick',"if(event.target===this)this.style.display='none'");m.innerHTML='<div class="paste-modal-content" style="max-width:620px">'
+'<div class="paste-modal-head">'
+'<h3>🔒 ต้องตั้งค่าสิทธิ์เขียนที่ Supabase (ทำครั้งเดียว)</h3>'
+'<button class="paste-modal-close" onclick="document.getElementById(\'rlsModal\').style.display=\'none\'" title="ปิด">✕</button>'
+'</div>'
+'<div class="paste-modal-body">'
+'<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--amber2);line-height:1.6;margin-bottom:12px">'
+'⚠ <b>นี่ไม่ใช่บั๊กของ timeline.html</b> — โค้ดอ่านข้อมูลได้ปกติ แต่ Supabase '
+'เปิด <b>Row Level Security</b> บนตาราง <code>timeline_records</code> โดยยังไม่มี policy ให้ <b>เขียน</b> '
+'จึงตอบกลับ <b>401</b> ตอนบันทึก/แก้/ลบ · แก้ได้ด้วยการรัน SQL ด้านล่าง <b>ในโปรเจกต์ Supabase ของคุณ ครั้งเดียว</b> '
+'(ไฟล์ HTML เปลี่ยนสิทธิ์ฝั่งเซิร์ฟเวอร์ให้ไม่ได้)'
+'</div>'
+'<div style="font-size:12px;color:var(--text);font-weight:700;margin-bottom:6px">ขั้นตอน</div>'
+'<ol style="margin:0 0 12px 18px;padding:0;font-size:12px;color:var(--text2);line-height:1.7">'
+'<li>กด <b>คัดลอก SQL</b> ด้านล่าง</li>'
+'<li>กด <b>เปิด SQL Editor</b> (เข้า Supabase &rarr; โปรเจกต์ &rarr; SQL Editor)</li>'
+'<li>วาง SQL แล้วกด <b>Run</b></li>'
+'<li>กลับมาที่หน้านี้ แล้ว <b>กดบันทึกอีกครั้ง</b> — จะใช้งานได้</li>'
+'</ol>'
+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="tlCopyText(this, window.__TM_RLS_SQL)">📋 คัดลอก SQL</button>'
+'<a class="pv-btn pv-btn-ghost" id="rls-sql-link" href="#" target="_blank" rel="noopener" style="text-decoration:none">🔗 เปิด SQL Editor</a>'
+'</div>'
+'<pre id="rls-sql-pre" style="margin:0;padding:11px 13px;background:rgba(13,16,24,.6);border:1px solid var(--border);border-radius:8px;font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#cffafe;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;user-select:all"></pre>'
+'<div style="font-size:10.5px;color:var(--text3);margin-top:10px;line-height:1.6">'
+'หมายเหตุ: SQL นี้เปิดสิทธิ์อ่าน/เขียนตาราง <code>timeline_records</code> ให้คีย์ปัจจุบัน (เหมือนที่อ่านได้อยู่แล้ว) '
+'ปลอดภัยต่อ billing.html · ไม่แก้ schema เดิม · รันซ้ำได้ (idempotent)'
+'</div>'
+'</div>'
+'<div class="paste-modal-actions">'
+'<button class="pv-btn pv-btn-ghost" onclick="document.getElementById(\'rlsModal\').style.display=\'none\'">ปิด</button>'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="document.getElementById(\'rlsModal\').style.display=\'none\';loadTM()">↻ ลองโหลด/บันทึกใหม่</button>'
+'</div>'
+'</div>';document.body.appendChild(m);}
try{const pre=m.querySelector('#rls-sql-pre');if(pre)pre.textContent=TM_RLS_FIX_SQL;const lnk=m.querySelector('#rls-sql-link');if(lnk)lnk.href=tmSqlEditorURL();}catch(_){}
m.style.display='flex';}
function tmFmtCell(field,v){if(v==null||v==='')return'';if(TM_DATE_FIELDS.has(field)){const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return m[3]+'/'+m[2]+'/'+m[1];}
return String(v);}
function tmDeriveInfo(r){const note=(r&&r.note!=null)?String(r.note):'';let statusText='',curDate='',lastDate='',lastTime='',lastText='';let closed=false,finishedBy='',finishedAt='';if(note){const lines=note.split(/\r?\n/);for(let i=0;i<lines.length;i++){const ln=lines[i];let m;if(ln.indexOf(TM_CLOSE_TOKEN)>=0){closed=true;const fb=ln.match(/finishedBy=([^\s]+)/);if(fb)finishedBy=fb[1];const fa=ln.match(/finishedAt=([^\s]+)/);if(fa)finishedAt=fa[1];continue;}
if((m=ln.match(/อัปเดตสถานะงาน\s*:\s*(.*)$/))){statusText=m[1].trim();continue;}
if((m=ln.match(/^\s*วันที่\s*:\s*(.+)$/))){curDate=m[1].trim();continue;}
if((m=ln.match(/^\s*•\s*⏰\s*(\S+)\s+([\s\S]+)$/))){lastDate=curDate;lastTime=m[1].trim();lastText=m[2].trim();}}}
const hay=(statusText+' '+note).toLowerCase();let modeKey='',modeLabel='—';try{const mm=note.match(/🧭\s*โหมด\s*:\s*(SeaIm|SeaEx|AirIm|AirEx)/i);if(mm){modeLabel=mm[1].charAt(0).toUpperCase()+mm[1].slice(1,3).toLowerCase()
+mm[1].charAt(3).toUpperCase()+mm[1].slice(4).toLowerCase();modeKey=modeLabel.toLowerCase();}}catch(_){}
if(!modeKey){const air=/\bair\b|airim|airex|hawb|mawb|เที่ยวบิน|สายการบิน|อากาศ|✈/.test(hay);const sea=/\bsea\b|seaim|seaex|เรือ|ตู้|container|🚢|🛳/.test(hay);const ex=/export|ส่งออก|airex|seaex|ขาออก|\bex\b|📤/.test(hay);const im=/import|นำเข้า|airim|seaim|ขาเข้า|\bim\b/.test(hay);if(air||sea||ex||im){const A=sea?'Sea':(air?'Air':'Air');const D=ex&&!im?'Ex':'Im';modeKey=(A+D).toLowerCase();modeLabel=A+D;}}
const late=/(ล่าช้า|ปัญหา|ติดปัญหา|ตกค้าง|ค้าง|เลื่อน|ขัดข้อง|ผิดพลาด|delay|hold|incident|error|problem|issue)/i.test(note);const statusKind=late?'late':'ok';let when='';if(lastDate||lastTime)when=(lastDate||'')+(lastTime?(lastDate?'  ':'')+'⏰ '+lastTime:'');let latest=lastText||statusText||'';if(latest.length>140)latest=latest.slice(0,140).trim()+'…';let qty='';try{const mq=note.match(/📦\s*จำนวนงาน\s*:\s*([^\n\r]+)/);if(mq)qty=mq[1].trim();}catch(_){}
return{modeKey,modeLabel,statusKind,latest,when,lastDate,lastTime,qty,closed,finishedBy,finishedAt};}
function tmJobAge(r,info){let base=null;try{if(info&&info.when){const w=String(info.when).trim();let mm=w.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);if(mm){base=new Date(+mm[3],+mm[2]-1,+mm[1],+(mm[4]||0),+(mm[5]||0));}}}catch(_){}
if((!base||isNaN(base))&&r&&r.created_at){const d=new Date(r.created_at);if(!isNaN(d))base=d;}
if(!base&&r&&r.date){const s=String(r.date).trim();let mm=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(mm)base=new Date(+mm[1],+mm[2]-1,+mm[3]);else{mm=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(mm)base=new Date(+mm[3],+mm[2]-1,+mm[1]);}}
if(!base||isNaN(base))return-1;const now=new Date();const a=new Date(base.getFullYear(),base.getMonth(),base.getDate()).getTime();const b=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();const days=Math.floor((b-a)/86400000);return days<0?0:days;}
function tmStatusBadge(r,info){if(info&&info.closed){return'<span class="tm-st tm-st-closed" title="ปิดงานแล้ว'
+(info.finishedBy?(' โดย '+esc(info.finishedBy)):'')+'">🔴 CLOSE JOB</span>';}
const d=tmJobAge(r,info);if(d<0)return'<span class="tm-st tm-st-ok">🟢 วันนี้</span>';if(d===0)return'<span class="tm-st tm-st-ok">🟢 วันนี้</span>';if(d===1)return'<span class="tm-st tm-age-1">🟡 ค้าง 1 วัน</span>';if(d===2)return'<span class="tm-st tm-age-2">🟠 ค้าง 2 วัน</span>';return'<span class="tm-st tm-age-3">🔴 ค้าง '+d+' วัน</span>';}
function tmNormValue(field,v){if(v==null)return'';if(TM_DATE_FIELDS.has(field)){if(v instanceof Date||typeof v==='number'){const p=parseDateCell(v);return/^\d{4}-\d{2}-\d{2}/.test(p)?p.slice(0,10):String(p).trim();}
const s=String(v).trim();if(s==='')return'';if(/^[\d]{1,4}[\/\-.][\d]{1,2}[\/\-.][\d]{1,4}$/.test(s)||/^\d{4}-\d{2}-\d{2}/.test(s)){const p=parseDateCell(s);if(/^\d{4}-\d{2}-\d{2}/.test(p))return p.slice(0,10);}
return s;}
return String(v).trim();}
function tmUKey(r){return String(r.customer||'').trim()+'\u0001'
+String(r.bl_no||'').trim()+'\u0001'
+String(r.customs_entry_no||'').trim();}
function tmApplyFilters(q){q=tmApplyScope(q);if((TMState.view||'open')==='closed'){q=q.ilike('note','%'+TM_CLOSE_TOKEN+'%');}else{q=q.or('note.is.null,note.not.ilike.%'+TM_CLOSE_TOKEN+'%');}
const f=TMState.filters;if(f.q){const t='%'+escIlike(f.q)+'%';const __cjExt=(window.__tmCJState&&window.__tmCJState.extSearch&&(TMState.view||'open')==='closed');if(__cjExt){let orStr='customer.ilike.'+t+',bl_no.ilike.'+t+',customs_entry_no.ilike.'+t+',warehouse.ilike.'+t+',note.ilike.'+t+',created_by.ilike.'+t;const idN=parseInt(f.q,10);if(!isNaN(idN)&&String(idN)===f.q.trim())orStr+=',id.eq.'+idN;q=q.or(orStr);}else{q=q.or('customer.ilike.'+t+',bl_no.ilike.'+t+',customs_entry_no.ilike.'+t+',warehouse.ilike.'+t);}}
if(f.customer)q=q.eq('customer',f.customer);if(f.warehouse)q=q.eq('warehouse',f.warehouse);if((TMState.view||'open')==='closed'){if(f.dateFrom)q=q.gte('updated_at',f.dateFrom+'T00:00:00');if(f.dateTo)q=q.lte('updated_at',f.dateTo+'T23:59:59.999');}else{if(f.dateFrom)q=q.gte('date',f.dateFrom);if(f.dateTo)q=q.lte('date',f.dateTo);}
return q;}
async function tmLoadPage(){const sb=initSupabase();if(!sb)throw new Error('Supabase ไม่พร้อม');TMState.reqId++;const myReq=TMState.reqId;let from,to,_append=false;if(_tmIsMobile()){if(TMState._mAppend){from=TMState.rows.length;to=from+15-1;_append=true;}else{from=0;to=14;}}else{from=TMState.page*TMState.pageSize;to=from+TMState.pageSize-1;}
const wantCount=!_append;const selOpts=wantCount?{count:'exact'}:undefined;let q=selOpts?sb.from(TM_TBL).select('*',selOpts):sb.from(TM_TBL).select('*');q=q.order('created_at',{ascending:false}).order('id',{ascending:false}).range(from,to);q=tmApplyFilters(q);const{data,count,error}=await q;if(myReq!==TMState.reqId)return;if(error)throw error;if(!_append)TMState.rows.length=0;(data||[]).forEach(r=>TMState.rows.push(r));while(TMState.rows.length>500)TMState.rows.shift();if(wantCount)TMState.total=count||0;TMState._mAppend=false;}
async function tmLoadCounts(){const sb=initSupabase();if(!sb)return;const sig=_tmFilterSig();if(TMState._countsFresh&&TMState._countsSig===sig)return;try{if(_tmIsMobile()){const __wantClosed=(TMState.view||'open')==='closed'||window.__tmCloseLazyAllowCount;const closedQ=sb.from(TM_TBL).select('id',{count:'exact',head:true}).ilike('note','%'+TM_CLOSE_TOKEN+'%');const __cqPromise=__wantClosed?tmApplyScope(closedQ):Promise.resolve({count:TMState.closedCount||null});const[tot,bl,cl]=await Promise.all([tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})),tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})).not('bl_no','is',null).neq('bl_no',''),__cqPromise]);TMState.counts.total=tot.count||0;TMState.counts.bl=bl.count||0;if(__wantClosed)TMState.closedCount=cl.count||0;TMState._countsSig=sig;TMState._countsFresh=true;return;}
const[tot,bl,ent,nt,wh]=await Promise.all([tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})),tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})).not('bl_no','is',null).neq('bl_no',''),tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})).not('customs_entry_no','is',null).neq('customs_entry_no',''),tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})).not('note','is',null).neq('note',''),tmApplyFilters(sb.from(TM_TBL).select('id',{count:'exact',head:true})).not('warehouse','is',null).neq('warehouse','')]);TMState.counts.total=tot.count||0;TMState.counts.bl=bl.count||0;TMState.counts.entry=ent.count||0;TMState.counts.note=nt.count||0;TMState.counts.wh=wh.count||0;TMState._countsSig=sig;TMState._countsFresh=true;}catch(e){console.warn('tmLoadCounts:',e.message);}}
const _tmDeptMap={};function _tmDeptOf(username){if(!username)return'';return _tmDeptMap[String(username).trim().toLowerCase()]||'';}
async function _tmLoadDeptMap(force){if(!force&&TMState._deptLoadedAt&&(Date.now()-TMState._deptLoadedAt)<5*60*1000)return;const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb)return;try{let data,error,hasDeptCol=true;let r1=await sb.from(USER_TBL).select('username,full_name,department').eq('app_code',APP_CODE).limit(1000);if(r1.error){const m=String(r1.error.message||r1.error.code||'').toLowerCase();if(/department/i.test(m)&&/column|schema|pgrst204|42703|does not exist/i.test(m)){hasDeptCol=false;const r2=await sb.from(USER_TBL).select('username,full_name').eq('app_code',APP_CODE).limit(1000);data=r2.data;error=r2.error;}else{error=r1.error;}}else{data=r1.data;}
if(error){console.warn('_tmLoadDeptMap:',error.message||error);return;}
let found=0;(data||[]).forEach(u=>{const un=String(u.username||'').trim().toLowerCase();if(!un)return;let d=hasDeptCol?String(u.department||'').trim():'';if(!d){const fn=String(u.full_name||'');const mm=fn.match(/\[([^\[\]]+)\]\s*$/);if(mm)d=mm[1].trim();}
if(d){_tmDeptMap[un]=d;found++;}});console.log('[dept map] users:',(data||[]).length,'· with dept:',found,'· hasCol:',hasDeptCol);TMState._deptLoadedAt=Date.now();}catch(e){console.warn('_tmLoadDeptMap exception:',e&&e.message);}}
async function tmLoadFilterOptions(force){const now=Date.now();const TTL=5*60*1000;if(!force&&TMState.optionsLoaded&&TMState._optsAt&&(now-TMState._optsAt)<TTL)return;const sb=initSupabase();if(!sb)return;try{let q=sb.from(TM_TBL).select('customer,warehouse').limit(5000);q=tmApplyScope(q);const{data,error}=await q;if(error)throw error;const s={customer:new Set(),warehouse:new Set()};(data||[]).forEach(r=>{['customer','warehouse'].forEach(k=>{const v=String(r[k]||'').trim();if(v)s[k].add(v);});});['customer','warehouse'].forEach(k=>{TMState.options[k]=[...s[k]].sort();});tmFillSelect('tm-fcust','ลูกค้า ทั้งหมด',TMState.options.customer);tmFillSelect('tm-fwh','โกดัง ทั้งหมด',TMState.options.warehouse);TMState.optionsLoaded=true;TMState._optsAt=now;}catch(e){console.warn('tmLoadFilterOptions:',e.message);}}
function tmFillSelect(id,allLabel,arr){const el=$(id);if(!el)return;const cur=el.value;el.innerHTML='<option value="">'+esc(allLabel)+'</option>'+
arr.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');el.value=cur;}
async function loadTM(){if(typeof isLoggedIn==='function'&&!isLoggedIn())return;await tmReload(true);}
function tmShowFatal(html){const tb=$('tm-tbody');if(tb)tb.innerHTML='<tr><td colspan="11">'+html+'</td></tr>';try{['tm-k-total','tm-k-bl','tm-k-entry','tm-k-note','tm-k-wh'].forEach(id=>{const e=$(id);if(e)e.textContent='0';});const s=$('tm-show');if(s)s.textContent='0';const t=$('tm-total');if(t)t.textContent='0';const x=$('tm-export-cnt');if(x)x.textContent='0';}catch(_){}}
function tmMissingTableHTML(){const sql=(typeof TM_CREATE_SQL!=='undefined')?TM_CREATE_SQL:'';return _missingTablePanel('timeline_records',sql,'loadTM','tm');}
async function tmReload(forceOptions){const tb=$('tm-tbody');if(tb)tb.innerHTML='<tr><td colspan="11"><div class="loading-box"><div class="spinner"></div>กำลังโหลด…</div></td></tr>';if(typeof TMState!=='undefined'&&forceOptions)TMState.optionsLoaded=false;tmInvalidateCounts();window._tmKpiReqId=(window._tmKpiReqId||0)+1;const myReq=window._tmKpiReqId;try{await tmLoadPage();if(myReq!==window._tmKpiReqId)return;TMState.loaded=true;setConn('ok','online');if(currentPage==='tm')setMeta('rows: '+TMState.total.toLocaleString('th-TH')+' · '+new Date().toLocaleTimeString('th-TH'));renderTM();clearTimeout(window._tmKpiDeb);window._tmKpiDeb=setTimeout(async()=>{if(myReq!==window._tmKpiReqId)return;try{await Promise.all([tmLoadCounts(),tmLoadFilterOptions(forceOptions),_tmLoadDeptMap(true)]);if(myReq!==window._tmKpiReqId)return;renderTM();if(!_tmIsMobile()){try{if(typeof tmLoadClosedCount==='function')tmLoadClosedCount();}catch(_){}}}catch(_){}},700);}catch(e){console.error('tmReload:',e);TMState.loaded=true;if(typeof tmIsMissingTableErr==='function'&&tmIsMissingTableErr(e)){if(typeof tmShowTableSQL==='function')tmShowTableSQL('tm-import-status');tmShowFatal(tmMissingTableHTML());return;}
setConn('err','offline');tmShowFatal('<div class="pv-empty"><div style="font-size:14px;font-weight:700;color:#fca5a5;margin-bottom:6px">❌ โหลดข้อมูลล้มเหลว</div>'
+'<div style="font-size:12px;color:var(--text2)">'+esc(e&&(e.message||e))+'</div>'
+'<div style="margin-top:14px"><button class="pv-btn pv-btn-primary ar-bg" onclick="loadTM()">↻ ลองใหม่</button></div></div>');toast('โหลดล้มเหลว: '+(e&&(e.message||e)),'err');}}
async function tmReloadPage(){const tb=$('tm-tbody');const isLoadMore=!!(TMState&&TMState._mAppend);if(tb&&!isLoadMore)tb.innerHTML='<tr><td colspan="11"><div class="loading-box"><div class="spinner"></div>กำลังกรอง…</div></td></tr>';try{if(isLoadMore){await tmLoadPage();}else{await Promise.all([tmLoadPage(),tmLoadCounts(),_tmLoadDeptMap()]);}
setConn('ok','online');if(currentPage==='tm')setMeta('rows: '+TMState.total.toLocaleString('th-TH')+' · '+new Date().toLocaleTimeString('th-TH'));renderTM();if(!isLoadMore&&!_tmIsMobile()){try{if(typeof tmLoadClosedCount==='function')tmLoadClosedCount();}catch(_){}}}catch(e){console.error('tmReloadPage:',e);if(typeof tmIsMissingTableErr==='function'&&tmIsMissingTableErr(e)){tmShowFatal(tmMissingTableHTML());return;}
tmShowFatal('<div class="pv-empty"><div style="font-size:14px;font-weight:700;color:#fca5a5;margin-bottom:6px">❌ โหลดข้อมูลล้มเหลว</div>'
+'<div style="font-size:12px;color:var(--text2)">'+esc(e&&(e.message||e))+'</div>'
+'<div style="margin-top:14px"><button class="pv-btn pv-btn-primary ar-bg" onclick="loadTM()">↻ ลองใหม่</button></div></div>');toast('โหลดล้มเหลว: '+(e&&(e.message||e)),'err');}}
const _tmRenderLock={v:false};function renderTM(){if(_tmRenderLock.v)return;_tmRenderLock.v=true;try{try{if(typeof _tmSortRowsByWhen==='function')_tmSortRowsByWhen();}catch(_){}
const st=TMState;const allRows=st.rows||[];let rows;if(!st.kpiFilter||st.kpiFilter==='all'){rows=allRows;}else{rows=allRows.filter(r=>{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):null;if(info&&info.closed)return false;const a=(typeof tmJobAge==='function')?tmJobAge(r,info):-1;if(st.kpiFilter==='d0')return a<=0;if(st.kpiFilter==='d1')return a===1;if(st.kpiFilter==='d2')return a===2;if(st.kpiFilter==='d3')return a>=3;return true;});}
try{const ak=st.kpiFilter||'';document.querySelectorAll('#page-tm .tm-kpi-card').forEach(card=>{card.classList.toggle('active',String(card.getAttribute('data-kpi')||'')===ak);});}catch(_){}
const g=(id,val)=>{const e=$(id);if(e)e.textContent=val;};g('tm-k-total',(st.counts.total||0).toLocaleString('th-TH'));g('tm-k-bl',(st.counts.bl||0).toLocaleString('th-TH'));g('tm-k-entry',(st.counts.entry||0).toLocaleString('th-TH'));g('tm-k-note',(st.counts.note||0).toLocaleString('th-TH'));g('tm-k-wh',(st.counts.wh||0).toLocaleString('th-TH'));try{let _d0=0,_d1=0,_d2=0,_d3=0;(allRows||[]).forEach(r=>{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):null;if(info&&info.closed)return;const a=(typeof tmJobAge==='function')?tmJobAge(r,info):-1;if(a<=0)_d0++;else if(a===1)_d1++;else if(a===2)_d2++;else _d3++;});g('tm-k-bl',_d0.toLocaleString('th-TH'));g('tm-k-entry',_d1.toLocaleString('th-TH'));g('tm-k-note',_d2.toLocaleString('th-TH'));g('tm-k-wh',_d3.toLocaleString('th-TH'));}catch(_){}
const showFrom=rows.length?(st.page*st.pageSize+1):0;const showTo=rows.length?(st.page*st.pageSize+rows.length):0;g('tm-show',showFrom+'–'+showTo);g('tm-total',(st.total||0).toLocaleString('th-TH'));g('tm-export-cnt',(st.total||0).toLocaleString('th-TH'));try{const openN=Math.max(0,(st.total||0)-(st.closedCount||0));g('tm-open-count',openN.toLocaleString('th-TH'));g('tm-closed-count',(st.closedCount||0).toLocaleString('th-TH'));}catch(_){}
try{tmRenderPagination();}catch(_){}
if(_tmIsMobile()){try{if((st.view||'open')==='open'){st._openTotal=st.counts.total||0;}
const openN=(st.view||'open')==='open'?(st.counts.total||0):(st._openTotal||0);g('tm-mk-open',openN.toLocaleString('th-TH'));g('tm-mk-close',(st.closedCount||0).toLocaleString('th-TH'));g('tm-mk-bl',(st.counts.bl||0).toLocaleString('th-TH'));g('tm-m-total',(st.total||0).toLocaleString('th-TH'));const d=new Date();const p=n=>String(n).padStart(2,'0');g('tm-m-upd',p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes()));}catch(_){}
try{renderTMMobile(rows);}catch(e){console.error('renderTMMobile:',e);}
return;}
const tb=$('tm-tbody');if(!tb)return;if(!rows.length){const f=st.filters||{};const hasFilter=!!(f.q||f.customer||f.warehouse||f.dateFrom||f.dateTo);if(hasFilter){tb.innerHTML='<tr><td colspan="11"><div class="pv-empty">🔍 ไม่พบรายการตามเงื่อนไข — ลองล้างตัวกรอง/คำค้น</div></td></tr>';}else{tb.innerHTML='<tr><td colspan="11"><div class="pv-empty" style="padding:46px 20px">'
+'<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">ยังไม่มีข้อมูล</div>'
+'<div style="font-size:12.5px;color:var(--text2);margin-bottom:16px">กรุณากด <b>บันทึกข้อมูล</b> เพื่อเพิ่มรายการ</div>'
+'<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="openTMModal()">＋ บันทึกข้อมูล</button>'
+'</div></div></td></tr>';}
return;}
const canDel=(typeof canDelete==='function')?canDelete():false;const cell=(label,html,cls)=>'<td class="'+(cls||'')+'" data-th="'+esc(label)+'">'+html+'</td>';tb.innerHTML=rows.map(r=>{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{modeKey:'',modeLabel:'—',statusKind:'ok',latest:'',when:''};let dateStr;if(info.lastDate||info.lastTime){const dd=info.lastDate||(tmFmtCell('date',r.date)||'-');dateStr=esc(dd)+(info.lastTime?' <span class="tm-when">⏰ '+esc(info.lastTime)+'</span>':'');}else{dateStr=esc(tmFmtCell('date',r.date)||'-');}
const whenSub='';const cust=(r.customer!=null&&r.customer!=='')?String(r.customer):'-';const bl=(r.bl_no!=null&&r.bl_no!=='')?String(r.bl_no):'-';const entry=(r.customs_entry_no!=null&&r.customs_entry_no!=='')?String(r.customs_entry_no):'-';const wh=(r.warehouse!=null&&r.warehouse!=='')?String(r.warehouse):'-';const by=(r.created_by!=null&&r.created_by!=='')?String(r.created_by):'-';const modeBadge=info.modeLabel&&info.modeLabel!=='—'?'<span class="tm-badge tm-m-'+esc(info.modeKey)+'">'+esc(info.modeLabel)+'</span>':'<span class="tm-dim">—</span>';const stBadge=tmStatusBadge(r,info);const latest=info.latest?'<span class="tm-latest" title="'+esc(info.latest)+'">'+esc(info.latest)+'</span>':'<span class="tm-dim">—</span>';const rid=String(r.id);const editBtn=info.closed?'':'<button class="pv-btn pv-btn-warn pv-btn-sm" onclick="editTM(\''+rid+'\')" title="แก้ไขรายการ">✏️ แก้ไข</button>';const actBtn=info.closed?'<button class="pv-btn pv-btn-sm tm-btn-reopen" onclick="tmReopenJob(\''+rid+'\')" title="ยกเลิกปิดงาน — กลับไป TIMELINE">↩ เปิดใหม่</button>':'<button class="pv-btn pv-btn-sm tm-btn-done" onclick="tmCloseJob(\''+rid+'\')" title="ปิด/จบงานนี้">✅ จบงาน</button>';const delBtn=canDel?'<button class="pv-btn pv-btn-delete pv-btn-sm tm-btn-del" onclick="deleteTM(\''+rid+'\')" title="ลบรายการถาวร (Admin)">🗑 ลบ</button>':'';const moreBtn='';return'<tr>'
+cell('สถานะงาน',stBadge)
+cell('วันที่ / เวลา','<span>'+dateStr+'</span>'+whenSub)
+cell('ลูกค้า','<span title="'+esc(cust)+'">'+esc(cust)+'</span>')
+cell('B/L / HAWB','<span title="'+esc(bl)+'">'+esc(bl)+'</span>','mono')
+cell('เลขใบขน','<span title="'+esc(entry)+'">'+esc(entry)+'</span>','mono')
+cell('โกดัง','<span title="'+esc(wh)+'">'+esc(wh)+'</span>')
+cell('โหมด',modeBadge)
+cell('รายละเอียดล่าสุด',latest,'tm-latest-cell')
+cell('ผู้บันทึก','<span title="'+esc(by)+'">'+esc(by)+'</span>')
+cell('แผนก',(function(){const d=(typeof _tmDeptOf==='function')?_tmDeptOf(by):'';return d?'<span class="tm-dept-pill">'+esc(d)+'</span>':'<span style="color:var(--text3)">—</span>';})())
+'<td data-th="จัดการ"><div class="row-actions">'+editBtn+actBtn+delBtn+moreBtn+'</div></td>'
+'</tr>';}).join('');}catch(err){console.error('renderTM error:',err);try{const tb=$('tm-tbody');if(tb)tb.innerHTML='<tr><td colspan="11"><div class="pv-empty">⚠ เกิดข้อผิดพลาดในการแสดงผล: '+esc(err&&(err.message||err))
+'<div style="margin-top:12px"><button class="pv-btn pv-btn-primary ar-bg" onclick="loadTM()">↻ ลองใหม่</button></div></div></td></tr>';}catch(_){}}finally{_tmRenderLock.v=false;}}
function _tmWhenTs(r){try{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):null;const dd=info&&info.lastDate?String(info.lastDate):'';const tt=info&&info.lastTime?String(info.lastTime):'';let d=0,m=0,y=0,hh=0,mi=0;const md=dd.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(md){d=+md[1];m=+md[2];y=+md[3];}
const mt=tt.match(/(\d{1,2})[.:](\d{1,2})/);if(mt){hh=+mt[1];mi=+mt[2];}
if(y){return new Date(y,m-1,d,hh,mi).getTime();}}catch(_){}
if(r&&r.created_at){const ts=Date.parse(r.created_at);if(!isNaN(ts))return ts;}
return 0;}
function _tmSortRowsByWhen(){if(!TMState||!TMState.rows)return;const dir=(TMState.sortWhen==='asc')?1:-1;TMState.rows.sort((a,b)=>{const ta=_tmWhenTs(a),tb=_tmWhenTs(b);if(ta!==tb)return(ta-tb)*dir;return((b.id||0)-(a.id||0))*((dir===1)?-1:1);});}
function tmToggleSortWhen(){TMState.sortWhen=(TMState.sortWhen==='desc')?'asc':'desc';try{const a=document.getElementById('tm-when-arrow');if(a)a.textContent=(TMState.sortWhen==='asc')?'▲':'▼';}catch(_){}
if(typeof renderTM==='function')renderTM();}
function tmKpiFilter(kind){if(TMState.kpiFilter===kind)TMState.kpiFilter=null;else TMState.kpiFilter=kind;if(typeof renderTM==='function')renderTM();}
function tmRenderPagination(){const st=TMState;const el=$('tm-pagination');if(!el)return;if(_tmIsMobile()){const shown=st.rows.length;const total=st.total||0;const remain=Math.max(0,total-shown);el.innerHTML=''
+'<div class="pg-info" style="width:100%;text-align:center">📊 ทั้งหมด <b>'
+total.toLocaleString('th-TH')+'</b> · แสดง <b>'+shown.toLocaleString('th-TH')+'</b></div>'
+(remain>0?'<button class="pg-btn tm-loadmore" onclick="tmLoadMore()">⊕ โหลดเพิ่ม ('
+Math.min(15,remain)+' รายการ)</button>':'<div class="pg-info" style="width:100%;text-align:center;opacity:.55">— โหลดครบแล้ว —</div>');return;}
const totalPages=Math.max(1,Math.ceil(st.total/st.pageSize));const cur=st.page+1;const hasPrev=st.page>0,hasNext=st.page<totalPages-1;el.innerHTML=''
+'<div class="pg-info">📊 ทั้งหมด <b>'+st.total.toLocaleString('th-TH')+'</b> รายการ</div>'
+'<div class="pg-controls">'
+'<button class="pg-btn" onclick="tmFirst()" '+(hasPrev?'':'disabled')+'>⏮</button>'
+'<button class="pg-btn" onclick="tmPrev()" '+(hasPrev?'':'disabled')+'>◀</button>'
+'<span class="pg-page">หน้า <b>'+cur.toLocaleString('th-TH')+'</b> / '+totalPages.toLocaleString('th-TH')+'</span>'
+'<button class="pg-btn" onclick="tmNext()" '+(hasNext?'':'disabled')+'>▶</button>'
+'<button class="pg-btn" onclick="tmLast()" '+(hasNext?'':'disabled')+'>⏭</button>'
+'</div>'
+'<div class="pg-size"><label>แสดง</label>'
+'<select class="pv-select" onchange="tmSetPageSize(this.value)" style="min-width:90px">'
+[20,50,100,200].map(s=>'<option value="'+s+'" '+(s===st.pageSize?'selected':'')+'>'+s+' / หน้า</option>').join('')
+'</select></div>';}
function tmLoadMore(){TMState._mAppend=true;if(typeof tmReloadPage==='function')tmReloadPage();}
function _tmLoadSheetJS(){return new Promise((res,rej)=>{if(typeof XLSX!=='undefined')return res(XLSX);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>(typeof XLSX!=='undefined')?res(XLSX):rej(new Error('SheetJS load fail'));s.onerror=()=>rej(new Error('SheetJS load fail (network)'));document.head.appendChild(s);});}
function _tmLoadExcelJS(){return new Promise((res,rej)=>{if(typeof ExcelJS!=='undefined')return res(ExcelJS);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';s.onload=()=>(typeof ExcelJS!=='undefined')?res(ExcelJS):rej(new Error('ExcelJS load fail'));s.onerror=()=>rej(new Error('ExcelJS load fail (network)'));document.head.appendChild(s);});}
async function tmExportExcel(){const btn=document.querySelector('.tm-export-xlsx');const oldHTML=btn?btn.innerHTML:'';try{if(typeof isLoggedIn==='function'&&!isLoggedIn()){if(typeof toast==='function')toast('กรุณา Login ก่อน','warn');return;}
const sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb){if(typeof toast==='function')toast('Supabase ไม่พร้อม','err');return;}
if(btn){btn.disabled=true;btn.innerHTML='⏳ กำลังเตรียมไฟล์…';}
const E=await _tmLoadExcelJS();const CK=1000;const all=[];let off=0;for(;;){let q=sb.from(TM_TBL).select('*',off===0?{count:'exact'}:undefined).order('created_at',{ascending:false}).order('id',{ascending:false}).range(off,off+CK-1);q=(typeof tmApplyFilters==='function')?tmApplyFilters(q):q;const{data,error}=await q;if(error)throw error;(data||[]).forEach(r=>all.push(r));if(!data||data.length<CK)break;off+=CK;if(off>50000)break;}
if(!all.length){if(typeof toast==='function')toast('ไม่มีข้อมูลให้ Export','warn');return;}
const HEADERS=['สถานะงาน','วันที่','เวลา','ลูกค้า','B/L / HAWB','เลขใบขน','โกดัง','จำนวนงาน','โหมด','รายละเอียดล่าสุด','ผู้บันทึก','แผนก'];const WIDTHS=[16,14,10,22,22,18,12,14,10,50,16,14];function _fmtDMY(s){if(!s)return'';var m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[3]+'/'+m[2]+'/'+m[1];return String(s);}
function _fmtHM(s){if(!s)return'';return String(s).replace(':','.');}
const wb=new E.Workbook();wb.creator='N.J. Logistics — Timeline';wb.created=new Date();const sheetName=(TMState.view==='closed'?'CLOSE JOB':'TIMELINE')+' ('+all.length+')';const ws=wb.addWorksheet(sheetName.slice(0,31),{views:[{state:'frozen',ySplit:1}]});ws.columns=HEADERS.map((h,i)=>({header:h,key:'k'+i,width:WIDTHS[i]}));const headerRow=ws.getRow(1);HEADERS.forEach((_,i)=>{const c=headerRow.getCell(i+1);c.value=HEADERS[i];c.font={name:'Tahoma',size:11,color:{argb:'FF000000'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFC000'}};c.alignment={vertical:'middle',horizontal:'center'};c.border={top:{style:'thin',color:{argb:'FF000000'}},left:{style:'thin',color:{argb:'FF000000'}},bottom:{style:'thin',color:{argb:'FF000000'}},right:{style:'thin',color:{argb:'FF000000'}}};});headerRow.height=28;all.forEach((r,idx)=>{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{modeLabel:'',latest:'',lastDate:'',lastTime:'',closed:false};const whenDate=info.lastDate||(typeof tmFmtCell==='function'?(tmFmtCell('date',r.date)||''):(r.date||''));const whenTime=info.lastTime||'';const ageDays=(typeof tmJobAge==='function')?tmJobAge(r,info):-1;const status=info.closed?'CLOSE JOB':(ageDays<=0?'วันนี้':(ageDays===1?'ค้าง 1 วัน':(ageDays===2?'ค้าง 2 วัน':('ค้าง '+ageDays+' วัน'))));const dept=(typeof _tmDeptOf==='function')?_tmDeptOf(r.created_by||''):'';const vals=[status,_fmtDMY(whenDate),_fmtHM(whenTime),String(r.customer||''),String(r.bl_no||''),String(r.customs_entry_no||''),String(r.warehouse||''),String(info.qty||''),String(info.modeLabel||''),String(info.latest||''),String(r.created_by||''),String(dept||'')];const row=ws.addRow(vals);row.eachCell({includeEmpty:true},(cell,colNumber)=>{cell.font={name:'Tahoma',size:10.5,color:{argb:'FF000000'}};if(colNumber===10){cell.alignment={vertical:'middle',horizontal:'left',wrapText:true};}else{cell.alignment={vertical:'middle',horizontal:'center'};}
cell.border={top:{style:'thin',color:{argb:'FF000000'}},left:{style:'thin',color:{argb:'FF000000'}},bottom:{style:'thin',color:{argb:'FF000000'}},right:{style:'thin',color:{argb:'FF000000'}}};});row.height=22;});ws.autoFilter={from:{row:1,column:1},to:{row:1,column:HEADERS.length}};const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const _pad=n=>String(n).padStart(2,'0');const d=new Date();const fn='timeline_'+(TMState.view==='closed'?'closed_':'')+
d.getFullYear()+_pad(d.getMonth()+1)+_pad(d.getDate())+'_'+
_pad(d.getHours())+_pad(d.getMinutes())+'.xlsx';const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{try{document.body.removeChild(a);URL.revokeObjectURL(url);}catch(_){}},200);if(typeof toast==='function')toast('✓ Export สำเร็จ ('+all.length.toLocaleString('th-TH')+' รายการ)','ok');}catch(e){console.error('tmExportExcel:',e);if(typeof toast==='function')toast('Export ล้มเหลว: '+(e&&(e.message||e)),'err');}finally{if(btn){btn.disabled=false;btn.innerHTML=oldHTML;}}}
function tmMobileFilterOpen(){try{const sh=document.getElementById('tm-m-fsheet');if(!sh)return;['tm-fcust','tm-fwh'].forEach(id=>{const src=document.getElementById(id),dst=document.getElementById(id+'-m');if(src&&dst&&dst.options.length!==src.options.length){dst.innerHTML=src.innerHTML;dst.value=src.value;}else if(src&&dst){dst.value=src.value;}});const df=document.getElementById('tm-date-from'),dt=document.getElementById('tm-date-to');const dfm=document.getElementById('tm-date-from-m'),dtm=document.getElementById('tm-date-to-m');if(df&&dfm)dfm.value=df.value||'';if(dt&&dtm)dtm.value=dt.value||'';sh.hidden=false;document.body.style.overflow='hidden';}catch(e){console.warn('filter open:',e);}}
function tmMobileFilterClose(){const sh=document.getElementById('tm-m-fsheet');if(sh)sh.hidden=true;document.body.style.overflow='';}
function tmMobileFilterClear(){['tm-fcust','tm-fwh','tm-date-from','tm-date-to'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';const em=document.getElementById(id+'-m');if(em)em.value='';});TMState.filters.customer='';TMState.filters.warehouse='';TMState.filters.dateFrom='';TMState.filters.dateTo='';TMState.page=0;TMState._mAppend=false;if(typeof tmReloadPage==='function')tmReloadPage();}
function renderTMMobile(rows){const box=document.getElementById('tm-mobile-list');if(!box)return;rows=rows||(TMState.rows||[]);if(!rows.length){const f=TMState.filters||{};const hasFilter=!!(f.q||f.customer||f.warehouse||f.dateFrom||f.dateTo);box.innerHTML=hasFilter?'<div class="pv-empty" style="padding:34px 18px">🔍 ไม่พบรายการตามเงื่อนไข — ลองล้างตัวกรอง/คำค้น</div>':'<div class="pv-empty" style="padding:40px 18px"><div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">ยังไม่มีข้อมูล</div>'
+'<div style="font-size:12.5px;color:var(--text2);margin-bottom:14px">กด <b>บันทึกข้อมูล</b> เพื่อเพิ่มรายการ</div>'
+'<button class="pv-btn pv-btn-primary ar-bg" onclick="openTMModal()">＋ บันทึกข้อมูล</button></div>';return;}
const canDel=(typeof canDelete==='function')?canDelete():false;box.innerHTML=rows.map(r=>{const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{modeKey:'',modeLabel:'—',statusKind:'ok',latest:'',when:'',closed:false};const _dd=info.lastDate||(tmFmtCell('date',r.date)||'-');const _tt=info.lastTime||'';const dateStr=esc(_dd)+(_tt?' <span class="tmc-time">⏰ '+esc(_tt)+'</span>':'');const cust=(r.customer!=null&&r.customer!=='')?String(r.customer):'-';const bl=(r.bl_no!=null&&r.bl_no!=='')?String(r.bl_no):'-';const entry=(r.customs_entry_no!=null&&r.customs_entry_no!=='')?String(r.customs_entry_no):'-';const wh=(r.warehouse!=null&&r.warehouse!=='')?String(r.warehouse):'-';const by=(r.created_by!=null&&r.created_by!=='')?String(r.created_by):'-';const latest=info.latest?esc(info.latest):'—';const rid=String(r.id);const closed=!!info.closed;const statePill=closed?'<span class="tmc-state tmc-state-close">Close Job</span>':'<span class="tmc-state tmc-state-open">งานเปิด</span>';const dotCls=closed?'tmc-dot-close':(info.statusKind==='warn'?'tmc-dot-warn':'tmc-dot-open');const viewBtn='<button class="pv-btn pv-btn-ghost pv-btn-sm tmc-b-view" data-tm-view="'+rid+'" type="button">👁 ดูรายละเอียด</button>';const editBtn='<button class="pv-btn pv-btn-warn pv-btn-sm tmc-b-edit" onclick="editTM(\''+rid+'\')">✏️ อัปเดต Timeline</button>';const actBtn=closed?'<button class="pv-btn pv-btn-sm tm-btn-reopen tmc-b-act" onclick="tmReopenJob(\''+rid+'\')">↩ เปิดใหม่</button>':'<button class="pv-btn pv-btn-sm tm-btn-done tmc-b-act" onclick="tmCloseJob(\''+rid+'\')">🏳 จบงาน</button>';return'<div class="tmc '+(closed?'tmc-closed':'tmc-open')+'">'
+'<div class="tmc-head"><span class="tmc-date">📅 '+dateStr+'</span>'+statePill+'</div>'
+'<div class="tmc-cust">'+esc(cust)+'</div>'
+'<div class="tmc-grid">'
+'<div class="tmc-c"><span class="tmc-c-k">B/L No.</span><span class="tmc-c-v mono">'+esc(bl)+'</span></div>'
+'<div class="tmc-c"><span class="tmc-c-k">เลขใบขน</span><span class="tmc-c-v mono">'+esc(entry)+'</span></div>'
+'<div class="tmc-c"><span class="tmc-c-k">โกดัง</span><span class="tmc-c-v">'+esc(wh)+'</span></div>'
+'</div>'
+'<div class="tmc-meta">'
+'<span class="tmc-st"><span class="tmc-dot '+dotCls+'"></span>สถานะล่าสุด <b>'+latest+'</b></span>'
+'<span class="tmc-by">👤 '+esc(by)+(function(){const d=(typeof _tmDeptOf==='function')?_tmDeptOf(by):'';return d?' <span class="tm-dept-pill" style="font-size:9.5px;padding:1px 6px;margin-left:4px">'+esc(d)+'</span>':'';})()+'</span>'
+'</div>'
+'<div class="tmc-acts">'+viewBtn+(closed?'':editBtn)+actBtn+'</div>'
+'</div>';}).join('');}
let _tmSearchDeb=null,_tmFilterDeb=null;function tmOnSearch(v){clearTimeout(_tmSearchDeb);const raw=(v||'').trim();if(raw.length===1)return;window._tmSearchReqId=(window._tmSearchReqId||0)+1;const myReq=window._tmSearchReqId;_tmSearchDeb=setTimeout(()=>{if(myReq!==window._tmSearchReqId)return;TMState.filters.q=raw;TMState.page=0;TMState._mAppend=false;tmReloadPage();},500);}
function tmSetFilter(key,v){TMState.filters[key]=(v||'').trim();TMState.page=0;TMState._mAppend=false;clearTimeout(_tmFilterDeb);_tmFilterDeb=setTimeout(()=>tmReloadPage(),_tmIsMobile()?700:400);}
function tmClearDate(){const a=$('tm-date-from');if(a)a.value='';const b=$('tm-date-to');if(b)b.value='';const had=TMState.filters.dateFrom||TMState.filters.dateTo;TMState.filters.dateFrom='';TMState.filters.dateTo='';if(had){TMState.page=0;clearTimeout(_tmFilterDeb);_tmFilterDeb=setTimeout(()=>tmReloadPage(),300);}}
function tmSetPage(p){const st=TMState;const maxP=Math.max(0,Math.ceil(st.total/st.pageSize)-1);p=Math.max(0,Math.min(p,maxP));if(p===st.page)return;st.page=p;tmReloadPage();}
function tmPrev(){tmSetPage(TMState.page-1);}
function tmNext(){tmSetPage(TMState.page+1);}
function tmFirst(){tmSetPage(0);}
function tmLast(){tmSetPage(Math.ceil(TMState.total/TMState.pageSize)-1);}
function tmSetPageSize(s){s=parseInt(s,10)||50;if(![20,50,100,200].includes(s))s=50;TMState.pageSize=s;TMState.page=0;tmReloadPage();}
let _ttlEntries=[];let _ttlHead={status:'',cust:'',hawb:'',wh:''};let _ttlHeadEdited={status:false,cust:false,hawb:false,wh:false};function _ttlAuto(){const g=id=>{const e=$(id);return e?String(e.value||'').trim():'';};return{status:'Import Air',cust:g('tm-f-customer')||'—',hawb:g('tm-f-bl_no')||'—',wh:g('tm-f-warehouse')||'—'};}
function ttlHeadVal(k){return _ttlHeadEdited[k]?_ttlHead[k]:_ttlAuto()[k];}
function ttlResetHead(){_ttlHead={status:'',cust:'',hawb:'',wh:''};_ttlHeadEdited={status:false,cust:false,hawb:false,wh:false};}
async function ttlEditHead(k,label){const cur=ttlHeadVal(k);const v=await mobileInput({title:'แก้ไข: '+label,label:label,value:cur===''?'':cur});if(v===null)return;_ttlHead[k]=String(v).trim();_ttlHeadEdited[k]=true;ttlRender();}
function ttlHeaderText(){const _mk=String(_ttlMode||'').toLowerCase();const _ic=(_mk==='seaim'||_mk==='seaex')?'🚢':'✈️';const _ml=(_mk==='seaim')?'SeaIm':(_mk==='seaex')?'SeaEx':(_mk==='airex')?'AirEx':(_mk==='airim')?'AirIm':'';const _docLbl=(_mk==='seaim'||_mk==='seaex')?'B/L':'HAWB';let s=_ic+' อัปเดตสถานะงาน : '+(ttlHeadVal('status')||'—')+'\n';if(_ml)s+='🧭 โหมด : '+_ml+'\n';s+='ลูกค้า : '+(ttlHeadVal('cust')||'—')+'\n';s+=_docLbl+': '+(ttlHeadVal('hawb')||'—')+'\n';s+='โกดัง : '+(ttlHeadVal('wh')||'—')+'\n';const _qty=(function(){const e=$('tm-f-qty');return e?String(e.value||'').trim():'';})();if(_qty)s+='📦 จำนวนงาน : '+_qty+'\n';s+='⏱ Timeline การดำเนินงาน';return s;}
function ttlBuildNoteText(){let s=ttlHeaderText();let lastDate=null;_ttlEntries.forEach(e=>{if(e.date!==lastDate){s+='\nวันที่ : '+e.date;lastDate=e.date;}
s+='\n• ⏰ '+e.time+'  '+e.text;});return s;}
function ttlCopy(btn){const txt=ttlBuildNoteText();const done=()=>{if(btn){const o=btn.innerHTML;btn.innerHTML='✓ คัดลอกแล้ว';btn.disabled=true;setTimeout(()=>{btn.innerHTML=o;btn.disabled=false;},1600);}
if(typeof toast==='function')toast('คัดลอก Timeline แล้ว','ok');};try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(()=>{_fallbackCopy(txt);done();});}else{_fallbackCopy(txt);done();}}catch(_){_fallbackCopy(txt);done();}}
function ttlSyncNote(){const ta=$('tm-f-note');if(ta)ta.value=_ttlEntries.length?ttlBuildNoteText():'';}
function ttlRender(){const box=$('ttl-preview');if(!box)return;const hrow=(k,label,prefix)=>'<div class="tl-hrow">'
+'<span class="tl-htxt">'+esc(prefix)+esc(ttlHeadVal(k)||'—')+'</span>'
+'<button type="button" class="tl-edit" onclick="ttlEditHead(\''+k+'\',\''+esc(label)+'\')" title="แก้ไข '+esc(label)+'">✏</button>'
+'</div>';const headHtml='<div class="tl-head">'
+hrow('status','สถานะงาน','✈️ อัปเดตสถานะงาน : ')
+hrow('cust','ลูกค้า','ลูกค้า : ')
+hrow('hawb','HAWB','HAWB: ')
+hrow('wh','โกดัง','โกดัง : ')
+'<div class="tl-htitle">⏱ Timeline การดำเนินงาน</div>'
+'</div>';const parts=[headHtml];if(!_ttlEntries.length){parts.push('<div class="tl-empty" style="margin-top:8px">— ยังไม่มีรายการ timeline · พิมพ์ข้อความด้านบนแล้วกด ＋ เพิ่ม —</div>');}else{const total=_ttlEntries.length;const CAP=80;const startIdx=total>CAP?(total-CAP):0;if(startIdx>0){parts.push('<div class="tl-empty" style="margin:6px 0;color:#94a3b8;font-size:10px">— แสดงล่าสุด '+CAP+' รายการ (จากทั้งหมด '+total+') —</div>');}
let lastDate=null;for(let i=startIdx;i<total;i++){const e=_ttlEntries[i];if(e.date!==lastDate){parts.push('<div class="tl-date">วันที่ : <span class="tl-dedit" onclick="ttlEditDate('+i+')" title="คลิกเพื่อแก้ไขวันที่">'+esc(e.date)+' ✎</span></div>');lastDate=e.date;}
parts.push('<div class="tl-row"><span>• ⏰ <span class="tl-dedit" onclick="ttlEditTime('+i+')" title="คลิกเพื่อแก้ไขเวลา">'+esc(e.time)+' ✎</span></span>'
+'<span class="tl-txt">'+esc(e.text)+'</span>'
+'<button type="button" class="tl-editrow" onclick="ttlEditRow('+i+')" title="แก้ไขข้อความบรรทัดนี้">✏</button>'
+'<button type="button" class="tl-del" onclick="ttlDel('+i+')" title="ลบบรรทัดนี้">🗑</button></div>');}}
box.innerHTML=parts.join('');ttlSyncNote();}
function ttlPrefillDateTime(){const d=new Date();const iso=d.getFullYear()+'-'+_pad2(d.getMonth()+1)+'-'+_pad2(d.getDate());const tm=_pad2(d.getHours())+'.'+_pad2(d.getMinutes());const de=$('ttl-date');if(de&&!de.value)de.value=iso;const te=$('ttl-time');if(te&&!te.value)te.value=tm;}
let _ttlMode='';let _ttlTab='ok';const _TTL_OK_BASE=['รับเอกสารจากลูกค้าเรียบร้อย','ตัดภาษีเรียบร้อย','ดำเนินพิธีการตรวจปล่อยศุลกากร','ตรวจปล่อยสินค้าเรียบร้อย','ชำระค่าภาระ / ค่าโกดังเรียบร้อย','รถเข้าคลังเพื่อเตรียมรับสินค้า','เบิกสินค้าออกจากคลังเรียบร้อย อยู่ระหว่างรอรถเข้ารับสินค้า','รถขึ้นสินค้าเรียบร้อย พร้อมตรวจสอบ Check List และยืนยันว่าสภาพสินค้าปกติ','รถขึ้นสินค้าเรียบร้อยและตรวจพบความเสียหายของสินค้า (เช่น บุบ ยุบ ฉีก หรือขาด) ได้ดำเนินการแจ้งทำ DMC เรียบร้อยตามรูปภาพประกอบ','รถออกจากคลังเรียบร้อย พร้อมอัปเดตรูปภาพ','สลักหลังเรียบร้อย','ส่งมอบเอกสารให้เฟรทเรียบร้อยแล้ว','ทางเราชำระค่าโกดังเรียบร้อยแล้ว (เฟรทชำระเฉพาะค่า Storage)','รับดีโอเรียบร้อยแล้ว','เปิดตู้ชักตัวอย่างส่งตรวจ อย. เรียบร้อย','เปิดตู้ตรวจสินค้าเรียบร้อย','ผ่านการตรวจ อย. เรียบร้อย','ผ่านการตรวจด่านเกษตรเรียบร้อย','ผ่านการตรวจด่านป่าไม้เรียบร้อย'];const _TTL_LATE_BASE=['รอเอกสาร D/O','รอคิวชำระค่าภาระ Terminal','รอคิวตรวจปล่อยศุลกากร / ต่อคิวเจ้าหน้าที่','รอตรวจปล่อยกับเจ้าหน้าที่กรมศุลกากร','รอสินค้า Check-in เข้าระบบคลัง','รอสินค้า Break Down (BD) เข้า Location','สินค้ายังไม่พบ Location ภายในคลัง (อยู่ระหว่างรอระบบขึ้นโลเคชั่น)','พบ Location สินค้าเรียบร้อย','ขณะนี้รถยังไม่ถึงสนามบิน หากรถถึงแล้วจะประสานงานกับทีมชิปปิ้งทันที','รอทะเบียนรถจากลูกค้า','รอขึ้นสินค้า','รถต่อคิวเข้ารับสินค้า','ระบบศุลกากรขัดข้อง','พบสินค้าชำรุด และได้แจ้งทำ DMC เรียบร้อยตามรูปภาพ','คลังหนาแน่น ส่งผลให้การดำเนินงานล่าช้า','เอกสารตรวจปล่อยไม่ครบถ้วน','รอการยืนยันค่าแรงงานจากลูกค้า','รอเอกสารเพิ่มเติมจากลูกค้า','รอรผ่านไม้กั้นเพื่อเบิกสินค้า (คลัง BFS)','อยู่ระหว่างรอเฟรทเข้ามารับเอกสารจากชิปปิ้ง','รอยอดเงินโอน','รอทางเฟรทเข้ามาชำระค่าโกดัง','รอรถยกสินค้าออกจากคลังเพื่อขึ้นรถ','รอลูกค้า Confirm ให้เจ้าหน้าที่กรมศุลกากรเปิดตรวจสินค้า','เบอร์รถไม่ตรงกับข้อมูลที่แจ้งไว้','มีการเปลี่ยนรถเข้ารับสินค้า','กรมศุลกากรขอรูปสินค้าเพื่อตรวจ','กรมศุลกากรขอเปิดตรวจสินค้า','เจ้าหน้าที่ขอแตคตาล็อกสินค้า','รอเปิดตู้เพื่อชักตัวอย่างส่งตรวจ อย.','รอรถเข้าดำเนินการชักตัวอย่างส่งตรวจ อย.','รอรถเข้ารับสินค้าเพื่อเปิดตู้ตรวจ','รอผลการตรวจจากด่านเกษตร','รอตัดภาษี','รอสินค้าออกจากคลังเพื่อขึ้นรถ'];const TTL_SETS={'🚢 SeaIm':{ok:["รับเอกสารจากลูกค้าเรียบร้อย","ตรวจปล่อยสินค้าเรียบร้อย","รถเข้าท่าเพื่อเตรียมรับสินค้า","รถออกจากคลังเรียบร้อย","ผ่านการตรวจ อย. เรียบร้อย","X-RAY ตู้ เรียบร้อยแล้ว","ตรวจปล่อยศุลกากรที่ FZ เรียบร้อย","ตัดภาษีเรียบร้อย","ชำระค่าภาระ / ค่าโกดังเรียบร้อย","รถขึ้นสินค้าเรียบร้อย พร้อมตรวจสอบ Check List และยืนยันว่่าสภาพสินค้าปกติตามรูปภาพ","เปิดตู้ชักตัวอย่างส่งตรวจ อย. เรียบร้อย","ผ่านการตรวจด่านเกษตรเรียบร้อย","ลูกค้ายืนยันสินค้าชักตัวอย่างสินค้าเรียบร้อย","ขึ้นปังค่าเบิกพิธีการตรวจปล่อยศุลกากร","นำการ์ดใส่กล่องเรียบร้อย","รถขึ้นสินค้าตรวจพบความเสียหายของสินค้า (เช่น กล่องบุบ ยุบ ฉีก หรือขาด) ตามรูปภาพประกอบ","เปิดตู้ตรวจสินค้าเรียบร้อย","ผ่านการตรวจด่านป่าไม้เรียบร้อย","ตู้เปิดตรวจเรียบร้อย"],late:["รอคิดชำระค่าภาระ","ติดต่อรอตรวจปล่อยกับเจ้าหน้าที่","รถต่อคิวเข้ารับสินค้า","พบสินค้าชำรุด","รอการยืนยันค่าแรงงานจากลูกค้า","รอข้อมูลเลขซีลสินค้าจากลูกค้า","รอการคัดแยกสินค้า","รอเปิดตู้เพื่อตัดตัวอย่างส่งตรวจ อย.","รอผลการตรวจจากด่านเกษตร","รอตู้เปิดตรวจ","รอนำการ์ดใส่กล่อง","รอคิดตรวจปล่อยศุลกากร","รอทะเบียนรถจากลูกค้า","ฝนตก ส่งผลให้การดำเนินงานล่าช้า","คลังหนาแน่น ทำให้การปฏิบัติงานล่าช้า","รอเอกสาร D/O จากสายเรือ","รอรถเข้ารับตู้เพื่อเปิดตรวจ","อยู่ระหว่างดำเนินการผ่าน อย.","รอรถเข้าดำเนินการชักตัวอย่างส่งตรวจ อย.","รอคิว X-RAY","รอตรวจปล่อยศุลกากรที่ FZ","รอตัดภาษี","เจ้าหน้าที่ศุลกากรร้องขอเปิดตรวจสินค้า","รอขึ้นสินค้า","ระบบศุลกากรขัดข้อง","เอกสารตรวจปล่อยไม่ครบถ้วน","รอใบอนุญาตจากหน่วยงานที่เกี่ยวข้อง","อยู่ระหว่างการชักตัวอย่างสินค้า","อยู่ระหว่างดำเนินการผ่านด่านตรวจพืช","รอรถเข้ารับสินค้าเพื่อเปิดตู้ตรวจ","รอลูกค้ายืนยันสินค้าชักตัวอย่างสินค้า","รอตัดค่าภาษี","รอสินค้าออกจากคลังเพื่อขึ้นรถ"]},'✈️ AirIm':{ok:["รับเอกสารจากลูกค้าเรียบร้อย","ตรวจปล่อยสินค้าเรียบร้อย","เบิกสินค้าออกจากคลังเรียบร้อย อยู่ระหว่างรอรถเข้ารับสินค้า","รถออกจากคลังเรียบร้อย พร้อมอัปเดทรูปภาพ","ทางเราชำระค่าโกดังเรียบร้อยแล้ว (เฉพาะค่า Storage)","เปิดตู้ตรวจสินค้าเรียบร้อย","ผ่านการตรวจด่านป่าไม้เรียบร้อย","ตัดภาษีเรียบร้อย","ชำระค่าภาระ / ค่าโกดังเรียบร้อย","รถขึ้นสินค้าเรียบร้อย พร้อมตรวจสอบ Check List และยืนยันว่าสภาพสินค้าปกติ","สลักหลังเรียบร้อย","รับดีโอเรียบร้อยแล้ว","ผ่านการตรวจ อย. เรียบร้อย","ดำเนินพิธีการตรวจปล่อยศุลกากร","รถเข้าคลังเพื่อเตรียมรับสินค้า","รถขึ้นสินค้าเรียบร้อยและตรวจพบความเสียหายของสินค้า (เช่น บุบ ยุบ ฉีก หรือขาด) ได้ดำเนินการแจ้งทำ DMC เรียบร้อยตามรูปภาพประกอบ","ส่งมอบเอกสารให้ไดร์ฟเวอร์เรียบร้อยแล้ว","เปิดตู้ตัดตัวอย่างส่งตรวจ อย. เรียบร้อย","ผ่านการตรวจด่านเกษตรเรียบร้อย"],late:["รอเอกสาร D/O","รอตรวจปล่อยกับเจ้าหน้าที่กรมศุลกากร","สินค้ายังไม่พบ Location ภายในคลัง (อยู่ระหว่างรอระบบขึ้นโลเคชั่น)","รอทะเบียนรถจากลูกค้า","ระบบศุลกากรขัดข้อง","เอกสารตรวจปล่อยไม่ครบถ้วน","รอรถผ่านไม้กั้นเพื่อเบิกสินค้า (คลัง BFS)","รอทางไดร์ฟเวอร์เข้ามาชำระค่าโกดัง","เบอร์ซีลไม่ตรงกับข้อมูลที่แจ้งไว้","กรมศุลกากรขอเปิดตรวจสินค้า","รอเซ็นเจ้าหน้าที่ในการตัดตัวอย่างส่งตรวจ อย.","รอตัดภาษี","รอชำระค่าภาระ Terminal","รอสินค้า Check-in เข้าระบบคลัง","พบ Location สินค้าเรียบร้อย","รอขึ้นสินค้า","พบสินค้าชำรุด และได้แจ้งทำ DMC เรียบร้อยตามรูปภาพ","รอการยืนยันค่าแรงงานจากลูกค้า","อยู่ระหว่างรอไดร์ฟเวอร์เข้ามารับเอกสารจากชิปปิ้ง","รอรถยกสินค้าออกจากคลังเพื่อขึ้นรถ","มีการเปลี่ยนรถเข้ารับสินค้า","เจ้าหน้าที่ขอแดดซีลตู้สินค้า","รอรถเข้ารับสินค้าเพื่อเปิดตู้ตรวจ","รอสินค้าออกจากคลังเพื่อขึ้นรถ","รอดำเนินพิธีการศุลกากร / ติดอั้งเจ้าหน้าที่","รอสินค้า Break Down (BD) เข้า Location","ขณะนี้รถยังไม่ถึงสนามบิน หากรถถึงแล้วจะประสานงานกับทีมชิปปิ้งทันที","รถต่อคิวเข้ารับสินค้า","คลังหนาแน่น ส่งผลให้การดำเนินงานล่าช้า","รอเอกสารเพิ่มเติมจากลูกค้า","รอยอดเงินโอน","รอลูกค้า Confirm ให้เจ้าหน้าที่กรมศุลกากรเปิดตรวจสินค้า","กรมศุลกากรขอสุ่มสินค้าเพื่อตรวจ","รอเปิดตู้เพื่อตัดตัวอย่างส่งตรวจ อย.","รอผลการตรวจจากด่านเกษตร"]},'📤 AirEx':{ok:["รับเอกสารเพื่อตรวจปล่อย","ดำเนินพิธีการศุลกากรเรียบร้อย พร้อมส่งใบกำกับให้คนขับ","เปิดตู้ชักตัวอย่างส่งตรวจ อย. เรียบร้อย","ผ่านการตรวจด่านเกษตรเรียบร้อย","ดำเนินการเดินพิธีการศุลกากร","ชั่งน้ำหนักสินค้า (Gross Weight) และตรวจสอบขนาด (Measurement) ก่อนส่งเข้าคลัง","เปิดตู้ตรวจสินค้าเรียบร้อย","ผ่านการตรวจด่านป่าไม้เรียบร้อย","ได้รับรายละเอียดรถและประสานรถเรียบร้อย","จัดเตรียมและส่งเอกสารให้สายการบิน (AWB / Invoice / Packing List)","ผ่านการตรวจ อย. เรียบร้อย","ตรวจปล่อยศุลกากรที่ FZ เรียบร้อย"],late:["น้ำหนักหรือขนาดสินค้าไม่ตรงกับที่แจ้ง","อยู่ระหว่างดำเนินพิธีการตรวจปล่อยศุลกากร","รอเปิดตู้เพื่อตัดตัวอย่างส่งตรวจ อย.","รอผลการตรวจจากด่านเกษตร","รอสินค้าออกจากคลังเพื่อขึ้นรถ","เอกสารไม่ครบถ้วน หรือข้อมูลไม่ถูกต้อง","คลังหนาแน่น ทำให้การดำเนินงานล่าช้า","รอรถเข้าดำเนินการชักตัวอย่างส่งตรวจ อย.","รอตรวจปล่อยศุลกากรที่ FZ","รอลูกค้าแจ้งข้อมูลทะเบียนรถ","ระบบศุลกากรขัดข้อง","รอรถเข้ารับสินค้าเพื่อเปิดตู้ตรวจ"]},'🛳️ SeaEx':{ok:["รับเอกสารเพื่อตรวจปล่อย","ดำเนินพิธีการศุลกากรเรียบร้อย","ติดต่อคนขับรถเรียบร้อย","ลงสินค้าเรียบร้อย"],late:["อยู่ระหว่างดำเนินพิธีการตรวจปล่อยศุลกากร","รอลูกค้าแจ้งข้อมูลทะเบียนรถ","ระบบศุลกากรขัดข้อง","รอรถเข้ารับสินค้าเพื่อเปิดตู้ตรวจ","เอกสารไม่ครบถ้วน หรือข้อมูลไม่ถูกต้อง","สินค้าต้องREPACK ไหม่","มีใช้งานแรงงานrepack สินค้า"]}};function _ttlSet(){return TTL_SETS[_ttlMode]||{ok:_TTL_OK_BASE,late:_TTL_LATE_BASE};}
function ttlPickMode(m,btn){_ttlMode=m;_ttlTab='ok';try{Array.from(document.querySelectorAll('#tmModal .ttl-mode-btn')).forEach(b=>{b.classList.toggle('active',String(b.getAttribute('data-m')||'')===String(m));});}catch(_){}
try{localStorage.setItem('nj_last_mode',m);}catch(_){}
ttlRenderQuick();}
function _ttlSyncModebar(){}
function ttlChangeMode(){_ttlMode='';_ttlTab='ok';try{Array.from(document.querySelectorAll('#tmModal .ttl-mode-btn')).forEach(b=>b.classList.remove('active'));}catch(_){}
try{const md=document.getElementById('tmModal');if(md&&md.classList.contains('tm-edit-mode'))md.classList.remove('tm-edit-mode');}catch(_){}
if(typeof ttlRenderQuick==='function')ttlRenderQuick();}
function ttlSwitchTab(tab){_ttlTab=(tab==='late')?'late':'ok';ttlRenderQuick();}
function _ttlPicked(){const inp=$('ttl-input');const cur=inp?String(inp.value||'').trim():'';return cur?cur.split(/\s*\+\s*/).filter(Boolean):[];}
function _ttlIcon(t){const s=String(t||'');if(/เอกสาร|D\/O|ใบกำกับ|AWB|Invoice|Packing/i.test(s))return'📄';if(/รถออก|ออกจากคลัง|ออกจากท่า/.test(s))return'🚛';if(/รถเข้า|รถขึ้น|รถต่อคิว|รถยก|เปลี่ยนรถ|ทะเบียนรถ|เบอร์รถ|ประสานรถ|รายละเอียดรถ|คนขับ|ไดร์ฟเวอร์/.test(s))return'🚚';if(/อย\./.test(s))return'🧪';if(/X-?RAY|เอกซเรย์/i.test(s))return'📡';if(/ศุลกากร|ตรวจปล่อย|พิธีการ|FZ|ตัดภาษี|ภาษี/.test(s))return'🏛️';if(/ชำระ|ค่าภาระ|ค่าโกดัง|เงินโอน|ยอดเงิน|Storage/i.test(s))return'💰';if(/Check List|ตรวจสอบ|ยืนยัน|Confirm/i.test(s))return'📋';if(/เกษตร|ป่าไม้|ด่าน|พืช/.test(s))return'🌿';if(/เสียหาย|ชำรุด|DMC|บุบ|ยุบ|ฉีก|ขาด|ปัญหา|ขัดข้อง/.test(s))return'⚠️';if(/Location|คลัง|Break Down|BD|Check-in|คัดแยก/i.test(s))return'🏢';if(/เปิดตู้|ตู้|ชักตัวอย่าง|ตัดตัวอย่าง|สุ่ม|ซีล/.test(s))return'🔍';if(/การ์ด|กล่อง|แพ็|REPACK|repack|น้ำหนัก|ขนาด|Gross|Measurement/i.test(s))return'📦';if(/ลูกค้า|แรงงาน|เจ้าหน้าที่/.test(s))return'👤';if(/รอ|คิว|ระหว่าง|ติด/.test(s))return'⏳';return'•';}
function ttlRenderQuick(){const box=$('ttl-quick');if(typeof _ttlSyncModebar==='function')_ttlSyncModebar();if(!box)return;if(!_ttlMode){box.style.display='none';box.innerHTML='';return;}
const set=_ttlSet();const picked=_ttlPicked();const arr=(_ttlTab==='late')?set.late:set.ok;const kind=(_ttlTab==='late')?1:0;const cls=(_ttlTab==='late')?'late':'ok';const okN=set.ok.filter(t=>picked.indexOf(t)>=0).length;const lateN=set.late.filter(t=>picked.indexOf(t)>=0).length;const list=arr.map((t,i)=>{const on=picked.indexOf(t)>=0;return'<button type="button" class="ttl-q-btn '+cls+(on?' picked':'')+'" onclick="ttlQuickPick('+kind+','+i+')" title="'+esc(t)+'">'
+'<span class="ttl-q-ic">'+(on?'✓':_ttlIcon(t))+'</span>'
+'<span class="ttl-q-tx">'+esc(t)+'</span></button>';}).join('');box.style.display='';box.innerHTML='<div class="ttl-q-tabs">'
+'<button type="button" class="ttl-q-tab ok'+(_ttlTab==='ok'?' active':'')+'" data-ttl-tab="ok">✅ สถานะปกติ'+(okN?' <b>'+okN+'</b>':'')+'</button>'
+'<button type="button" class="ttl-q-tab late'+(_ttlTab==='late'?' active':'')+'" data-ttl-tab="late">⚠️ ล่าช้า/ปัญหา'+(lateN?' <b>'+lateN+'</b>':'')+'</button>'
+'<span class="ttl-q-mode">'+esc(_ttlMode)+'</span>'
+'<button type="button" class="ttl-q-chmode" onclick="ttlChangeMode()" title="เปลี่ยนโหมด">🔄 เปลี่ยนโหมด</button>'
+'</div>'
+'<div class="ttl-q-list">'+list+'</div>'
+(picked.length?'<div class="ttl-q-sel">เลือกแล้ว <b>'+picked.length+'</b> รายการ → '+esc(picked.join(' + '))
+' <button type="button" class="ttl-q-clear" onclick="ttlClearPick()" title="ล้างที่เลือก">✕ ล้าง</button></div>':'');}
(function(){if(window.__tmQTabDelegateFinalDone)return;window.__tmQTabDelegateFinalDone=true;let lastTap=0;function getBtn(e){return e.target&&e.target.closest&&e.target.closest('#tmModal .ttl-q-tab');}
function run(btn,e){if(!btn)return;const now=Date.now();if(now-lastTap<180)return;lastTap=now;const tab=btn.dataset&&btn.dataset.ttlTab;if(tab!=='ok'&&tab!=='late')return;if(typeof ttlSwitchTab==='function'){ttlSwitchTab(tab);}
if(e.cancelable){e.preventDefault();}
e.stopPropagation();}
document.addEventListener('pointerdown',function(e){run(getBtn(e),e);},true);document.addEventListener('click',function(e){run(getBtn(e),e);},true);})();(function(){if(window.__tmViewDelegate)return;window.__tmViewDelegate=true;var lastViewFire=0;document.addEventListener('click',function(e){var btn=e.target&&e.target.closest&&e.target.closest('[data-tm-view]');if(!btn)return;var now=Date.now();if(now-lastViewFire<250)return;lastViewFire=now;if(e.cancelable){e.preventDefault();}
e.stopPropagation();var id=btn.dataset&&btn.dataset.tmView;if(!id)id=btn.getAttribute('data-tm-view');if(id&&typeof tmViewDetail==='function'){try{tmViewDetail(String(id));}catch(_){}}},{capture:true,passive:false});})();function ttlQuickPick(kind,idx){const set=_ttlSet();const arr=kind===0?set.ok:set.late;const t=arr[idx];if(t==null)return;const inp=$('ttl-input');if(!inp)return;const cur=String(inp.value||'').trim();const parts=cur?cur.split(/\s*\+\s*/).filter(Boolean):[];if(parts.indexOf(t)>=0){inp.value=parts.filter(x=>x!==t).join(' + ');}else{parts.push(t);inp.value=parts.join(' + ');}
ttlRenderQuick();}
function ttlClearPick(){const inp=$('ttl-input');if(inp)inp.value='';ttlRenderQuick();}
function ttlAdd(){const inp=$('ttl-input');if(!inp)return;const txt=String(inp.value||'').trim();if(!txt){inp.focus();return;}
const d=new Date();const nowIso=d.getFullYear()+'-'+_pad2(d.getMonth()+1)+'-'+_pad2(d.getDate());const nowT=_pad2(d.getHours())+'.'+_pad2(d.getMinutes());let iso='';const de=$('ttl-date');if(de)iso=String(de.value||'').trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))iso=nowIso;const ymd=iso.split('-');const date=ymd[2]+'/'+ymd[1]+'/'+ymd[0];let time='';const te=$('ttl-time');if(te)time=String(te.value||'').trim().replace(/[:：]/g,'.');const mt=time.match(/^(\d{1,2})[.](\d{1,2})$/);if(mt){let hh=Math.min(23,parseInt(mt[1],10)),mm=Math.min(59,parseInt(mt[2],10));time=_pad2(hh)+'.'+_pad2(mm);}else{time=nowT;}
_ttlEntries.push({date,time,text:txt});inp.value='';if(te)te.value='';_ttlMode='';_ttlTab='ok';const mw=$('ttl-modes');if(mw)Array.from(mw.querySelectorAll('.ttl-mode-btn')).forEach(b=>b.classList.remove('active'));ttlRender();if(typeof ttlRenderQuick==='function')ttlRenderQuick();inp.focus();const box=$('ttl-preview');if(box)box.scrollTop=box.scrollHeight;}
function ttlDel(i){if(i<0||i>=_ttlEntries.length)return;_ttlEntries.splice(i,1);ttlRender();}
async function ttlEditRow(i){if(i<0||i>=_ttlEntries.length)return;const e=_ttlEntries[i];const v=await mobileInput({title:'แก้ไขข้อความรายการนี้',label:e.date+' ⏰ '+e.time,value:e.text});if(v===null)return;const t=String(v).trim();if(!t){if(await mobileConfirm({title:'ข้อความว่าง',message:'ต้องการลบบรรทัดนี้?',confirmText:'ลบ',danger:true}))ttlDel(i);return;}
_ttlEntries[i].text=t;ttlRender();}
async function ttlEditDate(i){if(i<0||i>=_ttlEntries.length)return;const e=_ttlEntries[i];const v=await mobileInput({title:'แก้ไขวันที่',label:'รูปแบบ วว/ดด/ปปปป เช่น 19/05/2026',value:e.date,placeholder:'19/05/2026'});if(v===null)return;let s=String(v).trim();if(!s){return;}
const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(iso){s=_pad2(+iso[3])+'/'+_pad2(+iso[2])+'/'+iso[1];}
else{const dm=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(dm){let y=dm[3];if(y.length===2)y='20'+y;s=_pad2(+dm[1])+'/'+_pad2(+dm[2])+'/'+y;}}
_ttlEntries[i].date=s;ttlRender();}
async function ttlEditTime(i){if(i<0||i>=_ttlEntries.length)return;const e=_ttlEntries[i];const v=await mobileInput({title:'แก้ไขเวลา',label:'รูปแบบ HH.MM เช่น 13.05',value:e.time,placeholder:'13.05'});if(v===null)return;let s=String(v).trim().replace(/[:：]/g,'.');const mt=s.match(/^(\d{1,2})[.](\d{1,2})$/);if(mt){let hh=Math.min(23,parseInt(mt[1],10)),mm=Math.min(59,parseInt(mt[2],10));_ttlEntries[i].time=_pad2(hh)+'.'+_pad2(mm);ttlRender();}else{await mobileAlert('รูปแบบเวลาไม่ถูกต้อง\nกรุณากรอกแบบ HH.MM เช่น 13.05','รูปแบบไม่ถูกต้อง');}}
function ttlReset(){_ttlEntries=[];ttlResetHead();ttlRender();ttlPrefillDateTime();_ttlMode='';_ttlTab='ok';const w=$('ttl-modes');if(w)Array.from(w.querySelectorAll('.ttl-mode-btn')).forEach(b=>b.classList.remove('active'));if(typeof ttlRenderQuick==='function')ttlRenderQuick();}
function ttlParseFromText(txt){_ttlEntries=[];ttlResetHead();if(!txt)return;const lines=String(txt).split(/\r?\n/);let curDate='';lines.forEach(ln=>{let m;if((m=ln.match(/^(?:✈️|📦)\s*อัปเดตสถานะงาน\s*:\s*(.*)$/))){const v=m[1].trim();if(v&&v!=='TIMELINE'&&v!=='—'){_ttlHead.status=v;_ttlHeadEdited.status=true;}
return;}
if((m=ln.match(/^ลูกค้า\s*:\s*(.*)$/))){const v=m[1].trim();if(v&&v!=='—'){_ttlHead.cust=v;_ttlHeadEdited.cust=true;}return;}
if((m=ln.match(/^HAWB\s*:\s*(.*)$/i))){const v=m[1].trim();if(v&&v!=='—'){_ttlHead.hawb=v;_ttlHeadEdited.hawb=true;}return;}
if((m=ln.match(/^B\/L No\.\s*:\s*(.*)$/i))){const v=m[1].trim();if(v&&v!=='—'){_ttlHead.hawb=v;_ttlHeadEdited.hawb=true;}return;}
if((m=ln.match(/^โกดัง\s*:\s*(.*)$/))){const v=m[1].trim();if(v&&v!=='—'){_ttlHead.wh=v;_ttlHeadEdited.wh=true;}return;}
if(/^เลขใบขน\s*:/.test(ln)){return;}
const md=ln.match(/^วันที่\s*:\s*(.+)$/);if(md){curDate=md[1].trim();return;}
const mr=ln.match(/^•\s*⏰\s*(\S+)\s+(.+)$/);if(mr){_ttlEntries.push({date:curDate||'—',time:mr[1].trim(),text:mr[2].trim()});}});}
let _tmEditId=null;function openTMModal(){_tmEditId=null;$('tm-modal-title').textContent='บันทึกข้อมูล TIMELINE';clearTMForm();requestAnimationFrame(()=>{$('tmModal').classList.add('show');try{$('tmModal').classList.remove('tm-edit-mode');}catch(_){}});const _td=new Date();const _today=_pad2(_td.getDate())+'/'+_pad2(_td.getMonth()+1)+'/'+_td.getFullYear();_setAuto('tm-f-date',_today);{const tEl=$('tm-d-time');if(tEl)tEl.textContent=_pad2(_td.getHours())+':'+_pad2(_td.getMinutes())+' น.';}
if(typeof tmFillDateShow==='function')tmFillDateShow();setTimeout(()=>{const e=$('tm-f-customer');if(e)e.focus();},60);ttlReset();try{const lm=localStorage.getItem('nj_last_mode');if(lm){const btn=document.querySelector('#tmModal .ttl-mode-btn[data-m="'+lm.replace(/"/g,'\\"')+'"]');if(btn)ttlPickMode(lm,btn);}}catch(_){}}
function closeTMModal(){const m=$('tmModal');if(!m)return;m.classList.remove('show');m.classList.remove('tm-fullscreen');m.classList.remove('tm-edit-mode');_tmEditId=null;try{const pv=document.getElementById('ttl-preview');if(pv)pv.innerHTML='';_ttlEntries=[];}catch(_){}}
function tmToggleFull(btn){const md=$('tmModal');if(!md)return;const on=md.classList.toggle('tm-fullscreen');if(btn){btn.textContent=on?'🗗':'⛶';btn.title=on?'ย่อกลับขนาดเดิม':'ขยายเต็มจอ';}}
function clearTMForm(){const idEl=$('tm-f-id');if(idEl)idEl.value='';TM_COLS.forEach(f=>{const e=$('tm-f-'+f);if(e)e.value='';});{const q=$('tm-f-qty');if(q)q.value='';}
if(typeof _setAuto==='function'){_setAuto('tm-f-date','');}
{const tEl=$('tm-d-time');if(tEl)tEl.textContent='—';}
{const ds=$('tm-f-date-show');if(ds)ds.value='';const dp=$('tm-f-date-pick');if(dp)dp.value='';}
if(typeof _ttlEntries!=='undefined'){_ttlEntries=[];}
if(typeof ttlResetHead==='function')ttlResetHead();}
function editTM(id){const r=TMState.rows.find(x=>String(x.id)===String(id));if(!r){toast('ไม่พบรายการ','err');return;}
if(typeof tmDeriveInfo==='function'){const _i=tmDeriveInfo(r);if(_i&&_i.closed){toast('🔒 งานนี้ปิดแล้ว — กด "↩ เปิดใหม่" ก่อนจึงจะแก้ไขได้','warn');return;}}
if(typeof tlIsUserScope==='function'&&tlIsUserScope()){const me=tlMyUsername();const owner=String(r.created_by||'').trim();if(me&&owner&&owner!==me){toast('🚫 แก้ไขได้เฉพาะรายการของตัวเอง','err');return;}}
_tmEditId=r.id;$('tm-modal-title').textContent='แก้ไขข้อมูล TIMELINE';clearTMForm();const idEl=$('tm-f-id');if(idEl)idEl.value=r.id;TM_COLS.forEach(f=>{const e=$('tm-f-'+f);if(!e)return;e.value=r[f]==null?'':String(r[f]);});if(typeof _setAuto==='function'){_setAuto('tm-f-date',r.date==null?'':String(r.date));}
{const ct=r.created_at?new Date(r.created_at):null;const tEl=$('tm-d-time');if(tEl)tEl.textContent=(ct&&!isNaN(ct))?(_pad2(ct.getHours())+':'+_pad2(ct.getMinutes())+' น.'):'—';}
if(typeof tmFillDateShow==='function')tmFillDateShow();ttlParseFromText(r.note==null?'':String(r.note));try{const _qEl=$('tm-f-qty');if(_qEl){const _nq=String(r.note||'').match(/📦\s*จำนวนงาน\s*:\s*([^\n\r]+)/);_qEl.value=_nq?_nq[1].trim():'';}}catch(_){}
ttlRender();ttlPrefillDateTime();try{const _n=String(r.note||'');let _label='';const _mm=_n.match(/🧭\s*โหมด\s*:\s*(SeaIm|SeaEx|AirIm|AirEx)/i);if(_mm){const _ml=_mm[1].toLowerCase();_label=(_ml==='seaim')?'🚢 SeaIm':(_ml==='airim')?'✈️ AirIm':(_ml==='airex')?'📤 AirEx':(_ml==='seaex')?'🛳️ SeaEx':'';}
if(!_label){const _info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):null;const _mk=_info&&_info.modeKey?String(_info.modeKey):'';_label=(_mk==='seaim')?'🚢 SeaIm':(_mk==='airim')?'✈️ AirIm':(_mk==='airex')?'📤 AirEx':(_mk==='seaex')?'🛳️ SeaEx':'';}
if(!_label)_label='✈️ AirIm';const _btn=document.querySelector('#tmModal .ttl-mode-btn[data-m="'+_label.replace(/"/g,'\\"')+'"]');if(_btn)ttlPickMode(_label,_btn);else{_ttlMode=_label;if(typeof ttlRenderQuick==='function')ttlRenderQuick();}}catch(_){}
try{$('tmModal').classList.add('tm-edit-mode');}catch(_){}
$('tmModal').classList.add('show');}
async function saveTMRecord(){const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const btn=$('tm-save-btn');if(btn)btn.disabled=true;const payload={};TM_COLS.forEach(f=>{const e=$('tm-f-'+f);const _v=e?e.value:'';payload[f]=(_v===''||_v==null)?null:_v;});if(!payload.customer&&!payload.bl_no&&!payload.customs_entry_no&&!payload.note){if(btn)btn.disabled=false;toast('กรุณากรอกข้อมูลอย่างน้อย ชื่อลูกค้า / B/L No. / เลขใบขน','warn');return;}
const _cu=(typeof getCurrentUser==='function')?getCurrentUser():null;const u=(_cu&&_cu.username)?String(_cu.username):'system';try{if(_tmEditId){delete payload.created_by;payload.updated_at=new Date().toISOString();let uq=sb.from(TM_TBL).update(payload).eq('id',_tmEditId);if(typeof tlIsUserScope==='function'&&tlIsUserScope()){const me=tlMyUsername();if(me)uq=uq.eq('created_by',me);}
const{error}=await uq;if(error)throw error;toast('✓ แก้ไขข้อมูลเรียบร้อย','ok');}else{payload.created_by=u;payload.created_at=new Date().toISOString();payload.updated_at=new Date().toISOString();const{error}=await sb.from(TM_TBL).insert([payload]);if(error)throw error;toast('✓ บันทึกข้อมูลเรียบร้อย','ok');}
closeTMModal();await tmReload(true);}catch(e){console.error('saveTMRecord:',e);if(tmIsMissingTableErr(e)){tmShowTableSQL('tm-save-status');toast('ยังไม่มีตาราง timeline_records — ดู Console','err');}
else if(tmIsPermissionErr(e)){tmShowRLSFix('tm-save-status');toast('บันทึกไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401) ดูวิธีแก้ในกล่องสถานะ','err');}
else toast('บันทึกล้มเหลว: '+(e.message||e),'err');}finally{if(btn)btn.disabled=false;}}
async function deleteTM(id){if(typeof canDelete==='function'&&!canDelete()){toast('🚫 สิทธิ์ USER ไม่สามารถลบข้อมูลได้','err');return;}
if(typeof tlIsUserScope==='function'&&tlIsUserScope()){toast('🚫 สิทธิ์ USER ไม่สามารถลบข้อมูลได้','err');return;}
if(!(await mobileConfirm({title:'ลบรายการ?',message:'ยืนยันลบรายการนี้ออกจากระบบถาวร',confirmText:'ลบ',cancelText:'ยกเลิก',danger:true})))return;const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
try{const{error}=await sb.from(TM_TBL).delete().eq('id',id);if(error)throw error;toast('ลบรายการแล้ว','ok');tmInvalidateCounts();await tmReloadPage();}catch(e){console.error('deleteTM:',e);if(typeof tmIsPermissionErr==='function'&&tmIsPermissionErr(e)){tmShowRLSFix('tm-save-status');toast('ลบไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401) ดูวิธีแก้ในกล่องสถานะ','err');}else{toast('ลบล้มเหลว: '+(e.message||e),'err');}}}
async function tmImport(input){if(input&&input.value!==undefined)input.value='';toast('Import Excel ใช้ที่ระบบหลัก (billing.html)','warn');}
function _tmRowById(id){const sid=String(id||'');const pools=[...(TMState.rows||[]),...(TMState.filtered||[]),...(window._tmMobileRows||[]),...(window._tmRowsCache||[])];const seen=new Set();return pools.find(x=>{if(!x)return false;const xid=String(x.id||'');if(seen.has(xid))return false;seen.add(xid);return xid===sid;})||null;}
function _tmCanTouch(r){if(typeof tlIsUserScope!=='function'||!tlIsUserScope())return true;const me=tlMyUsername();const owner=String((r&&r.created_by)||'').trim();return!owner||!me||owner===me;}
function tmSwitchView(view){view=(view==='closed')?'closed':'open';try{if(currentPage!=='tm'){currentPage='tm';document.querySelectorAll('.pv').forEach(p=>p.classList.remove('active'));const pgT=document.getElementById('page-tm');if(pgT)pgT.classList.add('active');const nu=document.getElementById('nav-users');if(nu)nu.classList.remove('active');}}catch(_){}
if(TMState.view===view){}
TMState.view=view;TMState.page=0;TMState._mAppend=false;try{const nT=$('nav-tm'),nC=$('nav-closed');if(nT)nT.classList.toggle('active',view==='open');if(nC)nC.classList.toggle('active',view==='closed');const nm=$('tb-page-name');if(nm)nm.textContent=(view==='closed')?'CLOSE JOB':'TIMELINE';const bg=$('tb-page-badge');if(bg){bg.textContent=(view==='closed')?'CLOSED':'TM';}
const ttl=document.querySelector('#page-tm .pv-title');if(ttl)ttl.textContent=(view==='closed')?'🔴 CLOSE JOB — งานที่ปิดแล้ว':'🕒 TIMELINE';}catch(_){}
try{if(window.matchMedia&&window.matchMedia('(max-width:1023px)').matches&&typeof tlToggleSidebar==='function')tlToggleSidebar(false);}catch(_){}
if(typeof tmInvalidateCounts==='function')tmInvalidateCounts();if(typeof tmReloadPage==='function')tmReloadPage();}
async function tmLoadClosedCount(){if(!window.__tmCloseLazyAllowCount&&(typeof TMState==='undefined'||(TMState.view||'open')!=='closed'))return;try{const sb=initSupabase();if(!sb)return;let q=sb.from(TM_TBL).select('id',{count:'exact',head:true}).ilike('note','%'+TM_CLOSE_TOKEN+'%');if(typeof tmApplyScope==='function')q=tmApplyScope(q);const{count,error}=await q;if(error)return;TMState.closedCount=count||0;const b=$('tm-closed-count');if(b)b.textContent=(count||0).toLocaleString('th-TH');const o=$('tm-open-count');if(o){const openN=Math.max(0,(TMState.total||0)-(TMState.closedCount||0));o.textContent=openN.toLocaleString('th-TH');}}catch(_){}}
async function tmCloseJob(id){const r=_tmRowById(id);if(!r){toast('ไม่พบรายการ','err');return;}
if(!_tmCanTouch(r)){toast('🚫 จบได้เฉพาะงานของตัวเอง','err');return;}
const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{closed:false};if(info.closed){toast('งานนี้ถูกปิดแล้ว','warn');return;}
if(!(await mobileConfirm({title:'จบงาน?',message:'ยืนยัน "จบงาน" รายการนี้?\nจะย้ายไปเมนู 🔴 CLOSE JOB และไม่นับอายุงานต่อ',confirmText:'จบงาน',cancelText:'ยกเลิก'})))return;const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const me=(typeof getCurrentUser==='function'&&getCurrentUser())?(getCurrentUser().username||'system'):'system';const oldNote=(r.note!=null)?String(r.note):'';const marker=TM_CLOSE_TOKEN+' finishedAt='+new Date().toISOString()+' finishedBy='+me;const newNote=(oldNote?oldNote.replace(/\s+$/,'')+'\n':'')+marker;try{let uq=sb.from(TM_TBL).update({note:newNote,updated_at:new Date().toISOString()}).eq('id',id);if(typeof tlIsUserScope==='function'&&tlIsUserScope()){const mu=tlMyUsername();if(mu)uq=uq.eq('created_by',mu);}
const{error}=await uq;if(error)throw error;toast('✅ จบงานแล้ว — ย้ายไป CLOSE JOB','ok');if(typeof tmInvalidateCounts==='function')tmInvalidateCounts();await tmReloadPage();tmLoadClosedCount();}catch(e){console.error('tmCloseJob:',e);if(typeof tmIsPermissionErr==='function'&&tmIsPermissionErr(e)){tmShowRLSFix('tm-save-status');toast('จบงานไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401)','err');}else{toast('จบงานไม่สำเร็จ: '+(e.message||e),'err');}}}
async function tmReopenJob(id){const r=_tmRowById(id);if(!r){toast('ไม่พบรายการ','err');return;}
if(!_tmCanTouch(r)){toast('🚫 ทำได้เฉพาะงานของตัวเอง','err');return;}
const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{closed:false};if(!info.closed){toast('งานนี้ยังไม่ได้ปิด','warn');return;}
if(!(await mobileConfirm({title:'เปิดงานใหม่?',message:'ยืนยัน "เปิดงานใหม่" รายการนี้?\nจะยกเลิกการปิดงาน และย้ายกลับไปหน้า 🕒 TIMELINE',confirmText:'เปิดงานใหม่',cancelText:'ยกเลิก'})))return;const sb=initSupabase();if(!sb){toast('Supabase ไม่พร้อม','err');return;}
const oldNote=(r.note!=null)?String(r.note):'';const newNote=oldNote.split(/\r?\n/).filter(l=>l.indexOf(TM_CLOSE_TOKEN)<0).join('\n').replace(/\s+$/,'');try{let uq=sb.from(TM_TBL).update({note:newNote,updated_at:new Date().toISOString()}).eq('id',id);if(typeof tlIsUserScope==='function'&&tlIsUserScope()){const mu=tlMyUsername();if(mu)uq=uq.eq('created_by',mu);}
const{error}=await uq;if(error)throw error;toast('↩ เปิดงานใหม่แล้ว — ย้ายกลับไป TIMELINE','ok');if(typeof tmInvalidateCounts==='function')tmInvalidateCounts();if(typeof tmSwitchView==='function'){tmSwitchView('open');}
else{await tmReloadPage();}
if(typeof tmLoadClosedCount==='function')tmLoadClosedCount();}catch(e){console.error('tmReopenJob:',e);if(typeof tmIsPermissionErr==='function'&&tmIsPermissionErr(e)){tmShowRLSFix('tm-save-status');toast('เปิดงานใหม่ไม่ได้ — ฐานข้อมูลปิดสิทธิ์เขียน (RLS/401)','err');}else{toast('เปิดงานใหม่ไม่สำเร็จ: '+(e.message||e),'err');}}}
function tmRowMenu(btn,id){let m=document.getElementById('tmRowMenu');if(m&&m.__forId===id&&m.style.display==='block'){m.style.display='none';return;}
if(!m){m=document.createElement('div');m.id='tmRowMenu';m.className='tm-rowmenu';document.body.appendChild(m);document.addEventListener('click',function(ev){const mm=document.getElementById('tmRowMenu');if(mm&&mm.style.display==='block'&&!mm.contains(ev.target)&&!(ev.target.classList&&ev.target.classList.contains('tm-btn-more'))){mm.style.display='none';}},true);}
const canDel=(typeof canDelete==='function')?canDelete():false;m.__forId=id;m.innerHTML='<button class="tm-rowmenu-item" onclick="document.getElementById(\'tmRowMenu\').style.display=\'none\';tmViewDetail(\''+id+'\')">🔎 ดูรายละเอียด</button>'
+(canDel?'<button class="tm-rowmenu-item danger" onclick="document.getElementById(\'tmRowMenu\').style.display=\'none\';deleteTM(\''+id+'\')">🗑 ลบงาน</button>':'<div class="tm-rowmenu-note">ลบงาน — เฉพาะ Admin</div>');m.style.display='block';const rc=btn.getBoundingClientRect();const mw=188;let left=rc.right-mw;if(left<8)left=8;let top=rc.bottom+6;if(top+120>window.innerHeight)top=rc.top-6-110;m.style.left=left+'px';m.style.top=top+'px';}
function tmViewDetail(id){const r=_tmRowById(id);if(!r){toast('ไม่พบรายการ','err');return;}
const info=(typeof tmDeriveInfo==='function')?tmDeriveInfo(r):{};let m=document.getElementById('tmDetailModal');if(!m){m=document.createElement('div');m.id='tmDetailModal';m.className='paste-modal';m.style.display='none';m.style.zIndex='2000';m.setAttribute('onclick',"if(event.target===this)this.style.display='none'");document.body.appendChild(m);}
const row=(k,v)=>v?('<div class="tm-dv-row"><span class="tm-dv-k">'+esc(k)+'</span><span class="tm-dv-v">'+esc(v)+'</span></div>'):'';const noteClean=String(r.note||'').split(/\r?\n/).filter(l=>l.indexOf(TM_CLOSE_TOKEN)<0).join('\n');m.innerHTML='<div class="paste-modal-content" style="max-width:560px">'
+'<div class="paste-modal-head"><h3>🔎 รายละเอียดงาน</h3>'
+'<button class="paste-modal-close" onclick="document.getElementById(\'tmDetailModal\').style.display=\'none\'">✕</button></div>'
+'<div class="paste-modal-body">'
+row('วันที่',tmFmtCell('date',r.date))
+row('ลูกค้า',r.customer)
+row('B/L / HAWB',r.bl_no)
+row('เลขใบขน',r.customs_entry_no)
+row('โกดัง',r.warehouse)
+row('โหมด',info.modeLabel&&info.modeLabel!=='—'?info.modeLabel:'')
+row('ผู้บันทึก',r.created_by)
+(info.closed?row('สถานะ','🔴 ปิดงานแล้ว'+(info.finishedBy?(' โดย '+info.finishedBy):'')):row('สถานะ','🟢 กำลังดำเนินการ'))
+'<div class="tm-dv-k" style="margin:10px 0 4px">หมายเหตุ / Timeline</div>'
+'<pre style="margin:0;padding:11px 13px;background:rgba(13,16,24,.6);border:1px solid var(--border);border-radius:8px;font-family:\'IBM Plex Sans Thai\',sans-serif;font-size:12px;color:#dfe4ee;white-space:pre-wrap;word-break:break-word;max-height:300px;overflow:auto">'
+(noteClean?esc(noteClean):'<span style="color:var(--text3)">— ไม่มีหมายเหตุ —</span>')+'</pre>'
+'</div>'
+'<div class="paste-modal-actions">'
+'<button class="pv-btn pv-btn-ghost" onclick="document.getElementById(\'tmDetailModal\').style.display=\'none\'">ปิด</button>'
+(info.closed?'<button class="pv-btn pv-btn-primary ar-bg" onclick="document.getElementById(\'tmDetailModal\').style.display=\'none\';tmReopenJob(\''+String(r.id)+'\')">↩ เปิดงานใหม่</button>':'<button class="pv-btn pv-btn-primary ar-bg" onclick="document.getElementById(\'tmDetailModal\').style.display=\'none\';editTM(\''+String(r.id)+'\')">✏️ แก้ไขงานนี้</button>')
+'</div></div>';m.style.display='flex';}
async function tmFetchAllFiltered(){const sb=initSupabase();if(!sb)throw new Error('Supabase ไม่พร้อม');const out=[];let off=0;const CK=1000;while(off<500000){let q=sb.from(TM_TBL).select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(off,off+CK-1);q=tmApplyFilters(q);const{data,error}=await q;if(error)throw error;if(!data||!data.length)break;data.forEach(r=>out.push(r));if(data.length<CK)break;off+=CK;await new Promise(r=>setTimeout(r,0));}
return out;}
async function tmFetchAll(){const sb=initSupabase();if(!sb)throw new Error('Supabase ไม่พร้อม');const out=[];let off=0;const CK=1000;while(off<500000){const{data,error}=await sb.from(TM_TBL).select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(off,off+CK-1);if(error)throw error;if(!data||!data.length)break;data.forEach(r=>out.push(r));if(data.length<CK)break;off+=CK;await new Promise(r=>setTimeout(r,0));}
return out;}
async function exportTM(mode){toast('Export Excel ใช้ที่ระบบหลัก (billing.html)','warn');}
document.addEventListener('DOMContentLoaded',async()=>{if(window.__arBooted)return;window.__arBooted=true;try{if(location.protocol==='file:'){console.warn('ℹ เปิดไฟล์แบบ file:// — บราวเซอร์อาจแยก localStorage รายไฟล์ ทำให้ session จาก billing.html ไม่ถูกแชร์ และบางเครื่องเขียน DB ไม่ได้ · แนะนำเปิดผ่านเว็บเซิร์ฟเวอร์ (http://) หรือเปิด billing.html กับ timeline.html จากที่อยู่เดียวกัน');}
setConn('','connecting…');try{document.body.classList.add('auth-locked');}catch(_){}
initSupabase();if(!supa){setConn('err','no client');toast('Supabase client ไม่พร้อม — กรุณาลองใหม่','err');try{document.body.classList.add('auth-locked');}catch(_){}
try{if(typeof showLoginModal==='function')showLoginModal();}catch(_){}
return;}
try{await ensureSeedUser();}catch(e){console.warn('seed skipped:',e&&e.message);}
try{_currentUser=null;}catch(_){}
try{localStorage.removeItem(NJ_KEY);}catch(_){}
try{document.body.classList.add('auth-locked');}catch(_){}
try{applyRoleUI();}catch(_){}
try{if(typeof showLoginModal==='function')showLoginModal();}catch(_){}
return;}catch(e){console.error('boot error:',e);try{document.body.classList.add('auth-locked');}catch(_){}
try{if(typeof showLoginModal==='function')showLoginModal();}catch(_){}}});(function(){function _isPlainTextInput(el){if(!el||el.tagName!=='INPUT')return false;if(!el.classList||!el.classList.contains('ar-input'))return false;const t=(el.getAttribute('type')||'text').toLowerCase();return(t==='text'||t===''||t==='search'||t==='tel'||t==='url'||t==='email');}
function _grow(el){if(el.value.indexOf('\n')>=0){el.setAttribute('data-multiline','1');el.style.whiteSpace='pre-wrap';el.style.overflowWrap='anywhere';el.style.height='auto';el.style.height=Math.min(el.scrollHeight,320)+'px';}else if(el.getAttribute('data-multiline')==='1'){el.removeAttribute('data-multiline');el.style.height='';el.style.whiteSpace='';}}
document.addEventListener('paste',function(ev){const el=ev.target;if(!_isPlainTextInput(el))return;let txt='';try{txt=(ev.clipboardData||window.clipboardData).getData('text');}catch(_){return;}
if(txt==null)return;if(txt.indexOf('\n')<0&&txt.indexOf('\r')<0)return;ev.preventDefault();txt=txt.replace(/\r\n?/g,'\n');const s=el.selectionStart==null?el.value.length:el.selectionStart;const e=el.selectionEnd==null?el.value.length:el.selectionEnd;const before=el.value.slice(0,s);const after=el.value.slice(e);el.value=before+txt+after;try{const p=s+txt.length;el.setSelectionRange(p,p);}catch(_){}
_grow(el);try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(_){}
try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(_){}},true);document.addEventListener('input',function(ev){const el=ev.target;if(_isPlainTextInput(el)&&(el.value.indexOf('\n')>=0||el.getAttribute('data-multiline')==='1'))_grow(el);},true);})();(function(){if(window.__tmMobileStage1)return;window.__tmMobileStage1=true;document.addEventListener('focusin',function(e){if(!e.target||!e.target.matches)return;if(!e.target.matches('input, textarea, select'))return;setTimeout(function(){try{e.target.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){}},250);});var _savedScrollTop=0;window.tmBodyLock=function(){if(document.body.classList.contains('modal-open'))return;_savedScrollTop=window.scrollY||document.documentElement.scrollTop||0;document.body.style.top=(-_savedScrollTop)+'px';document.body.classList.add('modal-open');};window.tmBodyUnlock=function(){if(!document.body.classList.contains('modal-open'))return;document.body.classList.remove('modal-open');document.body.style.top='';window.scrollTo(0,_savedScrollTop);};function _observeModals(){var modals=document.querySelectorAll('.ar-modal, .auth-overlay');if(!modals.length){return;}
modals.forEach(function(m){if(m.__tmObserved)return;m.__tmObserved=true;var mo=new MutationObserver(function(){var visible=m.style.display&&m.style.display!=='none';var anyOpen=Array.prototype.some.call(document.querySelectorAll('.ar-modal, .auth-overlay'),function(x){return x.style.display&&x.style.display!=='none';});if(anyOpen)window.tmBodyLock();else window.tmBodyUnlock();void visible;});mo.observe(m,{attributes:true,attributeFilter:['style','class','hidden']});});}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_observeModals);}else{_observeModals();}})();(function(){if(window.mobileConfirm)return;var _focusReturn=null;var _activeModal=null;var _resolveActive=null;function _lock(){try{if(typeof window.tmBodyLock==='function')window.tmBodyLock();}catch(_){}}
function _unlock(){try{if(typeof window.tmBodyUnlock==='function')window.tmBodyUnlock();}catch(_){}}
function _focusables(root){return Array.prototype.slice.call(root.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(function(el){return!el.hidden&&!el.disabled&&el.offsetParent!==null;});}
function _onKey(e){if(!_activeModal)return;if(e.key==='Escape'){e.preventDefault();_close(false,null);return;}
if(e.key!=='Tab')return;var f=_focusables(_activeModal);if(!f.length)return;var first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
function _open(modal,focusEl){_activeModal=modal;_focusReturn=document.activeElement;modal.hidden=false;_lock();document.addEventListener('keydown',_onKey,true);setTimeout(function(){try{(focusEl||_focusables(modal)[0]||modal).focus();}catch(_){}},30);}
function _close(ok,value){if(!_activeModal)return;var modal=_activeModal;_activeModal=null;modal.hidden=true;document.removeEventListener('keydown',_onKey,true);_unlock();try{if(_focusReturn&&_focusReturn.focus)_focusReturn.focus();}catch(_){}
_focusReturn=null;var r=_resolveActive;_resolveActive=null;if(r)r(ok?(value===undefined?true:value):(value===null?null:false));}
function _bindClose(modalId,returnVal){var m=document.getElementById(modalId);if(!m||m._mdBound)return;m._mdBound=true;m.addEventListener('click',function(e){if(e.target.hasAttribute&&e.target.hasAttribute('data-md-close')){e.preventDefault();_close(false,returnVal);}});}
window.mobileConfirm=function(opts){opts=opts||{};var modal=document.getElementById('mdConfirm');if(!modal){return Promise.resolve(window.confirm(opts.message||opts.title||'ยืนยัน?'));}
_bindClose('mdConfirm',false);var t=document.getElementById('mdConfirmTitle');var mb=document.getElementById('mdConfirmMsg');var ok=document.getElementById('mdConfirmOk');var cc=document.getElementById('mdConfirmCancel');if(t)t.textContent=opts.title||'ยืนยัน';if(mb){mb.innerHTML='';var msg=opts.message;if(msg!=null){var safe=String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');mb.innerHTML='<p>'+safe.replace(/\n/g,'</p><p>')+'</p>';}}
if(ok){ok.textContent=opts.confirmText||'ยืนยัน';ok.className='md-btn '+(opts.danger?'md-btn-danger':'md-btn-primary');ok.onclick=function(){_close(true,true);};}
if(cc){cc.textContent=opts.cancelText||'ยกเลิก';cc.onclick=function(){_close(false,false);};}
return new Promise(function(resolve){_resolveActive=resolve;_open(modal,ok);});};window.mobileInput=function(opts){opts=opts||{};var modal=document.getElementById('mdInput');if(!modal){var fallback=window.prompt(opts.title||'',opts.value||'');return Promise.resolve(fallback);}
_bindClose('mdInput',null);var t=document.getElementById('mdInputTitle');var lab=document.getElementById('mdInputLabel');var fld=document.getElementById('mdInputField');var err=document.getElementById('mdInputErr');var ok=document.getElementById('mdInputOk');var cc=document.getElementById('mdInputCancel');if(t)t.textContent=opts.title||'กรอกข้อมูล';if(lab)lab.textContent=opts.label||'';if(fld){fld.type=opts.type||'text';fld.value=(opts.value==null)?'':String(opts.value);fld.placeholder=opts.placeholder||'';}
if(err)err.textContent='';if(ok){ok.textContent=opts.confirmText||'ตกลง';ok.onclick=function(){var v=fld?String(fld.value):'';if(typeof opts.validate==='function'){var msg=opts.validate(v);if(msg){if(err)err.textContent=msg;if(fld)fld.focus();return;}}
_close(true,v);};}
if(cc){cc.textContent=opts.cancelText||'ยกเลิก';cc.onclick=function(){_close(false,null);};}
if(fld){fld.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();ok&&ok.click();}};}
return new Promise(function(resolve){_resolveActive=resolve;_open(modal,fld);try{fld&&fld.select();}catch(_){}});};window.mobileAlert=function(message,title){return window.mobileConfirm({title:title||'แจ้งเตือน',message:message||'',confirmText:'ตกลง',cancelText:null}).then(function(){return undefined;});};})();(function(){if(window.__tmGlobalErr)return;window.__tmGlobalErr=true;window.addEventListener('unhandledrejection',function(e){try{console.error('[unhandledrejection]',e.reason);}catch(_){}
try{if(typeof toast==='function')toast('ระบบเกิดข้อผิดพลาด — กรุณาลองใหม่','err');}catch(_){}});window.addEventListener('error',function(e){try{console.error('[window.error]',e.error||e.message);}catch(_){}});})();(function(){if(window.__tmPhaseB)return;window.__tmPhaseB=true;var _rpcAvailable=null;async function _detectRpc(sb){if(_rpcAvailable!==null)return _rpcAvailable;try{var r=await sb.rpc('tm_counts_v1',{p_view:'all'});_rpcAvailable=!r.error;if(!_rpcAvailable){var msg=String(r.error&&(r.error.message||r.error.code)||'');console.warn('[PhaseB] RPC unavailable, falling back. Reason:',msg);try{if(typeof toast==='function'){toast('⚠ ใช้โหมด fallback — กรุณา run supabase-setup.sql','warn');}}catch(_){}}}catch(e){_rpcAvailable=false;console.warn('[PhaseB] RPC probe threw:',e);}
return _rpcAvailable;}
window.tmRpcDetect=_detectRpc;Object.defineProperty(window,'tmRpcAvailable',{get:function(){return _rpcAvailable===true;}});function _rpcParams(){var f=(typeof TMState!=='undefined'&&TMState.filters)?TMState.filters:{};var view=(typeof TMState!=='undefined'&&TMState.view)?TMState.view:'open';var appCode=(typeof APP_CODE!=='undefined')?APP_CODE:null;var createdBy=null;try{var role=(typeof currentUserRole==='function')?currentUserRole():null;if(role==='user'){var u=(typeof getCurrentUser==='function')?getCurrentUser():null;if(u&&u.username)createdBy=u.username;}}catch(_){}
return{p_app_code:appCode||null,p_created_by:createdBy,p_q:(f.q||'').trim()||null,p_customer:(f.customer||'').trim()||null,p_warehouse:(f.warehouse||'').trim()||null,p_date_from:(f.dateFrom||'').trim()||null,p_date_to:(f.dateTo||'').trim()||null,p_view:view};}
window.tmLoadCountsRpc=async function(){var sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb||typeof TMState==='undefined')return false;if(!(await _detectRpc(sb)))return false;var sig=(typeof _tmFilterSig==='function')?_tmFilterSig():'';if(TMState._countsFresh&&TMState._countsSig===sig)return true;try{var r=await sb.rpc('tm_counts_v1',_rpcParams());if(r.error)throw r.error;var d=r.data||{};TMState.counts.total=d.total||0;TMState.counts.bl=d.bl||0;TMState.counts.entry=d.entry||0;TMState.counts.note=d.note||0;TMState.counts.wh=d.wh||0;TMState.closedCount=d.closed||0;TMState._countsSig=sig;TMState._countsFresh=true;return true;}catch(e){console.warn('[PhaseB] tmLoadCountsRpc failed → fallback:',e);return false;}};window.tmLoadFilterOptionsRpc=async function(force){var sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb||typeof TMState==='undefined')return false;if(!(await _detectRpc(sb)))return false;var now=Date.now();var TTL=5*60*1000;if(!force&&TMState.optionsLoaded&&TMState._optsAt&&(now-TMState._optsAt)<TTL)return true;try{var p=_rpcParams();var args={p_app_code:p.p_app_code,p_created_by:p.p_created_by};var[c,w]=await Promise.all([sb.rpc('tm_distinct_customers',args),sb.rpc('tm_distinct_warehouses',args)]);if(c.error)throw c.error;if(w.error)throw w.error;TMState.options.customer=(c.data||[]).filter(Boolean);TMState.options.warehouse=(w.data||[]).filter(Boolean);if(typeof tmFillSelect==='function'){tmFillSelect('tm-fcust','ลูกค้า ทั้งหมด',TMState.options.customer);tmFillSelect('tm-fwh','โกดัง ทั้งหมด',TMState.options.warehouse);}
TMState.optionsLoaded=true;TMState._optsAt=now;return true;}catch(e){console.warn('[PhaseB] tmLoadFilterOptionsRpc failed → fallback:',e);return false;}};if(typeof tmLoadCounts==='function'&&!tmLoadCounts._wrapped){var _origCounts=tmLoadCounts;window.tmLoadCounts=async function(){var ok=await window.tmLoadCountsRpc();if(!ok)return _origCounts.apply(this,arguments);};window.tmLoadCounts._wrapped=true;}
if(typeof tmLoadFilterOptions==='function'&&!tmLoadFilterOptions._wrapped){var _origOpts=tmLoadFilterOptions;window.tmLoadFilterOptions=async function(force){var ok=await window.tmLoadFilterOptionsRpc(force);if(!ok)return _origOpts.call(this,force);};window.tmLoadFilterOptions._wrapped=true;}
var _rt={channel:null,dirty:false,timer:null};function _scheduleRerender(){if(_rt.timer)return;_rt.timer=setTimeout(function(){_rt.timer=null;try{if(typeof renderTM==='function')renderTM();TMState._countsFresh=false;if(typeof tmLoadCounts==='function')tmLoadCounts().then(function(){if(typeof renderTM==='function')renderTM();});}catch(_){}},250);}
function _patchRow(newRow){if(!newRow||typeof TMState==='undefined')return;if((TMState.view||'open')==='closed')return;var idx=TMState.rows.findIndex(function(r){return r.id===newRow.id;});if(idx>=0)TMState.rows[idx]=newRow;else TMState.rows.unshift(newRow);while(TMState.rows.length>500)TMState.rows.pop();_scheduleRerender();}
function _removeRow(id){if(!id||typeof TMState==='undefined')return;if((TMState.view||'open')==='closed')return;TMState.rows=TMState.rows.filter(function(r){return r.id!==id;});_scheduleRerender();}
window.tmRealtimeStart=function(){var sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb||!sb.channel)return;if(_rt.channel)return;try{_rt.channel=sb.channel('tm-rt-'+Math.random().toString(36).slice(2)).on('postgres_changes',{event:'INSERT',schema:'public',table:'timeline_records'},function(payload){_patchRow(payload.new);}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'timeline_records'},function(payload){_patchRow(payload.new);}).on('postgres_changes',{event:'DELETE',schema:'public',table:'timeline_records'},function(payload){_removeRow(payload.old&&payload.old.id);}).subscribe(function(status){console.log('[PhaseB Realtime]',status);});}catch(e){console.warn('[PhaseB] Realtime subscribe failed:',e);}};window.tmRealtimeStop=function(){if(!_rt.channel)return;try{_rt.channel.unsubscribe();}catch(_){}
_rt.channel=null;};function _autostart(){try{if(typeof isLoggedIn==='function'&&!isLoggedIn())return;var sb=(typeof initSupabase==='function')?initSupabase():null;if(!sb)return;window.tmRealtimeStart();}catch(_){}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(_autostart,1500);});}else{setTimeout(_autostart,1500);}
window.addEventListener('beforeunload',function(){try{window.tmRealtimeStop();}catch(_){}});})();(function(){if(window.__tmPhaseC)return;window.__tmPhaseC=true;if(typeof tmDeriveInfo==='function'&&!tmDeriveInfo._memoized){var _orig=tmDeriveInfo;var _cache=new WeakMap();window.tmDeriveInfo=function(r){if(!r||typeof r!=='object')return _orig(r);var v=_cache.get(r);if(v)return v;v=_orig(r);try{_cache.set(r,v);}catch(_){}
return v;};window.tmDeriveInfo._memoized=true;}
function _trimMap(obj,max){if(!obj)return;var keys=Object.keys(obj);if(keys.length<=max)return;var drop=keys.length-max;for(var i=0;i<drop;i++){delete obj[keys[i]];}}
function _trimArr(arr,max){if(!arr||arr.length<=max)return;arr.length=max;}
setInterval(function(){try{if(typeof _tmDeptMap!=='undefined')_trimMap(_tmDeptMap,2000);if(typeof TMState!=='undefined'&&TMState.options){_trimArr(TMState.options.customer,1500);_trimArr(TMState.options.warehouse,1500);}
if(typeof _actionLock!=='undefined'){var keys=Object.keys(_actionLock);for(var i=0;i<keys.length;i++){if(!_actionLock[keys[i]])delete _actionLock[keys[i]];}}}catch(_){}},60000);function _onRowClick(e){var btn=e.target.closest&&e.target.closest('[data-act][data-id]');if(!btn)return;var act=btn.getAttribute('data-act');var id=btn.getAttribute('data-id');if(!act||!id)return;try{switch(act){case'edit':typeof editTM==='function'&&editTM(id);break;case'detail':typeof tmShowDetail==='function'&&tmShowDetail(id);break;case'close':typeof tmCloseJob==='function'&&tmCloseJob(id);break;case'reopen':typeof tmReopenJob==='function'&&tmReopenJob(id);break;case'delete':typeof deleteTM==='function'&&deleteTM(id);break;}}catch(err){console.error('[PhaseC delegation]',err);}}
document.addEventListener('click',_onRowClick,false);window.tmAnnounce=function(msg){var sr=document.getElementById('mdSr');if(sr)sr.textContent=String(msg||'');};})();console.log('[Phase-2] JS patches disabled · using Phase A→D JS · Phase-2 CSS/SW/Font active');(function(){if(window.__tmCloseLazy)return;window.__tmCloseLazy=true;var CJ={tab:null,awaitingSearch:false,extSearch:false,originalPageSize:null};window.__tmCJState=CJ;function $$(id){return document.getElementById(id);}
function fmtDate(d){return d.getFullYear()+'-'+
String(d.getMonth()+1).padStart(2,'0')+'-'+
String(d.getDate()).padStart(2,'0');}
function setDateRangeByTab(tab){var today=new Date();var from='',to='';if(tab==='today'){from=fmtDate(today);to=fmtDate(today);}else if(tab==='yesterday'){var y=new Date(today.getTime()-86400000);from=fmtDate(y);to=fmtDate(y);}else if(tab==='last5d'){var start=new Date(today.getTime()-5*86400000);from=fmtDate(start);to=fmtDate(today);}
if(typeof TMState!=='undefined'&&TMState.filters){TMState.filters.dateFrom=from;TMState.filters.dateTo=to;}
var f=$$('tm-date-from');var t=$$('tm-date-to');if(f)f.value=from;if(t)t.value=to;}
function buildTabsUI(){if($$('cj-tabs'))return;var page=$$('page-tm');if(!page)return;var head=page.querySelector('.pv-head');if(!head)return;var wrap=document.createElement('div');wrap.id='cj-tabs';wrap.className='cj-tabs';wrap.style.display='none';wrap.innerHTML='<div class="cj-tabs-row">'+'<button type="button" class="cj-tab" data-cj="today">วันนี้</button>'+'<button type="button" class="cj-tab" data-cj="yesterday">เมื่อวาน</button>'+'<button type="button" class="cj-tab" data-cj="last5d">5 วันล่าสุด</button>'+'<button type="button" class="cj-tab" data-cj="older">เก่ากว่านั้น</button>'+'</div>'+'<div class="cj-hint" id="cj-hint"></div>';if(head.nextSibling){head.parentNode.insertBefore(wrap,head.nextSibling);}else{head.parentNode.appendChild(wrap);}
var btns=wrap.querySelectorAll('.cj-tab');for(var i=0;i<btns.length;i++){btns[i].addEventListener('click',function(e){var t=e.currentTarget.getAttribute('data-cj');window.__cjSelectTab(t);});}}
function showTabs(){buildTabsUI();var el=$$('cj-tabs');if(el)el.style.display='';}
function hideTabs(){var el=$$('cj-tabs');if(el)el.style.display='none';}
function setActiveTab(tab){var btns=document.querySelectorAll('#cj-tabs .cj-tab');for(var i=0;i<btns.length;i++){btns[i].classList.toggle('active',btns[i].getAttribute('data-cj')===tab);}}
function setHint(text){var h=$$('cj-hint');if(h)h.textContent=text||'';}
window.__cjSelectTab=function(tab){CJ.tab=tab;setActiveTab(tab);if(typeof TMState!=='undefined'){TMState.page=0;TMState._mAppend=false;}
if(tab==='older'){CJ.awaitingSearch=true;CJ.extSearch=true;setDateRangeByTab(tab);setHint('🔍 กรุณากรอกคำค้น หรือเลือกช่วงวันที่ ก่อนโหลดข้อมูล (ค้นได้: ลูกค้า, B/L, เลขใบขน, โกดัง, note, ผู้บันทึก, id)');if(typeof TMState!=='undefined'){TMState.rows.length=0;TMState.total=0;if(typeof renderTM==='function')renderTM();}}else{CJ.awaitingSearch=false;CJ.extSearch=false;setDateRangeByTab(tab);setHint('');window._tmSkipReload=false;if(typeof tmReloadPage==='function')tmReloadPage();}};if(typeof tmSwitchView==='function'&&!tmSwitchView._cjwrapped){var _origSV=tmSwitchView;window.tmSwitchView=function(view){view=(view==='closed')?'closed':'open';if(view==='closed'){window._tmSkipReload=true;try{_origSV.call(this,view);}
finally{window._tmSkipReload=false;}
if(CJ.originalPageSize==null&&typeof TMState!=='undefined'){CJ.originalPageSize=TMState.pageSize;}
if(typeof TMState!=='undefined')TMState.pageSize=100;showTabs();window.__cjSelectTab('today');return;}
hideTabs();CJ.tab=null;CJ.awaitingSearch=false;CJ.extSearch=false;if(CJ.originalPageSize!=null&&typeof TMState!=='undefined'){TMState.pageSize=CJ.originalPageSize;CJ.originalPageSize=null;}
if(typeof TMState!=='undefined'&&TMState.filters){TMState.filters.dateFrom='';TMState.filters.dateTo='';}
var f=$$('tm-date-from');if(f)f.value='';var t=$$('tm-date-to');if(t)t.value='';return _origSV.call(this,view);};window.tmSwitchView._cjwrapped=true;}
if(typeof tmReloadPage==='function'&&!tmReloadPage._cjwrapped){var _origRP=tmReloadPage;window.tmReloadPage=function(){if(window._tmSkipReload)return Promise.resolve();if(typeof TMState!=='undefined'&&(TMState.view||'open')==='closed'&&CJ.awaitingSearch){var f=TMState.filters||{};var hasQ=!!(f.q&&String(f.q).trim()!=='');var hasRange=!!(f.dateFrom||f.dateTo);if(!hasQ&&!hasRange){TMState.rows.length=0;TMState.total=0;if(typeof renderTM==='function')renderTM();setHint('🔍 กรุณากรอกคำค้น หรือเลือกช่วงวันที่ ก่อนโหลดข้อมูล');return Promise.resolve();}
CJ.awaitingSearch=false;setHint('');}
return _origRP.apply(this,arguments);};window.tmReloadPage._cjwrapped=true;}
console.log('[CLOSE JOB Lazy] patches applied · tabs ready');})();(function(){if(window.__tmStatusEdit)return;window.__tmStatusEdit=true;var TM_STATUS_TOKEN='🏷 สถานะ:';var STATUS_OPTS=['','รอเอกสาร','รอส่ง','พร้อมส่ง','ระหว่างขนส่ง','ถึงปลายทาง','รอเก็บเงิน','ส่งแล้ว','ติดปัญหา'];function _isDesktop(){return!(window.matchMedia&&window.matchMedia('(max-width:1023px)').matches);}
function parseStatusFromNote(note){if(!note)return'';var s=String(note);var m=s.match(/🏷\s*สถานะ\s*:\s*([^\n\r]*)/);return m?m[1].trim():'';}
function writeStatusToNote(oldNote,newStatus){var s=String(oldNote||'');s=s.split(/\r?\n/).filter(function(l){return!/🏷\s*สถานะ\s*:/.test(l);}).join('\n').replace(/\s+$/,'');if(newStatus){s=(s?s+'\n':'')+TM_STATUS_TOKEN+newStatus;}
return s;}
async function saveStatus(id,newStatus,selEl){if(typeof initSupabase!=='function')return;var sb=initSupabase();if(!sb)return;var row=null;try{if(typeof TMState!=='undefined'&&Array.isArray(TMState.rows)){for(var i=0;i<TMState.rows.length;i++){if(String(TMState.rows[i].id)===String(id)){row=TMState.rows[i];break;}}}}catch(_){}
if(!row){if(typeof toast==='function')toast('ไม่พบรายการ','err');return;}
try{if(typeof _tmCanTouch==='function'&&!_tmCanTouch(row)){if(typeof toast==='function')toast('🚫 ทำได้เฉพาะงานของตัวเอง','err');return;}}catch(_){}
if(selEl)selEl.classList.add('saving');var newNote=writeStatusToNote(row.note,newStatus);try{var uq=sb.from(TM_TBL).update({note:newNote,updated_at:new Date().toISOString()}).eq('id',id);if(typeof tlIsUserScope==='function'&&tlIsUserScope()){var mu=(typeof tlMyUsername==='function')?tlMyUsername():null;if(mu)uq=uq.eq('created_by',mu);}
var res=await uq;if(res.error)throw res.error;row.note=newNote;row.updated_at=new Date().toISOString();if(selEl){selEl.classList.remove('saving');selEl.setAttribute('data-set',newStatus?'1':'0');}
if(typeof toast==='function')toast('💾 บันทึกสถานะ'+(newStatus?': '+newStatus:' (ล้าง)'),'ok');}catch(e){if(selEl)selEl.classList.remove('saving');console.error('saveStatus:',e);var msg=(e&&e.message)?e.message:String(e);if(typeof toast==='function')toast('บันทึกสถานะไม่สำเร็จ: '+msg,'err');}}
function onSelChange(e){var sel=e.target;if(!sel||!sel.classList.contains('tm-status-sel'))return;var id=sel.getAttribute('data-id');var v=sel.value||'';if(!id)return;saveStatus(id,v,sel);}
function buildSelectFor(row){var sel=document.createElement('select');sel.className='tm-status-sel';sel.setAttribute('data-id',row.id);var current=parseStatusFromNote(row.note);sel.setAttribute('data-set',current?'1':'0');for(var i=0;i<STATUS_OPTS.length;i++){var opt=document.createElement('option');opt.value=STATUS_OPTS[i];opt.textContent=STATUS_OPTS[i]===''?'— เลือกสถานะ —':STATUS_OPTS[i];if(STATUS_OPTS[i]===current)opt.selected=true;sel.appendChild(opt);}
return sel;}
function decorateRows(){if(!_isDesktop())return;if(typeof TMState==='undefined')return;var tbody=document.getElementById('tm-tbody');if(!tbody)return;var trs=tbody.querySelectorAll('tr[data-id]');for(var i=0;i<trs.length;i++){var tr=trs[i];if(tr.getAttribute('data-status-decorated')==='1')continue;var cell=tr.cells[0];if(!cell)continue;var id=tr.getAttribute('data-id');var row=null;for(var j=0;j<TMState.rows.length;j++){if(String(TMState.rows[j].id)===String(id)){row=TMState.rows[j];break;}}
if(!row)continue;var sel=buildSelectFor(row);cell.appendChild(sel);tr.setAttribute('data-status-decorated','1');}}
function bindOnce(){var tbody=document.getElementById('tm-tbody');if(!tbody||tbody.getAttribute('data-status-bound')==='1')return false;tbody.addEventListener('change',onSelChange);tbody.setAttribute('data-status-bound','1');return true;}
var _decoTimer=null;function scheduleDecorate(){if(_decoTimer)return;_decoTimer=setTimeout(function(){_decoTimer=null;try{bindOnce();decorateRows();}catch(_){}},50);}
function setupObserver(){var tbody=document.getElementById('tm-tbody');if(!tbody)return false;var obs=new MutationObserver(scheduleDecorate);obs.observe(tbody,{childList:true,subtree:false});scheduleDecorate();return true;}
function init(){if(setupObserver()){console.log('[Status Edit] ready · desktop dropdown active');}else{setTimeout(init,500);}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}})();