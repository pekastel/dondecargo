CREATE TABLE "estaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"empresa" text NOT NULL,
	"cuit" text NOT NULL,
	"direccion" text NOT NULL,
	"localidad" text NOT NULL,
	"provincia" text NOT NULL,
	"region" text NOT NULL,
	"latitud" double precision NOT NULL,
	"longitud" double precision NOT NULL,
	"geojson" json,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"fecha_actualizacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favoritos" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"estacion_id" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "precios" (
	"id" text PRIMARY KEY NOT NULL,
	"estacion_id" text NOT NULL,
	"tipo_combustible" text NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"horario" text NOT NULL,
	"fecha_vigencia" timestamp NOT NULL,
	"fuente" text NOT NULL,
	"usuario_id" text,
	"es_validado" boolean DEFAULT false NOT NULL,
	"fecha_reporte" timestamp DEFAULT now() NOT NULL,
	"notas" text,
	"evidencia_url" text
);
--> statement-breakpoint
CREATE TABLE "precios_historico" (
	"id" text PRIMARY KEY NOT NULL,
	"estacion_id" text NOT NULL,
	"tipo_combustible" text NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"horario" text NOT NULL,
	"fecha_vigencia" timestamp NOT NULL,
	"fuente" text NOT NULL,
	"usuario_id" text,
	"es_validado" boolean NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportes_precios" (
	"id" text PRIMARY KEY NOT NULL,
	"estacion_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"tipo_combustible" text NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"horario" text NOT NULL,
	"notas" text,
	"evidencia_url" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"fecha_revision" timestamp,
	"revisado_por" text,
	"motivo_rechazo" text
);
--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios" ADD CONSTRAINT "precios_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios" ADD CONSTRAINT "precios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios_historico" ADD CONSTRAINT "precios_historico_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios_historico" ADD CONSTRAINT "precios_historico_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_precios" ADD CONSTRAINT "reportes_precios_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_precios" ADD CONSTRAINT "reportes_precios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_precios" ADD CONSTRAINT "reportes_precios_revisado_por_user_id_fk" FOREIGN KEY ("revisado_por") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estaciones_lat_lng_idx" ON "estaciones" USING btree ("latitud","longitud");--> statement-breakpoint
CREATE INDEX "estaciones_provincia_localidad_idx" ON "estaciones" USING btree ("provincia","localidad");--> statement-breakpoint
CREATE INDEX "estaciones_empresa_idx" ON "estaciones" USING btree ("empresa");--> statement-breakpoint
CREATE INDEX "estaciones_cuit_idx" ON "estaciones" USING btree ("cuit");--> statement-breakpoint
CREATE INDEX "favoritos_usuario_estacion_idx" ON "favoritos" USING btree ("usuario_id","estacion_id");--> statement-breakpoint
CREATE INDEX "precios_estacion_tipo_combustible_idx" ON "precios" USING btree ("estacion_id","tipo_combustible");--> statement-breakpoint
CREATE INDEX "precios_fecha_vigencia_idx" ON "precios" USING btree ("fecha_vigencia");--> statement-breakpoint
CREATE INDEX "precios_fuente_idx" ON "precios" USING btree ("fuente");--> statement-breakpoint
CREATE INDEX "precios_usuario_idx" ON "precios" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "precios_validado_idx" ON "precios" USING btree ("es_validado");--> statement-breakpoint
CREATE INDEX "precios_historico_estacion_tipo_fecha_idx" ON "precios_historico" USING btree ("estacion_id","tipo_combustible","fecha_vigencia");--> statement-breakpoint
CREATE INDEX "precios_historico_fecha_vigencia_idx" ON "precios_historico" USING btree ("fecha_vigencia");--> statement-breakpoint
CREATE INDEX "reportes_precios_usuario_idx" ON "reportes_precios" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "reportes_precios_estado_idx" ON "reportes_precios" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "reportes_precios_estacion_idx" ON "reportes_precios" USING btree ("estacion_id");--> statement-breakpoint
CREATE INDEX "reportes_precios_fecha_creacion_idx" ON "reportes_precios" USING btree ("fecha_creacion");