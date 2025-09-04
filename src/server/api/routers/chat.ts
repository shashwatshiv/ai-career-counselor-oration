import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getChatResponse,
  generateSessionTitle,
  getChatResponseStream,
} from "@/lib/ai/gemini";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        firstMessege:z.string().optional()
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

  // // Send a message and get AI response
  // sendMessage: protectedProcedure
  //   .input(
  //     z.object({
  //       sessionId: z.string(),
  //       content: z.string().min(1).max(2000),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     // Verify session belongs to user
  //     const session = await ctx.prisma.chatSession.findFirst({
  //       where: {
  //         id: input.sessionId,
  //         userId: ctx.session.user.id,
  //       },
  //       include: {
  //         messages: {
  //           orderBy: {
  //             createdAt: "asc",
  //           },
  //         },
  //       },
  //     });

  //     if (!session) {
  //       throw new TRPCError({
  //         code: "NOT_FOUND",
  //         message: "Session not found",
  //       });
  //     }

  //     // Save user message
  //     const userMessage = await ctx.prisma.message.create({
  //       data: {
  //         sessionId: input.sessionId,
  //         content: input.content,
  //         role: "USER",
  //       },
  //     });

  //     try {
  //       // Get AI response
  //       const allMessages = [...session.messages, userMessage];
  //       const aiResponse = await getChatResponse(
  //         allMessages.map((msg) => ({
  //           role: msg.role,
  //           content: msg.content,
  //         })),
  //       );

  //       // Save AI response
  //       const assistantMessage = await ctx.prisma.message.create({
  //         data: {
  //           sessionId: input.sessionId,
  //           content: aiResponse,
  //           role: "ASSISTANT",
  //         },
  //       });

  //       // Update session title if it's the first message
  //       if (session.messages.length === 0 && session.title === "New Chat") {
  //         const newTitle = generateSessionTitle(input.content);
  //         await ctx.prisma.chatSession.update({
  //           where: { id: input.sessionId },
  //           data: {
  //             title: newTitle,
  //             updatedAt: new Date(),
  //           },
  //         });
  //       } else {
  //         // Just update the timestamp
  //         await ctx.prisma.chatSession.update({
  //           where: { id: input.sessionId },
  //           data: { updatedAt: new Date() },
  //         });
  //       }

  //       return {
  //         userMessage,
  //         assistantMessage,
  //       };
  //     } catch (error) {
  //       console.error("AI Response Error:", error);
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Failed to get AI response",
  //       });
  //     }
  //   }),

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

  // New streaming subscription procedure
  streamResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(2000),
      }),
    )
    .subscription(async ({ ctx, input }) => {
      return observable<string>((emit) => {
        const processStream = async () => {
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
              emit.error(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Session not found",
                }),
              );
              return;
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

            stream.subscribe({
              next: (chunk) => {
                fullResponse += chunk;
                emit.next(chunk);
              },
              error: (error) => {
                emit.error(error);
              },
              complete: async () => {
                try {
                  // Save the complete assistant message
                  const assistantMessage = await ctx.prisma.message.create({
                    data: {
                      sessionId: input.sessionId,
                      content: fullResponse,
                      role: "ASSISTANT",
                    },
                  });

                  // Update session title if it's the first message
                  if (
                    session.messages.length === 0 &&
                    session.title === "New Chat"
                  ) {
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

                  emit.complete();
                } catch (error) {
                  emit.error(
                    new TRPCError({
                      code: "INTERNAL_SERVER_ERROR",
                      message: "Failed to save assistant message",
                    }),
                  );
                }
              },
            });
          } catch (error) {
            emit.error(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to process stream",
              }),
            );
          }
        };

        processStream();
      });
    }),
});
