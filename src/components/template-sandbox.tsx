'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { exportHtmlToPng } from '@/hooks/use-template-png-export'
import {
	collectOpenSlotElements,
	type JsonSlotElement,
	type JsonTemplate,
} from '@/types/json-template'

// ⚠️ 격리 경계. allow-same-origin/-top-navigation/-popups/-forms/-downloads/-modals 절대 추가 금지.
// allow-same-origin+allow-scripts 조합이면 미검증 코드가 자기 sandbox를 떼고 부모 origin(쿠키·DOM)에 닿는다.
const SANDBOX = 'allow-scripts'

// srcdoc <head> 최상단 필수(문서 파싱 시점 적용). connect-src none=fetch/XHR/beacon 유출 차단,
// img-src data:/blob:=이미지 비콘 유출 차단. script/style unsafe-inline은 임의 코드라 불가피(진짜 경계는 null-origin sandbox).
const CSP =
	"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"

const PREVIEW_WIDTH = 480
const OFFSCREEN = { position: 'fixed', left: -99999, top: 0 } as const

// 미신뢰 템플릿 코드에 주는 최소 런타임: __STAGE__/__SLOTS__ 매니페스트 + #__controls 컨테이너 + 텍스트·export 배관.
// #__controls를 #__stage(요소들의 offsetParent)의 자식으로 붙여 컨트롤과 요소가 같은 좌표계를 공유한다.
// __STAGE__는 모델(template.width/height) 값이라 DOM 레이아웃·origin 타이밍과 무관하게 항상 참 — 코드가
// 캔버스 크기를 offsetWidth로 재지 않아도 되게 한다(샌드박스 iframe은 실행 초기 offsetWidth가 0일 수 있음).
function buildRuntime(
	slots: { id: string; type: string }[],
	stage: { width: number; height: number },
): string {
	return `
	var stage = document.getElementById('__stage');
	var controls = Object.assign(document.createElement('div'), { id: '__controls' });
	// 요소들이 zIndex를 가지므로(absoluteFrameCss) 컨트롤은 그 위에 오도록 최상단. 빈 영역은 클릭 통과.
	controls.style.cssText = 'position:absolute;inset:0;z-index:2147483000;pointer-events:none';
	stage.appendChild(controls);
	window.__STAGE__ = ${JSON.stringify(stage)};
	window.__SLOTS__ = ${JSON.stringify(slots)};
	addEventListener('message', function (e) {
		if (e.source !== window.parent) return;
		var m = e.data || {};
		if (m.type === '__setText') {
			var el = document.getElementById(m.id);
			if (el) { el.textContent = m.text; if (window.__relayout) window.__relayout(); }
		} else if (m.type === '__export') {
			var clone = stage.cloneNode(true);
			var c = clone.querySelector('#__controls'); if (c) c.remove();
			parent.postMessage({ type: '__export-html', html: clone.outerHTML }, '*');
		}
	});
	parent.postMessage({ type: '__ready' }, '*');`
}

/**
 * 템플릿 코드(css/js)를 디자인 위에서 실행하는 호스트. 디자인은 TemplateRenderer를 화면 밖에 렌더해
 * #__stage outerHTML을 뽑고(드리프트 없이 렌더러 재사용, RSC의 react-dom/server 금지 회피),
 * 그 HTML + css + js를 iframe srcdoc에 구워 null-origin 샌드박스에서 돌린다.
 * 부모↔iframe은 postMessage(source 동일성 검증)로만 소통. 텍스트 슬롯은 __setText로 주입,
 * PNG는 iframe이 반송한 stage outerHTML을 부모가 캡처한다.
 */
