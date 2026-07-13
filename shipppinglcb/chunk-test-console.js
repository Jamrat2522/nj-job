/* Round 1 Chunk Test — paste ลง DevTools Console (read-only · ไม่แก้แอป) */
(function(){
  const HEAVY=/heavy-(export|dash|ot|users)\.js/;
  function res(){return performance.getEntriesByType("resource").filter(e=>HEAVY.test(e.name));}
  const CT={
    help(){console.log("%cChunk Test","font-weight:bold");console.log("CT.loaded()  → chunk ที่โหลดแล้ว\nCT.dupes()   → chunk ที่โหลดซ้ำ (ต้องว่าง)\nCT.check()   → สรุปสถานะ\nCT.watch()   → เฝ้าดู chunk โหลดแบบ realtime");},
    loaded(){const n=[...new Set(res().map(e=>e.name.split("/").pop()))];console.table(n.map(f=>({chunk:f})));return n;},
    dupes(){const c={};res().forEach(e=>{const f=e.name.split("/").pop();c[f]=(c[f]||0)+1;});const d=Object.entries(c).filter(([_,n])=>n>1);if(!d.length){console.log("%c✓ ไม่มี chunk โหลดซ้ำ","color:green");return[];}console.warn("⚠️ โหลดซ้ำ:",d);return d;},
    check(){const l=this.loaded();const d=Object.entries(res().reduce((a,e)=>{const f=e.name.split("/").pop();a[f]=(a[f]||0)+1;return a;},{})).filter(([_,n])=>n>1);console.log("%cสรุป","font-weight:bold");console.log("chunk โหลดแล้ว:",l.length,l);console.log("โหลดซ้ำ:",d.length?d:"ไม่มี ✓");console.log("preload ตอนเปิด (ควร 0 ก่อนกดเมนู):",l.length);return{loaded:l,dupes:d};},
    watch(){new PerformanceObserver(list=>{list.getEntries().forEach(e=>{if(HEAVY.test(e.name))console.log("%c⬇ chunk loaded: "+e.name.split("/").pop(),"color:#2563eb",new Date().toLocaleTimeString());});}).observe({type:"resource",buffered:false});console.log("👀 เฝ้าดู chunk loading... (กดเมนูต่างๆ แล้วดู log)");}
  };
  window.CT=CT;
  console.log("%c✓ Chunk Test พร้อม — พิมพ์ CT.help()","color:green;font-weight:bold");
  console.log("ตอนนี้: chunk โหลดแล้ว =",CT.loaded().length,"(ก่อนกดเมนูควรเป็น 0)");
})();
