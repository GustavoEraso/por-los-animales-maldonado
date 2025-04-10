import Header from "@/components/Header";
import CardContainer from "@/Containers/CardContainer";
import Hero from "@/components/Hero";
import Carrousel from "@/components/Carrousel";
import { Animal } from "@/types";
import CircleCard from "@/components/CircleCard";



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


        
          <div className="grid grid-cols-1 sm:grid-cols-2  gap-8 w-full max-w-6xl p-4">
            
              <CircleCard
                key={provisoria[0].id}
                imgUrl={'https://media.istockphoto.com/id/1589824836/es/foto/lindo-perro-marr%C3%B3n-que-sonr%C3%ADe-fondo-aislado.jpg?s=612x612&w=0&k=20&c=ot8ABTfJKcWmy41FwVf0w4auYTU5gsojkylCch_Rk8g='}
                imgAlt={provisoria[0].images[0].imgAlt}
                linkUrl={`/animals/${provisoria[0].id}`}
                linkText='doná ahora'
                invert={true}
              />
              <CircleCard
                key={provisoria[1].id}
                imgUrl='https://estaticos-cdn.prensaiberica.es/clip/340f9f56-f9ea-40ad-b63a-c4c764d897e6_16-9-aspect-ratio_default_0.jpg'
                imgAlt={provisoria[1].images[0].imgAlt}
                linkUrl={`/animals/${provisoria[1].id}`}
                linkText='doná insumos'
                invert={false}
                />
            
            </div>
          
        
   
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      
      </footer>
    </div>
  );
}
