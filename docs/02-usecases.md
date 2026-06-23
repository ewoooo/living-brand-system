# 02. 유즈케이스

## 1. 목적

이 문서는 `04. 도메인 모델`을 기준으로 유즈케이스를 프로세스 중심으로 정리합니다.
목표는 각 유즈케이스에서 누가 무엇을 입력하고, System이 어떤 순서로 처리하며, 어떤 결과와 기록이 남는지 합의하는 것입니다.

데이터 생명주기는 이 유즈케이스 목록을 기준으로 다시 개선합니다.
따라서 이 문서에서는 `03. 데이터 생명주기`보다 `04. 도메인 모델`의 최신 구조를 우선합니다.

## 2. 목차

1. 목적
2. 목차
3. 유즈케이스 작성 기준
4. 유즈케이스 상세 스키마
5. 도메인별 유즈케이스 목록

## 3. 유즈케이스 작성 기준

유즈케이스는 화면 메뉴나 단순 CRUD 목록이 아닙니다.
각 항목은 Manager, Worker, System, Agent가 실제로 수행하는 업무 흐름입니다.

| 기준 | 설명 |
| --- | --- |
| 도메인 기준 | 가이드라인 관리, 제작 관리, 품질 검수, 사용 기록, 운영 인사이트로 나눕니다. |
| 프로세스 기준 | 각 유즈케이스는 한 문장으로 핵심 처리 흐름을 설명합니다. |
| 결과 기준 | 아웃풋은 사용자나 System이 바로 받는 결과입니다. |
| 기록 기준 | 생성 데이터는 이후 검수, 로그, 인사이트, 공식 버전에 쓰이는 데이터입니다. |
| 연결 기준 | 다음 연결은 이어지는 유즈케이스나 개선 루프를 가리킵니다. |

## 4. 유즈케이스 상세 스키마

유즈케이스 목록은 다음 스키마를 사용합니다.

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GL-05 | 규칙 등록 | Manager, System | 규칙 이름, 조건, 심각도, 적용 범위 | Manager가 규칙을 입력하면 System이 충돌을 확인하고 draft 상태로 저장합니다. | Draft Rule | Rule, RuleCondition, RuleScope, RuleUpdated | 규칙을 페이지에 연결 |

## 5. 도메인별 유즈케이스 목록

### 5.1 가이드라인 관리

가이드라인 관리는 브랜드 가이드라인, 공식 자원, 공식 버전을 관리합니다.
Worker가 사용하는 기준과 자원은 이 도메인에서 발행된 것만 사용합니다.

