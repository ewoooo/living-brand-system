import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * CI 락업 위젯에 컨트롤러 제한 필드를 준다 — 초기 계층 두 개(`subsidiary_on`·`branch_on`)와
 * 알약에서 뺄 컨트롤 목록(`cil_hidden_controls`).
 *
 * 🔴 **생성기 출력을 손으로 증분으로 고쳤다.** `migrate:create`가 `cil`·`_cil_v`를 CREATE TABLE로
 *    다시 만들려 했는데, 두 테이블은 이미 존재한다(20260818_021417_ci_lockup_widget이 만들었고
 *    stage도 그것을 적용했다). 사이 기간의 스냅샷이 그 테이블을 잃어버려서(위젯이 없는 상태에서
 *    재생성됨) 생성기가 없는 것으로 본 것이다. 그대로 두면 stage 적용이 "already exists"로 실패한다.
 *    함께 커밋되는 스냅샷(.json)에는 두 테이블이 다시 들어 있어 이후 diff는 정상으로 돌아온다.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cil_hidden_controls" AS ENUM('subsidiaryOn', 'subsidiary', 'branchOn', 'branch', 'form', 'language', 'colorType', 'mono', 'clearSpace', 'measured');
  CREATE TYPE "public"."enum__cil_v_hidden_controls" AS ENUM('subsidiaryOn', 'subsidiary', 'branchOn', 'branch', 'form', 'language', 'colorType', 'mono', 'clearSpace', 'measured');
  CREATE TABLE "cil_hidden_controls" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_cil_hidden_controls",
  	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "_cil_v_hidden_controls" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__cil_v_hidden_controls",
  	"id" serial PRIMARY KEY NOT NULL
  );

  ALTER TABLE "cil" ADD COLUMN "subsidiary_on" boolean DEFAULT false;
  ALTER TABLE "cil" ADD COLUMN "branch_on" boolean DEFAULT false;
  ALTER TABLE "_cil_v" ADD COLUMN "subsidiary_on" boolean DEFAULT false;
  ALTER TABLE "_cil_v" ADD COLUMN "branch_on" boolean DEFAULT false;
  ALTER TABLE "cil_hidden_controls" ADD CONSTRAINT "cil_hidden_controls_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cil"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cil_v_hidden_controls" ADD CONSTRAINT "_cil_v_hidden_controls_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cil_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cil_hidden_controls_order_idx" ON "cil_hidden_controls" USING btree ("order");
  CREATE INDEX "cil_hidden_controls_parent_idx" ON "cil_hidden_controls" USING btree ("parent_id");
  CREATE INDEX "_cil_v_hidden_controls_order_idx" ON "_cil_v_hidden_controls" USING btree ("order");
  CREATE INDEX "_cil_v_hidden_controls_parent_idx" ON "_cil_v_hidden_controls" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cil_hidden_controls" CASCADE;
  DROP TABLE "_cil_v_hidden_controls" CASCADE;
  ALTER TABLE "cil" DROP COLUMN "subsidiary_on";
  ALTER TABLE "cil" DROP COLUMN "branch_on";
  ALTER TABLE "_cil_v" DROP COLUMN "subsidiary_on";
  ALTER TABLE "_cil_v" DROP COLUMN "branch_on";
  DROP TYPE "public"."enum_cil_hidden_controls";
  DROP TYPE "public"."enum__cil_v_hidden_controls";`)
}
