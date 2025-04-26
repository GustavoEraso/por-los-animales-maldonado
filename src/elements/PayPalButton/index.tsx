

"use client";
import { PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount?: string;               // Para donaciones
  subscriptionPlanId?: "5" | "1" | "15" | "25" | "30" | "50" | "75" | "100";   // Para suscripciones
}

export default function PayPalButton({
  amount,
  subscriptionPlanId,
}: PayPalButtonProps) {
  const isSubscription = Boolean(subscriptionPlanId);

  const suscriptionPlans: Record<string, string> = {
    "5": 'P-9AY13902A4685694VNAGHEHY',

    "1": 'P-44Y263066K7164837NAGHZLI',

    "15": 'P-8UU01705WW1876244NAFT46Q',
    "25": 'P-91S94570456431505NAGGQYA',
    "30": 'P-91S94570456431505NAGGQYA',
    "50": 'P-91S94570456431505NAGGQYA',
    "75": 'P-91S94570456431505NAGGQYA',
    "100": 'P-91S94570456431505NAGGQYA',
  };

  return (
    <div className="flex flex-row gap-4 sm:gap-0 sm:flex-col items-center justify-center w-full h-full p-2 bg-blue-50 rounded-lg shadow-md">
      {isSubscription ? (
        <h4 className="text-center text-balance" >Suscribite por USD {amount}</h4>
      ) : (
        <h4 className="text-center text-balance">Doná USD {amount}</h4>
      )}

      <PayPalButtons

        style={{
          layout: "horizontal",
          color: "blue",
          shape: "rect",
          label: isSubscription ? "subscribe" : "donate",
          height: 40,
        }}
        // Si es suscripción, usamos createSubscription:
        createSubscription={
          isSubscription
            ? (data, actions) =>
                actions.subscription.create({
                  plan_id: suscriptionPlans[subscriptionPlanId!],
                })
            : undefined
        }
        // Si es donación, usamos createOrder:
        createOrder={
          !isSubscription
            ? (data, actions) =>
                actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        // value: amount!,
                        value: '1',
                      },
                    },
                  ],
                })
            : undefined
        }
        onApprove={async (data, actions) => {
          if (isSubscription) {
            // data.subscriptionID
            console.log("¡Gracias por suscribirte!");
          } else if (actions.order) {
            
            console.log(`¡Gracias por tu donación!`);
          }
        }}
      />
    </div>
  );
}
