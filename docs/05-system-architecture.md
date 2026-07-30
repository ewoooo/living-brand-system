# 05. 시스템 아키텍처

이 문서는 [04. 도메인 모델](04-domain-model.md)의 바운디드 컨텍스트, 엔티티, 이벤트를 실제 시스템 구조에 배치하는 기준을 정리합니다.
초기 구조는 모듈러 모놀리스로 시작하고, 현재 상태, Official Version, Snapshot, Event, Log의 책임을 분리합니다.
프로젝트의 실제 폴더 구조와 개발 규칙은 [06. 프로젝트 구조와 개발 규칙](06-project-structure.md), 보안 기준은 [07. 보안](07-security.md)을 기준으로 봅니다.

## 1. 원칙

- 바운디드 컨텍스트마다 마이크로서비스를 만들지 않고 모듈러 모놀리스를 적용합니다.
- 바운디드 컨텍스트는 코드 경계와 데이터 소유권으로 분리합니다.
- 초기에는 하나의 애플리케이션과 하나의 PostgreSQL 인스턴스로 배포합니다.
- 현재 업무 상태와 과거 기준 재현 데이터를 분리합니다.
- 전체 Event Sourcing은 채택하지 않습니다.
- 이벤트는 반응, 전달, 감사, 운영 목적에 맞을 때만 기록합니다.

## 2. 구조

### 구조 원칙

초기 구조는 단일 애플리케이션으로 배포합니다.
마이크로서비스 분리는 배포 독립성, 장애 격리, 확장 요구가 실제로 생긴 뒤 검토합니다.

초기 요청 흐름은 하나의 Next.js + Payload 애플리케이션 안에서 다음 구조를 기준으로 합니다.
Payload CMS는 별도 배포 서비스가 아니라 Admin, route, Local API, collection, hook을 제공하는 애플리케이션 내부 실행 계층입니다.

```text
Presentation Layer
  -> Request Layer
  -> Application / Service Layer
  -> Repository Interface
  -> Repository Implementation
  -> Drizzle ORM / CMS SDK
  -> Storage Layer
```

이 문서의 Domain Service Layer는 Application / Service Layer와 같은 경계를 뜻합니다.
외부 전달이나 실패 재시도가 필요한 이벤트만 Outbox 도입을 검토합니다.

#### Route 계약

Client Route는 화면 이동과 URL 상태만 관리합니다.
Client Route는 비즈니스 로직, 데이터 저장, Payload CMS 접근, Repository 호출을 수행하지 않습니다.

Server Route Handler는 HTTP 요청을 Service 호출로 연결하는 adapter입니다.
Server Route Handler는 request parsing, Service Input 생성, 인증과 권한 확인, Service 호출, Output의 HTTP response 변환만 담당합니다.
비즈니스 로직, Repository 직접 호출, Payload CMS 직접 호출, Entity 생성과 수정은 Application / Service Layer에서 처리합니다.

#### Service 계약

Service는 UI나 API가 아니라 하나의 Use Case를 실행하는 계층입니다.
외부에서 호출하는 Use Case Service는 Input과 Output 모델로 계약을 정의하고, `execute(input)`을 진입점으로 사용합니다.
Presentation Layer는 Service의 Input / Output만 알고, 내부 저장 방식이나 Repository 구현체를 알면 안 됩니다.

#### Repository 경계

Service는 ORM, Payload Local API, 외부 SDK를 직접 호출하지 않습니다.
Service는 Repository Interface만 알고, 실제 데이터 접근은 Repository Implementation이 담당합니다.
Repository는 저장소 접근만 담당하고, 비즈니스 로직과 상태 전이 판단은 Service에 둡니다.

```text
Application / Service Layer
  ↓
--------------------------------
Repository Interface
  ↓
Repository Implementation
  ↓
Drizzle ORM / CMS SDK
--------------------------------
  ↓
DB
```

| 계층 | 책임 |
| --- | --- |
| Application / Service Layer | 유즈케이스 실행, 권한 확인, 상태 전이 판단 |
| Repository Interface | Service가 필요한 데이터 접근 계약 |
| Repository Implementation | Drizzle ORM, Payload Local API, CMS SDK 호출 |
| DB | PostgreSQL과 파일 참조 저장소 |

