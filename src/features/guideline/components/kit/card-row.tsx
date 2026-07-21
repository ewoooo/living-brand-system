import card1 from './images/layout_base_image_card1.webp'
import card2 from './images/layout_base_image_card2.webp'
import card3 from './images/layout_base_image_card3.webp'
import card4 from './images/layout_base_image_card4.webp'
import { LayoutGridOverlay } from './layout-grid-overlay'

// LayoutGridOverlay를 그대로 재사용해 카드 4장을 한 줄(4열)로 병렬 배치·검수한다. 값은 UI에서 조정.
const CARDS = [card1, card2, card3, card4]

export function CardRowDemo() {
	return <LayoutGridOverlay images={CARDS} storageKey="Card Row" />
}
