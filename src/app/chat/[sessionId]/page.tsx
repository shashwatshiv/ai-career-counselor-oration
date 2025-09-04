"use client";

import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTRPC } from "@/lib/trpc/client";
import { ChatMessage } from "@/components/chat/Message";
import { MessageInput } from "@/components/chat/MessageInput";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@trpc/tanstack-react-query";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams();
  const router = useRouter();
  const { data: userSession, status: userStatus } = useSession();
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
  // move state dat thing to providers
  useEffect(() => {
    if (!userSession) {
      router.push("/auth/signin");
    }
  }, [userSession, router]);

  const {
    data: chatSession,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.chat.getSession.queryOptions(
      { sessionId },
      {
        enabled: !!sessionId && !!userSession,
      },
    ),
  );

  // Move useSubscription to the top level of the component
  const subscription = useSubscription(
    api.chat.streamResponse.subscriptionOptions(subscriptionInput!, {
      enabled: !!subscriptionInput,
      onStarted: () => {
        setIsStreaming(true);
        console.log(subscriptionInput?.content);
        setStreamingMessage("");
      },
      onData: (chunk: string) => {
        setStreamingMessage((prev) => prev + chunk);
        // Scroll to bottom on each chunk
        setTimeout(() => scrollToBottom(), 20);
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
        if (state.error) {
          setIsStreaming(false);
          setStreamingMessage("");
          setSubscriptionInput(null);
        }
        if (state.state === "connecting") {
          setTimeout(() => scrollToBottom(), 10);
        }

        if (state.state === "idle" && isStreaming) {
          setIsStreaming(false);
          setStreamingMessage("");
          queryClient.invalidateQueries(
            api.chat.getSession.queryFilter({ sessionId }),
          );
          setTimeout(() => scrollToBottom(), 0);
          queryClient.invalidateQueries(api.chat.getSessions.queryFilter());
        }
      },
    }),
  );
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight;
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
    // setStreamingMessage("");
    // Also reset the subscription if it exists
    if (subscription) {
      subscription.reset();
    }

    // Refresh messages
    queryClient.invalidateQueries(
      api.chat.getSession.queryFilter({ sessionId }),
    );
  };

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
    <MainLayout
      currentSessionId={sessionId}
      chatStarted={chatSession?.messages?.length}
    >
      <div className="flex-1 flex flex-col h-full ">
        {/* Chat header */}
        {/* <div className="border-b p-4 bg-card flex-shrink-0">
          <h2 className="font-semibold truncate">{chatSession?.title}</h2>
          <p className="text-sm text-muted-foreground">
            {chatSession?.messages?.length} messages
          </p>
        </div> */}

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1  p-4   overflow-y-auto space-y-4"
        >
          <div className=" flex-1 md:w-5/6 w-full my-10 mx-auto">
            {chatSession?.messages.length === 0 && !subscriptionInput ? (
              <div className="flex-1 flex items-center  justify-center text-center">
                <div className="max-w-md">
                  <div className="text-4xl mb-4">👋</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to Career Counseling
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    I'm here to help you navigate your career journey. You can
                    ask me about:
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
                      <strong>Career Transitions:</strong> Changing fields,
                      career pivots, next steps
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    Start by telling me about your career goals or any
                    challenges you're facing!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {chatSession?.messages?.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    userImage={userSession?.user?.image}
                    userName={userSession?.user?.name}
                  />
                ))}

                {(subscription.status == "connecting" ||
                  subscription.status == "pending") && (
                  <div className="flex flex-row-reverse items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={userSession?.user?.image || undefined}
                      />
                    </Avatar>
                    <Card className=" dark:bg-blue-900 rounded-tr-none  bg-blue-100 dark:text-white  p-3">
                      <p>{subscriptionInput?.content}</p>
                    </Card>
                  </div>
                )}
                {(subscription.status == "connecting" ||
                  subscription.status == "pending") && (
                  <div className="flex  items-start gap-3">
                    <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 dark:text-white animate-spin" />
                    </div>
                    <Card className="bg-muted p-3  rounded-tl-none">
                      <p className=" text-muted-foreground">
                        AI is thinking...
                      </p>
                    </Card>
                  </div>
                )}
                {/* Streaming message display */}
                {isStreaming && streamingMessage && (
                  <div className="flex items-start my-4 gap-3">
                    <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                    <Card className="bg-muted p-3 max-w-[70%]">
                      <div className="space-y-2">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          <ReactMarkdown>{streamingMessage}</ReactMarkdown>
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
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <div className="fixed bottom-30 right-10 z-10">
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
        <div className="flex justify-center">
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isStreaming}
            disabled={!chatSession || isStreaming}
            stopStreaming={stopStreaming}
          />
        </div>
      </div>
    </MainLayout>
  );
}
