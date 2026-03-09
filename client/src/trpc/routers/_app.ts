import {z} from 'zod';
import { agentsRouter } from "@/modules/agents/server/procedures"
import { baseProcedure, createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { candidatesRouter } from '@/modules/candidates/server/procedures';
import { jobsRouter } from '@/modules/jobs/server/procedure';
import { applicationsRouter } from '@/modules/applications/server/procedures';


export const appRouter = createTRPCRouter({
   agents: agentsRouter,
   meetings: meetingsRouter,
   candidates: candidatesRouter,
   jobs: jobsRouter,
   applications: applicationsRouter,
});

export type AppRouter = typeof appRouter;


