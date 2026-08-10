import type { Block } from 'payload'

// CI 사용 금지 규정 위젯 — 금지 12종을 좌 본문 1회 + 카드 그리드(빨간 X + 캡션)로 보여준다(PDF 패턴 E).
// 금지 항목은 상수(author 입력 없음) → 필드 없음(color-palette 위젯과 동형 자족 위젯). 위젯은 image·text 동급 leaf(rule 모름).
// dbName 짧게(iug)로 중첩 테이블명 63자 방어.
export const IncorrectUsageWidget: Block = {
	slug: 'incorrectUsageWidget',
	dbName: 'iug',
	interfaceName: 'IncorrectUsageWidget',
	labels: { singular: 'CI 사용 금지 위젯', plural: 'CI 사용 금지 위젯' },
	fields: [],
}

export default IncorrectUsageWidget
