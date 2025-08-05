"use client";

import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { 
  Github, 
  MessageSquare, 
  DollarSign, 
  Users, 
  BarChart3, 
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  BookOpen,
  Database,
  TrendingUp,
  Shield,
  Search,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 md:p-1 shadow-lg">
                <Image src="/icon0.svg" alt="Logo" width={34} height={34} />
              </div>
              <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DondeCargo
              </span>
              <Badge variant="secondary" className="text-xs">
                v2
              </Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                onClick={() => router.push("/buscar")}
                size="sm"
                className="md:size-default"
              >
                <Search className="h-4 w-4 mr-1" />
                Buscar Precios
              </Button>
              {session ? (
                <Button 
                  onClick={() => router.push("/dashboard")}
                  size="sm"
                  variant="outline"
                  className="md:size-default"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push("/login")}
                  size="sm"
                  variant="outline"
                  className="md:size-default"
                >
                  Sign In
                </Button>
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by Model Context Protocol (MCP)
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              <Image src="/brand.png" alt="Logo" width={256} height={256} className="inline-block border-2 border-blue-600 rounded-lg" />
            </span>
            <br />
            Precios de Combustibles
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Encuentra los mejores precios de combustibles en Argentina. Datos oficiales + reportes de usuarios validados 
            con interfaz conversacional y mapa interactivo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push("/buscar")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              <Search className="h-5 w-5 mr-2" />
              Buscar Precios
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/mcp-help")}
              className="px-8 py-3 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              MCP Setup Guide
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4 opacity-70">
            ¿Necesitas ayuda configurando Claude? Consulta nuestra guía de configuración MCP
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">¿Por qué DondeCargo v2?</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            DondeCargo v2 implementa una <strong>arquitectura conversacional-first</strong> que combina datos oficiales 
            del gobierno argentino con reportes validados de usuarios para proporcionar información precisa de precios de combustibles.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Características Principales</h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-medium">Datos Oficiales + Comunidad</span>
                </div>
                <p className="text-sm text-muted-foreground ml-4">
                  Integración directa con datos.energia.gob.ar + reportes validados de usuarios
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="font-medium">Interfaz Conversacional</span>
                </div>
                <p className="text-sm text-muted-foreground ml-4">
                  Consulta precios y encuentra estaciones mediante comandos en lenguaje natural
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 max-w-3xl mx-auto">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              Combustibles Soportados
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 text-left">
              <p><strong>⛽ Nafta Super (92-95 RON)</strong> • <strong>⛽ Nafta Premium (+95 RON)</strong></p>
              <p><strong>🚛 Gasoil Grado 2</strong> • <strong>🚛 Gasoil Grado 3 (Premium)</strong> • <strong>⚡ GNC</strong></p>
              <p className="text-xs opacity-75 mt-2">Precios diurnos y nocturnos • Actualización diaria automática</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Búsqueda Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Encuentra estaciones cerca de ti con filtros por combustible, empresa, precio y radio de búsqueda. 
                Geolocalización automática y mapa interactivo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Database className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Datos Confiables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Integración directa con datos oficiales del gobierno argentino. Actualización automática diaria 
                desde datos.energia.gob.ar con validación de consistencia.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Comunidad Validada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Los usuarios pueden reportar precios que son validados antes de publicarse. 
                Sistema de reputación y verificación para garantizar calidad de datos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Interfaz Conversacional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Encuentra precios y estaciones usando comandos en lenguaje natural via MCP. 
                Compatible con Claude y otros clientes MCP.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>Historial y Tendencias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualiza el historial de precios, tendencias temporales y variaciones por región. 
                Gráficos interactivos para análisis de mercado.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-teal-600 mb-4" />
              <CardTitle>SEO Optimizado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Páginas individuales por estación indexables por Google. Meta tags dinámicos, 
                datos estructurados y URLs amigables para máxima visibilidad.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Tecnología Moderna</h2>
            <p className="text-xl text-muted-foreground">
              Construido con las últimas tecnologías para óptimo rendimiento y experiencia de usuario.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Next.js 15", desc: "App Router & TypeScript" },
              { name: "PostgreSQL", desc: "Base de datos confiable" },
              { name: "Drizzle ORM", desc: "Type-safe database queries" },
              { name: "MCP Protocol", desc: "Interfaz conversacional" },
              { name: "OpenStreetMap", desc: "Mapas interactivos" },
              { name: "Better Auth", desc: "Autenticación & OAuth", optional: true }
            ].map((tech, i) => (
              <Card key={i} className="text-center border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{tech.name}</h3>
                    {tech.optional && (
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tech.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para Encontrar los Mejores Precios?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya ahorran combustible con DondeCargo. 
              Datos oficiales + comunidad validada = información confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => router.push("/buscar")}
                className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100"
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar Precios Ahora
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('https://github.com/pekastel/dondecargo-v2', '_blank')}
                className="px-8 py-3 border-white text-white bg-transparent hover:bg-white hover:text-blue-600"
              >
                <Github className="h-5 w-5 mr-2" />
                Ver en GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
