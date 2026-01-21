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

  // Only subscribe to specific fields we need (prevents re-renders on unrelated changes)
  const userData = useSidebarStore((state) => state.userData);
  const teams = useSidebarStore((state) => state.teams);
  const activeTeam = useSidebarStore((state) => state.activeTeam);
  const staticNav = useSidebarStore((state) => state.staticNav);
  const dynamicNav = useSidebarStore((state) => state.dynamicNav);
  const loading = useSidebarStore((state) => state.loading);
  const initialized = useSidebarStore((state) => state.initialized);
  const initialize = useSidebarStore((state) => state.initialize);
  const setActiveTeam = useSidebarStore((state) => state.setActiveTeam);

  // Initialize on mount only
  React.useEffect(() => {
    const initAsync = async () => {
      await initialize();
    };
    initAsync();
  }, []); // Empty dependency array - only run once on mount

  // Sync URL once after init - separate effect to avoid stale closures
  const urlSyncRef = React.useRef(false);
  React.useEffect(() => {
    if (loading || !initialized || !activeTeam || urlSyncRef.current) return;
    urlSyncRef.current = true;

    const currentCode = new URLSearchParams(window.location.search).get("code");
    if (!currentCode) {
      router.replace(`?code=${activeTeam.name}`, { scroll: false });
    }
  }, [initialized, loading, activeTeam, router]); // Only dependencies that actually matter

  // Memoize role check to avoid recalculation
  const isGlobalAdmin = React.useMemo(() => {
    if (!userData) return false;
    return userData.role === "admin";
  }, [userData?.role]); // Only depend on role, not entire userData object

  // Memoize team filtering
  const filteredTeams = React.useMemo(() => {
    if (!userData) return [];
    
    if (isGlobalAdmin) {
      return teams;
    } else if (userData.role === "user") {
      const userBookingSetupCode = userData.currentBookingSetup?.code;
      return userBookingSetupCode 
        ? teams.filter(team => team.name === userBookingSetupCode)
        : [];
    }
    return [];
  }, [teams, userData?.role, userData?.currentBookingSetup?.code, isGlobalAdmin]);

  // Handle team click - memoized
  const handleTeamClick = React.useCallback((team: any) => {
    if (!userData || !isGlobalAdmin) return;
    setActiveTeam(team);
    router.push(`?code=${team.name}`, { scroll: false });
  }, [userData, isGlobalAdmin, setActiveTeam, router]);

  // Memoize static nav with code
  const staticNavWithCode = React.useMemo(() => {
    if (!activeTeam?.name) return staticNav;
    return staticNav.map((item) => ({ ...item, url: `${item.url}?code=${activeTeam.name}` }));
  }, [staticNav, activeTeam?.name]);

  // Memoize user display info - only recalculate when needed
  const userDisplayInfo = React.useMemo(() => {
    if (!userData) {
      return { name: "Loading...", email: "Loading...", avatar: "/avatars/client.png", role: "customer" as const };
    }
    
    if (isGlobalAdmin) {
      return { 
        name: userData.name, 
        email: userData.email, 
        avatar: "/avatars/admin.png", 
        role: "admin" as const,
        staffCode: userData.staffCode 
      };
    } else if (userData.role === "user") {
      return { 
        name: userData.name, 
        email: userData.email, 
        avatar: "/avatars/admin.png", 
        role: "user" as const, 
        staffCode: userData.staffCode 
      };
    }
    
    return { 
      name: userData.name, 
      email: userData.email, 
      avatar: "/avatars/client.png", 
      role: "customer" as const 
    };
  }, [userData?.name, userData?.email, userData?.role, userData?.staffCode, isGlobalAdmin]);

  // Memoize nav groups
  const navGroups = React.useMemo(() => {
    if (!userData) {
      return [{ label: "Booking", items: staticNavWithCode }];
    }
    
    const isUser = userData.role === "user" || isGlobalAdmin;
    const groups = [{ label: isUser ? "Management" : "Booking", items: staticNavWithCode }];
    
    if (dynamicNav.length > 0 && isUser) {
      groups.push({ label: "Booking Parameters", items: dynamicNav });
    }
    
    return groups;
  }, [userData?.role, isGlobalAdmin, staticNavWithCode, dynamicNav]);

  // Loading state
  if (loading) {
    return (
      <Sidebar collapsible="icon" className="bg-blue-900 border-blue-700 text-white" {...props}>
        <SidebarContent className="bg-blue-900 flex items-center justify-center">
          <div className="animate-pulse text-blue-300">Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const showTeamSwitcher = userData && (isGlobalAdmin || userData.role === "user");

  return (
    <Sidebar collapsible="icon" className="bg-blue-900 border-blue-700 text-white" {...props}>
      
      {showTeamSwitcher ? (
        <SidebarHeader className="bg-blue-800 border-b border-blue-700">
          <TeamSwitcher
            teams={filteredTeams}
            activeTeam={activeTeam}
            onTeamSelect={handleTeamClick}
            disabled={userData?.role === "user" && !isGlobalAdmin}
          />
        </SidebarHeader>
      ) : (
        <SidebarHeader className="bg-blue-800 border-b border-blue-700">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                <a href="#">
                  <span className="!size-5" />
                  <span className="text-base font-semibold">Booking System</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      )}

      <SidebarContent className="bg-blue-900">
        <NavMain groups={navGroups} />
      </SidebarContent>

      <SidebarFooter className="bg-blue-800 border-t border-blue-700">
        <NavUser user={userDisplayInfo} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}