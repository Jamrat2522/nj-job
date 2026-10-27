/* V.623 : ACCOUNTING \u2014 \uD83D\uDCE4 \u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 PDF Invoice \u00B7 \u0E42\u0E04\u0E25\u0E19\u0E42\u0E2B\u0E21\u0E14 "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 PDF" \u0E08\u0E32\u0E01 HTML \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (index (8).html)
   - \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E32 / \u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 / Regex / \u0E01\u0E32\u0E23\u0E01\u0E23\u0E2D\u0E01 Excel / Export PDF \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (CSS \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A scope \u0E43\u0E15\u0E49 .pdfi623 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19)
   - \u0E43\u0E0A\u0E49 Login + \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C ACCOUNTING \u0E02\u0E2D\u0E07 BILLING NJ (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49 LOCAL_USERS / SB_KEY \u0E17\u0E35\u0E48\u0E1D\u0E31\u0E07\u0E43\u0E19 HTML \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A)
   - \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E15\u0E32\u0E23\u0E32\u0E07 finance \u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21 (insert \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19) \u0E1C\u0E48\u0E32\u0E19 Supabase client \u0E17\u0E35\u0E48 Login \u0E41\u0E25\u0E49\u0E27\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E25\u0E31\u0E01
   - \u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35\u0E42\u0E2B\u0E25\u0E14\u0E08\u0E32\u0E01 assets/vendor \u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A (pdf.js 3.11.174 / JSZip 3.10.1 / SheetJS 0.18.5 \u0E23\u0E38\u0E48\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A) */
import{l as SB623}from"./chunk-SGWIBJH6.js";
import{a as LS623}from"./chunk-LAFWE2EM.js";
import{a as ST623}from"./chunk-GDT6F23K.js";

const XLSX_CDN623='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const JSZIP_CDN623='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const BV623=()=>(typeof window!=='undefined'&&window.__BUILD)||'';
const PDFJS623=()=>'assets/vendor/pdf.min.js?v='+BV623();
const PDFW623=()=>'assets/vendor/pdf.worker.min.js?v='+BV623();
const FONT623='https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

const CSS623=`
.pdfi623{--navy:#0b1929;--navy2:#122035;--navy3:#1a3055;--teal:#00b4cc;--teal2:#7de0ec;--gold:#f5a623;--white:#ffffff;--light:#f0f6fb;--border:#d0e2ef;--text:#1a2a3a;--muted:#6a8aaa;--success:#22c55e;--danger:#ef4444;--warn:#f59e0b;--card:#ffffff;
  font-family:'Sarabun',sans-serif;font-size:16px;line-height:normal;letter-spacing:normal;color:var(--text);background:#f5f7fb;padding:28px 32px;border-radius:14px;text-align:left}
.pdfi623 *{box-sizing:border-box;margin:0;padding:0}
.pdfi623 .card{background:white;border-radius:14px;padding:24px 28px;box-shadow:0 2px 12px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.05);margin-bottom:20px}
.pdfi623 .card-title{font-size:.95rem;font-weight:700;color:var(--navy2);margin-bottom:18px;display:flex;align-items:center;gap:8px}
.pdfi623 .card-title span{font-size:1.1rem}
.pdfi623 .upload-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.pdfi623 .dropzone{border:2px dashed var(--border);border-radius:12px;padding:30px 20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--light);position:relative}
.pdfi623 .dropzone:hover,.pdfi623 .dropzone.drag-over{border-color:var(--teal);background:#e5f8fb}
.pdfi623 .dropzone.has-file{border-color:var(--success);background:#f0fdf4}
.pdfi623 .dropzone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.pdfi623 .dz-icon{font-size:2.2rem;margin-bottom:10px}
.pdfi623 .dz-title{font-size:.9rem;font-weight:600;color:var(--navy2);margin-bottom:4px}
.pdfi623 .dz-sub{font-size:.75rem;color:var(--muted)}
.pdfi623 .dz-file{margin-top:10px;font-size:.75rem;color:var(--success);font-weight:600;font-family:'IBM Plex Mono',monospace}
.pdfi623 .process-btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--navy3),var(--teal));color:white;border:none;border-radius:11px;font-size:1rem;font-weight:600;font-family:'Sarabun',sans-serif;cursor:pointer;transition:all .2s;letter-spacing:.3px}
.pdfi623 .process-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,180,204,.3)}
.pdfi623 .process-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.pdfi623 .progress-steps{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.pdfi623 .p-step{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;background:#f8fafc;font-size:.85rem;color:#94a3b8;transition:all .3s}
.pdfi623 .p-step.active{background:#e0f7fa;color:var(--navy2);font-weight:500}
.pdfi623 .p-step.done{background:#f0fdf4;color:#15803d}
.pdfi623 .p-step.error{background:#fef2f2;color:var(--danger)}
.pdfi623 .p-icon{width:22px;text-align:center;font-size:1rem;flex-shrink:0}
.pdfi623 .spinner{width:16px;height:16px;border:2px solid #b2ebf2;border-top-color:var(--teal);border-radius:50%;animation:pdfi623spin .7s linear infinite;flex-shrink:0}
@keyframes pdfi623spin{to{transform:rotate(360deg)}}
.pdfi623 .result-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.pdfi623 .rf{background:var(--light);border-radius:9px;padding:11px 13px;border-left:3px solid var(--teal)}
.pdfi623 .rf-label{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.pdfi623 .rf-val{font-size:.88rem;font-weight:700;color:var(--navy2);font-family:'IBM Plex Mono',monospace}
.pdfi623 .data-table{width:100%;border-collapse:collapse;font-size:.83rem}
.pdfi623 .data-table th{background:var(--navy2);color:white;padding:10px 12px;text-align:left;font-weight:500;font-size:.78rem;letter-spacing:.2px}
.pdfi623 .data-table th:first-child{border-radius:8px 0 0 0}
.pdfi623 .data-table th:last-child{border-radius:0 8px 0 0}
.pdfi623 .data-table td{padding:9px 12px;border-bottom:1px solid #edf2f7;color:var(--text)}
.pdfi623 .data-table tr:hover td{background:#f8fafc}
.pdfi623 .data-table tr:last-child td{border-bottom:none}
.pdfi623 .tag{display:inline-block;padding:2px 8px;border-radius:5px;font-size:.7rem;font-weight:600}
.pdfi623 .tag-svc{background:#dbeeff;color:#1a5dad}
.pdfi623 .tag-adv{background:#fff3d6;color:#9a5c00}
.pdfi623 .totals-strip{display:flex;border-radius:10px;overflow:hidden;border:1px solid var(--border);margin:16px 0}
.pdfi623 .tot{flex:1;padding:12px 8px;text-align:center;background:white;border-right:1px solid var(--border)}
.pdfi623 .tot:last-child{border-right:none}
.pdfi623 .tot.grand{background:var(--navy2)}
.pdfi623 .tot-label{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.3px}
.pdfi623 .tot.grand .tot-label{color:var(--teal2)}
.pdfi623 .tot-val{font-size:.92rem;font-weight:700;color:var(--navy2);font-family:'IBM Plex Mono',monospace;margin-top:3px}
.pdfi623 .tot.grand .tot-val{color:var(--gold)}
.pdfi623 .dl-btn{width:100%;padding:18px;background:var(--success);color:white;border:none;border-radius:14px;font-size:1.15rem;font-weight:700;font-family:'Sarabun',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(34,197,94,.35);animation:pdfi623pulse 2s infinite}
.pdfi623 .dl-btn:hover{background:#16a34a;transform:translateY(-2px);box-shadow:0 10px 30px rgba(34,197,94,.45)}
@keyframes pdfi623pulse{0%,100%{box-shadow:0 6px 24px rgba(34,197,94,.35)}50%{box-shadow:0 6px 32px rgba(34,197,94,.6)}}
.pdfi623 .pdfi623-toast{position:fixed;bottom:24px;right:24px;z-index:999;background:var(--navy2);color:white;padding:12px 20px;border-radius:10px;font-size:.85rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,.3);transform:translateY(80px);opacity:0;transition:all .3s;pointer-events:none;border-left:4px solid var(--teal)}
.pdfi623 .pdfi623-toast.show{transform:translateY(0);opacity:1}
.pdfi623 .pdfi623-toast.error{border-left-color:var(--danger)}
.pdfi623 .pdfi623-toast.success{border-left-color:var(--success)}
.pdfi623 .hidden{display:none !important}
`;

