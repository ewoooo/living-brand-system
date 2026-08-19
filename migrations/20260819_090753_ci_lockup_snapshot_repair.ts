import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * 스냅샷 복구 전용 — SQL은 없다.
 *
 * `20260818_021417_ci_lockup_widget`가 `cil`·`_cil_v`를 만들었는데, 바로 다음
 * `20260818_024535_generated_image_source_image`의 스냅샷에서 두 테이블이 **DROP 문 없이**
 * 사라졌다(그 마이그레이션을 만든 자리의 블록 스키마에 `CiLockupWidget`이 없었다). DB에는
 * 남아 있고 스냅샷에만 없는 상태가 되어, 이후 `migrate:create`가 매번 두 테이블을 다시
 * CREATE하려 든다 — 이미 존재하므로 stage에서도, 빈 DB 재생에서도 실패한다.
 *
 * 그래서 이 항목은 SQL을 실행하지 않고 짝인 `.json` 스냅샷만 정본으로 되돌린다.
 * 🔴 여기에 SQL을 채우지 말 것. 채우면 위 실패가 그대로 돌아온다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
