# 04. 도메인 모델

## 1. 목적

이 문서는 브랜드 운영 시스템의 도메인, 서브도메인, 바운디드 컨텍스트, 도메인 모델을 정의합니다.
목표는 개발자가 Payload collection과 관계를 설계하기 전에 모델 경계를 먼저 합의할 수 있게 만드는 것입니다.

## 2. 용어

| Term | Meaning |
| --- | --- |
| 도메인 | 제품이 해결하려는 가장 큰 업무 영역 |
| 서브도메인 | 도메인을 책임과 문제 기준으로 나눈 하위 영역 |
| 바운디드 컨텍스트 | 같은 용어와 규칙이 일관되게 쓰이는 경계 |
| 애그리거트(관리 단위) | 함께 생성, 수정, 삭제되어야 하는 도메인 객체 묶음 |
| 엔티티 | 고유한 식별자와 생명주기를 갖는 객체 |
| 값 객체 | 식별자보다 값 자체가 중요한 객체 |
| 도메인 서비스 | 특정 객체 하나에 넣기 어려운 도메인 규칙 |
| 도메인 이벤트 | 도메인에서 이미 일어난 중요한 사건 |

## 3. 도메인 구성

```text
[도메인] 브랜드 운영 시스템
 ├── [핵심 서브도메인] 가이드라인 관리
 ├── [핵심 서브도메인] 제작 관리
 ├── [핵심 서브도메인] 품질 검수
 └── [지원 서브도메인] 사용 기록
```

브랜드 운영 시스템은 가이드라인을 문서로 보관하는 시스템이 아니라, 기준을 구조화하고, 산출물 제작과 품질 검수를 거쳐, 사용 기록을 남기는 시스템입니다.

### 상위 도메인 관계도

상위 관계도는 서비스 호출이나 세부 이벤트 흐름이 아니라 도메인 간 계약을 보여줍니다.
엣지는 도메인 간에 전달되거나 참조되는 대표 산출물, 기준, 근거 단위로 표현합니다.

```mermaid
flowchart LR
  Guideline["가이드라인 관리"]
  Production["제작 관리"]
  Quality["품질 검수"]
  UsageRecord["사용 기록"]

  Guideline -->|"발행 기준 / 제작 자원"| Production
  Guideline -->|"검수 기준"| Quality
  Guideline -->|"화면 행동 기록"| UsageRecord
  Production -->|"에셋 제너레이션 기록 조회"| UsageRecord
  Quality -->|"품질 검수 기록 조회"| UsageRecord
```

| 관계 | 엣지 의미 | 대표 데이터 |
| --- | --- | --- |
| 가이드라인 관리 -> 제작 관리 | 제작이 발행된 기준과 자원을 참조합니다. | ResourceRef |
| 가이드라인 관리 -> 품질 검수 | 검수가 live 상태의 Official Version을 참조합니다. | GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef |
| 가이드라인 관리 -> 사용 기록 | 가이드라인 화면 행동을 기록합니다. | BehaviorEventLog |
| 제작 관리 -> 사용 기록 | 운영 조회에서 에셋 제너레이션 기록을 읽습니다. | AssetGenerationSession, AssetGenerationOutput |
| 품질 검수 -> 사용 기록 | 운영 조회에서 질의와 검수 기록을 읽습니다. | QASession, CheckSession, CheckResult |

### 하위 도메인 관계도

이 관계도는 바운디드 컨텍스트와 핵심 객체의 참조 방향을 함께 보여줍니다.
제작 관리는 산출물을 만들고 Brand asset generation records를 남깁니다.
품질 검수는 CheckTarget에 검수 입력을 고정하고, CheckRun의 CheckBasis에서 Guideline, Rule, BrandAsset의 VersionRef를 참조합니다.
하위 관계도의 엣지는 소유, 참조, 포함, 기록 같은 관계 동사로 표현합니다.
`GuidelineVersionRef`, `RuleVersionRef`, `BrandAssetVersionRef`, `TemplateVersionRef`, `PluginVersionRef`, `AgentRunRef`처럼 별도 생명주기가 없는 참조 값은 객체 노드로 표현하지 않습니다.
단, `PageRuleRef`와 `PageAssetRef`는 페이지 안 표시 순서, 강조, 캡션, 예시 역할을 함께 담으므로 객체로 표현합니다.
세부 도메인 이벤트명은 각 도메인 모델 목록에만 둡니다.