const HTML623=`
<div class="pdfi623" id="pdfi623">
  <div id="page-upload">
    <div class="card">
      <div class="card-title"><span>\uD83D\uDCE4</span> \u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C</div>
      <div class="upload-grid">
        <div class="dropzone" id="pdfZone">
          <input type="file" accept=".pdf" id="pdfInput" multiple>
          <div class="dz-icon">\uD83D\uDCC4</div>
          <div class="dz-title">PDF Invoice <span style="font-size:.72rem;color:#94a3b8;font-weight:400">(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A)</span></div>
          <div class="dz-sub">\u0E25\u0E32\u0E01\u0E27\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01 .pdf \u0E2B\u0E25\u0E32\u0E22\u0E44\u0E1F\u0E25\u0E4C\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19</div>
          <div class="dz-file" id="pdfName"></div>
        </div>
        <div class="dropzone" id="xlsxZone">
          <input type="file" accept=".xlsx,.xls" id="xlsxInput">
          <div class="dz-icon">\uD83D\uDCCA</div>
          <div class="dz-title">Excel Template</div>
          <div class="dz-sub">\u0E25\u0E32\u0E01\u0E27\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01 .xlsx</div>
          <div class="dz-file" id="xlsxName"></div>
        </div>
      </div>
      <button class="process-btn" id="processBtn" disabled>\u26A1 \u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 PDF \u2192 Excel</button>
      <div id="progressWrap" class="hidden">
        <div class="progress-steps">
          <div class="p-step" id="ps1"><span class="p-icon">\uD83D\uDCC4</span> \u0E2D\u0E48\u0E32\u0E19\u0E44\u0E1F\u0E25\u0E4C PDF\u2026</div>
          <div class="p-step" id="ps2"><span class="p-icon">\uD83D\uDD0D</span> \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Invoice\u2026</div>
          <div class="p-step" id="ps3"><span class="p-icon">\uD83D\uDCCA</span> \u0E42\u0E2B\u0E25\u0E14 Excel Template\u2026</div>
          <div class="p-step" id="ps4"><span class="p-icon">\u270F\uFE0F</span> \u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E07 Excel\u2026</div>
          <div class="p-step" id="ps5"><span class="p-icon">\uD83D\uDCBE</span> \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07 Supabase\u2026</div>
          <div class="p-step" id="ps6"><span class="p-icon">\u2705</span> \u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19</div>
        </div>
      </div>
    </div>

    <div class="card hidden" id="resultCard">
      <div class="card-title"><span>\u2705</span> \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E44\u0E14\u0E49</div>
      <div class="result-fields" id="resultFields"></div>
      <table class="data-table" style="margin-bottom:12px">
        <thead>
          <tr><th>#</th><th>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th><th style="text-align:right">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E3F)</th></tr>
        </thead>
        <tbody id="resultItems"></tbody>
      </table>
      <div class="totals-strip" id="resultTotals"></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="dl-btn" id="dlBtn" style="padding:18px;font-size:1.15rem;border-radius:14px;box-shadow:0 6px 24px rgba(34,197,94,.35);letter-spacing:.5px;display:flex;align-items:center;justify-content:center;gap:10px;flex:1">
          <span style="font-size:1.4rem">\u2B07\uFE0F</span>
          <span>\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 Excel \u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27</span>
        </button>
        <button id="pdfBtn" style="padding:18px;font-size:1.15rem;border-radius:14px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;cursor:pointer;box-shadow:0 6px 24px rgba(239,68,68,.35);letter-spacing:.5px;display:flex;align-items:center;justify-content:center;gap:10px;flex:1">
          <span style="font-size:1.4rem">\uD83D\uDCC4</span>
          <span>Export PDF \u0E41\u0E22\u0E01\u0E41\u0E15\u0E48\u0E25\u0E30 Sheet</span>
        </button>
      </div>
    </div>
  </div>
  <div class="pdfi623-toast" id="toast"></div>
</div>`;

function ensureAssets623(){
  if(typeof document==='undefined')return;
  if(!document.getElementById('pdfi623-style')){const s=document.createElement('style');s.id='pdfi623-style';s.textContent=CSS623;document.head.appendChild(s);}
  if(!document.getElementById('pdfi623-font')){const l=document.createElement('link');l.id='pdfi623-font';l.rel='stylesheet';l.href=FONT623;document.head.appendChild(l);}
}

