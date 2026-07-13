# 03. 데이터 생명주기

## 1. 목적

이 문서는 브랜드 운영 시스템에서 주요 데이터가 생성되고, 사용되고, 보관되고, 파기되는 흐름을 정리합니다.
기준은 [02. 유즈케이스](02-usecases.md)와 [04. 도메인 모델](04-domain-model.md)의 최신 구조입니다.

핵심은 원천 기준, 실행 기록, 사용 기록을 섞지 않는 것입니다.
원천 기준은 가이드라인 관리가 소유합니다.
제작은 사용할 기준과 자원을 ResourceRef로 남기고, 품질 검수는 검수 기준을 CheckBasis의 VersionRef로 고정합니다.

## 2. 작성 기준

각 데이터는 같은 단계로 설명합니다.

| 단계 | 의미 |
| --- | --- |
| 생성·수집 | 데이터가 처음 만들어지거나 외부 입력으로 들어오는 시점 |
| 전송 | UI, Service, Agent, 외부 도구 사이에서 이동하는 방식 |
| 저장 | 주 저장소와 저장 시 보호 기준 |
| 처리 | 상태 변경, 연결, 검증, 파생 데이터 생성 방식 |
| 활용 | 화면, Agent, 검수, 운영 조회에서 쓰이는 방식 |
| 공유·제공 | 다른 도메인, Agent, 외부 서비스에 제공되는 범위 |
| 보관 | 운영 중 유지 기준과 이력 관리 방식 |
| 파기 | 삭제, 비활성화, 익명화, 보관 종료 기준 |

## 3. 가이드라인 기준

### 3.1 BrandGuideline

데이터명: BrandGuideline
수집 목적: 브랜드 가이드라인의 전체 구조와 공식 기준 발행 단위를 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 가이드라인 이름, 목적, 대상 브랜드를 입력하면 System이 draft 상태로 생성한다. |
| 전송 | Manager UI에서 입력한 값은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | Payload collection과 PostgreSQL에 저장한다. Payload revision은 CMS 내부 수정 이력으로 남긴다. |
| 처리 | GuidelineSection, GuidelinePage, GuidelineBlock, BrandGuidelineVersion을 소유하고, 검토와 승인 상태를 관리한다. |
| 활용 | Manager는 편집과 발행에 사용하고, Creator와 Agent는 live 상태의 Official Version만 참조한다. |
| 공유·제공 | 제작 관리와 품질 검수에는 BrandGuideline 원본이 아니라 GuidelineVersionRef로 제공한다. |
| 보관 | draft, in review, approved 상태와 Payload revision 이력을 보관한다. |
| 파기 | 잘못 만든 draft는 삭제할 수 있다. live 또는 archived 상태의 Official Version이 있는 데이터는 참조 무결성을 위해 비활성화한다. |

### 3.2 GuidelineSection

데이터명: GuidelineSection
수집 목적: 가이드라인 페이지를 장 단위로 묶고 자체 검수 선언을 소유한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 섹션 이름, 설명, 표시 순서를 입력하면 BrandGuideline 아래에 생성한다. |
| 전송 | 섹션 편집 요청은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | BrandGuideline 하위 엔티티로 저장하고 표시 순서를 함께 보관한다. |
| 처리 | GuidelinePage와 자체 GuidelineBlock을 소유하고, 자신에게 적용할 Check를 함께 관리한다. |
| 활용 | Manager 편집 화면과 Creator 가이드라인 탐색 구조에 사용한다. |
| 공유·제공 | 다른 도메인에는 직접 제공하지 않고 GuidelineVersion에 포함된 구조로 제공한다. |
| 보관 | BrandGuideline revision과 Official Version에 포함해 보관한다. |
| 파기 | 연결된 페이지가 없을 때 삭제한다. 이미 발행된 섹션은 이후 Official Version에서 제외하는 방식으로 처리한다. |

### 3.3 GuidelinePage

데이터명: GuidelinePage
수집 목적: GuidelineBlock을 묶고 자체 검수 선언을 소유한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 페이지 제목, 배치 정보, 소속 섹션을 입력하면 GuidelineSection 아래에 생성한다. |
| 전송 | 페이지 구성 요청은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | 소속 GuidelineSection, PagePolicy, PageAssetRef, PageExample, PageComposition과 함께 저장한다. |
| 처리 | GuidelineBlock을 소유하고, 자신에게 적용할 Check를 함께 관리한다. |
| 활용 | Creator 가이드라인 화면, Agent 답변 근거, 품질 검수 기준 탐색에 사용한다. |
| 공유·제공 | BehaviorEventLog에는 페이지 조회와 클릭 대상인 PageRef만 제공한다. |
| 보관 | Official Version에 포함된 페이지 구조를 유지한다. |
| 파기 | 발행 전 페이지는 삭제할 수 있다. 발행 후에는 다음 Official Version에서 제외하고 기존 Official Version은 보관한다. |

### 3.4 GuidelineBlock

