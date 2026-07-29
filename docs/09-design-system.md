# 09. 디자인 시스템

이 문서는 Creator UI와 guideline 렌더링 계층의 시각 언어를 정의합니다.
토큰의 값이 아니라 토큰의 **소유 위치와 사용 규칙**을 정리하는 지도 문서이며, 실제 값의 단일 출처(SoT)는 언제나 CSS 파일입니다.

## 1. 적용 범위

이 문서는 시각 스타일을 다루는 세 표면에만 적용합니다.

| 대상 | 위치 | 기준 |
| --- | --- | --- |
| Creator UI | `src/app/(frontend)` | 셸, 헤더, 전역 컴포넌트의 색·타이포·간격 |
| guideline 렌더링 계층 | `src/features/guideline/components` | 블록·프레임·헤더가 토큰을 소비하는 방식 |
| kit 실험 갤러리 | `/guideline/kit` (dev 전용) | 승격 전 컴포넌트가 같은 토큰 규칙을 따르는지 확인 |

Payload Admin 기본 화면은 이 문서의 대상이 아닙니다. Payload가 제공하는 기본 스타일과 접근성을 우선하며, `docs/08-accessibility-i18n.md`의 적용 범위와 동일하게 프로젝트가 직접 추가한 Admin 확장 화면에만 이 문서를 참고합니다.

브랜드 색·폰트·로고는 스타일 규칙이 아니라 **데이터**입니다. 그 소유와 주입 경로는 `docs/05-system-architecture.md`가 정의하며, 이 문서는 데이터가 토큰에 들어오는 지점만 기술합니다.

접근성·다국어 경계는 `docs/08-accessibility-i18n.md`, 소스 위치·네이밍·`use client` 경계는 `docs/06-project-structure.md`가 소유합니다. 이 문서는 두 문서를 링크만 하고 규칙을 복제하지 않습니다.

## 2. 두 속도 모델

디자인 시스템은 서로 다른 속도로 바뀌는 두 층으로 나뉩니다. 이 문서(09)는 (A)만 소유하고, (B)는 `docs/10`에 위임합니다.

| 층 | 대상 | 변경 빈도 | 소유 문서 |
| --- | --- | --- | --- |
| (A) 불변 파운데이션 | 색, 타이포, radius, 다크 모드, 런타임 브랜드 오버라이드, 셸/프레임 골격 | 값이 실제로 바뀔 때만 | 09 (이 문서) |
| (B) 컴포넌트별 UI | 매번 추가되는 블록·프리미티브 조합, variant, 저작 규칙 | 상시 (슬롭 위험 큼) | `docs/10` |

컴포넌트를 새로 추가할 때 09를 손대지 않습니다. 새 블록은 (A)가 정한 토큰과 프레임을 소비할 뿐, 파운데이션을 바꾸지 않습니다. 파운데이션을 건드려야 하는 변경이라면 그것은 컴포넌트 작업이 아니라 09 개정입니다.

## 3. 토큰 소유 지도

> **경고: 값의 단일 출처는 CSS입니다.** 아래 표는 이름과 소유 파일을 가리키는 지도이며 값의 사본이 아닙니다. 구체 값(oklch, radius, hex)이 필요하면 표에 링크된 CSS 파일을 여십시오. 이 문서에 값을 옮겨 적으면 두 곳이 갈라집니다.

