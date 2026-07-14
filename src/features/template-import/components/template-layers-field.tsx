'use client'

import { Button, Popup, toast, useForm, useFormFields } from '@payloadcms/ui'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { generateOneText } from '@/features/text-generation/generate-one-text'

/**
 * Templates 편집 폼(Admin)의 워크스페이스 — 렌더 캔버스 + 레이어 패널 + 값 편집을 한 곳에서 다룬다.
 * 레이아웃: [캔버스(가변폭·중앙정렬) | 레이어 목록(고정폭)] → divider → 선택 레이어 값 편집.
 * 편집은 Figma가 아니라 "값 교체"만: 텍스트 내용·프레임 배경 이미지. 레이아웃/위치는 Figma가 소유한다.
 */
interface LayerRow {
	id: string
	depth: number
	name: string
	figmaType: string
	isText: boolean
	text: string
}

const CANVAS_HEIGHT = 560
const LAYER_WIDTH = 260

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
	BOOLEAN_OPERATION: '불리언',
}
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t

// 배경 설정 트리거 버튼 공통 스타일(에셋 가져오기 · AI 생성).
const TRIGGER_STYLE: CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 4,
	fontSize: 12,
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
			text: isText ? (el.textContent ?? '') : '',
		})
		for (const child of Array.from(el.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
}

// html 문자열에서 특정 노드의 텍스트만 교체해 되돌린다. 직렬화가 style의 " 를 &quot;로 다시 이스케이프하므로 안전.
function setNodeText(html: string, nodeId: string, text: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const el = doc.querySelector(`[data-node-id="${nodeId}"]`)
	if (!el) return html
	el.textContent = text
	return doc.body.innerHTML
}

// 특정 노드에 배경 이미지를 얹는다. CSSOM(el.style)으로 세팅해 data-URI 안의 ';'가 CSS 선언 구분자로 오인되는 걸 피한다.
// background(color/gradient) shorthand는 남기고 background-image만 덧씌운다(figma 배경색 위에 이미지).
function setNodeBackground(html: string, nodeId: string, src: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const el = doc.querySelector(`[data-node-id="${nodeId}"]`)
	if (!(el instanceof HTMLElement)) return html
	el.style.backgroundImage = `url("${src}")`
	el.style.backgroundSize = 'cover'
	el.style.backgroundPosition = 'center'
	el.style.backgroundRepeat = 'no-repeat'
	return doc.body.innerHTML
}

// Popup 안에 뜨는 AI 생성 폼. Popup이 열릴 때만 마운트되므로 프롬프트는 열 때마다 초기화된다.
function AiTextForm({ onApply }: { onApply: (text: string) => void }) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || loading) return
		setLoading(true)
		try {
			const text = await generateOneText(trimmed)
			if (text) onApply(text)
			else toast.error('생성 실패 — 프롬프트를 바꾸거나 잠시 후 다시 시도하세요.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ width: 260, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
			<span style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>
				AI 텍스트 생성
			</span>
			<textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				rows={3}
				placeholder="예: 12자 이내 캐치프레이즈, 존댓말"
				style={{
					width: '100%',
					fontSize: 13,
					padding: 6,
					borderRadius: 4,
					border: '1px solid var(--theme-elevation-150)',
					background: 'var(--theme-input-bg)',
					color: 'var(--theme-text)',
				}}
			/>
			<Button
				buttonStyle="primary"
				size="small"
				disabled={loading || !prompt.trim()}
				onClick={run}
			>
				{loading ? '생성 중...' : '생성'}
			</Button>
		</div>
	)
}

// Popup 안에 뜨는 AI 이미지 생성 폼. 프레임 배경으로 얹는다. /api/image는 base64 data-URI를 돌려주므로 CSP 걱정 없다.
function AiImageForm({ onApply }: { onApply: (src: string) => void }) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || loading) return
		setLoading(true)
		try {
			// sceneId:'free' — 브랜드 제품 씬 합성 없이 프롬프트 원문대로. 배경은 제품샷이 아니라 사용자가 묘사한 그대로여야 한다.
			const response = await fetch('/api/image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: trimmed, count: 1, sceneId: 'free' }),
			})
			const data = (await response.json().catch(() => null)) as { images?: string[] } | null
			const src = data?.images?.[0]
			if (src) onApply(src)
			else toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} catch {
			toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ width: 260, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
			<span style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>
				AI 배경 이미지 생성
			</span>
			<textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				rows={3}
				placeholder="예: 미니멀한 파스텔 그라디언트 배경"
				style={{
					width: '100%',
					fontSize: 13,
					padding: 6,
					borderRadius: 4,
					border: '1px solid var(--theme-elevation-150)',
					background: 'var(--theme-input-bg)',
					color: 'var(--theme-text)',
				}}
			/>
			<Button
				buttonStyle="primary"
				size="small"
				disabled={loading || !prompt.trim()}
				onClick={run}
			>
				{loading ? '생성 중...' : '생성'}
			</Button>
		</div>
	)
}

