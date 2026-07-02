import { AssetGenerator } from '@/features/asset-generation/components/asset-generator'
import { getPublishedTemplates } from '@/features/asset-generation/services/get-published-templates.service'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default async function CreatePage() {
	const templates = await getPublishedTemplates()

	return (
		<article className="min-h-full p-8">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
				<div>
					<h1>Create</h1>
					<p>발행된 템플릿의 열린 슬롯만 바꿔 산출물을 만듭니다.</p>
				</div>
				<AssetGenerator templates={templates} />
			</div>
		</article>
	)
}
