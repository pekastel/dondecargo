'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { authClient, signOut } from '@/lib/authClient';
import { useUserStations } from '@/lib/hooks/useUserStations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  LogOut, 
  Shield,
  Search,
  Home,
  FileText,
  Star,
  PlusCircle,
  MapPin,
} from 'lucide-react';

export default function UserMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { hasStations, loading } = useUserStations();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/');
        },
      },
    });
  };

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-full">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user.name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 z-2000" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {'user'}
                </Badge>
                {user.emailVerified && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    Verificado
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => router.push('/')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push('/buscar')}>
            <Search className="mr-2 h-4 w-4" />
            <span>Buscar</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push('/favoritos')}>
            <Star className="mr-2 h-4 w-4" />
            <span>Favoritos</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {!loading && (
            <DropdownMenuItem onClick={() => router.push(hasStations ? '/mis-estaciones' : '/crear-estacion')}>
              {hasStations ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Mis estaciones</span>
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Agregar mi estación</span>
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {/* <DropdownMenuItem onClick={() => router.push('/mcp-help')}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Manual MCP</span>
          </DropdownMenuItem> */}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a href="/terminos-y-condiciones.html" target="_blank" rel="noopener noreferrer" className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <FileText className="mr-2 h-4 w-4" />
              <span>Términos y Condiciones</span>
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Salir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}