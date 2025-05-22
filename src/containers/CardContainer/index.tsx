import Card from "@/components/Card";
import { Animal } from "@/types";



export default function CardContainer({animalsList=[]}:{animalsList:Animal[]}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {
        animalsList.map((animal, index)=><Card key={`${animal.id}CardContainer${index}`} props={animal} />)
      }
      
    
    </div>
  );
}