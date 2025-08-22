CREATE TABLE "comentarios" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"estacion_id" text NOT NULL,
	"comentario" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"fecha_actualizacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_estacion_id_estaciones_id_fk" FOREIGN KEY ("estacion_id") REFERENCES "public"."estaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comentarios_usuario_estacion_idx" ON "comentarios" USING btree ("usuario_id","estacion_id");--> statement-breakpoint
CREATE INDEX "comentarios_estacion_idx" ON "comentarios" USING btree ("estacion_id");--> statement-breakpoint
CREATE INDEX "comentarios_fecha_creacion_idx" ON "comentarios" USING btree ("fecha_creacion");--> statement-breakpoint
CREATE UNIQUE INDEX "comentarios_usuario_estacion_unique" ON "comentarios" USING btree ("usuario_id","estacion_id");