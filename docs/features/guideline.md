# Guideline

가이드라인의 설정과 스타일을 어느 계층에서 정의할지 판단하는 명세입니다. **블록은 카드 목록의 배치, 카드는 개별 사례, 디스플레이는 판 안의 표현**을 소유합니다. 문서 생명주기는 [03](../03-data-lifecycle.md), 도메인 경계는 [04](../04-domain-model.md), 디자인 토큰은 [09](../09-design-system.md)가 소유합니다.

## 1. 목적

저작자가 한 토픽 안에 설명·도판·사례를 조합하고, 사용자가 같은 기준을 화면과 검색에서 읽게 합니다. 설정을 추가할 때 값이 영향을 주는 범위를 먼저 정합니다. 카드 하나의 상태를 블록에 두거나, 판의 크기를 위젯이 다시 정하지 않습니다.

## 2. 핵심 계약

### 2.1 콘텐츠 계층과 화면 위계

```text
챕터 — 토픽을 묶는 분류, 독립 페이지 없음
└─ 토픽 문서 — URL, 히어로, h1
   └─ blocks[] — 순서가 있는 동급 블록 목록
      ├─ section — 앵커·목차를 가진 블록, h2
      ├─ base — 일반 블록, h2
      ├─ overview — 제목·배치·줄 높이 프리셋, h2
      └─ examples — 제목·배치·줄 높이 프리셋, h2
         └─ cards[]
            ├─ ratio — 판 비율
            ├─ mark — 개별 사례의 선택 표식
            ├─ display[0] — 정적 이미지 또는 위젯 하나
            └─ caption — 선택 제목·설명과 배치
```

트리의 `cards[]`는 네 블록 모두에 적용됩니다. **section 안에 base가 중첩되는 구조는 아닙니다.** 이름이 달라도 네 블록은 같은 `CardBlock`으로 렌더합니다. 따라서 일반 블록의 제목을 자동으로 h3로 낮추지 않습니다. 카드 캡션은 `figcaption`이고, 제목도 문서 헤딩이 아닌 문단입니다.

Figma의 `Section Heading`(61:3503)은 코드의 토픽 히어로입니다. `Overview Section`(117:882)·`Incorrect Usage Section`(136:213)이라는 이름만으로 코드의 `section` 타입이나 중첩 관계를 결정하지 않습니다. 코드에서 `section`의 차이는 앵커와 목차입니다.

### 2.2 저작 설정의 소유권

| 소유 계층 | 설정·책임 | 경계 |
| --- | --- | --- |
| 토픽 문서 | 챕터 관계, 제목·슬러그·히어로 이미지, 발행 상태, 블록 순서, 문서 rules | 카드의 Mark·비율을 일괄 지정하지 않음 |
| 블록 | 제목·설명, 카드 목록, `layout`, `rowHeight`, 블록 rules | 개별 카드 상태·이미지 크롭을 소유하지 않음 |
| section 추가 속성 | `anchor`, 목차 항목 | 다른 블록의 부모가 아님 |
| 카드 | `ratio`, `mark`, 디스플레이 하나, 캡션 | 줄 높이·열 수·페이지 폭을 다시 정하지 않음 |
| 디스플레이 | 이미지·위젯의 콘텐츠와 입력값 | 카드 캡션·Mark·블록 rules를 소유하지 않음 |
| 캡션 | 선택 제목·설명, `below` 또는 `overlay` 배치 | 카드 판의 폭을 늘리지 않음 |

블록의 `assetDownload` 필드는 현재 저장되지만 렌더러가 소비하지 않습니다. 동작하는 설정으로 간주하지 않습니다(§2.5). 프리셋 블록은 별도 구조가 아니라 `registry.ts`의 고정 제목·기본 배치입니다. 숨긴 기본값과 렌더 시 강제되는 값도 구분합니다. 제목은 렌더러가 고정하지만 배치·줄 높이는 저장된 값을 읽습니다.

### 2.3 Mark 계약과 이관

| 값 | 의미 | 화면 |
| --- | --- | --- |
| `none`, 생략, `null` | 판정 표식 없음 | 아무 표식도 그리지 않음 |
| `do` | 권장 사례 | ✓와 접근 가능한 이름 Do |
| `ok` | 허용 사례 | △와 접근 가능한 이름 OK |
| `dont` | 금지 사례 | ✕와 접근 가능한 이름 Don't |

옵션은 `cards/schema.ts`, 렌더링은 `cards/component.tsx`가 소유합니다. 새 카드의 기본값은 `none`입니다. 격자·캐러셀 모두 같은 섹션에서 서로 다른 값을 사용할 수 있습니다. Mark는 디스플레이나 캡션 배치와 독립이며 오버레이 캡션 위에도 표시됩니다. 표식의 모양·위치는 이번 이관에서 기존 스타일을 유지합니다.

