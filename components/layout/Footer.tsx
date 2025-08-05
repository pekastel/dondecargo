'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MapPin, Github, Twitter, Mail, ExternalLink } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Buscar Precios', href: '/buscar' },
      { name: 'Estadísticas', href: '/estadisticas' },
      { name: 'API Documentation', href: '/api-docs' },
      { name: 'MCP Setup', href: '/mcp-help' }
    ],
    company: [
      { name: 'Acerca de', href: '/acerca' },
      { name: 'Blog', href: '/blog' },
      { name: 'Términos de Uso', href: '/terminos' },
      { name: 'Política de Privacidad', href: '/privacidad' }
    ],
    support: [
      { name: 'Centro de Ayuda', href: '/ayuda' },
      { name: 'Contacto', href: '/contacto' },
      { name: 'Estado del Sistema', href: '/status' },
      { name: 'Reportar Bug', href: '/reporte-bug' }
    ],
    developers: [
      { name: 'API Reference', href: '/api' },
      { name: 'MCP Tools', href: '/mcp-tools' },
      { name: 'Webhooks', href: '/webhooks' },
      { name: 'GitHub', href: 'https://github.com/pekastel/dondecargo-v2', external: true }
    ]
  }

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/pekastel/dondecargo-v2', icon: Github },
    { name: 'Twitter', href: 'https://twitter.com/dondecargo', icon: Twitter },
    { name: 'Email', href: 'mailto:info@dondecargo.com', icon: Mail }
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DondeCargo
              </span>
              <Badge variant="secondary" className="text-xs">
                v2
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              La plataforma más completa para encontrar y comparar precios de combustibles en Argentina. 
              Datos oficiales + comunidad validada.
            </p>
            <div className="flex items-center space-x-2">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Button key={link.name} variant="ghost" size="sm" asChild>
                    <Link 
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{link.name}</span>
                    </Link>
                  </Button>
                )
              })}
            </div>
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
            <h3 className="font-semibold text-sm mb-4">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
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
            <h3 className="font-semibold text-sm mb-4">Soporte</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
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

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} DondeCargo. Todos los derechos reservados.
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Datos oficiales: datos.energia.gob.ar</span>
            <Separator orientation="vertical" className="h-4" />
            <span>MCP Compatible</span>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sistema operativo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}