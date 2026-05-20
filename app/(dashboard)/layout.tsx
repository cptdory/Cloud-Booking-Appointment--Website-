import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getBookingParameters() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/booking-branch-setup/get-booking-setup`,
      { cache: "no-store", headers: { Cookie: cookieHeader } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch booking parameters:", err);
    return [];
  }
}

async function getBookingSetupList() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/booking-branch-setup/get-booking-setup-list`,
      { cache: "no-store", headers: { Cookie: cookieHeader } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch booking setup list:", err);
    return [];
  }
}

async function getSession() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/me`,
      { cache: "no-store", headers: { Cookie: cookieHeader } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch (err) {
    console.error("Failed to fetch session:", err);
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bookingParameters, bookingSetupList, sessionUser] = await Promise.all([
    getBookingParameters(),
    getBookingSetupList(),
    getSession(),
  ]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          bookingParameters={bookingParameters}
          bookingSetups={bookingSetupList}
          sessionUser={sessionUser}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarProvider>
  );
}
