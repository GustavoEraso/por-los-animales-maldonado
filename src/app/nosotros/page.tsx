import Image from "next/image";
import Hero from "@/components/Hero";
import IconCard from "@/components/IconCard";

export default function Nosotros() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">

      <Hero />
      <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
        <section className=" w-full ">

          <p className="mt-4 text-lg  ">
            <strong>Por los animales Maldonado</strong> Somos un grupo de particulares que ayuda a animales en situación de calle, brindándoles atención veterinaria mientras se recuperan en hogares transitorios (fundamentales para poder rescatar) para que finalmente encuentren un hogar. Nuestro grupo se hace cargo de todo en el proceso.
          </p>
          
        </section>
        <Image src={"/heroImg.jpg"} alt="Hero image" width={300} height={400} className="w-full lg:w-1/2 h-auto object-cover rounded-lg " />


      </section>
      <h3 className="uppercase text-center text-balance text-2xl lg:text-4xl font-bold   text-black px-4 ">¿Cómo desarrollamos nuestras actividades?</h3>
      <section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 px-9 py-4 w-full">
          <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!" />
          <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!" />
          <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam  nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!" />
          <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!" />
          <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!" />


        </section>
      </section>


    </div>
  );
}