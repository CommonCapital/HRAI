import { google } from "googleapis";
import { db } from "@/db";
import { account as accountTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google` // BetterAuth callback pattern
    );
}

export async function getCalendarClient(userId: string) {
    // 1. Find the Google account for this user
    const [account] = await db
        .select()
        .from(accountTable)
        .where(eq(accountTable.userId, userId))
        .limit(1);

    if (!account || account.providerId !== "google" || !account.refreshToken) {
        console.warn(`No Google account or refresh token found for user ${userId}`);
        return null;
    }

    const oauth2Client = createOAuth2Client();

    oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
        expiry_date: account.accessTokenExpiresAt?.getTime(),
    });

    // Handle token refresh if expired
    if (!account.accessTokenExpiresAt || account.accessTokenExpiresAt.getTime() <= Date.now() + 60000) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            
            // Update tokens in DB
            await db.update(accountTable)
                .set({
                    accessToken: credentials.access_token,
                    accessTokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
                })
                .where(eq(accountTable.id, account.id));
            
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error("Failed to refresh Google access token:", error);
            return null;
        }
    }

    return google.calendar({ version: "v3", auth: oauth2Client });
}
