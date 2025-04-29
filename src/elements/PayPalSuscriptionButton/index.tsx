'use client';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

import { useRouter } from "next/navigation";

export default function SubscriptionButton({ label, planId }: { label: string, planId: string }) {
  const [{ isPending }] = usePayPalScriptReducer();
  const router = useRouter();

  return (
    <>
      <div className="flex flex-row gap-4 sm:gap-0 sm:flex-col items-center justify-center w-full h-full p-2 bg-blue-50 rounded-lg shadow-md">
      <h4 className="text-center text-balance" >Suscribite por USD {label}</h4>

        {isPending && <div>Loading Subscription Button...</div>}
        <PayPalButtons
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              plan_id: planId, // 👈 Tu PlanID de suscripción
            });
          }}
          style={{ 
            layout: "horizontal",
            color: "blue",
            shape: "rect",
            label: "subscribe",
            height: 40,
          }}
          onApprove={async () => {            
    
            router.push(
              `/donaciones/gracias?type=suscripcion&amount=${encodeURIComponent(label)} `
            );
          }}
        />
      </div>
    </>
  );
}

