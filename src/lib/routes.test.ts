import { describe, expect, it } from 'vitest'
import {
	getStudioGenerateProfileRoute,
	getStudioTemplateCategoryRoute,
	getStudioTemplateRoute,
	legacyPageRedirects,
	routes,
} from './routes'

describe('routes', () => {
	it('Studio canonical 경로와 템플릿 하위 경로를 만든다', () => {
		expect(routes.studio.root).toBe('/studio')
		expect(getStudioTemplateCategoryRoute('event')).toBe('/studio/template/event')
		expect(getStudioTemplateCategoryRoute('stationery')).toBe('/studio/template/stationery')
		expect(getStudioTemplateRoute('event', 2)).toBe('/studio/template/event/2')
		expect(getStudioGenerateProfileRoute('illustration')).toBe('/studio/generate/illustration')
	})

	it('이전 Studio 경로를 canonical 경로로 영구 이동한다', () => {
		expect(legacyPageRedirects).toEqual([
			{
				source: '/create/:path*',
				destination: '/studio/template/:path*',
				permanent: true,
			},
			{
				source: '/generate',
				destination: '/studio/generate',
				permanent: true,
			},
			{
				source: '/review',
				destination: '/studio/review',
				permanent: true,
			},
		])
	})
})
