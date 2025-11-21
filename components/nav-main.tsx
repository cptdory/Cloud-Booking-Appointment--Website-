"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  groups,
}: {
  groups: {
    label: string;
    items: {
      title: string;
      url: string;
      icon?: LucideIcon;
      items?: { title: string; url: string }[];
    }[];
  }[];
}) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="border-blue-700">
          <SidebarGroupLabel className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
            {group.label}
          </SidebarGroupLabel>

          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className="text-blue-100 hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white data-[state=open]:bg-blue-700 data-[state=open]:text-white"
                >
                  <a href={item.url}>
                    {item.icon && <item.icon className="text-blue-300" />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>

                {item.items && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className="text-blue-100 hover:bg-blue-700 hover:text-white"
                        >
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}