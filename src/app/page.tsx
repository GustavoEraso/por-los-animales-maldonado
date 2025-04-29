import Link from "next/link";

// import CardContainer from "@/Containers/CardContainer";
// import Hero from "@/components/Hero";
import Carrousel from "@/components/Carrousel";
// import { Animal } from "@/types";
import CircleCard from "@/components/CircleCard";



// const provisoria: Animal[] = [
//   {
//     id: 'kagd',
//     name: 'el firulais',
//     gender: 'macho',
//     species: 'perro',
//     images: [
//       {
//         imgUrl: 'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
//         imgAlt: 'el alt',
//         imgId: 'jkbf',
//       }
//     ],
//     description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
//     lifeSatge: 'cachorro',
//     size: 'pequeño',
//     status: 'disponible',
//     location: 'protectora',
//     waitingSince: new Date('2013,08,12'),
//   },
//   {
//     id: 'kagdwdqdw',
//     name: 'el firulais',
//     gender: 'macho',
//     species: 'perro',
//     images: [
//       {
//         imgUrl: 'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
//         imgAlt: 'el alt',
//         imgId: 'jkbf',
//       }
//     ],
//     description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
//     lifeSatge: 'cachorro',
//     size: 'pequeño',
//     status: 'disponible',
//     location: 'protectora',
//     waitingSince: new Date('2013,08,12'),
//   },
//   {
//     id: 'kagdqwf',
//     name: 'el firulais',
//     gender: 'macho',
//     species: 'perro',
//     images: [
//       {
//         imgUrl: 'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
//         imgAlt: 'el alt',
//         imgId: 'jkbf',
//       }
//     ],
//     description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
//     lifeSatge: 'cachorro',
//     size: 'pequeño',
//     status: 'disponible',
//     location: 'protectora',
//     waitingSince: new Date('2013,08,12'),
//   },
//   {
//     id: 'kagddwwd',
//     name: 'el firulais',
//     gender: 'macho',
//     species: 'perro',
//     images: [
//       {
//         imgUrl: 'https://www.marthadebayle.com/wp-content/uploads/2024/04/pais-sin-perros-callejeros.jpg',
//         imgAlt: 'el alt',
//         imgId: 'jkbf',
//       }
//     ],
//     description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nihil, iste modi? Tempora ipsum magnam laborum dolorem. Atque accusantium ullam cumque beatae esse repudiandae, voluptates minima aspernatur deleniti. Odit, perferendis labore.',
//     lifeSatge: 'cachorro',
//     size: 'pequeño',
//     status: 'disponible',
//     location: 'protectora',
//     waitingSince: new Date('2013,08,12'),
//   },

