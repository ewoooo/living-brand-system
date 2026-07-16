'use client'

import { useId, useState } from 'react'

// 라이브 서체 견본: PDF 캡쳐 대신 실제 웹폰트로 렌더한다.
// 변수폰트면 weight 슬라이더로 실시간 스크럽 → "캡쳐가 아니라 작동하는 시스템"을 보여주는 조각.

export type TypeSpecimenSpec = { label: string; value: string }

export function TypeSpecimen({
	name,
	usage,
	fontFamily,
	display,
	specimen,
	specs,
	weightRange,
}: {
	name: string
	usage?: string
	fontFamily: string
	display: string
	specimen?: string
	specs?: TypeSpecimenSpec[]
	// 변수폰트일 때만 전달: [min, max, 기본값]. 없으면 정적 견본.
	weightRange?: [number, number, number]
}) {
	const sliderId = useId()
	const [weight, setWeight] = useState(weightRange?.[2] ?? 400)

	return (
		<div className="rounded-lg border border-scrim/10 bg-background-secondary p-8">
			<div className="flex items-baseline justify-between gap-4">
				<h4 className="type-title-2-emphasized text-foreground">{name}</h4>
				{usage && (
					<span className="type-caption-1 shrink-0 text-foreground-muted">{usage}</span>
				)}
			</div>

			<p
				className="mt-6 break-keep text-foreground leading-[0.95] [font-size:clamp(2.5rem,7vw,5.5rem)]"
				style={{ fontFamily, fontWeight: weight }}
			>
				{display}
			</p>

			{weightRange && (
				<div className="mt-6 flex items-center gap-4">
					<label
						htmlFor={sliderId}
						className="type-caption-1 shrink-0 text-foreground-muted"
					>
						Weight
					</label>
					<input
						id={sliderId}
						type="range"
						min={weightRange[0]}
						max={weightRange[1]}
						value={weight}
						onChange={(e) => setWeight(Number(e.target.value))}
						className="h-1 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-fill-muted accent-foreground"
					/>
					<span className="type-caption-1 w-10 shrink-0 text-right text-foreground tabular-nums">
						{weight}
					</span>
				</div>
			)}

			{specimen && (
				<p
					className="mt-6 max-w-2xl break-keep text-foreground-muted [font-size:clamp(0.875rem,1.4vw,1.125rem)] leading-relaxed"
					style={{ fontFamily }}
				>
					{specimen}
				</p>
			)}

			{specs && specs.length > 0 && (
				<dl className="mt-6 flex flex-wrap gap-2">
					{specs.map((spec) => (
						<div
							key={spec.label}
							className="flex items-baseline gap-1.5 rounded-full bg-fill-muted px-3 py-1"
						>
							<dt className="type-caption-1 text-foreground-muted">{spec.label}</dt>
							<dd className="type-caption-1-emphasized text-foreground tabular-nums">
								{spec.value}
							</dd>
						</div>
					))}
				</dl>
			)}
		</div>
	)
}
