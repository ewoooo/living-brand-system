# 03. 데이터 생명주기

## 1. 목적

이 문서는 브랜드 운영 시스템에서 주요 데이터가 생성되고, 사용되고, 보관되고, 파기되는 흐름을 정리합니다.
기준은 [02. 유즈케이스](02-usecases.md)와 [04. 도메인 모델](04-domain-model.md)의 최신 구조입니다.

핵심은 원천 기준, 실행 기록, 사용 기록, 운영 인사이트를 섞지 않는 것입니다.
원천 기준은 가이드라인 관리가 소유하고, 제작과 품질 검수는 공식 버전 참조를 남깁니다.
운영 인사이트는 사용 기록과 도메인 이벤트를 소유하지 않고 Evidence로 참조합니다.

## 2. 작성 기준

각 데이터는 같은 단계로 설명합니다.

| 단계 | 의미 |
| --- | --- |
| 생성·수집 | 데이터가 처음 만들어지거나 외부 입력으로 들어오는 시점 |
| 전송 | UI, Service, Agent, 외부 도구 사이에서 이동하는 방식 |
| 저장 | 주 저장소와 저장 시 보호 기준 |
| 처리 | 상태 변경, 연결, 검증, 파생 데이터 생성 방식 |
| 활용 | 화면, Agent, 검수, 인사이트에서 쓰이는 방식 |
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
| 전송 | Manager UI에서 입력한 값은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | Payload collection과 PostgreSQL에 저장한다. Payload revision은 CMS 내부 수정 이력으로 남긴다. |
| 처리 | GuidelineSection, GuidelinePage, BrandGuidelineVersion을 소유하고, 검토와 승인 상태를 관리한다. |
| 활용 | Manager는 편집과 발행에 사용하고, Worker와 Agent는 live Version만 참조한다. |
| 공유·제공 | 제작 관리와 품질 검수에는 BrandGuideline 원본이 아니라 GuidelineVersionRef로 제공한다. |
| 보관 | draft, in review, approved, live, archived 상태와 revision 이력을 보관한다. |
| 파기 | 잘못 만든 draft는 삭제할 수 있다. live 또는 archived 버전이 있는 데이터는 참조 무결성을 위해 비활성화한다. |

### 3.2 GuidelineSection

데이터명: GuidelineSection
수집 목적: 가이드라인 페이지를 장 단위로 묶고 표시 순서를 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 섹션 이름, 설명, 표시 순서를 입력하면 BrandGuideline 아래에 생성한다. |
| 전송 | 섹션 편집 요청은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | BrandGuideline 하위 엔티티로 저장하고 표시 순서를 함께 보관한다. |
| 처리 | GuidelinePage를 소유하고, 순서 변경 시 페이지 표시 순서를 다시 계산한다. |
| 활용 | Manager 편집 화면과 Worker 가이드라인 탐색 구조에 사용한다. |
| 공유·제공 | 다른 도메인에는 직접 제공하지 않고 GuidelineVersion에 포함된 구조로 제공한다. |
| 보관 | BrandGuideline revision과 공식 Version에 포함해 보관한다. |
| 파기 | 연결된 페이지가 없을 때 삭제한다. 이미 발행된 섹션은 이후 Version에서 제외하는 방식으로 처리한다. |

### 3.3 GuidelinePage

데이터명: GuidelinePage
수집 목적: Policy, Rule, Asset, Template, Plugin 참조를 묶어 Worker가 읽는 페이지 단위를 만든다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 페이지 제목, 배치 정보, 소속 섹션을 입력하면 GuidelineSection 아래에 생성한다. |
| 전송 | 페이지 구성 요청은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | PagePolicy, PageRuleRef, PageAssetRef, PageExample, PageComposition과 함께 저장한다. |
| 처리 | 페이지 안에서 정책 설명, 규칙 참조, 에셋 참조, 템플릿 참조, 플러그인 참조를 연결한다. |
| 활용 | Worker 가이드라인 화면, Agent 답변 근거, 품질 검수 기준 탐색에 사용한다. |
| 공유·제공 | BehaviorEventLog에는 페이지 조회와 클릭 대상인 PageRef만 제공한다. |
| 보관 | 공식 Version에 포함된 페이지 구조를 유지한다. |
| 파기 | 발행 전 페이지는 삭제할 수 있다. 발행 후에는 다음 Version에서 제외하고 기존 Version은 보관한다. |

### 3.4 PagePolicy

데이터명: PagePolicy
수집 목적: GuidelinePage의 상위 정책 설명과 적용 맥락을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 정책 문구, 설명, 적용 맥락을 작성하면 GuidelinePage에 1:1로 연결한다. |
| 전송 | 정책 편집 요청은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 revision에 포함한다. |
| 처리 | 관련 Rule, PageAssetRef, PageExample과 함께 페이지 기준을 구성한다. |
| 활용 | Worker가 정책 의도를 이해하는 데 사용하고, Agent 답변의 설명 근거로 사용한다. |
| 공유·제공 | QASession에는 AnswerCitation 근거로 필요한 범위만 제공한다. |
| 보관 | 공식 Version에 포함된 정책 문구를 보관한다. |
| 파기 | 페이지가 삭제되거나 다음 Version에서 제외될 때 함께 제외한다. 이미 발행된 Version의 정책은 보존한다. |

### 3.5 Rule

