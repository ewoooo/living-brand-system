# Image

## 1. 목적

프롬프트를 받아 이미지 후보를 여러 장 생성합니다. 브랜드 규정 부합 여부 판단(검수)은 하지 않습니다. 규정 준수는 검수 대신 **프롬프트 프리셋**과 **여러 후보 중 택1하는 UX**로 유도합니다.

Create가 산출물에 이미지가 필요할 때 이 기능을 호출하는 것이 대표 사용처입니다.

## 2. 핵심 계약

표면과 무관한 재사용 단위입니다. 코어 로직은 `src/features/image-generation/`이 소유하고, 표면은 이를 호출만 합니다.

- 입력: 프롬프트 텍스트, 후보 장수(현재 1~6)
- 출력: 이미지 후보 목록(각 항목은 바로 표시 가능한 data URI)
- 검수 미포함: 생성 결과를 그대로 돌려주며 규정 판정을 하지 않습니다.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/image` — 프롬프트 입력 → 후보 그리드 → 택1 |
| [AI Chat](../surfaces/ai-chat.md) | 계획 | agent tool로 등록해 대화 중 생성 |
| REST | 구현 | `POST /api/image`(same-origin, 유료 경로는 인증 게이트) |
| Slack | 계획 | — |

## 4. 의존

- 이미지 프로바이더: OpenAI `gpt-image-2`(사내 채택). 모델은 `OPENAI_IMAGE_MODEL`로 교체 가능하며, 프로바이더 교체도 코어 한 곳(service)에서 이뤄집니다.
- Vercel AI SDK `generateImage`.
- Review 미사용(의도적) — 이미지 검수 성능이 아직 일부 항목에 한정되어 있어 생성 품질을 검수에 묶지 않습니다.
- API 키(`OPENAI_API_KEY`)가 없으면 placeholder 후보로 폴백해 UI 흐름은 그대로 동작합니다.

## 5. 크로스커팅

- 유료 호출 인증·게이트: [07. 보안](../07-security.md)
- 사용자 노출 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리 / AssetGeneration): [04. 도메인 모델](../04-domain-model.md)
