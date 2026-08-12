import { hasUnsafeTemplateControlCharacter } from '@/features/template-core/domain/template-asset-policy'

const ALLOWED_STYLE_PROPERTIES = new Set([
	// Figma 텍스트 말줄임(textTruncation ENDING) lowering이 방출하는 line-clamp 3종 세트의 일부.
	'-webkit-box-orient',
	'-webkit-line-clamp',
	'align-content',
	'align-items',
	'align-self',
	'backdrop-filter',
	'background',
	'background-color',
	'background-image',
	'background-position',
	'background-repeat',
	'background-size',
	'border',
	'border-bottom-width',
	'border-color',
	'border-left-width',
	'border-radius',
	'border-right-width',
	'border-style',
	'border-top-width',
	'bottom',
	'box-shadow',
	'box-sizing',
	'color',
	'column-gap',
	'display',
	'filter',
	'flex-direction',
	'flex-grow',
	'flex-wrap',
	'font-family',
	'font-size',
	'font-style',
	'font-weight',
	'gap',
	'grid-auto-flow',
	'grid-column',
	'grid-row',
	'grid-template-columns',
	'grid-template-rows',
	'height',
	'justify-content',
	'justify-self',
	'left',
	'letter-spacing',
	'line-height',
	'margin',
	// compose 컬러 치환(imageColorize) 배경 생략 시 반전 마스크가 쓰는 subtract 합성.
	'mask-composite',
	'mask-image',
	// compose 컬러 치환(imageColorize)이 생성 이미지 마스크에 쓰는 luminance 모드.
	'mask-mode',
	'mask-position',
	'mask-repeat',
	'mask-size',
	'mix-blend-mode',
	'object-fit',
	'opacity',
	'overflow',
	'padding',
	'position',
	'right',
	'row-gap',
	'text-align',
	'text-decoration',
	'text-transform',
	'top',
	'transform',
	'white-space',
	'width',
])
const URL_STYLE_PROPERTIES = new Set(['background-image', 'mask-image'])

function containsCssFunction(value: string, name: string): boolean {
	const lower = value.toLowerCase()
	let cursor = 0

	while (cursor < lower.length) {
		const index = lower.indexOf(name, cursor)
		if (index < 0) return false
		const before = index === 0 ? '' : lower[index - 1]
		let after = index + name.length
		while (after < lower.length && /\s/.test(lower[after] ?? '')) after += 1
		if ((!before || !/[a-z0-9_-]/.test(before)) && lower[after] === '(') return true
		cursor = index + name.length
	}

	return false
}

function splitStyleDeclarations(style: string): string[] | null {
	const declarations: string[] = []
	let start = 0
	let quote = ''
	let parentheses = 0

	for (let index = 0; index < style.length; index += 1) {
		const character = style[index] ?? ''
		if (quote) {
			if (character === quote) quote = ''
			continue
		}
		if (character === '"' || character === "'") {
			quote = character
			continue
		}
		if (character === '(') parentheses += 1
		else if (character === ')') {
			if (parentheses === 0) return null
			parentheses -= 1
		} else if (character === ';' && parentheses === 0) {
			declarations.push(style.slice(start, index))
			start = index + 1
		}
	}

	if (quote || parentheses !== 0) return null
	declarations.push(style.slice(start))
	return declarations
}

/** Inline style을 허용 목록으로 검사하고 직접 참조한 이미지 URL을 돌려준다. */
export function inspectTemplateStyle(style: string): { blocker?: string; urls: string[] } {
	if (
		hasUnsafeTemplateControlCharacter(style, true) ||
		style.includes('\\') ||
		style.includes('/*') ||
		style.includes('*/') ||
		style.includes('@')
	) {
		return { blocker: 'HTML style에 허용하지 않는 CSS 구문이 있습니다.', urls: [] }
	}

	const declarations = splitStyleDeclarations(style)
	if (!declarations) return { blocker: 'HTML style 선언 형식이 올바르지 않습니다.', urls: [] }

	const urls: string[] = []
	for (const rawDeclaration of declarations) {
		const declaration = rawDeclaration.trim()
		if (!declaration) continue

		const separator = declaration.indexOf(':')
		if (separator <= 0) {
			return { blocker: 'HTML style 선언 형식이 올바르지 않습니다.', urls: [] }
		}

		const property = declaration.slice(0, separator).trim()
		const value = declaration.slice(separator + 1).trim()
		if (property !== property.toLowerCase() || !ALLOWED_STYLE_PROPERTIES.has(property)) {
			return { blocker: `HTML style에서 허용하지 않는 속성입니다: ${property}`, urls: [] }
		}
		if (!value) return { blocker: `HTML style 속성 값이 비어 있습니다: ${property}`, urls: [] }
		if (value.toLowerCase().includes('!important')) {
			return {
				blocker: `HTML style에서 !important를 사용할 수 없습니다: ${property}`,
				urls: [],
			}
		}

		if (property === 'position' && value !== 'absolute' && value !== 'relative') {
			return { blocker: 'HTML style의 position 값이 허용 범위를 벗어났습니다.', urls: [] }
		}
		if (property === 'display' && !['-webkit-box', 'block', 'flex', 'grid'].includes(value)) {
			return { blocker: 'HTML style의 display 값이 허용 범위를 벗어났습니다.', urls: [] }
		}

		const hasUrl = containsCssFunction(value, 'url')
		const hasIndirectImage = [
			'-webkit-image-set',
			'element',
			'image',
			'image-set',
			'paint',
			'src',
		].some((name) => containsCssFunction(value, name))
		if (hasIndirectImage) {
			return { blocker: 'HTML style의 동적 이미지 함수는 사용할 수 없습니다.', urls: [] }
		}

		if (!URL_STYLE_PROPERTIES.has(property)) {
			if (hasUrl) return { blocker: 'HTML style URL 위치가 허용되지 않습니다.', urls: [] }
			continue
		}

		// compose 반전 마스크(imageColorize 배경 생략)의 기준층 linear-gradient는 URL 레이어가
		// 아니다 — 벗겨내고 남은 url 레이어만 검사한다(CSSOM이 색을 rgb()로 재직렬화해도 매치).
		// gradient 안에 url(이 섞이면 벗기지 않아 아래 단일 url 검사에서 막힌다.
		let urlValue = value
		if (property === 'mask-image') {
			const gradientPrefix = value.match(
				/^linear-gradient\((?:[^()]|\([^()]*\))*\)\s*,\s*/i,
			)?.[0]
			if (gradientPrefix && !containsCssFunction(gradientPrefix, 'url')) {
				urlValue = value.slice(gradientPrefix.length)
			}
		}
		const match = urlValue.match(/^url\(\s*(?:"([^"]+)"|'([^']+)'|([^"'()\s]+))\s*\)$/i)
		const url = match?.[1] ?? match?.[2] ?? match?.[3]
		if (!hasUrl || !url || hasUnsafeTemplateControlCharacter(url)) {
			return { blocker: 'HTML style URL 형식이 올바르지 않습니다.', urls: [] }
		}
		urls.push(url)
	}

	return { urls }
}