#### 모듈 기준

바운디드 컨텍스트는 다음 기준으로 나눕니다.

- 코드 소유 경계
- 데이터 소유 경계
- Domain Service Layer 경계
- 도메인 용어와 규칙 경계

컨텍스트 간 데이터 접근은 소유 모듈의 Domain Service Layer 또는 명시된 읽기 모델을 통해 수행합니다.
다른 컨텍스트의 테이블을 직접 수정하지 않습니다.

### 서비스 구조

#### 전체 서비스 구조

Frontend 요청은 같은 애플리케이션 내부의 Request Layer가 받습니다.
Request Layer는 화면 단위 요청을 Domain Service Layer 호출로 조합하고, 프론트엔드에 필요한 응답 형태로 변환합니다.
도메인 규칙과 상태 변경 판단은 Request Layer가 아니라 Domain Service Layer에 둡니다.
여기서 도메인은 별도 구현 레이어가 아니라 업무 개념과 규칙을 뜻합니다.
이 그림은 서브도메인 사이의 업무 관계가 아니라 서비스 레이어 배치를 보여줍니다.


```mermaid
flowchart LR
  subgraph Client["Client"]
    AdminUI["Admin view"]
    GuidelineUI["Guideline view"]
    QualityCheckUI["Creator quality check view"]
    AgentQueryUI["Creator agent query view"]
    PluginControlUI["Plugin control view"]
    TemplateControlUI["Template control view"]
  end

  subgraph Request["Request"]
    ServerRenderRouteHandler["Server render route handler"]
    ClientFetchRouteHandler["Client fetch route handler"]
  end

  subgraph Services["Domain services"]
    subgraph PayloadSupported["Payload CMS supported"]
      GuidelinePublishingModule["Guideline publishing service"]
      BrandResourcePublishingModule["Brand resource publishing service"]
      UsageQueryModule["Usage query service"]
      BehaviorEventModule["Behavior event service"]
    end

    subgraph ExternalServices["External services"]
      BrandAssetGenerationModule["Brand asset generation service"]
      AnswerGenerationModule["Answer generation service"]
      QualityModule["Quality check service"]
    end
  end

  subgraph Repositories["Repositories"]
    subgraph PayloadRepositories["Payload CMS supported"]
      GuidelineRepository["Guideline records repository"]
      BrandResourceRepository["Brand resource records repository"]
      BrandAssetGenerationRepository["Brand asset generation records repository"]
      QualityRepository["Quality session records repository"]
      BehaviorEventRepository["Behavior event logs repository"]
    end

    subgraph PayloadStorageAdapter["Payload storage adapter"]
      StorageRepository["Storage repository"]
    end

    subgraph ExternalAdapters["External adapters"]
      ProductionResourceRepository["Production resource lookup adapter"]
      AgentRepository["Agent repository"]
    end
  end

  AgentAdapter["Agent adapter / tool set"]

  subgraph Storage["Records and files"]
    GuidelineStore["Guideline records<br/>(BrandGuideline / GuidelineSection / GuidelinePage / Rule placement)"]
    QualityRuleStore["Quality rule records<br/>(Rule / RuleChecker / CheckScenario)"]
    BrandResourceStore["Brand resource records<br/>(Asset metadata / Template metadata / Plugin ref)"]
    BrandAssetGenerationStore["Brand asset generation records<br/>(AssetGenerationSession / AssetGenerationInput / AssetGenerationOutput)"]
    QualityStore["Quality session records<br/>(QASession / CheckSession)"]
    BehaviorEventStore["Behavior event logs<br/>(BehaviorEventLog)"]
    FileStorage["Uploaded file storage<br/>(AWS S3)"]
  end

  subgraph External["External dependencies"]
    FigmaSDK["Figma SDK<br/>(template source)"]
    AgentSDK["Vercel AI SDK<br/>(Anthropic provider)"]
    PluginStorage["Plugin runtime"]
    UmamiAnalytics["Umami analytics"]
  end

  AdminUI -->|"Payload Admin request"| GuidelinePublishingModule
  AdminUI -->|"Payload Admin request"| BrandResourcePublishingModule

  GuidelineUI -->|"initial render"| ServerRenderRouteHandler
  QualityCheckUI -->|"initial render"| ServerRenderRouteHandler
  AgentQueryUI -->|"initial render"| ServerRenderRouteHandler
  PluginControlUI -->|"initial render"| ServerRenderRouteHandler
  TemplateControlUI -->|"initial render"| ServerRenderRouteHandler
  QualityCheckUI -->|"result fetch"| ClientFetchRouteHandler
  AgentQueryUI -->|"answer fetch"| ClientFetchRouteHandler
  PluginControlUI -->|"result fetch"| ClientFetchRouteHandler
  TemplateControlUI -->|"result fetch"| ClientFetchRouteHandler
  AdminUI -->|"usage query"| ClientFetchRouteHandler
  ServerRenderRouteHandler -->|"guideline content"| GuidelineRepository
  ServerRenderRouteHandler -->|"linked resources"| BrandResourceRepository
  ServerRenderRouteHandler -->|"asset tool state"| BrandAssetGenerationModule
  ServerRenderRouteHandler -->|"answer tool state"| AnswerGenerationModule
  ServerRenderRouteHandler -->|"quality tool state"| QualityModule
  ClientFetchRouteHandler -->|"request"| BrandAssetGenerationModule
  ClientFetchRouteHandler -->|"request"| AnswerGenerationModule
  ClientFetchRouteHandler -->|"request"| QualityModule
  GuidelinePublishingModule -->|"read / write"| GuidelineRepository
  BrandResourcePublishingModule -->|"read / write"| BrandResourceRepository
  BrandAssetGenerationModule -->|"write session/output"| BrandAssetGenerationRepository
  BrandAssetGenerationModule -->|"read resources"| ProductionResourceRepository
  AnswerGenerationModule -->|"write QA session"| QualityRepository
  AnswerGenerationModule -->|"agent request"| AgentRepository
  QualityModule -->|"write check session"| QualityRepository
  QualityModule -->|"agent request"| AgentRepository
  UsageQueryModule -->|"read generation records"| BrandAssetGenerationRepository
  UsageQueryModule -->|"read quality records"| QualityRepository
  UsageQueryModule -->|"read behavior records"| BehaviorEventRepository
  BehaviorEventModule -->|"read / write"| BehaviorEventRepository
  ClientFetchRouteHandler -->|"usage query"| UsageQueryModule
  ClientFetchRouteHandler -->|"behavior event"| BehaviorEventModule
  BehaviorEventModule -->|"track / identify"| UmamiAnalytics
  GuidelinePublishingModule -->|"file operation"| StorageRepository
  BrandResourcePublishingModule -->|"file operation"| StorageRepository
  BrandAssetGenerationModule -->|"file operation"| StorageRepository

  AgentRepository -->|"stream / tool call"| AgentAdapter
  AgentAdapter -->|"model call"| AgentSDK

  ProductionResourceRepository --> GuidelineStore
  ProductionResourceRepository --> BrandResourceStore
  ProductionResourceRepository --> FigmaSDK
  ProductionResourceRepository --> PluginStorage
  GuidelineRepository --> GuidelineStore
  BrandResourceRepository --> BrandResourceStore
  BrandAssetGenerationRepository --> BrandAssetGenerationStore
  QualityRepository --> QualityStore
  BehaviorEventRepository --> BehaviorEventStore
  StorageRepository --> FileStorage
```

