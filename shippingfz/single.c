/* ============================================================
   SHIPPING FZ — Single Portable EXE  (v3)
   ------------------------------------------------------------
   · ฝัง index.html + config.js + icon ไว้ใน EXE (RCDATA)
   · Local HTTP server อยู่ใน process เดียวกัน — ไม่ spawn process ใด ๆ
     (ไม่มี server.exe / powershell.exe / python.exe / node.exe)
   · bind 127.0.0.1 เท่านั้น · เลือกพอร์ตว่างเอง 5500-5520
   · System Tray + เมนู เปิด / เปิดหน้าเว็บอีกครั้ง / ปิด
   · Single instance ด้วย Named Mutex
   · ไม่อ่านไฟล์ใด ๆ จากดิสก์ → วาง EXE ไว้ที่ไหนก็เปิดได้

   build:
     x86_64-w64-mingw32-windres app.rc -O coff -o app.res
     x86_64-w64-mingw32-gcc -O2 -municode -mwindows single.c app.res -o "SHIPPING FZ.exe" -lws2_32 -lshell32 -lcomctl32
   ============================================================ */
#define _WIN32_WINNT 0x0600
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <string.h>
#include <wchar.h>

#define RES_INDEX      101
#define RES_CONFIG     102
#define RES_XLSX       103
#define PORT_MIN       5500
#define PORT_MAX       5520
#define APP_TITLE      L"SHIPPING FZ"
#define MUTEX_NAME     L"Local\\ShippingFZSingleInstanceMutex"
#define WM_TRAY        (WM_APP + 1)
#define ID_TRAY_OPEN   1001
#define ID_TRAY_REOPEN 1002
#define ID_TRAY_QUIT   1003
#define HEALTH_BODY    "{\"ok\":true,\"app\":\"shipping_fz\",\"server\":\"local\",\"mode\":\"single-exe\"}"

static SOCKET       g_listen = INVALID_SOCKET;
static int          g_port   = 0;
static volatile int g_stop   = 0;
static HWND         g_hwnd   = NULL;
static NOTIFYICONDATAW g_nid;

static const char *g_index = NULL;  static DWORD g_indexLen = 0;
static const char *g_config= NULL;  static DWORD g_configLen= 0;
static const char *g_xlsx  = NULL;  static DWORD g_xlsxLen  = 0;   /* xlsx-js-style — lazy load ตอนกด Export */

/* ---------- helpers ---------- */
static void self_path(wchar_t *out, size_t cch){
    DWORD n = GetModuleFileNameW(NULL, out, (DWORD)cch);
    if(!n) wcsncpy(out, L"(unknown)", cch);
    else out[n] = 0;
}

static void fail_box(const wchar_t *step, DWORD err, int portTried){
    wchar_t exe[MAX_PATH]; self_path(exe, MAX_PATH);
    wchar_t sysmsg[512] = L"";
    if(err) FormatMessageW(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
                           NULL, err, 0, sysmsg, 511, NULL);
    for(wchar_t *p = sysmsg; *p; p++) if(*p == L'\r' || *p == L'\n') *p = L' ';

    wchar_t msg[1400];
    _snwprintf(msg, 1400,
        L"SHIPPING FZ เปิดไม่สำเร็จ\n\n"
        L"ขั้นตอนที่ล้มเหลว:\n   %s\n\n"
        L"Windows Error Code:\n   %lu%s%s\n\n"
        L"พอร์ตที่พยายามเปิด:\n   %s\n\n"
        L"ตำแหน่งไฟล์:\n   %s",
        step,
        (unsigned long)err,
        sysmsg[0] ? L" — " : L"",
        sysmsg[0] ? sysmsg : L"",
        portTried > 0 ? L"" : L"5500-5520 (ไม่ว่างทั้งช่วง)",
        exe);
    if(portTried > 0){
        wchar_t pbuf[64]; _snwprintf(pbuf, 64, L"%d", portTried);
        wchar_t *pos = wcsstr(msg, L"5500-5520 (ไม่ว่างทั้งช่วง)");
        (void)pos;  /* ข้อความพอร์ตเจาะจงอยู่ใน step แล้ว */
    }
    msg[1399] = 0;
    MessageBoxW(NULL, msg, APP_TITLE, MB_ICONERROR | MB_OK);
}

