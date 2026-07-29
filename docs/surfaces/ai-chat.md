# AI Chat

## 1. 목적

앱 안의 대화형 표면입니다. 사용자가 채팅으로 요청하면 agent가 적절한 Feature를 도구로 호출합니다.

## 2. 어댑터 계약

- agent는 `src/agents/agent-chat.agent.ts`(ToolLoopAgent)가 소유하고, 도구는 `src/agents/agent-chat-tools.agent.ts`에 등록합니다. 진입점은 `src/app/api/agent-chat/route.ts`입니다.
- 새 Feature를 이 표면으로 노출하려면: 코어 service를 감싸는 tool을 정의(입력 스키마 + 코어 호출) → 도구 목록에 등록. agent가 언제 그 도구를 고를지는 도구 설명과 skill로 유도합니다.
- 도구는 코어 service를 호출만 하며 로직을 중복 구현하지 않습니다.

## 3. 공통 규칙

- Agent 실행 경계·컨텍스트 제한: [05. 시스템 아키텍처](../05-system-architecture.md), [07. 보안](../07-security.md)
- 도구가 호출하는 각 Feature의 계약: [Features](../features/README.md)

## 4. 크로스커팅

Agent 실행 모델과 보안 한계는 위 개념 문서가 규정합니다. 여기서는 링크만 유지합니다.
