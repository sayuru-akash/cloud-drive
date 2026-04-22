UPDATE "share_links" SET "mode" = 'download' WHERE "mode" = 'view';--> statement-breakpoint
ALTER TABLE "share_links" ALTER COLUMN "mode" SET DEFAULT 'download';--> statement-breakpoint
