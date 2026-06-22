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
 ├── [서브도메인] 가이드라인 관리
 ├── [서브도메인] 제작 관리
 ├── [서브도메인] 품질 검수
 └── [서브도메인] 운영 인사이트
```

브랜드 운영 시스템은 가이드라인을 문서로 보관하는 시스템이 아니라, 기준을 구조화하고, 산출물 제작과 품질 검수를 거쳐, 사용 기록을 다시 개선 근거로 연결하는 시스템입니다.

## 4. 가이드라인 관리

가이드라인 관리는 기준과 공식 에셋을 구조화하고 발행하는 서브도메인입니다.
GuidelineRule은 Guideline 내부 엔티티가 아니라 독립 애그리거트(관리 단위)입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 가이드라인 관리
      ├── [바운디드 컨텍스트] 기준 편집/발행
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): Guideline
      │         │    ├── 엔티티: Guideline, GuidelineSection, GuidelinePage
      │         │    └── 값 객체: GuidelineVersion, PublishStatus, DisplayOrder
      │         ├── 애그리거트(관리 단위): GuidelineRule
      │         │    ├── 엔티티: GuidelineRule
      │         │    └── 값 객체: RuleType, Severity, RuleCondition
      │         ├── 도메인 서비스: GuidelinePublishService
      │         └── 도메인 이벤트: GuidelinePublished, GuidelineRuleChanged
      ├── [바운디드 컨텍스트] 에셋 편집/발행
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): BrandAsset
      │         │    ├── 엔티티: BrandAsset, AssetFile
      │         │    └── 값 객체: AssetType, AssetVersion, PublishStatus
      │         ├── 도메인 서비스: AssetPublishService
      │         └── 도메인 이벤트: AssetPublished, AssetChanged
      └── [바운디드 컨텍스트] 기준 변경 이력
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): GuidelineChange
                ├── 값 객체: ChangeReason, ChangedField
                └── 도메인 이벤트: GuidelineChangeRecorded
```

Guideline은 사용자가 읽는 가이드라인 구조를 관리합니다.
GuidelineSection은 Guideline의 상위 장이고, GuidelinePage는 실제 화면이나 문서에서 읽는 단위입니다.

GuidelineRule은 점검, 검토 코멘트, Agent 답변, 운영 인사이트에서 직접 참조하는 판단 기준입니다.
따라서 GuidelinePage 안의 하위 엔티티로 묶지 않고 독립 애그리거트(관리 단위)로 관리합니다.

BrandAsset은 로고, 이미지, 템플릿 파일처럼 공식으로 배포되는 브랜드 자산입니다.
GuidelinePage와 GuidelineRule은 BrandAsset을 참조할 수 있지만, 에셋의 파일 교체와 발행 상태는 BrandAsset이 관리합니다.

## 5. 제작 관리

제작 관리는 Worker가 산출물을 만들고 제출 가능한 형태로 구성하는 서브도메인입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 제작 관리
      └── [바운디드 컨텍스트] 산출물 제작
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): Work
                │    ├── 엔티티: Work, WorkInput, WorkAsset
                │    └── 값 객체: ApplicationType, TemplateRef, WorkStatus
                ├── 애그리거트(관리 단위): WorkSubmission
                │    ├── 엔티티: WorkSubmission
                │    └── 값 객체: SubmittedContent, GuidelineSnapshot, SubmissionStatus
                └── 도메인 이벤트: WorkStarted, WorkSubmitted
```

Work는 Worker가 산출물을 만들기 시작한 작업 단위입니다.
WorkSubmission은 제출 당시 GuidelineSnapshot을 보존합니다.

## 6. 품질 검수

품질 검수는 WorkSubmission이 기준에 맞는지 점검하고, 질문과 검토 피드백을 기준에 연결하는 서브도메인입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 품질 검수
      ├── [바운디드 컨텍스트] 질의응답
      │    └── [도메인 모델]
      │         ├── 애그리거트(관리 단위): QASession
      │         │    ├── 엔티티: Question, Answer
      │         │    └── 값 객체: AnswerCitation, AnswerConfidence
      │         └── 도메인 이벤트: QuestionAsked, AnswerProvided
      └── [바운디드 컨텍스트] 제출물 검수
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): CheckRun
                │    ├── 엔티티: CheckRun, CheckResult
                │    └── 값 객체: CheckOutcome, Violation, Recommendation
                ├── 애그리거트(관리 단위): Review
                │    ├── 엔티티: Review, ReviewComment
                │    └── 값 객체: ReviewDecision, RejectionReason
                └── 도메인 이벤트: CheckCompleted, ReviewCompleted
```

