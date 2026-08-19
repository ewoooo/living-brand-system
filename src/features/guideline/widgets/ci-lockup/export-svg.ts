'use client'

import { FONT, INK_BASELINE } from './rules'

/*
 * 화면에 떠 있는 락업을 그대로 SVG 파일로 내보낸다. 팀 공유용이라 **지금 보이는 것**이 정답이고,
 * 치수·여백 가이드 같은 주석은 담지 않는다(로고가 아니라 설명이므로).
 *
 * 🔑 좌표를 다시 계산하지 않고 **렌더된 DOM을 한 번 잰다.** 이 리포는 글자 폭을 계산하지 않으므로
 *    (`rules.ts` FONT 주석) 락업의 최종 좌표는 레이아웃만 알고 있다. 내보내기는 한 번만 일어나는
 *    동작이라 재는 비용도, 전환과 얽힐 위험도 없다 — 애니메이션이 도는 중에 눌러도 그 순간의
 *    화면이 나가는 것이 맞다.
 * 🔴 그래서 이 파일은 **모양을 정하지 않는다.** 규정은 `rules.ts`, 렌더는 `view.tsx`가 갖고,
 *    여기는 그 결과를 옮겨 적는 일만 한다.
 */

/** 🔴 정본 서체가 오면 `rules.ts`의 `FONT`와 함께 이 둘도 간다(임시 대체 서체다). */
const FONT_FILE = '/fonts/hd/Isamanru-Medium.woff2'
const FONT_FAMILY = 'Isamanru'

/** 파일이 사람 눈에 읽히게 소수점을 자른다. 0.01px은 어차피 아무 의미가 없다. */
const n = (v: number) => Math.round(v * 100) / 100

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * 서체를 data URI로 심는다 — 받는 사람 기기에 서체가 없어도 브라우저에서 정본대로 보인다.
 * 🔴 못 심어도 내보내기는 계속한다. 폴백 서체로 보이는 파일이 아무 파일도 없는 것보다 낫다.
 */
async function fontStyle(): Promise<string> {
	try {
		const bytes = new Uint8Array(await (await fetch(FONT_FILE)).arrayBuffer())
		// 🔴 한 번에 펼치면 인자 개수 한계로 스택이 넘친다(서체가 330KB다). 조각내서 잇는다.
		const CHUNK = 0x8000
		let raw = ''
		for (let i = 0; i < bytes.length; i += CHUNK)
			raw += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
		return `<style>@font-face{font-family:"${FONT_FAMILY}";font-weight:${FONT.weight};src:url(data:font/woff2;base64,${btoa(raw)}) format("woff2")}</style>`
	} catch {
		return ''
	}
}

/**
 * `root` 안의 잉크(심볼·글자·구분바)를 SVG 문자열로 옮긴다.
 * `withBackground`면 `root`의 배경색을 판으로 깔고 `root` 크기를 그대로 문서 크기로 쓴다.
 */
export async function lockupSvg(root: HTMLElement, withBackground: boolean): Promise<string> {
	const box = root.getBoundingClientRect()
	const body: string[] = []

	if (withBackground)
		body.push(
			`<rect width="100%" height="100%" fill="${getComputedStyle(root).backgroundColor}"/>`,
		)

	// 구분바 — 글자가 아니라 면이다(계열사 락업).
	for (const bar of root.querySelectorAll<HTMLElement>('[data-ink="bar"]')) {
		const r = bar.getBoundingClientRect()
		body.push(
			`<rect x="${n(r.left - box.left)}" y="${n(r.top - box.top)}" width="${n(r.width)}" height="${n(r.height)}" fill="${getComputedStyle(bar).backgroundColor}"/>`,
		)
	}

	// 심볼 — 화면의 것을 **그대로 복제**한다. 이미 좌표로 그린 SVG라 다시 만들 이유가 없다.
	for (const symbol of root.querySelectorAll('svg')) {
		const r = symbol.getBoundingClientRect()
		const clone = symbol.cloneNode(true) as SVGSVGElement
		clone.removeAttribute('class')
		clone.removeAttribute('aria-hidden')
		// 전환용 인라인 스타일은 파일에서 의미가 없다.
		for (const styled of clone.querySelectorAll('[style]')) styled.removeAttribute('style')
		clone.setAttribute('x', String(n(r.left - box.left)))
		clone.setAttribute('y', String(n(r.top - box.top)))
		clone.setAttribute('width', String(n(r.width)))
		clone.setAttribute('height', String(n(r.height)))
		body.push(clone.outerHTML)
	}

	// 글자 — 조각(라틴/한글)마다 한 줄이다. 조판은 브라우저가 한 그대로 옮긴다.
	for (const run of root.querySelectorAll<HTMLElement>('[data-ink="text"]')) {
		const r = run.getBoundingClientRect()
		const style = getComputedStyle(run)
		const size = Number.parseFloat(style.fontSize)
		// 🔑 베이스라인은 재는 것이 아니라 계산이다 — `line-height: 1`이라 줄상자 위에서 정확히
		//    `INK_BASELINE × font-size` 아래다. rect는 줄상자를 주므로 그 차이를 여기서 더한다.
		body.push(
			`<text x="${n(r.left - box.left)}" y="${n(r.top - box.top + INK_BASELINE * size)}" font-family="${FONT_FAMILY}" font-size="${n(size)}" font-weight="${style.fontWeight}" fill="${style.color}" xml:space="preserve">${esc(run.textContent ?? '')}</text>`,
		)
	}

	const w = n(box.width)
	const h = n(box.height)
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${await fontStyle()}${body.join('')}</svg>`
}

/** 브라우저에 파일로 내려 준다. */
export function downloadSvg(filename: string, svg: string) {
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}
