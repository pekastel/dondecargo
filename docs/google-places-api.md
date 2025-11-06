# Configuración de Google Places API

Esta guía explica cómo configurar Google Places API para habilitar la validación automática y el auto-completado de datos al crear estaciones de servicio.

## ¿Por qué usar Google Places API?

Con Google Places API configurada, el sistema puede:

✅ **Validar automáticamente** que las ubicaciones sean estaciones de servicio  
✅ **Auto-completar** todos los campos del formulario con datos oficiales de Google Maps  
✅ **Reducir errores** de usuarios al ingresar información  
✅ **Minimizar trabajo de moderación** filtrando lugares inválidos automáticamente  

## Formatos de URL Soportados

El sistema detecta automáticamente el Place ID de múltiples formatos de URLs de Google Maps:

### ✅ URLs Cortas (goo.gl)
```
https://maps.app.goo.gl/GnM4rFdFuXwcAmvLA
https://goo.gl/maps/abc123
```
- Sistema sigue el redirect automáticamente
- Extrae Place ID de la URL expandida

### ✅ URLs con place_id en query
```
https://www.google.com/maps/place/?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4
```
- Place ID en formato `ChIJ...` (estándar)

### ✅ URLs con Place ID codificado
```
https://www.google.com/maps/place/.../@-31.53,-68.56,17z/data=!4m6!3m5!1s0x...:0x...!16s%2Fg%2F11m5fxktlk
```
- Place ID en formato `/g/11m5fxktlk` (codificado como `!16s%2Fg%2F`)

### ✅ URLs con Feature ID
```
https://www.google.com/maps/@-34.123,-58.456/data=!1s0x9681411e668775b7:0xc3284df363e157a1
```
- Feature ID en formato `0xHEX:0xHEX`
- Funciona directamente con Places API

### ✅ URLs con CID
```
https://www.google.com/maps?cid=12345678901234567890
```
- Customer ID numérico  

## Flujo con API Key configurada

1. Usuario pega URL de Google Maps
2. Sistema extrae Place ID y consulta Places API
3. **Validación**: Si NO es estación de servicio → Error inmediato
4. **Si es válida**: Auto-completa nombre, dirección, teléfono, horarios
5. Usuario solo revisa/ajusta los datos

## Degradación graciosa (sin API Key)

Si no configuras la API key, el sistema sigue funcionando:
- ⚠️ Sin validación automática
- ⚠️ Sin auto-completado
- ✅ Extracción manual de coordenadas sigue disponible
- ℹ️ Los usuarios ven un mensaje informativo

## Costo estimado

El sistema optimiza costos usando extracción directa cuando es posible:

### Escenario Optimista (mayoría de casos)
**Método directo** - Solo Place Details:
- **Precio**: ~$0.017 USD por estación
- **Costo mensual**: Con 100 estaciones/mes → ~$1.70 USD
- **Costo mensual**: Con 500 estaciones/mes → ~$8.50 USD

### Escenario con Nearby Search (cuando es necesario)
**Método con selector** - Nearby Search + Place Details:
- **Nearby Search**: $0.032 USD
- **Place Details**: $0.017 USD
- **Total**: ~$0.049 USD por estación
- **Costo mensual**: Con 100 estaciones/mes → ~$4.90 USD
- **Costo mensual**: Con 500 estaciones/mes → ~$24.50 USD

### Costo Real Esperado (mix de métodos)
Asumiendo 70% directo, 30% nearby:
- **100 estaciones/mes**: ~$2.66 USD/mes
- **500 estaciones/mes**: ~$13.28 USD/mes

> 💡 **Consejo**: Google Cloud ofrece $200 USD de crédito gratis para nuevos usuarios

## Cómo Funciona la Extracción

El sistema utiliza **dos métodos inteligentes** para máxima compatibilidad:

### Método 1: Extracción Directa de Place ID (Más rápido)

1. **Usuario pega URL** (cualquier formato de Google Maps)
2. **Sistema sigue redirects** si es URL corta (goo.gl)
3. **Extrae Place ID** usando múltiples patrones de regex
4. **Si encuentra Place ID** → Llamada directa a Place Details API
5. **Validación**: Verifica que sea tipo `gas_station`
6. **Auto-completado**: Llena todos los campos del formulario

**Costo**: $0.017 USD | **Velocidad**: Rápido (1 request)

### Método 2: Nearby Search (Fallback robusto)

Cuando no se puede extraer Place ID de la URL:

