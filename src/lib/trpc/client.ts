import { createTRPCContext } from "@trpc/tanstack-react-query";
import { type AppRouter } from "@/server/api/root";

export const api = createTRPCContext<AppRouter>();
