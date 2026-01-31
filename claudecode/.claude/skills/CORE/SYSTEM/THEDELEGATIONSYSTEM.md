---
name: DelegationReference
description: Comprehensive delegation and agent parallelization patterns. Reference material extracted from SKILL.md for on-demand loading.
created: 2025-12-17
extracted_from: SKILL.md lines 535-627
---

# Delegation & Parallelization Reference

**Quick reference in SKILL.md** → For full details, see this file

---

## 🤝 Delegation & Parallelization (Always Active)

**WHENEVER A TASK CAN BE PARALLELIZED, USE MULTIPLE AGENTS!**

### Model Selection for Agents (CRITICAL FOR SPEED)

**The Task tool has a `model` parameter - USE IT.**

Agents default to inheriting the parent model (often Opus). This is SLOW for simple tasks. Each inference with 30K+ context takes 5-15 seconds on Opus. A simple 10-tool-call task = 1-2+ minutes of pure thinking time.

**Model Selection Matrix:**

| Task Type | Model | Why |
|-----------|-------|-----|
| Deep reasoning, complex architecture, strategic decisions | `opus` | Maximum intelligence needed |
| Standard implementation, moderate complexity, most coding | `sonnet` | Good balance of speed + capability |
| Simple lookups, file reads, quick checks, parallel grunt work | `haiku` | 10-20x faster, sufficient intelligence |

**Examples:**

```typescript
// WRONG - defaults to Opus, takes minutes
Task({ prompt: "Check if blue bar exists on website", subagent_type: "Intern" })

// RIGHT - Haiku for simple visual check
Task({ prompt: "Check if blue bar exists on website", subagent_type: "Intern", model: "haiku" })

// RIGHT - Sonnet for standard coding task
Task({ prompt: "Implement the login form validation", subagent_type: "Engineer", model: "sonnet" })

// RIGHT - Opus for complex architectural planning
Task({ prompt: "Design the distributed caching strategy", subagent_type: "Architect", model: "opus" })
```

**Rule of Thumb:**
- If it's grunt work or verification → `haiku`
- If it's implementation or research → `sonnet`
- If it requires deep strategic thinking → `opus` (or let it default)

**Parallel tasks especially benefit from haiku** - launching 5 haiku agents is faster AND cheaper than 1 Opus agent doing sequential work.

### Model Profiles (Cost/Quality Tradeoff)

Three named profiles for consistent model selection across agents:

| Profile | Planning | Execution | Verification | When to Use |
|---------|----------|-----------|--------------|-------------|
| **quality** | opus | opus | sonnet | Critical work, production deployments |
| **balanced** | opus | sonnet | sonnet | Default for most work |
| **budget** | sonnet | sonnet | haiku | Exploration, prototyping, high parallelism |

**Usage:** Set profile at algorithm start, agents inherit. Override per-agent if needed.

### Context Window Quality Thresholds

Context window usage directly affects output quality. Monitor and act on these thresholds:

| Context Usage | Quality Level | Action |
|---------------|---------------|--------|
| **0–30%** | **Peak** | Best work happens here. Tackle hard problems now. |
| **30–50%** | **Good** | Standard work quality. Plans should target this range. |
| **50–70%** | **Degrading** | Quality declining. Delegate remaining work to fresh subagents. |
| **70%+** | **Poor** | Stop. Spawn fresh subagent for any remaining work. |

**Auto-Delegation Rule:** When context exceeds 50%, remaining ISC criteria should be delegated to fresh subagents with their own 200K token windows. The orchestrator stays lean.

### Agent Types

The Intern Agent is your high-agency genius generalist - perfect for parallel execution:
- Updating multiple files simultaneously
- Researching multiple topics at once
- Testing multiple approaches in parallel
- Processing multiple items from a list

**How to launch:**
- Use a SINGLE message with MULTIPLE Task tool calls
- Each intern gets FULL CONTEXT and DETAILED INSTRUCTIONS
- Launch as many as needed (no artificial limit)
- **ALWAYS launch a spotcheck intern after parallel work completes**

**CRITICAL: Interns vs Engineers:**
- **INTERNS:** Research, analysis, investigation, file reading, testing, coordinating
- **ENGINEERS:** Writing ANY code (TypeScript, Python, etc.), building features, implementing changes
- If task involves writing code → Use Development Skill with Engineer Agents
- Interns can delegate to engineers when code changes are needed

### 🚨 CUSTOM AGENTS vs GENERIC AGENTS (Always Active)

**The word "custom" is the KEY trigger:**

| User Says | What to Use | Why |
|-------------|-------------|-----|
| "**custom agents**", "spin up **custom** agents" | **AgentFactory** | Unique prompts, unique voices |
| "spin up agents", "bunch of agents", "launch agents" | **Intern agents** | Generic parallel workers |
| "interns", "use interns" | **Intern agents** | Obviously |

**When user says "custom agents":**
1. Invoke the Agents skill → CreateCustomAgent workflow
2. Use DIFFERENT trait combinations to get unique voices
3. Launch with the full AgentFactory-generated prompt
4. Each agent gets a personality-matched ElevenLabs voice

**When user says "spin up agents" (no "custom"):**
1. Invoke the Agents skill → SpawnParallelAgents workflow
2. All get the same Dev Patel voice (fine for grunt work)
3. No AgentFactory needed

**Reference:** Agents skill (`~/.claude/skills/Agents/SKILL.md`)

**Full Context Requirements:**
When delegating, ALWAYS include:
1. WHY this task matters (business context)
2. WHAT the current state is (existing implementation)
3. EXACTLY what to do (precise actions, file paths, patterns)
4. SUCCESS CRITERIA (what output should look like)

### ⚠️ CRITICAL: Inline Context Pattern

**`@path/to/file.md` references do NOT work across `Task()` boundaries.**

Subagents spawned via the Task tool cannot see `@`-references from the parent context. All necessary context must be **inlined into the subagent prompt**.

**WRONG:**
```typescript
Task({
  prompt: "Implement the feature described in @docs/spec.md",
  subagent_type: "Engineer"
})
// Subagent cannot read @docs/spec.md — it sees literal text "@docs/spec.md"
```

**RIGHT:**
```typescript
const spec = await read("docs/spec.md");
Task({
  prompt: `Implement this feature:

${spec}

Create the component in src/components/Feature.tsx`,
  subagent_type: "Engineer"
})
// Subagent receives the actual content
```

**What to inline:**
- ISC criteria the subagent is working on
- Relevant file contents (read first, paste into prompt)
- Configuration values (don't reference, include them)
- Success criteria (explicit in the prompt)

**This is why orchestrators stay lean** — they read context, inline it into subagent prompts, and delegate. Heavy work happens in fresh subagent contexts.

---

**See Also:**
- SKILL.md > Delegation (Quick Reference) - Condensed trigger table
- Workflows/Delegation.md - Operational delegation procedures
- Workflows/BackgroundDelegation.md - Background agent patterns
- skills/Agents/SKILL.md - Custom agent creation system
