# DondeCargo - Especificación UI/UX Detallada

## 1. Arquitectura General de Componentes

### 1.1 Estructura de Páginas
```
app/
├── page.tsx                    # Landing page
├── buscar/
│   └── page.tsx               # Página principal del mapa
├── estacion/
│   └── [id]/
│       └── page.tsx           # Detalle de estación
├── login/page.tsx             # ✅ Ya existe
└── signup/page.tsx            # ✅ Ya existe

components/
├── ui/                        # shadcn/ui components
├── map/
│   ├── MapSearch.tsx         # Componente principal del mapa
│   ├── MapFilters.tsx        # Filtros del mapa
│   └── LocationSearch.tsx    # Buscador de ubicaciones
├── station/
│   ├── StationDetail.tsx     # Vista detalle de estación
│   ├── PriceHistory.tsx      # Gráfico histórico de precios
│   └── StationInfo.tsx       # Información básica
└── layout/
    ├── Header.tsx            # Header global
    ├── Navigation.tsx        # Navegación principal
    └── Footer.tsx            # Footer
```

## 2. Mockups Detallados

### 2.1 Buscador de Mapa Interactivo (`/buscar`)

#### Layout Principal
```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Logo] DondeCargo     [Filtros] [User] [Mode Toggle] │
├─────────────────────────────────────────────────────────────┤
│ Filtros Rápidos: 🏪 Todas  ⛽ Nafta  🚛 Gasoil  ⚡ GNC     │
├──────────────────┬──────────────────────────────────────────┤
│ Panel Lateral    │                                          │
│ ┌──────────────┐ │                                          │
│ │ 📍 Ubicación  │ │           🗺️ MAPA INTERACTIVO            │
│ │ Buenos Aires  │ │                                          │
│ └──────────────┘ │    📍 Estación 1    📍 Estación 2      │
│                  │         $890           $875              │
│ 💰 Rango Precio  │                                          │
│ [$800 ——— $950]  │    📍 Estación 3    📍 Estación 4      │
│                  │         $885           $892              │
│ 🏢 Empresas      │                                          │
│ ☑️ YPF           │                     🎯 Mi ubicación      │
│ ☑️ Shell         │                                          │
│ ☑️ Axion         │                                          │
│ ☐ Puma           │                                          │
└──────────────────┴──────────────────────────────────────────┤
│ 📋 Lista: 24 estaciones encontradas         🔄 Actualizar   │
└─────────────────────────────────────────────────────────────┘
```

#### Responsive Mobile
```
┌─────────────────────────────────┐
│ [☰] DondeCargo        [👤] [🌙] │ 
├─────────────────────────────────┤
│ 📍 Ubicación actual: Buenos... │
│ [🔍 Buscar dirección...       ] │
├─────────────────────────────────┤
│                                 │
│        🗺️ MAPA COMPLETO         │
│                                 │
│   📍 YPF    📍 Shell    📍 Ax  │
│   $890      $875        $885    │
│                                 │
│              🎯                 │
│                                 │
├─────────────────────────────────┤
│ [⚡ GNC] [⛽ Nafta] [🚛 Gasoil] │
├─────────────────────────────────┤
│ 🔧 Filtros | 📋 Lista (24)     │
└─────────────────────────────────┘
```

### 2.2 Marcadores del Mapa

#### Marcador Estándar
```
     ⛽
   ┌─────┐
   │ YPF │
   │$890 │
   └──┬──┘
      ▼
```

#### Marcador Seleccionado
```
     ⛽
   ┌─────┐ ← Borde azul más grueso
   │ YPF │   Sombra más pronunciada
   │$890 │
   │ ⭐  │ ← Indicador selección
   └──┬──┘
      ▼
```

