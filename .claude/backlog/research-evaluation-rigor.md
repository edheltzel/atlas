# Research & Evaluation Rigor

**Category:** skills / agents
**Captured:** 2026-01-17

## Description

Improve Atlas's research agents and evaluation workflows to eliminate assumptions and increase transparency. When given vague directives like "evaluate this codebase," Atlas should prompt for clarity rather than making assumptions that lead to mistakes.

## Current Problem

- Vague requests lead to blind evaluation with unstated assumptions
- No documentation of why certain paths were skipped
- Decision criteria not captured or explained
- User doesn't know what Atlas assumed vs. what was explicit
- Mistakes happen when assumptions don't match user intent

## Desired Behavior

### 1. Clarification Before Action
When given evaluation/research tasks, prompt for:
- What specifically should be evaluated? (architecture, code quality, security, performance, etc.)
- What's the success criteria?
- What scope? (entire repo, specific directories, specific concerns)
- What's the output format needed?

### 2. Assumption Transparency
- Document every assumption made
- Flag when something is being skipped and why
- Distinguish between "evaluated and found fine" vs "not evaluated"

### 3. Decision Audit Trail
- Capture criteria used for each decision
- Explain reasoning, not just conclusions
- Reference specific evidence (file:line, documentation, etc.)

### 4. Skip Documentation
When skipping something, document:
- What was skipped
- Why it was skipped (out of scope, not relevant, blocked, etc.)
- Whether it should be revisited

## Implementation Areas

- Explore agent (Task tool with subagent_type=Explore)
- Research workflows in Algorithm skill
- Any evaluation-focused skills or commands
- Agent prompts and system instructions

## Origin

Pattern of evaluations that miss important context because Atlas assumed scope or criteria instead of asking. Leads to rework and missed insights.

## Open Questions

- How to balance thoroughness with not over-prompting the user?
- Should there be "quick eval" vs "thorough eval" modes?
- How to persist evaluation context across sessions?
- Should evaluation reports have a standard format?

## Related Ideas

- (none yet)
