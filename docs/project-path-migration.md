# Project Path Migration

## Current Fixed Path

```text
C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台
```

All future Codex / PowerShell / local development tasks for this project should default to this path.

## Deprecated Paths

These paths are no longer default project paths:

```text
C:\Users\123\vibe-projects\my-first-app
C:\Users\123\七七AI项目工作台\10-内容选题工作台
```

## AI Workspace Split

- AI control workspace: `C:\Users\123\七七AI项目工作台`
- Current project: `C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台`
- Sensitive config backup: `C:\Users\123\七七AI项目工作台\98-敏感配置备份-禁止AI读取`

## Start Commands

PowerShell:

```powershell
cd C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台
npm.cmd run dev
```

Codex start path:

```text
C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台
```

Health checks:

```powershell
npm.cmd run lint
npm.cmd run build
```

Feishu push acceptance command, only when the user explicitly requests real-platform validation:

```powershell
npm.cmd run feishu:push
```

## Sensitive Config Rules

- `.env.local` must remain in the project root for local runtime when needed.
- `.env.local` and other real secrets must not be read, displayed, summarized, or committed by AI.
- `.env.example` may describe variable names, but must not contain real secrets.
- `98-敏感配置备份-禁止AI读取` is for real sensitive backups only; AI may confirm existence but must not read content.
- Do not output API Key, webhook, CRON_SECRET, AppSecret, access_token, token, or provider secrets.
