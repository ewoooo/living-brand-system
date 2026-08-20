import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * 스냅샷 병합 전용 — SQL은 없다.
 *
 * `feat/ci-sections`가 CI 락업에 축 컬럼을 더하는 동안 `stage`에서는 블록 배경 톤이 붙고
 * 레이아웃 그리드 lock 필드가 걷혔다. 두 줄기를 머지하니 **마지막 스냅샷이 한쪽만 담은 상태**가
 * 됐다(내 쪽 마지막이 `20260819_090805`라 그 뒤 stage 변경을 모른다). 그대로 두면 다음
 * `migrate:create`가 상대편 컬럼을 다시 ADD/DROP하려 들고, 그 SQL은 이미 적용된 환경에서 실패한다.
 *
 * 그래서 생성된 SQL을 비우고 짝인 `.json` 스냅샷만 남긴다 — 그 스냅샷은 양쪽을 합친 실제 상태다
 * (`cil`의 축 컬럼 11개 + `blk.background_tone` + `lgw`의 lock 제거 반영).
 * 🔴 여기에 SQL을 채우지 말 것. 채우면 stage 적용이 「already exists」로 실패한다.
 *    `20260819_090753_ci_lockup_snapshot_repair`가 같은 이유로 같은 형태다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
