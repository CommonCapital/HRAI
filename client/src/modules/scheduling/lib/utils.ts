import { startOfWeek, addDays, parse, format, set } from "date-fns";
import { type AvailabilitySlot, type Booking } from "@/db/schema";
import { type TimeBlock } from "@/modules/scheduling/components/calendar/types";

export const DAYS_OF_WEEK = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

export function slotsToBlocks(slots: AvailabilitySlot[], referenceDate: Date = new Date()): TimeBlock[] {
    const weekStart = startOfWeek(referenceDate);

    return slots.map(slot => {
        const dayIndex = DAYS_OF_WEEK.indexOf(slot.dayOfWeek.toLowerCase());
        if (dayIndex === -1) return null;

        const date = addDays(weekStart, dayIndex);
        
        const [startHours, startMinutes] = slot.startTime.split(":").map(Number);
        const [endHours, endMinutes] = slot.endTime.split(":").map(Number);

        const start = set(date, { hours: startHours, minutes: startMinutes, seconds: 0, milliseconds: 0 });
        const end = set(date, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });

        return {
            id: slot.id,
            start,
            end,
        };
    }).filter(Boolean) as TimeBlock[];
}

export function blocksToSlots(blocks: TimeBlock[]): Omit<AvailabilitySlot, "id" | "userId" | "createdAt">[] {
    return blocks.map(block => {
        const dayOfWeek = format(block.start, "eeee").toLowerCase();
        const startTime = format(block.start, "HH:mm");
        const endTime = format(block.end, "HH:mm");

        return {
            dayOfWeek,
            startTime,
            endTime,
        };
    });
}
