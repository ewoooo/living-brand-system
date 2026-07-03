import { describe, expect, it, vi } from 'vitest'
import { Templates } from './Templates'

type BeforeChangeHook = (args: {
	data: Record<string, unknown>
	req: { payload: { find: ReturnType<typeof vi.fn> } }
}) => Promise<unknown>

const hook = Templates.hooks?.beforeChange?.[0] as unknown as BeforeChangeHook

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
	it('jsonTemplate이 없으면 통과한다 (file 타입 템플릿)', async () => {
		const data = { name: 'no template' }

		await expect(hook({ data, ...buildRequest() })).resolves.toBe(data)
	})

	it('스키마가 깨진 jsonTemplate은 저장을 거부한다 (fail-closed)', async () => {
		await expect(
			hook({ data: { jsonTemplate: { width: 'broken' } }, ...buildRequest() }),
		).rejects.toThrow('스키마')
	})

	it('임포트 조각이 남아 있으면 저장을 거부한다', async () => {
		await expect(
			hook({
				data: { jsonTemplate: buildTemplate({ assetCollection: 'template-assets' }) },
				...buildRequest(),
			}),
		).rejects.toThrow('인가된 에셋으로 교체되지 않은 이미지')
	})

	it('인가 참조가 실제 문서를 가리키면 통과한다', async () => {
		const data = { jsonTemplate: buildTemplate({}) }

		await expect(
			hook({ data, ...buildRequest([{ id: 1, url: '/api/brand-logos/file/logo.svg' }]) }),
		).resolves.toBe(data)
	})

	it('자기신고 라벨만 인가 컬렉션인 위장 참조는 거부한다', async () => {
		// 존재하지 않는 assetId
		await expect(
			hook({ data: { jsonTemplate: buildTemplate({ assetId: 999 }) }, ...buildRequest() }),
		).rejects.toThrow('인가 에셋 참조가 유효하지 않습니다')

		// 실제 문서는 있지만 src가 외부 URL
		await expect(
			hook({
				data: {
					jsonTemplate: buildTemplate({ src: 'https://attacker.example/x.png' }),
				},
				...buildRequest([{ id: 1, url: '/api/brand-logos/file/logo.svg' }]),
			}),
		).rejects.toThrow('인가 에셋 참조가 유효하지 않습니다')
	})
})
