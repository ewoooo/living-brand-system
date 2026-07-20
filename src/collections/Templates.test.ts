import { describe, expect, it, vi } from 'vitest'
import { convertFigmaNodeToHtml } from '@/features/template-import/utils/figma-node-to-html'
import { Templates } from './Templates'

type BeforeChangeHook = (args: {
	data: Record<string, unknown>
	originalDoc?: Record<string, unknown>
	req: { payload: { find: ReturnType<typeof vi.fn> } }
}) => Promise<unknown>

const hook = Templates.hooks?.beforeChange?.[0] as unknown as BeforeChangeHook

type AccessFunction = (args: { req: { user: unknown } }) => unknown

function collectionAccess(name: 'create' | 'delete' | 'read' | 'update'): AccessFunction {
	const rule = Templates.access?.[name]
	if (typeof rule !== 'function') throw new Error(`${name} access is not configured`)
	return rule as unknown as AccessFunction
}

function buildRequest(docs: { id: number; url?: string }[] = []) {
	return { req: { payload: { find: vi.fn().mockResolvedValue({ docs }) } } }
}

function buildTemplate(imageOverrides: Record<string, unknown>) {
	return {
		width: 100,
		height: 100,
		background: '#ffffff',
		elements: [
			{
				id: 'image_1',
				type: 'image',
				x: 0,
				y: 0,
				width: 50,
				height: 50,
				zIndex: 1,
				locked: false,
				slotLabel: '로고',
				assetId: 1,
				src: '/api/brand-logos/file/logo.svg',
				objectFit: 'contain',
				borderRadius: 0,
				assetCollection: 'brand-logos',
				...imageOverrides,
			},
		],
	}
}

