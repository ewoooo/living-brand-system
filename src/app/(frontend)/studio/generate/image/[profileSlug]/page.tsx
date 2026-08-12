import { notFound } from 'next/navigation'
import { ImageGenerator } from '@/components/studio/image/image-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.service'
import { authenticateRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

export default async function GenerateImageProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	const { user } = await authenticateRequest()

	if (!user) notFound()

	const configs = await listImageStudioConfigs(user)
	const config = configs.find((item) => item.image.slug === profileSlug)

	if (!config) notFound()

	return (
		<StudioWorkspacePage
			title={config.name}
			description="선택한 이미지 프로파일을 적용해 브랜드 이미지 후보를 만듭니다."
			hideHeading
		>
			{/* 슬러그는 시작 프로파일만 정한다 — 교체는 세션을 유지하려고 클라이언트에서 처리한다. */}
			<ImageGenerator configs={configs} initialProfileId={config.id} />
		</StudioWorkspacePage>
	)
}