데이터명: GuidelineBlock
수집 목적: 섹션 또는 페이지를 구성하는 최소 콘텐츠 단위이자 검수 근거가 된다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 블록 유형과 콘텐츠를 입력하면 GuidelineSection 또는 GuidelinePage 아래에 생성한다. |
| 전송 | 블록 편집 요청은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | 콘텐츠와 식별자는 소속 Section/Page 안에 임베디드 데이터로 저장한다. Block 식별자는 부모 문서 안에서만 유효하다. |
| 처리 | 이미지와 컬러 같은 표시 자원을 참조하고, 자신에게 적용할 Check를 함께 관리한다. |
| 활용 | Creator 가이드라인 화면, Agent 답변 근거, 품질 검수 evidence 생성에 사용한다. |
| 공유·제공 | 다른 도메인에는 GuidelineVersion에 포함된 읽기 모델로 제공한다. |
| 보관 | GuidelineVersion과 Payload revision에 포함해 변경 이력을 보관한다. |
| 파기 | 발행 전 블록은 삭제할 수 있다. 발행 후에는 다음 Official Version에서 제외하고 기존 버전은 보관한다. |

### 3.5 PagePolicy

데이터명: PagePolicy
수집 목적: GuidelinePage의 상위 정책 설명을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 정책 문구와 설명을 작성하면 GuidelinePage에 1:1로 연결한다. |
| 전송 | 정책 편집 요청은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 revision에 포함한다. |
| 처리 | 관련 Rule, PageAssetRef, PageExample과 함께 페이지 기준을 구성한다. |
| 활용 | Creator가 정책 의도를 이해하는 데 사용하고, Agent 답변의 설명 근거로 사용한다. |
| 공유·제공 | QASession에는 AnswerCitation 근거로 필요한 범위만 제공한다. |
| 보관 | Official Version에 포함된 정책 문구를 보관한다. |
| 파기 | 페이지가 삭제되거나 다음 Official Version에서 제외될 때 함께 제외한다. 이미 발행된 Official Version의 정책은 보존한다. |

### 3.6 PageAssetRef

데이터명: PageAssetRef
수집 목적: GuidelinePage가 어떤 BrandAssetVersion을 어떤 예시 역할로 사용하는지 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 페이지에 에셋을 연결하면 캡션, 예시 역할, 표시 순서를 함께 수집한다. |
| 전송 | 연결 요청은 Payload API를 통해 GuidelinePage 갱신 요청으로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 BrandAssetVersionRef를 보관한다. |
| 처리 | 페이지 화면 구성과 에셋 참조를 함께 관리한다. |
| 활용 | Creator 가이드라인 화면과 에셋 다운로드 동선에 사용한다. |
| 공유·제공 | BehaviorEventLog에는 다운로드 대상 BrandAssetVersionRef로 연결된다. |
| 보관 | GuidelineVersion에 포함해 발행 시점의 에셋 연결을 보관한다. |
| 파기 | 페이지에서 에셋 연결을 제거하면 다음 Official Version부터 제외한다. 기존 Official Version의 연결은 유지한다. |

### 3.7 PageExample

데이터명: PageExample
수집 목적: GuidelinePage에서 좋은 예시, 나쁜 예시, 사용 예시를 설명한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 예시 이미지, 설명, 예시 유형을 입력하면 GuidelinePage 아래에 생성한다. |
| 전송 | 예시 등록 요청은 Payload API를 통해 Guideline publishing service로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 관련 PageAssetRef나 CheckKey를 함께 보관한다. |
| 처리 | 페이지 안에서 Policy, Check, Asset과 함께 예시 맥락을 구성한다. |
| 활용 | Creator가 기준을 해석하는 데 사용하고, Agent가 설명을 보강할 때 참조한다. |
| 공유·제공 | 다른 도메인에는 GuidelineVersion에 포함된 읽기 모델로 제공한다. |
| 보관 | Official Version에 포함된 예시를 보관한다. |
| 파기 | 발행 전 예시는 삭제할 수 있다. 발행 후에는 다음 Official Version에서 제외한다. |

## 4. 브랜드 자원

### 4.1 RuleChecker

데이터명: RuleChecker
수집 목적: Check를 실행할 도구와 호출 계약을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 실행 유형과 실행 도구를 선택하면 draft 상태로 생성한다. |
| 전송 | RuleChecker 편집 요청은 Payload API를 통해 Brand resource publishing service로 전달한다. |
| 저장 | RuleCheckerKey, ExecutorType과 실행 유형별 binding을 저장한다. deterministic은 CheckerKey를, heuristic은 ModelRef와 PromptKey를 저장한다. |
| 처리 | 하나의 RuleChecker는 하나의 executor binding만 가지며 Check의 실행 요청을 해당 실행기로 전달한다. |
| 활용 | 품질 검수는 Check가 참조하는 RuleChecker로 checker 또는 model을 선택한다. |
| 공유·제공 | 검수 런타임에는 live 상태의 RuleCheckerVersion만 제공한다. |
| 보관 | RuleCheckerVersion과 Payload revision을 함께 보관한다. |
| 파기 | draft RuleChecker는 삭제할 수 있다. 발행된 RuleChecker는 archived 상태로 전환하고 기존 검수 기록의 참조는 보존한다. |

### 4.2 Check

