import type { BrandLogo } from '@/payload-types'

// 로고 클리어스페이스 위젯(뷰) — 지금은 로고를 여백(클리어스페이스 근사) 안에 중앙 배치해 보여준다.
// 정밀한 측정 그리드/최소크기 오버레이는 추후. 우선 logo 연결·렌더 검증용.
type LogoRef = number | BrandLogo | null | undefined

function logoUrl(logo: LogoRef): { url: string; alt: string } | null {
	if (!logo || typeof logo !== 'object') return null
	if (!logo.url) return null
	return { url: logo.url, alt: logo.alt ?? logo.name ?? '' }
}

export function LogoClearSpaceWidget({ logo }: { logo: LogoRef }) {
	const src = logoUrl(logo)
	if (!src) return null

	return (
		<div className="flex items-center justify-center bg-neutral-100 p-16">
			{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
			<img src={src.url} alt={src.alt} className="max-h-64 max-w-full" />
		</div>
	)
}

export default LogoClearSpaceWidget
