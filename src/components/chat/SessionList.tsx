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
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useQuery,
  useQueryClient,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";

interface SessionListProps {
  currentSessionId?: string;
  chatStarted?: number;
}

export function SessionList({ currentSessionId }: SessionListProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const { data: userSession, status } = useSession();
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const { data: sessionsData } = useQuery(
    api.chat.getSession.queryOptions(
      { sessionId },
      { enabled: !!sessionId && !!userSession },
    ),
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...api.chat.getSessions.infiniteQueryOptions(
      { limit: 8 },
      {
        enabled: !!userSession,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
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
      onSuccess: (_data, variables, _context) => {
        queryClient.invalidateQueries(
          api.chat.getSessions.infiniteQueryFilter(),
        );
        if (variables.sessionId === currentSessionId) {
          router.push("/");
        }
      },
    }),
  );

  const handleCreateSession = () => {
    if (status === "authenticated") {
      if (sessionsData?.messages.length === 0) return;
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
      <div className="p-2">Previous Chats</div>
      {allSessions.map((session) => (
        <Card
          key={session.id}
          className={` group transition-colors p-1 w-full border-0 shadow-none  my-1 hover:bg-zinc-100 dark:hover:bg-zinc-600 ${
            currentSessionId === session.id
              ? " bg-zinc-200 dark:bg-zinc-700"
              : ""
          }`}
        >
          <CardContent className="">
            <div className="flex items-center justify-between">
              <Link href={`/chat/${session.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-normal truncate">
                      {session.title}
                    </p>
                  </div>
                </div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  >
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
      {error && (
        <div className="text-red-500">
          Error loading sessions: {error.message}
        </div>
      )}
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
