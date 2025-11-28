"use client";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    role: "admin" | "customer" | "global-admin";
    staffCode?: string;
  };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    const authRes = await fetch("/api/auth/me", { cache: "no-store" });
    const authData = await authRes.json();

    if (!authData.authenticated) {
      router.replace("/signin");
      return;
    }
    // Hard refresh to clear all cached React pages
    window.location.href = "/signin";
  };

  // Display different info based on role
  const displayName = user.role === "admin" && user.staffCode 
    ? `${user.name} (${user.staffCode})`
    : user.name;

  const displayEmail = user.role === "admin" 
    ? "Administrator"
    : user.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-blue-700 data-[state=open]:text-white text-blue-100 hover:bg-blue-700 hover:text-white"
            >
              <Avatar className="h-8 w-8 rounded-lg border-2 border-blue-300">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                  {user.role === "admin" ? "A" : "C"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-white">{displayName}</span>
                <span className="truncate text-xs text-blue-200">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-blue-300" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-blue-800 border-blue-600 text-white"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border-2 border-blue-300">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                    {user.role === "admin" ? "A" : "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-white">{displayName}</span>
                  <span className="truncate text-xs text-blue-200">{displayEmail}</span>
                  <span className="truncate text-xs text-blue-300 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-blue-600" />
            
            <DropdownMenuGroup>
              <Link href="/account">
                <DropdownMenuItem className="text-blue-100 hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white">
                  <BadgeCheck className="text-blue-300" />
                  Account
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-blue-600" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-blue-100 hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white"
            >
              <LogOut className="text-blue-300" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}