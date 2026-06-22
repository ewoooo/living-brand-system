# 06. 프로젝트 구조와 개발 규칙

이 문서는 런타임 구성, 소스 디렉터리, 구현 위치, 개발 규칙을 정리합니다.

## 1. 폴더 및 패키지 구조

### 패키지 구조

이 프로젝트는 Next.js 애플리케이션 안에 Payload CMS와 Consumer UI를 함께 둡니다.
패키지는 도메인보다 실행 위치와 책임을 기준으로 나눕니다.

| 영역 | 위치 | 역할 |
| --- | --- | --- |
| App Router | `src/app` | Next.js route, layout, page, route handler를 둡니다. |
| Payload config | `src/payload.config.ts` | Payload 전역 설정, collection, plugin, db adapter를 연결합니다. |
| Collections | `src/collections` | Payload collection schema, access, hook 진입점을 둡니다. |
| UI components | `src/components` | ShadCN 기반 공통 컴포넌트와 화면 조합 컴포넌트를 둡니다. |
| Feature modules | `src/features` | Consumer 작업 흐름처럼 화면과 상태가 묶인 기능을 둡니다. |
| Services | `src/services` | 유즈케이스 단위 업무 규칙을 둡니다. |
| Repositories | `src/repositories` | Payload Local API, 검색 인덱스, 외부 저장소 접근을 감쌉니다. |
| Agent modules | `src/agents` | RAG 검색, 프롬프트, 답변 생성, 인사이트 후보 생성을 둡니다. |
| Shared utilities | `src/lib` | 공통 util, error, logger, auth helper를 둡니다. |
| Hooks | `src/hooks` | React custom hook을 둡니다. |
| Types | `src/types` | Payload 타입 외에 공통 타입을 둡니다. |

### 리소스 폴더 구조

| 리소스 | 위치 | 규칙 |
| --- | --- | --- |
| 정적 파일 | `public` | 직접 공개해도 되는 이미지, 아이콘, 정적 파일만 둡니다. |
| 공식 에셋 | Payload upload collection | 권한, 상태, 메타데이터가 필요한 파일은 Payload에서 관리합니다. |
| 사용자 업로드 | Payload upload collection 또는 object storage | 파일 검증과 권한 확인을 거친 뒤 저장합니다. |
| 환경 변수 | `.env` | secret은 코드와 클라이언트 번들에 넣지 않습니다. |
| 메시지 | `src/lib/messages` 또는 i18n 모듈 | 사용자 노출 메시지와 내부 로그 메시지를 분리합니다. |
| 테스트 리소스 | `tests` | 테스트 fixture와 helper를 테스트 디렉터리 안에 둡니다. |

### 프론트엔드 폴더 구조

프론트엔드는 Payload Admin과 Consumer UI를 분리합니다.

| 영역 | 위치 | 규칙 |
| --- | --- | --- |
| Payload Admin | `src/app/(payload)` | Payload가 요구하는 admin route와 API route를 둡니다. |
| Consumer UI | `src/app/(frontend)` | 내부 현장 작업자가 사용하는 화면을 둡니다. |
| Route Handler | `src/app/**/route.ts` | HTTP 요청 검증과 Service 호출만 담당합니다. |
| ShadCN UI | `src/components/ui` | registry 기반 컴포넌트 원형을 둡니다. |
| 화면 컴포넌트 | `src/features/*/components` | 특정 기능에만 쓰는 컴포넌트를 둡니다. |
| 화면 상태 | `src/features/*` | 폼 상태, client hook, view model을 기능 안에 둡니다. |

## 2. 전체 소스코드 폴더 구조

### 프론트엔드 (클라이언트)

```text
src/app/(frontend)/
  layout.tsx
  page.tsx
  styles.css

src/components/
  ui/

src/features/
  guideline/
    components/
    hooks/
    types.ts
```

- `page.tsx`와 `layout.tsx`는 라우팅과 화면 조합만 담당합니다.
- ShadCN 컴포넌트에는 도메인 규칙을 넣지 않습니다.
- 기능별 UI는 `src/features/<feature>` 아래에 모읍니다.