Mark는 **저작자가 붙이는 사례 표식**입니다. 검수 Rule·검수 실행 결과·이미지의 정답 여부를 자동 생성하지 않습니다.

이관은 새 카드 필드 생성 → 기존 블록 값을 각 카드에 복사 → 이전 블록 필드 제거 순서입니다. `section`·`base`·`overview`·`examples`의 본문 테이블과 버전 테이블을 모두 처리합니다. 이미지 관계·캡션·순서·카드 ID·발행 상태는 바꾸지 않습니다. 카드가 없는 블록은 이관할 표시 대상이 없습니다.

역방향 이관은 한 블록의 카드들이 같은 Mark일 때만 가능합니다. 서로 다른 값을 하나로 합치면 정보가 사라지므로, 혼합 값이 있으면 롤백을 중단합니다. 운영에 적용할 때는 커밋된 마이그레이션을 먼저 실행하고 새 애플리케이션을 시작합니다. 자동 스키마 push는 공유 환경에서 사용하지 않습니다.

### 2.4 스타일의 소유 위치

| 대상 | 단일 출처 | 적용 범위 |
| --- | --- | --- |
| 색·폰트·모서리 토큰 | `src/app/(frontend)/theme.css` | 앱 전체. 개별 사례 때문에 전역 값을 바꾸지 않음 |
| 기본 본문·rem | `src/app/(frontend)/styles.css` | 앱 기본값 |
| 셸·스크롤·main | `src/components/global/section-layout.tsx` | 가이드라인 외 화면도 공유 |
| 본문 최대 폭·가로 패딩 | `src/components/shared/content-frame.tsx` | `padded`는 도판, `heading`은 블록 제목 |
| 블록 간격·카드 줄 높이·격자 간격 | `blocks/rhythm.ts` | 블록 목록과 카드 목록 |
| 토픽·블록 헤딩 | `components/globals/guideline-header.tsx` | h1·h2 의미와 텍스트 단계 |
| 블록 설명 | `components/globals/guideline-description.tsx` | 설명의 기본 서식 |
| 판·Mark | `cards/component.tsx` | 비율·클리핑·표식의 위치 |
| 하단·오버레이 캡션 | `cards/caption/component.tsx` | 크기·굵기·행간·패딩·텍스트 폭 |
| 2열 스펙 표 | `components/globals/spec-table-converters.tsx` | 라벨·값 목록. 다른 열 수는 기본 표 |
| 브랜드 표본 면 | `cards/displays/dynamics/surface.ts` | 테마 면과 규정에 고정된 브랜드 면 구분 |
| 위젯 판독·컨트롤 값 | `cards/displays/dynamics/readout.ts` | 캡션과 별개의 도판 내부 텍스트 |

위 표의 가이드라인 상대 경로는 `src/features/guideline/` 기준입니다. 값의 사본을 별도 토큰 파일에 만들지 않습니다. 전역 토큰 변경, 가이드라인 내 역할 변경, CMS 콘텐츠 편집은 서로 다른 작업입니다.

### 2.5 위계 조사 결과 — 2026-09-08

범위는 현재 가이드라인의 페이지·공통 렌더러·4종 블록·디스플레이 레지스트리(정적 1종, 위젯 19종)·캡션·투영·목차·토큰입니다. 아래 수치는 **조사 시점의 비교 기록**이며 새 고정 스타일 규칙이 아닙니다. 전체 CMS 콘텐츠나 모든 위젯의 모든 입력 조합을 시각 검증한 결과는 아닙니다.

