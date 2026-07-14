#!/usr/bin/env python3
"""
factpick 의미 감사관 (semantic auditor) — 2026-06-15.
각 항목의 인용 PMID 초록을 가져와 '성분명/적응증'이 실제로 그 논문에 등장하는지 대조.
'쓰레기 처리'(엉뚱한 논문 인용·모집단 불일치)를 적발. 본체 에이전트(네트워크 가능)에서 실행.
초록은 /tmp/audit_abs.json 에 캐시. NCBI 429 방지 sleep 0.4s.
사용: python audit_semantic.py
"""
import os, re, json, time, urllib.request, urllib.parse, collections

ENV = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(ENV):
    for line in open(ENV):
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1); os.environ.setdefault(k, v.strip())
URL = os.environ['SUPABASE_URL']; KEY = os.environ['SUPABASE_SERVICE_KEY']
def get(p, q):
    u = URL + p + '?' + urllib.parse.urlencode(q)
    r = urllib.request.Request(u); r.add_header('apikey', KEY); r.add_header('Authorization', 'Bearer ' + KEY)
    return json.loads(urllib.request.urlopen(r).read())

conds = {c['id']: c['slug'] for c in get('/rest/v1/conditions', {'select': 'id,slug'})}
ve = get('/rest/v1/verified_effects', {'select': 'name_ko,name_en,condition_id,source_code,notes'})

CACHE = '/tmp/audit_abs.json'
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def abstract(pid):
    if pid in cache: return cache[pid]
    try:
        t = urllib.request.urlopen('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=%s&rettype=abstract&retmode=text' % pid).read().decode('utf8', 'ignore')
        t = re.sub(r'\s+', ' ', t)
    except Exception:
        t = ''
    cache[pid] = t; time.sleep(0.4); return t

STOP = {'oral','acid','extract','vitamin','red','korean','of','and','the','inhibitor','monoclonal',
        'antibody','low-dose','antagonist','receptor','blocker','drops','eye','supplement','formula'}
def tokens(en):
    if not en: return []
    en = en.split('(')[0]
    ws = [w for w in re.findall(r'[A-Za-z][A-Za-z-]{3,}', en) if w.lower() not in STOP]
    return ws or re.findall(r'[A-Za-z][A-Za-z-]{3,}', en)
CKW = {'skin_aging':['skin','wrinkle','elasticity','hydration','photoaging','dermal'],
 'cognitive_decline':['cognit','dementia','alzheimer','memory','mci','mmse','adas'],
 'immune_support':['respiratory','cold','influenza','infection','immun','urti','uri'],
 'anxiety':['anxiety','anxiolytic','gad','ham-a','hads','panic'],
 'hyperlipidemia':['ldl','cholesterol','lipid','triglyceride','dyslipidem'],
 'depression_mild':['depress','ham-d','phq','mood','madrs'],
 'insomnia':['sleep','insomnia','psqi','isi'],'hypertension':['blood pressure','hypertens','sbp','dbp','mmhg'],
 'migraine':['migraine','headache'],'osteoarthritis':['osteoarthritis','knee','womac','joint','pain'],
 'eye_health':['eye','macular','amd','retina','dry eye','vision','visual','ocular','cataract','glaucoma'],
 'liver_health':['liver','hepat','nafld','nash','steatos','alt','cirrh','bili'],
 'menopause':['menopaus','hot flash','vasomotor','postmenopaus','climacteric'],
 'constipation':['constipation','bowel movement','stool','laxative','sbm'],
 'diarrhea':['diarrhea','diarrhoea','stool','dehydration','gastroenteritis'],
 'gut_health':['irritable bowel','ibs','gut','intestin','abdominal','bowel','microbiota']}

sub_miss, cond_miss, ok, nopmid = [], [], 0, 0
for v in ve:
    pid = v['source_code']
    if not (pid and str(pid).isdigit()):
        nopmid += 1; continue
    ab = abstract(pid).lower()
    if not ab: continue
    toks = tokens(v['name_en'])
    subhit = (not toks) or any(t.lower() in ab for t in toks)
    ckw = CKW.get(conds[v['condition_id']], [])
    condhit = (not ckw) or any(k in ab for k in ckw)
    if not subhit: sub_miss.append((conds[v['condition_id']], v['name_ko'], v['name_en'], pid))
    elif not condhit: cond_miss.append((conds[v['condition_id']], v['name_ko'], v['name_en'], pid))
    else: ok += 1
json.dump(cache, open(CACHE, 'w'))

print(f'=== 의미 감사: {ok} 정상 | 성분 불일치 {len(sub_miss)} | 적응증 불일치 {len(cond_miss)} | PMID없음 {nopmid} ===\n')
print('■ 성분명이 인용 초록에 없음 (엉뚱한 논문 의심 — 우선 점검)')
for s in sub_miss: print('  ', s)
print('\n■ 적응증 키워드 없음 (모집단/맥락 점검)')
for s in cond_miss: print('  ', s)
print('\n(※ 일부는 β-glucan/약물명·동의어 차이로 인한 오탐 가능 — 사람이 최종 확인)')