| 토큰군 | 의미 | 소유 파일(SoT) |
| --- | --- | --- |
| color 원시값 | `:root`(라이트), `.dark`(다크)의 원시 색 정의 | `src/app/(frontend)/theme.css:62-95`, `theme.css:97-129` |
| color 유틸 매핑 | 원시값 → `@theme inline`의 `--color-*` 유틸 토큰 | `theme.css:24-54` |
| highlight gradient | 강조 배경과 전경 토큰, `bg-highlight` 유틸 | `src/app/(frontend)/theme.css` |
| radius | `--radius` 뿌리 1개에서 `--radius-sm/md/lg/xl` 4단 파생(`lg`는 뿌리값, `sm`/`md`/`xl`은 calc) | `theme.css:56-59`, `theme.css:63` |
| 폰트 패밀리 | `--font-body`(Pretendard), `--font-title`(Essenflux) | `theme.css:20-22` |
| 루트 크기 | 모든 화면에서 고정된 16px `rem` 기준 크기 | `src/app/(frontend)/styles.css`의 `html` |
| 타이포 리듬 | `.typeset` 블록의 크기·행간·흐름(shadcn/typeset) | `src/app/(frontend)/typeset.css` |
| base body / scrollbar / import 순서 | `body` 기본, `scrollbar-none` 유틸, CSS `@import` 체인 | `src/app/(frontend)/styles.css:1-30` |

`--radius`는 뿌리 토큰 하나이고 나머지 4단은 그것을 기준으로 파생합니다(`--radius-lg`는 뿌리값 그대로, `sm`/`md`/`xl`은 `calc()`; `theme.css:56-59`). radius를 조정할 때는 파생값이 아니라 뿌리 하나만 바꿉니다.

`highlight`는 Figma 강조 스타일을 옮긴 그라디언트입니다. `bg-highlight`가 가로 밴드를 2배로 늘려 왼쪽에서 오른쪽으로 반복 이동시키고, 모션 감소 설정에서는 정지합니다. Badge와 Button은 `bg-highlight`와 `text-highlight-foreground`를 함께 사용하며, 개별 컴포넌트에서 gradient stop을 다시 선언하지 않습니다.

## 4. 닫힌 토큰 규칙

색·간격·radius·폰트는 **시맨틱 토큰과 그 유틸 클래스로만** 표현합니다. `bg-primary`, `text-foreground`, `border-border`, `bg-muted`, `font-body`, `rounded-md`처럼 이름이 의미를 가리키는 유틸만 사용합니다. **토큰에 없으면 틀린 것**이라는 이진 규칙을 적용합니다.

토큰은 2단 인디렉션을 거칩니다.

```text
원시 oklch (theme.css :root / .dark)
  → @theme inline --color-* (theme.css:24-54)
    → Tailwind 유틸 (bg-primary, text-foreground, ...)
```

`className`/`style` 리터럴에서 다음은 금지합니다.

- 생 hex 리터럴(예: `#a1b2c3`)
- 생 Tailwind 팔레트 + 숫자(예: `border-neutral-200`, `bg-gray-100`, `text-zinc-500`, `slate`/`stone` 등)
- `.tsx` 안의 `oklch(...)` 리터럴

**예외:** 색 자체를 데이터로 다루는 컴포넌트(`ColorSwatch`, `ColorPalette` 등)가 props나 CMS로 받는 hex는 스타일이 아니라 **데이터**이므로 허용합니다. 이때 hex는 코드에 고정되지 않고 주입됩니다.

탐지용 grep:

```sh
rg -n '#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|from|to|via)-(?:neutral|gray|zinc|slate|stone)-[0-9]|oklch\(' src --glob '*.tsx'
```

이 명령이 색 데이터 컴포넌트 밖에서 걸리면 토큰 위반입니다.

## 5. 다크 모드와 브랜드 오버라이드

다크 모드는 `.dark` **클래스** 방식입니다. `prefers-color-scheme` 미디어 쿼리가 아니라, `@custom-variant dark (&:where(.dark, .dark *))`(`theme.css:17`)로 정의하고, `next-themes`의 `ThemeProvider`를 `attribute="class"` + `defaultTheme="system"` + `enableSystem`(`layout.tsx:44-49`)으로 구동합니다. 시스템 설정은 `next-themes`가 읽어 `.dark` 클래스로 변환하므로, 원시값은 라이트가 `:root`(`theme.css:62-95`), 다크가 `.dark`(`theme.css:97-129`) 한 곳에서만 갈립니다.

