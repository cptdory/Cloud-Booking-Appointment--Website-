"use client";

import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "../styles/index.css";
import { usePathname } from "next/navigation";

import { Providers } from "./providers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Routes where sidebar should NOT appear
  const hideSidebar = ["/", "/login", "/signin", "/signup"].includes(pathname);

  return (
    <html suppressHydrationWarning lang="en">
      <head />

      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          {hideSidebar ? (
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
          )}
        </Providers>
      </body>
    </html>
  );
}
