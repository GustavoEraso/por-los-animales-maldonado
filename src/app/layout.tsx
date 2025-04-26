import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next";
import {  Roboto } from "next/font/google";
import "./globals.css";

import ClientProviders from "@/components/ClientProviders"; // componente cliente que incluye el PayPalScriptProvider

import Header from "@/components/Header";
import Footer from "@/components/Footer";


const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});



export const metadata: Metadata = {
  title: "Por Los Animales Maldonado",
  description: "Somos un grupo de particulares que ayuda a animales en situación de calle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` antialiased  ${roboto.variable}`}
      >
        <ClientProviders>
        <Header/>
        {children}
        <Analytics />
        <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
