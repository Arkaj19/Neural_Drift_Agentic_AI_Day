'use client';

import { Icons } from "./icons";
import Clock from "./clock";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

function UserProfileDisplay() {
    const { user, loading } = useUserProfile();

    if (loading) {
        return <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    }

    if (!user) {
        return <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Log In
            </Link>
          </Button>
    }

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="flex items-center gap-3">
            <div className="text-right">
                <div className="font-semibold text-sm">{user.fullName}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Avatar>
                <AvatarFallback className="bg-orange-500 text-white">
                    {getInitials(user.fullName)}
                </AvatarFallback>
            </Avatar>
        </div>
    )

}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center gap-2">
          <Icons.shield className="h-8 w-8" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text">Drishti AI</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-muted-foreground hidden md:block">System Online</span>
          </div>
          <Clock />
          <ThemeToggle />
          <UserProfileDisplay />
        </div>
      </div>
    </header>
  );
}
