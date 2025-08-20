'use client';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";

export default function DonationButton({ amount }: { amount: number }) {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-row gap-4 sm:gap-0 sm:flex-col items-center justify-center w-full h-full p-2 bg-blue-50 rounded-lg shadow-md">
        <h4 className="text-center text-balance" >Doná USD {amount}</h4>



        <PayPalButtons
          fundingSource="paypal"
          style={{
            layout: "horizontal",
            color: "blue",
            shape: "rect",
            label: "donate",
            height: 40,
          }}
          createOrder={
            (data, actions) =>
              actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: String(amount!),
                      // value: '1',
                    },
                  },
                ],
              })

          }
          // onApprove={onApprove}
          onApprove={async (_, actions) => {
            const details = await actions.order!.capture();
    
            // intentar extraer nombre
            const givenName = details.payment_source?.paypal?.name?.given_name
              ?? details.payer?.name?.given_name
              ?? "amigo";
    
            // extraer importe y moneda
            const captureInfo = details.purchase_units?.[0]?.payments?.captures?.[0];
            const capturedValue    = captureInfo?.amount?.value    ?? "";
            const capturedCurrency = captureInfo?.amount?.currency_code ?? "";
    
            router.push(
              `/gracias?` +
              `type=donate` +
              `&name=${encodeURIComponent(givenName)}` +
              `&amount=${encodeURIComponent(capturedValue)}` +
              `&currency=${encodeURIComponent(capturedCurrency)}`
            );
          }}
        />
      </div>
    </>
  );
}

