# 컴포넌트 폴더 스케폴딩 준비 계획

## 목표

컴포넌트 분류를 다시 결정할 때 현재 위치에 끌려가지 않도록, 이동 기준과 검증 순서만 먼저 고정합니다. 이 단계에서는 빈 폴더·barrel·공용 추상화를 만들지 않습니다.

## 고정 조건

- `src/components/ui/*`는 shadcn 원형으로 유지합니다.
- 한 기능만 쓰는 컴포넌트는 `src/features/<feature>/components`가 소유합니다.
- 둘 이상의 기능이 실제로 쓰는 컴포넌트만 `src/components` 승격 후보입니다.
- `index.ts`, barrel export, factory, 단일 구현 interface는 만들지 않습니다.
- 테스트는 대상 파일 옆에 두고 이동할 때 함께 옮깁니다.
- 폴더는 첫 파일이 들어갈 때만 만듭니다.

## 현재 인벤토리

| 위치 | 현재 성격 | 분류 때 확인할 점 |
| --- | --- | --- |
| `src/components/ui` | shadcn 프리미티브 40개 | 고정. 이동·통합 대상에서 제외 |
| `src/components/admin` | Payload Admin UI와 helper 20개 | `admin` 표면 소유와 기능 소유 중 어느 쪽을 우선할지 결정 |
| `src/components/global` | page frame·navigation·provider 5개 | 실제 전역 shell인지, 특정 화면 조합인지 호출자 기준으로 재검증 |
| `src/components/hero` | 홈 hero 조합 4개 | 전역 공유가 아니라 홈 화면 소유인지 결정 |
| `src/components/studio` | Studio 조합과 테스트 2개 | `asset-generation` 등 실제 기능 소유자로 이동할지 결정 |
| `src/components/*.tsx` | NavigationBlock·PageNavigation | 두 기능 이상 공유 여부와 API 안정성을 확인 |
| `src/features/*/components` | 기능별 UI | 기본 위치. 교차 호출만 승격 후보로 표시 |

## 분류 결정표

각 파일에 아래 항목을 기록한 뒤 위치를 정합니다.

| 항목 | 판정 |
| --- | --- |
| 소유 기능 | 이 컴포넌트가 없어지면 어느 기능이 깨지는가 |
| 실제 호출자 | import하는 기능/화면 수가 몇 개인가 |
| 표면 | Frontend, Payload Admin, 또는 양쪽인가 |
| 역할 | primitive, 조합, 화면 section, field/editor 중 무엇인가 |
| 상태 경계 | client state·effect를 직접 소유하는가 |
| 변형 계약 | variant가 의미 조합인지, size만 바꾸는지 |
| 통합 후보 | 같은 책임과 props를 가진 구현이 이미 있는가 |

결정이 필요한 핵심 쟁점은 다음 네 가지입니다.

1. `admin`을 하나의 표면 폴더로 유지할지, 각 기능 아래로 분산할지
2. `global`을 app shell 전용으로 좁힐지
3. 홈·Studio 전용 조합을 route가 아닌 feature 중 어디가 소유할지
4. 두 기능 공유를 `src/components` 승격의 충분조건으로 볼지, API 안정성까지 요구할지

## 실행 순서

1. `src/components/ui`를 제외한 파일별 호출자 manifest를 만듭니다.
2. 위 결정표로 각 파일에 `유지 / feature 이동 / shared 승격 / 삭제 / 통합 검토` 중 하나를 표시합니다.
3. 분류안을 먼저 리뷰하고 목적 폴더 목록을 확정합니다.
4. 한 묶음씩 **이동만** 수행합니다. 같은 커밋에서 variant나 렌더 로직을 다시 고치지 않습니다.
5. import 경로와 co-located test를 함께 옮기고 빈 폴더만 제거합니다.
6. 묶음마다 typecheck·관련 테스트를 통과시킨 뒤 다음 묶음으로 이동합니다.

## 완료 조건

- `src/components/ui` 변경 없음
- 모든 비-ui 컴포넌트에 소유자와 실제 호출자 근거가 있음
- root/shared 위치에는 둘 이상의 기능에서 쓰는 컴포넌트만 남음
- 기능 전용 컴포넌트가 `src/components`에 남지 않음
- 중복 구현은 통합되거나 서로 다른 책임이라는 근거가 기록됨
- 새 barrel·factory·빈 스케폴딩 없음
