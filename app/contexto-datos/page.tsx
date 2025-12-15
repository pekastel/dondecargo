"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ContextoDatosPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <section className="container mx-auto px-6 py-16 md:py-20 max-w-3xl">
        <div className="space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Transparencia y datos
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Contexto de los datos de combustibles en 2025
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Queremos contarte brevemente qué cambió a nivel regulatorio en
              Argentina y por qué hoy dependemos mucho más de la colaboración
              de la comunidad para mantener actualizados los precios.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cambio regulatorio</h2>
            <p className="text-muted-foreground">
              En 2025, en Argentina se derogó la obligación de informar los
              precios minoristas de combustibles en tiempo real al Estado.
            </p>
            <p className="text-muted-foreground">
              Esto ocurrió a través de la Resolución 717/2025, que dejó sin
              efecto la Resolución 314/2016, con el objetivo de desregular el
              mercado, reducir burocracia y fomentar la competencia.
            </p>
            <p className="text-muted-foreground">
              Desde ese momento, las estaciones de servicio ya no están
              obligadas a reportar aumentos de nafta, gasoil o GNC de forma
              centralizada, lo que impactó directamente en las fuentes
              oficiales de datos que históricamente utilizaba DondeCargo.
            </p>
            <p className="text-sm text-muted-foreground">
              Podés ver más detalles sobre esta medida acá:{" "}
              <a
                href="https://www.saij.gob.ar/derogaron-obligacion-informar-precios-minoristas-combustibles-derogaron-obligacion-informar-precios-minoristas-combustibles-nv46819-2025-05-29/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                texto completo de la resolución en SAIJ
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cómo impacta en DondeCargo</h2>
            <p className="text-muted-foreground">
              Frente a este cambio, DondeCargo hoy se apoya principalmente en la
              colaboración de la comunidad y de las propias estaciones, que
              pueden cargar y actualizar precios de forma directa desde la
              plataforma.
            </p>
            <p className="text-muted-foreground">
              Por eso, en algunas zonas los datos pueden no estar tan
              actualizados como nos gustaría. Seguimos trabajando para mejorar
              la cobertura y facilitar cada vez más la carga de precios, porque
              creemos que la transparencia sigue siendo fundamental para los
              usuarios, especialmente al momento de viajar.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cómo podés ayudar</h2>
            <p className="text-muted-foreground">
              Si sos usuario frecuente de estaciones de servicio, tu aporte
              es clave para que otras personas puedan tomar mejores decisiones.
              Algunas formas de colaborar:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Reportar precios actualizados cuando cargás combustible en una
                estación.
              </li>
              <li>
                Marcar como favoritos los lugares que usás seguido para
                encontrarlos más rápido.
              </li>
              <li>
                Compartir DondeCargo con otras personas que viajan seguido.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Si sos dueño, encargada/o o trabajás en una estación, podés ir un
              paso más allá:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Dar de alta tu estación en el mapa para que más personas la
                encuentren.
              </li>
              <li>
                Mantener actualizados los precios directamente desde la
                plataforma.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <p className="text-muted-foreground">
              Te agradecemos mucho el interés y el feedback. Comentarios como el
              tuyo nos ayudan a seguir mejorando el proyecto y a construir entre
              todos una herramienta más transparente y útil.
            </p>
          </section>

          <section className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button size="lg" onClick={() => router.push("/buscar")}>
              Ver mapa y buscar precios
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/signup")}
            >
              Crear cuenta para colaborar
            </Button>
          </section>
        </div>
      </section>
    </main>
  );
}



