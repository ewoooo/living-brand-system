'use client'

import { Controller } from '@/components/shared/controller'
import { Typography } from '@/components/ui/typography'
import type { TemplateEditableLayer } from '@/features/template-customization/domain/template-studio-config'
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
 * 🔑 선택은 기존 `focus`를 그대로 쓴다. 캔버스 하이라이트와 사이드바 강조가 이미 그것을 읽으므로,
 *    레이어를 고르면 캔버스에서도 그 자리가 밝아진다 — 새 상태를 만들지 않는다.
 */
export function TemplateLayerPanel() {
	const { config, layers, focus } = useTemplateStudio()
	const editable = config.template.slots.filter(
		(slot): slot is TemplateEditableLayer => slot.kind !== 'background',
	)

	return (
		<Controller.Group title="Layers" collapsible>
			{editable.length === 0 ? (
				<Typography size="sm" tone="muted">
					이 템플릿에는 편집 가능한 레이어가 없습니다.
				</Typography>
			) : (
				<ul className="flex flex-col gap-0.5">
					{/* 판 위에서 위에 있는 것이 목록에서도 위다 — 슬롯 순서를 뒤집지 않는다. */}
					{editable.map((slot) => (
						<LayerRow
							key={slot.id}
							slot={slot}
							selected={focus.target?.sectionId === slot.id}
							visible={layers.visibility[slot.id] ?? true}
							onSelect={() =>
								focus.set(
									focus.target?.sectionId === slot.id
										? null
										: { sectionId: slot.id, kind: 'nodes', nodeIds: [slot.id] },
								)
							}
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
	image: '이미지',
	text: '텍스트',
	vector: '벡터',
} as const satisfies Record<TemplateEditableLayer['kind'], string>

function LayerRow({
	slot,
	selected,
	visible,
	onSelect,
	onToggleVisible,
}: {
	slot: TemplateEditableLayer
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
			{/* 🔴 표시/숨김은 정책이 허용할 때만 나온다 — 항상 보여야 하는 레이어가 있다. */}
			{slot.visibility.allowToggle && (
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
