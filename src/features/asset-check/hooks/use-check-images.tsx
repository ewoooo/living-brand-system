'use client'

import { createContext, type ReactNode, use, useEffect, useMemo, useRef, useState } from 'react'
import { runFullCheck } from '@/features/asset-check/services/submit-check.client'
import type { CheckImage, CheckImageContextValue } from '@/features/asset-check/types'
import { isSupportedCheckImageMediaType } from '@/features/asset-check/utils/image-format'
import { type CheckScenario, getCheckScenario } from '@/features/quality-rule/check-scenario'
import { revokeBlob } from '@/lib/object-url'

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
 * 판정은 서버(/api/check)가, 요청 순서·폴백은 submit-check.client의 runFullCheck가 소유하고,
 * 이 프로바이더는 미리보기(object URL)와 진행 상태 반영만 담당한다.
 *
 * in  (서버): scenarios: CheckScenario[] { key, title, checkKeys[] }
 * out (컨텍스트): CheckImageContextValue — 스키마는 types.ts 참조
 *
 * CheckImage.status 전이:
 * idle ─runCheck→ running ─서버 즉시판정→ (pendingCheckKeys 있으면 running 유지)
 *      ─AI 후속판정/폴백→ completed   |   서버 실패→ failed
 * 시나리오 변경 시: checkSessionId·results·pendingCheckKeys·rulesetSnapshot 폐기 → idle
 */
export function CheckImageProvider({
	children,
	scenarios,
}: {
	children: ReactNode
	scenarios: CheckScenario[]
}) {
	const [images, setImages] = useState<CheckImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [scenarioKey, setScenarioKeyValue] = useState(getCheckScenario(scenarios).key)
	const [showFailOnly, setShowFailOnly] = useState(false)

	// 미리보기 object URL은 언마운트 시 일괄 해제한다(이미지는 제거 경로가 없어 세션 동안 유지됨).
	const imagesRef = useRef(images)
	imagesRef.current = images
	useEffect(
		() => () => {
			for (const image of imagesRef.current) revokeBlob(image.url)
		},
		[],
	)

	function patchImage(id: string, patch: (image: CheckImage) => Partial<CheckImage>) {
		setImages((prev) =>
			prev.map((image) => (image.id === id ? { ...image, ...patch(image) } : image)),
		)
	}

	// 요청 순서·폴백은 runFullCheck가 소유하고, 여기서는 진행 결과를 화면 상태로 반영만 한다.
	// 시나리오/세션 가드는 화면 상태(현재 이미지)에 의존하므로 콜백 쪽에 남긴다.
	function startCheck(id: string, file: File, checkScenarioKey: string) {
		patchImage(id, () => ({
			scenarioKey: checkScenarioKey,
			status: 'running',
			results: undefined,
			pendingCheckKeys: undefined,
			rulesetSnapshot: undefined,
		}))
		void runFullCheck(file, checkScenarioKey, {
			onServerResult: ({ checkSessionId, results, pendingCheckKeys, rulesetSnapshot }) => {
				patchImage(id, (image) => {
					// 대기 중 시나리오가 바뀌면 이전 시나리오 판정은 버린다
					if (image.scenarioKey !== checkScenarioKey) return {}
					return {
						checkSessionId,
						results,
						pendingCheckKeys,
						rulesetSnapshot,
						status: pendingCheckKeys.length > 0 ? 'running' : 'completed',
					}
				})
			},
			onAiResult: (checkSessionId, results) => {
				patchImage(id, (image) => {
					// 시나리오 변경·재검수로 세션이 교체됐으면 이 응답은 버린다
					if (image.checkSessionId !== checkSessionId) return {}
					return {
						results: { ...image.results, ...results },
						pendingCheckKeys: undefined,
						status: 'completed',
					}
				})
			},
		}).catch(() => {
			// 서버 즉시 판정 실패 — 결과 없이 종료, 재검수는 검수 버튼으로 다시 트리거한다.
			patchImage(id, () => ({ status: 'failed', pendingCheckKeys: undefined }))
		})
	}

	function addFiles(files: FileList | File[]) {
		const added: CheckImage[] = []
		for (const file of files) {
			if (!isSupportedCheckImageMediaType(file.type)) continue
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
		const scenario = getCheckScenario(scenarios, key)
		setScenarioKeyValue(scenario.key)
		if (!selectedId) return
		// 시나리오가 바뀌면 진행 중 검수는 무효이므로 idle로 되돌리고 재검수를 기다린다
		patchImage(selectedId, () => ({
			checkSessionId: undefined,
			scenarioKey: scenario.key,
			results: undefined,
			pendingCheckKeys: undefined,
			rulesetSnapshot: undefined,
			status: 'idle',
		}))
	}

	function runCheck() {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		if (target.status === 'running') return // 검수 진행 중 중복 실행 방지
		startCheck(target.id, target.file, target.scenarioKey)
	}

	// selected 참조를 안정화해 소비 측 useMemo(뷰 계산)가 불필요하게 무효화되지 않게 한다
	const selected = useMemo(
		() => images.find((image) => image.id === selectedId) ?? null,
		[images, selectedId],
	)

	const value: CheckImageContextValue = {
		scenarios,
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
