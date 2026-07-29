import sharp from 'sharp'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPublishedTemplate } from '@/repositories/published-template.payload.repository'
import { pixelsToMillimeters } from '../print-policy'
import {
	exportTemplateTiff,
	TemplateTiffInputError,
	TemplateTiffStaleError,
	TemplateTiffUnavailableError,
} from './export-template-tiff.service'

vi.mock('@/repositories/published-template.payload.repository', () => ({
	findPublishedTemplate: vi.fn(),
}))

const publishedTemplate = {
	height: 2,
	html: '<div data-node-id="root" style="width:2px;height:2px"></div>',
	id: 7,
	name: 'Print template',
	overrides: {},
	printPpi: '300',
	updatedAt: '2026-07-29T00:00:00.000Z',
	width: 2,
}

describe('exportTemplateTiff', () => {
	beforeEach(() => {
		vi.mocked(findPublishedTemplate).mockReset()
	})

	it('픽셀 크기는 유지하고 흰 배경·기본 CMYK·운영자 PPI를 TIFF에 적용한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)
		const png = await sharp({
			create: {
				background: { alpha: 0, b: 0, g: 0, r: 255 },
				channels: 4,
				height: 2,
				width: 2,
			},
		})
			.png()
			.toBuffer()

		const result = await exportTemplateTiff({
			png,
			templateId: 7,
			templateVersion: publishedTemplate.updatedAt,
		})
		const metadata = await sharp(result).metadata()
		const { data, info } = await sharp(result)
			.toColourspace('srgb')
			.raw()
			.toBuffer({ resolveWithObject: true })

		expect(metadata).toMatchObject({
			channels: 4,
			density: 300,
			format: 'tiff',
			hasAlpha: false,
			height: 2,
			space: 'cmyk',
			width: 2,
		})
		expect(metadata.icc?.length).toBeGreaterThan(0)
		expect(info.channels).toBe(3)
		expect([...data]).toEqual(new Array(12).fill(255))
		expect(pixelsToMillimeters(300, 300)).toBe(25.4)
	})

	it('템플릿 픽셀 크기와 다른 PNG는 거부한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)
		const png = await sharp({
			create: {
				background: 'white',
				channels: 3,
				height: 3,
				width: 2,
			},
		})
			.png()
			.toBuffer()

		await expect(
			exportTemplateTiff({
				png,
				templateId: 7,
				templateVersion: publishedTemplate.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplateTiffInputError)
	})

	it('헤더만 정상인 잘린 PNG도 입력 오류로 분류한다', async () => {
		const template = { ...publishedTemplate, height: 100, width: 100 }
		vi.mocked(findPublishedTemplate).mockResolvedValue(template as never)
		const png = await sharp({
			create: {
				background: 'white',
				channels: 3,
				height: 100,
				width: 100,
			},
		})
			.png()
			.toBuffer()
		const truncated = png.subarray(0, Math.floor(png.length / 2))

		await expect(sharp(truncated).metadata()).resolves.toMatchObject({
			height: 100,
			width: 100,
		})
		await expect(
			exportTemplateTiff({
				png: truncated,
				templateId: 7,
				templateVersion: template.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplateTiffInputError)
	})

	it('화면이 렌더한 버전과 현재 published 버전이 다르면 거부한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)

		await expect(
			exportTemplateTiff({
				png: Buffer.from('not read'),
				templateId: 7,
				templateVersion: '2026-07-28T00:00:00.000Z',
			}),
		).rejects.toBeInstanceOf(TemplateTiffStaleError)
	})

	it('운영자 PPI가 없는 템플릿은 TIFF로 내보내지 않는다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue({
			...publishedTemplate,
			printPpi: null,
		} as never)

		await expect(
			exportTemplateTiff({
				png: Buffer.from('not read'),
				templateId: 7,
				templateVersion: publishedTemplate.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplateTiffUnavailableError)
	})
})
