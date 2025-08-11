# Product Requirements Document (PRD) - DondeCargo

## 1. Visión General del Producto

**DondeCargo v2** es una plataforma para visualización y gestión de precios de combustibles en Argentina. La aplicación combina datos oficiales del gobierno con contribuciones de usuarios validados para proporcionar información precisa y actualizada sobre precios de combustibles a través de una interfaz conversacional y un mapa interactivo.  Ademas la plataforma permite exponer datos de precios a traves del protocolo Model Context Protocol (MCP).

### Propuesta de Valor
- **Datos confiables**: Integración directa con APIs oficiales de datos abiertos del gobierno argentino
- **Colaboración comunitaria**: Sistema de validación de precios por usuarios autorizados
- **Interfaz conversacional**: Control completo a través de comandos en lenguaje natural (a traves de tools de MCP)
- **Visualización intuitiva**: Mapa interactivo con geolocalización automática
- **Indexación SEO**: Páginas individuales por estación para búsquedas en Google

## 2. Requerimientos Funcionales

### 2.1 Gestión de Datos de Precios

#### 2.1.1 Fuentes de Datos
- **Datos Oficiales**: Consumo diario de CSV desde http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv
- **Datos de Usuarios**: Reportes de precios por usuarios registrados y validados
- **Histórico de Precios**: Almacenamiento incremental de todos los cambios de precios

#### 2.1.2 Tipos de Combustibles Soportados
1. **Nafta** (súper entre 92-95 Ron)
2. **Nafta Premium** (más de 95 Ron)
3. **Gasoil Grado 2**
4. **Gasoil Grado 3** (premium)
5. **GNC**

#### 2.1.3 Variaciones Horarias
- Precios diurnos (horario normal)
- Precios nocturnos (horario reducido)

#### 2.1.4 Proceso de Actualización
- Descarga automática diaria de datos oficiales
- Actualización incremental en base de datos
- Validación de duplicados y consistencia
- Preservación de histórico completo

### 2.2 Modelo de Usuarios y Permisos

#### 2.2.1 Tipos de Usuarios
- **Usuario Anónimo**: Solo visualización de precios
- **Usuario Registrado**: Puede reportar precios propuestos
- **Usuario Validado**: Puede reportar precios oficiales (peso mayor en la UI)
- **Administrador**: Gestión de usuarios y validación de reportes

#### 2.2.2 Sistema de Validación
- Proceso de verificación de identidad para usuarios validados
- Ponderación diferenciada en la interfaz según tipo de usuario
- Sistema de reputación basado en precisión de reportes

### 2.3 Funcionalidades de la Interfaz

#### 2.3.1 Mapa Interactivo
- **Geolocalización automática**: Detección automática de ubicación del usuario
- **Radio de búsqueda configurable**: Distancia ajustable para mostrar estaciones
- **Visualización de precios**: Mostrar precios vigentes por tipo de combustible
- **Filtros dinámicos**: Por tipo de combustible, empresa, precio mínimo/máximo
- **Buscador de direcciones**: Búsqueda manual de ubicaciones

#### 2.3.2 Detalle de Estaciones
- **URL única por estación**: `/estacion/[id]` indexable por Google
- **Metadatos SEO**: Títulos, descripciones y datos estructurados para búsquedas
- **Historial de precios**: Gráfico temporal de variaciones
- **Ubicación exacta**: Mapa embebido con marcador
- **Información completa**: Dirección, empresa, horarios, tipos de combustible

#### 2.3.3 Sistema de Reporte de Precios
- **Formulario intuitivo**: Selección de estación, tipo de combustible, precio
- **Validación de datos**: Verificación de formatos y rangos válidos
- **Confirmación visual**: Preview antes de enviar
- **Estado de reporte**: Tracking del proceso de validación

### 2.4 Interfaz Conversacional (MCP)

#### 2.4.1 Tools
- Busqueda de precios por nombre de estacion
- Busqueda de precios por ubicacion geografica


#### 2.4.2 Capacidades del Sistema
- **Búsqueda contextual**: Entiende ubicaciones, tipos de combustible, rangos de precio
- **Comparación inteligente**: Análisis automático de mejores opciones
- **Actualización colaborativa**: Reportes de precios mediante conversación
- **Notificaciones**: Alertas de cambios de precio en áreas favoritas

## 3. Requerimientos Técnicos

### 3.1 Arquitectura del Sistema

#### 3.1.1 Stack Tecnológico
- **Frontend**: Next.js 15 con App Router
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Cache**: Redis para datos de frecuente acceso
- **Mapas**: OpenStreetMap con Leaflet
- **Autenticación**: Better Auth
- **Validación**: Zod schemas
- **Estilos**: Tailwind CSS, basados en shadcn ui components
- **MCP**: Model Context Protocol
- **Adapter**: Vercel MCP Adapter

