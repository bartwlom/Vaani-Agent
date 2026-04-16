import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telephony Agent Control",
  description: "AI Telephony Agent Command Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased h-screen w-screen overflow-hidden text-sm sm:text-base">
        <div className="crt-scanlines h-full w-full pointer-events-none fixed inset-0 z-50"></div>
        <div className="scan-effect"></div>
        <main className="relative h-full w-full z-10 p-4 sm:p-8 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
