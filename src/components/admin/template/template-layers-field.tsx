'use client'

import { Locked, MagicWand, Unlocked } from '@carbon/icons-react'
import { Popup, toast, useForm, useFormFields } from '@payloadcms/ui'
import {
	type ComponentProps,
	type CSSProperties,
	type ReactNode,
	type RefObject,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
	type ImageAspectRatio,
	nearestImageAspectRatio,
} from '@/features/generate-image/image-size'
import {
	type ImageProfileOption,
	requestAdminImageGeneration,
	requestPublishedImageProfiles,
} from '@/features/generate-image/services/generate-image.client'
import { generateOneText } from '@/features/generate-text/services/generate-text.client'
import {
	composeTemplateHtml,
	findImageCarrier,
	IDENTITY_TRANSFORM,
	isIdentityTransform,
	isImageColorizeOverlayId,
} from '@/services/compose-template-html.client'
import type { TemplateNodeConfig, TemplateNodeConfigMap, TemplateSlotSpec } from '@/types/template'
import { BrandColorSwatches } from './brand-color-swatches'
import type { ImageTransform } from './image-transform-gestures'
import { ImageTransformOverlay } from './image-transform-overlay'
import { VectorLayerEditor } from './vector-layer-editor'

/**
 * Templates 편집 폼(Admin)의 워크스페이스 — 렌더 캔버스 + 레이어 패널 + 값 편집을 한 곳에서 다룬다.
 * 레이아웃: [캔버스(가변폭·중앙정렬) | 레이어 목록(고정폭)] → divider → 선택 레이어 값 편집.
 * 편집은 Figma가 아니라 "값 교체"만: 텍스트·프레임 배경·벡터 자산/맞춤/색상. 레이아웃/위치는 Figma가 소유한다.
 */
interface LayerRow {
	id: string
	depth: number
	name: string
	figmaType: string
	/** 요소의 실제 태그(p·img·div) — data-figma-type이 아니라 렌더 실체로 편집기를 고른다. */
	tag: string
	isText: boolean
	isVector: boolean
	/**
	 * 이미지 배정 주소 판정 — 'self'면 이 레이어가 배정·편집의 주소(캐리어 외동인 클립 프레임
	 * 또는 스탠드얼론 캐리어), 'parent'면 주소가 부모 프레임으로 넘어간 캐리어 자식(배정 UI 대신
	 * 안내만 노출), undefined면 배정 불가.
	 */
	imageAddress?: 'self' | 'parent'
	/** 주소가 프레임일 때 해석된 캐리어 자식 nodeId — 자식 키에 남은 이미지 override 정리에 쓴다. */
	carrierChildId?: string
	/** 요소 자신의 inline width/height(px) — clipsContent 프레임의 가시 박스. AI 생성 비율 유도에 쓴다. */
	boxWidth?: number
	boxHeight?: number
	text: string
}

const CANVAS_HEIGHT = 560
const LAYER_WIDTH = 260

function buildPreviewDocument(html: string, origin: string): string {
	const imageSource = origin || "'none'"
	return (
		'<!doctype html><html><head><meta charset="utf-8">' +
		`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${imageSource} data: blob:; font-src data:">` +
		`</head><body>${html}</body></html>`
	)
}

const TYPE_LABEL: Record<string, string> = {
	FRAME: '프레임',
	GROUP: '그룹',
	SECTION: '섹션',
	COMPONENT: '컴포넌트',
	COMPONENT_SET: '컴포넌트셋',
	INSTANCE: '인스턴스',
	TEXT: '텍스트',
	RECTANGLE: '사각형',
	ELLIPSE: '타원',
	LINE: '선',
	VECTOR: '벡터',
	STAR: '별',
	POLYGON: '다각형',
	REGULAR_POLYGON: '다각형',
	BOOLEAN_OPERATION: '불리언',
}
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t
/** 이미지 배정이 노드 config에 남기는 필드들 — 프레임 주소 커밋 시 캐리어 자식 키에서 지운다. */
const IMAGE_CONFIG_KEYS = [
	'backgroundImage',
	'generatedImageId',
	'imageTransform',
	'imageColorize',
	'imageInput',
] as const
const VECTOR_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'LINE',
	'ELLIPSE',
	'POLYGON',
	'REGULAR_POLYGON',
])
// 배경 설정 개방 판정 — 주소 노드에서만 연다: (a) 마킹 없는 클립 프레임이면서 마킹 직계 자식이
// 정확히 1개(루트 제외), (b) 마킹된 캐리어인데 부모가 (a)에 해당하지 않는 경우. 같은 캐리어가
// 프레임·자식 두 nodeId로 이중 주소지정되는 것을 막는다(compose의 findImageCarrier와 짝 계약).
// 벡터 img는 VectorLayerEditor가, 실제 <p>는 텍스트 편집이 소유하므로 제외.
export const canAssignImage = (layer: LayerRow) =>
	!layer.isText && !layer.isVector && layer.imageAddress === 'self'