#### Popup de Información Rápida
```
┌─────────────────────────────────┐
│ YPF - Av. Corrientes 1234      │
├─────────────────────────────────┤
│ ⛽ Nafta Super:     $890.50    │
│ ⛽ Nafta Premium:   $925.80    │
│ 🚛 Gasoil Común:   $845.20    │
│ 🚛 Gasoil Premium: $872.40    │
│ ⚡ GNC:            $485.30    │
├─────────────────────────────────┤
│ 📍 Ver detalles    💰 Reportar │
└─────────────────────────────────┘
```

### 2.3 Panel de Filtros (Desktop)

```
┌─────────────────────────────────┐
│ 🔍 FILTROS DE BÚSQUEDA         │
├─────────────────────────────────┤
│ 📍 Ubicación                   │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Buscar dirección...      │ │
│ └─────────────────────────────┘ │
│ 🎯 Usar mi ubicación           │
│                                │
│ 📏 Radio de búsqueda           │
│ [●────────] 5 km               │
│                                │
│ ⛽ Tipos de combustible         │
│ ☑️ Nafta Super                 │
│ ☑️ Nafta Premium               │
│ ☑️ Gasoil Común                │
│ ☐ Gasoil Premium               │
│ ☐ GNC                          │
│                                │
│ 💰 Rango de precios            │
│ Min: [800] - Max: [950]        │
│ [●──────────●] $800 - $950     │
│                                │
│ 🏢 Empresas                    │
│ ☑️ YPF                         │
│ ☑️ Shell                       │
│ ☑️ Axion Energy                │
│ ☐ Puma Energy                  │
│ ☐ Trafigura                    │
│                                │
│ 🕐 Horario                     │
│ ◉ Actual (Diurno)              │
│ ○ Nocturno                     │
│                                │
│ [🔄 Limpiar] [✅ Aplicar]      │
└─────────────────────────────────┘
```

### 2.4 Modal de Filtros (Mobile)

```
┌─────────────────────────────────┐
│ ✕                    Filtros    │
├─────────────────────────────────┤
│                                │
│ 📏 Radio: 5 km                 │
│ [●────────] 1km ←→ 50km        │
│                                │
│ ⛽ Combustibles                 │
│ [✓ Nafta] [✓ Premium] [  GNC] │
│ [✓ Gasoil] [  G.Premium]      │
│                                │
│ 💰 Precio máximo               │
│ [        $950        ] 💸      │
│                                │
│ 🏢 Empresas (3 de 8)           │
│ [YPF ✓] [Shell ✓] [Axion ✓]  │
│ [Ver todas...]                 │
│                                │
│ 🕐 [Diurno ●] [Nocturno ○]     │
│                                │
├─────────────────────────────────┤
│ [Limpiar todo] [Aplicar (24)]  │
└─────────────────────────────────┘
```

## 3. Página de Detalle de Estación (`/estacion/[id]`)

### 3.1 Layout Completo

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [← Volver] YPF - Av. Corrientes 1234    [Favorito] │
├─────────────────────────────────────────────────────────────┤
│ 🏪 YPF PLENA                           📱 💰 REPORTAR PRECIO│
│ 📍 Av. Corrientes 1234, CABA           ⭐⭐⭐⭐⭐ (4.2)     │
│ 🕐 Abierto 24hs • 📞 011-1234-5678                         │
├──────────────────┬──────────────────────────────────────────┤
│ 💰 PRECIOS HOY   │                                          │
│ ┌──────────────┐ │           🗺️ UBICACIÓN                  │
│ │⛽ Nafta Super │ │                                          │
│ │    $890.50   │ │     ┌─────────────────────┐              │
│ │ 🕐 Hoy 14:30  │ │     │                     │              │
│ └──────────────┘ │     │        🗺️           │              │
│                  │     │                     │              │
│ ┌──────────────┐ │     │         📍         │              │
│ │⛽ Premium     │ │     │      YPF PLENA     │              │
│ │    $925.80   │ │     │                     │              │
│ │ 🕐 Hoy 14:30  │ │     └─────────────────────┘              │
│ └──────────────┘ │                                          │
│                  │ 🧭 Cómo llegar | 📱 Llamar | 📤 Compart.│
│ [Ver todos...]   │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ 📊 HISTORIAL DE PRECIOS                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Nafta ▼] [Últimos 30 días ▼]           [🔄 Actualizar]│ │
│ │                                                         │ │
│ │ $920 ┤                                         •        │ │
│ │      │                                   •              │ │
│ │ $900 ┤               •           •              •       │ │  
│ │      │         •                                        │ │
│ │ $880 ┤   •                                              │ │
│ │      └─────────────────────────────────────────────────│ │
│ │       1/8   8/8   15/8  22/8  29/8   5/9   12/9       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📝 INFORMACIÓN ADICIONAL                                   │
│ • Servicios: Shop, Baños, Café                            │
│ • Formas de pago: Efectivo, Tarjetas, Transferencia       │
│ • Última actualización: Hoy 14:30                         │
│ • Reportado por: Usuario verificado ✅                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Modal de Reporte de Precios

