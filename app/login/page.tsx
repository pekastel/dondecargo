"use client";

import SignIn from "@/components/sign-in";
import { authClient } from "@/lib/authClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const searchParams = useSearchParams();

  const redirectTarget = useMemo(() => {
    // Check if there's an explicit redirect parameter
    const explicitRedirect = searchParams?.get("callbackURL")
      || searchParams?.get("callbackUrl")
      || searchParams?.get("redirectTo")
      || searchParams?.get("redirect")
      || searchParams?.get("returnTo")
      || searchParams?.get("next");
    
    if (explicitRedirect) {
      // Sanitize: only allow same-origin absolute-path redirects
      if (explicitRedirect.startsWith("/") && !explicitRedirect.startsWith("//")) {
        return explicitRedirect;
      }
    }
    
    // If no explicit redirect and user is admin, redirect to admin dashboard
    if (session?.user?.role === "admin") {
      return "/estaciones-pendientes";
    }
    
    // Default redirect for regular users
    return "/buscar";
  }, [searchParams, session?.user?.role]);

  useEffect(() => {
    if (session && !isPending) {
      router.replace(redirectTarget);
    }
  }, [session, isPending, router, redirectTarget]);

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

  // If not authenticated, show the login form
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
