import type { Field } from 'payload'

// 문서/블록은 Rule 정의를 소유하지 않고 rules 컬렉션의 규칙을 참조로 선택한다.
export function guidelineRulesField(): Field {
	return {
		name: 'rules',
		type: 'relationship',
		relationTo: 'rules',
		hasMany: true,
		admin: {
			allowCreate: true,
			allowEdit: true,
			appearance: 'drawer',
			description: '이 문서 단위에 적용할 검수 규칙입니다.',
		},
	}
}

// 모든 가이드라인 블록이 공유하는 표준 필드. 근거 콘텐츠는 이 블록이 소유하고 Rule은 참조한다.
export function baseBlockFields(): Field[] {
	return [guidelineRulesField()]
}

// 서체를 다루는 블록이 공유하는 관계 필드. 서체는 brand-typefaces가 폰트 파일과 함께 소유한다.
export function typefaceField(): Field {
	return {
		name: 'typeface',
		type: 'relationship',
		relationTo: 'brand-typefaces',
		admin: {
			description: '적용할 서체입니다. 비우면 기본 타이틀 서체를 사용합니다.',
		},
	}
}