static int load_resources(void){
    HRSRC r1 = FindResourceW(NULL, MAKEINTRESOURCEW(RES_INDEX), RT_RCDATA);
    if(!r1) return 0;
    HGLOBAL h1 = LoadResource(NULL, r1);
    if(!h1) return 0;
    g_index = (const char*)LockResource(h1);
    g_indexLen = SizeofResource(NULL, r1);

    HRSRC r2 = FindResourceW(NULL, MAKEINTRESOURCEW(RES_CONFIG), RT_RCDATA);
    if(r2){
        HGLOBAL h2 = LoadResource(NULL, r2);
        if(h2){ g_config = (const char*)LockResource(h2); g_configLen = SizeofResource(NULL, r2); }
    }
    HRSRC r3 = FindResourceW(NULL, MAKEINTRESOURCEW(RES_XLSX), RT_RCDATA);
    if(r3){
        HGLOBAL h3 = LoadResource(NULL, r3);
        if(h3){ g_xlsx = (const char*)LockResource(h3); g_xlsxLen = SizeofResource(NULL, r3); }
    }
    return (g_index && g_indexLen > 0);
}

/* ---------- HTTP ---------- */
static void send_all(SOCKET s, const char *buf, int len){
    int sent = 0;
    while(sent < len){
        int n = send(s, buf + sent, len - sent, 0);
        if(n <= 0) return;
        sent += n;
    }
}

static void send_body(SOCKET s, int code, const char *status, const char *ctype,
                      const char *body, DWORD len, const char *cache){
    char hdr[512];
    int n = snprintf(hdr, sizeof(hdr),
        "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %lu\r\n"
        "Cache-Control: %s\r\nConnection: close\r\n\r\n",
        code, status, ctype, (unsigned long)len, cache);
    send_all(s, hdr, n);
    if(len) send_all(s, body, (int)len);
}

static DWORD WINAPI client_thread(LPVOID param){
    SOCKET c = (SOCKET)(UINT_PTR)param;
    DWORD tmo = 5000;
    setsockopt(c, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tmo, sizeof(tmo));
    setsockopt(c, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tmo, sizeof(tmo));

    char req[4096];
    int got = recv(c, req, sizeof(req) - 1, 0);
    if(got <= 0){ closesocket(c); return 0; }
    req[got] = 0;

    char method[16] = {0}, path[1024] = {0};
    if(sscanf(req, "%15s %1023s", method, path) != 2){
        send_body(c, 400, "Bad Request", "text/plain; charset=utf-8", "400", 3, "no-store");
        closesocket(c); return 0;
    }
    char *q = strpbrk(path, "?#");
    if(q) *q = 0;

    if(strcmp(path, "/__sfz_health") == 0){
        send_body(c, 200, "OK", "application/json; charset=utf-8",
                  HEALTH_BODY, (DWORD)strlen(HEALTH_BODY), "no-store");
    }else if(strcmp(path, "/") == 0 || strcmp(path, "/index.html") == 0){
        send_body(c, 200, "OK", "text/html; charset=utf-8", g_index, g_indexLen, "no-cache");
    }else if(strcmp(path, "/assets/xlsx.bundle.js") == 0 && g_xlsx){
        send_body(c, 200, "OK", "text/javascript; charset=utf-8", g_xlsx, g_xlsxLen, "public, max-age=31536000, immutable");
    }else if(strcmp(path, "/config.js") == 0 && g_config){
        send_body(c, 200, "OK", "text/javascript; charset=utf-8", g_config, g_configLen, "no-cache");
    }else if(strcmp(path, "/favicon.ico") == 0){
        send_body(c, 204, "No Content", "image/x-icon", "", 0, "no-store");
    }else{
        send_body(c, 404, "Not Found", "text/plain; charset=utf-8", "404 Not Found", 13, "no-store");
    }
    closesocket(c);
    return 0;
}

static DWORD WINAPI server_thread(LPVOID param){
    (void)param;
    while(!g_stop){
        SOCKET c = accept(g_listen, NULL, NULL);
        if(c == INVALID_SOCKET){ if(g_stop) break; Sleep(20); continue; }
        HANDLE t = CreateThread(NULL, 0, client_thread, (LPVOID)(UINT_PTR)c, 0, NULL);
        if(t) CloseHandle(t); else closesocket(c);
    }
    return 0;
}

/* bind พอร์ตว่างตัวแรกในช่วง — คืนพอร์ต หรือ 0 ถ้าไม่ได้เลย */
static int bind_free_port(DWORD *lastErr){
    for(int p = PORT_MIN; p <= PORT_MAX; p++){
        SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if(s == INVALID_SOCKET){ *lastErr = WSAGetLastError(); continue; }
        struct sockaddr_in a;
        memset(&a, 0, sizeof(a));
        a.sin_family = AF_INET;
        a.sin_port = htons((u_short)p);
        a.sin_addr.s_addr = inet_addr("127.0.0.1");   /* loopback เท่านั้น */
        if(bind(s, (struct sockaddr*)&a, sizeof(a)) == 0 && listen(s, SOMAXCONN) == 0){
            g_listen = s;
            return p;
        }
        *lastErr = WSAGetLastError();
        closesocket(s);
    }
    return 0;
}

