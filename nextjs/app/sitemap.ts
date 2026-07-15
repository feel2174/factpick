import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CONDITION_CATALOG } from '@/lib/contentCatalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-07-14');
  const staticRoutes = [
    '',
    '/conditions',
    '/substances',
    '/magnesium',
    '/about',
    '/editorial-policy',
    '/methodology',
    '/safety',
    '/terms',
    '/updates',
  ];
  return [
    ...staticRoutes.map((path, index) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: index === 0 ? 'daily' as const : 'monthly' as const, priority: index === 0 ? 1 : 0.7 })),
    ...CONDITION_CATALOG.map((condition) => ({ url: `${SITE_URL}/conditions/${condition.slug}`, lastModified, changeFrequency: 'weekly' as const, priority: 0.8 })),
    // 성분 상세는 실제 질환별 근거가 연결된 뒤 sitemap에 포함한다.
  ];
}
