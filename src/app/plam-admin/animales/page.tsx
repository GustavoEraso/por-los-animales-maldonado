'use client';
import CardContainer from "@/containers/CardContainer";
import { fetchAnimals } from "@/lib/fetchAnimal";
import  FloatButton  from "@/elements/FloatButton";
import { useRouter } from "next/navigation";
import { Animal } from "@/types";
import { useEffect, useState, Suspense } from "react";


export default function AnimalesPage() {
    const router = useRouter();

    const [currentList, setCurrentList] = useState<Animal[]>([]);

    useEffect(() => {
        const fetchData = async () => { 
            const animals = await fetchAnimals();
            setCurrentList(animals);
        };
        fetchData()
    }, []); 
    
  return (
    <section className="p-8 lg:px-32">
      <h1 className="text-2xl font-bold mb-4">Animales</h1>
      <p>Aquí puedes gestionar los animales.</p>
      
      <Suspense fallback={<div>Cargando...</div>}>
       <CardContainer animalsList={currentList} />
      </Suspense>

       <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace("/plam-admin/animales/crear");
          }} />
    </section>
  );
}