| 항목 | 확인된 상태·문제 | 처리 또는 다음 결정 |
| --- | --- | --- |
| Mark 소유권 | 블록의 한 값이 모든 카드로 전달됨 | 이번 변경에서 카드로 이동, 기본 없음, 기존 본문·버전 값 보존 |
| 문서의 계층 | 문서에는 block h3·챕터 페이지·Section 전용 평문이 남아 있었음 | 실제 h1/h2·독립 챕터 페이지 없음·카드 캡션 투영으로 문서 수정 |
| 헤딩 크기 | 코드 토픽 60px/600/100%, 블록 24px/600/100%. Figma 토픽 64px/600/100%(61:3509), 오버뷰 56px/600/60px(SF Pro Display, 117:884), Incorrect Usage 56px/700/60px(Pretendard, 136:216) | Figma를 복사하기 전에 가이드라인 제목 역할·서체를 확정. 전역 `text-6xl` 변경은 다른 화면까지 영향 |
| 설명과 캡션의 위계 | 블록 설명 14px/400, 하단 캡션 20px/500/155%, 오버레이 16px/500/155%. 하위 캡션이 블록 설명보다 큼 | 의도한 강조인지 결정. 155%·Medium은 사용자 확정값으로 유지 |
| 스펙 표 | 같은 캡션 안에서도 2열 표는 14px, 라벨 600, 별도 행 간격. 캡션 본문의 크기·155%를 그대로 따르지 않음 | 스펙을 독립된 정보 밀도로 유지할지, 캡션 타이포를 상속할지 결정 |
| 모서리 | 카드 `rounded-3xl`은 현재 48px. Figma 사례 카드는 24px(136:229), 바깥 패널은 32px(136:214) | 카드·패널 역할별 토큰 단계 선택 필요. 전역 radius를 일괄 변경하지 않음 |
| Mark 모양·위치 | 코드 32px 원·16px 문자·우상단 12px, Figma 36px 원·좌상단 24px(136:234). OK도 코드 △와 Figma ○가 다름 | 소유권 이관과 분리해 아이콘·크기·위치 스펙 결정 |
| 세로 간격 | 블록 스택 288px, 프레임 상하 32px, 블록 내부 gap 48px가 합산됨. 제목 콘텐츠 끝부터 판 시작까지는 32+48+32=112px | 섹션 패딩과 내부 gap의 기준점을 명시한 뒤 값 결정. Figma 오버뷰는 바깥 상하 120px·내부 gap 48px(117:882) |
| 가로 기준 | 제목은 전체 블록 왼쪽 패딩, 판은 최대 폭 프레임 안에 정렬. 줄 높이는 주석의 프레임 비례와 달리 실제 `vw`로 계산 | 제목 왼쪽 패딩은 기존 사용자 결정 유지. 판 높이의 기준을 viewport 또는 콘텐츠 폭 중 하나로 확정 |
| 격자의 큰 가로 카드 | 1280px 뷰포트·1015px 본문에서 `high`·16:9 판이 1365px로 렌더되는 것을 재현. 카드 오른쪽이 1662px까지 나감. 캐러셀과 달리 격자는 의도한 가로 넘김 UI가 없음 | 좁은 데스크톱에서 높은 가로 카드를 콘텐츠 폭에 맞춰 축소할지, 격자 규격을 제한할지 결정 |
| 텍스트 전용 섹션 | `CardBlock`은 유효한 디스플레이가 하나도 없으면 제목·설명도 숨김. 목차 조회는 제목·앵커만 검사 | 텍스트만 있는 섹션 허용 여부와 목차 노출 조건을 함께 정해야 함 |
| 에셋 다운로드 | 블록 스키마의 `assetDownload`를 현재 `CardBlock`이 소비하지 않음 | 렌더 연결 또는 설정 제거가 필요. 다른 블록 기능과 섞어 자동 구현하지 않음 |
| Incorrect Usage 구성 | 현재 프리셋에는 회색 외곽 패널·중앙 헤딩·스튜디오 Callout·고정 3열 조합이 없음 | 개별 스타일 옵션을 늘리기 전에 별도 블록 프리셋으로 표현할지 결정 |
| Figma 스타일 연결 | 조사한 토픽·오버뷰·Incorrect Usage 제목의 `textStyleId`가 비어 있음 | 공유 텍스트 스타일과 코드 역할의 대응을 정하면 노드별 값의 변동을 추적하기 쉬움 |
| 위젯 컨트롤 연결 | 카드 모델의 본문 렌더러에는 Controller provider 연결이 없음. 조절형 위젯도 본문에서는 admin 고정값으로 표시됨 | 갤러리 조작과 실제 본문 조작을 같은 검증으로 취급하지 않음. 재연결은 별도 기능 작업 |
| 위젯의 옛 캡션 | `WIDGET_CAPTION` 사용 예외가 layout-grid·stem-clear-space에 남아 있음 | 카드 캡션과 도판 내부 판독 중 어느 역할인지 분류한 뒤 정리. 전역 글자 크기 치환 대상에서 제외 |

우선 결정 순서는 **콘텐츠 계층 → 제목·설명·캡션·스펙의 텍스트 역할 → 컨테이너 폭과 세로 리듬 → 판·Mark 모양 → 프리셋 구성**입니다. 구조가 확정되기 전에 폰트·패딩 값을 전역 치환하지 않습니다.

## 3. 표면

