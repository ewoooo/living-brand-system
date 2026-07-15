import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_heuristic_criterion_expected" AS ENUM('present', 'absent');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "guideline_docs_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected"
  );

  CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_column_unit_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected"
  );

  CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_media_showcase_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected"
  );

  CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_color_palette_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected"
  );

  CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_do_dont_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected"
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_version_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected",
    "_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_column_unit_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected",
    "_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected",
    "_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_color_palette_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected",
    "_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_do_dont_checks_criteria" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "question" varchar,
    "expected" "enum_heuristic_criterion_expected",
    "_uuid" varchar
  );

  DO $$ BEGIN ALTER TABLE "guideline_docs_checks_criteria" ADD CONSTRAINT "guideline_docs_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_version_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_version_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_checks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "guideline_docs_checks_criteria_order_idx" ON "guideline_docs_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "guideline_docs_checks_criteria_parent_id_idx" ON "guideline_docs_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_column_unit_checks_criteria_order_idx" ON "guideline_docs_blocks_column_unit_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_column_unit_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_column_unit_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_media_showcase_checks_criteria_order_idx" ON "guideline_docs_blocks_media_showcase_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_media_showcase_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_media_showcase_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_color_palette_checks_criteria_order_idx" ON "guideline_docs_blocks_color_palette_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_color_palette_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_color_palette_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_do_dont_checks_criteria_order_idx" ON "guideline_docs_blocks_do_dont_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_do_dont_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_do_dont_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_version_checks_criteria_order_idx" ON "_guideline_docs_v_version_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_version_checks_criteria_parent_id_idx" ON "_guideline_docs_v_version_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_column_unit_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_column_unit_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_column_unit_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_media_showcase_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_color_palette_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_color_palette_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_color_palette_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_do_dont_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_do_dont_checks_criteria" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_do_dont_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_checks_criteria" USING btree ("_parent_id");

  CREATE TEMP TABLE "_heuristic_criteria_backfill" (
    "check_key" varchar NOT NULL,
    "criterion_order" integer NOT NULL,
    "criterion_id" varchar NOT NULL,
    "question" varchar NOT NULL,
    "expected" "enum_heuristic_criterion_expected" NOT NULL
  );

  INSERT INTO "_heuristic_criteria_backfill"
    ("check_key", "criterion_order", "criterion_id", "question", "expected")
  VALUES
    ('application.package.format', 1, 'approved-package-format', '승인된 패키지 형식과 레이아웃을 따르는가?', 'present'),
    ('application.sns.caption.legibility', 1, 'caption-legibility', '캡션과 텍스트를 명확하게 읽을 수 있는가?', 'present'),
    ('color.combo.tonal.balance', 1, 'same-hue-family', '조합한 색상이 같은 색상 계열에 속하는가?', 'present'),
    ('color.combo.tonal.balance', 2, 'intended-lightness-contrast', '가이드에 맞는 명도 대비가 표현되었는가?', 'present'),
    ('color.usage', 1, 'approved-context-level', '사용 맥락에 맞는 Level 1·2·3 색상을 사용했는가?', 'present'),
    ('color.usage', 2, 'approved-color-pairing', '가이드에 맞는 색상 조합 방식을 사용했는가?', 'present'),
    ('illustration.color.usage', 1, 'approved-illustration-colors', '일러스트레이션에 승인된 브랜드 색상과 조합을 사용했는가?', 'present'),
    ('illustration.subject.taxonomy', 1, 'approved-subject', '허용된 일러스트레이션 주제를 표현했는가?', 'present'),
    ('illustration.subject.taxonomy', 2, 'approved-visual-style', '단순하고 둥근 형태의 일관된 스타일을 따르는가?', 'present'),
    ('imagery.advertisement.classification', 1, 'approved-advertisement-style', '광고 이미지가 브랜드 디자인 요소와 레이아웃을 따르는가?', 'present'),
    ('imagery.misuse', 1, 'excessive-skin-retouching', '피부 질감을 없애는 과도한 보정이 있는가?', 'absent'),
    ('imagery.misuse', 2, 'excessive-accessories', '피부나 제품보다 시선을 끄는 과도한 액세서리가 있는가?', 'absent'),
    ('imagery.misuse', 3, 'excessive-props', '주제를 방해하는 과도한 소품이 있는가?', 'absent'),
    ('imagery.misuse', 4, 'excessive-clothing', '스킨케어 표현을 방해하는 과도한 복장 연출이 있는가?', 'absent'),
    ('imagery.misuse', 5, 'inappropriate-post-processing', '스킨케어 브랜드에 맞지 않는 후처리나 연출이 있는가?', 'absent'),
    ('imagery.misuse', 6, 'excessive-color-makeup', '피부 본연의 색을 가리는 과도한 색조 화장이 있는가?', 'absent'),
    ('imagery.photography.classification', 1, 'approved-photo-category', '원료·제형·제품·모델 중 허용된 사진 범주에 속하는가?', 'present'),
    ('imagery.photography.classification', 2, 'approved-photo-impression', '가이드가 요구하는 사진의 시각적 인상을 따르는가?', 'present'),
    ('imagery.sns.classification', 1, 'approved-sns-image-style', 'SNS 이미지가 브랜드 자산과 사진 스타일을 일관되게 사용하는가?', 'present'),
    ('imagery.style', 1, 'approved-imagery-system', 'Type A 메시지 또는 Type B 콘텐츠 이미지 체계를 따르는가?', 'present'),
    ('layout.advertisement.zones', 1, 'approved-ad-zones', '광고의 콘텐츠 영역과 레이아웃을 가이드대로 배치했는가?', 'present'),
    ('layout.sns.zones', 1, 'approved-sns-zones', '인물과 텍스트를 SNS 레이아웃 영역에 맞게 배치했는가?', 'present'),
    ('logo.background.legibility', 1, 'harmful-background', '로고 식별을 방해하는 배경을 사용했는가?', 'absent'),
    ('logo.background.legibility', 2, 'logo-legible', '배경 위에서 로고를 명확하게 식별할 수 있는가?', 'present'),
    ('logo.color.misuse', 1, 'outline-only-logo', '로고를 아웃라인으로만 표현했는가?', 'absent'),
    ('logo.color.misuse', 2, 'unapproved-logo-color', '승인되지 않은 부분 색상이나 색 조합을 사용했는가?', 'absent'),
    ('logo.color.misuse', 3, 'gradient-logo', '로고에 그라데이션을 적용했는가?', 'absent'),
    ('logo.misuse', 1, 'distorted-logo-proportion', '로고의 간격·비율·기울기를 변형했는가?', 'absent'),
    ('logo.misuse', 2, 'distorted-logo-shape', '로고의 형태나 굵기를 변형했는가?', 'absent'),
    ('logo.misuse', 3, 'outline-only-logo', '로고를 아웃라인으로만 표현했는가?', 'absent'),
    ('logo.misuse', 4, 'unapproved-logo-color', '승인되지 않은 부분 색상이나 색 조합을 사용했는가?', 'absent'),
    ('logo.misuse', 5, 'harmful-background', '로고 식별을 방해하는 배경을 사용했는가?', 'absent'),
    ('logo.misuse', 6, 'gradient-logo', '로고에 그라데이션을 적용했는가?', 'absent'),
    ('logo.package.placement', 1, 'approved-package-placement', '패키지에서 로고의 위치와 비율을 가이드대로 적용했는가?', 'present'),
    ('logo.package.variant', 1, 'approved-logo-variant', '승인된 보조 로고 변형을 사용했는가?', 'present'),
    ('logo.sns.placement', 1, 'approved-sns-logo-placement', 'SNS에서 로고와 이벤트 정보를 가이드대로 배치했는가?', 'present'),
    ('logo.symbol.concept', 1, 'approved-primary-logo', '승인된 프라이머리 로고의 형태와 일치하는가?', 'present'),
    ('messaging.key.message', 1, 'core-energy-keyword', '브랜드 핵심 키워드 Energy를 올바르게 사용했는가?', 'present'),
    ('messaging.package.content.fields', 1, 'required-package-information', '패키지에 필요한 정보와 위계를 가이드대로 표현했는가?', 'present'),
    ('messaging.signature.combination', 1, 'approved-signature-combination', '승인된 시그니처 조합 형태를 사용했는가?', 'present'),
    ('messaging.stationery.content.fields', 1, 'required-stationery-information', '문구류에 필요한 정보와 위계를 가이드대로 표현했는가?', 'present'),
    ('typography.family', 1, 'approved-typeface', '지정된 국문 또는 영문 서체와 시각적으로 일치하는가?', 'present'),
    ('typography.misuse', 1, 'excessive-letter-spacing', '과도한 자간을 사용했는가?', 'absent'),
    ('typography.misuse', 2, 'distorted-letterforms', '글자 형태를 임의로 변형했는가?', 'absent'),
    ('typography.misuse', 3, 'unapproved-typeface', '지정되지 않은 서체를 사용한 것으로 보이는가?', 'absent'),
    ('typography.pairing', 1, 'approved-type-pairing', '국문과 영문 서체의 지정된 굵기 조합을 따르는가?', 'present'),
    ('typography.weight', 1, 'mixed-weights', '한 문장 안에서 서로 다른 굵기를 혼용했는가?', 'absent'),
    ('typography.weight', 2, 'mixed-sizes', '한 문장 안에서 서로 다른 크기를 혼용했는가?', 'absent'),
    ('voice.naming.grammar', 1, 'correct-brand-name', '브랜드명 Essenherb의 철자와 대소문자를 올바르게 표기했는가?', 'present');

  DO $migration$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM (
        SELECT "key" FROM "guideline_docs_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "guideline_docs_blocks_column_unit_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "guideline_docs_blocks_media_showcase_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "guideline_docs_blocks_color_palette_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "guideline_docs_blocks_do_dont_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "_guideline_docs_v_version_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "_guideline_docs_v_blocks_column_unit_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "_guideline_docs_v_blocks_media_showcase_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "_guideline_docs_v_blocks_color_palette_checks" WHERE "executor" = 'heuristic'
        UNION ALL SELECT "key" FROM "_guideline_docs_v_blocks_do_dont_checks" WHERE "executor" = 'heuristic'
      ) checks
      WHERE NOT EXISTS (
        SELECT 1 FROM "_heuristic_criteria_backfill" b WHERE b."check_key" = checks."key"
      )
    ) THEN
      RAISE EXCEPTION 'Heuristic Check criteria backfill mapping is incomplete';
    END IF;
  END
  $migration$;

  INSERT INTO "guideline_docs_checks_criteria" ("_order", "_parent_id", "id", "question", "expected")
  SELECT b."criterion_order", p."id", p."id" || ':' || b."criterion_id", b."question", b."expected"
  FROM "guideline_docs_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "guideline_docs_blocks_column_unit_checks_criteria" ("_order", "_parent_id", "id", "question", "expected")
  SELECT b."criterion_order", p."id", p."id" || ':' || b."criterion_id", b."question", b."expected"
  FROM "guideline_docs_blocks_column_unit_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "guideline_docs_blocks_media_showcase_checks_criteria" ("_order", "_parent_id", "id", "question", "expected")
  SELECT b."criterion_order", p."id", p."id" || ':' || b."criterion_id", b."question", b."expected"
  FROM "guideline_docs_blocks_media_showcase_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "guideline_docs_blocks_color_palette_checks_criteria" ("_order", "_parent_id", "id", "question", "expected")
  SELECT b."criterion_order", p."id", p."id" || ':' || b."criterion_id", b."question", b."expected"
  FROM "guideline_docs_blocks_color_palette_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "guideline_docs_blocks_do_dont_checks_criteria" ("_order", "_parent_id", "id", "question", "expected")
  SELECT b."criterion_order", p."id", p."id" || ':' || b."criterion_id", b."question", b."expected"
  FROM "guideline_docs_blocks_do_dont_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "_guideline_docs_v_version_checks_criteria" ("_order", "_parent_id", "question", "expected", "_uuid")
  SELECT b."criterion_order", p."id", b."question", b."expected", coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  FROM "_guideline_docs_v_version_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_version_checks_criteria" c
    WHERE c."_parent_id" = p."id" AND c."_uuid" = coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  );

  INSERT INTO "_guideline_docs_v_blocks_column_unit_checks_criteria" ("_order", "_parent_id", "question", "expected", "_uuid")
  SELECT b."criterion_order", p."id", b."question", b."expected", coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  FROM "_guideline_docs_v_blocks_column_unit_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_blocks_column_unit_checks_criteria" c
    WHERE c."_parent_id" = p."id" AND c."_uuid" = coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  );

  INSERT INTO "_guideline_docs_v_blocks_media_showcase_checks_criteria" ("_order", "_parent_id", "question", "expected", "_uuid")
  SELECT b."criterion_order", p."id", b."question", b."expected", coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  FROM "_guideline_docs_v_blocks_media_showcase_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_blocks_media_showcase_checks_criteria" c
    WHERE c."_parent_id" = p."id" AND c."_uuid" = coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  );

  INSERT INTO "_guideline_docs_v_blocks_color_palette_checks_criteria" ("_order", "_parent_id", "question", "expected", "_uuid")
  SELECT b."criterion_order", p."id", b."question", b."expected", coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  FROM "_guideline_docs_v_blocks_color_palette_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_blocks_color_palette_checks_criteria" c
    WHERE c."_parent_id" = p."id" AND c."_uuid" = coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  );

  INSERT INTO "_guideline_docs_v_blocks_do_dont_checks_criteria" ("_order", "_parent_id", "question", "expected", "_uuid")
  SELECT b."criterion_order", p."id", b."question", b."expected", coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  FROM "_guideline_docs_v_blocks_do_dont_checks" p
  JOIN "_heuristic_criteria_backfill" b ON b."check_key" = p."key"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_blocks_do_dont_checks_criteria" c
    WHERE c."_parent_id" = p."id" AND c."_uuid" = coalesce(p."_uuid", p."id"::varchar) || ':' || b."criterion_id"
  );

  DROP TABLE "_heuristic_criteria_backfill";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_version_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" CASCADE;
  DROP TYPE "public"."enum_heuristic_criterion_expected";`)
}
