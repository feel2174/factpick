import type { Metadata } from 'next';
import Link from 'next/link';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import { normalizeCoupangLimit, searchCoupangProducts } from '@/lib/coupang';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '쿠팡 상품 검색 결과',
  description: '선택한 영양성분과 관련된 쿠팡 상품을 확인합니다.',
  robots: { index: false, follow: false },
};

interface CoupangPageProps {
  searchParams?: Promise<{
    keyword?: string | string[];
    label?: string | string[];
    limit?: string | string[];
  }>;
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default async function CoupangPage({ searchParams }: CoupangPageProps) {
  const resolvedSearchParams = await searchParams;
  const keyword = first(resolvedSearchParams?.keyword).slice(0, 60);
  const label = first(resolvedSearchParams?.label).slice(0, 60) || keyword;
  const limit = normalizeCoupangLimit(Number(first(resolvedSearchParams?.limit)) || undefined);
  const products = keyword
    ? await searchCoupangProducts(keyword, limit).catch(() => [])
    : [];

  return (
    <main id="main-content" className="content-shell py-8 sm:py-12">
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="interactive-link">홈</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-slate-700">쿠팡 상품</span>
      </nav>

      <AffiliateDisclosure className="mt-5" />

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">쿠팡 상품 검색</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {label ? `${label} 관련 상품` : '영양성분 관련 상품'}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          쿠팡 파트너스 상품 검색 결과입니다. 가격과 판매 상태는 쿠팡에서 최종 확인해 주세요.
        </p>
      </header>

      {products.length > 0 ? (
        <section className="mt-8" aria-labelledby="coupang-products-heading">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 id="coupang-products-heading" className="text-xl font-bold text-slate-950">상품 {products.length}개</h2>
            <span className="text-sm text-slate-500">최대 10개 표시</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <a
                key={`${product.productId}-${product.rank}`}
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="link-card surface-card group overflow-hidden"
              >
                <div className="aspect-square overflow-hidden bg-white">
                  {/* API에서 제공한 상품 이미지를 원본 비율로 표시합니다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.productImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="border-t border-slate-100 p-5">
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {product.isRocket && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">로켓배송</span>}
                    {product.isFreeShipping && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">무료배송</span>}
                  </div>
                  <h2 className="mt-3 line-clamp-2 min-h-14 text-base font-bold leading-7 text-slate-950 group-hover:text-emerald-800">
                    {product.productName}
                  </h2>
                  <p className="mt-3 text-xl font-black tabular-nums text-slate-950">{formatPrice(product.productPrice)}원</p>
                  <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-bold text-amber-950 transition group-hover:bg-amber-500">
                    쿠팡에서 상품 보기 <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section className="surface-card mt-8 max-w-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">표시할 수 있는 상품이 없습니다</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            현재 검색어로 확인되는 상품이 없습니다. 이전 화면에서 다른 성분을 선택해 주세요.
          </p>
        </section>
      )}
    </main>
  );
}
