# Conventional Commits Strategy

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description | Semver |
|------|-------------|--------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | - |
| `style` | Formatting, no code change | - |
| `refactor` | Code change, no feature/fix | - |
| `perf` | Performance improvement | PATCH |
| `test` | Adding/fixing tests | - |
| `build` | Build system changes | - |
| `ci` | CI configuration | - |
| `chore` | Maintenance tasks | - |
| `revert` | Revert previous commit | - |

## Breaking Changes

Two ways to indicate:

1. **Bang notation:** `feat!: remove deprecated API`
2. **Footer:**
   ```
   feat: restructure auth module

   BREAKING CHANGE: Auth tokens now expire after 24h instead of 7d
   ```

## Scope Detection

Detect from file paths:

| Path Pattern | Scope |
|--------------|-------|
| `src/auth/*` | auth |
| `src/api/*` | api |
| `src/ui/*`, `src/components/*` | ui |
| `src/db/*`, `**/models/*` | db |
| `config/*`, `*.config.*` | config |
| `tests/*`, `__tests__/*` | test |
| `docs/*`, `*.md` | docs |

## Examples

```
feat(auth): add OAuth2 provider support

fix(api): handle null response from payment gateway

docs: update README with new installation steps

refactor(db): extract query builder to separate module

feat!: drop support for Node 16

chore: update dependencies to latest versions
```

## Validation Rules

1. Type must be lowercase
2. Scope is optional but recommended
3. Description starts with lowercase
4. Description uses imperative mood ("add" not "added")
5. No period at end of description
6. Body wrapped at 72 characters
7. Footer uses `token: value` format