export function TemplateSandbox({
	template,
	css,
	js,
	fileName,
}: {
	template: JsonTemplate
	css: string
	js: string
	fileName: string
}) {
	const { width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)

	const slots = useMemo(() => collectOpenSlotElements(template.elements), [template])
	const textSlots = slots.filter(
		(s): s is Extract<JsonSlotElement, { type: 'text' }> => s.type === 'text',
	)

	const ref = useRef<HTMLIFrameElement>(null)
	const measureRef = useRef<HTMLDivElement>(null)
	const [stageHtml, setStageHtml] = useState<string | null>(null)
	// 빈 값으로 시작해 placeholder(안내 문구)가 보이게 한다. iframe은 baked-in 기본 텍스트를 그대로 보여주다가
	// worker가 입력하면 __setText로 덮어쓴다.
	const [texts, setTexts] = useState<Record<string, string>>({})

	// 디자인 HTML은 화면 밖 TemplateRenderer(emitDomIds)에서 한 번 뽑는다. 뽑으면 measure DOM은 제거된다.
	useLayoutEffect(() => {
		if (stageHtml) return
		const stage = measureRef.current?.querySelector('#__stage')
		if (stage) setStageHtml(stage.outerHTML)
	}, [stageHtml])

	const srcDoc = useMemo(() => {
		if (!stageHtml) return null
		const safeJs = js.replace(/<\/script>/gi, '<\\/script>')
		const runtime = buildRuntime(
			slots.map((s) => ({ id: s.id, type: s.type })),
			{ width, height },
		)
		// 템플릿 코드는 파싱 시점(레이아웃 전, offsetWidth=0)이 아니라 stage가 실제로 배치된 뒤 실행한다.
		// 화면에 붙은 iframe은 보통 첫 rAF에 배치됨. 끝내 배치 안 되면(오프스크린 등) 프레임 상한에서 그냥 실행.
		const deferredJs =
			`(function(){function __run(){${safeJs}\n}var s=document.getElementById('__stage');var n=0;` +
			`(function w(){if((s&&s.offsetWidth>0)||n++>180){__run();}else{requestAnimationFrame(w);}})();})();`
		return (
			`<!doctype html><html><head><meta charset="utf-8">` +
			`<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
			`<style>*{margin:0;box-sizing:border-box}${css}</style></head>` +
			`<body>${stageHtml}<script>${runtime}</script><script>${deferredJs}</script></body></html>`
		)
	}, [stageHtml, css, js, slots, width, height])

	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.source !== ref.current?.contentWindow) return // origin은 'null'이라 무의미 → source 동일성만
			const m = e.data
			if (m?.type === '__export-html' && typeof m.html === 'string') {
				exportHtmlToPng(m.html, css, fileName)
			}
		}
		addEventListener('message', onMessage)
		return () => removeEventListener('message', onMessage)
	}, [css, fileName])

	function setText(id: string, text: string) {
		setTexts((cur) => ({ ...cur, [id]: text }))
		ref.current?.contentWindow?.postMessage({ type: '__setText', id, text }, '*')
	}

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			{!stageHtml && (
				<div ref={measureRef} style={OFFSCREEN} aria-hidden>
					<TemplateRenderer template={template} emitDomIds />
				</div>
			)}

			<div className="flex w-full flex-col gap-3 md:w-72">
				{textSlots.map((s) => (
					<div key={s.id} className="flex flex-col gap-1">
						<label htmlFor={`slot-${s.id}`} className="text-muted-foreground text-sm">
							{s.slotLabel ?? s.id}
						</label>
						<Textarea
							id={`slot-${s.id}`}
							rows={1}
							placeholder={s.placeholder ?? s.slotLabel}
							value={texts[s.id] ?? ''}
							onChange={(e) => setText(s.id, e.target.value)}
						/>
					</div>
				))}
				<Button
					onClick={() =>
						ref.current?.contentWindow?.postMessage({ type: '__export' }, '*')
					}
				>
					PNG로 내보내기
				</Button>
			</div>

			<div className="min-w-0">
				<div
					className="overflow-hidden rounded-md border border-border"
					style={{ width: width * scale, height: height * scale }}
				>
					{srcDoc && (
						<iframe
							ref={ref}
							title="template preview"
							sandbox={SANDBOX}
							referrerPolicy="no-referrer"
							srcDoc={srcDoc}
							style={{
								width,
								height,
								border: 0,
								transform: `scale(${scale})`,
								transformOrigin: 'top left',
							}}
						/>
					)}
				</div>
			</div>
		</section>
	)
}
