import Loader from '@/components/Loader';

/**
 * Skeleton component for the Adopta page.
 *
 * Displays loading skeletons that maintain the same structure as the original page,
 * providing visual feedback while the actual content is being fetched.
 *
 * @returns {React.ReactElement} The loading skeleton
 */
export default function AdoptaSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
      <Loader />
      {/* Hero Skeleton */}
      <section className="flex justify-center w-full h-[60svh] overflow-hidden relative bg-gray-400">
        <div className="absolute w-full h-full bg-gray-200 animate-pulse" />
        {/* <section className="w-full h-3/4 z-10 flex flex-col justify-end items-center absolute bottom-0 pb-8 left-1/2 -translate-x-1/2 bg-gradient-to-t from-white to-zinc-900/0 p-4">
          <section className="flex flex-col gap-4 w-full h-2/3 justify-end max-w-4xl xl:pr-60">
            <div className="h-16 lg:h-24 w-full bg-red-600 animate-pulse rounded-lg" />
          </section>
        </section> */}
      </section>

      <section className="flex flex-col gap-4 px-9 py-4 w-full max-w-7xl justify-center items-center">
        {/* SearchBox Skeleton */}
        <div className="w-full mb-7">
          <div className="w-full h-14 bg-gray-200 animate-pulse rounded-lg" />
        </div>

        <div className="w-full">
          {/* Results count skeleton */}
          <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-4" />

          {/* CardContainer Skeleton - Grid of card skeletons */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 sm:p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={`card-skeleton-${index}`} />
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Skeleton component for individual animal cards.
 * Matches the structure and dimensions of the Card component.
 *
 * @returns {React.ReactElement} The card skeleton element
 */
function CardSkeleton(): React.ReactElement {
  return (
    <article className="grid grid-rows-[1.8fr_auto] rounded-xl overflow-hidden shadow bg-cream-light">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      {/* Content skeleton */}
      <div className="flex flex-col items-center gap-1 p-2">
        <div className="h-8 w-3/4 bg-gray-300 animate-pulse rounded" />
        <div className="h-5 w-1/2 bg-gray-200 animate-pulse rounded" />
      </div>
    </article>
  );
}
