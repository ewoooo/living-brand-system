import { ImageGenerator } from '@/components/studio/generate/image-generator'
import { StudioWorkspacePage } from '@/components/studio/studio-workspace'
import { listPublishedImageProfiles } from '@/features/generate-image/repositories/image-profile.payload.repository'
import { authenticateRequest } from '@/lib/request-auth'

// 생성 표면: 컨트롤러와 결과 캔버스만 소유하고, 생성 실행은 generate-image feature가 담당한다.
export default async function GenerateImagePage() {
	const { user } = await authenticateRequest()
	const imageProfiles = user ? await listPublishedImageProfiles(user) : []

	return (
		<StudioWorkspacePage
			title="이미지 생성"
			description="프롬프트와 이미지 프로파일을 조합해 브랜드 이미지 후보를 만듭니다."
		>
			<ImageGenerator profiles={imageProfiles} />
		</StudioWorkspacePage>
	)
}
