import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import sharp from 'sharp'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPublishedTemplate } from '@/repositories/published-template.payload.repository'
import {
	exportTemplatePrint,
	TemplatePrintInputError,
	TemplatePrintStaleError,
	TemplatePrintUnavailableError,
} from './export-template-print.service'

vi.mock('@/repositories/published-template.payload.repository', () => ({
	findPublishedTemplate: vi.fn(),
}))

const publishedTemplate = {
	height: 300,
	html: '<div data-node-id="root" style="width:600px;height:300px"></div>',
	id: 7,
	name: 'Print template',
	overrides: {},
	printPpi: '300',
	updatedAt: '2026-07-29T00:00:00.000Z',
	width: 600,
}

async function transparentPng(width = 600, height = 300) {
	return sharp({
		create: {
			background: { alpha: 0, b: 0, g: 0, r: 255 },
			channels: 4,
			height,
			width,
		},
	})
		.png()
		.toBuffer()
}

describe('exportTemplatePrint', () => {
	beforeEach(() => {
		vi.mocked(findPublishedTemplate).mockReset()
	})

	it('픽셀 크기는 유지하고 흰 배경·기본 CMYK·운영자 PPI를 TIFF에 적용한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)
		const result = await exportTemplatePrint({
			format: 'tiff',
			png: await transparentPng(),
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
			height: 300,
			space: 'cmyk',
			width: 600,
		})
		expect(metadata.icc?.length).toBeGreaterThan(0)
		expect(info.channels).toBe(3)
		expect(data.every((value) => value === 255)).toBe(true)
	})

	it('CMYK 이미지를 정확한 mm × mm 페이지 크기의 PDF에 배치한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)
		const result = await exportTemplatePrint({
			format: 'pdf',
			png: await transparentPng(),
			templateId: 7,
			templateVersion: publishedTemplate.updatedAt,
		})
		const pdf = await PDFDocument.load(Uint8Array.from(result))
		const page = pdf.getPage(0)
		const image = pdf.context
			.enumerateIndirectObjects()
			.map(([, object]) => object)
			.find(
				(object) =>
					object instanceof PDFRawStream &&
					String(object.dict.get(PDFName.of('Subtype'))) === '/Image',
			)

		expect(pdf.getPageCount()).toBe(1)
		expect(page.getWidth()).toBeCloseTo(144)
		expect(page.getHeight()).toBeCloseTo(72)
		expect(image).toBeInstanceOf(PDFRawStream)
		if (!(image instanceof PDFRawStream)) throw new Error('PDF image is missing.')
		expect(String(image.dict.get(PDFName.of('ColorSpace')))).toBe('/DeviceCMYK')
	})

	it('템플릿 픽셀 크기와 다른 PNG는 거부한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)

		await expect(
			exportTemplatePrint({
				format: 'pdf',
				png: await transparentPng(599, 300),
				templateId: 7,
				templateVersion: publishedTemplate.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplatePrintInputError)
	})

	it('헤더만 정상인 잘린 PNG도 입력 오류로 분류한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)
		const png = await transparentPng()
		const truncated = png.subarray(0, Math.floor(png.length / 2))

		await expect(sharp(truncated).metadata()).resolves.toMatchObject({
			height: 300,
			width: 600,
		})
		await expect(
			exportTemplatePrint({
				format: 'tiff',
				png: truncated,
				templateId: 7,
				templateVersion: publishedTemplate.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplatePrintInputError)
	})

	it('화면이 렌더한 버전과 현재 published 버전이 다르면 거부한다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue(publishedTemplate as never)

		await expect(
			exportTemplatePrint({
				format: 'pdf',
				png: Buffer.from('not read'),
				templateId: 7,
				templateVersion: '2026-07-28T00:00:00.000Z',
			}),
		).rejects.toBeInstanceOf(TemplatePrintStaleError)
	})

	it('운영자 PPI가 없는 템플릿은 인쇄 파일로 내보내지 않는다', async () => {
		vi.mocked(findPublishedTemplate).mockResolvedValue({
			...publishedTemplate,
			printPpi: null,
		} as never)

		await expect(
			exportTemplatePrint({
				format: 'pdf',
				png: Buffer.from('not read'),
				templateId: 7,
				templateVersion: publishedTemplate.updatedAt,
			}),
		).rejects.toBeInstanceOf(TemplatePrintUnavailableError)
	})
})
