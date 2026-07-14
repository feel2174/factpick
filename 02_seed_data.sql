-- ============================================================================
-- FactPick (팩트픽) — 시드 데이터
-- ============================================================================
-- 01_schema.sql 실행 후 이 파일을 실행하세요.
-- 
-- 포함 내용:
--   - 인구집단 9개 (건강한 성인 기본값)
--   - 질환 10개 (MVP 1차 타겟)
--   - 성분 20개 (영양제 중심 + 비교용 약물 4개)
--   - 인구집단 자동 경고 룰 12개
-- ============================================================================

-- ============================================================================
-- [1] 인구집단 (populations)
-- ============================================================================

INSERT INTO populations (slug, name_ko, name_en, name_zh, is_default, display_order, description_ko, icon) VALUES
  ('healthy_adult',   '건강한 성인',     'Healthy adults',          '健康成人',    TRUE,  1, '특별한 기저질환이 없는 19~64세 성인', 'user'),
  ('elderly',         '고령자 (65+)',    'Elderly (65+)',           '老年人',      FALSE, 2, '65세 이상 고령자. 약물 대사 변화 고려 필요', 'user-heart'),
  ('pregnant',        '임신/수유부',     'Pregnant/Lactating',      '孕妇/哺乳期', FALSE, 3, '임신 중이거나 모유 수유 중인 여성', 'baby-carriage'),
  ('child',           '소아 (18 미만)',  'Children',                '儿童',        FALSE, 4, '18세 미만 소아 및 청소년', 'baby-bottle'),
  ('diabetes',        '당뇨 환자',       'Diabetes patients',       '糖尿病患者',  FALSE, 5, '1형 또는 2형 당뇨병 환자', 'droplet'),
  ('hypertension',    '고혈압 환자',     'Hypertension patients',   '高血压患者',  FALSE, 6, '고혈압 진단 또는 약물 복용 중', 'heart-rate-monitor'),
  ('liver_impaired',  '간기능 저하',     'Hepatic impairment',      '肝功能不全',  FALSE, 7, '간기능 저하 또는 간질환 환자', 'organ'),
  ('kidney_impaired', '신기능 저하',     'Renal impairment',        '肾功能不全',  FALSE, 8, '신기능 저하 또는 만성 신장질환 환자', 'organ'),
  ('athlete',         '운동선수',        'Athletes',                '运动员',      FALSE, 9, '고강도 운동을 하는 성인', 'barbell');

-- ============================================================================
-- [2] 질환 (conditions) — MVP 1차 10개
-- ============================================================================

