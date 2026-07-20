import { getContrastingForeground } from '@/lib/color'

/**
 * 컬러 팔레트 스와치 — 데이터·레이아웃은 하나로 두고 렌더 스타일만 variant로 가른다.
 * - default: 칩 안에 이름/HEX 텍스트, 둥근 모서리, 칩 사이 gap. 폭을 균등 분할해 100% 채움.
 * - mini: 텍스트 없음, 둥근 모서리 없음, gap 없음(칩이 서로 붙음). 색 자체만 보이는 스트립.
 * onSelect를 주면 선택 가능(라디오)해진다. disabledIds로 비활성, selectedId로 선택 표시.
 * 브랜드 무관: 팔레트·규칙 전부 props.
 *
 * @example 기본 전시
 * <PaletteSwatches swatches={[{ id, name, hex }]} />
 * @example 미니 · 세로 · 선택 가능
 * <PaletteSwatches swatches={...} variant="mini" orientation="vertical" selectedId={id} onSelect={fn} />
 */
export type PaletteSwatch = { id: string; name: string; hex: string }

export function PaletteSwatches({
	swatches,
	variant = 'default',
	orientation = 'horizontal',
	selectedId,
	disabledIds,
	onSelect,
}: {
	swatches: PaletteSwatch[]
	variant?: 'default' | 'mini'
	/** mini일 때만 유효. 기본 horizontal. */
	orientation?: 'horizontal' | 'vertical'
	selectedId?: string | null
	disabledIds?: string[]
	onSelect?: (id: string) => void
}) {
	const mini = variant === 'mini'
	const vertical = mini && orientation === 'vertical'
	const selectable = Boolean(onSelect)

	const container = [
		'flex w-full',
		vertical ? 'h-full flex-col' : 'flex-row',
		mini ? 'gap-0' : 'gap-3',
	].join(' ')

	return (
		<div className={container}>
			{swatches.map((swatch) => {
				const disabled = disabledIds?.includes(swatch.id) ?? false
				const selected = selectedId === swatch.id
				const fg = getContrastingForeground(swatch.hex)

				const className = [
					'relative flex-1 border border-border transition-all',
					mini ? 'rounded-none' : 'rounded-lg',
					mini ? (vertical ? 'min-w-10' : 'h-12') : 'flex min-h-24 items-end p-3',
					selected
						? 'z-10 ring-2 ring-foreground ring-offset-2 ring-offset-background'
						: '',
					disabled ? 'cursor-not-allowed opacity-20' : '',
					selectable && !disabled ? 'cursor-pointer' : '',
				]
					.filter(Boolean)
					.join(' ')

				const label = mini ? null : (
					<span className="font-body text-xs leading-tight" style={{ color: fg }}>
						<span className="block font-medium">{swatch.name}</span>
						<span className="block opacity-80">{swatch.hex}</span>
					</span>
				)

				if (selectable) {
					return (
						<button
							key={swatch.id}
							type="button"
							aria-pressed={selected}
							aria-label={`${swatch.name} ${swatch.hex}`}
							title={`${swatch.name} · ${swatch.hex}`}
							disabled={disabled}
							onClick={() => onSelect?.(swatch.id)}
							className={className}
							style={{ backgroundColor: swatch.hex }}
						>
							{label}
						</button>
					)
				}

				return (
					<div
						key={swatch.id}
						title={`${swatch.name} · ${swatch.hex}`}
						className={className}
						style={{ backgroundColor: swatch.hex }}
					>
						{label}
					</div>
				)
			})}
		</div>
	)
}

// 프로토타입용 mock 팔레트(브랜드 무관). default·mini가 같은 색을 공유한다.
const palette: PaletteSwatch[] = [
	{ id: 'white', name: 'White', hex: '#FFFFFF' },
	{ id: 'black', name: 'Black', hex: '#000000' },
]

// 컬러 팔레트 — 같은 색을 default(텍스트·radius·gap)와 mini(스트립) 두 스타일로 함께 전시.
export function PaletteSwatchesDemo() {
	return (
		<div className="flex flex-col gap-4">
			<PaletteSwatches swatches={palette} />
			<PaletteSwatches swatches={palette} variant="mini" />
		</div>
	)
}
