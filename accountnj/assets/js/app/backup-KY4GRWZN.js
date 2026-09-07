import{i as e}from"./chunk-37ELUCVE.js";import{e as c}from"./chunk-PCFU74ZV.js";async function n(t){t.innerHTML=`
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E2A\u0E16\u0E32\u0E19\u0E30 Backup</h2></div></div>
    <div id="bk-body"><div class="load-row"><div class="spin"></div></div></div>
    <div class="card card-pad mt-2 t-sm t-2">
      Layer 1: Supabase Managed Backup (\u0E15\u0E32\u0E21\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E01\u0E15\u0E4C) \xB7
      Layer 2: \u0E23\u0E30\u0E1A\u0E1A backup \u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19 17:30 \u2192 Google Drive \u2014 \u0E40\u0E21\u0E37\u0E48\u0E2D pipeline \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E04\u0E48\u0E32
      backup_* \u0E43\u0E19 njacc_settings \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34
    </div>`;try{let a=await e("njacc_backup_status"),s=(d,r,l)=>`<div class="card card-pad bk-item">
      <div class="t-xs t-2">${d}</div><div class="st ${l}">${c(r)}</div></div>`,i=a?.last_backup_at?String(a.last_backup_at).replace("T"," ").slice(0,19):"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25";t.querySelector("#bk-body").innerHTML=`<div class="bk-grid">
      ${s("Backup \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",i,a?.last_backup_at?"ok":"warn")}
      ${s("\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",a?.last_backup_status||"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",a?.last_backup_status==="SUCCESS"?"ok":a?.last_backup_status?"bad":"warn")}
      ${s("\u0E15\u0E23\u0E27\u0E08\u0E44\u0E1F\u0E25\u0E4C (Verify)",a?.last_verify_status||"NOT VERIFIED",a?.last_verify_status==="PASS"?"ok":"warn")}
      ${s("Restore Test \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",a?.last_restore_test||"NOT TESTED",a?.last_restore_test==="PASS"?"ok":"warn")}
    </div>`}catch(a){t.querySelector("#bk-body").innerHTML='<div class="card card-pad empty">\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E25\u0E2D\u0E07\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07</div>',console.warn(a)}}export{n as render};