Domain Service Layer는 records, event logs, Agent adapter, 외부 의존성에 직접 접근하지 않고 Repository Interface 또는 adapter를 통해 접근합니다.
Payload CMS supported 영역은 collection, hook, access control, version, upload로 처리 가능한 흐름입니다.
Guideline publishing service와 Brand resource publishing service는 Payload publish 결과를 기준으로 충돌 확인과 resource link 정리를 처리합니다.
External services 영역은 렌더링, 스냅샷 고정, Agent 실행처럼 별도 업무 로직이 필요한 흐름입니다.
Brand resource records는 메타데이터와 참조만 보관하고, 실제 파일과 실행물은 외부 저장소 또는 런타임에 둡니다.

#### 서비스 책임 매핑

이 표는 Domain Service Layer의 서비스가 어떤 유즈케이스 흐름을 묶고, 어떤 내부 도메인 서비스와 이벤트를 책임지는지 보여줍니다.
상세 유즈케이스 절차는 [02. 유즈케이스](02-usecases.md), 전체 도메인 이벤트 목록은 [04. 도메인 모델](04-domain-model.md)을 기준으로 합니다.

| 서비스 | 담당 유즈케이스 | 내부 도메인 서비스 | 주요 이벤트 |
| --- | --- | --- | --- |
| Guideline publishing service | GL-01~13 | GuidelinePublishService | GuidelinePublished, GuidelineScheduled, GuidelineDeprecated |
| Quality rule publishing service | RULE-01~04 | RuleReferenceIntegrityService, RuleOptionsValidationService | Rule*, RuleChecker*, CheckScenario* |
| Brand resource publishing service | RES-01~26 | AssetPublishService, TemplatePublishService, PluginPublishService | BrandAsset*, Template*, Plugin*, ResourceLinkedToGuideline |
| Usage query service | LOG-01~05 | UsageQueryService | - |
| Behavior event service | LOG-06 | BehaviorEventIngestService, BehaviorEventQueryService | BehaviorEventCaptured |
| Brand asset generation service | GEN-01~11 | BrandAssetGenerationService | AssetGenerationSessionStarted, AssetGenerationInputChanged, AssetGenerationPreviewGenerated, AssetGenerationOutputCreated, AssetGenerationSessionCompleted |
| Answer generation service | QA-01~07 | AnswerGenerationService | QuestionAsked, AnswerProvided |
| Quality check service | QC-01~05 | QualityCheckService | CheckSessionStarted, CheckRunCompleted, CheckCompleted |