```mermaid
flowchart LR
  subgraph GuidelineEdit["브랜드 가이드라인 편집 및 발행"]
    BrandGuideline["BrandGuideline"]
    GuidelineSection["GuidelineSection"]
    GuidelinePage["GuidelinePage"]
    PagePolicy["PagePolicy"]
    PageRuleRef["PageRuleRef"]
    PageAssetRef["PageAssetRef"]
  end

  subgraph Resource["브랜드 자원 관리"]
    Rule["Rule"]
    RuleException["RuleException"]
    BrandAsset["BrandAsset"]
    Template["Template"]
    Plugin["Plugin"]
  end

  subgraph Production["에셋 제너레이션"]
    AssetGenerationSession["AssetGenerationSession"]
    AssetGenerationInput["AssetGenerationInput"]
    AssetGenerationOutput["AssetGenerationOutput"]
  end

  subgraph QA["질의응답"]
    QASession["QASession"]
    Question["Question"]
    Answer["Answer"]
    AnswerCitation["AnswerCitation"]
  end

  subgraph QualityCheck["산출물 검수"]
    CheckSession["CheckSession"]
    CheckTarget["CheckTarget"]
    CheckInputSnapshot["CheckInputSnapshot"]
    CheckRun["CheckRun"]
    CheckBasis["CheckBasis"]
    CheckResult["CheckResult"]
    CheckRecommendation["CheckRecommendation"]
    CheckDecision["CheckDecision"]
  end

  subgraph UsageLog["사용 기록"]
    BehaviorEventLog["BehaviorEventLog"]
    PageViewEvent["PageViewEvent"]
    ClickEvent["ClickEvent"]
    AssetDownloadEvent["AssetDownloadEvent"]
    SectionDwellEvent["SectionDwellEvent"]
    SearchEvent["SearchEvent"]
    OutboundLinkEvent["OutboundLinkEvent"]
    CustomEvent["CustomEvent"]
  end

  BrandGuideline -->|"소유"| GuidelineSection
  GuidelineSection -->|"소유"| GuidelinePage
  GuidelinePage -->|"소유"| PagePolicy
  GuidelinePage -->|"소유"| PageRuleRef
  PageRuleRef -->|"규칙 사용"| Rule
  Rule -->|"소유"| RuleException
  GuidelinePage -->|"소유"| PageAssetRef
  PageAssetRef -->|"자원 사용"| BrandAsset
  GuidelinePage -->|"템플릿 사용"| Template
  GuidelinePage -->|"플러그인 사용"| Plugin

  AssetGenerationSession -->|"소유"| AssetGenerationInput
  AssetGenerationSession -->|"소유"| AssetGenerationOutput
  AssetGenerationSession -->|"참조"| BrandGuideline
  AssetGenerationSession -->|"사용"| BrandAsset
  AssetGenerationSession -->|"사용"| Template
  AssetGenerationSession -->|"사용"| Plugin

  QASession -->|"소유"| Question
  QASession -->|"소유"| Answer
  Answer -->|"소유"| AnswerCitation
  AnswerCitation -->|"근거"| Rule
  CheckSession -->|"소유"| CheckTarget
  CheckTarget -->|"고정"| CheckInputSnapshot
  CheckSession -->|"소유"| CheckRun
  CheckRun -->|"소유"| CheckBasis
  CheckBasis -->|"참조"| BrandGuideline
  CheckBasis -->|"참조"| Rule
  CheckBasis -->|"참조"| BrandAsset
  CheckRun -->|"소유"| CheckDecision
  CheckDecision -->|"소유"| CheckResult
  CheckResult -->|"소유"| CheckRecommendation
  GuidelinePage -->|"조회 행동"| BehaviorEventLog
  BehaviorEventLog -->|"분류"| PageViewEvent
  BehaviorEventLog -->|"분류"| ClickEvent
  BehaviorEventLog -->|"분류"| AssetDownloadEvent
  BehaviorEventLog -->|"분류"| SectionDwellEvent
  BehaviorEventLog -->|"분류"| SearchEvent
  BehaviorEventLog -->|"분류"| OutboundLinkEvent
  BehaviorEventLog -->|"분류"| CustomEvent
  classDef aggregate fill:#FFE8CC,stroke:#F08C00,stroke-width:2px,color:#1F1F1F;
  classDef entity fill:#E7F5FF,stroke:#1C7ED6,stroke-width:1.5px,color:#1F1F1F;
  classDef childEntity fill:#F3F0FF,stroke:#7950F2,stroke-width:1.5px,color:#1F1F1F;
  classDef record fill:#F1F3F5,stroke:#868E96,stroke-width:1.5px,color:#1F1F1F;

  class BrandGuideline,Rule,BrandAsset,Template,Plugin,AssetGenerationSession,QASession,CheckSession,BehaviorEventLog aggregate;
  class GuidelineSection,GuidelinePage,RuleException,AssetGenerationInput,AssetGenerationOutput,Question,Answer,CheckTarget,CheckInputSnapshot,CheckRun,CheckBasis,CheckDecision,CheckResult entity;
  class PagePolicy,PageRuleRef,PageAssetRef,AnswerCitation,CheckRecommendation,PageViewEvent,ClickEvent,AssetDownloadEvent,SectionDwellEvent,SearchEvent,OutboundLinkEvent,CustomEvent childEntity;
```