데이터명: Check
수집 목적: GuidelineSection, GuidelinePage 또는 GuidelineBlock에 적용할 검수 규칙을 선언한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 문서 단위 안에서 key, 이름, 중요도, options, 메시지와 RuleChecker를 입력한다. |
| 전송 | Check는 부모 Guideline 문서 편집 요청에 포함해 Payload API로 전달한다. |
| 저장 | CheckKey, Title, Tier, RuleCheckerRef, Options, Messages를 부모 Section/Page/Block 안에 저장한다. 별도 source 필드는 두지 않는다. |
| 처리 | 검수 시작 시 부모 문서 콘텐츠와 RuleChecker 실행 계약을 결합한다. Guideline 변경 시 별도 snapshot을 동기화하지 않는다. |
| 활용 | Scenario는 CheckKey로 실행 범위를 선택하고, 검수 런타임은 Check options를 RuleChecker에 전달한다. |
| 공유·제공 | Creator와 Agent에는 발행된 GuidelineVersion에 포함된 Check만 제공한다. |
| 보관 | Check는 부모 GuidelineVersion과 Payload revision에 포함해 보관하고, 실행 당시 값은 CheckSession에 snapshot으로 저장한다. |
| 파기 | 부모 Section/Page가 draft 또는 삭제 상태가 되거나 Block이 제거되면 이후 검수 대상에서 제외한다. 기존 CheckSession snapshot은 보존한다. |

### 4.3 CheckException

데이터명: CheckException
수집 목적: 특정 Check에 종속되는 예외 조건과 적용 기간을 관리한다. 현재 구현 범위에서는 제외한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 예외 조건, 예외 사유, 적용 기간을 입력하면 Check 아래에 생성한다. |
| 전송 | 예외 등록 요청은 Payload API를 통해 Brand resource publishing service로 전달한다. |
| 저장 | Check 하위 값으로 저장하고 ExceptionReason과 적용 기간을 보관한다. |
| 처리 | Check options와 함께 평가되어 예외 적용 여부를 판단한다. |
| 활용 | Agent 답변과 품질 검수에서 위반 여부를 해석할 때 사용한다. |
| 공유·제공 | GuidelineVersion에 포함된 예외 조건으로 Creator와 Agent에 제공한다. |
| 보관 | 예외 적용 기간과 변경 사유를 보관한다. |
| 파기 | 적용 종료 후에는 archived 상태로 남기고, 잘못 만든 draft 예외만 삭제한다. |

### 4.4 BrandAsset

데이터명: BrandAsset
수집 목적: 로고, 이미지, 아이콘, 참고 파일 같은 공식 브랜드 자원을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 에셋 파일, 에셋 유형, 메타데이터를 입력하면 BrandAsset을 생성한다. |
| 전송 | 파일과 메타데이터는 Payload upload 흐름을 통해 전송한다. |
| 저장 | 파일은 Uploaded file storage에 저장하고, 메타데이터는 Payload collection과 PostgreSQL에 저장한다. |
| 처리 | AssetFile, BrandAssetVersion, UsageCondition, DownloadStatus를 함께 관리한다. |
| 활용 | GuidelineDocument, Check, AssetGenerationSession, CheckBasis에서 공식 자원으로 참조한다. |
| 공유·제공 | Creator에게 다운로드 가능한 live 상태의 BrandAssetVersion만 제공한다. |
| 보관 | 파일 원본, Official Version, 사용 조건, 폐기 사유를 보관한다. |
| 파기 | draft 파일은 삭제할 수 있다. 발행된 에셋은 archived 처리하고 실제 파일 삭제는 참조 종료 후 수행한다. |

### 4.5 Template

데이터명: Template
수집 목적: Creator가 산출물을 만들 때 사용할 공식 형식을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 템플릿 이름, 설명, Figma 노드 또는 템플릿 파일 참조를 입력하면 Template을 생성한다. |
| 전송 | 템플릿 메타데이터는 Payload API로 전달하고, 원본은 Figma node 또는 파일 업로드 흐름으로 참조한다. |
| 저장 | TemplateSourceRef, LayoutSpec, TextStyleSpec, EditableBlockSpec, TemplateUsageCondition, TemplateVersion을 함께 저장한다. |
| 처리 | 지정된 레이아웃, 텍스트 스타일, 텍스트 블록, 에셋 슬롯, 컬러 토큰과 연결된 CheckKey, BrandAssetVersionRef를 검증한다. |
| 활용 | AssetGenerationSession에서 산출물 제작 형식으로 사용하고, Brand asset generation service가 React 또는 HTML 편집 노드로 변환한다. |
| 공유·제공 | Creator에게 live 상태의 TemplateVersion만 제공한다. |
| 보관 | TemplateVersion과 사용 조건 변경 이력을 보관한다. |
| 파기 | draft 템플릿은 삭제할 수 있다. 발행된 템플릿은 archived 처리하고 기존 AssetGenerationSession 참조는 보존한다. |

### 4.6 Plugin

데이터명: Plugin
수집 목적: Creator가 산출물을 만들 때 사용할 공식 제작 기능을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 플러그인 이름, 설명, 유형, 실행물 참조를 입력하면 Plugin을 생성한다. |
| 전송 | 플러그인 설정은 Payload API를 통해 저장하고, 테스트 실행은 Agent repository로 전달한다. |
| 저장 | PluginEntry, PluginCapability, PluginUsageCondition, PluginVersion과 Plugin runtime 참조를 함께 저장한다. |
| 처리 | 입력 스키마, 출력 형식, 사용 조건, 연결된 TemplateVersionRef와 CheckKey를 검증한다. |
| 활용 | AssetGenerationSession에서 제작 기능으로 사용하고, AgentRunRef로 실행 이력을 남긴다. |
| 공유·제공 | Creator에게 live 상태의 PluginVersion만 제공한다. |
| 보관 | PluginVersion, 테스트 결과 참조, 사용 조건 변경 이력을 보관한다. |
| 파기 | draft 플러그인은 삭제할 수 있다. 발행된 플러그인은 archived 처리하고 기존 실행 이력은 보존한다. |

