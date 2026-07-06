import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		UPDATE "rules" SET "executor" = 'advisory' WHERE "executor" = 'human';
		UPDATE "rules"
		SET "executor" = 'heuristic'
		WHERE "key" IN (
			'logo.derived-motif',
			'logo.symbol-concept',
			'color.usage',
			'layout.tone',
			'imagery.style',
			'imagery.treatment',
			'imagery.classification',
			'illustration.ai-symbol',
			'iconography.style',
			'voice.tone',
			'voice.personality',
			'voice.design-principle',
			'messaging.key-message',
			'application.merch-spec',
			'application.design-concept',
			'accessibility.alt-text-captions'
		);
		ALTER TABLE "rules" ALTER COLUMN "executor" DROP DEFAULT;
		ALTER TYPE "public"."enum_rules_executor" RENAME TO "enum_rules_executor_old";
		CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'advisory');
		ALTER TABLE "rules" ALTER COLUMN "executor" TYPE "public"."enum_rules_executor" USING "executor"::text::"public"."enum_rules_executor";
		DROP TYPE "public"."enum_rules_executor_old";
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "rules" ALTER COLUMN "executor" DROP DEFAULT;
		ALTER TYPE "public"."enum_rules_executor" RENAME TO "enum_rules_executor_old";
		CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'advisory', 'human');
		ALTER TABLE "rules" ALTER COLUMN "executor" TYPE "public"."enum_rules_executor" USING "executor"::text::"public"."enum_rules_executor";
		DROP TYPE "public"."enum_rules_executor_old";
	`)
}