```
┌─────────────────────────────────┐
│ ✕                 Reportar Precio│
├─────────────────────────────────┤
│ 🏪 YPF - Av. Corrientes 1234   │
│                                │
│ ⛽ Tipo de combustible          │
│ [Nafta Super    ▼]             │
│                                │
│ 💰 Precio actual                │
│ $[  890.50  ] por litro        │
│                                │
│ 🕐 Horario observado            │
│ ◉ Diurno  ○ Nocturno           │
│                                │
│ 📸 Evidencia (opcional)         │
│ [📷 Tomar foto] [📁 Subir]     │
│                                │
│ 💡 Este precio será revisado    │
│    antes de publicarse         │
│                                │
├─────────────────────────────────┤
│ [Cancelar]     [✅ Reportar]   │
└─────────────────────────────────┘
```

### 3.3 Vista Mobile de Detalle

```
┌─────────────────────────────────┐
│ [←] YPF - Corrientes 1234   [♡] │
├─────────────────────────────────┤
│ 🏪 YPF PLENA                   │
│ 📍 Av. Corrientes 1234, CABA   │
│ 🕐 Abierto • ⭐ 4.2 (127)      │
├─────────────────────────────────┤
│ 💰 PRECIOS HOY    [💰 Reportar] │
│                                │
│ ⛽ Nafta Super      $890.50    │
│ ⛽ Nafta Premium    $925.80    │
│ 🚛 Gasoil Común    $845.20    │
│ 🚛 Gasoil Premium  $872.40    │
│ ⚡ GNC             $485.30    │
│                                │
│ 🕐 Actualizado hoy 14:30       │
├─────────────────────────────────┤
│          🗺️ MAPA               │
│ ┌─────────────────────────────┐ │
│ │            🗺️               │ │
│ │                             │ │
│ │             📍             │ │
│ │          YPF PLENA          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ [🧭 Direcciones] [📞 Llamar]   │
├─────────────────────────────────┤
│ 📊 HISTORIAL  [Ver gráfico →]  │
│                                │
│ Nafta Super - Últimos 7 días:  │
│ $890 → $885 → $890 → $890     │
│ ▲2%   ▼1%    ▲1%    →         │
├─────────────────────────────────┤
│ ℹ️ INFO ADICIONAL               │
│ • Shop, Baños, Café Martinez   │
│ • Efectivo, Tarjetas, QR       │
│ • Usuario verificado ✅         │
└─────────────────────────────────┘
```

## 4. Estados de Carga y Error

### 4.1 Skeleton Loading - Mapa

