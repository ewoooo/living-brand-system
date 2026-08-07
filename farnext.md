# farnext.md — DB·환경 구조의 살아있는 진단

이 리포의 DB·환경·협업 구조에서 **아직 해결되지 않은 것**만 남긴 문서입니다. 2026-08-05에 2663줄에서 재작성했고, 2026-08-07에 해소분과 실제로 터진 것을 반영했습니다. 판단의 근거가 필요하면 git 이력의 이전 판을 보십시오.

## ✅ 해소 — 로컬 DB 교착 (구 P0)

공유 DB 덤프로 로컬을 재생성해 원장·스키마가 공유와 일치합니다. `pnpm payload migrate`가 정상 동작하며, 2026-08-06에 마이그레이션 6건을 실제로 적용했습니다. 재발하면 `.scratch/plans/my-db-workflow.md`의 방법을 씁니다.

🔴 **다만 push 부산물은 여전히 생깁니다.** 워크플로 에이전트가 `PAYLOAD_DB_PUSH=true`로 부팅한 뒤 로컬 `payload_migrations`에 `name='dev', batch=-1` 행이 다시 심겼습니다(2026-08-06 실측). `@payloadcms/drizzle`의 migrate가 `batch === -1`을 보면 대화형 confirm을 띄워 비대화형에서 멈춥니다 — **트리거는 이름이 아니라 `batch === -1`입니다.** 그 행을 지우면 풀립니다.

또한 push로 만든 객체와 마이그레이션이 겹치면 `CREATE TABLE`/`ADD COLUMN`이 "already exists"로 죽습니다. 🔴 **enum 타입은 `DROP TABLE`로 안 사라지므로** 정리할 때 `DROP TYPE`까지 해야 합니다(이것 때문에 한 번 더 헛돌았습니다).

## P1 — 기본 DATABASE_URL이 공유 DB다

`.env`의 `DATABASE_URL`이 공유 Supabase pooler를 가리키고, 로컬 URL은 `.env.local`에만 있습니다. **`.env.local`을 지우거나 키를 오타 내면 기본값이 공유 DB입니다.**

게다가 `@payloadcms/db-postgres`의 `connect.js`에서 push 블록에는 `PAYLOAD_MIGRATING` 가드가 있는데 `prodMigrations` 블록에는 없어서, `migrate:status` 같은 **조회 명령도 부팅 과정에서 스키마를 씁니다.**

그래서 DB를 건드리는 스크립트는 `DATABASE_URL`을 항상 명시적으로 앞에 붙입니다.

## 🔴 63자 식별자 한계 — 2026-08-06에 실제로 터졌습니다

예고했던 대로 터졌는데, **예상한 자리가 아니었습니다.** 테이블명이 아니라 **조회 SQL의 별칭**이었습니다.

별칭은 `dbName`이 아니라 **slug**로 짜입니다:
```
_guideline_docs_v__blocks_<slug>[_<배열필드>][__locales]
```
`separatedLogoApplicationWidget`(30자)이 이걸 78자로 만들었고, Postgres가 **에러 없이 63자로 자르자** 배열 별칭과 그 locales 별칭이 같은 이름이 됐습니다. 조인이 엉뚱한 테이블을 물어 조회가 `operator does not exist: character varying = integer`로 죽었습니다.

**dbName을 3자로 줄여둔 게 소용없었습니다** — 테이블명은 짧았지만 별칭이 slug에서 나왔기 때문입니다.

🔴 **마이그레이션도, 빈 DB 전체 체인 검증도, typecheck도 전부 통과한 뒤 조회할 때만 터졌습니다.** 정적 검사로는 안 잡힙니다.

**이제 강제 장치가 있습니다**: `src/features/guideline/blocks/block/alias-length.test.ts`가 등록된 위젯 전부의 별칭 길이를 재고 63자 초과를 막습니다(현재 29종). 만들 때 localized 필드가 있는 레벨에만 `__locales` 별칭이 생긴다는 점을 반영했습니다 — 그러지 않으면 `colorPairingRecommendationWidget`이 오탐으로 걸립니다.

테이블 수는 여전히 `1블록 × (배열수+1) × locales × (live+version)`으로 곱해집니다. **새 위젯에 중첩 배열을 넣는 비용이 이 곱셈입니다.**

계약은 [docs/11-widget-authoring.md](docs/11-widget-authoring.md)에 있습니다.

## Payload 상류 함정 4개 (버전이 바뀌기 전까지 유효)

1. `migrate`는 `payload_migrations.name` 문자열 **완전 일치만** 봅니다. stamp 명령이 없으므로 squash로 파일명을 새로 만들면 옛 기록이 전부 고아가 됩니다.
2. `migrate:create`는 DB에 접속하지 않고(`disableDBConnect: true`) before 상태를 `migrations/*.json` 문자열 정렬 마지막 파일에서만 읽습니다. **스냅샷을 지우면 전체 스키마가 재생성됩니다.**
   🔴 **2026-08-06에 이걸로 한 번 당했습니다** — stage를 머지한 직후 만든 마이그레이션에 stage의 `agent_chat_sessions` DROP 9건이 중복으로 섞였습니다. 내 브랜치의 스냅샷이 파일명상 뒤였고 머지 이전 상태였기 때문입니다. 그대로 뒀으면 빈 DB에서 같은 컬럼을 두 번 지우려다 죽었을 겁니다. **머지 직후 생성한 마이그레이션은 반드시 눈으로 훑고 목표 구문만 남기십시오.** `.json` 스냅샷은 config 전체를 반영하므로 손대지 않습니다.
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