데이터명: Rule
수집 목적: 산출물 제작과 품질 검수에서 재사용할 판단 기준을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 규칙 이름, 조건, 심각도, 적용 범위를 입력하면 draft 상태로 생성한다. |
| 전송 | 규칙 등록과 수정 요청은 Payload API를 통해 RuleConflictCheckService로 전달한다. |
| 저장 | Rule 애그리거트로 저장하고 RuleCondition, RuleScope, Severity를 함께 보관한다. |
| 처리 | 충돌 확인을 거쳐 RuleVersion 후보를 만들고, RuleException을 하위로 관리한다. |
| 활용 | PageRuleRef, AnswerCitation, CheckBasis, Evidence에서 판단 기준으로 참조한다. |
| 공유·제공 | Worker와 Agent에는 live RuleVersion만 제공한다. |
| 보관 | RuleVersion과 Payload revision을 함께 보관한다. |
| 파기 | draft 규칙은 삭제할 수 있다. 발행된 규칙은 archived Version으로 전환하고 원본은 보관한다. |

### 3.6 RuleException

데이터명: RuleException
수집 목적: 특정 Rule에 종속되는 예외 조건과 적용 기간을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 예외 조건, 예외 사유, 적용 기간을 입력하면 Rule 아래에 생성한다. |
| 전송 | 예외 등록 요청은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | Rule 하위 엔티티로 저장하고 ExceptionReason과 적용 기간을 보관한다. |
| 처리 | RuleCondition과 함께 평가되어 예외 적용 여부를 판단한다. |
| 활용 | Agent 답변과 품질 검수에서 위반 여부를 해석할 때 사용한다. |
| 공유·제공 | RuleVersion에 포함된 예외 조건으로 Worker와 Agent에 제공한다. |
| 보관 | 예외 적용 기간과 변경 사유를 보관한다. |
| 파기 | 적용 종료 후에는 archived 상태로 남기고, 잘못 만든 draft 예외만 삭제한다. |

### 3.7 PageRuleRef

데이터명: PageRuleRef
수집 목적: GuidelinePage가 어떤 RuleVersion을 어떤 표시 역할로 사용하는지 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 페이지에 규칙을 연결하면 표시 순서와 강조 여부를 함께 수집한다. |
| 전송 | 연결 요청은 Payload API를 통해 GuidelinePage 갱신 요청으로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 RuleVersionRef를 보관한다. |
| 처리 | 페이지 표시 순서, 강조, 캡션 같은 페이지 맥락을 Rule 참조와 함께 관리한다. |
| 활용 | Worker 화면의 규칙 표시와 Agent 답변 근거 탐색에 사용한다. |
| 공유·제공 | 다른 도메인에는 페이지 구성의 일부로만 제공한다. |
| 보관 | GuidelineVersion에 포함해 발행 시점의 연결 상태를 보관한다. |
| 파기 | 페이지에서 규칙 연결을 제거하면 다음 Version부터 제외한다. 기존 Version의 연결은 유지한다. |

### 3.8 PageAssetRef

데이터명: PageAssetRef
수집 목적: GuidelinePage가 어떤 BrandAssetVersion을 어떤 예시 역할로 사용하는지 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 페이지에 에셋을 연결하면 캡션, 예시 역할, 표시 순서를 함께 수집한다. |
| 전송 | 연결 요청은 Payload API를 통해 GuidelinePage 갱신 요청으로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 BrandAssetVersionRef를 보관한다. |
| 처리 | 페이지 화면 구성과 에셋 참조를 함께 관리한다. |
| 활용 | Worker 가이드라인 화면과 에셋 다운로드 동선에 사용한다. |
| 공유·제공 | BehaviorEventLog에는 다운로드 대상 BrandAssetVersionRef로 연결된다. |
| 보관 | GuidelineVersion에 포함해 발행 시점의 에셋 연결을 보관한다. |
| 파기 | 페이지에서 에셋 연결을 제거하면 다음 Version부터 제외한다. 기존 Version의 연결은 유지한다. |

### 3.9 PageExample

데이터명: PageExample
수집 목적: GuidelinePage에서 좋은 예시, 나쁜 예시, 사용 예시를 설명한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 예시 이미지, 설명, 예시 유형을 입력하면 GuidelinePage 아래에 생성한다. |
| 전송 | 예시 등록 요청은 Payload API를 통해 가이드라인 관리 서비스로 전달한다. |
| 저장 | GuidelinePage 하위 엔티티로 저장하고 관련 PageAssetRef나 RuleVersionRef를 함께 보관한다. |
| 처리 | 페이지 안에서 Policy, Rule, Asset과 함께 예시 맥락을 구성한다. |
| 활용 | Worker가 기준을 해석하는 데 사용하고, Agent가 설명을 보강할 때 참조한다. |
| 공유·제공 | 다른 도메인에는 GuidelineVersion에 포함된 읽기 모델로 제공한다. |
| 보관 | 공식 Version에 포함된 예시를 보관한다. |
| 파기 | 발행 전 예시는 삭제할 수 있다. 발행 후에는 다음 Version에서 제외한다. |

## 4. 브랜드 자원

### 4.1 BrandAsset

데이터명: BrandAsset
수집 목적: 로고, 이미지, 아이콘, 참고 파일 같은 공식 브랜드 자원을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 에셋 파일, 에셋 유형, 메타데이터를 입력하면 BrandAsset을 생성한다. |
| 전송 | 파일과 메타데이터는 Payload upload 흐름을 통해 전송한다. |
| 저장 | 파일은 설정된 파일 저장소에 저장하고, 메타데이터는 Payload collection과 PostgreSQL에 저장한다. |
| 처리 | AssetFile, BrandAssetVersion, UsageCondition, DownloadStatus를 함께 관리한다. |
| 활용 | GuidelinePage, Rule, WorkSession, CheckBasis에서 공식 자원으로 참조한다. |
| 공유·제공 | Worker에게 다운로드 가능한 live BrandAssetVersion만 제공한다. |
| 보관 | 파일 원본, 버전, 사용 조건, 폐기 사유를 보관한다. |
| 파기 | draft 파일은 삭제할 수 있다. 발행된 에셋은 archived 처리하고 실제 파일 삭제는 참조 종료 후 수행한다. |

