import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Por Los Animales Maldonado",
  description: "Pagina web de la organización Por Los Animales Maldonado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${barlow.variable}`}
      >
        <Header/>
        {children}
        <Analytics />
        <Footer />
      </body>
    </html>
  );
}
