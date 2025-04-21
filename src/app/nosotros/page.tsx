import Image from "next/image";
import Hero from "@/components/Hero";
import IconCard from "@/components/IconCard";

export default function Nosotros() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">

      <Hero />
      <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
        <section className=" w-full ">

          <p className="mt-4 text-sm font-barlow">
            <strong>Por los animales Maldonado</strong> Somos una organización sin fines de lucro dedicada a la protección y bienestar de los animales en Maldonado.
          </p>
          <p className="mt-4 text-sm font-barlow">Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!</p>
          <p className="mt-4 text-sm font-barlow">
            <strong>Nuestra misión</strong> Somos una organización sin fines de lucro dedicada a la protección y bienestar de los animales en Maldonado.
          </p>
        </section>
        <Image src={"/heroImg.jpg"} alt="Hero image" width={300} height={400} className="w-full lg:w-1/2 h-auto object-cover rounded-lg " />

        
      </section>
      <h3 className="uppercase text-center text-balance text-2xl lg:text-4xl font-bold font-barlow text-dark-text px-4 ">¿Cómo desarrollamos nuestras actividades?</h3>
      <section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 px-9 py-4 w-full">
        <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!"/>
        <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!"/>
        <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam  nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!"/>
        <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!"/>
        <IconCard icon="/logo300.png" title="el titulo" description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero doloremque, eos nam repellendus harum unde ducimus possimus minima. Porro tempore nesciunt vero a aliquid soluta assumenda velit id! Animi, eum!"/>
        

      </section>
      </section>


    </div>
  );
}