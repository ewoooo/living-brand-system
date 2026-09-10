'use client'

import { Controller } from '@/components/shared/controller'
import { Typography } from '@/components/ui/typography'
import {
	listTemplateLayerGroups,
	type TemplateLayerGroup,
} from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import { cn } from '@/lib/utils'

/**
 * 레이어 패널 — **viewer다.** 순서를 편집하지 않는다(사용자 지시, 2026-09-10).
 *
 * 있는 이유 둘:
 * 1. 우측 컨트롤러가 너무 많다 — 묶음을 고르면 그 묶음의 컨트롤만 남는다.
 * 2. 창작자가 대략적인 레이어 계층을 알고는 있어야 한다.
 *
 * 🔴 **일러스트레이터·피그마처럼 모든 레이어를 보여 주지 않는다.** text·image·CI·background의
 *    **몇 개의 큰 묶음**이다(사용자 지시) — 슬롯이 7개인 템플릿도 목록은 4줄이다. 묶음의 정의는
 *    `listTemplateLayerGroups`가 소유하고 사이드바가 같은 것을 본다.
 * 🔴 **자기 위치를 모른다.** 값을 prop으로 받지 않고 컨텍스트에서 직접 읽으므로 좌·우·헤더·본문
 *    어디에 꽂아도 그대로 돈다 — 위치를 정하는 코드는 꽂는 자리 한 줄뿐이다.
 * 🔴 **선택(`layers.selectedGroup`)과 `focus`는 다른 것이다.** 선택은 여기서만 바뀌고, `focus`는
 *    「지금 만지는 자리」라 입력칸에 커서만 들어가도 바뀐다 — 하나로 합치면 컨트롤을 만지는 순간
 *    방금 고른 것이 풀려 컨트롤이 통째로 사라진다.
 * 🔑 그래도 고를 때 `focus`도 같이 준다 — 캔버스 하이라이트가 그것을 읽으므로 묶음을 고르면
 *    판에서 그 묶음의 노드가 **한꺼번에** 밝아진다.
 */
export function TemplateLayerPanel() {
	const { config, layers, focus } = useTemplateStudio()
	const groups = listTemplateLayerGroups(config.template.slots)

	const select = (group: TemplateLayerGroup) => {
		const next = layers.selectedGroup === group.kind ? null : group.kind
		layers.select(next)
		focus.set(next ? focusTargetOf(group) : null)
	}

	return (
		<Controller.Group title="Layers" collapsible>
			{groups.length === 0 ? (
				<Typography size="sm" tone="muted">
					이 템플릿에는 레이어가 없습니다.
				</Typography>
			) : (
				<ul className="flex flex-col gap-0.5">
					{groups.map((group) => (
						<li key={group.kind}>
							<button
								type="button"
								aria-pressed={layers.selectedGroup === group.kind}
								onClick={() => select(group)}
								className={cn(
									'flex w-full min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
									'hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
									layers.selectedGroup === group.kind &&
										'bg-accent font-semibold',
								)}
							>
								<span className="min-w-0 flex-1 truncate">{group.label}</span>
								{/* 🔑 개수는 **여럿일 때만** — 「이미지 1」은 알려 주는 것이 없다. */}
								{group.nodeIds.length > 1 && (
									<span className="shrink-0 text-muted-foreground text-xs">
										{group.nodeIds.length}
									</span>
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</Controller.Group>
	)
}

/**
 * 묶음을 캔버스가 집을 대상으로 바꾼다.
 * 🔴 배경은 노드가 아니라 도화지다 — `kind: 'canvas'`이고 nodeIds를 갖지 않는다.
 */
function focusTargetOf(group: TemplateLayerGroup) {
	return group.kind === 'background'
		? ({ sectionId: 'section:background', kind: 'canvas' } as const)
		: ({ sectionId: `group:${group.kind}`, kind: 'nodes', nodeIds: group.nodeIds } as const)
}
