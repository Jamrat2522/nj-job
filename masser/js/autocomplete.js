// =========================================================
// autocomplete.js — Autocomplete data + dropdown engine
// Data identical to old system (extracted verbatim from HTML)
// =========================================================

import { esc } from './utils.js';

// ========== COMPANIES (145 entries) ==========
export const AC_COMPANIES = [
  '4Care INNO Co., Ltd.','AAR COMPONENT SERVICES (THAILAND) LTD.','ABB ELECTRIFICATION (THAILAND) CO.,LTD.',
  'ADELSON SUPPLY CHAIN (THAILAND) CO., LTD.','AIR INTERNATIONAL THERMAL SYSTEMS (THAILAND)LTD.','AKC ALL',
  'AMERICAN EMBASS','ANCA MANUFACTURING(THAILAND) LTD','ASIA CEMENT PUBLIC CO.,LTD.','AUTO ALLIANCE (THAILAND) CO.,LTD.',
  'BAN LEONG CHIN INTER CO.,LTD.','BELIEVING BEYOND CO., LTD','BENCHMARK ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED',
  'BETA PACKAGE PRODUCTS (THAILAND) CO.,LTD.','BLUECHIPS MICROHOUSE CO.,LTD.','BORGWARNER PDS (THAILAND) LTD.',
  'BRIDGESTONE AIRCRAFT TIRE MANUFACTURING (THAILAND) CO., LTD.','BROSE (THAILAND) CO.,LTD','BYD AUTO COMPONENTS (THAILAND) CO.,LTD',
  'CAL-COMP ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED','CARGILL SIAM LIMITED','CATERPILLAR (THAILAND) LIMITED',
  'CELESTICA (THAILAND) LIMITED.','CELLTRION HEALTHCARE (THAILAND) LTD.','CEVA AIR AND OCEAN (THAILAND) CO.,LTD.',
  'CHAMPACA LUMBER CO.,LTD.','CHOGORI TECHNOLOGY (THAILAND) CO.,LTD','COLGATE PALMOLIVE (THAILAND) LTD.',
  'CONTINENTAL TYRES(THAILAND) CO.,LTD.','CYBER PRINT','CYBERPAX CO.,LTD','DAIDO ELECTRONICS (THAILAND) CO.,LTD.',
  'DAIKIN INDUSTRIES (THAILAND) LTD.','DATAMARS (THAILAND) LTD.','DECATHLON (THAILAND) CO.,LTD.',
  'DELTA ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED.','DHL SUPPLY (THAILAND) LTD.','DONALDSON (THAILAND) LTD.',
  'DZ CARD (THAILAND) LTD.','ECCO (THAILAND) CO.,LTD.','ELECTROLUX PROFESSIONAL(THAILAND)CO.,LTD',
  'ELECTROLUX THAILAND CO.,LTD','ELECTROLUX THAILAND CO.,LTD.','ESSILORLUXOTTICA (THAILAND) LTD.',
  'ETK EMS ASIA PRODUCTIONS LTD.','FAURECIA EMISSIONS CONTROL TECHNOLOGIES (THAILAND)','FONTERRA BRANDS (THAILAND) LTD.',
  'FORD MOTOR COMPANY (THAILAND) LIMITED','FORD SALES & SERVICE (THAILAND) CO.,LTD','FORMULA INTERTRADE CO.,LTD.',
  'FU-TECH TECHNOLOGY CORPORATION LIMITED','GOODYEAR (THAILAND) PUBLIC COMPANY LIMITED','GROHE SIAM LIMITED',
  'HALEON CONSUMER HEALTH (THAILAND) LIMITED','HAN YANG M-TECH (THAILAND) CO.,LTD.','HARLEY-DAVIDSON (THAILAND) COMPANY LIMITED',
  'HIGASKET PLASTICS GROUP (THAILAND) CO.,LTD.','HOYA LAMPHUN LTD.','HP INC (THAILAND) LTD.','IKANO (THAILAND) LIMITED',
  'IKM TESTING (THAILAND) CO.,LTD.','INTERVET (THAILAND) LTD','IT CITY Public Company Limited',
  'JD SPORTS FASHION (THAILAND) LTD.','JIEI (THAILAND) CO.,LTD.','KCE TECHNOLOGY COMPANY LIMITED',
  'KOHLER (THAILAND) PUBLIC COMPANY LIMITED','KUEHNE PLUS NAGEL LTD.','LIGHTECH  ELECTRONIC (THAILAND) CO.,LTD',
  'MANN AND HUMMEL (THAILAND) LTD.','MEDTRONIC (THAILAND)LIMITED','MERCK LTD.','METALSA (THAILAND) CO., LTD.',
  'MI MANUFACTURING (THAILAND) LIMITED','MICHELIN SIAM CO.,LTD','MITSUBISHI ELECTRIC CONSUMER PRODUCTS (THAILAND) CO.,LTD.',
  'MLOPTIC (THAILAND) CO.,LTD','MRP ENGINEERING CO.,LTD','MSX INTERNATIONAL LTD.','M-TEK INDUSTRIAL (THAILAND) CO.,LTD',
  'N.J.LOGISTICS & FRUITS CO.,LTD.','NEOCOSMED CO.,LTD.','NEOPERL ASIA PACIFIC CO.,LTD.','NICE APPAREL COMPANY LIMITED',
  'NP INDUSTRIAL SUPPLY CO.,LTD.','OKUMURA METALS (THAILAND) CO.,LTD.','OMS OILFIELD SERVICES (THAILAND) LTD',
  'PACIFIC BIOTECH CO.,LTD (C/O ORASURE TECHNOLOGIESINC.)','PHAIRAT RECYCLE AND SUPPLY LIMITED PARTNERSHIP',
  'PROCTER & GAMBLE MANUFACTURING (THAILAND) LTD.','PROCTER & GAMBLE TRADING (THAILAND) LTD',
  'REAL TRUCK  (THAILAND) LIMITED','REALRARE GROUP CO.,LTD','REHAU LTD.','Revima Asia Pacific Ltd.',
  'RIGHT COMPOSITES (THAILAND) CO.,LTD','ROECHLING AUTOMOTIVE CHONBURI COMPANY  LIMITED','ROYAL CANIN (THAILAND) CO.,LTD',
  'RUNNER INDUSTRY (THAILAND) CO.,LTD.','RYU LOGISTIC CO.,LTD.','S.C. JOHNSON & SON LTD.','SAMHWA INDUSTRIAL(THAILAND)CO.,LTD.',
  'SANDOZ (THAILAND) LIMITED','SANHUA INTELLIGENT DRIVE (THAILAND) CO.,LTD','SANKO (PLASTICS) THAILAND CO.,LTD',
  'SATO-SHOJI (THAILAND) CO.,LTD.','SATYS ELECTRIC (THAILAND) CO., LTD.','SCHAEFFLER MANUFACTURING (THAILAND) CO.,LTD.',
  'SCHENKER (THAI) LTD.','SCHENKER 0016','SHARP APPLIANCES (THAILAND) LIMITED','SHARP THAI CO.,LTD.',
  'SIAM KRAFT INDUSTRY CO.,LTD.','SIG COMBIBLOC LTD.','SIS DISTRIBUTION (THAILAND) PUBLIC COMPANY LIMITED',
  'SM TRUE CO.,LTD.','SMART TECHNOLOGY MANUFACTURING (THAILAND) CO.,LTD','SMOKERS CHOICE THAILAND CO., LTD',
  'SPACE STORAGE (SAAR) (THAILAND) CO.,LTD.','STAEDTLER (THAILAND) LTD.','Star But (Thailand) Co.,Ltd.',
  'STAUFF (THAILAND) CO. LTD.','STEX Electronics (Thailand) Co., Ltd.','STEX ELECTRONICS (THAILAND) CO.,LTD.',
  'SUMITOMO RUBBER (THAILAND) CO.,LTD.','SUPAVUT INDUSTRY CO.,LTD','SYNNEX (THAILAND) PUBLIC CO.,LTD',
  'SYSTEM WORLD CO., LTD.','TETRA PAK (THAILAND) LIMITED','THAI AIRWAYS INTERNATIONAL PUBLIC COMPANY LIMITED',
  'THAI GYPSUM PRODUCTS PCL.','THAI SHIBAURA DENSHI CO.,LTD.','THAI STEEL CABLE PUBLIC COMPANY LIMITED',
  'THAI XM CO., LTD.','THE SHELL CO.OF THAILAND LTD.','THE SHELL COMPANY OF THAILAND LIMITED',
  'THREE-COLOR STONE (THAILAND) CO., LTD.','TOYO FILLING INTERNATIONAL CO.,LTD.','TREK BICYCLE (THAILAND) CO., LTD.',
  'TRIUMPH INTERNATIONAL (THAILAND) LTD.','TRIUMPH MOTORCYCLES (THAILAND) LTD.','TRIUMPH STRUCTURES(THAILAND)LTD.',
  'TS MOLYMER CO.,LTD.','TYRON RUBBER CO.,LTD.','UNIQLO (THAILAND) COMPANY LIMITED','VALMET CO., LTD.',
  'VIKING LIFE-SAVING EQUIPMENT(THAILAND) LTD.','VISIONGLASS AND DOOR INDUSTRIAL CO.,LTD','VOSSEN MANUFACTURE (THAILAND) CO.,LTD.',
  'WELLDONE TIRE 2020 COMPANY LIMITED.','WESTERN DIGITAL STORAGE TECHNOLOGIES','WISETEK SOLUTION (THAILAND)LIMITED',
  'WORLD COURIER ASIA (THAILAND) CO.,LTD','WORLD INDUSTRY (THAILAND) CO., LTD','WORLD INDUSTRY (THAILAND) CO.,LTD',
  'YIDA NEW MATERIA (THAILAND) CO.,LTD.'
];

