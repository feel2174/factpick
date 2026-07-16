import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CONDITION_CATALOG } from '@/lib/contentCatalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-07-16');
  const staticRoutes = [
    '',
    '/conditions',
    '/substances',
    '/about',
    '/editorial-policy',
    '/methodology',
    '/safety',
    '/terms',
    '/privacy',
    '/updates',
  ];

  return [
    ...staticRoutes.map((path, index) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: index === 0 ? 'daily' as const : 'monthly' as const,
      priority: index === 0 ? 1 : 0.7,
    })),
    ...CONDITION_CATALOG.map((condition) => ({
      url: `${SITE_URL}/conditions/${condition.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
