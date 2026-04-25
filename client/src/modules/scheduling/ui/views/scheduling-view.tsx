"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityCalendar } from "@/modules/scheduling/components/calendar/components/availability-calendar";
import { BookingsList } from "@/modules/scheduling/components/bookings/bookings-list";
import { ShareLinkDialog } from "@/modules/scheduling/components/calendar/components/share-link-dialog";
import { slotsToBlocks } from "@/modules/scheduling/lib/utils";
import { Loader2, Calendar, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { set } from "date-fns";

export default function SchedulingView() {
    const trpc = useTRPC();

    const { data: bookings } = useQuery(
        trpc.scheduling.getUserBookings.queryOptions()
    );

    const { data: availability } = useQuery(
        trpc.scheduling.getAvailability.queryOptions()
    );

    const initialBlocks = availability ? slotsToBlocks(availability as any) : [];
    const formattedBookings = bookings?.map((b: any) => {
        const d = new Date(b.date);
        const [sh, sm] = b.startTime.split(":").map(Number);
        const [eh, em] = b.endTime.split(":").map(Number);
        
        return {
            ...b,
            date: d,
            startTime: set(d, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 }),
            endTime: set(d, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 }),
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
        };
    }) || [];

    return (
        <div className="flex-1 space-y-6 p-8 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Scheduling</h1>
                    <p className="text-muted-foreground font-light">
                        Manage your availability and upcoming HR interviews.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ShareLinkDialog />
                </div>
            </div>

            <Tabs defaultValue="availability" className="space-y-4">
                <TabsList className="bg-white border-2 border-primary/10 p-1">
                    <TabsTrigger value="availability" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                        <Clock className="w-4 h-4" />
                        Availability
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                        <Calendar className="w-4 h-4" />
                        Upcoming Bookings
                        {formattedBookings.length > 0 && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                                {formattedBookings.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="availability" className="space-y-4">
                    <Card className="border-2 border-primary/10 shadow-orange-md overflow-hidden">
                        <CardHeader className="bg-amber-50/30 border-b border-primary/10">
                            <CardTitle className="text-primary tracking-tight font-bold uppercase">Weekly Availability</CardTitle>
                            <CardDescription className="font-light">
                                Set your recurring weekly availability here. These slots will be available for booking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[750px]">
                                <AvailabilityCalendar initialBlocks={initialBlocks} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                    <Card className="border-2 border-primary/10 shadow-orange-md overflow-hidden">
                        <CardHeader className="bg-amber-50/30 border-b border-primary/10">
                            <CardTitle className="text-primary tracking-tight font-bold uppercase">Upcoming Bookings</CardTitle>
                            <CardDescription className="font-light">
                                View and manage your scheduled meetings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <BookingsList bookings={formattedBookings} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
