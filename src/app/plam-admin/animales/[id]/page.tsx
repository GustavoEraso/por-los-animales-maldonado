'use client';

import Hero from "@/components/Hero";
import PhotoCarrousel from "@/components/PhotoCarrousel";
import { Modal } from "@/components/Modal";
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Animal, PrivateInfo } from '@/types';
import { getFirestoreAnimalById } from '@/lib/firebase/getFirestoreAnimalById';
import { getFirestorePrivateInfoById } from '@/lib/firebase/getFirestorePrivateInfoById ';
import { auth } from '@/firebase';

import { formatDateMMYYYY, yearsOrMonthsElapsed } from "@/lib/dateUtils";
import FloatButton from "@/elements/FloatButton";
import { postAnimal } from "@/lib/firebase/postAnimal";
import { postAnimalPrivateInfo } from "@/lib/firebase/postAnimalPrivateInfo";





export default function AnimalPage() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);



  const [animal, setAnimal] = useState<Animal>({} as Animal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfo>({} as PrivateInfo);
  const [allPrivateInfo, setAllPrivateInfo] = useState<PrivateInfo[]>([] as PrivateInfo[]);





  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        if (!currentId) return null;
        const animal = await getFirestoreAnimalById(currentId);
        if (!animal) {
          console.error('Animal not found');
          return;
        }
        const currentPrivateInfo = await getFirestorePrivateInfoById(currentId);
        if (!currentPrivateInfo) {
          console.error('Private info not found for this animal');
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...onlyData } = currentPrivateInfo;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const parsedPrivateData = Object.entries(onlyData).map(([_, data]) => data) as unknown as PrivateInfo[];
        const sortedPrivateData = parsedPrivateData.sort((a, b) => b.date - a.date)

        setAllPrivateInfo(sortedPrivateData);
        const latestEntry = Object.entries(onlyData).reduce((latest, [key, data]) => {
          return data.date > latest[1].date ? [key, data] : latest;
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [dateKey, latestData] = latestEntry;

        if (!latestData) {
          console.error('No valid private info data found');
          return;
        }
        const currentData = latestData as unknown as PrivateInfo


        setAnimal(animal)
        setPrivateInfo(currentData);


      } catch (error) {
        console.error('Error fetching animal data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnimalData();

  }, [currentId]);

  const handleDelete = async (currentId: string) => {
    try {



      if (!animal) throw new Error(`Animal with id ${currentId} not found`);

      const updatedAnimal = { ...animal, isDeleted: true, isVisible: false, isAvalible: false };




      const newData = {
        ...privateInfo,
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isDeleted: true,
        isVisible: false,
        isAvalible: false
      } as PrivateInfo

      await postAnimal({ data: updatedAnimal, id: currentId });
      await postAnimalPrivateInfo({
        data: newData,
        id: currentId
      })



      router.push('/plam-admin/animales');
    } catch (error) {

      console.error('Error al cambiar el estado del animal:', error);

    }
  }

  if (!animal) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <Hero title="ups" />
        <section className="flex flex-col gap-4 px-9 py-4 max-w-7xl">
          <h1>Pagina no encontrada</h1>
        </section>
      </div>
    );
  }

  const { name, description, isAvalible, images, gender, aproxBirthDate, status, size, species, waitingSince, compatibility, isSterilized } = animal;
  const { contactName, contacts, notes, modifiedBy, date } = privateInfo;
  const img = images?.length > 0 ? images : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];
  if (isLoading) {
    return (
      <section className='flex justify-center items-center w-full h-screen'>
        <p className='text-2xl font-bold'>Cargando animal...</p>
      </section>
    );
  }

  const YesNoUnknownMap = {
    si: 'Sí',
    no: 'No',
    no_se: 'No sabemos',
  };
  return (
    <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
      <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />

      <section className="flex flex-col lg:flex-row gap-4 py-4 w-full justify-center items-center">
        <div className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full max-w-7xl">
          <div className="fflex flex-col gap-4 text-start text-black px-2 md:w-3/5">
            <p className="text-green-dark text-lg font-bold">{description}</p>
            <ul className="list-disc pl-4 text-green-dark">
              <li className="text-xl font-semibold">Estado: <span className="font-normal">{`${isAvalible ? 'Disponible' : 'De momento no se puede adoptar'}`}</span></li>
              <li className="text-xl font-semibold">Género: <span className="font-normal">{gender}</span></li>
              <li className="text-xl font-semibold">Especie: <span className="font-normal">{species}</span></li>
              <li className="text-xl font-semibold">Tamaño: <span className="font-normal">{size}</span></li>
              <li className="text-xl font-semibold">Situación actual: <span className="font-normal">{status}</span></li>
              <li className="text-xl font-semibold">Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span></li>
              <li className="text-xl font-semibold">
                Esperándo desde: <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
              </li>
              <li className="text-xl font-semibold">Está esterilizado: <span className="font-normal">{YesNoUnknownMap[isSterilized]}</span></li>
              <li>
                <span className="text-xl font-semibold">Compatibilidad:</span>
                <ul className="list-disc pl-4 ">
                  <li> <span className="font-semibold">Con perros:</span> {YesNoUnknownMap[compatibility.dogs]}</li>
                  <li><span className="font-semibold">Con gatos:</span> {YesNoUnknownMap[compatibility.cats]}</li>
                  <li><span className="font-semibold">Con niños:</span> {YesNoUnknownMap[compatibility.kids]}</li>
                </ul>
              </li>

            </ul>
            <ul className="list-none p bg-cream-light flex flex-col gap-2 px-2 rounded-lg">
              <li className="text-xl font-semibold">Contacto: <span className="font-normal">{contactName}</span></li>
              {contacts && contacts.map((contact, index) => (
                <li key={`${index}-${contact.value}`} className="text-xl font-semibold capitalize">
                  {contact.type}: <span className="font-normal">{contact.value}</span>
                </li>
              ))}
              <li className="text-xl font-semibold">Notas: <span className="font-normal">{notes}</span></li>
              <li className="text-xl font-semibold">
                Ultima actualización: <span className="font-normal">{`${formatDateMMYYYY(date)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
              </li>
              <li className="text-xl font-semibold">Actualizado por: <span className="font-normal">{modifiedBy}</span></li>
            </ul>
            <Modal buttonText="Ver historial de estados">
              <section className="flex flex-col items-center justify-around bg-amber-sunset w-full min-h-full p-4 gap-1 text-center ">
                <h4 className="font-extrabold text-2xl  text-green-dark">Historial de estados</h4>
                <p className="text-green-dark text-md font-bold ">
                  Este animal ha tenido los siguientes estados a lo largo del tiempo:
                </p>
                <ul className="flex flex-col gap-2 list-disc p-2 text-green-dark">
                  {allPrivateInfo.map((info, index) => {
                    const date = new Date(info.date).toLocaleDateString('uy-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    });
                    const since = new Date(info.since).toLocaleDateString('uy-ES');

                    return (<ul key={`${index}-${info.date}`} className="text-xl text-start font-semibold flex flex-col gap- p-2 bg-white rounded">
                      <li className="font-semibold"> Fecha: <span className="font-normal">{(date)} hs</span></li>
                      <li className="font-semibold"> Actualizado por: <span className="font-normal">{info.modifiedBy}</span></li>
                      <li className="font-semibold">Estado: <span className="font-normal">{`${info.isAvalible ? 'Disponible' : 'No disponible'}`}</span></li>
                      <li className="font-semibold">Mostrar: <span className="font-normal">{`${info.isVisible ? 'Mostrar' : 'Ocultar'}`}</span></li>
                      <li className="font-semibold"> Situación actual: <span className="font-normal">{info.status}</span></li>
                      <li className="font-semibold"> Desde: <span className="font-normal">{since}</span></li>
                      <li className="font-semibold"> Contacto: <span className="font-normal">{info.contactName}</span></li>
                      <li className="font-semibold"> Notas: <span className="font-normal">{info.notes}</span></li>
                      {info.contacts && info.contacts.map((contact, index) => (
                        <li key={`${index}-${contact.value}`} className="text-xl font-semibold capitalize">{contact.type}: <span className="font-normal">{contact.value}</span></li>))}
                    </ul>)
                  })}

                </ul>

              </section>
            </Modal>
          </div>
          {/* <img src={img[0].imgUrl} alt={img[0].imgAlt} width={300} height={400} className="w-full md:w-1/3 h-auto rounded-lg object-cover" /> */}
          <div className="w-full md:w-2/5 h-auto rounded-lg bg-amber-sunset">

            <PhotoCarrousel images={img} />
          </div>

        </div>
      </section>

      {/* <section className="flex flex-col gap-4 px-9 py-4 w-full max-w-7xl items-center">
        <h3 className="font-extrabold text-4xl text-green-dark">Más imágenes</h3>

      </section> */}
      <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
        <Link href={`/plam-admin/animales/editar/${animal.id}`} className="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300">Editar</Link>
        <Modal buttonStyles=" bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300" buttonText="Eliminar">
          <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center ">
            <h2 className="text-2xl font-bold">¿Estás seguro de que quieres enviarlo a la papelera de reciclaje?</h2>
            <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
              <div className="aspect-square">
                <Image className="w-full h-full object-cover bg-white" src={animal.images[0].imgUrl} alt={animal.images[0].imgAlt} width={300} height={300} />
              </div>
              <div className="flex flex-col items-center justify-between gap-1 p-2">
                <span className="uppercase text-2xl text-center font-extrabold">Nombre: {animal.name}</span>
                <span className="uppercase text-2xl text-center font-extrabold">Id :{animal.id}</span>
                <button onClick={() => handleDelete(animal.id)} className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300">Eliminar</button>
              </div>

            </article>
          </section>
        </Modal>
      </section>

      <FloatButton
        action={() => router.push(`/plam-admin/animales/editar/${currentId}`)}
        buttonStyle="edit"
      />
    </div>
  );
}

