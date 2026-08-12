import { type PrintPpi, parsePrintPpi } from '@/features/template-export/print-policy'
import { findPublishedTemplate } from '@/repositories/published-template.payload.repository'
import { projectTemplateRenderModel } from '@/services/project-template-render-model.service'
import type { TemplateNodeConfig, TemplateNodeConfigMap } from '@/types/template'

/**
 * 스튜디오 SSR에 노출해도 되는 노드 설정 부분집합.
 * input은 제작자 내부 AI 지침(aiInstruction)을 뺀 슬롯 스펙이다.
 */
export interface PublishedTemplateNodeConfig {
	input?: Omit<NonNullable<TemplateNodeConfig['input']>, 'aiInstruction'>
	imageInput?: TemplateNodeConfig['imageInput']
	imageColorize?: TemplateNodeConfig['imageColorize']
}

export interface PublishedHtmlTemplate {
	kind: 'html'
	id: number
	name: string
	html: string
	// 스튜디오가 쓰는 필드만 남긴 노드 오버라이드 — 전체 TemplateNodeConfigMap을 다시 노출하지 말 것.
	nodeConfigs: Record<string, PublishedTemplateNodeConfig>
	width: number
	height: number
	printPpi?: PrintPpi
	templateVersion: string
	/** Payload 저작형. TemplateConfig projection이 공통 Controller Definition으로 정규화한다. */
	controller?: unknown
	controllerOverride?: unknown
	output?: { allowedFormats?: readonly string[] | null } | null
}

// 노출 경계: 스튜디오가 쓰는 input(aiInstruction 제외)·imageInput·imageColorize만 남긴다.
// aiInstruction·vectorAsset·generatedImageId 등 저작 내부 정보는 SSR 페이로드에 싣지 않는다.
// agent/MCP 경로(projectTemplateRenderModel 직행)는 의도적으로 전체 config를 쓴다 — 이 프로젝션을
// "안전한 투영"으로 오독해 새 공개 표면에 renderModel을 그대로 태우지 말 것.
function projectStudioNodeConfigs(
	nodeConfigs: TemplateNodeConfigMap,
): Record<string, PublishedTemplateNodeConfig> {
	const projected: Record<string, PublishedTemplateNodeConfig> = {}
	for (const [nodeId, { input, imageInput, imageColorize }] of Object.entries(nodeConfigs)) {
		if (!input && !imageInput && !imageColorize) continue
		const config: PublishedTemplateNodeConfig = {}
		if (input) {
			const { aiInstruction: _internal, ...studioInput } = input
			config.input = studioInput
		}
		if (imageInput) config.imageInput = imageInput
		if (imageColorize) config.imageColorize = imageColorize
		projected[nodeId] = config
	}
	return projected
}

/**
 * Create 화면이 쓰는 published 템플릿 단건 read service.
 * Payload 조회는 published-template repository가 소유한다.
 * 읽기 계약: 렌더 가능한 canonical HTML이 아니면 노출하지 않고,
 * nodeConfigs는 projectStudioNodeConfigs가 남긴 스튜디오용 부분집합만 노출한다.
 */
export async function getPublishedTemplate(
	templateId: number,
): Promise<PublishedHtmlTemplate | null> {
	const template = await findPublishedTemplate(templateId)

	if (!template) {
		return null
	}

	const renderModel = projectTemplateRenderModel(template)

	if (!renderModel) return null

	return {
		kind: 'html',
		id: template.id,
		name: template.name,
		printPpi: parsePrintPpi(template.printPpi),
		templateVersion: template.updatedAt,
		controller: template.controller,
		controllerOverride: template.controllerOverride,
		output: template.output,
		...renderModel,
		nodeConfigs: projectStudioNodeConfigs(renderModel.nodeConfigs),
	}
}
