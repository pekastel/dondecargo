'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Shield, 
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import AdminHeader from '@/components/navigation/AdminHeader';

export default function ProfileSettings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    
    setIsLoading(true);
    setMessage(null);

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
      setIsLoading(false);
      return;
    }

    try {
      // Use Better Auth changePassword method
      const { data, error } = await authClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (error) {
        throw new Error(error.message || 'Error al actualizar la contraseña');
      }

      setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' });
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar la contraseña. Por favor intenta nuevamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) return null;

  const headerActions = (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => router.push('/profile')}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al Perfil
    </Button>
  );

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configuración de Seguridad
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra tu contraseña y preferencias de seguridad
            </p>
          </div>

          {/* Password Change Form */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {message && (
                    <div className={`p-3 rounded-md flex items-center gap-2 ${
                      message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">{message.text}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Ingresa tu contraseña actual"
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Ingresa tu nueva contraseña"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      La contraseña debe tener al menos 8 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirma tu nueva contraseña"
                      required
                      minLength={8}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Actualizando Contraseña...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Actualizar Contraseña
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Directrices de Seguridad
                </CardTitle>
                <CardDescription>
                  Sigue estas mejores prácticas para mantener tu cuenta segura.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Usa una Contraseña Fuerte</h4>
                      <p className="text-xs text-muted-foreground">
                        Incluye mayúsculas, minúsculas, números y caracteres especiales
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">No Reutilices Contraseñas</h4>
                      <p className="text-xs text-muted-foreground">
                        Usa una contraseña única para tu cuenta de DondeCargo
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Actualizaciones Regulares</h4>
                      <p className="text-xs text-muted-foreground">
                        Cambia tu contraseña periódicamente para mayor seguridad
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Nota:</strong> Better Auth maneja el cifrado y la seguridad de contraseñas automáticamente. 
                    Tus contraseñas nunca se almacenan en texto plano.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}