Question과 Answer는 각각 독립 애그리거트(관리 단위)로 보지 않습니다.
질문 삭제, 질문 수정, 질문 종료는 Answer와 함께 움직일 가능성이 높으므로 QASession 애그리거트(관리 단위) 안에서 관리합니다.

CheckResult와 ReviewComment는 가능하면 GuidelineRule을 참조합니다.
Agent와 System은 점검과 설명을 보조할 수 있지만, 승인, 반려, 수정 요청의 최종 결정은 Manager가 합니다.

## 7. 운영 인사이트

운영 인사이트는 품질 검수에서 생긴 질문, 점검 실패, 반려 사유, 사용 행동을 분석해 개선 근거를 만드는 서브도메인입니다.

```text
[도메인] 브랜드 운영 시스템
 └── [서브도메인] 운영 인사이트
      └── [바운디드 컨텍스트] 인사이트 도출
           └── [도메인 모델]
                ├── 애그리거트(관리 단위): Insight
                │    ├── 엔티티: Insight, Evidence, Pattern, Proposal
                │    └── 값 객체: InsightStatus, PatternType, ExpectedImpact
                ├── 도메인 서비스: InsightDiscoveryService
                └── 도메인 이벤트: InsightDiscovered, ProposalAccepted
```

Insight는 반복 패턴, 근거, 개선 제안을 하나의 흐름으로 묶은 분석 결과물입니다.
Proposal은 채택되어야 가이드라인 관리에서 실제 Guideline 또는 GuidelineRule 변경으로 반영됩니다.

## 8. 핵심 관계

```mermaid
flowchart LR
  Guideline["Guideline"]
  Section["GuidelineSection"]
  Page["GuidelinePage"]
  Rule["GuidelineRule"]
  Asset["BrandAsset"]
  Work["Work"]
  QASession["QASession"]
  Question["Question"]
  Answer["Answer"]
  Submission["WorkSubmission"]
  CheckRun["CheckRun"]
  CheckResult["CheckResult"]
  Review["Review"]
  Comment["ReviewComment"]
  Insight["Insight"]
  Evidence["Evidence"]
  Pattern["Pattern"]
  Proposal["Proposal"]

  Guideline --> Section
  Section --> Page
  Page -->|"관련 규칙"| Rule
  Page -->|"참조"| Asset
  Rule -->|"참조"| Asset
  Work --> QASession
  QASession --> Question
  QASession --> Answer
  Question --> Answer
  Answer -->|"근거"| Rule
  Work --> Submission
  Submission -->|"스냅샷 보존"| Guideline
  CheckRun --> CheckResult
  CheckResult --> Submission
  CheckResult --> Rule
  Review --> Submission
  Review --> Comment
  Comment --> Rule
  CheckResult --> Evidence
  Comment --> Evidence
  Evidence --> Insight
  Insight --> Pattern
  Insight --> Proposal
  Proposal -->|"채택 시 변경"| Rule
```

## 9. 설계 원칙

- GuidelinePage는 읽기 단위이고, GuidelineRule은 판단 단위입니다.
- GuidelineRule은 독립 애그리거트(관리 단위)로 관리합니다.
- QASession은 Question과 Answer를 함께 관리하는 애그리거트(관리 단위)입니다.
- Answer, CheckResult, ReviewComment는 GuidelineRule을 근거로 참조할 수 있어야 합니다.
- WorkSubmission은 제출 당시 GuidelineSnapshot을 보존합니다.
- Review는 Manager의 최종 판단 기록입니다.
- Insight는 Evidence, Pattern, Proposal을 함께 관리하는 분석 결과물입니다.
- Proposal은 자동으로 기준을 바꾸지 않습니다.
- Published 상태가 아닌 기준은 Worker 화면과 점검 기준에서 제외합니다.