### 4.2 Template

데이터명: Template
수집 목적: Worker가 산출물을 만들 때 사용할 공식 형식을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 템플릿 이름, 설명, Figma 노드 또는 템플릿 파일 참조를 입력하면 Template을 생성한다. |
| 전송 | 템플릿 메타데이터는 Payload API로 전달하고, 원본은 Figma node 또는 파일 업로드 흐름으로 참조한다. |
| 저장 | TemplateSourceRef, LayoutSpec, TextStyleSpec, EditableBlockSpec, TemplateUsageCondition, TemplateVersion을 함께 저장한다. |
| 처리 | 지정된 레이아웃, 텍스트 스타일, 텍스트 블록, 에셋 슬롯, 컬러 토큰과 연결된 RuleVersionRef, BrandAssetVersionRef를 검증한다. |
| 활용 | WorkSession에서 산출물 제작 형식으로 사용하고, Production service가 React 또는 HTML 편집 노드로 변환한다. |
| 공유·제공 | Worker에게 live TemplateVersion만 제공한다. |
| 보관 | TemplateVersion과 사용 조건 변경 이력을 보관한다. |
| 파기 | draft 템플릿은 삭제할 수 있다. 발행된 템플릿은 archived 처리하고 기존 WorkSession 참조는 보존한다. |

### 4.3 Plugin

데이터명: Plugin
수집 목적: Worker가 산출물을 만들 때 사용할 공식 제작 기능을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 플러그인 이름, 설명, 유형, 실행 단위를 입력하면 Plugin을 생성한다. |
| 전송 | 플러그인 설정은 Payload API를 통해 저장하고, 테스트 실행은 Agent repository로 전달한다. |
| 저장 | PluginEntry, PluginCapability, PluginUsageCondition, PluginVersion을 함께 저장한다. |
| 처리 | 입력 스키마, 출력 형식, 사용 조건, 연결된 TemplateVersionRef와 RuleVersionRef를 검증한다. |
| 활용 | WorkSession에서 제작 기능으로 사용하고, AgentRunRef로 실행 이력을 남긴다. |
| 공유·제공 | Worker에게 live PluginVersion만 제공한다. |
| 보관 | PluginVersion, 테스트 결과 참조, 사용 조건 변경 이력을 보관한다. |
| 파기 | draft 플러그인은 삭제할 수 있다. 발행된 플러그인은 archived 처리하고 기존 실행 이력은 보존한다. |

## 5. 공식 버전

### 5.1 BrandGuidelineVersion

데이터명: BrandGuidelineVersion
수집 목적: Worker와 Agent가 참조할 공식 가이드라인 버전을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Manager가 승인된 BrandGuideline을 발행하면 System이 stage 또는 live Version을 생성한다. |
| 전송 | 발행 요청은 VersionPublishService로 전달한다. |
| 저장 | VersionNumber, VersionStatus, EffectivePeriod, PayloadRevisionRef, PreviousVersionRef를 저장한다. |
| 처리 | live 전환 시 기존 live Version은 archived 상태로 바꾼다. |
| 활용 | WorkSession과 CheckBasis가 GuidelineVersionRef로 참조한다. |
| 공유·제공 | Worker 화면과 Agent에는 live Version만 제공한다. |
| 보관 | stage, live, archived 상태와 버전 사유를 보관한다. |
| 파기 | 발행된 Version은 삭제하지 않고 archived로 보관한다. 잘못 생성된 stage Version만 삭제할 수 있다. |

### 5.2 RuleVersion

데이터명: RuleVersion
수집 목적: Agent 답변과 품질 검수에서 사용할 공식 규칙 기준을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Rule이 승인되거나 수정되면 System이 RuleVersion 후보를 만든다. |
| 전송 | 버전 생성 요청은 VersionPublishService로 전달한다. |
| 저장 | VersionNumber, VersionStatus, RuleCondition, RuleScope, Severity, PayloadRevisionRef를 저장한다. |
| 처리 | live 전환 시 기존 live RuleVersion은 archived 상태로 바꾼다. |
| 활용 | PageRuleRef, AnswerCitation, CheckBasis, Evidence에서 RuleVersionRef로 참조한다. |
| 공유·제공 | Worker와 Agent에는 live RuleVersion만 제공한다. |
| 보관 | 모든 발행 Version과 변경 사유를 보관한다. |
| 파기 | 발행된 Version은 삭제하지 않고 archived로 보관한다. 잘못 생성된 stage Version만 삭제할 수 있다. |

### 5.3 BrandAssetVersion

데이터명: BrandAssetVersion
수집 목적: 공식으로 사용할 수 있는 브랜드 에셋 파일과 사용 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | BrandAsset이 발행되면 System이 BrandAssetVersion을 생성한다. |
| 전송 | 발행 요청과 파일 참조는 AssetPublishService로 전달한다. |
| 저장 | VersionStatus, AssetFile 참조, UsageCondition, DownloadStatus를 저장한다. |
| 처리 | 대체 에셋이 발행되면 이전 Version을 archived 상태로 바꾼다. |
| 활용 | PageAssetRef, WorkSession, CheckBasis에서 BrandAssetVersionRef로 참조한다. |
| 공유·제공 | Worker에게 다운로드 가능한 live Version만 제공한다. |
| 보관 | 파일 참조, 다운로드 상태, 폐기 사유를 보관한다. |
| 파기 | 발행된 Version은 삭제하지 않고 archived로 보관한다. 파일은 참조 종료 후 보관 정책에 따라 삭제한다. |

