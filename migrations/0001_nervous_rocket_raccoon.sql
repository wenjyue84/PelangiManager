CREATE TABLE "capsules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"section" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"problem_description" text,
	CONSTRAINT "capsules_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "payment_amount" text NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "payment_method" text NOT NULL;