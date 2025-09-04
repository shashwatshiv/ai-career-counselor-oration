"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  stopStreaming?: () => void;
}

export function MessageInput({
  onSendMessage,
  isLoading,
  disabled,
  stopStreaming,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    } else if (isLoading && stopStreaming) {
      stopStreaming();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex justify-center  py-4 w-full bg-none"
    >
      <div className="flex md:w-5/6 w-full px-4 gap-4  ">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"Ask Anything about Career"}
          className="min-h-[60px]  resize-none flex-1 w-full rounded-3xl p-4 border-none bg-zinc-100 dark:bg-zinc-600"
          disabled={disabled || isLoading}
          maxLength={2000}
        />
        <Button
          type="submit"
          // disabled={!message.trim() || isLoading || disabled}
          size="icon"
          className="h-[60px] w-[60px] rounded-full"
        >
          {isLoading ? (
            <StopCircle className="size-5" />
          ) : (
            <Send className="size-5" />
          )}
        </Button>
      </div>
    </form>
  );
}