런타임 브랜드 색은 CMS 메타데이터에서 옵니다. `layout.tsx:26-34`가 `metadata.primaryHex` 등으로 문자열을 만들고 `layout.tsx:38-42`가 `<style>`로 주입해 `--primary`와 `--primary-foreground` **2개 토큰만** 오버라이드합니다(라이트는 `:root`, 다크는 `.dark`). 코드에는 브랜드 색이 없고 데이터만 흐르므로 브랜드 어그노스틱이 유지됩니다.

주입 대상이 `--primary` 계열 2개뿐이라는 것은 현실의 제약을 만듭니다. `accent`, `secondary`, `ring`은 채도(chroma) 0의 뉴트럴로 고정되어 있고, `chart-1`~`chart-5`는 0이 아닌 채도의 고정된 다색 팔레트를 갖습니다(둘 다 `theme.css` 원시값). 어느 쪽도 브랜드 주입을 받지 않으므로, 브랜드 강조색은 `primary`를 쓰는 표면(예: `bg-primary`, `text-primary`)에만 반영되고 그 밖의 강조 토큰은 원래 값으로 남습니다.

## 6. 타이포그래피와 프리미티브 소재

새 `H1`/`H2`/`Heading` 컴포넌트를 발명하지 않습니다. 텍스트 프리미티브는 `Typography`(`as`/`family`/`size`/`tone`/`weight`)를 재사용하고, 페이지 상위 조합은 `src/components/global`의 page-header에 둡니다.

`rem`의 기준 크기는 `styles.css`의 `html`이 16px로 고정합니다. 폰트 크기는 커스텀 토큰 없이 아래 Tailwind 유틸리티만 사용합니다.

| 역할 | 유틸리티 |
| --- | --- |
| Badge·비필수 메타·캡션 | `text-xs` |
| 본문·입력·일반 버튼·메뉴 | `text-sm` |
| 큰 버튼·카드 제목 | `text-base` |
| H1 설명·lead | `text-xl` |
| 섹션·로컬 페이지 제목 | `text-2xl` |
| 페이지·챕터 제목 | `text-5xl` |
| 최상위 H1 | `text-6xl` |

14px 텍스트와 함께 쓰는 아이콘은 `size-4`, 16px 텍스트와 함께 쓰는 아이콘은 `size-5`를 기본으로 합니다. 일반 컴포넌트에는 `clamp()`·`vw`·반응형 `text-*`·임의 글자 크기를 선언하지 않습니다.

메인 히어로의 제목·버전 표기와 푸터 `LBS`는 화면 비율에 맞춘 lockup을 유지해야 하므로 유일한 viewport 반응형 예외이며 기존 `clamp()` 크기를 사용합니다. 템플릿 캔버스와 `TypeScale`·`TypeSpecimen`이 데이터로 받은 글자 크기도 UI 타이포그래피가 아니므로 예외입니다. 그 밖의 `GlyphGrid` 같은 대형 표본은 viewport 계산식 대신 `text-9xl` 같은 고정 유틸리티를 사용합니다. 클래스 주입이 불가능한 `.typeset` 내부 생성 HTML은 `typeset.css`에서 같은 고정 단계만 직접 선언합니다.

현재 상태를 정직하게 기술합니다.

| 사실 | 근거 |
| --- | --- |
| `--font-body`(Pretendard)는 `body`에 배선되어 기본 폰트로 동작 | `theme.css:20`, `styles.css:23` |
| `--font-title`(Essenflux)과 `.font-title` 클래스는 정의되어 있으나 상위 guideline 헤더에 미배선 | `theme.css:22`, `theme.css:139-141` |
| 그래서 `GuidelineHeader`의 `ChapterHeader`/`SectionHeader` 등은 `font-title` 없이 렌더되어 기본 body 폰트로 폴백 | `guideline-header.tsx:51-73` |
| `--font-heading`/`--font-mono`는 어디에도 정의되지 않아 `.typeset`의 `code`/`pre`는 브라우저 monospace로 폴백 | `typeset.css:9-10` (참조만, 정의 없음) |

