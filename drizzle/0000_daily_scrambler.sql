CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'credit', 'tfsa', 'rrsp', 'fhsa', 'resp', 'investment', 'cash');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "public"."budget_period" AS ENUM('weekly', 'biweekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."rule_field" AS ENUM('description', 'amount');--> statement-breakpoint
CREATE TYPE "public"."rule_operator" AS ENUM('contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"category_id" uuid NOT NULL,
	"period_type" "budget_period" DEFAULT 'monthly' NOT NULL,
	"period_start" timestamp NOT NULL,
	"amount_cents" integer NOT NULL,
	"carryover_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"type" "category_type" NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorization_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"field" "rule_field" DEFAULT 'description' NOT NULL,
	"operator" "rule_operator" DEFAULT 'contains' NOT NULL,
	"value" text NOT NULL,
	"category_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"institution" text,
	"last4" text,
	"notes" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"name" text NOT NULL,
	"target_amount_cents" integer NOT NULL,
	"current_amount_cents" integer DEFAULT 0 NOT NULL,
	"target_date" timestamp,
	"linked_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_family_name_unique" UNIQUE("family_id","name")
);
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"transaction_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "transaction_tags_transaction_id_tag_id_pk" PRIMARY KEY("transaction_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"family_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"date" timestamp NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid,
	"notes" text,
	"import_hash" text,
	"transfer_id" uuid,
	"reviewed" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_log_family_idx" ON "audit_log" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "budgets_family_idx" ON "budgets" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "categories_family_idx" ON "categories" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "categorization_rules_family_idx" ON "categorization_rules" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "categorization_rules_priority_idx" ON "categorization_rules" USING btree ("family_id","priority");--> statement-breakpoint
CREATE INDEX "financial_accounts_family_idx" ON "financial_accounts" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "savings_goals_family_idx" ON "savings_goals" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "tags_family_idx" ON "tags" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "transactions_family_idx" ON "transactions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_import_hash_idx" ON "transactions" USING btree ("import_hash");