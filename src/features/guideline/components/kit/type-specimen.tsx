'use client'

import { useId, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// 라이브 타입 스페시먼: 브랜드 폰트(Essenflux, 한글은 Pretendard 폴백)로 직접 타이핑하며
// 정렬·크기·줄간격을 조절한다. textarea라 엔터/편집이 네이티브로 동작.
// 크기는 단일 슬라이더가 아니라 word/sentence/paragraph tier로 구분 — 각 tier가 프리셋 크기와
// 자기 샘플 텍스트를 갖고, tier를 바꿔도 각자의 편집 내용이 보존된다.

const TIERS = {
	word: { label: 'Word', size: 96, sample: 'Essenherb' },
	sentence: { label: 'Sentence', size: 40, sample: 'Vegan skincare, rooted in nature.' },
	paragraph: {
		label: 'Paragraph',
		size: 18,
		sample: 'Essenherb finds the vitality of nature that endures even in harsh environments, and returns it to the skin. A vegan skincare brand focused on the essence of the skin.',
	},
} as const

type Tier = keyof typeof TIERS
type Align = 'left' | 'center' | 'right'

export function TypeSpecimen() {
	const [tier, setTier] = useState<Tier>('word')
	const [align, setAlign] = useState<Align>('left')
	const [lineHeight, setLineHeight] = useState(1.2)
	const [texts, setTexts] = useState<Record<Tier, string>>(
		() =>
			Object.fromEntries(Object.entries(TIERS).map(([key, t]) => [key, t.sample])) as Record<
				Tier,
				string
			>,
	)
	const sliderId = useId()

	return (
		<div className="rounded-lg bg-background-tertiary p-8">
			<div className="flex flex-wrap items-end gap-x-8 gap-y-4">
				<Field label="Size">
					<ToggleGroup
						type="single"
						value={tier}
						onValueChange={(v) => v && setTier(v as Tier)}
					>
						{(Object.keys(TIERS) as Tier[]).map((key) => (
							<ToggleGroupItem key={key} value={key} className="px-3">
								{TIERS[key].label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</Field>

				<Field label="Align">
					<ToggleGroup
						type="single"
						value={align}
						onValueChange={(v) => v && setAlign(v as Align)}
					>
						<ToggleGroupItem value="left" className="px-3">
							Left
						</ToggleGroupItem>
						<ToggleGroupItem value="center" className="px-3">
							Center
						</ToggleGroupItem>
						<ToggleGroupItem value="right" className="px-3">
							Right
						</ToggleGroupItem>
					</ToggleGroup>
				</Field>

				<Field label="Leading">
					<div className="flex items-center gap-3">
						<input
							id={sliderId}
							type="range"
							min={0.9}
							max={2}
							step={0.05}
							value={lineHeight}
							onChange={(e) => setLineHeight(Number(e.target.value))}
							className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-background accent-foreground"
						/>
						<span className="type-caption-1 w-8 shrink-0 text-foreground tabular-nums">
							{lineHeight.toFixed(2)}
						</span>
					</div>
				</Field>
			</div>

			<textarea
				aria-label="타입 견본 입력"
				value={texts[tier]}
				onChange={(e) => setTexts((prev) => ({ ...prev, [tier]: e.target.value }))}
				className="mt-8 h-64 w-full resize-none overflow-auto break-keep border-none bg-transparent text-foreground outline-none"
				style={{
					fontFamily: 'var(--font-title)',
					fontSize: TIERS[tier].size,
					lineHeight,
					textAlign: align,
				}}
			/>
		</div>
	)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="type-caption-1 text-foreground-muted uppercase tracking-wide">
				{label}
			</span>
			{children}
		</div>
	)
}
