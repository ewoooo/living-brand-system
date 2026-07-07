'use client'

import { type ReactNode, useState } from 'react'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { CheckImageContext } from '@/features/asset-check/hooks/use-check-images'
import { CHECK_SCENARIOS, getCheckScenario } from '@/features/asset-check/scenarios'
import type {
	CheckImage,
	CheckImageContextValue,
	ImageContentFlags,
} from '@/features/asset-check/types'

/**
 * 검수 대상 이미지 목록·선택 상태·포함 요소 플래그를 check 작업 영역 전체에 제공한다.
 * 검수는 업로드/토글 시 자동 실행하지 않고 runCheck(검수 버튼)로만 트리거한다.
 * 판정은 서버(/api/check)가 소유하고, 클라이언트는 미리보기(object URL)와 진행 표시만 담당한다.
 */
export function CheckImageProvider({ children }: { children: ReactNode }) {
	const [images, setImages] = useState<CheckImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [contentFlags, setContentFlags] = useState<ImageContentFlags>({
		...CHECK_SCENARIOS[0].flags,
	})
	const [scenarioKey, setScenarioKeyValue] = useState(CHECK_SCENARIOS[0].key)
	const [flagsLocked, setFlagsLocked] = useState(false)

	// 서버 즉시 판정을 먼저 받고, AI 룰만 후속 요청으로 이어 붙인다.
	async function submitCheck(id: string, file: File, flags: ImageContentFlags) {
		setImages((prev) =>
			prev.map((image) =>
				image.id === id
					? { ...image, status: '진행', results: undefined, pendingRuleKeys: undefined }
					: image,
			),
		)
		try {
			const form = new FormData()
			form.append('image', file)
			form.append('flags', JSON.stringify(flags))
			form.append('scenarioKey', scenarioKey)
			form.append('source', 'review-page')
			const response = await fetch('/api/check', { method: 'POST', body: form })
			if (!response.ok) throw new Error(`check failed: ${response.status}`)
			const { checkSessionId, results, pendingRuleKeys } = (await response.json()) as {
				checkSessionId: number
				results: Record<string, CheckResult>
				pendingRuleKeys: string[]
			}
			setImages((prev) =>
				prev.map((image) =>
					image.id === id
						? {
								...image,
								checkSessionId,
								results,
								pendingRuleKeys,
								status: pendingRuleKeys.length > 0 ? '진행' : '완료',
							}
						: image,
				),
			)
			if (pendingRuleKeys.length > 0) {
				void runAiCheck(id, file, checkSessionId, pendingRuleKeys)
			}
		} catch {
			// 실패 시 결과 없이 종료 — 재검수는 검수 버튼으로 다시 트리거한다.
			setImages((prev) =>
				prev.map((image) =>
					image.id === id
						? { ...image, status: '대기', pendingRuleKeys: undefined }
						: image,
				),
			)
		}
	}

	async function runAiCheck(
		id: string,
		file: File,
		checkSessionId: number,
		pendingRuleKeys: string[],
	) {
		try {
			const form = new FormData()
			form.append('image', file)
			form.append('checkSessionId', String(checkSessionId))
			form.append('ruleKeys', JSON.stringify(pendingRuleKeys))
			const response = await fetch('/api/check/ai', { method: 'POST', body: form })
			if (!response.ok) throw new Error(`ai check failed: ${response.status}`)
			const { results } = (await response.json()) as { results: Record<string, CheckResult> }
			setImages((prev) =>
				prev.map((image) =>
					image.id === id
						? {
								...image,
								results: { ...image.results, ...results },
								pendingRuleKeys: undefined,
								status: '완료',
							}
						: image,
				),
			)
		} catch {
			const results = Object.fromEntries(
				pendingRuleKeys.map((key) => [
					key,
					{
						executor: 'heuristic',
						status: 'needs_review',
						fulfillment: null,
						detail: 'AI 평가 실패',
					},
				]),
			) as Record<string, CheckResult>
			setImages((prev) =>
				prev.map((image) =>
					image.id === id
						? {
								...image,
								results: { ...image.results, ...results },
								pendingRuleKeys: undefined,
								status: '완료',
							}
						: image,
				),
			)
		}
	}

	function addFiles(files: FileList | File[]) {
		const added: CheckImage[] = []
		for (const file of files) {
			if (!file.type.startsWith('image/')) continue
			added.push({
				id: crypto.randomUUID(),
				url: URL.createObjectURL(file),
				name: file.name,
				file,
				status: '대기',
			})
		}
		if (added.length === 0) return
		// 최신이 좌측으로 오도록 앞에 쌓는다
		setImages((prev) => [...added, ...prev])
		setSelectedId(added[0].id)
		// 새 이미지 업로드 → 플래그 재활성화. 검수는 자동 실행하지 않고 버튼으로만 한다.
		setFlagsLocked(false)
	}

	function select(id: string) {
		setSelectedId(id)
	}

	function setContentFlag(key: keyof ImageContentFlags, value: boolean) {
		setContentFlags((prev) => ({ ...prev, [key]: value }))
	}

	function setScenarioKey(key: string) {
		const scenario = getCheckScenario(key)
		setScenarioKeyValue(scenario.key)
		setContentFlags({ ...scenario.flags })
	}

	function runCheck() {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		setFlagsLocked(true)
		void submitCheck(target.id, target.file, contentFlags)
	}

	const value: CheckImageContextValue = {
		images,
		selectedId,
		selected: images.find((image) => image.id === selectedId) ?? null,
		select,
		addFiles,
		contentFlags,
		flagsLocked,
		setContentFlag,
		scenarioKey,
		setScenarioKey,
		runCheck,
	}

	return <CheckImageContext.Provider value={value}>{children}</CheckImageContext.Provider>
}
