import { PageHeader } from '@/components/global/page-header'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { listAvailableImageProfiles } from '@/features/image-generation/services/list-image-profiles.service'
import { TextGenerator } from '@/features/text-generation/components/text-generator'
import { authenticateRequest } from '@/lib/request-auth'

// 생성 표면: 이미지 생성 + 텍스트 생성을 수직으로 단순 배치한다. 두 feature는 각자 소유·독립.
export default async function GeneratePage() {
	const { user } = await authenticateRequest()
	const imageProfiles = user ? await listAvailableImageProfiles(user) : []

	return (
		<GuidelineContentFrame className="flex flex-col gap-12 py-10">
			<PageHeader eyebrow="생성하기" title="생성" />
			<div id="image" className="scroll-mt-8">
				<ImageGenerator profiles={imageProfiles} />
			</div>
			<hr className="border-border" />
			<div id="text" className="scroll-mt-8">
				<TextGenerator />
			</div>
		</GuidelineContentFrame>
	)
}
