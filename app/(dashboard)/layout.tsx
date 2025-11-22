"use client";

import ScrollToTop from "@/components/ScrollToTop";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <ScrollToTop />
      </SidebarInset>
    </SidebarProvider>
  );
}