#### 서브도메인 구조

서브도메인별 상세 구조는 런타임에서 어떤 서비스가 어떤 객체를 받아 처리하고, 어떤 이벤트를 남기는지 기준으로 작성합니다.

##### 가이드라인 관리

가이드라인 관리는 Payload CMS supported 흐름으로 처리합니다.
가이드라인 본문, 섹션, 페이지, Rule 배치, 자원 연결의 편집, draft/publish 상태, 예약 발행, Payload revision, diff/restore는 Payload CMS가 맡습니다.
Rule 정의·Checker 계약·CheckScenario 발행은 Quality rule publishing service가 별도로 맡고, Guideline publishing service와 Brand resource publishing service는 가이드라인 및 자원 publish 결과 후처리를 담당합니다.
사용자에게 보여주는 화면은 별도 서브도메인이 아니라 Server render route handler가 published guideline과 linked resource를 읽어 만든 결과입니다.

| 흐름 | 담당 | 입력 | 결과 |
| --- | --- | --- | --- |
| Rule edit / publish | Rule·RuleChecker·CheckScenario collection, access control, hooks, drafts, QualityRuleService | Admin request | 독립 Rule 기준과 발행 상태 |
| Guideline / resource edit / publish | collection, access control, hooks, drafts, scheduled publish, Payload revision, diff/restore, GuidelinePublishService, AssetPublishService, TemplatePublishService, PluginPublishService | Admin request | CMS 편집 상태, publish 상태, Payload revision, ResourceLinkedToGuideline |
| Guideline render | Server render route handler | Guideline page request | Rendered guideline view |

```mermaid
flowchart TB
  AdminRequest["Admin request"]
  GuidelineRequest["Guideline page request"]

  subgraph PayloadSupported["Payload CMS supported"]
    Collections["Collections: guideline / page block / rule / resource"]
    Access["Access control"]
    Hooks["Hooks"]
    Draft["Guideline / resource draft"]
    PublishState["Draft / published / scheduled state"]
    Revision["Payload revision"]
    DiffRestore["Diff / restore"]
    EditState["CMS edit state"]
    PublishResult["Payload publish result"]
    QualityRuleService["Quality rule publishing service"]
    GuidelineService["Guideline publishing service"]
    ResourceService["Brand resource publishing service"]
    RuleIntegrity["RuleReferenceIntegrityService"]
  end

  subgraph Repositories["Repositories / adapters"]
    GuidelineRepository["Guideline records repository"]
    QualityRuleRepository["Quality rule records repository"]
    BrandResourceRepository["Brand resource records repository"]
  end

  ServerRender["Server render route handler"]
  RenderedView["Rendered guideline view"]

  AdminRequest --> Collections
  Collections --> Access
  Access --> Hooks
  Hooks --> Draft
  Draft --> PublishState
  PublishState --> Revision
  Revision --> DiffRestore
  Revision --> EditState

  PublishState --> PublishResult
  PublishResult --> QualityRuleService
  PublishResult --> GuidelineService
  PublishResult --> ResourceService
  QualityRuleService --> RuleIntegrity
  RuleIntegrity -->|"read Rule references"| QualityRuleRepository
  GuidelineService -->|"read / update published guideline"| GuidelineRepository
  ResourceService -->|"read / update resource links"| BrandResourceRepository

  GuidelineRequest --> ServerRender
  ServerRender -->|"read published guideline"| GuidelineRepository
  ServerRender -->|"read linked resources"| BrandResourceRepository
  ServerRender --> RenderedView
```

