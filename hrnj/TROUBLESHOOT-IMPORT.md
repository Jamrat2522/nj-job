# HR V2 — แก้ปัญหา "Failed to fetch dynamically imported module"

## สิ่งที่ผมตรวจแล้วในฝั่งโค้ด (ทำได้จริงจากไฟล์จริง)

| ตรวจอะไร | วิธีตรวจ | ผล |
|---|---|---|
| จุด dynamic import ทั้งหมด | ไล่ทุกไฟล์: `index.html` → `import('./app/bootstrap.js')` · `app/bootstrap.js` → `load(p)` · `app/router.js` → `ctx.load('./app-shell.js')`, `ctx.load('../modules/' + def.module)` · `modules/home/system.js` → `import('../../app/app-shell.js')` | 4 จุด ครบ ไม่มีจุดอื่น |
| Absolute path ชี้ root (`/app/`, `/modules/`) | สแกน specifier ทุกตัวใน 39 ไฟล์ | **ไม่พบเลย** — ทุกเส้นเป็น relative อิง `import.meta.url` |
| ไฟล์ที่ import มีจริง + ตัวพิมพ์ตรง | resolve specifier ทุกตัวเทียบระบบไฟล์จริง (case-sensitive) | 39/39 ตรง |
| เดินกราฟ import ผ่าน HTTP จริงโดย mount ไว้ที่ `/hr-v2/` | `test/module-graph.mjs` (static server + fetch ทุก edge) | โหลดได้ 38 ไฟล์ · 0 ปัญหา |
| ตัวตรวจจับปัญหาโฮสต์ทำงานจริงไหม | รันซ้ำในโหมดจำลอง `MODE=rewrite` (เสิร์ฟ index.html แทน .js) และ `MODE=mime` | จับได้ทั้งสองกรณี |
| V2 ลงทะเบียน Service Worker ไหม | grep `serviceWorker.register` ใน V2 | ไม่มี (ยืนยันโดยเทส PRV-3) |
| `<base href>` | ค้นใน `index.html` | ไม่มี — และ **ไม่ควรเพิ่ม** เพราะ hash router + relative asset ทำงานถูกอยู่แล้ว การใส่ `<base>` จะเปลี่ยนการ resolve ของ `#/route` และ asset ทั้งหมด |

**สรุป: path ในโค้ดถูกต้องทั้งหมด** เมื่อ V2 อยู่ใต้ `/hr-v2/` — ปัญหาจึงอยู่ที่ **ฝั่งเซิร์ฟเวอร์/ไฟล์ที่อัปโหลด** ซึ่งผมมองไม่เห็นจากที่นี่ ต้องใช้ `diag.html` เก็บหลักฐานจากโฮสต์จริง

---

## ⛔ กรณีที่พบครั้งแรก: เปิดจาก file:// (ไม่ใช่ปัญหาของระบบ)
ถ้าแถบ URL ขึ้น `file:///C:/Users/...` แปลว่าเปิดด้วยการดับเบิลคลิกไฟล์
HR V2 แยกไฟล์เป็น ES Module — เบราว์เซอร์บล็อกทั้ง `import()` และ `fetch()` บนโปรโตคอล `file://` เสมอ
จึงขึ้น "Failed to fetch" ทุกไฟล์ **โดยที่ไฟล์ครบและ path ถูกต้องอยู่แล้ว**
(V1 เปิดจากไฟล์ได้เพราะเป็นไฟล์เดียวไม่มี module — V2 ทำแบบนั้นไม่ได้)

**ทดสอบในเครื่องให้ถูกวิธี:** เปิด Command Prompt ที่โฟลเดอร์ `hr-v2` แล้วพิมพ์
```
python -m http.server 8080
```
เปิด `http://localhost:8080/` และ `http://localhost:8080/diag.html`
(ถ้าไม่มี Python ใช้ `npx serve -l 8080` ก็ได้)

ตั้งแต่ชุดนี้เป็นต้นไป ทั้ง `index.html` และ `diag.html` จะตรวจจับ `file://` แล้วแจ้งเตือนทันที ไม่ปล่อยให้เข้าใจผิด

## ขั้นตอนที่คุณต้องทำ (ใช้เวลา ~3 นาที)

1. อัปโหลดชุดใหม่นี้ทับที่ `/hr-v2/` (มีไฟล์ใหม่ `diag.html` เพิ่มมา)
2. เปิด **`https://<โดเมน>/hr-v2/diag.html`** → กด **▶ เริ่มตรวจทั้งหมด**
3. กด **📋 คัดลอกผล** แล้วส่งข้อความทั้งก้อนกลับมา
   - ในนั้นมีครบตามที่คุณสั่ง: URL ที่โหลดไม่สำเร็จ · HTTP Status · Content-Type · ขนาด · เนื้อหาต้นไฟล์ · สถานะ Service Worker
4. เปิด `https://<โดเมน>/hr-v2/` อีกครั้ง — ถ้ายังพัง หน้าจอจะไม่ขึ้นข้อความลอย ๆ แล้ว แต่จะบอก `MODULE / URL / HTTP / CT / HEAD` และสาเหตุที่เป็นไปได้ (ถ่ายภาพส่งมาก็พอ)

---

## อ่านผลจาก diag.html แล้วแก้ตามนี้

