import Link from 'next/link'
import { Home, Search, Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          {/* Icono principal */}
          <div className="mx-auto mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Package className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">
            404
          </h1>
          
          <h2 className="text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Página no encontrada
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          {/* Opciones de navegación */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al inicio
            </Link>
            
            <Link
              href="/buscar"
              className="inline-flex items-center px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors duration-200"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar estaciones
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
            <p className="mb-2">
              ¿Necesitas ayuda? Contacta con nuestro equipo de soporte
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contacto" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
