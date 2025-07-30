import Image from "next/image";
import PayPalProvider from "@/components/PaypalProvider";
import PayPalSuscriptionButton from "@/elements/PayPalSuscriptionButton";
import Hero from "@/components/Hero";
export default function PaypalSuscripciones() {

  const subscriptionPlans: [string, string][] = [
    ["5", "P-3EE21900BN8910020NCEVJ2Q"],
    ["10", "P-99636697VT8227923NCEVLHY"],
    ["15", "P-60W02761U5641694CNCEVLYI"],
    ["25", "P-2GX87339XA132745GNCEVMNY"],
    ["40", "P-6AP12095F0757022BNCEVMYQ"],
    ["50", "P-8SW81233BH004120DNCEVM7Y"],
    ["75", "P-4W410887VS320334NNCEVNHI"],
    ["100", "P-9UA87528FR860041CNCEVPQA"],
  ];
  return (
    <div>

      <Hero title="Paypal suscripciones" />
      <section className="flex flex-col items-center justify-center p-8 w-full   text-black text-lg">
        <p className="max-w-7xl">Las suscripciones económicas de ustedes son nuestro respaldo fundamental para continuar con nuestra labor. Los aportes recurrentes se destinan principalmente a cubrir atención veterinaria (cirugías, tratamientos, análisis, medicación, honorarios) y también a la compra de insumos y alimento para nuestros rescatados.</p>
      </section>

      <PayPalProvider type="subscription">
        {/* PayPal suscribirse */}
        <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 gap-10 ">
          <Image src='/paypal-3.svg' alt='logo paypal' width={300} height={80} />

          <p className="text-xl text-black   font-bold">Planes de suscripción mensual</p>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full place-items-center max-w-xl">

            {subscriptionPlans.map(([amount, planId], index) => (
              <PayPalSuscriptionButton key={planId + amount + index} label={amount} planId={planId} />
            ))}



            {/* <PayPalSuscriptionButton  /> */}

          </section>

        </article>

      </PayPalProvider>

    </div>
  );
}