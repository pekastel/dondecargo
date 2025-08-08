'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Shield, 
  Mail, 
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';

export default function Profile() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    image: '',
  });
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleResendVerification = async () => {
    try {
      setIsVerifying(true);
      await authClient.sendVerificationEmail({
        email: session?.user?.email || '',
        callbackURL: '/profile'
      });
      setMessage({ type: 'success', text: 'Correo de verificación enviado. ¡Por favor revisa tu bandeja de entrada!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al enviar el correo de verificación. Por favor intenta nuevamente.' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Initialize form data when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        image: session.user.image || '',
      });
    }
  }, [session]);

  const user = session?.user;
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'El tamaño del avatar debe ser menor a 5MB.' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  // Convert file to base64 for Better Auth
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      // Prepare update data
      const updateData: { name: string; image?: string } = {
        name: formData.name,
      };

      // Add avatar if uploaded
      if (avatarFile) {
        const avatarBase64 = await fileToBase64(avatarFile);
        updateData.image = avatarBase64;
      }

      // Use Better Auth updateUser method
      const { error } = await authClient.updateUser(updateData);

      if (error) {
        throw new Error(error.message || 'Error al actualizar el perfil');
      }

      setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
      
      // Clear avatar file and preview
      setAvatarFile(null);
      setPreviewUrl(null);
      
      // Refresh session to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar el perfil. Por favor intenta nuevamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configuración de Perfil
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra tu información de cuenta y preferencias
            </p>
          </div>

          {/* Profile Overview */}
          <Card className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={previewUrl || user.image || undefined} alt={user.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-lg">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold">{user.name || 'User'}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline text-xs">Usuario</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="text-xs">Registrado el {new Date(user.createdAt || '').toLocaleDateString()}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Form */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tus datos personales y foto de perfil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>

                  <Separator />

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Guardando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Guardar Cambios
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
                  Seguridad de la Cuenta
                </CardTitle>
                <CardDescription>
                  Administra tu contraseña y configuración de seguridad.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Correo Electrónico</h4>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          No Verificado
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                          onClick={handleResendVerification}
                          disabled={isVerifying}
                        >
                          {isVerifying ? 'Enviando...' : 'Reenviar Correo de Verificación'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/profile/settings')}
                >
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}