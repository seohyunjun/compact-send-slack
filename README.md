# Compact Send Slack MCP

Claude의 compact prompt와 진행상황을 Slack webhook으로 전송하는 MCP 서버입니다.

## 기능

- **Compact Prompt 전송**: Claude의 프롬프트를 압축하여 Slack으로 전송
- **진행상황 추적**: 작업 진행률을 실시간으로 Slack에 알림
- **세션 관리**: 작업 세션별로 구분하여 추적
- **커스터마이징**: 알림 활성화/비활성화 설정 가능

## 설치

```bash
npm install
npm run build
```

## 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하여 Slack webhook URL을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일 편집:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SESSION_ID=my-session
ENABLE_PROGRESS=true
ENABLE_COMPACT_PROMPTS=true
```

### 2. Claude Desktop 설정

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

### 1. Slack 설정

```javascript
// .env 파일에 설정된 경우 - 매개변수 없이 호출 가능
await mcp.callTool('configure_slack', {});

// 또는 직접 webhook URL 제공
await mcp.callTool('configure_slack', {
  webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  sessionId: 'my-session-1', // 선택사항
  enableProgress: true,
  enableCompactPrompts: true
});
```

### 2. Compact Prompt 전송

```javascript
// 프롬프트를 압축하여 Slack으로 전송
await mcp.callTool('send_compact_prompt', {
  prompt: '이 긴 프롬프트를 압축해서 전송합니다...',
  sessionId: 'my-session-1' // 선택사항
});
```

### 3. 작업 진행상황 추적

```javascript
// 작업 추가
await mcp.callTool('add_task', {
  taskId: 'task-1',
  taskName: 'API 구현하기'
});

// 현재 작업 설정
await mcp.callTool('set_current_task', {
  taskName: 'API 엔드포인트 생성 중'
});

// 작업 완료
await mcp.callTool('complete_task', {
  taskId: 'task-1'
});

// 진행상황 전송
await mcp.callTool('send_progress');
```

## 도구 목록

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

# 프로덕션 실행
npm start
```

## 라이센스

MIT