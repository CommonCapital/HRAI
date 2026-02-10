"use server";

import { db } from "@/db";
import { demoBookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

// Validation
export const demoBookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phoneNumber: z.string().optional(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  message: z.string().optional(),
});

// Create booking
export async function createDemoBooking(data: z.infer<typeof demoBookingSchema>) {
  try {
    const validated = demoBookingSchema.parse(data);
    const headersList = await headers();

    const [booking] = await db
      .insert(demoBookings)
      .values({
        ...validated,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
        userAgent: headersList.get("user-agent") || "unknown",
        status: "pending",
        referralSource: "website",
      })
      .returning();

    return { success: true, data: booking };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create booking" };
  }
}

// Get booking by ID - using SELECT instead of query API
export async function getDemoBooking(id: string) {
  try {
    const [booking] = await db
      .select()
      .from(demoBookings)
      .where(eq(demoBookings.id, id))
      .limit(1);

    if (!booking) {
      return { success: false, error: "Not found" };
    }

    return { success: true, data: booking };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to get booking" };
  }
}

// Update status
export async function updateDemoBookingStatus(
  id: string,
  status: "pending" | "contacted" | "scheduled" | "completed" | "cancelled"
) {
  try {
    const [updated] = await db
      .update(demoBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(demoBookings.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update" };
  }
}