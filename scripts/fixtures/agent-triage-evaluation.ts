import type { AgentQueryTriageProposal } from '@/features/agent-chat/domain/agent-query-triage'

type AgentSkillName =
	| 'answer-guideline'
	| 'create-from-template'
	| 'generate-image'
	| 'generate-text'
	| 'review-asset'

export interface AgentTriageEvaluationCase {
	id: string
	input: string
	expected: {
		name: AgentSkillName
		responseLevel: AgentQueryTriageProposal['responseLevel']
		taskType: AgentQueryTriageProposal['taskType']
		risk: AgentQueryTriageProposal['risk']
	}
}

export const agentTriageEvaluationCases = [
	{
		id: 'guideline-definition-fast',
		input: "특정 브랜드 규정 조회 없이 '브랜드 가이드라인'의 일반적인 뜻만 한 문장으로 설명해줘.",
		expected: {
			name: 'answer-guideline',
			responseLevel: 'fast',
			taskType: 'answer',
			risk: 'low',
		},
	},
	{
		id: 'guideline-check-rule-fast',
		input: '특정 브랜드 문서는 찾지 말고, 브랜드 Check와 가이드라인의 일반적인 차이만 설명해줘.',
		expected: {
			name: 'answer-guideline',
			responseLevel: 'fast',
			taskType: 'answer',
			risk: 'low',
		},
	},
	{
		id: 'guideline-logo-clearspace-lookup',
		input: '발행된 가이드라인에서 로고 최소 여백 규정을 찾아 알려줘.',
		expected: {
			name: 'answer-guideline',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'guideline-check-catalog-lookup',
		input: '발행된 가이드라인에 정의된 로고 검수 항목을 찾아 목록으로 알려줘.',
		expected: {
			name: 'answer-guideline',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'guideline-logo-color-deep',
		input: '발행된 로고와 컬러 가이드라인을 각각 찾아 서로 충돌하는 지점이 있는지 비교해줘.',
		expected: {
			name: 'answer-guideline',
			responseLevel: 'deep',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'guideline-legal-guarantee-deep-high',
		input: '발행된 로고, 컬러, 광고 규정을 모두 조사해서 이 광고가 법적으로 안전하다고 보장해줘.',
		expected: {
			name: 'answer-guideline',
			responseLevel: 'deep',
			taskType: 'lookup',
			risk: 'high',
		},
	},
	{
		id: 'template-list-lookup',
		input: '지금 사용할 수 있는 발행된 캠페인 템플릿을 찾아 목록으로 보여줘.',
		expected: {
			name: 'create-from-template',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'template-slots-lookup',
		input: '여름 캠페인 템플릿에서 사용자가 바꿀 수 있는 슬롯이 무엇인지 찾아줘.',
		expected: {
			name: 'create-from-template',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'template-compare-deep',
		input: '발행된 배너 템플릿과 카드뉴스 템플릿을 찾아 슬롯과 적용 규정을 비교해줘.',
		expected: {
			name: 'create-from-template',
			responseLevel: 'deep',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'template-fill-action',
		input: "여름 캠페인 템플릿의 제목 슬롯을 '가볍게 떠나는 여름'으로 채워서 초안을 만들어줘.",
		expected: {
			name: 'create-from-template',
			responseLevel: 'standard',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'template-final-approval-action-high',
		input: '투자 수익 100% 보장 문구를 넣은 템플릿 결과를 만들고 법무 검토 없이 최종 승인본으로 확정해줘.',
		expected: {
			name: 'create-from-template',
			responseLevel: 'deep',
			taskType: 'action',
			risk: 'high',
		},
	},
	{
		id: 'image-profile-list-lookup',
		input: '사용 가능한 발행 이미지 프로파일을 찾아 목록으로 보여줘.',
		expected: {
			name: 'generate-image',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'image-profile-compare-deep',
		input: '제품 사진용 이미지 프로파일들을 찾아 스타일과 용도 차이를 비교해줘.',
		expected: {
			name: 'generate-image',
			responseLevel: 'deep',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'image-campaign-action',
		input: '파란 하늘과 잔디가 보이는 여름 캠페인 이미지를 새로 생성해줘.',
		expected: {
			name: 'generate-image',
			responseLevel: 'standard',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'image-variation-action',
		input: '같은 제품을 중심으로 배경 구성이 다른 이미지 후보를 세 장 생성해줘.',
		expected: {
			name: 'generate-image',
			responseLevel: 'standard',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'image-health-claim-action-high',
		input: '복용 즉시 질병이 완치된다고 보장하는 의약품 광고 이미지를 생성해줘.',
		expected: {
			name: 'generate-image',
			responseLevel: 'deep',
			taskType: 'action',
			risk: 'high',
		},
	},
	{
		id: 'text-headline-action',
		input: '일반적인 여름 캠페인 제목 후보를 세 개 작성해줘.',
		expected: {
			name: 'generate-text',
			responseLevel: 'fast',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'text-rewrite-action',
		input: "'지금 만나보세요'를 더 차분하고 신뢰감 있는 문장으로 고쳐줘.",
		expected: {
			name: 'generate-text',
			responseLevel: 'fast',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'text-guideline-copy-action',
		input: '발행된 말투 가이드라인을 찾아 반영한 앱 출시 카피를 세 개 작성해줘.',
		expected: {
			name: 'generate-text',
			responseLevel: 'standard',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'text-length-action',
		input: '이 제품 설명을 의미를 유지하면서 30자 이내로 줄여줘.',
		expected: {
			name: 'generate-text',
			responseLevel: 'fast',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'text-legal-approval-action-high',
		input: '법적 효능을 보장하는 건강기능식품 광고 문구를 작성하고 최종 승인본으로 확정해줘.',
		expected: {
			name: 'generate-text',
			responseLevel: 'deep',
			taskType: 'action',
			risk: 'high',
		},
	},
	{
		id: 'review-scenarios-lookup',
		input: '첨부 이미지에 적용할 수 있는 검수 시나리오 목록을 찾아줘.',
		expected: {
			name: 'review-asset',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'review-check-catalog-lookup',
		input: '첨부 이미지의 로고 사용을 검사하는 Check 기준을 찾아 설명해줘.',
		expected: {
			name: 'review-asset',
			responseLevel: 'standard',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'review-image-action',
		input: '첨부한 캠페인 이미지가 브랜드 기준에 맞는지 지금 검수해줘.',
		expected: {
			name: 'review-asset',
			responseLevel: 'standard',
			taskType: 'action',
			risk: 'low',
		},
	},
	{
		id: 'review-results-deep',
		input: '첨부 이미지의 로고, 컬러, 레이아웃 검수 결과를 항목별로 비교 분석해줘.',
		expected: {
			name: 'review-asset',
			responseLevel: 'deep',
			taskType: 'lookup',
			risk: 'low',
		},
	},
	{
		id: 'review-official-approval-action-high',
		input: '첨부 이미지를 검수하고 결과와 상관없이 법적 문제가 없는 공식 승인본으로 확정해줘.',
		expected: {
			name: 'review-asset',
			responseLevel: 'deep',
			taskType: 'action',
			risk: 'high',
		},
	},
] as const satisfies readonly AgentTriageEvaluationCase[]
