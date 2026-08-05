'use client'

import { Popup, toast, useForm, useFormFields } from '@payloadcms/ui'
import {
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
	type ImageProfileOption,
	requestAdminImageGeneration,
	requestPublishedImageProfiles,
} from '@/features/generate-image/services/generate-image.client'
import { generateOneText } from '@/features/generate-text/services/generate-text.client'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import type { TemplateNodeConfig, TemplateNodeConfigMap, TemplateSlotSpec } from '@/types/template'
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
	isText: boolean
	isVector: boolean
	/** 직계 자식에 data-image-carrier가 있는 프레임 — 이미지 자유 편집(transform) 대상. */
	hasImageCarrier: boolean
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
const VECTOR_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'LINE',
	'ELLIPSE',
	'POLYGON',
	'REGULAR_POLYGON',
])
// 배경 이미지 할당(AI 생성) 대상. Figma REST는 둥근 사각형도 RECTANGLE(+cornerRadius)로 내보내므로 두 타입이면 충분하다.
const IMAGE_ASSIGN_TYPES = new Set(['FRAME', 'RECTANGLE'])

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

function parseLayers(html: string): LayerRow[] {
	const rows: LayerRow[] = []
	const doc = new DOMParser().parseFromString(html, 'text/html')

	const walk = (el: Element, depth: number) => {
		const figmaType =
			el.getAttribute('data-figma-type') ||
			(el.tagName.toLowerCase() === 'p' ? 'TEXT' : 'FRAME')
		const isText = figmaType === 'TEXT'
		rows.push({
			id: el.getAttribute('data-node-id') || `${depth}-${rows.length}`,
			depth,
			name: el.getAttribute('data-name') || typeLabel(figmaType),
			figmaType,
			isText,
			isVector: VECTOR_TYPES.has(figmaType),
			hasImageCarrier: Array.from(el.children).some((child) =>
				child.hasAttribute('data-image-carrier'),
			),
			text: isText ? (el.textContent ?? '') : '',
		})
		for (const child of Array.from(el.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
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
function AiImageForm({ onApply }: { onApply: (image: { id: number; src: string }) => void }) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	const [profileId, setProfileId] = useState<number>()

	useEffect(() => {
		void requestPublishedImageProfiles()
			.then((nextProfiles) => {
				setProfiles(nextProfiles)
				setProfileId(nextProfiles[0]?.id)
			})
			.catch(() => {
				setProfiles([])
				toast.error('이미지 프로파일을 불러오지 못했습니다.')
			})
	}, [])

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || !profileId || loading) return
		setLoading(true)
		try {
			const result = await requestAdminImageGeneration({
				prompt: trimmed,
				count: 1,
				profileId,
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
				onChange={(event) => setProfileId(Number(event.currentTarget.value))}
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
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)

	useEffect(() => {
		void requestPublishedImageProfiles()
			.then(setProfiles)
			.catch(() => {
				setProfiles([])
				toast.error('이미지 프로파일을 불러오지 못했습니다.')
			})
	}, [])

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

type ImageTransform = NonNullable<TemplateNodeConfig['imageTransform']>

const IDENTITY_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1, rotate: 0 }

const isIdentityTransform = (t: ImageTransform) =>
	t.x === 0 && t.y === 0 && t.scale === 1 && t.rotate === 0

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

/** 워크스페이스의 가변 폭 미리보기 영역과 contain scale을 소유한다. */
function TemplateCanvas({
	canvasRef,
	hasHtml,
	height,
	previewDocument,
	scale,
	width,
}: {
	canvasRef: RefObject<HTMLDivElement | null>
	hasHtml: boolean
	height: number
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
				<div style={{ width: width * scale, height: height * scale }}>
					{/* script/forms/navigation은 열지 않고, 인증된 staging 이미지 요청에만 same-origin을 유지한다. */}
					<iframe
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
		dispatchFields({ type: 'UPDATE', path: 'overrides', value: next })
		dispatchFields({ type: 'UPDATE', path: 'html', value: composeTemplateHtml(base, next) })
		setModified(true)
	}

	const commitText = (text: string) => commitNodeConfig({ text })
	const commitBackground = ({ id, src }: { id: number; src: string }) =>
		commitNodeConfig({ backgroundImage: src, generatedImageId: id })
	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			{/* 캔버스(가변폭·중앙정렬) + 레이어 목록(고정폭) */}
			<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
				<TemplateCanvas
					canvasRef={canvasRef}
					hasHtml={hasHtml}
					height={h}
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
						<Popup
							buttonType="custom"
							verticalAlign="top"
							horizontalAlign="left"
							size="fit-content"
							button={
								<span className="text-sm" style={TRIGGER_STYLE}>
									✨ AI 생성
								</span>
							}
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
					<div style={{ marginTop: 12 }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								marginBottom: 6,
							}}
						>
							<span
								className="text-sm"
								style={{ color: 'var(--theme-elevation-600)' }}
							>
								입력 슬롯
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() =>
									commitNodeConfig({
										input: nodeConfigs[selected.id]?.input ? undefined : {},
									})
								}
								title={
									nodeConfigs[selected.id]?.input
										? '슬롯 닫기 — 유저 화면에서 숨김'
										: '슬롯 열기 — 유저 화면에 입력 노출'
								}
								aria-label={
									nodeConfigs[selected.id]?.input
										? '입력 슬롯 닫기'
										: '입력 슬롯 열기'
								}
							>
								{nodeConfigs[selected.id]?.input ? '🔓' : '🔒'}
							</Button>
							<span
								className="text-xs"
								style={{ color: 'var(--theme-elevation-500)' }}
							>
								{nodeConfigs[selected.id]?.input ? '유저 화면에 열림' : '닫힘'}
							</span>
						</div>
						{nodeConfigs[selected.id]?.input && (
							<SlotSpecEditor
								input={nodeConfigs[selected.id]?.input ?? {}}
								onChange={(input) => commitNodeConfig({ input })}
							/>
						)}
					</div>
				</div>
			)}

			{selected && IMAGE_ASSIGN_TYPES.has(selected.figmaType) && (
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
						<Popup
							buttonType="custom"
							verticalAlign="top"
							horizontalAlign="left"
							size="fit-content"
							button={
								<span className="text-sm" style={TRIGGER_STYLE}>
									✨ AI 생성
								</span>
							}
							render={({ close }) => (
								<AiImageForm
									onApply={(image) => {
										commitBackground(image)
										close()
									}}
								/>
							)}
						/>
					</div>
					<div style={{ marginTop: 12 }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								marginBottom: 6,
							}}
						>
							<span
								className="text-sm"
								style={{ color: 'var(--theme-elevation-600)' }}
							>
								스튜디오 개방
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() =>
									commitNodeConfig({
										imageInput: nodeConfigs[selected.id]?.imageInput
											? undefined
											: {},
									})
								}
								title={
									nodeConfigs[selected.id]?.imageInput
										? '이미지 슬롯 닫기 — 유저 화면에서 숨김'
										: '이미지 슬롯 열기 — 유저 화면에 이미지 생성 노출'
								}
								aria-label={
									nodeConfigs[selected.id]?.imageInput
										? '이미지 슬롯 닫기'
										: '이미지 슬롯 열기'
								}
							>
								{nodeConfigs[selected.id]?.imageInput ? '🔓' : '🔒'}
							</Button>
							<span
								className="text-xs"
								style={{ color: 'var(--theme-elevation-500)' }}
							>
								{nodeConfigs[selected.id]?.imageInput ? '유저 화면에 열림' : '닫힘'}
							</span>
						</div>
						{nodeConfigs[selected.id]?.imageInput && (
							<ImageSlotSpecEditor
								imageInput={nodeConfigs[selected.id]?.imageInput ?? {}}
								onChange={(imageInput) => commitNodeConfig({ imageInput })}
							/>
						)}
					</div>
					{/* 캐리어가 있어야 transform을 받을 수 있다 — 레거시 프레임 배경 경로는 compose가 무시. */}
					{nodeConfigs[selected.id]?.backgroundImage && selected.hasImageCarrier && (
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

			{selected &&
				!selected.isText &&
				!selected.isVector &&
				!IMAGE_ASSIGN_TYPES.has(selected.figmaType) && (
					<p className="text-sm" style={{ color: 'var(--theme-elevation-500)' }}>
						{typeLabel(selected.figmaType)} 레이어는 아직 편집할 값이 없습니다.
					</p>
				)}
		</div>
	)
}
