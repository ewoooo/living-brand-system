// Figma Dev Mode(get_design_context) → React+Tailwind 그대로 구현 검증용 임시 페이지.
// 소스: -TF- Living Design System / node 169:84 (3×3, 1:2:3 그리드). MCP 출력의 `___`·`Inter:Regular` 글리치만 정리.
// 원본 캔버스 3110×2195라 화면에 담기게 scale만 감쌈 (디자인 자체는 미변경).

const SCALE = 0.22

export default function FigmaTestPage() {
	return (
		<main className="min-h-full overflow-auto p-8">
			<h1 className="mb-4 text-sm text-neutral-500">
				figma 169:84 — 3×3 (1:2:3) 그대로 구현
			</h1>
			<div
				style={{
					width: 3110 * SCALE,
					height: 2195 * SCALE,
					overflow: 'hidden',
				}}
			>
				<div
					style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
					className="[word-break:break-word] relative grid h-[2195px] w-[3110px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,3fr)] grid-rows-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,3fr)] gap-x-[10px] gap-y-[10px] whitespace-nowrap bg-white p-[40px] font-['Inter'] font-normal text-[140px] text-black leading-[normal] not-italic"
					data-node-id="169:84"
				>
					<p
						className="relative col-1 row-1 shrink-0 justify-self-start self-start"
						data-node-id="169:87"
					>
						01
					</p>
					<p
						className="relative col-2 row-1 shrink-0 justify-self-start self-start"
						data-node-id="169:89"
					>
						01
					</p>
					<p
						className="relative col-3 row-1 shrink-0 justify-self-start self-start"
						data-node-id="169:91"
					>
						01
					</p>
					<p
						className="relative col-1 row-2 shrink-0 justify-self-start self-start"
						data-node-id="169:93"
					>
						01
					</p>
					<p
						className="relative col-2 row-2 shrink-0 justify-self-start self-start"
						data-node-id="169:95"
					>
						01
					</p>
					<p
						className="relative col-3 row-2 shrink-0 justify-self-start self-start"
						data-node-id="169:97"
					>
						01
					</p>
					<p
						className="relative col-1 row-3 shrink-0 justify-self-start self-start"
						data-node-id="169:99"
					>
						01
					</p>
					<p
						className="relative col-2 row-3 shrink-0 justify-self-start self-start"
						data-node-id="169:101"
					>
						01
					</p>
					<p
						className="relative col-3 row-3 shrink-0 justify-self-start self-start"
						data-node-id="169:103"
					>
						01
					</p>
				</div>
			</div>
		</main>
	)
}
