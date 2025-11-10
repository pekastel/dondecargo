'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import UserMenu from '@/components/navigation/UserMenu'
import { authClient } from '@/lib/authClient'
import { useUserStations } from '@/lib/hooks/useUserStations'
import { Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { getMainNavigation } from '@/components/layout/Navigation'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const { hasStations, loading } = useUserStations()
  
  // Obtener navegación dinámica con item de estaciones
  const mainNavigation = getMainNavigation(!!session?.user, hasStations)

  return (
    <header className="sticky top-0 z-2200 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 md:p-1 shadow-lg">
              <Image src="/icon0.svg" alt="Logo" width={34} height={34} />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DondeCargo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {session?.user ? (
              <UserMenu />
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Registrarse</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <Card className="md:hidden mt-2 p-4 border-t">
            <nav className="space-y-4">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span>{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </Link>
              ))}
              
              <div className="pt-4 border-t space-y-2">
                {!session?.user ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Registrarse
                      </Link>
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {session.user.name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{session.user.name || 'Usuario'}</div>
                        <div className="text-xs text-muted-foreground">{session.user.email}</div>
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                        Mi perfil
                      </Link>
                    </Button>
                    {session.user.role === 'admin' && (
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/estaciones-pendientes" onClick={() => setMobileMenuOpen(false)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Administrar Estaciones
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        await authClient.signOut()
                        setMobileMenuOpen(false)
                        router.push('/')
                      }}
                    >
                      Cerrar sesión
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </Card>
        )}
      </div>
    </header>
  )
}