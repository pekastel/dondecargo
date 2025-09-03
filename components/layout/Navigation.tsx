'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Star, 
  Settings, 
  HelpCircle,
  BarChart3,
  Users,
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string
  description?: string
}

export const mainNavigation: NavigationItem[] = [
  {
    name: 'Buscar Precios',
    href: '/buscar',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Encuentra estaciones cerca de ti'
  },
  {
    name: 'Favoritos',
    href: '/favoritos',
    icon: <Star className="h-4 w-4" />,
    description: 'Tus estaciones guardadas'
  },
  {
    name: 'Contacto',
    href: '/contacto',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Escribinos tu consulta'
  }
]

export const toolsNavigation: NavigationItem[] = [
  {
    name: 'Reportar Precios',
    href: '/reportar',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Contribuye con la comunidad'
  },
  {
    name: 'Estadísticas',
    href: '/estadisticas',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Análisis de mercado'
  },
  {
    name: 'MCP Help',
    href: '/mcp-help',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Configurar Claude'
  }
]

const adminNavigation: NavigationItem[] = [
  {
    name: 'Usuarios',
    href: '/usuarios',
    icon: <Users className="h-4 w-4" />,
    description: 'Gestión de usuarios'
  },
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: <Settings className="h-4 w-4" />,
    description: 'Ajustes del sistema'
  }
]

interface NavigationProps {
  isAdmin?: boolean
  className?: string
}

export function Navigation({ isAdmin = false, className }: NavigationProps) {
  const pathname = usePathname()

  const renderNavigationSection = (items: NavigationItem[], title: string) => (
    <div className="space-y-2">
      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start h-auto p-3",
                isActive && "bg-secondary text-secondary-foreground"
              )}
              asChild
            >
              <Link href={item.href}>
                <div className="flex items-center w-full">
                  <div className="flex items-center flex-1 min-w-0">
                    {item.icon}
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Card className={cn("p-4", className)}>
      <nav className="space-y-6">
        {renderNavigationSection(mainNavigation, "Principal")}
        {renderNavigationSection(toolsNavigation, "Herramientas")}
        {isAdmin && renderNavigationSection(adminNavigation, "Admin")}
      </nav>
    </Card>
  )
}

// Breadcrumb Navigation Component
interface BreadcrumbItem {
  name: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Quick Actions Component
export function QuickActions() {
  const quickActions = [
    {
      name: 'Buscar cerca de mí',
      href: '/buscar?location=current',
      icon: <MapPin className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Precio más bajo',
      href: '/buscar?sort=price',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      name: 'Reportar precio',
      href: '/reportar',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'bg-orange-500'
    }
  ]

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Acciones rápidas</h3>
      <div className="grid grid-cols-1 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.name}
            variant="ghost"
            size="sm"
            className="justify-start h-auto p-3"
            asChild
          >
            <Link href={action.href}>
              <div className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-white mr-3",
                action.color
              )}>
                {action.icon}
              </div>
              <span className="text-sm">{action.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  )
}