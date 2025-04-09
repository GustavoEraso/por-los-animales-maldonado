import Header from "@/components/Header";
import CardContainer from "@/Containers/CardContainer";
import Hero from "@/components/Hero";
import Carrousel from "@/components/Carrousel";
import { Animal } from "@/types";



const provisoria: Animal[]= [
  {
    id: 'kagd',
    name: 'el firulais',
    gender:'macho',
    species:'perro',
    images: [
      {
        imgUrl:'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
        imgAlt:'el alt',
        imgId:'jkbf',
      }
    ],
    description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
    lifeSatge: 'cachorro',
    size: 'pequeño',
    status: 'disponible',
    location:'protectora',
    waitingSince: new Date('2013,08,12'),
  },
  {
    id: 'kagdwdqdw',
    name: 'el firulais',
    gender:'macho',
    species:'perro',
    images: [
      {
        imgUrl:'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
        imgAlt:'el alt',
        imgId:'jkbf',
      }
    ],
    description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
    lifeSatge: 'cachorro',
    size: 'pequeño',
    status: 'disponible',
    location:'protectora',
    waitingSince: new Date('2013,08,12'),
  },
  {
    id: 'kagdqwf',
    name: 'el firulais',
    gender:'macho',
    species:'perro',
    images: [
      {
        imgUrl:'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
        imgAlt:'el alt',
        imgId:'jkbf',
      }
    ],
    description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
    lifeSatge: 'cachorro',
    size: 'pequeño',
    status: 'disponible',
    location:'protectora',
    waitingSince: new Date('2013,08,12'),
  },
  {
    id: 'kagddwwd',
    name: 'el firulais',
    gender:'macho',
    species:'perro',
    images: [
      {
        imgUrl:'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
        imgAlt:'el alt',
        imgId:'jkbf',
      }
    ],
    description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
    lifeSatge: 'cachorro',
    size: 'pequeño',
    status: 'disponible',
    location:'protectora',
    waitingSince: new Date('2013,08,12'),
  },

]
export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Header/>
      <Carrousel/>
        <Hero/>
      <main className="flex flex-col w-full max-w-6xl items-center justify-center">
        <CardContainer animalsList={provisoria}/>
        
   
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      
      </footer>
    </div>
  );
}