##### 제작 관리

제작 관리는 Creator 요청을 받아 ResourceRef를 조회하고, 산출물은 서버 저장소에 남긴 뒤 클라이언트에는 참조와 미리보기 응답만 돌려줍니다.
클라이언트는 제작 결과의 원본 저장 위치가 아니라 입력, 미리보기, 다운로드 요청을 다루는 화면입니다.

| 흐름 | 담당 | 입력 | 결과 |
| --- | --- | --- | --- |
| Asset generation | Brand asset generation service | StartAssetGenerationCommand, AssetGenerationInput, ApplicationTypeRef, ResourceRef | AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput, AssetGenerationOutputRef |
| Resource lookup | Production resource lookup adapter | ResourceRef | Guideline records, Brand resource records, Template source, Plugin runtime |
| Client response | Client fetch route handler | AssetGenerationOutputRef, preview data | Preview response, download/update target |

```mermaid
flowchart TB
  subgraph Request["Request"]
    Creator["Creator request"]
    ClientFetch["Client fetch route handler"]
    RequestInput["StartAssetGenerationCommand / AssetGenerationInput / ApplicationTypeRef / ResourceRef"]
  end

  subgraph Generation["Brand asset generation service"]
    ResolveResources["Resolve ResourceRef"]
    ValidateInput["Validate AssetGenerationInput"]
    CreateOutput["Create AssetGenerationOutput"]
  end

  subgraph Lookup["Resource lookup"]
    ResourceRepository["Production resource lookup adapter"]
    GuidelineRecords["Guideline records"]
    BrandResourceRecords["Brand resource records"]
    Template["Template source"]
    Plugin["Plugin runtime"]
  end

  subgraph Storage["Storage"]
    GenerationRecordsRepository["Brand asset generation records repository"]
    AssetGenerationSession["AssetGenerationSession"]
    AssetGenerationInputRecord["AssetGenerationInput"]
    Output["AssetGenerationOutput"]
    OutputRef["AssetGenerationOutputRef"]
  end

  subgraph Response["Client response"]
    Preview["Preview response"]
  end

  Creator --> ClientFetch
  ClientFetch --> RequestInput
  RequestInput --> ResolveResources
  ResolveResources --> ResourceRepository
  ResourceRepository --> GuidelineRecords
  ResourceRepository --> BrandResourceRecords
  ResourceRepository --> Template
  ResourceRepository --> Plugin
  ResolveResources --> ValidateInput
  ValidateInput --> CreateOutput
  CreateOutput -->|"write session/output"| GenerationRecordsRepository
  GenerationRecordsRepository --> AssetGenerationSession
  GenerationRecordsRepository --> AssetGenerationInputRecord
  GenerationRecordsRepository --> Output
  GenerationRecordsRepository --> OutputRef
  OutputRef --> ClientFetch
  ClientFetch --> Preview
  Preview --> Creator
```

##### 품질 검수

품질 검수는 Creator 요청을 받아 ResourceRef와 검수 대상을 고정하고, Agent 실행 결과를 검수 기록으로 저장한 뒤 클라이언트에는 결과 응답만 돌려줍니다.
클라이언트는 검수 결과의 원본 저장 위치가 아니라 결과 화면과 수정 요청을 다루는 화면입니다.

