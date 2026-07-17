import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** 개발 중인 Guideline UI Kit POC는 production 공개 경로에서 실행하지 않는다. */
export default async function GuidelineKitPage() {
	if (process.env.NODE_ENV !== 'development') notFound()

	const { GuidelineKitGallery } = await import('@/features/guideline/components/kit/gallery')
	return <GuidelineKitGallery />
}