## 5. Official Version

### 5.1 BrandGuidelineVersion

데이터명: BrandGuidelineVersion
수집 목적: Creator와 Agent가 참조할 Official Version을 만든다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 승인된 BrandGuideline을 발행하면 System이 stage 또는 live 상태의 BrandGuidelineVersion을 생성한다. |
| 전송 | 발행 요청은 Guideline publishing service로 전달한다. |
| 저장 | VersionNumber, VersionStatus, EffectivePeriod, PayloadRevisionRef, PreviousVersionRef를 저장한다. |
| 처리 | live 전환 시 기존 live 상태의 BrandGuidelineVersion은 archived 상태로 바꾼다. |
| 활용 | AssetGenerationSession은 ResourceRef로 참조하고, CheckBasis는 필요한 VersionRef로 참조한다. |
| 공유·제공 | Creator 화면과 Agent에는 live 상태의 BrandGuidelineVersion만 제공한다. |
| 보관 | stage, live, archived 상태와 VersionReason을 보관한다. |
| 파기 | Official Version은 삭제하지 않고 archived로 보관한다. 잘못 생성된 stage 상태의 BrandGuidelineVersion만 삭제할 수 있다. |

### 5.2 RuleCheckerVersion

데이터명: RuleCheckerVersion
수집 목적: 품질 검수에서 사용할 실행 도구와 호출 계약을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | RuleChecker가 승인되거나 수정되면 System이 RuleCheckerVersion 후보를 만든다. |
| 전송 | Official Version 생성 요청은 Brand resource publishing service로 전달한다. |
| 저장 | VersionNumber, VersionStatus, ExecutorType, CheckerKey 또는 ModelRef와 PromptKey, PayloadRevisionRef를 저장한다. |
| 처리 | live 전환 시 기존 live 상태의 RuleCheckerVersion을 archived 상태로 바꾼다. |
| 활용 | GuidelineVersion의 Check와 검수 런타임이 실행 도구를 선택할 때 참조한다. |
| 공유·제공 | 검수 런타임에는 live 상태의 RuleCheckerVersion만 제공한다. |
| 보관 | 모든 Official Version과 변경 사유를 보관한다. |
| 파기 | Official Version은 삭제하지 않고 archived로 보관한다. 잘못 생성된 stage 상태만 삭제할 수 있다. |

### 5.3 CheckRulesetSnapshot

데이터명: CheckRulesetSnapshot
수집 목적: 품질 검수 실행 당시의 문서 근거, Check, RuleChecker 계약을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckSession을 시작할 때 발행된 Guideline에서 선택된 Check와 문서 근거를 읽어 생성한다. |
| 전송 | 검수 Service가 CheckSession 저장 Repository에 전달한다. |
| 저장 | CheckKey, Title, Tier, Options, Messages, RuleChecker 실행 계약, Evidence, ReferenceAssetRef를 JSON snapshot으로 저장한다. |
| 처리 | 즉시 검수와 후속 AI 검수가 같은 snapshot을 사용한다. Guideline이나 RuleChecker 변경을 역으로 반영하지 않는다. |
| 활용 | CheckRun과 결과 재현, 감사, 후속 AI 검수에 사용한다. |
| 공유·제공 | CheckSession 조회 권한이 있는 Manager와 Admin에게 제공한다. |
| 보관 | CheckSession과 함께 보관한다. |
| 파기 | CheckSession 보관 정책을 따른다. |

### 5.4 BrandAssetVersion

데이터명: BrandAssetVersion
수집 목적: 공식으로 사용할 수 있는 브랜드 에셋 파일과 사용 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | BrandAsset이 발행되면 System이 BrandAssetVersion을 생성한다. |
| 전송 | 발행 요청과 파일 참조는 Brand resource publishing service로 전달한다. |
| 저장 | VersionStatus, AssetFile 참조, UsageCondition, DownloadStatus를 저장한다. |
| 처리 | 대체 에셋이 발행되면 이전 BrandAssetVersion을 archived 상태로 바꾼다. |
| 활용 | PageAssetRef와 CheckBasis에서는 BrandAssetVersionRef로 참조하고, AssetGenerationSession에서는 ResourceRef로 참조한다. |
| 공유·제공 | Creator에게 다운로드 가능한 live 상태의 BrandAssetVersion만 제공한다. |
| 보관 | 파일 참조, 다운로드 상태, 폐기 사유를 보관한다. |
| 파기 | Official Version은 삭제하지 않고 archived로 보관한다. 파일은 참조 종료 후 보관 정책에 따라 삭제한다. |

### 5.5 TemplateVersion

데이터명: TemplateVersion
수집 목적: 제작에 사용할 공식 템플릿 구조와 입력 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Template이 승인되면 System이 TemplateVersion을 생성한다. |
| 전송 | 발행 요청은 Brand resource publishing service로 전달한다. |
| 저장 | TemplateSourceRef, LayoutSpec, TextStyleSpec, EditableBlockSpec, TemplateUsageCondition, VersionStatus를 저장한다. |
| 처리 | live 전환 시 기존 live 상태의 TemplateVersion을 archived 상태로 바꾸고, Figma node 또는 파일 원본을 재해석해 제작 가능한 구조를 고정한다. |
| 활용 | AssetGenerationSession에서는 ResourceRef로 참조한다. |
| 공유·제공 | Creator에게 live 상태의 TemplateVersion만 제공한다. |
| 보관 | 발행된 편집 가능 영역과 사용 조건을 보관한다. |
| 파기 | Official Version은 삭제하지 않고 archived로 보관한다. 잘못 만든 stage 상태의 TemplateVersion만 삭제할 수 있다. |