#### 브랜드 가이드라인 편집 및 발행

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GL-01 | 가이드라인 초안 생성 | Manager, System | 가이드라인 이름, 목적, 대상 브랜드 | Manager가 새 가이드라인 생성을 요청하면 System이 BrandGuideline을 draft 상태로 만듭니다. | Draft BrandGuideline | BrandGuideline, GuidelineDraftCreated | 가이드라인 섹션 등록 |
| GL-02 | 가이드라인 섹션 등록 | Manager, System | 섹션 이름, 설명, 표시 순서 | Manager가 섹션을 입력하면 System이 GuidelineSection을 가이드라인에 추가합니다. | GuidelineSection | GuidelineSection, DisplayOrder, GuidelinePageUpdated | 가이드라인 페이지 구성 |
| GL-03 | 가이드라인 페이지 구성 | Manager, System | 섹션, 페이지 제목, 배치 정보 | Manager가 페이지 구성을 입력하면 System이 GuidelinePage와 PageComposition을 저장합니다. | GuidelinePage | GuidelinePage, PageComposition, GuidelinePageUpdated | 페이지 정책 작성 |
| GL-04 | 페이지 정책 작성 | Manager, System | 정책 문구, 설명, 적용 맥락 | Manager가 페이지 정책을 작성하면 System이 PagePolicy를 GuidelinePage에 1:1로 연결합니다. | PagePolicy | PagePolicy, PagePolicyUpdated | 규칙을 페이지에 연결 |
| GL-05 | 규칙 등록 | Manager, System | 규칙 이름, 조건, 심각도, 적용 범위 | Manager가 규칙을 입력하면 System이 충돌을 확인하고 draft 상태로 저장합니다. | Draft Rule | Rule, RuleCondition, RuleScope, RuleUpdated | 규칙을 페이지에 연결 |
| GL-06 | 규칙 수정 | Manager, System | 기존 규칙, 수정 내용, 버전 사유 | Manager가 규칙을 수정하면 System이 충돌을 확인하고 새 RuleVersion 후보를 저장합니다. | Updated Rule | Rule, RuleCondition, VersionReason, RuleUpdated | 규칙 버전 후보 생성 |
| GL-07 | 규칙 예외 등록 | Manager, System | 대상 규칙, 예외 조건, 예외 사유, 적용 기간 | Manager가 예외를 입력하면 System이 RuleException을 Rule 아래에 추가합니다. | RuleException | RuleException, ExceptionReason, RuleExceptionAdded | 규칙 충돌 확인 |
| GL-08 | 규칙 충돌 확인 | Manager, System | 신규 또는 수정 규칙, 적용 범위 | System이 같은 범위의 기존 Rule과 조건을 비교해 충돌 여부를 판단합니다. | Conflict Result | RuleConflict, RuleCondition, RuleScope | 규칙 등록 또는 규칙 수정 |
| GL-09 | 규칙을 페이지에 연결 | Manager, System | GuidelinePage, Rule, 표시 순서, 강조 여부 | Manager가 페이지에 규칙을 연결하면 System이 PageRuleRef를 생성합니다. | PageRuleRef | PageRuleRef, RuleVersionRef, PageRuleLinked | 가이드라인 검토 요청 |
| GL-10 | 에셋을 페이지에 연결 | Manager, System | GuidelinePage, BrandAssetVersion, 캡션, 예시 역할 | Manager가 페이지에 에셋을 연결하면 System이 PageAssetRef 또는 PageExample을 생성합니다. | PageAssetRef | PageAssetRef, PageExample, PageAssetLinked | 가이드라인 검토 요청 |
| GL-11 | 템플릿을 페이지에 연결 | Manager, System | GuidelinePage, TemplateVersion, 사용 조건 | Manager가 페이지에 템플릿을 연결하면 System이 페이지의 TemplateVersion 참조를 저장합니다. | TemplateVersionRef | TemplateVersionRef, GuidelinePageUpdated | 가이드라인 검토 요청 |
| GL-12 | 플러그인을 페이지에 연결 | Manager, System | GuidelinePage, PluginVersion, 사용 조건 | Manager가 페이지에 플러그인을 연결하면 System이 페이지의 PluginVersion 참조를 저장합니다. | PluginVersionRef | PluginVersionRef, GuidelinePageUpdated | 가이드라인 검토 요청 |
| GL-13 | 가이드라인 검토 요청 | Manager, System | Draft BrandGuideline | Manager가 검토를 요청하면 System이 가이드라인 상태를 in review로 변경합니다. | Review Requested Guideline | BrandGuideline, GuidelineStatus, GuidelineSubmittedForReview | 가이드라인 승인 |
| GL-14 | 가이드라인 승인 | Manager, System | 검토 중인 가이드라인, 승인자 | Manager가 승인하면 System이 가이드라인을 approved 상태로 변경합니다. | Approved Guideline | BrandGuideline, GuidelineStatus, GuidelineApproved | 가이드라인 발행 |
| GL-15 | 가이드라인 발행 | Manager, System | Approved BrandGuideline, 적용 시작일 | Manager가 발행하면 System이 BrandGuidelineVersion을 live 상태로 전환합니다. | Live Guideline | GuidelineVersionRef, EffectivePeriod, GuidelinePublished | 공식 버전 전환 |
| GL-16 | 가이드라인 예약 발행 | Manager, System | Approved BrandGuideline, 예약 적용일 | Manager가 적용일을 예약하면 System이 stage Version과 EffectivePeriod를 저장합니다. | Scheduled Guideline | GuidelineVersionRef, EffectivePeriod, GuidelineScheduled | live 전환 |
| GL-17 | 가이드라인 폐기 | Manager, System | Live Guideline, 폐기 사유, 대체 기준 | Manager가 폐기하면 System이 기존 live 버전을 archived 상태로 변경하고 대체 기준을 연결합니다. | Archived Guideline | VersionStatus, VersionReason, GuidelineDeprecated | 공식 버전 전환 |

