'use client'

import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'

/**
 * 퍼널 ②③ — 시나리오 선택 + 검수 실행 버튼 (캐러셀 위 오버레이).
 * in : 컨텍스트 { scenarios, selectedId, selected, scenarioKey, setScenarioKey, runCheck }
 * out: setScenarioKey(key: CheckScenario['key'])
 *        → 선택 이미지의 checkSessionId·results·pendingCheckKeys·rulesetSnapshot 폐기, idle 복귀
 *      runCheck() — selected.status === 'running'이면 무시(중복 실행 방지)
 * disabled 조건: !selectedId || selected.status === 'running'
 * selected.status === 'failed' → 실패 안내 표시, 같은 버튼으로 재검수
 */
export function ImageCheckControls() {
	return (
		<section className="pointer-events-none absolute inset-x-4 top-4 bottom-4 z-10 flex flex-col items-center justify-between">
			<CheckChangeScenario />
			<div className="flex flex-col items-center gap-2">
				<CheckButton />
			</div>
		</section>
	)
}

/** 검수 시나리오를 선택하고 실행 중에는 변경을 막는다. */
function CheckChangeScenario() {
	const { scenarios, scenarioKey, setScenarioKey, selected } = useCheckImages()

	return (
		<Select
			value={scenarioKey}
			disabled={selected?.status === 'running'}
			onValueChange={setScenarioKey}
		>
			<SelectTrigger className="pointer-events-auto self-end">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{scenarios.map((scenario) => (
						<SelectItem key={scenario.key} value={scenario.key}>
							{scenario.title}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}

/** 선택 이미지의 검수를 실행하고 진행·실패 상태를 함께 표시한다. */
function CheckButton() {
	const { selectedId, selected, runCheck } = useCheckImages()

	return (
		<>
			{selected?.status === 'failed' && (
				<p
					role="alert"
					className="pointer-events-auto rounded-md bg-destructive/10 px-3 py-1.5 font-body text-xs font-normal text-destructive"
				>
					검사 요청에 실패했습니다. 다시 검수하기를 눌러주세요.
				</p>
			)}
			<Button
				type="button"
				size="lg"
				shape="pill"
				className="pointer-events-auto min-w-44 p-6 px-12"
				disabled={!selectedId || selected?.status === 'running'}
				onClick={runCheck}
			>
				{selected?.status === 'running' ? (
					<>
						<Spinner />
						<span className="sr-only">검수 중</span>
					</>
				) : (
					<span className="font-body text-base font-normal">
						{selected?.status === 'failed' ? '다시 검사하기' : '검사하기'}
					</span>
				)}
			</Button>
		</>
	)
}