INSERT INTO conditions (slug, name_ko, name_en, name_zh, icd10, category, description_ko, search_terms, display_order, is_published) VALUES
  ('osteoarthritis',     '골관절염',           'Osteoarthritis',          '骨关节炎',      'M19',  'musculoskeletal', '연골 마모로 인한 만성 관절 질환', ARRAY['osteoarthritis','joint pain','knee oa','hip oa'], 1, TRUE),
  ('insomnia',           '불면증',             'Insomnia',                '失眠',          'G47.0','sleep',           '잠들기 어렵거나 자주 깨는 수면 장애', ARRAY['insomnia','sleep disorder','sleep quality'], 2, TRUE),
  ('hypertension',       '고혈압',             'Hypertension',            '高血压',        'I10',  'cardiovascular',  '수축기 140 또는 이완기 90 mmHg 이상', ARRAY['hypertension','high blood pressure','BP control'], 3, TRUE),
  ('hyperlipidemia',     '이상지질혈증',       'Dyslipidemia',            '血脂异常',      'E78',  'metabolic',       'LDL 콜레스테롤 또는 중성지방 증가', ARRAY['dyslipidemia','hyperlipidemia','cholesterol','LDL'], 4, TRUE),
  ('depression_mild',    '경증 우울',          'Mild depression',         '轻度抑郁',      'F32',  'mental_health',   '경증 우울 증상 (DSM-5 기준 mild)', ARRAY['mild depression','depressive symptoms','MDD'], 5, TRUE),
  ('anxiety',            '불안 증상',          'Anxiety',                 '焦虑',          'F41',  'mental_health',   '범불안 증상 및 일반적 긴장감', ARRAY['anxiety','GAD','stress'], 6, TRUE),
  ('cognitive_decline',  '인지기능 저하',      'Cognitive decline',       '认知衰退',      'F03',  'cognitive',       '연령 관련 기억력/집중력 저하', ARRAY['cognitive decline','memory','MCI','dementia prevention'], 7, TRUE),
  ('immune_support',     '면역력 저하',        'Immune support',          '免疫力',        NULL,   'immune',          '잦은 감기/감염, 일반적 면역 지원', ARRAY['immune function','common cold','URI prevention'], 8, TRUE),
  ('skin_aging',         '피부 노화',          'Skin aging',              '皮肤老化',      'L98',  'dermatologic',    '주름, 탄력 저하, 광노화', ARRAY['skin aging','wrinkles','photoaging','skin elasticity'], 9, TRUE),
  ('migraine',           '편두통 예방',        'Migraine prevention',     '偏头痛预防',    'G43',  'neurologic',      '편두통 발작 빈도/강도 감소', ARRAY['migraine prevention','headache prophylaxis'], 10, TRUE);

-- ============================================================================
-- [3] 성분 (substances) — MVP 1차 20개
-- ============================================================================

-- 비타민/미네랄 (6)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('vitamin_d',      '비타민 D',     'Vitamin D',          '维生素D',     'vitamin',  'supplement', '지용성 비타민. 칼슘 흡수 및 면역 조절',          ARRAY['Vitamin D','Cholecalciferol','25-hydroxyvitamin D'], ARRAY['콜레칼시페롤','비타민D3']),
  ('magnesium',      '마그네슘',     'Magnesium',          '镁',          'mineral',  'supplement', '근육 이완, 신경 안정, 300+ 효소 보조인자',        ARRAY['Magnesium','Magnesium supplementation'], ARRAY['Mg']),
  ('zinc',           '아연',         'Zinc',               '锌',          'mineral',  'supplement', '면역 기능, 상처 치유, 미각 유지',                  ARRAY['Zinc','Zinc supplementation','Zn'], ARRAY['Zn']),
  ('vitamin_c',      '비타민 C',     'Vitamin C',          '维生素C',     'vitamin',  'supplement', '수용성 항산화제, 콜라겐 합성',                     ARRAY['Ascorbic Acid','Vitamin C'], ARRAY['아스코르브산']),
  ('vitamin_b12',    '비타민 B12',   'Vitamin B12',        '维生素B12',   'vitamin',  'supplement', '신경 기능, 적혈구 생성, DNA 합성',                ARRAY['Cyanocobalamin','Vitamin B 12','Methylcobalamin'], ARRAY['시아노코발라민','메틸코발라민']),
  ('selenium',       '셀레늄',       'Selenium',           '硒',          'mineral',  'supplement', '항산화 효소 보조인자, 갑상선 기능',                ARRAY['Selenium','Selenomethionine'], ARRAY['Se']);

-- 오메가/지방산 (1)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('omega3',         '오메가-3',     'Omega-3 fatty acids', '欧米伽-3',   'fatty_acid', 'supplement', 'EPA + DHA, 항염증 및 심혈관 보호',               ARRAY['Omega-3 Fatty Acids','EPA','DHA','Fish Oil'], ARRAY['피쉬오일','EPA','DHA']);

-- 코엔자임/유사물질 (1)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('coq10',          '코엔자임 Q10', 'Coenzyme Q10',       '辅酶Q10',     'coenzyme',  'supplement', '미토콘드리아 에너지 생산, 항산화',                 ARRAY['Coenzyme Q10','Ubiquinone','Ubiquinol','CoQ10'], ARRAY['유비퀴논','유비퀴놀']);

