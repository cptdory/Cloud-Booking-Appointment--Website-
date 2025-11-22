import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import ThemeToggler from "./Header/ThemeToggler"

export function SiteHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-blue-700 bg-blue-800 px-6">
      
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white hover:bg-blue-700 rounded-md p-2 transition-colors" />

        <Separator
          orientation="vertical"
          className="h-6 bg-blue-600"
        />

        <h1 className="text-lg font-semibold text-white">
          CITS - Booking System
        </h1>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <ThemeToggler />
        {/* Future: <UserNav /> <Notifications /> etc. */}
      </div>

    </header>
  )
}