#### 브랜드 자원 관리

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RES-01 | 브랜드 에셋 등록 | Manager, System | 에셋 파일, 에셋 유형, 메타데이터 | Manager가 파일과 메타데이터를 입력하면 System이 BrandAsset과 AssetFile을 저장합니다. | Draft BrandAsset | BrandAsset, AssetFile, AssetType, BrandAssetRegistered | 브랜드 에셋 발행 |
| RES-02 | 브랜드 에셋 발행 | Manager, System | Draft BrandAsset, 사용 조건 | Manager가 발행하면 System이 BrandAssetVersion을 live 상태로 전환하고 다운로드 가능 상태로 바꿉니다. | Live BrandAsset | BrandAssetVersion, UsageCondition, DownloadStatus, BrandAssetPublished | 에셋을 페이지에 연결 |
| RES-03 | 브랜드 에셋 폐기 | Manager, System | Live BrandAssetVersion, 폐기 사유, 대체 에셋 | Manager가 폐기하면 System이 에셋 버전을 archived 상태로 변경하고 대체 에셋을 연결합니다. | Archived BrandAsset | BrandAssetVersion, VersionReason, BrandAssetDeprecated | 공식 버전 전환 |
| RES-04 | 템플릿 등록 | Manager, System | 템플릿 이름, 템플릿 파일, 설명 | Manager가 템플릿 정보를 입력하면 System이 Template과 TemplateFile을 draft 상태로 저장합니다. | Draft Template | Template, TemplateFile, TemplateRegistered | 템플릿 필드 정의 |
| RES-05 | 템플릿 필드 정의 | Manager, System | 템플릿, 입력 필드, 필수 여부, 기본값 | Manager가 입력 필드를 정의하면 System이 TemplateField를 Template에 추가합니다. | Template Fields | TemplateField, TemplateRegistered | 템플릿 사용 조건 정의 |
| RES-06 | 템플릿 사용 조건 정의 | Manager, System | 템플릿, 어플리케이션 타입, 허용 조건, 제한 조건 | Manager가 사용 조건을 입력하면 System이 TemplateUsageCondition을 저장합니다. | Template Usage Condition | TemplateUsageCondition, TemplateRegistered | 템플릿과 규칙 연결 |
| RES-07 | 템플릿과 어플리케이션 타입 연결 | Manager, System | Template, ApplicationType | Manager가 사용 가능한 산출물 유형을 선택하면 System이 Template의 적용 범위를 저장합니다. | Application Template Link | TemplateUsageCondition, ResourceLinkedToGuideline | 템플릿 발행 |
| RES-08 | 템플릿과 규칙 연결 | Manager, System | Template, Rule | Manager가 템플릿에 적용할 규칙을 선택하면 System이 Template과 Rule 버전 참조를 저장합니다. | Template Rule Link | TemplateVersionRef, RuleVersionRef, ResourceLinkedToGuideline | 템플릿 발행 |
| RES-09 | 템플릿과 에셋 연결 | Manager, System | Template, BrandAssetVersion | Manager가 템플릿에 필요한 공식 에셋을 선택하면 System이 Template과 BrandAsset 버전 참조를 저장합니다. | Template Asset Link | TemplateVersionRef, BrandAssetVersionRef, ResourceLinkedToGuideline | 템플릿 미리보기 확인 |
| RES-10 | 템플릿 미리보기 확인 | Manager, System | Template, 샘플 입력값 | System이 TemplateField와 샘플 입력값으로 미리보기를 생성하고 Manager가 결과를 확인합니다. | Template Preview | ViewEvent, TemplatePreview | 템플릿 발행 |
| RES-11 | 템플릿 발행 | Manager, System | Draft Template, 적용 시작일 | Manager가 발행하면 System이 TemplateVersion을 live 상태로 전환합니다. | Live Template | TemplateVersion, TemplateUsageCondition, TemplatePublished | 템플릿 선택 |
| RES-12 | 템플릿 예약 발행 | Manager, System | Draft Template, 예약 적용일 | Manager가 적용일을 예약하면 System이 stage TemplateVersion과 예약 적용일을 저장합니다. | Scheduled Template | TemplateVersion, EffectivePeriod, TemplatePublished | live 전환 |
| RES-13 | 템플릿 폐기 | Manager, System | Live TemplateVersion, 폐기 사유, 대체 템플릿 | Manager가 폐기하면 System이 TemplateVersion을 archived 상태로 변경합니다. | Archived Template | TemplateVersion, VersionReason, TemplateDeprecated | 공식 버전 전환 |
| RES-14 | 플러그인 등록 | Manager, System | 플러그인 이름, 설명, 유형 | Manager가 플러그인 정보를 입력하면 System이 Plugin을 draft 상태로 저장합니다. | Draft Plugin | Plugin, PluginType, PluginRegistered | 플러그인 기능 정의 |
| RES-15 | 플러그인 실행 단위 정의 | Manager, System | Plugin, 실행 엔트리, 호출 방식 | Manager가 실행 단위를 입력하면 System이 PluginEntry를 Plugin에 추가합니다. | PluginEntry | PluginEntry, PluginRegistered | 플러그인 기능 정의 |
| RES-16 | 플러그인 기능 정의 | Manager, System | Plugin, 기능 이름, 기능 설명 | Manager가 제공 기능을 정의하면 System이 PluginCapability를 Plugin에 추가합니다. | PluginCapability | PluginCapability, PluginRegistered | 플러그인 입력 스키마 정의 |
| RES-17 | 플러그인 입력 스키마 정의 | Manager, System | PluginCapability, 입력 필드, 필수 여부 | Manager가 입력 스키마를 정의하면 System이 Plugin 실행 입력 조건을 저장합니다. | Plugin Input Schema | PluginCapability, PluginUsageCondition, PluginRegistered | 플러그인 출력 형식 정의 |
| RES-18 | 플러그인 출력 형식 정의 | Manager, System | PluginCapability, 출력 타입, 결과 형식 | Manager가 출력 형식을 정의하면 System이 WorkOutput에 반영 가능한 결과 타입을 저장합니다. | Plugin Output Schema | PluginCapability, PluginUsageCondition, PluginRegistered | 플러그인 사용 조건 정의 |
| RES-19 | 플러그인 사용 조건 정의 | Manager, System | Plugin, 어플리케이션 타입, 허용 조건, 제한 조건 | Manager가 사용 조건을 입력하면 System이 PluginUsageCondition을 저장합니다. | Plugin Usage Condition | PluginUsageCondition, PluginRegistered | 플러그인과 규칙 연결 |
| RES-20 | 플러그인과 어플리케이션 타입 연결 | Manager, System | Plugin, ApplicationType | Manager가 사용 가능한 산출물 유형을 선택하면 System이 Plugin의 적용 범위를 저장합니다. | Application Plugin Link | PluginUsageCondition, ResourceLinkedToGuideline | 플러그인 발행 |
| RES-21 | 플러그인과 규칙 연결 | Manager, System | Plugin, Rule | Manager가 플러그인 사용에 필요한 규칙을 선택하면 System이 Plugin과 Rule 버전 참조를 저장합니다. | Plugin Rule Link | PluginVersionRef, RuleVersionRef, ResourceLinkedToGuideline | 플러그인 테스트 실행 |
| RES-22 | 플러그인과 템플릿 연결 | Manager, System | Plugin, Template | Manager가 함께 사용할 템플릿을 선택하면 System이 Plugin과 Template 참조를 저장합니다. | Plugin Template Link | PluginVersionRef, TemplateVersionRef, ResourceLinkedToGuideline | 플러그인 테스트 실행 |
| RES-23 | 플러그인 테스트 실행 | Manager, System, Agent | Plugin, 샘플 입력값 | System이 샘플 입력으로 Plugin을 실행하고 AgentRunRef와 테스트 결과를 기록합니다. | Plugin Test Result | AgentRunEvent, PluginCapability, PluginVersion | 플러그인 발행 |
| RES-24 | 플러그인 발행 | Manager, System | Draft Plugin, 적용 시작일 | Manager가 발행하면 System이 PluginVersion을 live 상태로 전환합니다. | Live Plugin | PluginVersion, PluginUsageCondition, PluginPublished | 플러그인 선택 |
| RES-25 | 플러그인 예약 발행 | Manager, System | Draft Plugin, 예약 적용일 | Manager가 적용일을 예약하면 System이 stage PluginVersion과 예약 적용일을 저장합니다. | Scheduled Plugin | PluginVersion, EffectivePeriod, PluginPublished | live 전환 |
| RES-26 | 플러그인 폐기 | Manager, System | Live PluginVersion, 폐기 사유, 대체 플러그인 | Manager가 폐기하면 System이 PluginVersion을 archived 상태로 변경합니다. | Archived Plugin | PluginVersion, VersionReason, PluginDeprecated | 공식 버전 전환 |

