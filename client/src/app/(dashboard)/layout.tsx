import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
    children: React.ReactNode;
}


const Layout = async ({children}:Props) => {
    
    
    return (
        <SidebarProvider>
           <DashboardSidebar />
           <main className="flex flex-col h-screen w-screen bg-muted">
            <DashboardNavbar />
            {children}
            </main>
        </SidebarProvider>
    );
};
export default Layout