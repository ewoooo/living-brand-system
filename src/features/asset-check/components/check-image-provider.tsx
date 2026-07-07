'use client'

import { createContext, type ReactNode, use, useState } from 'react'
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

	function patchImage(id: string, patch: (image: CheckImage) => Partial<CheckImage>) {
		setImages((prev) =>
			prev.map((image) => (image.id === id ? { ...image, ...patch(image) } : image)),
		)
	}

	// 서버 즉시 판정을 먼저 받고, AI 룰만 후속 요청으로 이어 붙인다.
	async function runServerCheck(id: string, file: File) {
		patchImage(id, () => ({ status: '진행', results: undefined, pendingRuleKeys: undefined }))
		try {
			const { checkSessionId, results, pendingRuleKeys } = await submitCheck(
				file,
				scenarioKey,
			)
			patchImage(id, () => ({
				checkSessionId,
				results,
				pendingRuleKeys,
				status: pendingRuleKeys.length > 0 ? '진행' : '완료',
			}))
			if (pendingRuleKeys.length > 0) {
				void finishAiCheck(id, file, checkSessionId, pendingRuleKeys)
			}
		} catch {
			// 실패 시 결과 없이 종료 — 재검수는 검수 버튼으로 다시 트리거한다.
			patchImage(id, () => ({ status: '대기', pendingRuleKeys: undefined }))
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
		patchImage(id, (image) => ({
			results: { ...image.results, ...results },
			pendingRuleKeys: undefined,
			status: '완료',
		}))
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
	}

	function setScenarioKey(key: string) {
		const scenario = getCheckScenario(key)
		setScenarioKeyValue(scenario.key)
	}

	function runCheck() {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		void runServerCheck(target.id, target.file)
	}

	const value: CheckImageContextValue = {
		images,
		selectedId,
		selected: images.find((image) => image.id === selectedId) ?? null,
		select: setSelectedId,
		addFiles,
		scenarioKey,
		setScenarioKey,
		runCheck,
	}

	return <CheckImageContext.Provider value={value}>{children}</CheckImageContext.Provider>
}