describe('Templates beforeChange hook', () => {
	// HTML 구조 안전성은 모든 저장에서, 공식 에셋 인가 검사는 발행 시에 추가로 검사한다.
	it('발행 가능한 HTML이나 JSON 모델이 없으면 거부한다', async () => {
		const data = { name: 'no template', _status: 'published' }

		await expect(hook({ data, ...buildRequest() })).rejects.toThrow(
			'발행할 HTML 또는 JSON 템플릿이 필요합니다',
		)
	})

	it('스키마가 깨진 jsonTemplate은 저장을 거부한다 (fail-closed)', async () => {
		await expect(
			hook({
				data: { _status: 'published', jsonTemplate: { width: 'broken' } },
				...buildRequest(),
			}),
		).rejects.toThrow('스키마')
	})

	it('JSON CSS형 필드의 외부 URL과 제어 구문은 발행하지 않는다', async () => {
		for (const background of [
			'url(https://attacker.example/pixel.png)',
			String.raw`u\72l(https://attacker.example/pixel.png)`,
			'#fff; background-image: url(https://attacker.example/pixel.png)',
		]) {
			await expect(
				hook({
					data: {
						_status: 'published',
						jsonTemplate: { ...buildTemplate({}), background },
					},
					...buildRequest([{ id: 1, url: '/api/brand-logos/file/logo.svg' }]),
				}),
			).rejects.toThrow('스키마')
		}
	})

	it('임포트 조각이 남아 있으면 저장을 거부한다', async () => {
		await expect(
			hook({
				data: {
					_status: 'published',
					jsonTemplate: buildTemplate({ assetCollection: 'template-assets' }),
				},
				...buildRequest(),
			}),
		).rejects.toThrow('인가된 에셋으로 교체되지 않은 이미지')
	})

	it('인가 참조가 실제 문서를 가리키면 통과한다', async () => {
		const data = { _status: 'published', jsonTemplate: buildTemplate({}) }

		await expect(
			hook({ data, ...buildRequest([{ id: 1, url: '/api/brand-logos/file/logo.svg' }]) }),
		).resolves.toBe(data)
	})

	it('HTML이 없는 draft는 깨진 레거시 JSON도 보존한다', async () => {
		// JSON 발행 검증은 publish에서만 한다 — 진행 중인 import 충실도 우선.
		const data = { jsonTemplate: { width: 'broken' } }

		await expect(hook({ data, ...buildRequest() })).resolves.toBe(data)
	})

	it('draft도 실행 가능한 HTML과 외부 URL은 거부한다', async () => {
		const data = {
			_status: 'draft',
			html: '<img data-node-id="logo" src="https://attacker.example/x" onerror="alert(1)">',
			overrides: {},
		}

		await expect(hook({ data, ...buildRequest() })).rejects.toThrow('허용하지 않는 속성')
	})

	it('허용하지 않는 HTML style 속성명을 안내한다', async () => {
		const data = {
			_status: 'draft',
			html: '<div data-node-id="frame" style="z-index: 1"></div>',
			overrides: {},
		}

		await expect(hook({ data, ...buildRequest() })).rejects.toThrow(
			'HTML style에서 허용하지 않는 속성입니다: z-index',
		)
	})

	it('HTML style의 background-color를 허용한다', async () => {
		const data = {
			_status: 'draft',
			html: '<div data-node-id="frame" style="background-color: #fff"></div>',
			overrides: {},
		}

		await expect(hook({ data, ...buildRequest() })).resolves.toBe(data)
	})

	it('실제 Figma 변환의 줄바꿈·constraints style과 instance node id를 허용한다', async () => {
		const converted = convertFigmaNodeToHtml({
			id: 'I571:4018;450:1129',
			name: 'Instance',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 },
			children: [
				{
					id: '1:2',
					name: 'Pinned',
					type: 'RECTANGLE',
					absoluteBoundingBox: { x: 1080, y: 40, width: 80, height: 40 },
					constraints: { horizontal: 'RIGHT', vertical: 'TOP' },
				},
				{
					id: '1:3',
					name: 'Centered',
					type: 'RECTANGLE',
					absoluteBoundingBox: { x: 500, y: 360, width: 200, height: 80 },
					constraints: { horizontal: 'CENTER', vertical: 'CENTER' },
				},
			],
		} as never)
		const data = {
			_status: 'draft',
			baseHtml: converted.html,
			html: converted.html,
			overrides: {},
			width: converted.width,
			height: converted.height,
		}

		await expect(hook({ data, ...buildRequest() })).resolves.toBe(data)
	})

	it('검증된 raster data URI 배경은 draft에서만 저장한다', async () => {
		const dataUri =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZVQAAAAASUVORK5CYII='
		const base = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: `<div data-node-id="frame" style='background-image:url("${dataUri}")'></div>`,
			overrides: { frame: { backgroundImage: dataUri } },
			width: 1200,
			height: 800,
		}

		await expect(
			hook({ data: { ...base, _status: 'draft' }, ...buildRequest() }),
		).resolves.toEqual({ ...base, _status: 'draft' })
		await expect(
			hook({ data: { ...base, _status: 'published' }, ...buildRequest() }),
		).rejects.toThrow('draft에서만 사용할 수 있습니다')
	})

	it('자기신고 라벨만 인가 컬렉션인 위장 참조는 거부한다', async () => {
		// 존재하지 않는 assetId
		await expect(
			hook({
				data: { _status: 'published', jsonTemplate: buildTemplate({ assetId: 999 }) },
				...buildRequest(),
			}),
		).rejects.toThrow('인가 에셋 참조가 유효하지 않습니다')

		// 실제 문서는 있지만 src가 외부 URL
		await expect(
			hook({
				data: {
					_status: 'published',
					jsonTemplate: buildTemplate({ src: 'https://attacker.example/x.png' }),
				},
				...buildRequest([{ id: 1, url: '/api/brand-logos/file/logo.svg' }]),
			}),
		).rejects.toThrow('인가 에셋 참조가 유효하지 않습니다')
	})

	it('유효한 HTML 모델은 발행하고 비공개 원본 에셋은 baseHtml에만 보관한다', async () => {
		const data = {
			_status: 'published',
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: '<img data-node-id="logo" src="/api/application-images/file/logo.svg">',
			overrides: {
				logo: {
					vectorAsset: {
						collection: 'application-images',
						id: 7,
						src: '/api/application-images/file/logo.svg',
					},
				},
			},
			width: 1200,
			height: 800,
		}
		const request = buildRequest([{ id: 7, url: '/api/application-images/file/logo.svg' }])

		await expect(hook({ data, ...request })).resolves.toBe(data)
		expect(request.req.payload.find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'application-images',
				draft: false,
				req: request.req,
				where: {
					and: [{ id: { in: [7] } }, { _status: { equals: 'published' } }],
				},
			}),
		)
	})

	it('공개 HTML에 template-assets가 남아 있으면 발행을 거부한다', async () => {
		const data = {
			_status: 'published',
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			overrides: {},
			width: 1200,
			height: 800,
		}

		await expect(hook({ data, ...buildRequest() })).rejects.toThrow('모든 URL은 인가 에셋')
	})

	it('HTML 크기와 overrides 형식을 서버에서 검증한다', async () => {
		const base = {
			_status: 'published',
			baseHtml: '<p data-node-id="name">이름</p>',
			html: '<p data-node-id="name">이름</p>',
			height: 800,
		}

		await expect(
			hook({ data: { ...base, width: 0, overrides: {} }, ...buildRequest() }),
		).rejects.toThrow('width와 height는 0보다 큰 숫자')
		await expect(
			hook({ data: { ...base, width: 1200, overrides: [] }, ...buildRequest() }),
		).rejects.toThrow('overrides 형식이 올바르지 않습니다')
	})

	it('부분 publish 요청도 기존 draft 모델을 합쳐 검증한다', async () => {
		const data = { _status: 'published' }
		const originalDoc = {
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			overrides: {},
			width: 1200,
			height: 800,
		}

		await expect(hook({ data, originalDoc, ...buildRequest() })).rejects.toThrow(
			'모든 URL은 인가 에셋',
		)
	})

	it('slash로 구분한 이벤트 속성도 구조 파서가 거부한다', async () => {
		const data = {
			_status: 'published',
			baseHtml: '<p data-node-id="name">이름</p>',
			html: '<img data-node-id="logo"/src="x"/onerror="alert(1)">',
			overrides: {},
			width: 1200,
			height: 800,
		}

		await expect(hook({ data, ...buildRequest() })).rejects.toThrow('허용하지 않는 속성')
	})

	it('live published 문서의 _status 없는 부분 update도 다시 검증한다', async () => {
		const data = {
			html: '<img data-node-id="logo" src="https://attacker.example/pixel.png">',
		}
		const originalDoc = {
			_status: 'published',
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: '<p data-node-id="name">기존</p>',
			overrides: {},
			width: 1200,
			height: 800,
		}

		await expect(hook({ data, originalDoc, ...buildRequest() })).rejects.toThrow(
			'Draft HTML에는 내부 에셋',
		)
	})

	it('구조화 참조 없는 외부 이미지와 CSS URL은 발행하지 않는다', async () => {
		const base = {
			_status: 'published',
			baseHtml: '<div data-node-id="frame"></div>',
			overrides: {},
			width: 1200,
			height: 800,
		}

		await expect(
			hook({
				data: {
					...base,
					html: '<img data-node-id="frame" src="https://attacker.example/pixel.png">',
				},
				...buildRequest(),
			}),
		).rejects.toThrow('Draft HTML에는 내부 에셋')
		await expect(
			hook({
				data: {
					...base,
					html: String.raw`<div data-node-id="frame" style="background-image:u\72l(https://attacker.example/pixel.png)"></div>`,
				},
				...buildRequest(),
			}),
		).rejects.toThrow('허용하지 않는 CSS 구문')
	})

	it('orphan override와 구조화되지 않은 배경 이미지는 draft에서만 허용한다', async () => {
		const base = {
			_status: 'published',
			baseHtml: '<div data-node-id="frame"></div>',
			html: '<div data-node-id="frame"></div>',
			width: 1200,
			height: 800,
		}

		await expect(
			hook({ data: { ...base, overrides: { missing: { text: 'x' } } }, ...buildRequest() }),
		).rejects.toThrow('존재하지 않는 노드')
		await expect(
			hook({
				data: {
					...base,
					overrides: {
						frame: { backgroundImage: '/api/application-images/file/background.png' },
					},
				},
				...buildRequest(),
			}),
		).rejects.toThrow('draft에서만 사용할 수 있습니다')
	})
})