#### 공식 버전 전환

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VER-01 | stage 버전 생성 | Manager, System | 발행 대상, Payload revision, 버전 사유 | System이 대상에 맞는 Version을 stage 상태로 생성합니다. | Stage Version | BrandGuidelineVersion, RuleVersion, BrandAssetVersion, TemplateVersion, PluginVersion, PayloadRevisionRef, VersionReason, VersionStaged | 버전 검토 |
| VER-02 | 버전 검토 | Manager, System | Stage Version, 이전 live 버전 | Manager가 이전 live 버전과 차이를 확인하면 System이 VersionSummary를 저장합니다. | Version Summary | VersionSummary, PreviousVersionRef, VersionCompared | live 전환 |
| VER-03 | live 전환 | Manager, System | Stage Version, 적용 시작일 | Manager가 발행하면 System이 Version을 live 상태로 전환하고 기존 live 버전을 archived 상태로 바꿉니다. | Live Version | VersionStatus, EffectivePeriod, VersionPublished | 영향 확인 요청 |
| VER-04 | 버전 보관 | System | 기존 live Version, 대체 Version | System이 대체된 Version을 archived 상태로 전환합니다. | Archived Version | VersionStatus, VersionArchived | 개선 효과 추적 |
| VER-06 | 영향 확인 요청 | Manager, System | Live Version, 비교 기간, 대상 지표 | Manager가 영향 확인을 요청하면 System이 live 전후 사용 기록 비교 작업을 예약합니다. | Impact Request | VersionImpactRequested | 개선 효과 추적 |

