import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getAllConditions, isBetaCondition } from '@/lib/queries';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let conditions: Awaited<ReturnType<typeof getAllConditions>> = [];
  try {
    conditions = await getAllConditions();
  } catch {
    conditions = [];
  }

  // 콘텐츠가 채워진 베타 적응증만 색인 대상으로 (준비 중 thin page 제외)
  const conditionUrls: MetadataRoute.Sitemap = conditions
    .filter((c) => isBetaCondition(c.slug))
    .map((c) => ({
    url: `${SITE_URL}/conditions/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/magnesium`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...conditionUrls,
  ];
}
