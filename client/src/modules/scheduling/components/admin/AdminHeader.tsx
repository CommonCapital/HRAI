"use client";

import { Button } from "@/components/ui/button";
import { LogOutIcon, LayoutDashboardIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AdminHeader() {
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/sign-in");
                },
            },
        });
    };

    return (
        <header className="sticky top-0 z-50 border-b border-amber-100 bg-gradient-to-r from-white to-amber-50/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                        <LayoutDashboardIcon className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Admin</h1>
                        <p className="text-xs text-zinc-500">Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-zinc-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOutIcon className="size-4" />
                        <span className="hidden sm:inline ml-2">Logout</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}