| 관계 | 의미 |
| --- | --- |
| GuidelinePage -> PagePolicy | 페이지는 정책 설명을 1:1로 소유합니다. |
| GuidelinePage -> RuleVersion / BrandAssetVersion / TemplateVersion / PluginVersion | 페이지는 재사용 가능한 규칙과 자원을 Official Version으로 참조합니다. |
| AssetGenerationSession -> BrandGuideline / BrandAsset / Template / Plugin | 제작은 발행 기준, 에셋, 템플릿, 플러그인을 사용하고 ResourceRef를 저장합니다. |
| 사용 기록 -> AssetGenerationSession / QASession / CheckSession | 운영 조회는 기본 레코드를 읽어 사용 이력을 구성합니다. |
| GuidelinePage -> BehaviorEventLog | 가이드라인 화면 조회, 클릭, 검색, 에셋 다운로드, 특정 구간 체류, 외부 링크 클릭 같은 화면 행동은 화면 행동 기록으로 남깁니다. |
| CheckSession -> CheckTarget | 품질 검수는 별도 실행될 때 검수 대상 값을 소유합니다. |
| CheckRun -> CheckBasis | 점검 실행은 검수 시점의 기준 묶음을 소유합니다. |
| CheckBasis -> BrandGuideline / RuleVersion / BrandAssetVersion | 기준 묶음은 검수 시점의 VersionRef를 참조합니다. |
| CheckDecision -> CheckResult | 최종 판정은 여러 점검 결과를 소유합니다. |
| CheckResult -> CheckRecommendation | 점검 결과는 필요한 수정 권장 사항을 소유합니다. |
| BrandGuideline / Rule / BrandAsset / Template / Plugin -> Version | 발행 대상은 Official Version을 만들고, Version은 PreviousVersionRef와 PayloadRevisionRef를 보존합니다. |

## 4. 가이드라인 관리

