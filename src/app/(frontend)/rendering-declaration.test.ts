import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// 모든 프런트엔드 라우트가 자기 렌더링 방식을 **선언**하는지 지킨다.
//
// 🔴 왜 필요한가: 선언이 없으면 Next가 추론한다(쿠키·헤더를 읽나 안 읽나로). 그 추론의 결과는
//    프로덕션 빌드에서만 드러나므로, 무관한 수정 하나로 정적↔동적이 조용히 뒤집혀도 아무도
//    리뷰에서 못 본다. 실제로 그렇게 해서 목차가 재배포까지 갱신되지 않는 결함이 배포까지 갔다.
//    (docs/05 「렌더링 캐시 무효화」)
//
// 선언은 페이지 자신이나 (frontend) 안의 조상 layout 어디에 있어도 된다 — 조상이 선언하면
// 그 아래가 다 따르기 때문이다.

const ROOT = path.join(process.cwd(), 'src/app/(frontend)')
const DECLARATION = /export const (dynamic|revalidate)\b/

function pageFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const full = path.join(dir, entry)
		if (statSync(full).isDirectory()) return pageFiles(full)
		return entry === 'page.tsx' ? [full] : []
	})
}

/** 페이지 자신부터 (frontend) 루트까지 올라가며 선언을 찾는다. */
function declaredIn(pageFile: string): string | null {
	if (DECLARATION.test(readFileSync(pageFile, 'utf8'))) return pageFile

	let dir = path.dirname(pageFile)
	while (dir.startsWith(ROOT)) {
		const layout = path.join(dir, 'layout.tsx')
		try {
			if (DECLARATION.test(readFileSync(layout, 'utf8'))) return layout
		} catch {
			// 이 층에 layout이 없으면 위로 계속 올라간다.
		}
		if (dir === ROOT) break
		dir = path.dirname(dir)
	}
	return null
}

describe('프런트엔드 라우트 렌더링 선언', () => {
	const pages = pageFiles(ROOT)

	it('라우트를 실제로 찾는다', () => {
		// 탐색이 조용히 0건이 되면 이 테스트 전체가 무의미해진다.
		expect(pages.length).toBeGreaterThan(10)
	})

	it.each(
		pages.map((file) => [path.relative(ROOT, file), file]),
	)('%s 가 렌더링 방식을 선언한다', (_label, file) => {
		expect(declaredIn(file)).not.toBeNull()
	})
})
