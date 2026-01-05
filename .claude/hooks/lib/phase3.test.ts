/**
 * Phase 3 Tests: Code Consolidation
 * Tests for shared-voice module and hook refactoring
 */

import { describe, test, expect } from 'bun:test';
import {
  NotificationPayload,
  HookInput,
  readStdinWithTimeout,
  parseHookInput,
  sendNotification,
  contentToText,
  stripSystemReminders,
  getLastAssistantMessage,
  findTaskResult,
  getAgentDisplayName,
} from './shared-voice';

// =============================================================================
// Unit Tests: Shared Types
// =============================================================================

describe('Shared Types', () => {
  test('NotificationPayload interface is exported', () => {
    const payload: NotificationPayload = {
      title: 'Test',
      message: 'Test message',
      voice_enabled: true,
    };
    expect(payload.title).toBe('Test');
    expect(payload.message).toBe('Test message');
    expect(payload.voice_enabled).toBe(true);
  });

  test('NotificationPayload supports optional fields', () => {
    const payload: NotificationPayload = {
      title: 'Test',
      message: 'Test message',
      voice_enabled: true,
      priority: 'high',
      voice_id: 'test-voice-id',
    };
    expect(payload.priority).toBe('high');
    expect(payload.voice_id).toBe('test-voice-id');
  });

  test('HookInput interface is exported', () => {
    const input: HookInput = {
      session_id: 'test-session',
      transcript_path: '/tmp/transcript.jsonl',
      hook_event_name: 'Stop',
    };
    expect(input.session_id).toBe('test-session');
  });
});

// =============================================================================
// Unit Tests: Agent Display Names
// =============================================================================

describe('Agent Display Names', () => {
  test('maps explore to Scout', () => {
    expect(getAgentDisplayName('explore')).toBe('Scout');
  });

  test('maps plan to Strategist', () => {
    expect(getAgentDisplayName('plan')).toBe('Strategist');
  });

  test('maps general-purpose to Atlas', () => {
    expect(getAgentDisplayName('general-purpose')).toBe('Atlas');
  });

  test('maps claude-code-guide to Mentor', () => {
    expect(getAgentDisplayName('claude-code-guide')).toBe('Mentor');
  });

  test('maps designer to Apollo', () => {
    expect(getAgentDisplayName('designer')).toBe('Apollo');
  });

  test('maps pentester to Sphinx', () => {
    expect(getAgentDisplayName('pentester')).toBe('Sphinx');
  });

  test('handles case insensitivity', () => {
    expect(getAgentDisplayName('EXPLORE')).toBe('Scout');
    expect(getAgentDisplayName('Plan')).toBe('Strategist');
  });

  test('capitalizes unknown agent types', () => {
    expect(getAgentDisplayName('unknown')).toBe('Unknown');
    expect(getAgentDisplayName('custom-agent')).toBe('Custom-agent');
  });
});

// =============================================================================
// Unit Tests: Text Processing
// =============================================================================

describe('Text Processing', () => {
  test('contentToText handles string input', () => {
    expect(contentToText('hello')).toBe('hello');
  });

  test('contentToText handles array of strings', () => {
    expect(contentToText(['hello', 'world'])).toBe('hello world');
  });

  test('contentToText handles array of objects with text property', () => {
    const content = [{ text: 'hello' }, { text: 'world' }];
    expect(contentToText(content)).toBe('hello world');
  });

  test('contentToText handles nested content', () => {
    const content = [{ content: [{ text: 'nested' }] }];
    expect(contentToText(content)).toBe('nested');
  });

  test('contentToText returns empty string for non-string/non-array', () => {
    expect(contentToText(123)).toBe('');
    expect(contentToText(null)).toBe('');
    expect(contentToText(undefined)).toBe('');
  });

  test('stripSystemReminders removes system-reminder tags', () => {
    const text = 'Hello <system-reminder>hidden content</system-reminder> world';
    expect(stripSystemReminders(text)).toBe('Hello  world');
  });

  test('stripSystemReminders handles multiple tags', () => {
    const text = '<system-reminder>a</system-reminder>keep<system-reminder>b</system-reminder>';
    expect(stripSystemReminders(text)).toBe('keep');
  });

  test('stripSystemReminders handles multiline tags', () => {
    const text = 'start<system-reminder>\nmultiline\ncontent\n</system-reminder>end';
    expect(stripSystemReminders(text)).toBe('startend');
  });
});

// =============================================================================
// Unit Tests: Hook Input Parsing
// =============================================================================

