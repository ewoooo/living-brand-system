import { describe, expect, it } from 'vitest'
import {
	getStudioGraphicRoute,
	getStudioImageRoute,
	getStudioTemplateRoute,
	legacyPageRedirects,
	routes,
} from './routes'

describe('routes', () => {
	it('세 스튜디오가 /studio/<kind>/<slug> 한 모양으로 대상을 지목한다', () => {
		expect(routes.studio.assets).toBe('/studio/assets')
		expect(routes.studio.image).toBe('/studio/image')
		expect(routes.studio.graphic).toBe('/studio/graphic')
		expect(routes.studio.template).toBe('/studio/template')
		expect(routes.studio.mcp).toBe('/studio/mcp')

		expect(getStudioImageRoute('illustration')).toBe('/studio/image/illustration')
		expect(getStudioGraphicRoute('forward-straight')).toBe('/studio/graphic/forward-straight')
		expect(getStudioTemplateRoute('summer-poster')).toBe('/studio/template/summer-poster')
	})

	it('템플릿 주소에 분류 세그먼트를 넣지 않는다 — 분류가 바뀌어도 링크가 유지된다', () => {
		// 같은 템플릿은 어느 카테고리에 있든 같은 주소다.
		expect(getStudioTemplateRoute('summer-poster')).toBe(
			getStudioTemplateRoute('summer-poster'),
		)
		expect(getStudioTemplateRoute('summer-poster').split('/')).toHaveLength(4)
	})

	it('이전 Studio 경로를 canonical 경로로 영구 이동한다', () => {
		expect(legacyPageRedirects).toEqual([
			{
				source: '/studio',
				destination: '/studio/assets',
				permanent: true,
			},
			{
				source: '/create',
				destination: '/studio/template',
				permanent: true,
			},
			{
				source: '/generate',
				destination: '/studio/image',
				permanent: true,
			},
			{
				source: '/review',
				destination: '/studio/review',
				permanent: true,
			},
			{
				source: '/settings/mcp',
				destination: '/studio/mcp',
				permanent: true,
			},
		])
	})
})
