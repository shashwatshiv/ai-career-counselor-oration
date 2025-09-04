"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { type Message } from "@prisma/client";
import { BrainCircuit, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: Message;
  userImage?: string | null;
  userName?: string | null;
}

export function ChatMessage({ message, userImage, userName }: MessageProps) {
  const isUser = message.role === "USER";

  return (
    <div
      className={`flex my-5 items-start gap-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
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
          <AvatarFallback className="bg-background dark:text-white">
            <BrainCircuit className="h-6 w-6" />
          </AvatarFallback>
        )}
      </Avatar>

      <Card
        className={`max-w-[70%] p-3 rounded-3xl  ${
          isUser
            ? "dark:bg-blue-900 rounded-tr-none  bg-blue-100 dark:text-white "
            : "bg-muted rounded-tl-none"
        }`}
      >
        <div className="space-y-2">
          <div className=" leading-relaxed whitespace-pre-wrap ">
            <ReactMarkdown>{message.content}</ReactMarkdown>
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
