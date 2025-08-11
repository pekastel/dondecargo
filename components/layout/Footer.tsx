'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MapPin, Github, Mail, ExternalLink } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Buscar Precios', href: '/buscar' },
      { name: 'Términos y Condiciones', href: '/terminos-y-condiciones.html' },
      { name: 'Política de Privacidad', href: '/privacidad' }
    ],
    developers: [
      { name: 'GitHub', href: 'https://github.com/pekastel/dondecargo', external: true },
      { name: 'Configuración MCP', href: '/mcp-help' },
      { name: 'Contacto', href: '/contacto' }
    ]
  }

  const pathname = usePathname()
  const isSearchPage = pathname === '/buscar'
  
  return (
    <footer className={`${isSearchPage 
      ? 'fixed bottom-0 left-0 right-0 z-4000 bg-background/70 backdrop-blur-sm shadow-lg hidden lg:block' 
      : 'border-t bg-gradient-to-b from-background via-background to-muted/40 relative'}`}>
      <div className={`container mx-auto px-4 ${isSearchPage ? 'py-1' : 'py-12'}`}>
        {/* Mostrar versión completa solo si no estamos en la página de búsqueda */}
        {!isSearchPage ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 md:p-1 shadow-lg">
                <Image src="/icon0.svg" alt="Logo" width={34} height={34} />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DondeCargo
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mt-4">
              La plataforma para encontrar y comparar precios de combustibles en Argentina. 
            </p>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Producto</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4">Desarrolladores</h3>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        ) : null}

        {!isSearchPage && <Separator className="my-8" />}

        {/* Bottom Section - Siempre visible */}
        <div className={`flex flex-col md:flex-row items-center justify-between ${isSearchPage ? 'space-y-2 md:space-y-0' : 'space-y-4 md:space-y-0'}`}>
          <div className={`${isSearchPage ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
            © {currentYear} DondeCargo.
            Hecho con <span className="text-red-500 mx-1">❤️</span> por
              <Link 
                href="https://www.lumile.com.ar" 
                className="font-medium underline underline-offset-4 ml-1" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Lumile Argentina S.A.
              </Link>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Datos: oficiales de datos.energia.gob.ar + aportes de la comunidad</span>
          </div>
        </div>
      </div>
    </footer>
  )
}