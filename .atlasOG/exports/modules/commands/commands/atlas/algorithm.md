---
description: "Launch THE ALGORITHM for structured task execution. Usage: /atlas:algorithm [show|start|phase] [args]"
---

# THE ALGORITHM

Universal execution engine using scientific method to achieve ideal state.

## Usage

- `/atlas:algorithm show` - Display current algorithm state and ISC
- `/atlas:algorithm start LEVEL` - Start algorithm at effort level (TRIVIAL, QUICK, STANDARD, THOROUGH, DETERMINED)
- `/atlas:algorithm phase PHASE` - Transition to a phase (OBSERVE, THINK, PLAN, BUILD, EXECUTE, VERIFY, LEARN)

## Tool Commands

```bash
# Display current state
bun run ~/.claude/skills/Algorithm/Tools/AlgorithmDisplay.ts show

# Start algorithm
bun run ~/.claude/skills/Algorithm/Tools/AlgorithmDisplay.ts start STANDARD -r "your request"

# Classify effort
bun run ~/.claude/skills/Algorithm/Tools/EffortClassifier.ts --request "your request"

# Manage ISC
bun run ~/.claude/skills/Algorithm/Tools/ISCManager.ts create --request "your request"
bun run ~/.claude/skills/Algorithm/Tools/ISCManager.ts add -d "Requirement description" -s EXPLICIT
bun run ~/.claude/skills/Algorithm/Tools/ISCManager.ts show
```

When invoked, use the Skill tool to invoke "Algorithm" with the user's task: $ARGUMENTS
