import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * 의도적으로 비어 있다. 함께 커밋된 `.json` 스냅샷만 의미가 있다.
 *
 * 원래 이 마이그레이션은 직전 DROP이 걷어간 icw·scs(아이콘 그리드·여백 규정 위젯)를 다시
 * CREATE했다. 그런데 두 테이블은 이 브랜치 이전부터 존재했고 **행이 들어 있을 수 있다** —
 * drop 후 create는 그 행을 조용히 버린다(로컬은 0행이라 증상이 안 보였다).
 * 그래서 DROP 쪽에서 두 테이블을 빼는 것으로 고쳤고, 여기서 할 일이 없어졌다.
 *
 * 파일을 지우지 않는 이유는 `.json` 스냅샷 때문이다. drizzle은 DB가 아니라 **직전 스냅샷**과
 * config를 비교하므로, 최신 스냅샷이 icw·scs를 포함한 현재 config와 일치해야 다음
 * `migrate:create`가 이미 있는 테이블을 다시 만들려 들지 않는다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