-- 아미노산 (1)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('nac',            'NAC',          'N-Acetylcysteine',   'N-乙酰半胱氨酸','amino_acid','supplement', '점액 용해, 글루타티온 전구체, 항산화',           ARRAY['Acetylcysteine','N-Acetylcysteine'], ARRAY['아세틸시스테인','N-아세틸시스테인']);

-- 관절 영양소 (3)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('glucosamine',    '글루코사민',   'Glucosamine',        '氨基葡萄糖',  'joint',    'supplement', '연골 기질 구성, 관절 건강',                        ARRAY['Glucosamine','Glucosamine Sulfate','Glucosamine Hydrochloride'], ARRAY['글루코사민황산염']),
  ('chondroitin',    '콘드로이친',   'Chondroitin',        '硫酸软骨素',  'joint',    'supplement', '연골 기질 구성, 관절 윤활',                        ARRAY['Chondroitin','Chondroitin Sulfates'], ARRAY['콘드로이친설페이트']),
  ('msm',            'MSM',          'Methylsulfonylmethane','甲基磺酰甲烷','joint',  'supplement', '유기황 화합물, 항염증',                            ARRAY['Methylsulfonylmethane','Dimethyl Sulfone','MSM'], ARRAY['메틸설포닐메탄','디메틸설폰']);

-- 허브/식물 (4)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('curcumin',       '커큐민',       'Curcumin',           '姜黄素',      'herb',     'supplement', '강황 활성성분, 항염증/항산화',                     ARRAY['Curcumin','Curcuma','Turmeric'], ARRAY['강황','터메릭']),
  ('boswellia',      '보스웰리아',   'Boswellia serrata',  '乳香',        'herb',     'supplement', '인도 유향, AKBA 함유, 항염증',                     ARRAY['Boswellia','Boswellia serrata','Frankincense'], ARRAY['유향']),
  ('ashwagandha',    '아슈와간다',   'Ashwagandha',        '南非醉茄',    'herb',     'supplement', '아유르베다 허브, 스트레스/코르티솔 조절',          ARRAY['Withania somnifera','Ashwagandha'], ARRAY['윈터체리']),
  ('rhodiola',       '홍경천',       'Rhodiola rosea',     '红景天',      'herb',     'supplement', '어댑토겐, 피로/스트레스 적응',                     ARRAY['Rhodiola','Rhodiola rosea','Rosavin'], ARRAY['로디올라']);

-- 기타 영양제 (4)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh, aliases) VALUES
  ('melatonin',      '멜라토닌',     'Melatonin',          '褪黑素',      'hormone',  'supplement', '송과체 호르몬, 수면-각성 리듬 조절',               ARRAY['Melatonin'], ARRAY['Melatonin']),
  ('probiotics',     '프로바이오틱스','Probiotics',        '益生菌',      'probiotic','supplement', '유익균, 장내 미생물 균형',                         ARRAY['Probiotics','Lactobacillus','Bifidobacterium'], ARRAY['유산균']),
  ('lutein',         '루테인',       'Lutein',             '叶黄素',      'carotenoid','supplement', '카로티노이드, 황반 보호',                          ARRAY['Lutein','Macular pigment'], ARRAY['루테인지아잔틴']),
  ('collagen',       '콜라겐',       'Collagen',           '胶原蛋白',    'protein',  'supplement', '결합조직 단백질, 가수분해 펩타이드',               ARRAY['Collagen','Hydrolyzed collagen','Collagen peptides'], ARRAY['가수분해콜라겐']);

