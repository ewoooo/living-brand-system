import { ImageGenerator } from '@/components/studio/image/image-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.service'
import { authenticateRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

// 생성 표면: 컨트롤러와 결과 캔버스만 소유하고, 생성 실행은 generate-image feature가 담당한다.
export default async function GenerateImagePage() {
	const { user } = await authenticateRequest()
	const configs = user ? await listImageStudioConfigs(user) : []

	return (
		<StudioWorkspacePage
			title="이미지 생성"
			description="프롬프트와 이미지 프로파일을 조합해 브랜드 이미지 후보를 만듭니다."
			hideHeading
		>
			<ImageGenerator configs={configs} />
		</StudioWorkspacePage>
	)
}