### 5.4 TemplateVersion

데이터명: TemplateVersion
수집 목적: 제작에 사용할 공식 템플릿 구조와 입력 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Template이 승인되면 System이 TemplateVersion을 생성한다. |
| 전송 | 발행 요청은 TemplatePublishService로 전달한다. |
| 저장 | TemplateSourceRef, LayoutSpec, TextStyleSpec, EditableBlockSpec, TemplateUsageCondition, VersionStatus를 저장한다. |
| 처리 | live 전환 시 기존 live TemplateVersion을 archived 상태로 바꾸고, Figma node 또는 파일 원본을 재해석해 제작 가능한 구조를 고정한다. |
| 활용 | WorkSession에서 TemplateVersionRef로 참조한다. |
| 공유·제공 | Worker에게 live TemplateVersion만 제공한다. |
| 보관 | 발행된 편집 가능 영역과 사용 조건을 보관한다. |
| 파기 | 발행된 Version은 삭제하지 않고 archived로 보관한다. 잘못 만든 stage Version만 삭제할 수 있다. |

### 5.5 PluginVersion

데이터명: PluginVersion
수집 목적: 제작에 사용할 공식 플러그인 기능과 실행 조건을 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Plugin이 승인되면 System이 PluginVersion을 생성한다. |
| 전송 | 발행 요청은 PluginPublishService로 전달한다. |
| 저장 | PluginEntry, PluginCapability, PluginUsageCondition, VersionStatus를 저장한다. |
| 처리 | live 전환 시 기존 live PluginVersion을 archived 상태로 바꾼다. |
| 활용 | WorkSession에서 PluginVersionRef로 참조한다. |
| 공유·제공 | Worker에게 live PluginVersion만 제공한다. |
| 보관 | 발행된 실행 조건과 기능 정의를 보관한다. |
| 파기 | 발행된 Version은 삭제하지 않고 archived로 보관한다. 잘못 만든 stage Version만 삭제할 수 있다. |

## 6. 제작 기록

### 6.1 WorkSession

데이터명: WorkSession
수집 목적: Worker가 산출물을 만드는 작업 단위와 사용한 공식 자원 버전을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 작업을 시작하면 System이 WorkSession을 생성하고 WorkPurpose와 ApplicationTypeRef를 수집한다. |
| 전송 | Worker UI의 작업 시작 요청은 제작 관리 서비스로 전달한다. |
| 저장 | WorkPurpose, ApplicationTypeRef, GuidelineVersionRef, BrandAssetVersionRef, TemplateVersionRef, PluginVersionRef, WorkSessionStatus를 저장한다. |
| 처리 | 입력 변경, 미리보기 생성, 산출물 생성, 완료 이벤트를 WorkSession 단위로 묶는다. |
| 활용 | 제작 화면 복원, 질의 맥락, 검수 입력 생성, 사용 기록 조회에 사용한다. |
| 공유·제공 | 품질 검수에는 WorkOutput과 CheckInputSnapshot 생성에 필요한 범위만 제공한다. |
| 보관 | 작업 완료 후에도 검수와 인사이트 근거로 필요한 기간 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 익명화한다. 연결된 검수 기록은 참조 무결성을 확인한 뒤 처리한다. |

### 6.2 WorkInput

데이터명: WorkInput
수집 목적: Template 또는 Plugin 실행에 필요한 입력값을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 텍스트, 이미지, 선택값을 입력하면 WorkSession 아래에 저장한다. |
| 전송 | 입력값은 Worker UI에서 제작 관리 서비스로 전달한다. 파일 입력은 설정된 업로드 흐름을 따른다. |
| 저장 | WorkSession 하위 엔티티로 저장하고 입력 변경 이벤트를 남긴다. |
| 처리 | EditableBlockSpec과 PluginCapability의 입력 조건으로 검증한다. |
| 활용 | 미리보기 생성, WorkOutput 생성, 작업 재개에 사용한다. |
| 공유·제공 | Agent에는 답변이나 점검에 필요한 최소 입력 맥락만 제공한다. |
| 보관 | WorkSession 보관 기간에 맞춰 보관한다. |
| 파기 | WorkSession 파기 시 함께 삭제하거나 민감 입력은 먼저 마스킹한다. |

### 6.3 WorkOutput

데이터명: WorkOutput
수집 목적: Worker가 만든 최종 산출물을 보존하고 검수 입력의 원천으로 사용한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 산출물 생성을 요청하면 System이 WorkInput과 선택 자원을 조합해 WorkOutput을 생성한다. |
| 전송 | 생성 요청은 제작 관리 서비스와 필요한 렌더링 또는 Plugin 실행 어댑터로 전달한다. |
| 저장 | WorkSession 하위 엔티티로 저장하고 파일 또는 렌더링 결과 위치를 보관한다. |
| 처리 | 저장 위치, 생성 시각, 사용한 VersionRef를 연결한다. |
| 활용 | Worker가 결과물을 확인하고, 품질 검수는 이를 CheckInputSnapshot으로 고정한다. |
| 공유·제공 | 품질 검수에는 검수에 필요한 산출물 내용과 참조만 제공한다. |
| 보관 | WorkSession과 CheckInputSnapshot 참조가 유지되는 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제한다. CheckInputSnapshot이 참조하는 경우 먼저 검수 기록 보관 정책을 확인한다. |

## 7. 질의응답 기록

### 7.1 QASession

