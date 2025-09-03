"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc/client";
import { MessageSquare, Plus, TrendingUp, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function HomePage() {
  const api = useTRPC();
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: recentSessions } = useQuery(
    api.chat.getSessions.queryOptions({ limit: 3 }, { enabled: !!session }),
  );

  const createSessionMutation = useMutation(
    api.chat.createSession.mutationOptions({
      onSuccess: (session) => {
        router.push(`/chat/${session.id}`);
      },
    }),
  );
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleStartNewChat = () => {
    createSessionMutation.mutate({});
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to Career Counselor AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized career guidance powered by AI. Whether you're
              starting your career, looking to make a change, or seeking
              advancement, I'm here to help you succeed.
            </p>
            <Button
              onClick={handleStartNewChat}
              size="lg"
              className="text-lg px-8 py-6"
              disabled={createSessionMutation.isPending}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Start Career Counseling
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Career Planning</CardTitle>
                <CardDescription>
                  Set clear goals and create actionable plans for your career
                  advancement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Interview & Networking</CardTitle>
                <CardDescription>
                  Master interviews and build professional networks that advance
                  your career
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Skill Development</CardTitle>
                <CardDescription>
                  Identify skill gaps and get recommendations for continuous
                  learning
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Chats */}
          {recentSessions?.sessions && recentSessions.sessions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Recent Conversations</h2>
              </div>

              <div className="grid gap-4">
                {recentSessions.sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <Link href={`/chat/${session.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">
                              {session.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {session._count.messages} messages • Updated{" "}
                              {format(
                                new Date(session.updatedAt),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                          <MessageSquare className="h-5 w-5 text-muted-foreground ml-4" />
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Getting Started Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started Tips</CardTitle>
              <CardDescription>
                Make the most of your career counseling sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-sm">
                  <strong>Be specific:</strong> Share details about your current
                  situation, goals, and challenges
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-sm">
                  <strong>Ask follow-up questions:</strong> Dive deeper into
                  recommendations and advice
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-sm">
                  <strong>Return anytime:</strong> Your conversations are saved,
                  so you can continue where you left off
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