가이드라인 관리는 브랜드 가이드라인, 공식 자원, Official Version을 관리하는 서브도메인입니다.
GuidelinePage는 단순 텍스트 묶음이 아니라 PagePolicy, RuleVersion 참조, BrandAsset 참조, Template 참조, Plugin 참조, 화면 구성을 묶은 발행 단위입니다.
Rule은 여러 페이지, 템플릿, 플러그인, 검수에서 재사용되는 브랜드 자원 관리의 독립 애그리거트(관리 단위)입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 가이드라인 관리
      ├── [바운디드 컨텍스트] 브랜드 가이드라인 편집 및 발행
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): BrandGuideline
      │         │    ├── 엔티티: BrandGuidelineVersion
      │         │    ├── 엔티티: GuidelineSection
      │         │    ├── 엔티티: GuidelinePage
      │         │    │    ├── 엔티티: PagePolicy
      │         │    │    ├── 엔티티: PageRuleRef
      │         │    │    ├── 엔티티: PageAssetRef
      │         │    │    ├── 엔티티: PageExample
      │         │    │    └── 값 객체: PageComposition, DisplayOrder
      │         │    └── 값 객체: GuidelineStatus, EffectivePeriod
      │         ├── 도메인 서비스: GuidelinePublishService, VersionPublishService, VersionCompareService
      │         └── 도메인 이벤트
      │              ├── GuidelineDraftCreated, GuidelineSubmittedForReview, GuidelineApproved
      │              ├── GuidelinePublished, GuidelineScheduled, GuidelineDeprecated
      │              ├── GuidelinePageUpdated, PagePolicyUpdated, PageRuleLinked, PageAssetLinked
      │              └── GuidelineVersionStaged, GuidelineVersionPublished, GuidelineVersionArchived
      ├── [바운디드 컨텍스트] 브랜드 자원 관리
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): Rule
      │         │    ├── 엔티티: RuleVersion
      │         │    ├── 엔티티: RuleException
      │         │    └── 값 객체: RuleType, Severity, RuleScope, RuleCondition, RequiredCopy, ForbiddenCopy, ExceptionReason
      │         ├── 애그리거트(관리 단위): BrandAsset
      │         │    ├── 엔티티: AssetFile
      │         │    ├── 엔티티: BrandAssetVersion
      │         │    └── 값 객체: AssetType, UsageCondition, DownloadStatus
      │         ├── 애그리거트(관리 단위): Template
      │         │    ├── 엔티티: TemplateVersion
      │         │    └── 값 객체: TemplateSourceRef, LayoutSpec, TextStyleSpec, EditableBlockSpec, TemplateUsageCondition
      │         ├── 애그리거트(관리 단위): Plugin
      │         │    ├── 엔티티: PluginEntry, PluginCapability, PluginVersion
      │         │    └── 값 객체: PluginType, PluginUsageCondition
      │         ├── 도메인 서비스: RuleConflictCheckService, AssetPublishService, TemplatePublishService, PluginPublishService, VersionPublishService, VersionCompareService
      │         └── 도메인 이벤트
      │              ├── RuleUpdated, RuleExceptionAdded
      │              ├── BrandAssetRegistered, BrandAssetPublished, BrandAssetDeprecated
      │              ├── TemplateRegistered, TemplatePublished, TemplateDeprecated
      │              ├── PluginRegistered, PluginPublished, PluginDeprecated
      │              ├── ResourceLinkedToGuideline
      │              ├── RuleVersionStaged, RuleVersionPublished, RuleVersionArchived
      │              ├── BrandAssetVersionStaged, BrandAssetVersionPublished, BrandAssetVersionArchived
      │              ├── TemplateVersionStaged, TemplateVersionPublished, TemplateVersionArchived
      │              └── PluginVersionStaged, PluginVersionPublished, PluginVersionArchived
      └── [공통 값 객체]
           ├── VersionNumber, VersionStatus(stage/live/archived), PayloadRevisionRef
           └── PreviousVersionRef, VersionReason, VersionResourceType
```

### 가이드라인 관리 하위 도메인 관계도

```mermaid
flowchart LR
  subgraph Edit["브랜드 가이드라인 편집 및 발행"]
    BrandGuideline["BrandGuideline"]
    Section["GuidelineSection"]
    Page["GuidelinePage"]
    Policy["PagePolicy"]
    PageRuleRefNode["PageRuleRef"]
    PageAssetRefNode["PageAssetRef"]
  end

  subgraph Resource["브랜드 자원 관리"]
    Rule["Rule"]
    RuleException["RuleException"]
    BrandAsset["BrandAsset"]
    Template["Template"]
    Plugin["Plugin"]
  end

  BrandGuideline -->|"소유"| Section
  Section -->|"소유"| Page
  Page -->|"소유"| Policy
  Page -->|"소유"| PageRuleRefNode
  PageRuleRefNode -->|"규칙 사용"| Rule
  Rule -->|"소유"| RuleException
  Page -->|"소유"| PageAssetRefNode
  PageAssetRefNode -->|"자원 사용"| BrandAsset
  Page -->|"템플릿 사용"| Template
  Page -->|"플러그인 사용"| Plugin
  Rule -->|"참조"| BrandAsset

  classDef aggregate fill:#FFE8CC,stroke:#F08C00,stroke-width:2px,color:#1F1F1F;
  classDef entity fill:#E7F5FF,stroke:#1C7ED6,stroke-width:1.5px,color:#1F1F1F;
  classDef childEntity fill:#F3F0FF,stroke:#7950F2,stroke-width:1.5px,color:#1F1F1F;

  class BrandGuideline,Rule,BrandAsset,Template,Plugin aggregate;
  class Section,Page,RuleException entity;
  class Policy,PageRuleRefNode,PageAssetRefNode childEntity;
