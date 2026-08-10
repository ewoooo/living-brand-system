import type { BrandLogo } from '@/payload-types'

// [임시] 클리어스페이스 오버레이(서버) — 로고 레이어 위에 그리드 레이어를 정확히 겹친다.
// 두 레이어는 동일 viewBox(px scale 일치)라, 같은 박스에 렌더하면 정합. 배율 = 자기 크기 × (scalePercent/100).
type LogoRef = number | BrandLogo | null | undefined
function layerUrl(r: LogoRef): string | null {
	return r && typeof r === 'object' ? (r.url ?? null) : null
}

export function ClearspaceOverlayWidget({
	logoLayer,
	gridLayer,
	scalePercent,
}: {
	logoLayer: LogoRef
	gridLayer: LogoRef
	scalePercent?: number | null
}) {
	const logo = layerUrl(logoLayer)
	const grid = layerUrl(gridLayer)
	if (!logo) return null
	const c = (scalePercent ?? 100) / 100
	return (
		<div
			className="mx-auto w-fit"
			style={{
				transform: c !== 1 ? `scale(${c})` : undefined,
				transformOrigin: 'top center',
			}}
		>
			<div className="relative">
				{/* 로고 레이어: natural 크기(업로드 시 viewBox→width/height 주입)로 컨테이너 크기 결정. */}
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
				<img src={logo} alt="" className="block" />
				{/* 그리드 레이어: 같은 박스를 채워 정확히 오버레이(동일 viewBox). */}
				{grid ? (
					// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
					<img src={grid} alt="" className="absolute inset-0 size-full" />
				) : null}
			</div>
		</div>
	)
}

export default ClearspaceOverlayWidget
