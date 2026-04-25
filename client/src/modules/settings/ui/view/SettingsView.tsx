"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AccountManager } from "@/modules/scheduling/components/settings/components/settings/account-manager";
import { User, Shield, Bell, CreditCard, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsView() {
    const trpc = useTRPC();

    const { data: connectedAccounts, isLoading } = useQuery(
        trpc.scheduling.getConnectedAccounts.queryOptions()
    );

    return (
        <div className="flex-1 space-y-8 p-8 overflow-y-auto max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-primary uppercase italic">Settings</h1>
                    <p className="text-muted-foreground font-light text-lg">
                        Manage your account, preferences, and integrations.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="integrations" className="space-y-6">
                <TabsList className="bg-white border-2 border-primary/10 p-1 rounded-none h-14">
                    <TabsTrigger value="profile" className="flex items-center gap-2 h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 uppercase text-xs font-bold tracking-widest">
                        <User className="w-4 h-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2 h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 uppercase text-xs font-bold tracking-widest">
                        <Sparkles className="w-4 h-4" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2 h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 uppercase text-xs font-bold tracking-widest">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2 h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 uppercase text-xs font-bold tracking-widest">
                        <CreditCard className="w-4 h-4" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-2 border-primary/10 shadow-brutalist overflow-hidden">
                        <CardHeader className="bg-amber-50/30 border-b border-primary/10">
                            <CardTitle className="text-primary tracking-tighter uppercase font-black italic">Personal Information</CardTitle>
                            <CardDescription className="font-light">Manage your public profile and identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground italic">Profile editing coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <Card className="border-2 border-primary/10 shadow-brutalist overflow-hidden">
                        <CardHeader className="bg-amber-50/30 border-b border-primary/10">
                            <CardTitle className="text-primary tracking-tighter uppercase font-black italic">Calendar Connections</CardTitle>
                            <CardDescription className="font-light">
                                Connect your Google Calendar to synchronize your availability for HR interviews.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <AccountManager 
                                connectedAccounts={connectedAccounts || []} 
                                maxCalendars={3} 
                                plan="Free"
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/10 shadow-brutalist opacity-50 grayscale">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest font-bold">More Integrations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs font-light italic">Slack, Zoom, and Microsoft Teams coming in Q3.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                   <Card className="border-2 border-primary/10 shadow-brutalist p-12 text-center opacity-30">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <p className="font-bold uppercase tracking-widest text-xs">Security Settings Locked</p>
                   </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-6">
                   <Card className="border-2 border-primary/10 shadow-brutalist p-12 text-center opacity-30">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <p className="font-bold uppercase tracking-widest text-xs">Billing Dashboard Coming Soon</p>
                   </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
