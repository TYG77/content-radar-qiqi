# Codex Autopilot Rules

These rules define when Codex/Cursor can act automatically and when it must stop for diagnosis or PRD.

## Default Classification

Classify every request before editing:

- Use A 档 when the request is narrow, local, reversible, and does not touch sensitive systems.
- Use B 档 when the failure chain is uncertain and diagnosis is needed before repair.
- Use C 档 when the request changes product scope, data sources, external integrations, security, deployment, billing, or architecture.

If uncertain between A and B, choose B.
If uncertain between B and C, choose C.

## A 档 Execution Protocol

For A 档 tasks:

1. Give a concise plan.
2. Modify only the required files.
3. Do not add dependencies unless the user explicitly approved a C 档 PRD.
4. Do not read `.env.local`.
5. Preserve DeepSeek/OpenAI provider switching.
6. For code changes, run:
   - `npm.cmd run lint`
   - `npm.cmd run build`
7. Final response must include changed files, fix summary, verification result, manual acceptance paths, and Skill 化复盘.

## B 档 Diagnosis Protocol

For B 档 tasks:

1. Stay read-only.
2. Inspect only relevant source files, logs, and safe docs.
3. Do not inspect `.env.local`.
4. Map the chain: API route, provider client, task prompt, schema/parser, state write, render read, cache/fallback.
5. Output:
   - Problem cause
   - Evidence from files
   - Smallest repair plan
   - Risks or unknowns
6. Wait for user confirmation before code changes.

## C 档 PRD Protocol

For C 档 tasks, write a PRD before implementation:

1. Objective and non-goals.
2. User flow.
3. Scope and file/module impact.
4. Data model/API changes.
5. Provider, dependency, security, and permission impact.
6. Rollout plan.
7. QA checklist.
8. Open questions.

Do not implement until the user confirms the PRD.

## Safety Rules

Never:

1. Read, print, summarize, or modify `.env.local`.
2. Expose API Keys or secrets.
3. Move API Keys to frontend code.
4. Claim real platform signals without a verified source chain.
5. Remove provider switching without explicit confirmation.
6. Broaden scope because a nearby issue was found.
7. Hide failures behind UI copy, mock data, fallback data, or cache.

## Skill 自动保存规则

A 档：允许自动保存

- PRD 模板
- QA 验收清单
- 产品流程梳理
- 诊断提示词模板
- 不修改业务代码的文档型 Skill
- 不读取 `.env.local`
- 不新增依赖
- 不碰 API Key / Provider / 数据源 / 部署

B 档：允许保存为诊断 Skill，但不能自动执行代码

- AI 链路诊断
- Provider 检查
- schema/parse/state/render 检查
- 缓存/fallback/mock 检查
- Runtime Error 诊断

C 档：只登记，不自动创建执行型 Skill

- 真实热点来源
- 飞书/公众号后台
- API Key 管理
- 用户系统/计费系统
- 数据库/部署/权限
- 会自动调用外部服务的 Skill
- 一次超过 5 个功能点的流程

## Final Report Template

Use this shape after execution:

```text
Changed files:
- path

What changed:
- concise fix summary

Verification:
- npm.cmd run lint: passed/failed/not run
- npm.cmd run build: passed/failed/not run

Manual acceptance:
- page/path and what to check

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
