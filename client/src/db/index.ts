import { drizzle } from 'drizzle-orm/neon-http';

 export const db = drizzle(process.env.DATABASE_URL!);
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABSE_URL is not defined in the environment variables.")
 } else {
     console.log("Database connection established successfully.");
 }
