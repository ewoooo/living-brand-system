import { brandColors } from '../ci-lockup/component'
import { type CiLockupHeroSource, CiLockupHeroView } from './view'

// 위젯(서버): 색만 컬렉션에서 꺼내 뷰에 넘긴다 — `ci-lockup`과 같은 조회를 재사용한다.
export async function CiLockupHeroWidget({
	source,
	h,
}: {
	source?: string | null
	h?: number | null
}) {
	return (
		<CiLockupHeroView
			colors={await brandColors()}
			source={source === 'branch' ? 'branch' : ('subsidiary' satisfies CiLockupHeroSource)}
			h={h ?? 160}
		/>
	)
}

export default CiLockupHeroWidget
