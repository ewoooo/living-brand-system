import { isValidHex } from '@/lib/color'
import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { compact } from '../utils/block-text'

export type CmsSection = NonNullable<GuidelineDocument['sections']>[number]
export type CmsContainer = NonNullable<CmsSection['containers']>[number]
export type CmsCard = NonNullable<CmsContainer['cards']>[number]
export type CmsBody = Pick<GuidelineDocument, 'contentModel' | 'sections'>

/** CMS 링크는 사이트 경로·앵커·HTTP(S)만 허용합니다. 렌더 경계에서도 같은 검사를 합니다. */
export function isGuidelineActionHref(value: string | null | undefined): value is string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: URL의 제어 문자 우회를 차단합니다.
	if (!value || value !== value.trim() || /[\\\s\u0000-\u001f\u007f]/.test(value)) return false
	if (value.startsWith('/') && !value.startsWith('//')) return true
	if (value.startsWith('#')) return value.length > 1
	if (!/^https?:\/\//i.test(value)) return false
	try {
		const url = new URL(value)
		return Boolean(url.hostname) && !url.username && !url.password
	} catch {
		return false
	}
}

export const sectionTitle = (section: Pick<CmsSection, 'type' | 'title'>) =>
	section.type === 'incorrect-usages' ? 'Incorrect Usages' : (section.title ?? '')

/** populate되지 않았거나 읽을 수 없는 파일은 링크를 만들지 않는다. */
export function resolveFile(reference: CmsCard['display']['image'] | undefined | null) {
	const file = reference?.value
	if (!file || typeof file !== 'object' || !file.url || !file.filename) return null
	return {
		url: file.url,
		filename: file.filename,
		alt: ('alt' in file ? file.alt : '') || file.name,
	}
}

export function resolveColor(color: number | BrandColor | undefined | null) {
	return color && typeof color === 'object' && isValidHex(color.hex)
		? {
				id: String(color.id),
				label: color.name,
				value: `#${color.hex.replace(/^#/, '')}`,
				cmyk: color.cmyk,
				pantone: color.pantone,
			}
		: null
}

/** 선택하지 않은 디스플레이의 숨은 입력값은 다운로드에 섞지 않습니다. */
export function displayFiles(display: CmsCard['display']) {
	const refs =
		display.type === 'image'
			? [display.image]
			: display.type === 'guide'
				? [display.image, display.guide]
				: display.type === 'layout-overlay'
					? (display.images ?? []).map((value) => ({
							relationTo: 'application-images' as const,
							value,
						}))
					: display.type === 'logo-background'
						? [display.logos?.black, display.logos?.white]
						: display.type === 'palette' && display.variant === 'logo-backgrounds'
							? [display.logos?.default, display.logos?.white, display.logos?.mono]
							: []
	const files = refs.flatMap((ref) => {
		const file = resolveFile(ref)
		return file ? [file] : []
	})
	return files.filter(
		(file, index) => files.findIndex((candidate) => candidate.url === file.url) === index,
	)
}

export function cardFiles(card: CmsCard) {
	if (card.download?.source === 'assets') return displayFiles(card.display)
	if (card.download?.source === 'registered')
		return (card.download.files ?? []).flatMap((ref) => {
			const file = resolveFile(ref)
			return file ? [file] : []
		})
	return []
}

export function sectionFiles(section: CmsSection) {
	const files =
		section.download?.source === 'assets'
			? (section.containers ?? []).flatMap((container) =>
					(container.cards ?? []).flatMap((card) => displayFiles(card.display)),
				)
			: section.download?.source === 'registered'
				? (section.download.files ?? []).flatMap((ref) => {
						const file = resolveFile(ref)
						return file ? [file] : []
					})
				: []
	return files.filter(
		(file, index) => files.findIndex((candidate) => candidate.url === file.url) === index,
	)
}

export function needsPaletteCatalog(body: CmsBody) {
	return (
		body.contentModel === 'sections' &&
		body.sections?.some((section) =>
			section.containers?.some((container) =>
				container.cards?.some(({ display }) =>
					['palette', 'logo-background', 'layout-grid', 'layout-overlay'].includes(
						display.type,
					),
				),
			),
		)
	)
}

export function projectSection(section: CmsSection) {
	const captions = compact(
		(section.containers ?? []).flatMap((container) =>
			(container.cards ?? []).flatMap(({ caption, selectionLabel, display, endActions }) => [
				selectionLabel,
				...(endActions ?? []).flatMap((action) => [
					action.label,
					action.type === 'copy' ? action.value : action.href,
				]),
				...(display.type === 'image' || display.type === 'guide' ? [display.alt] : []),
				...(display.type === 'swatch'
					? [resolveColor(display.color)?.label, resolveColor(display.color)?.value]
					: []),
				caption?.title,
				caption?.description,
				...(caption?.type !== 'basic'
					? (caption?.rows ?? []).flatMap((row) => [row.label, row.value])
					: []),
			]),
		),
	)
	const title = sectionTitle(section)
	return {
		text: compact([title, section.anchor, section.description, ...captions]).join('\n'),
		evidence: {
			type: 'section' as const,
			title,
			anchor: section.anchor ?? undefined,
			description: section.description ?? undefined,
			captions,
		},
		referenceAssets: [],
	}
}
