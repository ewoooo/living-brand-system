'use client'

import {
	createContext,
	type ReactNode,
	type RefObject,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	type ImageProfileOption,
	requestPublishedImageProfiles,
} from '@/features/generate-image/services/generate-image.client'
import { useTemplateExport } from '@/features/template-export/hooks/use-template-export'
import type { TemplateExportFormat } from '@/features/template-export/services/export-template.client'
import {
	type ImageTransformValue,
	toImageEditTransform,
} from '@/features/template-studio/image-edit-transform'
import {
	deriveTemplateConfig,
	isBackgroundSlot,
	isImageSlot,
	isTextSlot,
	type TemplateBackgroundType,
	type TemplateConfig,
} from '@/features/template-studio/template-config'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import type { GetCreateNavigationOutput } from '@/services/get-create-navigation.service'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'

/** 이미지 슬롯 하나의 편집 상태 — 병렬 Record로 찢지 않고 한 객체로 흐른다. */
export type TemplateImageSlotState = {
	/** 생성으로 배정된 이미지 — 없으면 슬롯은 저작 이미지 그대로다(transform도 잠긴다). */
	image?: { backgroundImage: string; generatedImageId: number }
	/** 사용자가 바꾼 라인 색 — 없으면 저작 colorize의 line을 유지한다. */
	lineColor?: string
	transform?: ImageTransformValue
}

/**
 * 캔버스 배경 편집 상태 — 노드 슬롯이 아니라 도화지 하나의 상태라 단위 객체 하나로 흐른다.
 * color가 null이면 사용자가 만지지 않은 것이고, 저작 배경을 덮지 않는다(isEmpty 파생 원천).
 */
export type TemplateBackgroundState = {
	type: TemplateBackgroundType
	imageMode: 'preset' | 'generate'
	color: string | null
	/** 생성으로 깔린 배경 이미지 — type=image일 때만 합성된다. */
	image?: { url: string; generatedImageId: number }
}

type TemplateStudioValue = {
	navigation: GetCreateNavigationOutput
	/** 템플릿의 편집 계약 — 사이드바는 이 객체만 보고 컨트롤을 그린다(원시 nodeConfigs 참조 금지). */
	config: TemplateConfig
	text: {
		values: Record<string, string>
		setValue: (slotId: string, text: string) => void
		/** null = 사용자가 만지지 않음 — 저작 텍스트 색 유지(isEmpty 파생 원천). */
		color: string | null
		setColor: (hex: string | null) => void
		clippedSlotIds: ReadonlySet<string>
	}
	images: {
		states: Record<string, TemplateImageSlotState>
		update: (slotId: string, patch: Partial<TemplateImageSlotState>) => void
		profiles: ImageProfileOption[] | null
		profilesFailed: boolean
	}
	background: {
		state: TemplateBackgroundState
		update: (patch: Partial<TemplateBackgroundState>) => void
	}
	canvas: {
		html: string
		/** 캔버스가 붙이는 미리보기 DOM — 잘림 측정은 provider가 소유한다. */
		previewRef: RefObject<HTMLDivElement | null>
	}
	exporting: {
		format: TemplateExportFormat
		setFormat: (format: TemplateExportFormat) => void
		busy: boolean
		error: string | null
		run: (format: TemplateExportFormat) => void
	}
}

const TemplateStudioContext = createContext<TemplateStudioValue | null>(null)

/**
 * 템플릿 스튜디오 편집 세션의 단일 소유자 — 사이드바(컨트롤러)와 캔버스(미리보기)는
 * 이 컨텍스트만 알고 서로를 모른다. 편집 가능 범위는 파생된 TemplateConfig 계약이 말하고,
 * HTTP I/O는 features의 *.client.ts가 소유하며, 여기서는 세션 상태와 합성 파생만 소유한다
 * (docs/10 §3.5·§3.6). compose는 매번 불변 published base에서 재합성하는 순수 함수라 멱등이다.
 */
