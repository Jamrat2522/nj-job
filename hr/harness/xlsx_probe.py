"""xlsx_probe.py — เปิดไฟล์ .xlsx จริงแล้วคืนโครงสร้าง/รูปแบบเป็น JSON ให้ชุดทดสอบใช้เทียบ"""
import json, sys, openpyxl

HEAD = ['ลำดับ','รหัสพนักงาน','ชื่อ-นามสกุล','เงินเดือน','ค่าตำแหน่ง','ค่าน้ำมัน','ค่าโทรศัพท์',
        'เบี้ยขยัน','เงิน OT','ค่ากะ','รายรับรวม','ลากิจ (หักเงิน)','ประกันสังคม 5%','กยศ.',
        'หักอื่น','รายหักรวม','เงินสุทธิ','ขาดสแกนเข้า','ขาดสแกนออก','ยกเว้นลงชื่อเข้า',
        'สาย (นาที)','OT (ชม.)','ลงชื่อย้อนหลัง','รายละเอียดลงเวลา','รวมวันลา','ลากิจ (วัน)',
        'พักร้อน (วัน)','ลาป่วย (วัน)','ลาอื่น (วัน)','รายละเอียดลา','รายละเอียด OT',
        'OT 1.5 (ชม.)','OT วันหยุด 1 (ชม.)','OT 3 (ชม.)','ผู้อนุมัติ OT']
GROUPS = [('ข้อมูลพนักงาน','A1:C1','334155'), ('รายได้','D1:K1','0F766E'),
          ('รายการหัก / เงินสุทธิ','L1:Q1','B45309'), ('การลงเวลา','R1:X1','1D4ED8'),
          ('การลา','Y1:AD1','7C3AED'), ('OT','AE1:AI1','BE123C')]

def main(p):
    wb = openpyxl.load_workbook(p)
    ws = wb[wb.sheetnames[0]]
    o = {'sheets': wb.sheetnames, 'max_row': ws.max_row, 'max_col': ws.max_column}

    bad = [f'{i+1}:{ws.cell(2,i+1).value!r}' for i, h in enumerate(HEAD)
           if ws.cell(2, i + 1).value != h]
    o['header_ok'] = not bad
    o['header_bad'] = ' · '.join(bad[:4])

    merged = {str(m) for m in ws.merged_cells.ranges}
    o['groups'] = [g[1] for g in GROUPS]
    o['groups_ok'] = all(g[1] in merged and ws[g[1].split(':')[0]].value == g[0] for g in GROUPS)
    colors, cok = [], True
    for g in GROUPS:
        rgb = ws[g[1].split(':')[0]].fill.fgColor.rgb or ''
        colors.append(rgb)
        if not str(rgb).upper().endswith(g[2]):
            cok = False
    o['group_colors'], o['group_colors_ok'] = colors, cok

    o['freeze'] = ws.freeze_panes
    o['autofilter'] = ws.auto_filter.ref
    o['cf'] = len(ws.conditional_formatting._cf_rules)
    o['money_fmt'] = ws.cell(3, 4).number_format
    w = {c: bool(ws.cell(3, c).alignment.wrap_text) for c in (24, 30, 31)}
    o['wrap'], o['wrap_ok'] = w, all(w.values())

    f = {'K': ws.cell(3, 11).value, 'P': ws.cell(3, 16).value, 'Q': ws.cell(3, 17).value}
    o['formulas'] = f
    o['formula_ok'] = (f['K'] == '=SUM(D3:J3)' and f['P'] == '=SUM(L3:O3)' and f['Q'] == '=K3-P3')

    last = ws.max_row
    o['total_label'] = ws.cell(last, 1).value
    o['total_ok'] = (o['total_label'] == 'รวมทั้งหมด' and f'A{last}:C{last}' in merged)

    codes = [ws.cell(r, 2).value for r in range(3, last)]
    o['last_code'] = codes[-1]
    o['dup'] = len(codes) - len(set(codes))

    def row(r):
        return {'base': ws.cell(r, 4).value, 'pos': ws.cell(r, 5).value,
                'sso': ws.cell(r, 13).value, 'loan': ws.cell(r, 14).value,
                'dleave': ws.cell(r, 12).value, 'dother': ws.cell(r, 15).value,
                'leave': ws.cell(r, 25).value}
    o['row3'], o['row4'], o['row5'] = row(3), row(4), row(5)
    print(json.dumps(o, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1])
