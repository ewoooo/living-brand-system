# farnext.md — DB·환경 구조의 살아있는 진단

이 리포의 DB·환경·협업 구조에서 **아직 해결되지 않은 것**만 남긴 문서입니다. 2026-08-05에 2663줄에서 재작성했습니다. 지운 것은 업계 도구 비교(Flyway·Prisma·Neon 등), 이미 적용된 처방의 서술, 학습 서적 목록, 적대적 검증 전사입니다 — 판단의 근거가 필요하면 git 이력의 이전 판을 보십시오.

우선순위는 낮습니다. 아래 P0가 위젯 작업을 막는 순간에만 착수하십시오.

## P0 — 로컬 DB가 migrate도 push도 못 받는 교착

**증상**: `pnpm payload migrate`가 로컬에서 아무것도 적용하지 못하고, `.env.local`이 `PAYLOAD_DB_PUSH=false`라 push도 안 됩니다. **위젯에 필드를 하나 추가하는 순간 이 벽에 부딪힙니다.**

**기전** (둘 다 실재):
- `migrations/20260722_105137_baseline_v2.ts:23-57`의 인수 가드가 `20260722_*` 마이그레이션 5건의 이름을 요구하는데 로컬 보유는 0/5입니다(마지막 기록이 `20260721_041541_image_prompt_profiles`). DDL 전 SELECT 두 방만 하고 throw하므로 **DB는 망가지지 않고 30건이 영구 pending으로 고정**됩니다.
- 로컬 `payload_migrations`에 `name='dev', batch=-1` 행(id 96)이 있습니다. `@payloadcms/drizzle@3.85.1/dist/migrate.js:30-40`이 `m.batch === -1`이면 대화형 confirm을 띄워 비대화형에서 멈춥니다(심는 곳은 `utilities/pushDevSchema.js:64-73`). 🔴 **트리거 조건은 이름이 아니라 `batch === -1`입니다.**

**실측**(2026-08-05): 로컬 `payload_migrations` 95행, 커밋된 마이그레이션 30건, 파일명 교집합 **0**.

**해법**: stamp보다 **DB 재생성이 더 쌉니다.** 단 🔴 **로컬 콘텐츠는 영구 소실됩니다** — 콘텐츠에 JSON→DB 경로가 없기 때문입니다(2026-08-05에 seed를 삭제했습니다). 복구 경로는 공유 DB `pg_dump` → 로컬 restore 하나뿐입니다.

## P1 — 기본 DATABASE_URL이 공유 DB다

`.env`의 `DATABASE_URL`이 공유 Supabase pooler를 가리키고, 로컬 URL은 `.env.local`에만 있습니다. **`.env.local`을 지우거나 키를 오타 내면 기본값이 공유 DB입니다.**

게다가 `@payloadcms/db-postgres`의 `connect.js`에서 push 블록에는 `PAYLOAD_MIGRATING` 가드가 있는데 `prodMigrations` 블록에는 없어서, `migrate:status` 같은 **조회 명령도 부팅 과정에서 스키마를 씁니다.**

그래서 DB를 건드리는 스크립트는 `DATABASE_URL`을 항상 명시적으로 앞에 붙입니다.

## 🔴 63자 식별자 한계 — 위젯 작업에 직접 걸린다

Postgres 식별자 63자 한계를 **이미 긁고 있습니다.** 정확히 63자인 인덱스명 11개·제약명 45개(총 56개)가 존재하고, 가장 긴 테이블명은 62자입니다(`_guideline_docs_v_blocks_signature_showcase_signatures_locales`).

- 위젯 `dbName`을 `blk`·`ddw`·`cvw`·`lcv` 같은 3자로 줄인 이유가 이것입니다.
- **블록 중첩이 한 단만 깊어지면** 서로 다른 논리명이 같은 63자로 절단돼 migrate가 죽습니다. **강제 장치는 없습니다.**
- 테이블 수는 `1블록 × (배열수+1) × locales × (live+version)`으로 곱해집니다 — `logo_group_viewer` 12테이블/65컬럼, `do_dont` 12/61이 최대치입니다. 로컬 public 테이블 271개 중 126개가 `guideline_docs*` 계열이고 117개가 행 0입니다. **새 위젯에 중첩 배열을 넣는 비용이 이 곱셈입니다.**

