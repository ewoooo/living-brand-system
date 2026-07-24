'use client'

import { type ReactNode, useEffect, useState } from 'react'

type Kind = 'minSize' | 'clearSpace' | 'registeredMark'
export type LogoViewerTopic = { id: string; kind: Kind; label: string; description: ReactNode }

const DANGER = '#dc2626'
// 뷰잉 스테이지 고정 높이(px). 로고 크기와 무관하게 프레임은 평생 고정, 넘치면 클립된다.
const STAGE_H = 240

// 공유 로고 스테이지 위에서 topic(탭)별 기능을 보여준다. size 상태를 minSize·registeredMark 탭이 공유한다.
// 같은 크기 오버레이 SVG(®·클리어스페이스)는 로고 박스에 inset-0로 겹쳐 자동 정렬된다.
export function LogoViewer({
	logo,
	registeredMark,
	clearSpaceGuide,
	minSizePx,
	registeredMinPx,
	logoRealHeightPx,
	topics,
}: {
	logo: string
	registeredMark?: string | null
	clearSpaceGuide?: string | null
	minSizePx: number
	registeredMinPx: number
	/** 로고 파일 속 실제 로고 높이(px). 클리어스페이스 여백 때문에 파일 크기와 다를 수 있다. */
	logoRealHeightPx?: number | null
	topics: LogoViewerTopic[]
}) {
	const [active, setActive] = useState(0)
	// sizePx = "실제 로고" 높이(px) 기준. 슬라이더·임계값 모두 이 값으로 판단한다.
	const [sizePx, setSizePx] = useState(120)
	const [clearSpaceOn, setClearSpaceOn] = useState(true)
	// 로고 파일의 intrinsic 높이(px) — 실제 로고/파일 가중치 계산용.
	const [fileHeight, setFileHeight] = useState<number | null>(null)

	useEffect(() => {
		const img = new Image()
		img.onload = () => setFileHeight(img.naturalHeight || null)
		img.src = logo
	}, [logo])

	if (topics.length === 0) return null
	const index = Math.min(active, topics.length - 1)
	const topic = topics[index]
	const kind = topic.kind

	// 실제 로고 ÷ 파일 캔버스 = 가중치. 3파일이 같은 캔버스라 동일 r로 정렬 유지.
	// 실제 로고를 sizePx로 보이게 하려면 파일은 sizePx / r 로 렌더한다.
	const ratio = logoRealHeightPx && fileHeight ? logoRealHeightPx / fileHeight : 1
	const fileDisplayH = sizePx / ratio

	const tooSmall = kind === 'minSize' && sizePx < minSizePx
	const showClearSpace = kind === 'clearSpace' && clearSpaceOn && !!clearSpaceGuide
	const showMark = kind === 'registeredMark' && sizePx >= registeredMinPx && !!registeredMark
	const showSlider = kind === 'minSize' || kind === 'registeredMark'

	return (
		<div className="w-full">
			{/* 1. 뷰어 — full width, 고정 높이. 로고는 정중앙 고정, 넘치면 클립(border-radius 없음). */}
			<div className="w-full overflow-hidden border border-border bg-background">
				<div className="relative w-full overflow-hidden" style={{ height: STAGE_H }}>
					<div
						className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 inline-block"
						style={{ height: fileDisplayH }}
					>
						{/* max-w-none: 전역 img{max-width:100%} 무력화 — 폭에 안 갇히고 슬라이더(높이)에만 비례, 넘치면 클립. */}
						{/* biome-ignore lint/performance/noImgElement: 원격 svg라 next/image 미사용. */}
						<img src={logo} alt="로고" className="block h-full w-auto max-w-none" />
						{showClearSpace && clearSpaceGuide && (
							// biome-ignore lint/performance/noImgElement: 오버레이 svg.
							<img
								src={clearSpaceGuide}
								alt=""
								className="pointer-events-none absolute inset-0 h-full w-full max-w-none"
							/>
						)}
						{showMark && registeredMark && (
							// biome-ignore lint/performance/noImgElement: 오버레이 svg.
							<img
								src={registeredMark}
								alt=""
								className="pointer-events-none absolute inset-0 h-full w-full max-w-none"
							/>
						)}
					</div>
					{/* 최소 크기 미만 — Do/Dont 'dont' 배지를 뷰어 우상단에 표시 */}
					{tooSmall && (
						<span
							aria-hidden
							className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-destructive/20 font-body font-medium text-destructive text-xs"
						>
							✕
						</span>
					)}
				</div>
			</div>

			{/* 2. 우측 칼럼 — 필드 선택 탭 + 텍스트 + 컨트롤을 수평 2분할 오른쪽에 함께 배치 */}
			<div className="mt-5 grid grid-cols-2 gap-4">
				<div className="col-start-2 flex flex-col gap-4">
					{/* 필드 선택 탭 */}
					<div className="inline-flex flex-wrap gap-1 self-start rounded-full border border-border bg-fill-muted p-1">
						{topics.map((t, i) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setActive(i)}
								aria-pressed={i === index}
								className={`rounded-full px-4 py-1.5 font-body font-medium text-sm transition-colors ${
									i === index
										? 'bg-foreground text-background'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{t.label}
							</button>
						))}
					</div>
					{/* 텍스트 — 헤딩과 설명 사이 여백 확대 */}
					<div className="flex flex-col gap-3">
						<h3 className="font-body font-semibold text-sm">{topic.label}</h3>
						{topic.description}
					</div>
					{/* 각 필드(topic)의 설명 아래 인터랙션 */}
					<div className="flex flex-wrap items-center gap-4">
						{showSlider && (
							<label className="flex items-center gap-3 font-body text-sm">
								<span className="text-muted-foreground">크기</span>
								<input
									type="range"
									min={8}
									max={200}
									step={1}
									value={sizePx}
									onChange={(e) => setSizePx(Number(e.target.value))}
									className="w-48 accent-foreground"
									aria-label="로고 크기(px)"
								/>
								<span className="w-14 font-semibold tabular-nums">{sizePx}px</span>
							</label>
						)}
						{kind === 'minSize' && (
							<span
								className="font-body font-medium text-sm"
								style={tooSmall ? { color: DANGER } : undefined}
							>
								{tooSmall
									? `최소 ${minSizePx}px 미만 — 사용 불가`
									: `최소 ${minSizePx}px 이상`}
							</span>
						)}
						{kind === 'registeredMark' && (
							<span className="font-body text-muted-foreground text-sm">
								{showMark
									? `® 표시 (≥ ${registeredMinPx}px)`
									: `® 숨김 (< ${registeredMinPx}px)`}
							</span>
						)}
						{kind === 'clearSpace' && clearSpaceGuide && (
							<button
								type="button"
								onClick={() => setClearSpaceOn((s) => !s)}
								aria-pressed={clearSpaceOn}
								className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
							>
								<span
									className={`h-2.5 w-2.5 rounded-full ${clearSpaceOn ? 'bg-foreground' : 'bg-border'}`}
								/>
								클리어스페이스 {clearSpaceOn ? '켜짐' : '꺼짐'}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
