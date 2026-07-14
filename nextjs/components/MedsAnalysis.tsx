'use client';

import type { ProductsBySubstance, VerifiedEffect } from '@/lib/types';
import { matchMeds, representativeEffects } from '@/lib/medsMatch';
import { isHeadlineEligible, isLowConfidence } from '@/lib/evidence';
import { ConfidenceChip, EvidenceNote } from './EvidenceTags';

interface Props {
  currentMeds: string;
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
}

function strengthOf(smd: number | null): { label: string; color: string } {
  if (smd === null) return { label: '데이터 부족', color: 'text-slate-500' };
  const abs = Math.abs(smd);
  if (abs >= 0.8) return { label: '효과 큼', color: 'text-emerald-600' };
  if (abs >= 0.5) return { label: '효과 중간', color: 'text-lime-600' };
  if (abs >= 0.2) return { label: '효과 작음', color: 'text-yellow-600' };
  if (abs >= 0.1) return { label: '미미함', color: 'text-orange-600' };
  return { label: '효과 없음(위약 수준)', color: 'text-slate-500' };
}

const GRADE_RANK: Record<string, number> = { high: 0, moderate: 1, low: 2, very_low: 3 };
function gradeRank(g: string | null): number {
  return g ? (GRADE_RANK[g] ?? 4) : 4;
}

const TYPE_KO: Record<string, string> = {
  supplement: '영양제',
  prescription: '처방약',
  topical_rx: '외용약',
  injection_rx: '주사/시술',
};
function typeKo(t: string | null): string {
  return (t && TYPE_KO[t]) || '약';
}

function isSupplement(v: VerifiedEffect): boolean {
  return v.substance_type === 'supplement';
}

function fmtSmd(smd: number | null): string {
  if (smd === null) return '—';
  return (smd >= 0 ? '+' : '') + smd.toFixed(2);
}

export default function MedsAnalysis({ currentMeds, verified, products }: Props) {
  const input = (currentMeds || '').trim();
  if (!input) return null;

  const { matched, unmatched } = matchMeds(input, verified, products);
  if (matched.length === 0) {
    // 매칭이 하나도 없으면 굳이 섹션을 띄우지 않음 (입력은 했지만 우리 DB 범위 밖)
    return null;
  }

  // 헤드라인("최선")은 원문에서 검증된 효과만 — 추정·2차인용은 제외
  const ranked = representativeEffects(verified)
    .filter((v) => v.smd !== null && isHeadlineEligible(v))
    .sort((a, b) => {
      const ea = Math.abs(a.smd ?? 0);
      const eb = Math.abs(b.smd ?? 0);
      if (Math.abs(ea - eb) > 0.1) return eb - ea;
      return gradeRank(a.evidence_grade) - gradeRank(b.evidence_grade);
    });
  const bestDrug = ranked.find((v) => !isSupplement(v));
  const bestSupp = ranked.find((v) => isSupplement(v));

  // "처방에 근접" 배지는 근거가 탄탄한 영양제일 때만 — 불확실한 큰 SMD를 과장하지 않음
  const suppNearRx =
    bestSupp &&
    bestDrug &&
    !isLowConfidence(bestSupp) &&
    Math.abs(bestSupp.smd ?? 0) >= Math.abs(bestDrug.smd ?? 0) * 0.8;

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
        복용 중인 약 분석
      </div>
      <h3 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">
        지금 드시는 약, 이 질환엔 어느 정도일까요?
      </h3>

      <div className="space-y-2.5">
        {matched.map((m) => {
          const s = strengthOf(m.effect.smd);
          return (
            <div
              key={m.effect.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-900">{m.query}</span>
                <span className="text-xs text-slate-400">→ 성분</span>
                <span className="text-sm font-medium text-slate-700">
                  {m.effect.name_ko}
                  {m.effect.variant_label ? ` (${m.effect.variant_label})` : ''}
                </span>
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {typeKo(m.effect.substance_type)}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className={`font-semibold ${s.color}`}>{s.label}</span>
                <span className="text-xs text-slate-500">SMD {fmtSmd(m.effect.smd)}</span>
                <ConfidenceChip v={m.effect} />
              </div>
              <EvidenceNote v={m.effect} />
            </div>
          );
        })}
      </div>

      {/* 정직한 비교: 가장 강한 선택지 */}
      {(bestDrug || bestSupp) && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 sm:p-4">
          <div className="mb-2 text-xs font-semibold text-emerald-700">
            이 질환, 근거·효과가 가장 강한 선택지
          </div>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {bestDrug && (
              <li>
                <span className="text-slate-400">처방·약 중 최강 ·</span>{' '}
                <span className="font-semibold text-slate-900">{bestDrug.name_ko}</span>{' '}
                <span className={strengthOf(bestDrug.smd).color}>
                  {strengthOf(bestDrug.smd).label}
                </span>
                <span className="text-xs text-slate-500"> (SMD {fmtSmd(bestDrug.smd)})</span>{' '}
                <ConfidenceChip v={bestDrug} />
                <EvidenceNote v={bestDrug} />
              </li>
            )}
            {bestSupp && (
              <li>
                <span className="text-slate-400">영양제 중 최선 ·</span>{' '}
                <span className="font-semibold text-slate-900">{bestSupp.name_ko}</span>{' '}
                <span className={strengthOf(bestSupp.smd).color}>
                  {strengthOf(bestSupp.smd).label}
                </span>
                <span className="text-xs text-slate-500"> (SMD {fmtSmd(bestSupp.smd)})</span>{' '}
                <ConfidenceChip v={bestSupp} />
                {suppNearRx && (
                  <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    처방에 근접
                  </span>
                )}
                <EvidenceNote v={bestSupp} />
              </li>
            )}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            ※ 처방약을 임의로 끊지 마세요. 영양제는 보조 수단이며, 변경 전 의사·약사와 상담하세요.
          </p>
        </div>
      )}

      {unmatched.length > 0 && (
        <p className="mt-3 text-[11px] text-slate-400">
          분석 대상 외: {unmatched.join(', ')} — 이 질환과 무관하거나 아직 데이터에 없는 약입니다.
        </p>
      )}
    </section>
  );
}