// ========== LOCATIONS (~85 entries) ==========
export const AC_LOCATIONS = [
  'ท่าเรือ A2','ท่าเรือ A2: จิงเจียง','ท่าเรือ A2: Wan Hai','ท่าเรือ A2: Interasia',
  'ท่าเรือ A3','ท่าเรือ A3: Yang Ming','ท่าเรือ A3: SM Line',
  'ท่าเรือ B1','ท่าเรือ B1: Sinokor','ท่าเรือ B1: KMTC','ท่าเรือ B1: Namsung','ท่าเรือ B1: CK Line','ท่าเรือ B1: Hwang-Ae',
  'ท่าเรือ B2','ท่าเรือ B2: Evergreen',
  'ท่าเรือ B3','ท่าเรือ B3: CU Line',
  'ท่าเรือ B4',
  'ท่าเรือ B5','ท่าเรือ B5: Ben Line','ท่าเรือ B5: ZIM','ท่าเรือ B5: Samudera',
  'ท่าเรือ AO','ท่าเรือ C1&C2','ท่าเรือ D1D2',
  'ท่าเรือ C3','ท่าเรือ C3: Star Line','ท่าเรือ C3: TS Line',
  'JWD','Saim Seaport','Saim Seaport: KERRY',
  'รอบตึก','รอบตึก: ONE','รอบตึก: ด่านตรวจพืช','รอบตึก: H.I.T','รอบตึก: AGN','รอบตึก: Kuehne+Nagel',
  'รอบตึก: ECU','รอบตึก: Transcontainer','รอบตึก: EMS','รอบตึก: Legend','รอบตึก: Renus','รอบตึก: GENETICS',
  'รอบตึก: APL Penanshin','รอบตึก: รถทัวร์','รอบตึก: Shipco','รอบตึก: ลานไพลอท',
  'ตึกทะเลทอง ชั้น 0','ตึกทะเลทอง ชั้น 0: IKANO',
  'ตึกทะเลทอง ชั้น 2','ตึกทะเลทอง ชั้น 2: DHL',
  'ตึกทะเลทอง ชั้น 5','ตึกทะเลทอง ชั้น 5: Schenker','ตึกทะเลทอง ชั้น 5: DSV',
  'ตึกทะเลทอง ชั้น 6','ตึกทะเลทอง ชั้น 6: OOCL','ตึกทะเลทอง ชั้น 6: CMA',
  'ตึกทะเลทอง ชั้น 7','ตึกทะเลทอง ชั้น 7: Maersk',
  'ตึกทะเลทอง ชั้น 9','ตึกทะเลทอง ชั้น 9: MSC',
  'ตึกทะเลทอง ชั้น 10','ตึกทะเลทอง ชั้น 10: Pilot','ตึกทะเลทอง ชั้น 10: HMM','ตึกทะเลทอง ชั้น 10: CEVA','ตึกทะเลทอง ชั้น 10: Freight Link',
  'ตึกทะเลทอง ชั้น 11','ตึกทะเลทอง ชั้น 11: Hapag-Lloyd','ตึกทะเลทอง ชั้น 11: Evergreen','ตึกทะเลทอง ชั้น 11: LEO',
  'ตึกทะเลทอง ชั้น 12','ตึกทะเลทอง ชั้น 12: COSCO','ตึกทะเลทอง ชั้น 12: NTL',
  'ตึกทะเลทอง ชั้น 15','ตึกทะเลทอง ชั้น 15: Sunfar',
  'หน่วยงานราชการ / ด่าน','หน่วยงานราชการ / ด่าน: อ.ย.','หน่วยงานราชการ / ด่าน: ด่านแหลมฉบัง',
  'หน่วยงานราชการ / ด่าน: กรมป่าไม้','หน่วยงานราชการ / ด่าน: กรมปศุสัตว์','หน่วยงานราชการ / ด่าน: ด่านตรวจพืช',
  'วางบิลรอบนอก','วางบิลรอบนอก: Thaiam','วางบิลรอบนอก: Kuehne','วางบิลรอบนอก: DHL','วางบิลรอบนอก: HOYA',
  'วางบิลรอบนอก: Schenker 16','วางบิลรอบนอก: Schenker หนองก้างปลา','วางบิลรอบนอก: Schenker กิ่งแก้ว',
  'วางบิลรอบนอก: Harley','วางบิลรอบนอก: Pro Inter','วางบิลรอบนอก: Schaeffler Park 5',
  'อมตะชิตี้(2871)','อมตะชิตี้(2871): นต.มด',
  'อมตะชิตี้(2841)','อมตะชิตี้(2841): นต.ปฐมพงษ์',
  'อมตะชิตี้','อมตะชิตี้: นต.ดำริ',
  'เหมราช(2844)','เหมราช(2844): นต.กิ่งกนก',
  'อมตะนคร','อมตะนคร: ไทยอั้ม',
  'คลังสหไทย','EPZ แหลมฉบัง','คลังปลาวาฬ','เกษตร'
];

