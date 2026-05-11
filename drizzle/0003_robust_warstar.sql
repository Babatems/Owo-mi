CREATE TYPE "public"."connection_status" AS ENUM('pending', 'active', 'login_required', 'permission_revoked', 'expired', 'error', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('plaid', 'flinks', 'manual');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."txn_status" AS ENUM('pending', 'posted', 'removed');--> statement-breakpoint
CREATE TABLE "account_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_account_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_mappings_bank_account_unique" UNIQUE("bank_account_id")
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"family_id" text NOT NULL,
	"external_account_id" text NOT NULL,
	"name" text NOT NULL,
	"official_name" text,
	"mask" text,
	"type" text NOT NULL,
	"subtype" text,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"current_balance" numeric(12, 2),
	"available_balance" numeric(12, 2),
	"limit_amount" numeric(12, 2),
	"balance_updated_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_connection_external" UNIQUE("connection_id","external_account_id")
);
--> statement-breakpoint
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider" "provider" NOT NULL,
	"institution_id" uuid NOT NULL,
	"external_item_id" text NOT NULL,
	"cursor" text,
	"consent_expires_at" timestamp,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"error_message" text,
	"last_successful_sync_at" timestamp,
	"last_sync_attempt_at" timestamp,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_connections_provider_item" UNIQUE("provider","external_item_id")
);
--> statement-breakpoint
CREATE TABLE "connection_secrets" (
	"connection_id" uuid PRIMARY KEY NOT NULL,
	"key_version" smallint DEFAULT 1 NOT NULL,
	"wrapped_dek" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"ciphertext_access_token" text NOT NULL,
	"ciphertext_refresh_token" text,
	"rotated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"primary_color" text,
	"logo_url" text,
	"oauth_supported" boolean DEFAULT false NOT NULL,
	"country" text DEFAULT 'CA' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_provider_external_id" UNIQUE("provider","external_id")
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"txns_added" integer DEFAULT 0 NOT NULL,
	"txns_modified" integer DEFAULT 0 NOT NULL,
	"txns_removed" integer DEFAULT 0 NOT NULL,
	"cursor_before" text,
	"cursor_after" text,
	"error_code" text,
	"error_message" text,
	"context" jsonb
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"webhook_type" text NOT NULL,
	"webhook_code" text NOT NULL,
	"external_item_id" text,
	"idempotency_key" text NOT NULL,
	"signature_valid" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"payload" jsonb,
	"headers" jsonb,
	CONSTRAINT "webhook_events_idempotency_key" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "external_transaction_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "pending_external_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "txn_status" "txn_status" DEFAULT 'posted';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant_name" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_channel" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "raw" jsonb;--> statement-breakpoint
CREATE INDEX "account_mappings_user_account_idx" ON "account_mappings" USING btree ("user_account_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_connection_idx" ON "bank_accounts" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_family_idx" ON "bank_accounts" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "bank_connections_family_idx" ON "bank_connections" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "sync_history_connection_idx" ON "sync_history" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "webhook_events_item_idx" ON "webhook_events" USING btree ("external_item_id");--> statement-breakpoint
CREATE INDEX "transactions_bank_account_idx" ON "transactions" USING btree ("bank_account_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "txn_plaid_dedup" UNIQUE("bank_account_id","external_transaction_id");