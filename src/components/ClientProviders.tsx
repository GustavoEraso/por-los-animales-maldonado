"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider
      options={{
        "clientId": "Af2JgMXUWLy9lG_DONNkVLm_KEQ7X1CfNxN9lfK1VDgyaLdSmCDumjyeLxYt0ZMgW6gxUxo5xH2znUdr",
        currency: "USD",
        vault: true, 
      }}
    >
      {children}
      
    </PayPalScriptProvider>
  );
}
