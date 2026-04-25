"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { BookingCalendar } from "@/modules/scheduling/components/booking/booking-calendar";
import { computeAvailableDates, computeAvailableSlotsForDate } from "@/modules/scheduling/lib/availability";
import { addDays } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface PublicBookingViewProps {
    slug: string;
}

export default function PublicBookingView({ slug }: PublicBookingViewProps) {
    const trpc = useTRPC();

    const { data: meetingType, isLoading, error } = useQuery(
        trpc.scheduling.getPublicMeetingType.queryOptions({ slug })
    );

    const [timezone, setTimezone] = useState("UTC");

    useEffect(() => {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground animate-pulse uppercase tracking-widest">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !meetingType) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <Card className="max-w-md w-full border-2 border-red-500 shadow-brutalist p-8">
                    <CardContent className="pt-0 flex flex-col items-center text-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center border-4 border-red-500">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-gray-900 uppercase italic">Meeting Not Found</h2>
                            <p className="text-gray-600 font-light">
                                This booking link seems to be invalid or has expired. Please contact the host for a new link.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Compute available dates for the next 30 days
    const startDate = new Date();
    const endDate = addDays(startDate, 30);
    
    // Map bookings and filter cancelled ones
    const hostBookings = (meetingType as any).bookings?.map((b: any) => ({
        ...b,
        date: new Date(b.date)
    })) || [];

    const availableDates = computeAvailableDates(
        meetingType.availability as any,
        hostBookings,
        startDate,
        endDate,
        meetingType.duration
    );

    const slotsByDate: Record<string, { start: string; end: string }[]> = {};
    availableDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const slots = computeAvailableSlotsForDate(
            meetingType.availability as any,
            hostBookings,
            date,
            meetingType.duration
        );
        slotsByDate[dateStr] = slots.map(s => ({
            start: s.start.toISOString(),
            end: s.end.toISOString()
        }));
    });

    return (
        <div className="max-w-5xl mx-auto py-8">
            <BookingCalendar 
                hostSlug={meetingType.host.id}
                hostName={meetingType.host.name}
                meetingTypeId={meetingType.id}
                meetingTypeSlug={meetingType.slug}
                meetingTypeName={meetingType.name}
                duration={meetingType.duration}
                availableDates={availableDates}
                slotsByDate={slotsByDate}
                timezone={timezone}
            />
        </div>
    );
}
