# prd-motion

PRD·기획서를 주면, 기능(FR)마다 **그 기능이 실제로 바꾸는 것**을 모션으로 보여 주는 스크롤 웹페이지(단일 HTML)를 만드는 Claude 스킬입니다.

- 기능마다 다른 모션 유형(썰물, 합류, 임계 경보, 경로, 재배치, 레이스, 재정렬 등 16종)을 고릅니다.
- 보는 사람이 그 기능의 입력을 직접 조작하면 결과가 계산되어 바뀝니다.
- PRD의 의존 관계대로 기능끼리 상태가 이어집니다.
- 영상 AI나 외부 API 없이 Canvas, SVG, CSS로 만듭니다.

## 설치

**설치할 때는 `skills/prd-motion/` 폴더 전체가 필요합니다.** `SKILL.md`만 복사하면 모션 유형 카탈로그와 공통 코드가 빠져 제대로 동작하지 않습니다.

### 방법 1. 플러그인으로 설치 (Claude Code, 추천)

```
/plugin marketplace add YOUR_GITHUB_ID/prd-motion
/plugin install prd-motion
```

### 방법 2. skills CLI (공개 저장소일 때)

```bash
npx skills add YOUR_GITHUB_ID/prd-motion
```

### 방법 3. 직접 복사 또는 Claude에게 요청

`skills/prd-motion/` 폴더를 통째로 아래 위치에 넣습니다.

- Windows: `C:\Users\<사용자>\.claude\skills\prd-motion\`
- macOS / Linux: `~/.claude/skills/prd-motion/`

Claude Code에 이렇게 요청해도 됩니다.

> https://github.com/YOUR_GITHUB_ID/prd-motion 저장소의 skills/prd-motion 폴더 전체를 ~/.claude/skills/prd-motion 에 설치해줘

### claude.ai 웹·앱

URL로는 설치되지 않습니다. 이 폴더를 zip으로 묶어 Settings → Capabilities → Skills에서 업로드하세요.

## 사용

PRD 파일을 첨부하고 이렇게 요청합니다.

> 이 PRD 기능들을 스크롤하면 나오는 모션그래픽 페이지로 만들어줘

또는 `/prd-motion`으로 직접 부를 수 있습니다.

## 구성

```
skills/prd-motion/
├── SKILL.md                    작업 순서와 규칙
├── references/
│   ├── archetypes.md           모션 유형 16종, 고르는 기준, 핵심 코드
│   └── visual-worlds.md        업종별 색·형태 정하는 법
└── assets/
    ├── motion-kit.js           공통 모션 코드 (스크롤 연동, 재생, 캔버스 맞춤 등)
    └── skeleton.html           페이지 기본 틀
```
