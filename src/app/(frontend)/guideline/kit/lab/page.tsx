import { notFound } from 'next/navigation'
import { ContentFrame } from '@/components/global/content-frame'

export const dynamic = 'force-dynamic'

/** 개발 중인 UI Kit 프로토타입 랩은 production 공개 경로에서 실행하지 않는다. */
export default async function GuidelineKitLabPage() {
	if (process.env.NODE_ENV !== 'development') notFound()

	const { GuidelineKitLabGallery } = await import(
		'@/features/guideline/components/kit/lab-gallery'
	)
	return (
		<ContentFrame>
			<GuidelineKitLabGallery />
		</ContentFrame>
	)
}
