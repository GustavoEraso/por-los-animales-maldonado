'use client';
import React from 'react';
import {
  PayPalScriptProvider,
  usePayPalScriptReducer,
  DISPATCH_ACTION,
} from '@paypal/react-paypal-js';
import { ReactNode, useEffect } from 'react';

/**
 * Props for the PayPalProvider component.
 */
interface PayPalProviderProps {
  /** Child components to be wrapped with PayPal functionality */
  children: ReactNode;
  /** Type of PayPal transaction - capture for one-time payments, subscription for recurring */
  type: 'capture' | 'subscription';
}

/**
 * PayPal provider component that wraps children with PayPal script functionality.
 *
 * Provides PayPal SDK integration for the application, supporting both one-time
 * payments (capture) and recurring payments (subscription). Handles PayPal script
 * loading with deferred loading for better performance and automatic configuration
 * based on transaction type.
 *
 * @param {PayPalProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped with PayPal functionality
 * @param {"capture" | "subscription"} props.type - Type of PayPal transaction
 * @returns {React.ReactElement} The rendered PayPal provider component
 *
 * @example
 * // For one-time donations using PayPalDonationButton
 * import PayPalProvider from '@/components/PaypalProvider';
 * import PayPalDonationButton from '@/elements/PayPalDonationButton';
 *
 * <PayPalProvider type="capture">
 *   <PayPalDonationButton amount={25} />
 * </PayPalProvider>
 *
 * @example
 * // For recurring subscriptions using PayPalSuscripcionButton
 * import PayPalProvider from '@/components/PaypalProvider';
 * import PayPalSuscripcionButton from '@/elements/PayPalSuscripcionButton';
 *
 * <PayPalProvider type="subscription">
 *   <PayPalSuscripcionButton planId="P-12345" />
 * </PayPalProvider>
 *
 * @example
 * // Multiple donation amounts with capture type
 * import PayPalProvider from '@/components/PaypalProvider';
 * import PayPalDonationButton from '@/elements/PayPalDonationButton';
 *
 * <PayPalProvider type="capture">
 *   <div className="grid grid-cols-2 gap-4">
 *     <PayPalDonationButton amount={10} />
 *     <PayPalDonationButton amount={25} />
 *     <PayPalDonationButton amount={50} />
 *     <PayPalDonationButton amount={100} />
 *   </div>
 * </PayPalProvider>
 */
export default function PayPalProvider({
  children,
  type,
}: PayPalProviderProps): React.ReactElement {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    components: 'buttons',
    currency: 'USD',
    intent: type,
    ...(type === 'subscription' && { vault: true }),
  };

  return (
    <PayPalScriptProvider options={initialOptions} deferLoading={true}>
      <PayPalProviderInner type={type}>{children}</PayPalProviderInner>
    </PayPalScriptProvider>
  );
}

/**
 * Inner PayPal provider component that handles script loading and configuration.
 *
 * Manages the PayPal script state and handles dynamic option updates when the
 * transaction type changes. Shows a loading state while PayPal script is being
 * loaded and resolved.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render after PayPal loads
 * @param {"capture" | "subscription"} props.type - Type of PayPal transaction
 * @returns {React.ReactElement} The rendered inner provider or loading state
 */
function PayPalProviderInner({
  children,
  type,
}: {
  children: ReactNode;
  type: 'capture' | 'subscription';
}): React.ReactElement {
  const [{ isResolved }, dispatch] = usePayPalScriptReducer();

  // Update PayPal options when transaction type changes
  useEffect(() => {
    dispatch({
      type: DISPATCH_ACTION.RESET_OPTIONS,
      value: {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        components: 'buttons',
        currency: 'USD',
        intent: type,
        ...(type === 'subscription' && { vault: true }),
      },
    });
  }, [type, dispatch]);

  // Show loading state while PayPal script is loading
  if (!isResolved) {
    return <div>Cargando PayPal...</div>;
  }

  return <>{children}</>;
}