### 5.2 제작 관리

제작 관리는 Worker가 발행된 Template과 Plugin을 사용해 WorkSession을 만들고 WorkOutput을 생성하는 흐름입니다.
검수 요청과 Agent/System 판정은 품질 검수가 담당합니다.

#### 산출물 제작

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WORK-01 | 작업 시작 | Worker, System | 작업 목적, 사용자, 브랜드 | Worker가 작업을 시작하면 System이 WorkSession을 만들고 사용할 GuidelineVersionRef를 고정합니다. | WorkSession | WorkSession, WorkPurpose, GuidelineVersionRef, WorkSessionStarted, WorkEvent | 어플리케이션 타입 선택 |
| WORK-02 | 어플리케이션 타입 선택 | Worker, System | WorkSession, ApplicationType | Worker가 산출물 유형을 선택하면 System이 WorkSession에 ApplicationTypeRef를 저장합니다. | Selected ApplicationType | ApplicationTypeRef, WorkInputChanged, ClickEvent, WorkEvent | 템플릿 선택 |
| WORK-03 | 템플릿 선택 | Worker, System | WorkSession, Live TemplateVersion | Worker가 템플릿을 선택하면 System이 TemplateVersionRef를 WorkSession에 저장합니다. | Selected Template | TemplateVersionRef, WorkInputChanged, ClickEvent, WorkEvent | 플러그인 선택 |
| WORK-04 | 플러그인 선택 | Worker, System | WorkSession, Live PluginVersion | Worker가 플러그인을 선택하면 System이 PluginVersionRef를 WorkSession에 저장합니다. | Selected Plugin | PluginVersionRef, WorkInputChanged, ClickEvent, WorkEvent | 브랜드 에셋 선택 |
| WORK-05 | 브랜드 에셋 선택 | Worker, System | WorkSession, Live BrandAssetVersion | Worker가 사용할 공식 에셋을 선택하면 System이 BrandAssetVersionRef를 WorkSession에 저장합니다. | Selected BrandAsset | BrandAssetVersionRef, WorkInputChanged, ClickEvent, WorkEvent | 작업 입력값 작성 |
| WORK-06 | 작업 입력값 작성 | Worker, System | WorkSession, 텍스트, 이미지, 선택값 | Worker가 템플릿이나 플러그인 입력값을 작성하면 System이 WorkInput을 저장합니다. | WorkInput | WorkInput, WorkInputChanged, WorkEvent | 미리보기 생성 |
| WORK-07 | 작업 입력값 수정 | Worker, System | WorkSession, 변경 입력값 | Worker가 입력값을 수정하면 System이 WorkInput을 갱신하고 변경 이벤트를 남깁니다. | Updated WorkInput | WorkInput, WorkInputChanged, WorkEvent | 미리보기 생성 |
| WORK-08 | 미리보기 생성 | Worker, System | WorkInput, BrandAssetVersionRef, TemplateVersionRef, PluginVersionRef | System이 입력값과 선택한 자원을 조합해 산출물 미리보기를 생성합니다. | Preview | WorkPreviewGenerated, WorkEvent | 산출물 생성 |
| WORK-09 | 산출물 생성 | Worker, System | WorkSession, 확정 입력값, 미리보기 | Worker가 생성을 요청하면 System이 WorkOutput을 생성합니다. | WorkOutput | WorkOutput, WorkOutputCreated, WorkEvent | 산출물 저장 |
| WORK-10 | 산출물 저장 | Worker, System | WorkOutput, 저장 위치 | System이 WorkOutput을 저장하고 이후 검수에서 참조할 수 있게 보존합니다. | Saved WorkOutput | WorkOutput, WorkOutputCreated, WorkEvent | 작업 완료 |
| WORK-11 | 작업 완료 | Worker, System | WorkSession, WorkOutput | Worker가 작업 완료를 선택하면 System이 WorkSessionStatus를 completed로 변경합니다. | Completed WorkSession | WorkSessionStatus, WorkSessionCompleted, WorkEvent | 검수 세션 시작 |

