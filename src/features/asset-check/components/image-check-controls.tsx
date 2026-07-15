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
					<span className="type-body">검수하기</span>
				)}
			</Button>
		</section>
	)
}
