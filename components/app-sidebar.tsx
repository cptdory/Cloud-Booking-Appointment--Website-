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

  // Safe way to check if user is global admin without type errors
  const isGlobalAdmin = React.useMemo(() => {
    if (!userData) return false;
    
    // Method 1: Check extended properties (safe from type errors)
    const extendedUserData = userData as any;
    if (extendedUserData.role === "global-admin" || extendedUserData.isGlobalAdmin) {
      return true;
    }
    
    // Method 2: Check by email or other identifying property
    if (userData.email === "Global Administrator" || userData.email.includes("global-admin")) {
      return true;
    }
    
    // Method 3: Check by name pattern or other field
    if (userData.name?.includes("Global Admin") || userData.staffCode?.includes("GLOBAL")) {
      return true;
    }
    
    return false;
  }, [userData]);

  const handleTeamClick = React.useCallback((team: any) => {
    if (!userData || !isGlobalAdmin) return;
    setActiveTeam(team);
    router.push(`?code=${team.name}`, { scroll: false });
  }, [userData, isGlobalAdmin, setActiveTeam, router]);

  const filteredTeams = React.useMemo(() => {
    if (!userData) return [];
    
    if (isGlobalAdmin) {
      return teams;
    } else if (userData.role === "admin") {
      const userBookingSetupCode = userData.currentBookingSetup?.code;
      if (userBookingSetupCode) {
        return teams.filter(team => team.name === userBookingSetupCode);
      }
      return [];
    } else {
      return [];
    }
  }, [teams, userData, isGlobalAdmin]);

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

  // User display info
  const userDisplayInfo = React.useMemo(() => {
    if (!userData) {
      return { name: "Loading...", email: "Loading...", avatar: "/avatars/client.png", role: "customer" as const };
    }
    
    if (isGlobalAdmin) {
      return { 
        name: userData.name, 
        email: "Global Administrator", 
        avatar: "/avatars/global-admin.png", 
        role: "admin" as const,
        staffCode: userData.staffCode 
      };
    } else if (userData.role === "admin") {
      return { 
        name: userData.name, 
        email: "Administrator", 
        avatar: "/avatars/admin.png", 
        role: "admin" as const, 
        staffCode: userData.staffCode 
      };
    } else {
      return { 
        name: userData.name, 
        email: userData.email, 
        avatar: "/avatars/client.png", 
        role: "customer" as const 
      };
    }
  }, [userData, isGlobalAdmin]);

  // Nav groups
  const navGroups = React.useMemo(() => {
    if (!userData) {
      return [{ label: "Booking", items: staticNavWithCode }];
    }
    
    const isAdmin = userData.role === "admin" || isGlobalAdmin;
    const groups = [{ label: isAdmin ? "Management" : "Booking", items: staticNavWithCode }];
    
    if (dynamicNav.length > 0 && isAdmin) {
      groups.push({ label: "Booking Parameters", items: dynamicNav });
    }
    
    return groups;
  }, [userData, staticNavWithCode, dynamicNav, isGlobalAdmin]);

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

  const showTeamSwitcher = userData && (isGlobalAdmin || userData.role === "admin");

  return (
    <Sidebar collapsible="icon" className="bg-blue-900 border-blue-700 text-white" {...props}>
      
      {/* Header Section - Team Switcher */}
      {showTeamSwitcher ? (
        <SidebarHeader className="bg-blue-800 border-b border-blue-700">
          <TeamSwitcher
            teams={filteredTeams}
            activeTeam={activeTeam}
            onTeamSelect={handleTeamClick}
            // Disable team selection for regular admin (locked to single team)
            disabled={userData?.role === "admin" && !isGlobalAdmin}
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