### 5.3 품질 검수

품질 검수는 CheckInputSnapshot에 고정된 검수 입력을 대상으로 질문, Agent/System 점검과 최종 판정을 수행합니다.
Agent 자체는 도메인 애그리거트가 아니며 결과에 `AgentRunRef`만 남깁니다.

#### 질의응답

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-01 | 질의 세션 시작 | Worker, System | WorkSession, 질문 맥락 | Worker가 질문을 시작하면 System이 WorkSession과 연결된 QASession을 만듭니다. | QASession | QASession, WorkEvent | 질문 등록 |
| QA-02 | 질문 등록 | Worker, System | 질문 원문, WorkSession 맥락 | Worker가 질문을 입력하면 System이 Question을 QASession에 추가합니다. | Question | Question, QuestionAsked, SearchEvent | 관련 기준 검색 |
| QA-03 | 관련 기준 검색 | System | 질문 원문, GuidelineVersionRef | System이 GuidelineVersionRef가 가리키는 발행 기준에서 질문과 관련된 기준을 검색합니다. | Related Rules | Rule, GuidelineVersionRef, SearchEvent | Agent 답변 생성 |
| QA-04 | Agent 답변 생성 | Agent, System | Question, Related Rules, WorkSession 맥락 | Agent가 관련 기준을 바탕으로 답변을 생성하고 System이 Answer를 저장합니다. | Answer | Answer, AgentRunRef, AnswerProvided, AgentRunEvent | 답변 근거 연결 |
| QA-05 | 답변 근거 연결 | Agent, System | Answer, Related Rules | System이 답변에 사용한 RuleVersion과 PagePolicy를 AnswerCitation으로 연결합니다. | Answer Citation | AnswerCitation, RuleVersionRef, AnswerProvided | 답변 신뢰도 기록 |
| QA-06 | 답변 신뢰도 기록 | Agent, System | Answer, 근거 수, 모델 판단 | System이 답변의 신뢰도를 AnswerConfidence로 저장합니다. | Answer Confidence | AnswerConfidence, AgentRunRef, AgentRunEvent | 질의 세션 종료 |
| QA-07 | 질의 세션 종료 | Worker, System | QASession | Worker가 질의를 종료하면 System이 세션을 닫고 이후 인사이트 분석 대상이 되도록 보존합니다. | Closed QASession | QASession, WorkEvent | 반복 질문 탐지 |

