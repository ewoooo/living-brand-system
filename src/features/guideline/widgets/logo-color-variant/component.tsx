import config from '@payload-config'
import { getPayload } from 'payload'
import type { BrandLogo } from '@/payload-types'
import { LogoColorVariantView } from './view'

// 로고 색상 변형 위젯(서버) — 픽된 로고의 파일명에서 언어(ko/en/hd)를 파싱해,
// 그 언어의 실제 SVG 6개({lang}-{가로|세로}-{기본|white|단색})를 brand-logos에서 조회한다.
// 🔴 CSS로 이미지 색을 조정하지 않는다 — 색상별 실파일을 그대로 렌더(클라 뷰는 가로/세로 토글).
// 파일명 규약: {ko|en|hd}-{horizontal|vertical}-{default|white|mono}.svg
type LogoRef = number | BrandLogo | null | undefined

export async function LogoColorVariantWidget({ logo }: { logo: LogoRef }) {
	const picked = typeof logo === 'object' && logo ? logo : null
	const lang = picked?.filename?.split('-')[0]
	if (!lang) return null

	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'brand-logos',
		depth: 0,
		limit: 50,
		overrideAccess: true,
	})

	// {orientation: {color: url}}
	const map: Record<string, Record<string, string>> = {}
	for (const d of docs) {
		const base = d.filename?.replace('.svg', '') ?? ''
		const [l, orientation, color] = base.split('-')
		if (l !== lang || !orientation || !color) continue
		const url = d.url ?? (d.filename ? `/api/brand-logos/file/${d.filename}` : null)
		if (!url) continue
		map[orientation] ??= {}
		map[orientation][color] = url
	}

	if (Object.keys(map).length === 0) return null
	return <LogoColorVariantView map={map} />
}

export default LogoColorVariantWidget