### 5.6 PluginVersion

데이터명: PluginVersion
수집 목적: 제작에 사용할 공식 플러그인 기능과 실행 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Plugin이 승인되면 System이 PluginVersion을 생성한다. |
| 전송 | 발행 요청은 Brand resource publishing service로 전달한다. |
| 저장 | PluginEntry, PluginCapability, PluginUsageCondition, VersionStatus를 저장한다. |
| 처리 | live 전환 시 기존 live 상태의 PluginVersion을 archived 상태로 바꾼다. |
| 활용 | AssetGenerationSession에서는 ResourceRef로 참조한다. |
| 공유·제공 | Creator에게 live 상태의 PluginVersion만 제공한다. |
| 보관 | 발행된 실행 조건과 기능 정의를 보관한다. |
| 파기 | Official Version은 삭제하지 않고 archived로 보관한다. 잘못 만든 stage 상태의 PluginVersion만 삭제할 수 있다. |

## 6. 에셋 제너레이션 기록

AssetGenerationSession, AssetGenerationInput, AssetGenerationOutput은 아키텍처의 Brand asset generation records에 해당한다.

### 6.1 AssetGenerationSession

데이터명: AssetGenerationSession
수집 목적: Creator가 산출물을 만드는 에셋 제너레이션 단위와 사용한 ResourceRef를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 에셋 제너레이션을 시작하면 System이 AssetGenerationSession을 생성하고 AssetGenerationPurpose와 ApplicationTypeRef를 수집한다. |
| 전송 | Creator UI의 에셋 제너레이션 시작 요청은 Client fetch route handler를 거쳐 Brand asset generation service로 전달한다. |
| 저장 | AssetGenerationPurpose, ApplicationTypeRef, ResourceRef, AssetGenerationStatus를 저장한다. |
| 처리 | 입력 변경, 미리보기 생성, 산출물 생성, 완료 상태를 AssetGenerationSession 단위로 묶는다. |
| 활용 | 제작 화면 복원, 질의 맥락, 검수 입력 생성, 사용 기록 조회에 사용한다. |
| 공유·제공 | 품질 검수에는 AssetGenerationOutput과 CheckInputSnapshot 생성에 필요한 범위만 제공한다. |
| 보관 | 에셋 제너레이션 완료 후에도 검수와 운영 조회에 필요한 기간 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 익명화한다. 연결된 검수 기록은 참조 무결성을 확인한 뒤 처리한다. |

### 6.2 AssetGenerationInput

데이터명: AssetGenerationInput
수집 목적: Template 또는 Plugin 실행에 필요한 입력값을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 텍스트, 이미지, 선택값을 입력하면 AssetGenerationSession 아래에 저장한다. |
| 전송 | 입력값은 Creator UI에서 Client fetch route handler를 거쳐 Brand asset generation service로 전달한다. 파일 입력은 설정된 업로드 흐름을 따른다. |
| 저장 | AssetGenerationSession 하위 엔티티로 저장한다. |
| 처리 | EditableBlockSpec과 PluginCapability의 입력 조건으로 검증한다. |
| 활용 | 미리보기 생성, AssetGenerationOutput 생성, 작업 재개에 사용한다. |
| 공유·제공 | Agent에는 답변이나 점검에 필요한 최소 입력 맥락만 제공한다. |
| 보관 | AssetGenerationSession 보관 기간에 맞춰 보관한다. |
| 파기 | AssetGenerationSession 파기 시 함께 삭제하거나 민감 입력은 먼저 마스킹한다. |

### 6.3 AssetGenerationOutput

데이터명: AssetGenerationOutput
수집 목적: Creator가 만든 최종 산출물을 보존하고 검수 입력의 원천으로 사용한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 산출물 생성을 요청하면 System이 AssetGenerationInput과 선택 자원을 조합해 AssetGenerationOutput을 생성한다. |
| 전송 | 생성 요청은 Client fetch route handler를 거쳐 Brand asset generation service로 전달하고, 서비스가 필요한 렌더링 또는 Plugin 실행 어댑터를 호출한다. |
| 저장 | AssetGenerationSession 하위 엔티티로 저장하고 파일 또는 렌더링 결과 위치를 보관한다. |
| 처리 | 저장 위치, 생성 시각, 사용한 ResourceRef를 연결한다. |
| 활용 | Creator가 결과물을 확인하고, 품질 검수는 이를 CheckInputSnapshot으로 고정한다. |
| 공유·제공 | 품질 검수에는 검수에 필요한 산출물 내용과 참조만 제공한다. |
| 보관 | AssetGenerationSession과 CheckInputSnapshot 참조가 유지되는 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제한다. CheckInputSnapshot이 참조하는 경우 먼저 검수 기록 보관 정책을 확인한다. |

## 7. 질의응답 기록

### 7.1 QASession

