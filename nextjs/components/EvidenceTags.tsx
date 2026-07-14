import type { VerifiedEffect } from '@/lib/types';
import { confidenceTag, evidenceNote, plainSummary } from '@/lib/evidence';

const TONE_CLASS = {
  good: 'bg-emerald-50 text-emerald-700',
  mid: 'bg-slate-100 text-slate-600',
  low: 'bg-amber-50 text-amber-700',
} as const;

export function ConfidenceChip({ v }: { v: VerifiedEffect }) {
  const t = confidenceTag(v);
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${TONE_CLASS[t.tone]}`}
    >
      {t.label}
    </span>
  );
}

export function EvidenceNote({ v }: { v: VerifiedEffect }) {
  const plain = plainSummary(v);
  const detail = evidenceNote(v);
  return (
    <div className="mt-1">
      <p className="text-[11px] font-medium leading-relaxed text-slate-600">{plain}</p>
      {detail && (
        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
          <span className="text-slate-400">자세히 ·</span> {detail}
        </p>
      )}
    </div>
  );
}
