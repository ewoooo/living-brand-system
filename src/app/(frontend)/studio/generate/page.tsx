import { PageHeader } from '@/components/global/page-header'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { listAvailableImageProfiles } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

// 생성 표면: 컨트롤러와 결과 캔버스만 소유하고, 생성 실행은 image-generation feature가 담당한다.
export default async function GeneratePage() {
	const { user } = await authenticateRequest()
	const imageProfiles = user ? await listAvailableImageProfiles(user) : []

	return (
		<GuidelineContentFrame
			variant="full"
			className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] py-0"
		>
			<PageHeader
				title="이미지 생성"
				description="프롬프트와 이미지 프로파일을 조합해 브랜드 이미지 후보를 만듭니다."
				className="px-4 py-6 md:px-8"
			/>
			<ImageGenerator profiles={imageProfiles} />
		</GuidelineContentFrame>
	)
}
