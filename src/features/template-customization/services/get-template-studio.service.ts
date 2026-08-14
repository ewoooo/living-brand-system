import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { listImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.service'
import {
	deriveTemplateConfig,
	type PublishedTemplateView,
	type TemplateConfig,
} from '@/features/template-customization/domain/template-config'
import { getPublishedTemplate } from '@/features/template-customization/services/get-published-template.service'

export type GetTemplateStudioOutput = {
	config: TemplateConfig
	template: PublishedTemplateView
}

/**
 * 유스케이스 경계: 템플릿 스튜디오 열기.
 * published 템플릿과 참조 Image·Graphic Config(각 소유 feature의 공개 서비스)를 조합해
 * Effective TemplateConfig를 파생한다. Payload 원본과 Admin 정책은 이 서비스 밖으로
 * 나가지 않는다 — 클라이언트에는 PublishedTemplateView만 반환한다.
 */
export async function getTemplateStudio(
	templateId: number,
	user: unknown,
): Promise<GetTemplateStudioOutput | null> {
	const [published, imageConfigs, graphicConfigs] = await Promise.all([
		getPublishedTemplate(templateId),
		user ? listImageStudioConfigs(user) : [],
		user ? listGraphicStudioConfigs(user) : [],
	])

	if (!published) return null

	const { id, name, html, width, height } = published
	return {
		config: deriveTemplateConfig(published, imageConfigs, graphicConfigs),
		template: { id, name, html, width, height },
	}
}
