import type { Metadata } from "next";
import { NavRefresh } from "@/components/nav-refresh";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sileo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bookufy",
  description: "Bookufy makes booking effortless. Customers can schedule appointments in seconds while businesses stay organized with a clear, real-time view of their calendar, services, and client activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
            <NavRefresh />
            <div style={{ position: "relative", zIndex: 9999 }}>
              <Toaster position="top-center" />
            </div>
            {children}
      </body>
    </html>
  );
}
