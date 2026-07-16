import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminOnly, selfOrAdmin } from '@/lib/auth'

export const Users: CollectionConfig = {
	slug: 'users',
	labels: {
		singular: '사용자',
		plural: '사용자',
	},
	admin: {
		useAsTitle: 'email',
		group: '시스템 관리',
	},
	auth: {
		// 운영은 30분 제한 (docs/07 #4). 로컬 dev는 자동 로그아웃이 방해되므로 30일로 늘린다(보안 규정은 운영에만 적용).
		tokenExpiration: process.env.NODE_ENV === 'production' ? 1800 : 60 * 60 * 24 * 30,
	},
	access: {
		// 본인 또는 admin만 조회/수정, 생성·삭제는 admin만
		read: selfOrAdmin,
		create: adminOnly,
		update: selfOrAdmin,
		delete: adminOnly,
	},
	fields: [
		{
			name: 'role',
			type: 'select',
			required: true,
			defaultValue: 'worker',
			saveToJWT: true,
			options: [
				{ label: 'Admin', value: 'admin' },
				{ label: 'Manager', value: 'manager' },
				{ label: 'Worker', value: 'worker' },
			],
			access: {
				// role 변경/지정은 admin만 (worker가 스스로 승격 못 하게)
				create: adminFieldOnly,
				update: adminFieldOnly,
			},
			admin: { description: 'admin(전체)·manager(기준 관리)·worker(사용)' },
		},
	],
}