| 흐름 | 담당 | 입력 | 결과 |
| --- | --- | --- | --- |
| Check request | Client fetch route handler | RunCheckCommand, CheckTargetRef, ResourceRef | Quality check service 호출 |
| Check preparation | Quality check service | CheckTargetRef, ResourceRef | CheckInputSnapshot, CheckBasis |
| Agent execution | Agent repository | CheckInputSnapshot, CheckBasis | AgentRunRef, Agent check response |
| Check storage | Quality session records repository | CheckSession, CheckRun, CheckDecision, CheckResult, CheckRecommendation | 저장된 검수 기록 |
| Client response | Client fetch route handler | CheckResultRef, summary | Check result response |

```mermaid
flowchart TB
  subgraph Request["Request"]
    Creator["Creator request"]
    ClientFetch["Client fetch route handler"]
    RequestInput["RunCheckCommand / CheckTargetRef / ResourceRef"]
  end

  subgraph Quality["Quality check service"]
    ResolveBasis["Resolve ResourceRef"]
    FreezeInput["Create CheckInputSnapshot"]
    RunCheck["Run quality check"]
    Decide["Create CheckDecision / CheckResult"]
  end

  subgraph AgentExecution["Agent execution"]
    AgentRepository["Agent repository"]
    AgentRunRef["AgentRunRef"]
    AgentResponse["Agent check response"]
  end

  subgraph Storage["Storage"]
    QualityRepository["Quality session records repository"]
    CheckSession["CheckSession"]
    Snapshot["CheckInputSnapshot"]
    CheckBasis["CheckBasis"]
    CheckRun["CheckRun"]
    CheckResult["CheckDecision / CheckResult / CheckRecommendation"]
    CheckResultRef["CheckResultRef"]
  end

  subgraph Response["Client response"]
    ResultView["Check result response"]
  end

  Creator --> ClientFetch
  ClientFetch --> RequestInput
  RequestInput --> ResolveBasis
  ResolveBasis --> FreezeInput
  FreezeInput --> RunCheck
  RunCheck --> AgentRepository
  AgentRepository --> AgentRunRef
  AgentRepository --> AgentResponse
  AgentResponse --> Decide
  Decide -->|"write check records"| QualityRepository
  QualityRepository --> CheckSession
  QualityRepository --> Snapshot
  QualityRepository --> CheckBasis
  QualityRepository --> CheckRun
  QualityRepository --> CheckResult
  QualityRepository --> CheckResultRef
  CheckResultRef --> ClientFetch
  ClientFetch --> ResultView
  ResultView --> Creator
```

##### 사용 기록

사용 기록은 Brand asset generation records와 Quality session records만으로 부족한 운영 조회가 생길 때 별도로 둡니다.
업무 활동 기록은 기본 저장소의 상태와 타임스탬프를 우선 사용합니다.
화면 행동은 업무 레코드와 성격이 다르므로 BehaviorEventLog와 분석 도구로 전달합니다.

| 서비스 | 세부 도메인 서비스 | 입력 | 객체 흐름 | 이벤트 |
| --- | --- | --- | --- | --- |
| Usage query service | UsageQueryService | UsageQueryCommand | Brand asset generation records / Quality session records / BehaviorEventLog -> Usage history response | - |
| Behavior event service | BehaviorEventIngestService, BehaviorEventQueryService | BehaviorEventCommand | PageView / Click / Search / Download event -> BehaviorEventLog -> analytics adapter | BehaviorEventCaptured |

```mermaid
flowchart TB
  Manager["Manager request"]
  UsageQuery["Usage query service"]
  GenerationRecords["Brand asset generation records repository"]
  QualityRecords["Quality session records repository"]
  BehaviorRecords["Behavior event logs repository"]
  UsageResponse["Usage history response"]
  Client["Client fetch / page view"]
  BehaviorService["Behavior event service"]
  Analytics["Umami analytics"]

  Manager --> UsageQuery
  UsageQuery --> GenerationRecords
  UsageQuery --> QualityRecords
  UsageQuery --> BehaviorRecords
  UsageQuery --> UsageResponse

  Client --> BehaviorService
  BehaviorService --> BehaviorRecords
  BehaviorService --> Analytics
```

## 3. 객체 및 정의

### Payload collection / global 후보

