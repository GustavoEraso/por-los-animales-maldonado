'use client';
import { PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { ReactNode, useEffect } from "react";

interface PayPalProviderProps {
  children: ReactNode;
  type: "capture" | "subscription";
}

export default function PayPalProvider({ children, type }: PayPalProviderProps) {
  const initialOptions = {
    clientId: "AdP4t3FVaSKsMtWIPJp-k7yfBKf5Ql9YU3fOSd90wvFSVdD5XXOsEMfqZMm3QsJ3NULXMLZcmIdceD0V", // <-- tu nuevo clientId
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
      type: "resetOptions",
      value: {
        clientId: "AdP4t3FVaSKsMtWIPJp-k7yfBKf5Ql9YU3fOSd90wvFSVdD5XXOsEMfqZMm3QsJ3NULXMLZcmIdceD0V",
        components: "buttons",
        currency: "USD",
        intent: type,
        ...(type === "subscription" && { vault: true }),
      },
    } as unknown as import("@paypal/react-paypal-js").ScriptReducerAction);
  }, [type, dispatch]);

  if (!isResolved) {
    return <div>Cargando PayPal...</div>; // pequeño loading mientras carga
  }

  return <>{children}</>;
}