### 공통 유틸리티

```text
src/lib/
  auth.ts
  errors.ts
  logger.ts
  messages.ts
  result.ts

src/hooks/
  use-*.ts

src/types/
  *.ts
```

- 공통 유틸리티는 특정 collection이나 화면에 의존하지 않아야 합니다.
- 에러, 메시지, 로그는 공통 모듈에서 형식을 통일합니다.
- custom hook은 React 상태나 브라우저 API를 다룰 때만 둡니다.

### 서비스 모듈 (Payload)

```text
src/collections/
  Users.ts
  Media.ts

src/services/
  *.service.ts

src/repositories/
  *.repository.ts
```

- Collection은 schema, access, hook 진입점을 정의합니다.
- hook 안에서는 Service를 호출하고, 업무 규칙을 직접 길게 작성하지 않습니다.
- Service는 유즈케이스 단위로 작성합니다.
- Repository는 Payload Local API와 검색 인덱스 접근을 감쌉니다.

### Agent 모듈

Agent는 별도 사용자 역할이 아니라 서비스 모듈입니다.
초기에는 Payload/Next.js 애플리케이션 안에서 시작하고, RAG 검색, 답변 생성, 수정 지시, 인사이트 후보 생성이 커질 때 별도 모듈이나 worker로 분리합니다.

```text
src/agents/
  retrieval.ts
  guideline-agent.ts
  prompts.ts
  insight-agent.ts
```

- Agent는 published content와 허용된 작업 맥락만 사용합니다.
- Agent는 Governance를 직접 변경하지 않습니다.
- Agent 결과는 Service에서 검증하거나 상태로 기록한 뒤 사용자에게 보여줍니다.

## 3. 구현 위치

| 구현 대상 | 위치 | 기준 |
| --- | --- | --- |
| Payload collection | `src/collections` | 데이터 구조, access, hook 진입점 |
| Consumer 화면 | `src/app/(frontend)`, `src/features` | 사용자 작업 흐름 |
| Admin 화면 | Payload Admin 기본 UI | Manager의 CMS 작업 |
| Route Handler | `src/app/**/route.ts` | 외부 HTTP 요청 처리 |
| Service | `src/services` | 유즈케이스 업무 규칙 |
| Repository | `src/repositories` | Payload Local API, 검색, 외부 저장소 접근 |
| Agent | `src/agents` | 검색, 답변, 수정 지시, 인사이트 후보 |
| 공통 유틸 | `src/lib` | 에러, 로그, 메시지, 인증 helper |

## 4. 파일 명칭 규칙

| 개발 소스 | 설명 |
| --- | --- |
| `page.tsx` | Next.js route page 파일입니다. |
| `layout.tsx` | Next.js route layout 파일입니다. |
| `route.ts` | Next.js Route Handler 파일입니다. |
| `*.tsx` | React component 파일입니다. |
| `use-*.ts` | React custom hook 파일입니다. |
| `*.service.ts` | 유즈케이스 service 파일입니다. |
| `*.repository.ts` | 데이터 접근 repository 파일입니다. |
| `*.agent.ts` | Agent 실행 단위 파일입니다. |
| `*.test.ts` | 단위 테스트 파일입니다. |
| `*.spec.ts` | e2e 또는 통합 테스트 파일입니다. |

## 5. 명명 규칙

### 클래스 명칭

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| React Component | `PascalCase` | `GuidelineCard` |
| custom hook | `use` + 동작 또는 상태 | `useWorkSession` |
| Facade | 필요한 경우에만 `PascalCase` + `Facade` | `GuidelineFacade` |
| Service (Usecase) | 도메인 + `Service` 또는 동사형 함수 | `guidelineService`, `createWorkSession` |
| Repository | 도메인 + `Repository` | `guidelineRepository` |
| Util | 기능 이름 중심 | `formatDate`, `normalizeSlug` |
| Error | 도메인 + `Error` | `AccessDeniedError` |