// ========== DESCRIPTIONS (17 entries) ==========
export const AC_DESCRIPTIONS = [
  'ส่งชุดงานตรวจปล่อย','ส่งชุดงานตรวจปล่อย+โอที','ส่งดีโอ','รับดีโอ','วางบิล',
  'การ์ดใส่กล่อง','ส่งเอกสาร','รับเอกสาร','ใส่กล่องกลางทุ่ง(แดง)','ใส่กล่องกลางทุ่ง(เหลือง)',
  'ใส่กล่องด่าน','ใส่กล่องประตู3','ส่งเอกสารบนด่าน','ชำระค่าภาษี','ชำระค่าธรรมเนียม',
  'ขอล่วงเวลา(โอที)','รับเช็ค'
];

// ========== AUTOCOMPLETE DROPDOWN ENGINE ==========
const _ac = { dropdown: null, input: null, debounce: null, skipNext: false };

export function initAutocompletes(){
  setupAutocomplete('cj-company', AC_COMPANIES, 'ไม่พบชื่อบริษัท');
  setupAutocomplete('cj-pickup',  AC_LOCATIONS, 'ไม่พบสถานที่');
  setupAutocomplete('cj-desc',    AC_DESCRIPTIONS, 'ไม่พบรายละเอียด');
}

function setupAutocomplete(inputId, options, notFoundMsg){
  const elInput = document.getElementById(inputId);
  if(!elInput) return;
  elInput.setAttribute('autocomplete', 'off');
  elInput.setAttribute('autocorrect', 'off');
  elInput.setAttribute('autocapitalize', 'off');
  elInput.setAttribute('spellcheck', 'false');

  elInput.addEventListener('input', () => {
    if(_ac.skipNext){ _ac.skipNext = false; return; }
    clearTimeout(_ac.debounce);
    _ac.debounce = setTimeout(() => _acRender(elInput, options, notFoundMsg), 200);
  });
  elInput.addEventListener('focus', () => _acRender(elInput, options, notFoundMsg));
  elInput.addEventListener('click', () => {
    if(!_ac.dropdown || _ac.input !== elInput) _acRender(elInput, options, notFoundMsg);
  });
  elInput.addEventListener('blur', () => setTimeout(_acClose, 220));
  elInput.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') _acClose();
  });
}

