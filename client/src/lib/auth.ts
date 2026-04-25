import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db"; // your drizzle instance
import * as schema from "@/db/schema";



export const auth = betterAuth({
    
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,

        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            scope: [
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.readonly",
                "openid",
                "profile",
                "email"
            ],
            mapURL: (url: string) => {
                const newUrl = new URL(url);
                newUrl.searchParams.set("access_type", "offline");
                newUrl.searchParams.set("prompt", "consent");
                return newUrl.toString();
            }
        }
    },
    emailAndPassword: {
        enabled: true,
    },
     database: drizzleAdapter(db, {
        
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            ...schema,
        },
    }),
});