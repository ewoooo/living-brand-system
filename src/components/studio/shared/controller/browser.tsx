'use client'

import { Close } from '@carbon/icons-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

/** 패널이 뜰 좌표계이자 포털 목적지 — Root가 자기 DOM 노드를 내려주고 Panel이 그리로 옮겨 붙는다. */
const BrowserFrameContext = React.createContext<HTMLElement | null>(null)

type ControllerBrowserRootProps = {
	className?: string
	children: React.ReactNode
}

/**
 * 자산 브라우저 컴파운드의 뿌리 — 열림 상태와 패널의 위치 기준을 함께 소유한다.
 *
 * 열림은 radix가 소유하는 비제어 상태다. 소비자는 useState를 들지 않고, 트리거·닫기·Esc가
 * 그 상태를 움직인다. ui/dialog의 DialogContent는 스크림(DialogOverlay)과 화면 중앙 고정을
 * 함께 소유해서 쓸 수 없어 radix Dialog를 modal={false}로 직접 감싼다 — 스크림 없이 캔버스가
 * 계속 보이고 조작되면서도 Esc 닫기·role="dialog"·닫은 뒤 트리거로 포커스 복귀는 radix가 갖는다.
 *
 * Trigger·Panel은 이 Root의 Dialog 컨텍스트가 없으면 렌더에서 죽는다 — 짝이 구조로 강제된다.
 */
function ControllerBrowserRoot({ className, children }: ControllerBrowserRootProps) {
	const [frame, setFrame] = React.useState<HTMLDivElement | null>(null)

	return (
		<DialogPrimitive.Root modal={false}>
			<div
				ref={setFrame}
				data-slot="controller-browser"
				className={cn('relative h-full', className)}
			>
				<BrowserFrameContext.Provider value={frame}>
					{children}
				</BrowserFrameContext.Provider>
			</div>
		</DialogPrimitive.Root>
	)
}

/** 패널을 여는 버튼 자리 — 자산 브라우저 안에만 존재한다(무엇을 여는지가 계약으로 남는다). */
function ControllerBrowserTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="controller-browser-trigger" {...props} />
}

/** 고르면 닫히는 자리 — 패널 본문의 선택 버튼이 asChild로 감싸 쓴다(닫기는 radix가 소유). */
function ControllerBrowserClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="controller-browser-close" {...props} />
}

type ControllerBrowserPanelProps = {
	/** 탭 라벨 — 지금은 하나(Image Profiles)다. 전체가 패널의 접근 이름을 겸한다. */
	tabs: readonly string[]
	/** 본문이 비었을 때 그리드 아래 자리에 앉는 안내. */
	empty?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/**
 * 컨트롤러 왼쪽에 떠서 캔버스를 덮는 글래스 패널 — 도메인 무지: 무엇을 고르는 브라우저인지 모른다.
 * 소유하는 것은 글래스 크롬, 헤더(탭 + 닫기), 본문 영역, 빈 상태 자리뿐이다.
 *
 * 색: 테마와 무관하게 어두운 글래스를 의도한 디자인이지만 생 rgba를 쓰지 않는다(docs/09 §4).
 * `inverted` 표면 쌍으로 내부 겹침을 쌓는다 — 다크 테마에서는 쌍이 함께 뒤집혀 밝은 글래스가 된다.
 */
function ControllerBrowserPanel({ tabs, empty, className, children }: ControllerBrowserPanelProps) {
	const frame = React.useContext(BrowserFrameContext)

	const content = (
		<DialogPrimitive.Content
			data-slot="controller-browser-panel"
			// 설명 문단이 없다 — 비워두지 않으면 radix가 존재하지 않는 id를 가리킨다.
			aria-describedby={undefined}
			className={cn(
				// 상한은 top-5만큼 줄인 남은 높이다 — 100%로 두면 컨트롤러 아래로 20px 넘친다.
				'absolute top-5 right-0 z-20 flex h-168 max-h-[calc(100%-1.25rem)] w-150 max-w-[calc(100vw-2rem)] flex-col gap-1 overflow-hidden rounded-xl border border-inverted-foreground/5 bg-inverted/75 p-2 text-inverted-foreground shadow-lg outline-none backdrop-blur-sm lg:right-full lg:mr-4',
				// 트리거가 있는 오른쪽에서 밀려 나온다 — 어디서 열렸는지가 방향으로 남는다.
				'duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-right-4 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-right-4 motion-reduce:animate-none',
				className,
			)}
		>
			<div className="flex shrink-0 items-center justify-end gap-3 py-1 pr-2">
				<DialogPrimitive.Title className="flex h-8 min-w-0 flex-1 items-center overflow-hidden">
					{tabs.map((tab) => (
						<Typography
							key={tab}
							as="span"
							size="base"
							weight="medium"
							className="flex h-8 items-center justify-center rounded-lg px-3"
						>
							{tab}
						</Typography>
					))}
				</DialogPrimitive.Title>
				<ControllerBrowserClose asChild>
					<Button
						variant="ghost"
						size="icon"
						shape="pill"
						className="bg-inverted-foreground/5 text-inverted-foreground hover:bg-inverted-foreground/15 hover:text-inverted-foreground focus-visible:bg-inverted-foreground/15 focus-visible:text-inverted-foreground"
					>
						<Close />
						<span className="sr-only">자산 브라우저 닫기</span>
					</Button>
				</ControllerBrowserClose>
			</div>
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-inverted-foreground/5 py-2 pr-1 pl-2">
				{children}
				{empty && (
					<div className="flex items-center justify-center p-6">
						<Typography
							as="p"
							size="sm"
							className="text-center text-inverted-foreground/80"
						>
							{empty}
						</Typography>
					</div>
				)}
			</div>
		</DialogPrimitive.Content>
	)

	// 패널을 여는 카드는 컨트롤러 패널(overflow-hidden) 안에 산다 — 거기서 뜨면 잘리므로
	// Root 프레임의 형제 자리로 옮긴다. 옮긴 뒤 DOM 순서·기준 박스는 손으로 짰을 때와 같다.
	return frame ? createPortal(content, frame) : content
}

/**
 * 탭을 가진 플로팅 자산 브라우저 — 트리거는 이 컴파운드 안에만 존재한다.
 * 카드 + 열기 버튼 형태의 소비자는 Controller.AssetCard가 이 파츠들을 조립해 만든다.
 */
export const ControllerBrowser = {
	Root: ControllerBrowserRoot,
	Trigger: ControllerBrowserTrigger,
	Panel: ControllerBrowserPanel,
	Close: ControllerBrowserClose,
}

export {
	ControllerBrowserClose,
	ControllerBrowserPanel,
	ControllerBrowserRoot,
	ControllerBrowserTrigger,
}
