import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/revalidate?tag=animals
 *
 * Revalidates a cache tag. Useful for on-demand cache invalidation.
 *
 * @example
 * // Revalidate all animals
 * fetch('/api/revalidate?tag=animals')
 *
 * // Revalidate a specific animal
 * fetch('/api/revalidate?tag=animal-abc123')
 *
 * // Revalidate everything
 * fetch('/api/revalidate?tag=revalidate_all')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.headers.get('x-internal-token');

  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const tag = request.nextUrl.searchParams.get('tag');

  if (!tag) {
    return NextResponse.json({ error: 'Missing "tag" query parameter' }, { status: 400 });
  }

  try {
    // 'max' uses stale-while-revalidate semantics (recommended)
    // Use { expire: 0 } for immediate expiration
    revalidateTag(tag, 'max');

    return NextResponse.json({
      revalidated: true,
      tag,
      timestamp: new Date().toLocaleString(),
    });
  } catch (error) {
    console.error('Error revalidating tag:', error);
    return NextResponse.json({ error: 'Failed to revalidate tag' }, { status: 500 });
  }
}
