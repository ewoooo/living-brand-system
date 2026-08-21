export const routes = {
	admin: '/admin',
	guideline: '/guideline',
	home: '/',
	studio: {
		assets: '/studio/assets',
		graphic: '/studio/graphic',
		image: '/studio/image',
		mcp: '/studio/mcp',
		review: '/studio/review',
		template: '/studio/template',
	},
} as const

/**
 * 세 스튜디오는 대상을 같은 모양으로 지목한다 — `/studio/<kind>/<slug>`.
 *
 * 🔴 세그먼트는 **slug만** 쓴다. DB의 숫자 id는 환경마다 달라 링크가 환경을 넘지 못하고
 * (스냅샷 규약이 관계를 사람이 읽는 키로 적는 것과 같은 이유), 분류는 세그먼트에 두지 않는다 —
 * 분류는 표현이라 바뀌는데 URL은 정체성이어야 한다. 템플릿의 카테고리를 URL에서 뺀 근거다.
 */
export function getStudioImageRoute(profileSlug: string) {
	return `${routes.studio.image}/${profileSlug}`
}

export function getStudioGraphicRoute(profileSlug: string) {
	return `${routes.studio.graphic}/${profileSlug}`
}

export function getStudioTemplateRoute(templateSlug: string) {
	return `${routes.studio.template}/${templateSlug}`
}

export const legacyPageRedirects = [
	{
		source: '/studio',
		destination: routes.studio.assets,
		permanent: true,
	},
	{
		// 카테고리 세그먼트가 사라져 하위 경로를 옮길 수 없다 — 목록으로 보낸다.
		source: '/create',
		destination: routes.studio.template,
		permanent: true,
	},
	{
		source: '/generate',
		destination: routes.studio.image,
		permanent: true,
	},
	{
		source: '/review',
		destination: routes.studio.review,
		permanent: true,
	},
	{
		source: '/settings/mcp',
		destination: routes.studio.mcp,
		permanent: true,
	},
] as const