1. **Extrae coordenadas** de la URL (siempre funciona ✓)
2. **Llamada a Nearby Search API** (radio 100-250m, tipo `gas_station`)
3. **Muestra selector** con 2-5 estaciones cercanas encontradas
4. **Usuario selecciona** la correcta
5. **Llamada a Place Details** con el Place ID seleccionado
6. **Auto-completado** completo del formulario

**Costo**: $0.049 USD | **Velocidad**: Medio (2 requests) | **Tasa éxito**: 100%

### Flujo Visual para el Usuario

```
URL corta → [Extraer] → Selector aparece:
┌─────────────────────────────────────────┐
│ Selecciona tu Estación                  │
│                                          │
│ ○ YPF - Av. San Martín 123              │
│   San Juan, San Juan                    │
│   📍 45 metros de distancia              │
│                                          │
│ ● Shell - Av. San Martín 145            │
│   San Juan, San Juan                    │
│   📍 78 metros de distancia              │
│                                          │
│ [Confirmar y Auto-completar Datos]      │
└─────────────────────────────────────────┘
```

### Formatos de Place ID detectados automáticamente:

| Formato | Ejemplo | Método | Prioridad |
|---------|---------|--------|-----------|
| Query parameter | `place_id=ChIJ...` | Directo | Alta |
| Place ID corto | `!16s%2Fg%2F11m5fxktlk` | Directo | Alta |
| ChIJ estándar | `ChIJN1t_tDeuEmsRUsoyG83frY4` | Directo | Media |
| Feature ID | `!1s0x123:0x456` | Directo | Media |
| Coordenadas solas | `@-31.53,-68.56` | Nearby | Fallback |
| CID numérico | `cid=12345...` | Directo | Baja |

## Paso 1: Crear cuenta en Google Cloud Platform

1. Accede a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Acepta los términos de servicio
4. Si es tu primera vez, obtendrás $200 USD de crédito gratis

## Paso 2: Crear un nuevo proyecto

1. En el menú superior, haz click en el selector de proyectos
2. Click en "Nuevo proyecto"
3. Nombre: `DondeCargo` (o el que prefieras)
4. Click en "Crear"
5. Espera a que se cree el proyecto y selecciónalo

## Paso 3: Habilitar Places API

1. En el menú lateral, ve a: **APIs y servicios > Biblioteca**
2. Busca: `Places API`
3. Click en **Places API** (no "Places API (New)")
4. Click en botón **"Habilitar"**
5. Espera unos segundos a que se habilite

## Paso 4: Crear una API Key

1. Ve a: **APIs y servicios > Credenciales**
2. Click en **"+ CREAR CREDENCIALES"** → **Clave de API**
3. Se creará una API key
4. **¡IMPORTANTE!** No cierres todavía, ahora debes restringir la key

## Paso 5: Restringir la API Key (Seguridad)

### 5.1 Restricciones de aplicación

1. En la pantalla de la API key, click en **"Editar clave de API"**
2. En "Restricciones de aplicación", selecciona: **Referentes HTTP (sitios web)**
3. Click en **"Agregar un elemento"**
4. Agrega tus dominios:
   ```
   https://tu-dominio.com/*
   https://*.vercel.app/*
   http://localhost:3000/*
   ```
5. Agrega cada dominio por separado

### 5.2 Restricciones de API

1. En "Restricciones de API", selecciona: **Restringir clave**
2. En el menú desplegable, busca y selecciona: **Places API**
3. Click en **"Guardar"**

## Paso 6: Configurar variable de entorno

### Producción (Vercel)

1. Accede a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Ve a: **Settings → Environment Variables**
3. Agrega nueva variable:
   - **Name**: `GOOGLE_MAPS_API_KEY`
   - **Value**: `tu-api-key-aqui`
   - **Environment**: Production, Preview, Development
4. Click en **"Save"**
5. **Redeploy** tu aplicación para aplicar los cambios

### Desarrollo local

1. Abre tu archivo `.env.local` (o créalo si no existe)
2. Agrega la línea:
   ```bash
   GOOGLE_MAPS_API_KEY=tu-api-key-aqui
   ```
3. Guarda el archivo
4. Reinicia el servidor de desarrollo: `pnpm dev`

## Paso 7: Verificar que funciona

### Prueba 1: Verificar configuración

1. Inicia sesión en tu aplicación
2. Ve a: `/crear-estacion`
3. Pega una URL de Google Maps de una estación de servicio real
4. Click en "Extraer Coordenadas"
5. **Resultado esperado**: 
   - ✅ Badge verde: "Estación de servicio verificada"
   - ✅ Campos auto-completados

