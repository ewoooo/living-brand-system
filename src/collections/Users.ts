import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminOnly, selfOrAdmin } from '@/lib/auth'

export const Users: CollectionConfig = {
	slug: 'users',
	labels: {
		singular: 'User',
		plural: 'Users',
	},
	admin: {
		useAsTitle: 'email',
		group: 'System',
	},
	auth: {
		tokenExpiration: 1800, // 세션 30분 제한 (docs/07 #4). Payload 기본 2시간을 줄인다.
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