describe('Templates access', () => {
	it('공개·worker는 published만 읽고 manager는 draft도 읽는다', () => {
		for (const user of [null, { role: 'worker' }]) {
			expect(collectionAccess('read')({ req: { user } })).toEqual({
				_status: { equals: 'published' },
			})
		}
		expect(collectionAccess('read')({ req: { user: { role: 'manager' } } })).toBe(true)
	})

	it('쓰기는 manager/admin만 허용하고 baseHtml도 둘만 읽는다', () => {
		for (const operation of ['create', 'update', 'delete'] as const) {
			expect(collectionAccess(operation)({ req: { user: { role: 'worker' } } })).toBe(false)
			expect(collectionAccess(operation)({ req: { user: { role: 'manager' } } })).toBe(true)
		}

		for (const fieldName of ['baseHtml', 'sourceUrl']) {
			const field = Templates.fields.find(
				(candidate) => 'name' in candidate && candidate.name === fieldName,
			)
			if (!field || !('access' in field) || typeof field.access?.read !== 'function') {
				throw new Error(`${fieldName} read access is not configured`)
			}
			const read = field.access.read as unknown as AccessFunction
			expect(read({ req: { user: { role: 'worker' } } })).toBe(false)
			expect(read({ req: { user: { role: 'manager' } } })).toBe(true)
		}
	})
})
