import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "LUME — Casa de Carnes",
  description: "Cardápio da casa: cortes, origem, harmonização e o prato em tamanho real na sua mesa.",
};

export const viewport: Viewport = {
  themeColor: "#0e0c0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