데이터명: QASession
수집 목적: WorkSession 맥락에서 발생한 질문과 답변을 하나의 흐름으로 묶는다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 질문을 시작하면 System이 WorkSession과 연결된 QASession을 생성한다. |
| 전송 | 질문 시작 요청은 Worker UI에서 AnswerGenerationService로 전달한다. |
| 저장 | QASession은 Question, Answer를 하위 엔티티로 보관한다. |
| 처리 | 질문 등록, 관련 기준 검색, 답변 생성, 답변 근거 연결을 같은 세션 안에서 처리한다. |
| 활용 | Worker 질문 이력, 반복 질문 탐지, Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | WorkSession과 함께 감사 가능한 기간 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 제거한다. |

### 7.2 Question

데이터명: Question
수집 목적: Worker가 작업 중 궁금한 기준과 적용 방법을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 질문 원문을 입력하면 QASession 아래에 생성한다. |
| 전송 | 질문 원문과 WorkSession 맥락은 AnswerGenerationService로 전달한다. |
| 저장 | QASession 하위 엔티티로 저장하고 QuestionAsked 이벤트를 남긴다. |
| 처리 | 관련 RuleVersion, PagePolicy, GuidelinePage를 검색하는 입력으로 사용한다. |
| 활용 | Agent 답변 생성, 반복 질문 탐지, 인사이트 Evidence 생성에 사용한다. |
| 공유·제공 | Agent에는 답변 생성에 필요한 질문 원문과 최소 맥락만 제공한다. |
| 보관 | QASession 보관 기간에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 질문 원문에서 식별 가능한 내용을 마스킹한다. |

### 7.3 Answer

데이터명: Answer
수집 목적: Agent 또는 System이 Worker 질문에 제공한 답변과 실행 참조를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent가 답변을 생성하면 System이 검증한 뒤 Answer로 저장한다. |
| 전송 | Agent 응답은 Agent repository에서 Service로 전달되고, Service가 저장 가능 형태로 변환한다. |
| 저장 | QASession 하위 엔티티로 저장하고 AgentRunRef를 남긴다. |
| 처리 | AnswerCitation과 AnswerConfidence를 연결한다. |
| 활용 | Worker 답변 조회, 반복 질문 분석, Agent 품질 확인에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | QASession 보관 기간에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 맥락을 제거한다. |

### 7.4 AnswerCitation

데이터명: AnswerCitation
수집 목적: Answer가 어떤 PagePolicy 또는 RuleVersion을 근거로 삼았는지 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System이 답변에 사용한 기준을 확인하면 Answer 아래에 생성한다. |
| 전송 | 검색 결과와 Agent 응답 근거가 AnswerGenerationService로 전달된다. |
| 저장 | Answer 하위 값 객체 또는 하위 기록으로 저장한다. |
| 처리 | RuleVersionRef, PagePolicy 참조, 근거 유형을 연결한다. |
| 활용 | 답변 신뢰도 표시와 반복 질문 분석에 사용한다. |
| 공유·제공 | Worker 화면에는 필요한 근거 링크만 제공한다. |
| 보관 | Answer와 같은 기간 보관한다. |
| 파기 | Answer 파기 시 함께 삭제한다. |

### 7.5 AnswerConfidence

데이터명: AnswerConfidence
수집 목적: Answer의 신뢰도와 근거 충분성을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent 답변 생성 후 System이 근거 수, 모델 판단, 검증 결과를 바탕으로 생성한다. |
| 전송 | Agent 응답과 검증 결과가 AnswerGenerationService로 전달된다. |
| 저장 | Answer 하위 값 객체 또는 하위 기록으로 저장하고 AgentRunRef를 연결한다. |
| 처리 | 답변 신뢰도 점수, 근거 충분성, 사람 확인 필요 여부를 계산한다. |
| 활용 | Worker에게 답변 신뢰도를 표시하고, Agent 품질 분석에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Agent 답변 품질 Evidence로 제공할 수 있다. |
| 보관 | Answer와 같은 기간 보관한다. |
| 파기 | Answer 파기 시 함께 삭제한다. |

## 8. 품질 검수 기록

### 8.1 CheckInputSnapshot

데이터명: CheckInputSnapshot
수집 목적: 검수 시점의 WorkOutput을 변경되지 않는 입력으로 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker가 검수를 요청하면 System이 현재 WorkOutput을 복제하거나 참조 고정해 생성한다. |
| 전송 | 검수 요청은 Worker UI에서 QualityCheckService로 전달한다. |
| 저장 | CheckSession과 연결해 저장하고 원본 WorkOutput 참조를 보관한다. |
| 처리 | 검수 중 WorkOutput이 바뀌어도 CheckInputSnapshot은 변경하지 않는다. |
| 활용 | CheckTarget, CheckRun, Check History 조회의 기준 입력으로 사용한다. |
| 공유·제공 | Agent에는 점검에 필요한 산출물 내용만 제공한다. |
| 보관 | CheckSession과 CheckResult가 참조하는 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제한다. 검수 이력 보존이 필요하면 식별 가능한 내용을 제거한 요약만 남긴다. |

### 8.2 CheckSession

데이터명: CheckSession
수집 목적: 특정 CheckInputSnapshot에 대한 검수 흐름 전체를 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckInputSnapshot이 만들어지면 System이 CheckSession을 시작한다. |
| 전송 | 검수 시작 요청은 QualityCheckService로 전달한다. |
| 저장 | CheckTarget, CheckRun을 하위로 관리하고 상태와 이벤트를 저장한다. |
| 처리 | 점검 실행, 판정, 완료 상태를 같은 세션 안에서 묶는다. |
| 활용 | Worker 검수 결과 조회, 운영자의 점검 이력 조회, 반복 위반 탐지에 사용한다. |
| 공유·제공 | 사용 기록에는 SessionEventLog로 감사 가능한 이벤트를 남긴다. |
| 보관 | 검수 감사와 인사이트 분석에 필요한 기간 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 사용자 식별 정보를 제거한다. |

