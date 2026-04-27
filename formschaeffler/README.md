# NJ Logistics App

Web-based Excel/PDF processing tools for logistics workflow — Mapping, Highlighting, Letter generation, and more.

## 🗂 Project Structure

```
nj-job/
├── index.html                      ← Frontend (single-page app, deploy to GitHub Pages)
├── .gitignore
├── README.md
│
└── letter_backend/                 ← Python FastAPI backend (deploy to Render.com)
    ├── main.py
    ├── requirements.txt
    ├── render.yaml                 ← Auto-deploy config for Render
    ├── run_backend.bat             ← Local use: localhost only
    └── run_backend_network.bat     ← Local use: LAN access
```

## 🚀 Features / Modes

| Mode | Needs Backend? | Purpose |
|------|---|---|
| **Mapping Excel** | ❌ No | Transform Excel data using mapping rules |
| **Excel → PDF Highlight** | ❌ No | Highlight item numbers + country codes in customs PDF |
| **Letter Generator** | ✅ Yes | Generate Thai Certificate of Origin letters (DOCX → ZIP) |
| **รวมไฟล์ Excel (Merge)** | ❌ No | Merge multiple Excel files |
| **จัดการสมาชิก (Members)** | ❌ No | User management (admin only) |

## 💻 Deployment

### Option A: Frontend on GitHub Pages + Backend on Render

**Frontend (GitHub Pages):**
1. Push this repo to GitHub
2. Go to repo **Settings → Pages**
3. Source: `Deploy from branch` → Branch: `main` → Folder: `/ (root)`
4. Save. Your site will be live at `https://<username>.github.io/nj-job/`

**Backend (Render.com):**
1. Sign up at [render.com](https://render.com)
2. New → **Blueprint** → Connect this GitHub repo
3. Render detects `letter_backend/render.yaml` automatically
4. Deploy. Get URL like `https://letter-backend-xxxx.onrender.com`

**Connect frontend to backend:**
Open your deployed site → F12 (browser console) → type:
```js
localStorage.setItem('letterApiUrl', 'https://letter-backend-xxxx.onrender.com')
```
Refresh. Done.

### Option B: Run everything locally

**Backend:** Double-click `letter_backend/run_backend.bat`
**Frontend:** Open `index.html` directly in browser

### Option C: LAN (multiple users, one computer as server)

**Server:** Double-click `letter_backend/run_backend_network.bat`
**Other computers:** In browser console:
```js
localStorage.setItem('letterApiHost', '192.168.1.50')  // your server's IP
```
Refresh.

## 👥 Default Users

| Username | Password | Role |
|---|---|---|
| Jamrat | Jam497522 | Super Admin |
| NJ1, NJ2, NJ3 | NJ1234 | User |
| NJ4–NJ9 | NJ12345 | User |

## 🔧 Development

**Local backend dev:**
```bash
cd letter_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Local frontend dev:**
Just open `index.html` in Chrome/Edge. All JS libraries load from CDN.

## 📝 Notes

- The backend is only needed for **Letter Generator**. All other modes run entirely in the browser.
- Render free tier sleeps after 15 min idle — first request after sleep takes ~30 sec to wake up.
- Backend CORS is set to `*` (allow any origin) for ease of use.

## 🛠 Tech Stack

- **Frontend:** Vanilla JS + HTML (no framework, no build step)
  - PDF-lib, pdf.js, SheetJS (XLSX), JSZip — all from CDN
- **Backend:** FastAPI + python-docx + pandas + openpyxl
- **Hosting:** GitHub Pages (frontend) + Render.com (backend)
