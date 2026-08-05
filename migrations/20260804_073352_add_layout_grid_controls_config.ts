import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgc" ADD COLUMN "margin_pct" numeric DEFAULT 4.5;
  ALTER TABLE "lgc" ADD COLUMN "margin_adjustable" boolean DEFAULT true;
  ALTER TABLE "lgc" ADD COLUMN "gutter_x" numeric DEFAULT 75;
  ALTER TABLE "lgc" ADD COLUMN "gutter_x_adjustable" boolean DEFAULT true;
  ALTER TABLE "lgc" ADD COLUMN "gutter_y" numeric DEFAULT 75;
  ALTER TABLE "lgc" ADD COLUMN "gutter_y_adjustable" boolean DEFAULT true;
  ALTER TABLE "lgc" ADD COLUMN "guides_on" boolean DEFAULT true;
  ALTER TABLE "lgc" ADD COLUMN "guides_adjustable" boolean DEFAULT true;
  ALTER TABLE "_lgc_v" ADD COLUMN "margin_pct" numeric DEFAULT 4.5;
  ALTER TABLE "_lgc_v" ADD COLUMN "margin_adjustable" boolean DEFAULT true;
  ALTER TABLE "_lgc_v" ADD COLUMN "gutter_x" numeric DEFAULT 75;
  ALTER TABLE "_lgc_v" ADD COLUMN "gutter_x_adjustable" boolean DEFAULT true;
  ALTER TABLE "_lgc_v" ADD COLUMN "gutter_y" numeric DEFAULT 75;
  ALTER TABLE "_lgc_v" ADD COLUMN "gutter_y_adjustable" boolean DEFAULT true;
  ALTER TABLE "_lgc_v" ADD COLUMN "guides_on" boolean DEFAULT true;
  ALTER TABLE "_lgc_v" ADD COLUMN "guides_adjustable" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgc" DROP COLUMN "margin_pct";
  ALTER TABLE "lgc" DROP COLUMN "margin_adjustable";
  ALTER TABLE "lgc" DROP COLUMN "gutter_x";
  ALTER TABLE "lgc" DROP COLUMN "gutter_x_adjustable";
  ALTER TABLE "lgc" DROP COLUMN "gutter_y";
  ALTER TABLE "lgc" DROP COLUMN "gutter_y_adjustable";
  ALTER TABLE "lgc" DROP COLUMN "guides_on";
  ALTER TABLE "lgc" DROP COLUMN "guides_adjustable";
  ALTER TABLE "_lgc_v" DROP COLUMN "margin_pct";
  ALTER TABLE "_lgc_v" DROP COLUMN "margin_adjustable";
  ALTER TABLE "_lgc_v" DROP COLUMN "gutter_x";
  ALTER TABLE "_lgc_v" DROP COLUMN "gutter_x_adjustable";
  ALTER TABLE "_lgc_v" DROP COLUMN "gutter_y";
  ALTER TABLE "_lgc_v" DROP COLUMN "gutter_y_adjustable";
  ALTER TABLE "_lgc_v" DROP COLUMN "guides_on";
  ALTER TABLE "_lgc_v" DROP COLUMN "guides_adjustable";`)
}
