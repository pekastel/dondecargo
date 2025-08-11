import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ¡Registro exitoso!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Te enviamos un correo para confirmar tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Gracias por registrarte en DondeCargo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Confirma tu correo electrónico</p>
                      <p className="text-sm text-muted-foreground">
                        Te enviamos un correo electrónico{" "}
                        {email && (
                          <>
                            a{" "}
                            <span className="font-medium text-blue-600">{email}</span>
                          </>
                        )} con un enlace de verificación.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Próximos pasos:
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>1. Revisá tu bandeja de entrada</li>
                        <li>2. Buscá el correo de DondeCargo</li>
                        <li>3. Hacé clic en el enlace de verificación</li>
                        <li>4. ¡Comenzá a usar la plataforma!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    ¿No recibiste el correo? Revisá tu carpeta de spam o correo no deseado.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href="/login" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio de sesión
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}