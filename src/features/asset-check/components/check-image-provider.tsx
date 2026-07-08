'use client'

import { createContext, type ReactNode, use, useMemo, useState } from 'react'
import { CHECK_SCENARIOS, getCheckScenario } from '@/features/asset-check/scenarios'
import {
	aiFailureResults,
	submitAiCheck,
	submitCheck,
} from '@/features/asset-check/services/submit-check.client'
import type { CheckImage, CheckImageContextValue } from '@/features/asset-check/types'

const CheckImageContext = createContext<CheckImageContextValue | null>(null)

export function useCheckImages() {
	const context = use(CheckImageContext)
	if (!context) {
		throw new Error('useCheckImages must be used within CheckImageProvider')
	}
	return context
}

/**
 * 검수 대상 이미지 목록·선택 상태를 check 작업 영역 전체에 제공한다.
 * 검수는 업로드/시나리오 변경 시 자동 실행하지 않고 runCheck(검수 버튼)로만 트리거한다.
 * 판정은 서버(/api/check)가, 요청 계약은 submit-check.client가 소유하고,
 * 이 프로바이더는 미리보기(object URL)와 진행 상태 반영만 담당한다.
 */
export function CheckImageProvider({ children }: { children: ReactNode }) {
	const [images, setImages] = useState<CheckImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [scenarioKey, setScenarioKeyValue] = useState(CHECK_SCENARIOS[0].key)
	const [showFailOnly, setShowFailOnly] = useState(false)

	function patchImage(id: string, patch: (image: CheckImage) => Partial<CheckImage>) {
		setImages((prev) =>
			prev.map((image) => (image.id === id ? { ...image, ...patch(image) } : image)),
		)
	}

	// 서버 즉시 판정을 먼저 받고, AI 룰만 후속 요청으로 이어 붙인다.
	async function runServerCheck(id: string, file: File, checkScenarioKey: string) {
		patchImage(id, () => ({
			scenarioKey: checkScenarioKey,
			status: 'running',
			results: undefined,
			pendingRuleKeys: undefined,
		}))
		try {
			const { checkSessionId, results, pendingRuleKeys } = await submitCheck(
				file,
				checkScenarioKey,
			)
			patchImage(id, (image) => {
				// 대기 중 시나리오가 바뀌면 이전 시나리오 판정은 버린다
				if (image.scenarioKey !== checkScenarioKey) return {}
				return {
					checkSessionId,
					results,
					pendingRuleKeys,
					status: pendingRuleKeys.length > 0 ? 'running' : 'completed',
				}
			})
			if (pendingRuleKeys.length > 0) {
				void finishAiCheck(id, file, checkSessionId, pendingRuleKeys)
			}
		} catch {
			// 실패 시 결과 없이 종료 — 재검수는 검수 버튼으로 다시 트리거한다.
			patchImage(id, () => ({ status: 'failed', pendingRuleKeys: undefined }))
		}
	}

	async function finishAiCheck(
		id: string,
		file: File,
		checkSessionId: number,
		pendingRuleKeys: string[],
	) {
		const results = await submitAiCheck(file, checkSessionId, pendingRuleKeys).catch(() =>
			aiFailureResults(pendingRuleKeys),
		)
		patchImage(id, (image) => {
			// 시나리오 변경·재검수로 세션이 교체됐으면 이 응답은 버린다
			if (image.checkSessionId !== checkSessionId) return {}
			return {
				results: { ...image.results, ...results },
				pendingRuleKeys: undefined,
				status: 'completed',
			}
		})
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
				scenarioKey,
				status: 'idle',
			})
		}
		if (added.length === 0) return
		// 최신이 좌측으로 오도록 앞에 쌓는다
		setImages((prev) => [...added, ...prev])
		setSelectedId(added[0].id)
	}

	function setScenarioKey(key: string) {
		const scenario = getCheckScenario(key)
		setScenarioKeyValue(scenario.key)
		if (!selectedId) return
		// 시나리오가 바뀌면 진행 중 검수는 무효이므로 idle로 되돌리고 재검수를 기다린다
		patchImage(selectedId, () => ({
			checkSessionId: undefined,
			scenarioKey: scenario.key,
			results: undefined,
			pendingRuleKeys: undefined,
			status: 'idle',
		}))
	}

	function runCheck() {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		if (target.status === 'running') return // 검수 진행 중 중복 실행 방지
		void runServerCheck(target.id, target.file, target.scenarioKey)
	}

	// selected 참조를 안정화해 소비 측 useMemo(뷰 계산)가 불필요하게 무효화되지 않게 한다
	const selected = useMemo(
		() => images.find((image) => image.id === selectedId) ?? null,
		[images, selectedId],
	)

	const value: CheckImageContextValue = {
		images,
		selectedId,
		selected,
		select: setSelectedId,
		addFiles,
		scenarioKey: selected?.scenarioKey ?? scenarioKey,
		setScenarioKey,
		showFailOnly,
		toggleFailOnly: () => setShowFailOnly((value) => !value),
		runCheck,
	}

	return <CheckImageContext.Provider value={value}>{children}</CheckImageContext.Provider>
}
