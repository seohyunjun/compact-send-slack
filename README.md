# Compact Send Slack

Claude의 compact prompt와 진행상황을 Slack webhook으로 전송하는 도구입니다.
**Claude Desktop (MCP)** 와 **Claude Code (CLI)** 모두에서 사용 가능합니다.

## 기능

- **Compact Prompt 전송**: Claude의 프롬프트를 압축하여 Slack으로 전송
- **진행상황 추적**: 작업 진행률을 실시간으로 Slack에 알림
- **세션 관리**: 작업 세션별로 구분하여 추적
- **커스터마이징**: 알림 활성화/비활성화 설정 가능
- **다중 환경 지원**: Claude Desktop (MCP) + Claude Code (CLI) 지원

## 설치

```bash
npm install
npm run build
```

## 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하여 Slack webhook URL을 설정하세요:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SESSION_ID=my-session
ENABLE_PROGRESS=true
ENABLE_COMPACT_PROMPTS=true
```

### 2. Claude Desktop 설정 (MCP 사용)

Claude Desktop 설정 파일에 MCP 서버를 추가하세요:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "compact-send-slack": {
      "command": "node",
      "args": ["/path/to/compact-send-slack/dist/index.js"]
    }
  }
}
```

## 사용법

### A. Claude Desktop에서 사용 (MCP)

#### 1. Slack 설정

```javascript
// .env 파일에 설정된 경우 - 매개변수 없이 호출 가능
configure_slack

// 또는 직접 webhook URL 제공
configure_slack({
  "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "sessionId": "my-session-1",
  "enableProgress": true,
  "enableCompactPrompts": true
})
```

#### 2. Compact Prompt 전송

```javascript
send_compact_prompt({
  "prompt": "이 긴 프롬프트를 압축해서 전송합니다...",
  "sessionId": "my-session-1"
})
```

#### 3. 작업 진행상황 추적

```javascript
// 작업 추가
add_task({
  "taskId": "task-1",
  "taskName": "API 구현하기"
})

// 현재 작업 설정
set_current_task({
  "taskName": "API 엔드포인트 생성 중"
})

// 작업 완료
complete_task({
  "taskId": "task-1"
})

// 진행상황 전송
send_progress
```

### B. Claude Code에서 사용 (CLI)

#### 1. 명령줄에서 직접 사용

```bash
# Slack 설정
npm run cli configure "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 프롬프트 전송
npm run cli send-prompt "Claude Code에서 작업 중입니다"

# 작업 추적
npm run cli add-task "task1" "API 구현"
npm run cli set-current-task "현재 작업 중"
npm run cli complete-task "task1"
npm run cli send-progress

# 진행상황 조회
npm run cli get-progress
```

#### 2. JavaScript/Node.js에서 사용

```javascript
import { slack } from './slack-cli.js';

// 설정
await slack.config("https://hooks.slack.com/services/...");

// 사용
await slack.send("작업 시작");
await slack.task("t1", "새 기능 구현");
await slack.current("API 개발 중");
await slack.done("t1");
await slack.progress();
await slack.status(); // 진행상황 조회
```

#### 3. 간단한 함수들

```javascript
import {
  slackConfig,
  slackSend,
  slackTask,
  slackDone,
  slackProgress
} from './slack-cli.js';

await slackConfig("webhook-url");
await slackSend("메시지");
await slackTask("id", "작업명");
await slackDone("id");
await slackProgress();
```

## 도구 목록

### Claude Desktop (MCP) 도구

| 도구명 | 설명 |
|--------|------|
| `configure_slack` | Slack webhook URL 및 설정 구성 |
| `send_compact_prompt` | 압축된 프롬프트를 Slack으로 전송 |
| `add_task` | 진행상황 추적에 작업 추가 |
| `complete_task` | 작업을 완료로 표시 |
| `set_current_task` | 현재 진행 중인 작업 설정 |
| `send_progress` | 현재 진행상황을 Slack으로 전송 |
| `get_progress` | 현재 진행상황 정보 조회 |
| `reset_progress` | 진행상황 추적 초기화 |

### Claude Code (CLI) 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run cli configure [webhookUrl] [sessionId]` | Slack webhook 설정 |
| `npm run cli send-prompt <prompt> [sessionId]` | 압축된 프롬프트 전송 |
| `npm run cli add-task <taskId> <taskName>` | 작업 추가 |
| `npm run cli complete-task <taskId>` | 작업 완료 |
| `npm run cli set-current-task <taskName>` | 현재 작업 설정 |
| `npm run cli send-progress` | 진행상황 전송 |
| `npm run cli get-progress` | 진행상황 조회 |
| `npm run cli reset-progress` | 진행상황 초기화 |
| `npm run cli help` | 도움말 표시 |

## Slack 메시지 형식

### Compact Prompt
- 헤더: "🤖 Claude Compact Prompt"
- 시간, 세션 ID 정보
- 압축된 프롬프트 내용

### 진행상황
- 헤더: "📊 Task Progress Update"
- 현재 작업, 진행률, 시간 정보
- 시각적 진행률 바
- 완료된 작업 목록

## 개발

```bash
# 개발 모드 실행
npm run dev

# 빌드
npm run build

# MCP 서버 실행
npm start

# CLI 도구 실행
npm run cli help
```

# Claude Code에 추가
```
claude mcp add compact-send-slack node -s user ./compact-send-slack/dist/index.js -e "SLACK_WEBHOOK_URL=..." -e "SESSION_ID=my-session" -e "ENABLE_PROGRESS=true" -e "ENABLE_COMPACT_PROMPTS=true"
```

## 특징

### 지능형 프롬프트 압축
- 불필요한 접두사/접미사 제거
- 도구 사용 패턴 압축
- 파일 작업 표현 단순화
- 중복 표현 제거

### 시각적 진행률 표시
- 진행률 바 (█████░░░░░ 50%)
- 완료/전체 작업 수 표시
- 실시간 상태 업데이트

### 스마트 메시지 분할
- 4000자 제한 자동 처리
- 의미 단위 보존
- 순서 번호 자동 추가

## 라이센스

MIT