/* ---------- ตรวจว่า instance เดิมเปิดอยู่ที่พอร์ตไหน ---------- */
static int find_running_port(void){
    for(int p = PORT_MIN; p <= PORT_MAX; p++){
        SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if(s == INVALID_SOCKET) continue;
        DWORD tmo = 700;
        setsockopt(s, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tmo, sizeof(tmo));
        setsockopt(s, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tmo, sizeof(tmo));
        struct sockaddr_in a;
        memset(&a, 0, sizeof(a));
        a.sin_family = AF_INET;
        a.sin_port = htons((u_short)p);
        a.sin_addr.s_addr = inet_addr("127.0.0.1");
        if(connect(s, (struct sockaddr*)&a, sizeof(a)) != 0){ closesocket(s); continue; }
        const char *rq = "GET /__sfz_health HTTP/1.0\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";
        send(s, rq, (int)strlen(rq), 0);
        char buf[1024]; int total = 0, r;
        while(total < 1023 && (r = recv(s, buf + total, 1023 - total, 0)) > 0) total += r;
        closesocket(s);
        buf[total > 0 ? total : 0] = 0;
        if(strstr(buf, "\"app\":\"shipping_fz\"")) return p;
    }
    return 0;
}

static int open_browser(int port){
    wchar_t url[96];
    _snwprintf(url, 96, L"http://127.0.0.1:%d/?t=%llu", port, (unsigned long long)GetTickCount64());
    url[95] = 0;
    HINSTANCE r = ShellExecuteW(NULL, L"open", url, NULL, NULL, SW_SHOWNORMAL);
    return ((INT_PTR)r > 32);
}

/* ---------- Tray ---------- */
static void tray_add(HWND h){
    memset(&g_nid, 0, sizeof(g_nid));
    g_nid.cbSize = sizeof(g_nid);
    g_nid.hWnd = h;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_TRAY;
    g_nid.hIcon = LoadIconW(GetModuleHandleW(NULL), MAKEINTRESOURCEW(1));
    if(!g_nid.hIcon) g_nid.hIcon = LoadIconW(NULL, IDI_APPLICATION);
    _snwprintf(g_nid.szTip, 127, L"SHIPPING FZ — http://127.0.0.1:%d/", g_port);
    Shell_NotifyIconW(NIM_ADD, &g_nid);
}
static void tray_remove(void){ Shell_NotifyIconW(NIM_DELETE, &g_nid); }

static void tray_menu(HWND h){
    HMENU m = CreatePopupMenu();
    AppendMenuW(m, MF_STRING, ID_TRAY_OPEN,   L"เปิด SHIPPING FZ");
    AppendMenuW(m, MF_STRING, ID_TRAY_REOPEN, L"เปิดหน้าเว็บอีกครั้ง");
    AppendMenuW(m, MF_SEPARATOR, 0, NULL);
    AppendMenuW(m, MF_STRING, ID_TRAY_QUIT,   L"ปิด SHIPPING FZ");
    POINT pt; GetCursorPos(&pt);
    SetForegroundWindow(h);
    TrackPopupMenu(m, TPM_RIGHTBUTTON | TPM_BOTTOMALIGN, pt.x, pt.y, 0, h, NULL);
    PostMessageW(h, WM_NULL, 0, 0);
    DestroyMenu(m);
}

