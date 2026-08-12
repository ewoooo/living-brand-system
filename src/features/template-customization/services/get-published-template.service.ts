import { parsePrintPpi } from '@/features/studio-export/print-policy'
import { projectTemplateRenderModel } from '@/features/template-core/domain/project-template-render-model'
import { findPublishedTemplate } from '@/features/template-core/repositories/published-template.payload.repository'
import type {
	PublishedHtmlTemplate,
	PublishedTemplateNodeConfig,
} from '@/features/template-customization/domain/template-config'
import type { TemplateNodeConfigMap } from '@/types/template'

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
