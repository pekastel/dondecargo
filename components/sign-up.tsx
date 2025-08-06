"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { signUp } from "@/lib/authClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    return firstName.trim() !== '' && 
           lastName.trim() !== '' && 
           email.trim() !== '' && 
           password.trim() !== '' && 
           passwordConfirmation.trim() !== '' && 
           password === passwordConfirmation &&
           acceptedTerms;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="max-w-md shadow-lg border-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Join DondeCargo
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Create your account to start tracking time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-sm font-medium">First name</Label>
              <Input
                id="first-name"
                placeholder="John"
                className="h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
                required
                onChange={(e) => {
                  setFirstName(e.target.value);
                }}
                value={firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-sm font-medium">Last name</Label>
              <Input
                id="last-name"
                placeholder="Doe"
                className="h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
                required
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
                value={lastName}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              className="h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation" className="text-sm font-medium">Confirm Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-medium">Profile Image (optional)</Label>
            <div className="flex items-end gap-4">
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-muted-foreground/20">
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 w-full">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full h-11 bg-muted/50 border-muted-foreground/20 focus:border-blue-500 transition-colors file:bg-transparent file:border-0 file:text-sm"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="p-2 h-11 w-11"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="terms" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto los términos y condiciones
                </Label>
                <p className="text-xs text-muted-foreground">
                  Al registrarte, aceptas nuestros{" "}
                  <Link 
                    href="/terminos-y-condiciones.html" 
                    target="_blank" 
                    className="text-blue-600 hover:text-blue-500 underline"
                  >
                    términos y condiciones
                  </Link>
                  {" "}y reconoces que tus datos podrán ser utilizados para análisis y publicidad.
                </p>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
            disabled={loading || !isFormValid()}
            onClick={async () => {
              if (!isFormValid()) {
                if (password !== passwordConfirmation) {
                  toast.error("Las contraseñas no coinciden");
                } else if (!acceptedTerms) {
                  toast.error("Debes aceptar los términos y condiciones");
                } else {
                  toast.error("Por favor completa todos los campos requeridos");
                }
                return;
              }

              await signUp.email({
                email,
                password,
                name: `${firstName} ${lastName}`,
                image: image ? await convertImageToBase64(image) : "",
                acceptedTerms: acceptedTerms,
                callbackURL: "/",
                fetchOptions: {
                  onResponse: () => {
                    setLoading(false);
                  },
                  onRequest: () => {
                    setLoading(true);
                  },
                  onError: (ctx) => {
                    // Handle specific error when sign-up is disabled
                    if (ctx.error.code === 'EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED' || 
                        ctx.error.message === 'Email and password sign up is not enabled') {
                      toast.error("New user registration is currently disabled. Please contact an administrator if you need access.");
                    } else {
                      toast.error(ctx.error.message || "Failed to create account. Please try again.");
                    }
                  },
                  onSuccess: async () => {
                    // Redirect to verify-email page with user's email
                    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
                  },
                },
              });
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center pt-4 border-t border-muted-foreground/10">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}