static LRESULT CALLBACK wndproc(HWND h, UINT msg, WPARAM wp, LPARAM lp){
    switch(msg){
    case WM_TRAY:
        if(lp == WM_RBUTTONUP || lp == WM_CONTEXTMENU) tray_menu(h);
        else if(lp == WM_LBUTTONDBLCLK || lp == WM_LBUTTONUP) open_browser(g_port);
        return 0;
    case WM_COMMAND:
        switch(LOWORD(wp)){
        case ID_TRAY_OPEN:
        case ID_TRAY_REOPEN: open_browser(g_port); return 0;
        case ID_TRAY_QUIT:   PostMessageW(h, WM_CLOSE, 0, 0); return 0;
        }
        return 0;
    case WM_CLOSE:
        /* หยุดเฉพาะ server ของโปรแกรมนี้ · ไม่แตะ browser หรือโปรแกรมอื่น */
        g_stop = 1;
        if(g_listen != INVALID_SOCKET){ closesocket(g_listen); g_listen = INVALID_SOCKET; }
        tray_remove();
        DestroyWindow(h);
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(h, msg, wp, lp);
}

/* ---------- main ---------- */
int WINAPI wWinMain(HINSTANCE hi, HINSTANCE hp, LPWSTR cl, int sc){
    (void)hp; (void)cl; (void)sc;

    /* 1) Single instance */
    HANDLE mtx = CreateMutexW(NULL, TRUE, MUTEX_NAME);
    if(mtx && GetLastError() == ERROR_ALREADY_EXISTS){
        WSADATA w; WSAStartup(MAKEWORD(2,2), &w);
        int p = 0;
        for(int i = 0; i < 12 && !(p = find_running_port()); i++) Sleep(250);
        WSACleanup();
        if(p){ open_browser(p); return 0; }
        /* mutex ค้างแต่ไม่มี server ตอบจริง (instance เก่าค้าง/ถูกฆ่า)
           → เริ่ม server ใหม่ต่อไปเลย ดีกว่าโชว์ error แล้วเปิดไม่ได้ */
    }

    /* 2) โหลดไฟล์เว็บที่ฝังอยู่ใน EXE (ไม่อ่านจากดิสก์) */
    if(!load_resources()){
        fail_box(L"อ่านไฟล์เว็บที่ฝังอยู่ใน EXE ไม่ได้ (RCDATA #101) — ไฟล์ EXE อาจเสียหาย ให้ดาวน์โหลดใหม่",
                 GetLastError(), 0);
        return 1;
    }

    /* 3) Winsock */
    WSADATA wsa;
    int wrc = WSAStartup(MAKEWORD(2,2), &wsa);
    if(wrc != 0){ fail_box(L"เริ่มระบบเครือข่ายของ Windows (WSAStartup) ไม่สำเร็จ", (DWORD)wrc, 0); return 1; }

    /* 4) bind พอร์ตว่าง */
    DWORD bindErr = 0;
    g_port = bind_free_port(&bindErr);
    if(!g_port){
        fail_box(L"เปิดพอร์ตสำหรับ Local Server ไม่ได้ — ลองครบทุกพอร์ตในช่วง 5500 ถึง 5520 แล้ว\n"
                 L"(อาจมีโปรแกรมอื่นใช้พอร์ตอยู่ หรือ Firewall บล็อกการ bind ที่ 127.0.0.1)",
                 bindErr, 0);
        WSACleanup();
        return 1;
    }

    /* 5) เริ่ม server ใน process เดียวกัน */
    HANDLE th = CreateThread(NULL, 0, server_thread, NULL, 0, NULL);
    if(!th){
        DWORD e = GetLastError();
        closesocket(g_listen);
        fail_box(L"สร้าง thread สำหรับ Local Server ไม่สำเร็จ", e, g_port);
        WSACleanup();
        return 1;
    }
    CloseHandle(th);

    /* 6) รอ server ตอบ health จริงก่อนเปิด browser */
    int ready = 0;
    for(int i = 0; i < 40; i++){ if(find_running_port() == g_port){ ready = 1; break; } Sleep(100); }
    if(!ready){
        wchar_t step[256];
        _snwprintf(step, 256, L"Local Server เปิดที่พอร์ต %d แล้ว แต่ไม่ตอบ Health Check ภายใน 4 วินาที", g_port);
        step[255] = 0;
        fail_box(step, 0, g_port);
        g_stop = 1; closesocket(g_listen); WSACleanup();
        return 1;
    }

    /* 7) เปิด browser */
    if(!open_browser(g_port)){
        wchar_t step[256];
        _snwprintf(step, 256, L"เปิดเบราว์เซอร์ไม่สำเร็จ (ShellExecuteW) — URL: http://127.0.0.1:%d/", g_port);
        step[255] = 0;
        fail_box(step, GetLastError(), g_port);
        /* ไม่ปิดโปรแกรม — ผู้ใช้เปิด URL เองจาก tray ได้ */
    }

    /* 8) หน้าต่างซ่อน + tray */
    WNDCLASSEXW wc;
    memset(&wc, 0, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = wndproc;
    wc.hInstance = hi;
    wc.lpszClassName = L"ShippingFZTrayWnd";
    RegisterClassExW(&wc);
    g_hwnd = CreateWindowExW(0, L"ShippingFZTrayWnd", APP_TITLE, 0, 0, 0, 0, 0,
                             HWND_MESSAGE, NULL, hi, NULL);
    if(g_hwnd) tray_add(g_hwnd);

    MSG msg;
    while(GetMessageW(&msg, NULL, 0, 0) > 0){
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    g_stop = 1;
    if(g_listen != INVALID_SOCKET) closesocket(g_listen);
    WSACleanup();
    if(mtx){ ReleaseMutex(mtx); CloseHandle(mtx); }
    return 0;
}