#### 산출물 검수

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QC-01 | 검수 세션 시작 | Worker, System | WorkOutput | Worker가 검수를 요청하면 System이 CheckInputSnapshot을 만들고 CheckTarget으로 고정한 뒤 CheckSession을 시작합니다. | CheckSession | CheckInputSnapshot, CheckTarget, CheckSession, CheckSessionStarted, CheckEvent | 점검 실행 |
| QC-02 | 점검 실행 | System, Agent | CheckSession, CheckTarget, GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef | System이 검수 시점의 가이드라인, 규칙, 에셋 버전을 CheckBasis로 묶고 Agent가 해당 기준으로 산출물을 검사합니다. | CheckRun | CheckRun, CheckBasis, GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef, AgentRunRef, CheckEvent, AgentRunEvent | 규칙 위반 확인 |
| QC-03 | 규칙 위반 확인 | System, Agent | CheckRun, CheckBasis, CheckTarget | System이 CheckBasis 기준으로 위반 항목을 정리하고 Agent가 설명 가능한 위반 내용을 보강합니다. | Violation List | CheckDecision, CheckResult, Violation, CheckRunCompleted | Agent 추천 생성 |
| QC-04 | Agent 추천 생성 | Agent, System | CheckResult, Violation, CheckTarget | Agent가 위반 항목별 수정 방향을 생성하고 System이 CheckResult 아래에 CheckRecommendation으로 저장합니다. | CheckRecommendation | CheckRecommendation, AgentRunRef, AgentRunEvent | 검수 판정 기록 |
| QC-05 | 검수 판정 기록 | System, Agent | CheckSession, CheckRun, CheckDecision, CheckResult, CheckRecommendation | System이 CheckDecision 아래의 점검 결과와 추천을 종합해 CheckOutcome을 저장하고 CheckSession을 완료합니다. | Completed CheckSession | CheckOutcome, CheckCompleted, CheckEvent | 인사이트 도출 |

### 5.4 운영 인사이트

운영 인사이트는 사용 기록과 도메인 이벤트를 소유하지 않습니다.
필요한 기록을 Evidence로 참조해 Pattern, Insight, 인사이트 보고서(InsightReport)를 만듭니다.

#### 인사이트 도출

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INS-01 | 사용 기록 조회 | System | 조회 기간, 이벤트 유형, 어플리케이션 타입 | System이 사용 기록과 도메인 이벤트에서 분석 대상 기록을 조회합니다. | 사용 기록 근거 묶음 | SessionEventLog, BehaviorEventLog, DomainEventRef | Evidence 묶기 |
| INS-02 | 반복 질문 탐지 | System, Agent | Question, Answer, AgentRunEvent | System이 유사 질문을 묶고 Agent가 반복되는 질문 의도를 요약합니다. | Repeated Question Candidate | Evidence, PatternType, AgentRunRef | Pattern 생성 |
| INS-03 | 반복 위반 탐지 | System, Agent | CheckResult, Violation, RuleVersionRef | System이 반복되는 Rule 위반을 집계하고 Agent가 대표 패턴을 요약합니다. | Repeated Violation Candidate | Evidence, PatternType, AgentRunRef | Pattern 생성 |
| INS-04 | 반복 검수 실패 사유 탐지 | System, Agent | CheckDecision, CheckRecommendation | System이 반복 검수 실패 사유를 묶고 Agent가 개선 가능성을 요약합니다. | Repeated Check Failure Candidate | Evidence, PatternType, AgentRunRef | Pattern 생성 |
| INS-05 | 자주 조회된 기준 탐지 | System | ViewEvent, SearchEvent, GuidelinePage | System이 자주 조회되거나 오래 체류한 기준을 집계합니다. | Frequent Guideline Candidate | Evidence, ViewEvent, SearchEvent | Pattern 생성 |
| INS-06 | 자주 사용된 에셋/템플릿/플러그인 탐지 | System | WorkEvent, BrandAssetVersionRef, TemplateVersionRef, PluginVersionRef | System이 작업에서 자주 선택된 BrandAsset, Template, Plugin을 집계합니다. | Frequent Resource Candidate | Evidence, WorkEvent, BrandAssetVersionRef, TemplateVersionRef, PluginVersionRef | Pattern 생성 |
| INS-07 | Evidence 묶기 | System | Usage Evidence Set, 후보 유형 | System이 질문, 점검, 조회 기록을 같은 문제 단위로 묶습니다. | Evidence Group | Evidence, DomainEventRef | Pattern 생성 |
| INS-08 | Pattern 생성 | System, Agent | Evidence Group, 반복 기준 | System이 반복 조건을 만족한 Evidence를 Pattern으로 만들고 Agent가 대표 설명을 붙입니다. | Pattern | Pattern, PatternType, AgentRunRef | Insight 생성 |
| INS-09 | Insight 생성 | System, Agent | Pattern, 영향 범위, 빈도 | System이 Pattern을 Manager가 판단할 수 있는 Insight로 전환합니다. | Insight | Insight, InsightStatus, ExpectedImpact, InsightDiscovered | 보고서 섹션 구성 |

