CREATE TABLE "moderaciones_estaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"estacion_id" text NOT NULL,
	"moderador_id" text,
	"accion" text NOT NULL,
	"motivo" text,
	"fecha_moderacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moderaciones_estaciones" ADD CONSTRAINT "moderaciones_estaciones_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderaciones_estaciones" ADD CONSTRAINT "moderaciones_estaciones_moderador_id_user_id_fk" FOREIGN KEY ("moderador_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderaciones_estaciones_estacion_idx" ON "moderaciones_estaciones" USING btree ("estacion_id");--> statement-breakpoint
CREATE INDEX "moderaciones_estaciones_moderador_idx" ON "moderaciones_estaciones" USING btree ("moderador_id");--> statement-breakpoint
CREATE INDEX "moderaciones_estaciones_fecha_idx" ON "moderaciones_estaciones" USING btree ("fecha_moderacion");