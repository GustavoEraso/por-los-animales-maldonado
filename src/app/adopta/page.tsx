
import Hero from "@/components/Hero";
import CardContainer from "@/containers/CardContainer";
import { fetchAnimals } from "@/lib/fetchAnimal";


export default async function Adopta() {

  
  const animals = await fetchAnimals({isAvalible:true});
  
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">

      <Hero title="en construccion" />
      <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
        <CardContainer animalsList={animals} />
        
      </section>


    </div>
  );
}