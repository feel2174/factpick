'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import ConditionCard from './ConditionCard';

interface SearchResult {
  id: string;
  slug: string;
  nameKo: string;
  description: string;
  category: string;
  cellCount: number;
}

export default function HomeConditionSearch() {
  const [input, setInput] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestController = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = input.trim();

    if (!query) {
      setError('증상이나 질환명을 입력해 주세요.');
      setSearchedQuery('');
      setResults([]);
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/conditions/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Search request failed');

      const data = await response.json() as { query: string; results: SearchResult[] };
      setSearchedQuery(data.query);
      setResults(data.results);
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === 'AbortError') return;
      setError('검색을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setSearchedQuery('');
      setResults([]);
    } finally {
      if (requestController.current === controller) setIsLoading(false);
    }
  }

  return (
    <section id="home-search" className="scroll-mt-20 border-b border-slate-200 bg-white" aria-labelledby="home-search-heading">
      <div className="content-shell py-10 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5">
            <p className="eyebrow">빠르게 찾아보기</p>
            <h2 id="home-search-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              지금 궁금한 건강 고민을 입력해 보세요
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-700">
              공개된 데이터 안에서 관련 질환과 비교 항목을 바로 찾아드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} role="search" className="surface-card p-4 sm:p-5">
            <label htmlFor="home-condition-search" className="block text-base font-bold text-slate-950">
              어떤 증상이 불편하신가요?
            </label>
            <p id="home-condition-search-help" className="mt-1 text-sm leading-6 text-slate-600">
              예: 잠이 안 와요, 무릎이 아파요, 혈압, 기억력
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                id="home-condition-search"
                name="q"
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="증상 또는 질환명 입력"
                aria-describedby="home-condition-search-help"
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="button-primary min-h-12 shrink-0 px-5 text-sm disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading ? '검색 중' : '검색하기'}
              </button>
            </div>
          </form>

          <div className="mt-6" aria-live="polite" aria-busy={isLoading}>
            {error && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-white px-4 py-3 text-base font-semibold text-rose-700">
                {error}
              </p>
            )}

            {!isLoading && searchedQuery && (
              <section aria-labelledby="home-search-results-heading">
                <div className="flex items-end justify-between gap-4 border-b border-emerald-200 pb-4">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">검색 결과</p>
                    <h3 id="home-search-results-heading" className="mt-1 text-2xl font-black text-slate-950">
                      ‘{searchedQuery}’ 관련 {results.length}개 항목
                    </h3>
                  </div>
                  <Link href="/conditions" className="interactive-link hidden shrink-0 text-sm font-bold text-slate-600 sm:block">
                    전체 질환 보기
                  </Link>
                </div>

                {results.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {results.map((condition) => (
                      <ConditionCard
                        key={condition.id}
                        slug={condition.slug}
                        nameKo={condition.nameKo}
                        description={condition.description}
                        category={condition.category}
                        cellCount={condition.cellCount}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="surface-card mt-5 p-6">
                    <h4 className="text-lg font-bold text-slate-950">검색어를 조금 다르게 입력해 보세요</h4>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                      증상은 짧은 단어로 입력하면 더 잘 찾을 수 있습니다. 예를 들어 “무릎”, “수면”, “혈압”처럼 검색해 보세요.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
