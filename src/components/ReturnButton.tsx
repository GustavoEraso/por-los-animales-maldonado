'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/Icons';

/**
 * Button that navigates to the previous browser history entry.
 *
 * @example
 * ```tsx
 * <ReturnButton />
 * ```
 */
export default function ReturnButton(): React.ReactElement {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 py-2 text-sm text-green-forest transition-colors hover:bg-green-forest/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-forest focus-visible:ring-offset-2"
    >
      <ArrowLeftIcon size={16} title="Volver" />
      Volver
    </button>
  );
}
