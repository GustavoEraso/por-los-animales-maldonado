'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/components/Loader';
import { Animal, AnimalTransactionType } from '@/types';
import FloatButton from '@/elements/FloatButton';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { auth } from '@/firebase';
import ConfirmDialog from '@/components/ConfirmDialog';
import { handlePromiseToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminAnimalCard from '@/components/AdminAnimalCard';
import { EditIcon, EyeIcon, GridViewIcon, TableViewIcon, TrashIcon } from '@/components/Icons';

export default function AnimalsPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const MIN_LOADING_TIME = 600;

  // Initialize view mode from localStorage
  const [infoModeRender, setInfoModeRender] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('animalViewMode');
      return saved === 'table' || saved === 'grid' ? saved : 'grid';
    }
    return 'grid';
  });

  // Save to localStorage when view mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('animalViewMode', infoModeRender);
    }
  }, [infoModeRender]);

  const [animalsToShow, setAnimalsToShow] = useState<Animal[]>([]);
  const [sortReference, setSortReference] = useState<string | boolean>('name');
  const [sortOrder, setSortOrder] = useState('>');
  const [sortedAnimals, setSortedAnimals] = useState<Animal[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);

  useEffect(() => {
    const start = Date.now();

    const fetchData = async () => {
      await getFirestoreData({
        currentCollection: 'animals',
        filter: [['status', '==', 'adoptado']],
      })
        .then((data) => {
          setAnimalsToShow(data as Animal[]);
        })
        .catch((error) => {
          console.error('Error fetching Animals:', error);
        });
    };
    fetchData().finally(() => {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    });
  }, [refresh]);

  useEffect(() => {
    if (!animalsToShow) {
      return;
    }

    const ref = sortReference as keyof Animal;
    const order = sortOrder;
    let response;

    if (animalsToShow.length < 1) {
      return;
    }

    if (typeof animalsToShow[0][ref] === 'boolean') {
      response = animalsToShow.slice().sort((a, b) => {
        if (order == '<') {
          return a[ref] === b[ref] ? 0 : a[ref] ? 1 : -1;
        } else {
          return a[ref] === b[ref] ? 0 : a[ref] ? -1 : 1;
        }
      });
    } else if (typeof animalsToShow[0][ref] === 'number') {
      response = animalsToShow.slice().sort((a, b) => {
        if (order == '<') {
          return Number(a[ref]) - Number(b[ref]);
        } else {
          return Number(b[ref]) - Number(a[ref]);
        }
      });
    } else if (typeof animalsToShow[0][ref] === 'string') {
      response = animalsToShow.slice().sort((a, b) => {
        const aVal = a[ref] as string;
        const bVal = b[ref] as string;

        return order === '<' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    } else {
      return;
    }
    setSortedAnimals(response);
  }, [animalsToShow, sortOrder, sortReference]);

  const sortAnimalBy = ({ reference }: { reference: string | boolean }) => {
    if (sortReference === reference) {
      setSortOrder(() => (sortOrder == '>' ? '<' : '>'));
      return;
    }
    setSortReference(reference);
  };
  const renderDirection = (ref: string) =>
    sortReference === ref ? (sortOrder === '>' ? '▼' : '▲') : '';

  const handleDelete = async (currentId: string) => {
    const animal = sortedAnimals.find((animal) => animal.id === currentId);
    if (!animal) return;

    setAnimalToDelete(animal);
  };

  const confirmDelete = async () => {
    if (!animalToDelete) return;

    const start = Date.now();
    setLoading(true);
    setAnimalToDelete(null);

    try {
      const updatedAnimal = {
        ...animalToDelete,
        isDeleted: true,
        isVisible: false,
        isAvalible: false,
      };

      const newTransaction: AnimalTransactionType = {
        id: animalToDelete.id,
        name: animalToDelete.name,
        since: Date.now(),
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isDeleted: true,
        isVisible: false,
        isAvalible: false,
      };

      const promises = Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: animalToDelete.id,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);

      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Enviando a la papelera...',
            text: `Enviando a la papelera al animal ${animalToDelete.name}...`,
          },
          success: {
            title: 'Animal enviado a la papelera',
            text: `El animal ${animalToDelete.name} fue enviado a la papelera exitosamente.`,
          },
          error: {
            title: 'Error al enviar a la papelera',
            text: `Hubo un error al enviar a la papelera al animal ${animalToDelete.name}.`,
          },
        },
      });

      setRefresh(!refresh);
    } catch (error) {
      console.error('Error changing animal status:', error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-2  items-center pb-28">
        {loading && <Loader />}
        <div className="w-full flex justify-between items-center px-4">
          <h3 className="text-2xl font-bold underline">Animales Adoptados</h3>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setInfoModeRender('table')}
              className={`p-2 rounded transition ${
                infoModeRender === 'table'
                  ? 'bg-green-forest text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title="Vista de tabla"
            >
              <TableViewIcon size={24} />
            </button>
            <button
              onClick={() => setInfoModeRender('grid')}
              className={`p-2 rounded transition ${
                infoModeRender === 'grid'
                  ? 'bg-green-forest text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title="Vista de cuadrícula"
            >
              <GridViewIcon size={24} />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {infoModeRender === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {sortedAnimals.length > 0 ? (
              sortedAnimals.map((animal) => (
                <AdminAnimalCard key={animal.id} animal={animal} onDelete={handleDelete} />
              ))
            ) : (
              <p className="col-span-full text-center">No hay animales que mostrar</p>
            )}
          </div>
        )}

        {/* Table View */}
        {infoModeRender === 'table' && (
          <div className="  w-full relative overflow-x-auto shadow-md rounded-lg ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="w-fit" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'id' })}
                    >{`ID ${renderDirection('id')}`}</button>
                  </th>
                  <th className="w-fit" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'name' })}
                    >{`NOMBRE ${renderDirection('name')}`}</button>
                  </th>
                  <th className="w-fit hidden sm:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'gender' })}
                    >{`GENERO ${renderDirection('gender')}`}</button>
                  </th>
                  <th className="w-fit hidden md:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'species' })}
                    >{`ESPECIE ${renderDirection('species')}`}</button>
                  </th>
                  <th className="w-fit hidden md:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'lifeStage' })}
                    >{`EDAD ${renderDirection('lifeStage')}`}</button>
                  </th>
                  <th className="w-fit hidden md:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'status' })}
                    >{`SITUACIÓN ${renderDirection('status')}`}</button>
                  </th>
                  <th scope="col" className=" py-3">
                    <span className="sr-only">Ver Detalles</span>
                  </th>
                  <th scope="col" className=" py-3">
                    <span className="sr-only">Editar</span>
                  </th>
                  <th scope="col hidden sm:table-cell" className=" py-3">
                    <span className="sr-only">Elimiar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {animalsToShow.length > 0 &&
                  sortedAnimals?.map((animal) => (
                    <tr key={animal.id} className="bg-white border-b hover:bg-gray-50">
                      <th
                        scope="row"
                        className="px-2 py-4 outline-1 outline-slate-200 font-medium text-gray-900 whitespace-nowrap text-center"
                      >
                        {animal.id}
                      </th>
                      <td className="px-2 py-4 outline-1 outline-slate-200">{animal.name}</td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden sm:table-cell">
                        {animal.gender}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden md:table-cell ">
                        {animal.species}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden md:table-cell">
                        {animal.lifeStage}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 text-nowrap hidden md:table-cell">
                        {animal.status}
                      </td>
                      <td className="px-2 py-4 text-right">
                        <Link
                          href={`/plam-admin/animales/${animal.id}`}
                          className="font-medium text-green-600 hover:underline flex items-center justify-end gap-1"
                        >
                          <EyeIcon size={16} title="Ver detalles" />
                          <span className="hidden lg:inline">Ver Detalles</span>
                        </Link>
                      </td>
                      <td className="px-2 py-4 text-right ">
                        <Link
                          href={`/plam-admin/animales/editar/${animal.id}`}
                          className="font-medium text-blue-600 hover:underline flex items-center justify-end gap-1"
                        >
                          <EditIcon size={16} title="Editar animal" />
                          <span className="hidden lg:inline">Editar</span>
                        </Link>
                      </td>
                      <td className="px-2 py-4 text-center ">
                        <button
                          onClick={() => handleDelete(animal.id)}
                          className="font-medium text-red-600 hover:underline cursor-pointer"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {animalsToShow.length < 1 && <p className="text-center">No hay animales que mostrar</p>}
          </div>
        )}

        <ConfirmDialog
          isOpen={animalToDelete !== null}
          title="Eliminar Animal"
          message={`¿Estás seguro de que quieres eliminar a ${animalToDelete?.name}?\n\nID: ${animalToDelete?.id}\n\nEsta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setAnimalToDelete(null)}
        />

        <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace('/plam-admin/animales/crear');
          }}
        />
      </section>
    </ProtectedRoute>
  );
}
