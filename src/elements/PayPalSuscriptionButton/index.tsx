'use client';
import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';

/**
 * PayPal subscription button component that handles recurring payment subscriptions.
 * This component requires the PaypalProvider wrapper with type="subscription" to function properly.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Subscription amount label to display (e.g., "10/mes", "25/mes")
 * @param {string} props.planId - PayPal subscription plan ID created in PayPal dashboard
 * @returns {React.ReactElement} PayPal subscription button with styled container
 *
 * @requires PaypalProvider - Must be wrapped in PaypalProvider component with type="subscription"
 *
 * @example
 * ```tsx
 * // Required wrapper with PaypalProvider for subscriptions
 * import PaypalProvider from '@/components/PaypalProvider';
 * import SubscriptionButton from '@/elements/PayPalSuscriptionButton';
 *
 * // Single subscription button
 * <PaypalProvider type="subscription">
 *   <SubscriptionButton label="10/mes" planId="P-12345MONTHLY" />
 * </PaypalProvider>
 *
 * // Multiple subscription options
 * <PaypalProvider type="subscription">
 *   <div className="grid grid-cols-2 gap-4">
 *     <SubscriptionButton label="5/mes" planId="P-5USD-MONTHLY" />
 *     <SubscriptionButton label="10/mes" planId="P-10USD-MONTHLY" />
 *     <SubscriptionButton label="25/mes" planId="P-25USD-MONTHLY" />
 *     <SubscriptionButton label="50/mes" planId="P-50USD-MONTHLY" />
 *   </div>
 * </PaypalProvider>
 *
 * // Layout example with PaypalProvider at page level
 * <PaypalProvider type="subscription">
 *   <section className="subscription-section">
 *     <h2>Suscribite y apoyá mensualmente</h2>
 *     <div className="flex flex-wrap gap-4 justify-center">
 *       <SubscriptionButton label="10/mes" planId="P-10USD-MONTHLY" />
 *       <SubscriptionButton label="25/mes" planId="P-25USD-MONTHLY" />
 *     </div>
 *   </section>
 * </PaypalProvider>
 * ```
 *
 * @note The PaypalProvider with type="subscription" initializes the PayPal SDK for recurring payments.
 * Plan IDs must be created in the PayPal Developer Dashboard before using this component.
 */
export default function SubscriptionButton({
  label,
  planId,
}: {
  label: string;
  planId: string;
}): React.ReactElement {
  const [{ isPending }] = usePayPalScriptReducer();
  const router = useRouter();

  return (
    <>
      <div className="flex flex-row gap-4 sm:gap-0 sm:flex-col items-center justify-center w-full h-full p-2 bg-blue-50 rounded-lg shadow-md z-0">
        <h4 className="text-center text-balance">Suscribite por USD {label}</h4>

        {isPending && <div>Cargando boton de suscripción...</div>}
        <PayPalButtons
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              plan_id: planId, // PayPal subscription plan ID
            });
          }}
          style={{
            layout: 'horizontal',
            color: 'blue',
            shape: 'rect',
            label: 'subscribe',
            height: 40,
          }}
          onApprove={async () => {
            router.push(`/gracias?type=suscription&amount=${encodeURIComponent(label)} `);
          }}
        />
      </div>
    </>
  );
}