// 배경 설정 트리거 버튼 공통 스타일(에셋 가져오기 · AI 생성).
const TRIGGER_STYLE: CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 4,
	padding: '4px 10px',
	borderRadius: 4,
	border: '1px solid var(--theme-elevation-150)',
	background: 'transparent',
	cursor: 'pointer',
	color: 'var(--theme-text)',
}

// inline style의 px 치수만 읽는다 — px가 아니거나 0 이하면 undefined.
function stylePx(el: Element, property: 'width' | 'height'): number | undefined {
	if (!(el instanceof HTMLElement)) return undefined
	const value = el.style[property]
	if (!value.endsWith('px')) return undefined
	const parsed = Number.parseFloat(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * 주소 규칙 (a) — 마킹 없는 클립(overflow:hidden) 프레임이면서 마킹 직계 자식이 정확히 1개고
 * 루트(depth 0, 부모가 body)가 아닌 노드. 이 프레임이 캐리어의 배정 주소를 대신 소유한다.
 * findImageCarrier는 자신 마킹이 아니면 "정확히 1개"일 때만 자식을 돌려준다(2개 이상이면 null).
 */
const isCarrierFrameAddress = (node: Element | null, nodeDepth: number): boolean =>
	nodeDepth > 0 &&
	node instanceof HTMLElement &&
	!node.hasAttribute('data-image-carrier') &&
	node.style.overflow === 'hidden' &&
	findImageCarrier(node) !== null

export function parseLayers(html: string): LayerRow[] {
	const rows: LayerRow[] = []
	const doc = new DOMParser().parseFromString(html, 'text/html')

	const walk = (el: Element, depth: number) => {
		// compose가 만든 컬러 치환 오버레이는 편집 대상이 아니다 — 선택해 편집하면 base에 없는
		// 노드로 override가 생겨 발행이 막히므로 레이어 패널에서 숨긴다.
		if (isImageColorizeOverlayId(el.getAttribute('data-node-id') ?? '')) return
		const tag = el.tagName.toLowerCase()
		const figmaType = el.getAttribute('data-figma-type') || (tag === 'p' ? 'TEXT' : 'FRAME')
		// 래스터화된 TEXT는 figmaType이 TEXT여도 img로 남는다 — 실제 <p>만 텍스트 편집 대상.
		const isText = tag === 'p'
		// 주소는 캐리어의 가시 창 하나로 고정한다 — 부모가 주소 프레임(a)이면 캐리어 자신은
		// 'parent'(배정 UI 숨김), 그 외 마킹 캐리어와 주소 프레임 자신은 'self'.
		const selfMarked = el instanceof HTMLElement && el.hasAttribute('data-image-carrier')
		const frameAddress = isCarrierFrameAddress(el, depth)
		rows.push({
			id: el.getAttribute('data-node-id') || `${depth}-${rows.length}`,
			depth,
			name: el.getAttribute('data-name') || typeLabel(figmaType),
			figmaType,
			tag,
			isText,
			// 렌더 실체 기준: 벡터는 img(원본) 또는 compose의 vectorColor 마스크 div로만 편집 가능 — 에셋 누락으로 일반 div가 된 벡터는 폴백 메시지로.
			isVector:
				VECTOR_TYPES.has(figmaType) &&
				(tag === 'img' || (el instanceof HTMLElement && Boolean(el.style.maskImage))),
			imageAddress: selfMarked
				? isCarrierFrameAddress(el.parentElement, depth - 1)
					? 'parent'
					: 'self'
				: frameAddress
					? 'self'
					: undefined,
			carrierChildId: frameAddress
				? (findImageCarrier(el)?.getAttribute('data-node-id') ?? undefined)
				: undefined,
			boxWidth: stylePx(el, 'width'),
			boxHeight: stylePx(el, 'height'),
			text: isText ? (el.textContent ?? '') : '',
		})
		for (const child of Array.from(el.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
}

// published 이미지 프로파일 로드 — 로딩 중 null, 실패 시 빈 목록 + toast. AiImageForm·ImageSlotSpecEditor 공용.
function usePublishedImageProfiles() {
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	useEffect(() => {
		void requestPublishedImageProfiles()
			.then(setProfiles)
			.catch(() => {
				setProfiles([])
				toast.error('이미지 프로파일을 불러오지 못했습니다.')
			})
	}, [])
	return profiles
}

// AI 생성 Popup 트리거 공통 — 커스텀 버튼 모양과 팝업 위치 설정을 소유한다.
function AiPopupTrigger({ render }: { render: ComponentProps<typeof Popup>['render'] }) {
	return (
		<Popup
			buttonType="custom"
			verticalAlign="top"
			horizontalAlign="left"
			size="fit-content"
			button={
				<span className="text-sm" style={TRIGGER_STYLE}>
					<MagicWand aria-hidden /> AI 생성
				</span>
			}
			render={render}
		/>
	)
}

// Popup 안에 뜨는 AI 생성 폼. Popup이 열릴 때만 마운트되므로 프롬프트는 열 때마다 초기화된다.
// rule은 노드의 aiInstruction — 프롬프트와 별개로 항상 지켜야 할 생성 규칙.
function AiTextForm({ rule, onApply }: { rule?: string; onApply: (text: string) => void }) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || loading) return
		setLoading(true)
		try {
			const text = await generateOneText(trimmed, rule)
			if (text) onApply(text)
			else toast.error('생성 실패 — 프롬프트를 바꾸거나 잠시 후 다시 시도하세요.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ width: 260, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
			<span className="text-sm" style={{ color: 'var(--theme-elevation-600)' }}>
				AI 텍스트 생성
			</span>
			<Textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				rows={3}
				placeholder="예: 12자 이내 캐치프레이즈, 존댓말"
			/>
			<Button type="button" size="sm" disabled={loading || !prompt.trim()} onClick={run}>
				{loading ? '생성 중...' : '생성'}
			</Button>
		</div>
	)
}

// Popup 안에 뜨는 AI 이미지 생성 폼. 프레임 배경으로 얹는다.
// aspectRatio는 선택 프레임 박스에서 유도한 비율 — 있으면 프로파일 비율 대신 그 비율로 생성한다.
function AiImageForm({
	aspectRatio,
	onApply,
}: {
	aspectRatio?: ImageAspectRatio
	onApply: (image: { id: number; src: string }) => void
}) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)
	const profiles = usePublishedImageProfiles()
	const [pickedProfileId, setPickedProfileId] = useState<number>()
	const profileId = pickedProfileId ?? profiles?.[0]?.id

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || !profileId || loading) return
		setLoading(true)
		try {
			const result = await requestAdminImageGeneration({
				prompt: trimmed,
				count: 1,
				profileId,
				aspectRatio,
			})
			const generated = result.generatedImages?.[0]
			if (generated) onApply({ id: generated.id, src: generated.url })
			else toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} catch {
			toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ width: 260, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
			<span className="text-sm" style={{ color: 'var(--theme-elevation-600)' }}>
				AI 배경 이미지 생성
			</span>
			<label className="text-sm" htmlFor="template-ai-image-profile">
				이미지 프로파일
			</label>
			<select
				id="template-ai-image-profile"
				value={profileId ?? ''}
				onChange={(event) => setPickedProfileId(Number(event.currentTarget.value))}
				style={SELECT_STYLE}
			>
				{profiles?.length ? (
					profiles.map((profile) => (
						<option key={profile.id} value={profile.id}>
							{profile.name}
						</option>
					))
				) : (
					<option value="" disabled>
						{profiles ? '발행된 프로파일 없음' : '프로파일 불러오는 중'}
					</option>
				)}
			</select>
			{aspectRatio && (
				<span className="text-xs" style={{ color: 'var(--theme-elevation-500)' }}>
					슬롯 비율 {aspectRatio}로 생성
				</span>
			)}
			<Textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				rows={3}
				placeholder="예: 미니멀한 파스텔 그라디언트 배경"
			/>
			<Button
				type="button"
				size="sm"
				disabled={loading || !profileId || !prompt.trim()}
				onClick={run}
			>
				{loading ? '생성 중...' : '생성'}
			</Button>
		</div>
	)
}

// 슬롯 스펙 편집 폼 공통 필드 스타일.
const SELECT_STYLE: CSSProperties = {
	width: '100%',
	padding: 6,
	borderRadius: 4,
	border: '1px solid var(--theme-elevation-150)',
	background: 'var(--theme-input-bg)',
	color: 'var(--theme-text)',
}

// 슬롯 스펙 필드 한 칸 — 위 라벨 + 아래 컨트롤. span이면 그리드 전체 폭.
function SpecField({
	id,
	label,
	span,
	children,
}: {
	id: string
	label: string
	span?: boolean
	children: ReactNode
}) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
				gridColumn: span ? '1 / -1' : undefined,
			}}
		>
			<label className="text-sm" htmlFor={id} style={{ color: 'var(--theme-elevation-500)' }}>
				{label}
			</label>
			{children}
		</div>
	)
}

