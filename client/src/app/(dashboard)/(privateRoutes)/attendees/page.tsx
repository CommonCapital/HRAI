import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
    const session = await auth.api.getSession({
         headers: await headers(),
        });
    
        if (!session) {
           redirect("/auth/sign-in")
        };
    return (
        <div>Here would be list of all attendees of your meetings</div>
    )
}

export default Page