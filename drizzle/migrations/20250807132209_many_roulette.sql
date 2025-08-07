CREATE TABLE "confirmaciones_precios" (
	"id" text PRIMARY KEY NOT NULL,
	"precio_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP CONSTRAINT "reportes_precios_revisado_por_user_id_fk";
--> statement-breakpoint
DROP INDEX "reportes_precios_estado_idx";--> statement-breakpoint
ALTER TABLE "confirmaciones_precios" ADD CONSTRAINT "confirmaciones_precios_precio_id_precios_id_fk" FOREIGN KEY ("precio_id") REFERENCES "public"."precios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmaciones_precios" ADD CONSTRAINT "confirmaciones_precios_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confirmaciones_precios_precio_usuario_idx" ON "confirmaciones_precios" USING btree ("precio_id","usuario_id");--> statement-breakpoint
CREATE INDEX "confirmaciones_precios_usuario_idx" ON "confirmaciones_precios" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "confirmaciones_precios_precio_idx" ON "confirmaciones_precios" USING btree ("precio_id");--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP COLUMN "evidencia_url";--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP COLUMN "estado";--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP COLUMN "fecha_revision";--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP COLUMN "revisado_por";--> statement-breakpoint
ALTER TABLE "reportes_precios" DROP COLUMN "motivo_rechazo";