describe('Hook Input Parsing', () => {
  test('parseHookInput parses valid JSON', () => {
    const input = JSON.stringify({
      session_id: 'test',
      transcript_path: '/tmp/test.jsonl',
      hook_event_name: 'Stop',
    });
    const result = parseHookInput(input);
    expect(result).not.toBeNull();
    expect(result?.session_id).toBe('test');
  });

  test('parseHookInput returns null for empty input', () => {
    expect(parseHookInput('')).toBeNull();
    expect(parseHookInput('   ')).toBeNull();
  });

  test('parseHookInput returns null for invalid JSON', () => {
    expect(parseHookInput('not json')).toBeNull();
    expect(parseHookInput('{invalid}')).toBeNull();
  });
});

// =============================================================================
// Unit Tests: Hooks Use Shared Module
// =============================================================================

describe('Hooks Use Shared Module', () => {
  test('stop-hook-voice imports from shared-voice', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/stop-hook-voice.ts`
    ).text();

    expect(hook).toContain("from './lib/shared-voice'");
    expect(hook).toContain('readStdinWithTimeout');
    expect(hook).toContain('parseHookInput');
    expect(hook).toContain('sendNotification');
    expect(hook).toContain('getLastAssistantMessage');
  });

  test('subagent-stop-hook-voice imports from shared-voice', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/subagent-stop-hook-voice.ts`
    ).text();

    expect(hook).toContain("from './lib/shared-voice'");
    expect(hook).toContain('readStdinWithTimeout');
    expect(hook).toContain('parseHookInput');
    expect(hook).toContain('sendNotification');
    expect(hook).toContain('findTaskResult');
    expect(hook).toContain('getAgentDisplayName');
  });

  test('stop-hook-voice does not duplicate shared code', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/stop-hook-voice.ts`
    ).text();

    // Should not have local implementations of shared functions
    expect(hook).not.toContain('function sendNotification(');
    expect(hook).not.toContain('function contentToText(');
    expect(hook).not.toContain('function getLastAssistantMessage(');
  });

  test('subagent-stop-hook-voice does not duplicate shared code', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/subagent-stop-hook-voice.ts`
    ).text();

    // Should not have local implementations of shared functions
    expect(hook).not.toContain('function sendNotification(');
    expect(hook).not.toContain('const AGENT_DISPLAY_NAMES');
    expect(hook).not.toContain('function getAgentDisplayName(');
  });
});

// =============================================================================
// Unit Tests: Code Size Reduction
// =============================================================================

describe('Code Size Reduction', () => {
  test('stop-hook-voice is under 100 lines', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/stop-hook-voice.ts`
    ).text();

    const lines = hook.split('\n').length;
    expect(lines).toBeLessThan(100);
  });

  test('subagent-stop-hook-voice is under 140 lines', async () => {
    const hook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/subagent-stop-hook-voice.ts`
    ).text();

    const lines = hook.split('\n').length;
    expect(lines).toBeLessThan(140);
  });

  test('shared-voice module is under 350 lines', async () => {
    const shared = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    const lines = shared.split('\n').length;
    expect(lines).toBeLessThan(350);
  });
});

// =============================================================================
// Unit Tests: O(n) Optimization
// =============================================================================

describe('O(n) Transcript Parsing', () => {
  test('getLastAssistantMessage reads backward from end', async () => {
    const shared = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    // Verify O(n) optimization: reading backward
    expect(shared).toContain('for (let i = lines.length - 1; i >= 0; i--)');
  });

  test('findTaskResult searches backward for Task tool_use', async () => {
    const shared = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    // Verify O(n) optimization: reading backward for tool_use
    expect(shared).toContain('for (let i = lines.length - 1; i >= 0; i--)');
  });

  test('findTaskResult only searches forward after finding tool_use', async () => {
    const shared = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    // Verify forward search only after tool_use is found
    expect(shared).toContain('for (let j = lastTaskIndex + 1; j < lines.length; j++)');
  });
});

// =============================================================================
// Integration Tests: Shared Module Exports
// =============================================================================

describe('Shared Module Exports', () => {
  test('all required functions are exported', () => {
    expect(typeof readStdinWithTimeout).toBe('function');
    expect(typeof parseHookInput).toBe('function');
    expect(typeof sendNotification).toBe('function');
    expect(typeof contentToText).toBe('function');
    expect(typeof stripSystemReminders).toBe('function');
    expect(typeof getLastAssistantMessage).toBe('function');
    expect(typeof findTaskResult).toBe('function');
    expect(typeof getAgentDisplayName).toBe('function');
  });
});
