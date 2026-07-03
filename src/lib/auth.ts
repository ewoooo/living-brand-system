import type { Access, CollectionConfig, FieldAccess } from 'payload'

/**
 * 역할 기반 접근 제어 헬퍼.
 * 컬렉션/필드 access 함수는 서버에서 권한을 강제하는 1차 보안 경계다 (docs/07).
 * UI 표시 여부와 무관하게 REST/GraphQL/Local API 모두 여기를 통과해야 한다.
 */

export type Role = 'admin' | 'manager' | 'worker'

const roleOf = (user: unknown): Role | null => {
	if (user && typeof user === 'object' && 'role' in user) {
		const r = (user as { role?: unknown }).role
		if (r === 'admin' || r === 'manager' || r === 'worker') return r
	}
	return null
}

const isAdmin = (user: unknown): boolean => roleOf(user) === 'admin'

const isManager = (user: unknown): boolean => {
	const r = roleOf(user)
	return r === 'admin' || r === 'manager'
}

const isAuthenticated = (user: unknown): boolean => Boolean(user)

/** 컬렉션 access 밖(커스텀 라우트 핸들러)에서 쓰는 사용자 단위 역할 검사. */
export const hasManagerRole = (user: unknown): boolean => isManager(user)

// --- 컬렉션 access ---
export const authenticated: Access = ({ req }) => isAuthenticated(req.user)
export const managerOrAdmin: Access = ({ req }) => isManager(req.user)
export const adminOnly: Access = ({ req }) => isAdmin(req.user)

/** 공용 access 프리셋 — 누구나 읽되(인증), 변경은 manager/admin만 (Worker는 사용만). */
export const managerManagedAccess: CollectionConfig['access'] = {
	read: authenticated,
	create: managerOrAdmin,
	update: managerOrAdmin,
	delete: managerOrAdmin,
}

/** 본인 문서이거나 admin일 때 허용 (Users 읽기/수정용) */
export const selfOrAdmin: Access = ({ req, id }) => {
	if (isAdmin(req.user)) return true
	const uid = (req.user as { id?: string | number } | null)?.id
	return uid != null && id != null && String(uid) === String(id)
}

// --- 필드 access (예: role 변경은 admin만) ---
export const adminFieldOnly: FieldAccess = ({ req }) => isAdmin(req.user)