export default function TemplateLayersField() {
	const { dispatchFields, setModified } = useForm()
	const html = useFormFields(([fields]) => fields.html?.value) as string | undefined
	const width = useFormFields(([fields]) => fields.width?.value) as number | undefined
	const height = useFormFields(([fields]) => fields.height?.value) as number | undefined
	const [selectedId, setSelectedId] = useState<string | null>(null)

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

	const w = typeof width === 'number' && width > 0 ? width : 0
	const h = typeof height === 'number' && height > 0 ? height : 0
	const availW = canvasWidth || 640
	const scale = w && h ? Math.min(1, (availW - 32) / w, (CANVAS_HEIGHT - 32) / h) : 1

	function commitText(text: string) {
		if (typeof html !== 'string' || !selectedId) return
		dispatchFields({ type: 'UPDATE', path: 'html', value: setNodeText(html, selectedId, text) })
		setModified(true)
	}

	function commitBackground(src: string) {
		if (typeof html !== 'string' || !selectedId) return
		dispatchFields({
			type: 'UPDATE',
			path: 'html',
			value: setNodeBackground(html, selectedId, src),
		})
		setModified(true)
	}

	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			{/* 캔버스(가변폭·중앙정렬) + 레이어 목록(고정폭) */}
			<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
					{hasHtml && w && h ? (
						<div style={{ width: w * scale, height: h * scale }}>
							<div
								style={{
									width: w,
									height: h,
									transform: `scale(${scale})`,
									transformOrigin: 'top left',
								}}
								// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음)
								dangerouslySetInnerHTML={{ __html: html as string }}
							/>
						</div>
					) : (
						<span style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>
							Figma에서 가져오면 여기에 표시됩니다.
						</span>
					)}
				</div>

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
					<strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
						레이어
					</strong>
					{layers.length === 0 && (
						<p style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
							레이어 없음
						</p>
					)}
					{layers.map((layer) => {
						const isSelected = layer.id === selectedId
						return (
							<button
								key={layer.id}
								type="button"
								onClick={() => setSelectedId(layer.id)}
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
									fontSize: 13,
									lineHeight: '22px',
									background: isSelected
										? 'var(--theme-elevation-100)'
										: 'transparent',
									color: layer.isText
										? 'var(--theme-text)'
										: 'var(--theme-elevation-600)',
								}}
							>
								<span
									style={{
										flexShrink: 0,
										fontSize: 11,
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
			</div>

			<hr
				style={{
					border: 'none',
					borderTop: '1px solid var(--theme-elevation-150)',
					margin: 'var(--base) 0',
				}}
			/>

			{/* 선택 레이어 값 편집 */}
			{!selected && (
				<p style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
					{hasHtml ? '레이어를 선택하면 값을 편집할 수 있습니다.' : ''}
				</p>
			)}

			{selected?.isText && (
				<div>
					<label style={{ display: 'block' }}>
						<span
							style={{
								display: 'block',
								fontSize: 12,
								marginBottom: 4,
								color: 'var(--theme-elevation-600)',
							}}
						>
							텍스트 편집 — {selected.name}
						</span>
						<textarea
							value={selected.text}
							onChange={(event) => commitText(event.target.value)}
							rows={2}
							style={{
								width: '100%',
								fontSize: 13,
								padding: 6,
								borderRadius: 4,
								border: '1px solid var(--theme-elevation-150)',
								background: 'var(--theme-input-bg)',
								color: 'var(--theme-text)',
							}}
						/>
					</label>
					<div style={{ marginTop: 6 }}>
						<Popup
							buttonType="custom"
							verticalAlign="top"
							horizontalAlign="left"
							size="fit-content"
							button={<span style={TRIGGER_STYLE}>✨ AI 생성</span>}
							render={({ close }) => (
								<AiTextForm
									onApply={(text) => {
										commitText(text)
										close()
									}}
								/>
							)}
						/>
					</div>
				</div>
			)}

			{selected?.figmaType === 'FRAME' && (
				<div>
					<span
						style={{
							display: 'block',
							fontSize: 12,
							marginBottom: 4,
							color: 'var(--theme-elevation-600)',
						}}
					>
						배경 설정 — {selected.name}
					</span>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={() => toast.info('에셋에서 가져오기는 준비 중입니다.')}
							style={TRIGGER_STYLE}
						>
							에셋에서 가져오기
						</button>
						<Popup
							buttonType="custom"
							verticalAlign="top"
							horizontalAlign="left"
							size="fit-content"
							button={<span style={TRIGGER_STYLE}>✨ AI 생성</span>}
							render={({ close }) => (
								<AiImageForm
									onApply={(src) => {
										commitBackground(src)
										close()
									}}
								/>
							)}
						/>
					</div>
				</div>
			)}

			{selected && !selected.isText && selected.figmaType !== 'FRAME' && (
				<p style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
					{typeLabel(selected.figmaType)} 레이어는 아직 편집할 값이 없습니다.
				</p>
			)}
		</div>
	)
}
