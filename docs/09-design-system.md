# 09. 디자인 시스템

이 문서는 Creator UI와 guideline 렌더링 계층의 시각 언어를 정의합니다.
토큰의 값이 아니라 토큰의 **소유 위치와 사용 규칙**을 정리하는 지도 문서이며, 실제 값의 단일 출처(SoT)는 언제나 CSS 파일입니다.

그 시각 언어가 무엇 위에 서 있는지(프런트엔드 스택)와 외부 레퍼런스를 어디까지 따르는지는 **§9**가 정의합니다.

## 1. 적용 범위

이 문서는 시각 스타일을 다루는 두 표면에만 적용합니다.

| 대상 | 위치 | 기준 |
| --- | --- | --- |
| Creator UI | `src/app/(frontend)` | 셸, 헤더, 전역 컴포넌트의 색·타이포·간격 |
| guideline 렌더링 계층 | `src/features/guideline/components` | 블록·프레임·헤더가 토큰을 소비하는 방식 |

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
| color 원시값 | `:root`(라이트), `.dark`(다크)의 원시 색 정의 | `src/app/(frontend)/theme.css`, `theme.css` |
| color 유틸 매핑 | 원시값 → `@theme inline`의 `--color-*` 유틸 토큰 | `theme.css` |
| 상태색 | 판정·상태 표시 전용 `--success`/`--info`/`--warning`(실패는 기존 `--destructive`, 해당 없음은 `--muted`). Admin 확장은 같은 이름을 Payload 테마에 매핑 | `src/app/(frontend)/theme.css`, `src/app/(payload)/admin-tailwind.css` |
| highlight | 강조 배경과 전경 토큰, `bg-highlight` 유틸. Frontend는 gradient, Admin은 Payload success 색에 매핑 | `src/app/(frontend)/theme.css`, `src/app/(payload)/admin-tailwind.css` |
| radius | `--radius` 뿌리 1개에서 `--radius-sm/md/lg/xl` 4단 파생(`lg`는 뿌리값, `sm`/`md`/`xl`은 calc) | `theme.css`, `theme.css` |
| 폰트 패밀리 | `--font-body`(Pretendard), `--font-title`(**미정 — Pretendard로 폴백.** 토큰과 `.font-title`은 자리를 지키고 있으니 서체가 정해지면 값만 바꿉니다), `HD`(CI 락업 워드마크 전용 @font-face) | `theme.css` |
| 루트 크기 | 모든 화면에서 고정된 16px `rem` 기준 크기 | `src/app/(frontend)/styles.css`의 `html` |
| 타이포 리듬 | `.typeset` 블록의 크기·행간·흐름(shadcn/typeset) | `src/app/(frontend)/typeset.css` |
| base body / scrollbar / import 순서 | `body` 기본, `scrollbar-none` 유틸, CSS `@import` 체인 | `src/app/(frontend)/styles.css` |

`--radius`는 뿌리 토큰 하나이고 나머지 4단은 그것을 기준으로 파생합니다(`--radius-lg`는 뿌리값 그대로, `sm`/`md`/`xl`은 `calc()`; `theme.css`). radius를 조정할 때는 파생값이 아니라 뿌리 하나만 바꿉니다.

Frontend의 `highlight`는 Figma 강조 스타일을 옮긴 그라디언트입니다. `bg-highlight`가 가로 밴드를 2배로 늘려 왼쪽에서 오른쪽으로 반복 이동시키고, 모션 감소 설정에서는 정지합니다. Admin은 같은 유틸 이름을 Payload success 색에 매핑합니다. Badge와 Button은 `bg-highlight`와 `text-highlight-foreground`를 함께 사용하며, 개별 컴포넌트에서 색이나 gradient stop을 다시 선언하지 않습니다.

## 4. 닫힌 토큰 규칙

색·간격·radius·폰트는 **시맨틱 토큰과 그 유틸 클래스로만** 표현합니다. `bg-primary`, `text-foreground`, `border-border`, `bg-muted`, `text-success`, `font-body`, `rounded-md`처럼 이름이 의미를 가리키는 유틸만 사용합니다. **토큰에 없으면 틀린 것**이라는 이진 규칙을 적용합니다.

