'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/components/Loader';
import { Animal, AnimalTransactionType } from '@/types';
import FloatButton from '@/elements/FloatButton';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { auth } from '@/firebase';
import { Modal } from '@/components/Modal';

export default function AnimalsPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const MIN_LOADING_TIME = 600;

  const [animalsToShow, setAnimalsToShow] = useState<Animal[]>([]);
  const [sortReference, setSortReference] = useState<string | boolean>('name');
  const [sortOrder, setSortOrder] = useState('>');
  const [sortedAnimals, setSortedAnimals] = useState<Animal[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    const start = Date.now();

    const fetchData = async () => {
      await getFirestoreData({
        currentCollection: 'animals',
        filter: [['status', 'not-in', ['adoptado']]],
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

  const handleVisible = async ({ currentId, active }: { currentId: string; active: boolean }) => {
    try {
      const animal = sortedAnimals.find((animal) => animal.id === currentId);
      if (!animal) throw new Error(`Animal with id ${currentId} not found`);

      const updatedAnimal = { ...animal, isVisible: active };

      const newTransaction = {
        visible: active,
        id: currentId,
        name: animal.name,
        since: Date.now(),
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isVisible: active,
      } as AnimalTransactionType;

      await Promise.all([
        postFirestoreData<Animal>({
          currentCollection: 'animals',
          data: updatedAnimal,
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          currentCollection: 'animalTransactions',
          data: newTransaction,
        }),
      ]);
      setRefresh(!refresh);
    } catch (error) {
      console.error('Error al cambiar el estado del animal:', error);
    }
  };

  const handleDelete = async (currentId: string) => {
    const start = Date.now();
    setLoading(true);
    try {
      const animal = sortedAnimals.find((animal) => animal.id === currentId);
      if (!animal) throw new Error(`Animal with id ${currentId} not found`);

      const updatedAnimal = { ...animal, isDeleted: true, isVisible: false, isAvalible: false };

      const newTransaction = {
        date: Date.now(),
        since: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isDeleted: true,
        isVisible: false,
        isAvalible: false,
      } as AnimalTransactionType;

      await Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);
    } catch (error) {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
      console.error('Error al cambiar el estado del animal:', error);
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
      setRefresh(!refresh);
    }
  };

  return (
    <section className=" flex flex-col gap-2  items-center pb-28">
      {loading && <Loader />}
      <h3 className="text-2xl font-bold underline">Animales Activos</h3>
      <div className="relative overflow-x-auto shadow-md rounded-lg ">
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
              <th className="w-fit" scope="col">
                <button
                  className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                  onClick={() => sortAnimalBy({ reference: 'status' })}
                >{`SITUACIÓN ${renderDirection('status')}`}</button>
              </th>
              <th className="w-fit hidden sm:table-cell" scope="col">
                <button
                  className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300"
                  onClick={() => sortAnimalBy({ reference: 'isAvalible' })}
                >{`VISIBLE ${renderDirection('isAvalible')}`}</button>
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
                  <td className="px-2 py-4 outline-1 outline-slate-200 text-nowrap">
                    {animal.status}
                  </td>
                  <td className="px-2 py-4 outline-1 outline-slate-200 hidden sm:table-cell ">
                    <label className="flex justify-center items-center cursor-pointer w-full">
                      <input
                        type="checkbox"
                        onChange={() =>
                          handleVisible({ currentId: animal.id, active: !animal.isVisible })
                        }
                        className="sr-only peer"
                        checked={animal.isVisible}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-blue-600" />
                    </label>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <Link
                      href={`/plam-admin/animales/${animal.id}`}
                      className="font-medium text-green-600  hover:underline"
                    >
                      Ver Detalles
                    </Link>
                  </td>
                  <td className="px-2 py-4 text-right  hidden sm:table-cell">
                    <Link
                      href={`/plam-admin/animales/editar/${animal.id}`}
                      className="font-medium text-blue-600  hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                  <td className="px-2 py-4 text-right hidden sm:table-cell">
                    <Modal
                      buttonStyles="font-medium text-red-600  hover:underline cursor-pointer"
                      buttonText="Eliminar"
                    >
                      <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black ">
                        <h2 className="text-2xl font-bold">
                          ¿Estás seguro de que quieres enviarlo a la papelera de reciclaje?
                        </h2>
                        <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                          <div className="aspect-square">
                            <Image
                              className="w-full h-full object-cover bg-white"
                              src={animal.images[0].imgUrl}
                              alt={animal.images[0].imgAlt}
                              width={300}
                              height={300}
                            />
                          </div>
                          <div className="flex flex-col items-center justify-between gap-1 p-2">
                            <span className="uppercase text-2xl text-center font-extrabold">
                              Nombre: {animal.name}
                            </span>
                            <span className="uppercase text-2xl text-center font-extrabold">
                              Id :{animal.id}
                            </span>
                            <button
                              onClick={() => handleDelete(animal.id)}
                              className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        </article>
                      </section>
                    </Modal>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {animalsToShow.length < 1 && <p className="text-center">No hay animales que mostar</p>}
        <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace('/plam-admin/animales/crear');
          }}
        />
      </div>
      <Link
        className="bg-green-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        href="/plam-admin/animales/adoptados"
      >
        {' '}
        Ver Adoptados
      </Link>
      <Link
        className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
        href="/plam-admin/animales/papelera"
      >
        {' '}
        Ver Papelera
      </Link>
    </section>
  );
}
