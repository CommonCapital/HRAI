import {z} from 'zod';
import { agentsRouter } from "@/modules/agents/server/procedures"
import { baseProcedure, createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { candidatesRouter } from '@/modules/candidates/server/procedures';


export const appRouter = createTRPCRouter({
   agents: agentsRouter,
   meetings: meetingsRouter,
   candidates: candidatesRouter,
});

export type AppRouter = typeof appRouter;


