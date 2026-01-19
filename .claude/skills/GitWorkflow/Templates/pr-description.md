# PR Description Template

## Variables

- `{{summary}}` - AI-generated summary from commit analysis
- `{{project_context}}` - TELOS project context (if available)
- `{{changes}}` - Grouped list of changes by type
- `{{breaking_changes}}` - Breaking changes with migration notes
- `{{test_plan}}` - Generated test plan from changed files
- `{{related_issues}}` - Detected issue references from commits
- `{{stats}}` - Commit count, files changed, insertions/deletions

---

## Template

```markdown
## Summary

{{summary}}

{{#if project_context}}
**Project:** {{project_context}}
{{/if}}

## Changes

{{changes}}

{{#if breaking_changes}}
## Breaking Changes

{{breaking_changes}}

### Migration Guide

[Describe how to migrate from previous behavior]
{{/if}}

## Test Plan

{{test_plan}}

{{#if related_issues}}
## Related

{{related_issues}}
{{/if}}

---

{{stats}}

Generated with [Atlas](https://github.com/edwinhern/atlas)
```

---

## Example Output

```markdown
## Summary

Adds OAuth2 authentication support with Google and GitHub providers, replacing the legacy session-based auth system.

**Project:** MyChron - user authentication milestone

## Changes

### Features
- Add OAuth2 provider abstraction layer
- Implement Google OAuth2 provider
- Implement GitHub OAuth2 provider
- Add token refresh mechanism

### Fixes
- Fix session cleanup on logout

### Refactors
- Extract auth middleware to separate module

## Breaking Changes

- `AuthSession` interface replaced with `AuthToken`
- `/api/login` endpoint removed, use `/api/oauth/[provider]` instead

### Migration Guide

1. Update client to use new OAuth endpoints
2. Replace `session.userId` with `token.sub`
3. Update logout to call `/api/oauth/logout`

## Test Plan

- [ ] Google OAuth flow (login, callback, token refresh)
- [ ] GitHub OAuth flow (login, callback, token refresh)
- [ ] Token expiration handling
- [ ] Logout clears all tokens
- [ ] Unauthorized access returns 401
- [ ] Invalid provider returns 400

## Related

- Closes #123
- Closes #124
- Related to #100

---

5 commits | 12 files changed | +340 -89

Generated with [Atlas](https://github.com/edwinhern/atlas)
```
