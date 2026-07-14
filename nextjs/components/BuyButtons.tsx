import type { ExternalLink } from '@/lib/affiliate';

interface Props {
  links: ExternalLink[];
  size?: 'sm' | 'md';
}

const STYLE: Record<string, string> = {
  coupang: 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-300',
  iherb: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
  healthkr: 'bg-slate-100 hover:bg-slate-100 text-slate-800 border-slate-200',
  nedrug: 'bg-slate-100 hover:bg-slate-100 text-slate-800 border-slate-200',
  pharmacy_rx: 'bg-rose-50 text-rose-700 border-rose-300',
  pharmacy_otc: 'bg-indigo-50 text-indigo-700 border-indigo-300',
  procedure: 'bg-violet-50 text-violet-700 border-violet-300',
  unavailable_kr: 'bg-slate-100 text-slate-500 border-slate-200',
};

const ICON: Record<string, string> = {
  coupang: '🛒',
  iherb: '🌍',
  healthkr: 'ℹ️',
  nedrug: 'ℹ️',
  pharmacy_rx: '🏥',
  pharmacy_otc: '💊',
  procedure: '🩺',
  unavailable_kr: '🚫',
};

export default function BuyButtons({ links, size = 'sm' }: Props) {
  if (!links.length) return null;
  const sizeClass = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5';
  return (
    <div className="mt-1.5 inline-flex flex-wrap items-center gap-1.5">
      {links.map((l, i) => {
        const cls = STYLE[l.type] ?? STYLE.healthkr;
        const icon = ICON[l.type] ?? ICON.healthkr;
        const inner = (
          <>
            <span>{icon}</span>
            <span>{l.label}</span>
          </>
        );
        if (l.url) {
          return (
            <a
              key={`${l.type}-${i}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`inline-flex items-center gap-1 rounded-md border font-medium transition ${sizeClass} ${cls}`}
              title={l.note ?? l.url}
            >
              {inner}
            </a>
          );
        }
        return (
          <span
            key={`${l.type}-${i}`}
            className={`inline-flex items-center gap-1 rounded-md border font-medium ${sizeClass} ${cls}`}
            title={l.note}
          >
            {inner}
          </span>
        );
      })}
    </div>
  );
}
