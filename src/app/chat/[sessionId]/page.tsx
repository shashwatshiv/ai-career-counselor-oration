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
import { Loader2, AlertCircle, RefreshCw, StopCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [subscriptionInput, setSubscriptionInput] = useState<{
    sessionId: string;
    content: string;
  } | null>(null);
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

  // Move useSubscription to the top level of the component
  const subscription = api.chat.streamResponse.useSubscription(
    subscriptionInput!,
    {
      enabled: !!subscriptionInput,
      onStarted: () => {
        console.log("Subscription started");
        setIsStreaming(true);
        setStreamingMessage("");
      },
      onData: (chunk: string) => {
        setStreamingMessage((prev) => prev + chunk);
        // Scroll to bottom on each chunk
        setTimeout(() => scrollToBottom(), 50);
      },
      onError: (error) => {
        console.error("Streaming error:", error);
        setIsStreaming(false);
        setStreamingMessage("");
        setSubscriptionInput(null);
        // Show error to user
      },
      onConnectionStateChange: (state) => {
        console.log("Connection state:", state);
        if (state === "error") {
          setIsStreaming(false);
          setStreamingMessage("");
          setSubscriptionInput(null);
        }
      },
    },
  );

  const utils = api.useUtils();

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
  }, [chatSession?.messages, isAtBottom, streamingMessage]);

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return;

    try {
      // Set the subscription input to start the subscription
      setSubscriptionInput({ sessionId, content });
    } catch (error) {
      console.error("Failed to start streaming:", error);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const stopStreaming = () => {
    // Reset the subscription by clearing the input
    setSubscriptionInput(null);
    setIsStreaming(false);
    setStreamingMessage("");
  };

  // Handle subscription completion
  useEffect(() => {
    if (subscription.status === "pending" && !isStreaming) {
      setIsStreaming(true);
    }

    if (subscription.status === "idle" && isStreaming) {
      setIsStreaming(false);
      setStreamingMessage("");
      // Invalidate queries to refresh the UI
      utils.chat.getSession.invalidate({ sessionId });
      utils.chat.getSessions.invalidate();
      scrollToBottom();
    }
  }, [subscription.status, isStreaming, sessionId, utils]);

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
          {chatSession?.messages?.length === 0 && !isStreaming ? (
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

              {/* Streaming message display */}
              {isStreaming && streamingMessage && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <Card className="bg-muted p-3 max-w-[70%]">
                    <div className="space-y-2">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {streamingMessage}
                        <span className="animate-pulse">▋</span>
                      </div>
                    </div>
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
          isLoading={isStreaming}
          disabled={!chatSession || isStreaming}
        />

        {/* Stop streaming button */}
        {isStreaming && (
          <div className="p-4 border-t bg-background">
            <Button
              onClick={stopStreaming}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Generating
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
