import { pgTable, text, timestamp, boolean, integer, decimal, doublePrecision, json, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
// Import Better Auth schema to prevent Drizzle from dropping those tables
import * as betterAuthSchema from './better-auth-schema';

// Export Better Auth schema for Drizzle awareness
export * from './better-auth-schema';

// Estaciones de servicio
export const estaciones = pgTable('estaciones', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  idempresa: text('idempresa').notNull().unique(),
  nombre: text('nombre').notNull(),
  empresa: text('empresa').notNull(),
  cuit: text('cuit').notNull(),
  direccion: text('direccion').notNull(),
  localidad: text('localidad').notNull(),
  provincia: text('provincia').notNull(),
  region: text('region').notNull(),
  latitud: doublePrecision('latitud').notNull(),
  longitud: doublePrecision('longitud').notNull(),
  geojson: json('geojson'),
  fuente: text('fuente', { enum: ['oficial', 'usuario'] }).notNull().default('oficial'),
  estado: text('estado', { enum: ['pendiente', 'aprobado', 'rechazado'] }).notNull().default('aprobado'),
  usuarioCreadorId: text('usuario_creador_id').references(() => betterAuthSchema.user.id, { onDelete: 'set null' }),
  googleMapsUrl: text('google_maps_url'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
  fechaActualizacion: timestamp('fecha_actualizacion').defaultNow().notNull(),
}, (table) => ({
  latLngIdx: index('estaciones_lat_lng_idx').on(table.latitud, table.longitud),
  provinciaLocalidadIdx: index('estaciones_provincia_localidad_idx').on(table.provincia, table.localidad),
  empresaIdx: index('estaciones_empresa_idx').on(table.empresa),
  cuitIdx: index('estaciones_cuit_idx').on(table.cuit),
  idempresaIdx: index('estaciones_idempresa_idx').on(table.idempresa),
  fuenteIdx: index('estaciones_fuente_idx').on(table.fuente),
  estadoIdx: index('estaciones_estado_idx').on(table.estado),
  usuarioCreadorIdx: index('estaciones_usuario_creador_idx').on(table.usuarioCreadorId),
}));

// Datos adicionales de estaciones (horarios, teléfono, servicios)
export const estacionesDatosAdicionales = pgTable('estaciones_datos_adicionales', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull().unique(),
  horarios: json('horarios').$type<Record<string, string>>(),
  telefono: text('telefono'),
  servicios: json('servicios').$type<{
    tienda?: boolean;
    banios?: boolean;
    lavadero?: boolean;
    wifi?: boolean;
    restaurante?: boolean;
    estacionamiento?: boolean;
  }>(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
  fechaActualizacion: timestamp('fecha_actualizacion').defaultNow().notNull(),
}, (table) => ({
  estacionIdx: index('estaciones_datos_adicionales_estacion_idx').on(table.estacionId),
}));

// Precios de combustibles
export const precios = pgTable('precios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  tipoCombustible: text('tipo_combustible', { 
    enum: ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'] 
  }).notNull(),
  precio: decimal('precio', { precision: 10, scale: 2 }).notNull(),
  horario: text('horario', { enum: ['diurno', 'nocturno'] }).notNull(),
  fechaVigencia: timestamp('fecha_vigencia').notNull(),
  fuente: text('fuente', { enum: ['oficial', 'usuario'] }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'set null' }),
  esValidado: boolean('es_validado').default(false).notNull(),
  fechaReporte: timestamp('fecha_reporte').defaultNow().notNull(),
  notas: text('notas'),
  evidenciaUrl: text('evidencia_url'),
}, (table) => ({
  estacionTipoCombustibleIdx: index('precios_estacion_tipo_combustible_idx').on(table.estacionId, table.tipoCombustible),
  fechaVigenciaIdx: index('precios_fecha_vigencia_idx').on(table.fechaVigencia),
  fuenteIdx: index('precios_fuente_idx').on(table.fuente),
  usuarioIdx: index('precios_usuario_idx').on(table.usuarioId),
  validadoIdx: index('precios_validado_idx').on(table.esValidado),
  // Unique constraint to enable efficient upserts per (estacion, tipo, horario, fuente)
  estacionTipoHorarioFuenteUnique: uniqueIndex('precios_estacion_tipo_horario_fuente_unique')
    .on(table.estacionId, table.tipoCombustible, table.horario, table.fuente),
}));

