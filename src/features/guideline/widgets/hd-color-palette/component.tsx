import config from '@payload-config'
import { getPayload } from 'payload'
import { Typography } from '@/components/ui/typography'
import { getContrastingForeground, hexToRgb, isValidHex } from '@/lib/color'
import type { BrandColor } from '@/payload-types'

// 위젯(서버): brand-color-groups를 조회해 그룹당 한 행씩 스와치를 그린다.
// 정렬 로직이 없다 — 행 순서는 컬렉션 defaultSort, 행 안의 순서는 그룹이 가진 관계 배열 순서다.
// essenherb 레거시 색은 어느 그룹에도 연결돼 있지 않아 여기 걸러낼 것이 없다.
// RGB는 저장값이 아니라 hex에서 파생한다(BrandColors가 RGB를 저장하지 않는 이유와 같다).
export async function HdColorPaletteWidget() {
	const payload = await getPayload({ config })
	const { docs: groups } = await payload.find({
		collection: 'brand-color-groups',
		limit: 50,
		depth: 1,
	})

	return (
		<div className="flex w-full flex-col gap-8">
			{groups.map((group) => {
				const colors = (group.colors ?? []).filter((c) => typeof c === 'object')
				if (colors.length === 0) return null
				return (
					<section key={group.id} className="flex flex-col gap-3">
						<Typography as="h3" size="sm" tone="muted" weight="medium">
							{group.name}
						</Typography>
						{/* auto-fit: 한 행에 든 색 수만큼 균등 분할하고, 좁아지면 알아서 접힌다(열 수 계산 불필요). */}
						<div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
							{colors.map((color) => (
								<Swatch key={color.id} color={color} />
							))}
						</div>
					</section>
				)
			})}
		</div>
	)
}

function Swatch({ color }: { color: BrandColor }) {
	// hex가 깨진 데이터면 파생 계산이 던지므로 색면을 포기하고 텍스트만 남긴다.
	const valid = isValidHex(color.hex)
	const rgb = valid ? hexToRgb(color.hex) : null

	return (
		<div
			className="flex aspect-square flex-col justify-between rounded-md border border-border p-3 font-body text-xs"
			style={
				valid
					? {
							backgroundColor: color.hex,
							color: getContrastingForeground(color.hex),
						}
					: undefined
			}
		>
			<span className="font-medium">{color.name}</span>
			{/* 값이 없는 줄도 라벨을 남긴다 — 브랜드팀에서 아직 안 온 항목이 화면에서 보이게. */}
			<dl className="grid grid-cols-[2.75rem_1fr] tabular-nums">
				<Spec label="HEX" value={color.hex} />
				<Spec label="RGB" value={rgb && `${rgb.r} ${rgb.g} ${rgb.b}`} />
				<Spec label="CMYK" value={color.cmyk} />
				<Spec label="PMS" value={color.pantone} />
			</dl>
		</div>
	)
}

function Spec({ label, value }: { label: string; value?: string | null }) {
	return (
		<>
			<dt className="opacity-70">{label}</dt>
			<dd>{value ?? ''}</dd>
		</>
	)
}

export default HdColorPaletteWidget
