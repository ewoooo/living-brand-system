import {
	inspectPublishedTemplateHtml,
	parseTemplateNodeConfigs,
} from '@/services/inspect-template-html.service'
import type { TemplateNodeConfigMap } from '@/types/template'

interface TemplateRenderCandidate {
	html?: string | null
	overrides?: unknown
	width?: number | null
	height?: number | null
}

export interface TemplateRenderModel {
	html: string
	nodeConfigs: TemplateNodeConfigMap
	width: number
	height: number
}

/**
 * published Template 레코드를 Create·Export·Agent가 공유하는 안전한 render model로 투영한다.
 * 외부 I/O는 없으며 원본 Template 조회는 호출 feature의 repository가 소유한다.
 */
export function projectTemplateRenderModel(
	template: TemplateRenderCandidate,
): TemplateRenderModel | null {
	if (
		typeof template.html !== 'string' ||
		template.html.trim() === '' ||
		typeof template.width !== 'number' ||
		template.width <= 0 ||
		typeof template.height !== 'number' ||
		template.height <= 0
	) {
		return null
	}

	const nodeConfigs = parseTemplateNodeConfigs(template.overrides)
	if ('blocker' in nodeConfigs) return null

	const inspection = inspectPublishedTemplateHtml({
		html: template.html,
		overrideNodeIds: Object.keys(nodeConfigs.data),
		refsByNode: nodeConfigs.refsByNode,
	})
	if (inspection.blocker) return null

	return {
		html: template.html,
		nodeConfigs: nodeConfigs.data,
		width: template.width,
		height: template.height,
	}
}
