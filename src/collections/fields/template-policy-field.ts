import type { Field } from 'payload'

/** 배경 정책 — 창작자가 고를 수 있는 배경 형식과 그 안의 허용 목록. */
export function templateBackgroundPolicyField(): Field {
	return {
		name: 'backgroundPolicy',
		type: 'json',
		label: '배경 설정',
		admin: {
			components: {
				Field: '/components/admin/templates/template-background-policy-field#TemplateBackgroundPolicyField',
			},
		},
	}
}
