'use client';
import { PayPalScriptProvider, usePayPalScriptReducer, DISPATCH_ACTION } from "@paypal/react-paypal-js";
import { ReactNode, useEffect } from "react";

interface PayPalProviderProps {
  children: ReactNode;
  type: "capture" | "subscription";
}

export default function PayPalProvider({ children, type }: PayPalProviderProps) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', 
    components: "buttons",
    currency: "USD",
    intent: type,
    ...(type === "subscription" && { vault: true }),
  };

  return (
    <PayPalScriptProvider options={initialOptions} deferLoading={true}>
      <PayPalProviderInner type={type}>
        {children}
      </PayPalProviderInner>
    </PayPalScriptProvider>
  );
}

function PayPalProviderInner({ children, type }: { children: ReactNode; type: "capture" | "subscription" }) {
  const [{ isResolved }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
  dispatch({
    type: DISPATCH_ACTION.RESET_OPTIONS,
    value: {
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      components: "buttons",
      currency: "USD",
      intent: type,
      ...(type === "subscription" && { vault: true }),
    },
  });
}, [type, dispatch]);

  if (!isResolved) {
    return <div>Cargando PayPal...</div>; // pequeño loading mientras carga
  }

  return <>{children}</>;
}
