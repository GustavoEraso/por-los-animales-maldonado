import Image from "next/image";
import Hero from "@/components/Hero";
import { Modal } from "@/components/Modal";


export default function INVOLUCRATE() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white overflow-hidden">
      <Hero imgURL="/perrito-negro-respaldo.webp" />
      {/* DENUNCIA EL MALTRATO SECTION */}
      <section id="denuncia-maltrato" className="w-full flex flex-col items-center justify-center ">
        <section className="flex flex-col lg:flex-row gap-4  py-4 w-full   justify-center items-center">
          <section className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">DENUNCIA EL MALTRATO</h3>
              <p className=" text-green-dark text-2xl font-bold text-balance">Pueden haber diversas formas de maltrato: </p>
              <ul className="list-disc pl-4  text-green-dark">
                <li className="text-xl font-semibold">Animales atados sin resguardo</li>
                <li className="text-xl font-semibold">Lastimados sin asistencia</li>
                <li className="text-xl font-semibold">Falta de alimento, falta de agua</li>
                <li className="text-xl font-semibold">Sueltos en la vía pública</li>
                <li className="text-xl font-semibold">O directamente violencia física...</li>
              </ul>
            </div>
            <Image src={"/perro-maltratado.webp"} alt="perro en malas condiciones" width={300} height={400} className="w-full md:w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
          </section>
        </section>
        <section className="flex flex-col lg:flex-row gap-4  py-12 w-full   justify-center items-center bg-cream-light">
          <section className="flex flex-col  gap-8 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <h3 className="font-extrabold text-4xl  text-green-dark">El consejo para dar una solución inmediata y dependiendo de cada caso siempre es:</h3>
            <ul className="display flex flex-col gap-8 list-decimal pl-4  text-green-dark items-center justify-center w-fit">
              <li className=" text-green-dark text-xl font-bold text-balance">
                Hablar en buenos términos con los dueños, ofrecer ayuda (puede ser con medicación, cucha para resguardo, llevarlo a castrar, cadena más larga). Desde este espacio se pueden hacer pedidos de colaboración para ayudar a ese animal que necesita ser salvado cuanto antes.
              </li>
              <li className=" text-green-dark text-xl font-bold text-balance">
                Si no hay cambio, no acceden o es imposible hacerlo: hacer la denuncia ante INBA a través del siguiente<a
                  className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 "
                  href="https://www.mgap.gub.uy/bienestaranimal/formulariodenunciante.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                >Formulario
                </a>, adjuntando pruebas (fotos, videos, audio, denuncia policial si la hay).
              </li>
            </ul>
            <div className="flex flex-col gap-4 text-start p-8 bg-white w-full max-w-4xl rounded-lg ">
              <p className=" text-green-dark text-lg font-bold text-balance">Se recomienda hacer previamente la denuncia policial para luego adjuntarla al formulario de INBA. Se hace en cualquier seccional, sí o sí deben tomarla.</p>
              <p className=" text-green-dark text-lg font-bold text-balance">Luego ampliar todo al mail <a href="mailto:denunciasinba@mgap.gub.uy" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ">denunciasinba@mgap.gub.uy</a>.</p>
              <div className=" text-green-dark text-lg font-bold text-balance">
                <h4 className="text-xl">Teléfonos nacionales para asesoramiento:</h4>
                <a href="tel:+59829081169" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ">2908 1169</a>|
                <a href="tel:+59829081271" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ">2908 1271</a>|
                <a href="tel:+59829087931" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ">2908 7931</a>int 133-138 para todos|<a href="tel:+59894747542" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ">094 747 542</a>.</div>
            </div>
          </section>
        </section>
      </section>

      {/* CASTRACIONES SECTION */}
      <section id="castraciones" className="w-full flex flex-col items-center justify-center ">
        <section className="flex flex-col lg:flex-row gap-4  py-4 w-full   justify-center items-center">
          <section className="flex flex-col md:flex-row-reverse gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">CASTRACIONES</h3>
              <p className=" text-green-dark text-2xl font-bold text-balance">En Uruguay, la esterilización (castración) de perros y gatos es obligatoria según el Decreto N° 57/023, que implementa la Ley 19.889. Esta obligación se aplica a todos los perros y gatos que viven en el país y es una medida para controlar superpoblación.</p>
            </div>
            <Image src={"/castraciones-perros-generica-1024x576.webp"} alt="perro en malas condiciones" width={300} height={400} className="w-full md:w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
          </section>
        </section>
        <section className="flex flex-col  gap-4  py-12 w-full   justify-center items-center bg-cream-light">
          <section className="flex flex-col  gap-8 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <p className=" text-green-dark text-lg font-extrabold ">A los 6 meses de edad el animal ya está en condiciones de ser castrado, sea perra/o o gata/o. </p>
            <p className=" text-green-dark text-lg font-bold "><strong>Esterilizar no solo es un acto de responsabilidad sino también de amor.</strong> No solo frena la reproducción de animales sino que previene muchas enfermedades, es muy positivo para los animalitos y la recuperación de la operación es muy rápida.
            </p>
            <h4 className=" text-green-dark text-lg font-bold ">
              En Maldonado existen diferentes programas de castraciones gratuitas en todo el departamento.
            </h4>
            <div className="flex flex-col gap-4 text-start p-8 bg-white w-full max-w-4xl rounded-lg ">

              <ul className="display flex flex-col gap-8 list-disc pl-4  text-green-dark  w-fit">
                <li className=" text-green-dark text-xl font-bold text-balance">
                  <strong>CANINAS</strong> a cargo de la Intendencia en conjunto con INBA, pueden ver requisitos, calendario y agenda en este
                  <a
                    className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 "
                    href="https://www.gub.uy/tramites/castraciones-caninas-gratuitas-maldonado"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    link
                  </a>, También pueden agendarse a los siguientes contactos:

                  <ul className="display flex flex-col  list-disc pl-4  text-green-dark  w-fit">
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Refugio Departamental
                      <a
                        href="tel:+59842244897"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4224 4897
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Maldonado
                      <a
                        href="tel:+59842233887"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4223 3887
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de San Carlos
                      <a
                        href="tel:+59842669222"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4266 9222
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Pan de Azúcar
                      <a
                        href="tel:+59844346283"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4434 6283
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Aiguá
                      <a
                        href="tel:+59844462027"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4446 2027
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Punta del Este
                      <a
                        href="tel:+59842446162"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4244 6162
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Garzón
                      <a
                        href="tel:+59844806004"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4480 6004
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Piriápolis
                      <a
                        href="tel:+59844323374"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4432 3374
                      </a>
                    </li>
                    <li className=" text-green-dark text-xl font-bold text-balance">
                      Municipio de Solís
                      <a
                        href="tel:+59844390039"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2"
                      >
                        4439 0039
                      </a>
                    </li>
                  </ul>

                </li>
                <li className=" text-green-dark text-xl font-bold text-balance">
                  <strong>FELINAS</strong>  a cargo de la Intendencia. Consultar información al
                  <a
                    className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 "
                    href="tel:+59899542753"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    099 542 753
                  </a>.
                </li>
                <li className=" text-green-dark text-xl font-bold text-balance">
                  <strong>FELINAS Y CANINAS</strong>  a cargo de SO.CO.BIO.MA en conjunto con INBA. Consultar información al
                  <a
                    className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 "
                    href="tel:+59894811510"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    094 811 510
                  </a>.
                </li>

              </ul>
            </div>
          </section>



        </section>
        <section className="flex flex-col  gap-4  py-12 w-full   justify-center items-center bg-white">
          <section className="flex flex-col  gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <p className=" text-green-dark text-2xl text-center font-bold text-balance">También pueden encontrar información en nuestro Facebook o Instagram Por los Animales Maldonado.
            </p>
            <section className="flex flex-col items-center justify-center w-full bg-white px-6 pt-12">
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
                      PorLosAnimalesMaldonado
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
                      porlosanimales_maldonado
                    </span>
                  </a>
                </section>
              </div>

            </section>

          </section>

        </section>
        <section className="flex flex-col  gap-4  py-4 w-full   justify-center items-center bg-cream-light">
          <section className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">CHIP</h3>
              <p className=" text-green-dark text-2xl font-bold text-balance">Cuando el animal es esterilizado se le coloca un chip de identificación con los datos del animal y su tenedor.
              </p>
              <p className=" text-green-dark text-2xl font-bold text-balance">En caso de haber llevado un animal de un tercero, puedes acceder al cambio de titular haciendo la solicitud por mail a

                <a
                  className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out mx-2 ml-2 "
                  href="mailto:renac@mgap.gub.uy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  renac@mgap.gub.uy
                </a>.

                adjuntando: número de cédula del animal, cédula del titular, teléfono y domicilio.

              </p>
            </div>
            <Image src={"/microchip_perro_implantacion.webp"} alt="perro en malas condiciones" width={300} height={400} className="w-full md:w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
          </section>
          <section className="flex flex-col  gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <p className=" text-green-dark text-2xl font-bold ">
              También existe un formulario de INBA en el que el titular autoriza al tercero a llevar a castrar su animal.
            </p>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <a href="/Decreto_Ley_castraciones.pdf" download className="w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Descargar decreto de Ley castraciones</a>
              <a href="/formulario_INBA.jpg" download className="w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Descargar formulario INBA</a>
            </div>


          </section>

        </section>
      </section>

      {/* HOGAR TRANSITORIO */}
      <section id="transitorio" className="w-full flex flex-col items-center justify-center ">
        <section className="flex flex-col lg:flex-row gap-4  py-4 w-full   justify-center items-center">
          <section className="flex flex-col md:flex-row-reverse gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">SE HOGAR TRANSITORIO</h3>
              {/* <p className=" text-green-dark text-2xl font-bold text-balance">Pueden haber diversas formas de maltrato: </p> */}
              <ul className="list-disc pl-4  text-green-dark">
                <li className="text-xl font-semibold">Ofrecé tu casa como hogar temporal.</li>
                <li className="text-xl font-semibold">No tenemos refugio, ¡te necesitamos!</li>
                <li className="text-xl font-semibold">Cubrimos comida, vet y casita.</li>
                <li className="text-xl font-semibold">Vos das amor y un lugar seguro.</li>
                <li className="text-xl font-semibold">Mientras buscamos su familia para siempre.</li>
              </ul>
            </div>
            <Image src={"/perrito-negro-dormido.webp"} alt="perro en malas condiciones" width={300} height={400} className="w-full md:w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
          </section>
        </section>
        <section className="flex flex-col lg:flex-row gap-4  py-12 w-full   justify-center items-center bg-cream-light">
          <section className="flex flex-col  gap-8 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <p className=" text-green-dark text-2xl font-bold ">
              Dado que no somos refugio ni tenemos espacio físico, para poder rescatar y ayudar es fundamental contar con hogares transitorios. Sin estos nuestra tarea se hace imposible.
            </p>
            <h4 className="font-extrabold text-4xl  text-green-dark"> ¿Cómo funciona?</h4>
            <p className=" text-green-dark text-2xl font-bold ">
              Muy fácil! Vos prestás un espacio en tu hogar mientras nosotros nos hacemos cargo de todos los gastos del animalito (alimento, atención veterinaria, proporcionamos casita, etc.) y de encontrarle una familia definitiva
            </p>
            <h4 className="font-extrabold text-4xl  text-green-dark"> Sumate como hogar transitorio</h4>
            <p className=" text-green-dark text-2xl font-bold ">
              Si tienés el tiempo, el espacio y las ganas de cambiarle la vida a un animal rescatado, ¡te necesitamos!
              Unite al grupo de WhatsApp solo si estás realmente comprometido y disponible para ser hogar transitorio en algún momento.
            </p>
            <p className=" text-green-dark text-2xl font-bold ">
              No es necesario que estés listo ya mismo, pero sí que tengas la intención real de ayudar cuando se necesite.
            </p>
            <Modal buttonText="quiero ser hogar transitorio">
              <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 text-center text-balance">
                <h4 className="font-extrabold text-4xl  text-green-dark">ACEPTO Y ME COMPROMETO</h4>
                <p className=" text-green-dark text-2xl font-bold ">
                  Al unirme al grupo confirmo que tengo disponibilidad para ser hogar transitorio por al menos 7 días, y me uno al grupo sabiendo que podré ayudar cuando se me necesite.
                </p>
                <a href="https://chat.whatsapp.com/CaCS6HsIGVP4aKz06rCeVi" target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Unirme al grupo de transitorios</a>

              </section>

            </Modal>

          </section>
        </section>
      </section>
      {/* TRASLADOS SOLIDARIOS */}
      <section id="traslados-solidarios" className="w-full flex flex-col items-center justify-center ">
        <section className="flex flex-col lg:flex-row gap-4  py-4 w-full   justify-center items-center">
          <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">HAS TRASLADOS SOLIDARIOS</h3>
              <p className=" text-green-dark text-2xl font-bold ">
                Nuestra tarea es a diario y acompaña la vida normal de cada uno de nosotros, vidas como las de todos ustedes. </p>
              <p className=" text-green-dark text-2xl font-bold ">
                 Muchas veces nos encontramos en horario laboral o con otras responsabilidades que no nos permiten abarcar todo. </p>
              <p className=" text-green-dark text-2xl font-bold ">
                Los traslados se necesitan permanentemente: </p>
                <ul className="list-disc pl-4 self-center  text-green-dark">
                <li className="text-xl font-semibold">para llevar un animal a la veterinaria,</li>
                <li className="text-xl font-semibold">para llevarlo a su transitorio </li>
                <li className="text-xl font-semibold">o muchas veces, hasta su hogar definitivo.</li>
              </ul>
              
              <p className=" text-green-dark text-3xl text-center font-bold ">
                Sumate a ser traslado solidario!</p>
            </div>
            <Image src={"/perrito-negro-respaldo.webp"} alt="perro en malas condiciones" width={300} height={400} className="w-full lg:w-1/3 h-auto aspect-video lg:aspect-square object-cover rounded-lg " />
          </section>
        </section>
          <Modal buttonText="unirme al grupo de traslados">
              <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 text-center text-balance">
                <h4 className="font-extrabold text-4xl  text-green-dark">ACEPTO Y ME COMPROMETO</h4>
                <p className=" text-green-dark text-2xl font-bold ">
                  Al unirme al grupo confirmo que tengo disponibilidad para realizar traslados solidarios de animales, y me comprometo a ayudar cuando se me necesite, siempre que esté dentro de mis posibilidades.
                </p>
                <a href="https://chat.whatsapp.com/CaCS6HsIGVP4aKz06rCeVi" target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Unirme al grupo de traslados</a>

              </section>

            </Modal>
       
      </section>
      {/* DIFUSION */}
      <section className="flex flex-col  gap-4  py-4 w-full   justify-center items-center bg-cream-light">
          <section className="flex flex-col md:flex-row-reverse gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-extrabold text-4xl  text-green-dark">DIFUSIÓN</h3>
              <p className=" text-green-dark text-2xl font-bold text-balance">Los pedidos de ayuda se canalizan por nuestras redes sociales, principalmente Instagram y Facebook, donde hacemos visible cada caso.</p>
              <p className=" text-green-dark text-2xl font-bold text-balance">Es fundamental para nosotros tener el mayor alcance posible y de esa manera llegar a más usuarios que se quieran sumar a ayudar y a adoptar.</p>
              <p className=" text-green-dark text-2xl font-bold text-balance">Podes seguirnos en nuestras cuentas y ayudarnos a difundir para llegar a más personas:</p>
              
            </div>
            <Image src={"/redes-16-9.jpg"} alt="redes" width={300} height={400} className="w-full md:hidden h-auto aspect-video md:aspect-square object-cover rounded-lg " />
            <Image src={"/redes-1-1.jpg"} alt="perro en malas condiciones" width={300} height={400} className=" hidden md:block w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
          </section>
          <section className="flex flex-col md:flex-row  items-center justify-center " >

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
                      PorLosAnimalesMaldonado
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
                      porlosanimales_maldonado
                    </span>
                  </a>
                </section>
          

        </section>



    </div>
  );
}