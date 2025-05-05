import Image from "next/image";
import Hero from "@/components/Hero";


export default function Nosotros() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white ">
      <Hero />
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
                Si no hay cambio, no acceden o es imposible hacerlo: hacer la denuncia ante INBA a través del siguiente <a
                  className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out "
                  href="https://www.mgap.gub.uy/bienestaranimal/formulariodenunciante.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Formulario
                </a>, adjuntando pruebas (fotos, videos, audio, denuncia policial si la hay).
              </li>
            </ul>
            <div className="flex flex-col gap-4 text-start p-8 bg-white w-full max-w-4xl rounded-lg ">
              <p className=" text-green-dark text-lg font-bold text-balance">Se recomienda hacer previamente la denuncia policial para luego adjuntarla al formulario de INBA. Se hace en cualquier seccional, sí o sí deben tomarla.</p>
              <p className=" text-green-dark text-lg font-bold text-balance">Luego ampliar todo al mail  <a href="mailto:denunciasinba@mgap.gub.uy" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out ">denunciasinba@mgap.gub.uy</a>.</p>
              <div className=" text-green-dark text-lg font-bold text-balance">
                <h4 className="text-xl">Teléfonos nacionales para asesoramiento:</h4>
                <a href="tel:+59829081169" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out "> 2908 1169</a> |
                <a href="tel:+59829081271" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out "> 2908 1271</a> |
                <a href="tel:+59829087931" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out "> 2908 7931</a> int 133-138 para todos | <a href="tel:+59894747542" className="text-blue-600 underline hover:text-blue-800 transition duration-300 ease-in-out "> 094 747 542</a>.</div>
            </div>
          </section>
        </section>
      </section>

    </div>
  );
}