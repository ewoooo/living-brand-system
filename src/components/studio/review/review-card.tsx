'use client'

import { Menu } from '@carbon/icons-react'
import { useState } from 'react'
import { Controller } from '@/components/shared/controller'
import { CheckVerdictStatus } from '@/components/studio/review/result/check-verdict-status'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CheckImage } from '@/features/asset-check/types'
import { checkImageVerdict } from '@/features/asset-check/utils/check-image-verdict'
import { type CheckScenario, getCheckScenario } from '@/features/quality-rule/check-scenario'

/**
 * 시나리오 한 줄 — 킷의 셀렉트 옵션(`ROW_SELECT_ITEM`)과 같은 어휘다: 기본은 muted 글자,
 * 고른 것만 muted 채움 + foreground 글자(디자인 60:3288의 채움 실측 #F2F2F2 = `--muted`).
 *
 * 🔴 toggle의 기본 on-state(primary 채움)를 덮는다. 이 자리는 세그먼트가 아니라 셀렉트 목록이라,
 *    항목 하나를 primary로 칠하면 패널 하단의 실행 CTA와 같은 무게가 된다.
 */
const SCENARIO_OPTION =
	'w-full justify-start px-2 text-muted-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground data-[state=on]:hover:bg-muted data-[state=on]:hover:text-foreground'

type ReviewCardProps = {
	image: CheckImage
	/** 발행된 검수 시나리오 — 행의 이름 표시와 셀렉트 선택지가 같은 목록에서 나온다. */
	scenarios: CheckScenario[]
	selected: boolean
	onOpen: () => void
	onScenarioChange: (scenarioKey: string) => void
}

/**
 * 검수 대상 파일 카드 — 목록 행 하나와 그 행의 시나리오 셀렉트.
 * 디자인 SSOT: Figma HD_LBS_UI 59:2757(Item) · 60:3287(Scenario Select).
 *
 * 행의 시각은 킷(`Controller.ListRow`)이 갖고 이 컴포넌트는 무엇을 보여줄지만 정한다.
 *
 * 🔴 행 끝 자리는 검사 전후로 주인이 바뀐다 — 검사 전에는 시나리오 셀렉트, 판정이 나오면 종합 판정
 *    타일이다(디자인 59:2757 vs 59:2839). 그래서 판정이 난 파일은 시나리오를 바꿀 수 없다.
 *    디자인이 한 자리에 둘을 겹쳐 둔 결과이며, 바꾸려면 파일을 다시 올린다.
 */
export function ReviewCard({
	image,
	scenarios,
	selected,
	onOpen,
	onScenarioChange,
}: ReviewCardProps) {
	const [open, setOpen] = useState(false)
	// 판정이 하나도 없을 때만 고를 수 있다. 진행 중·검사 실패는 자기 표시가 그 자리를 쓴다.
	const selectable = checkImageVerdict(image) === 'idle'

	return (
		<Collapsible
			data-slot="review-card"
			open={open}
			onOpenChange={setOpen}
			className="relative"
		>
			<Controller.ListRow
				caption={
					scenarios.length > 0 && image.scenarioKey
						? getCheckScenario(scenarios, image.scenarioKey).title
						: '시나리오 없음'
				}
				label={image.name}
				selected={selected}
				onClick={onOpen}
				// 셀렉트 트리거는 행 버튼의 형제로 겹쳐 앉는다(버튼 안에 버튼을 넣지 않는다) —
				// 그만큼 파일 이름이 밀려나갈 자리를 비워 둔다.
				className={selectable ? 'pr-12' : undefined}
				trailing={<CheckVerdictStatus image={image} />}
			/>
			{selectable && (
				<>
					{/*
					 * 범용 트리거를 새로 만들지 않는다(docs/10 §3.6) — 여는 대상은 이 컴포넌트 안의
					 * CollapsibleContent이고, 짝은 radix Collapsible 컨텍스트가 구조로 강제한다.
					 * `Controller.Action`은 그 트리거가 앉는 면(muted 행) 위의 표준 아이콘 버튼으로만 쓴다.
					 */}
					<CollapsibleTrigger asChild>
						<Controller.Action
							aria-label="검수 시나리오 선택"
							size="icon-lg"
							disabled={scenarios.length < 2}
							className="absolute top-1.5 right-1.5 data-[state=open]:bg-foreground/10"
						>
							<Menu aria-hidden />
						</Controller.Action>
					</CollapsibleTrigger>
					<CollapsibleContent className="pt-1">
						{/*
						 * 🔴 `flex-col items-stretch`를 직접 준다. ui/toggle-group의 `data-vertical:`
						 *    변형은 `[data-vertical]` 속성을 찾는데 radix가 내는 것은
						 *    `data-orientation="vertical"`이라 걸리지 않는다(tailwind 4.3 컴파일 확인).
						 *    `orientation`은 그대로 넘긴다 — 위/아래 화살표 이동은 radix가 그 값으로 한다.
						 */}
						<ToggleGroup
							type="single"
							orientation="vertical"
							value={image.scenarioKey}
							onValueChange={(next) => {
								// 고른 항목을 다시 누르면 radix가 ''을 준다 — 시나리오 없는 상태로 만들지 않는다.
								if (!next) return
								onScenarioChange(next)
								setOpen(false)
							}}
							aria-label="검수 시나리오"
							className="w-full flex-col items-stretch gap-0 rounded-lg border border-border bg-background p-1"
						>
							{scenarios.map((scenario) => (
								<ToggleGroupItem
									key={scenario.key}
									value={scenario.key}
									className={SCENARIO_OPTION}
								>
									{scenario.title}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</CollapsibleContent>
				</>
			)}
		</Collapsible>
	)
}
