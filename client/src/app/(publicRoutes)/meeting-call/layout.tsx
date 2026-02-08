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
       
           <div >
            {children}
           </div>
        
           );
};
export default Layout