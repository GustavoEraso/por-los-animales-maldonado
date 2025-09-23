'use client';
import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';

/**
 * PayPal donation button component that handles donation payments and redirects to thank you page.
 * This component requires the PaypalProvider wrapper to function properly.
 *
 * @param {Object} props - Component props
 * @param {number} props.amount - Donation amount in USD
 * @returns {React.ReactElement} PayPal donation button with styled container
 *
 * @requires PaypalProvider - Must be wrapped in PaypalProvider component from @/components/PaypalProvider
 *
 * @example
 * ```tsx
 * // Required wrapper with PaypalProvider
 * import PaypalProvider from '@/components/PaypalProvider';
 * import DonationButton from '@/elements/PayPalDonationButton';
 *
 * // Single donation button
 * <PaypalProvider type="capture">
 *   <DonationButton amount={10} />
 * </PaypalProvider>
 *
 * // Multiple donation options
 * <PaypalProvider type="capture">
 *   <div className="grid grid-cols-2 gap-4">
 *     <DonationButton amount={5} />
 *     <DonationButton amount={10} />
 *     <DonationButton amount={25} />
 *     <DonationButton amount={50} />
 *   </div>
 * </PaypalProvider>
 *
 * // Layout example with PaypalProvider at app level
 * // In your layout.tsx or page component:
 * <PaypalProvider type="capture">
 *   <section className="donation-section">
 *     <h2>Apoyá nuestra causa</h2>
 *     <div className="flex flex-wrap gap-4 justify-center">
 *       <DonationButton amount={10} />
 *       <DonationButton amount={25} />
 *       <DonationButton amount={50} />
 *     </div>
 *   </section>
 * </PaypalProvider>
 * ```
 *
 * @note The PaypalProvider initializes the PayPal SDK and provides the necessary context
 * for PayPal buttons to function. Without this provider, the component will not work.
 */
export default function DonationButton({ amount }: { amount: number }): React.ReactElement {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-row gap-4 sm:gap-0 sm:flex-col items-center justify-center w-full h-full p-2 bg-blue-50 rounded-lg shadow-md">
        <h4 className="text-center text-balance">Doná USD {amount}</h4>

        <PayPalButtons
          fundingSource="paypal"
          style={{
            layout: 'horizontal',
            color: 'blue',
            shape: 'rect',
            label: 'donate',
            height: 40,
          }}
          createOrder={(data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: 'USD',
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

            // Attempt to extract name from payment details
            const givenName =
              details.payment_source?.paypal?.name?.given_name ??
              details.payer?.name?.given_name ??
              'amigo';

            // Extract amount and currency from capture
            const captureInfo = details.purchase_units?.[0]?.payments?.captures?.[0];
            const capturedValue = captureInfo?.amount?.value ?? '';
            const capturedCurrency = captureInfo?.amount?.currency_code ?? '';

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