### 8.3 CheckTarget

데이터명: CheckTarget
수집 목적: CheckSession이 어떤 입력을 검수하는지 명확히 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckSession 시작 시 CheckInputSnapshot을 대상으로 생성한다. |
| 전송 | CheckSession 생성 요청 안에 포함되어 QualityCheckService로 전달된다. |
| 저장 | CheckSession 하위 값 객체 또는 하위 엔티티로 저장한다. |
| 처리 | 검수 대상 유형, 원본 WorkOutput 참조, CheckInputSnapshot 참조를 연결한다. |
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
| 전송 | 점검 요청과 Agent 실행 결과는 QualityCheckService로 전달된다. |
| 저장 | CheckBasis, CheckDecision, AgentRunRef를 연결해 저장한다. |
| 처리 | 점검 기준을 CheckBasis로 고정하고, 점검 결과를 CheckDecision 아래에 만든다. |
| 활용 | 검수 이력 조회, Agent 품질 확인, 반복 위반 탐지에 사용한다. |
| 공유·제공 | 사용 기록에는 CheckRunCompleted 같은 세션 이벤트를 남긴다. |
| 보관 | CheckSession 보관 기간에 맞춰 보관한다. |
| 파기 | CheckSession 파기 시 함께 삭제하거나 AgentRunRef만 남긴다. |

### 8.5 CheckBasis

데이터명: CheckBasis
수집 목적: 점검 실행 시점의 Guideline, Rule, BrandAsset 버전 참조를 한 묶음으로 고정한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | CheckRun 시작 시 System이 GuidelineVersionRef, RuleVersionRef, BrandAssetVersionRef를 수집한다. |
| 전송 | 기준 참조는 QualityCheckService에서 Agent repository로 전달된다. |
| 저장 | CheckRun 하위 엔티티로 저장하고 각 VersionRef를 값 객체로 보관한다. |
| 처리 | Agent와 System이 같은 기준으로 판단하도록 기준 묶음을 잠근다. |
| 활용 | CheckResult 해석, 반복 위반 탐지, 검수 재현에 사용한다. |
| 공유·제공 | Agent에는 점검에 필요한 live 기준 내용만 제공한다. |
| 보관 | CheckRun과 같은 기간 보관한다. |
| 파기 | CheckRun 파기 시 함께 삭제한다. 단, 인사이트 Evidence가 참조 중이면 참조 가능 범위를 보존한다. |

### 8.6 CheckDecision

데이터명: CheckDecision
수집 목적: 하나의 CheckRun에 대한 최종 판정과 결과 묶음을 관리한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 점검 실행이 끝나면 System이 CheckDecision을 생성한다. |
| 전송 | Agent 또는 System 판정 결과는 QualityCheckService로 전달된다. |
| 저장 | CheckRun 하위 엔티티로 저장하고 CheckOutcome을 보관한다. |
| 처리 | 여러 CheckResult를 소유하고 통과, 주의, 실패 같은 최종 상태를 계산한다. |
| 활용 | Worker 검수 결과 화면과 반복 검수 실패 사유 탐지에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | CheckRun과 같은 기간 보관한다. |
| 파기 | CheckRun 파기 시 함께 삭제하거나 식별 정보를 제거한 판정 통계만 남긴다. |

### 8.7 CheckResult

데이터명: CheckResult
수집 목적: CheckDecision 안에서 개별 위반, 통과, 경고 결과를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System 또는 Agent가 기준별 점검 결과를 만들면 CheckDecision 아래에 생성한다. |
| 전송 | 점검 결과는 Agent repository 또는 System 점검 로직에서 QualityCheckService로 전달된다. |
| 저장 | CheckDecision 하위 엔티티로 저장하고 Violation과 CheckRecommendation을 연결한다. |
| 처리 | CheckBasis의 기준 참조와 연결해 위반 원인과 심각도를 해석한다. |
| 활용 | Worker 수정 안내, 반복 위반 탐지, 운영 인사이트 Evidence에 사용한다. |
| 공유·제공 | Manager와 Worker에게 필요한 결과와 근거만 제공한다. |
| 보관 | CheckDecision과 같은 기간 보관한다. |
| 파기 | CheckDecision 파기 시 함께 삭제하거나 통계용 익명 집계만 남긴다. |

### 8.8 CheckRecommendation

데이터명: CheckRecommendation
수집 목적: CheckResult별 수정 방향과 권장 조치를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Agent가 위반 항목별 수정 방향을 생성하면 System이 CheckResult 아래에 저장한다. |
| 전송 | Agent 응답은 Agent repository에서 QualityCheckService로 전달된다. |
| 저장 | CheckResult 하위 값 객체 또는 하위 기록으로 저장하고 AgentRunRef를 연결한다. |
| 처리 | 위반 내용, 권장 수정, 우선순위, 설명을 CheckResult에 연결한다. |
| 활용 | Worker 수정 안내와 반복 검수 실패 사유 분석에 사용한다. |
| 공유·제공 | Worker에게 수정 지시로 제공하고, 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | CheckResult와 같은 기간 보관한다. |
| 파기 | CheckResult 파기 시 함께 삭제한다. |

## 9. 사용 기록

### 9.1 SessionEventLog