/**
 * 슬롯 개방 자물쇠 토글 — 헤딩·자물쇠 버튼·상태 힌트를 그리고 열렸을 때만 children(스펙 폼)을 노출한다.
 * 열림 여부는 config 키의 존재가 결정하므로 opened로 받고, 라벨은 slot 명사와 openHint로 만든다.
 */
function SlotLockToggle({
	heading,
	slot,
	openHint,
	opened,
	onToggle,
	children,
}: {
	/** 좌측 헤딩 — 예: 입력 슬롯, 스튜디오 개방 */
	heading: string
	/** title·aria-label의 슬롯 명사 — 예: 입력 슬롯, 이미지 슬롯 */
	slot: string
	/** 닫힘 상태 title에 붙는 열기 결과 설명 — 예: 유저 화면에 입력 노출 */
	openHint: string
	opened: boolean
	onToggle: () => void
	children: ReactNode
}) {
	return (
		<div style={{ marginTop: 12 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
				<span className="text-sm" style={{ color: 'var(--theme-elevation-600)' }}>
					{heading}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onToggle}
					title={
						opened ? `${slot} 닫기 — 유저 화면에서 숨김` : `${slot} 열기 — ${openHint}`
					}
					aria-label={opened ? `${slot} 닫기` : `${slot} 열기`}
				>
					{opened ? <Unlocked aria-hidden /> : <Locked aria-hidden />}
				</Button>
				<span className="text-xs" style={{ color: 'var(--theme-elevation-500)' }}>
					{opened ? '유저 화면에 열림' : '닫힘'}
				</span>
			</div>
			{opened && children}
		</div>
	)
}

/**
 * 열린 슬롯의 스펙 편집 폼. 열기/닫기는 호출부의 자물쇠 토글이 담당한다.
 * input의 존재 자체가 열린 슬롯 선언 — 유저(Create) 화면에 입력이 노출된다.
 */
function SlotSpecEditor({
	input,
	onChange,
}: {
	input: TemplateSlotSpec
	onChange: (input: TemplateSlotSpec) => void
}) {
	const patch = (part: Partial<TemplateSlotSpec>) => onChange({ ...input, ...part })
	const positiveInt = (raw: string) => {
		const parsed = Number.parseInt(raw, 10)
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
	}

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(3, 1fr)',
				gap: 8,
				maxWidth: 560,
				padding: 10,
				borderRadius: 4,
				border: '1px solid var(--theme-elevation-150)',
			}}
		>
			<SpecField id="slot-spec-label" label="라벨">
				<Input
					id="slot-spec-label"
					value={input.label ?? ''}
					onChange={(event) => patch({ label: event.target.value || undefined })}
					placeholder="예: 영문 이름"
				/>
			</SpecField>
			<SpecField id="slot-spec-placeholder" label="플레이스홀더">
				<Input
					id="slot-spec-placeholder"
					value={input.placeholder ?? ''}
					onChange={(event) => patch({ placeholder: event.target.value || undefined })}
					placeholder="입력 전 안내 문구"
				/>
			</SpecField>
			<SpecField id="slot-spec-format" label="형식">
				<select
					className="text-sm"
					id="slot-spec-format"
					value={input.inputFormat ?? 'free'}
					onChange={(event) =>
						patch({
							inputFormat: event.target.value as TemplateSlotSpec['inputFormat'],
						})
					}
					style={SELECT_STYLE}
				>
					<option value="free">자유 텍스트</option>
					<option value="number">숫자</option>
					<option value="email">이메일</option>
					<option value="date">날짜</option>
				</select>
			</SpecField>
			<SpecField id="slot-spec-max-length" label="최대 글자">
				<Input
					type="number"
					min={1}
					id="slot-spec-max-length"
					value={input.maxLength ?? ''}
					onChange={(event) => patch({ maxLength: positiveInt(event.target.value) })}
					placeholder="없음"
				/>
			</SpecField>
			<SpecField id="slot-spec-max-lines" label="최대 줄">
				<Input
					type="number"
					min={1}
					id="slot-spec-max-lines"
					value={input.maxLines ?? ''}
					onChange={(event) => patch({ maxLines: positiveInt(event.target.value) })}
					placeholder="없음"
				/>
			</SpecField>
			<SpecField id="slot-spec-ai" label="AI 지시 — 이 슬롯의 생성 규칙" span>
				<Textarea
					id="slot-spec-ai"
					value={input.aiInstruction ?? ''}
					onChange={(event) => patch({ aiInstruction: event.target.value || undefined })}
					rows={2}
					placeholder="예: 영문 이름만, 성-이름 순"
				/>
			</SpecField>
		</div>
	)
}

