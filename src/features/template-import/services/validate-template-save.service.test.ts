import { describe, expect, it, vi } from 'vitest'
import { inspectTemplateFragment } from '@/features/template-core/domain/inspect-template-html'
import { parseTemplateNodeConfigs } from '@/features/template-core/domain/parse-template-node-configs'
import {
	findTemplateDraftBlocker,
	findTemplatePublishBlocker,
} from './validate-template-save.service'

function repositoryContext(docs: { id: number; url?: string }[] = []) {
	return {
		payload: {
			find: vi.fn().mockResolvedValue({ docs }),
		},
	} as never
}

// prepareTemplateSave가 하듯 overrides 파싱과 base/draft fragment를 한 번 만들어 전달한다.
function saveInputs(candidate: { baseHtml?: string; html?: string; overrides?: unknown }) {
	const parsed = parseTemplateNodeConfigs(candidate.overrides)
	if ('blocker' in parsed) throw new Error(parsed.blocker)
	return {
		parsed,
		base: candidate.baseHtml ? inspectTemplateFragment(candidate.baseHtml, 'base') : undefined,
		draft: candidate.html ? inspectTemplateFragment(candidate.html, 'draft') : undefined,
	}
}

describe('template save validation', () => {
	it('발행 가능한 HTML 모델과 크기를 요구한다', async () => {
		await expect(
			findTemplatePublishBlocker({}, undefined, undefined, repositoryContext()),
		).resolves.toBe('발행할 HTML 템플릿이 필요합니다.')

		const candidate = {
			baseHtml: '<p data-node-id="name">이름</p>',
			html: '<p data-node-id="name">이름</p>',
			overrides: {},
			width: 0,
			height: 800,
		}
		const { parsed, base } = saveInputs(candidate)
		await expect(
			findTemplatePublishBlocker(candidate, parsed, base, repositoryContext()),
		).resolves.toContain('width와 height는 0보다 큰 숫자')
	})

	it('안전한 raster data URI는 draft에만 허용한다', async () => {
		const dataUri =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZVQAAAAASUVORK5CYII='
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: `<div data-node-id="frame" style='background-image:url("${dataUri}")'></div>`,
			overrides: { frame: { backgroundImage: dataUri } },
			width: 1200,
			height: 800,
		}
		const { parsed, base, draft } = saveInputs(candidate)

		expect(findTemplateDraftBlocker(parsed, base, draft)).toBeNull()
		await expect(
			findTemplatePublishBlocker(candidate, parsed, base, repositoryContext()),
		).resolves.toContain('draft에서만 사용할 수 있습니다')
	})

	it('생성 이미지 ID와 published URL이 일치해야 한다', async () => {
		const url = '/api/generated-images/file/background.png'
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: `<div data-node-id="frame" style='background-image:url("${url}")'></div>`,
			overrides: { frame: { backgroundImage: url, generatedImageId: 42 } },
			width: 1200,
			height: 800,
		}
		const { parsed, base } = saveInputs(candidate)

		await expect(
			findTemplatePublishBlocker(
				candidate,
				parsed,
				base,
				repositoryContext([{ id: 42, url }]),
			),
		).resolves.toBeNull()
		await expect(
			findTemplatePublishBlocker(
				candidate,
				parsed,
				base,
				repositoryContext([{ id: 42, url: '/api/generated-images/file/other.png' }]),
			),
		).resolves.toContain('인가 에셋 참조가 유효하지 않습니다')
	})

	it('구조화 참조 없는 배경 이미지는 발행하지 않는다', async () => {
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: '<div data-node-id="frame"></div>',
			overrides: {
				frame: { backgroundImage: '/api/application-images/file/background.png' },
			},
			width: 1200,
			height: 800,
		}
		const { parsed, base } = saveInputs(candidate)

		await expect(
			findTemplatePublishBlocker(candidate, parsed, base, repositoryContext()),
		).resolves.toContain('draft에서만 사용할 수 있습니다')
	})

	it('발행 에셋 ID와 URL을 Payload에서 확인한다', async () => {
		const url = '/api/application-images/file/logo.svg'
		const candidate = {
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: `<img data-node-id="logo" src="${url}">`,
			overrides: {
				logo: {
					vectorAsset: { collection: 'application-images' as const, id: 7, src: url },
				},
			},
			width: 1200,
			height: 800,
		}
		const { parsed, base } = saveInputs(candidate)

		await expect(
			findTemplatePublishBlocker(
				candidate,
				parsed,
				base,
				repositoryContext([{ id: 7, url }]),
			),
		).resolves.toBeNull()
	})
})