/* \u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (cs) = \u0E1C\u0E39\u0E49 Login \u0E23\u0E30\u0E1A\u0E1A BILLING NJ (\u0E41\u0E17\u0E19 username \u0E02\u0E2D\u0E07 LOCAL_USERS \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A) */
function csName623(){
  const p=ST623.profile||{};
  return String(p.login_name||p.nickname||p.full_name||p.employee_code||'').trim();
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u0E1F\u0E31\u0E07\u0E01\u0E4C\u0E0A\u0E31\u0E19\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19 Logic)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function parsePdfText(text) {
  const lines = text.split(/\n/);
  function get(rx) { const m = text.match(rx); return m ? m[1].trim() : ''; }
  function getNum(rx) { const m = text.match(rx); return m ? parseFloat(m[1].replace(/,/g,'')) : 0; }

  const invoice_no = get(/(NJ\d{4}-\d{5})/);
  let date = '';
  for (const line of lines) {
    if (/date/i.test(line) && !/printed/i.test(line)) {
      const dm = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dm) { date = dm[1]; break; }
    }
  }
  if (!date) {
    const allDates = [...text.matchAll(/(\d{2}\/\d{2}\/20\d{2})/g)];
    if (allDates.length) date = allDates[0][1];
  }

  const job_no         = get(/J\s*[o0]\s*b\s*N\s*\.?\s*:?\s*(JOB[\w-]+)/i);
  const decl_no        = get(/Decl\s*N\s*\.?\s*:?\s*([A-Z0-9]+)/i);
  const customer_po    = get(/Cust\s*m?er\s*PO\s*:?\s*([A-Z0-9]+)/i);
  const master         = get(/M\s*a\s*s\s*t\s*e\s*r\s*[:\s]([^\n]+)/i);
  const house          = get(/H\s*u\s*s\s*e\s*[:\s]([A-Z]{2,}[\w]*)/i);
  const company_invoice = get(/C\s*m?\s*p\s*a\s*n\s*y\s*I\s*n\s*v\s*i?\s*c\s*e\s*:?\s*(.+?)(?:GRAND|Withholding|\n|$)/i);

  const subtotal_vat = getNum(/SubTotal\s*7\s*%\s*([\d,]+\.?\d*)/i);
  const vat_7        = getNum(/VAT\s*7\s*%\s*([\d,]+\.?\d*)/i);
  const total        = getNum(/\bTotal\b\s*([\d,]+\.?\d*)/i);
  const advance      = getNum(/Advance\s*Re-?imburs\w*\s*([\d,]+\.?\d*)/i);
  const grand_total  = getNum(/GRAND\s*TOTAL\s*([\d,]+\.?\d*)/i);

  const items = [];
  const itemRx = /^(\d+)\s+((?:SERVICE|ADVANCE)[^\n]+?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?$/gim;
  let m;
  while ((m = itemRx.exec(text)) !== null && items.length < 9) {
    const svc = parseFloat((m[3]||'0').replace(/,/g,''));
    const adv = parseFloat((m[4]||'0').replace(/,/g,''));
    const isAdv = /advance/i.test(m[2]);
    items.push({
      no: parseInt(m[1]),
      description: m[2].trim(),
      service_charge: isAdv ? 0 : svc,
      advance_amount: isAdv ? (adv||svc) : 0
    });
  }

  return { invoice_no, date, job_no, decl_no, customer_po, master, house,
           container: '', house_no: '',
           company_invoice: company_invoice.trim(),
           subtotal_non_vat: 0, subtotal_vat, vat_7, total, advance, grand_total, items };
}

async function loadPdfJs623(){
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = PDFJS623();
      s.onload = res; s.onerror = () => rej(new Error('\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08'));
      document.head.appendChild(s);
    });
    if (!window.pdfjsLib) throw new Error('\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFW623();
  }
  try { if (!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = PDFW623(); } catch {}
}
async function loadJsZip623(){ if (!window.JSZip) await LS623(JSZIP_CDN623); if (!window.JSZip) throw new Error('\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35 ZIP \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08'); }
async function loadXlsx623(){ if (!window.XLSX) await LS623(XLSX_CDN623); if (!window.XLSX) throw new Error('\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35 Excel \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08'); }

/* \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E0A\u0E37\u0E48\u0E2D callClaude \u2014 \u0E2D\u0E48\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 PDF \u0E14\u0E49\u0E27\u0E22 pdf.js \u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E40\u0E23\u0E35\u0E22\u0E01 API \u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01) */
async function callClaude(pdfB64) {
  const binary = atob(pdfB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  await loadPdfJs623();

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let allWords = [];
  let fullText = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (item.str && item.str.trim()) {
        allWords.push({
          str: item.str.trim(),
          x: item.transform ? item.transform[4] : 0,
          y: item.transform ? item.transform[5] : 0
        });
      }
    }

    const sortedItems = [...content.items].sort((a, b) => {
      const yA = a.transform ? a.transform[5] : 0;
      const yB = b.transform ? b.transform[5] : 0;
      const xA = a.transform ? a.transform[4] : 0;
      const xB = b.transform ? b.transform[4] : 0;
      if (Math.abs(yA - yB) > 3) return yB - yA;
      return xA - xB;
    });
    let lastY = null, lines = [], curLine = '';
    for (const item of sortedItems) {
      const y = item.transform ? Math.round(item.transform[5]) : 0;
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (curLine.trim()) lines.push(curLine.trim());
        curLine = item.str;
      } else {
        curLine += (curLine ? ' ' : '') + item.str;
      }
      lastY = y;
    }
    if (curLine.trim()) lines.push(curLine.trim());
    fullText += lines.join('\n') + '\n';
  }
  try { pdf.destroy && pdf.destroy(); } catch {}

  let container = '', house = '';
  const allLines = fullText.split('\n');
  for (let li = 0; li < allLines.length; li++) {
    if (!/master/i.test(allLines[li])) continue;
    const ctx = allLines.slice(Math.max(0, li-1), li+3).join('\n');
    const mPos = ctx.search(/master/i);
    const before = ctx.substring(0, mPos);
    const after  = ctx.substring(mPos + 6);
    const cB = before.match(/\b([A-Z]{3,4}\d{7})\b/i);
    const cA = after.match(/[A-Z]+\/([A-Z0-9]+)|\b([A-Z]{3,4}\d{7})\b/i);
    if (cB) {
      container = cB[1].toUpperCase();
    } else if (cA) {
      container = (cA[1] || cA[2] || '').toUpperCase();
    }
    const hMatch = ctx.match(/use\s*[:\s]+([A-Z]{2,}\d{4,})/i) ||
                   ctx.match(/:([A-Z]{2,}\d{4,})/i);
    if (hMatch) {
      house = hMatch[1].toUpperCase();
    } else {
      const hTokens = (before.match(/\b[A-Z]{2,}\d{4,}\b/gi) || [])
        .filter(t => t.toUpperCase() !== container);
      if (hTokens.length) house = hTokens[hTokens.length-1].toUpperCase();
    }
    break;
  }

  const cleanText = fullText.replace(/[^\x09\x0a\x0d\x20-\x7e\u0E00-\u0E7F]/g, '');
  const data = parsePdfText(cleanText);
  if (container) data.container = container;
  if (house)     data.house_no  = house;
  return data;
}