```

BrandGuideline은 사용자가 읽는 가이드라인 구조를 관리합니다.
GuidelineSection은 BrandGuideline의 상위 장이고, GuidelinePage는 실제 화면이나 문서에서 읽는 단위입니다.
GuidelineVersionRef는 BrandGuideline이 소유한 Official Version을 CheckBasis가 참조하기 위해 저장하는 값 객체입니다.

GuidelinePage는 PagePolicy를 1:1로 소유하고, RuleVersion, BrandAssetVersion, TemplateVersion, PluginVersion은 참조합니다.
PageRuleRef와 PageAssetRef는 페이지 안에서의 표시 순서, 강조, 캡션, 예시 역할을 함께 기록합니다.

Rule은 CheckBasis와 Agent 답변에서 참조하는 판단 기준입니다.
RuleException은 Rule 안에서 관리하고, 예외가 여러 규칙에 재사용되거나 별도 승인 워크플로우를 가질 때만 독립 애그리거트(관리 단위)로 분리합니다.

Official Version 전환은 별도 애그리거트를 만들지 않고, 각 원본 애그리거트가 소유한 Version 엔티티의 stage/live/archived 상태를 바꾸는 서비스 흐름으로 둡니다.
Version 이벤트는 공통 이름만 쓰지 않고, producer 또는 resource type을 식별할 수 있게 기록합니다.
예를 들어 가이드라인은 GuidelineVersionPublished, 브랜드 에셋은 BrandAssetVersionPublished처럼 구분합니다.

BrandAsset은 로고, 이미지, 아이콘처럼 공식으로 배포되는 브랜드 자산입니다.
Template은 Creator가 제작을 시작할 때 사용하는 공식 형식입니다.
TemplateSourceRef는 Figma node 또는 업로드 파일 원본을 가리키고, LayoutSpec, TextStyleSpec, EditableBlockSpec은 제작 가능한 편집 구조를 정의합니다.
Plugin은 Creator가 산출물을 만들 때 사용할 수 있는 공식 제작 기능입니다.
PluginEntry는 제품에서 호출할 수 있는 Plugin 실행 단위이고, PluginCapability는 Plugin이 제공하는 제작 기능입니다.
GuidelinePage와 Rule은 BrandAsset, Template, Plugin을 참조할 수 있지만, 파일 또는 Official Version 교체와 배포 상태는 브랜드 자원 관리가 담당합니다.

## 5. 제작 관리

제작 관리는 Creator가 내장 기능, Plugin, Template을 활용해 브랜드 에셋 산출물을 만들고 Brand asset generation records를 남기는 서브도메인입니다.
검수 요청과 Agent/System 판정은 품질 검수에서 관리합니다.
제작 관리는 AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput을 소유하고, 가이드라인과 브랜드 자원은 Production resource lookup을 통해 참조합니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 제작 관리
      └── [바운디드 컨텍스트] 산출물 제작
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): AssetGenerationSession
                │    ├── 엔티티: AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput
                │    └── 값 객체: AssetGenerationPurpose, ApplicationTypeRef, ResourceRef, AssetGenerationStatus
                ├── 도메인 서비스: Brand asset generation service
                └── 도메인 이벤트: AssetGenerationSessionStarted, AssetGenerationInputChanged, AssetGenerationPreviewGenerated, AssetGenerationOutputCreated, AssetGenerationSessionCompleted
```

### 제작 관리 하위 도메인 관계도