초기 Payload collection은 Manager가 직접 관리하는 기준 데이터부터 둡니다.
루트 애그리거트 단위로만 고정하지 않고, 독립적으로 편집, 검색, 재사용, 권한 관리, 발행해야 하는 객체는 별도 collection 후보로 둡니다.
브랜드 자산은 BrandAsset을 단일 collection으로 고정하지 않고, 브랜드 코어 자산과 어플리케이션 자산으로 나누어 검토합니다.
사용 과정에서 자동 생성되는 작업, 질의, 검수, 로그 기록은 여기서 collection으로 확정하지 않습니다.
가이드라인 자체는 제품 안에서 하나만 운영하므로 Payload global로 둡니다.

| 후보 | 관리 단위 | 주요 관계 |
| --- | --- | --- |
| `guideline` global | BrandGuideline | 단일 가이드라인 설정 |
| `guideline-documents` | GuidelineDocument | 계층 깊이로 장·섹션·페이지를 표현하고 blocks와 Rule 배치·근거를 소유 |
| `rules` | Rule | 문서와 독립된 검수 기준, 메시지, RuleChecker 관계를 관리 |
| `check-scenarios` | CheckScenario | 검수 목적별 이름, 설명과 순서가 있는 CheckKey 목록을 관리 |
| `rule-checkers` | RuleChecker | executor 유형과 checker 또는 model binding을 1:1로 관리하는 검사 도구 계약 |
| `brand-logos` | BrandLogo | guideline document, asset generation session, check basis에서 참조 |
| `brand-colors` | BrandColor | guideline document, Check, template, plugin에서 참조 |
| `brand-typefaces` | BrandTypeface | guideline document, Check, template에서 참조 |
| `application-images` | ApplicationImage | page, asset generation session, check basis에서 참조 |
| `templates` | Template | page, plugin, asset generation session에서 참조 |
| `plugins` | Plugin | page, template, asset generation session에서 참조 |

### 런타임 객체

런타임 객체는 사용자 제작, 질문, 검수, 탐색 과정에서 System이 생성하는 기록입니다.
이 객체는 실제 조회, 보관, 권한, 성능 요구가 분명해진 뒤 저장 방식을 결정합니다.

| 영역 | 런타임 객체 |
| --- | --- |
| 에셋 제너레이션 기록 | AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput |
| 질의응답 기록 | QASession, Question, Answer, AnswerCitation, AnswerConfidence |
| 품질 검수 기록 | CheckInputSnapshot, CheckSession, CheckTarget, CheckRun, CheckBasis, CheckDecision, CheckResult, CheckRecommendation |
| 화면 행동 기록 | BehaviorEventLog, PageViewEvent, ClickEvent, AssetDownloadEvent, SectionDwellEvent, SearchEvent, OutboundLinkEvent, CustomEvent |
| Agent 실행 기록 | AgentRunRef, AgentRunStarted, AgentRunCompleted, AgentRunFailed |

### 버전 컨트롤

이 문서에서 Version은 Payload revision이 아니라 Official Version을 뜻합니다.
현재 구현의 `live` 기준은 Payload CMS에서 publish된 문서를 `draft: false`로 읽은 결과입니다.
별도 Official Version 엔티티는 CheckBasis, ResourceRef, Agent 실행 기록에서 독립 VersionRef가 필요해질 때 도입합니다.

| 표준 용어 | 의미 |
| --- | --- |
| Payload revision | Payload CMS가 남기는 편집 이력입니다. Admin diff와 restore에 사용합니다. |
| Official Version | Creator와 Agent가 참조하는 발행 기준입니다. GuidelineVersion, RuleVersion, RuleCheckerVersion, BrandAssetVersion, TemplateVersion, PluginVersion이 여기에 속합니다. Rule은 GuidelineVersion과 독립된 발행 생명주기를 가집니다. |
| VersionStatus | Official Version의 상태입니다. `stage`, `live`, `archived`를 사용합니다. |
| VersionRef | 실행 기록이 특정 Official Version을 가리키는 참조값입니다. |
| ResourceRef | 에셋 제너레이션이 사용하는 published guideline, CheckKey, asset, template, plugin 참조 묶음입니다. 품질 검수는 선택된 Check를 CheckRulesetSnapshot으로 고정합니다. |
| Snapshot | 실행 당시 입력값 자체를 재현해야 할 때만 복사해 고정한 값입니다. |

