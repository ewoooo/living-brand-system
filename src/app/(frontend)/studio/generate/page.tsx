import { redirect } from 'next/navigation'
import { routes } from '@/lib/routes'

// 렌더링: 정적. Payload 데이터를 읽지 않으므로 낡을 것이 없다.
// 🔴 방식을 선언으로 못박는다 — 선언이 없으면 Next가 추론하고, 그 추론은 프로덕션 빌드에서만
//    드러나 무관한 수정(권한·쿠키 조회 추가) 하나로 조용히 뒤집힌다(docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-static'

export default function GeneratePage() {
	redirect(routes.studio.generateImage)
}
