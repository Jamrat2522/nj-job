/* ============================================================
   SHIPPING AIR — Flicker Probe (วางใน DevTools Console เท่านั้น)
   ไม่ต้องแก้ไฟล์ HTML · ไม่มี debug code ค้างในไฟล์จริง
   วิธีใช้: เปิดหน้า "ดำเนินตรวจปล่อย" (RECEIVED) → เปิด Console → วางทั้งก้อนนี้ → Enter
            ทดสอบตามเคส → พิมพ์  probe.report()  เพื่อดูผล
            เลิกใช้: probe.stop()
   ============================================================ */
(function(){
  if(window.probe){ try{ window.probe.stop(); }catch(_){} }
  const C = { _rtRun:0, _renderDocBody:0, renderDocView:0, routeRender:0,
              _patchDocumentRow:0, _patchDocumentStatusCells:0,
              _saDeltaSync:0, subscribeRealtime:0, _loadJobStatus:0, _loadSysStatus:0,
              tbodyReplaced:0, trAdded:0, trRemoved:0, stSysChanged:0, jsTxtChanged:0 };
  const orig = {};
  ['_rtRun','_renderDocBody','renderDocView','routeRender','_patchDocumentRow',
   '_patchDocumentStatusCells','_saDeltaSync','subscribeRealtime','_loadJobStatus','_loadSysStatus']
  .forEach(name=>{
    if(typeof window[name]!=='function'){ console.warn('probe: ไม่พบฟังก์ชัน', name); return; }
    orig[name]=window[name];
    window[name]=function(){ C[name]++; return orig[name].apply(this, arguments); };
  });

  const root = document.getElementById('view-root');
  let tbodyRef = root && root.querySelector('tbody');
  const obs = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(n=>{
        if(n.nodeName==='TR') C.trAdded++;
        if(n.nodeName==='TBODY') C.tbodyReplaced++;
      });
      m.removedNodes && m.removedNodes.forEach(n=>{
        if(n.nodeName==='TR') C.trRemoved++;
      });
      // เนื้อหาเซลล์สถานะเปลี่ยน
      let el = m.target && (m.target.nodeType===1 ? m.target : m.target.parentElement);
      while(el && el!==root){
        if(el.classList){
          if(el.classList.contains('st-sys')){ C.stSysChanged++; break; }
          if(el.classList.contains('js-txt')){ C.jsTxtChanged++; break; }
        }
        el = el.parentElement;
      }
    });
    // ตรวจว่า tbody ถูกแทนที่เป็น element ใหม่หรือไม่ (innerHTML บน tbody = ไม่แทนที่ element)
    const now = root && root.querySelector('tbody');
    if(now && tbodyRef && now!==tbodyRef){ C.tbodyReplaced++; tbodyRef=now; }
  });
  if(root) obs.observe(root, { childList:true, subtree:true, characterData:true });
  else console.warn('probe: ไม่พบ #view-root');

  const t0 = Date.now();
  window.probe = {
    counters: C,
    reset(){ Object.keys(C).forEach(k=>C[k]=0); console.log('probe: reset แล้ว'); },
    report(){
      console.log('%c=== FLICKER PROBE (' + Math.round((Date.now()-t0)/1000) + ' วินาที) ===','color:#0EA672;font-weight:bold');
      console.table(C);
      const bad = [];
      if(C._renderDocBody>0) bad.push('_renderDocBody ถูกเรียก '+C._renderDocBody+' ครั้ง');
      if(C.renderDocView>0)  bad.push('renderDocView ถูกเรียก '+C.renderDocView+' ครั้ง');
      if(C.routeRender>0)    bad.push('routeRender ถูกเรียก '+C.routeRender+' ครั้ง');
      if(C.tbodyReplaced>0)  bad.push('tbody ถูกแทนที่ '+C.tbodyReplaced+' ครั้ง');
      if(C.subscribeRealtime>1) bad.push('subscribeRealtime '+C.subscribeRealtime+' ครั้ง (>1 = อาจมี loop)');
      console.log(bad.length ? '%cพบพฤติกรรมที่ต้องดู:\n- '+bad.join('\n- ') : '%c✅ ไม่พบการ render ตารางที่ไม่จำเป็น',
                  bad.length ? 'color:#EF4444' : 'color:#10B981');
      return C;
    },
    stop(){
      obs.disconnect();
      Object.keys(orig).forEach(n=>{ window[n]=orig[n]; });
      delete window.probe;
      console.log('probe: หยุดแล้ว (คืนฟังก์ชันเดิมครบ)');
    }
  };
  console.log('%cprobe พร้อมใช้งาน → ทดสอบแล้วพิมพ์  probe.report()','color:#0EA672;font-weight:bold');
})();

/* ------------------------------------------------------------
   เกณฑ์อ่านผล

   [เคส A] เปิดหน้าค้าง 60 วินาที ห้ามแตะอะไร → probe.report()
     ผ่าน: _renderDocBody=0, renderDocView=0, routeRender=0,
           tbodyReplaced=0, trAdded=0, trRemoved=0,
           subscribeRealtime=0, _saDeltaSync=0
     ไม่ผ่าน: subscribeRealtime เพิ่มเรื่อย ๆ = ยังมี subscribe loop

   [เคส B] อีกเครื่องอัปเดตสถานะของงาน "ที่อยู่หน้าปัจจุบัน"
     ผ่าน: _patchDocumentStatusCells ≥1, stSysChanged/jsTxtChanged ≥1
           _renderDocBody=0, tbodyReplaced=0, trAdded=0, trRemoved=0

   [เคส C] อีกเครื่องอัปเดต Timeline ของงาน "นอกหน้าปัจจุบัน" (หน้า 2 / ถูก filter)
     ผ่าน: _renderDocBody=0, routeRender=0, tbodyReplaced=0,
           trAdded=0, trRemoved=0  (DOM ตารางต้องนิ่งสนิท)

   [เคส D] ตัดเน็ต → ต่อกลับ / สลับแท็บกลับมา
     ผ่าน: _saDeltaSync เพิ่ม 1 ต่อ 1 เหตุการณ์ (ไม่ใช่วนรัว)
           subscribeRealtime ≤1 ต่อการหลุด 1 ครั้ง
           สถานะบนจอไม่กลายเป็น — ระหว่าง sync
------------------------------------------------------------ */
