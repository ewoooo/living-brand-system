'use client'

import { Controller } from '@/components/shared/controller'
import { Typography } from '@/components/ui/typography'
import type { TemplateStudioConfigSlot } from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import { cn } from '@/lib/utils'

/**
 * 레이어 패널 — **viewer다.** 순서를 편집하지 않는다(사용자 지시, 2026-09-10).
 *
 * 있는 이유 둘:
 * 1. 우측 컨트롤러가 너무 많다 — 레이어를 고르면 그 레이어의 컨트롤만 남는다.
 * 2. 창작자가 대략적인 레이어 계층을 알고는 있어야 한다.
 *
 * 🔴 **자기 위치를 모른다.** 값을 prop으로 받지 않고 컨텍스트에서 직접 읽으므로 좌·우·헤더·본문
 *    어디에 꽂아도 그대로 돈다 — 위치를 정하는 코드는 꽂는 자리 한 줄뿐이다.
 * 🔴 **선택(`layers.selectedId`)과 `focus`는 다른 것이다.** 선택은 여기서만 바뀌고, `focus`는
 *    「지금 만지는 자리」라 입력칸에 커서만 들어가도 바뀐다 — 하나로 합치면 컨트롤을 만지는 순간
 *    방금 고른 레이어가 풀려 컨트롤이 통째로 사라진다.
 * 🔑 그래도 고를 때 `focus`도 같이 준다 — 캔버스 하이라이트가 그것을 읽으므로 레이어를 고르면
 *    판에서도 그 자리가 밝아진다.
 */
export function TemplateLayerPanel() {
	const { config, layers, focus } = useTemplateStudio()
	const select = (slotId: string) => {
		const next = layers.selectedId === slotId ? null : slotId
		layers.select(next)
		focus.set(next ? { sectionId: slotId, kind: 'nodes', nodeIds: [slotId] } : null)
	}
	// 🔴 슬롯 배열은 **그리는 순서(아래 → 위)** 다 — 목록은 그 역순으로, 판에서 맨 위인 것이
	//    목록에서도 맨 위다(Figma·Illustrator와 같은 방향). 배경은 맨 아래이므로 목록의 끝이다.
	const rows = [...config.template.slots].reverse()

	return (
		<Controller.Group title="Layers" collapsible>
			{rows.length === 0 ? (
				<Typography size="sm" tone="muted">
					이 템플릿에는 레이어가 없습니다.
				</Typography>
			) : (
				<ul className="flex flex-col gap-0.5">
					{rows.map((slot) => (
						<LayerRow
							key={slot.id}
							slot={slot}
							selected={layers.selectedId === slot.id}
							visible={layers.visibility[slot.id] ?? true}
							onSelect={() => select(slot.id)}
							onToggleVisible={(next) => layers.setVisible(slot.id, next)}
						/>
					))}
				</ul>
			)}
		</Controller.Group>
	)
}

/** 레이어 종류를 한 글자로 — 목록이 좁아도 무엇인지 구별된다. */
const KIND_LABEL = {
	background: '배경',
	image: '이미지',
	text: '텍스트',
	vector: '벡터',
} as const satisfies Record<TemplateStudioConfigSlot['kind'], string>

function LayerRow({
	slot,
	selected,
	visible,
	onSelect,
	onToggleVisible,
}: {
	slot: TemplateStudioConfigSlot
	selected: boolean
	visible: boolean
	onSelect: () => void
	onToggleVisible: (visible: boolean) => void
}) {
	return (
		<li className="flex items-center gap-1">
			<button
				type="button"
				aria-pressed={selected}
				onClick={onSelect}
				className={cn(
					'flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
					'hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
					selected && 'bg-accent font-semibold',
					// 숨긴 레이어는 목록에 남는다 — 지우면 되살릴 방법이 없다.
					!visible && 'text-muted-foreground',
				)}
			>
				<span className="min-w-0 flex-1 truncate">{slot.label}</span>
				<span className="shrink-0 text-muted-foreground text-xs">
					{KIND_LABEL[slot.kind]}
				</span>
			</button>
			{/* 🔴 표시/숨김은 정책이 허용할 때만 나온다 — 항상 보여야 하는 레이어가 있고,
			    배경은 정책 자체가 없다(끌 수 있는 것이 아니라 타입을 고르는 것이다). */}
			{slot.kind !== 'background' && slot.visibility.allowToggle && (
				<Controller.Segmented
					aria-label={`${slot.label} 표시`}
					value={visible ? 'on' : 'off'}
					options={[
						{ value: 'on', label: 'On' },
						{ value: 'off', label: 'Off' },
					]}
					onChange={(next) => onToggleVisible(next === 'on')}
				/>
			)}
		</li>
	)
}