#### 3.1.2 Patrones de Arquitectura
- **Conversational-First**: MCP como interfaz primaria
- **SSR/SSG**: Next.js para SEO y performance
- **API RESTful**: Endpoints bien definidos para cada recurso
- **Microservicios**: Proceso de actualización separado del deploy

### 3.2 Modelo de Datos

#### 3.2.1 Entidades Principales

**Estación de Servicio**
```typescript
{
  id: string;
  nombre: string;
  empresa: string;
  cuit: string;
  direccion: string;
  localidad: string;
  provincia: string;
  region: string;
  latitud: number;
  longitud: number;
  geojson: object;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

**Precio**
```typescript
{
  id: string;
  estacionId: string;
  tipoCombustible: 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc';
  precio: number;
  horario: 'diurno' | 'nocturno';
  fechaVigencia: Date;
  fuente: 'oficial' | 'usuario';
  usuarioId?: string;
  esValidado: boolean;
  fechaReporte: Date;
}
```

**Usuario**
```typescript
{
  id: string;
  email: string;
  nombre?: string;
  tipo: 'anonimo' | 'registrado' | 'validado' | 'admin';
  fechaRegistro: Date;
  fechaActualizacion: Date;
  reputacion: number;
}
```

#### 3.2.2 Índices y Optimización
- Índice geoespacial en latitud/longitud para búsquedas por proximidad
- Índice compuesto en (estacionId, tipoCombustible, fechaVigencia) para precios
- Índice en (provincia, localidad) para filtros geográficos
- Índice full-text en dirección para búsquedas

### 3.3 Procesos Automatizados

#### 3.3.1 Actualización Diaria de Precios
- **Frecuencia**: Ejecución diaria a las 6 AM (hora Argentina)
- **Proceso**: Script separado ejecutado fuera de Vercel
- **Validación**: Verificación de integridad de datos
- **Rollback**: Sistema de respaldo ante fallos
- **Notificación**: Alertas en caso de anomalías

#### 3.3.2 Mantenimiento de Datos
- **Limpieza**: Eliminación de duplicados
- **Validación**: Verificación de consistencia geográfica
- **Normalización**: Formato unificado de direcciones
- **Archivado**: Compresión de datos históricos

## 5. Requerimientos de Seguridad

### 5.1 Autenticación y Autorización
- **JWT tokens**: Expiración configurable
- **Rate limiting**: Límite de peticiones por IP
- **Validación de entrada**: Sanitización de todos los inputs
- **HTTPS**: Todos los endpoints en HTTPS
- **CORS**: Políticas restrictivas de origen cruzado

## 6. Requerimientos de SEO y Marketing

### 6.1 Optimización para Buscadores
- **Meta tags dinámicos**: Títulos y descripciones únicos por página
- **Schema.org**: Datos estructurados para estaciones de servicio
- **Sitemap.xml**: Generación automática de sitemap
- **Robots.txt**: Configuración apropiada para crawling
- **Core Web Vitals**: Optimización para métricas de Google

### 6.2 Indexación de Contenido
- **SSR para páginas de estaciones**: Renderizado del lado del servidor
- **URLs amigables**: Slugs descriptivos por ubicación
- **Open Graph**: Previews para redes sociales
- **Twitter Cards**: Integración con redes sociales

## 7. Requerimientos de Usabilidad

### 7.1 Accesibilidad (A11y)
- **Navegación por teclado**: Toda la interfaz usable sin mouse
- **Screen reader support**: Etiquetas ARIA apropiadas
- **Alto contraste**: Modo oscuro/claro con buena legibilidad
- **Tamaños de fuente**: Escalable hasta 200%

### 7.2 Diseño Responsive
- **Mobile-first**: Optimizado para dispositivos móviles
- **Breakpoints**: 320px, 768px, 1024px, 1440px
- **Touch targets**: Mínimo 44x44px en móviles
- **Performance 3G**: < 5 segundos en conexión 3G

## 8. Roadmap y Futuras Versiones

### 8.1 Fase 1 (MVP)
- ✅ Integración con datos oficiales
- ✅ Mapa interactivo básico
- ✅ Reporte de precios por usuarios
- ✅ Autenticación básica

### 8.2 Fase 2
- Sistema de validación de usuarios
- Notificaciones push de cambios de precio
- Favoritos y áreas personalizadas
- Exportación de datos

### 8.3 Fase 3
- App móvil nativa
- Integración con sistemas de pago
- Programas de fidelización
- API pública para desarrolladores

## 10. Apéndice

### 10.1 Glosario de Términos
- **MCP**: Model Context Protocol
- **SSR**: Server-Side Rendering
- **GNC**: Gas Natural Comprimido
- **RON**: Research Octane Number (medida de octanaje)
- **TTL**: Time To Live (tiempo de vida en caché)

### 10.2 Recursos Externos
- [Dataset oficial de precios](http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv)
- [Especificación MCP](https://modelcontextprotocol.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API_v0.6)

---

**Última actualización**: 4 de agosto de 2025
**Versión**: 1.0.0
**Autor**: Equipo DondeCargo