// Histórico de precios (para tracking de cambios)
export const preciosHistorico = pgTable('precios_historico', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  tipoCombustible: text('tipo_combustible', { 
    enum: ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'] 
  }).notNull(),
  precio: decimal('precio', { precision: 10, scale: 2 }).notNull(),
  horario: text('horario', { enum: ['diurno', 'nocturno'] }).notNull(),
  fechaVigencia: timestamp('fecha_vigencia').notNull(),
  fuente: text('fuente', { enum: ['oficial', 'usuario'] }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'set null' }),
  esValidado: boolean('es_validado').notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  estacionTipoFechaIdx: index('precios_historico_estacion_tipo_fecha_idx').on(table.estacionId, table.tipoCombustible, table.fechaVigencia),
  fechaVigenciaIdx: index('precios_historico_fecha_vigencia_idx').on(table.fechaVigencia),
}));

// Reportes de precios por usuarios
export const reportesPrecios = pgTable('reportes_precios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  tipoCombustible: text('tipo_combustible', { 
    enum: ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'] 
  }).notNull(),
  precio: decimal('precio', { precision: 10, scale: 2 }).notNull(),
  horario: text('horario', { enum: ['diurno', 'nocturno'] }).notNull(),
  notas: text('notas'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  usuarioIdx: index('reportes_precios_usuario_idx').on(table.usuarioId),
  estacionIdx: index('reportes_precios_estacion_idx').on(table.estacionId),
  fechaCreacionIdx: index('reportes_precios_fecha_creacion_idx').on(table.fechaCreacion),
}));

// Confirmaciones de precios reportados por usuarios (sistema de likes/social validation)
export const confirmacionesPrecios = pgTable('confirmaciones_precios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  precioId: text('precio_id').references(() => precios.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  precioUsuarioIdx: index('confirmaciones_precios_precio_usuario_idx').on(table.precioId, table.usuarioId),
  usuarioIdx: index('confirmaciones_precios_usuario_idx').on(table.usuarioId),
  precioIdx: index('confirmaciones_precios_precio_idx').on(table.precioId),
}))

// Favoritos de usuarios (estaciones guardadas)
export const favoritos = pgTable('favoritos', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  usuarioEstacionIdx: index('favoritos_usuario_estacion_idx').on(table.usuarioId, table.estacionId),
}));

// Comentarios de usuarios en estaciones
export const comentarios = pgTable('comentarios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  comentario: text('comentario').notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
  fechaActualizacion: timestamp('fecha_actualizacion').defaultNow().notNull(),
}, (table) => ({
  usuarioEstacionIdx: index('comentarios_usuario_estacion_idx').on(table.usuarioId, table.estacionId),
  estacionIdx: index('comentarios_estacion_idx').on(table.estacionId),
  fechaCreacionIdx: index('comentarios_fecha_creacion_idx').on(table.fechaCreacion),
  // Unique constraint: solo un comentario por usuario por estación
  usuarioEstacionUnique: uniqueIndex('comentarios_usuario_estacion_unique')
    .on(table.usuarioId, table.estacionId),
}));

// Votos de comentarios (sistema de "es útil")
export const votosComentarios = pgTable('votos_comentarios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  comentarioId: text('comentario_id').references(() => comentarios.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  comentarioUsuarioIdx: index('votos_comentarios_comentario_usuario_idx').on(table.comentarioId, table.usuarioId),
  comentarioIdx: index('votos_comentarios_comentario_idx').on(table.comentarioId),
  usuarioIdx: index('votos_comentarios_usuario_idx').on(table.usuarioId),
  // Unique constraint: un voto por usuario por comentario
  comentarioUsuarioUnique: uniqueIndex('votos_comentarios_comentario_usuario_unique')
    .on(table.comentarioId, table.usuarioId),
}));

// Reportes de comentarios (denuncias)
export const reportesComentarios = pgTable('reportes_comentarios', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  comentarioId: text('comentario_id').references(() => comentarios.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  motivo: text('motivo', { 
    enum: ['spam', 'contenido_inapropiado', 'informacion_falsa', 'otro'] 
  }).notNull(),
  observaciones: text('observaciones'),
  estado: text('estado', { 
    enum: ['pendiente', 'revisado', 'resuelto'] 
  }).default('pendiente').notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  comentarioIdx: index('reportes_comentarios_comentario_idx').on(table.comentarioId),
  usuarioIdx: index('reportes_comentarios_usuario_idx').on(table.usuarioId),
  estadoIdx: index('reportes_comentarios_estado_idx').on(table.estado),
  fechaCreacionIdx: index('reportes_comentarios_fecha_creacion_idx').on(table.fechaCreacion),
}));

