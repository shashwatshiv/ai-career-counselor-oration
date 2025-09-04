"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export function StartChatButton() {
  const api = useTRPC();
  const router = useRouter();
  const { status } = useSession();

  const createSessionMutation = useMutation(
    api.chat.createSession.mutationOptions({
      onSuccess: (session) => {
        router.push(`/chat/${session.id}`);
      },
    }),
  );

  const handleStartNewChat = () => {
    if (status === "authenticated") {
      createSessionMutation.mutate({});
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <Button
      size="lg"
      className="text-lg px-8 py-6"
      disabled={createSessionMutation.isPending}
      onClick={handleStartNewChat}
    >
      <MessageSquare className="mr-2 h-5 w-5" />
      Start Career Counseling
    </Button>
  );
}