데이터명: QASession
수집 목적: AssetGenerationSession 맥락에서 발생한 질문과 답변을 하나의 흐름으로 묶는다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 질문을 시작하면 System이 AssetGenerationSession과 연결된 QASession을 생성한다. |
| 전송 | 질문 시작 요청은 Creator UI에서 Client fetch route handler를 거쳐 Answer generation service로 전달한다. |
| 저장 | QASession은 Question, Answer를 하위 엔티티로 보관한다. |
| 처리 | 질문 등록, 관련 기준 검색, 답변 생성, 답변 근거 연결을 같은 세션 안에서 처리한다. |
| 활용 | Creator 질문 이력과 Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 식별자와 상태만 제공한다. |
| 보관 | AssetGenerationSession과 함께 감사 가능한 기간 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 제거한다. |

### 7.2 Question

데이터명: Question
수집 목적: Creator가 제작 중 궁금한 기준과 적용 방법을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 질문 원문을 입력하면 QASession 아래에 생성한다. |
| 전송 | 질문 원문과 AssetGenerationSession 맥락은 Answer generation service로 전달한다. |
| 저장 | QASession 하위 엔티티로 저장하고 QuestionAsked 이벤트를 남긴다. |
| 처리 | 관련 Check, PagePolicy, GuidelineDocument를 검색하는 입력으로 사용한다. |
| 활용 | Agent 답변 생성과 질문 이력 조회에 사용한다. |
| 공유·제공 | Agent에는 답변 생성에 필요한 질문 원문과 최소 맥락만 제공한다. |
| 보관 | QASession 보관 기간에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 질문 원문에서 식별 가능한 내용을 마스킹한다. |

### 7.3 Answer

데이터명: Answer
수집 목적: Agent 또는 System이 Creator 질문에 제공한 답변과 실행 참조를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent가 답변을 생성하면 System이 검증한 뒤 Answer로 저장한다. |
| 전송 | Agent 응답은 Agent repository에서 Answer generation service로 전달되고, 서비스가 저장 가능 형태로 변환한다. |
| 저장 | QASession 하위 엔티티로 저장하고 AgentRunRef를 남긴다. |
| 처리 | AnswerCitation과 AnswerConfidence를 연결한다. |
| 활용 | Creator 답변 조회와 Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 식별자와 상태만 제공한다. |
| 보관 | QASession 보관 기간에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 맥락을 제거한다. |

### 7.4 AnswerCitation

데이터명: AnswerCitation
수집 목적: Answer가 어떤 GuidelineDocument 또는 Check를 근거로 삼았는지 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System이 답변에 사용한 기준을 확인하면 Answer 아래에 생성한다. |
| 전송 | 검색 결과와 Agent 응답 근거가 Answer generation service로 전달된다. |
| 저장 | Answer 하위 값 객체 또는 하위 기록으로 저장한다. |
| 처리 | GuidelineDocumentRef, CheckKey, 근거 유형을 연결한다. |
| 활용 | 답변 신뢰도 표시와 Agent 품질 확인에 사용한다. |
| 공유·제공 | Creator 화면에는 필요한 근거 링크만 제공한다. |
| 보관 | Answer와 같은 기간 보관한다. |
| 파기 | Answer 파기 시 함께 삭제한다. |

### 7.5 AnswerConfidence

데이터명: AnswerConfidence
수집 목적: Answer의 신뢰도와 근거 충분성을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent 답변 생성 후 System이 근거 수, 모델 판단, 검증 결과를 바탕으로 생성한다. |
| 전송 | Agent 응답과 검증 결과가 Answer generation service로 전달된다. |
| 저장 | Answer 하위 값 객체 또는 하위 기록으로 저장하고 AgentRunRef를 연결한다. |
| 처리 | 답변 신뢰도 점수, 근거 충분성, 사람 확인 필요 여부를 계산한다. |
| 활용 | Creator에게 답변 신뢰도를 표시하고, Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 집계 가능한 신뢰도 값만 제공할 수 있다. |
| 보관 | Answer와 같은 기간 보관한다. |
| 파기 | Answer 파기 시 함께 삭제한다. |

## 8. 품질 검수 기록

### 8.1 CheckInputSnapshot

데이터명: CheckInputSnapshot
수집 목적: 검수 시점의 AssetGenerationOutput을 변경되지 않는 입력으로 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator가 검수를 요청하면 System이 현재 AssetGenerationOutput을 복제하거나 참조 고정해 생성한다. |
| 전송 | 검수 요청은 Creator UI에서 Client fetch route handler를 거쳐 Quality check service로 전달한다. |
| 저장 | CheckSession과 연결해 저장하고 원본 AssetGenerationOutput 참조를 보관한다. |
| 처리 | 검수 중 AssetGenerationOutput이 바뀌어도 CheckInputSnapshot은 변경하지 않는다. |
| 활용 | CheckTarget, CheckRun, Check History 조회의 기준 입력으로 사용한다. |
| 공유·제공 | Agent에는 점검에 필요한 산출물 내용만 제공한다. |
| 보관 | CheckSession과 CheckResult가 참조하는 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제한다. 검수 이력 보존이 필요하면 식별 가능한 내용을 제거한 기록만 남긴다. |

### 8.2 CheckSession