#### 인사이트 제공

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RPT-01 | 보고서 섹션 구성 | System | Insight 목록, 섹션 기준 | System이 반복 질문, 반복 위반, 자원 사용 같은 섹션으로 Insight를 배치합니다. | ReportSection | ReportSection | 인사이트 보고서 생성 |
| RPT-02 | 인사이트 보고서 생성 | System | ReportSection 목록, 기간, 대상 독자 | System이 ReportSection을 묶어 인사이트 보고서(InsightReport)를 생성합니다. | InsightReport | InsightReport, ReportPeriod, InsightReportPublished | Manager에게 보고서 제공 |
| RPT-03 | Manager에게 보고서 제공 | Manager, System | InsightReport | System이 Manager 화면에 인사이트 보고서(InsightReport)를 노출하고 조회 기록을 남깁니다. | Presented InsightReport | InsightReport, ViewEvent, InsightReportPublished | 인사이트 검토 |
| RPT-04 | 인사이트 검토 | Manager, System | InsightReport, Insight | Manager가 Insight의 근거와 개선 방향을 확인하면 System이 검토 기록을 남깁니다. | Reviewed Insight | InsightReviewed, ClickEvent | 인사이트 채택 또는 인사이트 제외 |
| RPT-05 | 인사이트 채택 | Manager, System | InsightReport, Insight | Manager가 보고서 안에서 인사이트를 채택하면 System이 InsightAccepted 이벤트를 남깁니다. | Accepted Insight | InsightReport, Insight, InsightAccepted, ClickEvent | 후속 인사이트 탐지 |
| RPT-06 | 인사이트 제외 | Manager, System | Insight, 제외 사유 | Manager가 인사이트를 제외하면 System이 Insight 상태와 제외 사유를 저장합니다. | Dismissed Insight | InsightStatus, InsightReviewed, ClickEvent | 후속 인사이트 탐지 |

### 5.5 사용 기록

사용 기록은 세션 이벤트와 화면 행동 기록을 저장하는 지원 서브도메인입니다.
운영자가 제품 사용 기록을 확인하고, 운영 인사이트가 Evidence를 찾기 위해 읽습니다.

#### 사용 기록

| ID | 유즈케이스 | 액터 | 입력 | 프로세스 | 아웃풋 | 생성 데이터 | 다음 연결 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LOG-01 | 세션 이벤트 로그 조회 | Manager, System | 사용자 또는 세션, 기간, 이벤트 유형 | Manager가 조건을 입력하면 System이 WorkSession, QASession, CheckSession에서 발생한 SessionEvent를 시간순으로 보여줍니다. | Session Event Log | SessionEventLog, SessionEvent | 인사이트 도출 |
| LOG-02 | 작업 흐름 로그 조회 | Manager, System | WorkSession, 기간 | Manager가 WorkSession을 선택하면 System이 작업 시작부터 완료까지의 SessionEvent를 보여줍니다. | WorkSession Event Log | SessionEvent, WorkSessionStarted, WorkSessionCompleted | 작업 병목 확인 |
| LOG-03 | Agent 실행 로그 조회 | Manager, System | AgentRunRef, 기간, 실행 유형 | Manager가 Agent 실행 조건을 입력하면 System이 답변, 점검, 요약 실행 기록을 보여줍니다. | Agent Run Log | AgentRunEvent, AgentRunRef | Agent 품질 확인 |
| LOG-04 | 점검 이력 조회 | Manager, System | CheckInputSnapshot, 기간 | Manager가 검수 입력 스냅샷을 선택하면 System이 CheckSession, CheckRun, CheckResult 이력을 보여줍니다. | Check History | CheckEvent, CheckSession, CheckRun, CheckResult | 반복 위반 탐지 |
| LOG-05 | 검수 입력 기록 조회 | Manager, System | WorkSession, 기간 | Manager가 WorkSession을 선택하면 System이 생성된 CheckInputSnapshot 목록을 보여줍니다. | CheckInputSnapshot List | CheckInputSnapshot | 점검 이력 조회 |
| LOG-06 | 화면 행동 기록 조회 | Manager, System | 기간, 화면, 이벤트 이름, 공통 이벤트 속성 | Manager가 조건을 입력하면 System이 페이지 조회, 클릭, 구간 체류, 에셋 다운로드, 외부 링크 클릭 흐름을 보여줍니다. | Behavior Event Log | BehaviorEventLog, PageViewEvent, SectionDwellEvent, ClickEvent, AssetDownloadEvent, OutboundLinkEvent | 인사이트 도출 |