데이터명: SessionEventLog
수집 목적: WorkSession, QASession, CheckSession에서 발생한 감사 가능한 이벤트를 저장한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 각 도메인 서비스가 작업 시작, 질문, 답변, 점검 완료 같은 이벤트를 발행하면 수집한다. |
| 전송 | 서비스 내부 이벤트는 SessionEventIngestService로 전달한다. |
| 저장 | 제품 DB에 SessionEvent와 EventPayload를 저장한다. |
| 처리 | EventType, ActorRef, SourceRef, OccurredAt 기준으로 조회 가능하게 정리한다. |
| 활용 | 운영 조회, 작업 흐름 추적, 인사이트 Evidence 생성에 사용한다. |
| 공유·제공 | 운영 인사이트에는 원본을 복제하지 않고 Evidence 참조로 제공한다. |
| 보관 | 감사와 분석에 필요한 기간 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 ActorRef를 익명화한다. |

### 9.2 SessionEvent

데이터명: SessionEvent
수집 목적: 세션 안에서 발생한 개별 도메인 이벤트를 시간순으로 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | WorkEvent, QAEvent, CheckEvent, AgentRunEvent가 발생하면 SessionEvent로 기록한다. |
| 전송 | 각 서비스에서 SessionEventIngestService로 전달한다. |
| 저장 | SessionEventLog 하위 엔티티로 저장한다. |
| 처리 | 이벤트 유형, 발생 시각, 출처, payload를 표준 구조로 정규화한다. |
| 활용 | 세션 이벤트 탐색, Agent 실행 로그, Check History 조회에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | SessionEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | SessionEventLog 파기 시 함께 삭제한다. |

### 9.3 BehaviorEventLog

데이터명: BehaviorEventLog
수집 목적: 가이드라인 화면의 조회, 클릭, 에셋 다운로드, 구간 체류를 저장한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Worker 또는 Manager가 가이드라인 화면을 탐색하면 PageViewEvent, ClickEvent, AssetDownloadEvent, SectionDwellEvent, CustomEvent를 수집한다. |
| 전송 | 화면 이벤트는 Umami `track`, `identify` 또는 BehaviorEventIngestService로 전달한다. |
| 저장 | 초기에는 Umami와 Payload collection을 함께 사용할 수 있다. 필요 시 별도 사용 기록 저장소로 분리한다. |
| 처리 | PageRef, ElementRef, Duration, SessionData를 공통 속성으로 연결한다. |
| 활용 | 화면 행동 기록 조회, 자주 본 기준 탐지, 자주 다운로드한 에셋 탐지에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | 분석 기간과 운영 조회 요구에 맞춰 보관한다. |
| 파기 | 보관 기간 종료 후 삭제하거나 SessionData에서 식별 가능한 값을 제거한다. |

### 9.4 PageViewEvent

데이터명: PageViewEvent
수집 목적: 가이드라인 페이지 조회 여부와 조회 시점을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 GuidelinePage를 열면 화면 이벤트로 생성한다. |
| 전송 | 클라이언트에서 Umami 또는 BehaviorEventIngestService로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장한다. |
| 처리 | PageRef, SessionData, OccurredAt을 연결한다. |
| 활용 | 자주 조회된 기준과 탐색 흐름 분석에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.5 ClickEvent

데이터명: ClickEvent
수집 목적: 가이드라인 화면에서 사용자가 누른 요소를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 버튼, 링크, 탭, 필터를 클릭하면 생성한다. |
| 전송 | 클라이언트에서 Umami 또는 BehaviorEventIngestService로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장한다. |
| 처리 | ElementRef, PageRef, SessionData를 연결한다. |
| 활용 | 탐색 병목과 자주 찾는 기준 분석에 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.6 AssetDownloadEvent

데이터명: AssetDownloadEvent
수집 목적: 공식 에셋 다운로드 횟수와 사용 맥락을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 BrandAssetVersion을 다운로드하면 생성한다. |
| 전송 | 다운로드 요청 처리 후 BehaviorEventIngestService 또는 Umami로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 BrandAssetVersionRef를 연결한다. |
| 처리 | PageRef, AssetRef, SessionData를 연결한다. |
| 활용 | 자주 사용하는 에셋과 보강이 필요한 에셋 안내를 찾는 데 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.7 SectionDwellEvent

데이터명: SectionDwellEvent
수집 목적: 가이드라인 화면의 특정 구간 체류 시간을 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 사용자가 페이지 특정 구간에 머문 시간이 기준을 넘으면 생성한다. |
| 전송 | 클라이언트에서 Umami 또는 BehaviorEventIngestService로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 Duration을 보관한다. |
| 처리 | PageRef, SectionRef, Duration, SessionData를 연결한다. |
| 활용 | 이해하기 어려운 기준이나 오래 읽는 구간을 찾는 데 사용한다. |
| 공유·제공 | 운영 인사이트에는 Evidence 참조로 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

### 9.8 CustomEvent

데이터명: CustomEvent
수집 목적: 기본 이벤트로 표현하기 어려운 화면별 분석 이벤트를 기록한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 특정 화면에서 별도 분석이 필요한 행동이 발생하면 생성한다. |
| 전송 | 클라이언트 또는 서버에서 BehaviorEventIngestService로 전송한다. |
| 저장 | BehaviorEventLog 하위 이벤트로 저장하고 EventPayload를 보관한다. |
| 처리 | 이벤트 이름, PageRef, SessionData, payload 스키마를 검증한다. |
| 활용 | 실험적 분석이나 화면별 운영 지표에 사용한다. |
| 공유·제공 | 운영 인사이트에는 검증된 이벤트만 Evidence 참조로 제공한다. |
| 보관 | BehaviorEventLog 보관 기간에 맞춰 보관한다. |
| 파기 | BehaviorEventLog 파기 시 함께 삭제한다. |

## 10. 운영 인사이트

### 10.1 Evidence

