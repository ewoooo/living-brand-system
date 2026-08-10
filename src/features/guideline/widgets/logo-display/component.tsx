import type { BrandLogo } from '@/payload-types'

// 로고 크게 보기 위젯(서버) — 픽된 로고를 크게 중앙 정렬로 렌더한다(오버레이 없음).
// 🔑 fishing 없이 logo를 pin해서 받으므로 공유 brand-logos 풀 내용에 영향받지 않는다.
type LogoRef = number | BrandLogo | null | undefined

type Props = {
	logo: LogoRef
	width?: number | null
	height?: number | null
	padding?: number | null
}

// 유한 이미지 박스: 자기 width/height/padding만 소유(배경·전체폭은 block 몫). inline-block으로 콘텐츠 크기에 수축.
export function LogoDisplayWidget({ logo, width, height, padding }: Props) {
	const picked = typeof logo === 'object' && logo ? logo : null
	if (!picked?.url) return null
	const alt = picked.alt ?? picked.name ?? ''
	// SVG는 본연 픽셀 크기가 0이라, width·height 둘 다 비면 기본 폭(320)으로 폴백(안 그러면 0×0 붕괴).
	const w = width ?? (width == null && height == null ? 320 : undefined)
	// mx-auto + w-fit = 콘텐츠 폭 유지(유한 박스)하며 가로 중앙정렬 기본. (좌/우 등 나머지 정렬은 추후.)
	return (
		<div className="mx-auto w-fit" style={{ padding: padding ?? undefined }}>
			{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
			<img
				src={picked.url}
				alt={alt}
				style={{ width: w, height: height ?? undefined }}
				className="block h-auto max-w-full"
			/>
		</div>
	)
}

export default LogoDisplayWidget
