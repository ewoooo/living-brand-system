import { describe, expect, it } from 'vitest'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'
import { deriveTemplateConfig, isBackgroundSlot, isImageSlot, isTextSlot } from './template-config'

const template: PublishedHtmlTemplate = {
	kind: 'html',
	id: 7,
	name: '포스터',
	html: [
		'<div>',
		'<p data-node-id="1:1" data-figma-type="TEXT" data-name="Title">기본 제목</p>',
		'<div data-node-id="2:1" data-figma-type="FRAME" data-name="Hero" data-image-carrier="" style="width:400px;height:300px"></div>',
		'</div>',
	].join(''),
	nodeConfigs: {
		'1:1': { input: { label: '제목', maxLength: 20, maxLines: 1 } },
		'2:1': { imageInput: { profileId: 3 }, imageColorize: { line: '#112233' } },
	},
	width: 800,
	height: 600,
	templateVersion: '2026-08-01T00:00:00.000Z',
}

describe('deriveTemplateConfig', () => {
	it('열린 노드만 kind 판별 슬롯으로 투영하고, 계약 필드가 원천을 그대로 옮긴다', () => {
		const config = deriveTemplateConfig(template)

		const text = config.slots.filter(isTextSlot)
		expect(text).toHaveLength(1)
		expect(text[0]).toMatchObject({
			id: '1:1',
			label: '제목',
			control: { kind: 'text', defaultValue: '기본 제목', format: 'free', maxLines: 1 },
		})

		const image = config.slots.filter(isImageSlot)
		expect(image).toHaveLength(1)
		expect(image[0].control).toMatchObject({
			kind: 'image',
			box: { width: 400, height: 300 },
			profile: { pinnedId: 3 },
			// colorize가 계약에 실려 사이드바가 원시 nodeConfigs를 다시 보지 않는다.
			colorize: { line: '#112233' },
			transform: { enabled: true },
		})
		// 레인지는 compose 전역 계약을 상속한다 — 어드민 좁히기 필드가 생기기 전 기본값.
		expect(image[0].control.transform.limits.scale).toEqual({ min: 0.2, max: 5 })

		expect(config.slots.filter(isBackgroundSlot)).toHaveLength(1)
	})

	it('exportOption은 인쇄 정책을 따른다 — printPpi 없으면 PNG만, 있으면 CMYK 포맷 개방', () => {
		expect(deriveTemplateConfig(template).exportOption.formats).toEqual(['png'])
		expect(deriveTemplateConfig({ ...template, printPpi: 150 }).exportOption).toMatchObject({
			formats: ['png', 'tiff', 'pdf'],
			printPpi: 150,
			canvas: { width: 800, height: 600 },
		})
	})
})
