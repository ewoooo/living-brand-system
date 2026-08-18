// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { composeTemplateHtml } from '@/features/template-core/runtime/compose-template-html.client'
import type { RasterSurface } from '@/modules/studio-artifact/studio-artifact'
import { createTemplateRasterArtifact } from './template-runtime.client'

describe('Template Raster Artifact', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('오프스크린 holder가 아니라 콘텐츠 surface를 제공한다', async () => {
		const surface = await readSurface(
			'<div data-node-id="1:1" style="width:1280px;height:720px">사원 카드</div>',
			1280,
			720,
		)

		expect(surface.element.style.position).not.toBe('fixed')
		expect(surface.element.textContent).toContain('사원 카드')
		expect(surface).toMatchObject({ kind: 'element', width: 1280, height: 720 })
	})

	it('#__stage가 있으면 그 노드를 surface로 제공한다', async () => {
		const surface = await readSurface('<div id="__stage"><p>배치 결과</p></div>', 1200, 800)

		expect(surface.element.id).toBe('__stage')
	})

	it('이벤트 핸들러가 있는 HTML을 부모 DOM으로 옮기지 않는다', async () => {
		await expect(
			readSurface(
				'<div id="__stage"><img src="/api/brand-logos/file/logo.png" onerror="alert(1)"></div>',
				1200,
				800,
			),
		).rejects.toThrow('event handler')

		expect(document.body.querySelector('img')).toBeNull()
	})

	it('발행 자산 컬렉션의 CSS 배경 이미지 URL을 허용한다', async () => {
		mockLoadedImages()

		await expect(
			readSurface(
				'<div id="__stage" style="background-image:url(/api/generated-images/file/bg.png)">배치 결과</div>',
				1200,
				800,
			),
		).resolves.toMatchObject({ kind: 'element' })
	})

	it('캔버스 배경이 있는 합성 HTML을 안전하게 제공한다', async () => {
		mockLoadedImages()
		const html = composeTemplateHtml(
			'<div data-node-id="1:1" data-figma-type="FRAME" style="width:400px;height:300px"></div>',
			{},
			{
				canvasBackground: {
					color: '#ffffff',
					imageUrl: '/api/generated-images/file/canvas.png',
				},
			},
		)

		await expect(readSurface(html, 400, 300)).resolves.toMatchObject({
			kind: 'element',
			width: 400,
			height: 300,
		})
	})

	it('외부 이미지 URL을 거부한다', async () => {
		await expect(
			readSurface(
				'<div id="__stage"><img src="https://attacker.example/tracker.png"></div>',
				1200,
				800,
			),
		).rejects.toThrow('unsafe image URL')
	})

	it('XML이 금지하는 제어문자를 텍스트에서 걷어내고 줄바꿈과 탭은 남긴다', async () => {
		// Figma에서 딸려온 U+0003이 SVG 직렬화를 깨뜨려 모든 포맷의 내보내기를 실패시켰다.
		const surface = await readSurface(
			'<div id="__stage"><p>HD현대\u0003\n한국조선해양\t2026</p></div>',
			1920,
			1080,
		)

		expect(surface.element.textContent).toBe('HD현대\n한국조선해양\t2026')
	})

	it('XML이 금지하는 제어문자를 속성값에서도 걷어낸다', async () => {
		const surface = await readSurface(
			'<div id="__stage"><p data-name="Title\u0003">본문</p></div>',
			1920,
			1080,
		)

		expect(surface.element.querySelector('p')?.getAttribute('data-name')).toBe('Title')
	})
})

async function readSurface(html: string, width: number, height: number): Promise<RasterSurface> {
	const artifact = createTemplateRasterArtifact({ html, width, height })
	return await artifact.source.withSurface({}, async (surface) => surface)
}

function mockLoadedImages(): void {
	vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
	HTMLImageElement.prototype.decode = () => Promise.resolve()
}