// Relaciones
export const estacionesRelations = relations(estaciones, ({ one, many }) => ({
  precios: many(precios),
  preciosHistorico: many(preciosHistorico),
  reportesPrecios: many(reportesPrecios),
  favoritos: many(favoritos),
  comentarios: many(comentarios),
  datosAdicionales: one(estacionesDatosAdicionales, {
    fields: [estaciones.id],
    references: [estacionesDatosAdicionales.estacionId],
  }),
  usuarioCreador: one(betterAuthSchema.user, {
    fields: [estaciones.usuarioCreadorId],
    references: [betterAuthSchema.user.id],
  }),
}));

export const estacionesDatosAdicionalesRelations = relations(estacionesDatosAdicionales, ({ one }) => ({
  estacion: one(estaciones, {
    fields: [estacionesDatosAdicionales.estacionId],
    references: [estaciones.id],
  }),
}));

export const preciosRelations = relations(precios, ({ one, many }) => ({
  estacion: one(estaciones, {
    fields: [precios.estacionId],
    references: [estaciones.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [precios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
  confirmaciones: many(confirmacionesPrecios),
}));

export const preciosHistoricoRelations = relations(preciosHistorico, ({ one }) => ({
  estacion: one(estaciones, {
    fields: [preciosHistorico.estacionId],
    references: [estaciones.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [preciosHistorico.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
}));

export const reportesPreciosRelations = relations(reportesPrecios, ({ one }) => ({
  estacion: one(estaciones, {
    fields: [reportesPrecios.estacionId],
    references: [estaciones.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [reportesPrecios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
}));

export const confirmacionesPreciosRelations = relations(confirmacionesPrecios, ({ one }) => ({
  precio: one(precios, {
    fields: [confirmacionesPrecios.precioId],
    references: [precios.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [confirmacionesPrecios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
}))

export const favoritosRelations = relations(favoritos, ({ one }) => ({
  usuario: one(betterAuthSchema.user, {
    fields: [favoritos.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
  estacion: one(estaciones, {
    fields: [favoritos.estacionId],
    references: [estaciones.id],
  }),
}));

export const comentariosRelations = relations(comentarios, ({ one, many }) => ({
  usuario: one(betterAuthSchema.user, {
    fields: [comentarios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
  estacion: one(estaciones, {
    fields: [comentarios.estacionId],
    references: [estaciones.id],
  }),
  votos: many(votosComentarios),
  reportes: many(reportesComentarios),
}));

export const votosComentariosRelations = relations(votosComentarios, ({ one }) => ({
  comentario: one(comentarios, {
    fields: [votosComentarios.comentarioId],
    references: [comentarios.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [votosComentarios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
}));

export const reportesComentariosRelations = relations(reportesComentarios, ({ one }) => ({
  comentario: one(comentarios, {
    fields: [reportesComentarios.comentarioId],
    references: [comentarios.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [reportesComentarios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
}));

// Tipos TypeScript derivados del esquema
export type Estacion = typeof estaciones.$inferSelect;
export type NuevaEstacion = typeof estaciones.$inferInsert;
export type EstacionDatosAdicionales = typeof estacionesDatosAdicionales.$inferSelect;
export type NuevaEstacionDatosAdicionales = typeof estacionesDatosAdicionales.$inferInsert;
export type Precio = typeof precios.$inferSelect;
export type NuevoPrecio = typeof precios.$inferInsert;
export type PrecioHistorico = typeof preciosHistorico.$inferSelect;
export type NuevoPrecioHistorico = typeof preciosHistorico.$inferInsert;
export type ReportePrecio = typeof reportesPrecios.$inferSelect;
export type NuevoReportePrecio = typeof reportesPrecios.$inferInsert;
export type ConfirmacionPrecio = typeof confirmacionesPrecios.$inferSelect;
export type NuevaConfirmacionPrecio = typeof confirmacionesPrecios.$inferInsert;
export type Favorito = typeof favoritos.$inferSelect;
export type NuevoFavorito = typeof favoritos.$inferInsert;
export type Comentario = typeof comentarios.$inferSelect;
export type NuevoComentario = typeof comentarios.$inferInsert;
export type VotoComentario = typeof votosComentarios.$inferSelect;
export type NuevoVotoComentario = typeof votosComentarios.$inferInsert;
export type ReporteComentario = typeof reportesComentarios.$inferSelect;
export type NuevoReporteComentario = typeof reportesComentarios.$inferInsert;