function _acRender(input, options, notFoundMsg){
  const q = (input.value || '').trim().toLowerCase();
  if(!q){
    _acShow(input, options, notFoundMsg, '');
    return;
  }
  const matches = options.filter(o => o.toLowerCase().includes(q)).slice(0, 20);
  _acShow(input, matches, notFoundMsg, q);
}

function _acShow(input, matches, notFoundMsg, query){
  _acClose();
  const dd = document.createElement('div');
  dd.className = 'ac-dropdown';
  if(matches.length === 0){
    dd.innerHTML = `<div class="ac-empty">${esc(notFoundMsg)}</div>`;
  } else {
    dd.innerHTML = matches.map(m =>
      `<div class="ac-item" data-val="${esc(m)}">${_acHighlight(m, query)}</div>`
    ).join('');
  }
  document.body.appendChild(dd);

  const pickHandler = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(_ac.debounce);
    _ac.skipNext = true;
    input.value = item.dataset.val;
    _acClose();
    setTimeout(() => {
      try {
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      } catch(_) {}
    }, 30);
  };
  dd.querySelectorAll('.ac-item').forEach(item => {
    item.addEventListener('mousedown', e => pickHandler(e, item));
    item.addEventListener('touchstart', e => pickHandler(e, item), { passive: false });
  });

  _ac.dropdown = dd;
  _ac.input = input;
  _acPosition(dd, input);
}

