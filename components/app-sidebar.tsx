"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Users, Info, ListCheck, Building, BedDouble, BriefcaseBusiness, ContactRound, Clock } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface BookingSetup {
  Code: string;
  Description: string;
}

interface UserData {
  role: "admin" | "customer";
  name: string;
  email: string;
  staffCode?: string;
  customerNo?: string;
  currentBookingSetup?: {
    code: string;
    parameterId: number;
    parameterValueId: number;
  };
}

export function AppSidebar({ ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCode = searchParams.get("code") || "";

  const [teams, setTeams] = React.useState<any[]>([]);
  const [staticNav, setStaticNav] = React.useState<any[]>([]);
  const [dynamicNav, setDynamicNav] = React.useState<any[]>([]);
  const [activeTeam, setActiveTeam] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<UserData | null>(null);

  // Load user data and teams
  React.useEffect(() => {
    async function loadInitialData() {
      try {
        // Get user data from session
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        
        if (userData.authenticated && userData.user) {
          setUserData({
            role: userData.user.role,
            name: userData.user.name,
            email: userData.user.email,
            staffCode: userData.user.staffCode,
            customerNo: userData.user.customerNo,
            currentBookingSetup: userData.user.currentBookingSetup
          });
        }

        // Load teams only for admin users or users who can switch teams
        if (userData.authenticated && userData.user.role === "admin") {
          await loadTeams(userData.user);
        } else {
          // For customers, set minimal navigation
          setStaticNav([
            { title: "Booking Page", url: "/booking", icon: ListCheck },
          ]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Load teams for admin users
  const loadTeams = async (user: any) => {
    const res = await fetch("/api/get-booking-setup-list");
    const json = await res.json();

    let setups: BookingSetup[] = [];
    if (typeof json.value === "string") setups = JSON.parse(json.value);
    else setups = json.value;

    const mappedTeams = setups.map((s) => ({
      name: s.Code,
      logo: Building,
      plan: s.Description,
    }));

    setTeams(mappedTeams);

    // Set navigation based on user type and permissions
    const userStaticNav = [
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Booking Page", url: "/booking", icon: ListCheck },
      { title: "Customer", url: "/customers", icon: Users },
      { title: "Business Information", url: "/business-information", icon: Info },
    ];

    setStaticNav(userStaticNav);

    // Determine active team based on user type and URL
    if (user.role === "admin") {
      // Check if user has a specific team context from login
      const hasSpecificTeamContext = user.currentBookingSetup && 
        user.currentBookingSetup.code !== "" && 
        user.currentBookingSetup.parameterId !== 0;

      if (hasSpecificTeamContext) {
        // Admin with specific team context - use that team
        const userTeam = mappedTeams.find(t => t.name === user.currentBookingSetup.code);
        if (userTeam) {
          setActiveTeam(userTeam);
          router.replace(`?code=${userTeam.name}`);
          await loadDynamicNav(userTeam.name);
        }
      } else if (selectedCode) {
        // URL has specific code
        const found = mappedTeams.find((t) => t.name === selectedCode);
        if (found) {
          setActiveTeam(found);
          await loadDynamicNav(found.name);
        }
      } else {
        // Full admin - can choose any team, default to first
        if (mappedTeams.length > 0) {
          setActiveTeam(mappedTeams[0]);
          router.replace(`?code=${mappedTeams[0].name}`);
          await loadDynamicNav(mappedTeams[0].name);
        }
      }
    }

    setLoading(false);
  };

  // Load dynamic parameters
  const loadDynamicNav = async (teamCode: string) => {
    if (userData?.role !== "admin") return;

    const res = await fetch(`/api/get-booking-setup?code=${teamCode}`);
    const json = await res.json();
    if (!json.value || json.value.length === 0) return;

    const setupData = json.value[0];
    const params = setupData.BookingParameter;
    const businessHours = setupData.BookingBusinessHours || [];

    // Create parameter navigation items
    const parameterNav = params.map((p: any) => {
      const lower = p.BookingParameterCode.toLowerCase();

      // Choose icon based on parameter code
      let icon;
      if (lower.includes("staff")) {
        icon = ContactRound; 
      } else if (lower.includes("bed")) {
         icon = BedDouble; 
      } else if (lower.includes("service")) {
        icon = BriefcaseBusiness; 
      } else {
        icon = Info;
      }

      return {
        title: p.BookingParameterCode,
        url: `/${lower}?code=${teamCode}&parameter_id=${p.BookingParameterId}`,
        icon: icon,
      };
    });

    // Add Business Hours to dynamic nav if not empty
    if (businessHours.length > 0) {
      parameterNav.push({
        title: "Business Hours",
        url: `/business-hours?code=${teamCode}`,
        icon: Clock,
      });
    }

    setDynamicNav(parameterNav);
  };

  // When user selects a new team (admin only)
  const handleTeamClick = (team: any) => {
    if (userData?.role !== "admin") return;

    setActiveTeam(team);
    router.push(`?code=${team.name}`, { scroll: false });
    loadDynamicNav(team.name);
  };

  // Prepare navigation with code parameter
  const staticNavWithCode = staticNav.map((item) => ({
    ...item,
    url: `${item.url}?code=${activeTeam?.name || selectedCode || ""}`,
  }));

  // Determine user display info
  const getUserDisplayInfo = () => {
    if (!userData) {
      return {
        name: "Loading...",
        email: "Loading...",
        avatar: "/avatars/shadcn.jpg",
        role: "customer" as const
      };
    }

    if (userData.role === "admin") {
      return {
        name: userData.name,
        email: "Administrator",
        avatar: "/avatars/shadcn.jpg",
        role: "admin" as const,
        staffCode: userData.staffCode
      };
    } else {
      return {
        name: userData.name,
        email: userData.email,
        avatar: "/avatars/shadcn.jpg",
        role: "customer" as const
      };
    }
  };

  const userDisplayInfo = getUserDisplayInfo();

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-blue-900 border-blue-700 text-white"
      {...props}
    >
      {/* Show team switcher only for admin users */}
      {userData?.role === "admin" && (
        <SidebarHeader className="bg-blue-800 border-b border-blue-700">
          {!loading && (
            <TeamSwitcher
              teams={teams}
              activeTeam={activeTeam}
              onTeamSelect={handleTeamClick}
            />
          )}
        </SidebarHeader>
      )}

      <SidebarContent className="bg-blue-900">
        {!loading && (
          <NavMain
            groups={[
              {
                label: userData?.role === "admin" ? "Management" : "Booking",
                items: staticNavWithCode,
              },
              ...(dynamicNav.length > 0 && userData?.role === "admin"
                ? [
                    {
                      label: "Booking Parameters",
                      items: dynamicNav,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="bg-blue-800 border-t border-blue-700">
        <NavUser user={userDisplayInfo} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}