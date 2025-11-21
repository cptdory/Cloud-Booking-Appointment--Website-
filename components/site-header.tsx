import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-blue-700 bg-blue-800 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-3 px-6"> {/* Increased padding and gap */}
        <SidebarTrigger className="text-white hover:bg-blue-700 rounded-md p-2 transition-colors" />
        <Separator
          orientation="vertical"
          className="h-6 bg-blue-600"
        />
        {/* Optional: Add page title or breadcrumbs */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white">CITS - Booking System</h1>
        </div>
      </div>
    </header>
  )
}