"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { SessionList } from "@/components/chat/SessionList";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "../ui/theme-toggle";
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: userSession } = useSession();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:fixed inset-y-0 left-0 z-50 w-80 bg-card border-r
          transform transition-transform duration-200 ease-in-out lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <Link href="/">
              <h1 className="font-semibold text-xl">Career Counselor</h1>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <ThemeToggle></ThemeToggle>
            </div>
          </div>
          {/* Session list */}
          <div className="flex-1 overflow-y-auto">
            <SessionList />
          </div>
          {/* User menu */}
          {userSession?.user && (
            <div className="border-t p-4 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={userSession.user.image || undefined} />
                      <AvatarFallback>
                        {userSession.user.name?.[0]?.toUpperCase() || (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {userSession.user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {userSession.user.email}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {!userSession && (
            <div className="p-4">
              <Link href="/auth/signin">
                <Button className="w-full">Login</Button>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-80">
        {/* Mobile header */}
        <header className="lg:hidden items-center gap-2 p-4 border-b bg-card flex-shrink-0">
          <div className="flex flex-row justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="font-semibold">Career Counselor</h1>
            </div>
            {!userSession && (
              <div>
                <Link href="/auth/signin">
                  <Button> Login</Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