type ImageSlotInput = NonNullable<TemplateNodeConfig['imageInput']>

/**
 * 스튜디오에 개방한 이미지 슬롯의 스펙 편집 폼. 열기/닫기는 호출부의 자물쇠 토글이 담당한다.
 * imageInput의 존재 자체가 개방 선언 — 프로파일을 고정하면 유저 화면에서 선택이 사라진다.
 */
function ImageSlotSpecEditor({
	imageInput,
	onChange,
}: {
	imageInput: ImageSlotInput
	onChange: (imageInput: ImageSlotInput) => void
}) {
	const profiles = usePublishedImageProfiles()

	return (
		<div
			style={{
				maxWidth: 280,
				padding: 10,
				borderRadius: 4,
				border: '1px solid var(--theme-elevation-150)',
			}}
		>
			<SpecField id="image-slot-profile" label="프로파일 고정 — 없으면 유저가 선택">
				<select
					className="text-sm"
					id="image-slot-profile"
					value={imageInput.profileId ?? ''}
					onChange={(event) => {
						const value = Number(event.currentTarget.value)
						onChange(value > 0 ? { profileId: value } : {})
					}}
					style={SELECT_STYLE}
				>
					<option value="">스튜디오에서 선택</option>
					{profiles?.map((profile) => (
						<option key={profile.id} value={profile.id}>
							{profile.name}
						</option>
					))}
				</select>
			</SpecField>
		</div>
	)
}

