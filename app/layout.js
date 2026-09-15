"use client";

import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "./LayoutWrapper";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`h-full ${inter.variable}`}>
      <body
        className={`min-h-screen bg-white text-[#0F1B2E] antialiased selection:bg-[#0F1B2E] selection:text-white flex flex-row ${inter.className}`}
      >
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}