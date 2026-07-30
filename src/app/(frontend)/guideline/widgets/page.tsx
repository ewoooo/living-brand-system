import { notFound } from 'next/navigation'
import { ContentFrame } from '@/components/shared/content-frame'

export const dynamic = 'force-dynamic'

export default async function GuidelineWidgetsPage() {
	if (process.env.NODE_ENV !== 'development') notFound()
	const { GuidelineWidgetGallery } = await import(
		'@/features/guideline/components/widgets/gallery'
	)
	return (
		<ContentFrame>
			<GuidelineWidgetGallery />
		</ContentFrame>
	)
}
