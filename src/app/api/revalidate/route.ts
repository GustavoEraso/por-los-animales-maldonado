import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * GET /api/revalidate?tags=animals:list,animals:active
 *
 * Revalidates a cache tag. Useful for on-demand cache invalidation.
 *
 * @example
 * // Revalidate multiple animal caches
 * fetch('/api/revalidate?tags=animals:list,animals:active')
 *
 * // Revalidate a specific animal
 * fetch('/api/revalidate?tags=animal:abc123')
 *
 * // Revalidate everything
 * fetch('/api/revalidate?tags=revalidate_all')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.headers.get('x-internal-token');

  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const tagsParam = request.nextUrl.searchParams.get('tags');
  const legacyTag = request.nextUrl.searchParams.get('tag');
  const tags = (tagsParam ?? legacyTag ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length === 0) {
    return NextResponse.json({ error: 'Missing "tags" query parameter' }, { status: 400 });
  }

  try {
    // 'max' uses stale-while-revalidate semantics (recommended)
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      timestamp: new Date().toLocaleString(),
    });
  } catch (error) {
    logger({
      level: 'error',
      code: 'REVALIDATE_TAG',
      message: 'Error revalidating tag:',
      data: error,
    });
    return NextResponse.json({ error: 'Failed to revalidate tag' }, { status: 500 });
  }
}