```
┌─────────────────────────────────┐
│ ████████████████     ██████████ │ 
├─────────────────────────────────┤
│ ███ ████ ███ ████ ███ ████     │
├──────────────────┬──────────────┤
│ Panel Lateral    │              │
│ ████████████████ │  ░░░░░░░░░░  │
│                  │  ░░░░░░░░░░  │
│ ████████████     │  ░░░░░░░░░░  │
│ [████]  [████]   │  ░░ Mapa ░░  │
│                  │  ░░ Carga ░░ │
│ ████████████████ │  ░░░░░░░░░░  │
│ ████ ████ ████   │  ░░░░░░░░░░  │
└──────────────────┴──────────────┤
│ ████████████████████████████    │
└─────────────────────────────────┘
```

### 4.2 Error de Geolocalización

```
┌─────────────────────────────────┐
│           ⚠️ Ups!               │
│                                │
│ No pudimos obtener tu ubicación │
│                                │
│ • Verifica los permisos         │
│ • Intenta buscar manualmente    │
│                                │
│ [🔍 Buscar dirección]           │
│ [🔄 Reintentar ubicación]       │
└─────────────────────────────────┘
```

### 4.3 Sin Resultados

```
┌─────────────────────────────────┐
│            🔍                   │
│                                │
│ No encontramos estaciones       │
│ en esta área                    │
│                                │
│ Intenta:                        │
│ • Ampliar el radio de búsqueda  │
│ • Cambiar los filtros           │
│ • Buscar en otra ubicación      │
│                                │
│ [🔧 Ajustar filtros]            │
└─────────────────────────────────┘
```

## 5. Microinteracciones y Animaciones

### 5.1 Transiciones de Página
- **Duración**: 200-300ms
- **Easing**: `ease-out`
- **Elementos**: Fade + slight scale/slide

### 5.2 Feedback de Botones
- **Hover**: Scale 1.02, brightness 1.1
- **Active**: Scale 0.98
- **Loading**: Spinner animation

### 5.3 Marcadores del Mapa
- **Aparición**: Bounce + fade in
- **Selección**: Pulse + scale 1.1
- **Hover**: Slight lift (shadow increase)

## 6. Sistema de Colores Específico

### 6.1 Combustibles
```css
:root {
  --fuel-nafta: #4ECDC4;       /* Teal */
  --fuel-premium: #FF6B6B;     /* Coral */
  --fuel-gasoil: #45B7D1;      /* Sky blue */
  --fuel-gasoil-premium: #5D4E75; /* Purple */
  --fuel-gnc: #8E44AD;         /* Dark purple */
}
```

### 6.2 Estados de Precio
```css
:root {
  --price-low: #2ECC71;        /* Verde */
  --price-medium: #F39C12;     /* Naranja */
  --price-high: #E74C3C;       /* Rojo */
  --price-updated: #3498DB;    /* Azul */
}
```

## 7. Consideraciones de Accesibilidad

### 7.1 Navegación por Teclado
- Tab order lógico
- Focus visible en todos los elementos
- Shortcuts: `/` para search, `Esc` para cerrar modales

### 7.2 Screen Readers
- ARIA labels en marcadores del mapa
- Descripciones textuales para precios
- Landmarks apropiados (`main`, `nav`, `aside`)

### 7.3 Contraste de Colores
- Ratio mínimo 4.5:1 para texto normal
- Ratio mínimo 3:1 para texto grande
- Estados focus con borde visible

## 8. Optimizaciones de Performance

### 8.1 Lazy Loading
- Mapa solo se carga cuando es visible
- Imágenes de estaciones con loading="lazy"
- Componentes de filtros con React.lazy()

### 8.2 Caching Strategy
- SWR para datos de estaciones
- React Query para históricos
- Service Worker para assets estáticos

### 8.3 Bundle Optimization
- Code splitting por rutas
- Tree shaking de librerías
- Compresión gzip/brotli

---

Esta especificación proporciona una base sólida para implementar la UI de DondeCargo v2, priorizando la experiencia mobile, la accesibilidad y el rendimiento, mientras mantiene la coherencia visual con el diseño existente.