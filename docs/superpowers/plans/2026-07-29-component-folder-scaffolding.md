# 컴포넌트 폴더 스케폴딩 실행 계획

## 목표

실제 화면 표면과 화면 크기 책임을 기준으로 컴포넌트 소유권과 경계를 정리합니다. 표현 계층은 `components`, 비즈니스 로직은 `features`가 소유합니다.

## 고정 조건

- `src/components/ui/*`는 shadcn 원형으로 유지합니다.
- Guideline 전용 분류와 이동은 이번 범위에서 제외합니다. `src/components/global/side-nav`는 후속 분류 대상으로 유지합니다.
- 일반 React 컴포넌트는 사용 개수와 무관하게 `src/components/<surface>`가 소유합니다.
- `src/features`는 domain, hook, service, repository, util, type만 소유합니다.
- 의존 방향은 `app → components → features`로 고정합니다.
- Guideline block의 co-located renderer와 기존 `features/guideline/components`는 이번 범위의 예외입니다.
- `index.ts`, barrel export, factory, 단일 구현 interface는 만들지 않습니다.
- 테스트는 대상 파일 옆에 두고 이동할 때 함께 옮깁니다.
- 폴더는 첫 파일이 들어갈 때만 만듭니다.

## 네이밍과 경계 기준

### 컨테이닝

- 화면 공간을 나누는 컨테이너는 배치 의미를 이름에 씁니다: `head`, `center`, `tail`, `body`.
- 기능 의미가 더 강하면 공간 이름보다 기능 이름을 씁니다: `TemplateCanvas`, `LayerList`, `TemplatePreview`.
- 단순 스타일 wrapper는 컴포넌트로 만들지 않습니다.

### 사이징

다음 중 하나를 소유하는 요소를 컴포넌트 경계 후보로 봅니다.

- grid track 또는 고정 폭/높이
- `flex-1`, `min-h-0`, scroll 영역
- 원본 크기와 contain scale
- 부모 배치에서 독립적으로 반복되는 항목의 전체 크기

분리 후 props가 상태 객체 전체를 전달하게 되거나 단순 wrapper만 남으면 분리하지 않습니다.

## 폴더 분류 결과

| 위치 | 판정 | 근거 |
| --- | --- | --- |
| `src/components/ui` | 유지 | shadcn 프리미티브 원형 |
| `src/components/admin` | 유지 | Payload Admin이라는 강한 표면 의미와 문자열 import 경계 |
| `src/components/global` | app shell로 한정 | layout·header·footer·chat·provider만 소유 |
| `src/components/navigation` | shared | Home·Studio·Guideline 중 둘 이상이 실제 사용 |
| `src/components/shared` | cross-surface shared | Studio·Guideline이 함께 쓰는 `ContentHeading` |
| `src/components/home` | home surface | 홈에서만 쓰는 hero 조합 |
| `src/components/studio` | studio surface | shared·generate·review·template·examples UI |
| `src/components/studio/shared` | studio shared | 둘 이상의 Studio 하위 화면이 쓰는 navigation |
| `src/components/global/chat` | global surface | 모든 Creator 화면에서 쓰는 Agent Chat UI |
| `src/components/admin/image-profile` | admin surface | Image Profile 테스트 필드 |
| `src/components/admin/template` | admin surface | Figma import와 Template 편집 필드 |
| `src/features/*` | business logic | 일반 React 컴포넌트를 두지 않음 |

barrel과 빈 폴더는 만들지 않습니다.

## 사이징 경계 점검

| 대상 | 크기 계약 | 경계 |
| --- | --- | --- |
| `GlobalHeader` | 3열 grid | `HeaderHead` / `HeaderCenter` / `HeaderTail` 유지, 파일명도 공간명으로 통일 |
| `SectionLayout` | nav 옆 `flex-1` 스크롤 영역 | 같은 파일의 `SectionBody`로 분리 |
| `HeroSection` | 메인·기능·footer 화면 구간 | 의미가 강한 `HeroMainSection` / `HeroFeatureSection` / `HeroFooter` 유지 |
| `TemplateGenerator` | `md:w-72` 입력 열 + scale 미리보기 | `TemplateSlotControls` / `TemplatePreview`로 분리 |
| `TemplateLayersField` | 가변 canvas + 260px layer list + 선택 편집부 | `TemplateCanvas` / `LayerList` / `SelectedLayerEditor`로 분리 |
| `PageNavigation` | 양쪽 절반을 채우는 링크 | 기존 `PageLink` 경계 유지 |
| `AgentChatTemplateAttachment` | 첨부 폭에 맞춘 contain scale | 기존 `ScaledMedia` 경계 유지 |
| `ImageUploadCarousel` | carousel viewport와 item 높이 | 기존 `CheckCarouselActive` 경계 유지 |
| `ImageGenerator` | 22rem controls + 가변 canvas | 경계는 확인했지만 상태·callback 전달이 과도해 이번 분리에서 제외 |

## 실행 순서

1. Home·Studio·Global Chat·Payload Admin UI를 `src/components/<surface>`로 이동합니다.
2. `features/*/components`의 비-React 로직은 기능의 domain 또는 util로 옮깁니다.
3. 여러 화면이 공유하는 navigation만 `src/components/navigation`으로 묶습니다.
4. 둘 이상의 화면 표면이 쓰는 UI는 `src/components/shared`, 한 표면의 여러 화면이 쓰는 UI는 `<surface>/shared`로 묶습니다.
5. Studio·Guideline 제목은 `ContentHeading`을 공통 사용합니다.
6. Header 공간 파일명을 `header-head/center/tail`로 통일합니다.
7. 실제 크기 계약이 있는 로컬 영역만 같은 파일의 컴포넌트로 분리합니다.
8. Payload Admin 문자열 경로와 생성 import map을 함께 갱신합니다.
9. import 경로·co-located test·정적 검사·typecheck·전체 테스트를 확인합니다.

## 완료 조건

- `src/components/ui` 변경 없음
- 모든 비-ui·비-guideline 컴포넌트에 소유자와 실제 호출자 근거가 있음
- `src/components`의 UI가 실제 화면 표면으로 분류됨
- 비-guideline `src/features/*/components`에 파일이 남지 않음
- `features`에서 `components`를 import하지 않음
- 화면 크기를 결정하는 영역은 로컬 경계가 있거나 분리 제외 근거가 기록됨
- 새 barrel·factory·빈 스케폴딩 없음
