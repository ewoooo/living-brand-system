'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CONTROL_VALUE } from '../readout'
import { THEME_PANEL } from '../surface'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/type-specimen) 통째 삭제.
//
// 위젯(클라): 라이브 타입 스페시먼. author 인스턴스(samples/typeface) 없이 자족 렌더 — 표본은 TIER_PRESETS
// 하드코딩, 서체는 전역 var(--font-title). 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각만.
// 조립 로직은 blocks/type-specimen/component.tsx와 동일.

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

export function TypeSpecimenWidget() {
	const [tier, setTier] = useState<Tier>('word')
	const [align, setAlign] = useState<Align>('center')
	const [lineHeight, setLineHeight] = useState(1.2)
	const [texts, setTexts] = useState<Record<Tier, string>>(() => ({
		word: TIER_PRESETS.word.fallback,
		sentence: TIER_PRESETS.sentence.fallback,
		paragraph: TIER_PRESETS.paragraph.fallback,
	}))
	const fontFamily = 'var(--font-title)'

	return (
		// 서체를 얹지만 규정이 정한 판이 아니라 위젯 UI의 패널이다 — 테마를 따라간다.
		<div className={`rounded-lg p-8 ${THEME_PANEL}`}>
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
						<Slider
							min={0.9}
							max={2}
							step={0.05}
							value={[lineHeight]}
							onValueChange={([next]) => setLineHeight(next ?? 1.2)}
							// Field의 라벨은 <span>이라 컨트롤과 이어지지 않는다 — 이름을 직접 준다.
							aria-label="Leading"
							className="w-40"
						/>
						<span className={`w-8 shrink-0 text-xs font-normal ${CONTROL_VALUE}`}>
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

export default TypeSpecimenWidget

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
