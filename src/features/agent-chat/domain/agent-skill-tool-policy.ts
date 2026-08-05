import { z } from 'zod'
import type { getAgentTools } from '@/agents/agent-chat-tools.agent'

/** loadSkill 입력 — Agent가 선택하는 skill 이름. */
export const agentSkillSelectionSchema = z.strictObject({
	name: z.string().trim().min(1).max(80),
})

const skillNameSchema = z.object({ name: z.string() })

/** tool 입력/출력에서 skill 이름만 느슨하게 읽는다. 이름이 없거나 문자열이 아니면 null. */
export function readSkillName(value: unknown): string | null {
	const parsed = skillNameSchema.safeParse(value)
	return parsed.success ? parsed.data.name : null
}

/** getAgentTools에 등록된 task tool 이름 — loadSkill은 skill 선택 전용이라 제외한다. */
type RegisteredTaskToolName = Exclude<keyof ReturnType<typeof getAgentTools>, 'loadSkill'>

/** 배열 output들의 항목 수 합. */
const sumArrayLengths = (outputs: unknown[]) =>
	outputs.reduce<number>((sum, output) => sum + (Array.isArray(output) ? output.length : 0), 0)
/** truthy output 개수. */
const countPresent = (outputs: unknown[]) => outputs.filter(Boolean).length
/** 개수가 있으면 결과 문구, 없으면 null. */
const markerText = (count: number, text: (count: number) => string) =>
	count > 0 ? text(count) : null

interface AgentToolRow {
	/** 이 tool을 허용하는 skill 이름 목록. */
	skills: readonly string[]
	/** tool output 목록으로 결과 문구를 만든다 — 만들 수 없으면 null. */
	resultText: (outputs: unknown[]) => string | null
	/**
	 * 결과 문구가 없을 때의 진행/완료 fallback 문구.
	 * when 'seen'은 tool part가 보이기만 해도, 'output-array'는 배열 output이 있을 때 발동한다.
	 */
	fallback?: {
		when: 'seen' | 'output-array'
		pending: string
		done: string
	}
}

/**
 * Task tool 단일 테이블 — tool 이름(키)·skill 허용·마커 문구를 한 곳이 소유한다.
 * 행 순서가 결과 문구 우선순위다(위가 먼저). fallback도 같은 순서로 훑지만
 * fallback을 가진 tool들은 서로 같은 skill에 없어 순서가 충돌하지 않는다.
 * getAgentTools에 task tool을 추가하면 여기 행이 없는 한 컴파일 에러가 난다.
 */
export const agentToolTable = {
	listGuidelineDocuments: {
		skills: ['answer-guideline'],
		resultText: (outputs) =>
			markerText(
				sumArrayLengths(outputs),
				(count) => `가이드라인 문서 ${count}개를 확인했습니다`,
			),
	},
	readGuidelineDocument: {
		skills: ['answer-guideline', 'generate-text'],
		resultText: (outputs) =>
			markerText(countPresent(outputs), (count) => `가이드라인 문서 ${count}개를 읽었습니다`),
	},
	searchGuidelines: {
		skills: ['answer-guideline', 'generate-text'],
		resultText: (outputs) =>
			markerText(
				sumArrayLengths(outputs),
				(count) => `가이드라인 결과 ${count}개를 찾았습니다`,
			),
		fallback: {
			when: 'output-array',
			pending: '가이드라인 결과 0개를 찾았습니다',
			done: '가이드라인 결과 0개를 찾았습니다',
		},
	},
	getCheckCatalog: {
		skills: ['answer-guideline', 'review-asset'],
		resultText: (outputs) =>
			markerText(
				sumArrayLengths(outputs),
				(count) => `Check 카탈로그 ${count}개를 확인했습니다`,
			),
	},
	listCheckScenarios: {
		skills: ['review-asset'],
		resultText: (outputs) =>
			markerText(
				sumArrayLengths(outputs),
				(count) => `검수 시나리오 ${count}개를 확인했습니다`,
			),
	},
	prepareTemplateImage: {
		skills: ['create-from-template'],
		resultText: (outputs) =>
			markerText(countPresent(outputs), (count) => `템플릿 이미지 ${count}개를 준비했습니다`),
	},
	runCheck: {
		skills: ['review-asset'],
		resultText: (outputs) =>
			markerText(
				outputs.filter(
					(output) =>
						typeof output === 'object' && output !== null && 'checkSessionId' in output,
				).length,
				(count) => `이미지 검수 ${count}건을 완료했습니다`,
			),
		fallback: {
			when: 'seen',
			pending: '이미지를 검수하고 있습니다',
			done: '이미지 검수를 완료했습니다',
		},
	},
	generateImage: {
		skills: ['generate-image'],
		resultText: (outputs) =>
			markerText(
				outputs.reduce<number>(
					(sum, output) =>
						sum +
						(typeof output === 'object' &&
						output !== null &&
						'images' in output &&
						Array.isArray(output.images)
							? output.images.length
							: 0),
					0,
				),
				(count) => `이미지 ${count}개를 생성했습니다`,
			),
		fallback: {
			when: 'seen',
			pending: '이미지를 생성하고 있습니다',
			done: '이미지 생성을 완료했습니다',
		},
	},
	listImageProfiles: {
		skills: ['generate-image'],
		resultText: (outputs) =>
			markerText(
				sumArrayLengths(outputs),
				(count) => `이미지 프로필 ${count}개를 확인했습니다`,
			),
	},
	findTemplatesForRequest: {
		skills: ['create-from-template'],
		resultText: (outputs) =>
			markerText(sumArrayLengths(outputs), (count) => `템플릿 ${count}개를 확인했습니다`),
		fallback: {
			when: 'output-array',
			pending: '템플릿을 찾고 있습니다',
			done: '템플릿 검색을 완료했습니다',
		},
	},
} satisfies Record<RegisteredTaskToolName, AgentToolRow>

export type AgentTaskToolName = keyof typeof agentToolTable

/** skill별 허용 tool 목록 — 테이블 각 행의 skills에서 계산한다 (행 순서 = skill 내 순서). */
const toolsBySkill: Record<string, AgentTaskToolName[]> = {}
for (const [name, row] of Object.entries(agentToolTable)) {
	for (const skill of row.skills) {
		toolsBySkill[skill] ??= []
		toolsBySkill[skill].push(name as AgentTaskToolName)
	}
}

export function getAgentExecutionPolicy(decision: { name: string }) {
	const tools = toolsBySkill[decision.name]

	return {
		activeTools: tools ? [...tools] : ([] as AgentTaskToolName[]),
		modelId: 'claude-sonnet-5',
	}
}
