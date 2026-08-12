import { ForwardStraightGenerator } from '@/components/studio/generate/forward-straight-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'

// 렌더링: 정적. Payload 데이터를 읽지 않으므로 낡을 것이 없다.
// 🔴 방식을 선언으로 못박는다 — 선언이 없으면 Next가 추론하고, 그 추론은 프로덕션 빌드에서만
//    드러나 무관한 수정(권한·쿠키 조회 추가) 하나로 조용히 뒤집힌다(docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-static'

export default function GenerateGraphicPage() {
	return (
		<StudioWorkspacePage
			title="그래픽 생성"
			description="그래픽 도구의 설정을 조정해 SVG 산출물을 만듭니다."
		>
			<ForwardStraightGenerator />
		</StudioWorkspacePage>
	)
}