`font-title`을 헤더에 붙이거나 `--font-mono`를 정의하는 것은 파운데이션 변경(09)이지 컴포넌트 작업이 아닙니다. 상세한 텍스트 저작 규칙은 `docs/10`이 소유합니다.

## 7. 공통 셸과 프레임 골격

guideline 블록은 두 겹의 프레임으로 감쌉니다.

| 겹 | 컴포넌트 | 소유 책임 |
| --- | --- | --- |
| 표면색 껍질 | `GuidelineBlockFrame`(`<section>`) | 전체 폭 배경/전경(`normal`/`secondary`/`inverted`) |
| 폭 프레임 | `GuidelineContentFrame` | 최대 폭과 가로 여백(`max-w-[1250px] px-4 md:px-8`) |

`GuidelineBlockFrame`(`guideline-block-frame.tsx:24-46`)은 표면색만 정하고 즉시 `GuidelineContentFrame`을 감쌉니다. 폭과 가로 여백은 `GuidelineContentFrame`의 `padded` variant 한 곳만 소유합니다(`guideline-content-frame.tsx:22`). 개별 블록은 자기 `max-width`를 선언하지 않습니다 — 폭을 바꾸려면 프레임 한 곳만 고칩니다.

세로 리듬은 프레임의 self-padding(`guideline-content-frame.tsx:21`의 `py-8`)과 스택 컨테이너의 `gap`이 함께 담당합니다. 요소 사이 실제 간격은 `패딩 + gap + 패딩`의 합입니다. "블록마다 마진을 흩뿌리지 않는다"의 뜻은 *바꾸지 않는다*가 아니라 *요소마다 제각각 다르게 주지 않는다*이며, 다음 세 불변식으로 리듬을 통일합니다:

1. 한 요소의 상하 패딩은 대칭이다(`py-*` 하나로).
2. 모든 요소의 패딩은 동일하다(프레임 한 곳에서 소유).
3. 모든 페이지의 요소 간 `gap`은 동일하다(스택 컨테이너 `flex/grid`의 `gap-8`).

값을 바꿀 때도 이 세 불변식만 유지하면 됩니다. 개별 블록이 자기 패딩·마진을 오버라이드하는 것은 이 통일을 깨므로 지양합니다.

최상위 헤더 계층은 `GuidelineHeader`가 `variant`(`onboard`/`chapter`/`section`/`page`/`block`)로 분기해 소유합니다(`guideline-header.tsx:10-29`). page 헤더는 `GuidelinePageHeading`으로 분리되어 있습니다. 앱 셸의 `main` 랜드마크는 layout이 아니라 각 라우트 본문이 소유합니다(`layout.tsx:56`).

## 8. 크로스커팅 참조

이 문서는 아래 경계를 링크만 하고 복제하지 않습니다.

| 관심사 | 소유 문서 | 이 문서와의 관계 |
| --- | --- | --- |
| 접근성·다국어 | `docs/08-accessibility-i18n.md` | 색만으로 상태를 구분하지 않는 규칙 등은 08이 소유 |
| 소스 위치·네이밍·`use client` 경계 | `docs/06-project-structure.md` | 컴포넌트 배치와 명명은 06 기준 |
| 보안 | `docs/07-security.md` | 런타임 브랜드 hex는 `<style>`로 미새니타이즈 주입(`layout.tsx:38-42`)되므로 입력 신뢰 경계는 07이 다룸 |
| 브랜드 자산 데이터 모델 | `docs/05-system-architecture.md` | 색·폰트·로고가 데이터로 흐르는 소유 구조는 05가 정의 |