-- 비교용 의약품 (4)
INSERT INTO substances (slug, name_ko, name_en, name_zh, category, substance_type, description_ko, pubmed_mesh) VALUES
  ('ibuprofen',      '이부프로펜',   'Ibuprofen',          '布洛芬',      'drug_nsaid',  'drug', 'NSAID, 통증/염증 완화',                            ARRAY['Ibuprofen','NSAID']),
  ('acetaminophen',  '아세트아미노펜','Acetaminophen',     '对乙酰氨基酚','drug_analgesic','drug', '진통/해열제 (타이레놀)',                          ARRAY['Acetaminophen','Paracetamol']),
  ('atorvastatin',   '아토르바스타틴','Atorvastatin',      '阿托伐他汀',  'drug_statin', 'drug', 'HMG-CoA 환원효소 억제제, 콜레스테롤 감소',         ARRAY['Atorvastatin','Statins']),
  ('losartan',       '로사르탄',     'Losartan',           '氯沙坦',      'drug_arb',    'drug', 'ARB, 안지오텐신 II 수용체 차단제',                 ARRAY['Losartan','ARB','Angiotensin Receptor Blockers']);

-- ============================================================================
-- [4] 한국 허가/규제 정보 (간이 시드)
-- ============================================================================

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['뼈/관절 건강에 도움']
FROM substances s WHERE s.slug IN ('glucosamine','chondroitin','msm','collagen');

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, TRUE, FALSE, ARRAY['칼슘 흡수 및 이용에 필요','뼈의 형성과 유지에 필요']
FROM substances s WHERE s.slug = 'vitamin_d';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['혈중 중성지질 개선','혈행 개선','기억력 개선']
FROM substances s WHERE s.slug = 'omega3';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['면역 기능에 필요']
FROM substances s WHERE s.slug = 'zinc';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['에너지 생성에 필요','신경과 근육 기능 유지에 필요']
FROM substances s WHERE s.slug = 'magnesium';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['항산화에 도움','피부 건강 유지에 필요']
FROM substances s WHERE s.slug = 'vitamin_c';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, FALSE, ARRAY['거대적아구성 빈혈 치료']
FROM substances s WHERE s.slug = 'vitamin_b12';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['항산화에 필요']
FROM substances s WHERE s.slug = 'selenium';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['항산화에 도움']
FROM substances s WHERE s.slug = 'coq10';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, TRUE, ARRAY['거담제']
FROM substances s WHERE s.slug = 'nac';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['관절/연골 건강에 도움']
FROM substances s WHERE s.slug = 'curcumin';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, FALSE, FALSE, ARRAY[]::text[]
FROM substances s WHERE s.slug IN ('boswellia','ashwagandha','rhodiola');

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, TRUE, ARRAY['일시적 불면증']
FROM substances s WHERE s.slug = 'melatonin';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['장 건강에 도움','면역 기능에 도움']
FROM substances s WHERE s.slug = 'probiotics';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, FALSE, TRUE, FALSE, ARRAY['황반색소 밀도 유지']
FROM substances s WHERE s.slug = 'lutein';

-- 의약품들
INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, FALSE, ARRAY['진통/소염']
FROM substances s WHERE s.slug = 'ibuprofen';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, FALSE, ARRAY['진통/해열']
FROM substances s WHERE s.slug = 'acetaminophen';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, TRUE, ARRAY['고지혈증 치료']
FROM substances s WHERE s.slug = 'atorvastatin';

INSERT INTO korean_regulatory (substance_id, mfds_drug_approved, mfds_functional, prescription_only, approved_functions)
SELECT s.id, TRUE, FALSE, TRUE, ARRAY['고혈압 치료']
FROM substances s WHERE s.slug = 'losartan';

-- ============================================================================
-- [5] 인구집단 자동 경고 룰
-- ============================================================================

-- 임신/수유부 — 허브류 일괄 주의
INSERT INTO population_warning_rules (population_id, substance_category, warning_type, warning_ko)
SELECT p.id, 'herb', 'caution', '임신/수유 중 안전성 자료 부족. 사용 전 의사 상담 권장'
FROM populations p WHERE p.slug = 'pregnant';