판정 상태는 `success`, `info`, `warning`, `destructive`를 사용합니다. 라이트·다크 모드의 명도 차이는 각 표면의 테마 파일이 소유하며 컴포넌트에서 `dark:` 팔레트 클래스를 다시 선언하지 않습니다. 상태는 라벨·아이콘과 함께 표시해 색만으로 의미를 전달하지 않습니다.

토큰은 2단 인디렉션을 거칩니다.

```text
원시 oklch (theme.css :root / .dark)
  → @theme inline --color-* (theme.css)
    → Tailwind 유틸 (bg-primary, text-foreground, ...)
```

`className`/`style` 리터럴에서 다음은 금지합니다.

- 생 hex 리터럴(예: `#a1b2c3`)
- 생 Tailwind 팔레트 + 숫자 — 무채색(`neutral`/`gray`/`zinc`/`slate`/`stone`)만이 아니라 **유채색 전체**(`emerald`, `sky`, `amber`, `orange` 등)를 포함합니다. 🔴 숫자가 없는 `white`·`black`도 같습니다 — 탐지 grep이 숫자만 보고 있어 `bg-white`가 실제로 통과한 적이 있습니다(2026-08-12, shadcn slider). `bg-emerald-500/15`처럼 유채 팔레트로 상태를 칠하는 것도 위반입니다.
- `.tsx` 안의 `oklch(...)` 리터럴

성공/정보/경고/실패 같은 **판정·상태 표시는 상태 토큰만** 사용합니다: `--success`/`--info`/`--warning`/`--destructive`(해당 없음은 `muted`). 사용 형태는 destructive 선례를 따릅니다 — pill은 `bg-success/15 text-success`, dot은 `bg-success`. 상태 토큰으로 표현할 수 없는 새 상태가 생기면 팔레트로 우회하지 말고 이 문서와 `theme.css`에 토큰을 추가합니다.

**예외:** 색 자체를 데이터로 다루는 컴포넌트(`ColorSwatch`, `ColorPalette` 등)가 props나 CMS로 받는 hex는 스타일이 아니라 **데이터**이므로 허용합니다. 이때 hex는 코드에 고정되지 않고 주입됩니다.

탐지용 grep:

```sh
rg -n '#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|fill|from|to|via)-(?:(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|neutral|gray|zinc|slate|stone)-[0-9]|white|black)\b|oklch\(' src --glob '*.tsx'
```

이 명령이 색 데이터 컴포넌트 밖에서 걸리면 토큰 위반입니다.

## 5. 다크 모드와 브랜드 오버라이드

다크 모드는 `.dark` **클래스** 방식입니다. `prefers-color-scheme` 미디어 쿼리가 아니라, `@custom-variant dark (&:where(.dark, .dark *))`(`theme.css`)로 정의하고, `next-themes`의 `ThemeProvider`를 `attribute="class"` + `defaultTheme="system"` + `enableSystem`(`layout.tsx`)으로 구동합니다. 시스템 설정은 `next-themes`가 읽어 `.dark` 클래스로 변환하므로, 원시값은 라이트가 `:root`(`theme.css`), 다크가 `.dark`(`theme.css`) 한 곳에서만 갈립니다.

런타임 브랜드 색은 CMS 메타데이터에서 옵니다. `layout.tsx`가 `metadata.primaryHex` 등으로 문자열을 만들고 `layout.tsx`가 `<style>`로 주입해 `--primary`와 `--primary-foreground` **2개 토큰만** 오버라이드합니다(라이트는 `:root`, 다크는 `.dark`). 코드에는 브랜드 색이 없고 데이터만 흐르므로 브랜드 어그노스틱이 유지됩니다.

주입 대상이 `--primary` 계열 2개뿐이라는 것은 현실의 제약을 만듭니다. `accent`, `secondary`, `ring`은 채도(chroma) 0의 뉴트럴로 고정되어 있고, `chart-1`~`chart-5`는 0이 아닌 채도의 고정된 다색 팔레트를 갖습니다(둘 다 `theme.css` 원시값). 어느 쪽도 브랜드 주입을 받지 않으므로, 브랜드 강조색은 `primary`를 쓰는 표면(예: `bg-primary`, `text-primary`)에만 반영되고 그 밖의 강조 토큰은 원래 값으로 남습니다.

## 6. 타이포그래피와 프리미티브 소재

