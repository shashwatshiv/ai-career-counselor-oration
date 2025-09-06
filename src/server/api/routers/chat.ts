import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  generateSessionTitle,
  getChatResponseStreamGenerator,
} from "@/lib/ai/gemini";

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure.mutation(async ({ ctx }) => {
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
        limit: z.number().min(1).max(100).default(8),
        cursor: z.string().optional(),
      })
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
        select: {
          id: true,
          title: true,
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
      })
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
      })
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
      })
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
      })
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

        // Stream the response using the new async generator
        let fullResponse = "";

        for await (const chunk of getChatResponseStreamGenerator(
          messageHistory
        )) {
          fullResponse += chunk;
          yield chunk;
        }

        // After streaming is complete, save the assistant message and update session
        const messagePromise = ctx.prisma.message.create({
          data: {
            sessionId: input.sessionId,
            content: fullResponse,
            role: "ASSISTANT",
          },
        });

        // Conditionally update session title or just timestamp
        const sessionPromise =
          session.messages.length === 0 && session.title === "New Chat"
            ? ctx.prisma.chatSession.update({
                where: { id: input.sessionId },
                data: {
                  title: await generateSessionTitle(input.content),
                  updatedAt: new Date(),
                },
              })
            : ctx.prisma.chatSession.update({
                where: { id: input.sessionId },
                data: { updatedAt: new Date() },
              });

        // Execute all database updates in parallel
        await Promise.all([messagePromise, sessionPromise]);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process stream",
        });
      }
    }),
});
