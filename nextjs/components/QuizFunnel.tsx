'use client';

import { useEffect, useMemo, useState } from 'react';
import { AGE_GROUPS, SEVERITY_OPTIONS, type StepId } from '@/lib/quizSteps';
import {
  COMORBIDITY_MASTER,
  type ComorbidityKey,
  type PreviousTreatmentOption,
  type QuizConfig,
  getQuizConfig,
} from '@/lib/conditionQuiz';
import type {
  PersonalizationRule,
  ProductsBySubstance,
  Severity,
  UserProfile,
  VerifiedEffect,
} from '@/lib/types';
import {
  aggregateHighlights,
  clearProfile,
  computeBMI,
  matchRules,
  saveProfile,
} from '@/lib/personalization';
import RecommendationResult from './RecommendationResult';

interface Props {
  conditionSlug: string;
  rules: PersonalizationRule[];
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
  onHighlightChange: (h: {
    highlightVerifiedIds: Set<string>;
    avoidVerifiedIds: Set<string>;
  }) => void;
}

export default function QuizFunnel({
  conditionSlug,
  rules,
  verified,
  products,
  onHighlightChange,
}: Props) {
  const cfg = useMemo(() => getQuizConfig(conditionSlug), [conditionSlug]);

  // 적응증별 동적 단계 순서 (해당 없는 단계는 생략)
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ['intro'];
    if (cfg.showBody) s.push('body');
    s.push('age');
    if (cfg.comorbidityKeys.length > 0) s.push('comorbidity');
    if (cfg.prevTreatments.length > 0) s.push('previous');
    s.push('liver', 'kidney', 'meds', 'result');
    return s;
  }, [cfg]);

  const [step, setStep] = useState<StepId>('intro');
  const [profile, setProfile] = useState<UserProfile>({});

  // 영선 결정: 페이지 진입 시 항상 intro부터. LocalStorage 자동 복원 X.

  useEffect(() => {
    if (step !== 'result') {
      onHighlightChange({ highlightVerifiedIds: new Set(), avoidVerifiedIds: new Set() });
      return;
    }
    const matched = matchRules(rules, profile);
    onHighlightChange(aggregateHighlights(matched));
  }, [step, profile, rules, onHighlightChange]);

  const idx = steps.indexOf(step);
  const goNext = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const goPrev = () => setStep(steps[Math.max(idx - 1, 0)]);

  const reset = () => {
    clearProfile();
    setProfile({});
    setStep('intro');
  };

  const finish = () => {
    saveProfile(profile);
    setStep('result');
  };

  // 진행률: intro=0, result=100
  const pct =
    idx <= 0 ? 0 : idx >= steps.length - 1 ? 100 : Math.round((idx / (steps.length - 1)) * 100);
  const isInput = step !== 'intro' && step !== 'result';
  const inputCount = steps.length - 2; // intro/result 제외

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-white shadow-xl">
      {step !== 'intro' && step !== 'result' && (
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="p-5 sm:p-8">
        {step === 'intro' && <IntroStep cfg={cfg} onStart={goNext} />}
        {step === 'body' && (
          <BodyStep cfg={cfg} profile={profile} setProfile={setProfile} onNext={goNext} onPrev={goPrev} />
        )}
        {step === 'age' && (
          <AgeStep profile={profile} setProfile={setProfile} autoAdvance={goNext} onPrev={goPrev} />
        )}
        {step === 'comorbidity' && (
          <ComorbidityStep
            keys={cfg.comorbidityKeys}
            profile={profile}
            setProfile={setProfile}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 'previous' && (
          <PreviousTreatmentStep
            cfg={cfg}
            profile={profile}
            setProfile={setProfile}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 'liver' && (
          <SeverityStep
            title="간기능 상태"
            subtitle="진단받았거나 의사가 알려준 정도가 있다면 선택"
            value={profile.liver_severity ?? null}
            onSelect={(v) => setProfile({ ...profile, liver_severity: v })}
            autoAdvance={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 'kidney' && (
          <SeverityStep
            title="신기능 상태"
            subtitle="콩팥(신장) 기능 — 모르면 '없음' 선택해도 OK"
            value={profile.kidney_severity ?? null}
            onSelect={(v) => setProfile({ ...profile, kidney_severity: v })}
            autoAdvance={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 'meds' && (
          <MedsStep profile={profile} setProfile={setProfile} onFinish={finish} onPrev={goPrev} />
        )}
        {step === 'result' && (
          <RecommendationResult
            profile={profile}
            rules={rules}
            verified={verified}
            products={products}
            prevTreatments={cfg.prevTreatments}
            outcomeWord={cfg.outcomeWord}
            onReset={reset}
            onEdit={() => setStep('intro')}
          />
        )}
      </div>

      {isInput && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-[11px] text-slate-500 sm:px-8">
          {idx}단계 / {inputCount}단계 · 입력값은 이 브라우저에만 저장됩니다
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Step 컴포넌트들
// ============================================================================

function IntroStep({ cfg, onStart }: { cfg: QuizConfig; onStart: () => void }) {
  return (
    <div className="py-6 text-center sm:py-10">
      <div className="mb-3 text-3xl sm:text-4xl">📊</div>
      <h2 className="mb-3 text-xl font-bold text-slate-900 sm:text-3xl">{cfg.intro.headline}</h2>
      <p className="mx-auto mb-3 max-w-lg text-sm leading-relaxed text-slate-700 sm:text-base">
        {cfg.intro.body}
      </p>
      {cfg.intro.sub && (
        <p className="mx-auto mb-5 max-w-lg text-xs italic leading-relaxed text-slate-500 sm:text-sm">
          {cfg.intro.sub}
        </p>
      )}
      <button
        type="button"
        onClick={onStart}
        className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 sm:px-8 sm:py-4 sm:text-lg"
      >
        내게 맞는 옵션 찾기 →
      </button>
      <p className="mt-3 text-[11px] text-slate-500">
        Cochrane 메타분석 SMD 검증 · 약사 큐레이션 · 회원가입 없음
      </p>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
    </div>
  );
}

function NavButtons({
  onPrev,
  onNext,
  nextLabel = '다음 →',
  nextDisabled,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-slate-300"
        >
          ← 이전
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 sm:px-6 sm:py-3 sm:text-base"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function BodyStep({
  cfg,
  profile,
  setProfile,
  onNext,
  onPrev,
}: {
  cfg: QuizConfig;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const h = profile.height_cm ?? 165;
  const w = profile.weight_kg ?? 65;
  const bmi = computeBMI(profile);

  return (
    <div>
      <StepHeader title={cfg.bodyTitle ?? '키와 몸무게 알려주세요'} subtitle={cfg.bodyHint} />

      <div className="space-y-5 sm:space-y-6">
        <NumberDial
          label="키"
          value={h}
          min={140}
          max={200}
          step={1}
          unit="cm"
          onChange={(v) => setProfile({ ...profile, height_cm: v })}
        />
        <NumberDial
          label="몸무게"
          value={w}
          min={35}
          max={150}
          step={1}
          unit="kg"
          onChange={(v) => setProfile({ ...profile, weight_kg: v })}
        />
        {bmi !== null && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <div className="text-xs text-slate-500">BMI</div>
            <div className="mt-0.5 text-2xl font-semibold text-slate-900 tabular-nums">
              {bmi.toFixed(1)}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {bmi < 18.5
                ? '저체중'
                : bmi < 23
                  ? '정상'
                  : bmi < 25
                    ? '과체중 (전단계)'
                    : bmi < 27
                      ? '과체중'
                      : '비만 — 체중 감량이 효과 큼'}
            </div>
          </div>
        )}
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function NumberDial({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-2xl font-semibold tabular-nums text-slate-900">
          {value}
          <span className="ml-1 text-sm text-slate-500">{unit}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 text-lg text-slate-800 hover:bg-slate-100"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-100 accent-emerald-500"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 text-lg text-slate-800 hover:bg-slate-100"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AgeStep({
  profile,
  setProfile,
  autoAdvance,
  onPrev,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  autoAdvance: () => void;
  onPrev: () => void;
}) {
  const age = profile.age;
  const handlePick = (pick: number) => {
    setProfile({ ...profile, age: pick });
    setTimeout(autoAdvance, 250);
  };
  return (
    <div>
      <StepHeader title="나이대를 선택해주세요" subtitle="65세 이상부터는 약 부작용 위험이 다릅니다" />
      <div className="grid grid-cols-2 gap-3">
        {AGE_GROUPS.map((g) => {
          const selected = age !== undefined && age >= g.min && age <= g.max;
          return (
            <button
              key={g.label}
              type="button"
              onClick={() => handlePick(g.pick)}
              className={`rounded-xl border p-4 text-center text-sm transition sm:p-5 sm:text-base ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-start">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-slate-300"
        >
          ← 이전
        </button>
      </div>
    </div>
  );
}

function ComorbidityStep({
  keys,
  profile,
  setProfile,
  onNext,
  onPrev,
}: {
  keys: ComorbidityKey[];
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const none = !keys.some((k) => profile[k]);
  return (
    <div>
      <StepHeader
        title="동반 질환·복용 상황을 알려주세요"
        subtitle="해당되는 것 모두 선택. 없으면 '해당 없음'"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {keys.map((k) => {
          const meta = COMORBIDITY_MASTER[k];
          const active = !!profile[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => setProfile({ ...profile, [k]: !active })}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition sm:p-4 ${
                active
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{meta.emoji}</span>
              <span className="flex-1">{meta.label}</span>
              {active && <span className="text-emerald-600">✓</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          const next = { ...profile };
          for (const k of keys) (next as Record<string, unknown>)[k] = false;
          setProfile(next);
        }}
        className={`mt-3 w-full rounded-xl border p-3 text-sm transition ${
          none
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
      >
        해당 없음 (건강한 편)
      </button>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function SeverityStep({
  title,
  subtitle,
  value,
  onSelect,
  autoAdvance,
  onPrev,
}: {
  title: string;
  subtitle: string;
  value: Severity | null;
  onSelect: (v: Severity | null) => void;
  autoAdvance: () => void;
  onPrev: () => void;
}) {
  const handlePick = (v: Severity | null) => {
    onSelect(v);
    setTimeout(autoAdvance, 250);
  };
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SEVERITY_OPTIONS.map((o) => {
          const selected = (value ?? 'none') === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => handlePick(o.value === 'none' ? null : (o.value as Severity))}
              className={`rounded-xl border p-3 text-center text-sm transition sm:p-4 ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold">{o.label}</div>
              <div className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">{o.hint}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-start">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-slate-300"
        >
          ← 이전
        </button>
      </div>
    </div>
  );
}

function MedsStep({
  profile,
  setProfile,
  onFinish,
  onPrev,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onFinish: () => void;
  onPrev: () => void;
}) {
  return (
    <div>
      <StepHeader
        title="현재 복용 중인 약 (선택)"
        subtitle="없으면 비워두셔도 됩니다. 처방받은 약 이름을 적으면 약사가 참고해요"
      />
      <textarea
        rows={4}
        value={profile.current_meds ?? ''}
        onChange={(e) => setProfile({ ...profile, current_meds: e.target.value })}
        placeholder="예: 이부프로펜 600mg 1일 2회, 트리돌 50mg, 와파린 5mg…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      <NavButtons onPrev={onPrev} onNext={onFinish} nextLabel="추천 받기 ✨" />
    </div>
  );
}

function PreviousTreatmentStep({
  cfg,
  profile,
  setProfile,
  onNext,
  onPrev,
}: {
  cfg: QuizConfig;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const selected = new Set(profile.previous_treatments ?? []);
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setProfile({ ...profile, previous_treatments: Array.from(next) });
  };
  const noneActive = selected.size === 0;
  return (
    <div>
      <StepHeader title={cfg.prevTitle ?? ''} subtitle={cfg.prevSubtitle} />
      <div className="grid grid-cols-1 gap-2">
        {cfg.prevTreatments.map((p: PreviousTreatmentOption) => {
          const active = selected.has(p.key);
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => toggle(p.key)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition sm:p-4 ${
                active
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.label}</div>
              </div>
              {active && <span className="text-emerald-600">✓</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setProfile({ ...profile, previous_treatments: [] })}
        className={`mt-3 w-full rounded-xl border p-3 text-sm transition ${
          noneActive
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
      >
        아직 별다른 치료를 안 해봤어요
      </button>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
