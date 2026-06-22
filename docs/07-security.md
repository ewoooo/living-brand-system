# 07. 보안

## 1. 점검 항목

| 순번 | 점검 항목 | 참고사항 | 관련 예시 |
| --- | --- | --- | --- |
| 1 | 정보 누출 | 에러 메시지는 사용자에게 일반화된 메시지만 제공하고, 상세한 오류 정보는 서버 로그로만 기록합니다. | 1 |
| 2 | 불충분한 인가 | 클라이언트 단 검증에 의존하지 않고, 서버 측에서 역할 기반 접근 제어를 사용합니다. | 2, 3 |
| 3 | 크로스사이트 스크립팅 | 사용자 입력 데이터는 React 렌더링 기본 escaping을 우선 사용하고, HTML 삽입이 필요한 경우 sanitize를 거칩니다. | 4 |
| 4 | 불충분한 세션 만료 | 관리자 페이지 세션은 10분 제한을 적용합니다. |  |
| 5 | 데이터 평문 전송 | 모든 통신 구간에 HTTPS를 강제 적용하고, HTTP 요청은 HTTPS로 리디렉션합니다. | 5 |
| 6 | 자동화 공격 | 관리자 페이지 로그인 횟수를 5회로 제한합니다. |  |
| 7 | 파일 업로드 | 업로드 시 허용 확장자를 제한하고, 실행 권한을 제거합니다. | 6 |
| 8 | 파일 다운로드 | 다운로드 대상 파일과 접근 권한을 서버에서 검증합니다. | 6 |
| 9 | SQL 인젝션 | 쿼리 작성 시 Payload query, ORM, parameterized query를 사용하여 외부 입력이 쿼리 구조에 영향을 주지 않도록 설정합니다. | 7 |
| 10 | 불충분한 인증 | 관리자 페이지에는 강한 비밀번호 정책과 필요 시 2차 인증을 적용합니다. |  |
| 11 | 크로스사이트 리퀘스트 변조 (CSRF) | 상태 변경 요청은 서버에서 인증 상태, origin, CSRF 보호 조건을 확인합니다. |  |
| 12 | 프로세스 검증 누락 | UI에서 통과한 검증을 신뢰하지 않고 Route Handler, Server Action, Payload hook에서 다시 검증합니다. |  |
| 13 | 약한 문자열 강도 | 비밀번호, token, secret은 충분한 길이와 난수성을 요구하고 기본값을 운영에 사용하지 않습니다. |  |
| 14 | 관리자 페이지 노출 | Payload Admin은 내부 사용자에게만 노출하고, 운영 환경에서 접근 제어와 rate limit을 적용합니다. |  |
| 15 | 위치 공개 | 에러, 로그, 응답, 다운로드 URL에 내부 경로와 object storage key를 노출하지 않습니다. |  |
| 16 | 세션 고정 | 로그인 후 세션을 재발급하고, 쿠키에는 `httpOnly`, `secure`, `sameSite` 속성을 적용합니다. |  |
| 17 | 버퍼 오버플로우 | Node.js 레벨에서는 파일 크기, 요청 body 크기, 이미지 처리 크기를 제한해 메모리 고갈을 방지합니다. |  |
| 18 | 운영체제 명령 실행 | 사용자 입력을 shell command에 전달하지 않고, 필요한 작업은 안전한 라이브러리 API로 처리합니다. |  |
| 19 | 디렉터리 인덱싱 | 정적 파일과 업로드 저장소는 디렉터리 목록을 노출하지 않습니다. |  |
| 20 | 취약한 패스워드 복구 | 비밀번호 재설정 token은 1회성, 짧은 만료 시간, 서버 저장 검증을 적용합니다. |  |
| 21 | 쿠키 변조 | 권한 판단에 클라이언트 쿠키 값을 직접 사용하지 않고 서버 세션과 Payload user를 기준으로 판단합니다. |  |
| 22 | 환경 변수 및 Secret 관리 | `PAYLOAD_SECRET`, DB URL, API key가 코드, 로그, 클라이언트 번들에 노출되지 않도록 관리합니다. |  |
| 23 | 관리자 권한 분리 | Admin, Manager, Consumer 역할별 권한을 분리하고, 관리자 기능 접근을 최소 권한으로 제한합니다. |  |
| 24 | API 접근 제어 | Payload REST, GraphQL, Local API에서 collection별 access control 누락이 없는지 확인합니다. Local API는 기본적으로 `user`와 `overrideAccess: false`를 사용합니다. |  |
| 25 | GraphQL 노출 관리 | 운영 환경에서 GraphQL Playground, introspection, 과도한 query depth 노출을 제한합니다. |  |
| 26 | 파일 MIME 검증 | 업로드 파일은 확장자뿐 아니라 MIME type과 실제 파일 내용을 함께 검증합니다. |  |
| 27 | 업로드 파일 크기 제한 | 파일 크기, 개수, 총 업로드 용량을 제한하여 장애와 비용 증가를 방지합니다. |  |
| 28 | Rate limit | 로그인, API, 검색, Agent 질의에 요청 횟수 제한을 적용합니다. |  |
| 29 | 감사 로그 | 관리자 작업, 권한 변경, 발행, 반려, 예외 처리를 추적 가능하게 기록합니다. |  |
| 30 | 의존성 취약점 | npm package와 lockfile의 취약점을 정기적으로 점검하고 업데이트합니다. |  |
| 31 | 보안 헤더 | CSP, HSTS, X-Frame-Options, Referrer-Policy 같은 보안 헤더를 적용합니다. |  |
| 32 | Agent 컨텍스트 제한 | Agent는 published content와 허용된 작업 맥락만 조회하고, draft/private content를 답변 근거로 사용하지 않습니다. |  |
| 33 | Agent 응답 검증 | Agent 응답은 최종 Governance 결정으로 사용하지 않고, 근거 기준과 신뢰도, 사람 검토 필요 여부를 함께 기록합니다. |  |
| 34 | Server Action 보호 | Server Action은 클라이언트에서 호출되더라도 서버에서 인증, 권한, 입력 스키마를 다시 검증합니다. |  |
| 35 | 업로드 저장소 격리 | 업로드 파일은 실행 가능한 public path에 직접 저장하지 않고, object storage 또는 Payload upload collection의 권한 검사를 거쳐 제공합니다. |  |