### Prueba 2: Verificar validación

1. Pega una URL de un lugar que NO sea estación (ej: restaurante)
2. Click en "Extraer Coordenadas"
3. **Resultado esperado**:
   - ❌ Error rojo: "Este lugar no es una estación de servicio"
   - ❌ Botón submit deshabilitado

## Solución de problemas

### Error: "Google Places API returned status: REQUEST_DENIED"

**Causa**: La API key no tiene permisos o Places API no está habilitada

**Solución**:
1. Verifica que Places API esté habilitada en tu proyecto
2. Verifica que la API key tenga Places API en las restricciones
3. Espera unos minutos (puede tomar tiempo propagarse)

### Error: "This API project is not authorized to use this API"

**Causa**: Places API no está habilitada para tu proyecto

**Solución**:
1. Ve a Google Cloud Console
2. Habilita Places API para tu proyecto
3. Espera 5-10 minutos

### Warning: "Validación automática no disponible"

**Causa**: La variable de entorno `GOOGLE_MAPS_API_KEY` no está configurada

**Solución**:
1. Verifica que agregaste la variable en `.env.local` (desarrollo)
2. Verifica que agregaste la variable en Vercel (producción)
3. Reinicia el servidor de desarrollo
4. Redeploy en Vercel

### Error 429: "Rate limit exceeded"

**Causa**: Demasiadas requests en poco tiempo

**Solución**:
1. Verifica que no haya loops infinitos en el código
2. Considera implementar rate limiting en tu aplicación
3. Revisa el uso en Google Cloud Console

## Monitoreo de uso y costos

### Ver uso de la API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a: **APIs y servicios → Panel de control**
4. Click en **Places API** para ver detalles
5. Aquí verás:
   - Requests por día
   - Errores
   - Latencia promedio

### Ver costos

1. Ve a: **Facturación → Informes**
2. Filtra por: Places API
3. Revisa el gráfico de costos diarios

### Configurar alertas de presupuesto

1. Ve a: **Facturación → Presupuestos y alertas**
2. Click en **"Crear presupuesto"**
3. Configura:
   - Nombre: "DondeCargo API Budget"
   - Monto: $10 USD/mes (ajusta según necesites)
   - Umbral de alerta: 50%, 90%, 100%
4. Agrega tu email para recibir alertas

## Mejores prácticas de seguridad

### ✅ Hacer

- Usar restricciones de referentes HTTP
- Restringir a solo Places API
- Rotar la API key cada 6 meses
- Monitorear uso regularmente
- Usar diferentes keys para dev/prod

### ❌ No hacer

- Exponer la API key en el código del cliente
- Commitear la API key en Git
- Usar la misma key sin restricciones
- Dejar la key sin monitoreo
- Compartir la key públicamente

## Alternativas y consideraciones

### Opción 1: Solo validación (actual)

**Costo**: ~$0.017 por estación  
**Beneficios**: Validación + Auto-completado  
**Recomendado para**: Uso general

### Opción 2: Sin API (fallback)

**Costo**: $0  
**Beneficios**: Funcionalidad básica  
**Limitaciones**: Sin validación automática  
**Recomendado para**: Testing, desarrollo inicial

### Opción 3: API + caché agresivo

**Costo**: Reducido significativamente  
**Implementación**: Cachear results de Places API por URL  
**Beneficios**: Mismo lugar no se consulta dos veces  
**Recomendado para**: Alto volumen

## Soporte y recursos

- [Documentación oficial Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Precios de Places API](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Ejemplos de código](https://github.com/googlemaps/google-maps-services-js)
- [Stack Overflow - Google Places API](https://stackoverflow.com/questions/tagged/google-places-api)

## Preguntas frecuentes

**P: ¿Necesito tarjeta de crédito?**  
R: Sí, pero Google no cobrará sin tu autorización. Recibirás $200 de crédito gratis.

**P: ¿Qué pasa si se acaba el crédito gratis?**  
R: Debes habilitar facturación manualmente. Sin habilitarla, la API dejará de funcionar.

**P: ¿Puedo usar otra API de geocoding?**  
R: Sí, pero perderías la validación de tipo de negocio (gas_station).

**P: ¿Los datos de Places API son siempre correctos?**  
R: Generalmente sí, pero pueden haber errores. Por eso hay moderación de admin.

**P: ¿Puedo desactivar Places API después?**  
R: Sí, solo elimina la variable de entorno y el sistema usará el modo fallback.

---

**Última actualización**: Noviembre 2024  
**Mantenido por**: Equipo DondeCargo

