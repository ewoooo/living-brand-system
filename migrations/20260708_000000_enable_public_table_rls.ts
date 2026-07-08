import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Supabase Data API에 노출되는 public 테이블의 직접 접근을 RLS 기본 차단으로 막는다.
 * Payload 서버는 DB owner 연결을 사용하므로 collection access control 흐름은 유지된다.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		DO $$
		DECLARE
			table_record record;
		BEGIN
			FOR table_record IN
				SELECT schemaname, tablename
				FROM pg_tables
				WHERE schemaname = 'public'
			LOOP
				EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_record.schemaname, table_record.tablename);
			END LOOP;
		END $$;
	`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
	// 보안 완화 rollback은 사고 가능성이 커서 자동으로 수행하지 않는다.
}