async function fillExcel(xlsxArrayBuffer, data) {
  await loadJsZip623();
  const zip = await JSZip.loadAsync(xlsxArrayBuffer);
  const ssFile = zip.file('xl/sharedStrings.xml'), shFile = zip.file('xl/worksheets/sheet1.xml');
  if (!ssFile || !shFile) throw new Error('Excel Template \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E1E\u0E1A sheet1 / sharedStrings)');
  let ssRaw    = await ssFile.async('string');
  let sheetRaw = await shFile.async('string');

  const ssList = [];
  const siRx = /<si>([\s\S]*?)<\/si>/g;
  let sm;
  while ((sm = siRx.exec(ssRaw)) !== null) {
    const t2 = /<t[^>]*>([^<]*)<\/t>/g; let tm; const parts = [];
    while ((tm = t2.exec(sm[1])) !== null) parts.push(tm[1]);
    ssList.push(parts.join(''));
  }

  function addSS(val) {
    const s = String(val);
    let idx = ssList.indexOf(s);
    if (idx !== -1) return idx;
    idx = ssList.length;
    ssList.push(s);
    const esc = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    ssRaw = ssRaw.replace('</sst>', `<si><t xml:space="preserve">${esc}</t></si></sst>`);
    return idx;
  }

  function setCellVal(addr, type, val) {
    const tag1 = `<c r="${addr}"`;
    const idx1 = sheetRaw.indexOf(tag1);
    if (idx1 === -1) return;
    const tagEnd = sheetRaw.indexOf('>', idx1);
    if (tagEnd === -1) return;
    const openTag = sheetRaw.substring(idx1, tagEnd + 1);
    const sm2 = openTag.match(/s="(\d+)"/);
    const style = sm2 ? ` s="${sm2[1]}"` : '';
    let newCell;
    if (type === 's') {
      const si = addSS(val);
      newCell = `<c r="${addr}"${style} t="s"><v>${si}</v></c>`;
    } else {
      newCell = `<c r="${addr}"${style}><v>${val}</v></c>`;
    }
    if (sheetRaw[tagEnd - 1] === '/') {
      sheetRaw = sheetRaw.substring(0, idx1) + newCell + sheetRaw.substring(tagEnd + 1);
    } else {
      const closeIdx = sheetRaw.indexOf('</c>', tagEnd);
      if (closeIdx === -1) return;
      sheetRaw = sheetRaw.substring(0, idx1) + newCell + sheetRaw.substring(closeIdx + 4);
    }
  }

  function ds(s) {
    if (!s) return null;
    const p = s.split('/');
    if (p.length !== 3) return null;
    const dt = new Date(+p[2], +p[1]-1, +p[0]);
    return Math.floor((dt - new Date(1899,11,30)) / 86400000);
  }

  function clearFormulaCache() {
    sheetRaw = sheetRaw.replace(/(<c[^>]*>)(<f[^>]*>[^<]*<\/f>)<v>[^<]*<\/v>(<\/c>)/g, '$1$2$3');
    sheetRaw = sheetRaw.replace(/(<c[^>]*>)(<f[^>]*\/>)<v>[^<]*<\/v>(<\/c>)/g, '$1$2$3');
  }

  const container = data.container || (data.master || '').replace(/^[A-Z]+\//, '');
  const custShort = (data.company_invoice || 'IKANO').match(/\w+/)?.[0] || 'IKANO';
  const dateNum   = ds(data.date);

  setCellVal('R5', 's', data.invoice_no || '');
  if (dateNum) setCellVal('R6', 'n', dateNum);
  setCellVal('R8', 's', 'N/A');

  const items = data.items || [];
  for (let i = 0; i < Math.min(items.length, 9); i++) {
    const r    = 13 + i;
    const item = items[i];
    setCellVal(`A${r}`, 'n', item.no);
    if (dateNum) setCellVal(`B${r}`, 'n', dateNum);
    setCellVal(`C${r}`, 's', custShort);
    setCellVal(`D${r}`, 's', item.description);
    setCellVal(`E${r}`, 's', data.house_no || data.house || '');
    setCellVal(`G${r}`, 's', container);
    setCellVal(`H${r}`, 'n', 40);
    setCellVal(`I${r}`, 'n', 1);
    if (item.service_charge > 0) setCellVal(`N${r}`, 'n', item.service_charge);
    if (item.advance_amount  > 0) setCellVal(`R${r}`, 'n', item.advance_amount);
  }

  clearFormulaCache();

  ssRaw = ssRaw
    .replace(/count="\d+"/, `count="${ssList.length}"`)
    .replace(/uniqueCount="\d+"/, `uniqueCount="${ssList.length}"`);

  zip.file('xl/sharedStrings.xml',     ssRaw);
  zip.file('xl/worksheets/sheet1.xml', sheetRaw);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE'
  });
}

