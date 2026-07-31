import type { BrandLogo } from '@/payload-types'
import { LogoClearSpaceView } from './view'

// 로고 클리어스페이스 위젯(서버) — 픽된 로고의 파일명에서 orientation(가로/세로)을 파싱해,
// 그 방향의 H-비율 클리어스페이스/최소크기 오버레이를 뷰에 넘긴다.
// 🔑 H-비율은 orientation만으로 결정되는 상수(01-specs B) → 스키마에 필드 추가 없음(마이그레이션 불필요).
// 파일명 규약: {ko|en|hd}-{horizontal|vertical}-{default|white|mono}.svg. 위젯은 image·text 동급 leaf(rule 모름).
type LogoRef = number | BrandLogo | null | undefined

export function LogoClearSpaceWidget({ logo }: { logo: LogoRef }) {
	const picked = typeof logo === 'object' && logo ? logo : null
	if (!picked?.url) return null
	const orientation = picked.filename?.split('-')[1] === 'vertical' ? 'vertical' : 'horizontal'
	const alt = picked.alt ?? picked.name ?? ''
	return <LogoClearSpaceView src={picked.url} alt={alt} orientation={orientation} />
}

export default LogoClearSpaceWidget