```mermaid
flowchart LR
  subgraph AssetGeneration["에셋 제너레이션"]
    AssetGenerationSession["AssetGenerationSession"]
    AssetGenerationInput["AssetGenerationInput"]
    AssetGenerationOutput["AssetGenerationOutput"]
    AssetGenerationStatus["AssetGenerationStatus"]
  end

  BrandGuideline["BrandGuideline"]
  BrandAsset["BrandAsset"]
  Template["Template"]
  Plugin["Plugin"]

  AssetGenerationSession -->|"참조"| BrandGuideline
  AssetGenerationSession -->|"사용"| BrandAsset
  AssetGenerationSession -->|"사용"| Template
  AssetGenerationSession -->|"사용"| Plugin
  AssetGenerationSession -->|"소유"| AssetGenerationInput
  AssetGenerationSession -->|"소유"| AssetGenerationOutput
  AssetGenerationSession -->|"상태"| AssetGenerationStatus

  classDef aggregate fill:#FFE8CC,stroke:#F08C00,stroke-width:2px,color:#1F1F1F;
  classDef entity fill:#E7F5FF,stroke:#1C7ED6,stroke-width:1.5px,color:#1F1F1F;
  classDef record fill:#F1F3F5,stroke:#868E96,stroke-width:1.5px,color:#1F1F1F;

  class AssetGenerationSession,BrandGuideline,BrandAsset,Template,Plugin aggregate;
  class AssetGenerationInput,AssetGenerationOutput entity;
  class AssetGenerationStatus record;
```

AssetGenerationSession은 Creator가 산출물을 만들기 시작한 에셋 제너레이션 단위입니다.
AssetGenerationOutput은 제작 결과물이고, 품질 검수는 필요한 시점의 검수 입력을 CheckInputSnapshot으로 고정합니다.
AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput은 Brand asset generation records로 저장하고, BrandGuideline, BrandAsset, Template, Plugin은 제작에 필요한 참조 자원으로 조회합니다.
가이드라인 화면의 조회, 클릭, 검색, 에셋 다운로드, 구간 체류, 외부 링크 클릭은 제작 관리가 아니라 화면 행동 기록으로 수집합니다.

## 6. 품질 검수

품질 검수는 CheckInputSnapshot에 고정된 입력이 기준에 맞는지 점검하고, 질문과 검수 결과를 기준에 연결하는 서브도메인입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 품질 검수
      ├── [바운디드 컨텍스트] 질의응답
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): QASession
      │         │    ├── 엔티티: Question, Answer
      │         │    └── 값 객체: AnswerCitation, AnswerConfidence, AgentRunRef
      │         ├── 도메인 서비스: Answer generation service
      │         └── 도메인 이벤트: QuestionAsked, AnswerProvided
      ├── [바운디드 컨텍스트] 산출물 검수
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): CheckSession
      │         │    ├── 엔티티: CheckTarget
      │         │    ├── 엔티티: CheckInputSnapshot
      │         │    ├── 엔티티: CheckRun
      │         │    │    ├── 엔티티: CheckBasis
      │         │    │    │    └── 값 객체: GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef
      │         │    │    └── 엔티티: CheckDecision
      │         │    │         └── 엔티티: CheckResult
      │         │    │              └── 엔티티: CheckRecommendation
      │         │    └── 값 객체: CheckOutcome, Violation, AgentRunRef
      │         ├── 도메인 서비스: Quality check service
      │         └── 도메인 이벤트: CheckSessionStarted, CheckRunCompleted, CheckCompleted
      └── [실행 기록 카탈로그]
           └── AgentRunStarted, AgentRunCompleted, AgentRunFailed
