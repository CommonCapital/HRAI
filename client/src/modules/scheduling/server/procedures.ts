import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { availabilitySlots, meetingTypes, bookings, user, account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { streamVideo } from "@/lib/stream-video";
import { getCalendarClient } from "../lib/google-calendar";

export const schedulingRouter = createTRPCRouter({
  /**
   * MEETING TYPES
   */
  getMeetingTypes: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.hostId, ctx.auth.user.id));
  }),

  getMeetingTypeById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [type] = await db
        .select()
        .from(meetingTypes)
        .where(eq(meetingTypes.id, input.id));
      return type;
    }),

  createMeetingType: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        duration: z.number().int().positive(),
        description: z.string().optional(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newMeetingType] = await db
        .insert(meetingTypes)
        .values({
          hostId: ctx.auth.user.id,
          name: input.name,
          slug: input.slug,
          duration: input.duration,
          description: input.description,
          isDefault: input.isDefault,
        })
        .returning();
      return newMeetingType;
    }),

  /**
   * AVAILABILITY
   */
  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.userId, ctx.auth.user.id));
  }),

  getUserAvailabilityBySlug: baseProcedure
    .input(z.object({ slug: z.string() })) // Assuming user might have a slug, or just use user id
    .query(async ({ input }) => {
      // In a more robust implementation, the user table would have a 'slug' for public profiles
      // For now, if we pass user ID as slug for public fetching:
      const [host] = await db
        .select()
        .from(user)
        .where(eq(user.id, input.slug));

      if (!host) {
        throw new Error("Host not found");
      }

      const slots = await db
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.userId, host.id));
      return { host, slots };
    }),

  getPublicMeetingType: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [type] = await db
        .select({
          id: meetingTypes.id,
          name: meetingTypes.name,
          slug: meetingTypes.slug,
          duration: meetingTypes.duration,
          description: meetingTypes.description,
          hostId: user.id,
          hostName: user.name,
          hostEmail: user.email,
          hostImage: user.image,
        })
        .from(meetingTypes)
        .innerJoin(user, eq(meetingTypes.hostId, user.id))
        .where(eq(meetingTypes.slug, input.slug));

      if (!type) {
        throw new Error("Meeting type not found");
      }

      // Also fetch availability for the host
      const slots = await db
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.userId, type.hostId));

      // Fetch bookings for the next 30 days to avoid double booking
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const hostBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.meetingTypeId, type.id),
            // We should actually check all bookings for the hostId
            // but for now, we'll check bookings for this meeting type.
            // Better: find all meeting types for this host and their bookings.
          )
        );
        
      // Actually, let's just get all bookings for the host
      const allHostBookings = await db
        .select()
        .from(bookings)
        .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
        .where(eq(meetingTypes.hostId, type.hostId));

      return {
        ...type,
        host: {
          id: type.hostId,
          name: type.hostName,
          email: type.hostEmail,
          image: type.hostImage,
        },
        availability: slots,
        bookings: allHostBookings.map(b => b.bookings),
      };
    }),

  updateAvailability: protectedProcedure
    .input(
      z.array(
        z.object({
          dayOfWeek: z.string(),
          startTime: z.string(),
          endTime: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Very simple destructive update: delete old, insert new
      await db
        .delete(availabilitySlots)
        .where(eq(availabilitySlots.userId, ctx.auth.user.id));

      if (input.length === 0) return [];

      const slotsToInsert = input.map((slot) => ({
        userId: ctx.auth.user.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

      return await db.insert(availabilitySlots).values(slotsToInsert).returning();
    }),

  /**
   * BOOKINGS
   */
  createBooking: baseProcedure
    .input(
      z.object({
        meetingTypeId: z.string(),
        attendeeName: z.string(),
        attendeeEmail: z.string().email(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // 0. Get the meeting type to find the host
      const [type] = await db
        .select()
        .from(meetingTypes)
        .where(eq(meetingTypes.id, input.meetingTypeId));

      if (!type) throw new Error("Meeting type not found");

      // 1. Create the booking record
      const [booking] = await db
        .insert(bookings)
        .values({
          meetingTypeId: input.meetingTypeId,
          attendeeName: input.attendeeName,
          attendeeEmail: input.attendeeEmail,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          status: "scheduled",
        })
        .returning();

      let meetLink: string | undefined;

      // 2. Create Google Calendar event with Google Meet
      const calendar = await getCalendarClient(type.hostId);
      if (calendar) {
        try {
          const startDate = new Date(input.date);
          const [sh, sm] = input.startTime.split(":").map(Number);
          startDate.setHours(sh, sm, 0, 0);

          const endDate = new Date(input.date);
          const [eh, em] = input.endTime.split(":").map(Number);
          endDate.setHours(eh, em, 0, 0);

          const event = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: {
              summary: `${type.name}: ${input.attendeeName} x HRAI`,
              description: `Automated HR Interview scheduled via HRAI.`,
              start: { dateTime: startDate.toISOString() },
              end: { dateTime: endDate.toISOString() },
              attendees: [{ email: input.attendeeEmail }],
              conferenceData: {
                createRequest: {
                  requestId: `hr-booking-${booking.id}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              },
            },
          });

          meetLink = event.data.hangoutLink ?? undefined;
          
          if (meetLink) {
            await db.update(bookings)
              .set({ meetLink, googleEventId: event.data.id })
              .where(eq(bookings.id, booking.id));
          }
        } catch (error) {
          console.error("Failed to create Google Meet:", error);
        }
      }

      /* 
      // Ghosted Stream Logic (as requested)
      try {
        const call = streamVideo.video.call("default", booking.id);
        const meetingName = `Meeting with ${input.attendeeName}`;
        await call.create({
          data: {
            created_by_id: "system",
            custom: { meetingId: booking.id, meetingName },
          },
        });
        // const meetLink = `${process.env.NEXT_PUBLIC_APP_URL}/meeting-call/${booking.id}`;
      } catch (error) {
        console.error("Failed to create stream call:", error);
      }
      */

      return { ...booking, meetLink };
    }),

  getUserBookings: protectedProcedure.query(async ({ ctx }) => {
    // Complex join to get host's bookings
    const result = await db
      .select({
        booking: bookings,
        meetingType: meetingTypes,
      })
      .from(bookings)
      .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
      .where(eq(meetingTypes.hostId, ctx.auth.user.id));

    return result.map(({ booking, meetingType }) => ({
      ...booking,
      meetingType,
    }));
  }),

  cancelBooking: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find the booking and make sure it belongs to a meeting type of the current user
      const result = await db
        .select({
          bookingId: bookings.id,
        })
        .from(bookings)
        .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
        .where(
          and(
            eq(bookings.id, input.id),
            eq(meetingTypes.hostId, ctx.auth.user.id)
          )
        );

      if (result.length === 0) {
        throw new Error("Booking not found or unauthorized");
      }

      const [cancelledBooking] = await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.id))
        .returning();

      return cancelledBooking;
    }),

  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await db
      .select({
        id: account.id,
        email: user.email, // We can join with user or just use account info if available
        providerId: account.providerId,
        createdAt: account.createdAt,
      })
      .from(account)
      .innerJoin(user, eq(account.userId, user.id))
      .where(
        and(
          eq(account.userId, ctx.auth.user.id),
          eq(account.providerId, "google")
        )
      );

    return accounts.map(a => ({
      ...a,
      isDefault: true, // Placeholder logic
    }));
  }),
});
