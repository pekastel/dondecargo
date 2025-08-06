"use client";

import { Timer } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/navigation/UserMenu";
import Link from "next/link";

interface AdminHeaderProps {
  actions?: React.ReactNode;
}

export default function AdminHeader({ actions }: AdminHeaderProps) {
  return (
    <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/buscar" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2 shadow-lg">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DondeCargo
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {actions}
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}