/**
 * 프레임에 할당한 이미지의 자유 편집(이동·확대·회전) 폼. 값은 override로만 저장되고
 * compose가 캐리어의 CSS transform으로 적용한다 — baseHtml은 건드리지 않는다.
 * 슬라이더는 드래그 중 draft만 갱신하고 놓을 때 commit해 재합성 thrash를 막는다.
 */
function ImageTransformEditor({
	value,
	onChange,
}: {
	value?: ImageTransform
	onChange: (next?: ImageTransform) => void
}) {
	const [draft, setDraft] = useState<ImageTransform>(value ?? IDENTITY_TRANSFORM)
	const commit = (next: ImageTransform) => onChange(isIdentityTransform(next) ? undefined : next)

	// 캔버스 오버레이가 commit한 값을 반영한다 — key(selected.id)는 안 바뀌므로 effect로 동기화.
	// 슬라이더 드래그 중에는 value가 변하지 않아(놓을 때만 commit) draft를 덮지 않는다.
	useEffect(() => setDraft(value ?? IDENTITY_TRANSFORM), [value])

	const fields: {
		key: keyof ImageTransform
		label: string
		min: number
		max: number
		step: number
	}[] = [
		{ key: 'x', label: '이동 X (px)', min: -1000, max: 1000, step: 1 },
		{ key: 'y', label: '이동 Y (px)', min: -1000, max: 1000, step: 1 },
		{ key: 'scale', label: '확대', min: 0.2, max: 5, step: 0.05 },
		{ key: 'rotate', label: '회전 (deg)', min: -180, max: 180, step: 1 },
	]

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(2, 1fr)',
				gap: 8,
				maxWidth: 560,
				padding: 10,
				borderRadius: 4,
				border: '1px solid var(--theme-elevation-150)',
			}}
		>
			{fields.map(({ key, label, min, max, step }) => (
				<SpecField key={key} id={`image-transform-${key}`} label={label}>
					<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
						<input
							type="range"
							min={min}
							max={max}
							step={step}
							value={draft[key]}
							aria-label={label}
							style={{ flex: 1, minWidth: 0 }}
							onChange={(event) =>
								setDraft({ ...draft, [key]: Number(event.target.value) })
							}
							onPointerUp={() => commit(draft)}
							onBlur={() => commit(draft)} // 키보드(화살표) 조작 커버
						/>
						<Input
							type="number"
							id={`image-transform-${key}`}
							min={min}
							max={max}
							step={step}
							value={draft[key]}
							style={{ width: 80, flexShrink: 0 }}
							onChange={(event) => {
								const parsed = Number(event.target.value)
								if (!Number.isFinite(parsed)) return
								const next = { ...draft, [key]: parsed }
								setDraft(next)
								commit(next)
							}}
						/>
					</div>
				</SpecField>
			))}
			<div style={{ gridColumn: '1 / -1' }}>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						setDraft(IDENTITY_TRANSFORM)
						onChange(undefined)
					}}
				>
					초기화
				</Button>
			</div>
		</div>
	)
}

/**
 * 컬러 치환 폼 — 생성 이미지(단색 라인 아트)의 선 색을 브랜드 컬러로 고른다.
 * 배경은 기본 투명(선만 칠해짐)이며 '배경 직접 지정'으로만 opt-in한다.
 * 값은 override로만 저장되고 compose가 luminance 마스크로 적용한다.
 * 스와치 소스·UI는 VectorLayerEditor의 브랜드 컬러와 동일(published brand-colors).
 */