Facade는 기본 구조로 두지 않습니다.
여러 Service와 Repository를 한 화면 전용 API로 묶어야 할 때만 추가합니다.

### 함수 명칭

- 함수는 `camelCase`로 작성합니다.
- 함수 이름은 동사로 시작합니다.
- 조회는 `get`, `find`, `list`를 구분해서 사용합니다.
- 생성, 수정, 삭제는 `create`, `update`, `delete`를 사용합니다.
- boolean 반환 함수는 `is`, `has`, `can`, `should`로 시작합니다.
- 이벤트 핸들러는 `handle`로 시작합니다.

| 작업 | 규칙 | 예 |
| --- | --- | --- |
| 단건 조회 | `get` + 대상 | `getGuideline` |
| 조건 조회 | `find` + 대상 | `findPublishedRule` |
| 목록 조회 | `list` + 대상 | `listApplicationTypes` |
| 생성 | `create` + 대상 | `createWorkSession` |
| 수정 | `update` + 대상 | `updateGuidelineSection` |
| 삭제 | `delete` + 대상 | `deleteDraftRule` |
| 권한 확인 | `can` + 동작 | `canPublishGuideline` |
| 상태 확인 | `is` + 상태 | `isPublished` |

## 6. 주석 처리 규칙

### 문서화 주석

- 공개 Service, Repository, Agent 함수 중 입력과 결과만으로 의도를 알기 어려운 함수에만 문서화 주석을 작성합니다.
- 모든 파일과 모든 함수에 주석을 강제하지 않습니다.
- 보안, 권한, 데이터 보존처럼 실수 비용이 큰 규칙은 주석으로 의도를 남깁니다.

```ts
/**
 * 발행된 기준만 조회한다.
 * Agent 답변과 Consumer UI는 draft 기준을 사용하면 안 된다.
 */
```

### 함수 주석

- 함수 이름과 타입으로 설명되는 내용은 주석으로 반복하지 않습니다.
- 여러 단계의 검증이나 상태 전이가 있는 경우에만 짧게 설명합니다.
- 주석은 구현 방법보다 이유를 설명합니다.

### 변수 주석

- 변수 주석은 기본적으로 작성하지 않습니다.
- 단위, 시간 기준, 외부 시스템 키처럼 이름만으로 오해할 수 있는 값에만 작성합니다.

```ts
const sessionTtlMinutes = 10 // 관리자 세션 만료 기준
```

## 7. Log 정책

- `console.log`는 임시 디버깅에만 사용하고 커밋하지 않습니다.
- 서버 로그는 공통 logger를 통해 남깁니다.
- 로그 레벨은 `debug`, `info`, `warn`, `error`로 구분합니다.
- 운영 환경에서는 `debug` 로그를 기본 비활성화합니다.
- 로그 한 줄에는 발생 위치, 작업 식별자, 안전한 메시지를 포함합니다.
- secret, token, password, 개인정보, 업로드 원본 파일 경로는 로그에 남기지 않습니다.

| 레벨 | 사용 기준 |
| --- | --- |
| `debug` | 개발 중 흐름 확인. 운영 기본 비활성화 |
| `info` | 정상적인 주요 업무 이벤트 |
| `warn` | 실패는 아니지만 조치가 필요한 상태 |
| `error` | 요청 실패, 작업 실패, 복구가 필요한 오류 |

## 8. Exception 처리

- 사용자에게는 일반화된 오류 메시지를 보여줍니다.
- 상세 오류, stack trace, 내부 경로는 서버 로그에만 남깁니다.
- Repository는 데이터 접근 오류를 그대로 화면까지 전달하지 않습니다.
- Service는 업무상 실패를 도메인 오류나 메시지 코드로 변환합니다.
- Route Handler와 Server Action은 오류를 HTTP status와 안전한 응답 형식으로 변환합니다.
- Payload hook에서 예외가 발생하면 저장 흐름을 중단할지, 후속 작업만 실패 처리할지 명확히 나눕니다.
- Agent 실패는 Governance 변경 실패로 처리하지 않습니다. 답변 생성 실패와 기준 데이터 변경은 분리합니다.
