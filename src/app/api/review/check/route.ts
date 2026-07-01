import { getReviewSection } from '@/features/review/navigation'
import { runReviewService } from '@/services/run-review.service'

export const maxDuration = 30

/**
 * 검수 대상 이미지(FormData) + 섹션을 받아 해당 섹션 룰들의 검수 결과를 돌려준다.
 * 브라우저(review·create)가 부르는 통로. 검수 계산은 service가 소유한다.
 */
export async function POST(req: Request) {
	const form = await req.formData().catch(() => null)
	if (!form) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const file = form.get('image')
	const sectionSlug = form.get('section')
	if (!(file instanceof File) || typeof sectionSlug !== 'string') {
		return Response.json({ message: 'image, section are required.' }, { status: 400 })
	}

	const section = getReviewSection(sectionSlug)
	if (!section) {
		return Response.json({ message: 'Unknown section.' }, { status: 404 })
	}

	const buffer = Buffer.from(await file.arrayBuffer())
	const rules = section.pages.flatMap((page) =>
		page.rules.map((rule) => ({ key: rule.key, tier: rule.tier })),
	)
	const results = await runReviewService(buffer, rules)

	return Response.json({ section: section.slug, results })
}
