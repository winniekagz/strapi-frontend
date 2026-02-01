// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DEV.BLOG",
  description:
    "Your go-to resource for all things Strapi—explore best practices, tips, and community insights to elevate your projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-color-mode="dark">
      <body
        className={`${inter.variable}  antialiased`}
      >
        <AuthProvider>
          <Suspense>
            <Navbar />
          </Suspense>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
