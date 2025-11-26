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
  SidebarRail,  
  SidebarMenu,
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

  // Handle team switch - only global-admin can switch teams
  const handleTeamClick = React.useCallback((team: any) => {
    if (userData?.role !== "global-admin") return;
    setActiveTeam(team);
    router.push(`?code=${team.name}`, { scroll: false });
  }, [userData?.role, setActiveTeam, router]);

  // Filter teams based on role
  const filteredTeams = React.useMemo(() => {
    if (userData?.role === "global-admin") {
      // Global admin sees ALL teams
      return teams;
    } else if (userData?.role === "admin") {
      // Regular admin only sees their assigned team (based on bookingSetupCode)
      const userBookingSetupCode = userData.currentBookingSetup?.code;
      if (userBookingSetupCode) {
        return teams.filter(team => team.name === userBookingSetupCode);
      }
      return [];
    } else {
      // Customer sees no teams
      return [];
    }
  }, [teams, userData?.role, userData?.currentBookingSetup?.code]);

  // Set active team for regular admin automatically
  React.useEffect(() => {
    if (userData?.role === "admin" && filteredTeams.length > 0 && !activeTeam) {
      const userTeam = filteredTeams[0];
      setActiveTeam(userTeam);
    }
  }, [userData?.role, filteredTeams, activeTeam, setActiveTeam]);

  // Build nav URLs with active team code
  const staticNavWithCode = React.useMemo(() => {
    const code = activeTeam?.name || "";
    return staticNav.map((item) => ({ ...item, url: `${item.url}?code=${code}` }));
  }, [staticNav, activeTeam?.name]);

  // User display info - FIXED: Map global-admin to admin for NavUser compatibility
  const userDisplayInfo = React.useMemo(() => {
    if (!userData) {
      return { name: "Loading...", email: "Loading...", avatar: "/avatars/client.png", role: "customer" as const };
    }
    
    switch (userData.role) {
      case "global-admin":
        return { 
          name: userData.name, 
          email: "Global Administrator", 
          avatar: "/avatars/global-admin.png", 
          role: "admin" as const, 
          staffCode: userData.staffCode 
        };
      case "admin":
        return { 
          name: userData.name, 
          email: "Administrator", 
          avatar: "/avatars/admin.png", 
          role: "admin" as const, 
          staffCode: userData.staffCode 
        };
      default:
        return { 
          name: userData.name, 
          email: userData.email, 
          avatar: "/avatars/client.png", 
          role: "customer" as const 
        };
    }
  }, [userData]);

  // Nav groups - global-admin and admin both get admin navigation
  const navGroups = React.useMemo(() => {
    const isAdmin = userData?.role === "admin" || userData?.role === "global-admin";
    const groups = [{ label: isAdmin ? "Management" : "Booking", items: staticNavWithCode }];
    
    if (dynamicNav.length > 0 && isAdmin) {
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
      
      {/* Header Section - Team Switcher */}
      {userData?.role === "global-admin" || userData?.role === "admin" ? (
        <SidebarHeader className="bg-blue-800 border-b border-blue-700">
          <TeamSwitcher
            teams={filteredTeams}
            activeTeam={activeTeam}
            onTeamSelect={handleTeamClick}
            // Disable team selection for regular admin (locked to single team)
            disabled={userData?.role === "admin"}
          />
        </SidebarHeader>
      ) : (
        // Customer - No team switcher, just system title
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

      {/* Content - Navigation */}
      <SidebarContent className="bg-blue-900">
        <NavMain groups={navGroups} />
      </SidebarContent>

      {/* Footer - User Info */}
      <SidebarFooter className="bg-blue-800 border-t border-blue-700">
        <NavUser user={userDisplayInfo} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}