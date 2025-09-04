import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateSessionTitle, getChatResponseStream } from "@/lib/ai/gemini";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        firstMessege: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx }) => {
      const session = await ctx.prisma.chatSession.create({
        data: {
          userId: ctx.session.user.id,
          title: "New Chat",
        },
      });
      return session;
    }),

  // Get all user sessions
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.prisma.chatSession.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem!.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  // Get a specific session with messages
  getSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      return session;
    }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      return await ctx.prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { title: input.title },
      });
    }),

  // Delete session
  deleteSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      await ctx.prisma.chatSession.delete({
        where: { id: input.sessionId },
      });

      return { success: true };
    }),

  streamResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(2000),
      }),
    )
    .subscription(async function* ({ ctx, input }) {
      try {
        // Verify session belongs to user
        const session = await ctx.prisma.chatSession.findFirst({
          where: {
            id: input.sessionId,
            userId: ctx.session.user.id,
          },
          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        // Save user message first
        const userMessage = await ctx.prisma.message.create({
          data: {
            sessionId: input.sessionId,
            content: input.content,
            role: "USER",
          },
        });

        // Build message history for AI
        const allMessages = [...session.messages, userMessage];
        const messageHistory = allMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Start streaming response
        const stream = getChatResponseStream(messageHistory);

        let fullResponse = "";

        // Convert observable to async iterator
        const streamIterator = {
          [Symbol.asyncIterator]: () => {
            let isComplete = false;
            let error: Error | null = null;
            const chunks: string[] = [];
            let resolveNext: ((value: IteratorResult<string>) => void) | null =
              null;

            // Subscribe to the stream
            stream.subscribe({
              next: (chunk) => {
                chunks.push(chunk);
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: chunk, done: false });
                }
              },
              error: (err) => {
                error = err;
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: undefined, done: true });
                }
              },
              complete: () => {
                isComplete = true;
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: undefined, done: true });
                }
              },
            });

            return {
              async next(): Promise<IteratorResult<string>> {
                if (error) throw error;

                if (chunks.length > 0) {
                  return { value: chunks.shift()!, done: false };
                }

                if (isComplete) {
                  return { value: undefined, done: true };
                }

                // Wait for next chunk
                return new Promise<IteratorResult<string>>((resolve) => {
                  resolveNext = resolve;
                });
              },
            };
          },
        };

        // Yield each chunk from the stream
        for await (const chunk of streamIterator) {
          fullResponse += chunk;
          yield chunk;
        }

        // After streaming is complete, save the assistant message
        try {
          await ctx.prisma.message.create({
            data: {
              sessionId: input.sessionId,
              content: fullResponse,
              role: "ASSISTANT",
            },
          });

          // Update session title if it's the first message
          if (session.messages.length === 0 && session.title === "New Chat") {
            const newTitle = generateSessionTitle(input.content);
            await ctx.prisma.chatSession.update({
              where: { id: input.sessionId },
              data: {
                title: newTitle,
                updatedAt: new Date(),
              },
            });
          } else {
            // Just update the timestamp
            await ctx.prisma.chatSession.update({
              where: { id: input.sessionId },
              data: { updatedAt: new Date() },
            });
          }
        } catch (_error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save assistant message",
          });
        }
      } catch (_error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process stream",
        });
      }
    }),
});
