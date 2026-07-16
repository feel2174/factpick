'use client';

import { useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Scatter,
  ScatterChart as ReScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ResponsiveContainer,
  Label,
  useXAxisScale,
  useYAxisScale,
  usePlotArea,
  useChartWidth,
} from 'recharts';
import type {
  ProductsBySubstance,
  VerifiedEffect,
} from '@/lib/types';
import {
  efficacyYScore,
  evidenceXScore,
  groupVerified,
} from '@/lib/verifiedUtils';

const SUPPLEMENT_COLOR = '#22c55e';
const DRUG_COLOR = '#ef4444';
const HIDE_THRESHOLD = 0.1; // |SMD| < 0.1 → 산점도에서 숨김

interface PlotPoint {
  x: number;
  y: number;
  name: string;
  productName: string | null;
  productManuf: string | null;
  productType: string | null;
  productNote: string | null;
  variant: string | null;
  type: 'supplement' | 'drug';
  source: 'verified' | 'ai';
  smd: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  evidenceGrade: string | null;
  smdSource: string | null;
  fundingBias: boolean;
  sourceCode: string | null;
  studiesCount: number | null;
  patientsCount: number | null;
  note: string | null;
  verifiedId: string | null;
  key: string;
}

interface Props {
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
  highlightVerifiedIds?: Set<string>;
  avoidVerifiedIds?: Set<string>;
}

function classifyType(t: string | null | undefined): 'supplement' | 'drug' {
  return t === 'supplement' ? 'supplement' : 'drug';
}

function labelText(
  p: PlotPoint,
  mode: 'substance' | 'product',
  highlight?: Set<string>,
  avoid?: Set<string>,
): string {
  const isHi = p.verifiedId && highlight?.has(p.verifiedId);
  const isAv = p.verifiedId && avoid?.has(p.verifiedId);
  // 영양제(대표 성분)는 효과가 작아도 라벨 항상 표시 — 메타가 권고한 성분이
  // 가려지지 않게(예: 편두통 리보플라빈). 약은 수가 많고 비교용이라
  // 효과 미미하면 라벨 생략해 혼잡을 줄인다. 추천(✨)·회피는 기존 규칙 유지.
  if (!isHi && p.type === 'drug' && p.smd !== null && Math.abs(p.smd) < 0.3) return '';
  if (isAv) return '';
  let s = mode === 'product' && p.productName ? p.productName : p.name;
  if (s.length > 12) s = s.slice(0, 11) + '…';
  return isHi ? `✨ ${s}` : s;
}

