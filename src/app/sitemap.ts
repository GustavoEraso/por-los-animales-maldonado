import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Build-date anchor for the sitemap. Keep it static so the route stays prerendered. */
const LAST_MODIFIED = new Date('2026-09-08');

interface SitemapRoute {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}

const PUBLIC_ROUTES: SitemapRoute[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/adopta', changeFrequency: 'daily', priority: 0.9 },
  { path: '/donaciones', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/donaciones/paypalsuscripciones', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/involucrate', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/nosotros', changeFrequency: 'monthly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
