'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UsuarioConEstaciones {
  id: string
  name: string
  email: string
  totalEstaciones: number
  aprobadas: number
  pendientes: number
  rechazadas: number
  ultimaCreacion: Date
}

export default function UsuariosEstacionesClient() {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<UsuarioConEstaciones[]>([])

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    try {
      const response = await fetch('/api/admin/usuarios-estaciones')
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      setUsuarios(data.usuarios || [])
    } catch (error) {
      console.error('Error fetching usuarios:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totales = usuarios.reduce((acc, u) => ({
    total: acc.total + u.totalEstaciones,
    aprobadas: acc.aprobadas + u.aprobadas,
    pendientes: acc.pendientes + u.pendientes,
    rechazadas: acc.rechazadas + u.rechazadas,
  }), { total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usuarios con Estaciones</h1>
        <p className="text-muted-foreground">
          Gestión de usuarios que han creado estaciones de servicio
        </p>
      </div>

      {/* Estadísticas globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Usuarios</p>
              <p className="text-3xl font-bold">{usuarios.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Estaciones</p>
              <p className="text-3xl font-bold">{totales.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Aprobadas</p>
              <p className="text-3xl font-bold text-green-600">{totales.aprobadas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{totales.pendientes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Usuarios que han creado al menos una estación de servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay usuarios con estaciones creadas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Aprobadas</TableHead>
                  <TableHead className="text-center">Pendientes</TableHead>
                  <TableHead className="text-center">Rechazadas</TableHead>
                  <TableHead>Última Creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {usuario.name?.[0]?.toUpperCase() || usuario.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{usuario.name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{usuario.totalEstaciones}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {usuario.aprobadas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        {usuario.pendientes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
                        {usuario.rechazadas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {new Date(usuario.ultimaCreacion).toLocaleDateString('es-AR')}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
