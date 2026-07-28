export const routes = {
	admin: '/admin',
	guideline: '/guideline',
	home: '/',
	studio: {
		generate: '/studio/generate',
		generateImage: '/studio/generate#image',
		generateText: '/studio/generate#text',
		review: '/studio/review',
		root: '/studio',
		template: '/studio/template',
	},
} as const

export function getStudioTemplateCategoryRoute(categorySlug: string) {
	return `${routes.studio.template}/${categorySlug}`
}

export function getStudioTemplateRoute(categorySlug: string, templateId: number) {
	return `${getStudioTemplateCategoryRoute(categorySlug)}/${templateId}`
}

export const legacyPageRedirects = [
	{
		source: '/create/:path*',
		destination: `${routes.studio.template}/:path*`,
		permanent: true,
	},
	{
		source: '/generate',
		destination: routes.studio.generate,
		permanent: true,
	},
	{
		source: '/review',
		destination: routes.studio.review,
		permanent: true,
	},
] as const
