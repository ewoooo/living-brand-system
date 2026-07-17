/** 임베디드 배열 내부와 컬렉션 top-level 양쪽에서 형제 필드의 form path를 만든다. */
export function siblingPath(path: string, name: string): string {
	const separator = path.lastIndexOf('.')
	return separator === -1 ? name : `${path.slice(0, separator + 1)}${name}`
}
