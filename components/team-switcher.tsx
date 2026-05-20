"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, Settings2 } from "lucide-react"
import Link from "next/link"
export function TeamSwitcher({
  teams,
  defaultTeamCode,
  disabled,
  showDescription = true,
}: {
  teams: {
    name: string
    logo: React.ReactNode
    description?: string
    code: string
  }[]
  defaultTeamCode?: string
  disabled?: boolean
  showDescription?: boolean
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  React.useEffect(() => {
    const storageKey = "selectedBookingSetupCode"
    if (!teams?.length) return

    const storedCode = window.localStorage.getItem(storageKey)
    const initialCode = storedCode ?? defaultTeamCode ?? teams[0]?.code
    const initialTeam = teams.find((team) => team.code === initialCode) ?? teams[0]

    setActiveTeam(initialTeam)
  }, [teams, defaultTeamCode])

  const handleTeamSelect = (team: {
    name: string
    logo: React.ReactNode
    description?: string
    code: string
  }) => {
    const storageKey = "selectedBookingSetupCode"
    window.localStorage.setItem(storageKey, team.code)
    setActiveTeam(team)
  }

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled}
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {activeTeam.logo}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              {showDescription && activeTeam.description ? (
                <span className="truncate text-xs">{activeTeam.description}</span>
              ) : null}
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Branches
              </DropdownMenuLabel>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.code}
                  onClick={() => handleTeamSelect(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    {team.logo}
                  </div>
                  {team.description}
                  <DropdownMenuShortcut>
                    <Link href="/settings" title="Settings">
                      <Settings2 />
                    </Link>
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => alert("Creating new branch is under development")}
                className="gap-2 p-2 text-slate-500 italic"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-slate-300">
                  +
                </div>
                Create new branch
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
