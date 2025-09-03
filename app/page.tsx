"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { 
  Users,
  Search,
  Heart,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

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
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              <Image src="/brand.png" alt="Logo" width={256} height={256} className="inline-block border-2 border-blue-600 rounded-lg" />
            </span>
            <br />
            Precios de Combustibles
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Encontrá los mejores precios de combustibles en Argentina. Buscá por zona, compará en el mapa y aprovechá los reportes de la comunidad.
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
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Búsqueda de precios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Filtrá por combustible, empresa y radio; mirá resultados en el mapa y compará precios diurnos/nocturnos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Reportes de la comunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sumate reportando precios y ayudá a mantener la información actualizada y confiable para todos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Heart className="h-12 w-12 text-rose-600 mb-4" />
              <CardTitle>Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Marcá tus estaciones preferidas para acceder rápido y ver sus precios destacados en el mapa y la lista.
              </p>
            </CardContent>
          </Card>
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
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
