"use client";

import * as React from "react";
import {
  Calendar,
  Building2,
  UsersIcon,
  ListCheckIcon,
  BriefcaseBusiness,
  UserRound,
  HelpCircle,
} from "lucide-react";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
} from "@/components/ui/sidebar";

type BookingParameter = { BookingParameterCode: string; BookingParameterId: string };
type BookingSetup = { BookingParameter: BookingParameter[] };
type BookingSetupOption = { Code: string; Description: string; Location?: string };
type SessionUser = {
  name: string;
  email: string;
  role: string;
  booking_setup_code: string;
  tenant_id: string;
  is_admin?: boolean;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  bookingParameters?: BookingSetup[];
  bookingSetups?: BookingSetupOption[];
  sessionUser?: SessionUser | null;
};

export function AppSidebar({
  bookingParameters = [],
  bookingSetups = [],
  sessionUser,
  ...props
}: AppSidebarProps) {
  const isCustomerRole = sessionUser?.role === "customer";

  const getBookingParameterIcon = (code: string) => {
    switch (code.trim().toUpperCase()) {
      case "SERVICES":
        return <BriefcaseBusiness />;
      case "STAFF":
        return <UserRound />;
      default:
        return <HelpCircle />;
    }
  };

  const canSwitchTeam = sessionUser?.is_admin === true && sessionUser?.role === "user";

  const management = !isCustomerRole
    ? [
      { name: "Calendar", url: "/calendar", icon: <Calendar /> },
      { name: "Book Now", url: "/book-now", icon: <ListCheckIcon /> },
      { name: "Customer", url: "/customer", icon: <UsersIcon /> },
    ]
    : [
      { name: "Appointment", url: "/appointment", icon: <Calendar /> },
      { name: "Book Now", url: "/book-now", icon: <ListCheckIcon /> },
    ];

  const bookingParams =
    bookingParameters?.[0]?.BookingParameter
      ?.slice(0, 2)
      .map((p) => ({
        name: p.BookingParameterCode,
        url: `/booking-parameter/${p.BookingParameterId}`,
        icon: getBookingParameterIcon(p.BookingParameterCode),
      })) ?? [];

  const visibleBookingParams = isCustomerRole ? [] : bookingParams;

  const teams = bookingSetups.length > 0
    ? bookingSetups.map((setup) => ({
      name: "Squadlethics",
      description: setup.Description,
      logo: <Building2 />,
      code: setup.Code,
    }))
    : [
      {
        name: "Squadlethics",
        logo: <Building2 />,
        ...(isCustomerRole ? {} : { description: "Ortigas" }),
        code: sessionUser?.booking_setup_code ?? "MAIN",
      },
    ];

  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          defaultTeamCode={sessionUser?.booking_setup_code}
          disabled={!canSwitchTeam}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavProjects label="Management" projects={management} />
        {!isCustomerRole && (
          <NavProjects label="Operation" projects={visibleBookingParams} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            tenant_id: sessionUser?.tenant_id ?? "",
            name: sessionUser?.name ?? "...",
            email: sessionUser?.email ?? "",
            avatar: "",
            role: sessionUser?.role,
            booking_setup_code: sessionUser?.booking_setup_code,
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
