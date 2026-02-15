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
import { BotIcon, File, FileText, Home, LayoutDashboard, Settings, StarIcon, User, VideoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

// HRAI Logo Component - Brutalist Geometric Design
const HRAILogo = ({ size = 40 }: { size?: number }) => {
  return (
    <div className="flex items-center gap-3">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer frame - represents structure */}
        <rect 
          x="2" 
          y="2" 
          width="36" 
          height="36" 
          stroke="#FF6A00" 
          strokeWidth="2"
          fill="none"
        />
        
        {/* Inner geometric pattern - represents AI intelligence */}
        <path 
          d="M 20 8 L 32 14 L 32 26 L 20 32 L 8 26 L 8 14 Z" 
          fill="#FF6A00"
        />
        
        {/* Central node - represents decision point */}
        <circle 
          cx="20" 
          cy="20" 
          r="4" 
          fill="white"
        />
        
        {/* Connection lines - represents autonomous workflow */}
        <line x1="20" y1="8" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="24" x2="20" y2="32" stroke="white" strokeWidth="1.5" />
        <line x1="8" y1="14" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
        <line x1="24" y1="22" x2="32" y2="26" stroke="white" strokeWidth="1.5" />
      </svg>
      
      <div className="flex flex-col leading-none">
        <span className="text-xl font-semibold tracking-tight text-primary">HRAI</span>
        <span className="text-[10px] uppercase tracking-widest font-light opacity-60 mt-0.5">
          Autonomous HR
        </span>
      </div>
    </div>
  );
};

const firstSection = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: BotIcon,
    label: "AI-Agents",
    href: "/agents",
  },
  {
    icon: File,
    label: "CV-Analysis",
    href: "/user-contract",
  },
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
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
    <Sidebar className="bg-white border-r-2 border-primary/10">
      <SidebarHeader className="bg-white border-b border-primary/10">
        <Link href="/" className="flex items-center px-4 py-6">
          <HRAILogo size={40} />
        </Link>
      </SidebarHeader>
      
      <div className="px-4 py-2">
        <Separator className="bg-primary/10 h-[1px]" />
      </div>
      
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-12 border border-transparent hover:border-primary/20 hover:bg-amber-500 transition-all duration-200 text-foreground font-light",
                      pathname === item.href && "bg-primary text-white border-primary hover:bg-amber-500 hover:text-white"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-4">
                      <item.icon className="size-5" strokeWidth={1.5} />
                      <span className="text-sm tracking-tight">
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
          <Separator className="bg-primary/10 h-[1px]" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-12 border border-transparent hover:border-primary/20 hover:bg-amber-500 transition-all duration-200 text-foreground font-light",
                      pathname === item.href && "bg-primary text-white border-primary hover:bg-amber-500 hover:text-white"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-4">
                      <item.icon className="size-5" strokeWidth={1.5} />
                      <span className="text-sm tracking-tight">
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

      <SidebarFooter className="bg-white border-t border-primary/10">
        {/** <DashboardTrial /> */}
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};