// 점 라벨 레이어: recharts v3 훅으로 데이터좌표→픽셀을 직접 계산해
// 라벨끼리 겹치지 않도록 세로로 밀어내고, 밀린 라벨은 가는 선으로 점과 연결.
// (기본 LabelList는 충돌 회피가 없어 라벨이 서로 포개진다.)
function LabelsLayer({
  points,
  labelMode,
  highlight,
  avoid,
}: {
  points: PlotPoint[];
  labelMode: 'substance' | 'product';
  highlight?: Set<string>;
  avoid?: Set<string>;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  const chartW = useChartWidth();
  if (!xScale || !yScale || !plot || !chartW) return null;

  const FS = 12;
  const LINE_H = 16;
  const charW = (ch: string) => (/[ᄀ-￿]/.test(ch) ? 12 : 7);
  const textW = (t: string) =>
    Math.max(12, Array.from(t).reduce((s, c) => s + charW(c), 0));

  type Box = {
    px: number; py: number; cx: number; cy: number;
    w: number; h: number; text: string; isHi: boolean; key: string;
  };
  const desired: Box[] = [];
  for (const p of points) {
    const text = labelText(p, labelMode, highlight, avoid);
    if (!text) continue;
    const px = xScale(p.x) as number;
    const py = yScale(p.y) as number;
    if (px == null || py == null || Number.isNaN(px) || Number.isNaN(py)) continue;
    const w = textW(text);
    const isHi = !!(p.verifiedId && highlight?.has(p.verifiedId));
    desired.push({ px, py, cx: px, cy: py - 14, w, h: LINE_H, text, isHi, key: p.key });
  }
  // 추천(✨) 라벨을 먼저 배치해 우선권을 준다. 그다음 위에서 아래로.
  desired.sort((a, b) => Number(b.isHi) - Number(a.isHi) || a.py - b.py || a.px - b.px);

  const minX = plot.x;
  const maxX = plot.x + plot.width;
  const collide = (a: Box, b: Box) =>
    Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 + 3 && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2;

  const placed: Box[] = [];
  for (const b of desired) {
    b.cx = Math.min(maxX - b.w / 2 - 2, Math.max(minX + b.w / 2 + 2, b.cx));
    const baseCy = b.cy;
    let best = b.cy;
    let found = false;
    for (let step = 0; step <= 9 && !found; step++) {
      for (const dir of step === 0 ? [0] : [-1, 1]) {
        const cy = baseCy + dir * step * LINE_H;
        const cand = { ...b, cy };
        if (cy - b.h / 2 < plot.y - 18) continue;
        if (cy + b.h / 2 > plot.y + plot.height) continue;
        if (!placed.some((q) => collide(cand, q))) {
          best = cy;
          found = true;
          break;
        }
      }
    }
    b.cy = best;
    placed.push(b);
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {placed.map((b) => {
        const displaced = Math.abs(b.cy - (b.py - 14)) > 7;
        return (
          <g key={b.key}>
            {displaced && (
              <line
                x1={b.px}
                y1={b.py - 8}
                x2={b.cx}
                y2={b.cy + b.h / 2 - 2}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            )}
            <text
              x={b.cx}
              y={b.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={FS}
              fontWeight={600}
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth={3}
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {b.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function lookupProduct(
  products: ProductsBySubstance,
  substanceId: string | null,
  verifiedId?: string | null,
): {
  name: string | null;
  manufacturer: string | null;
  type: string | null;
  note: string | null;
} {
  if (!substanceId) return { name: null, manufacturer: null, type: null, note: null };
  const bundle = products[substanceId];
  if (!bundle) return { name: null, manufacturer: null, type: null, note: null };

  // verified variant 매칭: matches_verified_id 우선
  if (verifiedId) {
    if (bundle.top.matches_verified_id === verifiedId) {
      return {
        name: bundle.top.name,
        manufacturer: bundle.top.manufacturer,
        type: bundle.top.type,
        note: bundle.top.note ?? null,
      };
    }
    for (const o of bundle.others ?? []) {
      if (o.matches_verified_id === verifiedId) {
        return {
          name: o.name,
          manufacturer: o.manufacturer,
          type: o.type,
          note: o.note ?? null,
        };
      }
    }
  }

  return {
    name: bundle.top.name,
    manufacturer: bundle.top.manufacturer,
    type: bundle.top.type,
    note: bundle.top.note ?? null,
  };
}

function verifiedToPoint(v: VerifiedEffect, products: ProductsBySubstance): PlotPoint | null {
  if (v.smd === null) return null;
  const prod = lookupProduct(products, v.substance_id, v.verified_id);
  return {
    x: evidenceXScore(v),
    y: efficacyYScore(v.smd),
    name: v.name_ko,
    productName: prod.name,
    productManuf: prod.manufacturer,
    productType: prod.type,
    productNote: prod.note,
    variant: v.variant_label,
    type: classifyType(v.substance_type),
    source: 'verified',
    smd: v.smd,
    ciLower: v.ci_lower,
    ciUpper: v.ci_upper,
    evidenceGrade: v.evidence_grade,
    smdSource: v.smd_source,
    fundingBias: v.funding_bias,
    sourceCode: v.source_code,
    studiesCount: v.studies_count,
    patientsCount: v.patients_count,
    note: v.notes,
    verifiedId: v.verified_id,
    key: `v-${v.id}`,
  };
}

// 시각적으로 겹치는(= 같은 높이대에서 x가 너무 가까운) 점들을 "옆으로 쭈루룩"
// 가로로 밀어 모두 보이게 한다. 각 점의 실제 y(효능)는 절대 건드리지 않아
// 수치가 조금이라도 다르면 높이가 다르게 보인다. x만 최소한으로 분산.
// (예: 편두통에서 마그네슘·칸데사르탄이 동일 좌표 → 약이 영양제를 덮던 문제 해결.)
// 반복(relaxation)으로 분산 뒤 새로 생기는 연쇄 충돌까지 수렴시킨다(점 ≤ 수십 개).
function spreadOverlaps(points: PlotPoint[]): void {
  const GAP = 0.16; // 군집 내 최소 가로 간격(데이터좌표) — 화면상 점이 안 겹칠 정도
  const YBAND = 0.12; // y가 이보다 멀면 이미 세로로 분리됨 → 가로 충돌 무시
  const LO = 0.08;
  const HI = 4.92;
  const n = points.length;
  if (n < 2) return;
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const p = points[i];
        const q = points[j];
        if (Math.abs(p.y - q.y) >= YBAND) continue;
        const dx = q.x - p.x;
        if (Math.abs(dx) >= GAP) continue;
        const lo = dx >= 0 ? p : q; // 화면상 왼쪽 점
        const hi = dx >= 0 ? q : p;
        const need = GAP - Math.abs(dx);
        let left = need / 2;
        let right = need / 2;
        const loRoom = lo.x - LO;
        const hiRoom = HI - hi.x;
        if (left > loRoom) {
          right += left - loRoom;
          left = loRoom;
        }
        if (right > hiRoom) {
          left = Math.min(loRoom, left + (right - hiRoom));
          right = hiRoom;
        }
        lo.x -= left;
        hi.x += right;
        if (left > 1e-4 || right > 1e-4) moved = true;
      }
    }
    if (!moved) break;
  }
}

function buildPoints(
  verified: VerifiedEffect[],
  products: ProductsBySubstance,
  hideMinimal: boolean,
): { supplements: PlotPoint[]; drugs: PlotPoint[] } {
  const { groups, singles } = groupVerified(verified);

  const points: PlotPoint[] = [];

  for (const v of singles) {
    const p = verifiedToPoint(v, products);
    if (p) points.push(p);
  }
  for (const g of groups) {
    const p = verifiedToPoint(g.rep, products);
    if (p) {
      p.name = g.baseName;
      p.variant = g.rep.variant_label
        ? `대표 ${g.rep.variant_label} (시점 ${g.timeline.length}개 통합)`
        : `시점 ${g.timeline.length}개 통합`;
      points.push(p);
    }
  }

  const visible = points.filter(
    (p) => !(hideMinimal && p.smd !== null && Math.abs(p.smd) < HIDE_THRESHOLD),
  );
  spreadOverlaps(visible);

  const supplements: PlotPoint[] = [];
  const drugs: PlotPoint[] = [];
  for (const p of visible) {
    if (p.type === 'drug') drugs.push(p);
    else supplements.push(p);
  }
  return { supplements, drugs };
}

// 소비자용 쉬운 표현
const GRADE_KO: Record<string, string> = {
  high: '강함', moderate: '보통', low: '낮음', very_low: '매우 낮음',
};
function effWord(smd: number): string {
  const a = Math.abs(smd);
  if (a >= 0.8) return '큼';
  if (a >= 0.5) return '중간';
  if (a >= 0.2) return '작음';
  if (a >= 0.1) return '미미';
  return '거의 없음';
}

function PointTooltip({
  active,
  payload,
  labelMode,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  labelMode: 'substance' | 'product';
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as PlotPoint | undefined;
  if (!p) return null;
  const typeKo = p.type === 'drug' ? '약' : '영양제';
  const primary = labelMode === 'product' && p.productName ? p.productName : p.name;
  const secondary = labelMode === 'product' && p.productName ? p.name : p.productName;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-lg">
      <div className="font-semibold">
        {primary}{' '}
        <span className={p.type === 'drug' ? 'text-rose-500' : 'text-emerald-600'}>
          ({typeKo})
        </span>
      </div>
      {secondary && (
        <div className="mt-0.5 text-[11px] text-slate-500">
          {labelMode === 'product' ? `성분: ${secondary}` : `시판: ${secondary}`}
        </div>
      )}
      {p.productManuf && (
        <div className="text-[11px] text-slate-500">
          {p.productManuf}
          {p.productType && ` · ${p.productType}`}
        </div>
      )}
      {p.productNote && (
        <div className="mt-0.5 text-[10px] italic text-amber-600">{p.productNote}</div>
      )}
      {p.variant && <div className="mt-1 text-[11px] text-slate-700">{p.variant}</div>}
      <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-700">
        {p.smd !== null && (
          <div>
            <span className="text-slate-500">효과</span> {effWord(p.smd)}{' '}
            <span className="text-slate-400">({Math.abs(p.smd).toFixed(2)})</span>
          </div>
        )}
        {p.evidenceGrade && (
          <div>
            <span className="text-slate-500">근거</span> {GRADE_KO[p.evidenceGrade] ?? p.evidenceGrade}
          </div>
        )}
        {(p.studiesCount !== null || p.patientsCount !== null) && (
          <div>
            <span className="text-slate-500">연구 규모</span>{' '}
            {p.studiesCount !== null && `${p.studiesCount}편`}
            {p.studiesCount !== null && p.patientsCount !== null && ' · '}
            {p.patientsCount !== null && `참여 ${p.patientsCount.toLocaleString()}명`}
          </div>
        )}
        {p.sourceCode && (
          <div>
            <span className="text-slate-500">참고 논문</span> PubMed {p.sourceCode}
          </div>
        )}
        {p.fundingBias && (
          <div className="text-rose-600">⚠ 제조사 후원 연구 많음</div>
        )}
      </div>
      {p.note && (
        <div className="mt-1 max-w-[240px] border-t border-slate-100 pt-1 text-[10px] leading-relaxed text-slate-400">
          자세히 · {p.note}
        </div>
      )}
    </div>
  );
}

export default function ScatterChart({
  verified,
  products,
  highlightVerifiedIds,
  avoidVerifiedIds,
}: Props) {
  const [showSupp, setShowSupp] = useState(true);
  const [showDrug, setShowDrug] = useState(true);
  const [hideMinimal, setHideMinimal] = useState(true);
  const [labelMode, setLabelMode] = useState<'substance' | 'product'>('product');

  const { supplements, drugs } = buildPoints(verified, products, hideMinimal);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSupp((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            showSupp
              ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SUPPLEMENT_COLOR }} />
          영양제 {supplements.length}
        </button>
        <button
          type="button"
          onClick={() => setShowDrug((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            showDrug
              ? 'border-rose-300 bg-rose-50 text-rose-600'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DRUG_COLOR }} />
          약 {drugs.length}
        </button>
        <button
          type="button"
          onClick={() => setHideMinimal((v) => !v)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            hideMinimal
              ? 'border-slate-200 bg-white text-slate-700'
              : 'border-slate-200 text-slate-400'
          }`}
          title={`|SMD| < ${HIDE_THRESHOLD} (효과 미미) 숨김`}
        >
          {hideMinimal ? '✓ 효과 미미 숨김' : '효과 미미 표시'}
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <span className="text-slate-500">라벨</span>
          <button
            type="button"
            onClick={() => setLabelMode('product')}
            className={`rounded-l-md border border-slate-200 px-2 py-1 ${
              labelMode === 'product'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:border-slate-300'
            }`}
          >
            제품명
          </button>
          <button
            type="button"
            onClick={() => setLabelMode('substance')}
            className={`rounded-r-md border border-l-0 border-slate-200 px-2 py-1 ${
              labelMode === 'substance'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:border-slate-300'
            }`}
          >
            성분명
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:text-xs">
        점이 <b className="text-slate-800">위로 갈수록 효과가 큽니다</b> · 오른쪽일수록 근거가 탄탄합니다.
      </div>

      <div className="h-[760px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReScatterChart margin={{ top: 32, right: 48, bottom: 64, left: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="근거"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              stroke="#94a3b8"
              tick={{ fill: '#475569', fontSize: 14 }}
              tickMargin={8}
            >
              <Label
                value="근거 신뢰도 →"
                position="insideBottom"
                offset={-24}
                fill="#334155"
                style={{ fontSize: 15, fontWeight: 600 }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              name="효능"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              stroke="#94a3b8"
              tick={{ fill: '#475569', fontSize: 14 }}
              tickMargin={8}
            >
              <Label
                value="효능"
                position="insideLeft"
                angle={-90}
                offset={8}
                fill="#334155"
                style={{ textAnchor: 'middle', fontSize: 15, fontWeight: 600 }}
              />
            </YAxis>
            <ZAxis range={[220, 220]} />
            <Tooltip
              isAnimationActive={false}
              animationDuration={0}
              cursor={{ strokeDasharray: '3 3' }}
              wrapperStyle={{ pointerEvents: 'none' }}
              content={(p) => (
                <PointTooltip
                  active={p.active}
                  payload={p.payload as ReadonlyArray<{ payload?: unknown }> | undefined}
                  labelMode={labelMode}
                />
              )}
            />
            {showSupp && (
              <Scatter name="영양제" data={supplements} shape="circle">
                {supplements.map((p) => {
                  const isHi = p.verifiedId && highlightVerifiedIds?.has(p.verifiedId);
                  const isAv = p.verifiedId && avoidVerifiedIds?.has(p.verifiedId);
                  return (
                    <Cell
                      key={p.key}
                      fill={SUPPLEMENT_COLOR}
                      stroke={isHi ? '#fde047' : SUPPLEMENT_COLOR}
                      strokeWidth={isHi ? 4 : 1}
                      opacity={isAv ? 0.3 : 1}
                    />
                  );
                })}
              </Scatter>
            )}
            {showDrug && (
              <Scatter name="약" data={drugs} shape="circle">
                {drugs.map((p) => {
                  const isHi = p.verifiedId && highlightVerifiedIds?.has(p.verifiedId);
                  const isAv = p.verifiedId && avoidVerifiedIds?.has(p.verifiedId);
                  return (
                    <Cell
                      key={p.key}
                      fill={DRUG_COLOR}
                      stroke={isHi ? '#fde047' : DRUG_COLOR}
                      strokeWidth={isHi ? 4 : 1}
                      opacity={isAv ? 0.3 : 1}
                    />
                  );
                })}
              </Scatter>
            )}
            <LabelsLayer
              points={[...(showSupp ? supplements : []), ...(showDrug ? drugs : [])]}
              labelMode={labelMode}
              highlight={highlightVerifiedIds}
              avoid={avoidVerifiedIds}
            />
          </ReScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <p>
          <b>↑ 위로 갈수록</b> 효과가 크고, <b>→ 오른쪽일수록</b> 그 효과를 뒷받침하는 연구 근거가 탄탄합니다.
          (근거는 의학 표준 평가법으로 매겼어요.)
        </p>
        <p>
          <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: SUPPLEMENT_COLOR }} /> 영양제 ·{' '}
          <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: DRUG_COLOR }} /> 약.
          점에 마우스를 올리면 효과·근거·참고 논문이 보여요. 효과가 거의 없는 항목은 기본적으로 숨겨져 있어요.
        </p>
      </div>
    </div>
  );
}
