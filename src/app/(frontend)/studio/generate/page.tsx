import { StudioWorkspacePage } from '@/components/studio/studio-workspace'
import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { listAvailableImageProfiles } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

// 생성 표면: 컨트롤러와 결과 캔버스만 소유하고, 생성 실행은 image-generation feature가 담당한다.
export default async function GeneratePage() {
	const { user } = await authenticateRequest()
	const imageProfiles = user ? await listAvailableImageProfiles(user) : []

	return (
		<StudioWorkspacePage
			title="이미지 생성"
			description="프롬프트와 이미지 프로파일을 조합해 브랜드 이미지 후보를 만듭니다."
		>
			<ImageGenerator profiles={imageProfiles} />
		</StudioWorkspacePage>
	)
}
