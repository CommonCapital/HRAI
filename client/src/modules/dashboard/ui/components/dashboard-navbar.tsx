"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  
  Menu,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";
import { DashboardCommand } from "./dashboard-command";
import { useEffect, useState } from "react";

export const DashboardNavbar = () => {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);
  useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
    };

  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down)
  }, []);
  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      
      <nav className="flex items-center top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <Button className="size-9" variant={"outline"} onClick={toggleSidebar}>
          {state === "collapsed" || isMobile ? (
            <Menu className="size-4" />
          ) : (
            <Menu className="size-4" />
          )}
        </Button>

        <Button
          className="h-9 w-[240px] justify-start font-normal text-muted-foreground hover:text-muted-foreground"
          variant={"outline"}
          size="sm"
          onClick={() => setCommandOpen((open) => !open)}
        >
          <SearchIcon />
          Search...
        </Button>
        
      </nav>
    </>
  );
};