Payload revision은 CMS 편집 이력과 draft/publish 흐름에 사용합니다.
Admin UI의 diff, restore, draft 상태 관리는 Payload revision을 우선 사용합니다.
새 에셋 제너레이션과 새 Agent 실행은 기본적으로 `live` 상태의 Official Version을 조회합니다.
에셋 제너레이션에는 ResourceRef를 저장하고, 품질 검수는 ResourceRef에서 필요한 VersionRef를 CheckBasis로 고정합니다.
Agent 실행 기록에는 필요한 VersionRef를 저장합니다.
Snapshot은 검수 입력처럼 나중에 같은 조건으로 다시 봐야 하는 값이 있을 때만 만듭니다.

## 4. 전략

### 이벤트

모든 변경을 이벤트로 저장하지 않습니다.
Payload revision, Official Version, Snapshot으로 재현할 수 있는 변경은 별도 이벤트로 남기지 않습니다.

이벤트는 다음 경우에만 저장합니다.

- 발행처럼 감사가 필요한 작업
- 다른 도메인이 알아야 하는 확정된 결과
- 비동기 후속 작업을 시작해야 하는 결과

예를 들어 `GuidelinePublished`, `RuleCheckerVersionPublished`, `AssetGenerationSessionCompleted`, `CheckCompleted`는 저장할 수 있습니다.
반면 단순 문구 수정, 내부 계산값, 장애 로그는 도메인 이벤트로 저장하지 않습니다.

#### 저장하는 이벤트 예시

```mermaid
flowchart TD
  A["Manager publishes guideline"]
  B["Payload CMS publish"]
  C["Guideline publishing service"]
  D["Guideline records repository"]

  A --> B
  B --> C
  C -->|"store GuidelinePublished when audit is needed"| D
```

#### 저장하지 않는 변경 예시

```mermaid
flowchart TD
  A["Manager edits page title"]
  B["Payload collection update"]
  C["Payload revision"]
  D["No domain event"]

  A --> B
  B --> C
  C --> D
```

외부 시스템에 이벤트를 안정적으로 전달해야 하는 요구가 생기기 전까지 Outbox는 만들지 않습니다.

### 에이전트 실행

Agent와 Creator는 도메인 상태를 직접 변경하지 않습니다.
외부 요청은 Request Layer로 들어오고, Domain Service Layer가 기준 VersionRef와 실행 입력을 정한 뒤 Agent 실행을 요청합니다.
Agent adapter는 실행 전에 enabled/default AgentSkill을 조회해 지시문을 구성할 수 있습니다.
Agent 실행 결과는 Domain Service Layer가 검증한 뒤 Answer, CheckResult, CheckRecommendation 같은 도메인 객체에 저장합니다.

#### 호출 경로

Answer generation service와 Quality check service는 모델 SDK나 Agent tool을 직접 호출하지 않습니다.
두 서비스는 Agent repository를 통해 AI SDK 기반 adapter 실행을 요청합니다.

```mermaid
flowchart TD
  A["Creator UI / API request"]
  B["Request Layer"]
  C["Answer / Quality service"]
  D["Resolve live Official Version"]
  E["Store VersionRef and input"]
  F["Agent repository"]
  G["Agent adapter / tool set"]
  H["AgentRunRef"]
  I["Answer / CheckResult"]

  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F --> G
  G --> H
  G -->|"result"| I
  I -->|"links AgentRunRef"| H
```

#### 저장 기준

- 새 Agent 실행은 기본적으로 `live` 상태의 Official Version을 조회합니다.
- 실행을 시작할 때 조회된 VersionRef를 저장하고 요청 입력을 고정합니다.
- 답변과 검수 결과에는 AgentRunRef를 연결합니다.
- AgentRunRef는 모델 실행 기록을 조회하기 위한 참조로만 사용합니다.

#### Asset generation 상태 변경

- 에셋 제너레이션 시작 시점의 ResourceRef를 저장합니다.
- 산출물과 검수 입력은 필요한 경우 Snapshot으로 고정합니다.
- 상태 변경은 Domain Service Layer를 통해 수행합니다.