- **Page**: 토픽 서비스 → `GuidelineTopic` → `GuidelineBlocks` → `renderBlock` → `CardBlock` → `Card` → 디스플레이·캡션 순서입니다. 셸은 `main`, 토픽은 `article`, 각 블록은 h2 제목을 가진 영역을 구성합니다. 제목 없는 블록에는 헤딩이 없습니다.
- **Admin**: `registry.ts`가 네 블록 스키마를 만들고 `cards/schema.ts`가 공통 카드 필드를 제공합니다. Mark는 각 카드의 `판정 표식`, 캡션 배치는 캡션 그룹에서 편집합니다.
- **검색·AI·검수**: `blocks/projection.ts`가 제목·설명·앵커·카드 캡션을 평문으로 조립합니다. 검수 규칙의 출처는 문서와 루트 블록입니다. Mark와 카드 이미지를 검수 결과나 참조 자산으로 자동 변환하지 않습니다.
- **목차**: `section` 타입의 제목·앵커에서만 항목을 만듭니다. 제목 없는 도판과 일반 블록은 목차 항목을 만들지 않습니다. 텍스트 전용 섹션의 조건 차이는 §2.5에 기록합니다.

## 4. 의존

- 스키마·기본값: [`blocks/registry.ts`](../../src/features/guideline/blocks/registry.ts), [`blocks/fields.ts`](../../src/features/guideline/blocks/fields.ts), [`cards/schema.ts`](../../src/features/guideline/cards/schema.ts)
- 표현: [`blocks/card-block.tsx`](../../src/features/guideline/blocks/card-block.tsx), [`cards/component.tsx`](../../src/features/guideline/cards/component.tsx), [`cards/caption/component.tsx`](../../src/features/guideline/cards/caption/component.tsx)
- 투영: [`blocks/projection.ts`](../../src/features/guideline/blocks/projection.ts), [`checks/collect-guideline-check-sources.ts`](../../src/features/guideline/checks/collect-guideline-check-sources.ts)
- 위젯 저작: [11](../11-widget-authoring.md), CI 도판의 수치·서체: [12](../12-ci-lockup-canon.md)
- 디자인 비교: [오버뷰](https://www.figma.com/design/4zXBMnMCPay346ohMBrMFA/HD_LBS_UI?node-id=117-882), [하단 캡션](https://www.figma.com/design/4zXBMnMCPay346ohMBrMFA/HD_LBS_UI?node-id=131-272), [Incorrect Usage](https://www.figma.com/design/4zXBMnMCPay346ohMBrMFA/HD_LBS_UI?node-id=136-213)

## 5. 크로스커팅

인증·데이터 접근은 [07](../07-security.md), 키보드·접근 가능한 이름은 [08](../08-accessibility-i18n.md), 스타일과 컴포넌트 저작은 [09](../09-design-system.md)·[10](../10-component-authoring.md)를 따릅니다. DB 환경·마이그레이션·발행 상태 보존은 [AGENTS.md](../../AGENTS.md)가 소유합니다.

카드별 Mark 조합과 기본값은 `cards/component.test.tsx`·`blocks/fields.test.ts`, 제목 의미는 `guideline-header.test.tsx`, 평문은 `blocks/projection.test.ts`, 팔레트 사용은 `visual-vocabulary.test.ts`가 검증합니다. 팔레트 검사 통과는 간격·모서리·타이포 위계나 Figma 일치까지 검증했다는 뜻이 아닙니다.

이번 조사·이관의 검증 기록(Node.js 22.23.2):

- `pnpm exec vitest run src/features/guideline` — 33개 파일, 533개 테스트 통과.
- `pnpm typecheck`, `pnpm check` — 통과.
- `npx react-doctor@latest --verbose --scope changed` — 기존과 같은 66점, 기존 진단 38건.
- `PAYLOAD_DB_PUSH=false pnpm payload migrate` / `PAYLOAD_DB_PUSH=false pnpm payload migrate:down` — 별도 `DATABASE_URL`을 지정한 임시 로컬 `mark_verify` DB에서 이관·복원·재이관 확인. 네 블록과 버전 이력의 16개 카드에 표식 복사, 캡션·순서·ID·발행 상태 보존을 확인. 혼합 Mark가 있는 버전 이력의 롤백은 의도대로 실패하고 데이터는 보존됨.
- 실제 공통 컴포넌트의 별도 브라우저 미리보기에서 1280px·390px, 격자·캐러셀의 혼합 Mark, 오버레이 위 표식 표시를 확인.

DB 쓰기는 임시 로컬 `mark_dev`·`mark_verify`에만 수행했습니다. 공유 stage·운영 DB와 CMS 콘텐츠는 변경하지 않았습니다. 전체 프로덕션 빌드와 모든 실제 콘텐츠의 화면 검증은 이번 검증 범위에 포함하지 않았습니다.
