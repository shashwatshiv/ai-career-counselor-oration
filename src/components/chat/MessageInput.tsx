"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, StopCircle } from "lucide-react";

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
    } else {
      stopStreaming;
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
      className="flex items-end gap-2 p-4 border-t bg-background"
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          "Type your message... (Press Enter to send, Shift+Enter for new line)"
        }
        className="min-h-[60px] resize-none flex-1"
        disabled={disabled || isLoading}
        maxLength={2000}
      />
      <Button
        type="submit"
        // disabled={!message.trim() || isLoading || disabled}
        size="icon"
        className="h-[60px] w-[60px]"
      >
        {isLoading ? (
          <StopCircle className="size-5" />
        ) : (
          <Send className="size-5" />
        )}
      </Button>
    </form>
  );
}
