"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
  createTRPCClient,
} from "@trpc/client";
import { type AppRouter } from "@/server/api/root";
import { useState } from "react";
import superjson from "superjson";
import { TRPCProvider } from "@/lib/trpc/client";

export function ProviderApp({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          // Use httpSubscriptionLink for subscriptions
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            url: "/api/trpc",
            transformer: superjson,
          }),
          // Use httpBatchLink for queries and mutations
          false: httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
          }),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
  // return (
  //   <api.Provider client={trpcClient} queryClient={queryClient}>
  //     <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  //   </api.Provider>
  // );
}
