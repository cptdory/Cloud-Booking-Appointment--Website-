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

export function AppSidebar({ ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCode = searchParams.get("code") || ""; // ⭐ read URL code

  const [teams, setTeams] = React.useState<any[]>([]);
  const [staticNav, setStaticNav] = React.useState<any[]>([]);
  const [dynamicNav, setDynamicNav] = React.useState<any[]>([]);
  const [activeTeam, setActiveTeam] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Load team list only ONCE
  React.useEffect(() => {
    async function loadTeams() {
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

      setStaticNav([
        { title: "Calendar", url: "/calendar", icon: Calendar },
        { title: "Booking Page", url: "/booking", icon: ListCheck },
        { title: "Customer", url: "/customers", icon: Users },
        { title: "Business Information", url: "/business-information", icon: Info },
      ]);

      // If URL has ?code=XYZ → auto-select the team
      if (selectedCode) {
        const found = mappedTeams.find((t) => t.name === selectedCode);
        if (found) {
          setActiveTeam(found);
          loadDynamicNav(found.name);
        }
      } else {
        // Default first team
        if (mappedTeams.length > 0) {
          setActiveTeam(mappedTeams[0]);
          router.replace(`?code=${mappedTeams[0].name}`);
          loadDynamicNav(mappedTeams[0].name);
        }
      }

      setLoading(false);
    }

    loadTeams();
  }, []);

  // Load dynamic parameters
  const loadDynamicNav = async (teamCode: string) => {
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
        icon = Info; // fallback icon
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

  // When user selects a new team
  const handleTeamClick = (team: any) => {
    setActiveTeam(team);

    router.push(`?code=${team.name}`, { scroll: false });

    loadDynamicNav(team.name);
  };

  // Inject ?code= into static nav links
  const staticNavWithCode = staticNav.map((item) => ({
    ...item,
    url: `${item.url}?code=${activeTeam?.name || ""}`,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {!loading && (
          <TeamSwitcher
            teams={teams}
            activeTeam={activeTeam}
            onTeamSelect={handleTeamClick}
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        {!loading && (
          <NavMain
            groups={[
              {
                label: "Management",
                items: staticNavWithCode,
              },
              ...(dynamicNav.length > 0
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

      <SidebarFooter>
        <NavUser
          user={{
            name: activeTeam?.name || "User",
            email: activeTeam?.plan || "Email",
            avatar: "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}