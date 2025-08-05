CREATE TABLE "estaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"idempresa" text NOT NULL,
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
	"fecha_actualizacion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estaciones_idempresa_unique" UNIQUE("idempresa")
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
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "oauth_access_token_access_token_unique" UNIQUE("access_token"),
	CONSTRAINT "oauth_access_token_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "oauth_application" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"icon" text,
	"metadata" text,
	"client_id" text,
	"client_secret" text,
	"redirect_u_r_ls" text,
	"type" text,
	"disabled" boolean,
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "oauth_application_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"consent_given" boolean
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
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
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estaciones_lat_lng_idx" ON "estaciones" USING btree ("latitud","longitud");--> statement-breakpoint
CREATE INDEX "estaciones_provincia_localidad_idx" ON "estaciones" USING btree ("provincia","localidad");--> statement-breakpoint
CREATE INDEX "estaciones_empresa_idx" ON "estaciones" USING btree ("empresa");--> statement-breakpoint
CREATE INDEX "estaciones_cuit_idx" ON "estaciones" USING btree ("cuit");--> statement-breakpoint
CREATE INDEX "estaciones_idempresa_idx" ON "estaciones" USING btree ("idempresa");--> statement-breakpoint
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