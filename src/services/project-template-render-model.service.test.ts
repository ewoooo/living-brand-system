import { expect, it } from 'vitest'
import { projectTemplateRenderModel } from './project-template-render-model.service'

it('구조화된 생성 이미지 배경을 공용 render model에 유지한다', () => {
	const url = '/api/generated-images/file/background.png'

	expect(
		projectTemplateRenderModel({
			html: `<div data-node-id="frame" style='background-image:url("${url}")'></div>`,
			overrides: { frame: { backgroundImage: url, generatedImageId: 42 } },
			width: 1200,
			height: 800,
		}),
	).toEqual({
		html: `<div data-node-id="frame" style='background-image:url("${url}")'></div>`,
		nodeConfigs: { frame: { backgroundImage: url, generatedImageId: 42 } },
		width: 1200,
		height: 800,
	})
})