async function fillExcelMulti(xlsxTemplateBuf, allExtracted) {
  if (allExtracted.length === 1) {
    return await fillExcel(xlsxTemplateBuf, allExtracted[0].data);
  }
  await loadJsZip623();
  const templateZip = await JSZip.loadAsync(xlsxTemplateBuf);
  const need = ['xl/worksheets/sheet1.xml','xl/sharedStrings.xml','xl/workbook.xml','xl/_rels/workbook.xml.rels','[Content_Types].xml'];
  if (need.some(n => !templateZip.file(n))) throw new Error('Excel Template \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E20\u0E32\u0E22\u0E43\u0E19\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19)');

  let templateSh   = await templateZip.file('xl/worksheets/sheet1.xml').async('string');
  let templateSs   = await templateZip.file('xl/sharedStrings.xml').async('string');
  let templateWb   = await templateZip.file('xl/workbook.xml').async('string');
  let templateRels = await templateZip.file('xl/_rels/workbook.xml.rels').async('string');
  let templateCt   = await templateZip.file('[Content_Types].xml').async('string');

  const ssList = [];
  let ssXml = templateSs;
  const siRx = /<si>([\s\S]*?)<\/si>/g;
  let siM;
  while ((siM = siRx.exec(ssXml)) !== null) {
    const t2 = /<t[^>]*>([^<]*)<\/t>/g; let tm; const parts = [];
    while ((tm = t2.exec(siM[1])) !== null) parts.push(tm[1]);
    ssList.push(parts.join(''));
  }

  function addSS(val) {
    const s = String(val);
    let idx = ssList.indexOf(s);
    if (idx !== -1) return idx;
    idx = ssList.length; ssList.push(s);
    const esc = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    ssXml = ssXml.replace('</sst>', `<si><t xml:space="preserve">${esc}</t></si></sst>`);
    return idx;
  }

  function setCellInSheet(sh, addr, type, val) {
    const tag1 = `<c r="${addr}"`;
    const idx1 = sh.indexOf(tag1);
    if (idx1 === -1) return sh;
    const tagEnd = sh.indexOf('>', idx1);
    if (tagEnd === -1) return sh;
    const openTag = sh.substring(idx1, tagEnd + 1);
    const sm2 = openTag.match(/s="(\d+)"/);
    const style = sm2 ? ` s="${sm2[1]}"` : '';
    let newCell;
    if (type === 's') {
      const si = addSS(val);
      newCell = `<c r="${addr}"${style} t="s"><v>${si}</v></c>`;
    } else {
      newCell = `<c r="${addr}"${style}><v>${val}</v></c>`;
    }
    if (sh[tagEnd - 1] === '/') {
      return sh.substring(0, idx1) + newCell + sh.substring(tagEnd + 1);
    }
    const closeIdx = sh.indexOf('</c>', tagEnd);
    if (closeIdx === -1) return sh;
    return sh.substring(0, idx1) + newCell + sh.substring(closeIdx + 4);
  }

  function ds(s) {
    if (!s) return null;
    const p = s.split('/');
    if (p.length !== 3) return null;
    const dt = new Date(+p[2], +p[1]-1, +p[0]);
    return Math.floor((dt - new Date(1899,11,30)) / 86400000);
  }

  const sheetXmls  = [];
  const sheetNames = [];
  const n = allExtracted.length;

  for (let i = 0; i < n; i++) {
    const { data } = allExtracted[i];
    const sheetName = (data.invoice_no || `Sheet${i+1}`).substring(0, 31);
    let sh = templateSh;

    const container = data.container || (data.master || '').replace(/^[A-Z]+\//, '');
    const custShort = (data.company_invoice || 'IKANO').match(/\w+/)?.[0] || 'IKANO';
    const dateNum   = ds(data.date);

    sh = setCellInSheet(sh, 'R5', 's', data.invoice_no || '');
    if (dateNum) sh = setCellInSheet(sh, 'R6', 'n', dateNum);
    sh = setCellInSheet(sh, 'R8', 's', 'N/A');

    const items = data.items || [];
    for (let j = 0; j < Math.min(items.length, 9); j++) {
      const r    = 13 + j;
      const item = items[j];
      sh = setCellInSheet(sh, `A${r}`, 'n', item.no);
      if (dateNum) sh = setCellInSheet(sh, `B${r}`, 'n', dateNum);
      sh = setCellInSheet(sh, `C${r}`, 's', custShort);
      sh = setCellInSheet(sh, `D${r}`, 's', item.description);
      sh = setCellInSheet(sh, `E${r}`, 's', data.house_no || data.house || '');
      sh = setCellInSheet(sh, `G${r}`, 's', container);
      sh = setCellInSheet(sh, `H${r}`, 'n', 40);
      sh = setCellInSheet(sh, `I${r}`, 'n', 1);
      if (item.service_charge > 0) sh = setCellInSheet(sh, `N${r}`, 'n', item.service_charge);
      if (item.advance_amount  > 0) sh = setCellInSheet(sh, `R${r}`, 'n', item.advance_amount);
    }

    sh = sh.replace(/(<c[^>]*>)(<f[^>]*>[^<]*<\/f>)<v>[^<]*<\/v>(<\/c>)/g, '$1$2$3');
    sh = sh.replace(/(<c[^>]*>)(<f[^>]*\/>)<v>[^<]*<\/v>(<\/c>)/g, '$1$2$3');

    sheetXmls.push(sh);
    sheetNames.push(sheetName);
  }

  ssXml = ssXml
    .replace(/count="\d+"/, `count="${ssList.length}"`)
    .replace(/uniqueCount="\d+"/, `uniqueCount="${ssList.length}"`);

  const newSheetsXml = '<sheets>' +
    sheetNames.map((name, i) => `<sheet name="${name}" sheetId="${i+1}" r:id="rId${i+10}"/>`).join('') +
    '</sheets>';
  const finalWb = templateWb.replace(/<sheets>[\s\S]*?<\/sheets>/, newSheetsXml);

  const existingNonSheet = templateRels.replace(/<Relationship[^>]*worksheets\/sheet[^>]*\/>/g, '');
  const newSheetRels = sheetNames.map((_, i) =>
    `<Relationship Id="rId${i+10}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`
  ).join('');
  const finalRels = existingNonSheet.replace('</Relationships>', newSheetRels + '</Relationships>');

  const existingNonSheetCt = templateCt.replace(/<Override[^>]*worksheets\/sheet\d+[^>]*\/>/g, '');
  const newSheetCt = sheetNames.map((_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('');
  const finalCt = existingNonSheetCt.replace('</Types>', newSheetCt + '</Types>');

  const outZip = new JSZip();
  const skipFiles = new Set([
    'xl/worksheets/sheet1.xml','xl/sharedStrings.xml',
    'xl/workbook.xml','xl/_rels/workbook.xml.rels',
    '[Content_Types].xml','xl/calcChain.xml'
  ]);

  for (const [fname, file] of Object.entries(templateZip.files)) {
    if (!file.dir && !skipFiles.has(fname)) {
      outZip.file(fname, await file.async('uint8array'));
    }
  }

  for (let i = 0; i < n; i++) {
    outZip.file(`xl/worksheets/sheet${i+1}.xml`, sheetXmls[i]);
  }
  outZip.file('xl/sharedStrings.xml',     ssXml);
  outZip.file('xl/workbook.xml',           finalWb);
  outZip.file('xl/_rels/workbook.xml.rels', finalRels);
  outZip.file('[Content_Types].xml',       finalCt);

  return await outZip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE'
  });
}

function buildPdfHtml623(wb) {
  function cv(ws, addr) {
    const c = ws[addr];
    if (!c) return '';
    if (c.t === 'd' || c.v instanceof Date) {
      const d = c.v instanceof Date ? c.v : new Date((c.v-25569)*86400000);
      return `${String(d.getDate()).padStart(2,'0')}-${d.toLocaleString('en',{month:'short'})}-${String(d.getFullYear()).slice(2)}`;
    }
    return c.v ?? '';
  }
  function num(v) {
    if (!v && v !== 0) return '';
    const n = parseFloat(v);
    if (isNaN(n) || n === 0) return '';
    return n.toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  let allHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
body{background:#fff}
.page{width:277mm;padding:6mm 8mm;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3mm}
.co-name{font-size:10pt;font-weight:bold}
.co-sub{font-size:7pt;margin-top:1mm;line-height:1.4}
.inv-box{border:2px solid #000;padding:2mm 6mm;font-size:12pt;font-weight:bold;text-align:center}
.info-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;margin-bottom:2mm}
.info-left,.info-right{padding:1.5mm 2mm}
.info-row{display:flex;gap:2mm;font-size:7pt;margin-bottom:1mm}
.lbl{color:#555;min-width:20mm}
.val{font-weight:bold}
.inv-no{font-size:9pt;font-weight:bold}
table{width:100%;border-collapse:collapse}
th{background:#1e40af;color:#fff;font-size:6pt;padding:1.5mm 1mm;text-align:center;border:0.5px solid #4b6cb7;line-height:1.3}
td{font-size:6.5pt;padding:1.5mm 1mm;border:0.5px solid #ccc;text-align:center;height:7mm}
td.desc{text-align:left}
td.num{text-align:right}
td.svc{background:#fffbeb}
td.adv{background:#eff6ff}
.totals{display:flex;justify-content:flex-end;margin-top:2mm}
.tot-table td{border:none;font-size:7.5pt;padding:0.8mm 2mm}
.tot-label{text-align:right;min-width:45mm}
.tot-val{text-align:right;min-width:25mm;border-bottom:0.5px solid #999}
.tot-grand td{font-weight:bold;font-size:8pt}
.footer{display:flex;justify-content:space-between;margin-top:6mm;font-size:7pt}
.f-box{width:30%;text-align:center}
.f-title{font-weight:bold;margin-bottom:2mm}
.f-sig{border-top:1px solid #000;margin-top:10mm;padding-top:1mm}
.f-who{font-size:6.5pt;margin-top:1mm}
.remark{font-size:7pt;margin-top:3mm}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{page-break-after:always;margin:0}
  .no-print{display:none!important}
}
</style></head><body>`;

  allHtml += `<div class="no-print" style="position:fixed;top:8px;right:8px;z-index:9999;display:flex;gap:8px">
<button onclick="window.print()" style="padding:10px 18px;background:#1e40af;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)">\uD83D\uDDA8\uFE0F Print / Save PDF</button>
<button onclick="window.close()" style="padding:10px 18px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer">\u2715 \u0E1B\u0E34\u0E14</button>
</div>`;

  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const c = (addr) => cv(ws, addr);

    let itemRows = '';
    let itemCount = 0;
    for (let r = 13; r <= 21; r++) {
      const no = c(`A${r}`); if (!no) continue;
      itemCount++;
      const svc = parseFloat(ws[`N${r}`]?.v || 0);
      const adv = parseFloat(ws[`R${r}`]?.v || 0);
      const tot = svc + adv;
      itemRows += `<tr>
        <td>${no}</td>
        <td>${c(`B${r}`)}</td>
        <td>${c(`C${r}`)}</td>
        <td class="desc">${c(`D${r}`)}</td>
        <td>${c(`E${r}`)}</td>
        <td></td>
        <td>${c(`G${r}`)}</td>
        <td>${c(`H${r}`)}</td>
        <td>${c(`I${r}`)}</td>
        <td class="num"></td><td class="num"></td><td class="num"></td>
        <td class="num adv">${num(adv>0 ? adv : '')}</td>
        <td class="num svc">${num(svc>0 ? svc : '')}</td>
        <td class="num"></td><td class="num"></td><td class="num"></td>
        <td class="num adv">${num(adv>0 ? adv : '')}</td>
        <td class="num" style="font-weight:bold">${num(tot > 0 ? tot : '')}</td>
      </tr>`;
    }
    for (let i = itemCount; i < 9; i++) {
      itemRows += `<tr>${'<td></td>'.repeat(19)}</tr>`;
    }

    allHtml += `<div class="page">
<div class="top">
  <div>
    <div class="co-name">${c('A1')}</div>
    <div class="co-sub">${(c('A2')||'').replace(/\n/g,'<br>')}</div>
    <div class="co-sub">${c('A3')}</div>
  </div>
  <div style="text-align:right">
    <div class="inv-box">INVOICE</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-left">
    <div class="info-row"><span class="lbl">Customer :</span><span class="val">${c('C5')}</span></div>
    <div class="info-row"><span class="lbl">Address :</span><span>${c('C6')}</span></div>
    <div class="info-row"><span class="lbl">Tel :</span><span>${c('C7')}</span></div>
    <div class="info-row"><span class="lbl">Tax ID :</span><span>${c('C8')}</span></div>
  </div>
  <div class="info-right">
    <div class="info-row"><span class="lbl">Invoice no. :</span><span class="inv-no">${c('R5')}</span></div>
    <div class="info-row"><span class="lbl">Invoice Date :</span><span class="val">${c('R6')}</span></div>
    <div class="info-row"><span class="lbl">Due Date :</span><span></span></div>
    <div class="info-row"><span class="lbl">Kewill / PO No. :</span><span>${c('R8')}</span></div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th rowspan="3" style="width:6mm">\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48</th>
      <th rowspan="3" style="width:15mm">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19</th>
      <th rowspan="3" style="width:14mm">\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
      <th rowspan="3" style="width:52mm">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
      <th rowspan="3" style="width:22mm">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E08\u0E2D\u0E07</th>
      <th rowspan="3" style="width:12mm">\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07</th>
      <th rowspan="3" style="width:22mm">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E15\u0E39\u0E49</th>
      <th rowspan="3" style="width:9mm">\u0E02\u0E19\u0E32\u0E14\u0E15\u0E39\u0E49</th>
      <th rowspan="3" style="width:9mm">\u0E08\u0E33\u0E19\u0E27\u0E19</th>
      <th colspan="5">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E0A\u0E37\u0E48\u0E2D Maersk Logistics</th>
      <th colspan="5">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th>
      <th rowspan="3">\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21</th>
    </tr>
    <tr>
      <th>\u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07</th><th>\u0E04\u0E48\u0E32\u0E22\u0E01\u0E15\u0E39\u0E49</th><th>\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19</th><th>\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19</th><th style="background:#b45309">\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23</th>
      <th>\u0E04\u0E48\u0E32\u0E22\u0E01\u0E15\u0E39\u0E49</th><th>\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19</th><th style="background:#1d4ed8">\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19</th><th>\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19</th><th>?</th>
    </tr>
    <tr>
      <th>Transport</th><th>LOLO/GATE</th><th>Other-VAT</th><th>Other-NON VAT</th><th style="background:#b45309">Service Charge</th>
      <th>LOLO/GATE</th><th>Other-VAT</th><th style="background:#1d4ed8">Other-NON VAT</th><th>Labor Charge</th><th>Total Amount</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="remark">REMARK :</div>

<div class="totals">
  <table class="tot-table">
    <tr><td class="tot-label">Total (Before Vat)</td><td class="tot-val"></td></tr>
    <tr><td class="tot-label">VAT 7%</td><td class="tot-val"></td></tr>
    <tr class="tot-grand"><td class="tot-label">Total (After VAT)</td><td class="tot-val"></td></tr>
    <tr><td class="tot-label">WHT 1%</td><td class="tot-val"></td></tr>
    <tr><td class="tot-label">WHT Code</td><td class="tot-val"></td></tr>
    <tr class="tot-grand"><td class="tot-label">Total (After WHT)</td><td class="tot-val"></td></tr>
  </table>
</div>

<div class="footer">
  <div class="f-box">
    <div class="f-title">Withholding Tax Detail</div>
    <div style="font-size:6.5pt;margin-top:2mm">1% Transportation : ___________</div>
    <div style="font-size:6.5pt;margin-top:1mm">3% Service : ___________</div>
  </div>
  <div class="f-box">
    <div class="f-title">For The Customer</div>
    <div class="f-sig">\u0E1C\u0E39\u0E49\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</div>
    <div class="f-who">\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D ________________________</div>
    <div class="f-who">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ________________________</div>
  </div>
  <div class="f-box">
    <div class="f-title">For The N.J. LOGISTICS & FRUITS CO.,LTD</div>
    <div class="f-sig">\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</div>
    <div class="f-who">\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D DARUNEE.T</div>
    <div class="f-who">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ________________________</div>
  </div>
</div>
</div>`;
  }
  allHtml += '</body></html>';
  return allHtml;
}

function readB64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); }); }
function readBuf(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsArrayBuffer(file); }); }
function fmt(v){ return typeof v==='number' ? v.toLocaleString('th-TH',{minimumFractionDigits:2}) : (v||'0.00'); }
const esc623 = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u0E2B\u0E19\u0E49\u0E32 (render) \u2014 state \u0E15\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32 1 \u0E04\u0E23\u0E31\u0E49\u0E07
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function render(container){
  ensureAssets623();
  container.innerHTML = HTML623;
  const root = container.querySelector('#pdfi623');
  const $ = id => root.querySelector('#' + id);

  let pdfFiles = [], xlsxFile = null;
  let extractedData = null, filledWorkbook = null, filledBlob = null, allExtracted = [];
  let toastTimer;

  function showToast(msg, type='') {
    const el = $('toast');
    el.textContent = msg; el.className = 'pdfi623-toast'; el.classList.add('show');
    if (type) el.classList.add(type);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  function setStep(n,state) {
    const el = $('ps'+n);
    el.classList.remove('active','done','error');
    el.classList.add(state);
    const spin = el.querySelector('.spinner');
    if (spin) spin.remove();
    const icon = el.querySelector('.p-icon');
    if (state==='active') { const s=document.createElement('div'); s.className='spinner'; el.insertBefore(s,icon); icon.style.display='none'; }
    else { if(icon) icon.style.display=''; if(state==='done') icon.textContent='\u2705'; if(state==='error') icon.textContent='\u274C'; }
  }

  function checkReady() {
    $('processBtn').disabled = !(pdfFiles.length > 0 && xlsxFile);
  }

  function setupDrop(zoneId, inputId, nameId, setter) {
    const zone = $(zoneId), inp = $(inputId), nameEl = $(nameId);
    inp.addEventListener('change', e => { const f = e.target.files[0]; if(f) pick(f); });
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop',      e => { e.preventDefault(); zone.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if(f) pick(f); });
    function pick(f) { setter(f); nameEl.textContent = '\u2705 ' + f.name; zone.classList.add('has-file'); }
  }

  function setupDropMulti(zoneId, inputId, nameId, setter) {
    const zone = $(zoneId), inp = $(inputId), nameEl = $(nameId);
    inp.addEventListener('change', e => {
      const files = [...e.target.files];
      if(files.length) pick(files);
    });
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag-over');
      const files = [...e.dataTransfer.files].filter(f => f.name.endsWith('.pdf'));
      if(files.length) pick(files);
    });
    function pick(files) {
      setter(files);
      nameEl.textContent = files.length === 1
        ? '\u2705 ' + files[0].name
        : `\u2705 ${files.length} \u0E44\u0E1F\u0E25\u0E4C: ${files.map(f=>f.name.replace('.pdf','')).join(', ')}`;
      zone.classList.add('has-file');
    }
  }

  function renderResult(data) {
    const fields = [
      {l:'Invoice No',v:data.invoice_no},{l:'\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48',v:data.date},{l:'Job No',v:data.job_no},
      {l:'Decl No',v:data.decl_no},{l:'Customer PO',v:data.customer_po},{l:'House',v:data.house}
    ];
    $('resultFields').innerHTML = fields.map(f=>
      `<div class="rf"><div class="rf-label">${f.l}</div><div class="rf-val">${esc623(f.v||'-')}</div></div>`
    ).join('');
    $('resultItems').innerHTML = (data.items||[]).map(it=>
      `<tr>
        <td>${esc623(it.no)}</td>
        <td>${esc623(it.description)}</td>
        <td><span class="tag ${it.type==='advance'?'tag-adv':'tag-svc'}">${it.type==='advance'?'Advance':'Service'}</span></td>
        <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600">
          ${fmt(it.type==='advance'?it.advance_amount:it.service_charge)}
        </td>
      </tr>`).join('');
    const tots=[
      {l:'SubTotal (VAT)',v:data.subtotal_vat},{l:'VAT 7%',v:data.vat_7},
      {l:'Total',v:data.total},{l:'Advance',v:data.advance},{l:'GRAND TOTAL',v:data.grand_total,g:true}
    ];
    $('resultTotals').innerHTML = tots.map(t=>
      `<div class="tot${t.g?' grand':''}"><div class="tot-label">${t.l}</div><div class="tot-val">${fmt(t.v)}</div></div>`
    ).join('');
    $('resultCard').classList.remove('hidden');
    $('dlBtn').style.display = 'block';
  }

  async function processFiles() {
    $('processBtn').disabled = true;
    $('progressWrap').classList.remove('hidden');
    $('resultCard').classList.add('hidden');
    for (let i=1;i<=6;i++){ const el=$('ps'+i); el.classList.remove('active','done','error'); const sp=el.querySelector('.spinner'); if(sp) sp.remove(); const ic=el.querySelector('.p-icon'); if(ic){ ic.style.display=''; ic.textContent=['\uD83D\uDCC4','\uD83D\uDD0D','\uD83D\uDCCA','\u270F\uFE0F','\uD83D\uDCBE','\u2705'][i-1]; } }
    extractedData = null; filledWorkbook = null; filledBlob = null; allExtracted = [];

    const files = pdfFiles.slice();
    const totalPDFs = files.length;

    try {
      // Step 1: \u0E2D\u0E48\u0E32\u0E19 PDF \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14
      setStep(1,'active');
      const allB64 = [];
      for (const f of files) {
        allB64.push(await readB64(f));
      }
      setStep(1,'done');

      // Step 2: \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C PDF \u0E17\u0E35\u0E25\u0E30\u0E43\u0E1A
      setStep(2,'active');
      for (let i = 0; i < allB64.length; i++) {
        const data = await callClaude(allB64[i]);
        allExtracted.push({ data, file: files[i] });
      }
      extractedData = allExtracted[allExtracted.length - 1]?.data;
      setStep(2,'done');

      // Step 3: \u0E42\u0E2B\u0E25\u0E14 Template
      setStep(3,'active');
      const xlsxBuf = await readBuf(xlsxFile);
      setStep(3,'done');

      // Step 4: \u0E2A\u0E23\u0E49\u0E32\u0E07 Excel \u0E23\u0E27\u0E21 (\u0E2B\u0E25\u0E32\u0E22 Sheet)
      setStep(4,'active');
      filledBlob = await fillExcelMulti(xlsxBuf, allExtracted);
      filledWorkbook = true;
      setStep(4,'done');

      // Step 5: \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07 Supabase (\u0E15\u0E32\u0E23\u0E32\u0E07 finance \u0E40\u0E14\u0E34\u0E21 \u00B7 insert \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u00B7 Login \u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E25\u0E31\u0E01)
      setStep(5,'active');
      const cs = csName623();
      for (const { data } of allExtracted) {
        const { error } = await SB623().from('finance').insert({
          cs:              cs,
          invoice_no:      data.invoice_no      || '',
          date:            data.date             || '',
          customer_job:    data.job_no           || '',
          dcl_inv:         data.decl_no          || '',
          master:          data.master           || '',
          house:           data.house            || '',
          company_invoice: data.company_invoice  || '',
          item:            (data.items||[]).map(i=>i.description).join(' | '),
          data_type:       'IMPORT',
          service_charge:  data.subtotal_vat     || 0,
          advance:         data.advance          || 0,
          vat:             data.vat_7            || 0,
          amount:          data.total            || 0,
          total_amount:    data.grand_total      || 0,
          remark:          `Invoice: ${data.invoice_no||''}`
        });
        if (error) throw new Error(error.message || String(error));
      }
      setStep(5,'done');
      setStep(6,'done');

      renderResult(extractedData);
      const msg = totalPDFs > 1
        ? `\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ${totalPDFs} Invoice \u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19 ${totalPDFs} Sheet \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!`
        : '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!';
      showToast(msg, 'success');

    } catch(e) {
      for(let i=1;i<=6;i++){
        if($('ps'+i).classList.contains('active')){ setStep(i,'error'); break; }
      }
      showToast('\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: ' + ((e && e.message) || e), 'error');
      $('processBtn').disabled = false;
    }
  }

  function downloadExcel() {
    if (!filledBlob) { showToast('\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 Excel Template \u0E04\u0E23\u0E31\u0E1A','error'); return; }
    const url = URL.createObjectURL(filledBlob);
    const a   = document.createElement('a');
    a.href    = url;
    const names = pdfFiles.map(f => f.name.replace('.pdf','')).join('_');
    a.download = (pdfFiles.length > 1 ? 'NJ_Invoice_Combined' : names) + '_filled.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportPdfAll() {
    if (!filledBlob) { showToast('\u0E01\u0E23\u0E38\u0E13\u0E32\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E04\u0E23\u0E31\u0E1A','error'); return; }
    try {
      await loadXlsx623();
      const arrayBuf = await filledBlob.arrayBuffer();
      const wb = XLSX.read(arrayBuf, { type: 'array', cellDates: true });
      const allHtml = buildPdfHtml623(wb);
      const win = window.open('', '_blank');
      if (!win) { showToast('\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 Pop-up \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07','error'); return; }
      win.document.write(allHtml);
      win.document.close();
    } catch(e) {
      showToast('Export PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: ' + ((e && e.message) || e), 'error');
    }
  }

  setupDropMulti('pdfZone', 'pdfInput', 'pdfName', files => { pdfFiles = files; checkReady(); });
  setupDrop('xlsxZone', 'xlsxInput', 'xlsxName', f => { xlsxFile = f; checkReady(); });
  $('processBtn').addEventListener('click', processFiles);
  $('dlBtn').addEventListener('click', downloadExcel);
  $('pdfBtn').addEventListener('click', exportPdfAll);
}

export{render,parsePdfText as __pdfi623Parse,buildPdfHtml623 as __pdfi623Html};
