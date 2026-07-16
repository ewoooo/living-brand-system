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
	const { scenarios, selectedId, selected, scenarioKey, setScenarioKey, runCheck } =
		useCheckImages()

	return (
		<section className="pointer-events-none absolute inset-x-4 top-4 bottom-4 z-10 flex flex-col items-center justify-between">
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
			<div className="flex flex-col items-center gap-2">
				{selected?.status === 'failed' && (
					<p
						role="alert"
						className="type-caption-1 pointer-events-auto rounded-md bg-destructive/10 px-3 py-1.5 text-destructive"
					>
						검수 요청에 실패했습니다. 다시 검수하기를 눌러주세요.
					</p>
				)}
				<Button
					type="button"
					size="lg"
					className="pointer-events-auto min-w-44 rounded-full p-6 px-12"
					disabled={!selectedId || selected?.status === 'running'}
					onClick={runCheck}
				>
					{selected?.status === 'running' ? (
						<>
							<Spinner />
							<span className="sr-only">검수 중</span>
						</>
					) : (
						<span className="type-body">
							{selected?.status === 'failed' ? '다시 검수하기' : '검수하기'}
						</span>
					)}
				</Button>
			</div>
		</section>
	)
}