function ImageColorizeEditor({
	value,
	onChange,
}: {
	value?: { line: string; background?: string }
	onChange: (next?: { line: string; background?: string }) => void
}) {
	// 선 색만으로 유효한 override — background 생략 시 compose가 배경 없이 선만 칠한다.
	const [draft, setDraft] = useState<{ line?: string; background?: string }>(value ?? {})
	// 배경 직접 지정은 opt-in — 기존 설정에 background가 있으면 열린 채로 시작한다(노드별 key 리마운트).
	const [showBackground, setShowBackground] = useState(Boolean(value?.background))

	useEffect(() => setDraft(value ?? {}), [value])

	const pick = (field: 'line' | 'background', hex: string) => {
		const next = { ...draft, [field]: hex }
		setDraft(next)
		if (next.line) {
			onChange(
				next.background
					? { line: next.line, background: next.background }
					: { line: next.line },
			)
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			{(showBackground
				? ([
						['line', '선 색'],
						['background', '배경 색'],
					] as const)
				: ([['line', '선 색']] as const)
			).map(([field, label]) => {
				// 선 색 없이는 유효한 override가 못 되므로 배경 선선택은 막고 순서를 안내한다.
				const needsLine = field === 'background' && !draft.line
				return (
					<BrandColorSwatches
						key={field}
						legend={needsLine ? `${label} — 선 색을 먼저 고르세요` : label}
						value={draft[field]}
						onPick={(hex) => pick(field, hex)}
						disabled={needsLine}
					/>
				)
			})}
			{!showBackground && (
				<p className="text-sm" style={{ margin: 0, color: 'var(--theme-elevation-500)' }}>
					배경 없이 선만 칠합니다(캔버스가 그대로 비칩니다)
				</p>
			)}
			<label
				className="text-sm"
				style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
			>
				<input
					type="checkbox"
					checked={showBackground}
					onChange={(event) => {
						const checked = event.target.checked
						setShowBackground(checked)
						if (!checked) {
							// 체크 해제 = 투명 기본 복귀 — 저장된 background를 지우고 선 색만 남긴다.
							const next = { line: draft.line }
							setDraft(next)
							if (next.line) onChange({ line: next.line })
						}
					}}
				/>
				배경 직접 지정
			</label>
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						setDraft({})
						setShowBackground(false)
						onChange(undefined)
					}}
				>
					해제
				</Button>
			</div>
		</div>
	)
}

/** 워크스페이스의 가변 폭 미리보기 영역과 contain scale을 소유한다. */
function TemplateCanvas({
	canvasRef,
	hasHtml,
	height,
	iframeRef,
	overlay,
	previewDocument,
	scale,
	width,
}: {
	canvasRef: RefObject<HTMLDivElement | null>
	hasHtml: boolean
	height: number
	iframeRef: RefObject<HTMLIFrameElement | null>
	overlay?: ReactNode
	previewDocument: string
	scale: number
	width: number
}) {
	return (
		<div
			ref={canvasRef}
			style={{
				flex: 1,
				minWidth: 0,
				height: CANVAS_HEIGHT,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
				border: '1px solid var(--theme-elevation-150)',
				borderRadius: 4,
				background: 'var(--theme-elevation-50)',
			}}
		>
			{hasHtml && width && height ? (
				// relative: 이미지 편집 오버레이가 iframe의 시각적 박스 위에 절대 배치된다.
				<div style={{ width: width * scale, height: height * scale, position: 'relative' }}>
					{/* script/forms/navigation은 열지 않고, 인증된 staging 이미지 요청에만 same-origin을 유지한다. */}
					<iframe
						ref={iframeRef}
						title="템플릿 Draft 미리보기"
						sandbox="allow-same-origin"
						referrerPolicy="no-referrer"
						srcDoc={previewDocument}
						style={{
							width,
							height,
							border: 0,
							pointerEvents: 'none',
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
						}}
					/>
					{overlay}
				</div>
			) : (
				<span className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
					Figma에서 가져오면 여기에 표시됩니다.
				</span>
			)}
		</div>
	)
}

/** 워크스페이스 우측의 고정 폭 레이어 탐색 영역을 소유한다. */
function LayerList({
	layers,
	onSelect,
	selectedId,
}: {
	layers: LayerRow[]
	onSelect: (id: string) => void
	selectedId: string | null
}) {
	return (
		<div
			style={{
				width: LAYER_WIDTH,
				flexShrink: 0,
				border: '1px solid var(--theme-elevation-150)',
				borderRadius: 4,
				padding: 8,
				maxHeight: CANVAS_HEIGHT,
				overflow: 'auto',
			}}
		>
			<strong className="text-base" style={{ display: 'block', marginBottom: 6 }}>
				레이어
			</strong>
			{layers.length === 0 && (
				<p className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
					레이어 없음
				</p>
			)}
			{layers.map((layer) => {
				const isSelected = layer.id === selectedId
				return (
					<button
						className="text-sm"
						key={layer.id}
						type="button"
						onClick={() => onSelect(layer.id)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 6,
							width: '100%',
							textAlign: 'left',
							border: 'none',
							borderRadius: 3,
							cursor: 'pointer',
							paddingLeft: layer.depth * 14 + 4,
							paddingTop: 2,
							paddingBottom: 2,
							lineHeight: '22px',
							background: isSelected ? 'var(--theme-elevation-100)' : 'transparent',
							color: layer.isText
								? 'var(--theme-text)'
								: 'var(--theme-elevation-600)',
						}}
					>
						<span
							className="text-xs"
							style={{
								flexShrink: 0,
								color: 'var(--theme-elevation-400)',
								minWidth: 44,
							}}
						>
							{typeLabel(layer.figmaType)}
						</span>
						<span
							style={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{layer.name}
						</span>
					</button>
				)
			})}
		</div>
	)
}

