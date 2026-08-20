import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_block_arrangement" ADD VALUE 'featuredSide' BEFORE 'masonry';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blk" ALTER COLUMN "arrangement" SET DATA TYPE text;
  ALTER TABLE "blk" ALTER COLUMN "arrangement" SET DEFAULT 'grid'::text;
  ALTER TABLE "_blk_v" ALTER COLUMN "arrangement" SET DATA TYPE text;
  ALTER TABLE "_blk_v" ALTER COLUMN "arrangement" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_block_arrangement";
  CREATE TYPE "public"."enum_block_arrangement" AS ENUM('grid', 'carousel', 'featured', 'masonry');
  ALTER TABLE "blk" ALTER COLUMN "arrangement" SET DEFAULT 'grid'::"public"."enum_block_arrangement";
  ALTER TABLE "blk" ALTER COLUMN "arrangement" SET DATA TYPE "public"."enum_block_arrangement" USING "arrangement"::"public"."enum_block_arrangement";
  ALTER TABLE "_blk_v" ALTER COLUMN "arrangement" SET DEFAULT 'grid'::"public"."enum_block_arrangement";
  ALTER TABLE "_blk_v" ALTER COLUMN "arrangement" SET DATA TYPE "public"."enum_block_arrangement" USING "arrangement"::"public"."enum_block_arrangement";`)
}
