"use client";

import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "../styles/index.css";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { Providers } from "./providers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideSidebar = ["/", "/login", "/signin", "/signup"].includes(pathname);

  return hideSidebar ? (
    <>
      {children}
      <ScrollToTop />
    </>
  ) : (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
        <ScrollToTop />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <Suspense fallback={null}>
            <LayoutContent>{children}</LayoutContent>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
