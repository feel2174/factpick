'use client';

import { useEffect, useRef, useState } from 'react';
import type { PersonalizationRule, Severity, UserProfile } from '@/lib/types';
import {
  aggregateHighlights,
  clearProfile,
  computeBMI,
  loadProfile,
  matchRules,
  saveProfile,
} from '@/lib/personalization';

interface Props {
  rules: PersonalizationRule[];
  onMatchChange?: (h: {
    highlightVerifiedIds: Set<string>;
    avoidVerifiedIds: Set<string>;
  }) => void;
}

const COMORBIDITIES: Array<{ key: keyof UserProfile; label: string }> = [
  { key: 'diabetes', label: '당뇨' },
  { key: 'hypertension', label: '고혈압' },
  { key: 'dyslipidemia', label: '고지혈증' },
  { key: 'gout', label: '통풍' },
  { key: 'anticoagulant', label: '항응고제 복용 (와파린/아스피린/엘리퀴스 등)' },
  { key: 'nsaid_allergy', label: 'NSAID(이부프로펜 등) 알레르기' },
  { key: 'gi_history', label: '위궤양·위염 병력' },
  { key: 'nsaid_gi_side_effect', label: 'NSAID 먹으면 속 쓰림' },
  { key: 'current_nsaid', label: '현재 NSAID 처방받음' },
  { key: 'regular_steroid_injection', label: '정형외과 주사를 정기적으로 맞음' },
];

const SEVERITY_OPTIONS: Array<{ value: Severity; label: string; help: string }> = [
  { value: 'mild', label: '경도', help: '가벼움 (가벼운 수치 상승)' },
  { value: 'moderate', label: '중등도', help: '중간 (관리 필요)' },
  { value: 'severe', label: '중증', help: '심함 (전문의 관리)' },
];

function SeveritySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Severity | null;
  onChange: (v: Severity | null) => void;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="mb-1.5 text-xs text-slate-700">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
            value === null
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          없음
        </button>
        {SEVERITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            title={o.help}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
              value === o.value
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const RANK_STYLES: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700' },
  2: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  3: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' },
};

export default function PersonalizedPanel({ rules, onMatchChange }: Props) {
  const [profile, setProfile] = useState<UserProfile>({});
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(true);

  // LocalStorage에서 로드
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setSubmitted(true);
      setOpen(false);
    }
  }, []);

  // onMatchChange ref로 안정화 — useEffect deps에 직접 넣으면 부모 인라인 함수 변경 시 무한 루프
  const onMatchChangeRef = useRef(onMatchChange);
  useEffect(() => {
    onMatchChangeRef.current = onMatchChange;
  }, [onMatchChange]);

  // 매칭 결과 부모에게 통보 (onMatchChange는 ref로만 접근)
  useEffect(() => {
    const cb = onMatchChangeRef.current;
    if (!cb) return;
    if (!submitted) {
      cb({ highlightVerifiedIds: new Set(), avoidVerifiedIds: new Set() });
      return;
    }
    const matched = matchRules(rules, profile);
    cb(aggregateHighlights(matched));
  }, [submitted, profile, rules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    setSubmitted(true);
    setOpen(false);
  };

  const handleReset = () => {
    clearProfile();
    setProfile({});
    setSubmitted(false);
    setOpen(true);
  };

  const matched = submitted ? matchRules(rules, profile) : [];
  const bmi = computeBMI(profile);

  // 프로파일 요약
  const summary: string[] = [];
  if (bmi !== null) summary.push(`BMI ${bmi.toFixed(1)}`);
  if (profile.age) summary.push(`${profile.age}세`);
  for (const c of COMORBIDITIES) {
    if (profile[c.key]) summary.push(c.label);
  }
  if (profile.liver_severity) {
    summary.push(
      `간기능 ${SEVERITY_OPTIONS.find((o) => o.value === profile.liver_severity)?.label ?? ''}`,
    );
  }
  if (profile.kidney_severity) {
    summary.push(
      `신기능 ${SEVERITY_OPTIONS.find((o) => o.value === profile.kidney_severity)?.label ?? ''}`,
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            💡 내 상황 알려주면 약사가 추천을 다르게 합니다
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            정형외과 약·주사 맞아도 안 풀리는 무릎 통증.
            당신의 동반질환·복용 약을 고려해 맞춤 추천해 드려요. (입력은 이 브라우저에만 저장됩니다)
          </p>
        </div>
        {submitted && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:border-slate-300"
          >
            {open ? '접기' : '수정'}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs text-slate-500">
              키 (cm)
              <input
                type="number"
                inputMode="decimal"
                value={profile.height_cm ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, height_cm: e.target.value ? Number(e.target.value) : undefined })
                }
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                placeholder="예: 165"
              />
            </label>
            <label className="text-xs text-slate-500">
              몸무게 (kg)
              <input
                type="number"
                inputMode="decimal"
                value={profile.weight_kg ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, weight_kg: e.target.value ? Number(e.target.value) : undefined })
                }
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                placeholder="예: 65"
              />
            </label>
            <label className="text-xs text-slate-500">
              나이
              <input
                type="number"
                inputMode="numeric"
                value={profile.age ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : undefined })
                }
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                placeholder="예: 55"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs text-slate-500">동반질환·복용 상황 (해당되는 항목 모두)</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COMORBIDITIES.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:border-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={!!profile[c.key]}
                    onChange={(e) => setProfile({ ...profile, [c.key]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-emerald-500"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 간/신기능 — 정도 선택 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SeveritySelect
              label="간기능 장애"
              value={profile.liver_severity ?? null}
              onChange={(v) => setProfile({ ...profile, liver_severity: v })}
            />
            <SeveritySelect
              label="신기능 장애"
              value={profile.kidney_severity ?? null}
              onChange={(v) => setProfile({ ...profile, kidney_severity: v })}
            />
          </div>

          <label className="block text-xs text-slate-500">
            현재 처방받는 약 (자유 입력, 선택)
            <input
              type="text"
              value={profile.current_meds ?? ''}
              onChange={(e) => setProfile({ ...profile, current_meds: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
              placeholder="예: 이부프로펜 600mg 1일 2회, 트리돌 50mg 등"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              맞춤 추천 받기
            </button>
            {submitted && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-slate-300"
              >
                초기화
              </button>
            )}
          </div>
        </form>
      )}

      {submitted && !open && summary.length > 0 && (
        <div className="mb-3 text-xs text-slate-500">
          <span className="text-slate-500">당신의 상황:</span>{' '}
          {summary.map((s, i) => (
            <span key={i} className="ml-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-slate-800">
              {s}
            </span>
          ))}
        </div>
      )}

      {submitted && matched.length === 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          입력하신 정보로는 특별한 주의사항이 매칭되지 않았습니다. 아래의 효과 큰 옵션을 일반 추천 순서로 보시면 됩니다.
        </div>
      )}

      {submitted && matched.length > 0 && (
        <div className="mt-4 space-y-3">
          {matched.map((r) => {
            const s = RANK_STYLES[r.rank];
            return (
              <div
                key={r.id}
                className={`rounded-lg border ${s.border} ${s.bg} p-4`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base">{r.icon ?? ''}</span>
                  <h3 className={`text-sm font-semibold ${s.text}`}>{r.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-800">{r.message}</p>
              </div>
            );
          })}
          <p className="text-[11px] text-slate-500">
            ※ 본 추천은 일반적인 약사 권고이며 개별 진료를 대체하지 않습니다. 처방·복용 변경 전 의사·약사와 상담하세요.
          </p>
        </div>
      )}
    </section>
  );
}