새 `H1`/`H2` 컴포넌트를 발명하지 않습니다. 텍스트 프리미티브는 `Typography`(`as`/`family`/`size`/`tone`/`weight`)를 재사용하고, 여러 화면 표면이 공유하는 제목 조합은 `src/components/shared/content-heading.tsx`의 `ContentHeading`을 사용합니다.

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

메인 히어로의 제목·버전 표기와 푸터 `LBS`는 화면 비율에 맞춘 lockup을 유지해야 하므로 유일한 viewport 반응형 예외이며 기존 `clamp()` 크기를 사용합니다. 템플릿 캔버스와 `TypeScale`·`TypeSpecimen`이 데이터로 받은 글자 크기도 UI 타이포그래피가 아니므로 예외입니다. 그 밖의 `TypeSpecimen` 같은 대형 표본은 viewport 계산식 대신 `text-9xl` 같은 고정 유틸리티를 사용합니다. 클래스 주입이 불가능한 `.typeset` 내부 생성 HTML은 `typeset.css`에서 같은 고정 단계만 직접 선언합니다.

현재 상태를 정직하게 기술합니다.

| 사실 | 근거 |
| --- | --- |
| `--font-body`(Pretendard)는 `body`에 배선되어 기본 폰트로 동작 | `theme.css`, `styles.css` |
| `--font-title`은 값이 정해지지 않아 Pretendard로 폴백하며, `.font-title` 클래스는 정의되어 있으나 상위 guideline 헤더에 미배선 | `theme.css`, `theme.css` |
| 그래서 `GuidelineHeader`의 `ChapterHeader`/`SectionHeader` 등은 `font-title` 없이 렌더되어 기본 body 폰트로 폴백 | `guideline-header.tsx:51-73` |
| `--font-heading`/`--font-mono`는 어디에도 정의되지 않아 `.typeset`의 `code`/`pre`는 브라우저 monospace로 폴백 | `typeset.css` (참조만, 정의 없음) |

`font-title`을 헤더에 붙이거나 `--font-mono`를 정의하는 것은 파운데이션 변경(09)이지 컴포넌트 작업이 아닙니다. 상세한 텍스트 저작 규칙은 `docs/10`이 소유합니다.

## 7. 공통 셸과 프레임 골격

guideline 블록은 두 겹의 프레임으로 감쌉니다.

| 겹 | 컴포넌트 | 소유 책임 |
| --- | --- | --- |
| 표면색 껍질 | `GuidelineBlockFrame`(`<section>`) | 전체 폭 배경/전경(`normal`/`secondary`/`inverted`) |
| 폭 프레임 | `ContentFrame` | 최대 폭과 가로 여백(`max-w-[1250px] px-4 md:px-8`) |

`GuidelineBlockFrame`(`guideline-block-frame.tsx:24-46`)은 표면색만 정하고 즉시 `ContentFrame`을 감쌉니다. 폭과 가로 여백은 `ContentFrame`의 `padded` variant 한 곳만 소유합니다(`content-frame.tsx:22`). 개별 블록은 자기 `max-width`를 선언하지 않습니다 — 폭을 바꾸려면 프레임 한 곳만 고칩니다.

세로 리듬은 프레임의 self-padding(`content-frame.tsx:21`의 `py-8`)과 스택 컨테이너의 `gap`이 함께 담당합니다. 요소 사이 실제 간격은 `패딩 + gap + 패딩`의 합입니다. "블록마다 마진을 흩뿌리지 않는다"의 뜻은 *바꾸지 않는다*가 아니라 *요소마다 제각각 다르게 주지 않는다*이며, 다음 세 불변식으로 리듬을 통일합니다:

1. 한 요소의 상하 패딩은 대칭이다(`py-*` 하나로).
2. 모든 요소의 패딩은 동일하다(프레임 한 곳에서 소유).
3. 모든 페이지의 요소 간 `gap`은 동일하다(스택 컨테이너 `flex/grid`의 `gap-8`).

값을 바꿀 때도 이 세 불변식만 유지하면 됩니다. 개별 블록이 자기 패딩·마진을 오버라이드하는 것은 이 통일을 깨므로 지양합니다.

최상위 헤더 계층은 `GuidelineHeader`가 `variant`(`onboard`/`chapter`/`section`/`page`/`block`)로 분기해 소유합니다(`guideline-header.tsx:10-29`). page 헤더는 `GuidelinePageHeading`으로 분리되어 있습니다. 앱 셸의 `main` 랜드마크는 layout이 아니라 각 라우트 본문이 소유합니다(`layout.tsx`).

