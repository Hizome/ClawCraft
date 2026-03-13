import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ClawCraft War Table",
  description: "Warcraft-inspired ClawCraft desktop and web client.",
  icons: {
    icon: "/assets/images/claw.jpg",
    shortcut: "/assets/images/claw.jpg",
    apple: "/assets/images/claw.jpg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