```

### 품질 검수 하위 도메인 관계도

```mermaid
flowchart LR
  Rule["Rule"]

  subgraph QA["질의응답"]
    QASession["QASession"]
    Question["Question"]
    Answer["Answer"]
    AnswerCitation["AnswerCitation"]
    AnswerConfidence["AnswerConfidence"]
  end

  subgraph Check["산출물 검수"]
    CheckSession["CheckSession"]
    CheckTarget["CheckTarget"]
    CheckInputSnapshot["CheckInputSnapshot"]
    CheckRun["CheckRun"]
    CheckBasis["CheckBasis"]
    CheckResult["CheckResult"]
    CheckRecommendation["CheckRecommendation"]
    CheckDecision["CheckDecision"]
  end

  AgentRun["AgentRun"]
  BrandGuideline["BrandGuideline"]
  BrandAsset["BrandAsset"]

  QASession -->|"소유"| Question
  QASession -->|"소유"| Answer
  Answer -->|"소유"| AnswerCitation
  Answer -->|"소유"| AnswerConfidence
  AnswerCitation -->|"근거"| Rule
  Answer -->|"실행 참조"| AgentRun

  CheckSession -->|"소유"| CheckTarget
  CheckTarget -->|"고정"| CheckInputSnapshot
  CheckSession -->|"소유"| CheckRun
  CheckRun -->|"소유"| CheckBasis
  CheckBasis -->|"참조"| BrandGuideline
  CheckBasis -->|"참조"| Rule
  CheckBasis -->|"참조"| BrandAsset
  CheckRun -->|"소유"| CheckDecision
  CheckDecision -->|"소유"| CheckResult
  CheckResult -->|"소유"| CheckRecommendation
  CheckRun -->|"실행 참조"| AgentRun

  classDef aggregate fill:#FFE8CC,stroke:#F08C00,stroke-width:2px,color:#1F1F1F;
  classDef entity fill:#E7F5FF,stroke:#1C7ED6,stroke-width:1.5px,color:#1F1F1F;
  classDef childEntity fill:#F3F0FF,stroke:#7950F2,stroke-width:1.5px,color:#1F1F1F;
  classDef record fill:#F1F3F5,stroke:#868E96,stroke-width:1.5px,color:#1F1F1F;

  class QASession,CheckSession,BrandGuideline,Rule,BrandAsset aggregate;
  class Question,Answer,CheckTarget,CheckInputSnapshot,CheckRun,CheckBasis,CheckDecision,CheckResult entity;
  class AnswerCitation,AnswerConfidence,CheckRecommendation childEntity;
  class AgentRun record;
```

Question과 Answer는 각각 독립 애그리거트(관리 단위)로 보지 않습니다.
질문 삭제, 질문 수정, 질문 종료는 Answer와 함께 움직일 가능성이 높으므로 QASession 애그리거트(관리 단위) 안에서 관리합니다.
품질 검수 화면에서 발생한 질문, 답변, 검수 세션, 점검 실행은 Quality session records로 남깁니다.
가이드라인 화면의 조회, 클릭, 검색, 에셋 다운로드, 구간 체류, 외부 링크 클릭은 품질 검수가 아니라 화면 행동 기록으로 수집합니다.

CheckRun은 CheckBasis를 소유하고, CheckBasis는 검수 시점의 GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef를 참조합니다.
CheckInputSnapshot은 검수 입력을 재현하기 위한 ID를 가진 불변 엔티티입니다.
CheckDecision은 CheckRun 안에서 최종 판정을 표현하고, 여러 CheckResult를 소유합니다.
Agent와 System은 점검, 설명, 최종 검수 판정을 수행합니다.
Agent 자체는 도메인 애그리거트(관리 단위)로 두지 않고, Answer, CheckResult, CheckRecommendation에 AgentRunRef를 남겨 실행 이력만 추적합니다.
AgentRunStarted, AgentRunCompleted, AgentRunFailed는 업무 도메인 이벤트가 아니라 Agent 실행 기록 이벤트입니다.

## 7. 사용 기록

사용 기록은 에셋 제너레이션 기록, 품질 검수 기록, 화면 행동 기록을 운영자가 조회하는 지원 서브도메인입니다.
업무 활동 기록은 AssetGenerationSession, QASession, CheckSession 같은 기본 레코드를 우선 조회합니다.
화면 행동은 업무 레코드와 성격이 달라 BehaviorEventLog로 별도 저장합니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 사용 기록
      ├── [바운디드 컨텍스트] 사용 이력 조회
      │    └── [도메인 모델]
      │         ├── 조회 대상: AssetGenerationSession, QASession, CheckSession, BehaviorEventLog
      │         └── 도메인 서비스: Usage query service
      └── [바운디드 컨텍스트] 화면 행동 기록
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): BehaviorEventLog
                │    ├── 엔티티: PageViewEvent, ClickEvent, SearchEvent, AssetDownloadEvent, SectionDwellEvent, OutboundLinkEvent, CustomEvent
                │    └── 값 객체: PageRef, ElementRef, Duration, SessionData
                ├── 도메인 서비스: Behavior event service
                └── 도메인 이벤트: BehaviorEventCaptured
```

| 기록 | 적용 도메인 | 역할 |
| --- | --- | --- |
| Usage history | 제작 관리, 품질 검수 | 기본 레코드를 조회해 운영 이력을 구성합니다. |
| BehaviorEventLog | 가이드라인 관리 | 화면 조회, 클릭, 검색, 에셋 다운로드, 구간 체류, 외부 링크 클릭을 저장합니다. |
