"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
  activeTeam,
  onTeamSelect,
}: {
  teams: { name: string; logo: React.ElementType; plan: string }[];
  activeTeam: any;
  onTeamSelect: (team: any) => void;
}) {
  const { isMobile, state } = useSidebar();

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-blue-700 data-[state=open]:text-white text-blue-100 hover:bg-blue-700 hover:text-white"
            >
              {/* Logo container that works in both expanded and collapsed states */}
              <div className={`bg-blue-600 flex items-center justify-center rounded-lg ${
                state === "collapsed" ? "size-8 mx-auto" : "size-8"
              }`}>
                <activeTeam.logo className="size-4 text-white" />
              </div>

              {/* Text content that hides when collapsed */}
              <div className={`grid flex-1 text-left text-sm leading-tight ${
                state === "collapsed" ? "hidden" : "block"
              }`}>
                <span className="truncate font-medium text-white">{activeTeam.name}</span>
                <span className="truncate text-xs text-blue-200">{activeTeam.plan}</span>
              </div>

              {/* Chevron that hides when collapsed */}
              <ChevronsUpDown className={`text-blue-300 ${
                state === "collapsed" ? "hidden" : "ml-auto"
              }`} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            className="min-w-56 rounded-lg bg-blue-800 border-blue-600 text-white"
          >
            <DropdownMenuLabel className="text-xs text-blue-300">
              Branches
            </DropdownMenuLabel>

            {teams.map((team) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => onTeamSelect(team)}
                className="gap-2 p-2 text-blue-100 hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-blue-400 bg-blue-600">
                  <team.logo className="size-3.5 text-white" />
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}