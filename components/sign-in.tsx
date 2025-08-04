"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/authClient";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = () => {
    return email.trim() !== '' && password.trim() !== '';
  };

  return (
    <Card className="max-w-md shadow-lg border-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null); // Clear error when user starts typing
                }}
                value={email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Link
                href="#"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10 h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null); // Clear error when user starts typing
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-muted-foreground/30"
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
            disabled={loading || !isFormValid()}
            onClick={async () => {
              if (!isFormValid()) {
                setError("Please fill in all required fields");
                return;
              }

              setError(null); // Clear any previous errors
              await signIn.email(
                {
                  email,
                  password,
                  rememberMe
                },
                {
                  onRequest: () => {
                    setLoading(true);
                  },
                  onResponse: () => {
                    setLoading(false);
                  },
                  onError: (ctx) => {
                    setLoading(false);
                    // Handle email verification error
                    if (ctx.error.status === 403) {
                      setError("Please verify your email address. Check your inbox for a verification email.");
                    } else {
                      // Show the original error message for other errors
                      setError(ctx.error.message || "An error occurred during sign in");
                    }
                  },
                  onSuccess: () => {
                    setError(null);
                    // Redirect will happen automatically
                  }
                },
              );
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center pt-4 border-t border-muted-foreground/10">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link 
                href="/signup" 
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}