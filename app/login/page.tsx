"use client";

import SignIn from "@/components/sign-in";
import { authClient } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Timer, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // If the user is authenticated, redirect to dashboard
    if (session && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  // Show a loading state while authentication is being verified
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the login form
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2 shadow-lg">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DondeCargo MCP
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://github.com/lumile/dondecargo-v2', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
                <ModeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md">
              <SignIn />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This return should never execute due to the useEffect, but it's necessary for TypeScript
  return null;
}
