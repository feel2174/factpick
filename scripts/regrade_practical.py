#!/usr/bin/env python3
"""
실용형 GRADE 보정 v2 (2026-06-09) — 안전판(강등 only).
- 현재 큐레이션 등급을 '천장'으로 두고, 초록에서 확실히 추출된 I²(이질성)로만 자동 강등.
- 자동 승격은 하지 않음(garbage meta가 위로 올라가는 사고 방지). 승격 '후보'는 검수용으로만 출력.
- 부수: studies_count(k) 구조화 채움(빈 칸만). patients_count(N)은 오추출 위험으로 자동기입 안 함(검수 출력만).
- I²/k는 노트 끝에 [근거: I²=.. k=..] 태그로 투명 기록.
사용: python regrade_practical.py            # dry-run
      python regrade_practical.py --apply    # 강등+구조화만 DB 반영
"""
import os, sys, json, re, urllib.request

APPLY = '--apply' in sys.argv
DATA = json.load(open('/tmp/grade_cache.json'))
LEVEL = {'high': 4, 'moderate': 3, 'low': 2, 'very_low': 1}
NAME = {4: 'high', 3: 'moderate', 2: 'low', 1: 'very_low'}


def is_meta(a):
    l = a.lower()
    return 'meta-analysis' in l or 'meta analysis' in l or 'systematic review' in l


def extract_i2(a):
    vals = []
    for m in re.finditer(r'I\s*[²2\^]?\s*[=:]?\s*(\d{1,3}(?:\.\d+)?)\s*%', a):
        v = float(m.group(1))
        if 0 <= v <= 100:
            vals.append(v)
    # 'heterogeneity ... 87%' 패턴 보강
    for m in re.finditer(r'heterogeneity[^.]{0,40}?(\d{1,3})\s*%', a, re.I):
        v = float(m.group(1))
        if 0 <= v <= 100:
            vals.append(v)
    return max(vals) if vals else None


def extract_k(a):
    cands = []
    for m in re.finditer(r'(\d{1,4})\s+(?:randomized controlled trials|randomised controlled trials|RCTs|trials|studies)\b', a):
        cands.append(int(m.group(1)))
    for m in re.finditer(r'(?:included|comprising|involving|a total of)\s+(\d{1,4})\s+(?:studies|trials|RCTs)', a):
        cands.append(int(m.group(1)))
    cands = [c for c in cands if 1 <= c <= 1000]
    return min(cands) if cands else None


changelog = []           # 자동 반영 대상(강등 or k기입)
upgrade_candidates = []   # 검수용(자동반영 X)
applied = 0
for v in DATA:
    a = v.get('abstract') or ''
    cur = v['evidence_grade']
    if not a or a == 'ERR' or not str(v['source_code']).isdigit() or cur not in LEVEL:
        continue
    meta = is_meta(a)
    i2 = extract_i2(a)
    k = extract_k(a)
    lvl = LEVEL[cur]
    reasons = []
    if i2 is not None and i2 >= 90:
        lvl -= 2; reasons.append(f'I²{int(i2)}%(매우심각·-2)')
    elif i2 is not None and i2 >= 50:
        lvl -= 1; reasons.append(f'I²{int(i2)}%(심각·-1)')
    lvl = max(1, lvl)  # 강등만; 천장=현등급
    new = NAME[lvl]

    structured = {}
    if k is not None and v.get('studies_count') is None:
        structured['studies_count'] = k

    # 노트에 근거 태그(중복 방지)
    note_tag = ''
    bits = []
    if i2 is not None: bits.append(f'I²={int(i2)}%')
    if k is not None: bits.append(f'k={k}')
    note = v.get('notes') or ''
    new_note = note
    if bits and '[근거:' not in note:
        new_note = (note + f' [근거: {", ".join(bits)}]').strip()

    change = {}
    if new != cur:
        change['evidence_grade'] = new
    change.update(structured)
    if new_note != note:
        change['notes'] = new_note

    if change:
        changelog.append({'slug': v['slug'], 'name': v['name_ko'], 'old': cur, 'new': new,
                          'i2': i2, 'k': k, 'reasons': reasons, 'id': v['id'], 'change': change})

    # 승격 후보(검수용): 큰 메타·낮은 I²인데 현재 low 이하
    if meta and (i2 is not None and i2 < 30) and (k is not None and k >= 10) and LEVEL[cur] <= 2 and not v['is_estimated']:
        upgrade_candidates.append((v['slug'], v['name_ko'], cur, i2, k))

dg = [c for c in changelog if c['old'] != c['new']]
print(f'총 {len(DATA)} | 자동변경(강등/k기입) {len(changelog)} | 그중 등급강등 {len(dg)} | 승격후보(검수) {len(upgrade_candidates)}')
print(f'\n=== 등급 강등 {len(dg)}건 (자동 반영) ===')
for c in sorted(dg, key=lambda x: (x['slug'], x['name'])):
    print(f"  [{c['slug']}] {c['name']}: {c['old']}→{c['new']} | {','.join(c['reasons'])}")
print(f'\n=== 승격 후보 {len(upgrade_candidates)}건 (자동반영 X·영선 검수) ===')
for s, n, g, i2, k in sorted(upgrade_candidates):
    print(f'  [{s}] {n}: 현재 {g} | I²={int(i2)}% k={k} → 상향 검토')

json.dump({'changelog': changelog, 'upgrade_candidates': upgrade_candidates},
          open('/tmp/grade_changelog.json', 'w'), ensure_ascii=False, indent=1)

if APPLY:
    URL = os.environ['SUPABASE_URL']; KEY = os.environ['SUPABASE_SERVICE_KEY']
    def patch(vid, body):
        u = URL + '/rest/v1/verified_effects?id=eq.' + vid
        r = urllib.request.Request(u, data=json.dumps(body).encode(), method='PATCH')
        for kk, vv in [('apikey', KEY), ('Authorization', 'Bearer ' + KEY), ('Content-Type', 'application/json'), ('Prefer', 'return=representation')]:
            r.add_header(kk, vv)
        return len(json.loads(urllib.request.urlopen(r).read().decode() or '[]'))
    for c in changelog:
        applied += patch(c['id'], c['change'])
    print(f'\n✅ DB 반영: {applied}건 (강등 {len(dg)} + k기입/노트)')
else:
    print('\n(dry-run — DB 미반영)')
