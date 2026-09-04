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

/**
 * 색을 데이터로 주입한 면의 **톤**. 블록과 문서가 같은 어휘를 쓰도록 여기서 한 번만 정의한다.
 *
 * 🔴 `brand-colors`에 반투명 변종을 만들지 않기 위한 필드다. 팔레트는 정본이고 "그린 10%"는
 *    표현이다 — 팔레트에 넣으면 스와치·검수·템플릿이 전부 그것을 브랜드 색으로 읽는다.
 *
 * 🔴 값을 닫아 둔다(수치 입력이 아니다). Figma(61:3299)의 면은 브랜드 그린 10% 하나뿐이고,
 *    자유 수치를 열면 페이지마다 다른 톤이 생겨 면이 어휘이길 그만둔다.
 */
export function backgroundToneField({ sidebar = false } = {}): Field {
	return {
		name: 'backgroundTone',
		type: 'select',
		defaultValue: 'solid',
		// 블록(중첩)과 문서 양쪽에서 쓰므로 전역 enum 이름을 공유한다.
		enumName: 'enum_background_tone',
		options: [
			{ label: '단색', value: 'solid' },
			{ label: '옅게(10%)', value: 'tint' },
		],
		admin: {
			// 문서는 배경색을 사이드바에 두므로 톤도 같은 칸에 있어야 짝으로 읽힌다.
			position: sidebar ? 'sidebar' : undefined,
			description:
				'배경색을 그대로 쓸지 10%로 옅게 깔지 정합니다. 배경색이 없으면 무시됩니다.',
		},
	}
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