function _acPosition(dd, input){
  const r = input.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight, pad = 8;
  const spaceBelow = vh - r.bottom, spaceAbove = r.top;
  const maxH = 280;

  let w = Math.max(r.width, 220);
  if(w > vw - pad * 2) w = vw - pad * 2;
  dd.style.width = w + 'px';

  let left = r.left;
  if(left + w > vw - pad) left = vw - w - pad;
  if(left < pad) left = pad;
  dd.style.left = left + 'px';

  if(spaceBelow < 200 && spaceAbove > spaceBelow){
    dd.style.top = 'auto';
    dd.style.bottom = (vh - r.top + 4) + 'px';
    dd.style.maxHeight = Math.min(maxH, spaceAbove - pad * 2) + 'px';
  } else {
    dd.style.bottom = 'auto';
    dd.style.top = (r.bottom + 4) + 'px';
    dd.style.maxHeight = Math.min(maxH, spaceBelow - pad * 2) + 'px';
  }
}

function _acClose(){
  if(_ac.dropdown){
    _ac.dropdown.remove();
    _ac.dropdown = null;
    _ac.input = null;
  }
}

function _acHighlight(text, query){
  if(!query) return esc(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if(idx < 0) return esc(text);
  return esc(text.slice(0, idx)) +
    '<mark>' + esc(text.slice(idx, idx + query.length)) + '</mark>' +
    esc(text.slice(idx + query.length));
}

// Close on outside click + reposition on scroll
document.addEventListener('mousedown', (e) => {
  if(_ac.dropdown && !_ac.dropdown.contains(e.target) && e.target !== _ac.input) _acClose();
});
document.addEventListener('touchstart', (e) => {
  if(_ac.dropdown && !_ac.dropdown.contains(e.target) && e.target !== _ac.input) _acClose();
}, { passive: true });
window.addEventListener('resize', _acClose);
document.addEventListener('scroll', () => {
  if(_ac.dropdown && _ac.input) _acPosition(_ac.dropdown, _ac.input);
}, true);
