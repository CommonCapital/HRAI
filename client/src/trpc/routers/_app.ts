import {z} from 'zod';
import { agentsRouter } from "@/modules/agents/server/procedures"
import { baseProcedure, createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { contractsRouter } from '@/modules/contracts/server/procedures';

export const appRouter = createTRPCRouter({
   agents: agentsRouter,
   meetings: meetingsRouter,
   contracts: contractsRouter,
});

export type AppRouter = typeof appRouter;


