import { pgTable, text, timestamp, boolean, integer, decimal, doublePrecision, json, uuid, index } from 'drizzle-orm/pg-core';
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
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
  fechaActualizacion: timestamp('fecha_actualizacion').defaultNow().notNull(),
}, (table) => ({
  latLngIdx: index('estaciones_lat_lng_idx').on(table.latitud, table.longitud),
  provinciaLocalidadIdx: index('estaciones_provincia_localidad_idx').on(table.provincia, table.localidad),
  empresaIdx: index('estaciones_empresa_idx').on(table.empresa),
  cuitIdx: index('estaciones_cuit_idx').on(table.cuit),
  idempresaIdx: index('estaciones_idempresa_idx').on(table.idempresa),
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
  evidenciaUrl: text('evidencia_url'),
  estado: text('estado', { enum: ['pendiente', 'aprobado', 'rechazado'] }).default('pendiente').notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
  fechaRevision: timestamp('fecha_revision'),
  revisadoPor: text('revisado_por').references(() => betterAuthSchema.user.id, { onDelete: 'set null' }),
  motivoRechazo: text('motivo_rechazo'),
}, (table) => ({
  usuarioIdx: index('reportes_precios_usuario_idx').on(table.usuarioId),
  estadoIdx: index('reportes_precios_estado_idx').on(table.estado),
  estacionIdx: index('reportes_precios_estacion_idx').on(table.estacionId),
  fechaCreacionIdx: index('reportes_precios_fecha_creacion_idx').on(table.fechaCreacion),
}));

// Favoritos de usuarios (estaciones guardadas)
export const favoritos = pgTable('favoritos', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  usuarioId: text('usuario_id').references(() => betterAuthSchema.user.id, { onDelete: 'cascade' }).notNull(),
  estacionId: text('estacion_id').references(() => estaciones.id, { onDelete: 'cascade' }).notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
}, (table) => ({
  usuarioEstacionIdx: index('favoritos_usuario_estacion_idx').on(table.usuarioId, table.estacionId),
}));

// Relaciones
export const estacionesRelations = relations(estaciones, ({ many }) => ({
  precios: many(precios),
  preciosHistorico: many(preciosHistorico),
  reportesPrecios: many(reportesPrecios),
  favoritos: many(favoritos),
}));

export const preciosRelations = relations(precios, ({ one }) => ({
  estacion: one(estaciones, {
    fields: [precios.estacionId],
    references: [estaciones.id],
  }),
  usuario: one(betterAuthSchema.user, {
    fields: [precios.usuarioId],
    references: [betterAuthSchema.user.id],
  }),
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
  revisor: one(betterAuthSchema.user, {
    fields: [reportesPrecios.revisadoPor],
    references: [betterAuthSchema.user.id],
  }),
}));

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

// Tipos TypeScript derivados del esquema
export type Estacion = typeof estaciones.$inferSelect;
export type NuevaEstacion = typeof estaciones.$inferInsert;
export type Precio = typeof precios.$inferSelect;
export type NuevoPrecio = typeof precios.$inferInsert;
export type PrecioHistorico = typeof preciosHistorico.$inferSelect;
export type NuevoPrecioHistorico = typeof preciosHistorico.$inferInsert;
export type ReportePrecio = typeof reportesPrecios.$inferSelect;
export type NuevoReportePrecio = typeof reportesPrecios.$inferInsert;
export type Favorito = typeof favoritos.$inferSelect;
export type NuevoFavorito = typeof favoritos.$inferInsert;