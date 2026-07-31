export const routes = {
	admin: '/admin',
	guideline: '/guideline',
	home: '/',
	mcpSettings: '/settings/mcp',
	studio: {
		examples: '/studio/examples',
		generate: '/studio/generate',
		generateGraphic: '/studio/generate/graphic',
		generateImage: '/studio/generate/image',
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

export function getStudioGenerateProfileRoute(profileSlug: string) {
	return `${routes.studio.generateImage}/${profileSlug}`
}

export const legacyPageRedirects = [
	{
		source: '/create/:path*',
		destination: `${routes.studio.template}/:path*`,
		permanent: true,
	},
	{
		source: '/generate',
		destination: routes.studio.generateImage,
		permanent: true,
	},
	{
		source: '/review',
		destination: routes.studio.review,
		permanent: true,
	},
] as const