### กรณี A — ขึ้น `404 ไม่พบไฟล์`
ไฟล์ยังไม่ถูกอัปโหลด หรือชื่อโฟลเดอร์/ตัวพิมพ์ไม่ตรง (Linux แยก `Modules` กับ `modules`)
- ตรวจว่าอัปโหลด**ทั้งโครงสร้างโฟลเดอร์** ไม่ใช่แค่ไฟล์ในระดับบนสุด: `app/ components/ modules/ repositories/ services/ styles/`
- โปรแกรม FTP บางตัวข้ามโฟลเดอร์ว่าง — โฟลเดอร์ `config/` ในชุดนี้ว่างเปล่าและ**ไม่ถูกใช้งาน** ข้ามได้ ไม่กระทบ
- ชื่อไฟล์ทั้งหมดเป็นตัวพิมพ์เล็กล้วน + ขีดกลาง เช่น `app-shell.js`, `ui-states.js`, `error-boundary.js`, `no-access.js`

### กรณี B — ขึ้น `เซิร์ฟเวอร์ส่ง HTML แทนไฟล์ JS`
โฮสต์มี Rewrite Rule แบบ SPA ที่ดึงทุก request ไป `index.html` — **นี่คือสาเหตุที่พบบ่อยที่สุด**ของข้อความ Failed to fetch dynamically imported module
ต้องยกเว้นไฟล์จริงก่อน rewrite (เลือกตามชนิดโฮสต์ — ผมไม่แตะไฟล์เซิร์ฟเวอร์ให้เอง เพราะกระทบ V1 ด้วย):

**Apache (`.htaccess` — วางไว้ใน `/hr-v2/` เท่านั้น ไม่ใช่ที่ root ของ V1):**
```apache
RewriteEngine On
RewriteBase /hr-v2/
# มีไฟล์จริงอยู่ → เสิร์ฟไฟล์นั้น ห้าม rewrite
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
AddType text/javascript .js
AddType text/css .css
```

**Nginx:**
```nginx
location /hr-v2/ {
    try_files $uri $uri/ /hr-v2/index.html;   # ไฟล์จริงมาก่อนเสมอ
}
types { text/javascript js; text/css css; }
```

**Netlify (`_redirects`):** อย่าใส่ `/* /index.html 200` แบบครอบทั้งโดเมน ให้จำกัดเฉพาะ path ที่ไม่มีนามสกุลไฟล์

### กรณี C — ขึ้น `MIME ไม่ถูกต้อง`
เบราว์เซอร์ปฏิเสธ ES Module ที่ Content-Type ไม่ใช่ JavaScript
- Apache: `AddType text/javascript .js`
- Nginx: ตรวจ `include mime.types;` และ `text/javascript js;`
- IIS: เพิ่ม MIME map `.js → text/javascript`

### กรณี D — ไฟล์ผ่านหมดแต่ระบบยังพัง
ส่งผล diag + ภาพหน้าจอ Console กลับมา ผมจะไล่ต่อจากข้อความจริง (ตอนนี้ระบบบอก URL ที่พังเสมอแล้ว)

---

## เรื่อง Service Worker (ข้อ 9 ของคุณ)
- V2 **ไม่เคยลงทะเบียน** Service Worker จึงไม่มีอะไรให้ปิด — ยืนยันได้ที่ `diag.html` หัวข้อ 1 ("SW ที่ลงทะเบียนไว้")
- ปุ่ม **🧹 ล้าง Cache/SW เฉพาะ /hr-v2/** ใน diag.html จะแตะเฉพาะ registration ที่ scope มี `/hr-v2/` และ cache ที่ชื่อขึ้นต้น `njhr-v2` เท่านั้น
- **ไม่แตะ SW/cache ของ V1 (`njhr-v83`) เด็ดขาด** — ถ้า diag รายงานว่า "SW ที่ควบคุมหน้านี้" เป็น `sw.js` ของ V1 ให้แจ้งผมก่อน ผมจะเสนอทางเลือกให้คุณตัดสินใจ ไม่ลงมือเอง

## ไฟล์ที่แก้ในรอบนี้

| ไฟล์ | เดิม | ใหม่ |
|---|---|---|
| `index.html` | `catch` แสดงข้อความ error ลอย ๆ | คำนวณ URL เต็มของ bootstrap · แสดง `MODULE / URL / ERROR` · ยิง `fetch` ซ้ำเพื่อรายงาน `HTTP status / Content-Type / เนื้อหาต้นไฟล์` + ระบุสาเหตุที่เป็นไปได้ + ลิงก์ไป `diag.html` |
| `app/bootstrap.js` | `const load = (p) => import(new URL(...))` | `load` ห่อ try/catch: ถ้าโหลดไม่ได้ ยิง fetch อ่านสถานะจริง แล้วโยน error ที่ระบุ **ชื่อโมดูล + URL + HTTP + Content-Type** (path resolution เดิม ไม่เปลี่ยน) |
| `app/router.js` | `renderError(..., 'โหลดหน้านี้ไม่สำเร็จ', ..., e.message)` | เพิ่มชื่อ module และ URL ที่พังลงในข้อความ |
| `diag.html` | — (ไฟล์ใหม่) | หน้าตรวจ 42 ไฟล์บนเซิร์ฟเวอร์จริง + ทดสอบ dynamic import + สถานะ SW/Cache + ปุ่มคัดลอกผล |
| `test/module-graph.mjs` | — (ไฟล์ใหม่) | เดินกราฟ import ผ่าน HTTP โดย mount ที่ `/hr-v2/` + โหมดจำลองปัญหาโฮสต์ |

**ไม่มีการแก้ logic, business rule, UI หรือ path ของโมดูลใด ๆ** — เพิ่มเฉพาะการรายงานข้อผิดพลาดและเครื่องมือตรวจ
