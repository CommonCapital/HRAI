import { z } from 'zod';

export const agentsInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    agentType: z.enum(["active", "passive"]),
    instructions: z.string().min(1, { message: "Training data is required"}),
});
export const agentsUpdateSchema = agentsInsertSchema.extend({
    id: z.string().min(1, {message: "ID is required"})
})