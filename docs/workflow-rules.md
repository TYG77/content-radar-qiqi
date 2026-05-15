# Workflow Rules

This project uses a three-level collaboration model to reduce repeated manual confirmation while keeping risky work controlled.

## A 档：可自动执行

When all conditions below are true, Codex/Cursor may provide a brief plan and then execute without waiting for a second confirmation:

1. The current task boundary is clear.
2. Changes are limited to files explicitly named or clearly implied by the user.
3. No new dependency is added.
4. `.env.local` is not read, displayed, or modified.
5. API Keys, provider main architecture, payment, permissions, and deployment configuration are not modified.
6. No new real platform data source is connected.
7. The task does not implement more than 5 functional points at once.
8. The main product flow direction is not changed.
9. For code changes, both commands are required:
   - `npm.cmd run lint`
   - `npm.cmd run build`
10. Final response must include:
   - Changed files
   - What problem was fixed
   - Whether lint/build passed or was not run
   - Manual acceptance page paths
   - Skill 化复盘

## B 档：必须先只读诊断

When any item below is true, do not modify code directly. Perform read-only diagnosis first:

1. AI generation result is empty.
2. DeepSeek/OpenAI provider path is uncertain.
3. API request succeeds but the page renders no content.
4. mock/fallback/cache may be hiding the real failure.
5. schema/parse/state/render responsibility is uncertain.
6. Page Runtime Error appears.
7. Backend-to-frontend state flow is unclear.

Diagnosis requirements:

1. Do not modify code.
2. Do not read `.env.local`.
3. Explain the likely cause.
4. Provide the smallest repair plan.
5. Wait for user confirmation before executing.

## C 档：必须先写 PRD

When any item below is true, write a PRD first and wait for confirmation:

1. More than 5 functional points in one request.
2. Real hotspot source integration.
3. Feishu/Lark or WeChat Official Account backend integration.
4. User system, billing system, or API Key management.
5. Database, deployment, permission, or security changes.
6. Main flow or core architecture refactor.
7. New external service or dependency.

## Fixed Prohibitions

These are forbidden in all modes:

1. Read, display, or modify `.env.local`.
2. Put API Keys in frontend code.
3. Display raw JSON, payloads, stack traces, or internal code blocks to end users.
4. Pretend mock/AI-generated content is real platform hotspot data.
5. Remove DeepSeek/OpenAI provider switching without confirmation.
6. Perform broad refactors without confirmation.
7. Only change UI copy while leaving the real chain broken.

## Development Rules For Qiqi Content Radar

1. New stages and complex modules must start with PRD/context documentation before implementation.
2. Do business decomposition first, then engineering decomposition.
3. One implementation task should contain no more than 3 major features.
4. Any request with more than 5 functional points must be split into PRD first.
5. Real platforms, APIs, secrets, WeChat Official Account, Feishu/Lark, deployment, permissions, billing, or security require diagnosis before code changes.
6. Never read, display, or modify `.env.local`.
7. Never output API keys, tokens, webhooks, AppSecret, access_token, cron secrets, or provider secrets.
8. Never auto-publish WeChat Official Account articles.
9. Do not break proven main flows while adding new features.
10. Preserve the V1 local/online split: Vercel for selection, writing, layout, Feishu entry, and Cron; localhost for WeChat material upload, cover media_id, and draft writing.
11. Feishu push must stay unified across page push, PowerShell `npm.cmd run feishu:push`, and Cron.
12. New features should reuse the existing article generation flow before creating a new generation chain.
13. Every task should end with manual acceptance paths.
14. After code changes, check `git status`; when needed, commit, push, and verify Vercel Production deployment.
15. Every task must include Skillization Review.
16. High-risk real-platform execution Skills must not be auto-created; register them as pending confirmation only.

## Acceptance Requirements

After every code execution:

1. Run `npm.cmd run lint`.
2. Run `npm.cmd run build`.
3. State whether both passed.
4. Provide manual acceptance paths.
5. If either fails, explain the reason and do not expand the modification scope.

Markdown-only documentation changes may skip lint/build if no business code, config, dependency, or generated artifact is changed. Report that lint/build were not run because the task was docs-only.

## Automatic Skillization Review

After every completed task, run a Skillization Review before the final response.

Review whether the task revealed a reusable workflow that should become a Skill:

1. The same workflow has appeared 3 or more times.
2. Similar prompts are repeatedly required.
3. Inputs and outputs are clear.
4. Trigger scenarios are stable.
5. Boundaries are explicit.
6. The Skill would reduce repeated confirmation between user and Codex/Cursor.
7. The user would not need to restate business background every time.

Auto-save rules:

1. A 档 documentation-only Skills may be created or updated automatically.
2. B 档 diagnostic Skills may be created as diagnosis-only Skills, but must not auto-execute code changes.
3. C 档 high-risk Skills must only be recorded in `docs/skill-registry.md` and require PRD confirmation before implementation.

Final responses must include:

```text
Skill 化复盘：
- 本次是否出现可复用流程：是 / 否
- 是否建议沉淀为 Skill：是 / 否
- 建议 Skill 名称：
- 触发场景：
- 风险等级：A / B / C
- 是否已自动保存：
- 保存路径：
- 如果未保存，原因：
- 后续建议：
```
