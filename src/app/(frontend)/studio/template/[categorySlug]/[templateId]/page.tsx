import { notFound } from 'next/navigation'
import { TemplateSandbox } from '@/components/template-sandbox'
import { Typography } from '@/components/ui/typography'
import { AssetGenerator } from '@/features/asset-generation/components/asset-generator'
import { HtmlAssetGenerator } from '@/features/asset-generation/components/html-asset-generator'
import type { PublishedTemplate } from '@/features/asset-generation/services/get-published-template.service'
import { getPublishedTemplate } from '@/features/asset-generation/services/get-published-template.service'

export default async function CreateTemplatePage({
	params,
}: {
	params: Promise<{ categorySlug: string; templateId: string }>
}) {
	const { templateId } = await params
	const parsedId = Number(templateId)

	if (!Number.isInteger(parsedId)) {
		notFound()
	}

	const template = await getPublishedTemplate(parsedId)

	if (!template) {
		notFound()
	}

	return (
		<article>
			<Typography as="h1" className="mb-6" family="title" size="3xl">
				{template.name}
			</Typography>
			{renderTemplateBody(template)}
		</article>
	)
}

/**
 * 렌더 디스패치 (Create = 스펙트럼 호스트):
 * - html 있음    → HtmlAssetGenerator (Figma import 결과)
 * - code.js 있음 → TemplateSandbox (디자인 위에 템플릿 코드를 iframe 샌드박스에서 실행)
 * - 그 외        → AssetGenerator (절대좌표 디자인 + 슬롯 채우기)
 * key로 템플릿마다 강제 리마운트해 상태를 재초기화한다.
 */
function renderTemplateBody(template: PublishedTemplate) {
	if (template.kind === 'html') {
		return <HtmlAssetGenerator key={template.id} template={template} />
	}

	const t = template.jsonTemplate

	if (template.code) {
		return (
			<TemplateSandbox
				key={template.id}
				template={t}
				css={template.code.css}
				js={template.code.js}
				fileName={template.name}
			/>
		)
	}

	return <AssetGenerator key={template.id} template={template} />
}
