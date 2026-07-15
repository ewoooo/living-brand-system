/**
 * 새 체커 체계(heuristic 5종 + advisory 2종) 테스트용 CheckScenario 5종을 upsert한다.
 * 각 시나리오는 measure criteria·N/A 폴백·advisory 조언이 골고루 발동되도록 구성했다.
 * 실행: pnpm exec payload run scripts/seed-check-scenarios.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const SCENARIOS = [
	{
		key: 'logo-usage',
		title: '로고 사용 검수',
		description:
			'로고가 들어간 모든 산출물용 — 크기·여백·원형 유지·배경 가독성·® 표기(없으면 해당 없음)까지 로고 규정 전반을 검수합니다.',
		checkKeys: [
			'logo.size.minimum',
			'logo.space.clear',
			'logo.trademark',
			'logo.geometry',
			'logo.color.misuse',
			'logo.background.legibility',
			'logo.secondary.usage',
		],
	},
	{
		key: 'sns-feed',
		title: 'SNS 콘텐츠 검수',
		description:
			'피드·릴스 콘텐츠용 — 규격(3:4/9:16), 콘텐츠 존, 텍스트 가독성, 로고 배치, 브랜드 자산 활용에 카피 조언까지 포함합니다.',
		checkKeys: [
			'application.sns.format',
			'layout.sns.zones',
			'application.sns.caption.legibility',
			'logo.sns.placement',
			'imagery.sns.classification',
			'color.palette',
			'color.combination',
			'typography.misuse',
			'messaging.sns.copy',
		],
	},
	{
		key: 'stationery-print',
		title: '인쇄물 검수',
		description:
			'명함·리플렛·정보 카드용 — 규격, 별색 1도 인쇄 사양, 필수 기재 항목, 국·영문 타이포그래피를 검수합니다.',
		checkKeys: [
			'application.stationery.format',
			'application.print.spec',
			'messaging.stationery.content.fields',
			'color.palette',
			'typography-english',
			'typography.pairing',
		],
	},
	{
		key: 'package',
		title: '패키지 검수',
		description:
			'제품 패키지용 — 로고 타입 적용·배치, 필수 기재 요소, 브랜드 팔레트 준수를 검수합니다.',
		checkKeys: [
			'application.package.format',
			'logo.package.placement',
			'logo.package.variant',
			'messaging.package.content.fields',
			'color.palette',
		],
	},
	{
		key: 'brand-core-quick',
		title: '브랜드 코어 빠른 검수',
		description:
			'자산 유형과 무관한 핵심 규정만 빠르게 — 로고 원형·가독성, 팔레트·페어링, 서체 오용, 시그니처 중복(개수 측정)에 컬러 전략 조언까지.',
		checkKeys: [
			'logo.geometry',
			'logo.background.legibility',
			'color.palette',
			'color.combination',
			'typography.misuse',
			'messaging.signature.combination',
			'color.usage',
		],
	},
]

const payload = await getPayload({ config })

for (const scenario of SCENARIOS) {
	const existing = await payload.find({
		collection: 'check-scenarios',
		where: { key: { equals: scenario.key } },
		limit: 1,
		draft: true,
	})
	const data = {
		key: scenario.key,
		title: scenario.title,
		description: scenario.description,
		checkKeys: scenario.checkKeys,
		_status: 'published' as const,
	}
	if (existing.docs[0]) {
		await payload.update({
			collection: 'check-scenarios',
			id: existing.docs[0].id,
			data,
			locale: 'ko',
		})
		console.log(`updated: ${scenario.key} (${scenario.checkKeys.length} checks)`)
	} else {
		await payload.create({ collection: 'check-scenarios', data, locale: 'ko' })
		console.log(`created: ${scenario.key} (${scenario.checkKeys.length} checks)`)
	}
}
console.log('done')
process.exit(0)
