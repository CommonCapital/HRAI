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
    
       const session = await auth.api.getSession({
              headers: await headers(),
            });
          
            if (!session) {
              redirect("/auth/sign-in");
            }
           if (
  session!.user.email !== "collin@musedata.ai" &&
  session!.user.email !== "nursan2007@gmail.com" &&
  session!.user.email !== "partners@musedata.ai" &&
  session!.user.email !== "nursanomarov616@gmail.com"
) {
  redirect("/waitlist");
}
    
    return (
       <div>
        {children}
       </div>
    );
};
export default Layout