데이터명: CheckSession
수집 목적: 특정 CheckInputSnapshot에 대한 검수 흐름 전체를 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckInputSnapshot이 만들어지면 System이 CheckSession을 시작한다. |
| 전송 | 검수 시작 요청은 Quality check service로 전달한다. |
| 저장 | CheckTarget, CheckRun을 하위로 관리하고 상태와 이벤트를 저장한다. |
| 처리 | 점검 실행, 판정, 완료 상태를 같은 세션 안에서 묶는다. |
| 활용 | Creator 검수 결과 조회와 운영자의 점검 이력 조회에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 식별자와 상태만 제공한다. |
| 보관 | 검수 감사와 운영 조회에 필요한 기간 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 제거한다. |

### 8.3 CheckTarget

데이터명: CheckTarget
수집 목적: CheckSession이 어떤 입력을 검수하는지 명확히 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckSession 시작 시 CheckInputSnapshot을 대상으로 생성한다. |
| 전송 | CheckSession 생성 요청 안에 포함되어 Quality check service로 전달된다. |
| 저장 | CheckSession 하위 값 객체 또는 하위 엔티티로 저장한다. |
| 처리 | 검수 대상 유형, 원본 AssetGenerationOutput 참조, CheckInputSnapshot 참조를 연결한다. |
| 활용 | CheckRun이 어떤 입력을 점검했는지 식별하는 데 사용한다. |
| 공유·제공 | Agent에는 필요한 입력 식별자와 내용 참조만 제공한다. |
| 보관 | CheckSession과 같은 기간 보관한다. |
| 파기 | CheckSession 파기 시 함께 삭제한다. |

### 8.4 CheckRun

데이터명: CheckRun
수집 목적: CheckSession 안에서 실행된 점검 1회를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System 또는 Agent가 점검을 실행하면 CheckRun을 생성한다. |
| 전송 | 점검 요청과 Agent 실행 결과는 Quality check service로 전달된다. |
| 저장 | CheckBasis, CheckDecision, AgentRunRef를 연결해 저장한다. |
| 처리 | 점검 기준을 CheckBasis로 고정하고, 점검 결과를 CheckDecision 아래에 만든다. |
| 활용 | 검수 이력 조회와 Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 점검 상태와 결과만 제공한다. |
| 보관 | CheckSession 보관 기간에 맞춰 보관한다. |
| 파기 | CheckSession 파기 시 함께 삭제하거나 AgentRunRef만 남긴다. |

### 8.5 CheckBasis

데이터명: CheckBasis
수집 목적: 점검 실행 시점의 GuidelineVersionRef, CheckRulesetSnapshot, BrandAssetVersionRef를 한 묶음으로 저장한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckRun 시작 시 System이 GuidelineVersionRef, CheckRulesetSnapshot, BrandAssetVersionRef를 수집한다. |
| 전송 | 기준 참조는 Quality check service에서 Agent repository로 전달된다. |
| 저장 | CheckRun 하위 엔티티로 저장하고 각 VersionRef를 값 객체로 보관한다. |
| 처리 | Agent와 System이 같은 기준으로 판단하도록 기준 묶음을 잠근다. |
| 활용 | CheckResult 해석과 검수 재현에 사용한다. |
| 공유·제공 | Agent에는 점검에 필요한 live 상태의 Official Version 내용만 제공한다. |
| 보관 | CheckRun과 같은 기간 보관한다. |
| 파기 | CheckRun 파기 시 함께 삭제한다. |

### 8.6 CheckDecision

데이터명: CheckDecision
수집 목적: 하나의 CheckRun에 대한 최종 판정과 결과 묶음을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 점검 실행이 끝나면 System이 CheckDecision을 생성한다. |
| 전송 | Agent 또는 System 판정 결과는 Quality check service로 전달된다. |
| 저장 | CheckRun 하위 엔티티로 저장하고 CheckOutcome을 보관한다. |
| 처리 | 여러 CheckResult를 소유하고 통과, 주의, 실패 같은 최종 상태를 계산한다. |
| 활용 | Creator 검수 결과 화면과 점검 이력 조회에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 판정 결과만 제공한다. |
| 보관 | CheckRun과 같은 기간 보관한다. |
| 파기 | CheckRun 파기 시 함께 삭제하거나 식별 정보를 제거한 판정 통계만 남긴다. |

### 8.7 CheckResult

데이터명: CheckResult
수집 목적: CheckDecision 안에서 개별 위반, 통과, 경고 결과를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System 또는 Agent가 기준별 점검 결과를 만들면 CheckDecision 아래에 생성한다. |
| 전송 | 점검 결과는 Agent repository 또는 System 점검 로직에서 Quality check service로 전달된다. |
| 저장 | CheckDecision 하위 엔티티로 저장하고 Violation과 CheckRecommendation을 연결한다. |
| 처리 | CheckBasis의 기준 참조와 연결해 위반 원인과 심각도를 해석한다. |
| 활용 | Creator 수정 안내와 점검 이력 조회에 사용한다. |
| 공유·제공 | Manager와 Creator에게 필요한 결과와 근거만 제공한다. |
| 보관 | CheckDecision과 같은 기간 보관한다. |
| 파기 | CheckDecision 파기 시 함께 삭제하거나 통계용 익명 집계만 남긴다. |

### 8.8 CheckRecommendation

