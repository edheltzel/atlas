# Voice Feedback: Add AWAITING Pattern + Consistent Usage

## Summary

1. Add `🔔 AWAITING:` pattern to stop-hook-voice.ts
2. Add voice pattern usage instructions to CORE skill so I use them consistently

## Voice Patterns

| Pattern | When to Use | Voice Output |
|---------|-------------|--------------|
| `🎯 COMPLETED: {message}` | Task finished, command succeeded | "The task is completed, Ed. {message}" |
| `🔔 AWAITING: {message}` | Need input, approval, or direction | "{message}, need your direction, Ed" |
| *(no pattern)* | Informational responses, exploration | *(silent)* |

## Files to Modify

1. `/Users/ed/.claude/hooks/stop-hook-voice.ts` - Add AWAITING pattern
2. `/Users/ed/.claude/skills/CORE/SKILL.md` - Add voice pattern usage instructions

## Changes

### 1. Add AWAITING pattern extraction (after line 48)

```typescript
function extractAwaiting(text: string): string | null {
  text = stripSystemReminders(text);

  const patterns = [
    /🔔\s*\*{0,2}AWAITING:?\*{0,2}\s*(.+?)(?:\n|$)/i,
    /\*{0,2}AWAITING:?\*{0,2}\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let awaiting = match[1].trim();
      awaiting = cleanForSpeech(awaiting);
      return awaiting;
    }
  }

  return null;
}
```

### 2. Update main() to check for AWAITING (around line 58-74)

```typescript
// Check for completion first
let completion = extractCompletion(lastMessage, agentType);
let awaiting = null;

if (!completion) {
  awaiting = extractAwaiting(lastMessage);
}

// Only speak when there's an explicit pattern
if (!completion && !awaiting) {
  process.exit(0);
}

// Build spoken message
let spokenMessage: string;
if (completion) {
  spokenMessage = `The task is completed, Ed. ${completion}`;
} else {
  spokenMessage = `${awaiting}, need your direction, Ed`;
}
```

## Example Usage

**Me:**
```
I found 3 approaches for implementing this feature:
1. Use existing auth middleware
2. Create new JWT handler
3. Integrate with OAuth provider

🔔 AWAITING: Which approach should I take
```

**Voice says:** "Which approach should I take, need your direction, Ed"

---

## Change 2: CORE Skill - Voice Pattern Instructions

Add after the "Response Format" section in `/Users/ed/.claude/skills/CORE/SKILL.md`:

```markdown
---

## Voice Feedback Patterns

Include these patterns at the END of responses to trigger voice feedback:

### 🎯 COMPLETED: {message}
Use when a task is finished. Voice says: "The task is completed, Ed. {message}"

**Use for:**
- Command ran successfully
- File edit completed
- Build/test passed
- Any actionable task finished

**Example:**
```
I've updated the config and restarted the server.

🎯 COMPLETED: Server restarted with new configuration
```

### 🔔 AWAITING: {message}
Use when you need Ed's input. Voice says: "{message}, need your direction, Ed"

**Use for:**
- Multiple options to choose from
- Need approval before proceeding
- Clarification needed
- Ready to execute but want confirmation

**Example:**
```
I found 3 ways to implement this. Option A is simplest, B is most flexible.

🔔 AWAITING: Which approach should I take
```

### No Pattern (Silent)
Don't include patterns for informational responses, exploration, or when continuing work.
```

---

## Testing

1. Verify COMPLETED still works
2. Test AWAITING triggers voice
3. Test that having neither pattern stays silent
4. Test COMPLETED takes priority if both present
5. Start new session and verify CORE skill loads with new instructions
