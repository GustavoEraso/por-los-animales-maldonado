import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.porlosanimalesmaldonado.org';

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
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
