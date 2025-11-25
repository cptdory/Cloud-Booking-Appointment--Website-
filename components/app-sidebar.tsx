"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }) {
  const router = useRouter();

  // Get everything from store
  const { 
    userData, 
    teams, 
    activeTeam, 
    staticNav, 
    dynamicNav, 
    loading, 
    initialized,
    initialize, 
    setActiveTeam 
  } = useSidebarStore();

  // Initialize on mount
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync URL once after init
  const hasSyncedUrl = React.useRef(false);
  React.useEffect(() => {
    if (!initialized || !activeTeam || loading || hasSyncedUrl.current) return;
    hasSyncedUrl.current = true;
    
    const currentCode = new URLSearchParams(window.location.search).get("code");
    if (!currentCode) {
      router.replace(`?code=${activeTeam.name}`, { scroll: false });
    }
  }, [initialized, activeTeam, loading, router]);

  // Handle team switch
  const handleTeamClick = React.useCallback((team: any) => {
    if (userData?.role !== "admin") return;
    setActiveTeam(team);
    router.push(`?code=${team.name}`, { scroll: false });
  }, [userData?.role, setActiveTeam, router]);

  // Build nav URLs with active team code
  const staticNavWithCode = React.useMemo(() => {
    const code = activeTeam?.name || "";
    return staticNav.map((item) => ({ ...item, url: `${item.url}?code=${code}` }));
  }, [staticNav, activeTeam?.name]);

  // User display info
  const userDisplayInfo = React.useMemo(() => {
    if (!userData) {
      return { name: "Loading...", email: "Loading...", avatar: "/avatars/client.png", role: "customer" as const };
    }
    return userData.role === "admin"
      ? { name: userData.name, email: "Administrator", avatar: "/avatars/admin.png", role: "admin" as const, staffCode: userData.staffCode }
      : { name: userData.name, email: userData.email, avatar: "/avatars/client.png", role: "customer" as const };
  }, [userData]);

  // Nav groups
  const navGroups = React.useMemo(() => {
    const groups = [{ label: userData?.role === "admin" ? "Management" : "Booking", items: staticNavWithCode }];
    if (dynamicNav.length > 0 && userData?.role === "admin") {
      groups.push({ label: "Booking Parameters", items: dynamicNav });
    }
    return groups;
  }, [userData?.role, staticNavWithCode, dynamicNav]);

  // Don't render until initialized
  if (loading) {
    return (
      <Sidebar collapsible="icon" className="bg-blue-900 border-blue-700 text-white" {...props}>
        <SidebarContent className="bg-blue-900 flex items-center justify-center">
          <div className="animate-pulse text-blue-300">Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

return (
  <Sidebar collapsible="icon" className="bg-blue-900 border-blue-700 text-white" {...props}>
    
    {/* Header Section */}
    {userData?.role === "admin" ? (
      <SidebarHeader className="bg-blue-800 border-b border-blue-700">
        <TeamSwitcher
          teams={teams}
          activeTeam={activeTeam}
          onTeamSelect={handleTeamClick}
        />
      </SidebarHeader>
    ) : (
      <SidebarHeader className="bg-blue-800 border-b border-blue-700">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <span className="!size-5" />
                <span className="text-base font-semibold">Booking System</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    )}

    {/* Content */}
    <SidebarContent className="bg-blue-900">
      <NavMain groups={navGroups} />
    </SidebarContent>

    {/* Footer */}
    <SidebarFooter className="bg-blue-800 border-t border-blue-700">
      <NavUser user={userDisplayInfo} />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
);

}