데이터명: Evidence
수집 목적: 질문, 점검 결과, 사용 기록, 도메인 이벤트를 인사이트 근거로 참조한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | InsightDiscoveryService가 분석 대상 기록을 찾으면 Evidence를 생성한다. |
| 전송 | 사용 기록 조회 결과와 도메인 이벤트 참조가 인사이트 도출 서비스로 전달된다. |
| 저장 | 원본 데이터를 복제하지 않고 SourceRef와 Evidence 유형을 저장한다. |
| 처리 | 질문, 위반, 검수 실패, 조회 행동 같은 근거를 같은 문제 단위로 묶는다. |
| 활용 | Pattern 생성과 Insight 설명 근거에 사용한다. |
| 공유·제공 | Manager 화면에는 원본으로 이동할 수 있는 범위의 근거만 제공한다. |
| 보관 | 관련 Insight와 InsightReport가 유효한 동안 보관한다. |
| 파기 | 원본 기록이 파기되면 Evidence의 원본 참조도 제거하거나 익명화한다. |

### 10.2 Pattern

데이터명: Pattern
수집 목적: 여러 Evidence에서 반복되는 질문, 위반, 탐색 행동을 묶는다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | 반복 기준을 만족한 Evidence 묶음이 발견되면 Pattern을 생성한다. |
| 전송 | Evidence 묶음과 반복 기준은 InsightDiscoveryService로 전달된다. |
| 저장 | PatternType, 반복 횟수, 관련 Evidence 참조를 저장한다. |
| 처리 | Agent가 대표 설명을 붙이고 System이 영향 범위를 계산한다. |
| 활용 | Insight 생성의 입력으로 사용한다. |
| 공유·제공 | Manager에게는 Insight 안에서 요약된 형태로 제공한다. |
| 보관 | 관련 Insight가 유지되는 동안 보관한다. |
| 파기 | 관련 Insight가 dismissed되고 보관 기간이 끝나면 삭제한다. |

### 10.3 Insight

데이터명: Insight
수집 목적: Manager가 판단할 수 있는 개선 근거를 만든다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | Pattern이 분석되면 System이 Insight를 생성한다. |
| 전송 | Pattern, Evidence, Agent 요약은 InsightDiscoveryService로 전달된다. |
| 저장 | InsightStatus, ExpectedImpact, Pattern 참조, AgentRunRef를 저장한다. |
| 처리 | detected, analyzed, reviewed, accepted, dismissed 같은 상태를 관리한다. |
| 활용 | Manager가 기준, 규칙, 에셋, 템플릿, 플러그인 개선 여부를 판단하는 데 사용한다. |
| 공유·제공 | InsightReport의 ReportSection에 포함해 제공한다. |
| 보관 | 후속 관찰과 개선 효과 비교에 필요한 기간 보관한다. |
| 파기 | dismissed 상태로 보관 기간이 끝나면 삭제하거나 통계만 남긴다. |

### 10.4 ReportSection

데이터명: ReportSection
수집 목적: Insight를 반복 질문, 반복 위반, 자원 사용 같은 관점으로 묶는다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System이 Insight 목록을 보고 섹션 기준에 맞게 ReportSection을 생성한다. |
| 전송 | Insight 목록과 섹션 기준은 InsightReportService로 전달된다. |
| 저장 | InsightReport 하위 엔티티로 저장하고 포함된 Insight 참조를 보관한다. |
| 처리 | 섹션 제목, 정렬 순서, 요약 설명을 관리한다. |
| 활용 | Manager가 보고서에서 문제 유형별로 Insight를 탐색하는 데 사용한다. |
| 공유·제공 | Manager 화면에 InsightReport의 일부로 제공한다. |
| 보관 | InsightReport와 같은 기간 보관한다. |
| 파기 | InsightReport 파기 시 함께 삭제한다. |

### 10.5 InsightReport

데이터명: InsightReport
수집 목적: 여러 ReportSection과 개선 방향을 기간과 독자 기준으로 묶어 제공한다.

| 단계 | 작성 내용 |
| --- | --- |
| 생성·수집 | System이 기간, 대상 독자, ReportSection 목록을 기준으로 InsightReport를 생성한다. |
| 전송 | 보고서 생성 요청은 InsightReportService로 전달된다. |
| 저장 | ReportPeriod, ReportAudience, ReportSection 목록, 발행 상태를 저장한다. |
| 처리 | 보고서 발행, Manager 검토, Insight 채택 또는 제외 이벤트를 연결한다. |
| 활용 | Manager가 개선 후보를 검토하고 후속 작업을 결정하는 데 사용한다. |
| 공유·제공 | Manager 화면에 제공하고 조회 기록은 BehaviorEventLog로 남긴다. |
| 보관 | 개선 효과 추적 기간 동안 보관한다. |
| 파기 | 보관 기간 종료 후 삭제한다. 채택된 Insight의 후속 추적 데이터는 별도 정책에 따라 보관한다. |

## 11. 설계 원칙

- live Version이 아닌 기준은 Worker 화면과 Agent 답변 근거에서 제외합니다.
- Agent는 정책과 규칙을 직접 변경하지 않습니다.
- 사용 기록은 지원 서브도메인이며, 운영 인사이트는 필요한 기록을 Evidence로 참조합니다.
- CheckInputSnapshot은 검수 입력을 고정하고, CheckBasis는 검수 기준 버전을 고정합니다.
- CheckDecision은 하나의 최종 판정이고, 여러 CheckResult를 소유합니다.
- CheckResult는 필요한 경우 CheckRecommendation을 소유합니다.
- 불필요한 개인정보는 사용 기록에 남기지 않습니다.
