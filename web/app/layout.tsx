import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ClawCraft War Table",
  description: "Warcraft-inspired ClawCraft desktop and web client.",
  icons: {
    icon: "/assets/BTNPeasant-Reforged.webp",
    shortcut: "/assets/BTNPeasant-Reforged.webp",
    apple: "/assets/BTNPeasant-Reforged.webp"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