데이터명: CheckRecommendation
수집 목적: CheckResult별 수정 방향과 권장 조치를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent가 위반 항목별 수정 방향을 생성하면 System이 CheckResult 아래에 저장한다. |
| 전송 | Agent 응답은 Agent repository에서 Quality check service로 전달된다. |
| 저장 | CheckResult 하위 값 객체 또는 하위 기록으로 저장하고 AgentRunRef를 연결한다. |
| 처리 | 위반 내용, 권장 수정, 우선순위, 설명을 CheckResult에 연결한다. |
| 활용 | Creator 수정 안내에 사용한다. |
| 공유·제공 | Creator에게 수정 지시로 제공한다. |
| 보관 | CheckResult와 같은 기간 보관한다. |
| 파기 | CheckResult 파기 시 함께 삭제한다. |

## 9. 사용 기록

### 9.1 BehaviorEventLog

데이터명: BehaviorEventLog
수집 목적: 가이드라인 화면의 조회, 클릭, 에셋 다운로드, 구간 체류를 저장한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Creator 또는 Manager가 가이드라인 화면을 탐색하면 PageViewEvent, ClickEvent, AssetDownloadEvent, SectionDwellEvent, SearchEvent, OutboundLinkEvent, CustomEvent를 수집한다. |
| 전송 | 화면 이벤트는 Client fetch route handler를 거쳐 Behavior event service로 전달한다. |
| 저장 | Behavior event service가 BehaviorEventLog를 저장하고 필요한 이벤트를 Umami analytics로 전달한다. |
| 처리 | PageRef, ElementRef, Duration, SessionData를 공통 속성으로 연결한다. |
| 활용 | 화면 행동 기록 조회와 에셋 다운로드 이력 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | 운영 조회 요구에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 SessionData에서 식별 가능한 값을 제거한다. |

### 9.2 PageViewEvent

데이터명: PageViewEvent
수집 목적: 가이드라인 페이지 조회 여부와 조회 시점을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 GuidelinePage를 열면 화면 이벤트로 생성한다. |
| 전송 | 클라이언트에서 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장한다. |
| 처리 | PageRef, SessionData, OccurredAt을 연결한다. |
| 활용 | 페이지 조회 이력 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.3 ClickEvent

데이터명: ClickEvent
수집 목적: 가이드라인 화면에서 사용자가 누른 요소를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 버튼, 링크, 탭, 필터를 클릭하면 생성한다. |
| 전송 | 클라이언트에서 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장한다. |
| 처리 | ElementRef, PageRef, SessionData를 연결한다. |
| 활용 | 화면 요소 클릭 이력 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.4 AssetDownloadEvent

데이터명: AssetDownloadEvent
수집 목적: 공식 에셋 다운로드 횟수와 사용 맥락을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 BrandAssetVersion을 다운로드하면 생성한다. |
| 전송 | 다운로드 요청 처리 후 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 BrandAssetVersionRef를 연결한다. |
| 처리 | PageRef, AssetRef, SessionData를 연결한다. |
| 활용 | 에셋 다운로드 이력 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.5 SectionDwellEvent

데이터명: SectionDwellEvent
수집 목적: 가이드라인 화면의 특정 구간 체류 시간을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 페이지 특정 구간에 머문 시간이 기준을 넘으면 생성한다. |
| 전송 | 클라이언트에서 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 Duration을 보관한다. |
| 처리 | PageRef, SectionRef, Duration, SessionData를 연결한다. |
| 활용 | 구간 체류 이력 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.6 SearchEvent

데이터명: SearchEvent
수집 목적: 가이드라인 화면에서 사용자가 검색한 기준과 결과 선택 맥락을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 가이드라인 화면에서 검색을 실행하면 생성한다. |
| 전송 | 클라이언트에서 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 검색어와 결과 참조를 보관한다. |
| 처리 | Query, ResultRef, PageRef, SessionData를 연결한다. |
| 활용 | 기준 탐색 흐름과 검색 실패 지점 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제하거나 검색어에서 식별 가능한 내용을 제거한다. |

### 9.7 OutboundLinkEvent

데이터명: OutboundLinkEvent
수집 목적: 가이드라인 화면에서 외부 자료로 이동한 행동을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 외부 링크를 클릭하면 생성한다. |
| 전송 | 클라이언트에서 Client fetch route handler를 거쳐 Behavior event service로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 링크 대상 참조를 보관한다. |
| 처리 | LinkRef, PageRef, SessionData를 연결한다. |
| 활용 | 외부 자료 의존도와 이동 경로 확인에 사용한다. |
| 공유·제공 | 운영 조회에는 필요한 범위만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.8 CustomEvent

데이터명: CustomEvent
수집 목적: 기본 이벤트로 표현하기 어려운 화면별 운영 이벤트를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 특정 화면에서 별도 기록이 필요한 행동이 발생하면 생성한다. |
| 전송 | 클라이언트는 Client fetch route handler를 거치고, 서버는 내부 요청으로 Behavior event service에 전달한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 EventPayload를 보관한다. |
| 처리 | 이벤트 이름, PageRef, SessionData, payload 스키마를 검증한다. |
| 활용 | 화면별 운영 지표에 사용한다. |
| 공유·제공 | 운영 조회에는 검증된 이벤트만 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

## 10. 설계 원칙

- Agent는 정책과 규칙을 직접 변경하지 않습니다.
- CheckInputSnapshot은 검수 입력을 고정하고, CheckBasis는 검수 기준 VersionRef를 저장합니다.
- CheckDecision은 하나의 최종 판정이고, 여러 CheckResult를 소유합니다.
- CheckResult는 필요한 경우 CheckRecommendation을 소유합니다.
