import { z } from "zod";
import { applicationStatusSchema } from "./server/procedures";

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;