ALTER TABLE "financial_accounts" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_family_slug" UNIQUE("family_id","slug");