## 8. 크로스커팅 참조

이 문서는 아래 경계를 링크만 하고 복제하지 않습니다.

| 관심사 | 소유 문서 | 이 문서와의 관계 |
| --- | --- | --- |
| 접근성·다국어 | `docs/08-accessibility-i18n.md` | 색만으로 상태를 구분하지 않는 규칙 등은 08이 소유 |
| 소스 위치·네이밍·`use client` 경계 | `docs/06-project-structure.md` | 컴포넌트 배치와 명명은 06 기준 |
| 보안 | `docs/07-security.md` | 런타임 브랜드 hex는 `<style>`로 미새니타이즈 주입(`layout.tsx`)되므로 입력 신뢰 경계는 07이 다룸 |
| 브랜드 자산 데이터 모델 | `docs/05-system-architecture.md` | 색·폰트·로고가 데이터로 흐르는 소유 구조는 05가 정의 |
| 위젯 시각 어휘 | `docs/11-widget-authoring.md` | 가이드라인 위젯이 쓰는 표본 면·판독·캡션 어휘는 11이 소유 |

## 9. 프런트엔드 스택과 외부 레퍼런스

### 스택

| 층 | 채택 | 비고 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) | 라우트별 렌더링 방식은 **선언**합니다(`docs/05` 「렌더링 캐시 무효화」) |
| 스타일 엔진 | Tailwind CSS v4 — **CSS-first** | `tailwind.config`가 없습니다. 토큰은 `theme.css`의 `@theme inline` |
| 컴포넌트 | **shadcn/ui** (`base: radix`) | 라이브러리가 아니라 **소스 복사본**입니다. `src/components/ui`를 우리가 소유 |
| 동작·접근성 | **Radix** | shadcn 아래층. WAI-ARIA APG 패턴 구현체 |
| variant | `class-variance-authority` | 원형은 `docs/10` §3 |
| 모션 | `motion/react` | `LazyMotion` + `m` 조합만 |
| 아이콘 | **`@carbon/icons-react` 단일 소스** | `components.json`의 `iconLibrary`가 다른 값인 이유는 `docs/10` §2 |
| 본문 서체 | Pretendard (`--font-body`) | `--font-title`은 값 미정 — §6 |

### Carbon Design System을 어디까지 따르나

스타일 레퍼런스는 **IBM Carbon Design System**입니다. 다만 채택 범위를 좁게 고정합니다.

- 🔴 **`@carbon/react`(컴포넌트 라이브러리)는 도입하지 않습니다.** 스택이 shadcn + Radix + Tailwind라 컴포넌트 체계가 두 벌이 되고, 같은 버튼에 스타일이 겹칩니다. 아이콘만 이미 Carbon입니다.
- 가져오는 것은 **스케일과 역할**입니다 — 간격 단계, 타입 단계, 상태색 역할, 모션 커브. 들어오는 자리는 `theme.css`의 토큰 하나뿐이고, 컴포넌트에 직접 값을 쓰지 않습니다.
- 🔴 **토큰은 덧붙이기만 합니다.** 기존 값을 교체하면 guideline·studio·admin이 한꺼번에 흔들립니다. 새 단계가 필요하면 추가하고, 교체는 그 자체로 별도 결정입니다.

### shadcn 컴포넌트를 가져올 때의 판단 기준

1. **스타일이 더 낫다** → 컴포넌트가 아니라 **토큰(이 문서)을 고칩니다.** 값은 전역에서만 평가할 수 있습니다.
2. **기존 구현이 낫다** → 그래도 가져옵니다. 소스를 우리가 소유하므로 더 낫게 만들 자리는 **가져온 파일 안**입니다. 안 가져오는 유일한 근거는 **"의미가 다르다"**이고, 그때는 왜 다른지 코드에 적습니다. "우리 게 낫다·자유롭다·빠르다"는 근거가 되지 않습니다.
3. 🔴 **가져온 컴포넌트의 기본 스킨은 shadcn의 취향이지 우리 DS가 아닙니다.** 추가한 같은 변경에서 토큰만 쓰는지 확인하고, 안 맞는 부분은 컴포넌트에서 고치지 말고 이 문서와 `theme.css`로 승격합니다.
