'use client'

import { type ReactNode, useEffect, useState } from 'react'

type Kind = 'minSize' | 'clearSpace' | 'registeredMark'
export type LogoGroupTopic = { id: string; kind: Kind; label: string; description: ReactNode }
export type LogoGroupItem = {
	id: string
	label?: string | null
	logo: string
	registeredMark?: string | null
	clearSpaceGuide?: string | null
	logoRealHeightPx?: number | null
	// 최소 크기·® 임계값은 로고에 종속(로고마다 다름).
	minSizePx: number
	registeredMinPx: number
}

const DANGER = '#dc2626'
// 각 셀(로고 1개)의 고정 높이(px). 로고는 슬라이더에 비례해 스케일되고 넘치면 클립된다.
const CELL_H = 180

// 로고 한 개 셀 — 자체 파일 intrinsic으로 실제/파일 가중치를 계산해 슬라이더(실제 높이)에 맞춰 렌더한다.
// 임계값(최소 크기·®)은 로고별 값을 쓰고, 판정·상태 캡션도 셀 단위로 표시한다.
function LogoCell({
	item,
	sizePx,
	kind,
	clearSpaceOn,
}: {
	item: LogoGroupItem
	sizePx: number
	kind: Kind
	clearSpaceOn: boolean
}) {
	const [fileHeight, setFileHeight] = useState<number | null>(null)

	useEffect(() => {
		const img = new Image()
		img.onload = () => setFileHeight(img.naturalHeight || null)
		img.src = item.logo
	}, [item.logo])

	const minSizePx = item.minSizePx
	const registeredMinPx = item.registeredMinPx
	const ratio = item.logoRealHeightPx && fileHeight ? item.logoRealHeightPx / fileHeight : 1
	const fileDisplayH = sizePx / ratio
	const tooSmall = kind === 'minSize' && sizePx < minSizePx
	const showClearSpace = kind === 'clearSpace' && clearSpaceOn && !!item.clearSpaceGuide
	const showMark = kind === 'registeredMark' && sizePx >= registeredMinPx && !!item.registeredMark

	return (
		<div className="flex flex-col">
			<div
				className="relative w-full overflow-hidden border border-border bg-background"
				style={{ height: CELL_H }}
			>
				<div
					className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 inline-block"
					style={{ height: fileDisplayH }}
				>
					{/* biome-ignore lint/performance/noImgElement: 원격 svg라 next/image 미사용. */}
					<img
						src={item.logo}
						alt={item.label || '로고'}
						className="block h-full w-auto max-w-none"
					/>
					{showClearSpace && item.clearSpaceGuide && (
						// biome-ignore lint/performance/noImgElement: 오버레이 svg.
						<img
							src={item.clearSpaceGuide}
							alt=""
							className="pointer-events-none absolute inset-0 h-full w-full max-w-none"
						/>
					)}
					{showMark && item.registeredMark && (
						// biome-ignore lint/performance/noImgElement: 오버레이 svg.
						<img
							src={item.registeredMark}
							alt=""
							className="pointer-events-none absolute inset-0 h-full w-full max-w-none"
						/>
					)}
				</div>
				{tooSmall && (
					<span
						aria-hidden
						className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-destructive/20 font-body font-medium text-destructive text-xs"
					>
						✕
					</span>
				)}
			</div>
			{/* 셀 하단: 라벨 + 로고별 임계값 상태 */}
			<div className="mt-2 flex flex-col gap-0.5">
				{item.label && (
					<span className="font-body font-medium text-muted-foreground text-xs">
						{item.label}
					</span>
				)}
				{kind === 'minSize' && (
					<span
						className="font-body text-xs"
						style={tooSmall ? { color: DANGER } : undefined}
					>
						{tooSmall
							? `최소 ${minSizePx}px 미만 — 사용 불가`
							: `최소 ${minSizePx}px 이상`}
					</span>
				)}
				{kind === 'registeredMark' && item.registeredMark && (
					<span className="font-body text-muted-foreground text-xs">
						{showMark
							? `® 표시 (≥ ${registeredMinPx}px)`
							: `® 숨김 (< ${registeredMinPx}px)`}
					</span>
				)}
			</div>
		</div>
	)
}

// 로고 그룹 뷰어 — logos(1~3)를 상단 1 + 하단 2로 배치. 슬라이더·토픽은 그룹 공유, 임계값은 로고별.
export function LogoGroupView({
	logos,
	topics,
}: {
	logos: LogoGroupItem[]
	topics: LogoGroupTopic[]
}) {
	const [active, setActive] = useState(0)
	const [sizePx, setSizePx] = useState(120)
	const [clearSpaceOn, setClearSpaceOn] = useState(true)

	if (logos.length === 0 || topics.length === 0) return null
	const index = Math.min(active, topics.length - 1)
	const topic = topics[index]
	const kind = topic.kind
	const showSlider = kind === 'minSize' || kind === 'registeredMark'
	// 클리어스페이스 토글은 그룹 내 하나라도 오버레이 에셋이 있을 때만 노출한다.
	const anyClearSpace = logos.some((l) => !!l.clearSpaceGuide)

	const cellProps = { sizePx, kind, clearSpaceOn }
	const [first, ...rest] = logos // rest = 하단 행(최대 2)

	return (
		<div className="w-full">
			{/* 로고 그룹 — 상단 1 + 하단 2(수평) */}
			<div className="flex flex-col gap-2">
				<LogoCell item={first} {...cellProps} />
				{rest.length > 0 && (
					<div
						className={`grid gap-2 ${rest.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
					>
						{rest.map((item) => (
							<LogoCell key={item.id} item={item} {...cellProps} />
						))}
					</div>
				)}
			</div>

			{/* 탭 + 텍스트 + 컨트롤 — 수평 2분할 오른쪽(그룹 공유) */}
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
					{/* 텍스트 */}
					<div className="flex flex-col gap-3">
						<h3 className="font-body font-semibold text-sm">{topic.label}</h3>
						{topic.description}
					</div>
					{/* 컨트롤 (설명 아래) — 슬라이더는 공유 크기, 임계값 상태는 각 셀에 표시된다. */}
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
						{kind === 'clearSpace' && anyClearSpace && (
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
