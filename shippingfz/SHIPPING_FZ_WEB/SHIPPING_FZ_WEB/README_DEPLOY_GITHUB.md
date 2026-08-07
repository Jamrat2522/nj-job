# SHIPPING FZ — ขึ้น GitHub Pages

## ⚠️ อ่านก่อนอัปโหลด — เรื่องความปลอดภัย

ไฟล์ `index.html` และ `config.js` มี **Supabase URL + Publishable (anon) key** ฝังอยู่
ซึ่งเป็นเรื่องปกติของเว็บที่เรียก Supabase จากเบราว์เซอร์ **แต่ระบบนี้มีเงื่อนไขพิเศษ**

RLS ของ SHIPPING FZ ตอนนี้อนุญาตให้ role `anon` **อ่านและเขียนได้เต็มที่**
เพราะระบบไม่ได้ใช้ Supabase Auth (login ผ่าน RPC `login_plain` แล้วเก็บ session ใน localStorage)

**แปลว่า: ถ้าเอาขึ้น GitHub repo แบบ public ใครก็ตามที่เจอ repo หรือ URL**
**จะเอา anon key ไปอ่าน / แก้ / ลบข้อมูลในตาราง `sfz_*` ได้โดยไม่ต้อง login**

### ทางเลือก

| ทางเลือก | ผล |
|---|---|
| **Private repo + GitHub Pages** | ปลอดภัยกว่ามาก — แต่ Pages จาก private repo ต้องมี **GitHub Pro / Team / Enterprise** (แผนฟรีทำไม่ได้) |
| **Public repo** | ใช้ได้ทันทีและฟรี แต่ยอมรับความเสี่ยงข้างบน · ไม่ควรใช้กับข้อมูลจริงของบริษัท |
| **โฮสต์อื่นที่ใส่รหัสผ่านหน้าเว็บได้** | เช่น Netlify (Password protection), Cloudflare Access, หรือเว็บโฮสต์ของบริษัทที่ตั้ง Basic Auth ได้ |
| **ใช้ `SHIPPING FZ.exe` ต่อไป** | ปลอดภัยที่สุด — ไม่มี URL สาธารณะ ใช้เฉพาะในเครื่อง |

> การแก้ให้ปลอดภัยจริงต้องเปลี่ยนไปใช้ Supabase Auth + RLS แบบผูกกับ user
> ซึ่งเป็นการรื้อระบบ login ทั้งหมด — ถ้าต้องการให้ทำ แจ้งได้

---

## ขั้นตอนอัปโหลด (แบบไม่ต้องใช้คำสั่ง Git)

1. เข้า https://github.com/ → กด **New** สร้าง repository ใหม่
   - ชื่อ: เช่น `shipping-fz`
   - เลือก **Private** ถ้ามี GitHub Pro · ถ้าไม่มีต้องเลือก Public (อ่านคำเตือนข้างบนก่อน)
   - ติ๊ก **Add a README file**
2. เข้า repo → **Add file** → **Upload files**
3. ลากไฟล์และโฟลเดอร์เหล่านี้เข้าไป **ทั้งหมด**:
   ```
   index.html
   config.js
   .nojekyll
   assets/xlsx.bundle.js
   ```
   > ถ้าลากโฟลเดอร์ `assets` ไม่ได้ ให้สร้างไฟล์ชื่อ `assets/xlsx.bundle.js` ผ่าน **Add file → Create new file** แล้ววางเนื้อหา
   > (หรือข้ามไฟล์นี้ก็ได้ — Export Excel จะ fallback ไปโหลดจาก CDN แทน)
4. กด **Commit changes**
5. ไปที่ **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** · Folder: **/ (root)** → **Save**
6. รอ 1–2 นาที จะได้ลิงก์:
   ```
   https://<ชื่อบัญชี>.github.io/shipping-fz/
   ```

---

## ก่อนใช้งานจริง

- ต้องรัน SQL ให้ครบก่อน: `000_setup_all_shipping_fz.sql` และ `010_perf_all_sfz.sql`
- เปิดลิงก์ → ต้องเห็นหน้า Login ทันที (ไม่ใช่หน้า "เปิดไฟล์ผิดวิธี" เพราะเป็น https ไม่ใช่ file://)
- Login ด้วยบัญชีเดิม

## ตรวจหลัง Deploy

- [ ] เปิดลิงก์แล้วขึ้นหน้า Login
- [ ] F12 → Console ไม่มี error สีแดง
- [ ] F12 → Network ไม่มี 404 (ถ้าไม่ได้อัป `assets/xlsx.bundle.js` จะเห็น 404 ตัวนี้ตอนกด Export ซึ่งปกติ แล้วมันจะไปโหลด CDN ต่อ)
- [ ] Login → โหลดรายการงานได้
- [ ] สร้างงาน / แนบรูป / เปิดรูป (Signed URL)
- [ ] เปิด 2 เครื่องเช็ค Realtime
- [ ] Export Excel
- [ ] มือถือ

---

## อัปเดตเวอร์ชันครั้งต่อไป

อัปโหลดทับเฉพาะ `index.html` ไฟล์เดียว → Pages จะ deploy ใหม่เอง
ผู้ใช้กด **Ctrl + F5** ครั้งเดียวเพื่อเลี่ยง cache ของเบราว์เซอร์

---

## หมายเหตุ

- ไฟล์ `.nojekyll` ใส่ไว้กัน GitHub Pages ประมวลผลด้วย Jekyll (ปลอดภัยกว่า ไม่มีผลเสีย)
- `config.js` เป็น **optional override** — ถ้าลบทิ้ง ระบบใช้ค่าที่ฝังใน `index.html` แทนได้เลย
  แต่ Console จะขึ้น 404 ของ `config.js` จึงแนะนำให้อัปไปด้วย
- ระบบตรวจ environment เอง: `github.io` = **Production Mode** · `127.0.0.1` = Local Mode
  ใช้ไฟล์ชุดเดียวกันทั้งสองแบบ ไม่ต้องแก้โค้ด
