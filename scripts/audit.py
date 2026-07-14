#!/usr/bin/env python3
"""
factpick 데이터 감사관 (data auditor) — 2026-06-15.
verified_effects의 구조 무결성·일관성을 자동 점검. 배포 전 / 주기적으로 실행.
"쓰레기 원본 → 쓰레기 결과"를 막기 위한 게이트.

사용:
  python audit.py            # 전체 점검 리포트
  python audit.py --strict   # CRITICAL 발견 시 exit 1 (배포 게이트용)

점검 항목:
  [구조]  등급 enum / smd 범위 / smd_source enum / CI 정합 / 중복(성분×적응증)
  [출처]  PMID 유무·형식 / source_url↔PMID 일치
  [정합]  is_estimated↔smd_source / null smd·grade
  [근거]  노트의 I²와 GRADE 모순(이질성 높은데 high/moderate)
  [중복]  lumped(뭉뚱그린 약) vs 개별 약 동시 존재
환경: scripts/.env 의 SUPABASE_URL / SUPABASE_SERVICE_KEY
"""
import os, sys, re, json, urllib.request, urllib.parse, collections

# --- env ---
ENV = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(ENV):
    for line in open(ENV):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ.setdefault(k, v.strip())
URL = os.environ['SUPABASE_URL']; KEY = os.environ['SUPABASE_SERVICE_KEY']

def get(path, q):
    u = URL + path + '?' + urllib.parse.urlencode(q)
    r = urllib.request.Request(u); r.add_header('apikey', KEY); r.add_header('Authorization', 'Bearer ' + KEY)
    return json.loads(urllib.request.urlopen(r).read())

GRADES = {'high', 'moderate', 'low', 'very_low'}
SMD_SOURCES = {'direct', 'MD_converted', 'NNT_converted', 'single_RCT_estimated',
               'active_comparator_equivalence', 'secondary_citation', 'alternative_metric_only'}
NO_EVIDENCE_OK = {'L-테아닌', 'GABA', '코엔자임 Q10', '바코파', '이노시톨',
                  '포도씨추출물', '마그네슘 L-트레오네이트'}  # PMID 없어도 되는 '근거없음'류

conds = {c['id']: c['name_ko'] for c in get('/rest/v1/conditions', {'select': 'id,name_ko'})}
ve = get('/rest/v1/verified_effects', {'select': 'id,name_ko,name_en,condition_id,smd,evidence_grade,'
         'smd_source,is_estimated,funding_bias,source_code,source_url,ci_lower,ci_upper,'
         'studies_count,patients_count,notes,substance_id,substance_type'})

CRIT, WARN = [], []
def crit(cat, v, msg): CRIT.append((cat, conds.get(v['condition_id'], '?'), v['name_ko'], msg))
def warn(cat, v, msg): WARN.append((cat, conds.get(v['condition_id'], '?'), v['name_ko'], msg))

pair = collections.Counter()
lumped = collections.defaultdict(list)   # condition → lumped drug names
for v in ve:
    g = v['evidence_grade']; smd = v['smd']; sc = v['source_code']; note = v['notes'] or ''
    # 1) 등급 enum
    if g is not None and g not in GRADES:
        crit('등급', v, f'잘못된 등급 "{g}"')
    if g is None:
        warn('등급', v, '등급 없음(null)')
    # 2) smd 범위
    if smd is not None and abs(smd) > 1.2:
        warn('효과', v, f'|smd|={abs(smd):.2f} 비정상적으로 큼(검토)')
    # 3) smd_source enum
    if v['smd_source'] and v['smd_source'] not in SMD_SOURCES:
        crit('출처유형', v, f'잘못된 smd_source "{v["smd_source"]}"')
    # 4) CI 정합
    lo, hi = v['ci_lower'], v['ci_upper']
    if lo is not None and hi is not None and lo > hi:
        crit('CI', v, f'ci_lower {lo} > ci_upper {hi}')
    # 5) PMID 유무·형식
    if not sc:
        if v['name_ko'] not in NO_EVIDENCE_OK:
            warn('출처', v, 'PMID 없음(근거없음류 외)')
    else:
        if not str(sc).isdigit():
            warn('출처', v, f'PMID 비숫자 "{sc}"(텍스트 인용)')
        else:
            # 6) source_url ↔ PMID 일치
            if v['source_url'] and str(sc) not in v['source_url']:
                crit('출처링크', v, f'source_url이 PMID {sc}와 불일치')
    # 7) is_estimated ↔ smd_source
    if v['is_estimated'] is False and v['smd_source'] == 'alternative_metric_only':
        warn('정합', v, 'is_estimated=False인데 smd_source=alternative_metric_only')
    # 8) 노트의 I² vs GRADE
    m = re.search(r'I[²2\^]?\s*[=:]?\s*(\d{1,3})\s*%', note)
    if m:
        i2 = int(m.group(1))
        if i2 >= 90 and g in ('high', 'moderate'):
            crit('이질성', v, f'노트 I²={i2}%인데 등급 {g}(강등 필요)')
        elif i2 >= 50 and g == 'high':
            crit('이질성', v, f'노트 I²={i2}%인데 등급 high')
    # 9) 진짜 중복(같은 적응증 + 같은 표시명) — 용량/시점 변형은 name_ko가 달라 제외됨
    pair[(v['condition_id'], v['name_ko'])] += 1
    # 10) lumped 약 탐지
    if v['substance_type'] not in ('supplement', None):
        if re.search(r'[/·]', v['name_ko']) and ('등' in v['name_ko'] or 'SSRI' in v['name_ko']
                or 'ACE' in v['name_ko'] or '이뇨제' in v['name_ko']):
            lumped[conds.get(v['condition_id'])].append(v['name_ko'])

for (cidx, nm), n in pair.items():
    if n > 1:
        CRIT.append(('중복', conds.get(cidx, '?'), nm, f'동일 적응증에 같은 표시명 {n}회'))

# --- 리포트 ---
print(f'=== factpick 데이터 감사 ({len(ve)}개 항목 · {len(conds)} 적응증) ===\n')
print(f'CRITICAL {len(CRIT)} · WARNING {len(WARN)}\n')
if CRIT:
    print('■ CRITICAL (반드시 수정)')
    for cat, c, n, m in CRIT:
        print(f'  [{cat}] {c} / {n}: {m}')
    print()
if WARN:
    print('■ WARNING (검토 권장)')
    by = collections.Counter(w[0] for w in WARN)
    for cat, cnt in by.most_common():
        print(f'  · {cat}: {cnt}건')
    for cat, c, n, m in WARN[:40]:
        print(f'    [{cat}] {c} / {n}: {m}')
    if len(WARN) > 40:
        print(f'    … +{len(WARN)-40}건')
if lumped:
    print('\n■ 참고: lumped(뭉뚱그린 약) — 개별 약과 중복 가능(정리 검토)')
    for c, names in lumped.items():
        print(f'  {c}: {", ".join(names)}')

print('\n점검 항목: 등급/효과범위/출처유형/CI/PMID/출처링크/정합/이질성-GRADE/중복/lumped')
if '--strict' in sys.argv and CRIT:
    print('\n❌ CRITICAL 존재 — 배포 보류 권장 (exit 1)')
    sys.exit(1)
print('\n✅ 감사 완료' + (' (CRITICAL 없음)' if not CRIT else ''))
