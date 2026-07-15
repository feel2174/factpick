import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubstanceDetail } from "@/lib/queries";
import { getCatalogSubstance } from "@/lib/contentCatalog";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import { coupangSearchUrl } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

interface SubstancePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SubstancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getSubstanceDetail(slug).catch(() => null);
  const local = getCatalogSubstance(slug);
  const name = detail?.substance.name_ko ?? local?.nameKo;
  if (!name) return {};
  const hasEvidence = Boolean(detail?.conditions?.length);
  return {
    title: `${name} 효과·근거·관련 질환`,
    description: `${name}의 질환별 효과, 근거 수준, 제형과 안전 정보를 약사 검수 데이터로 확인하세요.`,
    alternates: { canonical: `/substances/${slug}` },
    robots: hasEvidence ? undefined : { index: false, follow: true },
  };
}

export default async function SubstancePage({
  params,
}: SubstancePageProps) {
  const { slug } = await params;
  const detail = await getSubstanceDetail(slug).catch(() => null);
  const local = getCatalogSubstance(slug);
  if (!detail && !local) notFound();
  const name = detail?.substance.name_ko ?? local!.nameKo;
  const nameEn = detail?.substance.name_en ?? local?.nameEn;
  const description = detail?.substance.description_ko ?? local?.description;
  const conditions = detail?.conditions ?? [];
  const isSupplement = detail?.substance.substance_type !== "drug" && local?.type !== "의약품";
  const coupangKeyword = nameEn ?? name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${name} 효과와 근거`,
    description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: "https://factpick.co.kr",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "성분 데이터베이스",
          item: "https://factpick.co.kr/substances",
        },
        { "@type": "ListItem", position: 3, name },
      ],
    },
  };

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav
        className="flex items-center gap-2 text-xs text-slate-500"
        aria-label="현재 위치"
      >
        <Link className="interactive-link" href="/">
          홈
        </Link>
        <span>/</span>
        <Link className="interactive-link" href="/substances">
          성분
        </Link>
        <span>/</span>
        <span>{name}</span>
      </nav>
      {isSupplement && <AffiliateDisclosure className="mt-5" />}
      <header className="mt-7 border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {detail?.substance.substance_type === "drug" ||
            local?.type === "의약품"
              ? "의약품"
              : "영양제"}
          </span>
          <span className="text-xs text-slate-400">약사 검수 데이터</span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {name}
        </h1>
        {nameEn && (
          <p className="mt-2 text-sm font-medium text-slate-400">{nameEn}</p>
        )}
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
          {description}
        </p>
      </header>
      {isSupplement && (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-white p-5 sm:p-6" aria-labelledby="coupang-link-heading">
          <p className="text-sm font-bold text-amber-700">관련 상품 확인</p>
          <h2 id="coupang-link-heading" className="mt-2 text-xl font-bold text-slate-950">{name} 상품을 비교해 보세요</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">쿠팡 상품 검색 API에서 현재 판매 중인 관련 상품을 최대 10개까지 확인합니다.</p>
          <Link href={coupangSearchUrl(coupangKeyword, name)} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-5 text-base font-bold text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-500">
            쿠팡 관련 상품 보기 <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
        <p className="eyebrow">먼저 확인하세요</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950">
          이 성분은 어디에 근거가 있나요?
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          같은 성분도 질환, 원료, 용량과 제형에 따라 연구 결과가 달라집니다.
          아래 질환별 결과에서 효과 크기와 근거 수준을 함께 확인하세요.
        </p>
      </section>
      <section className="mt-12" aria-labelledby="condition-evidence">
        <h2
          id="condition-evidence"
          className="text-2xl font-bold text-slate-950"
        >
          질환별 효과와 근거
        </h2>
        {conditions.length > 0 ? (
          <div className="mt-5 space-y-3">
            {conditions.map((condition) => (
              <Link
                key={condition.condition_slug}
                href={`/conditions/${condition.condition_slug}`}
                className="link-card surface-card group flex items-center justify-between gap-5 p-5"
              >
                <div>
                  <h3 className="font-bold text-slate-950 group-hover:text-emerald-800">
                    {condition.condition_name_ko}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {condition.ai_summary_ko ??
                      `연구 ${condition.study_count_total}건을 바탕으로 평가했습니다.`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white">
                    {condition.grade ?? "I"}
                  </span>
                  <span className="link-arrow text-xl text-slate-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <aside className="mt-12 border-t border-slate-200 pt-8">
        <p className="text-sm leading-7 text-slate-500">
          처방약을 임의로 변경하거나 중단하지 마세요. 영양제도 질환과 복용약에
          따라 주의가 필요합니다.
        </p>
        <Link
          href="/safety"
          className="interactive-link mt-3 inline-flex text-sm font-bold text-slate-700"
        >
          복용 안전 안내 →
        </Link>
      </aside>
    </main>
  );
}
