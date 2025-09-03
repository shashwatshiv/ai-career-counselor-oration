"use client";
import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageSquare, MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useQueryClient,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";

interface SessionListProps {
  currentSessionId?: string;
}

export function SessionList({ currentSessionId }: SessionListProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const { status } = useSession();
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();

  // const { data: sessionsData, isLoading } = useQuery(
  //   api.chat.getSessions.queryOptions({
  //     limit: 8,
  //   }),
  // );
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...api.chat.getSessions.infiniteQueryOptions(
      { limit: 10 }, // Your query input
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // Optional: Configure initial page param if needed
      },
    ),
  });

  const allSessions = data?.pages.flatMap((page) => page.sessions) ?? [];

  const createSessionMutation = useMutation(
    api.chat.createSession.mutationOptions({
      onSuccess: (session) => {
        router.push(`/chat/${session.id}`);
      },
    }),
  );

  const updateTitleMutation = useMutation(
    api.chat.updateSessionTitle.mutationOptions({
      onSuccess: () => {
        setEditingSession(null);
        setNewTitle("");
        queryClient.invalidateQueries(api.chat.getSessions.queryFilter());
      },
    }),
  );

  const deleteSessionMutation = useMutation(
    api.chat.deleteSession.mutationOptions({
      onSuccess: (data, variables, context) => {
        if (variables.sessionId === currentSessionId) {
          router.push("/");
        }
        queryClient.invalidateQueries(api.chat.getSessions.queryFilter());
      },
    }),
  );

  const handleCreateSession = () => {
    if (status === "authenticated") {
      createSessionMutation.mutate({});
    } else {
      router.push("/auth/signin");
    }
  };

  const handleUpdateTitle = (sessionId: string) => {
    if (newTitle.trim()) {
      updateTitleMutation.mutate({ sessionId, title: newTitle.trim() });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionMutation.mutate({ sessionId });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <Button
        onClick={handleCreateSession}
        className="w-full"
        disabled={createSessionMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>

      {allSessions.map((session) => (
        <Card
          key={session.id}
          className={`transition-colors p-1 w-full my-2 hover:bg-muted/50 ${
            currentSessionId === session.id ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <CardContent className="p-1">
            <div className="flex items-center justify-between">
              <Link href={`/chat/${session.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* <Badge variant="secondary" className="text-xs">
                        {session._count.messages} messages
                      </Badge> */}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.updatedAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setEditingSession(session.id);
                          setNewTitle(session.title);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    </DialogTrigger>
                    {editingSession === session.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rename Chat Session</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Enter new title..."
                            maxLength={100}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateTitle(session.id)}
                              disabled={
                                !newTitle.trim() ||
                                updateTitleMutation.isPending
                              }
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingSession(null);
                                setNewTitle("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleDeleteSession(session.id)}
                    disabled={deleteSessionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full my-2"
        >
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </Button>
      )}
      {allSessions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No chat sessions yet</p>
          <p className="text-sm">
            {" "}
            {status === "authenticated"
              ? "Start a new conversation to begin"
              : "Login to start conversation"}
          </p>
        </div>
      )}
    </div>
  );
}
