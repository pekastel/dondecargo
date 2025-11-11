CREATE TABLE "estaciones_datos_adicionales" (
	"id" text PRIMARY KEY NOT NULL,
	"estacion_id" text NOT NULL,
	"horarios" json,
	"telefono" text,
	"servicios" json,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"fecha_actualizacion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estaciones_datos_adicionales_estacion_id_unique" UNIQUE("estacion_id")
);
--> statement-breakpoint
ALTER TABLE "estaciones" ADD COLUMN "fuente" text DEFAULT 'oficial' NOT NULL;--> statement-breakpoint
ALTER TABLE "estaciones" ADD COLUMN "estado" text DEFAULT 'aprobado' NOT NULL;--> statement-breakpoint
ALTER TABLE "estaciones" ADD COLUMN "usuario_creador_id" text;--> statement-breakpoint
ALTER TABLE "estaciones" ADD COLUMN "google_maps_url" text;--> statement-breakpoint
ALTER TABLE "estaciones_datos_adicionales" ADD CONSTRAINT "estaciones_datos_adicionales_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estaciones_datos_adicionales_estacion_idx" ON "estaciones_datos_adicionales" USING btree ("estacion_id");--> statement-breakpoint
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_usuario_creador_id_user_id_fk" FOREIGN KEY ("usuario_creador_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estaciones_fuente_idx" ON "estaciones" USING btree ("fuente");--> statement-breakpoint
CREATE INDEX "estaciones_estado_idx" ON "estaciones" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "estaciones_usuario_creador_idx" ON "estaciones" USING btree ("usuario_creador_id");