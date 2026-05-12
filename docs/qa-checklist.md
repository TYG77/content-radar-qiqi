# QA Checklist

Use this checklist after every code execution.

## Required Commands

1. Run `npm.cmd run lint`.
2. Run `npm.cmd run build`.
3. If either command fails, report the failure and stop. Do not expand scope.

## Safety Checks

Confirm:

1. `.env.local` was not read, displayed, or modified.
2. No API Key or secret was added to frontend code.
3. DeepSeek/OpenAI provider switching still exists unless the user explicitly approved changing it.
4. No new dependency was added unless approved through PRD.
5. No mock/fallback/cache content is presented as real platform data.
6. No raw JSON, payload, stack trace, or internal code is shown to end users.

## Functional Checks

For UI or AI-chain changes, verify the relevant page path and state:

1. Loading state is visible when a request is running.
2. Success state only appears when real displayable content exists.
3. Empty or too-short content shows a clear retry message.
4. Error state does not expose raw provider payloads or stack traces.
5. Cached/fallback content does not hide the real API failure in diagnostics.
6. Buttons that trigger long-running generation are disabled while running.
7. Page title hierarchy matches the selected user intent, not only a generic function label.

## AI Chain Checks

For AI generation work, verify:

1. Correct provider is selected from configuration.
2. DeepSeek and OpenAI paths remain switchable.
3. Endpoint and model are not hardcoded into UI.
4. Structured output parsing rejects invalid or too-short content.
5. `finish_reason === "length"` or equivalent truncation is treated as failure.
6. Generated content is saved to the same state that the page renders.
7. Fallback content is marked as fallback and does not masquerade as real API success.

## Final Response Requirements

Every execution summary must include:

1. Changed files.
2. What was fixed.
3. `npm.cmd run lint` result.
4. `npm.cmd run build` result.
5. Manual acceptance page path and what to check.