-- 임신/수유부 — 멜라토닌
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'avoid', '임신/수유 중 사용 권장하지 않음'
FROM populations p, substances s 
WHERE p.slug = 'pregnant' AND s.slug = 'melatonin';

-- 임신/수유부 — 아슈와간다 (유산 위험)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'avoid', '임신 중 사용 금지 (자궁 수축 가능성)'
FROM populations p, substances s 
WHERE p.slug = 'pregnant' AND s.slug = 'ashwagandha';

-- 신기능 저하 — 미네랄 일괄
INSERT INTO population_warning_rules (population_id, substance_category, warning_type, warning_ko)
SELECT p.id, 'mineral', 'dose_adjust', '신기능 저하 시 축적 가능. 용량 조절 또는 모니터링 필요'
FROM populations p WHERE p.slug = 'kidney_impaired';

-- 간기능 저하 — 허브 일괄
INSERT INTO population_warning_rules (population_id, substance_category, warning_type, warning_ko)
SELECT p.id, 'herb', 'caution', '간 대사 부담 가능성. 간기능 수치 모니터링 권장'
FROM populations p WHERE p.slug = 'liver_impaired';

-- 당뇨 환자 — 글루코사민 (혈당 영향)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'monitor', '혈당 상승 가능성 보고됨. 공복혈당/당화혈색소 모니터링 권장'
FROM populations p, substances s 
WHERE p.slug = 'diabetes' AND s.slug = 'glucosamine';

-- 당뇨 환자 — 아연 (혈당 영향)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'monitor', '인슐린 감수성 변화 가능. 혈당 모니터링 권장'
FROM populations p, substances s 
WHERE p.slug = 'diabetes' AND s.slug = 'zinc';

-- 고혈압 환자 — 감초류/허브 (혈압 영향)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'caution', '혈압에 영향 가능. 혈압 모니터링 권장'
FROM populations p, substances s 
WHERE p.slug = 'hypertension' AND s.slug = 'rhodiola';

-- 소아 — 호르몬류
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'caution', '소아 안전성 데이터 제한적. 단기 사용 및 의사 상담'
FROM populations p, substances s 
WHERE p.slug = 'child' AND s.slug = 'melatonin';

-- 소아 — 허브 일괄
INSERT INTO population_warning_rules (population_id, substance_category, warning_type, warning_ko)
SELECT p.id, 'herb', 'caution', '소아 임상 데이터 부족. 의사 상담 후 사용'
FROM populations p WHERE p.slug = 'child';

-- 고령자 — 멜라토닌 (적정 용량)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'dose_adjust', '고령자는 저용량(0.5~1mg)부터 시작 권장'
FROM populations p, substances s 
WHERE p.slug = 'elderly' AND s.slug = 'melatonin';

-- 고령자 — 마그네슘 (신기능 고려)
INSERT INTO population_warning_rules (population_id, substance_id, warning_type, warning_ko)
SELECT p.id, s.id, 'monitor', '신기능 저하 시 축적 가능. 크레아티닌 확인 후 용량 결정'
FROM populations p, substances s 
WHERE p.slug = 'elderly' AND s.slug = 'magnesium';

-- ============================================================================
-- [6] Materialized View 초기 갱신
-- ============================================================================

-- 데이터 들어오기 전이라 비어있지만, 구조는 만들어둠
REFRESH MATERIALIZED VIEW condition_scatter_data;

-- ============================================================================
-- 시드 데이터 끝
-- 다음: 03_helper_functions.sql 실행
-- ============================================================================

-- 확인용 쿼리
SELECT 'populations' AS table_name, COUNT(*) AS rows FROM populations
UNION ALL SELECT 'conditions', COUNT(*) FROM conditions
UNION ALL SELECT 'substances', COUNT(*) FROM substances
UNION ALL SELECT 'korean_regulatory', COUNT(*) FROM korean_regulatory
UNION ALL SELECT 'population_warning_rules', COUNT(*) FROM population_warning_rules;
