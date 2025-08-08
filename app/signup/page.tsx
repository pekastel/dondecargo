"use client";

import SignUp from "@/components/sign-up";
import { authClient } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session && !isPending) {
      router.push("/buscar");
    }
  }, [session, isPending, router]);

  // Show a loading state while authentication is being verified
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the registration form
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md">
              <SignUp />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This return should never execute due to the useEffect, but it's necessary for TypeScript
  return null;
}
