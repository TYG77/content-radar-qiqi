---
name: qiqi-auto-skill-capture
description: Use this skill automatically at the end of coding, product planning, debugging, diagnosis, PRD, or QA tasks to decide whether any repeated workflow should be captured as a reusable Skill, update the skill registry, and optionally create low-risk documentation-only Skills.
---

# qiqi-auto-skill-capture

## 目标

每次任务结束后自动判断是否有流程值得沉淀成 Skill，并在低风险情况下自动保存。

## 使用时机

每次完成以下任务后自动使用：

- 代码修改
- AI 链路诊断
- 产品流程梳理
- PRD 拆解
- QA 验收
- Codex/Cursor 协作流程优化
- 重复出现的提示词流程

## 执行步骤

1. 回顾本次任务。
2. 判断是否有重复流程。
3. 判断是否符合 Skill 化标准。
4. 判断风险等级 A/B/C。
5. 如果 A 档，自动创建或更新 Skill。
6. 如果 B 档，创建诊断型 Skill 或登记待确认。
7. 如果 C 档，只登记，不自动创建执行型 Skill。
8. 更新 `docs/skill-registry.md`。
9. 在最终回复中输出 Skill 化复盘。

## 输出格式

Skill 化复盘：
- 可复用流程：
- 建议 Skill：
- 风险等级：
- 是否已自动保存：
- 保存路径：
- 未保存原因：
- 下一步建议：

## 自动保存边界

允许自动保存：

- 文档型 Skill
- 诊断型 Skill
- PRD 模板 Skill
- QA 验收 Skill
- 产品流程 Skill

禁止自动保存：

- 会直接改业务代码的执行型 Skill
- 会调用 API 的 Skill
- 会读取或修改 `.env.local` 的 Skill
- 会接真实数据源、飞书、公众号后台的 Skill
- 会涉及部署、权限、数据库、计费的 Skill

## 禁止事项

不要：

1. 修改业务代码。
2. 读取、展示或修改 `.env.local`。
3. 暴露 API Key。
4. 自动创建会调用外部服务或修改代码的高风险 Skill。
5. 一次创建超过 2 个 Skill。
6. 把所有流程塞进一个大 Skill。
