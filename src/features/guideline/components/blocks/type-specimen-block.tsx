'use client'

import { useId, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { GuidelineDocument } from '@/payload-types'
import { resolveTypeface, TypefaceFontFace } from './children/typeface-font-face'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type TypeSpecimen = Extract<GuidelineBlock, { blockType: 'typeSpecimen' }>

// 라이브 타입 스페시먼: 브랜드 타이틀 폰트로 직접 타이핑하며 정렬·크기·줄간격을 조절한다.
// 초기 샘플 문구만 블록 데이터에서 오고, 타이핑·정렬·행간 상태는 클라이언트 전용(저장 안 함).
// 크기는 word/sentence/paragraph tier로 구분 — tier를 바꿔도 각자의 편집 내용이 보존된다.

const TIER_PRESETS = {
	word: { label: 'Word', size: 96, fallback: 'Aa' },
	sentence: {
		label: 'Sentence',
		size: 40,
		fallback: 'The quick brown fox jumps over the lazy dog.',
	},
	paragraph: {
		label: 'Paragraph',
		size: 18,
		fallback:
			'Typography gives language a durable visual form. Set a paragraph to judge rhythm, spacing, and tone at reading size.',
	},
} as const

type Tier = keyof typeof TIER_PRESETS
type Align = 'left' | 'center' | 'right'

export function TypeSpecimenBlock({ block }: { block: TypeSpecimen }) {
	const [tier, setTier] = useState<Tier>('word')
	const [align, setAlign] = useState<Align>('center')
	const [lineHeight, setLineHeight] = useState(1.2)
	const [texts, setTexts] = useState<Record<Tier, string>>(() => ({
		word: block.samples?.word?.trim() || TIER_PRESETS.word.fallback,
		sentence: block.samples?.sentence?.trim() || TIER_PRESETS.sentence.fallback,
		paragraph: block.samples?.paragraph?.trim() || TIER_PRESETS.paragraph.fallback,
	}))
	const sliderId = useId()
	const typeface = resolveTypeface(block.typeface)
	const fontFamily = typeface
		? `"${typeface.familyName}", var(--font-title)`
		: 'var(--font-title)'

	return (
		<div className="rounded-lg bg-neutral-50 p-8">
			<TypefaceFontFace typeface={block.typeface} />
			<div className="flex flex-wrap items-end gap-x-8 gap-y-4">
				<Field label="Size">
					<ToggleGroup
						type="single"
						value={tier}
						onValueChange={(v) => v && setTier(v as Tier)}
					>
						{(Object.keys(TIER_PRESETS) as Tier[]).map((key) => (
							<ToggleGroupItem
								key={key}
								value={key}
								className="px-3"
								variant="outline"
							>
								{TIER_PRESETS[key].label}
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
						<ToggleGroupItem value="left" className="px-3" variant="outline">
							Left
						</ToggleGroupItem>
						<ToggleGroupItem value="center" className="px-3" variant="outline">
							Center
						</ToggleGroupItem>
						<ToggleGroupItem value="right" className="px-3" variant="outline">
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
						<span className="w-8 shrink-0 font-body text-xs font-normal text-foreground tabular-nums">
							{lineHeight.toFixed(2)}
						</span>
					</div>
				</Field>
			</div>

			<textarea
				aria-label="타입 견본 입력"
				value={texts[tier]}
				onChange={(e) => setTexts((prev) => ({ ...prev, [tier]: e.target.value }))}
				className="mt-16 h-64 w-full resize-none overflow-auto break-keep border-none bg-transparent text-foreground outline-none"
				style={{
					fontFamily,
					fontSize: TIER_PRESETS[tier].size,
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
			<span className="font-body text-xs font-normal text-muted-foreground uppercase tracking-wide">
				{label}
			</span>
			{children}
		</div>
	)
}
