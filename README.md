# Living Brand System (LBS)

디지털 브랜드 가이드라인 운영 시스템 프로토타입입니다.

브랜드 기준(정책과 규칙)을 작업 과정에서 적시에 안내하고, 에셋 제너레이션 기록과 검수 기록을 운영자가 확인할 수 있게 만드는 것이 목표입니다. 가이드라인은 문서에서 끝나지 않고 Agent를 통해 실제 제작 과정에서 활용되며, Manager · System · Agent · Creator 네 참여자가 함께 운영하는 구조를 가집니다. 자세한 배경은 [docs/01-product.md](docs/01-product.md)를 참고하세요.

## 기술 스택

- **CMS**: Payload CMS 3 (PostgreSQL 어댑터, Lexical 에디터, MCP/Search 플러그인)
- **프레임워크**: Next.js 16 (App Router), React 19
- **AI**: AI SDK + Anthropic 기반 Agent
- **스토리지/메일**: S3, Resend
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI
- **품질 도구**: Biome, TypeScript, Vitest(통합 테스트), Playwright(E2E)
- **패키지 매니저**: pnpm

## 시작하기

요구사항: Node 20 (`.nvmrc`), pnpm, Docker

```sh
# 1. 환경변수 준비
cp .env.example .env   # PAYLOAD_SECRET 등 값 설정

# 2. PostgreSQL 실행
docker compose up -d postgres

# 3. 의존성 설치 및 개발 서버 실행
pnpm install
pnpm dev
```

`http://localhost:3000` 접속 후 화면 안내에 따라 첫 관리자 계정을 생성합니다. 관리자 UI는 `/admin`에서 열립니다.

앱과 DB를 모두 Docker로 실행하려면 `docker compose up`을 사용합니다.

### 환경변수

`.env.example` 기준 주요 변수:

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `PAYLOAD_SECRET` | Payload 시크릿 (실제 값으로 변경 필수) |
| `PAYLOAD_DB_PUSH` | 로컬 개발 전용 스키마 push. 배포 환경에서는 미설정 또는 `false` |
| `PAYLOAD_RUN_MIGRATIONS_ON_STARTUP` | 운영 전용. 앱 시작 시 마이그레이션 실행 |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Anthropic 인증 및 텍스트 생성 모델 설정 |
| `CHAT_MODEL` | Agent Chat 모델 설정 |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | 미디어 스토리지용 S3 설정 |

## 주요 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` / `pnpm start` | 프로덕션 빌드 / 실행 |
| `pnpm generate:types` | Payload 컬렉션 타입 생성 (`src/payload-types.ts`) |
| `pnpm migrate` / `migrate:create` / `migrate:status` | DB 마이그레이션 실행 / 생성 / 상태 확인 |
| `pnpm test:int` / `pnpm test:e2e` | Vitest 통합 테스트 / Playwright E2E 테스트 |
| `pnpm doctor` | 타입 생성 + Biome 검사 + 타입체크 일괄 실행 |
| `pnpm ci` | 검사 + 타입체크 + 통합 테스트 + 빌드 |

> **스키마 변경 시:** collection·field·index를 바꾸면 `pnpm migrate:create <이름>`으로 마이그레이션을 만들고, 생성된 `.ts`·`.json`·`index.ts`와 재생성된 `payload-types.ts`를 수정한 소스와 **한 커밋**에 담습니다. `.json` 스냅샷은 삭제하지 않습니다(다음 `migrate:create`의 diff 기준). 자세한 절차는 [docs/06-project-structure.md](docs/06-project-structure.md)의 "스키마 변경과 마이그레이션 워크플로"를 참고하세요.

## 프로젝트 구조

```
src/
├── collections/   # Payload 컬렉션 (가이드라인, 규칙, 브랜드 리소스, 템플릿 등)
├── globals/       # Payload 글로벌 (Guideline, AgentSettings)
├── app/           # Next.js App Router — (frontend) 사용자 화면, (payload) 관리자, api
├── features/      # 기능 단위 모듈 (agent-chat, review, template-import 등)
├── agents/        # Anthropic 기반 Agent 정의
├── services/      # 유즈케이스 경계 서비스 계층
└── payload.config.ts
migrations/        # DB 마이그레이션
scripts/           # 시드 스크립트
docs/              # 기획·아키텍처 문서
```

상세 구조와 개발 규칙은 [docs/06-project-structure.md](docs/06-project-structure.md)를 참고하세요.

## 문서

기획부터 구현 방향까지 [docs/README.md](docs/README.md)에서 순서대로 안내합니다.

| 문서 | 역할 |
| --- | --- |
| [01. 제품](docs/01-product.md) | 제품 정의, 문제, 사용자, 가설, 제공 가치 |
| [02. 유즈케이스](docs/02-usecases.md) | 사용 흐름, 주요 유즈케이스, 입력과 결과 |
| [03. 데이터 생명주기](docs/03-data-lifecycle.md) | 데이터 상태, 전이, 연결 이벤트 |
| [04. 도메인 모델](docs/04-domain-model.md) | 시스템 안에 존재하는 핵심 개념 |
| [05. 시스템 아키텍처](docs/05-system-architecture.md) | 구현 경계, 기술 스택, 책임 분리 |
| [06. 프로젝트 구조와 개발 규칙](docs/06-project-structure.md) | 런타임 구성, 소스 디렉터리, 구현 위치, 개발 규칙 |
| [07. 보안](docs/07-security.md) | 보안 점검 항목, 문제 예시, 해결 방안 |
| [08. 접근성과 다국어](docs/08-accessibility-i18n.md) | 접근성, 사용자 노출 문구, 다국어 대응 기준 |
