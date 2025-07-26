import { Icons } from "./icons";
import Clock from "./clock";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center gap-2">
          <Icons.shield className="h-10 w-10" />
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text">Drishti AI</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-muted-foreground hidden md:block">System Online</span>
          </div>
          <Clock />
          <ThemeToggle />
           <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
