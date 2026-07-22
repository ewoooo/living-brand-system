// brand-icons 리스트 상단에서 아이콘 컬러웨이(Global)로 진입하는 링크.
// 컬러웨이는 아이콘 그룹에 종속되는 값이라 nav 최상위 대신 아이콘 컬렉션을 통해 편집한다.
export default function IconColorwayLink() {
	return (
		<div style={{ margin: '0 0 1rem' }}>
			<a href="/admin/globals/icon-colorway" style={{ fontWeight: 600 }}>
				아이콘 컬러웨이 편집 →
			</a>
		</div>
	)
}
