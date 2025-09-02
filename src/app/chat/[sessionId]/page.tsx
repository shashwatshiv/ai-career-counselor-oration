"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { ChatMessage } from "@/components/chat/Message";
import { MessageInput } from "@/components/chat/MessageInput";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const sessionId = params.sessionId as string;

  const {
    data: chatSession,
    isLoading,
    error,
    refetch,
  } = api.chat.getSession.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      retry: 1,
    },
  );

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
  });

  const utils = api.useContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [chatSession?.messages, isAtBottom]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync(
        { sessionId, content },
        {
          onSuccess: () => {
            // Invalidate and refetch the session to get updated messages
            utils.chat.getSession.invalidate({ sessionId });
            utils.chat.getSessions.invalidate();
          },
        },
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout currentSessionId={sessionId}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout currentSessionId={sessionId}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                {error.message || "Failed to load chat session"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} size="sm">
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentSessionId={sessionId}>
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="border-b p-4 bg-card flex-shrink-0">
          <h2 className="font-semibold truncate">{chatSession?.title}</h2>
          <p className="text-sm text-muted-foreground">
            {chatSession?.messages?.length} messages
          </p>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {chatSession?.messages?.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="max-w-md">
                <div className="text-4xl mb-4">👋</div>
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to Career Counseling
                </h3>
                <p className="text-muted-foreground mb-6">
                  I'm here to help you navigate your career journey. You can ask
                  me about:
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm text-left">
                  <div className="p-3 bg-muted rounded-lg">
                    <strong>Career Planning:</strong> Goal setting, career
                    paths, industry insights
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <strong>Job Search:</strong> Resume tips, interview prep,
                    networking strategies
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <strong>Skill Development:</strong> Learning
                    recommendations, certifications
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <strong>Career Transitions:</strong> Changing fields, career
                    pivots, next steps
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">
                  Start by telling me about your career goals or any challenges
                  you're facing!
                </p>
              </div>
            </div>
          ) : (
            <>
              {chatSession?.messages?.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userImage={session?.user?.image}
                  userName={session?.user?.name}
                />
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <Card className="bg-muted p-3">
                    <p className="text-sm text-muted-foreground">
                      AI is thinking...
                    </p>
                  </Card>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <div className="fixed bottom-20 right-4 z-10">
            <Button
              onClick={scrollToBottom}
              size="icon"
              className="rounded-full shadow-lg"
            >
              ↓
            </Button>
          </div>
        )}

        {/* Message input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
          disabled={!chatSession}
        />

        {/* Error display */}
        {sendMessageMutation.error && (
          <div className="p-4 border-t">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {sendMessageMutation.error.message || "Failed to send message"}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
