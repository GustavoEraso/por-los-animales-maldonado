import Card from "@/components/Card";
import { Animal } from "@/types";



export default function CardContainer({animalsList=[]}:{animalsList:Animal[]}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:p-4">
      {
        animalsList.map((animal, index)=><Card key={`${animal.id}CardContainer${index}`} props={animal} />)
      }          
    
    </div>
  );
}