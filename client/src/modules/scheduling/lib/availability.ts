import {
    startOfDay,
    endOfDay,
    addMinutes,
    addDays,
    format,
    set,
    isBefore,
} from "date-fns";
import { type AvailabilitySlot, type Booking } from "@/db/schema";
import { DAYS_OF_WEEK } from "./utils";

export type BusyTime = {
    start: Date;
    end: Date;
};

/**
 * Compute available dates from host availability and existing bookings.
 */
export function computeAvailableDates(
    availability: AvailabilitySlot[],
    bookings: Booking[],
    startDate: Date,
    endDate: Date,
    slotDurationMinutes = 30,
    busyTimes: BusyTime[] = []
): string[] {
    const availableDates: string[] = [];
    let currentDate = startOfDay(startDate);
    const today = startOfDay(new Date());

    while (currentDate <= endDate) {
        if (currentDate < today) {
            currentDate = addDays(currentDate, 1);
            continue;
        }

        const dayOfWeek = format(currentDate, "eeee").toLowerCase();
        const availabilityForDay = availability.filter(s => s.dayOfWeek.toLowerCase() === dayOfWeek);

        if (availabilityForDay.length > 0) {
            const slots = computeAvailableSlotsForDate(
                availabilityForDay,
                bookings,
                currentDate,
                slotDurationMinutes,
                busyTimes
            );

            if (slots.length > 0) {
                availableDates.push(format(currentDate, "yyyy-MM-dd"));
            }
        }

        currentDate = addDays(currentDate, 1);
    }

    return availableDates;
}

/**
 * Compute available time slots for a specific date.
 */
export function computeAvailableSlotsForDate(
    availabilityForDay: AvailabilitySlot[],
    bookings: Booking[],
    date: Date,
    slotDurationMinutes = 30,
    busyTimes: BusyTime[] = []
): Array<{ start: Date; end: Date }> {
    const dayStart = startOfDay(date);
    const now = new Date();
    const slots: Array<{ start: Date; end: Date }> = [];

    for (const avail of availabilityForDay) {
        const [startH, startM] = avail.startTime.split(":").map(Number);
        const [endH, endM] = avail.endTime.split(":").map(Number);

        const availStart = set(dayStart, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
        const availEnd = set(dayStart, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });

        let currentStart = availStart;
        while (addMinutes(currentStart, slotDurationMinutes) <= availEnd) {
            const currentEnd = addMinutes(currentStart, slotDurationMinutes);

            if (currentStart < now) {
                currentStart = currentEnd;
                continue;
            }

            // Check conflicts with bookings
            const hasBookingConflict = bookings.some(booking => {
                const bDate = startOfDay(new Date(booking.date));
                if (bDate.getTime() !== dayStart.getTime()) return false;

                const [bStartH, bStartM] = booking.startTime.split(":").map(Number);
                const [bEndH, bEndM] = booking.endTime.split(":").map(Number);
                
                const bStart = set(dayStart, { hours: bStartH, minutes: bStartM, seconds: 0, milliseconds: 0 });
                const bEnd = set(dayStart, { hours: bStartH, minutes: bStartM, seconds: 0, milliseconds: 0 });
                // Wait, I used bStartH for both. Fixed below.
                
                return currentStart < bEnd && currentEnd > bStart;
            });
            
            // Re-evaluating bStart/bEnd calculation for accuracy
            const hasBookingConflictFixed = bookings.some(booking => {
                const bDate = startOfDay(new Date(booking.date));
                if (bDate.getTime() !== dayStart.getTime()) return false;
                if (booking.status === "cancelled") return false;

                const [bh1, bm1] = booking.startTime.split(":").map(Number);
                const [bh2, bm2] = booking.endTime.split(":").map(Number);
                const bs = set(dayStart, { hours: bh1, minutes: bm1, seconds: 0, milliseconds: 0 });
                const be = set(dayStart, { hours: bh2, minutes: bm2, seconds: 0, milliseconds: 0 });
                
                return currentStart < be && currentEnd > bs;
            });

            const hasBusyConflict = busyTimes.some(busy => {
                return currentStart < busy.end && currentEnd > busy.start;
            });

            if (!hasBookingConflictFixed && !hasBusyConflict) {
                slots.push({
                    start: new Date(currentStart),
                    end: new Date(currentEnd),
                });
            }

            currentStart = currentEnd;
        }
    }

    return slots;
}