## 2. 관련 예시

### 문제 1

#### 문제 설명

#### 문제 코드

#### 해결 방안

## 3. Next.js와 Payload 적용 기준

### 인증과 인가

- 모든 관리자와 내부 사용자는 Payload `users` collection을 통해 인증합니다.
- Collection별 `access` 함수를 기본 보안 경계로 사용합니다.
- Route Handler와 Server Action은 요청마다 현재 사용자를 확인합니다.
- Payload Local API를 사용할 때는 가능한 `user`와 `overrideAccess: false`를 전달합니다.
- `overrideAccess: true`는 migration, seed, 관리성 batch처럼 명확한 예외에서만 사용합니다.

### 입력 검증

- UI validation은 사용자 편의를 위한 1차 검증입니다.
- 서버에서는 Zod 같은 schema validator나 Payload field validation으로 다시 검증합니다.
- Payload hook은 상태 전이, 필수 관계, 발행 조건을 다시 확인합니다.
- Agent 질문, 검색어, 업로드 metadata도 일반 입력값과 동일하게 검증합니다.

### 출력과 에러

- 사용자에게는 일반화된 오류 메시지를 보여줍니다.
- stack trace, 내부 경로, collection query, object storage key는 응답에 포함하지 않습니다.
- 상세 오류는 서버 로그에만 남깁니다.
- 로그에는 secret, token, password, 개인정보, 원본 파일 경로를 남기지 않습니다.

### 파일 업로드와 다운로드

- 업로드는 확장자, MIME type, 파일 크기, 파일 개수를 모두 검증합니다.
- 원본 파일명은 표시용 metadata로만 사용하고 저장 key는 예측 불가능하게 만듭니다.
- 업로드 파일은 실행 권한이 없는 저장소에 둡니다.
- 다운로드는 파일 ID와 사용자 권한을 서버에서 확인한 뒤 제공합니다.

### Agent 보안

- Agent 검색은 published content만 대상으로 합니다.
- Agent는 draft, archived, private 기준을 답변 근거로 사용하지 않습니다.
- Agent 답변에는 근거 기준, 기준 버전, 신뢰도, 사람 검토 필요 여부를 함께 남깁니다.
- Agent 실패는 사용자 작업 실패나 Governance 변경 실패와 분리해서 처리합니다.
- Agent 질의에는 rate limit을 적용합니다.

### 운영 보안

- 운영 환경에서는 GraphQL Playground, introspection, 과도한 query depth를 제한합니다.
- CSP, HSTS, X-Frame-Options, Referrer-Policy 같은 보안 헤더를 적용합니다.
- 관리자 페이지는 내부 사용자에게만 노출하고 rate limit을 적용합니다.
- 의존성 취약점은 lockfile 기준으로 정기 점검합니다.