계약은 [docs/11-widget-authoring.md](docs/11-widget-authoring.md)에 있습니다.

## Payload 상류 함정 4개 (버전이 바뀌기 전까지 유효)

1. `migrate`는 `payload_migrations.name` 문자열 **완전 일치만** 봅니다. stamp 명령이 없으므로 squash로 파일명을 새로 만들면 옛 기록이 전부 고아가 됩니다.
2. `migrate:create`는 DB에 접속하지 않고(`disableDBConnect: true`) before 상태를 `migrations/*.json` 문자열 정렬 마지막 파일에서만 읽습니다. **스냅샷을 지우면 전체 스키마가 재생성됩니다.**
3. 업로드는 `docWithFilenameExists`가 자기 문서를 제외하지 않고, `incrementName`이 `-01`을 `Number()+1`로 처리해 `-2`로 재부여합니다.
4. drizzle-kit `promptNamedConflict`의 기본 선택이 index 0이라 **slug rename은 비대화형에서 hang합니다.** 스키마 변경은 `migrate:create`로 파일을 만들고 같은 SQL을 psql로 적용하는 우회를 씁니다.

## 이미 적용된 것 (다시 진단하지 말 것)

- **커넥션 풀** — `src/payload.config.ts:132-141`에 `max: 10`, `connectionTimeoutMillis: 10_000`, `idleTimeoutMillis: 30_000`. 증상을 없앤 건 `max`가 아니라 `connectionTimeoutMillis`입니다(pg 기본값 `0` = 무한 대기가 풀 고갈을 영구 스피너로 만듭니다). 다만 Postgres 쪽 타임아웃 3종(`statement_timeout`·`lock_timeout`·`idle_in_transaction_session_timeout`)은 리포 어디에도 설정되지 않았습니다.
- **push 기본값** — `payload.config.ts:143`이 `push: env.PAYLOAD_DB_PUSH === 'true'`로 명시적입니다. CI의 `migrate` 잡이 그 변수를 안 줘도 push는 꺼집니다.
- **원격 교체 스크립트** — `scripts/sync-local-db-to-remote.sh`에 `CONFIRM_REMOTE_REPLACE=replace-remote` 게이트, 파괴 전 원격 `pg_dump -Fc` 백업, LOCAL/REMOTE URL 동일 여부 검사가 모두 있습니다. 여전히 위험하지만 무가드는 아닙니다.
- **콘텐츠 정본** — DB로 결정됐습니다([AGENTS.md](AGENTS.md)의 Content Provisioning). 스냅샷 커버리지는 문서 90건입니다.

## 미착수 제안 (낡은 게 아니라 안 만든 것)

- **드리프트 게이트** — 스키마·마이그레이션 원장·콘텐츠의 어긋남을 자동으로 잡는 장치가 없습니다. 현재 `pnpm doctor`는 block-catalog 생성 + biome + tsc뿐이고 DB를 보지 않습니다.
- **백업·복구 정책** — Supabase PITR 설정 여부와 복구 리허설이 확인되지 않았습니다.
- **배포 순서 경합** — 마이그레이션 워크플로와 앱 배포가 동시에 돌 때의 순서 보장이 없습니다.

## 확인 표면

콘텐츠·화면 확인은 **stage·main Vercel 배포 링크로만** 가능합니다 — Ignored Build Step이 `stage`가 아닌 모든 브랜치 배포를 스킵하므로 **PR preview가 없습니다.** 링크를 볼 때는 커밋 해시부터 확인하십시오(빌드 실패 시 옛 배포가 그대로 서비스됩니다).

## 관점

사고가 난 이유는 실력이 아니라 **진실이 몇 곳에 있느냐**입니다. git은 코드와 스키마 파일만 옮기고 DB 스키마와 콘텐츠는 옮기지 않습니다. 손으로 맞추는 구간마다 어긋남이 생깁니다.
