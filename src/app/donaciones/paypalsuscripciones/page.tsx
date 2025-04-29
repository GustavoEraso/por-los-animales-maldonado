import Image from "next/image";
import PayPalProvider from "@/components/PaypalProvider";
import PayPalSuscriptionButton from "@/elements/PayPalSuscriptionButton";
import Hero from "@/components/Hero";
export default function PaypalSuscripciones() {

  const subscriptionPlans: [string, string][] = [
    ["5", "P-91S94570456431505NAGGQYA"],
    ["10", "P-91S94570456431505NAGGQYA"],
    ["15", "P-91S94570456431505NAGGQYA"],
    ["25", "P-91S94570456431505NAGGQYA"],
    ["40", "P-91S94570456431505NAGGQYA"],
    ["50", "P-91S94570456431505NAGGQYA"],
    ["75", "P-91S94570456431505NAGGQYA"],
    ["100", "P-91S94570456431505NAGGQYA"],
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
          <Image src='/pp-logo-200px.png' alt='logo mercado pago' width={300} height={80} />

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