import { NextRequest, NextResponse } from 'next/server';
import { getConditionCategoryLabel } from '@/lib/conditionCategories';
import { getCatalogCondition } from '@/lib/contentCatalog';
import { getConditionSubstanceCounts, searchConditions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 60) ?? '';

  if (!query) {
    return NextResponse.json({ query, results: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const [conditions, counts] = await Promise.all([
      searchConditions(query),
      getConditionSubstanceCounts(),
    ]);

    const results = conditions.map((condition) => ({
      id: condition.id,
      slug: condition.slug,
      nameKo: condition.name_ko,
      description: condition.description_ko ?? getCatalogCondition(condition.slug)?.description ?? '',
      category: getConditionCategoryLabel(condition),
      cellCount: counts[condition.slug] ?? 0,
    }));

    return NextResponse.json(
      { query, results },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Condition search failed', error);
    return NextResponse.json(
      { message: '검색 결과를 불러오지 못했습니다.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
