import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * 스냅샷 병합 전용 — SQL은 없다.
 *
 * `feat/ci-sections`가 `height_control`과 `arrangement`의 `featuredSide`를 더하는 동안 `stage`에서는
 * 템플릿 정책이 `controller_restrictions`·`controller_presentation` → `background_policy`로 바뀌었다.
 * 두 줄기를 머지하니 **체인의 마지막 스냅샷이 한쪽만 담은 상태**가 됐다(내 쪽 마지막인
 * `20260820_022413`가 그 템플릿 변경을 모른다). 그대로 두면 다음 `migrate:create`가 상대편 컬럼을
 * 다시 ADD/DROP하려 들고, 실제로 이 파일을 만들 때 그 SQL이 생성됐다.
 *
 * 그래서 생성된 SQL을 비우고 짝인 `.json` 스냅샷만 남긴다 — 그 스냅샷은 양쪽을 합친 실제 상태다
 * (`templates.background_policy` + `cil.height_control` + `enum_block_arrangement`의 `featuredSide`).
 * 🔴 여기에 SQL을 채우지 말 것. 채우면 stage 적용이 이미 적용된 변경을 다시 돌려 실패한다.
 *    `20260819_090753_ci_lockup_snapshot_repair`·`20260819_094517_ci_sections_snapshot_merge`가
 *    같은 이유로 같은 형태다 — 이 리포에서 스냅샷 갭은 머지마다 반복되는 사고다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
