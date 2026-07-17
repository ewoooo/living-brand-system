import { describe, expect, it } from 'vitest'
import { jsonTemplateSchema } from './json-template'

/** Living Brand System 예시(Wl9p2kQENUqapg6iOVHVOF, node 110-54)의 축약 구조. */
function buildStackedTemplate() {
	return {
		width: 1115,
		height: 1000,
		background: '#ffffff',
		elements: [
			{
				id: 'stack_root',
				type: 'stack',
				x: 0,
				y: 0,
				width: 1115,
				height: 1000,
				zIndex: 1,
				locked: true,
				direction: 'vertical',
				gap: 0,
				padding: { top: 50, right: 50, bottom: 50, left: 50 },
				justify: 'end',
				align: 'center',
				children: [
					{
						id: 'stack_row',
						type: 'stack',
						locked: true,
						width: 1015,
						height: 714,
						widthMode: 'fill',
						direction: 'horizontal',
						gap: 0,
						padding: { top: 0, right: 0, bottom: 0, left: 0 },
						justify: 'space-between',
						children: [
							{
								id: 'logo_1',
								type: 'image',
								locked: false,
								slotLabel: '로고',
								width: 238,
								height: 141,
								assetCollection: 'brand-logos',
								assetId: 1,
								src: '/api/brand-logos/file/logo.svg',
								objectFit: 'contain',
								borderRadius: 0,
							},
							{
								id: 'text_1',
								type: 'text',
								locked: false,
								slotLabel: 'Placeholder',
								width: 279,
								height: 61,
								widthMode: 'hug',
								text: 'Placeholder',
								fontSize: 50,
								fontFamily: 'Inter',
								fontWeight: '400',
								color: '#ea5343',
								lineHeight: 1.2,
								letterSpacing: 0,
								textAlign: 'left',
								textFit: 'auto-width',
							},
						],
					},
				],
			},
		],
	}
}

describe('jsonTemplateSchema (stack)', () => {
	it('중첩 스택 템플릿을 파싱한다', () => {
		const parsed = jsonTemplateSchema.safeParse(buildStackedTemplate())

		expect(parsed.success).toBe(true)
	})

	it('flow 자식의 크기 모드와 스택 정렬 기본값을 채운다', () => {
		const parsed = jsonTemplateSchema.parse(buildStackedTemplate())
		const root = parsed.elements[0]

		if (root?.type !== 'stack') {
			throw new Error('expected stack root')
		}

		const row = root.children[0]

		if (row?.type !== 'stack') {
			throw new Error('expected stack row')
		}

		// 생략된 필드는 기본값으로: heightMode fixed, align start.
		expect(row.heightMode).toBe('fixed')
		expect(row.align).toBe('start')

		const logo = row.children[0]

		if (logo?.type !== 'image') {
			throw new Error('expected image child')
		}

		expect(logo.widthMode).toBe('fixed')
		expect(logo.heightMode).toBe('fixed')
	})

	it('스택 자식은 좌표 없이 유효하고, 알 수 없는 direction은 거부한다', () => {
		const template = buildStackedTemplate()
		// biome-ignore lint/suspicious/noExplicitAny: 잘못된 값 주입 테스트
		;(template.elements[0] as any).direction = 'diagonal'

		expect(jsonTemplateSchema.safeParse(template).success).toBe(false)
	})

	it('children이 없는 스택은 거부한다', () => {
		const template = buildStackedTemplate()
		// biome-ignore lint/suspicious/noExplicitAny: 필수 필드 제거 테스트
		delete (template.elements[0] as any).children

		expect(jsonTemplateSchema.safeParse(template).success).toBe(false)
	})

	it.each([
		[
			'canvas background',
			(template: ReturnType<typeof buildStackedTemplate>) => {
				template.background = 'url(https://attacker.example/pixel.png)'
			},
		],
		[
			'escaped rect fill',
			(template: ReturnType<typeof buildStackedTemplate>) => {
				const root = template.elements[0]
				if (root?.type !== 'stack') throw new Error('expected stack root')
				Object.assign(root, { fill: String.raw`u\72l(https://attacker.example/pixel.png)` })
			},
		],
		[
			'nested filter',
			(template: ReturnType<typeof buildStackedTemplate>) => {
				const root = template.elements[0]
				if (root?.type !== 'stack') throw new Error('expected stack root')
				const row = root.children[0]
				if (row?.type !== 'stack') throw new Error('expected stack row')
				const logo = row.children[0]
				if (logo?.type !== 'image') throw new Error('expected image child')
				Object.assign(logo, { filter: 'url(//attacker.example/filter.svg#x)' })
			},
		],
	])('외부 요청 가능한 CSS를 거부한다: %s', (_label, mutate) => {
		const template = buildStackedTemplate()
		mutate(template)

		expect(jsonTemplateSchema.safeParse(template).success).toBe(false)
	})

	it('일반 색상·그라디언트·필터 함수는 유지한다', () => {
		const template = buildStackedTemplate()
		template.background = 'linear-gradient(180deg, #fff 0%, rgb(0, 0, 0) 100%)'
		const root = template.elements[0]
		if (root?.type !== 'stack') throw new Error('expected stack root')
		const row = root.children[0]
		if (row?.type !== 'stack') throw new Error('expected stack row')
		const logo = row.children[0]
		if (logo?.type !== 'image') throw new Error('expected image child')
		Object.assign(logo, { filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' })

		expect(jsonTemplateSchema.safeParse(template).success).toBe(true)
	})
})