// ]
export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen  ">
      <Carrousel />
      {/* <Hero /> */}
      <main className="flex flex-col w-full  items-center justify-center">
        {/* <CardContainer animalsList={provisoria} /> */}


        <section className="flex flex-col items-center justify-center w-full bg-white px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl py-16">
            <div className="bg-cream-light rounded-full w-full max-w-lg aspect-square flex items-center justify-center">

              <img className="w-9/12" src="/logo300.png" alt="logo" />
            </div>
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-bold text-4xl">CONOCENOS</h3>
              <p>Somos un equipo de personas impulsadas por la empatía hacia los animales, reconociéndolos como nuestros semejantes debido a su capacidad para experimentar placer, alegría, dolor y sufrimiento.</p>
              <Link href="/nosotros" className="w-fit text-2xl rounded-full px-8 py-4 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset">
                Ver más
              </Link>
            </div>


          </div>


        </section>


        <section className="flex flex-col items-center justify-center w-full bg-cream-light px-6">

          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl py-16">
            <div className="w-full min-w-1/3 flex items-center justify-center">

              <CircleCard imgAlt="imagen madre cn sus cachorros" imgUrl="/madre-con-cachorros.jpg" linkUrl="/adopta" linkText="quiero adoptar" />
            </div>
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-bold text-4xl uppercase">adoptá</h3>
              <p>Al pensar en adoptar, es crucial tener en cuenta diversos factores para garantizar una convivencia armoniosa. Evalúa el espacio disponible en tu hogar, el tiempo que puedes dedicar al juego y paseo, así como los costos asociados con la alimentación, atención veterinaria y cuidado durante las vacaciones. Asegúrate de que tu elección de mascota se ajuste a tu estilo de vida y a la cantidad de tiempo que puedes comprometer.</p>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <Link href="/adopta#antes-de-adoptar" className="w-fit text-2xl rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                  Antes de adoptar
                </Link>
                <Link href="/adopta#requisitos" className="w-fit text-2xl rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                  Requisitos
                </Link>

              </div>
            </div>
          </div>

        </section>

        <section className="flex flex-col items-center justify-center w-full bg-white">

          <div className="grid grid-cols-1 sm:grid-cols-2  gap-8 w-full max-w-6xl p-4 py-16">

            <CircleCard              
              imgUrl={'/perro-amarillo-feliz.jpg'}
              imgAlt={'imagen perro amarillo feliz'}
              linkUrl={'/donaciones#aportes-economicos'}
              linkText='doná ahora'
              invert={true}
            />
            <CircleCard              
              imgUrl='/perro-pelado.jpg'
              imgAlt={'imagen perro blanco que necesita atencion medica'}
              linkUrl={'/donaciones#donacion-de-insumos'}
              linkText='doná insumos'
              invert={false}
            />

          </div>
        </section>

        <section className="flex flex-col items-center justify-center w-full bg-cream-light px-6">

          <div className="flex flex-col md:flex-row-reverse gap-8 items-center justify-center w-full max-w-6xl py-16">
            <div className="w-full min-w-1/3 flex items-center justify-center">

              <div className="bg-cream-light rounded-full w-full max-w-lg aspect-square flex items-center justify-center">

                <img className="w-9/12" src="/logo300.png" alt="logo" />
              </div>
            </div>
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-bold text-4xl uppercase">involucrate</h3>
              <p>Hay muchas formas de ayudar a los animales más allá de adoptar. Podés colaborar ayudando con traslados, siendo hogar transitorio, ofreciendo un espacio para guardar donaciones, difundiendo casos en redes o incluso denunciando situaciones de maltrato animal. También recibimos donaciones de insumos, alimentos, mantas o cualquier elemento útil. Cada granito de arena cuenta y suma al bienestar de quienes más nos necesitan. ¡Tu compromiso puede hacer una gran diferencia!</p>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <Link href="/involucrate" className="w-fit text-2xl rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                  ver más
                </Link>


              </div>
            </div>
          </div>

        </section>


        <section className="flex flex-col items-center justify-center w-full bg-white px-6 py-12">
          <div className="flex flex-col gap-4   text-start text-black px-2">
            <h3 className="font-bold text-4xl uppercase text-center text-balance">siguenos en nuestras redes:</h3>
            <section className="flex flex-col md:flex-row gap-6 items-center justify-center " >

              <a
                href="https://www.facebook.com/PorLosAnimalesMaldonado"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enlace a Facebook"
              >
                <span className="flex justify-center items-center p-4 rounded-full gap-2 text-2xl hover:bg-white transition duration-300 ease-in-out">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-black hover:text-black-300"
                  >
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />

                  </svg>
                  FACEBOOK
                </span>

              </a>
              <a
                href="https://www.instagram.com/porlosanimales_maldonado/?hl=es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enlace a Instagram"
              >
                <span className="flex justify-center items-center p-4 rounded-full gap-2 text-2xl hover:bg-white transition duration-300 ease-in-out">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-black hover:text-black-300"
                  >
                    <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
                  </svg>
                  INSTAGRAM

                </span>



              </a>


            </section>
            <h3 className="font-bold text-4xl uppercase text-center text-balance">nuestro correo electronico:</h3>
           <a  className=" text-xl md:text-3xl text-center" href="mailto:porlosanimalesmaldo@gmail.com">porlosanimalesmaldo@gmail.com</a>
          </div>

        </section>



      </main>
    </div>
  );
}
