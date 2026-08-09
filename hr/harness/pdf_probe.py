"""pdf_probe.py — อ่านไฟล์ PDF แล้วคืนตำแหน่งข้อความเป็น JSON ให้ชุดทดสอบใช้เทียบ
ใช้: python3 pdf_probe.py <ไฟล์.pdf>
หมายเหตุ: ตัวสกัดข้อความของ PDF แยกสระ/วรรณยุกต์ไทยออกมาไม่ครบ และฟอนต์ TH Sarabun
ใช้ glyph ในช่วง Private Use Area (U+F700–U+F71F) จึงมี norm/nm ให้เทียบแบบตัดเครื่องหมายประกอบ
"""
import json
import re
import sys

import pypdf

MARK = re.compile('[\\s\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\uF700-\uF71F]')


def nm(x):
    return MARK.sub('', str(x).replace('\u0E33', '\u0E32'))


def main(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    page = reader.pages[0]
    raw = []

    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            raw.append({'x': round(tm[4], 1), 'y': round(tm[5], 1),
                        'size': font_size, 'raw': text})

    full = page.extract_text(visitor_text=visitor) or ''

    # รวมชิ้นข้อความที่อยู่บรรทัดเดียวกัน (y เท่ากัน) เป็นแถวเดียว พร้อมขอบซ้าย–ขวาโดยประมาณ
    lines = {}
    for r in raw:
        key = r['y']
        item = lines.setdefault(key, {'y': key, 'x': r['x'], 'x2': r['x'], 't': ''})
        item['x'] = min(item['x'], r['x'])
        # ประมาณความกว้าง: 0.5 เท่าของขนาดฟอนต์ต่ออักษร (พอสำหรับหาจุดกึ่งกลางแบบหยาบ)
        width = len(r['raw'].replace(' ', '')) * (r['size'] or 12) * 0.42
        item['x2'] = max(item['x2'], r['x'] + width)
        item['t'] += nm(r['raw'])

    rows = sorted(lines.values(), key=lambda r: r['y'])
    for r in rows:
        r['x'] = round(r['x'], 1)
        r['x2'] = round(r['x2'], 1)

    blank = sum(1 for p in reader.pages if not (p.extract_text() or '').strip())
    out = {
        'n': len(reader.pages),
        'w': round(float(page.mediabox.width), 1),
        'h': round(float(page.mediabox.height), 1),
        'blank': blank,
        'text': full,
        'norm': nm(full),
        'rows': rows,
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1])
