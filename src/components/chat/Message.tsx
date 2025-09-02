"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { type Message } from "../../generated/prisma";
import { Bot, User } from "lucide-react";

interface MessageProps {
  message: Message;
  userImage?: string | null;
  userName?: string | null;
}

export function ChatMessage({ message, userImage, userName }: MessageProps) {
  const isUser = message.role === "USER";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarImage src={userImage || undefined} />
            <AvatarFallback>
              {userName ? (
                userName[0].toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-blue-500 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <Card
        className={`max-w-[80%] p-3 ${
          isUser ? "bg-blue-500 text-white ml-auto" : "bg-muted"
        }`}
      >
        <div className="space-y-2">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <div
            className={`text-xs opacity-70 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {format(new Date(message.createdAt), "MMM d, h:mm a")}
          </div>
        </div>
      </Card>
    </div>
  );
}
