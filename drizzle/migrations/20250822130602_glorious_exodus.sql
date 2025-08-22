CREATE TABLE "reportes_comentarios" (
	"id" text PRIMARY KEY NOT NULL,
	"comentario_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"motivo" text NOT NULL,
	"observaciones" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votos_comentarios" (
	"id" text PRIMARY KEY NOT NULL,
	"comentario_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reportes_comentarios" ADD CONSTRAINT "reportes_comentarios_comentario_id_comentarios_id_fk" FOREIGN KEY ("comentario_id") REFERENCES "public"."comentarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_comentarios" ADD CONSTRAINT "reportes_comentarios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votos_comentarios" ADD CONSTRAINT "votos_comentarios_comentario_id_comentarios_id_fk" FOREIGN KEY ("comentario_id") REFERENCES "public"."comentarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votos_comentarios" ADD CONSTRAINT "votos_comentarios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reportes_comentarios_comentario_idx" ON "reportes_comentarios" USING btree ("comentario_id");--> statement-breakpoint
CREATE INDEX "reportes_comentarios_usuario_idx" ON "reportes_comentarios" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "reportes_comentarios_estado_idx" ON "reportes_comentarios" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "reportes_comentarios_fecha_creacion_idx" ON "reportes_comentarios" USING btree ("fecha_creacion");--> statement-breakpoint
CREATE INDEX "votos_comentarios_comentario_usuario_idx" ON "votos_comentarios" USING btree ("comentario_id","usuario_id");--> statement-breakpoint
CREATE INDEX "votos_comentarios_comentario_idx" ON "votos_comentarios" USING btree ("comentario_id");--> statement-breakpoint
CREATE INDEX "votos_comentarios_usuario_idx" ON "votos_comentarios" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votos_comentarios_comentario_usuario_unique" ON "votos_comentarios" USING btree ("comentario_id","usuario_id");