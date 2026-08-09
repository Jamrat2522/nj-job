#!/usr/bin/env python3
# p3_split.py — ย้ายบล็อกโค้ดระดับสัญลักษณ์จากไฟล์ src เดิมไปยังไฟล์ chunk ใหม่
# ย้ายทั้งบล็อกโดยไม่แก้เนื้อในแม้แต่ตัวอักษรเดียว
import re, os, sys, json

SRC = 'src'

def read(f): return open(os.path.join(SRC, f), encoding='utf-8').read()
def write(f, s): open(os.path.join(SRC, f), 'w', encoding='utf-8').write(s)

def find_block(s, name):
    """คืน (start, end) ของบล็อกประกาศ top-level ชื่อ name"""
    m = re.search(r'(?:^|\n)  function\s+' + re.escape(name) + r'\s*\(', s)
    if m:
        i = s.index('{', m.end() - 1); d = 0
        for j in range(i, len(s)):
            if s[j] == '{': d += 1
            elif s[j] == '}':
                d -= 1
                if d == 0:
                    end = j + 1
                    while end < len(s) and s[end] != '\n': end += 1
                    return (m.start() + (1 if s[m.start()] == '\n' else 0), end + 1)
        raise Exception('unbalanced ' + name)
    # var NAME = ... ;  (ต้องเป็นตัวเดียวบนบรรทัด var นั้น)
    m = re.search(r'(?:^|\n)  var\s+' + re.escape(name) + r'\s*=', s)
    if not m:
        raise Exception('not found: ' + name)
    d = 0; instr = None; j = m.end()
    while j < len(s):
        c = s[j]
        if instr:
            if c == '\\': j += 2; continue
            if c == instr: instr = None
        elif c in '\'"': instr = c
        elif c in '([{': d += 1
        elif c in ')]}': d -= 1
        elif c == ';' and d == 0:
            end = j + 1
            while end < len(s) and s[end] != '\n': end += 1
            return (m.start() + (1 if s[m.start()] == '\n' else 0), end + 1)
        j += 1
    raise Exception('unterminated var ' + name)

def cut(f, names):
    s = read(f); out = []
    for n in names:
        a, b = find_block(s, n)
        out.append(s[a:b])
        s = s[:a] + s[b:]
    write(f, s)
    return out

PLAN = json.load(open(sys.argv[1], encoding='utf-8'))
made = {}
for target, spec in PLAN['new_files'].items():
    parts = [spec.get('header', '')]
    for src_file, names in spec['take']:
        parts += cut(src_file, names)
    body = '\n'.join(p for p in parts if p)
    write(target, body if body.endswith('\n') else body + '\n')
    made[target] = len(body.encode())
for src_file, names, dest in PLAN.get('append', []):
    blocks = cut(src_file, names)
    s = read(dest)
    write(dest, s.rstrip('\n') + '\n\n' + '\n'.join(blocks) + '\n')
    made['append->' + dest] = sum(len(b.encode()) for b in blocks)
for f, n in sorted(made.items()):
    print('  %-34s %8d B' % (f, n))