export default function TemplateLayersField() {
	const { dispatchFields, setModified } = useForm()
	const html = useFormFields(([fields]) => fields.html?.value) as string | undefined
	const baseHtml = useFormFields(([fields]) => fields.baseHtml?.value) as string | undefined
	const nodeConfigs = (useFormFields(([fields]) => fields.overrides?.value) ??
		{}) as TemplateNodeConfigMap
	const width = useFormFields(([fields]) => fields.width?.value) as number | undefined
	const height = useFormFields(([fields]) => fields.height?.value) as number | undefined
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [previewOrigin, setPreviewOrigin] = useState('')

	useEffect(() => setPreviewOrigin(window.location.origin), [])

	// 캔버스 가용 폭 측정 → 템플릿을 캔버스에 contain(중앙정렬)으로 축소한다.
	const canvasRef = useRef<HTMLDivElement>(null)
	const [canvasWidth, setCanvasWidth] = useState(0)
	useEffect(() => {
		const el = canvasRef.current
		if (!el) return
		const observer = new ResizeObserver((entries) => {
			setCanvasWidth(entries[0]?.contentRect.width ?? 0)
		})
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

	const layers = useMemo(
		() => (typeof html === 'string' && html.trim() ? parseLayers(html) : []),
		[html],
	)
	const selected = layers.find((l) => l.id === selectedId) ?? null
	const hasHtml = typeof html === 'string' && html.trim().length > 0
	const previewDocument = useMemo(
		() => (hasHtml ? buildPreviewDocument(html, previewOrigin) : ''),
		[hasHtml, html, previewOrigin],
	)

	const w = typeof width === 'number' && width > 0 ? width : 0
	const h = typeof height === 'number' && height > 0 ? height : 0
	const availW = canvasWidth || 640
	const scale = w && h ? Math.min(1, (availW - 32) / w, (CANVAS_HEIGHT - 32) / h) : 1

	// 편집은 html을 직접 굽지 않고 overrides[nodeId]에 쌓은 뒤 base ⊕ overrides로 html을 재합성한다.
	// base(=baseHtml, 없으면 현재 html)만 재import 때 갈리고 overrides는 유지되므로 앱 편집이 보존된다.
	function commitNodeConfig(patch: TemplateNodeConfig) {
		if (!selectedId) return
		const base = baseHtml || html
		if (typeof base !== 'string') return
		const next: TemplateNodeConfigMap = {
			...nodeConfigs,
			[selectedId]: { ...nodeConfigs[selectedId], ...patch },
		}
		// 커밋 정규화: 프레임 주소에서 이미지 커밋이 일어나면 해석된 캐리어 자식 키에 남은 이미지
		// 필드(과거 자식 키로 저작된 override)를 지운다 — 같은 캐리어가 두 주소로 이중 적용되는 것 방지.
		const childId = selected?.carrierChildId
		if (childId && next[childId] && IMAGE_CONFIG_KEYS.some((key) => key in patch)) {
			const child = { ...next[childId] }
			for (const key of IMAGE_CONFIG_KEYS) delete child[key]
			if (Object.keys(child).length === 0) delete next[childId]
			else next[childId] = child
		}
		dispatchFields({ type: 'UPDATE', path: 'overrides', value: next })
		dispatchFields({ type: 'UPDATE', path: 'html', value: composeTemplateHtml(base, next) })
		setModified(true)
	}

	const commitText = (text: string) => commitNodeConfig({ text })
	const commitBackground = ({ id, src }: { id: number; src: string }) =>
		commitNodeConfig({ backgroundImage: src, generatedImageId: id })

	// 이미지 편집 오버레이 게이트 — 아래 슬라이더 섹션과 동일 조건(배정 대상 = 주소 노드 + 배경 할당됨).
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const canEditImage =
		!!selected && canAssignImage(selected) && !!nodeConfigs[selected.id]?.backgroundImage
	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			{/* 캔버스(가변폭·중앙정렬) + 레이어 목록(고정폭) */}
			<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
				<TemplateCanvas
					canvasRef={canvasRef}
					hasHtml={hasHtml}
					height={h}
					iframeRef={iframeRef}
					overlay={
						canEditImage && selected ? (
							<ImageTransformOverlay
								iframeRef={iframeRef}
								nodeId={selected.id}
								scale={scale}
								value={nodeConfigs[selected.id]?.imageTransform}
								onCommit={(imageTransform) => commitNodeConfig({ imageTransform })}
							/>
						) : null
					}
					previewDocument={previewDocument}
					scale={scale}
					width={w}
				/>
				<LayerList layers={layers} onSelect={setSelectedId} selectedId={selectedId} />
			</div>

			<Separator className="template-layers-field__separator" />

			{/* 선택 레이어 값 편집 */}
			{!selected && (
				<p className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
					{hasHtml ? '레이어를 선택하면 값을 편집할 수 있습니다.' : ''}
				</p>
			)}

			{selected?.isText && (
				<div>
					<label htmlFor="template-layer-text" style={{ display: 'block' }}>
						<span
							className="text-sm"
							style={{
								display: 'block',
								marginBottom: 4,
								color: 'var(--theme-elevation-600)',
							}}
						>
							텍스트 편집 — {selected.name}
						</span>
						<Textarea
							id="template-layer-text"
							value={selected.text}
							onChange={(event) => commitText(event.target.value)}
							rows={2}
						/>
					</label>
					<div style={{ marginTop: 6 }}>
						<AiPopupTrigger
							render={({ close }) => (
								<AiTextForm
									rule={nodeConfigs[selected.id]?.input?.aiInstruction}
									onApply={(text) => {
										commitText(text)
										close()
									}}
								/>
							)}
						/>
					</div>
					<SlotLockToggle
						heading="입력 슬롯"
						slot="입력 슬롯"
						openHint="유저 화면에 입력 노출"
						opened={Boolean(nodeConfigs[selected.id]?.input)}
						onToggle={() =>
							commitNodeConfig({
								input: nodeConfigs[selected.id]?.input ? undefined : {},
							})
						}
					>
						<SlotSpecEditor
							input={nodeConfigs[selected.id]?.input ?? {}}
							onChange={(input) => commitNodeConfig({ input })}
						/>
					</SlotLockToggle>
				</div>
			)}

			{selected && canAssignImage(selected) && (
				<div>
					<span
						className="text-sm"
						style={{
							display: 'block',
							marginBottom: 4,
							color: 'var(--theme-elevation-600)',
						}}
					>
						배경 설정 — {selected.name}
					</span>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						<AiPopupTrigger
							render={({ close }) => (
								<AiImageForm
									aspectRatio={nearestImageAspectRatio(
										selected.boxWidth ?? Number.NaN,
										selected.boxHeight ?? Number.NaN,
									)}
									onApply={(image) => {
										commitBackground(image)
										close()
									}}
								/>
							)}
						/>
					</div>
					<SlotLockToggle
						heading="스튜디오 개방"
						slot="이미지 슬롯"
						openHint="유저 화면에 이미지 생성 노출"
						opened={Boolean(nodeConfigs[selected.id]?.imageInput)}
						onToggle={() =>
							commitNodeConfig({
								imageInput: nodeConfigs[selected.id]?.imageInput ? undefined : {},
							})
						}
					>
						<ImageSlotSpecEditor
							imageInput={nodeConfigs[selected.id]?.imageInput ?? {}}
							onChange={(imageInput) => commitNodeConfig({ imageInput })}
						/>
					</SlotLockToggle>
					{/* 배정 대상은 항상 주소 노드 — 배경이 실제로 할당된 뒤에만 transform·컬러 치환을 연다. */}
					{canEditImage && (
						<div style={{ marginTop: 12 }}>
							<span
								className="text-sm"
								style={{
									display: 'block',
									marginBottom: 6,
									color: 'var(--theme-elevation-600)',
								}}
							>
								이미지 편집 — 이동·확대·회전
							</span>
							<ImageTransformEditor
								key={selected.id}
								value={nodeConfigs[selected.id]?.imageTransform}
								onChange={(imageTransform) => commitNodeConfig({ imageTransform })}
							/>
							<span
								className="text-sm"
								style={{
									display: 'block',
									margin: '12px 0 6px',
									color: 'var(--theme-elevation-600)',
								}}
							>
								컬러 치환 — 선·배경 브랜드 컬러
							</span>
							<ImageColorizeEditor
								key={`colorize-${selected.id}`}
								value={nodeConfigs[selected.id]?.imageColorize}
								onChange={(imageColorize) => commitNodeConfig({ imageColorize })}
							/>
						</div>
					)}
				</div>
			)}

			{selected?.isVector && (
				<VectorLayerEditor
					name={selected.name}
					config={nodeConfigs[selected.id] ?? {}}
					onChange={commitNodeConfig}
				/>
			)}

			{/* 주소가 부모 프레임으로 넘어간 캐리어 — 배정 UI 대신 주소를 안내한다. */}
			{selected?.imageAddress === 'parent' && (
				<p className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
					이미지 배정은 부모 프레임에서 합니다 — 프레임 레이어를 선택하세요.
				</p>
			)}

			{selected &&
				!selected.isText &&
				!selected.isVector &&
				!canAssignImage(selected) &&
				selected.imageAddress !== 'parent' && (
					<p className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
						{selected.tag === 'img'
							? '이미지로 고정된 레이어입니다 — Figma에서 해당 속성을 정리하면 편집 가능하게 가져올 수 있습니다.'
							: `${typeLabel(selected.figmaType)} 레이어는 아직 편집할 값이 없습니다.`}
					</p>
				)}
		</div>
	)
}
