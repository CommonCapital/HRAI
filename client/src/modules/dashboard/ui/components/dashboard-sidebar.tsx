"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BotIcon, FileText, Home, LayoutDashboard, Settings, StarIcon, User, VideoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

const firstSection = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
   
      icon: LayoutDashboard,
      label: "Deck-Analysis",
      href: "/user-contract",
    
  },
   {
      icon: FileText,
      label: "Results",
      href: "/results",
    },
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "AI-Agents",
    href: "/agents",
  },
  {
    icon: User,
    label: "Attendees",
    href: "/attendees",
  },
  
  
];

const secondSection = [
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export const DashboardSidebar = () => {
    const pathname = usePathname();
  return (
    <Sidebar className="bg-radial from-blue-800 to-blue-950 text-sidebar-accent-foreground">
      <SidebarHeader className= "bg-radial from-blue-800 to-blue-950 text-sidebar-accent-foreground ">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image src="/logo.svg" alt="logo" height={250} width={250} />
        </Link>
      </SidebarHeader>
      <div className="bg-radial from-blue-800 to-blue-950 px-4 py-2">
        <Separator className="opacity-1000 text-[#000]" />
      </div>
      <SidebarContent className="bg-radial from-blue-800 to-blue-950">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu >
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                  asChild
                    className={cn(
                      "h-10 hover:bg-liner-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

             <div className="px-4 py-2">
        <Separator className="opacity-1000 text-[#000]" />
      </div>

         <SidebarGroup >
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                  asChild
                    className={cn(
                      "h-10 hover:bg-liner-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className=" bg-radial from-blue-800 to-blue-950 text-white ">
      {/** <DashboardTrial />*/}
        
         <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