export function TemplateStudioProvider({
	template,
	navigation,
	children,
}: {
	template: PublishedHtmlTemplate
	navigation: GetCreateNavigationOutput
	children: ReactNode
}) {
	const previewRef = useRef<HTMLDivElement>(null)
	const [textValues, setTextValues] = useState<Record<string, string>>({})
	const [textColor, setTextColor] = useState<string | null>(null)
	const [clippedSlotIds, setClippedSlotIds] = useState<ReadonlySet<string>>(new Set())
	const [imageStates, setImageStates] = useState<Record<string, TemplateImageSlotState>>({})
	const [format, setFormat] = useState<TemplateExportFormat>('png')
	const { html, width, height } = template

	const config = useMemo(() => deriveTemplateConfig(template), [template])
	const textSlots = useMemo(() => config.slots.filter(isTextSlot), [config])
	const imageSlots = useMemo(() => config.slots.filter(isImageSlot), [config])
	const backgroundSlot = useMemo(() => config.slots.find(isBackgroundSlot), [config])

	// 배경은 슬롯이 아니라 도화지 하나 — 시작 종류는 계약이 허용한 첫 종류다.
	const [background, setBackground] = useState<TemplateBackgroundState>(() => ({
		type: backgroundSlot?.control.allowedTypes[0] ?? 'color',
		imageMode: 'preset',
		color: null,
	}))

	// 발행 프로파일은 여기서 1회만 조회해 모든 이미지 슬롯과 배경 생성이 공유한다(중복 요청 방지).
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	const [profilesFailed, setProfilesFailed] = useState(false)
	useEffect(() => {
		if (imageSlots.length === 0 && !backgroundSlot) return
		let alive = true
		requestPublishedImageProfiles()
			.then((list) => alive && setProfiles(list))
			.catch(() => {
				if (!alive) return
				setProfiles([])
				setProfilesFailed(true)
			})
		return () => {
			alive = false
		}
	}, [imageSlots, backgroundSlot])

	// 드래그 빈도(60~120hz)로 바뀌는 입력은 deferred로 합성한다 — 컨트롤은 매 프레임 반응하고,
	// 전체 재합성(DOMParser + innerHTML 교체)은 브라우저가 여유 있는 프레임에 따라온다.
	const deferredTextColor = useDeferredValue(textColor)
	const deferredImageStates = useDeferredValue(imageStates)
	const deferredBackground = useDeferredValue(background)

	// 사용자가 만진 슬롯만 오버라이드로 합성한다(만지지 않은 슬롯은 저작 값 유지).
	// 일괄 텍스트 색은 사용자가 만졌을 때만 모든 텍스트 슬롯에 싣는다.
	// 이미지 교체에는 계약(config)의 colorize를 깔아 재적용하고(published html의 옛 colorize
	// 오버레이는 compose가 멱등 제거), 사용자가 Line Color를 바꿨으면 그 line만 갈아끼운다.
	// 사용자 transform은 생성 이미지가 있는 슬롯에만 싣는다 — compose는 매번 published html
	// (불변 base)에서 새로 합성하므로 어드민과 같은 base-재합성 패턴이라 prepend가 누적되지 않는다.
	const composedHtml = useMemo(() => {
		const textOverrides = Object.fromEntries(
			textSlots
				.map((slot) => {
					const override: { text?: string; color?: string } = {}
					const text = textValues[slot.id]
					if (text !== undefined) override.text = text
					if (deferredTextColor) override.color = deferredTextColor
					return [slot.id, override] as const
				})
				.filter(([, override]) => Object.keys(override).length > 0),
		)
		const imageOverrides = Object.fromEntries(
			Object.entries(deferredImageStates)
				.filter(([, state]) => state.image)
				.map(([slotId, state]) => {
					const control = imageSlots.find((slot) => slot.id === slotId)?.control
					const colorize = control?.colorize
					return [
						slotId,
						{
							...(colorize
								? {
										imageColorize: state.lineColor
											? { ...colorize, line: state.lineColor }
											: colorize,
									}
								: {}),
							...(state.transform
								? {
										imageTransform: toImageEditTransform(
											state.transform,
											control?.box.width ?? width,
											control?.box.height ?? height,
										),
									}
								: {}),
							...state.image,
						},
					]
				}),
		)
		// 배경은 노드가 아니라 캔버스 — 선택한 갈래에서 값이 정해진 것만 싣는다(색 갈래는
		// 사용자가 만졌을 때만, 이미지 갈래는 생성 결과가 있을 때만).
		const canvasBackground = {
			...(deferredBackground.type === 'color' && deferredBackground.color
				? { color: deferredBackground.color }
				: {}),
			...(deferredBackground.type === 'image' && deferredBackground.image
				? { imageUrl: deferredBackground.image.url }
				: {}),
		}
		return composeTemplateHtml(
			html,
			{ ...textOverrides, ...imageOverrides },
			{ canvasBackground },
		)
	}, [
		html,
		textSlots,
		textValues,
		deferredTextColor,
		deferredImageStates,
		deferredBackground,
		imageSlots,
		width,
		height,
	])

	// 합성 결과가 그려진 뒤 텍스트 슬롯의 실제 렌더 박스를 재서 잘림을 알린다 —
	// scrollHeight는 overflow:hidden clip과 -webkit-line-clamp 말줄임 양쪽에서 잘린 내용까지 세고,
	// 미리보기 축소(transform scale)는 이 두 값에 영향을 주지 않는다.
	// 텍스트 배치를 바꾸는 입력(html·textSlots·textValues)에만 반응한다 — transform·색 드래그마다
	// innerHTML 교체 직후 강제 layout(scrollHeight)을 다시 밟지 않기 위해서다.
	// biome-ignore lint/correctness/useExhaustiveDependencies: 측정 대상 DOM이 html·textValues로 합성된 composedHtml로 그려진다 — 직접 참조는 없지만 텍스트가 바뀔 때마다 다시 재야 한다
	useEffect(() => {
		const container = previewRef.current
		if (!container) return
		const clipped = new Set<string>()
		for (const slot of textSlots) {
			const element = container.querySelector(`[data-node-id="${slot.id}"]`)
			if (element && element.scrollHeight > element.clientHeight + 1) clipped.add(slot.id)
		}
		setClippedSlotIds(clipped)
	}, [html, textSlots, textValues])

	const { exporting, exportError, exportTemplate } = useTemplateExport({
		fileName: template.name,
		height,
		html: composedHtml,
		printPpi: template.printPpi,
		templateId: template.id,
		templateVersion: template.templateVersion,
		width,
	})

	const value: TemplateStudioValue = {
		navigation,
		config,
		text: {
			values: textValues,
			setValue: (slotId, text) =>
				setTextValues((current) => ({ ...current, [slotId]: text })),
			color: textColor,
			setColor: setTextColor,
			clippedSlotIds,
		},
		images: {
			states: imageStates,
			update: (slotId, patch) =>
				setImageStates((current) => ({
					...current,
					[slotId]: { ...current[slotId], ...patch },
				})),
			profiles,
			profilesFailed,
		},
		background: {
			state: background,
			update: (patch) => setBackground((current) => ({ ...current, ...patch })),
		},
		canvas: { html: composedHtml, previewRef },
		exporting: {
			format,
			setFormat,
			busy: exporting !== null,
			error: exportError,
			run: exportTemplate,
		},
	}

	return <TemplateStudioContext.Provider value={value}>{children}</TemplateStudioContext.Provider>
}

export function useTemplateStudio() {
	const context = useContext(TemplateStudioContext)
	if (!context) {
		throw new Error('useTemplateStudio는 TemplateStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
