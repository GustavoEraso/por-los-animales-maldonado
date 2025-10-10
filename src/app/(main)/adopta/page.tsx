import Hero from '@/components/Hero';
import CardContainer from '@/containers/CardContainer';
import { fetchAnimals } from '@/lib/fetchAnimal';
import SearchBox from '@/components/SearchBox';
import Pagination from '@/components/Pagination';
import { buildFiltersFromSearchParams } from '@/lib/searchParamsUtils';
import { Animal } from '@/types';

interface AdoptaProps {
  searchParams: Promise<{
    nombre?: string;
    especies?: string;
    tamanos?: string;
    generos?: string;
    etapasVida?: string;
    ordenarPor?: string;
    orden?: string;
    pagina?: string;
    limite?: string;
  }>;
}

export default async function Adopta({ searchParams }: AdoptaProps) {
  const params = await searchParams;
  const filters = buildFiltersFromSearchParams(params);
  const result = await fetchAnimals(filters);

  // Handle both paginated and non-paginated responses
  const animals: Animal[] = Array.isArray(result) ? result : result.data;
  const pagination = Array.isArray(result) ? null : result.pagination;

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
      <Hero title="Animales en adopción" />
      <section className="flex flex-col gap-4 px-9 py-4 w-full max-w-7xl justify-center items-center">
        <SearchBox />
        <div className="w-full">
          <p className="text-sm text-gray-600 mb-4">
            {pagination
              ? `Mostrando ${animals.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}-${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} animales`
              : `${animals.length} ${animals.length === 1 ? 'animal encontrado' : 'animales encontrados'}`}
          </p>
          <CardContainer animalsList={animals} />

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
            />
          )}
        </div>
      </section>
    </div>
  );
}
